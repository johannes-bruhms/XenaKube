import { describe, it, expect } from 'vitest';
import { activeCornerForTurn, upFace, userFacingSideFace, FACES, type Face } from '../src/orientation.js';
import { XenaKubeEngine } from '../src/engine.js';
import type { Quaternion } from '../src/types.js';

const IDENTITY: Quaternion = [0, 0, 0, 1];
const FACE_MOVES = ['R', "R'", 'L', "L'", 'U', "U'", 'D', "D'", 'F', "F'", 'B', "B'"] as const;

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

describe('activeCornerForTurn canonical pose', () => {
  const expected: Record<(typeof FACE_MOVES)[number], number> = {
    F: 0,
    "F'": 1,
    R: 3,
    "R'": 0,
    B: 2,
    "B'": 3,
    L: 1,
    "L'": 2,
    U: 2,
    "U'": 1,
    D: 5,
    "D'": 6,
  };

  for (const move of FACE_MOVES) {
    it(`${move} -> vertex ${expected[move]}`, () => {
      expect(activeCornerForTurn(move, IDENTITY)).toBe(expected[move]);
    });
  }

  it('each clockwise/counterclockwise face pair lands on distinct endpoints', () => {
    for (const face of FACES) {
      expect(activeCornerForTurn(face, IDENTITY)).not.toBe(activeCornerForTurn(`${face}'` as (typeof FACE_MOVES)[number], IDENTITY));
    }
  });

  it('canonical user-facing side is engine L after the connect-pose remap', () => {
    expect(userFacingSideFace(IDENTITY)).toBe('L');
  });
});

describe('activeCornerForTurn gyro re-anchoring', () => {
  it('selects the collision endpoint after a face-letter change', () => {
    const yaw90 = axisAngle(0, 1, 0, Math.PI / 2);
    expect(upFace(yaw90)).toBe('U');
    expect(activeCornerForTurn('R', IDENTITY)).toBe(3);
    expect(activeCornerForTurn("R'", IDENTITY)).toBe(0);
    expect(activeCornerForTurn('B', yaw90)).toBe(2);
    expect(activeCornerForTurn("B'", yaw90)).toBe(3);
  });

  it('does not slide to an absolute highest corner while the top face is unchanged', () => {
    const shallowRoll = axisAngle(1, 0, 0, -Math.PI / 6);
    expect(upFace(shallowRoll)).toBe('U');
    expect(activeCornerForTurn('R', shallowRoll)).toBe(3);
    expect(activeCornerForTurn("R'", shallowRoll)).toBe(0);

    const faceTopChanged = axisAngle(1, 0, 0, -Math.PI / 2);
    expect(upFace(faceTopChanged)).toBe('F');
    expect(activeCornerForTurn('R', faceTopChanged)).toBe(0);
    expect(activeCornerForTurn("R'", faceTopChanged)).toBe(4);
  });

  it('surrounding face selectors land on one of the current top face corners', () => {
    const cases: Array<{ q: Quaternion; top: Face; surrounding: Face[] }> = [
      { q: IDENTITY, top: 'U', surrounding: ['F', 'R', 'B', 'L'] },
      { q: axisAngle(1, 0, 0, -Math.PI / 2), top: 'F', surrounding: ['U', 'R', 'D', 'L'] },
    ];
    for (const { q, top, surrounding } of cases) {
      expect(upFace(q)).toBe(top);
      for (const face of surrounding) {
        expect(FACE_CORNERS[top]).toContain(activeCornerForTurn(face, q));
        expect(FACE_CORNERS[top]).toContain(activeCornerForTurn(`${face}'` as (typeof FACE_MOVES)[number], q));
      }
    }
  });

  it('top and bottom face selectors use the edge facing the user', () => {
    expect(userFacingSideFace(IDENTITY)).toBe('L');
    expect(activeCornerForTurn('U', IDENTITY)).toBe(2);
    expect(activeCornerForTurn("U'", IDENTITY)).toBe(1);
    expect(activeCornerForTurn('D', IDENTITY)).toBe(5);
    expect(activeCornerForTurn("D'", IDENTITY)).toBe(6);
  });

  it('yaw changes the user-facing edge for top-face turns', () => {
    const yaw90 = axisAngle(0, 1, 0, Math.PI / 2);
    expect(upFace(yaw90)).toBe('U');
    expect(userFacingSideFace(yaw90)).toBe('B');
    expect(activeCornerForTurn('U', yaw90)).toBe(3);
    expect(activeCornerForTurn("U'", yaw90)).toBe(2);
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

  it('every face-move has a defined home under any tested orientation', () => {
    const orientations = [
      IDENTITY,
      axisAngle(0, 1, 0, Math.PI / 2),
      axisAngle(1, 0, 0, Math.PI / 2),
      axisAngle(0, 0, 1, Math.PI / 4),
      axisAngle(1, 1, 1, Math.PI / 3),
    ];
    for (const q of orientations) {
      for (const move of FACE_MOVES) {
        const home = activeCornerForTurn(move, q);
        expect(home).toBeGreaterThanOrEqual(0);
        expect(home).toBeLessThan(8);
      }
    }
  });
});
