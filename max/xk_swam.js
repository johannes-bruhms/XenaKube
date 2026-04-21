// ================================================================
// xk_swam.js — XenaKube → SWAM Cello 3 MIDI bridge (v4 — instance pool)
//
// Receives /xk/* OSC from relay.js (port 57121) and outputs midievent
// messages to N parallel [vst~ SWAM Cello] instances, each hosted inside
// a poly~ voice for multi-threaded DSP. Each voice event allocates one
// instance from the pool, the full gesture (envelope + phrase + release)
// renders inside that instance, and the instance returns to the pool when
// the fade completes. Overlapping turns stack as overlapping SWAM voices
// — a fast sexy-move can layer ~4 independent cello materials without
// voice-stealing any single instance's KS/CC state.
//
// v4 (D40, 2026-04-20) — instance pool refactor:
//   • POOL_SIZE MIDI outlets (one per instance); debug outlet moves to
//     index POOL_SIZE.
//   • Per-instance state: selector cache (playMode/harmonics/tremolo/
//     bowPoly/gestureMode), ccCache, activeNotes, phraseTasks,
//     releaseTask, ccRampTasks, ksPending, voice-shot snapshots
//     (intensity/density/duration/path/transpose/face*).
//   • Global state: sieve walker, regime, live gyro (tilt/spin/dev/
//     scramble), face mapping. Continuous CC handlers iterate active
//     instances so cube orientation shapes every sounding voice.
//   • Sieve walker stays shared — Xenakian pitch-set coherence across
//     overlapping voices.
//   • Spells currently route through instance 0 (TODO: per-spell
//     allocation).
//
// v3 refactor history (all still valid per-instance): D17 panic watchdog,
// D1/D2/D12/D27 SWAM KS model + diffing, D5/D7 COMPLEX table, D4/D8/D33
// per-complex expression envelope slewed via rampCC, D18 60 Hz CC
// deadband, D28 KS sync guard, D29 interleave guard, D31 Harmonics/
// Tremolo via CC 78/79, D32/D39 tremolo-rate stochastic envelope, D34
// low-vel gliss overlap, D35 per-complex Bow Polyphony, D37 C4 harmonic
// rotation.
//
// Prerequisite: each SWAM instance configured to the same preset (see
// docs/swam_cello_reference.md). poly~ subpatch uses polymidiin +
// midiparse (midievent outlet) — NOT regular [in].
// ================================================================

autowatch = 1;
inlets = 1;

// Pool size — each instance is one SWAM Cello VST. Max outlets count is
// fixed at load; resize by editing this constant and saving.
var POOL_SIZE = 8;
outlets = POOL_SIZE + 1;  // 0..POOL_SIZE-1 → midievent; POOL_SIZE → debug
var DEBUG_OUTLET = POOL_SIZE;

// ================================================================
// CONFIG — must match SWAM preset
// ================================================================

var MIDI_CH = 1;
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
	EXPRESSION:       11,
	VIBRATO_DEPTH:     1,
	VIBRATO_RATE:     19,
	PORTAMENTO_TIME:   5,
	PORTAMENTO_ON:    65,
	SUSTAIN_PEDAL:    64,
	BOW_POSITION:     16,
	BOW_PRESSURE:     17,
	BOW_PRESS_ACCENT: 18,
	BOW_SPEED:        20,
	ATTACK_RAMP:      73,
	ATTACK_CONTROL:   75,
	SORDINO:          68,
	HARMONICS:        78,
	TREMOLO:          79,
	TREMOLO_RATE:     80,
	BOW_POLYPHONY:    81
};

// Feature flags — see v3 docs for semantics.
var HAS_BOW_SPEED        = false;
var HAS_ATTACK_RAMP      = false;
var HAS_ATTACK_CONTROL   = false;
var HAS_BOW_PRESS_ACCENT = true;
var HAS_HARMONICS_CC     = true;
var HAS_TREMOLO_CC       = true;
var HAS_TREMOLO_RATE     = true;
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
// D31 — Harmonics / Tremolo CC value maps (band centers)
// ================================================================
var HARMONICS_CC_VAL = {};
HARMONICS_CC_VAL[0] = 16;    // OFF
HARMONICS_CC_VAL[1] = 48;    // OCT
HARMONICS_CC_VAL[2] = 80;    // OCT_5TH
HARMONICS_CC_VAL[3] = 112;   // CTRL

var TREMOLO_CC_VAL = {};
TREMOLO_CC_VAL[0] = 21;      // OFF
TREMOLO_CC_VAL[1] = 64;      // SLOW
TREMOLO_CC_VAL[2] = 106;     // FAST

var BOW_POLY = { MONO_STRING_CROSSING:0, MONO_POLY_RELEASE:1, DOUBLE:2, DOUBLE_HOLD:3, AUTO:4 };
var BOW_POLY_CC_VAL = {};
BOW_POLY_CC_VAL[0] = 12;
BOW_POLY_CC_VAL[1] = 38;
BOW_POLY_CC_VAL[2] = 64;
BOW_POLY_CC_VAL[3] = 89;
BOW_POLY_CC_VAL[4] = 115;

// ================================================================
// KEY SWITCHES — SWAM Cello 3 v3.10+ (KS Octave = C0, KS_CH)
// ================================================================
var KS = {
	PLAY_MODE:     24,
	MANUAL_BOWING: 25,
	GESTURE_MODE:  26,
	ALT_FINGERING: 27,
	BOW_LIFT:      28,
	BOW_START:     29,
	HARMONICS:     30,
	KEEP_BOW_DIR:  31,
	TREMOLO:       32,
	TREMOLO_MODE:  33,
	PAGE_MOD:      35
};
var KS_HOLD_MS = 50;

function velForOption(idx, optionCount) {
	var band = 127 / optionCount;
	return clamp(Math.round(band * (idx + 0.5)), 1, 127);
}

var KS_VEL_OVERRIDE = {};
KS_VEL_OVERRIDE[26] = [21, 64, 106];        // KS D  Gesture Mode (3)
KS_VEL_OVERRIDE[30] = [16, 48, 80, 112];    // KS F# Harmonics    (4)
KS_VEL_OVERRIDE[32] = [21, 64, 106];        // KS G# Tremolo      (3)

function velForKS(ks, idx, optionCount) {
	var tbl = KS_VEL_OVERRIDE[ks];
	if (tbl && tbl[idx] != null) return tbl[idx];
	return velForOption(idx, optionCount);
}

var HARMONICS = { OFF:0, OCT:1, OCT_5TH:2, CTRL:3 };
var TREMOLO   = { OFF:0, SLOW:1, FAST:2 };
var GESTURE   = { EXPR:0, BIPOLAR:1, BOWING:2 };

var KS_VEL = { LOW: 40, MID: 80, HIGH: 110 };
var PLAY_MODE_VEL = { bow: KS_VEL.LOW, pizz: KS_VEL.MID, col: KS_VEL.HIGH };

// ================================================================
// INTENSITY MAP — per-intensity Expression peak, velocity, bow mult,
// density scalar, tremolo-rate scalar.
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
// COMPLEX TABLE — single source of truth per voice
// ================================================================
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
	4: { playMode:"bow", harmonics:HARMONICS.OCT, tremolo:TREMOLO.OFF,
	     exprEnv:{ attack:0.7, peak:0.75, sustain:0.6, release:0.3,
	               attackRampMs:30, sustainRampMs:90,  releaseRampMs:120 },
	     vibrato:{ depth:10, rate:60 }, bowPos:85,
	     bowPressure:30, portamento:{ on:false, time:0 },
	     attackRamp:30, attackCtrl:20, tremoloRate:55,
	     bowPoly:BOW_POLY.DOUBLE_HOLD,
	     register:{ lo:60, hi:84 } },
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
	8: { playMode:"bow", harmonics:HARMONICS.OFF, tremolo:TREMOLO.FAST,
	     exprEnv:{ attack:0.9, peak:1.15, sustain:1.0, release:0.3,
	               attackRampMs:20, sustainRampMs:80,  releaseRampMs:100 },
	     vibrato:{ depth:15, rate:80 }, bowPos:5,
	     bowPressure:100, portamento:{ on:false, time:0 },
	     attackRamp:20, attackCtrl:100, tremoloRate:95,
	     bowPoly:BOW_POLY.DOUBLE_HOLD,
	     register:{ lo:60, hi:81 } }
};

var REGIME_ATTACK_MULT    = { contemplative:1.2, conversational:1.0, burst:0.5 };
var REGIME_EXPR_RAMP_MULT = { contemplative:1.5, conversational:1.0, burst:0.4 };

var LEGATO_COMPLEX = { 2:true, 3:true, 5:true, 6:true, 7:true };

// ================================================================
// STATE — global (shared across instances)
// ================================================================
// Sieve walker, regime/path/tetra, live gyro, face mapping. Each field
// here is either (a) a property of the piece rather than a single voice
// (sieve position, regime), (b) a physical input broadcast to every
// sounding voice (tilt/spin/dev/scramble), or (c) an incoming-turn
// snapshot captured onto the instance at handleVoice allocation time
// (face*, path/transpose, intensity) and then read from the instance.
// ================================================================
var state = {
	sieve: [36, 37, 39, 41, 43, 44, 48],
	sieveIdx: 0,
	sieveDir: 1,
	path: "V1",
	transpose: 0,
	tetra: 0,
	regime: "contemplative",
	frozen: false,
	scramble: 0,

	intensity: "mf",            // last incoming intensity label (for log only)
	density: 2.0,               // last incoming density
	duration: 1.0,              // last incoming duration (pre-face scale)

	turnCount: 0,
	lastTurnTime: 0,
	lastVoiceTime: 0,           // for panic watchdog (any instance)

	// Continuous expression inputs
	tilt: 0.5,
	spin: 0,
	spinEMA: 0,
	dev: 0,
	devEMA: 0,
	spinLowSince: 0,
	frame60: 0,

	// Scramble → Bow Position hysteresis bias
	scrambleBowBias: 0,
	tastoSince: 0,
	pontSince: 0,
	sordinoOn: false,

	// Turn rate → default note-off velocity
	turnRate: 0,
	noteOffVel: 64,

	// Face — set by handleFace, snapshotted onto the instance at
	// handleVoice allocation so later face messages don't retroactively
	// reshape an in-flight phrase.
	face: null,
	faceDurationBias: 1.0,
	faceTranspose: 0,
	faceEnvelope: null,
	faceArticulation: null,
	faceMotion: null,
	faceEnvProfile: null,
	faceOffVelOverride: null,
	faceReleaseMult: 1.0,

	// Spell / last-voice routing
	lastAllocatedInstance: 0
};

// ================================================================
// INSTANCE POOL
// ================================================================
// Each instance is one SWAM Cello VST hosted in poly~. MIDI goes to its
// own outlet; all per-voice caches, scheduled tasks, selector state, and
// voice-shot snapshots live on the instance record. Phrase generators
// and selector helpers take `inst` as first argument and write to
// inst.outlet.
//
// Status lifecycle:
//   IDLE       — available for allocation
//   PLAYING    — phrase is generating notes, expression peaked/sustaining
//   RELEASING  — scheduleRelease fired, CC 11 slewing to 0, notes about
//                to be flushed; still in pool but lowest-priority-to-steal
//
// Voice stealing picks (in order): IDLE → oldest RELEASING → oldest
// PLAYING. Since phrases are ~0.5–30 s and a fast sexy-move is 4 turns
// in ~400 ms, a pool of 8 comfortably handles overlap without stealing
// for expected gesture rates. Burst regime + long C7 breath phrases can
// still exhaust the pool, at which point the oldest in-flight phrase
// yields.
// ================================================================
function makeInstance(id) {
	return {
		id: id,
		outlet: id,                  // direct mapping; outlet 0..POOL_SIZE-1
		status: 'IDLE',              // IDLE | PLAYING | RELEASING

		// Selector state (diff targets for D1/D12/D27/D35 setEnum/set*)
		activeComplex: 0,
		playMode: null,
		harmonics: HARMONICS.OFF,
		tremolo: TREMOLO.OFF,
		bowPoly: null,
		gestureMode: GESTURE.EXPR,
		altFing: 0,
		keepBowDir: false,

		// MIDI caches / scheduling
		ccCache: {},
		ccRampTasks: {},
		activeNotes: [],
		phraseTasks: [],
		releaseTask: null,
		ksPending: {},

		// Voice-shot snapshots (captured at handleVoice onset)
		intensity: "mf",
		density: 2.0,
		duration: 1.0,
		path: "V1",
		transpose: 0,
		tetra: 0,
		faceDurationBias: 1.0,
		faceTranspose: 0,
		faceEnvProfile: null,
		faceOffVelOverride: null,
		faceReleaseMult: 1.0,

		// Expression targets
		baseExpr: 0,
		peakExpr: 0,
		bowPressureBase: 64,

		// KS sync guard
		ksForceCount: 0,
		forceKS: false,

		// Bookkeeping
		allocatedAt: 0,
		lastVoiceTime: 0
	};
}
var instances = [];
(function initPool() {
	for (var i = 0; i < POOL_SIZE; i++) instances.push(makeInstance(i));
})();

var watchdogTask = null;

function allocateInstance() {
	var now = Date.now();
	var i;
	// Prefer IDLE
	for (i = 0; i < POOL_SIZE; i++) {
		if (instances[i].status === 'IDLE') {
			instances[i].allocatedAt = now;
			return instances[i];
		}
	}
	// Steal oldest RELEASING next — its notes are already fading
	var oldestRel = null;
	for (i = 0; i < POOL_SIZE; i++) {
		if (instances[i].status === 'RELEASING') {
			if (!oldestRel || instances[i].allocatedAt < oldestRel.allocatedAt) oldestRel = instances[i];
		}
	}
	if (oldestRel) { stealInstance(oldestRel, now); return oldestRel; }
	// Fallback: steal oldest PLAYING (classic voice stealing)
	var oldestPlay = null;
	for (i = 0; i < POOL_SIZE; i++) {
		if (instances[i].status === 'PLAYING') {
			if (!oldestPlay || instances[i].allocatedAt < oldestPlay.allocatedAt) oldestPlay = instances[i];
		}
	}
	if (!oldestPlay) oldestPlay = instances[0];  // belt-and-suspenders
	stealInstance(oldestPlay, now);
	return oldestPlay;
}

function stealInstance(inst, now) {
	cancelPhrase(inst, false);
	if (inst.releaseTask) { inst.releaseTask.cancel(); inst.releaseTask = null; }
	allNotesOff(inst);
	inst.status = 'IDLE';
	inst.allocatedAt = now || Date.now();
	log("steal inst " + inst.id);
}

// ================================================================
// MIDI OUTPUT (per-instance)
// ================================================================
function statusNoteOn(ch)  { return 0x90 + (ch - 1); }
function statusNoteOff(ch) { return 0x80 + (ch - 1); }
function statusCC(ch)      { return 0xB0 + (ch - 1); }

function noteOn(inst, pitch, vel) {
	pitch = clamp(pitch, 0, 127);
	vel = clamp(vel, 1, 127);
	outlet(inst.outlet, "midievent", statusNoteOn(MIDI_CH), pitch, vel);
}

// Phase 8: velocity default = state.noteOffVel (turn-rate driven).
// Phase A1: inst.faceOffVelOverride (articulation) beats turn-rate when set.
function noteOff(inst, pitch, vel) {
	pitch = clamp(pitch, 0, 127);
	if (vel == null) {
		vel = (inst.faceOffVelOverride != null) ? inst.faceOffVelOverride : state.noteOffVel;
	}
	vel = clamp(Math.round(vel), 0, 127);
	outlet(inst.outlet, "midievent", statusNoteOff(MIDI_CH), pitch, vel);
}

// Continuous CC — per-instance cache-suppressed. Use for 60 Hz streams.
function cc(inst, num, val) {
	if (!hasCC(num)) return;
	val = clamp(Math.round(val), 0, 127);
	if (inst.ccCache[num] === val) return;
	inst.ccCache[num] = val;
	outlet(inst.outlet, "midievent", statusCC(MIDI_CH), num, val);
}

// Forced CC — always writes, updates cache.
function ccForce(inst, num, val) {
	if (!hasCC(num)) return;
	val = clamp(Math.round(val), 0, 127);
	inst.ccCache[num] = val;
	outlet(inst.outlet, "midievent", statusCC(MIDI_CH), num, val);
}

// ================================================================
// CC SLEW LIMITER (D33) — per-instance
// ================================================================
function cancelCCRamp(inst, num) {
	var tasks = inst.ccRampTasks[num];
	if (!tasks) return;
	for (var i = 0; i < tasks.length; i++) tasks[i].cancel();
	inst.ccRampTasks[num] = null;
}

function rampCC(inst, num, target, durMs) {
	cancelCCRamp(inst, num);
	if (!hasCC(num)) return;
	target = clamp(Math.round(target), 0, 127);
	var start = inst.ccCache[num];
	if (start == null) start = 0;
	if (durMs <= 0 || start === target) { ccForce(inst, num, target); return; }

	var tickMs = 15;
	var steps  = Math.max(1, Math.round(durMs / tickMs));
	var tasks  = [];
	for (var i = 1; i <= steps; i++) {
		(function(step) {
			var v = start + (target - start) * (step / steps);
			var t = new Task(function() { ccForce(inst, num, v); }, this);
			t.schedule(step * tickMs);
			tasks.push(t);
		})(i);
	}
	inst.ccRampTasks[num] = tasks;
}

// ================================================================
// KEY SWITCH (D29 interleave guard, per-instance)
// ================================================================
function keyswitch(inst, note, vel, channel) {
	var ch = channel || KS_CH;
	var v = vel || KS_VEL.HIGH;

	var prev = inst.ksPending[note];
	if (prev) {
		prev.task.cancel();
		outlet(inst.outlet, "midievent", statusNoteOff(prev.ch || ch), note, v);
		inst.ksPending[note] = null;
	}

	outlet(inst.outlet, "midievent", statusNoteOn(ch), note, v);
	var ks = note;
	var kch = ch;
	var kv = v;
	var t = new Task(function() {
		outlet(inst.outlet, "midievent", statusNoteOff(kch), ks, kv);
		if (inst.ksPending[ks] && inst.ksPending[ks].task === t) inst.ksPending[ks] = null;
	}, this);
	t.schedule(KS_HOLD_MS);
	inst.ksPending[note] = { task: t, ch: kch, vel: kv };
}

// ================================================================
// SELECTOR PRIMITIVES — stateful diffing per-instance
// ================================================================
function setPlayMode(inst, target) {
	if (!inst.forceKS && inst.playMode === target) return;
	var vel = PLAY_MODE_VEL[target];
	if (vel == null) return;
	keyswitch(inst, KS.PLAY_MODE, vel);
	inst.playMode = target;
}

function setHarmonics(inst, target) {
	if (inst.harmonics === target) return;
	if (HAS_HARMONICS_CC) {
		ccForce(inst, CC.HARMONICS, HARMONICS_CC_VAL[target]);
	} else {
		keyswitch(inst, KS.HARMONICS, velForKS(KS.HARMONICS, target, 4));
	}
	inst.harmonics = target;
}

// D37 — per-voice C4 harmonic-mode rotation. Reads snapshot path/tetra
// off the instance so an older C4 voice keeps its own axis assignment
// even if the global cube state has moved since.
function harmonicsForC4(inst) {
	if (inst.path === "V1") {
		return inst.tetra === 1 ? HARMONICS.OCT_5TH : HARMONICS.OCT;
	}
	return inst.tetra === 1 ? HARMONICS.CTRL : HARMONICS.OCT_5TH;
}

function setTremolo(inst, target) {
	if (inst.tremolo === target) return;
	if (HAS_TREMOLO_CC) {
		ccForce(inst, CC.TREMOLO, TREMOLO_CC_VAL[target]);
	} else {
		keyswitch(inst, KS.TREMOLO, velForKS(KS.TREMOLO, target, 3));
	}
	inst.tremolo = target;
}

function setBowPolyphony(inst, target) {
	if (inst.bowPoly === target) return;
	if (HAS_BOW_POLY_CC) {
		ccForce(inst, CC.BOW_POLYPHONY, BOW_POLY_CC_VAL[target]);
	}
	inst.bowPoly = target;
}

function setEnum(inst, field, ks, target, optionCount) {
	if (!inst.forceKS && inst[field] === target) return;
	keyswitch(inst, ks, velForKS(ks, target, optionCount));
	inst[field] = target;
}

// ================================================================
// SCHEDULING (per-instance)
// ================================================================
function scheduleAt(inst, ms, fn) {
	var t = new Task(fn, this);
	t.schedule(ms);
	inst.phraseTasks.push(t);
	return t;
}

function allNotesOff(inst) {
	for (var i = 0; i < inst.activeNotes.length; i++) {
		noteOff(inst, inst.activeNotes[i]);
	}
	inst.activeNotes = [];
}

// Preserves the most recent note when `preserveLegatoTail` is true so
// the next phrase's first legatoNote overlap triggers SWAM portamento.
function cancelPhrase(inst, preserveLegatoTail) {
	for (var i = 0; i < inst.phraseTasks.length; i++) {
		inst.phraseTasks[i].cancel();
	}
	inst.phraseTasks = [];

	cancelCCRamp(inst, CC.EXPRESSION);

	if (preserveLegatoTail && inst.activeNotes.length > 0) {
		var tail = inst.activeNotes[inst.activeNotes.length - 1];
		for (var j = 0; j < inst.activeNotes.length - 1; j++) {
			noteOff(inst, inst.activeNotes[j]);
		}
		inst.activeNotes = [tail];
	} else {
		allNotesOff(inst);
	}
}

function scheduleRelease(inst, dur) {
	if (inst.releaseTask) { inst.releaseTask.cancel(); inst.releaseTask = null; }
	var ms = Math.max(dur * 1000, 200);
	inst.releaseTask = new Task(function() {
		var cmx = COMPLEX[inst.activeComplex];
		var rampMs = (cmx && cmx.exprEnv && cmx.exprEnv.releaseRampMs) || 120;
		var rm = REGIME_EXPR_RAMP_MULT[state.regime] || 1.0;
		var faceRm = inst.faceReleaseMult || 1.0;
		var fadeMs = Math.max(20, Math.round(rampMs * rm * faceRm));

		inst.status = 'RELEASING';
		rampCC(inst, CC.EXPRESSION, 0, fadeMs);
		var offT = new Task(function() {
			allNotesOff(inst);
			inst.releaseTask = null;
			inst.status = 'IDLE';
		}, this);
		offT.schedule(fadeMs + 20);
		inst.phraseTasks.push(offT);
	}, this);
	inst.releaseTask.schedule(ms);
}

// ================================================================
// EXPRESSION ENVELOPE (per-instance)
// ================================================================
function scheduleExprEnvelope(inst, peakExpr, env, durMs) {
	var rm = REGIME_EXPR_RAMP_MULT[state.regime] || 1.0;
	var aMs = (env.attackRampMs  != null ? env.attackRampMs  : 40) * rm;
	var sMs = (env.sustainRampMs != null ? env.sustainRampMs : 120) * rm;

	rampCC(inst, CC.EXPRESSION, Math.round(peakExpr * env.attack), aMs);

	var peakAt = Math.max(60, Math.round(durMs * 0.25));
	scheduleAt(inst, peakAt, function() {
		rampCC(inst, CC.EXPRESSION, Math.round(peakExpr * env.peak), sMs);
	});

	var sustainAt = Math.max(peakAt + 40, Math.round(durMs * 0.70));
	scheduleAt(inst, sustainAt, function() {
		rampCC(inst, CC.EXPRESSION, Math.round(peakExpr * env.sustain), sMs);
	});
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
// COMPLEX SETUP (per-instance) — diff-fires every field
// ================================================================
function setupComplex(inst, complexType) {
	var cmx = COMPLEX[complexType];
	if (!cmx) return;
	inst.activeComplex = complexType;
	log("inst " + inst.id + " complex -> C" + complexType);

	setPlayMode(inst, cmx.playMode);

	var harmTarget = (complexType === 4) ? harmonicsForC4(inst) : cmx.harmonics;
	setHarmonics(inst, harmTarget);
	setTremolo(inst, cmx.tremolo);

	if (cmx.bowPoly != null) setBowPolyphony(inst, cmx.bowPoly);

	if (cmx.tremoloRate != null && cmx.tremolo !== TREMOLO.OFF) {
		ccForce(inst, CC.TREMOLO_RATE, cmx.tremoloRate);
	}

	if (cmx.bowPos != null) ccForce(inst, CC.BOW_POSITION, cmx.bowPos);
	inst.bowPressureBase = cmx.bowPressure;
	ccForce(inst, CC.BOW_PRESSURE, cmx.bowPressure);

	ccForce(inst, CC.PORTAMENTO_ON,   cmx.portamento.on ? 127 : 0);
	ccForce(inst, CC.PORTAMENTO_TIME, cmx.portamento.time);

	var mult = REGIME_ATTACK_MULT[state.regime] || 1.0;
	ccForce(inst, CC.ATTACK_RAMP,    clamp(Math.round(cmx.attackRamp * mult), 0, 127));
	ccForce(inst, CC.ATTACK_CONTROL, cmx.attackCtrl);

	ccForce(inst, CC.VIBRATO_RATE, cmx.vibrato.rate);
	ccForce(inst, CC.VIBRATO_DEPTH, vibDepthForComplex(cmx));

	// Sieve walker is global (shared); not reset per-complex change —
	// multi-instance would otherwise have one instance's C2/C6 reset
	// mid-phrase in another instance. commitSieveWalk handles boundary
	// flipping cleanly without needing resets.
}

// ================================================================
// PITCH SELECTION (per-voice, reads inst's voice-shot snapshot)
// ================================================================
function pickPitch(complexType, inst) {
	var s = state.sieve;
	var cmx = COMPLEX[complexType];
	var reg = cmx && cmx.register;
	var lo, hi;
	var path = inst ? inst.path : state.path;
	var transpose = inst ? inst.transpose : state.transpose;
	var faceTr = inst ? inst.faceTranspose : (state.faceTranspose || 0);
	if (reg) {
		var shift = (path === "V2") ? -12 : 0;
		lo = Math.max(24, reg.lo + shift);
		hi = Math.min(CELLO_MAX, reg.hi);
	}
	if (s.length === 0) return foldToRange(36 + transpose + faceTr, lo, hi);

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
	return foldToRange(pitch + transpose + faceTr, lo, hi);
}

function foldToRange(pitch, lo, hi) {
	if (lo == null) lo = (state.path === "V2") ? 24 : CELLO_MIN;
	if (hi == null) hi = CELLO_MAX;
	while (pitch < lo) pitch += 12;
	while (pitch > hi) pitch -= 12;
	return clamp(pitch, lo, hi);
}

// ================================================================
// LEGATO / GLISS (per-instance)
// ================================================================
function legatoNote(inst, pitch, vel) {
	var oldNotes = inst.activeNotes.slice();
	noteOn(inst, pitch, vel);
	inst.activeNotes.push(pitch);

	if (oldNotes.length > 0) {
		scheduleAt(inst, 20, function() {
			for (var i = 0; i < oldNotes.length; i++) {
				noteOff(inst, oldNotes[i]);
				var idx = inst.activeNotes.indexOf(oldNotes[i]);
				if (idx >= 0) inst.activeNotes.splice(idx, 1);
			}
		});
	}
}

var GLISS_VEL = 18;
function glissNote(inst, pitch) {
	legatoNote(inst, pitch, GLISS_VEL);
}

// ================================================================
// PHRASE HELPERS
// ================================================================
function phraseCount(inst, baseLo, baseHi) {
	var intMap = INTENSITY_MAP[inst.intensity] || INTENSITY_MAP["mf"];
	var iMult = intMap.density;
	var dMult = clamp(0.6 + inst.density * 0.25, 0.6, 1.8);
	var lo = Math.max(1, Math.round(baseLo * iMult));
	var hi = Math.max(lo, Math.round(baseHi * iMult * dMult));
	return rrand(lo, hi);
}

function intensityDensity(inst) {
	var intMap = INTENSITY_MAP[inst.intensity] || INTENSITY_MAP["mf"];
	return intMap.density;
}

// Commit the shared sieve walker to one direction for a phrase of `count`
// notes (used by C2 / C6). Prevents mid-phrase direction flips at
// boundaries so each phrase reads unambiguously ascending or descending.
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

// ================================================================
// PHRASE GENERATORS (per-instance)
// ================================================================

// C1: Pizzicato cloud — short plucked notes, no legato
function phraseC1(inst, vel, dur) {
	var count = phraseCount(inst, 2, 5);
	var spread = Math.min(dur * 1000, 700);

	for (var i = 0; i < count; i++) {
		(function(idx) {
			var delay = idx === 0 ? 0 : rrand(20, Math.round(spread));
			scheduleAt(inst, delay, function() {
				var p = humanPitch(pickPitch(1, inst));
				var v = humanVel(vel);
				noteOn(inst, p, v);
				inst.activeNotes.push(p);
				scheduleAt(inst, rrand(60, 220), function() {
					noteOff(inst, p);
					var pidx = inst.activeNotes.indexOf(p);
					if (pidx >= 0) inst.activeNotes.splice(pidx, 1);
				});
			});
		})(i);
	}
	scheduleRelease(inst, dur);
}

// C2: OrderedCloudAscDesc — bowed legato cloud along committed direction
function phraseC2(inst, vel, dur) {
	var hi = state.regime === "burst" ? 6 : 5;
	var count = Math.max(3, phraseCount(inst, 3, hi));
	commitSieveWalk(count);
	var spacing = Math.max(90, Math.round(dur * 1000 / (count + 1)));
	for (var i = 0; i < count; i++) {
		(function(idx) {
			scheduleAt(inst, idx * spacing + humanDelay(), function() {
				legatoNote(inst, humanPitch(pickPitch(2, inst)), humanVel(vel));
			});
		})(i);
	}
	scheduleRelease(inst, dur * 1.2);
}

// C3: OrderedCloudFlat — legato rebows hovering at constant register
function phraseC3(inst, vel, dur) {
	var count = phraseCount(inst, 3, 5);
	var durMs = Math.max(400, dur * 1000);
	var spacing = Math.max(110, Math.round(durMs / (count + 1)));
	var center = pickPitch(3, inst);
	for (var i = 0; i < count; i++) {
		(function(idx) {
			scheduleAt(inst, idx * spacing + humanDelay(), function() {
				var jitter = (Math.random() < 0.5) ? 0 : (Math.random() < 0.5 ? -1 : 1);
				var p = clamp(center + jitter, CELLO_MIN, CELLO_MAX);
				legatoNote(inst, humanPitch(p), humanVel(vel));
			});
		})(i);
	}
	scheduleRelease(inst, dur * 1.3);
}

// C4: IonizedAtom — harmonic attacks clustered near central pitch with
// random-timed arrival across the phrase ("atom + ionized timing")
function phraseC4(inst, vel, dur) {
	var count = phraseCount(inst, 2, 5);
	var spread = Math.max(300, dur * 1000);
	var s = state.sieve;
	var cmx = COMPLEX[4];
	var base = (s.length > 0) ? s[Math.floor(s.length / 2)] : 60;
	var faceTr = inst.faceTranspose || 0;
	var loReg = Math.max(24, cmx.register.lo + (inst.path === "V2" ? -12 : 0));
	var hiReg = Math.min(CELLO_MAX, cmx.register.hi);
	for (var i = 0; i < count; i++) {
		(function(idx) {
			var delay = idx === 0 ? 0 : rrand(40, Math.round(spread));
			scheduleAt(inst, delay, function() {
				var jitter = rrand(-2, 2);
				var p = foldToRange(base + inst.transpose + faceTr + jitter, loReg, hiReg);
				var v = clamp(humanVel(vel) - 15, 25, 100);
				noteOn(inst, humanPitch(p), v);
				inst.activeNotes.push(p);
				scheduleAt(inst, rrand(180, 400), function() {
					noteOff(inst, p);
					var pidx = inst.activeNotes.indexOf(p);
					if (pidx >= 0) inst.activeNotes.splice(pidx, 1);
				});
			});
		})(i);
	}
	scheduleRelease(inst, dur);
}

// C5: wild gliss — dense salvo of ≥8-semi leaps, low-vel overlap = SWAM slide
function phraseC5(inst, vel, dur) {
	var count = phraseCount(inst, 4, 9);
	var MIN_LEAP = 8;
	var lastPitch = pickPitch(5, inst);
	legatoNote(inst, humanPitch(lastPitch), humanVel(vel));
	for (var i = 0; i < count; i++) {
		(function(idx) {
			var t = Math.round((idx + 1) / (count + 1) * dur * 1000 * 0.92);
			scheduleAt(inst, t, function() {
				var p = pickPitch(5, inst);
				var attempts = 0;
				while (Math.abs(p - lastPitch) < MIN_LEAP && attempts < 12) { p = pickPitch(5, inst); attempts++; }
				glissNote(inst, humanPitch(p));
				lastPitch = p;
			});
		})(i);
	}
	scheduleRelease(inst, dur * 1.4);
}

// C6: OrderedSlidingAscDesc — portamento steps along the sieve, committed
function phraseC6(inst, vel, dur) {
	var count = phraseCount(inst, 3, 6);
	commitSieveWalk(count);
	var spacing = Math.max(100, Math.round(dur * 1000 / (count + 1)));
	for (var i = 0; i < count; i++) {
		(function(idx) {
			scheduleAt(inst, idx * spacing + humanDelay(), function() {
				if (idx === 0) {
					legatoNote(inst, humanPitch(pickPitch(6, inst)), humanVel(vel));
				} else {
					glissNote(inst, humanPitch(pickPitch(6, inst)));
				}
			});
		})(i);
	}
	scheduleRelease(inst, dur * 1.2);
}

// C7: sustained + micro-drifts — deep breath-like floating
function phraseC7(inst, vel, dur) {
	var driftCount = 1 + (intensityDensity(inst) >= 1.1 ? rrand(1, 2) : 0);
	var p1 = pickPitch(7, inst);
	legatoNote(inst, humanPitch(p1), humanVel(vel));
	var durMs = dur * 1000;
	for (var i = 0; i < driftCount; i++) {
		(function(idx) {
			var t = Math.round(durMs * (0.4 + (idx + 1) / (driftCount + 2) * 0.5));
			scheduleAt(inst, t, function() {
				var lo = (inst.path === "V2") ? 24 : CELLO_MIN;
				var p2 = clamp(p1 + rrand(-3, 3), lo, CELLO_MAX);
				glissNote(inst, p2);
			});
		})(i);
	}
	scheduleRelease(inst, dur * 2.0);
}

// C8: ponticello tremolo cluster — re-bows on same pitch
function phraseC8(inst, vel, dur) {
	var count = phraseCount(inst, 2, 4);
	var mainPitch = pickPitch(8, inst);
	var spacing = Math.max(150, Math.round(dur * 1000 / (count + 1)));
	for (var i = 0; i < count; i++) {
		(function(idx) {
			scheduleAt(inst, idx * spacing + humanDelay(), function() {
				var v = clamp(humanVel(vel) + 8 - idx * 3, 40, 120);
				legatoNote(inst, humanPitch(mainPitch), v);
			});
		})(i);
	}
	scheduleRelease(inst, dur);
}

// ================================================================
// FACE SIGNATURES (Phase A1)
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

var ENV_PROFILE = {
	"pluck": { peakMult: 1.00, attackMult: 0.3,  releaseMult: 0.7 },
	"stab":  { peakMult: 1.15, attackMult: 0.15, releaseMult: 0.6 },
	"swell": { peakMult: 0.90, attackMult: 2.0,  releaseMult: 1.3 },
	"drone": { peakMult: 0.80, attackMult: 1.5,  releaseMult: 1.5 },
	"fade":  { peakMult: 1.00, attackMult: 1.0,  releaseMult: 2.2 },
	"burst": { peakMult: 1.10, attackMult: 0.25, releaseMult: 0.5 }
};

var ART_OFF_VEL = {
	"attack":    110,
	"sustained":  45,
	"release":    30,
	"iterative":  95
};

var MOTION_NUDGE = {
	"static":     0,
	"up":         2,
	"down":      -2,
	"oscillate":  0
};

// /xk/face fires BEFORE /xk/voice; stash the signature globally so
// handleVoice can snapshot it onto the newly-allocated instance.
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

// ================================================================
// VOICE EVENT — allocates an instance, snapshots global state onto it,
// runs the phrase generator inside that instance.
// ================================================================
function handleVoice(vtxIdx, complexType, density, intensity, duration) {
	if (state.frozen) return;

	// Scale duration by face's bias before snapshotting — every downstream
	// timer (envelope, release, phrase rebows) reads the scaled value.
	duration = duration * (state.faceDurationBias || 1.0);

	state.turnCount++;
	state.density = density;
	state.duration = duration;
	state.intensity = intensity;
	var now = Date.now();
	state.lastTurnTime = now;
	state.lastVoiceTime = now;

	var inst = allocateInstance();
	state.lastAllocatedInstance = inst.id;
	inst.lastVoiceTime = now;

	// Snapshot voice-shot state onto the instance so later face / path /
	// intensity changes from subsequent turns don't retroactively reshape
	// this in-flight phrase.
	inst.intensity  = intensity;
	inst.density    = density;
	inst.duration   = duration;
	inst.path       = state.path;
	inst.transpose  = state.transpose;
	inst.tetra      = state.tetra;
	inst.faceDurationBias = state.faceDurationBias;
	inst.faceTranspose    = state.faceTranspose || 0;
	inst.faceEnvProfile   = state.faceEnvProfile;
	inst.faceOffVelOverride = state.faceOffVelOverride;
	inst.faceReleaseMult    = state.faceReleaseMult;

	// Preserve tail note for SWAM portamento when the incoming complex
	// uses legato phrases. Only meaningful if we stole a PLAYING/RELEASING
	// instance — fresh IDLE instances have no tail.
	cancelPhrase(inst, LEGATO_COMPLEX[complexType] === true);
	if (inst.releaseTask) { inst.releaseTask.cancel(); inst.releaseTask = null; }

	// KS sync guard (D28) — first N voice events after reset force-write
	// KS regardless of diff.
	var forcing = inst.ksForceCount > 0;
	if (forcing) {
		inst.ksForceCount--;
		inst.forceKS = true;
	}

	// Technique change — diff-fire KS via setupComplex
	if (complexType !== inst.activeComplex || forcing) {
		setupComplex(inst, complexType);
	}

	inst.forceKS = false;
	inst.status = 'PLAYING';

	var cmx = COMPLEX[complexType];
	if (!cmx) return;

	var intMap = INTENSITY_MAP[intensity] || INTENSITY_MAP["mf"];
	inst.baseExpr = intMap.expr;
	var baseVel = intMap.vel;

	var pathScale = (inst.path === "V2") ? 0.7 : 1.0;
	var envPeakMult = (inst.faceEnvProfile && inst.faceEnvProfile.peakMult) || 1.0;
	inst.peakExpr = clamp(intMap.expr * pathScale * envPeakMult, 0, 127);

	var bowBase = clamp(cmx.bowPressure * intMap.bowMult, 0, 127);
	inst.bowPressureBase = bowBase;
	ccForce(inst, CC.BOW_PRESSURE, Math.round(bowBase));

	// D39 — per-phrase stochastic tremolo-rate envelope (only when tremolo on)
	if (cmx.tremoloRate != null && cmx.tremolo !== TREMOLO.OFF && HAS_TREMOLO_RATE) {
		cancelCCRamp(inst, CC.TREMOLO_RATE);
		var phraseMs = Math.max(duration * 1000, 250);
		var pathTrem = (inst.path === "V2") ? 0.85 : 1.0;
		var steadyBase = clamp(Math.round(cmx.tremoloRate * intMap.tremRateMult * pathTrem), 0, 127);
		var SLOW = 20;
		var FAST = 118;
		var roll = Math.random();
		if (roll < 1/3) {
			ccForce(inst, CC.TREMOLO_RATE, SLOW);
			rampCC(inst, CC.TREMOLO_RATE, FAST, phraseMs);
			log("inst " + inst.id + " tremRamp C" + complexType + " slow→fast " + SLOW + "→" + FAST + " / " + phraseMs + "ms");
		} else if (roll < 2/3) {
			ccForce(inst, CC.TREMOLO_RATE, FAST);
			rampCC(inst, CC.TREMOLO_RATE, SLOW, phraseMs);
			log("inst " + inst.id + " tremRamp C" + complexType + " fast→slow " + FAST + "→" + SLOW + " / " + phraseMs + "ms");
		} else {
			ccForce(inst, CC.TREMOLO_RATE, steadyBase);
			log("inst " + inst.id + " tremRamp C" + complexType + " steady " + steadyBase);
		}
	}

	// Defensive portamento re-assertion — per-instance every voice event
	ccForce(inst, CC.PORTAMENTO_ON,   cmx.portamento.on ? 127 : 0);
	ccForce(inst, CC.PORTAMENTO_TIME, cmx.portamento.time);

	log("inst " + inst.id + " voice C" + complexType + " porta=" + (cmx.portamento.on ? "on" : "off") +
	    " time=" + cmx.portamento.time + " bow=" + Math.round(bowBase) + " int=" + intensity);

	var envForPhrase = cmx.exprEnv;
	if (inst.faceEnvProfile) {
		envForPhrase = {
			attack:        cmx.exprEnv.attack,
			peak:          cmx.exprEnv.peak,
			sustain:       cmx.exprEnv.sustain,
			attackRampMs:  (cmx.exprEnv.attackRampMs  || 40)  * inst.faceEnvProfile.attackMult,
			sustainRampMs:  cmx.exprEnv.sustainRampMs,
			releaseRampMs:  cmx.exprEnv.releaseRampMs
		};
	}
	scheduleExprEnvelope(inst, inst.peakExpr, envForPhrase, Math.max(duration * 1000, 250));

	switch (complexType) {
		case 1: phraseC1(inst, baseVel, duration); break;
		case 2: phraseC2(inst, baseVel, duration); break;
		case 3: phraseC3(inst, baseVel, duration); break;
		case 4: phraseC4(inst, baseVel, duration); break;
		case 5: phraseC5(inst, baseVel, duration); break;
		case 6: phraseC6(inst, baseVel, duration); break;
		case 7: phraseC7(inst, baseVel, duration); break;
		case 8: phraseC8(inst, baseVel, duration); break;
		default:
			legatoNote(inst, pickPitch(complexType, inst), humanVel(baseVel));
			scheduleRelease(inst, duration);
	}
}

// ================================================================
// CONTINUOUS EXPRESSION — 60 Hz with deadband (D18). Iterates all
// non-IDLE instances so the cube's orientation / velocity / deviation
// shapes every sounding voice using each instance's own active complex.
// ================================================================

function vibDepthForComplex(cmx) {
	var base = cmx.vibrato.depth;
	var s = state.spinEMA;
	var extra = 0;
	if (s > 0.15) {
		var u = (s - 0.15) / 0.85;
		extra = u * u * 30;
	}
	return clamp(base + extra, 0, 127);
}

function shouldTransmit(now) {
	if (state.spin < 0.02) {
		if (state.spinLowSince === 0) state.spinLowSince = now;
		if (now - state.spinLowSince >= 200) return false;
	} else {
		state.spinLowSince = 0;
	}
	return (state.frame60 & 1) === 0;
}

function handleExprTilt(val) {
	state.tilt = val;
	var now = Date.now();
	if (!shouldTransmit(now)) return;
	var jitter = (val - 0.5) * 60;
	for (var i = 0; i < POOL_SIZE; i++) {
		var inst = instances[i];
		if (inst.status === 'IDLE') continue;
		var cmx = COMPLEX[inst.activeComplex];
		if (!cmx || cmx.bowPos == null) continue;
		cc(inst, CC.BOW_POSITION, Math.round(cmx.bowPos + jitter + state.scrambleBowBias));
	}
}

function handleExprSpin(val) {
	state.spin = val;
	state.spinEMA = state.spinEMA + 0.08 * (val - state.spinEMA);

	var now = Date.now();
	state.frame60++;
	if (!shouldTransmit(now)) return;

	for (var i = 0; i < POOL_SIZE; i++) {
		var inst = instances[i];
		if (inst.status === 'IDLE') continue;
		var cmx = COMPLEX[inst.activeComplex];
		if (!cmx) continue;
		cc(inst, CC.VIBRATO_DEPTH, vibDepthForComplex(cmx));
		var rate = cmx.vibrato.rate + Math.round(state.spinEMA * 40);
		cc(inst, CC.VIBRATO_RATE, rate);
	}
}

function handleExprDev(val) {
	state.dev = val;
	state.devEMA = state.devEMA + 0.1 * (val - state.devEMA);
	var now = Date.now();
	if (!shouldTransmit(now)) return;

	var mod = (state.devEMA - 0.5) * 50;
	for (var i = 0; i < POOL_SIZE; i++) {
		var inst = instances[i];
		if (inst.status === 'IDLE') continue;
		var cmx = COMPLEX[inst.activeComplex];
		if (!cmx) continue;
		var base = inst.bowPressureBase != null ? inst.bowPressureBase : cmx.bowPressure;
		cc(inst, CC.BOW_PRESSURE, Math.round(base + mod));
		if (inst.activeComplex !== 3 && inst.activeComplex !== 7) {
			cc(inst, CC.BOW_SPEED, Math.round(40 + state.devEMA * 80));
		}
	}
}

// Scramble → Bow Position bias (sul tasto ↔ sul pont). Applied globally
// through state.scrambleBowBias; handleExprTilt reads it per-instance.
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
	else if (state.pontSince && now - state.pontSince >= 2000) newBias = -40;
	if (newBias === state.scrambleBowBias) return;

	state.scrambleBowBias = newBias;

	// Apply immediately to all sounding instances so the shift is audible
	// without waiting for the next tilt frame (and holds when cube is still).
	// C8 (already at the bridge) is skipped — biasing further saturates.
	var jitter = (state.tilt - 0.5) * 60;
	for (var i = 0; i < POOL_SIZE; i++) {
		var inst = instances[i];
		if (inst.status === 'IDLE') continue;
		var cmx = COMPLEX[inst.activeComplex];
		if (!cmx || cmx.bowPos == null) continue;
		var effectiveBias = (inst.activeComplex === 8 && newBias < 0) ? 0 : newBias;
		ccForce(inst, CC.BOW_POSITION, Math.round(cmx.bowPos + jitter + effectiveBias));
	}
	log("scramble bow bias -> " + newBias);
}

// ================================================================
// STRUCTURAL MODIFIERS — global, take effect on the NEXT voice event
// (the just-arrived one hasn't called allocateInstance yet when these
// arrive via OSC; engine.ts sends path/regime/tetra in the state burst
// before the /xk/voice message).
// ================================================================
function handleTetra(orbit) {
	state.tetra = orbit;
}

function handlePath(p) {
	state.path = p;
	state.transpose = (p === "V2") ? -12 : 0;
	log("path -> " + p);
}

function handleRegime(r) {
	if (state.regime === r) return;
	state.regime = r;
	log("regime -> " + r);
	// Apply the new attack-ramp multiplier to every active instance so
	// already-sounding voices adapt their subsequent note attacks.
	var mult = REGIME_ATTACK_MULT[r] || 1.0;
	for (var i = 0; i < POOL_SIZE; i++) {
		var inst = instances[i];
		if (inst.status === 'IDLE') continue;
		var cmx = COMPLEX[inst.activeComplex];
		if (!cmx) continue;
		ccForce(inst, CC.ATTACK_RAMP, clamp(Math.round(cmx.attackRamp * mult), 0, 127));
	}
}

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
// SPELL REACTIONS — TODO (D40): spells currently route through
// state.lastAllocatedInstance (sexy-move/anti-sune accent on most recent
// voice) and instance 0 (dedicated-note pings). Per-spell instance
// allocation is the next refactor: harmonic-ping spells (oll-cross /
// sune / niklas) should allocate their own instance so the ping doesn't
// contend with the voice 0 phrase. u-perm staccato burst likewise.
// ================================================================
function handleSpell(name) {
	log("spell: " + name);
	var lastInst = instances[state.lastAllocatedInstance != null ? state.lastAllocatedInstance : 0];
	var inst0 = instances[0];

	switch (name) {
		case "sexy-move":
			ccForce(lastInst, CC.BOW_PRESS_ACCENT, 110);
			scheduleAt(lastInst, 400, function() {
				ccForce(lastInst, CC.BOW_PRESS_ACCENT, 0);
				if (lastInst.activeComplex) setupComplex(lastInst, lastInst.activeComplex);
			});
			break;

		case "oll-cross":
			setHarmonics(inst0, HARMONICS.OCT);
			var harmPitch = foldToRange(pickPitch(4, inst0) + 12);
			noteOn(inst0, harmPitch, 60);
			inst0.activeNotes.push(harmPitch);
			scheduleAt(inst0, 800, function() {
				noteOff(inst0, harmPitch);
				var idx = inst0.activeNotes.indexOf(harmPitch);
				if (idx >= 0) inst0.activeNotes.splice(idx, 1);
				if (inst0.activeComplex) setupComplex(inst0, inst0.activeComplex);
			});
			break;

		case "u-perm":
			var burstCount = rrand(3, 5);
			ccForce(inst0, CC.BOW_PRESS_ACCENT, 100);
			for (var i = 0; i < burstCount; i++) {
				(function(idx, last) {
					scheduleAt(inst0, idx * rrand(60, 120), function() {
						var bp = humanPitch(pickPitch(1, inst0));
						noteOn(inst0, bp, rrand(100, 120));
						inst0.activeNotes.push(bp);
						scheduleAt(inst0, rrand(60, 100), function() {
							noteOff(inst0, bp);
							var bidx = inst0.activeNotes.indexOf(bp);
							if (bidx >= 0) inst0.activeNotes.splice(bidx, 1);
							if (last) {
								ccForce(inst0, CC.BOW_PRESS_ACCENT, 0);
								if (inst0.activeComplex) setupComplex(inst0, inst0.activeComplex);
							}
						});
					});
				})(i, i === burstCount - 1);
			}
			break;

		case "sune":
			setHarmonics(inst0, HARMONICS.OCT_5TH);
			var sunePitch = foldToRange(pickPitch(4, inst0));
			noteOn(inst0, sunePitch, 55);
			inst0.activeNotes.push(sunePitch);
			scheduleAt(inst0, 700, function() {
				noteOff(inst0, sunePitch);
				var idx = inst0.activeNotes.indexOf(sunePitch);
				if (idx >= 0) inst0.activeNotes.splice(idx, 1);
				if (inst0.activeComplex) setupComplex(inst0, inst0.activeComplex);
			});
			break;

		case "anti-sune":
			ccForce(lastInst, CC.BOW_POSITION, 40);
			scheduleAt(lastInst, 600, function() {
				if (lastInst.activeComplex) setupComplex(lastInst, lastInst.activeComplex);
			});
			break;

		case "t-perm":
			bang();
			log("spell reset (t-perm)");
			break;

		case "niklas":
			setHarmonics(inst0, HARMONICS.CTRL);
			var niklasPitch = foldToRange(pickPitch(4, inst0) - 3);
			noteOn(inst0, niklasPitch, 52);
			inst0.activeNotes.push(niklasPitch);
			scheduleAt(inst0, 900, function() {
				noteOff(inst0, niklasPitch);
				var idx = inst0.activeNotes.indexOf(niklasPitch);
				if (idx >= 0) inst0.activeNotes.splice(idx, 1);
				if (inst0.activeComplex) setupComplex(inst0, inst0.activeComplex);
			});
			break;
	}
}

// ================================================================
// PANIC — flush every instance
// ================================================================
function handlePanic() {
	log("PANIC — flushing all instances");
	bang();
}

// Clean CC 80 single-shot for SWAM MIDI-Learn (D32). Routes to instance 0.
function handleTremLearn(val) {
	var inst = instances[0];
	cancelPhrase(inst, false);
	if (inst.releaseTask) { inst.releaseTask.cancel(); inst.releaseTask = null; }
	cancelCCRamp(inst, CC.EXPRESSION);
	var v = clamp(Math.round(val != null ? val : 100), 0, 127);
	outlet(inst.outlet, "midievent", statusCC(MIDI_CH), CC.TREMOLO_RATE, v);
	inst.ccCache[CC.TREMOLO_RATE] = v;
	log("tremLearn CC 80 = " + v + " (inst 0, clean single-shot for MIDI-Learn)");
}

function watchdogTick() {
	// Per-instance orphan-note check (D17). Fires only if an instance has
	// active notes, no release scheduled, no pending phrase events, and
	// has been silent for ≥ 3 s.
	try {
		var now = Date.now();
		for (var i = 0; i < POOL_SIZE; i++) {
			var inst = instances[i];
			var hasNotes = inst.activeNotes.length > 0;
			var noRelease = (inst.releaseTask === null);
			var noPhrase = (inst.phraseTasks.length === 0);
			var stale = (inst.lastVoiceTime > 0) && (now - inst.lastVoiceTime > 3000);
			if (hasNotes && noRelease && noPhrase && stale) {
				log("watchdog tripped — orphan notes inst " + inst.id + ", flushing");
				allNotesOff(inst);
				inst.lastVoiceTime = 0;
				inst.status = 'IDLE';
			}
		}
	} catch (e) {}
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
// RESET — clears every instance, reseeds selector state, starts silent
// ================================================================
function resetInstance(inst) {
	for (var n in inst.ccRampTasks) cancelCCRamp(inst, n);
	for (var i = 0; i < inst.phraseTasks.length; i++) inst.phraseTasks[i].cancel();
	inst.phraseTasks = [];
	if (inst.releaseTask) { inst.releaseTask.cancel(); inst.releaseTask = null; }
	for (var ksn in inst.ksPending) {
		if (inst.ksPending[ksn] && inst.ksPending[ksn].task) inst.ksPending[ksn].task.cancel();
	}
	inst.ksPending = {};
	inst.activeNotes = [];
	inst.ccCache = {};
	inst.ccRampTasks = {};

	inst.activeComplex = 0;
	inst.playMode = null;
	inst.harmonics = null;
	inst.tremolo = null;
	inst.bowPoly = null;
	inst.gestureMode = null;
	inst.altFing = null;
	inst.keepBowDir = false;
	inst.baseExpr = 0;
	inst.peakExpr = 0;
	inst.bowPressureBase = 64;
	inst.intensity = "mf";
	inst.density = 2.0;
	inst.duration = 1.0;
	inst.path = "V1";
	inst.transpose = 0;
	inst.tetra = 0;
	inst.faceDurationBias = 1.0;
	inst.faceTranspose = 0;
	inst.faceEnvProfile = null;
	inst.faceOffVelOverride = null;
	inst.faceReleaseMult = 1.0;
	inst.ksForceCount = 3;
	inst.forceKS = false;
	inst.status = 'IDLE';
	inst.allocatedAt = 0;
	inst.lastVoiceTime = 0;

	// Initial CC baseline (silent). setupComplex later overrides.
	ccForce(inst, CC.EXPRESSION, 0);
	ccForce(inst, CC.VIBRATO_DEPTH, 0);
	ccForce(inst, CC.VIBRATO_RATE, 64);
	ccForce(inst, CC.BOW_PRESSURE, 64);
	ccForce(inst, CC.BOW_POSITION, 64);
	ccForce(inst, CC.BOW_PRESS_ACCENT, 0);
	ccForce(inst, CC.BOW_SPEED, 64);
	ccForce(inst, CC.PORTAMENTO_ON, 0);
	ccForce(inst, CC.PORTAMENTO_TIME, 0);
	ccForce(inst, CC.SUSTAIN_PEDAL, 0);
	ccForce(inst, CC.ATTACK_RAMP, 64);
	ccForce(inst, CC.ATTACK_CONTROL, 64);
	ccForce(inst, CC.SORDINO, 0);

	// Pin Gesture Mode = Expression (D27). Explicit Harmonics/Tremolo OFF
	// so SWAM matches our model even if the preset default drifted.
	setEnum(inst, "gestureMode", KS.GESTURE_MODE, GESTURE.EXPR, 3);
	setHarmonics(inst, HARMONICS.OFF);
	setTremolo(inst, TREMOLO.OFF);
	setBowPolyphony(inst, BOW_POLY.DOUBLE_HOLD);
}

function bang() {
	state.sieveIdx = 0;
	state.sieveDir = 1;
	state.frozen = false;
	state.scramble = 0;
	state.turnCount = 0;
	state.lastTurnTime = 0;
	state.lastVoiceTime = 0;
	state.intensity = "mf";
	state.density = 2.0;
	state.duration = 1.0;
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
	state.face = null;
	state.faceDurationBias = 1.0;
	state.faceTranspose = 0;
	state.faceEnvelope = null;
	state.faceArticulation = null;
	state.faceMotion = null;
	state.faceEnvProfile = null;
	state.faceOffVelOverride = null;
	state.faceReleaseMult = 1.0;
	state.lastAllocatedInstance = 0;

	for (var i = 0; i < POOL_SIZE; i++) resetInstance(instances[i]);

	log("reset — " + POOL_SIZE + " instances cleared");
}

// ================================================================
// UTILITIES
// ================================================================
function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
function rrand(lo, hi)    { return Math.floor(Math.random() * (hi - lo + 1)) + lo; }
function log(msg)         { outlet(DEBUG_OUTLET, "xk_swam: " + msg); }

// ================================================================
// INIT
// ================================================================
function loadbang() {
	log("v4 ready — instance pool " + POOL_SIZE + " SWAM voices");
	startWatchdog();
}
