import { describe, it, expect } from 'vitest';
import { XenaKubeEngine } from '../src/engine.js';
import { getBaseVertices } from '../src/vertices.js';

describe('XenaKubeEngine', () => {
  it('starts at identity with correct initial state', () => {
    const engine = new XenaKubeEngine();
    const state = engine.getState();

    expect(state.kGroup).toBe(0);
    expect(state.cGroup).toBe(0);
    expect(state.step).toBe(0);
    expect(state.cyclicPhase).toBe('alpha');
    expect(state.kVertices).toHaveLength(8);
  });

  it('processes a face turn and advances state', () => {
    const engine = new XenaKubeEngine();
    const state = engine.onTurn('R');

    expect(state).not.toBeNull();
    expect(state!.kGroup).not.toBe(0); // no longer identity
    expect(state!.step).toBe(1);
  });

  it('rejects invalid moves', () => {
    const engine = new XenaKubeEngine();
    const state = engine.onTurn('X');
    expect(state).toBeNull();
  });

  it('permutes vertices on turn', () => {
    const engine = new XenaKubeEngine();
    const before = engine.getState().kVertices;
    engine.onTurn('R');
    const after = engine.getState().kVertices;

    // At least some vertices should be in different positions
    let changed = false;
    for (let i = 0; i < 8; i++) {
      if (before[i].density !== after[i].density) {
        changed = true;
        break;
      }
    }
    expect(changed).toBe(true);
  });

  it('keeps K_i duration neutral so face gestures own phrase time', () => {
    const baseDurations = getBaseVertices().map(v => v.duration);
    expect(new Set(baseDurations)).toEqual(new Set([1]));

    const engine = new XenaKubeEngine();
    engine.onTurn('R');
    engine.onTurn('U');
    engine.onTurn('F');
    const movedDurations = engine.getState().kVertices.map(v => v.duration);
    expect(new Set(movedDurations)).toEqual(new Set([1]));
  });

  it('advances C_i cube in algorithmic mode', () => {
    const engine = new XenaKubeEngine({ cCube: 'algorithmic' });
    engine.onTurn('R');
    const state = engine.getState();
    expect(state.cGroup).not.toBe(0);
  });

  it('K_i and C_i cubes do not advance in lockstep', () => {
    // Regression guard for the lockstep bug — before the C_SHIFT fix, both
    // cubes multiplied by the same element from IDENTITY, so cGroup === kGroup
    // after every turn, and the ghost cube's permutation was identical to the
    // live cube's. Per Xenakis (Formalized Music pp. 223-224), the two cubes
    // must traverse separate graphs.
    const engine = new XenaKubeEngine({ cCube: 'algorithmic' });
    const moves = ['R', 'U', 'F', "R'", 'U', 'R'];
    let diverged = false;
    for (const m of moves) {
      engine.onTurn(m);
      const s = engine.getState();
      if (s.cGroup !== s.kGroup) diverged = true;
    }
    expect(diverged).toBe(true);
  });

  it('cycles α → β → γ every 3 substitutions', () => {
    const engine = new XenaKubeEngine({ cCube: 'algorithmic' });

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

  it('advances sieve every 3 substitutions', () => {
    const engine = new XenaKubeEngine();
    const sieve0 = engine.getState().sieve;
    engine.onTurn('R');
    engine.onTurn('U');
    engine.onTurn('F');
    const sieve1 = engine.getState().sieve;

    // Sieve should have changed after metabola
    expect(sieve1).not.toEqual(sieve0);
  });

  it('emits state to listeners', () => {
    const engine = new XenaKubeEngine();
    const states: any[] = [];
    engine.onState(s => states.push(s));

    engine.onTurn('R');
    expect(states).toHaveLength(1);
    expect(states[0].step).toBe(1);
  });

  it('resets to initial state', () => {
    const engine = new XenaKubeEngine();
    engine.onTurn('R');
    engine.onTurn('U');
    engine.reset();

    const state = engine.getState();
    expect(state.kGroup).toBe(0);
    expect(state.step).toBe(0);
    expect(state.cyclicPhase).toBe('alpha');
  });

  it('processes gyro in gyro mode', () => {
    const engine = new XenaKubeEngine({ cCube: 'gyro' });
    // Send a quaternion near a 90° rotation
    const state = engine.onGyro(0.7, 0, 0, 0.7);
    expect(state).not.toBeNull();
  });
});
