// public/js/main.js
//
// Phase 2.9 — module entry point. Imports every dashboard module, calls
// each one's init(), then wires:
//   • transport events → module update entry points
//   • DOM controls (sliders, buttons, MAC field) → transport.send / module setters
//   • Web Bluetooth GAN cube connection → transport (move / gyro / facelets)
//   • the visual-invariant cross-module reads (rolling-score ←→ triangle's
//     gliss display, state-ui ← cube-scene's active card-anchor projection)
//     so paired modules don't need direct imports
//
// dashboard.html is now HTML + a single <script type="module" src="./js/main.js">
// — everything that used to live in the inline <script> block has moved
// into one of the modules below.

import { connectGanCube } from 'https://cdn.jsdelivr.net/npm/gan-web-bluetooth@3.0.2/+esm';

import {
  connect as transportConnect,
  send    as transportSend,
  on      as transportOn,
} from './transport.js';

import * as cubeScene from './cube-scene.js';
import * as rollingScore from './rolling-score.js';
import * as spectrumScore from './spectrum-score.js';
import * as performanceRecorder from './performance-recorder.js';
import * as triangle from './triangle.js';
import * as stateUi from './state-ui.js';
import { initInterruptionLayer } from '../interruption/index.js';
import {
  noteOn        as sieveNoteOn,
  noteOff       as sieveNoteOff,
  panic         as sievePanic,
  getCellRect   as getSieveCellRect,
} from './sieve.js';
import { install as installSettingsSync } from './settings-sync.js';

// Bootstrap-from-server already ran synchronously in dashboard.html (so the
// localStorage reads below see the file's values); this installs the push
// side — debounced POST to /api/dashboard-settings on every change touching
// a synced key, so settings persist across machines through the repo.
installSettingsSync();

const wsSend = transportSend;

// ---- Init modules ----------------------------------------------------------

cubeScene.init({
  // Auto-zero fires once after the cube-connect view orbit lands. Mirror
  // the zero to the relay so the engine's snap cells re-center on the
  // same rest pose the visual just adopted (otherwise snap thresholds
  // stay anchored to the raw sensor frame and feel asymmetric).
  onAutoZero: () => wsSend({ type: 'zero_gyro' }),
});

function setSpectrumStatusText(text) {
  const el = document.getElementById('spectrumStatus');
  if (el) el.textContent = text || 'off';
}

spectrumScore.init({
  onStatus: setSpectrumStatusText,
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

stateUi.init({
  getActiveCardAnchorScreenPos: cubeScene.getActiveCardAnchorScreenPos,
});

const intrusionParams = new URLSearchParams(window.location.search);
const interruptionLayer = initInterruptionLayer({
  enabled: intrusionParams.get('intrusions') === '1',
  debug: intrusionParams.get('intrusionDebug') === '1',
  root: document.body,
  getCamera: cubeScene.getCamera,
  getActiveKWorldPos: cubeScene.getActiveKWorldPos,
  getCWorldPos: cubeScene.getCWorldPos,
});

// ---- Transport event wiring -----------------------------------------------

// ws status indicators were removed from the UI; stub out the refs so the
// existing open/close handlers don't need to branch.
const dot = { classList: { add() {}, remove() {} } };
const wsStatusEl = { set textContent(_v) {} };
let gyroThrottleFrame = null;
let pendingGyroState = null;
let currentCosmology = 'beta-cosmo';
let spectrumEnabled = false;
let midiBrushEnabled = true;
let currentScoreSpeed = 360;
let currentSpectrumLatencyMs = 120;
let currentSpectrumNudgeMs = 0;

transportOn('open', () => {
  dot.classList.add('connected');
  wsStatusEl.textContent = 'connected';
  wsSend({ type: 'get_diagrams' });
  wsSend({ type: 'set_spectrum_enabled', enabled: spectrumEnabled });
});
transportOn('close', () => {
  dot.classList.remove('connected');
  wsStatusEl.textContent = 'reconnecting...';
  interruptionLayer.onPanic();
});
transportOn('state', (data, move) => {
  if (data.cosmology) currentCosmology = data.cosmology;
  spectrumScore.updateState(data);
  cubeScene.update(data, move);
  stateUi.update(data, move);
  updateMotionHUD(data.motion);
  if (move) verifyMoveRemap(move);
  interruptionLayer.onState(data, move);
});
transportOn('gyroState', (data) => {
  // BLE-rate full state burst — rAF-throttled so we don't repaint at
  // 10 Hz on top of the 60 Hz gyroTick stream.
  pendingGyroState = data;
  if (!gyroThrottleFrame) {
    gyroThrottleFrame = requestAnimationFrame(() => {
      if (pendingGyroState) {
        spectrumScore.updateState(pendingGyroState);
        cubeScene.update(pendingGyroState, null);
        stateUi.update(pendingGyroState, null);
        if (pendingGyroState.cosmology) currentCosmology = pendingGyroState.cosmology;
        updateMotionHUD(pendingGyroState.motion);
        interruptionLayer.onState(pendingGyroState, null);
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
transportOn('algorithm',    (data) => {
  stateUi.handleAlgorithmEvent(data);
  interruptionLayer.onAlgorithm(data);
});
transportOn('algorithmBook', stateUi.setAlgorithmBook);
transportOn('phrasePlan',   stateUi.handlePhrasePlan);
transportOn('phraseAudit',  stateUi.handlePhraseAudit);
transportOn('solve',        () => {
  stateUi.setSolvedBadge(true, true);
  interruptionLayer.onSolve();
});
transportOn('midiEcho',     handleMidiEcho);
transportOn('spectrumFrame', spectrumScore.handleFrame);
transportOn('spectrumStatus', (data) => {
  if (data?.enabled === false && spectrumEnabled) setSpectrumStatusText('relay');
});

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
  interruptionLayer.onMidiEcho(data);

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
  interruptionLayer.onPanic();
});

// ---- Visible buttons ------------------------------------------------------

document.getElementById('zeroBtn').addEventListener('click', () => {
  cubeScene.zeroGyro();
  wsSend({ type: 'zero_gyro' });
});

document.getElementById('mode-cosmology')?.addEventListener('click', () => {
  const next = currentCosmology === 'alpha-cosmo' ? 'beta-cosmo' : 'alpha-cosmo';
  currentCosmology = next;
  stateUi.setCosmologyBadge(next);
  wsSend({ type: 'set_mode', cosmology: next });
  interruptionLayer.onPanic();
});

// XENAKUBE title doubles as a UI-collapse toggle. CSS `body.ui-hidden` hides
// every chrome panel (state, mode pills, conn row, gizmo cluster, sliders,
// move buffer, algorithm toasts, floating K/C cards); sieve + rolling-score +
// cube remain, including the K-vertex intensity / density / duration labels.
// Title stays as a faint outline so the toggle target is still hittable.
// Persisted across reloads.
const uiToggle = document.getElementById('ui-toggle');
function setUiHidden(hidden) {
  document.body.classList.toggle('ui-hidden', hidden);
  uiToggle.setAttribute('aria-pressed', hidden ? 'true' : 'false');
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
  interruptionLayer.onPanic();
});

// ---- Sliders ---------------------------------------------------------------

const gyroSmoothSlider = document.getElementById('gyroSmoothing');
const gyroSmoothVal = document.getElementById('gyroSmoothVal');
gyroSmoothSlider.addEventListener('input', () => {
  const val = parseFloat(gyroSmoothSlider.value);
  gyroSmoothVal.textContent = val.toFixed(2);
  wsSend({ type: 'set_gyro_smoothing', value: val });
});

const stillThresholdSlider = document.getElementById('stillThreshold');
const stillThresholdVal = document.getElementById('stillThresholdVal');
stillThresholdSlider.addEventListener('input', () => {
  const val = parseFloat(stillThresholdSlider.value);
  stillThresholdVal.textContent = val.toFixed(2);
  wsSend({ type: 'set_still_threshold', value: val });
});

const motionStillEl = document.getElementById('motionStill');
const motionDwellEl = document.getElementById('motionDwell');
function updateMotionHUD(motion) {
  if (!motion) return;
  if (motion.isStill) {
    motionStillEl.textContent = '●';
    motionStillEl.classList.add('still');
  } else {
    motionStillEl.textContent = '·';
    motionStillEl.classList.remove('still');
  }
  motionDwellEl.textContent = `${motion.dwellMs | 0} ms`;
}

const scoreSpeedSlider = document.getElementById('scoreSpeed');
const scoreSpeedValEl  = document.getElementById('scoreSpeedVal');
function applyScoreSpeed(val) {
  currentScoreSpeed = val;
  rollingScore.setScrollSpeed(val);
  spectrumScore.setScrollSpeed(val);
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

const midiBrushToggle = document.getElementById('midiBrushToggle');
const spectrogramToggle = document.getElementById('spectrogramToggle');
const spectrogramSettingsToggle = document.getElementById('spectrogramSettingsToggle');
const spectrogramSettingsPanel = document.getElementById('spectrogramSettingsPanel');
const spectrogramSettingsClose = document.getElementById('spectrogramSettingsClose');
const cubeColorsToggle = document.getElementById('cubeColorsToggle');
const cubeColorsPanel = document.getElementById('cubeColorsPanel');
const cubeColorsClose = document.getElementById('cubeColorsClose');
const cubeColorsEditor = document.getElementById('cubeColorsEditor');
const resetCubeColorsBtn = document.getElementById('resetCubeColors');
const spectrumLatencySlider = document.getElementById('spectrumLatency');
const spectrumLatencyValEl = document.getElementById('spectrumLatencyVal');
const spectrumNudgeSlider = document.getElementById('spectrumNudge');
const spectrumNudgeValEl = document.getElementById('spectrumNudgeVal');
const spectrumGainSlider = document.getElementById('spectrumGain');
const spectrumGainValEl = document.getElementById('spectrumGainVal');
const spectrumFloorSlider = document.getElementById('spectrumFloor');
const spectrumFloorValEl = document.getElementById('spectrumFloorVal');
const spectrumCeilingSlider = document.getElementById('spectrumCeiling');
const spectrumCeilingValEl = document.getElementById('spectrumCeilingVal');
const spectrumBgSlider = document.getElementById('spectrumBg');
const spectrumBgValEl = document.getElementById('spectrumBgVal');
const spectrumBgColorEl = document.getElementById('spectrumBgColor');
const spectrumCeilingColorEl = document.getElementById('spectrumCeilingColor');
const spectrumSmoothSlider = document.getElementById('spectrumSmooth');
const spectrumSmoothValEl = document.getElementById('spectrumSmoothVal');
const spectrumBlurSlider = document.getElementById('spectrumBlur');
const spectrumBlurValEl = document.getElementById('spectrumBlurVal');
const spectrumTimeSlider = document.getElementById('spectrumTime');
const spectrumTimeValEl = document.getElementById('spectrumTimeVal');
const spectrumPaletteEl = document.getElementById('spectrumPalette');
const modalityPaletteEditor = document.getElementById('modalityPaletteEditor');
const resetModalityPalettesBtn = document.getElementById('resetModalityPalettes');
const recordModeEl = document.getElementById('recordMode');
const recordBeginBtn = document.getElementById('recordBeginBtn');
const recordEndBtn = document.getElementById('recordEndBtn');
const recordStatusEl = document.getElementById('recordStatus');

function setLayerButton(btn, active) {
  if (!btn) return;
  btn.classList.toggle('active', active);
  btn.setAttribute('aria-pressed', active ? 'true' : 'false');
}

function setSpectrogramSettingsOpen(open) {
  const active = open === true;
  if (active) setCubeColorsOpen(false);
  if (spectrogramSettingsPanel) spectrogramSettingsPanel.hidden = !active;
  if (spectrogramSettingsToggle) {
    spectrogramSettingsToggle.classList.toggle('active', active);
    spectrogramSettingsToggle.setAttribute('aria-pressed', active ? 'true' : 'false');
    spectrogramSettingsToggle.setAttribute('aria-expanded', active ? 'true' : 'false');
  }
}

function setCubeColorsOpen(open) {
  const active = open === true;
  if (active) setSpectrogramSettingsOpen(false);
  if (cubeColorsPanel) cubeColorsPanel.hidden = !active;
  if (cubeColorsToggle) {
    cubeColorsToggle.classList.toggle('active', active);
    cubeColorsToggle.setAttribute('aria-pressed', active ? 'true' : 'false');
    cubeColorsToggle.setAttribute('aria-expanded', active ? 'true' : 'false');
  }
}

function applySpectrumTiming() {
  spectrumScore.setTiming({
    latencyMs: currentSpectrumLatencyMs,
    nudgeMs: currentSpectrumNudgeMs,
  });
  rollingScore.setVisualDelay(spectrumEnabled ? currentSpectrumLatencyMs : 0);
}

function applyMidiBrushEnabled(enabled, persist = true) {
  midiBrushEnabled = enabled === true;
  rollingScore.setVisible(midiBrushEnabled);
  setLayerButton(midiBrushToggle, midiBrushEnabled);
  if (persist) localStorage.setItem('midiBrushEnabled', midiBrushEnabled ? '1' : '0');
}

function applySpectrogramEnabled(enabled, persist = true) {
  spectrumEnabled = enabled === true;
  spectrumScore.setEnabled(spectrumEnabled);
  applySpectrumTiming();
  setLayerButton(spectrogramToggle, spectrumEnabled);
  wsSend({ type: 'set_spectrum_enabled', enabled: spectrumEnabled });
  if (persist) localStorage.setItem('spectrogramEnabled', spectrumEnabled ? '1' : '0');
}

function readBoolSetting(key, fallback) {
  const v = localStorage.getItem(key);
  if (v === '1') return true;
  if (v === '0') return false;
  return fallback;
}

const visualParams = new URLSearchParams(window.location.search);
const urlSpectrum = visualParams.get('spectrogram');
const urlMidi = visualParams.get('midi');
applyMidiBrushEnabled(urlMidi === '0' ? false : readBoolSetting('midiBrushEnabled', true), false);
applySpectrogramEnabled(urlSpectrum === '1' ? true : (urlSpectrum === '0' ? false : readBoolSetting('spectrogramEnabled', false)), false);

const savedSpectrumLatency = parseFloat(localStorage.getItem('spectrumLatencyMs'));
if (isFinite(savedSpectrumLatency) && savedSpectrumLatency >= 0 && savedSpectrumLatency <= 250) {
  currentSpectrumLatencyMs = savedSpectrumLatency;
  spectrumLatencySlider.value = String(savedSpectrumLatency | 0);
}
spectrumLatencyValEl.textContent = String(currentSpectrumLatencyMs | 0);

const savedSpectrumNudge = parseFloat(localStorage.getItem('spectrumNudgeMs'));
if (isFinite(savedSpectrumNudge) && savedSpectrumNudge >= -200 && savedSpectrumNudge <= 200) {
  currentSpectrumNudgeMs = savedSpectrumNudge;
  spectrumNudgeSlider.value = String(savedSpectrumNudge | 0);
}
spectrumNudgeValEl.textContent = String(currentSpectrumNudgeMs | 0);
applySpectrumTiming();

midiBrushToggle?.addEventListener('click', () => {
  applyMidiBrushEnabled(!midiBrushEnabled);
});
spectrogramToggle?.addEventListener('click', () => {
  applySpectrogramEnabled(!spectrumEnabled);
});
spectrogramSettingsToggle?.addEventListener('click', () => {
  setSpectrogramSettingsOpen(spectrogramSettingsPanel?.hidden !== false);
});
spectrogramSettingsClose?.addEventListener('click', () => {
  setSpectrogramSettingsOpen(false);
});
cubeColorsToggle?.addEventListener('click', () => {
  setCubeColorsOpen(cubeColorsPanel?.hidden !== false);
});
cubeColorsClose?.addEventListener('click', () => {
  setCubeColorsOpen(false);
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && spectrogramSettingsPanel?.hidden === false) {
    setSpectrogramSettingsOpen(false);
  }
  if (e.key === 'Escape' && cubeColorsPanel?.hidden === false) {
    setCubeColorsOpen(false);
  }
});
spectrumLatencySlider?.addEventListener('input', () => {
  currentSpectrumLatencyMs = parseFloat(spectrumLatencySlider.value) || 0;
  spectrumLatencyValEl.textContent = String(currentSpectrumLatencyMs | 0);
  localStorage.setItem('spectrumLatencyMs', String(currentSpectrumLatencyMs));
  applySpectrumTiming();
});
spectrumNudgeSlider?.addEventListener('input', () => {
  currentSpectrumNudgeMs = parseFloat(spectrumNudgeSlider.value) || 0;
  spectrumNudgeValEl.textContent = String(currentSpectrumNudgeMs | 0);
  localStorage.setItem('spectrumNudgeMs', String(currentSpectrumNudgeMs));
  applySpectrumTiming();
});

const savedSpectrumGain = parseFloat(localStorage.getItem('spectrumGainDb'));
const initialSpectrumGain = isFinite(savedSpectrumGain) ? clampInt(savedSpectrumGain, -30, 30) : 0;
if (spectrumGainSlider) spectrumGainSlider.value = String(initialSpectrumGain);
if (spectrumGainValEl) spectrumGainValEl.textContent = String(initialSpectrumGain);
spectrumScore.setGainOffset(initialSpectrumGain);
spectrumGainSlider?.addEventListener('input', () => {
  const v = clampInt(parseFloat(spectrumGainSlider.value), -30, 30);
  spectrumGainValEl.textContent = String(v);
  spectrumScore.setGainOffset(v);
  localStorage.setItem('spectrumGainDb', String(v));
  saveModalityTransferSettings();
  renderModalityPaletteEditor();
});

const savedSpectrumCeiling = parseFloat(localStorage.getItem('spectrumCeilingDb'));
const initialSpectrumCeiling = isFinite(savedSpectrumCeiling) ? clampInt(savedSpectrumCeiling, -60, 0) : -15;
const appliedSpectrumCeiling = spectrumScore.setCeilingDb(initialSpectrumCeiling);
if (spectrumCeilingSlider) spectrumCeilingSlider.value = String(appliedSpectrumCeiling | 0);
if (spectrumCeilingValEl) spectrumCeilingValEl.textContent = String(appliedSpectrumCeiling | 0);
spectrumCeilingSlider?.addEventListener('input', () => {
  const v = clampInt(parseFloat(spectrumCeilingSlider.value), -60, 0);
  const applied = spectrumScore.setCeilingDb(v);
  spectrumCeilingSlider.value = String(applied | 0);
  spectrumCeilingValEl.textContent = String(applied | 0);
  localStorage.setItem('spectrumCeilingDb', String(applied | 0));
  saveModalityTransferSettings();
  renderModalityPaletteEditor();
});

const savedSpectrumFloor = parseFloat(localStorage.getItem('spectrumFloorDb'));
const initialSpectrumFloor = isFinite(savedSpectrumFloor) ? clampInt(savedSpectrumFloor, -130, -50) : -95;
const appliedSpectrumFloor = spectrumScore.setFloorDb(initialSpectrumFloor);
if (spectrumFloorSlider) spectrumFloorSlider.value = String(appliedSpectrumFloor | 0);
if (spectrumFloorValEl) spectrumFloorValEl.textContent = String(appliedSpectrumFloor | 0);
spectrumFloorSlider?.addEventListener('input', () => {
  const v = clampInt(parseFloat(spectrumFloorSlider.value), -130, -50);
  const applied = spectrumScore.setFloorDb(v);
  spectrumFloorSlider.value = String(applied | 0);
  spectrumFloorValEl.textContent = String(applied | 0);
  localStorage.setItem('spectrumFloorDb', String(applied | 0));
  saveModalityTransferSettings();
  renderModalityPaletteEditor();
});

const savedSpectrumBg = parseFloat(localStorage.getItem('spectrumBgPct'));
const initialSpectrumBg = isFinite(savedSpectrumBg) ? clampInt(savedSpectrumBg, 0, 40) : 10;
if (spectrumBgSlider) spectrumBgSlider.value = String(initialSpectrumBg);
if (spectrumBgValEl) spectrumBgValEl.textContent = String(initialSpectrumBg);
spectrumScore.setMinUnit(initialSpectrumBg / 100);
spectrumBgSlider?.addEventListener('input', () => {
  const v = clampInt(parseFloat(spectrumBgSlider.value), 0, 40);
  spectrumBgValEl.textContent = String(v);
  spectrumScore.setMinUnit(v / 100);
  localStorage.setItem('spectrumBgPct', String(v));
});

const savedSpectrumSmooth = parseFloat(localStorage.getItem('spectrumSmoothPct'));
const initialSpectrumSmooth = isFinite(savedSpectrumSmooth) ? clampInt(savedSpectrumSmooth, 0, 120) : 67;
if (spectrumSmoothSlider) spectrumSmoothSlider.value = String(initialSpectrumSmooth);
if (spectrumSmoothValEl) spectrumSmoothValEl.textContent = String(initialSpectrumSmooth);
spectrumScore.setSmoothDensity(initialSpectrumSmooth / 100);
spectrumSmoothSlider?.addEventListener('input', () => {
  const v = clampInt(parseFloat(spectrumSmoothSlider.value), 0, 120);
  spectrumSmoothValEl.textContent = String(v);
  spectrumScore.setSmoothDensity(v / 100);
  localStorage.setItem('spectrumSmoothPct', String(v));
});

const savedSpectrumBlur = parseFloat(localStorage.getItem('spectrumBlurTenths'));
const initialSpectrumBlur = isFinite(savedSpectrumBlur) ? clampInt(savedSpectrumBlur, 0, 40) : 8;
if (spectrumBlurSlider) spectrumBlurSlider.value = String(initialSpectrumBlur);
if (spectrumBlurValEl) spectrumBlurValEl.textContent = String(initialSpectrumBlur);
spectrumScore.setBlurPx(initialSpectrumBlur / 10);
spectrumBlurSlider?.addEventListener('input', () => {
  const v = clampInt(parseFloat(spectrumBlurSlider.value), 0, 40);
  spectrumBlurValEl.textContent = String(v);
  spectrumScore.setBlurPx(v / 10);
  localStorage.setItem('spectrumBlurTenths', String(v));
});

const savedSpectrumTime = parseFloat(localStorage.getItem('spectrumTimePct'));
const initialSpectrumTime = isFinite(savedSpectrumTime) ? clampInt(savedSpectrumTime, 0, 95) : 65;
if (spectrumTimeSlider) spectrumTimeSlider.value = String(initialSpectrumTime);
if (spectrumTimeValEl) spectrumTimeValEl.textContent = String(initialSpectrumTime);
spectrumScore.setTemporalSmoothing(initialSpectrumTime / 100);
spectrumTimeSlider?.addEventListener('input', () => {
  const v = clampInt(parseFloat(spectrumTimeSlider.value), 0, 95);
  spectrumTimeValEl.textContent = String(v);
  spectrumScore.setTemporalSmoothing(v / 100);
  localStorage.setItem('spectrumTimePct', String(v));
});

const savedSpectrumPalette = localStorage.getItem('spectrumPalette');
const paletteNames = spectrumScore.getPaletteNames();
const initialPalette = paletteNames.includes(savedSpectrumPalette) ? savedSpectrumPalette : 'auto';
if (spectrumPaletteEl) spectrumPaletteEl.value = initialPalette;
spectrumScore.setPalette(initialPalette);
spectrumPaletteEl?.addEventListener('change', () => {
  const v = spectrumPaletteEl.value;
  spectrumScore.setPalette(v);
  localStorage.setItem('spectrumPalette', v);
});

const MODALITY_PALETTE_STORAGE = 'spectrumModalityPalettes';
const MODALITY_TRANSFER_STORAGE = 'spectrumModalityTransfer';
const SPECTRUM_BG_COLOR_STORAGE = 'spectrumBgColor';
const SPECTRUM_CEILING_COLOR_STORAGE = 'spectrumCeilingColor';

function modalityPaletteStorageShape() {
  const settings = spectrumScore.getModalityPaletteSettings();
  const out = {};
  for (const [complex, info] of Object.entries(settings)) {
    out[complex] = info.stops.map((stop) => stop.hex);
  }
  return out;
}

function saveModalityPaletteSettings() {
  localStorage.setItem(MODALITY_PALETTE_STORAGE, JSON.stringify(modalityPaletteStorageShape()));
}

function modalityTransferStorageShape() {
  const settings = spectrumScore.getModalityPaletteSettings();
  const out = {};
  for (const [complex, info] of Object.entries(settings)) {
    out[complex] = {
      gainOffsetDb: info.gainOffsetDb,
      floorDb: info.floorDb,
      ceilingDb: info.ceilingDb,
    };
  }
  return out;
}

function saveModalityTransferSettings() {
  localStorage.setItem(MODALITY_TRANSFER_STORAGE, JSON.stringify(modalityTransferStorageShape()));
}

function applySavedModalityPaletteSettings() {
  const raw = localStorage.getItem(MODALITY_PALETTE_STORAGE);
  if (!raw) return { backgroundColor: null, ceilingColor: null };
  let savedBackgroundColor = null;
  let savedCeilingColor = null;
  try {
    const saved = JSON.parse(raw);
    for (const [complex, colors] of Object.entries(saved || {})) {
      if (!Array.isArray(colors)) continue;
      colors.forEach((hex, idx) => {
        if (idx === 0) {
          if (!savedBackgroundColor && typeof hex === 'string') savedBackgroundColor = hex;
          return;
        }
        if (idx === colors.length - 1) {
          if (!savedCeilingColor && typeof hex === 'string') savedCeilingColor = hex;
          return;
        }
        spectrumScore.setModalityPaletteStop(parseInt(complex, 10), idx, hex);
      });
    }
    return { backgroundColor: savedBackgroundColor, ceilingColor: savedCeilingColor };
  } catch (err) {
    console.warn('[spectrogram settings] ignoring saved modality palettes:', err);
    localStorage.removeItem(MODALITY_PALETTE_STORAGE);
    return { backgroundColor: null, ceilingColor: null };
  }
}

function applySavedModalityTransferSettings() {
  const raw = localStorage.getItem(MODALITY_TRANSFER_STORAGE);
  if (!raw) return;
  try {
    const saved = JSON.parse(raw);
    for (const [complex, settings] of Object.entries(saved || {})) {
      spectrumScore.setModalityTransfer(parseInt(complex, 10), settings);
    }
  } catch (err) {
    console.warn('[spectrogram settings] ignoring saved modality transfer settings:', err);
    localStorage.removeItem(MODALITY_TRANSFER_STORAGE);
  }
}

function formatDb(v) {
  return String(Math.round(Number(v) || 0));
}

function makeModalityTransferControl(cmx, key, label, min, max, value, onApply) {
  const wrap = document.createElement('label');
  wrap.className = 'modality-transfer-control';
  wrap.title = `C${cmx} ${label}`;

  const title = document.createElement('span');
  title.className = 'mt-label';
  title.textContent = label;

  const input = document.createElement('input');
  input.type = 'range';
  input.min = String(min);
  input.max = String(max);
  input.step = '1';
  input.value = formatDb(value);
  input.dataset.modalityControl = key;

  const val = document.createElement('span');
  val.className = 'mt-val';
  val.textContent = formatDb(value);

  input.addEventListener('input', () => {
    const applied = onApply(parseFloat(input.value) || 0);
    input.value = formatDb(applied[key]);
    val.textContent = formatDb(applied[key]);
    const row = input.closest('.modality-palette-row');
    const floorInput = row?.querySelector('input[data-modality-control="floorDb"]');
    const ceilingInput = row?.querySelector('input[data-modality-control="ceilingDb"]');
    const floorVal = floorInput?.parentElement?.querySelector('.mt-val');
    const ceilingVal = ceilingInput?.parentElement?.querySelector('.mt-val');
    if (floorInput) floorInput.value = formatDb(applied.floorDb);
    if (floorVal) floorVal.textContent = formatDb(applied.floorDb);
    if (ceilingInput) ceilingInput.value = formatDb(applied.ceilingDb);
    if (ceilingVal) ceilingVal.textContent = formatDb(applied.ceilingDb);
    saveModalityTransferSettings();
  });

  wrap.appendChild(title);
  wrap.appendChild(input);
  wrap.appendChild(val);
  return wrap;
}

function renderModalityPaletteEditor() {
  if (!modalityPaletteEditor) return;
  modalityPaletteEditor.textContent = '';
  const settings = spectrumScore.getModalityPaletteSettings();
  for (const complex of Object.keys(settings).sort((a, b) => Number(a) - Number(b))) {
    const info = settings[complex];
    const cmx = parseInt(complex, 10);
    const row = document.createElement('div');
    row.className = 'modality-palette-row';

    const label = document.createElement('div');
    label.className = 'modality-palette-label';
    const code = document.createElement('span');
    code.className = 'cmx';
    code.textContent = 'C' + cmx;
    const name = document.createElement('span');
    name.className = 'name';
    name.textContent = String(info.label || '').replace(/^C\d+\s*/, '') || 'modality';
    label.appendChild(code);
    label.appendChild(name);

    const body = document.createElement('div');
    body.className = 'modality-palette-body';

    const transfer = document.createElement('div');
    transfer.className = 'modality-transfer-controls';
    transfer.appendChild(makeModalityTransferControl(cmx, 'gainOffsetDb', 'gain', -30, 30, info.gainOffsetDb, (v) => (
      spectrumScore.setModalityTransfer(cmx, { gainOffsetDb: clampInt(v, -30, 30) })
    )));
    transfer.appendChild(makeModalityTransferControl(cmx, 'floorDb', 'floor', -130, -50, info.floorDb, (v) => (
      spectrumScore.setModalityTransfer(cmx, { floorDb: clampInt(v, -130, -50) })
    )));
    transfer.appendChild(makeModalityTransferControl(cmx, 'ceilingDb', 'ceil', -60, 0, info.ceilingDb, (v) => (
      spectrumScore.setModalityTransfer(cmx, { ceilingDb: clampInt(v, -60, 0) })
    )));

    const stops = document.createElement('div');
    stops.className = 'palette-stops';
    for (const stop of info.stops) {
      if (stop.stop === 0 || stop.stop === 1) continue;
      const stopLabel = document.createElement('label');
      stopLabel.className = 'palette-stop';
      stopLabel.title = `C${cmx} palette stop ${stop.stop.toFixed(2)}`;

      const input = document.createElement('input');
      input.type = 'color';
      input.value = stop.hex;
      input.setAttribute('aria-label', `C${cmx} palette stop ${stop.stop.toFixed(2)}`);
      input.addEventListener('input', () => {
        if (spectrumScore.setModalityPaletteStop(cmx, stop.index, input.value)) {
          saveModalityPaletteSettings();
        }
      });

      const value = document.createElement('span');
      value.textContent = stop.stop.toFixed(2).replace(/^0/, '');
      stopLabel.appendChild(input);
      stopLabel.appendChild(value);
      stops.appendChild(stopLabel);
    }

    body.appendChild(transfer);
    body.appendChild(stops);
    row.appendChild(label);
    row.appendChild(body);
    modalityPaletteEditor.appendChild(row);
  }
}

const savedModalityEndpointColors = applySavedModalityPaletteSettings();
const savedSpectrumBgColor = localStorage.getItem(SPECTRUM_BG_COLOR_STORAGE);
const initialSpectrumBgColor = savedSpectrumBgColor || savedModalityEndpointColors.backgroundColor;
if (initialSpectrumBgColor && spectrumScore.setAllModalityBackgroundColors(initialSpectrumBgColor)) {
  localStorage.setItem(SPECTRUM_BG_COLOR_STORAGE, spectrumScore.getModalityBackgroundColor());
}
const savedSpectrumCeilingColor = localStorage.getItem(SPECTRUM_CEILING_COLOR_STORAGE);
const initialSpectrumCeilingColor = savedSpectrumCeilingColor || savedModalityEndpointColors.ceilingColor;
if (initialSpectrumCeilingColor && spectrumScore.setAllModalityCeilingColors(initialSpectrumCeilingColor)) {
  localStorage.setItem(SPECTRUM_CEILING_COLOR_STORAGE, spectrumScore.getModalityCeilingColor());
}
applySavedModalityTransferSettings();
if (spectrumBgColorEl) {
  spectrumBgColorEl.value = spectrumScore.getModalityBackgroundColor();
  spectrumBgColorEl.addEventListener('input', () => {
    if (spectrumScore.setAllModalityBackgroundColors(spectrumBgColorEl.value)) {
      localStorage.setItem(SPECTRUM_BG_COLOR_STORAGE, spectrumScore.getModalityBackgroundColor());
      saveModalityPaletteSettings();
    }
  });
}
if (spectrumCeilingColorEl) {
  spectrumCeilingColorEl.value = spectrumScore.getModalityCeilingColor();
  spectrumCeilingColorEl.addEventListener('input', () => {
    if (spectrumScore.setAllModalityCeilingColors(spectrumCeilingColorEl.value)) {
      localStorage.setItem(SPECTRUM_CEILING_COLOR_STORAGE, spectrumScore.getModalityCeilingColor());
      saveModalityPaletteSettings();
    }
  });
}
renderModalityPaletteEditor();
resetModalityPalettesBtn?.addEventListener('click', () => {
  spectrumScore.resetModalityPalettes();
  localStorage.removeItem(MODALITY_PALETTE_STORAGE);
  localStorage.removeItem(MODALITY_TRANSFER_STORAGE);
  localStorage.removeItem('spectrumGainDb');
  localStorage.removeItem('spectrumFloorDb');
  localStorage.removeItem('spectrumCeilingDb');
  spectrumScore.setGainOffset(0);
  spectrumScore.setFloorDb(-95);
  spectrumScore.setCeilingDb(-15);
  if (spectrumGainSlider) spectrumGainSlider.value = '0';
  if (spectrumGainValEl) spectrumGainValEl.textContent = '0';
  if (spectrumFloorSlider) spectrumFloorSlider.value = '-95';
  if (spectrumFloorValEl) spectrumFloorValEl.textContent = '-95';
  if (spectrumCeilingSlider) spectrumCeilingSlider.value = '-15';
  if (spectrumCeilingValEl) spectrumCeilingValEl.textContent = '-15';
  if (spectrumBgColorEl) spectrumBgColorEl.value = spectrumScore.getModalityBackgroundColor();
  if (spectrumCeilingColorEl) spectrumCeilingColorEl.value = spectrumScore.getModalityCeilingColor();
  renderModalityPaletteEditor();
});

const CUBE_COLOR_STORAGE = 'cubeColorSettings';

function setCubeAppearanceAndSync(settings = {}) {
  const applied = cubeScene.setAppearance(settings);
  stateUi.setAppearance(applied);
  return applied;
}

function syncCardAppearanceFromCube() {
  stateUi.setAppearance(cubeScene.getAppearance());
}

function saveCubeColorSettings() {
  localStorage.setItem(CUBE_COLOR_STORAGE, JSON.stringify({
    cube: cubeScene.getAppearance(),
    triangle: triangle.getAppearance(),
  }));
}

function applySavedCubeColorSettings() {
  const raw = localStorage.getItem(CUBE_COLOR_STORAGE);
  if (!raw) return;
  try {
    const saved = JSON.parse(raw);
    if (saved?.cube) setCubeAppearanceAndSync(saved.cube);
    if (saved?.triangle) triangle.setAppearance(saved.triangle);
  } catch (err) {
    console.warn('[cube colors] ignoring saved appearance settings:', err);
    localStorage.removeItem(CUBE_COLOR_STORAGE);
  }
}

function makeCubeColorSection(title) {
  const section = document.createElement('section');
  section.className = 'cube-color-section';
  const heading = document.createElement('div');
  heading.className = 'spec-section-title';
  heading.textContent = title;
  section.appendChild(heading);
  return section;
}

function appendColorControl(parent, labelText, value, onInput) {
  const label = document.createElement('label');
  label.className = 'cube-swatch';
  const text = document.createElement('span');
  text.textContent = labelText;
  const input = document.createElement('input');
  input.type = 'color';
  input.value = value;
  input.setAttribute('aria-label', labelText);
  input.addEventListener('input', () => {
    onInput(input.value);
    saveCubeColorSettings();
  });
  label.appendChild(input);
  label.appendChild(text);
  parent.appendChild(label);
}

function appendCheckboxControl(parent, labelText, checked, onChange) {
  const label = document.createElement('label');
  label.className = 'cube-check-row';
  const input = document.createElement('input');
  input.type = 'checkbox';
  input.checked = checked;
  input.addEventListener('change', () => {
    onChange(input.checked);
    saveCubeColorSettings();
  });
  const text = document.createElement('span');
  text.textContent = labelText;
  label.appendChild(input);
  label.appendChild(text);
  parent.appendChild(label);
}

function appendRangeControl(parent, labelText, min, max, step, value, onInput, digits = 1) {
  const row = document.createElement('label');
  row.className = 'cube-range-row';
  const text = document.createElement('span');
  text.textContent = labelText;
  const input = document.createElement('input');
  input.type = 'range';
  input.min = String(min);
  input.max = String(max);
  input.step = String(step);
  input.value = Number(value).toFixed(digits);
  const val = document.createElement('span');
  val.className = 'slider-val';
  val.textContent = Number(value).toFixed(digits);
  input.addEventListener('input', () => {
    const next = clampFloat(parseFloat(input.value), min, max, value);
    const applied = onInput(next);
    const shown = typeof applied === 'number' ? applied : next;
    input.value = Number(shown).toFixed(digits);
    val.textContent = Number(shown).toFixed(digits);
    saveCubeColorSettings();
  });
  row.appendChild(text);
  row.appendChild(input);
  row.appendChild(val);
  parent.appendChild(row);
}

function appendVertexColorGrid(parent, title, key, prefix, values) {
  const section = makeCubeColorSection(title);
  const grid = document.createElement('div');
  grid.className = 'cube-swatch-grid';
  values.forEach((hex, idx) => {
    appendColorControl(grid, `${prefix}${idx + 1}`, hex, (color) => {
      const appearance = cubeScene.getAppearance();
      const colors = appearance[key].slice(0, 8);
      colors[idx] = color;
      setCubeAppearanceAndSync({ [key]: colors });
    });
  });
  section.appendChild(grid);
  parent.appendChild(section);
}

function appendCubeAppearanceColor(grid, key, label, appearance) {
  appendColorControl(grid, label, appearance[key], (color) => {
    setCubeAppearanceAndSync({ [key]: color });
  });
}

function appendTriangleAppearanceColor(grid, key, label, appearance) {
  appendColorControl(grid, label, appearance[key], (color) => {
    triangle.setAppearance({ [key]: color });
  });
}

function appendCubeAppearanceRange(parent, key, label, min, max, step, appearance, digits = 1) {
  appendRangeControl(parent, label, min, max, step, appearance[key], (value) => (
    setCubeAppearanceAndSync({ [key]: value })[key]
  ), digits);
}

function appendTriangleAppearanceRange(parent, key, label, min, max, step, appearance, digits = 1) {
  appendRangeControl(parent, label, min, max, step, appearance[key], (value) => (
    triangle.setAppearance({ [key]: value })[key]
  ), digits);
}

function renderCubeColorsEditor() {
  if (!cubeColorsEditor) return;
  cubeColorsEditor.textContent = '';
  const cube = cubeScene.getAppearance();
  const tri = triangle.getAppearance();

  appendVertexColorGrid(cubeColorsEditor, 'live K vertices', 'kVertexColors', 'K', cube.kVertexColors);

  const labelSection = makeCubeColorSection('label text');
  appendCheckboxControl(labelSection, 'K labels follow vertex color', cube.kLabelsFollowVertex, (checked) => {
    setCubeAppearanceAndSync({ kLabelsFollowVertex: checked });
  });
  appendCheckboxControl(labelSection, 'C labels follow vertex color', cube.cLabelsFollowVertex, (checked) => {
    setCubeAppearanceAndSync({ cLabelsFollowVertex: checked });
  });
  const labelGrid = document.createElement('div');
  labelGrid.className = 'cube-swatch-grid';
  appendCubeAppearanceColor(labelGrid, 'kLabelColor', 'K labels', cube);
  appendCubeAppearanceColor(labelGrid, 'cLabelColor', 'C labels', cube);
  appendCubeAppearanceColor(labelGrid, 'activeLabelColor', 'active', cube);
  appendCubeAppearanceColor(labelGrid, 'detailLabelColor', 'details', cube);
  labelSection.appendChild(labelGrid);
  cubeColorsEditor.appendChild(labelSection);

  const wireSection = makeCubeColorSection('cube lines');
  const wireGrid = document.createElement('div');
  wireGrid.className = 'cube-swatch-grid';
  appendCubeAppearanceColor(wireGrid, 'liveWireColor', 'live wire', cube);
  appendCubeAppearanceColor(wireGrid, 'ghostWireColor', 'ghost wire', cube);
  appendCubeAppearanceColor(wireGrid, 'kcLineColor', 'K-C line', cube);
  appendCubeAppearanceColor(wireGrid, 'adaptiveWireColor', 'overlay', cube);
  appendCubeAppearanceColor(wireGrid, 'tetraAColor', 'tetra A', cube);
  appendCubeAppearanceColor(wireGrid, 'tetraBColor', 'tetra B', cube);
  appendCubeAppearanceColor(wireGrid, 'topMarkerColor', 'top dots', cube);
  appendCubeAppearanceColor(wireGrid, 'activeHaloColor', 'K halo', cube);
  appendCubeAppearanceColor(wireGrid, 'ghostActiveHaloColor', 'C halo', cube);
  wireSection.appendChild(wireGrid);
  appendCubeAppearanceRange(wireSection, 'baseLineWidth', 'base width', 0.5, 6, 0.1, cube);
  appendCubeAppearanceRange(wireSection, 'liveWireWidth', 'live width', 0.4, 8, 0.1, cube);
  appendCubeAppearanceRange(wireSection, 'tetraWireWidth', 'tetra width', 0.3, 6, 0.1, cube);
  appendCubeAppearanceRange(wireSection, 'ghostWireWidth', 'ghost width', 0.4, 8, 0.1, cube);
  appendCubeAppearanceRange(wireSection, 'kcWireWidth', 'K-C width', 0.4, 8, 0.1, cube);
  cubeColorsEditor.appendChild(wireSection);

  const triangleSection = makeCubeColorSection('triangle lines');
  const triangleGrid = document.createElement('div');
  triangleGrid.className = 'cube-swatch-grid';
  appendTriangleAppearanceColor(triangleGrid, 'kLegColor', 'K leg', tri);
  appendTriangleAppearanceColor(triangleGrid, 'cLegColor', 'C leg', tri);
  appendTriangleAppearanceColor(triangleGrid, 'sievePointColor', 'sieve dot', tri);
  triangleSection.appendChild(triangleGrid);
  appendTriangleAppearanceRange(triangleSection, 'lineWidth', 'line width', 0.4, 8, 0.1, tri);
  appendTriangleAppearanceRange(triangleSection, 'endpointRadius', 'dot size', 0, 10, 0.5, tri);
  appendTriangleAppearanceRange(triangleSection, 'opacity', 'opacity', 0.05, 1, 0.05, tri, 2);
  cubeColorsEditor.appendChild(triangleSection);
}

applySavedCubeColorSettings();
syncCardAppearanceFromCube();
renderCubeColorsEditor();
resetCubeColorsBtn?.addEventListener('click', () => {
  cubeScene.resetAppearance();
  triangle.resetAppearance();
  syncCardAppearanceFromCube();
  localStorage.removeItem(CUBE_COLOR_STORAGE);
  renderCubeColorsEditor();
});

function clampInt(v, lo, hi) {
  if (!isFinite(v)) return lo;
  return Math.max(lo, Math.min(hi, Math.round(v)));
}

function clampFloat(v, lo, hi, fallback) {
  if (!isFinite(v)) return fallback;
  return Math.max(lo, Math.min(hi, v));
}


if (recordModeEl) {
  const savedRecordMode = localStorage.getItem('recordMode');
  if (['visible', 'composite', 'spectrum', 'midi'].includes(savedRecordMode)) recordModeEl.value = savedRecordMode;
  recordModeEl.addEventListener('change', () => {
    localStorage.setItem('recordMode', recordModeEl.value);
  });
}

function currentRightInsetCss() {
  const sieve = document.querySelector('.ovl-sieve-right');
  const rect = sieve?.getBoundingClientRect();
  return rect?.width || 0;
}

function setRecordingUi(active) {
  if (recordBeginBtn) recordBeginBtn.disabled = active;
  if (recordEndBtn) recordEndBtn.disabled = !active;
}

performanceRecorder.init({
  getSources: () => {
    const rightInsetCss = currentRightInsetCss();
    return [
      { kind: 'spectrum', canvas: spectrumScore.getCanvas(), enabled: spectrumEnabled, rightInsetCss },
      { kind: 'midi', canvas: rollingScore.getCanvas(), enabled: midiBrushEnabled, rightInsetCss },
    ];
  },
  getMode: () => recordModeEl?.value || 'visible',
  getScrollSpeed: () => currentScoreSpeed,
  onStatus: (text) => {
    if (recordStatusEl) recordStatusEl.textContent = text;
  },
});
setRecordingUi(false);
recordBeginBtn?.addEventListener('click', () => {
  performanceRecorder.begin();
  setRecordingUi(true);
});
recordEndBtn?.addEventListener('click', () => {
  performanceRecorder.end();
  setRecordingUi(false);
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
// Legacy manual background colour path, kept commented for easy revert.
// const bgColorEl    = document.getElementById('bgColor');
// const bgColorValEl = document.getElementById('bgColorVal');
// function applyBgColor(hex) {
//   document.documentElement.style.setProperty('--bg', hex);
//   bgColorValEl.textContent = hex;
// }
// const savedBgColor = localStorage.getItem('bgColor');
// if (savedBgColor && /^#[0-9a-fA-F]{6}$/.test(savedBgColor)) {
//   bgColorEl.value = savedBgColor;
//   applyBgColor(savedBgColor);
// } else {
//   applyBgColor(bgColorEl.value);
// }
// bgColorEl.addEventListener('input', () => {
//   const hex = bgColorEl.value;
//   applyBgColor(hex);
//   localStorage.setItem('bgColor', hex);
// });

// Quality picker — Phase 3 post-processing tier (low / med / high). Toggles
// the bloom + tone-mapping composer in cube-scene.js. Med is the default for
// fresh users on a normal GPU; Low is the explicit "weak GPU" escape hatch.
// Persisted in localStorage like the other ovl-br controls.
const qualityCtrl = document.getElementById('qualityCtrl');
function applyQuality(level) {
  const applied = cubeScene.setQuality(level);
  qualityCtrl.querySelectorAll('.q-btn').forEach(btn => {
    const isActive = btn.dataset.level === applied;
    btn.classList.toggle('active', isActive);
    btn.setAttribute('aria-checked', isActive ? 'true' : 'false');
  });
}
const savedQuality = localStorage.getItem('quality');
applyQuality(['low', 'med', 'high'].includes(savedQuality) ? savedQuality : 'med');
qualityCtrl.querySelectorAll('.q-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const level = btn.dataset.level;
    applyQuality(level);
    localStorage.setItem('quality', level);
  });
});

// ---- Cube BLE connection (Web Bluetooth) ----------------------------------

// #cube-status span was removed; stub so existing assignments don't crash.
const cubeStatus = { set textContent(_v) {}, set className(_v) {} };
const connectBtn = document.getElementById('connectBtn');
const macInput = document.getElementById('macAddress');

const SOLVED_FACELETS = 'UUUUUUUUURRRRRRRRRFFFFFFFFFDDDDDDDDDLLLLLLLLLBBBBBBBBB';
let activeCube = null;
let lastSolvedReport = true;

// ---- Move-remap verifier --------------------------------------------------
//
// Companion to cube-scene.js's `assertCubeAlignment` (geometric chain check).
// This one observes the actual relay round-trip: the GAN letter we sent
// vs the engine letter we got back in the next state broadcast. Catches
// the failure mode where the relay's MOVE_REMAP is missing or drifts —
// the geometric assertion can't see that because it only inspects the
// dashboard's mirror table.
//
// MIRROR: `CANONICAL_REMAP` MUST track relay.js MOVE_REMAP and cube-scene.js
// CANONICAL_REMAP. Drift is exactly what `[CUBE REMAP FAIL]` catches.
const CANONICAL_REMAP = { R: 'L', L: 'R', F: 'B', B: 'F', U: 'U', D: 'D' };

let _lastSentGanMove = null;     // 'R', "L'", 'F2', etc. (face + suffix)
let _lastSentGanTimeMs = 0;
let _moveRemapVerifierArmed = false;  // fires once per connect

function recordSentMove(move) {
  _lastSentGanMove = move;
  _lastSentGanTimeMs = performance.now();
}
function armMoveRemapVerifier() {
  _moveRemapVerifierArmed = true;
}
function verifyMoveRemap(engineMove) {
  if (!_moveRemapVerifierArmed || _lastSentGanMove === null) return;
  // Stale guard: if the GAN move is older than 1 s, the state.move likely
  // refers to a different (bookkeeping) update — skip rather than false-fire.
  if (performance.now() - _lastSentGanTimeMs > 1000) return;
  const ganFace = _lastSentGanMove[0];
  const ganSuffix = _lastSentGanMove.slice(1);
  const expectedEngine = (CANONICAL_REMAP[ganFace] || ganFace) + ganSuffix;
  _moveRemapVerifierArmed = false;
  if (engineMove !== expectedEngine) {
    console.error(
      `[CUBE REMAP FAIL] relay MOVE_REMAP not applied: ` +
      `gan='${_lastSentGanMove}' expected engine='${expectedEngine}' got='${engineMove}'. ` +
      `Check relay.js MOVE_REMAP table (canonical pose red-front white-top).`
    );
  } else {
    console.log(`[CUBE REMAP OK] gan='${_lastSentGanMove}' → engine='${engineMove}'`);
  }
}

// Canonical U CCW quadruple — physical zero-gyro shortcut.
// This must run from the raw GAN move stream, not from engine `state.upFace`:
// `upFace` is computed after gyro zeroing, so gating the zero gesture on it
// creates a bootstrap failure where the gesture only works after the GUI Zero
// button has already initialized the gyro frame. U/D are unchanged by the
// canonical-pose remap, so raw GAN `U'` is the same physical white-face turn
// the performer expects.
const ZERO_QUAD_WINDOW_MS = 1500;
const ZERO_QUAD_COUNT = 4;
const _zeroQuadHistory = [];

function checkZeroGestureFromGanMove(move) {
  if (!move) return;
  const moveStr = typeof move === 'string' ? move : '';
  // Require a CCW quarter-turn of the physical white U face.
  if (moveStr !== "U'") {
    _zeroQuadHistory.length = 0;
    return;
  }
  const now = performance.now();
  while (
    _zeroQuadHistory.length &&
    now - _zeroQuadHistory[0] > ZERO_QUAD_WINDOW_MS
  ) {
    _zeroQuadHistory.shift();
  }
  _zeroQuadHistory.push(now);
  if (_zeroQuadHistory.length >= ZERO_QUAD_COUNT) {
    const span = Math.round(now - _zeroQuadHistory[0]);
    _zeroQuadHistory.length = 0;
    cubeScene.zeroGyro();
    wsSend({ type: 'zero_gyro' });
    console.log(
      `[CUBE ZERO GESTURE] raw GAN U' x${ZERO_QUAD_COUNT} in ${span}ms — zeroing gyro`,
    );
  }
}

// Privacy/safety: do not persist cube MAC addresses in repo UI state. Earlier
// dashboard drafts stored `ganMacAddress` in localStorage, which can resurrect
// stale addresses even after the HTML default is removed.
localStorage.removeItem('ganMacAddress');

connectBtn.addEventListener('click', async () => {
  const macAddress = macInput.value.trim().toUpperCase();
  const macRegex = /^([0-9A-F]{2}[:-]){5}([0-9A-F]{2})$/;
  if (!macRegex.test(macAddress)) {
    cubeStatus.textContent = 'invalid MAC';
    cubeStatus.className = 'err';
    return;
  }

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
    armMoveRemapVerifier();

    cube.events$.subscribe((event) => {
      if (event.type === 'MOVE') {
        recordSentMove(event.move);
        wsSend({ type: 'move', value: event.move });
        checkZeroGestureFromGanMove(event.move);
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
        interruptionLayer.onPanic();
      }
    });

  } catch (err) {
    console.error('Cube connect error:', err);
    cubeStatus.textContent = 'failed: ' + err.message;
    cubeStatus.className = 'err';
    connectBtn.disabled = false;
  }
});
