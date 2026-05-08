import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('Max bridge invariants', () => {
  const source = readFileSync(join(process.cwd(), 'max', 'xk_swam.js'), 'utf8');
  const relayController = readFileSync(join(process.cwd(), 'max', 'relay-controller.js'), 'utf8');
  const phrasePlanSource = readFileSync(join(process.cwd(), 'src', 'phrase-plan.ts'), 'utf8');

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

  function extractNumber(src: string, name: string): number {
    const match = src.match(new RegExp(`(?:var|const)\\s+${name}\\s*=\\s*([0-9.]+);`));
    expect(match, `missing ${name}`).not.toBeNull();
    return Number(match![1]);
  }

  function stripComments(src: string): string {
    return src
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/\/\/.*$/gm, '');
  }

  it('emits pitchbend on the same one-based MIDI channel as notes and CCs', () => {
    expect(source).toContain('function statusPitchbend(ch) { return 0xE0 + (ch - 1); }');
    expect(source).toContain('var status = statusPitchbend(MIDI_CH);');
    expect(source).toContain('PITCHBEND CHANNEL FAIL');
    expect(source).not.toMatch(/emitMidi\(inst,\s*0xE0\s*\+\s*MIDI_CH/);
  });

  it('keeps per-complex pitch ranges commented out in Max and the TS phrase planner', () => {
    const uncommentedMax = stripComments(source);
    const uncommentedPlanner = stripComments(phrasePlanSource);

    expect(source).toContain('// previous register:{ lo:36, hi:72 }');
    expect(source).toContain('// D79 previous bounded range: register:{ lo:36, hi:60 }');
    expect(phrasePlanSource).toContain('/* previous register: { lo: 60, hi: 84 } */');
    expect(uncommentedMax).not.toMatch(/\bregister\s*:\s*\{/);
    expect(uncommentedPlanner).not.toMatch(/\bregister\s*:\s*\{/);
  });

  it('keeps C5 wild gliss bends active and prevents bend-target companion masking', () => {
    const phraseC5 = extractLastFunction('phraseC5');

    expect(phraseC5).toContain('var wildAccent = rateAccentValue(WILD_GLISS_BPA, inst.activeComplex);');
    expect(phraseC5).toContain('C5 WILD ACCENT FAIL');
    expect(phraseC5).toContain('glissStep(inst, lastPitchRef.p, target, MIN_LEAP, WILD_GLISS_VEL, wildAccent, bd)');
    expect(phraseC5).toContain('maybeGlissDoubleStop(inst, lastPitchRef.p, anchorVel, 0.50, pathMin, pathMax)');
    expect(phraseC5).not.toContain('clearCompanion');
    expect(source).toContain('DOUBLE STOP RANGE FAIL');
    expect(source).toContain('DOUBLE STOP FAIL');
    expect(source).toContain('doubleStopCompanionForRange');
    expect(source).toContain('gc.revoiceCount = (gc.revoiceCount | 0) + 1;');
    expect(source).toContain('var companionTransitions = bends + leaps;');
    expect(source).toContain('" transitions=" + companionTransitions');
    expect(phraseC5).not.toContain('slideVel');
    expect(source).toContain('BEND COMPANION FAIL');
    expect(source).toContain('suppressed companion noteOn during pitchbend ramp');
  });

  it('keeps C2 monophonic by default with explicit per-note CC 81 mode for intentional double stops', () => {
    // COMPLEX[2].bowPoly is the BASELINE (re-asserted per /xk/voice in
    // handleVoice): MONO_POLY_RELEASE so the run defaults to monophonic
    // and accidental inter-note overlap cannot chord. phraseC2 toggles
    // the mode per note — DOUBLE_HOLD for intentional double-stop dyads,
    // back to MONO_POLY_RELEASE for monophonic notes — so chord risk is
    // bounded structurally to the explicit double-stop branch.
    const c2BlockMatch = source.match(/\b2:\s*\{[\s\S]*?register:\{\s*lo:40,\s*hi:64\s*\}\s*\}/);
    expect(c2BlockMatch, 'COMPLEX[2] block not found').not.toBeNull();
    const c2Block = c2BlockMatch![0];
    expect(c2Block).toContain('bowPoly:BOW_POLY.MONO_POLY_RELEASE');
    expect(c2Block).not.toContain('bowPoly:BOW_POLY.DOUBLE_HOLD');

    // phraseC2 writes CC.BOW_POLYPHONY per note with both modes present
    // and uses doubleStopCompanion for the intentional dyad pitch.
    const phraseC2 = extractLastFunction('phraseC2');
    expect(phraseC2).toMatch(/CC\.BOW_POLYPHONY/);
    expect(phraseC2).toMatch(/BOW_POLY\.DOUBLE_HOLD/);
    expect(phraseC2).toMatch(/BOW_POLY\.MONO_POLY_RELEASE/);
    expect(phraseC2).toMatch(/doubleStopCompanion\s*\(/);
    // C2 does not use maybeDoubleStop — its probability check fires
    // inline so the per-note CC 81 mode flip stays in lockstep.
    expect(phraseC2).not.toMatch(/maybeDoubleStop\s*\(/);
  });

  it('keeps C2 bow pressure as one held value per note', () => {
    const phraseC2 = extractLastFunction('phraseC2');

    expect(source).toContain('var C2_BOW_PRESSURE_JITTER = 8;');
    expect(source).toContain('bowPressureBase: 64');
    expect(source).toContain('inst.bowPressureBase = Math.round(bowBase);');
    expect(phraseC2).toContain('var bowPressureVals = new Array(count);');
    expect(phraseC2).toContain('ccForce(inst, CC.BOW_PRESSURE, bowPressure);');
    expect(phraseC2).not.toMatch(/CC\.BOW_PRESSURE,\s*clamp\(Math\.round\(bowPressBase\s*\*\s*a\)/);
    expect(phraseC2).not.toMatch(/rampCC\(inst,\s*CC\.BOW_PRESSURE/);
  });

  it('keeps C3 bow pressure and position moving from note onset with CC11-scaled rate', () => {
    const phraseC3 = extractLastFunction('phraseC3');
    const c3BowMotion = extractLastFunction('scheduleC3BowMotion');
    const handleExprTilt = extractLastFunction('handleExprTilt');
    const handleExprScramble = extractLastFunction('handleExprScramble');

    expect(source).toContain('var C3_BOW_MOTION_SLOW_RATE = 0.70;');
    expect(source).toContain('var C3_BOW_MOTION_FAST_RATE = 2.60;');
    expect(source).toContain('C3 BOW MOTION FAIL');
    expect(source).toContain('inst.c3BowMotionExpected = (complexType === 3);');
    expect(phraseC3).toContain('var exprAtOn = inst.ccCache[CC.EXPRESSION];');
    expect(phraseC3).toContain('scheduleC3BowMotion(inst, noteDurMs, exprAtOn);');
    expect(c3BowMotion).toContain('var exprNorm = clamp(exprAtOn / 127, 0, 1);');
    expect(c3BowMotion).toContain('var speed = C3_BOW_MOTION_SLOW_RATE + (1 - exprNorm) * (C3_BOW_MOTION_FAST_RATE - C3_BOW_MOTION_SLOW_RATE);');
    expect(c3BowMotion).toContain('rampCC(inst, CC.BOW_POSITION, posEnd, rampMs);');
    expect(c3BowMotion).toContain('rampCC(inst, CC.BOW_PRESSURE, prEnd, rampMs);');
    expect(handleExprTilt).toContain('if (inst.activeComplex === 3) continue;');
    expect(handleExprScramble).toContain('if (inst.activeComplex === 3 || inst.activeComplex === 4) continue;');
  });

  it('keeps every Bow Position writer in the lower half of the CC range', () => {
    const c3BowMotion = extractLastFunction('scheduleC3BowMotion');
    const c4BowMotion = extractLastFunction('scheduleC4BowMotion');
    const handleExprTilt = extractLastFunction('handleExprTilt');
    const handleExprScramble = extractLastFunction('handleExprScramble');

    expect(source).toContain('var BOW_POSITION_MIN = 0;');
    expect(source).toContain('var BOW_POSITION_MAX = 64;');
    expect(source).toContain('function clampBowPosition(val)');
    expect(source).toContain('val = (num === CC.BOW_POSITION) ? clampBowPosition(val) : clamp(Math.round(val), 0, 127);');
    expect(source).toContain('target = (num === CC.BOW_POSITION) ? clampBowPosition(target) : clamp(Math.round(target), 0, 127);');
    expect(c3BowMotion).toContain('c3ShiftEndpoint(posStart, posMag, BOW_POSITION_MIN, BOW_POSITION_MAX)');
    expect(c4BowMotion).toContain('posStart = rrand(BOW_POSITION_MIN, BOW_POSITION_MAX - posMag);');
    expect(c4BowMotion).toContain('posStart = rrand(BOW_POSITION_MIN + posMag, BOW_POSITION_MAX);');
    expect(handleExprTilt).toContain('var newVal = clampBowPosition(inst.bowPosBase + jitter + state.scrambleBowBias);');
    expect(handleExprScramble).toContain('ccForce(inst, CC.BOW_POSITION, clampBowPosition(inst.bowPosBase + jitter + effectiveBias));');

    const bowPosValues = [...source.matchAll(/bowPos(?:Alt)?:([0-9]+)/g)].map(m => Number(m[1]));
    expect(bowPosValues.length).toBeGreaterThan(0);
    expect(Math.max(...bowPosValues)).toBeLessThanOrEqual(64);
  });

  it('keeps C2 tempo tunables mirrored between Max and the TS phrase planner', () => {
    for (const name of ['C2_RATE_MIN', 'C2_RATE_MAX', 'C2_RATE_SPAN_RATIO', 'C2_CURVE_END_U']) {
      expect(extractNumber(source, name)).toBe(extractNumber(phrasePlanSource, name));
    }
    expect(extractNumber(source, 'C2_RATE_MIN')).toBe(4);
    expect(extractNumber(source, 'C2_RATE_MAX')).toBe(12);
    expect(extractNumber(source, 'C2_RATE_SPAN_RATIO')).toBe(2);
    expect(extractNumber(source, 'C2_CURVE_END_U')).toBe(0.5);
    expect(source).toContain('var w = Math.min(1, u / C2_CURVE_END_U);');
    expect(phrasePlanSource).toContain('const w = Math.min(1, u / C2_CURVE_END_U);');
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
