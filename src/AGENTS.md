# `src/` Agent Guide

This guide applies to the TypeScript engine and shared mapping/schema code under `src/`.

## Canonical files

- `osc-schema.ts`: only source of truth for OSC addresses and MIDI echo addresses.
- `swam-mapping.ts`: shared SWAM tables and pure helpers used by both TypeScript and Max codegen.
- `face-gesture.ts`: 12 face-identity signatures consumed by both TypeScript and Max codegen.
- `phrase-plan.ts`: TypeScript shadow source for C1-C8 phrase structure during the Max-to-TS migration.
- `phrase-audit.ts`: planned-vs-actual phrase echo comparator; this is the invariant seam for dropped/late Max phrase events.
- `engine.ts`: orchestration layer tying moves, gyro, cubes, algorithms, and voice output together.
- `corner-topology.ts`: performer-visible 8-corner K_i permutation; physical face turns are the only live topology mutations.
- `scramble.ts`: exact precomputed quarter-turn distance over all visible 8-corner permutations.
- `index.ts`: public export surface consumed by `relay.js`.

## Rules

- Do not add raw `/xk/*`, `/gan/*`, or `/xk/midi/*` string literals outside `osc-schema.ts`.
- Keep shared helper logic in `swam-mapping.ts` pure and testable. Max-specific stateful wrappers belong in `max/xk_swam.js`, not here.
- Preserve the alpha/beta cosmology boundary. In `beta-cosmo`, only physical corner turns and tracked-corner selection may change visible K topology; K/C diagrams and C gyro remain shadow metadata. In `alpha-cosmo`, the historical S4 walks deliberately drive K/C assignments.
- If you change `osc-schema.ts`, `swam-mapping.ts`, or `face-gesture.ts`, run `npm run gen:max` from the repo root and review the resulting `../max/gen_includes.js`.
- If you change payload shapes, timing semantics, mapping tables, or face-signature meaning, audit these consumers:
  - `../relay.js`
  - `../public/js/*.js`
  - `../max/xk_swam.js`

## Tests

Run the full suite with `npm test`. The most relevant targeted guards live in:

- `../test/engine.test.ts`
- `../test/face-gesture.test.ts`
- `../test/swam-mapping.test.ts`
- `../test/phrase-plan.test.ts`
- `../test/phrase-audit.test.ts`
- `../test/cube-algorithm.test.ts`

## Docs to update when semantics change

- `../CLAUDE.md`
- `../docs/osc-reference.md`
- `../docs/research_notes.md`
- `../docs/revision_roadmap.md`

If a change affects generated Max data, also update the change note in `../CHANGELOG.md`.
