// public/js/sieve.js
//
// Phase 2.4 — sieve strip module. Owns the 49-cell pitch axis on the
// right edge of the dashboard plus the per-cell emanation glow that
// pulses on every noteon.
//
// Exports:
//   noteOn(pitch, velocity, complex) — start glow at the cell for `pitch`
//                                       (was `startGlow` in dashboard.html).
//   noteOff(pitch)                   — release the glow (was `endGlow`).
//   panic()                          — clear all glows (was `clearAllGlows`).
//   setActive(activeSet)             — toggle the `.active` class per cell
//                                       index for the engine's sieve set.
//   getCellRect(pitch)               — DOMRect of the matching cell;
//                                       used by Phase 1.2's assertPitchAxis
//                                       and (Phase 2.7) triangle.js's
//                                       sieveCellLeftEdgePos.
//   SIEVE_RANGE, BLACK_KEYS           — geometric constants (49 cells, black-
//                                       key pcs); needed for the rolling-
//                                       score cell-index math too.
//
// Phase 1 Visual Invariant — sieve cell distribution — runs at module
// load via requestAnimationFrame. Catches the regression where moving
// `display: flex` from `.sieve-strip` (immediate parent of cells) to
// `.ovl-sieve-right` (grandparent) silently disables flex distribution.

export const SIEVE_RANGE = 49;
// Black-key semitone offsets (C#, D#, F#, G#, A#)
export const BLACK_KEYS = new Set([1, 3, 6, 8, 10]);

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
function semitoneName(s) {
  const midi = 36 + s;
  const octave = Math.floor(midi / 12) - 1;
  return NOTE_NAMES[midi % 12] + octave;
}

const sieveStrip = document.getElementById('sieve-strip');
const sieveCells = [];

// Iteration order is C2..C6 (i = 0..48). The strip uses
// `flex-direction: column-reverse` so the lowest pitch (C2) renders at
// the bottom and the highest (C6) at the top, matching the rolling-
// score's pitch axis. Each cell hosts an inline label that's only
// filled in for octave-C cells (visual scale anchor — non-octave cells
// stay unlabelled).
for (let i = 0; i < SIEVE_RANGE; i++) {
  const cell = document.createElement('div');
  const pc = i % 12;
  const baseClasses = ['sieve-cell'];
  if (BLACK_KEYS.has(pc)) baseClasses.push('black');
  if (pc === 0) baseClasses.push('octave-start');
  cell._baseClass = baseClasses.join(' ');
  cell.className = cell._baseClass;
  if (pc === 0) cell.textContent = semitoneName(i);
  sieveStrip.appendChild(cell);
  sieveCells.push(cell);
}

// Phase 1 Visual Invariant — sieve cell distribution.
// All 49 cells must occupy equal vertical share of the strip's inner
// height. Two complementary checks:
//   (1) per-cell uniformity (max − min height across all 49 cells)
//   (2) octave-pair-derived cellH ≈ avg cellH (the explicit CLAUDE.md
//       formula: (C2 − C6 vertical centre) / 48 ≈ cellH)
// Span drift > 1 px or per-cell spread > 1.25 px -> loud error.
// Init-time only; once flex distributes correctly, it stays correct across resize.
// Per-cell threshold allows fractional flex rounding a few hundredths over
// exactly 1 px; span drift stays at 1 px.
const SIEVE_LAYOUT_SPREAD_THRESHOLD_PX = 1.25;
const SIEVE_LAYOUT_SPAN_THRESHOLD_PX = 1;
let _sieveAssertRetries = 0;
function assertSieveLayout() {
  if (sieveCells.length !== SIEVE_RANGE) return;
  const heights = new Array(SIEVE_RANGE);
  const centers = new Array(SIEVE_RANGE);
  for (let i = 0; i < SIEVE_RANGE; i++) {
    const r = sieveCells[i].getBoundingClientRect();
    heights[i] = r.height;
    centers[i] = r.top + r.height / 2;
  }
  // Strip not laid out yet (display: none parent, not in DOM, etc.) —
  // defer up to ~0.5 s. After that, give up silently: this assertion
  // catches layout-bug regressions, not "the strip is hidden" runtime
  // states.
  if (heights[0] === 0 && heights[48] === 0) {
    if (++_sieveAssertRetries < 30) requestAnimationFrame(assertSieveLayout);
    return;
  }
  let minH = Infinity, maxH = -Infinity, sumH = 0;
  for (let i = 0; i < SIEVE_RANGE; i++) {
    if (heights[i] < minH) minH = heights[i];
    if (heights[i] > maxH) maxH = heights[i];
    sumH += heights[i];
  }
  const avgCellH = sumH / SIEVE_RANGE;
  const spreadDrift = maxH - minH;
  // (C2 center − C6 center) / 48 — explicit CLAUDE.md formula.
  // column-reverse: C2 (i=0) is at the bottom (larger Y), C6 (i=48) is
  // at the top. abs() so direction-agnostic.
  const octavePairCellH = Math.abs(centers[0] - centers[48]) / 48;
  const spanDrift = Math.abs(octavePairCellH - avgCellH);
  if (spreadDrift > SIEVE_LAYOUT_SPREAD_THRESHOLD_PX || spanDrift > SIEVE_LAYOUT_SPAN_THRESHOLD_PX) {
    console.error(
      'SIEVE LAYOUT FAIL: cells uneven, expected uniform cellH≈' + avgCellH.toFixed(2) + 'px; ' +
      'octave-pair-derived=' + octavePairCellH.toFixed(2) + 'px (spanDrift=' + spanDrift.toFixed(2) + 'px), ' +
      'per-cell max=' + maxH.toFixed(2) + ' min=' + minH.toFixed(2) + ' (spread=' + spreadDrift.toFixed(2) + 'px)'
    );
  }
}
requestAnimationFrame(assertSieveLayout);

// ---- Sieve-cell emanation glow ---------------------------------------------
// The glow envelope follows the actual noteon→noteoff window so each
// cell's pulse "speaks" the technique:
//   • sustained held note  → glow holds at peak with a subtle flicker
//                            for the full sounding duration, then
//                            exponential release
//   • staccato pizz        → no flicker, peak-boosted by velocity,
//                            short release; bright snap on the cell
//   • tremolo (C8)         → fast flicker matching the bow tremolo rate
//   • gliss (C5/C6/C7)     → smooth hold, no flicker, fast release
//
// `peakBoost` multiplies the velocity-derived base peak (clamped to 1.0).
// `flickerHz` / `flickerDepth` set the during-sustain modulation
// (depth 0 disables flicker entirely). `releaseMs` is the exp-decay
// time-constant after noteoff. Profiles per SWAM complex; index 0 =
// unknown.
const COMPLEX_GLOW = {
  0: { flickerHz: 4.0,  flickerDepth: 0.12, peakBoost: 1.00, releaseMs: 380 },
  1: { flickerHz: 0.0,  flickerDepth: 0.00, peakBoost: 1.45, releaseMs: 130 },  // pizz   — punchy snap
  2: { flickerHz: 4.5,  flickerDepth: 0.18, peakBoost: 1.00, releaseMs: 420 },  // bow    — breathing cloud
  3: { flickerHz: 3.0,  flickerDepth: 0.10, peakBoost: 0.95, releaseMs: 600 },  // sust   — long held flat
  4: { flickerHz: 7.5,  flickerDepth: 0.22, peakBoost: 1.20, releaseMs: 380 },  // harm   — bright twinkle
  5: { flickerHz: 0.0,  flickerDepth: 0.00, peakBoost: 1.00, releaseMs: 280 },  // gliss  — smooth hold
  6: { flickerHz: 0.0,  flickerDepth: 0.00, peakBoost: 1.00, releaseMs: 280 },  // gliss
  7: { flickerHz: 1.5,  flickerDepth: 0.10, peakBoost: 0.95, releaseMs: 350 },  // smoke  — slow waver
  8: { flickerHz: 13.0, flickerDepth: 0.40, peakBoost: 1.05, releaseMs: 240 },  // trem   — fast bow-rate flicker
};
// Shortest perceivable on-state for a near-instant note (bridge can
// emit noteon→noteoff within a frame for very short pizz). Without
// this floor a 1-frame note paints, decays, and disappears within the
// same vsync.
const GLOW_MIN_VISIBLE_MS = 90;
// Per-cell glow state. cellGlows.get(i) → { onsetMs, peak, flickerHz,
// flickerDepth, releaseMs, sustaining, releaseStart, refCount }.
// refCount tracks how many concurrent voices are holding this cell so
// the release only kicks in when the last voice lifts.
const cellGlows = new Map();

function _glowCellIdx(pitch) {
  if (typeof pitch !== 'number' || !isFinite(pitch)) return -1;
  return Math.max(0, Math.min(SIEVE_RANGE - 1, (pitch | 0) - 36));
}

export function noteOn(pitch, velocity, complex) {
  const i = _glowCellIdx(pitch);
  if (i < 0) return;
  const profile = COMPLEX_GLOW[complex] || COMPLEX_GLOW[0];
  const v = Math.max(0, Math.min(127, +velocity || 0)) / 110;
  // sqrt() for perceptual linearity at low velocities; floor 0.45 so
  // even a pp note has a visible glow.
  const peakBase = Math.min(1, 0.45 + 0.55 * Math.sqrt(v));
  const peak = Math.min(1, peakBase * profile.peakBoost);
  const now = performance.now();
  const existing = cellGlows.get(i);
  if (existing) {
    existing.peak = Math.max(existing.peak, peak);
    existing.onsetMs = now;                      // reset flicker phase
    existing.flickerHz = profile.flickerHz;      // newest voice's profile wins
    existing.flickerDepth = profile.flickerDepth;
    existing.releaseMs = profile.releaseMs;
    existing.sustaining = true;
    existing.refCount = (existing.refCount || 0) + 1;
    return;
  }
  cellGlows.set(i, {
    onsetMs: now,
    peak,
    flickerHz: profile.flickerHz,
    flickerDepth: profile.flickerDepth,
    releaseMs: profile.releaseMs,
    sustaining: true,
    releaseStart: 0,
    refCount: 1,
  });
}

export function noteOff(pitch) {
  const i = _glowCellIdx(pitch);
  if (i < 0) return;
  const g = cellGlows.get(i);
  if (!g) return;
  g.refCount = Math.max(0, (g.refCount || 0) - 1);
  if (g.refCount > 0) return;
  if (g.sustaining) {
    g.sustaining = false;
    // Defer the release start so the cell stays lit at peak for at
    // least GLOW_MIN_VISIBLE_MS — covers single-frame staccatos that
    // would otherwise be inaudible to the eye.
    const minRelease = g.onsetMs + GLOW_MIN_VISIBLE_MS;
    g.releaseStart = Math.max(performance.now(), minRelease);
  }
}

export function panic() {
  cellGlows.clear();
  for (let i = 0; i < sieveCells.length; i++) {
    sieveCells[i].style.removeProperty('--glow-opacity');
  }
}

function tickGlows() {
  const now = performance.now();
  let toDelete = null;
  for (const [i, g] of cellGlows) {
    let intensity;
    if (g.sustaining || now < g.releaseStart) {
      // Held — peak with optional flicker. Use |sin| so the modulation
      // never drops below (1 - depth) — a held note shouldn't blink off,
      // only ripple.
      const dt = (now - g.onsetMs) / 1000;
      const flicker = g.flickerDepth > 0
        ? (1 - g.flickerDepth) + g.flickerDepth * Math.abs(Math.sin(2 * Math.PI * g.flickerHz * dt))
        : 1;
      intensity = g.peak * flicker;
    } else {
      // Exponential release. tau ≈ releaseMs · 0.7 → ~99% decay at 3·tau.
      const dt = now - g.releaseStart;
      const k = Math.exp(-dt / (g.releaseMs * 0.7));
      intensity = g.peak * k;
      if (intensity < 0.004) {
        if (!toDelete) toDelete = [];
        toDelete.push(i);
        continue;
      }
    }
    sieveCells[i].style.setProperty('--glow-opacity', intensity.toFixed(3));
  }
  if (toDelete) {
    for (const i of toDelete) {
      cellGlows.delete(i);
      sieveCells[i].style.removeProperty('--glow-opacity');
    }
  }
  requestAnimationFrame(tickGlows);
}
requestAnimationFrame(tickGlows);

// ---- Active-sieve highlighting ---------------------------------------------

/** Toggle the `.active` class per cell for the engine's sieve set. */
export function setActive(activeSet) {
  for (let i = 0; i < SIEVE_RANGE; i++) {
    const isActive = activeSet.has(i);
    const cell = sieveCells[i];
    cell.className = cell._baseClass + (isActive ? ' active' : '');
  }
}

// ---- Read-only geometry access ---------------------------------------------

/** DOMRect of the cell matching `pitch` (clamped to range). */
export function getCellRect(pitch) {
  const i = _glowCellIdx(pitch);
  if (i < 0) return null;
  return sieveCells[i].getBoundingClientRect();
}

/** Number of cells (= SIEVE_RANGE; here for completeness when the
 *  caller wants to iterate without depending on the constant). */
export function getCellCount() { return sieveCells.length; }
