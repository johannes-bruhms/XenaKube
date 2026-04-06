#!/usr/bin/env node
// test_osc.js — Sends simulated /xk/* OSC messages to port 9000
//
// Usage: node max/test_osc.js
//
// Cycles through different complex types and sieve configurations
// to test xenakube_receive.js → dict → voice engine pipeline in Max.

const { Client } = require("node-osc");

const client = new Client("127.0.0.1", 9000);

// Intensity options per path
const V1_INTENSITIES = ["mf", "f", "ff", "fff"];
const V2_INTENSITIES = ["p", "mp", "mf", "f"];

// Sample sieve sets (semitone offsets from C2)
const SIEVES = [
  [0, 3, 5, 7, 10, 12, 15, 17, 19],          // pentatonic-ish
  [0, 1, 4, 6, 7, 10, 13, 15],                // octatonic-ish
  [0, 2, 4, 5, 7, 9, 11, 12, 14, 16, 17, 19], // diatonic-ish spread
  [0, 6, 12, 18, 24],                          // sparse tritones
];

// Complex type sequences to demo all engines
const COMPLEX_SEQUENCES = [
  [1, 2, 3, 4, 5, 6, 7, 8],   // all types in order
  [1, 1, 1, 5, 5, 5, 8, 8],   // grains → gliss → atoms
  [4, 8, 4, 8, 1, 2, 3, 6],   // mixed
];

let step = 0;
let sequenceIdx = 0;

function randomChoice(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomFloat(min, max) {
  return min + Math.random() * (max - min);
}

function sendState() {
  const path = step % 6 < 3 ? "V1" : "V2";
  const intensities = path === "V1" ? V1_INTENSITIES : V2_INTENSITIES;
  const sieve = SIEVES[step % SIEVES.length];
  const complexSeq = COMPLEX_SEQUENCES[sequenceIdx % COMPLEX_SEQUENCES.length];
  const cycle = ["alpha", "beta", "gamma"][step % 3];
  const tetra = step % 2;
  const kGroup = step % 24;
  const cGroup = (step * 7) % 24;

  // Group elements
  client.send("/xk/group/k", kGroup);
  client.send("/xk/group/c", cGroup);

  // Vertex parameters (8 voices)
  for (let i = 1; i <= 8; i++) {
    const density = randomFloat(0.5, 3.0);
    const intensity = randomChoice(intensities);
    const duration = path === "V1"
      ? randomFloat(2, 5)
      : randomFloat(10, 30);
    client.send(`/xk/vertex/${i}`, density, intensity, duration);
  }

  // Complex assignments
  for (let i = 1; i <= 8; i++) {
    client.send(`/xk/complex/${i}`, complexSeq[i - 1]);
  }

  // Path, cycle, tetra
  client.send("/xk/path", path);
  client.send("/xk/cycle", cycle);
  client.send("/xk/tetra", tetra);

  // Sieve (variable-length pitch list)
  client.send("/xk/sieve", ...sieve);

  // Simulated gyro (slowly rotating)
  const angle = (step * 0.2) % (Math.PI * 2);
  const gx = Math.sin(angle) * 0.3;
  const gy = 0;
  const gz = 0;
  const gw = Math.cos(angle) * 0.7 + 0.3;
  client.send("/xk/gyro", gx, gy, gz, gw);

  // Step counter
  client.send("/xk/step", step);

  // Permutation (identity + rotation)
  const perm = [1, 2, 3, 4, 5, 6, 7, 8];
  // Simple rotation by step
  for (let r = 0; r < step % 4; r++) {
    perm.push(perm.shift());
  }
  client.send("/xk/perm", ...perm);

  console.log(
    `[step ${step}] path=${path} cycle=${cycle} tetra=${tetra} ` +
    `complexes=[${complexSeq.join(",")}] sieve=[${sieve.join(",")}]`
  );

  step++;
  if (step % 8 === 0) sequenceIdx++;
}

// Send a burst every 3 seconds (simulating a cube turn)
console.log("Sending simulated XenaKube OSC to 127.0.0.1:9000");
console.log("Press Ctrl+C to stop.\n");

sendState(); // immediate first burst
const interval = setInterval(sendState, 3000);

// Clean shutdown
process.on("SIGINT", () => {
  clearInterval(interval);
  client.close();
  console.log("\nStopped.");
  process.exit(0);
});
