// public/js/face-glyph.js
//
// Face-signature glyph painter. Shared by cube-scene.js (6 sprites on the
// ghost cube faces, predictive — "if you turn this face, here's the
// gesture you'll get") and state-ui.js (one slot in the K/C card area,
// retrospective — "the gesture you just heard came from this face").
//
// Each face owns TWO signatures (CW unprimed + CCW primed) and the
// primed/unprimed pair can be very different (U = pluck/up vs U' =
// fade/down). One glyph per face must show both, so the painter draws a
// stacked pair: top row = unprimed, bottom row = primed (marked with a
// faint apostrophe).
//
// FACE_SIG is the local mirror of `src/face-gesture.ts` FACE_SIGNATURES.
// Source of truth is the TS file; keep both in sync. Half-turns (L2/R2/...)
// and non-face moves return undefined.

export const FACE_SIG = {
  'U':  { envelope: 'pluck',         articulation: 'attack',    motion: 'up',        registerBias:  0.8 },
  "U'": { envelope: 'fade',          articulation: 'release',   motion: 'down',      registerBias:  0.8 },
  'D':  { envelope: 'stab',          articulation: 'attack',    motion: 'down',      registerBias: -0.8 },
  "D'": { envelope: 'hairpin-up',    articulation: 'sustained', motion: 'static',    registerBias: -0.8 },
  'L':  { envelope: 'swell',         articulation: 'sustained', motion: 'up',        registerBias:  0.0 },
  "L'": { envelope: 'fade',          articulation: 'release',   motion: 'down',      registerBias:  0.0 },
  'R':  { envelope: 'stab',          articulation: 'attack',    motion: 'static',    registerBias:  0.0 },
  "R'": { envelope: 'burst',         articulation: 'iterative', motion: 'oscillate', registerBias:  0.0 },
  'F':  { envelope: 'swell',         articulation: 'sustained', motion: 'up',        registerBias:  0.3 },
  "F'": { envelope: 'swell',         articulation: 'sustained', motion: 'down',      registerBias:  0.3 },
  'B':  { envelope: 'pluck',         articulation: 'attack',    motion: 'static',    registerBias: -0.3 },
  "B'": { envelope: 'hairpin-down',  articulation: 'sustained', motion: 'oscillate', registerBias: -0.3 },
};

/** The 6 cube faces in engine-letter form (matches cube-scene.js CUBE_VERTS axes:
 *  R=+X, U=+Y, F=+Z). MOVE_REMAP at the relay edge has already converted
 *  factory→engine, so these letters are what main.js / state-ui see in `state.move`. */
export const FACES = ['U', 'D', 'L', 'R', 'F', 'B'];

/** (CW unprimed, CCW primed) pair per face. */
export const FACE_MOVE_PAIR = {
  U: ['U', "U'"], D: ['D', "D'"], L: ['L', "L'"],
  R: ['R', "R'"], F: ['F', "F'"], B: ['B', "B'"],
};

/** Outward face-normal vectors in ghost-cube local coords (unit cube ±1). */
export const FACE_NORMAL = {
  R: [ 1,  0,  0],
  L: [-1,  0,  0],
  U: [ 0,  1,  0],
  D: [ 0, -1,  0],
  F: [ 0,  0,  1],
  B: [ 0,  0, -1],
};

/** Face-center positions in ghost-cube local coords. Same as FACE_NORMAL since
 *  the cube is unit-radius, but kept separate so semantic intent reads. */
export const FACE_CENTER = FACE_NORMAL;

// ---- Sparkline + motion drawing primitives --------------------------------

function drawEnvelope(ctx, env, x, y, w, h) {
  switch (env) {
    case 'pluck': {
      // Vertical attack stroke + dot at the top
      ctx.beginPath();
      ctx.moveTo(x + w / 2, y + h - 2);
      ctx.lineTo(x + w / 2, y + 6);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(x + w / 2, y + 4, 3, 0, Math.PI * 2);
      ctx.fill();
      return;
    }
    case 'stab': {
      // Steep narrow peak — fast attack + fast decay
      ctx.beginPath();
      ctx.moveTo(x + w * 0.30, y + h - 2);
      ctx.lineTo(x + w * 0.50, y + 4);
      ctx.lineTo(x + w * 0.70, y + h - 2);
      ctx.stroke();
      return;
    }
    case 'swell': {
      // Crescendo "<" — apex on the left, opens to the right
      ctx.beginPath();
      ctx.moveTo(x, y + h / 2);
      ctx.lineTo(x + w, y + 4);
      ctx.moveTo(x, y + h / 2);
      ctx.lineTo(x + w, y + h - 4);
      ctx.stroke();
      return;
    }
    case 'fade': {
      // Decrescendo ">" — apex on the right, opens to the left
      ctx.beginPath();
      ctx.moveTo(x + w, y + h / 2);
      ctx.lineTo(x, y + 4);
      ctx.moveTo(x + w, y + h / 2);
      ctx.lineTo(x, y + h - 4);
      ctx.stroke();
      return;
    }
    case 'hairpin-up': {
      // "<>" — crescendo+decrescendo, peak in middle (lozenge)
      ctx.beginPath();
      ctx.moveTo(x, y + h / 2);
      ctx.lineTo(x + w / 2, y + 4);
      ctx.lineTo(x + w, y + h / 2);
      ctx.moveTo(x, y + h / 2);
      ctx.lineTo(x + w / 2, y + h - 4);
      ctx.lineTo(x + w, y + h / 2);
      ctx.stroke();
      return;
    }
    case 'hairpin-down': {
      // "><" — decrescendo+crescendo, trough in middle (bowtie)
      ctx.beginPath();
      ctx.moveTo(x, y + 4);
      ctx.lineTo(x + w / 2, y + h / 2);
      ctx.lineTo(x, y + h - 4);
      ctx.moveTo(x + w, y + 4);
      ctx.lineTo(x + w / 2, y + h / 2);
      ctx.lineTo(x + w, y + h - 4);
      ctx.stroke();
      return;
    }
    case 'burst': {
      // 4 vertical strokes of varying height — iterative attack train
      const heights = [0.55, 0.85, 0.70, 1.0];
      for (let i = 0; i < heights.length; i++) {
        const xi = x + (i + 0.5) * (w / heights.length);
        ctx.beginPath();
        ctx.moveTo(xi, y + h - 2);
        ctx.lineTo(xi, y + h - 2 - (h - 4) * heights[i]);
        ctx.stroke();
      }
      return;
    }
    default:
      return;
  }
}

function drawPrimeMark(ctx, x, y, w, h, color) {
  // Faint slanted apostrophe to mark the primed (CCW) row. Drawn with the
  // same stroke style as the glyph but at reduced opacity so it reads as
  // notation, not data.
  ctx.save();
  ctx.globalAlpha = 0.65;
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(2, ctx.lineWidth);
  ctx.beginPath();
  ctx.moveTo(x + w * 0.35, y + h * 0.10);
  ctx.lineTo(x + w * 0.60, y + h * 0.55);
  ctx.stroke();
  ctx.restore();
}

// ---- Public painter --------------------------------------------------------

/**
 * Paint the paired (CW + CCW) glyph for `face` onto `ctx`. Two symbols per
 * face — both are envelope sparklines.
 *
 * Layout (canvas WxH):
 *   row 0 (top half)    — unprimed (CW) envelope
 *   row 1 (bottom half) — primed   (CCW) envelope + faint ' marker
 *
 * Motion direction is intentionally NOT drawn: it's already implicit in face
 * position on the cube (U register treble, D register bass) and partially in
 * envelope shape (a `>` fade implies decay/release). The pair F vs F' (both
 * `swell`) is distinguished only by the apostrophe — the audible up/down
 * difference is learned by ear, not visual encoding. Background transparent
 * unless `opts.background` is passed.
 */
export function paintFaceGlyph(ctx, face, opts = {}) {
  const W = opts.width  ?? ctx.canvas.width;
  const H = opts.height ?? ctx.canvas.height;
  const color = opts.color || '#e0f4ff';
  const lineWidth = opts.lineWidth ?? Math.max(2.4, W / 44);

  ctx.clearRect(0, 0, W, H);
  if (opts.background) {
    ctx.fillStyle = opts.background;
    ctx.fillRect(0, 0, W, H);
  }

  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  const pair = FACE_MOVE_PAIR[face];
  if (!pair) return;
  const [moveCW, moveCCW] = pair;
  const sigCW  = FACE_SIG[moveCW];
  const sigCCW = FACE_SIG[moveCCW];

  const rowH = H / 2;
  const padY = rowH * 0.16;
  const envX = W * 0.10, envW = W * 0.70;
  const primeX = W * 0.82, primeW = W * 0.14;

  if (sigCW) {
    drawEnvelope(ctx, sigCW.envelope, envX, padY,           envW, rowH - 2 * padY);
  }
  if (sigCCW) {
    drawEnvelope(ctx, sigCCW.envelope, envX, rowH + padY,   envW, rowH - 2 * padY);
    drawPrimeMark(ctx, primeX, rowH + padY, primeW, rowH - 2 * padY, color);
  }

  // Optional face letter in the top-left (used by the K/C card slot —
  // the 6 ghost-cube sprites don't need it because face position
  // already conveys identity).
  if (opts.faceLetter) {
    ctx.save();
    ctx.globalAlpha = 0.85;
    ctx.fillStyle = color;
    ctx.font = `bold ${Math.round(W * 0.14)}px monospace`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(face, W * 0.04, H * 0.02);
    ctx.restore();
  }
}

/**
 * Paint a "no signature" placeholder (e.g., before the first face turn,
 * or after a half-turn that produces no FaceMove).
 */
export function paintEmptyGlyph(ctx, opts = {}) {
  const W = opts.width  ?? ctx.canvas.width;
  const H = opts.height ?? ctx.canvas.height;
  const color = opts.color || '#3a4a55';
  ctx.clearRect(0, 0, W, H);
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(W * 0.20, H * 0.50);
  ctx.lineTo(W * 0.80, H * 0.50);
  ctx.stroke();
}
