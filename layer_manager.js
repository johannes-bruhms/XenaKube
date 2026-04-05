inlets = 1;
outlets = 3;

var MAX_LAYERS = 6;
var layers = [];                    // active layer dicts
var locked = [];                    // frozen {quat: [x,y,z,w], params: dict}
var activeIdx = 0;
var currentQuat = [0,0,0,1];       // identity
var masterParams = new Dict("master_superposition"); // 8 corners

// Precompute 24 rotation matrices for V1 nearest-snap (identity + 23 others)
var rotMatrices = []; // populate in loadbang from JSON or hardcode Cayley-derived quats → matrices

function loadbang() {
    for (let i = 0; i < MAX_LAYERS; i++) {
        layers[i] = new Dict("layer" + i);
        // init 8 corner params (your freq/amp/etc defaults)
        for (let c = 0; c < 8; c++) layers[i].set("corner" + c, {freq: 220 + c*50, amp: 0.8, ...});
    }
    post("Xenakis Cube — Layered Gyro Mode ready (" + MAX_LAYERS + " layers)\n");
}

function list(x,y,z,w) {  // OSC /cube/gyro → quat
    currentQuat = [x,y,z,w];
    if (activeIdx >= MAX_LAYERS) return;
    
    // V1: snap to nearest symmetry (dot-product on matrices)
    // V2: direct continuous interp (your deviation dials)
    var symIdx = (v1Mode) ? nearestSymmetry(currentQuat) : -1; // -1 = continuous
    reOrderActiveLayer(symIdx);
    
    updateMasterSuperposition();
    outlet(2, activeIdx, locked.length); // visual feedback
}

function bang() {  // /cube/lock
    if (activeIdx >= MAX_LAYERS) return;
    
    // commit active layer
    locked.push({
        quat: currentQuat.slice(),
        params: layers[activeIdx].clone()  // snapshot
    });
    
    // reset next layer to identity
    activeIdx++;
    if (activeIdx < MAX_LAYERS) {
        currentQuat = [0,0,0,1];
        reOrderActiveLayer(-1); // identity
    }
    
    updateMasterSuperposition();
    outlet(0, "bang");           // new discrete event
    outlet(1, "params");         // dump master 8-corner list
}

function reOrderActiveLayer(symIdx) {
    // your existing ghost-style corner permutation logic, now on layers[activeIdx]
    // if symIdx >=0 → Cayley lookup; else continuous quat-based lerp
}

function updateMasterSuperposition() {
    // clear + sum ALL locked + active layer's current corner params (additive)
    masterParams.clear();
    for (let l of locked) addLayerToMaster(l);
    if (activeIdx < MAX_LAYERS) addLayerToMaster({quat: currentQuat, params: layers[activeIdx]});
    // masterParams now holds summed values for 8 voices
}

function addLayerToMaster(layerObj) {
    // apply layerObj.quat rotation to its params → add to master
    // (matrix multiply or quaternion rotate on corner indices)
}