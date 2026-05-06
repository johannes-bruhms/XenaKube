// Register tsx so we can require TypeScript modules directly
require('tsx/cjs');

const { Client, Server: OscServer } = require('node-osc');
const WebSocket = require('ws');
const http = require('http');
const fs = require('fs');
const path = require('path');
const {
  XenaKubeEngine,
  PhrasePlanner,
  PhraseEchoAuditor,
  stateToOsc,
  expressionToOsc,
  algorithmToOsc,
  voiceToOsc,
  phrasePlanSummary,
  phraseAuditSummary,
  solveToOsc,
  getBuiltinDiagrams,
  OSC,
  MIDI_ECHO_PORT,
} = require('./src/index.ts');

/*
   GAN Cube Live Performance Bridge - macOS FIXED (v2)
   Uses official customMacAddressProvider (no spoofing needed)
   Library now ignores device.id and uses this method
   Dashboard asks for the cube MAC at connect time; do not hardcode or persist it.
*/

// === Canonical-pose GAN→engine face-letter remap ===
//
// Assumes the performer holds the cube red-front, white-top at connect
// time. GAN's `gan-web-bluetooth` library reports moves in factory sticker
// frame (R = red, L = orange, U = white, D = yellow, F = green, B = blue),
// not in current-orientation frame — empirically confirmed by a 6-turn
// test in canonical pose. Without remap, the user's right-hand twist
// (which physically turns blue) arrives at the engine as `B`, the engine
// permutes the back-face vertex set, and the dashboard animates the wrong
// face. Rotating the labels 180° around U (R↔L, F↔B) realigns the chain so
// the engine, /xk/face OSC, dashboard, and algorithm-buffer HUD all speak
// the user-pose face geometry.
//
// MIRROR: `CANONICAL_REMAP` constants in `public/js/cube-scene.js` and
// `public/js/main.js` MUST track this table. Drift between any two
// is caught by `[CUBE REMAP FAIL]` (per-move) and `[CUBE ALIGN FAIL]`
// (geometric, on connect).
const MOVE_REMAP = { R: 'L', L: 'R', F: 'B', B: 'F', U: 'U', D: 'D' };

// === BLE Rate Measurement ===
let _bleGyroCount = 0, _bleMoveCount = 0, _bleT0 = Date.now();
let _bleMoveTotal = 0;
setInterval(() => {
  const dt = (Date.now() - _bleT0) / 1000;
  if (dt > 0 && _bleGyroCount > 0) {
    _bleMoveTotal += _bleMoveCount;
    console.log(`[RATE] BLE gyro: ${(_bleGyroCount/dt).toFixed(1)} Hz → output: ${(gyroOutputCount/dt).toFixed(1)} Hz | moves: ${_bleMoveTotal} total`);
  }
  _bleGyroCount = 0;
  _bleMoveCount = 0;
  gyroOutputCount = 0;
  _bleT0 = Date.now();
}, 5000);

// === XenaKube Engine ===
// Default stays beta-cosmo. Set XK_COSMO=alpha-cosmo to run the historical
// Nomos Alpha walk path without adding a dashboard mapping yet.
const START_COSMO = process.env.XK_COSMO === 'alpha-cosmo' ? 'alpha-cosmo' : 'beta-cosmo';
const engine = new XenaKubeEngine({ cosmology: START_COSMO });
const phrasePlanner = new PhrasePlanner();
const phraseAuditor = new PhraseEchoAuditor();
let latestEngineState = engine.getState();
console.log(`[COSMO] ${START_COSMO}`);

// === OSC Clients ===
const oscTD  = new Client('127.0.0.1', 8000);   // TouchDesigner — receives raw /gan/* + /xk/gyro
const oscMax = new Client('127.0.0.1', 57121);  // Max/MSP — receives /xk/* for SWAM Cello bridge

// Track last move for dashboard broadcast
let lastMove = null;
let lastMoveReceivedAt = 0;

// === Gyro Kalman Filter (upsample BLE ~10Hz → 60Hz with velocity prediction) ===
//
// Instead of SLERP-interpolating between samples (mechanical, no momentum),
// we maintain a state estimate { orientation, angular velocity } and:
//   PREDICT (60Hz): advance orientation by omega*dt, decay omega (friction)
//   UPDATE (~10Hz): correct orientation + velocity from BLE measurement
//
// The "organic" feel comes from the velocity state: the filter naturally
// continues your current rotation arc between samples, and decelerates
// when you stop — like a physical object with inertia.

// --- Quaternion math ---
function quatMul(a, b) {
  return {
    x: a.w*b.x + a.x*b.w + a.y*b.z - a.z*b.y,
    y: a.w*b.y - a.x*b.z + a.y*b.w + a.z*b.x,
    z: a.w*b.z + a.x*b.y - a.y*b.x + a.z*b.w,
    w: a.w*b.w - a.x*b.x - a.y*b.y - a.z*b.z,
  };
}
function quatConj(q) { return { x: -q.x, y: -q.y, z: -q.z, w: q.w }; }
// BLE → scene-frame axis remap, MUST mirror `setCubeQuat` in cube-scene.js
// (BLE qx → scene -qx, BLE qy → scene qz, BLE qz → scene qy). Without this
// the engine snaps a BLE-frame gyro against scene-frame S4 quaternions and
// returns wrong cells, which the dashboard then renders as a chaotic ghost.
function axisRemapToScene(q) {
  return { x: -q.x, y: q.z, z: q.y, w: q.w };
}
function quatNorm(q) {
  const len = Math.sqrt(q.x**2 + q.y**2 + q.z**2 + q.w**2);
  if (len < 1e-10) return { x: 0, y: 0, z: 0, w: 1 };
  return { x: q.x/len, y: q.y/len, z: q.z/len, w: q.w/len };
}
// Log map: unit quaternion → rotation vector (axis × angle)
function quatLog(q) {
  const qn = q.w < 0 ? { x: -q.x, y: -q.y, z: -q.z, w: -q.w } : q;
  const sinHalf = Math.sqrt(qn.x**2 + qn.y**2 + qn.z**2);
  if (sinHalf < 1e-8) return { x: 0, y: 0, z: 0 };
  const angle = 2 * Math.atan2(sinHalf, qn.w);
  const s = angle / sinHalf;
  return { x: qn.x * s, y: qn.y * s, z: qn.z * s };
}
// Exp map: rotation vector → unit quaternion
function quatExp(v) {
  const angle = Math.sqrt(v.x**2 + v.y**2 + v.z**2);
  if (angle < 1e-8) return { x: 0, y: 0, z: 0, w: 1 };
  const half = angle / 2;
  const s = Math.sin(half) / angle;
  return { x: v.x * s, y: v.y * s, z: v.z * s, w: Math.cos(half) };
}
// SLERP on unit quats via log/exp. `a` and `b` must be unit quaternions.
// Handles shortest-arc automatically (quatLog flips sign when w<0).
function quatSlerp(a, b, t) {
  const rel = quatMul(quatConj(a), b);
  const rv = quatLog(rel);
  const scaled = quatExp({ x: rv.x * t, y: rv.y * t, z: rv.z * t });
  return quatNorm(quatMul(a, scaled));
}

// --- Filter state ---
const kf = {
  q: { x: 0, y: 0, z: 0, w: 1 },   // estimated orientation
  omega: { x: 0, y: 0, z: 0 },       // estimated angular velocity (rad/s)
  prevMeas: null,                       // { q, t } previous BLE measurement
  initialized: false,
};

let gyroSmoothing = 0.50;  // 0 = responsive (near-zero lag), 1 = heavy smoothing
let gyroOutputCount = 0;
let lastOutputTime = Date.now();
const GYRO_OUTPUT_HZ = 60;

// Engine-input gyro calibration. When the dashboard zeros the gyro (auto-zero
// on first BLE sample, or the Zero Gyro button), it also sends a `zero_gyro`
// WS message that we handle by snapshotting `conj(kf.q)` here. Every
// `engine.onGyro(...)` then applies `engineGyroZeroInv * kf.q`, so the engine
// sees an identity-centered quaternion at the moment of zero.
//
// Why this matters: `snapToNearest` partitions quaternion space into 24
// fixed S4 cells. Without calibration the user's rest pose lands at an
// arbitrary point inside one cell, with boundaries at asymmetric angular
// distances — tilting the cube right might snap after 15° while tilting
// left requires 30°+. Calibrating re-centers the "identity" cell on the
// user's rest pose so small tilts in every direction reach cell edges at
// roughly the same angular distance. The visual `gyroZeroInv` on the
// dashboard keeps the live cube in the same frame; both sides now agree.
let engineGyroZeroInv = { x: 0, y: 0, z: 0, w: 1 };

// Noise gate on measured angular velocity. BLE quaternion readings have
// sample-to-sample noise even when the cube is perfectly still — the finite
// difference in kfUpdate reads this as small phantom omega, which the 60 Hz
// predict step then integrates into visible shimmer. This floor (rad/s)
// shrinks measured omega toward zero on static holds; real hand motion
// during turns is well above 1 rad/s so intentional rotation is preserved.
const OMEGA_NOISE_FLOOR = 0.25;

// === Visual SLERP buffer ===
// The Kalman predict step extrapolates motion for OSC (low-latency audio
// path). For dashboard visuals the user is fine trading ~100 ms of delay
// for zero extrapolation artefacts, so gyro_tick ships a separate quat
// that SLERPs between buffered BLE samples straddling (now - VISUAL_DELAY_MS).
// No phantom motion on static holds, no Kalman predict noise.
const VISUAL_DELAY_MS = 120;        // trailing latency for dashboard cube
const VISUAL_BUFFER_MS = 1500;      // keep samples at least this long
const visualSamples = [];           // [{ q, t }], oldest first

// === Turn -> first MIDI noteon latency probe ===
//
// Measures relay/Max bridge latency only: engine.onVoice timestamp to the
// first non-companion /xk/midi/noteon echo received back from Max. It does not
// measure SWAM's acoustic attack, Auto Poly Detect look-ahead, or slow CC 11
// attack ramps inside the plugin.
const LATENCY_WARN_MS = 150;
const LATENCY_FAIL_MS = 250;
const LATENCY_MISSING_MS = 3000;
const LATENCY_WINDOW = 64;
const pendingVoiceLatency = [];
const latencyByComplex = new Map();
const latestExprByVoice = new Map();
let latencySeq = 0;

function percentile(sorted, p) {
  if (sorted.length === 0) return 0;
  const idx = Math.min(sorted.length - 1, Math.max(0, Math.ceil(sorted.length * p) - 1));
  return sorted[idx];
}

function latencyStatsFor(complex) {
  let stats = latencyByComplex.get(complex);
  if (!stats) {
    stats = { samples: [], total: 0 };
    latencyByComplex.set(complex, stats);
  }
  return stats;
}

function summarizeLatency(complex, stats) {
  const sorted = stats.samples.slice().sort((a, b) => a - b);
  return `C${complex} n=${stats.total} p50=${percentile(sorted, 0.50)}ms p95=${percentile(sorted, 0.95)}ms max=${sorted[sorted.length - 1] || 0}ms`;
}

function startVoiceLatencyProbe(output, phrasePlans = []) {
  if (!output || !Array.isArray(output.active) || output.active.length === 0) return;
  const complexes = output.active.map((ev) => ev.complex | 0);
  const firstPlan = Array.isArray(phrasePlans) ? phrasePlans[0] : null;
  const expectedFirstNoteOnMs = firstPlan?.expected?.firstNoteOnMs ?? 0;
  pendingVoiceLatency.push({
    id: ++latencySeq,
    t0: Date.now(),
    moveT0: lastMoveReceivedAt || Date.now(),
    move: lastMove || '-',
    face: output.face || '-',
    mode: output.mode || 'unknown',
    expectedComplex: complexes[0],
    complexes,
    expectedFirstNoteOnMs,
    plannedNoteOnCount: firstPlan?.expected?.noteOnCount ?? null,
    plannedBendStepCount: firstPlan?.expected?.bendStepCount ?? null,
    plannedCompanionNoteOnCount: firstPlan?.expected?.companionNoteOnCount ?? null,
  });
  while (pendingVoiceLatency.length > 32) {
    const dropped = pendingVoiceLatency.shift();
    console.error(`[LATENCY FAIL] dropped stale pending voice id=${dropped.id} C${dropped.expectedComplex} planFirst=${dropped.expectedFirstNoteOnMs}ms without noteon echo`);
  }
}

function completeVoiceLatencyProbe(data) {
  if (!data || data.kind !== 'noteon' || data.isCompanion === true) return;
  expireVoiceLatencyProbes(Date.now());
  const pending = pendingVoiceLatency.shift();
  if (!pending) return;

  const dt = Date.now() - pending.t0;
  const moveDt = Date.now() - pending.moveT0;
  const planOverrunMs = Math.max(0, dt - (pending.expectedFirstNoteOnMs || 0));
  const complex = data.complex || pending.expectedComplex || 0;
  const expr = latestExprByVoice.get(data.voice);
  const exprText = expr ? `expr=${expr.val} exprAge=${Date.now() - expr.t}ms` : 'expr=unknown';
  const stats = latencyStatsFor(complex);
  stats.samples.push(dt);
  stats.total++;
  if (stats.samples.length > LATENCY_WINDOW) stats.samples.shift();

  const planText = `planFirst=${pending.expectedFirstNoteOnMs}ms planOverrun=${planOverrunMs}ms planNoteons=${pending.plannedNoteOnCount ?? '?'} planBends=${pending.plannedBendStepCount ?? '?'} planCompanions=${pending.plannedCompanionNoteOnCount ?? '?'}`;
  const base = `[LATENCY] voice->noteon ${dt}ms move->noteon ${moveDt}ms ${planText} move=${pending.move} C${complex} face=${pending.face} expected=C${pending.expectedComplex} mode=${pending.mode} ${exprText}`;
  if (dt >= LATENCY_FAIL_MS) {
    console.error(`[LATENCY FAIL] ${base} | ${summarizeLatency(complex, stats)}`);
  } else if (dt >= LATENCY_WARN_MS) {
    console.warn(`[LATENCY WARN] ${base} | ${summarizeLatency(complex, stats)}`);
  } else if (expr && expr.val > 0 && expr.val < 32) {
    console.warn(`[ONSET EXPR WARN] first noteon arrived quickly but CC11 is low: ${base} | ${summarizeLatency(complex, stats)}`);
  } else if (stats.total % 8 === 0) {
    console.log(`${base} | ${summarizeLatency(complex, stats)}`);
  }
}

function expireVoiceLatencyProbes(now) {
  while (pendingVoiceLatency.length > 0 && now - pendingVoiceLatency[0].t0 >= LATENCY_MISSING_MS) {
    const stale = pendingVoiceLatency.shift();
    console.error(`[LATENCY FAIL] no noteon echo within ${LATENCY_MISSING_MS}ms for voice id=${stale.id} move=${stale.move} C${stale.expectedComplex} face=${stale.face} mode=${stale.mode} planFirst=${stale.expectedFirstNoteOnMs}ms planNoteons=${stale.plannedNoteOnCount ?? '?'}`);
  }
}

setInterval(() => expireVoiceLatencyProbes(Date.now()), 1000);

function publishPhraseAuditResults(results) {
  if (!Array.isArray(results) || results.length === 0) return;
  for (const result of results) {
    const line = phraseAuditSummary(result);
    if (result.status === 'fail') {
      console.error(`[PHRASE ECHO FAIL] ${line}`);
    } else if (result.status === 'stolen') {
      console.log(`[PHRASE ECHO STOLEN] ${line}`);
    } else {
      console.log(`[PHRASE ECHO OK] ${line}`);
    }

    const payload = JSON.stringify({ type: 'phrase_audit', data: result });
    wss?.clients?.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) client.send(payload);
    });
  }
}

setInterval(() => {
  publishPhraseAuditResults(phraseAuditor.poll(Date.now()));
}, 250);

function pushVisualSample(q, t) {
  visualSamples.push({ q, t });
  const cutoff = t - VISUAL_BUFFER_MS;
  while (visualSamples.length > 2 && visualSamples[0].t < cutoff) {
    visualSamples.shift();
  }
}

function getVisualQuat(nowMs) {
  if (visualSamples.length === 0) return kf.q;
  if (visualSamples.length === 1) return visualSamples[0].q;
  const target = nowMs - VISUAL_DELAY_MS;
  // Bracket search: find i such that samples[i].t <= target < samples[i+1].t
  let i = visualSamples.length - 2;
  while (i > 0 && visualSamples[i].t > target) i--;
  const a = visualSamples[i];
  const b = visualSamples[i + 1];
  const span = b.t - a.t;
  let frac = span > 0 ? (target - a.t) / span : 1;
  if (frac < 0) frac = 0;
  else if (frac > 1) frac = 1;
  return quatSlerp(a.q, b.q, frac);
}

// Slider → Kalman gains.  smoothing=0 → trust sensor, smoothing=1 → trust model
function kfGains() {
  const s = gyroSmoothing;
  return {
    Kq:    1.0 - s * 0.85,   // orientation correction: 1.0 (snap) → 0.15 (gradual)
    Kv:    0.8 - s * 0.6,    // velocity adaptation:    0.8 (fast) → 0.2 (slow)
    decay: 2.0 + s * 8.0,    // omega damping:          2.0 (light) → 10.0 (heavy)
  };
}

// PREDICT: advance orientation by angular velocity, apply friction
function kfPredict(dt) {
  if (!kf.initialized) return;
  const { decay } = kfGains();

  const speed = Math.sqrt(kf.omega.x**2 + kf.omega.y**2 + kf.omega.z**2);
  if (speed > 1e-6) {
    const dq = quatExp({ x: kf.omega.x * dt, y: kf.omega.y * dt, z: kf.omega.z * dt });
    kf.q = quatNorm(quatMul(kf.q, dq));
  }

  const d = Math.exp(-decay * dt);
  kf.omega.x *= d;
  kf.omega.y *= d;
  kf.omega.z *= d;
}

// UPDATE: correct state from a new BLE measurement
function kfUpdate(q_meas) {
  if (!kf.initialized) {
    kf.q = q_meas;
    kf.omega = { x: 0, y: 0, z: 0 };
    kf.prevMeas = { q: q_meas, t: Date.now() };
    kf.initialized = true;
    return;
  }

  const now = Date.now();
  const { Kq, Kv } = kfGains();

  // Orientation correction: error = rotation from predicted → measured
  const errQ = quatMul(quatConj(kf.q), q_meas);
  const errVec = quatLog(errQ);
  kf.q = quatNorm(quatMul(kf.q, quatExp({
    x: errVec.x * Kq, y: errVec.y * Kq, z: errVec.z * Kq,
  })));

  // Velocity update: angular velocity from consecutive BLE measurements
  if (kf.prevMeas) {
    const dt = (now - kf.prevMeas.t) / 1000;
    if (dt > 0.001 && dt < 1.0) {
      const dMeas = quatMul(quatConj(kf.prevMeas.q), q_meas);
      const rv = quatLog(dMeas);
      let ox = rv.x / dt, oy = rv.y / dt, oz = rv.z / dt;
      // Soft noise gate: shrink omega by the floor, preserving direction.
      // speed < floor → omega zero; speed ≫ floor → near full magnitude.
      const speed = Math.sqrt(ox * ox + oy * oy + oz * oz);
      if (speed > 0) {
        const gate = Math.max(0, (speed - OMEGA_NOISE_FLOOR) / speed);
        ox *= gate; oy *= gate; oz *= gate;
      }
      kf.omega.x += Kv * (ox - kf.omega.x);
      kf.omega.y += Kv * (oy - kf.omega.y);
      kf.omega.z += Kv * (oz - kf.omega.z);
    }
  }

  kf.prevMeas = { q: q_meas, t: now };
}

// 60Hz output: high-resolution timer loop (setInterval drifts to ~40Hz on Windows)
const GYRO_INTERVAL_NS = BigInt(Math.round(1e9 / GYRO_OUTPUT_HZ));
let gyroNextTick = process.hrtime.bigint();
let gyroLoopRunning = true;

function gyroLoop() {
  if (!gyroLoopRunning) return;

  const now = process.hrtime.bigint();
  if (now >= gyroNextTick) {
    gyroNextTick += GYRO_INTERVAL_NS;
    // If we fell behind, don't try to catch up — just reset
    if (now - gyroNextTick > GYRO_INTERVAL_NS * 3n) {
      gyroNextTick = now + GYRO_INTERVAL_NS;
    }

    if (kf.initialized) {
      const nowMs = Date.now();
      const dt = Math.min((nowMs - lastOutputTime) / 1000, 0.05);
      lastOutputTime = nowMs;

      kfPredict(dt);

      oscTD.send(OSC.GAN_GYRO, kf.q.x, kf.q.y, kf.q.z, kf.q.w);
      oscMax.send(OSC.GYRO,    kf.q.x, kf.q.y, kf.q.z, kf.q.w);

      // Expression at 60Hz from Kalman-filtered quat
      const sceneQ = axisRemapToScene(kf.q);
      const expr = engine.getExpressionFor([sceneQ.x, sceneQ.y, sceneQ.z, sceneQ.w], nowMs);
      const exprMsgs = expressionToOsc(expr);
      for (const msg of exprMsgs) {
        oscMax.send(msg.address, ...msg.args);
      }

      // Lightweight 60Hz WS tick for dashboard visuals. Uses the SLERP
      // buffer (lagged by VISUAL_DELAY_MS), NOT kf.q — so the cube trails
      // BLE by ~120 ms but has zero extrapolation noise on static holds.
      // OSC paths above still use kf.q for low-latency audio mapping.
      if (wss && wss.clients.size > 0) {
        const vq = getVisualQuat(nowMs);
        const tick = JSON.stringify({
          type: 'gyro_tick',
          data: [vq.x, vq.y, vq.z, vq.w],
          dev: expr.deviation,
        });
        wss.clients.forEach((c) => {
          if (c.readyState === WebSocket.OPEN) c.send(tick);
        });
      }

      gyroOutputCount++;
    }
  }

  // Sleep ~1ms then check again (setTimeout(0) is ~1ms on Node)
  setTimeout(gyroLoop, 1);
}
gyroLoop();

// Forward engine state over OSC on every state change + broadcast to dashboard
engine.onState((state) => {
  latestEngineState = state;
  const msgs = stateToOsc(state);
  for (const msg of msgs) {
    oscMax.send(msg.address, ...msg.args);
  }

  // Augment state with v2 data (scrambleFactor is now in XenaKubeState)
  const v2State = {
    ...state,
    voiceMode: engine.voiceEngine.mode,
    performanceMode: engine.modeManager.getMode(),
    algorithmBuffer: engine.algorithmDetector.getBuffer(),
    algorithmPartials: engine.algorithmDetector.getPartialMatches().map(p => ({
      name: p.algorithm.name,
      matched: p.matched,
      total: p.algorithm.moves.length,
    })),
  };

  broadcastState(v2State, lastMove);
  lastMove = null;
});

// Broadcast cube algorithm events
engine.onAlgorithm((match) => {
  if (match.algorithm.name === 't-perm') {
    // Max's current t-perm reaction calls bang(), which resets bridge-side
    // phrase state. Keep the TS shadow phrase planner aligned with that reset.
    phrasePlanner.reset();
    publishPhraseAuditResults(phraseAuditor.reset('panic'));
  }

  // OSC algorithm message to Max
  const algMsg = algorithmToOsc(match);
  oscMax.send(algMsg.address, ...algMsg.args);

  const payload = JSON.stringify({
    type: 'algorithm',
    data: {
      name: match.algorithm.name,
      effect: match.algorithm.effect,
      moves: match.algorithm.moves,
      timestamp: match.timestamp,
    },
  });
  wss?.clients?.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  });
  console.log(`[ALGORITHM] ${match.algorithm.name} (${match.algorithm.moves.join(' ')})`);
});

// Broadcast cube-solved edge — fires once per unsolved→solved transition.
// Source of truth: the GAN cube's FACELETS report (read by the browser and
// relayed over WS as {type:'cube_solved'}). The browser owns edge detection.
// Distinct from /xk/scramble, which is BFS distance in S4 (24 elements).
engine.onSolve(() => {
  const msg = solveToOsc();
  oscMax.send(msg.address, ...msg.args);
  oscTD.send(msg.address, ...msg.args);

  const payload = JSON.stringify({ type: 'solve' });
  wss?.clients?.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  });
  console.log('[SOLVE] cube solved');
});

// Broadcast voice output — and emit /xk/voice over OSC *only here* so it
// fires on real voice transitions, not on every gyro packet (see D16).
engine.onVoice((output) => {
  const phrasePlans = phrasePlanner.planVoiceOutput(output, latestEngineState);
  publishPhraseAuditResults(phraseAuditor.startTurn(phrasePlans));
  startVoiceLatencyProbe(output, phrasePlans);
  const voiceMsgs = voiceToOsc(output, phrasePlans);
  for (const msg of voiceMsgs) {
    oscMax.send(msg.address, ...msg.args);
  }

  const payload = JSON.stringify({
    type: 'voice',
    data: output,
  });
  wss?.clients?.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  });

  const planPayload = JSON.stringify({
    type: 'phrase_plan',
    data: {
      plans: phrasePlans,
      summary: phrasePlans.map(phrasePlanSummary),
    },
  });
  wss?.clients?.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(planPayload);
    }
  });
});

/** Send /xk/panic to Max (used on WS disconnect). Bridges/synth flush state. */
function sendPanic() {
  try {
    oscMax.send(OSC.PANIC);
  } catch (e) { /* OSC may be closed; safe to ignore */ }
  publishPhraseAuditResults(phraseAuditor.reset('panic'));
}

// === MIDI echo listener (Phase E tier 2) ===
//
// The Max bridge mirrors every noteon/noteoff/panic it emits to the relay as
// OSC over UDP 57122. We forward each packet to all connected WS clients as
// `{ type: 'midi_echo', data: { kind, voice, pitch, velocity } }` so the
// dashboard can transcribe exactly what SWAM plays. Keyswitches are excluded
// on the Max side — only real score notes arrive here.
const midiEchoServer = new OscServer(MIDI_ECHO_PORT, '127.0.0.1', () => {
  console.log(`[MIDI-ECHO] listening on ${MIDI_ECHO_PORT}`);
});

midiEchoServer.on('message', (msg) => {
  // node-osc delivers [address, ...args]. Map to our WS schema.
  // Newer Max bridges append companion/plan metadata after `complex`; older
  // reloaded patches leave those atoms undefined, which resolves to 0 and
  // keeps dashboard rendering backwards-compatible during one reload window.
  const address = msg[0];
  let data = null;
  if (address === OSC.MIDI_NOTEON)        data = { kind: 'noteon',   voice: msg[1]|0, pitch: msg[2]|0, velocity: msg[3]|0, complex: msg[4]|0, isCompanion: (msg[5]|0) === 1, planId: msg[6]|0 };
  else if (address === OSC.MIDI_NOTEOFF)  data = { kind: 'noteoff',  voice: msg[1]|0, pitch: msg[2]|0, velocity: msg[3]|0, complex: msg[4]|0, planId: msg[6]|0 };
  else if (address === OSC.MIDI_PANIC)    data = { kind: 'panic' };
  else if (address === OSC.MIDI_BENDSTEP) data = { kind: 'bendstep', voice: msg[1]|0, fromPitch: msg[2]|0, toPitch: msg[3]|0, durMs: msg[4]|0, complex: msg[5]|0, planId: msg[6]|0 };  // D59
  else if (address === OSC.MIDI_EXPR)     data = { kind: 'expr',     voice: msg[1]|0, val: msg[2]|0, complex: msg[3]|0, planId: msg[4]|0 };
  else return;

  if (data.kind === 'expr') {
    latestExprByVoice.set(data.voice, { val: data.val, complex: data.complex, t: Date.now() });
  }
  completeVoiceLatencyProbe(data);
  if (data.kind === 'panic') {
    publishPhraseAuditResults(phraseAuditor.reset('panic'));
  } else {
    publishPhraseAuditResults(phraseAuditor.recordEcho({
      kind: data.kind,
      planId: data.planId,
      tMs: Date.now(),
      isCompanion: data.isCompanion === true,
    }));
  }

  const payload = JSON.stringify({ type: 'midi_echo', data });
  wss?.clients?.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) client.send(payload);
  });
});

/** Broadcast engine state to all connected WS clients */
function broadcastState(state, move) {
  const isGyro = move === null;
  const payload = JSON.stringify({
    type: isGyro ? 'gyro_state' : 'state',
    data: state,
    move: move || undefined,
  });
  wss?.clients?.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  });
}

// Static file serving from public/. The dashboard imports ES modules
// from `./js/...` and stylesheets from `./css/...`; native browser
// modules require those files to be served with correct MIME types
// (browsers refuse to load `text/html` as a module). Path-routed reads
// from disk on every request — no startup cache, so dev edits to any
// public/ file are picked up by a browser refresh without restarting
// the relay. Path traversal blocked via realpath-prefix check.
const PUBLIC_DIR = path.join(__dirname, 'public');
const DASHBOARD_PATH = path.join(PUBLIC_DIR, 'dashboard.html');
try {
  fs.accessSync(DASHBOARD_PATH);
} catch (e) {
  console.warn('Dashboard not found at', DASHBOARD_PATH);
}

const STATIC_MIME = {
  '.js':   'text/javascript; charset=utf-8',
  '.mjs':  'text/javascript; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg':  'image/svg+xml',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif':  'image/gif',
  '.ico':  'image/x-icon',
  '.webp': 'image/webp',
  '.txt':  'text/plain; charset=utf-8',
};

function serveDashboard(res) {
  fs.readFile(DASHBOARD_PATH, (err, data) => {
    if (err) {
      res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Dashboard read error: ' + err.message);
      return;
    }
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(data);
  });
}

function serveStatic(urlPath, res) {
  // Strip query / hash, normalise, drop leading slashes so path.join
  // can't escape PUBLIC_DIR via an absolute path.
  const clean = urlPath.split('?')[0].split('#')[0];
  const safe  = path.normalize(clean).replace(/^[\\/]+/, '');
  const filePath = path.join(PUBLIC_DIR, safe);
  // Prefix check defeats `..` traversal even after normalize.
  if (filePath !== PUBLIC_DIR && !filePath.startsWith(PUBLIC_DIR + path.sep)) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Forbidden');
    return;
  }
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Not found: ' + clean);
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { 'Content-Type': STATIC_MIME[ext] || 'application/octet-stream' });
    res.end(data);
  });
}

// 1. HTTP Server
const server = http.createServer((req, res) => {
  const urlPath = (req.url || '/').split('?')[0].split('#')[0];
  if (urlPath === '/' || urlPath === '/dashboard.html' || urlPath === '/index.html') {
    serveDashboard(res);
    return;
  }
  serveStatic(urlPath, res);
});

server.listen(3000, () => {
    console.log("--------------------------------------------------");
    console.log("  OPEN CHROME → http://localhost:3000");
    console.log("--------------------------------------------------");
});

// 2. OSC status
console.log("2. OSC → Max/MSP:57121, TouchDesigner:8000");

// 3. WebSocket Server
const wss = new WebSocket.Server({ server });
console.log("3. Waiting for browser...");

// Auto-shutdown when all browser clients disconnect
let shutdownTimer = null;
const SHUTDOWN_DELAY = 5000; // 5s grace period for page refresh

function scheduleShutdown() {
  if (wss.clients.size === 0) {
    console.log(`All clients disconnected. Shutting down in ${SHUTDOWN_DELAY / 1000}s (reconnect to cancel)...`);
    shutdownTimer = setTimeout(() => {
      if (wss.clients.size === 0) {
        console.log("No clients reconnected. Shutting down.");
        gyroLoopRunning = false;
        oscTD.close();
        oscMax.close();
        wss.close();
        server.close();
        process.exit(0);
      }
    }, SHUTDOWN_DELAY);
  }
}

wss.on('connection', function connection(ws) {
    console.log("Chrome webpage connected!");
    if (shutdownTimer) {
      clearTimeout(shutdownTimer);
      shutdownTimer = null;
      console.log("Shutdown cancelled — client reconnected.");
    }

    // Send canonical cube-algorithm book on connect (unique names, not all rotation variants)
    ws.send(JSON.stringify({
      type: 'algorithm_book',
      data: engine.algorithmDetector.getCanonicalAlgorithms().map(a => ({
        name: a.name,
        moves: a.moves,
        effect: a.effect,
      })),
    }));

    ws.on('close', () => {
      console.log("Client disconnected.");
      // Deterministic cleanup: tell bridges to flush all notes/CCs.
      // Covers the "cable unplugged → notes stuck in SWAM" case.
      if (wss.clients.size === 0) sendPanic();
      scheduleShutdown();
    });

    ws.on('message', function incoming(message) {
        try {
            const data = JSON.parse(message);

            if (data.type === 'move') {
                let moveStr = data.value;
                if (typeof data.value === 'object' && data.value !== null) {
                    const face = data.value.face || "";
                    let suffix = "";
                    if (data.value.direction === -1 || data.value.direction === 3) suffix = "'";
                    else if (data.value.direction === 2) suffix = "2";
                    moveStr = `${face}${suffix}`;
                }
                // Canonical-pose face remap: GAN reports moves in factory
                // sticker frame (R = red, F = green, etc.), but the user holds
                // red-front white-top. Rotating the labels 180° around U
                // (R↔L, F↔B) makes the engine see user-pose-frame moves so
                // every downstream consumer (face-gesture, dashboard
                // animation, /xk/face OSC, algorithm-buffer HUD) speaks the
                // user's geometry. The cube-algorithm detector remains
                // orientation-invariant (24 rotation variants pre-expanded
                // in cube-algorithm.ts), so Sune-as-user-performs-it still
                // matches Sune in the book.
                //
                // MIRROR: cube-scene.js `CANONICAL_REMAP` and main.js
                // `CANONICAL_REMAP` MUST track this table. Drift is caught by
                // `[CUBE REMAP FAIL]` (per-move) and `[CUBE ALIGN FAIL]`
                // (geometric, on connect).
                if (moveStr && moveStr.length > 0) {
                    const remappedFace = MOVE_REMAP[moveStr[0]] || moveStr[0];
                    moveStr = remappedFace + moveStr.slice(1);
                }

                console.log(`[MOVE] ${moveStr}`);
                _bleMoveCount++;

                // Forward turn to TD (post-remap so TD sees user-pose moves too)
                oscTD.send(OSC.GAN_TURN, moveStr);

                // Tag move for dashboard broadcast, then feed engine
                lastMove = moveStr;
                lastMoveReceivedAt = Date.now();
                engine.onTurn(moveStr);
            }
            else if (data.type === 'gyro') {
                _bleGyroCount++;
                let q = data.data.quaternion;
                if (q) {
                    kfUpdate(q);
                    // Raw normalized sample into visual SLERP buffer. Kalman
                    // kf.q still drives OSC (low-latency audio); the buffer
                    // feeds the lagged-but-smooth dashboard cube.
                    pushVisualSample(quatNorm(q), Date.now());
                    // Feed calibrated, scene-frame orientation to engine at
                    // BLE rate so snap cells are centered on the user's zero
                    // pose AND in the same frame as the dashboard's S4 quats
                    // (see `axisRemapToScene` declaration). Triggers full
                    // state burst: OSC + WS broadcast.
                    const cg = quatMul(engineGyroZeroInv, axisRemapToScene(kf.q));
                    engine.onGyro(cg.x, cg.y, cg.z, cg.w);
                }
            }
            else if (data.type === 'set_gyro_smoothing') {
                gyroSmoothing = Math.max(0, Math.min(1, parseFloat(data.value) || 0));
            }
            else if (data.type === 'set_still_threshold') {
                const v = parseFloat(data.value);
                if (Number.isFinite(v)) engine.motion.setThreshold(v);
            }
            else if (data.type === 'get_diagrams') {
                const diagrams = engine.getDiagrams().map(d => ({
                  name: d.name,
                  description: d.description,
                  path: d.path,
                }));
                ws.send(JSON.stringify({ type: 'diagrams', data: diagrams }));
            }
            else if (data.type === 'set_diagram') {
                const diagrams = engine.getDiagrams();
                const found = diagrams.find(d => d.name === data.name);
                if (found) {
                  engine.setKDiagram(found);
                  console.log(`[DIAGRAM] Set K_i diagram: ${found.name}`);
                }
            }
            else if (data.type === 'clear_diagram') {
                engine.clearKDiagram();
                console.log('[DIAGRAM] Cleared K_i diagram (direct mode)');
            }
            else if (data.type === 'set_mode') {
                const mode = {};
                if (data.cCube) mode.cCube = data.cCube;
                if (data.kCube) mode.kCube = data.kCube;
                if (data.cosmology === 'alpha-cosmo' || data.cosmology === 'beta-cosmo') mode.cosmology = data.cosmology;
                engine.setMode(mode);
                if (mode.cosmology) {
                    phrasePlanner.reset();
                    sendPanic();
                }
                console.log(`[MODE] ${JSON.stringify(mode)}`);
            }
            else if (data.type === 'set_tracked_k') {
                engine.setTrackedK(Number(data.value));
                console.log(`[TRACKED_K] ${Number(data.value)}`);
            }
            else if (data.type === 'reset') {
                engine.reset();
                phrasePlanner.reset();
                publishPhraseAuditResults(phraseAuditor.reset('panic'));
                console.log('[RESET] Engine reset');
            }
            else if (data.type === 'cube_solved') {
                // Browser detected a solved FACELETS on an unsolved→solved edge.
                // Engine fires /xk/solve listeners (OSC out + WS broadcast).
                engine.reportCubeSolved();
            }
            else if (data.type === 'zero_gyro') {
                // Dashboard zeroed its visual frame; mirror that here so the
                // engine's snap computation re-centers on the same rest pose.
                engineGyroZeroInv = quatConj(quatNorm(axisRemapToScene(kf.q)));
                console.log('[ZERO] engine gyro zero captured');
            }
        } catch (e) {
            console.error("Parse error:", e);
        }
    });
});
