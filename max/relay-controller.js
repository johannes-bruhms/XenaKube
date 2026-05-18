// Node-for-Max controller for relay.js. Loaded by
// `node.script relay-controller.js` in xenakube_swam.maxpat.
//
// Important workflow boundary:
// - `script start` starts this controller only.
// - `relay` / `start relay` starts relay.js as a child process.
// - `kill process` runs the port-3000 kill from inside Max.

const path = require('path');
const http = require('http');
const { exec, execFile, spawn, spawnSync } = require('child_process');

let Max;
try {
  Max = require('max-api');
} catch (e) {
  Max = { post: (...a) => console.log('[relay-controller]', ...a) };
}

const projectRoot = path.resolve(__dirname, '..');
process.chdir(projectRoot);

const RELAY_PORT = 3000;
const DASHBOARD_URL = 'http://localhost:3000';
const STOP_GRACE_MS = 1500;
let relayChild = null;
let relayAddressInUse = false;
let browserOpenTimer = null;
let stopForceTimer = null;
let controllerExiting = false;

Max.post('relay-controller: cwd=' + process.cwd());
Max.post('relay-controller: ready - send "relay" to start, "kill process" to free port 3000');

function postLines(prefix, text) {
  String(text || '')
    .split(/\r?\n/)
    .filter(Boolean)
    .forEach(line => Max.post(prefix + line));
}

function clearStopForceTimer() {
  if (stopForceTimer) {
    clearTimeout(stopForceTimer);
    stopForceTimer = null;
  }
}

function isAddressInUseText(text) {
  return /EADDRINUSE|address already in use/i.test(String(text || ''));
}

function markAddressInUse(text) {
  relayAddressInUse = true;
  if (browserOpenTimer) {
    clearTimeout(browserOpenTimer);
    browserOpenTimer = null;
  }
  Max.post(`relay-controller: port ${RELAY_PORT} is already in use; relay.js did not bind`);
  Max.post('relay-controller: send "kill process" to this node.script, then send "relay" again');
  if (text) postLines('relay-controller: ', text);
}

function openInDefaultBrowser(url) {
  const cmd = process.platform === 'win32' ? `start "" "${url}"`
            : process.platform === 'darwin' ? `open "${url}"`
            : `xdg-open "${url}"`;
  exec(cmd, (err) => {
    if (err) Max.post('relay-controller: browser-open failed - ' + err.message);
    else Max.post('relay-controller: opened ' + url);
  });
}

function scheduleBrowserOpen() {
  if (browserOpenTimer) clearTimeout(browserOpenTimer);
  browserOpenTimer = setTimeout(() => {
    browserOpenTimer = null;
    if (!relayChild || relayAddressInUse) return;
    openInDefaultBrowser(DASHBOARD_URL);
  }, 900);
}

function startRelay() {
  if (relayChild) {
    Max.post(`relay-controller: relay already running pid=${relayChild.pid}`);
    return;
  }

  relayAddressInUse = false;
  Max.post('relay-controller: starting relay.js');

  relayChild = spawn(process.execPath, ['relay.js'], {
    cwd: projectRoot,
    windowsHide: true,
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  Max.post(`relay-controller: relay child pid=${relayChild.pid}`);
  scheduleBrowserOpen();

  relayChild.stdout.on('data', (buf) => {
    const text = String(buf);
    postLines('relay: ', text);
  });

  relayChild.stderr.on('data', (buf) => {
    const text = String(buf);
    if (isAddressInUseText(text)) markAddressInUse(text);
    else postLines('relay ERR: ', text);
  });

  relayChild.on('error', (err) => {
    if (isAddressInUseText(err && err.message)) markAddressInUse(err.message);
    else Max.post('relay-controller: relay child error - ' + (err && err.message));
  });

  relayChild.on('exit', (code, signal) => {
    const wasAddressInUse = relayAddressInUse;
    relayChild = null;
    clearStopForceTimer();
    if (browserOpenTimer) {
      clearTimeout(browserOpenTimer);
      browserOpenTimer = null;
    }
    if (wasAddressInUse) {
      Max.post('relay-controller: relay child exited after port conflict');
    } else {
      Max.post(`relay-controller: relay child exited code=${code} signal=${signal || '-'}`);
    }
  });
}

function requestRelayShutdown(reason, cb) {
  const body = JSON.stringify({ reason });
  const req = http.request({
    hostname: '127.0.0.1',
    port: RELAY_PORT,
    path: '/api/shutdown',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(body),
    },
    timeout: 700,
  }, (res) => {
    res.resume();
    res.on('end', () => cb(null, res.statusCode));
  });
  req.on('timeout', () => req.destroy(new Error('shutdown request timed out')));
  req.on('error', cb);
  req.end(body);
}

function forceKillRelayChild(reason) {
  if (!relayChild || !relayChild.pid) return false;
  const pid = relayChild.pid;
  Max.post(`relay-controller: force killing relay child pid=${pid} (${reason})`);
  if (process.platform === 'win32') {
    execFile('taskkill.exe', ['/PID', String(pid), '/T', '/F'], { windowsHide: true }, (err, stdout, stderr) => {
      if (err) Max.post('relay-controller: taskkill relay child failed - ' + err.message);
      if (stdout) postLines('relay-controller: ', stdout);
      if (stderr) postLines('relay-controller: ', stderr);
    });
  } else {
    try { relayChild.kill('SIGKILL'); }
    catch (e) { Max.post('relay-controller: SIGKILL relay child failed - ' + e.message); }
  }
  return true;
}

function stopRelay() {
  if (!relayChild) {
    Max.post('relay-controller: relay child is not running');
    return;
  }
  Max.post(`relay-controller: stopping relay child pid=${relayChild.pid}`);
  requestRelayShutdown('max stop relay', (err, statusCode) => {
    if (err || statusCode !== 202) {
      Max.post('relay-controller: graceful relay shutdown failed - ' + (err ? err.message : `HTTP ${statusCode}`));
      forceKillRelayChild('graceful stop failed');
    } else {
      Max.post('relay-controller: relay accepted graceful shutdown');
    }
  });
  clearStopForceTimer();
  stopForceTimer = setTimeout(() => {
    stopForceTimer = null;
    forceKillRelayChild('stop relay timeout');
  }, STOP_GRACE_MS);
}

function killRelayPortProcess() {
  Max.post(`relay-controller: killing listener on TCP port ${RELAY_PORT}`);
  forceKillRelayChild('kill process');

  if (process.platform === 'win32') {
    const ps = [
      `$connections = @(Get-NetTCPConnection -LocalPort ${RELAY_PORT} -State Listen -ErrorAction SilentlyContinue)`,
      'if ($connections.Count -eq 0) { Write-Output "NO_PROCESS"; exit 0 }',
      '$connections | ForEach-Object {',
      '  $pidToKill = $_.OwningProcess',
      '  Stop-Process -Id $_.OwningProcess -Force',
      '  Write-Output "KILLED:$pidToKill"',
      '}',
    ].join('; ');

    execFile(
      'powershell.exe',
      ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', ps],
      (err, stdout, stderr) => reportKillResult(err, stdout, stderr),
    );
    return;
  }

  const sh = [
    `pids=$(lsof -ti tcp:${RELAY_PORT} -sTCP:LISTEN 2>/dev/null)`,
    'if [ -z "$pids" ]; then echo NO_PROCESS; exit 0; fi',
    'for pid in $pids; do kill -TERM "$pid" && echo KILLED:$pid; done',
  ].join('; ');
  exec(sh, (err, stdout, stderr) => reportKillResult(err, stdout, stderr));
}

function reportKillResult(err, stdout, stderr) {
  if (err) {
    Max.post('relay-controller: kill process failed - ' + err.message);
    if (stderr) postLines('relay-controller: ', stderr);
    return;
  }

  const out = String(stdout || '').trim();
  if (!out || out === 'NO_PROCESS') {
    Max.post(`relay-controller: no listener found on port ${RELAY_PORT}`);
    return;
  }

  for (const line of out.split(/\r?\n/).filter(Boolean)) {
    if (line.startsWith('KILLED:')) {
      Max.post(`relay-controller: killed process ${line.slice(7)} on port ${RELAY_PORT}`);
      relayAddressInUse = false;
    } else {
      Max.post('relay-controller: ' + line);
    }
  }
}

function cleanupRelayChildOnControllerExit() {
  if (controllerExiting) return;
  controllerExiting = true;
  if (browserOpenTimer) {
    clearTimeout(browserOpenTimer);
    browserOpenTimer = null;
  }
  clearStopForceTimer();
  if (!relayChild || !relayChild.pid) return;
  const pid = relayChild.pid;
  Max.post(`relay-controller: controller exiting; killing relay child pid=${pid}`);
  if (process.platform === 'win32') {
    spawnSync('taskkill.exe', ['/PID', String(pid), '/T', '/F'], { windowsHide: true });
  } else {
    try { process.kill(pid, 'SIGTERM'); } catch (e) { /* noop */ }
  }
}

process.once('exit', cleanupRelayChildOnControllerExit);
for (const signal of ['SIGINT', 'SIGTERM', 'SIGHUP']) {
  process.once(signal, () => {
    cleanupRelayChildOnControllerExit();
    process.exit(0);
  });
}

if (typeof Max.addHandler === 'function') {
  Max.addHandler('relay', startRelay);
  Max.addHandler('start_relay', startRelay);
  Max.addHandler('start-relay', startRelay);
  Max.addHandler('start', (...args) => {
    const target = String(args[0] || '').toLowerCase();
    if (!target || target === 'relay') startRelay();
    else Max.post('relay-controller: unknown start target; send "relay" or "start relay"');
  });

  Max.addHandler('stop_relay', stopRelay);
  Max.addHandler('stop-relay', stopRelay);
  Max.addHandler('stop', (...args) => {
    const target = String(args[0] || '').toLowerCase();
    if (!target || target === 'relay') stopRelay();
    else Max.post('relay-controller: unknown stop target; send "stop relay"');
  });

  Max.addHandler('kill_process', killRelayPortProcess);
  Max.addHandler('kill-process', killRelayPortProcess);
  Max.addHandler('kill', (...args) => {
    if (String(args[0] || '').toLowerCase() === 'process') {
      killRelayPortProcess();
      return;
    }
    Max.post('relay-controller: unknown kill target; send "kill process"');
  });
}
