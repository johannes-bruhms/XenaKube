import { describe, it, expect } from 'vitest';
import { upFace, topRightCorner, FACES, type Face } from '../src/orientation.js';
import { XenaKubeEngine } from '../src/engine.js';
import type { Quaternion } from '../src/types.js';

const IDENTITY: Quaternion = [0, 0, 0, 1];

const FACE_CORNERS: Record<Face, number[]> = {
  R: [0, 3, 4, 7],
  L: [1, 2, 5, 6],
  U: [0, 1, 2, 3],
  D: [4, 5, 6, 7],
  F: [0, 1, 4, 5],
  B: [2, 3, 6, 7],
};

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

  it('cube flipped 180 degrees around +X: D is up', () => {
    const q = axisAngle(1, 0, 0, Math.PI);
    expect(upFace(q)).toBe('D');
  });

  it('cube rotated 90 degrees around +Y: U stays up', () => {
    const q = axisAngle(0, 1, 0, Math.PI / 2);
    expect(upFace(q)).toBe('U');
  });

  it('cube tilted -90 degrees around +X: F is up', () => {
    const q = axisAngle(1, 0, 0, -Math.PI / 2);
    expect(upFace(q)).toBe('F');
  });
});

describe('topRightCorner canonical pose', () => {
  const expected: Record<Face, number> = {
    F: 0,
    L: 1,
    B: 2,
    R: 3,
    U: 3,
    D: 6,
  };

  for (const face of FACES) {
    it(`${face} -> vertex ${expected[face]}`, () => {
      expect(topRightCorner(face, IDENTITY)).toBe(expected[face]);
    });
  }

  it('canonical homes cover 5 distinct vertices', () => {
    const homes = new Set(FACES.map(f => topRightCorner(f, IDENTITY)));
    expect(homes.size).toBe(5);
  });
});

describe('topRightCorner gyro re-anchoring', () => {
  it('selects the head-on top-right corner after a face-letter change', () => {
    const yaw90 = axisAngle(0, 1, 0, Math.PI / 2);
    expect(upFace(yaw90)).toBe('U');
    expect(topRightCorner('R', IDENTITY)).toBe(3);
    expect(topRightCorner('B', yaw90)).toBe(2);
  });

  it('does not slide to an absolute highest corner while the top face is unchanged', () => {
    const shallowRoll = axisAngle(1, 0, 0, -Math.PI / 6);
    expect(upFace(shallowRoll)).toBe('U');
    expect(topRightCorner('R', shallowRoll)).toBe(3);

    const faceTopChanged = axisAngle(1, 0, 0, -Math.PI / 2);
    expect(upFace(faceTopChanged)).toBe('F');
    expect(topRightCorner('R', faceTopChanged)).toBe(0);
  });

  it('surrounding face selectors land on one of the current top face corners', () => {
    const cases: Array<{ q: Quaternion; top: Face; surrounding: Face[] }> = [
      { q: IDENTITY, top: 'U', surrounding: ['F', 'R', 'B', 'L'] },
      { q: axisAngle(1, 0, 0, -Math.PI / 2), top: 'F', surrounding: ['U', 'R', 'D', 'L'] },
    ];
    for (const { q, top, surrounding } of cases) {
      expect(upFace(q)).toBe(top);
      for (const face of surrounding) {
        expect(FACE_CORNERS[top]).toContain(topRightCorner(face, q));
      }
    }
  });

  it('interrupting a phrase recomputes the selected slot from the latest gyro pose', () => {
    const engine = new XenaKubeEngine();
    const yaw90 = axisAngle(0, 1, 0, Math.PI / 2);

    let state = engine.onTurn('R')!;
    expect(state.activeVertex).toBe(3);

    state = engine.onGyro(...yaw90)!;
    expect(state.activeVertex).toBe(3);

    state = engine.onTurn('B')!;
    expect(state.activeVertex).toBe(2);
    expect(state.lastTurnedFace).toBe('B');
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
