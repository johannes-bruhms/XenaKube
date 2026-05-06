# `src/` Agent Guide

This guide applies to the TypeScript engine and shared mapping/schema code under `src/`.

## Canonical files

- `osc-schema.ts`: only source of truth for OSC addresses and MIDI echo addresses.
- `swam-mapping.ts`: shared SWAM tables and pure helpers used by both TypeScript and Max codegen.
- `face-gesture.ts`: 12 face-identity signatures consumed by both TypeScript and Max codegen.
- `phrase-plan.ts`: TypeScript shadow source for C1-C8 phrase structure during the Max-to-TS migration.
- `phrase-audit.ts`: planned-vs-actual phrase echo comparator; this is the invariant seam for dropped/late Max phrase events.
- `engine.ts`: orchestration layer tying moves, gyro, cubes, algorithms, and voice output together.
- `complexes.ts`: C1-C8 assignment tables and alpha/beta/gamma phase behavior.
- `corner-topology.ts`: performer-visible 8-corner K_i permutation; physical face turns are the only live topology mutations.
- `orientation.ts`: top-face anchored read-head selection for beta-cosmo.
- `scramble.ts`: exact precomputed quarter-turn distance over all visible 8-corner permutations.
- `turn-rate.ts`: turn-rate regime and bounded pressure tracking.
- `motion.ts`: still-state and dwell tracking from calibrated gyro poses.
- `cube-algorithm.ts`: orientation-independent Rubik's algorithm book and matcher.
- `expression.ts`: normalized gyro/deviation/scramble expression state.
- `group.ts`: S4 rotations, Cayley table, diagrams, tetra orbit math, and whole-cube rotation helpers.
- `kinematic.ts`: S4 path/diagram helpers for the historical walk layer.
- `mode-manager.ts`: mode state and algorithm-effect dispatch boundary.
- `osc-output.ts`: schema-backed OSC message construction from engine state and voice output.
- `quaternion.ts`: quaternion math and S4 snap/deviation helpers.
- `sieve.ts`: L(m,n) pitch set and metabola state.
- `types.ts`: shared public types for engine state, modes, voices, and expressions.
- `vertices.ts`: K_i density/intensity/base-duration material table.
- `voice-engine.ts`: sequential/polyphonic voice selection and face-stamped voice events.
- `index.ts`: public export surface consumed by `relay.js`.

## Rules

- Do not add raw `/xk/*`, `/gan/*`, or `/xk/midi/*` string literals outside `osc-schema.ts`.
- Keep shared helper logic in `swam-mapping.ts` pure and testable. Max-specific stateful wrappers belong in `max/xk_swam.js`, not here.
- Preserve the alpha/beta cosmology boundary. In `beta-cosmo`, physical corner turns own visible K topology, the active read-head is the turned face's head-on top-right corner, and C identities are fixed local slots (`slot i -> C{i+1}`); gyro chooses the current top face only. K/C diagrams remain shadow metadata. In `alpha-cosmo`, the historical S4 walks deliberately drive K/C assignments.
- If you change orientation, visible-corner topology, canonical move semantics, or gyro snap semantics, audit `../relay.js`, `../public/js/cube-scene.js`, `../public/js/main.js`, and the matching dashboard invariant rows.
- If you change `osc-schema.ts`, `swam-mapping.ts`, or `face-gesture.ts`, run `npm run gen:max` from the repo root and review the resulting `../max/gen_includes.js`.
- If you change payload shapes, timing semantics, mapping tables, or face-signature meaning, audit these consumers:
  - `../relay.js`
  - `../public/js/*.js`
  - `../max/xk_swam.js`

## Tests

Run the full suite with `npm test`. The most relevant targeted guards live in:

- `../test/engine.test.ts`
- `../test/corner-topology.test.ts`
- `../test/orientation.test.ts`
- `../test/motion.test.ts`
- `../test/turn-rate.test.ts`
- `../test/scramble.test.ts`
- `../test/group.test.ts`
- `../test/cube-algorithm.test.ts`
- `../test/face-gesture.test.ts`
- `../test/swam-mapping.test.ts`
- `../test/phrase-plan.test.ts`
- `../test/phrase-audit.test.ts`

## Docs to update when semantics change

- `../CLAUDE.md`
- `../docs/performance-model.md`
- `../docs/osc-reference.md`
- `../docs/research_notes.md`
- `../docs/revision_roadmap.md`
- `../docs/bridge-invariants.md` or `../docs/dashboard-invariants.md` when an invariant claim, enforcement site, or telemetry changes.

If a change affects generated Max data, also update the change note in `../CHANGELOG.md`.
