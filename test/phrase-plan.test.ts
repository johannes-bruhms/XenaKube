import { describe, expect, it } from 'vitest';
import { XenaKubeEngine } from '../src/engine.js';
import { PhrasePlanner, phrasePlanSummary } from '../src/phrase-plan.js';
import { ComplexType, type XenaKubeState } from '../src/types.js';
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

function voice(complex: ComplexType, face: FaceMove | null = 'R'): VoiceOutput {
  return {
    mode: 'sequential',
    face,
    active: [{ vertexIndex: 0, complex, params: baseParams }],
  };
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

  it('keeps first planned audible note near-immediate for every complex', () => {
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
      expect(plan.expected.firstNoteOnMs!, `C${complex}`).toBeLessThanOrEqual(30);
    }
  });

  it('C7 plans immediate drift and no companions', () => {
    const planner = new PhrasePlanner({ rng: () => 0, now: () => 1000 });
    const plan = planner.planVoiceOutput(voice(ComplexType.OrderedSlidingFlat, 'U'), state())[0];

    expect(plan.expected.bendStepCount).toBeGreaterThanOrEqual(1);
    expect(plan.events.some(e => e.kind === 'bendStep' && e.tMs === 30)).toBe(true);
    expect(plan.expected.companionNoteOnCount).toBe(0);
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

  it('summarizes plan counts for dashboard and Max audit logs', () => {
    const planner = new PhrasePlanner({ rng: () => 0.5, now: () => 1000 });
    const plan = planner.planVoiceOutput(voice(ComplexType.Atom, 'R'), state())[0];
    const summary = phrasePlanSummary(plan);

    expect(summary).toContain(`P${plan.id}`);
    expect(summary).toContain('C8');
    expect(summary).toContain(`events=${plan.events.length}`);
    expect(summary).toContain(`noteons=${plan.expected.noteOnCount}`);
  });
});
