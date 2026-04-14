import { describe, it, expect } from 'vitest';
import { SpellDetector, SPELL_BOOK, CANONICAL_SPELLS, expandSpellBook } from '../src/spells.js';

describe('SpellDetector', () => {
  it('detects sexy move (R U R\' U\')', () => {
    const detector = new SpellDetector();
    expect(detector.push('R')).toBeNull();
    expect(detector.push('U')).toBeNull();
    expect(detector.push("R'")).toBeNull();
    const result = detector.push("U'");
    expect(result).not.toBeNull();
    expect(result!.spell.name).toBe('sexy-move');
  });

  it('detects sune (R U R\' U R U2 R\')', () => {
    const detector = new SpellDetector();
    detector.push('R');
    detector.push('U');
    detector.push("R'");
    detector.push('U');
    detector.push('R');
    detector.push('U2');
    const result = detector.push("R'");
    expect(result).not.toBeNull();
    expect(result!.spell.name).toBe('sune');
  });

  it('does not trigger on partial match', () => {
    const detector = new SpellDetector();
    detector.push('R');
    detector.push('U');
    expect(detector.push("R'")).toBeNull();
    expect(detector.push('F')).toBeNull();
  });

  it('clears buffer after timeout', () => {
    const detector = new SpellDetector();
    let t = 1000;
    detector.push('R', t);
    detector.push('U', t += 100);
    // Gap > 2000ms
    detector.push("R'", t += 3000);
    const result = detector.push("U'", t += 100);
    expect(result).toBeNull();
  });

  it('consecutive sexy-moves fire twice', () => {
    const detector = new SpellDetector();
    const moves: string[] = ['R', 'U', "R'", "U'", 'R', 'U', "R'", "U'"];
    const allResults: string[] = [];
    for (const m of moves) {
      const matches = detector.pushAll(m);
      for (const match of matches) {
        allResults.push(match.spell.name);
      }
    }
    expect(allResults.filter(n => n === 'sexy-move')).toHaveLength(2);
  });

  it('buffer is not consumed — sequential spells both fire', () => {
    const detector = new SpellDetector();
    // sexy + sune back-to-back: R U R' U' R U R' U R U2 R'
    const moves: string[] = ['R', 'U', "R'", "U'", 'R', 'U', "R'", 'U', 'R', 'U2', "R'"];
    const allResults: string[] = [];
    for (const m of moves) {
      const matches = detector.pushAll(m);
      for (const match of matches) {
        allResults.push(match.spell.name);
      }
    }
    expect(allResults).toContain('sexy-move'); // fires at move 4
    expect(allResults).toContain('sune');      // fires at move 11
  });

  it('detects spell after unrelated moves', () => {
    const detector = new SpellDetector();
    detector.push('F');
    detector.push('F');
    detector.push('F');
    detector.push('R');
    detector.push('U');
    detector.push("R'");
    const result = detector.push("U'");
    expect(result).not.toBeNull();
    expect(result!.spell.name).toBe('sexy-move');
  });

  it('same spell does not fire twice on the same tail', () => {
    const detector = new SpellDetector();
    detector.push('R');
    detector.push('U');
    detector.push("R'");
    const r1 = detector.push("U'");
    expect(r1).not.toBeNull();
    // Pushing a non-matching move should not re-fire sexy-move
    const r2 = detector.push('F');
    expect(r2).toBeNull();
  });

  it('getPartialMatches shows progress toward spells', () => {
    const detector = new SpellDetector();
    detector.push('R');
    detector.push('U');
    const partials = detector.getPartialMatches();
    const sexyPartial = partials.find(p => p.spell.name === 'sexy-move');
    expect(sexyPartial).toBeDefined();
    expect(sexyPartial!.matched).toBe(2);
  });

  it('getBuffer returns full buffer (not consumed by matches)', () => {
    const detector = new SpellDetector();
    detector.push('R');
    detector.push('U');
    detector.push("R'");
    detector.push("U'");
    // Buffer retains all moves
    expect(detector.getBuffer()).toEqual(['R', 'U', "R'", "U'"]);
  });

  it('spell book has all expected entries', () => {
    const names = SPELL_BOOK.map(s => s.name);
    expect(names).toContain('sexy-move');
    expect(names).toContain('oll-cross');
    expect(names).toContain('sune');
    expect(names).toContain('anti-sune');
    expect(names).toContain('u-perm');
    expect(names).toContain('t-perm');
    expect(names).not.toContain('sledgehammer');
  });
});

describe('Orientation-independent spell detection', () => {
  it('generates exactly 24 rotation variants', () => {
    const expanded = expandSpellBook(CANONICAL_SPELLS);
    const counts = new Map<string, number>();
    for (const s of expanded) counts.set(s.name, (counts.get(s.name) || 0) + 1);
    for (const [name, count] of counts) {
      expect(count).toBe(24);
    }
  });

  it('detects sexy-move on different face pairs', () => {
    const detector = new SpellDetector();

    // F R F' R' = sexy-move rotated (x rotation: U→F, so R U R' U' → R F R' F')
    // Actually under x: R stays, U→F, so sexy-move → R F R' F'
    expect(detector.push('R')).toBeNull();
    expect(detector.push('F')).toBeNull();
    expect(detector.push("R'")).toBeNull();
    const r1 = detector.push("F'");
    expect(r1).not.toBeNull();
    expect(r1!.spell.name).toBe('sexy-move');
  });

  it('detects sexy-move as F U F\' U\' (y\' rotation)', () => {
    const detector = new SpellDetector();
    // y' maps R→F, U stays, so sexy-move R U R' U' → F U F' U'
    expect(detector.push('F')).toBeNull();
    expect(detector.push('U')).toBeNull();
    expect(detector.push("F'")).toBeNull();
    const r = detector.push("U'");
    expect(r).not.toBeNull();
    expect(r!.spell.name).toBe('sexy-move');
  });

  it('detects sexy-move as L D L\' D\' (opposite faces)', () => {
    const detector = new SpellDetector();
    expect(detector.push('L')).toBeNull();
    expect(detector.push('D')).toBeNull();
    expect(detector.push("L'")).toBeNull();
    const r = detector.push("D'");
    expect(r).not.toBeNull();
    expect(r!.spell.name).toBe('sexy-move');
  });

  it('detects inverse-sexy pattern as sexy-move (rotation-equivalent)', () => {
    const detector = new SpellDetector();
    // U R U' R' was inverse-sexy, now detected as sexy-move rotation variant
    expect(detector.push('U')).toBeNull();
    expect(detector.push('R')).toBeNull();
    expect(detector.push("U'")).toBeNull();
    const r = detector.push("R'");
    expect(r).not.toBeNull();
    expect(r!.spell.name).toBe('sexy-move');
  });

  it('detects sune on different faces (F U F\' U F U2 F\')', () => {
    const detector = new SpellDetector();
    // sune R U R' U R U2 R' under y' rotation (R→F, U→U): F U F' U F U2 F'
    expect(detector.push('F')).toBeNull();
    expect(detector.push('U')).toBeNull();
    expect(detector.push("F'")).toBeNull();
    expect(detector.push('U')).toBeNull();
    expect(detector.push('F')).toBeNull();
    expect(detector.push('U2')).toBeNull();
    const r = detector.push("F'");
    expect(r).not.toBeNull();
    expect(r!.spell.name).toBe('sune');
  });

  it('detects oll-cross on rotated faces', () => {
    const detector = new SpellDetector();
    // oll-cross: F R U R' U' F' → under y' (R→F, F→L, U→U): L F U F' U' L'
    const moves = ['L', 'F', 'U', "F'", "U'", "L'"];
    let result = null;
    for (const m of moves) result = detector.push(m);
    expect(result).not.toBeNull();
    expect(result!.spell.name).toBe('oll-cross');
  });

  it('getPartialMatches deduplicates by spell name', () => {
    const detector = new SpellDetector();
    // Push R — this is a prefix of many rotation variants of many spells
    detector.push('R');
    const partials = detector.getPartialMatches();
    // Should have at most one entry per spell name
    const names = partials.map(p => p.spell.name);
    const uniqueNames = [...new Set(names)];
    expect(names.length).toBe(uniqueNames.length);
  });

  it('getCanonicalSpells returns one entry per spell', () => {
    const detector = new SpellDetector();
    const canonical = detector.getCanonicalSpells();
    const names = canonical.map(s => s.name);
    expect(names.length).toBe(new Set(names).size);
    expect(names.length).toBe(CANONICAL_SPELLS.length);
  });

  it('suppresses overlapping spells on repeated sexy cycles', () => {
    const detector = new SpellDetector();
    // R U R' U' cycled three times. Each full cycle should fire sexy-move
    // exactly once — not partially-overlapping rotation variants.
    const cycle = ['R', 'U', "R'", "U'"];
    const allResults: string[] = [];
    for (let c = 0; c < 3; c++) {
      for (const m of cycle) {
        const matches = detector.pushAll(m);
        for (const match of matches) allResults.push(match.spell.name);
      }
    }
    // Exactly 3 sexy-move matches, one per full cycle
    expect(allResults.filter(n => n === 'sexy-move')).toHaveLength(3);
  });

  it('layered detection: both sexy-move and sune fire when cast back-to-back', () => {
    const detector = new SpellDetector();
    // sexy-move = R U R' U' (first 4 moves)
    // sune = R U R' U R U2 R' (next 7 moves, fully disjoint from sexy-move's window)
    const moves = ['R', 'U', "R'", "U'", 'R', 'U', "R'", 'U', 'R', 'U2', "R'"];
    const allResults: string[] = [];
    for (const m of moves) {
      const matches = detector.pushAll(m);
      for (const match of matches) allResults.push(match.spell.name);
    }
    expect(allResults).toContain('sexy-move');
    expect(allResults).toContain('sune');
  });

  it('no algorithm collisions between different spells', () => {
    // Verify no two different-named spells share an algorithm in the expanded book
    const algMap = new Map<string, string>();
    for (const spell of SPELL_BOOK) {
      const key = spell.algorithm.join(' ');
      const existing = algMap.get(key);
      if (existing) {
        expect(existing).toBe(spell.name);
      }
      algMap.set(key, spell.name);
    }
  });
});
