# Spectrogram Roadmap

This is the implementation roadmap for adding an optional actual-audio spectrogram layer to the dashboard while preserving the current MIDI-brush project as the default behavior.

## Goal

Add a real spectrogram behind the existing rolling MIDI brushes. The spectrogram must come from analyzed audio, preferably the same post-SWAM/post-reverb signal the audience hears. MIDI brushes remain a separate visual layer and should sit above the spectrogram when both are enabled.

The feature must be fully optional. With spectrogram disabled and MIDI brushes enabled, the dashboard should behave like the current project.

## Non-Goals

- Do not recreate the removed cube/complex/gyro background color field.
- Do not synthesize a fake spectrogram from MIDI note events.
- Do not gate spectrogram visibility from MIDI activity.
- Do not make the dashboard depend on spectrum data to run.
- Do not erase or replace the existing rolling MIDI brush renderer.

## Layer Model

Visual stack, front to back:

1. HUD overlays, cube canvas, adaptive cube wireframes, and line overlays.
2. MIDI brush layer.
3. Actual-audio spectrogram layer.
4. Background.

The MIDI brush layer and the spectrogram layer should be independently toggleable:

| MIDI Brushes | Spectrogram | Result |
|---|---|---|
| on | off | Current dashboard behavior. |
| on | on | Spectrogram behind the existing MIDI brushes. |
| off | on | Audio spectrogram only, useful for sync and color design. |
| off | off | Cube/dashboard without rolling visual layers. |

Default should be MIDI brushes on, spectrogram off.

## Feature Gates

Add feature gating before adding rendering work:

- URL flag for spectrogram experiments.
- Dashboard control for spectrogram on/off.
- Dashboard control for MIDI brush on/off.
- Local storage persistence for both toggles.
- Max-side spectrum-analysis enable switch.
- Relay forwarding only when spectrum mode is enabled or a dashboard client asks for it.

The off path is part of the feature. When spectrogram is disabled, the dashboard should not subscribe to spectrum frames, allocate the spectrum renderer, or adjust MIDI brush timing.

## Architecture

Keep the existing `public/js/rolling-score.js` as the MIDI brush owner. Add a separate dashboard module for the spectrogram, for example `public/js/spectrum-score.js`.

Suggested ownership:

| Surface | Owns |
|---|---|
| Max | Audio capture point, FFT analysis, per-frame audio features, analysis timestamps. |
| `relay.js` | Spectrum transport forwarding, stream enable/disable, stale/backpressure logging. |
| `public/js/transport.js` | Typed spectrum-frame event fanout. |
| `public/js/spectrum-score.js` | Spectrum frame buffer, modality selection, spectrogram rendering, layer visibility. |
| `public/js/rolling-score.js` | Existing MIDI brush rendering and optional layer visibility. |
| `public/js/main.js` | Toggle wiring, feature gating, cross-module timebase settings. |

This keeps the current rolling-score renderer recoverable and makes the spectrogram detachable.

## Audio Analysis Source

The first implementation should analyze the post-audio signal in Max, ideally after SWAM and reverb. That makes the spectrogram honest: if reverb is still ringing, the spectrogram keeps drawing even after MIDI note-off.

Max should send compact spectrum frames with:

- monotonically increasing frame id
- audio timestamp for the center of the FFT window
- estimated analysis latency
- active complex at analysis time
- bin count
- frequency range metadata
- per-bin power values
- global RMS and peak
- spectral centroid
- spectral flux
- optional stereo width or left/right energy

Start with a compact musical resolution rather than a dense scientific view. Log-frequency bins are likely the right first mapping because they align better with pitch perception and the existing C2-C6 dashboard range.

## Synchronization Model

MIDI brushes and spectrogram frames come from different clocks unless the system explicitly aligns them. Treat synchronization as a core feature, not polish.

Shared assumptions:

- MIDI brush events have event time.
- Spectrum frames have audio time.
- Dashboard render time is a third clock.
- The visible rolling axis should draw both layers against one shared visual time.

Plan:

1. Max timestamps each spectrum frame by the center of the audio analysis window.
2. Relay preserves frame id and timestamp; it does not rewrite timing as "received now."
3. Dashboard stores frames in a time-indexed ring buffer.
4. When spectrogram is enabled, render both layers against `visual now - visual latency`.
5. Add a small user-adjustable audio/MIDI nudge for calibration.
6. Discard out-of-order spectrum frames by frame id.
7. Warn if spectrum frame age or jitter exceeds the usable range.

MIDI brushes may need a slight visual delay only when spectrogram is enabled. When spectrogram is off, the MIDI brush timing should remain the current behavior.

## Silence And Reverb

Silence should be audio-derived only.

Rules:

- MIDI note-off does not kill the spectrogram.
- MIDI inactivity does not imply spectrogram silence.
- Reverb tails remain visible until post-reverb energy falls below the display floor.
- If the post-audio signal is quiet, spectrum pixels decay or fade based on measured power.
- If spectrum frames stop arriving, the dashboard treats the stream as stale rather than inventing background motion.

Use a calibrated floor and soft knee so quiet tails can remain visible without turning the noise floor into permanent fog.

## Spectrogram Modality Engine

Do not hardcode "the spectrogram color." Build a declarative modality engine. A modality is a complete visual interpretation of audio data:

```text
frequency scale
amplitude curve
noise floor
palette
alpha rule
blend mode
temporal decay
band emphasis
feature modulators
```

Complex changes should instantly select a modality. The audio data stays continuous, but the rendering interpretation can switch sharply at the complex boundary.

Possible first complex mapping:

| Complex | Modality Direction |
|---|---|
| C1 | Transient speckles, high contrast, short decay. |
| C2 | Warm bowed-body thermal map with strong low-mid presence. |
| C3 | Pitch-class or harmonic-prism mapping for clear partial lines. |
| C4 | Pale upper-partial veil with airy alpha behavior. |
| C5 | Continuous gliss ribbon with strong frequency-line continuity. |
| C6 | Denser or colder gliss ribbon with heavier persistence. |
| C7 | Pressure smear / resonance trail with stronger horizontal memory. |
| C8 | Noisy high-band chalk texture with granular alpha. |

Gyro can modulate parameters inside the active modality, such as exposure, pole balance, band emphasis, decay amount, or palette rotation. Gyro should not be required for the spectrogram to work.

## Color Scheme Configuration

The color system should expose several independent dimensions:

| Dimension | Options |
|---|---|
| Amplitude transfer | dB brightness, alpha from power, saturation from power, compressed tails, hard or soft noise floor, peak hold. |
| Frequency mapping | warm lows/cool highs, hue by frequency, hue by octave, hue by pitch class, banded bass/body/presence/air regions. |
| Palette family | thermal, cold thermal, duotone, grayscale, pitch-class prism, inverted/negative, ink wash, false-color imaging. |
| Alpha behavior | amplitude alpha, tail-preserving alpha, band-specific alpha, brush-legibility alpha, ambience floor, hard silence clamp. |
| Feature modulation | centroid temperature, flux brightness, harmonicity smoothness, loudness exposure, stereo width split, reverb-tail persistence. |
| Temporal behavior | direct frame draw, slow fade, peak trails, resonance smear, attack/tail split, held frames at complex transitions. |
| Blend mode | source-over, screen/additive, lighten/max, multiply, difference, controlled compositing for recording. |

For usability, expose named modalities first. Low-level controls can come later through a debug panel or preset editor.

## Rendering Plan

Start with a 2D canvas renderer:

- one column per spectrum frame or interpolated visual step
- log-frequency vertical mapping
- per-bin color from active modality
- per-bin alpha from audio power and modality transfer
- decay applied in the spectrum layer, not the MIDI brush layer

Move to WebGL only if the modality engine becomes too expensive or if shader-based palette lookup becomes necessary. A 2D prototype is easier to inspect and easier to keep aligned with the existing rolling score.

The spectrogram canvas should be below the MIDI brush canvas. Avoid drawing spectrum into `rolling-score.js` directly unless a later performance pass proves one shared canvas is necessary.

## Recording And Export

Recording should be added after the actual spectrogram path is stable.

Recording modes:

- composite: visible spectrogram plus MIDI brushes
- spectrogram only
- MIDI brushes only

For long PNG export, maintain an offscreen print buffer that appends rendered columns by timestamp. Do not rely on screen capture of the visible viewport, because the visible viewport intentionally erases the past as it scrolls.

The recorder should respect layer toggles. If MIDI brushes are off, they should not appear in the composite. If spectrogram is off, the recording should match the current MIDI brush output.

## Invariants And Telemetry

This feature has several silent-failure risks. Add visible telemetry or console warnings for:

- spectrogram enabled but no spectrum frames received
- frame timestamps moving backward
- frame gaps above expected tolerance
- relay forwarding frames while no client wants them
- dashboard receiving frames but not rendering them
- MIDI/audio visual offset exceeding the configured tolerance
- spectrum stale while post-audio RMS is reported above the display floor
- spectrum renderer active while the master spectrogram toggle is off

Tests should cover:

- spectrogram off preserves the current MIDI-brush default path
- MIDI brush toggle hides/shows only MIDI brushes
- spectrogram toggle hides/shows only the spectrum layer
- complex changes select modalities instantly
- out-of-order frames are discarded
- stale stream state is detectable
- docs stay aligned with the schema once any new transport address is added

## Implementation Phases

### Phase 0 - Documentation And Design

- Keep this roadmap as the design anchor.
- Decide the first post-audio analysis point in Max.
- Decide whether first transport uses existing relay framing or a separate UDP input that relay converts for WebSocket clients.
- Define the first spectrum-frame payload without adding raw address literals to docs before schema work.

### Phase 1 - Toggle Scaffold

- Add spectrogram and MIDI-brush dashboard toggles.
- Persist both toggles.
- Keep default as MIDI brushes on, spectrogram off.
- Ensure spectrogram off creates no renderer side effects.
- Add a simple static test for the toggle controls and default state.

### Phase 2 - Transport Skeleton

- Add canonical spectrum transport schema in the TypeScript source of truth.
- Regenerate Max includes if schema changes require it.
- Add relay forwarding with frame id, timestamp, and stale/backpressure logs.
- Add dashboard typed event fanout.
- Add dashboard logging mode that receives frames but does not render them.

### Phase 3 - Max Audio Analysis Prototype

- Analyze the actual post-audio bus in Max.
- Emit compact log-frequency frames and core audio features.
- Include analysis-window center timestamps.
- Add Max-side enable/disable so disabled dashboards do not force continuous analysis.

### Phase 4 - Spectrum Buffer And Sync

- Add browser ring buffer keyed by audio timestamp.
- Add visual latency compensation only when spectrogram is enabled.
- Add audio/MIDI nudge control.
- Add frame-age and jitter telemetry.
- Verify MIDI-only mode still uses the current timing path.

### Phase 5 - Minimal Renderer

- Add the spectrogram canvas below the MIDI brush layer.
- Render grayscale or simple thermal log-frequency frames first.
- Verify layer order with MIDI brushes on top.
- Verify all four toggle states.
- Verify no background generation happens without audio frames.

### Phase 6 - Modality Engine

- Add declarative modality definitions.
- Switch modality instantly on complex change.
- Add first complex-to-modality map.
- Add feature modulation from centroid, flux, RMS, and optional stereo data.
- Add a minimal debug display for active modality and frame freshness.

### Phase 7 - Recording

- Add begin/end recording controls after live rendering is stable.
- Implement timestamp-appended offscreen print buffer.
- Support composite, spectrogram-only, and MIDI-only export modes.
- Ensure recording obeys layer toggles.

### Phase 8 - Hardening

- Add invariant tests and stale-frame failure paths.
- Update dashboard architecture and invariant docs once module boundaries are real.
- Browser-verify normal and half zoom with all toggle states.
- Tune first performance presets by playing actual sessions, not static test files.

## Open Design Decisions

- Exact Max audio tap point: fully post-reverb, pre-master, or both dry and wet.
- First frame rate and bin count.
- Whether stereo width is useful enough for the first payload.
- Whether complex should be sampled at audio-analysis time in Max or attached in relay from latest engine state.
- Whether MIDI visual delay should be automatic, user-tunable, or both.
- Whether recording defaults to visible composite or asks for a stem mode.

## Acceptance Criteria

- With spectrogram off and MIDI brushes on, the dashboard matches current behavior.
- With spectrogram on and MIDI brushes on, MIDI brushes render above the spectrogram.
- With MIDI brushes off and spectrogram on, actual post-audio energy remains visible, including reverb tails.
- With both off, no rolling visual layer draws.
- No spectrogram pixels are generated from MIDI alone.
- Stale or missing spectrum frames fail loudly enough to diagnose during rehearsal.
- Complex changes switch color modality instantly without interrupting the audio-derived timeline.
