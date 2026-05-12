# OSC Reference

Authoritative table of every `/xk/*`, `/gan/*`, and `/xk/midi/*` address.

`/xk/*` → Max (57121). `/gan/*` → TD (8000). `/xk/midi/*` and `/xk/spectrum/frame` ← Max → relay (57122, reverse direction). MIDI echoes drive the dashboard's rolling score; spectrum frames drive the optional actual-audio spectrogram only when enabled by a dashboard client. Multi-message state burst on every cube turn and at BLE gyro rate (~10 Hz). `/xk/gyro`, `/gan/gyro`, `/xk/expr/*` at 60 Hz from the relay's Kalman loop. `/xk/voice` fires only on real voice transitions (from `engine.onVoice`, not per gyro packet); its final `halfTurn` flag marks the second rapid same-move turn as punctuation. `/xk/phrase/plan` is relay-side shadow phrase intent for the Max→TypeScript migration; Max logs it, dashboard displays it, and legacy Max audio still renders the phrase. `/xk/algorithm` fires on cube-algorithm detection. Full `XenaKubeState` JSON broadcasts to all WS clients on every state change.

`/xk/voice`'s `vertexIdx` is the cube vertex (1–8); `/xk/midi/{noteon,noteoff}`'s `voice` is the SWAM polyphony slot (always 1 in single-instance mode). Different concepts.

Phrase audit note: `/xk/phrase/plan` is sent immediately before its matching `/xk/voice`. Max stores that plan id on the voice instance and appends it to subsequent `/xk/midi/*` echoes so relay-side audit can distinguish dropped notes from dashboard rendering errors.

**Source of truth**: address strings live in `src/osc-schema.ts`. Never add new `/xk/*` literals outside that file. The schema is codegen'd into `max/gen_includes.js`; regenerate with `npm run gen:max` after any schema change.

| Address | Args | Meaning |
|---------|------|---------|
| `/xk/group/k` | int (0-23) | K S4 element: live walk in alpha-cosmo, gyro/orientation shadow in beta-cosmo |
| `/xk/group/c` | int (0-23) | C_i S4 element: live assignment walk in alpha-cosmo, shadow in beta-cosmo |
| `/xk/vertex/[1-8]` | float, string, float | density, intensity, K_i base duration |
| `/xk/complex/[1-8]` | int (1-8) | ComplexType enum |
| `/xk/cycle` | string | "alpha"/"beta"/"gamma" |
| `/xk/tetra` | int | orbit (0=even, 1=odd) |
| `/xk/sieve` | int... | pitch semitone offsets (variable length) |
| `/xk/gyro` | float×4 | x y z w quaternion |
| `/xk/perm` | int x8 | current K assignment: S4 walk in alpha-cosmo, physical corner topology in beta-cosmo |
| `/xk/step` | int | transformation count |
| `/xk/active` | int (0-7) | active vertex index; beta-cosmo selects the turned face's head-on top-right corner relative to the current top face |
| `/xk/snap/element` | int (0-23) | S4 element gyro snaps to |
| `/xk/snap/quat` | float×4 | quaternion of snap target |
| `/xk/snap/dev` | float (0-1) | gyro deviation; 0=locked, 1=boundary |
| `/xk/scramble` | float (0-1) | normalized exact quarter-turn distance over the 40,320 visible corner permutations |
| `/xk/solve` | — | fires once on unsolved → solved edge (GAN FACELETS report); alpha-cosmo returns to beta-cosmo before the event, beta-cosmo stays in place |
| `/xk/rate` | float | turn rate (turns/sec) |
| `/xk/regime` | string | 'contemplative' / 'conversational' / 'burst' |
| `/xk/expr/{tilt,spin,dev,scramble}` | float (0-1) | 60 Hz continuous controls |
| `/xk/algorithm` | string | cube-algorithm name on detection (e.g. "sexy-move", "sune", "t-perm") |
| `/xk/face` | string | face identity ('L'/'L\''/'R'/'R\''/'F'/'F\''/'B'/'B\''/'U'/'U\''/'D'/'D\'') or `-` reset sentinel; fires BEFORE `/xk/voice` so Max snapshots face multipliers without stale-face bleed |
| `/xk/voice` | int, int, float, string, float, int | vertexIdx, complexType, density, intensity, K_i base duration, halfTurn(0/1). Face moves multiply by `FACE_MAP.durationMult` in Max unless halfTurn=1, which forces the punctuation gesture |
| `/xk/phrase/plan` | int, int, string, float, int, int, int, int, int | TS shadow phrase summary. Args: planId, complexType, face or `-`, durationSec, eventCount, noteOnCount, bendStepCount, companionNoteOnCount, halfTurn(0/1). Sent immediately before the matching `/xk/voice` so Max can stamp all resulting MIDI echoes with the plan id. |
| `/xk/panic` | — | relay WS-disconnect; bridges flush notes + CCs |
| `/xk/midi/noteon` | int, int, int, int, int, int | Max → relay (57122). voice (SWAM slot, always 1), pitch (0-127), velocity (1-127), complex (0=unknown / 1..8 = Cn), isCompanion (0/1), planId. Mirrors every `noteOn` in `xk_swam.js`; keyswitches excluded. The relay uses `planId` for phrase echo audit and `isCompanion` so companion noteons cannot satisfy first-onset latency probes. |
| `/xk/midi/noteoff` | int, int, int, int, int, int | Max → relay (57122). voice, pitch, velocity, complex, unusedFlag, planId. Mirrors every `noteOff`. `complex` is `inst.activeComplex` at noteoff time; `planId` is the phrase plan active when the note was emitted. |
| `/xk/midi/panic` | — | Max → relay (57122). Emitted from `bang()` so the dashboard clears its in-flight notes map on reset. |
| `/xk/midi/bendstep` | int, int, int, int, int, int | Max → relay (57122). D59 cross-string slide via pitchbend wheel. Args: voice, fromPitch, toPitch, durMs, complex, planId. Fired at the START of a `bendStep` so the dashboard can model the segment in advance and the phrase auditor can confirm gliss structure. |
| `/xk/midi/expr` | int, int, int, int | Max → relay (57122). Pure additive telemetry. Args: voice, val (0..127), complex, planId. Fired from `cc()` / `ccForce()` in `xk_swam.js` whenever `num === CC.EXPRESSION` so the dashboard can size brushes by audible dynamics (the bridge's D47 phrase arc ramps CC 11 linearly across a phrase). Velocity is a poor proxy because SWAM Cello drives ongoing loudness via CC 11, not per-note velocity. The dashboard caches latest per-voice value, snapshots `exprAtOn` at every noteon and `exprAtOff` at every noteoff, and linearly interpolates within the note for within-x brush thickness variation. |
| `/xk/spectrum/frame` | int, float, float, int, int, float, float, float, float, float, float, float, float... | Max → relay (57122). Optional actual-audio spectrogram frame. Args: frameId, audioTimeMs, analysisLatencyMs, complex (0=relay uses latest audio-side MIDI noteon complex, falling back to engine state only before any noteon echo; 1..8=Cn), binCount, minHz, maxHz, rmsDb, peakDb, centroidHz, flux, stereoWidth, then `binCount` power bins in dB from low to high frequency. Relay forwards only to dashboards with spectrogram enabled. |
| `/gan/turn` | string | raw move (e.g. "R", "U'", "F2") — port 8000 |
| `/gan/gyro` | float×4 | raw quaternion — port 8000 |
