import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

function read(...parts: string[]): string {
  return readFileSync(join(process.cwd(), ...parts), 'utf8');
}

describe('Live transport backpressure guards', () => {
  const relay = read('relay.js');
  const transport = read('public', 'js', 'transport.js');

  it('drops stale server-to-dashboard gyro frames before they queue', () => {
    expect(relay).toContain('WS_BACKPRESSURE_DROP_BYTES');
    expect(relay).toContain('function sendWs');
    expect(relay).toContain("kind: 'gyro_tick', lowPriority: true, dropIfBuffered: true");
    expect(relay).toContain("kind: isGyro ? 'gyro_state' : 'state', lowPriority: isGyro");
    expect(relay).toContain('[WS BACKPRESSURE]');
    expect(relay).toContain('[RELAY LAG WARN]');
  });

  it('gates actual-audio spectrum frames and forwards them as low-priority visual data', () => {
    expect(relay).toContain('SPECTRUM_FRAME_MIN_ATOMS');
    expect(relay).toContain('OSC.SPECTRUM_FRAME');
    expect(relay).toContain("data.type === 'set_spectrum_enabled'");
    expect(relay).toContain('_xkSpectrumEnabled');
    expect(relay).toContain("kind: 'spectrum_frame', lowPriority: true, dropIfBuffered: true");
    expect(relay).toContain('[SPECTRUM] dropped');
    expect(transport).toContain('spectrumFrame: []');
    expect(transport).toContain("case 'spectrum_frame':");
    expect(transport).toContain("case 'spectrum_status':");
  });

  it('drops browser gyro mirrors under outbound pressure without dropping moves', () => {
    expect(transport).toContain('OUTBOUND_GYRO_DROP_BYTES');
    expect(transport).toContain("obj?.type === 'gyro'");
    expect(transport).toContain("return false;");
    expect(transport).not.toContain("obj?.type === 'move'");
  });
});
