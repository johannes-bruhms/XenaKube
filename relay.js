// Register tsx so we can require TypeScript modules directly
require('tsx/cjs');

const { Client } = require('node-osc');
const WebSocket = require('ws');
const http = require('http');
const { XenaKubeEngine, stateToOsc } = require('./src/index.ts');

// === XenaKube Engine ===
const engine = new XenaKubeEngine();

// === OSC Clients ===
const oscMax = new Client('127.0.0.1', 9000);   // Max/MSP — receives /xk/* engine state
const oscTD  = new Client('127.0.0.1', 8000);   // TouchDesigner — receives raw /gan/* + /xk/gyro

// Forward engine state over OSC on every state change
engine.onState((state) => {
  const msgs = stateToOsc(state);
  for (const msg of msgs) {
    oscMax.send(msg.address, ...msg.args);
  }
});

const HTML_CONTENT = `<!DOCTYPE html>
<html>
<head>
    <title>GAN Cube Decryptor</title>
    <style>
        body { font-family: sans-serif; background: #111; color: #eee; text-align: center; padding: 50px; }
        button { padding: 15px 30px; font-size: 20px; cursor: pointer; background: #00ff88; border: none; font-weight: bold; border-radius: 8px;}
        #status { margin-top: 20px; font-size: 18px; color: #888; }
    </style>
</head>
<body>
    <h1>Live Performance Cube Bridge</h1>
    <button id="connectBtn">Connect to GAN Cube</button>
    <div id="status">Status: Waiting...</div>

    <script type="module">
        import { connectGanCube } from 'https://cdn.jsdelivr.net/npm/gan-web-bluetooth@latest/+esm';

        const statusText = document.getElementById('status');
        const connectBtn = document.getElementById('connectBtn');
        const ws = new WebSocket('ws://' + window.location.host);

        ws.onopen = () => console.log("Connected to local Node.js Relay");

        connectBtn.addEventListener('click', async () => {
            statusText.innerText = "Status: Please select the cube in the popup...";
            try {
                const cube = await connectGanCube();

                statusText.innerText = "Status: Connected to GAN Cube!";
                statusText.style.color = "#00ff88";

                cube.events$.subscribe((event) => {
                    if (event.type === 'MOVE') {
                        if (ws.readyState === WebSocket.OPEN) {
                            ws.send(JSON.stringify({ type: 'move', value: event.move }));
                        }
                    } else if (event.type === 'GYRO' || event.type === 'GYROSCOPE' || event.gyro) {
                        if (ws.readyState === WebSocket.OPEN) {
                            ws.send(JSON.stringify({ type: 'gyro', data: event.gyro || event }));
                        }
                    } else if (event.type === 'DISCONNECT') {
                        statusText.innerText = "Status: ⚠️ Cube disconnected!";
                        statusText.style.color = "red";
                    }
                });

            } catch (err) {
                statusText.innerText = "Status: ❌ Connection failed. " + err.message;
                statusText.style.color = "red";
            }
        });
    </script>
</body>
</html>`;

// 1. Start the HTTP Server
const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(HTML_CONTENT);
});

server.listen(3000, () => {
    console.log("--------------------------------------------------");
    console.log("🌐 1. OPEN CHROME AND GO TO: http://localhost:3000");
    console.log("--------------------------------------------------");
});

// 2. OSC status
console.log("🚀 2. OSC → Max/MSP on port 9000, TouchDesigner on port 8000");

// 3. Start the WebSocket Server
const wss = new WebSocket.Server({ server });
console.log("🔌 3. Waiting for Chrome webpage to connect...");

wss.on('connection', function connection(ws) {
    console.log("✅ SUCCESS: Chrome webpage connected to Node.js Relay!");

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

                // Feed the engine — this triggers onState → OSC to Max
                engine.onTurn(moveStr);
            }
            else if (data.type === 'gyro') {
                let q = data.data.quaternion;
                if (q) {
                    // Forward raw gyro to TD
                    oscTD.send('/gan/gyro', q.x, q.y, q.z, q.w);

                    // Feed the engine — this triggers onState → OSC to Max
                    engine.onGyro(q.x, q.y, q.z, q.w);

                    console.log(`[GYRO] x:${q.x.toFixed(3)} y:${q.y.toFixed(3)} z:${q.z.toFixed(3)} w:${q.w.toFixed(3)}`);
                }
            }
        } catch (e) {
            console.error("Data parsing error:", e);
        }
    });
});
