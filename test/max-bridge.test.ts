import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('Max bridge invariants', () => {
  const source = readFileSync(join(process.cwd(), 'max', 'xk_swam.js'), 'utf8');
  const relayController = readFileSync(join(process.cwd(), 'max', 'relay-controller.js'), 'utf8');

  function extractLastFunction(name: string): string {
    const marker = `function ${name}(`;
    const start = source.lastIndexOf(marker);
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

  it('emits pitchbend on the same one-based MIDI channel as notes and CCs', () => {
    expect(source).toContain('function statusPitchbend(ch) { return 0xE0 + (ch - 1); }');
    expect(source).toContain('var status = statusPitchbend(MIDI_CH);');
    expect(source).toContain('PITCHBEND CHANNEL FAIL');
    expect(source).not.toMatch(/emitMidi\(inst,\s*0xE0\s*\+\s*MIDI_CH/);
  });

  it('keeps C5 wild gliss bends active and prevents bend-target companion masking', () => {
    const phraseC5 = extractLastFunction('phraseC5');
    const c5CompanionCalls = phraseC5.match(/companionRef\.p\s*=\s*maybeDoubleStop\(/g) ?? [];

    expect(phraseC5).toContain('var wildAccent = rateAccentValue(WILD_GLISS_BPA, inst.activeComplex);');
    expect(phraseC5).toContain('C5 WILD ACCENT FAIL');
    expect(phraseC5).toContain('glissStep(inst, lastPitchRef.p, p, MIN_LEAP, WILD_GLISS_VEL, wildAccent, bd)');
    expect(c5CompanionCalls).toHaveLength(1);
    expect(phraseC5).not.toContain('slideVel');
    expect(source).toContain('BEND COMPANION FAIL');
    expect(source).toContain('suppressed companion noteOn during pitchbend ramp');
  });

  it('keeps relay port cleanup explicit from Max instead of auto-killing on startup', () => {
    expect(relayController).not.toContain("require('../relay')");
    expect(relayController).toContain('script start` starts this controller only');
    expect(relayController).toContain("spawn(process.execPath, ['relay.js']");
    expect(relayController).toContain('port ${RELAY_PORT} is already in use');
    expect(relayController).toContain('Max.addHandler');
    expect(relayController).toContain("Max.addHandler('relay', startRelay)");
    expect(relayController).toContain("Max.addHandler('start_relay', startRelay)");
    expect(relayController).toContain("Max.addHandler('kill_process', killRelayPortProcess)");
    expect(relayController).toContain("Max.addHandler('kill', (...args) =>");
    expect(relayController).toContain("String(args[0] || '').toLowerCase() === 'process'");
    expect(relayController).toContain('Get-NetTCPConnection -LocalPort ${RELAY_PORT} -State Listen');
    expect(relayController).toContain('Stop-Process -Id $_.OwningProcess -Force');
  });
});
