# todo.md — XenaKube v2

Forked from XenaKube/ on 2026-04-26 to test a modular dashboard restructuring + WebGL visual upgrade path. Synthesis pipeline (relay → engine → OSC → Max → SWAM) is unchanged from v1. Only the dashboard layer is being restructured.

The phased plan below supersedes v1's `docs/todo.md` for everything dashboard-related. Bridge / engine / SWAM phases from v1 are still tracked in `docs/revision_roadmap.md` and apply unchanged.

## Phase 0 — Initialization (DONE)

- [x] Fork v1 source tree into `Xenakube-v2/`
- [x] Add Bucket 1 to `CLAUDE.md`: Dashboard Visual Invariants table + Recurring-Bug Discipline extension to visual layer
- [x] Add `docs/todo.md` (this file) with phased plan

## Phase 1 — Visual Invariant Assertions (do BEFORE Phase 2 split)

Add the dev-time runtime assertions for each row of the Visual Invariants table in CLAUDE.md. Each assertion is its own commit. Together they form the safety net the Phase 2 modularization can lean on — if a module move breaks an invariant, the assertion fires and we know which contract was violated before any visual regression ships.

- [x] **Sieve cell distribution** assertion (init-time): walk 5 octave-C cells, compute (C2 − C6 vertical centre) / 48, assert ≈ cellH within 1 px. Fires `console.error('SIEVE LAYOUT FAIL …')` on drift.
- [x] **midiToY ↔ sieve-cell-Y agreement** assertion (per resize): for pitches {36, 48, 60, 72, 84}, assert `midiToY(P) / dpr` equals the corresponding `sieveCells[P − 36].getBoundingClientRect()` centre to ≤1 px. `console.error('PITCH AXIS FAIL …')` on drift.
- [x] **Gliss-line trajectory ↔ drawn-note trajectory** assertion (sampled ~1 Hz when a gliss is active): pick the active gliss line's current displayed Y, compute the rolling-chain's polyline Y at the same X, assert ≤1 px drift. `console.error('GLISS SYNC FAIL …')` on miss.
- [x] **Slide-vs-leap classifier consistency** — realized as full unification (chainStart live-entry check at handleMidiEcho noteon time, consumed by both `_findGlissLine` (white-line side, already implemented) and `buildGlissChains` / `_findActiveGlissChain` (rolling-chain side). The originally-planned TODO comments became "unified classifier" comments instead — the bug they were warning about (steal at gap ≈ 0 ms misclassified as slide) had already shipped, so the comments alone wouldn't have caught it. `GLISS_GAP_MS = 25 ms` retained as a UDP-reorder fallback only.

**Acceptance**: with assertions live, run a full performance session (5 minutes of varied playing). Verify no assertion fires during normal play. Then deliberately break each invariant in turn (e.g., change cell flex from `1 1 0` to `1 0 0`) and verify the corresponding assertion fires loudly. Only then proceed to Phase 2.

## Phase 2 — Dashboard Modularization

Split `public/dashboard.html` into a small set of native ES modules (no bundler, no TypeScript on the browser side, no build step — modern browsers import `.js` files directly). The HTML keeps `<link>`/`<script type="module">` tags pointing at the modules. The synthesis pipeline is untouched.

### Module boundary contract (target)

```
public/
  dashboard.html              ← HTML structure + module entry
  css/
    main.css                  ← all styles, sectioned by overlay
  js/
    main.js                   ← entry; wires modules and the WS transport
    constants.js              ← ROLL_*, GLISS_*, COMPLEX_COLOR, PORTAMENTO_MS_PER_SEMITONE, etc.
    cube-scene.js             ← Three.js scene: cube + ghost + gizmo + camera fit
    rolling-score.js          ← canvas, brushes, gliss chain trajectory model
    sieve.js                  ← cell construction + glow envelope
    triangle.js               ← white K↔C↔sieve line + slide tracking
    state-ui.js               ← cards, mode badges, algorithm toast, perm row, state panel
    transport.js              ← WebSocket + MIDI echo + Web Bluetooth GAN connection
```

Each module owns its own state and exports a small API. Cross-module calls go through `main.js`'s wiring or a shared event bus, NOT direct global access. The CLAUDE.md Visual Invariants are preserved by ensuring the data the rolling-score and triangle modules use to plot pitch trajectories *comes from one source* (extracted into a shared helper if needed).

### Module ownership table

| Module | Owns (state) | Exports (API) | Subscribes to (events) | Renders to |
|---|---|---|---|---|
| `cube-scene.js` | Three.js scene, `cubeGroup`, `ghostGroup`, camera, `OrbitControls`, gizmo state, vertex/ghost meshes + labels, animation tweens | `getKWorldPos()`, `getCWorldPos()`, `setActiveK(k)`, `setSnap(quat)`, `setCubeQuat(q)`, `setGhostScale(s)`, animation hooks | gyro tick, state update (active K, snap quat, perm) | `#cube-canvas` |
| `rolling-score.js` | `activeMidiNotes`, `finishedMidiNotes`, brush palette, gliss chain trajectory cache | `noteOn(evt)`, `noteOff(evt)`, `panic()`, `pitchTrajectoryFor(voice, complex)` (read-only access used by triangle) | midi echo events | `#rolling-score` |
| `triangle.js` | `lineNotes`, line draw loop | `noteOn(evt)`, `noteOff(evt)`, `panic()` | midi echo events; reads from `cube-scene` (K/C world pos) and `rolling-score` (`pitchTrajectoryFor`) and `sieve` (cell rect) | `#line-overlay` |
| `sieve.js` | DOM cells, `cellGlows` Map | `setActiveSieve(set)`, `noteOn(evt)`, `noteOff(evt)`, `panic()`, `getCellRect(pitch)` | midi echo events; state update (active sieve) | `.ovl-sieve-right` cells |
| `state-ui.js` | DOM panels, mode badges, K/C cards, algorithm-toast container | `update(state, move)`, `setAlgorithm(name)`, `setSolved(solved, pulse)`, `pushAlgorithmToast(name)` | full XenaKubeState updates, algorithm event, solve event | left-column overlays + top-right algorithm area |
| `transport.js` | WebSocket, BLE Cube handle, reconnect timer | `onStateUpdate(cb)`, `onGyroTick(cb)`, `onVoice(cb)`, `onMidiEcho(cb)`, `onAlgorithm(cb)`, `onSolve(cb)`, `sendControl(msg)`, `connectCube(mac)` | (none — provides the events) | (no UI; pure transport) |
| `main.js` | (orchestration) | (none) | wires `transport` events → other modules | (slider DOM, button handlers) |

### Cross-module read access (intentional, narrow surfaces)

- `triangle.js` reads `cube-scene.getKWorldPos()` / `getCWorldPos()` to draw lines from cube to sieve.
- `triangle.js` reads `sieve.getCellRect(pitch)` to find the sieve cell's left-edge screen position.
- `triangle.js` reads `rolling-score.pitchTrajectoryFor(voice, complex)` so the leg endpoint and the drawn chain plot the *same* pitch curve (Visual Invariant #3).

Everything else is event-driven via `main.js` callbacks. Modules do NOT import each other transitively — each cross-module dependency is named in the table above and reviewable on this page.

### Extraction sequence (one commit per module)

Order chosen so each step leaves a working dashboard. Each commit: extract module, update `dashboard.html` to import it, update CLAUDE.md File Roles table.

- [x] 2.1 — Extract `js/constants.js` (immutable shared values: `ROLL_*` insets / pitch range / `ROLL_BRUSH_SCALE`, `GLISS_GAP_MS` / `GLISS_COMPLEXES`, `PORTAMENTO_MS_PER_SEMITONE` / `GLISS_PORTAMENTO_MS_PER_SEMITONE`, `COMPLEX_COLOR`, `PIZZ_FADE_MIN/MAX_MS`, `PENDING_MAX_AGE_MS`). Mutable state (`ROLL_PX_PER_SEC`, `ROLL_RIGHT_INSET_CSS_PX`) stays inline until a future phase exposes setters. Required relay-side prerequisite: static-file serving from `public/` (landed in 1f0d92f). Validated end-to-end: HTTP fetch to `/js/constants.js` returns 200 with `text/javascript` MIME.
- [x] 2.2 — Extract `css/main.css` from inline `<style>` (885 lines). Replaced with `<link rel="stylesheet" href="./css/main.css">` in head. Validated: served as `text/css; charset=utf-8`.
- [x] 2.3 — Extract `js/transport.js` (WebSocket transport). Owns the relay WS connection, auto-reconnect (2 s backoff), inbound JSON parsing, typed event dispatch (`open` / `close` / `state` / `gyroState` / `gyroTick` / `diagrams` / `algorithm` / `algorithmBook` / `solve` / `midiEcho`). Dashboard wires each event to its inline handler via `on(name, fn)`. Web Bluetooth GAN cube connection stays inline at the dashboard layer (button-tied UI state); could fold into transport in a future iteration.
- [x] 2.4 — Extract `js/sieve.js`. Owns: 49-cell DOM construction (with `BLACK_KEYS` / `SIEVE_RANGE` / octave-cell labels via internal `semitoneName`), Phase 1.1 `assertSieveLayout` invariant, per-cell emanation glow envelope (`COMPLEX_GLOW` profile table + refCount-based `cellGlows` Map + `tickGlows` rAF loop), active-sieve highlighting. Exports: `noteOn` / `noteOff` / `panic` (aliased back to inline `startGlow` / `endGlow` / `clearAllGlows` to keep call-site names stable), `setActive`, `getCellRect(pitch)` (read-only access for Phase 1.2's `assertPitchAxis` and the white-line `sieveCellLeftEdgePos`). The previously-cached `_sieveRect`/`refreshSieveRect` machinery dropped — `sieveCellLeftEdgePos` now goes through one `getSieveCellRect()` per call (1-3/frame, fine). `SIEVE_RANGE` and `BLACK_KEYS` re-exported for downstream consumers.
- [x] 2.5 — Extract `js/cube-scene.js`. Owns: Three.js scene, live K-cube + ghost C-cube + K↔C 3D line, gizmo (cam/live/ghost rotate target), all per-frame animations (gyro live rotation, ghost SLERP, active-step LERP, vertex/ghost-vertex perm-change LERPs), camera auto-fit, gyro zero (manual + auto on connect-view). Exports `init({ onAutoZero })` / `setCubeQuat` / `update(state)` / `applyConnectView` / `revertConnectView` / `zeroGyro` / `setGhostScale` / `getActiveKWorldPos` / `getCWorldPos` / `getCamera`. The auto-zero callback fires once after the connect-view orbit lands so main.js can mirror the zero to the relay (matches the Zero button's behaviour). 865 lines.
- [x] 2.6 — Extract `js/rolling-score.js`. Owns: full-viewport background canvas, FIFO `activeMidiNotes` per (voice, pitch), `finishedMidiNotes` ring (post-cull horizon), per-complex procedural brushes (spatter / wash / watercolor / airbrush / chalk / hardRound), gliss-chain Path2D stroker, slide-vs-leap chainStart classifier (rolling-side), Phase 1 visual invariants (`assertPitchAxis` per resize + `assertGlissSync` ~1 Hz when gliss line active), stuck-note watchdog. Exports `init({ onForceFinalise, getActiveGlissLineDisplay })` / `noteOn` / `noteOff` / `panic` / `setScrollSpeed` / `hasActiveNote`. Cross-module reads (sieve cell rect + triangle gliss display) wired via init callbacks to keep imports acyclic. 695 lines.
- [x] 2.7 — Extract `js/triangle.js`. Owns: lineOverlay canvas, `lineNotes` per-line state, `easeSlide` cubic-smoothstep, `predictGlissDuration`, `_findGlissLine` (white-line side of the unified slide-vs-leap classifier), pizz-fade release envelope. Same easing constants as rolling-score (Visual Invariant #3). Exports `init({ getCamera, getActiveKWorldPos, getCWorldPos, getSieveCellRect, hasActiveGliss })` / `noteOn` / `noteOff` / `panic` / `getActiveGlissLineDisplay(now)`. 362 lines.
- [x] 2.8 — Extract `js/state-ui.js`. Owns: state-panel rows (face / active voice / S4 element / path / step / snap / cycle / orbit / scramble / perm), mode badges (palette / voice / regime / solved), K/C cards (vertex-grid + complex-grid), seq pips, algorithm buffer + toast + partial-matches panel, expression panel (tilt / spin / dev / scramble), recent-moves FIFO, `FACE_SIG` HUD mirror, `COMPLEX_SHORT`. Exports `init({ onPathToggle })` / `update(state, move)` / `handleAlgorithmEvent` / `setSolvedBadge` / `updateExpression(quat, dev)` / `setAlgorithmBook`. 423 lines.
- [x] 2.9 — `js/main.js` is now the only module entry; `dashboard.html` collapsed from 2954 lines → 200 (HTML + importmap + a single `<script type="module" src="./js/main.js">`). main.js calls each module's init, subscribes transport events to module update entry points, wires sliders + buttons + Web Bluetooth GAN connect, dispatches `midi_echo` to sieve + triangle + rolling-score, mirrors the auto-zero / Zero-button to the relay. 348 lines. Pre-extraction monolith preserved at `public/dashboard.v1-monolith.html` (served by the relay; reachable at `:3000/dashboard.v1-monolith.html`) for direct A/B comparison while v2 stabilises.

**Acceptance for each step**: dashboard reloads and passes the runtime assertions added in Phase 1. Functional parity with v1 verified by running a 5-minute session and confirming the rolling score, triangle, sieve, and state panels look identical.

**Acceptance for the phase**: `dashboard.html` is HTML-only with module imports; no runtime regression vs v1; CLAUDE.md File Roles section reflects each new module.

## Phase 3 — WebGL bloom + tone mapping pilot

The smallest visual upgrade with the biggest impact: add Three.js `EffectComposer` + `UnrealBloomPass` + tone mapping to the cube scene. Validates the post-processing pipeline before any larger migration.

- [ ] Add `three/examples/jsm/postprocessing/*` to the `cube-scene.js` render path
- [ ] Switch renderer to linear color space (`renderer.outputColorSpace = LinearSRGBColorSpace`); convert all material colors to expect linear
- [ ] Tune bloom radius / threshold / intensity so cube edges + active K-vertex glow without washing out
- [ ] Add a quality slider (Low / Med / High) to `state-ui.js` that toggles bloom + post-processing for users on weaker GPUs
- [ ] Document the post-processing pipeline in `CLAUDE.md` Dashboard Architecture section (new section, written here for the first time)

**Acceptance**: cube has a perceptible glow without performance regression; quality slider works; CLAUDE.md describes the pipeline.

## Phase 4 — Rolling-score migration (Canvas 2D → WebGL, brush by brush)

Each complex's brush moves from `rolling-score.js`'s Canvas-2D implementation to a Three.js scene with custom shaders / particles. One brush per commit so each is independently reviewable and revertable.

- [ ] 4.1 — Pilot: C1 pizz scatter as a Three.js `Points` particle system. Validates the migration path; if this works cleanly, the rest follow the pattern.
- [ ] 4.2 — Gliss chain (C5/C6/C7) as ribbon/tube geometry sampled from the *same* pitch trajectory model that drives `triangle.js`. (Visual Invariant #3 enforced as a unified data source — exactly the consolidation deferred from v1.)
- [ ] 4.3 — C2 / C3 brushes (bowed cloud / watercolor) as fragment-shader bands.
- [ ] 4.4 — C4 harmonic as airbrush / radial gradient.
- [ ] 4.5 — C8 trem chalk as procedural noise shader.
- [ ] 4.6 — Retire the Canvas-2D rolling-score; `#rolling-score` becomes a WebGL canvas.

**Acceptance**: rolling score is fully WebGL, all brushes preserve their painterly aesthetic, performance ≥ 60 fps on a modest laptop GPU at 1080p.

## Phase 5 — Advanced visual effects (HDR, fluid, sparks)

Once the foundation is WebGL-native, layer in effects that weren't possible in Canvas 2D. Each is independent and ships only if it adds expressiveness.

- [ ] 5.1 — Spark particle bursts on pizz noteon (emit from K-vertex projected position; lifetime + gravity + fade)
- [ ] 5.2 — Pseudo-fluid background field (advection shader; bowed sustains splat slow color, pizz splats sharp impacts)
- [ ] 5.3 — Ribbon trails behind the active K-vertex during cube rotation
- [ ] 5.4 — HDR / wide-gamut display output (`canvas.getContext` with `colorSpace`); requires HDR-capable display + browser support; ship as opt-in
- [ ] 5.5 — Custom shader for sieve cell glow (replace DOM ::after pseudo-element with a uniform-driven shader pass)

## Reintegration follow-ups (when v2 merges back into the main XenaKube/)

Things deliberately deferred during v2 development that should be addressed in the unified codebase:

- [ ] **D53 v2 / D59 — pitchbend-driven cross-string slides + slow C7 drift** (one design covers both). Cross-string slides (any pair where `sameString(src, dst) === false`) currently emit `leapStep` per D46 because SWAM's portamento engine can't slide across physical strings. D58 (per-complex `MAX_LEAPS_BY_COMPLEX`) constrains targets to same-string for C6/C7 as a same-day fix; the durable answer is bendStep — pitch wheel ramp on a single held note, audible pitch curve regardless of string. Same mechanism gives genuinely slow microtonal sweep for C7 (CC 5 caps at 127 ≈ 127 ms/semi; pitchbend bypasses the cap entirely). **Full design doc**: `docs/research_notes.md` § Cross-String Pitchbend Slides (D59 — design, 2026-04-30). Touches: bridge `bendStep` + `rampPitchbend` + `glissBendCount`, new `/xk/midi/bendstep` OSC echo, `src/osc-schema.ts` (regen `max/gen_includes.js`), dashboard `transport.js` event + `triangle.js` / `rolling-score.js` segment-model extension, SWAM preset Pitchbend Range = ±12, CLAUDE.md D48 row update once D59 ships (set every entry in `MAX_LEAPS_BY_COMPLEX` to 0). Estimated effort: ~5 hours total across 5 phases.
- [ ] **Phase 1.2 PITCH AXIS threshold** — currently 2 CSS px to absorb subpixel-rendering noise (`canvas.height = round(window.innerHeight × dpr)` rounding plus browser flex-snap at non-integer dpr / non-100% browser zoom; the 0.99× multiplier at the bottom cell amplifies a ~1.16 px innerH discrepancy into 1.15 px at P=36). Proper fix: drive `midiToY` off CSS-derived `window.innerHeight - 70 - 80` (unrounded) instead of canvas-derived `(canvas.height - 150 × dpr) / dpr`, so both sides share the same source of truth. Threshold can return to 1 px once both paths agree exactly. Will require an audit of all `midiToY` call-sites since the function signature may need to drop the `h` parameter.
- [ ] **Wild-gliss leap drawn as gliss** (if the diagnostic in `841a136` confirms UDP reorder is the cause) — bridge emits `/xk/midi/leap <voice> <complex>` OSC marker between `noteoff(old)` and the scheduled `noteon(new)` in `leapStep`. Dashboard sets a pending-leap-break flag for that (voice, complex); next noteon for the group force-sets `chainStart=true` regardless of receive order. Marker is order-independent at OSC level, so UDP reorder can't hide it.
- [ ] **`maxmsp` MCP**, performance-mode coordination, and any other workflow tooling differences that v2 development surfaced.

## Phase 6 — Hosting

Phase 6 only makes sense after Phase 2 (modular split) has shipped. The static-hostable structure that Phase 2 produces is exactly what Modes A / C below need.

- [ ] Decide hosting mode:
  - **Mode A** — static demo viewer hosted on Netlify / Vercel / GH Pages; users see visuals only, performances run locally with relay+Max
  - **Mode C** — visiting performers connect their cube to your machine via the dashboard at your IP
  - **Mode B** — fully online with browser-side synthesis (replaces SWAM with Web Audio physical model — months of work; treat as a separate project, not a phase here)
- [ ] If A or C: configure CI to deploy the `public/` directory on push; document the local-relay setup in README

## Cross-cutting concerns to maintain throughout

- **Visual Invariants** stay green; assertions don't fire during normal play. Re-audit the table when adding any new module that draws.
- **Bridge Invariants** are unchanged from v1; the synthesis pipeline is not part of v2 work.
- **Performance budget** — `--quality` slider lands in Phase 3 and gets respected by every Phase 4–5 effect.
- **No coupling effects to `handleMidiEcho` directly** — keep the midi echo signal pure; add a small event bus in `main.js` that visual effects subscribe to so layers can be added / removed without surgery.
- **Doc maintenance**: every module-extraction commit updates `CLAUDE.md` File Roles + this `docs/todo.md` phase status in the same commit. `CHANGELOG.md` gets an entry per shipped feature.
- **Carryover from v1**: Phase A2 solve-anchor, Phase B phrase library, Phase E tier 3 phrase migration all live in the synthesis side and are unaffected by v2's dashboard work — they continue tracking in `docs/revision_roadmap.md`.
