# CLAUDE.md

## Self-Maintenance

When you change code, update the affected section of these docs in the same commit; keep the terse style and don't add disclaimers to stale content — fix it:

- **`CLAUDE.md`** (this file) — architecture, file roles, OSC reference, commands.
- **`CHANGELOG.md`** — dated entry per user-visible change (Added/Changed/Fixed).
- **`docs/todo.md`** — tick off done items; add new todos as they emerge.
- **`docs/research_notes.md`** — design-rationale changes, new mappings, primary-source mapping notes.
- **`docs/revision_roadmap.md`** — SWAM-bridge diagnoses (D*) and phase progress.
- **`docs/swam_cello_reference.md`** — authoritative SWAM parameter/CC/KS reference.
- **`README.md`** — only user-facing setup / top-level description changes.

Implementation status and pending phases live in `docs/revision_roadmap.md` and `docs/todo.md`, not here.

## Project Overview

**XenaKube** — real-time instrument: GAN i4 smart Rubik's cube → sound synthesis + visuals. Cube turns are musical events; Rubik's algorithms are "spells" that trigger musical gestures. Built on S4 group math (24 cube rotation symmetries) inspired by Xenakis' *Nomos Alpha*.

Primary source: `docs/xenakis_nomos_alpha_primary_source.md` (*Formalized Music* pp. 214–237). Design rationale and performer-frame discussion: `docs/research_notes.md` — see especially "Performer's Frame — Agency vs Chance."

**Current architectural direction**: **Temporal Identity framework** — each of 12 face-moves (L/L'/R/R'/F/F'/B/B'/U/U'/D/D') owns a distinct gesture *type* fixed to the cube's color-fixed face identity; K_i / C_i permutation modulates *content* (pitch, timbre, intensity) inside that shape. Performer's forward model: you know the *kind* of sound a turn will produce, you don't know the *detail*. Phase A1 framework landed 2026-04-18 (`src/face-gesture.ts`, `/xk/face` OSC, SWAM bridge duration/transpose modulation). Phrase-shape sculpt pass, A2 solve-anchor, Phase B phrase library, and Phase C dashboard split still pending — see `docs/todo.md`. Sections below affected by the pivot are flagged inline.

## Commands

```bash
npx tsx relay.js      # run full relay (BLE → engine → OSC)
npm test              # vitest
npm run test:watch    # vitest watch
npm run dev           # engine standalone (tsx)
npm run build         # tsc → dist/
npm run gen:max       # regenerate max/gen_includes.js from TS sources
npx tsc --noEmit      # type-check only
```

## OSC Reference

`/xk/*` → Max (57121). `/gan/*` → TD (8000). Multi-message state burst on every cube turn and at BLE gyro rate (~10 Hz). `/xk/gyro`, `/gan/gyro`, `/xk/expr/*` at 60 Hz from the relay's Kalman loop. `/xk/voice` fires only on real voice transitions (from `engine.onVoice`, not per gyro packet). `/xk/spell` on algorithm detection. Full `XenaKubeState` JSON broadcast to all WS clients on every state change.

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
| `/xk/solve` | — | fires once on unsolved → solved edge (GAN FACELETS report) |
| `/xk/rate` | float | turn rate (turns/sec) |
| `/xk/regime` | string | 'contemplative' / 'conversational' / 'burst' |
| `/xk/expr/{tilt,spin,dev,scramble}` | float (0-1) | 60 Hz continuous controls |
| `/xk/spell` | string | spell name on detection |
| `/xk/face` | string | face identity ('L'/'L\''/'R'/'R\''/'F'/'F\''/'B'/'B\''/'U'/'U\''/'D'/'D\'') — fires on turns that match one of the 12 face-moves, BEFORE `/xk/voice`; non-face moves (half-turns, diagram advance) skip it |
| `/xk/voice` | int, int, float, string, float | vertexIdx, complexType, density, intensity, duration |
| `/xk/panic` | — | relay WS-disconnect; bridges flush notes + CCs |
| `/gan/turn` | string | raw move (e.g. "R", "U'", "F2") — port 8000 |
| `/gan/gyro` | float×4 | raw quaternion — port 8000 |

## Architecture

*Structural* composition math in TypeScript (`src/`) — S4, K_i, C_i, sieve, face-identity, voice / duration / intensity decisions. *Phrase-level* note-generation (pitches inside `foldToRange`, rebow counts, per-complex stochastic contours) currently lives in `max/xk_swam.js`; planned migration to TS is tracked as Phase B + Phase E tier 3 (`docs/research_notes.md` → "Two-Brain Architecture"). Max/MSP + SWAM Cello 3 = synthesis via MIDI (physical-modeling cello VST). TouchDesigner/browser = visuals only.

**Shared source of truth**: OSC address constants live in `src/osc-schema.ts`; SWAM enums / CC value maps / INTENSITY_MAP / ENV_PROFILE / ART_OFF_VEL / MOTION_NUDGE / FACE_MAP / REGIME_* multipliers live in `src/swam-mapping.ts`. TypeScript imports them directly (typed + vitest-covered); `max/gen_includes.js` is a committed codegen output of the same tables — Max `include()`s it at v8 load. Regen with `npm run gen:max` after any TS edit; then reload the v8 object in Max. Drift between the two sides is the single largest source of silent bugs, so never hand-edit `max/gen_includes.js` or add new `/xk/*` string literals outside `src/osc-schema.ts`.

```
GAN i4 (BLE) → Chrome Web Bluetooth → relay.js (Node)
                                          │
                                    XenaKubeEngine (TS)
                                    ┌─────┼──────────────┐
                                    │     │              │
                              SpellDetector  VoiceEngine  ExpressionProcessor
                                    │     │              │
                                    ▼     ▼              ▼
                              ModeManager  OSC:57121    OSC:8000  WS
                              (state machine) Max/SWAM    TD     Dashboard
```

**relay.js** — BLE-to-OSC bridge. Instantiates `XenaKubeEngine`, serves `public/dashboard.html` on `:3000`, receives cube events via WS from the browser. Run: `npx tsx relay.js`. Deps: `node-osc`, `ws`, `tsx`.

- **Gyro upsampling**: BLE ~10 Hz → 60 Hz via velocity-aware quaternion Kalman filter (smoothing slider 0–1, default 0.5). 60 Hz loop uses `process.hrtime.bigint()` spin timer — `setInterval` drifts to ~40 Hz on Windows. OSC (Max / TD) gets `kf.q` — low-latency, predict-based. The dashboard `gyro_tick` WS message gets a separately-computed SLERP-interpolated quat trailing BLE by `VISUAL_DELAY_MS` (default 120 ms) from a raw-sample ring buffer — sacrifices latency for zero extrapolation artefacts on static holds. Full engine-state bursts (`state` / `gyro_state`) still fire at BLE rate via `engine.onGyro`.
- **Control messages** (WS → relay): `set_diagram`, `clear_diagram`, `set_mode`, `reset`, `get_diagrams`, `set_gyro_smoothing`, `cube_solved` (browser detects FACELETS==solved on the unsolved→solved edge and reports; relay fires `/xk/solve`), `zero_gyro` (mirrors the dashboard's visual zero — captures `engineGyroZeroInv = conj(kf.q)` so the engine's S4 snap cells re-center on the user's rest pose; fires on auto-zero and the Zero Gyro button).
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
| `voice-engine.ts` | Sequential (1 voice) vs polyphonic (8 voices) output decision; stamps `face` on each VoiceOutput |
| `face-gesture.ts` | Phase A1 Temporal Identity — 12-face signature table + modulation-rule helpers (pitch class / register / parity / intensity) |
| `expression.ts` | Gyro quaternion → continuous control values (tilt, spin, deviation, scramble) |
| `mode-manager.ts` | Performance state machine: voice mode, palette, variant, freeze; spell effects |
| `turn-rate.ts` | Circular buffer → EWMA rate → regime classification with hysteresis |
| `kinematic.ts` | Graph paths through S4: pre-composed diagrams + free traversal |
| `sieve.ts` | L(m,n) logical function, prime residual classes mod 18, metabola mutations |
| `quaternion.ts` | Gyro → nearest S4 snap, deviation factor |
| `osc-output.ts` | Engine state → OSC message batches (uses `OSC.*` constants — no raw literals) |
| `osc-schema.ts` | Single source of truth for every `/xk/*` / `/gan/*` address + `vertexAddr()` / `complexAddr()` helpers. Codegen'd into `max/gen_includes.js`. |
| `swam-mapping.ts` | Shared SWAM mapping: enums (HARMONICS / TREMOLO / BOW_POLY), CC value maps, INTENSITY_MAP, ENV_PROFILE, ART_OFF_VEL, MOTION_NUDGE, FACE_MAP builder, REGIME_* multipliers, pure helpers (`harmonicsForC4`, `faceShapedCount` ingredients, `stepVelScale`, `commitSieveWalk`, `faceTranspose`). Vitest-covered. Codegen'd into `max/gen_includes.js`. |
| `types.ts` | Shared type definitions |
| `index.ts` | Public API re-exports |

### docs/ — Documentation

| File | Role |
|------|------|
| `xenakis_nomos_alpha_primary_source.md` | *Formalized Music* pp. 214–237 full text |
| `research_notes.md` | References, design rationale, Xenakis→XenaKube mapping, further reading |
| `todo.md` | Phased implementation roadmap (contemplative / conversational / burst) |
| `swam_cello_reference.md` | Authoritative SWAM v3.8+ parameter / CC / KS reference |
| `revision_roadmap.md` | SWAM-bridge refactor diagnoses D1–D39 (refactor complete; new architectural work tracked in `todo.md`) |

### public/ — Browser Dashboard

`dashboard.html` at `http://localhost:3000`. **Full-viewport HUD**: `#cube-canvas` fills the window; all UI floats as transparent overlays. Three.js 3D cube with per-vertex K#/D/G/U labels, ghost cube showing S4 snap target (opacity = deviation). WS client to relay. Pixel/zoom values live in the CSS (L48-60).

Overlay regions:
- **Top-left column** (`.ovl-tl`): title + MAC/connect (button turns green via `.connected`), mode badges, active K/C cards.
- **Bottom-left column** (`.ovl-bl`, sibling of `.ovl-tl`, anchored `bottom: 110px`): **State** panel (face, active voice, S4 element, path, step, snap, complex phase, orbit, scramble, permutation) then **Expression** panel (Zero Gyro + smoothing slider + tilt/spin/deviation/scramble). `zoom: 0.5` applies per-child, not on the wrapper — keeps the bottom anchor zoom-invariant so the stack never overlaps the sieve strip or the K/C cards regardless of browser zoom.
- **Top-center**: spell buffer + spell notification + Phase E tier-1 notation strip (VexFlow 4.2.3, CDN) — rolling 8-note bass-clef staff re-rendered on every `voice` WS event. Pitch mirrors `pitchClassMod` from `src/face-gesture.ts` + face registerBias; articulation from face envelope; dynamics from voice intensity. Archetypal only — does not reflect what SWAM plays inside `phraseCX`; tier 3 rebuild is gated on the Max→TS note-generation migration in `docs/todo.md` Phase E.
- **Top-right**: cam/live/ghost rotate toggles, then rotation gizmo.
- **Bottom**: full-width sieve piano-roll (C2–C6).

Only the active K/C cards render; the 8-vertex/complex grids and legacy controls are populated but hidden via `.ovl-legacy`.

## Performance Model

### Core loop

Each physical cube turn:
1. Move → **spell detector** (168 rotation variants of 7 canonical algorithms)
2. If spell matched → **mode manager** applies effect
3. K_i advances (S4 right-multiplication → parameter permutation)
4. C_i advances (complex type permutation)
5. **Voice engine** emits active voices (1 in sequential, 8 in polyphonic)
6. **Expression processor** supplies continuous gyro-derived controls
7. State broadcast to Max (OSC) + dashboard (WS)

### Voice Modes

- **Sequential**: one active vertex at a time, cycling through positions.
- **Polyphonic**: all 8 vertices sound simultaneously; each turn morphs the ensemble.

### Spell System *(current = mode-toggles; pivoting to phrase-library per Temporal Identity direction)*

Rubik's algorithms detected from the move stream currently trigger **mode changes** (toggle polyphony, flip path, adjust palette). The spell book covers the 6 CFOP fundamentals plus Niklas (archetypal 3-cycle commutator). Algorithms are **orientation-independent** — each is expanded into all 24 whole-cube-rotation variants at load time, so the same finger pattern fires on any face pair. Spells **layer**: a shorter spell that's a prefix of a longer one fires first; the long one fires on completion. Turns always produce sound; spells are bonus triggers on top.

**Planned pivot**: grow from 7 mode-toggles to ≈20 *compositional* phrases (each a short musical macro — "rising arco arpeggio," "pizz cluster," "harmonic fanfare," "descending sul pont line"). Mid-spell the per-turn face-voices get suppressed and the spell's phrase plays whole. Effects column below is the current behavior, not the target.

| Name | Canonical Algorithm | Moves | Role | Effect |
|------|--------------------|-------|------|--------|
| sexy-move | R U R' U' | 4 | CFOP F2L trigger | Toggle sequential/polyphonic |
| oll-cross | F R U R' U' F' | 6 | 2-look OLL: edges | Variant → drone |
| sune | R U R' U R U2 R' | 8 | 2-look OLL: corners | Harmonic ping → OCT_5TH (perfect 12th) |
| anti-sune | R U2 R' U' R U' R' | 8 | 2-look OLL: inverse corners | Palette → V1 |
| niklas | R U' L' U R' U' L | 7 | Commutator (corner 3-cycle) | Toggle path V1 ↔ V2 + CTRL harmonic ping |
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
- **Move mapping**: face turns → whole-cube S4 rotations. R and L' produce the same element — 18 moves collapse to ~9 distinct S4 elements. *Temporal Identity pivot restores the discarded face-identity information as the primary sound-bearing signal, running parallel to S4 (S4 still drives K_i / C_i permutation, which now modulates gesture content rather than selecting it).*
- **α/β/γ cycle**: C_i mapping rotates every 3 substitutions.
- **Sieve L(m,n)**: pitch sets from prime residual classes mod 18; metabola every 3 subs.
- **Tetra orbits**: 12 even (preserve tetrahedra) + 12 odd (swap).

## Max/MSP — SWAM Cello Bridge

Synthesis layer: SWAM Cello 3 (Audio Modeling physical-modeling VST) driven via MIDI from a Max/MSP bridge on port 57121. **v4 instance-pool architecture (D40, 2026-04-20)** — each voice event allocates one SWAM instance from a pool of `POOL_SIZE = 8`; overlapping turns stack as overlapping SWAM voices so a fast sexy-move can layer ~4 independent cello materials without any one instance's KS/CC state contending with another.

### Patch (poly~ instance pool)

```
[udpreceive 57121] → [v8 xk_swam.js @autowatch 1] → outlet 0 → [poly~ swam_voice @parallel 1 @voices 8]
                                                    outlet 1 → [print xk_swam]
                                                                                                  ↓
                                                                                          [dac~ 1 2]
```

**Outlet architecture (2026-04-21)**: v8 has 2 outlets — outlet 0 emits `target N` + `midievent …` pairs for ALL voices down a single wire; poly~ routes to voice N on receipt. Previously one outlet per instance (9 outlets for pool=8); the collapse means changing `POOL_SIZE` no longer requires rewiring the patch.

Inside `swam_voice.maxpat` (poly~ subpatch, per-voice): `[polymidiin] → [midiparse] (midievent outlet) → [vst~ "SWAM Cello 3" 2] → [out~ 1 2]`. **Must be `polymidiin + midiparse`, NOT regular `[in]`** — the subpatch's `[in]` only passes signal; polymidiin routes MIDI from the parent's outlet into the voice. Each VST instance's preset must be set manually inside the SWAM GUI (saved as `default`) since poly~ voices don't share plugin state.

Max 9 removed the global Parallel DSP preference; `@parallel 1` on poly~ is now the explicit multi-threading opt-in. Empirically 8 instances cap Max DSP CPU around 40% on an i7-8700K while wildly turning the cube.

**Pool size** — edit `POOL_SIZE` at the top of `xk_swam.js` and reload the v8 object; no patch re-wiring needed. The `[poly~ swam_voice @voices N]` attribute must match.

### max/ Directory

| File | Role |
|------|------|
| `xk_swam.js` | v8 object: OSC → midievent routed to a pool of SWAM instances. **v4 instance-pool (D40)** — every `/xk/voice` calls `allocateInstance()` (IDLE → oldest RELEASING → oldest PLAYING voice-stealing order); the resulting `inst` is threaded through every MIDI helper (`noteOn/noteOff/cc/ccForce/rampCC/keyswitch`), every selector diff (`setPlayMode/setHarmonics/setTremolo/setBowPolyphony/setEnum`), every phrase generator (`phraseC1..C8`), and every scheduling primitive (`scheduleAt/scheduleRelease/scheduleExprEnvelope`). Each instance has its own `voice` number (1-indexed `target N` routed via a single shared outlet), `ccCache`, `activeNotes`, `phraseTasks`, `releaseTask`, `ccRampTasks`, `ksPending`, selector state, voice-shot snapshots (intensity / density / duration / path / transpose / tetra / face*), and status lifecycle (IDLE → PLAYING → RELEASING → IDLE driven by `scheduleRelease`'s fade). Global state stays shared for the sieve walker (Xenakian pitch-set coherence across voices), regime, live gyro (tilt/spin/dev/scramble), and the latest face mapping; continuous CC handlers iterate active instances so the cube's orientation shapes every sounding voice using each instance's own active complex. Spell pings (oll-cross / sune / niklas / u-perm) allocate via `allocateSpellPing()` (→ `allocateInstance()`) so they respect MAX_ACTIVE — at cap a ping voice-steals instead of stacking on top of inst 0's current phrase. Accent spells (sexy-move / anti-sune) ride `state.lastAllocatedInstance` so the accent lands on a currently-sounding cello. `stealInstance` hard-zeros CC 11 + sends CC 120 All Sound Off + CC 123 All Notes Off so the stolen instance truly silences (otherwise SWAM's internal bowed-mode release envelope can sustain for 2–10 s after our noteOff). `max_active N` message on the v8 inlet live-sets MAX_ACTIVE, clamped to [1, POOL_SIZE] — wire a `[number]` or `[live.dial]` → `[prepend max_active]` → the v8 inlet. **SWAM v3.10 KS plane** (velocity-select via `setEnum` + `velForOption`) for Play Mode / Gesture Mode / Alt Fingering; Harmonics + Tremolo via CC 78 / CC 79 (D31); Tremolo Min Speed via CC 80 as per-phrase stochastic envelope (D39, supersedes D38): voice onset rolls 1/3 slow→fast ramp / 1/3 fast→slow ramp / 1/3 steady, ramps driven by `rampCC` across `duration * 1000` ms. Bow Polyphony via CC 81 — per-complex `Double/Hold` default, gliss complexes `Mono Poly Release` (D35). `COMPLEX` config table is the per-voice source of truth. Expression = per-complex envelope × intensity × path scalar, slewed through `rampCC` (D33) so CC 11 interpolates between stages. Gliss phrases (C5/C6/C7) use `glissNote` (low-vel overlap) to trigger SWAM portamento; `legatoNote` stays for attack notes and non-gliss legato (D34). Spin-deadband on 60 Hz CCs; `/xk/panic` + per-instance inactivity watchdog for cleanup. Pitches folded into cello range via `foldToRange(pitch, lo, hi)`. **Phase A1 face-gesture dispatch (2026-04-18 / sculpt 2026-04-21):** `/xk/face <face>` loads a `FACE_MAP` entry (durationBias / registerBias / envelope / articulation / motion) plus `ENV_PROFILE` / `ART_OFF_VEL` / `MOTION_NUDGE` tables into `state.face*`; `handleVoice` snapshots these (including categorical `faceEnvelope` / `faceMotion`) onto the allocated instance so later face messages don't retroactively reshape an in-flight phrase. **Phrase-shape sculpt (2026-04-21):** `phraseC1..phraseC8` consult `faceShapedCount(inst, lo, hi, forGliss)` — `ENV_PROFILE.isSingle` (pluck/stab/drone) collapses the rebow chain to a single note (gliss complexes collapse to zero subsequent gliss, keeping the anchor legato); `ENV_PROFILE.countMult` (burst ×1.8) thickens density — and `stepVelScale(velCurve, i, count)` shapes per-step velocity across multi-note phrases (swell cresc, fade dim, stab/burst accent-first). `commitSieveWalk(count, motion)` honours the face's `up`/`down` to force sieve-walker direction on C2/C6. `scheduleExprEnvelope` scales the complex's attack/peak/sustain by `ENV_PROFILE.{attackCoef, peakCoef, sustainCoef}` so CC 11 traces a face-specific contour on top of the complex's base shape. **Duration discipline (2026-04-22):** `handleVoice` clamps `duration` to ≤30 s after the face-bias multiply (Xenakis V2 ceiling); every `phraseCX` calls `scheduleRelease(inst, dur)` with no phrase-level multiplier stack, so a voice's sounding time is exactly `duration + fade`. `MAX_ACTIVE = 2` soft cap (decoupled from `POOL_SIZE = 8`) gates `allocateInstance()` — at cap, the IDLE branch is skipped and a voice steals the oldest RELEASING/PLAYING, giving a two-voice legato halo rather than an 8-voice cloud. **Tier 1 unification (2026-04-21):** OSC addresses + all mapping tables (enums, INTENSITY_MAP, ENV_PROFILE, ART_OFF_VEL, MOTION_NUDGE, FACE_MAP, LEGATO_COMPLEX, REGIME_* multipliers) come from `include("gen_includes.js")`, not hand-duplicated locally. |
| `gen_includes.js` | **Generated** by `scripts/gen-max-include.js` from `src/osc-schema.ts` + `src/swam-mapping.ts` + `src/face-gesture.ts`. Committed to git (Max can't run tsx). Holds OSC address strings, SWAM enums, CC band centers, INTENSITY_MAP, ENV_PROFILE, ART_OFF_VEL, MOTION_NUDGE, FACE_MAP, LEGATO_COMPLEX, REGIME_* multipliers. Regenerate with `npm run gen:max` after editing TS sources; then reload the v8 object in Max. **Do not hand-edit.** |
| `swam-voice.maxpat` | poly~ voice subpatch: `[polymidiin] → [midiparse] midievent → [vst~ "SWAM Cello 3" 2] → [out~ 1 2]`. Each voice loads its SWAM preset manually at first open; save as `default`. |
| `tester3.maxpat` | Debug harness: message boxes for hand-fired `/xk/face`, `/xk/voice`, `/xk/expr/*`, and raw `midievent` CCs. |
| `ks_logger.js` | Optional pass-through v8 between `xk_swam.js` and `vst~`. Toggleable (`on`/`off`/`dump`). Captures raw `midievent` with timestamps; `dump` prints KS-only timeline (field, option guess, Δprev, Δfield) plus non-KS summary + full JSON for LLM review. Use for diagnosing KS glitches (flashing harmonics / tremolo). |

### Conceptual mapping

- **Complex type → technique** (COMPLEX table): C1 Pizz, C2/C3 Arco, C4 Harmonics (CC 78), C5–C7 Portamento, C8 near-bridge + Tremolo (CC 79). Each complex owns a `register: {lo, hi}`, a `tremoloRate` baseline (CC 80), and per-stage `exprEnv.{attackRampMs, sustainRampMs, releaseRampMs}`.
- **C4 harmonic mode → path × tetra-orbit** (D37): C4 rotates per voice across OCT / OCT_5TH / CTRL via `harmonicsForC4()`. V1+even = OCT, V1+odd = OCT_5TH, V2+even = OCT_5TH, V2+odd = CTRL. OFF is reserved for every non-C4 complex.
- **Intensity → Expression peak + note velocity + bow-pressure scalar + phrase density + tremolo-rate scalar** (6-level INTENSITY_MAP).
- **Path V1/V2 → Expression peak scalar** (V2 × 0.7) + tremolo-rate × 0.85 on V2 + widened V2 fold window.
- **Tilt → Bow Position ±30** around the complex baseline (timbral sul tasto↔pont sweep).
- **Spin → Vibrato Depth/Rate** (CC 19; EMA α = 0.08, musical dead zone at 0.15). Tremolo Min Speed (CC 80) is no longer spin-coupled — D39 replaced the D38 continuous modulator with a per-phrase stochastic ramp (slow→fast / fast→slow / steady, picked at voice onset).
- **Deviation → Bow Pressure ±25** modulation around the complex baseline.
- **Regime → Attack Ramp multiplier** (contemplative 1.2 / conversational 1.0 / burst 0.5) **and Expression-ramp multiplier** (contemplative 1.5 / conversational 1.0 / burst 0.4, D33).
- **Spells** route through `setupComplex(active)` for idempotent restore.

See `docs/swam_cello_reference.md` for CC/KS numbers, KS Velocity Remap bands, preset prerequisites, and v3.10/v3.11 migration notes. `docs/revision_roadmap.md` D1–D40 document every mapping decision.

### v3.10 plane, one-liner

Play/Gesture/Alt Fingering via KS velocity-select (`setEnum`, diff by option index); `bang()` pins Gesture Mode = Expression. Harmonics/Tremolo via CC 78/79 (D31: KS is 2-band, Off unreachable). Tremolo Min Speed via CC 80 — per-phrase stochastic envelope (D39, supersedes D38's continuous spin modulator): each tremolo voice rolls 1/3 slow→fast ramp / 1/3 fast→slow ramp / 1/3 steady at onset, ramps driven by `rampCC` over `duration * 1000` ms; no gyro coupling on CC 80. CC 11 Expression also interpolated via `rampCC` slew limiter (D33). Bow Polyphony via CC 81 per-complex (D35: `Double/Hold` default, `Mono Poly Release` for C5–C7 gliss). `HAS_HARMONICS_CC`/`HAS_TREMOLO_CC`/`HAS_TREMOLO_RATE`/`HAS_BOW_POLY_CC` gate CC with KS fallback (Bow Polyphony has no KS fallback — page-modifier combo); `HAS_BOW_SPEED`/`HAS_ATTACK_RAMP`/`HAS_ATTACK_CONTROL` default `false` to gate v3.11-absent knobs at the `cc()` helper. Full parameter map, KS bands, and v3.10/v3.11 migration: `docs/swam_cello_reference.md`.

### Max MCP Bridge

Claude Code can inspect and edit the running Max patch via the `maxmsp` MCP server at `MaxMSP-MCP-Server/` (registered in `.mcp.json`). **Always route patch work through the `max-patch` subagent** (`.claude/agents/max-patch.md`) — it has the MCP tools scoped and knows the XenaKube patch conventions.

Prerequisite: open `MaxMSP-MCP-Server/MaxMSP_Agent/demo.maxpat` in Max 9+, `script npm install` (first time), then `script start`.

**Boundary**: keep the XenaKube patch thin — the 4-object chain above plus `print xk_swam`. All new routing/logic belongs in `max/xk_swam.js`, not in new Max objects.
