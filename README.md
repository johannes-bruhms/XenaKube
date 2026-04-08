# XenaKube

A real-time musical instrument that transforms a GAN i4 smart Rubik's cube into a live performance tool, using the compositional method from Iannis Xenakis' *Nomos Alpha* (1965).

Each physical cube rotation maps to one of the 24 rotation symmetries of the S4 group, driving two independent mathematical cubes that control sound synthesis parameters and timbral assignments in real time.

## How It Works

```
GAN i4 Cube (BLE) --> Chrome Web Bluetooth --> relay.js (Node)
                                                   |
                                             XenaKubeEngine (TS)
                                              |        |       |
                                          OSC:57120  OSC:8000  WS
                                          SuperCollider  TD   Browser
```

A performer physically turns a Bluetooth-enabled Rubik's cube. The cube's moves and gyroscope data flow through a browser-based BLE bridge into a Node.js relay, which feeds a TypeScript composition engine. The engine computes the full musical state -- vertex parameters (density, intensity, duration), sound complex assignments (C1-C8), pitch sieves, and kinematic diagram positions -- then sends it all as OSC to SuperCollider for synthesis.

### Two Cubes, One Performance

Following Xenakis' method, two S4 group cubes operate simultaneously:

- **K_i cube** -- maps the 8 vertices to parameter triples (Density x Intensity x Duration). Each S4 transformation permutes which parameters apply to which voice.
- **C_i cube** -- maps the 8 vertices to sound complex types (C1-C8: grain clouds, glissandi, interference tones, etc.). Transformations reassign which synthesis method each voice uses.

### Pitch Sieves

Pitches are generated using Xenakis' logical function L(m,n), built from prime residual classes modulo 18. The sieve mutates every 3 cube transformations via *metabola* -- multiplying the moduli by residual class elements.

## Requirements

- [Node.js](https://nodejs.org/) (v18+)
- [SuperCollider](https://supercollider.github.io/)
- A GAN i4 smart cube (Bluetooth)
- Chrome (for Web Bluetooth API)
- macOS (BLE connection uses `customMacAddressProvider`)

## Setup

```bash
npm install
```

## Running

**1. Start SuperCollider**

Open `sc/xenakube.scd` in the SuperCollider IDE and evaluate the entire buffer (Cmd+Shift+Enter). You should see:

```
XenaKube SC Engine ready on port 57120
```

**2. Start the relay**

```bash
npx tsx relay.js
```

**3. Connect the cube**

Open Chrome to `http://localhost:3000`, enter your cube's MAC address, and click Connect.

Turn the cube. Sound happens.

## Synthesis

SuperCollider runs 8 voices, one per vertex. Each voice is assigned a complex type that determines its synthesis behavior:

| Complex | Sound |
|---------|-------|
| C1 | Stochastic grain cloud -- random pitch from sieve, random timing |
| C2 | Grain cloud with ascending/descending pitch envelope |
| C3 | Grain cloud, roughly constant pitch |
| C4 | Sustained interference tone + triggered pizzicato |
| C5 | Random glissandi between sieve pitches |
| C6 | Glissandi with directional envelope |
| C7 | Sustained sliding tones |
| C8 | Two oscillators at near-unison (beating) |

## Performance Modes

The engine supports several modes for how the two cubes are driven:

- **K_i direct** -- each physical turn = one S4 transformation (the performer *is* the kinematic diagram)
- **K_i diagram** -- pre-composed path through S4; cube turns advance position
- **C_i algorithmic** -- second cube follows its own S4 diagram, advancing with each K_i transformation
- **C_i gyro** -- gyroscope quaternion snapped to nearest S4 element drives the second cube
- **V1 path** -- short durations (2-5s), loud dynamics (mf-fff)
- **V2 path** -- long durations (10-30s), soft dynamics (p-f)

## Project Structure

```
src/              TypeScript composition engine (S4 group, sieves, kinematic diagrams)
sc/               SuperCollider synthesis (xenakube.scd)
relay.js          BLE-to-OSC bridge with XenaKubeEngine
relay-tested.js   Known-good standalone BLE relay (reference)
test/             Vitest test suite
docs/             Xenakis primary source extraction
max/              Legacy Max/MSP synthesis (superseded by SC)
```

## Tests

```bash
npm test
```

## References

- Xenakis, I. (1992). *Formalized Music: Thought and Mathematics in Composition*. Pendragon Press. Chapter IX: "Symbolic Music," pp. 214-237.
- Xenakis, I. (1965). *Nomos Alpha* for solo cello.
