// === Orientation: top-face anchored "top right corner of each face" ===
//
// Pure functions that determine, given the cube's current world orientation
// (a unit quaternion produced by the relay's calibrated gyro), which corner
// of each face is the active read-head for Design C selector logic.
//
// Convention. The gyro determines which cube-local face is currently top.
// That top face marks the four "top" corners. For a surrounding turned face,
// "top right" means the right-hand corner of that face's edge shared with
// the current top face, as seen when looking at the turned face head-on. Top
// is not scored per corner; all four corners of the top face are equally top.
//
// Canonical homes (gyro = identity) - 5 distinct vertices, R/U intentionally
// collide on BTR (the cubie where R, U, and B faces all meet, which is the
// natural "top right" for both R-face-from-outside and U-face-from-above):
//
//   F -> 0 (FTR)    R -> 3 (BTR)    U -> 3 (BTR - shares with R)
//   L -> 1 (FTL)    B -> 2 (BTL)    D -> 6 (BBL - back-bottom-left under -Z up-of-view)

import type { Quaternion } from './types.js';

export type Face = 'U' | 'D' | 'L' | 'R' | 'F' | 'B';

export const FACES: Face[] = ['U', 'D', 'L', 'R', 'F', 'B'];

const FACE_NORMAL: Record<Face, [number, number, number]> = {
  R: [1, 0, 0],
  L: [-1, 0, 0],
  U: [0, 1, 0],
  D: [0, -1, 0],
  F: [0, 0, 1],
  B: [0, 0, -1],
};

const FACE_CORNERS: Record<Face, [number, number, number, number]> = {
  R: [0, 3, 4, 7],
  L: [1, 2, 5, 6],
  U: [0, 1, 2, 3],
  D: [4, 5, 6, 7],
  F: [0, 1, 4, 5],
  B: [2, 3, 6, 7],
};

const CUBE_VERTS_LOCAL: ReadonlyArray<readonly [number, number, number]> = [
  [ 1,  1,  1],  // 0 FTR
  [-1,  1,  1],  // 1 FTL
  [-1,  1, -1],  // 2 BTL
  [ 1,  1, -1],  // 3 BTR
  [ 1, -1,  1],  // 4 FBR
  [-1, -1,  1],  // 5 FBL
  [-1, -1, -1],  // 6 BBL
  [ 1, -1, -1],  // 7 BBR
];

/** Face-view up vectors used when no current-top-face edge exists. */
const FACE_VIEW_UP: Record<Face, readonly [number, number, number]> = {
  R: [0, 1, 0],
  L: [0, 1, 0],
  F: [0, 1, 0],
  B: [0, 1, 0],
  U: [0, 0, -1],
  D: [0, 0, -1],
};

/** Apply a unit quaternion to a 3-vector. v' = q * v * q^-1. */
function applyQuat(q: Quaternion, v: readonly [number, number, number]): [number, number, number] {
  const [qx, qy, qz, qw] = q;
  const [vx, vy, vz] = v;
  // t = 2 (q.xyz x v)
  const tx = 2 * (qy * vz - qz * vy);
  const ty = 2 * (qz * vx - qx * vz);
  const tz = 2 * (qx * vy - qy * vx);
  // result = v + qw * t + (q.xyz x t)
  return [
    vx + qw * tx + (qy * tz - qz * ty),
    vy + qw * ty + (qz * tx - qx * tz),
    vz + qw * tz + (qx * ty - qy * tx),
  ];
}

function dot(a: readonly [number, number, number], b: readonly [number, number, number]): number {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

function cross(a: readonly [number, number, number], b: readonly [number, number, number]): [number, number, number] {
  return [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ];
}

function facesAdjacent(a: Face, b: Face): boolean {
  return dot(FACE_NORMAL[a], FACE_NORMAL[b]) === 0;
}

function sharedFaceCorners(a: Face, b: Face): number[] {
  const bCorners = new Set(FACE_CORNERS[b]);
  return FACE_CORNERS[a].filter(idx => bCorners.has(idx));
}

/**
 * Determine which cube-local face is currently most aligned with world +Y
 * after applying `quat`. Winner-take-all: returns the face whose outward
 * normal has the highest +Y component in world space.
 */
export function upFace(quat: Quaternion): Face {
  let best: Face = 'U';
  let bestY = -Infinity;
  for (const face of FACES) {
    const n = applyQuat(quat, FACE_NORMAL[face]);
    if (n[1] > bestY) {
      bestY = n[1];
      best = face;
    }
  }
  return best;
}

/**
 * Top-right corner of `face` under current `quat` orientation. `quat` is
 * used only to determine the current top face. If the turned face touches
 * that top face, the candidate edge is their shared edge; the chosen corner
 * is the right-hand endpoint when the turned face is viewed head-on.
 *
 * When the turned face is the top face itself, or the face opposite it,
 * there is no surrounding-face shared top edge. In that case we fall back to
 * the face's canonical head-on view-up vector.
 */
export function topRightCorner(face: Face, quat: Quaternion): number {
  const top = upFace(quat);
  const touchesTop = face !== top && facesAdjacent(face, top);
  const topAxis = touchesTop ? FACE_NORMAL[top] : FACE_VIEW_UP[face];
  const rightAxis = cross(topAxis, FACE_NORMAL[face]);
  const corners = touchesTop ? sharedFaceCorners(face, top) : FACE_CORNERS[face];
  let bestIdx = corners[0];
  let bestScore = -Infinity;
  for (const idx of corners) {
    const local = CUBE_VERTS_LOCAL[idx];
    const score = 100 * dot(local, topAxis) + dot(local, rightAxis);
    if (score > bestScore + 1e-9) {
      bestScore = score;
      bestIdx = idx;
    }
  }
  return bestIdx;
}
