// === Xenakis Nomos Alpha Type Definitions ===

/** Index into the 24-element S4 (hexahedral) group. 0 = identity. */
export type GroupElement = number;

/** A permutation of 8 elements (cube vertices), stored as [dest_of_0, dest_of_1, ...] */
export type Permutation8 = [number, number, number, number, number, number, number, number];

/** Physical cube face */
export type CubeFace = 'U' | 'D' | 'L' | 'R' | 'F' | 'B';

/** Physical cube move: face + direction */
export interface CubeMove {
  face: CubeFace;
  direction: 1 | -1 | 2; // CW, CCW, 180°
}

/** Move as string notation (e.g. "R", "U'", "F2") */
export type MoveString = string;

/** Density/Intensity/Duration parameter triple for a vertex */
export interface VertexParams {
  density: number;
  intensity: string;   // dynamic marking: p, mp, mf, f, ff, fff
  duration: number;     // seconds
}

/** The 8 vertices K1-K8 as parameter bundles */
export type VertexSet = [VertexParams, VertexParams, VertexParams, VertexParams,
                         VertexParams, VertexParams, VertexParams, VertexParams];

/** Which path is active */
export type Path = 'V1' | 'V2';

/** Macroscopic sound complex type (Xenakis C1-C8) */
export enum ComplexType {
  AtaxicCloud = 1,          // C1: ataxic cloud of sound-points
  OrderedCloudAscDesc = 2,  // C2(α) / varies by mapping
  OrderedCloudFlat = 3,     // C3(α) / varies by mapping
  IonizedAtom = 4,          // C4(α) / varies by mapping
  AtaxicSliding = 5,        // C5(α) / varies by mapping
  OrderedSlidingAscDesc = 6,// C6(α) / varies by mapping
  OrderedSlidingFlat = 7,   // C7(α) / varies by mapping
  Atom = 8,                 // C8: atom (quasi-unison interferences)
}

/** Cyclic mapping phase for C_i assignments */
export type CyclicPhase = 'alpha' | 'beta' | 'gamma';

/** Performance/interaction mode */
export interface EngineMode {
  /** How K_i cube is driven */
  kCube: 'direct' | 'diagram';
  /** How C_i cube is driven */
  cCube: 'gyro' | 'algorithmic';
  /** Which path */
  path: Path;
}

/** Quaternion as [x, y, z, w] */
export type Quaternion = [number, number, number, number];

/** Full engine state emitted after each transformation */
export interface XenaKubeState {
  /** K_i cube: current group element */
  kGroup: GroupElement;
  /** K_i cube: current vertex permutation (which K is at which position) */
  kPermutation: Permutation8;
  /** K_i cube: vertex parameter values in current order */
  kVertices: VertexSet;
  /** C_i cube: current group element */
  cGroup: GroupElement;
  /** C_i cube: current complex assignments */
  cAssignments: ComplexType[];
  /** Current cyclic phase */
  cyclicPhase: CyclicPhase;
  /** Current path */
  path: Path;
  /** Tetrahedral orbit index (0-3) */
  tetraIndex: number;
  /** Sieve state */
  sieve: number[];
  /** Raw gyro quaternion (passthrough for visuals) */
  gyro: Quaternion;
  /** Transformation count */
  step: number;
  /** Active vertex index (0-7): the single vertex currently sounding */
  activeVertex: number;
  /** Active diagram name (null if none) */
  activeDiagram: string | null;
  /** Diagram position info */
  diagramPosition: { index: number; total: number } | null;
  /** Nearest S4 element to current gyro orientation (always computed, used for visualization) */
  snapElement: GroupElement;
  /** Quaternion of the nearest S4 element — ghost cube target for gyro snap visuals */
  snapQuat: Quaternion;
  /** Angular distance from gyro to nearest snap, normalized 0..1 (0 = locked, 1 = at flip boundary) */
  gyroDeviation: number;
}
