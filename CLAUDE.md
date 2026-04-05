# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**XenaKube** is a real-time musical instrument that turns a GAN i4 smart Rubik's cube into a live performance tool based on Iannis Xenakis' *Nomos Alpha* composition method (24 cube rotation symmetries). Physical cube rotations drive sound synthesis and visuals.

## Architecture

The system has three components connected via OSC/UDP and WebSockets:

**Signal flow:** GAN i4 cube (BLE) → Chrome (Web Bluetooth) → `relay.js` (Node.js) → TouchDesigner + Max/MSP

### relay.js — BLE-to-OSC Bridge (Node.js)
- Serves a Chrome Web Bluetooth UI on `http://localhost:3000`
- Receives cube events (moves + gyro quaternion) via WebSocket from the browser
- Forwards as OSC: `/gan/turn` (move string) and `/gan/gyro` (x, y, z, w quaternion) to TouchDesigner on port 8000
- Dependencies: `node-osc`, `ws`; browser uses `gan-web-bluetooth` from CDN

### symmetry_engine.js — Layer 1: Discrete Face-Turn Engine (Max/MSP `[js]`)
- Loads a 24×24 Cayley multiplication table from `cube_cayley.json`
- Each face turn does exact group multiplication → permutes 8 corner parameter bundles across 4 ghost dicts → advances tetrahedral orbit index
- Outlets: bang (new event), current symmetry index, tetrahedron index

### layer_manager.js — Layer 2: Continuous Gyro Cube (Max/MSP `[js]`)
- Treats gyro quaternion as a second independent cube for time/dynamics modulation
- Supports up to 6 superimposed layers; lock button freezes current orientation into the stack
- Manages `master_superposition` dict (summed corner params across all layers)
- Outlets: bang (new event), "params" (master update), layer status feedback

## Running

```bash
# Start the BLE relay bridge
node relay.js
# Then open http://localhost:3000 in Chrome and click "Connect to GAN Cube"
```

The two `[js]` files (`symmetry_engine.js`, `layer_manager.js`) run inside Max/MSP — load them into `[js]` objects in your Max patch per the routing in `docs/Xenakube_Outline.md`.

## Performance Modes

- **V1**: Pure algebraic — exact *Nomos Alpha* group action, snap-to-nearest symmetry
- **V2**: Expressive deviations — group engine runs underneath with human expression dials
- **V3 (Layered)**: Build multiple superimposed rotating cubes in real time

## Key Data Structures

- **Cayley table** (`cube_cayley.json`): 24×24 JSON lookup for group multiplication
- **Ghost dicts** (`ghost1`–`ghost4`): Max Dict objects holding corner parameter bundles (freq, amp, filter, FM index, grain density, etc.)
- **Master superposition dict**: Additive sum of all locked + active layer corner params, read by `poly~ xenakis_voice 8`

## OSC Message Format

| Address | Payload | Source |
|---------|---------|--------|
| `/gan/turn` | move string (e.g. `"R"`, `"U'"`, `"F2"`) | relay → TD |
| `/gan/gyro` | `x y z w` (quaternion floats) | relay → TD |
| `/cube/turn` | turn generator index (0–11) | TD → Max |
| `/cube/gyro` | `x y z w` (quaternion floats) | TD → Max |
| `/cube/lock` | bang | footswitch → Max |
