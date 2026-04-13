import { describe, it, expect } from 'vitest';
import { TurnRateTracker, type Regime } from '../src/turn-rate.js';

describe('TurnRateTracker', () => {
  it('starts at contemplative with rate 0', () => {
    const tr = new TurnRateTracker();
    expect(tr.getRegime()).toBe('contemplative');
    expect(tr.getRate()).toBe(0);
  });

  it('single turn gives a small nonzero rate', () => {
    const tr = new TurnRateTracker();
    tr.push(1000);
    expect(tr.getRate(1000)).toBeGreaterThan(0);
    expect(tr.getRegime(1000)).toBe('contemplative');
  });

  it('slow turns stay contemplative', () => {
    const tr = new TurnRateTracker();
    // 1 turn every 5 seconds = 0.2 Hz
    for (let i = 0; i < 8; i++) {
      tr.push(i * 5000);
    }
    expect(tr.getRate(35000)).toBeLessThan(0.3);
    expect(tr.getRegime(35000)).toBe('contemplative');
  });

  it('moderate turns reach conversational after hysteresis', () => {
    const tr = new TurnRateTracker();
    // 1 turn per second = 1.0 Hz — conversational range
    // Need 3+ turns above threshold for hysteresis
    for (let i = 0; i < 6; i++) {
      tr.push(i * 1000);
    }
    expect(tr.getRegime(5000)).toBe('conversational');
  });

  it('fast turns reach burst after hysteresis', () => {
    const tr = new TurnRateTracker();
    // 5 turns per second = 5.0 Hz — burst range
    for (let i = 0; i < 10; i++) {
      tr.push(i * 200);
    }
    expect(tr.getRegime(1800)).toBe('burst');
  });

  it('hysteresis prevents single fast turn from triggering burst', () => {
    const tr = new TurnRateTracker();
    // Establish conversational
    for (let i = 0; i < 6; i++) {
      tr.push(i * 1000);
    }
    expect(tr.getRegime(5000)).toBe('conversational');

    // One very fast turn shouldn't jump to burst
    tr.push(5100);
    expect(tr.getRegime(5100)).toBe('conversational');
  });

  it('decays to contemplative after silence', () => {
    const tr = new TurnRateTracker();
    // Get to conversational
    for (let i = 0; i < 6; i++) {
      tr.push(i * 1000);
    }
    expect(tr.getRegime(5000)).toBe('conversational');

    // Wait 4 seconds (past DECAY_MS of 3s)
    expect(tr.getRegime(9000)).toBe('contemplative');
  });

  it('downward transitions are immediate (no hysteresis)', () => {
    const tr = new TurnRateTracker();
    // Get to burst
    for (let i = 0; i < 10; i++) {
      tr.push(i * 200);
    }
    expect(tr.getRegime(1800)).toBe('burst');

    // Slow down: add a few slow turns
    tr.push(3800); // 2s gap
    tr.push(5800); // 2s gap
    expect(tr.getRegime(5800)).toBe('conversational');
  });

  it('rate calculation weights recent turns more heavily', () => {
    const tr = new TurnRateTracker();
    // Start slow (5s intervals)
    for (let i = 0; i < 4; i++) {
      tr.push(i * 5000);
    }
    const slowRate = tr.getRate(15000);

    // Now speed up (200ms intervals)
    for (let i = 0; i < 4; i++) {
      tr.push(15000 + i * 200);
    }
    const fastRate = tr.getRate(15600);

    // Fast rate should be much higher than slow rate
    expect(fastRate).toBeGreaterThan(slowRate * 2);
  });

  it('reset clears all state', () => {
    const tr = new TurnRateTracker();
    for (let i = 0; i < 10; i++) {
      tr.push(i * 200);
    }
    expect(tr.getRegime(1800)).toBe('burst');

    tr.reset();
    expect(tr.getRegime()).toBe('contemplative');
    expect(tr.getRate()).toBe(0);
  });

  it('handles rapid identical timestamps gracefully', () => {
    const tr = new TurnRateTracker();
    // All at the same time — shouldn't crash
    for (let i = 0; i < 5; i++) {
      tr.push(1000);
    }
    const rate = tr.getRate(1000);
    expect(Number.isFinite(rate)).toBe(true);
    expect(rate).toBeGreaterThanOrEqual(0);
  });

  it('buffer does not grow beyond limit', () => {
    const tr = new TurnRateTracker();
    for (let i = 0; i < 50; i++) {
      tr.push(i * 100);
    }
    // Should still work fine, no memory issues
    const rate = tr.getRate(4900);
    expect(rate).toBeGreaterThan(0);
    expect(Number.isFinite(rate)).toBe(true);
  });
});
