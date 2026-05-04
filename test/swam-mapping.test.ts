import { describe, it, expect } from 'vitest';
import {
  // enums / tables
  HARMONICS, TREMOLO, BOW_POLY,
  HARMONICS_CC_VAL, TREMOLO_CC_VAL, BOW_POLY_CC_VAL,
  INTENSITY_MAP, ENV_PROFILE, ART_OFF_VEL, MOTION_NUDGE,
  LEGATO_COMPLEX, REGIME_ATTACK_MULT, REGIME_EXPR_RAMP_MULT,
  // helpers
  clamp, harmonicsForC4,
  phraseCountBounds, applyEnvelopeCount, stepVelScale,
  commitSieveWalk, faceTranspose,
  buildFaceMap,
  intensityEntry,
  type EnvProfile, type VelCurve,
} from '../src/swam-mapping.js';

describe('swam-mapping — tables', () => {
  it('HARMONICS / TREMOLO / BOW_POLY enums match Max-side integer values', () => {
    expect(HARMONICS).toEqual({ OFF: 0, OCT: 1, OCT_5TH: 2, CTRL: 3 });
    expect(TREMOLO).toEqual({ OFF: 0, SLOW: 1, FAST: 2 });
    expect(BOW_POLY).toEqual({
      MONO_STRING_CROSSING: 0, MONO_POLY_RELEASE: 1,
      DOUBLE: 2, DOUBLE_HOLD: 3, AUTO: 4,
    });
  });

  it('HARMONICS_CC_VAL band centers step 0,48,80,112 (4 bands across 0-127)', () => {
    expect(HARMONICS_CC_VAL[HARMONICS.OFF]).toBe(16);
    expect(HARMONICS_CC_VAL[HARMONICS.OCT]).toBe(48);
    expect(HARMONICS_CC_VAL[HARMONICS.OCT_5TH]).toBe(80);
    expect(HARMONICS_CC_VAL[HARMONICS.CTRL]).toBe(112);
  });

  it('INTENSITY_MAP monotonic across p → fff on every numeric axis', () => {
    const order = ['p', 'mp', 'mf', 'f', 'ff', 'fff'] as const;
    const fields: (keyof typeof INTENSITY_MAP.p)[] = ['expr', 'vel', 'bowMult', 'density', 'tremRateMult'];
    for (const field of fields) {
      for (let i = 1; i < order.length; i++) {
        expect(INTENSITY_MAP[order[i]][field]).toBeGreaterThan(INTENSITY_MAP[order[i - 1]][field]);
      }
    }
  });

  it('intensityEntry falls back to mf on unknown labels', () => {
    expect(intensityEntry('bogus')).toEqual(INTENSITY_MAP.mf);
    expect(intensityEntry('f')).toEqual(INTENSITY_MAP.f);
  });

  it('ENV_PROFILE covers all 7 envelope shapes (drone replaced by hairpin-up + hairpin-down)', () => {
    const expected = ['pluck', 'swell', 'stab', 'hairpin-up', 'hairpin-down', 'fade', 'burst'] as const;
    for (const k of expected) expect(ENV_PROFILE[k]).toBeDefined();
  });

  it('ENV_PROFILE isSingle → pluck/stab/hairpin-up/hairpin-down; burst is the only countMult != 1', () => {
    const singles = Object.entries(ENV_PROFILE).filter(([, p]) => p.isSingle).map(([k]) => k).sort();
    expect(singles).toEqual(['hairpin-down', 'hairpin-up', 'pluck', 'stab']);

    const multipliers = Object.entries(ENV_PROFILE).filter(([, p]) => p.countMult !== 1.0).map(([k]) => k);
    expect(multipliers).toEqual(['burst']);
    expect(ENV_PROFILE.burst.countMult).toBeGreaterThan(1);
  });

  it('isDrone is no longer set on any profile (drone removed in favour of hairpins)', () => {
    const drones = Object.entries(ENV_PROFILE).filter(([, p]) => p.isDrone).map(([k]) => k);
    expect(drones).toEqual([]);
  });

  it('ART_OFF_VEL covers 4 articulations in 0..127', () => {
    expect(Object.keys(ART_OFF_VEL).sort()).toEqual(['attack', 'iterative', 'release', 'sustained']);
    for (const v of Object.values(ART_OFF_VEL)) expect(v).toBeGreaterThan(0);
    for (const v of Object.values(ART_OFF_VEL)) expect(v).toBeLessThanOrEqual(127);
  });

  it('MOTION_NUDGE symmetric around 0 for up/down, zero for static/oscillate', () => {
    expect(MOTION_NUDGE.up).toBe(-MOTION_NUDGE.down);
    expect(MOTION_NUDGE.static).toBe(0);
    expect(MOTION_NUDGE.oscillate).toBe(0);
  });

  it('LEGATO_COMPLEX covers C2,C3,C5,C6,C7 only', () => {
    expect(Object.keys(LEGATO_COMPLEX).sort()).toEqual(['2', '3', '5', '6', '7']);
  });

  it('REGIME_{ATTACK,EXPR_RAMP}_MULT cover all three regimes with contemplative > conversational > burst', () => {
    expect(REGIME_ATTACK_MULT.contemplative).toBeGreaterThan(REGIME_ATTACK_MULT.conversational);
    expect(REGIME_ATTACK_MULT.conversational).toBeGreaterThan(REGIME_ATTACK_MULT.burst);
    expect(REGIME_EXPR_RAMP_MULT.contemplative).toBeGreaterThan(REGIME_EXPR_RAMP_MULT.conversational);
    expect(REGIME_EXPR_RAMP_MULT.conversational).toBeGreaterThan(REGIME_EXPR_RAMP_MULT.burst);
  });
});

describe('swam-mapping — helpers', () => {
  it('clamp behaves like Math.max(lo, Math.min(hi, x))', () => {
    expect(clamp(-1, 0, 10)).toBe(0);
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(11, 0, 10)).toBe(10);
    expect(clamp(5, 5, 5)).toBe(5);
  });

  describe('harmonicsForC4', () => {
    it('even tetra → OCT, odd tetra → OCT_5TH', () => {
      expect(harmonicsForC4(0)).toBe(HARMONICS.OCT);
      expect(harmonicsForC4(1)).toBe(HARMONICS.OCT_5TH);
    });
    it('never returns OFF (reserved for non-C4) or CTRL (algorithm-only)', () => {
      for (const t of [0, 1] as const) {
        expect(harmonicsForC4(t)).not.toBe(HARMONICS.OFF);
        expect(harmonicsForC4(t)).not.toBe(HARMONICS.CTRL);
      }
    });
  });

  describe('phraseCountBounds', () => {
    it('scales lo/hi by intensity.density and density-derived multiplier', () => {
      const a = phraseCountBounds('p',   0.5, 2, 5);
      const b = phraseCountBounds('mf',  1.0, 2, 5);
      const c = phraseCountBounds('fff', 2.5, 2, 5);
      expect(a.hi).toBeLessThanOrEqual(b.hi);
      expect(b.hi).toBeLessThanOrEqual(c.hi);
      expect(a.lo).toBeGreaterThanOrEqual(1);
    });
    it('clamps hi ≥ lo', () => {
      const r = phraseCountBounds('p', 0, 2, 5);
      expect(r.hi).toBeGreaterThanOrEqual(r.lo);
    });
  });

  describe('applyEnvelopeCount', () => {
    const pluckProfile = ENV_PROFILE.pluck;
    const burstProfile = ENV_PROFILE.burst;
    const swellProfile = ENV_PROFILE.swell;

    it('isSingle collapses to 1, or 0 when forGliss', () => {
      expect(applyEnvelopeCount(pluckProfile, 5, 2, false)).toBe(1);
      expect(applyEnvelopeCount(pluckProfile, 5, 2, true)).toBe(0);
    });
    it('burst thickens by countMult, clamped to [baseLo, 12]', () => {
      expect(applyEnvelopeCount(burstProfile, 5, 2, false)).toBe(Math.round(5 * 1.8));
      expect(applyEnvelopeCount(burstProfile, 10, 2, false)).toBe(12);   // clamp to 12
      expect(applyEnvelopeCount(burstProfile, 1, 3, false)).toBe(3);     // clamp to baseLo
    });
    it('non-modifying profiles pass through', () => {
      expect(applyEnvelopeCount(swellProfile, 4, 2, false)).toBe(4);
      expect(applyEnvelopeCount(null, 4, 2, false)).toBe(4);
    });
  });

  describe('stepVelScale', () => {
    it('count ≤ 1 always returns 1.0', () => {
      for (const curve of ['cresc', 'dim', 'accent-first', 'flat'] as VelCurve[]) {
        expect(stepVelScale(curve, 0, 1)).toBe(1.0);
        expect(stepVelScale(curve, 0, 0)).toBe(1.0);
      }
    });
    it('cresc rises from 0.72 to 1.27 monotonically', () => {
      const vals = [0, 1, 2, 3, 4].map(i => stepVelScale('cresc', i, 5));
      for (let i = 1; i < vals.length; i++) expect(vals[i]).toBeGreaterThan(vals[i - 1]);
      expect(vals[0]).toBeCloseTo(0.72, 5);
      expect(vals[vals.length - 1]).toBeCloseTo(1.27, 5);
    });
    it('dim is the mirror of cresc', () => {
      for (let i = 0; i < 5; i++) {
        expect(stepVelScale('dim', i, 5) + stepVelScale('cresc', i, 5)).toBeCloseTo(1.99, 5);
      }
    });
    it('accent-first lands 1.22 on step 0, 0.88 elsewhere', () => {
      expect(stepVelScale('accent-first', 0, 6)).toBe(1.22);
      expect(stepVelScale('accent-first', 3, 6)).toBe(0.88);
    });
    it('flat is constant 1.0', () => {
      expect(stepVelScale('flat', 0, 5)).toBe(1.0);
      expect(stepVelScale('flat', 4, 5)).toBe(1.0);
    });
  });

  describe('commitSieveWalk', () => {
    const LEN = 7;

    it("motion 'up' forces dir=+1, keeps idx when it has runway", () => {
      const r = commitSieveWalk(LEN, 2, -1, 3, 'up');
      expect(r.dir).toBe(1);
      expect(r.idx).toBe(2);
    });
    it("motion 'up' reseeds idx → 0 when count runs off the top", () => {
      const r = commitSieveWalk(LEN, 6, 1, 3, 'up');
      expect(r.idx).toBe(0);
      expect(r.dir).toBe(1);
    });
    it("motion 'down' reseeds idx → len-1 when count runs off the bottom", () => {
      const r = commitSieveWalk(LEN, 1, 1, 3, 'down');
      expect(r.idx).toBe(LEN - 1);
      expect(r.dir).toBe(-1);
    });
    it('auto-flip at boundary when no motion override (dir flips, idx reseeds)', () => {
      const r = commitSieveWalk(LEN, 5, 1, 3, null);
      expect(r.dir).toBe(-1);
      expect(r.idx).toBe(LEN - 1);
    });
    it("motion 'static' / 'oscillate' leave idx/dir untouched", () => {
      const r1 = commitSieveWalk(LEN, 2, 1, 3, 'static');
      expect(r1).toEqual({ idx: 2, dir: 1 });
      const r2 = commitSieveWalk(LEN, 3, -1, 2, 'oscillate');
      expect(r2).toEqual({ idx: 3, dir: -1 });
    });
    it('empty sieve short-circuits', () => {
      const r = commitSieveWalk(0, 0, 1, 5, 'up');
      expect(r).toEqual({ idx: 0, dir: 1 });
    });
  });

  describe('faceTranspose', () => {
    it('uses ±12 spread', () => {
      expect(faceTranspose(1.0, 'static', 0)).toBe(12);
      expect(faceTranspose(-1.0, 'static', 0)).toBe(-12);
    });
    it('motion up adds +2, down adds -2', () => {
      expect(faceTranspose(0.0, 'up',   0)).toBe(2);
      expect(faceTranspose(0.0, 'down', 0)).toBe(-2);
    });
    it('oscillate flips per turnCount parity', () => {
      const even = faceTranspose(0.0, 'oscillate', 0);
      const odd  = faceTranspose(0.0, 'oscillate', 1);
      expect(even + odd).toBe(0);
      expect(Math.abs(even)).toBe(2);
    });
  });

  describe('buildFaceMap', () => {
    it('produces 12 entries derived from FACE_SIGNATURES', () => {
      const map = buildFaceMap();
      expect(Object.keys(map)).toHaveLength(12);
      for (const entry of Object.values(map)) {
        expect(typeof entry.durationSec).toBe('number');
        expect(typeof entry.registerBias).toBe('number');
        expect(['pluck', 'swell', 'stab', 'hairpin-up', 'hairpin-down', 'fade', 'burst']).toContain(entry.envelope);
        expect(['attack', 'sustained', 'release', 'iterative']).toContain(entry.articulation);
        expect(['static', 'up', 'down', 'oscillate']).toContain(entry.motion);
      }
    });
  });
});
