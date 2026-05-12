import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

// Static guard for the portable-settings round-trip wiring (relay GET/POST,
// inline bootstrap in dashboard.html, push-side install in main.js, mirror
// allowlist drift between settings-sync.js and the inline HTML bootstrap).
// This is the new file's invariant per CLAUDE.md recurring-bug discipline:
// the silent failure mode is one allowlist drifting from the other, leaving
// half the keys un-synced with no visible error at runtime.
describe('Portable dashboard settings sync', () => {
  const root = process.cwd();
  const relay = readFileSync(join(root, 'relay.js'), 'utf8');
  const dashboardHtml = readFileSync(join(root, 'public', 'dashboard.html'), 'utf8');
  const main = readFileSync(join(root, 'public', 'js', 'main.js'), 'utf8');
  const settingsSync = readFileSync(join(root, 'public', 'js', 'settings-sync.js'), 'utf8');
  const settingsFileRaw = readFileSync(join(root, 'data', 'dashboard-settings.json'), 'utf8');

  it('ships a parsable data/dashboard-settings.json with the expected shape', () => {
    const parsed = JSON.parse(settingsFileRaw);
    expect(parsed).toMatchObject({ version: 1 });
    expect(parsed.settings).toBeTypeOf('object');
    expect(parsed.settings).not.toBeNull();
  });

  it('exposes /api/dashboard-settings GET + POST in relay.js with atomic write', () => {
    expect(relay).toContain("urlPath === '/api/dashboard-settings'");
    expect(relay).toContain('getDashboardSettings(res)');
    expect(relay).toContain('saveDashboardSettings(req, res)');
    expect(relay).toContain('DASHBOARD_SETTINGS_PATH');
    expect(relay).toContain('DASHBOARD_SETTINGS_MAX_BYTES');
    // Atomic write via temp file + rename; reject oversize / malformed bodies.
    expect(relay).toContain('.tmp');
    expect(relay).toContain('fs.rename(tmp, DASHBOARD_SETTINGS_PATH');
    expect(relay).toContain('413');
    expect(relay).toContain('400');
    expect(relay).toContain('405');
  });

  it('runs the bootstrap synchronously in dashboard.html BEFORE main.js loads', () => {
    const bootstrapIdx = dashboardHtml.indexOf("xhr.open('GET', '/api/dashboard-settings', false)");
    const mainIdx = dashboardHtml.indexOf("./js/main.js");
    expect(bootstrapIdx).toBeGreaterThan(-1);
    expect(mainIdx).toBeGreaterThan(-1);
    expect(bootstrapIdx).toBeLessThan(mainIdx);
  });

  it('installs the push side from main.js', () => {
    expect(main).toContain("from './settings-sync.js'");
    expect(main).toContain('installSettingsSync()');
  });

  it('debounces POSTs and flushes pending writes on unload via sendBeacon', () => {
    expect(settingsSync).toContain('export const SYNCED_KEYS');
    expect(settingsSync).toContain('export function install');
    expect(settingsSync).toContain("'/api/dashboard-settings'");
    expect(settingsSync).toContain('setTimeout');
    expect(settingsSync).toContain('beforeunload');
    expect(settingsSync).toContain('navigator.sendBeacon');
  });

  it('mirror: dashboard.html ALLOWED list matches settings-sync.js SYNCED_KEYS exactly', () => {
    // Pull SYNCED_KEYS from settings-sync.js — single string literal block.
    const syncedMatch = settingsSync.match(/SYNCED_KEYS\s*=\s*new Set\(\[([\s\S]*?)\]\)/);
    expect(syncedMatch, 'SYNCED_KEYS block must be present').not.toBeNull();
    const synced = [...syncedMatch![1].matchAll(/'([^']+)'/g)].map((m) => m[1]).sort();

    // Pull ALLOWED list from the inline bootstrap in dashboard.html.
    const allowedMatch = dashboardHtml.match(/var ALLOWED = \[([\s\S]*?)\];/);
    expect(allowedMatch, 'ALLOWED list must be present').not.toBeNull();
    const allowed = [...allowedMatch![1].matchAll(/'([^']+)'/g)].map((m) => m[1]).sort();

    expect(allowed).toEqual(synced);
    expect(synced.length).toBeGreaterThan(0);
  });
});
