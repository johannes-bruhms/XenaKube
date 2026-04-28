# Synthesis Bridge — Max/MSP + SWAM Cello

Detailed reference for the synthesis layer: SWAM Cello 3 (Audio Modeling physical-modeling VST) driven via MIDI from a Max/MSP bridge on port 57121. **The load-bearing summary lives in CLAUDE.md as the Bridge Invariants table** — that's the part Claude must apply on every change. This file is the deep reference: patch topology, file roles, mapping cheat sheet, MCP bridge integration. Read when you're touching `max/xk_swam.js`, the `.maxpat`, the SWAM preset, or any of the per-complex routing.

## Single-instance model

One `[vst~ "SWAM Cello 3"]` downstream of the v8. Each `/xk/voice` renders its full gesture into that one plugin; a new voice hard-steals the current one (CC 11 = 0 + CC 120 + CC 123 + tracked noteOffs). Reason: SWAM's Ambiente panel auto-registers every loaded VST instance as a reverb source regardless of which ones receive MIDI, summing identical sources into audible phase overlap — pooled instances sound like multiple cellos even when only some receive MIDI. Single-instance also drops Max DSP CPU ~8×.

`POOL_SIZE = MAX_ACTIVE = 1` in `xk_swam.js`. The allocator / `stealInstance` / `makeInstance` machinery is retained as the per-voice bookkeeping anchor (every phrase generator takes `inst` as first arg, reads its `ccCache` / `activeNotes` / `phraseTasks` / face snapshots / status). To re-enable polyphony: raise both constants, add `[poly~ swam_voice @voices N]`, and re-add `outlet(MIDI_OUTLET, "target", inst.voice)` before the `midievent` emit in `emitMidi`.

## Patch Topology

Runtime patch: `max/xenakube_swam.maxpat` (open in Max 9+).

```
[udpreceive 57121] → [gate] → [v8 xk_swam.js @autowatch 1] → outlet 0 → [vst~ "SWAM Cello 3"] → DSP chain → [dac~]
                                                             outlet 1 → (debug — attach [print xk_swam])
                                                             outlet 2 → [udpsend 127.0.0.1 57122]   (MIDI echo to relay)
                                                             outlet 3 → (detected moves — `face <L|L'|...>` per quarter-turn, `spell <name>` per algorithm match; wire to [route face spell])

[loadbang] ┬── [max_active 1] → v8 inlet
           └── [read xenakube_2.swam] → [vst~]
```

DSP chain after `[vst~]`: `[abl.dsp.compander~ @shape 0.15] → [live.gain~] → [abl.device.drumbuss~] → [abl.dsp.compander~ @shape 0.2] → [abl.device.limiter~] → [dac~]`, with a `[live.scope~]` tap. The `[gate]` between `udpreceive` and the v8 lets the performer mute incoming OSC for offline inspection without closing the relay.

The MIDI echo on outlet 2 emits pre-formatted OSC `/xk/midi/{noteon,noteoff,panic}` messages — no `[prepend]` or `[route]` needed; `udpsend` packages them natively. Echo payload is `(voice, pitch, velocity, complex)` where `complex` is `inst.activeComplex` at echo time; the dashboard piano-roll uses it for color and gliss-curve rules.

The SWAM instance's preset is set manually inside the SWAM GUI (saved as `xenakube_2`).

## `max/` Directory

| File | Role |
|------|------|
| `xk_swam.js` | v8 object: OSC → midievent into a single downstream `[vst~]`. Voice allocator + `stealInstance` (cancels phrase tasks, CC 11 = 0, CC 120, CC 123, noteOff tracked pitches); per-instance bookkeeping (`ccCache`, `activeNotes`, `phraseTasks`, `releaseTask`, `ccRampTasks`, `ksPending`, selector cache, voice-shot snapshots of intensity / density / duration / path / transpose / tetra / face*, IDLE → PLAYING → RELEASING → IDLE lifecycle); phrase generators `phraseC1..C8`; selector helpers (`setPlayMode` / `setHarmonics` / `setTremolo` / `setBowPolyphony` / `setEnum`); scheduling primitives (`scheduleAt` / `scheduleRelease` / `scheduleExprEnvelope`); 60 Hz CC modulators with spin-deadband; `/xk/panic` + per-instance inactivity watchdog. SWAM mapping tables come from `gen_includes.js` — do not duplicate locally. Pitches folded to cello range via `foldToRange(pitch, lo, hi)`. `bang()` pins Gesture Mode = Expression on init. |
| `gen_includes.js` | **Generated** by `scripts/gen-max-include.js` from `src/osc-schema.ts` + `src/swam-mapping.ts` + `src/face-gesture.ts`. Committed to git (Max can't run tsx). Holds OSC address strings, SWAM enums, CC band centers, INTENSITY_MAP, ENV_PROFILE, ART_OFF_VEL, MOTION_NUDGE, FACE_MAP, LEGATO_COMPLEX, REGIME_*. **Do not hand-edit.** Regenerate with `npm run gen:max` and reload the v8 object in Max. |
| `xenakube_swam.maxpat` | Main performance patch. `[loadbang]` fires `max_active 1` into the v8 inlet and `read xenakube_2.swam` into the VST on open. |
| `xenakube_2.swam` | SWAM Cello 3 preset, auto-loaded by the patch on open. Contains MIDI-Learn assignments, Bow Polyphony page config, Ambiente disable, KS Velocity Remap bands. Edit via the SWAM plugin GUI → save with the same name; Max reloads on next `read` message. |
| `ks_logger.js` | Optional pass-through v8 between `xk_swam.js` and `vst~`. Toggleable (`on`/`off`/`dump`). Captures raw `midievent` with timestamps; `dump` prints KS-only timeline (field, option guess, Δprev, Δfield) plus non-KS summary + JSON for review. Use for diagnosing KS glitches (flashing harmonics / tremolo). |

## Mapping Cheatsheet

- **Complex → technique** (COMPLEX table): C1 Pizz, C2/C3 Arco, C4 Harmonics (CC 78), C5–C7 Portamento, C8 near-bridge + Tremolo (CC 79). Each complex owns `register: {lo, hi}`, `tremoloRate` baseline (CC 80), per-stage `exprEnv.{attackRampMs, sustainRampMs, releaseRampMs}`, and a `bowPoly` mode (Double/Hold default; Mono Poly Release for C5–C7 gliss).
- **C4 harmonic mode → path × tetra-orbit**: rotates per voice across OCT / OCT_5TH / CTRL via `harmonicsForC4()`. V1+even = OCT, V1+odd = OCT_5TH, V2+even = OCT_5TH, V2+odd = CTRL. OFF reserved for non-C4 complexes.
- **Intensity → 5 scalars** (6-level INTENSITY_MAP): Expression peak, note velocity, bow-pressure scalar, phrase density, tremolo-rate scalar.
- **Path V1/V2** → Expression peak scalar (V2 × 0.7) + tremolo-rate × 0.85 on V2 + widened V2 fold window.
- **Face → gesture shape** (Phase A1 Temporal Identity): `/xk/face <face>` populates `state.face*` from `FACE_MAP` (durationBias / registerBias / envelope / articulation / motion); `handleVoice` snapshots onto the allocated `inst` so face changes don't retroactively reshape an in-flight phrase. `phraseC1..C8` consult `faceShapedCount(inst, lo, hi, forGliss)`: `ENV_PROFILE.isSingle` (pluck/stab/drone) collapses non-gliss complexes to a single note; gliss complexes (C5/C6/C7) get `forGliss=true` with a hard minimum of 1 subsequent slide (see Bridge Invariants in CLAUDE.md). `ENV_PROFILE.countMult` (burst ×1.8) thickens density; `stepVelScale` shapes per-step velocity (swell cresc, fade dim, stab/burst accent-first). `commitSieveWalk(count, motion)` honours the face's `up`/`down` to force sieve-walker direction on C2/C6. `scheduleExprEnvelope` scales attack/peak/sustain by `ENV_PROFILE.{attackCoef, peakCoef, sustainCoef}`.
- **Duration discipline**: `handleVoice` clamps `duration` to ≤30 s after the face-bias multiply (Xenakis V2 ceiling); every `phraseCX` calls `scheduleRelease(inst, dur)` with no phrase-level multiplier stack — a voice's sounding time is exactly `duration + fade`.
- **Tilt** → Bow Position ±30 around the complex baseline (timbral sul tasto ↔ pont sweep).
- **Spin** → Vibrato Depth/Rate (CC 19; EMA α = 0.08, dead zone at 0.15). No coupling to CC 80.
- **Deviation** → Bow Pressure ±25 modulation around the complex baseline.
- **Regime** → Attack Ramp multiplier (contemplative 1.2 / conversational 1.0 / burst 0.5) and Expression-ramp multiplier (contemplative 1.5 / conversational 1.0 / burst 0.4).
- **Tremolo Min Speed (CC 80)**: per-phrase stochastic envelope. Each tremolo voice rolls 1/3 slow→fast / 1/3 fast→slow / 1/3 steady at onset; ramps driven by `rampCC` over `duration * 1000` ms.
- **Wild gliss density floor (D49)**: `phraseC5` requested count is `Math.max(WILD_MIN_COUNT, faceShapedCount(inst, 4, 9, true))`. `WILD_MIN_COUNT = 12` overrides the face envelope's `isSingle` collapse (pluck/stab/drone → 1) and any low-intensity rrand floor — wildness is the complex's identity, not something the face can soften. Pluck/stab/drone faces still apply their `durationBias` and `velCurve`; the salvo just packs ≥12 events into that span (clipped naturally by `glissSchedule` for very short phrases that can't fit at MIN_GLISS_SPACING_MS = 200 ms). K-vertex density and intensity still modulate count above the floor for non-isSingle faces. Turn rate / regime do NOT currently couple to gliss event count (only to expression/attack ramp speeds and phraseC2's hi-density boost); could wire in as a future modulator if burst-mode wild gliss should be denser still.
- **Wild gliss slide velocity (D50 v2)**: `phraseC5` calls `glissStep(..., WILD_GLISS_VEL, WILD_GLISS_BPA)` with `WILD_GLISS_VEL = 22`. Bumps slide-target velocity 4 units above default `GLISS_VEL = 18` for slight slide audibility. Critical constraint: SWAM Cello's Advanced→MIDI menu has "Portamento Control: Velocity (P.MaxTime)" — slide noteOn velocity directly scales portamento time. The original 18 sits at the bottom of that scale (max portamento time); 22 nudges up only marginally to preserve audible slides. **Do not bump WILD_GLISS_VEL aggressively** without verifying SWAM still engages portamento — D50 v1 tried vel 55 and produced "consecutive discrete notes with absolutely no portamento." Per-event attack character is now decoupled onto Bow Pressure Accent (D52, below), so further audibility work should happen there rather than by raising velocity. C6/C7 omit the override and keep default `GLISS_VEL = 18`.
- **Wild gliss bow pressure accent (D52)**: `phraseC5` passes `WILD_GLISS_BPA = 80` as the `accent` arg to `glissStep`; `glissNote` snaps CC 18 (Bow Pressure Accent — MIDI-Learned in `xenakube_2.swam` to SWAM's Expressivity → Bow Pressure Accent slider) to 80 just before the slide noteOn, then schedules a `BPA_RESET_MS = 100 ms` reset back to 0. Per-event attack emphasis without touching velocity, so SWAM's Velocity → P.MaxTime keeps portamento fully engaged. The 100 ms sustain holds the accent through the start of the slide envelope so SWAM's pressure response rings out before the next event arrives at MIN_GLISS_SPACING_MS = 200 ms (well clear of stacking). Steal safety: `cancelPhrase` forces CC 18 = 0 unconditionally so a steal mid-spike can't leak the accent into the next voice. Spike value 80 is moderate (sexy-move uses 110, u-perm 100). C5 only — C6/C7 keep their gentle bow-continuation slide character. Tunables: raise WILD_GLISS_BPA to push attack harder; lower BPA_RESET_MS toward 30 if the accent feels too sustained, or raise toward 150 (do not exceed MIN_GLISS_SPACING_MS - 50 ms ≈ 150).
- **Expression (CC 11)**: interpolated via `rampCC` slew limiter so envelope stages crossfade. **Phrase Dynamic Arc (D47, Phase 1)** for sustained multi-note complexes (C2/C3/C4/C8): one linear ramp across the full phrase duration via `schedulePhraseArc` — swell faces (L/F/F') cresc TO `peakExpr × ARC_CEIL`, fade/burst faces (U'/L'/R') dim FROM `peakExpr × ARC_CEIL` to `× ARC_FLOOR`. K-dynamic is the directional destination/origin, not a transient peak. isSingle envelopes (pluck/stab/drone) and gliss complexes (C5/C6/C7) keep `scheduleExprEnvelope`'s 3-stage shape — one note has no arc, gliss owns its own contour. `ARC_FLOOR = 0.30` is the headline tunable; `ARC_CEIL = 1.00` matches the K-dynamic ceiling. See Bridge Invariants in CLAUDE.md for the per-phrase telemetry pattern.
- **Double stops**: C2 bowed cloud (~35% of rebows after the first), C3 hovering flat (~40%), C8 tremolo cluster (30% chance of a phrase-long companion) emit a companion pitch via `doubleStopCompanion` / `maybeDoubleStop`. Companion tracked in `inst.activeNotes`; cleaned on next legato overlap / release / steal. Requires Bow Polyphony = Double/Hold (per-complex). Gliss complexes skip — Mono Poly Release would reinterpret the companion as a slide target.
- **Spells** route through `setupComplex(active)` for idempotent restore.
- **Flag gates** for v3.11-absent knobs: `HAS_HARMONICS_CC` / `HAS_TREMOLO_CC` / `HAS_TREMOLO_RATE` / `HAS_BOW_POLY_CC` enable CC with KS fallback (Bow Polyphony has no KS fallback — page-modifier combo); `HAS_BOW_SPEED` / `HAS_ATTACK_RAMP` / `HAS_ATTACK_CONTROL` default `false` to gate at the `cc()` helper.

Full parameter map, KS bands, preset prerequisites, and v3.10 / v3.11 migration notes: `docs/swam_cello_reference.md`. Per-decision rationale for every bridge mapping: `docs/revision_roadmap.md`.

## Max MCP Bridge

Claude Code can inspect and edit the running Max patch via the `maxmsp` MCP server at `MaxMSP-MCP-Server/` (registered in `.mcp.json`). **Always route patch work through the `max-patch` subagent** (`.claude/agents/max-patch.md`) — it has the MCP tools scoped and knows the XenaKube patch conventions.

**Confirm before editing the live patch** — even when running under `--dangerously-skip-permissions`, ask the user before invoking any `mcp__maxmsp__*` tool that mutates the patch (`add_max_object`, `remove_max_object`, `connect_max_objects`, `disconnect_max_objects`, `set_object_attribute`, `set_message_text`, `send_bang_to_object`, `send_messages_to_object`, `set_number`). Read-only inspection tools (`list_all_objects`, `get_object_doc`, `get_objects_in_patch`, `get_objects_in_selected`, `get_object_attributes`, `get_avoid_rect_position`) are fine without confirmation. Reason: patch edits hit live performance state and are easy to desync from `xk_swam.js` / `gen_includes.js`; a skipped prompt has bitten us before.

Prerequisite: open `MaxMSP-MCP-Server/MaxMSP_Agent/demo.maxpat` in Max 9+, `script npm install` (first time), then `script start`.

**Boundary**: keep the XenaKube patch thin — the chain shown above plus optional `[print xk_swam]`. All new routing/logic belongs in `max/xk_swam.js`, not in new Max objects.
