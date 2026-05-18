// ================================================================
// xk_sphere.js — XenaKube sphere engine (gamelan sample bridge)
//
// Sibling v8 to xk_swam.js. Receives /xk/sphere/* OSC from relay.js
// (port 57121) and drives a downstream [polybuffer~ gamelan] +
// per-instrument [groove~] voice slots. Each /xk/sphere/strike picks
// a manifest-canonical sample name (resolved by relay using
// src/sphere-mapping.ts), plays it through the matching voice class,
// and echoes /xk/sphere/echo so the relay's D75 audit can verify.
//
// Body engine (SWAM cello, xk_swam.js) keeps firing per-turn; this
// engine is purely additive. Cosmology gating happens upstream in
// engine.ts — Max never decides whether to strike, only how.
//
// Patch topology this v8 expects (set up by max-patch subagent):
//
//   [udpreceive 57121]
//     └─ [route /xk/sphere/strike /xk/sphere/panic]
//          ├─ /xk/sphere/strike → [v8 xk_sphere.js] inlet 0
//          └─ /xk/sphere/panic  → [v8 xk_sphere.js] inlet 0 ("panic" msg)
//
//   [v8 xk_sphere.js]
//     ├─ outlet 0 (PLAY_OUTLET)  → [route gong kempul saron slenthem bonang kempyang kethuk kempul-ensemble]
//     │                            each subpatch:  groove~ gamelan/<name> → *~ <gain> → matrix~ mix
//     ├─ outlet 1 (DEBUG_OUTLET) → [print xk_sphere]
//     ├─ outlet 2 (ECHO_OUTLET)  → [prepend /xk/sphere/echo] → [udpsend 127.0.0.1 57122]
//     └─ outlet 3 (LOADED_OUTLET) → [prepend /xk/sphere/loaded] → [udpsend 127.0.0.1 57122]
//
//   [polybuffer~ gamelan]
//     └─ pre-loaded at bang() from gen_sphere_includes.js GAMELAN_SAMPLES.
//        Buffers named by `canonical` (e.g. "gong-center-soft-gongmallet").
//
// Sample files live in max/media/gamelan/ relative to the project root.
// The Max patch must be saved next to (or know how to find) that
// folder so polybuffer~ reads resolve.
// ================================================================

autowatch = 1;
inlets = 1;
outlets = 4;

var PLAY_OUTLET   = 0;
var DEBUG_OUTLET  = 1;
var ECHO_OUTLET   = 2;
var LOADED_OUTLET = 3;

setinletassist(0, "OSC /xk/sphere/* from relay (port 57121) + bang/panic/debug");
setoutletassist(PLAY_OUTLET,   "[route <instrumentClass>] -> [groove~ gamelan/<name>] voice subpatchers");
setoutletassist(DEBUG_OUTLET,  "debug -> [print xk_sphere]");
setoutletassist(ECHO_OUTLET,   "/xk/sphere/echo -> [prepend ...] -> [udpsend 127.0.0.1 57122] (D75 audit)");
setoutletassist(LOADED_OUTLET, "/xk/sphere/loaded -> [prepend ...] -> [udpsend 127.0.0.1 57122] (D77 audit)");

// Data tables: 314-entry sample manifest + tuning hash. Regen via:
//     npm run gen:max
// after editing src/gamelan-manifest.ts or src/gamelan-tuning.ts.
include("gen_sphere_includes.js");

// ================================================================
// CONFIG
// ================================================================

// Folder containing the .wav samples. Relative to the patch by default;
// override via the `samplefolder <path>` message if you keep the patch
// somewhere other than the project root.
var SAMPLE_FOLDER = "media/gamelan";

// Per-instrument-class voice polyphony cap. Strikes beyond the cap
// steal the oldest voice (D76 panic semantics). Tuned for v1: gong is
// monophonic-by-physics, kempul almost so, saron/bonang can layer.
var POLY_BY_CLASS = {
	"gong":              1,
	"kempul":            2,
	"kempul-ensemble":   2,
	"slenthem":          4,
	"saron":             8,
	"bonang":           12,
	"kempyang":          2,
	"kethuk":            2
};

// Lookups built at v8 load:
//   SAMPLE_BY_NAME — canonical -> manifest entry (used to validate strikes)
//   SAMPLE_INDEX_BY_NAME — canonical -> 1-based polybuffer~ index (used to
//     emit `set gamelan.<N>` for groove~). Assumes polybuffer~'s readfolder
//     loads files in alphabetical order matching the manifest's sort, which
//     is the convention on every modern Max + Windows/macOS build. If a
//     wrong sample ever plays, this assumption broke and we need to add a
//     getshortname callback round-trip at bang() time.
var SAMPLE_BY_NAME = {};
var SAMPLE_INDEX_BY_NAME = {};
(function buildLookup() {
	for (var i = 0; i < GAMELAN_SAMPLES.length; i++) {
		var s = GAMELAN_SAMPLES[i];
		SAMPLE_BY_NAME[s.canonical] = s;
		SAMPLE_INDEX_BY_NAME[s.canonical] = i + 1;
	}
})();

// Strike id -> emit timestamp, for D75 latency telemetry only.
var pendingEchoes = {};
// Per-class voice-slot ring for D76 panic + voice-steal.
var voiceRings = {};
function initVoiceRings() {
	voiceRings = {};
	for (var k in POLY_BY_CLASS) {
		voiceRings[k] = { cap: POLY_BY_CLASS[k], slots: [], nextSlot: 0 };
	}
}
initVoiceRings();

var loadedCount = 0;
var expectedCount = GAMELAN_SAMPLE_COUNT;

function log() {
	var s = "";
	for (var i = 0; i < arguments.length; i++) s += (i ? " " : "") + arguments[i];
	post("[xk_sphere] " + s + "\n");
	outlet(DEBUG_OUTLET, s);
}

function fail() {
	var s = "";
	for (var i = 0; i < arguments.length; i++) s += (i ? " " : "") + arguments[i];
	post("[xk_sphere FAIL] " + s + "\n");
	outlet(DEBUG_OUTLET, "FAIL", s);
}

// ================================================================
// LOAD — bang() triggers ONE polybuffer~ readfolder
// ================================================================
//
// polybuffer~ takes `readfolder <path>` and loads every audio file
// under <path> into buffers named `<polybuffer-arg>.<index>` (1-based).
// We emit ONE `load <path>` message; the downstream chain
// (`[route load]` -> `[prepend readfolder]` -> `[polybuffer~ gamelan]`)
// converts that into the readfolder message. Per-file references are
// then indexed (gamelan.1 .. gamelan.N) where N maps 1:1 to the
// alphabetically-sorted manifest order (see SAMPLE_INDEX_BY_NAME).
//
// loadedCount is set optimistically; polybuffer~ does not emit a
// per-buffer callback. The D77 invariant truth-check happens when the
// user audits Max console output after bang() / patch reload.

function bang() {
	log("=== SPHERE BANG — emitting readfolder for", SAMPLE_FOLDER, "===");
	log("=== TUNING HASH=" + GAMELAN_TUNING_HASH + " — verify matches src/gamelan-tuning.ts ===");
	log("=== MANIFEST HASH=" + GAMELAN_MANIFEST_HASH + " — verify matches src/gamelan-manifest.ts ===");
	initVoiceRings();
	pendingEchoes = {};
	// Emit: ["load", "<folder>"]
	// Downstream [route load] strips the "load" token; [prepend readfolder]
	// turns the path into `readfolder <path>` for polybuffer~.
	outlet(PLAY_OUTLET, "load", SAMPLE_FOLDER);
	loadedCount = expectedCount; // optimistic — verify in polybuffer~ inspector
	log("SAMPLE LOAD: emitted readfolder; verify polybuffer~ holds " + expectedCount + " buffers (double-click polybuffer~ object to inspect)");
	outlet(LOADED_OUTLET, loadedCount, expectedCount, GAMELAN_TUNING_HASH);
}

function samplefolder(p) {
	SAMPLE_FOLDER = String(p);
	log("samplefolder = " + SAMPLE_FOLDER);
}

// ================================================================
// /xk/sphere/strike — main dispatch
// ================================================================
//
// OSC args: sampleName, gain(0..1), pan(-1..1), voiceSteal(0|1), strikeId
//
// Arrives at the v8 inlet as a flat list. We route by sampleName to
// the appropriate per-class voice subpatch, then echo back to relay.

function strike(sample, gain, pan, voiceSteal, strikeId) {
	var s = SAMPLE_BY_NAME[String(sample)];
	if (!s) {
		fail("STRIKE UNKNOWN SAMPLE sample=" + sample + " strikeId=" + strikeId);
		return;
	}
	gain = Math.max(0, Math.min(1, Number(gain)));
	pan = Math.max(-1, Math.min(1, Number(pan)));
	voiceSteal = (Number(voiceSteal) | 0) ? 1 : 0;
	strikeId = Number(strikeId) | 0;

	var cls = s.instrument;
	allocateVoice(cls, voiceSteal);

	// polybuffer~ names its buffers `<polybuf-arg>.<index>` (e.g. gamelan.5),
	// so the downstream `prepend set` -> `groove~` references the buffer by
	// that index-based symbol rather than the canonical (which is a manifest-
	// side label, not a polybuffer slot name).
	var polyIdx = SAMPLE_INDEX_BY_NAME[s.canonical];
	if (!polyIdx) {
		fail("STRIKE INDEX MISSING canonical=" + s.canonical + " strikeId=" + strikeId);
		return;
	}
	var bufferRef = "gamelan." + polyIdx;

	// Emit: [<instrumentClass>, "play", "gamelan.<N>", gain, pan, strikeId]
	// Downstream [route <classes>] sends to the matching voice subpatch.
	outlet(PLAY_OUTLET, cls, "play", bufferRef, gain, pan, strikeId);

	pendingEchoes[strikeId] = Date.now();
	outlet(ECHO_OUTLET, s.canonical, strikeId, gain, voiceRingActiveCount(cls));
}

function allocateVoice(cls, voiceSteal) {
	var ring = voiceRings[cls];
	if (!ring) return; // unknown class — accept anyway, log
	if (voiceSteal) {
		// Hard steal: tell the class to silence everything before playing.
		outlet(PLAY_OUTLET, cls, "steal");
		ring.slots = [];
	}
	if (ring.slots.length >= ring.cap) {
		// Drop the oldest voice slot (FIFO).
		ring.slots.shift();
	}
	ring.slots.push(ring.nextSlot++);
}

function voiceRingActiveCount(cls) {
	var ring = voiceRings[cls];
	return ring ? ring.slots.length : 0;
}

// ================================================================
// /xk/sphere/panic — flush every voice
// ================================================================
//
// D76 invariant: panic MUST silence all voices within one tick and
// clear voice-slot state. Bridge / OS audio scheduler may add a few
// ms before silence is audible; that's outside our control.

function panic() {
	log("PANIC — flushing all sphere voices");
	// One "steal" per class — downstream voice subpatchers respond by
	// killing their groove~ instances.
	for (var cls in POLY_BY_CLASS) {
		outlet(PLAY_OUTLET, cls, "steal");
	}
	initVoiceRings();
	pendingEchoes = {};
}

// ================================================================
// OSC inlet
// ================================================================
//
// `[udpreceive 57121]` is routed by `[route /xk/sphere/*]` upstream,
// so by the time messages arrive here the address prefix is already
// stripped. We accept the OSC-style flat list and dispatch by the
// first atom (which is the route subpath without the leading slash).

function anything() {
	var args = arrayfromarguments(arguments);
	var route = messagename;
	if (route === "strike") {
		strike(args[0], args[1], args[2], args[3], args[4]);
	} else if (route === "panic") {
		panic();
	} else {
		log("unhandled route='" + route + "' args=" + args.join(","));
	}
}

function arrayfromarguments(a) {
	var out = [];
	for (var i = 0; i < a.length; i++) out.push(a[i]);
	return out;
}

// ================================================================
// CONTROL
// ================================================================

function enable() { /* reserved — currently always on */ }
function disable() { panic(); }

// Boot log — confirms the v8 reloaded cleanly.
log("xk_sphere.js loaded — " + expectedCount + " samples expected, send bang() to load polybuffer~");
