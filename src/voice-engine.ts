// === Voice Engine: sequential vs polyphonic output ===
//
// Decides what gets sounded on each turn. Does NOT produce OSC —
// just decides which vertices/complexes are active.

import type { VertexParams, VertexSet, ComplexType } from './types.js';
import type { FaceMove } from './face-gesture.js';

export type VoiceMode = 'sequential' | 'polyphonic';

export interface VoiceEvent {
  vertexIndex: number;
  params: VertexParams;
  complex: ComplexType;
}

export interface VoiceOutput {
  mode: VoiceMode;
  active: VoiceEvent[];   // 1 event in sequential, 8 in polyphonic
  /** True on the second rapid identical quarter-turn of a physical 180° flick. */
  halfTurn?: boolean;
  /** Face identity of the turn that produced this output, or null on
   *  non-face triggers (diagram advance, gyro-only path). Downstream
   *  consumers (Max bridge) dispatch face-gesture shaping from this. */
  face: FaceMove | null;
}

export class VoiceEngine {
  mode: VoiceMode = 'sequential';

  /** Compute what should sound after a turn */
  emit(
    vertices: VertexSet,
    activeIdx: number,
    complexes: ComplexType[],
    face: FaceMove | null = null,
    halfTurn = false,
  ): VoiceOutput {
    if (this.mode === 'sequential') {
      return {
        mode: 'sequential',
        active: [{
          vertexIndex: activeIdx,
          params: vertices[activeIdx],
          complex: complexes[activeIdx],
        }],
        halfTurn,
        face,
      };
    } else {
      return {
        mode: 'polyphonic',
        active: vertices.map((params, i) => ({
          vertexIndex: i,
          params,
          complex: complexes[i],
        })),
        halfTurn,
        face,
      };
    }
  }

  setMode(mode: VoiceMode): void {
    this.mode = mode;
  }

  toggleMode(): VoiceMode {
    this.mode = this.mode === 'sequential' ? 'polyphonic' : 'sequential';
    return this.mode;
  }
}
