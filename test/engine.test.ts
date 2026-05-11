import { describe, it, expect, vi } from 'vitest';
import { XenaKubeEngine } from '../src/engine.js';
import { getBaseVertices } from '../src/vertices.js';
import { getPermutation, parseMoveToElement } from '../src/group.js';
import { ComplexType } from '../src/types.js';
import { HALF_TURN_WINDOW_MS } from '../src/swam-mapping.js';
import type { VoiceOutput } from '../src/voice-engine.js';

function withMockNow<T>(startMs: number, fn: (setNow: (ms: number) => void) => T): T {
  let now = startMs;
  const spy = vi.spyOn(Date, 'now').mockImplementation(() => now);
  try {
    return fn((ms: number) => { now = ms; });
  } finally {
    spy.mockRestore();
  }
}

describe('XenaKubeEngine', () => {
  it('starts at identity with correct initial state', () => {
    const engine = new XenaKubeEngine();
    const state = engine.getState();

    expect(state.kGroup).toBe(0);
    expect(state.cosmology).toBe('beta-cosmo');
    expect(state.kPermutation).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
    expect(state.cGroup).toBe(0);
    expect(state.cAssignments).toEqual([
      ComplexType.AtaxicCloud,
      ComplexType.OrderedCloudAscDesc,
      ComplexType.OrderedCloudFlat,
      ComplexType.IonizedAtom,
      ComplexType.AtaxicSliding,
      ComplexType.OrderedSlidingAscDesc,
      ComplexType.OrderedSlidingFlat,
      ComplexType.Atom,
    ]);
    expect(state.step).toBe(0);
    expect(state.cyclicPhase).toBe('alpha');
    expect(state.kVertices).toHaveLength(8);
  });

  it('processes a face turn and advances visible corner topology', () => {
    const engine = new XenaKubeEngine();
    const state = engine.onTurn('R');

    expect(state).not.toBeNull();
    expect(state!.kGroup).toBe(0);
    expect(state!.kPermutation).toEqual([4, 1, 2, 0, 7, 5, 6, 3]);
    expect(state!.activeVertex).toBe(3);
    expect(state!.activeK).toBe(0);
    expect(state!.step).toBe(1);
  });

  it('rejects invalid moves', () => {
    const engine = new XenaKubeEngine();
    const state = engine.onTurn('X');
    expect(state).toBeNull();
  });

  it('permutes vertices on physical turn', () => {
    const engine = new XenaKubeEngine();
    const before = engine.getState().kVertices;
    engine.onTurn('R');
    const after = engine.getState().kVertices;

    let changed = false;
    for (let i = 0; i < 8; i++) {
      if (before[i].density !== after[i].density) {
        changed = true;
        break;
      }
    }
    expect(changed).toBe(true);
  });

  it('restores varied K_i duration as material phrase time', () => {
    const baseDurations = getBaseVertices().map(v => v.duration);
    expect(baseDurations).toEqual([2, 5, 5, 2, 3, 4, 4, 3]);

    const engine = new XenaKubeEngine();
    engine.onTurn('R');
    engine.onTurn('U');
    engine.onTurn('F');
    const movedDurations = engine.getState().kVertices.map(v => v.duration);
    expect([...new Set(movedDurations)].sort()).toEqual([2, 3, 4, 5]);
  });

  it('beta-cosmo read-head = direction-aware collision corner of last face-move', () => {
    const engine = new XenaKubeEngine();

    let state = engine.onTurn('R')!;
    // R clockwise moves the top-edge K corner into vertex 3 (BTR).
    expect(state.lastTurnedFace).toBe('R');
    expect(state.activeVertex).toBe(3);

    state = engine.onTurn("R'")!;
    // R counterclockwise moves the top-edge K corner into vertex 0 (FTR).
    expect(state.lastTurnedFace).toBe('R');
    expect(state.activeVertex).toBe(0);

    state = engine.onTurn('F')!;
    // F clockwise moves the top-edge K corner into vertex 0 (FTR).
    expect(state.lastTurnedFace).toBe('F');
    expect(state.activeVertex).toBe(0);

    state = engine.onTurn('U')!;
    // U clockwise uses the user-facing edge and moves into its left endpoint.
    expect(state.lastTurnedFace).toBe('U');
    expect(state.activeVertex).toBe(2);

    state = engine.onTurn("U'")!;
    // U counterclockwise moves into the right endpoint facing the user.
    expect(state.lastTurnedFace).toBe('U');
    expect(state.activeVertex).toBe(1);
  });

  it('beta-cosmo pairs the active K corner with the fixed local C identity', () => {
    const engine = new XenaKubeEngine();
    let emitted: VoiceOutput | null = null;
    engine.onVoice(output => { emitted = output; });

    const state = engine.onTurn('R')!;

    // User-visible R home slot is vertex 3: the ghost label there is C4.
    // This must sound C4, not the historical alpha-table C5 entry.
    expect(state.activeVertex).toBe(3);
    expect(state.activeK).toBe(0);
    expect(state.cAssignments[state.activeVertex]).toBe(ComplexType.IonizedAtom);
    expect(emitted?.active[0]).toMatchObject({
      vertexIndex: 3,
      complex: ComplexType.IonizedAtom,
    });
  });

  it('flags the second rapid identical quarter-turn as half-turn punctuation', () => withMockNow(10_000, setNow => {
    const engine = new XenaKubeEngine();
    const emitted: VoiceOutput[] = [];
    engine.onVoice(output => { emitted.push(output); });

    let state = engine.onTurn("U'")!;
    expect(state.lastHalfTurn).toBe(false);
    expect(emitted.at(-1)?.halfTurn).toBe(false);

    setNow(10_000 + HALF_TURN_WINDOW_MS - 1);
    state = engine.onTurn("U'")!;
    expect(state.lastHalfTurn).toBe(true);
    expect(emitted.at(-1)?.halfTurn).toBe(true);
    expect(emitted.at(-1)?.face).toBe("U'");

    setNow(10_000 + HALF_TURN_WINDOW_MS + 20);
    state = engine.onTurn("U'")!;
    expect(state.lastHalfTurn).toBe(false);
    expect(emitted.at(-1)?.halfTurn).toBe(false);
  }));

  it('does not overlap half-turn pairs or match opposite directions', () => withMockNow(20_000, setNow => {
    const engine = new XenaKubeEngine();
    const emitted: VoiceOutput[] = [];
    engine.onVoice(output => { emitted.push(output); });

    engine.onTurn('R');
    setNow(20_100);
    engine.onTurn("R'");
    expect(emitted.at(-1)?.halfTurn).toBe(false);

    setNow(20_180);
    engine.onTurn("R'");
    expect(emitted.at(-1)?.halfTurn).toBe(true);

    setNow(20_240);
    engine.onTurn("R'");
    expect(emitted.at(-1)?.halfTurn).toBe(false);
  }));

  it('keeps C_i S4 state non-permuting in algorithmic mode', () => {
    const engine = new XenaKubeEngine({ cCube: 'algorithmic' });
    const before = engine.getState().cAssignments;

    engine.onTurn('R');
    const state = engine.getState();

    expect(state.cGroup).toBe(0);
    expect(state.cAssignments).toEqual(before);
  });

  it('does not let a K_i diagram drive visible K corner permutation', () => {
    const engine = new XenaKubeEngine();
    const diagram = engine.getDiagrams()[0];
    expect(diagram).toBeTruthy();
    engine.setKDiagram(diagram);

    const before = engine.getState().kPermutation;
    engine.onTurn('R');
    const after = engine.getState().kPermutation;

    expect(after).not.toEqual(before);
    expect(after).toEqual([4, 1, 2, 0, 7, 5, 6, 3]);
    expect(engine.getState().diagramPosition?.index).toBe(1);
  });

  it('alpha-cosmo restores the S4 K and C walks behind an explicit mode', () => {
    const engine = new XenaKubeEngine({ cosmology: 'alpha-cosmo' });
    const before = engine.getState();
    const r = parseMoveToElement('R');
    expect(r).not.toBeNull();

    const state = engine.onTurn('R')!;

    expect(state.cosmology).toBe('alpha-cosmo');
    expect(state.kGroup).toBe(r);
    expect(state.kPermutation).toEqual(getPermutation(r!));
    expect(state.kPermutation).not.toEqual([4, 1, 2, 0, 7, 5, 6, 3]);
    expect(state.cGroup).not.toBe(0);
    expect(state.cAssignments).not.toEqual(before.cAssignments);
    expect(state.activeVertex).toBe(1);
  });

  it('resets structural state when switching cosmologies to avoid contamination', () => {
    const engine = new XenaKubeEngine();
    engine.onTurn('R');
    expect(engine.getState().kPermutation).toEqual([4, 1, 2, 0, 7, 5, 6, 3]);

    engine.setMode({ cosmology: 'alpha-cosmo' });
    let state = engine.getState();
    expect(state.cosmology).toBe('alpha-cosmo');
    expect(state.step).toBe(0);
    expect(state.kGroup).toBe(0);
    expect(state.kPermutation).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);

    engine.onTurn('R');
    expect(engine.getState().kGroup).not.toBe(0);
    engine.setMode({ cosmology: 'beta-cosmo' });
    state = engine.getState();
    expect(state.cosmology).toBe('beta-cosmo');
    expect(state.step).toBe(0);
    expect(state.kGroup).toBe(0);
    expect(state.kPermutation).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
  });

  it('cube solve returns alpha-cosmo to beta-cosmo and emits the reset state', () => {
    const engine = new XenaKubeEngine({ cosmology: 'alpha-cosmo' });
    engine.onTurn('R');
    expect(engine.getState().cosmology).toBe('alpha-cosmo');
    expect(engine.getState().step).toBe(1);

    const states: unknown[] = [];
    let solveReport: ReturnType<XenaKubeEngine['reportCubeSolved']> | null = null;
    engine.onState(s => states.push(s));
    engine.onSolve(report => { solveReport = report; });

    const report = engine.reportCubeSolved();
    const state = engine.getState();

    expect(report.cosmologyChanged).toBe(true);
    expect(report.previousCosmology).toBe('alpha-cosmo');
    expect(report.state).toEqual(state);
    expect(solveReport).toBe(report);
    expect(state.cosmology).toBe('beta-cosmo');
    expect(state.step).toBe(0);
    expect(state.kGroup).toBe(0);
    expect(state.kPermutation).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
    expect(states).toHaveLength(1);
    expect((states[0] as { cosmology: string }).cosmology).toBe('beta-cosmo');
  });

  it('cube solve is a no-op for existing beta-cosmo structure', () => {
    const engine = new XenaKubeEngine();
    const moved = engine.onTurn('R')!;
    const states: unknown[] = [];
    let solveReport: ReturnType<XenaKubeEngine['reportCubeSolved']> | null = null;
    engine.onState(s => states.push(s));
    engine.onSolve(report => { solveReport = report; });

    const report = engine.reportCubeSolved();
    const state = engine.getState();

    expect(report.cosmologyChanged).toBe(false);
    expect(report.previousCosmology).toBe('beta-cosmo');
    expect(report.state).toEqual(state);
    expect(solveReport).toBe(report);
    expect(state.cosmology).toBe('beta-cosmo');
    expect(state.step).toBe(moved.step);
    expect(state.activeVertex).toBe(moved.activeVertex);
    expect(state.kPermutation).toEqual(moved.kPermutation);
    expect(states).toHaveLength(0);
  });

  it('alpha-cosmo cycles alpha -> beta -> gamma every 3 substitutions', () => {
    const engine = new XenaKubeEngine({ cosmology: 'alpha-cosmo', cCube: 'algorithmic' });

    expect(engine.getState().cyclicPhase).toBe('alpha');
    engine.onTurn('R');
    engine.onTurn('U');
    engine.onTurn('F');
    expect(engine.getState().cyclicPhase).toBe('beta');
    engine.onTurn('R');
    engine.onTurn('U');
    engine.onTurn('F');
    expect(engine.getState().cyclicPhase).toBe('gamma');
    engine.onTurn('R');
    engine.onTurn('U');
    engine.onTurn('F');
    expect(engine.getState().cyclicPhase).toBe('alpha');
  });

  it('beta-cosmo phrase materials freeze during voice in flight', () => {
    const engine = new XenaKubeEngine();

    // Fire a turn → activeVertex committed, lock window opens.
    let state = engine.onTurn('R')!;
    const lockedActive = state.activeVertex;
    const lockedCGroup = state.cGroup;
    expect(lockedActive).toBe(3); // R home corner

    // Mid-phrase gyro tilt: must not migrate activeVertex or rotate cGroup.
    state = engine.onGyro(0.7, 0, 0, 0.7)!;
    expect(state.activeVertex).toBe(lockedActive);
    expect(state.cGroup).toBe(lockedCGroup);

    // Another aggressive tilt: still locked.
    state = engine.onGyro(0.5, 0.5, 0, 0.7)!;
    expect(state.activeVertex).toBe(lockedActive);
    expect(state.cGroup).toBe(lockedCGroup);
  });

  it('beta-cosmo phase stays locked to alpha — never advances', () => {
    const engine = new XenaKubeEngine();

    for (let i = 0; i < 12; i++) {
      engine.onTurn('R');
      expect(engine.getState().cyclicPhase).toBe('alpha');
    }
  });

  it('beta-cosmo interrupt commits the latest C snap before the new voice', () => {
    const engine = new XenaKubeEngine();

    const first = engine.onTurn('R')!;
    const lockedCGroup = first.cGroup;
    expect(first.cAssignments[first.activeVertex]).toBe(first.activeVertex + 1);

    let state = engine.onGyro(0, Math.SQRT1_2, 0, Math.SQRT1_2)!;
    expect(state.cGroup).toBe(lockedCGroup);
    expect(state.cAssignments[state.activeVertex]).toBe(state.activeVertex + 1);
    expect(state.snapElement).not.toBe(lockedCGroup);

    state = engine.onTurn('B')!;
    expect(state.lastTurnedFace).toBe('B');
    expect(state.cGroup).toBe(state.snapElement);
    expect(state.cAssignments[state.activeVertex]).toBe(state.activeVertex + 1);
    expect(state.cGroup).not.toBe(lockedCGroup);
  });

  it('advances sieve every 3 substitutions', () => {
    const engine = new XenaKubeEngine();
    const sieve0 = engine.getState().sieve;
    engine.onTurn('R');
    engine.onTurn('U');
    engine.onTurn('F');
    const sieve1 = engine.getState().sieve;

    expect(sieve1).not.toEqual(sieve0);
  });

  it('emits state to listeners', () => {
    const engine = new XenaKubeEngine();
    const states: unknown[] = [];
    engine.onState(s => states.push(s));

    engine.onTurn('R');
    expect(states).toHaveLength(1);
    expect((states[0] as { step: number }).step).toBe(1);
  });

  it('resets to initial state', () => {
    const engine = new XenaKubeEngine();
    engine.onTurn('R');
    engine.onTurn('U');
    engine.reset();

    const state = engine.getState();
    expect(state.kGroup).toBe(0);
    expect(state.kPermutation).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
    expect(state.step).toBe(0);
    expect(state.cyclicPhase).toBe('alpha');
  });

  it('processes gyro as orientation shadow in gyro mode', () => {
    const engine = new XenaKubeEngine({ cCube: 'gyro' });
    const state = engine.onGyro(0.7, 0, 0, 0.7);
    expect(state).not.toBeNull();
    expect(state!.kGroup).toBe(state!.snapElement);
    expect(state!.cGroup).toBe(state!.snapElement);
    expect(state!.kPermutation).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
  });

  it('does not let gyro overwrite alpha-cosmo K walk state', () => {
    const engine = new XenaKubeEngine({ cosmology: 'alpha-cosmo', cCube: 'gyro' });
    const walked = engine.onTurn('R')!.kGroup;
    const state = engine.onGyro(0.7, 0, 0, 0.7)!;

    expect(state.kGroup).toBe(walked);
    // cGroup is now phrase-locked across this onGyro (turn just fired).
    // Gyro-driven C-walk resumes only after the phrase lock expires.
  });

  it('alpha-cosmo cCube=gyro updates cGroup from snap when no phrase is in flight', () => {
    const engine = new XenaKubeEngine({ cosmology: 'alpha-cosmo', cCube: 'gyro' });
    // No turn fired → no lock. Gyro should drive cGroup.
    const state = engine.onGyro(0.7, 0, 0, 0.7)!;
    expect(state.cGroup).toBe(state.snapElement);
  });
});
