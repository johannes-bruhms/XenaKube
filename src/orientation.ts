// === Orientation: top-face anchored direction-aware corner selector ===
//
// Pure functions that determine, given the cube's current world orientation
// (a unit quaternion produced by the relay's calibrated gyro), which corner
// of each face-move is the active read-head for beta-cosmo selector logic.
//
// Convention. The gyro determines which cube-local face is currently top.
// That top face marks the four "top" corners. For a surrounding turned face,
// the selected edge is the face's edge shared with the current top face:
// clockwise turns activate the head-on top-right endpoint, counterclockwise
// turns activate the head-on top-left endpoint. For the face currently on top
// (or bottom), the selected edge is the one facing the user; clockwise turns
// activate the left endpoint facing the user, counterclockwise the right.
//
// Mechanically this is a collision rule: choose the orientation-defined edge,
// then pick the endpoint that the quarter-turn moves a K corner into.
//
// Canonical homes (gyro = identity, engine L side facing the user after the
// canonical red-front/white-top remap):
//
//   F -> 0   F' -> 1      R -> 3   R' -> 0
//   L -> 1   L' -> 2      B -> 2   B' -> 3
//   U -> 2   U' -> 1      D -> 5   D' -> 6

import type { Quaternion } from './types.js';
import type { FaceMove } from './face-gesture.js';
import { CORNER_MOVE_PERMS } from './corner-topology.js';

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

const OPPOSITE_FACE: Record<Face, Face> = {
  U: 'D',
  D: 'U',
  L: 'R',
  R: 'L',
  F: 'B',
  B: 'F',
};

const FACE_CORNERS: Record<Face, [number, number, number, number]> = {
  R: [0, 3, 4, 7],
  L: [1, 2, 5, 6],
  U: [0, 1, 2, 3],
  D: [4, 5, 6, 7],
  F: [0, 1, 4, 5],
  B: [2, 3, 6, 7],
};

// Dashboard/connect canonical pose puts the user/camera on engine -X after
// the GAN->engine remap. This is only used to disambiguate top/bottom faces.
const USER_FORWARD_WORLD: readonly [number, number, number] = [-1, 0, 0];

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

function facesAdjacent(a: Face, b: Face): boolean {
  return dot(FACE_NORMAL[a], FACE_NORMAL[b]) === 0;
}

function sharedFaceCorners(a: Face, b: Face): number[] {
  const bCorners = new Set(FACE_CORNERS[b]);
  return FACE_CORNERS[a].filter(idx => bCorners.has(idx));
}

function edgeTuple(edge: number[], face: Face): [number, number] {
  return [
    edge[0] ?? FACE_CORNERS[face][0],
    edge[1] ?? FACE_CORNERS[face][1],
  ];
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
 * Side face most aimed at the user/camera under the current calibrated gyro.
 * The current top and bottom faces are excluded so this always names the
 * side edge that top/bottom turns present to the performer.
 */
export function userFacingSideFace(quat: Quaternion, top: Face = upFace(quat)): Face {
  let best: Face = 'L';
  let bestScore = -Infinity;
  for (const face of FACES) {
    if (face === top || face === OPPOSITE_FACE[top]) continue;
    const n = applyQuat(quat, FACE_NORMAL[face]);
    const score = dot(n, USER_FORWARD_WORLD);
    if (score > bestScore) {
      bestScore = score;
      best = face;
    }
  }
  return best;
}

function selectedEdgeForFace(face: Face, quat: Quaternion): [number, number] {
  const top = upFace(quat);
  if (face !== top && facesAdjacent(face, top)) {
    return edgeTuple(sharedFaceCorners(face, top), face);
  }
  const userFace = userFacingSideFace(quat, top);
  return edgeTuple(sharedFaceCorners(face, userFace), face);
}

function destinationOnEdge(move: FaceMove, edge: [number, number]): number {
  const perm = CORNER_MOVE_PERMS[move];
  const [a, b] = edge;
  if (perm[a] === b) return a;
  if (perm[b] === a) return b;
  throw new Error(`No active-corner destination for ${move} on edge ${a},${b}`);
}

/**
 * Active read-head corner for a quarter face-move.
 *
 * Selects the orientation-defined edge, then returns the endpoint that the
 * move's physical corner permutation moves material into. This keeps
 * CW/CCW pairs distinct while preserving the gyro's winner-take-all top-face
 * anchoring for surrounding faces.
 */
export function activeCornerForTurn(move: FaceMove, quat: Quaternion): number {
  const face = move[0] as Face;
  const edge = selectedEdgeForFace(face, quat);
  return destinationOnEdge(move, edge);
}
