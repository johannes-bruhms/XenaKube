// max/ks_logger.js — toggleable pass-through MIDI logger for SWAM KS debugging.
//
// Drop this v8 between xk_swam.js and vst~:
//
//   [udpreceive 57121] → [v8 xk_swam.js @autowatch 1]
//                          ↓
//                        [v8 ks_logger.js @autowatch 1]
//                          ↓
//                        [vst~ "SWAM Cello 3" 2] → [dac~ 1 2]
//
// All midievent messages pass through unchanged whether logging is ON or OFF.
// Other messages (anything, lists, ints) pass through too.
//
// Send these messages to the left inlet:
//   on              start capture, clear buffer
//   off             stop capture
//   clear           empty buffer, reset t=0
//   dump            post summary + full JSON to Max window
//   limit <n>       cap buffer size (default 4000)
//   ks_ch <n>       override KS channel 1-16 (default 2 = xk_swam.js KS_CH)
//   help            list commands
//
// Typical use:
//   1. Hit "on", do the turn sequence that mis-fires harmonics / tremolo.
//   2. Hit "dump". Copy the Max window text, paste to an LLM.
//
// Captured per event: relative ms, channel, type (noteOn/noteOff/cc/…),
// raw bytes, and for KS notes the xk_swam.js field label + option guess.

autowatch = 1;
inlets = 1;
outlets = 1;

// Keep in sync with xk_swam.js KS table (src of truth: var KS = {...}).
var KS_LABELS = {
	24: "PLAY_MODE",      // 3-opt: Bow / Pizz / Col Legno
	25: "MANUAL_BOWING",  // preset-controlled — should never be written
	26: "GESTURE_MODE",   // 3-opt: Expression / Bipolar / Bowing
	27: "ALT_FINGERING",  // 3-opt: Mid / Bridge / Nut+Open
	28: "BOW_LIFT",       // 2-opt
	29: "BOW_START",      // 2-opt
	30: "HARMONICS",      // 4-opt: OFF / 2 / 3 / 4-Ctrl
	31: "KEEP_BOW_DIR",   // latch — avoid
	32: "TREMOLO",        // 3-opt: OFF / Slow / Fast
	33: "TREMOLO_MODE",   // 3-opt
	34: "(unassigned)",
	35: "PAGE_MOD"
};

// Match KS_VEL_OVERRIDE in xk_swam.js so we can back-solve option index.
var KS_VEL_BANDS = {
	26: [21, 64, 106],
	30: [16, 48, 80, 112],
	32: [21, 64, 106]
};

var ENABLED = false;
var START_MS = 0;
var EVENTS = [];
var LIMIT = 4000;
var KS_CH = 2;
var KS_LOW = 24;
var KS_HIGH = 35;

function now_ms() { return (new Date()).getTime(); }

function passthrough() {
	// Re-emit using apply so arguments are sent as separate atoms, not a list.
	var passArgs = [0, messagename];
	for (var i = 0; i < arguments.length; i++) passArgs.push(arguments[i]);
	outlet.apply(this, passArgs);
}

function anything() {
	if (messagename === "midievent" && ENABLED) {
		capture(arrayfromargs(arguments));
	}
	passthrough.apply(this, arguments);
}

function list() {
	// Raw list without selector — still pass through.
	var passArgs = [0];
	for (var i = 0; i < arguments.length; i++) passArgs.push(arguments[i]);
	outlet.apply(this, passArgs);
}

function bang()   { outlet(0, "bang"); }
function msg_int(v) { outlet(0, v); }
function msg_float(v) { outlet(0, v); }

function on() {
	ENABLED = true;
	EVENTS.length = 0;
	START_MS = now_ms();
	post("[ks_logger] ON  (buffer cleared, t=0)\n");
}

function off() {
	ENABLED = false;
	post("[ks_logger] OFF (" + EVENTS.length + " events captured)\n");
}

function clear() {
	EVENTS.length = 0;
	START_MS = now_ms();
	post("[ks_logger] cleared\n");
}

function limit(n) {
	LIMIT = Math.max(100, n | 0);
	post("[ks_logger] limit=" + LIMIT + "\n");
}

function ks_ch(n) {
	KS_CH = Math.max(1, Math.min(16, n | 0));
	post("[ks_logger] KS_CH=" + KS_CH + "\n");
}

function help() {
	post("[ks_logger] commands: on | off | clear | dump | limit <n> | ks_ch <n>\n");
}

function guessKsOption(note, vel) {
	var bands = KS_VEL_BANDS[note];
	if (bands) {
		var bestIdx = 0, bestDist = 999;
		for (var i = 0; i < bands.length; i++) {
			var d = Math.abs(vel - bands[i]);
			if (d < bestDist) { bestDist = d; bestIdx = i; }
		}
		return "opt=" + bestIdx + " (Δ" + bestDist + ")";
	}
	// Even-band fallback. Assume 3-opt unless known.
	var n = 3;
	if (note === 28 || note === 29) n = 2;
	if (note === 30) n = 4;
	var band = 127 / n;
	var idx = Math.min(n - 1, Math.floor(vel / band));
	return "opt≈" + idx + "/" + n;
}

function capture(bytes) {
	if (EVENTS.length >= LIMIT) return;
	if (!bytes || bytes.length < 1) return;

	var status = bytes[0] & 0xF0;
	var ch = (bytes[0] & 0x0F) + 1;
	var rec = { t: now_ms() - START_MS, ch: ch, raw: bytes.slice() };

	if (status === 0x90 && bytes.length >= 3 && bytes[2] > 0) {
		rec.type = "noteOn";  rec.note = bytes[1]; rec.vel = bytes[2];
	} else if (status === 0x80 || (status === 0x90 && bytes[2] === 0)) {
		rec.type = "noteOff"; rec.note = bytes[1]; rec.vel = bytes[2];
	} else if (status === 0xB0) {
		rec.type = "cc";      rec.num  = bytes[1]; rec.val = bytes[2];
	} else if (status === 0xE0) {
		rec.type = "pb";      rec.val  = ((bytes[2] & 0x7F) << 7) | (bytes[1] & 0x7F);
	} else {
		rec.type = "raw";
	}

	if (ch === KS_CH && (rec.type === "noteOn" || rec.type === "noteOff")
			&& rec.note >= KS_LOW && rec.note <= KS_HIGH) {
		rec.ks = true;
		rec.ksField = KS_LABELS[rec.note] || "?";
		rec.ksOpt = guessKsOption(rec.note, rec.vel);
	}

	EVENTS.push(rec);
}

function pad(s, w) {
	s = String(s);
	while (s.length < w) s = " " + s;
	return s;
}

function dump() {
	var span = EVENTS.length ? EVENTS[EVENTS.length - 1].t : 0;
	post("\n[ks_logger] DUMP — " + EVENTS.length + " events across " + span + " ms\n");
	post("             (enabled=" + ENABLED + ", KS_CH=" + KS_CH + ")\n");

	// 1. KS-only timeline with inter-event deltas and per-field deltas.
	var lastPerField = {};
	post("\n=== KS TIMELINE (ch " + KS_CH + ", notes " + KS_LOW + "-" + KS_HIGH + ") ===\n");
	post("    t_abs  Δprev  type     note field          vel  option        Δfield\n");
	var prevT = 0;
	var ksCount = 0;
	for (var i = 0; i < EVENTS.length; i++) {
		var e = EVENTS[i];
		if (!e.ks) continue;
		ksCount++;
		var dPrev = e.t - prevT;
		var key = e.note + ":" + e.type;
		var dField = lastPerField[key] == null ? -1 : e.t - lastPerField[key];
		lastPerField[key] = e.t;
		post("  " + pad(e.t, 7) + "  " + pad(dPrev, 5) +
				 "  " + pad(e.type, 7) + "  " + pad(e.note, 3) +
				 "  " + pad(e.ksField, 13) + "  " + pad(e.vel, 3) +
				 "  " + pad(e.ksOpt, 12) +
				 "  " + (dField < 0 ? "    -" : pad(dField, 5)) + "\n");
		prevT = e.t;
	}
	post("  (" + ksCount + " KS events)\n");

	// 2. Non-KS context (CC + notes on MIDI_CH) — compact histogram.
	var ccHist = {};
	var noteOnMain = 0, noteOffMain = 0;
	for (var j = 0; j < EVENTS.length; j++) {
		var x = EVENTS[j];
		if (x.type === "cc") ccHist[x.num] = (ccHist[x.num] || 0) + 1;
		else if (!x.ks && x.type === "noteOn")  noteOnMain++;
		else if (!x.ks && x.type === "noteOff") noteOffMain++;
	}
	post("\n=== NON-KS SUMMARY ===\n");
	post("  notes: on=" + noteOnMain + " off=" + noteOffMain + "\n");
	var ccKeys = [];
	for (var k in ccHist) ccKeys.push(+k);
	ccKeys.sort(function(a,b){ return a-b; });
	var ccLine = "  CC counts:";
	for (var m = 0; m < ccKeys.length; m++) {
		ccLine += " [" + ccKeys[m] + "×" + ccHist[ccKeys[m]] + "]";
	}
	post(ccLine + "\n");

	// 3. Full JSON for LLM paste.
	post("\n=== FULL JSON (paste to LLM) ===\n");
	post(JSON.stringify(EVENTS) + "\n\n");
}

help.local = 0;
dump.local = 0;
