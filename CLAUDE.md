# CLAUDE.md

## Self-Maintenance

**Always update project documentation in the same commit as the code change.** These files must stay in sync — if a change touches their subject, edit them:

- **`CLAUDE.md`** (this file) — architecture, file roles, OSC reference, commands, implementation status. Update when you add/rename files, change OSC addresses/ports, change architecture, add npm scripts/dependencies, or implement a "Not Yet Implemented" feature (remove the stub).
- **`CHANGELOG.md`** — add a dated entry for every user-visible change (new feature, bug fix, behavior change). Use the existing date/Added/Changed/Fixed structure.
- **`docs/todo.md`** — check off completed phase items; add new todos as they emerge. Don't leave stale `[ ]` items that were actually done.
- **`docs/research_notes.md`** — update when design rationale changes, a new mapping is introduced, or SWAM/SC behavior diverges from what's documented there.
- **`README.md`** — update only when user-facing setup, requirements, or top-level project description changes. Don't mirror internal architecture here.

**How to update**: edit only the affected section. Keep the same terse style. Don't expand descriptions. If a section becomes stale, fix or remove it — don't add disclaimers.

## Project Overview

**XenaKube** — real-time instrument: GAN i4 smart Rubik's cube → sound synthesis + visuals. Cube turns are musical events; Rubik's algorithms are "spells" that trigger mode changes. Built on S4 group math (24 cube rotation symmetries) inspired by Xenakis' *Nomos Alpha*.

Primary source: `docs/xenakis_nomos_alpha_primary_source.md` (*Formalized Music* pp. 214–237).
Research notes, references, and design rationale: `docs/research_notes.md`.
Implementation roadmap: `docs/todo.md`.

## Architecture

All composition math in TypeScript (`src/`). SuperCollider = sound only (built-in SynthDefs). Max/MSP + SWAM Cello 3 = alternate synthesis via MIDI (physical-modeling cello VST). TouchDesigner/browser = visuals only.

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
                              ModeManager  OSC:57120    OSC:57121   OSC:8000  WS
                              (state machine) SuperCollider  Max/SWAM  TD    Dashboard
```

**relay.js** — BLE-to-OSC bridge. Serves dashboard on `:3000` (from `public/dashboard.html`). Receives cube events via WS, upsamples gyro from BLE rate (~10Hz) to 60Hz via quaternion Kalman filter (velocity-aware prediction + measurement correction; smoothing slider 0-1 maps to Kalman gains, default 0.2). 60Hz loop uses `process.hrtime.bigint()` spin timer (not `setInterval`, which drifts to ~40Hz on Windows). Instantiates engine (`onTurn()`/`onGyro()`), sends `/xk/*` OSC to SuperCollider (port 57120) and Max/MSP (port 57121), forwards raw `/gan/*` to TD (port 8000). 60Hz loop sends gyro OSC (`/xk/gyro`, `/gan/gyro`) + expression OSC (`/xk/expr/tilt`, `/xk/expr/spin`, `/xk/expr/dev`, `/xk/expr/scramble`) to SC and Max; full state burst (~30 messages) only fires at BLE rate on gyro updates and on turns. Sends `/xk/spell <name>` to SC and Max on algorithm detection. Broadcasts augmented engine state (includes scrambleFactor, voiceMode, performanceMode, spellBuffer, spellPartials) as JSON over WS. Sends `spell` events on algorithm detection, `spell_book` on client connect. Handles control messages: `set_diagram`, `clear_diagram`, `set_mode`, `reset`, `get_diagrams`, `set_gyro_smoothing`. Auto-shutdown 5s after last client disconnects. Run: `npx tsx relay.js`. Deps: `node-osc`, `ws`, `tsx`.

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
| `expression.ts` | Gyro quaternion → continuous control values (tilt, spin, deviation, scramble). Engine exposes `getExpressionFor(quat)` for relay 60Hz loop |
| `mode-manager.ts` | Performance state machine: voice mode, palette, variant, freeze. Spell effects wired: sexy-move→toggle seq/poly, sledgehammer→freeze, sune→V2, anti-sune→V1, oll-cross→drone, combo→burst, t-perm→reset |
| `turn-rate.ts` | Turn-rate tracker: circular buffer → EWMA rate → regime classification (contemplative/conversational/burst) with hysteresis |
| `kinematic.ts` | Graph paths through S4: pre-composed diagrams + free traversal |
| `sieve.ts` | L(m,n) logical function, prime residual classes mod 18, metabola mutations |
| `quaternion.ts` | Gyro → nearest S4 snap, deviation factor |
| `osc-output.ts` | Engine state → OSC message batches. `expressionToOsc()` for 60Hz expression, `spellToOsc()` for spell events |
| `types.ts` | Shared type definitions |
| `index.ts` | Public API: re-exports all modules |

### docs/ — Documentation

| File | Role |
|------|------|
| `xenakis_nomos_alpha_primary_source.md` | Full text extraction from *Formalized Music* pp. 214–237 |
| `research_notes.md` | References, design rationale, Xenakis→XenaKube mapping, S4 properties, sieve theory, SWAM Cello mapping design, further reading |
| `todo.md` | Implementation roadmap: three performance speed regimes (contemplative/conversational/burst), phased plan |

### public/ — Browser Dashboard

| File | Role |
|------|------|
| `dashboard.html` | Single-page connect + live performance dashboard. 3D cube (Three.js) with per-vertex parameter labels (K#, complex type, D/G/U), ghost cube (cyan wireframe showing S4 snap target with complex labels, opacity varies with deviation), snap overlay (element + deviation % + lock bar), rotation gizmo (separate isometric mini-canvas, bottom-right, 3-axis rings for live/ghost offset). Spell detection panel (move buffer + partial match progress + toast notifications), performance mode badges (seq/poly, palette, frozen), expression gauges (tilt, spin, deviation, scramble), voice sequence bar, vertex/complex cards, sieve strip, move log. Gyro smoothing slider in header (Kalman filter, default 0.2, 0=responsive/1=smooth). Connects via WS, receives state/spell/voice broadcasts from relay. |


## Commands

```bash
npx tsx relay.js      # run full relay (BLE → engine → OSC)
npm test              # vitest (67 tests)
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

Rubik's algorithms detected from the move stream trigger mode changes. The spell book is deliberately minimal: **only the 7 fundamentals needed to solve the cube under CFOP** (Cross, F2L, OLL, PLL) are canonical spells. **Orientation-independent**: each canonical algorithm is expanded into all 24 whole-cube-rotation variants, so the same finger pattern is detected regardless of which faces it's performed on (e.g. sexy-move works as R U R' U', F R F' R', L D L' D', etc.). Spells **layer** — if a short spell is the prefix of a longer one, the short fires first and the long fires on completion. Turns always produce sound; spells are bonus triggers on top.

| Name | Canonical Algorithm | Moves | CFOP role | Effect |
|------|--------------------|-------|-----------|--------|
| sexy-move | R U R' U' | 4 | F2L trigger | Toggle sequential/polyphonic |
| sledgehammer | R' F R F' | 4 | F2L trigger | Toggle freeze |
| oll-cross | F R U R' U' F' | 6 | 2-look OLL: edges | Variant → drone |
| sune | R U R' U R U2 R' | 7 | 2-look OLL: corners | Palette → V2 |
| anti-sune | R U2 R' U' R U' R' | 7 | 2-look OLL: inverse corners | Palette → V1 |
| u-perm | R U' R U R U R U' R' U' R2 | 11 | 2-look PLL: 3-edge cycle | Variant → burst |
| t-perm | R U R' U' R' F R2 U' R' U' R U R' F' | 14 | 2-look PLL: corners + edges | Reset variant + palette |

**Note**: inverse-sexy (U R U' R') and hedgeslammer (F R' F' R) are rotation variants of sexy-move and sledgehammer respectively, and fire under those names. 7 canonical × 24 rotations = 168 total patterns.

**Rotation expansion**: generated at load time by applying the 24 face-permutation maps (from generators x, y, z) to each canonical algorithm. Direction (CW/CCW/180°) is preserved by proper rotations — only face names change. Partial matches and spell book UI are deduplicated by spell name.

**Overlap suppression**: a repeating move cycle can match overlapping windows across rotation variants. After a spell fires, other spells whose buffer window **partially overlaps** are suppressed. **Full containment** (longer spell encompasses shorter, e.g. a T-perm sequence begins with a sexy-move prefix) is still allowed — layered detection is preserved. Math: suppress when `L - L_prev < gap < L` where gap = moves since last match.

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

Sequential single-voice model. One active vertex at a time — `/xk/voice` triggers voice changes. Active voice → stereo pan (by vertex position) → reverb send bus → `FreeVerb2` → `Limiter` (0.85) on master bus. Voice overlap handling: minimum 0.5s duration before switching — defers new voice until attack phase completes, preventing clipping at fast turn rates. Sieve mutation cue: bell-like chime (2 octaves above sieve centroid) on metabola. Scramble factor → reverb wet mix (solved=0.1 dry, scrambled=0.65 drenched).

**Note**: SC currently implements sequential mode only. Polyphonic mode output, expression parameter receivers, and palette switching are not yet implemented.

### sc/ Directory

| File | Role |
|------|------|
| `xenakube.scd` | Synthesis engine: 7 SynthDefs, reverb, limiter, OSCdef receivers, single-voice sequential manager with overlap handling |

### SynthDefs

| Name | Used by | Source |
|------|---------|--------|
| `\xk_pizz` | C1 | Noise burst → `Ringz` harmonics + `Pluck` (pizzicato/col legno) |
| `\xk_bowed` | C2, C3 | `LFSaw` + `BrownNoise` bow + `BPeakEQ` body (arco string) |
| `\xk_harmonic` | C4 | Sine partials at 2×/3×/4× fundamental (flageolet) |
| `\xk_colLegno` | C4 (interrupts) | HP noise + `Ringz` click (woody strike) |
| `\xk_gliss` | C5, C6, C7 | `LFSaw` + FM + `PinkNoise` bow, lagged freq (sliding string) |
| `\xk_ponticello` | C8 | Two detuned `Pulse` + HPF + metallic BPF ring + tremolo (sul ponticello) |
| `\xk_sieveCue` | global | Detuned sine bell (2 oct above sieve centroid), triggers on metabola |
| `\xk_reverb` | global | `FreeVerb2`, runs at tail |
| `\xk_master` | global | `Limiter` at 0.85, runs at tail |

### OSC → Synthesis Parameter Mapping

- **Sieve → pitch**: semitone offsets, 0 = C2 (MIDI 36), use `.midicps`
- **Intensity → amp**: p=0.12, mp=0.22, mf=0.35, f=0.5, ff=0.65, fff=0.8
- **Density → event rate**: controls Routine wait intervals
- **Gyro deviation → C8 detuning** (beating speed) + **C5 brightness**
- **Tetrahedral orbit → reverb**: even = warm (room 0.55, damp 0.4), odd = dry (room 0.3, damp 0.7)
- **Scramble factor → reverb wet**: 0 (solved) = 0.1 (dry), 1 (scrambled) = 0.65 (drenched)
- **Sieve change → cue**: bell chime at 2 octaves above sieve centroid on metabola
- **Voice overlap**: min 0.5s voice duration; fast turns defer switch until attack completes
- **Voice panning**: 8 fixed positions spread L→R across stereo field

## Max/MSP — SWAM Cello Bridge

Alternate synthesis layer: SWAM Cello 3 (Audio Modeling physical-modeling VST) driven via MIDI from a Max/MSP bridge. Receives same `/xk/*` OSC as SC on port 57121. Runs alongside or instead of SC.

### Patch (4 objects)

```
[udpreceive 57121] → [v8 xk_swam.js @autowatch 1] → [vst~ "SWAM Cello 3" 2] → [dac~ 1 2]
                                                  |1→ [print xk_swam]
```

### max/ Directory

| File | Role |
|------|------|
| `xk_swam.js` | v8 object (v2): OSC → midievent. Phrase generators per complex type, legato note ordering (noteOn-before-noteOff with 20ms overlap for SWAM portamento), auto-release timer with fade, velocity humanization (±15% + accents), 60Hz expression → continuous CC, spell reactions, CC cache. Pitches octave-folded into cello range (C2–F6, MIDI 36–89) via `CELLO_MIN`/`CELLO_MAX` + `foldToRange()` |
| `tester.maxpat` | Reference Max patch: the 4-object chain from the doc above (`udpreceive 57121` → `v8 xk_swam.js @autowatch 1` → `vst~ "SWAM Cello 3" 2` → `dac~`). Open this to drive SWAM from a live relay. |
| `tester1.maxpat` | Debug-harness variant of `tester.maxpat` with added message boxes (hand-fired `/xk/expr/*`, raw `midievent` CCs) and a `live.gain~` for isolated CC/midievent testing without a running relay. |

### Per-Turn Phrase Generation

Each `/xk/voice` triggers a **musical gesture**, not a single note. Phrase generators are dispatched by complex type:

| Type | Phrase |
|------|--------|
| C1 Pizz | Cloud of 2-5 plucked notes scattered over ≤600ms, short gates |
| C2 Bowed | Legato run of 2-3 notes (3 in burst regime), portamento overlap |
| C3 Sustained | Single long note, expression swell (soft→peak@40%→settle) |
| C4 Harmonics | Single ethereal note, shifted up if below MIDI 60, light bow pressure |
| C5 Wild gliss | Two notes ≥5 semitones apart, legato slide between at 200-600ms |
| C6 Ordered gliss | 2-4 stepwise sieve walk with portamento |
| C7 Sustained slide | Single note + slow drift (±3 semitones) at half-duration |
| C8 Ponticello | Tremolo single note near bridge |

Every phrase schedules its own auto-release timer (`scheduleRelease(dur)`) — no more infinite sustain. Release fades expression down over 5 steps × 80ms, then note-off. Turn events cancel any in-progress phrase and release before starting the next.

### OSC → SWAM MIDI Mapping

- **Complex type → technique**: C1=Pizz keyswitch, C2/C3=Arco (legato vs tasto), C4=Harmonics ON, C5-C7=Portamento ON (varying glide speed), C8=near-bridge + Tremolo
- **Intensity → Expression CC 11 + base velocity**: p={expr:20,vel:35}, mp={38,50}, mf={55,68}, f={75,85}, ff={95,100}, fff={115,120}
- **Density → Attack Ramp CC 73**: high density = fast attack
- **Sieve → MIDI note pool**: offsets + 36 (C2), selection strategy per complex type. Pitches are folded by octave into the cello's playable range (`CELLO_MIN`=36/C2, `CELLO_MAX`=89/F6) — out-of-range notes wrap up/down an octave rather than clamping, preserving pitch class
- **Tilt → Expression CC 11** (60Hz, exponential `val²` curve, blended with base: `baseExpr*0.3 + tilt²*97`)
- **Spin → Vibrato Depth CC 1 + Rate CC 76** (threshold 0.15, exponential above)
- **Deviation → Bow Pressure CC 17 + Bow Speed CC 19** (exponential, wider range 20-127)
- **Scramble → Bow Position CC 16**: solved=fingerboard(120), scrambled=bridge(5); skipped when complex type owns position (C3, C4, C7, C8)
- **Tetra orbit → Bowing Sensitivity CC 21**: even=50 (warm), odd=110 (edgy)
- **Path V1/V2 → Transpose**: 0 / -12
- **Regime → Tremolo CC 92 + Attack Ramp**: contemplative=trem off/slow attack(90), conversational=trem off/medium(50), burst=trem on/fast(10); in burst, tremolo depth scales with turn rate
- **Spells**:
  - `sexy-move` = bow sweep (snap to bridge + peak expression, release after 400ms)
  - `sledgehammer` = toggle freeze (CC64 sustain pedal + ignore voice events; second trigger releases all held notes)
  - `oll-cross` = harmonic ping (harmonics flash + high note for 800ms)
  - `sune` = V2 palette (tasto + dim expression)
  - `anti-sune` = V1 palette (mid position + bright expression)
  - `u-perm` = staccato burst (3-5 rapid short notes)
  - `t-perm` = full reset (cancel phrases, all notes off, CCs to defaults)

### Humanization

- **Velocity**: ±15% random jitter + accent (+8) every 3rd turn
- **Pitch**: 10% chance of ±1 semitone microtonal shift
- **Timing**: 0-30ms micro-delay between phrase notes

### Keyswitches

`KS = { ARCO:24, PIZZ:25, TREMOLO:26, STACCATO:27 }` — held 30ms (not instant) so SWAM registers the switch. Verify mapping in SWAM > Preferences > MIDI. If your SWAM config differs, edit the `KS` object at the top of `xk_swam.js`.

## OSC Reference

All `/xk/*` messages go to SC (port 57120) and Max/MSP (port 57121). All `/gan/*` messages go to TD on port 8000. Full state burst (~30 messages) sent on every cube turn and at BLE gyro rate (~10Hz). `/xk/gyro`, `/gan/gyro`, and `/xk/expr/*` sent at 60Hz from Kalman filter predict loop. `/xk/spell` sent on algorithm detection. Full `XenaKubeState` JSON broadcast to all WS clients on every state change.

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
| `/xk/scramble` | float (0-1) | scramble factor; 0=solved, 1=max scrambled |
| `/xk/rate` | float | turn rate (turns/sec) |
| `/xk/regime` | string | 'contemplative', 'conversational', or 'burst' |
| `/xk/expr/tilt` | float (0-1) | gyro tilt; 0=face down, 1=face up. 60Hz |
| `/xk/expr/spin` | float (0-1) | angular velocity; 0=still, 1=fast. 60Hz |
| `/xk/expr/dev` | float (0-1) | S4 snap deviation; 0=locked, 1=boundary. 60Hz |
| `/xk/expr/scramble` | float (0-1) | scramble factor (continuous). 60Hz |
| `/xk/spell` | string | spell name on detection (e.g. "sexy-move") |
| `/gan/turn` | string | move (e.g. "R", "U'", "F2") — port 8000 to TD |
| `/gan/gyro` | float×4 | quaternion — port 8000 to TD |

## Not Yet Implemented

- **Polyphonic SC output**: voice-engine supports poly mode but SC only handles sequential. Max/SWAM bridge handles poly via note stacking.
- **SC expression receivers**: `/xk/expr/*` messages are emitted at 60Hz but SC doesn't yet map them to synthesis params (only C5 brightness and C8 detuning via raw gyro).
- **SC spell reactions**: `/xk/spell` is sent but SC has no OSCdef for it yet.
- **Palette switching**: mode manager tracks palette name but no multi-palette SC code exists.
- **Speed regime adaptation**: turn-rate tracker detects regime; contemplative mode polished (Phase 2 done), but conversational/burst SC behavior not yet implemented. See `docs/todo.md` Phases 3–4.
- **Scramble arc (burst mode)**: scramble factor wired to SC reverb mix (Phase 2) and Max bow position. Full burst-mode arc (scramble as master decrescendo parameter) not yet implemented (Phase 4).
- **TouchDesigner**: TD receives raw `/gan/*` on port 8000. No `.toe` project exists.

## Visuals Status

**Browser dashboard**: `http://localhost:3000` — full performance dashboard with spell detection, expression gauges, mode indicators, 3D cube, vertex/complex cards, sieve strip, move log. Gyro smoothing control in header.

**TouchDesigner**: receives raw `/gan/*` on port 8000. No `.toe` project exists yet.
