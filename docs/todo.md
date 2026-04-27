# XenaKube — Roadmap

Implementation status is tracked here. Design rationale for the current direction lives in `docs/research_notes.md` → "Performer's Frame — Agency vs Chance." Completed SWAM-bridge diagnoses live in `docs/revision_roadmap.md` (D1–D39, refactor complete).

---

## Current architectural direction: Temporal Identity framework

Pivot accepted (2026-04-18). The next block of engine-level work addresses the performer's forward-model gap — the cognitive impossibility of simulating S4 × α/β/γ × tetra × path × turn-rate in real time. Four phases, in order. Xenakis-faithful technique remapping (A vs B) stays deferred until Phase A1 is playing and we can hear which mapping makes the face-signatures most distinguishable.

### Phase A1 — Face-identity gesture framework *(framework landed 2026-04-18; sculpt pass pending)*

**Goal**: each of 12 face-moves (L / L' / R / R' / F / F' / B / B' / U / U' / D / D') owns a distinct gesture *type* (short motive, envelope, articulation), fixed to the GAN cube's color-fixed face identity (orientation-invariant in 3D). K_i / C_i permutation modulates the *content* inside that shape (pitch class, register, intensity, timbre modifier). Forward model: performer predicts the *kind* of sound; *detail* still evolves with state.

**Where**: `src/engine.ts`, `src/face-gesture.ts`, OSC emission surface, `max/xk_swam.js` phrase dispatch.

- [x] **Face-signature table**: first-draft 12 × 6 signatures live in `src/face-gesture.ts` → `FACE_SIGNATURES`. Fields: `envelope` (pluck/swell/stab/drone/fade/burst), `durationBias`, `articulation` (attack/sustained/release/iterative), `panBias` (-1..+1), `registerBias` (-1..+1), `motion` (static/up/down/oscillate). Composition polish pass still to come — the current table is a plausible starting point, not a tuned instrument.
- [x] **Engine wiring**: `VoiceOutput.face: FaceMove | null` threaded from `engine.onTurn` → `VoiceEngine.emit` → `osc-output.voiceToOsc`. New `/xk/face <face>` OSC message fires BEFORE `/xk/voice` so the bridge has the signature loaded before phrase dispatch reads it.
- [x] **Modulation rules**: documented and exported as pure functions in `src/face-gesture.ts` — `pitchClassMod(vertexIdx)` (K_i → perfect-5th spiral), `registerMod(path, sig)` (registerBias × 12, halved on V2), `intensityScalar(path)` (V2 = 0.7), `parityInflection(tetraIdx)` (odd orbit → motion flip). C_i complex is a timbre modifier via the existing `phraseCX` dispatch in `max/xk_swam.js`.
- [x] **Max bridge (first-pass)**: `handleFace(face)` + `FACE_MAP` mirror of durationBias/registerBias; `handleVoice` now scales `duration` by `state.faceDurationBias` before every downstream timer (expression envelope, D39 tremolo ramp, release scheduling) and `pickPitch` adds `state.faceTranspose` to the fold. Phrase-shape sculpting (envelope/articulation/motion actually driving the phraseCX rendering, not just duration+register) is the next pass — land that when composition direction is clear.
- [x] **Tests**: `test/face-gesture.test.ts` (19 cases) — signature-table completeness, modulation-rule correctness, and engine-integration round-trip (same physical face → same identity regardless of K_i / C_i state; `/xk/face` precedes `/xk/voice`; half-turns → null face).

**Next sculpt pass:**
- [x] **Envelope / articulation / motion render at the bridge level** (2026-04-18). `ENV_PROFILE` (peakMult / attackMult / releaseMult), `ART_OFF_VEL` (per-articulation note-off velocity), and `MOTION_NUDGE` (±2 semitones, oscillate swings by turnCount parity) wire `sig.envelope` / `sig.articulation` / `sig.motion` into `state.peakExpr`, `scheduleExprEnvelope`'s `attackRampMs`, `scheduleRelease`'s ramp, and `noteOff()`'s velocity. Per-phrase shape contour inside `phraseC1..phraseC8` (the next item) is still pending — current pass shapes the *envelope around* each note but not the note-sequence shape inside the phrase.
- [x] **Phrase-shape rendering** (2026-04-21; gliss invariant patch 2026-04-23 / D42). `phraseC1..phraseC8` now consult per-instance `faceEnvelope` / `faceMotion` via `faceShapedCount` (`isSingle` → 1 note for pluck/stab/drone on non-gliss complexes; gliss complexes C5/C6/C7 are guaranteed ≥1 `glissStep` regardless of envelope — the gliss invariant outranks the collapse, see `CLAUDE.md § Bridge Invariants`. `countMult` 1.8× for burst), `stepVelScale` (per-step velocity curve — `cresc` for swell, `dim` for fade, `accent-first` for stab/burst), and `phraseReleaseMult` (≥2× release for drone so single notes ring). `commitSieveWalk(count, motion)` forces sieve direction on C2/C6 when face motion is `up`/`down`. `ENV_PROFILE` gained `attackCoef/peakCoef/sustainCoef` scalars so `handleVoice` multiplies the complex's exprEnv shape by the envelope archetype, giving each face a distinct CC 11 contour on top of its note count. Instance snapshot now freezes `faceEnvelope` and `faceMotion` categorically at `handleVoice` onset. Pending followup: tune the 12 signatures against live playing once the sculpt is audible.
- [x] **Phrase Dynamic Arcs Phase 1 (2026-04-26 / D47).** Sustained multi-note complexes (C2/C3/C4/C8) replace the legacy 3-stage attack/peak/sustain CC 11 envelope with a single linear ramp across the full phrase duration. swell faces → cresc TO K-dynamic, fade/burst → dim FROM K-dynamic. Self-balancing 3 cresc / 3 dim split across the 6 multi-note faces. isSingle envelopes and gliss complexes keep the legacy envelope. Per-phrase `arc=cresc 38->127 dur=2.50` telemetry + `ARC FAIL` natural-end assertion. Full design discussion (driver-choice rationale, steal balance, Phase 2 spec) in `docs/research_notes.md` § Phrase Dynamic Arcs.
- [ ] **Phrase Dynamic Arcs Phase 2 — adaptive multi-turn arc chaining (deferred).** When consecutive same-direction face-envelope voices arrive within a tight gap (~< 1 s onset-to-onset), the new voice's CC 11 starts at where the previous voice ended instead of restarting at `ARC_FLOOR`. Arcs *emerge* organically from coherent face-envelope sequences; break naturally on opposite-direction face, isSingle face (pluck/stab/drone — natural caesuras), or pause longer than the window. Reuses entire Phase 1 envelope code — only adds chain-state tracking (`state.lastVoiceEndMs`, `state.lastArcDir`, `state.lastArcCC11`). Two design choices to settle when implementing: (a) onset gap window (start with 1.0 s, tune from listening), (b) does R' burst chain into preceding swell (Bartók-arch cresc-into-burst-into-dim) or break the chain (treat burst as accent caesura) — lean *chain-and-flip*. Per-chain telemetry: chain length, total arc range, breaker reason. Ship Phase 1 + listen first; revisit window/break behaviour against actual feel.
- [ ] Pan bias: the `sig.panBias` field is currently unused (SWAM is mono). Deferred until a stereo routing path exists.
- [ ] Tune the 12 signatures against live playing — adjust durationBias / registerBias / envelope choices so all 12 faces are aurally distinguishable in sequence.

**Dashboard surfacing (split between A1 and C):**
- [x] **State panel — `face` row** (2026-04-18). Shows last quarter-turn's face + envelope tag (`R · stab`, `U' · fade`); hover tooltip exposes full signature. Self-contained mirror of `FACE_SIGNATURES` in `public/dashboard.html`.
- [ ] 12-face preview panel — *what each face would sound like right now given current K_i / C_i state* — deferred to Phase C Learning mode.

### Phase A2 — Solve-anchor *(not started, small change)*

**Goal**: physical solved cube = musical zero. Reset engine state on the unsolved→solved edge so every spell's effect starts from a known reference. Solving the cube during performance = returning to silence is both a cognitive anchor and a dramaturgical gesture.

**Where**: `src/engine.ts` `reportCubeSolved()` / `SolveListener` — already wired to fire on the edge, just not acting on engine state.

- [ ] On solve, reset: K_i to identity, C_i to α phase, path to V1, turn count to 0, scramble factor to 0, α/β/γ cycle to α, sieve to initial moduli (11, 13).
- [ ] Emit one final panic-style `/xk/voice` with intensity `p` and short duration, then go quiet until next turn — the "return to silence" moment.
- [ ] Broadcast full state burst so the dashboard reflects the reset.
- [ ] Don't reset the physical pose or gyro zero — those are independent.
- [ ] Test: solve → state reset; next turn fires from identity.

### Phase B — Phrase-library spell book *(not started)*

**Goal**: grow from 7 mode-toggle spells to ≈20 compositional phrase spells. Each spell is a short (≤6-move) sequence whose effect is a recognizable musical phrase, *replacing* the per-turn face-voices for the duration of the phrase. These are the performer's "sentences" — memorable enough to build muscle memory on, distinct enough to read on one hearing.

**Where**: `src/spells.ts` (spell list + effect types), `src/mode-manager.ts` (effect dispatch), `max/xk_swam.js` (phrase playback), eventually a `docs/spell_book.md` listing each spell with its algorithm + audio description.

- [ ] Define the spell-effect model: currently each spell has one of a handful of mode-toggle effect enums; extend to `{ kind: 'phrase', payload: PhraseSpec }` where `PhraseSpec` describes a composed sequence of notes / techniques / expressions over a defined duration.
- [ ] Design ≈20 phrase spells. Seed set (suggestions to refine later): rising arco arpeggio, descending pizz line, harmonic fanfare, sul pont scratch cluster, col legno tapping pattern, glissando sweep, tremolo crescendo, quiet drone, stuttered attack burst, etc. Composition work, not code — draft on paper, test by hand-firing OSC first.
- [ ] Reconcile with existing 7 spells: most become phrase spells; a couple (sexy-move as sequential/poly toggle) may stay mode-togglers as deliberate performer-controls.
- [ ] Suppress face-voice output during spell playback so the phrase is heard clean.
- [ ] Dashboard: spell-book panel showing algorithm + short audio preview per spell.

### Phase C — Dashboard split *(not started)*

**Goal**: performance-mode HUD that shows only what the performer needs to decide their next move; debug/learning mode that exposes the full state machine. Current dashboard is the debug mode, misidentified as performance HUD.

**Where**: `public/dashboard.html`.

- [ ] Add a mode toggle (Performance / Learning). Persist in `localStorage`.
- [ ] Performance mode surfaces: active vertex's upcoming voice signature (the *kind* — see Phase A1), spell buffer + which spells are one move from completing, distance-to-solved, regime badge. Nothing else visible.
- [ ] Learning mode surfaces everything current mode does *plus* a 12-face preview panel: small iconic/glyph-colored previews for L / L' / R / R' / F / F' / B / B' / U / U' / D / D' showing what the *next* move would sound like given current state. Recomputed on every turn so the performer can see *why* a U now differs from a U ten turns ago.
- [ ] Hover-to-audiate (optional, later): tapping a preview in Learning mode triggers a silent/quiet audition through the bridge. High-agency rehearsal tool.

### Phase D — Xenakis technique mapping (A vs B) *(decision deferred)*

**Goal**: choose between faithful rebuild (A) and pragmatic layering (B) of Xenakis' C1–C8 playing techniques onto the SWAM bridge. Full diagnosis in `docs/research_notes.md` → "Performer's Frame" and the conversation archive. Decision deferred until Phase A1 is playing and we can tell which mapping makes the 12 face-signatures most aurally distinguishable.

Current mapping (see CLAUDE.md "Conceptual mapping") is not Xenakis-faithful: col legno, scratched bow, and cross-technique combinations (tremolo+harmonics, harmonic tremolo) are all missing or simplified. The primary-source technique string from Xenakis' Nomos Alpha is `[pizz. f.c.l. an pizz.gl. a trem. harm. hr trem. asp asp trem. a interf.]` — tremolo appears on 4 of 8 complexes, harmonics on 2.

- [ ] Hold decision until 12 face-signatures are in place and auditioned.
- [ ] When ready: pick A (rebuild COMPLEX table to match Xenakis) or B (add secondary-technique rolls per voice, path/tetra-biased) or hybrid.

### Phase E — Real-time notation display *(tier 1 starting 2026-04-19)*

**Goal**: render the generated material as live staff notation on the dashboard. Audience-facing first (read the instrument's output), performer-facing second (post-hoc review). Not a performance aid — the cube and the ear are.

Three tiers of fidelity, implemented in order. Tier 1 is cheap and standalone; tier 3 is the long road that also unlocks Phase B.

**Tier 1 — Archetypal notation** *(landed 2026-04-20)*. Derive a StaveNote from each `voice` WS event using only what the engine already knows: pitch from `pitchClassMod(vertexIdx)` + `face.registerBias`, duration from `voice.duration` quantized to the nearest standard value (q / h / w), dynamic from `voice.intensity`, articulation glyph from `face.envelope` (pluck → staccato, stab → accent, drone → fermata, etc.). No attempt to match what SWAM's internal phraseCX generator actually plays — just the archetype of the gesture. Rolling buffer of last N=8 notes, re-render on each voice event.

- [x] VexFlow 4.2.3 via CDN added to `public/dashboard.html`.
- [x] WS `voice` message handler wired in `ws.onmessage`.
- [x] `voiceToStaveNote(voice)` + `pickNotationPitch` pure helpers; one bass-clef staff, no key signature (sieve pitch classes aren't diatonic).
- [x] `.notation-strip` overlay — top-center inside `.ovl-tc`, below the spell row. Transparent background, `min-height: 90px`, hidden until first voice arrives.
- [x] Render on voice event; rolling buffer caps at 8 — oldest simply drops when a 9th arrives (no fade yet).
- [ ] Polish: fade-in on new note + fade-out on dropped note (currently hard swap).
- [ ] Polish: accidental handling feels jittery with `pitchClassMod` — consider quantising to nearest sieve pitch once tier 2 lands, or leave as the tier-3 rebuild will replace this.
- [ ] Visibility gate: hide the strip below some viewport width / in Performance mode (Phase C).

**Tier 2 — Literal echo** *(rev A 2026-04-23 VexFlow staff → rev B 2026-04-24 canvas piano-roll → rev C 2026-04-24 fullscreen background → per-complex brush palette + viewport-relative scaling + score-speed slider 2026-04-24/25)*. The tier 1 archetypal strip didn't survive polyphonic mode (every turn rendered the same 8-pitch-class cluster), so rev A jumped straight to faithful transcription via the Max → relay → dashboard echo path. Rev A's VexFlow 5-bucket duration quantisation threw away actual timing and rendered glissandi as disconnected staccato notes; rev B replaced it with a time-continuous canvas. Rev C moved the canvas from a top-center inline strip to a `position: fixed; inset: 0; z-index: -1` fullscreen background behind the cube. The brush-palette pass replaced the single-style rect with per-complex procedural brushes evoking specific Photoshop brush families (`docs/brushes.png`): pizz=spatter, arco=rough wash / watercolor, harm=airbrush halo, gliss=continuous Path2D stroke, sul-pont trem=chalk grit. Brush vertical dimensions are now row-height-relative (`bu(factor) = rollRowH * factor * ROLL_BRUSH_SCALE`) so they stay proportional across screen sizes. Pitch axis maps into an inner rectangle (`ROLL_TOP_INSET_PX = 70` / `ROLL_BOTTOM_INSET_PX = 80`) so extreme high/low notes don't render under overlays. The wire format gained a 4th arg `complex` (0..8) on `noteon` / `noteoff` so the dashboard knows technique and gliss-chain grouping.

- [x] Max-side echo: `ECHO_OUTLET = 2` in `xk_swam.js`; `emitEchoNote()` fires from `noteOn` / `noteOff` (keyswitches bypass); panic echo from `bang()`. 4th arg `inst.activeComplex` added to the payload.
- [x] Patch-side: `[udpsend 127.0.0.1 57122]` cord from rightmost v8 outlet — wired and confirmed receiving notes 2026-04-24.
- [x] Relay-side: `node-osc` `Server` on `MIDI_ECHO_PORT = 57122`; per-packet forward as `{type:'midi_echo', data:{kind,voice,pitch,velocity,complex}}`.
- [x] Dashboard-side rev A: VexFlow 16-note buffer with duration quantisation. *(Replaced by rev B.)*
- [x] Dashboard-side rev B: canvas piano-roll, rAF render loop, complex-coloured rects, gliss connectors. *(Replaced by per-complex brush palette + per-chain Path2D for gliss.)*
- [x] Dashboard-side rev C: fullscreen background canvas behind cube; per-complex brush palette (spatter / rough-wash / watercolor / airbrush / chalk + single Path2D for gliss chains); viewport-relative brush scaling via `rollRowH`; pitch-axis insets; score-speed slider with `localStorage` persistence; per-key FIFO for in-flight notes (handles overlapping same-pitch noteons from C8 rebows + double-stop companion); 45 s watchdog preserved.
- [ ] Post-playtest: tune `ROLL_BRUSH_SCALE` (1.4) and gliss line factor (0.85 inside `drawGlissChain`) against actual feel.
- [ ] Consider per-face glyph overlay on the right-edge "now" line (when `/xk/face` arrives) — one tiny letter (`L`/`R'`/etc.) on top of the freshly-painted note rect to restore the face-articulation glyphs that rev A's VexFlow annotations carried.

**Tier 3 — Deterministic rebuild via two-brain split** *(gated on Phase B — see below)*. Move note-generation from `max/xk_swam.js` (`phraseCX`, `pickPitch`, `foldToRange`, stochastic counts) into TS. Max becomes a pure performance / MIDI-rendering layer that receives a note-list and plays it. Notation then renders from the same data the bridge plays — zero drift, guaranteed correct, trivial code.

This IS Phase B's dependency. Building a TS-side phrase library is what gives us tier-3-grade notation for free; inversely, committing to tier 3 is what makes the phrase library pleasant to author. Sound does not change — the compositional decisions happen in the same RNG and sieve math, just relocated.

- [ ] Pilot: port `phraseC1` (pizzicato) from Max to TS behind a `USE_TS_PHRASES` flag. A/B against the Max version until they sound indistinguishable.
- [ ] Port C2–C8 one complex at a time; retire each Max `phraseCX` function as its TS counterpart lands.
- [ ] Add `voice_stream` WS / OSC channel carrying the TS-generated note list so the dashboard renders exactly what the bridge plays.
- [ ] Revisit tier 1 / tier 2 codepaths — collapse into tier 3 once stable.

---

## Prior direction: Three performance regimes

Retained as active substrate — regime classification (`turn-rate.ts`) is already used by the Max bridge for attack-ramp / expression-ramp scaling (D33). Further buildout of burst-mode aggregates is on hold until Temporal Identity phases land; the regime axis complements the new framework rather than competing with it.

| Regime | Turn rate | Musical character | Status |
|--------|-----------|-------------------|--------|
| **Contemplative** | < 0.3 Hz | Each event distinct, full voice playback, structure audible | Done |
| **Conversational** | 0.3–2 Hz | Events overlap, spells are deliberate gestures, texture builds | Partial |
| **Burst** | > 2 Hz | Structure collapses into texture, aggregate parameters dominate | Not started |

Pending regime work (held until Temporal Identity is in place — some of these items may restructure or merge into the new phases):

- [ ] **Polyphonic voice stacking (SWAM side)** — needed for Conversational mode. Layer voices via multiple SWAM instances or the bridge's Bow Polyphony CC; emit release envelope on previous voice instead of hard-stop.
- [ ] **Dashboard spell-history trail** — persistent markers on a timeline rather than toasts; pairs naturally with Phase C Performance-mode HUD.
- [ ] **Burst aggregate state** — `/xk/agg/*` bundle (avgDensity, avgIntensity, complexDistribution histogram, sieveDensity, recentSpells) at ~15 Hz; drives a dedicated "cloud/wash" texture path in the bridge that replaces individual-voice playback above the regime threshold.
- [ ] **Regime crossfade** — ~0.5 s fade between individual-voice and aggregate-texture paths in the bridge on `/xk/regime`.
- [ ] **Scramble arc** — in burst mode, scramble factor becomes master parameter; 1.0 (scrambled) = dense/loud/chaotic, 0.0 (solved) = sparse/quiet/pure. Natural 10–15 s solve-decrescendo. Pairs with Phase A2 solve-anchor.
- [ ] **Path B equivalent** — after ~5 s of silence, activate a sustained gyro-expression drone until turns resume. Formalized structure pauses; instrument still breathes.

---

## SWAM Cello bridge refactor — COMPLETE

D1–D39 all resolved. Detailed write-ups in `docs/revision_roadmap.md`. Latest (2026-04-18): D36 V2 reachability, D37 harmonics rotation, D38 CC 80 reachability proof (superseded), D39 per-phrase stochastic tremolo envelope.

No further SWAM-specific refactor work is planned. New bridge changes that become necessary during Phase A1 (face-gesture dispatch) or Phase B (phrase-library playback) get tracked as part of those phases, not as new D-entries.

---

## Tier 1 architectural shift — COMPLETE (2026-04-21)

Three drift-closers landed together. Deliberately not given D-numbers — this is infra, not SWAM-mapping diagnosis.

- [x] **Outlet collapse** — `max/xk_swam.js` from `POOL_SIZE + 1` outlets (per-instance MIDI + debug) to 2 outlets (shared `target N` + `midievent` on outlet 0, debug on outlet 1). `inst.outlet` → `inst.voice`. New `emitMidi(inst, …)` helper. Changing `POOL_SIZE` no longer requires patch re-wiring.
- [x] **OSC schema unification** — new `src/osc-schema.ts` as single source of truth; `src/osc-output.ts` + `relay.js` use `OSC.*` constants; Max reads from generated include file. Zero raw `/xk/*` / `/gan/*` literals outside `src/osc-schema.ts`.
- [x] **Shared SWAM mapping + codegen** — new `src/swam-mapping.ts` (enums, CC value maps, INTENSITY_MAP, ENV_PROFILE, ART_OFF_VEL, MOTION_NUDGE, FACE_MAP builder, REGIME_* multipliers, pure helpers); 37-case vitest suite; `scripts/gen-max-include.js` emits `max/gen_includes.js`; `npm run gen:max` script wired. 14 duplicated declarations removed from `xk_swam.js`.

Tier 2 / Tier 3 (hand-written function de-duplication — e.g. porting `phraseCX` to TS behind a `USE_TS_PHRASES` flag) stays gated on Phase B + Phase E tier 3.

---

## Dependency graph

```
Phase A1 (face gesture framework) ─┬─ Phase A2 (solve anchor)  ─┐
                                   │                             │
                                   └─ Phase C (dashboard split) ─┤
                                                                 │
Phase B (spell phrase library) ──── shares two-brain work with ──┤
                                                                 │    Phase E tier 3
Phase D (Xenakis A vs B) ── decision gated on A1 completion ────┤
                                                                 │
Phase E (notation) ─ tier 1 standalone ─ tier 3 ⇔ Phase B ──────┘
```

Rough sequencing: A1 first (the new substrate), then A2 in parallel with C's Learning-mode preview panel (they both surface face-signatures). Phase E tier 1 can slot in anytime — it only consumes `voice` events — so we start it in parallel with any other work. Phase B and Phase E tier 3 share the Max→TS note-generation migration and should land together; D follows once the gestural palette is rich enough to judge against.
