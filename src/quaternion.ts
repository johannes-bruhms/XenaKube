// === Quaternion Processing: Gyro → S4 Snap ===
//
// Maps continuous gyro quaternion orientation to the nearest
// of 24 cube rotation quaternions (S4 elements).
//
// Each of the 24 rotations has a known unit quaternion representation.
// Snap = find the one with maximum |dot product| against the gyro reading.

import type { GroupElement, Quaternion } from './types.js';

/** The 24 unit quaternions for cube rotations (S4 elements).
 *  Order matches ELEMENTS[] in group.ts.
 *  Generated from: identity, 6 face rotations (90°, 180°, 270°),
 *  8 vertex rotations (120°, 240°), 6 edge rotations (180°). */
const S4_QUATERNIONS: Quaternion[] = [
  // Identity
  [0, 0, 0, 1],

  // 6 face rotations × 90° (±x, ±y, ±z axes, 90°)
  [0.7071, 0, 0, 0.7071],        // x 90°
  [-0.7071, 0, 0, 0.7071],       // x -90°
  [0, 0.7071, 0, 0.7071],        // y 90°
  [0, -0.7071, 0, 0.7071],       // y -90°
  [0, 0, 0.7071, 0.7071],        // z 90°
  [0, 0, -0.7071, 0.7071],       // z -90°

  // 3 face rotations × 180° (x, y, z axes)
  [1, 0, 0, 0],                  // x 180°
  [0, 1, 0, 0],                  // y 180°
  [0, 0, 1, 0],                  // z 180°

  // 8 vertex rotations (body diagonals, ±120°)
  [0.5, 0.5, 0.5, 0.5],          // (1,1,1) 120°
  [-0.5, -0.5, -0.5, 0.5],       // (1,1,1) -120°
  [0.5, -0.5, 0.5, 0.5],         // (1,-1,1) 120°
  [-0.5, 0.5, -0.5, 0.5],        // (1,-1,1) -120°
  [-0.5, 0.5, 0.5, 0.5],         // (-1,1,1) 120°
  [0.5, -0.5, -0.5, 0.5],        // (-1,1,1) -120°
  [0.5, 0.5, -0.5, 0.5],         // (1,1,-1) 120°
  [-0.5, -0.5, 0.5, 0.5],        // (1,1,-1) -120°

  // 6 edge rotations (face diagonals, 180°)
  [0.7071, 0.7071, 0, 0],        // xy 180°
  [0.7071, -0.7071, 0, 0],       // x(-y) 180°
  [0.7071, 0, 0.7071, 0],        // xz 180°
  [0.7071, 0, -0.7071, 0],       // x(-z) 180°
  [0, 0.7071, 0.7071, 0],        // yz 180°
  [0, 0.7071, -0.7071, 0],       // y(-z) 180°
];

/** Dot product of two quaternions */
function quatDot(a: Quaternion, b: Quaternion): number {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3];
}

/** Normalize a quaternion */
export function quatNormalize(q: Quaternion): Quaternion {
  const len = Math.sqrt(q[0] * q[0] + q[1] * q[1] + q[2] * q[2] + q[3] * q[3]);
  if (len < 1e-10) return [0, 0, 0, 1];
  return [q[0] / len, q[1] / len, q[2] / len, q[3] / len];
}

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

/** Get the quaternion for a group element (for visualization) */
export function getQuaternion(el: GroupElement): Quaternion {
  return S4_QUATERNIONS[el] ?? S4_QUATERNIONS[0];
}

/** Angular distance between quaternion and nearest S4 element (0 to π/2) */
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

  // Clamp for numerical stability
  const angle = Math.acos(Math.min(1, bestDot));
  return { element: bestIndex, angle };
}

/**
 * Interpolation factor: how far the gyro is between two S4 elements.
 * Returns 0 when exactly at the nearest element, approaches 1 at the boundary.
 * Useful for V2 expressive deviations.
 */
export function deviationFactor(q: Quaternion): number {
  const { angle } = distanceToNearest(q);
  // Max possible angle between adjacent S4 elements is ~π/4 (45°)
  // Normalize to 0-1 range
  return Math.min(1, angle / (Math.PI / 4));
}
