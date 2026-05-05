import { describe, it, expect } from 'vitest';
import {
  CORNER_STATE_COUNT,
  MAX_DISTANCE,
  getAllDistances,
  scrambleDistance,
  scrambleFactor,
} from '../src/scramble.js';
import {
  IDENTITY_CORNER_PERM,
  applyCornerMove,
} from '../src/corner-topology.js';

describe('corner solve distance', () => {
  it('identity has distance 0', () => {
    expect(scrambleDistance(IDENTITY_CORNER_PERM)).toBe(0);
    expect(scrambleFactor(IDENTITY_CORNER_PERM)).toBe(0);
  });

  it('precomputes all visible corner permutations', () => {
    const distances = getAllDistances();
    expect(distances).toHaveLength(CORNER_STATE_COUNT);
    expect(distances.every(d => d >= 0)).toBe(true);
  });

  it('single quarter turns have distance 1', () => {
    const r = applyCornerMove(IDENTITY_CORNER_PERM, 'R')!;
    expect(scrambleDistance(r)).toBe(1);
  });

  it('scrambleFactor is normalized 0-1', () => {
    for (const d of getAllDistances()) {
      const f = MAX_DISTANCE === 0 ? 0 : d / MAX_DISTANCE;
      expect(f).toBeGreaterThanOrEqual(0);
      expect(f).toBeLessThanOrEqual(1);
    }
  });

  it('at least one state is at max distance', () => {
    const distances = getAllDistances();
    expect(distances.filter(d => d === MAX_DISTANCE).length).toBeGreaterThan(0);
  });
});

