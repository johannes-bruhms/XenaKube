import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('Dashboard UI collapse behavior', () => {
  const main = readFileSync(join(process.cwd(), 'public', 'js', 'main.js'), 'utf8');
  const cubeScene = readFileSync(join(process.cwd(), 'public', 'js', 'cube-scene.js'), 'utf8');

  it('keeps live K-vertex telemetry labels visible when chrome is hidden', () => {
    expect(main).not.toContain('setVertexInfoVisible');
    expect(cubeScene).not.toContain('_vertexInfoVisible');
    expect(cubeScene).toContain('if (vertices) {');
    expect(cubeScene).toContain('ctx.fillText(`${v.intensity} d${v.density.toFixed(1)}`, W / 2, 24);');
    expect(cubeScene).toContain('ctx.fillText(`${v.duration}s`, W / 2, 42);');
  });
});
