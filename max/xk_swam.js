// ================================================================
// xk_swam.js — XenaKube → SWAM Cello 3 MIDI bridge (v5 — single instance)
//
// Receives /xk/* OSC from relay.js (port 57121) and emits midievent
// messages out outlet 0 into a single downstream [vst~ "SWAM Cello 3"].
// Each /xk/voice renders its full gesture (envelope + phrase + release)
// into that one instance; a new voice hard-steals the current one via
// stealInstance (CC 120 All Sound Off + CC 123 All Notes Off + CC 11 = 0),
// giving Xenakis "one step at a time." No poly~, no per-voice routing.
//
// v5 (2026-04-23) — single-instance revert. The v4 instance-pool
// machinery (makeInstance, allocateInstance, stealInstance, per-instance
// ccCache / activeNotes / phraseTasks / face snapshots / status
// lifecycle) is kept because the single `inst` threading is how every
// phrase / CC ramp / release task is bookkept. POOL_SIZE = MAX_ACTIVE = 1
// collapses the allocator to one slot; `inst.voice = 1` (for echo OSC
// addressing only, no MIDI routing).
//
// v4 pool (2026-04-20) reverted: Ambiente auto-registered all 8 VST
// instances as reverb sources causing phase overlap even with
// MAX_ACTIVE = 2, and CPU scaled 8× for texture the composer didn't
// want. Single-instance restores the sound the composer preferred.
//
// v3 refactor history (all still valid): D17 panic watchdog,
// D1/D2/D12/D27 SWAM KS model + diffing, D5/D7 COMPLEX table, D4/D8/D33
// per-complex expression envelope slewed via rampCC, D18 60 Hz CC
// deadband, D28 KS sync guard, D29 interleave guard, D31 Harmonics/
// Tremolo via CC 78/79, D32/D39 tremolo-rate stochastic envelope, D34
// low-vel gliss overlap, D35 per-complex Bow Polyphony, D37 C4 harmonic
// rotation, D40 CC 120/123 silencing on steal, D41 per-phrase
// duration clamp + portamento wiggle + face sculpt.
//
// Prerequisite: the downstream [vst~ SWAM Cello 3] preset configured
// per docs/swam_cello_reference.md. No poly~ / polymidiin required.
// ================================================================

autowatch = 1;
inlets = 1;

// Single-instance mode — the v8 feeds one downstream [vst~ SWAM Cello]
// directly (no poly~ / target routing). The pool/allocator machinery
// stays for per-instance state bookkeeping (ccCache, activeNotes,
// phraseTasks, face snapshots, status lifecycle) and voice-stealing
// semantics, but POOL_SIZE = 1 collapses it to one slot: every new
// voice hard-steals the current one via stealInstance (CC 120 + 123 +
// Expression=0). Xenakis "one step at a time."
var POOL_SIZE = 1;
var MAX_ACTIVE = 1;

function max_active(v) {
	var n = Math.max(1, Math.min(POOL_SIZE, Math.round(v)));
	MAX_ACTIVE = n;
	log("max_active = " + MAX_ACTIVE + " (pool size = " + POOL_SIZE + ")");
	outlet(DEBUG_OUTLET, "max_active", MAX_ACTIVE);
}
outlets = 4;                    // 0 → midievent → [vst~ SWAM Cello], 1 → debug, 2 → MIDI echo, 3 → detected moves/spells
var MIDI_OUTLET  = 0;
var DEBUG_OUTLET = 1;
var ECHO_OUTLET  = 2;           // Phase E tier 2 — noteon/noteoff echo to relay (UDP 57122)
var MOVES_OUTLET = 3;           // 2026-04-24 — detected face-moves + spell completions for Max-side display/routing

// Inlet / outlet tooltip labels — shown in Max on hover.
setinletassist(0,            "OSC /xk/* from relay (port 57121) + bang/on/off/debug");
setoutletassist(MIDI_OUTLET,  "midievent → [vst~ SWAM Cello 3]");
setoutletassist(DEBUG_OUTLET, "debug → [print xk_swam]");
setoutletassist(ECHO_OUTLET,  "/xk/midi/{noteon,noteoff,panic} → [udpsend 127.0.0.1 57122] → relay → dashboard rolling score");
setoutletassist(MOVES_OUTLET, "detected: 'face <L|L'|R|R'|...>' on every quarter-turn, 'spell <name>' on every algorithm match — wire to [route face spell]");

// Pulls in all data tables (OSC addresses, SWAM enums, CC band centers,
// INTENSITY_MAP, ENV_PROFILE, ART_OFF_VEL, MOTION_NUDGE, FACE_MAP,
// LEGATO_COMPLEX, REGIME_* multipliers) generated from src/osc-schema.ts
// + src/swam-mapping.ts + src/face-gesture.ts. Regenerate after any TS
// table edit with `npm run gen:max` and then reload this script (right-
// click v8 → Reload Script, or edit-and-save to trigger autowatch).
include("gen_includes.js");

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

// HARMONICS_CC_VAL / TREMOLO_CC_VAL / BOW_POLY / BOW_POLY_CC_VAL are
// declared in gen_includes.js (source: src/swam-mapping.ts). See the
// include() call at the top of this file.

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

// HARMONICS, TREMOLO and INTENSITY_MAP are declared in gen_includes.js
// (source: src/swam-mapping.ts). GESTURE, KS_VEL, PLAY_MODE_VEL stay
// local — they're Max-runtime concepts (KS velocity encoding, Gesture
// Mode pin) not shared with the TS side.
var GESTURE   = { EXPR:0, BIPOLAR:1, BOWING:2 };

var KS_VEL = { LOW: 40, MID: 80, HIGH: 110 };
var PLAY_MODE_VEL = { bow: KS_VEL.LOW, pizz: KS_VEL.MID, col: KS_VEL.HIGH };

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
	     // CC 5 (Portamento Time) caps at 127 (standard MIDI CC range).
	     // D53 v1 tried `time:250` thinking it was raw ms/semi, but
	     // ccForce clamps to 0..127 → audio actually played at CC 5 = 127
	     // (~127 ms/semi) while the dashboard mirror was set to 250
	     // ms/semi → visual interpolated 2× slower than audio. Reverted to
	     // 115 (original C7 value) until pitchbend lands as the path to
	     // genuinely-slow drift. Gestural distinction from C6 comes from
	     // FIRST_GLISS_MS_C7 + ±1-2 alternating-sign deltas in phraseC7.
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

// REGIME_ATTACK_MULT, REGIME_EXPR_RAMP_MULT, LEGATO_COMPLEX are declared
// in gen_includes.js (source: src/swam-mapping.ts).

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
// Single SWAM Cello instance. The pool structure is retained as the
// bookkeeping anchor for per-voice caches (ccCache, activeNotes,
// phraseTasks, face snapshots, selector diff state) and the status
// lifecycle, but POOL_SIZE = MAX_ACTIVE = 1 means every allocation
// returns instances[0] and every new voice hard-steals the old one.
// `inst.voice = 1` is kept only as the voice-id in the MIDI echo OSC
// to the dashboard.
//
// Status lifecycle (collapsed to one slot):
//   IDLE       — no phrase in flight; next voice goes straight in
//   PLAYING    — phrase is generating notes, expression peaked/sustaining
//   RELEASING  — scheduleRelease fired, CC 11 slewing to 0
//
// Any new voice arriving while status != IDLE triggers stealInstance
// (CC 11 = 0 + CC 120 + CC 123 + noteOff all tracked pitches) before
// the new phrase starts.
// ================================================================
function makeInstance(id) {
	return {
		id: id,
		voice: id + 1,               // 1-indexed id used only for MIDI echo OSC to dashboard
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
		faceEnvelope: null,      // 'pluck'|'swell'|'stab'|'drone'|'fade'|'burst'|null — drives phrase count + expr shape
		faceMotion: null,        // 'static'|'up'|'down'|'oscillate'|null — drives sieve-walker direction
		faceEnvProfile: null,
		faceOffVelOverride: null,
		faceReleaseMult: 1.0,

		// Expression targets
		baseExpr: 0,
		peakExpr: 0,
		bowPressureBase: 64,

		// Gliss invariant telemetry (D42 + D46). Every C5/C6/C7 voice MUST
		// emit ≥1 glissStep; scheduleRelease's offT checks the sum of
		// glissOverlapCount (within-string slides) + glissLeapCount
		// (cross-string leaps) and logs "GLISS FAIL" if both are 0. Per-
		// phrase log line reports the breakdown so the user can verify
		// in [print xk_swam]. See CLAUDE.md § Bridge Invariants.
		glissOverlapCount: 0,
		glissLeapCount: 0,
		glissExpected: false,

		// D48 leap-alternation telemetry. Every leap (and the phrase anchor)
		// must be followed by a same-string slide; lastWasLeap is the state
		// machine glissStep reads to decide whether to nudge the target onto
		// source's string. consecutiveLeapMax records the longest run of
		// back-to-back leaps in the phrase — only > 1 when nudgeToSameString
		// returned null at extreme range corners. scheduleRelease's offT
		// promotes to "GLISS RUN FAIL" when maxRun > 1.
		lastWasLeap: false,
		consecutiveLeapCurrent: 0,
		consecutiveLeapMax: 0,

		// D47 phrase-arc telemetry. schedulePhraseArc stashes the intent;
		// scheduleRelease's natural-end task asserts ccCache[CC.EXPRESSION]
		// reached phraseArcEnd within ±8. phraseArcDir = null means no arc
		// is pending (legacy 3-stage envelope path or never-armed).
		phraseArcDir: null,    // 'cresc' | 'dim' | null
		phraseArcStart: 0,
		phraseArcEnd: 0,

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
	// MAX_ACTIVE soft cap — count non-IDLE instances. If we're at the cap,
	// skip the IDLE branch and fall through to voice-stealing so a new turn
	// replaces an older voice rather than layering on top of it.
	var activeCount = 0;
	for (i = 0; i < POOL_SIZE; i++) {
		if (instances[i].status !== 'IDLE') activeCount++;
	}
	if (activeCount < MAX_ACTIVE) {
		// Prefer IDLE
		for (i = 0; i < POOL_SIZE; i++) {
			if (instances[i].status === 'IDLE') {
				instances[i].allocatedAt = now;
				return instances[i];
			}
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
	// D42 — stolen phrases never reach scheduleRelease's offT, so clear the
	// gliss-expected flag to avoid a false-positive "GLISS FAIL" log. A fast
	// turn that cuts a gliss short is user intent, not a bug.
	inst.glissExpected = false;
	cancelPhrase(inst, false);
	if (inst.releaseTask) { inst.releaseTask.cancel(); inst.releaseTask = null; }
	cancelCCRamp(inst, CC.EXPRESSION);
	// Hard-zero Expression and flush SWAM's voice completely. noteOff alone
	// hands the pitch to SWAM's internal release envelope, which on bowed /
	// drone modes can sustain 2-10 s + Ambiente reverb tail — audible as
	// "forever notes." CC 120 All Sound Off bypasses the release envelope;
	// CC 123 All Notes Off is belt-and-suspenders for any pitch SWAM is
	// holding without our tracking (gliss tails, untracked legato chains).
	ccForce(inst, CC.EXPRESSION, 0);
	emitMidi(inst, statusCC(MIDI_CH), 120, 0);
	emitMidi(inst, statusCC(MIDI_CH), 123, 0);
	allNotesOff(inst);
	inst.activeNotes = [];
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

// Emit a midievent directly out MIDI_OUTLET. No poly~ / target routing —
// the v8 now feeds a single downstream [vst~ SWAM Cello] (or [midiout])
// directly. `inst` is still threaded through for per-instance state
// (ccCache, activeNotes, etc.) but never leaves the JS side.
function emitMidi(inst, status, byte1, byte2) {
	outlet(MIDI_OUTLET, "midievent", status, byte1, byte2);
}

// Phase E tier 2 (rev B 2026-04-24) — mirror every noteon/noteoff the bridge
// emits to the relay as OSC so the dashboard can transcribe exactly what SWAM
// plays. Keyswitches (which call emitMidi directly, bypassing the noteOn/noteOff
// wrappers) are intentionally excluded — they're technique-select toggles, not
// score notes. The 4th arg `complex` is `inst.activeComplex` at echo time
// (1..8 = Cn, 0 if pre-init); the dashboard piano-roll uses it to colour notes
// by technique and connect adjacent same-voice C5/C6/C7 notes as glissando
// curves. Addresses come from gen_includes.js (OSC.MIDI_NOTEON / MIDI_NOTEOFF
// / MIDI_PANIC).
function emitEchoNote(address, inst, pitch, vel) {
	outlet(ECHO_OUTLET, address, inst.voice, pitch, vel, inst.activeComplex || 0);
}

function noteOn(inst, pitch, vel) {
	pitch = clamp(pitch, 0, 127);
	vel = clamp(vel, 1, 127);
	emitMidi(inst, statusNoteOn(MIDI_CH), pitch, vel);
	emitEchoNote(OSC.MIDI_NOTEON, inst, pitch, vel);
}

// Phase 8: velocity default = state.noteOffVel (turn-rate driven).
// Phase A1: inst.faceOffVelOverride (articulation) beats turn-rate when set.
function noteOff(inst, pitch, vel) {
	pitch = clamp(pitch, 0, 127);
	if (vel == null) {
		vel = (inst.faceOffVelOverride != null) ? inst.faceOffVelOverride : state.noteOffVel;
	}
	vel = clamp(Math.round(vel), 0, 127);
	emitMidi(inst, statusNoteOff(MIDI_CH), pitch, vel);
	emitEchoNote(OSC.MIDI_NOTEOFF, inst, pitch, vel);
}

// Continuous CC — per-instance cache-suppressed. Use for 60 Hz streams.
function cc(inst, num, val) {
	if (!hasCC(num)) return;
	val = clamp(Math.round(val), 0, 127);
	if (inst.ccCache[num] === val) return;
	inst.ccCache[num] = val;
	emitMidi(inst, statusCC(MIDI_CH), num, val);
}

// Forced CC — always writes, updates cache.
function ccForce(inst, num, val) {
	if (!hasCC(num)) return;
	val = clamp(Math.round(val), 0, 127);
	inst.ccCache[num] = val;
	emitMidi(inst, statusCC(MIDI_CH), num, val);
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
		emitMidi(inst, statusNoteOff(prev.ch || ch), note, v);
		inst.ksPending[note] = null;
	}

	emitMidi(inst, statusNoteOn(ch), note, v);
	var ks = note;
	var kch = ch;
	var kv = v;
	var t = new Task(function() {
		emitMidi(inst, statusNoteOff(kch), ks, kv);
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

// D44 — diff guard removed (2026-04-23). Pre-D44 this function early-
// returned when `inst.bowPoly === target`, which silently dropped CC 81
// writes whenever the bridge's cached state already matched. But SWAM-
// side state can drift out of sync with our cache on plugin reload,
// preset re-read, or session start (resetInstance fires CC 81 before
// `[read xenakube_2.swam]` finishes loading the preset, so the CC is
// either ignored or overwritten). Result: bridge thinks Bow Polyphony =
// Double/Hold, SWAM is actually still in Mono Poly Release from the last
// gliss session, and every subsequent C2/C3/C8 voice's diff guard
// returned early — no CC 81 ever escaped, double stops never sounded.
// Always re-asserting on every call costs one CC write; cheap insurance.
function setBowPolyphony(inst, target) {
	if (HAS_BOW_POLY_CC) {
		ccForce(inst, CC.BOW_POLYPHONY, BOW_POLY_CC_VAL[target]);
	}
	inst.bowPoly = target;
	log("inst " + inst.id + " bowPoly=" + target + " cc81=" + BOW_POLY_CC_VAL[target]);
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

	// D52 — clear any in-flight Bow Pressure Accent spike whose scheduled
	// reset task got cancelled above. Without this, a steal mid-spike could
	// leak CC 18 = 80 into the next voice, producing an unintended initial
	// accent on the new phrase's first noteOn.
	if (HAS_BOW_PRESS_ACCENT) ccForce(inst, CC.BOW_PRESS_ACCENT, 0);

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

		// D42 + D46 gliss invariant assertion. Phrase ran to natural end
		// without being stolen, so if glissExpected was true we should have
		// seen ≥1 gliss event (slide OR leap). 0 means the phrase generator
		// emitted no glissStep at all despite being a gliss complex — a
		// silent bug pre-D42. The per-phrase breakdown is always logged so
		// the user can verify slide/leap distribution in [print xk_swam].
		if (inst.glissExpected) {
			var slides = inst.glissOverlapCount | 0;
			var leaps  = inst.glissLeapCount    | 0;
			var maxRun = inst.consecutiveLeapMax | 0;
			if (slides + leaps < 1) {
				log("GLISS FAIL inst " + inst.id + " C" + inst.activeComplex +
				    " face=" + (inst.faceEnvelope || "-") +
				    " motion=" + (inst.faceMotion || "-") +
				    " slides=0 leaps=0 dur=" + dur.toFixed(2));
			} else if (maxRun > MAX_CONSECUTIVE_LEAPS) {
				// D48 + D51 — leap-run exceeded MAX_CONSECUTIVE_LEAPS despite
				// the post-leap nudge. Only happens when nudgeToSameString
				// returned null (source at extreme of every string with no
				// minLeap headroom in either direction). If frequent, narrow
				// pickPitch's C5 register or lower MIN_LEAP.
				log("GLISS RUN FAIL inst " + inst.id + " C" + inst.activeComplex +
				    " face=" + (inst.faceEnvelope || "-") +
				    " slides=" + slides + " leaps=" + leaps +
				    " consecLeapMax=" + maxRun + " dur=" + dur.toFixed(2));
			} else {
				log("inst " + inst.id + " C" + inst.activeComplex +
				    " face=" + (inst.faceEnvelope || "-") +
				    " slides=" + slides + " leaps=" + leaps +
				    " dur=" + dur.toFixed(2));
			}
			inst.glissExpected = false;
		}

		// D47 phrase-arc invariant assertion. Phrase ran to natural end
		// without being stolen, so the rampCC chain had the full duration
		// to walk from phraseArcStart to phraseArcEnd. ccCache[CC.EXPRESSION]
		// should be at phraseArcEnd within tolerance — the last task in the
		// rampCC chain wrote it via ccForce. Mismatch > 8 of 127 (~6%) means
		// either the duration was too short for any rampCC step to land
		// (15 ms tickMs floor) or some external CC.EXPRESSION write
		// intervened (60 Hz expression modulator, manual override, regression
		// in another helper). Stolen voices clear inst.phraseArcDir via the
		// new voice's snapshot/dispatch in handleVoice, so this branch only
		// runs on natural ends.
		if (inst.phraseArcDir) {
			var landed = inst.ccCache[CC.EXPRESSION];
			if (landed == null) landed = 0;
			var off = Math.abs(landed - inst.phraseArcEnd);
			if (off > 8) {
				log("ARC FAIL inst " + inst.id + " C" + inst.activeComplex +
				    " face=" + (inst.faceEnvelope || "-") +
				    " dir=" + inst.phraseArcDir +
				    " landed=" + landed + " want=" + inst.phraseArcEnd +
				    " off=" + off + " dur=" + dur.toFixed(2));
			} else {
				log("inst " + inst.id + " C" + inst.activeComplex +
				    " arc=" + inst.phraseArcDir +
				    " " + inst.phraseArcStart + "->" + landed +
				    " dur=" + dur.toFixed(2));
			}
			inst.phraseArcDir = null;
		}

		var offT = new Task(function() {
			allNotesOff(inst);
			// CC 120 All Sound Off — guarantees SWAM fully silences this
			// instance. Without it, an untracked legato / gliss tail can
			// continue sounding via SWAM's internal envelope even after our
			// Expression ramp hits 0 (bowed-mode release can be 2-10 s).
			emitMidi(inst, statusCC(MIDI_CH), 120, 0);
			emitMidi(inst, statusCC(MIDI_CH), 123, 0);
			inst.activeNotes = [];
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

// D47 — face envelope → arc direction. Returns 'cresc' / 'dim' / null.
// Null means caller falls back to scheduleExprEnvelope (isSingle envelopes
// resolve to one note, so an arc is moot; null face has no envelope to read).
// Burst is treated as dim — the iterative flurry reads as energy releasing
// rather than accumulating. R' is the only burst face under the current
// FACE_SIGNATURES; revisit if the table grows.
function phraseArcDirection(inst) {
	var env = inst.faceEnvelope;
	if (!env) return null;
	if (env === 'swell') return 'cresc';
	if (env === 'fade')  return 'dim';
	if (env === 'burst') return 'dim';
	return null;
}

// D47 — phrase-spanning linear CC 11 ramp. Replaces scheduleExprEnvelope's
// 3-stage attack/peak/sustain shape with a single sweep from ARC_FLOOR ×
// peakExpr to ARC_CEIL × peakExpr (cresc) or vice versa (dim). ccForce snaps
// to startVal so the new voice starts at the intended dynamic instead of
// inheriting the previous voice's tail; rampCC walks the rest. Voice steal
// cancels the ramp via cancelPhrase → cancelCCRamp(CC.EXPRESSION) — the new
// voice's snapshot overwrites phraseArcDir before its own scheduleRelease
// fires, so the FAIL telemetry only triggers on natural ends. REGIME ramp
// multiplier still applies so contemplative regime stretches the arc and
// burst regime tightens it.
function schedulePhraseArc(inst, peakExpr, dir, durMs) {
	var rm = REGIME_EXPR_RAMP_MULT[state.regime] || 1.0;
	var rampMs = Math.max(60, Math.round(durMs * rm));
	var lo = clamp(Math.round(peakExpr * ARC_FLOOR), 0, 127);
	var hi = clamp(Math.round(peakExpr * ARC_CEIL),  0, 127);
	var startVal = (dir === 'cresc') ? lo : hi;
	var endVal   = (dir === 'cresc') ? hi : lo;

	ccForce(inst, CC.EXPRESSION, startVal);
	rampCC(inst, CC.EXPRESSION, endVal, rampMs);

	inst.phraseArcDir   = dir;
	inst.phraseArcStart = startVal;
	inst.phraseArcEnd   = endVal;

	log("inst " + inst.id + " phraseArc dir=" + dir +
	    " face=" + (inst.faceEnvelope || "-") +
	    " start=" + startVal + " end=" + endVal +
	    " dur=" + Math.round(durMs) + "ms");
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
	// SWAM v3 quirk: CC 5 (Portamento Time) only takes effect when the
	// plugin sees a parameter *change*. Writing the same value twice is
	// treated as a no-op even if the internal state hasn't been synced.
	// Wiggle through 0 first so SWAM registers the edit — equivalent to
	// the user's manual fix of dragging the Portamento Time slider.
	if (cmx.portamento.on) ccForce(inst, CC.PORTAMENTO_TIME, 0);
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
// Overlap window before the previous note's noteOff fires. 20 ms is fine
// for plain legato chains — we just want the new note to sound before the
// old one cuts. Gliss (C5/C6/C7) asks SWAM's Bow Polyphony "Mono Poly
// Release" detector to treat the overlap as a portamento target, and 20 ms
// is tight enough that cold-load / state-drift occasionally misses it —
// so glissNote uses GLISS_OVERLAP_MS instead.
var LEGATO_OVERLAP_MS = 20;
var GLISS_OVERLAP_MS  = 60;

// D43 — first gliss step fires this many ms after the anchor, regardless of
// phrase duration. Makes the slide audible early so a stolen short phrase
// (fast turn cutting the voice at ~300 ms) still reads as a gliss rather
// than a sustained note. 150 ms is late enough for the anchor to establish
// a clear starting pitch, early enough that the slide is unambiguous before
// scheduleRelease's 200 ms floor hits for tiny durations.
var FIRST_GLISS_MS = 150;

// D53 — C7 immediate-start drift. C7's character is "wispy ephemeral
// wandering" / breath-like rocking around an anchor (vs C6's deliberate
// sieve-walking). To make the gesture audibly distinct from C6 — even
// though both timbral signatures (sul tasto, deep vibrato, low register)
// already differ — C7 fires its first drift much earlier so the listener
// never hears the anchor settle as a stable pitch; pitch is in motion
// almost immediately, exposing microtonal slow drift via the slow
// portamento (CC 5 = 250 ms/semi for C7, set in COMPLEX[7].portamento.time).
// 30 ms is short enough that anchor reads as a "starting pitch" attack
// moment but not a sustained note; long enough that SWAM still receives
// the 60 ms anchor → drift overlap (GLISS_OVERLAP_MS) needed to engage
// portamento on the first slide.
var FIRST_GLISS_MS_C7 = 30;

// D45 — minimum spacing between consecutive gliss events. SWAM's Mono Poly
// Release portamento needs ~150–200 ms to actually engage; if the next
// overlapping noteon arrives sooner, SWAM aborts the in-progress slide and
// jumps to the new pitch — audibly, the phrase reads as a salvo of fast
// LEAPS rather than slides. The phrase generators (esp. C5 with high
// intensity + burst face) could schedule events 50–120 ms apart, which is
// where the "wild gliss does fast leaps instead" report came from. 200 ms
// is the floor; phrases that can't fit `count` events at this spacing get
// `count` clipped to whatever fits (the typical 1–3 s phrase keeps every
// event because its ideal spacing exceeds the floor anyway).
var MIN_GLISS_SPACING_MS = 200;

// D49 — wild gliss (C5) hard floor on event count. Wild is the complex's
// identity; even when the face envelope is isSingle (pluck/stab/drone, which
// collapses faceShapedCount to 1) or the intensity is low (rrand floor of 2
// from phraseCount at p intensity), C5 must still emit at least this many
// glissStep events so the phrase reads as a salvo rather than a single
// anchor → slide pair. Anchor + WILD_MIN_COUNT events = WILD_MIN_COUNT + 1
// audible notes; with D48 leap-alternation that's at least
// ceil(WILD_MIN_COUNT/2) audible glissandi. glissSchedule still truncates if
// the phrase duration is too short to fit the count at MIN_GLISS_SPACING_MS;
// typical 1-3 s phrases fit 4-9 events comfortably. Raise if user wants
// even denser wild salvos; lower with caution (3 may not feel wild on
// pluck-face short durations).
var WILD_MIN_COUNT = 12;

// D52 — wild gliss (C5) bow pressure accent. SWAM Cello's Expressivity →
// Bow Pressure Accent slider is MIDI-Learned to CC 18 in the user's preset
// (already used by sexy-move and u-perm spells for transient pressure
// accents). Spiking CC 18 just before each slide noteOn applies a per-event
// pressure accent that SWAM hears as a fresh bow attack — without touching
// velocity (which would shrink portamento time per Velocity → P.MaxTime,
// the failure mode of D50 v1). Decouples slide intent (vel) from attack
// character (BPA spike), so wild gliss gets audible per-slide attacks while
// portamento stays fully engaged.
//
// Spike value 80 is moderate (sexy-move uses 110, u-perm 100); reset to 0
// after BPA_RESET_MS sustains the accent through the start of the slide
// envelope so SWAM's pressure response has time to ring out before the next
// event arrives at ≥200 ms (MIN_GLISS_SPACING_MS), preventing stacked spikes.
// cancelPhrase forces CC 18 = 0 on steal so a spike whose reset task got
// cancelled can't bleed into the next voice. Used by C5 wild gliss only —
// C6/C7 keep their gentle bow-continuation slide character.
var WILD_GLISS_BPA = 80;
var BPA_RESET_MS   = 100;

// D50 v2 — wild gliss (C5) slide-target velocity. SWAM Cello's Advanced→MIDI
// menu has "Portamento Control: Velocity (P.MaxTime)" selected, which means
// the slide noteOn's velocity directly scales the portamento time — high vel
// shrinks portamento time toward zero, so a vel-bump that looks like "soft
// audible attack" actually kills the slide entirely. The original GLISS_VEL
// = 18 sits at the bottom of that scale, giving max portamento time. This
// re-attempt nudges the slide vel only 4 units up to see whether slides stay
// audibly engaged at vel 22 while gaining a tiny bit of attack character.
// If portamento still works at 22, we can creep up further (24, 26, ...) to
// find SWAM's threshold. If 22 already breaks portamento, drop back to 18.
//
// More surgical alternative for adding slide audibility (not yet wired):
// Bow Pressure Accent (CC 18, currently mapped but unused) — sends a brief
// pressure spike per noteOn without touching velocity. SWAM's Expressivity
// → Bow Pressure Accent is at 0.0 default; raising it via CC 18 on each
// slide noteOn would add per-event attack emphasis with zero impact on
// portamento. See docs/revision_roadmap.md D50 v2 follow-ups.
var WILD_GLISS_VEL = 22;

// D51 — leap-alternation tolerance. D48 enforced strict N=1 (every leap
// immediately followed by a slide), which produced the user's stated rule
// but cost the perceived attack density of pre-D48 leap-clusters: post-D48
// the Markov stationary distribution gave only ~33% leaps (the events with
// audible attacks at vel 70), down from ~50% pre-D48. User reports D48
// "lobotomized" the wild gliss density. Relaxing tolerance to N=2 allows
// leap → leap → forced-slide patterns alongside leap → slide, restoring
// some leap-cluster density while still preventing the egregious 3+ leap
// chains that originally read as "consecutive non-gliss notes."
//
// Phrase anchor no longer seeds the counter as 1 — first event after the
// anchor is fully natural (could be a dramatic leap-from-anchor opening,
// which the user's original wild character relied on).
var MAX_CONSECUTIVE_LEAPS = 1;

// D47 (Phrase Dynamic Arcs, Phase 1) — sustained multi-note complexes
// (C2/C3/C4/C8) replace the legacy 3-stage attack/peak/sustain CC 11 envelope
// with a single linear ramp across the full phrase duration. Direction
// (cresc / dim) comes from the face envelope: swell → cresc TO the K-dynamic,
// fade/burst → dim FROM the K-dynamic. ARC_FLOOR is the soft endpoint as a
// fraction of inst.peakExpr (the K-dynamic ceiling already baked from
// INTENSITY_MAP × path × env peakMult); ARC_CEIL is the loud endpoint. Tune
// ARC_FLOOR upward if the cresc-start feels too quiet (kills SWAM's bow
// excitation at low expr values) or downward if the swell range feels
// compressed. pluck/stab/drone faces (isSingle) and gliss complexes
// (C5/C6/C7) keep their existing envelope path — single notes don't have an
// arc, gliss already owns its own contour. See CLAUDE.md § Bridge Invariants
// and docs/research_notes.md § Phrase Dynamic Arcs.
var ARC_FLOOR = 0.30;
var ARC_CEIL  = 1.00;
var ARC_COMPLEXES = { 2: true, 3: true, 4: true, 8: true };

function legatoNoteOverlap(inst, pitch, vel, overlapMs) {
	var oldNotes = inst.activeNotes.slice();
	noteOn(inst, pitch, vel);
	inst.activeNotes.push(pitch);

	if (oldNotes.length > 0) {
		scheduleAt(inst, overlapMs, function() {
			for (var i = 0; i < oldNotes.length; i++) {
				noteOff(inst, oldNotes[i]);
				var idx = inst.activeNotes.indexOf(oldNotes[i]);
				if (idx >= 0) inst.activeNotes.splice(idx, 1);
			}
		});
	}
}

function legatoNote(inst, pitch, vel) {
	legatoNoteOverlap(inst, pitch, vel, LEGATO_OVERLAP_MS);
}

var GLISS_VEL = 18;
// `vel` overrides GLISS_VEL when provided — used by C5 wild gliss (D50 v2)
// to bump slide-target velocity slightly above the default while staying
// well under SWAM's Portamento Control (Velocity → P.MaxTime) threshold
// that would shrink portamento time to zero. C6/C7 omit it and get default.
// `accent` (D52) spikes CC 18 (Bow Pressure Accent) just before the noteOn
// for a per-event attack character without touching velocity. Reset to 0
// after BPA_RESET_MS so subsequent events aren't affected.
function glissNote(inst, pitch, vel, accent) {
	if (accent && HAS_BOW_PRESS_ACCENT) {
		ccForce(inst, CC.BOW_PRESS_ACCENT, accent);
	}
	legatoNoteOverlap(inst, pitch, vel || GLISS_VEL, GLISS_OVERLAP_MS);
	if (accent && HAS_BOW_PRESS_ACCENT) {
		scheduleAt(inst, BPA_RESET_MS, function() {
			ccForce(inst, CC.BOW_PRESS_ACCENT, 0);
		});
	}
}

// D46 — string-crossing geometry.
//
// SWAM Cello is a physical-modeling instrument. Real cellos have four strings,
// and the Mono Poly Release portamento engine slides cleanly only when both
// source and target reach a single string. A cross-string overlap engages
// SWAM's portamento state internally then bails to a string-cross leap when it
// can't reach the target — audibly a leap, but the GUI shows a residual
// portamento attempt that doesn't match the sound. To make MIDI intent
// unambiguous, the bridge classifies every gliss step:
//
//   sameString(src, dst) === true  → emit overlap (portamento engages cleanly)
//   sameString(src, dst) === false → emit clean noteOff → gap → noteOn (string
//                                    crossing; SWAM doesn't try to portamento)
//
// Practical playable ranges per string (MIDI), tuned to slide-comfortable
// positions (not extreme thumb positions). A real cellist *could* play higher
// on each string, but the slide rarely engages cleanly past these bounds.
var CELLO_STRINGS = [
	{ name: 'C', open: 36, hi: 55 },  // C2..G3
	{ name: 'G', open: 43, hi: 62 },  // G2..D4
	{ name: 'D', open: 50, hi: 69 },  // D3..A4
	{ name: 'A', open: 57, hi: 89 }   // A3..F6 (full upper range)
];

// True if at least one string's playable range contains both pitches.
function sameString(p1, p2) {
	for (var i = 0; i < CELLO_STRINGS.length; i++) {
		var s = CELLO_STRINGS[i];
		if (p1 >= s.open && p1 <= s.hi && p2 >= s.open && p2 <= s.hi) return true;
	}
	return false;
}

// D48 — pick a pitch on one of `sourcePitch`'s strings, ≥ minLeap semitones
// from source, prefer direction toward `preferTarget` so the random contour
// intent isn't reversed. Used by glissStep to enforce the user's mental model:
// "every note in wild gliss should be gliding to or from somewhere" — every
// leap (and the phrase anchor) must be followed by a same-string slide.
//
// When source sits in a multi-string overlap zone (50–55: C/G/D; 57–62:
// G/D/A), the candidate strings are shuffled so trajectory isn't biased
// toward the lowest-indexed string. This broadens the gliss target
// distribution and keeps wild gliss from clustering on one string.
//
// Returns null only when source is at the extreme of every string it sits on
// with no minLeap headroom in either direction (extremely rare in cello range).
function nudgeToSameString(sourcePitch, preferTarget, minLeap) {
	var preferUp = preferTarget >= sourcePitch;

	var candidates = [];
	for (var i = 0; i < CELLO_STRINGS.length; i++) {
		var s = CELLO_STRINGS[i];
		if (sourcePitch >= s.open && sourcePitch <= s.hi) candidates.push(s);
	}
	if (candidates.length === 0) return null;

	for (var k = candidates.length - 1; k > 0; k--) {
		var j = Math.floor(Math.random() * (k + 1));
		var tmp = candidates[k]; candidates[k] = candidates[j]; candidates[j] = tmp;
	}

	for (var pass = 0; pass < 2; pass++) {
		var dir = (pass === 0) ? (preferUp ? 1 : -1) : (preferUp ? -1 : 1);
		for (var ci = 0; ci < candidates.length; ci++) {
			var cs = candidates[ci];
			var lo, hi;
			if (dir > 0) { lo = sourcePitch + minLeap; hi = cs.hi; }
			else         { lo = cs.open;               hi = sourcePitch - minLeap; }
			if (hi >= lo) return lo + Math.floor(Math.random() * (hi - lo + 1));
		}
	}
	return null;
}

// Cross-string leap velocity (medium-articulated, distinct from GLISS_VEL=18
// which signals "slide me" to SWAM via low-velocity overlap).
var LEAP_VEL = 70;

// Gap between source noteOff and target noteOn for a cross-string leap.
// Must be > 0 and noticeably larger than GLISS_OVERLAP_MS so SWAM
// unambiguously sees a discrete note change (no portamento attempt).
var LEAP_GAP_MS = 50;

// leapStep — emit a clean string-crossing leap. Kills the source note(s)
// immediately, waits LEAP_GAP_MS, then fires the target as a fresh noteOn at
// LEAP_VEL. SWAM sees no overlap → no portamento attempt → GUI cleanly shows
// the new note (and string).
function leapStep(inst, targetPitch) {
	var oldNotes = inst.activeNotes.slice();
	for (var i = 0; i < oldNotes.length; i++) {
		noteOff(inst, oldNotes[i]);
	}
	inst.activeNotes = [];
	var hp = humanPitch(targetPitch);
	scheduleAt(inst, LEAP_GAP_MS, function() {
		noteOn(inst, hp, LEAP_VEL);
		inst.activeNotes.push(hp);
	});
}

// ----------------------------------------------------------------
// GLISS INVARIANT (D42 — see CLAUDE.md § Bridge Invariants)
// ----------------------------------------------------------------
// Every C5/C6/C7 voice MUST emit ≥1 glissStep so SWAM's Mono Poly
// Release detector sees at least one overlap and produces a slide.
// glissStep is the ONLY path by which gliss complexes emit their
// subsequent pitches; it guarantees:
//   (a) the target pitch is ≥minLeap away from source (same-pitch
//       overlaps produce no audible slide — SWAM slides to the same
//       pitch → zero-length slide);
//   (b) glissOverlapCount is incremented so scheduleRelease's offT
//       can assert the invariant held.
//
// Face envelopes / intensity / regime may scale how many gliss steps
// a phrase emits, but may NEVER set the count to 0 for a gliss
// complex — if they need to collapse the phrase, they must still
// leave one glissStep call standing. CLAUDE.md enforces this.

// Coerce targetPitch to be at least minLeap semitones away from
// sourcePitch, clamped to cello range. If the clamped direction
// still can't achieve the leap (we're in a tight corner of the
// cello range), flip direction so we always land on a pitch
// outside the dead zone.
function enforceLeap(sourcePitch, targetPitch, minLeap) {
	if (Math.abs(targetPitch - sourcePitch) >= minLeap) return targetPitch;
	var dir = (targetPitch >= sourcePitch) ? 1 : -1;
	var p = clamp(sourcePitch + dir * minLeap, CELLO_MIN, CELLO_MAX);
	if (Math.abs(p - sourcePitch) < minLeap) {
		p = clamp(sourcePitch - dir * minLeap, CELLO_MIN, CELLO_MAX);
	}
	return p;
}

// Fire one gliss step. Coerces minimum leap, then dispatches:
//   same-string  → glissNote (overlap → SWAM portamento engages)  → glissOverlapCount++
//   cross-string → leapStep  (clean noteOff → gap → noteOn)        → glissLeapCount++
// D46: explicit dispatch keeps SWAM out of the "tried to portamento, couldn't
// reach target on this string, GUI shows residual portamento state without
// the audible slide" failure mode. Both counters feed the D42 invariant
// (totalEvents = slides + leaps must be ≥ 1 per gliss-complex voice).
// D48 + D51: leap-alternation with tolerance. After MAX_CONSECUTIVE_LEAPS
// consecutive leaps, the next cross-string outcome is nudged to same-string
// to force a slide — caps leap-clusters while still allowing short leap
// runs that contributed to pre-D48 wild-density character. With N=2, runs
// of 1 or 2 leaps are natural; 3+ would-be runs trigger the nudge.
// `glissVel` (D50 v2) overrides the default GLISS_VEL for the slide branch
// only — passed by C5 wild gliss for slight slide audibility. C6/C7 omit it.
// `accent` (D52) is forwarded to glissNote for per-slide bow pressure
// accent — passed by C5 to give each slide an audible attack moment.
// Leap branch ignores it (LEAP_VEL=70 already produces a clear attack).
// Returns the actual (post-coercion) pitch so callers can chain.
function glissStep(inst, sourcePitch, targetPitch, minLeap, glissVel, accent) {
	var p = enforceLeap(sourcePitch, targetPitch, minLeap);
	if ((inst.consecutiveLeapCurrent | 0) >= MAX_CONSECUTIVE_LEAPS && !sameString(sourcePitch, p)) {
		var nudged = nudgeToSameString(sourcePitch, p, minLeap);
		if (nudged != null) p = nudged;
	}
	if (sameString(sourcePitch, p)) {
		glissNote(inst, humanPitch(p), glissVel, accent);
		inst.glissOverlapCount = (inst.glissOverlapCount | 0) + 1;
		inst.lastWasLeap = false;
		inst.consecutiveLeapCurrent = 0;
	} else {
		leapStep(inst, p);
		inst.glissLeapCount = (inst.glissLeapCount | 0) + 1;
		inst.lastWasLeap = true;
		inst.consecutiveLeapCurrent = (inst.consecutiveLeapCurrent | 0) + 1;
		if (inst.consecutiveLeapCurrent > (inst.consecutiveLeapMax | 0)) {
			inst.consecutiveLeapMax = inst.consecutiveLeapCurrent;
		}
	}
	return p;
}

// D45 — schedule `maxCount` gliss events spread between `firstMs` and
// `tailEnd`, but never closer together than `minSpacingMs`. If the
// requested count can't fit at min spacing, returns fewer entries —
// caller should treat the returned array's length as authoritative.
// The first event is always at `firstMs` (D43 immediate-first-gliss
// invariant). Subsequent events use `max(idealSpacing, minSpacingMs)`,
// so dense / short phrases get clipped count instead of leap-collapse.
function glissSchedule(maxCount, firstMs, tailEnd, minSpacingMs) {
	var times = [firstMs];
	if (maxCount <= 1) return times;
	var available = tailEnd - firstMs;
	var idealSpacing = available / (maxCount - 1);
	var spacing = Math.max(minSpacingMs, idealSpacing);
	for (var i = 1; i < maxCount; i++) {
		var t = firstMs + Math.round(i * spacing);
		if (t > tailEnd) break;
		times.push(t);
	}
	return times;
}

// ----------------------------------------------------------------
// DOUBLE STOPS (D43, 2026-04-23)
// ----------------------------------------------------------------
// Cellists play double stops — two strings bowed/plucked together — as a
// routine expressive device. Our phrase generators had been strictly
// monophonic despite C2/C3/C4/C8 already setting Bow Polyphony = Double/Hold
// (page-modifier CC 81) in the COMPLEX table. The control plane was ready;
// the content layer never used it.
//
// maybeDoubleStop fires a companion noteOn alongside a main pitch with
// probability `p`. The companion is pushed onto inst.activeNotes so the
// next legato overlap, scheduleRelease, stealInstance, or allNotesOff
// tears both pitches down together — no leaks, no stuck notes.
//
// Gliss complexes (C5/C6/C7) deliberately DO NOT use this: Bow Polyphony
// = Mono Poly Release mode would reinterpret the second noteOn as a slide
// target, so a "double stop" on a gliss phrase becomes just another gliss.
// If double-stop gliss is wanted later, it needs its own path with
// different bow-polyphony state.

// Musical cello double-stop intervals (semitones). Weighted toward perfect
// 4th / 5th / octave and major-6th — the "open string + stopped note"
// double stops that ring most naturally on a real cello.
var DOUBLE_STOP_INTERVALS = [3, 4, 5, 7, 8, 9, 12];

// Pick a companion pitch for a double stop paired with `mainPitch`.
// Direction biased by register so both pitches land in comfortable
// cello double-stop range (MIDI 36–77). Returns null if no usable
// companion fits (never happens inside CELLO_MIN..CELLO_MAX in practice).
function doubleStopCompanion(mainPitch) {
	var interval = DOUBLE_STOP_INTERVALS[Math.floor(Math.random() * DOUBLE_STOP_INTERVALS.length)];
	var dirPref;
	if (mainPitch >= 60)      dirPref = -1;  // C4+: drop the companion below
	else if (mainPitch <= 48) dirPref =  1;  // C3-: raise the companion above
	else                      dirPref = (Math.random() < 0.5) ? 1 : -1;

	var candidate = mainPitch + dirPref * interval;
	if (candidate < CELLO_MIN || candidate > 77) {
		candidate = mainPitch - dirPref * interval;
	}
	if (candidate < CELLO_MIN || candidate > CELLO_MAX) return null;
	if (candidate === mainPitch) return null;
	return candidate;
}

// Stochastic double stop. With probability `p`, emits a companion noteOn
// at 85% of the main velocity. The companion is registered in
// inst.activeNotes so the next legato overlap / release / steal / panic
// cleans it up the same way as any main pitch.
function maybeDoubleStop(inst, mainPitch, vel, p) {
	if (Math.random() >= p) return;
	var companion = doubleStopCompanion(mainPitch);
	if (companion == null) return;
	noteOn(inst, companion, Math.max(1, Math.round(vel * 0.85)));
	inst.activeNotes.push(companion);
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
// A face-motion override forces the direction (reseeding the index to the
// appropriate boundary if there isn't runway); 'static' / 'oscillate' /
// null fall back to the default auto-flip-at-boundary behaviour.
function commitSieveWalk(count, motion) {
	var s = state.sieve;
	if (s.length === 0) return;
	if (motion === 'up') {
		state.sieveDir = 1;
		if (state.sieveIdx + count - 1 >= s.length) state.sieveIdx = 0;
		return;
	}
	if (motion === 'down') {
		state.sieveDir = -1;
		if (state.sieveIdx - (count - 1) < 0) state.sieveIdx = s.length - 1;
		return;
	}
	if (state.sieveDir > 0 && state.sieveIdx + count - 1 >= s.length) {
		state.sieveDir = -1;
		state.sieveIdx = s.length - 1;
	} else if (state.sieveDir < 0 && state.sieveIdx - (count - 1) < 0) {
		state.sieveDir = 1;
		state.sieveIdx = 0;
	}
}

// ================================================================
// FACE PHRASE-SHAPE HELPERS (Phase A1 sculpt pass, 2026-04-21 / D42 2026-04-23)
// ================================================================
// faceShapedCount: the phrase's note count after applying the face
//   envelope's isSingle override (pluck/stab/drone → 1) or countMult
//   (burst → ×1.8).
//
//   forGliss=true (called from phraseC5/C6/C7): the minimum returned
//   count is 1 SUBSEQUENT gliss note, not 0. The gliss invariant
//   (CLAUDE.md § Bridge Invariants / D42) requires every C5/C6/C7
//   voice to emit at least one anchor→target slide; face envelope
//   modulates WHERE the slide sits inside the phrase but may not
//   erase the slide itself. Pluck face on C5 still slides — just in
//   a short plucky window rather than a salvo.
//
// stepVelScale: per-step velocity scalar for a multi-note phrase so
//   swell crescendos across the rebow chain, fade decays, and
//   accent-first (stab/burst) lands a hot first note. Returns 1.0 for
//   single-note phrases or 'flat' curves.
function faceShapedCount(inst, baseLo, baseHi, forGliss) {
	var prof = inst.faceEnvProfile;
	if (prof && prof.isSingle) return forGliss ? 1 : 1;
	var raw = phraseCount(inst, baseLo, baseHi);
	if (prof && prof.countMult && prof.countMult !== 1.0) {
		raw = clamp(Math.round(raw * prof.countMult), baseLo, 12);
	}
	return raw;
}

function stepVelScale(velCurve, i, count) {
	if (count <= 1) return 1.0;
	var t = i / (count - 1);
	switch (velCurve) {
		case 'cresc':        return 0.72 + 0.55 * t;
		case 'dim':          return 1.27 - 0.55 * t;
		case 'accent-first': return (i === 0) ? 1.22 : 0.88;
		default:             return 1.0;
	}
}

// ================================================================
// PHRASE GENERATORS (per-instance)
// ================================================================

// C1: Pizzicato cloud — short plucked notes, no legato
function phraseC1(inst, vel, dur) {
	var count = faceShapedCount(inst, 2, 5, false);
	var velCurve = (inst.faceEnvProfile && inst.faceEnvProfile.velCurve) || 'flat';
	var spread = Math.min(dur * 1000, 700);

	for (var i = 0; i < count; i++) {
		(function(idx, stepCount) {
			var delay = idx === 0 ? 0 : rrand(20, Math.round(spread));
			scheduleAt(inst, delay, function() {
				var p = humanPitch(pickPitch(1, inst));
				var v = humanVel(vel * stepVelScale(velCurve, idx, stepCount));
				noteOn(inst, p, v);
				inst.activeNotes.push(p);
				scheduleAt(inst, rrand(60, 220), function() {
					noteOff(inst, p);
					var pidx = inst.activeNotes.indexOf(p);
					if (pidx >= 0) inst.activeNotes.splice(pidx, 1);
				});
			});
		})(i, count);
	}
	scheduleRelease(inst, dur);
}

// C2: OrderedCloudAscDesc — bowed legato cloud along committed direction.
// D43: ~35% of rebow steps (after the first) land as double stops. Bow
// Polyphony = Double/Hold already set via setupComplex; companion noteOn
// rides alongside the main legato note and is cleaned up by the next
// rebow's overlap window.
function phraseC2(inst, vel, dur) {
	var hi = state.regime === "burst" ? 6 : 5;
	var count = faceShapedCount(inst, 3, hi, false);
	var velCurve = (inst.faceEnvProfile && inst.faceEnvProfile.velCurve) || 'flat';
	if (count >= 2) commitSieveWalk(count, inst.faceMotion);
	var spacing = Math.max(90, Math.round(dur * 1000 / (count + 1)));
	for (var i = 0; i < count; i++) {
		(function(idx, stepCount) {
			scheduleAt(inst, idx * spacing + humanDelay(), function() {
				var v = humanVel(vel * stepVelScale(velCurve, idx, stepCount));
				var main = humanPitch(pickPitch(2, inst));
				legatoNote(inst, main, v);
				if (idx >= 1) maybeDoubleStop(inst, main, v, 0.35);
			});
		})(i, count);
	}
	scheduleRelease(inst, dur);
}

// C3: OrderedCloudFlat — legato rebows hovering at constant register. D43:
// ~40% double-stop rate. C3 is the most sustained-flat complex, so double
// stops here read as the cleanest "held interval" effect.
function phraseC3(inst, vel, dur) {
	var count = faceShapedCount(inst, 3, 5, false);
	var velCurve = (inst.faceEnvProfile && inst.faceEnvProfile.velCurve) || 'flat';
	var durMs = Math.max(400, dur * 1000);
	var spacing = Math.max(110, Math.round(durMs / (count + 1)));
	var center = pickPitch(3, inst);
	for (var i = 0; i < count; i++) {
		(function(idx, stepCount) {
			scheduleAt(inst, idx * spacing + humanDelay(), function() {
				var jitter = (Math.random() < 0.5) ? 0 : (Math.random() < 0.5 ? -1 : 1);
				var p = clamp(center + jitter, CELLO_MIN, CELLO_MAX);
				var v = humanVel(vel * stepVelScale(velCurve, idx, stepCount));
				var main = humanPitch(p);
				legatoNote(inst, main, v);
				if (idx >= 1) maybeDoubleStop(inst, main, v, 0.40);
			});
		})(i, count);
	}
	scheduleRelease(inst, dur);
}

// C4: IonizedAtom — harmonic attacks clustered near central pitch with
// random-timed arrival across the phrase ("atom + ionized timing")
function phraseC4(inst, vel, dur) {
	var count = faceShapedCount(inst, 2, 5, false);
	var velCurve = (inst.faceEnvProfile && inst.faceEnvProfile.velCurve) || 'flat';
	var spread = Math.max(300, dur * 1000);
	var s = state.sieve;
	var cmx = COMPLEX[4];
	var base = (s.length > 0) ? s[Math.floor(s.length / 2)] : 60;
	var faceTr = inst.faceTranspose || 0;
	var loReg = Math.max(24, cmx.register.lo + (inst.path === "V2" ? -12 : 0));
	var hiReg = Math.min(CELLO_MAX, cmx.register.hi);
	for (var i = 0; i < count; i++) {
		(function(idx, stepCount) {
			var delay = idx === 0 ? 0 : rrand(40, Math.round(spread));
			scheduleAt(inst, delay, function() {
				var jitter = rrand(-2, 2);
				var p = foldToRange(base + inst.transpose + faceTr + jitter, loReg, hiReg);
				var v = clamp(humanVel(vel * stepVelScale(velCurve, idx, stepCount)) - 15, 25, 100);
				// Capture the humanised pitch once: noteOn / activeNotes /
				// noteOff must all reference the SAME pitch number, otherwise
				// SWAM gets a noteOn it never sees a noteOff for (CC 120 on
				// the next steal masks it audibly) and the dashboard pairs
				// noteOn at hp with no matching noteOff at p — visible as a
				// rectangle that grows forever until the 45 s watchdog.
				var hp = humanPitch(p);
				noteOn(inst, hp, v);
				inst.activeNotes.push(hp);
				scheduleAt(inst, rrand(180, 400), function() {
					noteOff(inst, hp);
					var pidx = inst.activeNotes.indexOf(hp);
					if (pidx >= 0) inst.activeNotes.splice(pidx, 1);
				});
			});
		})(i, count);
	}
	scheduleRelease(inst, dur);
}

// C5: wild gliss — dense salvo of ≥8-semi leaps. glissStep GUARANTEES the
// leap and the overlap that triggers SWAM's Mono Poly Release slide. D43:
// first slide fires at FIRST_GLISS_MS so even a stolen-short phrase reads
// as gliss. D45: subsequent slides spaced ≥ MIN_GLISS_SPACING_MS so SWAM
// has time to actually engage portamento between events — without the
// floor, dense short phrases collapsed into fast leaps. D42: face envelope
// scales phrase density via faceShapedCount but may not zero it.
//
// D49: hard floor of WILD_MIN_COUNT events regardless of face envelope or
// intensity. Pre-D49 `Math.max(1, ...)` honored faceShapedCount's isSingle
// collapse (pluck/stab/drone → 1) and its low-intensity floor — wild gliss
// on a stab face produced a single anchor → slide pair, audibly "1 glissando"
// which by user definition is not wild. Wildness is the complex's identity;
// the face's envelope can shape how the salvo sits in time (pluck = short
// percussive salvo, drone = long sustained salvo via durationBias) but cannot
// reduce the count below what reads as wild. The face's expressive shape
// still applies via durationBias / velCurve / releaseMult.
function phraseC5(inst, vel, dur) {
	var velCurve = (inst.faceEnvProfile && inst.faceEnvProfile.velCurve) || 'flat';
	var requestedCount = Math.max(WILD_MIN_COUNT, faceShapedCount(inst, 4, 9, true));
	var MIN_LEAP = 8;
	var lastPitchRef = { p: pickPitch(5, inst) };

	var durMs = dur * 1000;
	var tailEnd = Math.max(FIRST_GLISS_MS + 200, durMs * 0.92);
	var times = glissSchedule(requestedCount, FIRST_GLISS_MS, tailEnd, MIN_GLISS_SPACING_MS);
	var count = times.length;

	// Anchor seed: pre-load consecutiveLeapCurrent to MAX_CONSECUTIVE_LEAPS
	// so the first glissStep is forced to slide. Wild gliss must always
	// start with a slide (matching ord gliss / C6) — anchor → slide is the
	// "always begins with a gliss" guarantee. Subsequent events are natural
	// (slides or leaps up to MAX_CONSECUTIVE_LEAPS in a row, then forced
	// slide). Without this seed, the first event could be a random leap and
	// the user would hear "anchor + leap target sustaining" with no gliss.
	inst.consecutiveLeapCurrent = MAX_CONSECUTIVE_LEAPS;

	legatoNote(inst, humanPitch(lastPitchRef.p), humanVel(vel * stepVelScale(velCurve, 0, count + 1)));

	for (var i = 0; i < count; i++) {
		(function(tMs) {
			scheduleAt(inst, tMs, function() {
				var p = pickPitch(5, inst);
				var attempts = 0;
				while (Math.abs(p - lastPitchRef.p) < MIN_LEAP && attempts < 12) { p = pickPitch(5, inst); attempts++; }
				lastPitchRef.p = glissStep(inst, lastPitchRef.p, p, MIN_LEAP, WILD_GLISS_VEL, WILD_GLISS_BPA);
			});
		})(times[i]);
	}
	scheduleRelease(inst, dur);
}

// C6: OrderedSlidingAscDesc — portamento steps along the sieve. idx 0 =
// anchor legato at t=0; idx 1 = first slide at FIRST_GLISS_MS (D43);
// idx ≥2 distribute through the phrase tail with ≥ MIN_GLISS_SPACING_MS
// spacing (D45). D42: requested count forced to ≥2 even when face isSingle
// so the slide invariant holds; MIN_LEAP = 1 honors the sieve walk.
function phraseC6(inst, vel, dur) {
	var velCurve = (inst.faceEnvProfile && inst.faceEnvProfile.velCurve) || 'flat';
	var requestedCount = faceShapedCount(inst, 3, 6, false);
	if (requestedCount < 2) requestedCount = 2;  // D42 gliss invariant
	var durMs = dur * 1000;
	var tailEnd = Math.max(FIRST_GLISS_MS + 200, durMs * 0.9);
	var slideTimes = glissSchedule(requestedCount - 1, FIRST_GLISS_MS, tailEnd, MIN_GLISS_SPACING_MS);
	var totalCount = 1 + slideTimes.length;
	commitSieveWalk(totalCount, inst.faceMotion);

	var lastPitchRef = { p: null };

	// Anchor — fires first, sets lastPitchRef for the slide chain.
	scheduleAt(inst, humanDelay(), function() {
		lastPitchRef.p = pickPitch(6, inst);
		var v = humanVel(vel * stepVelScale(velCurve, 0, totalCount));
		legatoNote(inst, humanPitch(lastPitchRef.p), v);
	});

	// Slides — read lastPitchRef.p set by the anchor / previous slide.
	for (var i = 0; i < slideTimes.length; i++) {
		(function(tMs) {
			scheduleAt(inst, tMs + humanDelay(), function() {
				var p = pickPitch(6, inst);
				lastPitchRef.p = glissStep(inst, lastPitchRef.p, p, 1);
			});
		})(slideTimes[i]);
	}
	scheduleRelease(inst, dur);
}

// C7: sustained + micro-drifts — deep breath-like floating. D43: first drift
// fires at FIRST_GLISS_MS so the character reads as "anchor with breath-drift"
// immediately. D45: drifts spaced ≥ MIN_GLISS_SPACING_MS so SWAM completes
// each slide before the next begins. D42: isSingle faces still produce ≥1
// drift — the gliss invariant outranks envelope collapse. Face motion
// up/down biases direction; burst's countMult thickens the drift count.
function phraseC7(inst, vel, dur) {
	var isSingle = (inst.faceEnvProfile && inst.faceEnvProfile.isSingle) === true;
	var p1 = pickPitch(7, inst);
	legatoNote(inst, humanPitch(p1), humanVel(vel));
	var driftCount = isSingle
		? 1
		: 1 + (intensityDensity(inst) >= 1.1 ? rrand(1, 2) : 0);
	if (!isSingle && inst.faceEnvProfile && inst.faceEnvProfile.countMult > 1.0) {
		driftCount = Math.min(6, Math.round(driftCount * inst.faceEnvProfile.countMult));
	}
	var motionDir = (inst.faceMotion === 'up') ? 1 : (inst.faceMotion === 'down') ? -1 : 0;
	var durMs = dur * 1000;
	// D53 — C7 first drift fires at FIRST_GLISS_MS_C7 (= 30 ms) so the slide
	// kicks in almost immediately after the anchor, distinguishing C7's
	// "continuous floating" character from C6's "deliberate stepping". The
	// slow portamento (COMPLEX[7].portamento.time = 250 ms/semi) means each
	// drift then audibly exposes microtonal pitch change for 250–500 ms.
	var tailEnd = Math.max(FIRST_GLISS_MS_C7 + 250, durMs * 0.88);
	var times = glissSchedule(driftCount, FIRST_GLISS_MS_C7, tailEnd, MIN_GLISS_SPACING_MS);

	// D53 — drift sign alternates per drift index (when face motion is
	// neutral) so the trajectory rocks around the anchor in zigzag, evoking
	// inhale/exhale rather than C6's monotonic sieve walk. Random starting
	// direction so phrases don't always begin the same way. When face motion
	// has a bias (up/down), drifts go monotonically in that direction —
	// face semantics override the rocking pattern. Magnitude rrand(1, 2)
	// (was rrand(-3, 3)): caps swings between consecutive drifts at 4
	// semitones (was 6), reads as "drift" not "wandering slide", and
	// average ±1.2 keeps the character subtle.
	var phraseStartSign = (Math.random() < 0.5) ? 1 : -1;
	for (var i = 0; i < times.length; i++) {
		(function(tMs, idx) {
			scheduleAt(inst, tMs, function() {
				var lo = (inst.path === "V2") ? 24 : CELLO_MIN;
				var sign = (motionDir !== 0)
					? motionDir
					: phraseStartSign * ((idx % 2 === 0) ? 1 : -1);
				var mag = rrand(1, 2);
				var p2 = clamp(p1 + sign * mag, lo, CELLO_MAX);
				glissStep(inst, p1, p2, 1);
			});
		})(times[i], i);
	}
	scheduleRelease(inst, dur);
}

// C8: ponticello tremolo cluster — re-bows on same pitch. D43: ~30% chance
// the entire phrase is a double-stop tremolo (sul pont tremolo double-stop
// is a classic cello cluster effect). The companion is chosen ONCE per
// phrase and reused across every rebow so the cluster reads as a fixed
// interval, not a rotating set.
function phraseC8(inst, vel, dur) {
	var velCurve = (inst.faceEnvProfile && inst.faceEnvProfile.velCurve) || 'flat';
	var count = faceShapedCount(inst, 2, 4, false);
	var mainPitch = pickPitch(8, inst);
	var companion = (Math.random() < 0.30) ? doubleStopCompanion(mainPitch) : null;
	var spacing = Math.max(150, Math.round(dur * 1000 / (count + 1)));
	for (var i = 0; i < count; i++) {
		(function(idx, stepCount) {
			scheduleAt(inst, idx * spacing + humanDelay(), function() {
				var curveScale = stepVelScale(velCurve, idx, stepCount);
				var v = clamp(humanVel(vel * curveScale) + 8 - idx * 3, 40, 120);
				var main = humanPitch(mainPitch);
				legatoNote(inst, main, v);
				if (companion != null) {
					noteOn(inst, companion, Math.max(1, Math.round(v * 0.85)));
					inst.activeNotes.push(companion);
				}
			});
		})(i, count);
	}
	scheduleRelease(inst, dur);
}

// ================================================================
// FACE SIGNATURES (Phase A1)
// ================================================================
// FACE_MAP, ENV_PROFILE, ART_OFF_VEL, MOTION_NUDGE are declared in
// gen_includes.js (source: src/face-gesture.ts → buildFaceMap, and
// src/swam-mapping.ts). See docs/swam_cello_reference.md and the TS
// type definitions for the semantics of each field.

// /xk/face fires BEFORE /xk/voice; stash the signature globally so
// handleVoice can snapshot it onto the newly-allocated instance.
function handleFace(face) {
	// Emit detected face-move on outlet 3 first so the Max-side display
	// updates regardless of whether this face has a known signature.
	outlet(MOVES_OUTLET, "face", face);

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

	// Hard ceiling — Xenakis V2 K3/K5 are intrinsically 30 s. Without this,
	// 30 s × face drone bias (1.8×) stacked with legacy phrase multipliers
	// could leave voices scheduled to fade out nearly two minutes after the
	// turn. 30 s is already long enough to be perceived as "sustained."
	duration = Math.min(duration, 30);

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
	inst.faceEnvelope     = state.faceEnvelope;
	inst.faceMotion       = state.faceMotion;
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

	// Validate complex before flipping to PLAYING — otherwise an unknown
	// type (off-by-one from future work, corrupt OSC, etc.) would leave the
	// instance parked in PLAYING with no phrase + no release to clear it,
	// blocking future allocations ("zombie"). Fall through to IDLE instead.
	var cmx = COMPLEX[complexType];
	if (!cmx) {
		allNotesOff(inst);
		inst.status = 'IDLE';
		return;
	}

	inst.status = 'PLAYING';

	// D42 + D46 gliss invariant — reset slide + leap counters;
	// scheduleRelease's offT asserts ≥1 (slide OR leap) fired for C5/C6/C7
	// and logs the per-phrase breakdown.
	inst.glissOverlapCount = 0;
	inst.glissLeapCount = 0;
	inst.glissExpected = (complexType === 5 || complexType === 6 || complexType === 7);

	// D48 + D51 — leap-alternation with N=MAX_CONSECUTIVE_LEAPS tolerance.
	// Anchor no longer counts as a leap (D51 relaxation): consecutiveLeap
	// counter starts at 0 so the first event after the anchor is fully
	// natural — preserves the dramatic anchor → leap opening that was part
	// of pre-D48 wild character. lastWasLeap is now vestigial (the counter
	// is the source of truth) but maintained for readability.
	inst.lastWasLeap = false;
	inst.consecutiveLeapCurrent = 0;
	inst.consecutiveLeapMax = 0;

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

	// Defensive portamento re-assertion — per-instance every voice event.
	// SWAM v3 quirk: CC 5 (Portamento Time) is a no-op unless the plugin
	// sees a parameter *change event*. When setupComplex is skipped (same
	// complex as previous voice, e.g. C5 → C5), writing CC 5 to its current
	// value leaves stale Portamento Time state — gliss then fails and the
	// anchor sustains as a single note. Wiggle through 0 first so SWAM
	// re-latches; harmless when portamento is off (SWAM ignores CC 5).
	ccForce(inst, CC.PORTAMENTO_ON,   cmx.portamento.on ? 127 : 0);
	if (cmx.portamento.on) ccForce(inst, CC.PORTAMENTO_TIME, 0);
	ccForce(inst, CC.PORTAMENTO_TIME, cmx.portamento.time);

	// D44 — defensive Bow Polyphony re-assertion. Even when setupComplex
	// is skipped (same complex as previous voice), force CC 81 so SWAM
	// can never silently fall behind the bridge's cached state. Pre-D44,
	// a state drift between bridge and plugin meant double stops were
	// effectively never heard on C2/C3/C8 because the diff guard kept
	// suppressing the only CC that would have re-synced them.
	if (cmx.bowPoly != null && HAS_BOW_POLY_CC) {
		ccForce(inst, CC.BOW_POLYPHONY, BOW_POLY_CC_VAL[cmx.bowPoly]);
	}

	log("inst " + inst.id + " voice C" + complexType +
	    " face=" + (state.face || "-") +
	    "/" + (state.faceEnvelope || "-") +
	    "/" + (state.faceMotion || "-") +
	    " porta=" + (cmx.portamento.on ? "on" : "off") +
	    " time=" + cmx.portamento.time + " bow=" + Math.round(bowBase) + " int=" + intensity);

	var envForPhrase = cmx.exprEnv;
	if (inst.faceEnvProfile) {
		var fp = inst.faceEnvProfile;
		var aCoef = (fp.attackCoef  != null) ? fp.attackCoef  : 1.0;
		var pCoef = (fp.peakCoef    != null) ? fp.peakCoef    : 1.0;
		var sCoef = (fp.sustainCoef != null) ? fp.sustainCoef : 1.0;
		envForPhrase = {
			attack:        cmx.exprEnv.attack  * aCoef,
			peak:          cmx.exprEnv.peak    * pCoef,
			sustain:       cmx.exprEnv.sustain * sCoef,
			attackRampMs:  (cmx.exprEnv.attackRampMs  || 40)  * fp.attackMult,
			sustainRampMs:  cmx.exprEnv.sustainRampMs,
			releaseRampMs:  cmx.exprEnv.releaseRampMs
		};
	}
	// D47 — sustained multi-note complexes get a phrase-spanning linear
	// CC 11 arc (cresc TO K-dynamic / dim FROM K-dynamic) driven by face
	// envelope. Single-note faces (pluck/stab/drone, isSingle) and gliss
	// complexes (C5/C6/C7) keep the legacy 3-stage envelope — single notes
	// don't have an arc, gliss owns its own contour. phraseArcDir = null
	// in the fallback path so scheduleRelease's FAIL check stays silent.
	var arcDir = ARC_COMPLEXES[complexType] ? phraseArcDirection(inst) : null;
	if (arcDir) {
		schedulePhraseArc(inst, inst.peakExpr, arcDir, Math.max(duration * 1000, 250));
	} else {
		inst.phraseArcDir = null;
		scheduleExprEnvelope(inst, inst.peakExpr, envForPhrase, Math.max(duration * 1000, 250));
	}

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
// SPELL REACTIONS — harmonic-ping spells (oll-cross / sune / niklas /
// u-perm) allocate via the normal pool so they respect MAX_ACTIVE;
// accent spells (sexy-move / anti-sune) ride the most-recent voice so
// the accent lands on a currently-sounding cello.
// ================================================================

// Allocate a pool instance for a spell-triggered ping. Goes through the
// normal cap-aware allocator so the ping steals the oldest RELEASING /
// PLAYING when MAX_ACTIVE is hit — prevents spells from layering extra
// cellos on top of the 2-voice cap.
function allocateSpellPing() {
	var p = allocateInstance();
	p.status = 'PLAYING';
	p.lastVoiceTime = Date.now();
	return p;
}

function handleSpell(name) {
	log("spell: " + name);
	outlet(MOVES_OUTLET, "spell", name);
	var lastInst = instances[state.lastAllocatedInstance != null ? state.lastAllocatedInstance : 0];

	switch (name) {
		case "sexy-move":
			ccForce(lastInst, CC.BOW_PRESS_ACCENT, 110);
			scheduleAt(lastInst, 400, function() {
				ccForce(lastInst, CC.BOW_PRESS_ACCENT, 0);
				if (lastInst.activeComplex) setupComplex(lastInst, lastInst.activeComplex);
			});
			break;

		case "oll-cross":
			var inst0 = allocateSpellPing();
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
			var inst0 = allocateSpellPing();
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
			var inst0 = allocateSpellPing();
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
			var inst0 = allocateSpellPing();
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
	emitMidi(inst, statusCC(MIDI_CH), CC.TREMOLO_RATE, v);
	inst.ccCache[CC.TREMOLO_RATE] = v;
	log("tremLearn CC 80 = " + v + " (inst 0, clean single-shot for MIDI-Learn)");
}

function watchdogTick() {
	// Per-instance orphan-note check (D17). Fires if an instance has active
	// notes, no release scheduled, and has been silent for ≥ 3 s. The
	// phraseTasks array is append-only (completed tasks stay in it), so
	// gating on `phraseTasks.length === 0` would make the watchdog
	// practically inert — drop it.
	try {
		var now = Date.now();
		for (var i = 0; i < POOL_SIZE; i++) {
			var inst = instances[i];
			var hasNotes = inst.activeNotes.length > 0;
			var noRelease = (inst.releaseTask === null);
			var stale = (inst.lastVoiceTime > 0) && (now - inst.lastVoiceTime > 3000);
			if (hasNotes && noRelease && stale) {
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
// OSC ROUTING — addresses sourced from gen_includes.js (OSC table,
// originally src/osc-schema.ts). Dispatch switches on the address
// constant, so a rename on the TS side propagates through codegen with
// no hand-edit here.
// ================================================================
function anything() {
	var addr = messagename;
	var args = arrayfromargs(arguments);

	if      (addr === OSC.VOICE)         { handleVoice(args[0], args[1], args[2], args[3], args[4]); }
	else if (addr === OSC.FACE)          { handleFace(args[0]); }
	else if (addr === OSC.EXPR_TILT)     { handleExprTilt(args[0]); }
	else if (addr === OSC.EXPR_SPIN)     { handleExprSpin(args[0]); }
	else if (addr === OSC.EXPR_DEV)      { handleExprDev(args[0]); }
	else if (addr === OSC.EXPR_SCRAMBLE) { handleExprScramble(args[0]); }
	else if (addr === OSC.TETRA)         { handleTetra(args[0]); }
	else if (addr === OSC.PATH)          { handlePath(args[0]); }
	else if (addr === OSC.REGIME)        { handleRegime(args[0]); }
	else if (addr === OSC.RATE)          { handleRate(args[0]); }
	else if (addr === OSC.SIEVE)         { handleSieve.apply(this, args); }
	else if (addr === OSC.SPELL)         { handleSpell(args[0]); }
	else if (addr === OSC.SCRAMBLE)      { handleExprScramble(args[0]); }
	else if (addr === OSC.PANIC)         { handlePanic(); }
	else if (addr === OSC.TREM_LEARN)    { handleTremLearn(args[0]); }
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
	inst.faceEnvelope = null;
	inst.faceMotion = null;
	inst.faceEnvProfile = null;
	inst.faceOffVelOverride = null;
	inst.faceReleaseMult = 1.0;
	inst.phraseArcDir = null;
	inst.phraseArcStart = 0;
	inst.phraseArcEnd = 0;
	inst.lastWasLeap = false;
	inst.consecutiveLeapCurrent = 0;
	inst.consecutiveLeapMax = 0;
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
	// Wiggle CC 5 to force SWAM to register the parameter-change event —
	// without this initial kick, the first gliss complex voice can fire
	// CC 5 = target but SWAM's internal Portamento Time stays at whatever
	// the slider was before save (often 0). See setupComplex for the
	// same pattern on every complex switch.
	ccForce(inst, CC.PORTAMENTO_TIME, 64);
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

	// Phase E tier 2 — dashboard clears its pending-notes map on panic so a
	// stale noteon (lost UDP, or offline before a noteoff) doesn't hang in
	// the rolling score forever.
	outlet(ECHO_OUTLET, OSC.MIDI_PANIC);

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
	log("v5 ready — single SWAM instance (POOL_SIZE=" + POOL_SIZE + ")");
	startWatchdog();
}
