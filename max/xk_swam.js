// ================================================================
// xk_swam.js — XenaKube → SWAM Cello 3 MIDI bridge (v3)
//
// Receives /xk/* OSC from relay.js (port 57121) and outputs
// midievent messages directly to [vst~] hosting SWAM Cello 3.
//
// v3 — refactored per docs/revision_roadmap.md Phases 0–5:
//   • Panic watchdog + note cleanup (D17)
//   • Full SWAM KS model with stateful toggle diffing (D1, D2, D12)
//   • COMPLEX config table — single source of truth per voice (D5, D7)
//   • Expression follows per-complex envelope, not gyro tilt (D4, D8)
//   • Tilt → Bow Position modulation (timbral, not dynamic)
//   • Vibrato: CC 19 rate, EMA + dead zone on spin (D3, D6)
//   • 60 Hz CC deadband when cube is still (D18)
//   • Spell CC restore via setupComplex(active) (D11, D13)
//   • u-perm short-gate staccato instead of fake KS (D11)
//   • Reset starts silent (D15)
//
// Prerequisite: SWAM preset configured per revision_roadmap.md.
// KS Octave = C0, Vibrato Rate CC 19, Bow Position CC 16,
// Bow Pressure CC 17, Bow Pressure Accent CC 18, Bow Speed CC 20,
// Attack Ramp CC 73, Attack Control CC 75, Sordino CC 68 (Phase 6).
// ================================================================

autowatch = 1;
inlets = 1;
outlets = 2;  // 0 = midievent → vst~, 1 = debug → print

// ================================================================
// CONFIG — must match SWAM preset
// ================================================================

// Performance MIDI channel (notes + continuous CCs)
var MIDI_CH = 1;

// Key Switch channel — set to whatever the SWAM preset uses.
// Keep distinct from MIDI_CH so KS notes never overlap pitch input.
var KS_CH = 2;

// SWAM Cello 3 input pitch window (C2–F6; instrument auto-transposes –12)
var CELLO_MIN = 36;
var CELLO_MAX = 89;

var SIEVE_BASE = 36;  // MIDI 36 = C2

// ================================================================
// CC MAP — numbers must match what's MIDI-Learned in the SWAM preset.
// See docs/swam_cello_reference.md §9.
// ================================================================
var CC = {
	EXPRESSION:       11,   // default-bound
	VIBRATO_DEPTH:     1,   // default-bound
	VIBRATO_RATE:     19,   // MIDI-Learn (Expressivity page)
	PORTAMENTO_TIME:   5,   // default-bound
	PORTAMENTO_ON:    65,   // default-bound
	SUSTAIN_PEDAL:    64,   // default-bound
	BOW_POSITION:     16,   // MIDI-Learn
	BOW_PRESSURE:     17,   // MIDI-Learn
	BOW_PRESS_ACCENT: 18,   // MIDI-Learn
	BOW_SPEED:        20,   // MIDI-Learn (moved off 19 to free VIBRATO_RATE)
	ATTACK_RAMP:      73,   // MIDI-Learn
	ATTACK_CONTROL:   75,   // MIDI-Learn
	SORDINO:          68,   // MIDI-Learn (v3.10: GUI/CC-only; see Phase 6)
	// D31: Harmonics / Tremolo via CC because KS F# and KS G# are 2-band
	// velocity-selects (Low=2nd/Slow, High=3rd/Fast) with Off as default-
	// only — once fired, Off is unreachable via KS. CC lets us hit any of
	// the 4 Harmonics states and 3 Tremolo states cleanly. MIDI-Learn
	// required: right-click each selector in SWAM GUI → MIDI Learn →
	// send these CCs once → save preset.
	HARMONICS:        78,   // MIDI-Learn to Harmonics selector
	TREMOLO:          79,   // MIDI-Learn to Tremolo selector
	// D32 — Tremolo Min Speed (Play Modes → Right Hand). MIDI-Learn required.
	// With Tremolo Mode = Hz, this is the continuous rate knob; written per
	// voice so each walk step lands a pre-composed rate (like automation).
	TREMOLO_RATE:     80,   // MIDI-Learn to Tremolo Min Speed slider
	// D35 — Bow Polyphony (Play Modes → Left Hand selector). 5-state:
	// Mono String Crossing / Mono Poly Release / Double / Double/Hold / Auto.
	// Default per-complex = Double/Hold so overlapping turns form natural
	// two-string textures; C5/C6/C7 override to Mono Poly Release so SWAM's
	// gliss engine has a single monophonic line to slide along.
	// MIDI-Learn: right-click "Bow Polyphony" selector → MIDI Learn → CC 81.
	BOW_POLYPHONY:    81
};

// ================================================================
// FEATURE FLAGS — set false for params the running SWAM build doesn't
// expose, OR whose v3.11 semantics don't match what this bridge writes.
// Verified against SWAM Cello 3 v3.11 (2026-04-14):
//   • HAS_BOW_SPEED       — no Bow Speed knob exists (never had one).
//   • HAS_ATTACK_RAMP     — no Attack Ramp knob exists (never had one).
//   • HAS_ATTACK_CONTROL  — v3.11 has an "Attack Control" param, but it's
//                           a 4-MODE SELECTOR (vel.soft/vel.hard/expression/
//                           mix vel. expr.), not a continuous 0–127 ramp.
//                           Right answer: set it to "expression" or
//                           "mix vel. expr." once in the preset — our
//                           scheduleExprEnvelope already shapes CC 11 and
//                           that drives attack character for free. Leave
//                           the flag false so we don't write mode-switch
//                           CCs from envelope code.
// Flip any flag true only when both (a) the knob exists in your SWAM
// build AND (b) its 0–127 range means what this bridge writes.
// ================================================================
var HAS_BOW_SPEED        = false;
var HAS_ATTACK_RAMP      = false;
var HAS_ATTACK_CONTROL   = false;
var HAS_BOW_PRESS_ACCENT = true;   // flip false if MIDI-Learn is not wired
// D31: flip these false until you MIDI-Learn Harmonics / Tremolo selectors
// to CC 78 / CC 79 in SWAM. When false the bridge falls back to KS F#/G#,
// which fires ON correctly but cannot turn Off (stays stuck at 2nd / Slow).
var HAS_HARMONICS_CC     = true;
var HAS_TREMOLO_CC       = true;
// D32 — flip false until you MIDI-Learn Tremolo Min Speed to CC 80 in SWAM.
// When false the per-voice tremolo-rate write is suppressed; the slider keeps
// whatever value was last set by hand.
var HAS_TREMOLO_RATE     = true;
// D35 — flip false until you MIDI-Learn Bow Polyphony to CC 81 in SWAM.
// When false the bridge skips the write entirely (the KS fallback for this
// param would require holding KS B + striking a second KS, which the
// velocity-select path can't express). Leave the SWAM preset on whichever
// polyphony mode you want as the hard default.
var HAS_BOW_POLY_CC      = true;

function hasCC(ccNum) {
	if (ccNum === CC.BOW_SPEED)        return HAS_BOW_SPEED;
	if (ccNum === CC.ATTACK_RAMP)      return HAS_ATTACK_RAMP;
	if (ccNum === CC.ATTACK_CONTROL)   return HAS_ATTACK_CONTROL;
	if (ccNum === CC.BOW_PRESS_ACCENT) return HAS_BOW_PRESS_ACCENT;
	if (ccNum === CC.HARMONICS)        return HAS_HARMONICS_CC;
	if (ccNum === CC.TREMOLO)          return HAS_TREMOLO_CC;
	if (ccNum === CC.TREMOLO_RATE)     return HAS_TREMOLO_RATE;
	if (ccNum === CC.BOW_POLYPHONY)    return HAS_BOW_POLY_CC;
	return true;
}

// ================================================================
// D31 — Harmonics / Tremolo CC value maps
//
// SWAM maps a 0–127 CC onto its discrete selector states by equal-width
// bands. Values are band centers so SWAM never sits on a boundary and a
// 1-LSB jitter (there shouldn't be one, but belt-and-suspenders) won't
// flip the selection.
//
//   Harmonics (4 states): bands ~0-31 / 32-63 / 64-95 / 96-127
//   Tremolo   (3 states): bands ~0-42 / 43-84 / 85-127
//
// If your preset's Controller Mapping has the Harmonics or Tremolo
// bands remapped, edit these values to the centers SWAM's GUI shows.
// ================================================================
var HARMONICS_CC_VAL = {};
HARMONICS_CC_VAL[0] = 16;    // OFF     — lowest quarter
HARMONICS_CC_VAL[1] = 48;    // OCT     — 2nd harmonic band
HARMONICS_CC_VAL[2] = 80;    // OCT_5TH — 3rd harmonic band
HARMONICS_CC_VAL[3] = 112;   // CTRL    — 4-Control band

var TREMOLO_CC_VAL = {};
TREMOLO_CC_VAL[0] = 21;      // OFF   — lowest third
TREMOLO_CC_VAL[1] = 64;      // SLOW  — middle third
TREMOLO_CC_VAL[2] = 106;     // FAST  — top third

// D35 — Bow Polyphony CC value map. 5 states → 5 equal-width CC bands of
// ~25.6 each; values are band centers. See docs/swam_cello_reference.md §2
// (KS B+C / B+C# / B+D / B+D# / B+E) for the SWAM option order.
var BOW_POLY = { MONO_STRING_CROSSING:0, MONO_POLY_RELEASE:1, DOUBLE:2, DOUBLE_HOLD:3, AUTO:4 };
var BOW_POLY_CC_VAL = {};
BOW_POLY_CC_VAL[0] = 12;     // Mono String Crossing
BOW_POLY_CC_VAL[1] = 38;     // Mono Poly Release   — gliss complexes (C5/C6/C7)
BOW_POLY_CC_VAL[2] = 64;     // Double
BOW_POLY_CC_VAL[3] = 89;     // Double/Hold         — default for non-gliss
BOW_POLY_CC_VAL[4] = 115;    // Auto

// ================================================================
// KEY SWITCHES — SWAM Cello 3 v3.10 mapping (KS Octave = C0, KS_CH).
//
// v3.10 moved most controls from latch-toggles to velocity-selectors,
// and removed Sordino, Sul Tasto, Sul Ponticello, and Section Size
// from the KS plane entirely:
//   • Sordino   — GUI/CC-only in v3.10
//   • Sul Tasto / Sul Pont — controlled via Bow Position (CC 16)
//   • Section Size — concept removed
//
// Velocity-select KS use velForOption(idx, optionCount) so each value
// lands inside SWAM's KS Velocity Remap bands (defaults to even 1..127
// thirds/quarters depending on option count).
//
// PRE-v3.10 NOTE: prior versions of this file mapped SORDINO=30,
// SUL_TASTO=31, SUL_PONT=32, HARMONICS=33, TREMOLO=34 — those notes
// now mean Harmonics, Keep Bow Direction, Tremolo, Tremolo Mode, and
// (unassigned base page) respectively. Hence the long-standing
// "harmonics never fire" / "tremolo never fires" symptoms (D24): the
// bridge was sending Tremolo Mode and an unassigned KS where it
// thought it was sending Harmonics and Tremolo.
// ================================================================
var KS = {
	PLAY_MODE:     24,   // C   3-opt: Bow / Pizz / Col Legno
	MANUAL_BOWING: 25,   // C#  preset-controlled (Tremolo or BowChange) — never write
	GESTURE_MODE:  26,   // D   3-opt: Expression / Bipolar / Bowing — pin to Expression
	ALT_FINGERING: 27,   // D#  3-opt: Mid / Bridge / Nut+Open
	BOW_LIFT:      28,   // E   2-opt: Off String / On String
	BOW_START:     29,   // F   2-opt: Down / Up
	HARMONICS:     30,   // F#  4-opt: OFF / 2 (oct) / 3 (oct+5th) / 4 Control
	KEEP_BOW_DIR:  31,   // G   latch — avoid (disrupts gliss alternation)
	TREMOLO:       32,   // G#  3-opt: OFF / Slow / Fast
	TREMOLO_MODE:  33,   // A   3-opt: Hz / Sync / Sync/Acc
	// A# (34) unassigned base page (only meaningful as B+A# = Double Hold String Sel)
	PAGE_MOD:      35    // B   modifier — hold + another KS for Bow Polyphony / Pizz Poly
};
var KS_HOLD_MS = 50;

// Map a 0..(optionCount-1) selector index onto the centre of SWAM's
// KS Velocity Remap band for that option count.
function velForOption(idx, optionCount) {
	var band = 127 / optionCount;
	return clamp(Math.round(band * (idx + 0.5)), 1, 127);
}

// Per-KS velocity overrides — hard-coded tested velocities that have been
// audited against SWAM's "KS Velocity Remap" editor for each option index.
// Overrides beat the even-band default from velForOption because a user
// (or preset) can shift remap boundaries; trusting thirds/quarters of 127
// silently mis-selects when the bands are asymmetric. Audit by opening
// SWAM GUI → Controls → Keyswitch → Velocity Remap and reading the
// centre of each band for the KS note in question.
var KS_VEL_OVERRIDE = {};
KS_VEL_OVERRIDE[26] = [21, 64, 106];        // KS D  Gesture Mode (3): Expression / Bipolar / Bowing
KS_VEL_OVERRIDE[30] = [16, 48, 80, 112];    // KS F# Harmonics    (4): OFF / 2 / 3 / 4-Ctrl
KS_VEL_OVERRIDE[32] = [21, 64, 106];        // KS G# Tremolo      (3): OFF / Slow / Fast

function velForKS(ks, idx, optionCount) {
	var tbl = KS_VEL_OVERRIDE[ks];
	if (tbl && tbl[idx] != null) return tbl[idx];
	return velForOption(idx, optionCount);
}

// Harmonics enum (matches COMPLEX[n].harmonics; 4-option KS F#)
var HARMONICS = { OFF:0, OCT:1, OCT_5TH:2, CTRL:3 };
// Tremolo enum (matches COMPLEX[n].tremolo; 3-option KS G#)
var TREMOLO   = { OFF:0, SLOW:1, FAST:2 };
// Gesture Mode (3-option KS D — pinned to EXPR at init, never modulated)
var GESTURE   = { EXPR:0, BIPOLAR:1, BOWING:2 };

// Play Mode velocities — preset-tuned values that already work in our
// running SWAM. (KS_VEL_LEGACY constants kept for back-compat.)
var KS_VEL = { LOW: 40, MID: 80, HIGH: 110 };
var PLAY_MODE_VEL = { bow: KS_VEL.LOW, pizz: KS_VEL.MID, col: KS_VEL.HIGH };

// ================================================================
// INTENSITY → Expression peak, note velocity, bow-pressure scalar,
// density scalar. bowMult multiplies the complex's baseline bowPressure
// (fff digs harder). density scales per-phrase note count.
// ================================================================
var INTENSITY_MAP = {
	"p":   { expr: 20,  vel: 35,  bowMult: 0.70, density: 0.6, tremRateMult: 0.85 },
	"mp":  { expr: 38,  vel: 50,  bowMult: 0.85, density: 0.8, tremRateMult: 0.92 },
	"mf":  { expr: 55,  vel: 68,  bowMult: 1.00, density: 1.0, tremRateMult: 1.00 },
	"f":   { expr: 75,  vel: 85,  bowMult: 1.15, density: 1.2, tremRateMult: 1.08 },
	"ff":  { expr: 95,  vel: 100, bowMult: 1.30, density: 1.4, tremRateMult: 1.15 },
	"fff": { expr: 115, vel: 120, bowMult: 1.45, density: 1.7, tremRateMult: 1.22 }
};

// ================================================================
// COMPLEX TABLE — one record per complex type, single source of truth
// (D5). setupComplex(n) diffs each field against current state and only
// fires KS / writes CC on change.
// ================================================================
// harmonics: 0=OFF, 1=octave (+12), 2=oct+5th (+19), 3=4 Control
// tremolo:   0=OFF, 1=Slow,         2=Fast
// exprEnv adds per-stage ramp times (ms) for the CC 11 slew limiter (D33).
// attackRampMs  — climb from 0 → attack fraction at voice onset
// sustainRampMs — climb/decline attack → peak → sustain
// releaseRampMs — fade sustain → 0 before allNotesOff
// Regime scales all three via REGIME_EXPR_RAMP_MULT.
//
// tremoloRate (0–127) — pre-composed per-complex rate for the Tremolo Min
// Speed slider (CC 80). Only C8 tremolos by default; the others carry a
// sensible value so spells that flip tremolo on land coherently (D32).
var COMPLEX = {
	1: { playMode:"pizz", harmonics:HARMONICS.OFF, tremolo:TREMOLO.OFF,
	     exprEnv:{ attack:1.0, peak:1.0, sustain:0.4, release:0.0,
	               attackRampMs:2,  sustainRampMs:40,  releaseRampMs:60 },
	     vibrato:{ depth:0, rate:64 }, bowPos:null,
	     bowPressure:64, portamento:{ on:false, time:0 },
	     attackRamp:10, attackCtrl:110, tremoloRate:40,
	     bowPoly:BOW_POLY.DOUBLE_HOLD,
	     register:{ lo:36, hi:72 } },
	2: { playMode:"bow", harmonics:HARMONICS.OFF, tremolo:TREMOLO.OFF,
	     exprEnv:{ attack:0.6, peak:1.0, sustain:0.85, release:0.4,
	               attackRampMs:45, sustainRampMs:120, releaseRampMs:140 },
	     vibrato:{ depth:35, rate:50 }, bowPos:70,
	     bowPressure:70, portamento:{ on:false, time:0 },
	     attackRamp:40, attackCtrl:55, tremoloRate:45,
	     bowPoly:BOW_POLY.DOUBLE_HOLD,
	     register:{ lo:40, hi:64 } },
	3: { playMode:"bow", harmonics:HARMONICS.OFF, tremolo:TREMOLO.OFF,
	     exprEnv:{ attack:0.5, peak:1.1, sustain:0.9, release:0.6,
	               attackRampMs:80, sustainRampMs:180, releaseRampMs:220 },
	     vibrato:{ depth:60, rate:45 }, bowPos:110,
	     bowPressure:55, portamento:{ on:false, time:0 },
	     attackRamp:85, attackCtrl:30, tremoloRate:35,
	     bowPoly:BOW_POLY.DOUBLE_HOLD,
	     register:{ lo:36, hi:55 } },
	// C4: harmonics cloud. The `harmonics` field here is a safe fallback —
	// the live harmonic mode is chosen per voice by harmonicsForC4()
	// (D37: path × tetra across OCT / OCT_5TH / CTRL), so this baseline
	// is only consulted if that function is ever bypassed.
	4: { playMode:"bow", harmonics:HARMONICS.OCT, tremolo:TREMOLO.OFF,
	     exprEnv:{ attack:0.7, peak:0.75, sustain:0.6, release:0.3,
	               attackRampMs:30, sustainRampMs:90,  releaseRampMs:120 },
	     vibrato:{ depth:10, rate:60 }, bowPos:85,
	     bowPressure:30, portamento:{ on:false, time:0 },
	     attackRamp:30, attackCtrl:20, tremoloRate:55,
	     bowPoly:BOW_POLY.DOUBLE_HOLD,
	     register:{ lo:60, hi:84 } },
	// C5/C6/C7: gliss complexes — MONO_POLY_RELEASE so overlapping notes
	// feed SWAM's portamento engine instead of splitting into chord voices
	// (D34 root cause). Any other polyphony mode kills the slide.
	5: { playMode:"bow", harmonics:HARMONICS.OFF, tremolo:TREMOLO.OFF,
	     exprEnv:{ attack:0.9, peak:1.1, sustain:0.7, release:0.3,
	               attackRampMs:35, sustainRampMs:100, releaseRampMs:120 },
	     vibrato:{ depth:25, rate:70 }, bowPos:55,
	     bowPressure:70, portamento:{ on:true, time:50 },
	     attackRamp:30, attackCtrl:90, tremoloRate:50,
	     bowPoly:BOW_POLY.MONO_POLY_RELEASE,
	     register:{ lo:36, hi:89 } },
	6: { playMode:"bow", harmonics:HARMONICS.OFF, tremolo:TREMOLO.OFF,
	     exprEnv:{ attack:0.7, peak:1.0, sustain:0.85, release:0.4,
	               attackRampMs:55, sustainRampMs:140, releaseRampMs:160 },
	     vibrato:{ depth:40, rate:50 }, bowPos:64,
	     bowPressure:70, portamento:{ on:true, time:80 },
	     attackRamp:50, attackCtrl:50, tremoloRate:50,
	     bowPoly:BOW_POLY.MONO_POLY_RELEASE,
	     register:{ lo:43, hi:67 } },
	7: { playMode:"bow", harmonics:HARMONICS.OFF, tremolo:TREMOLO.OFF,
	     exprEnv:{ attack:0.4, peak:1.05, sustain:0.9, release:0.7,
	               attackRampMs:100, sustainRampMs:200, releaseRampMs:260 },
	     vibrato:{ depth:55, rate:40 }, bowPos:115,
	     bowPressure:55, portamento:{ on:true, time:115 },
	     attackRamp:90, attackCtrl:25, tremoloRate:40,
	     bowPoly:BOW_POLY.MONO_POLY_RELEASE,
	     register:{ lo:36, hi:52 } },
	// C8: now actually fires Tremolo in v3.10 (KS G#, vel-select). FAST
	// is the spectral-aggressive ponticello character we want.
	8: { playMode:"bow", harmonics:HARMONICS.OFF, tremolo:TREMOLO.FAST,
	     exprEnv:{ attack:0.9, peak:1.15, sustain:1.0, release:0.3,
	               attackRampMs:20, sustainRampMs:80,  releaseRampMs:100 },
	     vibrato:{ depth:15, rate:80 }, bowPos:5,
	     bowPressure:100, portamento:{ on:false, time:0 },
	     attackRamp:20, attackCtrl:100, tremoloRate:95,
	     bowPoly:BOW_POLY.DOUBLE_HOLD,
	     register:{ lo:60, hi:81 } }
};

// Regime → attack-ramp multiplier (single source per D7)
var REGIME_ATTACK_MULT = { contemplative:1.2, conversational:1.0, burst:0.5 };

// D33 — Regime scalar for the Expression (CC 11) slew-ramp times.
// contemplative slurs longer; burst snaps faster to keep transients sharp.
var REGIME_EXPR_RAMP_MULT = { contemplative:1.5, conversational:1.0, burst:0.4 };

// Complexes whose phrases use legatoNote(): preserve the previous phrase's
// tail note across cancelPhrase() so noteOn-before-noteOff overlap
// triggers SWAM portamento. Pizz (C1), harmonics (C4), and the ponticello
// cluster (C8) are re-bow / short-gate, not legato.
var LEGATO_COMPLEX = { 2:true, 3:true, 5:true, 6:true, 7:true };

// ================================================================
// STATE
// ================================================================
var state = {
	activeComplex: 0,
	// SWAM selector state (for diff-fire of velocity-select KS, v3.10)
	playMode: null,         // null|"bow"|"pizz"|"col"
	harmonics: HARMONICS.OFF,    // 0..3 (KS F#)
	tremolo:   TREMOLO.OFF,      // 0..2 (KS G#)
	gestureMode: GESTURE.EXPR,   // pinned to EXPR; never modulated
	altFing: 0,                  // 0..2 (KS D#) — currently unused
	keepBowDir: false,           // KS G latch — never written by us

	sieve: [36, 37, 39, 41, 43, 44, 48],
	sieveIdx: 0,
	sieveDir: 1,
	path: "V1",
	tetra: 0,
	regime: "contemplative",
	frozen: false,
	transpose: 0,
	scramble: 0,
	activeNotes: [],
	turnCount: 0,
	lastTurnTime: 0,
	lastVoiceTime: 0,        // for panic watchdog
	baseExpr: 55,
	peakExpr: 55,            // complex.exprEnv.peak * INTENSITY.expr * pathScale
	density: 2.0,
	duration: 1.0,
	intensity: "mf",         // last received intensity label (phrase density lookup)
	bowPressureBase: 64,     // effective bow-pressure baseline = complex × intensity.bowMult

	// Continuous expression inputs
	tilt: 0.5,
	spin: 0,
	spinEMA: 0,
	dev: 0,
	devEMA: 0,
	spinLowSince: 0,         // timestamp when spin first dropped below deadband
	frame60: 0,              // 60 Hz counter for 30 Hz throttle

	// Phase 6: scramble → Bow Position bias (sul tasto ↔ sul pont).
	// Hysteresis bands: latch tasto after 2 s below 0.2, pont after 2 s above
	// 0.8. Clear in the 0.3–0.7 transition band. scrambleBowBias feeds
	// handleExprTilt's BOW_POSITION write.
	scrambleBowBias: 0,
	tastoSince: 0,
	pontSince: 0,
	sordinoOn: false,

	// Phase 8: note-off velocity derived from turn rate.
	turnRate: 0,
	noteOffVel: 64,

	// KS sync guard — first N voice events after bang() force-write KS
	// regardless of state.* diff, so SWAM provably aligns with our model
	// before diff-suppression kicks in (D28).
	ksForceCount: 0,
	forceKS: false,

	// Phase A1 — face identity & signature-derived modulators. All reset
	// to neutral so pre-face-aware turns render exactly as before.
	face: null,
	faceDurationBias: 1.0,
	faceTranspose: 0,
	faceEnvelope: null,
	faceArticulation: null,
	faceMotion: null,
	faceEnvProfile: null,
	faceOffVelOverride: null,
	faceReleaseMult: 1.0
};

var ccCache = {};
var phraseTasks = [];
var releaseTask = null;
var watchdogTask = null;

// Pending KS noteOff tasks keyed by note number (D29). A new keyswitch()
// on the same note cancels and eagerly fires the stale noteOff at the new
// velocity so the old selection isn't re-asserted mid-hold.
var ksPending = {};

// ================================================================
// MIDI OUTPUT
// ================================================================
function statusNoteOn(ch)  { return 0x90 + (ch - 1); }
function statusNoteOff(ch) { return 0x80 + (ch - 1); }
function statusCC(ch)      { return 0xB0 + (ch - 1); }

function noteOn(pitch, vel) {
	pitch = clamp(pitch, 0, 127);
	vel = clamp(vel, 1, 127);
	outlet(0, "midievent", statusNoteOn(MIDI_CH), pitch, vel);
}

// Phase 8: velocity default comes from state.noteOffVel (turn-rate driven).
// Fast turns → higher note-off velocity → shorter natural release in SWAM.
// Phase A1: state.faceOffVelOverride (from articulation) takes precedence
// when set, so attack/iterative faces always release crisply while
// sustained/release faces decay softly regardless of turn rate.
// Callers that need a specific release character (fades, explicit releases)
// can still pass their own velocity.
function noteOff(pitch, vel) {
	pitch = clamp(pitch, 0, 127);
	if (vel == null) {
		vel = (state.faceOffVelOverride != null) ? state.faceOffVelOverride : state.noteOffVel;
	}
	vel = clamp(Math.round(vel), 0, 127);
	outlet(0, "midievent", statusNoteOff(MIDI_CH), pitch, vel);
}

// Continuous CC — cache-suppressed. Use for 60 Hz streams.
function cc(num, val) {
	if (!hasCC(num)) return;
	val = clamp(Math.round(val), 0, 127);
	if (ccCache[num] === val) return;
	ccCache[num] = val;
	outlet(0, "midievent", statusCC(MIDI_CH), num, val);
}

// Forced CC — always writes, updates cache. Use for envelopes, spell
// transients, and setup baselines where cache coherence with SWAM must
// be re-established (D13).
function ccForce(num, val) {
	if (!hasCC(num)) return;
	val = clamp(Math.round(val), 0, 127);
	ccCache[num] = val;
	outlet(0, "midievent", statusCC(MIDI_CH), num, val);
}

// ================================================================
// CC SLEW LIMITER (D33) — generic per-CC ramp so writes interpolate
// instead of jumping. Primary user is CC 11 (Expression): the old
// envelope fired three hard ccForce writes that created audible CC
// stair-steps. rampCC walks ccCache[num] → target in ~15 ms ticks and
// cancels any prior ramp on the same CC so fresh targets always win.
// durMs <= 0 or equal start/target degrade to a single ccForce.
// ================================================================
var ccRampTasks = {};

function cancelCCRamp(num) {
	var tasks = ccRampTasks[num];
	if (!tasks) return;
	for (var i = 0; i < tasks.length; i++) tasks[i].cancel();
	ccRampTasks[num] = null;
}

function rampCC(num, target, durMs) {
	cancelCCRamp(num);
	if (!hasCC(num)) return;
	target = clamp(Math.round(target), 0, 127);
	var start = ccCache[num];
	if (start == null) start = 0;
	if (durMs <= 0 || start === target) { ccForce(num, target); return; }

	var tickMs = 15;
	var steps  = Math.max(1, Math.round(durMs / tickMs));
	var tasks  = [];
	for (var i = 1; i <= steps; i++) {
		(function(step) {
			var v = start + (target - start) * (step / steps);
			var t = new Task(function() { ccForce(num, v); }, this);
			t.schedule(step * tickMs);
			tasks.push(t);
		})(i);
	}
	ccRampTasks[num] = tasks;
}

// Key Switch — sent on KS_CH, held KS_HOLD_MS.
// Note-off uses the SAME velocity as note-on (not 0). SWAM's velocity-
// select KS reads velocity at note-off as well; a vel-0 note-off gets
// interpreted as "option 0 = OFF", which flipped harmonics (C4) and
// tremolo (C8) back off ~50 ms after each turn into those complexes.
// Play Mode escaped notice because "bow" is option 0 anyway.
//
// D29 — Interleave guard: if a previous noteOff for this KS note is still
// pending, fire it NOW at the NEW velocity (before the new noteOn) and
// cancel the scheduled task. Otherwise the stale noteOff lands ~50 ms
// later at the OLD velocity and re-selects the OLD option, silently
// undoing the new selection. This was the "glitch on/off" cause on
// rapid complex changes (C1 ↔ C4, C1 ↔ C8).
function keyswitch(note, vel, channel) {
	var ch = channel || KS_CH;
	var v = vel || KS_VEL.HIGH;

	var prev = ksPending[note];
	if (prev) {
		prev.task.cancel();
		// Fire a noteOff at the NEW velocity (not the stale prev.vel) so
		// SWAM "releases" the held KS as a re-select of the NEW option.
		// Also guarantees the next noteOn isn't a duplicate-while-held,
		// which some synths ignore.
		outlet(0, "midievent", statusNoteOff(prev.ch || ch), note, v);
		ksPending[note] = null;
	}

	outlet(0, "midievent", statusNoteOn(ch), note, v);
	var ks = note;
	var kch = ch;
	var kv = v;
	var t = new Task(function() {
		outlet(0, "midievent", statusNoteOff(kch), ks, kv);
		if (ksPending[ks] && ksPending[ks].task === t) ksPending[ks] = null;
	}, this);
	t.schedule(KS_HOLD_MS);
	ksPending[note] = { task: t, ch: kch, vel: kv };
}

// ================================================================
// SELECTOR PRIMITIVES — stateful diffing (D1, D12, D27)
//
// v3.10 model: most controls are velocity-select. State is the current
// option index; setEnum diff-fires only on change.
// ================================================================

// Play Mode keeps the legacy preset-tuned velocities (40/80/110) since
// they're known-good in the current SWAM preset.
function setPlayMode(target) {
	if (!state.forceKS && state.playMode === target) return;
	var vel = PLAY_MODE_VEL[target];
	if (vel == null) return;
	keyswitch(KS.PLAY_MODE, vel);
	state.playMode = target;
}

// D31 — Harmonics / Tremolo selector writes. CC path is preferred and goes
// through ccForce's diff-by-cache; KS fallback is used only when the
// MIDI-Learn hasn't been done yet and will leave the selector stuck after
// the first fire (see HAS_HARMONICS_CC comment). Both paths still update
// state.{harmonics,tremolo} so the rest of the bridge's diffing works.
function setHarmonics(target) {
	if (state.harmonics === target) return;
	if (HAS_HARMONICS_CC) {
		ccForce(CC.HARMONICS, HARMONICS_CC_VAL[target]);
	} else {
		keyswitch(KS.HARMONICS, velForKS(KS.HARMONICS, target, 4));
	}
	state.harmonics = target;
}

// D37 — per-voice harmonic-mode rotation for C4. C4 is the harmonics
// complex; previously it hard-coded HARMONICS.OCT so SWAM's OCT_5TH
// (option 3) and CTRL (option 4) modes never reached the sound path.
// Now C4's harmonic mode is chosen per voice by the path × tetra-orbit
// axis pair (both are already composition state, no new inputs):
//
//        tetra 0 (even)    tetra 1 (odd)
//   V1   OCT                OCT_5TH
//   V2   OCT_5TH            CTRL
//
// V1 + even = baseline flageolet (most musically usable).
// V1 + odd  = third-harmonic ping, brighter/more angular.
// V2 + even = third-harmonic inside V2's softer palette.
// V2 + odd  = user-selectable partial (CTRL) — rarest, reached only
//             when path and orbit are both in their "other" state.
//
// OFF is not used here — it's reserved for every non-C4 complex.
// Relies on the engine's state-burst-before-voice emit order (see
// src/engine.ts comment in onTurn) so state.path / state.tetra inside
// this bridge already reflect the turn that is about to fire voice.
function harmonicsForC4() {
	if (state.path === "V1") {
		return state.tetra === 1 ? HARMONICS.OCT_5TH : HARMONICS.OCT;
	}
	return state.tetra === 1 ? HARMONICS.CTRL : HARMONICS.OCT_5TH;
}

function setTremolo(target) {
	if (state.tremolo === target) return;
	if (HAS_TREMOLO_CC) {
		ccForce(CC.TREMOLO, TREMOLO_CC_VAL[target]);
	} else {
		keyswitch(KS.TREMOLO, velForKS(KS.TREMOLO, target, 3));
	}
	state.tremolo = target;
}

// D35 — Bow Polyphony selector. CC-only path: the KS equivalent (B held +
// another KS struck) can't be expressed by the bridge's velocity-select KS
// helpers. When HAS_BOW_POLY_CC is false the write is skipped entirely and
// whatever mode is saved in the SWAM preset stays put.
function setBowPolyphony(target) {
	if (state.bowPoly === target) return;
	if (HAS_BOW_POLY_CC) {
		ccForce(CC.BOW_POLYPHONY, BOW_POLY_CC_VAL[target]);
	}
	state.bowPoly = target;
}

// Generic velocity-select KS — picks vel via velForKS (overrides → even bands)
// so it lands inside SWAM's KS Velocity Remap band for that option count.
// The forceKS flag (set during the ksForceCount window after bang()) bypasses
// diff-suppression so the first real voice events re-assert KS to SWAM.
function setEnum(field, ks, target, optionCount) {
	if (!state.forceKS && state[field] === target) return;
	keyswitch(ks, velForKS(ks, target, optionCount));
	state[field] = target;
}

// ================================================================
// SCHEDULING
// ================================================================
function scheduleAt(ms, fn) {
	var t = new Task(fn, this);
	t.schedule(ms);
	phraseTasks.push(t);
	return t;
}

// Kill all sounding notes
function allNotesOff() {
	for (var i = 0; i < state.activeNotes.length; i++) {
		noteOff(state.activeNotes[i]);
	}
	state.activeNotes = [];
}

// Cancel scheduled phrase events and release sounding notes.
// Per D17 — releasing notes prevents orphans when pending noteOffs get
// cancelled along with the rest of phraseTasks.
//
// When `preserveLegatoTail` is true, the MOST RECENT active note is kept
// alive so the next phrase's first `legatoNote()` can overlap it (20 ms
// noteOn-before-noteOff) and trigger SWAM portamento. All earlier notes
// are still released to protect against stuck-note accumulation across
// fast turn sequences. handleVoice passes true for legato complexes.
function cancelPhrase(preserveLegatoTail) {
	for (var i = 0; i < phraseTasks.length; i++) {
		phraseTasks[i].cancel();
	}
	phraseTasks = [];

	// D33 — kill any in-flight CC 11 ramp so a brand-new voice's envelope
	// doesn't fight the previous phrase's slew back to sustain.
	cancelCCRamp(CC.EXPRESSION);

	if (preserveLegatoTail && state.activeNotes.length > 0) {
		var tail = state.activeNotes[state.activeNotes.length - 1];
		for (var j = 0; j < state.activeNotes.length - 1; j++) {
			noteOff(state.activeNotes[j]);
		}
		state.activeNotes = [tail];
	} else {
		allNotesOff();
	}
}

// Schedule release + fade at end of phrase duration (seconds).
// D33 — the fade is now a single slewed rampCC(CC.EXPRESSION, 0, …) whose
// duration comes from the active complex's releaseRampMs scaled by regime,
// instead of five hard step-writes.
function scheduleRelease(dur) {
	if (releaseTask) {
		releaseTask.cancel();
		releaseTask = null;
	}
	var ms = Math.max(dur * 1000, 200);
	releaseTask = new Task(function() {
		var cmx = COMPLEX[state.activeComplex];
		var rampMs = (cmx && cmx.exprEnv && cmx.exprEnv.releaseRampMs) || 120;
		var rm = REGIME_EXPR_RAMP_MULT[state.regime] || 1.0;
		// Phase A1: face envelope scales release too — fade/drone stretch
		// the fade, stab/burst clip it short, so the articulation of the
		// tail matches the attack's character.
		var faceRm = state.faceReleaseMult || 1.0;
		var fadeMs = Math.max(20, Math.round(rampMs * rm * faceRm));

		rampCC(CC.EXPRESSION, 0, fadeMs);
		var offT = new Task(function() {
			allNotesOff();
			releaseTask = null;
		}, this);
		offT.schedule(fadeMs + 20);
		phraseTasks.push(offT);
	}, this);
	releaseTask.schedule(ms);
}

// ================================================================
// EXPRESSION ENVELOPE (D8, D33)
// peak = INTENSITY.expr * pathScale; shape comes from complex.exprEnv.
// Every stage transition is slewed via rampCC so CC 11 interpolates
// instead of jumping. Per-stage ms come from exprEnv.{attackRampMs,
// sustainRampMs, releaseRampMs} scaled by REGIME_EXPR_RAMP_MULT.
// ================================================================
function scheduleExprEnvelope(peakExpr, env, durMs) {
	var rm = REGIME_EXPR_RAMP_MULT[state.regime] || 1.0;
	var aMs = (env.attackRampMs  != null ? env.attackRampMs  : 40) * rm;
	var sMs = (env.sustainRampMs != null ? env.sustainRampMs : 120) * rm;

	// Attack: slew from current CC 11 up to attack fraction
	rampCC(CC.EXPRESSION, Math.round(peakExpr * env.attack), aMs);

	// Peak at ~25% of duration
	var peakAt = Math.max(60, Math.round(durMs * 0.25));
	scheduleAt(peakAt, function() {
		rampCC(CC.EXPRESSION, Math.round(peakExpr * env.peak), sMs);
	});

	// Sustain level at 70%
	var sustainAt = Math.max(peakAt + 40, Math.round(durMs * 0.70));
	scheduleAt(sustainAt, function() {
		rampCC(CC.EXPRESSION, Math.round(peakExpr * env.sustain), sMs);
	});
	// Release is handled by scheduleRelease()'s slewed fade.
}

// ================================================================
// HUMANIZATION
// ================================================================
function humanVel(base) {
	var jitter = (Math.random() - 0.5) * 0.3 * base;
	var accent = (state.turnCount % 3 === 0) ? 8 : 0;
	return clamp(Math.round(base + jitter + accent), 20, 127);
}

function humanPitch(pitch) {
	if (Math.random() < 0.1) pitch += (Math.random() < 0.5) ? -1 : 1;
	return clamp(pitch, CELLO_MIN, CELLO_MAX);
}

function humanDelay() {
	return Math.floor(Math.random() * 30);
}

// ================================================================
// COMPLEX SETUP — diffs every field; baseline CCs written with ccForce
// so cache re-aligns with SWAM even after spell mutations (D13).
// ================================================================
function setupComplex(complexType) {
	var cmx = COMPLEX[complexType];
	if (!cmx) return;
	state.activeComplex = complexType;
	log("complex -> C" + complexType);

	// Play Mode (velocity-select KS)
	setPlayMode(cmx.playMode);

	// Harmonics (4-state) and Tremolo (3-state) — CC path (D31). The v3.10
	// KS F#/G# were 2-band vel-selects with unreachable-Off; CC gives us
	// clean access to every state including Off. Falls back to KS if the
	// MIDI-Learn hasn't been done.
	// D37 — C4 rotates across OCT / OCT_5TH / CTRL per voice via
	// harmonicsForC4(); every other complex reads the table baseline
	// (always OFF).
	var harmTarget = (complexType === 4) ? harmonicsForC4() : cmx.harmonics;
	setHarmonics(harmTarget);
	setTremolo(cmx.tremolo);

	// D35 — Bow Polyphony per complex. Non-gliss = Double/Hold (rich
	// two-string textures on overlapping turns); C5/C6/C7 = Mono Poly
	// Release (single-line portamento for the gliss phrases).
	if (cmx.bowPoly != null) setBowPolyphony(cmx.bowPoly);

	// D32 — Tremolo Min Speed baseline (CC 80). Only written when this
	// complex actually tremolos — no point nudging the SWAM slider for C1
	// pizz or C3 arco, and on a preset where CC 80 collides with another
	// MIDI-Learn binding the unconditional write was landing noise.
	// handleVoice overrides per turn with intensity × path scaling.
	if (cmx.tremoloRate != null && cmx.tremolo !== TREMOLO.OFF) {
		ccForce(CC.TREMOLO_RATE, cmx.tremoloRate);
	}

	// Baseline CCs (forced — setup is authoritative). bow pressure is
	// applied at the complex baseline here; handleVoice then overrides
	// with intensity × bowMult so fff digs harder than p.
	if (cmx.bowPos != null) ccForce(CC.BOW_POSITION, cmx.bowPos);
	state.bowPressureBase = cmx.bowPressure;
	ccForce(CC.BOW_PRESSURE, cmx.bowPressure);

	// Portamento
	ccForce(CC.PORTAMENTO_ON,   cmx.portamento.on ? 127 : 0);
	ccForce(CC.PORTAMENTO_TIME, cmx.portamento.time);

	// Attack ramp & control (single source; regime scales ramp)
	var mult = REGIME_ATTACK_MULT[state.regime] || 1.0;
	ccForce(CC.ATTACK_RAMP,    clamp(Math.round(cmx.attackRamp * mult), 0, 127));
	ccForce(CC.ATTACK_CONTROL, cmx.attackCtrl);

	// Vibrato baseline (rate; depth may be modulated by spin)
	ccForce(CC.VIBRATO_RATE, cmx.vibrato.rate);
	ccForce(CC.VIBRATO_DEPTH, vibDepthForComplex(cmx));

	// Sieve reset for ordered phrase generators
	if (complexType === 2 || complexType === 6) {
		state.sieveIdx = 0;
		state.sieveDir = 1;
	}
}

// ================================================================
// PITCH SELECTION
// ================================================================
function pickPitch(complexType) {
	var s = state.sieve;
	var cmx = COMPLEX[complexType];
	var reg = cmx && cmx.register;
	var lo, hi;
	if (reg) {
		// V2 widens the usable floor down an octave (keeps the bass-drone
		// feel of C3/C7 real); C4/C8 stay high.
		var shift = (state.path === "V2") ? -12 : 0;
		lo = Math.max(24, reg.lo + shift);
		hi = Math.min(CELLO_MAX, reg.hi);
	}
	// Phase A1 — face's registerBias adds semitone transposition on top
	// of path transpose. foldToRange then wraps back into the complex's
	// register window, so the face never forces unreachable pitches — it
	// just biases which octave of the fold we land in.
	var faceTr = state.faceTranspose || 0;
	if (s.length === 0) return foldToRange(36 + state.transpose + faceTr, lo, hi);

	var pitch;
	switch (complexType) {
		case 1: case 4: case 5:
			pitch = s[Math.floor(Math.random() * s.length)];
			break;

		case 2: case 6:
			pitch = s[state.sieveIdx];
			state.sieveIdx += state.sieveDir;
			if (state.sieveIdx >= s.length) { state.sieveIdx = s.length - 2; state.sieveDir = -1; }
			if (state.sieveIdx < 0)         { state.sieveIdx = 1;              state.sieveDir = 1;  }
			state.sieveIdx = clamp(state.sieveIdx, 0, s.length - 1);
			break;

		case 3: case 7: case 8:
			pitch = s[Math.floor(s.length / 2)];
			break;

		default:
			pitch = s[0];
	}
	return foldToRange(pitch + state.transpose + faceTr, lo, hi);
}

// D9 fix: V2 can reach the cello's lowest octave. Accepts optional per-
// complex bounds to bias the pitch register.
function foldToRange(pitch, lo, hi) {
	if (lo == null) lo = (state.path === "V2") ? 24 : CELLO_MIN;
	if (hi == null) hi = CELLO_MAX;
	while (pitch < lo) pitch += 12;
	while (pitch > hi) pitch -= 12;
	return clamp(pitch, lo, hi);
}

// ================================================================
// LEGATO — noteOn before noteOff (20 ms overlap) for SWAM portamento
// ================================================================
function legatoNote(pitch, vel) {
	var oldNotes = state.activeNotes.slice();
	noteOn(pitch, vel);
	state.activeNotes.push(pitch);

	if (oldNotes.length > 0) {
		scheduleAt(20, function() {
			for (var i = 0; i < oldNotes.length; i++) {
				noteOff(oldNotes[i]);
				var idx = state.activeNotes.indexOf(oldNotes[i]);
				if (idx >= 0) state.activeNotes.splice(idx, 1);
			}
		});
	}
}

// D34 — glissando trigger. SWAM's musical-interpretation rule: a slide is
// engaged when the overlapping second note has a LOW Note-On velocity.
// A high-vel overlap is heard as slurred legato (smooth timbre, no pitch
// sweep). phraseC5/C6/C7 used legatoNote(pitch, humanVel(vel)) for every
// note, so SWAM never engaged portamento even with CC 65/5 set correctly.
// glissNote overlaps at a fixed low velocity — the first note of a phrase
// still uses legatoNote to establish the attack, subsequent slides use this.
var GLISS_VEL = 18;  // below SWAM's slide threshold; expression drives dynamics
function glissNote(pitch) {
	legatoNote(pitch, GLISS_VEL);
}

// ================================================================
// PHRASE GENERATORS — one per complex (expression handled by envelope)
// ================================================================

// Stochastic note-count per phrase. Scales baseLo/baseHi by the current
// intensity's density multiplier and by live density state (0.5–5ish).
function phraseCount(baseLo, baseHi) {
	var intMap = INTENSITY_MAP[state.intensity] || INTENSITY_MAP["mf"];
	var iMult = intMap.density;
	var dMult = clamp(0.6 + state.density * 0.25, 0.6, 1.8);
	var lo = Math.max(1, Math.round(baseLo * iMult));
	var hi = Math.max(lo, Math.round(baseHi * iMult * dMult));
	return rrand(lo, hi);
}

function intensityDensity() {
	var intMap = INTENSITY_MAP[state.intensity] || INTENSITY_MAP["mf"];
	return intMap.density;
}

// Commit the shared sieve walker (state.sieveIdx / state.sieveDir — used
// by pickPitch cases 2 & 6) to a single direction for a phrase of `count`
// notes. If the current position can't fit `count` monotone reads, flip
// direction and teleport to the opposite extreme. Prevents C2 / C6
// phrases from turning mid-phrase at a sieve boundary, so each
// "ordered ascending/descending" gesture reads unambiguously.
function commitSieveWalk(count) {
	var s = state.sieve;
	if (s.length === 0) return;
	if (state.sieveDir > 0 && state.sieveIdx + count - 1 >= s.length) {
		state.sieveDir = -1;
		state.sieveIdx = s.length - 1;
	} else if (state.sieveDir < 0 && state.sieveIdx - (count - 1) < 0) {
		state.sieveDir = 1;
		state.sieveIdx = 0;
	}
}

// C1: Pizzicato cloud — short plucked notes, no legato
function phraseC1(vel, dur) {
	var count = phraseCount(2, 5);
	var spread = Math.min(dur * 1000, 700);

	for (var i = 0; i < count; i++) {
		(function(idx) {
			var delay = idx === 0 ? 0 : rrand(20, Math.round(spread));
			scheduleAt(delay, function() {
				var p = humanPitch(pickPitch(1));
				var v = humanVel(vel);
				noteOn(p, v);
				state.activeNotes.push(p);
				scheduleAt(rrand(60, 220), function() {
					noteOff(p);
					var pidx = state.activeNotes.indexOf(p);
					if (pidx >= 0) state.activeNotes.splice(pidx, 1);
				});
			});
		})(i);
	}
	scheduleRelease(dur);
}

// C2: OrderedCloudAscDesc — bowed legato cloud of 3–5 notes (6 in burst)
// walking the sieve in a single committed direction. Direction flips
// between phrases via `commitSieveWalk` when the walker would cross a
// boundary; within a phrase the walk is monotone so each cloud reads
// unambiguously ascending OR descending.
function phraseC2(vel, dur) {
	var hi = state.regime === "burst" ? 6 : 5;
	var count = Math.max(3, phraseCount(3, hi));
	commitSieveWalk(count);
	var spacing = Math.max(90, Math.round(dur * 1000 / (count + 1)));
	for (var i = 0; i < count; i++) {
		(function(idx) {
			scheduleAt(idx * spacing + humanDelay(), function() {
				legatoNote(humanPitch(pickPitch(2)), humanVel(vel));
			});
		})(i);
	}
	scheduleRelease(dur * 1.2);
}

// C3: OrderedCloudFlat — 3–5 legato rebows hovering at constant register
// (±1 semitone jitter around the sieve centroid). Non-directional: pitches
// are drawn from a narrow band, not walked like C2. "Ordered" = narrow
// window; "flat" = no trajectory.
function phraseC3(vel, dur) {
	var count = phraseCount(3, 5);
	var durMs = Math.max(400, dur * 1000);
	var spacing = Math.max(110, Math.round(durMs / (count + 1)));
	var center = pickPitch(3);
	for (var i = 0; i < count; i++) {
		(function(idx) {
			scheduleAt(idx * spacing + humanDelay(), function() {
				var jitter = (Math.random() < 0.5) ? 0 : (Math.random() < 0.5 ? -1 : 1);
				var p = clamp(center + jitter, CELLO_MIN, CELLO_MAX);
				legatoNote(humanPitch(p), humanVel(vel));
			});
		})(i);
	}
	scheduleRelease(dur * 1.3);
}

// C4: IonizedAtom — 2–5 harmonic attacks clustered near a central pitch
// (sieve centroid ±2 semi jitter) with RANDOM-TIMED arrival across the
// phrase. "Atom" = localized pitch nucleus (not scattered like C1); the
// "ionization" is in the timing — each flageolet hit arrives at an
// unpredictable moment (cf. C1 pizz cloud's rrand delays). Xenakis
// describes C4 as "interferences with pizzicati"; the SWAM bridge
// renders it with harmonics (D37) instead, but the structural "atom
// with ionized timing" character is preserved regardless of technique.
function phraseC4(vel, dur) {
	var count = phraseCount(2, 5);
	var spread = Math.max(300, dur * 1000);
	var s = state.sieve;
	var cmx = COMPLEX[4];
	var base = (s.length > 0) ? s[Math.floor(s.length / 2)] : 60;
	var faceTr = state.faceTranspose || 0;
	var loReg = Math.max(24, cmx.register.lo + (state.path === "V2" ? -12 : 0));
	var hiReg = Math.min(CELLO_MAX, cmx.register.hi);
	for (var i = 0; i < count; i++) {
		(function(idx) {
			// Ionized timing — random delay across the spread, not progressive.
			var delay = idx === 0 ? 0 : rrand(40, Math.round(spread));
			scheduleAt(delay, function() {
				var jitter = rrand(-2, 2);
				var p = foldToRange(base + state.transpose + faceTr + jitter, loReg, hiReg);
				var v = clamp(humanVel(vel) - 15, 25, 100);
				noteOn(humanPitch(p), v);
				state.activeNotes.push(p);
				scheduleAt(rrand(180, 400), function() {
					noteOff(p);
					var pidx = state.activeNotes.indexOf(p);
					if (pidx >= 0) state.activeNotes.splice(pidx, 1);
				});
			});
		})(i);
	}
	scheduleRelease(dur);
}

// C5: wild gliss — dense salvo of ≥8-semi leaps spanning the full cello range.
// First note establishes attack (humanVel); every overlap after uses
// glissNote (low vel) so SWAM engages portamento instead of slurred legato.
function phraseC5(vel, dur) {
	var count = phraseCount(4, 9);
	var MIN_LEAP = 8;
	var lastPitch = pickPitch(5);
	legatoNote(humanPitch(lastPitch), humanVel(vel));
	for (var i = 0; i < count; i++) {
		(function(idx) {
			var t = Math.round((idx + 1) / (count + 1) * dur * 1000 * 0.92);
			scheduleAt(t, function() {
				var p = pickPitch(5);
				var attempts = 0;
				while (Math.abs(p - lastPitch) < MIN_LEAP && attempts < 12) { p = pickPitch(5); attempts++; }
				glissNote(humanPitch(p));
				lastPitch = p;
			});
		})(i);
	}
	scheduleRelease(dur * 1.4);
}

// C6: OrderedSlidingAscDesc — 3–6 portamento steps along the sieve in a
// single committed direction. `commitSieveWalk` pre-flips the shared
// walker so each phrase reads unambiguously ascending OR descending;
// within the phrase the walk is monotone. First note attacks; subsequent
// steps overlap as gliss for continuous sliding motion.
function phraseC6(vel, dur) {
	var count = phraseCount(3, 6);
	commitSieveWalk(count);
	var spacing = Math.max(100, Math.round(dur * 1000 / (count + 1)));
	for (var i = 0; i < count; i++) {
		(function(idx) {
			scheduleAt(idx * spacing + humanDelay(), function() {
				if (idx === 0) {
					legatoNote(humanPitch(pickPitch(6)), humanVel(vel));
				} else {
					glissNote(humanPitch(pickPitch(6)));
				}
			});
		})(i);
	}
	scheduleRelease(dur * 1.2);
}

// C7: sustained + multiple micro-drifts — deep breath-like floating.
// First note attacks; drift overlaps glide at low vel (gentle sigh).
function phraseC7(vel, dur) {
	var driftCount = 1 + (intensityDensity() >= 1.1 ? rrand(1, 2) : 0);
	var p1 = pickPitch(7);
	legatoNote(humanPitch(p1), humanVel(vel));
	var durMs = dur * 1000;
	for (var i = 0; i < driftCount; i++) {
		(function(idx) {
			var t = Math.round(durMs * (0.4 + (idx + 1) / (driftCount + 2) * 0.5));
			scheduleAt(t, function() {
				var lo = (state.path === "V2") ? 24 : CELLO_MIN;
				var p2 = clamp(p1 + rrand(-3, 3), lo, CELLO_MAX);
				glissNote(p2);
			});
		})(i);
	}
	scheduleRelease(dur * 2.0);
}

// C8: ponticello tremolo cluster — 2–4 re-bows on same pitch (SWAM
// tremolo KS still latched, so each re-bow is itself tremolo'd)
function phraseC8(vel, dur) {
	var count = phraseCount(2, 4);
	var mainPitch = pickPitch(8);
	var spacing = Math.max(150, Math.round(dur * 1000 / (count + 1)));
	for (var i = 0; i < count; i++) {
		(function(idx) {
			scheduleAt(idx * spacing + humanDelay(), function() {
				var v = clamp(humanVel(vel) + 8 - idx * 3, 40, 120);
				legatoNote(humanPitch(mainPitch), v);
			});
		})(i);
	}
	scheduleRelease(dur);
}

// ================================================================
// VOICE EVENT — one per real turn (after D16 upstream fix)
// ================================================================
// ================================================================
// FACE SIGNATURES (Phase A1) — gesture-type mapping per face.
//
// Source of truth: src/face-gesture.ts → FACE_SIGNATURES. This bridge
// mirrors every field (minus panBias — SWAM is mono → stereo; pan lives
// on the SC side). The ENV_PROFILE / ART_OFF_VEL / MOTION_NUDGE tables
// below are SWAM-specific rendering placeholders for envelope /
// articulation / motion. Vocabulary is canonical in TS; rendering
// multipliers are backend-specific (SC will get its own when it lands).
// ================================================================
var FACE_MAP = {
	"U":  { durationBias: 0.7, registerBias:  0.8, envelope: "pluck", articulation: "attack",    motion: "up" },
	"U'": { durationBias: 1.4, registerBias:  0.8, envelope: "fade",  articulation: "release",   motion: "down" },
	"D":  { durationBias: 0.6, registerBias: -0.8, envelope: "stab",  articulation: "attack",    motion: "down" },
	"D'": { durationBias: 1.8, registerBias: -0.8, envelope: "drone", articulation: "sustained", motion: "static" },
	"L":  { durationBias: 1.3, registerBias:  0.0, envelope: "swell", articulation: "sustained", motion: "up" },
	"L'": { durationBias: 1.3, registerBias:  0.0, envelope: "fade",  articulation: "release",   motion: "down" },
	"R":  { durationBias: 0.5, registerBias:  0.0, envelope: "stab",  articulation: "attack",    motion: "static" },
	"R'": { durationBias: 0.6, registerBias:  0.0, envelope: "burst", articulation: "iterative", motion: "oscillate" },
	"F":  { durationBias: 1.2, registerBias:  0.3, envelope: "swell", articulation: "sustained", motion: "up" },
	"F'": { durationBias: 1.2, registerBias:  0.3, envelope: "swell", articulation: "sustained", motion: "down" },
	"B":  { durationBias: 0.9, registerBias: -0.3, envelope: "pluck", articulation: "attack",    motion: "static" },
	"B'": { durationBias: 1.6, registerBias: -0.3, envelope: "drone", articulation: "sustained", motion: "oscillate" }
};

// Envelope → expression-envelope shaping multipliers.
//   peakMult     scales state.peakExpr → loudness of the phrase peak
//   attackMult   scales cmx.exprEnv.attackRampMs → rise speed
//   releaseMult  scales cmx.exprEnv.releaseRampMs → fade speed
// First-draft numbers, deliberately modest so no single face gets lost
// or overpowers its siblings. Retune against the live sound once the
// twelve are audible in sequence.
var ENV_PROFILE = {
	"pluck": { peakMult: 1.00, attackMult: 0.3, releaseMult: 0.7 },  // fast rise, quick decay
	"stab":  { peakMult: 1.15, attackMult: 0.15, releaseMult: 0.6 }, // immediate punch
	"swell": { peakMult: 0.90, attackMult: 2.0, releaseMult: 1.3 },  // slow rise
	"drone": { peakMult: 0.80, attackMult: 1.5, releaseMult: 1.5 },  // sustained, soft
	"fade":  { peakMult: 1.00, attackMult: 1.0, releaseMult: 2.2 },  // long tail
	"burst": { peakMult: 1.10, attackMult: 0.25, releaseMult: 0.5 }  // punchy, short
};

// Articulation → note-off velocity override. SWAM maps note-off vel to
// natural release character: higher = shorter/harder cutoff. Overrides
// state.noteOffVel (turn-rate driven) for face-originated phrases;
// non-face moves fall back to the rate default.
var ART_OFF_VEL = {
	"attack":    110,  // short, hard stop
	"sustained":  45,  // long, natural
	"release":    30,  // very long tail
	"iterative":  95   // punchy, subdivided
};

// Motion → pitch-transposition nudge (semitones, layered on registerBias).
// "oscillate" alternates per-turn to produce the swing implied by the name;
// resolved at handleFace time using state.turnCount parity.
var MOTION_NUDGE = {
	"static":     0,
	"up":         2,
	"down":      -2,
	"oscillate":  0   // dynamic — computed in handleFace
};

// Called on /xk/face BEFORE /xk/voice — relay/osc-output.ts enforces that
// ordering (voiceToOsc emits face first). Non-face moves (e.g. diagram
// advance) skip the face message entirely; unknown strings also clear to
// neutral so the bridge stays robust to future engine changes.
function handleFace(face) {
	var sig = FACE_MAP[face];
	if (!sig) {
		state.face = null;
		state.faceDurationBias = 1.0;
		state.faceTranspose = 0;
		state.faceEnvelope = null;
		state.faceArticulation = null;
		state.faceMotion = null;
		state.faceEnvProfile = null;
		state.faceOffVelOverride = null;
		state.faceReleaseMult = 1.0;
		return;
	}
	state.face = face;
	state.faceDurationBias = sig.durationBias;
	state.faceEnvelope = sig.envelope;
	state.faceArticulation = sig.articulation;
	state.faceMotion = sig.motion;

	var profile = ENV_PROFILE[sig.envelope] || null;
	state.faceEnvProfile = profile;
	state.faceReleaseMult = profile ? profile.releaseMult : 1.0;

	var offVel = ART_OFF_VEL[sig.articulation];
	state.faceOffVelOverride = (offVel != null) ? offVel : null;

	var spread = (state.path === "V2") ? 6 : 12;
	var nudge = MOTION_NUDGE[sig.motion] || 0;
	if (sig.motion === "oscillate") {
		nudge = (state.turnCount % 2 === 0) ? 2 : -2;
	}
	state.faceTranspose = Math.round(sig.registerBias * spread) + nudge;
}

function handleVoice(vtxIdx, complexType, density, intensity, duration) {
	if (state.frozen) return;

	// Phase A1 — face identity scales the phrase's duration uniformly.
	// All downstream timers (expression envelope, D39 tremolo ramp,
	// release scheduling, phrase-internal rebows) read the scaled value.
	duration = duration * (state.faceDurationBias || 1.0);

	state.turnCount++;
	state.density = density;
	state.duration = duration;
	var now = Date.now();
	state.lastTurnTime = now;
	state.lastVoiceTime = now;

	// Preserve the tail note for SWAM portamento when the incoming complex
	// uses legato phrases. cancelPhrase() otherwise hard-releases — which
	// broke portamento by emptying state.activeNotes before legatoNote()
	// could overlap it.
	cancelPhrase(LEGATO_COMPLEX[complexType] === true);
	if (releaseTask) { releaseTask.cancel(); releaseTask = null; }

	// KS sync guard (D28) — for the first N voice events after bang(),
	// force-write KS via setupComplex regardless of state.activeComplex
	// diff, so the in-JS selector state provably aligns with SWAM before
	// diff-suppression silences subsequent re-asserts.
	var forcing = state.ksForceCount > 0;
	if (forcing) {
		state.ksForceCount--;
		state.forceKS = true;
	}

	// Technique change — diff-fire KS via setupComplex
	if (complexType !== state.activeComplex || forcing) {
		setupComplex(complexType);
	}

	state.forceKS = false;

	var cmx = COMPLEX[complexType];
	if (!cmx) return;

	var intMap = INTENSITY_MAP[intensity] || INTENSITY_MAP["mf"];
	state.intensity = intensity;
	state.baseExpr = intMap.expr;
	var baseVel = intMap.vel;

	// Path V2 scales peak Expression by 0.7 (Xenakis V2 = softer palette).
	// Phase A1 envelope placeholder: state.faceEnvProfile.peakMult shapes
	// loudness to the signature's envelope archetype (stab/burst = louder,
	// swell/drone = softer), so the twelve faces sit at subtly different
	// dynamic levels even when the intensity label is identical.
	var pathScale = (state.path === "V2") ? 0.7 : 1.0;
	var envPeakMult = (state.faceEnvProfile && state.faceEnvProfile.peakMult) || 1.0;
	state.peakExpr = clamp(intMap.expr * pathScale * envPeakMult, 0, 127);

	// Intensity-driven bow pressure: fff digs, p lightens. Rebases the
	// deviation modulation in handleExprDev too (via state.bowPressureBase).
	var bowBase = clamp(cmx.bowPressure * intMap.bowMult, 0, 127);
	state.bowPressureBase = bowBase;
	ccForce(CC.BOW_PRESSURE, Math.round(bowBase));

	// D39 — per-phrase stochastic tremolo rate envelope. At voice onset,
	// roll a die and commit to one of three gestures for the whole phrase:
	//   1/3 slow → fast ramp  (tremolo accelerates over the phrase)
	//   1/3 fast → slow ramp  (tremolo decelerates over the phrase)
	//   1/3 steady at base    (classic fixed rate, intensity×path-scaled)
	// Ramps use rampCC (same slew limiter as CC 11 Expression, D33) so the
	// slider walks smoothly at 15 ms ticks. Replaces D38's 60 Hz spin+breath
	// modulator, which moved the slider too subtly (±12 amplitude) and
	// jittered on every spin bump without producing a coherent gesture. The
	// per-voice ±8% jitter (D32) is also dropped — the ramp IS the motion,
	// jitter only muddied the shape. The ramp runs across the phrase's full
	// `duration * 1000` ms, so every re-bow inside phraseC8 / phraseC4 etc.
	// reads whatever rate the ramp is currently walking through.
	if (cmx.tremoloRate != null && cmx.tremolo !== TREMOLO.OFF && HAS_TREMOLO_RATE) {
		cancelCCRamp(CC.TREMOLO_RATE);
		var phraseMs = Math.max(duration * 1000, 250);
		var pathTrem = (state.path === "V2") ? 0.85 : 1.0;
		var steadyBase = clamp(Math.round(cmx.tremoloRate * intMap.tremRateMult * pathTrem), 0, 127);
		var SLOW = 20;
		var FAST = 118;
		var roll = Math.random();
		if (roll < 1/3) {
			ccForce(CC.TREMOLO_RATE, SLOW);
			rampCC(CC.TREMOLO_RATE, FAST, phraseMs);
			log("tremRamp C" + complexType + " slow→fast " + SLOW + "→" + FAST + " / " + phraseMs + "ms");
		} else if (roll < 2/3) {
			ccForce(CC.TREMOLO_RATE, FAST);
			rampCC(CC.TREMOLO_RATE, SLOW, phraseMs);
			log("tremRamp C" + complexType + " fast→slow " + FAST + "→" + SLOW + " / " + phraseMs + "ms");
		} else {
			ccForce(CC.TREMOLO_RATE, steadyBase);
			log("tremRamp C" + complexType + " steady " + steadyBase);
		}
	}

	// Defensive portamento re-assertion — written every voice event, not
	// only on complex change. Guards against SWAM cache drift, spell resets
	// (t-perm), autowatch reloads, and stale CC state after intensity/path
	// swaps that don't trigger setupComplex. Requires SWAM preset setting
	// Portamento Control = CC (P.MaxTime); see D20.
	ccForce(CC.PORTAMENTO_ON,   cmx.portamento.on ? 127 : 0);
	ccForce(CC.PORTAMENTO_TIME, cmx.portamento.time);

	// D30 — Harmonics + Tremolo KS are written only by setupComplex's
	// setEnum diff. The previous defensive re-assert here fired both KS on
	// every voice event (bypassing the diff), which re-selected Harmonics=OFF
	// and Tremolo=OFF whenever a new voice on a non-C4/C8 complex arrived
	// while a still-sounding C4 harmonic or C8 tremolo note was bowing —
	// the "flash on/off within a single turn" symptom. D28's ksForceCount +
	// D29's interleave guard already handle the drift cases the defensive
	// write was added for; let setEnum do its job.
	log("voice C" + complexType + " porta=" + (cmx.portamento.on ? "on" : "off") +
	    " time=" + cmx.portamento.time + " bow=" + Math.round(bowBase) +
	    " int=" + intensity);

	// Schedule expression envelope for the phrase duration.
	// Phase A1 envelope placeholder: if the face carries an envelope profile,
	// clone cmx.exprEnv with attackRampMs scaled by profile.attackMult so
	// pluck/stab/burst get a fast rise while swell/drone/fade rise slowly.
	// Release scaling happens in scheduleRelease via state.faceReleaseMult.
	var envForPhrase = cmx.exprEnv;
	if (state.faceEnvProfile) {
		envForPhrase = {
			attack:        cmx.exprEnv.attack,
			peak:          cmx.exprEnv.peak,
			sustain:       cmx.exprEnv.sustain,
			attackRampMs:  (cmx.exprEnv.attackRampMs  || 40)  * state.faceEnvProfile.attackMult,
			sustainRampMs:  cmx.exprEnv.sustainRampMs,
			releaseRampMs:  cmx.exprEnv.releaseRampMs
		};
	}
	scheduleExprEnvelope(state.peakExpr, envForPhrase, Math.max(duration * 1000, 250));

	// Dispatch phrase
	switch (complexType) {
		case 1: phraseC1(baseVel, duration); break;
		case 2: phraseC2(baseVel, duration); break;
		case 3: phraseC3(baseVel, duration); break;
		case 4: phraseC4(baseVel, duration); break;
		case 5: phraseC5(baseVel, duration); break;
		case 6: phraseC6(baseVel, duration); break;
		case 7: phraseC7(baseVel, duration); break;
		case 8: phraseC8(baseVel, duration); break;
		default:
			legatoNote(pickPitch(complexType), humanVel(baseVel));
			scheduleRelease(duration);
	}
}

// ================================================================
// CONTINUOUS EXPRESSION — 60 Hz with deadband (D18)
// ================================================================

// Per-complex vibrato depth baseline + spin-modulated extra (D3)
function vibDepthForComplex(cmx) {
	var base = cmx.vibrato.depth;          // 0–100
	var s = state.spinEMA;
	var extra = 0;
	if (s > 0.15) {
		var u = (s - 0.15) / 0.85;         // 0..1 above musical dead zone
		extra = u * u * 30;                // up to +30
	}
	return clamp(base + extra, 0, 127);
}

// Should continuous CCs transmit this frame? (D18 transmission deadband)
// Skip writes when spin has been below 0.02 for ≥200 ms. Above that,
// throttle to 30 Hz by coalescing pairs of frames.
function shouldTransmit(now) {
	if (state.spin < 0.02) {
		if (state.spinLowSince === 0) state.spinLowSince = now;
		if (now - state.spinLowSince >= 200) return false;
	} else {
		state.spinLowSince = 0;
	}
	// 30 Hz coalesce: fire on alternating frames
	return (state.frame60 & 1) === 0;
}

function handleExprTilt(val) {
	state.tilt = val;
	// Tilt → timbral Bow Position modulation around complex baseline (D4)
	var cmx = COMPLEX[state.activeComplex];
	if (!cmx || cmx.bowPos == null) return;
	var now = Date.now();
	if (!shouldTransmit(now)) return;
	var jitter = (val - 0.5) * 60;         // ±30 — audible sul tasto↔sul pont sweep
	cc(CC.BOW_POSITION, Math.round(cmx.bowPos + jitter + state.scrambleBowBias));
}

function handleExprSpin(val) {
	state.spin = val;
	// EMA on spin (α = 0.08) — smooth, per D3
	state.spinEMA = state.spinEMA + 0.08 * (val - state.spinEMA);

	var now = Date.now();
	state.frame60++;
	if (!shouldTransmit(now)) return;

	var cmx = COMPLEX[state.activeComplex];
	if (!cmx) return;

	// Vibrato depth: baseline + spin contribution
	cc(CC.VIBRATO_DEPTH, vibDepthForComplex(cmx));
	// Vibrato rate: baseline + light spin modulation
	var rate = cmx.vibrato.rate + Math.round(state.spinEMA * 40);
	cc(CC.VIBRATO_RATE, rate);
}

function handleExprDev(val) {
	state.dev = val;
	state.devEMA = state.devEMA + 0.1 * (val - state.devEMA);
	var now = Date.now();
	if (!shouldTransmit(now)) return;

	var cmx = COMPLEX[state.activeComplex];
	if (!cmx) return;

	// Deviation → ±25 modulation around the intensity-scaled baseline
	// (state.bowPressureBase tracks complex × intensity.bowMult)
	var mod = (state.devEMA - 0.5) * 50;   // -25 .. +25
	var base = state.bowPressureBase != null ? state.bowPressureBase : cmx.bowPressure;
	cc(CC.BOW_PRESSURE, Math.round(base + mod));

	// Bow speed: light map (types that don't own speed)
	if (state.activeComplex !== 3 && state.activeComplex !== 7) {
		cc(CC.BOW_SPEED, Math.round(40 + state.devEMA * 80));
	}
}

// Phase 6: scramble drives a Bow Position bias (sul tasto ↔ sul pont).
// v3.10 removed the KS latches, so the same "solved = warm / scrambled =
// aggressive" timbral shift now comes from CC 16 bias, layered on top of the
// complex's baseline and the tilt ±30 modulation. 2 s hysteresis prevents
// thrash near the thresholds; the bias is skipped for C8 (already at the
// bridge — biasing further would saturate at bowPos=0).
function handleExprScramble(val) {
	state.scramble = val;
	var now = Date.now();
	if (val < 0.2) {
		if (state.tastoSince === 0) state.tastoSince = now;
		state.pontSince = 0;
	} else if (val > 0.8) {
		if (state.pontSince === 0) state.pontSince = now;
		state.tastoSince = 0;
	} else if (val > 0.3 && val < 0.7) {
		state.tastoSince = 0;
		state.pontSince = 0;
	}
	var newBias = 0;
	if (state.tastoSince && now - state.tastoSince >= 2000) newBias = 40;
	else if (state.pontSince && now - state.pontSince >= 2000 &&
	         state.activeComplex !== 8) newBias = -40;
	if (newBias === state.scrambleBowBias) return;

	state.scrambleBowBias = newBias;
	// Apply immediately so the shift is audible without waiting for the next
	// tilt frame (and so it still happens when the cube is held still).
	var cmx = COMPLEX[state.activeComplex];
	if (cmx && cmx.bowPos != null) {
		var jitter = (state.tilt - 0.5) * 60;
		ccForce(CC.BOW_POSITION, Math.round(cmx.bowPos + jitter + newBias));
	}
	log("scramble bow bias -> " + newBias);
}

// ================================================================
// STRUCTURAL MODIFIERS
// ================================================================
function handleTetra(orbit) {
	state.tetra = orbit;
	// Future: KS D# Alt Fingering toggle per D10.
}

function handlePath(p) {
	state.path = p;
	state.transpose = (p === "V2") ? -12 : 0;
	// Path scales the envelope peak on the next voice event.
	log("path -> " + p);
}

function handleRegime(r) {
	if (state.regime === r) return;
	state.regime = r;
	log("regime -> " + r);
	// Regime only affects attack ramp (single source per D7).
	var cmx = COMPLEX[state.activeComplex];
	if (cmx) {
		var mult = REGIME_ATTACK_MULT[r] || 1.0;
		ccForce(CC.ATTACK_RAMP, clamp(Math.round(cmx.attackRamp * mult), 0, 127));
	}
}

// Phase 8: turn rate → note-off velocity. Fast turns (burst) produce
// short, bitten releases; slow turns (contemplative) produce long,
// naturally-decayed releases. Mapping: 0 turns/sec → vel 25, 8+ → vel 120.
function handleRate(turnsPerSec) {
	state.turnRate = turnsPerSec;
	var v = 25 + turnsPerSec * 12;
	state.noteOffVel = clamp(Math.round(v), 1, 127);
}

function handleSieve() {
	var args = arrayfromargs(arguments);
	state.sieve = [];
	for (var i = 0; i < args.length; i++) state.sieve.push(args[i] + SIEVE_BASE);
	state.sieveIdx = clamp(state.sieveIdx, 0, Math.max(0, state.sieve.length - 1));
	log("sieve -> " + state.sieve.length + " pitches");
}

// ================================================================
// SPELL REACTIONS — after any mutation, restore via setupComplex(active)
// which is idempotent thanks to D5 diffing. (D11, D13)
// ================================================================
function handleSpell(name) {
	log("spell: " + name);

	switch (name) {
		case "sexy-move":
			// Quick bow-pressure transient, then restore baseline
			ccForce(CC.BOW_PRESS_ACCENT, 110);
			scheduleAt(400, function() {
				ccForce(CC.BOW_PRESS_ACCENT, 0);
				if (state.activeComplex) setupComplex(state.activeComplex);
			});
			break;

		case "oll-cross":
			// Harmonic ping: switch Harmonics → octave overtone, play a high
			// note, then restore to whatever the active complex owns.
			// setHarmonics diffs so the restore is a no-op for C4.
			setHarmonics(HARMONICS.OCT);
			var harmPitch = foldToRange(pickPitch(4) + 12);
			noteOn(harmPitch, 60);
			state.activeNotes.push(harmPitch);
			scheduleAt(800, function() {
				noteOff(harmPitch);
				var idx = state.activeNotes.indexOf(harmPitch);
				if (idx >= 0) state.activeNotes.splice(idx, 1);
				// Restore baseline (resets harmonics to the complex's value)
				if (state.activeComplex) setupComplex(state.activeComplex);
			});
			break;

		case "u-perm":
			// Staccato burst via short gate + high velocity (no fake KS).
			var burstCount = rrand(3, 5);
			ccForce(CC.BOW_PRESS_ACCENT, 100);
			for (var i = 0; i < burstCount; i++) {
				(function(idx, last) {
					scheduleAt(idx * rrand(60, 120), function() {
						var bp = humanPitch(pickPitch(1));
						noteOn(bp, rrand(100, 120));
						state.activeNotes.push(bp);
						scheduleAt(rrand(60, 100), function() {
							noteOff(bp);
							var bidx = state.activeNotes.indexOf(bp);
							if (bidx >= 0) state.activeNotes.splice(bidx, 1);
							if (last) {
								ccForce(CC.BOW_PRESS_ACCENT, 0);
								if (state.activeComplex) setupComplex(state.activeComplex);
							}
						});
					});
				})(i, i === burstCount - 1);
			}
			break;

		case "sune":
			// D37 — third-harmonic ping. Switches Harmonics → OCT_5TH
			// (perfect-12th flageolet), plays one mid-register touch,
			// then restores via setupComplex diff. Sune is 2-look OLL
			// corners; the thinner/brighter flageolet gives the spell its
			// first audible signature without colliding with oll-cross's
			// OCT ping.
			setHarmonics(HARMONICS.OCT_5TH);
			var sunePitch = foldToRange(pickPitch(4));
			noteOn(sunePitch, 55);
			state.activeNotes.push(sunePitch);
			scheduleAt(700, function() {
				noteOff(sunePitch);
				var idx = state.activeNotes.indexOf(sunePitch);
				if (idx >= 0) state.activeNotes.splice(idx, 1);
				if (state.activeComplex) setupComplex(state.activeComplex);
			});
			break;

		case "anti-sune":
			// Bright palette: nudge bow toward bridge once, then restore
			ccForce(CC.BOW_POSITION, 40);
			scheduleAt(600, function() {
				if (state.activeComplex) setupComplex(state.activeComplex);
			});
			break;

		case "t-perm":
			bang();
			log("spell reset (t-perm)");
			break;

		case "niklas":
			// D37 — "4 Control" harmonic ping. Layered on top of the
			// engine-side path V1↔V2 toggle (see src/engine.ts onTurn).
			// CTRL is the rarest harmonic state (the user-selectable
			// partial whose exact pitch is whatever the SWAM preset has
			// baked into the Harmonics knob), so the spell marks itself
			// with a single distinct flageolet touch before restoring.
			// pickPitch(4) - 3 nudges the fingering slightly lower so
			// the partial lands inside the cello's audible band.
			setHarmonics(HARMONICS.CTRL);
			var niklasPitch = foldToRange(pickPitch(4) - 3);
			noteOn(niklasPitch, 52);
			state.activeNotes.push(niklasPitch);
			scheduleAt(900, function() {
				noteOff(niklasPitch);
				var idx = state.activeNotes.indexOf(niklasPitch);
				if (idx >= 0) state.activeNotes.splice(idx, 1);
				if (state.activeComplex) setupComplex(state.activeComplex);
			});
			break;
	}
}

// ================================================================
// PANIC — /xk/panic + inactivity watchdog (D17)
// ================================================================
function handlePanic() {
	log("PANIC — flushing all notes + CCs");
	bang();
}

// ================================================================
// /xk/tremLearn <val> — clean CC 80 emission for SWAM MIDI-Learn (D32).
// Problem: when the Expression ramp is firing CC 11 at ~15 ms ticks,
// hitting MIDI-Learn on Tremolo Min Speed latches CC 11 first. This
// handler halts all notes, cancels any in-flight CC 11 slew, and emits
// exactly one CC 80 = val message — nothing else on the wire — so SWAM
// can latch it unambiguously. Usage: send /xk/tremLearn 100 (or any
// 0-127 value) from the dashboard while SWAM's MIDI-Learn is armed.
// ================================================================
function handleTremLearn(val) {
	cancelPhrase();
	if (releaseTask) { releaseTask.cancel(); releaseTask = null; }
	cancelCCRamp(CC.EXPRESSION);
	var v = clamp(Math.round(val != null ? val : 100), 0, 127);
	// Bypass hasCC so it fires even if HAS_TREMOLO_RATE is false.
	outlet(0, "midievent", statusCC(MIDI_CH), CC.TREMOLO_RATE, v);
	ccCache[CC.TREMOLO_RATE] = v;
	log("tremLearn CC 80 = " + v + " (clean single-shot for MIDI-Learn)");
}

function watchdogTick() {
	// Fires only if ALL FOUR hold (D17): active notes, no release scheduled,
	// no pending phrase events, and silence for ≥ 3 s. Ensures long C3/C7
	// notes are never truncated.
	try {
		var now = Date.now();
		var hasNotes = state.activeNotes.length > 0;
		var noRelease = (releaseTask === null);
		var noPhrase = (phraseTasks.length === 0);
		var stale = (state.lastVoiceTime > 0) && (now - state.lastVoiceTime > 3000);
		if (hasNotes && noRelease && noPhrase && stale) {
			log("watchdog tripped — orphan notes, flushing");
			allNotesOff();
			state.lastVoiceTime = 0;
		}
	} catch (e) {}
	// Reschedule
	watchdogTask = new Task(watchdogTick, this);
	watchdogTask.schedule(1000);
}

function startWatchdog() {
	if (watchdogTask) watchdogTask.cancel();
	watchdogTask = new Task(watchdogTick, this);
	watchdogTask.schedule(1000);
}

// ================================================================
// OSC ROUTING
// ================================================================
function anything() {
	var addr = messagename;
	var args = arrayfromargs(arguments);

	if (addr === "/xk/voice") {
		handleVoice(args[0], args[1], args[2], args[3], args[4]);
	}
	else if (addr === "/xk/face")     { handleFace(args[0]); }
	else if (addr === "/xk/expr/tilt")     { handleExprTilt(args[0]); }
	else if (addr === "/xk/expr/spin")     { handleExprSpin(args[0]); }
	else if (addr === "/xk/expr/dev")      { handleExprDev(args[0]); }
	else if (addr === "/xk/expr/scramble") { handleExprScramble(args[0]); }
	else if (addr === "/xk/tetra")    { handleTetra(args[0]); }
	else if (addr === "/xk/path")     { handlePath(args[0]); }
	else if (addr === "/xk/regime")   { handleRegime(args[0]); }
	else if (addr === "/xk/rate")     { handleRate(args[0]); }
	else if (addr === "/xk/sieve")    { handleSieve.apply(this, args); }
	else if (addr === "/xk/spell")    { handleSpell(args[0]); }
	else if (addr === "/xk/scramble") { handleExprScramble(args[0]); }
	else if (addr === "/xk/panic")    { handlePanic(); }
	else if (addr === "/xk/tremLearn") { handleTremLearn(args[0]); }
}

// ================================================================
// RESET — starts silent (D15)
// ================================================================
function bang() {
	cancelPhrase();
	if (releaseTask) { releaseTask.cancel(); releaseTask = null; }

	state.activeComplex = 0;
	state.playMode = null;
	// Selector state — null forces setEnum to fire once so SWAM aligns with
	// our model on first voice event after reset (D27).
	state.harmonics  = null;
	state.tremolo    = null;
	state.bowPoly    = null;
	state.gestureMode = null;
	state.altFing    = null;
	state.keepBowDir = false;
	state.sieveIdx = 0;
	state.sieveDir = 1;
	state.activeNotes = [];
	state.frozen = false;
	state.scramble = 0;
	state.turnCount = 0;
	state.lastTurnTime = 0;
	state.lastVoiceTime = 0;
	state.baseExpr = 0;
	state.peakExpr = 0;
	state.density = 2.0;
	state.duration = 1.0;
	state.intensity = "mf";
	state.bowPressureBase = 64;
	state.tilt = 0.5;
	state.spin = 0;
	state.spinEMA = 0;
	state.dev = 0;
	state.devEMA = 0;
	state.spinLowSince = 0;
	state.frame60 = 0;
	state.scrambleBowBias = 0;
	state.tastoSince = 0;
	state.pontSince = 0;
	state.sordinoOn = false;
	state.turnRate = 0;
	state.noteOffVel = 64;
	// Phase A1 — clear face state so the first post-reset voice event
	// renders from neutral until /xk/face lands.
	state.face = null;
	state.faceDurationBias = 1.0;
	state.faceTranspose = 0;
	state.faceEnvelope = null;
	state.faceArticulation = null;
	state.faceMotion = null;
	state.faceEnvProfile = null;
	state.faceOffVelOverride = null;
	state.faceReleaseMult = 1.0;
	// KS sync guard: first 3 voice events after reset force-write KS so
	// SWAM aligns with our selector model even if the preset or a prior
	// session drifted its state (D28).
	state.ksForceCount = 3;
	state.forceKS = false;
	ccCache = {};

	// Expression to 0 (silent) — first phrase ramps from attack fraction.
	ccForce(CC.EXPRESSION, 0);
	ccForce(CC.VIBRATO_DEPTH, 0);
	ccForce(CC.VIBRATO_RATE, 64);
	ccForce(CC.BOW_PRESSURE, 64);
	ccForce(CC.BOW_POSITION, 64);
	ccForce(CC.BOW_PRESS_ACCENT, 0);
	ccForce(CC.BOW_SPEED, 64);
	ccForce(CC.PORTAMENTO_ON, 0);
	ccForce(CC.PORTAMENTO_TIME, 0);
	ccForce(CC.SUSTAIN_PEDAL, 0);
	ccForce(CC.ATTACK_RAMP, 64);
	ccForce(CC.ATTACK_CONTROL, 64);
	ccForce(CC.SORDINO, 0);
	// D32 — no CC 80 write at reset. Tremolo starts OFF; setupComplex emits
	// a rate only when the next complex flips tremolo ON.

	// Pin Gesture Mode = Expression (D27 / portamento safety).
	// In v3.10, KS D's Bipolar/Bowing modes re-interpret CC 11 as bow
	// direction/displacement instead of dynamics — which silently breaks
	// the Expression envelope AND the legato/portamento feel even though
	// CC 5 / CC 65 are still being written. Pin once at reset and never
	// modulate. setEnum is idempotent so re-fires are filtered.
	setEnum("gestureMode", KS.GESTURE_MODE, GESTURE.EXPR, 3);

	// Explicit OFF for Harmonics + Tremolo so SWAM matches our state model
	// even if the preset stored a different default (D27, D31). CC path
	// reaches Off cleanly; KS fallback cannot (F#/G# 2-band vel-select).
	setHarmonics(HARMONICS.OFF);
	setTremolo(TREMOLO.OFF);

	// D35 — Bow Polyphony hard default. setupComplex overrides to
	// MONO_POLY_RELEASE for gliss complexes.
	setBowPolyphony(BOW_POLY.DOUBLE_HOLD);

	log("reset");
}

// ================================================================
// UTILITIES
// ================================================================
function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
function rrand(lo, hi)    { return Math.floor(Math.random() * (hi - lo + 1)) + lo; }
function log(msg)         { outlet(1, "xk_swam: " + msg); }

// ================================================================
// INIT
// ================================================================
function loadbang() {
	log("v3 ready — SWAM KS model, complex table, envelopes, deadband, watchdog");
	startWatchdog();
}
