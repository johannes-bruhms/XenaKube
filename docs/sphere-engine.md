# Sphere Engine — Gamelan Sample Bridge

Mandala-cosmo's second synthesis output. The body engine (SWAM Cello, `max/xk_swam.js`) keeps firing per-turn as in alpha/beta-cosmo; the sphere engine fires gamelan strikes in parallel on cycle boundaries, half-turns, vertex transitions, and sustained-complex events. The two layers sound together — body soloist over cosmic ground — and are configured to coexist intonationally (cello in 12-TET, gamelan in its physical absolute tuning; see §5).

## Pack provenance

Samples: **Latent Sonorities** by Khyam Allami + Counterpoint, sampled from the Gamêlan Agêng Tumbuk Nêm at **Rumah Budaya Indonesia, Berlin**. Tuning analysis via Leimma. Files in `media/gamelan/`. Scala files under `media/gamelan/Latent-Sonorities-Tuning-Files-in-Scala/`.

Credit the pack visibly when shipping recordings or installation builds — the project is an explicit decolonial-tuning effort and using it congruently matters.

## Instrument inventory

314 samples across 8 instrument families. Parsed at build time by `scripts/build-gamelan-manifest.mjs` into `src/gamelan-manifest.ts`.

| Family | Tuning | Range | Velocity layers | Articulations | Role |
|---|---|---|---|---|---|
| `gong` (ageng) | unpitched | 1 | 5–6 | center / side, 2 mallets | Colotomic ring-boundary marker |
| `kempul` | pelog | 4 (5/6/7/1h) | 4 | kempul / small mallet | Mid-cycle / half-turn punctuation |
| `kempul-ensemble` | pelog | 4 | 1 | kempul / small mallet | Alternative kempul recording |
| `saron` | pelog | 7 (1–7) | 5 | peking / saron mallet | Balungan / skeletal melody |
| `slenthem` | pelog + slendro | 7 + 7 | 3 | wooden / padded mallet | Sustained low metallophone (ground) |
| `bonang` (barung) | slendro | 11 pitches over 2 oct + broken-2 | 3–5 | open / damped / ring-damped, wooden / padded | Figuration / kotekan |
| `kempyang` | slendro | single pitch | 3 | wooden / padded | Offbeat time-keeper |
| `kethuk` | slendro | single pitch | 3 | wooden / padded | Offbeat time-keeper |

Notable absences (worth knowing for future expansions): kenong, gendér, gambang, rebab, suling, vocals.

## Tunings

Cent offsets from local "1," plus reference Hz (Leimma C-rooted convention). Full data in `src/gamelan-tuning.ts`.

| Scale | Steps (cents from local 1) | Ref Hz | Ref MIDI |
|---|---|---|---|
| Saron pelog       | 0, 123, 271, 532, 675, 778, 951, 1200 | 596.9  | C5 |
| Slenthem pelog    | 0, 166, 279, 549, 695, 809, 996, 1200 | 148.4  | C3 |
| Slenthem slendro  | 0, 232, 464, 706, 958, 1200           | 135.4  | C3 |
| Bonang slendro    | 0, 293, 521, 732, 992, 1228.6, 1436.6, 1898.6, 2592.6, 3511.6 | 268.7 | C4 |
| Kempul pelog      | 0, 719, 829, 991, 1200                | 292.3  | C4 |

Note that saron and slenthem disagree about pelog by ~20–40¢ per degree — this is real physical-instrument variance (paired-tuning ombak), not an error. Don't try to flatten.

Reference pitches are wildly non-12-TET because the physical instruments aren't tuned to A=440. When loaded at native rate the bronze samples sound at their physical Hz; mixing with 12-TET SWAM cello produces an intentional intonational duality (body and sphere live in different tuning worlds).

## Pipeline

```
                      ┌─ /xk/voice ────→ Max → vst~ SWAM Cello (body)
GAN → relay.js → engine.ts
   (mandala-cosmo)    └─ /xk/sphere/* → Max → polybuffer~ + groove~ (sphere)
                                              ↑
                                              xk_sphere.js v8
```

- Cosmology selection upstream in `engine.ts`. Mandala-cosmo dispatches sphere strikes; alpha/beta do not.
- `planMandalaStrikes` (in `src/mandala-cosmo.ts`) maps a voice transition to 0..N `SphereStrike`s:
  - **Ring boundary** (`step % COLOTOMIC_RING_LEN === 1`) → gong (`pickGongStrike`)
  - **Half-turn** → kempul on a face-axis-derived pelog degree (5/6/7/1h)
  - **Per-voice (non-half-turn)** → saron pelog note keyed by vertex index (mod 7)
  - **C6/C7/C8** → slenthem pelog ground at the same degree
- Sphere strikes are emitted via `OSC.SPHERE_STRIKE` (`/xk/sphere/strike`) with `(sampleName, gain, pan, voiceSteal, strikeId)`. Order:
  1. Engine fires `/xk/voice` (unchanged from beta-cosmo).
  2. `engine.onSphere` listeners get the planned strikes.
  3. Relay forwards them to oscMax + broadcasts WS `sphere_strike` for the dashboard mandala canvas.

## Max-side (xk_sphere.js + patch)

`max/xk_sphere.js` is a v8 sibling to `xk_swam.js`. Pulls its data tables from `gen_sphere_includes.js` (codegen'd by `npm run gen:max`).

Outlets:
- 0 (PLAY) → instrument-class router → `groove~` voice subpatchers
- 1 (DEBUG) → `print xk_sphere`
- 2 (ECHO) → `/xk/sphere/echo` → `udpsend 127.0.0.1 57122` (relay's D75 audit)
- 3 (LOADED) → `/xk/sphere/loaded` → `udpsend` (D77 confirmation)

`bang()` triggers polybuffer load of all 314 samples, logs the tuning + manifest hashes. Strike OSC dispatches per-class voice messages and emits the echo. Panic flushes all classes.

**Patch additions** (under construction via `max-patch` subagent or manual):

```
[udpreceive 57121]
  └─ [route /xk/sphere/strike /xk/sphere/panic]
        └─ [v8 xk_sphere.js]
              ├─ outlet 0 → [route load gong kempul kempul-ensemble saron slenthem bonang kempyang kethuk]
              │                ├─ load  → [polybuffer~ gamelan]  (loads sample by name + path)
              │                ├─ <cls> → per-class voice subpatcher: [groove~ gamelan/<name>] → *~ <gain> → matrix~ mix
              ├─ outlet 2 → [prepend /xk/sphere/echo] → [udpsend 127.0.0.1 57122]
              └─ outlet 3 → [prepend /xk/sphere/loaded] → [udpsend 127.0.0.1 57122]

mixer: [matrix~ N 2 1] sums SWAM-cello stereo + sphere stereo into one master pair → [dac~]
```

## Bridge invariants (D75–D78)

Full prose in `docs/bridge-invariants.md`. Sphere-specific:

- **D75** — Sphere strike echo audit (relay).
- **D76** — Sphere panic propagation (xk_sphere.js).
- **D77** — Sample-load completeness (bang-time count check + checksum log).
- **D78** — Tuning ↔ Scala-source alignment (bang-time hash log, vitest cross-check against `gen_sphere_includes.js`).

## Dashboard mandala canvas

`public/js/mandala-canvas.js`. Off by default; toggle button `mand` in the rolling-score control row. Subscribes to WS `sphere_strike` events, deposits one glyph per strike with 8-fold radial symmetry (D8 — `MANDALA_SYMMETRY_ORDER = 8`, mirrored in `--mandala-symmetry` CSS var per D81). Solve event triggers a 12-second dissolution fade.

Per-instrument glyph language (`SPHERE_INSTRUMENT_GLYPH` in `src/mandala-cosmo.ts`, mirrored in `mandala-canvas.js`):
- gong → bindu (large filled circle at center radius)
- kempul → ring (open circle, mid-near radius)
- saron → petal (teardrop, mid radius)
- slenthem → flame (elongated, mid-near radius)
- bonang → circle (small dot, far radius)
- kempyang/kethuk → dot (smallest)

## Workflow

When adding a sample family or editing a tuning:

1. Add/rename `.wav` files in `media/gamelan/` (or amend a Scala file in `src/gamelan-tuning.ts`).
2. Run `node scripts/build-gamelan-manifest.mjs` to refresh `src/gamelan-manifest.ts`.
3. Run `npm run gen:max` to refresh `max/gen_sphere_includes.js`.
4. Reload `xk_sphere.js` in Max (right-click v8 → Reload Script).
5. `bang()` the v8 — the manifest + tuning hashes log in the Max console; verify they match the values in `src/gamelan-manifest.ts` / `src/gamelan-tuning.ts`.
6. `npx tsc --noEmit && npm test && npm run check:docs`.

The D78 cross-check vitest (`test/gamelan-tuning.test.ts`) will fail if step 3 was skipped.

## Future phases (deferred)

- Sympathetic resonance coupling: SWAM cello → sphere modal-bank excitation. Body literally vibrates cosmos.
- Ambisonic spatialization: cube quaternion drives ambisonic listener pose for sphere only. Body stays head-locked, sphere is world-locked.
- Modal bank: synthesised damped sine partials matching the gamelan's documented partials, layered under struck samples for sustained drone tail.
- Microtonal SWAM mode: optional cello pitchbend-snap to nearest pelog/slendro degree.
- Kotekan figuration patterns: pre-composed bonang barung interlock fragments triggered by recognized cube algorithms.
- Per-pathet ring tonics: ring boundary selects a slendro/pelog pathet (nem/sanga/manyura) from cube orientation; subsequent strikes constrain to that mode.
