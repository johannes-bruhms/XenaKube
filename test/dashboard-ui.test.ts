import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('Dashboard UI collapse behavior', () => {
  const main = readFileSync(join(process.cwd(), 'public', 'js', 'main.js'), 'utf8');
  const cubeScene = readFileSync(join(process.cwd(), 'public', 'js', 'cube-scene.js'), 'utf8');
  const rollingScore = readFileSync(join(process.cwd(), 'public', 'js', 'rolling-score.js'), 'utf8');

  it('keeps live K-vertex telemetry labels visible when chrome is hidden', () => {
    expect(main).not.toContain('setVertexInfoVisible');
    expect(cubeScene).not.toContain('_vertexInfoVisible');
    expect(cubeScene).toContain('if (vertices) {');
    expect(cubeScene).toContain('ctx.fillText(`${v.intensity} d${v.density.toFixed(1)}`, W / 2, 24);');
    expect(cubeScene).toContain('ctx.fillText(`${v.duration}s`, W / 2, 42);');
  });

  it('keeps cube-scene vertex labels out of the bloom pass', () => {
    expect(cubeScene).toContain('const SHARP_LABEL_LAYER = 1;');
    expect(cubeScene).toContain('sprite.layers.set(SHARP_LABEL_LAYER);');
    expect(cubeScene).toContain('function renderSharpLabels()');
    expect(cubeScene).toContain('camera.layers.set(SHARP_LABEL_LAYER);');
    expect(cubeScene).toContain('renderSharpLabels();');
  });

  it('clips gliss companion overlays to the rolling-score pitch range', () => {
    expect(rollingScore).toContain('function _companionDyFromOffset(offsetSemis, mainPitch, mainY, canvasH)');
    expect(rollingScore).toContain('const companionPitch = mainPitch + offsetSemis;');
    expect(rollingScore).toContain('if (companionPitch < ROLL_MIN_MIDI || companionPitch > ROLL_MAX_MIDI) return null;');
    expect(rollingScore).toContain('return midiToY(companionPitch, canvasH) - mainY;');
    expect(rollingScore).toContain('if (a.compOffset !== b.compOffset) continue;');
    expect(rollingScore).not.toContain('chainCompOffsetSemis');
  });
});
