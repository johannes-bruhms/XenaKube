// XenaKube Engine — public API
export { XenaKubeEngine, type StateListener } from './engine.js';
export { stateToOsc, type OscMessage } from './osc-output.js';
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
  ComplexType,
  type GroupElement, type Permutation8, type CubeMove, type CubeFace, type MoveString,
  type VertexParams, type VertexSet, type Path, type CyclicPhase,
  type EngineMode, type Quaternion, type XenaKubeState,
} from './types.js';
