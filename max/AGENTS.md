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
- `xenakube_2.swam`: SWAM preset expected by the patch.
- `gen_includes.js`: generated shared data from `src/`.
- `ks_logger.js`: optional debugging helper for keyswitch/MIDI inspection.

## Live patch work

For live Max patch inspection or mutation through MCP, use the existing Claude subagent definition at `../.claude/agents/max-patch.md`. For normal file edits, keep the patch and the docs in sync without depending on live-state assumptions.
