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

**XenaKube** — real-time instrument: GAN i4 smart Rubik's cube → sound synthesis + visuals. Cube turns are musical events; Rubik's algorithms are "spells" that trigger mode changes. Built on S4 group math (24 cube rotation symmetries) inspired by Xenakis' *Nomos Alpha*.

Primary source: `docs/xenakis_nomos_alpha_primary_source.md` (*Formalized Music* pp. 214–237).

## Architecture

All composition math in TypeScript (`src/`). SuperCollider = sound only. TouchDesigner/browser = visuals only.

```
GAN i4 (BLE) → Chrome Web Bluetooth → relay.js (Node)
                                          │
                                    XenaKubeEngine (TS)
                                    ┌─────┼──────────────┐
                                    │     │              │
                              SpellDetector  VoiceEngine  ExpressionProcessor
                              (algo detection) (seq/poly)  (gyro→control)
                                    │     │              │
                                    ▼     ▼              ▼
                              ModeManager  OSC:57120    OSC:8000  WS (broadcast)
                              (state machine) SuperCollider  TD   Browser Dashboard
```

**relay.js** — BLE-to-OSC bridge. Serves dashboard on `:3000` (from `public/dashboard.html`). Receives cube events via WS, upsamples gyro from BLE rate (~10Hz) to 60Hz via quaternion Kalman filter (velocity-aware prediction + measurement correction; smoothing slider 0-1 maps to Kalman gains). Instantiates engine (`onTurn()`/`onGyro()`), sends `/xk/*` OSC to SuperCollider (port 57120), forwards raw `/gan/*` to TD (port 8000). 60Hz loop sends gyro-only OSC (`/xk/gyro`, `/gan/gyro`); full state burst (25 messages) only fires at BLE rate on gyro updates and on turns. Broadcasts augmented engine state (includes scrambleFactor, voiceMode, performanceMode, spellBuffer, spellPartials) as JSON over WS. Sends `spell` events on algorithm detection, `spell_book` on client connect. Handles control messages: `set_diagram`, `clear_diagram`, `set_mode`, `reset`, `get_diagrams`, `set_gyro_smoothing`. Auto-shutdown 5s after last client disconnects. Run: `npx tsx relay.js`. Deps: `node-osc`, `ws`, `tsx`.

### src/ — TypeScript Engine

| Module | Role |
|--------|------|
| `engine.ts` | Orchestrator: turn/gyro → spell detection → cubes → voice output → state |
| `group.ts` | S4 group: 24 elements as vertex permutations, Cayley table, generators, tetrahedral orbits |
| `vertices.ts` | K1-K8 vertices with V1/V2 values (D×G×U), permutation |
| `complexes.ts` | C1-C8 complex types, α/β/γ cyclic mappings (rotate every 3 subs), second cube state |
| `spells.ts` | Spell book (12 canonical algorithms × 24 rotations = 264 variants) + rolling buffer pattern matcher. Orientation-independent: detects spells on any face pair via whole-cube-rotation expansion |
| `scramble.ts` | BFS distance from identity in S4 Cayley graph, normalized 0-1 |
| `voice-engine.ts` | Sequential (1 voice) vs polyphonic (8 voices) output decision |
| `expression.ts` | Gyro quaternion → continuous control values (tilt, spin, deviation, scramble) |
| `mode-manager.ts` | Performance state machine: voice mode, palette, variant, freeze |
| `kinematic.ts` | Graph paths through S4: pre-composed diagrams + free traversal |
| `sieve.ts` | L(m,n) logical function, prime residual classes mod 18, metabola mutations |
| `quaternion.ts` | Gyro → nearest S4 snap, deviation factor |
| `osc-output.ts` | Engine state → OSC message batches |
| `types.ts` | Shared type definitions |
| `index.ts` | Public API: re-exports all modules |

### public/ — Browser Dashboard

| File | Role |
|------|------|
| `dashboard.html` | Single-page connect + live performance dashboard. 3D cube (Three.js + OrbitControls), spell detection panel (move buffer + partial match progress + toast notifications), performance mode badges (seq/poly, palette, frozen), expression gauges (tilt, spin, deviation, scramble), voice sequence bar, vertex/complex cards, sieve strip, move log. Gyro smoothing slider in header (Kalman filter gains, 0=responsive/1=smooth). Connects via WS, receives state/spell/voice broadcasts from relay. |


## Commands

```bash
npx tsx relay.js      # run full relay (BLE → engine → OSC)
npm test              # vitest (55 tests)
npm run test:watch    # vitest watch
npm run dev           # engine standalone (tsx)
npm run build         # tsc → dist/
npx tsc --noEmit      # type-check only
```

## Performance Model

### Core loop

Each physical cube turn:
1. Move enters **spell detector** (rolling buffer, pattern match against 13 known algorithms)
2. If spell detected → **mode manager** updates performance state (effects TBD)
3. K_i cube advances (S4 right-multiplication → parameter permutation)
4. C_i cube advances (complex type permutation)
5. **Voice engine** emits active voices (1 in sequential, 8 in polyphonic mode)
6. **Expression processor** provides continuous gyro-derived control values
7. Full state broadcast to SC (OSC) + dashboard (WS)

### Voice Modes

- **Sequential**: one active vertex at a time, cycling through positions. Each turn plays one corner.
- **Polyphonic**: all 8 vertices sounding simultaneously. Each turn morphs the full ensemble.

### Spell System

Rubik's algorithms detected from the move stream trigger mode changes. **Orientation-independent**: each canonical algorithm is expanded into all 24 whole-cube-rotation variants, so the same finger pattern is detected regardless of which faces it's performed on (e.g. sexy-move works as R U R' U', F R F' R', L D L' D', etc.). Spells **layer** — if a short spell is the prefix of a longer one, the short fires first and the long fires on completion. Turns always produce sound; spells are bonus triggers on top.

| Name | Canonical Algorithm | Moves | Unique Variants |
|------|-------------------|-------|-----------------|
| sexy-move | R U R' U' | 4 | 24 (absorbs inverse-sexy) |
| sledgehammer | R' D' R D | 4 | 24 |
| hedge | D R' D' R | 4 | 24 |
| oll-cross | F R U R' U' F' | 6 | 24 |
| sune | R U R' U R U' | 6 | 24 |
| anti-sune | R' U' R U' R' U2 R | 7 | 24 |
| combo | R U R' U' R' F R F' | 8 | 24 |
| j-perm | R' U L' U2 R U' R' U2 R L | 10 | 24 |
| u-perm-cw | R2 U R U R' U' R' U' R' U R' | 11 | 24 |
| u-perm-ccw | R U' R U R U R U' R' U' R2 | 11 | 24 |
| h-perm | R2 U2 R' U2 R2 U2 R2 U2 R' U2 R2 | 11 | 24 |
| t-perm | R U R' U' R' F R2 U' R' U' R U R' F' | 14 | 24 |

**Note**: inverse-sexy (U R U' R') was removed — it's rotation-equivalent to sexy-move (same commutator [A,B] with faces swapped; all 24 variants collide). 12 canonical × 24 rotations = 288 total patterns.

**Rotation expansion**: generated at load time by applying the 24 face-permutation maps (from generators x, y, z) to each canonical algorithm. Direction (CW/CCW/180°) is preserved by proper rotations — only face names change. Partial matches and spell book UI are deduplicated by spell name.

**Overlap suppression**: with 288 patterns, a repeating move cycle can match overlapping windows (e.g. cycling `F U' F' U` would fire sledgehammer, sexy-move, hedge on every other move). After a spell fires, other spells whose buffer window **partially overlaps** are suppressed. **Full containment** (longer spell encompasses shorter, e.g. combo contains sexy-move prefix) is still allowed — layered detection is preserved. Math: suppress when `L - L_prev < gap < L` where gap = moves since last match.

**Buffer rules**: 2s timeout between moves resets buffer. Max buffer 20 moves. Different spells sharing an algorithm (from rotation overlap) are rejected at construction.

### Expression (continuous gyro control)

| Parameter | Source | Range |
|-----------|--------|-------|
| tilt | Pitch angle from quaternion | 0 (face down) – 1 (face up) |
| spin | Angular velocity between frames | 0 (still) – 1 (fast) |
| deviation | Distance from nearest S4 snap | 0 (locked) – 1 (boundary) |
| scramble | BFS distance from identity in S4 | 0 (solved) – 1 (max) |

### Scramble Distance

Precomputed BFS from identity using 3 generators + inverses. S4 diameter is small (≤6). Normalized to 0-1 as a meta-parameter. Solved cube = 0, maximally scrambled = 1.

### Engine Modes (inherited from Xenakis layer)

- **K_i direct**: physical face turn = S4 transformation
- **K_i diagram**: pre-composed path; cube turns advance position
- **C_i algorithmic**: second cube follows own S4 diagram
- **C_i gyro**: gyro quaternion snapped to nearest S4 element drives second cube
- **V1**: D strong, G strong, U weak (2-5s durations, mf-fff)
- **V2**: D strong, G average, U strong (10-30s durations, p-f)
- **Freeze**: mode manager can freeze advancement (turns still detected but state doesn't advance)

## Key Math

- **S4**: 24 rotations generated from X90, Y90, Z90. Cayley table computed at load.
- **Move mapping**: physical face turns (R, U, F, etc.) map to whole-cube S4 rotations. R and L' produce the same element — 18 moves collapse to ~9 distinct S4 elements.
- **α/β/γ cycle**: C_i mapping rotates every 3 substitutions
- **Sieve L(m,n)**: pitch sets from prime residual classes mod 18; metabola every 3 subs
- **Tetrahedral orbits**: 12 even (preserve tetrahedra) + 12 odd (swap)

## SuperCollider

All composition math stays in TS engine; SC only receives OSC and synthesizes sound. Single file: `sc/xenakube.scd`.

Boot: open in SC IDE, `Cmd+B` (boot server), select all `Cmd+A`, evaluate `Cmd+Enter`. Listens on SC's default lang port (57120). `Cmd+.` = stop all sound.

### Signal Chain

Sequential single-voice model. One active vertex at a time — `/xk/voice` triggers voice changes. Active voice → stereo pan (by vertex position) → reverb send bus → `FreeVerb2` → `Limiter` (0.85) on master bus.

**Note**: SC currently implements sequential mode only. Polyphonic mode output, expression parameter receivers, and palette switching are not yet implemented.

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

### OSC → Synthesis Parameter Mapping

- **Sieve → pitch**: semitone offsets, 0 = C2 (MIDI 36), use `.midicps`
- **Intensity → amp**: p=0.12, mp=0.22, mf=0.35, f=0.5, ff=0.65, fff=0.8
- **Density → event rate**: controls Routine wait intervals
- **Gyro deviation → C8 detuning** (beating speed) + **C5 brightness**
- **Tetrahedral orbit → reverb**: even = warm (room 0.55, damp 0.4), odd = dry (room 0.3, damp 0.7)
- **Voice panning**: 8 fixed positions spread L→R across stereo field

## OSC Reference

All `/xk/*` messages go to SC on port 57120. All `/gan/*` messages go to TD on port 8000. Full state burst sent on every cube turn and at BLE gyro rate (~10Hz). `/xk/gyro` and `/gan/gyro` sent at 60Hz from Kalman filter predict loop (upsampled from ~10Hz BLE). Full `XenaKubeState` JSON broadcast to all WS clients on every state change.

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
| `/xk/voice` | int, int, float, string, float | vertexIdx, complexType, density, intensity, duration |
| `/xk/snap/element` | int (0-23) | S4 element gyro snaps to |
| `/xk/snap/quat` | float×4 | quaternion of snap target |
| `/xk/snap/dev` | float (0-1) | gyro deviation; 0=locked, 1=boundary |
| `/gan/turn` | string | move (e.g. "R", "U'", "F2") — port 8000 to TD |
| `/gan/gyro` | float×4 | quaternion — port 8000 to TD |

## Not Yet Implemented

- **Spell effects**: algorithms are detected but effect-to-action mapping is empty. Wire in `mode-manager.ts`.
- **Polyphonic SC output**: voice-engine supports poly mode but `osc-output.ts` and SC only handle sequential.
- **Expression OSC**: expression processor computes values but no `/xk/expr/*` messages are emitted yet.
- **Palette switching**: mode manager tracks palette name but no multi-palette SC code exists.
- **TouchDesigner**: TD receives raw `/gan/*` on port 8000. No `.toe` project exists.

## Visuals Status

**Browser dashboard**: `http://localhost:3000` — full performance dashboard with spell detection, expression gauges, mode indicators, 3D cube, vertex/complex cards, sieve strip, move log. Gyro smoothing control in header.

**TouchDesigner**: receives raw `/gan/*` on port 8000. No `.toe` project exists yet.
