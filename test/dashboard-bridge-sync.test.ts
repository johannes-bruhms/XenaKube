// Bridge ↔ dashboard ↔ phrase-plan mirror constants.
//
// Several numeric tunables live independently in three places:
//   - max/xk_swam.js          (runtime bridge to SWAM)
//   - src/phrase-plan.ts      (TypeScript shadow plan)
//   - public/js/constants.js  (dashboard rolling-score + triangle)
//
// CLAUDE.md's hard rule #4 demands a vitest equality test for every such
// mirror constant: doc-side `check:doc-sizes` constant-sync can only catch
// docs-vs-code drift, not code-vs-code drift. Each mismatch below is the
// silent-failure surface CLAUDE.md's Bridge / Dashboard invariants are
// written against (D64 PITCHBEND_RANGE_SEMI is the loudest example).
//
// The test parses literals out of each source file. Refactors that rename
// or restructure these constants should update the regexes here in lockstep
// — the test fails loudly when a regex no longer matches, which is exactly
// the breadcrumb the CLAUDE.md drift-detection table asks for.

import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

function read(...parts: string[]): string {
  return readFileSync(join(process.cwd(), ...parts), 'utf8');
}

function extractNumber(src: string, pattern: RegExp, label: string): number {
  const m = src.match(pattern);
  if (!m) throw new Error(`${label}: pattern ${pattern} matched nothing — refactor likely renamed the constant`);
  const n = Number(m[1]);
  if (!Number.isFinite(n)) throw new Error(`${label}: matched value ${m[1]} is not a finite number`);
  return n;
}

describe('paired-tunable equality (bridge ↔ phrase-plan ↔ dashboard)', () => {
  const maxBridge = read('max', 'xk_swam.js');
  const phrasePlan = read('src', 'phrase-plan.ts');
  const constants = read('public', 'js', 'constants.js');

  it('PITCHBEND_RANGE_SEMI matches across max/xk_swam.js and src/phrase-plan.ts (D64)', () => {
    const maxVal = extractNumber(
      maxBridge,
      /var\s+PITCHBEND_RANGE_SEMI\s*=\s*(\d+)\s*;/,
      'max PITCHBEND_RANGE_SEMI',
    );
    const tsVal = extractNumber(
      phrasePlan,
      /const\s+PITCHBEND_RANGE_SEMI\s*=\s*(\d+)\s*;/,
      'ts PITCHBEND_RANGE_SEMI',
    );
    expect(tsVal).toBe(maxVal);
  });

  it('MIN_GLISS_SPACING_MS matches across max/xk_swam.js and src/phrase-plan.ts (D45)', () => {
    const maxVal = extractNumber(
      maxBridge,
      /var\s+MIN_GLISS_SPACING_MS\s*=\s*(\d+)\s*;/,
      'max MIN_GLISS_SPACING_MS',
    );
    const tsVal = extractNumber(
      phrasePlan,
      /const\s+MIN_GLISS_SPACING_MS\s*=\s*(\d+)\s*;/,
      'ts MIN_GLISS_SPACING_MS',
    );
    expect(tsVal).toBe(maxVal);
  });

  it('GLISS_SLIDE_MAX_DUR_MS equals (MIN_GLISS_SPACING_MS - BEND_DUR_MARGIN_MS) (D66)', () => {
    const spacing = extractNumber(
      maxBridge,
      /var\s+MIN_GLISS_SPACING_MS\s*=\s*(\d+)\s*;/,
      'max MIN_GLISS_SPACING_MS',
    );
    const margin = extractNumber(
      maxBridge,
      /var\s+BEND_DUR_MARGIN_MS\s*=\s*(\d+)\s*;/,
      'max BEND_DUR_MARGIN_MS',
    );
    const dashVal = extractNumber(
      constants,
      /GLISS_SLIDE_MAX_DUR_MS\s*=\s*(\d+)/,
      'dashboard GLISS_SLIDE_MAX_DUR_MS',
    );
    expect(dashVal).toBe(spacing - margin);
  });

  it('PORTAMENTO_MS_PER_SEMITONE in dashboard matches max/xk_swam.js _bendDur per-complex perSemi', () => {
    // Dashboard table.
    const tableMatch = constants.match(
      /PORTAMENTO_MS_PER_SEMITONE\s*=\s*\{\s*5:\s*(\d+),\s*6:\s*(\d+),\s*7:\s*(\d+)\s*\}/,
    );
    expect(tableMatch).not.toBeNull();
    const dash = { 5: Number(tableMatch![1]), 6: Number(tableMatch![2]), 7: Number(tableMatch![3]) };

    // Max _bendDur switch — `if (complex === N) perSemi = M;` for N ∈ {5,6,7}.
    const bridge: Record<number, number> = {};
    for (const c of [5, 6, 7]) {
      const re = new RegExp(`if \\(complex === ${c}\\)\\s*perSemi\\s*=\\s*(\\d+)\\s*;`);
      const m = maxBridge.match(re);
      if (!m) throw new Error(`max _bendDur perSemi for C${c} not found — refactor likely changed _bendDur shape`);
      bridge[c] = Number(m[1]);
    }
    expect(dash).toEqual(bridge);
  });

  it('GLISS_PORTAMENTO_MS_PER_SEMITONE (rolling-chain) mirrors PORTAMENTO_MS_PER_SEMITONE (white line)', () => {
    // Visual-line + rolling-chain MUST stay in lockstep or Phase 1.3
    // `assertGlissSync` fires.
    const linear = constants.match(
      /\bPORTAMENTO_MS_PER_SEMITONE\s*=\s*\{\s*5:\s*(\d+),\s*6:\s*(\d+),\s*7:\s*(\d+)\s*\}/,
    );
    const chain = constants.match(
      /GLISS_PORTAMENTO_MS_PER_SEMITONE\s*=\s*\{\s*5:\s*(\d+),\s*6:\s*(\d+),\s*7:\s*(\d+)\s*\}/,
    );
    expect(linear).not.toBeNull();
    expect(chain).not.toBeNull();
    expect(chain![0]).toContain(`5: ${linear![1]}`);
    expect(chain![0]).toContain(`6: ${linear![2]}`);
    expect(chain![0]).toContain(`7: ${linear![3]}`);
  });
});
