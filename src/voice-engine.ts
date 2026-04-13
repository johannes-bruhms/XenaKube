// === Voice Engine: sequential vs polyphonic output ===
//
// Decides what gets sounded on each turn. Does NOT produce OSC —
// just decides which vertices/complexes are active.

import type { VertexParams, VertexSet, ComplexType } from './types.js';

export type VoiceMode = 'sequential' | 'polyphonic';

export interface VoiceEvent {
  vertexIndex: number;
  params: VertexParams;
  complex: ComplexType;
}

export interface VoiceOutput {
  mode: VoiceMode;
  active: VoiceEvent[];   // 1 event in sequential, 8 in polyphonic
}

export class VoiceEngine {
  mode: VoiceMode = 'sequential';

  /** Compute what should sound after a turn */
  emit(vertices: VertexSet, activeIdx: number, complexes: ComplexType[]): VoiceOutput {
    if (this.mode === 'sequential') {
      return {
        mode: 'sequential',
        active: [{
          vertexIndex: activeIdx,
          params: vertices[activeIdx],
          complex: complexes[activeIdx],
        }],
      };
    } else {
      return {
        mode: 'polyphonic',
        active: vertices.map((params, i) => ({
          vertexIndex: i,
          params,
          complex: complexes[i],
        })),
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
