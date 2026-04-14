// ================================================================
// xk_swam.js — XenaKube → SWAM Cello 3 MIDI bridge (v2)
//
// Receives /xk/* OSC from relay.js (port 57121) and outputs
// midievent messages directly to [vst~] hosting SWAM Cello 3.
//
// v2: phrase generation, legato portamento, auto-release,
//     velocity humanization, wider expression ranges.
//
// Max patch (4 objects):
//
//   [udpreceive 57121]
//           |
//   [v8 xk_swam.js @autowatch 1]
//      |0              |1
//   [vst~ "SWAM Cello 3" 2]    [print xk_swam]
//      |         |
//   [dac~ 1 2]
//
// ================================================================

autowatch = 1;
inlets = 1;
outlets = 2;  // 0 = midievent → vst~, 1 = debug → print

// ================================================================
// SWAM CC MAP
// Adjust to match your SWAM Cello 3 MIDI CC assignments
// ================================================================
var CC = {
	EXPRESSION:      11,
	BOW_PRESSURE:    17,
	BOW_POSITION:    16,   // 0 = bridge (ponticello), 127 = fingerboard (tasto)
	BOW_SPEED:       19,
	VIBRATO_DEPTH:    1,
	VIBRATO_RATE:    76,
	PORTAMENTO_TIME:  5,
	PORTAMENTO_ON:   65,   // 0 = off, 127 = on
	HARMONICS:       22,   // 0 = off, >64 = on
	TREMOLO:         92,
	BOW_SENSITIVITY: 21,
	ATTACK_RAMP:     73,
	SUSTAIN_PEDAL:   64
};

// Keyswitches (low MIDI notes — verify in SWAM > Preferences > MIDI)
var KS = {
	ARCO:      24,   // C1
	PIZZ:      25,   // C#1
	TREMOLO:   26,   // D1
	STACCATO:  27    // D#1
};

// ================================================================
// MIDI CONSTANTS
// ================================================================
var MIDI_CH = 1;
var STATUS_NOTE_ON  = 0x90 + (MIDI_CH - 1);
var STATUS_NOTE_OFF = 0x80 + (MIDI_CH - 1);
var STATUS_CC       = 0xB0 + (MIDI_CH - 1);

// ================================================================
// INTENSITY → base expression + velocity
// ================================================================
var INTENSITY_MAP = {
	"p":   { expr: 20, vel: 35 },
	"mp":  { expr: 38, vel: 50 },
	"mf":  { expr: 55, vel: 68 },
	"f":   { expr: 75, vel: 85 },
	"ff":  { expr: 95, vel: 100 },
	"fff": { expr: 115, vel: 120 }
};

var SIEVE_BASE = 36;  // MIDI 36 = C2 (cello open C)

// SWAM Cello 3 playable range: C2 (36) — F6 (89).
// All generated pitches are clamped to this window before note-on.
var CELLO_MIN = 36;
var CELLO_MAX = 89;

// ================================================================
// STATE
// ================================================================
var state = {
	activeComplex: 0,
	sieve: [36, 37, 39, 41, 43, 44, 48],
	sieveIdx: 0,
	sieveDir: 1,
	path: "V1",
	tetra: 0,
	regime: "contemplative",
	activeNotes: [],     // array of currently sounding MIDI pitches
	frozen: false,
	transpose: 0,
	scramble: 0,
	turnCount: 0,        // for accent patterns
	lastTurnTime: 0,     // for gap detection
	baseExpr: 55,        // current intensity-derived expression baseline
	tiltExpr: -1,        // last 60Hz tilt value (-1 = not set)
	density: 2.0,
	duration: 1.0
};

var ccCache = {};
var phraseTasks = [];    // scheduled phrase note events
var releaseTask = null;  // auto-release timer

// ================================================================
// MIDI OUTPUT
// ================================================================
function noteOn(pitch, vel) {
	pitch = clamp(pitch, 0, 127);
	vel = clamp(vel, 1, 127);
	outlet(0, "midievent", STATUS_NOTE_ON, pitch, vel);
}

function noteOff(pitch) {
	pitch = clamp(pitch, 0, 127);
	outlet(0, "midievent", STATUS_NOTE_OFF, pitch, 0);
}

function cc(num, val) {
	val = clamp(Math.round(val), 0, 127);
	if (ccCache[num] === val) return;
	ccCache[num] = val;
	outlet(0, "midievent", STATUS_CC, num, val);
}

function ccForce(num, val) {
	val = clamp(Math.round(val), 0, 127);
	ccCache[num] = val;
	outlet(0, "midievent", STATUS_CC, num, val);
}

function keyswitch(note) {
	// Send with slight sustain so SWAM registers the switch
	outlet(0, "midievent", STATUS_NOTE_ON, note, 100);
	var ks = note;
	var t = new Task(function() {
		outlet(0, "midievent", STATUS_NOTE_OFF, ks, 0);
	}, this);
	t.schedule(30);
}

// Kill all sounding notes
function allNotesOff() {
	for (var i = 0; i < state.activeNotes.length; i++) {
		noteOff(state.activeNotes[i]);
	}
	state.activeNotes = [];
}

// Cancel all scheduled phrase events
function cancelPhrase() {
	for (var i = 0; i < phraseTasks.length; i++) {
		phraseTasks[i].cancel();
	}
	phraseTasks = [];
}

// Schedule auto-release after duration (seconds)
function scheduleRelease(dur) {
	if (releaseTask) {
		releaseTask.cancel();
		releaseTask = null;
	}
	var ms = Math.max(dur * 1000, 200);
	releaseTask = new Task(function() {
		// Fade out expression before note-off for natural decay
		var fadeSteps = 5;
		var fadeTime = 80;
		var startExpr = ccCache[CC.EXPRESSION] || 64;

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
// HUMANIZATION
// ================================================================
function humanVel(base) {
	// ±15% random variation + slight accent every 3rd/4th turn
	var jitter = (Math.random() - 0.5) * 0.3 * base;
	var accent = (state.turnCount % 3 === 0) ? 8 : 0;
	return clamp(Math.round(base + jitter + accent), 20, 127);
}

function humanPitch(pitch) {
	// Occasionally (10%) shift by ±1 semitone for microtonal color
	if (Math.random() < 0.1) {
		pitch += (Math.random() < 0.5) ? -1 : 1;
	}
	return clamp(pitch, CELLO_MIN, CELLO_MAX);
}

function humanDelay() {
	// 0-30ms random micro-delay for natural feel
	return Math.floor(Math.random() * 30);
}

// ================================================================
// COMPLEX TYPE SETUPS
// ================================================================
function setupComplex(complexType) {
	state.activeComplex = complexType;
	log("complex -> C" + complexType);

	// Reset technique CCs
	cc(CC.HARMONICS, 0);
	cc(CC.TREMOLO, 0);
	cc(CC.PORTAMENTO_ON, 0);
	cc(CC.PORTAMENTO_TIME, 0);

	switch (complexType) {
		case 1:  // C1: Pizzicato cloud
			keyswitch(KS.PIZZ);
			cc(CC.ATTACK_RAMP, 10);
			break;

		case 2:  // C2: Bowed ascending/descending (legato)
			keyswitch(KS.ARCO);
			cc(CC.BOW_POSITION, 70);
			cc(CC.BOW_SPEED, 80);
			cc(CC.ATTACK_RAMP, 40);
			state.sieveIdx = 0;
			state.sieveDir = 1;
			break;

		case 3:  // C3: Sustained dark legato
			keyswitch(KS.ARCO);
			cc(CC.BOW_POSITION, 110);  // sul tasto
			cc(CC.BOW_SPEED, 25);
			cc(CC.ATTACK_RAMP, 80);    // slow attack
			break;

		case 4:  // C4: Harmonics
			keyswitch(KS.ARCO);
			cc(CC.HARMONICS, 127);
			cc(CC.BOW_POSITION, 85);
			cc(CC.BOW_PRESSURE, 30);   // light pressure for harmonics
			break;

		case 5:  // C5: Wild glissando (portamento, big jumps)
			keyswitch(KS.ARCO);
			cc(CC.PORTAMENTO_ON, 127);
			cc(CC.PORTAMENTO_TIME, 50);
			cc(CC.BOW_POSITION, 55);
			cc(CC.ATTACK_RAMP, 30);
			break;

		case 6:  // C6: Ordered glissando (stepwise slides)
			keyswitch(KS.ARCO);
			cc(CC.PORTAMENTO_ON, 127);
			cc(CC.PORTAMENTO_TIME, 80);
			cc(CC.BOW_POSITION, 64);
			cc(CC.ATTACK_RAMP, 50);
			state.sieveIdx = 0;
			state.sieveDir = 1;
			break;

		case 7:  // C7: Sustained sliding (slow portamento, sul tasto)
			keyswitch(KS.ARCO);
			cc(CC.PORTAMENTO_ON, 127);
			cc(CC.PORTAMENTO_TIME, 115);
			cc(CC.BOW_POSITION, 115);
			cc(CC.ATTACK_RAMP, 90);
			break;

		case 8:  // C8: Sul ponticello tremolo
			keyswitch(KS.ARCO);
			cc(CC.BOW_POSITION, 5);    // very near bridge
			cc(CC.TREMOLO, 110);
			cc(CC.BOW_PRESSURE, 100);
			break;
	}
}

// ================================================================
// PITCH SELECTION
// ================================================================
function pickPitch(complexType) {
	var s = state.sieve;
	if (s.length === 0) return 36 + state.transpose;

	var pitch;
	switch (complexType) {
		case 1:   // ataxic: random
		case 4:   // harmonics: random high
		case 5:   // wild gliss: random jump
			pitch = s[Math.floor(Math.random() * s.length)];
			break;

		case 2:   // ascending/descending
		case 6:   // ordered gliss
			pitch = s[state.sieveIdx];
			state.sieveIdx += state.sieveDir;
			if (state.sieveIdx >= s.length) {
				state.sieveIdx = s.length - 2;
				state.sieveDir = -1;
			}
			if (state.sieveIdx < 0) {
				state.sieveIdx = 1;
				state.sieveDir = 1;
			}
			state.sieveIdx = clamp(state.sieveIdx, 0, s.length - 1);
			break;

		case 3:   // sustained: center
		case 7:   // sul tasto: center
		case 8:   // ponticello: center
			pitch = s[Math.floor(s.length / 2)];
			break;

		default:
			pitch = s[0];
	}

	return foldToRange(pitch + state.transpose);
}

// Pick N distinct pitches from sieve
function pickPitches(n) {
	var s = state.sieve;
	if (s.length === 0) return [foldToRange(36 + state.transpose)];
	var pool = s.slice();
	// Shuffle
	for (var i = pool.length - 1; i > 0; i--) {
		var j = Math.floor(Math.random() * (i + 1));
		var tmp = pool[i]; pool[i] = pool[j]; pool[j] = tmp;
	}
	var result = [];
	for (var k = 0; k < Math.min(n, pool.length); k++) {
		result.push(foldToRange(pool[k] + state.transpose));
	}
	return result;
}

// Fold a pitch into the cello range by octave transposition.
// Prefer shifting by full octaves (preserves pitch class from the sieve)
// rather than hard-clamping, which would collapse many notes to CELLO_MIN/MAX.
function foldToRange(pitch) {
	while (pitch < CELLO_MIN) pitch += 12;
	while (pitch > CELLO_MAX) pitch -= 12;
	// Safety clamp in case the window is ever smaller than an octave.
	return clamp(pitch, CELLO_MIN, CELLO_MAX);
}

// ================================================================
// LEGATO NOTE — sends noteOn BEFORE noteOff for portamento
// ================================================================
function legatoNote(pitch, vel) {
	var oldNotes = state.activeNotes.slice();
	noteOn(pitch, vel);
	state.activeNotes.push(pitch);

	// Release old notes AFTER new note is sounding (20ms overlap for SWAM legato)
	if (oldNotes.length > 0) {
		var t = new Task(function() {
			for (var i = 0; i < oldNotes.length; i++) {
				noteOff(oldNotes[i]);
				var idx = state.activeNotes.indexOf(oldNotes[i]);
				if (idx >= 0) state.activeNotes.splice(idx, 1);
			}
		}, this);
		t.schedule(20);
		phraseTasks.push(t);
	}
}

// ================================================================
// PHRASE GENERATORS — one per complex type family
// Each turn triggers a musical gesture, not just a single note.
// ================================================================

// C1: Pizzicato cloud — 2-5 short plucked notes scattered in time
function phraseC1(vel, dur) {
	var count = rrand(2, Math.min(5, Math.max(2, Math.round(state.density + 1))));
	var spread = Math.min(dur * 1000, 600);  // spread over up to 600ms

	for (var i = 0; i < count; i++) {
		(function(idx) {
			var delay = idx === 0 ? 0 : rrand(30, Math.round(spread));
			var t = new Task(function() {
				var p = humanPitch(pickPitch(1));
				var v = humanVel(vel);
				// Pizzicato: short gate
				noteOn(p, v);
				state.activeNotes.push(p);
				var offTask = new Task(function() {
					noteOff(p);
					var pidx = state.activeNotes.indexOf(p);
					if (pidx >= 0) state.activeNotes.splice(pidx, 1);
				}, this);
				offTask.schedule(rrand(60, 200));
				phraseTasks.push(offTask);
			}, this);
			t.schedule(delay);
			phraseTasks.push(t);
		})(i);
	}
}

// C2: Bowed ascending/descending — legato run of 2-3 notes
function phraseC2(vel, dur) {
	var count = state.regime === "burst" ? 3 : 2;
	var spacing = Math.max(120, Math.round(dur * 1000 / (count + 1)));

	for (var i = 0; i < count; i++) {
		(function(idx) {
			var t = new Task(function() {
				var p = pickPitch(2);
				legatoNote(humanPitch(p), humanVel(vel));
			}, this);
			t.schedule(idx * spacing + humanDelay());
			phraseTasks.push(t);
		})(i);
	}
	scheduleRelease(dur * 1.2);
}

// C3: Sustained dark — single long note, expression swell
function phraseC3(vel, dur) {
	var p = pickPitch(3);
	legatoNote(humanPitch(p), humanVel(vel));

	// Gentle expression swell: start lower, peak at 60%, then settle
	var startExpr = Math.round(state.baseExpr * 0.6);
	var peakExpr = Math.round(state.baseExpr * 1.1);
	ccForce(CC.EXPRESSION, startExpr);

	var peakTime = Math.round(dur * 1000 * 0.4);
	var settleTime = Math.round(dur * 1000 * 0.7);

	var t1 = new Task(function() {
		ccForce(CC.EXPRESSION, clamp(peakExpr, 0, 127));
	}, this);
	t1.schedule(peakTime);
	phraseTasks.push(t1);

	var settleExpr = state.baseExpr;
	var t2 = new Task(function() {
		ccForce(CC.EXPRESSION, clamp(settleExpr, 0, 127));
	}, this);
	t2.schedule(settleTime);
	phraseTasks.push(t2);

	scheduleRelease(dur * 1.5);
}

// C4: Harmonics — ethereal, 1-2 notes with light touch
function phraseC4(vel, dur) {
	var p = pickPitch(4);
	// Harmonics sound best in upper register — push up an octave if low,
	// but keep inside the cello's playable range.
	if (p < 60 && p + 12 <= CELLO_MAX) p += 12;
	legatoNote(humanPitch(p), clamp(humanVel(vel) - 15, 20, 100));
	scheduleRelease(dur);
}

// C5: Wild glissando — two notes far apart, portamento slides between
function phraseC5(vel, dur) {
	// Pick two notes with big interval
	var p1 = pickPitch(5);
	var p2 = pickPitch(5);
	// Ensure they're at least 5 semitones apart
	var attempts = 0;
	while (Math.abs(p2 - p1) < 5 && attempts < 10) {
		p2 = pickPitch(5);
		attempts++;
	}

	legatoNote(humanPitch(p1), humanVel(vel));

	// Slide to second note
	var slideTime = rrand(200, Math.round(dur * 1000 * 0.6));
	var t = new Task(function() {
		legatoNote(humanPitch(p2), humanVel(vel));
	}, this);
	t.schedule(slideTime);
	phraseTasks.push(t);

	scheduleRelease(dur * 1.3);
}

// C6: Ordered stepwise glissando — walk through sieve with portamento
function phraseC6(vel, dur) {
	var count = rrand(2, 4);
	var spacing = Math.max(150, Math.round(dur * 1000 / (count + 1)));

	for (var i = 0; i < count; i++) {
		(function(idx) {
			var t = new Task(function() {
				var p = pickPitch(6);
				legatoNote(humanPitch(p), humanVel(vel));
			}, this);
			t.schedule(idx * spacing + humanDelay());
			phraseTasks.push(t);
		})(i);
	}
	scheduleRelease(dur * 1.2);
}

// C7: Sustained sliding — single note, slow portamento drift
function phraseC7(vel, dur) {
	var p1 = pickPitch(7);
	legatoNote(humanPitch(p1), humanVel(vel));

	// Slow drift to neighbor after half duration
	var driftTime = Math.round(dur * 1000 * 0.5);
	var t = new Task(function() {
		var p2 = p1 + rrand(-3, 3);
		p2 = clamp(p2, CELLO_MIN, CELLO_MAX);
		legatoNote(p2, humanVel(vel));
	}, this);
	t.schedule(driftTime);
	phraseTasks.push(t);

	scheduleRelease(dur * 2.0);
}

// C8: Sul ponticello tremolo — metallic, near-bridge
function phraseC8(vel, dur) {
	var p = pickPitch(8);
	legatoNote(humanPitch(p), humanVel(vel + 10));
	// Tremolo is already set in setupComplex
	scheduleRelease(dur);
}

// ================================================================
// VOICE EVENT — primary trigger on /xk/voice
// ================================================================
function handleVoice(vtxIdx, complexType, density, intensity, duration) {
	if (state.frozen) return;

	state.turnCount++;
	state.density = density;
	state.duration = duration;
	var now = Date.now();
	var gap = now - state.lastTurnTime;
	state.lastTurnTime = now;

	// Cancel any in-progress phrase and release timer
	cancelPhrase();
	if (releaseTask) {
		releaseTask.cancel();
		releaseTask = null;
	}

	// Switch technique if complex type changed
	if (complexType !== state.activeComplex) {
		// Kill old notes before switching technique
		allNotesOff();
		setupComplex(complexType);
	}

	// Expression from intensity
	var intMap = INTENSITY_MAP[intensity] || INTENSITY_MAP["mf"];
	state.baseExpr = intMap.expr;
	var baseVel = intMap.vel;

	// Don't override expression if tilt is actively controlling it
	if (state.tiltExpr < 0) {
		cc(CC.EXPRESSION, intMap.expr);
	}

	// Attack ramp from density
	var attack = Math.round(clamp(1.0 - (density / 5.0), 0, 1) * 127);
	cc(CC.ATTACK_RAMP, attack);

	// Dispatch to phrase generator
	switch (complexType) {
		case 1:  phraseC1(baseVel, duration); break;
		case 2:  phraseC2(baseVel, duration); break;
		case 3:  phraseC3(baseVel, duration); break;
		case 4:  phraseC4(baseVel, duration); break;
		case 5:  phraseC5(baseVel, duration); break;
		case 6:  phraseC6(baseVel, duration); break;
		case 7:  phraseC7(baseVel, duration); break;
		case 8:  phraseC8(baseVel, duration); break;
		default:
			// Fallback: single legato note
			legatoNote(pickPitch(complexType), humanVel(baseVel));
			scheduleRelease(duration);
	}
}

// ================================================================
// EXPRESSION — continuous 60Hz from gyro
// ================================================================
function handleExprTilt(val) {
	state.tiltExpr = val;
	if (state.activeComplex === 1) return;  // no continuous dynamics on pizz

	// Blend tilt with base intensity: tilt shapes the dynamic envelope
	// tilt=0 (face down) → quiet, tilt=1 (face up) → full expression
	var tiltContrib = val * val;  // exponential curve for more dramatic control
	var blended = Math.round(state.baseExpr * 0.3 + tiltContrib * 97);
	cc(CC.EXPRESSION, clamp(blended, 5, 127));
}

function handleExprSpin(val) {
	// Spin → Vibrato: exponential curve, only kicks in above threshold
	var v = val > 0.15 ? (val - 0.15) / 0.85 : 0;
	v = v * v;
	cc(CC.VIBRATO_DEPTH, Math.round(v * 110));
	cc(CC.VIBRATO_RATE, Math.round(50 + v * 77));
}

function handleExprDev(val) {
	// Deviation → Bow Pressure: locked=light(20), boundary=heavy(127)
	var pressure = Math.round(20 + val * val * 107);
	cc(CC.BOW_PRESSURE, pressure);

	// Also modulate bow speed: more deviation = more erratic bowing
	if (state.activeComplex !== 3 && state.activeComplex !== 7) {
		cc(CC.BOW_SPEED, Math.round(40 + val * 80));
	}
}

function handleExprScramble(val) {
	state.scramble = val;
	// Scramble → Bow Position: solved=fingerboard(120), scrambled=bridge(5)
	// Skip for types that own bow position
	if (state.activeComplex !== 8
		&& state.activeComplex !== 3
		&& state.activeComplex !== 7
		&& state.activeComplex !== 4) {
		var pos = Math.round((1.0 - val) * 115 + 5);
		cc(CC.BOW_POSITION, pos);
	}
}

// ================================================================
// STRUCTURAL MODIFIERS
// ================================================================
function handleTetra(orbit) {
	state.tetra = orbit;
	// Even=warm (lower sensitivity, fingerboard-ish), Odd=edgy (higher)
	cc(CC.BOW_SENSITIVITY, orbit === 0 ? 50 : 110);
}

function handlePath(p) {
	state.path = p;
	state.transpose = (p === "V2") ? -12 : 0;
	log("path -> " + p + " (transpose " + state.transpose + ")");
}

function handleRegime(r) {
	state.regime = r;
	log("regime -> " + r);
	if (r === "contemplative") {
		cc(CC.TREMOLO, 0);
		// Slow attack for contemplative
		cc(CC.ATTACK_RAMP, 90);
	} else if (r === "burst") {
		cc(CC.TREMOLO, 80);
		cc(CC.ATTACK_RAMP, 10);
	} else {
		// conversational
		cc(CC.TREMOLO, 0);
		cc(CC.ATTACK_RAMP, 50);
	}
}

function handleRate(turnsPerSec) {
	if (state.regime === "burst") {
		cc(CC.TREMOLO, Math.round(clamp(turnsPerSec / 4.0, 0, 1) * 127));
	}
}

function handleSieve() {
	var args = arrayfromargs(arguments);
	state.sieve = [];
	for (var i = 0; i < args.length; i++) {
		state.sieve.push(args[i] + SIEVE_BASE);
	}
	state.sieveIdx = clamp(state.sieveIdx, 0, Math.max(0, state.sieve.length - 1));
	log("sieve -> " + state.sieve.length + " pitches");
}

// ================================================================
// SPELL REACTIONS
// ================================================================
function handleSpell(name) {
	log("spell: " + name);

	switch (name) {
		case "sexy-move":
			// Quick bow sweep: snap to bridge, ramp expression, release
			ccForce(CC.BOW_POSITION, 5);
			ccForce(CC.EXPRESSION, 120);
			var sweep1 = new Task(function() {
				ccForce(CC.BOW_POSITION, 60);
				ccForce(CC.EXPRESSION, 90);
			}, this);
			sweep1.schedule(150);
			phraseTasks.push(sweep1);
			var sweep2 = new Task(function() {
				handleExprScramble(state.scramble);
			}, this);
			sweep2.schedule(400);
			phraseTasks.push(sweep2);
			break;

		case "sledgehammer":
			// Toggle freeze
			state.frozen = !state.frozen;
			if (state.frozen) {
				ccForce(CC.SUSTAIN_PEDAL, 127);
				log("FROZEN — turns ignored, note sustains");
			} else {
				ccForce(CC.SUSTAIN_PEDAL, 0);
				// Release held notes on unfreeze
				allNotesOff();
				log("UNFROZEN — resuming");
			}
			break;

		case "oll-cross":
			// Harmonic ping: brief harmonics flash + high note
			var oldHarm = (state.activeComplex === 4) ? 127 : 0;
			ccForce(CC.HARMONICS, 127);
			ccForce(CC.BOW_PRESSURE, 20);
			var harmPitch = foldToRange(pickPitch(4) + 12);
			noteOn(harmPitch, 60);
			state.activeNotes.push(harmPitch);
			var harmOff = new Task(function() {
				noteOff(harmPitch);
				var idx = state.activeNotes.indexOf(harmPitch);
				if (idx >= 0) state.activeNotes.splice(idx, 1);
				ccForce(CC.HARMONICS, oldHarm);
			}, this);
			harmOff.schedule(800);
			phraseTasks.push(harmOff);
			break;

		case "u-perm":
			// Staccato burst: 3-5 rapid short notes (was 'combo' in old spell book)
			keyswitch(KS.STACCATO);
			var burstCount = rrand(3, 5);
			for (var i = 0; i < burstCount; i++) {
				(function(idx) {
					var bt = new Task(function() {
						var bp = humanPitch(pickPitch(1));
						noteOn(bp, rrand(70, 110));
						state.activeNotes.push(bp);
						var boff = new Task(function() {
							noteOff(bp);
							var bidx = state.activeNotes.indexOf(bp);
							if (bidx >= 0) state.activeNotes.splice(bidx, 1);
							// Restore technique after last note
							if (idx === burstCount - 1) {
								setupComplex(state.activeComplex);
							}
						}, this);
						boff.schedule(rrand(40, 100));
						phraseTasks.push(boff);
					}, this);
					bt.schedule(idx * rrand(60, 120));
					phraseTasks.push(bt);
				})(i);
			}
			break;

		case "sune":
			// V2 palette: darken, shift to tasto
			ccForce(CC.BOW_POSITION, 100);
			ccForce(CC.EXPRESSION, 40);
			log("palette -> V2 (dark)");
			break;

		case "anti-sune":
			// V1 palette: brighten
			ccForce(CC.BOW_POSITION, 50);
			ccForce(CC.EXPRESSION, 80);
			log("palette -> V1 (bright)");
			break;

		case "t-perm":
			// Reset everything
			bang();
			log("spell reset (t-perm)");
			break;
	}
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
	// 60Hz expression
	else if (addr === "/xk/expr/tilt")     { handleExprTilt(args[0]); }
	else if (addr === "/xk/expr/spin")     { handleExprSpin(args[0]); }
	else if (addr === "/xk/expr/dev")      { handleExprDev(args[0]); }
	else if (addr === "/xk/expr/scramble") { handleExprScramble(args[0]); }
	// Structural
	else if (addr === "/xk/tetra")    { handleTetra(args[0]); }
	else if (addr === "/xk/path")     { handlePath(args[0]); }
	else if (addr === "/xk/regime")   { handleRegime(args[0]); }
	else if (addr === "/xk/rate")     { handleRate(args[0]); }
	else if (addr === "/xk/sieve")    { handleSieve.apply(this, args); }
	else if (addr === "/xk/spell")    { handleSpell(args[0]); }
	else if (addr === "/xk/scramble") { handleExprScramble(args[0]); }
}

// ================================================================
// RESET
// ================================================================
function bang() {
	// Cancel all scheduled events
	cancelPhrase();
	if (releaseTask) {
		releaseTask.cancel();
		releaseTask = null;
	}

	// All notes off
	allNotesOff();

	// Reset state
	state.activeComplex = 0;
	state.sieveIdx = 0;
	state.sieveDir = 1;
	state.activeNotes = [];
	state.frozen = false;
	state.scramble = 0;
	state.turnCount = 0;
	state.lastTurnTime = 0;
	state.baseExpr = 55;
	state.tiltExpr = -1;
	state.density = 2.0;
	state.duration = 1.0;
	ccCache = {};

	// CCs to defaults
	ccForce(CC.EXPRESSION, 64);
	ccForce(CC.BOW_PRESSURE, 64);
	ccForce(CC.BOW_POSITION, 64);
	ccForce(CC.BOW_SPEED, 64);
	ccForce(CC.VIBRATO_DEPTH, 0);
	ccForce(CC.VIBRATO_RATE, 64);
	ccForce(CC.HARMONICS, 0);
	ccForce(CC.TREMOLO, 0);
	ccForce(CC.PORTAMENTO_ON, 0);
	ccForce(CC.PORTAMENTO_TIME, 0);
	ccForce(CC.SUSTAIN_PEDAL, 0);
	ccForce(CC.BOW_SENSITIVITY, 64);
	ccForce(CC.ATTACK_RAMP, 64);

	keyswitch(KS.ARCO);

	log("reset");
}

// ================================================================
// UTILITIES
// ================================================================
function clamp(v, lo, hi) {
	return Math.max(lo, Math.min(hi, v));
}

function rrand(lo, hi) {
	return Math.floor(Math.random() * (hi - lo + 1)) + lo;
}

function log(msg) {
	outlet(1, "xk_swam: " + msg);
}

// ================================================================
// INIT
// ================================================================
function loadbang() {
	log("v2 ready — phrase gen, legato portamento, auto-release");
}
