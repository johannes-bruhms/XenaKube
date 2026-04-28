# CLAUDE.md

> **v2 fork** — independent working tree branched from XenaKube/ to test a modular dashboard restructuring + WebGL visual upgrade path without risking the live performance system. The synthesis pipeline (relay.js → engine → OSC → Max → SWAM) is **identical** to v1 and the bridge invariants below still apply unchanged. v2-specific phased work lives in `docs/todo.md` (Dashboard Modularization, Visual Upgrade phases). When the modular dashboard ships a feature stably, v2 supersedes v1.

## XenaKube

Real-time instrument: GAN i4 smart Rubik's cube → SWAM Cello physical-modeling synthesis + browser visuals. Cube turns are musical events; Rubik's algorithms ("spells") trigger musical gestures. Built on S4 group math (24 cube rotation symmetries) inspired by Xenakis' *Nomos Alpha*.

**Architectural direction — Temporal Identity**: each of 12 face-moves (L/L'/R/R'/F/F'/B/B'/U/U'/D/D') owns a distinct gesture *type* fixed to the cube's color-fixed face identity; K_i / C_i permutation modulates *content* (pitch, timbre, intensity) inside that shape. Performer's forward model: you know the *kind* of sound a turn will produce, you don't know the *detail*. Pending phases (A2 solve-anchor, Phase B phrase library, Phase C dashboard split, Phase E tier 3 phrase migration): see `docs/todo.md`.

Primary source: `docs/xenakis_nomos_alpha_primary_source.md` (*Formalized Music* pp. 214–237). Design rationale and performer-frame discussion: `docs/research_notes.md`.

## Doc Maintenance

When you change code, update the affected doc in the same commit; keep the terse style and don't add disclaimers to stale content — fix it.

| File | Owns |
|------|------|
| `CLAUDE.md` (this file) | Architecture, file roles, OSC reference, commands, invariants. **Tense-less, present-state only** — no dates, no rev letters, no narrative history. |
| `CHANGELOG.md` | Dated entry per user-visible change (Added / Changed / Fixed). |
| `docs/todo.md` | Phased roadmap; tick off done items, add new ones as they emerge. |
| `docs/research_notes.md` | Design rationale, new mappings, primary-source notes. |
| `docs/revision_roadmap.md` | SWAM-bridge diagnoses (D*) and phase progress. |
| `docs/swam_cello_reference.md` | Authoritative SWAM v3.8+ parameter / CC / KS reference. |
| `docs/synthesis-bridge.md` | Max/MSP + SWAM bridge deep dive: patch topology, `max/` file roles, mapping cheatsheet, Max MCP integration. CLAUDE.md keeps only the Bridge Invariants summary. |
| `docs/osc-reference.md` | Full OSC address table (`/xk/*`, `/gan/*`, `/xk/midi/*`). CLAUDE.md keeps only the routing summary + most-touched addresses. |
| `README.md` | User-facing setup and top-level description. |

**Hard rule**: implementation status, dated decisions, and D-numbered diagnoses live in `docs/revision_roadmap.md` and `docs/todo.md`, not here. The only D-codes that appear in CLAUDE.md are those naming an active invariant in the table below.

**v2 doc-state note**: the Visual Invariants table below describes properties the *current* code must hold. The Dashboard Module Boundaries that those invariants live across are described in `docs/todo.md` Phase 2 (planning), not here — until each module is extracted, the file roles section still reflects the monolithic `public/dashboard.html`. Each module-extraction commit during Phase 2 must update both this file's File Roles table and `docs/todo.md`'s phase status in the same commit.

**Before commit**: `npx tsc --noEmit && npm test`. If you touched `src/osc-schema.ts`, `src/swam-mapping.ts`, or `src/face-gesture.ts`, also `npm run gen:max` and reload the v8 object in Max — drift between TS and `max/gen_includes.js` is the single largest source of silent bugs.

## Recurring-Bug Discipline

If a symptom has been "fixed" before and regressed (gliss silent, harmonics flashing, KS misfire, expression stuck — anything that failed, got patched, and failed again later), do NOT ship another local patch. The root cause of recurrence is always the same: the fix had no runtime invariant, so the next refactor silently re-broke it. Follow this order instead:

1. **First, add the invariant.** A per-voice counter / assertion that logs a loud `FAIL` line when the expected behavior didn't happen. Commit on its own.
2. **Run the instrument, read the logs.** Prove the bug is still present *and* the telemetry catches it. If the telemetry never trips, the invariant is wrong — not the code.
3. **Only then fix the code.** The fix is correct when telemetry goes silent during normal play and loud again when you deliberately regress it.

Surgical one-line fixes without an invariant are the main reason portamento took 3+ "restore" commits to actually stay fixed. Don't do it again.

**This discipline applies to the dashboard's visual layer too** (Phase E rolling-score, sieve cell distribution, gliss line trajectory, pitch-axis alignment between rolling-score and sieve, slide-vs-leap classification consistency between white-line and rolling-chain code paths). Visual desyncs are silent-failure surfaces in exactly the same way as bridge selectors — the eye can't tell the leg endpoint and the drawn note are 8 px apart on a 1920 px canvas until they get to a wide-spread phrase, and by then the regression is shipped. Every Dashboard Visual Invariant in the table below earns the same treatment as a Bridge Invariant: invariant first, telemetry second, fix third.

## Bridge Invariants

SWAM Cello is a stateful physical-modeling VST. Several features (portamento, harmonics, tremolo, bow polyphony, expression envelope) depend on the plugin being in a specific internal mode that no MIDI wire inspection can confirm. These are silent-failure surfaces: you can emit "correct-looking" MIDI and get no slide, no harmonic, no tremolo. Every such feature must be paired with a runtime invariant that fails loudly.

**Hard rule for modulators** (face envelope, intensity map, regime multipliers, path scalars, voice-stealing, any future feature that touches voice dispatch): they may *reshape* a complex's gesture (duration, velocity, density, register, contour) but MUST NOT *eliminate* the structure that defines the complex's identity. Face `isSingle` collapsing C5/C6/C7 to zero gliss steps was the exact mistake D42 fixed — don't repeat the pattern with any other complex/mode combination.

When you add a new modulator that intersects an existing invariant, re-audit every invariant in the list below. "Assumed preserved" is how regressions happen.

| Invariant | Scope | Enforcement | Telemetry on failure |
|-----------|-------|-------------|----------------------|
| **Gliss event count** (D42 + D46) — every C5/C6/C7 voice emits ≥1 `glissStep` call. `glissStep` classifies the transition as same-string (slide via `glissNote` overlap) or cross-string (leap via `leapStep` clean noteOff→gap→noteOn) and tallies into `glissOverlapCount` / `glissLeapCount` respectively. Invariant is `slides + leaps ≥ 1`, not `slides ≥ 1` — leaps are first-class outcomes (cellos string-cross when the interval doesn't fit one string). | `max/xk_swam.js` `glissStep` (dispatch) + `sameString` + `CELLO_STRINGS` table (string ranges) + `phraseC5` / `phraseC6` / `phraseC7` (route every gliss pitch through `glissStep`). | Structural: phrases call `glissStep` directly. `faceShapedCount(forGliss=true)` minimum is 1, not 0. `phraseC6` forces `count ≥ 2`. `phraseC7` always fires ≥1 drift regardless of `isSingle`. | Always-on per-phrase log line: `inst N CX face=F slides=S leaps=L dur=D` from `scheduleRelease`'s natural-end task. Promotes to `GLISS FAIL ... slides=0 leaps=0 ...` if both are 0. Stolen phrases clear `glissExpected` in `stealInstance` to avoid false positives. The slide/leap breakdown lets the user audit string-crossing distribution per face/intensity in real time. |
| **Immediate first gliss** (D43 + D53) — the first `glissStep` of every C5/C6/C7 voice fires at a per-complex first-gliss time from phrase start, independent of duration. C5/C6 use `FIRST_GLISS_MS = 150` ms (anchor establishes a clear starting pitch before the slide). C7 uses `FIRST_GLISS_MS_C7 = 30` ms (D53 — anchor barely audible, drift starts almost immediately so C7's "wispy ephemeral wandering" character reads as continuous floating rather than C6's deliberate stepping). A stolen-short voice (fast turn at ~300 ms) still delivers an audible slide instead of playing as a sustained single note. | `max/xk_swam.js` `FIRST_GLISS_MS` and `FIRST_GLISS_MS_C7` constants; `phraseC5` / `phraseC6` / `phraseC7` schedulers | Structural: phrases schedule idx 0 (C5, C7) or idx 1 (C6) at the per-complex first-gliss time as a hard constant; remaining slides distribute through the phrase tail. `scheduleRelease`'s 200 ms floor is always > both first-gliss times, so the first slide never races the release ramp even at tiny durations. C7's 30 ms is also large enough that the noteon→scheduled-noteoff window remains GLISS_OVERLAP_MS = 60 ms (the overlap is the schedule, not the gap between the two noteons). | No dedicated failure log — the D42 "GLISS FAIL overlaps=0" counter catches any regression that would affect this too. Slide latency is a tunable, not an invariant. |
| **Min gliss spacing** (D45) — consecutive `glissStep` events on a single phrase are never closer than `MIN_GLISS_SPACING_MS` (200 ms). SWAM's Mono Poly Release portamento needs ~150–200 ms to engage; tighter overlaps abort the in-progress slide and audibly collapse to fast leaps instead of slides. Phrases that can't fit their requested count at this spacing get `count` clipped to whatever fits — typical 1–3 s phrases keep every event because their ideal spacing already exceeds the floor. | `max/xk_swam.js` `MIN_GLISS_SPACING_MS` constant; `glissSchedule` helper used by `phraseC5` / `phraseC6` / `phraseC7` | Structural: every gliss complex routes its event timing through `glissSchedule(maxCount, firstMs, tailEnd, MIN_GLISS_SPACING_MS)` which enforces the floor and truncates count if events would run past `tailEnd`. | No dedicated failure log — same shared D42 "GLISS FAIL" catches anything that breaks gliss entirely. Spacing is a tunable; if SWAM behaviour changes, raise/lower `MIN_GLISS_SPACING_MS`. |
| **Leap-alternation with anchor seed** (D48 + D51 + D52) — leaps (cross-string `leapStep`) are capped at `MAX_CONSECUTIVE_LEAPS = 1` consecutive run. Once that count is reached, the next would-be cross-string outcome is nudged onto source's strings to force a slide. Phrase anchor *is* re-seeded for C5 (`phraseC5` sets `inst.consecutiveLeapCurrent = MAX_CONSECUTIVE_LEAPS` at phrase start) so the first event is also forced to slide — wild gliss must always *begin* with a slide, matching the user's "wild gliss should ALWAYS start with a gliss, just like ord gliss" rule. C6 (`MIN_LEAP = 1`) and C7 (small drifts) are mostly same-string already; the rule is a no-op for them and they don't apply the anchor seed. | `max/xk_swam.js` `glissStep` (counter-gated nudge) + `nudgeToSameString(sourcePitch, preferTarget, minLeap)` (picks a same-string target ≥ minLeap from source; candidate strings shuffled when source sits in a multi-string overlap zone so trajectory isn't biased toward one string) + `phraseC5` seeds `inst.consecutiveLeapCurrent = MAX_CONSECUTIVE_LEAPS` for the forced-slide opening; `handleVoice` zeros `consecutiveLeap*` counters generically. `MAX_CONSECUTIVE_LEAPS` tunable: 1 (strict alternation, current), 2 (balanced), 3+ (looser, more leap-clusters). | Structural: `glissStep` checks `(inst.consecutiveLeapCurrent | 0) >= MAX_CONSECUTIVE_LEAPS && !sameString(...)` and nudges target to same-string before dispatch. `nudgeToSameString` returns null only when source is at the extreme of every string it sits on with no minLeap headroom in either direction (rare — extreme cello-range corners). | Per-phrase log in `scheduleRelease` natural-end task tracks `inst.consecutiveLeapMax`. `consecutiveLeapMax > MAX_CONSECUTIVE_LEAPS` (run exceeded tolerance despite the nudge) promotes to `GLISS RUN FAIL inst N CX face=F slides=S leaps=L consecLeapMax=M dur=D`. Otherwise the existing per-phrase `slides=S leaps=L` line is unchanged. If GLISS RUN FAIL is frequent, narrow `pickPitch`'s C5 register or lower `MIN_LEAP`. |
| **Selector re-assertion** (D44) — CC 81 (Bow Polyphony) is asserted on every `/xk/voice` event regardless of cached state. Selectors like Bow Polyphony / Harmonics / Tremolo can desync between the bridge and SWAM (preset reload races, MIDI Learn glitches, voice steal during plugin re-init). Diff guards that "skip the same value" silently freeze the plugin in the wrong mode — most commonly Mono Poly Release stuck on, killing both double stops and any other Double/Hold-dependent texture. | `max/xk_swam.js` `setBowPolyphony` (no diff guard) + `handleVoice` per-voice CC 81 re-assert | Structural: `setBowPolyphony` always writes CC 81; `handleVoice` writes CC 81 again per voice using `cmx.bowPoly` from the COMPLEX table. | `log("inst N bowPoly=T cc81=V")` on every selector write — read the Max console to verify the bridge is asserting the expected mode for each complex. (Same diff-guard pattern still exists on `setHarmonics` / `setTremolo`; not changed here because they haven't been reported broken — but if they ever drift the same way, apply the same fix.) |
| **Phrase dynamic arc** (D47, Phase 1) — sustained multi-note complexes (C2/C3/C4/C8) emit a single linear CC 11 ramp across the full phrase duration: cresc TO `inst.peakExpr × ARC_CEIL` for swell faces (L/F/F'), dim FROM `inst.peakExpr × ARC_CEIL` to `× ARC_FLOOR` for fade/burst faces (U'/L'/R'). Replaces the legacy 3-stage attack/peak/sustain envelope, whose 25%-peak then 70%-sustain shape was identical phrase to phrase regardless of face/intensity, flattening the instrument's fluidity. The K-dynamic (`inst.peakExpr`, baked from `INTENSITY_MAP × pathScale × envPeakMult`) becomes a directional destination/origin instead of a transient peak. isSingle envelopes (pluck/stab/drone) and gliss complexes (C5/C6/C7) keep the legacy path — single notes don't have an arc, gliss owns its own contour. | `max/xk_swam.js` `ARC_FLOOR` / `ARC_CEIL` / `ARC_COMPLEXES` constants; `phraseArcDirection(inst)` (face envelope → 'cresc'/'dim'/null) + `schedulePhraseArc(inst, peakExpr, dir, durMs)` (ccForce snap + single rampCC); dispatch in `handleVoice` selects arc vs `scheduleExprEnvelope` per `(complexType, faceEnvelope)`. Voice steal cancels via existing `cancelPhrase → cancelCCRamp(CC.EXPRESSION)`. | Schedule-time `inst N phraseArc dir=cresc face=swell start=38 end=127 dur=2500ms` log confirms direction landed before play. Natural-end assertion in `scheduleRelease`: `ccCache[CC.EXPRESSION]` should equal `phraseArcEnd` ±8 of 127 (~6%); promotes to `ARC FAIL inst N CX face=F dir=cresc landed=L want=W off=O dur=D` on miss. Hits emit `inst N CX arc=cresc 38->127 dur=2.50` for direction audit in `[print xk_swam]`. Stolen voices clear `inst.phraseArcDir` via the new voice's snapshot, so the assertion only fires on natural ends. Phase 2 (deferred): consecutive same-direction voices within ~1 s onset gap chain into a single arc spanning all of them — design captured in `docs/research_notes.md` § Phrase Dynamic Arcs. |

(Add rows here when you formalize harmonics / tremolo / KS invariants. Same structure: *what* must hold, *where* it's enforced, *how* a failure surfaces in the log.)

## Dashboard Visual Invariants

The dashboard has its own silent-failure surfaces analogous to the bridge's. Two pieces of code computing "the same thing" independently — pitch-axis math in `midiToY` vs cell layout in flexbox; gliss trajectory in white-line vs rolling-chain — drift apart on every refactor unless the contract is written down and tested at runtime. Every row below was added after a regression that took multiple iterations to fully fix; the invariant is what stops it coming back.

| Invariant | Scope | Enforcement | Telemetry on failure |
|-----------|-------|-------------|----------------------|
| **Sieve cell distribution** — all 49 sieve cells (semitones C2..C6) occupy equal vertical share of the strip's inner height. Empty (no-text) cells must NOT collapse to content height; octave-labelled cells must NOT win extra space. | `public/dashboard.html` `.sieve-strip` (flex container) + `.sieve-cell` (`flex: 1 1 0`, `min-height: 0`). The flex container MUST be the immediate parent of cells (nesting a non-flex `.sieve-strip` inside `.ovl-sieve-right` quietly disables the layout). | Structural: cells get `flex: 1 1 0` and `min-height: 0`; `.sieve-strip` carries `display: flex; flex-direction: column-reverse`. | Dev assertion at sieve init: read 5 octave cell rects via getBoundingClientRect, assert `(C2.center − C6.center) / 48 ≈ cellH` to ≤1 px. Promotes to `console.error('SIEVE LAYOUT FAIL: cells uneven, expected cellH=X got cellH=Y')` on drift — only fires if a CSS refactor breaks the flex contract. |
| **midiToY ↔ sieve-cell-Y agreement** — for any pitch P in [36, 84], `midiToY(P)` (rolling-score canvas device-px) ≡ sieveCells[P − 36] vertical centre (CSS-px × dpr) within `PITCH_AXIS_DRIFT_THRESHOLD_PX = 2` CSS px. Both compute `inset_top + (48.5 − (P − 36)) × innerH / 49`; the constants must stay in sync. The rolling-score's `--roll-top-inset`/`--roll-bottom-inset` CSS vars and the JS constants `ROLL_TOP_INSET_PX`/`ROLL_BOTTOM_INSET_PX` must match. | `public/dashboard.html` `midiToY` (JS) + `.ovl-sieve-right { top: var(--roll-top-inset); bottom: var(--roll-bottom-inset); }` (CSS) + `.sieve-strip` 49-cell flex distribution. | Structural: midiToY uses 49-bin centres (`(48.5 − i) × innerH / 49`) — NOT 48-bin (interval count). CSS top/bottom matches JS constants. | Dev assertion run once per resize: for pitches {36, 48, 60, 72, 84} compute `midiToY(P) / dpr` (CSS px) and compare with `sieveCells[P − 36].getBoundingClientRect().top + h/2`. Drift > 2 CSS px → `console.error('PITCH AXIS FAIL P=X expected=Y got=Z drift=D')`. The 2 px threshold absorbs the 1.0–1.2 px subpixel-rendering drift caused by `canvas.height = round(window.innerHeight × dpr)` integer rounding plus browser flex-snap at non-integer dpr / non-100% browser zoom (the (48.5/49) ≈ 0.99 multiplier at the bottom cell amplifies the canvas-vs-CSS innerH discrepancy). Architectural drift (49→48 bin refactor, inset-constants desync, flex regression) is 10+ px so the threshold still fires loudly on it. Proper fix (drive midiToY off CSS-derived `window.innerHeight` instead of canvas-derived, OR a dpr-aware threshold) deferred to v2 → main reintegration. |
| **Gliss-line trajectory equals drawn-note trajectory** — white triangle leg endpoint Y at any time t equals rolling-score gliss-chain pitch curve Y at the same t, ≤1 px drift. Both must use the same easing (`easeSlide` cubic smoothstep), the same per-complex portamento times (`PORTAMENTO_MS_PER_SEMITONE = { 5: 50, 6: 80, 7: 115 }`), and the same retarget rule (mid-slide noteons hand off the *currently displayed* pitch, not the discrete prev `toPitch`). | `public/dashboard.html` `easeSlide` + `predictGlissDuration` (white line) + `_glissEase` + `_glissChainDur` + `_buildGlissSegments` (rolling chain). v2: planned to consolidate into one shared `gliss-trajectory.js` module — see `docs/todo.md`. | Structural: same constants table for both, same easing function. Both code paths derive `pitchAt(t)` from a segment list with identical interpolation. | Dev assertion sampled every ~1 s: pick the active gliss line's current Y (CSS px), find the rolling-chain's polyline Y at the same X, assert drift ≤1 px. `console.error('GLISS SYNC FAIL line=Y chain=Y drift=D voice=V complex=C')` on miss. |
| **Slide-vs-leap classifier consistency** — white-line and rolling-chain must classify the same MIDI pattern identically. A leap (clean `noteoff → 50 ms gap → noteon`) AND a voice steal (`stealInstance`'s synchronous `noteoff(old) → noteon(new)` at gap ≈ 0 ms) must result in NO line animation AND a chain break. A true slide (overlapping noteons, bridge `glissNote`) must result in a line retarget AND a chain continue. | `public/dashboard.html` unified live-entry classifier: at handleMidiEcho noteon receive time, `chainStart = true` iff no same-(voice, complex) note is currently in `activeMidiNotes`. White-line: `_findGlissLine` returns null on chainStart → instant snap. Rolling chain: `buildGlissChains` and `_findActiveGlissChain` break at any node with `chainStart=true`. The legacy `GLISS_GAP_MS = 25 ms` gap test is retained as a UDP-reorder fallback only — for the localhost path it never fires. | Structural: both code paths read the same live-entry signal. The previous gap-only chain test misclassified bridge voice steals (gap ≈ 0 ms < 25 ms) as slides and drew a spurious slant from the prior phrase's last pitch to the new phrase's anchor. | Phase 1 `assertGlissSync` catches drift between the line and the chain at every gliss-active frame (mid-slide AND instant-snap states) — `console.error('GLISS SYNC FAIL …')` if line and chain disagree by > 1 px CSS. The same assertion would catch a regression where one path consumes `chainStart` and the other doesn't. |

(Add rows when you find new silent-desync surfaces. Any time we ship a fix that "should have shipped with an assertion," add the row first.)

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

## Architecture

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

*Structural* composition math is TypeScript (`src/`): S4, K_i, C_i, sieve, face-identity, voice / duration / intensity decisions. *Phrase-level* note generation (pitches inside `foldToRange`, rebow counts, per-complex stochastic contours) currently lives in `max/xk_swam.js`; migration to TS is tracked as Phase B + Phase E tier 3. Max/MSP + SWAM Cello 3 = synthesis via MIDI. TouchDesigner / browser = visuals only.

**Shared source of truth**: OSC address constants live in `src/osc-schema.ts`; SWAM mapping tables (enums, INTENSITY_MAP, ENV_PROFILE, ART_OFF_VEL, MOTION_NUDGE, FACE_MAP, REGIME_*) live in `src/swam-mapping.ts`. TypeScript imports them directly (typed + vitest-covered); `max/gen_includes.js` is a committed codegen output of the same tables — Max `include()`s it at v8 load. Never hand-edit `max/gen_includes.js`. Never add new `/xk/*` string literals outside `src/osc-schema.ts`.

### `relay.js` — BLE-to-OSC Bridge

Instantiates `XenaKubeEngine`, serves `public/dashboard.html` on `:3000`, receives cube events via WS from the browser. Run: `npx tsx relay.js`. Deps: `node-osc`, `ws`, `tsx`.

- **Gyro upsampling**: BLE ~10 Hz → 60 Hz via velocity-aware quaternion Kalman filter (smoothing slider 0–1, default 0.5). 60 Hz loop uses `process.hrtime.bigint()` spin timer — `setInterval` drifts to ~40 Hz on Windows. OSC (Max / TD) gets `kf.q` — low-latency, predict-based. The dashboard `gyro_tick` WS message gets a separately-computed SLERP-interpolated quat trailing BLE by `VISUAL_DELAY_MS` (120 ms) from a raw-sample ring buffer — sacrifices latency for zero extrapolation artefacts on static holds. Full engine-state bursts (`state` / `gyro_state`) still fire at BLE rate via `engine.onGyro`.
- **Control messages** (WS → relay): `set_diagram`, `clear_diagram`, `set_mode`, `reset`, `get_diagrams`, `set_gyro_smoothing`, `cube_solved` (browser detects FACELETS==solved on the unsolved→solved edge and reports; relay fires `/xk/solve`), `zero_gyro` (mirrors the dashboard's visual zero — captures `engineGyroZeroInv = conj(kf.q)` so the engine's S4 snap cells re-center on the user's rest pose; fires on auto-zero and the Zero Gyro button).
- **Lifecycle**: auto-shutdown 5 s after last client disconnects.

### `src/` — TypeScript Engine

| Module | Role |
|--------|------|
| `engine.ts` | Orchestrator: turn / gyro → spell detection → cubes → voice output → state |
| `group.ts` | S4 group: 24 elements as vertex permutations, Cayley table, generators, tetra orbits |
| `vertices.ts` | K1–K8 vertices with V1/V2 values (D×G×U), permutation |
| `complexes.ts` | C1–C8 complex types, α/β/γ cyclic mappings (rotate every 3 subs), C_i state |
| `spells.ts` | Spell book (7 canonical × 24 rotations = 168 variants) + rolling buffer matcher |
| `scramble.ts` | BFS distance from identity in S4 Cayley graph, normalized 0–1 |
| `voice-engine.ts` | Sequential (1 voice) vs polyphonic (8 voices) output decision; stamps `face` on each `VoiceOutput` |
| `face-gesture.ts` | Temporal Identity 12-face signature table + modulation-rule helpers (pitch class / register / parity / intensity) |
| `expression.ts` | Gyro quaternion → continuous control values (tilt, spin, deviation, scramble) |
| `mode-manager.ts` | Performance state machine: voice mode, palette, variant, freeze; spell effects |
| `turn-rate.ts` | Circular buffer → EWMA rate → regime classification with hysteresis |
| `kinematic.ts` | Graph paths through S4: pre-composed diagrams + free traversal |
| `sieve.ts` | L(m,n) logical function, prime residual classes mod 18, metabola mutations |
| `quaternion.ts` | Gyro → nearest S4 snap, deviation factor |
| `osc-output.ts` | Engine state → OSC message batches (uses `OSC.*` constants — no raw literals) |
| `osc-schema.ts` | Single source of truth for every `/xk/*` / `/gan/*` address + `vertexAddr()` / `complexAddr()` helpers. Codegen'd into `max/gen_includes.js`. |
| `swam-mapping.ts` | Shared SWAM mapping (enums, value maps, INTENSITY_MAP / ENV_PROFILE / ART_OFF_VEL / MOTION_NUDGE / FACE_MAP / REGIME_*, helpers `harmonicsForC4` / `faceShapedCount` / `stepVelScale` / `commitSieveWalk` / `faceTranspose`). Vitest-covered. Codegen'd into `max/gen_includes.js`. |
| `types.ts` | Shared type definitions |
| `index.ts` | Public API re-exports |

### `docs/` — Documentation

| File | Role |
|------|------|
| `xenakis_nomos_alpha_primary_source.md` | *Formalized Music* pp. 214–237 full text |
| `research_notes.md` | References, design rationale, Xenakis→XenaKube mapping, further reading |
| `todo.md` | Phased implementation roadmap |
| `swam_cello_reference.md` | Authoritative SWAM v3.8+ parameter / CC / KS reference |
| `revision_roadmap.md` | SWAM-bridge refactor diagnoses (D-codes) and phase progress |

### `public/` — Browser Dashboard

`dashboard.html` at `http://localhost:3000`. Full-viewport HUD: `#cube-canvas` fills the window; all UI floats as transparent overlays. Three.js 3D cube with per-vertex K#/D/G/U labels, ghost cube showing S4 snap target (opacity = deviation). WS client to relay. Pixel/zoom values live in CSS (L48–60).

**Module layout (Phase 2 — incremental extraction in progress):**
- `dashboard.html` — HTML structure + a single `<script type="module">` that imports modules from `./js/` and inlines whatever hasn't been extracted yet.
- `js/constants.js` (Phase 2.1) — shared immutable constants (`ROLL_*` insets / pitch range / brush scale, `GLISS_GAP_MS` / `GLISS_COMPLEXES`, `PORTAMENTO_MS_PER_SEMITONE` / `GLISS_PORTAMENTO_MS_PER_SEMITONE` mirrors of the bridge, `COMPLEX_COLOR` palette, `PIZZ_FADE_MIN/MAX_MS`, `PENDING_MAX_AGE_MS`). Mutable runtime state (slider-driven `ROLL_PX_PER_SEC`, dynamically-measured `ROLL_RIGHT_INSET_CSS_PX`) stays inline until a future phase exposes setters.
- Future phases (2.2–2.9) extract `css/main.css`, `js/transport.js`, `js/sieve.js`, `js/cube-scene.js`, `js/rolling-score.js`, `js/triangle.js`, `js/state-ui.js`, `js/main.js` per the plan in `docs/todo.md`.

Overlays:
- **Top-left** (`.ovl-tl`): title + MAC/connect (button turns green via `.connected`), mode badges, active K/C cards.
- **Bottom-left** (`.ovl-bl`, anchored `bottom: 110px`): State panel (face, active voice, S4 element, path, step, snap, complex phase, orbit, scramble, permutation), then Expression panel (Zero Gyro + smoothing slider + tilt/spin/deviation/scramble). `zoom: 0.5` applies per-child to keep the bottom anchor zoom-invariant so the stack never overlaps the sieve strip.
- **Top-center** (`.ovl-tc`): spell buffer + spell notification. Move strip is a dashboard-side 8-move FIFO (`recentMoves`, `RECENT_MOVES_MAX = 8`), decoupled from the engine's `state.spellBuffer` (which clears on its own 2 s timeout / spell-fire); each turn pushes one move and shifts the oldest, so the strip never empty-flashes. Match-highlighting still consumes `state.spellPartials` and applies to the trailing N entries.
- **Top-right**: cam / live / ghost rotate toggles + rotation gizmo.
- **Bottom**: full-width sieve piano-roll (C2–C6).
- **Background** (`<canvas id="rolling-score">`, `position: fixed; inset: 0; z-index: -1`): rolling piano-roll behind cube-canvas (`alpha: true`). Right edge = `now`, scrolling left at `ROLL_PX_PER_SEC` CSS-px/sec (default 360, retunable live via the `score` slider in the expression panel — value persists in `localStorage`). Pitch axis C2..C6 maps into the *inner* rectangle defined by `ROLL_TOP_INSET_PX = 70` / `ROLL_BOTTOM_INSET_PX = 80` so notes never paint under the title / spell row / cam strip or the bottom sieve. Each note rendered via a per-complex procedural brush (`COMPLEX_BRUSH` dispatch; reference `docs/brushes.png`): C1 pizz=spatter, C2 arco=rough wash, C3 arco=watercolor, C4 harm=airbrush halo, C8 sul-pont trem=chalk grit. Gliss complexes C5/C6/C7 bypass per-note brushes — each chain (maximal run of same-voice + same-complex notes within `GLISS_GAP_MS = 80` ms) is drawn as a single stroked Path2D (`drawGlissChain`) with `lineJoin = 'round'`, so the rect-body / slant-transition / rect-body polyline reads as one continuous brush stroke. Brush vertical dimensions go through `bu(factor) = rollRowH * factor * ROLL_BRUSH_SCALE` where `rollRowH` is the device-px height of one semitone in the current viewport (recomputed every frame). This keeps brushes proportional across screen sizes — a 1.45-row chalk band stays 1.45 rows on a 1080p monitor and on a 13" MacBook. `ROLL_BRUSH_SCALE` (default 1.4) is the single global tuning knob. Colours per complex (C1 amber, C2/C3 cobalt, C4 cyan, C5/C6/C7 magenta, C8 crimson); velocity → opacity. Stochastic brush textures use a mulberry32 stream seeded from `(voice, pitch, onsetMs)` so each note's speckle pattern is identical every frame. Per-key FIFO queue for in-flight notes (`activeMidiNotes: Map<key, Array<entry>>`) — bridge legitimately emits overlapping noteons on the same pitch (C8 trem rebows, double-stop companion, humanPitch collisions) and the queue preserves each iteration as a distinct rendered note instead of overwriting. Watchdog finalises any active note stuck >45 s. Data source: `midi_echo` WS messages mirrored from Max; Phase E tier 3 will switch to TS-generated note lists once the phrase migration lands.

Only the active K/C cards render; the 8-vertex/complex grids and legacy controls are populated but hidden via `.ovl-legacy`.

After editing `dashboard.html`, load `:3000` and verify the rolling score renders, K/C cards stay visible, and Zero Gyro works at 100% and 50% browser zoom.

## OSC Reference

Full address table: see `docs/osc-reference.md`. Routing summary that's load-bearing for any session:

- `/xk/*` → Max (`127.0.0.1:57121`). `/gan/*` → TD (`127.0.0.1:8000`).
- `/xk/midi/{noteon,noteoff,panic}` flows the *other direction* — Max → relay on `127.0.0.1:57122`. The dashboard rolling-score consumes these via WS `midi_echo`.
- `/xk/voice` (vertexIdx, complexType, density, intensity, duration): the load-bearing voice trigger. Fires only on real voice transitions (`engine.onVoice`), not per gyro packet. `/xk/face` precedes it for face-moves.
- `/xk/panic` (no args): relay-disconnect signal. Both bridges flush notes + CCs.

**Source of truth**: address strings live in `src/osc-schema.ts`. Never add new `/xk/*` literals outside that file — the schema is codegen'd into `max/gen_includes.js` (`npm run gen:max`).

## Performance Model

### Core Loop

Each physical cube turn:

1. Move → **spell detector** (168 rotation variants of 7 canonical algorithms).
2. If spell matched → **mode manager** applies effect.
3. K_i advances (S4 right-multiplication → parameter permutation).
4. C_i advances (complex type permutation).
5. If the move is one of the 12 face-moves → emit `/xk/face` (before voice dispatch).
6. **Voice engine** emits active voices (1 in sequential, 8 in polyphonic); each voice carries its `face`.
7. **Expression processor** supplies continuous gyro-derived controls.
8. State broadcast to Max (OSC) + dashboard (WS).

### Voice Modes

- **Sequential**: one active vertex at a time, cycling through positions.
- **Polyphonic**: all 8 vertices sound simultaneously; each turn morphs the ensemble.

### Engine Modes

- **K_i**: `direct` (physical turn = S4 transform) or `diagram` (pre-composed path advanced by each turn).
- **C_i**: `algorithmic` (own S4 diagram) or `gyro` (quaternion snapped to nearest S4 element).
- **Path V1**: D strong, G strong, U weak (2–5 s durations, mf–fff).
- **Path V2**: D strong, G average, U strong (10–30 s, p–f).
- **Freeze**: turns still detected but state doesn't advance.

### Spell System *(current = mode-toggles; pivoting to phrase-library — see `docs/todo.md`)*

Rubik's algorithms detected from the move stream currently trigger **mode changes** (toggle polyphony, flip path, adjust palette). The spell book covers the 6 CFOP fundamentals plus Niklas (archetypal 3-cycle commutator). Algorithms are **orientation-independent** — each is expanded into all 24 whole-cube-rotation variants at load time, so the same finger pattern fires on any face pair. Spells **layer**: a shorter spell that's a prefix of a longer one fires first; the long one fires on completion. Turns always produce sound; spells are bonus triggers on top.

| Name | Canonical Algorithm | Moves | Role | Effect |
|------|---------------------|-------|------|--------|
| sexy-move | R U R' U' | 4 | CFOP F2L trigger | Toggle path V1 ↔ V2 + bow-pressure accent ping (V toggle moved here from niklas 2026-04-24) |
| oll-cross | F R U R' U' F' | 6 | 2-look OLL: edges | Variant → drone |
| sune | R U R' U R U2 R' | 8 | 2-look OLL: corners | Harmonic ping → OCT_5TH (perfect 12th) |
| anti-sune | R U2 R' U' R U' R' | 8 | 2-look OLL: inverse corners | Palette → V1 |
| niklas | R U' L' U R' U' L | 7 | Commutator (corner 3-cycle) | CTRL harmonic ping (no mode toggle — V swap moved to sexy-move 2026-04-24) |
| u-perm | R U' R U R U R U' R' U' R2 | 12 | 2-look PLL: 3-edge cycle | Variant → burst |
| t-perm | R U R' U' R' F R2 U' R' U' R U R' F' | 15 | 2-look PLL: corners + edges | Reset variant + palette |

**Half-turn convention (CCW)**: GAN hardware only reports 90° clicks, so `U2`/`R2` are stored as two CCW quarter-turns. Performers must flick half-turns CCW (speedcube default); CW flicks won't trigger the spell. Required technique — the cost of a lean spellbook.

**Overlap suppression**: after a spell fires, spells whose buffer **partially overlaps** are suppressed. **Full containment** (e.g. a T-perm sequence starting with a sexy-move prefix) remains allowed — layered detection preserved. Buffer timeout 2 s, max 20 moves.

### Expression (Continuous Gyro Control)

| Parameter | Source | Range |
|-----------|--------|-------|
| tilt | Pitch angle from quaternion | 0 (face down) – 1 (face up) |
| spin | Angular velocity between frames | 0 (still) – 1 (fast) |
| deviation | Distance from nearest S4 snap | 0 (locked) – 1 (boundary) |
| scramble | BFS distance from identity in S4 | 0 (solved) – 1 (max) |

### Key Math

- **S4**: 24 rotations generated from X90, Y90, Z90. Cayley table computed at load.
- **Move mapping**: face turns → whole-cube S4 rotations. R and L' produce the same element — 18 moves collapse to ~9 distinct S4 elements. Temporal Identity restores the discarded face-identity information as the primary sound-bearing signal, running parallel to S4 (which still drives K_i / C_i permutation, now modulating gesture content rather than selecting it).
- **α/β/γ cycle**: C_i mapping rotates every 3 substitutions.
- **Sieve L(m,n)**: pitch sets from prime residual classes mod 18; metabola every 3 subs.
- **Tetra orbits**: 12 even (preserve tetrahedra) + 12 odd (swap).

## Synthesis Bridge — Max/MSP + SWAM Cello

Synthesis layer: SWAM Cello 3 driven via MIDI from a Max/MSP bridge on port 57121. Single-instance model — `POOL_SIZE = MAX_ACTIVE = 1` in `xk_swam.js`; voice steal hard-kills the previous gesture (CC 11 = 0 + CC 120 + CC 123 + tracked noteOffs).

The **Bridge Invariants** table above is the load-bearing summary — those are the silent-failure surfaces every change must preserve. Everything else (patch topology, the `max/` file roles, the per-complex Mapping Cheatsheet, Max MCP integration rules) lives in **`docs/synthesis-bridge.md`** — read it when working on `max/xk_swam.js`, the `.maxpat`, the SWAM preset, or any per-complex routing.

**Subagent rule**: route all live-patch edits through the `max-patch` subagent (`.claude/agents/max-patch.md`); it has the MCP tools scoped. Confirm before any `mcp__maxmsp__*` mutation tool fires, even under `--dangerously-skip-permissions`. Patch edits desync from `xk_swam.js` / `gen_includes.js` easily.
