// public/js/rolling-score.js
//
// Phase 2.6 — rolling piano-roll module. Owns:
//   • the full-viewport background canvas (right edge = "now", scrolls left)
//   • the per-(voice, pitch) FIFO of in-flight notes plus the finished-note
//     ring (post-cull horizon ≈ visible window + 500 ms)
//   • per-complex procedural brushes (spatter / wash / watercolor / airbrush
//     halo / chalk grit) and the gliss-chain Path2D stroker
//   • the slide-vs-leap classifier's *rolling-side* live-entry check
//     (paired with triangle.js's `_findGlissLine` per the unified
//     classifier contract documented in CLAUDE.md)
//   • Phase 1 visual invariants `assertPitchAxis` (per-resize) and
//     `assertGlissSync` (sampled ~1 Hz when a gliss line is active)
//   • the stuck-note watchdog (force-finalise after PENDING_MAX_AGE_MS)
//
// Cross-module dependencies:
//   • imports `getCellRect` from sieve.js for the pitch-axis assertion
//   • imports `getActiveGlissLineDisplay(now)` via init() (wired to
//     triangle.js by main.js) so the assertion can compare line vs chain
//     trajectories without a circular import. Defaults to a no-op getter
//     so the module stands alone without Phase 2.7 wiring.
//
// Bridge invariants preserved by this module:
//   • midiToY ↔ sieve-cell-Y agreement (49-bin centring; insets match
//     constants.js; fires PITCH AXIS FAIL on >2 px drift after a resize)
//   • gliss-line trajectory ↔ chain trajectory (same easing, same
//     portamento times — fires GLISS SYNC FAIL on >1 px drift while a
//     gliss line is active)

import {
  ROLL_MIN_MIDI, ROLL_MAX_MIDI, ROLL_PITCH_RANGE,
  ROLL_TOP_INSET_PX, ROLL_BOTTOM_INSET_PX,
  ROLL_BRUSH_SCALE,
  PENDING_MAX_AGE_MS,
  GLISS_GAP_MS, GLISS_COMPLEXES,
  GLISS_PORTAMENTO_MS_PER_SEMITONE,
  COMPLEX_COLOR,
} from './constants.js';
import { getCellRect as getSieveCellRect } from './sieve.js';

// ---- Module state ----------------------------------------------------------

// CSS-px scroll speed. Mutable so the score-speed slider can retune live.
let ROLL_PX_PER_SEC = 360;

// Right-edge inset = sieve strip width. Recomputed on resize from the live
// `.ovl-sieve-right` bounding box so the proportional CSS clamp drives this
// automatically.
let ROLL_RIGHT_INSET_CSS_PX = 90;

// FIFO queue per (voice, pitch). The bridge legitimately emits overlapping
// noteons for the same pitch (C8 trem rebows the same mainPitch every
// iteration; the same companion pitch is reused across a whole phrase; any
// humanPitch collision in C2/C3/C4 produces the same key on consecutive
// iterations). FIFO pairing matches what the bridge actually sends: oldest
// noteon pairs with first noteoff for that key.
const activeMidiNotes = new Map();     // "voice:pitch" → Array<entry>
const finishedMidiNotes = [];          // Array<entry + offsetMs>

let rollCanvas = null;
let rollCtx    = null;
let rollDpr    = 1;
let rollRowH   = 19;     // device-px per semitone — recomputed each frame

// Optional cross-module getter wired by main.js. Returns
// `{ voice, complex, pitch }` for the current active gliss line, or null.
let _getActiveGlissLineDisplay = () => null;

// Optional finalise callback for the stuck-note watchdog. Called with
// the pending entry when a note is force-completed; main.js wires this
// to sieve.noteOff + triangle.noteOff so the parallel state stays in sync.
let _onForceFinalise = null;

// ---- Pitch axis ------------------------------------------------------------

// Phase 1 Visual Invariant — midiToY ↔ sieve-cell-Y agreement (CLAUDE.md).
// 2 CSS px absorbs subpixel-rendering / canvas integer-rounding drift; real
// architectural drift (49→48 bin error, JS/CSS inset desync, flex
// regression) is 10+ px and still fires loudly.
const PITCH_AXIS_DRIFT_THRESHOLD_PX = 2;

function assertPitchAxis() {
  if (!rollCanvas) return;
  const h = rollCanvas.height;
  if (h === 0) return;
  const probes = [36, 48, 60, 72, 84];   // C2, C3, C4, C5, C6
  let worst = null;
  for (const P of probes) {
    const r = getSieveCellRect(P);
    if (!r || r.height === 0) return;
    const expected = r.top + r.height / 2;
    const got      = midiToY(P, h) / rollDpr;
    const drift    = Math.abs(got - expected);
    if (!worst || drift > worst.drift) worst = { P, drift, expected, got };
  }
  if (worst && worst.drift > PITCH_AXIS_DRIFT_THRESHOLD_PX) {
    console.error(
      'PITCH AXIS FAIL P=' + worst.P + ' expected=' + worst.expected.toFixed(2) + 'px ' +
      'got=' + worst.got.toFixed(2) + 'px drift=' + worst.drift.toFixed(2) + 'px ' +
      '(midiToY canvas y vs sieve cell rect; threshold=' +
      PITCH_AXIS_DRIFT_THRESHOLD_PX + 'px)'
    );
  }
}

// Pitch P sits at the CENTER of sieve cell (P − 36). 49 cells dividing the
// inner pitch axis (h − top − bottom) into 49 equal vertical bins, so cell
// i's center is at top + (48.5 − i) · innerH / 49. Continuous pitches
// (gliss interpolation) smoothly traverse the bins.
function midiToY(pitch, h) {
  const clamped = Math.max(ROLL_MIN_MIDI, Math.min(ROLL_MAX_MIDI, pitch));
  const i = clamped - ROLL_MIN_MIDI;
  const topDev    = ROLL_TOP_INSET_PX    * rollDpr;
  const bottomDev = ROLL_BOTTOM_INSET_PX * rollDpr;
  const innerH    = Math.max(1, h - topDev - bottomDev);
  return topDev + (48.5 - i) * innerH / 49;
}

function rollRightEdge(w) {
  return w - ROLL_RIGHT_INSET_CSS_PX * rollDpr;
}

function timeToX(tMs, nowMs, w) {
  const dt = nowMs - tMs;
  return rollRightEdge(w) - (dt / 1000) * ROLL_PX_PER_SEC * rollDpr;
}

function resizeRollingScore() {
  if (!rollCanvas) return;
  rollDpr = Math.max(1, window.devicePixelRatio || 1);
  const cssW = window.innerWidth;
  const cssH = window.innerHeight;
  rollCanvas.style.width  = cssW + 'px';
  rollCanvas.style.height = cssH + 'px';
  rollCanvas.width  = Math.round(cssW * rollDpr);
  rollCanvas.height = Math.round(cssH * rollDpr);
  const sieveEl = document.querySelector('.ovl-sieve-right');
  if (sieveEl) {
    const r = sieveEl.getBoundingClientRect();
    if (r.width > 0) ROLL_RIGHT_INSET_CSS_PX = r.width;
  }
  // Defer the assertion one rAF so the sieve has finished its post-resize
  // reflow before we measure cell rects.
  requestAnimationFrame(assertPitchAxis);
}

// ---- Stable per-note RNG (mulberry32) --------------------------------------

function noteSeed(evt) {
  let s = ((evt.voice | 0) * 73856093) ^
          ((evt.pitch | 0) * 19349663) ^
          ((evt.onsetMs | 0) * 83492791);
  return { s: s >>> 0 };
}
function lcg(ref) {
  ref.s = (ref.s + 0x6D2B79F5) | 0;
  let t = ref.s;
  t = Math.imul(t ^ t >>> 15, t | 1);
  t ^= t + Math.imul(t ^ t >>> 7, t | 61);
  return ((t ^ t >>> 14) >>> 0) / 4294967296;
}

// `bu(factor)` returns a brush vertical dimension in device px, scaled to
// the current row-height and the global brush-scale knob.
const bu = (f) => rollRowH * f * ROLL_BRUSH_SCALE;

// ---- Brush palette ---------------------------------------------------------

function brushSpatter(ctx, x0, x1, y, color, alpha, evt) {
  const x = Math.max(0, x0);
  const w = Math.max(2 * rollDpr, x1 - x);
  const seed = noteSeed(evt);
  const dotCount = Math.max(12, Math.min(60, Math.floor(w / (2.2 * rollDpr))));
  const spreadH = bu(1.15);
  ctx.fillStyle = color;
  ctx.globalAlpha = alpha;
  for (let i = 0; i < dotCount; i++) {
    const px = x + lcg(seed) * w;
    const py = y + (lcg(seed) - 0.5) * spreadH;
    const r  = bu(0.08 + lcg(seed) * 0.13);
    ctx.beginPath();
    ctx.arc(px, py, r, 0, Math.PI * 2);
    ctx.fill();
  }
  for (let i = 0; i < 5; i++) {
    const px = x + lcg(seed) * w;
    const py = y + (lcg(seed) - 0.5) * bu(0.4);
    const r  = bu(0.18 + lcg(seed) * 0.21);
    ctx.beginPath();
    ctx.arc(px, py, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function brushRoughWash(ctx, x0, x1, y, color, alpha, evt) {
  const x = Math.max(0, x0);
  const w = Math.max(2 * rollDpr, x1 - x);
  const bandH = bu(1.45);
  const grad = ctx.createLinearGradient(0, y - bandH, 0, y + bandH);
  grad.addColorStop(0,   'rgba(0,0,0,0)');
  grad.addColorStop(0.5, color);
  grad.addColorStop(1,   'rgba(0,0,0,0)');
  ctx.fillStyle = grad;
  ctx.globalAlpha = alpha * 0.55;
  ctx.fillRect(x, y - bandH, w, bandH * 2);
  const coreH = bu(0.5);
  ctx.fillStyle = color;
  ctx.globalAlpha = alpha * 0.8;
  ctx.fillRect(x, y - coreH / 2, w, coreH);
  ctx.globalAlpha = 1;
}

function brushWatercolor(ctx, x0, x1, y, color, alpha, evt) {
  const x = Math.max(0, x0);
  const w = Math.max(2 * rollDpr, x1 - x);
  const bodyH = bu(1.0);
  const seed = noteSeed(evt);
  ctx.fillStyle = color;
  ctx.globalAlpha = alpha * 0.25;
  ctx.fillRect(x, y - bodyH, w, bodyH * 2);
  ctx.globalAlpha = alpha * 0.85;
  ctx.fillRect(x, y - bodyH / 2, w, bodyH);
  ctx.globalAlpha = alpha * 0.6;
  const blobCount = 2 + Math.floor(w / (35 * rollDpr));
  for (let i = 0; i < blobCount; i++) {
    const px = x + (0.1 + lcg(seed) * 0.8) * w;
    const r = bu(0.3 + lcg(seed) * 0.3);
    ctx.beginPath();
    ctx.arc(px, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function brushAirbrush(ctx, x0, x1, y, color, alpha, evt) {
  const x = Math.max(0, x0);
  const w = Math.max(2 * rollDpr, x1 - x);
  const radius = bu(1.15);
  const stepCount = Math.max(2, Math.floor(w / (radius * 0.6)));
  ctx.globalAlpha = alpha * 0.75;
  for (let i = 0; i < stepCount; i++) {
    const px = x + (stepCount === 1 ? w / 2 : (i / (stepCount - 1)) * w);
    const grad = ctx.createRadialGradient(px, y, 0, px, y, radius);
    grad.addColorStop(0,    color);
    grad.addColorStop(0.45, color);
    grad.addColorStop(1,    'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(px, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function brushChalk(ctx, x0, x1, y, color, alpha, evt) {
  const x = Math.max(0, x0);
  const w = Math.max(2 * rollDpr, x1 - x);
  const bandH = bu(1.35);
  const seed = noteSeed(evt);
  ctx.fillStyle = color;
  ctx.globalAlpha = alpha * 0.55;
  ctx.fillRect(x, y - bandH / 2, w, bandH);
  ctx.globalAlpha = alpha;
  const slotCount = Math.floor(w / (1.4 * rollDpr));
  for (let i = 0; i < slotCount; i++) {
    if (lcg(seed) < 0.5) continue;
    const px = x + (i / Math.max(1, slotCount)) * w + lcg(seed) * 2 * rollDpr;
    const py = y + (lcg(seed) - 0.5) * bandH * 1.1;
    const sw = bu(0.08 + lcg(seed) * 0.13);
    const sh = bu(0.08 + lcg(seed) * 0.10);
    ctx.fillRect(px, py, sw, sh);
  }
  ctx.globalAlpha = 1;
}

function brushHardRound(ctx, x0, x1, y, color, alpha, evt) {
  const x = Math.max(0, x0);
  const w = Math.max(2 * rollDpr, x1 - x);
  const rowH = bu(0.72);
  ctx.fillStyle = color;
  ctx.globalAlpha = alpha;
  ctx.fillRect(x, y - rowH / 2, w, rowH);
  ctx.globalAlpha = 1;
}

// Gliss complexes (C5/C6/C7) deliberately have no entry — drawNote skips
// them and the chain pass renders each gliss phrase as a single Path2D so
// the rect bodies and slant transitions read as one continuous brush stroke.
const COMPLEX_BRUSH = {
  0: brushHardRound,
  1: brushSpatter,
  2: brushRoughWash,
  3: brushWatercolor,
  4: brushAirbrush,
  8: brushChalk,
};

function drawNote(ctx, evt, x0, x1, y, alpha) {
  if (x1 < 0) return;
  if (GLISS_COMPLEXES.has(evt.complex)) return;  // handled by chain pass
  const color = COMPLEX_COLOR[evt.complex] || COMPLEX_COLOR[0];
  const brush = COMPLEX_BRUSH[evt.complex] || brushHardRound;
  brush(ctx, x0, x1, y, color, alpha, evt);
}

// ---- Gliss chain renderer --------------------------------------------------

function buildGlissChains(nowMs, w, h) {
  const groups = new Map();
  const push = (evt, x0, x1, y) => {
    const k = `${evt.voice}:${evt.complex}`;
    let arr = groups.get(k);
    if (!arr) { arr = []; groups.set(k, arr); }
    arr.push({ evt, x0, x1, y });
  };
  for (const evt of finishedMidiNotes) {
    if (!GLISS_COMPLEXES.has(evt.complex)) continue;
    push(evt, timeToX(evt.onsetMs, nowMs, w), timeToX(evt.offsetMs, nowMs, w), midiToY(evt.pitch, h));
  }
  const rightEdge = rollRightEdge(w);
  for (const queue of activeMidiNotes.values()) {
    for (const evt of queue) {
      if (!GLISS_COMPLEXES.has(evt.complex)) continue;
      push(evt, timeToX(evt.onsetMs, nowMs, w), rightEdge, midiToY(evt.pitch, h));
    }
  }
  const chains = [];
  for (const arr of groups.values()) {
    arr.sort((a, b) => a.evt.onsetMs - b.evt.onsetMs);
    let chain = null;
    for (let i = 0; i < arr.length; i++) {
      const node = arr[i];
      const prev = i > 0 ? arr[i - 1] : null;
      const prevOff = prev ? (prev.evt.offsetMs ?? nowMs) : -Infinity;
      const gapMs = prev ? node.evt.onsetMs - prevOff : 0;
      const breakByCs  = !!node.evt.chainStart;
      const breakByGap = gapMs > GLISS_GAP_MS;
      if (!chain || breakByCs || breakByGap) {
        if (window.xkDebugGliss && chain) {
          console.log(
            '[gliss break] complex=C' + node.evt.complex +
            ' pitch=' + node.evt.pitch +
            ' cs=' + breakByCs +
            ' gap=' + (gapMs).toFixed(1) + 'ms' +
            ' (>25? ' + breakByGap + ')'
          );
        }
        chain = {
          complex: node.evt.complex,
          color:   COMPLEX_COLOR[node.evt.complex] || COMPLEX_COLOR[0],
          nodes:   [],
        };
        chains.push(chain);
      }
      chain.nodes.push(node);
    }
  }
  return chains;
}

function _glissChainDur(fromP, toP, complex) {
  const interval = Math.abs(toP - fromP);
  const perSemi = GLISS_PORTAMENTO_MS_PER_SEMITONE[complex] || 80;
  return Math.max(80, Math.min(2000, interval * perSemi));
}

// Cubic smoothstep — same ease used by the white triangle leg.
function _glissEase(t) {
  if (t <= 0) return 0;
  if (t >= 1) return 1;
  return t * t * (3 - 2 * t);
}

function _glissPitchAt(t, segs) {
  for (let i = segs.length - 1; i >= 0; i--) {
    const s = segs[i];
    if (t >= s.t0) {
      if (s.dur <= 0) return s.p1;
      const f = Math.min(1, (t - s.t0) / s.dur);
      return s.p0 + (s.p1 - s.p0) * _glissEase(f);
    }
  }
  return segs[0].p0;
}

function _buildGlissSegments(nodes) {
  const segs = [];
  if (nodes.length === 0) return segs;
  segs.push({ t0: nodes[0].evt.onsetMs, dur: 0, p0: nodes[0].evt.pitch, p1: nodes[0].evt.pitch });
  for (let i = 1; i < nodes.length; i++) {
    const n = nodes[i].evt;
    const startT = n.onsetMs;
    const pitchAtStart = _glissPitchAt(startT, segs);
    segs.push({
      t0: startT,
      dur: _glissChainDur(pitchAtStart, n.pitch, n.complex),
      p0:  pitchAtStart,
      p1:  n.pitch,
    });
  }
  return segs;
}

function drawGlissChain(ctx, chain, nowMs, canvasW, canvasH) {
  const { complex, color, nodes } = chain;
  if (nodes.length === 0) return;
  const segs = _buildGlissSegments(nodes);
  const lineW = bu(0.85);

  const startX = nodes[0].x0;
  const endX   = nodes[nodes.length - 1].x1;
  const span   = Math.max(1, endX - startX);
  const samplePx = 3 * rollDpr;
  const numSamples = Math.max(2, Math.ceil(span / samplePx));
  const pxPerMs = ROLL_PX_PER_SEC * rollDpr / 1000;
  const rightEdge = rollRightEdge(canvasW);

  const strokePath = (dy, w, alpha) => {
    ctx.strokeStyle = color;
    ctx.lineWidth   = w;
    ctx.lineCap     = 'round';
    ctx.lineJoin    = 'round';
    ctx.globalAlpha = alpha;
    ctx.beginPath();
    for (let i = 0; i <= numSamples; i++) {
      const x = startX + span * i / numSamples;
      const t = nowMs - (rightEdge - x) / pxPerMs;
      const p = _glissPitchAt(t, segs);
      const y = midiToY(p, canvasH);
      if (i === 0) ctx.moveTo(x, y + dy);
      else         ctx.lineTo(x, y + dy);
    }
    ctx.stroke();
  };

  if (complex === 7) {
    const haloOffset = lineW * 1.2;
    strokePath(-haloOffset, lineW * 0.5, 0.22);
    strokePath(+haloOffset, lineW * 0.5, 0.22);
  }
  strokePath(0, lineW, 0.95);
  ctx.globalAlpha = 1;
}

// ---- Per-frame render loop -------------------------------------------------

function drawRollingScore() {
  if (!rollCanvas || !rollCtx) {
    requestAnimationFrame(drawRollingScore);
    return;
  }
  const w = rollCanvas.width;
  const h = rollCanvas.height;
  const nowMs = performance.now();
  const innerHDev = Math.max(48 * rollDpr, h - (ROLL_TOP_INSET_PX + ROLL_BOTTOM_INSET_PX) * rollDpr);
  rollRowH = Math.max(4 * rollDpr, innerHDev / ROLL_PITCH_RANGE);
  const visibleSec = (w / rollDpr) / ROLL_PX_PER_SEC;
  const horizonMs = nowMs - visibleSec * 1000;

  rollCtx.clearRect(0, 0, w, h);

  while (finishedMidiNotes.length && finishedMidiNotes[0].offsetMs < horizonMs - 500) {
    finishedMidiNotes.shift();
  }

  for (const evt of finishedMidiNotes) {
    const x0 = timeToX(evt.onsetMs,  nowMs, w);
    const x1 = timeToX(evt.offsetMs, nowMs, w);
    const y  = midiToY(evt.pitch, h);
    const alpha = 0.55 + 0.45 * Math.min(1, evt.velocity / 110);
    drawNote(rollCtx, evt, x0, x1, y, alpha);
  }
  const rightEdge = rollRightEdge(w);
  for (const queue of activeMidiNotes.values()) {
    for (const evt of queue) {
      const x0 = timeToX(evt.onsetMs, nowMs, w);
      const y  = midiToY(evt.pitch, h);
      const alpha = 0.7 + 0.3 * Math.min(1, evt.velocity / 110);
      drawNote(rollCtx, evt, x0, rightEdge, y, alpha);
    }
  }

  const chains = buildGlissChains(nowMs, w, h);
  for (const chain of chains) drawGlissChain(rollCtx, chain, nowMs, w, h);

  assertGlissSync(nowMs);

  requestAnimationFrame(drawRollingScore);
}

// ---- Phase 1 visual invariant: gliss-line ↔ chain trajectory --------------

let _glissSyncLastCheckMs = 0;
const GLISS_SYNC_CHECK_INTERVAL_MS = 1000;

function _findActiveGlissChain(voice, complex, nowMs) {
  const evts = [];
  for (const evt of finishedMidiNotes) {
    if (evt.voice === voice && evt.complex === complex) evts.push(evt);
  }
  for (const queue of activeMidiNotes.values()) {
    for (const evt of queue) {
      if (evt.voice === voice && evt.complex === complex) evts.push(evt);
    }
  }
  if (evts.length === 0) return null;
  evts.sort((a, b) => a.onsetMs - b.onsetMs);
  let start = 0;
  for (let i = 1; i < evts.length; i++) {
    const prevOff = evts[i - 1].offsetMs ?? nowMs;
    if (evts[i].chainStart || (evts[i].onsetMs - prevOff > GLISS_GAP_MS)) start = i;
  }
  const out = [];
  for (let i = start; i < evts.length; i++) out.push({ evt: evts[i] });
  return out;
}

function assertGlissSync(nowMs) {
  if (nowMs - _glissSyncLastCheckMs < GLISS_SYNC_CHECK_INTERVAL_MS) return;
  if (!rollCanvas) return;
  const display = _getActiveGlissLineDisplay(nowMs);
  if (!display) return;
  _glissSyncLastCheckMs = nowMs;

  const chainNodes = _findActiveGlissChain(display.voice, display.complex, nowMs);
  if (!chainNodes || chainNodes.length === 0) return;
  const segs = _buildGlissSegments(chainNodes);
  if (segs.length === 0) return;

  const linePitch  = display.pitch;
  const chainPitch = _glissPitchAt(nowMs, segs);
  const lineY  = midiToY(linePitch,  rollCanvas.height) / rollDpr;
  const chainY = midiToY(chainPitch, rollCanvas.height) / rollDpr;
  const drift  = Math.abs(lineY - chainY);
  if (drift > 1) {
    // Forensic detail (D56) — when the assertion fires, the segment shape
    // and the line state together identify which side has stale data:
    //   • too many segs, all chainStart=undef → finished-entry chainStart
    //     loss (D56 itself).
    //   • newest seg's p1 disagrees with line.toPitch → triangle missed a
    //     noteon (or rolling-score got a phantom one).
    //   • single-seg chain, line has long history → triangle has stale
    //     line (noteoff dropped, _hasActiveGliss kept the line alive).
    const lastSeg = segs[segs.length - 1];
    const segSummary = segs.map(function (s) {
      return '[' + (s.t0 | 0) + '+' + (s.dur | 0) + ': ' + s.p0.toFixed(1) + '→' + s.p1.toFixed(1) + ']';
    }).join(' ');
    const csSummary = chainNodes.map(function (n) {
      return n.evt.pitch + (n.evt.chainStart ? '*' : '') + '@' + (n.evt.onsetMs | 0);
    }).join(',');
    console.error(
      'GLISS SYNC FAIL voice=' + display.voice + ' complex=' + display.complex +
      ' line=' + lineY.toFixed(2) + 'px chain=' + chainY.toFixed(2) + 'px' +
      ' drift=' + drift.toFixed(2) + 'px linePitch=' + linePitch.toFixed(2) +
      ' chainPitch=' + chainPitch.toFixed(2) +
      ' segs=' + segs.length +
      ' lastSeg=t0=' + (lastSeg.t0 | 0) + ' dur=' + (lastSeg.dur | 0) +
      ' p0=' + lastSeg.p0.toFixed(1) + ' p1=' + lastSeg.p1.toFixed(1) +
      ' nowMs=' + (nowMs | 0) +
      ' chainNodes=[' + csSummary + ']' +
      ' segSpan=' + segSummary
    );
  }
}

// ---- Stuck-note watchdog ---------------------------------------------------

function _watchdogTick() {
  const now = performance.now();
  for (const [key, queue] of activeMidiNotes) {
    while (queue.length > 0 && now - queue[0].onsetMs > PENDING_MAX_AGE_MS) {
      const pending = queue.shift();
      finishedMidiNotes.push({
        pitch:      pending.pitch,
        velocity:   pending.velocity,
        voice:      pending.voice,
        complex:    pending.complex,
        onsetMs:    pending.onsetMs,
        offsetMs:   now,
        chainStart: pending.chainStart,    // D56 — see noteOff()
      });
      if (_onForceFinalise) _onForceFinalise(pending, key);
    }
    if (queue.length === 0) activeMidiNotes.delete(key);
  }
}

// ---- Public API ------------------------------------------------------------

/**
 * Wire optional cross-module callbacks and start the render loop.
 *   onForceFinalise(pending, key) — fired when the stuck-note watchdog
 *     finalises an active note; main.js mirrors the noteoff to sieve +
 *     triangle so their lifetimes stay aligned with the rolling-score's.
 *   getActiveGlissLineDisplay(now) — returns
 *     `{ voice, complex, pitch }` for the current active gliss line, or
 *     null. Main.js wires this to triangle.js so `assertGlissSync` can
 *     compare the two trajectories without a circular import.
 */
export function init({ onForceFinalise, getActiveGlissLineDisplay } = {}) {
  if (onForceFinalise) _onForceFinalise = onForceFinalise;
  if (getActiveGlissLineDisplay) {
    _getActiveGlissLineDisplay = getActiveGlissLineDisplay;
  } else {
    // Phase 2 cross-module wiring invariant — without this callback, the
    // segment-model side of `assertGlissSync` has nothing to compare against
    // and silently returns null from its display getter, so the assertion
    // never fires. That's a Visual Invariant #3 silent-failure surface.
    // Loud at startup; silent during normal play.
    console.warn('[rolling-score] init() called without getActiveGlissLineDisplay — Phase 1 Visual Invariant assertGlissSync disabled');
  }
  rollCanvas = document.getElementById('rolling-score');
  if (!rollCanvas) return;
  rollCtx = rollCanvas.getContext('2d');
  resizeRollingScore();
  window.addEventListener('resize', resizeRollingScore);
  requestAnimationFrame(drawRollingScore);
  setInterval(_watchdogTick, 5000);
}

/**
 * Push a noteon entry. Computes the slide-vs-leap classifier's chainStart
 * flag (true when no same-(voice, complex) note is currently alive — leaps
 * + voice steals + chain firsts) and stores it on the entry. Used by
 * `buildGlissChains` to break chains and `_findActiveGlissChain` to find
 * the latest chain for the gliss-sync assertion. Returns the chainStart
 * flag in case the caller wants to log / introspect it.
 */
export function noteOn(data) {
  const cmx = data.complex | 0;
  const key = `${data.voice}:${data.pitch}`;
  let chainStart = false;
  if (GLISS_COMPLEXES.has(cmx)) {
    chainStart = true;
    outer: for (const q of activeMidiNotes.values()) {
      for (const e of q) {
        if (e.voice === data.voice && e.complex === cmx) { chainStart = false; break outer; }
      }
    }
    if (window.xkDebugGliss) {
      const activeKeys = [...activeMidiNotes.keys()].join(',') || '(empty)';
      console.log(
        '[gliss noteon] voice=' + data.voice + ' pitch=' + data.pitch +
        ' complex=C' + cmx + ' chainStart=' + chainStart +
        ' activeKeys=[' + activeKeys + ']'
      );
    }
  }
  let queue = activeMidiNotes.get(key);
  if (!queue) { queue = []; activeMidiNotes.set(key, queue); }
  queue.push({
    pitch:    data.pitch,
    velocity: data.velocity,
    voice:    data.voice,
    complex:  cmx,
    onsetMs:  performance.now(),
    chainStart,
  });
  return chainStart;
}

/**
 * Pop the FIFO-oldest pending entry for (voice, pitch) and move it into the
 * finished ring. Returns the finalised entry so the caller can mirror the
 * noteoff to sieve / triangle (which need the *paired* pitch / complex,
 * not the request's pitch — the bridge can emit overlapping noteons on the
 * same pitch and the FIFO pairing is authoritative).
 *
 * D56 — `chainStart` is COPIED to the finished entry. `_findActiveGlissChain`
 * walks finished + active evts to rebuild the latest chain; without
 * preserving chainStart, finished entries report `chainStart=undefined`
 * (falsy) and the chain rule reverts to gap-only classification. For
 * voice-steal-driven phrase boundaries (synchronous noteoff(old) →
 * noteon(new), gap ≈ 0 ms), the gap test never fires — the chain
 * silently splices the OLD phrase's segments onto the NEW phrase, while
 * triangle's lineNotes (which operates on live state, not finished
 * history) correctly tracks only the new phrase. Result was a multi-
 * semitone GLISS SYNC FAIL on every voice steal during gliss play.
 */
export function noteOff(data) {
  const key = `${data.voice}:${data.pitch}`;
  const queue = activeMidiNotes.get(key);
  if (!queue || queue.length === 0) return null;
  const pending = queue.shift();
  if (queue.length === 0) activeMidiNotes.delete(key);
  finishedMidiNotes.push({
    pitch:      pending.pitch,
    velocity:   pending.velocity,
    voice:      pending.voice,
    complex:    pending.complex,
    onsetMs:    pending.onsetMs,
    offsetMs:   performance.now(),
    chainStart: pending.chainStart,
  });
  return pending;
}

/** Drop all in-flight notes (engine panic). Finished notes scroll out
 *  naturally — we don't clear them so the roll doesn't snap to empty. */
export function panic() {
  activeMidiNotes.clear();
}

/** Slider-driven scroll speed (CSS px / sec). */
export function setScrollSpeed(val) {
  ROLL_PX_PER_SEC = val;
}

/**
 * True iff any active note for (voice, complex) is currently in the FIFO.
 * Used by triangle.js's endLine post-FIFO-shift to decide whether the
 * gliss chain is over (pair to rolling-score's chain grouping in
 * `buildGlissChains`). Walks every per-key queue.
 */
export function hasActiveNote(voice, complex) {
  for (const queue of activeMidiNotes.values()) {
    for (const evt of queue) {
      if (evt.voice === voice && evt.complex === complex) return true;
    }
  }
  return false;
}
