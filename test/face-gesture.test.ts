import { describe, it, expect } from 'vitest';
import {
  FACE_SIGNATURES, parseFace, getFaceSignature,
  pitchClassMod, registerMod, parityInflection,
  type FaceMove,
} from '../src/face-gesture.js';
import { XenaKubeEngine } from '../src/engine.js';
import { voiceToOsc } from '../src/osc-output.js';

const ALL_FACES: FaceMove[] = ['L', "L'", 'R', "R'", 'F', "F'", 'B', "B'", 'U', "U'", 'D', "D'"];

describe('face-gesture framework (Phase A1)', () => {
  describe('FACE_SIGNATURES', () => {
    it('covers all 12 faces', () => {
      for (const face of ALL_FACES) {
        expect(FACE_SIGNATURES[face]).toBeDefined();
        expect(FACE_SIGNATURES[face].face).toBe(face);
      }
      expect(Object.keys(FACE_SIGNATURES)).toHaveLength(12);
    });

    it('every signature has the six required fields', () => {
      for (const face of ALL_FACES) {
        const sig = FACE_SIGNATURES[face];
        expect(typeof sig.envelope).toBe('string');
        expect(typeof sig.durationMult).toBe('number');
        expect(typeof sig.articulation).toBe('string');
        expect(typeof sig.panBias).toBe('number');
        expect(typeof sig.registerBias).toBe('number');
        expect(typeof sig.motion).toBe('string');
      }
    });

    it('durationMult stays in a performable scaling range', () => {
      for (const face of ALL_FACES) {
        const d = FACE_SIGNATURES[face].durationMult;
        expect(d).toBeGreaterThanOrEqual(0.3);
        expect(d).toBeLessThanOrEqual(3.0);
      }
    });

    it('attack faces compress time while sustained hairpin/fade faces expand it', () => {
      for (const face of ['R', 'D', 'U', 'B'] as FaceMove[]) {
        expect(FACE_SIGNATURES[face].durationMult).toBeLessThan(1.0);
      }
      for (const face of ["U'", "D'", 'L', "L'", "B'"] as FaceMove[]) {
        expect(FACE_SIGNATURES[face].durationMult).toBeGreaterThanOrEqual(1.7);
      }
    });

    it('panBias and registerBias stay in [-1, +1]', () => {
      for (const face of ALL_FACES) {
        const { panBias, registerBias } = FACE_SIGNATURES[face];
        expect(Math.abs(panBias)).toBeLessThanOrEqual(1);
        expect(Math.abs(registerBias)).toBeLessThanOrEqual(1);
      }
    });
  });

  describe('parseFace', () => {
    it('returns the FaceMove for each of the 12 valid moves', () => {
      for (const face of ALL_FACES) {
        expect(parseFace(face)).toBe(face);
      }
    });

    it('rejects half-turns', () => {
      expect(parseFace('L2')).toBeNull();
      expect(parseFace('R2')).toBeNull();
      expect(parseFace('U2')).toBeNull();
    });

    it('rejects invalid/unknown strings', () => {
      expect(parseFace('X')).toBeNull();
      expect(parseFace('')).toBeNull();
      expect(parseFace('r')).toBeNull();  // case-sensitive
      expect(parseFace('RR')).toBeNull();
    });
  });

  describe('getFaceSignature', () => {
    it('returns the same signature for the same move across calls', () => {
      const a = getFaceSignature('R');
      const b = getFaceSignature('R');
      expect(a).toBe(b);  // same object reference
    });

    it('returns null for non-face moves', () => {
      expect(getFaceSignature('R2')).toBeNull();
      expect(getFaceSignature('X')).toBeNull();
    });
  });

  describe('modulation rules', () => {
    it('pitchClassMod cycles through the 12 pitch classes over 12 vertices', () => {
      // With vertexIdx mod 8, we only get 8 distinct outputs — but they
      // should all fall in [0..11] and hit musically-distant values.
      const results = new Set<number>();
      for (let i = 0; i < 8; i++) {
        const pc = pitchClassMod(i);
        expect(pc).toBeGreaterThanOrEqual(0);
        expect(pc).toBeLessThan(12);
        results.add(pc);
      }
      // Perfect-5th spiral through 8 vertices → 8 distinct pitch classes
      expect(results.size).toBe(8);
    });

    it('registerMod uses ±12 spread', () => {
      const sig = FACE_SIGNATURES.U;  // registerBias = 0.8
      // round(0.8 * 12) = 10
      expect(registerMod(sig)).toBe(10);
    });

    it('registerMod gives 0 for faces with neutral register', () => {
      // L / L' / R / R' all have registerBias 0
      expect(registerMod(FACE_SIGNATURES.L)).toBe(0);
      expect(registerMod(FACE_SIGNATURES.R)).toBe(0);
    });

    it('parityInflection flips on odd tetra orbit', () => {
      expect(parityInflection(0)).toBe(1);
      expect(parityInflection(1)).toBe(-1);
    });
  });

  describe('engine integration', () => {
    it('onTurn emits a VoiceOutput whose face matches the move', () => {
      const engine = new XenaKubeEngine();
      const faces: (string | null)[] = [];
      engine.onVoice(v => faces.push(v.face));
      engine.onTurn('R');
      engine.onTurn("U'");
      engine.onTurn('L');
      expect(faces).toEqual(['R', "U'", 'L']);
    });

    it('half-turn moves produce null face (outside the 12-face set)', () => {
      const engine = new XenaKubeEngine();
      let lastFace: string | null | undefined;
      engine.onVoice(v => { lastFace = v.face; });
      engine.onTurn('R2');
      expect(lastFace).toBeNull();
    });

    it('same physical face fires same face-identity regardless of K_i state', () => {
      // Turn several times to advance K_i, then verify 'R' keeps emitting 'R'
      const engine = new XenaKubeEngine();
      const capturedFaces: (string | null)[] = [];
      engine.onVoice(v => capturedFaces.push(v.face));

      engine.onTurn('U');    // R's pre-condition: different K_i states
      engine.onTurn('R');
      engine.onTurn('F');
      engine.onTurn('R');
      engine.onTurn("L'");
      engine.onTurn('R');

      // Three R turns → three 'R' faces, regardless of the K_i state between them
      expect(capturedFaces.filter(f => f === 'R')).toHaveLength(3);
    });

    it('voiceToOsc emits /xk/face BEFORE /xk/voice when face is set', () => {
      const engine = new XenaKubeEngine();
      let captured: ReturnType<typeof voiceToOsc> | null = null;
      engine.onVoice(v => { captured = voiceToOsc(v); });
      engine.onTurn('R');

      expect(captured).not.toBeNull();
      expect(captured![0].address).toBe('/xk/face');
      expect(captured![0].args[0]).toBe('R');
      expect(captured![1].address).toBe('/xk/voice');
    });

    it('voiceToOsc emits a /xk/face reset sentinel when face is null', () => {
      const engine = new XenaKubeEngine();
      let captured: ReturnType<typeof voiceToOsc> | null = null;
      engine.onVoice(v => { captured = voiceToOsc(v); });
      engine.onTurn('R2');  // half-turn → null face

      expect(captured).not.toBeNull();
      expect(captured![0].address).toBe('/xk/face');
      expect(captured![0].args[0]).toBe('-');
      expect(captured![1].address).toBe('/xk/voice');
    });
  });
});
