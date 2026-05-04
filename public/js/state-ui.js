// public/js/state-ui.js
//
// Phase 2.8 — overlay panels + cards + algorithm toast.
//
// Owns the DOM beneath the cube canvas:
//   • Top-left: title, mode badges (palette / voice / regime / solved),
//     turn-rate readout, active K/C cards
//   • Bottom-left: state panel (face, active voice, S4 element, path,
//     step, snap, complex phase, orbit, scramble, permutation) +
//     hidden expression panel (kept as DOM so legacy gyro write-throughs
//     don't NPE)
//   • Top-center: algorithm buffer + algorithm notification toast
//
// State updates flow through `update(state, move)` (replaces the old
// inline updateState + updateV2State pair). Cube-scene-specific work
// (snap quat, vertex/ghost-vertex animations, ghost material opacity,
// active-ring animation, vertex labels) lives in cube-scene.js.
//
// Cross-module hand-offs handled by main.js:
//   • transport.on('state')   → cubeScene.update + stateUi.update + sieve.setActive
//   • transport.on('algorithm') → stateUi.handleAlgorithmEvent
//   • transport.on('solve')   → stateUi.setSolvedBadge(true, true)
//   • transport.on('gyroTick') → stateUi.updateExpression(quat, dev)
//   • #s-path click           → init({ onPathToggle }) callback

import { setActive as setActiveSieve } from './sieve.js';

// ---- Constants (internal) --------------------------------------------------

const COMPLEX_SHORT = {
  1: 'pizz scatter',
  2: 'bowed sweep',
  3: 'bowed sustain',
  4: 'harm+legno',
  5: 'wild gliss',
  6: 'ord. gliss',
  7: 'tasto sust.',
  8: 'ponticello',
};

const INTENSITY_LEVELS = { 'p': 0.1, 'mp': 0.25, 'mf': 0.42, 'f': 0.58, 'ff': 0.75, 'fff': 0.92 };

// Phase A1 — mirror of FACE_SIGNATURES (envelope/articulation/motion +
// registerBias for notation). Source of truth lives in src/face-gesture.ts;
// this is for HUD + tier-1 notation. Half-turns (L2/R2/...) and non-face
// moves return null.
const FACE_SIG = {
  'U':  { envelope: 'pluck', articulation: 'attack',    motion: 'up',        registerBias:  0.8 },
  "U'": { envelope: 'fade',  articulation: 'release',   motion: 'down',      registerBias:  0.8 },
  'D':  { envelope: 'stab',  articulation: 'attack',    motion: 'down',      registerBias: -0.8 },
  "D'": { envelope: 'hairpin-up',   articulation: 'sustained', motion: 'static',    registerBias: -0.8 },
  'L':  { envelope: 'swell', articulation: 'sustained', motion: 'up',        registerBias:  0.0 },
  "L'": { envelope: 'fade',  articulation: 'release',   motion: 'down',      registerBias:  0.0 },
  'R':  { envelope: 'stab',  articulation: 'attack',    motion: 'static',    registerBias:  0.0 },
  "R'": { envelope: 'burst', articulation: 'iterative', motion: 'oscillate', registerBias:  0.0 },
  'F':  { envelope: 'swell', articulation: 'sustained', motion: 'up',        registerBias:  0.3 },
  "F'": { envelope: 'swell', articulation: 'sustained', motion: 'down',      registerBias:  0.3 },
  'B':  { envelope: 'pluck', articulation: 'attack',    motion: 'static',    registerBias: -0.3 },
  "B'": { envelope: 'hairpin-down', articulation: 'sustained', motion: 'oscillate', registerBias: -0.3 },
};

// Move log — dashboard-side FIFO of the last RECENT_MOVES_MAX moves the
// performer has executed (independent of the engine's `state.algorithmBuffer`,
// which clears on its own 2 s timeout / algorithm-fire).
const RECENT_MOVES_MAX = 8;
const recentMoves = [];

let moveCount = 0;
let algorithmBook = [];
let algorithmNotificationTimeout = null;
let solveBadgePulseTimeout = null;

// ---- DOM caches (built in init()) ------------------------------------------

const vertexCards = [];
const complexCards = [];
const seqPips = [];
const permSlots = [];

// ---- Local-expression state (gyro-derived) --------------------------------

let prevGyroQuat = [0, 0, 0, 1];
let prevGyroTime = 0;

// ---- Init -----------------------------------------------------------------

/**
 * Build the dynamic DOM (vertex cards, complex cards, seq pips, perm slots)
 * and wire optional callbacks. Idempotent — call once per page load.
 */
export function init() {
  const vertexGrid = document.getElementById('vertex-grid');
  for (let i = 0; i < 8; i++) {
    const card = document.createElement('div');
    card.className = 'vertex-card';
    card.innerHTML = `
      <div class="vertex-label">K${i + 1}</div>
      <div class="vertex-param">D <span class="val" data-v="d">--</span></div>
      <div class="vertex-param">G <span class="val" data-v="g">--</span></div>
      <div class="vertex-param">U <span class="val" data-v="u">--</span>s</div>
      <div class="intensity-bar"><div class="intensity-fill" data-v="bar"></div></div>
    `;
    vertexGrid.appendChild(card);
    vertexCards.push(card);
  }

  const complexGrid = document.getElementById('complex-grid');
  for (let i = 0; i < 8; i++) {
    const card = document.createElement('div');
    card.className = 'complex-card';
    card.innerHTML = `
      <div class="complex-num">C${i + 1}</div>
      <div class="complex-name">--</div>
    `;
    complexGrid.appendChild(card);
    complexCards.push(card);
  }

  const seqVertexBar = document.getElementById('seq-vertex-bar');
  for (let i = 0; i < 8; i++) {
    const pip = document.createElement('div');
    pip.className = 'seq-vertex-pip';
    pip.innerHTML = `K${i + 1}<span class="pip-complex"></span>`;
    seqVertexBar.appendChild(pip);
    seqPips.push(pip);
  }

  const permDisplay = document.getElementById('s-perm');
  for (let i = 0; i < 8; i++) {
    const slot = document.createElement('div');
    slot.className = 'perm-slot';
    slot.textContent = i + 1;
    permDisplay.appendChild(slot);
    permSlots.push(slot);
  }

}

/** Cache the algorithm book locally if any caller wants to read it later. */
export function setAlgorithmBook(book) {
  algorithmBook = book;
}

// ---- update(state, move) ---------------------------------------------------

/**
 * Apply a state broadcast. Combines the legacy inline updateState +
 * updateV2State paths but skips cube-scene-specific work (cube-scene's
 * own `update(state)` handles snap quats / animations / labels). Sieve
 * active-set highlighting is applied here too via the imported
 * setActiveSieve so the state path dispatches everything in one place.
 *
 * `move` is null for gyro-only state pushes; only refresh the per-turn UI
 * (face row, move log entry) when move is set.
 */
export function update(state, move) {
  const activeIdx = state.activeVertex ?? 0;

  document.getElementById('s-step').textContent  = state.step;

  document.getElementById('s-k-group').textContent = state.kGroup;
  document.getElementById('s-tetra').textContent = state.tetraIndex === 0 ? 'even' : 'odd';
  document.getElementById('s-tetra').className = 'state-val ' + (state.tetraIndex === 0 ? 'accent' : 'warm');
  document.getElementById('s-cycle').textContent = state.cyclicPhase;

  const activeKIdx = state.kPermutation ? state.kPermutation[activeIdx] : activeIdx;
  document.getElementById('s-active-vertex').textContent = `K${activeKIdx + 1}`;

  // Face row only refreshes on a real turn.
  if (move) {
    const faceEl = document.getElementById('s-face');
    if (faceEl) {
      const sig = FACE_SIG[move];
      if (sig) {
        faceEl.textContent = `${move} · ${sig.envelope}`;
        faceEl.title = `envelope: ${sig.envelope} · articulation: ${sig.articulation} · motion: ${sig.motion}`;
        faceEl.className = 'state-val accent2';
      } else {
        faceEl.textContent = `${move} · —`;
        faceEl.title = 'half-turn or non-face move — no face signature';
        faceEl.className = 'state-val';
      }
    }
  }

  if (state.kPermutation) {
    for (let i = 0; i < 8; i++) {
      permSlots[i].textContent = state.kPermutation[i] + 1;
      permSlots[i].className = 'perm-slot' + (i === activeIdx ? ' active' : '');
    }
  }

  if (state.kVertices) {
    for (let i = 0; i < 8; i++) {
      const v = state.kVertices[i];
      const card = vertexCards[i];
      const kIdx = state.kPermutation ? state.kPermutation[i] : i;
      card.querySelector('.vertex-label').textContent = `K${kIdx + 1}`;
      card.querySelector('[data-v="d"]').textContent = v.density.toFixed(1);
      card.querySelector('[data-v="g"]').textContent = v.intensity;
      card.querySelector('[data-v="u"]').textContent = v.duration;
      const pct = (INTENSITY_LEVELS[v.intensity] || 0.5) * 100;
      card.querySelector('[data-v="bar"]').style.width = pct + '%';
      card.className = 'vertex-card' + (i === activeIdx ? ' active' : ' inactive');
    }
  }

  if (state.cAssignments) {
    for (let i = 0; i < 8; i++) {
      const ct = state.cAssignments[i];
      const card = complexCards[i];
      const isActive = i === activeIdx;
      card.className = `complex-card ct-${ct}` + (isActive ? ' active' : ' inactive');
      card.querySelector('.complex-num').textContent = `C${ct}`;
      card.querySelector('.complex-name').textContent = COMPLEX_SHORT[ct] || '';
    }

    for (let i = 0; i < 8; i++) {
      const ct = state.cAssignments[i];
      const kIdx = state.kPermutation ? state.kPermutation[i] : i;
      seqPips[i].className = 'seq-vertex-pip' + (i === activeIdx ? ' active' : '');
      seqPips[i].innerHTML = `K${kIdx + 1}<span class="pip-complex">${COMPLEX_SHORT[ct] || ''}</span>`;
    }
  }

  if (state.snapElement != null) {
    const snapVal = document.getElementById('s-snap');
    if (snapVal) snapVal.textContent = `S4 #${state.snapElement}`;
  }

  // Sieve active-set highlight — main.js could call sieve.setActive directly
  // but doing it here keeps the per-state-broadcast dispatch in one place.
  if (state.sieve) {
    setActiveSieve(new Set(state.sieve));
  }

  // ---- V2 fields -----------------------------------------------------------

  if (typeof state.scrambleFactor === 'number') {
    const sf = state.scrambleFactor;
    const bar = document.getElementById('scramble-bar');
    const val = document.getElementById('scramble-val');
    bar.style.width = (sf * 100) + '%';
    const hue = 140 - sf * 140;
    bar.style.background = `hsl(${hue}, 70%, 50%)`;
    val.textContent = sf.toFixed(2);
    document.getElementById('expr-scramble').textContent = sf.toFixed(2);
    document.getElementById('expr-scramble-bar').style.width = (sf * 100) + '%';
  }

  if (state.voiceMode) {
    const badge = document.getElementById('mode-voice');
    if (state.voiceMode === 'polyphonic') {
      badge.textContent = 'POLYPHONIC';
      badge.className = 'mode-badge voice-poly';
    } else {
      badge.textContent = 'SEQUENTIAL';
      badge.className = 'mode-badge voice-seq';
    }
  }

  if (state.performanceMode) {
    document.getElementById('mode-palette').textContent = state.performanceMode.palette;
  }

  if (state.regime) {
    const badge = document.getElementById('mode-regime');
    badge.textContent = state.regime.toUpperCase();
    badge.className = 'mode-badge regime-' + state.regime;
  }
  if (typeof state.turnRate === 'number') {
    document.getElementById('turn-rate-val').textContent = state.turnRate.toFixed(1) + ' t/s';
  }

  // Recent-moves buffer + algorithm match highlights.
  if (move) {
    recentMoves.push(move);
    if (recentMoves.length > RECENT_MOVES_MAX) recentMoves.shift();
  }
  {
    const bufEl = document.getElementById('algorithm-buffer');
    const matchedIndices = new Set();
    if (state.algorithmPartials && state.algorithmPartials.length > 0) {
      const best = state.algorithmPartials.reduce((a, b) =>
        (b.matched / b.total) > (a.matched / a.total) ? b : a
      );
      const start = recentMoves.length - best.matched;
      for (let i = start; i < recentMoves.length; i++) matchedIndices.add(i);
    }
    bufEl.innerHTML = '';
    for (let i = 0; i < recentMoves.length; i++) {
      const el = document.createElement('span');
      el.className = 'algorithm-buffer-move' + (matchedIndices.has(i) ? ' matched' : '');
      el.textContent = recentMoves[i];
      bufEl.appendChild(el);
    }
  }

  if (state.algorithmPartials) {
    const partialsEl = document.getElementById('algorithm-partials');
    if (state.algorithmPartials.length > 0) {
      const best = state.algorithmPartials
        .sort((a, b) => (b.matched / b.total) - (a.matched / a.total))
        .slice(0, 2);
      partialsEl.innerHTML = best.map(p => {
        const pct = Math.round((p.matched / p.total) * 100);
        const barW = Math.round((p.matched / p.total) * 40);
        return `<span class="partial-name">${p.name}</span> ${p.matched}/${p.total} <span class="partial-bar" style="width:${barW}px"></span>`;
      }).join('<br>');
    } else {
      partialsEl.innerHTML = '';
    }
  }

  // Move-log (legacy hidden panel — kept so the JS doesn't NPE).
  if (move) {
    const waiting = document.getElementById('waiting-msg');
    if (waiting) waiting.remove();

    moveCount++;
    const log = document.getElementById('move-log');
    if (log) {
      const entry = document.createElement('div');
      entry.className = 'move-entry';
      const ct = state.cAssignments ? state.cAssignments[activeIdx] : '?';
      entry.innerHTML = `
        <span class="move-name">${move}</span>
        <span class="move-vertex">K${activeKIdx + 1}</span>
        <span class="move-detail">C${ct} ${state.cyclicPhase} step ${state.step}</span>
      `;
      log.insertBefore(entry, log.firstChild);
      while (log.children.length > 50) log.removeChild(log.lastChild);
    }
  }
}

// ---- Algorithm toast / panel notification ---------------------------------

export function handleAlgorithmEvent(data) {
  const history = document.getElementById('algorithm-history');
  const toast = document.createElement('div');
  toast.className = 'algorithm-toast';
  toast.textContent = data.name.toUpperCase();
  history.appendChild(toast);
  setTimeout(() => toast.remove(), 2100);

  const notifEl = document.getElementById('algorithm-notification');
  notifEl.textContent = data.name.toUpperCase();
  notifEl.className = 'algorithm-notification active';
  if (algorithmNotificationTimeout) clearTimeout(algorithmNotificationTimeout);
  algorithmNotificationTimeout = setTimeout(() => {
    notifEl.className = 'algorithm-notification';
  }, 1500);
}

// ---- SOLVED badge ---------------------------------------------------------

export function setSolvedBadge(solved, pulse) {
  const el = document.getElementById('mode-solved');
  if (!el) return;
  el.classList.toggle('dim', !solved);
  if (pulse) {
    el.classList.remove('pulse');
    void el.offsetWidth;  // force reflow so the animation restarts
    el.classList.add('pulse');
    if (solveBadgePulseTimeout) clearTimeout(solveBadgePulseTimeout);
    solveBadgePulseTimeout = setTimeout(() => el.classList.remove('pulse'), 2400);
  }
}

// ---- Expression panel (gyro-tick driven) ----------------------------------

/**
 * Update the hidden expression panel from a 60 Hz gyroTick. Computes tilt
 * (pitch angle from quaternion) and spin (angular velocity vs prev frame)
 * locally so the values are tighter than the relay-broadcast state. `dev`
 * (gyro deviation) is passed through from the relay's tick payload.
 */
export function updateExpression(quat, dev) {
  if (!quat) return;
  const [x, y, z, w] = quat;
  const now = performance.now();

  const sinP = 2 * (w * x - y * z);
  const pitch = Math.asin(Math.max(-1, Math.min(1, sinP)));
  const tilt = (pitch + Math.PI / 2) / Math.PI;

  document.getElementById('expr-tilt').textContent = tilt.toFixed(2);
  document.getElementById('expr-tilt-bar').style.width = (tilt * 100) + '%';

  const dt = (now - prevGyroTime) / 1000;
  if (dt > 0 && dt < 1 && prevGyroTime > 0) {
    const dot = Math.abs(prevGyroQuat[0]*x + prevGyroQuat[1]*y + prevGyroQuat[2]*z + prevGyroQuat[3]*w);
    const angle = 2 * Math.acos(Math.min(1, dot));
    const angularVel = angle / dt;
    const spin = Math.min(1, angularVel / 6);
    document.getElementById('expr-spin').textContent = spin.toFixed(2);
    document.getElementById('expr-spin-bar').style.width = (spin * 100) + '%';
  }

  if (typeof dev === 'number') {
    const devEl  = document.getElementById('expr-dev');
    const devBar = document.getElementById('expr-dev-bar');
    if (devEl)  devEl.textContent = dev.toFixed(2);
    if (devBar) devBar.style.width = (dev * 100) + '%';
  }

  prevGyroQuat = [x, y, z, w];
  prevGyroTime = now;
}
