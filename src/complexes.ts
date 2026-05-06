// === Sound Complexes C1-C8 with alpha/beta/gamma Cyclic Mappings ===
//
// Xenakis defines 8 macroscopic sound complex TYPES, then 3 different ways
// to assign those types to the 8 vertices of a second cube. The mapping
// cycles alpha -> beta -> gamma -> alpha every 3 substitutions in
// alpha-cosmo (Xenakis-faithful S4 permutation path).
//
// Beta-cosmo keeps C1..C8 fixed to the dashboard ghost cube's local corner
// labels. Its groupElement is shadow orientation metadata only; it must not
// rotate or remap the active complex under a visible slot. Phase clock never
// advances in beta-cosmo.

import { ComplexType, type CosmologyMode, type CyclicPhase, type GroupElement } from './types.js';
import { multiply, IDENTITY, getPermutation } from './group.js';

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

const C = ComplexType;

/** beta-cosmo local-slot mapping: slot i is visibly and sonically C{i+1}. */
const FIXED_LOCAL: ComplexType[] = [
  C.AtaxicCloud,
  C.OrderedCloudAscDesc,
  C.OrderedCloudFlat,
  C.IonizedAtom,
  C.AtaxicSliding,
  C.OrderedSlidingAscDesc,
  C.OrderedSlidingFlat,
  C.Atom,
];

/** alpha mapping: vertex index -> complex type */
const ALPHA: ComplexType[] = [
  C.AtaxicCloud,
  C.OrderedSlidingFlat,
  C.OrderedCloudFlat,
  C.AtaxicSliding,
  C.OrderedSlidingAscDesc,
  C.OrderedCloudAscDesc,
  C.Atom,
  C.IonizedAtom,
];

/** beta mapping: vertex index -> complex type */
const BETA: ComplexType[] = [
  C.AtaxicCloud,
  C.OrderedCloudAscDesc,
  C.OrderedCloudFlat,
  C.AtaxicSliding,
  C.OrderedSlidingAscDesc,
  C.OrderedSlidingFlat,
  C.Atom,
  C.IonizedAtom,
];

/** gamma mapping: vertex index -> complex type */
const GAMMA: ComplexType[] = [
  C.AtaxicCloud,
  C.AtaxicSliding,
  C.OrderedSlidingAscDesc,
  C.OrderedCloudAscDesc,
  C.OrderedCloudFlat,
  C.IonizedAtom,
  C.Atom,
  C.OrderedSlidingFlat,
];

const PHASE_MAPPINGS: Record<CyclicPhase, ComplexType[]> = {
  alpha: ALPHA,
  beta: BETA,
  gamma: GAMMA,
};

const PHASE_ORDER: CyclicPhase[] = ['alpha', 'beta', 'gamma'];

/** State of the C_i sound-complex cube. */
export class ComplexCube {
  /** S4 element for the C_i cube: live in alpha-cosmo, shadow in beta-cosmo. */
  groupElement: GroupElement = IDENTITY;

  /** Current cyclic phase. */
  phase: CyclicPhase = 'alpha';

  /** Count of substitutions since last phase change. */
  private substitutionCount = 0;

  /** Advance the shadow C_i S4 state and the alpha/beta/gamma phase clock. */
  transform(el: GroupElement): void {
    this.groupElement = multiply(this.groupElement, el);
    this.advancePhaseClock();
  }

  /** Advance only the alpha/beta/gamma phase clock, with no S4 permutation. */
  advancePhase(): void {
    this.advancePhaseClock();
  }

  /** Get current complex type assignments for the active cosmology. */
  getAssignments(cosmology: CosmologyMode = 'beta-cosmo'): ComplexType[] {
    if (cosmology === 'alpha-cosmo') {
      const base = PHASE_MAPPINGS[this.phase];
      const perm = getPermutation(this.groupElement);
      return perm.map(i => base[i]);
    }
    // beta-cosmo: fixed local C identities, independent of C shadow S4.
    return [...FIXED_LOCAL];
  }

  /** Reset to initial state. */
  reset(): void {
    this.groupElement = IDENTITY;
    this.phase = 'alpha';
    this.substitutionCount = 0;
  }

  private advancePhaseClock(): void {
    this.substitutionCount++;
    if (this.substitutionCount >= 3) {
      this.substitutionCount = 0;
      const idx = PHASE_ORDER.indexOf(this.phase);
      this.phase = PHASE_ORDER[(idx + 1) % 3];
    }
  }
}
