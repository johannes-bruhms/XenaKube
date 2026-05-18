# XenaKube Agent Guide

Start with `CLAUDE.md`. It is the canonical current-state architecture brief for this repo. Use this file as the operating summary, then follow the nearest subtree `AGENTS.md` before editing code or docs in that area.

## Repo shape

XenaKube has three tightly-coupled implementation surfaces plus one bridge:

- `src/`: TypeScript composition engine, S4/group math, mappings, OSC schema, state machine.
- `public/`: browser dashboard modules and CSS.
- `max/`: Max/MSP + SWAM bridge, preset, and generated includes.
- `relay.js`: Node bridge between BLE/WebSocket clients and OSC targets.

The detailed rationale, invariants, and roadmap live in `docs/`.

## Required reading by task

- Any change: `CLAUDE.md`
- Engine / state / performance model: `src/AGENTS.md` and `docs/performance-model.md`
- OSC / shared mappings: `src/AGENTS.md`, `docs/osc-reference.md`, and any touched bridge/dashboard invariant row
- Dashboard / visuals: `public/AGENTS.md`, `docs/dashboard-architecture.md`, and `docs/dashboard-invariants.md`
- Max / SWAM / patch work: `max/AGENTS.md`, `docs/synthesis-bridge.md`, and `docs/bridge-invariants.md`
- Documentation edits: `docs/AGENTS.md` plus the owner doc for the changed behavior

## Commands

Run from the repo root unless a subtree guide says otherwise.

```bash
npm test
npm run test:watch
npx tsc --noEmit
npm run build
npm run gen:max
npm run check:doc-sizes
npm run check:agents
npm run check:docs
npx tsx relay.js      # dev/debug direct relay; performance starts from Max node.script relay-controller.js -> relay
npm run dev
```

## Global rules

- `src/osc-schema.ts` is the only source of truth for `/xk/*`, `/gan/*`, and `/xk/midi/*` addresses. Do not add raw address literals elsewhere.
- `src/swam-mapping.ts` and `src/face-gesture.ts` are shared mapping sources for TypeScript and Max. If either changes, regenerate `max/gen_includes.js` with `npm run gen:max`.
- Never hand-edit `max/gen_includes.js`. It is generated from `src/osc-schema.ts`, `src/swam-mapping.ts`, and `src/face-gesture.ts`.
- Keep the Max patch thin. New synthesis logic belongs in `max/xk_swam.js`, not in a growing web of patch objects.
- Keep `public/dashboard.html` structural. Dashboard logic belongs in `public/js/*.js`; styling belongs in `public/css/main.css`.
- Keep relay lifecycle single-path: last dashboard disconnect exits immediately by default, Max `stop relay` goes through relay's loopback shutdown API, and controller/script shutdown must not orphan a relay child.
- Recurrent bugs in this repo are usually silent-failure surfaces. Do not ship a local fix without the invariant or telemetry that proves the bug and guards it from returning.
- If code and docs diverge, fix the docs in the same change.
- The physical solved edge is a cosmology anchor: alpha-cosmo returns to beta-cosmo with the normal structural reset; already-beta sessions stay in place.

## Drift hygiene

Rules that keep `npm run check:docs` small. Full check definitions: `CLAUDE.md § Drift Detection`.

1. **Don't quote numeric constants by value in docs.** Refer by name; the `bang()` boot log in `max/xk_swam.js` is the authoritative surface for paired tunables. The constant-sync check fails on any unmatched literal that sits next to a tracked constant name.
2. **Every new file under `docs/` requires a Doc Maintenance row in `CLAUDE.md` in the same commit.** Orphan `*.md` → `npm run check:docs` fails.
3. **Every new `/xk/*` address goes through `src/osc-schema.ts` first**, then `npm run gen:max`, before any doc references it. The schema is the only source of address strings.
4. **Every dashboard ↔ bridge mirror constant** (`PORTAMENTO_MS_PER_SEMITONE` vs `COMPLEX[*].portamento.time`, `GLISS_SLIDE_MAX_DUR_MS` vs `MIN_GLISS_SPACING_MS - BEND_DUR_MARGIN_MS`) **must have a vitest equality test in `test/dashboard-bridge-sync.test.ts`.** Doc-side constant-sync can't catch table-vs-table drift inside code.
5. **No paired-tunable absolute number lives in two places.** Either codegen the second from the first (preferred — that's what `max/gen_includes.js` is for) or wire a runtime/test assertion that fails on mismatch.

## Documentation ownership

- `CLAUDE.md`: canonical current-state architecture, file roles, commands, and invariant summaries. Keep it present-tense and non-historical.
- `AGENTS.md` + subtree `AGENTS.md`: repo-local operating instructions distilled from `CLAUDE.md`, the detailed docs, and the live code layout.
- `CHANGELOG.md`: dated, user-visible/project-visible changes.
- `docs/todo.md`: phased roadmap (dashboard, solve-anchor, phrase library, TS phrase migration).
- `docs/revision_roadmap.md`: bridge / SWAM diagnoses and synthesis-side phase work.
- `docs/research_notes.md`: rationale, source notes, and design exploration.
- `docs/bridge-invariants.md`: full bridge invariant enforcement detail.
- `docs/dashboard-invariants.md`: full dashboard invariant enforcement detail.
- `docs/dashboard-architecture.md`: browser dashboard module layout, cross-module reads, overlay positioning, and brush rendering.
- `docs/spectrogram_roadmap.md`: optional actual-audio spectrogram feature roadmap.
- `docs/interruption-layer-plan.md`: optional interruption-layer design and first-draft verification notes.
- `docs/performance-model.md`: musical / structural model, core turn loop, modes, algorithm book, expression mapping, and key math.
- `docs/osc-reference.md`: OSC address table and routing notes.
- `docs/synthesis-bridge.md`: Max patch topology, bridge file roles, and SWAM routing notes.
- `docs/sphere-engine.md`: gamelan sphere-engine reference (instrument inventory, tunings, mandala-cosmo K→sphere mapping, mandala canvas, D75–D78 + D80–D83).
- `docs/swam/swam_cello_reference.md`: authoritative SWAM parameter, CC, and keyswitch reference.
- `docs/xenakis_nomos_alpha_primary_source.md`: Xenakis primary source excerpt for the cube model.
- `docs/xenakube-operation-manual.md`: performer-facing operation manual and face/complex behavior reference.
- `docs/xenakube-feedback-04302026.md`: dated artistic feedback/reference notes; not a current-behavior spec unless another doc promotes a point from it.
- `README.md`: user-facing setup and overview.

If you add or rename a durable workflow doc, update this list and the matching table in `CLAUDE.md`.

## AGENTS sync triggers

Reflect these changes in the nearest `AGENTS.md` in the same change. `npm run check:agents` enforces the file/script/test coverage mechanically; use this list for the semantic cases the script cannot infer.

- **Repo shape**: top-level surfaces, bridges, generated outputs, or support folders are added, removed, or renamed.
- **Subtree scope**: a subtree guide starts or stops owning a class of files, workflows, or invariants.
- **Durable docs**: a durable workflow/reference doc is added, renamed, retired, or changes ownership.
- **Commands**: `package.json` scripts, required local commands, manual verification steps, or build/test expectations change.
- **Source-of-truth files**: OSC schema, shared mappings, face signatures, generators, presets, or generated-file rules change.
- **Engine semantics**: turn loop, cosmology boundary, K/C assignment, orientation/read-head logic, motion/dwell, turn-rate pressure, algorithms, phrase planning, or phrase audit behavior changes.
- **OSC payloads**: address names, payload order, payload meaning, routing ports, or `/xk/midi/*` echo semantics change.
- **Dashboard architecture**: module boundaries, cross-module callbacks, CSS/JS mirrored constants, visual invariant ownership, or manual browser verification changes.
- **Max bridge**: patch topology, SWAM preset assumptions, single-instance model, generated include usage, bridge invariants, telemetry, or live-patch workflow changes.
- **Cross-surface assumptions**: canonical move remap, dashboard/relay/Max mirrored constants, phrase-plan IDs, latency telemetry, or any other rule spanning two implementation surfaces changes.
- **Tests and verification**: targeted tests, static guards, manual checks, or required command order changes.
- **Recurring-bug/invariant discipline**: silent-failure policy, invariant-first workflow, or telemetry expectations change.

## Change checklists

### Engine / shared mapping changes

- Update or add tests under `test/`.
- Update `docs/performance-model.md` when the turn loop, cosmology boundary, algorithm behavior, orientation math, scramble, motion, or expression semantics change.
- Update `docs/osc-reference.md` when OSC addresses or payloads change.
- Audit `relay.js`, `public/js/*`, and `max/xk_swam.js` for mirrored assumptions if payloads, mappings, or timing semantics changed.
- Run `npm run gen:max` after changes to `src/osc-schema.ts`, `src/swam-mapping.ts`, or `src/face-gesture.ts`.

### Dashboard changes

- Check `docs/dashboard-architecture.md` for module/export/callback drift.
- Re-audit every touched row in `docs/dashboard-invariants.md`.
- Preserve the cross-module callback wiring in `public/js/main.js`.
- Manually verify `http://localhost:3000` at 100% and 50% browser zoom.

### Max / SWAM changes

- Re-audit every touched row in `docs/bridge-invariants.md`.
- Keep `PITCHBEND_RANGE_SEMI` aligned with the loaded SWAM preset.
- Reload the `v8` object after regenerating `max/gen_includes.js`.

### Documentation changes

- Keep summaries in `CLAUDE.md`; keep deep enforcement details in `docs/bridge-invariants.md` and `docs/dashboard-invariants.md`.
- Put dated narrative in `CHANGELOG.md` or `docs/revision_roadmap.md`, not in `CLAUDE.md`.
- Run `npm run check:docs` if `CLAUDE.md` or invariant summary rows are in scope.

## Existing Claude-specific helper

`.claude/agents/max-patch.md` already exists for live Max patch inspection and mutation through the Max MCP bridge. Use it for live patch work; use `max/AGENTS.md` for file-level rules and invariants.
