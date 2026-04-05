inlets = 1;
outlets = 3;

var cayley = new Dict("cayley24");      // load 24x24 table once at loadbang
var ghosts = [new Dict("ghost1"), new Dict("ghost2"), new Dict("ghost3"), new Dict("ghost4")];
var tetra = 0;
var currentSym = 0;   // identity = 0

function loadbang() {
    cayley.import_json("cube_cayley.json");  // your 24x24 table file
    post("Xenakis Cube engine ready — 24 symmetries loaded\n");
}

function turn(gen) {                     // gen = 0..11 for the 12 generators (6 faces × 2 directions)
    currentSym = cayley.get(currentSym + "::" + gen);   // Cayley multiplication
    tetra = (tetra + (currentSym % 4)) % 4;            // simple tetrahedral orbit tracker
    
    // re-order corner parameters across ghost dicts
    for (let i = 0; i < 4; i++) {
        var next = (i + 1) % 4;
        ghosts[i].set("corner0", ghosts[next].get("corner0"));
        // … repeat for all 8 corners or however many params you expose
    }
    
    outlet(0, "bang");           // new discrete event
    outlet(1, currentSym);       // for debugging / visual feedback
    outlet(2, tetra);            // current tetrahedron index
}