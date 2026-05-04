# XenaKube

A real-time musical instrument that transforms a GAN i4 smart Rubik's cube into a live performance tool. Cube turns produce sound; named Rubik's algorithms (sexy-move, sune, t-perm, …) trigger musical gestures. Built on S4 group math (24 rotation symmetries) inspired by Xenakis' *Nomos Alpha*.

## Overview

XenaKube is a performance system with four parts working together:

- A GAN i4 smart cube provides turn and gyro data.
- Chrome connects to the cube over Web Bluetooth and forwards events to `relay.js`.
- `XenaKubeEngine` maps those events into `S4` state, parameter permutations, sound-complex assignments, cube-algorithm detections, and expression values.
- Max/MSP + SWAM Cello turn the resulting voice events into playable phrases, while the browser dashboard visualizes the session in real time.

In practice, each turn is more than a note trigger. A turn can:

- permute the active `K_i` parameter bundle (density, intensity, duration)
- permute the active `C_i` sound complex (`C1`-`C8`)
- trigger a phrase shaped by face identity and current engine state
- contribute to a Rubik's algorithm match that changes higher-level musical behavior
- update the live GUI with cube state, sieve state, rolling-score output, and mode badges

The browser GUI is a full performance HUD: it shows the live cube, ghost/snap orientation, active vertices and complexes, cube-algorithm buffer, right-edge pitch sieve, and a rolling score fed by the actual MIDI echo coming back from the Max bridge.

For a screenshot of the live HUD, see `docs/presentation/webgui/current-gui.png`.

## How It Works

```
GAN i4 Cube (BLE) --> Chrome Web Bluetooth --> relay.js (Node)
                                                   |
                                             XenaKubeEngine (TS)
                                         ┌────────┼──────────┐
                                         │        │          │
                              CubeAlgorithmDetector VoiceEngine  Expression
                                         │        │          │
                                         ▼        ▼          ▼
                                   ModeManager  OSC:57121  WS
                                               Max/SWAM    Browser
```

A performer physically turns a Bluetooth-enabled Rubik's cube. Each turn is a musical event: the cube's S4 group state permutes which sound parameters apply to which voice. Rubik's algorithms (like the "sexy move" R U R' U') are detected from the move stream and trigger performance mode changes — palette switching, voice mode toggles, freezes.

### Two Cubes, One Performance

Following Xenakis' method, two S4 group cubes operate simultaneously:

- **K_i cube** -- maps 8 vertices to (Density × Intensity); Duration is neutral, since phrase time is owned by the 12 face-moves per Temporal Identity. Intensity covers the full ppp..fff palette, one unique dynamic per vertex; each turn permutes which level lands at which voice position.
- **C_i cube** -- maps 8 vertices to sound complex types (C1-C8). Transformations reassign which synthesis method each voice uses.

### Cube Algorithms

The algorithm book is the 6 **CFOP** fundamentals (Cross, F2L, OLL, PLL) plus Niklas (archetypal 3-cycle commutator). All are orientation-independent (each canonical algorithm × 24 whole-cube rotations), so the same finger pattern is recognized on any face pair.

| Algorithm | Moves | Role | Effect |
|-----------|-------|------|--------|
| sexy-move | R U R' U' | CFOP F2L trigger | (stub — detected, no mode change yet) |
| oll-cross | F R U R' U' F' | 2-look OLL edges | (stub) |
| sune | R U R' U R U2 R' | 2-look OLL corners | (stub) |
| anti-sune | R U2 R' U' R U' R' | 2-look OLL inverse corners | (stub) |
| niklas | R U' L' U R' U' L | Commutator (corner 3-cycle) | (stub) |
| u-perm | R U' R U R U R U' R' U' R2 | 2-look PLL edges | (stub) |
| t-perm | R U R' U' R' F R2 U' R' U' R U R' F' | 2-look PLL corners+edges | (stub) |

Detection still fires (the dashboard logs every match) but the effect handlers in `src/mode-manager.ts` are currently empty switch arms — algorithms are scaffolding for the phrase-library work tracked in `docs/todo.md` Phase B (algorithms-as-phrase-vocabulary). Algorithms layer: shorter algorithms fire immediately even if they're the prefix of a longer one in progress. **Half-turn convention**: GAN hardware reports only quarter-turns, so `U2`/`R2` are stored as two CCW quarter-turns; performers must flick half-turns CCW (speedcube default) or the algorithm won't trigger.

### Phrase Generation (Max/SWAM)

Each cube turn triggers a **musical phrase**, not a single MIDI note. Phrase shape depends on the active complex type (C1-C8): pizzicato clouds, legato runs, glissando slides, sustained swells, ponticello tremolos. Phrases humanize velocity/pitch/timing and auto-release based on the Xenakis `duration` parameter. See `docs/synthesis-bridge.md` for the per-complex mapping detail.

### Voice Modes

- **Sequential** -- one voice at a time, cycling through positions
- **Polyphonic** -- all 8 voices sounding simultaneously, each turn morphs the ensemble

### Expression

Continuous gyro-derived control values (all normalized 0-1):
- **Tilt** -- cube pitch angle
- **Spin** -- angular velocity
- **Deviation** -- distance from nearest S4 snap point
- **Scramble** -- BFS distance from solved state in S4

## Requirements

- [Node.js](https://nodejs.org/) (v18+)
- [Max/MSP 9](https://cycling74.com/) + [SWAM Cello 3](https://www.audiomodeling.com/)
- A GAN i4 smart cube (Bluetooth)
- Chrome (for Web Bluetooth API)

## Setup

```bash
npm install
```

## Running

**1. Start Max/MSP**

Open the SWAM Cello bridge patch in Max 9+ (see `max/` + `CLAUDE.md` → "Synthesis Bridge — Max/MSP + SWAM Cello").

**2. Start the relay**

```bash
npx tsx relay.js
```

**3. Connect the cube**

Open Chrome to `http://localhost:3000`, enter your cube's MAC address, and click Connect.

Turn the cube. Sound happens.

## Project Structure

```
src/              TypeScript engine (S4 group, cube algorithms, voice, expression, scramble)
max/              Max/MSP SWAM Cello bridge (xk_swam.js for v8 object)
public/           Browser dashboard (live visualizer + cube connect)
relay.js          BLE-to-OSC bridge with XenaKubeEngine
test/             Vitest test suite
docs/             Xenakis primary source, research notes, roadmap
```

## Tests

```bash
npm test
```

## References

- Xenakis, I. (1992). *Formalized Music: Thought and Mathematics in Composition*. Pendragon Press. Chapter IX: "Symbolic Music," pp. 214-237.
- Xenakis, I. (1965). *Nomos Alpha* for solo cello.
