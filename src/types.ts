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

/** Density/Intensity/Duration parameter bundle for a K_i vertex. */
export interface VertexParams {
  density: number;
  intensity: string;   // dynamic marking: ppp, pp, p, mp, mf, f, ff, fff
  duration: number;     // seconds; material base, reshaped by face gestures
}

/** The 8 vertices K1-K8 as parameter bundles */
export type VertexSet = [VertexParams, VertexParams, VertexParams, VertexParams,
                         VertexParams, VertexParams, VertexParams, VertexParams];

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

/** Structural cosmology: Xenakis-faithful S4 walks vs performer-visible corners. */
export type CosmologyMode = 'alpha-cosmo' | 'beta-cosmo';

/** Performance/interaction mode */
export interface EngineMode {
  /** Alpha restores the S4 walks; beta uses physically followable corners. */
  cosmology: CosmologyMode;
  /** In alpha, diagrams drive K_i walks; in beta they remain shadow paths. */
  kCube: 'direct' | 'diagram';
  /** In alpha, C S4 state permutes assignments; in beta it remains shadow. */
  cCube: 'gyro' | 'algorithmic';
}

/** Quaternion as [x, y, z, w] */
export type Quaternion = [number, number, number, number];

/** Motion-derived primitives surfaced to bridge / dashboard. */
export interface MotionState {
  /** Angular speed magnitude in rad/s. */
  accelMag: number;
  /** True when accelMag is below STILL_OMEGA_THRESHOLD. */
  isStill: boolean;
  /** How long isStill has been continuously true, in ms. */
  dwellMs: number;
}

/** Full engine state emitted after each transformation */
export interface XenaKubeState {
  /** Active structural cosmology. */
  cosmology: CosmologyMode;
  /** K S4 element: live walk in alpha-cosmo, gyro/orientation shadow in beta-cosmo. */
  kGroup: GroupElement;
  /** Current K assignment: S4 walk in alpha-cosmo, physical corner topology in beta-cosmo. */
  kPermutation: Permutation8;
  /** K_i cube: vertex parameter values in current order */
  kVertices: VertexSet;
  /** C_i S4 element: live assignment walk in alpha-cosmo, shadow metadata in beta-cosmo. */
  cGroup: GroupElement;
  /** C_i quaternion (cGroup as a unit quat). Material assignment pose, phrase-lockable. */
  cQuat: Quaternion;
  /** C_i cube: current complex assignments; beta-cosmo keeps C{i+1} at local slot i. */
  cAssignments: ComplexType[];
  /** Current cyclic phase */
  cyclicPhase: CyclicPhase;
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
  /** K_i label currently sounding at activeVertex. */
  activeK: number;
  /** Beta-cosmo fallback K_i label used before the first turned-face selector. */
  trackedK: number;
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
  /** Scramble factor: normalized exact quarter-turn distance of visible corners */
  scrambleFactor: number;
  /** Current turn rate in turns/sec */
  turnRate: number;
  /** Current performance speed regime */
  regime: 'contemplative' | 'conversational' | 'burst';
  /** True when the most recent valid turn completed a rapid same-move pair. */
  lastHalfTurn: boolean;
  /** Gyro-derived continuous expression parameters (all 0–1) */
  expression: {
    tilt: number;
    spin: number;
    deviation: number;
    scramble: number;
  };
  /** Last face turned (after MOVE_REMAP), or null before any face turn. */
  lastTurnedFace: CubeFace | null;
  /** Cube face currently most aligned with world +Y under the gyro. */
  upFace: CubeFace;
  /** Still-state and dwell tracking from MotionTracker. */
  motion: MotionState;
}
