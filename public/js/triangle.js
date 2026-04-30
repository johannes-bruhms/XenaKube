// public/js/triangle.js
//
// Phase 2.7 — white triangle leg overlay. For every active note, two
// straight white lines extend from the active K-vertex (live cube) and its
// nearest ghost C-vertex (ghost cube) out to the left edge of the matching
// sieve cell. Combined with cube-scene's K↔C 3D line they form a triangle
// per note. Double stops produce two triangles sharing the K↔C edge.
//
// Behaviours:
//   • K and C endpoints follow the cube's gyro / view-offset rotation (via
//     cube-scene's getActiveKWorldPos / getCWorldPos getters)
//   • sieve endpoint follows the active note's pitch (via sieve's
//     getCellRect)
//   • C5/C6/C7 gliss complexes interpolate the sieve endpoint between
//     consecutive noteons over `predictGlissDuration` (cubic smoothstep
//     `easeSlide`) so the leg slides cell-to-cell at SWAM's portamento
//     rate instead of jumping at the discrete MIDI rate
//   • C1 pizz fades on noteoff with a velocity-scaled `PIZZ_FADE_*`
//     envelope; everything else snaps off
//
// Slide-vs-leap classifier (white-line side, paired with rolling-score's
// `noteOn` chainStart computation per the unified classifier contract in
// CLAUDE.md):
//   • At noteon, _findGlissLine returns the live (sustaining) gliss line
//     for (voice, complex) if any. Its presence/absence IS the slide-vs-
//     leap discriminator.
//   • Slide (overlapping noteons) → existing line found → retarget
//   • Leap or steal (clean noteoff before noteon) → no live line → start
//     fresh with NO ramp time (instant snap)
//
// Cross-module reads via init() callbacks (avoids any direct import of
// cube-scene / rolling-score, so this module remains a pure consumer):
//   • getCamera / getActiveKWorldPos / getCWorldPos from cube-scene
//   • getCellRect from sieve
//   • hasActiveGliss from rolling-score (post-noteoff "is the chain over?"
//     check used by endLine)
//
// Exports:
//   • init({ ... }) — wire callbacks, start render loop
//   • noteOn(voice, pitch, velocity, complex, key) — startLine
//   • noteOff(voice, pitch, complex, key) — endLine
//   • panic() — clearAllLines (engine panic / WS disconnect)
//   • getActiveGlissLineDisplay(now) — for rolling-score's
//     `assertGlissSync` (Phase 1 invariant). Returns
//     `{voice, complex, pitch}` for the FIRST active gliss line, or null.

import * as THREE from 'three';
import { GLISS_COMPLEXES, PORTAMENTO_MS_PER_SEMITONE, PIZZ_FADE_MIN_MS, PIZZ_FADE_MAX_MS } from './constants.js';

// ---- Module state ----------------------------------------------------------

const lineOverlay = document.getElementById('line-overlay');
const lineCtx = lineOverlay.getContext('2d');
let lineDpr = 1;

// Per-note line state. Mirrors activeMidiNotes' lifecycle but is its own
// array so we can keep drawing fade-out lines after noteoff (matching the
// cell-glow release tail). Each entry carries the gliss interpolation
// parameters so a single line can slide its endpoint between cells.
const lineNotes = [];

// Cross-module getters wired via init().
let _getCamera          = null;
let _getActiveKWorldPos = null;
let _getCWorldPos       = null;
let _getSieveCellRect   = null;
let _hasActiveGliss     = () => false;

// ---- Resize ---------------------------------------------------------------

function resizeLineOverlay() {
  lineDpr = Math.max(1, window.devicePixelRatio || 1);
  const cssW = window.innerWidth;
  const cssH = window.innerHeight;
  lineOverlay.style.width  = cssW + 'px';
  lineOverlay.style.height = cssH + 'px';
  lineOverlay.width  = Math.round(cssW * lineDpr);
  lineOverlay.height = Math.round(cssH * lineDpr);
}

// ---- Easing + slide prediction --------------------------------------------

// Cubic smoothstep — the natural ease-in-out curve SWAM Cello's portamento
// traces. Mirrored exactly by rolling-score.js's _glissEase so the white
// triangle leg endpoint and the rolling-score chain plot the SAME Y at
// the same time. Phase 1 `assertGlissSync` enforces this.
function easeSlide(t) {
  if (t <= 0) return 0;
  if (t >= 1) return 1;
  return t * t * (3 - 2 * t);
}

function predictGlissDuration(fromPitch, toPitch, complex) {
  const interval = Math.abs(toPitch - fromPitch);
  if (interval === 0) return 0;
  const perSemi = PORTAMENTO_MS_PER_SEMITONE[complex] || 80;
  return Math.min(2000, interval * perSemi);
}

// Compute the displayed pitch of an in-flight line at time `now`. Used by
// startLine to pick the most-accurate fromPitch for a continuing gliss
// (SWAM aborts in-progress slides when a new noteon arrives, retargeting
// from wherever the audible pitch had reached — we mirror that visually).
function _displayedPitch(ln, now) {
  if (ln.animDurMs <= 0) return ln.toPitch;
  const t = Math.min(1, Math.max(0, (now - ln.animStartMs) / ln.animDurMs));
  return ln.fromPitch + (ln.toPitch - ln.fromPitch) * easeSlide(t);
}

function _findGlissLine(voice, complex) {
  for (let i = lineNotes.length - 1; i >= 0; i--) {
    const ln = lineNotes[i];
    if (ln.isGliss && ln.voice === voice && ln.complex === complex) return ln;
  }
  return null;
}

// ---- Sieve endpoint lookup -------------------------------------------------

function sieveCellLeftEdgePos(pitch) {
  const r = _getSieveCellRect(pitch);
  if (!r || r.height === 0) return null;
  return { x: r.left, y: r.top + r.height / 2 };
}

// ---- World→screen projection ----------------------------------------------

const _projVec = new THREE.Vector3();
function projectWorldToScreen(worldVec) {
  const camera = _getCamera();
  _projVec.copy(worldVec).project(camera);
  return {
    x: (_projVec.x * 0.5 + 0.5) * window.innerWidth,
    y: (1 - (_projVec.y * 0.5 + 0.5)) * window.innerHeight,
  };
}

const _kLineWorld = new THREE.Vector3();
const _cLineWorld = new THREE.Vector3();
const _cTmpWorld  = new THREE.Vector3();

// ---- Per-frame draw loop ---------------------------------------------------

function drawLineOverlay() {
  const w = lineOverlay.width;
  const h = lineOverlay.height;
  lineCtx.clearRect(0, 0, w, h);

  if (lineNotes.length === 0) {
    requestAnimationFrame(drawLineOverlay);
    return;
  }

  // Mirrors cube-scene's per-frame nearest-C search so the 3D K↔C line and
  // the 2D K→sieve / C→sieve lines all converge at the same K and C points.
  _getActiveKWorldPos(_kLineWorld);
  let bestDist2 = Infinity;
  for (let c = 0; c < 8; c++) {
    _getCWorldPos(c, _cTmpWorld);
    const d2 = _kLineWorld.distanceToSquared(_cTmpWorld);
    if (d2 < bestDist2) {
      bestDist2 = d2;
      _cLineWorld.copy(_cTmpWorld);
    }
  }
  const kScreen = projectWorldToScreen(_kLineWorld);
  const cScreen = projectWorldToScreen(_cLineWorld);

  const now = performance.now();
  let toRemove = null;

  lineCtx.lineWidth = 2.2 * lineDpr;
  lineCtx.lineCap = 'round';
  lineCtx.lineJoin = 'round';

  for (let li = 0; li < lineNotes.length; li++) {
    const ln = lineNotes[li];

    let opacity = 1;
    if (!ln.sustaining) {
      const dt = now - ln.releaseStartMs;
      if (dt >= ln.fadeMs) {
        if (!toRemove) toRemove = [];
        toRemove.push(li);
        continue;
      }
      const fadeT = dt / ln.fadeMs;
      opacity = 1 - fadeT * fadeT;
    }

    let pitch = ln.toPitch;
    if (ln.animDurMs > 0) {
      const tRaw = (now - ln.animStartMs) / ln.animDurMs;
      const tClamp = Math.min(1, Math.max(0, tRaw));
      pitch = ln.fromPitch + (ln.toPitch - ln.fromPitch) * easeSlide(tClamp);
    }

    const cellPos = sieveCellLeftEdgePos(pitch);
    if (!cellPos) continue;

    const sx = cellPos.x * lineDpr;
    const sy = cellPos.y * lineDpr;
    const kx = kScreen.x * lineDpr, ky = kScreen.y * lineDpr;
    const cx = cScreen.x * lineDpr, cy = cScreen.y * lineDpr;

    lineCtx.strokeStyle = 'rgba(255, 255, 255, ' + opacity.toFixed(3) + ')';

    // Triangle legs are always STRAIGHT — the curve the user wants lives in
    // the rolling-score gliss chain (drawGlissChain), not here.
    lineCtx.beginPath();
    lineCtx.moveTo(kx, ky);
    lineCtx.lineTo(sx, sy);
    lineCtx.stroke();

    lineCtx.beginPath();
    lineCtx.moveTo(cx, cy);
    lineCtx.lineTo(sx, sy);
    lineCtx.stroke();
  }

  if (toRemove) {
    for (let i = toRemove.length - 1; i >= 0; i--) {
      lineNotes.splice(toRemove[i], 1);
    }
  }

  requestAnimationFrame(drawLineOverlay);
}

// ---- Public API ------------------------------------------------------------

/**
 * Wire callbacks and start the draw loop.
 *   getCamera          — cube-scene's perspective camera (for projection)
 *   getActiveKWorldPos — writes active K-vertex world pos into Vector3 out
 *   getCWorldPos       — writes c-th ghost C-vertex world pos into out
 *   getSieveCellRect   — DOMRect of the sieve cell for a given MIDI pitch
 *   hasActiveGliss     — `(voice, complex) => bool`. Called from endLine
 *                        AFTER the rolling-score has already shifted the
 *                        finalised note out of its FIFO, so a true result
 *                        means another gliss noteon is still in flight
 *                        and the line should keep tracking. Defaults to
 *                        false (always-end) if unwired.
 */
export function init({
  getCamera, getActiveKWorldPos, getCWorldPos,
  getSieveCellRect, hasActiveGliss,
} = {}) {
  if (getCamera)          _getCamera          = getCamera;
  if (getActiveKWorldPos) _getActiveKWorldPos = getActiveKWorldPos;
  if (getCWorldPos)       _getCWorldPos       = getCWorldPos;
  if (getSieveCellRect)   _getSieveCellRect   = getSieveCellRect;
  if (hasActiveGliss) {
    _hasActiveGliss = hasActiveGliss;
  } else {
    // Phase 2 cross-module wiring invariant — without this callback, every
    // gliss noteoff splices the white line immediately, breaking the chain
    // visualisation across legitimate slides (the line should track through
    // a chain of overlapping noteons and only drop when the *last* gliss
    // note for (voice, complex) lifts). Silent failure surface; the line
    // will look subtly wrong rather than crash. Loud at startup.
    console.warn('[triangle] init() called without hasActiveGliss — gliss line will drop immediately on every noteoff (chain visualisation broken)');
  }
  // Hard-required getters (without them drawLineOverlay throws on first
  // frame — that's loud enough; no warn needed). Listed for the audit:
  //   getCamera, getActiveKWorldPos, getCWorldPos, getSieveCellRect.
  resizeLineOverlay();
  window.addEventListener('resize', resizeLineOverlay);
  requestAnimationFrame(drawLineOverlay);
}

/**
 * Start a line for a noteon. For gliss complexes (C5/C6/C7), retarget any
 * existing live line for (voice, complex) from its currently-displayed
 * pitch (mirrors SWAM's portamento engine retarget). Otherwise push a
 * fresh line with NO ramp time; pizz lines also get a velocity-scaled
 * fade configured up-front so endLine doesn't need a lookup.
 */
export function noteOn(voice, pitch, velocity, complex, key) {
  const now = performance.now();

  if (GLISS_COMPLEXES.has(complex)) {
    const existing = _findGlissLine(voice, complex);
    if (existing) {
      const fromPitch = _displayedPitch(existing, now);
      existing.fromPitch  = fromPitch;
      existing.toPitch    = pitch;
      existing.animStartMs = now;
      existing.animDurMs   = predictGlissDuration(fromPitch, pitch, complex);
    } else {
      lineNotes.push({
        isGliss: true,
        voice, complex,
        fromPitch: pitch, toPitch: pitch,
        animStartMs: now, animDurMs: 0,
        sustaining: true,
        fadeMs: 0,
        releaseStartMs: 0,
      });
    }
    return;
  }

  const v = Math.max(0, Math.min(127, +velocity || 0));
  const fadeMs = (complex === 1)
    ? PIZZ_FADE_MIN_MS + (PIZZ_FADE_MAX_MS - PIZZ_FADE_MIN_MS) * Math.min(1, v / 110)
    : 0;
  lineNotes.push({
    isGliss: false,
    voice, complex, key,
    fromPitch: pitch, toPitch: pitch,
    animStartMs: now, animDurMs: 0,
    sustaining: true,
    fadeMs,
    releaseStartMs: 0,
  });
}

/**
 * End a line for a noteoff. For gliss complexes, drop the persistent line
 * ONLY when the chain has truly ended (no more same-(voice, complex) notes
 * sounding — checked via the rolling-score-injected hasActiveGliss).
 * For pizz, switch to the release tail; for everything else, splice now.
 */
export function noteOff(voice, pitch, complex, key) {
  if (GLISS_COMPLEXES.has(complex)) {
    if (_hasActiveGliss(voice, complex)) return;
    for (let i = 0; i < lineNotes.length; i++) {
      const ln = lineNotes[i];
      if (ln.isGliss && ln.voice === voice && ln.complex === complex) {
        lineNotes.splice(i, 1);
        return;
      }
    }
    return;
  }

  for (let i = 0; i < lineNotes.length; i++) {
    const ln = lineNotes[i];
    if (!ln.isGliss && ln.key === key && ln.voice === voice && ln.sustaining) {
      if (ln.fadeMs > 0) {
        ln.sustaining = false;
        ln.releaseStartMs = performance.now();
      } else {
        lineNotes.splice(i, 1);
      }
      return;
    }
  }
}

/** Drop every line. Called on engine panic / WS panic. */
export function panic() {
  lineNotes.length = 0;
}

/**
 * Snapshot the FIRST active gliss line's currently displayed state, or
 * null. Used by rolling-score.js's `assertGlissSync` to compare line ↔
 * chain trajectories without a circular import. Returns
 * `{ voice, complex, pitch }` (pitch is the eased-interpolated value at
 * `now`, matching what drawLineOverlay will paint this frame).
 */
export function getActiveGlissLineDisplay(now) {
  for (const ln of lineNotes) {
    if (ln.isGliss) {
      return {
        voice:   ln.voice,
        complex: ln.complex,
        pitch:   _displayedPitch(ln, now),
      };
    }
  }
  return null;
}
