// === OSC Output: Formats and sends state to Max/SWAM and TouchDesigner ===
//
// Addresses come from src/osc-schema.ts — the single source of truth. No
// raw '/xk/*' string literals should live in this file; if you need a new
// address, add it to the schema first and regen Max with `npm run
// gen:max`.

import type { XenaKubeState } from './types.js';
import type { ExpressionState } from './expression.js';
import type { CubeAlgorithmMatch } from './cube-algorithm.js';
import type { PhrasePlan } from './phrase-plan.js';
import type { VoiceOutput } from './voice-engine.js';
import { OSC, vertexAddr, complexAddr } from './osc-schema.js';

/** OSC message: address + args */
export interface OscMessage {
  address: string;
  args: (string | number)[];
}

/** Convert full engine state to a batch of OSC messages */
export function stateToOsc(state: XenaKubeState): OscMessage[] {
  const msgs: OscMessage[] = [];

  msgs.push({ address: OSC.GROUP_K, args: [state.kGroup] });
  msgs.push({ address: OSC.GROUP_C, args: [state.cGroup] });

  for (let i = 0; i < 8; i++) {
    const v = state.kVertices[i];
    msgs.push({ address: vertexAddr(i + 1), args: [v.density, v.intensity, v.duration] });
  }

  for (let i = 0; i < state.cAssignments.length; i++) {
    msgs.push({ address: complexAddr(i + 1), args: [state.cAssignments[i]] });
  }

  msgs.push({ address: OSC.CYCLE, args: [state.cyclicPhase] });
  msgs.push({ address: OSC.TETRA, args: [state.tetraIndex] });
  msgs.push({ address: OSC.SIEVE, args: state.sieve });

  msgs.push({
    address: OSC.GYRO,
    args: [state.gyro[0], state.gyro[1], state.gyro[2], state.gyro[3]],
  });

  msgs.push({ address: OSC.STEP,   args: [state.step] });
  msgs.push({ address: OSC.PERM,   args: [...state.kPermutation] });
  msgs.push({ address: OSC.ACTIVE, args: [state.activeVertex] });

  // NOTE: OSC.VOICE is NOT emitted in the state burst. It fires only on
  // actual voice transitions via engine.onVoice (see relay.js). Emitting
  // it here would replay per-gyro-packet (~10 Hz) and trigger SWAM phrases
  // continuously even when the cube is still. See revision_roadmap.md D16.

  msgs.push({ address: OSC.SNAP_ELEMENT, args: [state.snapElement] });
  msgs.push({
    address: OSC.SNAP_QUAT,
    args: [state.snapQuat[0], state.snapQuat[1], state.snapQuat[2], state.snapQuat[3]],
  });
  msgs.push({ address: OSC.SNAP_DEV, args: [state.gyroDeviation] });

  msgs.push({ address: OSC.SCRAMBLE, args: [state.scrambleFactor] });
  msgs.push({ address: OSC.RATE,     args: [state.turnRate] });
  msgs.push({ address: OSC.REGIME,   args: [state.regime] });

  msgs.push({ address: OSC.EXPR_TILT,     args: [state.expression.tilt] });
  msgs.push({ address: OSC.EXPR_SPIN,     args: [state.expression.spin] });
  msgs.push({ address: OSC.EXPR_DEV,      args: [state.expression.deviation] });
  msgs.push({ address: OSC.EXPR_SCRAMBLE, args: [state.expression.scramble] });

  return msgs;
}

/** Expression-only OSC messages for 60Hz relay loop */
export function expressionToOsc(expr: ExpressionState): OscMessage[] {
  return [
    { address: OSC.EXPR_TILT,     args: [expr.tilt] },
    { address: OSC.EXPR_SPIN,     args: [expr.spin] },
    { address: OSC.EXPR_DEV,      args: [expr.deviation] },
    { address: OSC.EXPR_SCRAMBLE, args: [expr.scramble] },
  ];
}

/** Cube algorithm detection → single OSC message */
export function algorithmToOsc(match: CubeAlgorithmMatch): OscMessage {
  return { address: OSC.ALGORITHM, args: [match.algorithm.name] };
}

/** Cube solved (unsolved → solved edge) → single OSC message with no args */
export function solveToOsc(): OscMessage {
  return { address: OSC.SOLVE, args: [] };
}

/**
 * Voice output → OSC message(s). Emits `/xk/face <face>` FIRST (so the
 * bridge has the face-signature loaded when phrase dispatch reads it),
 * then one `/xk/voice` per active voice event.
 *
 * Called from relay's engine.onVoice listener — fires only on real turns,
 * not per gyro packet.
 *
 * When `output.face` is null (diagram-driven advance, half-turns, future
 * silent paths), `/xk/face -` resets the bridge's pending face so stale
 * face multiplier cannot leak into the next voice.
 */
export function voiceToOsc(output: VoiceOutput, phrasePlans: PhrasePlan[] = []): OscMessage[] {
  const msgs: OscMessage[] = [];
  msgs.push({ address: OSC.FACE, args: [output.face ?? '-'] });
  output.active.forEach((ev, i) => {
    const plan = phrasePlans[i];
    if (plan) msgs.push(phrasePlanToOsc(plan));
    msgs.push({
      address: OSC.VOICE,
      args: [
        ev.vertexIndex,
        ev.complex,
        ev.params.density,
        ev.params.intensity,
        ev.params.duration,
      ],
    });
  });
  return msgs;
}

/** Shadow TypeScript phrase plan -> compact OSC summary for Max logging.
 *  The full event plan is broadcast to the dashboard over WebSocket; this OSC
 *  summary keeps UDP payloads small while Max remains the legacy renderer. */
export function phrasePlanToOsc(plan: PhrasePlan): OscMessage {
  return {
    address: OSC.PHRASE_PLAN,
    args: [
      plan.id,
      plan.complex,
      plan.face ?? '-',
      plan.durationSec,
      plan.events.length,
      plan.expected.noteOnCount,
      plan.expected.bendStepCount,
      plan.expected.companionNoteOnCount,
    ],
  };
}
