# XenaKube Restructure — TypeScript Math Engine

## Context

The primary source (Formalized Music pp. 214–237) reveals that Xenakis' Nomos Alpha method is far richer than what the current Max/MSP `[js]` files implement. The current code has:
- `relay.js` — working BLE-to-OSC bridge (keep as-is)
- `symmetry_engine.js` / `layer_manager.js` — Max [js] files that are ~60% stubs, tightly coupled to Max APIs (Dict, inlets/outlets, loadbang), and missing most of the actual Xenakis structures

**What the primary source requires that doesn't exist yet:**
1. Two independent cubes operating simultaneously (K_i parameters + C_i sound complexes)
2. Exact V1/V2 path definitions with specific D/G/U numeric values
3. Eight macroscopic sound complexes with α/β/γ cyclic mappings (rotate every 3 substitutions)
4. Kinematic diagrams — graph paths through S4 for structured traversal
5. H×X (pitch × playing technique) product mapping
6. Logical function L(m,n) with prime residual classes modulo 18
7. The full 24-element hexahedral group (S4) with proper Cayley table

**Goal:** Move ALL math/composition logic into a standalone TypeScript engine. Max becomes a thin sound renderer receiving OSC. TD handles performance visuals. A browser-based viz serves development/debugging.

## Architecture

```
GAN i4 (BLE)
    │
    ▼
┌──────────────────────────────────────────┐
│  relay.js (Node.js) — existing, keep     │
│  Chrome Web BT → WebSocket → OSC parse   │
└──────────┬───────────────────────────────┘
           │ internal (import or IPC)
           ▼
┌──────────────────────────────────────────┐
│  XENAKIS ENGINE (TypeScript)             │
│                                          │
│  ┌─────────────┐  ┌──────────────────┐   │
│  │ group.ts     │  │ vertices.ts      │   │
│  │ S4 Cayley    │  │ K1-K8 (D×G×U)   │   │
│  │ 24 elements  │  │ V1/V2 paths      │   │
│  │ generators   │  │ 8 corner params  │   │
│  └─────────────┘  └──────────────────┘   │
│                                          │
│  ┌─────────────┐  ┌──────────────────┐   │
│  │ complexes.ts │  │ kinematic.ts     │   │
│  │ C1-C8 types  │  │ graph paths      │   │
│  │ α/β/γ cycle  │  │ through S4       │   │
│  │ 2nd cube     │  │ direct + diagram │   │
│  └─────────────┘  └──────────────────┘   │
│                                          │
│  ┌─────────────┐  ┌──────────────────┐   │
│  │ sieve.ts     │  │ quaternion.ts    │   │
│  │ L(m,n)       │  │ gyro → nearest   │   │
│  │ mod 18 prime │  │ S4 snap          │   │
│  │ residual     │  │ continuous interp│   │
│  │ classes      │  └──────────────────┘   │
│  └─────────────┘                         │
│                                          │
│  ┌─────────────────────────────────────┐ │
│  │ engine.ts — orchestrator            │ │
│  │ Receives turn/gyro events           │ │
│  │ Runs both cubes (K_i + C_i)         │ │
│  │ Computes full state per transform   │ │
│  │ Emits OSC + WebSocket state         │ │
│  └─────────────────────────────────────┘ │
└──────────┬──────────────┬────────────────┘
           │              │
     OSC (UDP)      WebSocket
           │              │
     ┌─────┴─────┐   ┌───┴──────────────┐
     │ Max/MSP   │   │ Browser Debug Viz │
     │ (sound)   │   │ (Three.js)        │
     │           │   │ served by relay   │
     │ + TD      │   └──────────────────┘
     │ (visuals) │
     └───────────┘
```

## Project Structure

```
XenaKube/
├── relay.js                 ← keep existing (modify to import engine)
├── package.json             ← NEW: typescript, node-osc, ws deps
├── tsconfig.json            ← NEW
├── src/
│   ├── engine.ts            ← orchestrator: receives events, runs both cubes, emits state
│   ├── group.ts             ← S4 (hexahedral group): Cayley table, generators, multiplication
│   ├── vertices.ts          ← K1-K8 vertex definitions, V1/V2 paths with exact Xenakis values
│   ├── complexes.ts         ← C1-C8 sound complex types, α/β/γ cyclic mapping, 2nd cube state
│   ├── kinematic.ts         ← graph traversal of S4: pre-composed diagrams + free mode
│   ├── sieve.ts             ← L(m,n) logical function, prime residual classes mod 18
│   ├── quaternion.ts        ← gyro quat → nearest S4 element snap, continuous interpolation
│   ├── osc-output.ts        ← formats and sends OSC messages to Max + TD
│   └── types.ts             ← shared types: CubeState, Vertex, Complex, GroupElement, etc.
├── data/
│   └── cayley24.json        ← 24×24 multiplication table (generated or hardcoded)
├── viz/
│   └── index.html           ← Three.js debug visualization (served by relay)
├── max/
│   └── xenakube_receive.js  ← thin Max [js]: receives OSC, writes to dicts for poly~
├── docs/
│   ├── Xenakube_Outline.md
│   └── xenakis_nomos_alpha_primary_source.md
└── CLAUDE.md
```

## Module Details

### 1. `src/group.ts` — S4 Hexahedral Group
- Hardcode the 24-element Cayley multiplication table (or generate programmatically from 3 generators)
- S4 generators: 3 face-rotation axes × 90° (plus compositions give all 24)
- `multiply(a, b)` → group element
- `inverse(a)` → group element  
- `identity` constant
- Map from physical cube moves (12 generators: 6 faces × CW/CCW) → S4 elements
- Tetrahedral orbit partition: which of 4 orbits each element belongs to (proper subgroup structure, not naive mod 4)

### 2. `src/vertices.ts` — Outside-Time Organization
- Exact Xenakis values for D, G, U sets (from primary source pp. 218)
- V1 path: `{K1: {d:1.0, g:'mf', u:2}, K2: {d:1.0, g:'fff', u:5}, ...}` (all 8)
- V2 path: `{K1: {d:3, g:'mp', u:17}, ...}` (all 8)
- Permutation function: given an S4 element, return the permuted vertex ordering
- This replaces the current ghost dict system entirely

### 3. `src/complexes.ts` — Second Cube (C_i Sound Complexes)
- Eight macroscopic sound complex types (ataxic cloud, ordered cloud, sliding sounds, atom, ionized atom, etc.)
- Three mappings α, β, γ as permutation arrays
- Cyclic counter: advances α→β→γ→α every 3 substitutions
- Independent S4 state for the C_i cube
- Two modes:
  - **Algorithmic**: C_i cube follows its own kinematic diagram, advancing with each K_i transformation
  - **Gyro-driven**: quaternion orientation snapped to nearest S4 element drives C_i cube

### 4. `src/kinematic.ts` — Graph Traversal
- Pre-composed kinematic diagrams (specific paths through the S4 Cayley graph) based on Xenakis' figures VIII-6, 7, 8
- Two modes:
  - **Direct**: each physical turn = one S4 transformation (performer IS the diagram)
  - **Diagram**: performer steps through a pre-selected path; cube turns advance position or modulate the path
- Diagram library: store multiple paths, allow selection at performance time

### 5. `src/sieve.ts` — Logical Function L(m,n)
- Prime residual classes modulo 18: {1, 5, 7, 11, 13, 17}
- Multiplication with reduction mod 18
- L(m,n) formula: `(n1 ∨ n2 ∨ nk ∨ nl) ∧ mp ∨ (mq ∨ mr) ∧ ns ∨ (nt ∨ nu ∨ nv)`
- Metabola: mutation rules for moduli and indices
- Advances every 3 substitutions of the two cubes (per Xenakis VII)

### 6. `src/quaternion.ts` — Gyro Processing
- Quaternion → rotation matrix conversion
- Snap to nearest of 24 S4 rotation quaternions (dot product comparison)
- Continuous interpolation mode for V2 expressive deviations
- Pre-computed lookup table of 24 unit quaternions representing each S4 element

### 7. `src/engine.ts` — Orchestrator
- Central state machine holding:
  - Current K_i cube S4 element
  - Current C_i cube S4 element (gyro or algorithmic)
  - Active path (V1 or V2)
  - α/β/γ cycle position
  - L(m,n) sieve state
  - Kinematic diagram position (if in diagram mode)
- `onTurn(move)` → processes physical face turn → advances K_i cube → may advance C_i cube → computes full output state
- `onGyro(x, y, z, w)` → updates C_i cube if in gyro mode → updates continuous parameters
- `onLock()` → freezes layer (superposition mode)
- Emits complete state object per transformation

### 8. `src/osc-output.ts` — OSC Formatting
- Rich OSC output covering all state for Max and TD:
  - `/xk/vertex/[1-8]` — current K_i parameter values (density, intensity, duration)
  - `/xk/complex/[1-8]` — current C_i assignments
  - `/xk/group/k` — K_i cube S4 element index
  - `/xk/group/c` — C_i cube S4 element index
  - `/xk/path` — V1 or V2
  - `/xk/cycle` — α, β, or γ
  - `/xk/sieve` — current L(m,n) pitch sieve values
  - `/xk/tetra` — tetrahedral orbit index
  - `/xk/gyro` — raw quaternion passthrough for visuals

### 9. `max/xenakube_receive.js` — Thin Max Receiver
- Replaces both `symmetry_engine.js` and `layer_manager.js`
- Receives OSC, writes values directly to Max dicts for `poly~ xenakis_voice 8`
- Zero math — just data routing

## Implementation Sequence

### Phase 1: Foundation
1. `npm init` + TypeScript setup (`package.json`, `tsconfig.json`)
2. `src/types.ts` — define all shared types
3. `src/group.ts` — implement S4 with full Cayley table, generators, multiplication
4. `src/vertices.ts` — hardcode exact Xenakis V1/V2 values, implement permutation

### Phase 2: Core Composition Logic
5. `src/complexes.ts` — C1-C8 types, α/β/γ cycle, second cube state
6. `src/kinematic.ts` — diagram traversal + direct mode
7. `src/sieve.ts` — L(m,n) with mod 18 prime residual classes

### Phase 3: Real-Time Integration
8. `src/quaternion.ts` — gyro processing and S4 snap
9. `src/engine.ts` — wire everything together, state machine
10. `src/osc-output.ts` — format and send OSC
11. Modify `relay.js` to import and use the engine (instead of just forwarding raw OSC)

### Phase 4: Outputs
12. `max/xenakube_receive.js` — thin Max receiver
13. `viz/index.html` — Three.js debug viz showing both cubes + group state
14. Update `CLAUDE.md`

## Verification

- **Unit tests**: group.ts multiplication (verify Cayley table closure, associativity, identity, inverses), vertices.ts permutations, sieve.ts L(m,n) output against known Xenakis values
- **Integration test**: simulate a sequence of turns, verify OSC output matches expected Nomos Alpha score analysis from primary source (L(11,13) beginning sequence)
- **Live test**: connect GAN cube via relay → verify OSC messages arrive in Max with correct vertex parameters
- **Run**: `npx tsx src/engine.ts` for standalone test, or `node relay.js` for full pipeline
