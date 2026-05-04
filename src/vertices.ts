// === Outside-Time Organization: Vertex Definitions ===
//
// Eight vertices K1–K8 from the triple product D × G × U mapped onto a cube.
// Single unified set spanning the full ppp..fff dynamic palette (Xenakis used
// two paths V1 and V2; XenaKube collapses to one set so the performer has
// every dynamic level available without a runtime path toggle). D values are
// inherited from V1's per-vertex assignments; G expands from V1's 4-level
// alphabet ({mf, f, ff, fff} with duplicates) to the full 8-step western-
// notation palette ({ppp, pp, p, mp, mf, f, ff, fff}, one per vertex). G is
// laid out linearly in vertex index so vertex ordering reads cleanly:
// K1 = ppp ramps to K8 = fff.
//
// Set D: d1=1.0, d2=1.5, d3=2.0, d4=2.5 (density columns, V1 values)
// Set G: ppp..fff (eight unique levels, one per vertex)
//
// Duration is deliberately neutral here. Temporal Identity moved phrase time
// onto the 12 face gestures so K_i cannot obscure the performer's face-to-
// gesture forward model. The duration field remains in the OSC payload as a
// fallback for non-face triggers and backward-compatible consumers.

import type { VertexParams, VertexSet, GroupElement } from './types.js';
import { getPermutation } from './group.js';

const VERTICES: VertexSet = [
  { density: 1.0, intensity: 'ppp', duration: 1 },  // K1 = d1 g_ppp
  { density: 1.0, intensity: 'pp',  duration: 1 },  // K2 = d1 g_pp
  { density: 2.5, intensity: 'p',   duration: 1 },  // K3 = d4 g_p
  { density: 2.5, intensity: 'mp',  duration: 1 },  // K4 = d4 g_mp
  { density: 1.5, intensity: 'mf',  duration: 1 },  // K5 = d2 g_mf
  { density: 1.5, intensity: 'f',   duration: 1 },  // K6 = d2 g_f
  { density: 2.0, intensity: 'ff',  duration: 1 },  // K7 = d3 g_ff
  { density: 2.0, intensity: 'fff', duration: 1 },  // K8 = d3 g_fff
];

/** Get the base (unpermuted) vertex set. */
export function getBaseVertices(): VertexSet {
  return VERTICES;
}

/** Apply a group element's permutation to the vertex set.
 *  Returns vertices reordered: position i gets the vertex that was at perm[i]. */
export function permuteVertices(vertices: VertexSet, el: GroupElement): VertexSet {
  const perm = getPermutation(el);
  return perm.map(i => vertices[i]) as VertexSet;
}

/** Get the vertex parameter values after applying a group transformation. */
export function getTransformedVertices(el: GroupElement): VertexSet {
  return permuteVertices(VERTICES, el);
}

// === Intensity ordering for comparison ===
const INTENSITY_ORDER: Record<string, number> = {
  'ppp': 0, 'pp': 1, 'p': 2, 'mp': 3, 'mf': 4, 'f': 5, 'ff': 6, 'fff': 7,
};

/** Compare intensities: returns negative if a < b, 0 if equal, positive if a > b */
export function compareIntensity(a: string, b: string): number {
  return (INTENSITY_ORDER[a] ?? 0) - (INTENSITY_ORDER[b] ?? 0);
}
