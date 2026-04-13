// Register tsx so we can require TypeScript modules directly
require('tsx/cjs');

const { Client } = require('node-osc');
const WebSocket = require('ws');
const http = require('http');
const fs = require('fs');
const path = require('path');
const { XenaKubeEngine, stateToOsc, getBuiltinDiagrams } = require('./src/index.ts');

/*
   GAN Cube Live Performance Bridge - macOS FIXED (v2)
   Uses official customMacAddressProvider (no spoofing needed)
   Library now ignores device.id and uses this method
   Prefilled with your real MAC (AB:12:34:5E:83:F7)
*/

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
const engine = new XenaKubeEngine();

// === OSC Clients ===
const oscSC  = new Client('127.0.0.1', 57120);  // SuperCollider — receives /xk/* engine state
const oscTD  = new Client('127.0.0.1', 8000);   // TouchDesigner — receives raw /gan/* + /xk/gyro

// Track last move for dashboard broadcast
let lastMove = null;

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

// --- Filter state ---
const kf = {
  q: { x: 0, y: 0, z: 0, w: 1 },   // estimated orientation
  omega: { x: 0, y: 0, z: 0 },       // estimated angular velocity (rad/s)
  prevMeas: null,                       // { q, t } previous BLE measurement
  initialized: false,
};

let gyroSmoothing = 0.20;  // 0 = responsive (near-zero lag), 1 = heavy smoothing
let gyroOutputCount = 0;
let lastOutputTime = Date.now();
const GYRO_OUTPUT_HZ = 60;

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
      const omega_meas = { x: rv.x / dt, y: rv.y / dt, z: rv.z / dt };
      kf.omega.x += Kv * (omega_meas.x - kf.omega.x);
      kf.omega.y += Kv * (omega_meas.y - kf.omega.y);
      kf.omega.z += Kv * (omega_meas.z - kf.omega.z);
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

      oscSC.send('/xk/gyro', kf.q.x, kf.q.y, kf.q.z, kf.q.w);
      oscTD.send('/gan/gyro', kf.q.x, kf.q.y, kf.q.z, kf.q.w);
      gyroOutputCount++;
    }
  }

  // Sleep ~1ms then check again (setTimeout(0) is ~1ms on Node)
  setTimeout(gyroLoop, 1);
}
gyroLoop();

// Forward engine state over OSC on every state change + broadcast to dashboard
engine.onState((state) => {
  const msgs = stateToOsc(state);
  for (const msg of msgs) {
    oscSC.send(msg.address, ...msg.args);
  }

  // Augment state with v2 data (scrambleFactor is now in XenaKubeState)
  const v2State = {
    ...state,
    voiceMode: engine.voiceEngine.mode,
    performanceMode: engine.modeManager.getMode(),
    spellBuffer: engine.spellDetector.getBuffer(),
    spellPartials: engine.spellDetector.getPartialMatches().map(p => ({
      name: p.spell.name,
      matched: p.matched,
      total: p.spell.algorithm.length,
    })),
  };

  broadcastState(v2State, lastMove);
  lastMove = null;
});

// Broadcast spell events
engine.onSpell((match) => {
  const payload = JSON.stringify({
    type: 'spell',
    data: {
      name: match.spell.name,
      effect: match.spell.effect,
      algorithm: match.spell.algorithm,
      timestamp: match.timestamp,
    },
  });
  wss?.clients?.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  });
  console.log(`[SPELL] ${match.spell.name} (${match.spell.algorithm.join(' ')})`);
});

// Broadcast voice output
engine.onVoice((output) => {
  const payload = JSON.stringify({
    type: 'voice',
    data: output,
  });
  wss?.clients?.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
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

// Load dashboard HTML (single page: connect + live visualization)
const DASHBOARD_PATH = path.join(__dirname, 'public', 'dashboard.html');
let DASHBOARD_HTML = '';
try {
  DASHBOARD_HTML = fs.readFileSync(DASHBOARD_PATH, 'utf-8');
} catch (e) {
  console.warn('Dashboard not found at', DASHBOARD_PATH);
}

// 1. HTTP Server
const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(DASHBOARD_HTML);
});

server.listen(3000, () => {
    console.log("--------------------------------------------------");
    console.log("  OPEN CHROME → http://localhost:3000");
    console.log("--------------------------------------------------");
});

// 2. OSC status
console.log("2. OSC → SuperCollider on port 57120, TouchDesigner on port 8000");

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
        oscSC.close();
        oscTD.close();
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

    // Send canonical spell book on connect (unique names, not all rotation variants)
    ws.send(JSON.stringify({
      type: 'spell_book',
      data: engine.spellDetector.getCanonicalSpells().map(s => ({
        name: s.name,
        algorithm: s.algorithm,
        effect: s.effect,
      })),
    }));

    ws.on('close', () => {
      console.log("Client disconnected.");
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
                console.log(`[MOVE] ${moveStr}`);
                _bleMoveCount++;

                // Forward raw turn to TD
                oscTD.send('/gan/turn', moveStr);

                // Tag move for dashboard broadcast, then feed engine
                lastMove = moveStr;
                engine.onTurn(moveStr);
            }
            else if (data.type === 'gyro') {
                _bleGyroCount++;
                let q = data.data.quaternion;
                if (q) {
                    kfUpdate(q);
                    // Feed corrected orientation to engine at BLE rate
                    // (triggers full state burst: OSC + WS broadcast)
                    engine.onGyro(kf.q.x, kf.q.y, kf.q.z, kf.q.w);
                }
            }
            else if (data.type === 'set_gyro_smoothing') {
                gyroSmoothing = Math.max(0, Math.min(1, parseFloat(data.value) || 0));
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
                if (data.path) mode.path = data.path;
                if (data.cCube) mode.cCube = data.cCube;
                if (data.kCube) mode.kCube = data.kCube;
                engine.setMode(mode);
                console.log(`[MODE] ${JSON.stringify(mode)}`);
            }
            else if (data.type === 'reset') {
                engine.reset();
                console.log('[RESET] Engine reset');
            }
        } catch (e) {
            console.error("Parse error:", e);
        }
    });
});
