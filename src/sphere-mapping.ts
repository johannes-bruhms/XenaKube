// ================================================================
// src/sphere-mapping.ts — sphere-engine instrument selection
//
// Pure helpers that turn engine state (cube vertex / quaternion / cycle
// position / dwell) into concrete gamelan sample selections. The selected
// sample's canonical name is what /xk/sphere/strike carries; Max
// xk_sphere.js looks it up in polybuffer~ and plays.
//
// Source of truth — Max never picks samples on its own. Sphere strikes
// are always engine-initiated and always reference a manifest entry.
// ================================================================

import { GAMELAN_SAMPLES, type GamelanSample } from './gamelan-manifest.js';

export type SphereInstrumentClass =
  | 'saron'        // pelog skeletal melody (balungan)
  | 'slenthem'     // low metallophone, pelog or slendro — sustained ground
  | 'bonang'       // figuration / kotekan, slendro, multi-octave
  | 'kempyang'     // slendro offbeat time-keeper
  | 'kethuk'       // slendro offbeat time-keeper
  | 'kempul'       // mid-cycle gong, pelog
  | 'kempul-ensemble' // alternative kempul recording set
  | 'gong';        // gong ageng — cycle boundary

/** Velocity buckets are kept in the same order as in build-gamelan-manifest.mjs.
 *  Higher = harder strike. ungainly literal because manifest velocity is opaque. */
export const VELOCITY_RANK: readonly string[] = [
  'softest', 'softer', 'soft',
  'medium', 'mediumalt',
  'harder', 'harderalt', 'hardest',
  'harddamped', 'hardringdamped', 'hardopen',
  'center', 'centeralt',
];

/** A planned sphere strike — emitted by mandala-cosmo, consumed by relay
 *  (which formats /xk/sphere/strike) and dashboard (mandala-canvas). */
export interface SphereStrike {
  /** Manifest-canonical sample name. */
  sample: string;
  /** Linear gain 0..1; engine maps velocity-bucket + intensity to this. */
  gain: number;
  /** Stereo pan −1..1; engine maps cube yaw to this. */
  pan: number;
  /** Whether to steal any currently-playing voice in the same instrument
   *  class (true for monophonic-by-class instruments like gong/kempul,
   *  false for polyphonic like bonang/saron during kotekan). */
  voiceSteal: boolean;
  /** Engine-issued monotonic id; matches /xk/sphere/echo planId for D75. */
  strikeId: number;
  /** Originating instrument class — used by dashboard glyph language and
   *  for echo audit grouping; redundant w/ sample but cheaper than re-parsing. */
  instrumentClass: SphereInstrumentClass;
}

// ── Selection helpers ────────────────────────────────────────────
//
// All helpers return undefined when no sample matches; callers must treat
// that as silent (no /xk/sphere/strike emitted) rather than fall back.
// Silent-failure surfaces are caught by the D80 glyph-counter invariant
// (visual goes blank when audio goes blank) — they signal a manifest gap.

interface PickOptions {
  /** Preferred mallet substring (e.g. "padded" picks "...paddedside" variants);
   *  if no match, helper falls through to any mallet. */
  malletPref?: string;
  /** Velocity bucket clamp [min, max] in VELOCITY_RANK indices. */
  velocityRange?: [number, number];
  /** Required articulation modifier (e.g. "open", "damped", "broken"). */
  modifier?: string;
}

function byCanonical(canonical: string): GamelanSample | undefined {
  return GAMELAN_SAMPLES.find(s => s.canonical === canonical);
}

/** Find every sample in an instrument family, optionally filtered. */
export function samplesIn(
  instrument: SphereInstrumentClass,
  filter: { tuning?: 'pelog' | 'slendro'; degree?: string } = {},
): GamelanSample[] {
  return GAMELAN_SAMPLES.filter(s => {
    if (s.instrument !== instrument) return false;
    if (filter.tuning && s.tuning !== filter.tuning) return false;
    if (filter.degree && s.degree !== filter.degree) return false;
    return true;
  });
}

function pickFiltered(
  candidates: GamelanSample[],
  opt: PickOptions,
): GamelanSample | undefined {
  let pool = candidates;
  if (opt.modifier) {
    pool = pool.filter(s => s.modifiers.includes(opt.modifier!));
    if (pool.length === 0) return undefined;
  }
  if (opt.malletPref) {
    const preferred = pool.filter(s => s.mallet.includes(opt.malletPref!));
    if (preferred.length > 0) pool = preferred;
  }
  if (opt.velocityRange) {
    const [lo, hi] = opt.velocityRange;
    const inRange = pool.filter(s => s.velocityBucket >= lo && s.velocityBucket <= hi);
    if (inRange.length > 0) pool = inRange;
  }
  if (pool.length === 0) return undefined;
  // Deterministic by canonical so identical inputs produce identical outputs;
  // randomness is the caller's job if it wants it.
  pool.sort((a, b) => a.canonical.localeCompare(b.canonical));
  return pool[0];
}

/** Gong ageng strike — for cycle-boundary markers. Picks center-struck
 *  samples; intensity 0..1 maps to softest..hardest. */
export function pickGongStrike(intensity: number): GamelanSample | undefined {
  const samples = samplesIn('gong');
  const vIdx = velocityFromIntensity(intensity, samples);
  return pickFiltered(samples, {
    modifier: 'center',
    velocityRange: [Math.max(0, vIdx - 1), vIdx + 1],
    malletPref: 'gongmallet',
  });
}

/** Kempul strike — mid-cycle gong, pelog, degree 5/6/7/1h. */
export function pickKempulStrike(degree: '5' | '6' | '7' | '1h', intensity: number): GamelanSample | undefined {
  const samples = samplesIn('kempul', { tuning: 'pelog', degree });
  const vIdx = velocityFromIntensity(intensity, samples);
  return pickFiltered(samples, {
    velocityRange: [Math.max(0, vIdx - 1), vIdx + 1],
  });
}

/** Saron pelog strike — balungan/skeletal-melody note. */
export function pickSaronStrike(degree: '1' | '2' | '3' | '4' | '5' | '6' | '7', intensity: number, opts: { malletPref?: 'pekingmallet' | 'saronmallet' } = {}): GamelanSample | undefined {
  const samples = samplesIn('saron', { tuning: 'pelog', degree });
  const vIdx = velocityFromIntensity(intensity, samples);
  return pickFiltered(samples, {
    velocityRange: [Math.max(0, vIdx - 1), vIdx + 1],
    malletPref: opts.malletPref,
  });
}

/** Slenthem strike — sustained low metallophone; padded mallet for the
 *  slow ground, wooden for clearer attack. */
export function pickSlenthemStrike(
  tuning: 'pelog' | 'slendro',
  degree: string,
  intensity: number,
  opts: { malletPref?: 'wooden' | 'padded' } = {},
): GamelanSample | undefined {
  const samples = samplesIn('slenthem', { tuning, degree });
  const vIdx = velocityFromIntensity(intensity, samples);
  return pickFiltered(samples, {
    velocityRange: [Math.max(0, vIdx - 1), vIdx + 1],
    malletPref: opts.malletPref,
  });
}

/** Bonang barung strike — figuration / kotekan; slendro. Modifier picks
 *  articulation (open / damped / ringdamped). */
export function pickBonangStrike(
  degree: string,
  intensity: number,
  articulation: 'open' | 'damped' | 'ringdamped' | null = null,
): GamelanSample | undefined {
  const samples = samplesIn('bonang', { tuning: 'slendro', degree });
  const vIdx = velocityFromIntensity(intensity, samples);
  // The pack encodes articulation inside the velocity label
  // ("harddamped", "hardringdamped", "hardopen"); use it as a velocity
  // filter rather than a modifier search.
  let filtered = samples;
  if (articulation) {
    const tag = articulation === 'open' ? 'hardopen' :
                articulation === 'damped' ? 'harddamped' : 'hardringdamped';
    const a = samples.filter(s => s.velocity === tag);
    if (a.length > 0) filtered = a;
  }
  return pickFiltered(filtered, {
    velocityRange: [Math.max(0, vIdx - 1), vIdx + 1],
  });
}

/** Map a 0..1 intensity to a velocity-bucket index, scoped to the
 *  buckets actually present in `samples`. */
function velocityFromIntensity(intensity: number, samples: GamelanSample[]): number {
  if (samples.length === 0) return 0;
  const buckets = Array.from(new Set(samples.map(s => s.velocityBucket).filter(v => v >= 0))).sort((a, b) => a - b);
  if (buckets.length === 0) return 0;
  const t = Math.max(0, Math.min(1, intensity));
  const idx = Math.min(buckets.length - 1, Math.floor(t * buckets.length));
  return buckets[idx];
}

/** Lookup-only — verify a manifest entry exists by canonical name. Used
 *  by mandala-cosmo when it constructs strikes from precomputed names. */
export function sampleExists(canonical: string): boolean {
  return byCanonical(canonical) !== undefined;
}
