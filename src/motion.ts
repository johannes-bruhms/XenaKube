// === Motion: still-state and dwell tracking ===
//
// MotionTracker consumes a stream of unit quaternions (the calibrated gyro
// pose) timestamped in ms, and exposes:
//   • `accelMag`  — current angular speed magnitude (rad/s).
//   • `isStill`   — true when accelMag is below STILL_OMEGA_THRESHOLD.
//   • `dwellMs`   — how long isStill has been continuously true.
//
// Threshold is tighter than the relay's `OMEGA_NOISE_FLOOR` (0.25 rad/s) so
// dwell only trips on genuinely steady holds, not on the noise floor of a
// raw gyro sample. The relay still passes through that noise; this tracker
// gates it for downstream use.

import type { Quaternion } from './types.js';

export const STILL_OMEGA_THRESHOLD = 0.1; // rad/s

export class MotionTracker {
  accelMag = 0;
  isStill = false;
  dwellMs = 0;

  /** Mutable threshold (rad/s). Default = STILL_OMEGA_THRESHOLD. */
  threshold: number = STILL_OMEGA_THRESHOLD;

  /** Override the still-state threshold. Clamps to [0.01, 1.0] rad/s. */
  setThreshold(value: number): void {
    if (!Number.isFinite(value)) return;
    this.threshold = Math.min(1.0, Math.max(0.01, value));
  }

  private prevQuat: Quaternion = [0, 0, 0, 1];
  private prevTime = 0;
  private stillSince = 0;
  private seeded = false;

  pushQuat(q: Quaternion, tMs: number): void {
    if (!this.seeded) {
      this.prevQuat = [...q] as Quaternion;
      this.prevTime = tMs;
      this.seeded = true;
      return;
    }

    const dt = (tMs - this.prevTime) / 1000;
    if (dt <= 0) {
      // Out-of-order or duplicate timestamp — keep state, don't update.
      return;
    }

    // Angular distance between two unit quaternions = 2 * acos(|dot|).
    const dot = this.prevQuat[0] * q[0]
              + this.prevQuat[1] * q[1]
              + this.prevQuat[2] * q[2]
              + this.prevQuat[3] * q[3];
    const absDot = Math.min(1, Math.abs(dot));
    const angle = 2 * Math.acos(absDot);
    this.accelMag = angle / dt;

    const wasStill = this.isStill;
    this.isStill = this.accelMag < this.threshold;

    if (this.isStill) {
      if (!wasStill) {
        this.stillSince = tMs;
      }
      this.dwellMs = tMs - this.stillSince;
    } else {
      this.stillSince = 0;
      this.dwellMs = 0;
    }

    this.prevQuat = [...q] as Quaternion;
    this.prevTime = tMs;
  }

  reset(): void {
    this.prevQuat = [0, 0, 0, 1];
    this.prevTime = 0;
    this.stillSince = 0;
    this.seeded = false;
    this.accelMag = 0;
    this.isStill = false;
    this.dwellMs = 0;
    // threshold survives reset — user-tuned setting persists
  }
}
