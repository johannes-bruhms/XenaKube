import { describe, it, expect } from 'vitest';
import {
  // enums / tables
  HARMONICS, TREMOLO, BOW_POLY,
  HARMONICS_CC_VAL, TREMOLO_CC_VAL, BOW_POLY_CC_VAL,
  INTENSITY_MAP, ENV_PROFILE, ART_OFF_VEL, MOTION_NUDGE,
  CC_EXPRESSION_FLOOR, ONSET_EXPRESSION_MIN,
  LEGATO_COMPLEX, MAX_PHRASE_DURATION_SEC, COMPLEX_DURATION_FLOOR_SEC,
  HALF_TURN_WINDOW_MS, HALF_TURN_GESTURE_DURATION_SEC,
  HALF_TURN_GLISS_DURATION_SEC, HALF_TURN_GLISS_SPAN_BY_COMPLEX,
  HALF_TURN_GESTURE_INTENSITY, HALF_TURN_GESTURE_EXPR,
  HALF_TURN_GESTURE_VELOCITY, HALF_TURN_GESTURE_NOTE_MS,
  HALF_TURN_GESTURE_RELEASE_MS, HALF_TURN_GESTURE_BOW_PRESSURE,
  HALF_TURN_GESTURE_BOW_POSITION,
  REGIME_ATTACK_MULT, REGIME_EXPR_RAMP_MULT,
  RATE_PRESSURE_START_TPS, RATE_PRESSURE_FULL_TPS,
  RATE_DENSITY_GAIN_BY_COMPLEX, RATE_VELOCITY_GAIN_BY_COMPLEX,
  RATE_EXPR_GAIN_BY_COMPLEX, RATE_BOW_GAIN_BY_COMPLEX,
  RATE_TREMOLO_GAIN_BY_COMPLEX, RATE_ACCENT_GAIN_BY_COMPLEX,
  // helpers
  clamp, harmonicsForC4,
  expressionCcValue, onsetExpressionValue,
  phraseCountBounds, stepVelScale,
  commitSieveWalk, faceTranspose, resolvePhraseDuration,
  buildFaceMap,
  turnRatePressure, rateDensityMultiplier, rateVelocityMultiplier,
  rateExpressionMultiplier, rateBowPressureMultiplier, rateTremoloMultiplier,
  rateAccentValue,
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

  it('expression onset floor stays above the play-time CC 11 floor', () => {
    expect(CC_EXPRESSION_FLOOR).toBeGreaterThan(0);
    expect(ONSET_EXPRESSION_MIN).toBeGreaterThan(CC_EXPRESSION_FLOOR);
    expect(expressionCcValue(1)).toBe(CC_EXPRESSION_FLOOR);
    expect(expressionCcValue(0)).toBe(0);
    expect(onsetExpressionValue(1)).toBe(ONSET_EXPRESSION_MIN);
    expect(onsetExpressionValue(ONSET_EXPRESSION_MIN + 10)).toBe(ONSET_EXPRESSION_MIN + 10);
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

  it('MOTION_NUDGE is neutral because faces do not prescribe pitch direction', () => {
    expect(MOTION_NUDGE.up).toBe(0);
    expect(MOTION_NUDGE.down).toBe(0);
    expect(MOTION_NUDGE.static).toBe(0);
    expect(MOTION_NUDGE.oscillate).toBe(0);
  });

  it('half-turn punctuation constants define a short loud gesture', () => {
    expect(HALF_TURN_WINDOW_MS).toBe(150);
    expect(HALF_TURN_GESTURE_DURATION_SEC).toBeLessThan(0.4);
    expect(HALF_TURN_GLISS_DURATION_SEC).toBeGreaterThan(0.2);
    expect(HALF_TURN_GLISS_DURATION_SEC).toBeLessThanOrEqual(0.5);
    expect(Math.round(HALF_TURN_GLISS_DURATION_SEC * 1000) + HALF_TURN_GESTURE_RELEASE_MS + 20)
      .toBeLessThanOrEqual(500);
    expect(HALF_TURN_GLISS_SPAN_BY_COMPLEX).toEqual({ 5: 24, 6: 7, 7: 1 });
    expect(HALF_TURN_GESTURE_INTENSITY).toBe('fff');
    expect(HALF_TURN_GESTURE_EXPR).toBe(127);
    expect(HALF_TURN_GESTURE_VELOCITY).toBeGreaterThanOrEqual(120);
    expect(HALF_TURN_GESTURE_NOTE_MS).toBeLessThan(HALF_TURN_GESTURE_DURATION_SEC * 1000);
    expect(HALF_TURN_GESTURE_RELEASE_MS).toBeLessThanOrEqual(80);
    expect(HALF_TURN_GESTURE_BOW_PRESSURE).toBeGreaterThanOrEqual(110);
    expect(HALF_TURN_GESTURE_BOW_POSITION).toBeGreaterThanOrEqual(0);
    expect(HALF_TURN_GESTURE_BOW_POSITION).toBeLessThanOrEqual(64);
  });

  it('LEGATO_COMPLEX preserves cross-phrase tails only where the next onset needs it', () => {
    expect(Object.keys(LEGATO_COMPLEX).sort()).toEqual(['2', '5', '6', '7']);
    expect(LEGATO_COMPLEX[3]).toBeUndefined();
  });

  it('phrase duration bounds cover all complexes and keep C5 identity protected', () => {
    expect(MAX_PHRASE_DURATION_SEC).toBe(30);
    expect(Object.keys(COMPLEX_DURATION_FLOOR_SEC).sort()).toEqual(['1', '2', '3', '4', '5', '6', '7', '8']);
    expect(COMPLEX_DURATION_FLOOR_SEC[5]).toBeGreaterThan(COMPLEX_DURATION_FLOOR_SEC[1]);
  });

  it('REGIME_{ATTACK,EXPR_RAMP}_MULT cover all three regimes with contemplative > conversational > burst', () => {
    expect(REGIME_ATTACK_MULT.contemplative).toBeGreaterThan(REGIME_ATTACK_MULT.conversational);
    expect(REGIME_ATTACK_MULT.conversational).toBeGreaterThan(REGIME_ATTACK_MULT.burst);
    expect(REGIME_EXPR_RAMP_MULT.contemplative).toBeGreaterThan(REGIME_EXPR_RAMP_MULT.conversational);
    expect(REGIME_EXPR_RAMP_MULT.conversational).toBeGreaterThan(REGIME_EXPR_RAMP_MULT.burst);
  });

  it('RATE_* gains cover all eight complexes and keep C8 density inert', () => {
    for (const table of [
      RATE_DENSITY_GAIN_BY_COMPLEX,
      RATE_VELOCITY_GAIN_BY_COMPLEX,
      RATE_EXPR_GAIN_BY_COMPLEX,
      RATE_BOW_GAIN_BY_COMPLEX,
      RATE_TREMOLO_GAIN_BY_COMPLEX,
      RATE_ACCENT_GAIN_BY_COMPLEX,
    ]) {
      expect(Object.keys(table).sort()).toEqual(['1', '2', '3', '4', '5', '6', '7', '8']);
      for (const v of Object.values(table)) {
        expect(v).toBeGreaterThanOrEqual(0);
        expect(v).toBeLessThanOrEqual(0.5);
      }
    }
    expect(RATE_DENSITY_GAIN_BY_COMPLEX[8]).toBe(0);
    expect(RATE_TREMOLO_GAIN_BY_COMPLEX[8]).toBeGreaterThan(0);
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
    it('turn-rate pressure increases hi through the complex-specific density gain', () => {
      const slow = phraseCountBounds('mf', 1.5, 3, 5, 2, RATE_PRESSURE_START_TPS);
      const fast = phraseCountBounds('mf', 1.5, 3, 5, 2, RATE_PRESSURE_FULL_TPS);
      expect(fast.hi).toBeGreaterThan(slow.hi);

      const c8Slow = phraseCountBounds('mf', 1.5, 3, 5, 8, RATE_PRESSURE_START_TPS);
      const c8Fast = phraseCountBounds('mf', 1.5, 3, 5, 8, RATE_PRESSURE_FULL_TPS);
      expect(c8Fast.hi).toBe(c8Slow.hi);
    });
  });

  describe('turn-rate pressure helpers', () => {
    it('normalizes turn rate into a bounded pressure scalar', () => {
      expect(turnRatePressure(0)).toBe(0);
      expect(turnRatePressure(RATE_PRESSURE_START_TPS)).toBe(0);
      expect(turnRatePressure(RATE_PRESSURE_FULL_TPS)).toBe(1);
      expect(turnRatePressure(RATE_PRESSURE_FULL_TPS + 10)).toBe(1);
    });

    it('keeps multipliers at 1 below pressure start and applies per-complex gains at full pressure', () => {
      expect(rateDensityMultiplier(5, 0)).toBe(1);
      expect(rateVelocityMultiplier(5, RATE_PRESSURE_FULL_TPS)).toBeCloseTo(1 + RATE_VELOCITY_GAIN_BY_COMPLEX[5], 5);
      expect(rateExpressionMultiplier(7, RATE_PRESSURE_FULL_TPS)).toBeCloseTo(1 + RATE_EXPR_GAIN_BY_COMPLEX[7], 5);
      expect(rateBowPressureMultiplier(2, RATE_PRESSURE_FULL_TPS)).toBeCloseTo(1 + RATE_BOW_GAIN_BY_COMPLEX[2], 5);
      expect(rateTremoloMultiplier(8, RATE_PRESSURE_FULL_TPS)).toBeCloseTo(1 + RATE_TREMOLO_GAIN_BY_COMPLEX[8], 5);
    });

    it('raises C5 accent value but leaves non-accent complexes unchanged', () => {
      expect(rateAccentValue(80, 5, RATE_PRESSURE_FULL_TPS)).toBe(Math.round(80 * (1 + RATE_ACCENT_GAIN_BY_COMPLEX[5])));
      expect(rateAccentValue(80, 6, RATE_PRESSURE_FULL_TPS)).toBe(80);
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
    it('is neutral for every registerBias, motion, and turn parity', () => {
      expect(faceTranspose(1.0, 'static', 0)).toBe(0);
      expect(faceTranspose(-1.0, 'static', 0)).toBe(0);
      expect(faceTranspose(0.0, 'up', 0)).toBe(0);
      expect(faceTranspose(0.0, 'down', 0)).toBe(0);
      expect(faceTranspose(0.0, 'oscillate', 0)).toBe(0);
      expect(faceTranspose(0.0, 'oscillate', 1)).toBe(0);
    });
  });

  describe('resolvePhraseDuration', () => {
    it('uses vertex duration as the material base', () => {
      expect(resolvePhraseDuration(4, null, 2)).toEqual({
        durationSec: 4,
        durationSource: 'vertex',
      });
    });

    it('scales vertex duration by face multiplier', () => {
      const resolved = resolvePhraseDuration(4, 1.85, 2);
      expect(resolved.durationSec).toBeCloseTo(7.4);
      expect(resolved.durationSource).toBe('vertex*face');
    });

    it('applies complex floors after face scaling', () => {
      expect(resolvePhraseDuration(1, 0.5, 5)).toEqual({
        durationSec: COMPLEX_DURATION_FLOOR_SEC[5],
        durationSource: 'vertex*face+floor',
      });
    });

    it('caps very long spans at the max phrase duration', () => {
      expect(resolvePhraseDuration(20, 2.5, 8).durationSec).toBe(MAX_PHRASE_DURATION_SEC);
    });
  });

  describe('buildFaceMap', () => {
    it('produces 12 entries derived from FACE_SIGNATURES', () => {
      const map = buildFaceMap();
      expect(Object.keys(map)).toHaveLength(12);
      for (const entry of Object.values(map)) {
        expect(typeof entry.durationMult).toBe('number');
        expect(typeof entry.registerBias).toBe('number');
        expect(['pluck', 'swell', 'stab', 'hairpin-up', 'hairpin-down', 'fade', 'burst']).toContain(entry.envelope);
        expect(['attack', 'sustained', 'release', 'iterative']).toContain(entry.articulation);
        expect(['static', 'up', 'down', 'oscillate']).toContain(entry.motion);
      }
    });
  });
});
