// settings-sync.js
//
// Mirrors the dashboard's persisted localStorage keys to a project-tracked
// JSON file via two relay routes (GET/POST /api/dashboard-settings) so
// settings travel with the repo across machines instead of being trapped in
// per-browser Chrome User Data. Recovery story: when Chrome state is lost in
// a migration, opening the dashboard on the new machine reads the file at
// boot and reseeds localStorage with the last-saved values.
//
// Bootstrap-from-server happens via a synchronous inline XHR in
// public/dashboard.html BEFORE this module loads, so by the time main.js
// reads localStorage at module-init time, the file's values are already in
// place. This module owns the push side: a monkey-patch on
// localStorage.setItem/removeItem schedules a debounced POST of the full
// allowlist after every change touching a synced key.
//
// SYNCED_KEYS is an explicit allowlist. Adding a new persisted setting?
// Append the key here AND add the matching ALLOWED entry in the bootstrap
// script inside `public/dashboard.html`. Non-listed keys (e.g. ganMacAddress,
// which is intentionally one-shot) are not synced.

export const SYNCED_KEYS = new Set([
  'uiHidden',
  'scoreSpeed',
  'midiBrushEnabled',
  'spectrogramEnabled',
  'spectrumLatencyMs',
  'spectrumNudgeMs',
  'spectrumGainDb',
  'spectrumCeilingDb',
  'spectrumFloorDb',
  'spectrumBgPct',
  'spectrumBgColor',
  'spectrumCeilingColor',
  'spectrumSmoothPct',
  'spectrumBlurTenths',
  'spectrumTimePct',
  'spectrumPalette',
  'spectrumModalityPalettes',
  'spectrumModalityTransfer',
  'cubeColorSettings',
  'ghostSize',
  'cubeDepth',
  'quality',
  'recordMode',
  'mandalaEnabled',
]);

const DEBOUNCE_MS = 800;
const ENDPOINT = '/api/dashboard-settings';

let pendingTimer = null;
let installed = false;

function gather() {
  const out = {};
  for (const key of SYNCED_KEYS) {
    const v = localStorage.getItem(key);
    if (v !== null) out[key] = v;
  }
  return out;
}

async function push() {
  pendingTimer = null;
  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ version: 1, settings: gather() }),
    });
    if (!res.ok) {
      console.warn('[settings-sync] push rejected', res.status, await res.text().catch(() => ''));
    }
  } catch (err) {
    console.warn('[settings-sync] push failed:', err);
  }
}

function schedulePush() {
  if (pendingTimer != null) clearTimeout(pendingTimer);
  pendingTimer = setTimeout(push, DEBOUNCE_MS);
}

export function install() {
  if (installed) return;
  installed = true;
  const origSet = localStorage.setItem.bind(localStorage);
  const origRemove = localStorage.removeItem.bind(localStorage);
  localStorage.setItem = function (key, value) {
    origSet(key, value);
    if (SYNCED_KEYS.has(key)) schedulePush();
  };
  localStorage.removeItem = function (key) {
    origRemove(key);
    if (SYNCED_KEYS.has(key)) schedulePush();
  };
  window.addEventListener('beforeunload', () => {
    if (pendingTimer != null) {
      clearTimeout(pendingTimer);
      pendingTimer = null;
      try {
        navigator.sendBeacon(ENDPOINT, new Blob(
          [JSON.stringify({ version: 1, settings: gather() })],
          { type: 'application/json' },
        ));
      } catch {}
    }
  });
}
