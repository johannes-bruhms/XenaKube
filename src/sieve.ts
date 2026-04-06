// === Logical Function L(m,n) — Pitch Sieves (pp. 230-234) ===
//
// Xenakis uses prime residual classes modulo 18 to generate pitch sieves.
// The prime residual classes mod 18 are: {1, 5, 7, 11, 13, 17}
// (integers coprime to 18, forming a multiplicative group under mod 18)
//
// L(m,n) = (n1 ∨ n2 ∨ nk ∨ nl) ∧ mp ∨ (mq ∨ mr) ∧ ns ∨ (nt ∨ nu ∨ nv)
//
// Each residual class defines a sieve: the set of integers ≡ r (mod m)
// Union (∨) and intersection (∧) of sieves produce pitch sets.

/** Prime residual classes modulo 18 */
export const RESIDUAL_CLASSES = [1, 5, 7, 11, 13, 17] as const;

/** Multiply two residual classes with reduction mod 18 */
export function multiplyMod18(a: number, b: number): number {
  return (a * b) % 18;
}

/** A sieve: set of integers ≡ r (mod m) within a range */
export interface Sieve {
  modulus: number;
  residue: number;
}

/** Generate the pitch points of a sieve within a range [lo, hi] */
export function sievePoints(s: Sieve, lo: number, hi: number): number[] {
  const points: number[] = [];
  // Find first point ≥ lo
  let start = lo + ((s.residue - (lo % s.modulus)) + s.modulus) % s.modulus;
  for (let i = start; i <= hi; i += s.modulus) {
    points.push(i);
  }
  return points;
}

/** Union of sieves (∨): points in any sieve */
export function sieveUnion(sieves: Sieve[], lo: number, hi: number): number[] {
  const pointSet = new Set<number>();
  for (const s of sieves) {
    for (const p of sievePoints(s, lo, hi)) {
      pointSet.add(p);
    }
  }
  return Array.from(pointSet).sort((a, b) => a - b);
}

/** Intersection of sieves (∧): points in all sieves */
export function sieveIntersection(sieves: Sieve[], lo: number, hi: number): number[] {
  if (sieves.length === 0) return [];
  let current = new Set(sievePoints(sieves[0], lo, hi));
  for (let i = 1; i < sieves.length; i++) {
    const next = new Set(sievePoints(sieves[i], lo, hi));
    current = new Set([...current].filter(x => next.has(x)));
  }
  return Array.from(current).sort((a, b) => a - b);
}

/**
 * Evaluate L(m,n) as described by Xenakis:
 * L(m,n) = (n1 ∨ n2 ∨ nk ∨ nl) ∧ mp ∨ (mq ∨ mr) ∧ ns ∨ (nt ∨ nu ∨ nv)
 *
 * Parameters m and n are residual classes that define the sieve moduli.
 * Indices select which sub-sieves participate in each term.
 */
export interface SieveFunction {
  m: number;
  n: number;
  /** Indices for term 1: (n at these residues) */
  nIndices1: number[];
  /** Index for term 1 intersection: m at this residue */
  mIndex1: number;
  /** Indices for term 2: (m at these residues) */
  mIndices2: number[];
  /** Index for term 2 intersection: n at this residue */
  nIndex2: number;
  /** Indices for term 3: (n at these residues) */
  nIndices3: number[];
}

/** Evaluate a sieve function L(m,n) over a pitch range.
 *  Range is in semitones (0 = some reference pitch, e.g. lowest cello note). */
export function evaluateSieve(fn: SieveFunction, lo: number, hi: number): number[] {
  // Term 1: (n_i1 ∨ n_i2 ∨ ...) ∧ m_j
  const term1_union = sieveUnion(
    fn.nIndices1.map(r => ({ modulus: fn.n, residue: r })),
    lo, hi
  );
  const term1_m = new Set(sievePoints({ modulus: fn.m, residue: fn.mIndex1 }, lo, hi));
  const term1 = term1_union.filter(p => term1_m.has(p));

  // Term 2: (m_i1 ∨ m_i2 ∨ ...) ∧ n_j
  const term2_union = sieveUnion(
    fn.mIndices2.map(r => ({ modulus: fn.m, residue: r })),
    lo, hi
  );
  const term2_n = new Set(sievePoints({ modulus: fn.n, residue: fn.nIndex2 }, lo, hi));
  const term2 = term2_union.filter(p => term2_n.has(p));

  // Term 3: n_i1 ∨ n_i2 ∨ ...
  const term3 = sieveUnion(
    fn.nIndices3.map(r => ({ modulus: fn.n, residue: r })),
    lo, hi
  );

  // L = term1 ∨ term2 ∨ term3
  const result = new Set([...term1, ...term2, ...term3]);
  return Array.from(result).sort((a, b) => a - b);
}

/** The starting sieve function L(11,13) from the score analysis */
export const L_11_13: SieveFunction = {
  m: 11,
  n: 13,
  nIndices1: [0, 1, 3, 5],
  mIndex1: 0,
  mIndices2: [2, 4],
  nIndex2: 3,
  nIndices3: [6, 9, 10],
};

/** Metabola: mutate the sieve function by multiplying moduli by a residual class */
export function metabola(fn: SieveFunction, factor: number): SieveFunction {
  return {
    ...fn,
    m: multiplyMod18(fn.m, factor),
    n: multiplyMod18(fn.n, factor),
  };
}

/** Sieve state that advances with the composition */
export class SieveState {
  private current: SieveFunction;
  private metabolaIndex: number = 0;
  private range: [number, number];

  constructor(initial: SieveFunction = L_11_13, range: [number, number] = [0, 48]) {
    this.current = initial;
    this.range = range;
  }

  /** Get current pitch sieve as semitone offsets */
  getPitches(): number[] {
    return evaluateSieve(this.current, this.range[0], this.range[1]);
  }

  /** Advance the sieve via metabola (called every 3 cube substitutions per Xenakis VII) */
  advance(): void {
    this.metabolaIndex = (this.metabolaIndex + 1) % RESIDUAL_CLASSES.length;
    this.current = metabola(this.current, RESIDUAL_CLASSES[this.metabolaIndex]);
  }

  /** Get current sieve function parameters */
  getFunction(): SieveFunction {
    return { ...this.current };
  }

  /** Reset to initial */
  reset(initial: SieveFunction = L_11_13): void {
    this.current = initial;
    this.metabolaIndex = 0;
  }
}
