import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

function read(...parts: string[]): string {
  return readFileSync(join(process.cwd(), ...parts), 'utf8');
}

describe('Interruption layer boundary', () => {
  const main = read('public', 'js', 'main.js');
  const runtime = read('public', 'interruption', 'index.js');
  const config = read('public', 'interruption', 'config.js');
  const clips = read('public', 'interruption', 'clips.js');

  it('stays feature-flagged and wired only through main.js', () => {
    expect(main).toContain("import { initInterruptionLayer } from '../interruption/index.js'");
    expect(main).toContain("intrusionParams.get('intrusions') === '1'");
    expect(main).toContain("intrusionParams.get('intrusionDebug') === '1'");
    expect(main).toContain('interruptionLayer.onState(data, move)');
    expect(main).toContain('interruptionLayer.onAlgorithm(data)');
    expect(main).toContain('interruptionLayer.onSolve()');
    expect(main).toContain('interruptionLayer.onMidiEcho(data)');
    expect(main).toContain('interruptionLayer.onPanic()');
  });

  it('exposes the planned detachable API and owns its DOM/CSS', () => {
    expect(runtime).toContain('export function initInterruptionLayer');
    for (const method of [
      'onState(data, move)',
      'onAlgorithm(event)',
      'onSolve()',
      'onMidiEcho(data)',
      'onPanic()',
      'destroy()',
    ]) {
      expect(runtime).toContain(method);
    }
    expect(runtime).toContain('document.createElement(\'style\')');
    expect(runtime).toContain('STYLE_TEXT');
    expect(runtime).toContain('removeDom()');
    expect(runtime).toContain('[interruption]');
  });

  it('does not couple the overlay to existing visual modules', () => {
    expect(runtime).not.toContain("from '../js/triangle");
    expect(runtime).not.toContain("from '../js/rolling-score");
    expect(runtime).not.toContain("from '../js/sieve");
    expect(runtime).not.toContain('line-overlay');
    expect(runtime).not.toContain('rollingScore');
    expect(runtime).not.toContain('sieveNote');
  });

  it('keeps first-draft tunables and placeholder clips local', () => {
    expect(config).toContain('INTERRUPTION_STATES');
    expect(config).toContain('CLEAN_MS');
    expect(config).toContain('PRESSURE');
    expect(clips).toContain('generated:crisis-grid');
    expect(clips).toContain('generated:war-signal');
    expect(clips).toContain('generated-comfort-horizon');
  });
});
