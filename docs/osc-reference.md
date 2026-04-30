# OSC Reference

Authoritative table of every `/xk/*`, `/gan/*`, and `/xk/midi/*` address.

`/xk/*` → Max (57121). `/gan/*` → TD (8000). `/xk/midi/*` ← Max → relay (57122, reverse direction — Max bridge echoes every SWAM noteon/noteoff to the dashboard's rolling score). Multi-message state burst on every cube turn and at BLE gyro rate (~10 Hz). `/xk/gyro`, `/gan/gyro`, `/xk/expr/*` at 60 Hz from the relay's Kalman loop. `/xk/voice` fires only on real voice transitions (from `engine.onVoice`, not per gyro packet). `/xk/algorithm` on cube-algorithm detection. Full `XenaKubeState` JSON broadcasts to all WS clients on every state change.

`/xk/voice`'s `vertexIdx` is the cube vertex (1–8); `/xk/midi/{noteon,noteoff}`'s `voice` is the SWAM polyphony slot (always 1 in single-instance mode). Different concepts.

**Source of truth**: address strings live in `src/osc-schema.ts`. Never add new `/xk/*` literals outside that file. The schema is codegen'd into `max/gen_includes.js`; regenerate with `npm run gen:max` after any schema change.

| Address | Args | Meaning |
|---------|------|---------|
| `/xk/group/k` | int (0-23) | K_i S4 element |
| `/xk/group/c` | int (0-23) | C_i S4 element |
| `/xk/vertex/[1-8]` | float, string, float | density, intensity, duration |
| `/xk/complex/[1-8]` | int (1-8) | ComplexType enum |
| `/xk/path` | string | "V1" or "V2" |
| `/xk/cycle` | string | "alpha"/"beta"/"gamma" |
| `/xk/tetra` | int | orbit (0=even, 1=odd) |
| `/xk/sieve` | int... | pitch semitone offsets (variable length) |
| `/xk/gyro` | float×4 | x y z w quaternion |
| `/xk/perm` | int×8 | current vertex permutation |
| `/xk/step` | int | transformation count |
| `/xk/active` | int (0-7) | active vertex index |
| `/xk/snap/element` | int (0-23) | S4 element gyro snaps to |
| `/xk/snap/quat` | float×4 | quaternion of snap target |
| `/xk/snap/dev` | float (0-1) | gyro deviation; 0=locked, 1=boundary |
| `/xk/scramble` | float (0-1) | scramble factor; 0=solved, 1=max |
| `/xk/solve` | — | fires once on unsolved → solved edge (GAN FACELETS report) |
| `/xk/rate` | float | turn rate (turns/sec) |
| `/xk/regime` | string | 'contemplative' / 'conversational' / 'burst' |
| `/xk/expr/{tilt,spin,dev,scramble}` | float (0-1) | 60 Hz continuous controls |
| `/xk/algorithm` | string | cube-algorithm name on detection (e.g. "sexy-move", "sune", "t-perm") |
| `/xk/face` | string | face identity ('L'/'L\''/'R'/'R\''/'F'/'F\''/'B'/'B\''/'U'/'U\''/'D'/'D\''); fires BEFORE `/xk/voice` for the 12 face-moves; non-face moves (half-turns, diagram advance) skip it |
| `/xk/voice` | int, int, float, string, float | vertexIdx, complexType, density, intensity, duration |
| `/xk/panic` | — | relay WS-disconnect; bridges flush notes + CCs |
| `/xk/midi/noteon` | int, int, int, int | Max → relay (57122). voice (SWAM slot, always 1), pitch (0-127), velocity (1-127), complex (0=unknown / 1..8 = Cn). Mirrors every `noteOn` in `xk_swam.js`; keyswitches excluded. The 4th arg feeds the dashboard piano-roll's complex colour + gliss-curve rules. |
| `/xk/midi/noteoff` | int, int, int, int | Max → relay (57122). Mirrors every `noteOff`. `complex` is `inst.activeComplex` at noteoff time. |
| `/xk/midi/panic` | — | Max → relay (57122). Emitted from `bang()` so the dashboard clears its in-flight notes map on reset. |
| `/gan/turn` | string | raw move (e.g. "R", "U'", "F2") — port 8000 |
| `/gan/gyro` | float×4 | raw quaternion — port 8000 |
