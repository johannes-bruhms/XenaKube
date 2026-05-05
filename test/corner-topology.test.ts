import { describe, it, expect } from 'vitest';
import {
  IDENTITY_CORNER_PERM,
  CORNER_QUARTER_MOVES,
  applyCornerMove,
  encodeCornerPermutation,
  isSolvedCornerPermutation,
} from '../src/corner-topology.js';

describe('corner topology', () => {
  it('applies inverse quarter turns back to solved', () => {
    for (const move of CORNER_QUARTER_MOVES) {
      const inverse = move.endsWith("'") ? move.slice(0, -1) : `${move}'`;
      const moved = applyCornerMove(IDENTITY_CORNER_PERM, move)!;
      const restored = applyCornerMove(moved, inverse)!;
      expect(restored, move).toEqual(IDENTITY_CORNER_PERM);
    }
  });

  it('four repeated quarter turns return to solved', () => {
    for (const move of ['R', 'L', 'U', 'D', 'F', 'B']) {
      let perm = IDENTITY_CORNER_PERM;
      for (let i = 0; i < 4; i++) perm = applyCornerMove(perm, move)!;
      expect(isSolvedCornerPermutation(perm), move).toBe(true);
    }
  });

  it('encodes distinct permutations distinctly', () => {
    const r = applyCornerMove(IDENTITY_CORNER_PERM, 'R')!;
    const u = applyCornerMove(IDENTITY_CORNER_PERM, 'U')!;
    expect(encodeCornerPermutation(IDENTITY_CORNER_PERM)).toBe(0);
    expect(encodeCornerPermutation(r)).not.toBe(encodeCornerPermutation(u));
  });

  // Pins down direction (= CW from outside the face) for each quarter-turn.
  // CUBE_VERTS positions: 0=FTR (1,1,1), 1=FTL (-1,1,1), 2=BTL (-1,1,-1),
  // 3=BTR (1,1,-1), 4=FBR (1,-1,1), 5=FBL (-1,-1,1), 6=BBL (-1,-1,-1),
  // 7=BBR (1,-1,-1). For each face turn, one specific corner→corner step
  // uniquely identifies CW vs CCW; if the perm is ever flipped (CCW), the
  // expected `state[i] === j` post-condition fails. Catches the dashboard
  // "right-and-left-face-but-rotation-direction-reversed" symptom at the
  // perm-table level rather than only in the visualization.
  it('quarter turns rotate CW from outside (standard WCA convention)', () => {
    const after = (move: string) => applyCornerMove(IDENTITY_CORNER_PERM, move)!;

    // U CW from above: BTR (NE) → FTR (SE). Pos 0 receives cubie 3.
    expect(after('U')[0]).toBe(3);
    // D CW from below: FBL (UL of below view) → FBR (UR). Pos 4 receives cubie 5.
    expect(after('D')[4]).toBe(5);
    // R CW from +X: TRF (UL of right-face view) → BTR (UR). Pos 3 receives cubie 0.
    expect(after('R')[3]).toBe(0);
    // L CW from -X: BTL (UL of left-face view) → TLF (UR). Pos 1 receives cubie 2.
    expect(after('L')[1]).toBe(2);
    // F CW from +Z: TLF (UL of front-face view) → TRF (UR). Pos 0 receives cubie 1.
    expect(after('F')[0]).toBe(1);
    // B CW from -Z: BTR (UL of back-face view) → BTL (UR). Pos 2 receives cubie 3.
    expect(after('B')[2]).toBe(3);
  });
});

