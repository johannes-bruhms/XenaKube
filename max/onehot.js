// onehot7.js
// Input: int 1-7
// Output: seven outlets, one-hot encoded state
//
// Example:
// input 5 -> outlets output:
// outlet 1: 0
// outlet 2: 0
// outlet 3: 0
// outlet 4: 0
// outlet 5: 1
// outlet 6: 0
// outlet 7: 0

autowatch = 1;

inlets = 1;
outlets = 7;

var current = 0;

setinletassist(0, "int 1-7");

for (var i = 0; i < 7; i++) {
    setoutletassist(i, "1 if input equals " + (i + 1) + ", else 0");
}

function msg_int(v) {
    outputOneHot(v);
}

function msg_float(v) {
    outputOneHot(Math.floor(v));
}

function bang() {
    outputOneHot(current);
}

function outputOneHot(v) {
    v = parseInt(v, 10);

    if (isNaN(v) || v < 1 || v > 7) {
        current = 0;
        outputAllOff();
        post("onehot7.js: all off");
        return;
    }

    current = v;

    // Output right-to-left for safer Max execution order.
    // outlet index 0 = leftmost outlet.
    for (var i = 6; i >= 0; i--) {
        outlet(i, i === v - 1 ? 1 : 0);
    }
}

function outputAllOff() {
    for (var i = 6; i >= 0; i--) {
        outlet(i, 0);
    }
}

function clear() {
    current = 0;
    outputAllOff();
}