// === Turn-Rate Tracker: detect performance speed regime ===
//
// Circular buffer of turn timestamps → exponentially weighted rate → regime classification.
// Hysteresis prevents jitter at regime boundaries.

export type Regime = 'contemplative' | 'conversational' | 'burst';

/** Thresholds in turns/sec */
const CONTEMP_TO_CONV = 0.3;
const CONV_TO_BURST = 2.0;
/** Hysteresis: drop below these to fall back */
const CONV_TO_CONTEMP = 0.2;
const BURST_TO_CONV = 1.5;
/** Consecutive regime-consistent turns required to transition up */
const HYSTERESIS_COUNT = 3;
/** Decay: if no turn for this many ms, rate decays toward 0 */
const DECAY_MS = 3000;

const BUFFER_SIZE = 16;

export class TurnRateTracker {
  private timestamps: number[] = [];
  private regime: Regime = 'contemplative';
  private pendingRegime: Regime = 'contemplative';
  private pendingCount = 0;

  /** Record a turn. Returns the current regime. */
  push(timestamp: number): Regime {
    this.timestamps.push(timestamp);
    if (this.timestamps.length > BUFFER_SIZE) {
      this.timestamps.shift();
    }

    const rate = this.computeRate(timestamp);
    const candidate = this.classifyRate(rate);

    // Upward transitions require hysteresis (sustained fast turning)
    // Downward transitions are immediate (you stopped — respond now)
    const isUpward = regimeOrd(candidate) > regimeOrd(this.regime);

    if (isUpward) {
      if (candidate === this.pendingRegime) {
        this.pendingCount++;
      } else {
        this.pendingRegime = candidate;
        this.pendingCount = 1;
      }
      if (this.pendingCount >= HYSTERESIS_COUNT) {
        this.regime = candidate;
        this.pendingCount = 0;
      }
    } else {
      // Downward or same — apply immediately
      this.regime = candidate;
      this.pendingRegime = candidate;
      this.pendingCount = 0;
    }

    return this.regime;
  }

  /** Get current rate in turns/sec, accounting for time since last turn. */
  getRate(now: number = Date.now()): number {
    return this.computeRate(now);
  }

  /** Get current regime, accounting for decay since last turn. */
  getRegime(now: number = Date.now()): Regime {
    // If enough time has passed since the last turn, decay to contemplative
    if (this.timestamps.length > 0) {
      const elapsed = now - this.timestamps[this.timestamps.length - 1];
      if (elapsed > DECAY_MS) {
        this.regime = 'contemplative';
        this.pendingRegime = 'contemplative';
        this.pendingCount = 0;
      }
    }
    return this.regime;
  }

  /** Reset all state. */
  reset(): void {
    this.timestamps = [];
    this.regime = 'contemplative';
    this.pendingRegime = 'contemplative';
    this.pendingCount = 0;
  }

  /**
   * Exponentially weighted rate from recent inter-turn intervals.
   * Recent intervals count more. Factor in time since last turn (silence lowers rate).
   */
  private computeRate(now: number): number {
    if (this.timestamps.length < 2) {
      // Not enough data; check if single turn was recent
      if (this.timestamps.length === 1) {
        const elapsed = now - this.timestamps[0];
        // If very recent single turn, return a small rate; otherwise 0
        return elapsed < DECAY_MS ? 0.1 : 0;
      }
      return 0;
    }

    // Compute weighted average of intervals (most recent = highest weight)
    let weightedSum = 0;
    let weightTotal = 0;
    const alpha = 0.7; // weight decay factor (higher = more recent bias)

    for (let i = this.timestamps.length - 1; i > 0; i--) {
      const interval = (this.timestamps[i] - this.timestamps[i - 1]) / 1000; // seconds
      if (interval <= 0) continue;
      const age = this.timestamps.length - 1 - i; // 0 = most recent
      const weight = Math.pow(alpha, age);
      weightedSum += interval * weight;
      weightTotal += weight;
    }

    if (weightTotal === 0) return 0;
    const avgInterval = weightedSum / weightTotal;

    // Factor in silence since last turn: if we've been quiet, effective rate drops
    const lastTs = this.timestamps[this.timestamps.length - 1];
    const silence = (now - lastTs) / 1000;
    // Effective interval is max(avgInterval, silence) — silence stretches the rate
    const effectiveInterval = Math.max(avgInterval, silence);

    return effectiveInterval > 0 ? 1 / effectiveInterval : 0;
  }

  /** Classify a rate using thresholds with hysteresis. */
  private classifyRate(rate: number): Regime {
    // Use direction-dependent thresholds
    if (this.regime === 'contemplative') {
      if (rate >= CONTEMP_TO_CONV) return 'conversational';
      return 'contemplative';
    }
    if (this.regime === 'conversational') {
      if (rate >= CONV_TO_BURST) return 'burst';
      if (rate < CONV_TO_CONTEMP) return 'contemplative';
      return 'conversational';
    }
    // burst
    if (rate < BURST_TO_CONV) return 'conversational';
    return 'burst';
  }
}

function regimeOrd(r: Regime): number {
  return r === 'contemplative' ? 0 : r === 'conversational' ? 1 : 2;
}
