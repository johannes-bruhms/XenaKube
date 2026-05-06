#!/usr/bin/env node
// Doc-truth checks for CLAUDE.md and the docs/ tree.
//
// Multiple passes, each tied to a row in CLAUDE.md § Doc Maintenance →
// "Drift Detection". The script is the executable enforcement of the doc
// contract; failing any pass blocks pre-commit alongside `tsc --noEmit`
// and `npm test`.
//
// Passes:
//   1. Size budget (CLAUDE.md ≤ 40 KB; invariant row ≤ 1,200 chars).
//   2. Doc Maintenance coverage (every docs/*.md referenced from CLAUDE.md).
//   3. OSC address coverage (every `/xk/*` literal in docs is in the schema).
//   4. Constant-sync (tracked numeric constants in code match their citations
//      in Markdown).
//
// Exit codes:
//   0 — all passes OK (warnings non-fatal)
//   1 — one or more hard checks failed
//   2 — script error (target file missing, regex mismatch, etc.)

import { readFileSync, statSync, readdirSync } from 'node:fs';
import { resolve, relative, join, sep } from 'node:path';

const ROOT = process.cwd();
let exitCode = 0;
function fail(msg) { console.error(`[check:docs] FAIL  ${msg}`); exitCode = 1; }
function warn(msg) { console.warn(`[check:docs] WARN  ${msg}`); }
function ok(msg)   { console.log (`[check:docs] OK    ${msg}`); }
function info(msg) { console.log (`[check:docs] ----  ${msg}`); }

// ============================================================
// 1. Size budget
// ============================================================

(function sizeBudget() {
  const FILE_HARD_BYTES = 40_000;
  const FILE_WARN_BYTES = 36_000;
  const ROW_HARD_CHARS  = 1_200;
  const ROW_WARN_CHARS  = 800;
  const TARGET = 'CLAUDE.md';
  const abs = resolve(ROOT, TARGET);

  let bytes;
  try { bytes = statSync(abs).size; }
  catch (e) {
    console.error(`[check:docs] cannot stat ${TARGET}: ${e.message}`);
    process.exit(2);
  }

  const filePct = ((bytes / FILE_HARD_BYTES) * 100).toFixed(1);
  if (bytes > FILE_HARD_BYTES) {
    fail(`${TARGET}: ${bytes} bytes (${filePct}% of ${FILE_HARD_BYTES} hard limit)`);
    console.error('              Compress invariant rows; full prose belongs in docs/{bridge,dashboard}-invariants.md.');
  } else if (bytes > FILE_WARN_BYTES) {
    warn(`${TARGET}: ${bytes} bytes (${filePct}% of ${FILE_HARD_BYTES} hard limit) — budget tightening`);
  } else {
    ok(`${TARGET}: ${bytes} bytes (${filePct}% of ${FILE_HARD_BYTES} hard limit)`);
  }

  const lines = readFileSync(abs, 'utf8').split(/\r?\n/);
  let longest = { len: 0, lineNo: -1, name: '' };
  let warnRows = 0, failRows = 0;
  for (let i = 0; i < lines.length; i++) {
    const ln = lines[i];
    if (!ln.startsWith('| **')) continue;
    const len = ln.length;
    const dashIdx = ln.indexOf(' — ');
    const name = dashIdx > 0 ? ln.slice(2, dashIdx).trim() : ln.slice(2, 60).trim();
    if (len > longest.len) longest = { len, lineNo: i + 1, name };
    if (len > ROW_HARD_CHARS) {
      fail(`${TARGET}:${i + 1} invariant row "${name}" is ${len} chars (>${ROW_HARD_CHARS} hard cap)`);
      console.error('              Compress to claim+where+log; move full prose to docs/{bridge,dashboard}-invariants.md.');
      failRows++;
    } else if (len > ROW_WARN_CHARS) {
      warn(`${TARGET}:${i + 1} invariant row "${name}" is ${len} chars (>${ROW_WARN_CHARS} soft cap)`);
      warnRows++;
    }
  }
  if (longest.lineNo >= 0) {
    info(`longest invariant row: ${longest.len} chars at ${TARGET}:${longest.lineNo} ("${longest.name}")`);
  }
  if (warnRows === 0 && failRows === 0) {
    ok(`all invariant rows within the ${ROW_WARN_CHARS}/${ROW_HARD_CHARS} char budget`);
  }
})();

// ============================================================
// Helpers shared by passes 2-4
// ============================================================

function listMarkdown(dir, opts = {}) {
  const { exclude = [] } = opts;
  const out = [];
  const stack = [dir];
  while (stack.length) {
    const cur = stack.pop();
    let entries;
    try { entries = readdirSync(cur, { withFileTypes: true }); }
    catch { continue; }
    for (const e of entries) {
      const p = join(cur, e.name);
      const rel = relative(ROOT, p).split(sep).join('/');
      if (exclude.some(prefix => rel.startsWith(prefix))) continue;
      if (e.isDirectory()) stack.push(p);
      else if (e.isFile() && e.name.endsWith('.md')) out.push(rel);
    }
  }
  return out.sort();
}

function readSafe(path) {
  try { return readFileSync(resolve(ROOT, path), 'utf8'); }
  catch { return null; }
}

// Docs that are intentional historical records (D-coded diagnoses, design
// rationale, dated changelog). Constant-sync and osc-coverage MUST NOT scan
// these — historical entries record what was true at the time and rewriting
// them would falsify history (per CLAUDE.md § Doc Maintenance "Hard rule").
// The doc-index check still runs on the survivors so the table stays in sync.
const HISTORICAL_DOCS = new Set([
  'docs/revision_roadmap.md',
  'docs/research_notes.md',
  'docs/xenakube-feedback-04302026.md',
  'CHANGELOG.md',
  'docs/todo.md',  // forward-looking; cites planned-not-shipped values
]);

// Live docs scanned by every check. AGENTS guides are included even though
// they live outside docs/ — they're agent-facing and have to stay accurate.
function liveDocs() {
  const all = [
    'CLAUDE.md', 'README.md',
    'AGENTS.md', 'src/AGENTS.md', 'max/AGENTS.md', 'docs/AGENTS.md',
    ...listMarkdown('docs', { exclude: ['docs/archived'] }),
  ];
  return all.filter(p => !HISTORICAL_DOCS.has(p));
}

// ============================================================
// 2. Doc Maintenance coverage
// ============================================================

(function docIndex() {
  const claude = readSafe('CLAUDE.md');
  if (!claude) { fail('doc-index: CLAUDE.md missing'); return; }

  // Files that should each have a Doc Maintenance row. archived/, presentation/,
  // temp-screenshots/, and the SWAM screenshots directory are reference assets,
  // not maintained docs; xenakis primary source is referenced via research_notes.
  const mds = listMarkdown('docs', {
    exclude: ['docs/archived', 'docs/presentation', 'docs/temp-screenshots'],
  });
  const expected = mds.filter(p => {
    // docs/swam/*.md other than swam_cello_reference.md are supporting refs
    if (p.startsWith('docs/swam/') && !p.endsWith('swam_cello_reference.md')) return false;
    return true;
  });

  let missing = 0;
  for (const path of expected) {
    const base = path.split('/').pop();
    // Match either `path` literal or just the basename in a backtick.
    const found = claude.includes(path) || claude.includes('`' + base + '`');
    if (!found) {
      fail(`doc-index: ${path} has no Doc Maintenance row in CLAUDE.md`);
      missing++;
    }
  }
  if (missing === 0) ok(`doc-index: every tracked doc/*.md has a Doc Maintenance row (${expected.length} files)`);
})();

// ============================================================
// 3. OSC address coverage
// ============================================================

(function oscCoverage() {
  const schema = readSafe('src/osc-schema.ts');
  if (!schema) { fail('osc-coverage: src/osc-schema.ts missing'); return; }

  // Pull every '/xk/...' string literal out of the schema source.
  const schemaAddrs = new Set();
  const reLit = /'(\/xk\/[^']+)'/g;
  let m;
  while ((m = reLit.exec(schema)) !== null) {
    let a = m[1];
    // Trailing-slash positional addresses (e.g. '/xk/vertex/') stand for
    // /xk/vertex/1../xk/vertex/8 — record both the prefix and the per-suffix
    // forms so doc references like `/xk/vertex/[1-8]` and `/xk/vertex/3` both
    // resolve.
    if (a.endsWith('/')) {
      schemaAddrs.add(a);
      schemaAddrs.add(a.slice(0, -1));
      for (let i = 1; i <= 8; i++) schemaAddrs.add(a + i);
    } else {
      schemaAddrs.add(a);
    }
  }

  // Treat namespace prefixes (/xk/midi, /xk/expr, /xk/snap, /xk/group) as
  // valid since the schema declares /xk/midi/noteon, /xk/expr/tilt, etc.
  const namespacePrefixes = new Set();
  for (const a of schemaAddrs) {
    const idx = a.lastIndexOf('/');
    if (idx > '/xk/'.length - 1) namespacePrefixes.add(a.slice(0, idx));
  }

  const docs = liveDocs();
  // Match /xk/<path> with optional [n-m] range suffix or {a,b} alternation.
  const reUse = /\/xk\/[a-z][a-z/_-]*[a-z](?:\/(?:\[?\d[-\d\]]*\]?|\{[^}]+\}))?/gi;

  let bad = 0;
  for (const path of docs) {
    const text = readSafe(path);
    if (!text) continue;
    const seen = new Set();
    let u;
    while ((u = reUse.exec(text)) !== null) {
      const addr = u[0];
      if (seen.has(addr)) continue;
      seen.add(addr);
      const stripped = addr.replace(/\/\[\d[-\d\]]*\]?$/, '/').replace(/\/\{[^}]+\}$/, '');
      const candidate = stripped.endsWith('/') ? stripped.slice(0, -1) : stripped;
      if (schemaAddrs.has(addr) || schemaAddrs.has(stripped) || schemaAddrs.has(candidate)) continue;
      if (namespacePrefixes.has(addr) || namespacePrefixes.has(candidate)) continue;
      // Tolerate prefix matches: /xk/expr/tilt etc. live under /xk/expr/* in the schema.
      let prefixMatch = false;
      for (const s of schemaAddrs) {
        if (s.endsWith('/') && addr.startsWith(s)) { prefixMatch = true; break; }
      }
      if (prefixMatch) continue;
      fail(`osc-coverage: ${path} references "${addr}" not in src/osc-schema.ts`);
      bad++;
    }
  }
  if (bad === 0) ok('osc-coverage: every /xk/* literal in docs resolves to src/osc-schema.ts');
})();

// ============================================================
// 4. Constant-sync
// ============================================================

(function constantSync() {
  // Each entry tracks one constant. `sourceRe` reads the authoritative value
  // from `source`. `claimRes` is an array of regex patterns matching how the
  // constant is *cited as a value* in prose — direct assignment, "(N ms)",
  // "±N", etc. A claim regex that captures a value not equal to the source
  // value is the drift signal. Lines containing the constant name with no
  // claim-pattern match are ignored — a doc can mention `MIN_GLISS_SPACING_MS`
  // without restating the value, which is the preferred style.
  //
  // The patterns are deliberately strict: prefer false-negatives (missed
  // drift, caught by next pre-commit when the doc is re-edited) over
  // false-positives (which train people to suppress the check).
  const TRACKED = [
    { name: 'PITCHBEND_RANGE_SEMI', source: 'max/xk_swam.js',
      sourceRe: /\bvar\s+PITCHBEND_RANGE_SEMI\s*=\s*(\d+)/,
      claimRes: [
        // PITCHBEND_RANGE_SEMI = 24 / `PITCHBEND_RANGE_SEMI = 48`
        /PITCHBEND_RANGE_SEMI\s*[=:]\s*[`±]?(\d+)/,
        // bridge ±48 / bridge at ±24 / bridge value of ±48
        /bridge(?:\s+(?:at|value\s+of))?\s*±\s*(\d+)/i,
      ] },
    { name: 'FIRST_GLISS_MS_C7', source: 'max/xk_swam.js',
      sourceRe: /\bvar\s+FIRST_GLISS_MS_C7\s*=\s*(\d+)/,
      claimRes: [/FIRST_GLISS_MS_C7\s*[=:]\s*[`]?(\d+)/] },
    { name: 'FIRST_GLISS_MS', source: 'max/xk_swam.js',
      sourceRe: /\bvar\s+FIRST_GLISS_MS\s*=\s*(\d+)/,
      // Anchor with negative lookahead so we don't match FIRST_GLISS_MS_C7.
      claimRes: [/FIRST_GLISS_MS(?!_)\s*[=:]\s*[`]?(\d+)/] },
    { name: 'MIN_GLISS_SPACING_MS', source: 'max/xk_swam.js',
      sourceRe: /\bvar\s+MIN_GLISS_SPACING_MS\s*=\s*(\d+)/,
      claimRes: [
        /MIN_GLISS_SPACING_MS\s*[=:]\s*[`]?(\d+)/,
        /MIN_GLISS_SPACING_MS`?\s*\(\s*(\d+)\s*ms\s*\)/,
      ] },
    { name: 'WILD_MIN_COUNT', source: 'max/xk_swam.js',
      sourceRe: /\bvar\s+WILD_MIN_COUNT\s*=\s*(\d+)/,
      claimRes: [/WILD_MIN_COUNT\s*[=:]\s*[`]?(\d+)/] },
    { name: 'WILD_GLISS_VEL', source: 'max/xk_swam.js',
      sourceRe: /\bvar\s+WILD_GLISS_VEL\s*=\s*(\d+)/,
      claimRes: [/WILD_GLISS_VEL\s*[=:]\s*[`]?(\d+)/] },
    { name: 'WILD_GLISS_BPA', source: 'max/xk_swam.js',
      sourceRe: /\bvar\s+WILD_GLISS_BPA\s*=\s*(\d+)/,
      claimRes: [/WILD_GLISS_BPA\s*[=:]\s*[`]?(\d+)/] },
    { name: 'BPA_RESET_MS', source: 'max/xk_swam.js',
      sourceRe: /\bvar\s+BPA_RESET_MS\s*=\s*(\d+)/,
      claimRes: [
        /BPA_RESET_MS\s*[=:]\s*[`]?(\d+)/,
        /BPA_RESET_MS`?\s*\(\s*(\d+)\s*ms\s*\)/,
      ] },
    { name: 'ARC_CHAIN_GAP_MS', source: 'max/xk_swam.js',
      sourceRe: /\bvar\s+ARC_CHAIN_GAP_MS\s*=\s*(\d+)/,
      claimRes: [/ARC_CHAIN_GAP_MS\s*[=:]\s*[`]?(\d+)/] },
    { name: 'TILT_EMA_ALPHA', source: 'max/xk_swam.js',
      sourceRe: /\bvar\s+TILT_EMA_ALPHA\s*=\s*([0-9.]+)/,
      claimRes: [/TILT_EMA_ALPHA\s*[=:]\s*[`α]?\s*([0-9]+(?:\.[0-9]+)?)/] },
    { name: 'BOW_FLAP_RATE_FAIL', source: 'max/xk_swam.js',
      sourceRe: /\bvar\s+BOW_FLAP_RATE_FAIL\s*=\s*(\d+)/,
      claimRes: [/BOW_FLAP_RATE_FAIL\s*[=:>]+\s*[`]?(\d+)/] },
    { name: 'GLISS_SLIDE_MAX_DUR_MS', source: 'public/js/constants.js',
      sourceRe: /\bGLISS_SLIDE_MAX_DUR_MS\s*=\s*(\d+)/,
      claimRes: [/GLISS_SLIDE_MAX_DUR_MS\s*[=:]\s*[`]?(\d+)/] },
    { name: 'PITCH_AXIS_DRIFT_THRESHOLD_PX', source: 'public/js/rolling-score.js',
      sourceRe: /PITCH_AXIS_DRIFT_THRESHOLD_PX\s*=\s*(\d+)/,
      claimRes: [/PITCH_AXIS_DRIFT_THRESHOLD_PX\s*[=:]\s*[`]?(\d+)/] },
    { name: 'PORTAMENTO_MS_PER_SEMITONE_C5', source: 'public/js/constants.js',
      sourceRe: /PORTAMENTO_MS_PER_SEMITONE\s*=\s*\{\s*5:\s*(\d+)/,
      claimRes: [/PORTAMENTO_MS_PER_SEMITONE[^}]*\b5:\s*(\d+)/] },
    { name: 'PORTAMENTO_MS_PER_SEMITONE_C6', source: 'public/js/constants.js',
      sourceRe: /PORTAMENTO_MS_PER_SEMITONE\s*=\s*\{\s*5:\s*\d+,\s*6:\s*(\d+)/,
      claimRes: [/PORTAMENTO_MS_PER_SEMITONE[^}]*\b6:\s*(\d+)/] },
    { name: 'PORTAMENTO_MS_PER_SEMITONE_C7', source: 'public/js/constants.js',
      sourceRe: /PORTAMENTO_MS_PER_SEMITONE\s*=\s*\{\s*5:\s*\d+,\s*6:\s*\d+,\s*7:\s*(\d+)/,
      claimRes: [/PORTAMENTO_MS_PER_SEMITONE[^}]*\b7:\s*(\d+)/] },
  ];

  const sources = new Map();
  for (const t of TRACKED) {
    if (!sources.has(t.source)) sources.set(t.source, readSafe(t.source));
  }

  const values = new Map();
  for (const t of TRACKED) {
    const src = sources.get(t.source);
    if (!src) { warn(`constant-sync: source ${t.source} missing — skipping ${t.name}`); continue; }
    const match = src.match(t.sourceRe);
    if (!match) { warn(`constant-sync: ${t.name} not found in ${t.source}`); continue; }
    values.set(t.name, { value: match[1], claimRes: t.claimRes });
  }

  const docs = liveDocs();

  let bad = 0;
  for (const path of docs) {
    const text = readSafe(path);
    if (!text) continue;
    const lines = text.split(/\r?\n/);
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      for (const [name, { value, claimRes }] of values.entries()) {
        for (const re of claimRes) {
          // Use a global flavor so we catch multiple claims on one line.
          const gre = new RegExp(re.source, 'g');
          let m;
          while ((m = gre.exec(line)) !== null) {
            const claimed = m[1];
            if (claimed === value) continue;
            // Tolerate trailing-zero variations only if numerically equal.
            if (parseFloat(claimed) === parseFloat(value)) continue;
            fail(`constant-sync: ${path}:${i + 1} ${name} cited as ${claimed} (source: ${value})`);
            console.error(`              line: ${line.trim().slice(0, 220)}`);
            bad++;
          }
        }
      }
    }
  }
  if (bad === 0) ok(`constant-sync: ${values.size} tracked constants match every value claim in docs`);
})();

process.exit(exitCode);
