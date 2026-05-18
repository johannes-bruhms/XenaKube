// ================================================================
// src/gamelan-tuning.ts — RBI Berlin Javanese Gamelan tunings (cents)
//
// Hand-transcribed from the Scala files shipped with the Latent
// Sonorities pack (Khyam Allami + Counterpoint, analysed via Leimma):
//
//   max/media/gamelan/Latent-Sonorities-Tuning-Files-in-Scala/Latent
//   Sonorities Tuning Files in Scala/Scala/*.scl
//
// Each scale gives cent offsets from the local "1" plus its absolute
// reference pitch in Hz so a synth bank (or modal resonator) can voice
// the same partials the physical instruments produce. The samples
// themselves are played at native rate inside Max — these tables are
// for documentation, for cross-engine modal coupling (deferred), and
// for the D78 alignment invariant (Max bang() logs the hash; user
// verifies it matches GAMELAN_TUNING_HASH).
//
// Source-of-truth — never duplicate cents arrays elsewhere; import.
// ================================================================

/** FNV-1a 64-bit (BigInt) → 16-hex string. Pure JS so this file has no
 *  Node-only deps; matches the SHA-truncation pattern shape (16 hex chars)
 *  the rest of the codegen uses, even though the algorithm is weaker. */
function fnv1a64(s: string): string {
  const FNV_OFFSET = 0xcbf29ce484222325n;
  const FNV_PRIME = 0x100000001b3n;
  const MASK = 0xffffffffffffffffn;
  let h = FNV_OFFSET;
  for (let i = 0; i < s.length; i++) {
    h ^= BigInt(s.charCodeAt(i));
    h = (h * FNV_PRIME) & MASK;
  }
  return h.toString(16).padStart(16, '0');
}

/** A single scale: ascending cent offsets from local 1, plus closing 1200¢
 *  (or octave equivalent for the multi-octave bonang barung). */
export interface ScalaScale {
  /** Stable id used by sphere-mapping. */
  id: string;
  /** Tuning family. */
  family: 'pelog' | 'slendro';
  /** Instrument family this measurement was taken from. */
  instrument: 'saron' | 'slenthem' | 'bonang' | 'kempul';
  /** Reference pitch in Hz at the scale's local "C" (Leimma convention). */
  refHz: number;
  /** Reference MIDI note Leimma anchored the .scl C to (typically C3..C5). */
  refMidi: number;
  /** Cent offsets in ascending order; first = 0 (local 1), last = octave for
   *  pelog/slendro single-octave scales; multi-octave scales (bonang) extend
   *  past 1200¢. */
  cents: readonly number[];
}

/** Saron pelog — 7 degrees + octave. Source: rbi_berlin_javanese_gamelan_saron_pelog.scl */
export const SARON_PELOG: ScalaScale = {
  id: 'saron-pelog',
  family: 'pelog',
  instrument: 'saron',
  refHz: 596.900042737457,
  refMidi: 72, // C5 in 12-TET; here C5 = 596.9 Hz (~228¢ sharp of A=440)
  cents: [0, 123, 271, 532, 675, 778, 951, 1200],
};

/** Slenthem pelog — 7 degrees + octave. */
export const SLENTHEM_PELOG: ScalaScale = {
  id: 'slenthem-pelog',
  family: 'pelog',
  instrument: 'slenthem',
  refHz: 148.4,
  refMidi: 48, // C3
  cents: [0, 166, 279, 549, 695, 809, 996, 1200],
};

/** Slenthem slendro — 5 degrees + octave. */
export const SLENTHEM_SLENDRO: ScalaScale = {
  id: 'slenthem-slendro',
  family: 'slendro',
  instrument: 'slenthem',
  refHz: 135.39999544851835,
  refMidi: 48, // C3
  cents: [0, 232, 464, 706, 958, 1200],
};

/** Bonang barung slendro — 2 octaves expressed as one continuous 9-step
 *  scale (the physical instrument's pot layout). */
export const BONANG_SLENDRO: ScalaScale = {
  id: 'bonang-slendro',
  family: 'slendro',
  instrument: 'bonang',
  refHz: 268.69994457219525,
  refMidi: 60, // C4
  cents: [0, 293, 521, 732, 992, 1228.6, 1436.6, 1898.6, 2592.6, 3511.6],
};

/** Kempul pelog — 4 high gong degrees (5, 6, 7, 1h) + octave. */
export const KEMPUL_PELOG: ScalaScale = {
  id: 'kempul-pelog',
  family: 'pelog',
  instrument: 'kempul',
  refHz: 292.30007319634547,
  refMidi: 60, // C4
  cents: [0, 719, 829, 991, 1200],
};

export const ALL_SCALES: readonly ScalaScale[] = [
  SARON_PELOG, SLENTHEM_PELOG, SLENTHEM_SLENDRO, BONANG_SLENDRO, KEMPUL_PELOG,
];

/** 16-hex digest over (id, refHz, refMidi, cents) for the D78 alignment
 *  invariant. Max xk_sphere.js bang() logs this; mismatch with the codegen'd
 *  GAMELAN_TUNING_HASH in max/gen_sphere_includes.js flags a Scala edit that
 *  wasn't propagated through `npm run gen:max`. Stable across runs. */
export const GAMELAN_TUNING_HASH = fnv1a64(
  ALL_SCALES.map(s => `${s.id}:${s.refHz}:${s.refMidi}:${s.cents.join(',')}`).join('\n'),
);

/** Convert a (scale, degreeIndex) pair to absolute Hz. degreeIndex is
 *  0-based into `cents` (so degreeIndex=0 sounds at refHz; degreeIndex=cents.length-1
 *  sounds at refHz * 2^(cents[-1]/1200)). */
export function degreeHz(scale: ScalaScale, degreeIndex: number): number {
  const c = scale.cents[degreeIndex];
  if (c === undefined) throw new RangeError(`degree ${degreeIndex} out of range for ${scale.id}`);
  return scale.refHz * Math.pow(2, c / 1200);
}

/** Convert (scale, degreeIndex) to a nearest-12-TET MIDI note + cent deviation.
 *  Useful when bridging to a 12-TET sampler that takes pitchbend. */
export function degreeMidi(scale: ScalaScale, degreeIndex: number): { midi: number; cents: number } {
  const hz = degreeHz(scale, degreeIndex);
  const midiFloat = 69 + 12 * Math.log2(hz / 440);
  const midi = Math.round(midiFloat);
  const cents = (midiFloat - midi) * 100;
  return { midi, cents };
}
