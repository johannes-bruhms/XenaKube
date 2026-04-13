// === Scramble Distance: BFS distance from identity in S4 Cayley graph ===
//
// Precomputes distance from identity for all 24 elements.
// Used as a continuous meta-parameter (0 = solved, 1 = maximally scrambled).

import type { GroupElement } from './types.js';
import { ELEMENTS, CAYLEY, IDENTITY } from './group.js';

// BFS from identity using the 3 generators (R, U, F) + their inverses
// to find shortest path to each element.
function computeDistances(): number[] {
  const dist = new Array(24).fill(-1);
  dist[IDENTITY] = 0;
  const queue: number[] = [IDENTITY];

  // Generator indices: we need to find which elements correspond to our 3 generators + inverses
  // In the Cayley table, multiplying identity by element i gives element i.
  // Our generators are elements 1 (R_CW applied to ID), found by BFS order.
  // Rather than hardcode, use all elements as potential single-step moves in the Cayley graph.
  // Actually: the Cayley graph with generators {R, U, F} means edges connect
  // element a to CAYLEY[a][g] for each generator g.

  // Find generator elements: they are CAYLEY[0][g] for the first 3 non-identity elements
  // added during BFS. Since ELEMENTS is BFS-generated from {R,U,F}, elements 1,2,3 are
  // the direct generator results. But to be safe, collect all neighbors.

  // Generators in the Cayley graph = the elements that are 1 step from identity.
  // Since ELEMENTS is BFS from {R_CW, U_CW, F_CW}, elements at distance 1 are indices 1,2,3.
  // Include their inverses for an undirected distance metric.
  const generators: GroupElement[] = [];
  for (let i = 0; i < 24; i++) {
    // Check: is element i reachable in 1 step from identity via any single generator?
    // CAYLEY[0][i] = i (identity * x = x), so we need to check if i is a generator.
    // The BFS in group.ts uses R_CW, U_CW, F_CW — those are elements 1, 2, 3 in BFS order.
    // Their inverses are INVERSES[1], INVERSES[2], INVERSES[3].
  }
  // Simpler: use all 24 as an adjacency definition based on the original 3 generators.
  // Element a connects to CAYLEY[a][1], CAYLEY[a][2], CAYLEY[a][3] (right-multiply by generators)
  // and CAYLEY[a][inv(1)], CAYLEY[a][inv(2)], CAYLEY[a][inv(3)] for undirected.
  const genIndices = [1, 2, 3]; // First 3 elements after identity in BFS = the 3 generators

  while (queue.length > 0) {
    const current = queue.shift()!;
    for (const g of genIndices) {
      // Right-multiply by generator
      const next = CAYLEY[current][g];
      if (dist[next] === -1) {
        dist[next] = dist[current] + 1;
        queue.push(next);
      }
      // Right-multiply by generator inverse (for undirected distance)
      const invG = CAYLEY[current][findInverse(g)];
      if (dist[invG] === -1) {
        dist[invG] = dist[current] + 1;
        queue.push(invG);
      }
    }
  }

  return dist;
}

function findInverse(el: GroupElement): GroupElement {
  for (let i = 0; i < 24; i++) {
    if (CAYLEY[el][i] === IDENTITY) return i;
  }
  return IDENTITY;
}

/** Precomputed BFS distances from identity */
const DISTANCES = computeDistances();

/** Maximum distance in the Cayley graph */
export const MAX_DISTANCE = Math.max(...DISTANCES);

/** BFS distance from identity (0 = solved, MAX_DISTANCE = furthest) */
export function scrambleDistance(element: GroupElement): number {
  return DISTANCES[element];
}

/** Normalized scramble factor: 0 = solved, 1 = maximally scrambled */
export function scrambleFactor(element: GroupElement): number {
  if (MAX_DISTANCE === 0) return 0;
  return DISTANCES[element] / MAX_DISTANCE;
}

/** Get all distances (for dashboard visualization of the full Cayley graph) */
export function getAllDistances(): number[] {
  return [...DISTANCES];
}
