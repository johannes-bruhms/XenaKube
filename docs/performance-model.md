# Performance Model

> The musical / structural model behind XenaKube. CLAUDE.md keeps a one-paragraph summary; this file has the full per-turn loop, voice/engine modes, cube-algorithm book, expression mapping, and key math.

## Core Loop

Each physical cube turn:

1. Move → **cube-algorithm detector** (168 rotation variants of 7 canonical algorithms).
2. If algorithm matched → **mode manager** applies effect.
3. K_i advances (S4 right-multiplication → parameter permutation).
4. C_i advances (complex type permutation).
5. If the move is one of the 12 face-moves → emit `/xk/face` (before voice dispatch).
6. **Voice engine** emits active voices (1 in sequential, 8 in polyphonic); each voice carries its `face`.
7. **Phrase planner** computes a TypeScript shadow plan for C1-C8: intended note-ons, note-offs, bend steps, release, face-owned duration, first-onset timing, and companion counts. This is the migration seam away from Max phrase logic; it is displayed in the dashboard and summarized to Max as `/xk/phrase/plan`.
8. **Phrase echo auditor** attaches that plan id to the matching Max-rendered voice and compares the planned structure against `/xk/midi/*` echoes. This catches missing first note-ons, all-missing gliss bends, unexpected companions, and stolen phrases before the dashboard interpretation can hide the problem.
9. **Expression processor** supplies continuous gyro-derived controls.
10. State broadcast to Max (OSC) + dashboard (WS).

Current migration boundary: Max still renders live audio with the legacy `phraseC1`...`phraseC8` functions. The relay-side `PhrasePlanner` plus `PhraseEchoAuditor` are the auditable shadow source of truth used to compare intent against `/xk/midi/*` echoes before flipping Max into a pure VST/MIDI adapter.

## Voice Modes

- **Sequential**: one active vertex at a time, cycling through positions.
- **Polyphonic**: all 8 vertices sound simultaneously; each turn morphs the ensemble.

## Engine Modes

- **K_i**: `direct` (physical turn = S4 transform) or `diagram` (pre-composed path advanced by each turn).
- **C_i**: `algorithmic` (own S4 diagram) or `gyro` (quaternion snapped to nearest S4 element).
- **Freeze**: turns still detected but state doesn't advance.

The vertices have a single `(D, G)` table spanning the full ppp..fff dynamic palette (one unique level per vertex). Xenakis's V1/V2 path-toggle was retired. `D` values are inherited from V1's per-vertex distribution; `G` expanded from V1's 4-level alphabet to the full 8-step western-notation set so the cube always exposes every dynamic level. `U`/duration is deliberately neutral in K_i: phrase time belongs to the 12 face gestures so the same face remains recognizable through K/C permutations. K_i permutation shuffles which physical position holds which density/intensity per cube state.

## Cube Algorithms *(current = mode-toggles; pivoting to phrase-library — see `docs/todo.md`)*

Rubik's cube algorithms detected from the move stream currently fire **detection events** only — the effect handlers in `src/mode-manager.ts` are stubs (every `case` is empty), so no mode change happens yet. The algorithm book covers the 6 CFOP fundamentals plus Niklas (archetypal 3-cycle commutator). Algorithms are **orientation-independent** — each is expanded into all 24 whole-cube-rotation variants at load time, so the same finger pattern fires on any face pair. Algorithms **layer**: a shorter algorithm that's a prefix of a longer one fires first; the long one fires on completion. Turns always produce sound; algorithm matches are bonus triggers on top.

| Name | Canonical Algorithm | Moves | Role | Effect |
|------|---------------------|-------|------|--------|
| sexy-move | R U R' U' | 4 | CFOP F2L trigger | (effect stub — no mode change) |
| oll-cross | F R U R' U' F' | 6 | 2-look OLL: edges | (effect stub) |
| sune | R U R' U R U2 R' | 8 | 2-look OLL: corners | (effect stub) |
| anti-sune | R U2 R' U' R U' R' | 8 | 2-look OLL: inverse corners | (effect stub) |
| niklas | R U' L' U R' U' L | 7 | Commutator (corner 3-cycle) | (effect stub — was CTRL harmonic ping; CTRL becomes algorithm-only here when re-bound) |
| u-perm | R U' R U R U R U' R' U' R2 | 12 | 2-look PLL: 3-edge cycle | (effect stub) |
| t-perm | R U R' U' R' F R2 U' R' U' R U R' F' | 15 | 2-look PLL: corners + edges | (effect stub) |

Detection still fires and the dashboard logs the match; effect rebinding is tracked in `docs/todo.md` Phase B (algorithms-as-phrase-vocabulary).

**Half-turn convention (CCW)**: GAN hardware only reports 90° clicks, so `U2`/`R2` are stored as two CCW quarter-turns. Performers must flick half-turns CCW (speedcube default); CW flicks won't trigger the algorithm. Required technique — the cost of a lean algorithm book.

**Overlap suppression**: after an algorithm fires, algorithms whose buffer **partially overlaps** are suppressed. **Full containment** (e.g. a T-perm sequence starting with a sexy-move prefix) remains allowed — layered detection preserved. Buffer timeout 2 s, max 20 moves.

## Expression (Continuous Gyro Control)

| Parameter | Source | Range |
|-----------|--------|-------|
| tilt | Pitch angle from quaternion | 0 (face down) – 1 (face up) |
| spin | Angular velocity between frames | 0 (still) – 1 (fast) |
| deviation | Distance from nearest S4 snap | 0 (locked) – 1 (boundary) |
| scramble | BFS distance from identity in S4 | 0 (solved) – 1 (max) |

## Key Math

- **S4**: 24 rotations generated from X90, Y90, Z90. Cayley table computed at load.
- **Move mapping**: face turns → whole-cube S4 rotations. R and L' produce the same element — 18 moves collapse to ~9 distinct S4 elements. Temporal Identity restores the discarded face-identity information as the primary sound-bearing signal, running parallel to S4 (which still drives K_i / C_i permutation, now modulating gesture content rather than selecting it).
- **α/β/γ cycle**: C_i mapping rotates every 3 substitutions.
- **Sieve L(m,n)**: pitch sets from prime residual classes mod 18; metabola every 3 subs.
- **Tetra orbits**: 12 even (preserve tetrahedra) + 12 odd (swap).
