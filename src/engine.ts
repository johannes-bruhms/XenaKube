// === XenaKube Engine: Central Orchestrator ===
//
// Receives cube turns and gyro updates, maintains the performer-visible
// corner topology, computes composition state, and emits state/voice events.

import type {
  GroupElement, MoveString, Quaternion,
  XenaKubeState, EngineMode, Permutation8,
} from './types.js';
import { parseMoveToElement, IDENTITY, tetraOrbit, multiply, getPermutation } from './group.js';
import { getBaseVertices, permuteVertexSet } from './vertices.js';
import { ComplexCube } from './complexes.js';
import { DiagramTraversal, getBuiltinDiagrams, type KinematicDiagram } from './kinematic.js';
import { SieveState } from './sieve.js';
import { snapToNearest, distanceToNearest, getQuaternion } from './quaternion.js';
import { CubeAlgorithmDetector, type CubeAlgorithmMatch } from './cube-algorithm.js';
import { scrambleFactor } from './scramble.js';
import { IDENTITY_CORNER_PERM, applyCornerMove } from './corner-topology.js';
import { VoiceEngine, type VoiceOutput } from './voice-engine.js';
import { ExpressionProcessor, type ExpressionState } from './expression.js';
import { ModeManager } from './mode-manager.js';
import { TurnRateTracker } from './turn-rate.js';
import { parseFace, getFaceSignature } from './face-gesture.js';
import { topRightCorner, upFace, type Face } from './orientation.js';
import { MotionTracker } from './motion.js';

export type StateListener = (state: XenaKubeState) => void;
export type CubeAlgorithmListener = (match: CubeAlgorithmMatch) => void;
export type VoiceListener = (output: VoiceOutput) => void;
export type SolveListener = () => void;

const C_SHIFT = parseMoveToElement('U') ?? IDENTITY;

export class XenaKubeEngine {
  // K S4 element. In alpha-cosmo this is the live K_i walk; in beta-cosmo it
  // mirrors the gyro-snapped orientation shadow for dashboard/tetra metadata.
  private kGroup: GroupElement = IDENTITY;

  // Gyro-snapped orientation kept separate so alpha-cosmo gyro updates cannot
  // overwrite the Xenakis walk state.
  private orientationGroup: GroupElement = IDENTITY;

  // Performer-visible K_i topology: position i contains K corner perm[i].
  // Physical face turns are the only source of mutation in beta-cosmo.
  private cornerPermutation: Permutation8 = [...IDENTITY_CORNER_PERM] as Permutation8;

  // C_i state keeps the alpha/beta/gamma phase and the optional S4 walk.
  private complexCube = new ComplexCube();

  // Kinematic diagrams drive S4 walks in alpha-cosmo and remain shadow paths
  // in beta-cosmo.
  private kDiagram: DiagramTraversal | null = null;
  private kDiagramName: string | null = null;
  private cDiagram: DiagramTraversal | null = null;

  private sieve = new SieveState();

  private mode: EngineMode = {
    cosmology: 'beta-cosmo',
    kCube: 'direct',
    cCube: 'algorithmic',
  };

  private step = 0;
  private gyro: Quaternion = [0, 0, 0, 1];
  private substitutionCount = 0;
  private activeVertex = 0;
  private trackedK = 0;
  private lastTurnedFace: Face | null = null;
  // Phrase-lock window: while Date.now() < voiceLockUntilMs, the current
  // (K, C) at activeVertex stays frozen — gyro tilt cannot drift the
  // read-head or rotate the C-assignments mid-phrase. Set on every onTurn
  // to (now + estimated phrase duration). The next turn naturally resets it
  // for the new phrase, so "interruption" is implicit.
  private voiceLockUntilMs = 0;
  private expressionState: ExpressionState = { tilt: 0.5, spin: 0, deviation: 0, scramble: 0 };

  readonly algorithmDetector = new CubeAlgorithmDetector();
  readonly voiceEngine = new VoiceEngine();
  readonly expression = new ExpressionProcessor();
  readonly modeManager = new ModeManager();
  readonly turnRateTracker = new TurnRateTracker();
  readonly motion = new MotionTracker();

  private listeners: StateListener[] = [];
  private algorithmListeners: CubeAlgorithmListener[] = [];
  private voiceListeners: VoiceListener[] = [];
  private solveListeners: SolveListener[] = [];

  constructor(mode?: Partial<EngineMode>) {
    if (mode) this.setMode(mode);
  }

  onState(listener: StateListener): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  onAlgorithm(listener: CubeAlgorithmListener): () => void {
    this.algorithmListeners.push(listener);
    return () => {
      this.algorithmListeners = this.algorithmListeners.filter(l => l !== listener);
    };
  }

  onVoice(listener: VoiceListener): () => void {
    this.voiceListeners.push(listener);
    return () => {
      this.voiceListeners = this.voiceListeners.filter(l => l !== listener);
    };
  }

  /**
   * Subscribe to cube-solved transitions. Edge detection is owned by the
   * browser FACELETS stream; reportCubeSolved() forwards the event.
   */
  onSolve(listener: SolveListener): () => void {
    this.solveListeners.push(listener);
    return () => {
      this.solveListeners = this.solveListeners.filter(l => l !== listener);
    };
  }

  reportCubeSolved(): void {
    for (const listener of this.solveListeners) listener();
  }

  setMode(mode: Partial<EngineMode>): void {
    const previousCosmology = this.mode.cosmology;
    this.mode = { ...this.mode, ...mode };
    if (!this.mode.cosmology) this.mode.cosmology = 'beta-cosmo';
    if (this.mode.cosmology !== previousCosmology) {
      this.reset();
    } else {
      this.activeVertex = this.nextActiveVertex();
    }
  }

  /** Choose the fallback K corner used before the first face turn. */
  setTrackedK(k: number): void {
    if (!Number.isInteger(k) || k < 0 || k > 7) {
      throw new RangeError(`tracked K corner must be an integer 0..7, got ${k}`);
    }
    this.trackedK = k;
    if (this.mode.cosmology === 'beta-cosmo') this.activeVertex = this.positionOfTrackedK();
  }

  /** Set K_i diagram. It drives alpha-cosmo and remains shadow in beta-cosmo. */
  setKDiagram(diagram: KinematicDiagram): void {
    this.kDiagram = new DiagramTraversal(diagram);
    this.kDiagramName = diagram.name;
    this.mode.kCube = 'diagram';
  }

  /** Set C_i diagram. It drives alpha-cosmo and remains shadow in beta-cosmo. */
  setCDiagram(diagram: KinematicDiagram): void {
    this.cDiagram = new DiagramTraversal(diagram);
  }

  /** Process a physical cube face turn. */
  onTurn(move: MoveString): XenaKubeState | null {
    const el = parseMoveToElement(move);
    const nextCornerPermutation = applyCornerMove(this.cornerPermutation, move);
    if (el === null || !nextCornerPermutation) return null;

    this.turnRateTracker.push(Date.now());

    const algorithmMatches = this.algorithmDetector.pushAll(move);
    for (let i = algorithmMatches.length - 1; i >= 0; i--) {
      const match = algorithmMatches[i];
      this.modeManager.applyAlgorithm(match);
      this.voiceEngine.setMode(this.modeManager.mode.voiceMode);
      for (const listener of this.algorithmListeners) listener(match);
    }

    if (this.modeManager.mode.frozen) {
      const state = this.getState();
      this.emitState(state);
      return state;
    }

    this.cornerPermutation = nextCornerPermutation;

    const kDiagramStep = this.kDiagram ? this.kDiagram.advance() : null;
    const cDiagramStep = this.cDiagram ? this.cDiagram.advance() : null;

    if (this.mode.cosmology === 'alpha-cosmo') {
      const kStep = kDiagramStep ?? el;
      this.kGroup = multiply(this.kGroup, kStep);
      const cStep = cDiagramStep ?? multiply(C_SHIFT, el);
      this.complexCube.transform(cStep);
    }
    if (this.mode.cosmology === 'beta-cosmo') {
      const snapped = snapToNearest(this.gyro);
      this.orientationGroup = snapped;
      this.kGroup = snapped;
      this.complexCube.groupElement = snapped;
    }
    // Beta-cosmo: phase clock is locked; diagrams remain non-permuting
    // shadows. A new turn commits the latest gyro snap before the voice is
    // emitted so an interrupt starts from the current C assignment.

    const face = parseFace(move);
    if (face !== null) this.lastTurnedFace = face[0] as Face;

    this.step++;
    this.substitutionCount++;
    this.activeVertex = this.nextActiveVertex();

    if (this.substitutionCount >= 3) {
      this.substitutionCount = 0;
      this.sieve.advance();
    }

    const vertices = permuteVertexSet(getBaseVertices(), this.currentKPermutation());
    const complexes = this.complexCube.getAssignments(this.mode.cosmology);
    const voiceOutput = this.voiceEngine.emit(vertices, this.activeVertex, complexes, face);

    // Lock phrase materials (activeVertex slot + C-rotation) for the
    // estimated phrase duration: K-vertex base × face durationMult. While
    // locked, gyro tilt does not re-anchor activeVertex or rotate
    // complexCube.groupElement — the playing (K, C) stays committed until
    // natural end or the next turn (which resets the lock for the new phrase).
    const lockedK = vertices[this.activeVertex];
    const sig = getFaceSignature(move);
    const faceMul = sig?.durationMult ?? 1;
    const phraseSec = (lockedK?.duration ?? 1) * faceMul;
    this.voiceLockUntilMs = Date.now() + phraseSec * 1000;

    const state = this.getState();
    this.emitState(state);
    for (const listener of this.voiceListeners) listener(voiceOutput);
    return state;
  }

  /** Process gyro quaternion update. */
  onGyro(x: number, y: number, z: number, w: number): XenaKubeState | null {
    this.gyro = [x, y, z, w];
    this.motion.pushQuat(this.gyro, Date.now());

    const snapped = snapToNearest(this.gyro);
    this.orientationGroup = snapped;

    // Phrase-lock guard: while a voice is in flight the playing
    // (K, C) at activeVertex must not shift mid-phrase. We still advance
    // the orientation shadow (kGroup) so live cube tilt and motion telemetry
    // keep tracking, but cAssignments rotation and read-head re-anchor are
    // suppressed until the lock expires (or the next turn resets it).
    const phraseLocked = Date.now() < this.voiceLockUntilMs;

    if (this.mode.cosmology === 'beta-cosmo') {
      this.kGroup = snapped;
      if (!phraseLocked) this.complexCube.groupElement = snapped;
    }
    if (this.mode.cosmology === 'alpha-cosmo' && this.mode.cCube === 'gyro' && !phraseLocked) {
      this.complexCube.groupElement = snapped;
    }

    // Re-anchor the read-head only when no phrase is in flight; otherwise
    // gyro tilt is preview-only for the *next* turn after this phrase ends.
    if (!phraseLocked) {
      this.activeVertex = this.nextActiveVertex();
    }

    const { angle } = distanceToNearest(this.gyro);
    const deviation = Math.min(1, angle / (Math.PI / 4));
    const scramble = scrambleFactor(this.cornerPermutation);
    this.expressionState = this.expression.process(this.gyro, deviation, scramble);

    const state = this.getState();
    this.emitState(state);
    return state;
  }

  getExpression(): ExpressionState {
    return this.expressionState;
  }

  getExpressionFor(quat: Quaternion, now?: number): ExpressionState {
    const { angle } = distanceToNearest(quat);
    const deviation = Math.min(1, angle / (Math.PI / 4));
    const scramble = scrambleFactor(this.cornerPermutation);
    return this.expression.process(quat, deviation, scramble, now);
  }

  getScrambleFactor(): number {
    return scrambleFactor(this.cornerPermutation);
  }

  getState(): XenaKubeState {
    const { element: snapElement, angle: snapAngle } = distanceToNearest(this.gyro);
    const snapQuat = getQuaternion(snapElement);
    const gyroDeviation = Math.min(1, snapAngle / (Math.PI / 4));
    const kPermutation = this.currentKPermutation();
    const activeK = kPermutation[this.activeVertex] ?? 0;

    return {
      cosmology: this.mode.cosmology,
      kGroup: this.kGroup,
      kPermutation,
      kVertices: permuteVertexSet(getBaseVertices(), kPermutation),
      cGroup: this.complexCube.groupElement,
      cQuat: getQuaternion(this.complexCube.groupElement),
      cAssignments: this.complexCube.getAssignments(this.mode.cosmology),
      cyclicPhase: this.complexCube.phase,
      tetraIndex: tetraOrbit(this.kGroup),
      sieve: this.sieve.getPitches(),
      gyro: this.gyro,
      step: this.step,
      activeVertex: this.activeVertex,
      activeK,
      trackedK: this.trackedK,
      activeDiagram: this.kDiagramName,
      diagramPosition: this.kDiagram ? this.kDiagram.getPosition() : null,
      snapElement,
      snapQuat,
      gyroDeviation,
      scrambleFactor: scrambleFactor(this.cornerPermutation),
      turnRate: this.turnRateTracker.getRate(),
      regime: this.turnRateTracker.getRegime(),
      expression: this.expressionState,
      lastTurnedFace: this.lastTurnedFace,
      upFace: upFace(this.gyro),
      motion: {
        accelMag: this.motion.accelMag,
        isStill: this.motion.isStill,
        dwellMs: this.motion.dwellMs,
      },
    };
  }

  reset(): void {
    this.kGroup = IDENTITY;
    this.orientationGroup = IDENTITY;
    this.cornerPermutation = [...IDENTITY_CORNER_PERM] as Permutation8;
    this.complexCube.reset();
    this.sieve.reset();
    this.step = 0;
    this.substitutionCount = 0;
    this.lastTurnedFace = null;
    this.voiceLockUntilMs = 0;
    this.activeVertex = this.nextActiveVertexAfterStep(0);
    this.gyro = [0, 0, 0, 1];
    this.kDiagram?.reset();
    this.cDiagram?.reset();
    this.algorithmDetector.reset();
    this.expression.reset();
    this.modeManager.reset();
    this.turnRateTracker.reset();
    this.motion.reset();
    this.voiceEngine.setMode('sequential');
  }

  clearKDiagram(): void {
    this.kDiagram = null;
    this.kDiagramName = null;
    this.mode.kCube = 'direct';
  }

  getDiagrams(): KinematicDiagram[] {
    return getBuiltinDiagrams();
  }

  private emitState(state: XenaKubeState): void {
    for (const listener of this.listeners) listener(state);
  }

  private currentKPermutation(): Permutation8 {
    if (this.mode.cosmology === 'alpha-cosmo') {
      return [...getPermutation(this.kGroup)] as Permutation8;
    }
    return [...this.cornerPermutation] as Permutation8;
  }

  private nextActiveVertex(): number {
    return this.nextActiveVertexAfterStep(this.step);
  }

  private nextActiveVertexAfterStep(step: number): number {
    if (this.mode.cosmology === 'alpha-cosmo') return step % 8;
    // Beta-cosmo Design C: gyro chooses the current top face, then the
    // last-turned face chooses its head-on top-right corner along that top
    // face when the faces touch. Until the first turn, fall back to the
    // tracked-K position for a deterministic initial state.
    if (this.lastTurnedFace !== null) {
      return topRightCorner(this.lastTurnedFace, this.gyro);
    }
    return this.positionOfTrackedK();
  }

  private positionOfTrackedK(): number {
    const idx = this.cornerPermutation.indexOf(this.trackedK);
    return idx >= 0 ? idx : 0;
  }
}
