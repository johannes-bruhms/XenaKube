#!/usr/bin/env node
// Verify that repo-local AGENTS.md files cover the live files and workflows
// they claim to guide. This is intentionally a drift check, not a generator:
// when it fails, update the nearest AGENTS.md with the new rule/role/test.

import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = process.cwd();
const toPosix = (p) => p.replace(/\\/g, '/');
const read = (p) => readFileSync(join(ROOT, p), 'utf8').replace(/\r\n/g, '\n');

let failures = 0;

function fail(msg) {
  failures++;
  console.error(`[check:agents] FAIL ${msg}`);
}

function ok(msg) {
  console.log(`[check:agents] OK   ${msg}`);
}

function assertFile(path) {
  if (!existsSync(join(ROOT, path))) fail(`missing required guide/file: ${path}`);
}

function assertMentions(text, docPath, token, reason) {
  if (!text.includes(token)) {
    fail(`${docPath} must mention \`${token}\` (${reason})`);
  }
}

function filesIn(dir, predicate = () => true) {
  return readdirSync(join(ROOT, dir), { withFileTypes: true })
    .filter((entry) => entry.isFile() && predicate(entry.name))
    .map((entry) => toPosix(join(dir, entry.name)))
    .sort();
}

function filesRecursive(dir, predicate = () => true) {
  const out = [];
  const walk = (subdir) => {
    for (const entry of readdirSync(join(ROOT, subdir), { withFileTypes: true })) {
      const path = toPosix(join(subdir, entry.name));
      if (entry.isDirectory()) {
        walk(path);
      } else if (entry.isFile() && predicate(path)) {
        out.push(path);
      }
    }
  };
  walk(dir);
  return out.sort();
}

const agentPaths = [
  'AGENTS.md',
  'src/AGENTS.md',
  'public/AGENTS.md',
  'max/AGENTS.md',
  'docs/AGENTS.md',
];

for (const path of agentPaths) assertFile(path);

const rootAgents = read('AGENTS.md');
const srcAgents = read('src/AGENTS.md');
const publicAgents = read('public/AGENTS.md');
const maxAgents = read('max/AGENTS.md');
const docsAgents = read('docs/AGENTS.md');
const allAgents = agentPaths.map(read).join('\n');

// The root guide must stay aware of every subtree guide.
for (const path of agentPaths.slice(1)) {
  assertMentions(rootAgents, 'AGENTS.md', path, 'subtree AGENTS.md discovery');
}

const requiredSyncTriggers = [
  'Repo shape',
  'Subtree scope',
  'Durable docs',
  'Commands',
  'Source-of-truth files',
  'Engine semantics',
  'OSC payloads',
  'Dashboard architecture',
  'Max bridge',
  'Cross-surface assumptions',
  'Tests and verification',
  'Recurring-bug/invariant discipline',
];

for (const trigger of requiredSyncTriggers) {
  assertMentions(rootAgents, 'AGENTS.md', trigger, 'AGENTS sync trigger list');
}

// Package scripts are contributor-facing commands; root AGENTS.md must expose
// them so future agents run the same project checks humans expect.
const pkg = JSON.parse(read('package.json'));
for (const scriptName of Object.keys(pkg.scripts ?? {}).sort()) {
  const command = scriptName === 'test' ? 'npm test' : `npm run ${scriptName}`;
  assertMentions(rootAgents, 'AGENTS.md', command, 'package.json script');
}
for (const command of ['npx tsc --noEmit', 'npx tsx relay.js']) {
  assertMentions(rootAgents, 'AGENTS.md', command, 'non-package command');
}

// Top-level durable docs should have a role in both root and docs guides.
const topLevelDocs = filesIn('docs', (name) => name.endsWith('.md') && name !== 'AGENTS.md');
for (const path of topLevelDocs) {
  const base = path.split('/').pop();
  assertMentions(rootAgents, 'AGENTS.md', path, 'documentation ownership');
  assertMentions(docsAgents, 'docs/AGENTS.md', base, 'documentation role');
}

// Every source file gets at least a concise role in src/AGENTS.md. That makes
// new durable engine modules impossible to add silently.
const srcFiles = filesIn('src', (name) => name.endsWith('.ts'));
for (const path of srcFiles) {
  const base = path.split('/').pop();
  assertMentions(srcAgents, 'src/AGENTS.md', base, 'src file role');
}

// Dashboard has no bundler; module/file names are the architecture.
const publicFiles = [
  ...filesIn('public', (name) => name.endsWith('.html')),
  ...filesRecursive('public/js', (path) => path.endsWith('.js')),
  ...filesRecursive('public/css', (path) => path.endsWith('.css')),
].sort();
for (const path of publicFiles) {
  const rel = toPosix(relative(join(ROOT, 'public'), join(ROOT, path)));
  assertMentions(publicAgents, 'public/AGENTS.md', rel, 'dashboard file/module role');
}

// Max files are easy to confuse with the active bridge; max/AGENTS.md must say
// which files are runtime surfaces and which are support/reference artifacts.
const maxFiles = filesIn('max', (name) => name !== 'AGENTS.md');
for (const path of maxFiles) {
  const base = path.split('/').pop();
  assertMentions(maxAgents, 'max/AGENTS.md', base, 'max file role');
}

// Targeted tests should remain discoverable from some guide.
const testFiles = filesIn('test', (name) => name.endsWith('.test.ts'));
for (const path of testFiles) {
  const base = path.split('/').pop();
  assertMentions(allAgents, 'AGENTS.md files', base, 'targeted test coverage');
}

if (failures > 0) {
  console.error(`[check:agents] ${failures} sync issue(s). Update the nearest AGENTS.md or adjust this check when a file is intentionally out of scope.`);
  process.exit(1);
}

ok(`${agentPaths.length} AGENTS.md files present`);
ok(`${Object.keys(pkg.scripts ?? {}).length} package scripts documented`);
ok(`${topLevelDocs.length} top-level docs documented`);
ok(`${srcFiles.length} src files documented`);
ok(`${publicFiles.length} public files documented`);
ok(`${maxFiles.length} max files documented`);
ok(`${testFiles.length} test files documented`);
