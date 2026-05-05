import { describe, it, expect } from 'vitest';
import { upFace, topRightCorner, FACES, type Face } from '../src/orientation.js';
import type { Quaternion } from '../src/types.js';

const IDENTITY: Quaternion = [0, 0, 0, 1];

// Right-handed quaternion for rotation `theta` around an axis.
function axisAngle(ax: number, ay: number, az: number, theta: number): Quaternion {
  const len = Math.sqrt(ax * ax + ay * ay + az * az);
  ax /= len; ay /= len; az /= len;
  const half = theta / 2;
  const s = Math.sin(half);
  return [ax * s, ay * s, az * s, Math.cos(half)];
}

describe('upFace', () => {
  it('canonical pose: U is up', () => {
    expect(upFace(IDENTITY)).toBe('U');
  });

  it('cube flipped 180° around +X: D is up', () => {
    const q = axisAngle(1, 0, 0, Math.PI);
    expect(upFace(q)).toBe('D');
  });

  it('cube rotated 90° around +Y: U stays up', () => {
    const q = axisAngle(0, 1, 0, Math.PI / 2);
    expect(upFace(q)).toBe('U');
  });

  it('cube tilted -90° around +X: F is up', () => {
    // Right-hand rotation around +X by -90° takes cube-local +Y → world -Z
    // and cube-local +Z → world +Y. So the F face (cube +Z) is now world-up.
    const q = axisAngle(1, 0, 0, -Math.PI / 2);
    expect(upFace(q)).toBe('F');
  });
});

describe('topRightCorner — canonical pose', () => {
  // Canonical home corners: 5 distinct, R/U intentionally collide on BTR (vertex 3).
  const expected: Record<Face, number> = {
    F: 0, // FTR
    L: 1, // FTL
    B: 2, // BTL
    R: 3, // BTR
    U: 3, // BTR — collides with R (both target +X+Y-Z)
    D: 6, // BBL
  };

  for (const face of FACES) {
    it(`${face} → vertex ${expected[face]}`, () => {
      expect(topRightCorner(face, IDENTITY)).toBe(expected[face]);
    });
  }

  it('canonical homes cover 5 distinct vertices', () => {
    const homes = new Set(FACES.map(f => topRightCorner(f, IDENTITY)));
    expect(homes.size).toBe(5);
  });
});

describe('topRightCorner — gyro re-anchoring', () => {
  it('rotating cube 90° around +Y migrates F home from FTR (0) to a different cubie', () => {
    // 90° around +Y maps cube-local +X → world -Z and +Z → world +X.
    // So the F face (cube-local +Z) is now at world +X. Its target is still
    // (1, 1, 1) in world, and a different cubie is now closest to it.
    const q = axisAngle(0, 1, 0, Math.PI / 2);
    const home = topRightCorner('F', q);
    expect(home).not.toBe(0);
    expect([0, 1, 4, 5]).toContain(home); // still on F face
  });

  it('rotating cube 90° around +Y: F home is the cubie now at world (1,1,1)', () => {
    // After 90° around +Y, vertex 1 (cube-local (-1,1,1)) maps to world (1,1,1).
    // So vertex 1 should be F's home under this rotation.
    const q = axisAngle(0, 1, 0, Math.PI / 2);
    expect(topRightCorner('F', q)).toBe(1);
  });

  it('every face has a defined home under any tested orientation', () => {
    const orientations = [
      IDENTITY,
      axisAngle(0, 1, 0, Math.PI / 2),
      axisAngle(1, 0, 0, Math.PI / 2),
      axisAngle(0, 0, 1, Math.PI / 4),
      axisAngle(1, 1, 1, Math.PI / 3),
    ];
    for (const q of orientations) {
      for (const face of FACES) {
        const home = topRightCorner(face, q);
        expect(home).toBeGreaterThanOrEqual(0);
        expect(home).toBeLessThan(8);
      }
    }
  });
});
