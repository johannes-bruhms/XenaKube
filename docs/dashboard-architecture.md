# Dashboard Architecture

> The browser-side dashboard's structure: module layout, cross-module read surfaces, overlay positioning, and rolling-score brush rendering. CLAUDE.md keeps a one-paragraph summary; this file is the deep reference. Read alongside `docs/dashboard-invariants.md` (visual-side runtime invariants) when changing any module under `public/`.

## Entry point

`dashboard.html` at `http://localhost:3000`. Full-viewport HUD: `#cube-canvas` fills the window; all UI floats as transparent overlays. Three.js 3D cube with per-vertex K#/D/G/U labels, ghost C-cube at fixed orientation (each C label pinned to one corner; rotatable independently via the gizmo). WS client to relay. Pixel/zoom values live in CSS (L48–60).

## Module layout (Phase 2 complete)

- `dashboard.html` — HTML structure only. Single `<script type="module" src="./js/main.js">` mounts the entry. The pre-Phase-2 monolithic version is preserved at `dashboard.v1-monolith.html` (also served by the relay; reachable at `:3000/dashboard.v1-monolith.html`) for direct A/B comparison.
- `css/main.css` (Phase 2.2) — all dashboard styles, sectioned by overlay. CSS variables `--roll-top-inset` / `--roll-bottom-inset` MUST equal JS `ROLL_TOP_INSET_PX` / `ROLL_BOTTOM_INSET_PX` (rolling-score's `assertPitchAxis` fires loudly on drift).
- `js/constants.js` (Phase 2.1) — shared immutable constants (`ROLL_*` insets / pitch range / brush scale, `GLISS_GAP_MS` / `GLISS_COMPLEXES`, `PORTAMENTO_MS_PER_SEMITONE` / `GLISS_PORTAMENTO_MS_PER_SEMITONE` mirrors of the bridge, `COMPLEX_COLOR` palette, `PIZZ_FADE_MIN/MAX_MS`, `PENDING_MAX_AGE_MS`).
- `js/transport.js` (Phase 2.3) — WebSocket transport. `connect()` / `send(obj)` / `on(name, fn)`. Auto-reconnect at 2 s. Typed events: `open`, `close`, `state`, `gyroState`, `gyroTick`, `diagrams`, `algorithm`, `algorithmBook`, `solve`, `midiEcho`.
- `js/sieve.js` (Phase 2.4) — 49-cell pitch strip + per-cell emanation glow + active-set highlighting. Owns `assertSieveLayout` (init-time invariant). Exports `noteOn` / `noteOff` / `panic` / `setActive` / `getCellRect(pitch)` / `SIEVE_RANGE` / `BLACK_KEYS`.
- `js/cube-scene.js` (Phase 2.5) — Three.js scene: live K-cube, fixed-orientation ghost C-cube, K↔C 3D line, gizmo, all per-frame animations (gyro live rotation, active-step LERP, K-vertex perm-change LERPs), camera auto-fit, gyro zero. Ghost cube does not track the live cube — it sits at `ghostViewOffset` (gizmo-controlled, identity by default) and ghost vertex meshes stay pinned to `CUBE_VERTS[c]`; only the active-C ring travels (between fixed corners) when the active C changes. Exports `init({ onAutoZero })` / `setCubeQuat([x,y,z,w])` / `update(state)` / `applyConnectView()` / `revertConnectView()` / `zeroGyro()` / `setGhostScale(s)` / `getActiveKWorldPos(out)` / `getCWorldPos(c, out)` / `getCamera()`. Owns the rotate-target buttons (cam/live/ghost) + ghost-size slider's geometry.
- `js/rolling-score.js` (Phase 2.6) — full-viewport background piano-roll canvas + per-complex procedural brushes + gliss-chain Path2D stroker + slide-vs-leap chainStart classifier (rolling-side) + Phase 1 invariants (`assertPitchAxis` per resize, `assertGlissSync` ~1 Hz when a gliss line is active) + stuck-note watchdog. Exports `init({ onForceFinalise, getActiveGlissLineDisplay })` / `noteOn` / `noteOff` / `panic` / `setScrollSpeed` / `hasActiveNote(voice, complex)`.
- `js/triangle.js` (Phase 2.7) — white K↔sieve / C↔sieve leg overlay. Cubic-smoothstep slide easing matches rolling-score exactly (Visual Invariant #3). Exports `init({ getCamera, getActiveKWorldPos, getCWorldPos, getSieveCellRect, hasActiveGliss })` / `noteOn` / `noteOff` / `panic` / `getActiveGlissLineDisplay(now)`.
- `js/state-ui.js` (Phase 2.8) — overlay panels: state rows, mode badges, K/C cards, perm slots, algorithm buffer + toast, scramble bar, expression panel, recent-moves FIFO. Owns `FACE_SIG` (HUD mirror of `src/face-gesture.ts`) and `COMPLEX_SHORT`. Exports `init({ onPathToggle })` / `update(state, move)` / `handleAlgorithmEvent` / `setSolvedBadge(solved, pulse)` / `updateExpression(quat, dev)` / `setAlgorithmBook`.
- `js/main.js` (Phase 2.9) — entry point. Imports every module, calls each one's `init()`, subscribes transport events to module update entry points, wires sliders + buttons + Web Bluetooth GAN cube connection, and dispatches `midi_echo` to sieve + triangle + rolling-score in one place.

## Cross-module read surfaces (intentional, narrow — see `docs/todo.md` Phase 2 ownership table)

- `triangle` reads cube-scene `getActiveKWorldPos` / `getCWorldPos` / `getCamera`, sieve `getCellRect`, rolling-score `hasActiveNote`.
- `rolling-score` reads triangle `getActiveGlissLineDisplay` (wired via init() callback to avoid circular import) so `assertGlissSync` can compare line ↔ chain trajectories.

The "Cross-module init wiring" Dashboard Visual Invariant (`docs/dashboard-invariants.md`) covers the runtime contract that protects these surfaces.

## Overlays

- **Top-left** (`.ovl-tl`): title + MAC/connect (button turns green via `.connected`), mode badges, active K/C cards.
- **Bottom-left** (`.ovl-bl`, anchored `bottom: 110px`): State panel (face, active voice, S4 element, path, step, snap, complex phase, orbit, scramble, permutation), then Expression panel (Zero Gyro + smoothing slider + tilt/spin/deviation/scramble). `zoom: 0.5` applies per-child to keep the bottom anchor zoom-invariant so the stack never overlaps the sieve strip.
- **Top-center** (`.ovl-tc`): cube-algorithm buffer + algorithm notification. Move strip is a dashboard-side 8-move FIFO (`recentMoves`, `RECENT_MOVES_MAX = 8`), decoupled from the engine's `state.algorithmBuffer` (which clears on its own 2 s timeout / algorithm-fire); each turn pushes one move and shifts the oldest, so the strip never empty-flashes. Match-highlighting still consumes `state.algorithmPartials` and applies to the trailing N entries.
- **Top-right**: cam / live / ghost rotate toggles + rotation gizmo.
- **Bottom**: full-width sieve piano-roll (C2–C6).
- **Background** (`<canvas id="rolling-score">`, `position: fixed; inset: 0; z-index: -1`): rolling piano-roll behind cube-canvas (`alpha: true`). Right edge = `now`, scrolling left at `ROLL_PX_PER_SEC` CSS-px/sec (default 360, retunable live via the `score` slider in the bottom-right cluster — value persists in `localStorage`). Pitch axis C2..C6 maps into the *inner* rectangle defined by `ROLL_TOP_INSET_PX = 70` / `ROLL_BOTTOM_INSET_PX = 80` so notes never paint under the title / algorithm row / cam strip or the bottom sieve. See "Rolling-score brush rendering" below for per-complex visual treatment.

Only the active K/C cards render; the 8-vertex/complex grids and legacy controls are populated but hidden via `.ovl-legacy`.

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

## Editing checklist

After editing `dashboard.html`, load `:3000` and verify the rolling score renders, K/C cards stay visible, and Zero Gyro works at 100 % and 50 % browser zoom.
