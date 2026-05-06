// public/js/cube-scene.js
//
// Phase 2.5 — Three.js cube scene module. Owns:
//   • the live K-cube (edges, tetra wireframes, vertex spheres + labels,
//     active-vertex glow ring)
//   • the ghost C-cube (faint cyan wireframe + per-C dots/labels that
//     snap-rotate with state.snapQuat; C identities stay fixed to local
//     slots in beta-cosmo, but walk across slots in alpha-cosmo)
//   • the K↔C 3D connection line that joins the active K-vertex to its
//     geometrically nearest C-vertex
//   • all per-frame animations (gyro live rotation, ghost snap rotation,
//     active-step LERP, K vertex assignment LERPs, active highlights)
//   • the rotation gizmo (cam/live/ghost rotate target + axis rings)
//   • the auto-fit camera and resize handling
//
// Exports a small API consumed by main.js (state updates, gyro tick,
// connect/disconnect view), triangle.js (active K + C world positions
// for line projection), and the rolling-score / state-ui modules
// (indirectly via main.js).
//
// Constants kept internal:
//   CUBE_VERTS, CUBE_EDGES, TETRA_A, TETRA_B
//   GHOST_VERT_COLORS{,_HEX,_DIM}
//   COMPLEX_ABBR (only used in ghost label paint)
//
// State kept private to this module: every Three.js object, every
// animation-state Float32Array / Quaternion, gyroZeroInv,
// autoZeroPending, currentGyro / hasGyro / hasSnap.

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { FACES, FACE_NORMAL as FACE_GLYPH_NORMAL, paintFaceGlyph } from './face-glyph.js';

// ---- Geometry constants (internal) -----------------------------------------

// Cube vertex positions (matching group.ts labeling).
const CUBE_VERTS = [
  new THREE.Vector3( 1,  1,  1),  // 0 FTR
  new THREE.Vector3(-1,  1,  1),  // 1 FTL
  new THREE.Vector3(-1,  1, -1),  // 2 BTL
  new THREE.Vector3( 1,  1, -1),  // 3 BTR
  new THREE.Vector3( 1, -1,  1),  // 4 FBR
  new THREE.Vector3(-1, -1,  1),  // 5 FBL
  new THREE.Vector3(-1, -1, -1),  // 6 BBL
  new THREE.Vector3( 1, -1, -1),  // 7 BBR
];

const FACE_CORNERS = {
  R: [0, 3, 4, 7],
  L: [1, 2, 5, 6],
  U: [0, 1, 2, 3],
  D: [4, 5, 6, 7],
  F: [0, 1, 4, 5],
  B: [2, 3, 6, 7],
};

const CUBE_EDGES = [
  [0,1],[1,2],[2,3],[3,0],
  [4,5],[5,6],[6,7],[7,4],
  [0,4],[1,5],[2,6],[3,7],
];

const TETRA_A = [0, 2, 5, 7];
const TETRA_B = [1, 3, 4, 6];

// Per-K vertex palette (live cube — warm spectrum).
//
// The pre-existing 2-color tetra split (TETRA_A green / TETRA_B orange)
// painted four spheres the same hue, so K2/K4/K5/K7 were
// indistinguishable at a glance and same for K1/K3/K6/K8. Now each K
// owns a unique hue, but the tetra distinction is preserved as a sub-
// pattern: TETRA_A {K1,K3,K6,K8} = green→yellow-green family,
// TETRA_B {K2,K4,K5,K7} = red→orange→pink family. Tetra wireframes
// (tetraALines / tetraBLines) keep their uniform 0x00ff88 / 0xff6644
// so the structural identity of the two interlocking tetrahedra still
// reads at a glance.
//
// Sized as 8 separate hues rather than a luminance ramp so the
// distinction works on dim ghost-faded labels too (DIM = ~60%
// luminance of the bright hue).
const K_VERT_COLORS = [
  0x00ee77,  // K1 (TETRA_A) deep mint
  0xff3344,  // K2 (TETRA_B) red
  0xaaff00,  // K3 (TETRA_A) lime
  0xff8800,  // K4 (TETRA_B) orange
  0xffd700,  // K5 (TETRA_B) gold
  0x44aa66,  // K6 (TETRA_A) forest green
  0xff44aa,  // K7 (TETRA_B) pink-magenta
  0xccff77,  // K8 (TETRA_A) yellow-green
];
const K_VERT_COLORS_HEX = [
  '#00ee77', '#ff3344', '#aaff00', '#ff8800',
  '#ffd700', '#44aa66', '#ff44aa', '#ccff77',
];
const K_VERT_COLORS_DIM = [
  '#00aa55', '#cc2233', '#88cc00', '#cc6600',
  '#ccaa00', '#338855', '#cc3388', '#99cc55',
];

// Ghost-cube dot palette. All-cool-spectrum (cyan → blue → indigo →
// violet → teal) so the K (warm) and C (cool) sets share zero hues —
// at a glance the user reads "this vertex belongs to the live cube" or
// "ghost cube" by warm vs cool alone, then identifies which K/C by hue.
// Ghost wireframe stays 0x00ccff (edges are structure, dots are
// identity). Dim colours are ~60% luminance for the abbreviation line.
const GHOST_VERT_COLORS = [
  0x00ddff,  // C1 cyan
  0x0099ff,  // C2 sky blue
  0x3366ff,  // C3 royal blue
  0x7755ff,  // C4 indigo
  0xaa44ff,  // C5 purple
  0xcc55dd,  // C6 magenta-purple
  0x5588cc,  // C7 slate blue
  0x22bbcc,  // C8 teal
];
const GHOST_VERT_COLORS_HEX = [
  '#00ddff', '#0099ff', '#3366ff', '#7755ff',
  '#aa44ff', '#cc55dd', '#5588cc', '#22bbcc',
];
const GHOST_VERT_COLORS_DIM = [
  '#0099bb', '#0066bb', '#2244cc', '#5533cc',
  '#7733cc', '#9944aa', '#3366aa', '#178899',
];

// Used only for the two-line ghost-label paint (`C{n}` + abbreviation).
const COMPLEX_ABBR = {
  1: 'pizz', 2: 'bow', 3: 'sust', 4: 'harm',
  5: 'glsW', 6: 'glsM', 7: 'glsS', 8: 'pont'
};

const INTENSITY_LEVELS = { 'p': 0.1, 'mp': 0.25, 'mf': 0.42, 'f': 0.58, 'ff': 0.75, 'fff': 0.92 };

// ---- Three.js scene state (internal) ---------------------------------------

const canvas = document.getElementById('cube-canvas');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setPixelRatio(window.devicePixelRatio);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(40, 2, 0.1, 100);
// Initial cube view sits ~12.8 units from origin (vs the prior 6.4) so the
// performer doesn't have to scroll-zoom out on every connect. applyConnectView
// only rotates around the target, so this distance survives the connect-time
// orbit and the revertConnectView restore. fitCameraToAspect's min-distance
// (~5.4 at typical aspect) is well under this, so it won't pull us back in.
camera.position.set(8, 6, 8);
camera.lookAt(0, 0, 0);

// On cube connect, orbit the camera by this azimuth (around world Y) so the
// on-screen cube matches the performer's physical perspective. Empirically
// -135° = the user's "drag left 135°" gesture.
const CUBE_VIEW_AZIMUTH_RAD = -135 * Math.PI / 180;
const _pristineCameraPos = camera.position.clone();
let _cubeViewApplied = false;

// Wireframe cube
const edgeGeo = new THREE.BufferGeometry();
{
  const edgePositions = [];
  for (const [a, b] of CUBE_EDGES) {
    edgePositions.push(CUBE_VERTS[a].x, CUBE_VERTS[a].y, CUBE_VERTS[a].z);
    edgePositions.push(CUBE_VERTS[b].x, CUBE_VERTS[b].y, CUBE_VERTS[b].z);
  }
  edgeGeo.setAttribute('position', new THREE.Float32BufferAttribute(edgePositions, 3));
}
const edgeMat = new THREE.LineBasicMaterial({ color: 0x333355 });
const edgeLines = new THREE.LineSegments(edgeGeo, edgeMat);
scene.add(edgeLines);

function makeTetraLines(indices, color) {
  const geo = new THREE.BufferGeometry();
  const pos = [];
  for (let i = 0; i < indices.length; i++) {
    for (let j = i + 1; j < indices.length; j++) {
      const a = CUBE_VERTS[indices[i]], b = CUBE_VERTS[indices[j]];
      pos.push(a.x, a.y, a.z, b.x, b.y, b.z);
    }
  }
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  return new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.3 }));
}
const tetraALines = makeTetraLines(TETRA_A, 0x00ff88);
const tetraBLines = makeTetraLines(TETRA_B, 0xff6644);
scene.add(tetraALines);
scene.add(tetraBLines);

// Vertex spheres + labels
const vertexMeshes = [];
const vertexLabels = [];

// Active vertex glow ring — white so the pulse reads as "this is the
// active vertex right now" independent of whichever K-color the
// underlying sphere has. Pre-K-palette this used 0x00ff88 (matched
// tetra-A green); now that per-K colors differ from the active marker,
// white is the safest cross-palette choice.
const activeRingGeo = new THREE.RingGeometry(0.15, 0.22, 16);
const activeRingMat = new THREE.MeshBasicMaterial({
  color: 0xffffff,
  transparent: true,
  opacity: 0.7,
  side: THREE.DoubleSide,
});
const activeRing = new THREE.Mesh(activeRingGeo, activeRingMat);
activeRing.visible = false;

const topMarkerGeo = new THREE.SphereGeometry(0.035, 8, 8);
const liveTopMarkers = [];

// Ghost active vertex ring — mirrors activeRing but lives in ghostGroup so
// it follows the snap target's rotation. Slightly smaller radius because
// ghost vertex spheres are 0.05 (vs live's 0.06). Pulses out of phase
// with the live ring so the eye picks out which is which when both are
// near each other (locked snap, deviation ≈ 0).
const ghostActiveRingGeo = new THREE.RingGeometry(0.12, 0.18, 16);
const ghostActiveRingMat = new THREE.MeshBasicMaterial({
  color: 0xffffff,
  transparent: true,
  opacity: 0.7,
  side: THREE.DoubleSide,
});
const ghostActiveRing = new THREE.Mesh(ghostActiveRingGeo, ghostActiveRingMat);
ghostActiveRing.visible = false;
const ghostTopMarkers = [];

function makeLabel(text, color) {
  const c = document.createElement('canvas');
  c.width = 128; c.height = 80;
  const ctx = c.getContext('2d');
  ctx.font = 'bold 20px monospace';
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText(text, 64, 2);
  const tex = new THREE.CanvasTexture(c);
  const mat = new THREE.SpriteMaterial({ map: tex, depthTest: false });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(1.0, 0.625, 1);
  return { sprite, canvas: c, ctx, tex };
}

for (let i = 0; i < 8; i++) {
  const geo = new THREE.SphereGeometry(0.06, 8, 8);
  const mat = new THREE.MeshBasicMaterial({ color: K_VERT_COLORS[i] });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.copy(CUBE_VERTS[i]);
  scene.add(mesh);
  vertexMeshes.push(mesh);

  const label = makeLabel(`K${i + 1}`, K_VERT_COLORS_HEX[i]);
  label.sprite.position.copy(CUBE_VERTS[i]).addScaledVector(CUBE_VERTS[i].clone().normalize(), 0.55);
  scene.add(label.sprite);
  vertexLabels.push(label);
}

// Rotation group for gyro
const cubeGroup = new THREE.Group();
scene.add(cubeGroup);
cubeGroup.add(edgeLines, tetraALines, tetraBLines, activeRing);
for (let i = 0; i < 8; i++) {
  const marker = new THREE.Mesh(
    topMarkerGeo.clone(),
    new THREE.MeshBasicMaterial({
      color: 0xffcc00,
      transparent: true,
      opacity: 0,
      depthTest: false,
    })
  );
  marker.position.copy(CUBE_VERTS[i]).addScaledVector(CUBE_VERTS[i].clone().normalize(), 0.11);
  marker.renderOrder = 2;
  cubeGroup.add(marker);
  liveTopMarkers.push(marker);
}
vertexMeshes.forEach(m => cubeGroup.add(m));
vertexLabels.forEach(l => cubeGroup.add(l.sprite));

// Ghost cube — snapped S4 C-cube. It tracks state.snapQuat independently
// of phrase material locks. C identities are fixed to local slots in beta-cosmo
// for performer readability, but in alpha-cosmo they move to their reassigned
// slots as `state.cAssignments` advances.
const ghostGroup = new THREE.Group();
ghostGroup.visible = false;
scene.add(ghostGroup);

const ghostEdgeMat = new THREE.LineBasicMaterial({ color: 0x00ccff, transparent: true, opacity: 0.7 });
const ghostEdges = new THREE.LineSegments(edgeGeo.clone(), ghostEdgeMat);
ghostGroup.add(ghostEdges);
ghostGroup.add(ghostActiveRing);
for (let i = 0; i < 8; i++) {
  const marker = new THREE.Mesh(
    topMarkerGeo.clone(),
    new THREE.MeshBasicMaterial({
      color: 0xffcc00,
      transparent: true,
      opacity: 0,
      depthTest: false,
    })
  );
  marker.position.copy(CUBE_VERTS[i]).addScaledVector(CUBE_VERTS[i].clone().normalize(), 0.09);
  marker.renderOrder = 2;
  ghostGroup.add(marker);
  ghostTopMarkers.push(marker);
}

const ghostVertGeo = new THREE.SphereGeometry(0.05, 6, 6);
const ghostVertMeshes = [];
const ghostLabels = [];
for (let i = 0; i < 8; i++) {
  const mat = new THREE.MeshBasicMaterial({
    color: GHOST_VERT_COLORS[i], transparent: true, opacity: 0.8,
  });
  const m = new THREE.Mesh(ghostVertGeo.clone(), mat);
  m.position.copy(CUBE_VERTS[i]);
  ghostGroup.add(m);
  ghostVertMeshes.push(m);

  const label = makeLabel(`C${i + 1}`, GHOST_VERT_COLORS_HEX[i]);
  const ctx = label.ctx;
  ctx.clearRect(0, 0, 128, 80);
  ctx.font = 'bold 16px monospace';
  ctx.fillStyle = GHOST_VERT_COLORS_HEX[i];
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText(`C${i + 1}`, 64, 2);
  ctx.font = '12px monospace';
  ctx.fillStyle = GHOST_VERT_COLORS_DIM[i];
  ctx.fillText(COMPLEX_ABBR[i + 1] || '', 64, 22);
  label.tex.needsUpdate = true;
  label.sprite.position.copy(CUBE_VERTS[i]).addScaledVector(CUBE_VERTS[i].clone().normalize(), 0.45);
  label.sprite.scale.set(0.7, 0.44, 1);
  ghostGroup.add(label.sprite);
  ghostLabels.push(label);
}

// Face-signature glyph decals — one PlaneGeometry mesh pasted on each cube
// face (6 total), parented to ghostGroup so they rotate rigidly with the
// snapped ghost orientation. NOT billboarded: the glyph lies in the face's
// plane, sharing its outward normal. DoubleSide rendering means the same
// painted texture is visible from both sides of the cube — viewed from
// outside it reads correctly; viewed from the cube interior (i.e., looking
// at the opposite face's glyph through this face's transparent plane) it
// appears horizontally mirrored, which is the natural single-sided-texture-
// seen-from-behind effect. depthWrite is off so each plane's transparent
// pixels don't depth-occlude the others — all six glyphs render and alpha-
// composite, with back-of-cube glyphs visible through the alpha holes of
// front-of-cube ones.
//
// Per-face Euler rotation orients PlaneGeometry's default +Z surface normal
// to each face's outward normal:
//   F (+Z): identity
//   B (-Z): 180° around Y
//   R (+X): +90° around Y    L (-X): -90° around Y
//   U (+Y): -90° around X    D (-Y): +90° around X
// Canvas-up maps to world +Y for F/B/L/R and to world -Z for U/D (no world
// up/down on the top/bottom faces, so "back of cube" is the chosen
// convention so the glyph reads consistently from a typical orbit camera).
const FACE_GLYPH_SIZE = 256;          // canvas resolution (high-DPR friendly)
const FACE_GLYPH_PLANE = 0.6;         // plane edge length (cube face is 2×2; tiny decal centered on face)
const FACE_PLANE_EULER = {
  F: new THREE.Euler(0,            0,             0),
  B: new THREE.Euler(0,            Math.PI,       0),
  R: new THREE.Euler(0,            Math.PI / 2,   0),
  L: new THREE.Euler(0,           -Math.PI / 2,   0),
  U: new THREE.Euler(-Math.PI / 2, 0,             0),
  D: new THREE.Euler( Math.PI / 2, 0,             0),
};
const ghostFaceGlyphs = [];           // [{ face, mesh, mat, tex, canvas, ctx }]
const _faceGlyphGeo = new THREE.PlaneGeometry(FACE_GLYPH_PLANE, FACE_GLYPH_PLANE);
const _faceGlyphAxis = new THREE.Vector3(0, 0, 1);
const _faceTurnStates = {};          // face -> { turns: number, base: THREE.Quaternion, twist: THREE.Quaternion, mesh }
for (const face of FACES) {
  const c = document.createElement('canvas');
  c.width = FACE_GLYPH_SIZE;
  c.height = FACE_GLYPH_SIZE;
  const ctx = c.getContext('2d');
  paintFaceGlyph(ctx, face, { color: '#e0f4ff' });
  const tex = new THREE.CanvasTexture(c);
  tex.anisotropy = 4;
  const mat = new THREE.MeshBasicMaterial({
    map: tex,
    transparent: true,
    side: THREE.DoubleSide,
    depthWrite: false,
    opacity: 1.0,
  });
  const mesh = new THREE.Mesh(_faceGlyphGeo, mat);
  const n = FACE_GLYPH_NORMAL[face];
  mesh.position.set(n[0], n[1], n[2]);
  const baseRot = new THREE.Quaternion().setFromEuler(FACE_PLANE_EULER[face]);
  mesh.quaternion.copy(baseRot);
  _faceTurnStates[face] = {
    turns: 0,
    base: baseRot,
    twist: new THREE.Quaternion(),
    mesh,
  };
  mesh.renderOrder = 3;
  ghostGroup.add(mesh);
  ghostFaceGlyphs.push({ face, mesh, mat, tex, canvas: c, ctx });
}

// K↔C connection line.
const kcLineGeo = new THREE.BufferGeometry();
const kcLinePositions = new Float32Array(6);
kcLineGeo.setAttribute('position', new THREE.BufferAttribute(kcLinePositions, 3));
const kcLineMat = new THREE.LineBasicMaterial({
  color: 0xffffff,
  transparent: true,
  opacity: 0.7,
  depthTest: false,
});
const kcLine = new THREE.Line(kcLineGeo, kcLineMat);
kcLine.renderOrder = 1;
kcLine.visible = false;
kcLine.frustumCulled = false;
scene.add(kcLine);
const _kcKWorld = new THREE.Vector3();
const _kcCWorld = new THREE.Vector3();
const _kcTmpWorld = new THREE.Vector3();

// OrbitControls for camera mode
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.dampingFactor = 0.1;
controls.enablePan = false;
controls.minDistance = 3;
controls.maxDistance = 24;

// Per-cube view offsets (premultiplied onto the live/ghost rotation).
const liveViewOffset = new THREE.Quaternion(0, 0, 0, 1);
const ghostViewOffset = new THREE.Quaternion(0, 0, 0, 1);
let rotateTarget = 'camera'; // 'camera' | 'live' | 'ghost'

// ---- Rotation Gizmo --------------------------------------------------------

const gizmoCanvas = document.createElement('canvas');
gizmoCanvas.width = 200; gizmoCanvas.height = 200;
gizmoCanvas.style.cssText = 'touch-action:none;border-radius:50%;cursor:grab;';
const gizmoMount = document.getElementById('gizmo-wrap') || document.body;
gizmoMount.appendChild(gizmoCanvas);

const gizmoRenderer = new THREE.WebGLRenderer({ canvas: gizmoCanvas, antialias: true, alpha: true });
gizmoRenderer.setPixelRatio(window.devicePixelRatio);

function resizeGizmo() {
  const r = gizmoCanvas.getBoundingClientRect();
  if (r.width > 0 && r.height > 0) {
    gizmoRenderer.setSize(r.width, r.height, false);
  }
}
window.addEventListener('resize', resizeGizmo);
requestAnimationFrame(resizeGizmo);

const gizmoScene = new THREE.Scene();
const gizmoCamera = new THREE.OrthographicCamera(-2, 2, 2, -2, 0.1, 100);
gizmoCamera.position.set(3, 2.5, 3);
gizmoCamera.lookAt(0, 0, 0);

const GIZMO_COLORS = { x: 0xff4444, y: 0x44ff44, z: 0x4488ff };
const GIZMO_HIGHLIGHT = { x: 0xff8888, y: 0x88ff88, z: 0x88bbff };
const gizmoAxes = {
  x: new THREE.Vector3(1, 0, 0),
  y: new THREE.Vector3(0, 1, 0),
  z: new THREE.Vector3(0, 0, 1),
};
const gizmoRotations = {
  x: new THREE.Euler(0, Math.PI / 2, 0),
  y: new THREE.Euler(Math.PI / 2, 0, 0),
  z: new THREE.Euler(0, 0, 0),
};

const gizmoRings = {};
const gizmoHitRings = {};

for (const axis of ['x', 'y', 'z']) {
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(1.2, 0.04, 12, 64),
    new THREE.MeshBasicMaterial({ color: GIZMO_COLORS[axis], transparent: true, opacity: 0.85, depthTest: false })
  );
  ring.rotation.copy(gizmoRotations[axis]);
  ring.renderOrder = 999;
  ring.userData.axis = axis;
  gizmoScene.add(ring);
  gizmoRings[axis] = ring;

  const hitRing = new THREE.Mesh(
    new THREE.TorusGeometry(1.2, 0.18, 8, 48),
    new THREE.MeshBasicMaterial({ visible: false })
  );
  hitRing.rotation.copy(gizmoRotations[axis]);
  hitRing.userData.axis = axis;
  gizmoScene.add(hitRing);
  gizmoHitRings[axis] = hitRing;
}

for (const [axis, color] of Object.entries(GIZMO_COLORS)) {
  const pos = gizmoAxes[axis].clone().multiplyScalar(1.45);
  const dot = new THREE.Mesh(
    new THREE.SphereGeometry(0.09, 8, 8),
    new THREE.MeshBasicMaterial({ color, depthTest: false })
  );
  dot.position.copy(pos);
  dot.renderOrder = 1000;
  gizmoScene.add(dot);

  const c = document.createElement('canvas');
  c.width = 32; c.height = 32;
  const ctx = c.getContext('2d');
  ctx.font = 'bold 22px monospace';
  ctx.fillStyle = '#' + color.toString(16).padStart(6, '0');
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(axis.toUpperCase(), 16, 16);
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), depthTest: false }));
  sprite.position.copy(pos).addScaledVector(gizmoAxes[axis], 0.25);
  sprite.scale.set(0.35, 0.35, 1);
  sprite.renderOrder = 1001;
  gizmoScene.add(sprite);
}

const gizmoRaycaster = new THREE.Raycaster();
const gizmoPointer = new THREE.Vector2();
let gizmoDragging = false;
let gizmoActiveAxis = null;
let gizmoDragAngleStart = 0;

function getGizmoAngle(clientX, clientY) {
  const rect = gizmoCanvas.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  return Math.atan2(clientY - cy, clientX - cx);
}

function hitTestGizmo(clientX, clientY) {
  const rect = gizmoCanvas.getBoundingClientRect();
  gizmoPointer.x = ((clientX - rect.left) / rect.width) * 2 - 1;
  gizmoPointer.y = -((clientY - rect.top) / rect.height) * 2 + 1;
  gizmoRaycaster.setFromCamera(gizmoPointer, gizmoCamera);
  const hits = gizmoRaycaster.intersectObjects(Object.values(gizmoHitRings));
  return hits.length > 0 ? hits[0].object.userData.axis : null;
}

gizmoCanvas.addEventListener('pointerdown', (e) => {
  if (rotateTarget === 'camera') return;
  const axis = hitTestGizmo(e.clientX, e.clientY);
  if (!axis) return;
  e.stopPropagation();
  gizmoDragging = true;
  gizmoActiveAxis = axis;
  gizmoDragAngleStart = getGizmoAngle(e.clientX, e.clientY);
  gizmoCanvas.setPointerCapture(e.pointerId);
  for (const a of ['x', 'y', 'z']) {
    gizmoRings[a].material.color.setHex(a === axis ? GIZMO_HIGHLIGHT[a] : GIZMO_COLORS[a]);
    gizmoRings[a].material.opacity = a === axis ? 1.0 : 0.2;
  }
});

window.addEventListener('pointermove', (e) => {
  if (!gizmoDragging) {
    if (rotateTarget !== 'camera') {
      const rect = gizmoCanvas.getBoundingClientRect();
      const inside = e.clientX >= rect.left && e.clientX <= rect.right &&
                     e.clientY >= rect.top && e.clientY <= rect.bottom;
      if (inside) {
        const axis = hitTestGizmo(e.clientX, e.clientY);
        gizmoCanvas.style.cursor = axis ? 'grab' : 'default';
        for (const a of ['x', 'y', 'z']) {
          gizmoRings[a].material.opacity = (a === axis) ? 1.0 : 0.85;
        }
      }
    }
    return;
  }
  const angle = getGizmoAngle(e.clientX, e.clientY);
  let delta = angle - gizmoDragAngleStart;
  if (delta > Math.PI) delta -= 2 * Math.PI;
  if (delta < -Math.PI) delta += 2 * Math.PI;

  const camDir = gizmoCamera.position.clone().normalize();
  if (camDir.dot(gizmoAxes[gizmoActiveAxis]) < 0) delta = -delta;

  gizmoDragAngleStart = angle;
  const offset = (rotateTarget === 'live') ? liveViewOffset : ghostViewOffset;
  offset.premultiply(new THREE.Quaternion().setFromAxisAngle(gizmoAxes[gizmoActiveAxis], -delta));
});

const endGizmoDrag = (e) => {
  if (!gizmoDragging) return;
  gizmoDragging = false;
  gizmoActiveAxis = null;
  gizmoCanvas.style.cursor = 'grab';
  if (gizmoCanvas.hasPointerCapture(e.pointerId)) gizmoCanvas.releasePointerCapture(e.pointerId);
  for (const a of ['x', 'y', 'z']) {
    gizmoRings[a].material.color.setHex(GIZMO_COLORS[a]);
    gizmoRings[a].material.opacity = 0.85;
  }
};
window.addEventListener('pointerup', endGizmoDrag);
window.addEventListener('pointercancel', endGizmoDrag);

// ---- Mode toggle (rotate target buttons) -----------------------------------
const rotateCtrl = document.getElementById('rotate-ctrl');
rotateCtrl.querySelectorAll('.cr-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    rotateTarget = btn.dataset.target;
    rotateCtrl.querySelectorAll('.cr-btn').forEach(b => b.classList.toggle('active', b === btn));
    controls.enabled = (rotateTarget === 'camera');
    gizmoCanvas.style.opacity = (rotateTarget === 'camera') ? '0.3' : '1';
    gizmoCanvas.style.pointerEvents = (rotateTarget === 'camera') ? 'none' : 'auto';
  });
});
rotateCtrl.querySelector('.cr-reset').addEventListener('click', () => {
  if (rotateTarget === 'live') liveViewOffset.identity();
  else if (rotateTarget === 'ghost') ghostViewOffset.identity();
  else controls.reset();
});
gizmoCanvas.style.opacity = '0.3';
gizmoCanvas.style.pointerEvents = 'none';

// ---- Animation state -------------------------------------------------------

let idleAngle = 0;
const currentGyro = new THREE.Quaternion(0, 0, 0, 1);
let hasGyro = false;
let hasSnap = false;
let currentActiveVertex = 0;

// Beta-cosmo ghost SLERP-snap. Ghost glides toward the engine's snapQuat
// (the discrete S4-snapped orientation). Live cube stays on raw gyro; the
// visible angle between live and ghost shows how close to the next snap cell.
const snapTarget = new THREE.Quaternion(0, 0, 0, 1);
const ghostQuatTarget = new THREE.Quaternion();
let hasSnapTarget = false;
const GHOST_SLERP_RATE = 0.18;  // per-frame; ~3 frames to noticeable arrival

const ACTIVE_STEP_MS = 100;
const sphereScaleFrom = new Float32Array(8).fill(1.0);
const activeRingFrom = new THREE.Vector3();
const activeRingAnimated = new THREE.Vector3();
let activeAnimStart = 0;
let activeAnimReady = false;
let currentActiveK = 0;

// Mirror of the K active-vertex animation state for the ghost cube. In
// beta-cosmo, the active C is the fixed local slot under the active K corner;
// alpha-cosmo can still highlight whichever C type the S4 assignment table
// places there. Scale target is 2.0 (vs 2.5 for K) because ghost spheres are
// smaller and slightly translucent.
const cSphereScaleFrom = new Float32Array(8).fill(1.0);
const ghostActiveRingFrom = new THREE.Vector3();
const ghostActiveRingAnimated = new THREE.Vector3();
let cActiveAnimStart = 0;
let cActiveAnimReady = false;
let currentActiveC = 0;

const VERTEX_STEP_MS = 100;
const LABEL_OFFSET_FACTOR = 1 + 0.55 / Math.sqrt(3);
const vertexPosFrom     = Array.from({ length: 8 }, (_, i) => CUBE_VERTS[i].clone());
const vertexPosTarget   = Array.from({ length: 8 }, (_, i) => CUBE_VERTS[i].clone());
const vertexPosAnimated = Array.from({ length: 8 }, (_, i) => CUBE_VERTS[i].clone());
let vertexAnimStart = 0;
let vertexAnimReady = false;
let lastPermKey = '';

const GHOST_LABEL_OFFSET_FACTOR = 1 + 0.45 / Math.sqrt(3);
const GHOST_VERT_STEP_MS = 100;
const ghostVertPosFrom     = Array.from({ length: 8 }, (_, i) => CUBE_VERTS[i].clone());
const ghostVertPosTarget   = Array.from({ length: 8 }, (_, i) => CUBE_VERTS[i].clone());
const ghostVertPosAnimated = Array.from({ length: 8 }, (_, i) => CUBE_VERTS[i].clone());
let ghostVertAnimStart = 0;
let ghostVertAnimReady = false;
let lastCAssignKey = '__init__';
let lastCAssignCosmology = 'beta-cosmo';

// Gyro zero calibration
const gyroZeroInv = new THREE.Quaternion(0, 0, 0, 1);

// Decouples on-screen orientation from however the cube is physically held
// at connect time. Set by applyConnectView; consumed by setCubeQuat on the
// first sample which adopts it as the zero and fires the onAutoZero callback
// (main.js wires it to transport.send({type:'zero_gyro'}) so the engine's
// snap cells re-center on the same rest pose).
let autoZeroPending = false;
let _onAutoZero = null;

// ---- Camera fit + resize ---------------------------------------------------

const FIT_RADIUS = 1.95;
function fitCameraToAspect(aspect) {
  const halfFov = camera.fov * Math.PI / 360;
  const tanHalf = Math.tan(halfFov);
  const distV = FIT_RADIUS / tanHalf;
  const distH = FIT_RADIUS / (tanHalf * aspect);
  const minDist = Math.max(distV, distH);
  const cur = camera.position.length();
  if (cur < minDist - 0.01) {
    camera.position.normalize().multiplyScalar(minDist);
    if (controls) controls.update();
  }
}

function resizeCube() {
  const rect = canvas.getBoundingClientRect();
  if (rect.width <= 0 || rect.height <= 0) return;
  renderer.setSize(rect.width, rect.height, false);
  const aspect = rect.width / rect.height;
  camera.aspect = aspect;
  camera.updateProjectionMatrix();
  fitCameraToAspect(aspect);
}
resizeCube();
requestAnimationFrame(resizeCube);
window.addEventListener('resize', resizeCube);

// ---- Per-frame animation loop ----------------------------------------------

const calibratedGyro = new THREE.Quaternion();
let ringPulse = 0;

function animateCube() {
  requestAnimationFrame(animateCube);
  controls.update();
  if (hasGyro) {
    calibratedGyro.copy(gyroZeroInv).multiply(currentGyro);
  } else {
    idleAngle += 0.003;
    calibratedGyro.setFromEuler(new THREE.Euler(0.3, idleAngle, 0.15));
  }
  cubeGroup.quaternion.copy(liveViewOffset).multiply(calibratedGyro);

  if (hasSnap) {
    ghostGroup.visible = true;
    // Ghost cube SLERPs toward the gyro-snapped S4 orientation
    // (state.snapQuat from the engine). C identities stay fixed in the
    // ghost's local slots, so a face turn cannot create a second ghost
    // rotation after the live pose has already snapped. The live cube
    // continues to render raw gyro (no snap), so the visible deviation
    // between live and ghost is the gyroDeviation expression source.
    if (hasSnapTarget) {
      ghostQuatTarget.copy(ghostViewOffset).multiply(snapTarget);
      ghostGroup.quaternion.slerp(ghostQuatTarget, GHOST_SLERP_RATE);
    } else {
      ghostGroup.quaternion.copy(ghostViewOffset);
    }
  } else {
    ghostGroup.visible = false;
  }

  if (activeAnimReady) {
    const elapsed = performance.now() - activeAnimStart;
    const t = elapsed >= ACTIVE_STEP_MS ? 1 : elapsed / ACTIVE_STEP_MS;
    for (let k = 0; k < 8; k++) {
      const target = (k === currentActiveK) ? 2.5 : 1.0;
      const s = sphereScaleFrom[k] + (target - sphereScaleFrom[k]) * t;
      vertexMeshes[k].scale.setScalar(s);
    }
    activeRingAnimated.copy(activeRingFrom).lerp(CUBE_VERTS[currentActiveVertex], t);
    activeRing.position.copy(activeRingAnimated);
    activeRing.lookAt(camera.position);
  }

  if (vertexAnimReady) {
    const elapsed = performance.now() - vertexAnimStart;
    const t = elapsed >= VERTEX_STEP_MS ? 1 : elapsed / VERTEX_STEP_MS;
    for (let k = 0; k < 8; k++) {
      vertexPosAnimated[k].copy(vertexPosFrom[k]).lerp(vertexPosTarget[k], t);
      vertexMeshes[k].position.copy(vertexPosAnimated[k]);
      vertexLabels[k].sprite.position.copy(vertexPosAnimated[k]).multiplyScalar(LABEL_OFFSET_FACTOR);
    }
  }

  // C identity geometry can move in alpha-cosmo (so the C identities
  // perform the S4 walk), but stays fixed by local slot in beta.
  if (ghostVertAnimReady) {
    const elapsed = performance.now() - ghostVertAnimStart;
    const t = elapsed >= GHOST_VERT_STEP_MS ? 1 : elapsed / GHOST_VERT_STEP_MS;
    for (let c = 0; c < 8; c++) {
      ghostVertPosAnimated[c].copy(ghostVertPosFrom[c]).lerp(ghostVertPosTarget[c], t);
      ghostVertMeshes[c].position.copy(ghostVertPosAnimated[c]);
      ghostLabels[c].sprite.position.copy(ghostVertPosAnimated[c]).multiplyScalar(GHOST_LABEL_OFFSET_FACTOR);
    }
  }

  // Ghost active vertex scale + ring (mirror of the K active-vertex
  // animation block above). Ring tracks the assigned active C identity, so
  // phrase selection can highlight it even when C identities move in
  // alpha-cosmo.
  if (cActiveAnimReady) {
    const elapsed = performance.now() - cActiveAnimStart;
    const t = elapsed >= ACTIVE_STEP_MS ? 1 : elapsed / ACTIVE_STEP_MS;
    for (let c = 0; c < 8; c++) {
      const target = (c === currentActiveC) ? 2.0 : 1.0;
      const s = cSphereScaleFrom[c] + (target - cSphereScaleFrom[c]) * t;
      ghostVertMeshes[c].scale.setScalar(s);
    }
    const targetPos = ghostVertPosTarget[currentActiveC] || CUBE_VERTS[currentActiveC];
    ghostActiveRingAnimated.copy(ghostActiveRingFrom).lerp(targetPos, t);
    ghostActiveRing.position.copy(ghostActiveRingAnimated);
    ghostActiveRing.lookAt(camera.position);
  }

  ringPulse += 0.04;
  if (activeRing.visible) {
    activeRingMat.opacity = 0.4 + 0.3 * Math.sin(ringPulse);
  }
  if (ghostActiveRing.visible) {
    // Out-of-phase pulse so the live and ghost rings don't beat in sync
    // when the snap is locked (deviation ≈ 0 → both rings co-located).
    ghostActiveRingMat.opacity = 0.4 + 0.3 * Math.sin(ringPulse + Math.PI);
  }

  if (hasGyro && hasSnap) {
    cubeGroup.updateMatrixWorld(true);
    ghostGroup.updateMatrixWorld(true);
    vertexMeshes[currentActiveK].getWorldPosition(_kcKWorld);
    let bestDist2 = Infinity;
    for (let c = 0; c < 8; c++) {
      ghostVertMeshes[c].getWorldPosition(_kcTmpWorld);
      const d2 = _kcKWorld.distanceToSquared(_kcTmpWorld);
      if (d2 < bestDist2) {
        bestDist2 = d2;
        _kcCWorld.copy(_kcTmpWorld);
      }
    }
    kcLinePositions[0] = _kcKWorld.x;
    kcLinePositions[1] = _kcKWorld.y;
    kcLinePositions[2] = _kcKWorld.z;
    kcLinePositions[3] = _kcCWorld.x;
    kcLinePositions[4] = _kcCWorld.y;
    kcLinePositions[5] = _kcCWorld.z;
    kcLineGeo.attributes.position.needsUpdate = true;
    kcLine.visible = true;
  } else {
    kcLine.visible = false;
  }

  renderer.render(scene, camera);
  gizmoRenderer.render(gizmoScene, gizmoCamera);
}
animateCube();

// ---- Internal label paint helpers ------------------------------------------

function applyFaceTurnGlyphRotation(move) {
  if (typeof move !== 'string' || move.length < 1) return;
  const face = move[0];
  const state = _faceTurnStates[face];
  if (!state) return;

  const isPrime = move.includes("'");
  const isHalf = move.includes('2');
  let turns = isHalf ? 2 : 1;
  if (isPrime) turns = -turns;
  state.turns = (state.turns + turns) % 4;
  if (state.turns < 0) state.turns += 4;
  state.twist.setFromAxisAngle(_faceGlyphAxis, state.turns * Math.PI * 0.5);
  state.mesh.quaternion.copy(state.base).multiply(state.twist);
}

function paintActiveVertex(slot, activeK) {
  if (!activeAnimReady) {
    for (let k = 0; k < 8; k++) {
      const s = (k === activeK) ? 2.5 : 1.0;
      sphereScaleFrom[k] = s;
      vertexMeshes[k].scale.setScalar(s);
    }
    activeRingFrom.copy(CUBE_VERTS[slot]);
    activeRingAnimated.copy(CUBE_VERTS[slot]);
    activeAnimStart = performance.now() - ACTIVE_STEP_MS;
    activeAnimReady = true;
    activeRing.visible = true;
    currentActiveVertex = slot;
    currentActiveK = activeK;
  } else if (slot !== currentActiveVertex || activeK !== currentActiveK) {
    for (let k = 0; k < 8; k++) {
      sphereScaleFrom[k] = vertexMeshes[k].scale.x;
    }
    activeRingFrom.copy(activeRingAnimated);
    activeAnimStart = performance.now();
    currentActiveVertex = slot;
    currentActiveK = activeK;
  }
}

function paintActiveGhostVertex(activeC) {
  const activePos = ghostVertPosTarget[activeC] || CUBE_VERTS[activeC];
  if (!cActiveAnimReady) {
    for (let c = 0; c < 8; c++) {
      const s = (c === activeC) ? 2.0 : 1.0;
      cSphereScaleFrom[c] = s;
      ghostVertMeshes[c].scale.setScalar(s);
    }
    ghostActiveRingFrom.copy(activePos);
    ghostActiveRingAnimated.copy(activePos);
    cActiveAnimStart = performance.now() - ACTIVE_STEP_MS;
    cActiveAnimReady = true;
    ghostActiveRing.visible = true;
    currentActiveC = activeC;
  } else if (activeC !== currentActiveC) {
    for (let c = 0; c < 8; c++) {
      cSphereScaleFrom[c] = ghostVertMeshes[c].scale.x;
    }
    ghostActiveRingFrom.copy(ghostActiveRingAnimated);
    cActiveAnimStart = performance.now();
    currentActiveC = activeC;
  }
}

function paintTopMarkers(upFaceName, activeSlot) {
  const topSlots = new Set(FACE_CORNERS[upFaceName] || []);
  for (let i = 0; i < 8; i++) {
    const isTop = topSlots.has(i);
    const isActive = i === activeSlot;
    const liveMarker = liveTopMarkers[i];
    liveMarker.visible = isTop;
    liveMarker.material.opacity = isTop ? (isActive ? 0.85 : 0.32) : 0;
    liveMarker.scale.setScalar(isTop && isActive ? 1.6 : 1.0);

    const ghostMarker = ghostTopMarkers[i];
    ghostMarker.visible = isTop;
    ghostMarker.material.opacity = isTop ? 0.32 : 0;
    ghostMarker.scale.setScalar(1.0);
  }
}

function paintGhostVertexLabels(activeC) {
  for (let c = 0; c < 8; c++) {
    const isActive = c === activeC;
    const color    = isActive ? '#ffffff' : GHOST_VERT_COLORS_HEX[c];
    const dimColor = isActive ? '#cccccc' : GHOST_VERT_COLORS_DIM[c];
    const label = ghostLabels[c];
    const ctx = label.ctx;
    ctx.clearRect(0, 0, 128, 80);
    ctx.font = 'bold 16px monospace';
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(`C${c + 1}`, 64, 2);
    ctx.font = '12px monospace';
    ctx.fillStyle = dimColor;
    ctx.fillText(COMPLEX_ABBR[c + 1] || '', 64, 22);
    label.tex.needsUpdate = true;
  }
}

function applyGhostCAssignmentMove(cAssignments, cosmology) {
  const nextKey = cosmology === 'alpha-cosmo' ? cAssignments.join(',') : '__beta__';
  if (lastCAssignKey === nextKey && lastCAssignCosmology === cosmology) return;

  if (cosmology !== 'alpha-cosmo') {
    for (let c = 0; c < 8; c++) {
      ghostVertPosFrom[c].copy(CUBE_VERTS[c]);
      ghostVertPosTarget[c].copy(CUBE_VERTS[c]);
      ghostVertPosAnimated[c].copy(CUBE_VERTS[c]);
      ghostLabels[c].sprite.position.copy(CUBE_VERTS[c]).multiplyScalar(GHOST_LABEL_OFFSET_FACTOR);
      ghostVertMeshes[c].position.copy(CUBE_VERTS[c]);
    }
    ghostVertAnimStart = performance.now() - GHOST_VERT_STEP_MS;
    ghostVertAnimReady = true;
    lastCAssignKey = nextKey;
    lastCAssignCosmology = cosmology;
    return;
  }

  const slotOfC = new Array(8);
  for (let slot = 0; slot < 8; slot++) {
    const cIdx = cAssignments[slot];
    if (typeof cIdx === 'number' && cIdx >= 1 && cIdx <= 8) {
      slotOfC[cIdx - 1] = slot;
    }
  }

  if (!ghostVertAnimReady) {
    for (let c = 0; c < 8; c++) {
      const slot = slotOfC[c];
      const target = slot === undefined ? CUBE_VERTS[c] : CUBE_VERTS[slot];
      ghostVertPosFrom[c].copy(target);
      ghostVertPosTarget[c].copy(target);
      ghostVertPosAnimated[c].copy(target);
      ghostVertMeshes[c].position.copy(target);
      ghostLabels[c].sprite.position.copy(target).multiplyScalar(GHOST_LABEL_OFFSET_FACTOR);
    }
    ghostVertAnimStart = performance.now() - GHOST_VERT_STEP_MS;
    ghostVertAnimReady = true;
  } else {
    for (let c = 0; c < 8; c++) {
      const slot = slotOfC[c];
      const target = slot === undefined ? CUBE_VERTS[c] : CUBE_VERTS[slot];
      ghostVertPosFrom[c].copy(ghostVertPosAnimated[c]);
      ghostVertPosTarget[c].copy(target);
    }
    ghostVertAnimStart = performance.now();
    ghostVertAnimReady = true;
  }

  lastCAssignKey = nextKey;
  lastCAssignCosmology = cosmology;
}

function paintVertexLabels(perm, vertices, complexTypes, activeIdx) {
  // Labels are identity-bound: label k always reads "K{k+1}".
  const activeK = perm ? perm[activeIdx] : activeIdx;
  for (let k = 0; k < 8; k++) {
    const slot = perm ? perm.indexOf(k) : k;
    const isActive = k === activeK;
    const color    = isActive ? '#ffffff' : K_VERT_COLORS_HEX[k];
    const dimColor = isActive ? '#cccccc' : K_VERT_COLORS_DIM[k];
    const label = vertexLabels[k];
    const ctx = label.ctx;
    const W = 128, H = 80;
    ctx.clearRect(0, 0, W, H);

    ctx.font = 'bold 18px monospace';
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(`K${k + 1}`, W / 2, 2);

    if (vertices && _vertexInfoVisible) {
      const v = vertices[slot];
      ctx.font = '14px monospace';
      ctx.fillStyle = dimColor;
      ctx.fillText(`${v.intensity} d${v.density.toFixed(1)}`, W / 2, 24);
      ctx.fillText(`${v.duration}s`, W / 2, 42);
    }

    label.tex.needsUpdate = true;
  }
}

// ---- Public API ------------------------------------------------------------

/**
 * Wire callbacks. Currently `onAutoZero` only — fired exactly once when a
 * connect-view-armed gyro zero gets captured, so main.js can mirror the
 * zero to the relay in the same flow as the manual Zero button.
 */
export function init({ onAutoZero } = {}) {
  _onAutoZero = onAutoZero || null;
}

/**
 * Apply the cube-connect azimuth orbit. Called when the BLE cube connects.
 * Idempotent: a second call does nothing. Also arms autoZeroPending so the
 * next gyro tick adopts the cube's current physical orientation as the zero.
 */
export function applyConnectView() {
  if (_cubeViewApplied) return;
  const q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), CUBE_VIEW_AZIMUTH_RAD);
  const offset = camera.position.clone().sub(controls.target);
  offset.applyQuaternion(q);
  camera.position.copy(controls.target).add(offset);
  camera.lookAt(controls.target);
  controls.update();
  _cubeViewApplied = true;
  autoZeroPending = true;
  assertCubeAlignment();
}

// CUBE ALIGN invariant — the canonical-pose assumption baked in here is
// "user holds the cube with red-front, white-top at connect time." If a
// different pose ever becomes canonical, change the GAN-letter column in
// `expected[]` AND the corresponding GAN→engine remap in `relay.js`.
//
// MIRROR: `CANONICAL_REMAP` MUST track `relay.js` MOVE_REMAP. Drift between
// the two is exactly what `[CUBE ALIGN FAIL]` is designed to catch.
const CANONICAL_REMAP = { R: 'L', L: 'R', F: 'B', B: 'F', U: 'U', D: 'D' };

/**
 * Geometric assertion: the chain
 *   physical face twist → GAN factory letter → CANONICAL_REMAP →
 *   engine letter → CUBE_VERTS face → camera projection
 * lands each engine perm-face on the screen side the user expects.
 * Run once at end of applyConnectView (camera at post-orbit pose,
 * cube_group identity at calibration). FAILs loudly if any link drifts.
 */
function assertCubeAlignment() {
  camera.updateMatrixWorld();
  const camRight = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion);
  const camUp    = new THREE.Vector3(0, 1, 0).applyQuaternion(camera.quaternion);
  const camBack  = new THREE.Vector3(0, 0, 1).applyQuaternion(camera.quaternion);

  // What GAN reports per Test B (empirically confirmed) for each user-physical
  // face twist in canonical pose, plus the screen direction the user expects
  // to see animate.
  const expected = [
    { phys: 'right (blue)',  gan: 'B', axis: camRight, sign: +1, name: 'screen-right' },
    { phys: 'left (green)',  gan: 'F', axis: camRight, sign: -1, name: 'screen-left'  },
    { phys: 'top (white)',   gan: 'U', axis: camUp,    sign: +1, name: 'screen-top'   },
    { phys: 'bot (yellow)',  gan: 'D', axis: camUp,    sign: -1, name: 'screen-bot'   },
    { phys: 'front (red)',   gan: 'R', axis: camBack,  sign: +1, name: 'screen-front (camera-near)' },
    { phys: 'back (orange)', gan: 'L', axis: camBack,  sign: -1, name: 'screen-back (camera-far)'   },
  ];

  // Engine letter → CUBE_VERTS face predicate. Mirrors corner-topology.ts
  // CORNER_MOVE_PERMS convention (R = +X, U = +Y, F = +Z).
  const enginePred = {
    R: v => v.x > 0, L: v => v.x < 0,
    U: v => v.y > 0, D: v => v.y < 0,
    F: v => v.z > 0, B: v => v.z < 0,
  };

  const fails = [];
  for (const e of expected) {
    const eng = CANONICAL_REMAP[e.gan];
    const pred = enginePred[eng];
    const c = new THREE.Vector3(0, 0, 0);
    let n = 0;
    for (const v of CUBE_VERTS) {
      if (pred(v)) { c.add(v); n++; }
    }
    c.divideScalar(n);
    const proj = c.dot(e.axis);
    const wantSign = e.sign > 0 ? '+' : '-';
    if (proj * e.sign <= 0.3) {
      fails.push(`physical ${e.phys} → GAN '${e.gan}' → engine '${eng}' → centroid·axis=${proj.toFixed(2)} (expected ${wantSign} for ${e.name})`);
    }
  }

  if (fails.length > 0) {
    console.error(
      '[CUBE ALIGN FAIL] face-turn animations land on wrong screen sides ' +
      '(canonical pose red-front white-top assumed; check relay MOVE_REMAP and cube-scene CANONICAL_REMAP):\n  ' +
      fails.join('\n  ')
    );
  } else {
    console.log('[CUBE ALIGN OK] all 6 face turns animate the user-expected screen face');
  }
}

/** Revert the cube-connect orbit (called on BLE disconnect). */
export function revertConnectView() {
  if (!_cubeViewApplied) return;
  camera.position.copy(_pristineCameraPos);
  camera.lookAt(controls.target);
  controls.update();
  _cubeViewApplied = false;
}

/**
 * Capture the live cube's current pose as the zero reference. Equivalent to
 * the user pressing the Zero button. Caller (main.js) is responsible for
 * also mirroring the zero to the relay via WS so the engine's snap cells
 * re-center on the same rest pose.
 */
export function zeroGyro() {
  gyroZeroInv.copy(currentGyro).invert();
}

/**
 * Consume a 60 Hz gyro tick. `quat` is a [x, y, z, w] array (relay's
 * Kalman-filtered Three.js-friendly form). Internally re-maps axes to
 * the cube-canvas frame: (-x, z, y, w).
 */
export function setCubeQuat(quat) {
  if (!quat) return;
  const [x, y, z, w] = quat;
  currentGyro.set(-x, z, y, w);
  hasGyro = true;
  if (autoZeroPending) {
    gyroZeroInv.copy(currentGyro).invert();
    autoZeroPending = false;
    if (_onAutoZero) _onAutoZero();
  }
}

/**
 * Apply a full state update from the engine. Reads:
 *   state.activeVertex, state.kPermutation, state.kVertices,
 *   state.cAssignments, state.snapElement, state.snapQuat, state.upFace,
 *   state.tetraIndex
 * Drives K-cube geometry / labels / animations, ghost active highlight,
 * top-face markers, and tetra-line opacity. In beta-cosmo ghost C geometry
 * is fixed in local slots; in alpha-cosmo C identities walk to new slots
 * whenever `state.cAssignments` changes.
 */
export function update(state, move) {
  const activeIdx = state.activeVertex ?? 0;
  const activeKIdx = state.kPermutation ? state.kPermutation[activeIdx] : activeIdx;

  applyFaceTurnGlyphRotation(move);

  if (typeof state.tetraIndex === 'number') {
    tetraALines.material.opacity = state.tetraIndex === 0 ? 0.6 : 0.15;
    tetraBLines.material.opacity = state.tetraIndex === 1 ? 0.6 : 0.15;
  }

  // Vertex-position animation: meshes/labels are identity-bound.
  if (state.kPermutation) {
    const permKey = state.kPermutation.join(',');
    if (permKey !== lastPermKey) {
      const slotOfK = new Array(8);
      for (let i = 0; i < 8; i++) slotOfK[state.kPermutation[i]] = i;
      if (!vertexAnimReady) {
        for (let k = 0; k < 8; k++) {
          vertexPosFrom[k].copy(CUBE_VERTS[slotOfK[k]]);
          vertexPosTarget[k].copy(CUBE_VERTS[slotOfK[k]]);
          vertexPosAnimated[k].copy(CUBE_VERTS[slotOfK[k]]);
        }
        vertexAnimStart = performance.now() - VERTEX_STEP_MS;
        vertexAnimReady = true;
      } else {
        for (let k = 0; k < 8; k++) {
          vertexPosFrom[k].copy(vertexPosAnimated[k]);
          vertexPosTarget[k].copy(CUBE_VERTS[slotOfK[k]]);
        }
        vertexAnimStart = performance.now();
      }
      lastPermKey = permKey;
    }
  }

  paintVertexLabels(
    state.kPermutation,
    state.kVertices || null,
    state.cAssignments || null,
    activeIdx
  );
  paintActiveVertex(activeIdx, activeKIdx);
  paintTopMarkers(state.upFace, activeIdx);

  // C assignment drives alpha-cosmo walk visuals; beta-cosmo keeps local
  // identity-label coupling to avoid face-turn mismatch with the active K label.
  if (state.cAssignments) {
    const activeCType = resolveActiveGhostC(state, activeIdx);
    if (activeCType >= 0 && activeCType < 8) {
      paintActiveGhostVertex(activeCType);
      paintGhostVertexLabels(activeCType);
    }
    applyGhostCAssignmentMove(state.cAssignments, state.cosmology);
    if (state.cosmology === 'beta-cosmo') {
      assertGhostStaticLocalGeometry();
    }
  }

  if (state.snapElement != null) {
    hasSnap = true;
  }
  // Ghost orientation is always the live snap target, never cQuat. cQuat can
  // be phrase-locked so material selection remains stable while notes draw;
  // using it here would visually freeze the ghost during the phrase.
  if (state.snapQuat && state.snapQuat.length === 4) {
    snapTarget.set(state.snapQuat[0], state.snapQuat[1], state.snapQuat[2], state.snapQuat[3]);
    hasSnapTarget = true;
    assertGhostSnapSource(state);
  }
}

function resolveActiveGhostC(state, activeIdx) {
  const assigned = state.cAssignments ? ((state.cAssignments[activeIdx] | 0) - 1) : activeIdx;
  if (state.cosmology === 'beta-cosmo') {
    if (assigned >= 0 && assigned < 8 && assigned !== activeIdx) {
      console.error(
        `[GHOST ACTIVE SLOT FAIL] beta-cosmo active C assignment C${assigned + 1} ` +
        `does not match active local slot C${activeIdx + 1}; ` +
        'fixed ghost labels, active card, and voice complex must share the same corner'
      );
    }
    return activeIdx;
  }
  return assigned;
}

function assertGhostSnapSource(state) {
  const q = state.snapQuat;
  const dot = Math.abs(
    snapTarget.x * q[0] +
    snapTarget.y * q[1] +
    snapTarget.z * q[2] +
    snapTarget.w * q[3]
  );
  const drift = 1 - Math.min(1, dot);
  if (drift > 1e-6) {
    console.error(
      '[GHOST SNAP FAIL] ghost target is not state.snapQuat; ' +
      'check cube-scene.js update() for accidental cQuat/phrase-lock coupling'
    );
  }
}

function assertGhostStaticLocalGeometry() {
  for (let c = 0; c < 8; c++) {
    const meshDrift = ghostVertMeshes[c].position.distanceToSquared(CUBE_VERTS[c]);
    const labelTarget = CUBE_VERTS[c].clone().multiplyScalar(GHOST_LABEL_OFFSET_FACTOR);
    const labelDrift = ghostLabels[c].sprite.position.distanceToSquared(labelTarget);
    if (meshDrift > 1e-8 || labelDrift > 1e-8) {
      console.error(
        '[GHOST TURN LEAK FAIL] ghost C geometry changed during state update; ' +
        'face turns must not move ghost vertices or labels'
      );
      return;
    }
  }
}

/** Slider-driven uniform ghost-cube scale (centered at origin). */
export function setGhostScale(s) {
  ghostGroup.scale.setScalar(s);
}

/** Shift both live + ghost cube groups along world Z. */
export function setCubeDepthOffset(z) {
  cubeGroup.position.z = z;
  ghostGroup.position.z = z;
}

// Toggled by setVertexInfoVisible(); paintVertexLabels() reads it each frame
// to suppress the intensity / density / duration lines while keeping K# visible.
let _vertexInfoVisible = true;

/** Show / hide the per-vertex info lines (intensity / density / duration). K# stays. */
export function setVertexInfoVisible(visible) {
  _vertexInfoVisible = visible;
}

/** Write the active K-vertex's world position into `out` (Vector3). */
export function getActiveKWorldPos(out) {
  cubeGroup.updateMatrixWorld(true);
  vertexMeshes[currentActiveK].getWorldPosition(out);
  return out;
}

/** Write the c-th ghost C-vertex's world position into `out`. c ∈ [0, 7]. */
export function getCWorldPos(c, out) {
  ghostGroup.updateMatrixWorld(true);
  ghostVertMeshes[c].getWorldPosition(out);
  return out;
}

/** Read-only access to the perspective camera (used by triangle's projection). */
export function getCamera() { return camera; }
