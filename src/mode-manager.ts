// === Mode Manager: tracks current performance state ===
//
// Receives spell detections, updates mode accordingly.
// Effect-to-action mapping is intentionally empty — just tracks what's active.

import type { SpellMatch } from './spells.js';
import type { VoiceMode } from './voice-engine.js';

export interface PerformanceMode {
  voiceMode: VoiceMode;
  palette: string;
  /** Generic slot for sub-mode within a palette */
  variant: string;
  /** Whether sound is frozen (sustain current state, ignore new turns) */
  frozen: boolean;
}

export type ModeChangeListener = (mode: PerformanceMode, trigger: SpellMatch) => void;

export class ModeManager {
  mode: PerformanceMode = {
    voiceMode: 'sequential',
    palette: 'default',
    variant: 'default',
    frozen: false,
  };

  private listeners: ModeChangeListener[] = [];
  private spellHistory: SpellMatch[] = [];

  /** Register a listener for mode changes */
  onChange(listener: ModeChangeListener): () => void {
    this.listeners.push(listener);
    return () => { this.listeners = this.listeners.filter(l => l !== listener); };
  }

  /** Apply a detected spell. Returns true if mode changed. */
  applySpell(match: SpellMatch): boolean {
    this.spellHistory.push(match);
    const prev = { ...this.mode };

    switch (match.spell.effect) {
      case 'sexy-move':
        this.mode.voiceMode = this.mode.voiceMode === 'sequential' ? 'polyphonic' : 'sequential';
        break;
      case 'sune':
        // Detection stub — freeze effect removed 2026-04-18. Effect TBD.
        break;
      case 'anti-sune':
        this.mode.palette = 'V1';
        break;
      case 'oll-cross':
        this.mode.variant = 'drone';
        break;
      case 'u-perm':
        this.mode.variant = 'burst';
        break;
      case 't-perm':
        this.mode.variant = 'default';
        this.mode.palette = 'default';
        break;
      case 'niklas':
        // V1 ↔ V2 path toggle is handled in the engine (EngineMode.path lives
        // there, not on PerformanceMode). See engine.ts onTurn and
        // docs/revision_roadmap.md D19.
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

  /** Get spell history (for dashboard) */
  getHistory(): SpellMatch[] {
    return this.spellHistory;
  }

  /** Get current mode (snapshot) */
  getMode(): PerformanceMode {
    return { ...this.mode };
  }

  reset(): void {
    this.mode = { voiceMode: 'sequential', palette: 'default', variant: 'default', frozen: false };
    this.spellHistory = [];
  }

  private emit(trigger: SpellMatch): void {
    for (const listener of this.listeners) {
      listener(this.mode, trigger);
    }
  }
}
