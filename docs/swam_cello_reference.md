# SWAM Solo Strings v3.8.0 — Cello Reference

Consolidated from `SWAM-Solo-Strings-v3.8.0-UserManual.pdf`. Scoped to what XenaKube needs to drive SWAM Cello 3 from `max/xk_swam.js`. Section references in parentheses.

> **UI divergence (SWAM Cello 3 **v3.11**, 2026-04-14)** — the shipped VST diverges from the v3.8 manual:
>
> - **No Bow Speed** knob. `max/xk_swam.js` gates writes via `HAS_BOW_SPEED = false` (CC 20 no-ops).
> - **No Attack Ramp** knob. Gated via `HAS_ATTACK_RAMP = false` (CC 73 no-ops).
> - **Attack Control exists but as a discrete 4-mode selector**, not a continuous ramp: `vel.soft / vel.hard / expression / mix vel. expr.`. The bridge's old semantics (sending a 0–127 slope) don't map onto a mode switch, so `HAS_ATTACK_CONTROL = false` remains. **Preset recommendation: set Attack Control = `expression` or `mix vel. expr.`** — our `scheduleExprEnvelope` already shapes CC 11 per phrase, which then drives attack character automatically. No runtime writes needed.
> - Params present but **not yet wired from the bridge**: **Double Hold String Selection**, **Mono Cross String Muting**. The **Harmonics `4 Control`** mode-selector IS now reached (D37 path × tetra rotation for C4, plus niklas CTRL ping); the underlying Harmonics *knob* that picks which partial `4 Control` plays is still preset-baked — a future follow-up could MIDI-Learn it to a dedicated CC for continuous partial modulation. (Harmonics selector wired via CC 78 in D31; Bow Polyphony wired via CC 81 in D35; per-voice harmonic-mode rotation in D37.)
> - Auto-assigned CCs in the current preset: Vibrato Depth = CC 1, Panpot = CC 10, Main Volume = CC 7 (harmless, overlap our intended mappings).

---

## 1. Instrument Range

| Range | Notes | MIDI |
|-------|-------|------|
| Regular (tuned strings) | C1 – F5 | 24 – 77 |
| Additional (extended upper register) | F#5 – E6 | 78 – 88 |
| Sub-octave (rare, algorithmic only) | F0 – B0 | 17 – 23 |

- **Default instrument transpose: –12 semitones.** Pitches sent to the VST are auto-transposed down one octave before playback. To hear C2, send C3 (MIDI 48). `xk_swam.js` compensates by folding into `CELLO_MIN=36 / CELLO_MAX=89` **before** the –12 is applied, so actual heard range is C2–F6 on the keyboard.
- If you change the instrument's Transpose param, update `CELLO_MIN/MAX` accordingly.

---

## 2. Key Switches (SWAM Cello 3 v3.10)

> **v3.10 migration note (2026-04-14).** The KS plane was overhauled in v3.10. Earlier versions of this doc described the v3.8 map (Sordino at F#, Sul Tasto at G, Sul Pont at G#, Harmonics at A, Tremolo at A#, Section Size at B). **All of those moved or were removed.** This section is rewritten against the official v3.10 KS reference (`docs/v3.10-keyswitches.pdf`) and the v3.10 manual pp. 14–47 (`docs/v3.10-p14-47.pdf`). `max/xk_swam.js` was migrated to match (D27 — see `revision_roadmap.md`).

Key Switches live on a **dedicated KS MIDI channel** (configured on the Advanced → MIDI page as `KS MIDI Channel`). The KS region is placed in MIDI space by the **KS Octave** setting — values: `Off / C-2 / C-1 / C0 / C1 / C2`. When `Off`, KS is disabled entirely.

### KS Octave placement (important)

KS Octave determines where KS **C** (the first switch) lives in MIDI space. The other switches run upward from there across one octave:

| KS Octave | KS C at MIDI | KS span | Collides with XenaKube pitch input (36-89)? |
|-----------|--------------|---------|---------------------------------------------|
| Off       | —            | —       | KS disabled |
| C-2       | 0            | 0–11    | no |
| C-1       | 12           | 12–23   | no |
| **C0**    | **24**       | **24–35** | **no — use this** ✓ |
| C1        | 36           | 36–47   | **YES — breaks pitches** |
| C2        | 48           | 48–59   | YES |

**Use KS Octave = C0.** It places the KS region directly below the pitch input range (C2–F6 = MIDI 36–89) and matches the KS note numbers in `max/xk_swam.js`.

### KS vs CC — two independent control paths

SWAM separates KS and CC. They never interfere, and MIDI Learn on a GUI control is CC-only — it will **not** show KS assignments.

| Path | What it is | How to configure |
|------|------------|------------------|
| **Key Switches** | Low MIDI notes on the KS channel select/latch techniques | Set KS channel + KS Octave on Advanced → MIDI. Always active when KS Octave ≠ Off. |
| **CC** | Continuous controllers modulate any right-click-learned param | Right-click the SWAM GUI control → MIDI Learn → send the CC → param is bound. |

**Consequence**: many params can be reached *both* via KS (vel-select) *and* CC (continuous). For sliders that are mainly continuous (Bow Position, Bow Pressure, Vibrato Depth/Rate) prefer CC. For mode-selectors (Harmonics, Tremolo, Play Mode) KS vel-select is the cleaner path.

### v3.10 selector model — most things are velocity-select, not latches

In v3.10 most KS positions are **velocity-select**: a single press at a band-specific velocity picks one of N options. Use a "centre-of-band" velocity for each option:

```js
function velForOption(idx, optionCount) {
    var band = 127 / optionCount;
    return Math.max(1, Math.round(band * (idx + 0.5)));
}
```

- 2-option: vel ≈ 32 / 96
- 3-option: vel ≈ 21 / 64 / 106  (legacy 40/80/110 also lands in-band)
- 4-option: vel ≈ 16 / 48 / 80 / 112

Stateful diffing is still required so we don't re-fire when an option is already current.

### Core Key Switches — v3.10 (Page 1)

| KS Note | MIDI | Param | Type | Options (low → high vel) |
|---------|------|-------|------|--------------------------|
| **C**  | 24 | **Play Mode** | 3-opt | Bow / Pizzicato / Col Legno |
| C#     | 25 | Manual Bowing | 2-opt (preset) | Tremolo / Bow Change |
| **D**  | 26 | **Gesture Mode** | 3-opt | **Expression** / Bipolar / Bowing |
| **D#** | 27 | Alternate Fingering | 3-opt | Mid / Bridge / Nut+Open |
| E      | 28 | Bow Lift | 2-opt | Off String / On String |
| F      | 29 | Bow Start | 2-opt | Down Bow / Up Bow |
| **F#** | 30 | **Harmonics** | **2-opt** + default-Off (D31) | **Low=2nd / High=3rd** (Off is default only — NOT reachable via KS; no KS access to 4th) |
| G      | 31 | Keep Bow Direction | latch | (avoid — disrupts gliss alternation) |
| **G#** | 32 | **Tremolo** | **2-opt** + default-Off (D31) | **Low=Slow / High=Fast** (Off is default only — NOT reachable via KS) |
| A      | 33 | Tremolo Mode | 3-opt | Hz / Sync / Sync/Acc |
| A#     | 34 | Sordino | 2-opt (at next Note On) | Low=Off / High=On |
| **B**  | 35 | Page Modifier | hold | hold + another KS for Bow/Pizz Polyphony, Double Hold String |

> **D31 — Harmonics F# and Tremolo G# are NOT 3-/4-opt velocity-selects.** Earlier revisions of this doc (and `xk_swam.js`) claimed 4-opt Harmonics and 3-opt Tremolo with selectable Off. The official v3.10 PDF (`docs/v3.10-keyswitches.pdf` pp. 100–102) shows only **Low / High** velocity bands for both — Off is the instrument's initial state, not a velocity band. Once fired, **Off is unreachable via KS**. Every 3-opt KS in the same PDF explicitly names a **Mid Velocity**; F# and G# do not. The symptom this caused: sending our "OFF" velocity for non-C4/non-C8 complexes actually selected 2nd / Slow, leaving Harmonics and Tremolo stuck on.
>
> **`xk_swam.js` now drives Harmonics and Tremolo via CC** (CC 78 and CC 79 — SWAM's "all KS params also respond to CC via the Controller Mapping section", PDF p. 102). MIDI-Learn required once: right-click the Harmonics selector in SWAM → MIDI Learn → send CC 78 from the bridge (or any MIDI source) → same for Tremolo selector with CC 79. Save the preset. Fall-back to KS firing is retained behind `HAS_HARMONICS_CC` / `HAS_TREMOLO_CC = false` if you want to test without the MIDI-Learn step; fall-back will fire ON correctly but cannot turn Off.

**Removed from KS in v3.10** (vs v3.8): Sordino, Sul Tasto, Sul Ponticello, Section Size. Sordino is now GUI/CC-only; Sul Tasto/Pont are controlled via Bow/Pizz Position (CC 16); Section Size is removed entirely.

### Page-2 modifiers (KS B held + another KS struck)

| Combo | Param | Options |
|-------|-------|---------|
| B+C   | Bow Polyphony | Mono String Crossing |
| B+C#  | Bow Polyphony | Mono Poly Release |
| B+D   | Bow Polyphony | Double |
| B+D#  | Bow Polyphony | Double/Hold |
| B+E   | Bow Polyphony | Auto |
| B+F   | Pizz/C.Legno Poly | Mono String Crossing |
| B+G   | Pizz/C.Legno Poly | Polyphony |
| B+F#  | Double Hold String Sel | Strings 4-3 |
| B+G#  | Double Hold String Sel | Strings 3-2 |
| B+A#  | Double Hold String Sel | Strings 2-1 |

### XenaKube KS map (post-v3.10 migration in `xk_swam.js`)

```js
var KS_CH = 2;    // matches SWAM Advanced → MIDI → KS MIDI Channel
var KS = {
    PLAY_MODE:     24,   // C   3-opt: Bow / Pizz / Col Legno
    MANUAL_BOWING: 25,   // C#  preset-controlled — never write
    GESTURE_MODE:  26,   // D   3-opt — pin to Expression at init
    ALT_FINGERING: 27,   // D#  3-opt: Mid / Bridge / Nut+Open
    BOW_LIFT:      28,   // E   2-opt
    BOW_START:     29,   // F   2-opt
    HARMONICS:     30,   // F#  4-opt
    KEEP_BOW_DIR:  31,   // G   latch — avoid
    TREMOLO:       32,   // G#  3-opt: OFF / Slow / Fast
    TREMOLO_MODE:  33,   // A   3-opt: Hz / Sync / Sync/Acc
    PAGE_MOD:      35    // B   modifier
};
var HARMONICS = { OFF:0, OCT:1, OCT_5TH:2, CTRL:3 };
var TREMOLO   = { OFF:0, SLOW:1, FAST:2 };
var GESTURE   = { EXPR:0, BIPOLAR:1, BOWING:2 };
```

### Portamento safety: Gesture Mode pin

KS D in v3.10 is **Gesture Mode**, not the v3.8 "Bow Change". At Bipolar/Bowing, CC 11 is reinterpreted as bow-direction or bow-displacement instead of dynamics — this silently breaks the Expression envelope **and** the legato/portamento feel even when CC 5 / CC 65 are still being written. The bridge **pins KS D = Expression** once at `bang()` and never modulates it; all expressivity flows through the CC 11 envelope path.

### Requirements to make KS work
1. **KS Octave = C0** in Advanced → MIDI.
2. **KS MIDI Channel** set in Advanced → MIDI; bridge sends KS on that channel.
3. **Velocity-select KS**: pick velocity by `velForOption(idx, optionCount)` (or 40/80/110 for 3-opt — the bridge keeps that for Play Mode).
4. **Diff-fire**: track current option index in JS state and only send when target differs (prevents inversions and redundant messages).
5. **Hold time**: 50 ms.
6. **Pizz/C.Legno Polyphony = Polyphony**: set once in SWAM UI for chord pizz to register.

---

## 3. MIDI CC Mappings

**Critical**: SWAM does **not** expose a central Controllers mapping table. CC bindings are taught per-param via **right-click → MIDI Learn** on the SWAM GUI control. Only a small set of CCs are pre-bound; everything else the bridge wants to modulate **must be MIDI-Learned manually in SWAM** before it has any effect.

### Default-bound CCs (usually work out-of-the-box)

| CC | Param | Notes |
|----|-------|-------|
| **1** | Vibrato Depth | Standard MIDI mod wheel. Do **not** map to raw gyro — see §8. |
| **11** | Expression | Primary dynamic. Drive per-complex, not from tilt — see §8. |
| **5** | Portamento Time | |
| 64 | Sustain Pedal | Used for freeze state. |
| 65 | Portamento On/Off | |

Verify these are still bound in your preset (any can have been unlearned).

### Must-be-learned CCs (right-click → MIDI Learn in SWAM)

These have no default binding. Pick any unused CC, MIDI-Learn each in SWAM, then hard-code the chosen number in `xk_swam.js`. Suggested slots (chosen to avoid collisions):

| Param | Suggested CC | SWAM UI location | Used for in bridge |
|-------|--------------|------------------|--------------------|
| **Vibrato Rate** | 19 | Expressivity page | Smoothed spin (α≈0.08) |
| **Vibrato Fade-In** | 22 | Expressivity page | Set once at init to 250 ms |
| **Bow Position** | 16 | Bow page | Per-complex baseline + tilt modulation |
| **Bow Pressure** | 17 | Bow page | Per-complex + spell accents |
| **Bow Pressure Accent** | 18 | Bow page | Spell transients |
| **Bow Speed** | 20 | Bow page | Deviation mapping |
| **Attack Ramp** | 73 | Bow page | Per-complex + regime scalar |
| **Attack Control** | 75 | Bow page | Per-complex attack shape (distinct from Attack Ramp) |
| **Bow Noise** | 74 | Expressivity page | Optional — scramble → noise |
| **Harmonics selector** | 78 | Main page (right-click selector) | D31 — 4-state, replaces KS F# path |
| **Tremolo selector** | 79 | Main page (right-click selector) | D31 — 3-state, replaces KS G# path |
| **Tremolo Min Speed** | 80 | Play Modes → Right Hand | D39 — per-phrase stochastic envelope (1/3 slow→fast / 1/3 fast→slow / 1/3 steady), driven by `rampCC`; requires Tremolo Mode = Hz |
| **Bow Polyphony** | 81 | Play Modes → Left Hand | D35 — per-complex polyphony; default Double/Hold, gliss complexes MONO_POLY_RELEASE |

After MIDI-Learning, **save as a SWAM preset** so the mapping persists across sessions.

### SWAM-internal params with no CC (KS or preset-only)

- **Play Mode** (Bow/Pizz/Col Legno) — KS C + velocity
- **Harmonics** — KS A toggle
- **Tremolo** — KS A# toggle
- **Sordino / Sul Tasto / Sul Ponticello** — KS F#/G/G# toggles
- **Bow Change Mode** — KS D + velocity
- **KS Octave, KS Channel, Pizz Polyphony** — project-level, set in UI, save preset
- **Dynamic Transitions** curve — preset-level
- **Note-Off Velocity** sensitivity — preset-level; bridge can still send note-off velocities to modulate release

---

## 4. Expressivity Page (p. 23)

| Param | Range | Role | CC status |
|-------|-------|------|-----------|
| Vibrato Depth | 0–100% | Amount of vibrato | default CC 1 |
| Vibrato Rate | 0–10 Hz | Speed of vibrato | MIDI-Learn (suggest 19) |
| Vibrato Rate Rand | 0–100% | Humanize rate | preset-level |
| Vibrato Fade-In | 0–1000 ms | Delay before vibrato engages after note-on (250 ms recommended) | MIDI-Learn once + set to 250, or set in preset |
| Expression | 0–100% | The main dynamic | default CC 11 |
| Bow Pressure | 0–100% | Timbral pressure | MIDI-Learn (suggest 17) |
| Bow Noise | 0–100% | Added bow-hair/scratch noise | MIDI-Learn (suggest 74) |
| Flautando | 0–100% | Breathy light-bow character | MIDI-Learn if used (skip for v1) |

---

## 5. Play Modes (pp. 24–31)

### Left Hand
- **Polyphony**: Mono / Poly / Auto
- **Portamento Mode**: Off / Auto / Always
- **Portamento Time**: 0–2000 ms (scaled by MIDI interval)
- **Alternate Fingering**: shifts string crossings for timbral variety

### Right Hand (Bow)
- **Play Mode**: Bow / Pizzicato / Col Legno (via KS C + velocity)
- **Bow Direction**: Down / Auto / Up
- **Bow Change**: Natural / Always / Never
- **Bow Start**: toggles the first-note articulation
- **Bow Lift**: mutes note-offs (no audible release)

### Polyphony (Bow Polyphony page — KS B+...)
- Bow Polyphony, Pizz/C.Legno Polyphony (each Mono/Poly/Auto)
- Double / Triple / Quad Stops toggles

---

## 6. Articulation Recipes (pp. 101–104)

SWAM articulations are emergent, not discrete patches. Each is a combination of note length, velocity, expression envelope, and bow params.

| Articulation | Recipe |
|--------------|--------|
| **Détaché** | normal note on Bow mode; each note gets its own bow stroke (`Bow Change = Natural`) |
| **Martelé** | high velocity + sharp Expression attack (fast ramp) + `Bow Pressure Accent` high |
| **Spiccato** | short note length (<150 ms) + high velocity + short Expression envelope. No KS. |
| **Legato** | overlapping notes (noteOn new before noteOff old, ≥20 ms overlap) + `Portamento Mode = Auto` |
| **Portamento** | as legato + force `Portamento Mode = Always` |
| **Flautando** | raise Flautando param + reduce Bow Pressure |
| **Scratch** | very high Bow Pressure + moderate-to-high velocity |
| **Tremolo** | KS **A#** latch toggle ON (single-note tremolo; rate tracks Expression) |
| **Crescendo** | ramp CC11 Expression over note duration |

### Pizzicato (Play Mode KS C, mid velocity)
- After KS C, every subsequent note plays as pizzicato until KS C with Low velocity returns to Bow.
- Expression still controls dynamic. Vibrato off.
- **Pizz/C.Legno Polyphony must be Poly** for chordal pizz to sound.

### Natural Harmonics (KS A latch)
- Toggles natural-flageolet mode on. All subsequent notes played as harmonics.
- Tone thins dramatically; Expression is still effective.

---

## 7. Advanced Pages (pp. 42–48)

### Instrument page
- **Transpose** (default –12) — shifts input pitch on playback. Accounted for in our `CELLO_MIN/MAX = 36/89` (input range).
- **Section Size** (Solo / Trio / Section) — also settable via KS B + velocity.
- **Tuning** (A4 reference)
- **Temperament** (Equal / user scales)

### Bow / Expressivity pages — params to MIDI-Learn
See §3 "Must-be-learned CCs" table. The bridge's CC numbers are defined in code and must match what's learned on each knob in these pages. **Attack Control** lives on the Bow page and is distinct from Attack Ramp — the former shapes the onset transient (sharpness/bite), the latter controls attack duration.

### Key Switches page
- **KS MIDI Channel** — CRITICAL for XenaKube. The bridge must send KS on this channel.
- **KS Octave** — places the KS region in MIDI space. Set to **C0** (see §2 table).
- **Pizz/C.Legno Polyphony** — set to **Poly** for chord pizzicato to sound.
- Individual KS enable/disable toggles per switch (all should be ON for XenaKube).

### MIDI / CC assignment
**There is no central Controllers page.** Each SWAM GUI param that accepts MIDI control is assigned via **right-click → MIDI Learn**. There's no table view; to audit mappings, right-click each relevant control. A "MIDI Learn" indicator shows "unassigned" until taught — this reflects CC assignment only, not KS (KS is a separate path, see §2).

### Room page
- Reverb (Off / Room / Hall / Cathedral)
- Mic Position
- Dry/Wet Mix

---

## 8. XenaKube Gaps & Punch List

These are the three user-flagged issues; each is the work item for the follow-up `xk_swam.js` refactor.

### 1. Expression must be per-complex, not tilt-driven
**Problem**: `xk_swam.js` writes CC11 from a blend of `baseExpr*0.3 + tilt²*97`, so gyro tilt overrides what the complex's intensity demands.
**Fix**:
- Drop the live tilt → CC11 mapping.
- Each complex C1–C8 declares its **target Expression envelope** as part of its phrase recipe (attack, peak, release CC11 values).
- Tilt can still modulate a *secondary* timbral param (e.g., Bow Position or Flautando) — but not the primary dynamic curve.
- Keep scramble + intensity → base Expression range (e.g. V1 louder, V2 softer), driven off engine state, not gyro.

### 2. Play-mode / Harmonics / Tremolo key switches do not register
**Root cause (primary)**: the code uses four independent KS notes (ARCO/PIZZ/TREMOLO/STACCATO = 24/25/26/27) under the assumption of "one KS per technique." SWAM's actual model is:
- **Play Mode = single KS C with velocity** selecting Bow (40) / Pizz (80) / Col Legno (110)
- **Harmonics = KS A latch toggle**, **Tremolo = KS A# latch toggle**

Sending `keyswitch(24)` at velocity 100 hits KS C with HIGH velocity → **Col Legno** (not arco). Subsequent `keyswitch(25)` hits KS C# (Bow Direction), which cannot select Pizz. Play Mode stays on whatever the last velocity-on-KS-C selected.

**Fix**:
1. Adopt the full KS map from §2 ("Correct KS map").
2. Add a `KS_CH` config; send KS on SWAM's KS MIDI Channel.
3. For Play Mode, send velocity 40/80/110 explicitly for Bow/Pizz/Col.
4. For latch toggles (Harmonics, Tremolo, Sordino, Sul Tasto, Sul Ponticello, Alt Fingering, Bow Lift, Bow Start), track current state in JS; only fire KS when target ≠ current — otherwise the toggle inverts.
5. Verify KS Octave = C0 (not Off, not C1) in SWAM GUI.
6. Bump KS hold from 30 ms → 50 ms.
7. At init, ensure Pizz/C.Legno Polyphony = Poly (set in SWAM preset, or fire KS B + C# at vel 80).

### 3. Vibrato is jittery / unmusical
**Problem**: gyro spin → CC1 directly. Raw spin is noisy; CC1 jumping per-frame makes vibrato wobble.
**Fix**:
- **Don't map spin to Vibrato Depth (CC1).** Let each complex set its own vibrato depth statically.
- If gyro must affect vibrato, map it to **Vibrato Rate (CC19)**, heavily smoothed (exponential smoothing α ≤ 0.1) and thresholded (dead zone below 0.15).
- Set **Vibrato Fade-In = 250 ms** so short notes don't vibrate.
- Consider using **Vibrato Rate Randomization** (~15%) for humanization instead of live gyro modulation.

### Additional SWAM params currently unused that XenaKube should wire

| SWAM param | How to wire from XenaKube |
|------------|---------------------------|
| Bow Position | Map from **scramble** factor (sul tasto when solved → sul pont when scrambled) — drives sul tasto/pont color in v3.10 since those KS were removed |
| Bow Pressure Accent | Spell trigger transient (e.g. sexy-move) |
| Portamento Max Time | Set per-complex (C5/C6/C7 long, C1/C4 short) |
| Note-Off Velocity | Map from turn-rate (fast turns = shorter releases) |
| Sordino (GUI/CC-only in v3.10) | Spell-triggered color shift via CC, not KS |
| Alternate Fingering (KS D#) | Randomize per phrase for timbral variety |
| Bow Lift (KS E) / Bow Start (KS F) | Latch on freeze / spell color |

---

## 9. Quick Reference — CCs and KS at a glance

### CC map (numbers below must match what's MIDI-Learned in SWAM)
```
CC  1  Vibrato Depth    (default-bound; avoid direct gyro — use per-complex baseline)
CC 11  Expression       (default-bound; drive per-complex envelope, not live tilt)
CC  5  Portamento Time  (default-bound)
CC 64  Sustain Pedal    (default-bound; used for freeze)
CC 65  Portamento On    (default-bound)
CC 16  Bow Position     (MIDI-Learn)
CC 17  Bow Pressure     (MIDI-Learn)
CC 18  Bow Pressure Accent (MIDI-Learn)
CC 19  Vibrato Rate     (MIDI-Learn; heavily smooth if modulated)
CC 20  Bow Speed        (MIDI-Learn)
CC 22  Vibrato Fade-In  (MIDI-Learn; set to 250 ms at init)
CC 73  Attack Ramp      (MIDI-Learn)
CC 74  Bow Noise        (optional MIDI-Learn)
CC 75  Attack Control   (MIDI-Learn; onset shape, distinct from 73)
CC 68  Sordino          (MIDI-Learn to the GUI Sordino toggle — driven by sune freeze, Phase 6)
CC 78  Harmonics        (MIDI-Learn to Harmonics selector — D31 replaces KS F# path)
CC 79  Tremolo          (MIDI-Learn to Tremolo selector   — D31 replaces KS G# path)
```

### KS map — SWAM Cello 3 v3.10 (KS Octave = C0; KS_CH; hold 50 ms)
```
KS C   (MIDI 24) Play Mode          vel-3 = Bow / Pizz / Col Legno
KS C#  (MIDI 25) Manual Bowing      preset-controlled — never write
KS D   (MIDI 26) Gesture Mode       vel-3 = Expression / Bipolar / Bowing  (PIN to Expression)
KS D#  (MIDI 27) Alternate Fingering (latch)
KS E   (MIDI 28) Bow Lift            (latch)
KS F   (MIDI 29) Bow Start           (latch)
KS F#  (MIDI 30) Harmonics           vel-4 = Off / Octave / Octave+5th / Control
KS G   (MIDI 31) Keep Bow Direction  (latch)
KS G#  (MIDI 32) Tremolo             vel-3 = Off / Slow / Fast
KS A   (MIDI 33) Tremolo Mode        preset-controlled — never write
KS A#  (MIDI 34) (unassigned base page; Page-2 modifier combo target)
KS B   (MIDI 35) Page Modifier       hold for B+x combos (advanced)
```

**Removed from KS plane in v3.10**: Sordino (GUI/CC-only), Sul Tasto / Sul Ponticello (use Bow Position CC 16), Section Size (concept removed). XenaKube's previous v3.8 mapping had `SORDINO=30 / SUL_TASTO=31 / SUL_PONT=32 / HARMONICS=33 / TREMOLO=34` — those notes now mean Harmonics, Keep Bow Direction, Tremolo, Tremolo Mode, and (unassigned). This drift was D24's root cause.

### Pre-flight checklist (in SWAM, save as preset)
- KS page: KS Octave = **C0**, KS Channel noted, Pizz Polyphony = **Poly**, all KS enabled
- **Play Modes → Left Hand: Bow Polyphony selector → MIDI Learn → CC 81** (D35). The bridge drives polyphony per-complex: Double/Hold as the default (rich two-string textures on overlapping turns), Mono Poly Release for C5/C6/C7 (single-line portamento — SWAM's gliss engine needs one monophonic line to slide along; any non-Mono mode splits overlaps into chord voices and kills the slide). Supersedes D34's "set Mono and save" instruction.
- Expressivity page: Vibrato Fade-In = 250 ms; right-click Vibrato Rate → MIDI Learn → CC 19
- Bow page: right-click each of Bow Position / Bow Pressure / Bow Pressure Accent / Bow Speed / Attack Ramp / Attack Control → MIDI Learn → CCs 16 / 17 / 18 / 20 / 73 / 75
- **Harmonics + Tremolo selectors (D31)**: right-click each on the main page → MIDI Learn → CC 78 (Harmonics) / CC 79 (Tremolo). Required because KS F#/G# are 2-band with no Off band — the bridge routes these through CC to reach every state cleanly.
- Verify Expression responds to CC 11 and Vibrato Depth to CC 1; if not, MIDI-Learn them
- Save as `xenakube_cello.swampreset`

### Per-instance workflow (D40, instance-pool topology)

Since D40 (2026-04-20) the Max patch runs SWAM Cello 3 under a `poly~ @parallel 1 @voices 8` wrapper — each voice hosts its own `vst~ "SWAM Cello 3"` instance. The CC/KS surface above is identical per instance (same CC numbers, same KS bands, same preset requirements), but preset state is **not shared across instances**: Max saves VST chunks per `poly~` voice slot.

- Open each voice's SWAM GUI once (double-click the voice in the poly~ edit window) and load the `xenakube_cello` preset — or at minimum set its preset to `default` so MIDI Learn assignments are predictable. Voices 1–7 otherwise fall back to whatever SWAM initialised on first instantiation.
- Inside the poly~ subpatch, MIDI must enter via `polymidiin` → `midiparse` (midievent outlet). Plain `[in]` won't carry MIDI through to the voice's `vst~`.
- All MIDI-Learn CC assignments (CC 11, 16, 17, 18, 19, 20, 73, 75, 78, 79, 80, 81) must be saved into the preset before it's loaded into a voice — the bridge writes identical CC streams to every voice outlet, and the preset is what maps them to SWAM knobs on each instance.
