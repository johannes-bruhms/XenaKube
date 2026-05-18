// === Quaternion Processing: Gyro -> S4 Snap ===
//
// Maps continuous gyro quaternion orientation to the nearest of the 24 cube
// rotation quaternions (S4 elements). The quaternion table is generated from
// group.ts ELEMENTS so the snap target order cannot drift from the group
// permutation order.

import type { GroupElement, Quaternion } from './types.js';
import { ELEMENTS } from './group.js';

const VERTEX_COORDS: readonly [number, number, number][] = [
  [1, 1, 1],
  [-1, 1, 1],
  [-1, 1, -1],
  [1, 1, -1],
  [1, -1, 1],
  [-1, -1, 1],
  [-1, -1, -1],
  [1, -1, -1],
];

type Mat3 = [
  [number, number, number],
  [number, number, number],
  [number, number, number],
];

/** Dot product of two quaternions. */
function quatDot(a: Quaternion, b: Quaternion): number {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3];
}

/** Normalize a quaternion. */
export function quatNormalize(q: Quaternion): Quaternion {
  const len = Math.sqrt(q[0] * q[0] + q[1] * q[1] + q[2] * q[2] + q[3] * q[3]);
  if (!Number.isFinite(len) || len < 1e-10) return [0, 0, 0, 1];
  return [q[0] / len, q[1] / len, q[2] / len, q[3] / len];
}

function mappedPositiveAxis(perm: readonly number[], axis: 0 | 1 | 2): [number, number, number] {
  const out: [number, number, number] = [0, 0, 0];
  let count = 0;
  for (let i = 0; i < VERTEX_COORDS.length; i++) {
    if (VERTEX_COORDS[i][axis] <= 0) continue;
    const dst = VERTEX_COORDS[perm[i]];
    out[0] += dst[0];
    out[1] += dst[1];
    out[2] += dst[2];
    count++;
  }
  return [out[0] / count, out[1] / count, out[2] / count];
}

function rotationMatrixFromPermutation(perm: readonly number[]): Mat3 {
  const x = mappedPositiveAxis(perm, 0);
  const y = mappedPositiveAxis(perm, 1);
  const z = mappedPositiveAxis(perm, 2);
  return [
    [x[0], y[0], z[0]],
    [x[1], y[1], z[1]],
    [x[2], y[2], z[2]],
  ];
}

function canonicalizeQuat(q: Quaternion): Quaternion {
  const normalized = quatNormalize(q);
  const signIndex = Math.abs(normalized[3]) > 1e-12
    ? 3
    : normalized.findIndex(v => Math.abs(v) > 1e-12);
  if (signIndex >= 0 && normalized[signIndex] < 0) {
    return [-normalized[0], -normalized[1], -normalized[2], -normalized[3]];
  }
  return normalized;
}

function quaternionFromRotationMatrix(m: Mat3): Quaternion {
  const m00 = m[0][0], m01 = m[0][1], m02 = m[0][2];
  const m10 = m[1][0], m11 = m[1][1], m12 = m[1][2];
  const m20 = m[2][0], m21 = m[2][1], m22 = m[2][2];
  const trace = m00 + m11 + m22;

  if (trace > 0) {
    const s = Math.sqrt(trace + 1) * 2;
    return canonicalizeQuat([
      (m21 - m12) / s,
      (m02 - m20) / s,
      (m10 - m01) / s,
      0.25 * s,
    ]);
  }

  if (m00 > m11 && m00 > m22) {
    const s = Math.sqrt(1 + m00 - m11 - m22) * 2;
    return canonicalizeQuat([
      0.25 * s,
      (m01 + m10) / s,
      (m02 + m20) / s,
      (m21 - m12) / s,
    ]);
  }

  if (m11 > m22) {
    const s = Math.sqrt(1 + m11 - m00 - m22) * 2;
    return canonicalizeQuat([
      (m01 + m10) / s,
      0.25 * s,
      (m12 + m21) / s,
      (m02 - m20) / s,
    ]);
  }

  const s = Math.sqrt(1 + m22 - m00 - m11) * 2;
  return canonicalizeQuat([
    (m02 + m20) / s,
    (m12 + m21) / s,
    0.25 * s,
    (m10 - m01) / s,
  ]);
}

/**
 * The 24 unit quaternions for cube rotations (S4 elements).
 *
 * Generated directly from group.ts ELEMENTS so exact unit length, quaternion
 * signs, and group-element ordering are one contract.
 */
const S4_QUATERNIONS: Quaternion[] = ELEMENTS.map(perm =>
  quaternionFromRotationMatrix(rotationMatrixFromPermutation(perm))
);

/**
 * Find the nearest S4 rotation to a given quaternion.
 * Returns the group element index (0-23).
 *
 * Uses |dot product| because q and -q represent the same rotation.
 */
export function snapToNearest(q: Quaternion): GroupElement {
  const normalized = quatNormalize(q);
  let bestIndex = 0;
  let bestDot = -1;

  for (let i = 0; i < S4_QUATERNIONS.length; i++) {
    const d = Math.abs(quatDot(normalized, S4_QUATERNIONS[i]));
    if (d > bestDot) {
      bestDot = d;
      bestIndex = i;
    }
  }

  return bestIndex;
}

/** Get the quaternion for a group element (for visualization). */
export function getQuaternion(el: GroupElement): Quaternion {
  const q = S4_QUATERNIONS[el] ?? S4_QUATERNIONS[0];
  return [q[0], q[1], q[2], q[3]];
}

/** Angular distance between quaternion and nearest S4 element (0 to pi/2). */
export function distanceToNearest(q: Quaternion): { element: GroupElement; angle: number } {
  const normalized = quatNormalize(q);
  let bestIndex = 0;
  let bestDot = -1;

  for (let i = 0; i < S4_QUATERNIONS.length; i++) {
    const d = Math.abs(quatDot(normalized, S4_QUATERNIONS[i]));
    if (d > bestDot) {
      bestDot = d;
      bestIndex = i;
    }
  }

  const angle = Math.acos(Math.min(1, bestDot));
  return { element: bestIndex, angle };
}

/**
 * Interpolation factor: how far the gyro is between two S4 elements.
 * Returns 0 when exactly at the nearest element, approaches 1 at the boundary.
 */
export function deviationFactor(q: Quaternion): number {
  const { angle } = distanceToNearest(q);
  return Math.min(1, angle / (Math.PI / 4));
}
