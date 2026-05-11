// === Phrase Plan: TypeScript shadow source for phrase-level events ===
//
// This module starts the Max -> TypeScript migration by making the relay
// compute a canonical phrase plan for each VoiceOutput. The current Max bridge
// still renders audio through its legacy phraseC1..phraseC8 functions; the
// plan is broadcast to the dashboard and summarized to Max so both sides can
// converge on one shared contract before audio execution is flipped.

import type { XenaKubeState, ComplexType } from './types.js';
import type { VoiceEvent, VoiceOutput } from './voice-engine.js';
import type { FaceMove, Motion } from './face-gesture.js';
import {
  ART_OFF_VEL,
  ENV_PROFILE,
  INTENSITY_MAP,
  clamp,
  intensityEntry,
  rateAccentValue,
  rateDensityMultiplier,
  rateExpressionMultiplier,
  rateVelocityMultiplier,
  turnRatePressure,
  resolvePhraseDuration,
  stepVelScale,
  HALF_TURN_GESTURE_DURATION_SEC,
  HALF_TURN_GESTURE_INTENSITY,
  HALF_TURN_GESTURE_EXPR,
  HALF_TURN_GESTURE_VELOCITY,
  HALF_TURN_GESTURE_NOTE_MS,
  HALF_TURN_GESTURE_RELEASE_MS,
  type DurationSource,
  type EnvProfile,
  type IntensityLabel,
  type VelCurve,
} from './swam-mapping.js';
import { FACE_SIGNATURES } from './face-gesture.js';

const CELLO_MIN = 36;
const CELLO_MAX = 89;
const SIEVE_BASE = 36;
const LEGATO_OVERLAP_MS = 20;
const FIRST_GLISS_MS = 150;
const FIRST_GLISS_MS_C7 = 30;
const MIN_GLISS_SPACING_MS = 200;
const WILD_MIN_COUNT = 12;
const WILD_GLISS_VEL = 22;
const WILD_GLISS_BPA = 80;
const PITCHBEND_RANGE_SEMI = 24;
const MAX_BEND_DUR_MS = 1200;
const DOUBLE_STOP_ROLL_MIN = CELLO_MIN;
const DOUBLE_STOP_ROLL_MAX = 84;

type Rng = () => number;

export type PhraseEventKind =
  | 'exprShape'
  | 'noteOn'
  | 'noteOff'
  | 'bendStep'
  | 'release'
  | 'allNotesOff';

export interface PhraseEventBase {
  tMs: number;
  kind: PhraseEventKind;
}

export interface ExprShapeEvent extends PhraseEventBase {
  kind: 'exprShape';
  shape: 'static' | 'legacy' | 'cresc' | 'dim' | 'hairpin-up' | 'hairpin-down';
  start?: number;
  mid?: number;
  end?: number;
  peakExpr: number;
  durationMs: number;
}

export interface NoteOnEvent extends PhraseEventBase {
  kind: 'noteOn';
  pitch: number;
  velocity: number;
  isCompanion?: boolean;
}

export interface NoteOffEvent extends PhraseEventBase {
  kind: 'noteOff';
  pitch: number;
  velocity?: number;
  isCompanion?: boolean;
}

export interface BendStepEvent extends PhraseEventBase {
  kind: 'bendStep';
  fromPitch: number;
  toPitch: number;
  durMs: number;
  velocity: number;
  accent?: number;
}

export interface ReleaseEvent extends PhraseEventBase {
  kind: 'release';
  fadeMs: number;
}

export interface AllNotesOffEvent extends PhraseEventBase {
  kind: 'allNotesOff';
}

export type PhraseEvent =
  | ExprShapeEvent
  | NoteOnEvent
  | NoteOffEvent
  | BendStepEvent
  | ReleaseEvent
  | AllNotesOffEvent;

export interface PhrasePlan {
  id: number;
  source: 'ts-shadow';
  mode: VoiceOutput['mode'];
  vertexIndex: number;
  complex: ComplexType;
  face: FaceMove | null;
  halfTurn: boolean;
  durationSec: number;
  durationSource: DurationSource;
  density: number;
  intensity: string;
  regime: XenaKubeState['regime'];
  tetra: number;
  faceMotion: Motion | null;
  faceEnvelope: string | null;
  faceTranspose: number;
  createdAt: number;
  events: PhraseEvent[];
  expected: {
    firstNoteOnMs: number | null;
    noteOnCount: number;
    noteOffCount: number;
    companionNoteOnCount: number;
    bendStepCount: number;
    releaseMs: number;
  };
  warnings: string[];
}

interface ComplexRuntime {
  exprEnv: {
    attack: number;
    peak: number;
    sustain: number;
    releaseRampMs: number;
  };
  bowPressure: number;
  /** D80 — when true, glissStep skips the per-bend noteOff(source) +
   *  noteOn(target) at completion. The audible bow stays on the original
   *  anchor for the whole phrase; pitchbend wheel cumulatively offsets
   *  from the anchor. Mirrors `COMPLEX[*].softBend` in `max/xk_swam.js`. */
  softBend?: boolean;
}

const COMPLEX: Record<number, ComplexRuntime> = {
  1: { /* previous register: { lo: 36, hi: 72 } */ exprEnv: { attack: 1.0, peak: 1.0, sustain: 0.4, releaseRampMs: 60 }, bowPressure: 64 },
  2: { /* previous register: { lo: 40, hi: 64 } */ exprEnv: { attack: 0.6, peak: 1.0, sustain: 0.85, releaseRampMs: 140 }, bowPressure: 70 },
  3: { /* previous register: { lo: 36, hi: 55 } */ exprEnv: { attack: 0.5, peak: 1.1, sustain: 0.9, releaseRampMs: 220 }, bowPressure: 55 },
  4: { /* previous register: { lo: 60, hi: 84 } */ exprEnv: { attack: 0.7, peak: 0.75, sustain: 0.6, releaseRampMs: 120 }, bowPressure: 30 },
  5: { /* previous register: { lo: 36, hi: 89 } */ exprEnv: { attack: 0.9, peak: 1.1, sustain: 0.7, releaseRampMs: 120 }, bowPressure: 70 },
  6: { /* previous register: { lo: 43, hi: 67 } */ exprEnv: { attack: 0.7, peak: 1.0, sustain: 0.85, releaseRampMs: 160 }, bowPressure: 70 },
  7: { /* previous register: { lo: 36, hi: 60 } */ exprEnv: { attack: 0.6, peak: 1.05, sustain: 0.9, releaseRampMs: 260 }, bowPressure: 55, softBend: true },
  8: { /* previous register: { lo: 60, hi: 81 } */ exprEnv: { attack: 0.9, peak: 1.15, sustain: 1.0, releaseRampMs: 100 }, bowPressure: 100 },
};

export interface PhrasePlannerOptions {
  rng?: Rng;
  now?: () => number;
}

interface VoiceContext {
  plan: PhrasePlan;
  state: XenaKubeState;
  ev: VoiceEvent;
  rng: Rng;
  sieve: number[];
  faceEnvProfile: EnvProfile | null;
  velCurve: VelCurve;
  faceMotion: Motion | null;
  durationSec: number;
  durationMs: number;
  baseVel: number;
  voiceTurnCount: number;
  activeNotes: number[];
  glissCompanion: { offsetSemis: number; currentPitch: number; velocity: number } | null;
}

export class PhrasePlanner {
  private rng: Rng;
  private now: () => number;
  private planSeq = 0;
  private turnCount = 0;
  private sieveIdx = 0;
  private sieveDir: 1 | -1 = 1;

  constructor(options: PhrasePlannerOptions = {}) {
    this.rng = options.rng ?? Math.random;
    this.now = options.now ?? Date.now;
  }

  reset(): void {
    this.planSeq = 0;
    this.turnCount = 0;
    this.sieveIdx = 0;
    this.sieveDir = 1;
  }

  planVoiceOutput(output: VoiceOutput, state: XenaKubeState): PhrasePlan[] {
    const faceSnapshot = this.faceSnapshot(output.face);
    const isHalfTurn = output.halfTurn === true;
    const plans: PhrasePlan[] = [];

    for (const ev of output.active) {
      const voiceTurnCount = ++this.turnCount;
      const resolved = resolvePhraseDuration(
        ev.params.duration,
        faceSnapshot.durationMult,
        ev.complex,
      );
      const durationSec = isHalfTurn ? HALF_TURN_GESTURE_DURATION_SEC : resolved.durationSec;
      const durationSource: DurationSource = isHalfTurn ? 'half-turn' : resolved.durationSource;
      const intensity = isHalfTurn ? HALF_TURN_GESTURE_INTENSITY : ev.params.intensity;
      const intMap = intensityEntry(intensity);
      let peakExpr = clamp(
        isHalfTurn
          ? HALF_TURN_GESTURE_EXPR
          : intMap.expr *
            ((faceSnapshot.profile && faceSnapshot.profile.peakMult) || 1.0) *
            rateExpressionMultiplier(ev.complex, state.turnRate),
        0,
        127,
      );
      // Mirror max/xk_swam.js C2 CC 11 floor — at low K-intensities the
      // natural 0.55×peakExpr soft endpoint dips below 24; bump peakExpr
      // for C2 so the run's lowest CC 11 stays > 24 at every intensity.
      if (ev.complex === 2 && peakExpr < C2_MIN_PEAK_EXPR) {
        peakExpr = C2_MIN_PEAK_EXPR;
      }
      const plan: PhrasePlan = {
        id: ++this.planSeq,
        source: 'ts-shadow',
        mode: output.mode,
        vertexIndex: ev.vertexIndex,
        complex: ev.complex,
        face: output.face,
        halfTurn: isHalfTurn,
        durationSec,
        durationSource,
        density: ev.params.density,
        intensity,
        regime: state.regime,
        tetra: state.tetraIndex,
        faceMotion: isHalfTurn ? null : faceSnapshot.motion,
        faceEnvelope: isHalfTurn ? 'half-turn' : faceSnapshot.envelope,
        faceTranspose: isHalfTurn ? 0 : faceSnapshot.transpose,
        createdAt: this.now(),
        events: [],
        expected: {
          firstNoteOnMs: null,
          noteOnCount: 0,
          noteOffCount: 0,
          companionNoteOnCount: 0,
          bendStepCount: 0,
          releaseMs: Math.round(durationSec * 1000),
        },
        warnings: [],
      };

      const ctx: VoiceContext = {
        plan,
        state,
        ev,
        rng: this.rng,
        sieve: state.sieve.map(p => p + SIEVE_BASE),
        faceEnvProfile: isHalfTurn ? null : faceSnapshot.profile,
        velCurve: isHalfTurn ? 'accent-first' : (faceSnapshot.profile && faceSnapshot.profile.velCurve) || 'flat',
        faceMotion: isHalfTurn ? null : faceSnapshot.motion,
        durationSec,
        durationMs: Math.round(durationSec * 1000),
        baseVel: isHalfTurn
          ? HALF_TURN_GESTURE_VELOCITY
          : clamp(Math.round(intMap.vel * rateVelocityMultiplier(ev.complex, state.turnRate)), 1, 127),
        voiceTurnCount,
        activeNotes: [],
        glissCompanion: null,
      };

      if (isHalfTurn) {
        this.phraseHalfTurn(ctx);
      } else {
        this.addExpressionShape(ctx, peakExpr);
        this.dispatchComplex(ctx);
        this.addRelease(ctx);
      }
      finalizePlan(plan);
      plans.push(plan);
    }

    return plans;
  }

  private faceSnapshot(face: FaceMove | null): {
    durationMult: number | null;
    envelope: string | null;
    motion: Motion | null;
    transpose: number;
    profile: EnvProfile | null;
  } {
    if (face === null) {
      return { durationMult: null, envelope: null, motion: null, transpose: 0, profile: null };
    }
    const sig = FACE_SIGNATURES[face];
    if (!sig) {
      return { durationMult: null, envelope: null, motion: null, transpose: 0, profile: null };
    }
    return {
      durationMult: sig.durationMult,
      envelope: sig.envelope,
      motion: sig.motion,
      transpose: 0,
      profile: ENV_PROFILE[sig.envelope] ?? null,
    };
  }

  private addExpressionShape(ctx: VoiceContext, peakExpr: number): void {
    const arc = phraseArcDirection(ctx.plan.faceEnvelope, ctx.plan.complex);
    if (ctx.plan.complex === 1) {
      ctx.plan.events.push({
        kind: 'exprShape',
        tMs: 0,
        shape: 'static',
        peakExpr: Math.round(peakExpr),
        durationMs: ctx.durationMs,
      });
      return;
    }
    if (arc === 'cresc' || arc === 'dim') {
      const lo = clamp(Math.round(peakExpr * 0.30), 0, 127);
      const hi = clamp(Math.round(peakExpr), 0, 127);
      ctx.plan.events.push({
        kind: 'exprShape',
        tMs: 0,
        shape: arc,
        start: arc === 'cresc' ? lo : hi,
        end: arc === 'cresc' ? hi : lo,
        peakExpr: Math.round(peakExpr),
        durationMs: ctx.durationMs,
      });
      return;
    }
    if (arc === 'hairpin-up' || arc === 'hairpin-down') {
      const lo = clamp(Math.round(peakExpr * 0.30), 0, 127);
      const hi = clamp(Math.round(peakExpr), 0, 127);
      ctx.plan.events.push({
        kind: 'exprShape',
        tMs: 0,
        shape: arc,
        start: arc === 'hairpin-up' ? lo : hi,
        mid: arc === 'hairpin-up' ? hi : lo,
        end: arc === 'hairpin-up' ? lo : hi,
        peakExpr: Math.round(peakExpr),
        durationMs: ctx.durationMs,
      });
      return;
    }
    const cmx = COMPLEX[ctx.plan.complex];
    const attack = cmx ? Math.round(peakExpr * cmx.exprEnv.attack) : Math.round(peakExpr);
    ctx.plan.events.push({
      kind: 'exprShape',
      tMs: 0,
      shape: 'legacy',
      start: clamp(attack, 0, 127),
      peakExpr: Math.round(peakExpr),
      durationMs: ctx.durationMs,
    });
  }

  private dispatchComplex(ctx: VoiceContext): void {
    switch (ctx.plan.complex) {
      case 1: this.phraseC1(ctx); break;
      case 2: this.phraseC2(ctx); break;
      case 3: this.phraseC3(ctx); break;
      case 4: this.phraseC4(ctx); break;
      case 5: this.phraseC5(ctx); break;
      case 6: this.phraseC6(ctx); break;
      case 7: this.phraseC7(ctx); break;
      case 8: this.phraseC8(ctx); break;
      default:
        this.legatoNote(ctx, 0, this.pickPitch(ctx.plan.complex, ctx), this.humanVel(ctx, ctx.baseVel));
        break;
    }
  }

  private phraseHalfTurn(ctx: VoiceContext): void {
    const p = this.pickPitch(1, ctx);
    const companion = foldToRange(p + 7, CELLO_MIN, DOUBLE_STOP_ROLL_MAX);
    const offT = Math.min(ctx.durationMs, HALF_TURN_GESTURE_NOTE_MS);
    ctx.plan.events.push({
      kind: 'exprShape',
      tMs: 0,
      shape: 'static',
      peakExpr: HALF_TURN_GESTURE_EXPR,
      durationMs: ctx.durationMs,
    });
    this.noteOn(ctx, 0, p, HALF_TURN_GESTURE_VELOCITY);
    this.noteOn(ctx, 0, companion, Math.round(HALF_TURN_GESTURE_VELOCITY * 0.92), true);
    this.noteOff(ctx, offT, p);
    this.noteOff(ctx, offT, companion, true);
    ctx.plan.events.push({ kind: 'release', tMs: ctx.durationMs, fadeMs: HALF_TURN_GESTURE_RELEASE_MS });
    ctx.plan.events.push({
      kind: 'allNotesOff',
      tMs: ctx.durationMs + HALF_TURN_GESTURE_RELEASE_MS + 20,
    });
  }

  private phraseC1(ctx: VoiceContext): void {
    const rate = 5.0 * rateDensityMultiplier(ctx.plan.complex, ctx.state.turnRate);
    const count = Math.max(2, Math.round(ctx.durationSec * rate));
    const spacing = ctx.durationMs / count;
    for (let i = 0; i < count; i++) {
      const jitter = (this.rng() - 0.5) * spacing * 0.6;
      const t = Math.max(0, Math.round(i * spacing + jitter));
      const clusterSize = this.rng() < 0.25 ? this.rrand(2, 3) : 1;
      for (let k = 0; k < clusterSize; k++) {
        const tt = t + k * 8;
        const p = this.humanPitch(this.pickPitch(1, ctx));
        const v = this.pizzVel(ctx.baseVel * stepVelScale(ctx.velCurve, i, count));
        this.noteOn(ctx, tt, p, v);
        this.noteOff(ctx, tt + this.rrand(60, 220), p);
      }
    }
  }

  private phraseC2(ctx: VoiceContext): void {
    // Mirror of max/xk_swam.js phraseC2 — directional scalar run, NOT a
    // sustained legato cloud. Density rate-driven and within-phrase
    // tempo-curved (accel/rit/accel-rit/rit-accel coupled to arc dir);
    // emergent articulation (per-note ring time -> legato when ring >=
    // localSpacing, detache when ring < localSpacing); intentional
    // double-stops are explicit per-note branches. Phrase arc is realized
    // per-note in the bridge via velocity / CC 11 / bowPosBase shaped by
    // phraseArcDirection; CC 17 is sampled once per note and held static.
    // The plan side mirrors the noteon/noteoff structure and tempo curve
    // so the phrase auditor's expected counts and timings stay honest.
    const turnP = turnRatePressure(ctx.state.turnRate);
    const arc = phraseArcDirection(ctx.plan.faceEnvelope, ctx.plan.complex);
    const tempo = buildC2Tempo(arc, ctx.durationSec, turnP, this.rng);
    const durMs = ctx.durationMs;
    this.commitSieveWalk(tempo.count, null);
    const noteOnAbs: number[] = new Array(tempo.count);
    for (let i = 0; i < tempo.count; i++) {
      noteOnAbs[i] = Math.round(tempo.noteTimes[i]) + this.humanDelay();
    }
    const noteOnBudget = Math.max(tempo.count, Math.floor(ctx.durationSec * C2_RATE_MAX));
    let doubleSlotsRemaining = noteOnBudget - tempo.count;
    for (let i = 0; i < tempo.count; i++) {
      const tOn = noteOnAbs[i];
      const nextOn = i + 1 < tempo.count ? noteOnAbs[i + 1] : durMs;
      const spacingToNext = nextOn - tOn;
      const ring = C2_RING_MIN_MS + this.rng() * (C2_RING_MAX_MS - C2_RING_MIN_MS);
      // Mirror max/xk_swam.js phraseC2 double-stop branch — first note
      // always solo, others stochastically dyad'd with C2_DOUBLE_STOP_PROB
      // while the C2_RATE_MAX note-on budget has room.
      const isDouble = i > 0 && doubleSlotsRemaining > 0 && this.rng() < C2_DOUBLE_STOP_PROB;
      if (isDouble) doubleSlotsRemaining--;
      const cap = isDouble ? spacingToNext - C2_DOUBLE_STOP_GUARD_MS : spacingToNext;
      const noteDur = Math.max(40, Math.round(Math.min(ring, cap)));
      const v = this.humanVel(ctx, ctx.baseVel * stepVelScale(ctx.velCurve, i, tempo.count));
      const main = this.humanPitch(this.pickPitch(2, ctx));
      this.noteOn(ctx, tOn, main, v);
      this.noteOff(ctx, tOn + noteDur, main);
      if (isDouble) {
        const companion = doubleStopCompanion(main, this.rng);
        if (companion != null) {
          this.noteOn(ctx, tOn, companion, Math.max(1, Math.round(v * 0.85)), true);
          this.noteOff(ctx, tOn + noteDur, companion, true);
        }
      }
    }
  }

  private phraseC3(ctx: VoiceContext): void {
    const count = this.faceShapedCount(ctx, 3, 5, false);
    const durMs = Math.max(400, ctx.durationMs);
    const spacing = Math.max(110, Math.round(durMs / (count + 1)));
    const center = this.pickPitch(3, ctx);
    for (let i = 0; i < count; i++) {
      const t = i * spacing + this.humanDelay();
      const jitter = this.rng() < 0.5 ? 0 : (this.rng() < 0.5 ? -1 : 1);
      const p = clamp(center + jitter, CELLO_MIN, CELLO_MAX);
      const v = this.humanVel(ctx, ctx.baseVel * stepVelScale(ctx.velCurve, i, count));
      const main = this.humanPitch(p);
      this.legatoNote(ctx, t, main, v);
      this.maybeDoubleStop(ctx, t, main, v, 0.50);
    }
  }

  private phraseC4(ctx: VoiceContext): void {
    const base = this.pickPitch(4, ctx);
    const rate = 2.5 * rateDensityMultiplier(ctx.plan.complex, ctx.state.turnRate);
    const count = Math.max(2, Math.round(ctx.durationSec * rate));
    const spacing = ctx.durationMs / count;
    const avgMs = clamp(Math.round(spacing * 0.55), 280, 900);
    const minMs = Math.max(180, Math.round(avgMs * 0.6));
    const maxMs = Math.max(400, Math.round(avgMs * 1.4));
    for (let i = 0; i < count; i++) {
      const jitter = (this.rng() - 0.5) * spacing * 0.5;
      const t = Math.max(0, Math.round(i * spacing + jitter));
      const clusterSize = this.rng() < 0.50 ? 2 : 1;
      for (let k = 0; k < clusterSize; k++) {
        const pjitter = this.rrand(-2, 2) + (k > 0 ? this.rrand(2, 5) : 0);
        const p = foldToRange(base + pjitter, CELLO_MIN, CELLO_MAX);
        const v = clamp(
          this.humanVel(ctx, ctx.baseVel * stepVelScale(ctx.velCurve, i, count)) - 15,
          25,
          100,
        );
        const hp = this.humanPitch(p);
        this.noteOn(ctx, t, hp, v);
        this.noteOff(ctx, t + this.rrand(minMs, maxMs), hp);
      }
    }
  }

  private phraseC5(ctx: VoiceContext): void {
    const requestedCount = Math.max(WILD_MIN_COUNT, this.faceShapedCount(ctx, 4, 9, true));
    const minLeap = 8;
    let lastPitch = this.pickPitch(5, ctx);
    const wildAccent = rateAccentValue(WILD_GLISS_BPA, ctx.plan.complex, ctx.state.turnRate);
    const tailEnd = Math.max(FIRST_GLISS_MS + 200, ctx.durationMs * 0.92);
    // D78 — variable-gap schedule mirror of bridge's phraseC5.
    const times = wildGlissSchedule(requestedCount, FIRST_GLISS_MS, tailEnd, MIN_GLISS_SPACING_MS, this.rng);
    const targets: number[] = new Array(times.length);
    let previewPitch = lastPitch;
    let pathMin = previewPitch;
    let pathMax = previewPitch;
    for (let i = 0; i < times.length; i++) {
      let p = this.pickPitch(5, ctx);
      let attempts = 0;
      while (Math.abs(p - previewPitch) < minLeap && attempts < 12) {
        p = this.pickPitch(5, ctx);
        attempts++;
      }
      if (Math.abs(p - previewPitch) < minLeap) {
        p = previewPitch + (p >= previewPitch ? minLeap : -minLeap);
        p = clamp(p, CELLO_MIN, CELLO_MAX);
      }
      targets[i] = p;
      pathMin = Math.min(pathMin, p);
      pathMax = Math.max(pathMax, p);
      previewPitch = p;
    }
    const anchorVel = this.humanVel(ctx, ctx.baseVel * stepVelScale(ctx.velCurve, 0, times.length + 1));
    this.legatoNote(ctx, 0, lastPitch, anchorVel);
    this.maybeGlissDoubleStop(ctx, 0, lastPitch, anchorVel, 0.50, pathMin, pathMax);

    const phraseEndMs = ctx.durationMs - 100;
    for (let i = 0; i < times.length; i++) {
      const t = times[i];
      const nextEventMs = i + 1 < times.length ? times[i + 1] : phraseEndMs;
      const gapMs = nextEventMs - t;
      const bendDur = Math.max(80, Math.min(gapMs - 50, MAX_BEND_DUR_MS));
      lastPitch = this.glissStep(ctx, t, lastPitch, targets[i], minLeap, WILD_GLISS_VEL, wildAccent, bendDur);
    }
  }

  private phraseC6(ctx: VoiceContext): void {
    let requestedCount = this.faceShapedCount(ctx, 3, 6, false);
    if (requestedCount < 2) requestedCount = 2;
    const tailEnd = Math.max(FIRST_GLISS_MS + 200, ctx.durationMs * 0.9);
    const slideTimes = glissSchedule(requestedCount - 1, FIRST_GLISS_MS, tailEnd, MIN_GLISS_SPACING_MS);
    const totalCount = 1 + slideTimes.length;
    this.commitSieveWalk(totalCount, null);
    let lastPitch = this.pickPitch(6, ctx);
    const targets: number[] = new Array(slideTimes.length);
    let pathMin = lastPitch;
    let pathMax = lastPitch;
    for (let i = 0; i < slideTimes.length; i++) {
      const p = this.pickPitch(6, ctx);
      targets[i] = p;
      pathMin = Math.min(pathMin, p);
      pathMax = Math.max(pathMax, p);
    }
    const anchorT = this.humanDelay();
    const v = this.humanVel(ctx, ctx.baseVel * stepVelScale(ctx.velCurve, 0, totalCount));
    this.legatoNote(ctx, anchorT, lastPitch, v);
    this.maybeGlissDoubleStop(ctx, anchorT, lastPitch, v, 0.50, pathMin, pathMax);

    const phraseEndMs = ctx.durationMs - 100;
    for (let i = 0; i < slideTimes.length; i++) {
      const t = slideTimes[i] + this.humanDelay();
      const nextEventMs = i + 1 < slideTimes.length ? slideTimes[i + 1] : phraseEndMs;
      const gapMs = nextEventMs - slideTimes[i];
      const bendDur = Math.max(80, Math.min(gapMs - 50, MAX_BEND_DUR_MS));
      lastPitch = this.glissStep(ctx, t, lastPitch, targets[i], 1, 18, undefined, bendDur);
    }
  }

  private phraseC7(ctx: VoiceContext): void {
    const isSingle = ctx.faceEnvProfile?.isSingle === true;
    const p1 = this.pickPitch(7, ctx);
    let lastPitch = p1;
    this.legatoNote(ctx, 0, p1, this.humanVel(ctx, ctx.baseVel));
    // D79 — driftCount baseline bumped (was 1 / 1-3) so the post-bend held
    // tail shrinks from ~470 ms to ~50 ms in a typical 1.8 s phrase.
    let driftCount = isSingle ? 2 : 2 + this.rrand(1, 2);
    if (!isSingle && ctx.faceEnvProfile && ctx.faceEnvProfile.countMult > 1.0) {
      driftCount = Math.min(6, Math.round(driftCount * ctx.faceEnvProfile.countMult));
    }
    if (!isSingle) {
      driftCount = Math.min(
        6,
        Math.max(2, Math.round(driftCount * rateDensityMultiplier(ctx.plan.complex, ctx.state.turnRate))),
      );
    }
    const tailEnd = Math.max(FIRST_GLISS_MS_C7 + 250, ctx.durationMs * 0.88);
    // D79 — variable-gap schedule mirror of bridge's phraseC7.
    const times = wildGlissSchedule(driftCount, FIRST_GLISS_MS_C7, tailEnd, MIN_GLISS_SPACING_MS, this.rng);
    const phraseStartSign = this.rng() < 0.5 ? 1 : -1;
    const phraseEndMs = ctx.durationMs - 100;
    for (let i = 0; i < times.length; i++) {
      const t = times[i];
      const nextEventMs = i + 1 < times.length ? times[i + 1] : phraseEndMs;
      const gapMs = nextEventMs - t;
      const bendDur = Math.max(80, Math.min(gapMs - 50, MAX_BEND_DUR_MS));
      const sign = phraseStartSign * (i % 2 === 0 ? 1 : -1);
      const mag = this.rrand(1, 2);
      const p2 = clamp(p1 + sign * mag, CELLO_MIN, CELLO_MAX);
      lastPitch = this.glissStep(ctx, t, lastPitch, p2, 1, 18, undefined, bendDur);
    }
  }

  private phraseC8(ctx: VoiceContext): void {
    const mainPitch = this.pickPitch(8, ctx);
    const companion = this.rng() < 0.50 ? doubleStopCompanion(mainPitch, this.rng) : null;
    const t = this.humanDelay();
    const v = clamp(this.humanVel(ctx, ctx.baseVel * stepVelScale(ctx.velCurve, 0, 1)) + 8, 40, 120);
    const main = this.humanPitch(mainPitch);
    this.legatoNote(ctx, t, main, v);
    if (companion != null) {
      this.noteOn(ctx, t, companion, Math.max(1, Math.round(v * 0.85)), true);
    }
  }

  private pickPitch(complexType: number, ctx: VoiceContext): number {
    const s = ctx.sieve;
    if (s.length === 0) return foldToRange(36, CELLO_MIN, CELLO_MAX);

    let pitch: number;
    switch (complexType) {
      case 1:
      case 3:
      case 4:
      case 5:
      case 7:
      case 8:
        pitch = s[Math.floor(this.rng() * s.length)];
        break;
      case 2:
      case 6:
        pitch = s[this.sieveIdx];
        this.sieveIdx += this.sieveDir;
        if (this.sieveIdx >= s.length) {
          this.sieveIdx = s.length - 2;
          this.sieveDir = -1;
        }
        if (this.sieveIdx < 0) {
          this.sieveIdx = 1;
          this.sieveDir = 1;
        }
        this.sieveIdx = clamp(this.sieveIdx, 0, s.length - 1);
        break;
      default:
        pitch = s[0];
    }
    return foldToRange(pitch, CELLO_MIN, CELLO_MAX);
  }

  private commitSieveWalk(count: number, motion: Motion | null): void {
    // This mirrors max/xk_swam.js's mutable commitSieveWalk. It deliberately
    // commits against the current incoming sieve length, while pitch picking
    // itself clamps the index if a later state burst changes the sieve.
    const len = Math.max(1, this.lastSieveLength);
    if (motion === 'up') {
      this.sieveDir = 1;
      if (this.sieveIdx + count - 1 >= len) this.sieveIdx = 0;
      return;
    }
    if (motion === 'down') {
      this.sieveDir = -1;
      if (this.sieveIdx - (count - 1) < 0) this.sieveIdx = len - 1;
      return;
    }
    if (this.sieveDir > 0 && this.sieveIdx + count - 1 >= len) {
      this.sieveDir = -1;
      this.sieveIdx = len - 1;
    } else if (this.sieveDir < 0 && this.sieveIdx - (count - 1) < 0) {
      this.sieveDir = 1;
      this.sieveIdx = 0;
    }
  }

  private get lastSieveLength(): number {
    // set by pickPitch/commit callers through the current plan context; if no
    // phrase has supplied a sieve yet, the starting Max sieve has 7 pitches.
    return this._lastSieveLength;
  }

  private _lastSieveLength = 7;

  private faceShapedCount(ctx: VoiceContext, baseLo: number, baseHi: number, forGliss: boolean): number {
    this._lastSieveLength = ctx.sieve.length || this._lastSieveLength;
    const prof = ctx.faceEnvProfile;
    if (prof && prof.isSingle) return forGliss ? 1 : 1;
    let raw = this.phraseCount(ctx, baseLo, baseHi);
    if (prof && prof.countMult && prof.countMult !== 1.0) {
      raw = clamp(Math.round(raw * prof.countMult), baseLo, 12);
    }
    return raw;
  }

  private phraseCount(ctx: VoiceContext, baseLo: number, baseHi: number): number {
    const intMap = intensityEntry(ctx.ev.params.intensity);
    const iMult = intMap.density;
    const dMult = clamp(0.6 + ctx.ev.params.density * 0.25, 0.6, 1.8);
    const rMult = rateDensityMultiplier(ctx.plan.complex, ctx.state.turnRate);
    const lo = Math.max(1, Math.round(baseLo * iMult));
    const hi = Math.max(lo, Math.round(baseHi * iMult * dMult * rMult));
    return this.rrand(lo, hi);
  }

  private legatoNote(ctx: VoiceContext, tMs: number, pitch: number, vel: number): void {
    const oldNotes = ctx.activeNotes.slice();
    this.noteOn(ctx, tMs, pitch, vel);
    for (const old of oldNotes) this.noteOff(ctx, tMs + LEGATO_OVERLAP_MS, old);
  }

  private glissStep(
    ctx: VoiceContext,
    tMs: number,
    sourcePitch: number,
    targetPitch: number,
    minLeap: number,
    glissVel = 18,
    accent?: number,
    desiredDurMs?: number,
  ): number {
    let p = targetPitch;
    if (Math.abs(p - sourcePitch) < minLeap) {
      p = sourcePitch + (p >= sourcePitch ? minLeap : -minLeap);
      p = clamp(p, CELLO_MIN, CELLO_MAX);
    }
    const overRange = Math.abs(p - sourcePitch) > PITCHBEND_RANGE_SEMI;
    if (overRange) {
      ctx.plan.warnings.push(`over-range gliss planned as leap C${ctx.plan.complex} ${sourcePitch}->${p}`);
      this.noteOff(ctx, tMs, sourcePitch);
      this.noteOn(ctx, tMs + 50, p, this.humanVel(ctx, ctx.baseVel));
      return p;
    }
    const durMs = clamp(Math.round(desiredDurMs ?? bendDur(sourcePitch, p, ctx.plan.complex)), 80, MAX_BEND_DUR_MS);
    ctx.plan.events.push({
      kind: 'bendStep',
      tMs: Math.round(tMs),
      fromPitch: Math.round(sourcePitch),
      toPitch: Math.round(p),
      durMs,
      velocity: glissVel,
      accent,
    });
    ctx.plan.expected.bendStepCount++;
    // D80 — softBend (C7) keeps the bow on the original anchor for the whole
    // phrase; the bridge's `completeBend` skips the per-bend rebow, so the
    // plan must not predict noteOff(source) + noteOn(target) either.
    // Anchor's noteOff fires at phrase release via the planner's natural
    // close-out path (matches the bridge's allNotesOff in scheduleRelease).
    const cmx = COMPLEX[ctx.plan.complex];
    if (!(cmx && cmx.softBend === true)) {
      this.noteOff(ctx, tMs + durMs, sourcePitch);
      if (ctx.glissCompanion) {
        const oldCompanion = ctx.glissCompanion.currentPitch;
        const newCompanion = p + ctx.glissCompanion.offsetSemis;
        this.noteOff(ctx, tMs + durMs, oldCompanion, true);
        if (newCompanion >= DOUBLE_STOP_ROLL_MIN && newCompanion <= DOUBLE_STOP_ROLL_MAX) {
          this.noteOn(ctx, tMs + durMs, newCompanion, ctx.glissCompanion.velocity, true);
          ctx.glissCompanion.currentPitch = newCompanion;
        } else {
          ctx.plan.warnings.push(`gliss companion target out of range C${ctx.plan.complex} ${newCompanion}`);
          ctx.glissCompanion = null;
        }
      }
      this.noteOn(ctx, tMs + durMs, p, glissVel);
    }
    return p;
  }

  private maybeDoubleStop(ctx: VoiceContext, tMs: number, mainPitch: number, vel: number, p: number): number | null {
    if (this.rng() >= p) return null;
    const companion = doubleStopCompanion(mainPitch, this.rng);
    if (companion == null) return null;
    this.noteOn(ctx, tMs, companion, Math.max(1, Math.round(vel * 0.85)), true);
    return companion;
  }

  private maybeGlissDoubleStop(
    ctx: VoiceContext,
    tMs: number,
    mainPitch: number,
    vel: number,
    p: number,
    minMainPitch: number,
    maxMainPitch: number,
  ): number | null {
    if (this.rng() >= p) return null;
    const companion = doubleStopCompanionForRange(
      mainPitch,
      minMainPitch,
      maxMainPitch,
      DOUBLE_STOP_ROLL_MIN,
      DOUBLE_STOP_ROLL_MAX,
      this.rng,
    );
    if (companion == null) {
      ctx.plan.warnings.push(`gliss companion skipped outside range C${ctx.plan.complex} span=${minMainPitch}..${maxMainPitch}`);
      return null;
    }
    const velocity = Math.max(1, Math.round(vel * 0.85));
    this.noteOn(ctx, tMs, companion, velocity, true);
    ctx.glissCompanion = {
      offsetSemis: companion - mainPitch,
      currentPitch: companion,
      velocity,
    };
    return companion;
  }

  private noteOn(ctx: VoiceContext, tMs: number, pitch: number, velocity: number, isCompanion = false): void {
    const p = clamp(Math.round(pitch), CELLO_MIN, CELLO_MAX);
    ctx.activeNotes.push(p);
    ctx.plan.events.push({
      kind: 'noteOn',
      tMs: Math.max(0, Math.round(tMs)),
      pitch: p,
      velocity: clamp(Math.round(velocity), 1, 127),
      isCompanion: isCompanion || undefined,
    });
  }

  private noteOff(ctx: VoiceContext, tMs: number, pitch: number, isCompanion = false): void {
    const p = Math.round(pitch);
    const idx = ctx.activeNotes.indexOf(p);
    if (idx >= 0) ctx.activeNotes.splice(idx, 1);
    ctx.plan.events.push({
      kind: 'noteOff',
      tMs: Math.max(0, Math.round(tMs)),
      pitch: p,
      velocity: ctx.plan.face ? ART_OFF_VEL[FACE_SIGNATURES[ctx.plan.face].articulation] : undefined,
      isCompanion: isCompanion || undefined,
    });
  }

  private addRelease(ctx: VoiceContext): void {
    const cmx = COMPLEX[ctx.plan.complex];
    const prof = ctx.faceEnvProfile;
    const fadeMs = Math.max(20, Math.round((cmx?.exprEnv.releaseRampMs ?? 120) * (prof?.releaseMult ?? 1.0)));
    ctx.plan.events.push({ kind: 'release', tMs: ctx.durationMs, fadeMs });
    ctx.plan.events.push({ kind: 'allNotesOff', tMs: ctx.durationMs + fadeMs + 20 });
  }

  private rrand(lo: number, hi: number): number {
    return Math.floor(this.rng() * (hi - lo + 1)) + lo;
  }

  private humanVel(ctx: VoiceContext, base: number): number {
    const jitter = (this.rng() - 0.5) * 0.3 * base;
    const accent = ctx.voiceTurnCount % 3 === 0 ? 8 : 0;
    return clamp(Math.round(base + jitter + accent), 20, 127);
  }

  private pizzVel(centerVel: number): number {
    const u1 = Math.max(1e-6, this.rng());
    const u2 = this.rng();
    const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    const sigma = centerVel * 0.25;
    return clamp(Math.round(centerVel + z * sigma), 20, 127);
  }

  private humanPitch(pitch: number): number {
    let p = pitch;
    if (this.rng() < 0.1) p += this.rng() < 0.5 ? -1 : 1;
    return clamp(p, CELLO_MIN, CELLO_MAX);
  }

  private humanDelay(): number {
    return Math.floor(this.rng() * 30);
  }
}

function finalizePlan(plan: PhrasePlan): void {
  plan.events.sort((a, b) => a.tMs - b.tMs || kindOrd(a.kind) - kindOrd(b.kind));
  let firstNoteOn: number | null = null;
  let noteOnCount = 0;
  let noteOffCount = 0;
  let companionNoteOnCount = 0;
  for (const ev of plan.events) {
    if (ev.kind === 'noteOn') {
      noteOnCount++;
      if (firstNoteOn == null) firstNoteOn = ev.tMs;
      if (ev.isCompanion) companionNoteOnCount++;
    } else if (ev.kind === 'noteOff') {
      noteOffCount++;
    }
  }
  plan.expected.firstNoteOnMs = firstNoteOn;
  plan.expected.noteOnCount = noteOnCount;
  plan.expected.noteOffCount = noteOffCount;
  plan.expected.companionNoteOnCount = companionNoteOnCount;
}

function kindOrd(kind: PhraseEventKind): number {
  switch (kind) {
    case 'exprShape': return 0;
    case 'bendStep': return 1;
    case 'noteOff': return 2;
    case 'noteOn': return 3;
    case 'release': return 4;
    case 'allNotesOff': return 5;
    default: return 9;
  }
}

function phraseArcDirection(faceEnvelope: string | null, complex: number): ExprShapeEvent['shape'] | null {
  if (complex === 1) return null;
  if (!faceEnvelope) return null;
  if (faceEnvelope === 'swell') return 'cresc';
  if (faceEnvelope === 'fade') return 'dim';
  if (faceEnvelope === 'burst') return 'dim';
  if (faceEnvelope === 'hairpin-up') return 'hairpin-up';
  if (faceEnvelope === 'hairpin-down') return 'hairpin-down';
  return null;
}

// Mirror of max/xk_swam.js C2 tunables. All constants must match the
// bridge for the auditor to predict realistic timings, articulation,
// dynamics, and double-stop rate.
const C2_RATE_MIN = 3;
const C2_RATE_LOW_MAX = 4;
const C2_RATE_FAST_MIN = 5;
// Final post-turn-rate-pressure ceiling for the C2 local main-note tempo.
// C2 companion dyads are budgeted separately so total scheduled note-ons
// also stay within duration * C2_RATE_MAX. Keep this mirrored with
// max/xk_swam.js buildC2Tempo().
const C2_RATE_MAX = 10;
// Fraction of phrase time by which the C2 tempo curve completes. Mirrors
// max/xk_swam.js; the phrase tail holds the curve's terminal rate.
const C2_CURVE_END_U = 0.5;
const C2_RING_MIN_MS = 120;
const C2_RING_MAX_MS = 320;
const C2_MIN_PEAK_EXPR = 46;
const C2_DOUBLE_STOP_PROB = 0.30;
const C2_DOUBLE_STOP_GUARD_MS = 5;

interface C2Tempo {
  count: number;
  noteTimes: number[];
  tempoLabel: string;
}

function buildC2Tempo(
  arcDir: ExprShapeEvent['shape'] | null,
  durSec: number,
  turnP: number,
  rng: Rng,
): C2Tempo {
  const loRate = C2_RATE_MIN + turnP * (C2_RATE_FAST_MIN - C2_RATE_MIN);
  const hiRate = Math.min(C2_RATE_MAX,
    C2_RATE_LOW_MAX + turnP * (C2_RATE_MAX - C2_RATE_LOW_MAX));
  const spanFactor = hiRate / loRate;

  let dirSign = 0;
  let triangle = false;
  let trianglePeak = false;
  if (arcDir === 'cresc') dirSign = +1;
  else if (arcDir === 'dim') dirSign = -1;
  else if (arcDir === 'hairpin-up') { triangle = true; trianglePeak = true; }
  else if (arcDir === 'hairpin-down') { triangle = true; trianglePeak = false; }
  else dirSign = rng() < 0.5 ? +1 : -1;

  const tempoCurve = (u: number): number => {
    const w = Math.min(1, u / C2_CURVE_END_U);
    if (triangle) {
      const v = 1 - Math.abs(2 * w - 1);
      return trianglePeak
        ? loRate * Math.pow(spanFactor, v)
        : hiRate * Math.pow(spanFactor, -v);
    }
    return dirSign > 0
      ? loRate * Math.pow(spanFactor, w)
      : hiRate * Math.pow(spanFactor, -w);
  };

  const SAMPLES = 100;
  const phase = new Array<number>(SAMPLES + 1);
  phase[0] = 0;
  for (let s = 1; s <= SAMPLES; s++) {
    phase[s] = phase[s - 1] +
      0.5 * (tempoCurve((s - 1) / SAMPLES) + tempoCurve(s / SAMPLES)) / SAMPLES;
  }
  const tempoAvg = phase[SAMPLES];
  const count = Math.max(2, Math.round(durSec * tempoAvg));

  const durMs = durSec * 1000;
  const noteTimes = new Array<number>(count);
  for (let k = 0; k < count; k++) {
    const target = (k / count) * tempoAvg;
    let loIdx = 0;
    let hiIdx = SAMPLES;
    while (loIdx < hiIdx - 1) {
      const mid = (loIdx + hiIdx) >> 1;
      if (phase[mid] <= target) loIdx = mid;
      else hiIdx = mid;
    }
    const span = phase[hiIdx] - phase[loIdx];
    const u = (loIdx + (span > 1e-9 ? (target - phase[loIdx]) / span : 0)) / SAMPLES;
    noteTimes[k] = u * durMs;
  }

  let tempoLabel: string;
  if (triangle) tempoLabel = trianglePeak ? 'accel-rit' : 'rit-accel';
  else if (arcDir) tempoLabel = dirSign > 0 ? 'accel' : 'rit';
  else tempoLabel = dirSign > 0 ? 'rand-accel' : 'rand-rit';

  return { count, noteTimes, tempoLabel };
}

function foldToRange(pitch: number, lo: number = CELLO_MIN, hi: number = CELLO_MAX): number {
  let p = pitch;
  while (p < lo) p += 12;
  while (p > hi) p -= 12;
  return clamp(p, lo, hi);
}

function glissSchedule(maxCount: number, firstMs: number, tailEnd: number, minSpacingMs: number): number[] {
  const times = [firstMs];
  if (maxCount <= 1) return times;
  const available = tailEnd - firstMs;
  const idealSpacing = available / (maxCount - 1);
  const spacing = Math.max(minSpacingMs, idealSpacing);
  for (let i = 1; i < maxCount; i++) {
    const t = firstMs + Math.round(i * spacing);
    if (t > tailEnd) break;
    times.push(t);
  }
  return times;
}

// D78/D79 — wild-gliss schedule with stochastic gap variation. Mirror of
// `wildGlissSchedule` in `max/xk_swam.js`. Used by phraseC5 and phraseC7
// in the planner so predicted event counts match the bridge's varied-
// rhythm output. Bridge uses Math.random; planner uses its seeded `rng`
// — exact times differ but the count + clip-not-collapse policy match.
function wildGlissSchedule(
  maxCount: number,
  firstMs: number,
  tailEnd: number,
  minSpacingMs: number,
  rng: Rng,
): number[] {
  const times = [firstMs];
  if (maxCount <= 1) return times;
  const nGaps = maxCount - 1;
  const available = tailEnd - firstMs;
  const rawGaps: number[] = [];
  let rawTotal = 0;
  for (let i = 0; i < nGaps; i++) {
    const g = 0.4 + 1.6 * Math.pow(rng(), 2);
    rawGaps.push(g);
    rawTotal += g;
  }
  const scale = rawTotal > 0 ? available / rawTotal : 1;
  let t = firstMs;
  for (let i = 0; i < nGaps; i++) {
    const gap = Math.max(minSpacingMs, rawGaps[i] * scale);
    t += gap;
    if (t > tailEnd) break;
    times.push(Math.round(t));
  }
  return times;
}

function bendDur(fromPitch: number, toPitch: number, complex: number): number {
  const interval = Math.abs(Math.round(toPitch) - Math.round(fromPitch));
  const perSemi = complex === 5 ? 50 : complex === 6 ? 100 : complex === 7 ? 115 : 80;
  return clamp(Math.round(interval * perSemi), 80, Math.min(MIN_GLISS_SPACING_MS - 5, MAX_BEND_DUR_MS));
}

const DOUBLE_STOP_INTERVALS = [3, 4, 5, 7, 8, 9, 12];

function doubleStopCompanion(mainPitch: number, rng: Rng): number | null {
  const interval = DOUBLE_STOP_INTERVALS[Math.floor(rng() * DOUBLE_STOP_INTERVALS.length)];
  let dirPref: 1 | -1;
  if (mainPitch >= 60) dirPref = -1;
  else if (mainPitch <= 48) dirPref = 1;
  else dirPref = rng() < 0.5 ? 1 : -1;

  let candidate = mainPitch + dirPref * interval;
  if (candidate < CELLO_MIN || candidate > 77) candidate = mainPitch - dirPref * interval;
  if (candidate < CELLO_MIN || candidate > CELLO_MAX) return null;
  if (candidate === mainPitch) return null;
  return candidate;
}

function doubleStopCompanionForRange(
  mainPitch: number,
  mainMin: number,
  mainMax: number,
  rangeLo: number,
  rangeHi: number,
  rng: Rng,
): number | null {
  mainMin = Math.min(mainMin, mainPitch);
  mainMax = Math.max(mainMax, mainPitch);
  const intervals = DOUBLE_STOP_INTERVALS.slice();
  for (let i = intervals.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [intervals[i], intervals[j]] = [intervals[j], intervals[i]];
  }
  let dirPref: 1 | -1;
  if (mainPitch >= 60) dirPref = -1;
  else if (mainPitch <= 48) dirPref = 1;
  else dirPref = rng() < 0.5 ? 1 : -1;
  const dirs: Array<1 | -1> = [dirPref, (dirPref === 1 ? -1 : 1)];
  for (const interval of intervals) {
    for (const dir of dirs) {
      const offset = dir * interval;
      const candidate = mainPitch + offset;
      if (candidate === mainPitch) continue;
      if (candidate < rangeLo || candidate > rangeHi) continue;
      if (mainMin + offset < rangeLo) continue;
      if (mainMax + offset > rangeHi) continue;
      return candidate;
    }
  }
  return null;
}

function intensityDensity(intensity: string): number {
  return (INTENSITY_MAP[intensity as IntensityLabel] ?? INTENSITY_MAP.mf).density;
}

export function phrasePlanSummary(plan: PhrasePlan): string {
  const first = plan.expected.firstNoteOnMs == null ? '-' : `${plan.expected.firstNoteOnMs}ms`;
  const half = plan.halfTurn ? ' half-turn=1' : '';
  return `P${plan.id} C${plan.complex} face=${plan.face ?? '-'}${half} dur=${plan.durationSec.toFixed(2)}s events=${plan.events.length} noteons=${plan.expected.noteOnCount} bends=${plan.expected.bendStepCount} companions=${plan.expected.companionNoteOnCount} first=${first}`;
}
