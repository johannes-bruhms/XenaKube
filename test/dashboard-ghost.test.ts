import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('Dashboard ghost cube invariants', () => {
  const source = readFileSync(join(process.cwd(), 'public', 'js', 'cube-scene.js'), 'utf8');
  const dashboard = readFileSync(join(process.cwd(), 'public', 'dashboard.html'), 'utf8');
  const main = readFileSync(join(process.cwd(), 'public', 'js', 'main.js'), 'utf8');
  const stateUi = readFileSync(join(process.cwd(), 'public', 'js', 'state-ui.js'), 'utf8');
  const faceGlyph = readFileSync(join(process.cwd(), 'public', 'js', 'face-glyph.js'), 'utf8');

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

  it('mounts face-signature glyphs with side remap and through-cube visibility', () => {
    expect(main).toContain('transportOn(\'state\', (data, move) => {');
    expect(main).toContain('cubeScene.update(data, move);');

    expect(source).toContain("const FACE_GLYPH_DISPLAY_FACE = {");
    expect(source).toContain("L: 'F'");
    expect(source).toContain("U: 'U'");
    expect(source).toContain("D: 'D'");
    expect(source).toContain('const FACE_GLYPH_BASE_TURNS = {');
    expect(source).toContain('D: 2');
    expect(source).toContain('paintFaceGlyph(ctx, displayFace, { compact: true, background: false });');
    expect(source).toContain('side: THREE.DoubleSide');
    expect(source).toContain('depthTest: false');
    expect(source).toContain('const FACE_GLYPH_OPACITY = 0.66;');
    expect(source).toContain('function updateFaceGlyphVisibility()');
    expect(source).toContain('g.mat.opacity = visible ? FACE_GLYPH_OPACITY : 0;');
    expect(source).toContain('g.mesh.visible = visible;');
    expect(source).not.toContain('const facing =');
    expect(source).not.toContain('_faceGlyphLocalCamera');
    expect(source).toContain('const ghostFaceGlyphs = [];');
    expect(source).toContain('const _faceTurnStates = {};');
    expect(source).toContain('_faceTurnStates[meshFace] = glyph;');
    expect(source).not.toContain('_faceTurnStates[displayFace] = glyph;');
    expect(source).toContain('function applyFaceTurnGlyphRotation(move)');
    expect(source).toContain("let turns = suffix.includes('2') ? 2 : -1;");
    expect(source).toContain('if (suffix.includes("\'")) turns = -turns;');
    expect(source).toContain('g.mesh.quaternion.copy(g.base).multiply(_faceGlyphTwist);');
    expect(source).toContain('function finishFaceGlyphTurn(g)');
    expect(source).toContain('setFaceGlyphTurn(g, 0);');
    expect(source).toContain('if (!g.turning) return;');
    expect(source).toContain('g.targetTurns = turns;');
    expect(source).not.toContain('g.targetTurns += turns;');
    expect(source).toContain('g.turning = true;');
    expect(source).toContain('g.turning = false;');
    expect(source).toContain('applyFaceTurnGlyphRotation(move);');
    expect(dashboard).toContain('active-face-glyph');
    expect(stateUi).toContain('paintFaceGlyph(activeFaceGlyphCtx, face, { activeMove: move });');
    expect(faceGlyph).not.toContain('faceLetter');
    expect(faceGlyph).not.toContain('fillText(face');
    expect(faceGlyph).toContain('bottom underline baked into the texture');
    expect(faceGlyph).toContain('ctx.lineTo(rowX + rowW * 0.82, row.y + rowH - H * 0.045);');
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
