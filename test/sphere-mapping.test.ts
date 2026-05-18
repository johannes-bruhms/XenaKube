import { describe, it, expect } from 'vitest';
import {
  pickGongStrike, pickKempulStrike, pickSaronStrike,
  pickSlenthemStrike, pickBonangStrike, samplesIn, sampleExists,
} from '../src/sphere-mapping.js';
import {
  GAMELAN_SAMPLES, GAMELAN_SAMPLE_COUNT, GAMELAN_MANIFEST_HASH,
  GAMELAN_INSTRUMENT_COUNTS,
} from '../src/gamelan-manifest.js';
import { readdirSync } from 'node:fs';
import { resolve } from 'node:path';

describe('Gamelan sample manifest', () => {
  it('declared sample count matches manifest length', () => {
    expect(GAMELAN_SAMPLES.length).toBe(GAMELAN_SAMPLE_COUNT);
  });

  it('manifest entries are unique by canonical name', () => {
    const names = new Set(GAMELAN_SAMPLES.map(s => s.canonical));
    expect(names.size).toBe(GAMELAN_SAMPLES.length);
  });

  it('every manifest entry has a real .wav file under max/media/gamelan/', () => {
    // D77 — runtime sample-load completeness invariant must not falsely
    // accuse the user of a missing file when the manifest itself is wrong.
    const files = new Set(readdirSync(resolve(__dirname, '..', 'max', 'media', 'gamelan')).filter(f => f.endsWith('.wav')));
    for (const entry of GAMELAN_SAMPLES) {
      expect(files.has(entry.file), `manifest entry ${entry.canonical} points to missing file ${entry.file}`).toBe(true);
    }
  });

  it('every .wav on disk appears in the manifest', () => {
    const declared = new Set(GAMELAN_SAMPLES.map(s => s.file));
    const onDisk = readdirSync(resolve(__dirname, '..', 'max', 'media', 'gamelan')).filter(f => f.endsWith('.wav'));
    for (const f of onDisk) {
      expect(declared.has(f), `${f} present on disk but missing from manifest — re-run scripts/build-gamelan-manifest.mjs`).toBe(true);
    }
  });

  it('expected instrument families present', () => {
    expect(GAMELAN_INSTRUMENT_COUNTS.gong).toBeGreaterThan(0);
    expect(GAMELAN_INSTRUMENT_COUNTS.saron).toBeGreaterThan(0);
    expect(GAMELAN_INSTRUMENT_COUNTS.kempul).toBeGreaterThan(0);
    expect(GAMELAN_INSTRUMENT_COUNTS.slenthem).toBeGreaterThan(0);
    expect(GAMELAN_INSTRUMENT_COUNTS.bonang).toBeGreaterThan(0);
    expect(GAMELAN_INSTRUMENT_COUNTS.kempyang).toBeGreaterThan(0);
    expect(GAMELAN_INSTRUMENT_COUNTS.kethuk).toBeGreaterThan(0);
  });

  it('manifest hash is stable and 16 hex chars', () => {
    expect(GAMELAN_MANIFEST_HASH).toMatch(/^[0-9a-f]{16}$/);
  });
});

describe('Sphere strike pickers', () => {
  it('pickGongStrike returns a center-struck gong', () => {
    const s = pickGongStrike(0.5);
    expect(s).toBeDefined();
    expect(s!.instrument).toBe('gong');
    expect(s!.modifiers).toContain('center');
  });

  it('pickKempulStrike returns the requested pelog degree', () => {
    for (const d of ['5', '6', '7', '1h'] as const) {
      const s = pickKempulStrike(d, 0.7);
      expect(s, `kempul degree ${d}`).toBeDefined();
      expect(s!.instrument).toBe('kempul');
      expect(s!.degree).toBe(d);
      expect(s!.tuning).toBe('pelog');
    }
  });

  it('pickSaronStrike returns the requested pelog degree with mallet preference', () => {
    const s = pickSaronStrike('1', 0.6, { malletPref: 'pekingmallet' });
    expect(s).toBeDefined();
    expect(s!.instrument).toBe('saron');
    expect(s!.degree).toBe('1');
    expect(s!.mallet).toContain('pekingmallet');
  });

  it('pickSlenthemStrike supports both pelog and slendro', () => {
    const p = pickSlenthemStrike('pelog', '1', 0.5);
    expect(p?.tuning).toBe('pelog');
    const sl = pickSlenthemStrike('slendro', '1', 0.5);
    expect(sl?.tuning).toBe('slendro');
  });

  it('pickBonangStrike finds slendro samples', () => {
    const s = pickBonangStrike('1', 0.7);
    expect(s).toBeDefined();
    expect(s!.instrument).toBe('bonang');
    expect(s!.tuning).toBe('slendro');
  });

  it('samplesIn filters correctly', () => {
    const gongs = samplesIn('gong');
    expect(gongs.length).toBe(GAMELAN_INSTRUMENT_COUNTS.gong);
    expect(gongs.every(s => s.instrument === 'gong')).toBe(true);
  });

  it('sampleExists is true for every manifest entry, false otherwise', () => {
    expect(sampleExists(GAMELAN_SAMPLES[0].canonical)).toBe(true);
    expect(sampleExists('not-a-real-sample')).toBe(false);
  });
});
