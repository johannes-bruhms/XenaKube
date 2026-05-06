// public/interruption/clips.js
//
// First-draft local manifest. `generated:*` entries are procedural placeholder
// streams so the module can be exercised without committing real footage.
// Replace `src` with a local URL (for example `./interruption/media/name.mp4`)
// when using performance footage.

export const INTERRUPTION_CLIPS = Object.freeze([
  Object.freeze({
    id: 'generated-crisis-grid',
    src: 'generated:crisis-grid',
    category: 'crisis',
    start: 0,
    end: 14,
    target: Object.freeze({ x: 0.54, y: 0.43 }),
    intensity: 0.55,
    tags: Object.freeze(['placeholder', 'crisis', 'grid']),
    allowImpact: false,
  }),
  Object.freeze({
    id: 'generated-war-signal',
    src: 'generated:war-signal',
    category: 'war',
    start: 0,
    end: 12,
    target: Object.freeze({ x: 0.62, y: 0.38 }),
    intensity: 0.82,
    tags: Object.freeze(['placeholder', 'war', 'signal']),
    allowImpact: true,
  }),
  Object.freeze({
    id: 'generated-comfort-horizon',
    src: 'generated:comfort-horizon',
    category: 'comfort',
    start: 0,
    end: 18,
    target: null,
    intensity: 0.20,
    tags: Object.freeze(['placeholder', 'comfort']),
    allowImpact: false,
  }),
]);
