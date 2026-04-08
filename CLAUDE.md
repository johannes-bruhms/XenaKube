# CLAUDE.md

## Self-Maintenance

This file must stay accurate as the project evolves. **Update it in the same commit** when you:
- Add, remove, or rename files in `src/`, `sc/`, or root
- Change OSC addresses or ports
- Add/change npm scripts or dependencies
- Add new performance modes or change architecture
- Implement visuals or other "not yet implemented" features (remove the stub)

**How to update**: edit only the affected section. Keep the same terse style. Don't expand descriptions. If a section becomes stale, fix or remove it — don't add disclaimers.

## Project Overview

**XenaKube** — real-time instrument: GAN i4 smart Rubik's cube → sound synthesis + visuals via Iannis Xenakis' *Nomos Alpha* (24 cube rotation symmetries of S4 group).

Primary source: `docs/xenakis_nomos_alpha_primary_source.md` (*Formalized Music* pp. 214–237).

## Architecture

All composition math in TypeScript (`src/`). SuperCollider = sound only. TouchDesigner/browser = visuals only.

```
GAN i4 (BLE) → Chrome Web Bluetooth → relay.js (Node)
                                          │
                                    XenaKubeEngine (TS)
                                     │        │       │
                                 OSC:57120  OSC:8000  WS
                                 SuperCollider  TD   Browser
```

**relay.js** — BLE-to-OSC bridge. Serves Web Bluetooth UI on `:3000` with MAC address input and `customMacAddressProvider` for macOS BLE. Receives cube events via WS, instantiates engine (`onTurn()`/`onGyro()`), sends `/xk/*` OSC to SuperCollider (port 57120), forwards raw `/gan/*` to TD (port 8000). Run: `npx tsx relay.js`. Deps: `node-osc`, `ws`, `tsx`.

**relay-tested.js** — known-good standalone BLE relay (no engine, OSC to port 8000 only). Reference copy — do not modify.

### src/ — TypeScript Engine

Two independent S4 cubes running simultaneously: K_i (parameters from D×G×U) and C_i (sound complexes).

| Module | Role |
|--------|------|
| `group.ts` | S4 group: 24 elements as vertex permutations, Cayley table, generators, tetrahedral orbits |
| `vertices.ts` | K1-K8 vertices with Xenakis V1/V2 values (D×G×U), permutation |
| `complexes.ts` | C1-C8 complex types, α/β/γ cyclic mappings (rotate every 3 subs), second cube state |
| `kinematic.ts` | Graph paths through S4: pre-composed diagrams + free traversal |
| `sieve.ts` | L(m,n) logical function, prime residual classes mod 18, metabola mutations |
| `quaternion.ts` | Gyro → nearest S4 snap, deviation factor for V2 expression |
| `osc-output.ts` | Engine state → OSC message batches |
| `engine.ts` | Orchestrator: turn/gyro events → both cubes → full state |
| `types.ts` | Shared type definitions |
| `index.ts` | Public API: re-exports all modules |

**Legacy files** (root): `symmetry_engine.js`, `layer_manager.js` — original Max prototypes, superseded by TS engine.
**Legacy directories**: `max/`, `maxmsp-mcp/` — original Max/MSP synthesis layer + MCP tooling, superseded by `sc/xenakube.scd`.

## Commands

```bash
npx tsx relay.js      # run full relay (BLE → engine → OSC)
npm test              # vitest
npm run test:watch    # vitest watch
npm run dev           # engine standalone (tsx)
npm run build         # tsc → dist/
npx tsc --noEmit      # type-check only
```

## Performance Modes

- **K_i direct**: physical face turn = S4 transformation (performer IS the kinematic diagram)
- **K_i diagram**: pre-composed path; cube turns advance position
- **C_i algorithmic**: second cube follows own S4 diagram, advances with each K_i transformation
- **C_i gyro**: gyro quaternion snapped to nearest S4 element drives second cube
- **V1**: D strong, G strong, U weak (2-5s durations, mf-fff)
- **V2**: D strong, G average, U strong (10-30s durations, p-f)

## Key Math

- **S4**: 24 rotations generated from X90, Y90, Z90. Cayley table computed at load.
- **α/β/γ cycle**: C_i mapping rotates every 3 substitutions
- **Sieve L(m,n)**: pitch sets from prime residual classes mod 18; metabola every 3 subs
- **Tetrahedral orbits**: 12 even (preserve tetrahedra) + 12 odd (swap)

## SuperCollider

All composition math stays in TS engine; SC only receives OSC and synthesizes sound. Single file: `sc/xenakube.scd`.

Boot: open in SC IDE, evaluate the whole buffer. Listens on SC's default lang port (57120).

### sc/ Directory

| File | Role |
|------|------|
| `xenakube.scd` | Full synthesis engine: OSCdef receivers, SynthDefs (grain/gliss/atom), 8-voice manager |

### C1-C8 Synthesis Mapping

| Complex | Synthesis |
|---------|-----------|
| C1 | Stochastic grain cloud (random pitch from sieve, random timing) |
| C2 | Grain cloud with asc/desc pitch envelope |
| C3 | Grain cloud, roughly constant pitch |
| C4 | Sustained interference tone + triggered pizz |
| C5 | Random glissandi between sieve pitches |
| C6 | Glissandi with directional envelope |
| C7 | Sustained sliding tones, roughly level |
| C8 | Two oscillators at near-unison (beating) |

### OSC → Synthesis Parameter Mapping

- **Sieve → pitch**: semitone offsets, 0 = C2 (MIDI 36), use `.midicps`
- **Intensity → amp**: p=0.15, mp=0.3, mf=0.5, f=0.7, ff=0.85, fff=1.0
- **Density → event rate**: 0.5–3.0 events/sec → Routine wait intervals
- **Duration → voice envelope**: time before next transformation
- **Gyro deviation → expression/vibrato depth** (especially V2)
- **Tetrahedral orbit → timbral palette** (even=preserve, odd=swap)

## OSC Reference

All `/xk/*` messages go to SC on port 57120. All `/gan/*` messages go to TD on port 8000. Full state burst sent on every cube turn. Gyro updates fire at ~60Hz with updated quaternion (and C_i state in gyro mode).

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
| `/gan/turn` | string | move (e.g. "R", "U'", "F2") — port 8000 to TD |
| `/gan/gyro` | float×4 | quaternion — port 8000 to TD |

## Visuals Status

**Not yet implemented.** TD receives raw `/gan/*` on port 8000 (relay sends this). No `.toe` project or browser viz exists yet. Browser viz would need a second WS endpoint on relay.js.
