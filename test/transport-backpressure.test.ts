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
    expect(relay).toContain('let latestAudibleComplex = 0;');
    expect(relay).toContain('function activeComplexForSpectrum()');
    expect(relay).toContain('rawComplex >= 1 && rawComplex <= 8 ? rawComplex : activeComplexForSpectrum()');
    expect(relay).toContain("data.kind === 'noteon' && data.complex >= 1 && data.complex <= 8");
    expect(relay).toContain('[SPECTRUM] dropped');
    expect(transport).toContain('spectrumFrame: []');
    expect(transport).toContain("case 'spectrum_frame':");
    expect(transport).toContain("case 'spectrum_status':");
  });

  it('drops browser gyro mirrors under outbound pressure without dropping moves', () => {
    expect(transport).toContain('OUTBOUND_GYRO_DROP_BYTES');
    expect(transport).toContain("obj?.type === 'gyro'");
    expect(transport).toContain("return false;");
    expect(transport).toContain('export function isOpen()');
    expect(transport).not.toContain("obj?.type === 'move'");
  });

  it('keeps Bluetooth cube event ingestion from failing silently', () => {
    const main = read('public', 'js', 'main.js');
    expect(main).toContain('function cubeEventQuaternion(event)');
    expect(main).toContain('event?.quaternion');
    expect(main).toContain('event?.gyro?.quaternion');
    expect(main).toContain('event?.gyro');
    expect(main).toContain('function cubeGyroPayload(q, event)');
    expect(main).toContain('function queueCubeGyroForRelay(payload)');
    expect(main).toContain("flushPendingCubeGyroToRelay('pre-move')");
    expect(main).toContain('isOpen  as transportIsOpen');
    expect(main).toContain('function updateCubeConnectAvailability');
    expect(main).toContain('function invalidateCubeSessionForRelayClose()');
    expect(main).toContain('[CUBE RELAY OFFLINE]');
    expect(main).toContain('node.script relay-controller.js');
    expect(main).toContain("moveEnvelope.gyro = pendingCubeGyroPayload.data");
    expect(main).toContain("moveEnvelope.gyroInlineReason = 'pre-move-flush-failed'");
    expect(main).toMatch(/transportOn\('gyroTick', \(data, dev\) => \{\s*relayGyroTickCount\+\+;\s*cubeScene\.setCubeQuat\(data\);/);
    expect(main).not.toContain('function isDirectCubePreviewFresh()');
    expect(main).not.toContain('relayGyroTicksSuppressed');
    expect(main).not.toContain('CUBE_DIRECT_PREVIEW_FRESH_MS');
    expect(main).toContain("sendZeroGyroToRelay('auto-zero')");
    expect(main).toContain("flushPendingCubeGyroToRelay(`pre-zero:${reason}`)");
    expect(main).toContain('requestCubeFacelets(cube, \'connect\')');
    expect(main).toContain('requestCubeFacelets(cube, \'gyro-stale\')');
    expect(main).toContain("await cube.sendCubeCommand({ type: 'REQUEST_FACELETS' });");
    expect(main).toContain("'REQUEST_FACELETS'");
    expect(main).not.toContain("'REQUEST_HARDWARE'");
    expect(main).not.toContain("'REQUEST_BATTERY'");
    expect(main).toContain('[CUBE STREAM FAIL]');
    expect(main).toContain('[CUBE GYRO FAIL]');
    expect(main).toContain('[CUBE GYRO FORWARD FAIL]');
    expect(main).toContain('[CUBE GYRO STALE]');
    expect(main).toContain('[CUBE MOVE FAIL]');

    expect(relay).toContain('function extractGyroQuaternion(payload)');
    expect(relay).toContain('payload?.quaternion');
    expect(relay).toContain('payload?.gyro?.quaternion');
    expect(relay).toContain('payload?.gyro');
    expect(relay).toContain('const invNorm = 1 / Math.sqrt(norm2);');
    expect(relay).toContain('function handleBleGyroPayload(payload, source = \'gyro\')');
    expect(relay).toContain("handleBleGyroPayload(data.data, 'gyro')");
    expect(relay).toContain("handleBleGyroPayload(data.gyro, data.gyroInlineReason || 'move-inline')");
    expect(relay).toContain('[BLE GYRO DROP]');
  });

  it('binds HTTP/WS to loopback by default (unauthenticated control surface)', () => {
    expect(relay).toContain("RELAY_HOST = process.env.XK_BIND_HOST || '127.0.0.1'");
    expect(relay).toContain('server.listen(3000, RELAY_HOST');
    // No bare server.listen(3000, () => ...) that bypasses the host arg.
    expect(relay).not.toMatch(/server\.listen\(3000,\s*\(/);
  });

  it('shuts the relay down through one immediate lifecycle path', () => {
    expect(relay).toContain('function gracefulShutdown');
    expect(relay).toContain('const SHUTDOWN_DELAY_MS = Math.max(0, Number(process.env.XK_SHUTDOWN_DELAY_MS ?? 0) || 0)');
    expect(relay).not.toContain('const SHUTDOWN_DELAY = 5000');
    expect(relay).toContain("scheduleShutdown('last browser client disconnected')");
    expect(relay).toContain('sendShutdownPanic();');
    expect(relay).toContain('gyroLoopRunning = false;');
    expect(relay).toContain('clearInterval(bleRateInterval)');
    expect(relay).toContain('midiEchoServer.close()');
    expect(relay).toContain("process.once(signal, () => gracefulShutdown(signal))");
    expect(relay).toContain("urlPath === '/api/shutdown'");
    expect(relay).toContain('shutdownViaHttp(req, res)');
    expect(relay).toContain('shutdown is loopback-only');
  });

  it('does not reconnect the dashboard WebSocket while the page is unloading', () => {
    expect(transport).toContain('let lifecycleClosing = false;');
    expect(transport).toContain('function closeForPageLifecycle()');
    expect(transport).toContain('lifecycleClosing = true;');
    expect(transport).toContain("ws.close(1001, 'page lifecycle')");
    expect(transport).toContain("window.addEventListener('pagehide', closeForPageLifecycle");
    expect(transport).toContain("window.addEventListener('beforeunload', closeForPageLifecycle");
    expect(transport).toContain('if (lifecycleClosing) return;');
    expect(transport).toContain('scheduleReconnect();');
  });
});
