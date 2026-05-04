# `public/` Agent Guide

This guide applies to the browser dashboard under `public/`.

## Module contract

- `dashboard.html` is the HTML shell, not the logic container.
- `js/main.js` is the single entry point and the only place cross-module wiring should be obvious at a glance.
- `css/main.css` owns styling; `js/constants.js` owns shared immutable dashboard constants.
- The dashboard is native ES modules with no bundler and no browser-side TypeScript.

## Read before editing

- `../CLAUDE.md` dashboard architecture section
- `../docs/dashboard-invariants.md`
- `../docs/todo.md`

## Rules

- Preserve the Phase 2 split: no backsliding into a monolithic inline script.
- Keep cross-module dependencies narrow and explicit through `main.js` init callbacks. Avoid new direct imports that create circular knowledge between modules.
- Keep `midi_echo` fanout centralized in `js/main.js`. Do not scatter transport interpretation across unrelated modules.
- Keep CSS and JS mirrored constants in sync. In particular, `main.css` inset variables must agree with `js/constants.js`.
- If a change touches pitch layout, gliss trajectories, note-chain classification, cross-module init wiring, or within-note dynamic rendering, re-audit the matching invariant row in `../docs/dashboard-invariants.md`.
- `dashboard.v1-monolith.html` is a reference artifact for A/B behavior checks, not the active implementation surface.

## Invariant hotspots

- Sieve layout / pitch axis: `js/sieve.js`, `js/rolling-score.js`, `css/main.css`
- Gliss sync and slide-vs-leap classification: `js/rolling-score.js`, `js/triangle.js`, `js/main.js`, `js/constants.js`
- Cross-module wiring: `js/main.js`
- Dynamic-trace rendering: `js/rolling-score.js`

## Manual verification

After dashboard changes, verify at `http://localhost:3000`:

- the rolling score renders,
- K/C cards remain visible,
- Zero Gyro still works,
- no dashboard invariant logs fire in the browser console,
- layout remains correct at 100% and 50% browser zoom.
