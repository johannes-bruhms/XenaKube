// public/js/performance-recorder.js
//
// Long-PNG recorder for the rolling visual layers. It samples the matured
// right-edge column from the source canvases and appends it to an offscreen
// print buffer, so the live viewport can keep scrolling while the recording
// preserves the performance history.

let getSources = () => [];
let getMode = () => 'visible';
let getScrollSpeed = () => 360;
let onStatus = () => {};

let recording = false;
let outCanvas = null;
let outCtx = null;
let usedWidth = 0;
let lastT = 0;
let sampleRemainder = 0;
let statusLastText = '';

const GROW_CHUNK_PX = 4096;
const MAX_RECORD_WIDTH_PX = 160000;

function setStatus(text) {
  if (text === statusLastText) return;
  statusLastText = text;
  onStatus(text);
}

function ensureCanvas(width, height) {
  const targetW = Math.min(MAX_RECORD_WIDTH_PX, Math.max(width, usedWidth + GROW_CHUNK_PX));
  if (outCanvas && outCanvas.width >= width && outCanvas.height === height) return true;

  const next = document.createElement('canvas');
  next.width = targetW;
  next.height = height;
  const nextCtx = next.getContext('2d', { colorSpace: 'display-p3' });
  if (!nextCtx) return false;
  nextCtx.clearRect(0, 0, next.width, next.height);
  if (outCanvas && outCtx && usedWidth > 0) {
    nextCtx.drawImage(outCanvas, 0, 0, usedWidth, outCanvas.height, 0, 0, usedWidth, next.height);
  }
  outCanvas = next;
  outCtx = nextCtx;
  return true;
}

function savePng() {
  if (!outCanvas || !outCtx || usedWidth <= 1) {
    console.warn('[performance-recorder] print buffer is empty');
    return false;
  }
  const finalCanvas = document.createElement('canvas');
  finalCanvas.width = usedWidth;
  finalCanvas.height = outCanvas.height;
  const finalCtx = finalCanvas.getContext('2d', { colorSpace: 'display-p3' });
  if (!finalCtx) return false;
  finalCtx.drawImage(outCanvas, 0, 0, usedWidth, outCanvas.height, 0, 0, usedWidth, outCanvas.height);

  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = 'xenakube-performance-' + stamp + '.png';
  const trigger = (url) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };
  if (typeof finalCanvas.toBlob === 'function') {
    finalCanvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      trigger(url);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }, 'image/png');
  } else {
    trigger(finalCanvas.toDataURL('image/png'));
  }
  return true;
}

function sourceEnabledForMode(source, mode) {
  if (!source || !source.canvas) return false;
  if (mode === 'visible' || mode === 'composite') return source.enabled !== false;
  if (mode === 'spectrum') return source.kind === 'spectrum' && source.enabled !== false;
  if (mode === 'midi') return source.kind === 'midi' && source.enabled !== false;
  return source.enabled !== false;
}

function sampleSources(dxCss) {
  const sources = getSources().filter((src) => sourceEnabledForMode(src, getMode()));
  if (sources.length === 0) return;
  const first = sources.find((src) => src.canvas && src.canvas.width > 0 && src.canvas.height > 0);
  if (!first) return;
  const cssW = Math.max(1, Math.round(window.innerWidth || first.canvas.width));
  const cssH = Math.max(1, Math.round(window.innerHeight || first.canvas.height));
  if (!ensureCanvas(usedWidth + dxCss + 2, cssH)) return;
  if (usedWidth + dxCss >= MAX_RECORD_WIDTH_PX) {
    console.warn('[performance-recorder] max record width reached; stopping recording');
    recording = false;
    setStatus('full');
    return;
  }

  outCtx.save();
  outCtx.globalCompositeOperation = 'source-over';
  outCtx.clearRect(usedWidth, 0, dxCss + 1, cssH);
  for (const source of sources) {
    const c = source.canvas;
    if (!c || c.width <= 0 || c.height <= 0) continue;
    const dpr = c.width / cssW;
    const rightInsetCss = source.rightInsetCss || 0;
    const sxCss = Math.max(0, cssW - rightInsetCss - dxCss);
    const sx = Math.max(0, Math.floor(sxCss * dpr));
    const sw = Math.max(1, Math.min(c.width - sx, Math.ceil(dxCss * dpr)));
    outCtx.drawImage(c, sx, 0, sw, c.height, usedWidth, 0, dxCss, cssH);
  }
  outCtx.restore();
  usedWidth += dxCss;
  setStatus((usedWidth / Math.max(1, getScrollSpeed())).toFixed(1) + 's');
}

function tick(now) {
  if (recording) {
    if (lastT === 0) lastT = now;
    const dt = Math.max(0, Math.min(250, now - lastT));
    lastT = now;
    sampleRemainder += dt * getScrollSpeed() / 1000;
    const dx = Math.floor(sampleRemainder);
    if (dx > 0) {
      sampleRemainder -= dx;
      sampleSources(dx);
    }
  }
  requestAnimationFrame(tick);
}

export function init(options = {}) {
  if (typeof options.getSources === 'function') getSources = options.getSources;
  if (typeof options.getMode === 'function') getMode = options.getMode;
  if (typeof options.getScrollSpeed === 'function') getScrollSpeed = options.getScrollSpeed;
  if (typeof options.onStatus === 'function') onStatus = options.onStatus;
  requestAnimationFrame(tick);
  setStatus('idle');
}

export function begin() {
  usedWidth = 0;
  lastT = 0;
  sampleRemainder = 0;
  outCanvas = null;
  outCtx = null;
  recording = true;
  setStatus('rec');
  return true;
}

export function end() {
  recording = false;
  const saved = savePng();
  setStatus(saved ? 'saved' : 'empty');
  return saved;
}

export function isRecording() {
  return recording;
}
