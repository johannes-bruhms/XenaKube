# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**XenaKube** is a real-time musical instrument that turns a GAN i4 smart Rubik's cube into a live performance tool based on Iannis Xenakis' *Nomos Alpha* composition method (24 cube rotation symmetries). Physical cube rotations drive sound synthesis and visuals.

The primary source for the composition method is in `docs/xenakis_nomos_alpha_primary_source.md` (extracted from *Formalized Music* pp. 214–237).

## Architecture

All composition math lives in a TypeScript engine (`src/`). Max/MSP is only for sound. TouchDesigner (or browser) is only for visuals.

```
GAN i4 (BLE) → Chrome (Web Bluetooth) → relay.js (Node.js)
                                              │
                                        XenaKubeEngine (TypeScript)
                                              │
                                    ┌─────────┼──────────┐
                                  OSC       OSC      WebSocket
                                    │         │          │
                                 Max/MSP     TD    Browser Debug Viz
                                 (sound)  (visuals)  (Three.js)
```

### relay.js — BLE-to-OSC Bridge
- Serves Chrome Web Bluetooth UI on `http://localhost:3000`
- Receives cube events (moves + gyro) via WebSocket from browser
- Instantiates `XenaKubeEngine`, calls `onTurn()` / `onGyro()` on each event
- Sends `/xk/*` OSC (engine state) to port 9000 (Max/MSP)
- Forwards raw `/gan/*` OSC to port 8000 (TouchDesigner)
- Dependencies: `node-osc`, `ws`, `tsx`; browser uses `gan-web-bluetooth` from CDN

### src/ — TypeScript Math Engine
All Xenakis composition logic. Implements two independent cubes (K_i parameters + C_i sound complexes) operating simultaneously per the primary source.

| Module | Purpose |
|--------|---------|
| `group.ts` | S4 hexahedral group: 24 elements as vertex permutations, Cayley table, generators, tetrahedral orbit classification |
| `vertices.ts` | K1-K8 vertex definitions with exact Xenakis V1/V2 numeric values (D×G×U), permutation |
| `complexes.ts` | C1-C8 sound complex types, α/β/γ cyclic mappings (rotate every 3 substitutions), second cube state |
| `kinematic.ts` | Graph paths through S4: pre-composed diagrams + free traversal mode |
| `sieve.ts` | L(m,n) logical function, prime residual classes mod 18, metabola mutations |
| `quaternion.ts` | Gyro quaternion → nearest S4 element snap, deviation factor for V2 expression |
| `osc-output.ts` | Converts engine state to OSC message batches |
| `engine.ts` | Orchestrator: receives turn/gyro events, runs both cubes, emits full state |
| `types.ts` | Shared type definitions |
| `index.ts` | Barrel export |

### Legacy Max [js] files (root directory)
`symmetry_engine.js` and `layer_manager.js` are the original Max/MSP prototypes, now superseded by the TypeScript engine. Kept for reference.

## Commands

```bash
npm test              # run tests (vitest)
npm run test:watch    # run tests in watch mode
npm run dev           # run engine standalone (tsx)
npm run build         # compile TypeScript to dist/
npx tsc --noEmit      # type-check without emitting
```

## Performance Modes

- **K_i cube — direct**: each physical face turn = one S4 transformation (performer IS the kinematic diagram)
- **K_i cube — diagram**: pre-composed kinematic diagrams; cube turns advance position in the path
- **C_i cube — algorithmic**: second cube follows its own S4 diagram, advancing with each K_i transformation
- **C_i cube — gyro**: continuous gyro quaternion snapped to nearest S4 element drives the second cube
- **V1 path**: D strong, G strong, U weak (short durations 2-5s, mf-fff)
- **V2 path**: D strong, G average, U strong (long durations 10-30s, p-f)

## Key Mathematical Structures

- **S4 group**: 24 rotation symmetries of the cube, generated from 3 axis rotations (X90, Y90, Z90). Cayley table computed at module load.
- **Two independent cubes**: K_i (parameters from D×G×U) and C_i (sound complexes) — each with its own S4 group state
- **α/β/γ cycle**: C_i assignment mapping rotates every 3 substitutions
- **Sieve L(m,n)**: pitch set generator using prime residual classes mod 18; advances via metabola every 3 substitutions
- **Tetrahedral orbits**: 24 elements split into 12 even (preserve tetrahedra) + 12 odd (swap)

## Max/MSP Guidelines

- **NEVER generate `.maxpat` files.** Max patchers are JSON but brittle and unreadable — always provide a **patch outline** (text description of object connections) instead.
- Maximize use of `[js]` objects with JavaScript files for all logic. Keep Max patchers as thin signal-routing shells.
- All composition math stays in the TypeScript engine; Max [js] files only receive OSC and write to dicts/buffers.

### max/ Directory

| File | Purpose |
|------|---------|
| `xenakube_receive.js` | Max [js] — receives `/xk/*` OSC, writes to 6 named dicts (`xk_vertices`, `xk_complexes`, `xk_state`, `xk_sieve`, `xk_gyro`, `xk_perm`), bangs outlet on update |

### Sound Generation — Approach 1: poly~ with 8 voice abstractions

Each of the 8 Xenakis complex types maps to a synthesis behavior inside `[poly~ xk_voice 8]`. Voices read parameters from Max dicts (populated by `xenakube_receive.js`).

| Complex | Type | Synthesis method |
|---------|------|------------------|
| C1 | Ataxic cloud of sound-points | Stochastic grain cloud: random pitch from sieve, random timing within density window |
| C2 | Ordered cloud asc/desc | Grain cloud with ascending or descending pitch envelope from sieve subset |
| C3 | Ordered cloud flat | Grain cloud with roughly constant pitch, spread across sieve |
| C4 | Ionized atom (interferences + pizz) | Sustained interference tone + triggered pizz (pluck synthesis or sample) |
| C5 | Ataxic sliding | Random glissandi between sieve pitches, stochastic rate |
| C6 | Ordered sliding asc/desc | Glissandi with directional envelope |
| C7 | Ordered sliding flat | Sustained sliding tones, roughly level |
| C8 | Atom (quasi-unison) | Two oscillators at near-unison for beating/interference |

**Parameter mapping from OSC → synthesis:**
- **Sieve → pitch**: semitone offsets from reference. For cello range: semitone 0 = C2 (65.4 Hz). Use `[mtof]`.
- **Intensity → amplitude**: `p=0.15, mp=0.3, mf=0.5, f=0.7, ff=0.85, fff=1.0`
- **Density → event rate**: values (0.5–3.0 events/sec) become metro intervals or grain density
- **Duration → voice envelope**: how long the parameter set stays active before the next transformation
- **Gyro deviation factor**: distance from nearest S4 snap → expression/vibrato depth (especially V2)
- **Tetrahedral orbit**: can switch between timbral palettes (even=preserve, odd=swap)

**Max [js] files to create (per voice engine):**
- `xk_grains.js` — grain scheduler for C1-C3 (reads density, sieve, intensity from dicts)
- `xk_gliss.js` — glissandi engine for C5-C7 (drives `[line~]` between sieve pitches)
- `xk_atoms.js` — interference/atom engine for C4, C8 (near-unison oscillators, pizz triggers)
- `xk_voice.js` — orchestrator inside `[poly~]`: reads complex type, delegates to the right engine

### Max Patch Outline (do NOT create .maxpat — build manually)

```
Top-level patcher:
  [udpreceive 9000]
    → [js xenakube_receive.js]     // writes to dicts, bangs on update
      → [poly~ xk_voice 8]        // 8 voices, each reads its own dict slice
        → [dac~ 1 2]

Inside xk_voice (poly~ abstraction):
  [thispoly~] → voice index
  [js xk_voice.js #1]             // #1 = voice index, reads dicts, outputs control
    → [selector~ 3]               // switch between grain/gliss/atom signal chains
      inlet 1: [js xk_grains.js] → [poly~ grain_engine 16] → grain output
      inlet 2: [js xk_gliss.js]  → [line~] / [curve~] → gliss output
      inlet 3: [js xk_atoms.js]  → [cycle~] + [cycle~] → interference output
    → [*~ gain]                   // intensity-mapped gain
    → [out~ 1] [out~ 2]
```

## OSC Data Reference

### What Max receives on port 9000 (per transformation burst)

On every physical cube turn, Max receives the full state as a burst of OSC messages. On gyro updates (~60Hz when cube moves), the same burst fires with updated quaternion and (in gyro mode) updated C_i state.

| Address | Args | Musical meaning |
|---------|------|-----------------|
| `/xk/group/k` | `int` (0-23) | K_i cube S4 element index |
| `/xk/group/c` | `int` (0-23) | C_i cube S4 element index |
| `/xk/vertex/[1-8]` | `float, string, float` | density (events/sec), intensity (p–fff), duration (sec) |
| `/xk/complex/[1-8]` | `int` (1-8) | ComplexType enum: which synthesis behavior this voice uses |
| `/xk/path` | `string` | `"V1"` (short/loud) or `"V2"` (long/soft) |
| `/xk/cycle` | `string` | `"alpha"`, `"beta"`, or `"gamma"` — rotates every 3 substitutions |
| `/xk/tetra` | `int` | tetrahedral orbit (0=even, 1=odd) |
| `/xk/sieve` | `int...` | pitch semitone offsets (variable length), changes every 3 subs via metabola |
| `/xk/gyro` | `float float float float` | x y z w quaternion passthrough |
| `/xk/perm` | `int int int int int int int int` | current 8-vertex permutation |
| `/xk/step` | `int` | transformation count since start |

### What TouchDesigner receives on port 8000 (raw relay)

| Address | Args |
|---------|------|
| `/gan/turn` | move string (e.g. `"R"`, `"U'"`, `"F2"`) |
| `/gan/gyro` | `x y z w` quaternion floats |

## Visuals Status

**Not yet implemented.** The architecture supports two visual paths:
- **TouchDesigner**: receives raw `/gan/*` OSC on port 8000 (relay already sends this). No `.toe` project exists yet.
- **Browser debug viz (Three.js)**: no WebSocket broadcast channel or visualization code exists yet. Would need a second WS endpoint on relay.js for viz clients.

| Address | Payload |
|---------|---------|
| `/xk/group/k` | K_i cube S4 element index |
| `/xk/group/c` | C_i cube S4 element index |
| `/xk/vertex/[1-8]` | density, intensity, duration |
| `/xk/complex/[1-8]` | complex type assignment |
| `/xk/path` | V1 or V2 |
| `/xk/cycle` | alpha, beta, or gamma |
| `/xk/tetra` | tetrahedral orbit (0 or 1) |
| `/xk/sieve` | pitch semitone offsets (variable length) |
| `/xk/gyro` | x y z w quaternion passthrough |
| `/xk/perm` | current 8-vertex permutation |
| `/xk/step` | transformation count |
| `/gan/turn` | move string (relay raw output) |
| `/gan/gyro` | x y z w quaternion (relay raw output) |
