# Changelog

All notable changes to XenaKube are documented here.

## 2026-04-14

### Fixed
- **SWAM bridge — portamento regression + KS vel-0 note-off reset.** Two bugs that landed together in the v3 refactor:
  - `cancelPhrase()` was hard-releasing every active note at the top of each `handleVoice`, which emptied `state.activeNotes` before the next phrase's `legatoNote()` could overlap it. SWAM triggers portamento on noteOn-before-noteOff — with no overlap, no portamento. Fix: `cancelPhrase(preserveLegatoTail)` keeps only the most recent active note when the incoming complex is legato-capable (C2/3/5/6/7); earlier notes are still released to avoid stuck-note accumulation. Hard-release (`preserveLegatoTail` unset) is used from `bang()` / panic / `t-perm`. New `LEGATO_COMPLEX` table declares which complexes own the preserve path. Pizz/harmonics/ponticello (C1/4/8) stay hard-cancelled — they're re-bow / short-gate, not legato.
  - `keyswitch()` was sending note-off with velocity 0. SWAM v3.10 reads KS note-off velocity and interprets vel 0 as "option 0 = OFF" — so ~50 ms after every turn into C4, Harmonics snapped from Octave back to Off (same for C8 Tremolo Fast → Off). Symptom: "flash briefly then off within the same turn." Play Mode escaped notice because its option 0 is "bow" — flipping to bow after pizz/col is a silent no-op for most turns. Fix: note-off velocity now matches the note-on velocity, so the latch survives.
- **SWAM bridge — v3.8 → v3.10 KS migration (D24/D27, root cause of "harmonics & tremolo never fire").** The bridge's `KS` map was built against the v3.8 reference but the running VST is v3.10. v3.10 renumbered the KS plane and converted most controls from latch-toggle to **velocity-selectors**. Symptoms: C4's "harmonics on" was actually writing v3.10's *Tremolo Mode* (KS 33), and C8's "tremolo on" was writing an *unassigned* KS (KS 34) — so neither ever sounded. Play Mode (KS 24) was unchanged between versions, which is why pizz/col-legno kept lighting up and masked the regression.
  - **New v3.10 KS map in `max/xk_swam.js`**: Harmonics → KS F# (vel-4: Off/Octave/Octave+5th/Control), Tremolo → KS G# (vel-3: Off/Slow/Fast), Gesture Mode → KS D (vel-3: Expression/Bipolar/Bowing). Sordino, Sul Tasto, Sul Ponticello, Section Size **removed from the KS plane in v3.10** (Sordino → GUI/CC-only; Sul Tasto/Pont → Bow Position CC 16; Section Size → concept removed). Bridge no longer sends those KS notes.
  - **New helpers**: `velForOption(idx, optionCount)` picks centred velocities inside SWAM's KS Velocity Remap bands; `setEnum(field, ks, target, optionCount)` replaces `setToggle` for vel-select KS, diffing by option index so re-asserting current state is a no-op (no inversion risk).
  - **New enums**: `HARMONICS = {OFF, OCT, OCT_5TH, CTRL}` and `TREMOLO = {OFF, SLOW, FAST}` and `GESTURE = {EXPR, BIPOLAR, BOWING}`. `COMPLEX[4].harmonics = HARMONICS.OCT` and `COMPLEX[8].tremolo = TREMOLO.FAST` declare enum indexes, not booleans. `setupComplex` calls `setEnum` for each.
  - **Gesture Mode pin**: `bang()` explicitly writes `setEnum("gestureMode", KS.GESTURE_MODE, GESTURE.EXPR, 3)` because if Gesture Mode is silently flipped to Bipolar/Bowing (no error, no audible cue), CC 11 is reinterpreted as bow direction/displacement and both the Expression envelope and portamento feel break.
  - **state cleanup**: removed `sordino / sulTasto / sulPont / sectionSize` fields, added `gestureMode / altFing / keepBowDir`. `harmonics` and `tremolo` state changed from boolean → numeric. Dead `setSectionSize` and `setToggle` paths for retired KS removed. sune freeze still uses `CC.SUSTAIN_PEDAL` (untouched by migration).
  - **Docs synced**: `docs/swam_cello_reference.md` §2 + §9, `CLAUDE.md` Keyswitches section, `docs/revision_roadmap.md` (D24 RESOLVED, new D27, Phase 6 rescoped to drop retired KS, new Phase 13 covers the migration).
  - **Listening test still required** to confirm C4 + C8 audibly fire post-migration.

### Added
- **`docs/revision_roadmap.md` — diagnoses D20–D26 + Phases 9–12.** Converged this session's SWAM-bridge findings into the roadmap as persistent context. D20 (Portamento Control `Velocity (P.MaxTime)` silently ignores CC 5 — resolved via preset flip, now documented in Prerequisites), D21 (tilt → Bow Position widened ±10 → ±30 — resolved), D22 (phrase-generator densification — resolved), D23 (intensity.bowMult + per-complex pitch register — resolved), D24 (harmonics/tremolo KS never firing — open, likely upstream in `src/voice-engine.ts`), D25 (ghost-cube calibration render-only; needs WS → engine feedback loop — open), D26 (pitch-bend glissando path as optional alternative to SWAM portamento for wide C5 moments — deferred). New Phase 9 (expressivity pass — retrospective, landed), Phase 10 (diagnose C4/C8 emission), Phase 11 (ghost calibration feedback through dashboard → relay → engine), Phase 12 (pitch-bend glissando, conditional). Advanced → MIDI preset requirements added to Prerequisites: `Portamento Control = CC (P.MaxTime)`, KS MIDI Channel = 2.

### Changed
- **SWAM bridge expressivity pass — wider tilt, intensity-driven bow pressure, densified C2–C8 phrases, per-complex pitch register.** After confirming SWAM preset is correctly routed (KS Ch 2 / Octave C0) and flipping `Portamento Control` to `CC (P.MaxTime)` (so our CC 5 writes take effect and glissando actually responds): tilt → Bow Position widened from ±10 to ±30 so the timbral sweep is audible. `INTENSITY_MAP` gains `bowMult` and `density` fields — bow pressure is now the complex's baseline × intensity scalar (fff = 1.45×, p = 0.70×), written in `handleVoice` and stored as `state.bowPressureBase` so deviation modulation (`handleExprDev`) rebases off it. New shared `phraseCount(lo, hi)` multiplies base counts by `intensity.density × live state.density`. C3/C4/C7/C8 are no longer single-note: C3 adds 0–2 grace notes on f+; C4 becomes a 2–5 harmonic cloud; C7 adds 1–3 micro-drifts; C8 does 2–4 re-bows on one pitch (SWAM tremolo KS still latched). `COMPLEX` table gains `register:{lo,hi}` per complex (C1 36–72, C2 40–64, C3 36–55, C4 60–84, C5 36–84, C6 43–67, C7 36–52, C8 60–81); `pickPitch` folds into this window before V2 shifts `lo` down an octave. `foldToRange(pitch, lo, hi)` now takes optional bounds.

### Changed
- **SWAM Cello 3 v3.11 reality check — feature-flagged absent params.** After confirming against the actual VST UI (v3.11):
  - **No Bow Speed** knob exists → `HAS_BOW_SPEED = false`, CC 20 writes no-op.
  - **No Attack Ramp** knob exists → `HAS_ATTACK_RAMP = false`, CC 73 writes no-op.
  - **Attack Control exists but as a 4-mode selector** (`vel.soft / vel.hard / expression / mix vel. expr.`), not a continuous 0–127 ramp → `HAS_ATTACK_CONTROL = false`, CC 75 writes no-op. Preset recommendation: set Attack Control = `expression` or `mix vel. expr.` so the existing CC 11 envelope (`scheduleExprEnvelope`) drives attack character for free.
  - Guards installed at `cc()` / `ccForce()` in `max/xk_swam.js` via a `hasCC()` helper, so every call site (setupComplex, handleRegime, handleExprDev, spell handlers, bang/reset) is covered at the helper layer — no per-site changes needed, and flipping a flag back to `true` re-enables that CC everywhere at once.
  - Phase 7's "CC 75 Attack Control spell-accent spikes" sub-task is now obsolete (checked off in `docs/revision_roadmap.md` with the rationale inline). `docs/swam_cello_reference.md` gained a top-of-file UI-divergence note covering the missing / re-semantic-ed params and the unwired-but-interesting ones (Harmonics 4 Control, Bow Polyphony, Double Hold String Selection, Mono Cross String Muting).

### Changed
- **SWAM bridge refactor — Phases 0–5 of `docs/revision_roadmap.md`.** Rewrote `max/xk_swam.js` against SWAM Cello 3's actual control model; removed the upstream voice firehose.
  - **Phase 0 (D16/D17)** — `/xk/voice` removed from `stateToOsc()` and routed through a new `voiceToOsc()` called from `engine.onVoice` in `relay.js`, so voice events fire on real turns instead of every ~10 Hz gyro packet. `cancelPhrase()` now releases sounding notes before cancelling scheduled Tasks (prevents stuck notes on phrase overlap). New panic watchdog: `allNotesOff()` after 3 s silence with no pending phrase/release. New `/xk/panic` OSC, emitted by relay on WS-disconnect and wired to `bang()` in the bridge.
  - **Phase 1 (D1/D2/D12)** — full 12-switch KS map (KS Octave = C0, KS_CH configurable). `keyswitch(note, vel, ch)` signature with 50 ms hold. Play Mode is one velocity-selected KS C (Bow/Pizz/Col via velocity 40/80/110). Harmonics and Tremolo are KS latch toggles (A/A#) with stateful diffing so they never invert on re-entry. `CC.HARMONICS` and `CC.TREMOLO` removed.
  - **Phase 2 (D5/D7)** — `COMPLEX` config table is the single source of truth per voice: play mode, harmonics/tremolo target, expression envelope, vibrato baseline, bow position/pressure, portamento, attack ramp/control. `setupComplex` diffs every field. Attack ramp written once on complex change and scaled by regime multiplier (contemplative ×1.2, conversational ×1.0, burst ×0.5). Density no longer writes attack.
  - **Phase 3 (D4/D8/D15/D18)** — Expression is driven entirely by per-complex envelope × intensity × path scalar (V2 × 0.7); tilt is reassigned to Bow Position ±10 modulation. `scheduleExprEnvelope()` ramps CC 11 at attack/peak/sustain for every phrase generator. Reset starts silent (CC 11 = 0). 60 Hz continuous CCs skip writes when `spin < 0.02` for ≥ 200 ms and throttle to 30 Hz otherwise.
  - **Phase 4 (D3/D6)** — `VIBRATO_RATE` corrected to CC 19; `BOW_SPEED` moved to CC 20. Per-complex vibrato baselines; spin modulates depth/rate through an EMA (α = 0.08) with a musical dead zone at 0.15.
  - **Phase 5 (D11/D13/D14/D19)** — spell mutations restore baseline via `setupComplex(state.activeComplex)` instead of partial restore (now idempotent via diffing); `u-perm` uses short-gate staccato pattern + `BOW_PRESS_ACCENT` instead of the fake `KS.STACCATO` note (which under SWAM was Alt Fingering). `ccForce` is used for envelopes/spell writes, `cc` for continuous streams. Deviation → ±25 modulation around the complex's baseline bow pressure instead of overwriting it. V2 fold window widened to MIDI 24 so V2's –12 transpose reaches the low octave.
  - **Niklas spell (D19)** — added the 7-move commutator `R U' L' U R' U' L` to the spell book (7 canonical × 24 = 168 patterns). `ModeManager` stub + `xk_swam.js` handler log detection; audio effect TBD after listening.

### Added
- **`docs/swam_cello_reference.md`** — authoritative SWAM Solo Strings v3.8.0 reference extracted from the user manual: full KS map (C–B and B+C page), default vs must-be-learned CC split, Expressivity/Bow/MIDI-page params, articulation recipes, instrument ranges, and an explicit "KS and CC are independent paths" note. Corrects earlier misconceptions: there is no central "Advanced → MIDI → Controllers" tab (each param is MIDI-Learned via right-click); KS Octave = **C0** places KS at MIDI 24–35 (not C1, which would collide with pitch input 36–89); Harmonics/Tremolo are KS latch toggles (A, A#), not CCs.
- **`docs/revision_roadmap.md`** — converged SWAM-bridge refactor plan. 15 diagnoses (D1–D15) covering the observed issues (pizz/harmonics/tremolo KS never register, Expression hijacked by tilt, vibrato jitter) plus structural cleanup (CC collisions, attack-param fighting, V2 transpose self-negation, spell-reaction restore bugs). 8 implementation phases, invariants, per-phase verification plan. Prereq: SWAM preset config (KS Octave = C0, `xenakube_cello.swampreset`).

### Changed
- **Spell book trimmed to 6 spells — sledgehammer removed, freeze-toggle moved to sune.** The 4-move sledgehammer (`R' F R F'`) was prone to accidental triggering mid-phrase; replacing it with the 7-turn sune (`R U R' U R U2 R'`) makes freeze a deliberate gesture. sune's former "palette → V2" effect is dropped (palette switching is still Not Yet Implemented outside the Max bridge, and V2 darkening was the least load-bearing mapping). Affects `src/spells.ts`, `src/mode-manager.ts`, `max/xk_swam.js`, tests, and docs. Total patterns: 6 × 24 rotations = 144 (down from 168).

## 2026-04-13

### Added
- **`max/tester.maxpat`** — reference Max patch wiring the documented 4-object chain (`udpreceive 57121` → `v8 xk_swam.js @autowatch 1` → `vst~ "SWAM Cello 3" 2` → `dac~`). Open this in Max to drive SWAM Cello 3 from a running relay.
- **`max/tester1.maxpat`** — debug-harness variant with extra message boxes (hand-fired `/xk/expr/scramble`, raw `midievent` CCs) and a `live.gain~` for bench-testing CC/midievent flow without the relay running.
- **`.gitignore`** — ignore `.DS_Store` and the external `maxmsp-mcp/` tooling (plus its `max/max_mcp*.js`, `max/package*.json`) which is a separate MCP server used while editing patches, not part of this project.

### Fixed
- **Max/SWAM pitches clamped to cello range** (`max/xk_swam.js`) — SWAM Cello 3 plays C2–F6 (MIDI 36–89). Generated pitches previously clamped to 24–96 (C1–C8), producing silent notes at the extremes (and, under V2 transpose of -12, pushing sieve pitches below C2). All pitch selection now folds into the cello window by octave transposition (preserving pitch class from the sieve) rather than hard-clamping, so out-of-range notes wrap up/down an octave instead of collapsing to the min/max. New `CELLO_MIN`/`CELLO_MAX` constants at the top of the file make the range easy to re-tune.

### Changed — Spell book revised to CFOP fundamentals (7 spells)

Boiled the spell list down from 12 algorithms to the 7 essentials needed to solve the cube under the CFOP method (Cross, F2L, OLL, PLL). Cross-checked algorithms against standard cubing references; fixed three that didn't match their canonical names.

**Corrected algorithms:**
- **sledgehammer**: `R' D' R D` → `R' F R F'` (the code's prior version was a valid commutator but not sledgehammer — different face and direction signature, not a rotation variant)
- **sune**: `R U R' U R U'` → `R U R' U R U2 R'` (the 6-move version didn't correctly cycle corners; Sune is canonically 7 moves ending in `U2 R'`)
- **anti-sune**: `R' U' R U' R' U2 R` → `R U2 R' U' R U' R'` (conventional anti-sune is the inverse of Sune)

**Removed (not CFOP fundamentals):**
- `hedge` (non-standard name, conceptually overlaps sledgehammer)
- `combo` (literally sexy + sledgehammer concatenated — redundant once both are first-class)
- `j-perm`, `u-perm-cw`, `u-perm-ccw`, `h-perm` (advanced PLL cases; T-perm + U-perm cover beginner 2-look PLL). `u-perm-ccw` retained as the single `u-perm` spell.

**Spell count**: 12 × 24 = 288 patterns → 7 × 24 = 168 patterns.

**Effect re-homing**: the staccato-burst effect previously bound to `combo` now fires on `u-perm`. All other effect mappings unchanged.

### Added
- **Max/SWAM bridge v2** (`max/xk_swam.js`) — each cube turn now triggers a musical **phrase**, not a single note
  - Per-complex-type phrase generators: C1 pizzicato cloud (2-5 plucked notes scattered ≤600ms), C2 legato run (2-3 notes), C3 sustained with expression swell, C4 harmonic ping, C5 wild glissando (two-note slide ≥5 semitones apart), C6 stepwise gliss walk, C7 sustained slide with drift, C8 ponticello tremolo
  - **Auto-release timer** — phrases fade out over 5 steps × 80ms based on the `duration` parameter; no more infinite sustain when the performer stops turning
  - **Velocity humanization** — ±15% random jitter + accent (+8) every 3rd turn, 10% chance of ±1 semitone microtonal shift, 0-30ms micro-delay between phrase notes
  - **Active notes tracking** — `state.activeNotes` array lets phrase/release logic cleanly release everything sounding
  - Expanded spell reactions: `sexy-move` bow sweep (bridge snap + peak expression), `oll-cross` harmonic ping, `combo` staccato burst (3-5 rapid notes), `sune`/`anti-sune` palette shifts, `t-perm` full reset

### Fixed
- **Glissandi/portamento now audible** — `legatoNote()` sends noteOn(new) **before** noteOff(old) with 20ms overlap, so SWAM Cello 3 engages portamento. Previous code killed the old note first, preventing SWAM from ever seeing two simultaneous notes to glide between.
- **Pizzicato registers reliably** — keyswitches now hold for 30ms (was instant on+off) giving SWAM time to register the articulation change.
- **Sledgehammer unfreeze releases held notes** — previously unfreezing left the note hanging; now `allNotesOff()` runs on unfreeze.

### Changed
- **Intensity map widened** — p/mp/mf/f/ff/fff expression values now 20/38/55/75/95/115 (was 15/28/45/64/83/102); velocity also tracked per intensity level (35-120)
- **Tilt → Expression curve** — now exponential (`val²`) and blended with base intensity (`baseExpr*0.3 + tilt²*97`), giving more dramatic and visceral dynamic shaping
- **Spin → Vibrato** — threshold at 0.15 before vibrato engages, exponential above (no vibrato at rest)
- **Deviation → Bow Pressure + Bow Speed** — wider range (20-127), exponential curve; deviation also modulates bow speed
- **Scramble → Bow Position** — wider range (5-120)
- **Tetra → Bow Sensitivity** — even=50, odd=110 (was 64/102)
- **Regime → Attack Ramp** — contemplative=slow(90), conversational=medium(50), burst=fast(10)

## 2026-04-09

### Added
- **Browser dashboard** (`public/dashboard.html`) — single-page live visualizer served at `http://localhost:3000`
  - 3D wireframe cube (Three.js) with vertex labels (K1-K8), tetrahedral orbit highlighting
  - Gyro quaternion drives cube orientation in real time
  - **Zero Gyro** button — calibrates current physical orientation as neutral
  - **OrbitControls** — mouse drag to rotate camera, scroll to zoom
  - K_i engine state panel: S4 element, path, tetrahedral orbit, permutation slots
  - C_i engine state panel: S4 element, cyclic phase
  - Vertex parameter cards (K1-K8): density, intensity, duration with intensity bars
  - Sound complex cards (C1-C8): color-coded by type with technique labels
  - Sieve pitch strip: 49 semitone cells (C2-C6) with active pitch highlighting
  - Move log: scrolling history with move name and state snapshot
  - Gyro quaternion display: 4-axis numeric values with bipolar bars
  - WebSocket auto-reconnect

### Changed
- **relay.js** — merged connect UI and dashboard into single page at `/`
  - Removed separate inline HTML connect page
  - Loads dashboard from `public/dashboard.html` via `fs.readFileSync`
  - Broadcasts full `XenaKubeState` JSON over WS to all clients on every state change
  - Turn events broadcast as `{type: 'state', data, move}`
  - Gyro events broadcast as `{type: 'gyro_state', data}`
  - Dashboard throttles gyro renders to `requestAnimationFrame`
- Gyro-to-Three.js coordinate mapping: swap Y/Z, negate X for correct yaw/pitch/roll
