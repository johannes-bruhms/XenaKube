# Changelog

All notable changes to XenaKube are documented here.

## 2026-04-15

### Changed
- **Dashboard — mode badges stack vertically; default gyro smoothing 0.2 → 0.5; `FROZEN` badge removed.** `.mode-row` switched to `flex-direction: column` so `default` / `SEQUENTIAL` / `CONTEMPLATIVE` render one-per-line; active K/C cards flow below the taller stack naturally. Relay (`relay.js:96`) + slider (`public/dashboard.html`) defaults bumped to 0.50 (freeze function is being phased out, so the badge + its JS display toggle were removed).

### Fixed
- **SWAM bridge — Harmonics + Tremolo route to CC 78 / CC 79, not KS F# / KS G# (D31).** Root cause of "harmonics and tremolo never fire correctly" across D24 → D30: the SWAM v3.10 Key Switches PDF (`docs/v3.10-keyswitches.pdf` pp. 100–102) shows **F# Harmonics** and **G# Tremolo** as **2-band velocity-selects only** (Low = 2nd / High = 3rd for F#; Low = Slow / High = Fast for G#), with **Off as the instrument's default state — NOT a velocity band**. Every genuine 3-opt KS in that same PDF explicitly names a "Mid Velocity"; F# and G# do not. Consequence: sending our "OFF" vel (16 / 21) for non-C4 / non-C8 complexes actually landed in the **Low** band and silently turned the effect ON (at 2nd / Slow) instead of off. C4 Harmonics-on and C8 Tremolo-on fired correctly; they just stuck on through every subsequent complex. Every fix in D27–D30 left this 2-band/default-Off misunderstanding in place.
  - Fix: both params now drive via CC (PDF p. 102: "All parameters controlled by the Key Switches can be controlled by MIDI Control Change … through the Controller Mapping section"). New `CC.HARMONICS = 78`, `CC.TREMOLO = 79`, feature-flagged (`HAS_HARMONICS_CC` / `HAS_TREMOLO_CC = true`) with KS fall-back when the flag is off. CC value maps (`HARMONICS_CC_VAL`, `TREMOLO_CC_VAL`) emit band-center values against SWAM's equal-width CC quantization (4-band → 16/48/80/112; 3-band → 21/64/106). New helpers `setHarmonics(target)` and `setTremolo(target)` replace the 3 `setEnum("harmonics"…)` / `setEnum("tremolo"…)` call sites (setupComplex, oll-cross spell, bang()).
  - **Setup required once in SWAM GUI**: right-click the Harmonics selector → MIDI Learn → CC 78; right-click the Tremolo selector → MIDI Learn → CC 79; save preset. Without this, flip both `HAS_*_CC` flags false — bridge falls back to KS (fires ON correctly but cannot turn Off).
  - `docs/swam_cello_reference.md` §2 KS table corrected to **2-opt + default-Off** for F# and G#, with a prominent D31 call-out; §9 pre-flight checklist adds the Harmonics/Tremolo MIDI-Learn step.

### Changed
- **Dashboard — HUD polish: bottom-anchored State/Expression, trimmed right column, titled section headers.** State panel and Expression panel now fixed above the piano roll (stacked, both at `zoom: 0.75`). State picked up `path`, `step`, and `snap` rows migrated from the old right-side `.header-status` / `#snap-overlay` blocks (redundant dev% + snap-bar removed — Deviation lives in Expression). Connect row reduced to a single indicator — the button itself turns green via `.connected` class; `#cube-status` span and `.ws-status-inline` dot removed (JS refs stubbed). Rotate-cam-live-ghost row scaled `zoom: 1.5` with a cyan "Rotate" label; gizmo stays 200×200 unscaled. Section headings (State / Expression / Rotate) rendered in `--accent2` cyan to distinguish them from body text. XENAKUBE title bumped 50 px → 60 px. Active K/C cards pinned to 160 px wide, left-aligned.
- **Dashboard — full-viewport cube with transparent HUD overlays.** `public/dashboard.html` restructured: `#cube-canvas` now fills the viewport (100vw × 100vh, position:fixed, z-index 0) and all UI elements float as absolutely-positioned overlays with transparent backgrounds.
  - **Top-left (single column)**: title + connect row → state rows (active voice, S4, phase, orbit, scramble, permutation) → mode badges (palette, voice, frozen, regime, turn rate) → active K/C card → Expression panel (Zero Gyro + smoothing slider moved in).
  - **Top-center**: spell buffer + notification.
  - **Top-right**: rotate cam/live/ghost, then the rotation gizmo mini-canvas (repositioned to fixed top:56px right:20px, 80×80), then step/S4/snap readout.
  - **Bottom**: full-width sieve strip styled as a piano roll — white/black key backgrounds, per-octave divider, legible 11 px bold C-note labels (C2–C6) in accent cyan.
  - Removed from view: K1–K8 grid, C1–C8 grid, Move Log list, Voice Sequence controls (elements retained hidden for JS compatibility). No functional changes — all IDs/event listeners preserved.

### Fixed
- **SWAM bridge — harmonics/tremolo "flash ON→OFF within a single turn" (D30).** D29's fix 2 (defensive `keyswitch` of KS F#/G# on every voice event, bypassing `setEnum`'s diff) was itself the cause of a new glitch: every voice event rewrote Harmonics and Tremolo to the incoming complex's values, so any voice into C1/C2/C3/C5–C7 while a C4 harmonic or C8 tremolo note was still bowing silently selected HARMONICS=OFF / TREMOLO=OFF mid-note. Confirmed by `max/ks_logger.js` capture: every `handleVoice` carried a HARMONICS+TREMOLO KS pair at vel 16/21 (opt 0) even when complex hadn't changed. Fix: delete the defensive block in `handleVoice`; `setupComplex`'s `setEnum` diff now solely owns Harmonics/Tremolo KS, firing exactly when the target option index changes. D28's `ksForceCount` still guarantees post-bang() re-sync; D29's `ksPending` interleave guard still handles stale-noteOff on rapid complex changes.

### Added
- **Debug — `max/ks_logger.js` toggleable pass-through MIDI logger.** Drop between `v8 xk_swam.js` and `vst~ "SWAM Cello 3"`; send `on`/`off`/`clear`/`dump`. Captures raw `midievent` with timestamps, back-solves KS velocity → option index against `KS_VEL_OVERRIDE` bands, dumps a KS-only timeline (Δprev, Δfield, field label, option guess) plus non-KS CC histogram and full JSON for LLM review. Used to pin D30.

## 2026-04-14

### Fixed
- **SWAM bridge — harmonics/tremolo "glitch on/off, most of the time not firing correctly" (D29).** Two real root causes behind the flaky v3.10 velocity-select KS behavior, independent of D27's band migration and D28's startup guard.
  - **Stale-noteOff interleave.** `keyswitch()` scheduled a noteOff 50 ms after noteOn, at the *same velocity* as the noteOn. When a second keyswitch hit the same KS note within that 50 ms window (common on back-to-back complex changes like C1 ↔ C4), the stale noteOff fired at the *old* velocity and SWAM re-selected the old option mid-hold — silent divergence between our state model and SWAM's actual selection. Fix: track pending noteOff tasks per KS note in `ksPending`; when a new keyswitch hits the same note, cancel the stale task and fire its noteOff *now* at the *new* velocity (so SWAM re-reads the intended selection on both edges, and the next noteOn isn't a duplicate-while-held).
  - **Diff-suppression hiding SWAM drift.** After setupComplex writes Harmonics/Tremolo on complex change, subsequent voice events into the same complex skip setupComplex entirely (`setEnum` diff-returns). If SWAM drifts for any reason (stale-noteOff before the interleave fix, preset reload, GUI touch, autowatch reload), state and SWAM silently disagree until the next complex change. Fix: `handleVoice` now force-writes Harmonics and Tremolo KS on every voice event, mirroring the existing portamento defensive re-assertion. Costs 2 extra KS per voice event (~5/s), and the interleave guard above prevents the re-asserted noteOff from undoing the selection. Play Mode and Gesture Mode stay diff-suppressed since they're not symptomatic.

### Added
- **SWAM bridge — KS sync guard (D28).** Two-pronged hedge against SWAM's selector state drifting out of sync with the bridge's in-JS model. (a) New `KS_VEL_OVERRIDE` table in `max/xk_swam.js` — per-KS hard-coded velocity arrays for Gesture Mode (KS D), Harmonics (KS F#), and Tremolo (KS G#) — consulted by new `velForKS(ks, idx, optionCount)` helper before falling back to the even-band default from `velForOption`. Overrides can be audited against SWAM's "KS Velocity Remap" editor so a user-shifted or preset-shifted band no longer silently mis-selects. `setEnum` now routes through `velForKS`. (b) `state.ksForceCount` (initialized to 3 in `bang()`) + `state.forceKS` flag — for the first 3 voice events after reset, `handleVoice` force-calls `setupComplex(complexType)` regardless of complex diff, and `setEnum` / `setPlayMode` bypass their `state.*` diff suppression. This proves SWAM aligns with the bridge's selector model before diff-suppression silences subsequent re-asserts.

### Fixed
- **Engine — K_i and C_i cubes advanced in lockstep (root cause of "complex labels stuck to K#s").** `engine.ts:onTurn` had been feeding the same S4 element `el` to both `kGroup = multiply(kGroup, el)` and `complexCube.transform(el)`, starting both from IDENTITY. Result: `complexCube.groupElement === kGroup` after every turn — the ghost cube was just the live cube rendered twice, and K# ↔ complex pairing only shifted when α→β→γ rotated every 3 substitutions. Xenakis (*Formalized Music* pp. 223-224, §IV) specifies two *separate* closed graphs ("C_i graph {D Q12}" vs "K_i graph {D Q3}"); the engine was collapsing them. Fix: module-level `C_SHIFT = parseMoveToElement('U')` (U generator, order 4) shifts each move's el before applying it to the C-cube when no explicit `cDiagram` is loaded (`complexCube.transform(multiply(C_SHIFT, el))`). The move still drives C (the performer's action matters), but C's orbit diverges from K's by a 4-cycle offset; combined with the α/β/γ 3-cycle, C's visible period is lcm(4,3)=12 substitutions — plenty of contrast against K. Landing on the same K-permutation twice no longer forces the same complex assignment. Regression test added (`test/engine.test.ts` "K_i and C_i cubes do not advance in lockstep"): runs six moves and asserts at least one `cGroup !== kGroup` divergence.
- **Dashboard — active-voice stat + move-log row showed slot index instead of vertex identity.** `s-active-vertex` and the move-log `<span class="move-vertex">` were rendering `K${activeIdx + 1}` — the screen-position under the active cursor, not the K-number of the vertex currently occupying that slot. After a turn, the viewing panel could read "K3" while the card at position 2 (correctly labelled K3 after the earlier fix) showed the matching params — visually implying mismatch. Both now resolve through `state.kPermutation[activeIdx] + 1` so every K-label across the dashboard names the same vertex identity. Completes the slot-vs-identity sweep started with the vertex-card + seqPip fixes.
- **Dashboard — complex abbreviations removed from the live K-cube labels.** `public/dashboard.html:updateVertexLabels` previously wrote both `K{n}` and the complex abbreviation onto each live-cube face; `updateGhostLabels` did the same on the ghost. With the two cubes' permutations now legitimately different (see above), the domain separation works — live = K_i (parameter) domain, ghost = C_i (complex) domain. Live cube labels now show `K{n}` only; complex abbreviations remain on the ghost.

### Added
- **SWAM bridge — Phase 6 (partial), Phase 7, Phase 8 of the revision roadmap.**
  - **Sordino on freeze (Phase 6)**: new `CC.SORDINO = 68` (MIDI-Learn to the GUI Sordino toggle; Sordino was removed from the KS plane in v3.10). `handleSpell('sune')` toggles Sordino alongside the sustain pedal so the freeze gets a muted, veiled color; `bang()` resets to 0.
  - **Scramble → Bow Position bias (Phase 6)**: `handleExprScramble` now maintains `state.scrambleBowBias` via 2 s hysteresis — latches +40 (sul tasto) when scramble < 0.2 for 2 s; −40 (sul pont) when > 0.8 for 2 s (skipped for C8 which is already at the bridge); clears in the 0.3–0.7 transition band. `handleExprTilt`'s CC 16 write adds the bias; bias changes also force an immediate CC 16 write so the timbral shift is audible even when the cube is held still. Replaces the retired v3.8 KS latches (G/G#) with a v3.10-correct continuous path.
  - **V2 fold window (Phase 7)**: formalized — `pickPitch` already widens V2's floor to `max(24, reg.lo − 12)` per complex via `foldToRange(pitch, lo, hi)`. No Section Size fallback needed (removed from the KS plane in v3.10). Roadmap checkbox flipped.
  - **Note-off velocity from turn rate (Phase 8)**: `noteOff(pitch, vel?)` signature extended with a default velocity sourced from `state.noteOffVel`; `handleRate` maps `turnsPerSec → 25 … 120`. Fast turns now produce bitten, short natural releases; slow turns produce long, naturally-decayed releases. Applies to every phrase-generator note-off without per-call plumbing.

### Changed
- **`CLAUDE.md` trimmed 385 → 236 lines (~39%).** Moved OSC Reference near the top (most-consulted lookup). Delegated duplicated content to its authoritative home: full v3.10 KS table → `docs/swam_cello_reference.md`; SynthDef table + OSC→SC bindings → `sc/xenakube.scd` comments; Per-Turn Phrase table + OSC→SWAM bullet list → `max/xk_swam.js` + `swam_cello_reference.md`; Max MCP tools table → the `max-patch` subagent. Deleted the entire "Not Yet Implemented" section (a stale-by-design mirror of `docs/revision_roadmap.md` + `docs/todo.md`). Collapsed Humanization / 60 Hz deadband / Panic & watchdog subsections into the `xk_swam.js` entry. Condensed Self-Maintenance stanza from rule list to one paragraph.

### Fixed
- **Spell detection — `X2` tokens never matched (sune / anti-sune / u-perm / t-perm).** GAN i4 hardware only reports 90° clicks, so a physical half-turn arrives as two quarter-turn events and the canonical `U2`/`R2` tokens in the algorithms were never in the buffer. Symptom: sune peaked at 6/7 on the dashboard and then partial match collapsed to 0 when the "U2" arrived as a plain "U". Canonical algorithms now store half-turns as two CCW quarter-turns (`U2` → `U' U'`, `R2` → `R' R'`). Moves/spell: sune 7→8, anti-sune 7→8, u-perm 11→12, t-perm 14→15. Trade-off documented: performers must flick half-turns CCW (speedcube default) — CW flicks won't trigger. Chosen over two-direction expansion to keep the spellbook lean (still 7 × 24 = 168 patterns) and predictable. Added regression test that asserts a CW-flick sune (U U) does NOT fire.
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
