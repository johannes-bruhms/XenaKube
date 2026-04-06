// xk_voice.js — Max [js] poly~ voice orchestrator
//
// Lives inside [poly~ xk_voice 8]. Argument #1 = voice index (1-8).
// On bang from xenakube_receive.js:
//   1. Reads complex type for this voice from xk_complexes dict
//   2. Reads vertex params (density, intensity, duration) from xk_vertices dict
//   3. Reads sieve pitches from xk_sieve dict
//   4. Reads path (V1/V2) and gyro deviation from xk_state / xk_gyro dicts
//   5. Outputs selector index + control data to sub-engines
//
// Outlets:
//   0 — selector~ index (1=grains, 2=gliss, 3=atoms)
//   1 — control messages to sub-engines (list: param value ...)
//   2 — gain float (0.0–1.0 from intensity mapping)

inlets  = 1;
outlets = 3;

// Voice index from poly~ argument
var voiceIndex = 1;
if (jsarguments.length > 1) {
    voiceIndex = jsarguments[1];
}

// Intensity string → gain float
var INTENSITY_MAP = {
    "p":   0.15,
    "mp":  0.3,
    "mf":  0.5,
    "f":   0.7,
    "ff":  0.85,
    "fff": 1.0
};

// Complex type → selector channel
// C1,C2,C3 = grains (1) | C5,C6,C7 = gliss (2) | C4,C8 = atoms (3)
var TYPE_TO_SELECTOR = {
    1: 1,  // C1 ataxic cloud → grains
    2: 1,  // C2 ordered cloud asc/desc → grains
    3: 1,  // C3 ordered cloud flat → grains
    4: 3,  // C4 ionized atom → atoms
    5: 2,  // C5 ataxic sliding → gliss
    6: 2,  // C6 ordered sliding asc/desc → gliss
    7: 2,  // C7 ordered sliding flat → gliss
    8: 3   // C8 atom quasi-unison → atoms
};

// MIDI note for semitone 0 = C2
var SIEVE_MIDI_OFFSET = 36;

// Current state (cached to detect changes)
var currentComplexType = 0;
var currentSelectorChannel = 0;

function bang() {
    // Read complex type for this voice
    var dComplexes = new Dict(DICT_COMPLEXES);
    var complexType = dComplexes.get(voiceIndex.toString());
    if (complexType === undefined || complexType === null) return;
    complexType = Math.round(complexType);

    // Read vertex params
    var dVertices = new Dict(DICT_VERTICES);
    var density   = dVertices.get(voiceIndex + "::density");
    var intensity = dVertices.get(voiceIndex + "::intensity");
    var duration  = dVertices.get(voiceIndex + "::duration");

    if (density === undefined) return;

    // Read sieve pitches
    var sieve = readSieve();

    // Read path (V1/V2) and gyro deviation
    var dState = new Dict(DICT_STATE);
    var path = dState.get("path") || "V1";
    var tetra = dState.get("tetra") || 0;

    var dGyro = new Dict(DICT_GYRO);
    var gyroDeviation = computeGyroDeviation(dGyro);

    // Determine selector channel
    var selectorChannel = TYPE_TO_SELECTOR[complexType] || 1;

    // Output selector index (outlet 0)
    if (selectorChannel !== currentSelectorChannel) {
        currentSelectorChannel = selectorChannel;
        outlet(0, selectorChannel);
    }

    // Map intensity to gain
    var gain = INTENSITY_MAP[intensity] || 0.5;
    outlet(2, gain);

    // Send control data to sub-engine (outlet 1)
    // Format: complexType density intensityGain duration path tetra gyroDeviation sievePitchCount [pitches...]
    var msg = [
        "params",
        complexType,
        density,
        gain,
        duration,
        path === "V2" ? 1 : 0,
        tetra,
        gyroDeviation,
        sieve.length
    ];
    for (var i = 0; i < sieve.length; i++) {
        msg.push(sieve[i]);
    }
    outlet(1, msg);

    currentComplexType = complexType;
}

function readSieve() {
    var d = new Dict(DICT_SIEVE);
    var count = d.get("count");
    if (!count || count <= 0) return [0];
    var pitches = [];
    for (var i = 0; i < count; i++) {
        var semitone = d.get("p" + i);
        if (semitone !== undefined) {
            // Convert semitone offset to MIDI note
            pitches.push(semitone + SIEVE_MIDI_OFFSET);
        }
    }
    return pitches.length > 0 ? pitches : [SIEVE_MIDI_OFFSET];
}

function computeGyroDeviation(dGyro) {
    // Compute distance from identity quaternion (1,0,0,0)
    // as a simple deviation factor 0.0–1.0
    var x = dGyro.get("x") || 0;
    var y = dGyro.get("y") || 0;
    var z = dGyro.get("z") || 0;
    var w = dGyro.get("w") || 1;
    // Dot product with identity quat (0,0,0,1)
    var dot = Math.abs(w);
    // Clamp and invert: identity → 0, max rotation → 1
    return Math.max(0, Math.min(1, 1 - dot));
}

// Dict name constants (must match xenakube_receive.js)
var DICT_COMPLEXES = "xk_complexes";
var DICT_VERTICES  = "xk_vertices";
var DICT_SIEVE     = "xk_sieve";
var DICT_STATE     = "xk_state";
var DICT_GYRO      = "xk_gyro";
