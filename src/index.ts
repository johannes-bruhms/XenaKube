// XenaKube Engine — public API
export { XenaKubeEngine, type StateListener, type CubeAlgorithmListener, type VoiceListener, type SolveListener } from './engine.js';
export { stateToOsc, expressionToOsc, algorithmToOsc, voiceToOsc, solveToOsc, type OscMessage } from './osc-output.js';
export { OSC, vertexAddr, complexAddr, ALL_XK_ADDRESSES, MIDI_ECHO_PORT } from './osc-schema.js';
export {
  HARMONICS, TREMOLO, BOW_POLY,
  HARMONICS_CC_VAL, TREMOLO_CC_VAL, BOW_POLY_CC_VAL,
  INTENSITY_MAP, ENV_PROFILE, ART_OFF_VEL, MOTION_NUDGE,
  LEGATO_COMPLEX, REGIME_ATTACK_MULT, REGIME_EXPR_RAMP_MULT,
  clamp, harmonicsForC4, phraseCountBounds, applyEnvelopeCount,
  stepVelScale, commitSieveWalk, faceTranspose,
  buildFaceMap, intensityEntry,
  type EnvProfile, type VelCurve, type IntensityEntry, type IntensityLabel,
  type FaceMapEntry,
} from './swam-mapping.js';
export {
  ELEMENTS, CAYLEY, INVERSES, IDENTITY,
  multiply, inverse, getPermutation, tetraOrbit,
  parseMoveToElement, moveToString, findElement,
} from './group.js';
export { getBaseVertices, permuteVertices, getTransformedVertices, compareIntensity } from './vertices.js';
export { ComplexCube, COMPLEX_DESCRIPTIONS } from './complexes.js';
export { getBuiltinDiagrams, DiagramTraversal, type KinematicDiagram } from './kinematic.js';
export {
  SieveState, evaluateSieve, sievePoints, sieveUnion, sieveIntersection,
  metabola, multiplyMod18, RESIDUAL_CLASSES, L_11_13,
  type Sieve, type SieveFunction,
} from './sieve.js';
export { snapToNearest, getQuaternion, distanceToNearest, deviationFactor, quatNormalize } from './quaternion.js';
export {
  CubeAlgorithmDetector,
  CUBE_ALGORITHM_BOOK,
  CANONICAL_CUBE_ALGORITHMS,
  expandCubeAlgorithmBook,
  type CubeAlgorithm,
  type CubeAlgorithmEffect,
  type CubeAlgorithmMatch,
} from './cube-algorithm.js';
export { scrambleDistance, scrambleFactor, getAllDistances, MAX_DISTANCE } from './scramble.js';
export { VoiceEngine, type VoiceMode, type VoiceEvent, type VoiceOutput } from './voice-engine.js';
export { ExpressionProcessor, type ExpressionState } from './expression.js';
export { ModeManager, type PerformanceMode, type ModeChangeListener } from './mode-manager.js';
export { TurnRateTracker, type Regime } from './turn-rate.js';
export {
  FACE_SIGNATURES, parseFace, getFaceSignature,
  pitchClassMod, registerMod, parityInflection,
  type FaceMove, type FaceSignature, type EnvelopeShape, type Articulation, type Motion,
} from './face-gesture.js';
export {
  ComplexType,
  type GroupElement, type Permutation8, type CubeMove, type CubeFace, type MoveString,
  type VertexParams, type VertexSet, type CyclicPhase,
  type EngineMode, type Quaternion, type XenaKubeState,
} from './types.js';
