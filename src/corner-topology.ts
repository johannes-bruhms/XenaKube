// === Physical Corner Topology ===
//
// This is the performer-visible topology: the 8 corner cubies moving through
// the 8 cube corners. Unlike S4 whole-cube rotations, these permutations come
// only from physical face turns. The state intentionally ignores corner twist
// and edges because the current musical surface only assigns K_i material to
// visible corner positions.

import type { MoveString, Permutation8 } from './types.js';

export const IDENTITY_CORNER_PERM: Permutation8 = [0, 1, 2, 3, 4, 5, 6, 7];

function invertPerm(p: Permutation8): Permutation8 {
  const inv: Permutation8 = [0, 0, 0, 0, 0, 0, 0, 0];
  for (let i = 0; i < 8; i++) inv[p[i]] = i;
  return inv;
}

function composeReorder(a: Permutation8, b: Permutation8): Permutation8 {
  return [
    a[b[0]], a[b[1]], a[b[2]], a[b[3]],
    a[b[4]], a[b[5]], a[b[6]], a[b[7]],
  ];
}

function twice(p: Permutation8): Permutation8 {
  return composeReorder(p, p);
}

// Reorder convention: new position i receives the cubie that was at old
// position perm[i]. This matches vertices.ts and dashboard state semantics.
//
// Direction convention: every quarter-turn rotates its face CW as viewed
// from OUTSIDE that face (= standard WCA cube notation). U/D are CW from
// above/below; R/L/F/B are CW from +X / -X / +Z / -Z respectively.
// This convention is enforced by `face direction` tests in
// `test/corner-topology.test.ts`.
const R: Permutation8 = [4, 1, 2, 0, 7, 5, 6, 3];
const U: Permutation8 = [3, 0, 1, 2, 4, 5, 6, 7];
const F: Permutation8 = [1, 5, 2, 3, 0, 4, 6, 7];
const L: Permutation8 = [0, 2, 6, 3, 4, 1, 5, 7];
const D: Permutation8 = [0, 1, 2, 3, 5, 6, 7, 4];
const B: Permutation8 = [0, 1, 3, 7, 4, 5, 2, 6];

export const CORNER_MOVE_PERMS: Record<string, Permutation8> = {
  R,
  "R'": invertPerm(R),
  R2: twice(R),
  L,
  "L'": invertPerm(L),
  L2: twice(L),
  U,
  "U'": invertPerm(U),
  U2: twice(U),
  D,
  "D'": invertPerm(D),
  D2: twice(D),
  F,
  "F'": invertPerm(F),
  F2: twice(F),
  B,
  "B'": invertPerm(B),
  B2: twice(B),
};

export const CORNER_QUARTER_MOVES: readonly MoveString[] = [
  'R', "R'", 'L', "L'", 'U', "U'", 'D', "D'", 'F', "F'", 'B', "B'",
] as const;

export function parseMoveToCornerPermutation(move: MoveString): Permutation8 | null {
  return CORNER_MOVE_PERMS[move] ?? null;
}

export function applyCornerPermutation(state: Permutation8, movePerm: Permutation8): Permutation8 {
  return [
    state[movePerm[0]], state[movePerm[1]], state[movePerm[2]], state[movePerm[3]],
    state[movePerm[4]], state[movePerm[5]], state[movePerm[6]], state[movePerm[7]],
  ];
}

export function applyCornerMove(state: Permutation8, move: MoveString): Permutation8 | null {
  const movePerm = parseMoveToCornerPermutation(move);
  if (!movePerm) return null;
  return applyCornerPermutation(state, movePerm);
}

export function cornerPermutationKey(p: Permutation8): string {
  return p.join(',');
}

export function isSolvedCornerPermutation(p: Permutation8): boolean {
  for (let i = 0; i < 8; i++) {
    if (p[i] !== i) return false;
  }
  return true;
}

const FACT: number[] = [1, 1, 2, 6, 24, 120, 720, 5040, 40320];

/** Lehmer-code index in [0, 40319] for any permutation of 0..7. */
export function encodeCornerPermutation(p: Permutation8): number {
  let idx = 0;
  for (let i = 0; i < 8; i++) {
    let smallerUnused = 0;
    for (let j = i + 1; j < 8; j++) {
      if (p[j] < p[i]) smallerUnused++;
    }
    idx += smallerUnused * FACT[7 - i];
  }
  return idx;
}

