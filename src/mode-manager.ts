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

    // For now, no automatic effect-to-mode wiring.
    // This is the hook point — wire effects here when ready.
    // Example (currently inactive):
    //
    // switch (match.spell.effect) {
    //   case 'sexy-move': this.mode.voiceMode = toggle; break;
    //   case 'sledgehammer': this.mode.frozen = !this.mode.frozen; break;
    //   case 'oll-cross': this.mode.palette = nextPalette(); break;
    // }

    this.emit(match);
    return true;
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
