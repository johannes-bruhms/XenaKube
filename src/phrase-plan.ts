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
  faceTranspose,
  intensityEntry,
  rateAccentValue,
  rateDensityMultiplier,
  rateExpressionMultiplier,
  rateVelocityMultiplier,
  resolvePhraseDuration,
  stepVelScale,
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
  register: { lo: number; hi: number };
  exprEnv: {
    attack: number;
    peak: number;
    sustain: number;
    releaseRampMs: number;
  };
  bowPressure: number;
}

const COMPLEX: Record<number, ComplexRuntime> = {
  1: { register: { lo: 36, hi: 72 }, exprEnv: { attack: 1.0, peak: 1.0, sustain: 0.4, releaseRampMs: 60 }, bowPressure: 64 },
  2: { register: { lo: 40, hi: 64 }, exprEnv: { attack: 0.6, peak: 1.0, sustain: 0.85, releaseRampMs: 140 }, bowPressure: 70 },
  3: { register: { lo: 36, hi: 55 }, exprEnv: { attack: 0.5, peak: 1.1, sustain: 0.9, releaseRampMs: 220 }, bowPressure: 55 },
  4: { register: { lo: 60, hi: 84 }, exprEnv: { attack: 0.7, peak: 0.75, sustain: 0.6, releaseRampMs: 120 }, bowPressure: 30 },
  5: { register: { lo: 36, hi: 89 }, exprEnv: { attack: 0.9, peak: 1.1, sustain: 0.7, releaseRampMs: 120 }, bowPressure: 70 },
  6: { register: { lo: 43, hi: 67 }, exprEnv: { attack: 0.7, peak: 1.0, sustain: 0.85, releaseRampMs: 160 }, bowPressure: 70 },
  7: { register: { lo: 36, hi: 52 }, exprEnv: { attack: 0.4, peak: 1.05, sustain: 0.9, releaseRampMs: 260 }, bowPressure: 55 },
  8: { register: { lo: 60, hi: 81 }, exprEnv: { attack: 0.9, peak: 1.15, sustain: 1.0, releaseRampMs: 100 }, bowPressure: 100 },
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
  faceTr: number;
  durationSec: number;
  durationMs: number;
  baseVel: number;
  voiceTurnCount: number;
  activeNotes: number[];
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
    const plans: PhrasePlan[] = [];

    for (const ev of output.active) {
      const voiceTurnCount = ++this.turnCount;
      const { durationSec, durationSource } = resolvePhraseDuration(
        ev.params.duration,
        faceSnapshot.durationMult,
        ev.complex,
      );
      const intMap = intensityEntry(ev.params.intensity);
      const peakExpr = clamp(
        intMap.expr *
          ((faceSnapshot.profile && faceSnapshot.profile.peakMult) || 1.0) *
          rateExpressionMultiplier(ev.complex, state.turnRate),
        0,
        127,
      );
      const plan: PhrasePlan = {
        id: ++this.planSeq,
        source: 'ts-shadow',
        mode: output.mode,
        vertexIndex: ev.vertexIndex,
        complex: ev.complex,
        face: output.face,
        durationSec,
        durationSource,
        density: ev.params.density,
        intensity: ev.params.intensity,
        regime: state.regime,
        tetra: state.tetraIndex,
        faceMotion: faceSnapshot.motion,
        faceEnvelope: faceSnapshot.envelope,
        faceTranspose: faceSnapshot.transpose,
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
        faceEnvProfile: faceSnapshot.profile,
        velCurve: (faceSnapshot.profile && faceSnapshot.profile.velCurve) || 'flat',
        faceMotion: faceSnapshot.motion,
        faceTr: faceSnapshot.transpose,
        durationSec,
        durationMs: Math.round(durationSec * 1000),
        baseVel: clamp(Math.round(intMap.vel * rateVelocityMultiplier(ev.complex, state.turnRate)), 1, 127),
        voiceTurnCount,
        activeNotes: [],
      };

      this.addExpressionShape(ctx, peakExpr);
      this.dispatchComplex(ctx);
      this.addRelease(ctx);
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
      transpose: faceTranspose(sig.registerBias, sig.motion, this.turnCount),
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
    const hi = ctx.state.regime === 'burst' ? 6 : 5;
    const count = this.faceShapedCount(ctx, 3, hi, false);
    if (count >= 2) this.commitSieveWalk(count, ctx.faceMotion);
    const spacing = Math.max(90, Math.round(ctx.durationMs / (count + 1)));
    for (let i = 0; i < count; i++) {
      const t = i * spacing + this.humanDelay();
      const v = this.humanVel(ctx, ctx.baseVel * stepVelScale(ctx.velCurve, i, count));
      const main = this.humanPitch(this.pickPitch(2, ctx));
      this.legatoNote(ctx, t, main, v);
      this.maybeDoubleStop(ctx, t, main, v, 0.50);
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
    const s = ctx.sieve;
    const base = s.length > 0 ? s[Math.floor(s.length / 2)] : 60;
    const cmx = COMPLEX[4];
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
        const p = foldToRange(base + ctx.faceTr + pjitter, cmx.register.lo, cmx.register.hi);
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
    let companion: number | null = null;
    const wildAccent = rateAccentValue(WILD_GLISS_BPA, ctx.plan.complex, ctx.state.turnRate);
    const tailEnd = Math.max(FIRST_GLISS_MS + 200, ctx.durationMs * 0.92);
    const times = glissSchedule(requestedCount, FIRST_GLISS_MS, tailEnd, MIN_GLISS_SPACING_MS);
    const anchorVel = this.humanVel(ctx, ctx.baseVel * stepVelScale(ctx.velCurve, 0, times.length + 1));
    this.legatoNote(ctx, 0, lastPitch, anchorVel);
    companion = this.maybeDoubleStop(ctx, 0, lastPitch, anchorVel, 0.50);

    const phraseEndMs = ctx.durationMs - 100;
    for (let i = 0; i < times.length; i++) {
      const t = times[i];
      if (companion != null) {
        this.noteOff(ctx, t, companion, true);
        companion = null;
      }
      let p = this.pickPitch(5, ctx);
      let attempts = 0;
      while (Math.abs(p - lastPitch) < minLeap && attempts < 12) {
        p = this.pickPitch(5, ctx);
        attempts++;
      }
      const nextEventMs = i + 1 < times.length ? times[i + 1] : phraseEndMs;
      const gapMs = nextEventMs - t;
      const bendDur = Math.max(80, Math.min(gapMs - 50, MAX_BEND_DUR_MS));
      lastPitch = this.glissStep(ctx, t, lastPitch, p, minLeap, WILD_GLISS_VEL, wildAccent, bendDur);
      const slideVel = this.humanVel(ctx, ctx.baseVel * stepVelScale(ctx.velCurve, i + 1, times.length + 1));
      companion = this.maybeDoubleStop(ctx, t, lastPitch, slideVel, 0.50);
    }
  }

  private phraseC6(ctx: VoiceContext): void {
    let requestedCount = this.faceShapedCount(ctx, 3, 6, false);
    if (requestedCount < 2) requestedCount = 2;
    const tailEnd = Math.max(FIRST_GLISS_MS + 200, ctx.durationMs * 0.9);
    const slideTimes = glissSchedule(requestedCount - 1, FIRST_GLISS_MS, tailEnd, MIN_GLISS_SPACING_MS);
    const totalCount = 1 + slideTimes.length;
    this.commitSieveWalk(totalCount, ctx.faceMotion);
    let lastPitch = this.pickPitch(6, ctx);
    const anchorT = this.humanDelay();
    const v = this.humanVel(ctx, ctx.baseVel * stepVelScale(ctx.velCurve, 0, totalCount));
    this.legatoNote(ctx, anchorT, lastPitch, v);
    this.maybeDoubleStop(ctx, anchorT, lastPitch, v, 0.50);

    const phraseEndMs = ctx.durationMs - 100;
    for (let i = 0; i < slideTimes.length; i++) {
      const t = slideTimes[i] + this.humanDelay();
      const p = this.pickPitch(6, ctx);
      const nextEventMs = i + 1 < slideTimes.length ? slideTimes[i + 1] : phraseEndMs;
      const gapMs = nextEventMs - slideTimes[i];
      const bendDur = Math.max(80, Math.min(gapMs - 50, MAX_BEND_DUR_MS));
      lastPitch = this.glissStep(ctx, t, lastPitch, p, 1, 18, undefined, bendDur);
    }
  }

  private phraseC7(ctx: VoiceContext): void {
    const isSingle = ctx.faceEnvProfile?.isSingle === true;
    const p1 = this.pickPitch(7, ctx);
    let lastPitch = p1;
    this.legatoNote(ctx, 0, p1, this.humanVel(ctx, ctx.baseVel));
    let driftCount = isSingle ? 1 : 1 + (intensityDensity(ctx.ev.params.intensity) >= 1.1 ? this.rrand(1, 2) : 0);
    if (!isSingle && ctx.faceEnvProfile && ctx.faceEnvProfile.countMult > 1.0) {
      driftCount = Math.min(6, Math.round(driftCount * ctx.faceEnvProfile.countMult));
    }
    if (!isSingle) {
      driftCount = Math.min(
        6,
        Math.max(1, Math.round(driftCount * rateDensityMultiplier(ctx.plan.complex, ctx.state.turnRate))),
      );
    }
    const motionDir = ctx.faceMotion === 'up' ? 1 : ctx.faceMotion === 'down' ? -1 : 0;
    const tailEnd = Math.max(FIRST_GLISS_MS_C7 + 250, ctx.durationMs * 0.88);
    const times = glissSchedule(driftCount, FIRST_GLISS_MS_C7, tailEnd, MIN_GLISS_SPACING_MS);
    const phraseStartSign = this.rng() < 0.5 ? 1 : -1;
    const phraseEndMs = ctx.durationMs - 100;
    for (let i = 0; i < times.length; i++) {
      const t = times[i];
      const nextEventMs = i + 1 < times.length ? times[i + 1] : phraseEndMs;
      const gapMs = nextEventMs - t;
      const bendDur = Math.max(80, Math.min(gapMs - 50, MAX_BEND_DUR_MS));
      const sign = motionDir !== 0 ? motionDir : phraseStartSign * (i % 2 === 0 ? 1 : -1);
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
    const cmx = COMPLEX[complexType];
    const lo = cmx ? Math.max(CELLO_MIN, cmx.register.lo) : CELLO_MIN;
    const hi = cmx ? Math.min(CELLO_MAX, cmx.register.hi) : CELLO_MAX;
    if (s.length === 0) return foldToRange(36 + ctx.faceTr, lo, hi);

    let pitch: number;
    switch (complexType) {
      case 1:
      case 4:
      case 5:
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
      case 3:
      case 7:
      case 8:
        pitch = s[Math.floor(s.length / 2)];
        break;
      default:
        pitch = s[0];
    }
    return foldToRange(pitch + ctx.faceTr, lo, hi);
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
    this.noteOff(ctx, tMs + durMs, sourcePitch);
    this.noteOn(ctx, tMs + durMs, p, glissVel);
    return p;
  }

  private maybeDoubleStop(ctx: VoiceContext, tMs: number, mainPitch: number, vel: number, p: number): number | null {
    if (this.rng() >= p) return null;
    const companion = doubleStopCompanion(mainPitch, this.rng);
    if (companion == null) return null;
    this.noteOn(ctx, tMs, companion, Math.max(1, Math.round(vel * 0.85)), true);
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

function intensityDensity(intensity: string): number {
  return (INTENSITY_MAP[intensity as IntensityLabel] ?? INTENSITY_MAP.mf).density;
}

export function phrasePlanSummary(plan: PhrasePlan): string {
  const first = plan.expected.firstNoteOnMs == null ? '-' : `${plan.expected.firstNoteOnMs}ms`;
  return `P${plan.id} C${plan.complex} face=${plan.face ?? '-'} dur=${plan.durationSec.toFixed(2)}s events=${plan.events.length} noteons=${plan.expected.noteOnCount} bends=${plan.expected.bendStepCount} companions=${plan.expected.companionNoteOnCount} first=${first}`;
}
