// XenaKube Engine — public API
export { XenaKubeEngine, type StateListener, type SpellListener, type VoiceListener, type SolveListener } from './engine.js';
export { stateToOsc, expressionToOsc, spellToOsc, voiceToOsc, solveToOsc, type OscMessage } from './osc-output.js';
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
export { SpellDetector, SPELL_BOOK, CANONICAL_SPELLS, expandSpellBook, type Spell, type SpellEffect, type SpellMatch } from './spells.js';
export { scrambleDistance, scrambleFactor, getAllDistances, MAX_DISTANCE } from './scramble.js';
export { VoiceEngine, type VoiceMode, type VoiceEvent, type VoiceOutput } from './voice-engine.js';
export { ExpressionProcessor, type ExpressionState } from './expression.js';
export { ModeManager, type PerformanceMode, type ModeChangeListener } from './mode-manager.js';
export { TurnRateTracker, type Regime } from './turn-rate.js';
export {
  FACE_SIGNATURES, parseFace, getFaceSignature,
  pitchClassMod, registerMod, intensityScalar, parityInflection,
  type FaceMove, type FaceSignature, type EnvelopeShape, type Articulation, type Motion,
} from './face-gesture.js';
export {
  ComplexType,
  type GroupElement, type Permutation8, type CubeMove, type CubeFace, type MoveString,
  type VertexParams, type VertexSet, type Path, type CyclicPhase,
  type EngineMode, type Quaternion, type XenaKubeState,
} from './types.js';
