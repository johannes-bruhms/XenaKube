# CLAUDE.md

> **v2 fork** of XenaKube/ — independent working tree for modular-dashboard + WebGL visual work. Synthesis pipeline (relay.js → engine → OSC → Max → SWAM) is identical to v1; bridge invariants below apply unchanged. v2-specific phased work in `docs/todo.md`. v2 supersedes v1 when its dashboard work ships stably.

## XenaKube

Real-time instrument: GAN i4 smart Rubik's cube → SWAM Cello physical-modeling synthesis + browser visuals. Cube turns are musical events; Rubik's **cube algorithms** (named move sequences like sexy-move, sune, t-perm) trigger musical gestures. Built on S4 group math (24 cube rotation symmetries) inspired by Xenakis' *Nomos Alpha*.

**Architectural direction — Temporal Identity**: each of 12 face-moves (L/L'/R/R'/F/F'/B/B'/U/U'/D/D') owns a distinct gesture *type* fixed to the cube's color-fixed face identity; K_i / C_i permutation modulates *content* (pitch, timbre, intensity) inside that shape. Performer's forward model: you know the *kind* of sound a turn will produce, you don't know the *detail*. Pending phases (A2 solve-anchor, Phase B phrase library, Phase E tier 3 phrase migration): see `docs/todo.md`.

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
| `docs/swam/swam_cello_reference.md` | Authoritative SWAM v3.8+ parameter / CC / KS reference. |
| `docs/synthesis-bridge.md` | Max/MSP + SWAM bridge deep dive: patch topology, `max/` file roles, mapping cheatsheet, Max MCP integration. |
| `docs/bridge-invariants.md` | Full enforcement detail (Scope / Enforcement / Telemetry) per Bridge Invariant. CLAUDE.md keeps the summary. |
| `docs/dashboard-invariants.md` | Full enforcement detail per Dashboard Visual Invariant. CLAUDE.md keeps the summary. |
| `docs/osc-reference.md` | Full OSC address table (`/xk/*`, `/gan/*`, `/xk/midi/*`). CLAUDE.md keeps only the routing summary + most-touched addresses. |
| `README.md` | User-facing setup and top-level description. |

**Hard rule**: implementation status, dated decisions, and D-numbered diagnoses live in `docs/revision_roadmap.md` and `docs/todo.md`, not here. The only D-codes that appear in CLAUDE.md are those naming an active invariant in the table below.

**v2 doc-state note**: Phase 2 (dashboard modularization) is complete. The Visual Invariants table below describes properties the *current* code must hold; the "Where enforced" column names the post-extraction module paths (`public/js/{cube-scene,rolling-score,triangle,sieve,state-ui,main}.js` + `public/css/main.css`), and `docs/dashboard-invariants.md` carries the full Scope / Enforcement / Telemetry detail per row. When you change a module that intersects an invariant, re-audit every row — silent-failure surfaces don't announce themselves on refactor.

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

**Hard rule for modulators**: they may *reshape* a complex's gesture (duration, velocity, density, register, contour) but MUST NOT *eliminate* the structure that defines the complex's identity. Face `isSingle` collapsing C5/C6/C7 to zero gliss steps was the exact mistake D42 fixed — when adding a modulator that touches voice dispatch, re-audit every invariant below.

Full enforcement detail (Scope / Enforcement / Telemetry per row): **`docs/bridge-invariants.md`**. Read it before changing any code that touches a row below. The summary here is for recognition: spot the invariant, find the matching `docs/bridge-invariants.md` row, read the full enforcement before editing.

| Invariant (claim) | Where enforced | Failure log |
|-------------------|----------------|-------------|
| **Gliss event count** (D42 + D46) — every C5/C6/C7 voice emits ≥1 `glissStep`; slides + leaps ≥ 1 (leaps are first-class string-crossings). | `max/xk_swam.js` `glissStep`, `phraseC5/6/7`, `sameString`, `CELLO_STRINGS`. | `GLISS FAIL ... slides=0 leaps=0 ...` (per-phrase log in `scheduleRelease`). |
| **Immediate first gliss** (D43 + D53) — first `glissStep` fires at `FIRST_GLISS_MS=150` (C5/C6) / `FIRST_GLISS_MS_C7=30` (C7) ms from phrase start, independent of duration. | `max/xk_swam.js` `FIRST_GLISS_MS`, `FIRST_GLISS_MS_C7`, `phraseC5/6/7`. | Covered by D42 `GLISS FAIL`. |
| **Min gliss spacing** (D45) — consecutive `glissStep` events ≥ `MIN_GLISS_SPACING_MS=200` ms (SWAM portamento needs ~150–200 ms to engage). | `max/xk_swam.js` `MIN_GLISS_SPACING_MS`, `glissSchedule`. | Covered by D42 `GLISS FAIL`. |
| **Leap-alternation with per-complex tolerance** (D48 + D58) — leaps capped via `MAX_LEAPS_BY_COMPLEX = {5:1, 6:0, 7:0}`; over-cap cross-string outcomes nudged to same-string. Mostly inert post-D59 (pitchbend slides handle most cross-string within ±48 semi). | `max/xk_swam.js` `MAX_LEAPS_BY_COMPLEX`, `maxLeapsFor`, `glissStep`, `nudgeToSameString`, `phraseC5` opening seed. | `GLISS RUN FAIL ... consecLeapMax=M (max for CX = M_max) ...`. |
| **Selector re-assertion** (D44 + D69) — CC 78 (Harmonics) / CC 79 (Tremolo) / CC 81 (Bow Polyphony) write through every call, no diff guard; CC 81 also re-asserted per `/xk/voice`. Diff-guarded selectors silently freeze SWAM in the wrong mode after a preset-load race. | `max/xk_swam.js` `setHarmonics` / `setTremolo` / `setBowPolyphony` (no diff guard) + `handleVoice` per-voice CC 81 re-assert. | `inst N harmonics=H cc78=V` / `inst N tremolo=T cc79=V` / `inst N bowPoly=B cc81=V` per write (inspect Max console). |
| **Phrase dynamic arc** (D47, D57) — sustained complexes (C2/3/4/5/6/7/8) emit single linear CC 11 ramp across phrase: cresc/dim per face envelope, hairpin-up/down via `schedulePhraseHairpin`. C1 pizz uses static expr (per-pluck velocity is the dynamic). Cresc/dim chain across consecutive same-direction voices within `ARC_CHAIN_GAP_MS=1000` ms. | `max/xk_swam.js` `ARC_*` constants, `phraseArcDirection`, `schedulePhraseArc`, `schedulePhraseHairpin`, `handleVoice` dispatch. | `ARC FAIL inst N CX face=F dir=D landed=L want=W off=O dur=D` (natural-end assertion). Hits emit `inst N CX arc=cresc 38->127 dur=2.50`. |
| **Bow-position smoothness** (D54) — CC 16 (Bow Position) EMA-smoothed (`TILT_EMA_ALPHA=0.05`); raw gyro static-pose noise would produce 30 Hz bow buzz. | `max/xk_swam.js` `state.tiltEMA`, `TILT_EMA_ALPHA`, `handleExprTilt`. | `BOW POS FLAP inst N CX reversals=R writes=W (rate=R/s, fail>BOW_FLAP_RATE_FAIL=10)`. |
| **Portamento state at slide** (D55, diagnostic) — every `glissNote` checked at entry: `ccCache[CC.PORTAMENTO_TIME] = cmx.portamento.time`, `ccCache[CC.PORTAMENTO_ON] = 127`, `ccCache[CC.BOW_POLYPHONY] = BOW_POLY_CC_VAL[cmx.bowPoly]`. Detects bridge cache divergence (not wire drift). | `max/xk_swam.js` `glissNote` entry-time cache check. | `PORT TIME FAIL inst N CX pitch=P wantTime=W gotTime=G gotOn=O polyOk=B`. |
| **Cross-string slide via pitchbend** (D59) — gliss step where `sameString(src, dst)` is FALSE AND `|Δ| ≤ PITCHBEND_RANGE_SEMI` MUST emit `bendStep` (pitchbend ramp on held source, atomic `bend=0 + noteOff(source) + noteOn(target)` at end). Over-range falls through to `leapStep` with `BEND CLIP` log. | `max/xk_swam.js` `bendStep`, `completeBend`, `glissStep` three-way dispatch, `cancelPhrase` reset. | Per-phrase `slides=S bends=B leaps=L`. `GLISS FAIL` if `S+B+L<1`. Diagnostic: `BEND CLIP`, `BEND FAIL`, `bend race-fix`. |
| **Pitchbend range bridge↔preset alignment** (D64) — `PITCHBEND_RANGE_SEMI` MUST EXACTLY MATCH SWAM preset's Pitchbend Range. Mismatch silently produces audible-bend ≠ visual-bend (severe at default ±2 vs bridge ±48: 24× weaker). Breaks any time the preset changes without a paired bridge re-sync. | `max/xk_swam.js` `PITCHBEND_RANGE_SEMI` (paired tunable with the preset's UI value). | `bang()` reload log: `=== BRIDGE PITCHBEND_RANGE_SEMI = ±N — verify this matches SWAM preset's Pitchbend Range ===` (visible in `[print xk_swam]` after every v8 reload). |

(Add rows here when you formalize harmonics / tremolo / KS invariants. Mirror the new row's full enforcement detail in `docs/bridge-invariants.md`.)

## Dashboard Visual Invariants

The dashboard has its own silent-failure surfaces analogous to the bridge's. Two pieces of code computing "the same thing" independently — pitch-axis math in `midiToY` vs cell layout in flexbox; gliss trajectory in white-line vs rolling-chain — drift apart on every refactor unless the contract is written down and tested at runtime. Every row was added after a regression that took multiple iterations to fix.

Full enforcement detail: **`docs/dashboard-invariants.md`**. Read it before changing any module that touches a row below.

| Invariant (claim) | Where enforced | Failure log |
|-------------------|----------------|-------------|
| **Sieve cell distribution** — all 49 sieve cells (C2..C6) occupy equal vertical share. Empty cells must NOT collapse to content height. | `public/css/main.css` `.sieve-strip` flex container, `.sieve-cell` `flex: 1 1 0`; `public/js/sieve.js` cell construction. | `SIEVE LAYOUT FAIL: cells uneven, expected cellH=X got cellH=Y` (`assertSieveLayout`). |
| **midiToY ↔ sieve-cell-Y agreement** — `midiToY(P)` ≡ sieve-cell centre within `PITCH_AXIS_DRIFT_THRESHOLD_PX=2` CSS px. CSS `--roll-*-inset` and JS `ROLL_*_INSET_PX` must match. 49-bin centres (not 48). | `public/js/rolling-score.js` `midiToY`, `public/css/main.css` `--roll-top-inset/--roll-bottom-inset`, `public/js/sieve.js` flex distribution. | `PITCH AXIS FAIL P=X expected=Y got=Z drift=D` (`assertPitchAxis` per resize). |
| **Gliss-line trajectory equals drawn-note trajectory** (D65 + D66) — white triangle leg endpoint Y == rolling-chain pitch curve Y at same t (≤5 px drift). Byte-identical easing, per-complex portamento times, retarget rule, segment-dur predictor (`max(80, min(GLISS_SLIDE_MAX_DUR_MS=195, |Δ|×per-semi))`), bend-segment p0-inheritance from audible pitch (D65). | `public/js/triangle.js` (`easeSlide`, `predictGlissDuration`, `_displayedPitch`); `public/js/rolling-score.js` (`_glissEase`, `_buildGlissSegments`, `_glissPitchAt`); shared constants in `public/js/constants.js`. | `GLISS SYNC FAIL voice=V ... drift=Dpx linePitch=L chainPitch=C ...` (`assertGlissSync` ~1 Hz when active). |
| **Slide-vs-leap classifier consistency** — white-line and rolling-chain classify same MIDI pattern identically. Voice steal (gap≈0 ms) MUST reset chain (D56: `chainStart` preserved on `noteOff` + watchdog finalisation, else finished entries lose break info and gap-only fallback misclassifies steals as slides). | `public/js/main.js` `handleMidiEcho`; `public/js/rolling-score.js` `noteOn`/`noteOff`/`_watchdogTick`/`_findActiveGlissChain`; `public/js/triangle.js` `_findGlissLine`. | Shared `GLISS SYNC FAIL` (D56 enrichment includes seg count, latest seg `t0`/`dur`/`p0`/`p1`, chainNode summary). |
| **Cross-module init wiring** — modules in cross-module reads MUST receive callbacks at `init()`, else dependent assertions silently no-op (`assertGlissSync` skips, gliss noteoff drops white line, etc.). | `public/js/main.js` init block (single audit surface); `init()` signatures in `rolling-score.js` / `triangle.js`. | One-time `console.warn('[modulename] X not wired — Y disabled')` at startup. |
| **Within-note dynamic shape fidelity** (D70 + D71) — for sustained complexes (C2/C3/C4/C8), brush half-height at every polygon vertex / particle samples the per-voice CC 11 trace at that vertex's t (NOT a 2-endpoint linear interp from `exprAtOn` / live `voiceExpr`). Without trace sampling, hairpin envelopes (`<>` D', `><` B') render uniform-thick because `start ≈ end` — the trough/peak gets overdrawn every frame as the live value recovers. `evt.exprSamples` is the RAW slice of `voiceExprHistory` over `[onsetMs, offsetMs]` (D71 — earlier D70 trim/anchor at `exprAtLookback(1000ms)` caused dim brushes' right zones to snap to mid-dim thickness at noteoff because the lookback walked deep INTO the trajectory body, not just past the fade). The bridge's release fade renders as a natural tail-tapering at the right edge of finished phrases — same shape the in-flight brush was already showing, no snap. | `public/js/rolling-score.js` `_buildTraceBuf`, `sampleScaleAtT`, `fillVaryingBand`, `drawNote` (builds `bctx.buf`); `noteOff` / `_watchdogTick` freeze `evt.exprSamples = sliceExprHistory(voice, onsetMs, offT)` (raw, no trim). | Audit: `[rolling-score] inst N CX hairpinTrace dir=down/up on=O ext=V end=E amp=A samples=N dur=Dms` per finished hairpin; warn: `[rolling-score] empty exprSamples on CX voice=V — brush will use legacy linear fallback` when telemetry is missing on a sustained complex. |

(Add rows when you find new silent-desync surfaces. Any time we ship a fix that "should have shipped with an assertion," add the row first. Mirror new rows in `docs/dashboard-invariants.md`.)

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
                          CubeAlgorithmDetector VoiceEngine ExpressionProcessor
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
| `engine.ts` | Orchestrator: turn / gyro → cube-algorithm detection → cubes → voice output → state |
| `group.ts` | S4 group: 24 elements as vertex permutations, Cayley table, generators, tetra orbits |
| `vertices.ts` | K1–K8 vertices with V1/V2 values (D×G×U), permutation |
| `complexes.ts` | C1–C8 complex types, α/β/γ cyclic mappings (rotate every 3 subs), C_i state |
| `cube-algorithm.ts` | Cube-algorithm book (7 canonical × 24 rotations = 168 variants) + rolling buffer matcher |
| `scramble.ts` | BFS distance from identity in S4 Cayley graph, normalized 0–1 |
| `voice-engine.ts` | Sequential (1 voice) vs polyphonic (8 voices) output decision; stamps `face` on each `VoiceOutput` |
| `face-gesture.ts` | Temporal Identity 12-face signature table + modulation-rule helpers (pitch class / register / parity / intensity) |
| `expression.ts` | Gyro quaternion → continuous control values (tilt, spin, deviation, scramble) |
| `mode-manager.ts` | Performance state machine: voice mode, palette, variant, freeze; cube-algorithm effects |
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
| `todo.md` | Phased implementation roadmap (v2 phases supersede v1 for dashboard work) |
| `swam/swam_cello_reference.md` | Authoritative SWAM v3.8+ parameter / CC / KS reference |
| `swam/` (PDFs + screenshots) | SWAM v3.10 manual extracts, MPE keyswitch routing notes, plugin-GUI screenshots |
| `revision_roadmap.md` | SWAM-bridge refactor diagnoses (D-codes) and phase progress |
| `synthesis-bridge.md` | Max/MSP + SWAM bridge deep dive: patch topology, `max/` file roles, mapping cheatsheet, Max MCP integration |
| `bridge-invariants.md` | Full enforcement detail per Bridge Invariant (CLAUDE.md keeps summary) |
| `dashboard-invariants.md` | Full enforcement detail per Dashboard Visual Invariant (CLAUDE.md keeps summary) |
| `osc-reference.md` | Full OSC address table (`/xk/*`, `/gan/*`, `/xk/midi/*`) |
| `presentation/` | Score-legend PDF + dashboard reference imagery (`webgui/current-gui.png` etc.) |
| `archived/` | Superseded references (older PDFs, brushes.png) |

### `public/` — Browser Dashboard

`dashboard.html` at `http://localhost:3000`. Full-viewport HUD: `#cube-canvas` fills the window; all UI floats as transparent overlays. Three.js 3D cube with per-vertex K#/D/G/U labels, ghost cube showing S4 snap target (opacity = deviation). WS client to relay. Pixel/zoom values live in CSS (L48–60).

**Module layout (Phase 2 complete):**
- `dashboard.html` — HTML structure only. Single `<script type="module" src="./js/main.js">` mounts the entry. The pre-Phase-2 monolithic version is preserved at `dashboard.v1-monolith.html` (also served by the relay; reachable at `:3000/dashboard.v1-monolith.html`) for direct A/B comparison.
- `css/main.css` (Phase 2.2) — all dashboard styles, sectioned by overlay. CSS variables `--roll-top-inset` / `--roll-bottom-inset` MUST equal JS `ROLL_TOP_INSET_PX` / `ROLL_BOTTOM_INSET_PX` (rolling-score's `assertPitchAxis` fires loudly on drift).
- `js/constants.js` (Phase 2.1) — shared immutable constants (`ROLL_*` insets / pitch range / brush scale, `GLISS_GAP_MS` / `GLISS_COMPLEXES`, `PORTAMENTO_MS_PER_SEMITONE` / `GLISS_PORTAMENTO_MS_PER_SEMITONE` mirrors of the bridge, `COMPLEX_COLOR` palette, `PIZZ_FADE_MIN/MAX_MS`, `PENDING_MAX_AGE_MS`).
- `js/transport.js` (Phase 2.3) — WebSocket transport. `connect()` / `send(obj)` / `on(name, fn)`. Auto-reconnect at 2 s. Typed events: `open`, `close`, `state`, `gyroState`, `gyroTick`, `diagrams`, `algorithm`, `algorithmBook`, `solve`, `midiEcho`.
- `js/sieve.js` (Phase 2.4) — 49-cell pitch strip + per-cell emanation glow + active-set highlighting. Owns `assertSieveLayout` (init-time invariant). Exports `noteOn` / `noteOff` / `panic` / `setActive` / `getCellRect(pitch)` / `SIEVE_RANGE` / `BLACK_KEYS`.
- `js/cube-scene.js` (Phase 2.5) — Three.js scene: live K-cube, ghost C-cube, K↔C 3D line, gizmo, all per-frame animations (gyro live rotation, ghost SLERP, active-step LERP, vertex/ghost-vertex perm-change LERPs), camera auto-fit, gyro zero. Exports `init({ onAutoZero })` / `setCubeQuat([x,y,z,w])` / `update(state)` / `applyConnectView()` / `revertConnectView()` / `zeroGyro()` / `setGhostScale(s)` / `getActiveKWorldPos(out)` / `getCWorldPos(c, out)` / `getCamera()`. Owns the rotate-target buttons (cam/live/ghost) + ghost-size slider's geometry.
- `js/rolling-score.js` (Phase 2.6) — full-viewport background piano-roll canvas + per-complex procedural brushes + gliss-chain Path2D stroker + slide-vs-leap chainStart classifier (rolling-side) + Phase 1 invariants (`assertPitchAxis` per resize, `assertGlissSync` ~1 Hz when a gliss line is active) + stuck-note watchdog. Exports `init({ onForceFinalise, getActiveGlissLineDisplay })` / `noteOn` / `noteOff` / `panic` / `setScrollSpeed` / `hasActiveNote(voice, complex)`.
- `js/triangle.js` (Phase 2.7) — white K↔sieve / C↔sieve leg overlay. Cubic-smoothstep slide easing matches rolling-score exactly (Visual Invariant #3). Exports `init({ getCamera, getActiveKWorldPos, getCWorldPos, getSieveCellRect, hasActiveGliss })` / `noteOn` / `noteOff` / `panic` / `getActiveGlissLineDisplay(now)`.
- `js/state-ui.js` (Phase 2.8) — overlay panels: state rows, mode badges, K/C cards, perm slots, algorithm buffer + toast, scramble bar, expression panel, recent-moves FIFO. Owns `FACE_SIG` (HUD mirror of `src/face-gesture.ts`) and `COMPLEX_SHORT`. Exports `init({ onPathToggle })` / `update(state, move)` / `handleAlgorithmEvent` / `setSolvedBadge(solved, pulse)` / `updateExpression(quat, dev)` / `setAlgorithmBook`.
- `js/main.js` (Phase 2.9) — entry point. Imports every module, calls each one's `init()`, subscribes transport events to module update entry points, wires sliders + buttons + Web Bluetooth GAN cube connection, and dispatches `midi_echo` to sieve + triangle + rolling-score in one place.

Cross-module read surfaces (intentional, narrow — see `docs/todo.md` Phase 2 ownership table):
- `triangle` reads cube-scene `getActiveKWorldPos` / `getCWorldPos` / `getCamera`, sieve `getCellRect`, rolling-score `hasActiveNote`.
- `rolling-score` reads triangle `getActiveGlissLineDisplay` (wired via init() callback to avoid circular import) so `assertGlissSync` can compare line ↔ chain trajectories.

Overlays:
- **Top-left** (`.ovl-tl`): title + MAC/connect (button turns green via `.connected`), mode badges, active K/C cards.
- **Bottom-left** (`.ovl-bl`, anchored `bottom: 110px`): State panel (face, active voice, S4 element, path, step, snap, complex phase, orbit, scramble, permutation), then Expression panel (Zero Gyro + smoothing slider + tilt/spin/deviation/scramble). `zoom: 0.5` applies per-child to keep the bottom anchor zoom-invariant so the stack never overlaps the sieve strip.
- **Top-center** (`.ovl-tc`): cube-algorithm buffer + algorithm notification. Move strip is a dashboard-side 8-move FIFO (`recentMoves`, `RECENT_MOVES_MAX = 8`), decoupled from the engine's `state.algorithmBuffer` (which clears on its own 2 s timeout / algorithm-fire); each turn pushes one move and shifts the oldest, so the strip never empty-flashes. Match-highlighting still consumes `state.algorithmPartials` and applies to the trailing N entries.
- **Top-right**: cam / live / ghost rotate toggles + rotation gizmo.
- **Bottom**: full-width sieve piano-roll (C2–C6).
- **Background** (`<canvas id="rolling-score">`, `position: fixed; inset: 0; z-index: -1`): rolling piano-roll behind cube-canvas (`alpha: true`). Right edge = `now`, scrolling left at `ROLL_PX_PER_SEC` CSS-px/sec (default 360, retunable live via the `score` slider in the bottom-right cluster — value persists in `localStorage`). Pitch axis C2..C6 maps into the *inner* rectangle defined by `ROLL_TOP_INSET_PX = 70` / `ROLL_BOTTOM_INSET_PX = 80` so notes never paint under the title / algorithm row / cam strip or the bottom sieve. Each note rendered via a per-complex procedural brush (`COMPLEX_BRUSH` dispatch; reference `docs/archived/brushes.png`): C1 pizz=spatter, C2 arco=rough wash, C3 arco=watercolor, C4 harm=airbrush halo, C8 sul-pont trem=chalk grit. Gliss complexes C5/C6/C7 bypass per-note brushes — each chain (maximal run of same-voice + same-complex notes that pass the unified live-entry classifier; see Visual Invariants table row 4) is drawn as a single stroked Path2D (`drawGlissChain`) with `lineJoin = 'round'`, so the rect-body / slant-transition / rect-body polyline reads as one continuous brush stroke. The legacy `GLISS_GAP_MS = 25` ms (constants.js) is now a UDP-reorder fallback only — chain breaks fire on the per-note `chainStart` flag. Brush vertical dimensions go through `bu(factor) = rollRowH * factor * ROLL_BRUSH_SCALE` where `rollRowH` is the device-px height of one semitone in the current viewport (recomputed every frame). This keeps brushes proportional across screen sizes — a 1.45-row chalk band stays 1.45 rows on a 1080p monitor and on a 13" MacBook. `ROLL_BRUSH_SCALE` (default 1.4) is the single global tuning knob. Colours per complex (C1 amber, C2/C3 cobalt, C4 cyan, C5/C6/C7 magenta, C8 crimson); velocity → opacity. Stochastic brush textures use a mulberry32 stream seeded from `(voice, pitch, onsetMs)` so each note's speckle pattern is identical every frame. Per-key FIFO queue for in-flight notes (`activeMidiNotes: Map<key, Array<entry>>`) — bridge legitimately emits overlapping noteons on the same pitch (C8 trem rebows, double-stop companion, humanPitch collisions) and the queue preserves each iteration as a distinct rendered note instead of overwriting. Watchdog finalises any active note stuck >45 s. Data source: `midi_echo` WS messages mirrored from Max; Phase E tier 3 will switch to TS-generated note lists once the phrase migration lands.

Only the active K/C cards render; the 8-vertex/complex grids and legacy controls are populated but hidden via `.ovl-legacy`.

After editing `dashboard.html`, load `:3000` and verify the rolling score renders, K/C cards stay visible, and Zero Gyro works at 100% and 50% browser zoom.

## OSC Reference

Full address table: see `docs/osc-reference.md`. Routing summary that's load-bearing for any session:

- `/xk/*` → Max (`127.0.0.1:57121`). `/gan/*` → TD (`127.0.0.1:8000`).
- `/xk/midi/{noteon,noteoff,bendstep,expr,panic}` flows the *other direction* — Max → relay on `127.0.0.1:57122`. The dashboard rolling-score consumes these via WS `midi_echo`. `expr` is pure additive telemetry (per-voice CC 11 value) so the dashboard can size brushes by audible dynamics rather than per-note velocity.
- `/xk/voice` (vertexIdx, complexType, density, intensity, duration): the load-bearing voice trigger. Fires only on real voice transitions (`engine.onVoice`), not per gyro packet. `/xk/face` precedes it for face-moves.
- `/xk/panic` (no args): relay-disconnect signal. Both bridges flush notes + CCs.

**Source of truth**: address strings live in `src/osc-schema.ts`. Never add new `/xk/*` literals outside that file — the schema is codegen'd into `max/gen_includes.js` (`npm run gen:max`).

## Performance Model

### Core Loop

Each physical cube turn:

1. Move → **cube-algorithm detector** (168 rotation variants of 7 canonical algorithms).
2. If algorithm matched → **mode manager** applies effect.
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
- **Freeze**: turns still detected but state doesn't advance.

The vertices have a single `(D, G, U)` table spanning the full ppp..fff dynamic palette (one unique level per vertex). Xenakis's V1/V2 path-toggle was retired — `D` and `U` values are inherited from V1's per-vertex distribution; only `G` expanded from V1's 4-level alphabet to the full 8-step western-notation set so the cube always exposes every dynamic level. K_i permutation shuffles which physical position holds which intensity per cube state.

### Cube Algorithms *(current = mode-toggles; pivoting to phrase-library — see `docs/todo.md`)*

Rubik's cube algorithms detected from the move stream currently trigger **mode changes** (toggle polyphony, flip path, adjust palette). The algorithm book covers the 6 CFOP fundamentals plus Niklas (archetypal 3-cycle commutator). Algorithms are **orientation-independent** — each is expanded into all 24 whole-cube-rotation variants at load time, so the same finger pattern fires on any face pair. Algorithms **layer**: a shorter algorithm that's a prefix of a longer one fires first; the long one fires on completion. Turns always produce sound; algorithm matches are bonus triggers on top.

| Name | Canonical Algorithm | Moves | Role | Effect |
|------|---------------------|-------|------|--------|
| sexy-move | R U R' U' | 4 | CFOP F2L trigger | (effect stub — no mode change) |
| oll-cross | F R U R' U' F' | 6 | 2-look OLL: edges | (effect stub) |
| sune | R U R' U R U2 R' | 8 | 2-look OLL: corners | (effect stub) |
| anti-sune | R U2 R' U' R U' R' | 8 | 2-look OLL: inverse corners | (effect stub) |
| niklas | R U' L' U R' U' L | 7 | Commutator (corner 3-cycle) | (effect stub — was CTRL harmonic ping; CTRL becomes algorithm-only here when re-bound) |
| u-perm | R U' R U R U R U' R' U' R2 | 12 | 2-look PLL: 3-edge cycle | (effect stub) |
| t-perm | R U R' U' R' F R2 U' R' U' R U R' F' | 15 | 2-look PLL: corners + edges | (effect stub) |

Detection still fires and the dashboard logs the match; effect rebinding is tracked in `docs/todo.md` Phase B (algorithms-as-phrase-vocabulary).

**Half-turn convention (CCW)**: GAN hardware only reports 90° clicks, so `U2`/`R2` are stored as two CCW quarter-turns. Performers must flick half-turns CCW (speedcube default); CW flicks won't trigger the algorithm. Required technique — the cost of a lean algorithm book.

**Overlap suppression**: after an algorithm fires, algorithms whose buffer **partially overlaps** are suppressed. **Full containment** (e.g. a T-perm sequence starting with a sexy-move prefix) remains allowed — layered detection preserved. Buffer timeout 2 s, max 20 moves.

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
