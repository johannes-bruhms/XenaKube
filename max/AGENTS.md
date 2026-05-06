# `max/` Agent Guide

This guide applies to the Max/MSP and SWAM bridge files under `max/`.

## Read before editing

- `../CLAUDE.md`
- `../docs/synthesis-bridge.md`
- `../docs/bridge-invariants.md`
- `../docs/swam/swam_cello_reference.md`

## Architecture boundary

The live performance patch is intentionally thin:

```text
[udpreceive 57121] -> [v8 xk_swam.js @autowatch 1] -> [vst~ "SWAM Cello 3"] -> DSP -> [dac~]
                                            outlet 1 -> debug / print
                                            outlet 2 -> MIDI echo back to relay on 57122
                                            outlet 3 -> detected face / algorithm events
```

Prefer editing `xk_swam.js` over growing patch logic. The patch is the host; `xk_swam.js` is the bridge.

## Rules

- `gen_includes.js` is generated. Never hand-edit it.
- If `../src/osc-schema.ts`, `../src/swam-mapping.ts`, or `../src/face-gesture.ts` change, run `npm run gen:max` from the repo root and reload the `v8` script.
- Keep the single-instance SWAM model intact unless you are deliberately re-architecting polyphony. `POOL_SIZE = MAX_ACTIVE = 1` is an intentional musical and technical constraint, not an accident.
- Treat gliss, selector state, bow polyphony, expression arcs, and pitchbend alignment as silent-failure surfaces. Preserve or add runtime telemetry when changing them.
- `PITCHBEND_RANGE_SEMI` in `xk_swam.js` must exactly match the loaded SWAM preset.
- If you change keyswitch numbers, CC mapping, or preset assumptions, update both the code and the relevant documentation.

## Files

- `xk_swam.js`: main bridge logic and invariants.
- `xenakube_swam.maxpat`: host patch.
- `xenakube_main.swam`: SWAM preset expected by the patch (loaded by `xenakube_swam.maxpat` on `[loadbang]`).
- `gen_includes.js`: generated shared data from `src/`.
- `ks_logger.js`: optional debugging helper for keyswitch/MIDI inspection.
- `onehot.js`: v8 helper used by the host patch.
- `relay-controller.js`: Max-side helper for relay control workflows. `script start` launches only the controller; `relay` / `start relay` starts `relay.js` as a child process. It exposes explicit `kill process` / `kill_process` Max messages for killing a stale port-3000 listener; do not auto-start or auto-kill the relay from script start.
- `package.json` / `package-lock.json`: local Node dependency metadata for Max support helpers.
- `max_mcp.js`, `max_mcp_node.js`, `max_mcp_v8_add_on.js`: Max MCP bridge support files.
- `demo.maxpat`, `derivations.maxpat`, `polish.maxpat`: reference/experimental Max patches, not the active performance host.
- `erosion.gendsp`: supporting Gen patch/reference artifact.
- `xenakube_2.swam`, `xenakube_main2.swam`: alternate SWAM presets; do not assume they are loaded by `xenakube_swam.maxpat`.

## Tests

- Run `npm test -- --run test/max-bridge.test.ts` for changes to `xk_swam.js` bridge invariants that can be statically guarded.
- Run the full `npm test` when Max behavior depends on shared TypeScript mapping, phrase planning, OSC schema, or generated include changes.

## Live patch work

For live Max patch inspection or mutation through MCP, use the existing Claude subagent definition at `../.claude/agents/max-patch.md`. For normal file edits, keep the patch and the docs in sync without depending on live-state assumptions.
