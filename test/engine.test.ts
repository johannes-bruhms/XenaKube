import { describe, it, expect } from 'vitest';
import { XenaKubeEngine } from '../src/engine.js';
import { getBaseVertices } from '../src/vertices.js';
import { getPermutation, parseMoveToElement } from '../src/group.js';

describe('XenaKubeEngine', () => {
  it('starts at identity with correct initial state', () => {
    const engine = new XenaKubeEngine();
    const state = engine.getState();

    expect(state.kGroup).toBe(0);
    expect(state.cosmology).toBe('beta-cosmo');
    expect(state.kPermutation).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
    expect(state.cGroup).toBe(0);
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

  it('beta-cosmo read-head = top-right corner of last-turned face under gyro', () => {
    const engine = new XenaKubeEngine();

    let state = engine.onTurn('R')!;
    // R-twist canonical home = vertex 3 (BTR per orientation.ts FACE_TARGET).
    expect(state.lastTurnedFace).toBe('R');
    expect(state.activeVertex).toBe(3);

    state = engine.onTurn('F')!;
    // F-twist canonical home = vertex 0 (FTR).
    expect(state.lastTurnedFace).toBe('F');
    expect(state.activeVertex).toBe(0);

    state = engine.onTurn('U')!;
    // U-twist canonical home = vertex 3 (BTR — collides with R, by design).
    expect(state.lastTurnedFace).toBe('U');
    expect(state.activeVertex).toBe(3);
  });

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
