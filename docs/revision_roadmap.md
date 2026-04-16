# XenaKube → SWAM: Revision Roadmap

Converged plan for rebuilding `max/xk_swam.js` against SWAM Cello 3's actual control model. Derived from `docs/swam_cello_reference.md` (the authoritative parameter/CC/KS reference, extracted from the v3.8.0 user manual).

This document is the single source of truth for the SWAM-bridge refactor. Update it as phases complete or new findings change the plan.

---

## Why this refactor

Five user-observed failures in the current bridge motivate the rewrite:

1. **Playing techniques (pizz, harmonics, tremolo) don't toggle in SWAM.** Cube is sending messages, VST does not change articulation.
2. **Expression (dynamics) is hijacked by gyro tilt**, overriding what each complex type *should* demand dynamically.
3. **Vibrato jitters unmusically** at 60 Hz and does not contribute meaningfully.
4. **Constant rapid notes even when the cube isn't being turned**, including after the OSC cable is unplugged. Notes keep sounding indefinitely. This is the first thing to fix — until it's gone, no listening test for the others is valid.
5. **Portamento / glissando feels absent** on C5–C7, even though their CCs look right. Caused by (4): the voice-storm prevents any clean legato pair from reaching SWAM.

Below, each failure traces to a structural mismatch between the bridge and SWAM's model. Fixes are grouped so that **Phase 0** removes failures #4 and #5, the first phase alone removes #1, the next two remove #2 and #3, and subsequent phases leverage SWAM features that are currently unused.

---

## Prerequisites — configure in SWAM once, save as preset

Nothing in `xk_swam.js` will work until these are set. One-time operations in the SWAM GUI:

**Key Switches page**
- KS Octave = **C0** (places KS at MIDI 24–35, below pitch input range 36–89)
- KS MIDI Channel — note its value; call it `KS_CH` in code
- Pizz/C.Legno Polyphony = **Poly**
- All 12 KS toggles enabled

**Expressivity page**
- Vibrato Fade-In = 250 ms
- Right-click Vibrato Rate → MIDI Learn → assign to CC 19

**Bow page** — right-click each, MIDI Learn:

| Param | CC |
|-------|-----|
| Bow Position | 16 |
| Bow Pressure | 17 |
| Bow Pressure Accent | 18 |
| Bow Speed | 20 |
| Attack Ramp | 73 |
| Attack Control | 75 |

**Advanced → MIDI page** *(confirmed necessary 2026-04-14; see D20)*
- **Portamento Control = `CC (P.MaxTime)`** — NOT `Velocity (P.MaxTime)`. Our CC 5 writes are ignored in Velocity mode, which breaks every portamento-using phrase (C5/C6/C7).
- Portamento Max Time = 2.5 s (our per-complex `portamento.time` becomes `cc5/127 × 2.5 s`)
- Portamento Time base = 0.00
- Attack Control = `expression` or `mix vel. expr.` (CC 11 envelope drives attack character; see feature-flag note for CC 75)
- KS MIDI Channel = `2` (matches `KS_CH` in `max/xk_swam.js`)

**Play Modes → Left Hand page** *(confirmed necessary 2026-04-16; see D34)*
- **Bow Polyphony = `Mono`** — NOT `Poly` / `Auto`. With Poly/Auto, overlapping notes are split into a two-voice chord and portamento is never engaged, no matter how correctly Portamento Mode / Control / Time / velocity are set. The bridge's gliss phrases (C5/C6/C7) depend on low-velocity overlap → slide; in Poly/Auto they are silently reinterpreted as chords.

**Sanity check**: send CC 11 → Expression responds; CC 1 → Vibrato Depth responds. If not, MIDI-Learn them.

**Save as `xenakube_cello.swampreset`.**

Bridge constants (`KS_CH`, the CC numbers above) are defined once at the top of `xk_swam.js` and read by the rest of the code.

---

## Diagnoses & Fixes

### D1 — No pizzicato / harmonics / tremolo ever heard

**Defect**: The KS layout (`ARCO=24, PIZZ=25, TREMOLO=26, STACCATO=27`) treats each technique as its own KS note. SWAM doesn't work that way.

**Root cause**: SWAM's Play Mode is **one KS C + velocity** selecting Bow (40) / Pizz (80) / Col Legno (110). Harmonics and Tremolo are **latch toggles** on KS A and KS A#. Current code sends `keyswitch(24)` at velocity 100, which under SWAM's model is "Play Mode, velocity HIGH → Col Legno." `keyswitch(25)` hits KS C# (Bow Direction). Neither ever selects Pizzicato. "Staccato" isn't a KS — it's emergent from short notes + high velocity.

**Fix**:
- Replace `KS` with the full 12-switch map (see `swam_cello_reference.md` §2).
- `keyswitch(note, velocity, channel)` — accept channel + velocity args, send on `KS_CH`, hold 50 ms.
- Drop `KS.STACCATO`. Achieve staccato via short gate + high velocity + optional `KS.BOW_START`.
- **Stateful toggle tracking**: maintain `state.playMode ∈ {bow,pizz,col}`, `state.harmonics`, `state.tremolo`, `state.sordino`, `state.sulTasto`, `state.sulPont`, `state.altFing`. `setupComplex` diffs target vs current and fires KS only on change. Latch toggles must not re-fire when already in the target state — that inverts them.

### D2 — Harmonics and Tremolo CCs do nothing

**Defect**: `CC.HARMONICS = 22`, `CC.TREMOLO = 92`. Values written do nothing in SWAM.

**Root cause**: Harmonics and Tremolo are boolean techniques, controlled only via KS (or via MIDI-Learn on their GUI buttons — a setup we're not using).

**Fix**: Remove both from `CC`. Control via `keyswitch(KS.HARMONICS, 100, KS_CH)` and `keyswitch(KS.TREMOLO, 100, KS_CH)`, gated by D1 state diffing.

### D3 — Vibrato jitters

**Defect**: `handleExprSpin` writes CC 1 (Vibrato Depth) and CC 76 at 60 Hz directly from raw spin.

**Root causes (three, compounding)**:
1. 60 Hz CC 1 writes → vibrato breathes per frame, unmusical.
2. `VIBRATO_RATE: 76` — SWAM's default is CC 19; CC 76 goes nowhere.
3. No per-complex baseline — spin is the only source, so C3 (should have rich vibrato) and C1 (should have none) get the same behavior.

**Fix**:
- Correct `VIBRATO_RATE = 19`.
- Per-complex vibrato baselines (D5 COMPLEX table).
- Spin modulates baselines through an EMA (α≈0.08) + dead zone (spin < 0.15 contributes nothing to depth) + exponential curve. Smooth, complex-appropriate, with spin as color not override. This is the **musical mapping** dead zone — it shapes the curve. D18 handles the **transmission** dead zone (skipping MIDI writes when the cube is actually still). Keep both.
- Vibrato Fade-In = 250 ms is set in the SWAM preset (see Prerequisites), not via a runtime CC write — SWAM has no default CC binding for Fade-In.

### D4 — Expression hijacked by tilt; complexes lose their voice

**Defect**: `handleExprTilt` computes `baseExpr * 0.3 + tilt² * 97` and writes CC 11 at 60 Hz. Tilt dominates (97/127); intensity contributes ~17. Every complex sounds like "whatever tilt says."

**Root cause**: Live gyro is treated as the primary dynamic source. It should be secondary color.

**Fix**:
- **Delete the tilt → CC 11 mapping.** Expression is fully driven by the complex's envelope × intensity × path scalar.
- Each complex declares `exprEnv: { attack, peak, sustain, release }` as fractions of an intensity-derived peak. Phrase generators schedule CC 11 writes at envelope transition points (D8).
- **Repurpose tilt** to modulate Bow Position ±10 around the complex's baseline — timbral color, not dynamic override:
  ```js
  function handleExprTilt(val) {
      state.tilt = val;
      var cmx = COMPLEX[state.activeComplex];
      if (!cmx || cmx.bowPos == null) return;
      var jitter = (val - 0.5) * 20;
      cc(CC.BOW_POSITION, clamp(Math.round(cmx.bowPos + jitter), 0, 127));
  }
  ```
- Path V1/V2 scales the peak: V2 × 0.7 (softer palette per Xenakis).

### D5 — No per-complex personality

**Defect**: `setupComplex` sets a handful of CCs per case; phrase generators read from globals. No single source of truth for what each complex *sounds like*; envelope shape identical across C1–C8.

**Fix**: `COMPLEX` config table — one record per type:

```js
var COMPLEX = {
    1: { playMode:"pizz", harmonics:false, tremolo:false,
         exprEnv:{attack:1.0, peak:1.0, sustain:0.4, release:0.0},
         vibrato:{depth:0, rate:64}, bowPos:null,    // rate 64 is neutral; depth 0 disables
         attackRamp:10, attackCtrl:110 },
    2: { playMode:"bow", harmonics:false, tremolo:false,
         exprEnv:{attack:0.6, peak:1.0, sustain:0.85, release:0.4},
         vibrato:{depth:35, rate:50}, bowPos:70,
         attackRamp:40, attackCtrl:55 },
    3: { playMode:"bow", harmonics:false, tremolo:false,
         exprEnv:{attack:0.5, peak:1.1, sustain:0.9, release:0.6},
         vibrato:{depth:60, rate:45}, bowPos:110,
         attackRamp:85, attackCtrl:30 },
    4: { playMode:"bow", harmonics:true, tremolo:false,
         exprEnv:{attack:0.7, peak:0.75, sustain:0.6, release:0.3},
         vibrato:{depth:10, rate:60}, bowPos:85,
         attackRamp:30, attackCtrl:20 },
    5: { playMode:"bow", harmonics:false, tremolo:false,
         exprEnv:{attack:0.9, peak:1.1, sustain:0.7, release:0.3},
         vibrato:{depth:25, rate:70}, bowPos:55,
         portamento:{on:true, time:50}, attackRamp:30, attackCtrl:90 },
    6: { playMode:"bow", harmonics:false, tremolo:false,
         exprEnv:{attack:0.7, peak:1.0, sustain:0.85, release:0.4},
         vibrato:{depth:40, rate:50}, bowPos:64,
         portamento:{on:true, time:80}, attackRamp:50, attackCtrl:50 },
    7: { playMode:"bow", harmonics:false, tremolo:false,
         exprEnv:{attack:0.4, peak:1.05, sustain:0.9, release:0.7},
         vibrato:{depth:55, rate:40}, bowPos:115,
         portamento:{on:true, time:115}, attackRamp:90, attackCtrl:25 },
    8: { playMode:"bow", harmonics:false, tremolo:true,
         exprEnv:{attack:0.9, peak:1.15, sustain:1.0, release:0.3},
         vibrato:{depth:15, rate:80}, bowPos:5,
         attackRamp:20, attackCtrl:100 }
};
```

`setupComplex(n)` diffs each field against current state; fires KS or writes CC only on change; emits portamento on/off; stores `state.exprEnv = COMPLEX[n].exprEnv`.

### D6 — CC collisions once VIBRATO_RATE is corrected

**Defect**: Current code has `BOW_SPEED: 19`. When VIBRATO_RATE becomes 19, they collide.

**Fix**: `BOW_SPEED = 20`. MIDI-Learn in SWAM at that slot (see Prerequisites).

### D7 — Attack parameters fight each other

**Defect**: `setupComplex` sets attack ramp per complex → `handleVoice` overwrites from density → `handleRegime` overwrites again. Density's formula `(1-density/5)*127` is nearly random relative to musical intent.

**Fix** — single source of truth:
- Complex defines `attackRamp` baseline.
- Regime applies a multiplier: contemplative × 1.2, conversational × 1.0, burst × 0.5.
- Density does **not** write attack ramp.
- Attack ramp written once in `setupComplex` (on complex change) and once in `handleRegime` (on regime change); nowhere else.

Add **Attack Control** (CC 75) in parallel, per-complex from `COMPLEX[n].attackCtrl`. Onset bite (pizz, ponticello, sexy-move accent) distinct from onset duration (attack ramp).

### D8 — Expression envelope only exists for C3

**Defect**: C3 has a hand-coded swell; C1/C2/C4–C8 set CC 11 once and leave it.

**Fix**: `handleVoice` schedules the envelope for every complex based on `COMPLEX[n].exprEnv` and duration:

```js
function scheduleExprEnvelope(peakExpr, env, durMs) {
    ccForce(CC.EXPRESSION, Math.round(peakExpr * env.attack));
    scheduleAt(durMs * 0.25, () => ccForce(CC.EXPRESSION, Math.round(peakExpr * env.peak)));
    scheduleAt(durMs * 0.70, () => ccForce(CC.EXPRESSION, Math.round(peakExpr * env.sustain)));
    // release handled by scheduleRelease()
}
```

`peakExpr = INTENSITY_MAP[intensity].expr * pathScale` where `pathScale = path === "V2" ? 0.7 : 1.0`.

### D9 — V2 transpose is self-negating

**Defect**: V2 sets `transpose = -12`. `foldToRange` then bumps anything below C2 back up an octave. Low sieve pitches end up at the same MIDI number in V1 and V2.

**Fix**: V2-specific fold window allowing the cello's lowest octave:
```js
function foldToRange(pitch) {
    var lo = (state.path === "V2") ? 24 : CELLO_MIN;
    var hi = CELLO_MAX;
    while (pitch < lo) pitch += 12;
    while (pitch > hi) pitch -= 12;
    return clamp(pitch, lo, hi);
}
```

**Caveat**: MIDI 24–35 is our KS region. Safe as long as pitches go to perf channel and KS to `KS_CH` — which is already required by D1, so the widened fold window is the default plan.

**Fallback** (only if SWAM forces a shared KS/performance channel and D1's channel split can't be enforced): keep the normal fold window; use `KS.SECTION_SIZE` at vel MID (Trio) as the V2 "body" marker instead of transposition.

### D10 — Unused SWAM features that should be wired

Reference: `swam_cello_reference.md` §2 core KS table and §2 Bow Polyphony Page 2. KS B (Page 1) is Section Size; **KS B+C#** is a Page 2 combo (press KS B first, then KS C#) setting Pizz/C.Legno Polyphony — the two are distinct KS actions on the same root note, disambiguated by follow-up.

| SWAM feature | Wire to | Mechanism |
|--------------|---------|-----------|
| **KS B+C# Pizz/C.Legno Polyphony** (Page 2 combo) | Init — one-shot | Prefer preset. Fallback: fire KS B then KS C# at vel 80 in `loadbang`. Distinct from KS B Section Size below. |
| **KS F# Sordino** | Freeze state (sune spell) | Toggle on when frozen — colors the sustain |
| **KS G Sul Tasto** | Scramble latch | Toggle on when `scramble < 0.2` for ≥2 s |
| **KS G# Sul Ponticello** | Scramble latch | Toggle on when `scramble > 0.8` for ≥2 s (skip when C8 active) |
| **KS D# Alt Fingering** | Tetra orbit flip | Toggle each time tetra changes |
| **KS D Bow Change** | Regime | Vel 40 = Natural in contemplative, Vel 80 = Always in burst |
| **KS B Section Size** (Page 1) | Path | Vel 40 (Solo) in V1, Vel 80 (Trio) in V2 |
| **CC 18 Bow Pressure Accent** | Spell transients | Spike on `sexy-move`, `u-perm`; restore |
| **CC 75 Attack Control** (spell accents only — baseline already in Phase 2) | Spell transients | Spike then restore via `setupComplex(active)` |
| **Note-off velocity** | Turn rate | Fast turns → high note-off vel (short natural release) |

**Ordering gotcha**: KS B Section Size and KS B+C# Pizz Polyphony both begin by pressing KS B. If Section Size is re-asserted while the Pizz Polyphony Page 2 overlay is waiting for C#, the combo is broken. Implementation must enforce: **Pizz Polyphony is set exactly once at init and never re-sent**, while Section Size may re-send on path changes. Track Page 2 state with a short timeout so a stray KS B never strands the sub-menu open.

### D11 — Spell reactions leave CCs in wrong state

**Defect**: `sexy-move` hand-writes `CC.BOW_POSITION = 5, 60, then restore via handleExprScramble`. But `handleExprScramble` only restores scramble-driven bow position, not the complex's per-complex base.

**Fix**: After any spell CC mutation, restore by calling `setupComplex(state.activeComplex)` (now idempotent via D5 diffing) rather than a partial restore.

`u-perm` currently does `keyswitch(KS.STACCATO=27)` which under SWAM is KS D# (Alt Fingering toggle). Replace with: short note gates (60–100 ms), high velocity (100–120), optional `KS.BOW_START` toggle.

### D12 — `setupComplex` blindly fires KS every turn

**Defect**: Every `setupComplex` call fires `keyswitch(KS.ARCO=24)`. Under SWAM's real model that's KS C Play Mode at velocity 100 (HIGH) → Col Legno on every voice event.

**Fix**: Two-phase, cross-cutting. Phase 1 introduces the stateful KS diffing primitive (shared with D1). Phase 2 rewrites `setupComplex` to consume it via the COMPLEX table (D5). **Idempotency is mandatory** — without it, Harmonics/Tremolo/Sordino/etc. latch toggles invert on every voice event once D10 wires them up.

### D13 — `ccCache` suppresses writes that should replay

**Defect**: `cc(num, val)` early-returns when value matches the cached last write. After a spell uses `ccForce` to set BOW_POSITION=5 then restore, the cache may suppress subsequent `cc()` writes even though SWAM's internal value diverged.

**Fix**: `ccForce` already exists. Rule: **envelope/spell writes always use `ccForce`; continuous streams use `cc`.**

### D14 — `handleExprDev` overwrites bow pressure the complex just set

**Defect**: At 60 Hz, deviation writes `CC.BOW_PRESSURE` over the complex's baseline.

**Fix**: Deviation contributes a **modulation** bounded ±25 around `cmx.bowPressure` (new field in COMPLEX table). EMA α=0.1 over raw deviation.

### D15 — Reset initializes Expression mid-way (64), not silent

**Defect**: `bang()` writes `ccForce(CC.EXPRESSION, 64)`. First note starts loud before any envelope shapes it.

**Fix**: Reset to 0 (silent). First note's envelope ramps from attack fraction.

### D16 — `/xk/voice` fires at 10 Hz, not per-turn

**Defect**: The v8 receives `/xk/voice` ~10× per second regardless of whether the cube was turned. Each arrival calls `handleVoice()`, which `cancelPhrase()`s the previous phrase and dispatches a new one — producing the "constant stream of rapid notes at a constant rate" the performer hears.

**Root cause (upstream of `xk_swam.js`)**: `/xk/voice` is included in `stateToOsc()` (`src/osc-output.ts:70-73`), and `relay.js:209` emits the full state burst on every engine state change — including `engine.onGyro()` at BLE gyro rate (~10 Hz, `relay.js:388` → `src/engine.ts:197`). Voice events are therefore re-sent on every gyro packet with identical args, not only on actual turns.

**Fix** (relay / engine, not the Max bridge):
- Remove the `/xk/voice` message from `stateToOsc()` in `src/osc-output.ts`.
- In `relay.js`, extend the existing `engine.onVoice(output)` listener (currently WS-broadcast only, around line 258) to also `oscMax.send('/xk/voice', ...)` and `oscSC.send('/xk/voice', ...)`. Voice events now fire once, on actual voice transitions, as intended.
- SC's `/xk/voice` OSCdef needs no change — it already handles single-emission voice events.

**Fallback inside `xk_swam.js`** (if the upstream fix is delayed): in `handleVoice`, dedupe when `(vtxIdx, complexType, intensity)` equals the last call and the gap is < 500 ms. Cheaper to ship but masks the real bug.

### D17 — `cancelPhrase()` orphans sounding notes → stuck notes, no panic path

**Defect**: `cancelPhrase()` only cancels scheduled `Task`s — it does not send `noteOff` for notes already sounding. Combined with D16, every 10 Hz `handleVoice` call cancels the pending `noteOff` Tasks for the previous phrase's `noteOn`s, leaving them stuck in SWAM. Disconnecting the OSC cable does not send `bang` to v8, so no cleanup ever runs — SWAM keeps sounding the orphaned notes indefinitely (smoothly morphed by legato, which is why it sounds like "still sending notes").

**Fix**:
- `cancelPhrase()` must send `noteOff` for every pitch in `state.activeNotes` that isn't about to be re-attacked by the new phrase. Simplest: call `allNotesOff()` at the top of `cancelPhrase()` and let the new phrase re-attack from scratch. Acceptable because, post-D16, `cancelPhrase` only fires when the voice *actually* changes.
- **Inactivity watchdog (safety net, not primary cleanup)**. Once D16 + the `cancelPhrase` fix above land, every phrase's `scheduleRelease` task runs to completion even with no further input — releases are local timers in v8, independent of OSC. The watchdog only exists to catch relay crashes and unplug events. It must *not* truncate legitimate long notes.
  - Guard: panic (send `allNotesOff()` + reset CCs) only when **all** hold:
    - `state.activeNotes.length > 0`
    - `releaseTask === null` (no release pending)
    - `phraseTasks.length === 0` (no scheduled phrase events pending)
    - No `/xk/voice` received for ≥ 3 s
  - With these four conjoined, sustained C3/C7 notes with 10 s durations pass through cleanly (their `releaseTask` is set, so the second condition fails); only genuinely stuck orphan notes trip it.
- Optional: new `/xk/panic` OSC from relay's WS-disconnect handler, routed to `bang()` in v8. Preferred over watchdog-only because it's deterministic.

### D18 — 60 Hz CC firehose during rest

**Defect**: `handleExprSpin`, `handleExprDev`, `handleExprScramble` write their CCs at 60 Hz regardless of whether the cube is moving. Even with `ccCache` suppressing exact-duplicate values, spin-derived CCs 1/19/20/17 are noisy enough that successive values differ by 1, so writes still go through. SWAM's internal smoothers get nudged every frame → vibrato wobble, bow-pressure flutter, and (compounded with D16/D17) broken legato handoff.

**Fix** — spin-threshold **deadband** on continuous CCs:
- Add `state.spin` updated from `/xk/expr/spin`.
- In `handleExprSpin`/`handleExprDev`/`handleExprScramble`, when `state.spin < 0.02` for ≥ 200 ms, *skip the write* — last value holds in SWAM.
- Above threshold, throttle to 30 Hz (coalesce pairs of consecutive frames) — still smooth, half the traffic.
- Expression (CC 11) is driven by envelopes (D8) after Phase 3, not by the 60 Hz loop, so it's unaffected here.

This is the legitimate home for the performer's "spin threshold" instinct: **it gates CCs, not notes.** Notes stay turn-driven (D16).

**Relationship to D3**: D18 is the **transmission layer** (should this MIDI write go out at all?). D3's dead zone is the **musical mapping layer** (how does spin shape the vibrato curve?). They operate on different thresholds (D18 at 0.02, D3 at 0.15) and must both be applied — deleting either leaves audible artifacts. D18 protects SWAM's smoothers during rest; D3 keeps slow hand movement from producing tiny vibrato modulations.

### D19 — Spell book addition: Niklas (commutator family)

**Defect**: Current spell book is CFOP-only (6 spells). The commutator family is unrepresented. Niklas — `R U' L' U R' U' L` (7 moves) — is the archetypal 3-cycle commutator and the conceptual counterweight to CFOP in the cube-theory space the project draws on.

**Fix**: Add Niklas as the 7th canonical spell.
- `src/spells.ts`: entry `{ name: 'niklas', algorithm: ['R', "U'", "L'", 'U', "R'", "U'", 'L'], effect: 'commutator' }`. Expands to 24 rotation variants via the existing whole-cube-rotation machinery (brings total to 168 patterns).
- `src/mode-manager.ts`: stub `applySpell('niklas')` that logs + emits `/xk/spell niklas`. Effect deliberately deferred.
- `xk_swam.js`: `handleSpell('niklas')` case, effect TBD. Three candidates, pick after listening:
  1. **C-cube 3-cycle** — rotate three `cAssignments` positions (`[c0,c1,c2,...]` → `[c2,c0,c1,...]`). Maps structurally to Niklas's corner 3-cycle. Cheapest; lives in `mode-manager.ts`, not the bridge.
  2. **3-voice canon echo** — next voice's phrase is repeated twice with 200 ms / 400 ms offsets and optional ±7 st pitch shift. Bridge-only, no state change.
  3. **Commutator-mode latch** — toggle on; every subsequent turn produces a paired inverse turn 300 ms later (A B A' B' feel). Latches off on next Niklas detection. Most interesting musically but stateful.

Overlap caveat: Niklas's first four moves (`R U' L' U`) don't collide with any existing canonical algorithm's prefix, but verify the spell constructor's "different spells sharing an algorithm" check still passes after the 168-pattern expansion.

**Scheduling note**: D19's *detection* scope (spells.ts entry, mode-manager stub, `/xk/spell niklas` on the wire, dashboard badge) touches no SWAM-bridge code and has no dependency on Phase 1–4. It can land in parallel with Phase 0 as a standalone task. Only the *audio effect* decision (which of the three candidates) lives in Phase 5, after the bridge is stable enough to listen through.

### D20 — Portamento Control in Velocity mode silently ignores CC 5 *(RESOLVED 2026-04-14, preset)*

**Defect**: User reported no glissando on C5/C6/C7 even after Phase 5 landed. Our `setupComplex` writes `CC 5 (Portamento Time)` from the complex's `portamento.time` field, but no glide was audible.

**Root cause**: SWAM's `Portamento Control` (Advanced → MIDI page) has two modes — `Velocity (P.MaxTime)` and `CC (P.MaxTime)`. In Velocity mode, **portamento time is picked from note velocity** and CC 5 writes are ignored entirely. The default preset started in Velocity mode. Every "Portamento Time = …" line in our code was a no-op.

**Fix**: preset-side — flip to `CC (P.MaxTime)`. Confirmed working after the switch (glissando responds to CC 5). Now documented in Prerequisites. No code change needed.

**Lesson**: when a CC write appears correct on the wire but produces no audible effect, check whether the SWAM page has a mode selector that reroutes that param. Velocity-vs-CC selectors exist on Portamento and Pizz/C.Legno Control at minimum.

### D21 — Bow Position tilt modulation imperceptible *(RESOLVED 2026-04-14)*

**Defect**: After Phase 3 reassigned tilt → Bow Position ±10, the audible effect was "random small jitter of no consequence" (user report). The modulation was drowned by the baseline; the cube's orientation produced no perceivable timbral change.

**Root cause**: ±10 on a 0–127 CC is ~8% swing — smaller than SWAM's smoothing + the complex-to-complex baseline differences.

**Fix**: widen tilt → Bow Position modulation to **±30** in `handleExprTilt`. Now sweeps audibly between sul tasto and sul ponticello regions around the complex's baseline. `cc()` clamps to 0–127 so out-of-range values at baseline extremes are absorbed.

### D22 — Phrase generators too sparse for "cloud / swarm" aesthetic *(RESOLVED 2026-04-14)*

**Defect**: C3/C4/C7/C8 were single-note phrases. User brief is that each vertex-event should be a stochastic micro-phrase capable of "clouds" and "swarms," not one note.

**Root cause**: Phase 2's initial phrase generators kept sustained complexes as one held note by design (C3/C4/C7/C8). That choice removed per-complex density variation entirely and under-delivered on the algorithmic-gesture promise.

**Fix**: `phraseCount(baseLo, baseHi)` helper in `max/xk_swam.js` scales counts by `INTENSITY_MAP[intensity].density × clamp(0.6 + state.density × 0.25, 0.6, 1.8)`. Every phrase generator now uses it:
- C1: 2–5 → scales up to ~8 on fff
- C2: 2–4 (5 in burst) scaled
- C3: 1 main + 0–2 grace notes on f+
- C4: 2–5 flageolet cloud (was single note)
- C5: 1 + 2–3 compound gliss segments on fff
- C6: 3–6 stepwise walk
- C7: 1 main + 1–3 micro-drifts
- C8: 2–4 re-bows on one pitch (SWAM tremolo KS still layered)

State gains `intensity` (last received label) so phrase generators can read the density scalar without threading it through every call.

### D23 — Missing intensity/vertex → timbre contrast *(RESOLVED 2026-04-14)*

**Defect**: Intensity only drove Expression peak + note velocity. Bow pressure was a pure complex baseline. Pitch register was purely sieve + V2 transpose — nothing localized to a complex's character (pizz sat in the same window as harmonics).

**Root cause**: Phase 2's `COMPLEX` table didn't include per-complex pitch register bounds, and `INTENSITY_MAP` didn't include a bow-pressure scalar. The performer had no way to make "fff C8 ponticello" feel different in the body from "p C3 sustained" beyond volume.

**Fix**:
- `INTENSITY_MAP` gains `bowMult` (0.70 at p → 1.45 at fff). `handleVoice` writes `cmx.bowPressure × bowMult` and stores it as `state.bowPressureBase`. `handleExprDev` rebases its ±25 modulation off this new baseline instead of `cmx.bowPressure`.
- `COMPLEX[n].register = { lo, hi }` per complex (C1 36–72, C2 40–64, C3 36–55, C4 60–84, C5 36–84, C6 43–67, C7 36–52, C8 60–81). `pickPitch` passes these bounds to `foldToRange(pitch, lo, hi)`. V2 shifts `lo` down an octave but keeps `hi` pinned to the complex's natural top, so V2 widens the floor for drones without pushing harmonics into the bass.
- `foldToRange` now takes optional lo/hi (backwards-compatible).

### D24 — Harmonics and Tremolo KS never fire during performance *(RESOLVED 2026-04-14 via D27)*

**Defect**: User reported no harmonics, no tremolo ever audible. Play Mode KS (Bow / Pizz) visibly lit up; Harmonics and Tremolo KS did not.

**Root cause** (was upstream-hypothesis, turned out to be bridge-side): the bridge's `KS` map was built against the SWAM Cello 3 **v3.8** reference. The running VST is **v3.10**, which renumbered the KS plane. Bridge was sending:

| What the bridge thought | What v3.10 actually heard |
|------|------|
| KS 33 = HARMONICS (latch toggle) | KS 33 = Tremolo Mode (preset-controlled, no latch behavior) |
| KS 34 = TREMOLO (latch toggle) | KS 34 = unassigned on base page |

So C4's "harmonics on" wrote Tremolo Mode (no audible change because Tremolo itself was off), and C8's "tremolo on" wrote a no-op KS. Hence "Bow / Pizz lights up but never harmonics or tremolo" — Play Mode (KS 24) was unchanged between v3.8 and v3.10, so it kept working.

**Fix** (D27 migration):
- KS 30 = Harmonics in v3.10 (vel-4 selector: Off / Octave / Octave+5th / Control)
- KS 32 = Tremolo in v3.10 (vel-3 selector: Off / Slow / Fast)
- COMPLEX[4].harmonics = HARMONICS.OCT
- COMPLEX[8].tremolo = TREMOLO.FAST
- setupComplex calls `setEnum(field, ks, target, optionCount)` instead of `setToggle`

**Listening test still required** to confirm C4 + C8 audibly fire post-migration; if symptoms persist after the migration, the original upstream-hypothesis (voice engine never reaches complex 4/8) is the next thing to audit.

### D27 — SWAM Cello 3 v3.8 → v3.10 KS plane migration *(RESOLVED 2026-04-14)*

**Defect**: bridge's KS map was built against v3.8 reference, but running VST is v3.10. v3.10 changes:
1. Most KS moved from **latch-toggle** to **velocity-selector** (3- or 4-option) using SWAM's KS Velocity Remap bands.
2. Sordino, Sul Tasto, Sul Ponticello, and Section Size were removed from the KS plane entirely (Sordino → GUI/CC-only; Sul Tasto/Pont → driven by Bow Position CC 16; Section Size → concept gone).
3. New KS slots: **KS D = Gesture Mode** (Expression / Bipolar / Bowing). If accidentally flipped to Bipolar/Bowing, CC 11 is silently reinterpreted as bow direction/displacement — Expression envelope and portamento feel both break with no error.

**Fix**:
- New v3.10 `KS` map (see `docs/swam_cello_reference.md` §2 + §9, `CLAUDE.md` Keyswitches section).
- `velForOption(idx, n)` helper picks centred velocities inside KS Velocity Remap bands.
- `setEnum(field, ks, target, optionCount)` replaces `setToggle` for vel-select KS; diffs by option index so no inversion risk.
- `HARMONICS = {OFF, OCT, OCT_5TH, CTRL}` and `TREMOLO = {OFF, SLOW, FAST}` enums on COMPLEX table.
- `bang()` pins **Gesture Mode = Expression** explicitly to defend against drift / preset confusion.
- `state.sordino / sulTasto / sulPont / sectionSize` fields removed; replaced by `gestureMode / altFing / keepBowDir`.
- Stale `setSectionSize` helper deleted; sune freeze still uses `CC.SUSTAIN_PEDAL` (untouched by migration).

**SWAM preset additions** (see Prerequisites): pin Gesture Mode at instantiation; audit that no sample contains a stuck `KS A#` (page-2 unassigned) from the old code path.

### D34 — C5 / C6 / C7 legato phrases never engage glissando *(RESOLVED 2026-04-16)*

**Defect**: Performer report — C5 "wild gliss" NEVER glisses, C6 "ord. gliss" plays stepwise discrete notes with no slide, C7 sounds like held bow with no micro-drift. Portamento CCs (65 on, 5 time) were writing correctly; preset was in CC (P.MaxTime) mode per D20. The phrase generators `phraseC5` / `phraseC6` / `phraseC7` all called `legatoNote(humanPitch(...), humanVel(vel))` — full intensity-scaled velocity 50–120 — on every overlap note.

**Root cause**: **Bow Polyphony was `Poly` / `Auto` in the SWAM preset.** With non-Mono polyphony, SWAM interprets a second note that overlaps the first as a **chord voice**, not as a continuation of the same monophonic line — so there is no single line for the portamento engine to slide along. Every other layer of the stack (Portamento Mode ≠ Off, Portamento Control mode, CC 65/5 writes, overlap timing, note velocity) becomes irrelevant once the overlap is split into two independent voices. This is why D20's CC-mode flip, D33's CC 11 slew, and any amount of portamento-time tuning never surfaced any slide: the gliss path was gated off upstream at the polyphony decision.

Complicating matters, SWAM's musical-interpretation rule (`docs/v3.10-musicalinterpretation.pdf` p. 105) requires the overlapping second note to carry a **low Note-On velocity** for Velocity-mode portamento-control — a high-vel overlap is instead interpreted as slurred legato (smooth timbre, no pitch sweep). In Mono + CC-mode the CC P.MaxTime value drives the slide; in Mono + Velocity mode the low-vel overlap is the trigger. Either way, **Mono is the prerequisite**, and our phrase generators were shipping full intensity-scaled velocity (50–120) on every overlap — so even with polyphony corrected we would have needed a low-velocity overlap for Velocity-mode setups.

**Fix**: two parts — one preset-side, one code-side.

1. **Preset (owned by SWAM)**: Bow Polyphony → `Mono`. Added to Prerequisites. Without this, nothing below matters.
2. **Code (`max/xk_swam.js`)**: new `glissNote(pitch)` helper wraps `legatoNote(pitch, GLISS_VEL)` with `GLISS_VEL = 18` (below SWAM's Velocity-mode slide threshold). The first note of each phrase still uses `legatoNote(humanPitch, humanVel(vel))` to establish the attack character; every subsequent overlapping note in `phraseC5` / `phraseC6` / `phraseC7` calls `glissNote`. Dynamics remain driven by CC 11 Expression (via `rampCC`, D33), so the low-velocity overlap is inaudible as a dynamic dip. This keeps the bridge compatible with both Velocity-mode and CC-mode setups — in CC-mode the velocity value is ignored but the overlap still needs Mono to land on a single slidable voice.

**Verification**: listening test — land on C5 at any intensity; the 2–3 segment phrase should audibly slide between pitches rather than play as discrete notes or chord dyads. C6 walks should hear stepwise portamento between adjacent sieve notes. C7 drifts should hear a gentle sigh within ±3 semitones of the sustained pitch. If any phrase plays as a two-note chord, Bow Polyphony is not Mono — check the preset first, not the code.

### D33 — CC 11 step-writes produce audible Expression jumps; no slew *(RESOLVED 2026-04-16)*

**Defect**: `scheduleExprEnvelope` used three hard `ccForce(CC.EXPRESSION, …)` writes (attack, peak at 25 %, sustain at 70 %) and `scheduleRelease` faded to 0 in five 80 ms step-writes. Each write landed as an instantaneous CC 11 value, so SWAM's Expression climbed in audible stair-steps — most obvious on long `fff` contemplative phrases where the attack-to-peak jump was ~20–30 MIDI ticks inside 200 ms. The performer's request: ramp CC 11 between envelope targets, and let the ramp duration vary by complex and regime.

**Fix**: generic per-CC slew limiter `rampCC(num, target, durMs)` in `max/xk_swam.js`:
- Cancels any prior ramp on that CC via `cancelCCRamp(num)`.
- Walks `ccCache[num] → target` in ~15 ms ticks, `steps = max(1, round(durMs / tickMs))`.
- Each tick is a `Task` wrapping `ccForce(num, interpolated)`; the last tick writes the exact target. Degrades to a single `ccForce` for `durMs ≤ 0` or when start === target.

`scheduleExprEnvelope` rewrites each of the three stage targets through `rampCC(CC.EXPRESSION, …)`; `scheduleRelease` replaces the 5-step fade with a single slewed ramp to 0, then `allNotesOff` scheduled `fadeMs + 20` later. Per-stage durations come from the complex's `exprEnv.{attackRampMs, sustainRampMs, releaseRampMs}`, scaled by `REGIME_EXPR_RAMP_MULT = { contemplative: 1.5, conversational: 1.0, burst: 0.4 }`.

Per-complex ramp shapes (attack / sustain / release ms):
- C1 pizz — 2 / 40 / 60 (snappy, near-zero slew)
- C2 arco — 45 / 120 / 140
- C3 long arco — 80 / 180 / 220
- C4 harmonics — 30 / 90 / 120
- C5 porta-short — 35 / 100 / 120
- C6 porta-mid — 55 / 140 / 160
- C7 porta-long — 100 / 200 / 260
- C8 ponticello tremolo — 20 / 80 / 100

`cancelPhrase` calls `cancelCCRamp(CC.EXPRESSION)` so a fresh voice never fights the prior phrase's in-flight slew.

**Verification**: listening test — long `f`/`ff` C3 or C7 phrase in contemplative regime should sound as a smooth crescendo, not a staircase. Rapid burst-regime turns should still feel immediate (attack ramp × 0.4 ≈ 14–40 ms). Panic (`/xk/panic`) and cube pause → all ramps cancel, notes silence cleanly.

### D32 — Tremolo rate is static (Slow/Fast binary only) *(RESOLVED 2026-04-16)*

**Defect**: SWAM v3.10 exposes `Tremolo` via KS G# as a 2-band velocity-select (Slow / Fast) with default Off — no continuous rate control on the KS plane. Bridge wired C8 to FAST via `CC.TREMOLO = 79` (D31), but the rate itself was whatever the SWAM preset had baked into `Tremolo Min Speed`. Result: every C8 voice tremolo'd at the same speed, uncorrelated with complex, intensity, or path.

**Opportunity**: SWAM PDF `v3.10-musicalinterpretation.pdf` p. 106 confirms Tremolo rate is governed by the `Tremolo Min Speed` slider when `Tremolo Mode = Hz`. SWAM KS PDF p. 102: *"All parameters controlled by the Key Switches can be controlled by MIDI Control Change, Aftertouch and NRPN messages as well."* Extends to GUI sliders — right-click → MIDI Learn binds any slider to a CC.

**Fix**: treat Tremolo Min Speed as per-step automation, composed per complex (like Bow Position / Bow Pressure today):
1. `CC.TREMOLO_RATE = 80` (new MIDI-Learn slot) + `HAS_TREMOLO_RATE` feature flag.
2. Each `COMPLEX[n]` record carries a `tremoloRate` (0–127) baseline: C1 40, C2 45, C3 35, C4 55, C5 50, C6 50, C7 40, C8 95.
3. `INTENSITY_MAP` adds a `tremRateMult` column (p 0.85 … fff 1.22) so fff pushes the rate ~22 % faster than p.
4. Path V2 applies a × 0.85 scalar, matching the softer-palette mood.
5. `setupComplex(n)` writes the baseline with `ccForce(CC.TREMOLO_RATE, cmx.tremoloRate)`; `handleVoice` rewrites per voice as `clamp(cmx.tremoloRate × tremRateMult × pathTrem, 0, 127)`. `bang()` initialises to 50.

**Setup required in SWAM** (one-time, save preset): Play Modes → Right Hand → right-click `Tremolo Min Speed` → MIDI Learn → send CC 80 → save. Confirm `Tremolo Mode` (KS A) = **Hz** so the slider is the direct rate control (Sync/Sync-Acc bind to host BPM and ignore the slider for the live rate). Flip `HAS_TREMOLO_RATE = false` if the MIDI-Learn step is skipped — the per-voice write becomes a no-op and the slider stays at whatever value was last set by hand.

**Verification**: listening test — C8 voices at intensity p vs fff should tremolo at audibly different rates; path V2 on C8 should slow vs V1. Spells that flip tremolo on for a non-C8 complex should land at that complex's composed rate rather than C8's FAST value.

**Follow-up 2026-04-16** — the per-voice `ccForce` was shipping the same computed value (`95 × intMap.tremRateMult × pathTrem`) on every C8 voice at steady intensity / path, so SWAM had nothing to redraw and the slider *looked* frozen even though the CC was being sent. Added ±8 % per-voice jitter (`0.92 + random() * 0.16`) in `handleVoice` so the slider breathes visibly; the jitter doubles as musical microvariation in the tremolo rate (matches the Xenakian stochastic aesthetic). Added a `log("tremRate CC80 = … (Cn base=…)")` so the Max console shows the per-voice shipped value for next-time diagnostics.

### D31 — KS F# / KS G# are 2-band with default-Off; Harmonics + Tremolo must route through CC *(RESOLVED 2026-04-15)*

**Defect**: D24 → D30 all left the same underlying misunderstanding untouched — that KS F# (Harmonics) is a 4-option velocity-select and KS G# (Tremolo) is a 3-option velocity-select with Off as a selectable low-velocity band. User reports that across all three prior "fixes" (D27 KS migration, D28 sync guard, D29 interleave + defensive, D30 revert) "harmonics and tremolo still don't work at all, same symptoms remain."

**Actual SWAM behavior** (from the official v3.10 Key Switches PDF, `docs/v3.10-keyswitches.pdf` pp. 100–102):

```
F# = Harmonics
  • Off (default)                ← default state of the instrument, not a KS band
  • Low Velocity  = 2nd harmonic
  • High Velocity = 3rd harmonic
Note: it's not possible to control the 4th harmonic through Key Switches

G# = Tremolo
  • OFF (default)                ← same
  • Low Velocity  = Slow
  • High Velocity = Fast
```

The tell: every genuine 3-opt KS on the same pages explicitly lists **Low / Mid / High Velocity** (Play Mode, Gesture Mode, Alt Fingering, Tremolo Mode). F# and G# list only **Low / High**. "Off (default)" is a bullet at the top because it's the instrument's initial state — not because vel ~20 selects Off.

**Consequence**: sending our "OFF" velocities (Harmonics 16, Tremolo 21) landed inside the **Low** band and silently selected **2nd harmonic / Slow tremolo**. C4 Harmonics-ON (vel 48) and C8 Tremolo-ON (vel 106) fired correctly — so the ON edges worked — but every subsequent non-C4/C8 complex re-selected 2nd / Slow instead of turning the effect off. To the performer this looked like "harmonics and tremolo never fire correctly" because the effect decoupled entirely from complex identity.

**Why D27–D30 didn't catch it**: D27 correctly moved KS numbers from v3.8 → v3.10 (F#→Harmonics, G#→Tremolo), but inherited the wrong option-count assumption. D28's KS sync guard ensured SWAM matched our state — but our state was lying, claiming OFF while SWAM was at 2nd. D29's interleave guard and defensive re-assert were both real bugs, just not *this* bug. D30's revert of D29's defensive re-assert was also correct (it caused a new glitch) but left the core misunderstanding in place.

**Fix**: route Harmonics and Tremolo through CC, not KS. PDF p. 102: *"All parameters controlled by the Key Switches can be controlled by MIDI Control Change, Aftertouch and NRPN messages as well, through the Controller Mapping section."* CC gives clean access to all 4 Harmonics states (including the `4 Control` mode that KS can't reach per the PDF note) and all 3 Tremolo states including Off.

Implementation in `max/xk_swam.js`:
1. `CC.HARMONICS = 78`, `CC.TREMOLO = 79`.
2. Feature flags `HAS_HARMONICS_CC` / `HAS_TREMOLO_CC` (default `true`). `hasCC` gates writes so users who haven't MIDI-Learned yet can flip false and fall back to the (broken-but-familiar) KS path.
3. `HARMONICS_CC_VAL = [16, 48, 80, 112]` — band centers for SWAM's 4-way CC quantization. `TREMOLO_CC_VAL = [21, 64, 106]` — 3-way band centers.
4. New helpers `setHarmonics(target)` / `setTremolo(target)` encapsulate the CC-preferred / KS-fallback switch and update `state.{harmonics,tremolo}` so existing diffing still works. Replaces the 3 `setEnum("harmonics"|"tremolo"…)` call sites (`setupComplex`, oll-cross spell case, `bang()`).

**Setup required in SWAM** (one-time, save preset): right-click the Harmonics selector → MIDI Learn → send CC 78 from bridge or any MIDI source. Repeat for Tremolo → CC 79. Without this, flip both `HAS_*_CC` flags false — bridge falls back to KS and at least fires ON for C4/C8 (but still can't turn off).

**Verification**: listening test — play a sequence that visits C4 then C1 then C4 then C1. Harmonics should be heard only during C4 voices, silent during C1. Same test for C8 → C1 → C8 → C1 with Tremolo.

### D29 — Harmonics + Tremolo glitch on/off on rapid complex changes *(RESOLVED 2026-04-14)*

**Defect**: D27's v3.10 KS migration and D28's startup guard landed, and yet the user still reports "harmonics and tremolo don't work properly — they still glitch on/off, most of the time not firing correctly." Two orthogonal causes, neither addressed by D27/D28.

**Root cause A — stale noteOff interleave**: `keyswitch(note, vel)` schedules a noteOff for the same note 50 ms later at the same velocity. SWAM's v3.10 velocity-select KS re-read velocity on noteOff, so the scheduled noteOff "re-selects" the option on release. But when a second keyswitch on the same KS note fires inside that 50 ms hold window (common on rapid C1↔C4 or C1↔C8 complex swaps at 3-5 turns/s), the *first* keyswitch's stale noteOff still lands ~50 ms later at the *old* velocity — silently re-selecting the old option after the new noteOn already flipped state. The bridge thinks SWAM is at the new option; SWAM has been yanked back to the old one. Every subsequent voice event into the "same" complex then diff-returns and never resyncs.

**Root cause B — diff-suppression hides SWAM drift**: Once `state.harmonics === target`, `setEnum` returns early. No re-assert happens on subsequent voice events into the same complex. Anything that drifts SWAM's real selection (cause A above, preset reload, user touching the GUI, `autowatch` reload mid-session, a subtle missed KS) silently desyncs our model from SWAM until the *next* complex change — which might be many turns away. Symptom: "works sometimes, not others", weighted toward "not firing correctly".

**Fix**:
1. **`ksPending[note]` interleave guard in `keyswitch()`**. Track the scheduled noteOff task per KS note. When a new `keyswitch(note, ...)` fires with a pending noteOff on the same note: cancel the task and fire a noteOff *immediately* at the *new* velocity (not the stale one), before the new noteOn. This (i) releases the held key so the fresh noteOn isn't a duplicate-while-held, (ii) ensures any SWAM re-read of noteOff velocity lands on the current selection, not the old one.
2. **Defensive Harmonics + Tremolo re-assertion in `handleVoice`**. ~~Force-write KS F# and G# on every voice event, bypassing `setEnum`'s diff.~~ **Superseded by D30** — the defensive re-assert caused a new glitch (voices on non-C4/C8 complexes rewrote Harmonics/Tremolo OFF mid-note). Interleave guard (fix 1) retained.

**Verification**: listening test — rapid alternation C4 ↔ C1 and C8 ↔ C1 at 3-5 turns/s should produce clean harmonics/tremolo on every C4/C8 voice and clean normal bow on every C1 voice, with no residual tremolo "flicker" surviving into C1 and no harmonics dropouts during repeated C4 entries.

### D30 — Harmonics/Tremolo flash ON→OFF within a single turn *(RESOLVED 2026-04-15)*

**Defect**: User reports harmonics and tremolo "flashing on and off instantly" on certain turns — the technique fires, then silences mid-note. `max/ks_logger.js` capture confirmed: every `handleVoice` call emitted a HARMONICS+TREMOLO KS pair at the *new voice's* complex values (typically OFF for C1/C2/C3/C5–C7), independently of whether the complex changed. When a voice into C1 followed a still-sounding C8 tremolo note (release scheduled by `phraseC8`), the C1 voice's defensive write selected TREMOLO=OFF while the previous note was still bowing — audible as a 30–600 ms tremolo cutoff before the old note finally released. Same pathology for C4 harmonics.

**Root cause**: D29's fix 2 — the defensive `keyswitch(KS.HARMONICS, …)` / `keyswitch(KS.TREMOLO, …)` block in `handleVoice` (written after D29 landed) bypasses `setEnum`'s diff. It was added to paper over drift cases (preset reloads, GUI touches) that D28's `ksForceCount` and D29's interleave guard already handle correctly. The log shows every voice event carried the defensive pair, so any voice-cycling through mixed-complex phrases repeatedly rewrote the KS under still-sounding notes.

**Fix**: Delete the defensive block in `handleVoice` (`max/xk_swam.js` ~lines 901-912). HARMONICS and TREMOLO are now written only by `setupComplex` via `setEnum`, which fires exactly when the target option index changes. D28's `ksForceCount` still force-writes for the first 3 voice events after `bang()`; D29's `ksPending` interleave guard still protects against stale-noteOff re-selection on rapid complex changes.

**Verification**: listening test — C8 tremolo note followed by a C1/C2 voice should hear tremolo sustain for the C8 note's full duration, not cut off when the next voice fires. Same for C4 harmonics → any non-C4 voice. Confirm via `ks_logger` dump: every KS event should correspond to an actual complex change or startup force-write, never a defensive re-write.

### D28 — KS sync guard: per-KS velocity overrides + force-write on reset *(RESOLVED 2026-04-14)*

**Defect**: Two silent drift modes around `setEnum` / SWAM's KS Velocity Remap. (a) `velForOption(idx, optionCount)` returns the *centre of the even band* — correct only while SWAM's Velocity Remap bands remain at their factory positions. A user or preset that shifts a band boundary causes our "centre" velocity to fall in the neighbouring option's bucket, silently mis-selecting. (b) After `bang()`, selector state is nulled so the first `setEnum` for each KS fires — but if SWAM's own state *also* differs (e.g. preset loaded a non-default value the bridge isn't aware of, or autowatch reloaded mid-session), the next voice event with the same target option diff-suppresses and SWAM never gets a re-assert.

**Fix**:
1. **Per-KS velocity overrides**. New `KS_VEL_OVERRIDE` table in `max/xk_swam.js` keyed by KS note (D=26, F#=30, G#=32). Each entry is an array indexed by option index, hand-audited against SWAM's "KS Velocity Remap" editor. New helper `velForKS(ks, idx, optionCount)` checks overrides first, falls back to `velForOption`. `setEnum` routes through `velForKS`.
2. **Force-write KS for first N voice events after reset**. New `state.ksForceCount` (initialized to 3 in `bang()`) + `state.forceKS` flag. `handleVoice` decrements `ksForceCount` and sets `forceKS = true` for the call; `setEnum` / `setPlayMode` bypass their `state.*` diff when `forceKS` is set; `handleVoice` force-calls `setupComplex(complexType)` when forcing even if the complex hasn't changed. After 3 voice events the guard releases and normal diff-suppression resumes.

**Verification**: listening test — after `bang()` → 3 turns into different complexes, confirm C4 harmonics and C8 tremolo audibly fire on the first event into each (not only on a subsequent change).

### D25 — Ghost-cube calibration doesn't feed back to engine *(OPEN)*

**Defect**: User rotates the ghost cube in the dashboard; no change to `deviation`, no change to which S4 element the engine believes the gyro is snapped to. The ghost's rotation is *visual only*. Consequence: the rendered K/C labels and overlays can diverge from the engine's actual snap target without the performer seeing anything change.

**Root cause**: `public/dashboard.html:1075` defines `ghostViewOffset` and applies it at line 1301 as `ghostGroup.quaternion = ghostViewOffset × calibratedSnap`. This is a render-side post-multiply. It never travels back to `relay.js` or the engine. The engine's `src/quaternion.ts` computes `nearestS4(rawGyro)` and the resulting deviation from the raw BLE quaternion alone.

**Design intent per user**: the ghost cube rotation is meant to act as a **calibration offset** — "rotate the ghost to match where I'm holding the cube" — that persistently offsets the engine's snap computation so the rendered and computed S4 elements agree with the performer's felt orientation.

**Fix sketch**:
1. Dashboard: on `rotateTarget === 'ghost'` gesture commit, serialize `ghostViewOffset` as a quaternion and send over WS as `{ type: 'set_snap_calibration', quat: [x,y,z,w] }`.
2. `relay.js`: receive the message, call `engine.setSnapCalibration(quat)`.
3. `src/engine.ts` + `src/quaternion.ts`: store `snapCalibration`. `processGyro(rawQuat)` applies `snapCalibration.inverse() × rawQuat` before `nearestS4()` and deviation computation.
4. Persist across WS reconnects (store in relay, re-send to new clients on connect alongside `spell_book`).
5. Dashboard "reset ghost" button (`ghostViewOffset.identity()`) also emits `set_snap_calibration` with identity.

**Invariant**: the live-cube render uses the *raw* gyro (so it shows the real orientation); only the snap/deviation math sees the calibrated version. Ghost renders the calibrated snap target, so visually ghost and live align when the performer is at the calibrated zero.

### D26 — Glissando via pitch bend as optional wider-gesture path *(deferred)*

**Context**: With D20 resolved, SWAM portamento works for the subtle C5/C6/C7 drifts (CC 5 = portamento time scales against P.MaxTime 2.5 s). That path is idiomatic for natural legato glides. It's less suited to dramatic "wild gliss" moments where the performer wants a wide, shapeable bend without re-attacking.

**Alternative path**: MIDI pitch bend (status byte `0xE0 + (ch-1)`, 14-bit LSB/MSB). Not a CC — does not appear in MIDI-Learn lists because pitch bend has its own MIDI lane. SWAM exposes the range via **Pitch Master page → Pitch Bend Range** (set wide, ±12 or ±24 semitones).

**Use case**: reserve for C5 big-gesture glisses on f+ intensity — hold one note, ramp pitch bend from `0x2000` (center) to a target value over the slide duration. Full curve control, no legato trigger quirks.

**Trade-offs**: pitch bend is monophonic per MIDI channel (fine — we only hold one note during a gliss). Bends every held note on that channel including accidentals.

**Decision**: keep SWAM portamento as the default path for C5–C7 subtle drifts (now that D20 is fixed). Pitch bend is a targeted addition for wide-interval C5 moments — implement only if C5 still feels under-delivered after D22's compound gliss segments are heard.

**Scope if implemented**:
- `pitchBend(ch, value14)` helper emitting `midievent 0xE0+ch-1 lsb msb`
- Reset to center `0x2000` at the start of every phrase + on `bang()`
- Preset: Pitch Bend Range = ±24 semitones
- Triggered by `phraseC5` when the interval between picked pitches ≥ 12 semis AND intensity ∈ {ff, fff}

---

## Implementation Order

Highest-leverage first. Stop-test-listen between phases.

### Phase 0 — Upstream voice firehose & panic (D16, D17)
*Prerequisite for everything else. Until Phase 0 is complete, no listening test is valid — the 10 Hz voice storm and stuck notes mask every other symptom.*
- [x] Remove `/xk/voice` from `stateToOsc()` in `src/osc-output.ts`
- [x] Extend `engine.onVoice` listener in `relay.js` to send `/xk/voice` over OSC to SC (57120) and Max (57121)
- [x] `cancelPhrase()` calls `allNotesOff()` before cancelling scheduled Tasks
- [x] Inactivity watchdog in `xk_swam.js` with the four-way guard from D17 (active notes AND no release task AND no pending phrase tasks AND no `/xk/voice` for 3 s) → `allNotesOff()` + CC reset. Safety net only; must not truncate sustained C3/C7 notes.
- [ ] **SC cross-check**: after the `/xk/voice` relocation, run SC + cube and confirm (a) each turn produces exactly one voice event, (b) holding still produces no retrigger, (c) no silence gap appears where SC previously relied on the 10 Hz re-assertion. If (c) fails, add a re-emit inside SC's OSCdef rather than restoring the state-burst `/xk/voice`.
- [x] (Optional, preferred over watchdog alone) `/xk/panic` OSC from relay's WS-disconnect handler → `bang()` in v8. Deterministic cleanup on disconnect.

**Parallel task (independent; can land alongside Phase 0)**: Niklas *detection only* per D19 — `src/spells.ts` entry, `mode-manager.ts` stub, `/xk/spell niklas` on the wire, dashboard visibility. Audio effect deferred to Phase 5.

### Phase 1 — KS model (D1, D2, D12)
*Makes pizzicato / harmonics / tremolo audible. Nothing else works without this.*
- [x] New `KS` map + `KS_CH` constant
- [x] `keyswitch(note, velocity, channel)` signature; 50 ms hold
- [x] Remove `CC.HARMONICS`, `CC.TREMOLO`
- [x] Stateful toggle tracking: `playMode`, `harmonics`, `tremolo`, `sordino`, `sulTasto`, `sulPont`, `altFing`
- [x] Diff-fire on all KS

### Phase 2 — COMPLEX config + `setupComplex` rewrite (D5, D7, D12)
*Each complex gets its own personality.*
- [x] Add `COMPLEX` table
- [x] Rewrite `setupComplex` to diff every field
- [x] Single attack-ramp source; regime as multiplier

### Phase 3 — Expression decoupling + envelopes (D4, D8, D15, D18)
*Dynamics follow the complex, not the gyro.*
- [x] Delete tilt → CC 11
- [x] `scheduleExprEnvelope()` called from every phrase generator
- [x] Tilt repurposed to Bow Position modulation
- [x] Reset Expression to 0
- [x] Spin-threshold deadband on 60 Hz CCs (skip writes when `state.spin < 0.02` for ≥ 200 ms; throttle to 30 Hz otherwise)

### Phase 4 — Vibrato fix (D3, D6)
*Vibrato becomes musical.*
- [x] Correct CC 19; move BOW_SPEED to CC 20
- [x] Per-complex vibrato baselines (from D5 table)
- [x] EMA + dead zone on spin
- [ ] Set Vibrato Fade-In 250 ms at init *(owned by SWAM preset, not runtime — per Prerequisites)*

### Phase 5 — Spell & continuous-CC cleanup (D11, D13, D14, D19)
- [x] Spells restore via `setupComplex(active)` instead of partial restore
- [x] `u-perm` uses short-gate pattern, not fake staccato KS
- [x] `ccForce` vs `cc` rule codified
- [x] Deviation → bow pressure becomes ±25 modulation
- [x] Add Niklas spell: `src/spells.ts` entry (`R U' L' U R' U' L`), `mode-manager.ts` stub, `xk_swam.js` handler. Effect TBD — pick between C-cube 3-cycle / canon echo / commutator latch after first listening test.

### Phase 6 — Wire unused KS / continuous controls (D10, post-D27) *(partial 2026-04-14)*
*Leverage what v3.10 still exposes. Sordino / Sul Tasto / Sul Pont / Section Size were removed from the KS plane in v3.10 — the items below replace those slots with v3.10-correct paths.*
- [ ] Pizz Polyphony init (preset-side; not a KS)
- [x] **Sordino on freeze** — `CC.SORDINO = 68` (MIDI-Learn to the Sordino GUI toggle), written in `handleSpell('sune')` alongside the sustain pedal; bang() resets to 0.
- [x] **Sul Tasto / Sul Pont on scramble thresholds** — `handleExprScramble` maintains `state.scrambleBowBias` via 2 s hysteresis on <0.2 (tasto, +40) and >0.8 (pont, −40, skipped when C8 active). `handleExprTilt` adds the bias to its CC 16 write; bias changes also force a write immediately so the shift is audible with the cube still.
- [ ] Alt Fingering on tetra flip (KS D# latch — survived v3.10)
- [ ] Bow Lift / Bow Start (KS E / F latches — survived v3.10) on spell color
- [ ] ~~Section Size on path~~ — **removed in v3.10**; consider Bow Position bias or Vibrato baseline shift per path instead

### Phase 7 — V2 fold window + Attack Control polish (D9) *(landed 2026-04-14)*
- [x] Widened fold window is the default V2 strategy. `pickPitch` passes `lo = max(24, reg.lo - 12)` for V2 so low sieve pitches can reach the cello's bottom octave; `foldToRange(pitch, lo, hi)` accepts per-complex bounds. No Section Size fallback needed (Section Size was removed from the KS plane in v3.10 anyway).
- [x] ~~CC 75 Attack Control spell-accent spikes~~ — **obsolete in SWAM Cello 3 v3.11**. Attack Control is a 4-mode selector (`vel.soft / vel.hard / expression / mix vel. expr.`), not a continuous ramp. Set it once in the preset to `expression` or `mix vel. expr.`; spell accents already reach attack character via the existing CC 11 envelope path (`scheduleExprEnvelope`). `HAS_ATTACK_CONTROL = false` in `max/xk_swam.js`.

### Phase 8 — Note-off velocity from turn rate *(landed 2026-04-14)*
- [x] `noteOff(pitch, vel?)` signature extended; default velocity comes from `state.noteOffVel`.
- [x] `handleRate` maps `turnsPerSec` → `state.noteOffVel` (25 at rest → 120 at ≥8 turns/sec). Fast turns produce bitten releases; slow turns produce long, naturally-decayed releases. All phrase-generator note-offs pick this up automatically.

### Phase 9 — Expressivity pass (D20, D21, D22, D23) *(landed 2026-04-14)*
*After the preset was corrected to `Portamento Control = CC (P.MaxTime)`, first proper listening test exposed weak tilt, sparse phrases, and no intensity→timbre contrast. This phase is retrospective — fixes already in tree.*
- [x] D20 — preset flip to `CC (P.MaxTime)`; documented in Prerequisites
- [x] D21 — tilt → Bow Position widened from ±10 to ±30 in `handleExprTilt`
- [x] D22 — `phraseCount(lo, hi)` helper; C2–C8 phrase generators rewritten with stochastic density scaled by `INTENSITY_MAP[intensity].density × state.density`
- [x] D23 — `INTENSITY_MAP.bowMult` per level; `state.bowPressureBase = cmx.bowPressure × bowMult` written in `handleVoice`; `handleExprDev` rebases its ±25 mod off this. `COMPLEX[n].register = {lo, hi}` per complex; `foldToRange(pitch, lo, hi)` takes optional bounds; `pickPitch` passes per-complex register

### Phase 10 — Diagnose harmonics / tremolo silence (D24)
*Open. Likely upstream, not bridge.*
- [ ] Open Max console during a cube session; log `complex -> C4` and `-> C8` frequency
- [ ] If absent: audit `src/voice-engine.ts` active-vertex selection + `src/complexes.ts` α/β/γ mapping to ensure C1–C8 space is fully reached. Possibly the path V1/V2 / tetra orbit combination keeps landing in the same sub-cluster.
- [ ] If present but no SWAM response: `setToggle` state-desync after `bang()` — force-sync harmonics/tremolo on first `setupComplex` after reset by firing KS unconditionally when `state.activeComplex === 0`.
- [ ] Add a lightweight stat counter (per-complex hit count over last N voices) logged at complex-change, visible in Max console + dashboard, so the diagnosis becomes cheap to re-verify after any engine change.

### Phase 11 — Ghost-cube calibration feedback loop (D25)
*Open. Touches dashboard, relay, and engine — not just the bridge.*
- [ ] `public/dashboard.html`: on ghost rotation commit (mouseup from the rotate-target gizmo), serialize `ghostViewOffset` and send `{type:'set_snap_calibration', quat:[...]}` over WS
- [ ] `public/dashboard.html`: "reset ghost calibration" button → emit identity
- [ ] `relay.js`: handle `set_snap_calibration` message, call `engine.setSnapCalibration(quat)`, cache the value, re-send to new WS clients alongside `spell_book`
- [ ] `src/engine.ts`: store `snapCalibration` (default identity), expose `setSnapCalibration(quat)`
- [ ] `src/quaternion.ts`: apply `snapCalibration.inverse() × rawQuat` before `nearestS4()` and deviation computation
- [ ] Verify live cube still renders from raw gyro (not calibrated) so the physical orientation still reads true; only snap/deviation math sees the calibrated quat

### Phase 13 — SWAM Cello 3 v3.8 → v3.10 KS migration (D24, D27) *(landed 2026-04-14)*
*Reality check after `docs/v3.10-keyswitches.pdf` confirmed our KS map was three slots out of date.*
- [x] New v3.10 `KS` map in `max/xk_swam.js` (Harmonics → KS F#, Tremolo → KS G#, Gesture Mode → KS D, removed Sordino/SulTasto/SulPont/SectionSize KS)
- [x] `velForOption(idx, n)` + `setEnum(field, ks, target, optionCount)` for vel-select KS
- [x] `HARMONICS = {OFF, OCT, OCT_5TH, CTRL}` and `TREMOLO = {OFF, SLOW, FAST}` enums; COMPLEX C4/C8 declare enum index, not boolean
- [x] `bang()` pins **Gesture Mode = Expression** to defend against silent CC 11 reinterpretation
- [x] state object: removed `sordino/sulTasto/sulPont/sectionSize`, added `gestureMode/altFing/keepBowDir`
- [x] Removed dead `setSectionSize`/`setToggle` paths for retired KS
- [x] Verified sune freeze still uses `CC.SUSTAIN_PEDAL` (untouched by migration)
- [x] Docs synced: `docs/swam_cello_reference.md` §2 + §9, `CLAUDE.md` Keyswitches section, this file (D24 RESOLVED, D27 added, Phase 6 rescoped)
- [ ] **Listening test (user-side)**: confirm C4 harmonics + C8 tremolo audibly fire; confirm portamento not affected by Gesture Mode pin

### Phase 12 — Pitch-bend glissando path (D26, optional)
*Implement only if C5's compound-gliss segments (D22) still feel under-delivered.*
- [ ] Preset: Pitch Master → Pitch Bend Range = ±24 semitones
- [ ] `pitchBend(ch, value14)` helper in `max/xk_swam.js`
- [ ] Reset to `0x2000` on `bang()` and at phrase start
- [ ] `phraseC5` triggers pitch-bend ramp when interval ≥ 12 semitones AND intensity ∈ {ff, fff}; hold one note, ramp over slide duration
- [ ] Leave SWAM portamento as default for C6/C7 + subtle C5 intervals

---

## Invariants the refactor must preserve

- **Input pitch range = MIDI 36–89** (C2–F6). Sounding range ends up C1–F5 via default –12 transpose.
- **KS region = MIDI 24–35** (KS Octave = C0). Never sent on the performance channel; never overlapped with pitches.
- **KS and CC are independent paths.** Don't model one in terms of the other.
- **Latch-toggle KS require state diffing.** Don't fire unconditionally.
- **Continuous CCs need smoothing when driven by gyro.** Raw 60 Hz writes wobble the voice.
- **Per-complex personality is the primary source of musical character.** Gyro is secondary color.

---

## Verification plan (per phase)

**Phase 0** — Hold cube still, relay running: VST should be silent (no notes firing at 10 Hz). Turn once: exactly one phrase plays and ends cleanly. Unplug OSC cable mid-phrase: within 3 s, all notes released. Reconnect: next turn plays normally. Start a long C3 or C7 phrase (duration ≥ 5 s): full envelope plays to completion, watchdog does **not** cut it. Run the same test with SC as the target synth: one voice per turn, no silence gap relative to prior behavior — if SC goes quiet where it used to re-trigger, fix inside SC's OSCdef, not by restoring the burst.

**Phase 1** — Send `midievent 144 24 80` on `KS_CH`. Next turn should sound **pizzicato**. Send `144 24 40` → back to bow. Send `144 33 100` twice → harmonics toggle on then off.

**Phase 2** — Cycle through C1–C8 manually via `/xk/voice`. Each should sound distinct in articulation, bow position, portamento, vibrato depth.

**Phase 3** — Hold cube still. Dynamics still rise/fall per each complex's envelope. Tilt the cube: Bow Position shifts timbrally; loudness pattern unchanged.

**Phase 4** — Slow spin → no vibrato. Faster → vibrato builds gradually, smooth. Stop → vibrato settles to complex baseline (not zero if complex prescribes it).

**Phase 5** — Fire `sexy-move`. After the 400 ms sweep, bow position returns to active complex's baseline (not zero, not some prior complex's value).

**Phase 6** — Freeze via sune → hear sordino engage. Scramble → sul ponticello latches in. Solve → sul tasto latches in. Watch for KS inversions (state tracking drift).

**Phase 7–8** — Ears.

---

## References

- `docs/swam_cello_reference.md` — complete SWAM parameter/CC/KS reference (the authoritative source for the numbers above)
- `max/xk_swam.js` — target file for refactor
- `CLAUDE.md` — see "Max/MSP — SWAM Cello Bridge" section
- `docs/todo.md` — Phases 2/3/4 of the broader XenaKube roadmap
