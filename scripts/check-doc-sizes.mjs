#!/usr/bin/env node
// Doc size budget enforcement for CLAUDE.md.
//
// CLAUDE.md is auto-injected into every Claude Code conversation. Past 40 KB
// it crosses the harness's perf threshold and crowds out working context. The
// invariant tables in CLAUDE.md must remain summaries; full enforcement detail
// lives in docs/{bridge,dashboard}-invariants.md.
//
// See CLAUDE.md § Doc Maintenance "Size budget" for the rule.
//
// Exit codes:
//   0 — OK (warnings only are non-fatal)
//   1 — hard limit breached (file size or invariant row length)
//   2 — script error (target file missing, etc.)

import { readFileSync, statSync } from 'node:fs';
import { resolve } from 'node:path';

const FILE_HARD_BYTES = 40_000;
const FILE_WARN_BYTES = 36_000;
const ROW_HARD_CHARS  = 1_200;
const ROW_WARN_CHARS  = 800;

const TARGET = 'CLAUDE.md';
const abs = resolve(process.cwd(), TARGET);

let bytes;
try { bytes = statSync(abs).size; }
catch (e) {
  console.error(`[check:docs] cannot stat ${TARGET}: ${e.message}`);
  process.exit(2);
}

const filePct = ((bytes / FILE_HARD_BYTES) * 100).toFixed(1);
let exitCode = 0;

if (bytes > FILE_HARD_BYTES) {
  console.error(`[check:docs] FAIL  ${TARGET}: ${bytes} bytes (${filePct}% of ${FILE_HARD_BYTES} hard limit)`);
  console.error('              Compress invariant rows; full prose belongs in docs/{bridge,dashboard}-invariants.md.');
  exitCode = 1;
} else if (bytes > FILE_WARN_BYTES) {
  console.warn(`[check:docs] WARN  ${TARGET}: ${bytes} bytes (${filePct}% of ${FILE_HARD_BYTES} hard limit) — budget tightening`);
} else {
  console.log(`[check:docs] OK    ${TARGET}: ${bytes} bytes (${filePct}% of ${FILE_HARD_BYTES} hard limit)`);
}

// Per-row check on invariant table rows. Catches the bloat pattern at the
// row level before the whole file crosses the file limit. Invariant rows
// start with `| **` (the bold-name claim opener); other table rows (e.g.
// the Doc Maintenance file table) start with `| ` and are skipped.
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
    console.error(`[check:docs] FAIL  ${TARGET}:${i + 1} invariant row "${name}" is ${len} chars (>${ROW_HARD_CHARS} hard cap)`);
    console.error('              Compress to claim+where+log; move full prose to docs/{bridge,dashboard}-invariants.md.');
    failRows++;
  } else if (len > ROW_WARN_CHARS) {
    console.warn(`[check:docs] WARN  ${TARGET}:${i + 1} invariant row "${name}" is ${len} chars (>${ROW_WARN_CHARS} soft cap)`);
    warnRows++;
  }
}
if (failRows > 0) exitCode = 1;
if (longest.lineNo >= 0) {
  console.log(`[check:docs] longest invariant row: ${longest.len} chars at ${TARGET}:${longest.lineNo} ("${longest.name}")`);
}
if (warnRows === 0 && failRows === 0) {
  console.log(`[check:docs] OK    all invariant rows within the ${ROW_WARN_CHARS}/${ROW_HARD_CHARS} char budget`);
}

process.exit(exitCode);
