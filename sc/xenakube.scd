// === XenaKube SuperCollider Synthesis Engine ===
//
// Sequential single-voice model (faithful to Xenakis' Nomos Alpha).
// One vertex active at a time — each cube turn advances to the next vertex.
// The active vertex's D/G/U params + C_i complex type determine the single voice.
//
// Receives /xk/* OSC from relay.js on port 57120.
//
// Boot: open in SC IDE, Cmd+B to boot server, Cmd+A then Cmd+Enter.

(
s.waitForBoot {

	// ---------------------------------------------------------------
	// GLOBAL STATE
	// ---------------------------------------------------------------

	~sieveMidi = [36, 37, 39, 41, 43, 44, 48];
	~path = \V1;
	~tetra = 0;
	~gyroDeviation = 0;
	~step = 0;

	// Single active voice state
	~activeIdx = 0;
	~activeVoice = nil;
	~activeRoutine = nil;
	~activeType = 0;

	~intensityMap = Dictionary[
		"p" -> 0.12, "mp" -> 0.22, "mf" -> 0.35,
		"f" -> 0.5, "ff" -> 0.65, "fff" -> 0.8
	];

	~sieveMidiOffset = 36;

	// ---------------------------------------------------------------
	// BUSSES
	// ---------------------------------------------------------------

	~reverbBus = Bus.audio(s, 2);

	// ---------------------------------------------------------------
	// SYNTHDEFS
	// ---------------------------------------------------------------

	// --- C1: Pizzicato / col legno scatter ---
	SynthDef(\xk_pizz, { |out=0, freq=200, amp=0.3, pan=0, revSend=0.15|
		var exc, body, env, sig;
		env = EnvGen.kr(Env.perc(0.001, 0.18, 1, -8), doneAction: 2);
		exc = WhiteNoise.ar * EnvGen.kr(Env.perc(0.0005, 0.008));
		body = Ringz.ar(exc, [freq, freq * 2.02, freq * 3.01], [0.15, 0.08, 0.05]);
		body = body.sum * 0.4;
		body = body + (Pluck.ar(WhiteNoise.ar(0.1), Impulse.kr(0), freq.reciprocal, freq.reciprocal, 0.2, 0.3) * 0.5);
		sig = body * env * amp;
		sig = Pan2.ar(sig, pan);
		Out.ar(out, sig);
		Out.ar(\revBus.kr(0), sig * revSend);
	}).add;

	// --- C2/C3: Bowed string ---
	SynthDef(\xk_bowed, { |out=0, freq=200, amp=0.3, gate=1, pan=0, bright=0.5, revSend=0.25|
		var sig, bow, body, env, vibFreq, vibDepth, filt;
		env = EnvGen.kr(Env.asr(0.08, 1, 0.15), gate, doneAction: 2);
		vibFreq = LFNoise1.kr(0.3).range(4.5, 6.0);
		vibDepth = freq * LFNoise1.kr(0.2).range(0.002, 0.006);
		sig = LFSaw.ar(freq + SinOsc.kr(vibFreq, 0, vibDepth)) * 0.4;
		bow = LPF.ar(BrownNoise.ar(0.08), freq * 3);
		sig = sig + bow;
		filt = bright.linlin(0, 1, freq * 2, freq * 8);
		sig = LPF.ar(sig, filt);
		sig = BPeakEQ.ar(sig, freq, 0.8, 4);
		sig = sig * env * amp;
		sig = Pan2.ar(sig, pan);
		Out.ar(out, sig);
		Out.ar(\revBus.kr(0), sig * revSend);
	}).add;

	// --- C4: Harmonics ---
	SynthDef(\xk_harmonic, { |out=0, freq=200, amp=0.3, gate=1, pan=0, revSend=0.35|
		var sig, env, shimmer;
		env = EnvGen.kr(Env.asr(0.15, 1, 0.4), gate, doneAction: 2);
		sig = SinOsc.ar(freq * 2) * 0.5;
		sig = sig + (SinOsc.ar(freq * 3.01) * 0.25);
		sig = sig + (SinOsc.ar(freq * 4.005) * 0.12);
		shimmer = LFNoise2.kr(3).range(0.7, 1.0);
		sig = sig * shimmer * env * amp;
		sig = Pan2.ar(sig, pan);
		Out.ar(out, sig);
		Out.ar(\revBus.kr(0), sig * revSend);
	}).add;

	// --- C4 pizz interrupt: col legno ---
	SynthDef(\xk_colLegno, { |out=0, freq=300, amp=0.4, pan=0, revSend=0.1|
		var sig, env;
		env = EnvGen.kr(Env.perc(0.0005, 0.07, 1, -12), doneAction: 2);
		sig = HPF.ar(WhiteNoise.ar, 800) * env;
		sig = sig + (Ringz.ar(Impulse.ar(0), freq * 1.5, 0.03) * 0.5);
		sig = sig * amp;
		sig = Pan2.ar(sig, pan);
		Out.ar(out, sig);
		Out.ar(\revBus.kr(0), sig * revSend);
	}).add;

	// --- C5/C6/C7: Glissando string ---
	SynthDef(\xk_gliss, { |out=0, freq=200, amp=0.3, gate=1, pan=0, lagTime=0.08, bright=0.6, revSend=0.2|
		var sig, env, lFreq, bow;
		env = EnvGen.kr(Env.asr(0.04, 1, 0.12), gate, doneAction: 2);
		lFreq = \freq.kr(200, lagTime);
		sig = LFSaw.ar(lFreq) * 0.3;
		sig = sig + (SinOsc.ar(lFreq * 1.001, SinOsc.ar(lFreq * 0.999) * 0.3) * 0.15);
		bow = BPF.ar(PinkNoise.ar(0.15), lFreq * 2.5, 0.4);
		sig = sig + bow;
		sig = LPF.ar(sig, lFreq * bright.linlin(0, 1, 3, 10));
		sig = sig * env * amp;
		sig = Pan2.ar(sig, pan);
		Out.ar(out, sig);
		Out.ar(\revBus.kr(0), sig * revSend);
	}).add;

	// --- C8: Sul ponticello beating ---
	SynthDef(\xk_ponticello, { |out=0, freq1=200, freq2=201, amp=0.3, gate=1, revSend=0.2|
		var sig1, sig2, env, trem, sig;
		env = EnvGen.kr(Env.asr(0.06, 1, 0.2), gate, doneAction: 2);
		trem = LFNoise2.kr(8).range(0.6, 1.0);
		sig1 = Pulse.ar(freq1, LFNoise1.kr(0.3).range(0.35, 0.5)) * 0.2;
		sig2 = Pulse.ar(freq2, LFNoise1.kr(0.4).range(0.35, 0.5)) * 0.2;
		sig = sig1 + sig2;
		sig = HPF.ar(sig, freq1 * 1.5);
		sig = sig + (BPF.ar(sig, freq1 * 5, 0.3) * 2);
		sig = sig * trem * env * amp;
		sig = Balance2.ar(sig, DelayN.ar(sig, 0.001, 0.0007), 0);
		Out.ar(out, sig);
		Out.ar(\revBus.kr(0), sig * revSend);
	}).add;

	// --- Reverb ---
	SynthDef(\xk_reverb, { |in=0, out=0, mix=0.3, room=0.6, damp=0.5|
		var sig, wet;
		sig = In.ar(in, 2);
		wet = FreeVerb2.ar(sig[0], sig[1], mix, room, damp);
		Out.ar(out, wet);
	}).add;

	// --- Master limiter ---
	SynthDef(\xk_master, { |in=0, out=0, level=0.85|
		var sig;
		sig = In.ar(in, 2);
		ReplaceOut.ar(out, Limiter.ar(sig, level, 0.01));
	}).add;

	s.sync;

	~reverbSynth = Synth(\xk_reverb, [\in, ~reverbBus, \out, 0, \mix, 0.25, \room, 0.5, \damp, 0.45], s, \addToTail);
	~masterSynth = Synth(\xk_master, [\out, 0, \level, 0.85], s, \addToTail);

	s.sync;
	"SynthDefs loaded, reverb + limiter running.".postln;

	// ---------------------------------------------------------------
	// SINGLE-VOICE ENGINE
	// ---------------------------------------------------------------

	// Pan position based on active vertex index (spread across stereo)
	~voicePan = [-0.7, -0.4, -0.15, 0.1, 0.3, 0.5, 0.65, 0.8];

	~freeActive = {
		~activeRoutine !? { |r| r.stop; ~activeRoutine = nil };
		~activeVoice !? { |syn| syn.set(\gate, 0); ~activeVoice = nil };
	};

	// --- C1: Ataxic pizzicato scatter ---
	~startC1 = { |gain, duration, density|
		var sieve = ~sieveMidi.copy;
		var pan = ~voicePan[~activeIdx];
		~freeActive.();

		~activeRoutine = Routine({
			loop {
				if (sieve.size > 0) {
					var pitch = sieve.choose;
					var amp = gain * rrand(0.3, 1.0);
					Synth(\xk_pizz, [
						\freq, pitch.midicps,
						\amp, amp,
						\pan, pan + rrand(-0.15, 0.15),
						\revBus, ~reverbBus
					]);
					((1.0 / density.max(0.1)) * rrand(0.3, 2.0)).wait;
				} {
					0.2.wait;
				};
			};
		}).play;
	};

	// --- C2: Bowed cloud, ascending/descending ---
	~startC2 = { |gain, duration, density|
		var sieve = ~sieveMidi.copy.sort;
		var sieveIdx = 0, dir = [1, -1].choose;
		var pan = ~voicePan[~activeIdx];
		~freeActive.();

		if (sieve.size == 0) { sieve = [36] };
		sieveIdx = if(dir == 1, 0, sieve.size - 1);

		~activeRoutine = Routine({
			loop {
				var pitch, holdTime;
				pitch = sieve[sieveIdx];
				holdTime = (1.0 / density.max(0.1)) * rrand(0.6, 1.2);

				~activeVoice !? { |old| old.set(\gate, 0) };
				~activeVoice = Synth(\xk_bowed, [
					\freq, pitch.midicps,
					\amp, gain,
					\pan, pan,
					\bright, 0.6,
					\revBus, ~reverbBus
				]);

				sieveIdx = sieveIdx + dir;
				if (sieveIdx >= sieve.size) { sieveIdx = sieve.size - 1; dir = -1 };
				if (sieveIdx < 0) { sieveIdx = 0; dir = 1 };

				holdTime.wait;
			};
		}).play;
	};

	// --- C3: Bowed sustained, roughly constant pitch ---
	~startC3 = { |gain, duration, density|
		var sieve = ~sieveMidi.copy;
		var center, pitch, pan = ~voicePan[~activeIdx];
		~freeActive.();

		if (sieve.size == 0) { sieve = [36] };
		center = (sieve.size / 2).floor.asInteger;
		pitch = sieve[center];

		~activeVoice = Synth(\xk_bowed, [
			\freq, pitch.midicps,
			\amp, gain,
			\pan, pan,
			\bright, 0.35,
			\revBus, ~reverbBus
		]);
	};

	// --- C4: Harmonics + col legno interrupts ---
	~startC4 = { |gain, duration, density|
		var sieve = ~sieveMidi.copy;
		var pitch, pan = ~voicePan[~activeIdx];
		~freeActive.();

		if (sieve.size == 0) { sieve = [36] };
		pitch = sieve.choose;

		~activeVoice = Synth(\xk_harmonic, [
			\freq, pitch.midicps,
			\amp, gain * 0.7,
			\pan, pan,
			\revBus, ~reverbBus
		]);

		~activeRoutine = Routine({
			loop {
				var pMidi = sieve.choose;
				Synth(\xk_colLegno, [
					\freq, pMidi.midicps,
					\amp, gain * rrand(0.3, 0.7),
					\pan, pan + rrand(-0.2, 0.2),
					\revBus, ~reverbBus
				]);
				((1.0 / density.max(0.1)) * rrand(0.5, 2.5)).wait;
			};
		}).play;
	};

	// --- C5: Ataxic sliding (wild glissandi) ---
	~startC5 = { |gain, duration, density|
		var sieve = ~sieveMidi.copy.sort;
		var pan = ~voicePan[~activeIdx];
		~freeActive.();

		if (sieve.size == 0) { sieve = [36] };

		~activeVoice = Synth(\xk_gliss, [
			\freq, sieve.choose.midicps,
			\amp, gain,
			\pan, pan,
			\lagTime, 0.12,
			\bright, 0.7,
			\revBus, ~reverbBus
		]);

		~activeRoutine = Routine({
			var syn = ~activeVoice;
			loop {
				if (syn.notNil and: { sieve.size > 0 }) {
					var target = sieve.choose;
					var rampTime = (1.0 / density.max(0.1)) * rrand(0.2, 1.5);
					rampTime = rampTime.max(0.05);
					syn.set(\freq, target.midicps, \lagTime, rampTime * 0.8);
					rampTime.wait;
				} {
					0.2.wait;
				};
			};
		}).play;
	};

	// --- C6: Ordered sliding asc/desc ---
	~startC6 = { |gain, duration, density|
		var sieve = ~sieveMidi.copy.sort;
		var sieveIdx = 0, dir = [1, -1].choose;
		var pan = ~voicePan[~activeIdx];
		~freeActive.();

		if (sieve.size == 0) { sieve = [36] };
		sieveIdx = if(dir == 1, 0, sieve.size - 1);

		~activeVoice = Synth(\xk_gliss, [
			\freq, sieve[sieveIdx].midicps,
			\amp, gain,
			\pan, pan,
			\lagTime, 0.15,
			\bright, 0.6,
			\revBus, ~reverbBus
		]);

		~activeRoutine = Routine({
			var syn = ~activeVoice;
			loop {
				if (syn.notNil and: { sieve.size > 0 }) {
					var rampTime = (0.8 / density.max(0.1)).max(0.05);
					sieveIdx = sieveIdx + dir;
					if (sieveIdx >= sieve.size) { sieveIdx = sieve.size - 2; dir = -1 };
					if (sieveIdx < 0) { sieveIdx = 1; dir = 1 };
					sieveIdx = sieveIdx.clip(0, sieve.size - 1);
					syn.set(\freq, sieve[sieveIdx].midicps, \lagTime, rampTime * 0.7);
					rampTime.wait;
				} {
					0.2.wait;
				};
			};
		}).play;
	};

	// --- C7: Sustained sliding, roughly flat (sul tasto) ---
	~startC7 = { |gain, duration, density|
		var sieve = ~sieveMidi.copy.sort;
		var center, pan = ~voicePan[~activeIdx];
		~freeActive.();

		if (sieve.size == 0) { sieve = [36] };
		center = (sieve.size / 2).floor.asInteger;

		~activeVoice = Synth(\xk_gliss, [
			\freq, sieve[center].midicps,
			\amp, gain,
			\pan, pan,
			\lagTime, 0.5,
			\bright, 0.3,
			\revBus, ~reverbBus
		]);

		~activeRoutine = Routine({
			var syn = ~activeVoice;
			loop {
				if (syn.notNil and: { sieve.size > 0 }) {
					var spread = min(2, (sieve.size / 4).floor.asInteger);
					var off = (spread * 2 + 1).rand - spread;
					var target = sieve[(center + off).clip(0, sieve.size - 1)];
					var rampTime = (1.5 / density.max(0.1)).max(0.3);
					syn.set(\freq, target.midicps, \lagTime, rampTime * 0.9);
					rampTime.wait;
				} {
					0.3.wait;
				};
			};
		}).play;
	};

	// --- C8: Sul ponticello beating ---
	~startC8 = { |gain, duration, density|
		var sieve = ~sieveMidi.copy;
		var pitchMidi, baseHz, detuneHz;
		~freeActive.();

		if (sieve.size == 0) { sieve = [36] };
		pitchMidi = sieve[(sieve.size / 2).floor.asInteger];
		baseHz = pitchMidi.midicps;
		detuneHz = 0.5 + (~gyroDeviation * 7.5);
		if (~path == \V2) { detuneHz = detuneHz * (1 + ~gyroDeviation) };

		~activeVoice = Synth(\xk_ponticello, [
			\freq1, baseHz,
			\freq2, baseHz + detuneHz,
			\amp, gain,
			\revBus, ~reverbBus
		]);
	};

	// --- Dispatch: start a single voice with given complex type + params ---
	~startVoice = { |complexType, density, gain, duration|
		("  voice: C" ++ complexType ++ " d:" ++ density ++ " g:" ++ gain.round(0.01) ++ " dur:" ++ duration).postln;
		switch(complexType,
			1, { ~startC1.(gain, duration, density) },
			2, { ~startC2.(gain, duration, density) },
			3, { ~startC3.(gain, duration, density) },
			4, { ~startC4.(gain, duration, density) },
			5, { ~startC5.(gain, duration, density) },
			6, { ~startC6.(gain, duration, density) },
			7, { ~startC7.(gain, duration, density) },
			8, { ~startC8.(gain, duration, density) }
		);
		~activeType = complexType;
	};

	// ---------------------------------------------------------------
	// OSC RECEIVERS
	// ---------------------------------------------------------------

	OSCdef.freeAll;

	// --- Combined voice message: the primary driver ---
	// /xk/voice vertexIdx complexType density intensity duration
	OSCdef(\xk_voice, { |msg|
		var vtxIdx = msg[1].asInteger;
		var complexType = msg[2].asInteger;
		var density = msg[3].asFloat;
		var intensity = msg[4].asString;
		var duration = msg[5].asFloat;
		var gain = ~intensityMap[intensity] ? 0.35;

		~activeIdx = vtxIdx;
		("XenaKube → K" ++ (vtxIdx + 1) ++ " active").postln;
		~startVoice.(complexType, density, gain, duration);
	}, "/xk/voice");

	// --- Active vertex index (informational) ---
	OSCdef(\xk_active, { |msg|
		~activeIdx = msg[1].asInteger;
	}, "/xk/active");

	// --- Path (V1/V2) ---
	OSCdef(\xk_path, { |msg|
		~path = msg[1].asString.asSymbol;
	}, "/xk/path");

	// --- Cyclic phase ---
	OSCdef(\xk_cycle, { |msg|
		~cycle = msg[1].asString.asSymbol;
	}, "/xk/cycle");

	// --- Tetrahedral orbit ---
	OSCdef(\xk_tetra, { |msg|
		~tetra = msg[1].asInteger;
		~reverbSynth.set(
			\room, if(~tetra == 0, 0.55, 0.3),
			\damp, if(~tetra == 0, 0.4, 0.7)
		);
	}, "/xk/tetra");

	// --- Sieve pitches ---
	OSCdef(\xk_sieve, { |msg|
		~sieveMidi = msg[1..].collect { |st| st.asInteger + ~sieveMidiOffset };
		if (~sieveMidi.size == 0) { ~sieveMidi = [36] };
	}, "/xk/sieve");

	// --- Gyro quaternion ---
	OSCdef(\xk_gyro, { |msg|
		var x = msg[1].asFloat, y = msg[2].asFloat;
		var z = msg[3].asFloat, w = msg[4].asFloat;
		~gyroDeviation = (1 - w.abs).clip(0, 1);

		// Live-update active voice if it's C8 (ponticello detuning) or C5 (brightness)
		if (~activeType == 8) {
			~activeVoice !? { |syn|
				var sieve = ~sieveMidi;
				var pitchMidi = sieve[(sieve.size / 2).floor.asInteger];
				var baseHz = pitchMidi.midicps;
				var detuneHz = 0.5 + (~gyroDeviation * 7.5);
				if (~path == \V2) { detuneHz = detuneHz * (1 + ~gyroDeviation) };
				syn.set(\freq2, baseHz + detuneHz);
			};
		};
		if (~activeType == 5) {
			~activeVoice !? { |syn|
				syn.set(\bright, 0.4 + (~gyroDeviation * 0.5));
			};
		};
	}, "/xk/gyro");

	// --- Group elements (informational) ---
	OSCdef(\xk_group_k, { |msg| }, "/xk/group/k");
	OSCdef(\xk_group_c, { |msg| }, "/xk/group/c");

	// --- Vertex params (informational — voice msg is primary) ---
	(1..8).do { |i|
		OSCdef(("xk_vertex_" ++ i).asSymbol, { |msg| }, ("/xk/vertex/" ++ i).asString);
	};

	// --- Complex assignments (informational) ---
	(1..8).do { |i|
		OSCdef(("xk_complex_" ++ i).asSymbol, { |msg| }, ("/xk/complex/" ++ i).asString);
	};

	// --- Step counter ---
	OSCdef(\xk_step, { |msg|
		~step = msg[1].asInteger;
		("XenaKube step: " ++ ~step).postln;
	}, "/xk/step");

	// --- Permutation (informational) ---
	OSCdef(\xk_perm, { |msg| }, "/xk/perm");

	// ---------------------------------------------------------------
	// CLEANUP
	// ---------------------------------------------------------------

	CmdPeriod.doOnce {
		"XenaKube: cleaning up...".postln;
		~freeActive.();
		~reverbBus.free;
		OSCdef.freeAll;
	};

	// ---------------------------------------------------------------
	// READY
	// ---------------------------------------------------------------

	"".postln;
	"=============================================".postln;
	"  XenaKube SC Engine ready".postln;
	"  SEQUENTIAL MODE: one voice at a time".postln;
	"  Listening for /xk/* OSC on port %".format(NetAddr.langPort).postln;
	"  Reverb + limiter active".postln;
	"=============================================".postln;
	"".postln;

};
)
