// Dashboard constants — shared values consumed by every module.
//
// Phase 2.1 extraction: previously inline in `public/dashboard.html`.
// Moved here so the planned Phase 2 modules (rolling-score, sieve,
// triangle, etc.) can import the same values without duplicating
// declarations or relying on a global. Comments preserved with each
// constant — they document the contract, not just the value.
//
// Mutable runtime state (e.g. `ROLL_PX_PER_SEC`, `ROLL_RIGHT_INSET_CSS_PX`)
// stays inline in the dashboard for now: ES module imports are
// read-only bindings and would require getter/setter exposure to keep
// slider / resize handlers working. Those will move later (probably
// with `rolling-score.js` in Phase 2.6) under a small `setRollPxPerSec`
// API. SIEVE-construction constants (`SIEVE_RANGE`, `BLACK_KEYS`)
// will move with `sieve.js` in Phase 2.4.

// ============================================================
// Pitch axis (rolling score + sieve cells must agree on these)
// ============================================================
//
// The rolling score's pitch axis spans the inner rectangle defined by
// these insets. The sieve strip's CSS positioning (--roll-top-inset /
// --roll-bottom-inset in dashboard.html's :root) MUST match these JS
// constants exactly — Phase 1.2's `assertPitchAxis` fires on drift.

export const ROLL_MIN_MIDI    = 36;          // C2 — bottom of cello range
export const ROLL_MAX_MIDI    = 84;          // C6 — top of practical cello range
export const ROLL_PITCH_RANGE = ROLL_MAX_MIDI - ROLL_MIN_MIDI;   // 48 semitones

// Pitch-axis insets (CSS px). The rolling-score canvas stays full-
// viewport so the background scrolls under everything, but the pitch
// axis is restricted to the inner rectangle so high notes (~C6) don't
// render under the algorithm row and low notes (~C2) don't render under
// the bottom-right gizmo cluster. These MUST match the
// `.ovl-sieve-right` CSS top/bottom values exactly so each MIDI pitch
// lines up vertically with its sieve cell.
export const ROLL_TOP_INSET_PX    = 70;
export const ROLL_BOTTOM_INSET_PX = 80;

// ============================================================
// Brush sizing
// ============================================================
//
// Brush vertical dimensions are expressed as multiples of `rollRowH`
// (= the device-px height of one semitone in the visible pitch range).
// `ROLL_BRUSH_SCALE` is the single global multiplier — bump up for
// chunkier brushes everywhere, down for thinner. (1.0 matches the
// original absolute-CSS look on 1080p / 1× DPR; 1.4 is the current
// thicker default for legibility in dense passages.)
export const ROLL_BRUSH_SCALE = 1.4;

// ============================================================
// Note-lifecycle timing
// ============================================================

// Force-complete notes whose noteoff never arrives (UDP loss, relay
// reconnect mid-phrase) after this long. The watchdog walks every
// per-key activeMidiNotes queue. Set just past the bridge's max phrase
// duration ceiling (`Math.min(duration, 30)` in handleVoice + ~1 s
// release fade): legitimate long notes wrap up by ~31 s, anything
// older than 32 s is stuck. Pre-fix this was 45000 ms — stale entries
// caused triangle's `_hasActiveGliss` to keep returning true (gliss
// lines preserved indefinitely until a new noteon retargeted them, the
// user-reported "white triangle keeps getting stuck" symptom).
export const PENDING_MAX_AGE_MS = 32000;

// C1 pizzicato is the ONLY complex with a release fade (mirrors the
// physical pluck — string vibrates briefly after the finger lifts).
// Fade duration scales with velocity: a fff pluck rings longer than a
// pp pluck. All other complexes snap the line off the moment noteoff
// arrives.
export const PIZZ_FADE_MIN_MS = 100;
export const PIZZ_FADE_MAX_MS = 420;

// ============================================================
// Gliss classifier + chain grouping
// ============================================================

// UDP-reorder fallback for the slide-vs-leap classifier. The PRIMARY
// classifier is the per-note `chainStart` flag set in handleMidiEcho —
// it uses the same "is a previous same-(voice, complex) note alive at
// noteon time?" check as the white-line's `_findGlissLine`, so both
// code paths classify identically. Bridge emit modes:
//   • glissOverlap (true slide, same string) — noteon NEW arrives BEFORE
//     noteoff OLD; previous note is alive → chainStart=false → chain.
//   • leapStep (cross-string leap) — clean noteoff → 50 ms gap → noteon;
//     queue empty at noteon time → chainStart=true → break.
//   • stealInstance (voice steal) — synchronous noteoff(old) → noteon(new);
//     queue empty at noteon time → chainStart=true → break (this case
//     was the regression that motivated the unification — gap ≈ 0 ms
//     was below GLISS_GAP_MS so the gap-only test misclassified as slide).
// GLISS_GAP_MS only fires when chainStart's live-entry check is fooled
// by UDP packet reorder (the slide's noteoff is delivered BEFORE the
// new noteon despite being emitted after) — extremely rare on localhost
// but cheap to guard against.
export const GLISS_GAP_MS    = 25;
export const GLISS_COMPLEXES = new Set([5, 6, 7]);

// SWAM Cello portamento time per gliss complex, ms-per-semitone (matches
// CC 5 values the bridge writes in xk_swam.js — see COMPLEX[5/6/7].
// portamento.time). The two tables are identical mirrors:
// PORTAMENTO_MS_PER_SEMITONE drives the white-line endpoint
// (`predictGlissDuration`); GLISS_PORTAMENTO_MS_PER_SEMITONE drives the
// rolling-chain segment model (`_glissChainDur`). They MUST stay equal
// or Phase 1.3's `assertGlissSync` fires. CC 5 caps at 127 (standard
// MIDI CC range), so per-semitone time can't exceed ~127 ms/semi via
// this path — pitchbend would be needed for genuinely slow drift.
// Phase 1.3 only catches line ↔ chain drift, not table ↔ audio drift,
// so the bridge sync is manual.
export const PORTAMENTO_MS_PER_SEMITONE       = { 5: 50, 6: 100, 7: 115 };
export const GLISS_PORTAMENTO_MS_PER_SEMITONE = { 5: 50, 6: 100, 7: 115 };

// D66 — slide segment duration cap. Both `_glissChainDur` (rolling-score
// chain) and `predictGlissDuration` (triangle white line) clamp their
// segment duration at this value. Aligns with the bridge's bend duration
// cap (`MIN_GLISS_SPACING_MS - BEND_DUR_MARGIN_MS = 195 ms`) so a slide
// segment always completes before the next event's segment overrides it.
//
// Why: wild gliss with wide intervals (e.g., 28-semi C5 = 28×50 = 1400 ms
// "ideal" portamento dur) at MIN_GLISS_SPACING_MS = 200 ms event spacing
// would only walk 14 % (eased to ~6 %) of each segment before the next
// took over. Visual amplitude collapsed from 28 semis to ~1.6 semis even
// though SWAM's Mono Poly Release portamento engages cleanly enough to
// reach full targets audibly. Capping at 195 ms makes each segment
// complete by the next event boundary, restoring visual amplitude to
// match what the user perceives audibly.
//
// Tunable but tightly coupled to bridge's `MIN_GLISS_SPACING_MS` — bump
// in lockstep if the bridge spacing changes. The 5 ms margin matches
// the bridge's `BEND_DUR_MARGIN_MS = 5`.
export const GLISS_SLIDE_MAX_DUR_MS = 195;

// ============================================================
// Per-complex colour (rolling-score brush palette + chain stroke)
// ============================================================
//
// Index 0 (= unknown / pre-init / KS) gets a neutral grey so a few
// stray notes from a stale state aren't misread as pizz.
//
// Gliss palette (C5/C6/C7) splits by hue, not luminance — the prior
// trio (#c084fc / #a855f7 / #d8b4fe) was three values of the same
// purple, indistinguishable in the rolling score. C5 wild reads as
// hot pink, C6 ord as deep purple (middle anchor), C7 tasto as cool
// sky-lavender, so the eye reliably tracks "which gliss complex am
// I looking at" without a legend. Pair with `drawGlissChain`'s
// per-complex line treatment in rolling-score.js (C5 thicker, C7
// thinner-with-halo) for double redundancy.
//
// Wide-gamut (Display-P3) auto-promotion. When the browser supports
// the `color(display-p3 r g b)` CSS syntax (Chrome 111+, Safari 16.4+,
// Firefox 113+) we hand the rolling-score brushes the same numerical
// channel coordinates encoded in the Display-P3 color space instead of
// sRGB. On a P3-capable monitor that lands at a more saturated point —
// reds / cyans / magentas pop into the wider gamut. On a non-P3 monitor
// OR a non-supporting browser the canvas + fillStyle pipeline gamut-
// maps cleanly back to the sRGB equivalent (the same coords interpreted
// in sRGB space), so consumers see the colours below with zero
// behavioural change. Detection is `CSS.supports`-driven and silent —
// no flag, no consumer change, no new export. The export name and key
// shape (`{ 0..8 → string }`) are identical either way.
const _SRGB_HEX = {
  0: '#888899',
  1: '#f3a83b',  // C1 pizz       — amber
  2: '#3b82f6',  // C2 arco       — cobalt
  3: '#60a5fa',  // C3 arco       — paler cobalt
  4: '#22d3ee',  // C4 harmonic   — cyan
  5: '#ff3399',  // C5 gliss wild — hot pink-magenta
  6: '#a855f7',  // C6 gliss ord  — deep purple
  7: '#88aaff',  // C7 gliss tasto — cool sky-lavender
  8: '#e11d48',  // C8 trem near-bridge — crimson
};

const _supportsP3Color = (() => {
  try {
    return typeof CSS !== 'undefined'
      && typeof CSS.supports === 'function'
      && CSS.supports('color', 'color(display-p3 1 0 0)');
  } catch (_e) { return false; }
})();

function _hexToP3(hex) {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16) / 255;
  const g = parseInt(h.slice(2, 4), 16) / 255;
  const b = parseInt(h.slice(4, 6), 16) / 255;
  return 'color(display-p3 ' + r.toFixed(4) + ' ' + g.toFixed(4) + ' ' + b.toFixed(4) + ')';
}

const _P3_PALETTE = (() => {
  const out = {};
  for (const k in _SRGB_HEX) out[k] = _hexToP3(_SRGB_HEX[k]);
  return out;
})();

export const COMPLEX_COLOR = _supportsP3Color ? _P3_PALETTE : _SRGB_HEX;
