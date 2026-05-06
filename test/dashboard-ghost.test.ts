import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('Dashboard ghost cube invariants', () => {
  const source = readFileSync(join(process.cwd(), 'public', 'js', 'cube-scene.js'), 'utf8');
  const dashboard = readFileSync(join(process.cwd(), 'public', 'dashboard.html'), 'utf8');
  const main = readFileSync(join(process.cwd(), 'public', 'js', 'main.js'), 'utf8');
  const stateUi = readFileSync(join(process.cwd(), 'public', 'js', 'state-ui.js'), 'utf8');

  function extractFunction(name: string): string {
    const marker = `function ${name}(`;
    const start = source.indexOf(marker);
    expect(start, `missing ${name}`).toBeGreaterThanOrEqual(0);
    const braceStart = source.indexOf('{', start);
    expect(braceStart, `missing ${name} body`).toBeGreaterThanOrEqual(0);

    let depth = 0;
    for (let i = braceStart; i < source.length; i++) {
      const ch = source[i];
      if (ch === '{') depth++;
      if (ch === '}') depth--;
      if (depth === 0) return source.slice(start, i + 1);
    }
    throw new Error(`unterminated ${name}`);
  }

  it('supports beta-local C labels while permitting alpha walk by cAssignments', () => {
    const update = extractFunction('update');

    expect(update).toContain('state.cAssignments');
    expect(update).toContain('resolveActiveGhostC(state, activeIdx)');
    expect(update).toContain('paintActiveGhostVertex(activeCType)');
    expect(update).toContain('applyGhostCAssignmentMove(state.cAssignments, state.cosmology)');
    expect(update).toContain('if (state.cosmology === \'beta-cosmo\')');
    expect(update).toContain('assertGhostStaticLocalGeometry()');

    expect(source).toContain('[GHOST ACTIVE SLOT FAIL]');
    expect(source).toContain("state.cosmology === 'beta-cosmo'");
    expect(source).toContain('return activeIdx');
    expect(source).toContain('const slotOfC = new Array(8);');
    expect(source).toContain('ghostVertPosTarget[c].copy(target);');
    expect(source).toContain('return assigned;');
    expect(source).toContain('[GHOST SNAP FAIL]');
  });

  it('advances face glyph rotations from dashboard state move', () => {
    const update = extractFunction('update');

    expect(main).toContain('transportOn(\'state\', (data, move) => {');
    expect(main).toContain('cubeScene.update(data, move);');

    expect(update).toContain('applyFaceTurnGlyphRotation(move);');
    expect(source).toContain('const _faceTurnStates');
    expect(source).toContain('const state = _faceTurnStates[face];');
    expect(source).toContain('state.twist.setFromAxisAngle');
    expect(source).toContain('state.mesh.quaternion.copy(state.base).multiply(state.twist);');
  });

  it('exposes the alpha/beta cosmology switch through the dashboard', () => {
    expect(dashboard).toContain('id="mode-cosmology"');
    expect(dashboard).toContain('BETA-COSMO');

    expect(main).toContain("wsSend({ type: 'set_mode', cosmology: next })");
    expect(main).toContain("next = currentCosmology === 'alpha-cosmo' ? 'beta-cosmo' : 'alpha-cosmo'");
    expect(main).toContain('stateUi.setCosmologyBadge(next)');

    expect(stateUi).toContain('export function setCosmologyBadge(cosmology)');
    expect(stateUi).toContain('cosmology-alpha');
    expect(stateUi).toContain('cosmology-beta');
  });
});
