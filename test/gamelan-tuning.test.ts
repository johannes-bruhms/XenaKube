import { describe, it, expect } from 'vitest';
import {
  ALL_SCALES, SARON_PELOG, SLENTHEM_PELOG, SLENTHEM_SLENDRO,
  BONANG_SLENDRO, KEMPUL_PELOG, GAMELAN_TUNING_HASH,
  degreeHz, degreeMidi,
} from '../src/gamelan-tuning.js';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('Gamelan tuning data (Latent Sonorities / RBI Berlin)', () => {
  it('every scale is ascending with first cent = 0', () => {
    for (const s of ALL_SCALES) {
      expect(s.cents[0]).toBe(0);
      for (let i = 1; i < s.cents.length; i++) {
        expect(s.cents[i]).toBeGreaterThan(s.cents[i - 1]);
      }
    }
  });

  it('pelog/slendro 7-tone scales close at the octave', () => {
    expect(SARON_PELOG.cents[SARON_PELOG.cents.length - 1]).toBe(1200);
    expect(SLENTHEM_PELOG.cents[SLENTHEM_PELOG.cents.length - 1]).toBe(1200);
    expect(SLENTHEM_SLENDRO.cents[SLENTHEM_SLENDRO.cents.length - 1]).toBe(1200);
    expect(KEMPUL_PELOG.cents[KEMPUL_PELOG.cents.length - 1]).toBe(1200);
  });

  it('bonang barung scale extends across multiple octaves', () => {
    const last = BONANG_SLENDRO.cents[BONANG_SLENDRO.cents.length - 1];
    expect(last).toBeGreaterThan(2400); // > 2 octaves
  });

  it('saron pelog matches the .scl file (Khyam Allami source)', () => {
    expect(SARON_PELOG.cents).toEqual([0, 123, 271, 532, 675, 778, 951, 1200]);
    expect(Math.round(SARON_PELOG.refHz * 100) / 100).toBeCloseTo(596.9, 1);
  });

  it('slendro is roughly equipentatonic ~240¢ per step', () => {
    for (let i = 1; i < SLENTHEM_SLENDRO.cents.length; i++) {
      const step = SLENTHEM_SLENDRO.cents[i] - SLENTHEM_SLENDRO.cents[i - 1];
      expect(step).toBeGreaterThan(220);
      expect(step).toBeLessThan(260);
    }
  });

  it('degreeHz computes consistent absolute pitches', () => {
    expect(degreeHz(SARON_PELOG, 0)).toBeCloseTo(SARON_PELOG.refHz, 5);
    // Octave = 2x refHz
    expect(degreeHz(SARON_PELOG, SARON_PELOG.cents.length - 1)).toBeCloseTo(SARON_PELOG.refHz * 2, 5);
  });

  it('degreeMidi returns a sane MIDI + cent offset pair', () => {
    const m = degreeMidi(SARON_PELOG, 0);
    expect(m.midi).toBeGreaterThanOrEqual(0);
    expect(m.midi).toBeLessThanOrEqual(127);
    expect(Math.abs(m.cents)).toBeLessThanOrEqual(50);
  });

  it('tuning hash is stable and 16 hex chars', () => {
    expect(GAMELAN_TUNING_HASH).toMatch(/^[0-9a-f]{16}$/);
  });

  it('tuning hash matches the codegen output in max/gen_sphere_includes.js', () => {
    // D78 — drift guard. After editing gamelan-tuning.ts, `npm run gen:max`
    // must be re-run so xk_sphere.js's hash log matches the TS one.
    const out = readFileSync(resolve(__dirname, '..', 'max', 'gen_sphere_includes.js'), 'utf8');
    const m = out.match(/GAMELAN_TUNING_HASH\s*=\s*"([0-9a-f]+)"/);
    expect(m, 'gen_sphere_includes.js must define GAMELAN_TUNING_HASH').not.toBeNull();
    expect(m![1]).toBe(GAMELAN_TUNING_HASH);
  });
});
