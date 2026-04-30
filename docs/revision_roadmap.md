# XenaKube → SWAM: Revision Roadmap

Converged plan for rebuilding `max/xk_swam.js` against SWAM Cello 3's actual control model. Derived from `docs/swam_cello_reference.md` (the authoritative parameter/CC/KS reference, extracted from the v3.8.0 user manual).

This document is the single source of truth for the SWAM-bridge refactor. Update it as phases complete or new findings change the plan.

> **Status (2026-04-23): refactor COMPLETE; D40 partially reverted.** Diagnoses D1–D39 are all resolved and shipped. **D40 (instance pool) was reverted on 2026-04-23** — SWAM Cello 3's Ambiente panel auto-registered every loaded VST instance as a reverb source regardless of which ones received MIDI, summing identical sources into audible phase overlap even with `MAX_ACTIVE = 2`, and CPU scaled 8× for texture the composer didn't want. The bridge now runs a **single `[vst~ "SWAM Cello 3"]` at `POOL_SIZE = MAX_ACTIVE = 1`**; the pool/allocator machinery is kept as a per-voice bookkeeping anchor (every phrase/CC/release task is still `inst`-threaded) so polyphony can be reinstated later by raising the two constants, re-adding `[poly~ swam_voice @voices N]`, and restoring the one-line `outlet(MIDI_OUTLET, "target", inst.voice);` in `emitMidi`. See the "Reverted" block at the end of D40 below. Engine-level work continues under the Temporal Identity framework — see `docs/todo.md`. New bridge changes required by Phase A1 (face-gesture dispatch) or Phase B (phrase-library playback) are tracked in those phases, not as new D-entries.

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

**Play Modes → Left Hand page** *(D35 supersedes D34; 2026-04-18)*
- **Bow Polyphony selector → MIDI Learn → CC 81.** Bridge now drives polyphony per-complex: default `Double/Hold` for C1–C4 and C8 (two-string textures on overlapping turns), `Mono Poly Release` for gliss complexes C5/C6/C7 (single-line portamento). The preset's saved default no longer matters since every `setupComplex` call re-asserts. The D34 rule — that non-Mono modes split overlapping notes into chord voices and kill portamento — still applies and is why the gliss complexes override to Mono Poly Release.

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
- In `relay.js`, extend the existing `engine.onVoice(output)` listener (currently WS-broadcast only, around line 258) to also `oscMax.send('/xk/voice', ...)`. Voice events now fire once, on actual voice transitions, as intended.

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

### D19 — Spell book addition: Niklas (commutator family) *(detection RESOLVED earlier; effect RESOLVED 2026-04-18 — see D36)*

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

### D35 — Bow Polyphony per-complex (default Double/Hold, gliss = Mono Poly Release) *(RESOLVED 2026-04-18)*

**Defect**: After D34, Bow Polyphony was pinned to `Mono` in the SWAM preset so C5–C7 glissandi would engage. Side-effect: C1–C4 and C8 lost the musicality of overlapping turns producing natural two-string textures — every turn becomes a hard monophonic cut even when that isn't what the complex wants. Performer request: let non-gliss complexes do polyphonic overlap, keep the gliss complexes on a strict monophonic line.

**Root cause**: Bow Polyphony was a preset-level constant, not a bridge-driven param. The v3.10 PDF (p. 102) states every KS-controlled param is also addressable via Controller Mapping — right-click → MIDI Learn → CC. The bridge already uses this path for Harmonics (CC 78) and Tremolo (CC 79) where KS was inadequate; Bow Polyphony fits the same pattern (plus its KS form `B + {C / C# / D / D# / E}` is a page-modifier combo the bridge's velocity-select helpers can't express anyway).

**Fix**:

1. **Preset**: right-click Bow Polyphony selector (Play Modes → Left Hand) → MIDI Learn → CC 81 → save preset. Supersedes D34's "pin to Mono" instruction; the saved default no longer matters since the bridge re-asserts on every `setupComplex`.
2. **Code (`max/xk_swam.js`)**:
   - New `CC.BOW_POLYPHONY = 81`, feature flag `HAS_BOW_POLY_CC = true` (flip false to skip writes — the KS-held-modifier fallback isn't implemented because velocity-select helpers can't express it).
   - New `BOW_POLY` enum (`MONO_STRING_CROSSING:0 / MONO_POLY_RELEASE:1 / DOUBLE:2 / DOUBLE_HOLD:3 / AUTO:4`) and `BOW_POLY_CC_VAL` band-center map (5 equal-width CC bands at 12 / 38 / 64 / 89 / 115).
   - New `setBowPolyphony(target)` helper — diff-fire via `state.bowPoly`, same pattern as `setHarmonics` / `setTremolo`.
   - `COMPLEX[n].bowPoly` field: `MONO_POLY_RELEASE` for C5 / C6 / C7 (gliss complexes), `DOUBLE_HOLD` for C1–C4 and C8 (rich two-string textures on overlapping turns).
   - `setupComplex()` calls `setBowPolyphony(cmx.bowPoly)` after `setHarmonics` / `setTremolo`.
   - `bang()` resets `state.bowPoly = null` and writes `DOUBLE_HOLD` as the hard initial state so setupComplex overrides land cleanly when a gliss complex is selected.

**Why Double/Hold vs Double**: Double/Hold latches the first note's string while the next is struck on a different string — matches how a cellist holds a chord with the bow crossing strings. Double without Hold ends each voice at note-off and cuts the texture short. For overlapping XenaKube turns, Double/Hold produces the smoother lingering-chord feel. Flip the per-complex `bowPoly` field to `BOW_POLY.DOUBLE` if hanging string voices across phrase boundaries become a problem.

**Verification**: land on any non-gliss complex → overlapping turns audibly sustain as a two-string texture rather than each note cutting the previous. Land on C5 / C6 / C7 → gliss phrases still slide (D34 prerequisite preserved via `MONO_POLY_RELEASE` which keeps the single monophonic line the portamento engine needs). The Bow Polyphony selector in the SWAM GUI should visibly jump between option 3 (Double/Hold) and option 1 (Mono Poly Release) as complexes change.

### D52 — Wild gliss slides have no per-event attack; decouple "slide intent" (velocity) from "attack character" via Bow Pressure Accent (CC 18) *(RESOLVED 2026-04-27)*

**Defect** (continuation of the D50 thread): D50 v2 capped slide velocity at 22 to keep portamento engaged (per Velocity → P.MaxTime, raising velocity shrinks portamento time toward zero). At vel 22 SWAM treats slide noteOns as bow continuations — the slide is audible but the *attack moment* is not. Combined with D51's slide-heavy mix, only the leaps (LEAP_VEL=70) delivered audible attack-events; slides arrived as smooth tone changes. Wild gliss still felt under-articulated even with D49's WILD_MIN_COUNT floor.

**Architectural diagnosis** (carried over from D50 v2 lessons): velocity is overloaded — it carries both "this is a slide" (low vel → max portamento time) and would-be "this slide has attack character" (high vel → audible attack). SWAM's UI provides a dedicated decoupling path: **Expressivity → Bow Pressure Accent**, controlled by CC 18, MIDI-Learned in `xenakube_2.swam`. A brief CC 18 spike at each slide noteOn applies per-event attack pressure with **zero impact on velocity → portamento engagement**.

**Fix** (the deferred D50 v2 follow-up, now landed):

1. **`WILD_GLISS_BPA = 80`** constant — moderate spike value (sexy-move uses 110, u-perm 100). Tunable upward for harder attack character, downward for gentler.

2. **`BPA_RESET_MS = 100`** — schedules CC 18 = 0 reset 100 ms after the spike, holding the accent through the start of the slide envelope so SWAM's pressure response rings out audibly before the next event. Initially shipped at 30 ms, raised same-session through 60 to 100 after listening tests revealed the shorter sustains felt clipped. Still well clear of the next ≥ MIN_GLISS_SPACING_MS = 200 ms gliss event, so spikes cannot stack across slides.

3. **`glissNote(inst, pitch, vel, accent)`** — new optional `accent` arg. When non-zero and `HAS_BOW_PRESS_ACCENT` is true, `ccForce(inst, CC.BOW_PRESS_ACCENT, accent)` snaps CC 18 just before `legatoNoteOverlap` fires the noteOn, then a `scheduleAt(inst, BPA_RESET_MS, …)` Task resets CC 18 to 0.

4. **`glissStep(inst, sourcePitch, targetPitch, minLeap, glissVel, accent)`** — forwards `accent` only on the slide branch (`glissNote`); the leap branch (`leapStep`) ignores it because LEAP_VEL=70 already produces a clear attack on the cross-string note.

5. **`phraseC5`** passes `WILD_GLISS_BPA` as the accent. C6 / C7 omit it and retain their gentle bow-continuation slide character.

6. **Steal safety**: `cancelPhrase` always calls `ccForce(inst, CC.BOW_PRESS_ACCENT, 0)` regardless of whether a reset task was pending. A steal landing between the spike and its scheduled reset cancels the reset Task; without the explicit unconditional clear, CC 18 = 80 would leak into the next voice and produce an unintended initial accent on the new phrase's first noteOn.

**Why CC 18 cleanly avoids the D50 v1 failure mode**: CC 18 doesn't go through SWAM's portamento-time pipeline at all. The Velocity → P.MaxTime control reads only the noteOn velocity byte; CC 18 lands on Expressivity → Bow Pressure Accent, an independent acoustic-modeling parameter. Slide velocity stays at 22 (max portamento time), CC 18 spike adds the attack character. Two orthogonal channels, two orthogonal effects.

**Audible verification**:
- C5 wild gliss now has audible per-slide attack moments alongside the existing leap attacks. With D51 at strict N=1 (every leap immediately followed by a slide), every event is articulated — slides via BPA spike, leaps via LEAP_VEL=70.
- C6 ord gliss / C7 drift gliss unchanged — they keep their continuous-bow slide character.
- Sexy-move and u-perm BPA spikes (their existing 110 / 100 spikes via `setupComplex`) still fire normally — the `cancelPhrase` clear runs once per voice, not on every CC 18 write, so the spell-level accents are unaffected.

**Tunables**:
- `WILD_GLISS_BPA = 80` — headline knob. Raise to push wild gliss attacks harder; lower for gentler character. Stays within 0–127.
- `BPA_RESET_MS = 100` — reset latency. Hold accent longer for more articulated attack ring-out; do not exceed MIN_GLISS_SPACING_MS - 50 ms (≈ 150 ms) or spikes risk lingering pressure into the next slide.

**Lessons (kept for future-me)**:
- When two effects share a single MIDI byte (here velocity → both slide-engagement and attack-character), and the SWAM UI exposes a separate parameter for one of them, wiring the dedicated parameter is almost always cleaner than tuning the overloaded one. D50 v1 → D50 v2 → D52 walked exactly this path: tried to tune velocity (broke portamento), retreated to a conservative velocity (no attack), then added the dedicated parameter (both work).
- Steal-clear unconditional, not just when a reset task exists. Cheap insurance; prevents a one-line regression in `cancelPhrase` from silently re-introducing a leak that's audible only on rapid voice steals.

---

### D51 — Leap-alternation refactor + anchor-seed relocation *(RESOLVED 2026-04-27)*

**Defect** (continuation of D50 thread): D48's strict "every leap immediately followed by a slide" rule shifted the slide/leap distribution to ~67%/33% (Markov stationary). Combined with SWAM's MPR mode where slides at vel-18 are bow continuations (~no audible attack) and leaps at vel-70 are discrete attacks, only ~33% of events registered as audible attack-events vs ~50% pre-D48. User: "twice as many notes / density" pre-D48. Separately, D48's anchor-as-leap seed in `handleVoice` (forcing the first event to be a slide) was removed earlier in the session because the user wanted dramatic anchor → leap openings back — but a follow-up listening test surfaced the opposite complaint: "wild gliss should ALWAYS start with a gliss, just like ord gliss" — so the anchor seed needed to come back, but only for C5 wild gliss specifically.

**Fix** (two-part):

**(a)** Refactor the leap-alternation condition. New constant `MAX_CONSECUTIVE_LEAPS`. `glissStep` condition changed from `inst.lastWasLeap && !sameString(...)` to `(inst.consecutiveLeapCurrent | 0) >= MAX_CONSECUTIVE_LEAPS && !sameString(...)`. The counter-based check is equivalent to the boolean check at N=1 but generalises to N≥2 if needed. Initial value 2 (allow leap → leap → forced-slide), bumped same-session back to 1 (strict alternation, every leap forces slide) after listening tests revealed leap-pairs felt too "non-gliss." **Current value: N=1.**

**(b)** Relocate the anchor seed. D48 had it in `handleVoice` (generic — applied to all gliss complexes); D51 first removed it entirely; final implementation moves it into `phraseC5` only (`inst.consecutiveLeapCurrent = MAX_CONSECUTIVE_LEAPS` at phrase start). With N=1, this seed forces the first `glissStep` after the anchor to be a slide — wild gliss must always *begin* with a slide ("just like ord gliss"). C6 / C7 don't apply the seed because their natural pickPitch outcomes are usually within-string anyway (MIN_LEAP=1 for C6, small drifts for C7).

**Markov stationary at N=1**:
- ~67% slides, ~33% leaps.
- Pre-D52: only the ~33% leaps registered as audible attacks (~33% audible attack rate).
- Post-D52 (BPA on every slide): ~67% slides + ~33% leaps = **~100% audible attacks**. Density restored without relaxing alternation.

**Telemetry**: `GLISS RUN FAIL` log threshold updated from hardcoded `> 1` to `> MAX_CONSECUTIVE_LEAPS`. Under current N=1, runs of 1 leap are normal; only 2+ trigger the FAIL log (which only happens when `nudgeToSameString` returns null at extreme range corners).

**Tunable**: `MAX_CONSECUTIVE_LEAPS = 1` is the headline knob.
- N=1 (current): strict alternation, every leap immediately followed by a slide.
- N=2: allow leap pairs; useful if BPA accents start to feel too uniformly articulated.
- N=3+: looser, more leap-clusters; risks reintroducing the "consecutive non-gliss notes" bug.

---

### D50 — Wild gliss slide velocity tuning *(v1 ATTEMPTED + REVERTED 2026-04-27, v2 RESOLVED 2026-04-27)*

**Defect**: D48 leap-alternation produced ~67% slides at vel 18, which SWAM's MPR treats as bow continuations (no audible re-attack). User: "twice as many notes / density" pre-D48 — perceived attack rate roughly halved.

**v1 attempt (REVERTED same day)**: `WILD_GLISS_VEL = 55` based on the wrong hypothesis that SWAM portamento engages on overlap alone (with velocity only controlling bow attack intensity). User report after listening: "the vst is just playing straight notes with consecutive leaps, with absolutely no portamento of any kind." Reverted in full.

**Root cause of v1 failure (discovered via user-shared SWAM screenshots)**: `docs/swam-menu-screenshots/swam-advanced-midi-menu.png` shows SWAM Cello's Advanced→MIDI menu with **"Portamento Control: Velocity (P.MaxTime)"** selected. Slide noteOn velocity directly scales the portamento time toward zero. The original `GLISS_VEL = 18` sat near the bottom of that scale (max portamento time); vel 55 shrunk portamento time enough that slides became audibly indistinguishable from discrete note changes. The screenshots were the missing piece — the SWAM reference docs (`docs/swam_cello_reference.md`) didn't surface this dependency clearly.

**v2 fix (current implementation)**: cautious bump to `WILD_GLISS_VEL = 22`. Just 4 units above default; should keep portamento time near max while adding marginal slide-target audibility. If 22 still preserves portamento and is too tame, can creep to 24, 26, etc. — listening test confirms.

**The deeper fix (now landed as D52, see entry above)**: Bow Pressure Accent (CC 18, MIDI-Learned in `xenakube_2.swam` to SWAM Expressivity → Bow Pressure Accent). Brief CC 18 spikes on each slide noteOn add audible per-event attack emphasis with **zero impact on velocity → portamento engagement**, decoupling "slide intent" (velocity → SWAM portamento) from "attack character" (bow pressure spike). D50 v2's `WILD_GLISS_VEL = 22` is retained as the conservative slide velocity; D52 carries the attack character on top. If wild gliss still feels under-articulated, raise `WILD_GLISS_BPA = 80` rather than `WILD_GLISS_VEL` — the latter would re-trigger the v1 portamento collapse.

**Lessons (kept for future-me)**:
- SWAM domain knowledge requires verification *against the actual SWAM UI* before tuning parameters whose values look "extreme" (like vel 18). The reference doc (`docs/swam_cello_reference.md`) covers the canonical CC mappings but doesn't always document plugin-internal coupling like Velocity → P.MaxTime.
- When a tuning fix breaks something else (here: vel bump broke portamento), the root cause discovery often comes from inspecting the plugin UI, not the bridge code. User-shared screenshots saved this debugging session.
- Decouple where possible: per-event attack character should be its own parameter (Bow Pressure Accent CC 18), not shared with the slide-intent signal (velocity). SWAM's design supports this — the bridge wired it as **D52** the same day this entry's "deferred" note was written.

---

### D49 — Wild gliss (C5) sometimes produces a single gliss because face envelope's isSingle collapses count to 1 *(RESOLVED 2026-04-26)*

**Defect** (user report 2026-04-26 after D48 v2 landed): "i am still getting sometimes just a single gliss for a 'wild gliss' which is unacceptable. 'wild gliss' by definition cannot be 'wild' if it's a single gliss, and xenakis never treated it as such either. at first, i thought maybe when c5 is paired with a k-vertex with a D=1.0 or otherwise low might influence the gliss frequency/density, but it does not seem to be the case. i had a D=1.5 produce several rapid wild gliss, while sometimes a C5 with a K-vertex with D=2.5 produce only two gliss. does the turn rate (t/s) affect the density?"

**Trace**:
- `phraseC5` had `var requestedCount = Math.max(1, faceShapedCount(inst, 4, 9, true));`
- `faceShapedCount(inst, 4, 9, true)`: when `inst.faceEnvProfile.isSingle` is true (faces with envelope ∈ {pluck, stab, drone} → U, B, D, R, D', B'), returns 1 unconditionally. Otherwise returns `phraseCount(inst, 4, 9)` possibly multiplied by countMult (burst face = 1.8).
- `phraseCount(inst, 4, 9)` scales by intensity density (`INTENSITY_MAP[intensity].density`: 0.6–1.7) and K-vertex density (`dMult = clamp(0.6 + inst.density × 0.25, 0.6, 1.8)`).

So C5 paired with one of the 6 isSingle faces → `requestedCount = max(1, 1) = 1` → anchor + 1 glissStep = 2 audible notes = 1 audible glissando. The user's observation `D=1.5 → many gliss / D=2.5 → 2 gliss` mapped onto face envelope, not D — face was the dominant variable. K-vertex density was being overridden by the isSingle face collapse.

**Why this is wrong**: wildness is C5's *complex identity*, not something the face can soften. Pluck/stab/drone face envelopes are about *articulation shape* (short percussive vs sustained) and they already apply `durationBias` (short for pluck/stab, long for drone) and `releaseMult` (drone gets long release). They should not also collapse the salvo down to a single event — that's a different musical decision (timbre/articulation vs density) and reduces wild gliss to non-wild for half the cube.

**Fix**: new `WILD_MIN_COUNT` constant (initial value 4, bumped through 6 → 8 → 12 across listening sessions on 2026-04-26 and 2026-04-27 — each step still felt under-dense, settling at 12 after D52 BPA accents made every slide audibly articulated); `phraseC5` uses `Math.max(WILD_MIN_COUNT, faceShapedCount(inst, 4, 9, true))`. Current value is **12**. Wildness now defies the isSingle collapse and any low-intensity floor. Pluck face on C5 = a short percussive *salvo* of glissandi (12+ events packed into a short durationBias-shrunk window) instead of a single isolated slide. Drone face on C5 = a long sustained salvo (12+ events spread across a durationBias-stretched window). The face still shapes the salvo's *envelope* via velCurve and durationBias; it just can't reduce its event count below wild.

For non-isSingle faces, the floor only kicks in when intensity + K-D would otherwise produce <8 events (e.g., `p` intensity + low D). High-D + high-intensity wild gliss is unaffected — `phraseCount` returns rrand(4–11ish) which routinely exceeds the floor at high intensity, and the burst face countMult (1.8) pushes it higher.

**Turn-rate question (also user-asked)**: turn rate currently sets `state.regime` ('contemplative' / 'conversational' / 'burst') which is consumed by `REGIME_EXPR_RAMP_MULT` (CC 11 ramp speed) and `REGIME_ATTACK_MULT` (attack ramp speed), and by `phraseC2`'s `hi = state.regime === "burst" ? 6 : 5` density boost. Regime does NOT modulate gliss complex event count. Could be wired in as a future regime-density coupling for burst-mode wild gliss extra density, but not necessary to address the floor problem.

**Audible verification**:
- Wild gliss on any face produces ≥8 events. With D51 leap-alternation tolerance N=2, that's ~5 audible glissandi per phrase plus interspersed leaps — very wild.
- Pluck face C5: short percussive salvo of glissandi (was: single anchor + slide).
- Drone face C5: long sustained salvo (was: single anchor + slide stretched over duration).
- Stab face C5: accented short salvo with hot first note (`accent-first` velCurve still applied).
- High-D + ff intensity: still maximally dense (8–11+ events from natural phraseCount, with burst face countMult pushing higher; `glissSchedule` clips when MIN_GLISS_SPACING_MS × N exceeds the phrase tail).

**Tunable**: `WILD_MIN_COUNT = 12` is the headline knob. Raise for even denser wild salvos; lower with caution — values below ~6 risk re-introducing the "single isolated slide on isSingle face" feel that motivated this fix. `glissSchedule` still truncates the count if MIN_GLISS_SPACING_MS × N can't fit in the phrase tail (so very short stolen-phrase voices clip below the floor naturally). Typical 1–3 s phrases fit ~6–12 events at the 200 ms spacing floor.

---

### D48 — Wild gliss contains "several non-gliss notes in a row" because back-to-back leaps slip through `glissStep` *(RESOLVED v2 2026-04-26 after revert + clarification + re-implementation)*

**Defect** (user report 2026-04-26): "wild gliss should ONLY contain glissandi. large leaps are allowed, but upon making a leap, it should be the start of a new glissando. currently, that is not the case — sometimes wild gliss contains several notes in a row that are not gliss."

**Mechanism**: `phraseC5` schedules `glissStep` calls every ≥200 ms (D45 spacing). Each `glissStep` evaluates `sameString(source, target)` and dispatches either `glissNote` (overlap → SWAM portamento → audible slide) or `leapStep` (noteOff → 50 ms gap → noteOn → discrete note change, **no slide**). For C5 with `MIN_LEAP = 8` and full cello range `pickPitch` (`register: { lo:36, hi:89 }`), random pitch transitions frequently cross strings — and after a leap the next `pickPitch` outcome is also often cross-string from the leap target, producing a chain of discrete leap notes with no slide content between them.

**v1 attempt (REVERTED 2026-04-26 same day)**: enforce the user's stated rule literally — "every leap (and the phrase anchor) is immediately followed by a slide." Implementation:
- `nudgeToSameString(sourcePitch, preferTarget, minLeap)` helper picks a pitch on one of source's strings, ≥ minLeap from source, prefer-direction toward the random target. Always picked the lowest-indexed string from `CELLO_STRINGS` when source sat on multiple strings.
- `glissStep` checks `inst.lastWasLeap && !sameString(...)` and replaces target with the nudge before dispatch.
- `inst.lastWasLeap = inst.glissExpected` seeded at phrase start in `handleVoice` so the first event is forced to slide.
- `consecutiveLeapMax` telemetry promoted to `GLISS RUN FAIL` if back-to-back leap slipped past the nudge.

**v1 user report**: "after whatever you just did, the wild gliss only performs a single gliss. i really liked everything about what it was doing before, just wanted to rectify the incorrect behavior. now it is basically lobotomized." Suspected cause: the always-pick-lowest-indexed-string behavior of `nudgeToSameString` biased trajectory toward the lower strings in the multi-string overlap zones (50–55 = C/G/D; 57–62 = G/D/A), narrowing C5's pitch range to feel monotone. Reverted in full.

**Clarification round** (user follow-up 2026-04-26, with concrete example): "to answer your question, i don't want to be so specific in order to stay faithful to xenakis' stochastic spirit, but basically every note in 'wild gliss' should be gliding to or from somewhere. so to give a singular possibility of an example would be like, [it begins with a gliss down from a note, which gliss back up to another note, leaps to a much higher note but begins gliss down immediately, leaps back up again, only to gliss down immediately to another note, then gliss back up from that note]."

The example confirms the intended rule precisely: every note has a slide relationship (source or target). Anchor → slide. Slide → slide. Leap → forced slide on leap-target's string. Leap allowed but always leads into a new slide. Same logic as v1 — the user did want the literal rule. The "lobotomized" perception was specifically about the trajectory narrowing, not about the rule itself.

**v2 fix (current implementation)**: same logic as v1 with one refinement aimed at the trajectory issue.

1. **`nudgeToSameString` candidate-string shuffle**. Collects all `CELLO_STRINGS` entries that contain `sourcePitch`, Fisher-Yates shuffles them, then runs the two-pass directional search across the shuffled order. Multi-string sources (50–55, 57–62 overlap zones) now distribute their nudge target across all valid strings instead of always defaulting to the lowest-indexed one. Trajectory broadens accordingly.

2. **`glissStep` post-leap branch** (unchanged from v1). Before the same-string dispatch, check `inst.lastWasLeap && !sameString(sourcePitch, p)`. If true, call `nudgeToSameString(sourcePitch, p, minLeap)` and replace `p` with the result (when non-null).

3. **`lastWasLeap` state machine** (unchanged from v1). After a slide, clears `lastWasLeap` and resets `consecutiveLeapCurrent`. After a leap, sets `lastWasLeap = true` and increments `consecutiveLeapCurrent`. `consecutiveLeapMax = max(prev, current)` tracks the longest run.

4. **Phrase-start seed** (unchanged from v1). `inst.lastWasLeap = inst.glissExpected` ensures the first `glissStep` after the anchor is forced to slide — the user's example confirmed the anchor should be followed by a slide ("it begins with a gliss down from a note").

5. **D48 invariant** (per CLAUDE.md Recurring-Bug Discipline). `scheduleRelease`'s natural-end task examines `inst.consecutiveLeapMax`. If `> 1`, promotes to `GLISS RUN FAIL inst N CX face=F slides=S leaps=L consecLeapMax=M dur=D`. Only happens when `nudgeToSameString` returned null at extreme cello-range corners.

**Audible verification**:
- C5 wild-gliss matches the user's example trajectory: anchor → slide → (possibly more slides or a leap) → if leap, immediately new slide on leap-target's string → continues. Every leap punctuates the start of a new gliss run.
- The wild character (frequent dramatic leaps, wide pitch range) is preserved because leaps fire freely on any natural cross-string `pickPitch` outcome.
- Multi-string source pitches no longer cluster trajectory on one string — the candidate-string shuffle broadens the slide target distribution.
- C6 sieve gliss (`MIN_LEAP = 1`) and C7 drift gliss (small intervals): no audible change. Most pitch transitions are within-string for sieve walks / small drifts.

**Lessons learned (kept for future-me)**:
- The user's stated rule was correct on first telling; v1 failed not because the rule was wrong but because of an implementation quirk (lowest-indexed-string bias) that produced an unintended trajectory narrowing. The takeaway isn't "don't enforce literal rules" — it's "audit any tie-breaker that might bias output distributions before shipping."
- When a user reports a perceived regression with strong language ("lobotomized"), reverting to gather more info is correct — but be specific about *which* aspect of the design is suspect, so the re-attempt can target the actual cause rather than guessing across a wide design space.

---

### D47 — Sustained phrases lack expression fluidity; per-phrase 3-stage envelope flattens into a uniform hump-then-sag *(RESOLVED 2026-04-26 — Phase 1)*

**Defect** (user report 2026-04-25): "the phrases lack certain fluidity… i would like a gradually increasing or decreasing expression that transcends individual notes. i think currently, each note gets a cc11 value and there's just a flat ramp time between every note, but i would like a gradually increasing or decreasing expression."

The user's mental model was slightly off (CC 11 is per-voice, not per-note — `stepVelScale` shapes per-note MIDI velocity but CC 11 has always been per-voice), but the *audible problem* was real: every phrase had the same envelope silhouette regardless of K-vertex, complex, face, or path. `scheduleExprEnvelope` ramps to `peak × env.attack` immediately, peaks at 25% of duration, sags to `peak × env.sustain` at 70%. The 3-stage shape is identical phrase to phrase; only the absolute heights vary by intensity / face envelope coefficients. Audibly: "each phrase has its own little swell," never "this phrase is a long line approaching its peak." Sustained-bowed complexes (C2 cloud, C3 hovering flat, C8 trem) suffered most — their character relies on continuous bow control over time.

**Root cause**: the 3-stage envelope was front-loading every phrase's peak at 25% then drifting downward. Even when the K-dynamic (`inst.peakExpr` from `INTENSITY_MAP`) correctly raised the ceiling, that ceiling was hit too early to serve as a *directional target* the listener could anticipate. The K-dynamic became a transient peak, not a destination or origin.

**Fix (Phase 1 of multi-phase rework)**: replace the 3-stage envelope, *for sustained multi-note complexes only* (C2, C3, C4, C8), with a single linear ramp across the full phrase duration. Direction (cresc / dim) comes from the face envelope.

1. **`schedulePhraseArc(inst, peakExpr, dir, durMs)`** — `ccForce` snaps CC 11 to start value (`peakExpr × ARC_FLOOR` for cresc, `peakExpr × ARC_CEIL` for dim); a single `rampCC` walks the rest. Voice steal cancels the ramp via existing `cancelPhrase → cancelCCRamp(CC.EXPRESSION)` plumbing — no new steal handling needed. `REGIME_EXPR_RAMP_MULT` still applies (contemplative stretches the arc, burst tightens it).

2. **`phraseArcDirection(inst)`** — face envelope dispatch. `swell` (L, F, F') → cresc; `fade` (U', L') → dim; `burst` (R') → dim; `pluck`/`stab`/`drone` (isSingle) → null (caller falls back to `scheduleExprEnvelope`). Yields a natural 3 cresc / 3 dim split across the 6 multi-note faces, self-balancing without hand-tuning the FACE_SIGNATURES table.

3. **Scope dispatch in `handleVoice`**: `ARC_COMPLEXES = {2, 3, 4, 8}` gates the new path. Gliss complexes (C5/C6/C7) skip — slide trajectory already owns the phrase contour. C1 pizz skips — single one-shot, no arc. Single-note faces (isSingle envelopes) on otherwise-arc-eligible complexes also fall back — one note doesn't need a contour.

4. **Tunables**: `ARC_FLOOR = 0.30`, `ARC_CEIL = 1.00` (fractions of `inst.peakExpr`). Headline knob is `ARC_FLOOR` — raise if cresc-start feels too quiet (kills SWAM's bow excitation at low expr values), lower if swell range feels compressed.

5. **D47 invariant** (per CLAUDE.md Recurring-Bug Discipline). The arc is a silent-failure surface: a regression in another helper writing CC 11 mid-phrase would silently cancel the ramp with no audible bug report. `inst.phraseArcDir` / `phraseArcStart` / `phraseArcEnd` stash the intent at schedule time; `scheduleRelease`'s natural-end task asserts `ccCache[CC.EXPRESSION]` reached `phraseArcEnd` within ±8 (~6%). On miss: `ARC FAIL inst N CX face=F dir=cresc landed=L want=W off=O dur=D`. On hit: `inst N CX arc=cresc 38->127 dur=2.50`. Stolen voices clear `phraseArcDir` via the next voice's snapshot — only natural ends reach the assertion.

**Why faceEnvelope and not the alternatives** (full discussion in `docs/research_notes.md` § Phrase Dynamic Arcs):

- **Tetra-orbit parity** rejected: already spent on `harmonicsForC4` (V1+even = OCT, V1+odd = OCT_5TH, V2+even = OCT_5TH, V2+odd = CTRL); doubling onto expression direction tangles two unrelated mappings on the same axis. Performers can't perceive orbit parity directly mid-performance.
- **Sexy-move toggle** (regime flip) rejected as sole driver: even when sexy-move was carrying the V1↔V2 toggle (since removed 2026-04-30), coupling path/dynamic onto a single 4-move trigger meant they could never be decoupled, and exploratory non-CFOP play wouldn't trigger it for long stretches. Loses face-identity reinforcement.
- **Sexy-move coin flip** rejected outright: random direction strips both per-face predictability AND per-regime semantics (less Xenakian, more dice).
- **Face envelope** chosen: clean 3 cresc / 3 dim split across multi-note faces; reinforces Temporal Identity directly (L vs L' now differ in dynamic *direction*, not just motion / articulation); performer agency through face choice; Phase 2 chain detection layers naturally on top.

**Steal balance (why no protective hold)**: the user observed that cresc-cut-short and dim-cut-short are symmetric — across a stream of turns, half of each truncation type. They average to natural breath, not a bug. So `schedulePhraseArc` ramps over the full duration without an early-peak hold; truncation is a feature.

**Audible verification**:
- Turn L (swell, sustained articulation): hear a long bow-pressure swell building toward the K-dynamic over the full phrase, instead of a quick swell-to-25%-then-sag.
- Turn L' (fade, release articulation): inverse — fade from K-dynamic back to soft over the full phrase.
- Same K-vertex on different faces produces audibly different *shapes*, not just different *peaks*.
- C2 cloud / C3 hovering / C8 trem benefit most — continuous bow control is their character.
- C5/C6/C7 gliss unchanged — slide trajectory was the dominant gesture there.
- C1 pizz unchanged — one-shot, no arc.

**Tradeoff (acknowledged)**: faceEnvelope is *deterministic per face* — after enough playing, L always swells and U' always fades. The detail (pitch via K_i, timbre via C_i, K-dynamic level, regime tempo, double-stops, sieve walk) still varies, so phrases are never identical, but the *direction* is predictable. This is the right tradeoff for an instrument with a forward model.

**Phase 2 (deferred — adaptive multi-turn arc chaining)**: the user wants phrase shapes that span multiple turns ("ONE crescendo/diminuendo THROUGH the four materials") without becoming a limiting factor. Design captured: when consecutive same-direction face-envelope voices arrive within a tight gap (~< 1 s onset-to-onset), the new voice's CC 11 starts where the previous ended instead of restarting at floor. Arcs *emerge* organically from coherent face-envelope sequences; break naturally on opposite-direction face, isSingle face, or pause. Reuses entire Phase 1 envelope code — only adds chain-state tracking (`state.lastVoiceEndMs`, `state.lastArcDir`, `state.lastArcCC11`). See `docs/todo.md` and `docs/research_notes.md` § Phrase Dynamic Arcs for full spec.

---

### D46 — Cross-string gliss puts SWAM into a half-engaged portamento state that doesn't match the audible leap *(RESOLVED 2026-04-24)*

**Defect** (user report): even after D42–D45 cleaned up the bridge-side gliss path, some C5 wild-gliss phrases still played as leaps instead of slides. The user accepted the leaps musically — but observed that SWAM's GUI didn't reflect them properly, suggesting the MIDI wasn't being interpreted the way the bridge intended.

**Root cause** (physical-modeling cello geometry, not a bridge bug per se):

SWAM Cello models a real cello — four strings with overlapping but bounded playable ranges (C 36–55, G 43–62, D 50–69, A 57–89 in slide-comfortable territory). `Mono Poly Release` mode engages portamento when overlapping noteons reach the same string. When source and target straddle different strings — which is common for C5's `MIN_LEAP = 8` semis at higher pitches — SWAM enters a partial portamento state from the overlap MIDI, fails to find a slide path on the source string, and bails to a string-cross leap. Audibly: a leap. GUI: residual portamento attempt indicators (modulation, slide engagement) that flicker without producing the slide. The mismatch is what the user noticed.

The bridge had no concept of cello string geometry — it sent the same overlap MIDI for every gliss step regardless of whether the transition was within-string (clean slide) or cross-string (forced leap).

**Fix**: make the bridge cognizant of string crossings and emit unambiguous MIDI for each case.

1. **`CELLO_STRINGS` table + `sameString(p1, p2)` helper**. Practical playable ranges per string (C 36–55, G 43–62, D 50–69, A 57–89 — slide-comfortable, not extreme thumb positions). `sameString` returns true iff at least one string's range contains both pitches.

2. **`leapStep(inst, target)` primitive**. Emits a clean cross-string leap: `noteOff` source notes immediately, wait `LEAP_GAP_MS = 50` ms, then `noteOn` target at `LEAP_VEL = 70`. Critical that there's no overlap — SWAM unambiguously sees a discrete note change and doesn't enter a portamento attempt. The 50 ms gap is comfortably larger than `GLISS_OVERLAP_MS = 60` ms (we want the gap to be a clean noteOff→silence→noteOn, not anything that could be read as overlap), and `LEAP_VEL = 70` is a medium-articulated cello bow strike (distinct from `GLISS_VEL = 18`, which signals "slide me" via low velocity).

3. **`glissStep` dispatch**: same-string → existing `glissNote` (overlap → portamento, GUI shows clean slide engagement); cross-string → `leapStep` (clean note change, GUI shows new note without spurious portamento state). Both paths increment per-instance counters — `glissOverlapCount` for slides, `glissLeapCount` for leaps.

4. **D42 invariant generalised**. Pre-D46: "≥1 overlap" was the success criterion. Post-D46: "≥1 (slide OR leap)" — leaps are first-class outcomes, not failures. `scheduleRelease`'s natural-end task always emits `inst N CX face=F slides=S leaps=L dur=D`; only promotes to `GLISS FAIL ... slides=0 leaps=0 ...` if both counters are 0 (the original silent-bug failure mode). The slide/leap breakdown lets the user audit string-crossing distribution per face/intensity in real time via `[print xk_swam]`.

**Audible effect**:

- Same-string transitions: identical to D45 — overlap, portamento engages cleanly, GUI shows slide.
- Cross-string transitions: previously SWAM tried to portamento and bailed to leap with vel-18 GLISS_VEL (mushy). Now the bridge emits an explicit clean leap at vel-70 LEAP_VEL — crisp string change, GUI accurately reflects the new note and string.
- C5 wild-gliss at high pitches (where 8-semi+ leaps frequently cross strings): now reads as deliberate dramatic string-jumping instead of confused slide attempts.
- C6 / C7 typically stay within one string at their typical pitch range, so they keep slide character — no audible change.

**Why this is a clean fix instead of another patch**: the slide/leap distinction is the actual physical truth of cello playing. Modelling it explicitly in the bridge means SWAM gets unambiguous MIDI intent on every transition, the GUI matches what's heard, and the user can verify the breakdown in real time via the always-on telemetry. Future work on string-aware effects (e.g., per-string articulation, bow change cues) has the geometry table to build on.

---

### D45 — Dense gliss phrases collapse to fast leaps because SWAM portamento can't engage in time *(RESOLVED 2026-04-24)*

**Defect**: User report after D42–D44 landed:

> "seems to be working better for the gliss, but sometimes the 'wild gliss' stuff just does fast leaps instead. ... i like the overall shape and density, but i think sometimes it is too fast or something for the vst and it just plays leaps. maybe they need to be spaced out just a tiny bit more?"

The user's diagnosis was on the nose. C5 phrases with high `count` and short `dur` were scheduling glissNote calls 50–120 ms apart. SWAM Cello's Mono Poly Release portamento needs ~150–200 ms (depending on `Portamento Time` CC 5 + the preset's `Portamento Max Time`) to actually engage and slide between two pitches. When the next overlapping noteon arrives sooner, SWAM aborts the in-progress slide and jumps to the new target — audibly indistinguishable from a discrete leap.

**Math walkthrough that confirmed it**:

`faceShapedCount(inst, 4, 9, true)` for ff intensity (`density = 1.5`) on a burst face (`countMult = 1.8`) can return up to 12 (clamped). `phraseC5`'s old scheduler distributed those events across `(tailStart, tailEnd) = (FIRST_GLISS_MS + 150, durMs * 0.92) = (300, 920)` ms for a `dur = 1 s` voice. Linear distribution: 12 events / 620 ms tail = ~52 ms per event. SWAM's portamento window is ~150–200 ms minimum. So 3–4 in 4 events were arriving mid-slide and triggering the leap fallback. The user heard a salvo of leaps with the occasional successful slide — "sometimes" matched the random variability of which events landed where.

**Fix**:

1. **`MIN_GLISS_SPACING_MS = 200`** new constant in `max/xk_swam.js`. Hard floor on the spacing between consecutive `glissStep` events on a single phrase. 200 ms picked as the comfortable upper bound on SWAM's slide engagement time across C5/C6/C7 (port times 50/80/115 in CC scale).

2. **`glissSchedule(maxCount, firstMs, tailEnd, minSpacingMs)`** new helper. Returns timestamps starting at `firstMs` and using `max(idealSpacing, minSpacingMs)` between events. If a scheduled event would land past `tailEnd`, the array is truncated and the caller treats `times.length` as the authoritative count. Preserves the D43 immediate-first-gliss invariant: `times[0]` is always `firstMs`.

3. **All three gliss phrases** route through `glissSchedule`:
   - `phraseC5` — schedules `requestedCount` slides, anchor fired separately at t=0.
   - `phraseC6` — schedules `requestedCount - 1` slides (anchor occupies idx 0); `commitSieveWalk` is now called with the *actual* `totalCount` returned by the helper, not the requested one, so the sieve walker doesn't over-commit when the schedule clipped events.
   - `phraseC7` — schedules `driftCount` drifts, anchor fired separately.

**Effect on density**:

| Phrase | dur (s) | Requested count | Old min spacing | New count after clip | New spacing |
|--------|---------|-----------------|-----------------|----------------------|-------------|
| C5 typical | 2.0 | 6 | ~337 ms (already above floor) | 6 (no change) | 337 ms |
| C5 dense burst | 1.0 | 12 | ~52 ms (leap collapse) | 5 | 200 ms |
| C5 short | 0.5 | 4 | ~88 ms (leap collapse) | 2 | 200 ms |
| C6 typical | 2.0 | 5 (1 anchor + 4 slides) | ~370 ms | unchanged | unchanged |
| C7 typical | 3.0 | 3 (1 anchor + 2 drifts) | ~750 ms | unchanged | unchanged |

So the floor only clips when the phrase is genuinely too dense for SWAM to keep up. Typical playing is unaffected.

**Docs**: `CLAUDE.md` Bridge Invariants table gains a "Min gliss spacing" row. Telemetry — none new; D42's "GLISS FAIL overlaps=0" still catches the case where the schedule somehow returned zero events (it doesn't, by construction — `firstMs` is always emitted).

---

### D44 — Bow Polyphony state drift: diff guard silently freezes SWAM in the wrong mode *(RESOLVED 2026-04-24)*

**Defect**: D43 added stochastic double stops to C2/C3/C8, but the user reported they weren't audible — and confirmed by watching the SWAM GUI that Bow Polyphony mode never switched between gliss and bowed complexes. The bridge thought it was sending Double/Hold; SWAM stayed visibly in Mono Poly Release.

**Root cause** (bridge-side, NOT preset-side):

`setBowPolyphony` had a diff guard `if (inst.bowPoly === target) return` — early exit when the bridge's cached state matched the target. The intent was avoiding redundant CC 81 writes. The hidden cost: any time the bridge's cache drifted out of sync with SWAM's actual state, the bridge would never re-assert and the plugin stayed stuck.

The drift's origin was a startup race:

1. Patch `[loadbang]` fires both `max_active 1 → v8 inlet` (which triggers `bang()` → `resetInstance()` → `setBowPolyphony(DOUBLE_HOLD)` → `ccForce(CC 81 = 89)`) and `[read xenakube_2.swam] → vst~` (which loads the preset). The two paths are unsynchronised.
2. If the CC 81 = 89 write reached `[vst~]` before the preset finished loading, it was either swallowed (plugin not ready) or overwritten by the preset's saved Bow Polyphony default — which after the long D34/D35/D38/D39/D42/D43 gliss-debugging sessions was almost certainly Mono Poly Release.
3. The bridge's cache now said Bow Polyphony = Double/Hold; SWAM was actually in Mono Poly Release.
4. User plays a C2 voice. `setupComplex(2)` calls `setBowPolyphony(DOUBLE_HOLD)`. The diff guard sees `inst.bowPoly === DOUBLE_HOLD` and returns early. NO CC 81 written.
5. SWAM stays in Mono Poly Release. The companion noteOn from `maybeDoubleStop` is interpreted as a slide target. User hears one note, sometimes with a tiny portamento — never a double stop.

The audible signature was distinctive: a quieter "second note" near in pitch to the main, occasionally with a brief slide — exactly what SWAM produces when Mono Poly Release sees overlapping noteons that we'd intended as a chord.

**Fix**:

1. **Drop the diff guard** in `setBowPolyphony`. Selectors are cheap to re-assert; the cost of one extra CC 81 write per `setupComplex` call is negligible. The bug it was guarding against (CC firehose) doesn't apply to selectors that fire only on complex change.

2. **Per-voice CC 81 re-assertion in `handleVoice`**, next to the existing CC 5 portamento wiggle. Even when `setupComplex` is skipped (same complex as previous voice), CC 81 is force-written from `cmx.bowPoly`. The bridge can never silently lag SWAM beyond one voice event.

3. **Logging**: `setBowPolyphony` emits `inst N bowPoly=T cc81=V` on every call. The user can now verify via `[print xk_swam]` that the bridge is asserting the expected mode for each complex — separating bridge bugs from preset bugs.

**Generalisation**: `setHarmonics` and `setTremolo` still have the same diff-guard pattern. They haven't been reported broken — possibly because their bands cover the relevant modes more forgivingly, possibly because the user hasn't yet hit the right combination. The fix recipe is documented in `CLAUDE.md § Bridge Invariants` and should be applied if either selector is ever observed to drift.

**Docs**: `CLAUDE.md` gains a "Selector re-assertion" row in the Bridge Invariants table.

---

### D43 — Gliss slide lands too late; double stops never generated on bowed/sustain complexes *(RESOLVED 2026-04-23)*

**Defect** (two parallel user reports):

1. **"The first slide lands too late."** With the D42 fix in place, every gliss complex voice now produces a real overlap — but the first `glissStep` was scheduled at `(1/(count+1)) * dur * 1000 * 0.92`. For a 2-second C6 voice with count=3 that's ~460 ms of anchor before the first slide; for a 300 ms phrase stolen by a fast next turn, no slide at all. The user's forward model expects the gesture to read as gliss from the earliest moment: *"should begin with an immediate gliss, otherwise it just sounds like a sustained note."*

2. **"Where the hell are all the double stops?"** Every phrase generator (C1–C8) had been strictly monophonic — one `noteOn` at a time. But the COMPLEX table has set `bowPoly: BOW_POLY.DOUBLE_HOLD` on C1/C2/C3/C4/C8 since D35, specifically because Double/Hold is the Bow Polyphony mode that allows simultaneous noteons to sound as double stops. The MIDI control plane was fully configured; the content layer never made use of it. Bowed sweep (C2), sustain (C3), and tremolo cluster (C8) in particular are the complexes where cellists would naturally play double stops on a real instrument.

**Fix**:

1. **`FIRST_GLISS_MS = 150`** — new constant in `max/xk_swam.js`. `phraseC5` schedules idx 0 at `FIRST_GLISS_MS`; `phraseC6` schedules idx 1 (idx 0 is the anchor legato) at `FIRST_GLISS_MS`; `phraseC7` schedules its first drift at `FIRST_GLISS_MS`. Remaining slides in each phrase distribute through `(FIRST_GLISS_MS + 150..250, durMs * 0.88..0.92)` via `(idx / stepCount) * tailLen`. `scheduleRelease`'s 200 ms floor (`Math.max(dur * 1000, 200)`) is always greater than `FIRST_GLISS_MS`, so the first slide never races the release ramp even at sub-200 ms durations.

2. **Double stops on C2 / C3 / C8**:
   - **`doubleStopCompanion(main)`** picks an interval from `[3, 4, 5, 7, 8, 9, 12]` semitones (weighted toward the naturally-resonant cello double-stops: m3, M3, P4, P5, m6, M6, octave). Direction biased by register: main ≥ MIDI 60 → companion below; main ≤ MIDI 48 → companion above; mid-range → random. Clamped to the comfortable double-stop range 36–77; flipped if out of range; returns null on impossible cases (never hits in practice).
   - **`maybeDoubleStop(inst, main, vel, p)`** fires the companion noteOn at 85% of `vel` with probability `p` and registers it in `inst.activeNotes`. The next legato overlap / scheduleRelease / stealInstance / allNotesOff path tears both pitches down together using existing machinery — no leak, no stuck notes.
   - **C2** (bowed cloud): 35% per-step after idx 0. First attack stays clean so the ear establishes the main pitch before the interval lands.
   - **C3** (hovering flat): 40% per-step after idx 0. C3's constant-register character reads cleanest as held intervals.
   - **C8** (tremolo cluster): 30% chance of a phrase-long companion. Picked once at phrase start and reused across every rebow, so the cluster reads as a fixed sul-pont interval rather than a rotating set.
   - **C1 (pizz)** and **C4 (harmonics)** not modified in this pass. Both have `DOUBLE_HOLD` and could accept the same pattern later; deferred pending musical judgment on pizz double-stop density and harmonic-atom chord voicings.

3. **Intentionally not added to C5/C6/C7 gliss complexes.** Their `bowPoly: MONO_POLY_RELEASE` mode reinterprets a second overlapping noteOn as a slide target, so a "double stop" on a gliss phrase would just become another gliss. Double-stop gliss (a chord with internal portamento, e.g. parallel-5th slides) would need its own path — a second `inst` subvoice with different bow-polyphony state, or an entire complex C5' / C6' with different semantics. Tracked as a Phase B phrase-library candidate, not part of D43.

**Docs**: `CLAUDE.md` Bridge Invariants table gains the "Immediate first gliss" row; `max/ directory` row updated with the `FIRST_GLISS_MS` constant and the `doubleStopCompanion` / `maybeDoubleStop` helpers. Not documenting double stops as an invariant (they're probabilistic by design) — if they silently disappear, the user will hear it and we'll add telemetry then.

---

### D42 — Gliss collapse: face `isSingle` envelopes erased the slide invariant on half the faces *(RESOLVED 2026-04-23)*

**Defect**: "Ord gliss" (C6) and "wild gliss" (C5) cards on the dashboard frequently produced a single sustained note with no audible slide. Occasionally a second, much quieter note of the same pitch followed — audible as "a single note that gets softer," no glide. Symptom reported repeatedly since Phase A1 landed; previous "gliss fix" commits (D34, the 2026-04-23 "gliss kick" for CC 5 staleness) each addressed a different failure mode and left this one in place.

**Root cause — two compounding structural bugs + one design error**:

1. **`faceShapedCount(forGliss=true)` returned 0 on `isSingle` envelopes.** Phase A1 sculpt pass (2026-04-21) introduced `ENV_PROFILE.isSingle` to collapse phrases to a single note on pluck/stab/drone faces — `U / D / D' / R / B / B'`, exactly half the 12 face-moves. For gliss complexes the helper returned 0 subsequent notes: `phraseC5` ran its `for` loop zero times (anchor legatoNote only), `phraseC6` routed `idx === 0 || isSingle` to legato (anchor only), `phraseC7` skipped `if (!isSingle)` entirely. Result: on any turn whose face was in the isSingle set, the gliss complex produced a single legato note with no overlap. SWAM's Mono Poly Release detector *needs* overlapping noteOns to engage portamento — a single noteOn slides to nothing. 50% of gliss voices were silent-by-design.

2. **Same-pitch fallback in `phraseC5` / `phraseC6`.** Even on the other 6 faces, when the sieve was narrow or the walker stalled at a boundary, `pickPitch` would return the same pitch as the anchor. `phraseC5` had a 12-attempt MIN_LEAP guard that gave up silently; `phraseC6` had no leap guard at all. The resulting `glissNote(samePitch)` emitted a noteOn at the anchor's pitch with vel=18 — SWAM slid to itself (zero-length slide) and the listener heard "anchor note, then the same note much quieter" when the anchor's noteOff fired 60 ms later.

3. **The comment "gliss character survives via Mono Poly Release bow polyphony" was factually wrong.** Bow Polyphony is a mode the plugin is in; it doesn't synthesise a slide out of one note. The mistake was baked into the phrase generators' comments and the `CLAUDE.md` description — a wrong architectural assertion that let the collapse-to-single logic look correct on code review.

**Meta-cause**: three "gliss fixes" across three commits (D34, later gliss-overlap bump, "gliss kick" CC 5 wiggle) all patched specific failure modes without introducing any runtime invariant. The next refactor (face envelope) silently broke the feature again. This is the pattern the new `CLAUDE.md § Recurring-bug discipline` explicitly forbids.

**Fix** (`max/xk_swam.js`):

1. **New `glissStep(inst, source, target, minLeap)` primitive** — now the ONLY path by which C5/C6/C7 emit subsequent pitches. Internally calls `enforceLeap(source, target, minLeap)` which coerces target ≥`minLeap` semitones from source (clamped to cello range, direction flipped at boundaries so corners never collapse back into the dead zone) and then `glissNote(humanPitch(p))`. Increments `inst.glissOverlapCount`. Same-pitch overlap is structurally impossible; the leap is enforced not hoped.

2. **`faceShapedCount(forGliss=true)` minimum is 1, not 0.** Every C5/C6/C7 voice must emit at least one slide. Face envelope still reshapes duration, velocity, register, and contour — just can't erase the slide.

3. **Per-phrase rewrites**:
   - `phraseC5` — `count = Math.max(1, …)`; leap guard's 12-attempt fallback now passes through `glissStep` so failure still produces a leap.
   - `phraseC6` — forces `count ≥ 2` (anchor + ≥1 slide). Drops the `|| isSingle` branch in the per-idx dispatcher; idx ≥ 1 always routes through `glissStep` with `minLeap = 1` (respects sieve walk, only kicks in when walker stalls).
   - `phraseC7` — always fires ≥1 drift regardless of `isSingle`. `delta === 0` guard forces ±1 so the drift has somewhere to slide to.

4. **Runtime invariant + telemetry**. `handleVoice` sets `inst.glissExpected = (complexType === 5 || 6 || 7)` and resets `glissOverlapCount = 0`. `scheduleRelease`'s natural-end task logs `GLISS FAIL inst N CX face=F motion=M overlaps=0 dur=D` if the counter is 0 when a gliss phrase finishes naturally. `stealInstance` clears the flag so fast-turn phrase cuts don't trip false positives (user intent, not a bug).

**Why this is the last gliss fix**: the telemetry means the next modulator that threatens the invariant — intensity map, regime multiplier, voice stealing, some future face feature — will produce a loud log line during dev instead of a silent regression discovered in performance weeks later. The invariant is the commitment; the fix is just what makes the invariant currently hold.

**Docs**: `CLAUDE.md` gains a "Bridge Invariants" section and a "Recurring-bug discipline" rule in Self-Maintenance. Max/ directory row updated to describe `glissStep` as the gliss-phrase primitive and the GLISS FAIL telemetry path.

---

### D40 — Single-instance bottleneck: refactor to N-voice SWAM instance pool *(RESOLVED 2026-04-20 · REVERTED 2026-04-23)*

**Defect**: The bridge drove a single `vst~` SWAM Cello 3 instance. Every turn's voice shared the same CC/KS address space, so overlapping turns stomped each other: turn N's `setupComplex` would rewrite CC 78 Harmonics / CC 81 Bow Polyphony / KS Play Mode mid-phrase of turn N-1, forcing every in-flight voice onto the new complex's technique. For fast sequences (sexy-move quartet, `R U R' U R U2 R'`, etc.) the audible result was one continuously-retargeted cello line rather than distinct overlapping gestures. Even with D34 (Mono gliss) + D35 (Double/Hold per complex) + D33 (CC slew) fully honoured, a second turn on a different complex would always cut the first short, because the VST had one Play Mode at a time and the bridge kept the last writer's state.

**Root cause**: architectural, not control-plane. D1–D39 correctly modelled SWAM's CC/KS behaviour for *one* voice; they can't stack voices because SWAM Cello 3 is inherently monophonic within its single-instance Play-Mode context. The only way to get N independent technique trajectories is N physical VST instances. The Max side had to grow a `poly~` with parallel DSP, and `xk_swam.js` had to shard every piece of mutable voice state (Play Mode, Harmonics, Tremolo, Bow Polyphony, CC cache, ramp tasks, scheduled phrase tasks, active-notes list, face-gesture snapshot fields, expression env state) off the global `state` object and onto a per-instance record.

**Prerequisite verified in Max**: poly~ with `@parallel 1` at 8 voices on an i7-8700K holds ~40% DSP CPU under max-rate cube turning. `polymidiin` + `midiparse` (midievent outlet) is required inside the poly~ subpatch — plain `in` won't route MIDI correctly. Each voice's SWAM instance must be opened individually and its preset set to `default` (Max preset-save per-poly-slot is per-instance, not shared).

**Fix** (`max/xk_swam.js` — full rewrite, 1892 → 1681 lines):

1. **Outlets and pool** — `POOL_SIZE = 8`, `outlets = POOL_SIZE + 1`, `DEBUG_OUTLET = POOL_SIZE`. Outlets 0–7 fan out to the poly~ voice targets; outlet 8 is the `print xk_swam` debug sink.
2. **Per-instance record** — `makeInstance(id)` builds one shard per voice:
    - Lifecycle: `id`, `outlet` (= id), `status ∈ {IDLE, PLAYING, RELEASING}`, `allocatedAt`, `lastVoiceTime`.
    - Technique selectors (previously on `state`): `activeComplex`, `playMode`, `harmonics`, `tremolo`, `bowPoly`, `gestureMode`, `altFing`, `keepBowDir`.
    - CC machinery: `ccCache`, `ccRampTasks`, `ksPending`, `ksForceCount`, `forceKS`.
    - Scheduling: `activeNotes` (note list for `allNotesOff`), `phraseTasks` (cancellable phrase Tasks), `releaseTask`.
    - Voice-shot snapshot (captured from globals at `handleVoice` time, frozen for the phrase lifetime): `intensity`, `density`, `duration`, `path`, `transpose`, `tetra`, `faceDurationBias`, `faceTranspose`, `faceEnvProfile`, `faceOffVelOverride`, `faceReleaseMult`.
    - Expression state: `baseExpr`, `peakExpr`, `bowPressureBase`.

    The `instances` array is built once at module load; nothing ever adds/removes records.
3. **Voice stealing** — `allocateInstance()` prefers IDLE; if none, the oldest RELEASING (lowest `lastVoiceTime`); finally the oldest PLAYING. Stealing calls `stealInstance(inst, now)` which runs `cancelPhrase(inst, false)`, cancels `inst.releaseTask`, and fires `allNotesOff(inst)` before the new voice's phrase dispatch — the previous voice's tail dies cleanly on its own outlet. No cross-instance interference.
4. **Parameterized MIDI helpers** — every primitive now takes an `inst` first argument and routes via `outlet(inst.outlet, "midievent", …)`: `noteOn`, `noteOff`, `cc`, `ccForce`, `rampCC`, `cancelCCRamp`, `keyswitch`. Selector-diff helpers follow the same pattern: `setPlayMode(inst, …)`, `setHarmonics`, `setTremolo`, `setBowPolyphony`, `setEnum`. `harmonicsForC4(inst)` reads `inst.path / inst.tetra` (the D37 rotation still resolves per-voice; V2+odd still reaches CTRL). Scheduling is parameterized too: `scheduleAt(inst, ms, fn)`, `cancelPhrase(inst, preserveLegatoTail)`, `allNotesOff(inst)`, `scheduleRelease(inst, dur)`. Every phrase generator `phraseC1…phraseC8` takes `inst` and writes only to that instance's CC/note stream.
5. **Status lifecycle** — `handleVoice`: IDLE/RELEASING/PLAYING → PLAYING (on allocation, `lastVoiceTime = now`). `scheduleRelease` inner task: PLAYING → RELEASING (the instance still has sounding tails but is preferentially reusable). `scheduleRelease` off-task: RELEASING → IDLE.
6. **Shared sieve walker** — `state.sieve / sieveIdx / sieveDir / sieveHistory` and `commitSieveWalk(count)` remain global. This is the core Xenakian contract: pitch coherence across concurrently-sounding voices comes from a single walking index through the metabola, not N independent walkers. A removed-from-D40 earlier draft did per-complex sieve reset in `setupComplex` — that gets stomped by subsequent instances restarting the walk mid-other-voice, so it was removed.
7. **Global continuous modulators iterate active instances** — `handleExprTilt / Spin / Dev / Scramble` loop `for (var i = 0; i < POOL_SIZE; i++)`, skipping `status === 'IDLE'`, writing per-instance CCs (Bow Position, Vibrato Depth/Rate, Bow Pressure, Expression scramble). So the cube's live gyro reshapes every currently-sounding voice in parallel — the "overlapping phrases all respond to my hands" feel is preserved. `handleRegime` broadcasts the new attack-ramp multiplier to all PLAYING instances.
8. **Spell routing** — transient pings use a defined instance:
    - Accent spells (`sexy-move`, `anti-sune`) route through `instances[state.lastAllocatedInstance]` so they layer on top of the voice that just fired (set by `handleVoice`).
    - Dedicated-note pings (`oll-cross`, `sune`, `niklas`, `u-perm`) route through `instances[0]`. Pragmatic — these are timbral signatures meant to ring as a discrete event, not a continuation of a per-turn voice. A per-spell allocation pass (below) would promote each ping to its own instance.
9. **Reset & watchdog** — `resetInstance(inst)` cancels all tasks/ramps/KS-pending, clears `ccCache` / `activeNotes`, null-seeds every selector field (so the next `setupComplex` fires each KS/CC as a diff), writes the silent CC baseline, then pins `GESTURE = EXPR`, `HARMONICS = OFF`, `TREMOLO = OFF`, `BOW_POLY = DOUBLE_HOLD`. `bang()` iterates all instances. `watchdogTick` checks orphan conditions per-instance (note-off without corresponding noteOn, release task overrunning its deadline).
10. **Debug logging** — `log(msg)` writes to the debug outlet (`outlet(DEBUG_OUTLET, "xk_swam: " + msg)`) so Max's `print xk_swam` still receives every line while outlets 0–7 stay clean MIDI paths.

**Patch topology change**:
```
[udpreceive 57121] → [v8 xk_swam.js @autowatch 1] → outlets 0..7 → [poly~ swam_voice 1 @parallel 1 @voices 8]
                                                  outlet 8 → [print xk_swam]
                                                                                                  ↓
                                                                                          [dac~ 1 2]
```
Inside `swam_voice.maxpat`: `polymidiin` → `midiparse` (midievent outlet) → `vst~ "SWAM Cello 3" 2` → outputs routed back up through the poly~ summing bus. Plain `[in]` objects won't carry MIDI into the subpatch — `polymidiin + midiparse` is the correct path. `tester.maxpat` still documents the 4-object single-instance chain for hand-testing hypotheses; it's marked as the legacy harness, not the live topology.

**Preset requirement per instance**: Max saves poly~ VST presets per-instance-slot, not globally. Open each voice's SWAM GUI once (double-click the voice in the poly~ edit window) and set its preset to `default` (or the `xenakube_cello` preset from D1 prerequisites once saved). Without this, voices 1–7 fall back to whatever SWAM loaded at first launch.

**Verification**:
- Fast sexy-move (`R U R' U'`) → four distinct cello utterances overlapping, not one line morphing between techniques. If a Mono gliss complex (C5/C6/C7) and a Pizz complex (C1) fire back-to-back, the gliss continues to slide on its own instance while the pizz plucks on another — previously the pizz's KS wrote Bow Polyphony = Double/Hold and killed the gliss's Mono Poly Release mid-slide.
- Live gyro on a held cube with 4 active voices → every active instance's Bow Position / Vibrato / Expression walks with tilt/spin/dev; turning the cube still reshapes currently-sounding phrases. Confirm with `ks_logger` on any one voice slot: per-voice CC stream stays coherent with its own complex throughout the phrase.
- Burst past POOL_SIZE (rapid turning > 8 overlaps) → voice stealing kicks in; the oldest RELEASING voice dies cleanly (watch its outlet go silent before the new phrase starts). No stuck notes, no double-triggering on the stolen instance.
- Panic (`/xk/panic` or WS disconnect) → `bang()` resets all 8 instances; every VST voice goes silent simultaneously. No per-instance residual.
- DSP CPU at POOL_SIZE = 8 with `@parallel 1` should sit ≈35–45% on an i7-8700K under max-rate turning.

**What's left**:
- **Per-spell instance allocation**: harmonic-ping spells currently share `instances[0]`. A cleaner design allocates a dedicated slot per spell event (`allocateInstance()` returns free/stolen voice, the ping plays, `scheduleRelease` returns it to IDLE). Deferred — current routing is audible and consistent.
- **Shared vs per-instance sieve walker follow-up**: if Phase B phrase-library playback introduces structurally-independent voice lines (e.g. a spell phrase riding on top of per-turn voices), a per-phrase sieve clone may help. Gated on Phase B design, not D40.
- **POOL_SIZE scaling**: 8 holds 40% DSP on an 8700K; higher CPUs can probably push 12–16. Leave at 8 until a performance limit is hit — bigger pools mean more stolen voices and more instance-preset management overhead.

**Reverted (2026-04-23 — `max/xenakube_cello.maxpat`, v5)**: the pool is collapsed to one slot in live use. Two concrete failures drove the revert:

1. **SWAM Ambiente overlap.** SWAM Cello 3 v3.10+'s Ambiente panel auto-registers every loaded VST instance as a reverb source in a shared virtual studio. With 8 `poly~` voices all loading `default`, the plugin warned "Instruments Overlapping: adjust placement" on every cold load and summed identical sources into phase cancellations that were audible even with `MAX_ACTIVE = 2` (6 idle instances still contributing to the reverb bus). Ambiente parameters aren't exposed via MIDI-Learn (VST automation only), so per-instance spatialisation can't be patched from the bridge — the three user-side fixes (disable Ambiente in the default preset, per-voice panning, per-voice presets) each add manual per-instance setup that negates the pool's plug-and-play advantage. See `docs/swam_cello_reference.md` §7.
2. **CPU × 8 for texture the composer didn't want.** DSP floor was ~40% per the original verification; single instance sits ~5%. The pool's value was "overlapping turns render as overlapping gestures" — in practice the composer preferred the monophonic Xenakis feel where each turn cleanly steals the previous, so the 8× CPU bought nothing musical.

**v5 topology**: `[udpreceive 57121] → [gate] → [v8 xk_swam.js] → outlet 0 → [vst~ "SWAM Cello 3"] → DSP chain → [dac~]`. `POOL_SIZE = MAX_ACTIVE = 1`; `emitMidi` no longer emits `target N` (the poly~ routing directive) — just the bare `midievent status b1 b2`. The `instances` array is still built, `allocateInstance` still runs, `stealInstance` still fires CC 120 + CC 123 + CC 11=0 on every new voice — all the per-voice state (ccCache, activeNotes, phraseTasks, face snapshots, status lifecycle) keeps its home as `inst.*`, so the phrase / release / CC-ramp / gyro-modulator code paths are untouched. The revert is one `POOL_SIZE` constant + one `outlet("target", …)` deletion + the patch-side topology swap; no logic loss.

**To re-enable polyphony**: (a) raise `POOL_SIZE` and `MAX_ACTIVE` in `xk_swam.js`, (b) restore the `outlet(MIDI_OUTLET, "target", inst.voice);` line in `emitMidi`, (c) swap `[vst~ "SWAM Cello 3"]` in the patch for `[poly~ swam_voice @parallel 1 @voices POOL_SIZE]`, (d) restore the `swam-voice.maxpat` `polymidiin → midiparse → vst~ "SWAM Cello 3"` subpatch. The Ambiente overlap remains the hard prerequisite — either disable Ambiente in the preset or save per-voice spatialised presets before scaling beyond 1 instance.

### D39 — Tremolo rate modulation: replace 60 Hz spin+breath with per-phrase stochastic envelope *(RESOLVED 2026-04-18)*

**Defect**: D38 proved CC 80 writes are honoured mid-note (slider visibly walked, rate audibly moved), but the performer reported the result as "extremely jittery and doesn't really do much." Two structural problems in D38's formula `base + spinEMA×30 + 12·sin(0.25Hz·t)`:

1. **Jitter**: `spinEMA × 30` reacts to every spin bump at 60 Hz. The cube almost always has some residual spin > 0.02 (Kalman-filtered sensor noise), so the rate wobbled constantly without coherent shape.
2. **Shallow excursion**: the 0.25 Hz breath only had ±12 amplitude on a 0–127 scale (≈10%). Not enough to read as a musical *gesture*; it sounded like nervous wobble rather than accelerando/rallentando.

The user's actual want, stated explicitly: "every tremolo [phrase] to result in three different, stochastic ways; 1) tremolo starts slow and speeds up gradually; 2) tremolo starts fast and slows down gradually; 3) tremolo is at some steady rate." A **phrase-level shape**, not a continuous performer-input modulator.

**Root cause**: D38 chose the wrong layer. CC 80 doesn't want a 60 Hz gyro-reactive modulator — it wants a *compositional envelope* scoped to the phrase, just like CC 11 Expression already has via `scheduleExprEnvelope`.

**Fix**: new per-phrase stochastic envelope in `handleVoice`, replacing the D32 onset jitter block *and* removing D38's `updateTremoloRate` entirely (the call from `handleExprSpin` is dropped).

At voice onset on a tremolo-active complex (`cmx.tremolo !== OFF && HAS_TREMOLO_RATE`):

```
cancelCCRamp(CC.TREMOLO_RATE)           // interrupt any in-flight ramp
phraseMs = max(duration * 1000, 250)
roll = Math.random()
if roll < 1/3:   ccForce(SLOW); rampCC(TREMOLO_RATE, FAST, phraseMs)   // slow → fast
else if < 2/3:   ccForce(FAST); rampCC(TREMOLO_RATE, SLOW, phraseMs)   // fast → slow
else:            ccForce(steadyBase)                                   // steady
```

`SLOW = 20`, `FAST = 118`, `steadyBase = cmx.tremoloRate × intMap.tremRateMult × pathTrem` (clamped). Span is wide on purpose — each tremolo phrase should be recognisable as ascending, descending, or static by ear. `rampCC` reuses the D33 slew limiter (15 ms ticks), the same code that handles CC 11 between envelope stages.

**Why this works where D38 didn't**:

- **Coherent gesture per phrase**: every C8 (or other tremolo-active) voice commits to one of three shapes at onset. The re-bow strokes inside `phraseC8` all read the same walking rate, so the bowing sounds like one continuous accelerando/rallentando/steady line.
- **Stochastic but legible**: three outcomes equally weighted → audibly variable across the performance but each instance is internally coherent.
- **Reuses proven machinery**: `rampCC` already powers the D33 expression stair-step fix; no new task plumbing or scheduling edge-cases.

**Dropped mechanisms**:

- **D32 ±8% per-voice jitter**: removed. The ramp IS the motion; jitter only muddied the shape.
- **D38 `updateTremoloRate`**: removed (function deleted, call from `handleExprSpin` removed). Gyro (`spinEMA`) no longer influences tremolo rate at all. If we want performer input on rate later, it should layer on top of the ramp, not replace it.

**Verification**:

- Trigger several C8 voices in a row on a still cube: roughly 1/3 should audibly accelerate, 1/3 decelerate, 1/3 hold steady. The SWAM `Tremolo Min Speed` slider visibly walks for the ramp cases, stays put on steady.
- Rapid turn → new voice mid-phrase → previous ramp cancels cleanly (via `cancelCCRamp`) and the new phrase starts its own roll. No stuck ramp tasks.
- Non-tremolo complexes (C1–C7): no CC 80 traffic at all, cache untouched. Confirm with `ks_logger` pass-through.

**What's left**: no gyro coupling at all on CC 80 for now. If the performer wants to bias the roll (e.g. burst regime always picks fast→slow, contemplative regime always picks slow→fast), that's an easy follow-up — roll weights become regime-dependent. Similarly, the SLOW/FAST endpoints could be intensity-scaled so `fff` gets wider excursions than `p`. Scope left open until the user has lived with the uniform 1/3 roll for a session.

### D38 — Tremolo rate frozen during sustained note (CC 80 only written at voice onset) *(SUPERSEDED by D39, 2026-04-18)*

**Note 2026-04-18**: D38's continuous 60 Hz modulator is removed. The performer-facing problem (CC 80 static during held notes) is better solved by D39's per-phrase envelope than by gyro-driven continuous modulation. D38's reachability finding — CC 80 *can* be written mid-note and SWAM responds in real-time — is the foundation D39 builds on. Original D38 entry preserved below for historical context.

**Defect**: Performer report — "I have still yet to hear a tremolo changing its speed DURING the tremolo, which we have confirmed works when performed manually (dragging the slider for `Tremolo Min Speed` under Play Modes → Right Hand)." Manual slider drag proves SWAM honours CC 80 mid-note; the bridge just never sends it after the voice event.

**Root cause**: D32 introduced per-voice Tremolo Min Speed modulation (intensity × path × ±8 % jitter) via `ccForce(CC.TREMOLO_RATE, …)` inside `handleVoice` — a **one-shot at voice onset**. For a C8 phrase that sustains 2–4 s across multiple bow re-strokes, the slider latches at the onset value and stays there for the whole note. None of the four continuous-expression handlers (`handleExprTilt/Spin/Dev/Scramble`) touches CC 80, so there is no 60 Hz writer. Additionally, `shouldTransmit`'s spin deadband (<0.02 for ≥200 ms → suppress) would have blocked anything placed naively inside `handleExprSpin`, which is the exact held-cube scenario where a performer sustains a tremolo note.

**Fix**: new continuous `updateTremoloRate(now)` modulator in `max/xk_swam.js`, called from `handleExprSpin` **before** `shouldTransmit` so the spin deadband doesn't freeze it.

Formula (clamped 0–127, written via cached `cc()` so unchanged rounded ints collapse at the MIDI level):

```
base   = cmx.tremoloRate × intMap.tremRateMult × (path === "V2" ? 0.85 : 1.0)
spin   = state.spinEMA × 30
breath = 12 · sin(2π · 0.25 Hz · now_ms/1000)
CC 80 = clamp(base + spin + breath, 0, 127)
```

Gated on `cmx.tremoloRate != null && cmx.tremolo !== TREMOLO.OFF && HAS_TREMOLO_RATE`, so only complexes with tremolo actually move the slider. Spin drives rapid, gesture-coupled speed-ups; the 0.25 Hz sine breath keeps the rate audibly alive even when the cube is held perfectly still — the core failure mode the user described.

The D32 per-voice jitter is preserved as an immediate onset perturbation before the first 60 Hz tick arrives, even though the continuous modulator subsumes its "slider never looks frozen" intent.

**Verification**:
- Trigger a sustained C8 voice on a still cube → listen for the shiver pulse speeding up and slowing down at ~4 s period (the 0.25 Hz breath). Slider should visibly walk in the SWAM GUI, not freeze.
- Fast-rotate the cube during a C8 note → shiver speeds up proportionally to spin, decays back on release (spinEMA α = 0.08, ~400 ms settle).
- Switch to a non-tremolo complex (C1–C3, C5–C7) → CC 80 writes stop cold, no traffic. Cross-check with `ks_logger` if needed.
- With `HAS_TREMOLO_RATE = false` (preset without CC 80 MIDI-Learn) → `cc()` no-ops via `hasCC`, zero regression.

**What's left**: tilt-driven rate was considered but rejected (conflicts with D4 Bow Position timbral sweep — we'd double-book tilt). A future expansion could modulate via the Expression envelope position (e.g. tremolo accelerates into the release stage) but that's additive, not needed for the user's ask.

### D37 — SWAM Harmonics: only 2 of 4 modes reached the sound path *(RESOLVED 2026-04-18)*

**Defect**: Performer report — "only works with harmonics option 2 or off; 3 and 4 (`4 Control`) all sound different and should be utilized." `COMPLEX[4].harmonics` was hard-coded to `HARMONICS.OCT` (option 2, 2nd-harmonic flageolet), every other complex was `HARMONICS.OFF`, and the sole harmonic-writing spell (`oll-cross`) also used `OCT`. So SWAM's `OCT_5TH` (option 3, perfect-12th) and `CTRL` (option 4, user-selectable partial) were dead state — the bridge's `setHarmonics()` + `HARMONICS_CC_VAL` + `HARMONICS` enum had all 4 codes wired, nothing called them.

**Root cause**: D31 resolved "Harmonics/Tremolo KS never reach all states" by routing through CC 78 (SWAM's documented CC path, reaches every state including `4 Control` that KS cannot per the SWAM v3.10 manual), but the COMPLEX table wasn't updated to exercise the new reachability. The field was intentionally left at `OCT` because of an earlier note on OCT_5TH being "brittle at the cello's high register" — a conservative default from a time when OCT_5TH silently mis-fired into 2nd-harmonic via the old KS F# 2-band vel-select.

**Fix**: per-voice rotation for C4, using composition state that's already flowing through the bridge.

1. **`max/xk_swam.js`** — new `harmonicsForC4()` keyed on `state.path` × `state.tetra`:

        tetra 0 (even)    tetra 1 (odd)
   V1   OCT                OCT_5TH
   V2   OCT_5TH            CTRL

   V1 + even = baseline flageolet; V1 + odd = third-harmonic (brighter); V2 + even = third-harmonic in V2's softer palette; V2 + odd = CTRL (the user-selectable partial — rarest, reached only when both axes are in their "other" state). `setupComplex` calls it for `complexType === 4`, every other complex reads `cmx.harmonics` (always OFF). The `COMPLEX[4].harmonics` field is preserved as a safe fallback but unused on the live path.

2. **Spell pings** — two new `handleSpell` cases showcase the previously-silent modes as standalone moments, each following the `oll-cross` pattern (setHarmonics → single noteOn → scheduleAt → restore via setupComplex diff, idempotent):
   - `sune` → `HARMONICS.OCT_5TH` ping (perfect-12th flageolet). Replaces the post-freeze-removal "effect TBD" stub; sune (2-look OLL corners) now has its first audible signature.
   - `niklas` → `HARMONICS.CTRL` ping, layered on top of D36's engine-side V1↔V2 path toggle. Two concurrent effects on one spell: structural path flip + timbral flash. `pickPitch(4) - 3` nudges the fingering lower so the user-selectable partial lands inside the cello's audible band (the exact pitch depends on whatever partial the SWAM preset has baked into the Harmonics knob).

3. **Engine ordering fix (`src/engine.ts`)** — required side-effect: `onTurn` now emits the state burst BEFORE `/xk/voice`, not after. Previous order let the voice listener fire first, so downstream consumers received `/xk/voice` before the corresponding `/xk/path` / `/xk/tetra` state burst — `handleVoice` in `xk_swam.js` read `state.path` and `state.tetra` reflecting turn N-1, and the rotation would have fired one turn behind live state. Swap is safe: voice output is still computed in the same place (line 209-211), emission just comes after emitState. No behavior change for any consumer that doesn't cross-reference post-turn state with the voice event.

**Verification**:
- Cube connected + on C4 cloud (trigger C4 by routing a vertex into it): toggling the dashboard's `path` row between V1 and V2 should swap the audible harmonic flavour. Moves that flip the tetra orbit should likewise swap flavour on subsequent C4 voices. All three non-OFF states should be reachable by running through the 4 path×tetra combinations.
- Fire `sune` (`R U R' U R U2 R'`) on a silent cube → single flageolet touch with an audibly different pitch character than the `oll-cross` ping (OCT_5TH sounds as a perfect-12th rather than an octave above the played pitch).
- Fire `niklas` (`R U' L' U R' U' L`) → single CTRL-mode touch, and the subsequent voices audibly shift (Expression × 0.7 on V2) because path also flipped.
- With `ks_logger` pass-through active: each C4 voice on a different path/tetra combo should produce one CC 78 write per unique harmonic target (value 48 / 80 / 112 for OCT / OCT_5TH / CTRL), diffed out on repeats.

**What's left on CTRL**: the exact partial that `4 Control` mode plays is whatever the SWAM preset's Harmonics knob is baked to. A follow-up option is to MIDI-Learn the Harmonics knob itself to a new CC and modulate the partial continuously (would supersede the KS-equivalent selector entirely, per the v3.10 manual's note that Key Switches cannot reach the 4th harmonic). Out of scope for D37 — the user's ask was "utilize all four modes," which rotating into CTRL at all achieves.

### D36 — Path V1 ↔ V2 axis wired but unreachable *(RESOLVED 2026-04-18)*

**Defect**: Performer observation — "I don't think I've ever seen path become V2." `EngineMode.path` is read by `getTransformedVertices` (V1/V2 have different D×G×U balances per Xenakis), broadcast as `/xk/path`, and honoured by `max/xk_swam.js` (V2 scales Expression ×0.7, tremolo rate ×0.85, widens the pitch-fold window). End-to-end wired, three consumers, zero triggers.

**Root cause**: three-way gap.
1. `src/engine.ts` initializes `mode: { path: 'V1' }` and never reassigns it outside `setMode`.
2. `src/mode-manager.ts` handles spells but only mutates `PerformanceMode.{voiceMode,palette,variant,frozen}` — `EngineMode` lives on the engine, not the mode manager, so no spell effect could reach `path` even if one wanted to.
3. `public/dashboard.html` does have a V1/V2 `<select id="path-select">` with a working change handler that posts `{ type: 'set_mode', path }` over WS, and `relay.js:528-535` forwards it to `engine.setMode` correctly — but the `<select>` lives inside the `<div class="ovl-legacy">` block, which is hidden per the dashboard's HUD redesign. The code path worked; the control was just invisible.

Net effect: the path axis was dead state from the performer's view, and V2's softer-palette branches in `xk_swam.js` (`INTENSITY_MAP` × 0.7, V2 register shift, tremolo-rate multiplier) never ran in live performance.

**Fix**: dashboard + engine, both halves.

1. **Dashboard (`public/dashboard.html`)** — make the bottom-left State panel's `path` row clickable:
   - CSS: new `.state-val.clickable { cursor:pointer; user-select:none; }` with an accent-colour hover glow.
   - HTML: `<span class="state-val clickable" id="s-path" title="click to toggle V1 / V2 (also toggled by niklas spell)">V1</span>`.
   - JS: click handler reads current `textContent`, sends `wsSend({ type:'set_mode', path: other })`. Matches the idiom the hidden `pathSelect` already used.
   - `updateState` mirrors `state.path` back into both the visible toggle and the hidden legacy `<select>` (using `document.getElementById('path-select')` to dodge TDZ if updateState ever runs before the module-scope `const`). Engine remains the source of truth for path value regardless of which UI flipped it.

2. **Engine (`src/engine.ts`)** — wire `niklas` to toggle path. Inline in `onTurn` right after `modeManager.applySpell(match)`:
   ```ts
   if (match.spell.effect === 'niklas') {
     this.mode.path = this.mode.path === 'V1' ? 'V2' : 'V1';
   }
   ```
   Kept in the engine (not ModeManager) because `EngineMode` is the engine's owned state; adding a shim on ModeManager just to mutate engine state would break the separation. `src/mode-manager.ts` niklas case becomes a comment-only stub pointing to the engine.

**Why niklas**: D19 left the spell with "effect TBD — three candidates: C-cube 3-cycle / canon echo / commutator latch." Path toggle is a cleaner fit than any of those: (a) niklas is the archetypal corner 3-cycle, and path selection literally rotates the D×G×U assignment across vertices — a structural axis change matches a structural spell. (b) Zero state dependencies beyond engine.mode, no new CC traffic, no bridge changes. (c) Makes the D19 detection wiring pay off in sound.

**Verification**: with the cube connected, (a) click the `path` row in the State panel — value flips V1 ↔ V2, confirmed by the Expression peak audibly dropping ≈30% on V2 and the pitch floor widening an octave down. (b) Execute niklas (`R U' L' U R' U' L`) — same audible shift, plus the on-screen `path` value flips. (c) Rapid re-niklas toggles should see the value bounce; the engine's `/xk/path` broadcast should flip each time and `max/xk_swam.js` V2 path-scalars should take effect on the following voice.

**Scope left open**: the still-unused `PerformanceMode.palette` / `.variant` fields (mode-manager state that no consumer reads). Either wire them to downstream behavior or prune them — tracked separately from D36.

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
- [x] Extend `engine.onVoice` listener in `relay.js` to send `/xk/voice` over OSC to Max (57121)
- [x] `cancelPhrase()` calls `allNotesOff()` before cancelling scheduled Tasks
- [x] Inactivity watchdog in `xk_swam.js` with the four-way guard from D17 (active notes AND no release task AND no pending phrase tasks AND no `/xk/voice` for 3 s) → `allNotesOff()` + CC reset. Safety net only; must not truncate sustained C3/C7 notes.
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

**Phase 0** — Hold cube still, relay running: VST should be silent (no notes firing at 10 Hz). Turn once: exactly one phrase plays and ends cleanly. Unplug OSC cable mid-phrase: within 3 s, all notes released. Reconnect: next turn plays normally. Start a long C3 or C7 phrase (duration ≥ 5 s): full envelope plays to completion, watchdog does **not** cut it.

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
