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
  GLISS_SLIDE_MAX_DUR_MS,
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

// D59 — bend segments per (voice, complex). Each entry is a single
// pitchbend-driven slide segment recorded at bendstep arrival time. The
// segment model in `_buildGlissSegments` and `buildGlissChains` merges
// these alongside noteon-derived segments so the audible curve from
// fromPitch to toPitch is rendered as a continuous Path2D stroke.
//
// Entry shape: { voice, complex, t0, dur, p0: fromPitch, p1: toPitch }.
// Pruned with finishedMidiNotes when t0+dur falls below the visible
// horizon (drawRollingScore's cull pass).
const bendSegments = [];

// D59 — chain-grace map (voice:complex → end timestamp). When a bendstep
// arrives, set `bendChainUntilMs[vk] = now + durMs + tail`. The bridge's
// noteOn target arrives at ~now+durMs with chainStart=true (because the
// noteOff source removed the active entry). Within the grace window AND
// matching toPitch, override chainStart to false so the chain continues.
const bendChainUntilMs = new Map();
const bendChainTargetPitch = new Map();
const BEND_CHAIN_GRACE_TAIL_MS = 100;

// ---- CC 11 (Expression) telemetry ------------------------------------------
//
// SWAM Cello drives ongoing loudness via CC 11 — velocity is only the attack
// snapshot. To size brushes by AUDIBLE dynamics rather than per-note velocity,
// the bridge echoes every CC 11 write via `/xk/midi/expr` (`emitEchoExpr` in
// `max/xk_swam.js`). Dashboard caches latest per-voice value here and stamps
// each noteon's `exprAtOn` and each noteoff's `exprAtOff` so the brush can
// linearly interpolate within the note (matches the D47 invariant that the
// bridge's CC 11 ramp is linear across a phrase). Default 64 (≈ exprScale 1.0)
// when no expr has been seen yet — keeps unmapped voices at baseline thickness.
const voiceExpr = new Map();    // voice → latest CC 11 (0..127)
const DEFAULT_EXPR = 64;

// Per-voice CC 11 history ring buffer (timestamped samples). The bridge's
// scheduleRelease ramps CC 11 to 0 over a release fade BEFORE emitting MIDI
// noteoff — so by the time the dashboard's noteOff handler fires, voiceExpr
// has already collapsed to ~0 and a naive `exprAtOff = voiceExpr.get(voice)`
// snapshot captures the post-fade value. That makes finished sustained notes
// (C3 watercolor especially) look uniformly thin even though the in-flight
// brush correctly showed the cresc swell up to peak. Workaround: keep a
// ring buffer of (t, val) pairs and at noteoff look back enough to land
// BEFORE the fade started, capturing pre-fade peak. Interrupts/voice-steals
// don't run the fade so their lookback also captures peak — same logic, no
// special-casing needed.
//
// Lookback budget: worst-case fade is bridge `releaseRampMs` × regime mult
// × face mult. Largest releaseRampMs is C7's 260 ms; largest regime mult is
// `contemplative` 1.5×; face mult can reach ~2× on long-fade faces; plus the
// 20 ms task offset between fade-end and allNotesOff. Worst case ≈ 800 ms.
// 1000 ms gives a safe margin without crossing typical multi-note phrase
// boundaries (rebows in C2/C3 fire ≥ ~500 ms apart even on dense phrases),
// and per-voice isolation in voiceExprHistory means the lookback can never
// see another voice's residue. Was 350 ms — too tight for contemplative
// regime, where C3 fades alone could reach 220 × 1.5 × 1 = 330 ms ≈ at the
// boundary, and any face mult > 1 pushed it over → finished brush snapped
// to thin at noteoff.
//
// D70 — `EXPR_HISTORY_MAX_AGE_MS` raised from 5000 to 12000 so an in-flight
// hairpin (e.g. long C8 sul-pont tremolo, durBias up to 1.6×, contemplative
// regime ×1.5 → ~10 s phrases) keeps its early CC 11 samples until noteoff
// freezes them onto the entry. Pre-D70, the brush only used the
// `{exprAtOn, voiceExpr}` two-endpoint pair so the cull horizon didn't
// matter; the trace-sampled brush in `fillVaryingBand` walks the live
// buffer for in-flight notes and would lose its trough samples to the
// 5000 ms cull on phrases longer than 5 s. Memory: 30 Hz × 12 s ≈ 360
// entries/voice → ~6 KB/voice worst case, trivial.
const voiceExprHistory = new Map();         // voice → Array<{t, v}>
const EXPR_HISTORY_MAX_AGE_MS    = 12000;    // cull older entries each push (D70)
const EXPR_PRE_FADE_LOOKBACK_MS  = 1000;     // captures pre-fade expr at noteoff

// D72.6 — parallel-companion segments. Companions on gliss complexes are
// rendered as a re-stroke of the main chain's path translated by `offsetSemis`
// rows, NOT as their own queue / chain / brush entry. The bridge already
// emits the companion at `doubleStopCompanion(mainPitch)` so the offset is
// fixed at noteon and stays through the entire main chain — pure parallel
// motion under any bend the main does.
//
// D73 — segments are TIME-BOUNDED: each entry records `t0` (companion noteon)
// and `t1` (companion noteoff; null = still active). At draw time, each chain
// sample looks up the segment containing that sample's time, so the parallel
// overlay only paints over the time range the companion was actually held.
// Pre-D73 a single global per-(voice, complex) Map entry was applied to EVERY
// chain in finishedMidiNotes for that (voice, complex), including ones drawn
// many phrases ago that were still scrolling out — companion noteon turned
// them ALL on, companion noteoff turned them ALL off. The user-visible
// symptom: "double-stop voices come and go as the score keeps getting drawn,
// things drawn many phrases ago glitch on and off." Time-bounded segments
// fix it: past chains are pinned to whatever companion (if any) overlapped
// them when they were live, and stay that way as they scroll out. Multiple
// sequential segments per (voice, complex) are supported (C5 rebow companions
// accumulate as a chain of short segments with potentially different
// offsetSemis each rebow).
const companionSegments = [];   // Array<{voice, complex, offsetSemis, companionPitch, t0, t1}>

function recordExpr(voice, t, val) {
  let buf = voiceExprHistory.get(voice);
  if (!buf) { buf = []; voiceExprHistory.set(voice, buf); }
  buf.push({ t, v: val });
  const cutoff = t - EXPR_HISTORY_MAX_AGE_MS;
  while (buf.length > 0 && buf[0].t < cutoff) buf.shift();
}

function exprAtLookback(voice, refT, lookbackMs, noteOnT) {
  // Returns the most recent expr value at-or-before `refT - lookbackMs`,
  // clamped to never look before `noteOnT` (notes shorter than the lookback
  // window fall back to whatever was current at noteon time so we don't
  // accidentally capture a previous voice's residue).
  const targetT = Math.max(refT - lookbackMs, noteOnT);
  const buf = voiceExprHistory.get(voice);
  if (!buf || buf.length === 0) {
    return voiceExpr.has(voice) ? voiceExpr.get(voice) : DEFAULT_EXPR;
  }
  for (let i = buf.length - 1; i >= 0; i--) {
    if (buf[i].t <= targetT) return buf[i].v;
  }
  return buf[0].v;
}

// D72.6 — find the current main pitch for a (voice, complex) at the moment a
// companion noteon arrives. Heuristic in priority order:
//   1. Most recent bendSegment p1 within 200 ms — covers C5 per-rebow
//      companions (slide just bent-target'd; the source is still in
//      activeMidiNotes but the audible/intended main is the bend's destination).
//   2. Latest non-companion entry's pitch in activeMidiNotes — covers C6
//      anchor companion (no bend yet; anchor IS the main).
// Returns null if no main is found (companion is orphan; offset not stored).
function _findCurrentMainPitch(voice, complex) {
  const now = performance.now();
  let recentBend = null;
  let recentT = -Infinity;
  for (const bs of bendSegments) {
    if (bs.voice !== voice || bs.complex !== complex) continue;
    if (now - bs.t0 < 200 && bs.t0 > recentT) {
      recentT = bs.t0;
      recentBend = bs;
    }
  }
  if (recentBend) return recentBend.p1;
  let latestT = -Infinity;
  let latestPitch = null;
  for (const queue of activeMidiNotes.values()) {
    for (const e of queue) {
      if (e.voice !== voice || e.complex !== complex) continue;
      if (e.isCompanion) continue;
      if (e.onsetMs > latestT) {
        latestT = e.onsetMs;
        latestPitch = e.pitch;
      }
    }
  }
  return latestPitch;
}

// Slice the per-voice CC 11 ring buffer to entries within [t0, t1].
// Used at noteOff to freeze a per-note expression curve onto the finished
// entry so future chain re-renders sample stable, voice-isolated history
// instead of the live ring buffer (which is shared across complexes on
// the same voice and culls aggressively, causing past gliss chains to
// retroactively track later complexes' CC 11 values).
function sliceExprHistory(voice, t0, t1) {
  const buf = voiceExprHistory.get(voice);
  if (!buf || buf.length === 0) return [];
  const out = [];
  for (let i = 0; i < buf.length; i++) {
    if (buf[i].t >= t0 && buf[i].t <= t1) out.push({ t: buf[i].t, v: buf[i].v });
  }
  return out;
}

// ---- White sparks from sieve ----------------------------------------------
//
// On every noteon, emit a brief shower of white sparks from the corresponding
// sieve cell so the user sees pitch ↔ ear connection as a kinetic event, not
// just a glow tick. Pizz (C1) gets an omnidirectional "explosion" with a
// velocity-scaled lifetime so a hard pluck visibly lingers; sustained
// complexes get a softer leftward trickle.
//
// Particles render on the rolling-score canvas with `globalCompositeOperation
// = 'lighter'` for additive glow, then composite operation is restored.
// Position / velocity / radius all live in device pixels so they render at
// physical size regardless of dpr (multiplied by rollDpr at emit time).
const sparks = [];
let _sparksLastTickMs = 0;
const SPARKS_MAX = 800;

// Per-complex noteon flash dispatcher. Pizz keeps its big omnidirectional
// explosion at cell CENTER; every non-pizz complex gets its own small
// signature flash anchored at the cell's LEFT EDGE (where the white
// triangle leg meets the sieve strip — outside the sieve itself, per
// "do not modify the sieve" constraint). All non-pizz flashes have
// roughly equal total visual weight and all are smaller than pizz, so
// the eye reads pizz as the only true explosion while still getting a
// distinct "yes the note started" signal for everything else.
function _emitSparks(pitch, velocity, complex, priorGlissPitch) {
  if (!rollCanvas) return;
  const cellRect = getSieveCellRect(pitch);
  if (!cellRect || cellRect.height === 0) return;
  const v = Math.max(0, Math.min(127, +velocity || 0)) / 127;
  switch (complex) {
    case 1:  _emitFlashPizz   (cellRect, v); break;
    case 2:
    case 3:  _emitFlashSmear  (cellRect, v); break;
    case 4:  _emitFlashHalo   (cellRect, v); break;
    case 5:
    case 6:
    case 7: {
      // Streak biases vertically toward the slide direction the user is
      // already executing — ascending pitch (current > prior) → streak
      // up (negative vy in canvas coords), descending → down. First
      // note of a new chain has no prior reference → vyBias 0 (neutral
      // leftward fan, slightly wider than smear so it still reads as
      // its own thing).
      let vyBias = 0;
      if (priorGlissPitch != null) {
        if      (pitch > priorGlissPitch) vyBias = -1;
        else if (pitch < priorGlissPitch) vyBias =  1;
      }
      _emitFlashGlissStreak(cellRect, v, vyBias);
      break;
    }
    case 8:  _emitFlashSpecks (cellRect, v); break;
    default: _emitFlashGeneric(cellRect, v); break;
  }
  if (sparks.length > SPARKS_MAX) sparks.splice(0, sparks.length - SPARKS_MAX);
}

function _emitFlashPizz(cellRect, v) {
  const cx = (cellRect.left + cellRect.width / 2) * rollDpr;
  const cy = (cellRect.top  + cellRect.height / 2) * rollDpr;
  const cellW = cellRect.width  * rollDpr;
  const cellH = cellRect.height * rollDpr;
  const count = Math.round(10 + 16 * v);
  const lifetimeMs = 350 + 1050 * v;
  const speedBase = 320 + 600 * v;
  const now = performance.now();
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = speedBase * (0.4 + 0.6 * Math.random());
    sparks.push({
      x:  cx + (Math.random() - 0.5) * cellW * 0.4,
      y:  cy + (Math.random() - 0.5) * cellH * 0.6,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      birthMs: now, lifetimeMs,
      radius: (1.5 + Math.random() * 1.5) * rollDpr,
    });
  }
}

// C2/C3 arco — horizontal smear: a tight leftward streak of dots that
// forms a momentary brush-stroke "kick" matching the wash/watercolor
// brush character. Strict-leftward velocity, near-zero vertical jitter.
function _emitFlashSmear(cellRect, v) {
  const x0 = cellRect.left * rollDpr;
  const cy = (cellRect.top + cellRect.height / 2) * rollDpr;
  const cellH = cellRect.height * rollDpr;
  const count = Math.round(10 + 9 * v);
  const lifetimeMs = 500 + 400 * v;
  const speedBase = 220 + 280 * v;
  const now = performance.now();
  for (let i = 0; i < count; i++) {
    const speed = speedBase * (0.4 + 0.7 * Math.random());
    const vyJitter = (Math.random() - 0.5) * speed * 0.08;
    sparks.push({
      x:  x0 + (Math.random() - 0.3) * 4 * rollDpr,
      y:  cy + (Math.random() - 0.5) * cellH * 0.18,
      vx: -speed,
      vy: vyJitter,
      birthMs: now, lifetimeMs,
      radius: (1.5 + Math.random() * 1.0) * rollDpr,
      holdFrac: 0.25,
    });
  }
}

// C4 harm — vertical halo: particles fan up and down from the contact
// point with small leftward drift, mimicking the airbrush brush's soft
// vertical aura. Lifetime is the longest of the non-pizz set so the
// halo lingers like a brief afterimage.
function _emitFlashHalo(cellRect, v) {
  const x0 = cellRect.left * rollDpr;
  const cy = (cellRect.top + cellRect.height / 2) * rollDpr;
  const count = Math.round(9 + 8 * v);
  const lifetimeMs = 550 + 500 * v;
  const speedBase = 110 + 140 * v;
  const now = performance.now();
  for (let i = 0; i < count; i++) {
    // Half the particles bias up, half bias down — produces a vertical
    // expanding aura. Tiny ±20 px/s leftward drift gives a subtle pull
    // toward the score area.
    const goUp = (i % 2) === 0;
    const baseAngle = goUp ? -Math.PI / 2 : Math.PI / 2;
    const angle = baseAngle + (Math.random() - 0.5) * Math.PI * 0.5;
    const speed = speedBase * (0.5 + 0.7 * Math.random());
    sparks.push({
      x:  x0 + (Math.random() - 0.3) * 3 * rollDpr,
      y:  cy,
      vx: Math.cos(angle) * speed - 25,
      vy: Math.sin(angle) * speed,
      birthMs: now, lifetimeMs,
      radius: (1.7 + Math.random() * 1.0) * rollDpr,
      holdFrac: 0.25,
    });
  }
}

// C5/C6/C7 gliss — directional streak anticipating the slide. vyBias
// −1 = streak up (ascending pitch trajectory), +1 = streak down,
// 0 = neutral leftward fan (first note of chain, no prior reference).
function _emitFlashGlissStreak(cellRect, v, vyBias) {
  const x0 = cellRect.left * rollDpr;
  const cy = (cellRect.top + cellRect.height / 2) * rollDpr;
  const cellH = cellRect.height * rollDpr;
  const count = Math.round(7 + 8 * v);
  const lifetimeMs = 500 + 400 * v;
  const speedBase = 150 + 200 * v;
  const now = performance.now();
  for (let i = 0; i < count; i++) {
    const speed = speedBase * (0.6 + 0.6 * Math.random());
    // Angle base = Math.PI (straight left); vyBias adds vertical kick;
    // small symmetric spread gives the streak a soft edge.
    const verticalKick = vyBias * (0.3 + 0.5 * Math.random());
    const symmetricSpread = (Math.random() - 0.5) * 0.4;
    const angle = Math.PI + verticalKick + symmetricSpread;
    sparks.push({
      x:  x0 + (Math.random() - 0.3) * 4 * rollDpr,
      y:  cy + (Math.random() - 0.5) * cellH * 0.15,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      birthMs: now, lifetimeMs,
      radius: (1.5 + Math.random() * 1.0) * rollDpr,
      holdFrac: 0.25,
    });
  }
}

// C8 chalk — scattered specks: many small particles shooting in random
// leftward-half-circle directions, matching the chalk-grit brush's
// pebble-dust character. Higher count compensates for smaller per-spark
// radius — specks should read as a quick puff, not a few stray dots.
function _emitFlashSpecks(cellRect, v) {
  const x0 = cellRect.left * rollDpr;
  const cy = (cellRect.top + cellRect.height / 2) * rollDpr;
  const cellH = cellRect.height * rollDpr;
  const count = Math.round(16 + 12 * v);
  const lifetimeMs = 400 + 400 * v;
  const speedBase = 90 + 130 * v;
  const now = performance.now();
  for (let i = 0; i < count; i++) {
    // Leftward semicircle: π/2..3π/2 (= 90°..270° in atan2 terms,
    // which spans straight-up through straight-left to straight-down).
    const angle = Math.PI * 0.5 + Math.random() * Math.PI;
    const speed = speedBase * (0.3 + 0.9 * Math.random());
    sparks.push({
      x:  x0 + (Math.random() - 0.5) * 6 * rollDpr,
      y:  cy + (Math.random() - 0.5) * cellH * 0.5,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      birthMs: now, lifetimeMs,
      radius: (1.0 + Math.random() * 0.8) * rollDpr,
      holdFrac: 0.20,
    });
  }
}

// C0 unknown / fallback — small leftward fan from cell center. Same
// shape as the previous non-pizz default; no signature character because
// C0 isn't a real musical complex (KS leakage / pre-init strays only).
function _emitFlashGeneric(cellRect, v) {
  const cx = (cellRect.left + cellRect.width / 2) * rollDpr;
  const cy = (cellRect.top  + cellRect.height / 2) * rollDpr;
  const cellH = cellRect.height * rollDpr;
  const count = Math.round(3 + 4 * v);
  const lifetimeMs = 250 + 300 * v;
  const speedBase = 70 + 110 * v;
  const now = performance.now();
  for (let i = 0; i < count; i++) {
    const angle = Math.PI + (Math.random() - 0.5) * 1.0;
    const speed = speedBase * (0.4 + 0.6 * Math.random());
    sparks.push({
      x: cx,
      y: cy + (Math.random() - 0.5) * cellH * 0.5,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      birthMs: now, lifetimeMs,
      radius: (0.9 + Math.random() * 0.7) * rollDpr,
    });
  }
}

function _tickAndDrawSparks(ctx, nowMs) {
  if (sparks.length === 0) { _sparksLastTickMs = nowMs; return; }
  const dt = (_sparksLastTickMs === 0)
    ? 0
    : Math.max(0, Math.min(0.1, (nowMs - _sparksLastTickMs) / 1000));
  _sparksLastTickMs = nowMs;
  // Frame-rate-independent exponential drag (~2% per 60fps frame so a 0.5 s
  // lifetime spark slows to ~30% of its initial speed by end of life).
  const dragK = Math.pow(0.98, dt * 60);
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.fillStyle = '#ffffff';
  let writeIdx = 0;
  for (let i = 0; i < sparks.length; i++) {
    const s = sparks[i];
    s.x  += s.vx * dt;
    s.y  += s.vy * dt;
    s.vx *= dragK;
    s.vy *= dragK;
    const age = nowMs - s.birthMs;
    if (age >= s.lifetimeMs) continue;
    const lifeF = 1 - age / s.lifetimeMs;
    // Hold-then-quadratic-fade alpha curve. `holdFrac` is the fraction
    // of lifetime kept at full alpha before the fade begins. Pizz uses
    // 0 (immediate quadratic fade — preserves the existing "looking
    // very nice" pizz feel). Non-pizz flashes use 0.20–0.25 so the
    // initial moment of the flash stays at full brightness long enough
    // for the eye to register it as an event before it fades — without
    // this hold, small/short flashes are perceptually invisible against
    // the brushstrokes scrolling beside them.
    const holdF = s.holdFrac || 0;
    const fadeStart = 1 - holdF;
    let alpha;
    if (lifeF >= fadeStart) {
      alpha = 1;
    } else {
      const remap = lifeF / fadeStart;
      alpha = remap * remap;
    }
    ctx.globalAlpha = alpha;
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
    ctx.fill();
    if (writeIdx !== i) sparks[writeIdx] = s;
    writeIdx++;
  }
  sparks.length = writeIdx;
  ctx.restore();
}

// Triangular-kernel low-pass filter for chain-local expression samples.
// The bridge emits CC 11 as integer-rounded values along `rampCC` ramps;
// each emit is a distinct integer separated from the next by anywhere
// from 15 ms (steep ramp) to ~150 ms (gentle ramp). Linear interpolation
// between adjacent samples leaves visible kinks at every integer step
// (the residual stepping that shows through after per-segment terracing
// is fixed). A short symmetric triangular kernel rounds those kinks
// into a continuous curve while preserving the multi-second phrase-arc
// envelope (window is ~5% of a typical 2 s phrase). Output array has
// the same length and timestamps as the input — only `v` is smoothed.
const EXPR_SMOOTH_WINDOW_MS = 140;
function _smoothExprSamples(samples) {
  if (samples.length < 3) return samples;
  const half = EXPR_SMOOTH_WINDOW_MS * 0.5;
  const out = new Array(samples.length);
  let lo = 0;
  for (let i = 0; i < samples.length; i++) {
    const t0 = samples[i].t;
    while (lo < samples.length && samples[lo].t < t0 - half) lo++;
    let sumV = 0, sumW = 0;
    for (let j = lo; j < samples.length; j++) {
      const dt = samples[j].t - t0;
      if (dt > half) break;
      const w = 1 - Math.abs(dt) / half;
      sumV += samples[j].v * w;
      sumW += w;
    }
    out[i] = { t: t0, v: sumW > 0 ? sumV / sumW : samples[i].v };
  }
  return out;
}

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

// `velScale(vel)` maps MIDI velocity 1..127 to a brush-size multiplier via a
// power curve: `0.15 + (norm)^1.6 × 2.0`. Range is 0.15..2.15 — quiet notes
// stay delicate but readable (0.10 floor previously vanished into hairlines
// at high zoom levels), loud dynamics still bloom heavy at the top end.
// The 1.6 exponent biases toward the upper end so dynamics pop. Used for
// C1 pizz (per-pluck dynamics live in velocity, not CC 11) and for C0
// (unknown-complex strays).
const velScale = (vel) => {
  const v = (typeof vel === 'number' && vel > 0) ? Math.min(127, vel) : 64;
  const norm = (v - 1) / 126;
  return 0.15 + Math.pow(norm, 1.6) * 2.0;
};

// Per-complex overrides for the `exprScale` dynamic range. Default
// is { floor: 0.15, ceil: 2.15 } — the same 0.15..2.15 range velScale
// uses. Tuned per complex when the default felt wrong:
//   • C2 RoughWash (arco) — floor 0.40. The bridge's D47 phrase arc
//     starts at CC 11 ≈ 24–38 (peakExpr × ARC_FLOOR=0.30) which the
//     global 0.15 floor mapped to ~0.27 width — hairline-thin at the
//     start of every cresc. Higher floor gives arco a readable body
//     at the soft end of the arc.
//   • C4 Airbrush (harmonic), C7 tasto gliss — floor 0.40, same
//     reasoning as C2: their soft-end widths needed more presence.
//   • C3 Watercolor (arco), C8 Chalk (sul-pont trem) — floor 0.20.
//     A modest lift from default but less than C2/C4/C7 because
//     these brushes' built-in textures (blobs / grit) already give
//     the eye something to lock onto at small scales.
//   • C5 wild gliss — floor 0.20, ceil 1.665. Floor lift gives the
//     thin tail of a fading wild section more substance; ceiling
//     cap pulls back peak loudness so wild's 1.4× line-width
//     multiplier doesn't dominate the score.
//   • C6 ord gliss — ceil 1.665. Same peak-cap reasoning. Floor
//     stays at the global default since C6's 1.0× multiplier reads
//     fine at the bottom of the dynamic range.
const COMPLEX_EXPR_RANGE = {
  2: { floor: 0.40, ceil: 2.15 },
  3: { floor: 0.20, ceil: 2.15 },
  4: { floor: 0.40, ceil: 2.15 },
  5: { floor: 0.20, ceil: 1.665 },
  6: { floor: 0.15, ceil: 1.665 },
  7: { floor: 0.40, ceil: 2.15 },
  8: { floor: 0.20, ceil: 2.15 },
};
const DEFAULT_EXPR_FLOOR = 0.15;
const DEFAULT_EXPR_CEIL  = 2.15;

// `exprScale(cc11, complex)` maps CC 11 (Expression) 0..127 via the
// same power curve as velScale, so brush sizing stays consistent
// whether driven by velocity or expr. The bridge's D47 invariant
// ramps CC 11 linearly from `peakExpr × ARC_FLOOR (0.30)` to
// `peakExpr × ARC_CEIL (1.00)` across a phrase, so CC 11 carries
// the actual audible dynamic curve that velocity (one discrete
// value per noteon, ±15% humanised) can't capture.
const exprScale = (cc11, complex) => {
  const v = (typeof cc11 === 'number' && cc11 >= 0) ? Math.min(127, cc11) : DEFAULT_EXPR;
  const norm = v / 127;
  const r = COMPLEX_EXPR_RANGE[complex];
  const floor = r ? r.floor : DEFAULT_EXPR_FLOOR;
  const ceil  = r ? r.ceil  : DEFAULT_EXPR_CEIL;
  return floor + Math.pow(norm, 1.6) * (ceil - floor);
};

// D70 — trace-sampled brush rendering replaces the legacy two-endpoint
// `{start, end}` linear interp model. The legacy model assumed within-note
// expression is linear — true for cresc/dim arcs (D47 ramps are linear),
// but FALSE for hairpin envelopes (D'/B' faces) whose CC 11 is V- or
// Λ-shaped. Linear interp from `exprAtOn` to live `voiceExpr` could only
// reconstruct the trough/peak during the single frame when live === extremum;
// as live recovered post-extremum, the entire previously-narrowed brush body
// got overdrawn with a fresh wide lerp. By noteoff, hairpin's `start ≈ end`
// → uniformly thick band, no trough visible.
//
// Trace sampling reads the actual recorded CC 11 trace at each polygon
// vertex's t, so V/Λ shapes render faithfully and history of past extrema
// persists in the rendered band across frames. Cresc/dim arcs render
// visually identical to the legacy linear-endpoint model (a monotonic trace
// and a linear endpoint interp produce the same polygon).

// Binary search: largest i s.t. buf[i].t <= t. Returns -1 for empty buf.
function _findTraceIdx(buf, t) {
  if (!buf || buf.length === 0) return -1;
  if (t <= buf[0].t) return 0;
  let lo = 0, hi = buf.length - 1;
  if (t >= buf[hi].t) return hi;
  while (lo + 1 < hi) {
    const mid = (lo + hi) >> 1;
    if (buf[mid].t <= t) lo = mid;
    else hi = mid;
  }
  return lo;
}

// Build a per-note trace buffer for a draw call. Finished notes use the
// frozen slice `evt.exprSamples` (immutable, voice-private). Active notes
// slice the live `voiceExprHistory` to entries with t >= evt.onsetMs to
// exclude prior-phrase residue (POOL_SIZE = 1, all complexes share voice 1
// → live buffer interleaves every past phrase's CC 11). Built once per
// `drawNote` call and reused across every polygon vertex / particle in the
// brush; binary search inside the buffer is O(log N).
function _buildTraceBuf(evt, isActive) {
  if (evt.complex === 1 || evt.complex === 0) return null;
  if (!isActive) return evt.exprSamples || null;
  const live = voiceExprHistory.get(evt.voice);
  if (!live || live.length === 0) return null;
  const t0 = evt.onsetMs;
  const out = [];
  for (let i = 0; i < live.length; i++) {
    if (live[i].t >= t0) out.push(live[i]);
  }
  return out.length > 0 ? out : null;
}

// Per-vertex brush scale at time t for an evt. Sustained complexes
// (C2/C3/C4/C8) read from `bctx.buf` (the per-note trace built in drawNote);
// falls back to the legacy two-endpoint linear interp when no trace data
// exists (pre-init, panic recovery, any path that doesn't carry CC 11).
// C0/C1 are velocity-driven and ignore t.
// (Gliss complexes C5/C6/C7 don't reach drawNote — chain pass renders them.)
function sampleScaleAtT(evt, t, bctx) {
  if (evt.complex === 1 || evt.complex === 0) return velScale(evt.velocity);
  const buf = bctx.buf;
  if (buf && buf.length > 0) {
    const i = _findTraceIdx(buf, t);
    if (i >= 0) return exprScale(buf[i].v, evt.complex);
  }
  // Legacy fallback — preserves pre-D70 behaviour when trace data is absent.
  const onV = (typeof evt.exprAtOn === 'number') ? evt.exprAtOn : DEFAULT_EXPR;
  const endV = bctx.isActive
    ? (voiceExpr.has(evt.voice) ? voiceExpr.get(evt.voice) : onV)
    : ((typeof evt.exprAtOff === 'number') ? evt.exprAtOff : onV);
  const f = (bctx.t1 > bctx.t0)
    ? Math.max(0, Math.min(1, (t - bctx.t0) / (bctx.t1 - bctx.t0)))
    : 0;
  return exprScale(onV + (endV - onV) * f, evt.complex);
}

// D70 — fill a band whose half-height varies along x by sampling the per-
// voice CC 11 trace at each polygon vertex's corresponding t. Caller passes
// `baseHFactor` (already includes any per-brush 0.5/1.0 multiplier) and
// `bctx = { isActive, x0u, x1u, t0, t1 }` carrying the unclipped x-range +
// time range so the trace lookup is independent of the visible window's
// left clip. Used by the band-style brushes (RoughWash core, Watercolor
// body, Chalk band, HardRound). Sample density tuned to the same 3
// device-px resolution the gliss chain uses so curves read smooth.
function fillVaryingBand(ctx, xVisible0, xVisible1, y, baseHFactor, evt, bctx) {
  const w = Math.max(1, xVisible1 - xVisible0);
  const samples = Math.max(2, Math.ceil(w / (3 * rollDpr)));
  const dxU = bctx.x1u - bctx.x0u;
  const dt  = bctx.t1 - bctx.t0;
  ctx.beginPath();
  for (let i = 0; i <= samples; i++) {
    const f = i / samples;
    const px = xVisible0 + f * w;
    const fU = dxU > 0 ? (px - bctx.x0u) / dxU : 0;
    const t  = bctx.t0 + dt * fU;
    const h  = baseHFactor * sampleScaleAtT(evt, t, bctx);
    if (i === 0) ctx.moveTo(px, y - h);
    else         ctx.lineTo(px, y - h);
  }
  for (let i = samples; i >= 0; i--) {
    const f = i / samples;
    const px = xVisible0 + f * w;
    const fU = dxU > 0 ? (px - bctx.x0u) / dxU : 0;
    const t  = bctx.t0 + dt * fU;
    const h  = baseHFactor * sampleScaleAtT(evt, t, bctx);
    ctx.lineTo(px, y + h);
  }
  ctx.closePath();
  ctx.fill();
}

// ---- Brush palette ---------------------------------------------------------

function brushSpatter(ctx, x0, x1, y, color, alpha, evt, _bctx) {
  // C1 pizz: per-pluck velocity drives the scale — no within-note CC 11 swell
  // to chase, no trace sampling needed. `_bctx` accepted for dispatch
  // uniformity but ignored.
  const x = Math.max(0, x0);
  const w = Math.max(2 * rollDpr, x1 - x);
  const seed = noteSeed(evt);
  const dotCount = Math.max(12, Math.min(60, Math.floor(w / (2.2 * rollDpr))));
  const vs = velScale(evt.velocity);
  const spreadH = bu(1.15) * vs;
  ctx.fillStyle = color;
  ctx.globalAlpha = alpha;
  for (let i = 0; i < dotCount; i++) {
    const px = x + lcg(seed) * w;
    const py = y + (lcg(seed) - 0.5) * spreadH;
    const r  = bu(0.08 + lcg(seed) * 0.13) * vs;
    ctx.beginPath();
    ctx.arc(px, py, r, 0, Math.PI * 2);
    ctx.fill();
  }
  for (let i = 0; i < 5; i++) {
    const px = x + lcg(seed) * w;
    const py = y + (lcg(seed) - 0.5) * bu(0.4) * vs;
    const r  = bu(0.18 + lcg(seed) * 0.21) * vs;
    ctx.beginPath();
    ctx.arc(px, py, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function brushRoughWash(ctx, x0, x1, y, color, alpha, evt, bctx) {
  const x = Math.max(0, x0);
  const w = Math.max(2 * rollDpr, x1 - x);
  // Diffuse gradient backdrop — sized to mid-trace scale (gradient is
  // rectangular, so per-x variation would need clipping; the wash effect
  // dominates the visual signature here, leave it uniform). Core line varies
  // along x via trace-sampled fillVaryingBand.
  const sMid = sampleScaleAtT(evt, (bctx.t0 + bctx.t1) * 0.5, bctx);
  const bandH = bu(1.45) * sMid;
  const grad = ctx.createLinearGradient(0, y - bandH, 0, y + bandH);
  grad.addColorStop(0,   'rgba(0,0,0,0)');
  grad.addColorStop(0.5, color);
  grad.addColorStop(1,   'rgba(0,0,0,0)');
  ctx.fillStyle = grad;
  ctx.globalAlpha = alpha * 0.55;
  ctx.fillRect(x, y - bandH, w, bandH * 2);
  // Core line: half-height tracks the actual CC 11 trace at each vertex.
  const coreHBase = bu(0.5) * 0.5;
  ctx.fillStyle = color;
  ctx.globalAlpha = alpha * 0.8;
  fillVaryingBand(ctx, x, x + w, y, coreHBase, evt, bctx);
  ctx.globalAlpha = 1;
}

function brushWatercolor(ctx, x0, x1, y, color, alpha, evt, bctx) {
  const x = Math.max(0, x0);
  const w = Math.max(2 * rollDpr, x1 - x);
  const bodyHBase = bu(1.0);
  const seed = noteSeed(evt);
  // Outer + inner body bands: polygons with trace-sampled half-heights.
  ctx.fillStyle = color;
  ctx.globalAlpha = alpha * 0.25;
  fillVaryingBand(ctx, x, x + w, y, bodyHBase, evt, bctx);
  ctx.globalAlpha = alpha * 0.85;
  fillVaryingBand(ctx, x, x + w, y, bodyHBase * 0.5, evt, bctx);
  // Blobs: each at its own seeded x — radius sampled at that x's t.
  ctx.globalAlpha = alpha * 0.6;
  const blobCount = 2 + Math.floor(w / (35 * rollDpr));
  const dxU = bctx.x1u - bctx.x0u;
  const dt  = bctx.t1 - bctx.t0;
  for (let i = 0; i < blobCount; i++) {
    const f = 0.1 + lcg(seed) * 0.8;
    const px = x + f * w;
    const fU = dxU > 0 ? (px - bctx.x0u) / dxU : 0;
    const t  = bctx.t0 + dt * fU;
    const blobScale = sampleScaleAtT(evt, t, bctx);
    const r = bu(0.3 + lcg(seed) * 0.3) * blobScale;
    ctx.beginPath();
    ctx.arc(px, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function brushAirbrush(ctx, x0, x1, y, color, alpha, evt, bctx) {
  const x = Math.max(0, x0);
  const w = Math.max(2 * rollDpr, x1 - x);
  const radiusBase = bu(1.15);
  // Step density uses mid-trace scale for stepCount math (fixed step spacing
  // across the note); each puck's actual radius is sampled at that puck's
  // t. Sub-pixel stepping merges pucks into a continuous airbrush; per-
  // puck alpha is dialled low to compensate for the accumulated overpaint.
  const sMid = sampleScaleAtT(evt, (bctx.t0 + bctx.t1) * 0.5, bctx);
  const stepCount = Math.max(2, Math.floor(w / (radiusBase * sMid * 0.06)));
  const dxU = bctx.x1u - bctx.x0u;
  const dt  = bctx.t1 - bctx.t0;
  ctx.globalAlpha = alpha * 0.09;
  for (let i = 0; i < stepCount; i++) {
    const f = stepCount === 1 ? 0.5 : (i / (stepCount - 1));
    const px = x + f * w;
    const fU = dxU > 0 ? (px - bctx.x0u) / dxU : 0;
    const t  = bctx.t0 + dt * fU;
    const scale = sampleScaleAtT(evt, t, bctx);
    const radius = radiusBase * scale;
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

function brushChalk(ctx, x0, x1, y, color, alpha, evt, bctx) {
  const x = Math.max(0, x0);
  const w = Math.max(2 * rollDpr, x1 - x);
  const bandHBase = bu(1.35);
  const seed = noteSeed(evt);
  // Band: polygon with trace-sampled half-height — captures hairpin V/Λ
  // shape on long C8 phrases (D70).
  ctx.fillStyle = color;
  ctx.globalAlpha = alpha * 0.55;
  fillVaryingBand(ctx, x, x + w, y, bandHBase * 0.5, evt, bctx);
  // Specks: each slot's vertical spread + size sampled at that slot's t.
  ctx.globalAlpha = alpha;
  const slotCount = Math.floor(w / (1.4 * rollDpr));
  const dxU = bctx.x1u - bctx.x0u;
  const dt  = bctx.t1 - bctx.t0;
  for (let i = 0; i < slotCount; i++) {
    if (lcg(seed) < 0.5) continue;
    const slotF = i / Math.max(1, slotCount);
    const px = x + slotF * w + lcg(seed) * 2 * rollDpr;
    const fU = dxU > 0 ? (px - bctx.x0u) / dxU : 0;
    const t  = bctx.t0 + dt * fU;
    const speckScale = sampleScaleAtT(evt, t, bctx);
    const localBandH = bandHBase * speckScale;
    const py = y + (lcg(seed) - 0.5) * localBandH * 1.1;
    const sw = bu(0.08 + lcg(seed) * 0.13) * speckScale;
    const sh = bu(0.08 + lcg(seed) * 0.10) * speckScale;
    ctx.fillRect(px, py, sw, sh);
  }
  ctx.globalAlpha = 1;
}

function brushHardRound(ctx, x0, x1, y, color, alpha, evt, bctx) {
  const x = Math.max(0, x0);
  const w = Math.max(2 * rollDpr, x1 - x);
  const rowHBase = bu(0.72);
  ctx.fillStyle = color;
  ctx.globalAlpha = alpha;
  fillVaryingBand(ctx, x, x + w, y, rowHBase * 0.5, evt, bctx);
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

function drawNote(ctx, evt, x0, x1, y, alpha, isActive) {
  if (x1 < 0) return;
  // Gliss complexes are normally handled by `buildGlissChains` (chain pass).
  // Current gliss companions short-circuit before queue insertion and render
  // as translated chain overlays; the `evt.isCompanion` fallback below is for
  // legacy/defensive queue entries only.
  if (GLISS_COMPLEXES.has(evt.complex) && !evt.isCompanion) return;
  const color = COMPLEX_COLOR[evt.complex] || COMPLEX_COLOR[0];
  const brush = COMPLEX_BRUSH[evt.complex] || brushHardRound;
  // D70 — bctx carries the unclipped x-range + t-range so brushes / fillVaryingBand
  // can sample the per-voice CC 11 trace at any vertex's t. Replaces the legacy
  // two-point `scales` model which couldn't represent within-note hairpins.
  // `buf` is the per-note trace built once per draw call (frozen slice for
  // finished, filtered live slice for active).
  const bctx = {
    isActive,
    x0u: x0,                                             // unclipped onset x
    x1u: x1,                                             // unclipped end x (rightEdge for active)
    t0:  evt.onsetMs,
    t1:  isActive ? performance.now() : evt.offsetMs,
    buf: _buildTraceBuf(evt, isActive),
  };
  brush(ctx, x0, x1, y, color, alpha, evt, bctx);
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
    if (evt.isCompanion) continue;  // companions are overlay-only, not chain nodes
    push(evt, timeToX(evt.onsetMs, nowMs, w), timeToX(evt.offsetMs, nowMs, w), midiToY(evt.pitch, h));
  }
  const rightEdge = rollRightEdge(w);
  for (const queue of activeMidiNotes.values()) {
    for (const evt of queue) {
      if (!GLISS_COMPLEXES.has(evt.complex)) continue;
      if (evt.isCompanion) continue;  // companions are overlay-only, not chain nodes
      push(evt, timeToX(evt.onsetMs, nowMs, w), rightEdge, midiToY(evt.pitch, h));
    }
  }
  // D59 — bend segments are first-class chain participants. They synthesise
  // an `evt` shape compatible with noteon-derived nodes (voice, complex,
  // onsetMs, offsetMs=t0+dur, pitch=p1) PLUS an `isBend=true` marker and
  // explicit `p0` so `_buildGlissSegments` can use the bend's authoritative
  // start pitch rather than recomputing from the prior segment chain.
  // D60 — for in-flight bends (t0+dur > nowMs), clamp the visual x1 at
  // rightEdge so the chain doesn't render past "now". The segment math
  // (p0/dur/t0 for `_glissPitchAt` interpolation) stays unchanged; only
  // the visual endpoint clamps. Without this, the chain drew the bend's
  // destination as a horizontal line ahead of current time — the user-
  // reported "drawing future notes" symptom.
  for (const bs of bendSegments) {
    if (!GLISS_COMPLEXES.has(bs.complex)) continue;
    const bsEnd = bs.t0 + bs.dur;
    const evt = {
      voice:      bs.voice,
      complex:    bs.complex,
      onsetMs:    bs.t0,
      offsetMs:   bsEnd,
      pitch:      bs.p1,
      p0:         bs.p0,    // bend-only field
      bendDur:    bs.dur,   // bend-only field
      isBend:     true,
      chainStart: false,    // bends never break chains
    };
    const x1 = (bsEnd > nowMs) ? rightEdge : timeToX(bsEnd, nowMs, w);
    push(evt, timeToX(bs.t0, nowMs, w), x1, midiToY(bs.p1, h));
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
          voice:   node.evt.voice,    // D72.6 — needed for companion-offset lookup at draw time
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
  // D66 — cap at GLISS_SLIDE_MAX_DUR_MS (195 ms) so a segment always
  // completes before MIN_GLISS_SPACING_MS = 200 ms event spacing
  // overrides it. Without this, wide-interval wild-gliss segments
  // (e.g. 28 semis × 50 ms/semi = 1400 ms) only walk 14 % of their
  // arc before the next event takes over, collapsing visual amplitude
  // to ~6 % of the actual pitch swing the user hears. With cap, full
  // amplitude is restored.
  return Math.max(80, Math.min(GLISS_SLIDE_MAX_DUR_MS, interval * perSemi));
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
  // First node — stationary at its pitch. Bend nodes use their stated
  // p0 (no prior segment to inherit from).
  const first = nodes[0].evt;
  if (first.isBend) {
    segs.push({ t0: first.onsetMs, dur: first.bendDur, p0: first.p0, p1: first.pitch });
  } else {
    segs.push({ t0: first.onsetMs, dur: 0, p0: first.pitch, p1: first.pitch });
  }
  for (let i = 1; i < nodes.length; i++) {
    const n = nodes[i].evt;
    const startT = n.onsetMs;
    const pitchAtStart = _glissPitchAt(startT, segs);
    if (n.isBend) {
      // D65 — bend's p0 inherits the audible pitch at bend-start from
      // prior segments. See CLAUDE.md Visual Invariants row 3.
      segs.push({ t0: startT, dur: n.bendDur, p0: pitchAtStart, p1: n.pitch });
    } else {
      // Segment dur uses the same interval × per-semi formula for ALL
      // segments (in-flight, finished, last, non-last). The dur is
      // determined at noteon-time and never recomputed — what's drawn
      // during in-flight stays drawn after noteoff or interrupt, no
      // retroactive re-render when the next event arrives. Cap at
      // GLISS_SLIDE_MAX_DUR_MS so wide intervals reach full visual
      // amplitude before MIN_GLISS_SPACING_MS event spacing overrides.
      // Mirror of triangle.js's `predictGlissDuration` — both sides use
      // the same model so `assertGlissSync` holds.
      const perSemi = GLISS_PORTAMENTO_MS_PER_SEMITONE[n.complex] || 80;
      const interval = Math.abs(n.pitch - pitchAtStart);
      const segDur = Math.max(80, Math.min(GLISS_SLIDE_MAX_DUR_MS, interval * perSemi));
      segs.push({
        t0: startT,
        dur: segDur,
        p0:  pitchAtStart,
        p1:  n.pitch,
      });
    }
  }
  return segs;
}

// Per-complex line-width multiplier — shape doubles up with the COMPLEX_COLOR
// hue split so the eye distinguishes the three gliss complexes by both colour
// AND contour even when one is half-occluded behind another or when the
// dashboard is small.
//   C5 wild:  1.4× — heavy stroke, matches the "wild" character
//   C6 ord:   1.0× — default
//   C7 tasto: 0.7× with halo — wispy/airy
const GLISS_LINE_WIDTH_MUL = { 5: 1.4, 6: 1.0, 7: 0.7 };

function drawGlissChain(ctx, chain, nowMs, canvasW, canvasH) {
  const { complex, color, nodes } = chain;
  if (nodes.length === 0) return;
  const segs = _buildGlissSegments(nodes);
  const lineW = bu(0.85) * (GLISS_LINE_WIDTH_MUL[complex] || 1.0);

  const startX = nodes[0].x0;
  const endX   = nodes[nodes.length - 1].x1;
  const span   = Math.max(1, endX - startX);
  const samplePx = 3 * rollDpr;
  const numSamples = Math.max(2, Math.ceil(span / samplePx));
  const pxPerMs = ROLL_PX_PER_SEC * rollDpr / 1000;
  const rightEdge = rollRightEdge(canvasW);

  // CC 11 (Expression) → lineWidth: build a chain-local expr sample array
  // from each node's frozen `exprSamples` (stamped at noteoff — see
  // `noteOff`/`sliceExprHistory`). For any active node still in flight,
  // slice the live `voiceExprHistory` for its [onsetMs, nowMs] range —
  // active = recent, so the live buffer always covers it.
  //
  // Why per-node frozen samples (not the shared live buffer): with
  // POOL_SIZE = 1, all complexes share `voiceExprHistory[1]`, and the
  // ring's age cull (5 s) drops past entries as new ones arrive. A
  // finished gliss chain still on screen but with its buffer slice
  // culled would have all its samples fall through to `buf[0].v` —
  // which after the cull is the OLDEST SURVIVING entry, belonging to a
  // LATER complex. Result: past gliss chains retroactively widen/narrow
  // to track the current complex's CC 11. Frozen per-note slices are
  // immutable, voice-private, and never polluted by intervening writes.
  //
  // Bend nodes are skipped — the bend's source noteon is still active
  // during the bend so its `exprSamples` covers the bend's time range.
  const fallbackV = (typeof nodes[0].evt.exprAtOn === 'number')
    ? nodes[0].evt.exprAtOn
    : DEFAULT_EXPR;
  const liveBuf = voiceExprHistory.get(nodes[0].evt.voice);
  const exprChainSamples = [];
  for (let n = 0; n < nodes.length; n++) {
    const evt = nodes[n].evt;
    if (evt.isBend) continue;
    if (evt.exprSamples && evt.exprSamples.length > 0) {
      for (let k = 0; k < evt.exprSamples.length; k++) exprChainSamples.push(evt.exprSamples[k]);
    } else if (liveBuf) {
      // Active node — no frozen slice yet. Sample live buffer for this
      // node's time window. (Active = its noteOff hasn't fired, so
      // offsetMs is undefined; bound the slice at nowMs.)
      const t0 = evt.onsetMs;
      const t1 = (typeof evt.offsetMs === 'number') ? evt.offsetMs : nowMs;
      for (let k = 0; k < liveBuf.length; k++) {
        if (liveBuf[k].t >= t0 && liveBuf[k].t <= t1) exprChainSamples.push(liveBuf[k]);
      }
    }
  }
  exprChainSamples.sort((a, b) => a.t - b.t);
  // Low-pass the integer-stepped emit stream so width transitions read
  // as a continuous curve instead of a piecewise-linear staircase.
  const smoothedExpr = _smoothExprSamples(exprChainSamples);
  const exprAtTime = (t) => {
    if (smoothedExpr.length === 0) return fallbackV;
    if (t <= smoothedExpr[0].t) return smoothedExpr[0].v;
    const last = smoothedExpr[smoothedExpr.length - 1];
    if (t >= last.t) return last.v;
    for (let i = 1; i < smoothedExpr.length; i++) {
      if (t <= smoothedExpr[i].t) {
        const prev = smoothedExpr[i - 1];
        const next = smoothedExpr[i];
        const dt = next.t - prev.t;
        if (dt <= 0) return next.v;
        const f = (t - prev.t) / dt;
        return prev.v + (next.v - prev.v) * f;
      }
    }
    return last.v;
  };

  // Pre-sample (x, y, w, t, compDy) once. Reused across the 3 strokePath
  // invocations for C7 (halo×2 + main) so we don't recompute the curve /
  // expr lookup three times.
  //
  // D73 — per-sample `compDy` carries the parallel-companion vertical
  // offset (in device px) for that sample's time, or null if no companion
  // segment was active at that moment. Companion overlay draw is then a
  // per-pair stroke that only paints across pairs where BOTH a.compDy and
  // b.compDy are non-null AND equal (segment boundaries within the chain
  // produce a natural gap). This is what pins past chains' overlays to the
  // companion lifetimes that overlapped them — pre-D73, a single global
  // map entry was used for every sample of every chain.
  const samples = new Array(numSamples + 1);
  for (let i = 0; i <= numSamples; i++) {
    const x = startX + span * i / numSamples;
    const t = nowMs - (rightEdge - x) / pxPerMs;
    const p = _glissPitchAt(t, segs);
    const y = midiToY(p, canvasH);
    samples[i] = {
      x, y, t,
      w: lineW * exprScale(exprAtTime(t), complex),
      compDy: _companionDyAt(chain.voice, complex, t, nowMs),
    };
  }

  // Stroke as per-sample-pair short segments, each with its own averaged
  // lineWidth. With round caps the joints overlap circularly, so width
  // changes appear smooth even though each sub-stroke is technically a
  // single-width line. Centerline (x, y) is unchanged from the previous
  // single-stroke path, so Visual Invariant #3 (gliss-line trajectory)
  // is preserved exactly — only the *width* varies, not the position.
  const strokePath = (dy, baseScale, alpha) => {
    ctx.strokeStyle = color;
    ctx.lineCap     = 'round';
    ctx.lineJoin    = 'round';
    ctx.globalAlpha = alpha;
    for (let i = 1; i <= numSamples; i++) {
      const a = samples[i - 1];
      const b = samples[i];
      ctx.lineWidth = (a.w + b.w) * 0.5 * baseScale;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y + dy);
      ctx.lineTo(b.x, b.y + dy);
      ctx.stroke();
    }
  };

  if (complex === 7) {
    // Halo offset stays anchored to the BASE lineW (not velocity-scaled)
    // so the halo's vertical position is stable across a phrase; only its
    // thickness breathes with velocity via baseScale=0.6.
    const haloOffset = lineW * 1.6;
    strokePath(-haloOffset, 0.6, 0.28);
    strokePath(+haloOffset, 0.6, 0.28);
  }
  strokePath(0, 1, 0.95);

  // D72.6 + D73 — parallel companion overlay. Per-sample-pair: stroke a
  // pair iff BOTH endpoints had a companion segment active at their time
  // AND share the same offset (=> same segment, no boundary crossing).
  // Pairs straddling a segment boundary (one endpoint inside, one outside)
  // are left unstroked, so the overlay naturally starts/ends at companion
  // lifetimes WITHIN the chain. Slightly lower alpha so the eye reads the
  // main as primary and the companion as its sympathetic shadow.
  ctx.strokeStyle = color;
  ctx.lineCap     = 'round';
  ctx.lineJoin    = 'round';
  ctx.globalAlpha = 0.78;
  for (let i = 1; i <= numSamples; i++) {
    const a = samples[i - 1];
    const b = samples[i];
    if (a.compDy == null || b.compDy == null) continue;
    if (a.compDy !== b.compDy) continue;
    ctx.lineWidth = (a.w + b.w) * 0.5 * 0.9;
    ctx.beginPath();
    ctx.moveTo(a.x, a.y + a.compDy);
    ctx.lineTo(b.x, b.y + b.compDy);
    ctx.stroke();
  }

  ctx.globalAlpha = 1;
}

// D73 — return the parallel-companion vertical offset (device px) for
// (voice, complex) at time `t`, or null if no companion segment overlaps.
// Open segments (t1==null) extend up to `nowMs`. Time-bounded so past chains'
// overlays stay pinned to whatever companion was held when they were live.
function _companionDyAt(voice, complex, t, nowMs) {
  for (let i = 0; i < companionSegments.length; i++) {
    const cs = companionSegments[i];
    if (cs.voice !== voice || cs.complex !== complex) continue;
    const segT1 = (cs.t1 != null) ? cs.t1 : nowMs;
    if (cs.t0 <= t && t <= segT1) return -cs.offsetSemis * rollRowH;
  }
  return null;
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
  // D59 — bend segments are time-bounded just like notes (t0..t0+dur);
  // cull when fully off-screen on the left.
  while (bendSegments.length && (bendSegments[0].t0 + bendSegments[0].dur) < horizonMs - 500) {
    bendSegments.shift();
  }
  // D73 — companion segments cull only when CLOSED (t1 != null) and past
  // horizon. Open segments (t1==null) are still active and never culled.
  // Walk from the back so splice indices stay valid; segments for one
  // (voice, complex) are ordered oldest→newest at insertion time but
  // multiple voices can interleave, so we don't assume sorted-by-t1.
  for (let i = companionSegments.length - 1; i >= 0; i--) {
    const cs = companionSegments[i];
    if (cs.t1 != null && cs.t1 < horizonMs - 500) {
      companionSegments.splice(i, 1);
    }
  }

  for (const evt of finishedMidiNotes) {
    const x0 = timeToX(evt.onsetMs,  nowMs, w);
    const x1 = timeToX(evt.offsetMs, nowMs, w);
    const y  = midiToY(evt.pitch, h);
    const alpha = 0.55 + 0.45 * Math.min(1, evt.velocity / 110);
    drawNote(rollCtx, evt, x0, x1, y, alpha, false);
  }
  const rightEdge = rollRightEdge(w);
  for (const queue of activeMidiNotes.values()) {
    for (const evt of queue) {
      const x0 = timeToX(evt.onsetMs, nowMs, w);
      const y  = midiToY(evt.pitch, h);
      const alpha = 0.7 + 0.3 * Math.min(1, evt.velocity / 110);
      drawNote(rollCtx, evt, x0, rightEdge, y, alpha, true);
    }
  }

  const chains = buildGlissChains(nowMs, w, h);
  for (const chain of chains) drawGlissChain(rollCtx, chain, nowMs, w, h);

  // Sparks render LAST so they sit on top of brushes and chain strokes —
  // an `globalCompositeOperation = 'lighter'` pass that's saved/restored
  // around the spark draw so it doesn't bleed into other paint passes.
  _tickAndDrawSparks(rollCtx, nowMs);

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
  // D59 — include bend segments as chain participants (same shape as
  // synthesised in buildGlissChains for visual rendering).
  for (const bs of bendSegments) {
    if (bs.voice !== voice || bs.complex !== complex) continue;
    evts.push({
      voice:      bs.voice,
      complex:    bs.complex,
      onsetMs:    bs.t0,
      offsetMs:   bs.t0 + bs.dur,
      pitch:      bs.p1,
      p0:         bs.p0,
      bendDur:    bs.dur,
      isBend:     true,
      chainStart: false,
    });
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
  const chainY     = midiToY(chainPitch, rollCanvas.height) / rollDpr;
  // Prefer the line's ACTUAL rendered CSS-px Y (display.sieveY) over a
  // pitch-via-midiToY proxy. The proxy makes the assertion silent when
  // line and chain agree on fractional pitch but the line's pitch→Y
  // resolver truncates (e.g. sieveCellLeftEdgePos snapping to integer
  // cell centres) — both sides report the same midiToY(pitch) value
  // even though the line is drawing a stair-stepping endpoint and the
  // chain is drawing a continuous curve. Comparing display.sieveY
  // against midiToY(chainPitch) catches that resolver-level drift.
  // Fallback to the legacy proxy if the line did not report sieveY
  // (line out of sieve range, missing init).
  const lineY = (typeof display.sieveY === 'number')
    ? display.sieveY
    : midiToY(linePitch, rollCanvas.height) / rollDpr;
  const drift  = Math.abs(lineY - chainY);
  // D67 — threshold raised from 1 px to 5 px. With chain segment dur
  // now gap-based (next.onsetMs - this.onsetMs - 5) and line animDur
  // predictor based on lastEventByVk gap, the two models agree to
  // floating-point precision after the first slide of each phrase. The
  // FIRST slide has a gap mismatch (anchor → drift = FIRST_GLISS_MS =
  // 150 ms while the line's predictor uses interval-based fallback),
  // producing transient 1–3 px drift for ~150 ms. The 5 px threshold
  // absorbs this without losing the architectural-drift catch (real
  // bugs are 10+ px).
  if (drift > 5) {
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
      const preFadeV = exprAtLookback(pending.voice, now, EXPR_PRE_FADE_LOOKBACK_MS, pending.onsetMs);
      const finished = {
        pitch:      pending.pitch,
        velocity:   pending.velocity,
        voice:      pending.voice,
        complex:    pending.complex,
        onsetMs:    pending.onsetMs,
        offsetMs:   now,
        exprAtOn:   pending.exprAtOn,
        exprAtOff:  preFadeV,
        exprSamples: sliceExprHistory(pending.voice, pending.onsetMs, now),  // D71 — raw
        chainStart: pending.chainStart,    // D56 — see noteOff()
        // Without this propagation the companion's flag is lost when the
        // entry transitions from active queue → finished ring; the chain
        // pass then fails its `evt.isCompanion` filter and includes the
        // companion as a slide-target node, zigzagging the rendered path
        // between anchor pitch and companion pitch (the user-reported
        // "draws note on, doesn't track pitchbend, then averages between
        // two voices" symptom).
        isCompanion: pending.isCompanion === true,
      };
      finishedMidiNotes.push(finished);
      _auditHairpinTrace(finished);
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
  // Wide-gamut: ask for a Display-P3-backed buffer so the COMPLEX_COLOR
  // strings (auto-selected to P3 syntax in constants.js when the
  // browser supports it) actually land at saturated P3 points instead
  // of being gamut-mapped down to sRGB on the way to the buffer.
  // Browsers that don't recognise the option silently ignore it and
  // return a default (sRGB) context — no exception, no breakage, same
  // call shape as before.
  rollCtx = rollCanvas.getContext('2d', { colorSpace: 'display-p3' });
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
  // D72.6 — companion short-circuit. A companion noteon is NOT a chain
  // participant, NOT a brush, NOT a sieve highlight, NOT a triangle line.
  // It's recorded as a fixed offset against the current main pitch and
  // rendered at draw time as a translated copy of the main's chain
  // Path2D. This is the user-stated model: "just need the starting
  // pitch and apply the same transform as the original voice". No
  // independent trajectory tracking, no separate noteoff lifecycle for
  // visuals — the parallel overlay shows whenever the main chain is
  // visible, hides whenever it isn't.
  if (data.isCompanion === true && GLISS_COMPLEXES.has(cmx)) {
    const mainPitch = _findCurrentMainPitch(data.voice, cmx);
    if (mainPitch != null) {
      const offset = data.pitch - mainPitch;
      const now = performance.now();
      // D73 — close any prior open segment for the same (voice, complex)
      // before pushing a fresh one. C5 rebow companions noteoff the prior
      // companion before adding a fresh one (see phraseC5's `companionRef`
      // dance), but a defensive close here covers the corner case where
      // two companion noteons land back-to-back without an intervening
      // noteoff.
      for (let i = 0; i < companionSegments.length; i++) {
        const cs = companionSegments[i];
        if (cs.voice === data.voice && cs.complex === cmx && cs.t1 == null) {
          cs.t1 = now;
        }
      }
      companionSegments.push({
        voice:          data.voice,
        complex:        cmx,
        offsetSemis:    offset,
        companionPitch: data.pitch,
        t0:             now,
        t1:             null,    // still active
      });
    }
    return false;  // chainStart isn't meaningful for companions
  }
  let chainStart = false;
  if (GLISS_COMPLEXES.has(cmx)) {
    chainStart = true;
    outer: for (const q of activeMidiNotes.values()) {
      for (const e of q) {
        // Companions are excluded from the chainStart computation —
        // a held companion shouldn't suppress chainStart on a fresh
        // phrase's anchor noteon (the new phrase's main IS chain-start
        // even if the previous phrase's companion is still sustaining).
        if (e.isCompanion) continue;
        if (e.voice === data.voice && e.complex === cmx) { chainStart = false; break outer; }
      }
    }
    // D59 — bend-grace override. When a bendstep just landed (its
    // bridge-side noteOff source emptied activeMidiNotes for this
    // voice/complex), the post-bend noteOn target arrives with
    // chainStart=true. If we're within the grace window AND the
    // pitch matches the bend's toPitch, treat as continuation.
    // D60 — pitch match is ±1 semi tolerant for humanPitch jitter.
    // D62.1 — CONSUME the grace on match. Without consumption, the
    // SAME grace window can match multiple later noteons (as long as
    // they pitch-match within ±1), accidentally chaining notes
    // ACROSS phrase boundaries when the next phrase's anchor lands
    // within 1 semi of the prior bend's target. One bend grants
    // exactly one continuation; subsequent noteons compute
    // chainStart from active state alone.
    if (chainStart) {
      const vk = data.voice + ':' + cmx;
      const until = bendChainUntilMs.get(vk) || 0;
      const expectedPitch = bendChainTargetPitch.get(vk);
      if (until > performance.now() && expectedPitch != null &&
          Math.abs(expectedPitch - data.pitch) <= 1) {
        chainStart = false;
        bendChainUntilMs.delete(vk);
        bendChainTargetPitch.delete(vk);
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
  // Direction-aware streak for gliss flash: capture prior pitch in the
  // same (voice, complex) chain so the streak's vertical bias matches
  // the slide direction. chainStart=true means new chain → no prior;
  // chainStart=false means continuation → prior is either still in
  // active (slide overlap during portamento) or just moved to finished
  // (clean noteoff/noteon transition).
  let priorGlissPitch = null;
  if (GLISS_COMPLEXES.has(cmx) && !chainStart) {
    outer2: for (const q of activeMidiNotes.values()) {
      for (const e of q) {
        if (e.voice === data.voice && e.complex === cmx) {
          priorGlissPitch = e.pitch;
          break outer2;
        }
      }
    }
    if (priorGlissPitch == null) {
      const back = Math.max(0, finishedMidiNotes.length - 12);
      for (let i = finishedMidiNotes.length - 1; i >= back; i--) {
        const f = finishedMidiNotes[i];
        if (f.voice === data.voice && f.complex === cmx) {
          priorGlissPitch = f.pitch;
          break;
        }
      }
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
    // Snapshot CC 11 (Expression) at noteon time. Used as the legacy-fallback
    // start value in `sampleScaleAtT` when the per-voice trace buffer is
    // empty (pre-init, panic recovery). C0/C1 are velocity-driven and ignore
    // it; for C2..C8 the trace-sampled brush prefers per-vertex sampling.
    exprAtOn: voiceExpr.has(data.voice) ? voiceExpr.get(data.voice) : DEFAULT_EXPR,
    chainStart,
    // True for `maybeDoubleStop` companions on gliss complexes. Causes
    // `drawNote` to render the entry as a brush even though `complex` is
    // in GLISS_COMPLEXES, and `buildGlissChains` to skip it so the
    // companion doesn't get absorbed into the main's chain. Pre-flag, C6
    // companions were silently grouped into the main chain and never
    // drawn (the user-reported "C6 audible double-stop but only one voice
    // drawn" symptom).
    isCompanion: data.isCompanion === true,
  });
  _emitSparks(data.pitch, data.velocity, cmx, priorGlissPitch);
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
  // D72.6 + D73 — companion noteoff path. Companions never enter
  // activeMidiNotes so there's nothing for the queue pop to find; instead,
  // scan the segment list for any open (t1==null) entry on this voice whose
  // stored companionPitch matches, and CLOSE it (set t1=now). The segment
  // remains in the array so chains drawn during [t0, t1] keep their parallel
  // overlay; only chains starting after t1 (or starting before t0) draw
  // without it. Cull happens in drawRollingScore once the segment falls
  // below the visible horizon.
  for (let i = 0; i < companionSegments.length; i++) {
    const cs = companionSegments[i];
    if (cs.t1 != null) continue;
    if (cs.voice === data.voice && cs.companionPitch === data.pitch) {
      cs.t1 = performance.now();
      return null;  // main.js will skip sieve.noteOff + triangle.noteOff
    }
  }
  const key = `${data.voice}:${data.pitch}`;
  const queue = activeMidiNotes.get(key);
  if (!queue || queue.length === 0) return null;
  const pending = queue.shift();
  if (queue.length === 0) activeMidiNotes.delete(key);
  const offT = performance.now();
  const preFadeV = exprAtLookback(pending.voice, offT, EXPR_PRE_FADE_LOOKBACK_MS, pending.onsetMs);
  const finished = {
    pitch:      pending.pitch,
    velocity:   pending.velocity,
    voice:      pending.voice,
    complex:    pending.complex,
    onsetMs:    pending.onsetMs,
    offsetMs:   offT,
    exprAtOn:   pending.exprAtOn,
    // Legacy fallback only: `sampleScaleAtT`'s 2-endpoint path for sustained
    // complexes with no trace data uses this. Kept at 1000 ms lookback to
    // skip the bridge's release fade — same as pre-D70.
    exprAtOff:  preFadeV,
    // Per-note frozen CC 11 slice: every echoed CC 11 value emitted by the
    // bridge during this note's lifetime, RAW (D71 — earlier D70 trim/anchor
    // caused dim brushes to snap to thicker right-zone at noteoff). Used by
    // both the trace-sampled brush (D70) and drawGlissChain's chain-local
    // exprAtTime so finished chains read from their OWN history instead
    // of the shared, age-culled per-voice buffer. Without this, a past
    // gliss chain's width retroactively tracks any later complex's CC 11
    // because the buffer's oldest surviving entry (after culls) belongs
    // to the later complex.
    exprSamples: sliceExprHistory(pending.voice, pending.onsetMs, offT),
    chainStart: pending.chainStart,
    // D72.5 — propagate companion flag from queue entry → finished ring.
    // Without it, the chain pass's `evt.isCompanion` filter only fires for
    // active entries, not finished ones, so a companion's noteOff turns
    // it into a chain-eligible node mid-phrase. Symptom (C6): chain
    // averages between anchor pitch and companion pitch, the bend
    // trajectory zigzags through the companion, GLISS SYNC FAIL fires
    // with `chainPitch` interpolated between the two voices.
    isCompanion: pending.isCompanion === true,
  };
  finishedMidiNotes.push(finished);
  _auditHairpinTrace(finished);
  return pending;
}

// D71 — frozen exprSamples are the RAW slice of voiceExprHistory across the
// note's [t0, t1] window. No trim, no synthetic anchor.
//
// Earlier D70 attempt: trim trailing samples (t > t1 − EXPR_PRE_FADE_LOOKBACK_MS
// = 1000 ms) and append a synthetic anchor at preFadeV (= exprAtLookback at
// 1000 ms). Reused 1000 ms because the legacy 2-endpoint brush's `exprAtOff`
// used the same lookback to skip the bridge's release fade (~200–800 ms,
// worst case ~800 ms contemplative + face-mult-2). For cresc this anchored
// the right ~25 % of the polygon at near-peak (close to true peak 127 →
// audibly fine). For dim this anchored at mid-dim (1000 ms backwards through
// a 4 s dim ramp ≈ 23 % UP from floor → ~56 vs floor ~38). Asymmetry comes
// from `exprScale`'s `pow(norm, 1.6)` curve being steeper near peak than
// near floor: 22 CC near 127 hardly moves the scale, 22 CC near 38 moves
// it ~46 % thicker. Visible result: dim phrases' brush right zone "snapped
// back to thick" at noteoff (in-flight had been showing the live fade
// thinning to ~0; finished anchored mid-dim).
//
// Fix: don't trim. The trace-sampled brush (and the gliss chain, which has
// always used raw `sliceExprHistory`) renders the bridge's release fade
// naturally as a tail-tapering when the polygon's right vertices sample
// values dropping toward 0. In-flight and finished render the same raw
// trace at the same t → no snap. The fade taper IS musically representative
// (the audio actually does fade, the brush just makes it visible). For voice
// steals (no fade — `cancelPhrase` calls `allNotesOff` immediately), the
// last live CC 11 value is the honest steal-time anchor; the legacy 1000 ms
// lookback would have anchored at a stale earlier value, which was wrong.
//
// `exprAtOff` continues to use the 1000 ms lookback — that's the legacy
// fallback path in `sampleScaleAtT` for any sustained complex with no
// trace data, where the 2-endpoint cresc-anchor-at-peak behaviour is still
// correct.

// D70 — log per-note CC 11 trace shape so within-note hairpin visibility
// is auditable. "Interior extremum" = a sample whose value differs from
// the larger of (on, end) by > HAIRPIN_AMP_THRESHOLD CC units AND whose
// index is strictly between 0 and N-1. Hairpins (D'/B' faces) have one;
// monotonic cresc/dim arcs do not. Logs only the surprising cases:
// hairpinTrace lines confirm a V/Λ shape made it into the recorded trace
// and therefore through the trace-sampled brush. Empty-trace warning
// fires when a sustained complex finishes with no CC 11 telemetry — the
// brush falls back to legacy linear interp for that note (a soft fail —
// would be a hard fail if hairpin face was active and the trace was
// empty, but we don't have face metadata in evt today).
function _auditHairpinTrace(finished) {
  const cmx = finished.complex;
  if (cmx < 2 || cmx > 8) return;
  if (cmx === 5 || cmx === 6 || cmx === 7) return;
  const samples = finished.exprSamples;
  if (!samples || samples.length === 0) {
    console.warn('[rolling-score] empty exprSamples on C' + cmx + ' voice=' + finished.voice + ' — brush will use legacy linear fallback');
    return;
  }
  const HAIRPIN_AMP_THRESHOLD = 20;
  const N = samples.length;
  const onV  = samples[0].v;
  const endV = samples[N - 1].v;
  let vMin = onV, vMax = onV, iMin = 0, iMax = 0;
  for (let i = 1; i < N; i++) {
    const v = samples[i].v;
    if (v < vMin) { vMin = v; iMin = i; }
    if (v > vMax) { vMax = v; iMax = i; }
  }
  const interiorMin = iMin > 0 && iMin < N - 1;
  const interiorMax = iMax > 0 && iMax < N - 1;
  const ampMin = Math.min(onV, endV) - vMin;
  const ampMax = vMax - Math.max(onV, endV);
  if (interiorMin && ampMin > HAIRPIN_AMP_THRESHOLD) {
    console.log('[rolling-score] inst ' + finished.voice + ' C' + cmx +
      ' hairpinTrace dir=down on=' + onV + ' min=' + vMin + ' end=' + endV +
      ' amp=' + ampMin + ' samples=' + N + ' dur=' +
      Math.round(finished.offsetMs - finished.onsetMs) + 'ms');
  }
  if (interiorMax && ampMax > HAIRPIN_AMP_THRESHOLD) {
    console.log('[rolling-score] inst ' + finished.voice + ' C' + cmx +
      ' hairpinTrace dir=up on=' + onV + ' max=' + vMax + ' end=' + endV +
      ' amp=' + ampMax + ' samples=' + N + ' dur=' +
      Math.round(finished.offsetMs - finished.onsetMs) + 'ms');
  }
}

/** Drop all in-flight notes (engine panic). Finished notes scroll out
 *  naturally — we don't clear them so the roll doesn't snap to empty. */
export function panic() {
  activeMidiNotes.clear();
  bendChainUntilMs.clear();
  bendChainTargetPitch.clear();
  companionSegments.length = 0;
  // Drop cached CC 11 — bridge state may have been reset; future noteons
  // start from DEFAULT_EXPR until the next echo arrives.
  voiceExpr.clear();
  voiceExprHistory.clear();
  // bendSegments deliberately NOT cleared — already-played bend curves
  // continue scrolling out via the cull pass like finishedMidiNotes.
  // Sparks: drop in-flight particles so panic doesn't leave a haze.
  sparks.length = 0;
}

/**
 * Receive a CC 11 (Expression) echo from the bridge via main.js's WS midi_echo
 * dispatch. The echo fires from `cc()` / `ccForce()` in `max/xk_swam.js`
 * conditional on `num === CC.EXPRESSION` (see `emitEchoExpr`); per-voice value
 * is cached so future noteons can stamp `exprAtOn` and noteoffs can stamp
 * `exprAtOff`. In-flight active notes have their brush trace sourced from
 * `voiceExprHistory` via `_buildTraceBuf` (D70 — replaces the legacy two-
 * endpoint linear interp that couldn't represent within-note hairpins).
 * Pure additive telemetry — if a message is dropped the worst case is one
 * stale expr stamp on the next note.
 */
export function exprChanged(data) {
  if (!data || typeof data.voice !== 'number') return;
  const v = Math.max(0, Math.min(127, data.val | 0));
  voiceExpr.set(data.voice, v);
  recordExpr(data.voice, performance.now(), v);
}

/**
 * D59 — record a cross-string bend slide. Called from main.js's
 * handleMidiEcho when a `/xk/midi/bendstep` event arrives. The bend
 * segment becomes a first-class chain participant (see _findActiveGlissChain
 * and buildGlissChains). The chain-grace map is set so the bridge's
 * follow-up noteon target (which would otherwise have chainStart=true
 * because the noteoff source emptied activeMidiNotes for this complex)
 * is treated as continuation, keeping the chain unbroken.
 */
export function bendStep(data) {
  const cmx = data.complex | 0;
  const dur = (data.durMs | 0);
  bendSegments.push({
    voice:   data.voice,
    complex: cmx,
    t0:      performance.now(),
    dur:     dur,
    p0:      data.fromPitch,
    p1:      data.toPitch,
  });
  const vk = data.voice + ':' + cmx;
  bendChainUntilMs.set(vk, performance.now() + dur + BEND_CHAIN_GRACE_TAIL_MS);
  bendChainTargetPitch.set(vk, data.toPitch);
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

/**
 * True iff (voice, pitch) has any active entry in `activeMidiNotes`.
 * Used by triangle.js's per-frame orphan-line detection — a non-gliss
 * line whose key has no matching active queue entry means the bridge
 * already noteoff'd that pitch but triangle missed the splice
 * (cross-module dispatch race, key string mismatch, duplicate noteon
 * exceeding FIFO depth, etc.). The line should be cleaned up.
 */
export function hasActiveKey(voice, pitch) {
  const key = `${voice}:${pitch}`;
  const queue = activeMidiNotes.get(key);
  return !!(queue && queue.length > 0);
}
