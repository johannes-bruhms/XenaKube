// === Corner Solve Distance ===
//
// Precomputes exact quarter-turn distance from the solved 8-corner topology
// to every visible corner permutation. This is intentionally smaller than a
// full Rubik's-cube solver: XenaKube's current K_i topology only depends on
// which K-corner sits in which visible corner, not edge cubies or corner twist.

import type { Permutation8 } from './types.js';
import {
  IDENTITY_CORNER_PERM,
  CORNER_QUARTER_MOVES,
  applyCornerMove,
  encodeCornerPermutation,
} from './corner-topology.js';

export const CORNER_STATE_COUNT = 40320;

function computeCornerDistances(): Int8Array {
  const dist = new Int8Array(CORNER_STATE_COUNT);
  dist.fill(-1);

  const queue: Permutation8[] = [IDENTITY_CORNER_PERM];
  dist[encodeCornerPermutation(IDENTITY_CORNER_PERM)] = 0;

  for (let head = 0; head < queue.length; head++) {
    const current = queue[head];
    const currentDist = dist[encodeCornerPermutation(current)];

    for (const move of CORNER_QUARTER_MOVES) {
      const next = applyCornerMove(current, move)!;
      const idx = encodeCornerPermutation(next);
      if (dist[idx] !== -1) continue;
      dist[idx] = currentDist + 1;
      queue.push(next);
    }
  }

  return dist;
}

const DISTANCES = computeCornerDistances();

/** Maximum exact quarter-turn distance across the visible 8-corner topology. */
export const MAX_DISTANCE = Math.max(...Array.from(DISTANCES));

/** Exact quarter-turn distance from this visible corner permutation to solved. */
export function scrambleDistance(perm: Permutation8): number {
  return DISTANCES[encodeCornerPermutation(perm)];
}

/** Normalized corner solve distance: 0 = solved, 1 = farthest corner topology. */
export function scrambleFactor(perm: Permutation8): number {
  if (MAX_DISTANCE === 0) return 0;
  return scrambleDistance(perm) / MAX_DISTANCE;
}

/** Get all precomputed corner distances, indexed by Lehmer code. */
export function getAllDistances(): number[] {
  return Array.from(DISTANCES);
}

