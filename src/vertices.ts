// === Outside-Time Organization: Vertex Definitions (Formalized Music pp. 218-220) ===
//
// Eight vertices K1-K8 from the triple product D × G × U mapped onto a cube.
// Two paths V1 and V2 with exact values from Xenakis.

import type { VertexParams, VertexSet, Path, GroupElement, Permutation8 } from './types.js';
import { getPermutation } from './group.js';

// === V1: D strong, G strong, U weak ===
// Set D: d1=1.0, d2=1.5, d3=2.0, d4=2.5 (density columns a)
// Set G: g1=mf, g2=f, g3=ff, g4=fff
// Set U: u1=2s, u2=3s, u3=4s, u4=5s

const V1_VERTICES: VertexSet = [
  { density: 1.0, intensity: 'mf',  duration: 2 },  // K1 = d1 g1 u1
  { density: 1.0, intensity: 'fff', duration: 5 },  // K2 = d1 g4 u4
  { density: 2.5, intensity: 'fff', duration: 5 },  // K3 = d4 g4 u4
  { density: 2.5, intensity: 'mf',  duration: 2 },  // K4 = d4 g1 u1
  { density: 1.5, intensity: 'f',   duration: 3 },  // K5 = d2 g2 u2
  { density: 1.5, intensity: 'ff',  duration: 4 },  // K6 = d2 g3 u3
  { density: 2.0, intensity: 'ff',  duration: 4 },  // K7 = d3 g3 u3
  { density: 2.0, intensity: 'f',   duration: 3 },  // K8 = d3 g2 u2
];

// === V2: D strong, G average, U strong ===
// Set D: d1=0.5, d2=1, d3=2, d4=3 (elements/sec)
// Set G: g1=p, g2=mp, g3=mf, g4=f
// Set U: u1=10s, u2=17s, u3=21s, u4=30s

const V2_VERTICES: VertexSet = [
  { density: 3.0, intensity: 'mp', duration: 17 },  // K1 = d4 g2 u2
  { density: 2.0, intensity: 'mp', duration: 10 },  // K2 = d3 g2 u1
  { density: 1.0, intensity: 'f',  duration: 30 },  // K3 = d2 g4 u4
  { density: 0.5, intensity: 'mp', duration: 21 },  // K4 = d1 g2 u3
  { density: 3.0, intensity: 'p',  duration: 30 },  // K5 = d4 g1 u4
  { density: 2.0, intensity: 'mp', duration: 21 },  // K6 = d3 g2 u3
  { density: 1.0, intensity: 'mf', duration: 17 },  // K7 = d2 g3 u2
  { density: 0.5, intensity: 'f',  duration: 10 },  // K8 = d1 g4 u1
];

/** Get the base (unpermuted) vertex set for a path */
export function getBaseVertices(path: Path): VertexSet {
  return path === 'V1' ? V1_VERTICES : V2_VERTICES;
}

/** Apply a group element's permutation to the vertex set.
 *  Returns vertices reordered: position i gets the vertex that was at perm[i]. */
export function permuteVertices(vertices: VertexSet, el: GroupElement): VertexSet {
  const perm = getPermutation(el);
  return perm.map(i => vertices[i]) as VertexSet;
}

/** Get the vertex parameter values after applying a group transformation */
export function getTransformedVertices(path: Path, el: GroupElement): VertexSet {
  return permuteVertices(getBaseVertices(path), el);
}

// === Intensity ordering for comparison ===
const INTENSITY_ORDER: Record<string, number> = {
  'p': 0, 'mp': 1, 'mf': 2, 'f': 3, 'ff': 4, 'fff': 5,
};

/** Compare intensities: returns negative if a < b, 0 if equal, positive if a > b */
export function compareIntensity(a: string, b: string): number {
  return (INTENSITY_ORDER[a] ?? 0) - (INTENSITY_ORDER[b] ?? 0);
}
