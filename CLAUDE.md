# CLAUDE.md

## Self-Maintenance

When you change code, update the affected section of these docs in the same commit; keep the terse style and don't add disclaimers to stale content — fix it:

- **`CLAUDE.md`** (this file) — architecture, file roles, OSC reference, commands.
- **`CHANGELOG.md`** — dated entry per user-visible change (Added/Changed/Fixed).
- **`docs/todo.md`** — tick off done items; add new todos as they emerge.
- **`docs/research_notes.md`** — design-rationale changes, new mappings, SWAM/SC divergences.
- **`docs/revision_roadmap.md`** — SWAM-bridge diagnoses (D*) and phase progress.
- **`docs/swam_cello_reference.md`** — authoritative SWAM parameter/CC/KS reference.
- **`README.md`** — only user-facing setup / top-level description changes.

Implementation status and pending phases live in `docs/revision_roadmap.md` and `docs/todo.md`, not here.

## Project Overview

**XenaKube** — real-time instrument: GAN i4 smart Rubik's cube → sound synthesis + visuals. Cube turns are musical events; Rubik's algorithms are "spells" that trigger mode changes. Built on S4 group math (24 cube rotation symmetries) inspired by Xenakis' *Nomos Alpha*.

Primary source: `docs/xenakis_nomos_alpha_primary_source.md` (*Formalized Music* pp. 214–237).

## Commands

```bash
npx tsx relay.js      # run full relay (BLE → engine → OSC)
npm test              # vitest (66 tests)
npm run test:watch    # vitest watch
npm run dev           # engine standalone (tsx)
npm run build         # tsc → dist/
npx tsc --noEmit      # type-check only
```

## OSC Reference

`/xk/*` → SC (57120) and Max (57121). `/gan/*` → TD (8000). Full state burst (~30 messages) on every cube turn and at BLE gyro rate (~10 Hz). `/xk/gyro`, `/gan/gyro`, `/xk/expr/*` at 60 Hz from the relay's Kalman loop. `/xk/voice` fires only on real voice transitions (from `engine.onVoice`, not per gyro packet). `/xk/spell` on algorithm detection. Full `XenaKubeState` JSON broadcast to all WS clients on every state change.

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
| `/xk/rate` | float | turn rate (turns/sec) |
| `/xk/regime` | string | 'contemplative' / 'conversational' / 'burst' |
| `/xk/expr/{tilt,spin,dev,scramble}` | float (0-1) | 60 Hz continuous controls |
| `/xk/spell` | string | spell name on detection |
| `/xk/voice` | int, int, float, string, float | vertexIdx, complexType, density, intensity, duration |
| `/xk/panic` | — | relay WS-disconnect; bridges flush notes + CCs |
| `/gan/turn` | string | raw move (e.g. "R", "U'", "F2") — port 8000 |
| `/gan/gyro` | float×4 | raw quaternion — port 8000 |

## Architecture

All composition math in TypeScript (`src/`). SuperCollider = sound only (built-in SynthDefs). Max/MSP + SWAM Cello 3 = alternate synthesis via MIDI (physical-modeling cello VST). TouchDesigner/browser = visuals only.

```
GAN i4 (BLE) → Chrome Web Bluetooth → relay.js (Node)
                                          │
                                    XenaKubeEngine (TS)
                                    ┌─────┼──────────────┐
                                    │     │              │
                              SpellDetector  VoiceEngine  ExpressionProcessor
                                    │     │              │
                                    ▼     ▼              ▼
                              ModeManager  OSC:57120    OSC:57121   OSC:8000  WS
                              (state machine) SuperCollider  Max/SWAM  TD    Dashboard
```

**relay.js** — BLE-to-OSC bridge. Instantiates `XenaKubeEngine`, serves `public/dashboard.html` on `:3000`, receives cube events via WS from the browser. Run: `npx tsx relay.js`. Deps: `node-osc`, `ws`, `tsx`.

- **Gyro upsampling**: BLE ~10 Hz → 60 Hz via velocity-aware quaternion Kalman filter (smoothing slider 0–1, default 0.2). 60 Hz loop uses `process.hrtime.bigint()` spin timer — `setInterval` drifts to ~40 Hz on Windows.
- **Control messages** (WS → relay): `set_diagram`, `clear_diagram`, `set_mode`, `reset`, `get_diagrams`, `set_gyro_smoothing`, `set_snap_calibration` (planned, D25).
- **Lifecycle**: auto-shutdown 5 s after last client disconnects.

### src/ — TypeScript Engine

| Module | Role |
|--------|------|
| `engine.ts` | Orchestrator: turn/gyro → spell detection → cubes → voice output → state |
| `group.ts` | S4 group: 24 elements as vertex permutations, Cayley table, generators, tetra orbits |
| `vertices.ts` | K1–K8 vertices with V1/V2 values (D×G×U), permutation |
| `complexes.ts` | C1–C8 complex types, α/β/γ cyclic mappings (rotate every 3 subs), C_i state |
| `spells.ts` | Spell book (7 canonical × 24 rotations = 168 variants) + rolling buffer matcher |
| `scramble.ts` | BFS distance from identity in S4 Cayley graph, normalized 0–1 |
| `voice-engine.ts` | Sequential (1 voice) vs polyphonic (8 voices) output decision |
| `expression.ts` | Gyro quaternion → continuous control values (tilt, spin, deviation, scramble) |
| `mode-manager.ts` | Performance state machine: voice mode, palette, variant, freeze; spell effects |
| `turn-rate.ts` | Circular buffer → EWMA rate → regime classification with hysteresis |
| `kinematic.ts` | Graph paths through S4: pre-composed diagrams + free traversal |
| `sieve.ts` | L(m,n) logical function, prime residual classes mod 18, metabola mutations |
| `quaternion.ts` | Gyro → nearest S4 snap, deviation factor |
| `osc-output.ts` | Engine state → OSC message batches |
| `types.ts` | Shared type definitions |
| `index.ts` | Public API re-exports |

### docs/ — Documentation

| File | Role |
|------|------|
| `xenakis_nomos_alpha_primary_source.md` | *Formalized Music* pp. 214–237 full text |
| `research_notes.md` | References, design rationale, Xenakis→XenaKube mapping, further reading |
| `todo.md` | Phased implementation roadmap (contemplative / conversational / burst) |
| `swam_cello_reference.md` | Authoritative SWAM v3.8+ parameter / CC / KS reference |
| `revision_roadmap.md` | SWAM-bridge refactor plan: diagnoses D1–D27, phase progress, verification |

### public/ — Browser Dashboard

`dashboard.html` at `http://localhost:3000`. **Full-viewport HUD**: `#cube-canvas` fills the window (100vw × 100vh, z-index 0); all UI floats as transparent overlays on top of it. Three.js 3D cube with per-vertex K#/D/G/U labels, ghost cube showing S4 snap target (opacity = deviation), rotation gizmo (fixed 200×200 at top-right, under the cam/live/ghost toggles).

Overlay layout:
- **Top-left column** (`.ovl-tl`, 480 px): title + MAC/connect row → state rows (active voice, S4, phase, orbit, scramble, permutation) → mode badges (palette, voice, frozen, regime, turn rate) → active K/C card → Expression panel (Zero Gyro + smoothing slider + tilt/spin/deviation/scramble readouts).
- **Top-center**: spell buffer + spell notification.
- **Top-right**: rotate cam/live/ghost toggles → rotation gizmo → step / S4 element / snap dev.
- **Bottom**: full-width sieve piano-roll (white/black keys, octave dividers, C2–C6 labels).

Only the **active** K/C cards render in the HUD (`.vertex-card:not(.active), .complex-card:not(.active) { display:none }`); JS still populates all 8 internally. Legacy elements (full K1–K8 grid, C1–C8 grid, move-log list, voice-sequence selects/reset button) remain in DOM for JS compatibility but are hidden via `.ovl-legacy { display:none }`. WS client to relay.

## Performance Model

### Core loop

Each physical cube turn:
1. Move → **spell detector** (168 rotation variants of 7 canonical algorithms)
2. If spell matched → **mode manager** applies effect
3. K_i advances (S4 right-multiplication → parameter permutation)
4. C_i advances (complex type permutation)
5. **Voice engine** emits active voices (1 in sequential, 8 in polyphonic)
6. **Expression processor** supplies continuous gyro-derived controls
7. State broadcast to SC / Max (OSC) + dashboard (WS)

### Voice Modes

- **Sequential**: one active vertex at a time, cycling through positions.
- **Polyphonic**: all 8 vertices sound simultaneously; each turn morphs the ensemble.

### Spell System

Rubik's algorithms detected from the move stream trigger mode changes. The spell book covers the 6 CFOP fundamentals plus Niklas (archetypal 3-cycle commutator). Algorithms are **orientation-independent** — each is expanded into all 24 whole-cube-rotation variants at load time, so the same finger pattern fires on any face pair. Spells **layer**: a shorter spell that's a prefix of a longer one fires first; the long one fires on completion. Turns always produce sound; spells are bonus triggers on top.

| Name | Canonical Algorithm | Moves | Role | Effect |
|------|--------------------|-------|------|--------|
| sexy-move | R U R' U' | 4 | CFOP F2L trigger | Toggle sequential/polyphonic |
| oll-cross | F R U R' U' F' | 6 | 2-look OLL: edges | Variant → drone |
| sune | R U R' U R U2 R' | 8 | 2-look OLL: corners | Toggle freeze |
| anti-sune | R U2 R' U' R U' R' | 8 | 2-look OLL: inverse corners | Palette → V1 |
| niklas | R U' L' U R' U' L | 7 | Commutator (corner 3-cycle) | Detection only (D19) |
| u-perm | R U' R U R U R U' R' U' R2 | 12 | 2-look PLL: 3-edge cycle | Variant → burst |
| t-perm | R U R' U' R' F R2 U' R' U' R U R' F' | 15 | 2-look PLL: corners + edges | Reset variant + palette |

**Half-turn convention (CCW)**: GAN hardware only reports 90° clicks, so `U2`/`R2` are stored as two CCW quarter-turns. Performers must flick half-turns CCW (speedcube default); CW flicks won't trigger the spell. This is required technique — the cost of a lean spellbook.

**Overlap suppression**: after a spell fires, spells whose buffer **partially overlaps** are suppressed. **Full containment** (e.g. a T-perm sequence starting with a sexy-move prefix) remains allowed — layered detection preserved. Buffer timeout 2 s, max 20 moves.

### Expression (continuous gyro control)

| Parameter | Source | Range |
|-----------|--------|-------|
| tilt | Pitch angle from quaternion | 0 (face down) – 1 (face up) |
| spin | Angular velocity between frames | 0 (still) – 1 (fast) |
| deviation | Distance from nearest S4 snap | 0 (locked) – 1 (boundary) |
| scramble | BFS distance from identity in S4 | 0 (solved) – 1 (max) |

### Engine Modes

- **K_i**: `direct` (physical turn = S4 transform) or `diagram` (pre-composed path advanced by each turn).
- **C_i**: `algorithmic` (own S4 diagram) or `gyro` (quaternion snapped to nearest S4 element).
- **Path V1**: D strong, G strong, U weak (2–5 s durations, mf–fff).
- **Path V2**: D strong, G average, U strong (10–30 s, p–f).
- **Freeze**: turns still detected but state doesn't advance.

## Key Math

- **S4**: 24 rotations generated from X90, Y90, Z90. Cayley table computed at load.
- **Move mapping**: face turns → whole-cube S4 rotations. R and L' produce the same element — 18 moves collapse to ~9 distinct S4 elements.
- **α/β/γ cycle**: C_i mapping rotates every 3 substitutions.
- **Sieve L(m,n)**: pitch sets from prime residual classes mod 18; metabola every 3 subs.
- **Tetra orbits**: 12 even (preserve tetrahedra) + 12 odd (swap).

## SuperCollider

All composition math stays in the TS engine; SC only receives OSC and synthesizes. Single file: `sc/xenakube.scd`.

Boot: open in SC IDE, `Cmd+B`, select all, `Cmd+Enter`. Listens on lang port 57120. `Cmd+.` = panic.

Sequential single-voice model. Active voice → stereo pan (by vertex position) → reverb send bus → `FreeVerb2` → `Limiter` (0.85). SynthDef roster, voice-overlap rules (min 0.5 s duration before switching), and OSC→synth param bindings are all in `sc/xenakube.scd` comments — source of truth.

Scramble factor → reverb wet (0.1 dry → 0.65 drenched). Tetra orbit → reverb flavor (even = warm, odd = dry). Metabola → bell cue (2 oct above sieve centroid).

## Max/MSP — SWAM Cello Bridge

Alternate synthesis layer: SWAM Cello 3 (Audio Modeling physical-modeling VST) driven via MIDI from a Max/MSP bridge on port 57121. Runs alongside or instead of SC.

### Patch (4 objects)

```
[udpreceive 57121] → [v8 xk_swam.js @autowatch 1] → [vst~ "SWAM Cello 3" 2] → [dac~ 1 2]
                                                  |1→ [print xk_swam]
```

### max/ Directory

| File | Role |
|------|------|
| `xk_swam.js` | v8 object: OSC → midievent. SWAM v3.10 KS plane (velocity-select via `setEnum` + `velForOption`). `COMPLEX` config table is the per-voice source of truth (play mode, envelope, vibrato, bow pos/pressure, portamento, register). Expression = per-complex envelope × intensity × path scalar. Spin-deadband on 60 Hz CCs; `/xk/panic` + inactivity watchdog for cleanup. One `phraseCX` generator per complex with stochastic counts. Pitches folded into cello range via `foldToRange(pitch, lo, hi)`. |
| `tester.maxpat` | Reference 4-object chain for driving SWAM from a live relay. |
| `tester1.maxpat` | Debug harness: message boxes for hand-fired `/xk/expr/*` and raw `midievent` CCs. |
| `ks_logger.js` | Optional pass-through v8 between `xk_swam.js` and `vst~`. Toggleable (`on`/`off`/`dump`). Captures raw `midievent` with timestamps; `dump` prints KS-only timeline (field, option guess, Δprev, Δfield) plus non-KS summary + full JSON for LLM review. Use for diagnosing KS glitches (flashing harmonics / tremolo). |

### Conceptual mapping

- **Complex type → technique** (COMPLEX table): C1 Pizz, C2/C3 Arco, C4 Harmonics (KS F#), C5–C7 Portamento, C8 near-bridge + Tremolo (KS G#). Each complex owns a `register: {lo, hi}`.
- **Intensity → Expression peak + note velocity + bow-pressure scalar + phrase density** (6-level INTENSITY_MAP).
- **Path V1/V2 → Expression peak scalar** (V2 × 0.7) + widened V2 fold window.
- **Tilt → Bow Position ±30** around the complex baseline (timbral sul tasto↔pont sweep).
- **Spin → Vibrato Depth/Rate** (CC 19; EMA α = 0.08, musical dead zone at 0.15).
- **Deviation → Bow Pressure ±25** modulation around the complex baseline.
- **Regime → Attack Ramp multiplier** (contemplative 1.2 / conversational 1.0 / burst 0.5).
- **Spells** route through `setupComplex(active)` for idempotent restore.

See `docs/swam_cello_reference.md` for CC/KS numbers, KS Velocity Remap bands, preset prerequisites, and v3.10/v3.11 migration notes. `docs/revision_roadmap.md` D1–D27 document every mapping decision.

### v3.10 KS plane, in one paragraph

Full 12-switch map on `KS_CH`, KS Octave = C0 (MIDI 24–35), 50 ms hold. Most controls are velocity-selectors (Play Mode, Gesture Mode, Harmonics, Tremolo, Alt Fingering); `setEnum(field, ks, target, optionCount)` diffs by option index so re-asserting current state is a no-op. `bang()` pins Gesture Mode = Expression so CC 11 is never silently reinterpreted as bow direction. Sordino / Sul Tasto / Sul Ponticello / Section Size were removed from the KS plane in v3.10 — Sordino is GUI/CC-only, Sul Tasto/Pont are now driven by Bow Position (CC 16), Section Size is gone. Absent-param feature flags (`HAS_BOW_SPEED`, `HAS_ATTACK_RAMP`, `HAS_ATTACK_CONTROL`, default `false`) gate v3.11-missing knobs at the `cc()` helper layer.

### Max MCP Bridge

Claude Code can inspect and edit the running Max patch via the `maxmsp` MCP server at `MaxMSP-MCP-Server/` (registered in `.mcp.json`). **Always route patch work through the `max-patch` subagent** (`.claude/agents/max-patch.md`) — it has the MCP tools scoped and knows the XenaKube patch conventions.

Prerequisite: open `MaxMSP-MCP-Server/MaxMSP_Agent/demo.maxpat` in Max 9+, `script npm install` (first time), then `script start`.

**Boundary**: keep the XenaKube patch thin — the 4-object chain above plus `print xk_swam`. All new routing/logic belongs in `max/xk_swam.js`, not in new Max objects.
