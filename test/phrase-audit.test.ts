import { describe, expect, it } from 'vitest';
import { XenaKubeEngine } from '../src/engine.js';
import { PhraseEchoAuditor } from '../src/phrase-audit.js';
import { PhrasePlanner } from '../src/phrase-plan.js';
import { ComplexType } from '../src/types.js';
import type { VoiceOutput } from '../src/voice-engine.js';

const baseParams = { density: 1.5, intensity: 'mf', duration: 1 };

function state() {
  return new XenaKubeEngine().getState();
}

function voice(complex: ComplexType): VoiceOutput {
  return {
    mode: 'sequential',
    face: 'R',
    active: [{ vertexIndex: 0, complex, params: baseParams }],
  };
}

function planned(complex: ComplexType, now: number) {
  const planner = new PhrasePlanner({ rng: () => 0.5, now: () => now });
  return planner.planVoiceOutput(voice(complex), state())[0];
}

describe('PhraseEchoAuditor', () => {
  it('passes when first note arrives and structural counts match', () => {
    let now = 1000;
    const plan = planned(ComplexType.Atom, now);
    const auditor = new PhraseEchoAuditor({ now: () => now, completionGraceMs: 0 });
    auditor.startTurn([plan]);

    auditor.recordEcho({ kind: 'noteon', planId: plan.id, tMs: now });
    now += 5000;
    const results = auditor.poll(now);

    expect(results).toHaveLength(1);
    expect(results[0].status).toBe('ok');
    expect(results[0].actual.noteOnCount).toBe(1);
  });

  it('fails quickly when the first planned note never echoes', () => {
    let now = 1000;
    const plan = planned(ComplexType.Atom, now);
    const auditor = new PhraseEchoAuditor({ now: () => now, firstNoteFailMs: 250 });
    auditor.startTurn([plan]);

    now += (plan.expected.firstNoteOnMs ?? 0) + 251;
    const results = auditor.poll(now);

    expect(results).toHaveLength(1);
    expect(results[0].status).toBe('fail');
    expect(results[0].reason).toBe('first-note-timeout');
    expect(results[0].failures.join(' ')).toContain('missing first noteon');
  });

  it('fails immediately when the first note echoes after the live latency budget', () => {
    let now = 1000;
    const plan = planned(ComplexType.Atom, now);
    const auditor = new PhraseEchoAuditor({ now: () => now, firstNoteFailMs: 250 });
    auditor.startTurn([plan]);

    now += (plan.expected.firstNoteOnMs ?? 0) + 300;
    const results = auditor.recordEcho({ kind: 'noteon', planId: plan.id, tMs: now });

    expect(results).toHaveLength(1);
    expect(results[0].status).toBe('fail');
    expect(results[0].reason).toBe('first-note-timeout');
    expect(results[0].failures.join(' ')).toContain('first noteon late');
    expect(auditor.pendingCount()).toBe(0);
  });

  it('fails a stolen phrase if it was stolen before any note echoed', () => {
    let now = 1000;
    const first = planned(ComplexType.Atom, now);
    const auditor = new PhraseEchoAuditor({ now: () => now });
    auditor.startTurn([first]);

    now += 10;
    const second = planned(ComplexType.AtaxicCloud, now);
    const results = auditor.startTurn([second]);

    expect(results).toHaveLength(1);
    expect(results[0].status).toBe('fail');
    expect(results[0].reason).toBe('stolen');
    expect(results[0].failures.join(' ')).toContain('missing first noteon');
  });

  it('treats panic as intentional preemption, not a dropped-note failure', () => {
    let now = 1000;
    const plan = planned(ComplexType.OrderedSlidingFlat, now);
    const auditor = new PhraseEchoAuditor({ now: () => now });
    auditor.startTurn([plan]);

    now += 10;
    const results = auditor.reset('panic');

    expect(results).toHaveLength(1);
    expect(results[0].status).toBe('stolen');
    expect(results[0].reason).toBe('panic');
    expect(results[0].failures).toHaveLength(0);
  });

  it('warns instead of failing exact stochastic note-count drift while Max is legacy renderer', () => {
    let now = 1000;
    const plan = planned(ComplexType.AtaxicCloud, now);
    const auditor = new PhraseEchoAuditor({ now: () => now, completionGraceMs: 0 });
    auditor.startTurn([plan]);

    auditor.recordEcho({ kind: 'noteon', planId: plan.id, tMs: now });
    now += 5000;
    const results = auditor.poll(now);

    expect(plan.expected.noteOnCount).toBeGreaterThan(1);
    expect(results[0].status).toBe('ok');
    expect(results[0].warnings.join(' ')).toContain('shadow noteon drift');
  });

  it('fails a gliss plan when no bendstep echoes at all', () => {
    let now = 1000;
    const plan = planned(ComplexType.OrderedSlidingFlat, now);
    const auditor = new PhraseEchoAuditor({ now: () => now, completionGraceMs: 0 });
    auditor.startTurn([plan]);

    auditor.recordEcho({ kind: 'noteon', planId: plan.id, tMs: now });
    now += 5000;
    const results = auditor.poll(now);

    expect(plan.expected.bendStepCount).toBeGreaterThan(0);
    expect(results[0].status).toBe('fail');
    expect(results[0].failures.join(' ')).toContain('missing all planned bendsteps');
  });

  it('fails when C7 echoes an unexpected companion', () => {
    let now = 1000;
    const plan = planned(ComplexType.OrderedSlidingFlat, now);
    const auditor = new PhraseEchoAuditor({ now: () => now, completionGraceMs: 0 });
    auditor.startTurn([plan]);

    auditor.recordEcho({ kind: 'noteon', planId: plan.id, tMs: now });
    auditor.recordEcho({ kind: 'noteon', planId: plan.id, tMs: now, isCompanion: true });
    auditor.recordEcho({ kind: 'bendstep', planId: plan.id, tMs: now + 30 });
    now += 5000;
    const results = auditor.poll(now);

    expect(plan.expected.companionNoteOnCount).toBe(0);
    expect(results[0].status).toBe('fail');
    expect(results[0].failures.join(' ')).toContain('unexpected companion');
  });
});
