// xk_grains.js — Max [js] grain scheduler for C1, C2, C3
//
// Receives control messages from xk_voice.js and triggers grains.
// Lives inside the grain signal chain of [poly~ xk_voice].
//
// Complex types handled:
//   C1 — Ataxic cloud: stochastic pitch from sieve, random timing within density
//   C2 — Ordered cloud asc/desc: sequential walk through sieve, ascending or descending
//   C3 — Ordered cloud flat: cluster around central sieve pitch, small spread
//
// Outlets:
//   0 — grain trigger messages: "grain <pitchHz> <amp> <grainDurMs>"
//   1 — metro interval (ms) for Max [metro] object

inlets  = 1;
outlets = 2;

// State
var complexType = 1;
var density = 1.0;
var gain = 0.5;
var duration = 3.0;
var isV2 = 0;
var sieveMidi = [36];  // MIDI note numbers
var grainActive = false;
var sieveIndex = 0;     // for ordered traversal (C2)
var sieveDirection = 1; // 1 = ascending, -1 = descending

// Grain duration range (ms)
var GRAIN_DUR_MIN = 30;
var GRAIN_DUR_MAX = 150;

function anything() {
    var msg = messagename;
    var args = arrayfromargs(arguments);

    if (msg === "params") {
        parseParams(args);
        updateMetro();
        grainActive = true;
    }
    else if (msg === "stop") {
        grainActive = false;
    }
}

function parseParams(args) {
    // args: complexType density gain duration isV2 tetra gyroDeviation sieveCount [pitches...]
    complexType = args[0];
    density     = args[1];
    gain        = args[2];
    duration    = args[3];
    isV2        = args[4];
    // args[5] = tetra, args[6] = gyroDeviation
    var sieveCount = args[7];
    sieveMidi = [];
    for (var i = 0; i < sieveCount; i++) {
        sieveMidi.push(args[8 + i]);
    }
    if (sieveMidi.length === 0) sieveMidi = [36];

    // Reset traversal on new params
    if (complexType === 2) {
        // C2: randomize initial direction
        sieveDirection = Math.random() > 0.5 ? 1 : -1;
        sieveIndex = sieveDirection === 1 ? 0 : sieveMidi.length - 1;
    } else if (complexType === 3) {
        // C3: pick center index
        sieveIndex = Math.floor(sieveMidi.length / 2);
    }
}

function updateMetro() {
    // density = events/sec → metro interval in ms
    var intervalMs = 1000.0 / Math.max(0.1, density);
    // Add jitter for C1 (ataxic)
    if (complexType === 1) {
        intervalMs *= (0.5 + Math.random());
    }
    outlet(1, Math.round(intervalMs));
}

// Called by [metro] on each tick
function bang() {
    if (!grainActive || sieveMidi.length === 0) return;

    var pitch, amp, grainDur;

    switch (complexType) {
        case 1: // C1 — ataxic cloud
            pitch = pickRandom(sieveMidi);
            amp = gain * (0.5 + Math.random() * 0.5);
            grainDur = GRAIN_DUR_MIN + Math.random() * (GRAIN_DUR_MAX - GRAIN_DUR_MIN);
            // Re-randomize metro interval for next grain
            updateMetro();
            break;

        case 2: // C2 — ordered asc/desc
            pitch = sieveMidi[sieveIndex];
            amp = gain;
            grainDur = GRAIN_DUR_MIN + (GRAIN_DUR_MAX - GRAIN_DUR_MIN) * 0.6;
            // Advance through sieve
            sieveIndex += sieveDirection;
            if (sieveIndex >= sieveMidi.length) {
                sieveIndex = sieveMidi.length - 1;
                sieveDirection = -1;
            } else if (sieveIndex < 0) {
                sieveIndex = 0;
                sieveDirection = 1;
            }
            break;

        case 3: // C3 — ordered flat
            // Small random offset from center
            var centerIdx = Math.floor(sieveMidi.length / 2);
            var spread = Math.min(2, Math.floor(sieveMidi.length / 4));
            var offset = Math.round((Math.random() - 0.5) * 2 * spread);
            var idx = Math.max(0, Math.min(sieveMidi.length - 1, centerIdx + offset));
            pitch = sieveMidi[idx];
            amp = gain;
            grainDur = GRAIN_DUR_MIN + (GRAIN_DUR_MAX - GRAIN_DUR_MIN) * 0.5;
            break;

        default:
            return;
    }

    // Convert MIDI to Hz
    var hz = mtof(pitch);
    outlet(0, "grain", hz, amp, Math.round(grainDur));
}

function mtof(midi) {
    return 440.0 * Math.pow(2, (midi - 69) / 12.0);
}

function pickRandom(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}
