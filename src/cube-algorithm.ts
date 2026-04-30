// === Cube Algorithm Detection: Rubik's algorithms as mode triggers ===
//
// Maintains a rolling move buffer. When the tail matches a known
// algorithm, fires a CubeAlgorithmMatch. Longest match wins to prevent
// short prefixes (e.g. sexy-move) from triggering during long algorithms.
//
// Cube algorithms are orientation-independent: each canonical algorithm is
// expanded into all 24 whole-cube-rotation variants so the same finger
// pattern is detected regardless of which faces/edges it is performed on.

import type { MoveString } from './types.js';

/** Named effect — sound/behavior TBD, just an identifier for now */
export type CubeAlgorithmEffect = string;

export interface CubeAlgorithm {
  name: string;
  /** The move sequence that defines this algorithm */
  moves: MoveString[];
  effect: CubeAlgorithmEffect;
  /** If this is a rotated variant, the canonical algorithm name it came from */
  canonical?: string;
}

export interface CubeAlgorithmMatch {
  algorithm: CubeAlgorithm;
  timestamp: number;
}

// === Whole-Cube Rotation Variants ===
//
// The 24 rotations of a cube permute {R,L,U,D,F,B} while preserving
// turn direction (CW/CCW/180°). We generate all 24 face-permutation maps
// from the three generators x, y, z and their compositions.

type Face = 'R' | 'L' | 'U' | 'D' | 'F' | 'B';
type FaceMap = Record<Face, Face>;

const FACES: Face[] = ['R', 'L', 'U', 'D', 'F', 'B'];

// Generator face maps (cube rotation = rotate whole cube as if doing that face's move)
// x: rotate around R-L axis (following R). U→F→D→B→U
// y: rotate around U-D axis (following U). R→F→L→B→R (CW from top)
// z: rotate around F-B axis (following F). R→U→L→D→R (CW from front)
const ROT_X: FaceMap = { R: 'R', L: 'L', U: 'F', F: 'D', D: 'B', B: 'U' };
const ROT_Y: FaceMap = { R: 'F', F: 'L', L: 'B', B: 'R', U: 'U', D: 'D' };
const ROT_Z: FaceMap = { R: 'U', U: 'L', L: 'D', D: 'R', F: 'F', B: 'B' };

function composeMaps(a: FaceMap, b: FaceMap): FaceMap {
  const result = {} as FaceMap;
  for (const f of FACES) result[f] = b[a[f]];
  return result;
}

function identityMap(): FaceMap {
  const m = {} as FaceMap;
  for (const f of FACES) m[f] = f;
  return m;
}

function mapsEqual(a: FaceMap, b: FaceMap): boolean {
  return FACES.every(f => a[f] === b[f]);
}

/** Generate all 24 distinct face-permutation maps from x, y, z generators */
function generate24Rotations(): FaceMap[] {
  const rotations: FaceMap[] = [identityMap()];
  const gens = [ROT_X, ROT_Y, ROT_Z];

  // BFS: compose existing rotations with generators until we have all 24
  let frontier = [identityMap()];
  while (frontier.length > 0) {
    const next: FaceMap[] = [];
    for (const r of frontier) {
      for (const g of gens) {
        const composed = composeMaps(r, g);
        if (!rotations.some(existing => mapsEqual(existing, composed))) {
          rotations.push(composed);
          next.push(composed);
        }
      }
    }
    frontier = next;
  }
  return rotations;
}

const ALL_ROTATIONS = generate24Rotations();

/** Apply a face permutation to a single move string (e.g. "R'" → "F'") */
function rotateMove(move: MoveString, faceMap: FaceMap): MoveString {
  // Parse: face is first char, suffix is rest (', 2, or empty)
  const face = move[0] as Face;
  const suffix = move.slice(1);
  return faceMap[face] + suffix;
}

/** Apply a face permutation to an entire move sequence */
function rotateMoves(moves: MoveString[], faceMap: FaceMap): MoveString[] {
  return moves.map(m => rotateMove(m, faceMap));
}

/** Expand a canonical algorithm book into orientation-independent variants */
export function expandCubeAlgorithmBook(canonical: CubeAlgorithm[]): CubeAlgorithm[] {
  const expanded: CubeAlgorithm[] = [];
  const seen = new Set<string>();

  for (const alg of canonical) {
    for (const rot of ALL_ROTATIONS) {
      const rotated = rotateMoves(alg.moves, rot);
      const key = rotated.join(' ');
      if (!seen.has(key)) {
        seen.add(key);
        expanded.push({
          name: alg.name,
          moves: rotated,
          effect: alg.effect,
          canonical: alg.name,
        });
      }
    }
  }

  return expanded;
}

// === Cube Algorithm Book ===
// Canonical algorithms — one representative orientation each.
// The detector expands these into all 24 rotation variants automatically.

// Minimal CFOP fundamentals — 6 algorithms covering the essential vocabulary
// needed to solve any state using 2-look OLL + 2-look PLL.
//
//   F2L trigger:    sexy-move
//   2-look OLL:     oll-cross (edges), sune + anti-sune (corners)
//   2-look PLL:     t-perm (corners+edges), u-perm (3-edge cycle)
//
// Half-turn convention (CCW): X2 is expanded into two CCW quarter-turns
// (e.g. U2 → U' U'). GAN hardware only reports 90° clicks, so the detector
// never sees a single "X2" token. Performers habitually flick half-turns
// CCW (left-index pull); reversing direction will fail to trigger.
export const CANONICAL_CUBE_ALGORITHMS: CubeAlgorithm[] = [
  // --- F2L building block (4 moves) ---
  {
    name: 'sexy-move',
    moves: ['R', 'U', "R'", "U'"],
    effect: 'sexy-move',
  },

  // --- 2-look OLL (edges, then corners) ---
  {
    name: 'oll-cross',
    moves: ['F', 'R', 'U', "R'", "U'", "F'"],
    effect: 'oll-cross',
  },
  {
    // Canonical: R U R' U R U2 R' (7). U2 expanded CCW → 8 quarter-turns.
    name: 'sune',
    moves: ['R', 'U', "R'", 'U', 'R', "U'", "U'", "R'"],
    effect: 'sune',
  },
  {
    // Canonical: R U2 R' U' R U' R' (7). U2 expanded CCW → 8 quarter-turns.
    name: 'anti-sune',
    moves: ['R', "U'", "U'", "R'", "U'", 'R', "U'", "R'"],
    effect: 'anti-sune',
  },

  // --- 2-look PLL ---
  {
    // Canonical: R U' R U R U R U' R' U' R2 (11). R2 expanded CCW → 12.
    name: 'u-perm',
    moves: ['R', "U'", 'R', 'U', 'R', 'U', 'R', "U'", "R'", "U'", "R'", "R'"],
    effect: 'u-perm',
  },
  {
    // Canonical: R U R' U' R' F R2 U' R' U' R U R' F' (14). R2 expanded CCW → 15.
    name: 't-perm',
    moves: ['R', 'U', "R'", "U'", "R'", 'F', "R'", "R'", "U'", "R'", "U'", 'R', 'U', "R'", "F'"],
    effect: 't-perm',
  },

  // --- Commutator family (counterweight to CFOP) ---
  // Niklas: archetypal 3-cycle corner commutator. See revision_roadmap.md D19.
  {
    name: 'niklas',
    moves: ['R', "U'", "L'", 'U', "R'", "U'", 'L'],
    effect: 'niklas',
  },
];

/** Expanded algorithm book with all rotation variants */
export const CUBE_ALGORITHM_BOOK: CubeAlgorithm[] = expandCubeAlgorithmBook(CANONICAL_CUBE_ALGORITHMS);

const BUFFER_TIMEOUT_MS = 2000;
const MAX_BUFFER = 20;

export class CubeAlgorithmDetector {
  private buffer: { move: MoveString; time: number }[] = [];
  private algorithmBook: CubeAlgorithm[];
  /** Tracks the buffer position (total push count) at which each algorithm last fired */
  private lastFired = new Map<string, number>();
  private pushCount = 0;

  /**
   * Overlap suppression: prevents rotation variants from triggering on
   * overlapping buffer windows (e.g. cycling F U' F' U fires 3 different
   * 4-move algorithms without this). After an algorithm fires, others whose
   * buffer window PARTIALLY overlaps are suppressed. Full containment
   * (longer algorithm encompasses shorter) is still allowed (layered detection).
   *
   * Math: previous match at `E` with length `Lp`, candidate length `L`, gap = pushCount - E.
   *   - No overlap (allow):         gap >= L
   *   - Full containment (allow):   gap <= L - Lp  (candidate extends back past previous)
   *   - Partial overlap (suppress): L - Lp < gap < L
   */
  private lastMatchEnd = 0;
  private lastMatchLength = 0;

  constructor(algorithmBook: CubeAlgorithm[] = CUBE_ALGORITHM_BOOK) {
    // Validate: no two DIFFERENT algorithms share the same move sequence
    const seen = new Map<string, string>();
    for (const alg of algorithmBook) {
      const key = alg.moves.join(' ');
      const existing = seen.get(key);
      if (existing && existing !== alg.name) {
        throw new Error(`Algorithm collision: "${alg.name}" and "${existing}" share moves [${key}]`);
      }
      seen.set(key, alg.name);
    }
    this.algorithmBook = [...algorithmBook].sort((a, b) => b.moves.length - a.moves.length);
  }

  /** Push a move. Returns the longest algorithm that fired, or null. */
  push(move: MoveString, now: number = Date.now()): CubeAlgorithmMatch | null {
    const matches = this.pushAll(move, now);
    return matches.length > 0 ? matches[0] : null;
  }

  /** Push a move and return ALL algorithms that fired (layered — multiple can fire on one move). */
  pushAll(move: MoveString, now: number = Date.now()): CubeAlgorithmMatch[] {
    // Flush stale moves (gap > timeout)
    if (this.buffer.length > 0) {
      const last = this.buffer[this.buffer.length - 1];
      if (now - last.time > BUFFER_TIMEOUT_MS) {
        this.buffer = [];
        this.lastFired.clear();
        this.lastMatchEnd = 0;
        this.lastMatchLength = 0;
      }
    }

    this.buffer.push({ move, time: now });
    this.pushCount++;

    if (this.buffer.length > MAX_BUFFER) {
      this.buffer.shift();
    }

    // Snapshot overlap state from previous push (so all candidates in this
    // push are evaluated against the same baseline — preserves layered detection)
    const prevMatchEnd = this.lastMatchEnd;
    const prevMatchLength = this.lastMatchLength;

    const matches: CubeAlgorithmMatch[] = [];
    let bestMatchLength = 0;

    for (const alg of this.algorithmBook) {
      if (this.tailMatches(alg.moves)) {
        const lastPos = this.lastFired.get(alg.name) ?? -1;
        if (this.pushCount > lastPos) {
          // Overlap suppression: suppress partial overlap, allow full containment
          if (prevMatchEnd > 0) {
            const gap = this.pushCount - prevMatchEnd;
            const L = alg.moves.length;
            if (L - prevMatchLength < gap && gap < L) {
              continue; // partial overlap with recent match — suppress
            }
          }
          this.lastFired.set(alg.name, this.pushCount);
          matches.push({ algorithm: alg, timestamp: now });
          bestMatchLength = Math.max(bestMatchLength, alg.moves.length);
        }
      }
    }

    // Update overlap tracking with the longest match from this push
    if (bestMatchLength > 0) {
      this.lastMatchEnd = this.pushCount;
      this.lastMatchLength = bestMatchLength;
    }

    return matches;
  }

  /** Check if the buffer tail matches a move sequence */
  private tailMatches(moves: MoveString[]): boolean {
    const len = moves.length;
    if (this.buffer.length < len) return false;

    const offset = this.buffer.length - len;
    for (let i = 0; i < len; i++) {
      if (this.buffer[offset + i].move !== moves[i]) return false;
    }
    return true;
  }

  /** Get current buffer contents (for dashboard visualization) */
  getBuffer(): MoveString[] {
    return this.buffer.map(b => b.move);
  }

  /** Get all algorithms in the book (includes rotation variants) */
  getAlgorithmBook(): CubeAlgorithm[] {
    return this.algorithmBook;
  }

  /** Get unique algorithm names (one entry per canonical algorithm, for UI display) */
  getCanonicalAlgorithms(): CubeAlgorithm[] {
    const seen = new Set<string>();
    const result: CubeAlgorithm[] = [];
    for (const alg of this.algorithmBook) {
      if (!seen.has(alg.name)) {
        seen.add(alg.name);
        result.push(alg);
      }
    }
    return result;
  }

  /** How far the current buffer is into each algorithm (for UI prefix highlighting).
   *  Deduplicates by algorithm name — returns the longest partial match per canonical algorithm. */
  getPartialMatches(): { algorithm: CubeAlgorithm; matched: number }[] {
    const best = new Map<string, { algorithm: CubeAlgorithm; matched: number }>();
    for (const alg of this.algorithmBook) {
      const matched = this.prefixMatchLength(alg.moves);
      if (matched > 0) {
        const existing = best.get(alg.name);
        if (!existing || matched > existing.matched) {
          best.set(alg.name, { algorithm: alg, matched });
        }
      }
    }
    return [...best.values()];
  }

  private prefixMatchLength(moves: MoveString[]): number {
    const bufMoves = this.buffer.map(b => b.move);
    for (let start = Math.max(0, bufMoves.length - moves.length); start < bufMoves.length; start++) {
      const slice = bufMoves.slice(start);
      let match = true;
      for (let i = 0; i < slice.length; i++) {
        if (slice[i] !== moves[i]) { match = false; break; }
      }
      if (match) return slice.length;
    }
    return 0;
  }

  /** Clear the buffer */
  reset(): void {
    this.buffer = [];
    this.lastFired.clear();
    this.pushCount = 0;
    this.lastMatchEnd = 0;
    this.lastMatchLength = 0;
  }
}
