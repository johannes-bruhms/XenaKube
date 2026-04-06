// xk_gliss.js — Max [js] glissandi engine for C5, C6, C7
//
// Receives control messages from xk_voice.js and outputs [line~] target lists
// for continuous pitch interpolation.
//
// Complex types handled:
//   C5 — Ataxic sliding: random start/end pitches from sieve, random gliss rate
//   C6 — Ordered sliding asc/desc: directional gliss through sieve sequence
//   C7 — Ordered sliding flat: slow drift between nearby sieve pitches
//
// Outlets:
//   0 — line~ messages: "pitchHz rampTimeMs" pairs for [line~]
//   1 — amplitude float (for [*~] gain)
//   2 — bang when a new gliss segment should be scheduled (connect to [delay])

inlets  = 1;
outlets = 3;

// State
var complexType = 5;
var density = 1.0;
var gain = 0.5;
var duration = 3.0;
var isV2 = 0;
var gyroDeviation = 0;
var sieveMidi = [36];
var glissActive = false;
var sieveIndex = 0;
var sieveDirection = 1;

function anything() {
    var msg = messagename;
    var args = arrayfromargs(arguments);

    if (msg === "params") {
        parseParams(args);
        glissActive = true;
        startGliss();
    }
    else if (msg === "stop") {
        glissActive = false;
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

    // Sort for ordered traversal
    sieveMidi.sort(function(a, b) { return a - b; });

    if (complexType === 6) {
        sieveDirection = Math.random() > 0.5 ? 1 : -1;
        sieveIndex = sieveDirection === 1 ? 0 : sieveMidi.length - 1;
    } else if (complexType === 7) {
        sieveIndex = Math.floor(sieveMidi.length / 2);
    }
}

function startGliss() {
    if (!glissActive || sieveMidi.length === 0) return;

    outlet(1, gain);

    switch (complexType) {
        case 5: glissAtaxic(); break;
        case 6: glissOrdered(); break;
        case 7: glissFlat(); break;
    }
}

// Called by [delay] to trigger next gliss segment
function bang() {
    startGliss();
}

function glissAtaxic() {
    // C5: random start → random end, random ramp time
    var startPitch = pickRandom(sieveMidi);
    var endPitch   = pickRandom(sieveMidi);
    // Ramp time inversely related to density, with randomness
    var baseRampMs = 1000.0 / Math.max(0.1, density);
    var rampMs = baseRampMs * (0.3 + Math.random() * 1.4);
    rampMs = Math.max(50, Math.round(rampMs));

    // Output: first set start pitch instantly, then glide to end
    outlet(0, mtof(startPitch), 5);       // jump to start in 5ms
    outlet(0, mtof(endPitch), rampMs);    // glide to end

    // Schedule next segment
    outlet(2, rampMs + 10);
}

function glissOrdered() {
    // C6: sequential walk through sieve with directional glide
    var startIdx = sieveIndex;
    sieveIndex += sieveDirection;

    // Bounce at boundaries
    if (sieveIndex >= sieveMidi.length) {
        sieveIndex = sieveMidi.length - 2;
        sieveDirection = -1;
    } else if (sieveIndex < 0) {
        sieveIndex = 1;
        sieveDirection = 1;
    }
    sieveIndex = Math.max(0, Math.min(sieveMidi.length - 1, sieveIndex));

    var startPitch = sieveMidi[startIdx] || sieveMidi[0];
    var endPitch   = sieveMidi[sieveIndex];

    var rampMs = Math.round(800.0 / Math.max(0.1, density));
    rampMs = Math.max(50, rampMs);

    outlet(0, mtof(startPitch), 5);
    outlet(0, mtof(endPitch), rampMs);
    outlet(2, rampMs + 10);
}

function glissFlat() {
    // C7: slow drift between nearby sieve pitches
    var centerIdx = Math.floor(sieveMidi.length / 2);
    var spread = Math.min(2, Math.floor(sieveMidi.length / 4));

    var offset1 = Math.round((Math.random() - 0.5) * 2 * spread);
    var offset2 = Math.round((Math.random() - 0.5) * 2 * spread);
    var idx1 = clamp(centerIdx + offset1, 0, sieveMidi.length - 1);
    var idx2 = clamp(centerIdx + offset2, 0, sieveMidi.length - 1);

    var startPitch = sieveMidi[idx1];
    var endPitch   = sieveMidi[idx2];

    // Slow ramp for flat/sustained character
    var rampMs = Math.round(1500.0 / Math.max(0.1, density));
    rampMs = Math.max(200, rampMs);

    outlet(0, mtof(startPitch), 5);
    outlet(0, mtof(endPitch), rampMs);
    outlet(2, rampMs + 10);
}

function mtof(midi) {
    return 440.0 * Math.pow(2, (midi - 69) / 12.0);
}

function pickRandom(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function clamp(val, min, max) {
    return Math.max(min, Math.min(max, val));
}
