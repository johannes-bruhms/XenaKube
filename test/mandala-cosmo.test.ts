import { describe, it, expect, beforeEach } from 'vitest';
import {
  planMandalaStrikes, COLOTOMIC_RING_LEN,
  SPHERE_INSTRUMENT_GLYPH, resetStrikeIds,
} from '../src/mandala-cosmo.js';
import type { XenaKubeState } from '../src/types.js';
import type { VoiceOutput } from '../src/voice-engine.js';

function stubState(overrides: Partial<XenaKubeState> = {}): XenaKubeState {
  return {
    cosmology: 'mandala-cosmo',
    kGroup: 0,
    kPermutation: [0, 1, 2, 3, 4, 5, 6, 7],
    kVertices: [] as any,
    cGroup: 0,
    cQuat: [0, 0, 0, 1],
    cAssignments: [1, 2, 3, 4, 5, 6, 7, 8],
    cyclicPhase: 'beta',
    tetraIndex: 0,
    sieve: [],
    gyro: [0.2, 0.1, 0, 1],
    step: 1,
    activeVertex: 0,
    activeK: 0,
    trackedK: 0,
    activeDiagram: null,
    diagramPosition: null,
    snapElement: 0,
    snapQuat: [0, 0, 0, 1],
    gyroDeviation: 0,
    scrambleFactor: 0,
    turnRate: 0.5,
    regime: 'conversational',
    lastHalfTurn: false,
    expression: { tilt: 0.5, spin: 0, deviation: 0, scramble: 0 },
    lastTurnedFace: 'R',
    upFace: 'U',
    motion: { accelMag: 0, isStill: false, dwellMs: 0 },
    ...overrides,
  };
}

function stubVoice(overrides: Partial<VoiceOutput> = {}): VoiceOutput {
  return {
    face: 'R',
    halfTurn: false,
    active: [{
      vertexIndex: 1,
      complex: 3,
      params: { density: 4, intensity: 'mf', duration: 1.2 },
    }] as any,
    ...overrides,
  } as VoiceOutput;
}

describe('planMandalaStrikes', () => {
  beforeEach(() => resetStrikeIds());

  it('emits a gong on the first turn of each colotomic ring', () => {
    const s = stubState({ step: 1 });
    const strikes = planMandalaStrikes({ state: s, voice: stubVoice(), turnIndex: 1 });
    expect(strikes.some(x => x.instrumentClass === 'gong')).toBe(true);
  });

  it('emits NO gong mid-ring', () => {
    const s = stubState({ step: 3 });
    const strikes = planMandalaStrikes({ state: s, voice: stubVoice(), turnIndex: 3 });
    expect(strikes.some(x => x.instrumentClass === 'gong')).toBe(false);
  });

  it('emits gong every COLOTOMIC_RING_LEN turns', () => {
    const ringStarts = [1, 1 + COLOTOMIC_RING_LEN, 1 + 2 * COLOTOMIC_RING_LEN];
    for (const t of ringStarts) {
      const strikes = planMandalaStrikes({
        state: stubState({ step: t }),
        voice: stubVoice(),
        turnIndex: t,
      });
      expect(strikes.some(x => x.instrumentClass === 'gong'), `ring start at turn ${t}`).toBe(true);
    }
  });

  it('half-turn fires a kempul and no saron', () => {
    const strikes = planMandalaStrikes({
      state: stubState({ step: 3 }),
      voice: stubVoice({ halfTurn: true, face: 'R' }),
      turnIndex: 3,
    });
    expect(strikes.some(x => x.instrumentClass === 'kempul')).toBe(true);
    expect(strikes.some(x => x.instrumentClass === 'saron')).toBe(false);
  });

  it('non-half-turn fires a saron per voice', () => {
    const strikes = planMandalaStrikes({
      state: stubState({ step: 3 }),
      voice: stubVoice(),
      turnIndex: 3,
    });
    expect(strikes.some(x => x.instrumentClass === 'saron')).toBe(true);
  });

  it('C6/C7/C8 voices add a slenthem ground', () => {
    for (const complex of [6, 7, 8]) {
      const strikes = planMandalaStrikes({
        state: stubState({ step: 3 }),
        voice: stubVoice({
          active: [{
            vertexIndex: 1, complex,
            params: { density: 4, intensity: 'mf', duration: 1.2 },
          }] as any,
        }),
        turnIndex: 3,
      });
      expect(strikes.some(x => x.instrumentClass === 'slenthem'), `complex C${complex}`).toBe(true);
    }
  });

  it('low complexes (C1-C5) do not add slenthem', () => {
    for (const complex of [1, 2, 3, 4, 5]) {
      const strikes = planMandalaStrikes({
        state: stubState({ step: 3 }),
        voice: stubVoice({
          active: [{
            vertexIndex: 1, complex,
            params: { density: 4, intensity: 'mf', duration: 1.2 },
          }] as any,
        }),
        turnIndex: 3,
      });
      expect(strikes.some(x => x.instrumentClass === 'slenthem'), `complex C${complex}`).toBe(false);
    }
  });

  it('strike ids are unique within a batch', () => {
    const strikes = planMandalaStrikes({
      state: stubState({ step: 1 }),
      voice: stubVoice({
        active: [{
          vertexIndex: 1, complex: 6,
          params: { density: 4, intensity: 'mf', duration: 1.2 },
        }] as any,
      }),
      turnIndex: 1,
    });
    const ids = strikes.map(s => s.strikeId);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('SPHERE_INSTRUMENT_GLYPH defines every SphereInstrumentClass', () => {
    expect(Object.keys(SPHERE_INSTRUMENT_GLYPH).sort()).toEqual([
      'bonang', 'gong', 'kempul', 'kempul-ensemble',
      'kempyang', 'kethuk', 'saron', 'slenthem',
    ].sort());
  });
});
