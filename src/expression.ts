// === Expression Processor: gyro → continuous control values ===
//
// Converts raw quaternion + scramble state into normalized 0-1 parameters.
// What these map to sonically is TBD — this just provides the values.

import type { Quaternion } from './types.js';

export interface ExpressionState {
  /** Tilt (pitch angle): 0 = face down, 0.5 = level, 1 = face up */
  tilt: number;
  /** Angular velocity: 0 = still, 1 = fast rotation */
  spin: number;
  /** Gyro deviation from nearest S4 snap: 0 = locked, 1 = at boundary */
  deviation: number;
  /** Scramble factor: 0 = solved, 1 = maximally scrambled */
  scramble: number;
}

export class ExpressionProcessor {
  private prevQuat: Quaternion = [0, 0, 0, 1];
  private prevTime: number = 0;

  process(quat: Quaternion, deviation: number, scramble: number, now: number = Date.now()): ExpressionState {
    const tilt = this.quaternionToTilt(quat);
    const spin = this.computeSpin(quat, now);

    this.prevQuat = quat;
    this.prevTime = now;

    return { tilt, spin, deviation, scramble };
  }

  private quaternionToTilt(q: Quaternion): number {
    const [x, y, z, w] = q;
    // Extract pitch angle (rotation around X axis)
    const sinP = 2 * (w * x - y * z);
    const pitch = Math.asin(Math.max(-1, Math.min(1, sinP)));
    // Normalize: -π/2..π/2 → 0..1
    return (pitch + Math.PI / 2) / Math.PI;
  }

  private computeSpin(quat: Quaternion, now: number): number {
    if (this.prevTime === 0) return 0;
    const dt = (now - this.prevTime) / 1000;
    if (dt <= 0 || dt > 1) return 0;

    // Angular distance between quaternions
    const dot = Math.abs(
      this.prevQuat[0] * quat[0] +
      this.prevQuat[1] * quat[1] +
      this.prevQuat[2] * quat[2] +
      this.prevQuat[3] * quat[3]
    );
    const angle = 2 * Math.acos(Math.min(1, dot));
    const angularVel = angle / dt; // rad/s

    // Normalize: 0..6 rad/s → 0..1 (6 rad/s ≈ 1 full rotation/sec)
    return Math.min(1, angularVel / 6);
  }

  reset(): void {
    this.prevQuat = [0, 0, 0, 1];
    this.prevTime = 0;
  }
}
