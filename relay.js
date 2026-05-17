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
  sphereStrikeToOsc,
  spherePanicToOsc,
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
// Nomos Alpha walk path; XK_COSMO=mandala-cosmo to boot the gamelan
// sphere-engine cosmology (requires the xk_sphere.js v8 + polybuffer~
// chain in the Max patch — sphere strikes fire harmlessly into the void
// if Max isn't running the sphere chain).
const VALID_COSMO = new Set(['alpha-cosmo', 'beta-cosmo', 'mandala-cosmo']);
const START_COSMO = VALID_COSMO.has(process.env.XK_COSMO) ? process.env.XK_COSMO : 'beta-cosmo';
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

// === Live WebSocket backpressure guard ===
//
// The dashboard is a visual consumer, not the clock source. If Chrome falls
// behind, stale gyro frames should be dropped instead of queueing ahead of
// live move / MIDI echo messages on the same socket.
const WS_BACKPRESSURE_WARN_BYTES = 32 * 1024;
const WS_BACKPRESSURE_DROP_BYTES = 64 * 1024;
const WS_BACKPRESSURE_LOG_MS = 5000;
const RELAY_LAG_INTERVAL_MS = 1000;
const RELAY_LAG_WARN_MS = 75;
const RELAY_LAG_FAIL_MS = 200;
let wsClientSeq = 0;
let relayLagLastTick = Date.now();

function wsClientId(client) {
  if (!client._xkClientId) client._xkClientId = ++wsClientSeq;
  return client._xkClientId;
}

function logWsBackpressure(client, kind, buffered, dropped) {
  const now = Date.now();
  if (!client._xkBackpressure) {
    client._xkBackpressure = { lastLog: now, dropped: 0 };
  }
  if (dropped) client._xkBackpressure.dropped++;
  if (
    now - client._xkBackpressure.lastLog < WS_BACKPRESSURE_LOG_MS &&
    buffered < WS_BACKPRESSURE_WARN_BYTES
  ) {
    return;
  }
  client._xkBackpressure.lastLog = now;
  const droppedText = client._xkBackpressure.dropped > 0
    ? ` droppedLowPriority=${client._xkBackpressure.dropped}`
    : '';
  client._xkBackpressure.dropped = 0;
  console.warn(
    `[WS BACKPRESSURE] client=${wsClientId(client)} kind=${kind} ` +
    `buffered=${Math.round(buffered / 1024)}KB${droppedText}`
  );
}

function sendWs(client, payload, options = {}) {
  if (!client || client.readyState !== WebSocket.OPEN) return false;
  const kind = options.kind || 'message';
  const buffered = client.bufferedAmount || 0;
  const lowPriority = options.lowPriority === true;
  const shouldDrop =
    lowPriority &&
    (buffered >= WS_BACKPRESSURE_DROP_BYTES ||
     (options.dropIfBuffered === true && buffered > 0));

  if (shouldDrop) {
    logWsBackpressure(client, kind, buffered, true);
    return false;
  }
  if (buffered >= WS_BACKPRESSURE_WARN_BYTES) {
    logWsBackpressure(client, kind, buffered, false);
  }
  client.send(payload);
  return true;
}

function broadcastWs(payload, options = {}) {
  wss?.clients?.forEach((client) => sendWs(client, payload, options));
}

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
let latestAudibleComplex = 0;
let latencySeq = 0;

setInterval(() => {
  const now = Date.now();
  const lag = now - relayLagLastTick - RELAY_LAG_INTERVAL_MS;
  relayLagLastTick = now;
  if (lag >= RELAY_LAG_FAIL_MS) {
    console.error(`[RELAY LAG FAIL] event loop lag=${lag}ms pendingVoiceLatency=${pendingVoiceLatency.length}`);
  } else if (lag >= RELAY_LAG_WARN_MS) {
    console.warn(`[RELAY LAG WARN] event loop lag=${lag}ms pendingVoiceLatency=${pendingVoiceLatency.length}`);
  }
}, RELAY_LAG_INTERVAL_MS);

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
    // Plan id from the TS shadow planner; Max stamps this onto every /xk/midi/*
    // echo. Matching by planId here is what lets voice steal / overlap not
    // satisfy the wrong probe FIFO-style. Falls back to FIFO order when
    // planId === 0 (older Max reloads can emit echoes without the stamp during
    // a single reload window).
    planId: (firstPlan?.id | 0) || 0,
    t0: Date.now(),
    moveT0: lastMoveReceivedAt || Date.now(),
    move: lastMove || '-',
    face: output.face || '-',
    halfTurn: output.halfTurn === true,
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
    console.error(`[LATENCY FAIL] dropped stale pending voice id=${dropped.id} planId=${dropped.planId} C${dropped.expectedComplex} planFirst=${dropped.expectedFirstNoteOnMs}ms without noteon echo`);
  }
}

function completeVoiceLatencyProbe(data) {
  if (!data || data.kind !== 'noteon' || data.isCompanion === true) return;
  expireVoiceLatencyProbes(Date.now());
  if (pendingVoiceLatency.length === 0) return;
  // Prefer planId-matched probe so voice steal / overlap doesn't satisfy the
  // wrong pending entry. Fall back to FIFO shift only when the echo carries
  // planId=0 (older Max reload during a single bridge-restart cycle) — every
  // probe whose planId predates the matched one is then a confirmed miss.
  const echoPlanId = data.planId | 0;
  let pending;
  if (echoPlanId > 0) {
    const idx = pendingVoiceLatency.findIndex((p) => p.planId === echoPlanId);
    if (idx === -1) {
      // No planId match. The echo arrived for a phrase whose probe expired
      // earlier; do nothing rather than shift the next-in-line probe.
      return;
    }
    if (idx > 0) {
      const stale = pendingVoiceLatency.splice(0, idx);
      for (const s of stale) {
        console.error(`[LATENCY FAIL] no matching noteon for planId=${s.planId} id=${s.id} C${s.expectedComplex} (later planId=${echoPlanId} arrived first)`);
      }
    }
    pending = pendingVoiceLatency.shift();
  } else {
    pending = pendingVoiceLatency.shift();
  }
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

  const planText = `planId=${pending.planId} planFirst=${pending.expectedFirstNoteOnMs}ms planOverrun=${planOverrunMs}ms planNoteons=${pending.plannedNoteOnCount ?? '?'} planBends=${pending.plannedBendStepCount ?? '?'} planCompanions=${pending.plannedCompanionNoteOnCount ?? '?'}`;
  const halfText = pending.halfTurn ? ' half-turn=1' : '';
  const base = `[LATENCY] voice->noteon ${dt}ms move->noteon ${moveDt}ms ${planText} move=${pending.move} C${complex} face=${pending.face}${halfText} expected=C${pending.expectedComplex} mode=${pending.mode} ${exprText}`;
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
    console.error(`[LATENCY FAIL] no noteon echo within ${LATENCY_MISSING_MS}ms for voice id=${stale.id} planId=${stale.planId} move=${stale.move} C${stale.expectedComplex} face=${stale.face}${stale.halfTurn ? ' half-turn=1' : ''} mode=${stale.mode} planFirst=${stale.expectedFirstNoteOnMs}ms planNoteons=${stale.plannedNoteOnCount ?? '?'}`);
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
    broadcastWs(payload, { kind: 'phrase_audit' });
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
          sendWs(c, tick, { kind: 'gyro_tick', lowPriority: true, dropIfBuffered: true });
        });
      }

      gyroOutputCount++;
    }
  }

  // Sleep ~1ms then check again (setTimeout(0) is ~1ms on Node)
  setTimeout(gyroLoop, 1);
}
gyroLoop();

// Build the dashboard-facing v2 state from the engine's current state +
// non-XenaKubeState sub-engines (voice mode, performance mode, algorithm
// buffer, algorithm partials). Used both by the engine.onState listener and
// by WS control-mutation branches that need to push fresh state without
// waiting for the next gyro packet.
function buildV2State(state) {
  return {
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
}

// Forward engine state over OSC on every state change + broadcast to dashboard
engine.onState((state) => {
  latestEngineState = state;
  const msgs = stateToOsc(state);
  for (const msg of msgs) {
    oscMax.send(msg.address, ...msg.args);
  }
  broadcastState(buildV2State(state), lastMove);
  lastMove = null;
});

// Push current engine state to dashboard immediately after a WS control
// mutation. The engine mutators (setMode, setKDiagram, reset, etc.) do not
// emit on their own listener channel — without this call, the dashboard's
// K cards / cosmology toggle / tracked-K marker stay stale until the next
// /xk/gyro packet (which never arrives when the cube is offline).
function broadcastEngineStateAfterControl() {
  broadcastState(buildV2State(engine.getState()), null);
}

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
  broadcastWs(payload, { kind: 'algorithm' });
  console.log(`[ALGORITHM] ${match.algorithm.name} (${match.algorithm.moves.join(' ')})`);
});

// Broadcast cube-solved edge — fires once per unsolved→solved transition.
// Source of truth: the GAN cube's FACELETS report (read by the browser and
// relayed over WS as {type:'cube_solved'}). The browser owns edge detection.
// Distinct from /xk/scramble, which is BFS distance in S4 (24 elements).
engine.onSolve((report) => {
  if (report?.cosmologyChanged) {
    phrasePlanner.reset();
    sendPanic();
  }

  const msg = solveToOsc();
  oscMax.send(msg.address, ...msg.args);
  oscTD.send(msg.address, ...msg.args);

  const payload = JSON.stringify({ type: 'solve' });
  broadcastWs(payload, { kind: 'solve' });
  // Only alpha→beta auto-switches on solve (engine.reportCubeSolved).
  // beta-cosmo and mandala-cosmo stay put — solve is a meaningful event
  // (cycle-closing in mandala-cosmo triggers visual dissolution) but does
  // not collapse the cosmology.
  const cosmoText = report?.cosmologyChanged
    ? ` -> beta-cosmo (from ${report.previousCosmology})`
    : ` (cosmology=${report?.state?.cosmology ?? 'unknown'} — unchanged)`;
  console.log(`[SOLVE] cube solved${cosmoText}`);
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
  broadcastWs(payload, { kind: 'voice' });

  const planPayload = JSON.stringify({
    type: 'phrase_plan',
    data: {
      plans: phrasePlans,
      summary: phrasePlans.map(phrasePlanSummary),
    },
  });
  broadcastWs(planPayload, { kind: 'phrase_plan' });
});

/** Send /xk/panic to Max (used on WS disconnect). Bridges/synth flush state. */
function sendPanic() {
  try {
    oscMax.send(OSC.PANIC);
  } catch (e) { /* OSC may be closed; safe to ignore */ }
  publishPhraseAuditResults(phraseAuditor.reset('panic'));
}

/** Flush sphere voices (sphere chain in xk_sphere.js / polybuffer~). Fires
 *  on cosmology switch, reset, and WS disconnect. Reset sphere echo
 *  bookkeeping so the D75 audit doesn't carry stale pending strikes. */
function sendSpherePanic() {
  try {
    const msg = spherePanicToOsc();
    oscMax.send(msg.address);
  } catch (e) { /* OSC may be closed; safe to ignore */ }
  sphereAudit.reset();
}

// === Sphere strike echo audit (D75 — lightweight relay-side) ===
//
// Counts pending /xk/sphere/strike emissions and matches incoming
// /xk/sphere/echo by strikeId. Late or missing echoes log a FAIL line.
// Suppressed until at least one echo has been seen — sphere chain may
// not be loaded in Max, in which case we don't want noisy fail spam.
const SPHERE_ECHO_TIMEOUT_MS = 400;
const SPHERE_ECHO_LOG_INTERVAL_MS = 5000;
const sphereAudit = {
  pending: new Map(), // strikeId -> { sample, emittedAtMs }
  echoesSeen: 0,
  missCount: 0,
  lateCount: 0,
  lastLogMs: 0,
  reset() {
    this.pending.clear();
    this.missCount = 0;
    this.lateCount = 0;
  },
  noteStrike(strikeId, sample) {
    this.pending.set(strikeId, { sample, emittedAtMs: Date.now() });
    // Schedule timeout — only counts as a miss once timeout fires.
    setTimeout(() => {
      const p = this.pending.get(strikeId);
      if (!p) return;
      // Suppress until handshake — no echoes yet means sphere chain absent.
      if (this.echoesSeen > 0) {
        this.missCount++;
        console.warn(`[SPHERE STRIKE FAIL] strikeId=${strikeId} sample=${p.sample} no echo within ${SPHERE_ECHO_TIMEOUT_MS}ms`);
      }
      this.pending.delete(strikeId);
    }, SPHERE_ECHO_TIMEOUT_MS);
  },
  noteEcho(strikeId, sample) {
    this.echoesSeen++;
    const p = this.pending.get(strikeId);
    if (!p) {
      // Echo without a known strike — orphan; log rarely.
      this.maybeLog(`orphan echo strikeId=${strikeId} sample=${sample}`);
      return;
    }
    const lat = Date.now() - p.emittedAtMs;
    if (lat > SPHERE_ECHO_TIMEOUT_MS) this.lateCount++;
    this.pending.delete(strikeId);
  },
  maybeLog(msg) {
    const now = Date.now();
    if (now - this.lastLogMs < SPHERE_ECHO_LOG_INTERVAL_MS) return;
    this.lastLogMs = now;
    console.warn(`[SPHERE ECHO] ${msg}`);
  },
};

// === Sphere strike emission (mandala-cosmo only) ===
//
// engine.onSphere fires after onVoice. Strikes are formatted into
// /xk/sphere/strike OSC + broadcast over WS as { type: 'sphere_strike' }
// so the dashboard mandala canvas can deposit glyphs on the planned
// strike (low-latency visual sync; echo is for invariant audit only).
engine.onSphere((strikes) => {
  for (const strike of strikes) {
    const msg = sphereStrikeToOsc(strike);
    try { oscMax.send(msg.address, ...msg.args); }
    catch (e) { /* OSC may be closed during panic; safe */ }
    sphereAudit.noteStrike(strike.strikeId, strike.sample);
  }
  if (strikes.length > 0) {
    const payload = JSON.stringify({ type: 'sphere_strike', data: { strikes } });
    broadcastWs(payload, { kind: 'sphere_strike' });
  }
});

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

const SPECTRUM_FRAME_MIN_ATOMS = 13; // address + 12 header atoms
const SPECTRUM_MAX_BINS = 256;
const SPECTRUM_LOG_INTERVAL_MS = 5000;
let _spectrumNoClientDrops = 0;
let _spectrumFrameDrops = 0;
let _spectrumLastLogMs = 0;

function activeComplexFromState() {
  const activeIdx = Math.max(0, Math.min(7, latestEngineState?.activeVertex ?? 0));
  const assignments = latestEngineState?.cAssignments;
  const cmx = Array.isArray(assignments) ? assignments[activeIdx] : activeIdx + 1;
  return Math.max(1, Math.min(8, cmx | 0));
}

function activeComplexForSpectrum() {
  // xk_spectrum.js may emit complex=0. In that case, color by the latest
  // audio-side noteon echo rather than the engine state, which can advance
  // before Max has emitted the first note of the new phrase.
  const cmx = latestAudibleComplex | 0;
  if (cmx >= 1 && cmx <= 8) return cmx;
  return activeComplexFromState();
}

function finiteNumber(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function clampDb(v) {
  const n = finiteNumber(v, -120);
  return Math.max(-160, Math.min(24, n));
}

function parseSpectrumFrame(msg) {
  if (!Array.isArray(msg) || msg.length < SPECTRUM_FRAME_MIN_ATOMS) return null;
  const declaredBins = Math.max(0, Math.min(SPECTRUM_MAX_BINS, msg[5] | 0));
  const atoms = msg.slice(13);
  const binCount = Math.min(declaredBins || atoms.length, atoms.length, SPECTRUM_MAX_BINS);
  if (binCount <= 0) return null;
  const rawComplex = msg[4] | 0;
  const binsDb = new Array(binCount);
  for (let i = 0; i < binCount; i++) binsDb[i] = clampDb(atoms[i]);
  return {
    frameId: msg[1] | 0,
    audioTimeMs: finiteNumber(msg[2], Date.now()),
    analysisLatencyMs: Math.max(0, Math.min(2000, finiteNumber(msg[3], 0))),
    complex: rawComplex >= 1 && rawComplex <= 8 ? rawComplex : activeComplexForSpectrum(),
    binCount,
    minHz: Math.max(1, finiteNumber(msg[6], 40)),
    maxHz: Math.max(2, finiteNumber(msg[7], 6000)),
    rmsDb: clampDb(msg[8]),
    peakDb: clampDb(msg[9]),
    centroidHz: Math.max(0, finiteNumber(msg[10], 0)),
    flux: Math.max(0, finiteNumber(msg[11], 0)),
    stereoWidth: Math.max(0, Math.min(1, finiteNumber(msg[12], 0))),
    relayReceivedAtMs: Date.now(),
    binsDb,
  };
}

function spectrumClientCount() {
  let count = 0;
  wss?.clients?.forEach((client) => {
    if (client.readyState === WebSocket.OPEN && client._xkSpectrumEnabled === true) count++;
  });
  return count;
}

function maybeLogSpectrumDrops() {
  const now = Date.now();
  if (now - _spectrumLastLogMs < SPECTRUM_LOG_INTERVAL_MS) return;
  if (_spectrumNoClientDrops === 0 && _spectrumFrameDrops === 0) return;
  console.warn(
    `[SPECTRUM] dropped noClient=${_spectrumNoClientDrops} invalid=${_spectrumFrameDrops} ` +
    `enabledClients=${spectrumClientCount()}`
  );
  _spectrumNoClientDrops = 0;
  _spectrumFrameDrops = 0;
  _spectrumLastLogMs = now;
}

function broadcastSpectrumFrame(frame) {
  const payload = JSON.stringify({ type: 'spectrum_frame', data: frame });
  let sent = 0;
  wss?.clients?.forEach((client) => {
    if (client._xkSpectrumEnabled !== true) return;
    if (sendWs(client, payload, { kind: 'spectrum_frame', lowPriority: true, dropIfBuffered: true })) sent++;
  });
  if (sent === 0) {
    _spectrumNoClientDrops++;
    maybeLogSpectrumDrops();
  }
}

midiEchoServer.on('message', (msg) => {
  // node-osc delivers [address, ...args]. Map to our WS schema.
  // Newer Max bridges append companion/plan metadata after `complex`; older
  // reloaded patches leave those atoms undefined, which resolves to 0 and
  // keeps dashboard rendering backwards-compatible during one reload window.
  const address = msg[0];
  if (address === OSC.SPECTRUM_FRAME) {
    const frame = parseSpectrumFrame(msg);
    if (frame) broadcastSpectrumFrame(frame);
    else {
      _spectrumFrameDrops++;
      maybeLogSpectrumDrops();
    }
    return;
  }

  // Sphere echo (D75 audit) — path-routed early so the SWAM auditor
  // doesn't touch sphere-namespace traffic.
  if (address === OSC.SPHERE_ECHO) {
    const sample = String(msg[1] ?? '');
    const strikeId = msg[2] | 0;
    sphereAudit.noteEcho(strikeId, sample);
    return;
  }
  if (address === OSC.SPHERE_LOADED) {
    const loaded = msg[1] | 0;
    const expected = msg[2] | 0;
    const tuningHash = String(msg[3] ?? '');
    console.log(`[SPHERE LOAD] loaded=${loaded} expected=${expected} tuningHash=${tuningHash}`);
    return;
  }

  let data = null;
  if (address === OSC.MIDI_NOTEON)        data = { kind: 'noteon',   voice: msg[1]|0, pitch: msg[2]|0, velocity: msg[3]|0, complex: msg[4]|0, isCompanion: (msg[5]|0) === 1, planId: msg[6]|0 };
  else if (address === OSC.MIDI_NOTEOFF)  data = { kind: 'noteoff',  voice: msg[1]|0, pitch: msg[2]|0, velocity: msg[3]|0, complex: msg[4]|0, planId: msg[6]|0 };
  else if (address === OSC.MIDI_PANIC)    data = { kind: 'panic' };
  else if (address === OSC.MIDI_BENDSTEP) data = { kind: 'bendstep', voice: msg[1]|0, fromPitch: msg[2]|0, toPitch: msg[3]|0, durMs: msg[4]|0, complex: msg[5]|0, planId: msg[6]|0 };  // D59
  else if (address === OSC.MIDI_EXPR)     data = { kind: 'expr',     voice: msg[1]|0, val: msg[2]|0, complex: msg[3]|0, planId: msg[4]|0 };
  else return;

  if (data.kind === 'expr') {
    latestExprByVoice.set(data.voice, { val: data.val, complex: data.complex, t: Date.now() });
  } else if (data.kind === 'noteon' && data.complex >= 1 && data.complex <= 8) {
    latestAudibleComplex = data.complex | 0;
  } else if (data.kind === 'panic') {
    latestAudibleComplex = 0;
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
  broadcastWs(payload, { kind: 'midi_echo' });
});

/** Broadcast engine state to all connected WS clients */
function broadcastState(state, move) {
  const isGyro = move === null;
  const payload = JSON.stringify({
    type: isGyro ? 'gyro_state' : 'state',
    data: state,
    move: move || undefined,
  });
  broadcastWs(payload, { kind: isGyro ? 'gyro_state' : 'state', lowPriority: isGyro });
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

// Portable dashboard settings: GET/POST /api/dashboard-settings round-trips a
// flat string map (mirror of the dashboard's localStorage allowlist) to a
// project-tracked JSON file so settings travel with the repo across machines
// instead of being trapped in per-browser Chrome User Data.
const DATA_DIR = path.join(__dirname, 'data');
const DASHBOARD_SETTINGS_PATH = path.join(DATA_DIR, 'dashboard-settings.json');
const DASHBOARD_SETTINGS_MAX_BYTES = 256 * 1024;

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

function getDashboardSettings(res) {
  fs.readFile(DASHBOARD_SETTINGS_PATH, 'utf8', (err, data) => {
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    if (err) {
      res.end(JSON.stringify({ version: 1, settings: {} }));
      return;
    }
    res.end(data);
  });
}

function saveDashboardSettings(req, res) {
  let total = 0;
  const chunks = [];
  let aborted = false;
  req.on('data', (chunk) => {
    if (aborted) return;
    total += chunk.length;
    if (total > DASHBOARD_SETTINGS_MAX_BYTES) {
      aborted = true;
      res.writeHead(413, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('settings payload too large');
      req.destroy();
      return;
    }
    chunks.push(chunk);
  });
  req.on('end', () => {
    if (aborted) return;
    const body = Buffer.concat(chunks).toString('utf8');
    let parsed;
    try {
      parsed = JSON.parse(body);
    } catch (e) {
      res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('invalid JSON: ' + e.message);
      return;
    }
    if (!parsed || typeof parsed !== 'object' || typeof parsed.settings !== 'object' || parsed.settings === null) {
      res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('invalid shape: expected { version, settings: {} }');
      return;
    }
    const safe = { version: 1, settings: {} };
    for (const [k, v] of Object.entries(parsed.settings)) {
      if (typeof k !== 'string' || k.length === 0 || k.length > 128) continue;
      if (v == null) continue;
      const s = String(v);
      if (s.length > 32 * 1024) continue;
      safe.settings[k] = s;
    }
    const out = JSON.stringify(safe, null, 2) + '\n';
    fs.mkdir(DATA_DIR, { recursive: true }, (mkErr) => {
      if (mkErr) {
        res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('mkdir failed: ' + mkErr.message);
        return;
      }
      const tmp = DASHBOARD_SETTINGS_PATH + '.tmp';
      fs.writeFile(tmp, out, 'utf8', (wErr) => {
        if (wErr) {
          res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
          res.end('write failed: ' + wErr.message);
          return;
        }
        fs.rename(tmp, DASHBOARD_SETTINGS_PATH, (rErr) => {
          if (rErr) {
            res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
            res.end('rename failed: ' + rErr.message);
            return;
          }
          res.writeHead(204);
          res.end();
        });
      });
    });
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
  if (urlPath === '/api/dashboard-settings') {
    if (req.method === 'GET') { getDashboardSettings(res); return; }
    if (req.method === 'POST') { saveDashboardSettings(req, res); return; }
    res.writeHead(405, { 'Allow': 'GET, POST', 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('method not allowed');
    return;
  }
  serveStatic(urlPath, res);
});

// Loopback-only bind: the WS upgrade on this socket accepts unauthenticated
// control messages (set_mode / reset / move) that drive SWAM. Binding to
// 127.0.0.1 keeps a venue Wi-Fi peer from being able to play notes via wscat.
// Set XK_BIND_HOST=0.0.0.0 to opt in to LAN exposure (e.g. remote monitoring).
const RELAY_HOST = process.env.XK_BIND_HOST || '127.0.0.1';
server.listen(3000, RELAY_HOST, () => {
    console.log("--------------------------------------------------");
    console.log(`  OPEN CHROME → http://localhost:3000  (bound ${RELAY_HOST}:3000)`);
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
    sendWs(ws, JSON.stringify({
      type: 'algorithm_book',
      data: engine.algorithmDetector.getCanonicalAlgorithms().map(a => ({
        name: a.name,
        moves: a.moves,
        effect: a.effect,
      })),
    }), { kind: 'algorithm_book' });
    ws._xkSpectrumEnabled = false;
    sendWs(ws, JSON.stringify({
      type: 'spectrum_status',
      data: { enabled: false, clients: spectrumClientCount() },
    }), { kind: 'spectrum_status' });

    ws.on('close', () => {
      console.log("Client disconnected.");
      // Deterministic cleanup: tell bridges to flush all notes/CCs.
      // Covers the "cable unplugged → notes stuck in SWAM" case.
      if (wss.clients.size === 0) { sendPanic(); sendSpherePanic(); }
      scheduleShutdown();
    });

    ws.on('message', function incoming(message) {
        try {
            // Hard size cap on inbound WS messages. The dashboard's largest
            // outbound payload is a `move` object with a few numeric fields;
            // anything beyond 16 KB is either a malformed client or a deliberate
            // resource probe. Treat as a drop rather than crash the relay.
            if (typeof message?.length === 'number' && message.length > 16 * 1024) {
                console.warn(`[WS DROP] oversize inbound ${message.length}B from ${wsClientId(ws)}`);
                return;
            }
            const data = JSON.parse(message);
            if (!data || typeof data !== 'object' || typeof data.type !== 'string') {
                // Loopback bind keeps this surface trusted in practice, but a
                // schema check still catches malformed dashboard builds before
                // they brick engine state. Match shape on `.type` only; each
                // branch below narrows further when it reads `.value` etc.
                console.warn(`[WS DROP] malformed inbound from ${wsClientId(ws)}: missing .type`);
                return;
            }

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
            else if (data.type === 'set_spectrum_enabled') {
                ws._xkSpectrumEnabled = data.enabled === true;
                console.log(`[SPECTRUM] client=${wsClientId(ws)} enabled=${ws._xkSpectrumEnabled}`);
                sendWs(ws, JSON.stringify({
                  type: 'spectrum_status',
                  data: { enabled: ws._xkSpectrumEnabled, clients: spectrumClientCount() },
                }), { kind: 'spectrum_status' });
            }
            else if (data.type === 'get_diagrams') {
                const diagrams = engine.getDiagrams().map(d => ({
                  name: d.name,
                  description: d.description,
                  path: d.path,
                }));
                sendWs(ws, JSON.stringify({ type: 'diagrams', data: diagrams }), { kind: 'diagrams' });
            }
            else if (data.type === 'set_diagram') {
                const diagrams = engine.getDiagrams();
                const found = diagrams.find(d => d.name === data.name);
                if (found) {
                  engine.setKDiagram(found);
                  console.log(`[DIAGRAM] Set K_i diagram: ${found.name}`);
                  broadcastEngineStateAfterControl();
                }
            }
            else if (data.type === 'clear_diagram') {
                engine.clearKDiagram();
                console.log('[DIAGRAM] Cleared K_i diagram (direct mode)');
                broadcastEngineStateAfterControl();
            }
            else if (data.type === 'set_mode') {
                const mode = {};
                if (data.cCube) mode.cCube = data.cCube;
                if (data.kCube) mode.kCube = data.kCube;
                if (VALID_COSMO.has(data.cosmology)) mode.cosmology = data.cosmology;
                engine.setMode(mode);
                if (mode.cosmology) {
                    phrasePlanner.reset();
                    sendPanic();
                    sendSpherePanic();
                }
                console.log(`[MODE] ${JSON.stringify(mode)}`);
                broadcastEngineStateAfterControl();
            }
            else if (data.type === 'set_tracked_k') {
                engine.setTrackedK(Number(data.value));
                console.log(`[TRACKED_K] ${Number(data.value)}`);
                broadcastEngineStateAfterControl();
            }
            else if (data.type === 'reset') {
                engine.reset();
                phrasePlanner.reset();
                publishPhraseAuditResults(phraseAuditor.reset('panic'));
                sendSpherePanic();
                console.log('[RESET] Engine reset');
                broadcastEngineStateAfterControl();
            }
            else if (data.type === 'cube_solved') {
                // Browser detected a solved FACELETS on an unsolved→solved edge.
                // Engine applies solve-anchor mode semantics, then fires
                // /xk/solve listeners (OSC out + WS broadcast).
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
