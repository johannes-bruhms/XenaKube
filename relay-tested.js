const { Client } = require('node-osc');
const WebSocket = require('ws');
const http = require('http');

/*
   GAN Cube Live Performance Bridge - macOS FIXED (v2)
   ✅ Uses official customMacAddressProvider (no spoofing needed)
   ✅ Library now ignores device.id and uses this method
   ✅ Prefilled with your real MAC (AB:12:34:5E:83:F7)
   ✅ Heavy console logging for debugging
*/

const HTML_CONTENT = `<!DOCTYPE html>
<html>
<head>
    <title>GAN Cube Bridge - macOS Fixed</title>
    <style>
        body { font-family: sans-serif; background: #111; color: #eee; text-align: center; padding: 50px; }
        button { padding: 15px 30px; font-size: 20px; cursor: pointer; background: #00ff88; border: none; font-weight: bold; border-radius: 8px;}
        #status { margin-top: 20px; font-size: 18px; color: #888; }
        #debug { margin-top: 20px; font-size: 14px; color: #ffaa00; text-align: left; background: #222; padding: 10px; border-radius: 5px; display: none; white-space: pre-wrap; word-wrap: break-word;}
        .mac-input { margin-bottom: 25px; }
        .mac-input input { padding: 12px; font-size: 18px; width: 280px; text-align: center; border-radius: 5px; border: 1px solid #444; background: #222; color: #00ff88; font-family: monospace; }
        .mac-label { display: block; margin-bottom: 8px; font-size: 14px; color: #aaa; }
    </style>
</head>
<body>
    <h1>Live Performance Cube Bridge <small>(macOS Fixed v2)</small></h1>
    
    <div class="mac-input">
        <label class="mac-label" for="macAddress">Your GAN Cube MAC Address:</label>
        <input type="text" id="macAddress" placeholder="AB:12:34:5E:83:F7" value="AB:12:34:5E:83:F7">
    </div>

    <button id="connectBtn">Connect to GAN Cube</button>
    <div id="status">Status: Waiting...</div>
    <div id="debug"></div>

    <script type="module">
        import { connectGanCube } from 'https://cdn.jsdelivr.net/npm/gan-web-bluetooth@latest/+esm';

        const statusText = document.getElementById('status');
        const connectBtn = document.getElementById('connectBtn');
        const debugBox = document.getElementById('debug');
        const macInput = document.getElementById('macAddress');
        const ws = new WebSocket('ws://' + window.location.host);
        
        ws.onopen = () => console.log("✅ Connected to Node.js Relay");

        // Auto-load saved MAC
        if (localStorage.getItem('ganMacAddress')) {
            macInput.value = localStorage.getItem('ganMacAddress');
        }

        connectBtn.addEventListener('click', async () => {
            const macAddress = macInput.value.trim().toUpperCase();
            
            const macRegex = /^([0-9A-F]{2}[:-]){5}([0-9A-F]{2})$/;
            if (!macRegex.test(macAddress)) {
                statusText.innerText = "Status: Invalid MAC format!";
                statusText.style.color = "red";
                return;
            }

            localStorage.setItem('ganMacAddress', macAddress);

            statusText.innerText = "Status: Please select the cube in the popup...";
            statusText.style.color = "#888";
            debugBox.style.display = "none";
            debugBox.innerText = "";

            console.log("🚀 Starting connectGanCube with custom MAC provider...");
            
            try {
                // OFFICIAL WAY: pass custom MAC provider (this is what the library expects)
                const cube = await connectGanCube(async (device, isFallbackCall) => {
                    console.log(\`📡 Custom MAC Provider called (fallback: \${isFallbackCall})\`);
                    console.log(\`✅ Returning real MAC: \${macAddress}\`);
                    return macAddress;
                });
                
                console.log("%c🎉 SUCCESS: Cube connected!", "color:#0f0; font-size:16px");
                
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
                        statusText.innerText = "Status: Cube disconnected!";
                        statusText.style.color = "red";
                    }
                });

            } catch (err) {
                console.error("=== RAW ERROR ===", err);
                statusText.innerText = "Status: Connection failed.";
                statusText.style.color = "red";
                
                debugBox.style.display = "block";
                debugBox.innerText = "ERROR DETAILS:\\n" + err.message + "\\n\\nSTACK:\\n" + (err.stack || "No stack trace");
            }
        });
    </script>
</body>
</html>`;

// 1. HTTP Server
const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(HTML_CONTENT);
});

server.listen(3000, () => {
    console.log("--------------------------------------------------");
    console.log("1. OPEN CHROME → http://localhost:3000");
    console.log("--------------------------------------------------");
});

// 2. OSC Client
const oscClient = new Client('127.0.0.1', 8000);
console.log("🚀 2. OSC Relay ready (port 8000 for TouchDesigner)");

// 3. WebSocket Server
const wss = new WebSocket.Server({ server });
console.log("🔌 3. Waiting for browser...");

wss.on('connection', function connection(ws) {
    console.log("✅ Chrome webpage connected!");

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
                oscClient.send('/gan/turn', moveStr);
            }
            else if (data.type === 'gyro') {
                let q = data.data.quaternion;
                if (q) {
                     oscClient.send('/gan/gyro', q.x, q.y, q.z, q.w);
                     console.log(`[GYRO] x:${q.x.toFixed(3)} y:${q.y.toFixed(3)} z:${q.z.toFixed(3)} w:${q.w.toFixed(3)}`);
                }
            }
        } catch (e) {
            console.error("Parse error:", e);
        }
    });
});
