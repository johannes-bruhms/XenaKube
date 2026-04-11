// Register tsx so we can require TypeScript modules directly
require('tsx/cjs');

const { Client } = require('node-osc');
const WebSocket = require('ws');
const http = require('http');
const fs = require('fs');
const path = require('path');
const { XenaKubeEngine, stateToOsc, getBuiltinDiagrams } = require('./src/index.ts');

/*
   GAN Cube Live Performance Bridge - macOS FIXED (v2)
   Uses official customMacAddressProvider (no spoofing needed)
   Library now ignores device.id and uses this method
   Prefilled with your real MAC (AB:12:34:5E:83:F7)
*/

// === XenaKube Engine ===
const engine = new XenaKubeEngine();

// === OSC Clients ===
const oscSC  = new Client('127.0.0.1', 57120);  // SuperCollider — receives /xk/* engine state
const oscTD  = new Client('127.0.0.1', 8000);   // TouchDesigner — receives raw /gan/* + /xk/gyro

// Track last move for dashboard broadcast
let lastMove = null;

// Forward engine state over OSC on every state change + broadcast to dashboard
engine.onState((state) => {
  const msgs = stateToOsc(state);
  for (const msg of msgs) {
    oscSC.send(msg.address, ...msg.args);
  }

  // Broadcast state to all dashboard WS clients
  broadcastState(state, lastMove);
  lastMove = null; // clear after broadcast
});

/** Broadcast engine state to all connected WS clients */
function broadcastState(state, move) {
  const isGyro = move === null;
  const payload = JSON.stringify({
    type: isGyro ? 'gyro_state' : 'state',
    data: state,
    move: move || undefined,
  });
  wss?.clients?.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  });
}

// Load dashboard HTML (single page: connect + live visualization)
const DASHBOARD_PATH = path.join(__dirname, 'public', 'dashboard.html');
let DASHBOARD_HTML = '';
try {
  DASHBOARD_HTML = fs.readFileSync(DASHBOARD_PATH, 'utf-8');
} catch (e) {
  console.warn('Dashboard not found at', DASHBOARD_PATH);
}

// 1. HTTP Server
const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(DASHBOARD_HTML);
});

server.listen(3000, () => {
    console.log("--------------------------------------------------");
    console.log("  OPEN CHROME → http://localhost:3000");
    console.log("--------------------------------------------------");
});

// 2. OSC status
console.log("2. OSC → SuperCollider on port 57120, TouchDesigner on port 8000");

// 3. WebSocket Server
const wss = new WebSocket.Server({ server });
console.log("3. Waiting for browser...");

// Auto-shutdown when all browser clients disconnect
let shutdownTimer = null;
const SHUTDOWN_DELAY = 5000; // 5s grace period for page refresh

function scheduleShutdown() {
  if (wss.clients.size === 0) {
    console.log(`All clients disconnected. Shutting down in ${SHUTDOWN_DELAY / 1000}s (reconnect to cancel)...`);
    shutdownTimer = setTimeout(() => {
      if (wss.clients.size === 0) {
        console.log("No clients reconnected. Shutting down.");
        oscSC.close();
        oscTD.close();
        wss.close();
        server.close();
        process.exit(0);
      }
    }, SHUTDOWN_DELAY);
  }
}

wss.on('connection', function connection(ws) {
    console.log("Chrome webpage connected!");
    if (shutdownTimer) {
      clearTimeout(shutdownTimer);
      shutdownTimer = null;
      console.log("Shutdown cancelled — client reconnected.");
    }

    ws.on('close', () => {
      console.log("Client disconnected.");
      scheduleShutdown();
    });

    ws.on('message', function incoming(message) {
        try {
            const data = JSON.parse(message);

            if (data.type === 'move') {
                let moveStr = data.value;
                if (typeof data.value === 'object' && data.value !== null) {
                    const face = data.value.face || "";
                    let suffix = "";
                    if (data.value.direction === -1 || data.value.direction === 3) suffix = "'";
                    else if (data.value.direction === 2) suffix = "2";
                    moveStr = `${face}${suffix}`;
                }
                console.log(`[MOVE] ${moveStr}`);

                // Forward raw turn to TD
                oscTD.send('/gan/turn', moveStr);

                // Tag move for dashboard broadcast, then feed engine
                lastMove = moveStr;
                engine.onTurn(moveStr);
            }
            else if (data.type === 'gyro') {
                let q = data.data.quaternion;
                if (q) {
                    // Forward raw gyro to TD
                    oscTD.send('/gan/gyro', q.x, q.y, q.z, q.w);

                    // Feed the engine — this triggers onState → OSC to SC
                    engine.onGyro(q.x, q.y, q.z, q.w);

                    console.log(`[GYRO] x:${q.x.toFixed(3)} y:${q.y.toFixed(3)} z:${q.z.toFixed(3)} w:${q.w.toFixed(3)}`);
                }
            }
            else if (data.type === 'get_diagrams') {
                const diagrams = engine.getDiagrams().map(d => ({
                  name: d.name,
                  description: d.description,
                  path: d.path,
                }));
                ws.send(JSON.stringify({ type: 'diagrams', data: diagrams }));
            }
            else if (data.type === 'set_diagram') {
                const diagrams = engine.getDiagrams();
                const found = diagrams.find(d => d.name === data.name);
                if (found) {
                  engine.setKDiagram(found);
                  console.log(`[DIAGRAM] Set K_i diagram: ${found.name}`);
                }
            }
            else if (data.type === 'clear_diagram') {
                engine.clearKDiagram();
                console.log('[DIAGRAM] Cleared K_i diagram (direct mode)');
            }
            else if (data.type === 'set_mode') {
                const mode = {};
                if (data.path) mode.path = data.path;
                if (data.cCube) mode.cCube = data.cCube;
                if (data.kCube) mode.kCube = data.kCube;
                engine.setMode(mode);
                console.log(`[MODE] ${JSON.stringify(mode)}`);
            }
            else if (data.type === 'reset') {
                engine.reset();
                console.log('[RESET] Engine reset');
            }
        } catch (e) {
            console.error("Parse error:", e);
        }
    });
});
