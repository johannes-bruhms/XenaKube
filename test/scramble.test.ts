import { describe, it, expect } from 'vitest';
import { scrambleDistance, scrambleFactor, MAX_DISTANCE, getAllDistances } from '../src/scramble.js';
import { IDENTITY } from '../src/group.js';

describe('scramble distance', () => {
  it('identity has distance 0', () => {
    expect(scrambleDistance(IDENTITY)).toBe(0);
    expect(scrambleFactor(IDENTITY)).toBe(0);
  });

  it('all 24 elements have a defined distance', () => {
    const distances = getAllDistances();
    expect(distances).toHaveLength(24);
    expect(distances.every(d => d >= 0)).toBe(true);
  });

  it('max distance is reasonable for S4 with 3 generators', () => {
    // S4 diameter with {R,U,F} generators should be 4-6
    expect(MAX_DISTANCE).toBeGreaterThanOrEqual(3);
    expect(MAX_DISTANCE).toBeLessThanOrEqual(7);
  });

  it('scrambleFactor is normalized 0-1', () => {
    for (let i = 0; i < 24; i++) {
      const f = scrambleFactor(i);
      expect(f).toBeGreaterThanOrEqual(0);
      expect(f).toBeLessThanOrEqual(1);
    }
  });

  it('at least one element is at max distance', () => {
    const distances = getAllDistances();
    expect(distances.filter(d => d === MAX_DISTANCE).length).toBeGreaterThan(0);
  });
});
