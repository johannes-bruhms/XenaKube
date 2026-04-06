// xenakube_receive.js — Max [js] object
//
// Receives /xk/* OSC messages (via udpreceive → route → js) and writes
// values into Max dicts so poly~ voices can read them.
//
// Max patch outline:
//   [udpreceive 9000] → [OSC-route /xk] → [route group vertex complex path cycle tetra sieve gyro step perm]
//   Each route outlet → this [js] object's inlets (or use a single inlet with the full address).
//
// Usage: place [js xenakube_receive.js] in the patcher.
// It expects messages in the form: <address> <args...>
// e.g., "vertex/1 0.8 0.6 3.5" or "group/k 7"

inlets  = 1;
outlets = 1;  // bang on update (for triggering downstream)

// Dict names — poly~ voices read from these
var DICT_VERTICES  = "xk_vertices";
var DICT_COMPLEXES = "xk_complexes";
var DICT_STATE     = "xk_state";
var DICT_SIEVE     = "xk_sieve";
var DICT_GYRO      = "xk_gyro";
var DICT_PERM      = "xk_perm";

function loadbang() {
    // Ensure dicts exist
    var names = [DICT_VERTICES, DICT_COMPLEXES, DICT_STATE, DICT_SIEVE, DICT_GYRO, DICT_PERM];
    for (var i = 0; i < names.length; i++) {
        var d = new Dict(names[i]);
        // Dict() auto-creates if it doesn't exist
    }
    post("xenakube_receive: dicts initialized\n");
}

// Main entry: called with the OSC sub-address + args after /xk/ has been stripped.
// e.g., anything("group/k", 7) or anything("vertex/3", 0.5, 0.8, 2.0)
function anything() {
    var addr = messagename;
    var args = arrayfromargs(arguments);

    if (addr.indexOf("vertex/") === 0) {
        // vertex/N density intensity duration
        var idx = addr.split("/")[1];
        var d = new Dict(DICT_VERTICES);
        d.set(idx + "::density",   args[0]);
        d.set(idx + "::intensity", args[1]);
        d.set(idx + "::duration",  args[2]);
    }
    else if (addr.indexOf("complex/") === 0) {
        // complex/N type_string
        var idx = addr.split("/")[1];
        var d = new Dict(DICT_COMPLEXES);
        d.set(idx, args[0]);
    }
    else if (addr.indexOf("group/") === 0) {
        // group/k or group/c — S4 element index
        var which = addr.split("/")[1];  // "k" or "c"
        var d = new Dict(DICT_STATE);
        d.set("group_" + which, args[0]);
    }
    else if (addr === "path") {
        var d = new Dict(DICT_STATE);
        d.set("path", args[0]);
    }
    else if (addr === "cycle") {
        var d = new Dict(DICT_STATE);
        d.set("cycle", args[0]);
    }
    else if (addr === "tetra") {
        var d = new Dict(DICT_STATE);
        d.set("tetra", args[0]);
    }
    else if (addr === "step") {
        var d = new Dict(DICT_STATE);
        d.set("step", args[0]);
    }
    else if (addr === "sieve") {
        // Variable-length pitch list
        var d = new Dict(DICT_SIEVE);
        d.set("count", args.length);
        for (var i = 0; i < args.length; i++) {
            d.set("p" + i, args[i]);
        }
    }
    else if (addr === "gyro") {
        var d = new Dict(DICT_GYRO);
        d.set("x", args[0]);
        d.set("y", args[1]);
        d.set("z", args[2]);
        d.set("w", args[3]);
    }
    else if (addr === "perm") {
        var d = new Dict(DICT_PERM);
        for (var i = 0; i < args.length; i++) {
            d.set("v" + (i + 1), args[i]);
        }
    }

    // Bang outlet to notify downstream
    outlet(0, "bang");
}
