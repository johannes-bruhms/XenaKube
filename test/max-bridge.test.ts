import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('Max bridge invariants', () => {
  const source = readFileSync(join(process.cwd(), 'max', 'xk_swam.js'), 'utf8');
  const spectrumHelper = readFileSync(join(process.cwd(), 'max', 'xk_spectrum.js'), 'utf8');
  const pfftTestPatch = readFileSync(join(process.cwd(), 'max', 'pfft-test.maxpat'), 'utf8');
  const pfftSpectrumPatch = readFileSync(join(process.cwd(), 'max', 'xk_pfft_spectrum.maxpat'), 'utf8');
  const performancePatch = readFileSync(join(process.cwd(), 'max', 'xenakube_swam.maxpat'), 'utf8');
  const relayController = readFileSync(join(process.cwd(), 'max', 'relay-controller.js'), 'utf8');
  const generatedInclude = readFileSync(join(process.cwd(), 'max', 'gen_includes.js'), 'utf8');
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

  it('keeps the optional spectrum helper schema-backed', () => {
    expect(spectrumHelper).toContain('include("gen_includes.js");');
    expect(spectrumHelper).toContain('OSC.SPECTRUM_FRAME');
    expect(spectrumHelper).toContain('function frame()');
    expect(spectrumHelper).toContain('function bins()');
    expect(spectrumHelper).toContain('function rawbins()');
    expect(spectrumHelper).toContain('function rawconfig(');
    expect(spectrumHelper).toContain('[udpsend 127.0.0.1 57122]');
    expect(spectrumHelper).not.toContain('/xk/spectrum/frame');
  });

  it('keeps the pfft spectrum test patch on stock Max objects feeding rawbins', () => {
    expect(pfftTestPatch).toContain('pfft~ xk_pfft_spectrum 1024 4');
    expect(pfftTestPatch).toContain('buffer~ xk_fft_mag @samps 1024');
    expect(pfftTestPatch).toContain('receive~ xk_spectrum_tap');
    expect(pfftTestPatch).toContain('prepend rawbins');
    expect(pfftTestPatch).toContain('v8 xk_spectrum.js @autowatch 1');
    expect(pfftTestPatch).toContain('udpsend 127.0.0.1 57122');
    expect(pfftSpectrumPatch).toContain('fftin~ 1');
    expect(pfftSpectrumPatch).toContain('cartopol~');
    expect(pfftSpectrumPatch).toContain('poke~ xk_fft_mag');
    expect(pfftSpectrumPatch).not.toMatch(/pipo|mubu/i);
  });

  it('keeps the performance-host spectrum sender aligned with the test harness', () => {
    expect(performancePatch).toContain('XenaKube pfft spectrogram sender');
    expect(performancePatch).toContain('pfft~ xk_pfft_spectrum 1024 4');
    expect(performancePatch).toContain('buffer~ xk_fft_mag @samps');
    expect(performancePatch).toContain('prepend rawbins');
    expect(performancePatch).toContain('v8 xk_spectrum.js');
    expect(performancePatch).toContain('udpsend 127.0.0.1 57122');
  });

  it('keeps per-complex pitch ranges commented out in Max and the TS phrase planner', () => {
    const uncommentedMax = stripComments(source);
    const uncommentedPlanner = stripComments(phrasePlanSource);

    expect(source).toContain('// previous register:{ lo:36, hi:72 }');
    expect(source).toContain('// D79 previous bounded range: register:{ lo:36, hi:60 }');
    expect(phrasePlanSource).toContain('/* previous register: { lo: 60, hi: 84 } */');
    expect(uncommentedMax).not.toMatch(/\bregister\s*:\s*\{/);
    expect(uncommentedPlanner).not.toMatch(/\bregister\s*:\s*\{/);
    expect(source).not.toMatch(/\bs\s*\[\s*Math\.floor\s*\(\s*s\.length\s*\/\s*2\s*\)\s*\]/);
    expect(phrasePlanSource).not.toMatch(/\bs\s*\[\s*Math\.floor\s*\(\s*s\.length\s*\/\s*2\s*\)\s*\]/);
  });

  it('keeps every normal complex first audible event scheduled immediately', () => {
    const phraseC1 = extractLastFunction('phraseC1');
    const phraseC2 = extractLastFunction('phraseC2');
    const phraseC3 = extractLastFunction('phraseC3');
    const phraseC4 = extractLastFunction('phraseC4');
    const phraseC5 = extractLastFunction('phraseC5');
    const phraseC6 = extractLastFunction('phraseC6');
    const phraseC7 = extractLastFunction('phraseC7');
    const phraseC8 = extractLastFunction('phraseC8');

    expect(phraseC1).toContain('var t = (idx === 0) ? 0');
    expect(phraseC2).toContain('noteOnAbs[i] = (i === 0) ? 0');
    expect(phraseC3).toContain('noteTimes.push(i === 0 ? 0');
    expect(phraseC4).toContain('var t = (idx === 0) ? 0');
    expect(phraseC5).toContain('legatoNote(inst, lastPitchRef.p, anchorVel)');
    expect(phraseC6).toContain('scheduleAt(inst, 0, function()');
    expect(phraseC7).toContain('legatoNote(inst, p1, humanVel(vel))');
    expect(phraseC8).toContain('scheduleAt(inst, 0, function()');
    expect(source).toContain('var FIRST_GLISS_MS_C6 = 30;');
    expect(phrasePlanSource).toContain('const FIRST_GLISS_MS_C6 = 30;');
    expect(phraseC6).toContain('glissSchedule(requestedCount - 1, FIRST_GLISS_MS_C6');
    expect(phrasePlanSource).toContain('glissSchedule(requestedCount - 1, FIRST_GLISS_MS_C6');
    expect(phraseC6).toContain('var slideDelay = (idx === 0) ? 0 : humanDelay();');
  });

  it('keeps phrase-start expression seeds above the live-onset floor', () => {
    const scheduleExprEnvelope = extractLastFunction('scheduleExprEnvelope');
    const schedulePhraseArc = extractLastFunction('schedulePhraseArc');
    const schedulePhraseHairpin = extractLastFunction('schedulePhraseHairpin');
    const phraseC2 = extractLastFunction('phraseC2');
    const handleVoice = extractLastFunction('handleVoice');

    expect(generatedInclude).toContain('var ONSET_EXPRESSION_MIN =');
    expect(source).toContain('function onsetExpressionValue(val)');
    expect(scheduleExprEnvelope).toContain('onsetExpressionValue(peakExpr * env.attack)');
    expect(schedulePhraseArc).toContain('onsetLo = onsetExpressionValue(lo)');
    expect(schedulePhraseArc).toContain('hi = onsetExpressionValue(peakExpr * ARC_CEIL)');
    expect(schedulePhraseHairpin).toContain('onsetLo = onsetExpressionValue(lo)');
    expect(phraseC2).toContain('if (idx === 0) exprVal = onsetExpressionValue(exprVal);');
    expect(handleVoice).toContain('onsetExpressionValue(inst.peakExpr)');
    expect(handleVoice).toContain('onsetExpressionValue(inst.peakExpr * c2StartMul)');
  });

  it('keeps C3 retriggers free of cross-phrase tails and same-pitch noteoff races', () => {
    const handleVoice = extractLastFunction('handleVoice');
    const legatoNoteOverlap = extractLastFunction('legatoNoteOverlap');

    expect(generatedInclude).not.toContain('"3": true');
    expect(handleVoice).toContain('var preserveTail = (complexType !== 3 && LEGATO_COMPLEX[complexType] === true);');
    expect(handleVoice).toContain('C3 ONSET TAIL FAIL');
    expect(handleVoice).toContain('allNotesOff(inst);');
    expect(source).toContain('function sameMidiPitch(a, b)');
    expect(legatoNoteOverlap).toContain('sameMidiPitch(oldNotes[i], pitch)');
    expect(legatoNoteOverlap).toContain('noteOff(inst, oldNotes[i]);');
    expect(legatoNoteOverlap).toContain('removeActiveNote(inst, oldNotes[i]);');
    expect(legatoNoteOverlap).toContain('overlapNotes.push(oldNotes[i]);');
    expect(source).toContain('samePitchRetriggers=');
    expect(source).toContain('tailClears=');
  });

  it('keeps face grammar out of live pitch/register selection', () => {
    const handleFace = extractLastFunction('handleFace');
    const pickPitch = extractLastFunction('pickPitch');
    const phraseC2 = extractLastFunction('phraseC2');
    const phraseC6 = extractLastFunction('phraseC6');
    const phraseC7 = extractLastFunction('phraseC7');

    expect(handleFace).toContain('state.faceTranspose = 0;');
    expect(handleFace).toContain('state.faceMotion = null;');
    expect(handleFace).not.toMatch(/registerBias\s*\*/);
    expect(pickPitch).not.toMatch(/faceTr|faceTranspose/);
    expect(phrasePlanSource).not.toMatch(/faceTranspose\(/);
    expect(phraseC2).toContain('commitSieveWalk(count, null)');
    expect(phraseC6).toContain('commitSieveWalk(totalCount, null)');
    expect(phraseC7).not.toMatch(/faceMotion|motionDir/);
  });

  it('routes half-turn punctuation through a dedicated short assertive gesture without turning C1 into bow', () => {
    const handleVoice = extractLastFunction('handleVoice');
    const phraseHalfTurn = extractLastFunction('phraseHalfTurn');
    const phraseHalfTurnPizz = extractLastFunction('phraseHalfTurnPizz');
    const phraseHalfTurnBowed = extractLastFunction('phraseHalfTurnBowed');
    const phraseHalfTurnGliss = extractLastFunction('phraseHalfTurnGliss');
    const halfTurnGlissStroke = extractLastFunction('halfTurnGlissStroke');
    const setupHalfTurnGesture = extractLastFunction('setupHalfTurnGesture');
    const scheduleRelease = extractLastFunction('scheduleRelease');
    const router = extractLastFunction('anything');
    const handlePhrasePlan = extractLastFunction('handlePhrasePlan');

    expect(source).toContain('HALF_TURN_GESTURE_DURATION_SEC');
    expect(source).toContain('HALF_TURN_GLISS_DURATION_SEC');
    expect(source).toContain('HALF_TURN_GLISS_SPAN_BY_COMPLEX');
    expect(generatedInclude).toContain('var HALF_TURN_GLISS_DURATION_SEC =');
    expect(generatedInclude).toContain('var HALF_TURN_GLISS_SPAN_BY_COMPLEX =');
    expect(source).toContain('HALF_TURN_GESTURE_INTENSITY');
    expect(router).toContain('handleVoice(args[0], args[1], args[2], args[3], args[4], args[5])');
    expect(handlePhrasePlan).toContain('half-turn=1');
    expect(handleVoice).toContain('var halfTurn = (halfTurnFlag | 0) === 1;');
    expect(handleVoice).toContain('? HALF_TURN_GLISS_DURATION_SEC');
    expect(handleVoice).toContain('durationSource = "half-turn";');
    expect(handleVoice).toContain('setupHalfTurnGesture(inst, complexType);');
    expect(handleVoice).toContain('phraseHalfTurn(inst, HALF_TURN_GESTURE_VELOCITY, duration, complexType);');
    expect(handleVoice).toContain('isHalfTurnGlissComplex(complexType) ? "gliss" : "bowed-dyad"');
    expect(handleVoice).toContain('inst.forceComplexSetup === true');
    expect(setupHalfTurnGesture).toContain('var isPizz = complexType === 1;');
    expect(setupHalfTurnGesture).toContain('var isHarmonic = complexType === 4;');
    expect(setupHalfTurnGesture).toContain('var isGliss = isHalfTurnGlissComplex(complexType);');
    expect(setupHalfTurnGesture).toContain('inst.forceKS = true;');
    expect(setupHalfTurnGesture).toContain('inst.forceKS = prevForceKS;');
    expect(setupHalfTurnGesture).toContain('setPlayMode(inst, isPizz ? "pizz" : "bow")');
    expect(setupHalfTurnGesture).toContain('setHarmonics(inst, isHarmonic ? harmonicsForC4(inst) : HARMONICS.OFF)');
    expect(setupHalfTurnGesture).toContain('setBowPolyphony(inst, isPizz ? COMPLEX[1].bowPoly : BOW_POLY.DOUBLE_HOLD)');
    expect(setupHalfTurnGesture).toContain('ccForce(inst, CC.EXPRESSION, HALF_TURN_GESTURE_EXPR)');
    expect(setupHalfTurnGesture).toContain('inst.forceComplexSetup = true;');
    expect(phraseHalfTurn).toContain('if (complexType === 1)');
    expect(phraseHalfTurn).toContain('phraseHalfTurnPizz(inst, vel, dur);');
    expect(phraseHalfTurn).toContain('if (isHalfTurnGlissComplex(complexType))');
    expect(phraseHalfTurn).toContain('phraseHalfTurnGliss(inst, vel, dur, complexType);');
    expect(phraseHalfTurn).toContain('phraseHalfTurnBowed(inst, vel, dur);');
    expect(phraseHalfTurnPizz).toContain('noteOn(inst, p, vel)');
    expect(phraseHalfTurnPizz).not.toContain('companion');
    expect(phraseHalfTurnGliss).toContain('var span = HALF_TURN_GLISS_SPAN_BY_COMPLEX[complexType] || 7;');
    expect(phraseHalfTurnGliss).toContain('halfTurnGlissStroke(inst, p, target, durMs);');
    expect(phraseHalfTurnGliss).not.toContain('glissStep(');
    expect(halfTurnGlissStroke).toContain('OSC.MIDI_BENDSTEP');
    expect(halfTurnGlissStroke).toContain('inst.glissBendCount = (inst.glissBendCount | 0) + 1;');
    expect(halfTurnGlissStroke).toContain('rampPitchbend(inst, targetBend, strokeMs);');
    expect(halfTurnGlissStroke).not.toContain('noteOn(inst, hpTarget');
    expect(scheduleRelease).toContain('if (inst.halfTurn) fadeMs = HALF_TURN_GESTURE_RELEASE_MS;');
    expect(scheduleRelease).toContain('if (inst.halfTurn) {');
    expect(scheduleRelease).toContain('emitPitchbend(inst, PITCHBEND_CENTER)');
    expect(phraseHalfTurnBowed).toContain('noteOn(inst, companion, Math.round(vel * 0.92), true)');
    expect(phraseHalfTurnBowed).toContain('scheduleRelease(inst, dur)');
    expect(phrasePlanSource).toContain("durationSource: DurationSource = isHalfTurn ? 'half-turn'");
    expect(phrasePlanSource).toContain('this.phraseHalfTurn(ctx);');
    expect(phrasePlanSource).toContain('this.phraseHalfTurnPizz(ctx);');
    expect(phrasePlanSource).toContain('this.phraseHalfTurnGliss(ctx);');
    expect(phrasePlanSource).toContain('this.phraseHalfTurnBowed(ctx);');
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
    for (const name of ['C2_RATE_MIN', 'C2_RATE_LOW_MAX', 'C2_RATE_FAST_MIN', 'C2_RATE_MAX', 'C2_CURVE_END_U']) {
      expect(extractNumber(source, name)).toBe(extractNumber(phrasePlanSource, name));
    }
    expect(extractNumber(source, 'C2_RATE_MIN')).toBe(3);
    expect(extractNumber(source, 'C2_RATE_LOW_MAX')).toBe(4);
    expect(extractNumber(source, 'C2_RATE_FAST_MIN')).toBe(5);
    expect(extractNumber(source, 'C2_RATE_MAX')).toBe(10);
    expect(extractNumber(source, 'C2_CURVE_END_U')).toBe(0.5);
    expect(source).toContain('var loRate = C2_RATE_MIN + turnP * (C2_RATE_FAST_MIN - C2_RATE_MIN);');
    expect(source).toContain('C2_RATE_LOW_MAX + turnP * (C2_RATE_MAX - C2_RATE_LOW_MAX)');
    expect(extractLastFunction('phraseC2')).toContain('var noteOnBudget = Math.max(count, Math.floor(dur * C2_RATE_MAX));');
    expect(extractLastFunction('phraseC2')).toContain('doubleSlotsRemaining > 0');
    expect(extractLastFunction('phraseC2')).not.toContain('rateDensityMultiplier');
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
    expect(relayController).toContain("path: '/api/shutdown'");
    expect(relayController).toContain("requestRelayShutdown('max stop relay'");
    expect(relayController).toContain("forceKillRelayChild('stop relay timeout')");
    expect(relayController).toContain("forceKillRelayChild('kill process')");
    expect(relayController).toContain("process.once('exit', cleanupRelayChildOnControllerExit)");
    expect(relayController).toContain("spawnSync('taskkill.exe'");
    expect(relayController).toContain('Get-NetTCPConnection -LocalPort ${RELAY_PORT} -State Listen');
    expect(relayController).toContain('Stop-Process -Id $_.OwningProcess -Force');
  });
});
