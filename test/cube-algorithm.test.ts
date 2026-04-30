import { describe, it, expect } from 'vitest';
import {
  CubeAlgorithmDetector,
  CUBE_ALGORITHM_BOOK,
  CANONICAL_CUBE_ALGORITHMS,
  expandCubeAlgorithmBook,
} from '../src/cube-algorithm.js';

describe('CubeAlgorithmDetector', () => {
  it('detects sexy move (R U R\' U\')', () => {
    const detector = new CubeAlgorithmDetector();
    expect(detector.push('R')).toBeNull();
    expect(detector.push('U')).toBeNull();
    expect(detector.push("R'")).toBeNull();
    const result = detector.push("U'");
    expect(result).not.toBeNull();
    expect(result!.algorithm.name).toBe('sexy-move');
  });

  it('detects sune (R U R\' U R U\' U\' R\') — CCW quarter-turn expansion of U2', () => {
    const detector = new CubeAlgorithmDetector();
    detector.push('R');
    detector.push('U');
    detector.push("R'");
    detector.push('U');
    detector.push('R');
    detector.push("U'");
    detector.push("U'");
    const result = detector.push("R'");
    expect(result).not.toBeNull();
    expect(result!.algorithm.name).toBe('sune');
  });

  it('sune with CW half-turn (U U) does NOT fire — CCW convention only', () => {
    const detector = new CubeAlgorithmDetector();
    detector.push('R');
    detector.push('U');
    detector.push("R'");
    detector.push('U');
    detector.push('R');
    detector.push('U');
    detector.push('U');
    const result = detector.push("R'");
    expect(result).toBeNull();
  });

  it('does not trigger on partial match', () => {
    const detector = new CubeAlgorithmDetector();
    detector.push('R');
    detector.push('U');
    expect(detector.push("R'")).toBeNull();
    expect(detector.push('F')).toBeNull();
  });

  it('clears buffer after timeout', () => {
    const detector = new CubeAlgorithmDetector();
    let t = 1000;
    detector.push('R', t);
    detector.push('U', t += 100);
    // Gap > 2000ms
    detector.push("R'", t += 3000);
    const result = detector.push("U'", t += 100);
    expect(result).toBeNull();
  });

  it('consecutive sexy-moves fire twice', () => {
    const detector = new CubeAlgorithmDetector();
    const moves: string[] = ['R', 'U', "R'", "U'", 'R', 'U', "R'", "U'"];
    const allResults: string[] = [];
    for (const m of moves) {
      const matches = detector.pushAll(m);
      for (const match of matches) {
        allResults.push(match.algorithm.name);
      }
    }
    expect(allResults.filter(n => n === 'sexy-move')).toHaveLength(2);
  });

  it('buffer is not consumed — sequential algorithms both fire', () => {
    const detector = new CubeAlgorithmDetector();
    // sexy + sune back-to-back: R U R' U' R U R' U R U' U' R' (U2 → U' U')
    const moves: string[] = ['R', 'U', "R'", "U'", 'R', 'U', "R'", 'U', 'R', "U'", "U'", "R'"];
    const allResults: string[] = [];
    for (const m of moves) {
      const matches = detector.pushAll(m);
      for (const match of matches) {
        allResults.push(match.algorithm.name);
      }
    }
    expect(allResults).toContain('sexy-move'); // fires at move 4
    expect(allResults).toContain('sune');      // fires at move 11
  });

  it('detects algorithm after unrelated moves', () => {
    const detector = new CubeAlgorithmDetector();
    detector.push('F');
    detector.push('F');
    detector.push('F');
    detector.push('R');
    detector.push('U');
    detector.push("R'");
    const result = detector.push("U'");
    expect(result).not.toBeNull();
    expect(result!.algorithm.name).toBe('sexy-move');
  });

  it('same algorithm does not fire twice on the same tail', () => {
    const detector = new CubeAlgorithmDetector();
    detector.push('R');
    detector.push('U');
    detector.push("R'");
    const r1 = detector.push("U'");
    expect(r1).not.toBeNull();
    // Pushing a non-matching move should not re-fire sexy-move
    const r2 = detector.push('F');
    expect(r2).toBeNull();
  });

  it('getPartialMatches shows progress toward algorithms', () => {
    const detector = new CubeAlgorithmDetector();
    detector.push('R');
    detector.push('U');
    const partials = detector.getPartialMatches();
    const sexyPartial = partials.find(p => p.algorithm.name === 'sexy-move');
    expect(sexyPartial).toBeDefined();
    expect(sexyPartial!.matched).toBe(2);
  });

  it('getBuffer returns full buffer (not consumed by matches)', () => {
    const detector = new CubeAlgorithmDetector();
    detector.push('R');
    detector.push('U');
    detector.push("R'");
    detector.push("U'");
    // Buffer retains all moves
    expect(detector.getBuffer()).toEqual(['R', 'U', "R'", "U'"]);
  });

  it('algorithm book has all expected entries', () => {
    const names = CUBE_ALGORITHM_BOOK.map(s => s.name);
    expect(names).toContain('sexy-move');
    expect(names).toContain('oll-cross');
    expect(names).toContain('sune');
    expect(names).toContain('anti-sune');
    expect(names).toContain('u-perm');
    expect(names).toContain('t-perm');
    expect(names).not.toContain('sledgehammer');
  });
});

describe('Orientation-independent cube algorithm detection', () => {
  it('generates exactly 24 rotation variants', () => {
    const expanded = expandCubeAlgorithmBook(CANONICAL_CUBE_ALGORITHMS);
    const counts = new Map<string, number>();
    for (const a of expanded) counts.set(a.name, (counts.get(a.name) || 0) + 1);
    for (const [, count] of counts) {
      expect(count).toBe(24);
    }
  });

  it('detects sexy-move on different face pairs', () => {
    const detector = new CubeAlgorithmDetector();

    // F R F' R' = sexy-move rotated (x rotation: U→F, so R U R' U' → R F R' F')
    // Actually under x: R stays, U→F, so sexy-move → R F R' F'
    expect(detector.push('R')).toBeNull();
    expect(detector.push('F')).toBeNull();
    expect(detector.push("R'")).toBeNull();
    const r1 = detector.push("F'");
    expect(r1).not.toBeNull();
    expect(r1!.algorithm.name).toBe('sexy-move');
  });

  it('detects sexy-move as F U F\' U\' (y\' rotation)', () => {
    const detector = new CubeAlgorithmDetector();
    // y' maps R→F, U stays, so sexy-move R U R' U' → F U F' U'
    expect(detector.push('F')).toBeNull();
    expect(detector.push('U')).toBeNull();
    expect(detector.push("F'")).toBeNull();
    const r = detector.push("U'");
    expect(r).not.toBeNull();
    expect(r!.algorithm.name).toBe('sexy-move');
  });

  it('detects sexy-move as L D L\' D\' (opposite faces)', () => {
    const detector = new CubeAlgorithmDetector();
    expect(detector.push('L')).toBeNull();
    expect(detector.push('D')).toBeNull();
    expect(detector.push("L'")).toBeNull();
    const r = detector.push("D'");
    expect(r).not.toBeNull();
    expect(r!.algorithm.name).toBe('sexy-move');
  });

  it('detects inverse-sexy pattern as sexy-move (rotation-equivalent)', () => {
    const detector = new CubeAlgorithmDetector();
    // U R U' R' was inverse-sexy, now detected as sexy-move rotation variant
    expect(detector.push('U')).toBeNull();
    expect(detector.push('R')).toBeNull();
    expect(detector.push("U'")).toBeNull();
    const r = detector.push("R'");
    expect(r).not.toBeNull();
    expect(r!.algorithm.name).toBe('sexy-move');
  });

  it('detects sune on different faces (F U F\' U F U\' U\' F\')', () => {
    const detector = new CubeAlgorithmDetector();
    // sune R U R' U R U' U' R' under y' rotation (R→F, U→U): F U F' U F U' U' F'
    expect(detector.push('F')).toBeNull();
    expect(detector.push('U')).toBeNull();
    expect(detector.push("F'")).toBeNull();
    expect(detector.push('U')).toBeNull();
    expect(detector.push('F')).toBeNull();
    expect(detector.push("U'")).toBeNull();
    expect(detector.push("U'")).toBeNull();
    const r = detector.push("F'");
    expect(r).not.toBeNull();
    expect(r!.algorithm.name).toBe('sune');
  });

  it('detects oll-cross on rotated faces', () => {
    const detector = new CubeAlgorithmDetector();
    // oll-cross: F R U R' U' F' → under y' (R→F, F→L, U→U): L F U F' U' L'
    const moves = ['L', 'F', 'U', "F'", "U'", "L'"];
    let result = null;
    for (const m of moves) result = detector.push(m);
    expect(result).not.toBeNull();
    expect(result!.algorithm.name).toBe('oll-cross');
  });

  it('getPartialMatches deduplicates by algorithm name', () => {
    const detector = new CubeAlgorithmDetector();
    // Push R — this is a prefix of many rotation variants of many algorithms
    detector.push('R');
    const partials = detector.getPartialMatches();
    // Should have at most one entry per algorithm name
    const names = partials.map(p => p.algorithm.name);
    const uniqueNames = [...new Set(names)];
    expect(names.length).toBe(uniqueNames.length);
  });

  it('getCanonicalAlgorithms returns one entry per algorithm', () => {
    const detector = new CubeAlgorithmDetector();
    const canonical = detector.getCanonicalAlgorithms();
    const names = canonical.map(s => s.name);
    expect(names.length).toBe(new Set(names).size);
    expect(names.length).toBe(CANONICAL_CUBE_ALGORITHMS.length);
  });

  it('suppresses overlapping algorithms on repeated sexy cycles', () => {
    const detector = new CubeAlgorithmDetector();
    // R U R' U' cycled three times. Each full cycle should fire sexy-move
    // exactly once — not partially-overlapping rotation variants.
    const cycle = ['R', 'U', "R'", "U'"];
    const allResults: string[] = [];
    for (let c = 0; c < 3; c++) {
      for (const m of cycle) {
        const matches = detector.pushAll(m);
        for (const match of matches) allResults.push(match.algorithm.name);
      }
    }
    // Exactly 3 sexy-move matches, one per full cycle
    expect(allResults.filter(n => n === 'sexy-move')).toHaveLength(3);
  });

  it('layered detection: both sexy-move and sune fire when cast back-to-back', () => {
    const detector = new CubeAlgorithmDetector();
    // sexy-move = R U R' U' (first 4 moves)
    // sune (CCW U2) = R U R' U R U' U' R' (next 8 moves, fully disjoint from sexy-move's window)
    const moves = ['R', 'U', "R'", "U'", 'R', 'U', "R'", 'U', 'R', "U'", "U'", "R'"];
    const allResults: string[] = [];
    for (const m of moves) {
      const matches = detector.pushAll(m);
      for (const match of matches) allResults.push(match.algorithm.name);
    }
    expect(allResults).toContain('sexy-move');
    expect(allResults).toContain('sune');
  });

  it('no move-sequence collisions between different algorithms', () => {
    // Verify no two different-named algorithms share a move sequence in the expanded book
    const algMap = new Map<string, string>();
    for (const alg of CUBE_ALGORITHM_BOOK) {
      const key = alg.moves.join(' ');
      const existing = algMap.get(key);
      if (existing) {
        expect(existing).toBe(alg.name);
      }
      algMap.set(key, alg.name);
    }
  });
});
