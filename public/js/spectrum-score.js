// public/js/spectrum-score.js
//
// Sonogram renderer modelled on spectroscope~ sonogram mode. Architecture:
//
//   - A long offscreen "history" canvas accumulates painted columns.
//   - Each arriving frame paints exactly ONE column into the history at its
//     time-mapped x position; it never re-renders.
//   - The visible canvas re-blits a window of the history every rAF via a
//     single drawImage — O(1) per frame regardless of history length.
//   - When the history's right edge approaches the current visible window,
//     the history scrolls left and the new right area is pre-filled with the
//     palette floor so unpainted regions never read as transparent black.

import {
  ROLL_TOP_INSET_PX,
  ROLL_BOTTOM_INSET_PX,
} from './constants.js';

let canvas = null;
let ctx = null;
let dpr = 1;
let enabled = false;
let clearedDisabled = false;
let ROLL_PX_PER_SEC = 360;
let ROLL_RIGHT_INSET_CSS_PX = 90;
let visualLatencyMs = 120;
let audioNudgeMs = 0;
let activeComplex = 1;
let statusCb = () => {};

const frames = [];
const STALE_WARN_MS = 1400;
const MISSING_WARN_MS = 2500;
const FRAME_RESET_GAP_MS = 1600;
const FRAME_RESET_ID_DROP = 2048;
const STATUS_MIN_INTERVAL_MS = 160;

// Sonogram dB range. Floor is the quietest mapped value. Bins below it use
// the shared BACKGROUND_RGB so palette changes do not retint silence; audio
// just above the floor starts at MIN_UNIT in the active palette.
let FLOOR_DB = -95;
let CEILING_DB = -15;
let MIN_UNIT = 0.10;
let gainOffsetDb = 0;

const DEFAULT_MODALITY_TRANSFER = {};
for (let i = 1; i <= 8; i++) {
  DEFAULT_MODALITY_TRANSFER[i] = {
    gainOffsetDb: 0,
    floorDb: FLOOR_DB,
    ceilingDb: CEILING_DB,
  };
}
const MODALITY_TRANSFER = {};
for (let i = 1; i <= 8; i++) {
  MODALITY_TRANSFER[i] = { ...DEFAULT_MODALITY_TRANSFER[i] };
}

// Sub-columns per device pixel for temporal interpolation. 0 disables
// blending entirely (sharp time-grid look); ~0.5 gives mild blending;
// ~0.67 (default) is "1 sub-column per 1.5 px" RX-style smooth; 1.0+ is
// pixel-perfect and CPU-heavy.
let smoothDensity = 0.67;

// CSS filter blur applied to the spectrogram canvas. Hardware-accelerated
// post-process that erases any sub-pixel seams left by integer rounding,
// rAF jitter, or strip shifts. ~0.6 px is enough to dissolve hairline
// boundaries without softening real harmonic lines noticeably.
let blurPx = 0.8;

// Per-bin exponential moving average applied to incoming source frames.
// 0 = pass-through (sees full aliasing stripes when source rate undersamples
// audio amplitude modulation). 0.5-0.7 dissolves the ~15 Hz aliasing pulse
// visible on bowed cello at 30 Hz source. >0.9 = very slow response.
let temporalSmoothing = 0.65;
let smoothedBinsRunning = null;

// Available heatmaps. Each is a list of [stop, r, g, b] tuples used by
// paletteColor's binary search + linear interpolation. The first stop is
// the background base — keep it dim but visible so silence reads as part
// of the heatmap.
const PALETTES = {
  inferno: [
    [0.00, 18,  10,  44  ],
    [0.10, 30,  14,  68  ],
    [0.20, 56,  18,  98  ],
    [0.30, 92,  26,  124 ],
    [0.40, 130, 36,  128 ],
    [0.50, 168, 50,  120 ],
    [0.60, 204, 70,  98  ],
    [0.70, 232, 102, 68  ],
    [0.80, 246, 142, 38  ],
    [0.90, 250, 188, 50  ],
    [1.00, 244, 224, 130 ],
  ],
  thermal: [
    [0.00, 16,  20,  44  ],
    [0.15, 14,  44,  108 ],
    [0.30, 16,  104, 156 ],
    [0.45, 24,  168, 132 ],
    [0.60, 130, 200, 60  ],
    [0.75, 232, 208, 40  ],
    [0.90, 246, 130, 40  ],
    [1.00, 248, 248, 240 ],
  ],
  magma: [
    [0.00, 12,  6,   28  ],
    [0.15, 36,  14,  64  ],
    [0.30, 80,  22,  110 ],
    [0.45, 132, 36,  128 ],
    [0.60, 186, 60,  118 ],
    [0.75, 232, 100, 96  ],
    [0.90, 250, 158, 90  ],
    [1.00, 252, 220, 170 ],
  ],
  viridis: [
    [0.00, 30,  10,  70  ],
    [0.15, 68,  1,   84  ],
    [0.30, 70,  50,  126 ],
    [0.45, 54,  92,  141 ],
    [0.60, 42,  120, 142 ],
    [0.75, 50,  168, 132 ],
    [0.90, 130, 206, 80  ],
    [1.00, 253, 231, 37  ],
  ],
  mono: [
    [0.00, 28,  28,  32  ],
    [0.25, 64,  64,  70  ],
    [0.50, 130, 130, 136 ],
    [0.75, 200, 200, 204 ],
    [1.00, 248, 248, 248 ],
  ],
};

// One palette per complex (1..8). When paletteMode === 'auto', each frame
// paints with the palette keyed to its `complex` field, so active spectrum
// energy gains a visible identity per cosmology slot. Identity colors match
// the original modality intent: transient speckle (C1, amber pizz),
// bowed thermal (C2, red), pitch prism (C3, teal-magenta), air veil
// (C4, aqua), gliss ribbon (C5, hot magenta), cold ribbon (C6, ice blue),
// pressure smear (C7, purple), noise chalk (C8, pink chalk).
// Shared endpoint stops across every named and modality palette. The global
// bg color owns stop[0] and the under-floor canvas fill; the global ceiling
// color owns stop[1.00]. Modality identity lives in the interior stops.
const MODALITY_BG = [8, 8, 14];
const DEFAULT_BACKGROUND_RGB = MODALITY_BG.slice();
let BACKGROUND_RGB = DEFAULT_BACKGROUND_RGB.slice();

const MODALITY_LABELS = {
  1: 'C1 pizz',
  2: 'C2 thermal',
  3: 'C3 prism',
  4: 'C4 air',
  5: 'C5 gliss',
  6: 'C6 cold',
  7: 'C7 pressure',
  8: 'C8 chalk',
};

const DEFAULT_MODALITY_PALETTES = {
  1: [ // transient speckle — amber/warm pizz
    [0.00, MODALITY_BG[0], MODALITY_BG[1], MODALITY_BG[2]],
    [0.20, 90,  44,  16  ],
    [0.45, 178, 92,  28  ],
    [0.70, 236, 158, 56  ],
    [1.00, 252, 226, 138 ],
  ],
  2: [ // bowed thermal — red/orange body heat
    [0.00, MODALITY_BG[0], MODALITY_BG[1], MODALITY_BG[2]],
    [0.20, 104, 24,  40  ],
    [0.45, 200, 60,  56  ],
    [0.70, 246, 134, 80  ],
    [1.00, 252, 220, 160 ],
  ],
  3: [ // pitch prism — teal through magenta
    [0.00, MODALITY_BG[0], MODALITY_BG[1], MODALITY_BG[2]],
    [0.25, 30,  118, 138 ],
    [0.50, 120, 168, 180 ],
    [0.75, 200, 120, 200 ],
    [1.00, 244, 228, 250 ],
  ],
  4: [ // air veil — aqua/teal mist
    [0.00, MODALITY_BG[0], MODALITY_BG[1], MODALITY_BG[2]],
    [0.25, 28,  104, 124 ],
    [0.50, 60,  168, 196 ],
    [0.75, 142, 220, 232 ],
    [1.00, 220, 244, 252 ],
  ],
  5: [ // gliss ribbon — hot magenta/pink
    [0.00, MODALITY_BG[0], MODALITY_BG[1], MODALITY_BG[2]],
    [0.25, 116, 28,  104 ],
    [0.50, 196, 64,  158 ],
    [0.75, 240, 138, 200 ],
    [1.00, 252, 220, 244 ],
  ],
  6: [ // cold ribbon — ice blue
    [0.00, MODALITY_BG[0], MODALITY_BG[1], MODALITY_BG[2]],
    [0.25, 28,  78,  152 ],
    [0.50, 70,  140, 220 ],
    [0.75, 158, 208, 244 ],
    [1.00, 224, 240, 252 ],
  ],
  7: [ // pressure smear — purple smear
    [0.00, MODALITY_BG[0], MODALITY_BG[1], MODALITY_BG[2]],
    [0.25, 70,  40,  128 ],
    [0.50, 132, 80,  208 ],
    [0.75, 196, 156, 240 ],
    [1.00, 232, 218, 252 ],
  ],
  8: [ // noise chalk — pink-red chalk
    [0.00, MODALITY_BG[0], MODALITY_BG[1], MODALITY_BG[2]],
    [0.25, 132, 32,  44  ],
    [0.50, 228, 88,  108 ],
    [0.75, 244, 168, 178 ],
    [1.00, 252, 230, 230 ],
  ],
};

const DEFAULT_CEILING_RGB = [248, 248, 248];
let CEILING_RGB = DEFAULT_CEILING_RGB.slice();

function clonePalette(palette) {
  return palette.map((stop) => stop.slice());
}

function clonePaletteMap(map) {
  const out = {};
  for (const key of Object.keys(map)) out[key] = clonePalette(map[key]);
  return out;
}

const MODALITY_PALETTES = clonePaletteMap(DEFAULT_MODALITY_PALETTES);

let paletteMode = 'auto';

// Precomputed RGB lookup tables, 256 entries per palette. Built once at
// module load; consulted per pixel in paintColumnImageData. Layout per
// entry: 3 consecutive bytes (R, G, B). Saves per-pixel binary search
// + linear interpolation inside paletteColor().
const PALETTE_LUTS = {};

function buildLUT(palette) {
  const lut = new Uint8ClampedArray(256 * 3);
  for (let i = 0; i < 256; i++) {
    const t = i / 255;
    let lo = 0;
    let hi = palette.length - 1;
    while (hi - lo > 1) {
      const mid = (lo + hi) >> 1;
      if (palette[mid][0] <= t) lo = mid; else hi = mid;
    }
    const a = palette[lo];
    const b = palette[hi];
    const span = Math.max(1e-6, b[0] - a[0]);
    const f = (t - a[0]) / span;
    lut[i * 3]     = Math.round(a[1] + (b[1] - a[1]) * f);
    lut[i * 3 + 1] = Math.round(a[2] + (b[2] - a[2]) * f);
    lut[i * 3 + 2] = Math.round(a[3] + (b[3] - a[3]) * f);
  }
  return lut;
}

function buildAllLUTs() {
  for (const name of Object.keys(PALETTES)) {
    PALETTE_LUTS['named:' + name] = buildLUT(PALETTES[name]);
  }
  for (let i = 1; i <= 8; i++) {
    PALETTE_LUTS['mod:' + i] = buildLUT(MODALITY_PALETTES[i]);
  }
}

function rebuildModalityLut(complex) {
  const cmx = clamp(complex | 0, 1, 8);
  PALETTE_LUTS['mod:' + cmx] = buildLUT(MODALITY_PALETTES[cmx]);
}

function setPaletteBackgroundStop(palette, rgb) {
  const stop = palette?.[0];
  if (!stop) return false;
  if (stop[1] === rgb[0] && stop[2] === rgb[1] && stop[3] === rgb[2]) return false;
  stop[1] = rgb[0];
  stop[2] = rgb[1];
  stop[3] = rgb[2];
  return true;
}

function setPaletteCeilingStop(palette, rgb) {
  const stop = palette?.[palette.length - 1];
  if (!stop) return false;
  if (stop[1] === rgb[0] && stop[2] === rgb[1] && stop[3] === rgb[2]) return false;
  stop[1] = rgb[0];
  stop[2] = rgb[1];
  stop[3] = rgb[2];
  return true;
}

function syncPaletteBackgroundStops(rgb) {
  let changed = false;
  for (const palette of Object.values(PALETTES)) {
    changed = setPaletteBackgroundStop(palette, rgb) || changed;
  }
  for (let cmx = 1; cmx <= 8; cmx++) {
    changed = setPaletteBackgroundStop(MODALITY_PALETTES[cmx], rgb) || changed;
  }
  if (changed || Object.keys(PALETTE_LUTS).length === 0) buildAllLUTs();
  return changed;
}

function syncPaletteCeilingStops(rgb) {
  let changed = false;
  for (const palette of Object.values(PALETTES)) {
    changed = setPaletteCeilingStop(palette, rgb) || changed;
  }
  for (let cmx = 1; cmx <= 8; cmx++) {
    changed = setPaletteCeilingStop(MODALITY_PALETTES[cmx], rgb) || changed;
  }
  if (changed || Object.keys(PALETTE_LUTS).length === 0) buildAllLUTs();
  return changed;
}
syncPaletteBackgroundStops(BACKGROUND_RGB);
syncPaletteCeilingStops(CEILING_RGB);

function rgbToHex(r, g, b) {
  const toHex = (v) => clamp(v | 0, 0, 255).toString(16).padStart(2, '0');
  return '#' + toHex(r) + toHex(g) + toHex(b);
}

function rgbCss(rgb) {
  return 'rgb(' + (rgb[0] | 0) + ',' + (rgb[1] | 0) + ',' + (rgb[2] | 0) + ')';
}

function packedRgb(rgb) {
  return 0xFF000000 | ((rgb[2] | 0) << 16) | ((rgb[1] | 0) << 8) | (rgb[0] | 0);
}

function parseHexColor(value) {
  if (Array.isArray(value) && value.length >= 3) {
    return [
      clamp(Number(value[0]) | 0, 0, 255),
      clamp(Number(value[1]) | 0, 0, 255),
      clamp(Number(value[2]) | 0, 0, 255),
    ];
  }
  if (typeof value !== 'string') return null;
  const m = value.trim().match(/^#?([0-9a-fA-F]{6})$/);
  if (!m) return null;
  const h = m[1];
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}

function complexForFrame(frame) {
  return clamp((frame && frame.complex) || activeComplex || 1, 1, 8);
}

function sanitizeTransfer(settings, fallback = {}) {
  const floorFallback = Number.isFinite(fallback.floorDb) ? fallback.floorDb : FLOOR_DB;
  const ceilingFallback = Number.isFinite(fallback.ceilingDb) ? fallback.ceilingDb : CEILING_DB;
  const gain = clamp(finite(settings?.gainOffsetDb, finite(settings?.gainDb, fallback.gainOffsetDb || 0)), -60, 60);
  const floor = clamp(finite(settings?.floorDb, floorFallback), -160, 14);
  const ceiling = clamp(finite(settings?.ceilingDb, ceilingFallback), floor + 10, 24);
  return {
    gainOffsetDb: gain,
    floorDb: floor,
    ceilingDb: ceiling,
  };
}

function transferForFrame(frame) {
  if (paletteMode !== 'auto') {
    return {
      gainOffsetDb,
      floorDb: FLOOR_DB,
      ceilingDb: CEILING_DB,
    };
  }
  return MODALITY_TRANSFER[complexForFrame(frame)] || MODALITY_TRANSFER[1];
}

function lutForFrame(frame) {
  if (paletteMode !== 'auto') {
    return PALETTE_LUTS['named:' + paletteMode] || PALETTE_LUTS['named:inferno'];
  }
  return PALETTE_LUTS['mod:' + complexForFrame(frame)];
}

// History canvas (offscreen) — accumulates painted columns. The visible
// canvas re-blits a window of this strip every rAF.
let historyCanvas = null;
let historyCtx = null;
let historyLeftTimeMs = 0;          // tMs corresponding to history x=0
const HISTORY_MULTIPLIER = 2.5;     // strip width = visible width * this

let audioToPerfOffsetMs = null;
let lastFrameId = -1;
let lastFrameReceiveMs = -Infinity;
let lastRenderFrameId = -1;
let lastDrawnFrameId = -1;          // last frame painted into the history
let prevDrawnFrameX = null;          // legacy state retained for floor color
let prevDrawnFrame = null;           // last received frame, used for floor tint
let lastRafPaintMs = null;           // tMs at the right edge of the last rAF paint
let lastStatusText = '';
let lastStatusAt = 0;
let enabledSinceMs = -Infinity;
let waitStartMs = -Infinity;
let hasReceivedFrame = false;
let rafId = null;
let warnedMissing = false;
let warnedStale = false;
let droppedOutOfOrder = 0;

function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

function finite(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function clearFrameMetadata({
  resetIds = false,
  resetReceive = false,
  resetSmoothing = false,
  keepPrevFrame = true,
} = {}) {
  frames.length = 0;
  audioToPerfOffsetMs = null;
  lastRenderFrameId = -1;
  lastDrawnFrameId = -1;
  prevDrawnFrameX = null;
  lastRafPaintMs = null;
  droppedOutOfOrder = 0;
  warnedMissing = false;
  warnedStale = false;
  if (resetIds) lastFrameId = -1;
  if (resetReceive) {
    lastFrameReceiveMs = -Infinity;
    hasReceivedFrame = false;
  }
  if (resetSmoothing) smoothedBinsRunning = null;
  if (!keepPrevFrame) prevDrawnFrame = null;
  waitStartMs = enabled ? performance.now() : -Infinity;
}

function invalidateHistory() {
  historyCanvas = null;
  prevDrawnFrameX = null;
  lastRafPaintMs = null;
  lastRenderFrameId = -1;
  lastDrawnFrameId = -1;
}

function modalityStatus(frame) {
  if (paletteMode !== 'auto') return paletteMode;
  const cmx = clamp((frame && frame.complex) || activeComplex || 1, 1, 8);
  return MODALITY_LABELS[cmx] || ('C' + cmx);
}

function resetSpectrumStream(reason) {
  clearFrameMetadata({
    resetIds: true,
    resetReceive: true,
    resetSmoothing: true,
    keepPrevFrame: false,
  });
  if (historyCtx && historyCanvas) {
    historyCtx.fillStyle = currentFloorColor();
    historyCtx.fillRect(0, 0, historyCanvas.width, historyCanvas.height);
    historyLeftTimeMs = performance.now() - msPerHistoryPx() * historyCanvas.width * 0.5;
  }
  console.warn('[spectrum-score] spectrum stream reset: ' + reason);
}

function shouldAcceptFrameIdReset(frameId) {
  if (lastFrameId < 0 || frameId > lastFrameId) return false;
  const ageMs = performance.now() - lastFrameReceiveMs;
  return ageMs > FRAME_RESET_GAP_MS || (lastFrameId - frameId) > FRAME_RESET_ID_DROP;
}

function paletteColor(t, palette) {
  const pal = palette || resolvePalette(null);
  const u = clamp(t, 0, 1);
  let lo = 0;
  let hi = pal.length - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (pal[mid][0] <= u) lo = mid; else hi = mid;
  }
  const a = pal[lo];
  const b = pal[hi];
  const span = Math.max(1e-6, b[0] - a[0]);
  const f = (u - a[0]) / span;
  const r = Math.round(a[1] + (b[1] - a[1]) * f);
  const g = Math.round(a[2] + (b[2] - a[2]) * f);
  const bl = Math.round(a[3] + (b[3] - a[3]) * f);
  return 'rgb(' + r + ',' + g + ',' + bl + ')';
}

// Resolve which palette a column should use. In 'auto' mode the frame's
// complex picks one of the per-cosmology MODALITY_PALETTES. Any other mode
// is a named override from PALETTES that ignores complex.
function resolvePalette(frame) {
  if (paletteMode !== 'auto') {
    return PALETTES[paletteMode] || PALETTES.inferno;
  }
  const cmx = clamp((frame && frame.complex) || activeComplex || 1, 1, 8);
  return MODALITY_PALETTES[cmx] || MODALITY_PALETTES[1];
}

function currentFloorColor() {
  return rgbCss(BACKGROUND_RGB);
}

function setAllModalityTransferField(field, value) {
  for (let cmx = 1; cmx <= 8; cmx++) {
    const current = MODALITY_TRANSFER[cmx] || DEFAULT_MODALITY_TRANSFER[cmx];
    MODALITY_TRANSFER[cmx] = sanitizeTransfer({ ...current, [field]: value }, current);
  }
  invalidateHistory();
}

function msPerHistoryPx() {
  return 1000 / (ROLL_PX_PER_SEC * dpr);
}

// Reusable scratch buffer for virtual frame binsDb (avoids per-rAF GC).
const VIRT_BINS_A = new Float32Array(512);
const VIRT_BINS_B = new Float32Array(512);
const _virtFrameA = { binCount: 0, binsDb: VIRT_BINS_A, complex: 1 };
const _virtFrameB = { binCount: 0, binsDb: VIRT_BINS_B, complex: 1 };

// Return the interpolated spectrum at audio time `tMs` by bracketing the
// received-frames list and linearly blending the two adjacent FFT frames.
// `slot` picks one of two reusable scratch frame objects so a single rAF
// can fill both start and end without aliasing.
function virtualFrameAt(tMs, slot) {
  if (frames.length === 0) return null;
  const out = slot === 1 ? _virtFrameB : _virtFrameA;
  const buf = slot === 1 ? VIRT_BINS_B : VIRT_BINS_A;

  if (frames.length === 1 || tMs <= frames[0].tMs) {
    const f = frames[0];
    const n = Math.min(f.binCount, buf.length);
    for (let i = 0; i < n; i++) buf[i] = f.binsDb[i];
    out.binCount = n;
    out.complex = f.complex;
    return out;
  }
  const last = frames[frames.length - 1];
  if (tMs >= last.tMs) {
    const n = Math.min(last.binCount, buf.length);
    for (let i = 0; i < n; i++) buf[i] = last.binsDb[i];
    out.binCount = n;
    out.complex = last.complex;
    return out;
  }

  let lo = 0;
  let hi = frames.length - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (frames[mid].tMs <= tMs) lo = mid; else hi = mid;
  }
  const a = frames[lo];
  const b = frames[hi];
  const dt = b.tMs - a.tMs;
  const alpha = dt > 0 ? (tMs - a.tMs) / dt : 0;
  const oneMinus = 1 - alpha;
  const n = Math.min(a.binCount, b.binCount, buf.length);
  for (let i = 0; i < n; i++) {
    buf[i] = oneMinus * a.binsDb[i] + alpha * b.binsDb[i];
  }
  out.binCount = n;
  out.complex = alpha < 0.5 ? a.complex : b.complex;
  return out;
}

function ensureHistory() {
  if (!canvas) return false;
  const targetW = Math.max(canvas.width, Math.ceil(canvas.width * HISTORY_MULTIPLIER));
  const targetH = canvas.height;
  if (historyCanvas && historyCanvas.width === targetW && historyCanvas.height === targetH) return true;

  if (typeof OffscreenCanvas !== 'undefined') {
    historyCanvas = new OffscreenCanvas(targetW, targetH);
  } else {
    historyCanvas = document.createElement('canvas');
    historyCanvas.width = targetW;
    historyCanvas.height = targetH;
  }
  historyCtx = historyCanvas.getContext('2d');
  historyCtx.imageSmoothingEnabled = false;
  historyCtx.fillStyle = currentFloorColor();
  historyCtx.fillRect(0, 0, targetW, targetH);

  // Position history so the "current" time (now) lands ~80% across the strip,
  // leaving 20% of headroom on the right for incoming frames before the next
  // scroll shift is needed.
  const nowMs = performance.now();
  historyLeftTimeMs = nowMs - msPerHistoryPx() * targetW * 0.80;
  prevDrawnFrameX = null;
  return true;
}

function shiftHistoryIfNeeded(nowMs) {
  if (!historyCanvas) return;
  const stripDurationMs = msPerHistoryPx() * historyCanvas.width;
  const rightTimeMs = historyLeftTimeMs + stripDurationMs;
  const headroomMs = rightTimeMs - nowMs;
  if (headroomMs > 800) return;

  // Shift the strip left by ~40% of its width to recover headroom.
  const shiftPx = Math.round(historyCanvas.width * 0.40);
  if (shiftPx <= 0) return;
  historyCtx.globalCompositeOperation = 'copy';
  historyCtx.drawImage(historyCanvas, -shiftPx, 0);
  historyCtx.globalCompositeOperation = 'source-over';
  historyCtx.fillStyle = currentFloorColor();
  historyCtx.fillRect(historyCanvas.width - shiftPx, 0, shiftPx, historyCanvas.height);
  historyLeftTimeMs += shiftPx * msPerHistoryPx();
  if (prevDrawnFrameX !== null) prevDrawnFrameX -= shiftPx;
}

// Per-pixel bilinear paint. Every output pixel is interpolated in both
// dimensions: time (linear blend between prev and curr frames across the
// column) and frequency (linear interpolation between adjacent bins).
// Pixel values are written directly into an ImageData buffer via Uint32
// writes — no CanvasGradient, no fillRect subpixel anti-aliasing, no
// sub-column seams. Mirrors the bilinear pattern iZotope RX uses.
function paintColumnImageData(xStart, colW, prevFrame, currFrame) {
  if (colW <= 0) return;
  const xs = Math.round(xStart);
  const xe = Math.round(xStart + colW);
  const totalPx = xe - xs;
  if (totalPx <= 0) return;

  const innerTop = Math.round(ROLL_TOP_INSET_PX * dpr);
  const innerBottom = Math.round(historyCanvas.height - ROLL_BOTTOM_INSET_PX * dpr);
  const innerH = innerBottom - innerTop;
  if (innerH <= 0) return;

  const n = Math.min(prevFrame.binCount, currFrame.binCount);
  if (n <= 0) return;

  const lut = lutForFrame(currFrame);
  const transfer = transferForFrame(currFrame);
  const prevBins = prevFrame.binsDb;
  const currBins = currFrame.binsDb;
  const usingBlend = smoothDensity > 0.001 && prevFrame !== currFrame;
  const blendAmount = Math.min(1, smoothDensity);

  const floorDb = transfer.floorDb;
  const ceilingDb = transfer.ceilingDb;
  const dbRange = ceilingDb - floorDb;
  const minU = MIN_UNIT;
  const oneMinusMinU = 1 - MIN_UNIT;
  const gain = transfer.gainOffsetDb;
  const floorPacked = packedRgb(BACKGROUND_RGB);

  const imgData = historyCtx.createImageData(totalPx, innerH);
  const data32 = new Uint32Array(imgData.data.buffer);
  // Little-endian RGBA: pre-pack alpha=255 in the high byte slot.
  const ALPHA_HI = 0xFF000000;

  // Precompute bin index + interpolation weight for every output y row.
  // Avoids recomputing inside the hot per-pixel loop.
  const binIdx = new Int32Array(innerH);
  const binIdxNext = new Int32Array(innerH);
  const binBeta = new Float32Array(innerH);
  for (let y = 0; y < innerH; y++) {
    const freqNorm = 1 - (y + 0.5) / innerH;
    const binF = freqNorm * (n - 1);
    let bi = Math.floor(binF);
    if (bi < 0) bi = 0;
    if (bi > n - 1) bi = n - 1;
    let bin1 = bi + 1;
    if (bin1 > n - 1) bin1 = n - 1;
    binIdx[y] = bi;
    binIdxNext[y] = bin1;
    binBeta[y] = binF - bi;
  }

  for (let xi = 0; xi < totalPx; xi++) {
    let alpha;
    if (!usingBlend) {
      alpha = 1; // entire column = currFrame's spectrum
    } else {
      const raw = (xi + 0.5) / totalPx;
      // blendAmount=1 → pure linear ramp 0..1; blendAmount=0 → constant 1.
      alpha = blendAmount * raw + (1 - blendAmount) * 1;
    }
    const oneMinusAlpha = 1 - alpha;

    for (let y = 0; y < innerH; y++) {
      const bi = binIdx[y];
      const bj = binIdxNext[y];
      const beta = binBeta[y];

      const dbA = oneMinusAlpha * prevBins[bi] + alpha * currBins[bi];
      const dbB = oneMinusAlpha * prevBins[bj] + alpha * currBins[bj];
      const db = dbA * (1 - beta) + dbB * beta + gain;

      let t;
      if (db <= floorDb) {
        data32[y * totalPx + xi] = floorPacked;
        continue;
      } else if (db >= ceilingDb) t = 1;
      else t = (db - floorDb) / dbRange;
      const u = minU + oneMinusMinU * t;

      let lutIdx = (u * 255 + 0.5) | 0;
      if (lutIdx < 0) lutIdx = 0;
      else if (lutIdx > 255) lutIdx = 255;
      lutIdx *= 3;

      // Pack little-endian RGBA into a single Uint32 write.
      data32[y * totalPx + xi] =
          ALPHA_HI |
          (lut[lutIdx + 2] << 16) |
          (lut[lutIdx + 1] << 8) |
          lut[lutIdx];
    }
  }

  historyCtx.putImageData(imgData, xs, innerTop);
}

function resizeSpectrumScore() {
  if (!canvas) return;
  dpr = Math.max(1, Math.min(3, window.devicePixelRatio || 1));
  const w = Math.max(1, window.innerWidth);
  const h = Math.max(1, window.innerHeight);
  canvas.width = Math.round(w * dpr);
  canvas.height = Math.round(h * dpr);
  canvas.style.width = w + 'px';
  canvas.style.height = h + 'px';
  if (ctx) ctx.imageSmoothingEnabled = false;

  const sieve = document.querySelector('.ovl-sieve-right');
  if (sieve) {
    const r = sieve.getBoundingClientRect();
    if (r.width > 0) ROLL_RIGHT_INSET_CSS_PX = r.width;
  }
  // Force history canvas to rebuild on next draw.
  historyCanvas = null;
  prevDrawnFrameX = null;
}

function rightEdge(width) {
  return width - ROLL_RIGHT_INSET_CSS_PX * dpr;
}

function updateStatus(text, force = false) {
  const now = performance.now();
  if (!force && text === lastStatusText && now - lastStatusAt < STATUS_MIN_INTERVAL_MS) return;
  lastStatusText = text;
  lastStatusAt = now;
  statusCb(text);
}

function frameTimeToPerf(frame, receivePerfMs) {
  const audioTime = Number.isFinite(frame.audioTimeMs) ? frame.audioTimeMs : null;
  const latency = clamp(finite(frame.analysisLatencyMs, 0), 0, 2000);
  if (audioTime == null) return receivePerfMs - latency + audioNudgeMs;

  const candidateOffset = receivePerfMs - audioTime - latency;
  if (audioToPerfOffsetMs == null) {
    audioToPerfOffsetMs = candidateOffset;
  } else {
    const drift = candidateOffset - audioToPerfOffsetMs;
    if (Math.abs(drift) < 250) {
      audioToPerfOffsetMs += drift * 0.015;
    }
  }
  return audioTime + audioToPerfOffsetMs + audioNudgeMs;
}

function normalizeFrame(raw) {
  if (!raw || !Array.isArray(raw.binsDb) || raw.binsDb.length === 0) return null;
  const receivePerfMs = performance.now();
  const binCount = Math.min(raw.binsDb.length, raw.binCount || raw.binsDb.length);
  const binsDb = raw.binsDb.slice(0, binCount).map((v) => clamp(finite(v, -160), -160, 24));
  const rawComplex = raw.complex | 0;
  const cmx = rawComplex >= 1 && rawComplex <= 8 ? rawComplex : activeComplex;
  return {
    frameId: raw.frameId | 0,
    audioTimeMs: finite(raw.audioTimeMs, NaN),
    tMs: frameTimeToPerf(raw, receivePerfMs),
    analysisLatencyMs: clamp(finite(raw.analysisLatencyMs, 0), 0, 2000),
    complex: cmx || activeComplex,
    binCount,
    minHz: Math.max(1, finite(raw.minHz, 40)),
    maxHz: Math.max(2, finite(raw.maxHz, 6000)),
    rmsDb: clamp(finite(raw.rmsDb, -120), -160, 24),
    peakDb: clamp(finite(raw.peakDb, -120), -160, 24),
    centroidHz: Math.max(0, finite(raw.centroidHz, 0)),
    flux: Math.max(0, finite(raw.flux, 0)),
    stereoWidth: clamp(finite(raw.stereoWidth, 0), 0, 1),
    receivePerfMs,
    binsDb,
  };
}

function cullFrames(nowMs) {
  // Trim frame metadata only — the painted history canvas already holds the
  // visual record. Keep ~6 seconds of metadata for status/warning purposes.
  const cutoff = nowMs - 6000;
  while (frames.length && frames[0].tMs < cutoff) frames.shift();
}

function scheduleDraw() {
  if (rafId == null && enabled) rafId = requestAnimationFrame(drawSpectrumScore);
}

function drawSpectrumScore() {
  rafId = null;
  if (!canvas || !ctx) {
    return;
  }

  const width = canvas.width;
  const height = canvas.height;
  const perfNow = performance.now();
  const nowMs = perfNow - (enabled ? visualLatencyMs : 0);
  const ageMs = hasReceivedFrame ? perfNow - lastFrameReceiveMs : Infinity;
  const newestFrameTimeMs = frames.length > 0 ? frames[frames.length - 1].tMs : -Infinity;
  const hasFreshFrame = frames.length > 0 && ageMs <= STALE_WARN_MS;

  if (!enabled) {
    if (!clearedDisabled) {
      ctx.clearRect(0, 0, width, height);
      historyCanvas = null;
      prevDrawnFrameX = null;
      lastRafPaintMs = null;
      clearedDisabled = true;
      updateStatus('off', true);
    }
    return;
  }

  clearedDisabled = false;
  ensureHistory();
  shiftHistoryIfNeeded(nowMs);

  // rAF-paced waterfall paint. Every rAF, paint at most ONE column up to
  // the newest actual FFT timestamp. Both endpoints are interpolated from
  // received source frames via virtualFrameAt, so column widths are uniform
  // at display rate regardless of source-frame jitter.
  // Source frames become keyframes between which we slide; gaps between
  // FFT frames are smoothed into continuous waterfall pixels.
  if (hasFreshFrame && nowMs >= frames[0].tMs) {
    const paintEndMs = Math.min(nowMs, newestFrameTimeMs);
    if (lastRafPaintMs === null) {
      // First rAF after frames started arriving — anchor just behind now.
      lastRafPaintMs = Math.max(paintEndMs - 100, frames[0].tMs);
    } else {
      // Clamp to a sane window in case the tab was backgrounded or visualLatencyMs changed.
      const minStartMs = paintEndMs - 5000;
      if (lastRafPaintMs < minStartMs) lastRafPaintMs = minStartMs;
      if (lastRafPaintMs > paintEndMs) lastRafPaintMs = paintEndMs;
    }

    const startMs = lastRafPaintMs;
    const endMs = paintEndMs;
    if (endMs > startMs) {
      const startFrame = virtualFrameAt(startMs, 0);
      const endFrame = virtualFrameAt(endMs, 1);
      if (startFrame && endFrame) {
        const startX = (startMs - historyLeftTimeMs) / msPerHistoryPx();
        const endX = (endMs - historyLeftTimeMs) / msPerHistoryPx();
        if (endX > startX) {
          paintColumnImageData(startX, endX - startX, startFrame, endFrame);
        }
        // Track the latest received frame for floor tint / status.
        prevDrawnFrame = frames[frames.length - 1];
        prevDrawnFrameX = endX;
        lastDrawnFrameId = prevDrawnFrame.frameId;
      }
    }
    lastRafPaintMs = endMs;
  } else {
    // Do not synthesize new spectrum from stale data. Already-painted history
    // keeps scrolling out; the right edge returns to the palette floor until
    // an actual fresh frame arrives.
    lastRafPaintMs = null;
  }

  // Blit the visible window of the history to the visible canvas in one shot.
  // Visible right edge corresponds to time `nowMs`. Source x of that right
  // edge within the history strip:
  const visibleRightX = rightEdge(width);
  const historyXAtRight = (nowMs - historyLeftTimeMs) / msPerHistoryPx();
  // Snap source x to whole device pixels so the scroll doesn't pick up
  // subpixel blur from drawImage's resampling each rAF.
  const srcX = Math.round(historyXAtRight - visibleRightX);
  const srcW = width;
  ctx.fillStyle = currentFloorColor();
  ctx.fillRect(0, 0, width, height);
  if (historyCanvas) {
    // Source rect can extend off either side of the history; drawImage clips.
    ctx.drawImage(historyCanvas, srcX, 0, srcW, height, 0, 0, srcW, height);
  }

  lastRenderFrameId = lastDrawnFrameId;
  cullFrames(nowMs);

  if (frames.length === 0) {
    if (!warnedMissing && Number.isFinite(waitStartMs) && perfNow - waitStartMs > MISSING_WARN_MS) {
      console.warn('[spectrum-score] spectrogram enabled but no actual spectrum frames have arrived');
      warnedMissing = true;
      updateStatus('wait');
    } else {
      updateStatus('wait');
    }
  }

  if (frames.length > 0 && ageMs > STALE_WARN_MS) {
    updateStatus('stale');
    if (!warnedStale && Number.isFinite(lastFrameReceiveMs)) {
      console.warn('[spectrum-score] spectrum frames stale ageMs=' + Math.round(ageMs));
      warnedStale = true;
    }
  } else if (lastDrawnFrameId >= 0) {
    updateStatus(modalityStatus(prevDrawnFrame));
  }

  scheduleDraw();
}

export function init({ onStatus } = {}) {
  if (typeof onStatus === 'function') statusCb = onStatus;
  canvas = document.getElementById('spectrogram-score');
  if (!canvas) {
    console.warn('[spectrum-score] #spectrogram-score canvas missing');
    return;
  }
  ctx = canvas.getContext('2d', { colorSpace: 'display-p3' });
  ctx.imageSmoothingEnabled = false;
  if (blurPx > 0.001) {
    canvas.style.filter = 'blur(' + blurPx.toFixed(2) + 'px)';
  }
  resizeSpectrumScore();
  window.addEventListener('resize', resizeSpectrumScore);
}

export function setEnabled(value) {
  enabled = value === true;
  if (canvas) {
    canvas.classList.toggle('spectrum-disabled', !enabled);
  }
  if (!enabled) {
    clearFrameMetadata({
      resetIds: true,
      resetReceive: true,
      resetSmoothing: true,
      keepPrevFrame: false,
    });
    historyCanvas = null;
    if (rafId != null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
    if (ctx && canvas) ctx.clearRect(0, 0, canvas.width, canvas.height);
    clearedDisabled = true;
  } else {
    enabledSinceMs = performance.now();
    waitStartMs = enabledSinceMs;
    warnedMissing = false;
    warnedStale = false;
    clearedDisabled = false;
    scheduleDraw();
  }
  updateStatus(enabled ? 'wait' : 'off', true);
}

export function setScrollSpeed(val) {
  if (Number.isFinite(val) && val > 0 && val !== ROLL_PX_PER_SEC) {
    ROLL_PX_PER_SEC = val;
    invalidateHistory();
  }
}

export function setTiming({ latencyMs, nudgeMs } = {}) {
  if (Number.isFinite(latencyMs)) {
    const nextLatency = clamp(latencyMs, 0, 500);
    if (nextLatency !== visualLatencyMs) {
      visualLatencyMs = nextLatency;
      lastRafPaintMs = null;
    }
  }
  if (Number.isFinite(nudgeMs)) {
    const nextNudge = clamp(nudgeMs, -500, 500);
    if (nextNudge !== audioNudgeMs) {
      audioNudgeMs = nextNudge;
      clearFrameMetadata({ keepPrevFrame: true });
    }
  }
}

export function updateState(state) {
  if (!state) return;
  const idx = clamp(state.activeVertex ?? 0, 0, 7);
  if (Array.isArray(state.cAssignments) && state.cAssignments.length >= 8) {
    activeComplex = clamp(state.cAssignments[idx] | 0, 1, 8);
  }
}

export function handleFrame(raw) {
  if (!enabled) return false;
  const rawFrameId = Number(raw?.frameId);
  if (Number.isFinite(rawFrameId) && shouldAcceptFrameIdReset(rawFrameId | 0)) {
    resetSpectrumStream('frameId=' + (rawFrameId | 0) + ' after last=' + lastFrameId);
  }
  const wasStale = hasReceivedFrame && performance.now() - lastFrameReceiveMs > STALE_WARN_MS;
  if (wasStale) {
    clearFrameMetadata({ resetSmoothing: true, keepPrevFrame: true });
  }
  const frame = normalizeFrame(raw);
  if (!frame) return false;
  if (frame.frameId <= lastFrameId && lastFrameId - frame.frameId < 1000000) {
    droppedOutOfOrder++;
    if (droppedOutOfOrder <= 3 || droppedOutOfOrder % 64 === 0) {
      console.warn('[spectrum-score] dropped out-of-order frame id=' + frame.frameId + ' last=' + lastFrameId);
    }
    return false;
  }
  lastFrameId = frame.frameId;
  lastFrameReceiveMs = performance.now();
  hasReceivedFrame = true;
  waitStartMs = -Infinity;
  warnedMissing = false;
  warnedStale = false;

  // Per-bin temporal EMA. Filters out the aliasing pulse that a slow source
  // rate produces when the audio has fast amplitude modulation (vibrato,
  // tremolo, bow ripple). Runs in-place on frame.binsDb so the downstream
  // virtualFrameAt() interpolation operates on already-smoothed data.
  if (temporalSmoothing > 0.001) {
    const n = frame.binCount;
    if (!smoothedBinsRunning || smoothedBinsRunning.length !== n) {
      smoothedBinsRunning = new Float32Array(n);
      for (let i = 0; i < n; i++) smoothedBinsRunning[i] = frame.binsDb[i];
    } else {
      const a = temporalSmoothing;
      const b = 1 - a;
      for (let i = 0; i < n; i++) {
        smoothedBinsRunning[i] = a * smoothedBinsRunning[i] + b * frame.binsDb[i];
        frame.binsDb[i] = smoothedBinsRunning[i];
      }
    }
  }

  frames.push(frame);
  if (frames.length > 4096) frames.splice(0, frames.length - 4096);
  return true;
}

export function getCanvas() {
  return canvas;
}

export function isEnabled() {
  return enabled;
}

export function getStatus() {
  return {
    enabled,
    activeComplex,
    frames: frames.length,
    lastFrameId,
    lastRenderFrameId,
    ageMs: Number.isFinite(lastFrameReceiveMs) ? performance.now() - lastFrameReceiveMs : Infinity,
  };
}

// Slide every bin's dB by `offsetDb` before mapping into the palette.
// Acts like exposure: positive values brighten the whole image, negative
// values darken it. Typical useful range: -30 .. +30 dB.
export function setGainOffset(offsetDb) {
  if (!Number.isFinite(offsetDb)) return;
  const next = clamp(offsetDb, -60, 60);
  if (next !== gainOffsetDb) {
    gainOffsetDb = next;
  }
  setAllModalityTransferField('gainOffsetDb', next);
  invalidateHistory();
  return gainOffsetDb;
}

// Quietest dB rendered above the palette floor. Lower (e.g. -120) reveals
// the noise floor and weak detail; higher (e.g. -60) flattens silence into
// the background.
export function setFloorDb(db) {
  if (!Number.isFinite(db)) return;
  const next = clamp(db, -160, CEILING_DB - 10);
  if (next !== FLOOR_DB) {
    FLOOR_DB = next;
  }
  setAllModalityTransferField('floorDb', next);
  invalidateHistory();
  return FLOOR_DB;
}

// Loudest dB rendered at the palette peak. Keep at least 10 dB above the
// floor so the transfer curve cannot collapse into a flat block.
export function setCeilingDb(db) {
  if (!Number.isFinite(db)) return CEILING_DB;
  const next = clamp(db, FLOOR_DB + 10, 24);
  if (next !== CEILING_DB) {
    CEILING_DB = next;
  }
  setAllModalityTransferField('ceilingDb', next);
  invalidateHistory();
  return CEILING_DB;
}

// Background brightness - the minimum palette position for audio just above
// FLOOR_DB. Fully quiet bins use BACKGROUND_RGB so the floor color stays
// shared across palettes.
export function setMinUnit(u) {
  if (!Number.isFinite(u)) return;
  const next = clamp(u, 0, 0.95);
  if (next !== MIN_UNIT) {
    MIN_UNIT = next;
    invalidateHistory();
  }
}

export function setPalette(name) {
  if (typeof name !== 'string') return;
  if ((name === 'auto' || PALETTES[name]) && name !== paletteMode) {
    paletteMode = name;
    invalidateHistory();
  }
}

// 0..1.2 — sub-columns painted per device pixel for time interpolation.
// 0 = no blending (sharp columns); 0.67 ≈ RX-style smooth; 1+ = pixel-perfect.
export function setSmoothDensity(v) {
  if (!Number.isFinite(v)) return;
  const next = clamp(v, 0, 1.2);
  if (next !== smoothDensity) {
    smoothDensity = next;
    invalidateHistory();
  }
}

// 0..4 px — CSS filter blur applied to the entire spectrogram canvas.
// Smooths any remaining hairline seams between paints. Independent of the
// MIDI brush canvas which sits in its own DOM element.
export function setBlurPx(v) {
  if (!Number.isFinite(v)) return;
  blurPx = clamp(v, 0, 4);
  if (canvas) {
    canvas.style.filter = blurPx > 0.001 ? 'blur(' + blurPx.toFixed(2) + 'px)' : 'none';
  }
}

// 0..0.95 — exponential moving average factor applied per-bin to incoming
// source frames. Smooths out source-rate aliasing of audio amplitude
// modulation (the vertical-stripe pulse). Higher = more lag, smoother.
export function setTemporalSmoothing(v) {
  if (!Number.isFinite(v)) return;
  const next = clamp(v, 0, 0.95);
  if (next !== temporalSmoothing) {
    temporalSmoothing = next;
    smoothedBinsRunning = null;
    invalidateHistory();
  }
}

export function getPaletteNames() {
  return ['auto', ...Object.keys(PALETTES)];
}

export function getModalityPaletteSettings() {
  const out = {};
  for (let cmx = 1; cmx <= 8; cmx++) {
    const transfer = MODALITY_TRANSFER[cmx] || DEFAULT_MODALITY_TRANSFER[cmx];
    out[cmx] = {
      label: MODALITY_LABELS[cmx] || ('C' + cmx),
      gainOffsetDb: transfer.gainOffsetDb,
      floorDb: transfer.floorDb,
      ceilingDb: transfer.ceilingDb,
      stops: MODALITY_PALETTES[cmx].map((stop, idx) => ({
        index: idx,
        stop: stop[0],
        r: stop[1],
        g: stop[2],
        b: stop[3],
        hex: rgbToHex(stop[1], stop[2], stop[3]),
      })),
    };
  }
  return out;
}

export function getModalityBackgroundColor() {
  return rgbToHex(BACKGROUND_RGB[0], BACKGROUND_RGB[1], BACKGROUND_RGB[2]);
}

export function getModalityCeilingColor() {
  return rgbToHex(CEILING_RGB[0], CEILING_RGB[1], CEILING_RGB[2]);
}

export function setAllModalityBackgroundColors(color) {
  const rgb = parseHexColor(color);
  if (!rgb) return false;
  let changed = false;
  if (BACKGROUND_RGB[0] !== rgb[0] || BACKGROUND_RGB[1] !== rgb[1] || BACKGROUND_RGB[2] !== rgb[2]) {
    BACKGROUND_RGB = rgb.slice();
    changed = true;
  }
  changed = syncPaletteBackgroundStops(rgb) || changed;
  if (changed) invalidateHistory();
  return true;
}

export function setAllModalityCeilingColors(color) {
  const rgb = parseHexColor(color);
  if (!rgb) return false;
  let changed = false;
  if (CEILING_RGB[0] !== rgb[0] || CEILING_RGB[1] !== rgb[1] || CEILING_RGB[2] !== rgb[2]) {
    CEILING_RGB = rgb.slice();
    changed = true;
  }
  changed = syncPaletteCeilingStops(rgb) || changed;
  if (changed) invalidateHistory();
  return true;
}

export function setModalityPaletteStop(complex, stopIndex, color) {
  const cmx = clamp(complex | 0, 1, 8);
  const idx = stopIndex | 0;
  const palette = MODALITY_PALETTES[cmx];
  if (!palette || idx < 0 || idx >= palette.length) return false;
  if (idx === 0) return setAllModalityBackgroundColors(color);
  if (idx === palette.length - 1) return setAllModalityCeilingColors(color);
  const rgb = parseHexColor(color);
  if (!rgb) return false;
  const stop = palette[idx];
  if (stop[1] === rgb[0] && stop[2] === rgb[1] && stop[3] === rgb[2]) return true;
  stop[1] = rgb[0];
  stop[2] = rgb[1];
  stop[3] = rgb[2];
  rebuildModalityLut(cmx);
  invalidateHistory();
  return true;
}

export function setModalityTransfer(complex, settings = {}) {
  const cmx = clamp(complex | 0, 1, 8);
  const current = MODALITY_TRANSFER[cmx] || DEFAULT_MODALITY_TRANSFER[cmx];
  const next = sanitizeTransfer({ ...current, ...settings }, current);
  MODALITY_TRANSFER[cmx] = next;
  invalidateHistory();
  return { ...next };
}

export function resetModalityPalettes() {
  const defaults = clonePaletteMap(DEFAULT_MODALITY_PALETTES);
  for (let cmx = 1; cmx <= 8; cmx++) {
    MODALITY_PALETTES[cmx] = defaults[cmx];
    MODALITY_TRANSFER[cmx] = { ...DEFAULT_MODALITY_TRANSFER[cmx] };
  }
  syncPaletteBackgroundStops(BACKGROUND_RGB);
  syncPaletteCeilingStops(CEILING_RGB);
  buildAllLUTs();
  invalidateHistory();
}

export function getLookSettings() {
  return {
    gainOffsetDb,
    floorDb: FLOOR_DB,
    ceilingDb: CEILING_DB,
    minUnit: MIN_UNIT,
    backgroundColor: getModalityBackgroundColor(),
    ceilingColor: getModalityCeilingColor(),
    palette: paletteMode,
    smoothDensity,
    blurPx,
    temporalSmoothing,
    modalityPalettes: getModalityPaletteSettings(),
  };
}
