// public/interruption/index.js
//
// Optional detachable dashboard overlay for crisis/comfort video intrusions
// and a separate targeting triangle. The core dashboard modules do not import
// this package; main.js owns the feature flag and event fanout.

import * as THREE from 'three';
import { INTERRUPTION_CLIPS } from './clips.js';
import {
  INTERRUPTION_CONFIG as CONFIG,
  INTERRUPTION_STATES,
} from './config.js';

const EDITABLE_SELECTOR = 'input, textarea, select, [contenteditable="true"]';
const WAR_CATEGORIES = new Set(['war', 'crisis']);

const STYLE_TEXT = `
.xk-intrusion-root {
  position: fixed;
  inset: 0;
  z-index: 1;
  pointer-events: none;
  contain: layout paint;
  --intrusion-video-opacity: 0;
  --intrusion-target-opacity: 0;
}
.xk-intrusion-video,
.xk-intrusion-target {
  position: absolute;
  inset: 0;
  width: 100vw;
  height: 100vh;
  display: block;
  pointer-events: none;
}
.xk-intrusion-video {
  object-fit: cover;
  opacity: var(--intrusion-video-opacity);
  filter: contrast(1.08) saturate(0.9);
  transition: opacity 180ms linear, filter 240ms linear;
}
.xk-intrusion-root[data-state="takeover"] .xk-intrusion-video {
  filter: contrast(1.2) saturate(0.72);
}
.xk-intrusion-root[data-state="comfort"] .xk-intrusion-video {
  filter: contrast(0.94) saturate(0.82) brightness(1.06);
}
.xk-intrusion-target {
  opacity: var(--intrusion-target-opacity);
  transition: opacity 140ms linear;
}
.xk-intrusion-debug {
  position: fixed;
  right: calc(var(--sieve-strip-w, 86px) + 18px);
  bottom: 92px;
  width: 276px;
  padding: 10px;
  border: 1px solid rgba(235, 245, 230, 0.36);
  border-radius: 6px;
  background: rgba(5, 7, 8, 0.86);
  color: #e8efe6;
  font: 11px/1.35 "SF Mono", "Fira Code", Consolas, monospace;
  letter-spacing: 0;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.38);
  pointer-events: auto;
}
.xk-intrusion-debug[hidden] {
  display: none;
}
.xk-intrusion-debug-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 8px;
  text-transform: uppercase;
  color: #f2d37c;
}
.xk-intrusion-debug-grid {
  display: grid;
  grid-template-columns: 78px 1fr;
  gap: 3px 8px;
}
.xk-intrusion-debug-grid span:nth-child(odd) {
  color: rgba(232, 239, 230, 0.58);
}
.xk-intrusion-debug-grid span:nth-child(even) {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.xk-intrusion-debug-actions {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 6px;
  margin-top: 10px;
}
.xk-intrusion-debug-actions button {
  height: 24px;
  border: 1px solid rgba(232, 239, 230, 0.35);
  border-radius: 4px;
  background: rgba(232, 239, 230, 0.08);
  color: #e8efe6;
  font: inherit;
  cursor: pointer;
}
.xk-intrusion-debug-actions button:hover {
  background: rgba(242, 211, 124, 0.18);
  border-color: rgba(242, 211, 124, 0.64);
}
`;

function clamp01(v) {
  if (!Number.isFinite(v)) return 0;
  return Math.max(0, Math.min(1, v));
}

function isEditableTarget(target) {
  return target instanceof Element && !!target.closest(EDITABLE_SELECTOR);
}

function isWarClip(clip) {
  return clip && WAR_CATEGORIES.has(clip.category);
}

function smoothstep(t) {
  const x = clamp01(t);
  return x * x * (3 - 2 * x);
}

export function initInterruptionLayer(options = {}) {
  return new InterruptionLayer(options);
}

class InterruptionLayer {
  constructor(options) {
    this.root = options.root || document.body;
    this.getCamera = options.getCamera || null;
    this.getActiveKWorldPos = options.getActiveKWorldPos || null;
    this.getCWorldPos = options.getCWorldPos || null;

    this.enabled = false;
    this.debugVisible = options.debug === true;
    this.targetOverlayEnabled = true;
    this.state = 'disabled';
    this.lastReason = 'init';
    this.moduleStartedAt = performance.now();
    this.cleanUntil = this.moduleStartedAt + CONFIG.CLEAN_MS;
    this.modeStartedAt = this.moduleStartedAt;
    this.cooldownUntil = 0;
    this.residueStartedAt = 0;
    this.pressure = 0;
    this.repeatScore = 0;
    this.scramble = 0;
    this.turnRate = 0;
    this.motionStill = false;
    this.motionDwellMs = 0;
    this.solved = false;
    this.lastMove = null;
    this.lastMoveAt = 0;
    this.turnHistory = [];

    this.el = null;
    this.video = null;
    this.canvas = null;
    this.ctx = null;
    this.debugEl = null;
    this.activeClip = null;
    this.clipStartedAt = 0;
    this.activeClipMode = null;
    this.currentTarget = { x: 0.5, y: 0.5 };
    this.generatedCanvas = null;
    this.generatedCtx = null;
    this.wiredWarningDone = false;

    this.raf = 0;
    this.lastTickAt = 0;
    this.lastDebugPaintAt = 0;
    this.dpr = 1;
    this.kWorld = new THREE.Vector3();
    this.cWorld = new THREE.Vector3();
    this.tmpWorld = new THREE.Vector3();
    this.tmpProjected = new THREE.Vector3();

    this.boundKeyDown = (event) => this.handleKeyDown(event);
    this.boundResize = () => this.resizeCanvas();
    window.addEventListener('keydown', this.boundKeyDown);
    window.addEventListener('resize', this.boundResize);

    if (options.enabled === true) this.enable('feature-flag');
  }

  onState(data, move) {
    if (!this.enabled || !data) return;
    if (typeof data.scrambleFactor === 'number') {
      this.scramble = clamp01(data.scrambleFactor);
      if (this.scramble > 0.02) this.solved = false;
    } else if (data.expression && typeof data.expression.scramble === 'number') {
      this.scramble = clamp01(data.expression.scramble);
    }
    if (typeof data.turnRate === 'number') this.turnRate = Math.max(0, data.turnRate);
    if (data.motion) {
      this.motionStill = data.motion.isStill === true;
      this.motionDwellMs = Math.max(0, data.motion.dwellMs || 0);
    }
    if (move) this.registerMove(move);
  }

  onAlgorithm(event) {
    if (!event || !event.name) return;
    if (String(event.name).toLowerCase() === 'sexy-move') {
      this.cancelWarFootage('sexy-move');
    }
  }

  onSolve() {
    this.solved = true;
    this.pressure = 0;
    if (this.enabled) this.forceComfort('solve');
  }

  onMidiEcho(data) {
    if (data && data.kind === 'panic') this.onPanic();
  }

  onPanic() {
    this.resetVolatile('panic');
  }

  destroy() {
    window.removeEventListener('keydown', this.boundKeyDown);
    window.removeEventListener('resize', this.boundResize);
    if (this.raf) cancelAnimationFrame(this.raf);
    this.raf = 0;
    this.clearActiveClip();
    this.removeDom();
  }

  enable(reason = 'manual-enable') {
    if (this.enabled) return;
    this.enabled = true;
    this.ensureDom();
    this.warnIfUnwired();
    const now = performance.now();
    this.setState(now < this.cleanUntil ? 'clean' : 'armed', reason);
    this.startLoop();
    this.paintDebug(true);
  }

  warnIfUnwired() {
    if (this.wiredWarningDone) return;
    this.wiredWarningDone = true;
    const missing = [];
    if (!this.getCamera) missing.push('getCamera');
    if (!this.getActiveKWorldPos) missing.push('getActiveKWorldPos');
    if (!this.getCWorldPos) missing.push('getCWorldPos');
    if (missing.length) {
      console.warn(
        `[interruption] ${missing.join(', ')} not wired - target projection disabled`
      );
    }
  }

  disable(reason = 'manual-disable') {
    if (!this.enabled) return;
    this.lastReason = reason;
    this.enabled = false;
    this.clearActiveClip();
    this.setState('disabled', reason);
    this.removeDom();
    if (this.raf) cancelAnimationFrame(this.raf);
    this.raf = 0;
  }

  registerMove(move) {
    const now = performance.now();
    const face = String(move)[0] || '';
    while (
      this.turnHistory.length &&
      now - this.turnHistory[0].time > CONFIG.PRESSURE.TURN_WINDOW_MS
    ) {
      this.turnHistory.shift();
    }
    this.turnHistory.push({ move, face, time: now });

    let impulse = CONFIG.PRESSURE.MOVE_IMPULSE;
    if (this.lastMove && String(this.lastMove)[0] === face) {
      this.repeatScore = clamp01(this.repeatScore + 0.26);
      impulse += CONFIG.PRESSURE.REPEAT_IMPULSE * (0.5 + this.repeatScore);
    }
    this.pressure = clamp01(this.pressure + impulse);
    this.lastMove = move;
    this.lastMoveAt = now;
  }

  handleKeyDown(event) {
    if (event.metaKey || event.ctrlKey || event.altKey) return;
    if (isEditableTarget(event.target)) return;

    const key = event.key.toLowerCase();
    if (key === 'i') {
      event.preventDefault();
      if (this.enabled) this.disable('key-i');
      else this.enable('key-i');
      return;
    }
    if (key === 'd') {
      event.preventDefault();
      this.debugVisible = !this.debugVisible;
      if (this.enabled) {
        this.ensureDom();
        this.paintDebug(true);
      }
      return;
    }
    if (key === 'w') {
      event.preventDefault();
      if (!this.enabled) this.enable('key-w');
      this.forceWarIntrusion('key-w');
      return;
    }
    if (key === 'c') {
      event.preventDefault();
      if (!this.enabled) this.enable('key-c');
      this.forceComfort('key-c');
      return;
    }
    if (key === 'x') {
      event.preventDefault();
      this.manualClear('key-x');
      return;
    }
    if (event.key === '[') {
      event.preventDefault();
      this.pressure = clamp01(this.pressure - CONFIG.PRESSURE.MANUAL_STEP);
      this.lastReason = 'key-pressure-down';
      return;
    }
    if (event.key === ']') {
      event.preventDefault();
      this.pressure = clamp01(this.pressure + CONFIG.PRESSURE.MANUAL_STEP);
      this.lastReason = 'key-pressure-up';
      return;
    }
    if (key === 't') {
      event.preventDefault();
      if (!this.enabled) this.enable('key-t');
      this.targetOverlayEnabled = !this.targetOverlayEnabled;
      this.lastReason = this.targetOverlayEnabled ? 'target-on' : 'target-off';
      this.updateCssState();
    }
  }

  ensureDom() {
    if (this.el) return;

    const el = document.createElement('section');
    el.className = 'xk-intrusion-root';
    el.dataset.state = this.state;
    el.setAttribute('aria-hidden', 'true');

    const style = document.createElement('style');
    style.textContent = STYLE_TEXT;

    const video = document.createElement('video');
    video.className = 'xk-intrusion-video';
    video.muted = true;
    video.playsInline = true;
    video.preload = 'auto';
    video.setAttribute('playsinline', '');

    const canvas = document.createElement('canvas');
    canvas.className = 'xk-intrusion-target';

    const debug = document.createElement('aside');
    debug.className = 'xk-intrusion-debug';
    debug.hidden = !this.debugVisible;
    debug.innerHTML = `
      <div class="xk-intrusion-debug-head">
        <span>intrusion layer</span>
        <span data-field="enabled">off</span>
      </div>
      <div class="xk-intrusion-debug-grid">
        <span>state</span><span data-field="state">disabled</span>
        <span>pressure</span><span data-field="pressure">0.00</span>
        <span>clip</span><span data-field="clip">none</span>
        <span>time</span><span data-field="time">0.0s</span>
        <span>cooldown</span><span data-field="cooldown">0.0s</span>
        <span>reason</span><span data-field="reason">init</span>
        <span>solved</span><span data-field="solved">false</span>
        <span>target</span><span data-field="target">0.50, 0.50</span>
      </div>
      <div class="xk-intrusion-debug-actions">
        <button type="button" data-action="war" title="force war/crisis">W</button>
        <button type="button" data-action="comfort" title="force comfort">C</button>
        <button type="button" data-action="clear" title="clear intrusion">X</button>
        <button type="button" data-action="target" title="toggle target">T</button>
      </div>
    `;
    debug.addEventListener('click', (event) => {
      const btn = event.target instanceof Element
        ? event.target.closest('button[data-action]')
        : null;
      if (!btn) return;
      const action = btn.getAttribute('data-action');
      if (action === 'war') this.forceWarIntrusion('debug-button');
      else if (action === 'comfort') this.forceComfort('debug-button');
      else if (action === 'clear') this.manualClear('debug-button');
      else if (action === 'target') {
        this.targetOverlayEnabled = !this.targetOverlayEnabled;
        this.lastReason = this.targetOverlayEnabled ? 'target-on' : 'target-off';
        this.updateCssState();
      }
    });

    el.append(style, video, canvas, debug);
    this.root.appendChild(el);
    this.el = el;
    this.video = video;
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.debugEl = debug;
    this.resizeCanvas();
    this.updateCssState();
  }

  removeDom() {
    if (!this.el) return;
    this.el.remove();
    this.el = null;
    this.video = null;
    this.canvas = null;
    this.ctx = null;
    this.debugEl = null;
  }

  resizeCanvas() {
    if (!this.canvas || !this.ctx) return;
    this.dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    const w = Math.max(1, Math.round(window.innerWidth * this.dpr));
    const h = Math.max(1, Math.round(window.innerHeight * this.dpr));
    if (this.canvas.width !== w || this.canvas.height !== h) {
      this.canvas.width = w;
      this.canvas.height = h;
      this.canvas.style.width = '100vw';
      this.canvas.style.height = '100vh';
    }
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
  }

  startLoop() {
    if (this.raf) return;
    this.lastTickAt = performance.now();
    const tick = (now) => {
      this.raf = 0;
      if (!this.enabled) return;
      this.tick(now);
      this.raf = requestAnimationFrame(tick);
    };
    this.raf = requestAnimationFrame(tick);
  }

  tick(now) {
    this.ensureDom();
    const dt = Math.min(0.12, Math.max(0, (now - this.lastTickAt) / 1000));
    this.lastTickAt = now;
    this.updatePressure(dt, now);
    this.updateStateMachine(now);
    this.paintGeneratedFrame(now);
    this.drawTargeting(now);
    this.updateCssState(now);
    if (now - this.lastDebugPaintAt > 120) {
      this.paintDebug(false);
      this.lastDebugPaintAt = now;
    }
  }

  updatePressure(dt, now) {
    if (this.state === 'disabled') return;

    const afterClean = now >= this.cleanUntil;
    if (afterClean && this.state !== 'comfort') {
      this.pressure += CONFIG.PRESSURE.TIME_RISE_PER_SEC * dt;
      this.pressure += Math.min(this.turnRate, 5) * CONFIG.PRESSURE.TURN_RATE_RISE_PER_SEC * dt;
      this.pressure += this.scramble * CONFIG.PRESSURE.SCRAMBLE_RISE_PER_SEC * dt;
    }

    this.repeatScore = clamp01(
      this.repeatScore - CONFIG.PRESSURE.REPEAT_DECAY_PER_SEC * dt
    );

    if (this.motionStill) {
      const dwellBoost = this.motionDwellMs > 1600 ? 1.45 : 1.0;
      this.pressure -= CONFIG.PRESSURE.STILL_FALL_PER_SEC * dwellBoost * dt;
    }

    if (this.lastMoveAt && now - this.lastMoveAt > CONFIG.PRESSURE.IDLE_AFTER_MS) {
      this.pressure -= CONFIG.PRESSURE.IDLE_FALL_PER_SEC * dt;
    }

    if (this.state === 'cooldown') {
      this.pressure -= CONFIG.PRESSURE.COOLDOWN_FALL_PER_SEC * dt;
    }

    if (this.solved) {
      this.pressure -= CONFIG.PRESSURE.SOLVED_FALL_PER_SEC * dt;
    }

    this.pressure = clamp01(this.pressure);
  }

  updateStateMachine(now) {
    if (this.state === 'clean' && now >= this.cleanUntil) {
      this.setState('armed', 'clean-expired');
    }

    if (this.state === 'cooldown' && now >= this.cooldownUntil) {
      this.clearActiveClip();
      this.setState('armed', 'cooldown-expired');
    }

    if (this.state === 'comfort') {
      if (now - this.modeStartedAt >= CONFIG.DURATIONS.COMFORT_MS) {
        this.enterResidue('comfort-ended');
      }
      return;
    }

    if (this.state === 'glimpse' && now - this.modeStartedAt >= CONFIG.DURATIONS.GLIMPSE_MS) {
      this.enterResidue('glimpse-ended');
      return;
    }

    if (
      this.state === 'leak' &&
      (now - this.modeStartedAt >= CONFIG.DURATIONS.LEAK_MAX_MS ||
        this.pressure < CONFIG.THRESHOLDS.GLIMPSE)
    ) {
      this.enterResidue('leak-ended');
      return;
    }

    if (this.state === 'targeting' && now - this.modeStartedAt >= CONFIG.DURATIONS.TARGETING_MAX_MS) {
      this.enterResidue('targeting-ended');
      return;
    }

    if (this.state === 'takeover' && now - this.modeStartedAt >= CONFIG.DURATIONS.TAKEOVER_MAX_MS) {
      this.enterResidue('takeover-ended');
      return;
    }

    if (this.state === 'residue') {
      if (now - this.residueStartedAt >= CONFIG.DURATIONS.RESIDUE_MS) {
        this.clearActiveClip();
        this.cooldownUntil = now + CONFIG.DURATIONS.COOLDOWN_MS;
        this.setState('cooldown', 'residue-ended');
      }
      return;
    }

    if (this.state === 'leak' && this.pressure >= CONFIG.THRESHOLDS.TARGETING) {
      this.setState('targeting', 'pressure-targeting');
      return;
    }
    if (this.state === 'targeting' && this.pressure >= CONFIG.THRESHOLDS.TAKEOVER) {
      this.setState('takeover', 'pressure-takeover');
      return;
    }

    if (this.state === 'armed') {
      this.triggerFromPressure('pressure');
    }
  }

  triggerFromPressure(reason) {
    if (this.pressure >= CONFIG.THRESHOLDS.TAKEOVER) {
      this.startClip(this.selectWarClip(this.pressure), 'takeover', reason);
    } else if (this.pressure >= CONFIG.THRESHOLDS.TARGETING) {
      this.startClip(this.selectWarClip(this.pressure), 'targeting', reason);
    } else if (this.pressure >= CONFIG.THRESHOLDS.LEAK) {
      this.startClip(this.selectWarClip(this.pressure), 'leak', reason);
    } else if (this.pressure >= CONFIG.THRESHOLDS.GLIMPSE) {
      this.startClip(this.selectWarClip(this.pressure), 'glimpse', reason);
    }
  }

  selectWarClip(pressure) {
    const war = INTERRUPTION_CLIPS
      .filter((clip) => isWarClip(clip))
      .sort((a, b) => a.intensity - b.intensity || a.id.localeCompare(b.id));
    return war.find((clip) => clip.intensity >= pressure) || war[war.length - 1] || null;
  }

  selectComfortClip() {
    return INTERRUPTION_CLIPS.find((clip) => clip.category === 'comfort') || null;
  }

  forceWarIntrusion(reason) {
    this.pressure = Math.max(this.pressure, CONFIG.THRESHOLDS.TARGETING);
    this.solved = false;
    this.startClip(this.selectWarClip(this.pressure), 'targeting', reason);
  }

  forceComfort(reason) {
    this.pressure = 0;
    this.startClip(this.selectComfortClip(), 'comfort', reason);
  }

  manualClear(reason) {
    if (!this.enabled) return;
    this.pressure = Math.max(0, this.pressure - 0.25);
    if (this.activeClip || this.state === 'targeting' || this.state === 'takeover') {
      this.enterResidue(reason);
    } else {
      this.cooldownUntil = performance.now() + CONFIG.DURATIONS.COOLDOWN_MS;
      this.setState('cooldown', reason);
    }
  }

  cancelWarFootage(reason) {
    if (!this.enabled) return;
    this.pressure *= CONFIG.PRESSURE.SEXY_MOVE_MULT;
    this.repeatScore = 0;
    if (isWarClip(this.activeClip)) {
      this.clearActiveClip();
    }
    this.cooldownUntil = performance.now() + CONFIG.DURATIONS.COOLDOWN_MS;
    this.setState('cooldown', reason);
  }

  resetVolatile(reason) {
    const now = performance.now();
    this.pressure = 0;
    this.repeatScore = 0;
    this.turnHistory = [];
    this.lastMove = null;
    this.lastMoveAt = 0;
    this.turnRate = 0;
    this.motionStill = false;
    this.motionDwellMs = 0;
    this.clearActiveClip();
    this.clearCanvas();
    this.cleanUntil = now + CONFIG.CLEAN_MS;
    if (this.enabled) this.setState('clean', reason);
    else this.setState('disabled', reason);
  }

  startClip(clip, mode, reason) {
    if (!clip) {
      this.lastReason = reason + ':no-clip';
      return;
    }
    this.ensureDom();
    this.activeClip = clip;
    this.activeClipMode = mode;
    this.clipStartedAt = performance.now();
    this.modeStartedAt = this.clipStartedAt;
    this.currentTarget = clip.target || { x: 0.5, y: 0.5 };
    this.setState(mode, reason);

    if (clip.src.startsWith('generated:')) {
      this.attachGeneratedStream();
    } else if (this.video) {
      this.detachVideoStream();
      this.video.src = clip.src;
      this.video.currentTime = Math.max(0, clip.start || 0);
      this.video.play().catch((err) => {
        console.warn('[interruption] video play failed:', err);
      });
    }
  }

  attachGeneratedStream() {
    if (!this.video) return;
    if (!this.generatedCanvas) {
      this.generatedCanvas = document.createElement('canvas');
      this.generatedCanvas.width = CONFIG.GENERATED.WIDTH;
      this.generatedCanvas.height = CONFIG.GENERATED.HEIGHT;
      this.generatedCtx = this.generatedCanvas.getContext('2d');
    }
    this.detachVideoStream();
    const stream = this.generatedCanvas.captureStream(CONFIG.GENERATED.FPS);
    this.video.srcObject = stream;
    this.video.play().catch((err) => {
      console.warn('[interruption] generated stream play failed:', err);
    });
  }

  detachVideoStream() {
    if (!this.video) return;
    if (this.video.srcObject) {
      for (const track of this.video.srcObject.getTracks()) track.stop();
      this.video.srcObject = null;
    }
    this.video.removeAttribute('src');
    this.video.load();
  }

  clearActiveClip() {
    this.activeClip = null;
    this.activeClipMode = null;
    this.clipStartedAt = 0;
    if (!this.video) return;
    this.video.pause();
    this.detachVideoStream();
  }

  enterResidue(reason) {
    this.residueStartedAt = performance.now();
    this.setState('residue', reason);
  }

  setState(next, reason) {
    if (!INTERRUPTION_STATES.includes(next)) {
      console.warn('[interruption] invalid state:', next);
      return;
    }
    if (this.state !== next) this.modeStartedAt = performance.now();
    this.state = next;
    this.lastReason = reason;
    this.updateCssState();
  }

  updateCssState(now = performance.now()) {
    if (!this.el) return;
    this.el.dataset.state = this.state;
    this.el.style.setProperty('--intrusion-video-opacity', this.videoOpacity(now).toFixed(3));
    this.el.style.setProperty('--intrusion-target-opacity', this.targetOpacity(now).toFixed(3));
    if (this.debugEl) this.debugEl.hidden = !this.debugVisible;
  }

  videoOpacity(now) {
    if (!this.activeClip) return 0;
    if (this.state === 'residue') return 0;
    const base = CONFIG.VIDEO_OPACITY[this.state] || 0;
    if (this.state === 'glimpse') {
      const t = (now - this.modeStartedAt) / CONFIG.DURATIONS.GLIMPSE_MS;
      return base * Math.sin(Math.PI * clamp01(t));
    }
    return base;
  }

  targetOpacity(now) {
    if (!this.targetOverlayEnabled) return 0;
    if (this.state === 'residue') {
      const t = (now - this.residueStartedAt) / CONFIG.DURATIONS.RESIDUE_MS;
      return (CONFIG.TARGET_OPACITY.residue || 0) * (1 - clamp01(t));
    }
    return CONFIG.TARGET_OPACITY[this.state] || 0;
  }

  paintGeneratedFrame(now) {
    if (!this.activeClip || !this.activeClip.src.startsWith('generated:')) return;
    if (!this.generatedCtx || !this.generatedCanvas) return;

    const ctx = this.generatedCtx;
    const w = this.generatedCanvas.width;
    const h = this.generatedCanvas.height;
    const t = (now - this.clipStartedAt) / 1000;
    const kind = this.activeClip.src.slice('generated:'.length);

    ctx.clearRect(0, 0, w, h);
    if (kind === 'comfort-horizon') this.paintComfortFrame(ctx, w, h, t);
    else this.paintCrisisFrame(ctx, w, h, t, kind);
  }

  paintCrisisFrame(ctx, w, h, t, kind) {
    ctx.fillStyle = '#050505';
    ctx.fillRect(0, 0, w, h);

    const scanY = (Math.sin(t * 1.7) * 0.5 + 0.5) * h;
    ctx.fillStyle = 'rgba(230, 230, 215, 0.08)';
    for (let y = 0; y < h; y += 18) {
      ctx.fillRect(0, y + Math.sin(t * 3 + y * 0.02) * 3, w, 2);
    }

    ctx.strokeStyle = kind === 'war-signal'
      ? 'rgba(220, 45, 32, 0.42)'
      : 'rgba(232, 238, 220, 0.30)';
    ctx.lineWidth = 2;
    for (let x = -80; x < w + 80; x += 86) {
      ctx.beginPath();
      ctx.moveTo(x + Math.sin(t + x) * 8, 0);
      ctx.lineTo(x + Math.sin(t * 1.4 + x) * 16, h);
      ctx.stroke();
    }
    for (let y = -60; y < h + 60; y += 64) {
      ctx.beginPath();
      ctx.moveTo(0, y + Math.cos(t + y) * 8);
      ctx.lineTo(w, y + Math.cos(t * 1.3 + y) * 14);
      ctx.stroke();
    }

    const tx = (this.currentTarget.x || 0.5) * w;
    const ty = (this.currentTarget.y || 0.5) * h;
    const pulse = 0.5 + 0.5 * Math.sin(t * 9);
    ctx.strokeStyle = `rgba(255, 234, 186, ${0.45 + pulse * 0.35})`;
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(tx - 80, ty);
    ctx.lineTo(tx - 18, ty);
    ctx.moveTo(tx + 18, ty);
    ctx.lineTo(tx + 80, ty);
    ctx.moveTo(tx, ty - 80);
    ctx.lineTo(tx, ty - 18);
    ctx.moveTo(tx, ty + 18);
    ctx.lineTo(tx, ty + 80);
    ctx.stroke();

    ctx.fillStyle = 'rgba(255, 255, 245, 0.08)';
    ctx.fillRect(0, scanY, w, 18);
  }

  paintComfortFrame(ctx, w, h, t) {
    const grd = ctx.createLinearGradient(0, 0, 0, h);
    grd.addColorStop(0, '#edf4ef');
    grd.addColorStop(0.52, '#8fb6ad');
    grd.addColorStop(1, '#2d4d48');
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, w, h);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.18)';
    for (let i = 0; i < 18; i++) {
      const x = ((i * 211 + t * 18) % (w + 180)) - 90;
      const y = h * (0.18 + 0.18 * Math.sin(i * 1.7));
      ctx.fillRect(x, y, 110 + (i % 3) * 44, 10 + (i % 4) * 5);
    }

    const waterY = h * (0.58 + Math.sin(t * 0.7) * 0.015);
    ctx.fillStyle = 'rgba(21, 50, 48, 0.55)';
    ctx.fillRect(0, waterY, w, h - waterY);
    ctx.strokeStyle = 'rgba(235, 245, 230, 0.24)';
    ctx.lineWidth = 3;
    for (let y = waterY + 22; y < h; y += 34) {
      ctx.beginPath();
      for (let x = 0; x <= w; x += 24) {
        const yy = y + Math.sin(x * 0.022 + t * 1.2) * 5;
        if (x === 0) ctx.moveTo(x, yy);
        else ctx.lineTo(x, yy);
      }
      ctx.stroke();
    }
  }

  drawTargeting(now) {
    if (!this.ctx || !this.canvas) return;
    const ctx = this.ctx;
    const w = window.innerWidth;
    const h = window.innerHeight;
    ctx.clearRect(0, 0, w, h);

    if (this.targetOpacity(now) <= 0.001) return;
    const phase = this.targetPhase(now);
    const k = this.projectActiveK();
    const c = this.projectNearestC();
    const target = this.targetPointForPhase(phase, now, w, h);
    if (!target) return;

    ctx.save();
    ctx.lineCap = 'square';
    ctx.lineJoin = 'miter';
    const alpha = this.targetOpacity(now);
    const warm = phase === 'lock' ? 235 : 210;
    ctx.strokeStyle = `rgba(255, ${warm}, 170, ${0.78 * alpha})`;
    ctx.fillStyle = `rgba(255, ${warm}, 170, ${0.16 * alpha})`;
    ctx.lineWidth = phase === 'lock' ? 2.2 : 1.4;
    if (phase === 'search') ctx.setLineDash([10, 18]);
    else if (phase === 'acquire') ctx.setLineDash([18, 8]);
    else if (phase === 'break') ctx.setLineDash([4, 14]);
    else ctx.setLineDash([]);

    if (k && c) {
      ctx.beginPath();
      ctx.moveTo(k.x, k.y);
      ctx.lineTo(c.x, c.y);
      ctx.lineTo(target.x, target.y);
      ctx.closePath();
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.moveTo(target.x - 46, target.y);
      ctx.lineTo(target.x + 46, target.y);
      ctx.moveTo(target.x, target.y - 46);
      ctx.lineTo(target.x, target.y + 46);
      ctx.stroke();
    }

    const lockR = phase === 'lock' ? 34 : 26 + Math.sin(now * 0.011) * 8;
    ctx.setLineDash([]);
    ctx.strokeStyle = `rgba(255, 58, 42, ${0.86 * alpha})`;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(target.x - lockR, target.y);
    ctx.lineTo(target.x - 9, target.y);
    ctx.moveTo(target.x + 9, target.y);
    ctx.lineTo(target.x + lockR, target.y);
    ctx.moveTo(target.x, target.y - lockR);
    ctx.lineTo(target.x, target.y - 9);
    ctx.moveTo(target.x, target.y + 9);
    ctx.lineTo(target.x, target.y + lockR);
    ctx.stroke();

    if (phase === 'lock') {
      ctx.strokeStyle = `rgba(255, 238, 210, ${0.62 * alpha})`;
      ctx.strokeRect(target.x - 18, target.y - 18, 36, 36);
    }
    ctx.restore();
  }

  targetPhase(now) {
    if (this.state === 'residue') {
      const t = (now - this.residueStartedAt) / CONFIG.DURATIONS.RESIDUE_MS;
      return t < 0.45 ? 'break' : 'relax';
    }
    if (this.state === 'comfort') return 'relax';
    if (this.state !== 'targeting' && this.state !== 'takeover') return 'search';
    const elapsed = now - this.modeStartedAt;
    if (elapsed < 800) return 'search';
    if (elapsed < 1850) return 'acquire';
    return 'lock';
  }

  targetPointForPhase(phase, now, w, h) {
    const base = {
      x: clamp01(this.currentTarget.x ?? 0.5) * w,
      y: clamp01(this.currentTarget.y ?? 0.5) * h,
    };
    if (phase === 'lock') return base;

    const t = (now - this.modeStartedAt) / 1000;
    const amp = phase === 'search' ? 90 : phase === 'acquire' ? 34 : 16;
    const ease = phase === 'acquire'
      ? 1 - smoothstep((now - this.modeStartedAt - 800) / 1050)
      : 1;
    return {
      x: base.x + Math.sin(t * 3.7 + 1.2) * amp * ease,
      y: base.y + Math.cos(t * 2.9 + 0.6) * amp * 0.72 * ease,
    };
  }

  projectActiveK() {
    if (!this.getCamera || !this.getActiveKWorldPos) return null;
    try {
      const world = this.getActiveKWorldPos(this.kWorld);
      return this.projectWorld(world);
    } catch (err) {
      return null;
    }
  }

  projectNearestC() {
    if (!this.getCamera || !this.getCWorldPos || !this.getActiveKWorldPos) return null;
    try {
      const k = this.getActiveKWorldPos(this.kWorld);
      let best = null;
      let bestD = Infinity;
      for (let i = 0; i < 8; i++) {
        const c = this.getCWorldPos(i, this.tmpWorld);
        const d = k.distanceToSquared(c);
        if (d < bestD) {
          bestD = d;
          best = this.cWorld.copy(c);
        }
      }
      return best ? this.projectWorld(best) : null;
    } catch (err) {
      return null;
    }
  }

  projectWorld(world) {
    const camera = this.getCamera && this.getCamera();
    if (!camera) return null;
    camera.updateMatrixWorld();
    this.tmpProjected.copy(world).project(camera);
    if (this.tmpProjected.z < -1 || this.tmpProjected.z > 1) return null;
    return {
      x: (this.tmpProjected.x * 0.5 + 0.5) * window.innerWidth,
      y: (-this.tmpProjected.y * 0.5 + 0.5) * window.innerHeight,
    };
  }

  clearCanvas() {
    if (this.ctx) {
      this.ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    }
  }

  paintDebug(force) {
    if (!this.debugEl || (!this.debugVisible && !force)) return;
    const clipTime = this.activeClip && this.clipStartedAt
      ? (performance.now() - this.clipStartedAt) / 1000
      : 0;
    const cooldown = Math.max(0, (this.cooldownUntil - performance.now()) / 1000);
    const fields = {
      enabled: this.enabled ? 'on' : 'off',
      state: this.state,
      pressure: this.pressure.toFixed(2),
      clip: this.activeClip ? `${this.activeClip.id}/${this.activeClip.category}` : 'none',
      time: clipTime.toFixed(1) + 's',
      cooldown: cooldown.toFixed(1) + 's',
      reason: this.lastReason,
      solved: String(this.solved),
      target: `${(this.currentTarget.x ?? 0.5).toFixed(2)}, ${(this.currentTarget.y ?? 0.5).toFixed(2)}`,
    };
    for (const [name, value] of Object.entries(fields)) {
      const el = this.debugEl.querySelector(`[data-field="${name}"]`);
      if (el) el.textContent = value;
    }
  }
}
