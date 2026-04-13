# XenaKube — Roadmap

## Three Performance Regimes

The core design goal: the instrument should sound and behave differently depending on how fast the performer turns the cube. See `research_notes.md` "Performance Speed Regimes" for background.

| Regime | Turn rate | Musical character |
|--------|-----------|-------------------|
| **Contemplative** | < 0.3 Hz (~1 turn / 3–10s) | Each event distinct, full voice playback, structure audible |
| **Conversational** | 0.3–2 Hz (~1–2 turns/sec) | Events overlap, spells are deliberate gestures, texture builds |
| **Burst** | > 2 Hz (~3+ turns/sec, speedsolve) | Structure collapses into texture, aggregate parameters dominate |

---

### Phase 1: Turn-Rate Tracker

**Goal**: Detect which regime the performer is in. Expose it to the engine, relay, and dashboard.

**Where**: New module `src/turn-rate.ts`, wired into `engine.ts`.

- [x] **TurnRateTracker class** (`src/turn-rate.ts`)
  - Circular buffer of last 16 turn timestamps
  - `push(timestamp)` on every turn
  - `getRate(now): number` — turns/sec, exponentially weighted moving average (α=0.7, recent turns dominate)
  - `getRegime(now): Regime` — from rate thresholds with hysteresis
  - Hysteresis: 3 consecutive turns in new regime required for upward transitions; downward transitions are immediate
  - Decay: if no turn for 3s, regime falls back to contemplative
  - Thresholds: contemplative→conversational at 0.3 Hz, conversational→burst at 2.0 Hz; drop-back at 0.2 and 1.5 Hz

- [x] **Wire into engine.ts**
  - `this.turnRateTracker = new TurnRateTracker()` on engine
  - `onTurn()` calls `this.turnRateTracker.push(Date.now())`
  - `turnRate: number` and `regime: Regime` added to `XenaKubeState` (in `types.ts`)
  - Exposed in `getState()` → flows to OSC + WS

- [x] **OSC output** (`src/osc-output.ts`)
  - `/xk/rate` float (turns/sec)
  - `/xk/regime` string ('contemplative' | 'conversational' | 'burst')

- [x] **Dashboard indicator** (`public/dashboard.html`)
  - Regime badge in performance panel: green CONTEMPLATIVE / amber CONVERSATIONAL / red BURST
  - Turn rate value next to it (e.g. "1.3 t/s")

- [x] **Tests** (`test/turn-rate.test.ts`, 12 tests)
  - Rate calculation from timestamps
  - Regime transitions with hysteresis (up requires 3 consecutive, down is immediate)
  - Decay after silence
  - Edge cases: identical timestamps, buffer overflow, reset

---

### Phase 2: Contemplative Mode (refine what exists)

**Goal**: Current behavior is already close to contemplative. Polish it so each voice event is fully realized.

**Where**: `sc/xenakube.scd`, `src/voice-engine.ts`.

- [x] **Voice overlap handling**
  - Currently each `/xk/voice` kills the previous Routine. At slow rate this is fine.
  - Add a minimum voice duration: if a new turn arrives before the current voice has played for at least 0.5s, let it finish its attack phase before crossfading to the next. Prevents clipping at the contemplative/conversational boundary.

- [x] **Sieve mutation audibility**
  - At slow rate, sieve metabola (every 3 turns) should be highlighted. Consider a brief SC cue: a soft chime, pitch-bend, or filter sweep when `/xk/sieve` changes. Gives the performer feedback that the pitch field shifted.

- [x] **Scramble factor → SC**
  - Add `/xk/scramble` float (0–1) to `osc-output.ts`
  - SC receives it, maps to a global macro: e.g. reverb wet mix (solved=dry, scrambled=drenched) or master HPF cutoff (solved=full range, scrambled=thinned). Start with one simple mapping, tune by ear.

---

### Phase 3: Conversational Mode

**Goal**: Events overlap and blend. Spells are prominent. The performer builds texture through sustained engagement.

**Where**: `src/voice-engine.ts`, `sc/xenakube.scd`, `src/osc-output.ts`.

- [ ] **Polyphonic voice stacking**
  - In conversational regime, switch from "one voice replaces the last" to "voices stack with natural decay."
  - Voice engine emits the new voice event as usual, but SC doesn't kill the previous synth — instead, previous voices get a release envelope (2–4s fade). Multiple voices coexist.
  - Cap at 6–8 simultaneous synths to prevent CPU overload. Steal oldest voice when cap hit.

- [ ] **Expression OSC emission**
  - Wire expression processor output to OSC: `/xk/expr/tilt`, `/xk/expr/spin`, `/xk/expr/dev`, `/xk/expr/scramble` (all float 0–1)
  - Add to `osc-output.ts` — only emit on gyro updates, not on every turn
  - SC maps these to synthesis parameters: tilt → filter cutoff, spin → vibrato rate, deviation → detune amount

- [ ] **Spell-triggered synthesis events**
  - Wire `mode-manager.ts` spell effects (currently empty `applySpell()`):
    - `sexy-move` → toggle seq/poly
    - `sledgehammer` → toggle freeze
    - `sune` / `anti-sune` → shift palette (V1 ↔ V2)
    - `oll-cross` → trigger a sustained drone at current sieve root
    - `combo` → burst of all 8 voices simultaneously (one-shot poly event)
  - SC needs `/xk/spell` message (string name) to trigger a one-shot effect (cymbal swell, filter sweep, octave drop — something audible that marks the spell moment)

- [ ] **Dashboard: spell history trail**
  - Show spell detections as persistent markers on a timeline, not just toasts
  - At conversational rate, spells are frequent enough to form a visible rhythm

---

### Phase 4: Burst Mode

**Goal**: Individual voice events are meaningless at 5+ turns/sec. Switch to aggregate texture synthesis driven by macro parameters.

**Where**: New SC SynthDef(s), `src/osc-output.ts`, `relay.js`, `src/engine.ts`.

- [ ] **Aggregate state computation** (`src/engine.ts` or new `src/aggregate.ts`)
  - Compute per regime tick (not per turn — too fast):
    - `avgDensity`: mean of all 8 vertex densities
    - `avgIntensity`: mean intensity mapped to 0–1
    - `complexDistribution`: histogram of which complex types are currently assigned [count of C1..C8]
    - `turnRate`: from phase 1
    - `scrambleFactor`: already exists
    - `sieveDensity`: how many pitches in current sieve / total range (sparse vs dense field)
    - `recentSpells`: count of spells in last 2 seconds
  - Emit as `/xk/agg/*` OSC bundle at a fixed rate (~15 Hz), decoupled from individual turns

- [ ] **Burst SynthDef(s) in SC**
  - Design 1–2 new SynthDefs that take aggregate parameters as inputs:
    - `\xk_cloud`: granular texture — grain rate from turnRate, grain pitch from sieve centroid, grain scatter from scramble, density from avgDensity, spectral character from complexDistribution
    - `\xk_wash`: sustained drone/pad — pitch from sieve, brightness from scramble, movement from expression spin/tilt
  - These run continuously in burst mode. Individual `/xk/voice` messages are ignored (or fed as grain triggers).

- [ ] **Regime crossfade in SC**
  - SC needs a regime-aware manager:
    - Contemplative: individual Routines (current behavior)
    - Conversational: stacking Routines with release envelopes
    - Burst: fade out individual voices, fade in `\xk_cloud` / `\xk_wash`
  - Crossfade over ~0.5s on regime transition. Triggered by `/xk/regime` OSC message.

- [ ] **Scramble arc**
  - In burst mode, scramble factor becomes the master parameter:
    - scramble 1.0 (start of solve): dense, loud, chaotic, wide stereo, heavy reverb
    - scramble 0.0 (solved): sparse, quiet, pure, centered, dry
  - The solve IS the performance gesture — a 10–15s decrescendo from noise to clarity
  - Spells detected during solve leave acoustic residue: reverb tail freeze, pitch memory (sustained harmonic at spell's sieve pitch), or rhythmic imprint

- [ ] **Dashboard burst mode**
  - Switch from individual vertex/complex cards to aggregate visualization:
    - Waveform/spectrum view
    - Scramble arc progress bar (1.0 → 0.0)
    - Spell waypoints on the arc (cross → F2L → OLL → PLL markers)
    - Turn rate sparkline

---

### Phase 5: Integration & Polish

- [ ] **Smooth regime transitions**
  - Test with actual cube. Tune hysteresis thresholds by feel.
  - The conversational→burst boundary is the critical one: should feel like "kicking into gear," not an accidental glitch.
  - Consider: burst mode only activates if turn rate sustains above threshold for 1+ second (it's deliberate, not a double-tap accident)

- [ ] **Path B equivalent**
  - In Nomos Alpha, Path B interludes are sustained, freely composed pauses between formalized sections.
  - XenaKube equivalent: when the performer stops turning and holds the cube still, a "Path B" mode activates after ~5s of silence.
  - Gyro expression still active (tilt, spin). Sound sustains/evolves based on last state. The formalized structure pauses but the instrument still breathes.
  - Turning resumes → back to Path A (whichever regime the turn rate indicates).

- [ ] **SC polyphonic voice output**
  - Required for conversational mode. Currently only sequential is implemented in SC.
  - Need 8 parallel voice slots, each with its own SynthDef assignment, envelope, and pan position.

- [ ] **Update CLAUDE.md**
  - Remove speed regime and scramble-driven synthesis from "Not Yet Implemented"
  - Add regime system to Performance Model section
  - Document new OSC messages (`/xk/rate`, `/xk/regime`, `/xk/expr/*`, `/xk/agg/*`, `/xk/scramble`, `/xk/spell`)

---

## Dependency Graph

```
Phase 1 (turn-rate tracker)
  │
  ├── Phase 2 (contemplative polish) — can start in parallel
  │
  ├── Phase 3 (conversational) — needs Phase 1 for regime detection
  │     │
  │     └── Phase 4 (burst) — needs Phase 3 for voice stacking / spell wiring
  │           │
  │           └── Phase 5 (integration) — needs all above
  │
  └── Phase 2 scramble→SC can start immediately (no regime dependency)
```

Phase 1 is the foundation. Phase 2's scramble OSC output can happen in parallel since it's just adding a message. Phase 3 and 4 are sequential — conversational voice stacking must work before burst aggregate mode is layered on.
