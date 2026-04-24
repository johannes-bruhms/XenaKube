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

### Recurring-bug discipline

If a symptom has been "fixed" before and regressed (gliss silent, harmonics flashing, KS misfire, expression stuck — anything that failed, got patched, and failed again later), do NOT ship another local patch. The root cause of recurrence is always the same: the fix had no runtime invariant, so the next refactor silently re-broke it. Follow this order instead:

1. **First, add the invariant.** A per-voice counter / assertion that logs a loud `FAIL` line when the expected behavior didn't happen. Commit on its own.
2. **Run the instrument, read the logs.** Prove the bug is still present *and* the telemetry catches it. If the telemetry never trips, the invariant is wrong — not the code.
3. **Only then fix the code.** The fix is correct when telemetry goes silent during normal play and loud again when you deliberately regress it.

Surgical one-line fixes without an invariant are the main reason portamento took 3+ "restore" commits to actually stay fixed. Don't do it again.

## Bridge Invariants

SWAM Cello is a stateful physical-modeling VST. Several features (portamento, harmonics, tremolo, bow polyphony, expression envelope) depend on the plugin being in a specific internal mode that no MIDI wire inspection can confirm. These are silent-failure surfaces: you can emit "correct-looking" MIDI and get no slide, no harmonic, no tremolo. Every such feature must be paired with a runtime invariant that fails loudly.

**Hard rule for modulators** (face envelope, intensity map, regime multipliers, path scalars, voice-stealing, any future feature that touches voice dispatch): they may *reshape* a complex's gesture (duration, velocity, density, register, contour) but MUST NOT *eliminate* the structure that defines the complex's identity. Face `isSingle` collapsing C5/C6/C7 to zero gliss steps was the exact mistake D42 fixed — don't repeat the pattern with any other complex/mode combination.

When you add a new modulator that intersects an existing invariant, re-audit every invariant in the list below. "Assumed preserved" is how regressions happen.

### Current invariants

| Invariant | Scope | Enforcement | Telemetry on failure |
|-----------|-------|-------------|----------------------|
| **Gliss overlap** (D42) — every C5/C6/C7 voice emits ≥1 `glissStep` call with source/target pitches separated by ≥1 semi (C6/C7) or ≥8 semis (C5). `glissStep` is the only path by which gliss complexes produce subsequent pitches and it guarantees the leap + tallies `inst.glissOverlapCount`. | `max/xk_swam.js` `phraseC5` / `phraseC6` / `phraseC7` | Structural: phrases call `glissStep` directly. `faceShapedCount(forGliss=true)` minimum is 1, not 0. `phraseC6` forces `count ≥ 2`. `phraseC7` always fires ≥1 drift regardless of `isSingle`. | `log("GLISS FAIL inst N CX face=F motion=M overlaps=0 dur=D")` emitted from `scheduleRelease`'s natural-end task when a gliss-complex voice finished without any overlap. Stolen phrases clear the flag in `stealInstance` to avoid false positives. |

(Add rows here when you formalize harmonics / tremolo / KS invariants. Same structure: *what* must hold, *where* it's enforced, *how* a failure surfaces in the log.)

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

`/xk/*` → Max (57121). `/gan/*` → TD (8000). `/xk/midi/*` ← Max → relay (57122, reverse direction — Max bridge echoes every SWAM noteon/noteoff to the dashboard's rolling score). Multi-message state burst on every cube turn and at BLE gyro rate (~10 Hz). `/xk/gyro`, `/gan/gyro`, `/xk/expr/*` at 60 Hz from the relay's Kalman loop. `/xk/voice` fires only on real voice transitions (from `engine.onVoice`, not per gyro packet). `/xk/spell` on algorithm detection. Full `XenaKubeState` JSON broadcast to all WS clients on every state change.

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
| `/xk/midi/noteon` | int, int, int | **Max → relay (port 57122)** — voice (always 1 in v5 single-instance), pitch (0-127), velocity (1-127). Mirrors every `noteOn` in `xk_swam.js`; keyswitches excluded. Powers Phase E tier-2 rolling score. |
| `/xk/midi/noteoff` | int, int, int | Max → relay (57122). Mirrors every `noteOff`. |
| `/xk/midi/panic` | — | Max → relay (57122). Emitted from `bang()` so the dashboard clears its pending-notes map on reset. |
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
- **Top-center**: spell buffer + spell notification + Phase E tier-2 rolling score (VexFlow 4.2.3, CDN) — bass-clef staff of the last 16 notes SWAM actually played. The code path is live (`emitEchoNote` in `xk_swam.js`, `OscServer` in `relay.js`, `handleMidiEcho` in `dashboard.html`), but the patch-side `[udpsend 127.0.0.1 57122]` is not yet wired on outlet 2 of the v8 in `xenakube_cello.maxpat`, so the strip stays empty until that one object is added (see Max section). Once wired: keyswitches excluded on the Max side, dashboard pairs `(voice,pitch)`, measures duration on the browser clock, quantises to a five-bucket VexFlow code (`16/8/q/h/w`), re-renders on every noteoff. Dynamics annotated every 4th note from velocity; accidentals shown as sharps only (enharmonic choice is a tier-3 concern). Stuck pending notes force-complete after 45 s. Tier 3 will replace this with a TS-generated note-list (face-articulation glyphs restored) once the Max→TS phrase migration lands — see `docs/todo.md` Phase B + Phase E tier 3.
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

Synthesis layer: SWAM Cello 3 (Audio Modeling physical-modeling VST) driven via MIDI from a Max/MSP bridge on port 57121. **v5 single-instance architecture (2026-04-23)** — one `[vst~ "SWAM Cello 3"]` downstream of the v8. Each `/xk/voice` renders its full gesture into that one plugin; a new voice hard-steals the current one (CC 11 = 0 + CC 120 + CC 123 + tracked noteOffs). The v4 pool was reverted because SWAM's Ambiente panel auto-registers every loaded VST instance as a reverb source regardless of which ones receive MIDI, summing identical sources into audible phase overlap — 8 stacked plugins sounded like 8 cellos even with MAX_ACTIVE = 2. Single-instance also drops Max DSP CPU ~8×.

### Patch (single instance)

Runtime patch: `max/xenakube_cello.maxpat` (open in Max 9+). Simplified signal flow:

```
[udpreceive 57121] → [gate] → [v8 xk_swam.js @autowatch 1] → outlet 0 → [vst~ "SWAM Cello 3"] → DSP chain → [dac~]
                                                             outlet 1 → (unconnected — [print xk_swam] available)
                                                             outlet 2 → (unconnected — wire to [udpsend 127.0.0.1 57122] for tier-2 score)

[loadbang] ┬── [max_active 1] → v8 inlet
           └── [read xenakube_2.swam] → [vst~]
```

DSP chain after `[vst~]`: `[abl.dsp.compander~ @shape 0.15] → [live.gain~] → [abl.device.drumbuss~] → [abl.dsp.compander~ @shape 0.2] → [abl.device.limiter~] → [dac~]`, with a `[live.scope~]` tap. The `[gate]` between `udpreceive` and the v8 lets the performer mute incoming OSC for offline inspection without closing the relay.

**Outlet architecture**: v8 has **3 outlets** — outlet 0 emits `midievent status byte1 byte2` straight into `[vst~ "SWAM Cello 3"]` (no `target N`, no poly~, no polymidiin); outlet 1 is the debug print stream; outlet 2 (Phase E tier 2) emits pre-formatted OSC `/xk/midi/{noteon,noteoff,panic}` intended for a `[udpsend 127.0.0.1 57122]` so the relay can transcribe every SWAM noteon/noteoff onto the dashboard's rolling score. **Outlets 1 and 2 are currently unconnected in `xenakube_cello.maxpat`** — outlet 2 needs a one-object wire-up before the rolling score activates; see the max/ directory "MIDI echo wiring (pending)" note below.

The SWAM instance's preset is set manually inside the SWAM GUI (saved as `default` — `polymidiin` / poly~ no longer required since there's only one plugin).

**Pool vestige**: `POOL_SIZE = 1`, `MAX_ACTIVE = 1` in `xk_swam.js`. The allocator / stealInstance / makeInstance machinery is retained as the bookkeeping anchor (every phrase generator takes `inst` as first arg, reads its `ccCache` / `activeNotes` / `phraseTasks` / face snapshots / status) but collapsed to one slot. If you ever want polyphony back, raise both constants, add `[poly~ swam_voice @voices N]`, and re-add the `outlet(MIDI_OUTLET, "target", inst.voice);` line before the `midievent` emit in `emitMidi`.

### max/ Directory

| File | Role |
|------|------|
| `xk_swam.js` | v8 object: OSC → midievent direct into a single downstream `[vst~ "SWAM Cello 3"]`. **v5 single-instance (2026-04-23)** — `POOL_SIZE = MAX_ACTIVE = 1`; every `/xk/voice` calls `allocateInstance()` which returns `instances[0]` and hard-steals whatever is currently sounding (`stealInstance`: cancel phrase tasks, CC 11 = 0, CC 120 All Sound Off, CC 123 All Notes Off, noteOff all tracked pitches, status → IDLE). The `inst` record is still threaded through every MIDI helper (`noteOn/noteOff/cc/ccForce/rampCC/keyswitch`), every selector diff (`setPlayMode/setHarmonics/setTremolo/setBowPolyphony/setEnum`), every phrase generator (`phraseC1..C8`), and every scheduling primitive (`scheduleAt/scheduleRelease/scheduleExprEnvelope`) — the pool abstraction is now where per-voice bookkeeping lives (`ccCache`, `activeNotes`, `phraseTasks`, `releaseTask`, `ccRampTasks`, `ksPending`, selector cache, voice-shot snapshots of intensity / density / duration / path / transpose / tetra / face*, and the IDLE → PLAYING → RELEASING → IDLE status lifecycle). Global state is (still) shared for the sieve walker, regime, live gyro (tilt/spin/dev/scramble), and the latest face mapping. Spell pings (oll-cross / sune / niklas / u-perm) allocate via `allocateSpellPing()` → `allocateInstance()` which, in single-instance mode, just hard-steals the in-flight phrase; accent spells (sexy-move / anti-sune) ride `state.lastAllocatedInstance` so the accent lands on the currently-sounding cello. `max_active N` on the v8 inlet still live-sets MAX_ACTIVE (clamped to [1, POOL_SIZE]), currently a no-op at POOL_SIZE = 1. **SWAM v3.10 KS plane** (velocity-select via `setEnum` + `velForOption`) for Play Mode / Gesture Mode / Alt Fingering; Harmonics + Tremolo via CC 78 / CC 79 (D31); Tremolo Min Speed via CC 80 as per-phrase stochastic envelope (D39, supersedes D38): voice onset rolls 1/3 slow→fast ramp / 1/3 fast→slow ramp / 1/3 steady, ramps driven by `rampCC` across `duration * 1000` ms. Bow Polyphony via CC 81 — per-complex `Double/Hold` default, gliss complexes `Mono Poly Release` (D35). `COMPLEX` config table is the per-voice source of truth. Expression = per-complex envelope × intensity × path scalar, slewed through `rampCC` (D33) so CC 11 interpolates between stages. Gliss phrases (C5/C6/C7) use `glissNote` (low-vel overlap) to trigger SWAM portamento; `legatoNote` stays for attack notes and non-gliss legato (D34). Spin-deadband on 60 Hz CCs; `/xk/panic` + per-instance inactivity watchdog for cleanup. Pitches folded into cello range via `foldToRange(pitch, lo, hi)`. **Phase A1 face-gesture dispatch (2026-04-18 / sculpt 2026-04-21):** `/xk/face <face>` loads a `FACE_MAP` entry (durationBias / registerBias / envelope / articulation / motion) plus `ENV_PROFILE` / `ART_OFF_VEL` / `MOTION_NUDGE` tables into `state.face*`; `handleVoice` snapshots these (including categorical `faceEnvelope` / `faceMotion`) onto the allocated instance so later face messages don't retroactively reshape an in-flight phrase. **Phrase-shape sculpt (2026-04-21 / D42 2026-04-23):** `phraseC1..phraseC8` consult `faceShapedCount(inst, lo, hi, forGliss)` — `ENV_PROFILE.isSingle` (pluck/stab/drone) collapses the rebow chain to a single note on non-gliss complexes; for gliss complexes (C5/C6/C7) `forGliss=true` enforces a minimum of 1 subsequent slide so the gliss invariant (§ Bridge Invariants) holds on every face. `phraseC6` further forces `count ≥ 2` and `phraseC7` always fires ≥1 drift, regardless of `isSingle`. All gliss pitches after the anchor route through `glissStep` which enforces the minimum leap and tallies `inst.glissOverlapCount`; `scheduleRelease`'s natural-end task logs `GLISS FAIL` if the counter is 0. `ENV_PROFILE.countMult` (burst ×1.8) thickens density — and `stepVelScale(velCurve, i, count)` shapes per-step velocity across multi-note phrases (swell cresc, fade dim, stab/burst accent-first). `commitSieveWalk(count, motion)` honours the face's `up`/`down` to force sieve-walker direction on C2/C6. `scheduleExprEnvelope` scales the complex's attack/peak/sustain by `ENV_PROFILE.{attackCoef, peakCoef, sustainCoef}` so CC 11 traces a face-specific contour on top of the complex's base shape. **Duration discipline (2026-04-22):** `handleVoice` clamps `duration` to ≤30 s after the face-bias multiply (Xenakis V2 ceiling); every `phraseCX` calls `scheduleRelease(inst, dur)` with no phrase-level multiplier stack, so a voice's sounding time is exactly `duration + fade`. **Tier 1 unification (2026-04-21):** OSC addresses + all mapping tables (enums, INTENSITY_MAP, ENV_PROFILE, ART_OFF_VEL, MOTION_NUDGE, FACE_MAP, LEGATO_COMPLEX, REGIME_* multipliers) come from `include("gen_includes.js")`, not hand-duplicated locally. |
| `gen_includes.js` | **Generated** by `scripts/gen-max-include.js` from `src/osc-schema.ts` + `src/swam-mapping.ts` + `src/face-gesture.ts`. Committed to git (Max can't run tsx). Holds OSC address strings, SWAM enums, CC band centers, INTENSITY_MAP, ENV_PROFILE, ART_OFF_VEL, MOTION_NUDGE, FACE_MAP, LEGATO_COMPLEX, REGIME_* multipliers. Regenerate with `npm run gen:max` after editing TS sources; then reload the v8 object in Max. **Do not hand-edit.** |
| `xenakube_cello.maxpat` | **Main performance patch** (2026-04-23 — v5 single-instance). Top-level chain: `[udpreceive 57121] → [gate] → [v8 xk_swam.js @autowatch 1] → outlet 0 → [vst~ "SWAM Cello 3"] → [abl.dsp.compander~ ×2] → [live.gain~] → [abl.device.drumbuss~] → [abl.device.limiter~] → [dac~ / ezdac~]`, with `[live.scope~]` tap for visual monitoring. `[loadbang]` fires `max_active 1` into the v8 inlet and `read xenakube_2.swam` into the VST on open. Debug outlet (1) and MIDI echo outlet (2) of the v8 are **currently unconnected** — wire outlet 2 to `[udpsend 127.0.0.1 57122]` to enable the dashboard's Phase E tier-2 rolling score (see "MIDI echo wiring (pending)" below). |
| `xenakube_2.swam` | SWAM Cello 3 preset, auto-loaded by the patch on open. Contains MIDI-Learn assignments, Bow Polyphony page config, Ambiente disable, and KS Velocity Remap bands required by `xk_swam.js`. Edit via the SWAM plugin GUI → save with the `xenakube_2` name; Max reloads on next `read` message. |
| `ks_logger.js` | Optional pass-through v8 between `xk_swam.js` and `vst~`. Toggleable (`on`/`off`/`dump`). Captures raw `midievent` with timestamps; `dump` prints KS-only timeline (field, option guess, Δprev, Δfield) plus non-KS summary + full JSON for LLM review. Use for diagnosing KS glitches (flashing harmonics / tremolo). |

#### MIDI echo wiring (pending)

Phase E tier 2 (2026-04-23) mirrors every SWAM `noteon` / `noteoff` out outlet 2 of the v8 as OSC `/xk/midi/{noteon,noteoff,panic}`; the relay listens on UDP 57122 and forwards to the dashboard as `midi_echo` WS messages. The code is in place (`emitEchoNote` in `xk_swam.js`, `OscServer` in `relay.js`, `handleMidiEcho` in `public/dashboard.html`) and will produce a rolling score as soon as one Max object is added:

1. In `xenakube_cello.maxpat`, create `[udpsend 127.0.0.1 57122]`.
2. Patch cord from outlet 3 (rightmost — the ECHO_OUTLET) of `[v8 xk_swam.js]` to its inlet.
3. Save. No `[prepend]` or `[route]` needed — the v8 emits pre-formatted OSC messages (first atom = address) which `udpsend` packages natively.

Until that wire exists the notation strip stays empty; everything else in the patch is unaffected.

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

**Confirm before editing the live patch** — even when running under `--dangerously-skip-permissions`, ask the user before invoking any `mcp__maxmsp__*` tool that mutates the patch (`add_max_object`, `remove_max_object`, `connect_max_objects`, `disconnect_max_objects`, `set_object_attribute`, `set_message_text`, `send_bang_to_object`, `send_messages_to_object`, `set_number`). Read-only inspection tools (`list_all_objects`, `get_object_doc`, `get_objects_in_patch`, `get_objects_in_selected`, `get_object_attributes`, `get_avoid_rect_position`) are fine without confirmation. Reason: patch edits hit live performance state and are easy to desync from `xk_swam.js` / `gen_includes.js`; a skipped prompt has bitten us before.

Prerequisite: open `MaxMSP-MCP-Server/MaxMSP_Agent/demo.maxpat` in Max 9+, `script npm install` (first time), then `script start`.

**Boundary**: keep the XenaKube patch thin — the 4-object chain above plus `print xk_swam`. All new routing/logic belongs in `max/xk_swam.js`, not in new Max objects.
