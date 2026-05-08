# XenaKube — Operator's Manual

A physical instrument. You turn a Bluetooth Rubik's cube and a SWAM Cello plays. Twelve face-moves are the keyboard; the cube state under your hands modulates *what the gestures sound like*; tilt shapes bow color in real time, and turn rate adds bounded pressure/density.

Read this as: **(1)** what happens when you turn the cube, **(2)** the 12 face-moves and their musical identity, **(3)** the 8 sound-complex content layers, **(4)** what K_i / α-β-γ / tetra change about a given face, **(5)** the gyro layer, **(6)** named algorithm triggers, **(7)** modes and meta-controls.

---

## 1. The forward model

XenaKube has one design rule that everything else flows from:

> **Face owns shape. K_i owns material. C_i / tetra own content.**

The 12 face-moves (`L L' R R' F F' B B' U U' D D'`) each carry a *fixed* gesture identity — duration multiplier, envelope shape, articulation class, register bias, motion direction. K_i supplies the density, intensity, and base duration material that gets poured into that shape. The identity is welded to the GAN cube's color-fixed faces, so the same physical face always produces the same *kind* of sound, but not the same exact phrase.

This means as a performer you have a usable forward model: you know what kind of sound a turn will make. You don't know exactly which notes — that's the cube's job.

Per-turn loop (from `engine.ts`):

1. Cube reports a 90° click.
2. **Algorithm detector** sees the move, checks if the rolling buffer matches any of the 7 named cube algorithms (in 24 rotation variants). Logs match. Effects are currently **stubs** — no mode change wired (`mode-manager.ts:45-54`).
3. **Cosmology** advances. In `beta-cosmo`, K_i advances by the physical corner permutation for that face turn; gyro chooses the current top face, and the read-head selects the direction-aware collision endpoint for that quarter-move. Surrounding faces use CW top-right / CCW top-left; top/bottom faces use the edge facing the user. In `alpha-cosmo`, K_i and C_i use the historical S4 walks.
4. **C_i** advances only in alpha-cosmo. Beta-cosmo keeps C S4 as shadow metadata and holds C1..C8 fixed to local visible slots.
5. **Sieve** advances every 3 substitutions (metabola of the L(m,n) prime-residual pitch set).
6. If the move is one of the 12 face-moves, `/xk/face <face>` fires to Max (sets duration multiplier, envelope, articulation, motion, register bias for the imminent voice).
7. **Voice engine** picks the active vertex (direction-aware collision selector in beta-cosmo; historical step walk in alpha-cosmo) and emits `/xk/voice` with `(vertexIdx, complexType, density, intensity, duration)`. In sequential mode 1 vertex; in polyphonic mode all 8.
8. Max's `handleVoice` allocates the SWAM voice, snapshots face state onto it, and runs the matching `phraseC1..phraseC8` generator inside that instance.
9. Continuous gyro readings (60 Hz Kalman-filtered) drive bow position (CC 16) and S4 deviation telemetry; turn-rate tracking supplies regime plus continuous pressure. These shape the *current* note in real time — they don't trigger anything.

---

## 2. The 12 face-moves — gesture identity

Numbers below come from `FACE_SIGNATURES` (`src/face-gesture.ts:68-81`) and the envelope profiles in `ENV_PROFILE` (`src/swam-mapping.ts:132-159`). Duration numbers are multipliers: actual phrase time is `K_i duration * face multiplier`, then a small complex floor and 30 s cap are applied.

Half-turns (`U2`, `R2`, ...) are not face-moves: GAN hardware reports only quarter-turns, and the bridge expands them into two CCW quarter-turns. So `R2` = `R' R'` and produces *two* gestures back-to-back, not one.

`panBias` is reserved for stereo routing; SWAM Cello is mono so it currently has no audible effect. The pan column is the *intent* of each face-pair.

### U axis (top of the cube — bright register)

**`U` — bright pluck.** `0.70x`, envelope `pluck`, articulation `attack`, motion `up`, registerBias `+0.8` (≈ +10 semitones before global cello-range folding). Single-note collapse via `isSingle` for non-gliss complexes (C1/C4/C8 fold to one strike). Short release (`0.7×`). Hits like a thumbed harmonic on a high-register cello: clear front edge, no sustain. Velocity curve `flat`.

**`U'` — high fade.** `1.70x`, envelope `fade`, articulation `release`, motion `down`. Same high register as `U` but the energy lives at the back of the gesture, not the front: long release tail (`2.2× releaseMult`), `velCurve: 'dim'` so a multi-note rendering steps from `1.27` down to `0.72` velocity. Reads as the falling reflection of `U`.

### D axis (bottom — bass register)

**`D` — bass stab.** `0.60x`, envelope `stab`, `attack`, motion `down`, registerBias `-0.8`. Sharper attack ramp (`0.15× attackMult`) and a `peakMult: 1.15` so the peak is louder than the nominal intensity. `velCurve: 'accent-first'` — first note hits at `1.22×` then drops to `0.88×`. The lowest, most percussive face on the cube.

**`D'` — bass hairpin-up `<>`.** `2.50x` — the largest face multiplier on the cube. Envelope `hairpin-up`, `sustained`, motion `static`, registerBias `-0.8`. CC 11 is ramped directly along the hairpin trajectory by `schedulePhraseHairpin` (`xk_swam.js:1306`): rises through the middle and falls back. Reads as a long, slow bass swell that crests and dies.

### L axis (left — sustained legato)

**`L` — left swell.** `1.85x`, `swell`, `sustained`, motion `up`, registerBias `0.0`, panBias `-0.7`. Slow attack (`2.0× attackMult`), `peakMult 0.9`, `velCurve: 'cresc'` — a phrase whose notes step `0.72 → 1.27` velocity across its length. With C2/C3/C5/C6/C7 active this becomes a real bowed legato crescendo.

**`L'` — left fade.** `1.85x`, `fade`, `release`, motion `down`. Same multiplier and pan as `L` but reversed dynamic: the legato dies as it descends.

### R axis (right — percussive)

**`R` — short right stab.** `0.50x` — the shortest face multiplier. `stab`, `attack`, motion `static`, panBias `+0.7`. `peakMult 1.15`, `accent-first`. The closest XenaKube has to a snare: it's almost over before you notice it.

**`R'` — right burst.** `0.95x`, `burst`, `iterative`, motion `oscillate`. `countMult: 1.8` — multi-note phrases get nearly twice as many notes as the K_i density would otherwise produce. `accent-first` velocity curve. Short attack (`0.25×`), short release (`0.5×`). On C2/C3 this becomes a fast tremolo-like flurry; on C5/C7 it's a dense gliss salvo.

### F axis (front — sustained directional swell)

**`F` — front ascending swell.** `1.45x`, `swell`, `sustained`, motion `up`, registerBias `+0.3` (mid-high). `velCurve: 'cresc'`. Reads as the canonical "rising bowed phrase" of the cello.

**`F'` — front descending swell.** `1.45x`, `swell`, `sustained`, motion `down`. *Note:* `F'` shares the swell envelope (cresc velCurve), but motion is `down`, so the pitch trajectory and the dynamic trajectory go opposite directions. On C2 (committed-direction sieve walk) this means the line descends while the bow gets louder — a sigh that intensifies into the floor. Distinct from `L'`'s `fade`/`dim` profile.

### B axis (back — short attacks and trough hairpins)

**`B` — short back-pluck.** `0.90x`, `pluck`, `attack`, motion `static`, registerBias `-0.3`. Mid-low pluck. Quieter and longer than `D` but built on the same `pluck` envelope. With C1 active, the K_i density produces a small mid-range pizz cloud.

**`B'` — back hairpin-down `><`.** `2.25x`, `hairpin-down`, `sustained`, motion `oscillate`, registerBias `-0.3`. CC 11 traces the *trough*-in-middle shape: starts loud, dips, resurges. Motion `oscillate` flips ±2 semitones per turn (`xk_swam.js:2872-2876` — `state.turnCount % 2`), so two consecutive `B'` turns alternate direction. The largest low multiplier and the most internally tense gesture — the dip in the middle reads as held breath.

### Six pairs — the symmetry to memorize

| Pair  | Pan / register | Difference between the two |
|-------|---------------|----------------------------|
| U / U'  | high mono | up → pluck (front-loaded); down → fade (back-loaded) |
| D / D'  | low mono | down → stab (instant); static → `<>` hairpin (slow swell-decay) |
| L / L'  | left legato | up → swell-cresc; down → fade-dim |
| R / R'  | right percussive | static → stab (short); oscillate → burst (longer, denser) |
| F / F'  | front mid-high | both swells; F ascends, F' descends |
| B / B'  | back mid-low | static → pluck (short); oscillate → `><` hairpin (long) |

Within a pair the *envelope axis* changes, but the *family* (where it lives in the bow's space) stays. That's what makes 12 distinct faces still feel like 6 voices.

---

## 3. The 8 sound complexes — what fills the gesture frame

Xenakis' original 8 sound-complex types (`complexes.ts:14-23`), as actually rendered by the bridge phrase generators (`xk_swam.js:2384-2826`). Which complex is active on the active vertex is set by C_i state and the α/β/γ phase. Every face shape can be filled with any complex; the COMPLEX is the *texture* inside the face's frame.

Per-complex register clamps are currently commented out in the bridge and TypeScript phrase planner. That means C1-C8 are not locked to separate pitch windows; the sieve, face transpose, and phrase motion choose pitch, then the result folds only to SWAM Cello's global input range.

**C1 — Ataxic cloud of sound-points (pizzicato).** `phraseC1`, `xk_swam.js:2384`. Bow Polyphony: not used — pure pizz. Rate-driven: `5 plucks/sec × dur` before turn-rate pressure, even spacing with ±60 % jitter, **25 % chance of a 2-3 note cluster** at any pluck point. With `face=B` (0.9x, registerBias `-0.3`) you get a shorter mid-range pizz cloud; with `face=R'` (0.95x, `countMult 1.8`) the clusters thicken into a chattering swarm; with `face=D'` (2.5x, `<>`) the cloud spans the full hairpin and crests at the middle. The face's `isSingle` (pluck/stab/`<>`/`><`) collapses C1 to one strike.

**C2 — Ordered run, ascending or descending.** `phraseC2` uses a turn-rate-aware tempo curve, then `commitSieveWalk` locks the sieve direction to face motion. The phrase arc is per-note: velocity, CC 11, and bow position carry the cresc/dim/hairpin shape, while bow pressure picks one held value for each note. Intentional double-stops can occur after the anchor, but the baseline remains monophonic. With `face=L` C2 reads as a rising run that gathers intensity; with `face=F'` it descends while the bow energy rises.

**C3 — Ordered flat cloud (legato hovering, center fixed).** `phraseC3`, `xk_swam.js`. Like C2 but the pitch *jitters* ±1 around a center pitch instead of walking. ~50 % double-stops. Each held note starts a bow-position and bow-pressure ramp immediately at note onset; the ramp samples that note's CC 11, with lower CC 11 moving faster. Reads as a held cluster vibrating in place. With `face=B'` (`><` oscillate) you get a held cluster that breathes loud-soft-loud at the bow level while pressure/position keep shifting inside each note.

**C4 — Ionized atom: harmonics with pizz interferences.** `phraseC4`, `xk_swam.js:2472`. SWAM Harmonics CC 78 is enabled per voice (selected by tetra parity: even tetra → OCTAVE harmonic; odd tetra → OCTAVE+5TH — see `harmonicsForC4` in `swam-mapping.ts:246-248`). `2.5 attacks/sec × dur` before turn-rate pressure, **50 % chance** of a simultaneous 2-pitch double-attack at each event, jittered timing. Sparse, glassy, and sounds like a different instrument from the other complexes. The harmonic mode still brightens the timbre, but C4 is no longer pitch-confined to the high register. The tetra-driven harmonic mode is the only place the tetra index changes timbre directly rather than just inverting motion.

**C5 — Ataxic field of sliding sounds (wild gliss).** `phraseC5`, `xk_swam.js:2592`. Hard floor `WILD_MIN_COUNT` slides regardless of face envelope or intensity (`D49`: a stab face cannot reduce wild gliss to one slide — wildness is the complex's identity). Each slide is a pitchbend ramp of ≥ 8 semitones (`MIN_LEAP=8`) with `bendDur` scaled to the gap to the next event. Turn-rate pressure can raise the requested high count and the bow-pressure accent, but it cannot lower the wild floor. ~50 % companion double-stop on the anchor only; it is cleared before the first bend so the slide is not masked by a straight companion attack. With `face=R'` (burst, `countMult 1.8`, oscillate) this becomes a punishing dense slide-storm; with `face=D'` (2.5x `<>`) the slides ride the hairpin and sound like a Penderecki cello flourish.

**C6 — Ordered sliding asc/desc (sieve-stepped portamento).** `phraseC6`, `xk_swam.js:2667`. Anchor + sliding chain along the L(m,n) sieve, direction committed to face motion. `MIN_LEAP=1` (tiny intervals welcome), so the slides crawl up the prime-residue pitch ladder. ~50 % companion held alongside the chain — companion bends in parallel with the source via per-channel pitchbend, snaps back at each `completeBend` boundary (tick-tick-tick along the slide). With `face=L` you get the canonical "long bowed slide upward through the sieve". The cleanest, most "sliding" face/complex pair.

**C7 — Ordered flat slides (sustained anchor + micro-drift).** `phraseC7`, `xk_swam.js:2741`. Anchor legato + 1–3 small drifts of ±1–2 semitones around the anchor. First drift fires at `FIRST_GLISS_MS_C7=30 ms` so the breath-like character starts almost immediately after the anchor. Turn-rate pressure can thicken non-single drift count slightly, capped well below C5's density. With neutral face motion the drifts alternate sign per index, producing inhale/exhale rocking around the anchor. With `face=L`/`F` the drifts go monotonically up. Reads as held breath with subtle vibrato-like color shifts — distinct from C6's stepped walk.

**C8 — Atom: quasi-unison interferences (sul pont tremolo).** `phraseC8`, `xk_swam.js:2804`. SWAM Tremolo `FAST` (CC 79). Single noteon per phrase; SWAM's internal tremolo cycles the rebow (the bridge does not double-up on top). Turn-rate pressure increases tremolo speed and dynamic pressure, not note count. `30 %` chance of a held companion double-stop chosen once and reused across the phrase. Bow position pinned at `bowPosBase=5` (sul ponticello). With `face=D'` (2.5x, `<>`) C8 becomes a downward-biased tremolo that swells through the middle — a held tense bed. With `face=L` it's a sustained tremolo that crescendos.

---

## 4. The K_i layer — what's *under* the hands

K_i is the second cube. Its eight vertices carry a `(density, intensity, duration)` table (`vertices.ts:24-33`):

| Slot | Density | Dynamic | Duration | CC 11 peak | NoteOn vel |
|------|---------|---------|----------|------------|------------|
| K1 | 1.0 | ppp | 2 s | 15  | 16  |
| K2 | 1.0 | pp  | 5 s | 31  | 32  |
| K3 | 2.5 | p   | 5 s | 47  | 48  |
| K4 | 2.5 | mp  | 2 s | 63  | 64  |
| K5 | 1.5 | mf  | 3 s | 79  | 80  |
| K6 | 1.5 | f   | 4 s | 95  | 96  |
| K7 | 2.0 | ff  | 4 s | 111 | 112 |
| K8 | 2.0 | fff | 3 s | 127 | 127 |

Turn rate now adds a bounded pressure layer on top of this table:
`clamp((turnRate - 0.3) / (3.0 - 0.3), 0, 1)`. Per-complex `RATE_*`
gains raise density ceilings, note velocity, expression peak, bow pressure, C8
tremolo rate, and C5 bow-pressure accent. The gains are intentionally
different per complex so fast turning reads as pressure without flattening
K_i's density/intensity identity.

Physical face turns apply local 4-cycles to the 8 visible corners (`corner-topology.ts`). In beta-cosmo the active slot is chosen by `orientation.ts`: gyro first chooses the current top face, then the selected edge is either the turned side face's shared top edge or, for top/bottom faces, the edge facing the user. The active endpoint is the one the quarter-turn moves material into, so CW/CCW pairs land on opposite corners. In alpha-cosmo the active slot uses the historical step walk.

In polyphonic mode all eight K-rows fire simultaneously, each on its own SWAM instance, each with the complex assigned to its current C-cube vertex slot. (Note: the bridge ships with `POOL_SIZE = MAX_ACTIVE = 1` — single SWAM voice, per CLAUDE.md — so polyphonic mode currently steals voices in flight.)

**K_i pitch modulation.** `pitchClassMod(vertexIdx) = (idx * 7) mod 12` — a perfect-fifth spiral across the 12 pitch classes (`face-gesture.ts:119-121`). Consecutive vertices land in musically distant places, so the same face audibly repitches across K-turns without tracing a scale.

**Register bias from face.** `registerBias × 12` semitones. `U`/`U'` add `+10`, `D`/`D'` subtract `10`, `F`/`F'` add `+4`, `B`/`B'` subtract `4`. Stacked on top of K_i's pitch class.

**Motion nudge.** `MOTION_NUDGE: up=+2, down=-2, static=0, oscillate=±2 alternating per turn`. Adds a small directional pull on top of the pitch.

---

## 5. The C_i / α-β-γ layer — which complex is on which vertex

The alpha/beta/gamma mappings (`complexes.ts`) each assign C1..C8 to the 8 cube vertices in a different base order. Every 3 substitutions the phase rotates alpha -> beta -> gamma -> alpha in alpha-cosmo, and the sieve metabolises every 3 substitutions. In beta-cosmo, C1..C8 stay fixed to the ghost cube's local visible slots: slot 0 is C1, slot 3 is C4, and so on. The active K phrases with the C label in the same corner. `cGroup` may still follow the gyro snap as shadow metadata, but it does not rotate beta-cosmo complex placement.

Result: in beta-cosmo, repeating one face changes which K material sits under that face's read-head while the local C texture in that corner stays legible. In alpha-cosmo, the older S4/phase mapping still produces evolving complex assignments.

---

## 6. Tetra parity — the inversion switch

`tetraOrbit(K)` returns 0 (even — preserves the {V0,V2,V5,V7} tetrahedron) or 1 (odd — swaps it with the other tetrahedron). The bridge uses parity in two distinct ways:

- **For C4** — picks harmonic mode: even tetra → octave harmonic (CC 78 = 48), odd tetra → octave+5th (CC 78 = 80). `harmonicsForC4` in `swam-mapping.ts:246`.
- **For motion** (`parityInflection`, `face-gesture.ts:138-140`) — odd tetra inverts motion direction. So `face=L` (motion `up`) on odd tetra reads as motion `down`. This is the cleanest way to "play the same face but going the other way" without using the prime/unprimed pair.

---

## 7. Cube algorithms — pattern triggers

The detector watches the rolling move buffer (max 20 moves, 2 s timeout). When the tail matches one of seven canonical algorithms in any of 24 whole-cube rotations, it fires (`cube-algorithm.ts:142-190`). Algorithms layer: a longer match contains shorter prefixes; partial overlap is suppressed.

| Algorithm | Canonical | Length | Role |
|-----------|-----------|--------|------|
| sexy-move | `R U R' U'` | 4 | F2L trigger |
| oll-cross | `F R U R' U' F'` | 6 | 2-look OLL edges |
| sune | `R U R' U R U' U' R'` | 8 | 2-look OLL corners |
| anti-sune | `R U' U' R' U' R U' R'` | 8 | inverse |
| niklas | `R U' L' U R' U' L` | 7 | corner 3-cycle commutator |
| u-perm | `R U' R U R U R U' R' U' R' R'` | 12 | 2-look PLL 3-edge |
| t-perm | `R U R' U' R' F R' R' U' R' U' R U R' F'` | 15 | 2-look PLL corners+edges |

**Status — important.** All seven `effect` cases in `mode-manager.ts:45-54` are currently empty switch arms. Detection still fires (the dashboard logs the match, the algorithm history records it, listeners are notified) but **no mode changes** happen from algorithms. Effect rebinding is tracked as Phase B in `docs/todo.md` (algorithms-as-phrase-vocabulary).

So: today, executing a sexy-move plays four normal voices (one per `R`, `U`, `R'`, `U'`) and the dashboard prints `[algo] sexy-move`. There is no extra sound for the algorithm itself. This is the largest pending piece of the instrument.

**Half-turn convention.** GAN reports only quarter-turns. The book stores `U2` as `U' U'` (two CCW quarter-turns). Performers must flick half-turns CCW or the algorithm won't trigger.

---

## 8. Gyro expression — the continuous layer

Cube tilt and rotation are upsampled from BLE (~10 Hz) to 60 Hz via a velocity-aware quaternion Kalman filter (`relay.js`). Four normalized values come out (`expression.ts:8-17`):

| Param | Source | Range | Effect |
|-------|--------|-------|--------|
| tilt | pitch angle from quaternion | 0 (face down) → 1 (face up) | Bow Position (CC 16, lower-half `0..64`, EMA-smoothed `α=0.05` per D54) |
| spin | angular velocity | 0 (still) → 1 (~1 rev/sec) | Activity color / dashboard particles |
| deviation | distance from nearest S4 snap | 0 (locked) → 1 (boundary) | Telemetry; how far you are from a snap |
| scramble | BFS distance from solved | 0 (solved) → 1 (max) | Telemetry |

The 60 Hz quaternion goes to OSC (Max + TouchDesigner). The dashboard uses a SLERP-interpolated copy trailing by 120 ms to avoid extrapolation artifacts on static holds.

**Practical:** while most phrases are sounding, *tilting* the cube is your continuous bow-color control. Bow position (CC 16) is heavily smoothed so static-pose hand jitter doesn't produce 30 Hz bow buzz (`D54 BOW POS FLAP` invariant guards this), and the bridge keeps the motion inside the lower-half `0..64` window. Tilting shifts between brighter bridge-side and warmer fingerboard-side colors inside that band. C3 and C4 own bow position/pressure internally while their note ramps are active, and C8 skips live tilt so tremolo stays stable. Rotation while a phrase plays does not retrigger — the phrase is already in flight. Turn rate shapes the next voice's density/dynamic pressure at onset rather than acting as a 60 Hz gyro modulation.

**Zero Gyro.** The dashboard's Zero Gyro button (and its auto-zero on first connect) captures the current orientation as the rest pose, so the engine's S4 snap cells re-center on whatever hand position you call neutral. Use this if the cube is not aligned with the dashboard's intended axes. Performer shortcut: with the cube held in canonical pose (white face up), turn the white (U) face counterclockwise four times within 1.5 s — the dashboard fires the same Zero Gyro action without you reaching for the button. The gesture is gated on `upFace === 'U'` so it can't trigger accidentally in other holds.

---

## 9. Voice / engine modes & meta-controls

**Voice mode** (`voice-engine.ts`): `sequential` (1 voice: direction-aware beta-cosmo collision selector, historical step walk in alpha-cosmo) or `polyphonic` (all 8 fire each turn). Currently bridge-side `POOL_SIZE = 1` so polyphonic steals; treat polyphony as an experimental mode until the pool widens.

**Cosmology** (`engine.ts`): `beta-cosmo` is default. It uses physical corner topology and the direction-aware read-head in `orientation.ts`. `alpha-cosmo` restores the historical S4 K/C walks; boot with `XK_COSMO=alpha-cosmo` or send `set_mode.cosmology`. Switching cosmology resets structural state so the two logics do not contaminate each other. Physically solving the cube returns alpha-cosmo to beta-cosmo with that same reset; if already beta, the beta topology stays in place.

**K-cube mode** (`engine.ts`): `direct` / `diagram` are legacy UI names. Diagrams drive K_i only in alpha-cosmo; in beta-cosmo they advance as shadow metadata.

**C-cube mode**: `algorithmic` / `gyro` drive C_i assignment only in alpha-cosmo. In beta-cosmo they update C shadow state; complex placement is fixed local C1..C8.

**Freeze** (`mode-manager.toggleFreeze`): turns are still detected (and algorithm matches still fire) but K_i / C_i / sieve / step do not advance. Useful for deliberately repeating the *same* state through several turns to hear a single cube position from multiple gesture angles. Cube algorithm effects are stubs, so freeze is currently only reachable via dashboard / external trigger.

**Solve** (`engine.reportCubeSolved`): when the browser detects FACELETS = solved on an unsolved-to-solved edge, alpha-cosmo returns to beta-cosmo, phrase/audit state is reset, and `/xk/solve` fires. If the engine is already in beta-cosmo, solve leaves the current beta structure untouched and only fires the solve event.

**Panic** (`/xk/panic`): emitted on relay disconnect. Both bridges flush all notes and CCs. The performer can also panic via the Max patch.

---

## 10. A first-session walkthrough

A short tour for the first time you pick the cube up.

1. **Start the relay.** `npx tsx relay.js`. Open `http://localhost:3000` in Chrome (Web Bluetooth is required).
2. **Connect the GAN cube** in the dashboard. Hit **Zero Gyro** with the cube held in your intended rest pose.
3. **Open the SWAM Cello Max patch** so MIDI is alive. Confirm `[print xk_swam]` in the Max console echoes a `BRIDGE PITCHBEND_RANGE_SEMI` line on load — that's the D64 invariant; if the SWAM preset doesn't match, slides will be 24× weaker than the visual.
4. **Play one of each face** once, slowly, listening for the family relations:
   - `U` / `U'` — bright mono pair (pluck up, fade down)
   - `D` / `D'` — bass pair (stab, hairpin-`<>`)
   - `L` / `L'` — left-pan legato pair (cresc up, dim down)
   - `R` / `R'` — right-pan percussive pair (short stab, longer burst)
   - `F` / `F'` — front swell pair (rising, falling)
   - `B` / `B'` — back pair (short pluck, hairpin-`><`)
5. **Repeat one face six times in a row.** The face's gesture identity stays constant. What changes in beta-cosmo: the direction-aware selector lands on whichever K row currently occupies that collision corner, carrying density/intensity/duration with it; the C texture is the fixed visible C label in that same corner, and the sieve metabolises every 3 turns. By turn 6 you've heard the same face shape filled by changing K material against a stable local C map.
6. **Tilt the cube while a long resolved phrase is sounding** (for example, K2/K3/K6/K7 on `D'`, `B'`, or `L`). Tilt within the lower-half bow-position band to shift between bridge-side brightness and fingerboard-side warmth. This is the main mid-flight color control; turn rate affects the pressure of newly triggered voices.
7. **Try `R U R' U'` four times in a row.** Each `R U R' U'` = one sexy-move algorithm match (logged in dashboard) but currently no extra effect — what you're hearing is four ordinary face voices each time. The point is to feel that the move sequence still produces music even before algorithm effects are wired.
8. **Try gyro C-cube mode** (dashboard control) as a shadow-state display in beta-cosmo. It updates the C-group readout but should not change which complex is assigned to the active vertex. In alpha-cosmo the same C group is live.

---

## 11. Things to know about the toy as it actually exists right now

A few limits worth being honest about:

- **Algorithm effects are stubs.** Detection works; rebinding to phrase-library is the next big musical milestone (Phase B in `docs/todo.md`).
- **Polyphony is voice-stealing.** The SWAM bridge ships single-instance. Polyphonic voice-engine mode emits 8 voices but only the last one is audible.
- **Stereo is reserved.** `panBias` is in the data model but SWAM is mono. Multi-channel routing is a future hookup.
- **Pitchbend alignment is a recurring trap.** `PITCHBEND_RANGE_SEMI` in the bridge MUST equal the SWAM preset's pitchbend range value. Pitchbend status must also stay on the same MIDI channel as notes and CCs. If either drifts, dashboard telemetry can show bends while SWAM plays straight notes. Always check `[print xk_swam]` after preset edits or bridge reloads.
- **Half-turns are CCW-flicked or they don't trigger algorithms.** Speedcube default; muscle-memory it.
- **Solve sound design is pending.** The solve edge anchors alpha-cosmo back to beta-cosmo and emits `/xk/solve`; no dedicated solve phrase is bound yet.

---

That's the manual. The instrument is shaped: 12 face identities × 8 complex textures × K_i density/dynamic/duration material × direction-aware face selection × tetra parity × continuous gyro bow × bounded turn-rate pressure. Algorithms still await phrase effects; solve already acts as a beta-cosmo anchor, with dedicated solve sound design still pending. The face-as-keyboard model plus the collision-corner selector is the part that's load-bearing — practice that and the rest will start to read.
