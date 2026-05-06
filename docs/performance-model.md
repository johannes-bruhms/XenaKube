# Performance Model

> The musical / structural model behind XenaKube. CLAUDE.md keeps a one-paragraph summary; this file has the full per-turn loop, voice/engine modes, cube-algorithm book, expression mapping, and key math.

## Core Loop

Each physical cube turn:

1. Move -> **cube-algorithm detector** (168 rotation variants of 7 canonical algorithms).
2. If algorithm matched -> **mode manager** records the event. Effect handlers are currently stubs.
3. Cosmology advances:
   - `beta-cosmo`: visible K_i topology advances by the **physical corner permutation** for that face turn. A position `i` contains K corner `kPermutation[i]`, and the sounding read-head is the turned face's head-on top-right corner; the calibrated gyro pose only decides which face is currently top.
   - `alpha-cosmo`: K_i and C_i use the historical S4 walks; K/C assignments are derived from their S4 group elements.
4. Kinematic diagrams drive alpha-cosmo walks and remain shadow metadata in beta-cosmo.
5. C_i assignment advances only in alpha-cosmo. Beta-cosmo keeps C1..C8 fixed to local slots (`slot i -> C{i+1}`) and treats C S4 as shadow metadata.
6. If the move is one of the 12 face-moves -> emit `/xk/face` before voice dispatch.
7. **Voice engine** emits active voices (1 in sequential, 8 in polyphonic); each voice carries its `face`.
8. **Phrase planner** computes a TypeScript shadow plan for C1-C8: intended note-ons, note-offs, bend steps, release, K-duration × face-multiplier span, first-onset timing, and companion counts.
9. **Phrase echo auditor** attaches that plan id to the matching Max-rendered voice and compares the planned structure against `/xk/midi/*` echoes.
10. **Expression processor** supplies continuous gyro-derived controls; the turn-rate tracker supplies both a discrete regime and a continuous pressure scalar.
11. State broadcasts to Max (OSC) + dashboard (WS).

Current migration boundary: Max still renders live audio with the legacy `phraseC1`...`phraseC8` functions. The relay-side `PhrasePlanner` plus `PhraseEchoAuditor` are the auditable shadow source of truth used to compare intent against `/xk/midi/*` echoes before flipping Max into a pure VST/MIDI adapter.

## Voice Modes

- **Sequential**: one active vertex at a time. In beta-cosmo this is the head-on top-right corner of the last turned face relative to the current top face; in alpha-cosmo it uses the historical step walk.
- **Polyphonic**: all 8 vertices sound simultaneously; each turn morphs the ensemble.

## Engine Modes

- **Cosmology**: `beta-cosmo` is the performer-visible corner instrument; `alpha-cosmo` restores the historical Nomos Alpha S4 walk.
- **Switching cosmology**: `setMode({ cosmology })` resets structural state so beta physical topology and alpha S4 walks cannot leak into each other.
- **K_i diagram**: drives K_i in alpha-cosmo; remains a visible/shadow path only in beta-cosmo.
- **C_i algorithmic/gyro**: drives C_i assignment permutation in alpha-cosmo; remains shadow S4 metadata in beta-cosmo, where local C slots stay fixed.
- **Freeze**: turns are still detected and algorithms still log, but K_i / C_i / sieve / step do not advance.

The vertices have a single `(D, G, U)` table spanning the full ppp..fff dynamic palette (one unique level per vertex) and the V1 duration contour. Xenakis's V1/V2 path-toggle is retired. `D` values are inherited from V1's per-vertex distribution; `G` expanded from V1's 4-level alphabet to the full 8-step western-notation set; `U` restores the old 2/3/4/5 s material spans. Face signatures multiply `U` instead of replacing it. K_i permutation shuffles which visible corner holds which density/intensity/duration bundle.

## Cube Algorithms *(current = detection-only; pivoting to phrase-library -- see `docs/todo.md`)*

Rubik's cube algorithms detected from the move stream currently fire **detection events** only. The effect handlers in `src/mode-manager.ts` are stubs, so no mode change happens yet. The algorithm book covers the 6 CFOP fundamentals plus Niklas (archetypal 3-cycle commutator). Algorithms are **orientation-independent**: each is expanded into all 24 whole-cube-rotation variants at load time, so the same finger pattern fires on any face pair. Algorithms **layer**: a shorter algorithm that's a prefix of a longer one fires first; the long one fires on completion. Turns always produce sound; algorithm matches are bonus triggers on top.

| Name | Canonical Algorithm | Moves | Role | Effect |
|------|---------------------|-------|------|--------|
| sexy-move | R U R' U' | 4 | CFOP F2L trigger | (effect stub) |
| oll-cross | F R U R' U' F' | 6 | 2-look OLL: edges | (effect stub) |
| sune | R U R' U R U2 R' | 8 | 2-look OLL: corners | (effect stub) |
| anti-sune | R U2 R' U' R U' R' | 8 | 2-look OLL: inverse corners | (effect stub) |
| niklas | R U' L' U R' U' L | 7 | Commutator (corner 3-cycle) | (effect stub) |
| u-perm | R U' R U R U R U' R' U' R2 | 12 | 2-look PLL: 3-edge cycle | (effect stub) |
| t-perm | R U R' U' R' F R2 U' R' U' R U R' F' | 15 | 2-look PLL: corners + edges | (effect stub) |

Detection still fires and the dashboard logs the match; effect rebinding is tracked in `docs/todo.md` Phase B (algorithms-as-phrase-vocabulary).

**Half-turn convention (CCW)**: GAN hardware only reports 90-degree clicks, so `U2`/`R2` are stored as two CCW quarter-turns. Performers must flick half-turns CCW (speedcube default); CW flicks won't trigger the algorithm. Required technique: the cost of a lean algorithm book.

**Overlap suppression**: after an algorithm fires, algorithms whose buffer **partially overlaps** are suppressed. **Full containment** (for example, a T-perm sequence starting with a sexy-move prefix) remains allowed. Buffer timeout 2 s, max 20 moves.

## Expression (Continuous Gyro Control)

| Parameter | Source | Range |
|-----------|--------|-------|
| tilt | Pitch angle from quaternion | 0 (face down) - 1 (face up) |
| spin | Angular velocity between frames | 0 (still) - 1 (fast) |
| deviation | Distance from nearest S4 snap | 0 (locked) - 1 (boundary) |
| scramble | Exact corner-permutation solve distance | 0 (solved) - 1 (max) |

Turn rate is not a gyro expression parameter, but it is part of the same live control surface. The engine tracks turns/sec, classifies a regime, and exposes a bounded pressure value used by the synthesis mapping.

## Key Math

- **Visible corner topology**: `src/corner-topology.ts` tracks which of the 8 K corners occupies each visible cube corner. Face turns are local 4-cycles on the affected face. `src/orientation.ts` first chooses the current top face, then selects the right-hand endpoint of the turned face's shared top-face edge when the faces touch. Shallow gyro tilt does not slide the selector between corners until the top face changes.
- **Corner solve distance**: `src/scramble.ts` precomputes exact quarter-turn distance for all `8! = 40,320` visible corner permutations. This is the current `/xk/scramble` and expression-scramble source. It ignores edge cubies and corner twist.
- **S4 alpha/beta boundary**: `group.ts` provides the 24 hexahedral rotations, Cayley table, tetra-orbit math, algorithm orientation expansion, and gyro snap targets. In alpha-cosmo, K/C group elements drive the old walk assignments. In beta-cosmo, gyro updates `kGroup` as orientation metadata, `cGroup` is shadow metadata, and K/C diagrams remain non-permuting shadows.
- **C_i alpha/beta/gamma cycle**: C assignments rotate phase every 3 substitutions only in alpha-cosmo, which then permutes the phase table by `cGroup`. Beta-cosmo keeps C identities fixed to local slots so an active K corner phrases with the visible C label in the same corner.
- **Sieve L(m,n)**: pitch sets from prime residual classes mod 18; metabola every 3 substitutions.
- **Tetra orbits**: 12 even (preserve tetrahedra) + 12 odd (swap). Tetra comes from the gyro-snapped orientation shadow.
- **Turn-rate pressure**: `turnRatePressure = clamp((turnRate - 0.3) / (3.0 - 0.3), 0, 1)`. Per-complex gains in `src/swam-mapping.ts` bend density, velocity, expression, bow pressure, C8 tremolo rate, and C5 accent above the K_i baseline.
