// public/js/face-glyph.js
//
// Face-signature glyph painter. Shared by cube-scene.js (predictive physical
// decals on ghost-cube faces) and state-ui.js (retrospective badge in the
// active K/C card area).
//
// Each face owns TWO signatures (CW unprimed + CCW primed) and the
// primed/unprimed pair can be very different (U = pluck/up vs U' =
// fade/down). One face decal shows both as two separate, unlabeled marks:
// top = unprimed clockwise, bottom = primed counter-clockwise. Each mark has
// its own bottom underline baked into the texture so orientation remains
// readable when the face twists or when the decal is viewed from behind
// through the transparent cube.
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

function roundedRectPath(ctx, x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.lineTo(x + w - rr, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + rr);
  ctx.lineTo(x + w, y + h - rr);
  ctx.quadraticCurveTo(x + w, y + h, x + w - rr, y + h);
  ctx.lineTo(x + rr, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - rr);
  ctx.lineTo(x, y + rr);
  ctx.quadraticCurveTo(x, y, x + rr, y);
}

function drawDirectionIcon(ctx, cx, cy, r, clockwise) {
  const start = clockwise ? -Math.PI * 0.70 : Math.PI * 0.30;
  const end = clockwise ? Math.PI * 0.95 : -Math.PI * 0.95;
  ctx.beginPath();
  ctx.arc(cx, cy, r, start, end, !clockwise);
  ctx.stroke();

  const theta = end;
  const tx = cx + Math.cos(theta) * r;
  const ty = cy + Math.sin(theta) * r;
  const dir = clockwise ? 1 : -1;
  const a = theta + dir * Math.PI * 0.58;
  ctx.beginPath();
  ctx.moveTo(tx, ty);
  ctx.lineTo(tx + Math.cos(a) * r * 0.42, ty + Math.sin(a) * r * 0.42);
  ctx.lineTo(tx + Math.cos(a - dir * Math.PI * 0.55) * r * 0.36, ty + Math.sin(a - dir * Math.PI * 0.55) * r * 0.36);
  ctx.closePath();
  ctx.fill();
}

// ---- Public painter --------------------------------------------------------

/**
 * Paint the paired (CW + CCW) glyph for `face` onto `ctx`.
 *
 * Layout (canvas WxH):
 *   top row    - clockwise / unprimed gesture
 *   bottom row - counter-clockwise / primed gesture
 */
export function paintFaceGlyph(ctx, face, opts = {}) {
  const W = opts.width  ?? ctx.canvas.width;
  const H = opts.height ?? ctx.canvas.height;
  const color = opts.color || '#e0f4ff';
  const lineWidth = opts.lineWidth ?? Math.max(2.1, W / 64);
  const activeMove = opts.activeMove || null;

  ctx.clearRect(0, 0, W, H);
  if (opts.background !== false) {
    roundedRectPath(ctx, W * 0.06, H * 0.08, W * 0.88, H * 0.84, W * 0.07);
    ctx.fillStyle = opts.background || 'rgba(2, 10, 16, 0.58)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(180, 245, 255, 0.28)';
    ctx.lineWidth = Math.max(1, W / 170);
    ctx.stroke();
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

  const rowX = W * 0.12;
  const rowW = W * 0.76;
  const rowH = H * 0.34;
  const topY = H * 0.12;
  const botY = H * 0.54;
  const iconX = rowX + rowW * 0.18;
  const envX = rowX + rowW * 0.36;
  const envW = rowW * 0.48;
  const iconR = Math.max(8, W * 0.055);

  const rows = [
    { move: moveCW, sig: sigCW, y: topY, clockwise: true },
    { move: moveCCW, sig: sigCCW, y: botY, clockwise: false },
  ];
  for (const row of rows) {
    if (!row.sig) continue;
    const active = activeMove === row.move;
    ctx.save();
    if (active) {
      roundedRectPath(ctx, rowX - W * 0.025, row.y - H * 0.025, rowW + W * 0.05, rowH + H * 0.05, W * 0.035);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.64)';
      ctx.lineWidth = Math.max(1.4, W / 130);
      ctx.stroke();
    }
    ctx.globalAlpha = active || !activeMove ? 1.0 : 0.48;
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = lineWidth;
    drawDirectionIcon(ctx, iconX, row.y + rowH / 2, iconR, row.clockwise);
    drawEnvelope(ctx, row.sig.envelope, envX, row.y + H * 0.055, envW, rowH - H * 0.16);
    ctx.save();
    ctx.globalAlpha *= 0.92;
    ctx.lineWidth = Math.max(2.4, W / 70);
    ctx.beginPath();
    ctx.moveTo(rowX + rowW * 0.18, row.y + rowH - H * 0.045);
    ctx.lineTo(rowX + rowW * 0.82, row.y + rowH - H * 0.045);
    ctx.stroke();
    ctx.restore();
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
