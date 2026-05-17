# Interruption Layer First-Draft Plan

This document records the optional performance overlay boundary. It is current only when the dashboard enables `?intrusions=1`; the default dashboard behavior remains unchanged.

## Summary

Build an optional, detachable dashboard overlay module that can show crisis/war footage, comfort footage, and a targeting-style triangle without changing the core XenaKube engine, OSC bridge, rolling score, sieve, or existing triangle behavior.

The first draft should prioritize clean enable/disable behavior, visible debug controls, deterministic pressure/rate behavior, video playback, solved-state comfort override, and a separate targeting overlay. It should not attempt ML missile tracking or invasive integration with `triangle.js`.

## Implementation Notes

- `public/interruption/index.js`: runtime, state machine, generated/video playback, debug controls, targeting canvas, injected styles, and DOM cleanup.
- `public/interruption/config.js`: first-draft pressure, threshold, duration, opacity, and generated-stream tunables.
- `public/interruption/clips.js`: local clip manifest. The committed entries use `generated:*` placeholder streams; real footage can replace `src` values locally.
- `public/js/main.js`: only import/fanout boundary. It passes cube-scene projection callbacks, state, algorithm, solve, MIDI panic, reset, and disconnect events.

## Key Changes

- Add a new self-contained browser module directory, preferably `public/interruption/`, owning all footage logic, styles, clip metadata, DOM nodes, timers, keyboard shortcuts, and debug UI.
- Wire the module only from `public/js/main.js`, behind a feature flag:
  - `?intrusions=1` enables it.
  - `?intrusions=0` disables it.
  - Default: disabled.
- Do not edit existing dashboard modules except for narrow event fanout from `main.js`.
- The module should expose one small API:
  - `initInterruptionLayer({ enabled, root, getCamera, getActiveKWorldPos, getCWorldPos })`
  - `onState(data, move)`
  - `onAlgorithm(event)`
  - `onSolve()`
  - `onMidiEcho(data)` optional/read-only
  - `onPanic()`
  - `destroy()`
- The module should create and remove all of its own DOM:
  - fixed video layer
  - fixed canvas targeting overlay
  - optional debug panel
  - optional injected/scoped stylesheet

## Implementation Behavior

- Implement a pressure/state-machine model:
  - States: `disabled`, `clean`, `armed`, `glimpse`, `leak`, `targeting`, `takeover`, `comfort`, `residue`, `cooldown`.
  - First 2 minutes after module start are `clean`.
  - After that, pressure can trigger war/crisis clips.
  - `sexy move` immediately cancels active war/crisis footage, drops pressure, and enters cooldown.
  - `solve` immediately overrides any active intrusion and enters `comfort`.
  - `panic`, reset, and disconnect clear video, overlay, pressure transients, and timers.
- Implement pressure as `0..1`:
  - rises with elapsed time after clean period, turn activity, repeated movement, and scramble if available in state
  - falls with stillness, sexy move, solved state, and manual clear
  - first-draft constants should live in `config.js`, not scattered through code
- Implement clip metadata through a local manifest:
  - `id`, `src`, `category`, `start`, `end`, `target`, `intensity`, `tags`, `allowImpact`
  - war/crisis target defaults to `{ x: 0.5, y: 0.5 }`
  - comfort clips do not need target metadata
- Implement video modes:
  - `glimpse`: sub-second low-opacity flash
  - `leak`: low/medium-opacity footage under dashboard overlays
  - `targeting`: video plus targeting triangle lock
  - `takeover`: high-opacity footage dominating view
  - `comfort`: solved-state comfort footage with softer opacity and no hard target lock
  - `residue`: video hidden, targeting geometry fades out
- Implement a separate targeting triangle canvas:
  - points A/B come from projecting active K and nearest C using `cubeScene.getActiveKWorldPos`, `cubeScene.getCWorldPos`, and `cubeScene.getCamera`
  - point C comes from current clip target metadata mapped into video bounds
  - target behavior phases: `search`, `acquire`, `lock`, `break`, `relax`
  - do not modify `public/js/triangle.js` in the first draft
- Implement debug controls:
  - `I`: toggle enabled
  - `D`: toggle debug panel
  - `W`: force war/crisis intrusion
  - `C`: force comfort
  - `X`: clear active intrusion
  - `[` / `]`: decrease/increase pressure
  - `T`: toggle target overlay
- Debug panel shows:
  - enabled flag
  - current state
  - pressure
  - current clip id/category
  - clip time
  - cooldown
  - last trigger reason
  - solved flag
  - target x/y

## Documentation And Isolation

- Update dashboard docs only when the module becomes an implemented dashboard boundary:
  - `docs/dashboard-architecture.md`: describe the interruption layer as an optional overlay wired only through `main.js`.
  - `docs/dashboard-invariants.md`: note that the first draft must not participate in existing gliss/pitch/sieve invariants and must not alter existing triangle/rolling-score behavior.
  - `CLAUDE.md`: add only a terse pointer if the module becomes durable current architecture.
  - `CHANGELOG.md`: add a dated user-visible entry when implementation lands.
- Keep all media in an ignored or clearly isolated directory if footage should not be committed. If media is committed, use small placeholder clips for the repo and keep real performance footage local.
- The first draft must be removable by deleting `public/interruption/` and removing the `main.js` import/init/fanout lines.

## Test Plan

- Run `npm test`.
- Run `npx tsc --noEmit`.
- Run `npm run build`.
- Manually verify dashboard with `?intrusions=0`:
  - no interruption DOM remains visible
  - rolling score renders
  - existing white triangle works
  - active K/C labels merge into the K/C cards after a phrase trigger
  - no new console warnings/errors
- Manually verify dashboard with `?intrusions=1&intrusionDebug=1`:
  - first 2 minutes stay clean unless forced with debug key
  - `W` forces war/crisis video
  - `X` clears it
  - `C` forces comfort
  - `D` toggles debug panel
  - `T` toggles targeting overlay
  - `sexy move` clears active war/crisis intrusion
  - solved-state event enters comfort
  - panic/reset clears all interruption visuals
- At 100% and 50% browser zoom, verify:
  - interruption layer does not resize or shift existing UI
  - targeting overlay aligns to viewport/video bounds
  - existing dashboard invariant logs do not fire

## Assumptions And Defaults

- First draft is browser-only and does not touch `src/`, `max/`, OSC schema, relay routing, or SWAM behavior.
- Default is disabled unless `?intrusions=1` is present.
- No ML/object detection in the first draft; target is metadata-centered.
- Real missile tracking is deferred. Launch paths may be faked later with clip/path metadata.
- The first draft uses an independent targeting triangle overlay instead of reusing or mutating the existing white-line triangle module.
- The module is a performance overlay, not a permanent change to the core dashboard aesthetic.
