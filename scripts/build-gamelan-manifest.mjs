#!/usr/bin/env node
// scripts/build-gamelan-manifest.mjs
//
// Reads max/media/gamelan/*.wav, parses the structured filenames from the
// Latent Sonorities pack (Khyam Allami + RBI Berlin Javanese Gamelan),
// and writes src/gamelan-manifest.ts — the runtime source of truth for
// "what samples exist." Run once after adding/removing samples; the
// emitted .ts file is committed.
//
// Filename schema (memeshift / Latent Sonorities):
//   {freesound-id}__memeshift__{seq}-{instrument}-{tuning?}-{mallet}-{descriptor...}.wav
// Examples:
//   722090__memeshift__001-saron-pelog-pekingmallet-1-softest.wav
//   722161__memeshift__071-kempyang-slendro-bonangmalletwoodenside-medium.wav
//   722545__memeshift__271-gongageng-gongmallet-centersoftest.wav
//   722462__memeshift__188-bonangbarung-slendro-bonangmalletwoodenside-2-broken-medium.wav
//
// Parser keeps the conservative rule: anything we can't unambiguously parse
// is recorded with its raw descriptor and flagged for a manual review pass.
// Drift between filesystem and manifest is caught by check:docs.
//
// Run: node scripts/build-gamelan-manifest.mjs

import { readdirSync, writeFileSync, statSync, readFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { createHash } from 'node:crypto';

const ROOT = resolve(import.meta.dirname, '..');
const SAMPLE_DIR = resolve(ROOT, 'max', 'media', 'gamelan');
const OUT = resolve(ROOT, 'src', 'gamelan-manifest.ts');

// Velocity tokens are open-ended in this pack — we treat them as opaque
// labels but normalise to a sortable bucket index. Order goes soft → hard.
const VELOCITY_ORDER = [
  'softest', 'softer', 'soft',
  'medium', 'mediumalt',
  'harder', 'harderalt', 'hardest',
  'harddamped', 'hardringdamped', 'hardopen',
  'center', 'centeralt',
];

const INSTRUMENT_ALIASES = {
  saron: 'saron',
  slenthem: 'slenthem',
  bonangbarung: 'bonang',
  kempyang: 'kempyang',
  kethuk: 'kethuk',
  kempul: 'kempul',
  kempulensemble: 'kempul-ensemble',
  gongageng: 'gong',
};

function parseFilename(name) {
  if (!name.endsWith('.wav')) return null;
  const base = name.slice(0, -4);
  // Strip the freesound-id__memeshift__ prefix.
  const m = base.match(/^\d+__memeshift__\d{3}-(.+)$/);
  if (!m) return null;
  const parts = m[1].split('-'); // [instrument, ...rest]
  const rawInstrument = parts.shift();
  const instrument = INSTRUMENT_ALIASES[rawInstrument];
  if (!instrument) return { error: 'unknown-instrument', raw: rawInstrument, file: name };

  let tuning = null;
  if (parts[0] === 'pelog' || parts[0] === 'slendro') {
    tuning = parts.shift();
  }

  // Velocity is always the last token. Some files compound a position
  // prefix ("center", "side") with a velocity label, e.g. "centersoftest"
  // or "sideharder" — split those into a modifier + canonical velocity.
  let velocityRaw = parts.pop();
  const positionPrefixes = ['centeralt', 'center', 'side'];
  const extraModifiers = [];
  for (const pref of positionPrefixes) {
    if (velocityRaw && velocityRaw !== pref && velocityRaw.startsWith(pref)) {
      const suffix = velocityRaw.slice(pref.length);
      if (suffix && VELOCITY_ORDER.indexOf(suffix) !== -1) {
        extraModifiers.push(pref === 'centeralt' ? 'center' : pref);
        velocityRaw = suffix;
        break;
      }
    } else if (velocityRaw === pref) {
      extraModifiers.push(pref === 'centeralt' ? 'center' : pref);
      // velocity is just the position word; assign neutral mid bucket.
      velocityRaw = pref === 'centeralt' ? 'mediumalt' : 'medium';
      break;
    }
  }
  const velocityBucket = VELOCITY_ORDER.indexOf(velocityRaw);
  // If we don't recognise the velocity it's still kept; bucket = -1.

  // Mallet identifier is typically the first remaining token (no separator
  // between "bonangmallet" and "woodenside" — we accept the whole chunk).
  // BUT some instruments (kempul, gong-without-malletname-variant) have no
  // mallet token in their filename, going straight from instrument+tuning
  // to degree. Detect that case by checking if the first remaining token
  // already looks like a degree (numeric, optionally with l/h suffix).
  let mallet = 'default';
  if (parts.length > 0 && !/^\d+[lh]?$/.test(parts[0])) {
    mallet = parts.shift();
  }

  // Anything left is descriptor: degree, modifiers (broken, center, side, etc.)
  // Degree is normally numeric (1-7) optionally suffixed by l/h (low/high
  // octave for bonang+slenthem-slendro). Anything non-numeric is a modifier.
  let degree = null;
  const modifiers = [...extraModifiers];
  for (const tok of parts) {
    if (/^\d+[lh]?$/.test(tok)) {
      degree = tok;
    } else {
      modifiers.push(tok);
    }
  }

  return {
    file: name,
    instrument,
    tuning,
    degree,
    mallet,
    modifiers,
    velocity: velocityRaw,
    velocityBucket,
  };
}

/** Canonical short name used as polybuffer~ slot id. Stable; human-readable. */
function canonicalName(entry) {
  const parts = [entry.instrument];
  if (entry.tuning) parts.push(entry.tuning);
  if (entry.degree) parts.push(entry.degree);
  if (entry.modifiers.length) parts.push(entry.modifiers.join('_'));
  parts.push(entry.velocity);
  // Mallet is included only when it disambiguates (more than one mallet per
  // (instrument, tuning, degree, velocity)). For now always include so names
  // are unique across the pack.
  parts.push(entry.mallet);
  return parts.join('-').toLowerCase();
}

const files = readdirSync(SAMPLE_DIR)
  .filter(n => n.endsWith('.wav'))
  .sort();

if (files.length === 0) {
  console.error(`[gamelan-manifest] no .wav files in ${SAMPLE_DIR}`);
  process.exit(2);
}

const parsed = [];
const errors = [];
const seenCanonical = new Set();
for (const f of files) {
  const p = parseFilename(f);
  if (!p) { errors.push({ file: f, reason: 'unparseable-prefix' }); continue; }
  if (p.error) { errors.push(p); continue; }
  p.canonical = canonicalName(p);
  if (seenCanonical.has(p.canonical)) {
    errors.push({ file: f, reason: 'duplicate-canonical', canonical: p.canonical });
    continue;
  }
  seenCanonical.add(p.canonical);
  parsed.push(p);
}

// Group counts for the codegen header — useful sanity-check in commits.
const byInstrument = {};
for (const e of parsed) {
  byInstrument[e.instrument] = (byInstrument[e.instrument] ?? 0) + 1;
}

// Content hash for D77 invariant — Max bang() logs the expected hash and
// compares to its computed-at-load count; mismatch means a sample file was
// renamed/deleted without regenerating the manifest.
const manifestHash = createHash('sha256')
  .update(parsed.map(e => e.canonical + ':' + e.file).join('\n'))
  .digest('hex')
  .slice(0, 16);

const lines = [];
lines.push('// ================================================================');
lines.push('// src/gamelan-manifest.ts — GENERATED by scripts/build-gamelan-manifest.mjs');
lines.push('// DO NOT EDIT BY HAND. Regenerate after adding/removing samples:');
lines.push('//     node scripts/build-gamelan-manifest.mjs');
lines.push('//');
lines.push('// Source: max/media/gamelan/ (Latent Sonorities — RBI Berlin Javanese');
lines.push('// Gamêlan Agêng Tumbuk Nêm; tuning analysis by Khyam Allami).');
lines.push('// ================================================================');
lines.push('');
lines.push('export interface GamelanSample {');
lines.push('  /** Canonical short name; used as polybuffer~ slot id and in /xk/sphere/strike. */');
lines.push('  canonical: string;');
lines.push('  /** Raw filename relative to max/media/gamelan/. */');
lines.push('  file: string;');
lines.push('  /** Instrument family. */');
lines.push("  instrument: 'saron' | 'slenthem' | 'bonang' | 'kempyang' | 'kethuk' | 'kempul' | 'kempul-ensemble' | 'gong';");
lines.push('  /** Tuning system, null for unpitched (gong) or unspecified (kempyang/kethuk are slendro-tuned but single-pitch). */');
lines.push("  tuning: 'pelog' | 'slendro' | null;");
lines.push('  /** Scale degree as printed on the instrument; 1..7 plus l/h octave suffix. null for single-pitch instruments. */');
lines.push('  degree: string | null;');
lines.push('  /** Mallet identifier (e.g. "pekingmallet", "saronmallet", "bonangmalletwoodenside"). */');
lines.push('  mallet: string;');
lines.push('  /** Articulation / variant tokens left over after mallet + degree consumed (e.g. ["broken"], ["center"]). */');
lines.push('  modifiers: string[];');
lines.push('  /** Raw velocity label as named in the pack ("softest", "medium", "harddamped", ...). */');
lines.push('  velocity: string;');
lines.push('  /** Sort bucket: lower = softer. -1 if unrecognised. */');
lines.push('  velocityBucket: number;');
lines.push('}');
lines.push('');
lines.push('/** Order-preserving manifest. Index in this array is stable for polybuffer~ slot indexing if names change. */');
lines.push('export const GAMELAN_SAMPLES: readonly GamelanSample[] = [');
for (const e of parsed) {
  const mods = JSON.stringify(e.modifiers);
  lines.push(`  { canonical: ${JSON.stringify(e.canonical)}, file: ${JSON.stringify(e.file)}, instrument: ${JSON.stringify(e.instrument)}, tuning: ${e.tuning ? JSON.stringify(e.tuning) : 'null'}, degree: ${e.degree ? JSON.stringify(e.degree) : 'null'}, mallet: ${JSON.stringify(e.mallet)}, modifiers: ${mods}, velocity: ${JSON.stringify(e.velocity)}, velocityBucket: ${e.velocityBucket} },`);
}
lines.push('];');
lines.push('');
lines.push('/** Sample count expected at runtime. Drift = check:docs failure. */');
lines.push(`export const GAMELAN_SAMPLE_COUNT = ${parsed.length};`);
lines.push('');
lines.push('/** Content hash over (canonical, file) pairs. Max xk_sphere.js bang() logs');
lines.push(' *  this and the user verifies it matches expected; mismatch indicates either');
lines.push(' *  the .wav directory diverged or the codegen needs re-running. */');
lines.push(`export const GAMELAN_MANIFEST_HASH = ${JSON.stringify(manifestHash)};`);
lines.push('');
lines.push('/** Per-instrument-family counts at generation time — committed for review. */');
lines.push(`export const GAMELAN_INSTRUMENT_COUNTS: Readonly<Record<string, number>> = ${JSON.stringify(byInstrument, null, 2)};`);
lines.push('');

writeFileSync(OUT, lines.join('\n'), 'utf8');
console.log(`[gamelan-manifest] wrote ${OUT}`);
console.log(`[gamelan-manifest]   total samples:    ${parsed.length}`);
console.log(`[gamelan-manifest]   by instrument:    ${JSON.stringify(byInstrument)}`);
console.log(`[gamelan-manifest]   manifest hash:    ${manifestHash}`);
if (errors.length) {
  console.warn(`[gamelan-manifest] ${errors.length} files SKIPPED:`);
  for (const e of errors) console.warn(`                    ${JSON.stringify(e)}`);
}
