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
// per docs/swam/swam_cello_reference.md. No poly~ / polymidiin required.
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
outlets = 4;                    // 0 → midievent → [vst~ SWAM Cello], 1 → debug, 2 → MIDI echo, 3 → detected moves/algorithms
var MIDI_OUTLET  = 0;
var DEBUG_OUTLET = 1;
var ECHO_OUTLET  = 2;           // Phase E tier 2 — noteon/noteoff echo to relay (UDP 57122)
var MOVES_OUTLET = 3;           // 2026-04-24 — detected face-moves + cube-algorithm completions for Max-side display/routing

// Inlet / outlet tooltip labels — shown in Max on hover.
setinletassist(0,            "OSC /xk/* from relay (port 57121) + bang/on/off/debug");
setoutletassist(MIDI_OUTLET,  "midievent → [vst~ SWAM Cello 3]");
setoutletassist(DEBUG_OUTLET, "debug → [print xk_swam]");
setoutletassist(ECHO_OUTLET,  "/xk/midi/{noteon,noteoff,bendstep,expr,panic} → [udpsend 127.0.0.1 57122] → relay → dashboard rolling score");
setoutletassist(MOVES_OUTLET, "detected: 'face <L|L'|R|R'|...>' on every quarter-turn, 'algorithm <name>' on every algorithm match — wire to [route face algorithm]");

// Pulls in all data tables (OSC addresses, SWAM enums, CC band centers,
// INTENSITY_MAP, ENV_PROFILE, ART_OFF_VEL, MOTION_NUDGE, FACE_MAP,
// LEGATO_COMPLEX, REGIME_* multipliers, RATE_* pressure gains) generated from src/osc-schema.ts
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
// See docs/swam/swam_cello_reference.md §9.
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

// D59 — pitchbend range (semitones), MUST EXACTLY MATCH the SWAM
// preset's Master Tuning → Pitchbend Range setting (saved in
// xenakube_main.swam). MIDI pitchbend is a 14-bit wheel position with
// no semitone information; SWAM does the conversion using its preset
// value. If this constant says 24 but SWAM's preset is 2 (default),
// the bridge sends a value14 expecting 24-semi-scale interpretation
// but SWAM applies 2-semi-scale → audible bend is 12× weaker than
// visual → "leaping" perception (visual slope, audio barely moves
// then jumps to target via noteOn at end of bend). This has bitten
// us multiple times when the user forgot to save the SWAM preset
// after changing the range.
//
// D64 (2026-04-30) — set to 24 to match the user's reduced preset.
// On reload, [print xk_swam] logs this value; cross-check against
// SWAM's preset Pitchbend Range. Any mismatch sounds like leaping
// even when the bridge is bending correctly.
var PITCHBEND_RANGE_SEMI = 24;
// MIDI pitchbend center value (14-bit, 0..16383).
var PITCHBEND_CENTER = 8192;

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
	     // previous register:{ lo:36, hi:72 }
	    },
	2: { playMode:"bow", harmonics:HARMONICS.OFF, tremolo:TREMOLO.OFF,
	     exprEnv:{ attack:0.6, peak:1.0, sustain:0.85, release:0.4,
	               attackRampMs:45, sustainRampMs:120, releaseRampMs:140 },
	     vibrato:{ depth:35, rate:50 }, bowPos:52,
	     bowPressure:70, portamento:{ on:false, time:0 },
	     attackRamp:40, attackCtrl:55, tremoloRate:45,
	     // MONO_POLY_RELEASE (not DOUBLE_HOLD) so SWAM auto-releases the
	     // previously held note when phraseC2's next noteOn arrives. With
	     // portamento.on = false, that auto-release is a smooth-cut (NO
	     // glide, NO chord) — true cellistic monophonic legato. Guarantees
	     // C2 cannot produce accidental double-stops from any inter-note
	     // overlap (cap drift, humanDelay jitter, scheduling slop). Future
	     // INTENTIONAL double stops on C2 must explicitly flip CC 81 to
	     // DOUBLE_HOLD around the companion noteOn pair, not rely on
	     // emergent overlap. Static guard in test/max-bridge.test.ts.
	     bowPoly:BOW_POLY.MONO_POLY_RELEASE,
	     // previous register:{ lo:40, hi:64 }
	    },
	3: { playMode:"bow", harmonics:HARMONICS.OFF, tremolo:TREMOLO.OFF,
	     exprEnv:{ attack:0.5, peak:1.1, sustain:0.9, release:0.6,
	               attackRampMs:80, sustainRampMs:180, releaseRampMs:220 },
	     vibrato:{ depth:60, rate:45 }, bowPos:56,
	     bowPressure:55, portamento:{ on:false, time:0 },
	     attackRamp:85, attackCtrl:30, tremoloRate:35,
	     bowPoly:BOW_POLY.DOUBLE_HOLD,
	     // previous register:{ lo:36, hi:55 }
	    },
	4: { playMode:"bow", harmonics:HARMONICS.OCT, tremolo:TREMOLO.OFF,
	     exprEnv:{ attack:0.7, peak:0.75, sustain:0.6, release:0.3,
	               attackRampMs:30, sustainRampMs:90,  releaseRampMs:120 },
	     vibrato:{ depth:10, rate:60 }, bowPos:44,
	     bowPressure:30, portamento:{ on:false, time:0 },
	     attackRamp:30, attackCtrl:20, tremoloRate:55,
	     bowPoly:BOW_POLY.DOUBLE_HOLD,
	     // previous register:{ lo:60, hi:84 }
	    },
	5: { playMode:"bow", harmonics:HARMONICS.OFF, tremolo:TREMOLO.OFF,
	     exprEnv:{ attack:0.9, peak:1.1, sustain:0.7, release:0.3,
	               attackRampMs:35, sustainRampMs:100, releaseRampMs:120 },
	     vibrato:{ depth:25, rate:70 }, bowPos:55,
	     // D72.4 — same shape as C6 (D72): all slides via pitchbend wheel
	     // (slideViaBend=true), bowPoly=DOUBLE_HOLD so simultaneous voicing
	     // is allowed (was MONO_POLY_RELEASE — needed for SWAM portamento
	     // engine; pitchbend doesn't depend on it). portamento.{on,time}
	     // kept as graceful-degradation fallback. Pre-D72.4 fallback config
	     // for regression: `bowPoly: BOW_POLY.MONO_POLY_RELEASE` and remove
	     // `slideViaBend` — and uncomment the legacy `phraseC5` below.
	     bowPressure:70, portamento:{ on:true, time:50 }, slideViaBend:true,
	     attackRamp:30, attackCtrl:90, tremoloRate:50,
	     bowPoly:BOW_POLY.DOUBLE_HOLD,
	     // previous register:{ lo:36, hi:89 }
	    },
	6: { playMode:"bow", harmonics:HARMONICS.OFF, tremolo:TREMOLO.OFF,
	     exprEnv:{ attack:0.7, peak:1.0, sustain:0.85, release:0.4,
	               attackRampMs:55, sustainRampMs:140, releaseRampMs:160 },
	     vibrato:{ depth:40, rate:50 }, bowPos:64,
	     // portamento.time = 100: graceful-degradation fallback if a same-
	     // string slide ever bypasses the slideViaBend dispatch (e.g., a
	     // bendStep failure path). slideViaBend = true routes ALL same-
	     // string AND cross-string slides through `bendStep` (D72), letting
	     // `phraseC6` scale per-slide duration with the gap-to-next-event
	     // for the multi-second smooth contours the performer wants.
	     bowPressure:70, portamento:{ on:true, time:100 }, slideViaBend:true,
	     attackRamp:50, attackCtrl:50, tremoloRate:50,
	     // bowPoly: Pre-D72.3 was `MONO_POLY_RELEASE` (required for SWAM
	     // portamento on overlapping noteons). Now that `slideViaBend = true`
	     // routes ALL slides through pitchbend wheel (D72), portamento isn't
	     // engaged and Mono Poly Release becomes harmful — it reinterprets
	     // `maybeDoubleStop`'s companion noteOn as a SLIDE TARGET, silently
	     // collapsing the intended double-stop into a "main slides to
	     // companion pitch" event (the user-reported "C6 NEVER plays double
	     // stops" symptom). DOUBLE_HOLD lets companions sound as a true
	     // simultaneous voice; pitchbend wheel still works (per-channel,
	     // independent of bow-polyphony mode), so slides still slide.
	     bowPoly:BOW_POLY.DOUBLE_HOLD,
	     // previous register:{ lo:43, hi:67 }
	    },
	7: { playMode:"bow", harmonics:HARMONICS.OFF, tremolo:TREMOLO.OFF,
	     // attack 0.4 → 0.6 + attackRampMs 100 → 50 (D79): C7 still swells
	     // (tasto-sustain identity preserved by the ramp curve), but the
	     // first ms is audibly present instead of starting near-silent and
	     // taking 100 ms to reach peak. Was the dominant source of "C7 hits
	     // are noticeably delayed" — the noteon fires immediately, the
	     // expression was just ramping in slowly enough to read as latency.
	     exprEnv:{ attack:0.6, peak:1.05, sustain:0.9, release:0.7,
	               attackRampMs:50, sustainRampMs:200, releaseRampMs:260 },
	     // bowPosAlt: handleVoice coin-flips between bowPos (sul tasto) and
	     // bowPosAlt (sul pont) per phrase trigger. Same melodic / gliss /
	     // dynamic structure either way — only timbre changes.
	     vibrato:{ depth:55, rate:40 }, bowPos:60, bowPosAlt:5,
	     // CC 5 (Portamento Time) caps at 127 (standard MIDI CC range).
	     // D53 v1 tried `time:250` thinking it was raw ms/semi, but
	     // ccForce clamps to 0..127 → audio actually played at CC 5 = 127
	     // (~127 ms/semi) while the dashboard mirror was set to 250
	     // ms/semi → visual interpolated 2× slower than audio. Reverted to
	     // 115 (original C7 value) until pitchbend lands as the path to
	     // genuinely-slow drift. Gestural distinction from C6 comes from
	     // FIRST_GLISS_MS_C7 + ±1-2 alternating-sign deltas in phraseC7.
	     // D72.4 — slideViaBend=true (same as C5/C6) ports tasto drifts
	     // from glissNote portamento to bendStep pitchbend. bowPoly=
	     // DOUBLE_HOLD so future companions could sound; pitchbend wheel
	     // is independent of bow-polyphony mode. Pre-D72.4: bowPoly was
	     // MONO_POLY_RELEASE and slideViaBend was unset.
	     bowPressure:55, portamento:{ on:true, time:115 }, slideViaBend:true,
	     attackRamp:90, attackCtrl:25, tremoloRate:40,
	     bowPoly:BOW_POLY.DOUBLE_HOLD,
	     // D80 — soft bend mode. C7's tasto-sustain identity is "single
	     // continuous bow"; the standard `completeBend` rebow (noteOff
	     // source + noteOn target at every bend completion) re-attacks the
	     // bow per drift, breaking the held-bow character. softBend keeps
	     // the anchor noteOn alive throughout the phrase and lets the
	     // pitchbend wheel cumulatively offset from anchor → audible drift
	     // as one continuous bow, no per-drift attack click. Wheel resets
	     // to center only on phrase steal (so the next voice's first noteOn
	     // plays at the correct pitch).
	     softBend:true,
	     // D79 previous bounded range: register:{ lo:36, hi:60 }
	    },
	8: { playMode:"bow", harmonics:HARMONICS.OFF, tremolo:TREMOLO.FAST,
	     exprEnv:{ attack:0.9, peak:1.15, sustain:1.0, release:0.3,
	               attackRampMs:20, sustainRampMs:80,  releaseRampMs:100 },
	     vibrato:{ depth:15, rate:80 }, bowPos:5,
	     bowPressure:100, portamento:{ on:false, time:0 },
	     attackRamp:20, attackCtrl:100, tremoloRate:95,
	     bowPoly:BOW_POLY.DOUBLE_HOLD,
	     // previous register:{ lo:60, hi:81 }
	    }
};

// REGIME_ATTACK_MULT, REGIME_EXPR_RAMP_MULT, RATE_* gains, LEGATO_COMPLEX are declared
// in gen_includes.js (source: src/swam-mapping.ts).

// ================================================================
// STATE — global (shared across instances)
// ================================================================
// Sieve walker, regime/tetra, live gyro, face mapping. Each field here is
// either (a) a property of the piece rather than a single voice (sieve
// position, regime), (b) a physical input broadcast to every sounding voice
// (tilt/spin/dev/scramble), or (c) an incoming-turn snapshot captured onto
// the instance at handleVoice allocation time (face*, intensity) and then
// read from the instance.
// ================================================================
var state = {
	sieve: [36, 37, 39, 41, 43, 44, 48],
	sieveIdx: 0,
	sieveDir: 1,
	tetra: 0,
	regime: "contemplative",
	frozen: false,
	scramble: 0,

	intensity: "mf",            // last incoming intensity label (for log only)
	density: 2.0,               // last incoming density
	duration: 1.0,              // last resolved phrase duration

	turnCount: 0,
	lastTurnTime: 0,
	lastVoiceTime: 0,           // for panic watchdog (any instance)

	// Continuous expression inputs.
	// tiltEMA absorbs gyro static-pose noise so a held cube doesn't flicker
	// the rounded CC 16 (Bow Position) value between adjacent integers at
	// 30 Hz (sub-vibrato bow buzz). Initialised at rest pose (0.5).
	tilt: 0.5,
	tiltEMA: 0.5,
	spin: 0,
	dev: 0,
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
	faceDurationMult: null,
	faceTranspose: 0,
	faceEnvelope: null,
	faceArticulation: null,
	faceMotion: null,
	faceEnvProfile: null,
	faceOffVelOverride: null,
	faceReleaseMult: 1.0,
	currentPlanId: 0,

	// Cube algorithm / last-voice routing
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

		// D59 — pitchbend state. `pitchbend` is the current 14-bit value
		// (center = 8192). `pitchbendRampTasks` holds the in-flight
		// ramp's per-tick Task objects so cancelPitchbendRamp can stop
		// them. Reset to (8192, null) in cancelPhrase + bang.
		pitchbend: PITCHBEND_CENTER,
		pitchbendRampTasks: null,

		// D63 — bend's deferred atomic transition. When bendStep
		// schedules its noteOff(source) + noteOn(target) at end of
		// ramp, it stores the params here so glissStep can
		// force-complete the transition inline if the next event
		// fires before the scheduled task. With D63's 5 ms bend-dur
		// margin, scheduling jitter can reverse the firing order;
		// this flag makes the dispatch race-free. Cleared on natural
		// completion (in completeBend), on cancelPhrase, and on bang.
		bendPending: null,           // { hpSource, hpTarget, vel } | null
		bendPendingTask: null,       // the scheduleAt Task

		// Voice-shot snapshots (captured at handleVoice onset)
		intensity: "mf",
		density: 2.0,
		duration: 1.0,
		tetra: 0,
		faceDurationMult: null,
		faceTranspose: 0,
		faceEnvelope: null,      // 'pluck'|'swell'|'stab'|'hairpin-up'|'hairpin-down'|'fade'|'burst'|null — drives phrase count + expr shape
		faceMotion: null,        // 'static'|'up'|'down'|'oscillate'|null — drives sieve-walker direction
		faceEnvProfile: null,
		faceOffVelOverride: null,
		faceReleaseMult: 1.0,
		planId: 0,

		// Expression targets
		baseExpr: 0,
		peakExpr: 0,
		bowPressureBase: 64,
		c3BowMotionExpected: false,
		c3BowMotionCount: 0,
		c3BowMotionMinExpr: 127,
		c3BowMotionMaxRate: 0,

		// Gliss invariant telemetry (D42 + D46 + D59). Every C5/C6/C7 voice
		// MUST emit ≥1 glissStep; scheduleRelease's offT checks the sum of
		// glissOverlapCount (within-string slides) + glissBendCount (cross-
		// string slides via D59 pitchbend) + glissLeapCount (cross-string
		// leaps when interval exceeds PITCHBEND_RANGE_SEMI) and logs
		// "GLISS FAIL" if all three are 0. Per-phrase log line reports the
		// breakdown so the user can verify in [print xk_swam]. See CLAUDE.md
		// § Bridge Invariants.
		glissOverlapCount: 0,
		glissBendCount: 0,
		glissLeapCount: 0,
		glissExpected: false,
		glissCompanion: null,        // { offsetSemis, currentPitch, vel, minPitch, maxPitch, revoiceCount }
		glissCompanionExpected: false,

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

		// D47 Phase 2 — chain candidacy. When a cresc arc completes (natural
		// end OR steal), `lastArcDir` / `lastArcEndVal` / `lastArcEndTime`
		// snapshot the exit state. The next voice's schedulePhraseArc
		// inherits ccCache[CC.EXPRESSION] (no ccForce snap) when its
		// direction matches AND the gap is ≤ ARC_CHAIN_GAP_MS — the
		// listener hears one continuous swell across both voices instead of
		// a step at the boundary. Direction mismatch / timeout breaks the
		// chain naturally (lastArcDir cleared on the next chain candidate
		// that doesn't qualify).
		lastArcDir: null,
		lastArcEndVal: 0,
		lastArcEndTime: 0,

		// D54 — bow-position flap counters. handleExprTilt writes CC 16 at
		// 30 Hz; with raw `val` (no EMA) and tiny gyro static-pose noise,
		// the rounded CC value flips between adjacent integers, producing
		// a sub-vibrato bow buzz on sustained voices. tiltEMA + this
		// telemetry is the invariant: per voice we count distinct CC 16
		// reversals (value goes up after going down or vice versa); the
		// natural-end log promotes to "BOW POS FLAP" if reversals/sec
		// exceeds BOW_FLAP_RATE_FAIL. Reset on voice start.
		bowPosWrites: 0,
		bowPosReversals: 0,
		bowPosLastDir: 0,      // -1 down, +1 up, 0 none

		// Per-instance bow-position baseline (CC 16). setupComplex seeds it
		// from cmx.bowPos; handleVoice may re-roll for C7 (tasto/pont
		// coin-flip per phrase). handleExprTilt + scrambleBowBias dispatch
		// add their offsets to this value, not cmx.bowPos.
		bowPosBase: null,

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
function statusPitchbend(ch) { return 0xE0 + (ch - 1); }

var pitchbendChannelFailLogged = false;
function assertPitchbendChannel(status) {
	var expected = statusPitchbend(MIDI_CH);
	if (status === expected) return;
	if (!pitchbendChannelFailLogged) {
		log("PITCHBEND CHANNEL FAIL status=" + status +
		    " expected=" + expected +
		    " MIDI_CH=" + MIDI_CH +
		    " noteOnStatus=" + statusNoteOn(MIDI_CH) +
		    " ccStatus=" + statusCC(MIDI_CH));
		pitchbendChannelFailLogged = true;
	}
}

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
// score notes. Echoes carry complex, companion flag, and plan id so the relay
// can audit planned phrase structure against what this bridge actually emits.
// Addresses come from gen_includes.js (OSC.MIDI_NOTEON / MIDI_NOTEOFF /
// MIDI_PANIC).
function emitEchoNote(address, inst, pitch, vel, extraFlag) {
	// `extraFlag` is currently only `isCompanion` for noteon. Noteoff calls
	// don't pass it; `undefined | 0` = 0 so the OSC payload shape stays
	// consistent for the relay's parser.
	outlet(ECHO_OUTLET, address,
	       inst.voice, pitch, vel, inst.activeComplex || 0,
	       extraFlag | 0, inst.planId || 0);
}

function noteOn(inst, pitch, vel, isCompanion) {
	pitch = clamp(pitch, 0, 127);
	vel = clamp(vel, 1, 127);
	emitMidi(inst, statusNoteOn(MIDI_CH), pitch, vel);
	emitEchoNote(OSC.MIDI_NOTEON, inst, pitch, vel, isCompanion ? 1 : 0);
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

function removeActiveNote(inst, pitch) {
	var idx = inst.activeNotes.indexOf(pitch);
	if (idx >= 0) inst.activeNotes.splice(idx, 1);
	return idx >= 0;
}

// User-tuned floor for CC 11 (Expression) on PLAY-time writes. Generated
// phrase materials (phrase arcs, attack/peak/sustain envelopes, chain
// snaps, in-flight rampCC ticks) clamp at this minimum so soft dynamics
// stay audibly above SWAM's perceptible threshold — pp passages with
// peakExpr × ARC_FLOOR landing below ~10 read as silent, which the
// performer experiences as "the cube stopped responding."
//
// Silencing writes (release fade landing exactly at 0, voice steal flush
// via stealInstance, bang/panic reset) are exempt: the val > 0 guard in
// the floor check lets explicit zero writes through. The release fade's
// rampCC ticks plateau briefly at FLOOR right before the final tick lands
// at 0 (start=peak, target=0 → ticks walk down through FLOOR), then the
// MIDI noteoff fires and silences the voice — no audible artifact.
var CC_EXPRESSION_FLOOR = 12;
var BOW_POSITION_MIN = 0;
var BOW_POSITION_MAX = 64;

function clampBowPosition(val) {
	return clamp(Math.round(val), BOW_POSITION_MIN, BOW_POSITION_MAX);
}

// Continuous CC — per-instance cache-suppressed. Use for 60 Hz streams.
function cc(inst, num, val) {
	if (!hasCC(num)) return;
	val = (num === CC.BOW_POSITION) ? clampBowPosition(val) : clamp(Math.round(val), 0, 127);
	if (num === CC.EXPRESSION && val > 0 && val < CC_EXPRESSION_FLOOR) val = CC_EXPRESSION_FLOOR;
	if (inst.ccCache[num] === val) return;
	inst.ccCache[num] = val;
	emitMidi(inst, statusCC(MIDI_CH), num, val);
	if (num === CC.EXPRESSION) emitEchoExpr(inst, val);
}

// Forced CC — always writes, updates cache.
function ccForce(inst, num, val) {
	if (!hasCC(num)) return;
	val = (num === CC.BOW_POSITION) ? clampBowPosition(val) : clamp(Math.round(val), 0, 127);
	if (num === CC.EXPRESSION && val > 0 && val < CC_EXPRESSION_FLOOR) val = CC_EXPRESSION_FLOOR;
	inst.ccCache[num] = val;
	emitMidi(inst, statusCC(MIDI_CH), num, val);
	if (num === CC.EXPRESSION) emitEchoExpr(inst, val);
}

// Pure additive telemetry — echo every CC 11 (Expression) write so the
// dashboard can size brushes by audible dynamics rather than per-note
// velocity. Velocity is a poor proxy because SWAM Cello drives ongoing
// loudness via CC 11 ramps (D47 phrase arc) — a single sustained note
// has one velocity but a full cresc/dim envelope across its lifetime.
// No synthesis state depends on this; if the dashboard isn't listening,
// the messages are simply dropped at the relay.
function emitEchoExpr(inst, val) {
	outlet(ECHO_OUTLET, OSC.MIDI_EXPR, inst.voice, val, inst.activeComplex || 0, inst.planId || 0);
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
	target = (num === CC.BOW_POSITION) ? clampBowPosition(target) : clamp(Math.round(target), 0, 127);
	var start = inst.ccCache[num];
	if (start == null) start = 0;
	if (num === CC.BOW_POSITION) start = clampBowPosition(start);
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
// PITCHBEND (D59) — per-instance, single-channel pitchbend wheel
// ================================================================
//
// Standard MIDI pitchbend: status byte 0xE0 + channel, 14-bit value
// (LSB | MSB << 7) ranging 0..16383, center 8192. SWAM responds to
// pitchbend by shifting all sounding notes' audible pitches by
// (value - 8192) / 8192 × PITCHBEND_RANGE_SEMI semitones.
//
// Use case: cross-string slides (D59 design in docs/research_notes.md).
// SWAM's portamento engine bails on cross-string overlaps (D46), so
// the bridge classifies cross-string as leap and emits noteOff →
// gap → noteOn. That's audibly correct but the user wants the slide
// to actually slide. Pitchbend on a single held note produces the
// audible curve regardless of physical string, at the cost of a
// somewhat-stretched timbre at extreme bends (acceptable trade).

function emitPitchbend(inst, value14) {
	value14 = clamp(value14 | 0, 0, 16383);
	var lsb = value14 & 0x7F;
	var msb = (value14 >> 7) & 0x7F;
	var status = statusPitchbend(MIDI_CH);
	assertPitchbendChannel(status);
	emitMidi(inst, status, lsb, msb);
	inst.pitchbend = value14;
}

function cancelPitchbendRamp(inst) {
	if (!inst.pitchbendRampTasks) return;
	for (var i = 0; i < inst.pitchbendRampTasks.length; i++) {
		inst.pitchbendRampTasks[i].cancel();
	}
	inst.pitchbendRampTasks = null;
}

// D63 — bend's atomic transition. Called either by the bend's scheduled
// task at ramp end (`scheduled = true`), OR inline from glissStep when
// the next event dispatches before the task fires (`scheduled = false`,
// race-fix path against the 5ms margin scheduling jitter).
//
// Order of operations is the SAME as the original D59 design and MUST
// NOT change — bend reset before noteOn target so the new note's
// physical-model attack plays at target_written, not target+offset.
//
// Idempotent: safe to call when bendPending is null (returns silently).
//
// Telemetry (D64.4): when scheduled=false and a transition is pending,
// log a one-line "race-fix" entry — means scheduling jitter > 5ms.
// Quiet during normal play; audible when bend dur margin needs tuning.
function completeBend(inst, scheduled, forceReset) {
	if (!inst.bendPending) return;
	if (scheduled !== true) {
		log("inst " + inst.id + " bend race-fix — completeBend fired inline before scheduled task");
	}
	// D72 race-fix — cancel any in-flight pitchbend ramp before the wheel
	// reset. Without this, the LAST ramp tick scheduled at the bend's
	// `durMs` boundary can fire AFTER this `emitPitchbend(PITCHBEND_CENTER)`
	// (Max's Task scheduler doesn't guarantee FIFO at identical times),
	// re-bending the wheel to target and leaving it there until the next
	// bend's reset. Pre-D72 with bend durations ≤ 195 ms the race was
	// statistically rare and the residual lag was under 200 ms; D72's
	// multi-second bends amplified both the chance and the audible
	// duration of pitchbend-persists-despite-noteoff.
	cancelPitchbendRamp(inst);
	var bp = inst.bendPending;

	// D80 — softBend (C7) keeps the bow on. No per-drift rebow; pitchbend
	// wheel stays at the bent target so the next bend continues from there
	// (cumulative offset from anchor). `forceReset=true` means we're being
	// called from cancelPhrase on a phrase steal — reset the wheel to
	// center so the NEXT voice's first noteOn plays at correct pitch.
	// Natural completion mid-phrase OR race-fix from glissStep keeps the
	// wheel bent (forceReset=false / undefined → softBend takes the
	// no-rebow path).
	if (bp.softBend) {
		if (forceReset === true && inst.pitchbend !== PITCHBEND_CENTER) {
			emitPitchbend(inst, PITCHBEND_CENTER);
		}
		// activeNotes unchanged — anchor stays held; cancelPhrase /
		// allNotesOff will fire its noteoff when the phrase tears down.
		if (inst.bendPendingTask) inst.bendPendingTask.cancel();
		inst.bendPending = null;
		inst.bendPendingTask = null;
		return;
	}

	emitPitchbend(inst, PITCHBEND_CENTER);   // (1) bend = 0
	noteOff(inst, bp.hpSource);               // (2) source release
	var gc = inst.glissCompanion;
	var companionSource = gc && gc.currentPitch != null ? gc.currentPitch : null;
	var companionTarget = null;
	if (companionSource != null) {
		companionTarget = bp.hpTarget + gc.offsetSemis;
		if (companionTarget < DOUBLE_STOP_ROLL_MIN || companionTarget > DOUBLE_STOP_ROLL_MAX) {
			log("DOUBLE STOP RANGE FAIL inst " + inst.id + " C" + inst.activeComplex +
			    " target=" + bp.hpTarget +
			    " offset=" + gc.offsetSemis +
			    " companionTarget=" + companionTarget +
			    " range=" + DOUBLE_STOP_ROLL_MIN + ".." + DOUBLE_STOP_ROLL_MAX +
			    " - ending gliss companion");
			noteOff(inst, companionSource);
			removeActiveNote(inst, companionSource);
			inst.glissCompanion = null;
			inst.glissCompanionExpected = false;
			companionSource = null;
			companionTarget = null;
		} else {
			// Re-voice the companion at the bend target so the dyad
			// survives the source->target rebow. Without this, SWAM can
			// keep only the freshly attacked main target and silently drop
			// the held companion after the first bend completion.
			noteOff(inst, companionSource);
		}
	}
	noteOn(inst, bp.hpTarget, bp.vel);         // (3) target attack
	if (companionTarget != null) {
		noteOn(inst, companionTarget, gc.vel, /*isCompanion=*/ true);
		gc.currentPitch = companionTarget;
		gc.revoiceCount = (gc.revoiceCount | 0) + 1;
	}
	// Bookkeeping: source/old companion out, new companion/target in.
	removeActiveNote(inst, bp.hpSource);
	if (companionSource != null) removeActiveNote(inst, companionSource);
	if (companionTarget != null) inst.activeNotes.push(companionTarget);
	inst.activeNotes.push(bp.hpTarget);
	// Cancel the scheduled task if completing inline (so it doesn't
	// re-fire). If we're being called BY the task, .cancel() on the
	// already-firing task is a no-op (Max's Task swallows it).
	if (inst.bendPendingTask) inst.bendPendingTask.cancel();
	inst.bendPending = null;
	inst.bendPendingTask = null;
}

function rampPitchbend(inst, target, durMs) {
	cancelPitchbendRamp(inst);
	target = clamp(target | 0, 0, 16383);
	var start = inst.pitchbend != null ? inst.pitchbend : PITCHBEND_CENTER;
	if (durMs <= 0 || start === target) { emitPitchbend(inst, target); return; }

	// D64 — pitchbend tick = 5 ms (was 15). Pitchbend modulates the
	// pitch wheel continuously; coarse 15 ms ticks at ±24 range step
	// at ~1.85 semis/tick on a 24-semi bend, which can be audible as
	// stepping. 5 ms = 0.62 semis/tick on the same bend, smoothly
	// continuous. Trade: 3× more MIDI events per bend (~40 vs ~13 per
	// 195 ms ramp). SWAM handles 200 Hz pitchbend without trouble; the
	// total MIDI traffic is still tiny relative to audio rendering.
	var tickMs = 5;
	var steps  = Math.max(1, Math.round(durMs / tickMs));
	var tasks  = [];
	for (var i = 1; i <= steps; i++) {
		(function(step) {
			var v = start + (target - start) * (step / steps);
			var t = new Task(function() { emitPitchbend(inst, v); }, this);
			t.schedule(step * tickMs);
			tasks.push(t);
		})(i);
	}
	inst.pitchbendRampTasks = tasks;
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

// D69 — diff guard removed (2026-05-02). Prophylactic mirror of the
// D44 / D69 setBowPolyphony / setTremolo fixes; same startup race exists
// on CC 78 and would silently freeze C4 in non-harmonic mode whenever
// SWAM's preset load lands after resetInstance.
function setHarmonics(inst, target) {
	if (HAS_HARMONICS_CC) {
		ccForce(inst, CC.HARMONICS, HARMONICS_CC_VAL[target]);
	} else {
		keyswitch(inst, KS.HARMONICS, velForKS(KS.HARMONICS, target, 4));
	}
	inst.harmonics = target;
	log("inst " + inst.id + " harmonics=" + target + " cc78=" + HARMONICS_CC_VAL[target]);
}

// Per-voice C4 harmonic-mode rotation by tetra parity (V1/V2 path was
// retired; CTRL is reserved for algorithm-driven pings).
//   even tetra → OCT
//   odd  tetra → OCT_5TH
function harmonicsForC4(inst) {
	return inst.tetra === 1 ? HARMONICS.OCT_5TH : HARMONICS.OCT;
}

// D69 — diff guard removed (2026-05-02). Same race as D44 setBowPolyphony:
// `resetInstance` fires CC 79 = 0 before SWAM's preset finishes loading,
// so the bridge cache reads `TREMOLO.OFF` while SWAM lands on tremolo-on
// (preset default or `vst~` first-instantiation state). Every subsequent
// C1–C7 voice's `setTremolo(OFF)` then hit the diff guard (`OFF === OFF`)
// and never re-asserted — startup played every non-tremolo phrase through
// SWAM's stuck tremolo until the first C8 phrase finally diff-broke the
// cache (OFF→FAST→OFF) and re-synced the path. User report: "every time
// i start up the patch it starts with everything doing tremolos until i
// actually hit a tremolo phrase". Always re-asserting costs one CC write;
// cheap insurance.
function setTremolo(inst, target) {
	if (HAS_TREMOLO_CC) {
		ccForce(inst, CC.TREMOLO, TREMOLO_CC_VAL[target]);
	} else {
		keyswitch(inst, KS.TREMOLO, velForKS(KS.TREMOLO, target, 3));
	}
	inst.tremolo = target;
	log("inst " + inst.id + " tremolo=" + target + " cc79=" + TREMOLO_CC_VAL[target]);
}

// D44 — diff guard removed (2026-04-23). Pre-D44 this function early-
// returned when `inst.bowPoly === target`, which silently dropped CC 81
// writes whenever the bridge's cached state already matched. But SWAM-
// side state can drift out of sync with our cache on plugin reload,
// preset re-read, or session start (resetInstance fires CC 81 before
// `[read xenakube_main.swam]` finishes loading the preset, so the CC is
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

	// D47 Phase 2 — capture chain candidacy BEFORE we cancel the rampCC
	// so the next voice's schedulePhraseArc can decide whether to inherit
	// the stolen arc's exit value. ccCache[CC.EXPRESSION] holds the most
	// recent rampCC step value; that's the audible CC 11 the listener
	// just heard. Direction match + within ARC_CHAIN_GAP_MS → chain.
	if (inst.phraseArcDir) {
		inst.lastArcDir = inst.phraseArcDir;
		inst.lastArcEndVal = (inst.ccCache[CC.EXPRESSION] | 0);
		inst.lastArcEndTime = Date.now();
		inst.phraseArcDir = null;
	}

	cancelCCRamp(inst, CC.EXPRESSION);

	// phraseC3/C4 schedule per-note CC 16 / CC 17 ramps via rampCC; the
	// scheduled tasks live in inst.ccRampTasks, not inst.phraseTasks, so
	// the loop above does not touch them. Without these cancels an
	// in-flight bow-position or bow-pressure ramp keeps writing CC values
	// through the steal boundary into the next voice — a stolen mid-sweep
	// would leak as a 100 ms residual bow drift on the new voice's first
	// few notes (audible as a wrong-position attack).
	cancelCCRamp(inst, CC.BOW_POSITION);
	cancelCCRamp(inst, CC.BOW_PRESSURE);

	// D59 + D72 — clean up any in-flight bend BEFORE allNotesOff. Two
	// concerns:
	//   (a) Pitchbend wheel must be back at center so the next voice's
	//       noteOn doesn't play at source+offset (the original D59
	//       reason — a one-frame audible "drop back to source pitch"
	//       is preferable to a wrong-pitch new voice).
	//   (b) D72 — for `slideViaBend` complexes (C6) with long bends,
	//       the deferred `noteOff(source) + noteOn(target)` from
	//       `completeBend` MUST fire so the dashboard sees a clean
	//       end-of-bend sequence and the `preserveLegatoTail` mechanism
	//       (next phrase's legato into the bend's target, not its
	//       source) works correctly. Pre-D72 the bridge cancelled the
	//       deferred transition outright (D63's "ghost-fire" concern);
	//       with multi-second bends, that left the dashboard's
	//       `bendSegments` entry dangling for up to MAX_BEND_DUR_MS
	//       and the visual line at source's pitch instead of the
	//       musically-arrived target pitch. completeBend below cancels
	//       the pitchbend ramp internally (D72 race-fix) AND fires the
	//       atomic transition, so the wheel-reset and the noteOff/
	//       noteOn pair both happen synchronously here — no async
	//       leakage past allNotesOff.
	if (inst.bendPending) {
		// D80 — forceReset=true: phrase is being torn down, reset wheel to
		// center so the next voice's first noteOn plays at correct pitch.
		// For softBend this is the only path that resets the wheel; mid-
		// phrase natural completion + race-fix paths leave it bent.
		completeBend(inst, /*scheduled=*/ false, /*forceReset=*/ true);
	} else {
		cancelPitchbendRamp(inst);
		if (inst.pitchbend !== PITCHBEND_CENTER) emitPitchbend(inst, PITCHBEND_CENTER);
	}
	// Defensive — completeBend clears these, but if bendPending was
	// already null we still want to ensure the deferred task doesn't
	// fire post-cancel (cleanup of a half-aborted prior cancel path).
	if (inst.bendPendingTask) inst.bendPendingTask.cancel();
	inst.bendPending = null;
	inst.bendPendingTask = null;

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
	inst.glissCompanion = null;
	inst.glissCompanionExpected = false;
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

		// D42 + D46 + D59 gliss invariant assertion. Phrase ran to natural
		// end without being stolen, so if glissExpected was true we should
		// have seen ≥1 gliss event (slide OR bend OR leap). 0 means the
		// phrase generator emitted no glissStep at all despite being a
		// gliss complex — a silent bug pre-D42. The per-phrase breakdown
		// is always logged so the user can verify the distribution in
		// [print xk_swam] (slides=same-string portamento; bends=cross-
		// string pitchbend slide; leaps=cross-string discrete jump,
		// rare post-D59 since interval rarely exceeds PITCHBEND_RANGE_SEMI).
		if (inst.glissExpected) {
			var slides = inst.glissOverlapCount | 0;
			var bends  = inst.glissBendCount    | 0;
			var leaps  = inst.glissLeapCount    | 0;
			var maxRun = inst.consecutiveLeapMax | 0;
			if (slides + bends + leaps < 1) {
				log("GLISS FAIL inst " + inst.id + " C" + inst.activeComplex +
				    " face=" + (inst.faceEnvelope || "-") +
				    " motion=" + (inst.faceMotion || "-") +
				    " slides=0 bends=0 leaps=0 dur=" + dur.toFixed(2));
			} else if (maxRun > maxLeapsFor(inst.activeComplex)) {
				// D48 + D51 + D58 — leap-run exceeded per-complex tolerance
				// despite the post-leap nudge. Only happens when
				// nudgeToSameString returned null (source at extreme of
				// every string with no minLeap headroom in either
				// direction). For C6/C7 (maxLeaps=0), ANY leap trips this
				// — would indicate a regression in nudge logic since post-
				// D58 those complexes should never leap. For C5 (maxLeaps=1),
				// >1 consecutive leaps trip it. If frequent, narrow
				// pickPitch's register or lower MIN_LEAP.
				log("GLISS RUN FAIL inst " + inst.id + " C" + inst.activeComplex +
				    " face=" + (inst.faceEnvelope || "-") +
				    " slides=" + slides + " bends=" + bends + " leaps=" + leaps +
				    " consecLeapMax=" + maxRun +
				    " (max for C" + inst.activeComplex + " = " + maxLeapsFor(inst.activeComplex) + ")" +
				    " dur=" + dur.toFixed(2));
			} else {
				log("inst " + inst.id + " C" + inst.activeComplex +
				    " face=" + (inst.faceEnvelope || "-") +
				    " slides=" + slides + " bends=" + bends + " leaps=" + leaps +
				    " dur=" + dur.toFixed(2));
			}
			if (inst.glissCompanionExpected) {
				var gc = inst.glissCompanion;
				var compActive = !!(gc && inst.activeNotes.indexOf(gc.currentPitch) >= 0);
				var companionTransitions = bends + leaps;
				if (!gc || !compActive) {
					log("DOUBLE STOP FAIL inst " + inst.id + " C" + inst.activeComplex +
					    " companion missing before release" +
					    " bends=" + bends +
					    " leaps=" + leaps +
					    " revoices=" + (gc ? (gc.revoiceCount | 0) : 0));
				} else if ((gc.revoiceCount | 0) < companionTransitions) {
					log("DOUBLE STOP FAIL inst " + inst.id + " C" + inst.activeComplex +
					    " revoices=" + (gc.revoiceCount | 0) +
					    " bends=" + bends +
					    " leaps=" + leaps +
					    " transitions=" + companionTransitions +
					    " current=" + gc.currentPitch +
					    " offset=" + gc.offsetSemis);
				} else {
					log("inst " + inst.id + " C" + inst.activeComplex +
					    " doubleStop offset=" + gc.offsetSemis +
					    " revoices=" + (gc.revoiceCount | 0) +
					    " bends=" + bends +
					    " leaps=" + leaps +
					    " span=" + gc.minPitch + ".." + gc.maxPitch);
				}
			}
			inst.glissExpected = false;
			inst.glissCompanionExpected = false;
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
			// D47 Phase 2 — refresh chain candidacy on natural end. The
			// next voice's schedulePhraseArc reads these to decide whether
			// to inherit ccCache[CC.EXPRESSION] (chain) or ccForce a fresh
			// startVal. Direction-bearing voices that arrive within
			// ARC_CHAIN_GAP_MS AND share dir → smooth dynamic across the
			// boundary. Direction mismatch / timeout → no chain (legacy
			// snap behaviour for that voice).
			inst.lastArcDir = inst.phraseArcDir;
			inst.lastArcEndVal = landed;
			inst.lastArcEndTime = Date.now();
			inst.phraseArcDir = null;
		}

		// D54 — bow-position flap telemetry. Always-on per-phrase log
		// shows reversal count + rate so the user can audit smoothness;
		// promotes to BOW POS FLAP when the rate exceeds threshold (means
		// the EMA isn't doing its job — flap is back).
		if (inst.bowPosWrites > 0) {
			var revs = inst.bowPosReversals | 0;
			var revRate = revs / Math.max(0.5, dur);
			if (revRate > BOW_FLAP_RATE_FAIL) {
				log("BOW POS FLAP inst " + inst.id + " C" + inst.activeComplex +
				    " reversals=" + revs + " writes=" + inst.bowPosWrites +
				    " dur=" + dur.toFixed(2) +
				    " (rate=" + revRate.toFixed(1) + "/s, fail>" + BOW_FLAP_RATE_FAIL + ")");
			} else {
				log("inst " + inst.id + " bowPosFlap rev=" + revs +
				    " writes=" + inst.bowPosWrites +
				    " rate=" + revRate.toFixed(1) + "/s");
			}
		}

		if (inst.c3BowMotionExpected) {
			if ((inst.c3BowMotionCount | 0) < 1) {
				log("C3 BOW MOTION FAIL inst " + inst.id +
				    " face=" + (inst.faceEnvelope || "-") +
				    " dur=" + dur.toFixed(2));
			} else {
				log("inst " + inst.id + " C3 bowMotion count=" + inst.c3BowMotionCount +
				    " minExpr=" + inst.c3BowMotionMinExpr +
				    " maxRate=" + inst.c3BowMotionMaxRate.toFixed(2) +
				    " dur=" + dur.toFixed(2));
			}
			inst.c3BowMotionExpected = false;
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
	// Peak/sustain ramps scale with phrase length so long single-note phrases
	// do not expose the cello VST with brief tier transitions between
	// multi-second plateaus. The attack level is seeded synchronously below;
	// using a proportional attack ramp here was the source of delayed-feeling
	// pluck/stab gestures.
	var baseS = (env.sustainRampMs != null ? env.sustainRampMs : 120) * rm;
	var sMs = Math.max(baseS, Math.min(durMs * 0.25, 1500));

	// Live-onset invariant: a phrase's first note must not wait for CC 11 to
	// climb from zero before it becomes audible. The old attack ramp scaled up
	// to 10% of phrase duration (often 200-500 ms, capped at 800 ms), which
	// read as face-oriented latency on pluck/stab single-note gestures.
	// Seed the attack level synchronously; subsequent peak/sustain ramps still
	// carry the face/compex envelope shape.
	ccForce(inst, CC.EXPRESSION, Math.round(peakExpr * env.attack));

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
	if (env === 'hairpin-up')   return 'hairpin-up';   // <> peak in middle
	if (env === 'hairpin-down') return 'hairpin-down'; // >< trough in middle
	return null;
}

// D47 — phrase-spanning linear CC 11 ramp. Replaces scheduleExprEnvelope's
// 3-stage attack/peak/sustain shape with a single sweep from ARC_FLOOR ×
// peakExpr to ARC_CEIL × peakExpr (cresc) or vice versa (dim).
//
// Phase 1 (original): ccForce snapped to startVal at every voice; the new
// voice started at the intended dynamic regardless of where the previous
// arc ended. Audible side effect: a CC 11 step at every voice boundary
// during continuous play — "predictable jump in dynamics, at the same
// rate each time" (user report 2026-04-30).
//
// Phase 2 (this commit): consecutive same-direction voices arriving within
// ARC_CHAIN_GAP_MS of the previous arc's exit (natural-end OR steal)
// CHAIN — the new arc inherits ccCache[CC.EXPRESSION] (no ccForce snap)
// and rampCC walks from there to the new endVal. Direction mismatch /
// timeout / first arc breaks the chain (legacy snap behaviour for that
// voice). Result: long swells span multiple cube turns smoothly; only
// intentional direction changes produce the audible boundary.
//
// Voice steal cancels the ramp via cancelPhrase → cancelCCRamp(CC.
// EXPRESSION); cancelPhrase also snapshots the chain state so a stolen
// arc still seeds a chain candidate.
//
// REGIME ramp multiplier applies asymmetrically: burst (rm=0.4) tightens
// the arc so peak lands at ~40% of phrase and plateaus through the rest;
// contemplative (rm=1.5) is CLAMPED to 1.0 — without the clamp it stretches
// rampMs past durMs, the rampCC chain only completes 67% of its journey
// before scheduleRelease fires, and the ARC FAIL assertion catches it
// (landed ≠ phraseArcEnd by ~33% of total range). User-audible symptom
// was a "sudden tail diminish": the release fade picked up from the
// mid-trajectory landing value (e.g. 42 instead of intended 24 on a dim
// phrase) and walked it down to 0 over fadeMs, producing a perceptually
// abrupt ending where the dynamic should have already arrived at its
// intended endpoint.
function schedulePhraseArc(inst, peakExpr, dir, durMs) {
	var rm = Math.min(REGIME_EXPR_RAMP_MULT[state.regime] || 1.0, 1.0);
	var rampMs = Math.max(60, Math.round(durMs * rm));
	var lo = clamp(Math.round(peakExpr * ARC_FLOOR), 0, 127);
	var hi = clamp(Math.round(peakExpr * ARC_CEIL),  0, 127);
	var endVal = (dir === 'cresc') ? hi : lo;

	var now = Date.now();
	var gap = now - (inst.lastArcEndTime | 0);
	var canChain = (
		inst.lastArcDir === dir &&
		inst.lastArcEndTime > 0 &&
		gap <= ARC_CHAIN_GAP_MS
	);

	var startVal;
	if (canChain) {
		// Inherit ccCache — rampCC will continue from whatever the
		// previous arc landed at (or where it was when stolen). No
		// ccForce snap → no boundary step.
		var cached = inst.ccCache[CC.EXPRESSION];
		startVal = (cached != null) ? cached : ((dir === 'cresc') ? lo : hi);
		log("inst " + inst.id + " arcChain dir=" + dir +
		    " inheritStart=" + startVal + " endVal=" + endVal +
		    " gap=" + gap + "ms");
	} else {
		startVal = (dir === 'cresc') ? lo : hi;
		ccForce(inst, CC.EXPRESSION, startVal);
	}

	rampCC(inst, CC.EXPRESSION, endVal, rampMs);

	inst.phraseArcDir   = dir;
	inst.phraseArcStart = startVal;
	inst.phraseArcEnd   = endVal;

	log("inst " + inst.id + " phraseArc dir=" + dir +
	    " face=" + (inst.faceEnvelope || "-") +
	    " start=" + startVal + " end=" + endVal +
	    " dur=" + Math.round(durMs) + "ms" +
	    (canChain ? " [chained gap=" + gap + "ms]" : ""));
}

// Hairpin phrase shape — `<>` (hairpin-up: peak in middle) or `><`
// (hairpin-down: trough in middle). Trajectory: rampCC start → mid over
// durMs/2, then at t=durMs/2 rampCC mid → end over durMs/2 where
// end === start. Useful for sustained single-noteon phrases (D' / B' faces)
// that would otherwise feel inert across long durations — the hairpin
// gives "twice as much motion for the price of one" per user request.
//
// No chain mode: hairpin trajectories are symmetric and self-contained;
// inheriting a mid-trajectory value from a previous phrase would distort
// the shape. ccForce sets startVal explicitly at phrase entry.
//
// scheduleRelease's D47 ARC FAIL assertion sees inst.phraseArcEnd === startVal
// (because the hairpin returns to its start) — the fade then walks startVal
// → 0 over fadeMs (symmetric for hairpin-up landing low; longer-feeling for
// hairpin-down landing high, which is intentional — the trough-and-recover
// shape needs the recovery to register before the natural ending).
function schedulePhraseHairpin(inst, peakExpr, dir, durMs) {
	var rm = Math.min(REGIME_EXPR_RAMP_MULT[state.regime] || 1.0, 1.0);
	var halfDur = Math.max(60, Math.round(durMs / 2));
	var rampMs = Math.max(60, Math.round(halfDur * rm));
	var lo = clamp(Math.round(peakExpr * ARC_FLOOR), 0, 127);
	var hi = clamp(Math.round(peakExpr * ARC_CEIL),  0, 127);
	var startVal, midVal;
	if (dir === 'hairpin-up') {
		startVal = lo;
		midVal   = hi;
	} else {
		startVal = hi;
		midVal   = lo;
	}

	ccForce(inst, CC.EXPRESSION, startVal);
	rampCC(inst, CC.EXPRESSION, midVal, rampMs);

	scheduleAt(inst, halfDur, function() {
		rampCC(inst, CC.EXPRESSION, startVal, rampMs);
	});

	inst.phraseArcDir   = dir;
	inst.phraseArcStart = startVal;
	inst.phraseArcEnd   = startVal;  // returns to start by phrase end

	log("inst " + inst.id + " phraseHairpin dir=" + dir +
	    " face=" + (inst.faceEnvelope || "-") +
	    " start=" + startVal + " mid=" + midVal + " end=" + startVal +
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

// Per-pluck velocity for C1 pizz cloud — gaussian (Box-Muller) distribution
// around K-assigned dynamic centerpoint. humanVel's flat ±15% uniform was
// audibly monotonous across many plucks ("all too same"); a 0.25-sigma
// gaussian gives most plucks within ±25% of center (1σ), occasional outliers
// at ±50% (2σ), preserving the K dynamic character (pp / mp / ff stays in
// its zone) while making the cloud read as a textured ensemble of plucks
// rather than a metronome at one velocity.
function pizzVel(centerVel) {
	var u1 = Math.max(1e-6, Math.random());
	var u2 = Math.random();
	var z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
	var sigma = centerVel * 0.25;
	return clamp(Math.round(centerVel + z * sigma), 20, 127);
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

	inst.bowPosBase = (cmx.bowPos != null) ? clampBowPosition(cmx.bowPos) : null;
	if (inst.bowPosBase != null) ccForce(inst, CC.BOW_POSITION, inst.bowPosBase);
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
	ccForce(inst, CC.VIBRATO_DEPTH, cmx.vibrato.depth);

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
	var faceTr = inst ? inst.faceTranspose : (state.faceTranspose || 0);
	if (reg) {
		lo = Math.max(CELLO_MIN, reg.lo);
		hi = Math.min(CELLO_MAX, reg.hi);
	}
	if (s.length === 0) return foldToRange(36 + faceTr, lo, hi);

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
	return foldToRange(pitch + faceTr, lo, hi);
}

function foldToRange(pitch, lo, hi) {
	if (lo == null) lo = CELLO_MIN;
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
// old one cuts. Legacy glissNote portamento asks SWAM to treat the overlap as
// a slide target, and 20 ms is tight enough that cold-load / state-drift can
// miss it — so that fallback uses GLISS_OVERLAP_MS instead. Current C5/C6/C7
// normally route through bendStep because slideViaBend=true.
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
// (already used by sexy-move and u-perm cube algorithms for transient
// pressure accents). Spiking CC 18 just before each slide noteOn applies a
// per-event pressure accent that SWAM hears as a fresh bow attack — without
// touching velocity (which would shrink portamento time per Velocity →
// P.MaxTime, the failure mode of D50 v1). Decouples slide intent (vel) from
// attack character (BPA spike), so wild gliss gets audible per-slide attacks
// while portamento stays fully engaged.
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

// D58 (2026-04-30) — per-complex leap tolerance. The single global
// MAX_CONSECUTIVE_LEAPS = 1 applied uniformly produced 50/50 slide/leap
// alternation on high-anchored phrases that descended across the
// 57 (A-string lower bound) — user-reported "top-half phrases dropping
// down play as two regular notes with leaps". The fundamental cause is
// physical: cellos can't slide cross-string with portamento (D46),
// and sameString() correctly returns false above 69 (A-string-only)
// targeting <57.
//   • C5 wild gliss keeps maxLeaps = 1: occasional cross-string punch
//     IS the wild character. The phraseC5 anchor seed
//     (`inst.consecutiveLeapCurrent = MAX_CONSECUTIVE_LEAPS`) still
//     forces the FIRST event to slide; subsequent events can leap up
//     to 1 in a row before being nudged.
//   • C6 ord. gliss: maxLeaps = 0. Every cross-string outcome is
//     nudged to same-string. Counter starts at 0 (default in
//     handleVoice) and the gate `0 >= 0` is always true on cross-
//     string, so no anchor seed is needed for C6 — the existing
//     handleVoice reset is sufficient.
//   • C7 tasto: maxLeaps = 0. Same as C6.
// The right long-term answer for cross-string slides is pitchbend
// (D59 design in docs/research_notes.md § Cross-String Pitchbend
// Slides) — bendStep on a single held note, audible pitch curve via
// pitchbend wheel regardless of which string the held note is on.
// Until D59 lands, D58's same-string force is the lever for "no
// leaps in C6/C7" and "1 max consecutive leap in C5."
var MAX_LEAPS_BY_COMPLEX = { 5: 1, 6: 0, 7: 0 };

function maxLeapsFor(complexType) {
	var m = MAX_LEAPS_BY_COMPLEX[complexType];
	return m != null ? (m | 0) : MAX_CONSECUTIVE_LEAPS;
}

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
// Phase 2 (2026-04-30): all multi-note complexes get the linear arc when
// face envelope is direction-bearing (swell/fade/burst). Pre-Phase-2 only
// sustained complexes (2/3/4/8) used the arc; gliss complexes (5/6/7)
// stayed on the legacy 3-stage envelope and produced an audibly stepped
// 25%/70% shape — the user-reported "predictable jump in middle of
// phrases" symptom. C1 (pizz) keeps the 3-stage envelope since the pluck
// attack character belongs there. isSingle face envelopes (pluck/stab/
// drone) resolve to one note and short-circuit to the legacy path via
// phraseArcDirection() returning null.
//
// **C2 EXCLUSION (2026-05-07)**: C2 is a directional scalar run, not a
// sustained complex. A phrase-wide CC 11 ramp under detache notes makes
// it audibly indistinguishable from C3 (constant-register cloud). C2
// realizes the phrase arc PER-NOTE inside `phraseC2` (velocity + CC 11
// + bowPosBase shaped by `phraseArcDirection(inst)`). CC 17 is sampled
// once per note and held. The dispatch at handleVoice short-circuits to
// a synchronous CC 11 seed only — no scheduled peak/sustain ramps fight
// the per-note writes.
// See `phraseC2` body and the Phrase Dynamic Arc invariant row.
var ARC_COMPLEXES = { 3: true, 4: true, 5: true, 6: true, 7: true, 8: true };

// Phase 2 chain window. Consecutive same-direction voices arriving within
// this gap chain into a single arc — the new voice inherits ccCache[CC.
// EXPRESSION] (no ccForce snap) so the listener hears one continuous
// dynamic across both voices. 1000 ms is the longest typical inter-turn
// interval at conversational regime (~1 turn/sec); above that the
// listener has heard the previous arc's natural decay and a fresh start
// reads as intentional. Lower threshold = stricter chains (more snaps
// preserved); higher = more chaining (smoother but might chain across
// intentional pauses).
var ARC_CHAIN_GAP_MS = 1000;

// C3 within-note bow motion. Every C3 note samples the current CC 11 at
// note onset; lower expression values produce faster CC 16 / CC 17 travel
// so quiet held notes remain visibly and audibly alive.
var C3_BOW_MOTION_MIN_MS = 180;
var C3_BOW_MOTION_SLOW_RATE = 0.70;
var C3_BOW_MOTION_FAST_RATE = 2.60;
var C3_BOW_POS_SHIFT_MIN = 8;
var C3_BOW_POS_SHIFT_MAX = 36;
var C3_BOW_PRESS_SHIFT_MIN = 5;
var C3_BOW_PRESS_SHIFT_MAX = 24;

// D54 — handleExprTilt EMA coefficient. Tilt is always-on always-emitting
// (no deadband like spin's 200 ms low-spin gate), so it needs stronger
// smoothing than the now-removed spinEMA/devEMA used. Lower = smoother
// (more lag); higher = more responsive (more flicker). The 30 Hz transmit
// rate means τ ≈ 1 / (α × 30) ≈ 670 ms at α=0.05 — gyro static noise is
// fully absorbed; intentional cube tilts respond within ~half a second.
var TILT_EMA_ALPHA = 0.05;

// D54 — bow-position flap fail threshold (CC 16 reversals per second of
// voice duration). At rest with the EMA fix, 0–1 reversals/sec is normal
// (rounded-int boundary crossings as EMA settles). During active tilting,
// 5–10/sec is legitimate (the user is moving). Above 10/sec means the
// EMA isn't doing its job — flap is back. Promotes the per-phrase log
// line to BOW POS FLAP. The per-phrase line itself is always-on.
var BOW_FLAP_RATE_FAIL = 10;

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
	// D55 diagnostic — every slide noteOn must be backed by SWAM being in
	// the right state for portamento to engage. Three CCs gate it:
	//   • CC 5 (PORTAMENTO_TIME) must equal cmx.portamento.time. SWAM v3
	//     "wiggles through 0" trick in setupComplex/handleVoice can race
	//     a noteon if the two ccForce writes straddle a MIDI buffer
	//     boundary — SWAM ends up latched at 0 → instant glide → no
	//     audible slide. The dashboard meanwhile sees noteon-overlap and
	//     draws as gliss, producing the user-reported
	//     "expected but not played, drawn as gliss" symptom.
	//   • CC 64 (PORTAMENTO_ON) must equal 127.
	//   • CC 81 (BOW_POLYPHONY) must equal the current complex's configured
	//     bowPoly value. Historically this was Mono Poly Release for gliss;
	//     current C5/C6/C7 use Double/Hold plus slideViaBend.
	// Cache vs expected catches bridge-internal bugs (skipped writes,
	// diff-guard suppression). It does NOT catch SWAM↔bridge wire drift
	// (would need a SWAM-side read-back via vst~ pattr — deferred). When
	// PORT TIME FAIL fires, the next fix is the wiggle-without-zero
	// approach (write `time+1` then `time` so a racing noteon at worst
	// sees a 1-unit-slower slide, never silent failure).
	var cmx = COMPLEX[inst.activeComplex];
	if (cmx && cmx.portamento && cmx.portamento.on) {
		var wantTime = cmx.portamento.time | 0;
		var gotTime  = (inst.ccCache[CC.PORTAMENTO_TIME] | 0);
		var gotOn    = (inst.ccCache[CC.PORTAMENTO_ON]   | 0);
		var polyOk   = true;
		if (HAS_BOW_POLY_CC && cmx.bowPoly != null) {
			var wantPoly = BOW_POLY_CC_VAL[cmx.bowPoly] | 0;
			var gotPoly  = (inst.ccCache[CC.BOW_POLYPHONY] | 0);
			polyOk = (gotPoly === wantPoly);
		}
		if (gotTime !== wantTime || gotOn !== 127 || !polyOk) {
			log("PORT TIME FAIL inst " + inst.id + " C" + inst.activeComplex +
			    " pitch=" + pitch +
			    " wantTime=" + wantTime + " gotTime=" + gotTime +
			    " gotOn=" + gotOn + " (want 127)" +
			    " polyOk=" + polyOk);
		}
	}

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
// and the legacy portamento engine slides cleanly only when both source and
// target reach a single string. A cross-string overlap engages SWAM's
// portamento state internally then bails to a string-cross leap when it can't
// reach the target — audibly a leap, but the GUI shows a residual portamento
// attempt that doesn't match the sound. To make MIDI intent unambiguous, the
// bridge classifies every gliss step:
//
//   sameString(src, dst) === true  → emit overlap (legacy portamento fallback)
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
		var gc = inst.glissCompanion;
		if (gc && gc.currentPitch != null) {
			var companionTarget = hp + gc.offsetSemis;
			if (companionTarget < DOUBLE_STOP_ROLL_MIN || companionTarget > DOUBLE_STOP_ROLL_MAX) {
				log("DOUBLE STOP RANGE FAIL inst " + inst.id + " C" + inst.activeComplex +
				    " leapTarget=" + hp +
				    " offset=" + gc.offsetSemis +
				    " companionTarget=" + companionTarget +
				    " range=" + DOUBLE_STOP_ROLL_MIN + ".." + DOUBLE_STOP_ROLL_MAX +
				    " - ending gliss companion");
				inst.glissCompanion = null;
				inst.glissCompanionExpected = false;
				inst.activeNotes.push(hp);
			} else {
				noteOn(inst, companionTarget, gc.vel, /*isCompanion=*/ true);
				gc.currentPitch = companionTarget;
				gc.revoiceCount = (gc.revoiceCount | 0) + 1;
				inst.activeNotes.push(companionTarget);
				inst.activeNotes.push(hp);
			}
		} else {
			inst.activeNotes.push(hp);
		}
	});
}

// bendStep — D59 cross-string slide via pitchbend wheel. Used when
// sameString(src, dst) is false but the interval fits in
// PITCHBEND_RANGE_SEMI. Audible result: continuous pitch curve from
// source to target on the source string (whatever it is) via SWAM's
// pitchbend response, regardless of which physical string each pitch
// would normally sit on.
//
// The held source note rings throughout the bend at audible pitch
// `source + bend / 8192 × range`. At ramp end, three messages fire
// in this order (sub-1ms apart, single JS tick):
//
//   1. emitPitchbend(8192)         — wheel returns to center; held
//                                    source's audible pitch drops
//                                    from target back to source
//                                    briefly.
//   2. noteOff(source)             — source begins release.
//   3. noteOn(target, vel)         — target attacks at target_written
//                                    (bend is 0, no offset).
//
// Order matters: with bend reset BEFORE noteOn target, the new note's
// physical-model attack transient plays at the correct pitch. The
// brief "audible drop to source" between (1) and (2) is masked by
// the new attack in (3); listener perceives a smooth slide finishing
// with a clean target attack.
//
// OSC echo: `/xk/midi/bendstep <voice> <fromPitch> <toPitch> <durMs>
// <complex>` fires at the START of the bend so the dashboard can
// model the segment in advance. The follow-up noteOff(source) +
// noteOn(target) echo via the existing MIDI_NOTEOFF / MIDI_NOTEON
// addresses; the dashboard's bendstep handler suppresses the
// chain-break that the new noteOn would otherwise trigger.
//
// Counters: `glissBendCount++` (paralleling glissOverlapCount /
// glissLeapCount). D42 invariant updated to slides + bends + leaps.
//
// `glissVel` overrides default velocity (C5 wild bumps to
// WILD_GLISS_VEL = 22 for slide audibility); C6/C7 use GLISS_VEL.
// `accent` (D52) spikes CC 18 just before the noteOff/noteOn pair —
// the per-event attack character belongs at the TARGET, not the
// source, so we time the spike to coincide with the target's
// attack.
//
// Caller is responsible for tracking the audible target pitch as
// the new "source" for subsequent steps — this function returns
// nothing; phraseC5/6/7 update lastPitchRef from the dispatcher
// (glissStep returns target pitch).
// `desiredDurMs` (optional, default null) — caller-supplied bend duration.
// When provided, overrides the per-complex `_bendDur` formula and clamps to
// `[80, MAX_BEND_DUR_MS]`. Used by C6 same-string slides (slideViaBend) to
// scale duration with time-to-next-event; the default `_bendDur` is capped
// at `MIN_GLISS_SPACING_MS - 5 = 195 ms` for D60 race-safety on cross-
// string fallbacks where the caller doesn't know the inter-event gap.
function bendStep(inst, sourcePitch, targetPitch, glissVel, accent, complex, desiredDurMs) {
	// D80 — softBend mode: the bow stays on the original anchor noteOn for
	// the whole phrase, with cumulative pitchbend offsetting from there.
	// heldSource is the anchor (= first / only entry in activeNotes) rather
	// than a per-event lookup against `sourcePitch`, because sourcePitch
	// here is the AUDIBLY-current pitch (anchor + previous offset) — never
	// matches activeNotes in soft mode.
	var cmxResolved = COMPLEX[complex || inst.activeComplex];
	var softBend = cmxResolved && cmxResolved.softBend === true;
	var heldSource = null;
	if (softBend) {
		if (inst.activeNotes.length > 0) {
			heldSource = inst.activeNotes[0];
		}
		if (heldSource == null) {
			log("BEND FAIL inst " + inst.id + " C" + (complex || inst.activeComplex) +
			    " softBend=true but no anchor in activeNotes — falling back to leapStep");
			leapStep(inst, targetPitch);
			return;
		}
	} else {
		// D60 — find the actual held source note, don't re-humanise.
		// `humanPitch` has a 10% chance of shifting by ±1 SEMITONE (not
		// the small jitter I assumed during D59 design). Calling humanPitch
		// here would produce a fresh random shift that doesn't match what
		// noteOn put into inst.activeNotes earlier — the end-of-bend
		// noteOff would target a pitch that doesn't exist, leaving the
		// real note ringing forever, queues piling up, and visuals
		// diverging from audio. Match by Math.round so a humanPitch shift
		// of +1 still resolves to the right active entry.
		for (var ai = 0; ai < inst.activeNotes.length; ai++) {
			if (Math.round(inst.activeNotes[ai]) === Math.round(sourcePitch)) {
				heldSource = inst.activeNotes[ai];
				break;
			}
		}
		if (heldSource == null) {
			// Defensive — bendStep is only called from glissStep, which
			// itself is only called after a noteOn has populated
			// activeNotes. If we get here something is wrong upstream;
			// log loudly and fall through to leapStep so we never
			// silently emit a noteOff for a pitch SWAM doesn't have.
			log("BEND FAIL inst " + inst.id + " C" + (complex || inst.activeComplex) +
			    " sourcePitch=" + sourcePitch + " not in activeNotes [" +
			    inst.activeNotes.join(",") + "] — falling back to leapStep");
			leapStep(inst, targetPitch);
			return;
		}
	}

	// D72.1 — bend target is NOT humanized. The bendstep echo emits the
	// integer target to the dashboard (chain segment p1, bend-grace
	// expected pitch); completeBend later fires noteOn(hpTarget). If
	// hpTarget is humanPitch's 10%-chance ±1 shift of targetPitch, the
	// echoed target and the actual noteOn pitch disagree by 1 semi 10%
	// of the time → manifests as `GLISS SYNC FAIL ... linePitch=N
	// chainPitch=N+1` with the line stuck 1 semi off the chain for the
	// rest of the bend (and the next bend's heldSource lookup fails on
	// the same shift, falling through to leapStep). Slides should land
	// precisely on the sieve walk pitch — humanPitch jitter on slide
	// targets was musically inert and visually load-bearing. Pre-D72
	// this affected only cross-string bends (rare + short, ≤ 195 ms);
	// D72's same-string bends made it constant + lingering up to
	// MAX_BEND_DUR_MS.
	var hpTarget = clamp(Math.round(targetPitch), CELLO_MIN, CELLO_MAX);
	// Compute bend in INTEGER semitones from heldSource (humanPitch-
	// shifted lookup of activeNotes via Math.round) toward the integer
	// target. The bend's audible curve lands on the same pitch the
	// noteOn fires on — visual sync invariant holds.
	// D80 — softBend is anchor-relative: the wheel value encodes the
	// cumulative offset from the anchor noteOn (which stays held all
	// phrase). hardBend is source-relative: the wheel resets to center
	// at every completeBend rebow, so each bend's offset is from the
	// fresh source. `semis` is the offset value the WHEEL must reach.
	var semis = softBend
		? (hpTarget - Math.round(heldSource))
		: (hpTarget - Math.round(sourcePitch));
	var clamped = clamp(semis, -PITCHBEND_RANGE_SEMI, PITCHBEND_RANGE_SEMI);
	if (clamped !== semis) {
		log("BEND CLIP inst " + inst.id + " C" + (complex || inst.activeComplex) +
		    " semis=" + semis + " range=±" + PITCHBEND_RANGE_SEMI +
		    " — bendStep dispatched with over-range interval; should have routed to leapStep");
	}
	var targetBend = clamp(PITCHBEND_CENTER + Math.round(clamped * 8192 / PITCHBEND_RANGE_SEMI), 0, 16383);
	var durMs = (desiredDurMs != null)
		? clamp(Math.round(desiredDurMs), 80, MAX_BEND_DUR_MS)
		: _bendDur(sourcePitch, targetPitch, complex || inst.activeComplex);

	// Echo to dashboard with INTEGER pitches — the dashboard's relay
	// parses with `| 0` and the chain-grace match is integer-valued.
	// D72.1 — echo `hpTarget` (= the integer target the noteOn will
	// actually fire at) so the chain segment p1 + bend-grace expected
	// pitch align with what the line model sees from the noteon echo.
	// Pre-D72.1 this used `Math.round(targetPitch)` (the logical, pre-
	// humanization target), which agreed with hpTarget's old humanPitch
	// path 90% of the time and disagreed by 1 semi the other 10% — the
	// chain-grace ±1 tolerance hid the chainStart classification but
	// the chain segment's frozen p1 + the line's actual noteOn pitch
	// stayed 1 semi apart, manifesting as `GLISS SYNC FAIL` with the
	// stuck triangle the user saw post-D72. Now hpTarget is the integer
	// target (no humanization), so all three sites (echo, semis math,
	// completeBend's noteOn) reference the SAME integer.
	outlet(ECHO_OUTLET, OSC.MIDI_BENDSTEP, inst.voice,
	       Math.round(sourcePitch), hpTarget, durMs | 0,
	       inst.activeComplex || (complex || 0), inst.planId || 0);

	// Optional accent: spike CC 18 just before target's noteOn fires.
	// BPA_RESET_MS is typically ≥ 100ms; for bends durMs is now ≤ 150ms
	// post-D60 cap, so spike now and reset on the target's noteOn so
	// it gets the bow-pressure-accent boost on its attack.
	if (accent && HAS_BOW_PRESS_ACCENT) {
		ccForce(inst, CC.BOW_PRESS_ACCENT, accent);
	}

	rampPitchbend(inst, targetBend, durMs);

	// Schedule the atomic transition at ramp end. completeBend(inst)
	// is the single execution path — we just call it from a Task. If
	// glissStep needs to force-complete inline (D63 race safety), it
	// also calls completeBend(inst) and the Task here becomes a no-op
	// (bendPending is null after the inline run).
	inst.bendPending = {
		hpSource: heldSource,
		hpTarget: hpTarget,
		vel:      glissVel || GLISS_VEL,
		softBend: softBend,
	};
	inst.bendPendingTask = scheduleAt(inst, durMs, function() {
		completeBend(inst, /*scheduled=*/ true);
	});

	// Optional accent reset — same pattern as glissNote.
	if (accent && HAS_BOW_PRESS_ACCENT) {
		scheduleAt(inst, durMs + BPA_RESET_MS, function() {
			ccForce(inst, CC.BOW_PRESS_ACCENT, 0);
		});
	}
}

// Per-complex bend duration. Uses the same per-semitone table as the
// dashboard's GLISS_PORTAMENTO_MS_PER_SEMITONE so the visual segment
// model and the audio bend duration agree (Phase 1 Visual Invariant
// #3). Min 80 ms (avoid sub-perceptible bends), max capped at
// MIN_GLISS_SPACING_MS - BEND_DUR_MARGIN_MS so a bend reliably
// completes before the next gliss event dispatches.
//
// D60 — without ANY cap, an 8-semi C5 bend at 50 ms/semi = 400 ms
// vs. event spacing of 200 ms caused the next event to fire WHILE
// the previous bend's pitchbend ramp was still running, leaking
// offset into the new noteOn audibly + accumulating stale activeNotes.
//
// D63 — D60 originally set the margin to 50 ms. That left a 50 ms
// stationary "held at target" tail between every bend's atomic
// transition and the next event's dispatch — visible as horizontal
// "still note" lines at the top/bottom of the rolling-score axis
// (especially obvious for bends ending at extreme pitches that
// clamped to ROLL_MAX_MIDI=84). The user-reported "still notes that
// shouldn't exist in wild gliss" symptom in temp1.png. Margin
// tightened to 5 ms — bend ramp now fills the inter-event time
// almost entirely, leaving a sub-perceptible 5 ms gap (~2 px on
// screen) between bends. Race safety against scheduling jitter is
// covered by `completeBend(inst)` called at the top of `glissStep`:
// if the bend's atomic transition hasn't fired yet when the next
// event dispatches, force-complete it inline.
var BEND_DUR_MARGIN_MS = 5;

// Upper cap on bend duration when the caller passes an explicit
// `desiredDurMs` to `bendStep`. Used by C6 same-string slides
// (slideViaBend = true) where the desired duration scales with the
// time-to-next-event; without a cap, wide-spread phrases could request
// multi-second bends and a voice steal mid-bend leaves a dashboard
// chain segment with the original long `dur` registered, dangling
// visually for up to that duration after the steal (the bend's `dur`
// is committed to `bendSegments` at echo time and only cleaned up
// when the segment ages past the cull horizon). 1200 ms balances the
// user's "much longer than 100-200 ms" target against bounded
// dangling-visual hang time on rapid cube-turn play.
var MAX_BEND_DUR_MS = 1200;
function _bendDur(fromP, toP, complex) {
	var interval = Math.abs(Math.round(toP) - Math.round(fromP));
	var perSemi;
	// MUST match `PORTAMENTO_MS_PER_SEMITONE` in `public/js/constants.js`
	// (visual-line + rolling-chain segment models read from there). C6 was
	// out of sync at 80 here while the dashboard's mirror was bumped to 100;
	// the mismatch only mattered for cross-string fallbacks (rare on C6),
	// but resync to avoid drift surprising the next reader.
	if (complex === 5) perSemi = 50;
	else if (complex === 6) perSemi = 100;
	else if (complex === 7) perSemi = 115;
	else perSemi = 80;
	var ms = interval * perSemi;
	if (ms < 80) ms = 80;
	var cap = MIN_GLISS_SPACING_MS - BEND_DUR_MARGIN_MS;
	if (ms > cap) ms = cap;
	return ms;
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
//   slideViaBend / cross-string in range → bendStep   → glissBendCount++
//   legacy same-string fallback          → glissNote  → glissOverlapCount++
//   over-range fallback                  → leapStep   → glissLeapCount++
// D46: explicit dispatch keeps SWAM out of the "tried to portamento, couldn't
// reach target on this string, GUI shows residual portamento state without
// the audible slide" failure mode. All counters feed the D42 invariant
// (totalEvents = slides + bends + leaps must be ≥ 1 per gliss-complex voice).
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
// `bendDurOverride` (optional) — caller-supplied bend duration in ms.
// Forwarded to `bendStep` when this dispatch routes through pitchbend
// (cross-string OR same-string-on-slideViaBend complexes). Used by
// `phraseC6` to scale slide duration with the gap to the next event so
// long-spread C6 phrases produce the multi-second smooth contours the
// performer expects, instead of every slide being capped at the
// portamento-time-table value (~100 ms/semi for C6).
function glissStep(inst, sourcePitch, targetPitch, minLeap, glissVel, accent, bendDurOverride) {
	var p = enforceLeap(sourcePitch, targetPitch, minLeap);
	// D58 — per-complex leap tolerance. C5 keeps 1 (wild punch); C6/C7
	// drop to 0 (always nudge cross-string to same-string). With D59
	// shipped, cross-string outcomes can also slide via pitchbend
	// (bendStep), so keeping per-complex tolerance > 0 is safe — the
	// dispatch below preserves slide character even on cross-string.
	var maxLeaps = maxLeapsFor(inst.activeComplex);
	if ((inst.consecutiveLeapCurrent | 0) >= maxLeaps && !sameString(sourcePitch, p)) {
		var nudged = nudgeToSameString(sourcePitch, p, minLeap);
		if (nudged != null) p = nudged;
	}
	// D63 race-safety — if a bend's atomic transition is still pending
	// (scheduled task hasn't fired yet AND we're dispatching the next
	// event), force-complete it inline. Without this, with the tight
	// 5ms bend-dur margin (D63), scheduling jitter could reverse the
	// firing order: next event glissStep runs before the bend's noteOff/
	// noteOn — the in-flight bend's pitchbend offset would then leak
	// into the new event's noteOn audibly. completeBend resets bend,
	// fires the deferred noteOff source + noteOn target, and clears
	// the pending state. Safe to call when nothing is pending (no-op).
	if (inst.bendPending) completeBend(inst, /*scheduled=*/ false);

	// D46 + D59 + D72 dispatch:
	//   • interval > PITCHBEND_RANGE_SEMI                      → leapStep
	//                  (over-range fallback; pitchbend wheel can't reach)
	//   • interval ≤ PITCHBEND_RANGE_SEMI AND
	//     (cmx.slideViaBend === true OR cross-string)          → bendStep
	//                  (pitchbend wheel on held source; smooth audible
	//                   curve. Same-string on slideViaBend complexes (C6)
	//                   bypasses portamento's CC 5 ≤ 127 ms/semi cap and
	//                   accepts a per-call duration override so phraseC6
	//                   can time slides to the gap-to-next-event.)
	//   • interval ≤ PITCHBEND_RANGE_SEMI AND same-string AND
//     no slideViaBend                                       → glissNote
//                  (legacy portamento overlap fallback)
	var cmx = COMPLEX[inst.activeComplex];
	var overRange = Math.abs(p - sourcePitch) > PITCHBEND_RANGE_SEMI;
	var preferBend = cmx && cmx.slideViaBend === true;
	if (overRange) {
		log("BEND CLIP inst " + inst.id + " C" + inst.activeComplex +
		    " interval=" + Math.abs(p - sourcePitch) +
		    " > PITCHBEND_RANGE_SEMI=" + PITCHBEND_RANGE_SEMI +
		    " — falling back to leapStep");
		leapStep(inst, p);
		inst.glissLeapCount = (inst.glissLeapCount | 0) + 1;
		inst.lastWasLeap = true;
		inst.consecutiveLeapCurrent = (inst.consecutiveLeapCurrent | 0) + 1;
		if (inst.consecutiveLeapCurrent > (inst.consecutiveLeapMax | 0)) {
			inst.consecutiveLeapMax = inst.consecutiveLeapCurrent;
		}
	} else if (preferBend || !sameString(sourcePitch, p)) {
		bendStep(inst, sourcePitch, p, glissVel, accent, inst.activeComplex, bendDurOverride);
		inst.glissBendCount = (inst.glissBendCount | 0) + 1;
		// Bend slides count as slides for the leap-alternation counter
		// (audible result is a slide). D58's MAX_LEAPS gate effectively
		// counts ONLY over-range leapStep fallbacks now.
		inst.lastWasLeap = false;
		inst.consecutiveLeapCurrent = 0;
	} else {
		glissNote(inst, humanPitch(p), glissVel, accent);
		inst.glissOverlapCount = (inst.glissOverlapCount | 0) + 1;
		inst.lastWasLeap = false;
		inst.consecutiveLeapCurrent = 0;
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

// D78 — wild-gliss schedule with stochastic gap variation. glissSchedule
// produces uniform spacing → every bend in a wild gliss phrase ends up at
// the same speed because `bendDur` is gap-derived in `phraseC5`
// (Math.max(80, Math.min(gap - 50, MAX_BEND_DUR_MS))) and the gaps are
// equal. wildGlissSchedule applies a power-law-distributed perturbation:
// most gaps short (= fast punches), some long (= languid rides). The
// per-event variation is what gives wild gliss its varied-speed character
// instead of the previous uniform train.
//
// Invariants preserved:
//   D43 — first event still at `firstMs` (immediate-first-gliss).
//   D45 — every gap clamped to ≥ `minSpacingMs` so consecutive bends
//         can complete before the next slide overrides them.
//   D42 — count ≥ 1 by virtue of returning at least `[firstMs]`.
//   Trailing events drop (clip-not-collapse) if total time would exceed
//   `tailEnd`, matching glissSchedule's policy.
//
// Used only by phraseC5. C6/C7 keep glissSchedule because their phrase
// character (ordered sliding through the sieve) wants uniform pacing.
function wildGlissSchedule(maxCount, firstMs, tailEnd, minSpacingMs) {
	var times = [firstMs];
	if (maxCount <= 1) return times;
	var nGaps = maxCount - 1;
	var available = tailEnd - firstMs;
	var rawGaps = [];
	var rawTotal = 0;
	for (var i = 0; i < nGaps; i++) {
		// Power-law gap factor: `rand^2` biases toward 0 (short gaps win
		// most rolls), with a 0.4 baseline so no gap is genuinely tiny.
		// Span [0.4, 2.0] = 5× ratio between shortest and longest raw
		// gaps; after uniform scaling to fit `available`, the realised
		// ratio narrows but stays musically distinct.
		var g = 0.4 + 1.6 * Math.pow(Math.random(), 2);
		rawGaps.push(g);
		rawTotal += g;
	}
	var scale = (rawTotal > 0) ? (available / rawTotal) : 1;
	var t = firstMs;
	for (var i = 0; i < nGaps; i++) {
		var gap = Math.max(minSpacingMs, rawGaps[i] * scale);
		t += gap;
		if (t > tailEnd) break;
		times.push(Math.round(t));
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
// Gliss callers may use this only when their slides route through pitchbend
// and Bow Polyphony is Double/Hold. C5/C6 satisfy that contract and call this
// explicitly; C7 is configured so future companions could sound, but phraseC7
// is currently single-voice until the musical design says otherwise.

// Musical cello double-stop intervals (semitones). Weighted toward perfect
// 4th / 5th / octave and major-6th — the "open string + stopped note"
// double stops that ring most naturally on a real cello.
var DOUBLE_STOP_INTERVALS = [3, 4, 5, 7, 8, 9, 12];
var DOUBLE_STOP_ROLL_MIN = CELLO_MIN;
var DOUBLE_STOP_ROLL_MAX = 84;  // dashboard rolling-score top; companions must remain visible

function shuffledDoubleStopIntervals() {
	var arr = DOUBLE_STOP_INTERVALS.slice();
	for (var i = arr.length - 1; i > 0; i--) {
		var j = Math.floor(Math.random() * (i + 1));
		var tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
	}
	return arr;
}

function doubleStopDirOrder(mainPitch) {
	var dirPref;
	if (mainPitch >= 60)      dirPref = -1;  // C4+: drop the companion below
	else if (mainPitch <= 48) dirPref =  1;  // C3-: raise the companion above
	else                      dirPref = (Math.random() < 0.5) ? 1 : -1;
	return [dirPref, -dirPref];
}

// Pick a companion pitch for a double stop paired with `mainPitch`.
// Direction biased by register so both pitches land in comfortable
// cello double-stop range (MIDI 36–77). Returns null if no usable
// companion fits (never happens inside CELLO_MIN..CELLO_MAX in practice).
function doubleStopCompanion(mainPitch) {
	var intervals = shuffledDoubleStopIntervals();
	var dirs = doubleStopDirOrder(mainPitch);
	for (var i = 0; i < intervals.length; i++) {
		for (var d = 0; d < dirs.length; d++) {
			var candidate = mainPitch + dirs[d] * intervals[i];
			if (candidate >= CELLO_MIN && candidate <= 77 && candidate !== mainPitch) {
				return candidate;
			}
		}
	}
	return null;
}

// Pick a fixed parallel companion offset that stays inside [rangeLo, rangeHi]
// across the whole planned main gliss span. Used by C5/C6 before scheduling
// any bends so the dashboard never draws, and SWAM never plays, an out-of-
// range gliss double-stop.
function doubleStopCompanionForRange(mainPitch, mainMin, mainMax, rangeLo, rangeHi) {
	mainMin = Math.min(mainMin, mainPitch);
	mainMax = Math.max(mainMax, mainPitch);
	var intervals = shuffledDoubleStopIntervals();
	var dirs = doubleStopDirOrder(mainPitch);
	for (var i = 0; i < intervals.length; i++) {
		for (var d = 0; d < dirs.length; d++) {
			var offset = dirs[d] * intervals[i];
			var candidate = mainPitch + offset;
			if (candidate === mainPitch) continue;
			if (candidate < rangeLo || candidate > rangeHi) continue;
			if (mainMin + offset < rangeLo) continue;
			if (mainMax + offset > rangeHi) continue;
			return candidate;
		}
	}
	return null;
}

// Stochastic double stop. With probability `p`, emits a companion noteOn
// at 85% of the main velocity. The companion is registered in
// inst.activeNotes so the next legato overlap / release / steal / panic
// cleans it up the same way as any main pitch.
//
// Used by C2 / C3. C4 and C8 create their extra notes through local phrase
// logic; C5/C6 gliss use maybeGlissDoubleStop so their companions can be
// range-checked across the full path and re-voiced at bend boundaries.
// C7 currently excludes companions by omission, even though its COMPLEX entry
// is prepared for future companions.
// Returns the companion pitch if a companion was added, else null.
function maybeDoubleStop(inst, mainPitch, vel, p) {
	if (Math.random() >= p) return null;
	if (inst.bendPending) {
		log("BEND COMPANION FAIL inst " + inst.id + " C" + inst.activeComplex +
		    " mainPitch=" + mainPitch +
		    " pendingSource=" + inst.bendPending.hpSource +
		    " pendingTarget=" + inst.bendPending.hpTarget +
		    " - suppressed companion noteOn during pitchbend ramp");
		return null;
	}
	var companion = doubleStopCompanion(mainPitch);
	if (companion == null) return null;
	// `isCompanion=true` flags the noteon echo so dashboard renders the
	// companion as a non-gliss brush (rather than getting absorbed into
	// the main's gliss chain). Without this, C6 companions never showed
	// up visually — `buildGlissChains` grouped both the main anchor and
	// the companion noteon into one chain group, then drew a single
	// connected path that zigzagged between them; the user-reported
	// "C6 audible double-stop but only one voice drawn" symptom.
	noteOn(inst, companion, Math.max(1, Math.round(vel * 0.85)), /*isCompanion=*/ true);
	inst.activeNotes.push(companion);
	return companion;
}

function maybeGlissDoubleStop(inst, mainPitch, vel, p, minMainPitch, maxMainPitch) {
	if (Math.random() >= p) return null;
	if (inst.bendPending) {
		log("BEND COMPANION FAIL inst " + inst.id + " C" + inst.activeComplex +
		    " mainPitch=" + mainPitch +
		    " pendingSource=" + inst.bendPending.hpSource +
		    " pendingTarget=" + inst.bendPending.hpTarget +
		    " - suppressed companion noteOn during pitchbend ramp");
		return null;
	}
	var companion = doubleStopCompanionForRange(
		mainPitch,
		minMainPitch,
		maxMainPitch,
		DOUBLE_STOP_ROLL_MIN,
		DOUBLE_STOP_ROLL_MAX
	);
	if (companion == null) {
		log("DOUBLE STOP RANGE SKIP inst " + inst.id + " C" + inst.activeComplex +
		    " main=" + mainPitch +
		    " span=" + minMainPitch + ".." + maxMainPitch +
		    " range=" + DOUBLE_STOP_ROLL_MIN + ".." + DOUBLE_STOP_ROLL_MAX);
		return null;
	}
	var cvel = Math.max(1, Math.round(vel * 0.85));
	noteOn(inst, companion, cvel, /*isCompanion=*/ true);
	// Put companion first and the main source last. cancelPhrase's
	// preserveLegatoTail path keeps the last active note for legato-capable
	// follow-up voices; the tail must be the main gliss pitch, not the
	// parallel companion.
	inst.activeNotes.unshift(companion);
	inst.glissCompanion = {
		offsetSemis: companion - mainPitch,
		currentPitch: companion,
		vel: cvel,
		minPitch: minMainPitch,
		maxPitch: maxMainPitch,
		revoiceCount: 0
	};
	inst.glissCompanionExpected = true;
	return companion;
}

// ================================================================
// TURN-RATE PRESSURE
// ================================================================
// K_i remains the baseline identity. Turn rate adds bounded urgency:
// density/event saturation, attack velocity, expression peak, bow pressure,
// C8 tremolo speed, and C5 per-gliss Bow Pressure Accent. Gains are
// generated from src/swam-mapping.ts into gen_includes.js.
function turnRatePressure() {
	var start = RATE_PRESSURE_START_TPS || 0.3;
	var full  = RATE_PRESSURE_FULL_TPS  || 3.0;
	var rate = state.turnRate || 0;
	return clamp((rate - start) / (full - start), 0, 1);
}

function rateMultiplier(table, complexType) {
	var gain = table && table[complexType] != null ? table[complexType] : 0;
	return 1 + gain * turnRatePressure();
}

function rateDensityMultiplier(complexType) {
	return rateMultiplier(RATE_DENSITY_GAIN_BY_COMPLEX, complexType);
}

function rateVelocityMultiplier(complexType) {
	return rateMultiplier(RATE_VELOCITY_GAIN_BY_COMPLEX, complexType);
}

function rateExpressionMultiplier(complexType) {
	return rateMultiplier(RATE_EXPR_GAIN_BY_COMPLEX, complexType);
}

function rateBowPressureMultiplier(complexType) {
	return rateMultiplier(RATE_BOW_GAIN_BY_COMPLEX, complexType);
}

function rateTremoloMultiplier(complexType) {
	return rateMultiplier(RATE_TREMOLO_GAIN_BY_COMPLEX, complexType);
}

function rateAccentValue(baseValue, complexType) {
	return clamp(Math.round(baseValue * rateMultiplier(RATE_ACCENT_GAIN_BY_COMPLEX, complexType)), 0, 127);
}

function durationFloorForComplex(complexType) {
	var table = (typeof COMPLEX_DURATION_FLOOR_SEC !== "undefined") ? COMPLEX_DURATION_FLOOR_SEC : null;
	return table && table[complexType] != null ? table[complexType] : 0;
}

// ================================================================
// PHRASE HELPERS
// ================================================================
function phraseCount(inst, baseLo, baseHi) {
	var intMap = INTENSITY_MAP[inst.intensity] || INTENSITY_MAP["mf"];
	var iMult = intMap.density;
	var dMult = clamp(0.6 + inst.density * 0.25, 0.6, 1.8);
	var rMult = rateDensityMultiplier(inst.activeComplex);
	var lo = Math.max(1, Math.round(baseLo * iMult));
	var hi = Math.max(lo, Math.round(baseHi * iMult * dMult * rMult));
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
	var velCurve = (inst.faceEnvProfile && inst.faceEnvProfile.velCurve) || 'flat';
	// User request: a 4-second C1 should pluck across the WHOLE 4 seconds,
	// not crowd into the first 700 ms. Pre-fix `spread = min(dur*1000, 700)`
	// hard-capped pluck distribution at 700 ms regardless of duration.
	// Now: rate-driven count (5/sec ≈ dense pizz cloud) with even-ish
	// spacing + jitter, plus 25% chance of 2-3 pluck cluster for the
	// "burst / polyphonic" character.
	var rate = 5.0 * rateDensityMultiplier(inst.activeComplex);
	var count = Math.max(2, Math.round(dur * rate));
	var spacing = (dur * 1000) / count;
	for (var i = 0; i < count; i++) {
		(function(idx, stepCount) {
			var jitter = (Math.random() - 0.5) * spacing * 0.6;
			var t = Math.max(0, Math.round(idx * spacing + jitter));
			scheduleAt(inst, t, function() {
				var clusterSize = (Math.random() < 0.25) ? rrand(2, 3) : 1;
				for (var k = 0; k < clusterSize; k++) {
					(function(kk) {
						scheduleAt(inst, kk * 8, function() {
							var p = humanPitch(pickPitch(1, inst));
							var v = pizzVel(vel * stepVelScale(velCurve, idx, stepCount));
							noteOn(inst, p, v);
							inst.activeNotes.push(p);
							scheduleAt(inst, rrand(60, 220), function() {
								noteOff(inst, p);
								var pidx = inst.activeNotes.indexOf(p);
								if (pidx >= 0) inst.activeNotes.splice(pidx, 1);
							});
						});
					})(k);
				}
			});
		})(i, count);
	}
	scheduleRelease(inst, dur);
}

// C2: OrderedCloudAscDesc — directional scalar run, NOT a sustained
// long-tone cloud. Differentiated from C3 (constant-register hover) and
// C7 (drifting sustain) by audible per-note motion through the sieve.
// Pre-2026-05-07 phraseC2 was a slow legato cloud with 50% double-stops
// + phrase-wide CC 11 arc; in practice that read identically to C3, so
// C2's "ascending or descending cloud of sound-points" identity was
// silently lost. This rewrite restores it.
//
// Density (rate-driven, tempo-curved, turn-rate-aware): tempoCurve(u)
// returns absolute rate in notes/sec, with endpoints loRate / hiRate
// derived from `turnRatePressure()` ∈ [0,1]:
//   • turnP=0 (slow turning): range = [4, 8] notes/sec.
//   • turnP=1 (fast turning): range = [6, 12] notes/sec.
// Span ratio is held constant at 2× across all turn rates so accel/rit
// remains audible without snapping into a steep density surge. Curve is
// EXPONENTIAL in rate (geometric):
// each unit of u multiplies rate by a fixed factor — linear-in-log-rate
// matches musical tempo perception. Per-phrase total count = round(dur
// × tempoAvg) where tempoAvg = ∫_0^1 tempoCurve(u) du (computed via
// trapezoidal sampling).
//
// Articulation (emergent — no regime switch): every note rolls a random
// "intrinsic ring time" `r ~ uniform[C2_RING_MIN_MS, C2_RING_MAX_MS] =
// [120, 320] ms`. Actual scheduled noteOff = MIN(r, spacingToNext)
// for monophonic notes, or just before spacingToNext for intentional
// dyads. This mirrors how a real cellist's finger lift
// timing — not an articulation switch — produces detache only when the
// bow outpaces finger placement:
//   r ≥ spacingToNext → SWAM auto-releases the held note when our next
//                       noteOn arrives → smooth monophonic transition
//                       (default behaviour, all "legato").
//   r < spacingToNext → our noteOff fires before next noteOn → audible
//                       gap = (spacingToNext − r) ms → detache emerges.
// At fast tempi (spacing < 120 ms) every note is legato by construction;
// at slow tempi (spacing > 120 ms) detache appears probabilistically.
// **Bow polyphony is per-note dynamic** (CC 81 written before each
// noteOn). Default per note is MONO_POLY_RELEASE — SWAM auto-releases
// the held note on the next noteOn → smooth monophonic legato, no
// chord regardless of inter-note overlap. INTENTIONAL double-stop
// notes (probability `C2_DOUBLE_STOP_PROB = 0.30`, first note always
// solo) flip CC 81 to DOUBLE_HOLD before noteOns so main + companion
// (picked via `doubleStopCompanion`) sustain together as a true dyad.
// Their ndur is capped at `spacingToNext - C2_DOUBLE_STOP_GUARD_MS`
// so the dyad's noteOffs fire before the next noteOn — no bleed
// through into the following note. The next note's task writes its
// own CC 81 mode at noteOn time, so mode is race-free regardless of
// previous noteOff timing. Result: monophonic transitions are SWAM-
// auto-released cleanly; double stops are heard as held dyads; never
// do they mix accidentally.
//
// Tempo direction couples to the dynamic arc (single phrase-shape
// parameter, like real cello playing where accel pairs with cresc):
//   cresc → accel (lo → hi)             dim → rit (hi → lo)
//   hairpin-up → accel-rit (peak mid)   hairpin-down → rit-accel
//   no-arc face → random accel/rit per phrase
// Implemented in `buildC2Tempo` via trapezoidal integration of the
// tempo curve to a cumulative phase array; notes placed at phase-uniform
// targets so local note rate matches local tempo exactly.
//
// Phrase arc PER-NOTE (independent of tempo): velocity, CC 11
// (Expression), and inst.bowPosBase migration are shaped per-stroke
// from arcMul(idx, total). CC 17 (Bow Pressure) is sampled once per note
// from the voice bow-pressure baseline and held static for that note.
// C2 is excluded from ARC_COMPLEXES so no phrase-wide CC 11 ramp runs
// underneath.
//
// Intentional double-stops are explicit, local events. The baseline run
// stays MONO_POLY_RELEASE; only notes that roll the double-stop branch
// flip to DOUBLE_HOLD for their dyad.
//
// Recurring-Bug Discipline (2026-05-07): the regression that motivated
// this rewrite (C2 silently identical to C3) shipped without telemetry.
// The per-phrase log line below is the invariant — if a future refactor
// re-collapses C2 to "long tones" (sparse count, fixed spacing, double
// stops back), it'll show up immediately in `[print xk_swam]`.
// C2 within-phrase note rate (notes/sec) endpoints. The tempo curve
// spans from `loRate` (slow point) to `hiRate` (fast point); both
// scale with turn-rate pressure (`turnRatePressure()` ∈ [0, 1]):
//   • turnP=0 (slow turning): range = [C2_RATE_MIN=4, C2_RATE_MIN×SPAN=8].
//   • turnP=1 (fast turning): range = [C2_RATE_MAX/SPAN=6, C2_RATE_MAX=12].
// Span ratio is held constant at C2_RATE_SPAN_RATIO = 2 across all turn
// rates, so the within-phrase accel/rit is always a 2× swing — audible
// but less steep than the prior 3× curve. Replaces the previous baseRate × tempo-
// multiplier model: turn-rate scaling now lives in the endpoints, not
// in a separate `rateDensityMultiplier(2)` layer (one source of truth).
//
// The within-phrase curve is **exponential** in rate (geometric), using
// compressed progress `w = min(1, u / C2_CURVE_END_U)`:
//   accel: rate(u) = lo × spanFactor^w
//   rit:   rate(u) = hi × spanFactor^(-w)
//   hairpin-up:   rate(u) = lo × spanFactor^v where v = 1 − |2w−1|
//   hairpin-down: rate(u) = hi × spanFactor^(-v)
// Linear-in-log-rate matches musical tempo perception (each unit of w
// multiplies rate by a fixed factor). The curve completes by phrase
// midpoint, then holds its terminal rate through the phrase tail.
var C2_RATE_MIN = 4;
var C2_RATE_MAX = 12;
var C2_RATE_SPAN_RATIO = 2.0;
// Fraction of phrase time by which the C2 tempo curve completes. 0.5
// means accel reaches fast, rit reaches slow, and hairpin tempo returns
// to its edge rate halfway through the phrase; the back half holds.
var C2_CURVE_END_U = 0.5;

// C2 bow pressure is a per-note held value, not a within-note ramp and
// not coupled to arcMul. Each note samples once from the voice's
// intensity/turn-rate bow-pressure baseline with this small human range.
var C2_BOW_PRESSURE_JITTER = 8;

// C2 CC 11 floor — applied as a minimum on `inst.peakExpr` for C2 only.
// arcMul's soft endpoint is `0.55 × peakExpr`; we want that to always
// land above 24 audibly, so peakExpr_min = ceil(25 / 0.55) = 46. Result:
// at any K-intensity the run never dips below CC 11 = 25, even at low
// K-dynamics where natural peakExpr would be 15/31 (ppp/pp). Higher
// K-intensities pass through unchanged (mf peakExpr = 79 ≫ 46). The
// 0.55→1.0 swing is preserved; "scale everything else accordingly"
// means the ceiling rises with the floor at low intensities (peakExpr
// = 46 → range 25→46) so the per-note arc shape is intact.
var C2_MIN_PEAK_EXPR = 46;

// C2 per-note ring-time bounds. Each note rolls a random "intrinsic
// ring time" in [C2_RING_MIN_MS, C2_RING_MAX_MS]; actual scheduled
// noteOff = MIN(ring, localSpacing) for monophonic notes and slightly
// before localSpacing for intentional dyads. The cap keeps C2's baseline
// monophonic and bounds release-tail bleed around DOUBLE_HOLD notes.
// Articulation is therefore EMERGENT:
//   ring ≥ localSpacing → note reaches the next note boundary → legato.
//   ring < localSpacing → noteOff fires before next noteOn → detache
//                         emerges with gap = localSpacing − ring.
// At fast tempi (spacing < C2_RING_MIN_MS) every note is legato by
// construction; at slow tempi (spacing > C2_RING_MIN_MS) the rolled
// ring time straddles the spacing and detache appears probabilistically.
// This mirrors how real cello playing produces detache only when bow
// movement outpaces finger placement — not as an explicit articulation
// switch.
var C2_RING_MIN_MS = 120;
var C2_RING_MAX_MS = 320;

// Intentional double-stop probability per note. C3 (constant-register
// cloud) uses 0.50 because dyads thicken its hovering texture; C2 is a
// directional run where dyads should accent rather than dominate, so
// 0.30 reads as occasional cellistic chord-strikes during the scale.
// First note (i==0) is always solo — keeps the run's anchor unambiguous.
var C2_DOUBLE_STOP_PROB = 0.30;

// Guard between a double-stop note's scheduled noteOffs and the next
// note's noteOn. Without it, the dyad's release tail (still in DOUBLE_
// HOLD mode at that moment) could bleed alongside the next noteOn for
// a brief ~3-voice texture. 5 ms is enough — the SWAM release envelope
// is barely beginning that early, and the next note's CC 81 write +
// noteOn overrides cleanly. Monophonic notes don't need this guard:
// MONO_POLY_RELEASE auto-releases on next noteOn.
var C2_DOUBLE_STOP_GUARD_MS = 5;

// Build the note-time array for one C2 phrase. Endpoints (loRate, hiRate)
// scale with turn-rate pressure; within-phrase curve is exponential in
// rate. Tempo direction couples to the dynamic arc: cresc → accel
// (lo→hi), dim → rit (hi→lo), hairpin-up → accel-rit (peak mid),
// hairpin-down → rit-accel (trough mid), null → random per phrase.
//
// Approach: define tempoCurve(u) for u∈[0,1] returning ABSOLUTE rate in
// notes/sec. Curve progress is compressed to `C2_CURVE_END_U`, so the
// accel/rit/hairpin motion reaches its endpoint by phrase midpoint and
// then holds that endpoint for the phrase tail. Integrate via trapezoidal
// sampling to a cumulative phase array (phase is in units of fractional-
// notes), then for each note k pick the time t_k such that phase(u_k) =
// (k/count) × phaseTotal — places notes at phase-uniform intervals so
// local note rate matches local tempoCurve(u) exactly.
//
// Per-note duration is NOT computed here — phraseC2 rolls per-note ring
// time inside each scheduled task so articulation choice (legato vs
// detache emergence) is independent of tempo curve.
function buildC2Tempo(arcDir, dur, turnP) {
	// Turn-rate-aware endpoints. SPAN_RATIO held constant across turn
	// rates so within-phrase swing is always 2× — audible accel/rit
	// without the prior steep density surge.
	var loRate = C2_RATE_MIN +
	    turnP * (C2_RATE_MAX / C2_RATE_SPAN_RATIO - C2_RATE_MIN);
	var hiRate = C2_RATE_MIN * C2_RATE_SPAN_RATIO +
	    turnP * (C2_RATE_MAX - C2_RATE_MIN * C2_RATE_SPAN_RATIO);
	var spanFactor = hiRate / loRate;  // ≈ C2_RATE_SPAN_RATIO

	var dirSign = 0;       // +1 = accel, -1 = rit (linear cases)
	var triangle = false;  // hairpin-up / hairpin-down
	var trianglePeak = false;
	if (arcDir === 'cresc')        { dirSign = +1; }
	else if (arcDir === 'dim')     { dirSign = -1; }
	else if (arcDir === 'hairpin-up')   { triangle = true; trianglePeak = true; }
	else if (arcDir === 'hairpin-down') { triangle = true; trianglePeak = false; }
	else { dirSign = (Math.random() < 0.5) ? +1 : -1; }

	function tempoCurve(u) {
		var w = Math.min(1, u / C2_CURVE_END_U);
		if (triangle) {
			var v = 1 - Math.abs(2 * w - 1);  // 0 at edges, 1 at midpoint
			return trianglePeak
			    ? loRate * Math.pow(spanFactor, v)
			    : hiRate * Math.pow(spanFactor, -v);
		}
		return dirSign > 0
		    ? loRate * Math.pow(spanFactor, w)
		    : hiRate * Math.pow(spanFactor, -w);
	}

	// Cumulative phase via trapezoidal rule. phase[s] = ∫_0^{s/SAMPLES}
	// tempoCurve(u) du. phase[SAMPLES] = average rate over [0,1].
	var SAMPLES = 100;
	var phase = new Array(SAMPLES + 1);
	phase[0] = 0;
	for (var s = 1; s <= SAMPLES; s++) {
		phase[s] = phase[s - 1] +
		    0.5 * (tempoCurve((s - 1) / SAMPLES) + tempoCurve(s / SAMPLES)) / SAMPLES;
	}
	var tempoAvg = phase[SAMPLES];  // average rate, notes/sec
	var count = Math.max(2, Math.round(dur * tempoAvg));

	var durMs = dur * 1000;
	var noteTimes = new Array(count);
	for (var k = 0; k < count; k++) {
		var target = (k / count) * tempoAvg;
		var loIdx = 0, hiIdx = SAMPLES;
		while (loIdx < hiIdx - 1) {
			var mid = (loIdx + hiIdx) >> 1;
			if (phase[mid] <= target) loIdx = mid;
			else hiIdx = mid;
		}
		var span = phase[hiIdx] - phase[loIdx];
		var u = (loIdx + (span > 1e-9 ? (target - phase[loIdx]) / span : 0)) / SAMPLES;
		noteTimes[k] = u * durMs;
	}

	var tempoLabel;
	if (triangle)         tempoLabel = trianglePeak ? "accel-rit" : "rit-accel";
	else if (arcDir)      tempoLabel = (dirSign > 0) ? "accel" : "rit";
	else                  tempoLabel = (dirSign > 0) ? "rand-accel" : "rand-rit";

	return {
		count: count,
		noteTimes: noteTimes,
		tempoLabel: tempoLabel,
		loRate: loRate,
		hiRate: hiRate,
		// Spacing extremes (slowest/fastest expected within this phrase).
		minSpacingMs: Math.round(1000 / hiRate),
		maxSpacingMs: Math.round(1000 / loRate),
	};
}

function phraseC2(inst, vel, dur) {
	var turnP = turnRatePressure();
	var arcDir = phraseArcDirection(inst);
	var tempo = buildC2Tempo(arcDir, dur, turnP);
	var count = tempo.count;
	var noteTimes = tempo.noteTimes;
	var durMs = dur * 1000;

	commitSieveWalk(count, inst.faceMotion);

	var velCurve = (inst.faceEnvProfile && inst.faceEnvProfile.velCurve) || 'flat';
	var peakExpr = inst.peakExpr || 64;
	var bowPosBase0 = (inst.bowPosBase != null) ? clampBowPosition(inst.bowPosBase) : BOW_POSITION_MAX;
	var bowPressBase = (inst.bowPressureBase != null) ? inst.bowPressureBase : COMPLEX[2].bowPressure;

	// arcMul returns the audible scale [0.55, 1.0] applied directly to
	// velocity, CC 11, and bow-position base migration. Bow pressure is
	// sampled separately once per note and held. Cresc/dim are linear
	// ramps; hairpins triangle to the midpoint and back. Independent of
	// tempo curve.
	function arcMul(idx, total) {
		if (total <= 1) return 1.0;
		var t = idx / (total - 1);
		if (arcDir === 'cresc')        return 0.55 + 0.45 * t;
		if (arcDir === 'dim')          return 1.00 - 0.45 * t;
		if (arcDir === 'hairpin-up')   return 0.55 + 0.45 * (1 - Math.abs(2 * t - 1));
		if (arcDir === 'hairpin-down') return 1.00 - 0.45 * (1 - Math.abs(2 * t - 1));
		return 1.0;
	}

	// Pre-compute per-note absolute noteOn times, ring times, double-stop
	// decisions, and ndur caps. Two cap regimes:
	//   • Monophonic note (isDouble[i] = false): ndur capped at
	//     spacingToNext (no overlap allowed). With MONO_POLY_RELEASE,
	//     SWAM auto-releases on the next noteOn — smooth legato without
	//     needing our overlap. If ndur < spacingToNext (ring is short),
	//     audible gap → detache emerges naturally.
	//   • Double-stop note (isDouble[i] = true): ndur capped at
	//     spacingToNext − C2_DOUBLE_STOP_GUARD_MS. The dyad's noteOffs
	//     fire BEFORE the next noteOn, in DOUBLE_HOLD mode — SWAM begins
	//     releasing both pitches. The next note's task then writes CC 81
	//     for whatever mode it needs and noteOns; in MONO_POLY_RELEASE
	//     the still-decaying release tails get auto-released. In
	//     DOUBLE_HOLD (next note is also a double stop), the brief
	//     overlap is bounded by GUARD_MS = 5 of release-tail bleed.
	var noteOnAbs = new Array(count);
	for (var i = 0; i < count; i++) {
		noteOnAbs[i] = noteTimes[i] + humanDelay();
	}
	var ringMs = new Array(count);
	var noteDurMs = new Array(count);
	var isDouble = new Array(count);
	var bowPressureVals = new Array(count);
	var detacheCount = 0;
	var doubleCount = 0;
	for (var i = 0; i < count; i++) {
		var nextOnAbs = (i + 1 < count) ? noteOnAbs[i + 1] : durMs;
		var spacingToNext = nextOnAbs - noteOnAbs[i];
		ringMs[i] = C2_RING_MIN_MS + Math.random() * (C2_RING_MAX_MS - C2_RING_MIN_MS);
		// First note (i==0) always solo — keeps the run's anchor unambiguous.
		isDouble[i] = (i > 0) && (Math.random() < C2_DOUBLE_STOP_PROB);
		var cap = isDouble[i] ? (spacingToNext - C2_DOUBLE_STOP_GUARD_MS) : spacingToNext;
		noteDurMs[i] = Math.max(40, Math.round(Math.min(ringMs[i], cap)));
		bowPressureVals[i] = clamp(Math.round(bowPressBase + rrand(-C2_BOW_PRESSURE_JITTER, C2_BOW_PRESSURE_JITTER)), 1, 127);
		if (ringMs[i] < spacingToNext) detacheCount++;
		if (isDouble[i]) doubleCount++;
	}

	for (var i = 0; i < count; i++) {
		(function(idx, total, tOn, ndur, doubleStop, bowPressure) {
			scheduleAt(inst, tOn, function() {
				var a = arcMul(idx, total);                           // [0.55, 1.0]
				var aNorm = (a - 0.55) / 0.45;                        // [0.0, 1.0]
				var pitch = humanPitch(pickPitch(2, inst));
				var v = humanVel(vel * stepVelScale(velCurve, idx, total) * a);
				ccForce(inst, CC.EXPRESSION,   clamp(Math.round(peakExpr     * a), 1, 127));
				ccForce(inst, CC.BOW_PRESSURE, bowPressure);
				// bowPosBase: louder (aNorm=1) → at base; softer (aNorm=0)
				// → +12 toward fingerboard. handleExprTilt picks up the
				// new base on its next emit and rides gyro on top.
				inst.bowPosBase = clampBowPosition(bowPosBase0 + (1.0 - aNorm) * 12);
				// Per-note CC 81 mode write. DOUBLE_HOLD only on
				// intentional double-stop notes; MONO_POLY_RELEASE
				// otherwise. Race-free: mode is correct at the moment
				// of every noteOn (no dependency on previous note's
				// scheduled noteOff task firing first). Redundant
				// writes are harmless — ccForce always emits.
				ccForce(inst, CC.BOW_POLYPHONY,
				    BOW_POLY_CC_VAL[doubleStop ? BOW_POLY.DOUBLE_HOLD : BOW_POLY.MONO_POLY_RELEASE]);
				var hp = pitch;
				noteOn(inst, hp, v);
				inst.activeNotes.push(hp);
				var compHp = null;
				if (doubleStop) {
					// Intentional double stop: pick a companion pitch via
					// doubleStopCompanion (cellistic 3rd / 4th / 5th /
					// 6th / octave intervals) and noteOn alongside main
					// in DOUBLE_HOLD. companion velocity is 85% of main —
					// matches maybeDoubleStop's convention.
					var companion = doubleStopCompanion(hp);
					if (companion != null) {
						noteOn(inst, companion, Math.max(1, Math.round(v * 0.85)), /*isCompanion=*/ true);
						inst.activeNotes.push(companion);
						compHp = companion;
					}
				}
				scheduleAt(inst, ndur, function() {
					noteOff(inst, hp);
					var pidx = inst.activeNotes.indexOf(hp);
					if (pidx >= 0) inst.activeNotes.splice(pidx, 1);
					if (compHp != null) {
						noteOff(inst, compHp);
						var cidx = inst.activeNotes.indexOf(compHp);
						if (cidx >= 0) inst.activeNotes.splice(cidx, 1);
					}
				});
			});
		})(i, count, noteOnAbs[i], noteDurMs[i], isDouble[i], bowPressureVals[i]);
	}

	// Restore bowPosBase at phrase end so handleExprTilt and the next
	// voice's setupComplex see the original baseline.
	scheduleAt(inst, Math.max(0, durMs - 1), function() {
		inst.bowPosBase = bowPosBase0;
	});

	log("[phraseC2 RUN] inst=" + inst.id + " count=" + count +
	    " tempo=" + tempo.tempoLabel +
	    " rate=" + tempo.loRate.toFixed(1) + "→" + tempo.hiRate.toFixed(1) + "n/s" +
	    " spacing=" + tempo.maxSpacingMs + "→" + tempo.minSpacingMs + "ms" +
	    " detache=" + detacheCount + "/" + count +
	    " doubles=" + doubleCount + "/" + count +
	    " arcDir=" + (arcDir || "flat") +
	    " turnP=" + turnP.toFixed(2) +
	    " dur=" + dur.toFixed(2) + "s");

	scheduleRelease(inst, dur);
}

// C3: OrderedCloudFlat — legato rebows hovering at constant register. D43:
// ~40% double-stop rate. C3 is the most sustained-flat complex, so double
// stops here read as the cleanest "held interval" effect. Each held note
// also owns a CC 16 / CC 17 bow-motion ramp that begins at note onset;
// current CC 11 controls ramp speed, lower expression = faster bow travel.
function phraseC3(inst, vel, dur) {
	var count = faceShapedCount(inst, 3, 5, false);
	var velCurve = (inst.faceEnvProfile && inst.faceEnvProfile.velCurve) || 'flat';
	var durMs = Math.max(400, dur * 1000);
	var spacing = Math.max(110, Math.round(durMs / (count + 1)));
	var center = pickPitch(3, inst);
	var noteTimes = [];
	for (var i = 0; i < count; i++) {
		noteTimes.push(Math.max(0, i * spacing + humanDelay()));
	}
	for (var i = 0; i < count; i++) {
		(function(idx, stepCount, tOn) {
			var nextOn = (idx + 1 < noteTimes.length) ? noteTimes[idx + 1] : durMs;
			var noteDurMs = Math.max(120, Math.round(nextOn - tOn + LEGATO_OVERLAP_MS));
			scheduleAt(inst, tOn, function() {
				var jitter = (Math.random() < 0.5) ? 0 : (Math.random() < 0.5 ? -1 : 1);
				var p = clamp(center + jitter, CELLO_MIN, CELLO_MAX);
				var v = humanVel(vel * stepVelScale(velCurve, idx, stepCount));
				var main = humanPitch(p);
				var exprAtOn = inst.ccCache[CC.EXPRESSION];
				if (exprAtOn == null) exprAtOn = inst.peakExpr || inst.baseExpr || 64;
				scheduleC3BowMotion(inst, noteDurMs, exprAtOn);
				legatoNote(inst, main, v);
				maybeDoubleStop(inst, main, v, 0.50);
			});
		})(i, count, noteTimes[i]);
	}
	scheduleRelease(inst, dur);
}

function c3ShiftEndpoint(start, mag, lo, hi) {
	var dir = (Math.random() < 0.5) ? -1 : 1;
	if (start + dir * mag > hi || start + dir * mag < lo) dir *= -1;
	return clamp(Math.round(start + dir * mag), lo, hi);
}

function scheduleC3BowMotion(inst, noteDurMs, exprAtOn) {
	exprAtOn = clamp(Math.round(exprAtOn), 1, 127);
	var exprNorm = clamp(exprAtOn / 127, 0, 1);
	var speed = C3_BOW_MOTION_SLOW_RATE + (1 - exprNorm) * (C3_BOW_MOTION_FAST_RATE - C3_BOW_MOTION_SLOW_RATE);
	var maxRampMs = Math.max(60, Math.round(noteDurMs));
	var minRampMs = Math.min(C3_BOW_MOTION_MIN_MS, maxRampMs);
	var rampMs = clamp(Math.round(noteDurMs / speed), minRampMs, maxRampMs);

	var posStart = inst.ccCache[CC.BOW_POSITION];
	if (posStart == null) posStart = (inst.bowPosBase != null) ? inst.bowPosBase : COMPLEX[3].bowPos;
	posStart = clampBowPosition(posStart);
	var prStart = inst.ccCache[CC.BOW_PRESSURE];
	if (prStart == null) prStart = (inst.bowPressureBase != null) ? inst.bowPressureBase : COMPLEX[3].bowPressure;

	var inv = 1 - exprNorm;
	var posMag = Math.round(C3_BOW_POS_SHIFT_MIN + inv * (C3_BOW_POS_SHIFT_MAX - C3_BOW_POS_SHIFT_MIN));
	var prMag = Math.round(C3_BOW_PRESS_SHIFT_MIN + inv * (C3_BOW_PRESS_SHIFT_MAX - C3_BOW_PRESS_SHIFT_MIN));
	var posEnd = c3ShiftEndpoint(posStart, posMag, BOW_POSITION_MIN, BOW_POSITION_MAX);
	var prEnd = c3ShiftEndpoint(prStart, prMag, 8, 118);

	rampCC(inst, CC.BOW_POSITION, posEnd, rampMs);
	rampCC(inst, CC.BOW_PRESSURE, prEnd, rampMs);

	inst.c3BowMotionCount++;
	inst.c3BowMotionMinExpr = Math.min(inst.c3BowMotionMinExpr, exprAtOn);
	inst.c3BowMotionMaxRate = Math.max(inst.c3BowMotionMaxRate, speed);
}

// C4: IonizedAtom — harmonic attacks clustered near central pitch with
// random-timed arrival across the phrase ("atom + ionized timing")
//
// Per-note bow motion: each scheduled C4 note seeds a fresh CC 16
// (Bow Position) and CC 17 (Bow Pressure) start value and rampCCs to a
// monotonic endpoint across the note's duration. Position picks a
// shift-magnitude class — small / medium / large / full-lower-half — so the
// phrase varies between subtle position wiggles and full lower-half
// sweeps. Pressure shifts are bounded to a tighter band so C4's airy
// harmonic identity isn't lost. The handleExprTilt / handleExprScramble
// loops both skip C4 so the gyro-driven CC 16 stream doesn't clobber
// these ramps; cancelPhrase cancels the CC 16 / CC 17 ramps on voice
// steal so an in-flight ramp doesn't leak into the next voice's baseline.
function phraseC4(inst, vel, dur) {
	var velCurve = (inst.faceEnvProfile && inst.faceEnvProfile.velCurve) || 'flat';
	var s = state.sieve;
	var base = (s.length > 0) ? s[Math.floor(s.length / 2)] : 60;
	var faceTr = inst.faceTranspose || 0;
	var loReg = CELLO_MIN;
	var hiReg = CELLO_MAX;
	// User request: a 4-second C4 should stream harmonics across the WHOLE
	// 4 seconds, not produce 2-5 quick attacks scattered random-uniformly
	// (which can all cluster in the first half). Now: rate-driven count
	// (~2.5/sec for a sparse "stream" of harmonics) with even-ish spacing
	// + jitter, plus 20% chance of 2-pitch simultaneous attack (polyphonic
	// harmonic doublestop) for the "cloud" character.
	var rate = 2.5 * rateDensityMultiplier(inst.activeComplex);
	var count = Math.max(2, Math.round(dur * rate));
	var spacing = (dur * 1000) / count;
	// Per-note duration scales with the spacing so each harmonic occupies
	// ~50% of its time-share; preserves "ionized atom" sparseness while
	// giving each note audible body. Pre-fix this was rrand(180, 400) flat.
	var avgMs = clamp(Math.round(spacing * 0.55), 280, 900);
	var minMs = Math.max(180, Math.round(avgMs * 0.6));
	var maxMs = Math.max(400, Math.round(avgMs * 1.4));
	for (var i = 0; i < count; i++) {
		(function(idx, stepCount) {
			var jitter = (Math.random() - 0.5) * spacing * 0.5;
			var t = Math.max(0, Math.round(idx * spacing + jitter));
			scheduleAt(inst, t, function() {
				// Per-note bow shape — one ramp per CC, length = the note's
				// audible window. rrand(minMs, maxMs) bounds the bow-motion
				// horizon; the per-cluster noteOff times below also draw from
				// the same range so the bow envelope and the audible pitches
				// share roughly the same lifetime.
				var noteDurMs = rrand(minMs, maxMs);
				scheduleC4BowMotion(inst, noteDurMs);

				var clusterSize = (Math.random() < 0.50) ? 2 : 1;
				for (var k = 0; k < clusterSize; k++) {
					(function() {
						var pjitter = rrand(-2, 2) + (k > 0 ? rrand(2, 5) : 0);
						var p = foldToRange(base + faceTr + pjitter, loReg, hiReg);
						var v = clamp(humanVel(vel * stepVelScale(velCurve, idx, stepCount)) - 15, 25, 100);
						// Capture the humanised pitch once: noteOn /
						// activeNotes / noteOff must all reference the SAME
						// pitch number, otherwise SWAM gets a noteOn it never
						// sees a noteOff for (CC 120 on the next steal masks
						// it audibly) and the dashboard pairs noteOn at hp
						// with no matching noteOff at p — visible as a
						// rectangle that grows forever until 45 s watchdog.
						var hp = humanPitch(p);
						noteOn(inst, hp, v);
						inst.activeNotes.push(hp);
						scheduleAt(inst, rrand(minMs, maxMs), function() {
							noteOff(inst, hp);
							var pidx = inst.activeNotes.indexOf(hp);
							if (pidx >= 0) inst.activeNotes.splice(pidx, 1);
						});
					})();
				}
			});
		})(i, count);
	}
	scheduleRelease(inst, dur);
}

// Per-note bow position + bow pressure motion for C4. Each call:
//   1. Picks a position shift-magnitude class (small / medium / large /
//      full-lower-half) and a direction (up / down). Start is sampled inside
//      [BOW_POSITION_MIN..BOW_POSITION_MAX] so every CC 16 write stays in
//      the lower half of SWAM's range.
//   2. Picks a pressure shift-magnitude (tighter distribution — pressure
//      changes are sonically more dramatic, wide pressure sweeps would
//      collapse the harmonic identity) and a direction.
//   3. Force-seeds the start values via ccForce so any leakage from the
//      previous note (or a stale baseline from setupComplex) is overwritten,
//      then rampCCs to the endpoint across noteDurMs.
// rampCC's 15 ms tick gives ~13 writes per 200 ms note, ~67 Hz CC stream
// per CC — well under SWAM's safe range. ccCache short-circuits identical
// writes; a large→small reseed is always a real CC change.
function scheduleC4BowMotion(inst, noteDurMs) {
	var posMag;
	var posRoll = Math.random();
	if      (posRoll < 0.30) posMag = rrand(4, 11);    // small wiggle
	else if (posRoll < 0.60) posMag = rrand(14, 28);   // medium excursion
	else if (posRoll < 0.85) posMag = rrand(31, 48);   // large sweep
	else                     posMag = rrand(56, 64);   // full lower-half
	var posStart, posEnd;
	if (Math.random() < 0.5) {
		posStart = rrand(BOW_POSITION_MIN, BOW_POSITION_MAX - posMag);
		posEnd   = posStart + posMag;
	} else {
		posStart = rrand(BOW_POSITION_MIN + posMag, BOW_POSITION_MAX);
		posEnd   = posStart - posMag;
	}

	// Pressure: bias toward small/medium shifts so most notes keep their
	// glassy harmonic colour, but allow the occasional bold pressure
	// envelope. prMin/prMax keep the absolute value in a musical band
	// (avoid CC 17 = 0 dropouts and full-saturation crunches).
	var prMag;
	var prRoll = Math.random();
	if      (prRoll < 0.45) prMag = rrand(8, 20);     // subtle
	else if (prRoll < 0.80) prMag = rrand(24, 45);    // moderate
	else                    prMag = rrand(50, 85);    // bold
	var prMin = 5, prMax = 120;
	var prRange = prMax - prMin;
	if (prMag > prRange) prMag = prRange;
	var prStart, prEnd;
	if (Math.random() < 0.5) {
		prStart = rrand(prMin, prMax - prMag);
		prEnd   = prStart + prMag;
	} else {
		prStart = rrand(prMin + prMag, prMax);
		prEnd   = prStart - prMag;
	}

	ccForce(inst, CC.BOW_POSITION, posStart);
	ccForce(inst, CC.BOW_PRESSURE, prStart);
	rampCC(inst, CC.BOW_POSITION, posEnd, noteDurMs);
	rampCC(inst, CC.BOW_PRESSURE, prEnd, noteDurMs);
}

// C5: wild gliss — dense salvo of ≥8-semi leaps. Current C5 routes slides
// through pitchbend (`slideViaBend=true`); the preserved legacy block below
// shows the old Mono Poly Release portamento path. D43:
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
// percussive salvo, hairpin/fade = longer sustained salvo via K-duration × face multiplier) but cannot
// reduce the count below what reads as wild. The face's expressive shape
// still applies via duration multiplier / velCurve / releaseMult.
// D72.4 — pre-pitchbend-port phraseC5 preserved for regression. Used
// glissNote (Mono Poly Release portamento) for same-string slides and
// bendStep for cross-string only. To regress: comment out the new
// phraseC5 below this block, uncomment THIS block, set
// COMPLEX[5].bowPoly = MONO_POLY_RELEASE, and remove
// COMPLEX[5].slideViaBend.
/*
function phraseC5(inst, vel, dur) {
	var velCurve = (inst.faceEnvProfile && inst.faceEnvProfile.velCurve) || 'flat';
	var requestedCount = Math.max(WILD_MIN_COUNT, faceShapedCount(inst, 4, 9, true));
	var MIN_LEAP = 8;
	var lastPitchRef = { p: pickPitch(5, inst) };
	var wildAccent = rateAccentValue(WILD_GLISS_BPA, inst.activeComplex);

	var durMs = dur * 1000;
	var tailEnd = Math.max(FIRST_GLISS_MS + 200, durMs * 0.92);
	var times = glissSchedule(requestedCount, FIRST_GLISS_MS, tailEnd, MIN_GLISS_SPACING_MS);
	var count = times.length;

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
*/

// D72.4 — wild gliss now uses pitchbend wheel for ALL slides (same as
// C6 with slideViaBend=true). Each "slide event" is a discrete bendStep
// segment with `bendDur` scaled to gap-to-next-event. User-accepted
// character: multiple distinct glissandi per phrase, each segment
// continuous (no dead air), atomic noteOff/noteOn transitions at
// completeBend. With MIN_LEAP=8, bend amounts can hit 8-15 semis;
// SWAM's pitchbend wheel handles ±24 semi via fingerboard slide
// simulation. Leaps now only fire when interval > PITCHBEND_RANGE_SEMI
// (24 semi) — rare given pickPitch's range relative to MIN_LEAP=8.
function phraseC5(inst, vel, dur) {
	var velCurve = (inst.faceEnvProfile && inst.faceEnvProfile.velCurve) || 'flat';
	var requestedCount = Math.max(WILD_MIN_COUNT, faceShapedCount(inst, 4, 9, true));
	var MIN_LEAP = 8;
	var lastPitchRef = { p: pickPitch(5, inst) };
	var wildAccent = rateAccentValue(WILD_GLISS_BPA, inst.activeComplex);
	if (!isFinite(wildAccent)) {
		log("C5 WILD ACCENT FAIL inst " + inst.id +
		    " accent=" + wildAccent + " - falling back to " + WILD_GLISS_BPA);
		wildAccent = WILD_GLISS_BPA;
	}
	var durMs = dur * 1000;
	var tailEnd = Math.max(FIRST_GLISS_MS + 200, durMs * 0.92);
	// D78 — variable-gap schedule (was glissSchedule's uniform spacing).
	// Gives each bend a different gap-to-next-event, which `bendDur`
	// derives directly into different per-bend durations / audible speeds.
	// All wild-gliss invariants (D42 / D43 / D45 / WILD_MIN_COUNT clip
	// policy) are preserved by wildGlissSchedule itself.
	var times = wildGlissSchedule(requestedCount, FIRST_GLISS_MS, tailEnd, MIN_GLISS_SPACING_MS);
	var count = times.length;
	var targets = new Array(count);
	var previewPitch = lastPitchRef.p;
	var pathMin = previewPitch;
	var pathMax = previewPitch;
	for (var ti = 0; ti < count; ti++) {
		var tp = pickPitch(5, inst);
		var attempts = 0;
		while (Math.abs(tp - previewPitch) < MIN_LEAP && attempts < 12) {
			tp = pickPitch(5, inst);
			attempts++;
		}
		tp = enforceLeap(previewPitch, tp, MIN_LEAP);
		targets[ti] = tp;
		if (tp < pathMin) pathMin = tp;
		if (tp > pathMax) pathMax = tp;
		previewPitch = tp;
	}

	// Anchor seed: pre-load consecutiveLeapCurrent to MAX_CONSECUTIVE_LEAPS
	// so any cross-string outcome at the first event is nudged to same-
	// string (i.e., the bend stays in-range). Mostly inert with
	// slideViaBend=true since the dispatch goes to bendStep regardless,
	// but the nudge keeps interval ≤ MIN_LEAP * something reasonable.
	inst.consecutiveLeapCurrent = MAX_CONSECUTIVE_LEAPS;

	// D72.4 — anchor uses exact integer (no humanPitch) so the first
	// bendStep's heldSource lookup matches in inst.activeNotes.
	var anchorVel = humanVel(vel * stepVelScale(velCurve, 0, count + 1));
	legatoNote(inst, lastPitchRef.p, anchorVel);
	// Wild-gliss companions ride the whole bend salvo. Pick an interval
	// that remains inside the rolling-score pitch range across this planned
	// path, then completeBend re-voices the companion at each bend target.
	maybeGlissDoubleStop(inst, lastPitchRef.p, anchorVel, 0.50, pathMin, pathMax);

	var phraseEndMs = durMs - 100;
	for (var i = 0; i < count; i++) {
		var nextEventMs = (i + 1 < count) ? times[i + 1] : phraseEndMs;
		var gapMs = nextEventMs - times[i];
		var bendDur = Math.max(80, Math.min(gapMs - 50, MAX_BEND_DUR_MS));
		(function(tMs, bd, target) {
			scheduleAt(inst, tMs, function() {
				lastPitchRef.p = glissStep(inst, lastPitchRef.p, target, MIN_LEAP, WILD_GLISS_VEL, wildAccent, bd);
			});
		})(times[i], bendDur, targets[i]);
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

	var anchorPitch = pickPitch(6, inst);
	var lastPitchRef = { p: anchorPitch };
	var targets = new Array(slideTimes.length);
	var pathMin = anchorPitch;
	var pathMax = anchorPitch;
	for (var ti = 0; ti < slideTimes.length; ti++) {
		var tp = pickPitch(6, inst);
		targets[ti] = tp;
		if (tp < pathMin) pathMin = tp;
		if (tp > pathMax) pathMax = tp;
	}

	// Anchor — fires first, sets lastPitchRef for the slide chain.
	// D72.2 — anchor noteOn pitch must match `lastPitchRef.p` EXACTLY
	// because the next bend's `bendStep` looks up `heldSource` in
	// `activeNotes` via `Math.round`-comparison against the next slide's
	// `sourcePitch = lastPitchRef.p`. Pre-D72.2 used `humanPitch(...)`
	// which introduces a 10%-chance ±1 semi shift; the resulting
	// `Math.round` mismatch (42 ≠ 43) failed the heldSource lookup and
	// fell through to `leapStep` on the first bend of ~10% of C6 phrases
	// — visible as a discrete leap instead of a smooth slide for those
	// phrases, and as the "stuck triangle" white-line behaviour the
	// user reported. Slide / anchor pitches in slideViaBend phrases
	// should land precisely on the sieve walk pitch (no humanization).
	// D79 — anchor fires at t=0 (was humanDelay() ≈ 0–30 ms). Per-event
	// humanDelay still rides subsequent slides for groove; only the FIRST
	// noteon drops it so the audible attack lands on the same frame as
	// the cube turn.
	scheduleAt(inst, 0, function() {
		var v = humanVel(vel * stepVelScale(velCurve, 0, totalCount));
		legatoNote(inst, lastPitchRef.p, v);
		// Per-phrase companion held alongside the slide chain. The chosen
		// fixed interval is safe for the whole planned C6 path; completeBend
		// re-voices the companion at every target so SWAM cannot drop the
		// dyad after the first bend completion.
		maybeGlissDoubleStop(inst, lastPitchRef.p, v, 0.50, pathMin, pathMax);
	});

	// Slides — read lastPitchRef.p set by the anchor / previous slide.
	// D72 — per-slide bend duration scales with gap-to-next-event so the
	// slide audibly fills the inter-event time. For the LAST slide, gap =
	// remaining phrase time minus a 100 ms margin before scheduleRelease's
	// fade. 50 ms safety margin between bend completion and next event
	// matches D45's MIN_GLISS_SPACING_MS slack expectation.
	var phraseEndMs = durMs - 100;
	for (var i = 0; i < slideTimes.length; i++) {
		var nextEventMs = (i + 1 < slideTimes.length) ? slideTimes[i + 1] : phraseEndMs;
		var gapMs = nextEventMs - slideTimes[i];
		var bendDur = Math.max(80, Math.min(gapMs - 50, MAX_BEND_DUR_MS));
		(function(tMs, bd, target) {
			scheduleAt(inst, tMs + humanDelay(), function() {
				lastPitchRef.p = glissStep(inst, lastPitchRef.p, target, 1, undefined, undefined, bd);
			});
		})(slideTimes[i], bendDur, targets[i]);
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
	var cmx7 = COMPLEX[7];
	var regLo = (cmx7 && cmx7.register) ? cmx7.register.lo : CELLO_MIN;
	var regHi = (cmx7 && cmx7.register) ? cmx7.register.hi : CELLO_MAX;
	var p1 = pickPitch(7, inst);
	// D72.4 — anchor uses exact integer (no humanPitch) so first bendStep's
	// heldSource lookup matches. Track lastPitchRef so subsequent drifts'
	// bendStep finds the actual current held pitch (not the original
	// anchor) — chained drifts walk via pitchbend instead of leaping.
	var lastPitchRef = { p: p1 };
	legatoNote(inst, p1, humanVel(vel));
	// D79 — drift count baseline bumped (was 1 / 1-3) so each phrase has
	// multiple drifts to fill the phrase span. With 1 drift in a 1.8s phrase,
	// `bendDur` capped at MAX_BEND_DUR_MS=1200 left ~470 ms of post-bend held
	// pitch — the visible rect-body "gap" the user reported. 2-4 drifts at
	// the same phrase length give ~500 ms gaps, each bend fills ~450 ms, the
	// post-final-drift held shrinks to ~50 ms (effectively invisible). Slow
	// per-drift character preserved (each gap is still 5–8× longer than
	// C5's 200 ms minimum spacing).
	var driftCount = isSingle ? 2 : 2 + rrand(1, 2);
	if (!isSingle && inst.faceEnvProfile && inst.faceEnvProfile.countMult > 1.0) {
		driftCount = Math.min(6, Math.round(driftCount * inst.faceEnvProfile.countMult));
	}
	if (!isSingle) {
		driftCount = Math.min(6, Math.max(2, Math.round(driftCount * rateDensityMultiplier(inst.activeComplex))));
	}
	var motionDir = (inst.faceMotion === 'up') ? 1 : (inst.faceMotion === 'down') ? -1 : 0;
	var durMs = dur * 1000;
	// D53 — C7 first drift fires at FIRST_GLISS_MS_C7 (= 30 ms) so the slide
	// kicks in almost immediately after the anchor, distinguishing C7's
	// "continuous floating" character from C6's "deliberate stepping".
	// D72.4 — slides now via pitchbend wheel (slideViaBend=true on
	// COMPLEX[7]); per-slide bendDur scales with gap-to-next-event so the
	// drift fills the inter-event time as a continuous bend curve.
	// D79 — wildGlissSchedule (was glissSchedule) for stochastic per-drift
	// timing. Same pattern as phraseC5: power-law-distributed gaps produce
	// varied per-bend durations within C7's slow envelope. Each phrase now
	// reads as a unique drift contour instead of a uniform ramp pattern.
	var tailEnd = Math.max(FIRST_GLISS_MS_C7 + 250, durMs * 0.88);
	var times = wildGlissSchedule(driftCount, FIRST_GLISS_MS_C7, tailEnd, MIN_GLISS_SPACING_MS);

	// D53 — drift sign alternates per drift index (when face motion is
	// neutral) so the trajectory rocks around the anchor in zigzag, evoking
	// inhale/exhale rather than C6's monotonic sieve walk. Random starting
	// direction so phrases don't always begin the same way. When face motion
	// has a bias (up/down), drifts go monotonically in that direction —
	// face semantics override the rocking pattern. Magnitude rrand(1, 2)
	// (was rrand(-3, 3)): caps swings between consecutive drifts at 4
	// semitones, reads as "drift" not "wandering slide", and average ±1.2
	// keeps the character subtle. Targets are anchor-relative (p1 + sign *
	// mag), so drifts oscillate around the anchor pitch even though the
	// bendStep source chains from the previous target.
	var phraseStartSign = (Math.random() < 0.5) ? 1 : -1;
	var phraseEndMs = durMs - 100;
	for (var i = 0; i < times.length; i++) {
		var nextEventMs = (i + 1 < times.length) ? times[i + 1] : phraseEndMs;
		var gapMs = nextEventMs - times[i];
		var bendDur = Math.max(80, Math.min(gapMs - 50, MAX_BEND_DUR_MS));
		(function(tMs, idx, bd) {
			scheduleAt(inst, tMs, function() {
				var sign = (motionDir !== 0)
					? motionDir
					: phraseStartSign * ((idx % 2 === 0) ? 1 : -1);
				var mag = rrand(1, 2);
				// Clamp only to SWAM's global cello pitch window. Per-complex
				// register ranges are intentionally disabled in COMPLEX.
				var p2 = clamp(p1 + sign * mag, regLo, regHi);
				lastPitchRef.p = glissStep(inst, lastPitchRef.p, p2, 1, undefined, undefined, bd);
			});
		})(times[i], i, bendDur);
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
	var mainPitch = pickPitch(8, inst);
	var companion = (Math.random() < 0.50) ? doubleStopCompanion(mainPitch) : null;
	// Single noteon per C8 phrase — SWAM's TREMOLO.FAST does the rebow
	// cycling internally, so the bridge's prior manual rebow loop was
	// double-tremoloing on top of SWAM's internal cycle AND fragmenting
	// the dashboard visual into 3-4 stair-stepped brushes that didn't
	// match the audible single-trajectory cresc/dim. Companion (optional
	// 30% double-stop for the "cluster" character) is fired once. The
	// phrase-spanning CC 11 arc + tremRamp + bowPosBase=5 (sul pont)
	// carry the dynamic / tremolo / timbre throughout the phrase.
	// D79 — first (and only) noteon fires at t=0 (was humanDelay() ≈ 0–30 ms).
	// C8 has a single noteon per phrase, so dropping the delay just trims the
	// per-phrase latency; tremolo character is internal to SWAM's TREMOLO.FAST
	// and unaffected.
	scheduleAt(inst, 0, function() {
		var v = clamp(humanVel(vel * stepVelScale(velCurve, 0, 1)) + 8, 40, 120);
		var main = humanPitch(mainPitch);
		legatoNote(inst, main, v);
		if (companion != null) {
			noteOn(inst, companion, Math.max(1, Math.round(v * 0.85)));
			inst.activeNotes.push(companion);
		}
	});
	scheduleRelease(inst, dur);
}

// ================================================================
// FACE SIGNATURES (Phase A1)
// ================================================================
// FACE_MAP, ENV_PROFILE, ART_OFF_VEL, MOTION_NUDGE are declared in
// gen_includes.js (source: src/face-gesture.ts → buildFaceMap, and
// src/swam-mapping.ts). See docs/swam/swam_cello_reference.md and the TS
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
		state.faceDurationMult = null;
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
	state.faceDurationMult = (sig.durationMult > 0) ? sig.durationMult : null;
	if (state.faceDurationMult == null) {
		log("FACE DURATION MULT FAIL face=" + face + " missing durationMult in FACE_MAP");
	}
	state.faceEnvelope = sig.envelope;
	state.faceArticulation = sig.articulation;
	state.faceMotion = sig.motion;

	var profile = ENV_PROFILE[sig.envelope] || null;
	state.faceEnvProfile = profile;
	state.faceReleaseMult = profile ? profile.releaseMult : 1.0;

	var offVel = ART_OFF_VEL[sig.articulation];
	state.faceOffVelOverride = (offVel != null) ? offVel : null;

	var spread = 12;
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
	var pendingPlanId = state.currentPlanId | 0;
	state.currentPlanId = 0;  // consume once so manual /xk/voice cannot inherit a stale audit id
	if (state.frozen) return;

	// K_i owns the base material duration. Face moves reshape it with a
	// multiplier; complex floors protect identity-bearing gestures from being
	// compressed into unreadable fragments.
	var incomingDuration = duration;
	var durationSource = "vertex";
	if (state.face !== null) {
		if (state.faceDurationMult != null && state.faceDurationMult > 0) {
			duration = incomingDuration * state.faceDurationMult;
			durationSource = "vertex*face";
		} else {
			log("FACE DURATION MULT FAIL face=" + state.face +
			    " has no duration multiplier; falling back to vertexDur=" +
			    Number(incomingDuration).toFixed(2));
		}
	}
	var durationFloor = durationFloorForComplex(complexType);
	if (duration < durationFloor) {
		duration = durationFloor;
		durationSource += "+floor";
	}

	// Hard ceiling — K_i long values × face multipliers can produce spans
	// longer than a performance phrase. 30 s is already enough to read as
	// sustained, and prevents stale scheduled tasks from accumulating.
	var maxPhraseDuration = (typeof MAX_PHRASE_DURATION_SEC !== "undefined") ? MAX_PHRASE_DURATION_SEC : 30;
	duration = Math.min(duration, maxPhraseDuration);

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

	// Snapshot voice-shot state onto the instance so later face / intensity
	// changes from subsequent turns don't retroactively reshape this
	// in-flight phrase.
	inst.intensity  = intensity;
	inst.density    = density;
	inst.duration   = duration;
	inst.tetra      = state.tetra;
	inst.faceDurationMult = state.faceDurationMult;
	inst.faceTranspose    = state.faceTranspose || 0;
	inst.faceEnvelope     = state.faceEnvelope;
	inst.faceMotion       = state.faceMotion;
	inst.faceEnvProfile   = state.faceEnvProfile;
	inst.faceOffVelOverride = state.faceOffVelOverride;
	inst.faceReleaseMult    = state.faceReleaseMult;
	inst.planId = pendingPlanId;

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

	// C7 timbral coin-flip per phrase trigger: tasto (cmx.bowPos) vs pont
	// (cmx.bowPosAlt). Re-rolls every voice trigger, not just on complex
	// change, so consecutive C7 phrases vary independently. Everything else
	// about C7 is preserved — only CC 16 baseline shifts.
	if (complexType === 7 && cmx.bowPosAlt != null) {
		var c7BowChoice = (Math.random() < 0.5) ? cmx.bowPosAlt : cmx.bowPos;
		inst.bowPosBase = clampBowPosition(c7BowChoice);
		ccForce(inst, CC.BOW_POSITION, inst.bowPosBase);
		log("inst " + inst.id + " C7 bow=" +
		    (c7BowChoice === cmx.bowPosAlt ? "pont" : "tasto"));
	}

	// D42 + D46 + D59 gliss invariant — reset slide + bend + leap counters;
	// scheduleRelease's offT asserts ≥1 (slide OR bend OR leap) fired for
	// C5/C6/C7 and logs the per-phrase breakdown.
	inst.glissOverlapCount = 0;
	inst.glissBendCount = 0;
	inst.glissLeapCount = 0;
	inst.glissExpected = (complexType === 5 || complexType === 6 || complexType === 7);
	inst.glissCompanion = null;
	inst.glissCompanionExpected = false;
	inst.c3BowMotionExpected = (complexType === 3);
	inst.c3BowMotionCount = 0;
	inst.c3BowMotionMinExpr = 127;
	inst.c3BowMotionMaxRate = 0;

	// D48 + D51 — leap-alternation with N=MAX_CONSECUTIVE_LEAPS tolerance.
	// Anchor no longer counts as a leap (D51 relaxation): consecutiveLeap
	// counter starts at 0 so the first event after the anchor is fully
	// natural — preserves the dramatic anchor → leap opening that was part
	// of pre-D48 wild character. lastWasLeap is now vestigial (the counter
	// is the source of truth) but maintained for readability.
	inst.lastWasLeap = false;
	inst.consecutiveLeapCurrent = 0;
	inst.consecutiveLeapMax = 0;

	// D54 — bow-position flap counters reset per voice; scheduleRelease
	// reads them at natural-end and promotes to BOW POS FLAP if the
	// reversal rate exceeds threshold.
	inst.bowPosWrites = 0;
	inst.bowPosReversals = 0;
	inst.bowPosLastDir = 0;

	var intMap = INTENSITY_MAP[intensity] || INTENSITY_MAP["mf"];
	inst.baseExpr = intMap.expr;
	var rateP = turnRatePressure();
	var baseVel = clamp(Math.round(intMap.vel * rateVelocityMultiplier(complexType)), 1, 127);

	var envPeakMult = (inst.faceEnvProfile && inst.faceEnvProfile.peakMult) || 1.0;
	inst.peakExpr = clamp(intMap.expr * envPeakMult * rateExpressionMultiplier(complexType), 0, 127);
	// C2 CC 11 floor: arcMul's 0.55×peakExpr soft endpoint must clear 24.
	// See C2_MIN_PEAK_EXPR for the rationale; only C2 phraseC2 + the C2
	// dispatch seed read inst.peakExpr, so bumping it here is local.
	if (complexType === 2 && inst.peakExpr < C2_MIN_PEAK_EXPR) {
		inst.peakExpr = C2_MIN_PEAK_EXPR;
	}

	var bowBase = clamp(cmx.bowPressure * intMap.bowMult * rateBowPressureMultiplier(complexType), 0, 127);
	inst.bowPressureBase = Math.round(bowBase);
	ccForce(inst, CC.BOW_PRESSURE, inst.bowPressureBase);

	// D39 — per-phrase stochastic tremolo-rate envelope (only when tremolo on)
	if (cmx.tremoloRate != null && cmx.tremolo !== TREMOLO.OFF && HAS_TREMOLO_RATE) {
		cancelCCRamp(inst, CC.TREMOLO_RATE);
		var phraseMs = Math.max(duration * 1000, 250);
		var steadyBase = clamp(Math.round(cmx.tremoloRate * intMap.tremRateMult * rateTremoloMultiplier(complexType)), 0, 127);
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
	    " dur=" + duration.toFixed(2) + "s(" + durationSource + ")" +
	    " porta=" + (cmx.portamento.on ? "on" : "off") +
	    " time=" + cmx.portamento.time +
	    " bow=" + Math.round(bowBase) +
	    " int=" + intensity +
	    " rateP=" + rateP.toFixed(2));

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
	// Expression dispatch — three paths:
	//   • D47 Phase 1+2: ARC_COMPLEXES + direction-bearing face envelope →
	//     phrase-spanning linear arc (chains across consecutive same-dir
	//     voices via Phase 2).
	//   • D57 (2026-04-30): C1 pizz → static `peakExpr` (no envelope). The
	//     dynamic for pizz lives in per-pluck velocity, not in CC 11.
	//     The legacy 3-stage envelope ramped CC 11 over the full phrase
	//     duration — but rapid pizz clusters fire all plucks in the first
	//     ~200 ms, before CC 11 reaches its peak (at 25% of duration).
	//     The plucks fire at attack-time velocity, so post-pluck CC 11
	//     movement modulates only the decay tail — perceived as
	//     "dynamics change after all the pizz arrived, meaningless."
	//   • Everything else (isSingle face on multi-note complex; faces
	//     without a direction): legacy 3-stage envelope, appropriate for
	//     short single-note gestures.
	var arcDir = ARC_COMPLEXES[complexType] ? phraseArcDirection(inst) : null;
	if (arcDir === 'cresc' || arcDir === 'dim') {
		schedulePhraseArc(inst, inst.peakExpr, arcDir, Math.max(duration * 1000, 250));
	} else if (arcDir === 'hairpin-up' || arcDir === 'hairpin-down') {
		schedulePhraseHairpin(inst, inst.peakExpr, arcDir, Math.max(duration * 1000, 250));
	} else if (complexType === 1) {
		// D57 — pizz: static expression. Per-pluck velocity is the dynamic.
		inst.phraseArcDir = null;
		ccForce(inst, CC.EXPRESSION, Math.round(inst.peakExpr));
	} else if (complexType === 2) {
		// C2 detache run: per-note CC 11 lives in phraseC2, shaped by
		// phraseArcDirection. Seed CC 11 here synchronously so the
		// "Immediate expression seed" invariant holds before the first
		// scheduled noteOn fires — and do NOT schedule any later
		// peak/sustain ramps that would fight the per-note ccForce
		// writes inside phraseC2.
		inst.phraseArcDir = null;
		// Seed CC 11 to match arcMul(0) inside phraseC2 so the immediate
		// expression-seed invariant holds with the same value the first
		// scheduled noteOn will write a few ms later.
		var c2Dir = phraseArcDirection(inst);
		var c2StartMul = (c2Dir === 'cresc' || c2Dir === 'hairpin-up') ? 0.55 : 1.00;
		ccForce(inst, CC.EXPRESSION, clamp(Math.round(inst.peakExpr * c2StartMul), 1, 127));
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
	// D54 — EMA the input so the rounded CC 16 emit doesn't flicker between
	// two adjacent integers from gyro static-pose noise (perceived as a
	// 30 Hz bow buzz on sustained voices).
	state.tiltEMA = state.tiltEMA + TILT_EMA_ALPHA * (val - state.tiltEMA);

	var now = Date.now();
	if (!shouldTransmit(now)) return;
	var jitter = (state.tiltEMA - 0.5) * 60;
	for (var i = 0; i < POOL_SIZE; i++) {
		var inst = instances[i];
		if (inst.status === 'IDLE') continue;
		var cmx = COMPLEX[inst.activeComplex];
		if (!cmx || inst.bowPosBase == null) continue;
		// C8 sul-pont tremolo: SWAM drives the bow physics internally
		// at the tremolo rate; layering gyro tilt's ~18 Hz CC 16 flap on
		// top creates destructive interference with the physical model
		// (bow simulation collapses → premature audio cutout → late
		// "failed pizz" transient when the release fade re-engages the
		// stuck bow). Lock bow position at its baseline for C8. Scramble
		// bias still applies via handleExprScramble so the deliberate
		// scramble→tasto pull on C8 stays available.
		if (inst.activeComplex === 8) continue;
		// C3 owns CC 16 / CC 17 ramps per held note. A global tilt write
		// here would overwrite the motion that starts at note onset.
		if (inst.activeComplex === 3) continue;
		// C4 owns CC 16 (and CC 17) per-note via phraseC4's
		// scheduleC4BowMotion ramps. Letting the global tilt write CC 16
		// here would clobber the in-flight ramp at every 30 Hz frame,
		// collapsing the per-note bow envelope back toward the static
		// baseline + jitter. Skipping is consistent with C8 — the
		// difference is that C4 reclaims the CC, not freezes it.
		if (inst.activeComplex === 4) continue;
		var newVal = clampBowPosition(inst.bowPosBase + jitter + state.scrambleBowBias);
		var oldVal = inst.ccCache[CC.BOW_POSITION];
		cc(inst, CC.BOW_POSITION, newVal);
		// D54 flap telemetry — count reversals (direction changes in the
		// emitted CC sequence). One up→down or down→up flip per voice
		// during a held position is normal; >10 per second of voice
		// duration is the bow buzz signature, scheduleRelease's
		// natural-end task promotes to BOW POS FLAP if it crosses
		// BOW_FLAP_RATE_FAIL. Counters reset in handleVoice.
		if (oldVal != null && newVal !== oldVal) {
			var dir = (newVal > oldVal) ? 1 : -1;
			if (inst.bowPosLastDir !== 0 && dir !== inst.bowPosLastDir) {
				inst.bowPosReversals++;
			}
			inst.bowPosLastDir = dir;
			inst.bowPosWrites++;
		}
	}
}

// Spin → vibrato (depth + rate) and dev → bow (pressure + speed) are
// both unmapped from gyro — owned by SWAM internal Random Vibrato / Bow
// Random instead. Handlers retain the state.spin write + frame60 tick
// because shouldTransmit (used by handleExprTilt) reads them for the
// global motion deadband and 30 Hz rate-halving.
function handleExprSpin(val) {
	state.spin = val;
	state.frame60++;
}

function handleExprDev(val) {
	state.dev = val;
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
	// C3 and C4 are skipped because their phrase generators own CC 16 with
	// per-note ramps; an immediate scramble write here would mid-ramp stomp
	// on the bow envelope. The scramble shift will resume affecting CC 16
	// the next time a non-C3/C4 voice is sounding.
	var jitter = (state.tilt - 0.5) * 60;
	for (var i = 0; i < POOL_SIZE; i++) {
		var inst = instances[i];
		if (inst.status === 'IDLE') continue;
		var cmx = COMPLEX[inst.activeComplex];
		if (!cmx || inst.bowPosBase == null) continue;
		if (inst.activeComplex === 3 || inst.activeComplex === 4) continue;
		var effectiveBias = (inst.activeComplex === 8 && newBias < 0) ? 0 : newBias;
		ccForce(inst, CC.BOW_POSITION, clampBowPosition(inst.bowPosBase + jitter + effectiveBias));
	}
	log("scramble bow bias -> " + newBias);
}

// ================================================================
// STRUCTURAL MODIFIERS — global, take effect on the NEXT voice event
// (the just-arrived one hasn't called allocateInstance yet when these
// arrive via OSC; engine.ts sends regime/tetra in the state burst before
// the /xk/voice message).
// ================================================================
function handleTetra(orbit) {
	state.tetra = orbit;
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
	// (Removed `log("sieve -> N pitches")`. /xk/sieve fires inside every
	// engine state burst — once per cube turn at minimum — and the line
	// drowned out per-phrase invariant logs in [print xk_swam]. Re-enable
	// behind a debug flag if you ever need to verify sieve length live.)
}

// ================================================================
// CUBE ALGORITHM REACTIONS — harmonic-ping algorithms (oll-cross / sune /
// niklas / u-perm) allocate via the normal pool so they respect MAX_ACTIVE;
// accent algorithms (sexy-move / anti-sune) ride the most-recent voice so
// the accent lands on a currently-sounding cello.
// ================================================================

// Allocate a pool instance for an algorithm-triggered ping. Goes through the
// normal cap-aware allocator so the ping steals the oldest RELEASING /
// PLAYING when MAX_ACTIVE is hit — prevents algorithm pings from layering
// extra cellos on top of the 2-voice cap.
function allocateAlgorithmPing() {
	var p = allocateInstance();
	p.planId = 0;
	p.status = 'PLAYING';
	p.lastVoiceTime = Date.now();
	return p;
}

function handleAlgorithm(name) {
	log("algorithm: " + name);
	outlet(MOVES_OUTLET, "algorithm", name);
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
			var inst0 = allocateAlgorithmPing();
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
			var inst0 = allocateAlgorithmPing();
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
			var inst0 = allocateAlgorithmPing();
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
			log("algorithm reset (t-perm)");
			break;

		case "niklas":
			var inst0 = allocateAlgorithmPing();
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
// PHRASE PLAN - relay shadow-plan audit stamp
// ================================================================
function handlePhrasePlan(planId, complexType, face, durationSec, eventCount, noteOnCount, bendStepCount, companionNoteOnCount) {
	state.currentPlanId = planId | 0;
	log("phrasePlan P" + planId +
	    " C" + complexType +
	    " face=" + face +
	    " dur=" + Number(durationSec).toFixed(2) + "s" +
	    " events=" + eventCount +
	    " noteons=" + noteOnCount +
	    " bends=" + bendStepCount +
	    " companions=" + companionNoteOnCount);
}

// ================================================================
// PANIC - flush every instance
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
	else if (addr === OSC.REGIME)        { handleRegime(args[0]); }
	else if (addr === OSC.RATE)          { handleRate(args[0]); }
	else if (addr === OSC.SIEVE)         { handleSieve.apply(this, args); }
	else if (addr === OSC.ALGORITHM)     { handleAlgorithm(args[0]); }
	else if (addr === OSC.PHRASE_PLAN)   { handlePhrasePlan(args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7]); }
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
	inst.c3BowMotionExpected = false;
	inst.c3BowMotionCount = 0;
	inst.c3BowMotionMinExpr = 127;
	inst.c3BowMotionMaxRate = 0;
	inst.intensity = "mf";
	inst.density = 2.0;
	inst.duration = 1.0;
	inst.tetra = 0;
	inst.faceDurationMult = null;
	inst.faceTranspose = 0;
	inst.faceEnvelope = null;
	inst.faceMotion = null;
	inst.faceEnvProfile = null;
	inst.faceOffVelOverride = null;
	inst.faceReleaseMult = 1.0;
	inst.phraseArcDir = null;
	inst.phraseArcStart = 0;
	inst.phraseArcEnd = 0;
	inst.lastArcDir = null;
	inst.lastArcEndVal = 0;
	inst.lastArcEndTime = 0;
	inst.bowPosWrites = 0;
	inst.bowPosReversals = 0;
	inst.bowPosLastDir = 0;
	inst.lastWasLeap = false;
	inst.consecutiveLeapCurrent = 0;
	inst.consecutiveLeapMax = 0;
	// D59 — reset pitchbend at panic so any in-flight bend doesn't leak.
	cancelPitchbendRamp(inst);
	inst.pitchbend = PITCHBEND_CENTER;
	emitPitchbend(inst, PITCHBEND_CENTER);
	// D63 — drop any deferred bend transition.
	if (inst.bendPendingTask) inst.bendPendingTask.cancel();
	inst.bendPending = null;
	inst.bendPendingTask = null;
	inst.ksForceCount = 3;
	inst.forceKS = false;
	inst.status = 'IDLE';
	inst.allocatedAt = 0;
	inst.lastVoiceTime = 0;
	inst.planId = 0;

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
	// D64 — loud reminder: bridge's PITCHBEND_RANGE_SEMI must match the
	// SWAM preset's Master Tuning → Pitchbend Range setting EXACTLY.
	// Mismatch silently produces audible-bend ≠ visual-bend (e.g.,
	// preset reverted to ±2 default after a Reload Preset = 12× weaker
	// bends than the bridge expects → "leaping" perception). Cross-
	// check this number against SWAM's preset on every reload.
	log("=== BRIDGE PITCHBEND_RANGE_SEMI = ±" + PITCHBEND_RANGE_SEMI +
	    " — verify this matches SWAM preset's Pitchbend Range ===");
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
	state.dev = 0;
	state.spinLowSince = 0;
	state.frame60 = 0;
	state.scrambleBowBias = 0;
	state.tastoSince = 0;
	state.pontSince = 0;
	state.sordinoOn = false;
	state.turnRate = 0;
	state.noteOffVel = 64;
	state.face = null;
	state.faceDurationMult = null;
	state.faceTranspose = 0;
	state.faceEnvelope = null;
	state.faceArticulation = null;
	state.faceMotion = null;
	state.faceEnvProfile = null;
	state.faceOffVelOverride = null;
	state.faceReleaseMult = 1.0;
	state.currentPlanId = 0;
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
