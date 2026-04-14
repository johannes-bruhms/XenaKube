# SWAM Solo Strings v3.8.0 - MIDI & Parameter Reference

## Essential Controllers
SWAM instruments are expressive and *require* continuous physical MIDI controllers to work effectively.
- **Expression:** The most critical parameter, controls dynamics and bow speed. 
  - **Default:** `CC11` (Expression)
  - *Recommended alternative:* `CC1` (Mod Wheel) if no pedal is available.
- **Vibrato Depth:** Controls the amount of vibrato.
  - *Recommended:* AfterTouch (AT) or `CC1`

*Note on Expression:* The instrument will not produce sound if an expression control message (like CC11) is not received or mapped.

---

## Key Switches
Key Switches (KS) are located below the instrument's normal range. They are velocity-sensitive (latch) or act as modifiers when held.

**First Page Key Switches:**
- **C = Play Mode**
  - Low Velocity: Bow
  - Mid Velocity: Pizzicato
  - High Velocity: Col Legno
- **C# = Manual Bowing** (Behavior set in Play Modes / Right Hand)
  - Tremolo: Note-on / Note-off
  - Bow Change: Note-on only
- **D = Gesture Mode** (How expression is interpreted)
  - Low Velocity: Expression
  - Mid Velocity: Bipolar
  - High Velocity: Bowing
- **D# = Alternative Fingering**
  - Low Velocity: Mid Position
  - Mid Velocity: Near the Bridge
  - High Velocity: Near the Nut + Open
- **E = Bow Lift**
  - Note On: Off String (default)
  - Hold Key: On String
- **F = Bow Start**
  - Down Bow / Up Bow
- **F# = Harmonics**
  - Off (default)
  - Low Velocity: 2nd harmonic
  - High Velocity: 3rd harmonic
- **G:** [TBD in manual]
- **G# = Tremolo**
  - OFF (default)
  - Low Velocity: Slow
  - High Velocity: Fast
- **A = Tremolo Mode**
  - Low Velocity: Hz
  - Mid Velocity: Sync
  - High Velocity: Sync/Acc
- **A# = Sordino** (Mute)
  - Low Velocity: OFF
  - High Velocity: ON

**Second Page Key Switches (Hold 'B'):**
- **B + C:** Bow Real Mono (Mono String Crossing)
- **B + C#:** Bow Mono (Mono Poly Release)
- **B + D:** Bow Double
- **B + D#:** Bow Double/Hold
- **B + E:** Bow Auto
- **B + F:** Pizz/Col Legno Mono (Mono String Crossing)
- **B + F#:** Preferred strings 4-3 (for Double/Hold only)
- **B + G:** Pizz/Col Legno Poly
- **B + G#:** Preferred strings 3-2 (for Double/Hold only)
- **B + A#:** Preferred strings 2-1 (for Double/Hold only)

---

## Important Parameters

### Expressivity
- **Expression:** Controls dynamic/bow speed.
- **Vibrato Depth & Vibrato Rate**
- **Bow Pressure:** "Weight" of the bow. High pressure + high expression = scratchy sound. Low pressure = flautando.
- **Bow/Pizz Position:** Sul ponticello to sul tasto.
- **Bow Pressure Accent:** Accent amount based on velocity.
- **Attack Ramp Speed:** Steepness of velocity-controlled attacks.

### Timbre
- **Instrument Body:** Selects different instrument models.
- **Sordino:** Mute.
- **Rosin / Bow Noise**
- **Pizz/C.Legno Tone**
- **String Resonance / Open Strings:** Sympathetic resonance control.
- **Timbral Correction:** Adjust Harmonic A/B Gain.

### Play Modes & Polyphony
- **Tremolo Min Speed / Mode:** Set sync to host BPM or free Hz.
- **Portamento Control:** Velocity vs CC driven.
- **Portamento Max Time:** Disable by setting < 1.1.
- **Double Hold String Selection:** For playing double stops.
- **Mono CrossString Muting:** Controls overlap during legato across strings.

### Advanced & MIDI
- **String Model:** Real (fixed thickness) vs Virtual Adaptive Resizing (single bendable string).
- **Advanced Legato:** Models realistic behavior starting from 4th or 5th intervals.
- **Dynamic Transitions:** Shape of expression during legato.
- **MIDI Profile:** MPE or Legacy.
- **Attack Control:** Vel. Soft, Vel. Hard, Expression, or Mix Vel. Expr.

### Microtuning
- Enable **Microtuning KS** (often mapped to `CC64` / Sustain).
- Hold the pedal and press key switches corresponding to the notes you want to detune.
- Release pedal to finalize.
- Integrates with *Cavit Scale Ultimate* and *MAQAM* for Arabic/Eastern music.

---

## Instrument Ranges (Middle C = C3)
- **Violin:** Regular `G2 - F6` (Extended down to `D#2`)
- **Viola:** Regular `C2 - C6` (Extended down to `G#1`)
- **Cello:** Regular `C1 - F5` (Extended down to `F0`)
- **Double Bass:** Regular `E0 - G#4` (Extended down to `B-1`)
*(Note: Cello and Double Bass are transposed -12 semitones by default)*

---

## Common CC Mapping Examples (from UI Screenshots)
- **Expression:** CC 11
- **Vibrato Depth:** CC 1
- **Bow Pressure:** CC 21
- **Bow Position:** CC 23
- **Harmonics:** CC 26
- **Bowing Sensitivity:** CC 27
- **Microtuning KS:** CC 64 (Sustain)
