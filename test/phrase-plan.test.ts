import { describe, expect, it } from 'vitest';
import { XenaKubeEngine } from '../src/engine.js';
import { PhrasePlanner, phrasePlanSummary, type PhrasePlan } from '../src/phrase-plan.js';
import { ComplexType, type XenaKubeState } from '../src/types.js';
import {
  HALF_TURN_GESTURE_DURATION_SEC,
  HALF_TURN_GLISS_DURATION_SEC,
  HALF_TURN_GLISS_SPAN_BY_COMPLEX,
  HALF_TURN_GESTURE_EXPR,
  HALF_TURN_GESTURE_INTENSITY,
  HALF_TURN_GESTURE_NOTE_MS,
  HALF_TURN_GESTURE_RELEASE_MS,
  HALF_TURN_GESTURE_VELOCITY,
  ONSET_EXPRESSION_MIN,
} from '../src/swam-mapping.js';
import type { FaceMove } from '../src/face-gesture.js';
import type { VoiceOutput } from '../src/voice-engine.js';

const baseParams = { density: 1.5, intensity: 'mf', duration: 1 };

function state() {
  return new XenaKubeEngine().getState();
}

function stateWithRate(turnRate: number): XenaKubeState {
  return {
    ...state(),
    turnRate,
    regime: turnRate >= 2 ? 'burst' : 'conversational',
  };
}

function stateWithSieve(sieve: number[]): XenaKubeState {
  return {
    ...state(),
    sieve,
  };
}

function voice(complex: ComplexType, face: FaceMove | null = 'R'): VoiceOutput {
  return {
    mode: 'sequential',
    face,
    halfTurn: false,
    active: [{ vertexIndex: 0, complex, params: baseParams }],
  };
}

function firstMainPitch(plan: PhrasePlan): number {
  const evt = plan.events.find(e => e.kind === 'noteOn' && e.isCompanion !== true);
  if (!evt || evt.kind !== 'noteOn') throw new Error('missing main noteOn');
  return evt.pitch;
}

describe('PhrasePlanner', () => {
  it('combines vertex duration and face multiplier in shadow plans', () => {
    const planner = new PhrasePlanner({ rng: () => 0.5, now: () => 1000 });
    const plan = planner.planVoiceOutput(voice(ComplexType.Atom, "D'"), state())[0];

    expect(plan.durationSource).toBe('vertex*face');
    expect(plan.durationSec).toBe(2.5);
    expect(plan.faceEnvelope).toBe('hairpin-up');
  });

  it('falls back to vertex duration when no face is attached to the voice', () => {
    const planner = new PhrasePlanner({ rng: () => 0.5, now: () => 1000 });
    const out: VoiceOutput = {
      mode: 'sequential',
      face: null,
      active: [{
        vertexIndex: 0,
        complex: ComplexType.Atom,
        params: { ...baseParams, duration: 1.25 },
      }],
    };
    const plan = planner.planVoiceOutput(out, state())[0];

    expect(plan.durationSource).toBe('vertex');
    expect(plan.durationSec).toBe(1.25);
  });

  it('keeps identity-bearing gliss complexes above their duration floor', () => {
    const planner = new PhrasePlanner({ rng: () => 0.5, now: () => 1000 });
    const plan = planner.planVoiceOutput(voice(ComplexType.AtaxicSliding, 'R'), state())[0];

    expect(plan.durationSource).toBe('vertex*face+floor');
    expect(plan.durationSec).toBeGreaterThan(0.5);
    expect(plan.expected.bendStepCount).toBeGreaterThanOrEqual(1);
  });

  it('keeps first planned audible note immediate for every complex', () => {
    const planner = new PhrasePlanner({ rng: () => 0.5, now: () => 1000 });

    for (const complex of [
      ComplexType.AtaxicCloud,
      ComplexType.OrderedCloudAscDesc,
      ComplexType.OrderedCloudFlat,
      ComplexType.IonizedAtom,
      ComplexType.AtaxicSliding,
      ComplexType.OrderedSlidingAscDesc,
      ComplexType.OrderedSlidingFlat,
      ComplexType.Atom,
    ]) {
      const plan = planner.planVoiceOutput(voice(complex, 'R'), state())[0];
      expect(plan.expected.firstNoteOnMs, `C${complex}`).not.toBeNull();
      expect(plan.expected.firstNoteOnMs!, `C${complex}`).toBe(0);
    }
  });

  it('keeps slow-start face expression seeds immediately audible', () => {
    const planner = new PhrasePlanner({ rng: () => 0.5, now: () => 1000 });
    const plan = planner.planVoiceOutput(voice(ComplexType.Atom, "D'"), state())[0];
    const expr = plan.events.find(e => e.kind === 'exprShape');

    expect(expr?.kind).toBe('exprShape');
    if (expr?.kind === 'exprShape') {
      expect(expr.shape).toBe('hairpin-up');
      expect(expr.start).toBeGreaterThanOrEqual(ONSET_EXPRESSION_MIN);
      expect(expr.end).toBeGreaterThanOrEqual(ONSET_EXPRESSION_MIN);
    }
  });

  it('C7 plans immediate drift and no companions', () => {
    const planner = new PhrasePlanner({ rng: () => 0, now: () => 1000 });
    const plan = planner.planVoiceOutput(voice(ComplexType.OrderedSlidingFlat, 'U'), state())[0];

    expect(plan.expected.bendStepCount).toBeGreaterThanOrEqual(1);
    expect(plan.events.some(e => e.kind === 'bendStep' && e.tMs === 30)).toBe(true);
    expect(plan.expected.companionNoteOnCount).toBe(0);
  });

  it('does not pin flat and sustained complex anchors to the middle sieve register', () => {
    const wide = stateWithSieve([0, 12, 24, 36, 48]);
    const anchored = [
      ComplexType.OrderedCloudFlat,
      ComplexType.IonizedAtom,
      ComplexType.OrderedSlidingFlat,
      ComplexType.Atom,
    ];

    for (const complex of anchored) {
      const lowPlan = new PhrasePlanner({ rng: () => 0, now: () => 1000 })
        .planVoiceOutput(voice(complex, 'R'), wide)[0];
      const highPlan = new PhrasePlanner({ rng: () => 0.999, now: () => 1000 })
        .planVoiceOutput(voice(complex, 'R'), wide)[0];

      expect(firstMainPitch(lowPlan), `C${complex} low anchor`).toBeLessThanOrEqual(48);
      expect(firstMainPitch(highPlan), `C${complex} high anchor`).toBeGreaterThanOrEqual(80);
    }
  });

  it("does not let U' force C2 into a high descending run", () => {
    const wide = stateWithSieve([0, 12, 24, 36, 48]);
    const plan = new PhrasePlanner({ rng: () => 0, now: () => 1000 })
      .planVoiceOutput(voice(ComplexType.OrderedCloudAscDesc, "U'"), wide)[0];
    const mainPitches = plan.events
      .filter(e => e.kind === 'noteOn' && e.isCompanion !== true)
      .map(e => (e.kind === 'noteOn' ? e.pitch : 0));

    expect(plan.faceTranspose).toBe(0);
    expect(mainPitches[0]).toBe(36);
    expect(mainPitches[1]).toBeGreaterThan(mainPitches[0]);
  });

  it('plans non-C1/non-gliss half-turn punctuation as short loud bowed dyad material', () => {
    const planner = new PhrasePlanner({ rng: () => 0, now: () => 1000 });
    const out = voice(ComplexType.OrderedCloudFlat, "U'");
    out.halfTurn = true;
    out.active[0].params = { density: 0.1, intensity: 'ppp', duration: 5 };

    const plan = planner.planVoiceOutput(out, stateWithSieve([0, 12, 24]))[0];
    const noteOns = plan.events.filter(e => e.kind === 'noteOn');
    const noteOffs = plan.events.filter(e => e.kind === 'noteOff');
    const expr = plan.events.find(e => e.kind === 'exprShape');

    expect(plan.halfTurn).toBe(true);
    expect(plan.durationSource).toBe('half-turn');
    expect(plan.durationSec).toBe(HALF_TURN_GESTURE_DURATION_SEC);
    expect(plan.intensity).toBe(HALF_TURN_GESTURE_INTENSITY);
    expect(plan.faceEnvelope).toBe('half-turn');
    expect(expr?.kind).toBe('exprShape');
    if (expr?.kind === 'exprShape') expect(expr.peakExpr).toBe(HALF_TURN_GESTURE_EXPR);
    expect(noteOns).toHaveLength(2);
    expect(noteOns.some(e => e.kind === 'noteOn' && e.isCompanion === true)).toBe(true);
    expect(noteOns.every(e => e.kind === 'noteOn' && e.velocity >= Math.round(HALF_TURN_GESTURE_VELOCITY * 0.9))).toBe(true);
    expect(noteOffs.every(e => e.tMs === HALF_TURN_GESTURE_NOTE_MS)).toBe(true);
    expect(plan.expected.bendStepCount).toBe(0);
    expect(plan.expected.companionNoteOnCount).toBe(1);
  });

  it('plans C1 half-turn punctuation as pizzicato, not a bowed dyad', () => {
    const planner = new PhrasePlanner({ rng: () => 0, now: () => 1000 });
    const out = voice(ComplexType.AtaxicCloud, "U'");
    out.halfTurn = true;
    out.active[0].params = { density: 0.1, intensity: 'ppp', duration: 5 };

    const plan = planner.planVoiceOutput(out, stateWithSieve([0, 12, 24]))[0];
    const noteOns = plan.events.filter(e => e.kind === 'noteOn');
    const noteOffs = plan.events.filter(e => e.kind === 'noteOff');
    const expr = plan.events.find(e => e.kind === 'exprShape');

    expect(plan.halfTurn).toBe(true);
    expect(plan.durationSource).toBe('half-turn');
    expect(plan.durationSec).toBe(HALF_TURN_GESTURE_DURATION_SEC);
    expect(plan.intensity).toBe(HALF_TURN_GESTURE_INTENSITY);
    expect(plan.faceEnvelope).toBe('half-turn');
    expect(expr?.kind).toBe('exprShape');
    if (expr?.kind === 'exprShape') expect(expr.peakExpr).toBe(HALF_TURN_GESTURE_EXPR);
    expect(noteOns).toHaveLength(1);
    expect(noteOns[0]).toMatchObject({ kind: 'noteOn', tMs: 0, velocity: HALF_TURN_GESTURE_VELOCITY });
    expect(noteOns.some(e => e.kind === 'noteOn' && e.isCompanion === true)).toBe(false);
    expect(noteOffs).toHaveLength(1);
    expect(noteOffs[0]?.tMs).toBe(HALF_TURN_GESTURE_NOTE_MS);
    expect(plan.expected.bendStepCount).toBe(0);
    expect(plan.expected.companionNoteOnCount).toBe(0);
  });

  it('plans C5-C7 half-turn punctuation as one same-duration gliss with per-complex span', () => {
    const complexes = [
      ComplexType.AtaxicSliding,
      ComplexType.OrderedSlidingAscDesc,
      ComplexType.OrderedSlidingFlat,
    ];

    for (const complex of complexes) {
      const planner = new PhrasePlanner({ rng: () => 0.75, now: () => 1000 });
      const out = voice(complex, "U'");
      out.halfTurn = true;

      const plan = planner.planVoiceOutput(out, stateWithSieve([24]))[0];
      const bend = plan.events.find(e => e.kind === 'bendStep');
      const noteOns = plan.events.filter(e => e.kind === 'noteOn');
      const noteOffs = plan.events.filter(e => e.kind === 'noteOff');

      expect(plan.durationSec, `C${complex}`).toBe(HALF_TURN_GLISS_DURATION_SEC);
      expect(plan.expected.bendStepCount, `C${complex}`).toBe(1);
      expect(plan.expected.companionNoteOnCount, `C${complex}`).toBe(0);
      expect(noteOns, `C${complex}`).toHaveLength(1);
      expect(noteOffs, `C${complex}`).toHaveLength(0);
      expect(bend?.kind, `C${complex}`).toBe('bendStep');
      if (bend?.kind === 'bendStep') {
        expect(bend.tMs, `C${complex}`).toBe(0);
        expect(bend.durMs, `C${complex}`).toBe(Math.round(HALF_TURN_GLISS_DURATION_SEC * 1000));
        expect(bend.durMs + HALF_TURN_GESTURE_RELEASE_MS + 20, `C${complex}`).toBeLessThanOrEqual(500);
        expect(Math.abs(bend.toPitch - bend.fromPitch), `C${complex}`).toBe(HALF_TURN_GLISS_SPAN_BY_COMPLEX[complex]);
      }
      expect(noteOns[0]).toMatchObject({ kind: 'noteOn', tMs: 0 });
    }
    expect(HALF_TURN_GLISS_SPAN_BY_COMPLEX[ComplexType.AtaxicSliding]).toBeGreaterThan(
      HALF_TURN_GLISS_SPAN_BY_COMPLEX[ComplexType.OrderedSlidingAscDesc],
    );
    expect(HALF_TURN_GLISS_SPAN_BY_COMPLEX[ComplexType.OrderedSlidingFlat]).toBe(1);
  });

  it('C5 plans wild gliss bends and re-voiced in-range companions', () => {
    const planner = new PhrasePlanner({ rng: () => 0, now: () => 1000 });
    const plan = planner.planVoiceOutput(voice(ComplexType.AtaxicSliding, 'R'), state())[0];
    const companionNoteOns = plan.events.filter(e => e.kind === 'noteOn' && e.isCompanion === true);
    const companionNoteOffs = plan.events.filter(e => e.kind === 'noteOff' && e.isCompanion === true);

    expect(plan.expected.bendStepCount).toBeGreaterThanOrEqual(1);
    expect(companionNoteOns.length).toBeGreaterThan(1);
    expect(companionNoteOns[0].tMs).toBe(0);
    expect(companionNoteOffs.length).toBeGreaterThan(0);
    expect(companionNoteOns.every(e => e.kind === 'noteOn' && e.pitch >= 36 && e.pitch <= 84)).toBe(true);
    expect(plan.expected.companionNoteOnCount).toBe(companionNoteOns.length);
  });

  it('over-range gliss step terminates or revoices active companion (mirrors Max leapStep)', () => {
    // Force C5 wild-gliss into the over-range branch with a wide sieve. The
    // pre-fix planner emitted only `noteOff(source) + noteOn(target+50ms)`
    // for over-range steps, with no companion accounting — so any phrase with
    // a gliss companion + over-range step under-reported companion noteOff and
    // (if companionTarget stays in range) companion noteOn. Mirror Max's
    // leapStep: kill all activeNotes (including any active companion),
    // schedule target +50ms, then revoice or terminate companion based on
    // range. The test sweeps seeds until it finds a phrase with BOTH an active
    // gliss companion AND at least one over-range step — that's the
    // intersection where the old planner's bug actually mattered.
    const wide = stateWithSieve([0, 4, 18, 22, 28, 32, 36, 44, 48]);
    let foundCase = false;
    for (let trial = 0; trial < 200 && !foundCase; trial++) {
      let seed = trial * 7919 + 1;
      const rng = () => {
        seed = (seed * 9301 + 49297) % 233280;
        return seed / 233280;
      };
      const planner = new PhrasePlanner({ rng, now: () => 1000 });
      const plan = planner.planVoiceOutput(voice(ComplexType.AtaxicSliding, 'R'), wide)[0];
      const overRangeWarn = plan.warnings.find(w => w.startsWith('over-range gliss'));
      const companionNoteOns = plan.events.filter(e => e.kind === 'noteOn' && e.isCompanion === true);
      if (!overRangeWarn) continue;
      if (companionNoteOns.length === 0) continue;
      foundCase = true;

      // Locate every over-range leap event in the plan: a source noteOff
      // immediately followed by a target noteOn 50ms later (LEAP_GAP_MS).
      // For each, assert the simultaneous companion noteOff. Pre-fix code
      // omitted the companion noteOff at the leap; the old companion lingered
      // in activeNotes until the next bendStep emitted a noteOff at a much
      // later tMs — the visual chain freezes on the old companion pitch
      // through the leap. Max's leapStep noteOff every activeNote at the
      // same instant.
      const mainOffs = plan.events.filter(
        e => e.kind === 'noteOff' && e.isCompanion !== true,
      );
      const mainOns = plan.events.filter(
        e => e.kind === 'noteOn' && e.isCompanion !== true,
      );
      const leapOffTimes: number[] = [];
      for (const off of mainOffs) {
        const targetOn = mainOns.find(
          on => on.tMs === off.tMs + 50 && on.kind === 'noteOn' && off.kind === 'noteOff' && on.pitch !== off.pitch,
        );
        if (targetOn) leapOffTimes.push(off.tMs);
      }
      expect(leapOffTimes.length).toBeGreaterThan(0);
      for (const tMs of leapOffTimes) {
        const companionOffAtSameTime = plan.events.some(
          e => e.kind === 'noteOff' && e.isCompanion === true && e.tMs === tMs,
        );
        expect(
          companionOffAtSameTime,
          `companion noteOff missing at over-range leap tMs=${tMs} (Max's leapStep kills every activeNote at the leap instant)`,
        ).toBe(true);
      }
    }
    expect(foundCase, 'expected at least one phrase with both an active companion and an over-range gliss step across 200 trials').toBe(true);
  });

  it('turn-rate pressure increases planned density and expression without changing complex identity', () => {
    const slowPlanner = new PhrasePlanner({ rng: () => 0.5, now: () => 1000 });
    const fastPlanner = new PhrasePlanner({ rng: () => 0.5, now: () => 1000 });

    const slowC1 = slowPlanner.planVoiceOutput(voice(ComplexType.AtaxicCloud, 'B'), stateWithRate(0.3))[0];
    const fastC1 = fastPlanner.planVoiceOutput(voice(ComplexType.AtaxicCloud, 'B'), stateWithRate(3.0))[0];
    expect(fastC1.expected.noteOnCount).toBeGreaterThan(slowC1.expected.noteOnCount);
    expect(fastC1.complex).toBe(slowC1.complex);

    const slowC2 = slowPlanner.planVoiceOutput(voice(ComplexType.OrderedCloudAscDesc, 'L'), stateWithRate(0.3))[0];
    const fastC2 = fastPlanner.planVoiceOutput(voice(ComplexType.OrderedCloudAscDesc, 'L'), stateWithRate(3.0))[0];
    expect(fastC2.expected.noteOnCount).toBeGreaterThan(slowC2.expected.noteOnCount);
    const slowExpr = slowC2.events.find(e => e.kind === 'exprShape');
    const fastExpr = fastC2.events.find(e => e.kind === 'exprShape');
    expect(slowExpr?.kind).toBe('exprShape');
    expect(fastExpr?.kind).toBe('exprShape');
    if (slowExpr?.kind === 'exprShape' && fastExpr?.kind === 'exprShape') {
      expect(fastExpr.peakExpr).toBeGreaterThan(slowExpr.peakExpr);
    }
  });

  it('caps C2 scheduled note-ons at 10 n/s after turn-rate pressure and dyads', () => {
    const planner = new PhrasePlanner({ rng: () => 0.01, now: () => 1000 });
    const out = voice(ComplexType.OrderedCloudAscDesc, 'L');
    out.active[0].params = { ...out.active[0].params, duration: 4 };

    const plan = planner.planVoiceOutput(out, stateWithRate(3.0))[0];
    expect(plan.expected.noteOnCount).toBeLessThanOrEqual(Math.floor(plan.durationSec * 10));
  });

  it('keeps C2 slow-turn main onsets around 3-4 n/s', () => {
    const planner = new PhrasePlanner({ rng: () => 0.99, now: () => 1000 });
    const out = voice(ComplexType.OrderedCloudAscDesc, 'L');
    out.active[0].params = { ...out.active[0].params, duration: 4 };

    const plan = planner.planVoiceOutput(out, stateWithRate(0.3))[0];
    const mainNoteOns = plan.events.filter(e => e.kind === 'noteOn' && e.isCompanion !== true);

    expect(mainNoteOns.length).toBeGreaterThanOrEqual(Math.floor(plan.durationSec * 3));
    expect(mainNoteOns.length).toBeLessThanOrEqual(Math.ceil(plan.durationSec * 4));
  });

  it('summarizes plan counts for dashboard and Max audit logs', () => {
    const planner = new PhrasePlanner({ rng: () => 0.5, now: () => 1000 });
    const plan = planner.planVoiceOutput(voice(ComplexType.Atom, 'R'), state())[0];
    const summary = phrasePlanSummary(plan);

    expect(summary).toContain(`P${plan.id}`);
    expect(summary).toContain('C8');
    expect(summary).toContain(`events=${plan.events.length}`);
    expect(summary).toContain(`noteons=${plan.expected.noteOnCount}`);
  });

  it('summarizes half-turn plans for dashboard and Max audit logs', () => {
    const planner = new PhrasePlanner({ rng: () => 0.5, now: () => 1000 });
    const out = voice(ComplexType.Atom, 'R');
    out.halfTurn = true;
    const plan = planner.planVoiceOutput(out, state())[0];
    expect(phrasePlanSummary(plan)).toContain('half-turn=1');
  });
});
