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
import { getTransformedVertices, getBaseVertices } from './vertices.js';
import { ComplexCube } from './complexes.js';
import { DiagramTraversal, getBuiltinDiagrams, type KinematicDiagram } from './kinematic.js';
import { SieveState } from './sieve.js';
import { snapToNearest, deviationFactor } from './quaternion.js';

export type StateListener = (state: XenaKubeState) => void;

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

  // === Listeners ===
  private listeners: StateListener[] = [];

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

    // Advance K_i cube
    if (this.mode.kCube === 'direct') {
      this.kGroup = multiply(this.kGroup, el);
    } else if (this.kDiagram) {
      // Diagram mode: cube turn advances position in the diagram
      this.kGroup = this.kDiagram.advance();
    }

    // Advance C_i cube
    if (this.mode.cCube === 'algorithmic') {
      if (this.cDiagram) {
        // Follow C_i diagram
        const cEl = this.cDiagram.advance();
        this.complexCube.transform(cEl);
      } else {
        // Default: C_i cube gets the same transformation as K_i
        this.complexCube.transform(el);
      }
    }
    // If cCube === 'gyro', it's updated in onGyro()

    this.step++;
    this.substitutionCount++;
    this.activeVertex = this.step % 8;

    // Advance sieve every 3 substitutions (per Xenakis VII)
    if (this.substitutionCount >= 3) {
      this.substitutionCount = 0;
      this.sieve.advance();
    }

    const state = this.getState();
    this.emit(state);
    return state;
  }

  /** Process gyro quaternion update */
  onGyro(x: number, y: number, z: number, w: number): XenaKubeState | null {
    this.gyro = [x, y, z, w];

    if (this.mode.cCube === 'gyro') {
      // Snap gyro to nearest S4 element for C_i cube
      const snapped = snapToNearest(this.gyro);
      // Only transform if it's a new element
      if (snapped !== this.complexCube.groupElement) {
        // Compute the transformation that takes us from current to snapped
        this.complexCube.groupElement = snapped;
      }
    }

    const state = this.getState();
    this.emit(state);
    return state;
  }

  /** Get current full state */
  getState(): XenaKubeState {
    const perm = getPermutation(this.kGroup);

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

  private emit(state: XenaKubeState): void {
    for (const listener of this.listeners) {
      listener(state);
    }
  }
}
