# Changelog

All notable changes to XenaKube are documented here.

## 2026-04-13

### Added
- **`max/tester.maxpat`** — reference Max patch wiring the documented 4-object chain (`udpreceive 57121` → `v8 xk_swam.js @autowatch 1` → `vst~ "SWAM Cello 3" 2` → `dac~`). Open this in Max to drive SWAM Cello 3 from a running relay.
- **`max/tester1.maxpat`** — debug-harness variant with extra message boxes (hand-fired `/xk/expr/scramble`, raw `midievent` CCs) and a `live.gain~` for bench-testing CC/midievent flow without the relay running.
- **`.gitignore`** — ignore `.DS_Store` and the external `maxmsp-mcp/` tooling (plus its `max/max_mcp*.js`, `max/package*.json`) which is a separate MCP server used while editing patches, not part of this project.

### Fixed
- **Max/SWAM pitches clamped to cello range** (`max/xk_swam.js`) — SWAM Cello 3 plays C2–F6 (MIDI 36–89). Generated pitches previously clamped to 24–96 (C1–C8), producing silent notes at the extremes (and, under V2 transpose of -12, pushing sieve pitches below C2). All pitch selection now folds into the cello window by octave transposition (preserving pitch class from the sieve) rather than hard-clamping, so out-of-range notes wrap up/down an octave instead of collapsing to the min/max. New `CELLO_MIN`/`CELLO_MAX` constants at the top of the file make the range easy to re-tune.

### Changed — Spell book revised to CFOP fundamentals (7 spells)

Boiled the spell list down from 12 algorithms to the 7 essentials needed to solve the cube under the CFOP method (Cross, F2L, OLL, PLL). Cross-checked algorithms against standard cubing references; fixed three that didn't match their canonical names.

**Corrected algorithms:**
- **sledgehammer**: `R' D' R D` → `R' F R F'` (the code's prior version was a valid commutator but not sledgehammer — different face and direction signature, not a rotation variant)
- **sune**: `R U R' U R U'` → `R U R' U R U2 R'` (the 6-move version didn't correctly cycle corners; Sune is canonically 7 moves ending in `U2 R'`)
- **anti-sune**: `R' U' R U' R' U2 R` → `R U2 R' U' R U' R'` (conventional anti-sune is the inverse of Sune)

**Removed (not CFOP fundamentals):**
- `hedge` (non-standard name, conceptually overlaps sledgehammer)
- `combo` (literally sexy + sledgehammer concatenated — redundant once both are first-class)
- `j-perm`, `u-perm-cw`, `u-perm-ccw`, `h-perm` (advanced PLL cases; T-perm + U-perm cover beginner 2-look PLL). `u-perm-ccw` retained as the single `u-perm` spell.

**Spell count**: 12 × 24 = 288 patterns → 7 × 24 = 168 patterns.

**Effect re-homing**: the staccato-burst effect previously bound to `combo` now fires on `u-perm`. All other effect mappings unchanged.

### Added
- **Max/SWAM bridge v2** (`max/xk_swam.js`) — each cube turn now triggers a musical **phrase**, not a single note
  - Per-complex-type phrase generators: C1 pizzicato cloud (2-5 plucked notes scattered ≤600ms), C2 legato run (2-3 notes), C3 sustained with expression swell, C4 harmonic ping, C5 wild glissando (two-note slide ≥5 semitones apart), C6 stepwise gliss walk, C7 sustained slide with drift, C8 ponticello tremolo
  - **Auto-release timer** — phrases fade out over 5 steps × 80ms based on the `duration` parameter; no more infinite sustain when the performer stops turning
  - **Velocity humanization** — ±15% random jitter + accent (+8) every 3rd turn, 10% chance of ±1 semitone microtonal shift, 0-30ms micro-delay between phrase notes
  - **Active notes tracking** — `state.activeNotes` array lets phrase/release logic cleanly release everything sounding
  - Expanded spell reactions: `sexy-move` bow sweep (bridge snap + peak expression), `oll-cross` harmonic ping, `combo` staccato burst (3-5 rapid notes), `sune`/`anti-sune` palette shifts, `t-perm` full reset

### Fixed
- **Glissandi/portamento now audible** — `legatoNote()` sends noteOn(new) **before** noteOff(old) with 20ms overlap, so SWAM Cello 3 engages portamento. Previous code killed the old note first, preventing SWAM from ever seeing two simultaneous notes to glide between.
- **Pizzicato registers reliably** — keyswitches now hold for 30ms (was instant on+off) giving SWAM time to register the articulation change.
- **Sledgehammer unfreeze releases held notes** — previously unfreezing left the note hanging; now `allNotesOff()` runs on unfreeze.

### Changed
- **Intensity map widened** — p/mp/mf/f/ff/fff expression values now 20/38/55/75/95/115 (was 15/28/45/64/83/102); velocity also tracked per intensity level (35-120)
- **Tilt → Expression curve** — now exponential (`val²`) and blended with base intensity (`baseExpr*0.3 + tilt²*97`), giving more dramatic and visceral dynamic shaping
- **Spin → Vibrato** — threshold at 0.15 before vibrato engages, exponential above (no vibrato at rest)
- **Deviation → Bow Pressure + Bow Speed** — wider range (20-127), exponential curve; deviation also modulates bow speed
- **Scramble → Bow Position** — wider range (5-120)
- **Tetra → Bow Sensitivity** — even=50, odd=110 (was 64/102)
- **Regime → Attack Ramp** — contemplative=slow(90), conversational=medium(50), burst=fast(10)

## 2026-04-09

### Added
- **Browser dashboard** (`public/dashboard.html`) — single-page live visualizer served at `http://localhost:3000`
  - 3D wireframe cube (Three.js) with vertex labels (K1-K8), tetrahedral orbit highlighting
  - Gyro quaternion drives cube orientation in real time
  - **Zero Gyro** button — calibrates current physical orientation as neutral
  - **OrbitControls** — mouse drag to rotate camera, scroll to zoom
  - K_i engine state panel: S4 element, path, tetrahedral orbit, permutation slots
  - C_i engine state panel: S4 element, cyclic phase
  - Vertex parameter cards (K1-K8): density, intensity, duration with intensity bars
  - Sound complex cards (C1-C8): color-coded by type with technique labels
  - Sieve pitch strip: 49 semitone cells (C2-C6) with active pitch highlighting
  - Move log: scrolling history with move name and state snapshot
  - Gyro quaternion display: 4-axis numeric values with bipolar bars
  - WebSocket auto-reconnect

### Changed
- **relay.js** — merged connect UI and dashboard into single page at `/`
  - Removed separate inline HTML connect page
  - Loads dashboard from `public/dashboard.html` via `fs.readFileSync`
  - Broadcasts full `XenaKubeState` JSON over WS to all clients on every state change
  - Turn events broadcast as `{type: 'state', data, move}`
  - Gyro events broadcast as `{type: 'gyro_state', data}`
  - Dashboard throttles gyro renders to `requestAnimationFrame`
- Gyro-to-Three.js coordinate mapping: swap Y/Z, negate X for correct yaw/pitch/roll
