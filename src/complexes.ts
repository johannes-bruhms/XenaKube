// === Sound Complexes C1-C8 with α/β/γ Cyclic Mappings (pp. 222-224) ===
//
// Xenakis defines 8 macroscopic sound complex TYPES, then 3 different ways
// (α, β, γ) to assign those types to the 8 vertices of a SECOND cube.
// The mapping cycles α → β → γ → α every 3 substitutions.
//
// The second cube operates independently from the K_i parameter cube,
// with its own S4 group state.

import { ComplexType, type CyclicPhase, type GroupElement } from './types.js';
import { getPermutation, multiply, IDENTITY } from './group.js';

// === The 8 sound complex descriptions ===
export const COMPLEX_DESCRIPTIONS: Record<ComplexType, string> = {
  [ComplexType.AtaxicCloud]:          'ataxic cloud of sound-points',
  [ComplexType.OrderedCloudAscDesc]:  'relatively ordered ascending or descending cloud of sound-points',
  [ComplexType.OrderedCloudFlat]:     'relatively ordered cloud of sound-points, neither ascending nor descending',
  [ComplexType.IonizedAtom]:          'ionized atom: interferences with pizzicati',
  [ComplexType.AtaxicSliding]:        'ataxic field of sliding sounds',
  [ComplexType.OrderedSlidingAscDesc]:'relatively ordered ascending or descending field of sliding sounds',
  [ComplexType.OrderedSlidingFlat]:   'relatively ordered field of sliding sounds, neither ascending nor descending',
  [ComplexType.Atom]:                 'atom: quasi-unison interferences',
};

// === α, β, γ mappings (from primary source pp. 222) ===
// Each array maps vertex position [0..7] → ComplexType
// Read from the table: row = sound description, columns = α, β, γ assignment

const C = ComplexType;

/** α mapping: vertex index → complex type */
const ALPHA: ComplexType[] = [
  C.AtaxicCloud,           // vertex 0 → C1
  C.OrderedSlidingFlat,    // vertex 1 → C7
  C.OrderedCloudFlat,      // vertex 2 → C3
  C.AtaxicSliding,         // vertex 3 → C5
  C.OrderedSlidingAscDesc, // vertex 4 → C6
  C.OrderedCloudAscDesc,   // vertex 5 → C2
  C.Atom,                  // vertex 6 → C8
  C.IonizedAtom,           // vertex 7 → C4
];

/** β mapping: vertex index → complex type */
const BETA: ComplexType[] = [
  C.AtaxicCloud,           // vertex 0 → C1
  C.OrderedCloudAscDesc,   // vertex 1 → C2
  C.OrderedCloudFlat,      // vertex 2 → C3
  C.AtaxicSliding,         // vertex 3 → C5
  C.OrderedSlidingAscDesc, // vertex 4 → C6
  C.OrderedSlidingFlat,    // vertex 5 → C7
  C.Atom,                  // vertex 6 → C8
  C.IonizedAtom,           // vertex 7 → C4
];

/** γ mapping: vertex index → complex type */
const GAMMA: ComplexType[] = [
  C.AtaxicCloud,             // vertex 0 → C1
  C.AtaxicSliding,           // vertex 1 → C5
  C.OrderedSlidingAscDesc,   // vertex 2 → C6
  C.OrderedCloudAscDesc,     // vertex 3 → C2
  C.OrderedCloudFlat,        // vertex 4 → C3
  C.IonizedAtom,             // vertex 5 → C4
  C.Atom,                    // vertex 6 → C8
  C.OrderedSlidingFlat,      // vertex 7 → C7
];

const PHASE_MAPPINGS: Record<CyclicPhase, ComplexType[]> = {
  alpha: ALPHA,
  beta: BETA,
  gamma: GAMMA,
};

const PHASE_ORDER: CyclicPhase[] = ['alpha', 'beta', 'gamma'];

/** State of the C_i (sound complex) cube */
export class ComplexCube {
  /** Current S4 group element for the C_i cube */
  groupElement: GroupElement = 0;

  /** Current cyclic phase */
  phase: CyclicPhase = 'alpha';

  /** Count of substitutions since last phase change */
  private substitutionCount = 0;

  /** Advance the C_i cube by a group transformation */
  transform(el: GroupElement): void {
    this.groupElement = multiply(this.groupElement, el);
    this.substitutionCount++;

    // Cycle α → β → γ every 3 substitutions
    if (this.substitutionCount >= 3) {
      this.substitutionCount = 0;
      const idx = PHASE_ORDER.indexOf(this.phase);
      this.phase = PHASE_ORDER[(idx + 1) % 3];
    }
  }

  /** Get current complex type assignments after permutation */
  getAssignments(): ComplexType[] {
    const baseMapping = PHASE_MAPPINGS[this.phase];
    const perm = getPermutation(this.groupElement);
    // Apply permutation: position i gets the complex that was at perm[i]
    return perm.map(i => baseMapping[i]);
  }

  /** Reset to initial state */
  reset(): void {
    this.groupElement = 0;
    this.phase = 'alpha';
    this.substitutionCount = 0;
  }
}
