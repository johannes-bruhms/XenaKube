# XenaKube Operation Manual

This is the practical operating manual for the XenaKube instrument: a GAN i4
smart cube driving the TypeScript composition engine, the browser dashboard,
and the Max/MSP + SWAM Cello synthesis bridge.

Use this document when preparing a session, explaining the instrument to a
performer, debugging a performance rig, or learning how the cube's gestures map
to sound.

The deeper implementation references are:

- `docs/performance-model.md` for the turn loop, cosmologies, algorithms, and
  math.
- `docs/synthesis-bridge.md` for Max/SWAM routing and per-complex synthesis.
- `docs/dashboard-architecture.md` for the browser dashboard.
- `docs/bridge-invariants.md` and `docs/dashboard-invariants.md` for the
  runtime guards that catch silent regressions.
- `docs/osc-reference.md` for OSC addresses and payloads.

## 1. Instrument Summary

XenaKube turns a physical Rubik's cube into a live cello instrument.

The performer turns a Bluetooth smart cube. Chrome reads the cube over Web
Bluetooth and sends moves and gyro packets to `relay.js`. The relay drives the
TypeScript engine, forwards OSC to Max/SWAM, serves the dashboard, and forwards
MIDI echo telemetry back to the browser. Max/MSP hosts SWAM Cello and renders
the actual sound.

The useful performer model is:

> Face owns shape. K owns material. C owns texture. Gyro owns live bow color.

- The 12 quarter face-moves are the keyboard. `L`, `L'`, `R`, `R'`, `F`,
  `F'`, `B`, `B'`, `U`, `U'`, `D`, and `D'` each have a fixed gesture family.
- The active K corner supplies density, dynamic level, and base duration.
- The active C corner chooses one of eight sound-complex textures.
- The sieve supplies pitch material.
- Face motion reshapes direction; tetra parity changes C4 harmonic color.
- Tilt and turn rate shape the gesture without replacing its identity.

Each turn triggers a phrase, not a single note. The phrase can be a pizzicato
cloud, scalar run, harmonic atom, wild glissando, quiet drift, or tremolo bed
depending on the current C type.

## 2. System Diagram

```text
GAN i4 cube
  -> Chrome dashboard, Web Bluetooth
  -> relay.js
     -> XenaKubeEngine
     -> OSC /xk/* to Max on UDP 57121
     -> OSC /gan/* to TouchDesigner on UDP 8000
     -> WebSocket state back to dashboard
  -> Max/MSP xenakube_swam.maxpat
     -> v8 xk_swam.js
     -> SWAM Cello 3
     -> MIDI echo /xk/midi/* back to relay on UDP 57122
  -> dashboard rolling score, sieve, cube HUD
```

The dashboard is not the audio source. It displays the engine state and the
MIDI echo coming back from Max, so the rolling score represents what the bridge
actually emitted to SWAM.

## 3. Required Equipment

Hardware:

- GAN i4 smart cube.
- Computer running Chrome and Max/MSP.
- Audio interface or built-in audio output.
- Optional TouchDesigner machine or patch listening on UDP 8000.

Software:

- Node.js for `relay.js`, tests, and build scripts.
- Chrome or a Chromium browser with Web Bluetooth support.
- Max/MSP 9 or newer.
- SWAM Cello 3 with the XenaKube preset loaded by the Max patch.
- Repo dependencies installed with `npm install`.

Recommended stage setup:

- Keep the cube charged before a session.
- Disable system sleep.
- Use a stable audio buffer size in Max before rehearsal.
- Keep a terminal visible for relay logs and a Max console visible for
  `[print xk_swam]` when debugging.
- Use Chrome at `http://localhost:3000` from the same machine that runs the
  relay unless you are intentionally testing remote access.

## 4. Canonical Cube Pose

The performance pose is:

- Red face toward the performer/front.
- White face up.

The relay remaps the GAN factory frame into this performer frame. That remap is
load-bearing: the engine, dashboard face animation, algorithm buffer, and
`/xk/face` OSC all assume it. If face turns appear on the wrong dashboard side,
check the canonical pose first, then look for `[CUBE REMAP FAIL]` or
`[CUBE ALIGN FAIL]` in the browser console.

The cube does not have to stay solved during performance. It is the instrument.
Solving the cube is only a structural event when the browser detects the
unsolved-to-solved edge.

## 5. Startup Procedure

Use this order for a normal session.

1. Open Max/MSP.

   Open `max/xenakube_swam.maxpat`. Confirm DSP is on and the SWAM Cello plugin
   is loaded. The patch loads the `xenakube_main.swam` preset.

2. Confirm the Max bridge is alive.

   Attach or view `[print xk_swam]` if you are debugging. On v8 load, the bridge
   prints its pitchbend-range reminder. This reminder must agree with the SWAM
   preset's Pitchbend Range setting; if it does not, glissandi can look correct
   on the dashboard while sounding wrong.

3. Start the relay from the repo root.

   ```bash
   npx tsx relay.js
   ```

   The relay serves the dashboard at `http://localhost:3000`, forwards OSC to
   Max, and listens for MIDI echo from Max.

   To boot the historical S4 walk cosmology for comparison:

   ```powershell
   $env:XK_COSMO = 'alpha-cosmo'
   npx tsx relay.js
   ```

4. Open the dashboard.

   In Chrome, open:

   ```text
   http://localhost:3000
   ```

5. Connect the cube.

   Hold the cube in canonical pose, enter the cube MAC address if needed, and
   click `Connect`. The dashboard will auto-zero after the connect view lands.

6. Zero the gyro deliberately.

   Hold the cube in the neutral hand position you want to treat as rest, then
   click `Zero`. This zeros both the dashboard's live view and the engine's S4
   snap frame. Use this again whenever the physical rest pose drifts.

7. Play one slow face turn.

   You should see:

   - The move in the recent-move row.
   - Active K and C cards update.
   - Sieve cells glow when notes sound.
   - The rolling score draw note material from the MIDI echo.
   - Max/SWAM produce audio.

If you see dashboard motion but no sound, start with the Max/SWAM checklist in
the troubleshooting section.

## 6. Shutdown Procedure

For a clean stop:

1. Stop turning the cube and let any long phrases release.
2. Stop the relay terminal with Ctrl+C.
3. The relay sends `/xk/panic` on disconnect paths; Max also flushes notes on
   panic.
4. Turn off Max DSP if you are done with the audio rig.
5. Disconnect the cube in Chrome or close the tab.

If a note hangs, send panic from the Max patch or restart the relay. The
dashboard also clears in-flight rolling-score notes on `/xk/midi/panic`.

## 7. Dashboard Tour

The browser dashboard is the operational cockpit.

Top-left:

- `XENAKUBE` title: click to hide/show most chrome for performance mode.
- MAC field and `Connect` button.
- `Reset`: re-syncs the cube as solved and resets engine structure. Use after
  physically solving the cube.
- `Zero`: captures the current cube orientation as the rest pose.
- Cosmology toggle: switches between `beta-cosmo` and `alpha-cosmo`.
- Mode badges: palette, voice mode, speed regime, solved state, turn rate.
- Active K/C cards: the current material corner and current complex texture.
- Face glyph: the most recent face identity.

Bottom-left:

- State panel: active voice, last face, phrase plan, phrase audit, S4 element,
  step, snap, complex phase, tetra orbit, scramble, and current permutation.
- Phrase plan: the TypeScript shadow plan sent before each `/xk/voice`.
- Phrase audit: the relay's comparison between planned phrase structure and
  Max's `/xk/midi/*` echoes.

Top-right:

- Recent move buffer.
- Cube-algorithm notification and partial-match display.

Right edge:

- Vertical sieve strip. It spans C2 through C6 and aligns with the rolling
  score pitch axis.
- Active pitch cells glow from actual Max MIDI echo.

Background:

- Rolling score. It scrolls from right to left and draws the MIDI echo from
  Max. C1-C4 and C8 use procedural brushes. C5-C7 draw gliss chains.

White triangle overlay:

- Connects the active cube points to the active sieve pitch.
- During glissandi, its moving endpoint should agree with the rolling-score
  gliss curve. A `GLISS SYNC FAIL` browser console error means the visual
  invariant caught drift.

Bottom-right controls:

- Rotate target: `cam`, `live`, or `ghost` chooses what the rotation gizmo
  manipulates.
- `smooth`: gyro smoothing sent to the relay.
- `still` and `motion`: motion telemetry controls and readout.
- `ghost`: ghost cube scale.
- `z-pos`: cube depth offset.
- `score`: rolling-score scroll speed.
- `bg`: dashboard background color.
- `quality`: cube render quality. Low bypasses bloom; Med and High enable the
  post-processing chain.

Optional interruption layer:

- Add `?intrusions=1` to the dashboard URL to enable the optional performance
  overlay.
- Add `&intrusionDebug=1` for debug controls.
- The layer is separate from the rolling score and should not mutate the core
  visual invariant surfaces.

## 8. Reset, Zero, Solve, and Panic

These controls are easy to confuse.

`Zero`:

- Captures the current orientation as the neutral gyro pose.
- Recenters the engine's snap cells and the dashboard live cube.
- Does not reset K/C structure.
- Use when the cube looks tilted or the active top face feels wrong.
- Performer shortcut: in canonical white-up pose, a quick sequence of four
  `U'` turns triggers the same zero action.

`Reset`:

- Tells the system to treat the cube as solved and resets engine structure.
- Use after physically solving or when the performance state should return to
  the start.

Physical solve edge:

- The browser watches the cube facelets.
- On an unsolved-to-solved edge, alpha-cosmo returns to beta-cosmo with the
  normal structural reset.
- If already in beta-cosmo, the beta topology stays in place.
- `/xk/solve` still fires for listeners.

`Panic`:

- Flushes notes and CC state.
- Sent automatically on relay disconnect paths.
- Also available through the Max patch.
- Use for hung notes, reconnects, or emergency silence.

## 9. How a Turn Becomes Sound

The current turn loop is:

1. The cube reports a quarter-turn.
2. The dashboard sends the move to `relay.js`.
3. The relay applies the canonical-pose move remap.
4. The engine feeds the move to the cube-algorithm detector.
5. If a named algorithm matches, the dashboard logs it. Current algorithm
   effect handlers are detection-only.
6. The active cosmology advances.
7. The engine emits `/xk/face` for the face identity.
8. The voice engine emits one active voice in sequential mode or all voices in
   polyphonic mode.
9. The relay sends a compact `/xk/phrase/plan` followed by `/xk/voice`.
10. Max snapshots the face state, resolves phrase duration, configures SWAM,
    and runs `phraseC1` through `phraseC8`.
11. Max echoes `/xk/midi/noteon`, `/xk/midi/noteoff`,
    `/xk/midi/bendstep`, and `/xk/midi/expr` back to the relay.
12. The relay audits the echo and broadcasts it to the dashboard.
13. The rolling score draws what Max emitted.

Gyro packets run continuously alongside that loop. They do not trigger notes by
themselves.

## 10. Cosmologies

XenaKube has two structural cosmologies.

`beta-cosmo`:

- Default mode.
- Uses the visible physical corner topology.
- Face turns move K material through cube corners.
- C1-C8 stay fixed to local visible ghost-cube slots.
- The active read-head is direction-aware: the current top face chooses an
  edge, and the turn direction chooses the endpoint the face move pushes
  material into.
- This is the performer-facing instrument.

`alpha-cosmo`:

- Historical Nomos Alpha-style S4 walk path.
- K and C assignments move through S4 group state.
- Alpha/beta/gamma C phase rotation is live.
- Useful for comparison, research, and legacy behavior.

Switching cosmology resets structural state. This is intentional; it prevents
the physical beta topology and historical alpha S4 walk from contaminating each
other.

## 11. Voice Modes

Sequential:

- One active voice per turn.
- In beta-cosmo, the active voice is the direction-aware collision endpoint.
- In alpha-cosmo, the active voice follows the historical step walk.
- This is the normal live mode.

Polyphonic:

- The engine can emit all eight vertices for a turn.
- The current Max/SWAM bridge is a single-instance model. It hard-steals the
  current phrase when the next voice arrives.
- Treat polyphonic engine mode as experimental until the bridge pool is widened
  and the Max patch topology is changed deliberately.

## 12. Face-Move Reference

The 12 quarter-turns own gesture identity. They shape duration, envelope,
articulation, release shape, and velocity contour. They do not force register
or pitch direction; K, C, the sieve, and the phrase engine choose the material
that fills that gesture.

Half-turns are not independent face identities. GAN hardware reports quarter
clicks, and the algorithm book stores half-turns as two counterclockwise
quarter-turns. For performance, a fast same-direction physical half-turn is
also detected as punctuation: the second matching quarter-turn gets a
`halfTurn` flag and sounds as short, loud punctuation, overriding
the normal K/face phrase for that one turn. C1 remains pizzicato, C4 remains
harmonic, C5-C7 become large/medium/half-step one-direction gliss strokes,
and the remaining complexes use the bowed accent dyad.

| Move | Family | Duration bias | Envelope | Articulation | Operational sound |
|------|--------|---------------|----------|--------|-------------------|
| `U` | top attack | short | pluck | attack | front-loaded attack |
| `U'` | top release | long | fade | release | longer gesture that releases away |
| `D` | bottom attack | very short | stab | attack | compact sharp attack |
| `D'` | bottom sustain | very long | hairpin-up | sustained | swell that crests and returns |
| `L` | left legato | long | swell | sustained | sustained crescendo |
| `L'` | left release | long | fade | release | sustained diminuendo |
| `R` | right percussive | shortest | stab | attack | compact accented hit |
| `R'` | right burst | medium-short | burst | iterative | denser flurry or salvo |
| `F` | front swell | medium-long | swell | sustained | bowed swell energy |
| `F'` | front swell | medium-long | swell | sustained | bowed swell energy |
| `B` | back attack | short | pluck | attack | short pluck or point |
| `B'` | back sustain | very long | hairpin-down | sustained | loud-soft-loud held tension |

Memorize the six pairs:

- `U` / `U'`: pluck vs fade.
- `D` / `D'`: stab vs hairpin.
- `L` / `L'`: swell vs fade.
- `R` / `R'`: short stab vs burst.
- `F` / `F'`: both swells; same pitch freedom, different turn identity.
- `B` / `B'`: pluck vs trough hairpin.

## 13. Complex Reference

The C layer is the texture inside the face frame.

In beta-cosmo, the visible ghost-cube local slots are fixed: slot 1 is C1, slot
2 is C2, and so on. The active K corner sounds with the C label in the same
corner. In alpha-cosmo, S4 and alpha/beta/gamma mappings can move C
assignments.

| Complex | Name | Synthesis identity | How to play it |
|---------|------|--------------------|----------------|
| C1 | Ataxic cloud | Pizzicato sound-points | Use short faces for isolated plucks, burst faces for dense scatter, long faces for point clouds across a phrase. |
| C2 | Ordered cloud asc/desc | Directional bowed run | The shared sieve walker supplies direction; repeated turns can continue or flip at boundaries without a face forcing high/low starts. |
| C3 | Ordered flat cloud | Hovering bowed cloud | Use long faces for sustained color. Tilt matters less while C3 owns its own bow-motion ramps. |
| C4 | Ionized atom | Harmonic attacks and clusters | Listen for tetra parity: harmonic mode changes with even/odd tetra state. Good for glassy punctuations. |
| C5 | Ataxic sliding | Wild glissando field | Use `R'` for dense salvos, `D'` or `B'` for long arcs, and fast turning for pressure. The wild floor is protected. |
| C6 | Ordered sliding asc/desc | Sieve-stepped gliss chain | The clearest sliding-line complex. Direction comes from the shared sieve walker, not the face letter. |
| C7 | Ordered sliding flat | Subtle drift around an anchor | Use sustained faces for breath-like motion. It starts drifting quickly and stays gentler than C5/C6. |
| C8 | Atom | Sul ponticello tremolo bed | Use long faces to make tense beds. Turn rate raises tremolo pressure, not event count. |

Per-complex register clamps are currently disabled. Pitch selection comes from
the sieve, phrase-local anchor rolls, and global cello-range folding rather
than fixed C-specific pitch windows or face-specific transposes. Flat or
sustained complexes can hover around an anchor, but that anchor is chosen from
the current sieve rather than reserved for a fixed register.

## 14. K Reference

K is the material cube. Each K corner carries density, intensity, and base
duration. Face signatures reshape that base duration but do not replace it.

| K | Density | Intensity | Base duration role |
|---|---------|-----------|--------------------|
| K1 | low | ppp | short, very soft material |
| K2 | low | pp | long, soft material |
| K3 | high | p | long, soft but dense material |
| K4 | high | mp | short, moderately soft dense material |
| K5 | medium | mf | medium material |
| K6 | medium | f | long-lifted strong material |
| K7 | medium-high | ff | long strong material |
| K8 | medium-high | fff | medium, maximum intensity material |

In beta-cosmo, face turns physically permute K material through visible cube
corners. Repeating a face does not simply repeat a sound; it rotates different
K material under the same face gesture.

In alpha-cosmo, K follows the historical S4 walk.

## 15. Sieve and Pitch

The pitch set is the Xenakis-inspired sieve L(m,n), displayed as the vertical
strip on the dashboard. Every third substitution advances the sieve metabola.

Operationally:

- The active pitch cell glows from Max MIDI echo.
- C2 and C6 expose sieve direction most clearly.
- Face motion can force the sieve walker up or down.
- The rolling score and sieve share a pitch-axis invariant; if the browser logs
  `PITCH AXIS FAIL`, visual pitch alignment is not trustworthy until fixed.

## 16. Gyro and Live Expression

Gyro input supplies continuous expression:

- Tilt: maps to Bow Position inside the bridge's lower-half bow-position
  window, smoothed to avoid hand-jitter buzz.
- Spin: activity telemetry and visual energy; not currently a primary SWAM
  vibrato control.
- Deviation: distance from nearest S4 snap; useful for seeing how far the cube
  is from a stable orientation cell.
- Scramble: exact visible-corner scramble distance normalized for display and
  expression telemetry.

Practical playing:

- Use `Zero` before playing long sustained material.
- While a phrase is sounding, tilt for bow color rather than expecting tilt to
  retrigger notes.
- C3 and C4 own bow-position/bow-pressure ramps during their note bodies, so
  global tilt will not overwrite those phrase-local motions.
- C8 skips live tilt so the sul pont tremolo bed remains stable.
- The dashboard live cube uses a smoothed visual quaternion; the engine uses a
  calibrated orientation frame for snap and selector logic.

## 17. Turn Rate and Regime

The engine tracks turn rate and classifies the session into:

- contemplative
- conversational
- burst

Turn rate also produces a bounded pressure scalar. It can raise density,
velocity, expression, bow pressure, C8 tremolo speed, and C5 accent according
to per-complex gains. It must not erase K identity or collapse a complex's
core gesture.

As a performer:

- Slow turns reveal the K/C/face identity clearly.
- Faster runs push pressure and density.
- C8 does not become denser from fast turns; it becomes more pressured.
- C5 stays wild even on faces that would normally collapse a phrase to one
  strike.

## 18. Cube Algorithms

The detector recognizes seven named algorithms in all whole-cube orientations.
Current behavior is detection-only: the dashboard logs the match and listeners
receive the event, but effect handlers do not yet change mode or fire a
separate phrase.

| Algorithm | Canonical sequence | Role |
|-----------|--------------------|------|
| sexy-move | `R U R' U'` | CFOP F2L trigger |
| oll-cross | `F R U R' U' F'` | two-look OLL edges |
| sune | `R U R' U R U2 R'` | two-look OLL corners |
| anti-sune | `R U2 R' U' R U' R'` | inverse corner trigger |
| niklas | `R U' L' U R' U' L` | corner 3-cycle commutator |
| u-perm | `R U' R U R U R U' R' U' R2` | two-look PLL edge cycle |
| t-perm | `R U R' U' R' F R2 U' R' U' R U R' F'` | PLL corner and edge trigger |

Half-turn technique matters. GAN hardware reports quarter-turn clicks, so the
book represents half-turns as two counterclockwise quarter-turns. Flick
half-turns counterclockwise if you want algorithm detection to match.

## 19. Max/SWAM Bridge Operation

Runtime patch:

```text
max/xenakube_swam.maxpat
```

Main bridge code:

```text
max/xk_swam.js
```

Generated include:

```text
max/gen_includes.js
```

Do not hand-edit `max/gen_includes.js`. It is generated from the TypeScript
OSC schema, SWAM mapping table, and face-gesture table.

Current synthesis model:

- One SWAM Cello instance.
- `xk_swam.js` receives OSC from the relay.
- A new voice hard-steals the previous phrase.
- Max emits MIDI echo back to the relay for dashboard rendering and phrase
  audit.

Important live checks:

- The bridge should print the pitchbend-range reminder on v8 load.
- The SWAM preset must match the bridge pitchbend range.
- Selector CCs for harmonics, tremolo, and bow polyphony are reasserted often
  by design. Seeing those writes in the Max console is normal.
- `/xk/midi/expr` echo is telemetry for dashboard brush dynamics; it does not
  drive synthesis.

When changing SWAM preset settings:

- Recheck Pitchbend Range.
- Recheck MIDI Learn assignments for any CCs the bridge uses.
- Save the preset under the expected filename.
- Reload the v8 object and confirm the bridge startup log.

## 20. Normal Verification Before Rehearsal

Run through this checklist before a serious session.

Audio:

- Max patch open.
- SWAM Cello loaded.
- DSP on.
- Test turn produces sound.
- No stuck tremolo or harmonic mode on non-C4/non-C8 material.
- Gliss complexes audibly slide, not only jump.

Relay:

- `npx tsx relay.js` running.
- Dashboard opens at `http://localhost:3000`.
- Relay logs show MIDI echo listener active.
- No port conflict on 3000.

Dashboard:

- Cube connects.
- `Zero` makes live cube rest pose usable.
- Sieve cells glow on note events.
- Rolling score draws note material.
- Browser console has no `PITCH AXIS FAIL`, `GLISS SYNC FAIL`,
  `SIEVE LAYOUT FAIL`, `CUBE ALIGN FAIL`, or `CUBE REMAP FAIL`.

Musical:

- One slow pass through all 12 face moves.
- One C5/C6/C7 gliss phrase checked for audible bend.
- One C8 phrase checked for tremolo.
- One C4 phrase checked for harmonic color.
- One algorithm sequence checked for dashboard detection if needed.

## 21. Troubleshooting

No dashboard at `http://localhost:3000`:

- Confirm `relay.js` is running.
- If the relay reports address already in use, another process owns port 3000.
  Stop that process or use the Max relay controller's explicit port-kill
  workflow if you are operating from Max.

Dashboard opens but cube will not connect:

- Use Chrome, not a browser without Web Bluetooth.
- Confirm Bluetooth is on.
- Confirm the cube is awake and charged.
- Check the MAC field.
- Close other browser tabs or apps that may already own the cube connection.

Cube connects but moves do not affect sound:

- Check that the relay terminal is still running.
- Check browser console for WebSocket reconnect messages.
- Check relay logs for received move messages.
- Confirm Max patch is open and listening on UDP 57121.
- Confirm the Max gate before `v8 xk_swam.js` is open if you are using the
  gate for offline inspection.

Dashboard moves but no audio:

- Turn on Max DSP.
- Confirm SWAM Cello is loaded and not muted.
- Confirm audio output routing.
- Check Max console for `xk_swam` logs.
- Send panic, then play a new turn.
- Reopen the patch if the VST failed to load.

Sound works but rolling score is empty:

- Max MIDI echo may not be connected to `udpsend 127.0.0.1 57122`.
- Check relay log for the MIDI echo listener.
- Check browser WebSocket state.
- Send panic or reload dashboard to clear stale note state.

Glissandi look correct but sound like jumps:

- Recheck SWAM Pitchbend Range against the bridge startup reminder.
- Recheck pitchbend MIDI channel alignment if code changed.
- Confirm C5/C6/C7 are producing `/xk/midi/bendstep` echo.
- Look for `BEND FAIL`, `BEND CLIP`, `PORT TIME FAIL`, or `GLISS FAIL` in Max
  logs.

Everything tremolos after patch startup:

- This usually means SWAM selector state and bridge cache disagreed during
  preset load. The bridge intentionally reasserts tremolo/harmonic/bow-poly
  CCs on each voice. Play a non-C8 phrase and check whether the selector write
  logs appear. If not, inspect `xk_swam.js` rather than the dashboard.

Harmonics do not appear on C4:

- Check SWAM MIDI Learn for the harmonics CC.
- Check Max logs for harmonic selector writes.
- Confirm the active complex is C4, not another C in the same visible area.

Algorithms do not trigger:

- Remember algorithm effects are detection-only today.
- Confirm the dashboard move buffer contains the expected remapped letters.
- Use counterclockwise half-turn technique for `U2`, `R2`, and other half-turns.
- Keep the sequence inside the detector timeout; long pauses clear the buffer.

The wrong face animates on the dashboard:

- Confirm canonical pose: red-front, white-top.
- Reconnect and zero.
- Check for `[CUBE REMAP FAIL]` and `[CUBE ALIGN FAIL]`.
- If those logs appear after code edits, audit `relay.js`, `public/js/main.js`,
  and `public/js/cube-scene.js` remap tables together.

Active C changes in beta-cosmo when it should stay local:

- This is an invariant violation. Check for `[GHOST ACTIVE SLOT FAIL]` or
  `[GHOST TURN LEAK FAIL]`.
- In beta-cosmo, C labels stay fixed to local ghost-cube slots.

The rolling score and white gliss line disagree:

- Check for `GLISS SYNC FAIL`.
- This means the dashboard visual invariant caught a drift between the two
  trajectory models. Trust the failure log, not the screen.

Held notes remain after a crash:

- Send panic from Max or restart the relay.
- Reload the dashboard.
- If SWAM still sustains, use Max all-notes-off or reload the SWAM patch.

## 22. Maintenance Commands

Run from the repo root.

```bash
npm test
npm run test:watch
npx tsc --noEmit
npm run build
npm run gen:max
npm run check:doc-sizes
npm run check:agents
npm run check:docs
npx tsx relay.js
npm run dev
```

Use `npm run gen:max` after changing any of:

- `src/osc-schema.ts`
- `src/swam-mapping.ts`
- `src/face-gesture.ts`

Then reload the Max v8 object. The generated include is committed because Max
does not run TypeScript directly.

## 23. Editing and Safety Rules

For code and patch maintainers:

- `src/osc-schema.ts` is the source of truth for OSC addresses.
- Do not add raw `/xk/*` literals outside the schema.
- Keep `public/dashboard.html` structural; put logic in `public/js/*.js` and
  styling in `public/css/main.css`.
- Keep the Max patch thin. New synthesis logic belongs in `max/xk_swam.js`.
- Do not hand-edit `max/gen_includes.js`.
- Do not ship a recurring-bug fix without the invariant or telemetry that
  proves the failure and catches it next time.
- If code behavior and docs diverge, fix the docs in the same change.

For live patch work:

- Use the existing Max patch helper workflow before mutating a live patch.
- Confirm before any live Max MCP mutation.
- Keep patch topology, `xk_swam.js`, and generated includes in sync.

## 24. Practice Routine

First session:

1. Start Max, relay, dashboard, and cube.
2. Zero gyro in canonical pose.
3. Play `U`, `U'`, `D`, `D'`, `L`, `L'`, `R`, `R'`, `F`, `F'`, `B`, `B'`
   slowly.
4. Repeat one face six or more times and listen for the face identity staying
   stable while K material changes.
5. Find C5, C6, and C7 corners and compare their three gliss behaviors.
6. Find C8 and hold long faces to hear the tremolo bed.
7. Tilt during C3 or C8 and notice which material responds and which material
   protects phrase-local bow motion.
8. Play `R U R' U'` and confirm the dashboard logs `sexy-move`.
9. Switch briefly to alpha-cosmo, play a few turns, then switch back to
   beta-cosmo and observe the structural reset.
10. Physically solve the cube and confirm the solved badge/solve event.

Performance practice:

- Treat face pairs as six physical families.
- Use beta-cosmo for followable corner performance.
- Use alpha-cosmo when you want the older S4 walk behavior.
- Use turn rate as pressure, not as a separate note trigger.
- Use tilt as live bow color after the phrase is already sounding.
- Watch phrase audit and failure logs during rehearsals; they exist because
  silent drift has been the most common failure mode in this instrument.

## 25. Quick Reference

Core mental model:

```text
face move -> gesture shape
K corner  -> density, intensity, duration
C corner  -> sound-complex texture
sieve     -> pitch material
gyro      -> bow color and orientation metadata
turn rate -> bounded pressure
algorithm -> detected pattern, effects pending
solve     -> beta-cosmo anchor
```

Normal session:

```text
Open Max patch
Start relay
Open dashboard
Connect cube
Zero gyro
Play
Panic or stop relay to clear
```

Most important logs:

- `[LATENCY WARN]` or `[LATENCY FAIL]`: turn-to-noteon echo delay.
- `[PHRASE ECHO FAIL]`: planned phrase did not match Max MIDI echo.
- `GLISS FAIL`: a gliss complex lost its identity-bearing gliss event.
- `BEND FAIL` or `PORT TIME FAIL`: slide path likely broken.
- `PITCH AXIS FAIL`: rolling score and sieve are misaligned.
- `GLISS SYNC FAIL`: white gliss line and rolling-score trajectory disagree.
- `[CUBE REMAP FAIL]`: relay/dashboard face remap drift.
- `[GHOST ACTIVE SLOT FAIL]`: beta-cosmo local C invariant broken.

When in doubt, start from the invariants. XenaKube's recurring failures are
usually silent at the musical surface until an assertion, audit, or log makes
the drift visible.
