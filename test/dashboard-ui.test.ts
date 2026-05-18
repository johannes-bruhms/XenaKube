import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('Dashboard UI collapse behavior', () => {
  const dashboardHtml = readFileSync(join(process.cwd(), 'public', 'dashboard.html'), 'utf8');
  const mainCss = readFileSync(join(process.cwd(), 'public', 'css', 'main.css'), 'utf8');
  const main = readFileSync(join(process.cwd(), 'public', 'js', 'main.js'), 'utf8');
  const cubeScene = readFileSync(join(process.cwd(), 'public', 'js', 'cube-scene.js'), 'utf8');
  const triangle = readFileSync(join(process.cwd(), 'public', 'js', 'triangle.js'), 'utf8');
  const rollingScore = readFileSync(join(process.cwd(), 'public', 'js', 'rolling-score.js'), 'utf8');
  const spectrumScore = readFileSync(join(process.cwd(), 'public', 'js', 'spectrum-score.js'), 'utf8');
  const stateUi = readFileSync(join(process.cwd(), 'public', 'js', 'state-ui.js'), 'utf8');
  const performanceRecorder = readFileSync(join(process.cwd(), 'public', 'js', 'performance-recorder.js'), 'utf8');

  it('keeps live K-vertex telemetry labels visible when chrome is hidden', () => {
    expect(main).not.toContain('setVertexInfoVisible');
    expect(cubeScene).not.toContain('_vertexInfoVisible');
    expect(cubeScene).toContain('if (vertices) {');
    expect(cubeScene).toContain('function drawLabelPanel(ctx, lines)');
    expect(cubeScene).toContain('LABEL_PANEL_FILL');
    expect(cubeScene).toContain('text: `${v.intensity} d${v.density.toFixed(1)}`');
    expect(cubeScene).toContain('text: `${v.duration}s`');
  });

  it('keeps cube-scene vertex labels out of the bloom pass', () => {
    expect(cubeScene).toContain('const SHARP_LABEL_LAYER = 1;');
    expect(cubeScene).toContain('sprite.layers.set(SHARP_LABEL_LAYER);');
    expect(cubeScene).toContain('function renderSharpLabels()');
    expect(cubeScene).toContain('camera.layers.set(SHARP_LABEL_LAYER);');
    expect(cubeScene).toContain('renderSharpLabels();');
  });

  it('keeps Med and High bloom visually distinct in the quality presets', () => {
    expect(cubeScene).toContain("med:  { useComposer: true,  strength: 0.32, radius: 0.30, threshold: 0.90");
    expect(cubeScene).toContain("high: { useComposer: true,  strength: 1.45, radius: 1.05, threshold: 0.42");
    expect(cubeScene).toContain('halo.material.opacity = p.haloOpacity');
    expect(cubeScene).toContain('activeRing.scale.set(p.activeScale, p.activeScale, 1);');
  });

  it('keeps the live cube edge wireframe on both base and adaptive passes', () => {
    expect(cubeScene).toContain('const LIVE_EDGE_COLOR = 0xffffff;');
    expect(cubeScene).toContain('const edgeMat = new THREE.LineBasicMaterial({');
    expect(cubeScene).toContain('edgeOpacity: 0.28');
    expect(cubeScene).toContain('contrastEdgeOpacity: 0.88');
    expect(cubeScene).toContain('edgeMat.opacity = p.edgeOpacity;');
  });

  it('renders adaptive live and ghost wireframes on a contrast blend layer', () => {
    expect(dashboardHtml).toContain('<svg id="cube-contrast-layer" aria-hidden="true"></svg>');
    expect(mainCss).toContain('#cube-contrast-layer');
    expect(mainCss).toContain('mix-blend-mode: difference;');
    expect(cubeScene).toContain("document.getElementById('cube-contrast-layer')");
    expect(cubeScene).toContain("document.createElementNS(SVG_NS, 'line')");
    expect(cubeScene).toContain('strokeContrastEdges(ghostGroup, CUBE_EDGES, contrastGhostAlpha');
    expect(cubeScene).toContain('function renderAdaptiveWireframes()');
    expect(cubeScene).toContain('renderAdaptiveWireframes();');
  });

  it('conjures active K/C cards from the ghost active C anchor after phrase trigger', () => {
    expect(main).toContain('stateUi.init({');
    expect(main).toContain('getActiveCardAnchorScreenPos: cubeScene.getActiveCardAnchorScreenPos');
    expect(cubeScene).toContain('export function getActiveCardAnchorScreenPos(out = {})');
    expect(cubeScene).toContain('export const getActiveCScreenPos = getActiveCardAnchorScreenPos;');
    expect(cubeScene).toContain('function applyActivePairConjure(now)');
    expect(cubeScene).toContain('startActivePairConjure();');
    expect(cubeScene).toContain('vertexMeshes[currentActiveK].getWorldPosition(_activePairKWorld);');
    expect(cubeScene).toContain('ghostVertMeshes[currentActiveC].getWorldPosition(_activePairCWorld);');
    expect(cubeScene).toContain('vertexMeshes[currentActiveK].position.copy(_activePairKPullLocal);');
    expect(cubeScene).toContain('ghostVertMeshes[currentActiveC].position.copy(_activePairCPullLocal);');
    expect(cubeScene).toContain('vertexLabels[currentActiveK].sprite.position.copy(_activePairLabelLocal);');
    expect(cubeScene).toContain('ghostLabels[currentActiveC].sprite.position.copy(_activePairLabelLocal);');
    expect(cubeScene).toContain('labelOpacity(vertexLabels[k], k === currentActiveK ? labelAlpha : 1);');
    expect(cubeScene).toContain('labelOpacity(ghostLabels[c], c === currentActiveC ? labelAlpha : 1);');
    expect(cubeScene).toContain('ghostVertMeshes[currentActiveC].getWorldPosition(_activeCScreenWorld);');
    expect(cubeScene).toContain('ghostGroup.getWorldPosition(_activeCardGhostCenterWorld);');
    expect(cubeScene).toContain("out.side = _activeCScreenProj.x >= _activeCardGhostCenterProj.x ? 'left' : 'right';");
    expect(cubeScene).not.toContain('_activePairCardAnchorWorld');
    expect(stateUi).toContain('getActiveCardAnchorScreenPos');
    expect(stateUi).toContain("const preferLeft = anchor.side === 'left';");
    expect(stateUi).toContain('let x = preferLeft ? anchor.x - w - gap : anchor.x + gap;');
    expect(stateUi).toContain('if (move) showActiveCards();');
    expect(stateUi).toContain('showActiveCards();');
    expect(stateUi).toContain("activeCardsEl.classList.add('conjuring');");
    expect(stateUi).toContain('requestAnimationFrame(positionActiveCards);');
    expect(stateUi).toContain('activeCardsEl.style.transform = `translate3d(');
    expect(mainCss).toContain('@keyframes active-card-conjure');
    expect(mainCss).toContain('.active-cards.phrase-active:not(.anchor-hidden)');
    expect(mainCss).toContain('transform: translate3d(-9999px, -9999px, 0);');
    expect(mainCss).toContain('transition: opacity 0.16s ease;');
    expect(mainCss).not.toContain('transform 0.12s ease-out');
  });

  it('clips gliss companion overlays to the rolling-score pitch range', () => {
    expect(rollingScore).toContain('function _companionDyFromOffset(offsetSemis, mainPitch, mainY, canvasH)');
    expect(rollingScore).toContain('const companionPitch = mainPitch + offsetSemis;');
    expect(rollingScore).toContain('if (companionPitch < ROLL_MIN_MIDI || companionPitch > ROLL_MAX_MIDI) return null;');
    expect(rollingScore).toContain('return midiToY(companionPitch, canvasH) - mainY;');
    expect(rollingScore).toContain('if (a.compOffset !== b.compOffset) continue;');
    expect(rollingScore).not.toContain('chainCompOffsetSemis');
  });

  it('keeps the optional spectrogram below independently-toggleable MIDI brushes', () => {
    expect(dashboardHtml.indexOf('id="spectrogram-score"')).toBeLessThan(dashboardHtml.indexOf('id="rolling-score"'));
    expect(dashboardHtml).toContain('id="midiBrushToggle"');
    expect(dashboardHtml).toContain('id="spectrogramToggle"');
    expect(dashboardHtml).toContain('id="spectrogramSettingsToggle"');
    expect(dashboardHtml).toContain('id="spectrogramSettingsPanel"');
    expect(dashboardHtml).toContain('id="spectrumLatency"');
    expect(dashboardHtml).toContain('id="spectrumNudge"');
    expect(dashboardHtml).toContain('id="spectrumCeiling"');
    expect(dashboardHtml).toContain('id="spectrumBgColor"');
    expect(dashboardHtml).toContain('id="spectrumCeilingColor"');
    expect(dashboardHtml).toContain('id="modalityPaletteEditor"');
    expect(dashboardHtml).toContain('id="resetModalityPalettes"');
    expect(mainCss).toContain('#spectrogram-score');
    expect(mainCss).toContain('z-index: -2;');
    expect(mainCss).toContain('#rolling-score');
    expect(mainCss).toContain('.spectrogram-settings-panel');
    expect(main).toContain("import * as spectrumScore from './spectrum-score.js';");
    expect(main).toContain("transportOn('spectrumFrame', spectrumScore.handleFrame);");
    expect(main).toContain("wsSend({ type: 'set_spectrum_enabled', enabled: spectrumEnabled });");
    expect(main).toContain('setSpectrogramSettingsOpen');
    expect(main).toContain('renderModalityPaletteEditor');
    expect(main).toContain('spectrumBgColor');
    expect(main).toContain('SPECTRUM_BG_COLOR_STORAGE');
    expect(main).toContain('spectrumCeilingColor');
    expect(main).toContain('SPECTRUM_CEILING_COLOR_STORAGE');
    expect(main).toContain('stop.stop === 0 || stop.stop === 1');
    expect(main).toContain('spectrumModalityPalettes');
    expect(main).toContain('spectrumModalityTransfer');
    expect(rollingScore).toContain('export function setVisible(value)');
    expect(rollingScore).toContain('export function setVisualDelay(ms)');
    expect(spectrumScore).toContain('MODALITY_PALETTES');
    expect(spectrumScore).toContain('MODALITY_LABELS');
    expect(spectrumScore).toContain('export function setCeilingDb');
    expect(spectrumScore).toContain('export function getModalityPaletteSettings');
    expect(spectrumScore).toContain('export function setModalityPaletteStop');
    expect(spectrumScore).toContain('export function setModalityTransfer');
    expect(spectrumScore).toContain('export function setAllModalityBackgroundColors');
    expect(spectrumScore).toContain('export function setAllModalityCeilingColors');
    expect(spectrumScore).toContain('export function getModalityCeilingColor');
    expect(spectrumScore).toContain('BACKGROUND_RGB');
    expect(spectrumScore).toContain('CEILING_RGB');
    expect(spectrumScore).toContain('return rgbCss(BACKGROUND_RGB);');
    expect(spectrumScore).toContain('const floorPacked = packedRgb(BACKGROUND_RGB);');
    expect(spectrumScore).toContain('syncPaletteBackgroundStops');
    expect(spectrumScore).toContain('syncPaletteCeilingStops');
    expect(spectrumScore).toContain('export function resetModalityPalettes');
    expect(spectrumScore).toContain('modalityStatus(prevDrawnFrame)');
    expect(spectrumScore).toContain('handleFrame(raw)');
    expect(spectrumScore).toContain('FRAME_RESET_GAP_MS');
    expect(spectrumScore).toContain('resetSpectrumStream');
    expect(spectrumScore).toContain('shouldAcceptFrameIdReset');
    expect(spectrumScore).toContain('dropped out-of-order frame');
    expect(spectrumScore).toContain('Do not synthesize new spectrum from stale data');
    expect(spectrumScore).not.toContain('midiEcho');
  });

  it('wires the cube colors panel to cube and triangle appearance setters', () => {
    expect(dashboardHtml).toContain('id="cubeColorsToggle"');
    expect(dashboardHtml).toContain('id="cubeColorsPanel"');
    expect(dashboardHtml).toContain('id="cubeColorsEditor"');
    expect(dashboardHtml).toContain('id="resetCubeColors"');
    expect(mainCss).toContain('.cube-colors-panel');
    expect(mainCss).toContain('.cube-swatch-grid');
    expect(main).toContain('setCubeColorsOpen');
    expect(main).toContain('renderCubeColorsEditor');
    expect(main).toContain('cubeColorSettings');
    expect(main).toContain('cubeScene.setAppearance');
    expect(main).toContain('stateUi.setAppearance');
    expect(main).toContain('setCubeAppearanceAndSync');
    expect(main).toContain('triangle.setAppearance');
    expect(main).not.toContain('ghost C vertices');
    expect(main).not.toContain('cVertexColors');
    expect(cubeScene).toContain('export function setAppearance(settings = {})');
    expect(cubeScene).toContain('export function resetAppearance()');
    expect(cubeScene).toContain('COMPLEX_COLOR_SRGB_HEX');
    expect(cubeScene).toContain('makeComplexDotTexture');
    expect(cubeScene).not.toContain('cVertexColors');
    expect(mainCss).toContain('--kc-card-k-label-color');
    expect(mainCss).toContain('--kc-card-c-label-color');
    expect(mainCss).toContain('--kc-card-active-label-color');
    expect(stateUi).toContain('export function setAppearance(settings = {})');
    expect(stateUi).toContain("import { COMPLEX_COLOR } from './constants.js';");
    expect(stateUi).toContain('refreshCardPrimaryColors()');
    expect(cubeScene).toContain('adaptiveWireColor');
    expect(cubeScene).toContain('cubeAppearance.liveWireWidth');
    expect(cubeScene).toContain('cubeAppearance.kcWireWidth');
    expect(triangle).toContain('export function setAppearance(settings = {})');
    expect(triangle).toContain('kLegColor');
    expect(triangle).toContain('endpointRadius');
  });

  it('keeps the physical U-prime zero gesture independent of engine upFace calibration', () => {
    expect(main).toContain('function checkZeroGestureFromGanMove(move)');
    expect(main).toContain('raw GAN `U\'`');
    expect(main).toContain("const moveEnvelope = { type: 'move', value: event.move };");
    expect(main).toMatch(/const moveSent = wsSend\(moveEnvelope\);[\s\S]*checkZeroGestureFromGanMove\(event\.move\);/);
    expect(main).toContain('[CUBE MOVE FAIL]');
    expect(main).toContain("moveStr !== \"U'\"");
    expect(main).not.toContain('checkTopFaceZeroGesture');
    expect(main).not.toMatch(/upFace\s*!==\s*['"]U['"]/);
  });

  it('records rolling visual layers from source canvases instead of screen capture', () => {
    expect(dashboardHtml).toContain('id="recordBeginBtn"');
    expect(dashboardHtml).toContain('id="recordEndBtn"');
    expect(dashboardHtml).toContain('id="recordMode"');
    expect(main).toContain("import * as performanceRecorder from './performance-recorder.js';");
    expect(main).toContain('performanceRecorder.init({');
    expect(performanceRecorder).toContain('function sampleSources(dxCss)');
    expect(performanceRecorder).toContain('drawImage(c, sx, 0, sw, c.height');
    expect(performanceRecorder).toContain("if (mode === 'visible' || mode === 'composite') return source.enabled !== false;");
    expect(performanceRecorder).toContain("source.kind === 'spectrum' && source.enabled !== false");
    expect(performanceRecorder).toContain("source.kind === 'midi' && source.enabled !== false");
    expect(performanceRecorder).toContain('xenakube-performance-');
  });
});
