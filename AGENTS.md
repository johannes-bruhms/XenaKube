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
- Engine / OSC / mappings: `src/AGENTS.md`
- Dashboard / visuals: `public/AGENTS.md` and `docs/dashboard-invariants.md`
- Max / SWAM / patch work: `max/AGENTS.md` and `docs/bridge-invariants.md`
- Documentation edits: `docs/AGENTS.md`

## Commands

Run from the repo root unless a subtree guide says otherwise.

```bash
npm test
npx tsc --noEmit
npm run build
npm run gen:max
npx tsx relay.js
npm run dev
```

## Global rules

- `src/osc-schema.ts` is the only source of truth for `/xk/*`, `/gan/*`, and `/xk/midi/*` addresses. Do not add raw address literals elsewhere.
- `src/swam-mapping.ts` and `src/face-gesture.ts` are shared mapping sources for TypeScript and Max. If either changes, regenerate `max/gen_includes.js` with `npm run gen:max`.
- Never hand-edit `max/gen_includes.js`. It is generated from `src/osc-schema.ts`, `src/swam-mapping.ts`, and `src/face-gesture.ts`.
- Keep the Max patch thin. New synthesis logic belongs in `max/xk_swam.js`, not in a growing web of patch objects.
- Keep `public/dashboard.html` structural. Dashboard logic belongs in `public/js/*.js`; styling belongs in `public/css/main.css`.
- Recurrent bugs in this repo are usually silent-failure surfaces. Do not ship a local fix without the invariant or telemetry that proves the bug and guards it from returning.
- If code and docs diverge, fix the docs in the same change.

## Documentation ownership

- `CLAUDE.md`: canonical current-state architecture, file roles, commands, and invariant summaries. Keep it present-tense and non-historical.
- `AGENTS.md` + subtree `AGENTS.md`: repo-local operating instructions distilled from `CLAUDE.md`, the detailed docs, and the live code layout.
- `CHANGELOG.md`: dated, user-visible/project-visible changes.
- `docs/todo.md`: phased roadmap (dashboard, solve-anchor, phrase library, TS phrase migration).
- `docs/revision_roadmap.md`: bridge / SWAM diagnoses and synthesis-side phase work.
- `docs/research_notes.md`: rationale, source notes, and design exploration.
- `docs/bridge-invariants.md`: full bridge invariant enforcement detail.
- `docs/dashboard-invariants.md`: full dashboard invariant enforcement detail.
- `docs/osc-reference.md`: OSC address table and routing notes.
- `docs/synthesis-bridge.md`: Max patch topology, bridge file roles, and SWAM routing notes.
- `docs/swam/swam_cello_reference.md`: authoritative SWAM parameter, CC, and keyswitch reference.
- `README.md`: user-facing setup and overview.

If you add or rename a durable workflow doc, update this list and the matching table in `CLAUDE.md`.

## Change checklists

### Engine / shared mapping changes

- Update or add tests under `test/`.
- Audit `relay.js`, `public/js/*`, and `max/xk_swam.js` for mirrored assumptions if payloads, mappings, or timing semantics changed.
- Run `npm run gen:max` after changes to `src/osc-schema.ts`, `src/swam-mapping.ts`, or `src/face-gesture.ts`.

### Dashboard changes

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

## Existing Claude-specific helper

`.claude/agents/max-patch.md` already exists for live Max patch inspection and mutation through the Max MCP bridge. Use it for live patch work; use `max/AGENTS.md` for file-level rules and invariants.
