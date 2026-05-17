# CLAUDE.md

> **v2 fork** of XenaKube/ — independent working tree for modular-dashboard + WebGL visual work. Synthesis pipeline (relay.js → engine → OSC → Max → SWAM) is identical to v1; bridge invariants below apply unchanged. Phased work in `docs/todo.md`.

## XenaKube

Real-time instrument: GAN i4 smart Rubik's cube → SWAM Cello physical-modeling synthesis + browser visuals. Cube turns are musical events; Rubik's **cube algorithms** (named move sequences like sexy-move, sune, t-perm) trigger musical gestures. Built on S4 group math (24 cube rotation symmetries) inspired by Xenakis' *Nomos Alpha*.

**Temporal Identity model**: each of 12 face-moves owns a distinct gesture *type*. K_i supplies density / intensity / base duration; face signatures reshape duration, envelope, articulation, and velocity contour without prescribing register or pitch direction. Half-turn pairs render short fff punctuation independent of K/C/face phrase shape. Turn rate adds bounded per-complex pressure on top of K_i. The solve edge anchors to beta-cosmo.

Primary source: `docs/xenakis_nomos_alpha_primary_source.md` (*Formalized Music* pp. 214–237). Design rationale and performer-frame discussion: `docs/research_notes.md`.

## Doc Maintenance

When you change code, update the affected doc in the same commit; keep the terse style and don't add disclaimers to stale content — fix it.

| File | Owns |
|------|------|
| `CLAUDE.md` (this file) | Architecture, file roles, OSC routing, commands, invariants index. **Present-state only** — no dates, no narrative history. |
| `AGENTS.md` + subtree `AGENTS.md` | Repo-local agent instructions; keep in sync with this file when workflow / source-of-truth / invariants change. |
| `CHANGELOG.md` | Dated entry per user-visible change. |
| `docs/todo.md` | Phased roadmap. |
| `docs/research_notes.md` | Design rationale, primary-source notes. |
| `docs/revision_roadmap.md` | SWAM-bridge D-codes and phase progress. |
| `docs/swam/swam_cello_reference.md` | Authoritative SWAM v3.8+ parameter / CC / KS reference. |
| `docs/synthesis-bridge.md` | Max/MSP + SWAM bridge deep dive (patch topology, `max/` roles, mapping cheatsheet, MCP). |
| `docs/sphere-engine.md` | Gamelan sphere-engine reference: pack provenance, instrument inventory, tunings, pipeline, mandala-cosmo K→sphere mapping, mandala canvas, D75–D78 + D80–D83. |
| `docs/bridge-invariants.md` | Full Scope/Enforcement/Telemetry per Bridge Invariant. |
| `docs/dashboard-invariants.md` | Full Scope/Enforcement/Telemetry per Dashboard Visual Invariant. |
| `docs/dashboard-architecture.md` | Browser dashboard reference (module layout, cross-module reads, overlay positioning, brushes). |
| `docs/spectrogram_roadmap.md` | Optional actual-audio spectrogram feature roadmap. |
| `docs/interruption-layer-plan.md` | Optional interruption-layer design. |
| `docs/performance-model.md` | Musical / structural model (core loop, voice modes, algorithm book, gyro mapping, key math). |
| `docs/osc-reference.md` | Full OSC address table. CLAUDE.md keeps only the routing summary. |
| `docs/xenakis_nomos_alpha_primary_source.md` | *Formalized Music* pp. 214–237. |
| `docs/xenakube-operation-manual.md` | Performer-facing operation manual. |
| `docs/xenakube-feedback-04302026.md` | Dated artistic feedback; not a current-behavior spec unless promoted elsewhere. |
| `README.md` | User-facing setup. |

**Hard rule**: implementation status, dated decisions, and D-numbered diagnoses live in `docs/revision_roadmap.md` and `docs/todo.md`, not here. The only D-codes that appear in CLAUDE.md are those naming an active invariant in the table below.

**Size budget**: CLAUDE.md auto-injects into every Claude Code conversation, so its bytes compound per turn. `npm run check:docs` enforces: **file ≤ 40,000 bytes** (perf threshold); **invariant row ≤ 1,200 chars**. Soft warns at 36,000 / 800. When a D-code expands an invariant: full Scope/Enforcement/Telemetry prose goes in `docs/{bridge,dashboard}-invariants.md`; only touch the CLAUDE.md row if *claim/where/log* changed, and keep it within budget. The two invariant docs are the source of truth; CLAUDE.md is the always-loaded index.

### Drift Detection

`npm run check:docs` runs four passes that gate pre-commit alongside `tsc --noEmit` and `npm test`: **constant-sync** (every tracked numeric constant from `scripts/check-doc-sizes.mjs` vs co-located literals in tracked Markdown), **osc-coverage** (every `/xk/*` literal in docs vs `src/osc-schema.ts`), **doc-index** (every `docs/*.md` outside `archived/` referenced in the Doc Maintenance table above), and **size budget** (CLAUDE.md ≤ 40 KB; any invariant row ≤ 1,200 chars). Treat a fire like a `GLISS FAIL`: resync the doc literal or the source of truth, don't suppress.

**Awaiting automation** (promote on next regression): OSC arg-comment coverage (D74's missing `-` sentinel); invariant-row symbol existence in "Where enforced"; failure-log message presence in the named source file.

Workflow rules that keep these checks small — never quote tunables by value, every paired mirror constant gets a vitest test in `test/dashboard-bridge-sync.test.ts`, new OSC literals go through `src/osc-schema.ts` first — live in `AGENTS.md § Drift hygiene`.

**Before commit**: `npx tsc --noEmit && npm test && npm run check:docs`. If you touched `src/osc-schema.ts`, `src/swam-mapping.ts`, or `src/face-gesture.ts`, also `npm run gen:max` and reload the v8 object in Max — drift between TS and `max/gen_includes.js` is the single largest source of silent bugs.

## Recurring-Bug Discipline

If a symptom has been "fixed" before and regressed (gliss silent, harmonics flashing, KS misfire, expression stuck — anything that failed, got patched, and failed again later), do NOT ship another local patch. The root cause of recurrence is always the same: the fix had no runtime invariant, so the next refactor silently re-broke it. Follow this order instead:

1. **First, add the invariant.** A per-voice counter / assertion that logs a loud `FAIL` line when the expected behavior didn't happen. Commit on its own.
2. **Run the instrument, read the logs.** Prove the bug is still present *and* the telemetry catches it. If the telemetry never trips, the invariant is wrong — not the code.
3. **Only then fix the code.** The fix is correct when telemetry goes silent during normal play and loud again when you deliberately regress it.

Surgical one-line fixes without an invariant are the main reason portamento took 3+ "restore" commits to actually stay fixed. Don't do it again.

**Applies to the dashboard's visual layer too** (rolling-score, sieve cell distribution, gliss trajectory, pitch-axis alignment, slide-vs-leap classification). Visual desyncs are silent-failure surfaces just like bridge selectors. Every Dashboard Visual Invariant earns the same treatment: invariant first, telemetry second, fix third.

## Bridge Invariants

SWAM Cello is a stateful physical-modeling VST. Several features (portamento, harmonics, tremolo, bow polyphony, expression envelope) depend on the plugin being in a specific internal mode that no MIDI wire inspection can confirm. These are silent-failure surfaces: you can emit "correct-looking" MIDI and get no slide, no harmonic, no tremolo. Every such feature must be paired with a runtime invariant that fails loudly.

**Hard rule for modulators**: they may *reshape* a complex's gesture (duration, velocity, density, timbre, surface contour) but MUST NOT *eliminate* the structure that defines the complex's identity. Face-level modulators specifically must not prescribe register or pitch direction; pitch comes from the sieve, phrase generator, and cello-range fold. Face `isSingle` collapsing C5/C6/C7 to zero gliss steps was the exact mistake D42 fixed — when adding a modulator that touches voice dispatch, re-audit every invariant below.

Full enforcement detail: **`docs/bridge-invariants.md`**. Below shows the primary anchor for each row — full file/symbol list lives there.

| Invariant (claim) | Where enforced | Failure log |
|-------------------|----------------|-------------|
| **Gliss event count** (D42 + D46 + D59) — every C5/C6/C7 voice emits ≥1 `glissStep`; slides + bends + leaps ≥ 1. | `max/xk_swam.js` `glissStep`. | `GLISS FAIL ... slides=0 bends=0 leaps=0 ...` (per-phrase log in `scheduleRelease`). |
| **Immediate first gliss** (D43 + D53) — first `glissStep` fires at the per-complex first-gliss constant (`FIRST_GLISS_MS` for C5, `FIRST_GLISS_MS_C6` for C6, `FIRST_GLISS_MS_C7` for C7), independent of duration. | `max/xk_swam.js` `FIRST_GLISS_MS*`. | Covered by D42 `GLISS FAIL`; static guard in `test/max-bridge.test.ts`. |
| **Turn-to-noteon latency telemetry** — every normal C1-C8 phrase pins the first planned main noteon to 0 ms; `/xk/voice` should get that non-companion `/xk/midi/noteon` quickly. Measures bridge echo only, not SWAM attack or Auto Poly look-ahead. | `relay.js` latency probe around `engine.onVoice`. | `[LATENCY WARN]` ≥150 ms, `[LATENCY FAIL]` ≥250 ms / no echo in 3000 ms; logs `planFirst` / `planOverrun`; tests in `test/phrase-plan.test.ts` / `test/max-bridge.test.ts`. |
| **Shadow phrase plan + echo audit** - each voice gets a TS phrase plan id before `/xk/voice`; Max stamps `/xk/midi/*` echoes with that id so dropped/late phrase events are observable. | `src/phrase-plan.ts` + `src/phrase-audit.ts`. | `[PHRASE ECHO FAIL]` for missing/late first noteon, missing all planned bendsteps, or unexpected companions; tests in `test/phrase-plan.test.ts` / `test/phrase-audit.test.ts`. |
| **Immediate expression seed** — non-arc phrase envelopes seed CC 11 attack value synchronously before first noteon; no proportional attack ramp from 0. | `max/xk_swam.js` `scheduleExprEnvelope`. | `[ONSET EXPR WARN] ... CC11 is low` when noteon is timely but expression is below 32. |
| **Material duration + face multiplier** (D74) - K_i vertex duration is the base phrase span; face signatures multiply it and complex floors prevent identity-bearing gestures from collapsing. | `src/face-gesture.ts` `durationMult`; `max/xk_swam.js` `handleVoice`. | `FACE DURATION MULT FAIL face=F ...`; normal voice log includes `dur=Ns(vertex*face...)`. |
| **Half-turn punctuation** — rapid identical quarter-turn pairs set `halfTurn=1` on the second voice; audio bypasses normal K/C/face phrase shape and renders one short fff bowed accent dyad. | `src/engine.ts` `detectHalfTurn`; `max/xk_swam.js` `phraseHalfTurn`. | Max log `half-turn punctuation ...`; phrase/audit summaries include `half-turn=1`. |
| **Bounded turn-rate pressure** — turn rate may raise density/dynamics via per-complex `RATE_*` gains, but must preserve K_i baseline and complex identity (C8 density gain = 0; C5 floor unchanged). | `src/swam-mapping.ts` RATE helpers. | Max voice logs include `rateP=...`; tests in `test/swam-mapping.test.ts` / `test/phrase-plan.test.ts`. |
| **Min gliss spacing** (D45) — consecutive `glissStep` events must be spaced ≥ `MIN_GLISS_SPACING_MS` so each slide/bend can complete before the next target. | `max/xk_swam.js` `MIN_GLISS_SPACING_MS`. | Covered by D42 `GLISS FAIL`. |
| **Leap-alternation with per-complex tolerance** (D48 + D58) — leaps capped via `MAX_LEAPS_BY_COMPLEX`; over-cap cross-string outcomes nudged to same-string. Mostly inert post-D59 because pitchbend slides handle most cross-string intervals within `PITCHBEND_RANGE_SEMI`. | `max/xk_swam.js` `MAX_LEAPS_BY_COMPLEX` / `maxLeapsFor`. | `GLISS RUN FAIL ... consecLeapMax=M (max for CX = M_max) ...`. |
| **Selector re-assertion** (D44 + D69) — CC 78 (Harmonics) / CC 79 (Tremolo) / CC 81 (Bow Polyphony) write through every call, no diff guard; CC 81 also re-asserted per `/xk/voice`. Diff-guarded selectors silently freeze SWAM in the wrong mode after a preset-load race. | `max/xk_swam.js` `setHarmonics` / `setTremolo` / `setBowPolyphony`. | `inst N harmonics=H cc78=V` / `inst N tremolo=T cc79=V` / `inst N bowPoly=B cc81=V` per write (inspect Max console). |
| **Phrase dynamic arc** (D47, D57) — C3/4/5/6/7/8 use phrase-level CC 11 arcs; C1 is static pizz; C2 is the per-note directional-run exception (tempo curve, held CC 17, optional dyads). | `max/xk_swam.js` `schedulePhraseArc` / `phraseC2`. | `ARC FAIL ...` (C2 exempt); normal arc hits; C2 `[phraseC2 RUN] ... rate=Lo→Hi ... doubles=D/N ...`. |
| **C3 within-note bow motion** - every C3 note samples current CC 11 at note onset and immediately starts CC 16 / CC 17 ramps; lower CC 11 increases bow-travel rate, and CC 16 endpoints stay inside `BOW_POSITION_MIN..BOW_POSITION_MAX`. C3 skips global tilt/scramble CC 16 writers so the held-note ramp is not clobbered. | `max/xk_swam.js` `phraseC3` / `scheduleC3BowMotion`. | `C3 BOW MOTION FAIL ...`; normal `inst N C3 bowMotion count=N minExpr=E maxRate=R`. |
| **Bow-position smoothness / lower-half guard** (D54) - CC 16 (Bow Position) EMA-smoothed via `TILT_EMA_ALPHA` and clamped through `clampBowPosition` to the lower half; raw gyro static-pose noise would produce 30 Hz bow buzz, and out-of-band CC 16 writes would leave the requested range. | `max/xk_swam.js` `clampBowPosition` / `handleExprTilt`. | `BOW POS FLAP inst N CX reversals=R writes=W (rate=R/s, fail>BOW_FLAP_RATE_FAIL)`. |
| **Portamento state at slide** (D55, diagnostic) — every `glissNote` checked at entry: `ccCache[CC.PORTAMENTO_TIME] = cmx.portamento.time`, `ccCache[CC.PORTAMENTO_ON] = 127`, `ccCache[CC.BOW_POLYPHONY] = BOW_POLY_CC_VAL[cmx.bowPoly]`. Detects bridge cache divergence (not wire drift). | `max/xk_swam.js` `glissNote` entry-time cache check. | `PORT TIME FAIL inst N CX pitch=P wantTime=W gotTime=G gotOn=O polyOk=B`. |
| **Cross-string slide via pitchbend** (D59 + D72) — `glissStep` three-way dispatch: over-range → `leapStep`; within-range + (`slideViaBend` or cross-string) → `bendStep`; else → legacy `glissNote`. Current C5/C6/C7 all set `slideViaBend=true`, so normal gliss slides are pitchbend ramps with atomic noteoff/noteon at the end. | `max/xk_swam.js` `glissStep` / `bendStep`. | Per-phrase `slides=S bends=B leaps=L`. `GLISS FAIL` if `S+B+L<1`. Diagnostic: `BEND CLIP`, `BEND FAIL`, `bend race-fix`. |
| **Wild-gliss bend integrity** - C5 defines `wildAccent`, routes every salvo event through `glissStep`, and never fires a fresh companion noteOn while `bendPending`; companions are re-voiced only after bend/leap completion. | `max/xk_swam.js` `phraseC5` `wildAccent`. | `C5 WILD ACCENT FAIL ...`; `BEND COMPANION FAIL ...`; phrase audit `missing all planned bendsteps`. |
| **Gliss double-stop continuity + range** - C5/C6 companions use one interval safe for the planned path, then re-voice at each bend/leap target; dashboard skips out-of-range overlay samples. | `max/xk_swam.js` `doubleStopCompanionForRange` / `maybeGlissDoubleStop`. | `DOUBLE STOP RANGE SKIP/FAIL ...`; `DOUBLE STOP FAIL ...`; normal `doubleStop offset=... revoices=...`. |
| **Pitchbend MIDI channel alignment** — pitchbend MUST use the same one-based `MIDI_CH` convention as note and CC status bytes. Off-by-one pitchbend goes to channel 2 while notes stay on channel 1: telemetry shows bends, but SWAM plays straight notes. | `max/xk_swam.js` `statusPitchbend` / `emitPitchbend`. | `PITCHBEND CHANNEL FAIL status=S expected=E MIDI_CH=C ...`. |
| **Pitchbend range bridge↔preset alignment** (D64) — `PITCHBEND_RANGE_SEMI` MUST EXACTLY MATCH SWAM preset's Pitchbend Range. Mismatch silently produces audible-bend ≠ visual-bend (severe at default ±2 vs bridge ±24: 12× weaker). Breaks any time the preset changes without a paired bridge re-sync. | `max/xk_swam.js` `PITCHBEND_RANGE_SEMI` (paired with the preset's UI value). | `bang()` reload log: `=== BRIDGE PITCHBEND_RANGE_SEMI = ±N — verify this matches SWAM preset's Pitchbend Range ===` (visible in `[print xk_swam]` after every v8 reload). |

| **Sphere strike echo audit** (D75) — every `/xk/sphere/strike` emitted by relay must produce a matching `/xk/sphere/echo` within 400 ms. Suppressed until first echo arrives so a session with no sphere chain doesn't spam. | `relay.js` `sphereAudit`; `max/xk_sphere.js` `strike()` emits via ECHO_OUTLET. | `[SPHERE STRIKE FAIL] strikeId=N sample=S no echo within 400ms`. |
| **Sphere panic propagation** (D76) — `/xk/sphere/panic` must silence every gamelan voice across every instrument class within one Max tick. Fires on cosmology change, reset, WS-disconnect, and `/xk/panic`. | `relay.js` `sendSpherePanic()`; `max/xk_sphere.js` `panic()` (per-class steal + voiceRings reset). | Max log `PANIC — flushing all sphere voices`; silent success = no audible bronze after panic. |
| **Sphere sample-load completeness** (D77) — at `xk_sphere.js bang()`, loaded count must equal `GAMELAN_SAMPLE_COUNT` from `gen_sphere_includes.js`. Manifest hash logged for cross-check. | `max/xk_sphere.js` `bang()` count + hash log; relay logs `[SPHERE LOAD]` on `/xk/sphere/loaded`. | `[xk_sphere FAIL] SAMPLE LOAD FAIL expected=N got=M`; vitest `test/sphere-mapping.test.ts` cross-checks manifest vs filesystem. |
| **Sphere tuning ↔ Scala-source alignment** (D78) — `GAMELAN_TUNING_HASH` printed at `xk_sphere.js bang()` must match `src/gamelan-tuning.ts`. Drift = Scala edit not propagated via `npm run gen:max`. | `max/xk_sphere.js bang()` log; vitest `test/gamelan-tuning.test.ts` cross-checks gen_sphere_includes.js. | Manual log cross-check `=== TUNING HASH=H — verify matches src/gamelan-tuning.ts ===`; vitest fails commit if drift. |

(Add rows here when you formalize harmonics / tremolo / KS invariants. Mirror the new row's full enforcement detail in `docs/bridge-invariants.md`.)

## Dashboard Visual Invariants

The dashboard has its own silent-failure surfaces analogous to the bridge's. Two pieces of code computing "the same thing" independently — pitch-axis math in `midiToY` vs cell layout in flexbox; gliss trajectory in white-line vs rolling-chain — drift apart on every refactor unless the contract is written down and tested at runtime. Every row was added after a regression that took multiple iterations to fix.

Full enforcement detail: **`docs/dashboard-invariants.md`**. Below shows the primary anchor per row — full file/symbol list lives there.

| Invariant (claim) | Where enforced | Failure log |
|-------------------|----------------|-------------|
| **Sieve cell distribution** — all 49 sieve cells (C2..C6) occupy equal vertical share. Empty cells must NOT collapse to content height. | `public/css/main.css` `.sieve-strip`; `public/js/sieve.js`. | `SIEVE LAYOUT FAIL: cells uneven, expected cellH=X got cellH=Y` (`assertSieveLayout`). |
| **midiToY ↔ sieve-cell-Y agreement** — `midiToY(P)` ≡ sieve-cell centre within `PITCH_AXIS_DRIFT_THRESHOLD_PX`. CSS `--roll-*-inset` and JS `ROLL_*_INSET_PX` must match. 49-bin centres (not 48). | `public/js/rolling-score.js` `midiToY`; `public/js/sieve.js`. | `PITCH AXIS FAIL P=X expected=Y got=Z drift=D` (`assertPitchAxis` per resize). |
| **Gliss-line trajectory equals drawn-note trajectory** (D65 + D66) — white triangle leg endpoint Y == rolling-chain pitch curve Y at same t (≤5 px drift). Byte-identical easing, per-complex portamento times, retarget rule, segment-dur predictor clamped by `GLISS_SLIDE_MAX_DUR_MS`, bend-segment p0-inheritance from audible pitch (D65). | `public/js/triangle.js` `easeSlide`; `public/js/rolling-score.js` `_glissPitchAt`. | `GLISS SYNC FAIL voice=V ... drift=Dpx linePitch=L chainPitch=C ...` (`assertGlissSync` ~1 Hz when active). |
| **Gliss companion overlay range** - gliss companion overlays draw only when `mainPitch + offsetSemis` is inside the rolling-score pitch window; no chain-level offset hoist. | `public/js/rolling-score.js` `_companionDyFromOffset`. | Max `DOUBLE STOP RANGE SKIP/FAIL`; dashboard returns `null` out of range. |
| **Slide-vs-leap classifier consistency** — white-line and rolling-chain classify same MIDI pattern identically. Voice steal (gap≈0 ms) MUST reset chain (D56: `chainStart` preserved on `noteOff` + watchdog finalisation, else finished entries lose break info and gap-only fallback misclassifies steals as slides). | `public/js/main.js` `handleMidiEcho`; `public/js/rolling-score.js` `noteOn`/`noteOff`. | Shared `GLISS SYNC FAIL` (D56 enrichment includes seg count, latest seg `t0`/`dur`/`p0`/`p1`, chainNode summary). |
| **Cross-module init wiring** — modules in cross-module reads MUST receive callbacks at `init()`, else dependent assertions/behaviors silently no-op (`assertGlissSync` skips, gliss noteoff drops white line, K/C cards never anchor, etc.). | `public/js/main.js` init block. | One-time `console.warn('[modulename] X not wired — Y disabled')` at startup. |
| **Spectrogram feature gate + stale-frame telemetry** — spectrogram off MUST preserve the MIDI-brush path; spectrogram on MUST draw only `/xk/spectrum/frame` data. Frames with `complex=0` inherit the latest audio-side MIDI noteon complex, not the already-advanced engine state, so old audio tails keep their modality until new notes arrive. | `relay.js` `broadcastSpectrumFrame` / `activeComplexForSpectrum`; `public/js/spectrum-score.js`. | `[SPECTRUM] dropped...`; `[spectrum-score] spectrogram enabled but no actual spectrum frames...`; `[spectrum-score] spectrum frames stale...`; dropped out-of-order logs; static guard in `test/transport-backpressure.test.ts`. |
| **Within-note dynamic shape fidelity** (D70 + D71) — sustained complexes (C2/C3/C4/C8) sample brush half-height from per-voice CC 11 trace at each vertex/particle (NOT 2-endpoint linear interp); else hairpin envelopes (`<>`/`><`) render uniform-thick. `evt.exprSamples` is RAW `voiceExprHistory` (D71 — earlier 1000 ms trim/anchor snapped dim brushes' right zone to mid-dim). Release fade tail-tapers naturally. | `public/js/rolling-score.js` `_buildTraceBuf` / `sampleScaleAtT`. | Audit `[rolling-score] inst N CX hairpinTrace dir=... amp=A samples=N` per finished hairpin; warn `empty exprSamples on CX voice=V — legacy linear fallback`. |
| **Canonical-pose face-letter remap** — red-front/white-top connect pose; relay maps GAN frame with `{R↔L, F↔B, U/D unchanged}` so engine, dashboard, `/xk/face`, and algorithm buffer share user-pose geometry. | `relay.js` `MOVE_REMAP`; `public/js/main.js` `verifyMoveRemap`. | `[CUBE ALIGN FAIL]`; `[CUBE REMAP FAIL] gan='X' expected='Y' got='Z'`. |
| **Ghost snap + active C stay local in beta-cosmo** — ghost orientation uses `state.snapQuat`; C dots/labels stay fixed; beta active C = `C{activeVertex+1}`, not the alpha-table C at that slot. | `src/complexes.ts` fixed beta C1..C8; `public/js/cube-scene.js`. | `[GHOST SNAP FAIL]`, `[GHOST ACTIVE SLOT FAIL]`, `[GHOST TURN LEAK FAIL]`. |

| **Mandala glyph ↔ strike 1:1** (D80) — when the mandala canvas is enabled, every `sphere_strike` WS event deposits exactly one primary glyph (+ symmetry mirrors rendered on draw). "Canvas on but blank" is the silent failure. | `public/js/mandala-canvas.js` `strikesReceived`/`glyphsDeposited` counters; periodic rAF audit. | `[mandala-canvas] D80 GLYPH FAIL: strikesReceived=N glyphsDeposited=0 enabled=true`. |
| **Mandala symmetry constant sync** (D81) — `MANDALA_SYMMETRY_ORDER` (JS) and `--mandala-symmetry` (CSS) must match. Currently 8 (D8 octahedral-natural). | `public/js/mandala-canvas.js` const; `public/css/main.css` var; `test/dashboard-bridge-sync.test.ts` mirror; init-time `getComputedStyle` cross-check. | Vitest `MANDALA_SYMMETRY_ORDER matches between mandala-canvas.js and css/main.css (D81)`; runtime `[mandala-canvas] D81 SYMMETRY SYNC FAIL`. |
| **Mandala feature gate** (D83) — disabled mandala canvas must be invisible AND skip the draw loop; re-enabling resets accumulated state so stale glyphs don't pop back. Mirror of spectrogram gate. | `public/js/mandala-canvas.js` `setEnabled` clears glyphs/counters/dissolve + toggles display; `rafLoop` short-circuits when disabled. | Manual: toggle off → empty + silent D80; toggle on with no strikes → status flips, figure stays empty. |

(Add rows when you find new silent-desync surfaces. Any time we ship a fix that "should have shipped with an assertion," add the row first. Mirror new rows in `docs/dashboard-invariants.md`.)

## Commands

```bash
npx tsx relay.js      # run full relay (BLE → engine → OSC)
npm test              # vitest
npm run test:watch    # vitest watch
npm run dev           # engine standalone (tsx)
npm run build         # tsc → dist/
npm run gen:max       # regenerate max/gen_includes.js from TS sources
npm run check:docs    # doc-drift + size budget (pre-commit gate)
npx tsc --noEmit      # type-check only
```

## Architecture

```
GAN i4 (BLE) → Chrome Web Bluetooth → relay.js (Node)
                                          │
                                    XenaKubeEngine (TS)
                                    ┌─────┼──────────────┐
                                    │     │              │
                          CubeAlgorithmDetector VoiceEngine ExpressionProcessor
                                    │     │              │
                                    ▼     ▼              ▼
                              ModeManager  OSC:57121    OSC:8000  WS
                              (state machine) Max/SWAM    TD     Dashboard
```

*Structural* composition math is TypeScript (`src/`): S4, K_i, C_i, sieve, face-identity, voice / density / intensity / base-duration decisions, and face duration multipliers. *Phrase-level* note generation (pitches inside `foldToRange`, rebow counts, per-complex stochastic contours) currently lives in `max/xk_swam.js`; migration to TS tracked in `docs/todo.md`. Max/MSP + SWAM Cello 3 = synthesis via MIDI. TouchDesigner / browser = visuals only.

**Shared source of truth**: OSC address constants live in `src/osc-schema.ts`; SWAM mapping tables (enums, INTENSITY_MAP, ENV_PROFILE, ART_OFF_VEL, MOTION_NUDGE, FACE_MAP, REGIME_*, RATE_*) live in `src/swam-mapping.ts`. TypeScript imports them directly (typed + vitest-covered); `max/gen_includes.js` is a committed codegen output of the same tables — Max `include()`s it at v8 load. Never hand-edit `max/gen_includes.js`. Never add new `/xk/*` string literals outside `src/osc-schema.ts`.

### `relay.js` — BLE-to-OSC Bridge

Instantiates `XenaKubeEngine` (default `beta-cosmo`; set `XK_COSMO=alpha-cosmo` to boot the historical walk path), serves `public/dashboard.html` on `:3000`, receives cube events via WS from the browser. Run: `npx tsx relay.js`. Deps: `node-osc`, `ws`, `tsx`.

- **Gyro upsampling**: BLE ~10 Hz → 60 Hz via velocity-aware quaternion Kalman filter (smoothing slider 0–1, default 0.5). 60 Hz loop uses `process.hrtime.bigint()` spin timer — `setInterval` drifts to ~40 Hz on Windows. OSC (Max / TD) gets `kf.q` — low-latency, predict-based. The dashboard `gyro_tick` WS message gets a separately-computed SLERP-interpolated quat trailing BLE by `VISUAL_DELAY_MS` (120 ms) from a raw-sample ring buffer — sacrifices latency for zero extrapolation artefacts on static holds. Full engine-state bursts (`state` / `gyro_state`) still fire at BLE rate via `engine.onGyro`.
- **WS backpressure**: dashboard gyro telemetry is low priority. Relay drops stale `gyro_tick` / gyro-only `gyro_state` messages when a client buffer backs up and logs `[WS BACKPRESSURE]`; browser `transport.send()` drops outbound `gyro` mirrors under its own `bufferedAmount` pressure but still attempts live `move` messages. Relay event-loop stalls log `[RELAY LAG WARN/FAIL]`.
- **Control messages** (WS → relay): `set_diagram`, `clear_diagram`, `set_mode` (including `cosmology`; cosmology changes reset phrase/auditor state and panic Max), `set_tracked_k`, `reset`, `get_diagrams`, `set_gyro_smoothing`, `cube_solved` (browser detects FACELETS==solved on the unsolved→solved edge and reports; engine returns alpha-cosmo sessions to beta-cosmo, leaves beta-cosmo sessions untouched, then relay fires `/xk/solve`), `zero_gyro` (mirrors the dashboard's visual zero — captures `engineGyroZeroInv = conj(kf.q)` so the engine's S4 snap cells re-center on the user's rest pose; fires on auto-zero, the Zero Gyro button, and the raw GAN `U'`×4 physical shortcut).
- **Lifecycle**: auto-shutdown 5 s after last client disconnects.

### `src/` — TypeScript Engine

`engine.ts` orchestrates: `corner-topology.ts` (performer-visible 8-corner permutation), `group.ts` (S4 + Cayley + gyro snap shadow), `vertices.ts` (K1-K8 + explicit permutation), `complexes.ts` (C1-C8 + alpha/beta/gamma; S4 live in alpha-cosmo, fixed local C1..C8 in beta-cosmo), `cube-algorithm.ts` (book + matcher), `voice-engine.ts` (sequential/poly dispatch + stamps `face`), `expression.ts` (gyro -> tilt/spin/dev/scramble), `mode-manager.ts` (state machine), `quaternion.ts` (S4 snap + deviation), `sieve.ts` (L(m,n) + metabola), `face-gesture.ts` (12-face signatures), `kinematic.ts` / `scramble.ts` / `turn-rate.ts` (paths / exact corner-distance / regime helpers). `osc-schema.ts` and `swam-mapping.ts` are the **shared source of truth** (codegen'd into `max/gen_includes.js`); `osc-output.ts` emits via the schema constants. `types.ts` + `index.ts` round out the public surface. Per-file detail in `src/AGENTS.md`; public API re-exports in `src/index.ts`.

### `docs/`

The Doc Maintenance table at the top of this file lists every doc with active maintenance rules. Bulk reference assets (`docs/swam/` SWAM v3.10 PDFs + screenshots, `docs/presentation/` score-legend + reference imagery, `docs/archived/` superseded references) are mentioned in the docs that depend on them.

### `public/` — Browser Dashboard

`dashboard.html` at `http://localhost:3000`. Full-viewport HUD: cube canvas, adaptive contrast SVG, transparent overlays, phrase-triggered K/C cards conjured from the active K/C label pair, MIDI brush canvas above an optional actual-audio spectrogram canvas. Modular layout under `public/js/{cube-scene,rolling-score,spectrum-score,performance-recorder,triangle,sieve,state-ui,transport,main}.js`; styles in `public/css/main.css`. Quality picker toggles cube bloom; bottom-right settings panels tune spectrogram and cube/triangle colors. C vertices use the MIDI brush colors/textures; the cube colors panel edits K vertices, label/card text, wires, halos, and triangle lines. Optional `public/interruption/` stays behind `?intrusions=1`. CSS `--roll-*-inset` MUST equal JS `ROLL_*_INSET_PX` (`assertPitchAxis`). Rolling-score owns MIDI brushes/gliss chains; spectrum-score consumes only Max `/xk/spectrum/frame` data and is off by default.

**Full reference**: module exports, cross-module read surfaces, overlay positioning, brush rendering — `docs/dashboard-architecture.md`. Visual runtime invariants — `docs/dashboard-invariants.md`. After editing `dashboard.html`, load `:3000` and verify the rolling score renders, active K/C labels merge into the K/C cards after a phrase trigger, Zero Gyro works at 100 % and 50 % browser zoom.

## OSC Reference

Full address table: see `docs/osc-reference.md`. Routing summary that's load-bearing for any session:

- `/xk/*` → Max (`127.0.0.1:57121`). `/gan/*` → TD (`127.0.0.1:8000`).
- `/xk/midi/{noteon,noteoff,bendstep,expr,panic}` and optional `/xk/spectrum/frame` flow Max → relay on `127.0.0.1:57122`. Dashboard rolling-score consumes WS `midi_echo`; spectrum-score consumes WS `spectrum_frame` only when enabled. `expr` is additive CC 11 telemetry for brush dynamics.
- `/xk/voice` (vertexIdx, complexType, density, intensity, duration, halfTurn): the load-bearing voice trigger. Fires only on real voice transitions (`engine.onVoice`), not per gyro packet. `/xk/face` precedes it for every voice batch; Max multiplies incoming K duration by `FACE_MAP.durationMult` and `-` resets stale face state. `halfTurn=1` overrides the normal phrase with punctuation.
- `/xk/phrase/plan` precedes every `/xk/voice` as the TS-side shadow plan (`src/phrase-plan.ts`); Max stamps the `planId` onto subsequent `/xk/midi/*` echoes so the auditor (`src/phrase-audit.ts`) can compare planned vs rendered structure. Migration seam off Max-side phrase logic.
- `/xk/panic` (no args): relay-disconnect signal. Both bridges flush notes + CCs.

**Source of truth**: address strings live in `src/osc-schema.ts`. Never add new `/xk/*` literals outside that file — the schema is codegen'd into `max/gen_includes.js` (`npm run gen:max`).

## Performance Model

Each cube turn → algorithm detector → mode-manager (if matched; effect handlers are stubs) → half-turn detector → cosmology advance → `/xk/face` → voice-engine → `/xk/phrase/plan` → expression → turn-rate regime → state broadcast (OSC + WS). Sequential = 1 voice; polyphonic = 8. `beta-cosmo` uses physical corner topology with a direction-aware read-head and fixed local C slots (`C{slot+1}`); `alpha-cosmo` restores historical S4 K/C walks; `mandala-cosmo` is beta-cosmo dispatch plus parallel sphere-engine strikes (see Sphere Engine below). Cosmology changes reset structural state; solve auto-collapses only alpha → beta (beta and mandala stay put). Freeze halts state advance. Scramble is exact quarter-turn distance over 40,320 visible corner permutations. Algorithms layer (shorter prefix fires before the longer match). Phrase planner (`src/phrase-plan.ts`) + echo auditor (`src/phrase-audit.ts`) compare every plan against `/xk/midi/*` echoes via `planId`.

**Full reference**: per-step core loop, voice / engine modes, cube-algorithm book + orientation expansion + half-turn convention + overlap rules, gyro-expression mapping, visible corner topology, S4 shadow / sieve / tetra-orbit math - `docs/performance-model.md`. Primary source - `docs/xenakis_nomos_alpha_primary_source.md`. Design rationale - `docs/research_notes.md`.

## Synthesis Bridge — Max/MSP + SWAM Cello

Synthesis layer: SWAM Cello 3 driven via MIDI from a Max/MSP bridge on port 57121. Single-instance model — `POOL_SIZE = MAX_ACTIVE = 1` in `xk_swam.js`; voice steal hard-kills the previous gesture (CC 11 = 0 + CC 120 + CC 123 + tracked noteOffs).

The **Bridge Invariants** table above is the load-bearing summary — those are the silent-failure surfaces every change must preserve. Everything else (patch topology, the `max/` file roles, the per-complex Mapping Cheatsheet, Max MCP integration rules) lives in **`docs/synthesis-bridge.md`** — read it when working on `max/xk_swam.js`, the `.maxpat`, the SWAM preset, or any per-complex routing.

**Subagent rule**: route all live-patch edits through the `max-patch` subagent (`.claude/agents/max-patch.md`); it has the MCP tools scoped. Confirm before any `mcp__maxmsp__*` mutation tool fires, even under `--dangerously-skip-permissions`. Patch edits desync from `xk_swam.js` / `gen_includes.js` easily.

## Sphere Engine — Gamelan (mandala-cosmo)

Second synthesis output fired only in `mandala-cosmo`, parallel to (never replacing) SWAM. `max/xk_sphere.js` v8 sibling to `xk_swam.js`; loads 314 Latent Sonorities / RBI Berlin Javanese gamelan samples into `polybuffer~`; receives `/xk/sphere/strike` from relay, plays via per-instrument `groove~` voice slots, echoes `/xk/sphere/echo` for the D75 audit. Selection logic in `src/mandala-cosmo.ts` (pure functions): gong on colotomic ring boundary (`step % COLOTOMIC_RING_LEN === 1`), kempul on half-turn (face-axis → pelog degree), saron on every K transition (vertex → pelog degree), slenthem ground on C6/C7/C8. Per-cosmology mix balance: alpha/beta = sphere silent, mandala = sphere full. Tunings are non-12-TET (pelog ~123–951¢, slendro ~232/464¢ steps) — body/sphere coexist in different intonational worlds by design.

Source-of-truth files: `src/gamelan-tuning.ts` (Scala cents + hash), `src/gamelan-manifest.ts` (codegen output of `scripts/build-gamelan-manifest.mjs` over `media/gamelan/*.wav`), `src/sphere-mapping.ts` (per-instrument pickers). All codegen'd into `max/gen_sphere_includes.js` via `npm run gen:max`. Dashboard accumulating mandala layer: `public/js/mandala-canvas.js` (togglable alongside MIDI brushes + spectrogram; D8 radial symmetry; per-instrument glyph language; dissolves on solve). Full reference: **`docs/sphere-engine.md`**.
