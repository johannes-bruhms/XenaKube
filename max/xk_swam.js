// ================================================================
// xk_swam.js — XenaKube → SWAM Cello 3 MIDI bridge
//
// Receives /xk/* OSC from relay.js (port 57121) and outputs
// midievent messages directly to [vst~] hosting SWAM Cello 3.
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
// (SWAM > Preferences > MIDI > CC Assignment)
// ================================================================
var CC = {
	EXPRESSION:      11,
	BOW_PRESSURE:    17,
	BOW_POSITION:    16,   // 0 = bridge (ponticello), 127 = fingerboard (tasto)
	BOW_SPEED:       19,   // Bow Change Speed
	VIBRATO_DEPTH:    1,
	VIBRATO_RATE:    76,
	PORTAMENTO_TIME:  5,
	PORTAMENTO_ON:   65,   // 0 = off, 127 = on
	HARMONICS:       22,   // 0 = off, >64 = on
	TREMOLO:         92,
	BOW_SENSITIVITY: 21,
	ATTACK_RAMP:     73,   // Attack Time
	SUSTAIN_PEDAL:   64
};

// Keyswitches (low MIDI notes)
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
var STATUS_NOTE_ON  = 0x90 + (MIDI_CH - 1);  // 144
var STATUS_NOTE_OFF = 0x80 + (MIDI_CH - 1);   // 128
var STATUS_CC       = 0xB0 + (MIDI_CH - 1);   // 176

// ================================================================
// INTENSITY → EXPRESSION
// ================================================================
var INTENSITY_MAP = {
	"p":   15,
	"mp":  28,
	"mf":  45,
	"f":   64,
	"ff":  83,
	"fff": 102
};

var SIEVE_BASE = 36;  // MIDI note 36 = C2 (cello open C)

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
	currentNote: -1,
	frozen: false,
	transpose: 0,
	scramble: 0
};

var ccCache = {};        // last-sent CC values (avoids redundant sends at 60Hz)
var noteOffTask = null;  // scheduled note-off for pizzicato

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
	// CC cache: skip if value unchanged (important at 60Hz)
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
	outlet(0, "midievent", STATUS_NOTE_ON, note, 100);
	outlet(0, "midievent", STATUS_NOTE_OFF, note, 0);
}

// ================================================================
// COMPLEX TYPE SETUPS
// Called once when complex type changes — sets keyswitches + CCs
// ================================================================
function setupComplex(complexType) {
	state.activeComplex = complexType;
	log("complex -> C" + complexType);

	// Reset technique CCs before applying new preset
	cc(CC.HARMONICS, 0);
	cc(CC.TREMOLO, 0);
	cc(CC.PORTAMENTO_ON, 0);

	switch (complexType) {
		case 1:  // C1: Ataxic pizzicato
			keyswitch(KS.PIZZ);
			cc(CC.BOW_POSITION, rrand(30, 100));
			break;

		case 2:  // C2: Bowed ascending/descending
			keyswitch(KS.ARCO);
			cc(CC.BOW_POSITION, 64);
			cc(CC.BOW_SPEED, 80);
			state.sieveIdx = 0;
			state.sieveDir = 1;
			break;

		case 3:  // C3: Bowed sustained (legato, dark)
			keyswitch(KS.ARCO);
			cc(CC.BOW_POSITION, 100);
			cc(CC.BOW_SPEED, 30);
			break;

		case 4:  // C4: Harmonics + col legno
			keyswitch(KS.ARCO);
			cc(CC.HARMONICS, 127);
			cc(CC.BOW_POSITION, 80);
			break;

		case 5:  // C5: Ataxic glissando (wild)
			keyswitch(KS.ARCO);
			cc(CC.PORTAMENTO_ON, 127);
			cc(CC.PORTAMENTO_TIME, 40);
			cc(CC.BOW_POSITION, 60);
			break;

		case 6:  // C6: Ordered glissando (stepwise)
			keyswitch(KS.ARCO);
			cc(CC.PORTAMENTO_ON, 127);
			cc(CC.PORTAMENTO_TIME, 70);
			cc(CC.BOW_POSITION, 64);
			state.sieveIdx = 0;
			state.sieveDir = 1;
			break;

		case 7:  // C7: Sustained sliding (sul tasto)
			keyswitch(KS.ARCO);
			cc(CC.PORTAMENTO_ON, 127);
			cc(CC.PORTAMENTO_TIME, 110);
			cc(CC.BOW_POSITION, 110);
			break;

		case 8:  // C8: Sul ponticello
			keyswitch(KS.ARCO);
			cc(CC.BOW_POSITION, 10);
			cc(CC.TREMOLO, 100);
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
		case 4:   // harmonics: random
		case 5:   // wild gliss: random jump
			pitch = s[Math.floor(Math.random() * s.length)];
			break;

		case 2:   // ascending/descending: sequential walk
		case 6:   // ordered gliss: sequential
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

	return clamp(pitch + state.transpose, 24, 96);
}

// ================================================================
// VOICE EVENT — primary trigger on /xk/voice
// ================================================================
function handleVoice(vtxIdx, complexType, density, intensity, duration) {
	if (state.frozen) return;

	// Switch technique if complex type changed
	if (complexType !== state.activeComplex) {
		setupComplex(complexType);
	}

	// Expression from intensity
	var expr = INTENSITY_MAP[intensity] || 45;
	cc(CC.EXPRESSION, expr);

	// Attack ramp from density (high density = fast attack = low CC value)
	var attack = Math.round(clamp(1.0 - (density / 5.0), 0, 1) * 127);
	cc(CC.ATTACK_RAMP, attack);

	// Pick pitch from sieve
	var pitch = pickPitch(complexType);

	// Note off previous
	if (state.currentNote >= 0) {
		noteOff(state.currentNote);
		state.currentNote = -1;
	}

	// Cancel pending note-off
	if (noteOffTask) {
		noteOffTask.cancel();
		noteOffTask = null;
	}

	// Note on
	var vel = clamp(Math.round(expr * 1.2), 1, 127);
	noteOn(pitch, vel);
	state.currentNote = pitch;

	// Pizzicato: short gate, schedule note-off
	if (complexType === 1) {
		var gateMs = Math.min(duration * 1000, 500);
		var p = pitch;
		noteOffTask = new Task(function() {
			if (state.currentNote === p) {
				noteOff(p);
				state.currentNote = -1;
			}
			noteOffTask = null;
		}, this);
		noteOffTask.schedule(gateMs);
	}
	// Sustained types (2-8): note held until next /xk/voice
}

// ================================================================
// EXPRESSION — continuous 60Hz from gyro
// ================================================================
function handleExprTilt(val) {
	// Tilt → Expression (skip for pizzicato — no continuous dynamics on pluck)
	if (state.activeComplex !== 1) {
		cc(CC.EXPRESSION, Math.round(val * 127));
	}
}

function handleExprSpin(val) {
	// Spin → Vibrato Depth (0-100) + Rate (40-127)
	cc(CC.VIBRATO_DEPTH, Math.round(val * 100));
	cc(CC.VIBRATO_RATE, Math.round(40 + val * 87));
}

function handleExprDev(val) {
	// Deviation from S4 snap → Bow Pressure (30-127)
	cc(CC.BOW_PRESSURE, Math.round(30 + val * 97));
}

function handleExprScramble(val) {
	state.scramble = val;
	// Scramble → Bow Position: solved(0)=fingerboard(120), scrambled(1)=bridge(10)
	// Skip if complex type owns bow position (C8 ponticello, C3 tasto, C7 tasto)
	if (state.activeComplex !== 8
		&& state.activeComplex !== 3
		&& state.activeComplex !== 7) {
		cc(CC.BOW_POSITION, Math.round((1.0 - val) * 110 + 10));
	}
}

// ================================================================
// STRUCTURAL MODIFIERS
// ================================================================
function handleTetra(orbit) {
	state.tetra = orbit;
	cc(CC.BOW_SENSITIVITY, orbit === 0 ? 64 : 102);
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
	} else if (r === "burst") {
		cc(CC.TREMOLO, 100);
	}
	// conversational: no tremolo override, legato overlap is natural
}

function handleRate(turnsPerSec) {
	if (state.regime === "burst") {
		cc(CC.TREMOLO, Math.round(clamp(turnsPerSec / 5.0, 0, 1) * 127));
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
// SPELL REACTIONS (one-shot SWAM flourishes)
// ================================================================
function handleSpell(name) {
	log("spell: " + name);

	switch (name) {
		case "sexy-move":
			// Quick bow position sweep: snap to bridge then release
			ccForce(CC.BOW_POSITION, 10);
			var task = new Task(function() {
				// Restore scramble-based position
				handleExprScramble(state.scramble);
			}, this);
			task.schedule(200);
			break;

		case "sledgehammer":
			// Toggle freeze via sustain pedal
			state.frozen = !state.frozen;
			ccForce(CC.SUSTAIN_PEDAL, state.frozen ? 127 : 0);
			log("frozen: " + state.frozen);
			break;

		case "oll-cross":
			// Brief harmonic ping: harmonics ON for 800ms
			ccForce(CC.HARMONICS, 127);
			var taskH = new Task(function() {
				// Restore to complex type's setting
				var restore = (state.activeComplex === 4) ? 127 : 0;
				ccForce(CC.HARMONICS, restore);
			}, this);
			taskH.schedule(800);
			break;

		case "combo":
			// Staccato burst: keyswitch to staccato briefly
			keyswitch(KS.STACCATO);
			var taskS = new Task(function() {
				// Restore technique
				setupComplex(state.activeComplex);
			}, this);
			taskS.schedule(600);
			break;
	}
}

// ================================================================
// OSC ROUTING — anything() receives all /xk/* messages from inlet
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
	// All notes off
	if (state.currentNote >= 0) {
		noteOff(state.currentNote);
	}
	if (noteOffTask) {
		noteOffTask.cancel();
		noteOffTask = null;
	}

	// Reset state
	state.activeComplex = 0;
	state.sieveIdx = 0;
	state.sieveDir = 1;
	state.currentNote = -1;
	state.frozen = false;
	state.scramble = 0;
	ccCache = {};

	// All CCs to defaults
	ccForce(CC.EXPRESSION, 64);
	ccForce(CC.BOW_PRESSURE, 64);
	ccForce(CC.BOW_POSITION, 64);
	ccForce(CC.VIBRATO_DEPTH, 0);
	ccForce(CC.VIBRATO_RATE, 64);
	ccForce(CC.HARMONICS, 0);
	ccForce(CC.TREMOLO, 0);
	ccForce(CC.PORTAMENTO_ON, 0);
	ccForce(CC.SUSTAIN_PEDAL, 0);
	ccForce(CC.BOW_SENSITIVITY, 64);

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
	log("ready — listening for /xk/* on inlet");
}
