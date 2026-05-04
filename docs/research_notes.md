# Research Notes

Accumulated references, design rationale, and source material for XenaKube.

## Primary Source

**Xenakis, I. (1992). *Formalized Music: Thought and Mathematics in Composition*. Revised edition. Pendragon Press. ISBN 978-1-57647-079-4.**

Chapters VII–VIII ("Symbolic Music" / "Towards a Philosophy of Music"), pp. 214–237. Full extraction in `docs/xenakis_nomos_alpha_primary_source.md`.

**Xenakis, I. (1966). *Nomos Alpha* for solo cello. Boosey & Hawkes.**

Premiere: 1966, Bremen. Performer: Siegfried Palm. Duration: ~17 minutes.

## What XenaKube takes from Nomos Alpha

Nomos Alpha was the first composition to use group theory (specifically the rotation group of the cube, S4) as a structural principle. XenaKube reuses the core mathematical apparatus but replaces the fixed score with a real-time instrument controlled by a physical Rubik's cube.

### Retained from Xenakis

| Concept | Source (pp.) | Implementation |
|---------|-------------|----------------|
| S4 (hexahedral group, 24 rotations) as organizer | 218–220 | `group.ts`: BFS-generated, Cayley table, 8-vertex permutations |
| K_i vertices as D×G×U parameter triples | 218–220 | `vertices.ts`: single `VERTICES` table (D and U inherited from V1's per-vertex distribution; G expanded from V1's 4-level alphabet to the full ppp..fff 8-step palette so the cube always exposes every dynamic level) |
| ~~Two paths V1 (loud/short) and V2 (quiet/long)~~ | 218–220 | XenaKube collapses to a single path — V1's character lives implicitly per vertex, V2 retired in favour of dynamic-palette completeness |
| C_i sound complex types (C1–C8) | 222–224 | `complexes.ts`: 8 timbral categories |
| α/β/γ cyclic mapping rotation | 222 | `complexes.ts`: ALPHA, BETA, GAMMA arrays, cycle every 3 subs |
| Second independent cube for C_i | 222–224 | `complexes.ts`: ComplexCube class. Advance law shifted by fixed `C_SHIFT = U` in `engine.ts` so C diverges from K (Xenakis §IV: C_i and K_i traverse *separate* closed graphs, "C_i graph {D Q12}" vs "K_i graph {D Q3}") |
| Kinematic diagrams (graph paths through S4) | 220–222 | `kinematic.ts`: cyclic subgroups + Hamiltonian path |
| Sequential (t₀) vs simultaneous (t₁) temporal modes | 220 | `voice-engine.ts`: sequential/polyphonic modes |
| L(m,n) sieve function for pitch | 230–234 | `sieve.ts`: evaluateSieve, prime residual classes mod 18 |
| Metabola (sieve mutation via residual class multiplication) | 230–234 | `sieve.ts`: metabola(), advance every 3 substitutions |
| Tetrahedral orbit classification (even/odd) | 218 | `group.ts`: tetraOrbit(), vertices {0,2,5,7} vs {1,3,4,6} |
| θ₀ (complexes traverse vertices) / θ₁ (H×X traverses) | 214–217 | Engine modes: direct, diagram, algorithmic, gyro |

### Added by XenaKube (not in Xenakis)

| Feature | Rationale |
|---------|-----------|
| Physical Rubik's cube as input device | Xenakis composed a fixed score; we make it a live instrument. The cube's S4 symmetry is the same group Xenakis used. |
| Cube-algorithm detection (Rubik's algorithm recognition) | Known algorithms (sexy-move, sune, T-perm, etc.) serve as gestural "words" the performer can deliberately execute. Maps finger-pattern vocabulary onto mode changes. |
| Orientation-independent algorithm matching | A cuber's muscle memory is face-relative. Expanding each algorithm to all 24 rotations means a sexy-move pattern works on any face pair. |
| CFOP-core algorithm book (7 algorithms) | Current vocabulary: 6 CFOP fundamentals (sexy-move, oll-cross, sune, anti-sune, u-perm, t-perm) + Niklas (archetypal commutator). Orientation-independent via 24-rotation expansion. The 4-move sledgehammer was intentionally dropped — too easy to hit accidentally. See `docs/todo.md` Phase B: pivoting to a ~20-entry phrase library where most algorithm matches become composed musical phrases rather than mode-toggles. |
| Gyro → S4 snap (continuous → discrete) | The cube's physical orientation in 3D maps to the nearest of the 24 S4 rotations via quaternion dot product. This bridges continuous gesture and discrete group math. |
| Expression parameters (tilt, spin, deviation, scramble) | Continuous gyro-derived values for real-time sound control. Deviation = how far from the nearest S4 snap; scramble = BFS distance from identity. |
| Scramble factor as meta-parameter | BFS distance from identity in the S4 Cayley graph. Diameter is ≤6 (small group). Normalized 0–1. "How far from solved" as a musical parameter. |
| Browser dashboard as performance HUD | Makes the abstract math legible in real time: 3D cube, vertex parameters, complex assignments, sieve strip, cube-algorithm progress, expression gauges. |
| Kalman filter gyro upsampling | BLE delivers ~10Hz; synthesis needs 60Hz. Velocity-aware quaternion prediction fills the gaps. |

## S4 Group — Key Properties

- **Order**: 24 (= 4!)
- **Isomorphic to**: symmetric group P₄ (permutations of 4 objects — the 4 body diagonals of a cube)
- **Generators**: any two non-commuting rotations suffice; we use X90, Y90, Z90 (face 90° rotations around 3 axes)
- **Subgroup structure**: 1 trivial, 3 of order 2, 4 of order 3, 1 Klein four-group (order 4), 3 of order 4, 4 of order 6, 1 A₄ (order 12), 1 S₄ (order 24)
- **Tetrahedral subgroup A₄**: the 12 even permutations. A cube has two interlocking tetrahedra; A₄ preserves which is which, the other 12 swap them.
- **Cayley graph diameter**: ≤6 with {X90, Y90, Z90} + inverses as generators. Every element reachable in at most 6 steps.
- **Representation used**: vertex permutations of 8 cube corners (faithful action). Element 0 = identity = `[0,1,2,3,4,5,6,7]`.

### Move mapping

Physical Rubik's face turns (18 moves: 6 faces × CW/CCW/180°) map to whole-cube rotations. Opposite-face turns map to the same S4 element (R and L' are the same rotation). The 18 moves collapse to approximately 9 distinct S4 elements.

This is a key design choice: Xenakis used the full S4 group, but a real Rubik's cube is "bigger" than S4 (the Rubik's group has ~4.3×10¹⁹ elements). We project the high-dimensional Rubik's state onto S4 by treating each turn as a whole-cube rotation, ignoring the internal slice structure.

## Sieve Theory

Xenakis' sieve theory generates non-octave-repeating pitch sets from modular arithmetic.

**L(m,n)** = `(n₁ ∨ n₂ ∨ nₖ ∨ nₗ) ∧ mₚ ∨ (mq ∨ mᵣ) ∧ nₛ ∨ (nₜ ∨ nᵤ ∨ nᵥ)`

- Each `nᵢ` is a sieve {integers ≡ i mod n}
- ∨ = union, ∧ = intersection
- Starting moduli: m=11, n=13 (from the prime residual classes mod 18: {1, 5, 7, 11, 13, 17})
- **Metabola**: multiply m,n by the next residual class mod 18, reducing mod 18. This transforms the sieve — some pitches appear, others vanish.
- Metabola fires every 3 cube substitutions (matching the α/β/γ complex cycle rate).
- Range: 0–48 semitones (4 octaves). 0 = C2 (MIDI 36).

The resulting pitch sets are irregular — they don't repeat at the octave, don't form traditional scales, and change character with each metabola. This is exactly what Xenakis intended: "distributions that are not periodic."

## Sound Complex Types (C1–C8)

From Xenakis' original descriptions (p. 222), mapped to the SWAM Cello bridge (`max/xk_swam.js`; see `CLAUDE.md` → "Conceptual mapping"):

| Type | Xenakis Description | SWAM Technique |
|------|---------------------|----------------|
| C1 | Ataxic cloud of sound-points | Pizzicato cloud |
| C2 | Ordered ascending/descending cloud | Arco with directional sieve walk |
| C3 | Ordered flat cloud | Arco legato, narrow pitch window |
| C4 | Ionized atom (interferences + pizzicati) | Harmonics clustered at sieve centroid (path × tetra selects OCT / OCT_5TH / CTRL) |
| C5 | Ataxic field of sliding sounds | Portamento, ataxic |
| C6 | Ordered ascending/descending sliding | Portamento with directional sieve walk |
| C7 | Ordered flat sliding | Portamento, narrow register |
| C8 | Atom (quasi-unison interferences) | Near-bridge + tremolo |

The α/β/γ mappings shuffle which complex type sits at which vertex position. For example, vertex 1 gets C7 in α, C2 in β, and C5 in γ. Some vertices are stable across phases (vertex 0 always gets C1; vertex 6 always gets C8).

**Xenakis primary-source technique string.** `[pizz. f.c.l. an pizz.gl. a trem. harm. hr trem. asp asp trem. a interf.]` — tremolo appears on 4 of 8 complexes, harmonics on 2, and several complexes are combinatorial (tremolo+harmonics, harmonic tremolo). The SWAM bridge above is a cello-idiomatic approximation; decision on a Xenakis-faithful rebuild (A) vs pragmatic layering (B) is deferred until the face-identity gesture framework is playing — see `docs/todo.md` Phase D.

## Hardware

**GAN i4 Smart Cube**: Bluetooth Low Energy Rubik's cube with built-in gyroscope. Detected via Chrome's Web Bluetooth API using the `gan-web-bluetooth` npm package.

- Move detection: reports face + direction for each turn
- Gyro: quaternion orientation at ~10Hz BLE rate
- Connection: requires MAC address entry in dashboard

## Recordings and Performances of Nomos Alpha

Key reference recordings for understanding the original piece:

- **Siegfried Palm** (1966) — premiere performer, recorded for Wergo
- **Pierre Strauch** (various) — extensive Xenakis interpreter
- **Arne Deforce** (2011, Mode Records) — acclaimed modern recording
- **Rohan de Saram** (1991, Etcetera) — lyrical interpretation

## Related Works by Xenakis

- **Nomos Gamma** (1967–68) — orchestral generalization of Nomos Alpha, uses same group-theoretic framework with spatial distribution of players
- **Herma** (1961) — piano solo, set-theoretic operations on pitch sets (proto-sieve)
- **Eonta** (1963–64) — brass + piano, early use of group transformations
- **Akrata** (1965) — 16 winds, group theory applied to timbral organization
- **Persephassa** (1969) — 6 percussionists in circle, spatial rotation related to group symmetry

## Further Reading

- Xenakis, I. (1992). *Formalized Music*. Pendragon Press. (Revised edition with additional chapters)
- Bois, M. (1967). *Iannis Xenakis: The Man and His Music*. Greenwood Press.
- Harley, J. (2004). *Xenakis: His Life in Music*. Routledge.
- Solomos, M. (2019). *From Music to Sound: The Emergence of Sound in 20th- and 21st-Century Music*. Routledge.
- Varga, B. A. (1996). *Conversations with Iannis Xenakis*. Faber & Faber.
- DeLio, T. & Orcutt, S. (eds.) (2010). *Xenakis: The Anastenaria*. Pendragon Press.
- Squibbs, R. (2002). "Some Observations on Pitch, Texture, and Form in Xenakis' Mists." *Contemporary Music Review*, 21(2–3).
- Jones, E. (2001). "Residue Class Sets in the Music of Iannis Xenakis." PhD dissertation, University of Georgia. (Detailed sieve analysis)
- Wannamaker, R. (2001). "Structure and Perception in Herma by Iannis Xenakis." *Music Theory Online*, 7(3).

## Quaternion ↔ S4 Correspondence

The 24 cube rotation quaternions fall into three geometric types (see `quaternion.ts`):

| Type | Count | Quaternion form | Geometric meaning |
|------|-------|-----------------|-------------------|
| Face rotations (90°/270°) | 6 | One component ≈ ±0.7071, w ≈ 0.7071 | 90° around face center |
| Face rotations (180°) | 3 | One component = ±1, w = 0 | 180° around face center |
| Vertex rotations (120°/240°) | 8 | Three components = ±0.5, w = 0.5 | 120° around body diagonal |
| Edge rotations (180°) | 6 | Two components ≈ ±0.7071, w = 0 | 180° around edge midpoint |
| Identity | 1 | [0, 0, 0, 1] | No rotation |

Snap-to-nearest uses `|dot product|` because q and -q represent the same rotation. Maximum angular distance between adjacent S4 elements is ~π/4 (45°). The deviation factor normalizes this to 0–1.

## Performer's Frame — Agency vs Chance

### The reframing question

Not "which playing techniques go on which vertex" — that's downstream. Upstream: **where on the chance ↔ agency spectrum should the instrument sit, and what vocabulary of intentional move-sequences should exist alongside the stochastic generation?** Sharper: what's the *forward model* — the internal prediction a performer runs in their head before turning the cube — and is it simple enough to run in real time?

### Diagnosis of the discomfort

Xenakis composed chance music and handed cellists a *fixed score*. The performer never experienced the chance, only the result — they rendered what had already been chosen. XenaKube inverts this: it puts the performer *inside* the stochastic machine and asks them to both run it and play it. The cognitive load of simulating S4 × α/β/γ × tetra parity × path × turn-rate → intended voice is, correctly, impossible in real time. That's not a skill gap; the forward model is too wide to fit in working memory.

Speedcubers solve the equivalent problem by **chunking** — `R U R' U'` isn't four moves, it's one gesture with one known effect. The existing cube-algorithm book gestures at this solution but stops short at seven mode-toggles. A Rubik's analogy only pays off at *vocabulary scale* — on the order of twenty memorable short sequences, not seven.

### Design principles that follow

1. **Anchor to solve.** The physical cube's solved state should be a musical zero — identity K_i, α phase, V1 path, silent. Every algorithm's effect becomes legible because it always starts from the same reference. Solving the cube = returning to silence is a dramaturgical arc as well as a cognitive one.

2. **Vocabulary, not modes.** Grow the algorithm book from seven mode-toggles into ≈20 short (≤6-move) *musical phrase* algorithms — "rising arco arpeggio," "pizz cluster," "harmonic fanfare," "descending sul pont line." These are the performer's sentences.

3. **Forward-model audibility.** Each individual face-turn should produce a sound the performer can predict before committing to the turn. One way: fix each of the 12 face-moves (L / L' / R / R' / F / F' / B / B' / U / U' / D / D') to its own gesture-type and phrase duration, using the GAN cube's color-fixed face identity (not the hand frame). Then K_i / C_i permutation modulates the *content* inside that known shape, rather than choosing or stretching the shape.

4. **Dashboard diet.** The full-state HUD is a debug view. Performance mode should surface only what the performer needs to decide their next move: the active vertex's upcoming voice, which algorithms are one move from completing, distance-to-solved. More information at all times, paradoxically, means less comprehension.

### Program-notes one-liner

> XenaKube is Xenakis' *Nomos Alpha* machinery, but the machine sits inside the performer. Each cube turn runs a group-theoretic transformation that determines the next sound, so the performer composes by permuting. Agency comes back through two doors: a vocabulary of known move-sequences (like a speedcuber's algorithms), and a physically-anchored zero state (the solved cube = silence). Between the two, chance and intention share the same instrument.

## Two-Brain Architecture — Compositional vs Performance Layers

### The current split (circa Phase A1)

Engine-side (`src/*`) computes *structural* decisions: which S4 element, which complex, which vertex, which face identity, what density/intensity, and the face-owned duration table. Max-side (`max/xk_swam.js`) computes *phrase-level* note-generation: which pitches inside the `foldToRange` window, how many rebows, stochastic timing, the per-complex phrase contour. Both layers make composition-relevant decisions; only the engine side is reachable from the dashboard.

This worked fine as long as the only consumer of the bridge's output was the cellist's ear. It stops working cleanly the moment we want a second consumer — real-time notation, a recording log, a training tool — because the dashboard can't know what Max is doing without re-implementing the Max RNG and sieve logic in JavaScript.

### The migration

**Compositional brain → TypeScript, performance brain → Max.** Over Phase B + Phase E tier 3, relocate every stochastic / musical-decision function in `xk_swam.js` (`phraseC1`..`phraseC8`, `pickPitch`, `foldToRange`, the per-complex count/spacing randomizers) into `src/`. Max becomes a dumb-MIDI renderer that accepts a note-list + CC schedule and plays it. The dashboard consumes the exact same note-list for notation.

### Why this doesn't change the sound

The migration is a transposition of *where* the math runs, not *which* math runs. Same RNG (use the same seeded PRNG on both sides during A/B), same sieve, same fold function, same timings. The cellist's instrument — the SWAM physical model, bowing, KS + CC — lives on the Max side and is untouched. In pilot we run both layers under a `USE_TS_PHRASES` flag and A/B them until they sound indistinguishable; then we retire the Max `phraseCX` and commit.

### Why this is worth doing

- **Notation correctness is free.** Dashboard renders from the same data Max plays.
- **The phrase library (Phase B) becomes pleasant to author.** Phrase algorithms are short TS functions returning a note-list — versionable, testable, dashboard-previewable. Writing them inside Max is currently the main friction against growing the algorithm vocabulary.
- **Recording / replay is trivial.** A performance is just a sequence of TS-generated note-lists; re-rendering through a new bridge (e.g. a different VST) is one function away.
- **Max-side code shrinks.** The bridge becomes ≤100 lines of MIDI + CC routing. Everything else moves to tested TypeScript.

### What stays in Max

- `vst~` hosting SWAM and `dac~` output.
- KS / CC translation (note-list → `midievent`).
- Real-time expression envelope slewing (CC 11 / CC 80 ramps). These ARE performance-layer concerns — they run inside the SWAM note lifecycle, not the compositional timeline.
- Panic / cleanup / inactivity watchdog.

Decision gate: start the pilot when Phase A1 sculpt-pass is complete (phrase-shape rendering would be the first thing to port, so it's cheaper to write it in TS from the start once we commit). Track as Phase B + Phase E tier 3 in `docs/todo.md`.

## Performance Speed Regimes

A Rubik's cube introduces a performance dimension Xenakis never dealt with: the rate of group transformations is controlled by the performer in real time, and varies by orders of magnitude.

### The numbers

A typical CFOP speedsolve: ~55 moves in 10–15 seconds (~4–5 turns/sec). Through the engine:

| Outcome | Count in ~55 moves |
|---------|-------------------|
| Full vertex cycles (step % 8) | ~7 |
| Sieve metabolae (every 3 turns) | ~18 (full residual class cycle) |
| α/β/γ phase changes | 6 full cycles |
| Cube-algorithm detections | Many — a CFOP solve IS a sequence of algorithms |
| Distinct S4 states visited | up to 55 (with revisits) |

In Nomos Alpha, 18 group transformations unfold over ~17 minutes. A speedsolve compresses equivalent structural depth into ~10 seconds.

### Three natural regimes

| Regime | Turn rate | Character | Analogy |
|--------|-----------|-----------|---------|
| Contemplative | ~1 turn / 3–10s | Each event distinct, structure audible, close to Nomos Alpha pacing | Chamber music — performer as composer |
| Conversational | ~1–2 turns/sec | Events overlap but individually perceptible, structure felt not tracked, algorithms are deliberate | Improvisatory dialogue with the instrument |
| Solve/burst | ~5+ turns/sec | Structure collapses into texture, statistical character dominates | Closer to Pithoprakta/Metastasis — mass cloud behavior |

This mirrors Xenakis' own career arc: individual symbolic events (Nomos Alpha) vs. statistical clouds (Pithoprakta). A single instrument can access both poles by varying turn rate.

### What happens at solve speed

- **Sequential mode**: each voice cut off almost instantly → chattering burst of attack transients → effectively an ataxic cloud (which is C1)
- **Polyphonic mode**: all 8 voices reshuffled ~7 times in 10s → dense, constantly morphing ensemble
- **Sieve**: 18 metabolae in 10s → pitch field effectively random, each mutation inaudible before the next
- **Cube algorithms**: a CFOP solve IS an algorithm sequence (cross setup, F2L pairs, OLL algorithm, PLL algorithm). The cube-algorithm detector would fire at structural waypoints of the solve itself

### Scramble factor as macro-arc

A solve starts scrambled (factor ~1.0) and ends solved (factor 0.0). This arc is inherently dramatic — a decrescendo from disorder to order. Design ideas:

- Scramble factor could morph synthesis macro-parameters: scrambled = dense/chaotic/loud, solved = sparse/pure/quiet
- The solve itself becomes a single long gesture (~10s arc from noise to clarity)
- Algorithms firing during a solve mark structural waypoints: cross done → first plateau, F2L → midpoint, OLL → approaching resolution, PLL → final gesture
- Each algorithm could leave acoustic residue (reverb tail, pitch memory, sustained harmonic) that accumulates, so the solve builds a harmonic trail even as events fly by

### Engine adaptation (not yet implemented)

The engine could detect the current regime from inter-turn interval and adapt behavior:

- **Slow**: full voice playback, individual events, sieve mutations audible
- **Conversational**: voices overlap, parameters interpolate, cube-algorithm detection prominent
- **Burst**: stop emitting individual voices, output aggregate parameters (average density, centroid pitch, spectral envelope) to drive a different synthesis layer; individual complex types irrelevant, macro-texture is what matters

This would require a turn-rate tracker and a crossfade between synthesis modes — but the data is all there (the relay already timestamps every turn).

## Nomos Alpha: Score ↔ Theory Mapping

### Macro-structure

24 sections in two layers:

- **Layer 1 (Path A)**: sections not divisible by 4 — 18 sections governed by S4 group theory. Fragmented, explosive, formalized. Each group of 3 sections uses one cube transformation; the 3 sections within represent α, β, γ phase cycling.
- **Layer 2 (Path B)**: every 4th section (4, 8, 12, 16, 20, 24) — 6 interludes. NOT group-theoretic. Long sustained tones, extreme register exploration, freely composed. "Continuous motion of registral evolution."

The two layers alternate: A A A B A A A B A A A B ... The complex type system only applies to Path A. Losing track of complex types at a Path B interlude is expected — the system literally shuts off.

### Kinematic diagram (K_i cube traversal)

The 18 Path A sections use a Fibonacci-like recurrence through S4: each new element = composition of the previous two, seeded by D (120° vertex rotation) and Q12 (180° edge rotation). This generates an 18-element cycle — the longest possible with those seeds — before repeating. Only 18 of the 24 S4 elements appear. (Source: Du Sautoy / RNCM PRISM animation project.)

### Opening sections

Section 1 uses the identity element — complex types appear in their base ordering (nearly C1 through C8 in sequence). This is why the opening is legible: no permutation yet. After section 1, the cube rotates and the ordering scrambles. By section 3, the α→β phase shift remaps which complex type sits at each vertex, adding a second layer of permutation. The double scrambling (S4 permutation + phase cycling) is why the structure becomes opaque quickly.

### Identifying complex types in the score

Within each Path A section, 8 events play in sequence, separated by rests. Each event corresponds to one complex type at one vertex position. Visual cues:

| Type | Score appearance |
|------|----------------|
| C1 (ataxic cloud) | Scattered short attacks, irregular spacing, mixed techniques |
| C2 (ordered ascending/descending cloud) | Bowed figures with clear directional contour |
| C3 (ordered flat cloud) | Bowed figures at roughly constant register |
| C4 (ionized atom) | Harmonics + pizzicato interruptions |
| C5 (ataxic sliding) | Multi-directional glissando lines, chaotic |
| C6 (ordered sliding asc/desc) | Glissando with clear directional shape |
| C7 (ordered flat sliding) | Glissando staying in one register |
| C8 (atom/quasi-unison) | Near-unison double stops, tremolo, tight intervals |

### Pitch sieve in practice

Notated with quarter-tone accidentals throughout. The sieve L(11,13) generates an irregular grid spanning 7+ octaves. Metabola every 3 sections transforms the grid. Scholars (Besada, MTO 2022) have documented significant discrepancies between the theoretical sieves and the score — calculation errors, deliberate overrides, and ambiguous notation. The "noisy, in-between" pitches are partly the quarter-tone sieve, partly glissandi passing through the grid, and partly Xenakis not following his own rules.

### Available analyses

No complete bar-by-bar analysis exists. Closest resources:

- **Buvat (2019)** — performer's guide, section-by-section with audio/video. Best for identifying the 8 sound types.
- **Du Sautoy / RNCM PRISM** — animation visualizing cube rotations with Cayley graph. Best for understanding the Fibonacci kinematic diagram.
- **Besada (MTO 28.2, 2022)** — rigorous sieve analysis including Xenakis' sketches and score deviations.
- **ResearchGate annotated excerpt** — bars 1–30 with sonic complexes marked and numbered.
- **Vriend (Interface, 1981)** — earliest serious analytical commentary.
- **IDEALS / U. Illinois** — performer's guide to Nomos Alpha and Kottos.

---

## SWAM Cello Mapping Design

Xenakis' C1–C8 complex types are cello techniques. SWAM Cello 3 (Audio Modeling) is a physical-modeling VST that exposes parameters as a mix of **Key Switches** (techniques — Play Mode, Harmonics, Tremolo, etc.) and **MIDI CC** (continuous — Expression, Bow Position, Vibrato). See `docs/swam/swam_cello_reference.md` for the full KS/CC authority.

**The bridge mapping below documents the v2 design; the v3+ bridge (currently shipping in `max/xk_swam.js`) has been refactored against SWAM's actual control model — see `docs/revision_roadmap.md` (D1–D31) for the full trail.** Current live mapping: Play Mode = KS C velocity-select; Gesture Mode / Alt Fingering = KS D / D# velocity-select; Harmonics + Tremolo = CC 78 / CC 79 (v3.10 KS F#/G# are 2-band with default-only Off, so CC is the only way to reach every state — D31); Expression is per-complex envelope; Vibrato Rate = CC 19. The v2 mapping below is preserved for design-rationale continuity.

### Complex Type → SWAM Phrase (v2)

Each `/xk/voice` dispatches a **phrase generator** in `max/xk_swam.js` — not a single note. The gestural shape of each complex type is realized as a short sequence of MIDI events with humanized timing/velocity. Portamento types use `legatoNote()` which sends noteOn(new) before noteOff(old) with 20ms overlap so SWAM engages the physical-model glide.

| Complex | Xenakis technique | SWAM phrase |
|---------|------------------|--------------|
| C1 | Ataxic pizzicato | Pizz keyswitch, cloud of 2-5 plucked notes scattered ≤600ms with short (60-200ms) gates |
| C2 | Bowed ascending/descending | Arco, legato run of 2-3 notes (3 in burst regime) with ~120ms spacing |
| C3 | Bowed sustained | Arco, sul tasto, single long note with expression swell (soft→peak@40%→settle) |
| C4 | Harmonics + col legno | Arco, Harmonics ON, single ethereal note (shifted up if <MIDI 60), light bow pressure |
| C5 | Ataxic glissando | Arco, Portamento ON (50), two notes ≥5 semitones apart with legato slide at 200-600ms |
| C6 | Ordered glissando | Arco, Portamento ON (80), 2-4 stepwise sieve walk with legato transitions |
| C7 | Sustained sliding | Arco, Portamento ON (115), sul tasto, single note + slow drift (±3 semitones) at half-duration |
| C8 | Sul ponticello | Arco, Bow Position 5 (near bridge), Tremolo 110, metallic tremolo note |

### Per-Turn Parameters

| XenaKube | SWAM target | Mapping |
|----------|------------|---------|
| intensity (p–fff) | Expression CC 11 + base velocity | expr: 20/38/55/75/95/115, vel: 35/50/68/85/100/120 |
| density | Attack Ramp CC 73 | High density = fast attack; also sets C1 pizz count (density+1, clamped 2-5) |
| duration | Auto-release timer | Phrase fades over 5×80ms steps then note-off; cancels on next turn |
| sieve | MIDI note pool | Pitch selection per phrase generator; ±1 semitone microtonal jitter at 10% probability. Pitches are octave-folded into the cello's playable range (MIDI 36–89, C2–F6) rather than hard-clamped, so out-of-range sieve notes wrap up/down an octave and keep their pitch class |

### Continuous Gyro Expression (60Hz)

| Expression param | SWAM target | Curve |
|-----------------|------------|-------|
| tilt (0–1) | Expression CC 11 | Exponential (`val²`) blended with base intensity: `baseExpr*0.3 + tilt²*97`. Face down → near-silent (5), face up → full (127). Skipped on C1 pizz. |
| spin (0–1) | Vibrato Depth CC 1 + Rate CC 76 | Dead zone below 0.15, then exponential. No vibrato at rest; dramatic at fast rotation. |
| deviation (0–1) | Bow Pressure CC 17 + Bow Speed CC 19 | Exponential 20-127 pressure; speed 40-120. Locked to S4 snap = light/slow, at boundary = heavy/erratic. |
| scramble (0–1) | Bow Position CC 16 | Solved = fingerboard (120), scrambled = bridge (5). Skipped when complex type owns position (C3, C4, C7, C8). |

### Humanization

Natural variation is layered on every phrase note:
- **Velocity**: ±15% jitter + accent (+8) every 3rd turn
- **Pitch**: 10% chance of ±1 semitone microtonal shift
- **Timing**: 0-30ms micro-delay between phrase notes

Without these, rapid repetitions sound mechanical. The ±15% range is small enough to preserve the intensity contour but large enough to avoid the "same sample retriggered" feel.

### Structural Modifiers

| XenaKube | SWAM target | Mapping |
|----------|------------|---------|
| tetra orbit even | Bowing Sensitivity CC 21 = 50 | Warmer, less reactive |
| tetra orbit odd | Bowing Sensitivity CC 21 = 110 | Edgier, more reactive |
| path V1 | Transpose: 0 | Normal cello range |
| path V2 | Transpose: -12 | Octave lower (matches V2 long durations) |
| regime: contemplative | Tremolo off, Attack Ramp 90 (slow) | Single distinct gestures |
| regime: conversational | Tremolo off, Attack Ramp 50 (medium) | Phrases flow into each other |
| regime: burst | Tremolo on (depth from turnRate/4), Attack Ramp 10 (fast) | Accumulating agitation |

### Solve Arc

Scramble factor as macro parameter: scramble 1.0 (start) = pressed bowing near bridge, heavy vibrato, tense. Scramble 0.0 (solved) = clean bow position, steady, pure tone. The solve IS the musical resolution — a decrescendo from noise to clarity.

## Phrase Dynamic Arcs (Phase 1 — D47, 2026-04-26)

### The fluidity problem

The pre-D47 expression envelope (`scheduleExprEnvelope`) ramped CC 11 in three fixed stages: `peak × env.attack` immediately, `peak × env.peak` at 25% of duration, `peak × env.sustain` at 70%. Per-note MIDI velocity was independently shaped by `stepVelScale` (cresc / dim / accent-first / fade per face envelope), so the *content inside* a phrase varied in dynamic, but the *bow-pressure / expression arc* of every phrase had the same hump-then-sag silhouette regardless of K-vertex, complex, or face. Audibly: "each phrase has its own little swell," never "this phrase is a long line approaching its peak." Sustained-bowed complexes (C2 cloud, C3 hovering flat, C8 trem) suffered most because their character relies on continuous bow control over time.

User report (2026-04-25): "the phrases lack certain fluidity… i would like a gradually increasing or decreasing expression that transcends individual notes."

### The Phase 1 fix — face-envelope-driven cresc / dim per phrase

Replace the 3-stage envelope, *for sustained multi-note complexes only* (C2, C3, C4, C8), with a single linear ramp across the full phrase duration:

- **swell faces** (L, F, F') → **cresc**: CC 11 starts at `peakExpr × ARC_FLOOR` (0.30) and walks to `peakExpr × ARC_CEIL` (1.00) over the full duration.
- **fade faces** (U', L') → **dim**: CC 11 starts at `peakExpr × ARC_CEIL` and walks down to `peakExpr × ARC_FLOOR`.
- **burst face** (R') → **dim**: the iterative flurry reads as energy releasing rather than accumulating; pairs naturally with R-stab as the right-pan percussive family.
- **isSingle envelopes** (pluck/stab/drone) → no arc — the face collapses the phrase to one note via `faceShapedCount`, so directionality is moot. Falls back to `scheduleExprEnvelope`.
- **gliss complexes** (C5/C6/C7) → no arc — the slide trajectory already owns the phrase's contour. Falls back to `scheduleExprEnvelope`.
- **null face** (non-face moves: half-turns, diagram advance) → falls back to `scheduleExprEnvelope`.

`peakExpr` is the K-dynamic ceiling already baked from `INTENSITY_MAP[intensity].expr × pathScale × ENV_PROFILE[envelope].peakMult` in `handleVoice`. So *cresc TO K-dynamic* and *dim FROM K-dynamic* are the literal endpoints, not approximations.

### Why faceEnvelope and not the alternatives

Three drivers were considered before settling on faceEnvelope:

1. **Tetra-orbit parity** (even=cresc, odd=dim). Mathematically perfect 50/50 split, deterministic per S4 element. Rejected because (a) tetra-orbit is already spent on `harmonicsForC4` (V1+even = OCT, V1+odd = OCT_5TH, V2+even = OCT_5TH, V2+odd = CTRL); doubling it onto expression direction tangles two unrelated mappings on the same axis. (b) Performers can't easily perceive orbit parity mid-performance — it's derived from S4 history rather than directly from the move just turned. The forward model (the cube's *predictability*) suffers.

2. **Sexy-move toggle** (each sexy-move flips a global cresc↔dim regime). Performative and natural to the CFOP solving rhythm — sexy-moves are F2L pair insertions, structural beats. Rejected as the *sole* driver because (a) when sexy-move was carrying the V1↔V2 path toggle (since removed 2026-04-30), coupling path and dynamic onto a single 4-move trigger would have meant they could never be decoupled. (b) Exploratory non-CFOP play may not produce sexy-moves for long stretches, leaving direction frozen. (c) Loses face-identity reinforcement entirely. Worth revisiting later as an *amplifier* on top of faceEnvelope (a global polarity-flip overlay) rather than a replacement. The coin-flip variant was rejected outright — random direction strips both per-face predictability AND per-regime semantics, leaving binary noise without form (less Xenakian, more dice).

3. **Face envelope** (chosen). Counts cleanly across the multi-note faces: 3 swell (L, F, F') + 2 fade (U', L') + 1 burst (R'→dim) = **3 cresc / 3 dim**, self-balancing without hand-tuning. Reinforces Temporal Identity directly — L and L' now differ in dynamic *direction* (swell vs fade), making the primed/unprimed pair audible as a dynamic mirror in addition to the existing motion / articulation contrast. Performers gain compositional agency — choosing swell-heavy vs fade-heavy face sequences becomes a deliberate move.

The acknowledged tradeoff: faceEnvelope is *deterministic per face*. After enough playing, L always swells and U' always fades — there's no surprise in the *direction*. The detail (pitch via K_i, timbre via C_i, K-dynamic level, regime tempo, double-stops, sieve walk) still varies, so the phrase is never the same twice. This is the right tradeoff for an instrument with a forward model.

### Steal balance — why no protective hold

A naive concern about cresc-to-K is that the loudest moment lands at the *end* of the phrase, vulnerable to voice steal: a fast turn cuts the climax just before it sounds. The user's observation rebutted this cleanly: across a stream of turns, half are cresc and half are dim. Cresc-cut-short loses its climax; dim-cut-short loses its decay tail. Both feel like natural breath — the truncations are symmetric, and across enough turns the effect averages out musically. So `schedulePhraseArc` ramps over the *full* duration without an early-peak hold; truncation is a feature, not a bug.

### Multi-turn arcs (Phase 2 design — not yet implemented)

User question (2026-04-26): "ideally i want these phrase shapes to take place through multiple turns… ONE crescendo/diminuendo THROUGH the four materials, but i'm not sure how that would work and i'm not sure how to set that up so that it doesn't become a limiting factor."

The "non-limiting" constraint rules out algorithm-bounded arcs (sexy-move opens, sexy-move closes — too coarse and decoupled from the face being turned) and count-bounded arcs (every N turns is one arc — N is arbitrary, has no musical meaning). The deepest answer is **adaptive chaining**: arcs *emerge* from coherent face-envelope sequences without any new algorithm, counter, or trigger.

**The rule** (Phase 2 spec): if a new voice arrives within a tight onset-to-onset window (~< 1.0 s) of the previous voice AND its face envelope produces the *same arc direction*, the new voice's CC 11 starts at *wherever the previous voice ended* (carried via `state.lastArcCC11`) instead of restarting at `ARC_FLOOR`. The arc continues until either (a) the next turn's face envelope has the opposite direction, (b) the gap exceeds the window, or (c) the next turn is an isSingle face (pluck/stab/drone — natural caesuras break chains).

Concretely, the user's example `[K6-C3][K7-C4][K5-C7][K2-C3]`: whether this is one continuous arc, two short arcs, or four independent phrases depends entirely on **which face produced each turn** and **how tightly they were spaced**. If the four turns were L F F' L (all swell, all <1 s apart), one continuous cresc spans them — each voice's K-dynamic varies (K6, K7, K5, K2 each have their own peak height) but the expression line passes through them rather than restarting. If they were L F D L', the arc breaks at D (stab-isSingle) and resumes after.

**Why this satisfies "non-limiting":**
- Default behavior is unchanged — single voices use the per-phrase Phase 1 arc.
- Chains form only under specific organic conditions; most playing won't trigger them.
- Performer breaks chains trivially — any opposite-direction face, any isSingle face, any pause.
- No max chain length, but natural breakers occur often enough in normal play that arcs of 8+ would be rare and *deliberate*.
- The Phase 2 change reuses the entire Phase 1 envelope code — only the start value carries over. ~30 lines of additional state, zero new cube algorithms, zero performer overhead.

**Two design choices to settle when Phase 2 lands:**
- Onset-to-onset gap window (start with 1.0 s, tune from listening).
- Does R' burst chain into its preceding swell (forming a Bartók-arch cresc-into-burst-into-dim) or break the chain (treating burst as accent caesura)? Lean *chain-and-flip*: R' continues the previous swell-cresc into its own burst-dim, producing one arch shape across both phrases.

### Implementation surface

Phase 1 (this entry):
- `max/xk_swam.js`: `ARC_FLOOR` / `ARC_CEIL` / `ARC_COMPLEXES` constants; `phraseArcDirection(inst)` and `schedulePhraseArc(inst, peakExpr, dir, durMs)` helpers; dispatch in `handleVoice` choosing arc vs legacy 3-stage envelope per `(complexType, faceEnvelope)`; `inst.phraseArcDir` / `phraseArcStart` / `phraseArcEnd` instance fields; natural-end FAIL telemetry in `scheduleRelease` (`ARC FAIL` / per-phrase `arc=cresc 38->127` log).
- `CLAUDE.md` Bridge Invariants table gains a D47 row and Mapping Cheatsheet bullet.

Phase 2 (deferred):
- `state.lastVoiceEndMs`, `state.lastArcDir`, `state.lastArcCC11` for chain tracking.
- `schedulePhraseArc` reads carry-over startVal when chain conditions met.
- Telemetry: per-chain log line summarising chain length, total arc range, breaker reason.

## Cross-String Pitchbend Slides (D59 — design, 2026-04-30)

### The physical premise

Real cellos have four strings tuned C2 / G2 / D3 / A3 (open). A slide (portamento) moves a finger along a single string — the bow stays on that string and the pitch changes continuously. Cross-string slides aren't physically possible: you have to lift the finger off one string and put it on another. The audible result is a string change, not a slide.

SWAM Cello 3's Mono Poly Release portamento engine respects this. When it receives an overlapping noteon pair (the bridge's `legatoNoteOverlap`), it tries to engage portamento — but if the source and target pitches don't fit on a single string, SWAM **bails to a string-cross leap** internally. Audibly the result is a leap; the bridge's MIDI emit still looks like an attempted slide, which is why D46 (string-crossing geometry) was added: classify same-string vs cross-string at composition time and emit either `glissNote` (overlap) or `leapStep` (clean noteoff → 50 ms gap → noteon) so the dashboard's classifier and SWAM's behaviour agree.

### What the user wants

Gliss complexes (C5 wild, C6 ord., C7 tasto) are *expressively* gliss — the listener should hear continuous pitch curves regardless of whether the source and target sit on the same physical string. The user-reported "top half phrases dropping down play as two regular notes with leaps" (2026-04-30) is the D46 classifier doing its job correctly — anchor at 75 (A-string only) descending to 50 has no shared string — but the auditory result *as a gliss* is wrong. D58 (per-complex `MAX_LEAPS_BY_COMPLEX`) constrains targets to same-string for C6/C7, which fixes the symptom by avoiding cross-string targets entirely; the cost is a narrower per-phrase pitch range. D59 is the durable fix: produce continuous pitch curves *across* string boundaries by going around SWAM's portamento engine.

### Core idea

Pitchbend (MIDI Pitch Wheel, 14-bit message on status `0xE0` + channel) bends the pitch of all currently-sounding notes on the channel by a global offset. SWAM responds to it the way any standard MIDI synth does — the held note's audible pitch shifts up or down by the bend value × range setting, regardless of which string the held note is logically on. So:

- Hold a noteon at the source pitch. Audible pitch = source.
- Ramp pitchbend from 0 → (target − source) semitones over the slide duration. Audible pitch curves smoothly from source to target.
- At ramp end, atomically: bend = 0, noteOff source, noteOn target at velocity. Subsequent events see a clean MIDI state (target active, bend at 0).

This produces an audible cross-string slide using only one physical string (the source's). The timbre is whatever SWAM's physical model produces for the source string at the bent pitch — which at extreme bends will sound increasingly weird (gut-stretched, harmonics drift) but never *discrete*. For cross-string slides specifically, listeners accept some timbral compromise in exchange for the continuous pitch.

### Bridge — `bendStep` design

New function paralleling `glissNote` / `leapStep`:

```js
function bendStep(inst, sourcePitch, targetPitch, glissVel, accent, complex) {
  // 1. Optional accent spike — same as glissNote.
  if (accent && HAS_BOW_PRESS_ACCENT) ccForce(inst, CC.BOW_PRESS_ACCENT, accent);

  // 2. Compute target bend value14 (0..16383 with center 8192).
  var semis = targetPitch - sourcePitch;
  var targetBend = clamp(8192 + Math.round(semis * 8192 / PITCHBEND_RANGE_SEMI), 0, 16383);

  // 3. Slide duration — same per-complex table that drives glissNote spacing.
  var durMs = _glissChainDur(sourcePitch, targetPitch, complex);

  // 4. Ramp pitchbend on the held source note.
  rampPitchbend(inst, targetBend, durMs);

  // 5. At ramp end, atomically: reset bend, noteOff source, noteOn target.
  //    Order matters — bend resets BEFORE the new noteOn so target's attack
  //    transient plays at target_written, not target+offset. The brief
  //    audible "drop back to source pitch" between bend reset and noteOff
  //    is sub-1ms when the three messages emit synchronously; SWAM's
  //    physical model treats it as the natural release of the source note.
  scheduleAt(inst, durMs, function () {
    emitPitchbend(inst, 8192);                   // bend = 0
    noteOff(inst, humanPitch(sourcePitch));      // source release
    var hp = humanPitch(targetPitch);
    noteOn(inst, hp, glissVel || GLISS_VEL);      // target attack at clean pitch
    inst.activeNotes = [hp];                     // bookkeeping
  });

  // 6. Optional accent reset — same as glissNote.
  if (accent && HAS_BOW_PRESS_ACCENT) {
    scheduleAt(inst, BPA_RESET_MS, function () {
      ccForce(inst, CC.BOW_PRESS_ACCENT, 0);
    });
  }

  // 7. OSC echo so the dashboard can plot the bend trajectory.
  emitMidiBendStep(inst, sourcePitch, targetPitch, durMs, complex);

  // 8. Counter (paralleling glissOverlapCount / glissLeapCount).
  inst.glissBendCount = (inst.glissBendCount | 0) + 1;
}
```

Supporting helpers:

```js
function emitPitchbend(inst, value14) {
  value14 = clamp(value14 | 0, 0, 16383);
  var lsb = value14 & 0x7F;
  var msb = (value14 >> 7) & 0x7F;
  emitMidi(inst, 0xE0 + MIDI_CH, lsb, msb);
  inst.pitchbend = value14;
}

function rampPitchbend(inst, target, durMs) {
  cancelPitchbendRamp(inst);
  target = clamp(target | 0, 0, 16383);
  var start = inst.pitchbend != null ? inst.pitchbend : 8192;
  if (durMs <= 0 || start === target) { emitPitchbend(inst, target); return; }
  var tickMs = 15;                  // matches rampCC tick rate
  var steps  = Math.max(1, Math.round(durMs / tickMs));
  var tasks  = [];
  for (var i = 1; i <= steps; i++) {
    (function (step) {
      var v = start + (target - start) * (step / steps);
      var t = new Task(function () { emitPitchbend(inst, v); }, this);
      t.schedule(step * tickMs);
      tasks.push(t);
    })(i);
  }
  inst.pitchbendRampTasks = tasks;
}

function cancelPitchbendRamp(inst) {
  if (!inst.pitchbendRampTasks) return;
  for (var i = 0; i < inst.pitchbendRampTasks.length; i++) inst.pitchbendRampTasks[i].cancel();
  inst.pitchbendRampTasks = null;
}
```

`glissStep` dispatch becomes three-way instead of two-way:
```
sameString(src, dst)   → glissNote (portamento overlap)  → glissOverlapCount++
cross-string + abs(src-dst) ≤ PITCHBEND_RANGE_SEMI → bendStep (pitch wheel) → glissBendCount++
cross-string + interval > range → leapStep (legacy clean transition)        → glissLeapCount++
```

The third branch handles the rare case where the interval exceeds pitchbend range (default ±12 semitones; configurable in SWAM preset up to ±48). Most gliss intervals are ≤ 9 semis so the third branch fires almost never.

### Atomic transition ordering at ramp end

Three messages at time T (ramp end):
1. `pitchbend = 0` — held source note's audible pitch drops from target back to source.
2. `noteOff source` — source begins release.
3. `noteOn target at vel` — target attacks at target_written (no bend).

Sub-1ms between (1) and (3). The "audible drop to source pitch" in (1) is masked by the noteOff in (2) and the new attack in (3). The TARGET ATTACK in (3) plays at the correct pitch because bend is 0 by then.

Alternative orderings are worse:
- (3) before (1): target attacks at target+offset (audibly wrong pitch). Even if bend resets 1ms later, the physical-model attack transient is at the wrong pitch.
- (1) after (3): target attacks at target+offset, then bend reset drops it; audible "starts wrong, settles right" pop.

The chosen order is the only one where the new note's attack is unambiguously at target_written.

### OSC echo + dashboard implementation

New address `/xk/midi/bendstep` (voice, fromPitch, toPitch, durMs, complex). Bridge emits this once at the START of bendStep (NOT per-tick — single event, dashboard interpolates). Saves wire traffic vs ~67 Hz per-tick echoes.

`src/osc-schema.ts` gains `OSC.MIDI_BENDSTEP = '/xk/midi/bendstep'`. Codegen via `npm run gen:max` regenerates `max/gen_includes.js`.

Dashboard `transport.js` adds a `bendstep` event. `triangle.js` and `rolling-score.js` extend their segment models: a bendstep is a new segment with `{ t0: now, dur: durMs, p0: fromPitch, p1: toPitch }` — same shape as portamento slide segments. Drawn identically (continuous Path2D stroke). The user shouldn't perceive any visual difference between "string-bent" slides and "portamento" slides — both are continuous curves on the rolling score and both retarget the white triangle leg.

`triangle.js`'s `_displayedPitch` model: bendstep arrives as an event distinct from noteon. The line's `fromPitch` / `toPitch` / `animDurMs` retarget on bendstep just like they retarget on a slide noteon.

Phase 1 invariant `assertGlissSync` continues to compare line-pitch vs chain-pitch; with bendsteps in both segment models, the assertion still holds.

### SWAM preset requirement

Pitchbend range MUST be ≥ ±12 semitones in `xenakube_main.swam`. SWAM's Pitchbend Range setting is in the Advanced → MIDI page. Save the preset with the new range. Document in `docs/swam/swam_cello_reference.md` and the synthesis-bridge.md preset prerequisites list.

`PITCHBEND_RANGE_SEMI = 12` constant in `xk_swam.js` matches the preset. Bumping to ±24 in preset means changing this constant too — they're a paired tunable.

### Telemetry

Per-phrase log extension: `inst N CX face=F slides=S bends=B leaps=L dur=D`. The `slides + bends + leaps ≥ 1` D42 invariant becomes the same with the bend term added. GLISS FAIL fires only if all three are 0.

New invariant: `bendStep` audible target should be reachable. If `Math.abs(targetPitch - sourcePitch) > PITCHBEND_RANGE_SEMI`, the ramp would clip — log `BEND CLIP inst N CX semis=S range=R` and fall through to `leapStep` (so the slide doesn't silently truncate to a wrong pitch).

### Known artefacts / risks

- **Timbre at extreme bends**: SWAM's physical model on the source string produces unusual harmonics when bent ±10 semitones. Listeners accept this for cross-string slides; alternative is no slide.
- **Pitchbend interferes with vibrato CC 1**: SWAM's vibrato adds pitch modulation on top of pitchbend. During a bend ramp, vibrato continues normally — should sound natural.
- **Atomic-transition discontinuity**: sub-1ms of "source pitch return" between bend=0 and noteOff. Inaudible at typical SWAM release times.
- **Pitchbend channel-wide**: bend affects ALL active notes on the channel. With single-instance model (POOL_SIZE=1) this is fine; if polyphony is reinstated, bends collide between voices. Future polyphony work would need MPE (per-note pitchbend, MIDI 1.0 doesn't have it natively).
- **Race with `setupComplex`**: if a new voice arrives mid-bend (steal), `cancelPitchbendRamp` must run before the new voice's `setupComplex`. Add to `cancelPhrase`.

### Implementation phases

**Phase A.1 — bridge (~2 hours)**:
1. Add `pitchbend: 8192` and `pitchbendRampTasks: null` to `makeInstance` literal.
2. Add `emitPitchbend`, `rampPitchbend`, `cancelPitchbendRamp` (paralleling rampCC).
3. Add `bendStep`. Update `glissStep` dispatch to three-way.
4. Add `glissBendCount` counter and update D42 telemetry to include it.
5. Update `cancelPhrase` to call `cancelPitchbendRamp` and reset `inst.pitchbend = 8192` on steal.
6. Update `bang`'s reset block: `inst.pitchbend = 8192`, clear ramp tasks.
7. Add `PITCHBEND_RANGE_SEMI = 12` constant + `BEND_CLIP` clip-guard fallback to `leapStep`.

**Phase A.2 — OSC + codegen (~30 min)**:
1. Add `OSC.MIDI_BENDSTEP = '/xk/midi/bendstep'` to `src/osc-schema.ts`.
2. `npm run gen:max` regenerates `max/gen_includes.js`.
3. Bridge `bendStep` emits the OSC echo via `emitMidiBendStep(inst, fromPitch, toPitch, durMs, complex)`.
4. Document the new address in `docs/osc-reference.md`.

**Phase A.3 — dashboard (~1.5 hours)**:
1. `transport.js` adds `bendstep` event.
2. `rolling-score.js` extends `_buildGlissSegments` to consume bendstep events as additional segments. Update segment-tracking state.
3. `triangle.js` extends `noteOn` retarget logic to handle bendstep events (same `fromPitch / toPitch / animDurMs` retarget shape).
4. Visual: bendstep segments draw identically to portamento slide segments. Phase 1 `assertGlissSync` continues to hold.
5. `main.js` wires the new event to both modules.

**Phase A.4 — SWAM preset + docs (~15 min)**:
1. SWAM GUI: Advanced → MIDI → Pitchbend Range = 12 (or higher).
2. Save preset.
3. Document the requirement in `docs/swam/swam_cello_reference.md` and synthesis-bridge.md preset prerequisites.

**Phase A.5 — invariant tightening (~30 min)**:
1. Once D59 is stable, set every entry in `MAX_LEAPS_BY_COMPLEX` to 0 (D58 fallback no longer needed for any complex; cross-string is handled by bendStep instead of leapStep).
2. CLAUDE.md D48 row becomes "Leap-alternation = 0 across all gliss complexes (post-D59)".
3. CHANGELOG D59 entry.

Total estimated effort: ~5 hours including testing and doc updates.

### Why this satisfies "avoid brittle logic"

- **Single source of truth**: `PITCHBEND_RANGE_SEMI` constant in `xk_swam.js` matches SWAM preset; one tunable.
- **No timing tricks**: the atomic transition's three messages emit synchronously in JS; we control the order.
- **Failure mode is loud**: `BEND CLIP` log fires loudly when interval > range; falls through to `leapStep` instead of silently truncating.
- **Telemetry first** (per CLAUDE.md Recurring-Bug Discipline): `glissBendCount` counter and `BEND CLIP` log added before / alongside the implementation; per-phrase `slides=S bends=B leaps=L` line shows distribution at a glance.
- **Reversible**: D59 is purely additive — `glissStep` falls through to existing `glissNote` / `leapStep` if `bendStep` is disabled. To kill it: comment out the `bendStep` dispatch branch.
- **Per-complex tunable**: same pattern as `MAX_LEAPS_BY_COMPLEX` — `BEND_COMPLEXES = { 5: true, 6: true, 7: true }` lets us disable bend for any complex if it produces unwanted timbre.

### What actually shipped (D59 → D64, single-day iteration log 2026-04-30)

The design above shipped, then needed five sub-iterations to reach a state the user described as "the best it's ever been". Each iteration was a real bug surfaced by live testing — recording them here so the same surface doesn't get re-broken on a future refactor.

**D59 (initial ship)** — `bendStep` + atomic-transition design as written above. Worked in concept but had latent bugs the design didn't anticipate.

**D60 (correctness)** — three real bugs in the D59 implementation:
- D60.1: `humanPitch` is a 10%-chance ±1 semi shift, NOT the small ±0.05 jitter the design assumed. `bendStep`'s fresh `humanPitch(sourcePitch)` for `noteOff` mismatched the `inst.activeNotes` entry from the source's earlier `noteOn` call ~10 % of the time → noteOff for a pitch SWAM didn't have → notes ringing forever, queues piling up. Fix: lookup `inst.activeNotes` via `Math.round`-tolerant match instead of re-humanising.
- D60.2: bend duration could exceed `MIN_GLISS_SPACING_MS = 200 ms`. C5 8-semi cross-string at 50 ms/semi = 400 ms. Next event fired while previous bend's pitchbend ramp was still running → pitchbend offset (up to ±48 semis) leaked into the new event's `noteOn`. Fix: `_bendDur` clamps at `MIN_GLISS_SPACING_MS - BEND_DUR_MARGIN_MS`.
- D60.3: dashboard's `buildGlissChains` rendered the bend's future as a horizontal line ahead of "now". Fix: clamp `x1` at `rightEdge` for in-flight bends.
- D60.4: chain-grace pitch tolerance ±1 added for `humanPitch` jitter on the bend's target noteOn.

**D61** — triangle's white line silently slid across leaps that fired during bend-grace. The grace shielded the line's splice on noteOff (correct for the bend's own atomic transition gap) but ALSO shielded it on a leap's source noteoff, then `_findGlissLine` returned the still-alive line and `noteOn` retargeted as a slide. Fix: `chainStart` parameter wired through `main.js` to `triangle.noteOn`; chainStart=true splices the line regardless of grace.

**D62.1** — bend chain-grace was set on bendstep arrival but never explicitly cleared, so any noteon within the window that pitch-matched ±1 was treated as continuation. Cross-phrase accidental chaining. Fix: `delete()` the grace map entry the moment the override fires. One bend, one continuation.

**D62.2 (REVERTED)** — `BEND_MAX_SEMI = 12` cap converted cross-string bends > 12 semis into leaps. Wild gliss with 36–89 register lost most of its bending activity → user explicitly objected. **Reverted in D63.1**.

**D63 (the real fix to "still notes")** — D60.2's 50 ms bend-dur margin left a visible stationary tail between bend's atomic transition and the next event. Visible as horizontal "still note" lines at the top/bottom of the rolling-score axis (especially at extreme pitches that clamped to `ROLL_MAX_MIDI = 84`). Fix: tighten `BEND_DUR_MARGIN_MS` from 50 → 5 ms. Bend ramp fills the inter-event time. Race-safety: `inst.bendPending` flag + `completeBend(inst, scheduled)` helper. `glissStep` entry calls `completeBend(inst, false)` to force-complete any pending transition inline before dispatching, in case scheduling jitter exceeds the 5 ms margin.

**D64 (the silent killer)** — bridge `PITCHBEND_RANGE_SEMI` MUST match SWAM preset's Pitchbend Range exactly. MIDI pitchbend is a 14-bit wheel with no semitone information; the preset value does the conversion. Mismatch silently produces audible-bend ≠ visual-bend → "leaping" perception even though the bridge is bending correctly. The user had multiple sessions where they'd changed the preset and forgotten to save, leaving SWAM at default ±2 while bridge was at ±48 → 24× weaker bends. Fix: `bang()` logs the bridge's `PITCHBEND_RANGE_SEMI` on every reload to `[print xk_swam]` so a mismatch is visibly enforced. Pitchbend ramp tick lowered from 15 → 5 ms (D64.3) for finer pitch wheel updates — smoother audible slide. Range itself lowered to 24 in this iteration to match the user's preset; tunable.

**The headline lesson**: pitchbend with a stateful physical-modeling VST has half a dozen subtle invariants that all have to be right simultaneously — pitch encoding (bridge↔preset agreement), timing (no overrun, no overrun even under jitter), state coherence (noteOff hits the held pitch, not a re-humanised one), and dashboard mirroring (chain segments authored by bend events, grace consumed exactly once). Telemetry-first per the Recurring-Bug Discipline was vindicated: every iteration's loud failure mode (`BEND FAIL`, `BEND CLIP`, `bend race-fix`, the startup pitchbend log) is what made the next bug findable.
