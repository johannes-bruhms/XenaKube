// xk_spectrum.js
//
// Optional Max v8 helper for formatting post-audio FFT analysis into
// XenaKube spectrum frames. This file does not edit or assume any patcher
// topology. Wire its outlet to [udpsend 127.0.0.1 57122] when you are ready
// to build the Max-side analyzer. Address text comes from gen_includes.js.

autowatch = 1;
inlets = 1;
outlets = 1;

include("gen_includes.js");

setinletassist(0, "spectrum frame/list/config messages");
setoutletassist(0, "OSC.SPECTRUM_FRAME -> [udpsend 127.0.0.1 57122]");

var enabled = 1;
var frameId = 0;
var activeComplex = 0;
var binCount = 96;
var minHz = 40;
var maxHz = 6000;
var analysisLatencyMs = 0;
var timeOriginMs = Date.now();
var rawFftSize = 1024;
var rawSampleRate = 48000;
var rawPositiveBins = 512;
var rawGainDb = 45;
var prevRawBinsDb = [];

function clamp(v, lo, hi) {
  v = Number(v);
  if (!isFinite(v)) return lo;
  return Math.max(lo, Math.min(hi, v));
}

function nowAudioTimeMs() {
  return (Date.now() - timeOriginMs) + 0.001;
}

function audioTimeOrNow(v) {
  v = Number(v);
  return isFinite(v) ? v : nowAudioTimeMs();
}

function enable(v) {
  enabled = Number(v) !== 0 ? 1 : 0;
  post("xk_spectrum enabled=" + enabled + "\n");
}

function complex(v) {
  activeComplex = clamp(v, 0, 8) | 0;
}

function config(count, loHz, hiHz, latencyMs) {
  binCount = clamp(count, 1, 256) | 0;
  minHz = Math.max(1, Number(loHz) || minHz);
  maxHz = Math.max(minHz + 1, Number(hiHz) || maxHz);
  analysisLatencyMs = clamp(latencyMs, 0, 2000);
  post("xk_spectrum config bins=" + binCount + " range=" + minHz + ".." + maxHz + " latencyMs=" + analysisLatencyMs + "\n");
}

function rawconfig(fftSize, sampleRate, positiveBins, outBins, loHz, hiHz, gainDb, latencyMs) {
  rawFftSize = clamp(fftSize, 64, 32768) | 0;
  rawSampleRate = clamp(sampleRate, 1000, 384000);
  rawPositiveBins = clamp(positiveBins, 1, rawFftSize / 2) | 0;
  rawGainDb = clamp(gainDb, -96, 96);
  config(outBins || binCount, loHz || minHz, hiHz || maxHz, latencyMs == null ? analysisLatencyMs : latencyMs);
  prevRawBinsDb = [];
}

function samplerate(v) {
  rawSampleRate = clamp(v, 1000, 384000);
}

function fftsize(v) {
  rawFftSize = clamp(v, 64, 32768) | 0;
  rawPositiveBins = Math.min(rawPositiveBins, rawFftSize / 2) | 0;
}

function gain(v) {
  rawGainDb = clamp(v, -96, 96);
}

function emitFrame(id, audioTimeMs, latencyMs, cmx, count, loHz, hiHz, rmsDb, peakDb, centroidHz, flux, stereoWidth, bins) {
  if (!enabled) return;
  var n = Math.min(clamp(count, 1, 256) | 0, bins.length);
  if (n <= 0) return;
  var payload = [
    OSC.SPECTRUM_FRAME,
    id | 0,
    audioTimeOrNow(audioTimeMs),
    clamp(latencyMs, 0, 2000),
    clamp(cmx, 0, 8) | 0,
    n,
    Math.max(1, Number(loHz) || minHz),
    Math.max(2, Number(hiHz) || maxHz),
    clamp(rmsDb, -160, 24),
    clamp(peakDb, -160, 24),
    Math.max(0, Number(centroidHz) || 0),
    Math.max(0, Number(flux) || 0),
    clamp(stereoWidth, 0, 1)
  ];
  for (var i = 0; i < n; i++) payload.push(clamp(bins[i], -160, 24));
  outlet.apply(this, [0].concat(payload));
}

// Full schema packet without the OSC address:
// frameId audioTimeMs analysisLatencyMs complex binCount minHz maxHz
// rmsDb peakDb centroidHz flux stereoWidth binDb...
function frame() {
  var a = arrayfromargs(arguments);
  if (a.length < 13) {
    post("xk_spectrum frame needs 12 header atoms plus bins\n");
    return;
  }
  emitFrame(a[0], a[1], a[2], a[3], a[4], a[5], a[6], a[7], a[8], a[9], a[10], a[11], a.slice(12));
}

// Short packet for an analyzer that keeps config in this helper:
// rmsDb peakDb centroidHz flux stereoWidth binDb...
function bins() {
  var a = arrayfromargs(arguments);
  if (a.length < 6) {
    post("xk_spectrum bins needs rms peak centroid flux stereoWidth plus bins\n");
    return;
  }
  frameId = (frameId + 1) | 0;
  emitFrame(
    frameId,
    nowAudioTimeMs(),
    analysisLatencyMs,
    activeComplex,
    Math.min(binCount, a.length - 5),
    minHz,
    maxHz,
    a[0],
    a[1],
    a[2],
    a[3],
    a[4],
    a.slice(5)
  );
}

function magToDb(mag) {
  var norm = Math.max(1e-12, Math.abs(Number(mag) || 0) / Math.max(1, rawFftSize * 0.5));
  return clamp(20 * Math.log(norm) / Math.LN10 + rawGainDb, -160, 24);
}

function rawbins() {
  var raw = arrayfromargs(arguments);
  var rawN = Math.min(raw.length, rawPositiveBins);
  if (rawN <= 0) {
    post("xk_spectrum rawbins needs FFT magnitude values\n");
    return;
  }

  var outN = clamp(binCount, 1, 256) | 0;
  var binHz = rawSampleRate / Math.max(1, rawFftSize);
  var ratio = maxHz / Math.max(1, minHz);
  var out = new Array(outN);
  var totalPower = 0;
  var weightedHz = 0;
  var peakDb = -160;
  var flux = 0;

  for (var i = 0; i < outN; i++) {
    var lo = minHz * Math.pow(ratio, i / outN);
    var hi = minHz * Math.pow(ratio, (i + 1) / outN);
    var loIdx = Math.max(1, Math.min(rawN - 1, Math.floor(lo / binHz)));
    var hiIdx = Math.max(loIdx, Math.min(rawN - 1, Math.ceil(hi / binHz)));
    var sumSq = 0;
    var count = 0;
    for (var j = loIdx; j <= hiIdx; j++) {
      var m = Number(raw[j]) || 0;
      sumSq += m * m;
      count++;
    }
    var mag = Math.sqrt(sumSq / Math.max(1, count));
    var db = magToDb(mag);
    out[i] = db;
    if (db > peakDb) peakDb = db;
    var power = Math.pow(10, db / 10);
    var centerHz = Math.sqrt(lo * hi);
    totalPower += power;
    weightedHz += centerHz * power;
    if (prevRawBinsDb.length === outN) {
      var delta = db - prevRawBinsDb[i];
      if (delta > 0) flux += delta;
    }
  }

  prevRawBinsDb = out.slice(0);
  var rmsDb = totalPower > 0 ? clamp(10 * Math.log(totalPower / outN) / Math.LN10, -160, 24) : -160;
  var centroidHz = totalPower > 0 ? weightedHz / totalPower : 0;

  frameId = (frameId + 1) | 0;
  emitFrame(
    frameId,
    nowAudioTimeMs(),
    analysisLatencyMs,
    activeComplex,
    outN,
    minHz,
    maxHz,
    rmsDb,
    peakDb,
    centroidHz,
    flux / Math.max(1, outN),
    0,
    out
  );
}

function list() {
  frame.apply(this, arrayfromargs(arguments));
}

function bang() {
  post("xk_spectrum ready: send config <bins> <minHz> <maxHz> <latencyMs>, complex <0..8>, then bins <rmsDb> <peakDb> <centroidHz> <flux> <stereoWidth> <binDb...> or rawbins <fftMagnitudes...>\n");
}
