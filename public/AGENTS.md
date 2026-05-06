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
- `js/transport.js`: WebSocket transport and typed event fanout.
- `js/main.js`: entry point, init/callback wiring, Web Bluetooth connect flow, and `midi_echo` dispatch.
- `js/cube-scene.js`: Three.js cube scene, snap ghost, canonical alignment checks, gyro zero, and 3D read positions.
- `js/rolling-score.js`: rolling piano-roll canvas, brushes, note/gliss history, and visual assertions.
- `js/triangle.js`: white K/C-to-sieve leg overlay and gliss-line trajectory model.
- `js/sieve.js`: 49-cell pitch strip, active pitch glow, and sieve layout assertion.
- `js/state-ui.js`: overlay state rows, badges, K/C cards, algorithm UI, expression panel, and recent moves.
- `js/face-glyph.js`: shared FACE_SIG mirror of `src/face-gesture.ts` plus `paintFaceGlyph` painter. Consumed by `js/cube-scene.js` (six predictive ghost-cube face sprites, billboarded with face-normal back-face culling) and by `js/state-ui.js` (single retrospective glyph slot in the K/C card area).
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
- If a change touches pitch layout, gliss trajectories, note-chain classification, cross-module init wiring, or within-note dynamic rendering, re-audit the matching invariant row in `../docs/dashboard-invariants.md`.
- If a change touches canonical move remap, face geometry, snap/ghost orientation, ghost C identity motion, or top-face markers, audit the mirrored assumptions in `../relay.js`, `js/cube-scene.js`, `js/main.js`, and the matching dashboard invariant row.
- `dashboard.v1-monolith.html` is a reference artifact for A/B behavior checks, not the active implementation surface.

## Invariant hotspots

- Sieve layout / pitch axis: `js/sieve.js`, `js/rolling-score.js`, `css/main.css`
- Gliss sync and slide-vs-leap classification: `js/rolling-score.js`, `js/triangle.js`, `js/main.js`, `js/constants.js`
- Cross-module wiring: `js/main.js`
- Dynamic-trace rendering: `js/rolling-score.js`
- Canonical remap / ghost snap / walkable alpha ghost C identities / fixed beta ghost C geometry: `js/cube-scene.js`, `js/main.js`, `../relay.js`

## Manual verification

After dashboard changes, verify at `http://localhost:3000`:

- the rolling score renders,
- K/C cards remain visible,
- Zero Gyro still works,
- no dashboard invariant logs fire in the browser console,
- layout remains correct at 100% and 50% browser zoom.

## Targeted tests

- `../test/dashboard-ghost.test.ts`: static guard that beta-cosmo keeps ghost C geometry fixed in local slots, alpha-cosmo walks C identities by `state.cAssignments`, active C highlighting resolves from the active local slot in beta, and the alpha/beta dashboard toggle posts `set_mode.cosmology`.
- `../test/dashboard-mac-privacy.test.ts`: static guard that served dashboard surfaces do not hardcode, prefill, or persist cube MAC addresses.
- `../test/interruption-layer.test.ts`: static guard that the interruption layer stays feature-flagged, detachable, self-styled, and wired only through `js/main.js`.
