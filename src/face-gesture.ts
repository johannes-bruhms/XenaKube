// === Face-Identity Gesture Framework (Phase A1) ===
//
// Each of the 12 face-moves (L L' R R' F F' B B' U U' D D') owns a
// distinct gesture TYPE, fixed to the GAN cube's color-fixed face
// identity. K_i / C_i / path / tetra then MODULATE the content inside
// that shape rather than replacing the K_i material.
//
// Performer's forward model: the *kind* of sound a turn will produce
// is predictable from the face alone. The *detail* still evolves with
// engine state — so the instrument stays compositional, not mechanical.
//
// First-draft signatures below are intentionally simple so they read on
// one hearing. Sculpt-and-polish comes after the framework is audible.


/** The 12 face-moves that own a gesture identity. Half-turns (L2 etc.)
 *  aren't in the set — GAN hardware only reports quarter-turns, and the
 *  CCW-half convention (see CLAUDE.md) decomposes them into two 90° clicks. */
export type FaceMove = 'L' | "L'" | 'R' | "R'" | 'F' | "F'" | 'B' | "B'" | 'U' | "U'" | 'D' | "D'";

/** Gesture envelope archetype — the overall amplitude shape. */
export type EnvelopeShape = 'pluck' | 'swell' | 'stab' | 'hairpin-up' | 'hairpin-down' | 'fade' | 'burst';

/** Articulation emphasis — where in time the gesture's energy lives. */
export type Articulation = 'attack' | 'sustained' | 'release' | 'iterative';

/** Gestural contour metadata. Live pitch selection does not read it. */
export type Motion = 'static' | 'up' | 'down' | 'oscillate';

/** Per-face gesture signature — 6 scalar/categorical fields. */
export interface FaceSignature {
  face: FaceMove;
  /** Amplitude envelope archetype. */
  envelope: EnvelopeShape;
  /**
   * Phrase duration multiplier.
   *
   * K_i supplies the base phrase span; the face scales it so the move keeps a
   * recognisable temporal bias without erasing the old long/short material.
   */
  durationMult: number;
  /** Where the gesture's energy sits in time. */
  articulation: Articulation;
  /** Stereo bias [-1..+1]. Reserved for future stereo routing; SWAM is mono. */
  panBias: number;
  /** Reserved metadata; live pitch selection does not read it. */
  registerBias: number;
  /** Contour label; live pitch selection does not force this direction. */
  motion: Motion;
}

/**
 * The 12 first-draft face signatures.
 *
 * Organising intuition:
 *   • U / U'  — top-family contrast: pluck vs fade
 *   • D / D'  — bottom-family contrast: stab vs `<>` hairpin (peak-in-middle)
 *   • L / L'  — left-panned legato; unprimed swells, primed fades
 *   • R / R'  — right-panned percussive; unprimed a stab, primed a burst
 *   • F / F'  — forward swells; paired contour labels without pitch forcing
 *   • B / B'  — retreating; unprimed a short back-pluck, primed a `><` hairpin (trough-in-middle)
 *
 * Every primed/unprimed pair keeps a family resemblance but differs in
 * duration, envelope, and articulation, so the 12 are pairwise distinguishable
 * by ear while the 6 face-pairs still feel related. Register and pitch
 * direction stay with the sieve / phrase engine, not the face grammar.
 */
export const FACE_SIGNATURES: Record<FaceMove, FaceSignature> = {
  'U':  { face: 'U',  envelope: 'pluck', durationMult: 0.70, articulation: 'attack',    panBias:  0.0, registerBias:  0.0, motion: 'up' },
  "U'": { face: "U'", envelope: 'fade',  durationMult: 1.70, articulation: 'release',   panBias:  0.0, registerBias:  0.0, motion: 'down' },
  'D':  { face: 'D',  envelope: 'stab',  durationMult: 0.60, articulation: 'attack',    panBias:  0.0, registerBias:  0.0, motion: 'down' },
  "D'": { face: "D'", envelope: 'hairpin-up',   durationMult: 2.50, articulation: 'sustained', panBias:  0.0, registerBias:  0.0, motion: 'static' },
  'L':  { face: 'L',  envelope: 'swell', durationMult: 1.85, articulation: 'sustained', panBias: -0.7, registerBias:  0.0, motion: 'up' },
  "L'": { face: "L'", envelope: 'fade',  durationMult: 1.85, articulation: 'release',   panBias: -0.7, registerBias:  0.0, motion: 'down' },
  'R':  { face: 'R',  envelope: 'stab',  durationMult: 0.50, articulation: 'attack',    panBias:  0.7, registerBias:  0.0, motion: 'static' },
  "R'": { face: "R'", envelope: 'burst', durationMult: 0.95, articulation: 'iterative', panBias:  0.7, registerBias:  0.0, motion: 'oscillate' },
  'F':  { face: 'F',  envelope: 'swell', durationMult: 1.45, articulation: 'sustained', panBias:  0.0, registerBias:  0.0, motion: 'up' },
  "F'": { face: "F'", envelope: 'swell', durationMult: 1.45, articulation: 'sustained', panBias:  0.0, registerBias:  0.0, motion: 'down' },
  'B':  { face: 'B',  envelope: 'pluck', durationMult: 0.90, articulation: 'attack',    panBias:  0.0, registerBias:  0.0, motion: 'static' },
  "B'": { face: "B'", envelope: 'hairpin-down', durationMult: 2.25, articulation: 'sustained', panBias:  0.0, registerBias:  0.0, motion: 'oscillate' },
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
//   signature   → duration/envelope/articulation only; no register modifier
//   tetra orbit → parity flip         (reserved; no live pitch-direction force)
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
 * Face register modulation is retired. Kept as a neutral helper for older
 * imports while the face grammar stays out of pitch/register selection.
 */
export function registerMod(sig: FaceSignature): number {
  void sig;
  return 0;
}

/**
 * Tetra orbit parity → reserved contour multiplier.
 *   0 (even, preserves tetrahedra) → +1
 *   1 (odd, swaps tetrahedra)      → -1
 * Kept for callers that still display contour metadata; live pitch selection
 * does not use this value.
 */
export function parityInflection(tetraIdx: number): number {
  return tetraIdx === 1 ? -1 : 1;
}
