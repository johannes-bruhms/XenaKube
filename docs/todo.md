# XenaKube — Roadmap

## Parallel track: SWAM Cello bridge refactor

Full diagnoses + phased plan in **`docs/revision_roadmap.md`**. Parameter/CC/KS authority: **`docs/swam_cello_reference.md`**.

- **Phases 0–5 — DONE**. Upstream voice firehose fix, panic/watchdog (D16/D17), SWAM KS model with stateful diffing (D1/D2/D12), `COMPLEX` config table (D5/D7), expression envelopes + tilt→bow-position (D4/D8/D15/D18), vibrato on CC 19 with EMA (D3/D6), spell restore via `setupComplex` (D11/D13/D14), Niklas detection (D19 detection only). **Next listening test required before Phases 6+.**
- **Phase 6 (partial, 2026-04-14)** — Sordino on freeze (CC 68, MIDI-Learn) and Sul Tasto/Pont on scramble thresholds (Bow Position bias via 2 s hysteresis) landed. Still pending: Alt Fingering on tetra, Bow Lift / Bow Start on spell color, Pizz Polyphony init.
- **Phase 7 (done, 2026-04-14)** — V2 fold window already widened per complex (`max(24, reg.lo − 12)`); CC 75 Attack Control spikes declared obsolete in v3.11 (preset-side mode selector).
- **Phase 8 (done, 2026-04-14)** — `noteOff(pitch, vel?)` signature extended; `state.noteOffVel` driven by `handleRate` (25 → 120 across turns/sec).
- **Niklas audio effect** — pick between C-cube 3-cycle / canon echo / commutator latch after first listen.

---

## Three Performance Regimes

The core design goal: the instrument should sound and behave differently depending on how fast the performer turns the cube. See `research_notes.md` "Performance Speed Regimes" for background.

| Regime | Turn rate | Musical character |
|--------|-----------|-------------------|
| **Contemplative** | < 0.3 Hz (~1 turn / 3–10s) | Each event distinct, full voice playback, structure audible |
| **Conversational** | 0.3–2 Hz (~1–2 turns/sec) | Events overlap, spells are deliberate gestures, texture builds |
| **Burst** | > 2 Hz (~3+ turns/sec, speedsolve) | Structure collapses into texture, aggregate parameters dominate |

---

### Phase 1: Turn-Rate Tracker — DONE

`src/turn-rate.ts` + engine wiring + `/xk/rate` + `/xk/regime` OSC + dashboard badge + 12 tests.

---

### Phase 2: Contemplative Mode — DONE

Voice overlap handling (min 0.5s), sieve metabola chime cue, scramble → SC reverb wet mix.

---

### Phase 3: Conversational Mode

**Goal**: Events overlap and blend. Spells are prominent. The performer builds texture through sustained engagement.

**Where**: `src/voice-engine.ts`, `sc/xenakube.scd`, `src/osc-output.ts`.

Done: expression OSC emission at 60Hz, spell → mode-manager wiring + `/xk/spell` OSC, spell book revised to 6 CFOP fundamentals (144 rotation variants), Max/SWAM pitch folding into cello range, Max/SWAM phrase generation + legato portamento + auto-release. SC OSCdef for `/xk/spell` and SC mapping of `/xk/expr/*` still pending.

- [ ] **Polyphonic voice stacking** (SC)
  - In conversational regime, switch from "one voice replaces the last" to "voices stack with natural decay."
  - Voice engine emits the new voice event as usual, but SC doesn't kill the previous synth — instead, previous voices get a release envelope (2–4s fade). Multiple voices coexist.
  - Cap at 6–8 simultaneous synths to prevent CPU overload. Steal oldest voice when cap hit.

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
Phase 1 (turn-rate tracker) — DONE
Phase 2 (contemplative polish) — DONE
Phase 3 (conversational) — in progress; SC poly stacking + dashboard trail remain
  │
  └── Phase 4 (burst) — needs Phase 3 SC poly stacking
        │
        └── Phase 5 (integration) — needs all above
```
