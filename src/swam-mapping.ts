// === SWAM Mapping — shared constants + pure helpers ===
//
// This module owns every data table that was previously hand-duplicated
// between `max/xk_swam.js` and the TS engine. The Max side consumes it
// via the codegen'd `max/gen_includes.js` (`scripts/gen-max-include.js`),
// the TS side imports directly. One edit here, one re-run of `npm run
// gen:max`, both sides stay in sync.
//
// Helper functions here are *pure* — no `inst`, no `state`, no `outlet`.
// They take primitives in and return primitives / records out, which
// makes them trivially vitest-able. The Max-side wrappers in xk_swam.js
// (`faceShapedCount(inst, ...)`, etc.) adapt the instance record down to
// these signatures.

import { FACE_SIGNATURES, type FaceMove, type EnvelopeShape, type Articulation, type Motion } from './face-gesture.js';
import type { Path, ComplexType } from './types.js';

// ================================================================
// SWAM technique enums
// ================================================================

export const HARMONICS = { OFF: 0, OCT: 1, OCT_5TH: 2, CTRL: 3 } as const;
export type HarmonicsMode = typeof HARMONICS[keyof typeof HARMONICS];

export const TREMOLO = { OFF: 0, SLOW: 1, FAST: 2 } as const;
export type TremoloMode = typeof TREMOLO[keyof typeof TREMOLO];

export const BOW_POLY = {
  MONO_STRING_CROSSING: 0,
  MONO_POLY_RELEASE:    1,
  DOUBLE:               2,
  DOUBLE_HOLD:          3,
  AUTO:                 4,
} as const;
export type BowPolyMode = typeof BOW_POLY[keyof typeof BOW_POLY];

// ================================================================
// CC value centers — band midpoints for each selector CC
// ================================================================

export const HARMONICS_CC_VAL: Record<number, number> = {
  [HARMONICS.OFF]:     16,
  [HARMONICS.OCT]:     48,
  [HARMONICS.OCT_5TH]: 80,
  [HARMONICS.CTRL]:    112,
};

export const TREMOLO_CC_VAL: Record<number, number> = {
  [TREMOLO.OFF]:  21,
  [TREMOLO.SLOW]: 64,
  [TREMOLO.FAST]: 106,
};

export const BOW_POLY_CC_VAL: Record<number, number> = {
  [BOW_POLY.MONO_STRING_CROSSING]: 12,
  [BOW_POLY.MONO_POLY_RELEASE]:    38,
  [BOW_POLY.DOUBLE]:               64,
  [BOW_POLY.DOUBLE_HOLD]:          89,
  [BOW_POLY.AUTO]:                 115,
};

// ================================================================
// Intensity → CC / velocity / density / bow-mult map
// ================================================================

export interface IntensityEntry {
  /** CC 11 (Expression) peak target. */
  expr: number;
  /** Note-on velocity target. */
  vel: number;
  /** Bow Pressure scalar (pre-deviation modulation). */
  bowMult: number;
  /** Phrase note-count scalar. */
  density: number;
  /** CC 80 (Tremolo Min Speed) scalar (pre stochastic ramp). */
  tremRateMult: number;
}

export type IntensityLabel = 'p' | 'mp' | 'mf' | 'f' | 'ff' | 'fff';

export const INTENSITY_MAP: Record<IntensityLabel, IntensityEntry> = {
  p:   { expr:  20, vel:  35, bowMult: 0.70, density: 0.6, tremRateMult: 0.85 },
  mp:  { expr:  38, vel:  50, bowMult: 0.85, density: 0.8, tremRateMult: 0.92 },
  mf:  { expr:  55, vel:  68, bowMult: 1.00, density: 1.0, tremRateMult: 1.00 },
  f:   { expr:  75, vel:  85, bowMult: 1.15, density: 1.2, tremRateMult: 1.08 },
  ff:  { expr:  95, vel: 100, bowMult: 1.30, density: 1.4, tremRateMult: 1.15 },
  fff: { expr: 115, vel: 120, bowMult: 1.45, density: 1.7, tremRateMult: 1.22 },
};

export function intensityEntry(label: string): IntensityEntry {
  return INTENSITY_MAP[label as IntensityLabel] ?? INTENSITY_MAP.mf;
}

// ================================================================
// Envelope profiles — shape per-note envelope + per-phrase contour
// ================================================================

export type VelCurve = 'flat' | 'cresc' | 'dim' | 'accent-first';

export interface EnvProfile {
  /** CC 11 peak multiplier (note envelope scales). */
  peakMult: number;
  /** Note attack ramp multiplier. */
  attackMult: number;
  /** Release ramp multiplier. */
  releaseMult: number;

  /** `cmx.exprEnv.attack`  scale (CC 11 onset coefficient). */
  attackCoef: number;
  /** `cmx.exprEnv.peak`    scale. */
  peakCoef: number;
  /** `cmx.exprEnv.sustain` scale. */
  sustainCoef: number;

  /** Multiplier on phrase note count. 1.0 = as-computed. */
  countMult: number;
  /** Collapse phrase to a single note (pluck/stab/drone). */
  isSingle: boolean;
  /** Extend scheduleRelease so the note rings past `dur`. */
  isDrone: boolean;
  /** Per-step velocity shape across a multi-note phrase. */
  velCurve: VelCurve;
}

export const ENV_PROFILE: Record<EnvelopeShape, EnvProfile> = {
  pluck: { peakMult: 1.00, attackMult: 0.30, releaseMult: 0.7,
           attackCoef: 1.20, peakCoef: 0.90, sustainCoef: 0.20,
           countMult: 1.0, isSingle: true,  isDrone: false, velCurve: 'flat' },
  stab:  { peakMult: 1.15, attackMult: 0.15, releaseMult: 0.6,
           attackCoef: 1.40, peakCoef: 1.00, sustainCoef: 0.25,
           countMult: 1.0, isSingle: true,  isDrone: false, velCurve: 'accent-first' },
  swell: { peakMult: 0.90, attackMult: 2.00, releaseMult: 1.3,
           attackCoef: 0.40, peakCoef: 0.95, sustainCoef: 1.00,
           countMult: 1.0, isSingle: false, isDrone: false, velCurve: 'cresc' },
  drone: { peakMult: 0.80, attackMult: 1.50, releaseMult: 1.5,
           attackCoef: 0.60, peakCoef: 0.85, sustainCoef: 1.00,
           countMult: 1.0, isSingle: true,  isDrone: true,  velCurve: 'flat' },
  fade:  { peakMult: 1.00, attackMult: 1.00, releaseMult: 2.2,
           attackCoef: 1.20, peakCoef: 1.00, sustainCoef: 0.25,
           countMult: 1.0, isSingle: false, isDrone: false, velCurve: 'dim' },
  burst: { peakMult: 1.10, attackMult: 0.25, releaseMult: 0.5,
           attackCoef: 1.20, peakCoef: 1.00, sustainCoef: 0.85,
           countMult: 1.8, isSingle: false, isDrone: false, velCurve: 'accent-first' },
};

// ================================================================
// Articulation → note-off velocity
// ================================================================

export const ART_OFF_VEL: Record<Articulation, number> = {
  attack:    110,
  sustained:  45,
  release:    30,
  iterative:  95,
};

// ================================================================
// Motion → semitone nudge (oscillate flips per-turn in Max)
// ================================================================

export const MOTION_NUDGE: Record<Motion, number> = {
  static:     0,
  up:         2,
  down:      -2,
  oscillate:  0,
};

// ================================================================
// Face signature — Max-side shape (durationBias, registerBias,
// envelope name, articulation name, motion name). Generated from
// FACE_SIGNATURES by `buildFaceMap()` for codegen.
// ================================================================

export interface FaceMapEntry {
  durationBias: number;
  registerBias: number;
  envelope:     EnvelopeShape;
  articulation: Articulation;
  motion:       Motion;
}

export function buildFaceMap(): Record<FaceMove, FaceMapEntry> {
  const out = {} as Record<FaceMove, FaceMapEntry>;
  for (const [face, sig] of Object.entries(FACE_SIGNATURES)) {
    out[face as FaceMove] = {
      durationBias: sig.durationBias,
      registerBias: sig.registerBias,
      envelope:     sig.envelope,
      articulation: sig.articulation,
      motion:       sig.motion,
    };
  }
  return out;
}

// ================================================================
// Gliss complexes (legato with portamento bed)
// ================================================================

export const LEGATO_COMPLEX: Record<number, boolean> = {
  2: true,
  3: true,
  5: true,
  6: true,
  7: true,
};

// ================================================================
// Regime → ramp multipliers
// ================================================================

export const REGIME_ATTACK_MULT    = { contemplative: 1.2, conversational: 1.0, burst: 0.5 } as const;
export const REGIME_EXPR_RAMP_MULT = { contemplative: 1.5, conversational: 1.0, burst: 0.4 } as const;

// ================================================================
// PURE HELPERS — tested in swam-mapping.test.ts, mirrored in xk_swam.js
// ================================================================

/** Clamp `x` into `[lo, hi]`. */
export function clamp(x: number, lo: number, hi: number): number {
  return x < lo ? lo : x > hi ? hi : x;
}

/**
 * C4 harmonic rotation by (path, tetra parity). Four (path × parity)
 * combos map to three harmonic modes so C4 audibly mutates across the
 * S4 / path axes without ever landing on OFF.
 *
 *   V1 + even → OCT
 *   V1 + odd  → OCT_5TH
 *   V2 + even → OCT_5TH
 *   V2 + odd  → CTRL
 */
export function harmonicsForC4(path: Path, tetra: 0 | 1): HarmonicsMode {
  if (path === 'V1') return tetra === 1 ? HARMONICS.OCT_5TH : HARMONICS.OCT;
  return tetra === 1 ? HARMONICS.CTRL : HARMONICS.OCT_5TH;
}

/**
 * Randint in `[lo, hi]` inclusive. Accepts an optional RNG so tests can
 * inject a deterministic source; default is Math.random.
 */
export function rrand(lo: number, hi: number, rng: () => number = Math.random): number {
  return Math.floor(rng() * (hi - lo + 1)) + lo;
}

/**
 * Phrase-count bounds derived from intensity + density. Returns a
 * {lo, hi} range; callers roll within it. Pure + deterministic —
 * pulls `rrand` out to the wrapper so this can be unit-tested without
 * an RNG.
 */
export function phraseCountBounds(
  intensityLabel: string,
  density: number,
  baseLo: number,
  baseHi: number,
): { lo: number; hi: number } {
  const iMult = intensityEntry(intensityLabel).density;
  const dMult = clamp(0.6 + density * 0.25, 0.6, 1.8);
  const lo = Math.max(1, Math.round(baseLo * iMult));
  const hi = Math.max(lo, Math.round(baseHi * iMult * dMult));
  return { lo, hi };
}

/**
 * Apply face envelope's isSingle / countMult overrides to a raw phrase
 * count. `forGliss` (C5–C7) routes isSingle → 0 so the anchor note
 * still fires once and the gliss-salvo collapses to zero.
 */
export function applyEnvelopeCount(
  profile: EnvProfile | null,
  rawCount: number,
  baseLo: number,
  forGliss: boolean,
): number {
  if (profile && profile.isSingle) return forGliss ? 0 : 1;
  if (profile && profile.countMult && profile.countMult !== 1.0) {
    return clamp(Math.round(rawCount * profile.countMult), baseLo, 12);
  }
  return rawCount;
}

/**
 * Per-step velocity scalar across a multi-note phrase.
 *   `cresc`        0.72 → 1.27 (swell)
 *   `dim`          1.27 → 0.72 (fade)
 *   `accent-first` 1.22 on step 0, 0.88 thereafter (stab / burst)
 *   `flat`         1.0 always
 * Always 1.0 for `count <= 1`.
 */
export function stepVelScale(velCurve: VelCurve, i: number, count: number): number {
  if (count <= 1) return 1.0;
  const t = i / (count - 1);
  switch (velCurve) {
    case 'cresc':        return 0.72 + 0.55 * t;
    case 'dim':          return 1.27 - 0.55 * t;
    case 'accent-first': return i === 0 ? 1.22 : 0.88;
    default:             return 1.0;
  }
}

/**
 * Face-motion-committed sieve walker — used by C2 / C6 to stop
 * mid-phrase direction flips at boundaries. Pure over (sieveLen,
 * sieveIdx, sieveDir, count, motion) → next {idx, dir}. Returned
 * values are applied to the mutable state in Max.
 */
export function commitSieveWalk(
  sieveLen: number,
  sieveIdx: number,
  sieveDir: 1 | -1,
  count: number,
  motion: Motion | null,
): { idx: number; dir: 1 | -1 } {
  if (sieveLen === 0) return { idx: sieveIdx, dir: sieveDir };

  if (motion === 'up') {
    const idx = sieveIdx + count - 1 >= sieveLen ? 0 : sieveIdx;
    return { idx, dir: 1 };
  }
  if (motion === 'down') {
    const idx = sieveIdx - (count - 1) < 0 ? sieveLen - 1 : sieveIdx;
    return { idx, dir: -1 };
  }
  // auto-flip at boundary
  if (sieveDir > 0 && sieveIdx + count - 1 >= sieveLen) {
    return { idx: sieveLen - 1, dir: -1 };
  }
  if (sieveDir < 0 && sieveIdx - (count - 1) < 0) {
    return { idx: 0, dir: 1 };
  }
  return { idx: sieveIdx, dir: sieveDir };
}

/** Face-motion nudge including oscillate's per-turn flip. */
export function faceTranspose(
  registerBias: number,
  motion: Motion,
  path: Path,
  turnCount: number,
): number {
  const spread = path === 'V2' ? 6 : 12;
  let nudge = MOTION_NUDGE[motion] ?? 0;
  if (motion === 'oscillate') nudge = turnCount % 2 === 0 ? 2 : -2;
  return Math.round(registerBias * spread) + nudge;
}

// ================================================================
// Re-export so importers have one place for everything
// ================================================================

export { FACE_SIGNATURES, type FaceMove, type EnvelopeShape, type Articulation, type Motion };
export type { ComplexType };
