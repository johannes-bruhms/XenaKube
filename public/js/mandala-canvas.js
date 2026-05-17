// public/js/mandala-canvas.js
//
// Accumulating mandala layer. Subscribes to `sphere_strike` events
// (mandala-cosmo) and deposits per-instrument glyphs into a radially
// symmetric figure. Off by default; togglable alongside MIDI brushes
// and spectrogram. Renders below brushes — sphere is "ground,"
// brushes are "figure."
//
// Invariants:
//   D80 (Glyph ↔ strike 1:1) — every received strike must deposit
//                              exactly one primary glyph (plus
//                              symmetry mirrors). Counter logs FAIL
//                              if strikes arrive while enabled but
//                              the deposit counter doesn't tick.
//   D81 (Symmetry constant sync) — MANDALA_SYMMETRY_ORDER mirrored
//                                  in CSS var --mandala-symmetry and
//                                  asserted by dashboard-bridge-sync.test.ts.
//   D83 (Feature gate) — when enabled === false, the draw loop is
//                        short-circuited and the canvas remains
//                        invisible (CSS display:none AND drawing
//                        suppressed; either alone is insufficient
//                        because future code might toggle display).
//
// Dissolution: `solve` event triggers a slow fade-to-black over
// MANDALA_DISSOLVE_MS. Mandala-cosmo doesn't change cosmology on
// solve; the dissolution is independent of any state change.

/** Radial symmetry order. 8 = D8 (octahedral-natural), matches the cube's
 *  8-corner topology. Mirror in CSS var --mandala-symmetry. */
export const MANDALA_SYMMETRY_ORDER = 8;

const MANDALA_DISSOLVE_MS = 12000;
// Strike-to-glyph latency budget. If a strike doesn't deposit a glyph
// within this window, the D80 invariant trips. Allows for rAF jitter.
const GLYPH_DEPOSIT_BUDGET_MS = 80;

// Per-instrument glyph dictionary — mirrors src/mandala-cosmo.ts
// SPHERE_INSTRUMENT_GLYPH. Drift = check:docs failure (extend the
// dashboard-bridge-sync test to assert this table matches).
const INSTRUMENT_GLYPH = {
  'gong':              { shape: 'bindu',  baseRadius: 1.00, color: '#d4a017' },
  'kempul':            { shape: 'ring',   baseRadius: 0.78, color: '#b87333' },
  'kempul-ensemble':   { shape: 'ring',   baseRadius: 0.74, color: '#a8642b' },
  'saron':             { shape: 'petal',  baseRadius: 0.55, color: '#cda434' },
  'slenthem':          { shape: 'flame',  baseRadius: 0.40, color: '#8a5a44' },
  'bonang':            { shape: 'circle', baseRadius: 0.30, color: '#e8c46c' },
  'kempyang':          { shape: 'dot',    baseRadius: 0.18, color: '#7a6a3c' },
  'kethuk':            { shape: 'dot',    baseRadius: 0.18, color: '#5e4f2e' },
};

let canvas = null;
let ctx = null;
let dpr = 1;
let enabled = false;

// Accumulating glyph store. Each entry = one deposited primary glyph (its
// symmetry mirrors are rendered on draw, not stored). Mark-and-fade
// dissolution edits in place (alpha decay).
const glyphs = [];
const MAX_GLYPHS = 800; // soft cap; oldest evicted

// Invariant counters (D80, D83).
let strikesReceived = 0;
let glyphsDeposited = 0;
let lastInvariantLogMs = 0;
const INVARIANT_LOG_INTERVAL_MS = 4000;

// Dissolution state. `dissolveStartMs` = wall-clock ms when solve fired;
// null when not dissolving.
let dissolveStartMs = null;

// Statusline pulses so a settings-panel display can show "live" briefly
// after each strike — same UX as spectrumStatus.
let statusCb = () => {};

function ensureCanvas() {
  canvas = document.getElementById('mandala-canvas');
  if (!canvas) {
    // Inject canvas under spectrogram-score / above cube-canvas. Order
    // (back to front): spectrogram, mandala, brushes, cube, contrast SVG.
    canvas = document.createElement('canvas');
    canvas.id = 'mandala-canvas';
    const spec = document.getElementById('spectrogram-score');
    if (spec && spec.parentNode) spec.parentNode.insertBefore(canvas, spec.nextSibling);
    else document.body.insertBefore(canvas, document.body.firstChild);
  }
  ctx = canvas.getContext('2d');
}

function resize() {
  if (!canvas) return;
  dpr = window.devicePixelRatio || 1;
  const w = window.innerWidth;
  const h = window.innerHeight;
  canvas.width = Math.max(1, Math.round(w * dpr));
  canvas.height = Math.max(1, Math.round(h * dpr));
  canvas.style.width = w + 'px';
  canvas.style.height = h + 'px';
}

/** Initialize the mandala canvas layer. Wires WS subscriptions through
 *  the provided helpers so this module never imports transport.js
 *  directly (matches the cross-module init pattern used elsewhere). */
export function init(opts = {}) {
  ensureCanvas();
  resize();
  window.addEventListener('resize', resize);

  enabled = readEnabled();
  applyEnabledState();

  statusCb = opts.onStatus ?? (() => {});

  // Auto-driven rAF loop — runs even when enabled is false so dissolution
  // can finish if the user disables mid-fade. Cheap when there's nothing
  // to do (counters bail out early).
  rafLoop();

  // D81 — assert CSS var matches JS constant. Drift would mean a stylesheet
  // edit didn't propagate. The vitest mirror in dashboard-bridge-sync.test.ts
  // catches the JS → CSS direction; this catches CSS → JS.
  try {
    const cssOrder = getComputedStyle(document.documentElement)
      .getPropertyValue('--mandala-symmetry').trim();
    if (cssOrder && Number(cssOrder) !== MANDALA_SYMMETRY_ORDER) {
      console.warn(`[mandala-canvas] D81 SYMMETRY SYNC FAIL: CSS --mandala-symmetry=${cssOrder}, JS MANDALA_SYMMETRY_ORDER=${MANDALA_SYMMETRY_ORDER}`);
    }
  } catch (e) { /* noop — CSS var missing is fine for now */ }

  return { setEnabled, isEnabled: () => enabled, handleStrikeBatch, handleSolve };
}

function readEnabled() {
  const v = localStorage.getItem('mandalaEnabled');
  return v === '1';
}

function applyEnabledState() {
  if (!canvas) return;
  canvas.style.display = enabled ? 'block' : 'none';
  if (!enabled) {
    // Clear accumulated state when user disables — prevents stale glyphs
    // popping back into view on re-enable.
    glyphs.length = 0;
    strikesReceived = 0;
    glyphsDeposited = 0;
    dissolveStartMs = null;
    if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
  statusCb(enabled ? 'on' : 'off');
}

export function setEnabled(v) {
  enabled = !!v;
  localStorage.setItem('mandalaEnabled', enabled ? '1' : '0');
  applyEnabledState();
}

/** Called by transport.sphereStrike subscriber with `{ strikes: SphereStrike[] }`. */
export function handleStrikeBatch(payload) {
  if (!payload || !Array.isArray(payload.strikes)) return;
  strikesReceived += payload.strikes.length;
  if (!enabled) return; // D83 feature gate
  for (const s of payload.strikes) {
    depositGlyph(s);
  }
}

/** Called by transport.solve subscriber. Starts dissolution. */
export function handleSolve() {
  if (!enabled || glyphs.length === 0) return;
  dissolveStartMs = performance.now();
}

function depositGlyph(strike) {
  const cls = strike.instrumentClass;
  const tpl = INSTRUMENT_GLYPH[cls];
  if (!tpl) {
    console.warn(`[mandala-canvas] unknown instrumentClass=${cls}`);
    return;
  }
  // Angle from strike id — keeps deposition deterministic-ish but
  // varied; symmetry mirrors expand to full radial figure on render.
  // Mod by symmetry order so the strikes naturally cluster into the
  // 8 angular bins.
  const angularBin = strike.strikeId % MANDALA_SYMMETRY_ORDER;
  const baseAngle = (angularBin / MANDALA_SYMMETRY_ORDER) * Math.PI * 2;
  // Radial distance scaled by gain + base radius template. Gong sits
  // at center, saron mid-ring, bonang/kethuk near edge.
  const radiusScale = 0.18 + (1 - tpl.baseRadius) * 0.42;
  glyphs.push({
    angle: baseAngle,
    radius: radiusScale,
    size: 0.012 + 0.018 * Math.max(0, Math.min(1, strike.gain)),
    color: tpl.color,
    shape: tpl.shape,
    alpha: 0.75 + 0.25 * Math.max(0, Math.min(1, strike.gain)),
    bornMs: performance.now(),
  });
  if (glyphs.length > MAX_GLYPHS) glyphs.shift();
  glyphsDeposited++;
  statusCb('live');
}

function rafLoop() {
  requestAnimationFrame(rafLoop);
  if (!enabled && dissolveStartMs == null && glyphs.length === 0) return;

  const now = performance.now();

  // Dissolution alpha multiplier.
  let dissolveAlpha = 1;
  if (dissolveStartMs != null) {
    const elapsed = now - dissolveStartMs;
    dissolveAlpha = Math.max(0, 1 - elapsed / MANDALA_DISSOLVE_MS);
    if (dissolveAlpha === 0) {
      glyphs.length = 0;
      dissolveStartMs = null;
    }
  }

  // Periodic D80 audit — strikes received but no glyphs deposited
  // (under feature gate enabled === true) is a real fault.
  if (enabled && now - lastInvariantLogMs > INVARIANT_LOG_INTERVAL_MS) {
    if (strikesReceived > 0 && glyphsDeposited === 0) {
      console.warn(`[mandala-canvas] D80 GLYPH FAIL: strikesReceived=${strikesReceived} glyphsDeposited=0 enabled=true — strikes are arriving but no glyph deposited`);
    }
    lastInvariantLogMs = now;
  }

  render(dissolveAlpha);
}

function render(dissolveAlpha) {
  if (!ctx || !canvas) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const cx = canvas.width / 2;
  const cy = canvas.height / 2;
  const minDim = Math.min(canvas.width, canvas.height);

  ctx.globalCompositeOperation = 'lighter'; // additive — petals blend

  for (const g of glyphs) {
    const ageS = (performance.now() - g.bornMs) / 1000;
    const fadeAlpha = Math.max(0, 1 - ageS / 240); // slow base decay over 4 min
    const a = g.alpha * fadeAlpha * dissolveAlpha;
    if (a <= 0.005) continue;
    ctx.globalAlpha = a;
    ctx.fillStyle = g.color;
    ctx.strokeStyle = g.color;

    const r = g.radius * minDim * 0.45;
    const size = g.size * minDim;

    for (let k = 0; k < MANDALA_SYMMETRY_ORDER; k++) {
      const theta = g.angle + (k / MANDALA_SYMMETRY_ORDER) * Math.PI * 2;
      const px = cx + Math.cos(theta) * r;
      const py = cy + Math.sin(theta) * r;
      drawGlyph(g.shape, px, py, size);
    }
  }

  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'source-over';
}

function drawGlyph(shape, x, y, size) {
  switch (shape) {
    case 'bindu':
      ctx.beginPath();
      ctx.arc(x, y, size * 1.6, 0, Math.PI * 2);
      ctx.fill();
      break;
    case 'ring':
      ctx.beginPath();
      ctx.arc(x, y, size * 1.2, 0, Math.PI * 2);
      ctx.lineWidth = Math.max(1, size * 0.4);
      ctx.stroke();
      break;
    case 'circle':
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
      break;
    case 'dot':
      ctx.beginPath();
      ctx.arc(x, y, size * 0.6, 0, Math.PI * 2);
      ctx.fill();
      break;
    case 'petal':
      // Teardrop pointing outward from center.
      ctx.beginPath();
      ctx.ellipse(x, y, size * 1.4, size * 0.7, Math.atan2(y - canvas.height / 2, x - canvas.width / 2), 0, Math.PI * 2);
      ctx.fill();
      break;
    case 'flame':
      // Elongated petal, taller.
      ctx.beginPath();
      ctx.ellipse(x, y, size * 0.6, size * 1.8, Math.atan2(y - canvas.height / 2, x - canvas.width / 2), 0, Math.PI * 2);
      ctx.fill();
      break;
    default:
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
  }
}

/** Read-only counters — used by dashboard-bridge-sync tests and any
 *  future invariant-display panel. */
export function getDiagnostics() {
  return { strikesReceived, glyphsDeposited, glyphCount: glyphs.length, enabled };
}
