// === OSC Schema — single source of truth ===
//
// Every /xk/* and /gan/* address used across the project is declared
// here. `src/osc-output.ts`, `relay.js`, and `max/xk_swam.js` all consume
// it (Max-side via the codegen'd `max/gen_includes.js`). A typo here
// breaks everything loudly; diverging copies in three files would break
// quietly — this is the whole point.
//
// The arg signatures below are documentation-only, not runtime-enforced.
// A future phase can turn them into zod schemas if the surface grows
// enough to justify runtime validation.

/** `/xk/*` goes to Max (port 57121). `/gan/*` goes to TouchDesigner (port 8000). */
export const OSC = {
  // ── cube group state ─────────────────────────────────────────
  GROUP_K:       '/xk/group/k',         // i:elementIndex (0–23)
  GROUP_C:       '/xk/group/c',         // i:elementIndex (0–23)

  // ── vertex / complex (positional addresses) ──────────────────
  VERTEX:        '/xk/vertex/',         // suffix 1..8 — args: f:density, s:intensity, f:duration
  COMPLEX:       '/xk/complex/',        // suffix 1..8 — args: i:complexType (1..8)

  // ── path / cycle / orbit / sieve ─────────────────────────────
  PATH:          '/xk/path',            // s:'V1'|'V2'
  CYCLE:         '/xk/cycle',           // s:'alpha'|'beta'|'gamma'
  TETRA:         '/xk/tetra',           // i:0|1 (even/odd tetrahedral orbit)
  SIEVE:         '/xk/sieve',           // i... (variable-length semitone offsets)

  // ── gyro / perm / step / snap ────────────────────────────────
  GYRO:          '/xk/gyro',            // f,f,f,f (quaternion)
  PERM:          '/xk/perm',            // i×8 (vertex permutation)
  STEP:          '/xk/step',            // i:transformation count
  ACTIVE:        '/xk/active',          // i:0..7 (active vertex index)
  SNAP_ELEMENT:  '/xk/snap/element',    // i:0..23 (S4 element gyro snaps to)
  SNAP_QUAT:     '/xk/snap/quat',       // f,f,f,f
  SNAP_DEV:      '/xk/snap/dev',        // f:0..1 (0=locked, 1=boundary)
  SCRAMBLE:      '/xk/scramble',        // f:0..1 (BFS distance from identity)
  SOLVE:         '/xk/solve',           // (no args) — unsolved→solved edge
  RATE:          '/xk/rate',            // f:turns/sec
  REGIME:        '/xk/regime',          // s:'contemplative'|'conversational'|'burst'

  // ── expression (60 Hz continuous controls) ───────────────────
  EXPR_TILT:     '/xk/expr/tilt',       // f:0..1
  EXPR_SPIN:     '/xk/expr/spin',       // f:0..1
  EXPR_DEV:      '/xk/expr/dev',        // f:0..1
  EXPR_SCRAMBLE: '/xk/expr/scramble',   // f:0..1

  // ── events ───────────────────────────────────────────────────
  SPELL:         '/xk/spell',           // s:spellName
  FACE:          '/xk/face',            // s:"L"|"L'"|"R"|"R'"|"F"|"F'"|"B"|"B'"|"U"|"U'"|"D"|"D'"
  VOICE:         '/xk/voice',           // i:vertexIdx, i:complexType, f:density, s:intensity, f:duration
  PANIC:         '/xk/panic',           // (no args) — relay WS disconnect

  // ── Max-internal helper (not emitted by relay) ───────────────
  TREM_LEARN:    '/xk/tremLearn',       // i:value — single-shot CC80 for MIDI-Learn

  // ── MIDI echo: Max bridge → relay (port 57122, reverse direction) ──
  //    Fired from every noteOn / noteOff wrapper in `max/xk_swam.js`
  //    so the dashboard can transcribe exactly what SWAM plays (Phase E
  //    tier 2, landed 2026-04-23; rev B 2026-04-24 — adds complex arg
  //    so the rolling piano-roll can colour by technique and connect
  //    glissando steps in C5/C6/C7). Keyswitches bypass the wrappers
  //    so technique-select toggles don't pollute the score.
  MIDI_NOTEON:   '/xk/midi/noteon',     // i:voice (1..POOL_SIZE), i:pitch, i:velocity, i:complex (0=unknown, 1..8=Cn)
  MIDI_NOTEOFF:  '/xk/midi/noteoff',    // i:voice, i:pitch, i:velocity, i:complex
  MIDI_PANIC:    '/xk/midi/panic',      // (no args) — clear pending notes on bang/panic

  // ── raw pass-through to TouchDesigner (port 8000) ────────────
  GAN_TURN:      '/gan/turn',           // s:moveString ("R","U'","F2",...)
  GAN_GYRO:      '/gan/gyro',           // f,f,f,f
} as const;

/** Port the relay listens on for MIDI echoes from the Max bridge. Separate
 *  from the 57121 relay→Max forward port so Max can have its own `[udpsend]`
 *  back without colliding. 57120 was SuperCollider; dropped 2026-04-20. */
export const MIDI_ECHO_PORT = 57122;

/** Positional vertex address: `/xk/vertex/1`..`/xk/vertex/8`. */
export function vertexAddr(i1to8: number): string {
  return `${OSC.VERTEX}${i1to8}`;
}

/** Positional complex address: `/xk/complex/1`..`/xk/complex/8`. */
export function complexAddr(i1to8: number): string {
  return `${OSC.COMPLEX}${i1to8}`;
}

/** All addresses as an array — used by tests to detect stray string literals. */
export const ALL_XK_ADDRESSES: readonly string[] = Object.values(OSC).filter(a =>
  typeof a === 'string' && a.startsWith('/xk/'),
);
