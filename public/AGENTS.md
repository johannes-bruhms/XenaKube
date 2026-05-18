# `public/` Agent Guide

This guide applies to the browser dashboard under `public/`.

## Module contract

- `dashboard.html` is the HTML shell, not the logic container.
- `js/main.js` is the single entry point and the only place cross-module wiring should be obvious at a glance.
- `css/main.css` owns styling; `js/constants.js` owns shared immutable dashboard constants.
- The dashboard is native ES modules with no bundler and no browser-side TypeScript.

## Files/modules

- `dashboard.html`: active browser shell served at `http://localhost:3000`.
- `dashboard.v1-monolith.html`: pre-split reference shell for A/B behavior checks.
- `css/main.css`: all dashboard styling and CSS-side mirrored constants.
- `js/constants.js`: shared immutable constants mirrored by CSS and bridge behavior.
- `js/transport.js`: WebSocket transport and typed event fanout; auto-reconnects only while the page is live, exposes `isOpen()` for relay-gated BLE flows, and closes on page unload so the relay can exit after the last dashboard disconnects.
- `js/main.js`: entry point, init/callback wiring, dashboard settings and preset panels, relay-gated Web Bluetooth connect flow, latest-only BLE gyro forwarding with pre-move/pre-zero flushes and move-inline fallback, and `midi_echo` dispatch.
- `js/cube-scene.js`: Three.js cube scene, snap ghost, canonical alignment checks, gyro zero, runtime appearance setters, brush-locked C vertex material, 3D read positions, and active K/C label-merge card projection.
- `js/rolling-score.js`: rolling piano-roll canvas, brushes, note/gliss history, and visual assertions.
- `js/spectrum-score.js`: optional actual-audio spectrogram canvas, spectrum frame buffer, modality rendering, no-synthetic-stale painting guard, and stale-frame telemetry.
- `js/mandala-canvas.js`: optional accumulating mandala layer fed by `sphere_strike` events (mandala-cosmo gamelan engine). Togglable alongside MIDI brushes / spectrogram; off by default. Renders below brushes (Z = -2, brushes at -1). Owns the D80 glyph-counter, D81 symmetry-constant-sync, and D83 feature-gate invariants on the dashboard side. `MANDALA_SYMMETRY_ORDER` mirrors `--mandala-symmetry` in `css/main.css`.
- `js/performance-recorder.js`: optional long-PNG recorder for visible/composite/spectrum/MIDI rolling visual layers.
- `js/triangle.js`: K/C-to-sieve leg overlay, runtime appearance setters, and gliss-line trajectory model.
- `js/sieve.js`: 49-cell pitch strip, active pitch glow, and sieve layout assertion.
- `js/state-ui.js`: overlay state rows, badges, phrase-triggered floating K/C cards, card text appearance mirror, algorithm UI, expression panel, and recent moves.
- `js/face-glyph.js`: shared FACE_SIG mirror of `src/face-gesture.ts` plus `paintFaceGlyph`. Consumed by `js/cube-scene.js` for through-cube-visible ghost decals with a display-face remap and transient face-turn cue, and by `js/state-ui.js` for the retrospective active-card glyph. The painter draws two unlabeled underlined move marks per face; do not reintroduce camera-side glyph flipping or face letters.
- `js/settings-sync.js`: portable dashboard settings — owns `SYNCED_KEYS`, the localStorage→`/api/dashboard-settings` POST side (debounced + `beforeunload` flush via `sendBeacon`), and preset helper calls for `/api/dashboard-presets`. Bootstrap-from-server runs synchronously in `dashboard.html`'s inline script BEFORE `main.js` loads, so module-init `localStorage.getItem` reads see the file's values. When you add a new persisted setting, append the key to `SYNCED_KEYS` here AND the `ALLOWED` array in `dashboard.html`'s bootstrap, OR settings drift between the two surfaces. Active settings live at repo-tracked `data/dashboard-settings.json`; named presets live at repo-tracked `data/dashboard-presets.json`; relay serves both.
- `interruption/`: optional `?intrusions=1` overlay package. `index.js` owns DOM, injected CSS, pressure state machine, generated/video playback, debug keys, and targeting canvas; `config.js` owns tunables; `clips.js` owns clip metadata. It is wired only from `js/main.js`.

## Read before editing

- `../CLAUDE.md` dashboard architecture section
- `../docs/dashboard-architecture.md`
- `../docs/dashboard-invariants.md`
- `../docs/todo.md`

## Rules

- Preserve the Phase 2 split: no backsliding into a monolithic inline script.
- Keep cross-module dependencies narrow and explicit through `main.js` init callbacks. Avoid new direct imports that create circular knowledge between modules.
- Keep `midi_echo` fanout centralized in `js/main.js`. Do not scatter transport interpretation across unrelated modules.
- Keep `interruption/` detachable: no imports from existing dashboard modules except the `js/main.js` init/fanout boundary, and no edits to `js/triangle.js` for the interruption targeting overlay.
- Keep CSS and JS mirrored constants in sync. In particular, `main.css` inset variables must agree with `js/constants.js`.
- If a change touches pitch layout, gliss trajectories, note-chain classification, cross-module init wiring, active-card anchoring/conjure motion, or within-note dynamic rendering, re-audit the matching invariant row in `../docs/dashboard-invariants.md`.
- If a change touches the optional spectrogram, keep modality frame-owned: `spectrum-score.js` must not infer complex from live engine state, and relay fallback for `complex=0` must follow the latest audio-side MIDI noteon.
- If a change touches canonical move remap, relay-open gating, BLE gyro forwarding/order, face geometry, snap/ghost orientation, ghost C identity motion, or top-face markers, audit the mirrored assumptions in `../relay.js`, `js/cube-scene.js`, `js/main.js`, and the matching dashboard invariant row.
- `dashboard.v1-monolith.html` is a reference artifact for A/B behavior checks, not the active implementation surface.

## Invariant hotspots

- Sieve layout / pitch axis: `js/sieve.js`, `js/rolling-score.js`, `css/main.css`
- Gliss sync and slide-vs-leap classification: `js/rolling-score.js`, `js/triangle.js`, `js/main.js`, `js/constants.js`
- Cross-module wiring: `js/main.js` init blocks, including the state-ui active-pair card anchor callback.
- Dynamic-trace rendering: `js/rolling-score.js`
- Spectrogram gate/modality ownership: `js/spectrum-score.js`, `../relay.js`, `js/transport.js`
- Canonical remap / ghost snap / walkable alpha ghost C identities / fixed beta ghost C geometry: `js/cube-scene.js`, `js/main.js`, `../relay.js`

## Manual verification

After dashboard changes, verify at `http://localhost:3000`:

- the rolling score renders,
- active K/C labels merge into the K/C cards after a phrase trigger,
- Zero Gyro button and raw GAN `U'`×4 shortcut still work,
- no dashboard invariant logs fire in the browser console,
- layout remains correct at 100% and 50% browser zoom.

## Targeted tests

- `../test/dashboard-ghost.test.ts`: static guard that beta-cosmo keeps ghost C geometry fixed in local slots, alpha-cosmo walks C identities by `state.cAssignments`, active C highlighting resolves from the active local slot in beta, and the alpha/beta dashboard toggle posts `set_mode.cosmology`.
- `../test/dashboard-mac-privacy.test.ts`: served dashboard surfaces don't carry the historical real MAC address, don't persist cube MAC to localStorage, and the v1 monolith retains the no-prefill guard. The live `public/dashboard.html` is allowed to ship a development-cube `value=` default for convenience; the test asserts that trade-off explicitly so the policy is one place, not two.
- `../test/interruption-layer.test.ts`: static guard that the interruption layer stays feature-flagged, detachable, self-styled, and wired only through `js/main.js`.
- `../test/dashboard-ui.test.ts`: static guard that the title-toggle "performance mode" leaves non-active live K-vertex telemetry labels visible (no `setVertexInfoVisible` shutoff path), while active K/C labels can merge into the K/C cards on phrase trigger; also guards the optional spectrogram layer controls, cube colors panel, and module contracts.
- `../test/transport-backpressure.test.ts`: static guard that relay/browser WS backpressure sheds low-priority gyro telemetry without adding a move-drop path, that spectrum frames stay gated/low-priority with audio-side complex fallback, and that the relay binds to loopback by default (unauthenticated WS control surface).
- `../test/dashboard-bridge-sync.test.ts`: paired-tunable equality between `max/xk_swam.js`, `src/phrase-plan.ts`, and `public/js/constants.js` (PITCHBEND_RANGE_SEMI, MIN_GLISS_SPACING_MS, GLISS_SLIDE_MAX_DUR_MS, PORTAMENTO_MS_PER_SEMITONE). Closes the code-vs-code drift gap CLAUDE.md's doc-side constant-sync can't see.
- `../test/dashboard-settings-sync.test.ts`: portable-settings/presets round-trip guard — `relay.js` exposes `GET/POST /api/dashboard-settings` and `GET/POST /api/dashboard-presets` with atomic writes, `public/dashboard.html` bootstraps synchronously BEFORE `js/main.js`, `js/main.js` installs the push side and preset panel, the first preset preserves the repo-tracked current settings, and the `ALLOWED` allowlist inside `dashboard.html` matches `SYNCED_KEYS` inside `js/settings-sync.js` byte-for-byte.
