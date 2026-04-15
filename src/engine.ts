// === XenaKube Engine: Central Orchestrator ===
//
// Receives cube events (turns, gyro, lock), runs both cubes (K_i + C_i),
// computes full composition state per transformation, and emits it.

import type {
  GroupElement, MoveString, Quaternion, Path,
  XenaKubeState, EngineMode, ComplexType, Permutation8,
} from './types.js';
import {
  multiply, parseMoveToElement, getPermutation,
  IDENTITY, tetraOrbit,
} from './group.js';

// Fixed S4 element used to shift the C-cube's advance law so it diverges
// from the K-cube. U generator (order 4) gives a 4-cycle offset; combined
// with the α/β/γ 3-cycle, the C-cube's full visible period is lcm(4,3)=12
// substitutions, plenty of contrast against K. See engine.onTurn for why.
const C_SHIFT = parseMoveToElement('U')!;
import { getTransformedVertices, getBaseVertices } from './vertices.js';
import { ComplexCube } from './complexes.js';
import { DiagramTraversal, getBuiltinDiagrams, type KinematicDiagram } from './kinematic.js';
import { SieveState } from './sieve.js';
import { snapToNearest, distanceToNearest, getQuaternion } from './quaternion.js';
import { SpellDetector, type SpellMatch } from './spells.js';
import { scrambleFactor } from './scramble.js';
import { VoiceEngine, type VoiceOutput } from './voice-engine.js';
import { ExpressionProcessor, type ExpressionState } from './expression.js';
import { ModeManager, type PerformanceMode } from './mode-manager.js';
import { TurnRateTracker, type Regime } from './turn-rate.js';

export type StateListener = (state: XenaKubeState) => void;
export type SpellListener = (match: SpellMatch) => void;
export type VoiceListener = (output: VoiceOutput) => void;

export class XenaKubeEngine {
  // === K_i cube state ===
  private kGroup: GroupElement = IDENTITY;

  // === C_i cube ===
  private complexCube = new ComplexCube();

  // === Kinematic diagram traversal (optional) ===
  private kDiagram: DiagramTraversal | null = null;
  private kDiagramName: string | null = null;
  private cDiagram: DiagramTraversal | null = null;

  // === Sieve state ===
  private sieve = new SieveState();

  // === Mode ===
  private mode: EngineMode = {
    kCube: 'direct',
    cCube: 'algorithmic',
    path: 'V1',
  };

  // === Tracking ===
  private step = 0;
  private gyro: Quaternion = [0, 0, 0, 1];
  private substitutionCount = 0;
  private activeVertex = 0;
  private expressionState: import('./expression.js').ExpressionState = { tilt: 0.5, spin: 0, deviation: 0, scramble: 0 };

  // === New v2 modules ===
  readonly spellDetector = new SpellDetector();
  readonly voiceEngine = new VoiceEngine();
  readonly expression = new ExpressionProcessor();
  readonly modeManager = new ModeManager();
  readonly turnRateTracker = new TurnRateTracker();

  // === Listeners ===
  private listeners: StateListener[] = [];
  private spellListeners: SpellListener[] = [];
  private voiceListeners: VoiceListener[] = [];

  constructor(mode?: Partial<EngineMode>) {
    if (mode) this.setMode(mode);
  }

  /** Subscribe to state changes */
  onState(listener: StateListener): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  /** Subscribe to spell detections */
  onSpell(listener: SpellListener): () => void {
    this.spellListeners.push(listener);
    return () => {
      this.spellListeners = this.spellListeners.filter(l => l !== listener);
    };
  }

  /** Subscribe to voice output events */
  onVoice(listener: VoiceListener): () => void {
    this.voiceListeners.push(listener);
    return () => {
      this.voiceListeners = this.voiceListeners.filter(l => l !== listener);
    };
  }

  /** Set engine mode */
  setMode(mode: Partial<EngineMode>): void {
    this.mode = { ...this.mode, ...mode };
  }

  /** Set kinematic diagram for K_i cube */
  setKDiagram(diagram: KinematicDiagram): void {
    this.kDiagram = new DiagramTraversal(diagram);
    this.kDiagramName = diagram.name;
    this.mode.kCube = 'diagram';
  }

  /** Set kinematic diagram for C_i cube */
  setCDiagram(diagram: KinematicDiagram): void {
    this.cDiagram = new DiagramTraversal(diagram);
  }

  /** Process a physical face turn */
  onTurn(move: MoveString): XenaKubeState | null {
    const el = parseMoveToElement(move);
    if (el === null) return null;

    // Track turn timing for regime detection
    this.turnRateTracker.push(Date.now());

    // Check for spells (layered — multiple can fire on the same move)
    // Apply shortest-first so longest (hardest to execute) wins on conflicts
    const spellMatches = this.spellDetector.pushAll(move);
    for (let i = spellMatches.length - 1; i >= 0; i--) {
      const match = spellMatches[i];
      this.modeManager.applySpell(match);
      this.voiceEngine.setMode(this.modeManager.mode.voiceMode);
      for (const listener of this.spellListeners) listener(match);
    }

    // If frozen, emit state but don't advance
    if (this.modeManager.mode.frozen) {
      const state = this.getState();
      this.emitState(state);
      return state;
    }

    // Advance K_i cube
    if (this.mode.kCube === 'direct') {
      this.kGroup = multiply(this.kGroup, el);
    } else if (this.kDiagram) {
      this.kGroup = this.kDiagram.advance();
    }

    // Advance C_i cube.
    // Xenakis (Formalized Music pp. 223-224, §IV): K_i and C_i traverse
    // *separate* closed graphs — "C_i graph {D Q12}" vs "K_i graph {D Q3}" —
    // so the two cubes must not advance by the same element. Prior behaviour
    // multiplied both by `el` from IDENTITY, which made
    // `complexCube.groupElement === kGroup` forever; the ghost cube was just
    // the live cube rendered twice, and K# ↔ complex pairing only shifted
    // when α → β → γ rotated every 3 substitutions.
    //
    // Fix: when no explicit cDiagram is loaded, shift each move by the
    // fixed generator U before applying it to the C-cube. The move still
    // drives the advance (so different physical turns produce different
    // complex states), but C's orbit diverges from K's by a 4-cycle offset,
    // and landing on the same K-permutation no longer forces the same
    // complex assignment.
    if (this.mode.cCube === 'algorithmic') {
      if (this.cDiagram) {
        const cEl = this.cDiagram.advance();
        this.complexCube.transform(cEl);
      } else {
        this.complexCube.transform(multiply(C_SHIFT, el));
      }
    }

    this.step++;
    this.substitutionCount++;
    this.activeVertex = this.step % 8;

    // Advance sieve every 3 substitutions
    if (this.substitutionCount >= 3) {
      this.substitutionCount = 0;
      this.sieve.advance();
    }

    // Voice output
    const vertices = getTransformedVertices(this.mode.path, this.kGroup);
    const complexes = this.complexCube.getAssignments();
    const voiceOutput = this.voiceEngine.emit(vertices, this.activeVertex, complexes);
    for (const listener of this.voiceListeners) listener(voiceOutput);

    const state = this.getState();
    this.emitState(state);
    return state;
  }

  /** Process gyro quaternion update */
  onGyro(x: number, y: number, z: number, w: number): XenaKubeState | null {
    this.gyro = [x, y, z, w];

    if (this.mode.cCube === 'gyro') {
      const snapped = snapToNearest(this.gyro);
      if (snapped !== this.complexCube.groupElement) {
        this.complexCube.groupElement = snapped;
      }
    }

    // Update expression from gyro
    const { angle } = distanceToNearest(this.gyro);
    const deviation = Math.min(1, angle / (Math.PI / 4));
    const scramble = scrambleFactor(this.kGroup);
    this.expressionState = this.expression.process(this.gyro, deviation, scramble);

    const state = this.getState();
    this.emitState(state);
    return state;
  }

  /** Get current expression state (gyro-derived continuous params) */
  getExpression(): ExpressionState {
    return this.expressionState;
  }

  /** Compute expression from an arbitrary quaternion (for relay's 60Hz Kalman-filtered quat) */
  getExpressionFor(quat: Quaternion, now?: number): ExpressionState {
    const { angle } = distanceToNearest(quat);
    const deviation = Math.min(1, angle / (Math.PI / 4));
    const scramble = scrambleFactor(this.kGroup);
    return this.expression.process(quat, deviation, scramble, now);
  }

  /** Get current scramble factor (0 = solved, 1 = max scrambled) */
  getScrambleFactor(): number {
    return scrambleFactor(this.kGroup);
  }

  /** Get current full state */
  getState(): XenaKubeState {
    const perm = getPermutation(this.kGroup);

    const { element: snapElement, angle: snapAngle } = distanceToNearest(this.gyro);
    const snapQuat = getQuaternion(snapElement);
    const gyroDeviation = Math.min(1, snapAngle / (Math.PI / 4));

    return {
      kGroup: this.kGroup,
      kPermutation: perm,
      kVertices: getTransformedVertices(this.mode.path, this.kGroup),
      cGroup: this.complexCube.groupElement,
      cAssignments: this.complexCube.getAssignments(),
      cyclicPhase: this.complexCube.phase,
      path: this.mode.path,
      tetraIndex: tetraOrbit(this.kGroup),
      sieve: this.sieve.getPitches(),
      gyro: this.gyro,
      step: this.step,
      activeVertex: this.activeVertex,
      activeDiagram: this.kDiagramName,
      diagramPosition: this.kDiagram ? this.kDiagram.getPosition() : null,
      snapElement,
      snapQuat,
      gyroDeviation,
      scrambleFactor: scrambleFactor(this.kGroup),
      turnRate: this.turnRateTracker.getRate(),
      regime: this.turnRateTracker.getRegime(),
      expression: this.expressionState,
    };
  }

  /** Reset all state */
  reset(): void {
    this.kGroup = IDENTITY;
    this.complexCube.reset();
    this.sieve.reset();
    this.step = 0;
    this.substitutionCount = 0;
    this.activeVertex = 0;
    this.gyro = [0, 0, 0, 1];
    this.kDiagram?.reset();
    this.cDiagram?.reset();
    this.spellDetector.reset();
    this.expression.reset();
    this.modeManager.reset();
    this.turnRateTracker.reset();
    this.voiceEngine.setMode('sequential');
  }

  /** Clear K_i diagram (back to direct mode) */
  clearKDiagram(): void {
    this.kDiagram = null;
    this.kDiagramName = null;
    this.mode.kCube = 'direct';
  }

  /** Get available kinematic diagrams */
  getDiagrams(): KinematicDiagram[] {
    return getBuiltinDiagrams();
  }

  private emitState(state: XenaKubeState): void {
    for (const listener of this.listeners) {
      listener(state);
    }
  }
}
