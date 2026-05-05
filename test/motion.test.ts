import { describe, it, expect } from 'vitest';
import { MotionTracker, STILL_OMEGA_THRESHOLD } from '../src/motion.js';
import type { Quaternion } from '../src/types.js';

const IDENTITY: Quaternion = [0, 0, 0, 1];

function axisAngle(ax: number, ay: number, az: number, theta: number): Quaternion {
  const len = Math.sqrt(ax * ax + ay * ay + az * az);
  ax /= len; ay /= len; az /= len;
  const half = theta / 2;
  const s = Math.sin(half);
  return [ax * s, ay * s, az * s, Math.cos(half)];
}

describe('MotionTracker', () => {
  it('initial state is zero / not still', () => {
    const m = new MotionTracker();
    expect(m.accelMag).toBe(0);
    expect(m.isStill).toBe(false);
    expect(m.dwellMs).toBe(0);
  });

  it('first push only seeds; no accel computed', () => {
    const m = new MotionTracker();
    m.pushQuat(IDENTITY, 1000);
    expect(m.accelMag).toBe(0);
    expect(m.isStill).toBe(false);
  });

  it('identical quaternions over time → accel=0, isStill=true, dwell grows', () => {
    const m = new MotionTracker();
    m.pushQuat(IDENTITY, 1000);
    m.pushQuat(IDENTITY, 1100);
    expect(m.accelMag).toBe(0);
    expect(m.isStill).toBe(true);
    expect(m.dwellMs).toBe(0); // first still tick: dwellSince = now, dwellMs = 0

    m.pushQuat(IDENTITY, 1500);
    expect(m.dwellMs).toBe(400);

    m.pushQuat(IDENTITY, 3000);
    expect(m.dwellMs).toBe(1900);
  });

  it('large rotation tick → accelMag high, isStill=false, dwell=0', () => {
    const m = new MotionTracker();
    m.pushQuat(IDENTITY, 0);
    // π/4 rotation in 100 ms → 2.5π rad/s ≈ 7.85 rad/s, well above threshold.
    m.pushQuat(axisAngle(0, 1, 0, Math.PI / 4), 100);
    expect(m.accelMag).toBeGreaterThan(STILL_OMEGA_THRESHOLD * 2);
    expect(m.isStill).toBe(false);
    expect(m.dwellMs).toBe(0);
  });

  it('still → motion → still resets dwell properly', () => {
    const m = new MotionTracker();
    m.pushQuat(IDENTITY, 0);
    m.pushQuat(IDENTITY, 500);   // first detected-still tick → dwellSince=500, dwellMs=0
    m.pushQuat(IDENTITY, 1000);
    expect(m.dwellMs).toBe(500);

    // Sudden motion
    m.pushQuat(axisAngle(0, 1, 0, Math.PI / 2), 1100);
    expect(m.isStill).toBe(false);
    expect(m.dwellMs).toBe(0);

    // Now hold the new pose still
    const newPose = axisAngle(0, 1, 0, Math.PI / 2);
    m.pushQuat(newPose, 1200);   // detected still here → dwellSince=1200, dwellMs=0
    m.pushQuat(newPose, 1700);
    expect(m.isStill).toBe(true);
    expect(m.dwellMs).toBe(500);
  });

  it('out-of-order timestamps do not corrupt state', () => {
    const m = new MotionTracker();
    m.pushQuat(IDENTITY, 1000);
    m.pushQuat(IDENTITY, 1500);
    const before = { accel: m.accelMag, dwell: m.dwellMs };
    m.pushQuat(IDENTITY, 1500);  // duplicate
    m.pushQuat(IDENTITY, 1400);  // backwards
    expect(m.accelMag).toBe(before.accel);
    expect(m.dwellMs).toBe(before.dwell);
  });

  it('reset clears all state', () => {
    const m = new MotionTracker();
    m.pushQuat(IDENTITY, 0);
    m.pushQuat(IDENTITY, 500);
    m.pushQuat(IDENTITY, 1000);
    expect(m.dwellMs).toBe(500);
    m.reset();
    expect(m.accelMag).toBe(0);
    expect(m.isStill).toBe(false);
    expect(m.dwellMs).toBe(0);
  });
});
