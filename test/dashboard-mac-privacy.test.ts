import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

function read(...parts: string[]): string {
  return readFileSync(join(process.cwd(), ...parts), 'utf8');
}

describe('Dashboard MAC privacy guard', () => {
  const dashboard = read('public', 'dashboard.html');
  const monolith = read('public', 'dashboard.v1-monolith.html');
  const main = read('public', 'js', 'main.js');
  const relay = read('relay.js');
  const all = [dashboard, monolith, main, relay].join('\n');

  it('does not ship the old cube MAC address anywhere in served surfaces', () => {
    expect(all).not.toContain('AB:12:34:5E:83:F7');
    expect(all).not.toContain('Prefilled with your real MAC');
  });

  it('does not persist cube MAC addresses to localStorage', () => {
    // dashboard.html may carry a `value=` default for the active development cube
    // (convenience over privacy — accepted trade-off); the monolith keeps the
    // no-prefill guard since it's a reference snapshot, not the live UI.
    expect(dashboard).toContain('placeholder="cube MAC address"');
    expect(monolith).toContain('placeholder="cube MAC address"');
    expect(monolith).not.toMatch(/id="macAddress"[^>]*\bvalue=/);
    expect(main).toContain("localStorage.removeItem('ganMacAddress')");
    expect(monolith).toContain("localStorage.removeItem('ganMacAddress')");
    expect(main).not.toContain("localStorage.setItem('ganMacAddress'");
    expect(monolith).not.toContain("localStorage.setItem('ganMacAddress'");
  });
});
