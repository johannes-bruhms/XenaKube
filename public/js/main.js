// public/js/main.js
//
// Phase 2.9 — module entry point. Imports every dashboard module, calls
// each one's init(), then wires:
//   • transport events → module update entry points
//   • DOM controls (sliders, buttons, MAC field) → transport.send / module setters
//   • Web Bluetooth GAN cube connection → transport (move / gyro / facelets)
//   • the Phase 1 visual-invariant cross-module reads (rolling-score ←→
//     triangle's gliss display) so neither module needs the other's import
//
// dashboard.html is now HTML + a single <script type="module" src="./js/main.js">
// — everything that used to live in the inline <script> block has moved
// into one of the modules below.

import { connectGanCube } from 'https://cdn.jsdelivr.net/npm/gan-web-bluetooth@latest/+esm';

import {
  connect as transportConnect,
  send    as transportSend,
  on      as transportOn,
} from './transport.js';

import * as cubeScene from './cube-scene.js';
import * as rollingScore from './rolling-score.js';
import * as triangle from './triangle.js';
import * as stateUi from './state-ui.js';
import {
  noteOn        as sieveNoteOn,
  noteOff       as sieveNoteOff,
  panic         as sievePanic,
  getCellRect   as getSieveCellRect,
} from './sieve.js';

const wsSend = transportSend;

// ---- Init modules ----------------------------------------------------------

cubeScene.init({
  // Auto-zero fires once after the cube-connect view orbit lands. Mirror
  // the zero to the relay so the engine's snap cells re-center on the
  // same rest pose the visual just adopted (otherwise snap thresholds
  // stay anchored to the raw sensor frame and feel asymmetric).
  onAutoZero: () => wsSend({ type: 'zero_gyro' }),
});

rollingScore.init({
  // Stuck-note watchdog mirror: when the rolling-score force-finalises an
  // active note (UDP loss / relay reconnect), tear down its sieve glow +
  // white line so the three lifetimes stay aligned.
  onForceFinalise: (pending, key) => {
    sieveNoteOff(pending.pitch);
    triangle.noteOff(pending.voice, pending.pitch, pending.complex, key);
  },
  // Phase 1 invariant — assertGlissSync compares line ↔ chain
  // trajectories. Wired here (not via direct import) so neither module
  // needs to know about the other.
  getActiveGlissLineDisplay: (now) => triangle.getActiveGlissLineDisplay(now),
});

triangle.init({
  getCamera:          cubeScene.getCamera,
  getActiveKWorldPos: cubeScene.getActiveKWorldPos,
  getCWorldPos:       cubeScene.getCWorldPos,
  getSieveCellRect,
  // Post-FIFO-shift "is the chain over?" check. True iff another gliss
  // noteon for (voice, complex) is still in rolling-score's active map;
  // when true, triangle's endLine keeps the line alive so it can keep
  // tracking the next slide.
  hasActiveGliss: (voice, complex) => rollingScore.hasActiveNote(voice, complex),
  // Orphan-line detection — triangle splices a non-gliss line if its
  // (voice, pitch) has no matching active entry in rolling-score for
  // > 500 ms. Catches stuck-line accumulation when the bridge noteoff
  // arrives but the splice misses triangle (cross-module dispatch race,
  // key mismatch, FIFO depth overflow, etc.) — the user-reported "white
  // triangle keeps getting stuck" symptom.
  hasActiveKey: (voice, pitch) => rollingScore.hasActiveKey(voice, pitch),
});

stateUi.init();

// ---- Transport event wiring -----------------------------------------------

// ws status indicators were removed from the UI; stub out the refs so the
// existing open/close handlers don't need to branch.
const dot = { classList: { add() {}, remove() {} } };
const wsStatusEl = { set textContent(_v) {} };
let gyroThrottleFrame = null;
let pendingGyroState = null;

transportOn('open', () => {
  dot.classList.add('connected');
  wsStatusEl.textContent = 'connected';
  wsSend({ type: 'get_diagrams' });
});
transportOn('close', () => {
  dot.classList.remove('connected');
  wsStatusEl.textContent = 'reconnecting...';
});
transportOn('state', (data, move) => {
  cubeScene.update(data);
  stateUi.update(data, move);
});
transportOn('gyroState', (data) => {
  // BLE-rate full state burst — rAF-throttled so we don't repaint at
  // 10 Hz on top of the 60 Hz gyroTick stream.
  pendingGyroState = data;
  if (!gyroThrottleFrame) {
    gyroThrottleFrame = requestAnimationFrame(() => {
      if (pendingGyroState) {
        cubeScene.update(pendingGyroState);
        stateUi.update(pendingGyroState, null);
        pendingGyroState = null;
      }
      gyroThrottleFrame = null;
    });
  }
});
transportOn('gyroTick', (data, dev) => {
  cubeScene.setCubeQuat(data);
  stateUi.updateExpression(data, dev);
});
transportOn('diagrams',     populateDiagramSelect);
transportOn('algorithm',    stateUi.handleAlgorithmEvent);
transportOn('algorithmBook', stateUi.setAlgorithmBook);
transportOn('solve',        () => stateUi.setSolvedBadge(true, true));
transportOn('midiEcho',     handleMidiEcho);

transportConnect();

// ---- MIDI echo dispatch ---------------------------------------------------

// Single point that fans out every WS midi_echo to sieve glows + triangle
// lines + rolling-score notes. The classifier flags (chainStart) live in
// rolling-score (it owns activeMidiNotes); triangle does its own live-
// entry check via _findGlissLine. Both classifiers run on the same WS
// arrival event so they classify identically per the unified contract
// in CLAUDE.md.
function handleMidiEcho(data) {
  if (!data || !data.kind) return;

  if (data.kind === 'panic') {
    rollingScore.panic();
    sievePanic();
    triangle.panic();
    return;
  }

  // Pure-telemetry CC 11 (Expression) echo from the bridge — feeds the
  // rolling-score's brush-size-by-audible-dynamic mapping. No sieve /
  // triangle visualisation depends on it; a missed message just means the
  // next noteon snapshots a slightly stale value (default 64 if no expr
  // has been seen yet for this voice).
  if (data.kind === 'expr') {
    rollingScore.exprChanged(data);
    return;
  }

  const cmx = data.complex | 0;
  const key = `${data.voice}:${data.pitch}`;

  if (data.kind === 'noteon') {
    // D61 — call rollingScore.noteOn FIRST so we capture the unified
    // slide-vs-leap chainStart signal (computed from active state +
    // bend-grace + ±1 pitch tolerance) and feed it to triangle.
    // Without this, triangle's white line silently slid across leaps
    // that fired during bend-grace because its `_findGlissLine` saw
    // the bend-grace-preserved line and treated the leap's noteon as
    // a slide retarget. With chainStart wired through, leaps splice
    // the line and create a fresh instant-snap entry, matching the
    // rolling-chain's break behaviour.
    const isCompanion = data.isCompanion === true;
    const chainStart = rollingScore.noteOn({
      voice:    data.voice,
      pitch:    data.pitch,
      velocity: data.velocity,
      complex:  cmx,
      isCompanion,
    });
    // D72.6 — companions on gliss complexes are pure render-time overlays
    // (a translated re-stroke of the main chain). They have no chain entry,
    // no sieve highlight, no triangle line — skip the visual side-effects
    // that would otherwise need a companion-noteoff to clean up.
    if (isCompanion && (cmx === 5 || cmx === 6 || cmx === 7)) return;
    sieveNoteOn(data.pitch, data.velocity, cmx);
    triangle.noteOn(data.voice, data.pitch, data.velocity, cmx, key, chainStart, isCompanion);
    return;
  }

  if (data.kind === 'noteoff') {
    // rolling-score is authoritative for FIFO pairing — the bridge can
    // emit overlapping noteons on the same pitch (see comments in
    // rolling-score.js's `noteOn`); the *paired* entry is what sieve +
    // triangle need to finalise (its onset, complex, voice — not the
    // request's complex which is uninformative for noteoffs).
    const finalised = rollingScore.noteOff({ voice: data.voice, pitch: data.pitch });
    if (finalised) {
      sieveNoteOff(finalised.pitch);
      triangle.noteOff(finalised.voice, finalised.pitch, finalised.complex, key);
    }
    return;
  }

  if (data.kind === 'bendstep') {
    // D59 — cross-string slide via pitchbend. The bridge bent the
    // held source note from fromPitch to toPitch over durMs and is
    // about to fire noteOff(source) + noteOn(target) at the end.
    // Both modules track the bend so:
    //   • triangle's white line retargets fromPitch→toPitch over durMs
    //     (existing line found → retarget; no existing → create);
    //     a "bend grace window" prevents the source's incoming
    //     noteoff from splicing the line.
    //   • rolling-score adds a bend segment to its chain model and
    //     sets a chain-grace flag so the target's incoming noteon
    //     (which would otherwise have chainStart=true because the
    //     source noteoff cleared the active map) is treated as
    //     continuation.
    rollingScore.bendStep(data);
    triangle.bendStep(data);
    return;
  }
}

// ---- Sequence / mode controls (legacy hidden DOM kept for write-throughs) -

const diagramSelect = document.getElementById('diagram-select');
const cmodeSelect   = document.getElementById('cmode-select');
const resetBtn      = document.getElementById('resetBtn');

function populateDiagramSelect(diagrams) {
  while (diagramSelect.options.length > 1) diagramSelect.remove(1);
  for (const d of diagrams) {
    const opt = document.createElement('option');
    opt.value = d.name;
    opt.textContent = `${d.name} (${d.path.length} steps)`;
    diagramSelect.appendChild(opt);
  }
}

diagramSelect.addEventListener('change', () => {
  const name = diagramSelect.value;
  if (name) wsSend({ type: 'set_diagram', name });
  else      wsSend({ type: 'clear_diagram' });
});

cmodeSelect.addEventListener('change', () => {
  wsSend({ type: 'set_mode', cCube: cmodeSelect.value });
});

resetBtn.addEventListener('click', () => {
  wsSend({ type: 'reset' });
});

// ---- Visible buttons ------------------------------------------------------

document.getElementById('zeroBtn').addEventListener('click', () => {
  cubeScene.zeroGyro();
  wsSend({ type: 'zero_gyro' });
});

// XENAKUBE title doubles as a UI-collapse toggle. CSS `body.ui-hidden` hides
// every chrome panel (state, mode pills, conn row, gizmo cluster, sliders,
// move buffer, algorithm toasts); active K/C cards + sieve + rolling-score +
// cube remain. Persisted across reloads.
const uiToggle = document.getElementById('ui-toggle');
function setUiHidden(hidden) {
  document.body.classList.toggle('ui-hidden', hidden);
  uiToggle.setAttribute('aria-pressed', hidden ? 'true' : 'false');
  cubeScene.setVertexInfoVisible(!hidden);
  localStorage.setItem('uiHidden', hidden ? '1' : '0');
}
setUiHidden(localStorage.getItem('uiHidden') === '1');
uiToggle.addEventListener('click', () => {
  setUiHidden(!document.body.classList.contains('ui-hidden'));
});
uiToggle.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    setUiHidden(!document.body.classList.contains('ui-hidden'));
  }
});

document.getElementById('resetBtnVisible')?.addEventListener('click', async () => {
  // Tell the cube itself "you are now solved" so its internal facelet
  // report re-anchors to reality. Without this the FACELETS stream can
  // stay out of phase with the physical cube.
  if (activeCube) {
    try {
      await activeCube.sendCubeCommand({ type: 'REQUEST_RESET' });
      lastSolvedReport = true;
      stateUi.setSolvedBadge(true, false);
    } catch (e) {
      console.warn('Cube REQUEST_RESET failed:', e);
    }
  }
  wsSend({ type: 'reset' });
});

// ---- Sliders ---------------------------------------------------------------

const gyroSmoothSlider = document.getElementById('gyroSmoothing');
const gyroSmoothVal = document.getElementById('gyroSmoothVal');
gyroSmoothSlider.addEventListener('input', () => {
  const val = parseFloat(gyroSmoothSlider.value);
  gyroSmoothVal.textContent = val.toFixed(2);
  wsSend({ type: 'set_gyro_smoothing', value: val });
});

const scoreSpeedSlider = document.getElementById('scoreSpeed');
const scoreSpeedValEl  = document.getElementById('scoreSpeedVal');
function applyScoreSpeed(val) {
  rollingScore.setScrollSpeed(val);
  scoreSpeedValEl.textContent = String(val | 0);
}
const savedScoreSpeed = parseFloat(localStorage.getItem('scoreSpeed'));
if (isFinite(savedScoreSpeed) && savedScoreSpeed >= 60 && savedScoreSpeed <= 900) {
  scoreSpeedSlider.value = String(savedScoreSpeed | 0);
  applyScoreSpeed(savedScoreSpeed);
}
scoreSpeedSlider.addEventListener('input', () => {
  const val = parseFloat(scoreSpeedSlider.value);
  applyScoreSpeed(val);
  localStorage.setItem('scoreSpeed', String(val));
});

const ghostSizeSlider = document.getElementById('ghostSize');
const ghostSizeValEl  = document.getElementById('ghostSizeVal');
function applyGhostSize(val) {
  cubeScene.setGhostScale(val);
  ghostSizeValEl.textContent = val.toFixed(2);
}
const savedGhostSize = parseFloat(localStorage.getItem('ghostSize'));
if (isFinite(savedGhostSize) && savedGhostSize >= 0.2 && savedGhostSize <= 2.5) {
  ghostSizeSlider.value = savedGhostSize.toFixed(2);
  applyGhostSize(savedGhostSize);
} else {
  applyGhostSize(1.0);
}
ghostSizeSlider.addEventListener('input', () => {
  const val = parseFloat(ghostSizeSlider.value);
  applyGhostSize(val);
  localStorage.setItem('ghostSize', val.toFixed(2));
});

const cubeDepthSlider = document.getElementById('cubeDepth');
const cubeDepthValEl  = document.getElementById('cubeDepthVal');
function applyCubeDepth(val) {
  cubeScene.setCubeDepthOffset(val);
  cubeDepthValEl.textContent = val.toFixed(2);
}
const savedCubeDepth = parseFloat(localStorage.getItem('cubeDepth'));
if (isFinite(savedCubeDepth) && savedCubeDepth >= -3 && savedCubeDepth <= 3) {
  cubeDepthSlider.value = savedCubeDepth.toFixed(2);
  applyCubeDepth(savedCubeDepth);
}
cubeDepthSlider.addEventListener('input', () => {
  const val = parseFloat(cubeDepthSlider.value);
  applyCubeDepth(val);
  localStorage.setItem('cubeDepth', val.toFixed(2));
});

// Background color swatch — overrides CSS `--bg` at runtime so every rule
// referencing var(--bg) (body fill, panel backers, etc.) updates live.
// Persisted in localStorage so the picked colour survives reloads. The
// swatch lives inside .ovl-br which is hidden by `body.ui-hidden`, so
// clicking the title to collapse the chrome hides the picker too.
const bgColorEl    = document.getElementById('bgColor');
const bgColorValEl = document.getElementById('bgColorVal');
function applyBgColor(hex) {
  document.documentElement.style.setProperty('--bg', hex);
  bgColorValEl.textContent = hex;
}
const savedBgColor = localStorage.getItem('bgColor');
if (savedBgColor && /^#[0-9a-fA-F]{6}$/.test(savedBgColor)) {
  bgColorEl.value = savedBgColor;
  applyBgColor(savedBgColor);
} else {
  applyBgColor(bgColorEl.value);
}
bgColorEl.addEventListener('input', () => {
  const hex = bgColorEl.value;
  applyBgColor(hex);
  localStorage.setItem('bgColor', hex);
});

// ---- Cube BLE connection (Web Bluetooth) ----------------------------------

// #cube-status span was removed; stub so existing assignments don't crash.
const cubeStatus = { set textContent(_v) {}, set className(_v) {} };
const connectBtn = document.getElementById('connectBtn');
const macInput = document.getElementById('macAddress');

const SOLVED_FACELETS = 'UUUUUUUUURRRRRRRRRFFFFFFFFFDDDDDDDDDLLLLLLLLLBBBBBBBBB';
let activeCube = null;
let lastSolvedReport = true;

if (localStorage.getItem('ganMacAddress')) {
  macInput.value = localStorage.getItem('ganMacAddress');
}

connectBtn.addEventListener('click', async () => {
  const macAddress = macInput.value.trim().toUpperCase();
  const macRegex = /^([0-9A-F]{2}[:-]){5}([0-9A-F]{2})$/;
  if (!macRegex.test(macAddress)) {
    cubeStatus.textContent = 'invalid MAC';
    cubeStatus.className = 'err';
    return;
  }

  localStorage.setItem('ganMacAddress', macAddress);
  cubeStatus.textContent = 'select cube in popup...';
  cubeStatus.className = '';
  connectBtn.disabled = true;

  try {
    const cube = await connectGanCube(async (device, isFallbackCall) => macAddress);
    activeCube = cube;

    cubeStatus.textContent = 'connected';
    cubeStatus.className = 'ok';
    connectBtn.textContent = 'Connected';
    connectBtn.classList.add('connected');
    connectBtn.disabled = true;
    cubeScene.applyConnectView();

    cube.events$.subscribe((event) => {
      if (event.type === 'MOVE') {
        wsSend({ type: 'move', value: event.move });
      } else if (event.type === 'FACELETS') {
        const solved = event.facelets === SOLVED_FACELETS;
        if (solved && !lastSolvedReport) {
          // Edge fires only through the relay → WS solve message → setSolvedBadge,
          // so the pulse stays in sync with the OSC /xk/solve emit.
          wsSend({ type: 'cube_solved' });
        } else if (!solved && lastSolvedReport) {
          stateUi.setSolvedBadge(false, false);
        }
        lastSolvedReport = solved;
      } else if (event.type === 'GYRO' || event.type === 'GYROSCOPE' || event.gyro) {
        wsSend({ type: 'gyro', data: event.gyro || event });
      } else if (event.type === 'DISCONNECT') {
        activeCube = null;
        cubeStatus.textContent = 'disconnected';
        cubeStatus.className = 'err';
        connectBtn.textContent = 'Connect';
        connectBtn.classList.remove('connected');
        connectBtn.disabled = false;
        cubeScene.revertConnectView();
      }
    });

  } catch (err) {
    console.error('Cube connect error:', err);
    cubeStatus.textContent = 'failed: ' + err.message;
    cubeStatus.className = 'err';
    connectBtn.disabled = false;
  }
});
