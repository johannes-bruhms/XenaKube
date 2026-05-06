// public/interruption/config.js
//
// Tunables for the optional interruption layer. Kept separate from the
// runtime so first-draft pressure behavior can be retuned without hunting
// through state-machine code.

export const INTERRUPTION_STATES = Object.freeze([
  'disabled',
  'clean',
  'armed',
  'glimpse',
  'leak',
  'targeting',
  'takeover',
  'comfort',
  'residue',
  'cooldown',
]);

export const INTERRUPTION_CONFIG = Object.freeze({
  CLEAN_MS: 120000,

  PRESSURE: Object.freeze({
    TIME_RISE_PER_SEC: 0.0012,
    TURN_RATE_RISE_PER_SEC: 0.018,
    SCRAMBLE_RISE_PER_SEC: 0.010,
    MOVE_IMPULSE: 0.028,
    REPEAT_IMPULSE: 0.045,
    REPEAT_DECAY_PER_SEC: 0.20,
    STILL_FALL_PER_SEC: 0.050,
    IDLE_FALL_PER_SEC: 0.030,
    COOLDOWN_FALL_PER_SEC: 0.070,
    SOLVED_FALL_PER_SEC: 0.180,
    IDLE_AFTER_MS: 2500,
    TURN_WINDOW_MS: 6000,
    MANUAL_STEP: 0.08,
    SEXY_MOVE_MULT: 0.35,
  }),

  THRESHOLDS: Object.freeze({
    GLIMPSE: 0.28,
    LEAK: 0.46,
    TARGETING: 0.62,
    TAKEOVER: 0.82,
  }),

  DURATIONS: Object.freeze({
    GLIMPSE_MS: 720,
    LEAK_MAX_MS: 9000,
    TARGETING_MAX_MS: 12000,
    TAKEOVER_MAX_MS: 8500,
    COMFORT_MS: 15000,
    RESIDUE_MS: 2400,
    COOLDOWN_MS: 9000,
  }),

  VIDEO_OPACITY: Object.freeze({
    glimpse: 0.34,
    leak: 0.46,
    targeting: 0.62,
    takeover: 0.88,
    comfort: 0.42,
    residue: 0,
  }),

  TARGET_OPACITY: Object.freeze({
    targeting: 0.88,
    takeover: 0.74,
    residue: 0.50,
  }),

  GENERATED: Object.freeze({
    WIDTH: 1280,
    HEIGHT: 720,
    FPS: 24,
  }),
});
