# XenaKube

A real-time musical instrument that transforms a GAN i4 smart Rubik's cube into a live performance tool. Cube turns produce sound; Rubik's algorithms are "spells" that trigger mode changes. Built on S4 group math (24 rotation symmetries) inspired by Xenakis' *Nomos Alpha*.

## How It Works

```
GAN i4 Cube (BLE) --> Chrome Web Bluetooth --> relay.js (Node)
                                                   |
                                             XenaKubeEngine (TS)
                                         ┌────────┼──────────┐
                                         │        │          │
                                   SpellDetector  VoiceEngine  Expression
                                         │        │          │
                                         ▼        ▼          ▼
                                   ModeManager  OSC:57120  OSC:57121  WS
                                               SuperCollider  Max/SWAM  Browser
```

A performer physically turns a Bluetooth-enabled Rubik's cube. Each turn is a musical event: the cube's S4 group state permutes which sound parameters apply to which voice. Rubik's algorithms (like the "sexy move" R U R' U') are detected from the move stream and trigger performance mode changes — palette switching, voice mode toggles, freezes.

### Two Cubes, One Performance

Following Xenakis' method, two S4 group cubes operate simultaneously:

- **K_i cube** -- maps 8 vertices to parameter triples (Density × Intensity × Duration). Each turn permutes which parameters apply to which voice.
- **C_i cube** -- maps 8 vertices to sound complex types (C1-C8). Transformations reassign which synthesis method each voice uses.

### Spell System

The spell book is the 7 fundamentals of the **CFOP** solving method (Cross, F2L, OLL, PLL). All are orientation-independent (each canonical algorithm × 24 whole-cube rotations), so the same finger pattern is recognized on any face pair.

| Spell | Algorithm | CFOP role | Effect |
|-------|-----------|-----------|--------|
| sexy-move | R U R' U' | F2L trigger | Toggle sequential/polyphonic; SWAM bow sweep |
| sledgehammer | R' F R F' | F2L trigger | Toggle freeze (sustain + ignore turns) |
| oll-cross | F R U R' U' F' | 2-look OLL edges | Variant → drone; SWAM harmonic ping |
| sune | R U R' U R U2 R' | 2-look OLL corners | Palette → V2 (dark / sul tasto) |
| anti-sune | R U2 R' U' R U' R' | 2-look OLL inverse corners | Palette → V1 (bright) |
| u-perm | R U' R U R U R U' R' U' R2 | 2-look PLL edges | Variant → burst; SWAM staccato burst |
| t-perm | R U R' U' R' F R2 U' R' U' R U R' F' | 2-look PLL corners+edges | Reset palette + variant |

Spells layer — short algorithms fire immediately even if they're the prefix of a longer one in progress.

### Phrase Generation (Max/SWAM)

Each cube turn triggers a **musical phrase**, not a single MIDI note. Phrase shape depends on the active complex type (C1-C8): pizzicato clouds, legato runs, glissando slides, sustained swells, ponticello tremolos. Phrases humanize velocity/pitch/timing and auto-release based on the Xenakis `duration` parameter. See `CLAUDE.md` "Per-Turn Phrase Generation" for detail.

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
- [SuperCollider](https://supercollider.github.io/) and/or [Max/MSP 9](https://cycling74.com/) + [SWAM Cello 3](https://www.audiomodeling.com/)
- A GAN i4 smart cube (Bluetooth)
- Chrome (for Web Bluetooth API)

## Setup

```bash
npm install
```

## Running

**1. Start SuperCollider**

Open `sc/xenakube.scd` in the SuperCollider IDE and evaluate the entire buffer (Cmd+Shift+Enter).

**2. Start the relay**

```bash
npx tsx relay.js
```

**3. Connect the cube**

Open Chrome to `http://localhost:3000`, enter your cube's MAC address, and click Connect.

Turn the cube. Sound happens.

## Project Structure

```
src/              TypeScript engine (S4 group, spells, voice, expression, scramble)
sc/               SuperCollider synthesis (xenakube.scd)
max/              Max/MSP SWAM Cello bridge (xk_swam.js for v8 object)
public/           Browser dashboard (live visualizer + cube connect)
relay.js          BLE-to-OSC bridge with XenaKubeEngine
test/             Vitest test suite (67 tests)
docs/             Xenakis primary source, research notes, roadmap
```

## Tests

```bash
npm test
```

## References

- Xenakis, I. (1992). *Formalized Music: Thought and Mathematics in Composition*. Pendragon Press. Chapter IX: "Symbolic Music," pp. 214-237.
- Xenakis, I. (1965). *Nomos Alpha* for solo cello.
