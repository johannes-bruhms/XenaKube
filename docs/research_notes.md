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
| K_i vertices as D×G×U parameter triples | 218–220 | `vertices.ts`: V1 and V2 paths with exact Xenakis values |
| Two paths V1 (loud/short) and V2 (quiet/long) | 218–220 | `vertices.ts`: V1_VERTICES, V2_VERTICES |
| C_i sound complex types (C1–C8) | 222–224 | `complexes.ts`: 8 timbral categories |
| α/β/γ cyclic mapping rotation | 222 | `complexes.ts`: ALPHA, BETA, GAMMA arrays, cycle every 3 subs |
| Second independent cube for C_i | 222–224 | `complexes.ts`: ComplexCube class with own S4 state |
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
| Spell detection (Rubik's algorithm recognition) | Known algorithms (sexy-move, sledgehammer, sune, T-perm, etc.) serve as gestural "words" the performer can deliberately execute. Maps finger-pattern vocabulary onto mode changes. |
| Orientation-independent spell matching | A cuber's muscle memory is face-relative. Expanding each algorithm to all 24 rotations means a sexy-move pattern works on any face pair. |
| CFOP-minimal spell book (7 spells) | The spell book is restricted to the fundamentals needed to solve any state under CFOP (2-look OLL + 2-look PLL): sexy-move and sledgehammer as F2L triggers, oll-cross / sune / anti-sune for OLL, u-perm / t-perm for PLL. Keeps the vocabulary tight so each spell is memorable and distinct under rotation expansion. |
| Gyro → S4 snap (continuous → discrete) | The cube's physical orientation in 3D maps to the nearest of the 24 S4 rotations via quaternion dot product. This bridges continuous gesture and discrete group math. |
| Expression parameters (tilt, spin, deviation, scramble) | Continuous gyro-derived values for real-time sound control. Deviation = how far from the nearest S4 snap; scramble = BFS distance from identity. |
| Scramble factor as meta-parameter | BFS distance from identity in the S4 Cayley graph. Diameter is ≤6 (small group). Normalized 0–1. "How far from solved" as a musical parameter. |
| Browser dashboard as performance HUD | Makes the abstract math legible in real time: 3D cube, vertex parameters, complex assignments, sieve strip, spell progress, expression gauges. |
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

From Xenakis' original descriptions (p. 222), mapped to cello-inspired SuperCollider synthesis:

| Type | Xenakis Description | SC SynthDef | Design Notes |
|------|-------------------|-------------|--------------|
| C1 | Ataxic cloud of sound-points | `\xk_pizz` | Noise burst → Ringz harmonics + Pluck. Random-ish attacks. |
| C2 | Ordered ascending/descending cloud | `\xk_bowed` | LFSaw + BrownNoise bow, BPeakEQ body. Sweeping contour. |
| C3 | Ordered flat cloud | `\xk_bowed` | Same synth as C2 but used for sustained, non-directional texture. |
| C4 | Ionized atom (interferences + pizzicati) | `\xk_harmonic` / `\xk_colLegno` | Sine partials (flageolet) interrupted by col legno clicks. |
| C5 | Ataxic field of sliding sounds | `\xk_gliss` | LFSaw + FM + PinkNoise bow, lagged freq. Wild slides. |
| C6 | Ordered ascending/descending sliding | `\xk_gliss` | Same synth, controlled contour. |
| C7 | Ordered flat sliding | `\xk_gliss` | Same synth, subtle movement. |
| C8 | Atom (quasi-unison interferences) | `\xk_ponticello` | Two detuned Pulse + HPF + metallic BPF ring + tremolo. |

The α/β/γ mappings shuffle which complex type sits at which vertex position. For example, vertex 1 gets C7 in α, C2 in β, and C5 in γ. Some vertices are stable across phases (vertex 0 always gets C1; vertex 6 always gets C8).

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

## Performance Speed Regimes

A Rubik's cube introduces a performance dimension Xenakis never dealt with: the rate of group transformations is controlled by the performer in real time, and varies by orders of magnitude.

### The numbers

A typical CFOP speedsolve: ~55 moves in 10–15 seconds (~4–5 turns/sec). Through the engine:

| Outcome | Count in ~55 moves |
|---------|-------------------|
| Full vertex cycles (step % 8) | ~7 |
| Sieve metabolae (every 3 turns) | ~18 (full residual class cycle) |
| α/β/γ phase changes | 6 full cycles |
| Spell detections | Many — a CFOP solve IS a sequence of algorithms |
| Distinct S4 states visited | up to 55 (with revisits) |

In Nomos Alpha, 18 group transformations unfold over ~17 minutes. A speedsolve compresses equivalent structural depth into ~10 seconds.

### Three natural regimes

| Regime | Turn rate | Character | Analogy |
|--------|-----------|-----------|---------|
| Contemplative | ~1 turn / 3–10s | Each event distinct, structure audible, close to Nomos Alpha pacing | Chamber music — performer as composer |
| Conversational | ~1–2 turns/sec | Events overlap but individually perceptible, structure felt not tracked, spells are deliberate | Improvisatory dialogue with the instrument |
| Solve/burst | ~5+ turns/sec | Structure collapses into texture, statistical character dominates | Closer to Pithoprakta/Metastasis — mass cloud behavior |

This mirrors Xenakis' own career arc: individual symbolic events (Nomos Alpha) vs. statistical clouds (Pithoprakta). A single instrument can access both poles by varying turn rate.

### What happens at solve speed

- **Sequential mode**: each voice cut off almost instantly → chattering burst of attack transients → effectively an ataxic cloud (which is C1)
- **Polyphonic mode**: all 8 voices reshuffled ~7 times in 10s → dense, constantly morphing ensemble
- **Sieve**: 18 metabolae in 10s → pitch field effectively random, each mutation inaudible before the next
- **Spells**: a CFOP solve IS a spell sequence (cross setup, F2L pairs, OLL algorithm, PLL algorithm). The spell detector would fire at structural waypoints of the solve itself

### Scramble factor as macro-arc

A solve starts scrambled (factor ~1.0) and ends solved (factor 0.0). This arc is inherently dramatic — a decrescendo from disorder to order. Design ideas:

- Scramble factor could morph synthesis macro-parameters: scrambled = dense/chaotic/loud, solved = sparse/pure/quiet
- The solve itself becomes a single long gesture (~10s arc from noise to clarity)
- Spells firing during a solve mark structural waypoints: cross done → first plateau, F2L → midpoint, OLL → approaching resolution, PLL → final gesture
- Each spell could leave acoustic residue (reverb tail, pitch memory, sustained harmonic) that accumulates, so the solve builds a harmonic trail even as events fly by

### Engine adaptation (not yet implemented)

The engine could detect the current regime from inter-turn interval and adapt behavior:

- **Slow**: full voice playback, individual events, sieve mutations audible
- **Conversational**: voices overlap, parameters interpolate, spell detection prominent
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

Xenakis' C1–C8 complex types are cello techniques. SWAM Cello 3 (Audio Modeling) is a physical-modeling VST that exposes the same parameters as continuous MIDI CC — a natural fit for XenaKube's OSC output via a Max/MSP bridge patch.

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
