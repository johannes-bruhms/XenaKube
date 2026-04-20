// === Face-Identity Gesture Framework (Phase A1) ===
//
// Each of the 12 face-moves (L L' R R' F F' B B' U U' D D') owns a
// distinct gesture TYPE, fixed to the GAN cube's color-fixed face
// identity. K_i / C_i / path / tetra then MODULATE the content inside
// that shape rather than selecting the shape.
//
// Performer's forward model: the *kind* of sound a turn will produce
// is predictable from the face alone. The *detail* still evolves with
// engine state — so the instrument stays compositional, not mechanical.
//
// First-draft signatures below are intentionally simple so they read on
// one hearing. Sculpt-and-polish comes after the framework is audible.

import type { Path } from './types.js';

/** The 12 face-moves that own a gesture identity. Half-turns (L2 etc.)
 *  aren't in the set — GAN hardware only reports quarter-turns, and the
 *  CCW-half convention (see CLAUDE.md) decomposes them into two 90° clicks. */
export type FaceMove = 'L' | "L'" | 'R' | "R'" | 'F' | "F'" | 'B' | "B'" | 'U' | "U'" | 'D' | "D'";

/** Gesture envelope archetype — the overall amplitude shape. */
export type EnvelopeShape = 'pluck' | 'swell' | 'stab' | 'drone' | 'fade' | 'burst';

/** Articulation emphasis — where in time the gesture's energy lives. */
export type Articulation = 'attack' | 'sustained' | 'release' | 'iterative';

/** Pitch motion within the gesture. */
export type Motion = 'static' | 'up' | 'down' | 'oscillate';

/** Per-face gesture signature — 6 scalar/categorical fields. */
export interface FaceSignature {
  face: FaceMove;
  /** Amplitude envelope archetype. */
  envelope: EnvelopeShape;
  /** Multiplier on the voice's base `duration`. 1.0 = as-given. */
  durationBias: number;
  /** Where the gesture's energy sits in time. */
  articulation: Articulation;
  /** Stereo bias [-1..+1]. Reserved for future stereo routing; SWAM is mono. */
  panBias: number;
  /** Register shift [-1..+1] → up to ±12 semitones. */
  registerBias: number;
  /** Pitch motion archetype. */
  motion: Motion;
}

/**
 * The 12 first-draft face signatures.
 *
 * Organising intuition:
 *   • U / U'  — bright, treble; up gets a pluck, up' fades from high
 *   • D / D'  — dark, bass;    down stabs, down' drones
 *   • L / L'  — left-panned legato; unprimed swells up, primed fades down
 *   • R / R'  — right-panned percussive; unprimed a stab, primed a burst
 *   • F / F'  — forward swells; unprimed ascending, primed descending
 *   • B / B'  — retreating; unprimed a short back-pluck, primed a slow drone
 *
 * Every primed/unprimed pair keeps a family resemblance (same pan / register
 * axis) but differs in articulation and motion, so the 12 are pairwise
 * distinguishable by ear while the 6 face-pairs still feel related.
 */
export const FACE_SIGNATURES: Record<FaceMove, FaceSignature> = {
  'U':  { face: 'U',  envelope: 'pluck', durationBias: 0.7, articulation: 'attack',    panBias:  0.0, registerBias:  0.8, motion: 'up' },
  "U'": { face: "U'", envelope: 'fade',  durationBias: 1.4, articulation: 'release',   panBias:  0.0, registerBias:  0.8, motion: 'down' },
  'D':  { face: 'D',  envelope: 'stab',  durationBias: 0.6, articulation: 'attack',    panBias:  0.0, registerBias: -0.8, motion: 'down' },
  "D'": { face: "D'", envelope: 'drone', durationBias: 1.8, articulation: 'sustained', panBias:  0.0, registerBias: -0.8, motion: 'static' },
  'L':  { face: 'L',  envelope: 'swell', durationBias: 1.3, articulation: 'sustained', panBias: -0.7, registerBias:  0.0, motion: 'up' },
  "L'": { face: "L'", envelope: 'fade',  durationBias: 1.3, articulation: 'release',   panBias: -0.7, registerBias:  0.0, motion: 'down' },
  'R':  { face: 'R',  envelope: 'stab',  durationBias: 0.5, articulation: 'attack',    panBias:  0.7, registerBias:  0.0, motion: 'static' },
  "R'": { face: "R'", envelope: 'burst', durationBias: 0.6, articulation: 'iterative', panBias:  0.7, registerBias:  0.0, motion: 'oscillate' },
  'F':  { face: 'F',  envelope: 'swell', durationBias: 1.2, articulation: 'sustained', panBias:  0.0, registerBias:  0.3, motion: 'up' },
  "F'": { face: "F'", envelope: 'swell', durationBias: 1.2, articulation: 'sustained', panBias:  0.0, registerBias:  0.3, motion: 'down' },
  'B':  { face: 'B',  envelope: 'pluck', durationBias: 0.9, articulation: 'attack',    panBias:  0.0, registerBias: -0.3, motion: 'static' },
  "B'": { face: "B'", envelope: 'drone', durationBias: 1.6, articulation: 'sustained', panBias:  0.0, registerBias: -0.3, motion: 'oscillate' },
};

/** Strict parse: returns the FaceMove if `move` is one of the 12, else null.
 *  Half-turns (`L2` / `R2` / …) return null — they're not part of the
 *  face-identity set. */
export function parseFace(move: string): FaceMove | null {
  return (move in FACE_SIGNATURES) ? (move as FaceMove) : null;
}

/** Convenience: signature for a move string, or null for non-face moves. */
export function getFaceSignature(move: string): FaceSignature | null {
  const face = parseFace(move);
  return face === null ? null : FACE_SIGNATURES[face];
}

// ================================================================
// MODULATION RULES
//
// K_i / C_i / path / tetra shape the CONTENT rendered inside the face's
// gesture-type. Each rule is a one-liner so a performer can run it in
// their head between turns.
//
//   K_i vertex  → pitch-class offset (via perfect-5th spiral through 12)
//   path        → intensity scalar    (V2 softens by 0.7)
//   signature   → register modifier   (registerBias × 12 semis, halved on V2)
//   tetra orbit → parity flip         (odd orbits invert the motion field)
//
// C_i (ComplexType) is already a "timbre modifier" via the existing
// phraseC1..phraseC8 dispatch in max/xk_swam.js — documented there, not
// duplicated here.
// ================================================================

/**
 * K_i vertex index → semitone offset within one octave.
 * `(vertexIdx * 7) mod 12` walks a perfect-5th spiral across pitch classes,
 * so consecutive vertices land in musically distant places — the same face
 * audibly re-pitches across K-turns without tracing a scale.
 */
export function pitchClassMod(vertexIdx: number): number {
  return ((vertexIdx % 8) * 7) % 12;
}

/**
 * Face's registerBias [-1..+1] → semitone shift.
 * V2 halves the spread (±6) because V2 is the sustained palette — range
 * would compete with duration. V1 gets the full ±12.
 */
export function registerMod(path: Path, sig: FaceSignature): number {
  const spread = path === 'V2' ? 6 : 12;
  return Math.round(sig.registerBias * spread);
}

/** Path V1 = 1.0 (full), V2 = 0.7 (softer palette). Matches SWAM bridge convention. */
export function intensityScalar(path: Path): number {
  return path === 'V2' ? 0.7 : 1.0;
}

/**
 * Tetra orbit parity → motion direction multiplier.
 *   0 (even, preserves tetrahedra) → +1 (motion as written)
 *   1 (odd, swaps tetrahedra)      → -1 (up ↔ down, ascending ↔ descending)
 * Makes the tetra axis audible as an inversion of the face's built-in motion.
 */
export function parityInflection(tetraIdx: number): number {
  return tetraIdx === 1 ? -1 : 1;
}
