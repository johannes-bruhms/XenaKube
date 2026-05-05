// === Orientation: gyro-anchored "top right corner of each face" ===
//
// Pure functions that determine, given the cube's current world orientation
// (a unit quaternion produced by the relay's calibrated gyro), which corner
// of each face is the active read-head for Design C selector logic.
//
// Convention. Each face has a canonical-pose home corner — a world position
// chosen by the standard "top right" intuition for that face viewed from
// outside (with cube top = world +Y, cube right = world +Z, cube back =
// world -X in the post-orbit camera frame). Under gyro, the home is the
// corner of that face currently closest to that target world position. As
// the cube rotates, different cubies migrate into and out of the target
// neighbourhood, so the active-vertex slot drifts with orientation.
//
// Canonical homes (gyro = identity) — 5 distinct vertices, R/U intentionally
// collide on BTR (the cubie where R, U, and B faces all meet, which is the
// natural "top right" for both R-face-from-outside and U-face-from-above):
//
//   F → 0 (FTR)    R → 3 (BTR)    U → 3 (BTR — shares with R)
//   L → 1 (FTL)    B → 2 (BTL)    D → 6 (BBL — back-bottom-left under -Z up-of-view)

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

/** Canonical-pose target world position for each face's "top right" corner. */
const FACE_TARGET: Record<Face, readonly [number, number, number]> = {
  F: [ 1,  1,  1],   // FTR — front face top-right when viewed from +Z
  L: [-1,  1,  1],   // FTL — left face top-right when viewed from -X
  R: [ 1,  1, -1],   // BTR — right face top-right when viewed from +X
  B: [-1,  1, -1],   // BTL — back face top-right when viewed from -Z
  U: [ 1,  1, -1],   // BTR — top face top-right looking down with back as "up of view"
  D: [-1, -1, -1],   // BBL — bottom face top-right looking up with back as "up of view"
};

/** Apply a unit quaternion to a 3-vector. v' = q * v * q⁻¹. */
function applyQuat(q: Quaternion, v: readonly [number, number, number]): [number, number, number] {
  const [qx, qy, qz, qw] = q;
  const [vx, vy, vz] = v;
  // t = 2 (q.xyz × v)
  const tx = 2 * (qy * vz - qz * vy);
  const ty = 2 * (qz * vx - qx * vz);
  const tz = 2 * (qx * vy - qy * vx);
  // result = v + qw * t + (q.xyz × t)
  return [
    vx + qw * tx + (qy * tz - qz * ty),
    vy + qw * ty + (qz * tx - qx * tz),
    vz + qw * tz + (qx * ty - qy * tx),
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
 * Top-right corner of `face` under current `quat` orientation. Returns the
 * vertex index (0..7) of the corner of `face` whose current world position
 * is closest to that face's canonical target.
 */
export function topRightCorner(face: Face, quat: Quaternion): number {
  const target = FACE_TARGET[face];
  const corners = FACE_CORNERS[face];
  let bestIdx = corners[0];
  let bestDist = Infinity;
  for (const idx of corners) {
    const [wx, wy, wz] = applyQuat(quat, CUBE_VERTS_LOCAL[idx]);
    const dx = wx - target[0];
    const dy = wy - target[1];
    const dz = wz - target[2];
    const dist = dx * dx + dy * dy + dz * dz;
    if (dist < bestDist) {
      bestDist = dist;
      bestIdx = idx;
    }
  }
  return bestIdx;
}
