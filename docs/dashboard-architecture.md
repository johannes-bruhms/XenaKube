# Dashboard Architecture

> The browser-side dashboard's structure: module layout, cross-module read surfaces, overlay positioning, and rolling-score brush rendering. CLAUDE.md keeps a one-paragraph summary; this file is the deep reference. Read alongside `docs/dashboard-invariants.md` (visual-side runtime invariants) when changing any module under `public/`.

## Entry point

`dashboard.html` at `http://localhost:3000`. Full-viewport HUD: `#cube-canvas` fills the window; all UI floats as transparent overlays. Three.js 3D cube with per-vertex K#/D/G/U labels, a ghost C-cube that snap-rotates from `state.snapQuat`, top-face slot markers, and C identity dots that are fixed to local slots in beta-cosmo but walk across slots in alpha-cosmo. WS client to relay. Pixel/zoom values live in CSS (L48-60).

## Module layout (Phase 2 complete)

- `dashboard.html` — HTML structure only. Single `<script type="module" src="./js/main.js">` mounts the entry. The pre-Phase-2 monolithic version is preserved at `dashboard.v1-monolith.html` (also served by the relay; reachable at `:3000/dashboard.v1-monolith.html`) for direct A/B comparison.
- `css/main.css` (Phase 2.2) — all dashboard styles, sectioned by overlay. CSS variables `--roll-top-inset` / `--roll-bottom-inset` MUST equal JS `ROLL_TOP_INSET_PX` / `ROLL_BOTTOM_INSET_PX` (rolling-score's `assertPitchAxis` fires loudly on drift).
- `js/constants.js` (Phase 2.1) — shared immutable constants (`ROLL_*` insets / pitch range / brush scale, `GLISS_GAP_MS` / `GLISS_COMPLEXES`, `PORTAMENTO_MS_PER_SEMITONE` / `GLISS_PORTAMENTO_MS_PER_SEMITONE` mirrors of the bridge, `COMPLEX_COLOR` palette, `PIZZ_FADE_MIN/MAX_MS`, `PENDING_MAX_AGE_MS`).
- `js/transport.js` (Phase 2.3) — WebSocket transport. `connect()` / `send(obj)` / `on(name, fn)`. Auto-reconnect at 2 s. Typed events: `open`, `close`, `state`, `gyroState`, `gyroTick`, `diagrams`, `algorithm`, `algorithmBook`, `solve`, `midiEcho`. Outbound browser `gyro` mirrors are dropped under WS `bufferedAmount` pressure; live `move` messages are still attempted.
- `js/sieve.js` (Phase 2.4) — 49-cell pitch strip + per-cell emanation glow + active-set highlighting. Owns `assertSieveLayout` (init-time invariant). Exports `noteOn` / `noteOff` / `panic` / `setActive` / `getCellRect(pitch)` / `SIEVE_RANGE` / `BLACK_KEYS`.
 - `js/cube-scene.js` (Phase 2.5) — Three.js scene: live K-cube, snap-tracking ghost C-cube, K↔C 3D line, top-face slot markers, gizmo, all per-frame animations (gyro live rotation, ghost snap SLERP, active-step LERP, K-vertex LERPs, active highlights), camera auto-fit, gyro zero. Ghost orientation uses `state.snapQuat`, not phrase-lockable `state.cQuat`; C identity meshes and labels stay fixed to local slots in beta-cosmo, but walk to the assigned slot from `state.cAssignments` in alpha-cosmo. In beta-cosmo the active ghost ring resolves from the active local slot, matching the fixed C label in that corner, while alpha-cosmo can still highlight the assigned C type. Exports `init({ onAutoZero })` / `setCubeQuat([x,y,z,w])` / `update(state)` / `applyConnectView()` / `revertConnectView()` / `zeroGyro()` / `setGhostScale(s)` / `getActiveKWorldPos(out)` / `getCWorldPos(c, out)` / `getCamera()`. Owns the rotate-target buttons (cam/live/ghost) + ghost-size slider's geometry.
- `js/rolling-score.js` (Phase 2.6) — full-viewport background piano-roll canvas + per-complex procedural brushes + gliss-chain Path2D stroker + slide-vs-leap chainStart classifier (rolling-side) + Phase 1 invariants (`assertPitchAxis` per resize, `assertGlissSync` ~1 Hz when a gliss line is active) + stuck-note watchdog. Exports `init({ onForceFinalise, getActiveGlissLineDisplay })` / `noteOn` / `noteOff` / `panic` / `setScrollSpeed` / `hasActiveNote(voice, complex)`.
- `js/triangle.js` (Phase 2.7) — white K↔sieve / C↔sieve leg overlay. Cubic-smoothstep slide easing matches rolling-score exactly (Visual Invariant #3). Exports `init({ getCamera, getActiveKWorldPos, getCWorldPos, getSieveCellRect, hasActiveGliss })` / `noteOn` / `noteOff` / `panic` / `getActiveGlissLineDisplay(now)`.
- `js/state-ui.js` (Phase 2.8) — overlay panels: state rows, mode badges, K/C cards, perm slots, algorithm buffer + toast, scramble bar, expression panel, recent-moves FIFO. Owns `FACE_SIG` (HUD mirror of `src/face-gesture.ts`) and `COMPLEX_SHORT`. Exports `init({ onPathToggle })` / `update(state, move)` / `setCosmologyBadge(cosmology)` / `handleAlgorithmEvent` / `setSolvedBadge(solved, pulse)` / `updateExpression(quat, dev)` / `setAlgorithmBook`.
- `js/main.js` (Phase 2.9) — entry point. Imports every module, calls each one's `init()`, subscribes transport events to module update entry points, wires sliders + buttons + the visible alpha/beta cosmology toggle (`set_mode.cosmology`) + Web Bluetooth GAN cube connection, and dispatches `midi_echo` to sieve + triangle + rolling-score in one place.
- `interruption/` — optional performance overlay package, disabled unless the URL includes `?intrusions=1` or the debug `I` key enables it. `index.js` owns the pressure state machine, generated/video playback, targeting canvas, debug keys, injected CSS, and DOM cleanup. `config.js` owns first-draft pressure/duration tunables. `clips.js` owns local clip metadata and generated placeholder entries. `main.js` is the only import and fanout boundary.

## Cross-module read surfaces (intentional, narrow — see `docs/todo.md` Phase 2 ownership table)

- `triangle` reads cube-scene `getActiveKWorldPos` / `getCWorldPos` / `getCamera`, sieve `getCellRect`, rolling-score `hasActiveNote`.
- `rolling-score` reads triangle `getActiveGlissLineDisplay` (wired via init() callback to avoid circular import) so `assertGlissSync` can compare line ↔ chain trajectories.
- `interruption` reads cube-scene `getCamera` / `getActiveKWorldPos` / `getCWorldPos` through `main.js` only, for its separate targeting canvas. If those callbacks are absent while the module is enabled, it warns once and leaves target projection disabled.

The "Cross-module init wiring" Dashboard Visual Invariant (`docs/dashboard-invariants.md`) covers the runtime contract that protects these surfaces.

## Overlays

- **Top-left** (`.ovl-tl`): title + MAC/connect (button turns green via `.connected`), alpha/beta cosmology toggle, mode badges, active K/C cards.
- **Bottom-left** (`.ovl-bl`, anchored `bottom: 110px`): State panel (face, active voice, S4 element, path, step, snap, complex phase, orbit, scramble, permutation), then Expression panel (Zero Gyro + smoothing slider + tilt/spin/deviation/scramble). `zoom: 0.5` applies per-child to keep the bottom anchor zoom-invariant so the stack never overlaps the sieve strip.
- **Top-center** (`.ovl-tc`): cube-algorithm buffer + algorithm notification. Move strip is a dashboard-side 8-move FIFO (`recentMoves`, `RECENT_MOVES_MAX = 8`), decoupled from the engine's `state.algorithmBuffer` (which clears on its own 2 s timeout / algorithm-fire); each turn pushes one move and shifts the oldest, so the strip never empty-flashes. Match-highlighting still consumes `state.algorithmPartials` and applies to the trailing N entries.
- **Top-right**: cam / live / ghost rotate toggles + rotation gizmo.
- **Bottom**: full-width sieve piano-roll (C2–C6).
- **Background** (`<canvas id="rolling-score">`, `position: fixed; inset: 0; z-index: -1`): rolling piano-roll behind cube-canvas (`alpha: true`). Right edge = `now`, scrolling left at `ROLL_PX_PER_SEC` CSS-px/sec (default 360, retunable live via the `score` slider in the bottom-right cluster — value persists in `localStorage`). Pitch axis C2..C6 maps into the *inner* rectangle defined by `ROLL_TOP_INSET_PX = 70` / `ROLL_BOTTOM_INSET_PX = 80` so notes never paint under the title / algorithm row / cam strip or the bottom sieve. See "Rolling-score brush rendering" below for per-complex visual treatment.
- **Optional interruption layer** (`public/interruption/`, URL `?intrusions=1`): creates a fixed video element and fixed targeting canvas under the normal HUD overlays, plus a debug panel only when `intrusionDebug=1` or `D` is pressed. The layer injects/removes its own scoped stylesheet and leaves no DOM behind when disabled or destroyed.

Only the active K/C cards render; the 8-vertex/complex grids and legacy controls are populated but hidden via `.ovl-legacy`. The XENAKUBE title toggles chrome visibility with `body.ui-hidden`: connection controls, mode badges, state panels, bottom-right controls, move buffer, toasts, and active K/C cards hide, while the cube, rolling score, sieve, and live K-vertex telemetry labels remain visible.

## Rolling-score brush rendering

Each note is rendered via a per-complex procedural brush (`COMPLEX_BRUSH` dispatch; reference `docs/archived/brushes.png`):

- C1 pizz = spatter
- C2 arco = rough wash
- C3 arco = watercolor
- C4 harm = airbrush halo
- C8 sul-pont trem = chalk grit

Gliss complexes C5/C6/C7 bypass per-note brushes — each chain (maximal run of same-voice + same-complex notes that pass the unified live-entry classifier; see `docs/dashboard-invariants.md` "Slide-vs-leap classifier consistency") is drawn as a single stroked Path2D (`drawGlissChain`) with `lineJoin = 'round'`, so the rect-body / slant-transition / rect-body polyline reads as one continuous brush stroke. The legacy `GLISS_GAP_MS = 25` ms (`constants.js`) is now a UDP-reorder fallback only — chain breaks fire on the per-note `chainStart` flag.

Brush vertical dimensions go through `bu(factor) = rollRowH * factor * ROLL_BRUSH_SCALE` where `rollRowH` is the device-px height of one semitone in the current viewport (recomputed every frame). This keeps brushes proportional across screen sizes — a 1.45-row chalk band stays 1.45 rows on a 1080p monitor and on a 13" MacBook. `ROLL_BRUSH_SCALE` (default 1.4) is the single global tuning knob.

Colours per complex: C1 amber, C2/C3 cobalt, C4 cyan, C5/C6/C7 magenta, C8 crimson. Velocity → opacity. Stochastic brush textures use a `mulberry32` stream seeded from `(voice, pitch, onsetMs)` so each note's speckle pattern is identical every frame.

Per-key FIFO queue for in-flight notes (`activeMidiNotes: Map<key, Array<entry>>`) — bridge legitimately emits overlapping noteons on the same pitch (C8 trem rebows, double-stop companion, humanPitch collisions) and the queue preserves each iteration as a distinct rendered note instead of overwriting. Watchdog finalises any active note stuck > 45 s.

Within-note dynamic shape (D70 + D71): brush half-height samples the per-voice CC 11 trace at each polygon vertex / particle's t — see `docs/dashboard-invariants.md` "Within-note dynamic shape fidelity" row.

Data source: `midi_echo` WS messages mirrored from Max; Phase E tier 3 will switch to TS-generated note lists once the phrase migration lands.

## Post-processing pipeline (Phase 3)

The cube scene runs through an `EffectComposer` chain in `public/js/cube-scene.js`. The composer is built once at module load and lives next to the renderer:

```
RenderPass(scene, camera) → UnrealBloomPass → OutputPass → canvas
```

`renderer.toneMapping = ACESFilmicToneMapping` and `renderer.toneMappingExposure = 1.0` are set on the WebGL renderer itself. Tone mapping + sRGB conversion are applied either by `OutputPass` (Med / High quality) or by the renderer directly (Low — composer bypassed). Both code paths honor the renderer's tone mapping setting, so flipping the picker only gates bloom + the composer overhead, not the colour curve.

Quality is a discrete tier — `setQuality('low' | 'med' | 'high')` — exposed by `cube-scene.js`, persisted in `localStorage('quality')` by `main.js`, defaulted to **Med** so a fresh user on a normal GPU sees the effect. Low is the explicit "weak GPU" escape hatch that skips the composer entirely.

| Tier | Composer | strength | radius | threshold |
|---|---|---|---|---|
| Low  | bypassed (direct `renderer.render`) | — | — | — |
| Med (default) | enabled | 0.5 | 0.5 | 0.78 |
| High | enabled | 0.8 | 0.7  | 0.65 |

Defaults are tunable in browser; `applyQualityPreset` mutates the live `bloomPass` parameters. The active K-vertex glow ring (white, opacity pulsing 0.4 → 0.7) is the canonical "should bloom" element — Med threshold 0.78 catches the upper half of the pulse, High threshold 0.65 catches the full pulse plus the brightest K-vertex hues (lime / yellow-green). K/C vertex labels are assigned to a separate render layer and drawn after the base/composer pass, so `UnrealBloomPass` never blurs the text.

The gizmo runs on its own `gizmoRenderer` and does **not** post-process — small UI controls don't want a glow halo. `composer.setSize` + `bloomPass.resolution.set` are wired into `resizeCube()` so the composer tracks viewport changes.

The picker DOM lives in `public/dashboard.html`'s `.ovl-br` cluster (`#qualityCtrl`), styled in `public/css/main.css` via `.quality-ctrl .q-btn{,:hover,.active}`, click-wired in `public/js/main.js`'s `applyQuality()`. The picker hides under `body.ui-hidden` along with the rest of the chrome so the title-toggle "performance mode" is unaffected.

Phase 4 brush migration (Canvas-2D → WebGL) will share this composer chain rather than build a second one — the rolling-score canvas stays separate but post-processing of the cube scene is the validated reference pipeline.

## Editing checklist

After editing `dashboard.html`, load `:3000` and verify the rolling score renders, K/C cards stay visible, and Zero Gyro works at 100 % and 50 % browser zoom. After interruption-layer edits, also verify `?intrusions=0` leaves no overlay DOM visible and `?intrusions=1&intrusionDebug=1` responds to `W`, `C`, `X`, `D`, and `T`.
