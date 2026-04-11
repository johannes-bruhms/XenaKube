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
                                 OSC:57120  OSC:8000  WS (broadcast)
                                 SuperCollider  TD   Browser Dashboard
```

**relay.js** — BLE-to-OSC bridge. Serves single-page dashboard+connect UI on `:3000` (from `public/dashboard.html`). MAC address input with `customMacAddressProvider` for macOS BLE. Receives cube events via WS, instantiates engine (`onTurn()`/`onGyro()`), sends `/xk/*` OSC to SuperCollider (port 57120), forwards raw `/gan/*` to TD (port 8000). Broadcasts full engine state as JSON over WS to all clients. Handles control messages from dashboard: `set_diagram`, `clear_diagram`, `set_mode`, `reset`, `get_diagrams`. Auto-shutdown 5s after last client disconnects. Run: `npx tsx relay.js`. Deps: `node-osc`, `ws`, `tsx`.

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

### public/ — Browser Dashboard

| File | Role |
|------|------|
| `dashboard.html` | Single-page connect + live visualizer. 3D cube (Three.js + OrbitControls) with active vertex glow, K_i/C_i state, vertex params (active highlighted, inactive dimmed), complex assignments, sequence control panel (diagram selector, path/mode switches, reset), vertex sequence bar, sieve strip, move log, gyro quaternion. Zero Gyro calibration button. Mouse orbit for camera. Connects via WS, sends control messages (diagram/mode/reset), receives `state`/`gyro_state`/`diagrams` JSON broadcasts from relay. |

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

Boot: open in SC IDE, `Cmd+B` (boot server), select all `Cmd+A`, evaluate `Cmd+Enter`. Listens on SC's default lang port (57120). `Cmd+.` = stop all sound.

### Signal Chain

Sequential single-voice model (faithful to Xenakis). One active vertex at a time — `/xk/voice` triggers voice changes. Active voice → stereo pan (by vertex position) → reverb send bus → `FreeVerb2` → `Limiter` (0.85) on master bus.

### sc/ Directory

| File | Role |
|------|------|
| `xenakube.scd` | Synthesis engine: 6 SynthDefs, reverb, limiter, OSCdef receivers, single-voice sequential manager |

### SynthDefs

| Name | Used by | Source |
|------|---------|--------|
| `\xk_pizz` | C1 | Noise burst → `Ringz` harmonics + `Pluck` (pizzicato/col legno) |
| `\xk_bowed` | C2, C3 | `LFSaw` + `BrownNoise` bow + `BPeakEQ` body (arco string) |
| `\xk_harmonic` | C4 | Sine partials at 2×/3×/4× fundamental (flageolet) |
| `\xk_colLegno` | C4 (interrupts) | HP noise + `Ringz` click (woody strike) |
| `\xk_gliss` | C5, C6, C7 | `LFSaw` + FM + `PinkNoise` bow, lagged freq (sliding string) |
| `\xk_ponticello` | C8 | Two detuned `Pulse` + HPF + metallic BPF ring + tremolo (sul ponticello) |
| `\xk_reverb` | global | `FreeVerb2`, runs at tail |
| `\xk_master` | global | `Limiter` at 0.85, runs at tail |

### C1-C8 Synthesis Mapping

| Complex | Technique | Engine |
|---------|-----------|--------|
| C1 | Ataxic pizzicato scatter | Routine triggers `\xk_pizz` at irregular intervals |
| C2 | Bowed, ascending/descending | Routine creates short `\xk_bowed` notes sweeping through sieve |
| C3 | Bowed, sustained flat | Single `\xk_bowed` held on center pitch, dark (`bright: 0.35`) |
| C4 | Harmonics + col legno | Sustained `\xk_harmonic` + Routine triggers `\xk_colLegno` |
| C5 | Wild glissandi | `\xk_gliss` with Routine jumping to random sieve pitches |
| C6 | Ordered glissandi asc/desc | `\xk_gliss` with Routine stepping through sorted sieve |
| C7 | Sul tasto sustain | `\xk_gliss` with slow glide, dark (`bright: 0.3`) |
| C8 | Sul ponticello beating | `\xk_ponticello` with gyro-controlled detuning |

### OSC → Synthesis Parameter Mapping

- **Sieve → pitch**: semitone offsets, 0 = C2 (MIDI 36), use `.midicps`
- **Intensity → amp**: p=0.12, mp=0.22, mf=0.35, f=0.5, ff=0.65, fff=0.8
- **Density → event rate**: controls Routine wait intervals
- **Gyro deviation → C8 detuning** (beating speed) + **C5 brightness**
- **Tetrahedral orbit → reverb**: even = warm (room 0.55, damp 0.4), odd = dry (room 0.3, damp 0.7)
- **Voice panning**: 8 fixed positions spread L→R across stereo field

## OSC Reference

All `/xk/*` messages go to SC on port 57120. All `/gan/*` messages go to TD on port 8000. Full state burst sent on every cube turn. Gyro updates fire at ~60Hz with updated quaternion (and C_i state in gyro mode). Full `XenaKubeState` JSON broadcast to all WS clients on every state change (type `state` for turns, `gyro_state` for gyro).

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
| `/xk/voice` | int, int, float, string, float | vertexIdx, complexType, density, intensity, duration — primary SC driver |
| `/gan/turn` | string | move (e.g. "R", "U'", "F2") — port 8000 to TD |
| `/gan/gyro` | float×4 | quaternion — port 8000 to TD |

## Visuals Status

**Browser dashboard**: `http://localhost:3000` — single page: cube BLE connect + live engine state visualizer (3D cube with OrbitControls, gyro zero calibration, vertex params, complex assignments, sieve strip, move log). Served by relay.js, receives state via WS broadcast.

**TouchDesigner**: TD receives raw `/gan/*` on port 8000 (relay sends this). No `.toe` project exists yet.
