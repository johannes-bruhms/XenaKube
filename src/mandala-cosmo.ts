// ================================================================
// src/mandala-cosmo.ts — mandala-cosmo sphere-strike scheduler
//
// Pure functions only — no internal state. Engine calls these on every
// /xk/voice transition (and on half-turn / solve) when cosmology is
// 'mandala-cosmo'. Returned strikes get formatted into /xk/sphere/strike
// by osc-output.ts.
//
// Design rules (from the audit pass):
//
//   1. Body engine (SWAM) keeps firing per-turn — mandala-cosmo never
//      changes voice dispatch timing or the bridge invariants.
//
//   2. Sphere strikes are PURELY ADDITIVE. They share no voice slot
//      with /xk/voice, never gate it, never delay it. Removing them
//      must leave SWAM behavior unchanged byte-for-byte.
//
//   3. The "mandala feel" comes from sphere strikes structurally
//      shaping the cycle (gong at ring boundaries, kempul on half-
//      turns, saron skeletal melody on K transitions). NOT from
//      breath-paced delay logic (deferred to a later phase).
//
//   4. Cycle structure: every COLOTOMIC_RING_LEN-th /xk/voice (turn
//      counter modulo) is a "ring boundary" and gets a gong. Roughly
//      4–8 turns per ring; tunable.
// ================================================================

import type { XenaKubeState } from './types.js';
import type { VoiceOutput } from './voice-engine.js';
import {
  pickGongStrike, pickKempulStrike, pickSaronStrike,
  pickSlenthemStrike, pickBonangStrike,
  type SphereStrike, type SphereInstrumentClass,
} from './sphere-mapping.js';

/** Turns per gong cycle. Tunable — Javanese practice uses anything
 *  from 8 to 256 beats; this is shorter for live-cube ergonomics. */
export const COLOTOMIC_RING_LEN = 8;

/** Dwell time (ms) after which the sphere engine begins bonang figuration.
 *  Below this the cube is "active" and figuration is silent (gives quiet
 *  space for the soloist). */
export const DWELL_FIGURATION_MS = 2200;

/** Map a 1..8 vertex index to a saron degree (1..7 pelog). Vertex 8
 *  wraps back to degree 1 — gives every K_i corner a melodic note. */
function vertexToSaronDegree(vertexIndex: number): '1' | '2' | '3' | '4' | '5' | '6' | '7' {
  const m = ((vertexIndex - 1) % 7) + 1;
  return String(m) as '1' | '2' | '3' | '4' | '5' | '6' | '7';
}

/** Kempul degree from face — three pelog degrees (5/6/7/1h) plus a
 *  one-of-four assignment by face axis. Half-turns picked at face level
 *  upstream; this just chooses the pitch. */
function faceToKempulDegree(face: string | null): '5' | '6' | '7' | '1h' {
  // F/B axis = 5; R/L axis = 6; U/D axis = 7; absent = 1h (high closer).
  if (!face) return '1h';
  const c = face[0];
  if (c === 'F' || c === 'B') return '5';
  if (c === 'R' || c === 'L') return '6';
  if (c === 'U' || c === 'D') return '7';
  return '1h';
}

/** Quaternion yaw → stereo pan in [-1, 1]. Mandala-cosmo's only spatial
 *  cue until full ambisonic lands. */
function panFromGyro(state: XenaKubeState): number {
  // Use x component of normalized gyro as a stand-in for yaw — engine
  // emits quaternion as [x, y, z, w]. Cheap and bounded.
  const [x] = state.gyro;
  return Math.max(-1, Math.min(1, x));
}

/** Intensity label → 0..1 gain for sphere strikes. Decoupled from
 *  SWAM's INTENSITY_MAP so we can tune sphere dynamics independently. */
function intensityToGain(intensity: string): number {
  const t: Record<string, number> = {
    ppp: 0.15, pp: 0.22, p: 0.32, mp: 0.45, mf: 0.6, f: 0.75, ff: 0.88, fff: 1.0,
  };
  return t[intensity] ?? 0.5;
}

let strikeIdCounter = 0;
/** Monotonic strike id for echo-audit pairing. Reset only on relay restart;
 *  rolling 32-bit is safe for any reasonable session length. */
export function nextStrikeId(): number {
  strikeIdCounter = (strikeIdCounter + 1) >>> 0;
  return strikeIdCounter;
}

/** Reset the strike-id counter — used by relay on cosmology switch or panic
 *  so the auditor doesn't carry stale ids. */
export function resetStrikeIds(): void {
  strikeIdCounter = 0;
}

export interface MandalaContext {
  /** Engine state at the moment of dispatch. */
  state: XenaKubeState;
  /** Voice that just fired (from engine.onVoice). */
  voice: VoiceOutput;
  /** Cumulative turn counter — equal to state.step at the moment of
   *  /xk/voice (state.step is incremented before listeners fire). */
  turnIndex: number;
}

/** Plan all sphere strikes for one cube turn in mandala-cosmo. Order
 *  matters for layering: gong → kempul → saron → slenthem. Returns
 *  empty when no strikes are appropriate (e.g. half-turn with no
 *  active voice). */
export function planMandalaStrikes(ctx: MandalaContext): SphereStrike[] {
  const strikes: SphereStrike[] = [];
  const { state, voice, turnIndex } = ctx;

  // 1. Ring-boundary gong — every COLOTOMIC_RING_LEN-th turn, including
  // turn 1 (which acts as cycle opening). Intensity follows turn-rate
  // regime: contemplative = soft gong, burst = loud.
  if (turnIndex % COLOTOMIC_RING_LEN === 1) {
    const gongIntensity = state.regime === 'burst' ? 0.85
      : state.regime === 'conversational' ? 0.6 : 0.4;
    const gong = pickGongStrike(gongIntensity);
    if (gong) {
      strikes.push({
        sample: gong.canonical,
        gain: gongIntensity,
        pan: 0, // gong is center
        voiceSteal: true, // only one gong at a time
        strikeId: nextStrikeId(),
        instrumentClass: 'gong',
      });
    }
  }

  // 2. Half-turn → kempul punctuation (replaces the SWAM fff dyad's
  // sphere companion; SWAM dyad still fires unchanged).
  if (voice.halfTurn) {
    const kempulDegree = faceToKempulDegree(voice.face);
    const kempul = pickKempulStrike(kempulDegree, 0.85);
    if (kempul) {
      strikes.push({
        sample: kempul.canonical,
        gain: 0.85,
        pan: panFromGyro(state) * 0.5,
        voiceSteal: true,
        strikeId: nextStrikeId(),
        instrumentClass: 'kempul',
      });
    }
    // No saron on half-turns — the kempul carries the gesture.
    return strikes;
  }

  // 3. Per-voice saron note — skeletal melody from the active vertex.
  const activeEvent = voice.active[0]; // sequential mode: one event.
  if (activeEvent) {
    const degree = vertexToSaronDegree(activeEvent.vertexIndex);
    const intensity = activeEvent.params.intensity;
    const gain = intensityToGain(intensity);
    // Mallet choice: regime-driven. Burst → wooden (peking, bright);
    // contemplative → softer saron mallet.
    const malletPref = state.regime === 'burst' ? 'pekingmallet' : 'saronmallet';
    const saron = pickSaronStrike(degree, gain, { malletPref });
    if (saron) {
      strikes.push({
        sample: saron.canonical,
        gain,
        pan: panFromGyro(state),
        voiceSteal: false, // saron can overlap (kotekan-like)
        strikeId: nextStrikeId(),
        instrumentClass: 'saron',
      });
    }

    // 4. Sustained slenthem ground on lower complexes (C6/C7/C8 — the
    // halo / wild / atom categories that already hold long in SWAM).
    if (activeEvent.complex >= 6) {
      const slenDegree = vertexToSaronDegree(activeEvent.vertexIndex); // share saron degree
      const slen = pickSlenthemStrike('pelog', slenDegree, gain * 0.7, { malletPref: 'padded' });
      if (slen) {
        strikes.push({
          sample: slen.canonical,
          gain: gain * 0.55, // slenthem sits below saron in the mix
          pan: -panFromGyro(state) * 0.3, // counter-pan for stereo spread
          voiceSteal: true, // slenthem ground is monophonic by class
          strikeId: nextStrikeId(),
          instrumentClass: 'slenthem',
        });
      }
    }
  }

  return strikes;
}

/** Optional bonang figuration during long dwells. Currently a no-op
 *  stub — wires the API surface for a later phase (kotekan patterns
 *  triggered by sustained stillness). Returns empty array. */
export function planDwellFiguration(_ctx: MandalaContext): SphereStrike[] {
  return [];
}

/** Per-instrument-class glyph language for the dashboard mandala canvas.
 *  Single source of truth so dashboard renderer doesn't drift. */
export const SPHERE_INSTRUMENT_GLYPH: Readonly<Record<SphereInstrumentClass, {
  shape: 'bindu' | 'circle' | 'wedge' | 'petal' | 'flame' | 'dot' | 'spiral' | 'ring';
  baseRadius: number;
  baseColor: string;
}>> = {
  gong:              { shape: 'bindu',  baseRadius: 1.00, baseColor: '#d4a017' },
  kempul:            { shape: 'ring',   baseRadius: 0.78, baseColor: '#b87333' },
  'kempul-ensemble': { shape: 'ring',   baseRadius: 0.74, baseColor: '#a8642b' },
  saron:             { shape: 'petal',  baseRadius: 0.55, baseColor: '#cda434' },
  slenthem:          { shape: 'flame',  baseRadius: 0.40, baseColor: '#8a5a44' },
  bonang:            { shape: 'circle', baseRadius: 0.30, baseColor: '#e8c46c' },
  kempyang:          { shape: 'dot',    baseRadius: 0.18, baseColor: '#7a6a3c' },
  kethuk:            { shape: 'dot',    baseRadius: 0.18, baseColor: '#5e4f2e' },
};
