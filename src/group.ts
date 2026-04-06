// === S4 Hexahedral Group (24 rotation symmetries of the cube) ===
//
// The rotation group of the cube is isomorphic to S4 (symmetric group on 4 elements).
// We represent it concretely as permutations of 8 cube vertices.
//
// Vertex labeling (standard cube):
//   Top face:  0(FTR) 1(FTL) 2(BTL) 3(BTR)
//   Bot face:  4(FBR) 5(FBL) 6(BBL) 7(BBR)
//
// Three generating rotations (90° CW viewed from outside):
//   R: rotation around right face (x-axis)
//   U: rotation around top face (y-axis)
//   F: rotation around front face (z-axis)

import type { GroupElement, Permutation8, CubeMove, MoveString } from './types.js';

/** Identity permutation */
const ID: Permutation8 = [0, 1, 2, 3, 4, 5, 6, 7];

/** Apply permutation b after permutation a: result[i] = b[a[i]] */
function compose(a: Permutation8, b: Permutation8): Permutation8 {
  return [b[a[0]], b[a[1]], b[a[2]], b[a[3]], b[a[4]], b[a[5]], b[a[6]], b[a[7]]];
}

/** Invert a permutation */
function invert(p: Permutation8): Permutation8 {
  const inv: Permutation8 = [0, 0, 0, 0, 0, 0, 0, 0];
  for (let i = 0; i < 8; i++) inv[p[i]] = i;
  return inv;
}

// === 3 generating rotations as vertex permutations ===
//
// Cube vertices labeled (right-hand coordinates):
//   Top: 0=FTR 1=FTL 2=BTL 3=BTR
//   Bot: 4=FBR 5=FBL 6=BBL 7=BBR
//
// Image permutations: p[i] = where vertex i goes.
// A whole-cube rotation around an axis moves ALL 8 vertices.

/** X-axis 90° CW (viewed from +x): cycle (0 3 7 4)(1 2 6 5) */
const X90: Permutation8 = [3, 2, 6, 7, 0, 1, 5, 4];

/** Y-axis 90° CW (viewed from +y): cycle (0 3 2 1)(4 7 6 5) */
const Y90: Permutation8 = [3, 0, 1, 2, 7, 4, 5, 6];

/** Z-axis 90° CW (viewed from +z): cycle (0 4 5 1)(3 7 6 2) */
const Z90: Permutation8 = [4, 0, 3, 7, 5, 1, 2, 6];

// Derive all 6 face CW rotations
const R_CW = X90;
const L_CW = invert(X90);     // or compose 3 times
const U_CW = Y90;
const D_CW = invert(Y90);
const F_CW = Z90;
const B_CW = invert(Z90);

/** All 12 generators: 6 faces × CW/CCW */
const GENERATORS: Record<string, Permutation8> = {
  'R':  R_CW,
  "R'": invert(R_CW),
  'R2': compose(R_CW, R_CW),
  'L':  L_CW,
  "L'": invert(L_CW),
  'L2': compose(L_CW, L_CW),
  'U':  U_CW,
  "U'": invert(U_CW),
  'U2': compose(U_CW, U_CW),
  'D':  D_CW,
  "D'": invert(D_CW),
  'D2': compose(D_CW, D_CW),
  'F':  F_CW,
  "F'": invert(F_CW),
  'F2': compose(F_CW, F_CW),
  'B':  B_CW,
  "B'": invert(B_CW),
  'B2': compose(B_CW, B_CW),
};

// === Generate all 24 elements by closure ===

function permKey(p: Permutation8): string {
  return p.join(',');
}

function generateGroup(): Permutation8[] {
  const seen = new Set<string>();
  const elements: Permutation8[] = [];
  const queue: Permutation8[] = [ID];
  seen.add(permKey(ID));

  while (queue.length > 0) {
    const current = queue.shift()!;
    elements.push(current);

    // Apply each basic generator (90° CW for R, U, F — these 3 generate all 24)
    for (const gen of [R_CW, U_CW, F_CW]) {
      const next = compose(current, gen);
      const key = permKey(next);
      if (!seen.has(key)) {
        seen.add(key);
        queue.push(next);
      }
    }
  }

  return elements;
}

/** The 24 rotation elements as vertex permutations. Index 0 = identity. */
export const ELEMENTS: Permutation8[] = generateGroup();

/** Map from permutation string → element index */
const elementIndex = new Map<string, number>();
for (let i = 0; i < ELEMENTS.length; i++) {
  elementIndex.set(permKey(ELEMENTS[i]), i);
}

/** 24×24 Cayley multiplication table: CAYLEY[a][b] = index of a·b */
export const CAYLEY: number[][] = [];
for (let a = 0; a < 24; a++) {
  CAYLEY[a] = [];
  for (let b = 0; b < 24; b++) {
    const product = compose(ELEMENTS[a], ELEMENTS[b]);
    CAYLEY[a][b] = elementIndex.get(permKey(product))!;
  }
}

/** Inverse table: INVERSES[a] = index of a⁻¹ */
export const INVERSES: number[] = ELEMENTS.map((el, i) => {
  const inv = invert(el);
  return elementIndex.get(permKey(inv))!;
});

/** Multiply two group elements (by index) */
export function multiply(a: GroupElement, b: GroupElement): GroupElement {
  return CAYLEY[a][b];
}

/** Get inverse of a group element */
export function inverse(a: GroupElement): GroupElement {
  return INVERSES[a];
}

/** Identity element index (always 0) */
export const IDENTITY: GroupElement = 0;

/** Get the vertex permutation for a group element */
export function getPermutation(el: GroupElement): Permutation8 {
  return ELEMENTS[el];
}

// === Tetrahedral orbit classification ===
// The 24 rotations split into:
//   - 12 "even" rotations (preserve tetrahedron orientation) = A4
//   - 12 "odd" rotations (swap the two tetrahedra)
// The two interlocking tetrahedra of a cube: {0,2,5,7} and {1,3,4,6}
// A rotation is "even" if it maps {0,2,5,7} to itself (permutes within).

const TETRA_A: Set<number> = new Set([0, 2, 5, 7]);

/** Classify into tetrahedral orbit: 0 = preserves tetrahedra, 1 = swaps */
export function tetraOrbit(el: GroupElement): number {
  const perm = ELEMENTS[el];
  // Check if vertex 0 maps to a vertex in tetrahedron A
  return TETRA_A.has(perm[0]) && TETRA_A.has(perm[2]) ? 0 : 1;
}

// === Physical move parsing ===

/** Parse a move string like "R", "U'", "F2" into a group element index */
export function parseMoveToElement(move: MoveString): GroupElement | null {
  const gen = GENERATORS[move];
  if (!gen) return null;
  const key = permKey(gen);
  return elementIndex.get(key) ?? null;
}

/** Convert CubeMove to move string */
export function moveToString(move: CubeMove): MoveString {
  const suffix = move.direction === -1 ? "'" : move.direction === 2 ? '2' : '';
  return `${move.face}${suffix}`;
}

/** Look up the element index for a permutation */
export function findElement(perm: Permutation8): GroupElement | null {
  return elementIndex.get(permKey(perm)) ?? null;
}
