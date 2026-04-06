import { describe, it, expect } from 'vitest';
import {
  ELEMENTS, CAYLEY, INVERSES, multiply, inverse,
  IDENTITY, getPermutation, tetraOrbit, parseMoveToElement,
} from '../src/group.js';

describe('S4 Hexahedral Group', () => {
  it('generates exactly 24 elements', () => {
    expect(ELEMENTS).toHaveLength(24);
  });

  it('element 0 is the identity', () => {
    expect(ELEMENTS[0]).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
  });

  it('all elements are distinct permutations', () => {
    const keys = new Set(ELEMENTS.map(e => e.join(',')));
    expect(keys.size).toBe(24);
  });

  it('Cayley table is 24×24', () => {
    expect(CAYLEY).toHaveLength(24);
    for (const row of CAYLEY) {
      expect(row).toHaveLength(24);
    }
  });

  it('identity * x = x for all elements (left identity)', () => {
    for (let i = 0; i < 24; i++) {
      expect(multiply(IDENTITY, i)).toBe(i);
    }
  });

  it('x * identity = x for all elements (right identity)', () => {
    for (let i = 0; i < 24; i++) {
      expect(multiply(i, IDENTITY)).toBe(i);
    }
  });

  it('every element has an inverse', () => {
    for (let i = 0; i < 24; i++) {
      const inv = inverse(i);
      expect(multiply(i, inv)).toBe(IDENTITY);
      expect(multiply(inv, i)).toBe(IDENTITY);
    }
  });

  it('multiplication is associative (spot check)', () => {
    // Test (a*b)*c = a*(b*c) for several triples
    const triples = [[1, 5, 10], [3, 7, 15], [20, 2, 11], [8, 13, 22]];
    for (const [a, b, c] of triples) {
      const ab_c = multiply(multiply(a, b), c);
      const a_bc = multiply(a, multiply(b, c));
      expect(ab_c).toBe(a_bc);
    }
  });

  it('group is closed (all products are valid elements)', () => {
    for (let a = 0; a < 24; a++) {
      for (let b = 0; b < 24; b++) {
        const prod = CAYLEY[a][b];
        expect(prod).toBeGreaterThanOrEqual(0);
        expect(prod).toBeLessThan(24);
      }
    }
  });

  it('each row and column of Cayley table is a permutation of 0-23 (Latin square)', () => {
    for (let a = 0; a < 24; a++) {
      const row = new Set(CAYLEY[a]);
      expect(row.size).toBe(24);

      const col = new Set(CAYLEY.map(r => r[a]));
      expect(col.size).toBe(24);
    }
  });

  it('tetrahedral orbit returns 0 or 1', () => {
    for (let i = 0; i < 24; i++) {
      const orbit = tetraOrbit(i);
      expect(orbit === 0 || orbit === 1).toBe(true);
    }
  });

  it('exactly 12 elements in each tetrahedral orbit', () => {
    let even = 0, odd = 0;
    for (let i = 0; i < 24; i++) {
      if (tetraOrbit(i) === 0) even++;
      else odd++;
    }
    expect(even).toBe(12);
    expect(odd).toBe(12);
  });

  it('parses standard move notation', () => {
    expect(parseMoveToElement('R')).not.toBeNull();
    expect(parseMoveToElement("U'")).not.toBeNull();
    expect(parseMoveToElement('F2')).not.toBeNull();
    expect(parseMoveToElement('X')).toBeNull(); // invalid
  });

  it('R * R * R * R = identity (90° rotation has order 4)', () => {
    const r = parseMoveToElement('R')!;
    let state = r;
    state = multiply(state, r);
    state = multiply(state, r);
    state = multiply(state, r);
    expect(state).toBe(IDENTITY);
  });

  it('R2 * R2 = identity (180° rotation has order 2)', () => {
    const r2 = parseMoveToElement('R2')!;
    expect(multiply(r2, r2)).toBe(IDENTITY);
  });
});
