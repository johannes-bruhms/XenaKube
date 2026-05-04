// === Mode Manager: tracks current performance state ===
//
// Receives cube algorithm detections, updates mode accordingly.
// Effect-to-action mapping is intentionally minimal — just tracks what's active.

import type { CubeAlgorithmMatch } from './cube-algorithm.js';
import type { VoiceMode } from './voice-engine.js';

export interface PerformanceMode {
  voiceMode: VoiceMode;
  palette: string;
  /** Generic slot for sub-mode within a palette */
  variant: string;
  /** Whether sound is frozen (sustain current state, ignore new turns) */
  frozen: boolean;
}

export type ModeChangeListener = (mode: PerformanceMode, trigger: CubeAlgorithmMatch) => void;

export class ModeManager {
  mode: PerformanceMode = {
    voiceMode: 'sequential',
    palette: 'default',
    variant: 'default',
    frozen: false,
  };

  private listeners: ModeChangeListener[] = [];
  private algorithmHistory: CubeAlgorithmMatch[] = [];

  /** Register a listener for mode changes */
  onChange(listener: ModeChangeListener): () => void {
    this.listeners.push(listener);
    return () => { this.listeners = this.listeners.filter(l => l !== listener); };
  }

  /** Apply a detected cube algorithm. Returns true if mode changed. */
  applyAlgorithm(match: CubeAlgorithmMatch): boolean {
    this.algorithmHistory.push(match);
    const prev = { ...this.mode };

    // All algorithm effects are stubs — detection still fires and the
    // dashboard logs the match, but no mode change. Effect re-binding is
    // tracked in `docs/todo.md` Phase B (algorithm-as-phrase-vocabulary).
    switch (match.algorithm.effect) {
      case 'sexy-move':
      case 'sune':
      case 'anti-sune':
      case 'oll-cross':
      case 'u-perm':
      case 't-perm':
      case 'niklas':
        break;
    }

    const changed = prev.voiceMode !== this.mode.voiceMode
      || prev.frozen !== this.mode.frozen
      || prev.palette !== this.mode.palette
      || prev.variant !== this.mode.variant;

    this.emit(match);
    return changed;
  }

  /** Manually set voice mode */
  setVoiceMode(mode: VoiceMode): void {
    this.mode.voiceMode = mode;
  }

  /** Manually set palette */
  setPalette(palette: string): void {
    this.mode.palette = palette;
  }

  /** Manually toggle freeze */
  toggleFreeze(): boolean {
    this.mode.frozen = !this.mode.frozen;
    return this.mode.frozen;
  }

  /** Get cube algorithm history (for dashboard) */
  getHistory(): CubeAlgorithmMatch[] {
    return this.algorithmHistory;
  }

  /** Get current mode (snapshot) */
  getMode(): PerformanceMode {
    return { ...this.mode };
  }

  reset(): void {
    this.mode = { voiceMode: 'sequential', palette: 'default', variant: 'default', frozen: false };
    this.algorithmHistory = [];
  }

  private emit(trigger: CubeAlgorithmMatch): void {
    for (const listener of this.listeners) {
      listener(this.mode, trigger);
    }
  }
}
