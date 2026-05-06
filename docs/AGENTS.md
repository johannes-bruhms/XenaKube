# `docs/` Agent Guide

This guide applies to the documentation tree under `docs/`.

## Documentation roles

- `../CLAUDE.md`: canonical current-state summary. Keep it present-tense and terse.
- `../AGENTS.md` + subtree guides: agent operating instructions derived from `CLAUDE.md`, the detailed docs, and the code layout.
- `todo.md`: phased roadmap (dashboard, solve-anchor, phrase library, TS phrase migration).
- `revision_roadmap.md`: bridge/SWAM diagnoses, D-codes, and synthesis-side progress.
- `research_notes.md`: rationale, source notes, and design exploration.
- `bridge-invariants.md`: full bridge invariant enforcement detail.
- `dashboard-invariants.md`: full dashboard invariant enforcement detail.
- `dashboard-architecture.md`: browser dashboard module layout, cross-module reads, overlay positioning, and brush rendering.
- `interruption-layer-plan.md`: optional interruption-layer design and first-draft verification notes.
- `performance-model.md`: musical / structural model, core turn loop, voice / engine modes, algorithm book, expression mapping, and key math.
- `osc-reference.md`: OSC address and routing reference.
- `synthesis-bridge.md`: Max patch topology, bridge file roles, and routing notes.
- `swam/swam_cello_reference.md`: authoritative SWAM parameter, CC, and keyswitch reference.
- `xenakis_nomos_alpha_primary_source.md`: primary-source excerpt for Xenakis' cube model.
- `xenakube-operator-manual.md`: performer-facing manual and face/complex behavior reference.
- `xenakube-feedback-04302026.md`: dated artistic feedback/reference notes; do not treat as current behavior unless promoted into current docs.
- `../README.md`: user-facing setup and project overview.

## Rules

- Fix stale statements instead of piling disclaimers on top of them.
- Keep `CLAUDE.md` free of dated narrative and implementation-history sprawl. Put that material in `../CHANGELOG.md` or `revision_roadmap.md`.
- If you add or change an invariant:
  - update the summary table in `../CLAUDE.md`,
  - update the full row in `bridge-invariants.md` or `dashboard-invariants.md`,
  - update any related command/reference docs.
- If you add or change OSC addresses, verify `osc-reference.md` against `../src/osc-schema.ts`.
- If you change dashboard module boundaries, callback wiring, overlay layout, or brush rendering, update `dashboard-architecture.md`.
- If you change the turn loop, cosmology boundary, algorithm behavior, orientation math, expression model, or key math, update `performance-model.md`.
- Keep roadmap items in `todo.md` and long-form rationale in `research_notes.md`; do not blur those roles.
- Run `npm run check:docs` when `../CLAUDE.md` or invariant summary rows are in scope.

## Supporting folders

- `swam/`: authoritative SWAM references and screenshots.
- `presentation/`: score legend and dashboard reference imagery.
- `archived/`: superseded assets and references kept for history, not current behavior.

Update `../CHANGELOG.md` when documentation changes materially affect how contributors or agents should work in the repo.
