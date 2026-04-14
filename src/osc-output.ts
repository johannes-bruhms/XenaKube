// === OSC Output: Formats and sends state to SuperCollider and TouchDesigner ===

import type { XenaKubeState } from './types.js';
import type { ExpressionState } from './expression.js';
import type { SpellMatch } from './spells.js';

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

  // NOTE: /xk/voice is NOT emitted in the state burst. It fires only on
  // actual voice transitions via engine.onVoice (see relay.js). Emitting
  // it here would replay per-gyro-packet (~10 Hz) and trigger SWAM phrases
  // continuously even when the cube is still. See revision_roadmap.md D16.

  // Gyro snap (target S4 element + its quaternion + deviation 0..1)
  msgs.push({ address: '/xk/snap/element', args: [state.snapElement] });
  msgs.push({
    address: '/xk/snap/quat',
    args: [state.snapQuat[0], state.snapQuat[1], state.snapQuat[2], state.snapQuat[3]],
  });
  msgs.push({ address: '/xk/snap/dev', args: [state.gyroDeviation] });

  // Scramble factor (0 = solved, 1 = max scrambled)
  msgs.push({ address: '/xk/scramble', args: [state.scrambleFactor] });

  // Turn rate and regime
  msgs.push({ address: '/xk/rate', args: [state.turnRate] });
  msgs.push({ address: '/xk/regime', args: [state.regime] });

  // Expression (also in full burst so BLE-rate updates include it)
  msgs.push({ address: '/xk/expr/tilt', args: [state.expression.tilt] });
  msgs.push({ address: '/xk/expr/spin', args: [state.expression.spin] });
  msgs.push({ address: '/xk/expr/dev', args: [state.expression.deviation] });
  msgs.push({ address: '/xk/expr/scramble', args: [state.expression.scramble] });

  return msgs;
}

/** Expression-only OSC messages for 60Hz relay loop */
export function expressionToOsc(expr: ExpressionState): OscMessage[] {
  return [
    { address: '/xk/expr/tilt', args: [expr.tilt] },
    { address: '/xk/expr/spin', args: [expr.spin] },
    { address: '/xk/expr/dev', args: [expr.deviation] },
    { address: '/xk/expr/scramble', args: [expr.scramble] },
  ];
}

/** Spell detection → single OSC message */
export function spellToOsc(match: SpellMatch): OscMessage {
  return { address: '/xk/spell', args: [match.spell.name] };
}

/**
 * Voice output → OSC message(s). One /xk/voice per active voice event.
 * Called from relay's engine.onVoice listener — fires only on real turns,
 * not per gyro packet.
 */
export function voiceToOsc(output: import('./voice-engine.js').VoiceOutput): OscMessage[] {
  return output.active.map(ev => ({
    address: '/xk/voice',
    args: [
      ev.vertexIndex,
      ev.complex,
      ev.params.density,
      ev.params.intensity,
      ev.params.duration,
    ],
  }));
}
