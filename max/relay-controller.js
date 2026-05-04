// Node-for-Max wrapper for relay.js. Loaded by `node.script relay-controller.js`
// in xenakube_swam.maxpat. CWD set to project root because relay.js was
// originally invoked as `npx tsx relay.js` from there.

const path = require('path');
const { exec } = require('child_process');

let Max;
try {
  Max = require('max-api');
} catch (e) {
  Max = { post: (...a) => console.log('[relay-controller]', ...a) };
}

const projectRoot = path.resolve(__dirname, '..');
process.chdir(projectRoot);

Max.post('relay-controller: cwd=' + process.cwd());

const DASHBOARD_URL = 'http://localhost:3000';

function openInDefaultBrowser(url) {
  // Delay so relay's HTTP listen() callback has time to fire before Chrome
  // connects — otherwise the first GET races the bind and gets ECONNREFUSED.
  setTimeout(() => {
    const cmd = process.platform === 'win32' ? `start "" "${url}"`
              : process.platform === 'darwin' ? `open "${url}"`
              : `xdg-open "${url}"`;
    exec(cmd, (err) => {
      if (err) Max.post('relay-controller: browser-open failed — ' + err.message);
      else Max.post('relay-controller: opened ' + url);
    });
  }, 700);
}

try {
  require('../relay');
  Max.post('relay-controller: relay.js loaded — ' + DASHBOARD_URL);
  openInDefaultBrowser(DASHBOARD_URL);
} catch (e) {
  Max.post('relay-controller FAILED: ' + (e && e.message));
  if (e && e.stack) e.stack.split('\n').forEach(l => Max.post(l));
}
