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
	TREMOLO:          79    // MIDI-Learn to Tremolo selector
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

function hasCC(ccNum) {
	if (ccNum === CC.BOW_SPEED)        return HAS_BOW_SPEED;
	if (ccNum === CC.ATTACK_RAMP)      return HAS_ATTACK_RAMP;
	if (ccNum === CC.ATTACK_CONTROL)   return HAS_ATTACK_CONTROL;
	if (ccNum === CC.BOW_PRESS_ACCENT) return HAS_BOW_PRESS_ACCENT;
	if (ccNum === CC.HARMONICS)        return HAS_HARMONICS_CC;
	if (ccNum === CC.TREMOLO)          return HAS_TREMOLO_CC;
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
	"p":   { expr: 20,  vel: 35,  bowMult: 0.70, density: 0.6 },
	"mp":  { expr: 38,  vel: 50,  bowMult: 0.85, density: 0.8 },
	"mf":  { expr: 55,  vel: 68,  bowMult: 1.00, density: 1.0 },
	"f":   { expr: 75,  vel: 85,  bowMult: 1.15, density: 1.2 },
	"ff":  { expr: 95,  vel: 100, bowMult: 1.30, density: 1.4 },
	"fff": { expr: 115, vel: 120, bowMult: 1.45, density: 1.7 }
};

// ================================================================
// COMPLEX TABLE — one record per complex type, single source of truth
// (D5). setupComplex(n) diffs each field against current state and only
// fires KS / writes CC on change.
// ================================================================
// harmonics: 0=OFF, 1=octave (+12), 2=oct+5th (+19), 3=4 Control
// tremolo:   0=OFF, 1=Slow,         2=Fast
var COMPLEX = {
	1: { playMode:"pizz", harmonics:HARMONICS.OFF, tremolo:TREMOLO.OFF,
	     exprEnv:{ attack:1.0, peak:1.0, sustain:0.4, release:0.0 },
	     vibrato:{ depth:0, rate:64 }, bowPos:null,
	     bowPressure:64, portamento:{ on:false, time:0 },
	     attackRamp:10, attackCtrl:110,
	     register:{ lo:36, hi:72 } },
	2: { playMode:"bow", harmonics:HARMONICS.OFF, tremolo:TREMOLO.OFF,
	     exprEnv:{ attack:0.6, peak:1.0, sustain:0.85, release:0.4 },
	     vibrato:{ depth:35, rate:50 }, bowPos:70,
	     bowPressure:70, portamento:{ on:false, time:0 },
	     attackRamp:40, attackCtrl:55,
	     register:{ lo:40, hi:64 } },
	3: { playMode:"bow", harmonics:HARMONICS.OFF, tremolo:TREMOLO.OFF,
	     exprEnv:{ attack:0.5, peak:1.1, sustain:0.9, release:0.6 },
	     vibrato:{ depth:60, rate:45 }, bowPos:110,
	     bowPressure:55, portamento:{ on:false, time:0 },
	     attackRamp:85, attackCtrl:30,
	     register:{ lo:36, hi:55 } },
	// C4: now actually fires Harmonics in v3.10 (KS F#, vel-select).
	// OCT (+1 octave) is the most musically usable — OCT_5TH is brittle
	// at the cello's high register.
	4: { playMode:"bow", harmonics:HARMONICS.OCT, tremolo:TREMOLO.OFF,
	     exprEnv:{ attack:0.7, peak:0.75, sustain:0.6, release:0.3 },
	     vibrato:{ depth:10, rate:60 }, bowPos:85,
	     bowPressure:30, portamento:{ on:false, time:0 },
	     attackRamp:30, attackCtrl:20,
	     register:{ lo:60, hi:84 } },
	5: { playMode:"bow", harmonics:HARMONICS.OFF, tremolo:TREMOLO.OFF,
	     exprEnv:{ attack:0.9, peak:1.1, sustain:0.7, release:0.3 },
	     vibrato:{ depth:25, rate:70 }, bowPos:55,
	     bowPressure:70, portamento:{ on:true, time:50 },
	     attackRamp:30, attackCtrl:90,
	     register:{ lo:36, hi:84 } },
	6: { playMode:"bow", harmonics:HARMONICS.OFF, tremolo:TREMOLO.OFF,
	     exprEnv:{ attack:0.7, peak:1.0, sustain:0.85, release:0.4 },
	     vibrato:{ depth:40, rate:50 }, bowPos:64,
	     bowPressure:70, portamento:{ on:true, time:80 },
	     attackRamp:50, attackCtrl:50,
	     register:{ lo:43, hi:67 } },
	7: { playMode:"bow", harmonics:HARMONICS.OFF, tremolo:TREMOLO.OFF,
	     exprEnv:{ attack:0.4, peak:1.05, sustain:0.9, release:0.7 },
	     vibrato:{ depth:55, rate:40 }, bowPos:115,
	     bowPressure:55, portamento:{ on:true, time:115 },
	     attackRamp:90, attackCtrl:25,
	     register:{ lo:36, hi:52 } },
	// C8: now actually fires Tremolo in v3.10 (KS G#, vel-select). FAST
	// is the spectral-aggressive ponticello character we want.
	8: { playMode:"bow", harmonics:HARMONICS.OFF, tremolo:TREMOLO.FAST,
	     exprEnv:{ attack:0.9, peak:1.15, sustain:1.0, release:0.3 },
	     vibrato:{ depth:15, rate:80 }, bowPos:5,
	     bowPressure:100, portamento:{ on:false, time:0 },
	     attackRamp:20, attackCtrl:100,
	     register:{ lo:60, hi:81 } }
};

// Regime → attack-ramp multiplier (single source per D7)
var REGIME_ATTACK_MULT = { contemplative:1.2, conversational:1.0, burst:0.5 };

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
	forceKS: false
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
// Callers that need a specific release character (fades, explicit releases)
// can still pass their own velocity.
function noteOff(pitch, vel) {
	pitch = clamp(pitch, 0, 127);
	if (vel == null) vel = state.noteOffVel;
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

function setTremolo(target) {
	if (state.tremolo === target) return;
	if (HAS_TREMOLO_CC) {
		ccForce(CC.TREMOLO, TREMOLO_CC_VAL[target]);
	} else {
		keyswitch(KS.TREMOLO, velForKS(KS.TREMOLO, target, 3));
	}
	state.tremolo = target;
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
function scheduleRelease(dur) {
	if (releaseTask) {
		releaseTask.cancel();
		releaseTask = null;
	}
	var ms = Math.max(dur * 1000, 200);
	releaseTask = new Task(function() {
		var fadeSteps = 5;
		var fadeTime = 80;
		var startExpr = ccCache[CC.EXPRESSION] || 0;

		function fadeStep(step) {
			if (step >= fadeSteps) {
				allNotesOff();
				releaseTask = null;
				return;
			}
			var ratio = 1.0 - (step + 1) / fadeSteps;
			ccForce(CC.EXPRESSION, Math.round(startExpr * ratio));
			var t = new Task(function() { fadeStep(step + 1); }, this);
			t.schedule(fadeTime);
			phraseTasks.push(t);
		}
		fadeStep(0);
	}, this);
	releaseTask.schedule(ms);
}

// ================================================================
// EXPRESSION ENVELOPE (D8)
// peak = INTENSITY.expr * pathScale; shape comes from complex.exprEnv.
// ================================================================
function scheduleExprEnvelope(peakExpr, env, durMs) {
	// Attack: first write immediately
	ccForce(CC.EXPRESSION, Math.round(peakExpr * env.attack));

	// Peak at ~25% of duration
	var peakAt = Math.max(60, Math.round(durMs * 0.25));
	scheduleAt(peakAt, function() {
		ccForce(CC.EXPRESSION, Math.round(peakExpr * env.peak));
	});

	// Sustain level at 70%
	var sustainAt = Math.max(peakAt + 40, Math.round(durMs * 0.70));
	scheduleAt(sustainAt, function() {
		ccForce(CC.EXPRESSION, Math.round(peakExpr * env.sustain));
	});
	// Release is handled by scheduleRelease()'s fade.
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
	setHarmonics(cmx.harmonics);
	setTremolo(cmx.tremolo);

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
	if (s.length === 0) return foldToRange(36 + state.transpose, lo, hi);

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
	return foldToRange(pitch + state.transpose, lo, hi);
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

// C2: bowed legato run — 2–4 notes (burst regime + fff goes wider)
function phraseC2(vel, dur) {
	var hi = state.regime === "burst" ? 5 : 4;
	var count = phraseCount(2, hi);
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

// C3: sustained — 1 main legato note, optional soft grace notes on f+
function phraseC3(vel, dur) {
	var graceCount = intensityDensity() >= 1.15 ? rrand(1, 2) : 0;
	var graceSpacing = 120;
	for (var i = 0; i < graceCount; i++) {
		(function(idx) {
			scheduleAt(idx * graceSpacing + humanDelay(), function() {
				legatoNote(humanPitch(pickPitch(3)), Math.max(30, humanVel(vel) - 20));
			});
		})(i);
	}
	scheduleAt(graceCount * graceSpacing, function() {
		legatoNote(humanPitch(pickPitch(3)), humanVel(vel));
	});
	scheduleRelease(dur * 1.5);
}

// C4: harmonics cloud — 2–5 airy flageolet touches across duration
function phraseC4(vel, dur) {
	var count = phraseCount(2, 5);
	var spread = Math.max(300, dur * 1000);
	for (var i = 0; i < count; i++) {
		(function(idx) {
			var delay = idx === 0 ? 0 : Math.round((idx / count) * spread) + humanDelay();
			scheduleAt(delay, function() {
				var p = humanPitch(pickPitch(4));
				var v = clamp(humanVel(vel) - 15, 25, 100);
				noteOn(p, v);
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

// C5: wild gliss — 2 notes ≥5 semis apart; fff adds compound gliss points
function phraseC5(vel, dur) {
	var segments = intensityDensity() >= 1.3 ? rrand(2, 3) : 1;
	var lastPitch = pickPitch(5);
	legatoNote(humanPitch(lastPitch), humanVel(vel));
	for (var i = 0; i < segments; i++) {
		(function(idx) {
			var t = Math.round((idx + 1) / (segments + 1) * dur * 1000 * 0.8);
			scheduleAt(t, function() {
				var p = pickPitch(5);
				var attempts = 0;
				while (Math.abs(p - lastPitch) < 5 && attempts < 10) { p = pickPitch(5); attempts++; }
				legatoNote(humanPitch(p), humanVel(vel));
				lastPitch = p;
			});
		})(i);
	}
	scheduleRelease(dur * 1.4);
}

// C6: ordered stepwise walk — 3–6 notes along the sieve with portamento
function phraseC6(vel, dur) {
	var count = phraseCount(3, 6);
	var spacing = Math.max(100, Math.round(dur * 1000 / (count + 1)));
	for (var i = 0; i < count; i++) {
		(function(idx) {
			scheduleAt(idx * spacing + humanDelay(), function() {
				legatoNote(humanPitch(pickPitch(6)), humanVel(vel));
			});
		})(i);
	}
	scheduleRelease(dur * 1.2);
}

// C7: sustained + multiple micro-drifts — deep breath-like floating
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
				legatoNote(p2, Math.max(30, humanVel(vel) - 10));
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
function handleVoice(vtxIdx, complexType, density, intensity, duration) {
	if (state.frozen) return;

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

	// Path V2 scales peak Expression by 0.7 (Xenakis V2 = softer palette)
	var pathScale = (state.path === "V2") ? 0.7 : 1.0;
	state.peakExpr = clamp(intMap.expr * pathScale, 0, 127);

	// Intensity-driven bow pressure: fff digs, p lightens. Rebases the
	// deviation modulation in handleExprDev too (via state.bowPressureBase).
	var bowBase = clamp(cmx.bowPressure * intMap.bowMult, 0, 127);
	state.bowPressureBase = bowBase;
	ccForce(CC.BOW_PRESSURE, Math.round(bowBase));

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

	// Schedule expression envelope for the phrase duration
	scheduleExprEnvelope(state.peakExpr, cmx.exprEnv, Math.max(duration * 1000, 250));

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
			state.frozen = !state.frozen;
			// Phase 6: sordino colors the freeze — muted, veiled sustain.
			// v3.10 removed Sordino from the KS plane; drive via MIDI-Learned
			// CC (default 68) so the preset routes it to the GUI Sordino
			// toggle. Paired with the sustain pedal so held notes keep
			// sounding under the mute.
			state.sordinoOn = state.frozen;
			if (state.frozen) {
				ccForce(CC.SUSTAIN_PEDAL, 127);
				ccForce(CC.SORDINO, 127);
				log("FROZEN (sordino on)");
			} else {
				ccForce(CC.SUSTAIN_PEDAL, 0);
				ccForce(CC.SORDINO, 0);
				allNotesOff();
				log("UNFROZEN (sordino off)");
			}
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
			// Detection stub — audio effect TBD (see revision_roadmap.md D19).
			log("niklas detected (effect TBD)");
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
