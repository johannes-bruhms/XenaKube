// xk_atoms.js — Max [js] interference/atom engine for C4, C8
//
// Receives control messages from xk_voice.js and outputs parameters
// for near-unison oscillator pairs and pizzicato triggers.
//
// Complex types handled:
//   C4 — Ionized atom: sustained interference tone + triggered pizzicato bursts
//   C8 — Atom (quasi-unison): two oscillators at near-unison for beating
//
// Outlets:
//   0 — base frequency (Hz) for oscillator 1 [cycle~]
//   1 — detuned frequency (Hz) for oscillator 2 [cycle~]
//   2 — amplitude float (for [*~] gain)
//   3 — pizz trigger: "pizz <pitchHz> <amp>" (C4 only)

inlets  = 1;
outlets = 4;

// State
var complexType = 8;
var density = 1.0;
var gain = 0.5;
var duration = 3.0;
var isV2 = 0;
var gyroDeviation = 0;
var sieveMidi = [36];
var atomActive = false;

// Detuning range in Hz (scaled by gyro deviation)
var DETUNE_MIN = 0.5;   // minimum beating even at rest
var DETUNE_MAX = 8.0;   // max beating at full gyro deviation

// Pizz scheduling
var pizzIntervalMs = 500;
var pizzActive = false;

function anything() {
    var msg = messagename;
    var args = arrayfromargs(arguments);

    if (msg === "params") {
        parseParams(args);
        atomActive = true;
        updateOscillators();
        if (complexType === 4) {
            pizzActive = true;
        } else {
            pizzActive = false;
        }
    }
    else if (msg === "stop") {
        atomActive = false;
        pizzActive = false;
    }
}

function parseParams(args) {
    complexType    = args[0];
    density        = args[1];
    gain           = args[2];
    duration       = args[3];
    isV2           = args[4];
    // args[5] = tetra
    gyroDeviation  = args[6];
    var sieveCount = args[7];
    sieveMidi = [];
    for (var i = 0; i < sieveCount; i++) {
        sieveMidi.push(args[8 + i]);
    }
    if (sieveMidi.length === 0) sieveMidi = [36];
}

function updateOscillators() {
    if (!atomActive || sieveMidi.length === 0) return;

    // Pick a pitch: for atoms, use a single sustained pitch
    // C8: center of sieve; C4: random from sieve
    var pitchMidi;
    if (complexType === 8) {
        pitchMidi = sieveMidi[Math.floor(sieveMidi.length / 2)];
    } else {
        pitchMidi = pickRandom(sieveMidi);
    }

    var baseHz = mtof(pitchMidi);

    // Detuning: controlled by gyro deviation
    // More physical cube rotation = more beating/interference
    var detuneHz = DETUNE_MIN + gyroDeviation * (DETUNE_MAX - DETUNE_MIN);

    // For V2 path, gyro deviation has stronger expression effect
    if (isV2) {
        detuneHz *= (1 + gyroDeviation);
    }

    var detunedHz = baseHz + detuneHz;

    outlet(0, baseHz);
    outlet(1, detunedHz);
    outlet(2, gain);
}

// Called by [metro] for pizzicato scheduling (C4 only)
function bang() {
    if (!pizzActive || complexType !== 4) return;

    // Triggered pizzicato burst at a random sieve pitch
    var pitchMidi = pickRandom(sieveMidi);
    var hz = mtof(pitchMidi);
    // Pizz amplitude varies with density
    var pizzAmp = gain * (0.4 + Math.random() * 0.4);

    outlet(3, "pizz", hz, pizzAmp);
}

// Called when gyro updates (more frequent than bangs)
// xenakube_receive bangs on every update including gyro
function gyro_update() {
    if (!atomActive) return;
    // Re-read gyro deviation from dict
    var dGyro = new Dict("xk_gyro");
    var w = dGyro.get("w") || 1;
    gyroDeviation = Math.max(0, Math.min(1, 1 - Math.abs(w)));
    updateOscillators();
}

function mtof(midi) {
    return 440.0 * Math.pow(2, (midi - 69) / 12.0);
}

function pickRandom(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}
