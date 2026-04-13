// === OSC Output: Formats and sends state to SuperCollider and TouchDesigner ===

import type { XenaKubeState } from './types.js';

/** OSC message: address + args */
export interface OscMessage {
  address: string;
  args: (string | number)[];
}

/** Convert full engine state to a batch of OSC messages */
export function stateToOsc(state: XenaKubeState): OscMessage[] {
  const msgs: OscMessage[] = [];

  // K_i cube group element
  msgs.push({ address: '/xk/group/k', args: [state.kGroup] });

  // C_i cube group element
  msgs.push({ address: '/xk/group/c', args: [state.cGroup] });

  // Vertex parameters (K1-K8 in current permuted order)
  for (let i = 0; i < 8; i++) {
    const v = state.kVertices[i];
    msgs.push({
      address: `/xk/vertex/${i + 1}`,
      args: [v.density, v.intensity, v.duration],
    });
  }

  // Complex assignments (C1-C8)
  for (let i = 0; i < state.cAssignments.length; i++) {
    msgs.push({
      address: `/xk/complex/${i + 1}`,
      args: [state.cAssignments[i]],
    });
  }

  // Path
  msgs.push({ address: '/xk/path', args: [state.path] });

  // Cyclic phase
  msgs.push({ address: '/xk/cycle', args: [state.cyclicPhase] });

  // Tetrahedral orbit
  msgs.push({ address: '/xk/tetra', args: [state.tetraIndex] });

  // Sieve pitches (variable length)
  msgs.push({ address: '/xk/sieve', args: state.sieve });

  // Raw gyro passthrough
  msgs.push({
    address: '/xk/gyro',
    args: [state.gyro[0], state.gyro[1], state.gyro[2], state.gyro[3]],
  });

  // Step counter
  msgs.push({ address: '/xk/step', args: [state.step] });

  // Vertex permutation
  msgs.push({ address: '/xk/perm', args: [...state.kPermutation] });

  // Active vertex (0-7): the single vertex currently sounding
  msgs.push({ address: '/xk/active', args: [state.activeVertex] });

  // Active vertex params + complex type in a single message for convenience
  const av = state.kVertices[state.activeVertex];
  const ac = state.cAssignments[state.activeVertex];
  msgs.push({
    address: '/xk/voice',
    args: [state.activeVertex, ac, av.density, av.intensity, av.duration],
  });

  // Gyro snap (target S4 element + its quaternion + deviation 0..1)
  msgs.push({ address: '/xk/snap/element', args: [state.snapElement] });
  msgs.push({
    address: '/xk/snap/quat',
    args: [state.snapQuat[0], state.snapQuat[1], state.snapQuat[2], state.snapQuat[3]],
  });
  msgs.push({ address: '/xk/snap/dev', args: [state.gyroDeviation] });

  // Turn rate and regime
  msgs.push({ address: '/xk/rate', args: [state.turnRate] });
  msgs.push({ address: '/xk/regime', args: [state.regime] });

  return msgs;
}
