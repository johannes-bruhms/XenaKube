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
SWAM Cello reference (parameters / CCs / KS): `docs/swam_cello_reference.md`.
SWAM bridge refactor plan: `docs/revision_roadmap.md`.

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

**relay.js** — BLE-to-OSC bridge. Instantiates `XenaKubeEngine`, serves `public/dashboard.html` on `:3000`, receives cube events via WS from the browser. Run: `npx tsx relay.js`. Deps: `node-osc`, `ws`, `tsx`.

- **Gyro upsampling**: BLE ~10Hz → 60Hz via quaternion Kalman filter (velocity-aware predict + correct). Smoothing slider 0–1 maps to Kalman gains (default 0.2). 60Hz loop uses `process.hrtime.bigint()` spin timer; `setInterval` drifts to ~40Hz on Windows.
- **OSC out**: `/xk/*` to SC (57120) and Max (57121); raw `/gan/*` to TD (8000). At 60Hz: `/xk/gyro`, `/gan/gyro`, `/xk/expr/*`. At BLE rate + on turns: full state burst (~30 messages). On algorithm detection: `/xk/spell <name>` to SC and Max.
- **WS out**: full `XenaKubeState` JSON (includes scrambleFactor, voiceMode, performanceMode, spellBuffer, spellPartials) on every state change. `spell` events on detection; `spell_book` on client connect.
- **Control messages**: `set_diagram`, `clear_diagram`, `set_mode`, `reset`, `get_diagrams`, `set_gyro_smoothing`.
- **Lifecycle**: auto-shutdown 5s after last client disconnects.

### src/ — TypeScript Engine

| Module | Role |
|--------|------|
| `engine.ts` | Orchestrator: turn/gyro → spell detection → cubes → voice output → state |
| `group.ts` | S4 group: 24 elements as vertex permutations, Cayley table, generators, tetrahedral orbits |
| `vertices.ts` | K1-K8 vertices with V1/V2 values (D×G×U), permutation |
| `complexes.ts` | C1-C8 complex types, α/β/γ cyclic mappings (rotate every 3 subs), second cube state |
| `spells.ts` | Spell book (6 canonical CFOP algorithms × 24 rotations = 144 variants) + rolling buffer pattern matcher. Orientation-independent: detects spells on any face pair via whole-cube-rotation expansion |
| `scramble.ts` | BFS distance from identity in S4 Cayley graph, normalized 0-1 |
| `voice-engine.ts` | Sequential (1 voice) vs polyphonic (8 voices) output decision |
| `expression.ts` | Gyro quaternion → continuous control values (tilt, spin, deviation, scramble). Engine exposes `getExpressionFor(quat)` for relay 60Hz loop |
| `mode-manager.ts` | Performance state machine: voice mode, palette, variant, freeze. Spell effects wired: sexy-move→toggle seq/poly, sune→freeze, anti-sune→V1, oll-cross→drone, u-perm→burst, t-perm→reset |
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
| `swam_cello_reference.md` | SWAM Solo Strings v3.8.0 reference: all CCs, KS, Play Modes, articulations, ranges — the authoritative parameter source for the Max bridge |
| `revision_roadmap.md` | SWAM-bridge refactor plan: 15 diagnoses (D1–D15), 8 implementation phases, verification plan. Converged from issues with pizz/harmonics/tremolo KS, tilt-driven Expression, vibrato jitter |

### public/ — Browser Dashboard

| File | Role |
|------|------|
| `dashboard.html` | Live performance dashboard at `http://localhost:3000`. Three.js 3D cube with per-vertex K#/complex/D/G/U labels, ghost cube showing S4 snap target (opacity = deviation), rotation gizmo. Panels: spell detection (buffer + partial progress + toasts), mode badges (seq/poly, palette, frozen), expression gauges (tilt/spin/dev/scramble), voice bar, vertex/complex cards, sieve strip, move log. Header: gyro smoothing slider (Kalman, default 0.2). WS client to relay. |


## Commands

```bash
npx tsx relay.js      # run full relay (BLE → engine → OSC)
npm test              # vitest (66 tests)
npm run test:watch    # vitest watch
npm run dev           # engine standalone (tsx)
npm run build         # tsc → dist/
npx tsc --noEmit      # type-check only
```

## Performance Model

### Core loop

Each physical cube turn:
1. Move enters **spell detector** (rolling buffer matched against 168 rotation variants of 7 canonical algorithms — 6 CFOP + Niklas commutator)
2. If spell detected → **mode manager** applies effect (see Spell System table below)
3. K_i cube advances (S4 right-multiplication → parameter permutation)
4. C_i cube advances (complex type permutation)
5. **Voice engine** emits active voices (1 in sequential, 8 in polyphonic mode)
6. **Expression processor** provides continuous gyro-derived control values
7. Full state broadcast to SC (OSC) + dashboard (WS)

### Voice Modes

- **Sequential**: one active vertex at a time, cycling through positions. Each turn plays one corner.
- **Polyphonic**: all 8 vertices sounding simultaneously. Each turn morphs the full ensemble.

### Spell System

Rubik's algorithms detected from the move stream trigger mode changes. The spell book covers **the 6 fundamentals needed to solve the cube under CFOP** plus Niklas — the archetypal 3-cycle commutator, included as the conceptual counterweight to CFOP. **Orientation-independent**: each canonical algorithm is expanded into all 24 whole-cube-rotation variants, so the same finger pattern is detected regardless of which faces it's performed on (e.g. sexy-move works as R U R' U', F R F' R', L D L' D', etc.). Spells **layer** — if a short spell is the prefix of a longer one, the short fires first and the long fires on completion. Turns always produce sound; spells are bonus triggers on top.

| Name | Canonical Algorithm | Moves | Role | Effect |
|------|--------------------|-------|------|--------|
| sexy-move | R U R' U' | 4 | CFOP F2L trigger | Toggle sequential/polyphonic |
| oll-cross | F R U R' U' F' | 6 | 2-look OLL: edges | Variant → drone |
| sune | R U R' U R U2 R' | 7 | 2-look OLL: corners | Toggle freeze |
| anti-sune | R U2 R' U' R U' R' | 7 | 2-look OLL: inverse corners | Palette → V1 |
| niklas | R U' L' U R' U' L | 7 | Commutator (corner 3-cycle) | Detection only — audio effect TBD (see `docs/revision_roadmap.md` D19) |
| u-perm | R U' R U R U R U' R' U' R2 | 11 | 2-look PLL: 3-edge cycle | Variant → burst |
| t-perm | R U R' U' R' F R2 U' R' U' R U R' F' | 14 | 2-look PLL: corners + edges | Reset variant + palette |

**Note**: inverse-sexy (U R U' R') is a rotation variant of sexy-move and fires under that name. The 4-move sledgehammer (R' F R F') was removed — the freeze-toggle effect it previously carried now lives on the 7-turn sune, a more deliberate gesture that's harder to trigger accidentally mid-phrase. 7 canonical × 24 rotations = 168 total patterns.

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
| `xk_swam.js` | v8 object (v3): OSC → midievent. SWAM KS model (12-switch `KS` map + `KS_CH`; Play Mode velocity-selected on KS C; Harmonics/Tremolo/Sordino/etc. latch toggles with stateful diffing). `COMPLEX` config table is the single source of truth per voice (play mode, envelope shape, vibrato baseline, bow pos/pressure, portamento, attack ramp/control). Expression is driven by per-complex envelope × intensity × path scalar (`scheduleExprEnvelope`); tilt is reassigned to ±10 Bow Position modulation. Vibrato on CC 19 with EMA on spin + 0.15 musical dead zone. Continuous 60 Hz CCs skip writes when `spin < 0.02` for ≥ 200 ms and throttle to 30 Hz otherwise. `cancelPhrase()` releases sounding notes before cancelling scheduled Tasks; `/xk/panic` flushes state; inactivity watchdog catches orphan notes after 3 s of silence. Legato note-ordering (20 ms overlap) and phrase generators per complex preserved. Pitches octave-folded into cello range (C2–F6; V2 widens to C1) via `CELLO_MIN`/`CELLO_MAX` + `foldToRange()` |
| `tester.maxpat` | Reference Max patch: the 4-object chain from the doc above (`udpreceive 57121` → `v8 xk_swam.js @autowatch 1` → `vst~ "SWAM Cello 3" 2` → `dac~`). Open this to drive SWAM from a live relay. |
| `tester1.maxpat` | Debug-harness variant of `tester.maxpat` with added message boxes (hand-fired `/xk/expr/*`, raw `midievent` CCs) and a `live.gain~` for isolated CC/midievent testing without a running relay. |

### Per-Turn Phrase Generation

Each `/xk/voice` triggers a **musical gesture**, not a single note. Phrase generators are dispatched by complex type:

| Type | Phrase |
|------|--------|
| C1 Pizz | Cloud of 2–5 plucked notes scattered over ≤700ms, short gates |
| C2 Bowed | Legato run of 2–4 notes (up to 5 in burst regime), portamento overlap |
| C3 Sustained | 1 main legato note + 0–2 soft grace notes on f+ intensity |
| C4 Harmonics | 2–5 airy flageolet touches across the duration, light velocity |
| C5 Wild gliss | 2 notes ≥5 semitones apart; fff adds compound gliss points (2–3 segments) |
| C6 Ordered gliss | 3–6 stepwise sieve walk with portamento |
| C7 Sustained slide | 1 main note + 1–3 micro-drifts (±3 semitones) across back half |
| C8 Ponticello | 2–4 re-bows on one pitch (SWAM KS Tremolo = Fast, vel-3 selector) |

All counts scale with intensity (`density` field in `INTENSITY_MAP`) and live `state.density` from the engine via shared `phraseCount(lo, hi)`.

Every phrase schedules its own auto-release timer (`scheduleRelease(dur)`) — no more infinite sustain. Release fades expression down over 5 steps × 80ms, then note-off. Turn events cancel any in-progress phrase and release before starting the next.

### OSC → SWAM MIDI Mapping (v3 implementation)

Full CC/KS numbers, intensity tables, and spell effect details live in `docs/swam_cello_reference.md`. Conceptual mapping:

- **Complex type → technique** (`COMPLEX` table): C1 Pizz, C2/C3 Arco (legato vs tasto), C4 Harmonics (KS F# vel-4 = Octave), C5–C7 Portamento, C8 near-bridge + Tremolo (KS G# vel-3 = Fast). Each complex also owns a `register:{lo,hi}` MIDI window — pickPitch folds into it so C1 pizz sits low-mid, C4 harmonics/C8 ponticello sit high, C3/C7 stay deep
- **Intensity → Expression peak + note velocity + bow-pressure scalar + phrase density**: 6-level table (p–fff); `bowMult` scales the complex's baseline bowPressure (fff digs, p lightens); `density` scales per-phrase note count via `phraseCount()`; envelope shape comes from `COMPLEX[n].exprEnv`
- **Path V1/V2 → Expression peak scalar**: V1 ×1.0, V2 ×0.7 (plus –12 transpose + widened fold window to C1)
- **Sieve → MIDI note pool**: offsets + 36 (C2); pitches octave-folded into cello range via `foldToRange(pitch, lo, hi)` with per-complex register bias (V2 shifts register `lo` down 12)
- **Tilt → Bow Position ±30** modulation around the complex's baseline (timbral sul tasto↔sul pont sweep)
- **Spin → Vibrato Depth + Rate**: EMA (α = 0.08) + musical dead zone at 0.15, added on top of per-complex baseline
- **Deviation → Bow Pressure ±25** modulation around the complex's baseline (not overwrite), + Bow Speed for types that don't own speed
- **Scramble**: no continuous CC binding yet — complex owns bow position. Sul tasto / sul pont KS were removed in v3.10; Phase 6 now drives Bow Position (CC 16) directly from scramble thresholds instead
- **Regime → Attack Ramp multiplier**: contemplative ×1.2, conversational ×1.0, burst ×0.5 (applied to complex baseline, written once on regime/complex change)
- **Path → (future) timbral shift via Bow Position bias** (Section Size KS removed in v3.10)
- **Spells**: `sexy-move` bow-pressure accent → restore via `setupComplex`, `oll-cross` harmonic ping (KS F# vel-4 = Octave, restore), `sune` freeze toggle (CC 64), `anti-sune` bright-bow nudge + restore, `u-perm` short-gate staccato burst, `t-perm` full reset, `niklas` detection-only stub

### 60 Hz transmission deadband

Continuous CCs (Bow Position, Bow Pressure, Bow Speed, Vibrato Depth/Rate) only fire at 60 Hz while the cube is moving. When `state.spin < 0.02` for ≥ 200 ms, writes are skipped (last value holds in SWAM — stops vibrato wobble / bow flutter during rest). Above threshold, frames are coalesced in pairs (effective 30 Hz). Expression (CC 11) is envelope-driven, unaffected by the deadband.

### Panic & watchdog

- `/xk/panic` from the relay (emitted on WS-disconnect) → `bang()` — flushes all notes and CCs.
- Inactivity watchdog (1 s tick): fires `allNotesOff()` only when all four hold — active notes, no release task pending, no scheduled phrase events, and no `/xk/voice` for ≥ 3 s. Long C3/C7 sustained notes pass through cleanly because their `releaseTask` keeps the second guard false.

### Humanization

- **Velocity**: ±15% jitter + accent (+8) every 3rd turn
- **Pitch**: 10% chance of ±1 semitone shift
- **Timing**: 0–30ms micro-delay between phrase notes

### Keyswitches — SWAM Cello 3 v3.10 (post D24/D27 migration)

Full 12-switch map on `KS_CH`, KS Octave = C0 (MIDI 24–35), 50 ms hold. v3.10 moved most controls from latch-toggles to **velocity-selectors**, and removed Sordino, Sul Tasto, Sul Ponticello, and Section Size from the KS plane entirely:

```
KS C  (24) PLAY_MODE      vel-3 = Bow / Pizz / Col Legno
KS C# (25) MANUAL_BOWING  preset-controlled — never write
KS D  (26) GESTURE_MODE   vel-3 = Expression / Bipolar / Bowing  (PIN to Expression)
KS D# (27) ALT_FINGERING  latch
KS E  (28) BOW_LIFT       latch
KS F  (29) BOW_START      latch
KS F# (30) HARMONICS      vel-4 = Off / Octave / Octave+5th / Control
KS G  (31) KEEP_BOW_DIR   latch
KS G# (32) TREMOLO        vel-3 = Off / Slow / Fast
KS A  (33) TREMOLO_MODE   preset-controlled — never write
KS A# (34) (unassigned base; Page-2 modifier combo target)
KS B  (35) PAGE_MODIFIER  hold for B+x advanced combos
```

Velocity-select KS route through `setEnum(field, ks, target, optionCount)` using `velForOption(idx, n)` to land inside SWAM's KS Velocity Remap bands. `setEnum` diffs by option index, so re-asserting current state is a no-op (no inversion risk). `bang()` pins Gesture Mode = Expression so CC 11 is never silently reinterpreted as bow direction/displacement (which would silently break the Expression envelope and portamento feel).

**Removed in v3.10**: Sordino → GUI/CC-only; Sul Tasto / Sul Ponticello → driven by Bow Position (CC 16); Section Size → concept removed. The pre-v3.10 bridge mapped SORDINO=30 / SUL_TASTO=31 / SUL_PONT=32 / HARMONICS=33 / TREMOLO=34 — under v3.10 those notes mean Harmonics, Keep Bow Direction, Tremolo, Tremolo Mode, and (unassigned). This was D24's root cause: bridge thought it was sending Harmonics/Tremolo, was actually sending Tremolo Mode + an unassigned KS, so C4 harmonics and C8 tremolo never sounded. COMPLEX C4 now declares `harmonics: HARMONICS.OCT` and C8 declares `tremolo: TREMOLO.FAST`; setupComplex calls `setEnum` on every change.

SWAM preset prereqs: KS Octave = C0, Vibrato Rate MIDI-Learned to CC 19, Bow-page params MIDI-Learned per `docs/swam_cello_reference.md`. `docs/revision_roadmap.md` D27 + Phase 13 covers the migration; remaining Phases 6–8 / 10–12 carry forward.

**Absent-param feature flags (SWAM Cello 3 v3.11)**: no Bow Speed or Attack Ramp knobs exist. Attack Control exists but as a **4-mode selector** (`vel.soft / vel.hard / expression / mix vel. expr.`), not a continuous 0–127 ramp — set it once in the preset to `expression` (or `mix vel. expr.`) so CC 11 envelope shaping drives attack for free. `max/xk_swam.js` gates all three via `HAS_BOW_SPEED / HAS_ATTACK_RAMP / HAS_ATTACK_CONTROL` (default `false`) — `cc()` and `ccForce()` early-return on ungated CCs, so setupComplex/regime/expression/spell call sites are all covered at the helper layer.

### Max MCP Bridge (live patch access)

Claude Code can inspect and edit the running Max patch via the `maxmsp` MCP server at `MaxMSP-MCP-Server/` (project-scoped, registered in `.mcp.json`). Use the **`max-patch` subagent** (`.claude/agents/max-patch.md`) for any patch work — it has the MCP tools scoped in and knows the XenaKube patch conventions.

**Prerequisite**: open `MaxMSP-MCP-Server/MaxMSP_Agent/demo.maxpat` in Max 9+, click `script npm install` (first time), then `script start` on the agent tab. Without this, MCP tools error out on connect.

**Tools exposed** (only the subagent should call these directly):

| Tool | Purpose |
|------|---------|
| `get_objects_in_patch` | Dump all objects + patch cords in the frontmost patch |
| `get_objects_in_selected` | Only currently-selected objects |
| `get_object_attributes` | Attribute name/value pairs for a given `varname` |
| `list_all_objects` / `get_object_doc` | Discover + look up Max object documentation |
| `add_max_object` / `remove_max_object` | Create/delete objects (requires `varname`) |
| `connect_max_objects` / `disconnect_max_objects` | Patch-cord edits by outlet/inlet index |
| `set_object_attribute` / `set_message_text` / `set_number` | Mutate object state |
| `send_bang_to_object` / `send_messages_to_object` | Trigger events |
| `get_avoid_rect_position` | Bounding rect to avoid when placing new objects |

**Boundary**: the XenaKube patch should stay thin — the 4-object chain in the diagram above plus `print xk_swam`. New routing/logic belongs in `max/xk_swam.js`, not in new Max objects. The subagent enforces this.

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
| `/xk/voice` | int, int, float, string, float | vertexIdx, complexType, density, intensity, duration — fires only on real voice transitions (from `engine.onVoice`, not per gyro packet) |
| `/xk/panic` | — | emitted by relay on WS-disconnect; bridges flush all notes + CCs |
| `/gan/turn` | string | move (e.g. "R", "U'", "F2") — port 8000 to TD |
| `/gan/gyro` | float×4 | quaternion — port 8000 to TD |

## Not Yet Implemented

- **Polyphonic SC output**: voice-engine supports poly mode but SC only handles sequential. Max/SWAM bridge handles poly via note stacking.
- **SC expression receivers**: `/xk/expr/*` messages are emitted at 60Hz but SC doesn't yet map them to synthesis params (only C5 brightness and C8 detuning via raw gyro).
- **SC spell reactions**: `/xk/spell` is sent but SC has no OSCdef for it yet.
- **Palette switching**: mode manager tracks palette name but no multi-palette SC code exists.
- **Speed regime adaptation**: turn-rate tracker detects regime; contemplative mode polished (Phase 2 done), but conversational/burst SC behavior not yet implemented. See `docs/todo.md` Phases 3–4.
- **Scramble arc (burst mode)**: scramble factor wired to SC reverb mix (Phase 2). Max bridge no longer maps scramble → bow position directly (the `COMPLEX` table owns bow position; scramble is reserved for Phase 6 KS latches of sul tasto / sul pont). Full burst-mode arc (scramble as master decrescendo parameter) not yet implemented (Phase 4).
- **TouchDesigner**: TD receives raw `/gan/*` on port 8000. No `.toe` project exists.
- **SWAM bridge Phases 6–12 (mixed state)**: Phases 0–5 + 9 of `docs/revision_roadmap.md` landed.
  - **Phase 6 (pending)** — wire unused KS (Sordino on freeze, Sul Tasto/Pont on scramble thresholds, Alt Fingering on tetra, Section Size on path, Pizz Polyphony init)
  - **Phase 7 (pending)** — V2 fold-window polish. Sub-task "CC 75 Attack Control spell spikes" is **obsolete** in SWAM v3.11 (Attack Control is a 4-mode selector, not a continuous ramp; use the CC 11 envelope path instead).
  - **Phase 8 (pending)** — note-off velocity from turn rate
  - **Phase 10 (open, likely upstream)** — harmonics (C4) and tremolo (C8) KS latches never fire during play. D24: hypothesis is voice-engine rarely emits complex 4/8. Needs Max-console log check (`complex -> C4` / `-> C8`) to confirm before audit of `src/voice-engine.ts` + `src/complexes.ts`.
  - **Phase 11 (open)** — ghost-cube calibration. D25: `ghostViewOffset` in `public/dashboard.html:1075` is render-only. Needs WS `set_snap_calibration` message → `engine.setSnapCalibration(quat)` → applied in `src/quaternion.ts` before `nearestS4` and deviation computation.
  - **Phase 12 (optional)** — pitch-bend glissando path for wide-interval C5 moments (D26), only if C5 compound-gliss segments (D22) still feel under-delivered.
  - **Prereq before any listening test**: save `xenakube_cello.swampreset` with KS Octave = C0, KS MIDI Channel = 2, Bow-page CCs MIDI-Learned (CC 16/17/18), Vibrato Rate MIDI-Learned to CC 19, Attack Control = `expression` or `mix vel. expr.`, and **`Portamento Control = CC (P.MaxTime)` on the Advanced → MIDI page** (D20 — otherwise CC 5 writes are silently ignored and no glissando responds). CC 20 / 73 / 75 gated off by feature flags — no Learn needed.
- **Niklas audio effect**: spell detection + `/xk/spell niklas` emission shipped; audio effect deferred (three candidates in `docs/revision_roadmap.md` D19 — pick after first listen).

