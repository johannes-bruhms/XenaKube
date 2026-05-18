import { describe, expect, it } from 'vitest';
import { ELEMENTS, getPermutation } from '../src/group.js';
import { distanceToNearest, getQuaternion, snapToNearest } from '../src/quaternion.js';
import type { Quaternion } from '../src/types.js';

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

function applyQuat(q: Quaternion, v: readonly [number, number, number]): [number, number, number] {
  const [qx, qy, qz, qw] = q;
  const [vx, vy, vz] = v;
  const tx = 2 * (qy * vz - qz * vy);
  const ty = 2 * (qz * vx - qx * vz);
  const tz = 2 * (qx * vy - qy * vx);
  return [
    vx + qw * tx + (qy * tz - qz * ty),
    vy + qw * ty + (qz * tx - qx * tz),
    vz + qw * tz + (qx * ty - qy * tx),
  ];
}

function roundedVertex(v: readonly number[]): [number, number, number] {
  return [Math.round(v[0]), Math.round(v[1]), Math.round(v[2])];
}

describe('S4 snap quaternions', () => {
  it('returns exact unit quaternions for every group element', () => {
    for (let el = 0; el < ELEMENTS.length; el++) {
      const q = getQuaternion(el);
      const norm2 = q[0] ** 2 + q[1] ** 2 + q[2] ** 2 + q[3] ** 2;
      expect(norm2, `element ${el}`).toBeCloseTo(1, 12);
    }
  });

  it('snaps each generated group quaternion back to its own element', () => {
    for (let el = 0; el < ELEMENTS.length; el++) {
      const q = getQuaternion(el);
      expect(snapToNearest(q), `element ${el}`).toBe(el);
      expect(distanceToNearest(q).element, `element ${el}`).toBe(el);
      expect(distanceToNearest(q).angle, `element ${el}`).toBeLessThan(1e-10);
    }
  });

  it('returns defensive copies of snap quaternions', () => {
    const q = getQuaternion(0);
    q[0] = 42;
    expect(getQuaternion(0)).toEqual([0, 0, 0, 1]);
  });

  it('matches group permutation geometry for every cube vertex', () => {
    for (let el = 0; el < ELEMENTS.length; el++) {
      const q = getQuaternion(el);
      const perm = getPermutation(el);
      for (let i = 0; i < VERTEX_COORDS.length; i++) {
        expect(roundedVertex(applyQuat(q, VERTEX_COORDS[i])), `element ${el} vertex ${i}`)
          .toEqual(VERTEX_COORDS[perm[i]]);
      }
    }
  });
});
