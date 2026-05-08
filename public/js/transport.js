// public/js/transport.js
//
// Phase 2.3 — WebSocket transport between the dashboard and the relay
// (`relay.js`). Owns the single WS connection, auto-reconnects on
// close/error with a 2 s backoff, parses inbound JSON envelopes, and
// dispatches typed events to subscribers via `on(name, cb)`.
//
// All outbound WS messages flow through `send(obj)` (BLE move events,
// gyro mirrors, mode changes, diagram selection, panic, etc.). The
// dashboard's main script registers handlers per event name; the
// transport itself is unaware of UI / state semantics.
//
// BLE / Web Bluetooth GAN cube connection lives at the dashboard layer
// for now (the connect button + cube event callbacks are tied to
// other UI state); a future iteration could fold the BLE handle into
// this module too.

let ws = null;

// Browser -> relay backpressure guard. Gyro mirrors are continuous telemetry
// and can be dropped; cube moves are live control messages and must always be
// attempted when the socket is open.
const OUTBOUND_GYRO_DROP_BYTES = 16 * 1024;
const OUTBOUND_WARN_BYTES = 64 * 1024;
const OUTBOUND_LOG_INTERVAL_MS = 5000;
let _lastBackpressureLogMs = 0;
let _droppedGyroMessages = 0;

function _logBackpressure(kind, buffered, dropped) {
  const now = performance.now();
  if (dropped) _droppedGyroMessages++;
  if (now - _lastBackpressureLogMs < OUTBOUND_LOG_INTERVAL_MS && buffered < OUTBOUND_WARN_BYTES) return;
  _lastBackpressureLogMs = now;
  const droppedText = _droppedGyroMessages > 0
    ? ' droppedGyro=' + _droppedGyroMessages
    : '';
  _droppedGyroMessages = 0;
  console.warn('[transport] backpressure kind=' + kind + ' buffered=' + Math.round(buffered / 1024) + 'KB' + droppedText);
}

// Event handler registry. One array per event name.
//   open           — WS connection established (no args).
//   close          — WS closed; transport will auto-reconnect (no args).
//   state          — `{ type: 'state', data, move }` from the engine. (data, move).
//   gyroState      — `{ type: 'gyro_state', data }` BLE-rate full state burst. (data).
//   gyroTick       — `{ type: 'gyro_tick', data, dev }` 60 Hz Kalman pose. (data, dev).
//   diagrams       — diagram-list response from `get_diagrams`. (data).
//   algorithm      — `{ type: 'algorithm', data }` cube algorithm match. (data).
//   algorithmBook  — `{ type: 'algorithm_book', data }` initial book download. (data).
//   phrasePlan     — `{ type: 'phrase_plan', data }` TS shadow phrase plan. (data).
//   phraseAudit    — `{ type: 'phrase_audit', data }` planned-vs-actual phrase echo result. (data).
//   solve          — `{ type: 'solve' }` cube returned to identity. (no args).
//   midiEcho       — `{ type: 'midi_echo', data }` from Max/SWAM. (data).
const handlers = {
  open:          [],
  close:         [],
  state:         [],
  gyroState:     [],
  gyroTick:      [],
  diagrams:      [],
  algorithm:     [],
  algorithmBook: [],
  phrasePlan:    [],
  phraseAudit:   [],
  solve:         [],
  midiEcho:      [],
};

function emit(name, ...args) {
  const list = handlers[name];
  if (!list) return;
  for (const fn of list) {
    try { fn(...args); }
    catch (e) { console.error('[transport] ' + name + ' handler error:', e); }
  }
}

/** Subscribe to a transport event. Multiple subscribers per name allowed. */
export function on(name, fn) {
  if (!handlers[name]) {
    console.warn('[transport] unknown event name:', name);
    return;
  }
  handlers[name].push(fn);
}

/** Send a JSON envelope to the relay. No-op if WS isn't open. */
export function send(obj) {
  if (ws && ws.readyState === WebSocket.OPEN) {
    const buffered = ws.bufferedAmount || 0;
    if (obj?.type === 'gyro' && buffered >= OUTBOUND_GYRO_DROP_BYTES) {
      _logBackpressure('gyro', buffered, true);
      return false;
    }
    if (buffered >= OUTBOUND_WARN_BYTES) _logBackpressure(obj?.type || 'message', buffered, false);
    ws.send(JSON.stringify(obj));
    return true;
  }
  return false;
}

/** Open the WebSocket. Auto-reconnects on close / error. */
export function connect() {
  ws = new WebSocket('ws://' + window.location.host);

  ws.onopen  = () => emit('open');
  ws.onclose = () => {
    emit('close');
    setTimeout(connect, 2000);
  };
  ws.onerror = () => { try { ws.close(); } catch (e) { /* noop */ } };

  ws.onmessage = (evt) => {
    try {
      const msg = JSON.parse(evt.data);
      switch (msg.type) {
        case 'state':           emit('state', msg.data, msg.move);    break;
        case 'gyro_state':      emit('gyroState', msg.data);          break;
        case 'gyro_tick':       emit('gyroTick',  msg.data, msg.dev); break;
        case 'diagrams':        emit('diagrams',  msg.data);          break;
        case 'algorithm':       emit('algorithm', msg.data);          break;
        case 'algorithm_book':  emit('algorithmBook', msg.data);      break;
        case 'phrase_plan':     emit('phrasePlan', msg.data);         break;
        case 'phrase_audit':    emit('phraseAudit', msg.data);        break;
        case 'solve':           emit('solve');                        break;
        case 'midi_echo':       emit('midiEcho',  msg.data);          break;
      }
    } catch (e) {
      console.error('[transport] parse error:', e);
    }
  };
}
