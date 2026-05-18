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
- Keep normal phrase first main noteons immediate (`t=0`) and mirrored in `../src/phrase-plan.ts`; C6's first ordered slide uses its own immediate first-gliss constant, while later slides may keep humanized timing.
- Keep C2 tempo constants mirrored with `../src/phrase-plan.ts`. `C2_RATE_MAX` is the final post-factor note-on cap, so do not add a later C2 density multiplier after `buildC2Tempo()`.
- `PITCHBEND_RANGE_SEMI` in `xk_swam.js` must exactly match the loaded SWAM preset.
- If you change keyswitch numbers, CC mapping, or preset assumptions, update both the code and the relevant documentation.

## Files

- `xk_swam.js`: main bridge logic and invariants.
- `xk_sphere.js`: sibling v8 for the gamelan sphere engine. Receives `/xk/sphere/*` from relay (mandala-cosmo only), dispatches `polybuffer~` reads on `bang()` and per-strike `groove~` plays via routed outlets. Owns D75–D78 runtime invariants on the sphere side. Patch additions live in `xenakube_swam.maxpat` (build via `max-patch` subagent — confirm before any MCP mutation).
- `xk_spectrum.js`: optional v8 helper for formatting Max-side FFT analysis as `/xk/spectrum/frame`; used by `pfft-test.maxpat` and the toggle-gated analyzer block in `xenakube_swam.maxpat`.
- `xenakube_swam.maxpat`: host patch.
- `xenakube_main.swam`: SWAM preset expected by the patch (loaded by `xenakube_swam.maxpat` on `[loadbang]`).
- `media/`: Max-local media assets. `media/gamelan/` holds the Latent Sonorities `.wav` samples and Scala references consumed by `xk_sphere.js`; from the repo root, regenerate `src/gamelan-manifest.ts` with `node scripts/build-gamelan-manifest.mjs` after sample adds/removes, then run `npm run gen:max`.
- `gen_includes.js`: generated shared data from `src/` for `xk_swam.js`.
- `gen_sphere_includes.js`: GENERATED — `xk_sphere.js`'s data table (OSC subset, full gamelan sample manifest, tuning hash). Regen via `npm run gen:max`; never hand-edit. Mirrors `src/gamelan-manifest.ts` + `src/gamelan-tuning.ts`.
- `ks_logger.js`: optional debugging helper for keyswitch/MIDI inspection.
- `onehot.js`: v8 helper used by the host patch.
- `relay-controller.js`: Max-side helper for relay control workflows. `script start` launches only the controller; `relay` / `start relay` starts `relay.js` as a child process. `stop relay` asks relay's loopback `/api/shutdown` to flush and exit, then force-kills on timeout. `kill process` / `kill_process` kills the known child and any stale port-3000 listener. Controller exit must not orphan the relay child; do not auto-start or auto-kill the relay from script start.
- `package.json` / `package-lock.json`: local Node dependency metadata for Max support helpers.
- `max_mcp.js`, `max_mcp_node.js`, `max_mcp_v8_add_on.js`: Max MCP bridge support files.
- `demo.maxpat`, `derivations.maxpat`, `polish.maxpat`, `rave.maxpat`: reference/experimental Max patches, not the active performance host.
- `pfft-test.maxpat`: live pfft spectrogram test patch; it mirrors the optional analyzer sender used by the performance host for local analyzer testing.
- `xk_pfft_spectrum.maxpat`: `pfft~` subpatch loaded by `pfft-test.maxpat`; writes FFT magnitudes into `buffer~ xk_fft_mag`.
- `painting.wav`: local audio asset for Max/spectrogram playback or capture checks; do not treat it as generated bridge code.
- `erosion.gendsp`: supporting Gen patch/reference artifact.
- `xenakube_2.swam`, `xenakube_main2.swam`: alternate SWAM presets; do not assume they are loaded by `xenakube_swam.maxpat`.

## Tests

- Run `npm test -- --run test/max-bridge.test.ts` for changes to `xk_swam.js` bridge invariants that can be statically guarded.
- Run the full `npm test` when Max behavior depends on shared TypeScript mapping, phrase planning, OSC schema, or generated include changes.

## Live patch work

For live Max patch inspection or mutation through MCP, use the existing Claude subagent definition at `../.claude/agents/max-patch.md`. For normal file edits, keep the patch and the docs in sync without depending on live-state assumptions.
