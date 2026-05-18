import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

// Static guard for portable dashboard settings and presets: relay routes,
// inline bootstrap in dashboard.html, push-side install in main.js, mirror
// allowlist drift between settings-sync.js and the inline HTML bootstrap, and
// the first preset preserving the current repo-tracked settings.
describe('Portable dashboard settings sync', () => {
  const root = process.cwd();
  const relay = readFileSync(join(root, 'relay.js'), 'utf8');
  const dashboardHtml = readFileSync(join(root, 'public', 'dashboard.html'), 'utf8');
  const main = readFileSync(join(root, 'public', 'js', 'main.js'), 'utf8');
  const mainCss = readFileSync(join(root, 'public', 'css', 'main.css'), 'utf8');
  const settingsSync = readFileSync(join(root, 'public', 'js', 'settings-sync.js'), 'utf8');
  const settingsFileRaw = readFileSync(join(root, 'data', 'dashboard-settings.json'), 'utf8');
  const presetsFileRaw = readFileSync(join(root, 'data', 'dashboard-presets.json'), 'utf8');

  it('ships parsable data dashboard settings and presets with the expected shape', () => {
    const parsed = JSON.parse(settingsFileRaw);
    expect(parsed).toMatchObject({ version: 1 });
    expect(parsed.settings).toBeTypeOf('object');
    expect(parsed.settings).not.toBeNull();

    const presets = JSON.parse(presetsFileRaw);
    expect(presets).toMatchObject({ version: 1 });
    expect(Array.isArray(presets.presets)).toBe(true);
    expect(presets.presets.length).toBeGreaterThan(0);
  });

  it('saves the current dashboard settings as the first persistent preset', () => {
    const current = JSON.parse(settingsFileRaw).settings;
    const presets = JSON.parse(presetsFileRaw);
    const first = presets.presets[0];
    expect(first.id).toBe(presets.activePresetId);
    expect(first.name).toBe('Current dashboard settings');
    for (const [key, value] of Object.entries(current)) {
      expect(first.settings[key]).toEqual(value);
    }
    expect(first.settings.cubeColorSettings).toContain('"kVertexColors"');
    const currentPalettes = JSON.parse(String(current.spectrumModalityPalettes));
    expect(first.settings.spectrumModalityPalettes).toContain(`"${currentPalettes[1][1]}"`);
    expect(first.settings.gyroSmoothing).toBe(String(current.gyroSmoothing));
    expect(first.settings.stillThreshold).toBe(String(current.stillThreshold));
  });

  it('exposes /api/dashboard-settings and /api/dashboard-presets with atomic writes', () => {
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

    expect(relay).toContain("urlPath === '/api/dashboard-presets'");
    expect(relay).toContain('getDashboardPresets(res)');
    expect(relay).toContain('saveDashboardPresets(req, res)');
    expect(relay).toContain('DASHBOARD_PRESETS_PATH');
    expect(relay).toContain('DASHBOARD_PRESETS_MAX_BYTES');
    expect(relay).toContain('fs.rename(tmp, DASHBOARD_PRESETS_PATH');
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
    expect(settingsSync).toContain("'/api/dashboard-presets'");
    expect(settingsSync).toContain('export async function fetchDashboardPresets');
    expect(settingsSync).toContain('export async function saveDashboardPreset');
    expect(settingsSync).toContain('export async function deleteDashboardPreset');
    expect(settingsSync).toContain('export async function saveActiveSettings');
    expect(settingsSync).toContain('setTimeout');
    expect(settingsSync).toContain('beforeunload');
    expect(settingsSync).toContain('navigator.sendBeacon');
  });

  it('wires the dashboard preset management panel to save/load/delete helpers', () => {
    expect(dashboardHtml).toContain('id="dashboardPresetsToggle"');
    expect(dashboardHtml).toContain('id="dashboardPresetsPanel"');
    expect(dashboardHtml).toContain('id="dashboardPresetSelect"');
    expect(dashboardHtml).toContain('id="dashboardPresetSaveNew"');
    expect(dashboardHtml).toContain('id="dashboardPresetUpdate"');
    expect(dashboardHtml).toContain('id="dashboardPresetLoad"');
    expect(mainCss).toContain('.dashboard-presets-panel');
    expect(main).toContain('function dashboardSettingsSnapshot()');
    expect(main).toContain('fetchDashboardPresets()');
    expect(main).toContain('saveDashboardPreset({');
    expect(main).toContain('deleteDashboardPreset(preset.id)');
    expect(main).toContain('writeActiveSettingsAndReload');
    expect(main).toContain('window.location.reload();');
  });

  it('persists dashboard motion controls through the same allowlist', () => {
    expect(settingsSync).toContain("'gyroSmoothing'");
    expect(settingsSync).toContain("'stillThreshold'");
    expect(dashboardHtml).toContain("'gyroSmoothing','stillThreshold'");
    expect(main).toContain("localStorage.setItem('gyroSmoothing'");
    expect(main).toContain("localStorage.setItem('stillThreshold'");
    expect(main).toContain("wsSend({ type: 'set_gyro_smoothing', value: currentGyroSmoothing })");
    expect(main).toContain("wsSend({ type: 'set_still_threshold', value: currentStillThreshold })");
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
