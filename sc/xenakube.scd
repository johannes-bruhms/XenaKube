// === XenaKube SuperCollider Synthesis Engine ===
//
// Receives /xk/* OSC from relay.js on port 9000.
// 8 voices (one per vertex), each assigned a complex type C1-C8.
//
// C1-C3: grain clouds  |  C4,C8: atoms/interference  |  C5-C7: glissandi
//
// Boot: open this file in SC IDE and evaluate the whole buffer (Cmd+Enter on block).

(
s.waitForBoot {

	// ---------------------------------------------------------------
	// GLOBAL STATE
	// ---------------------------------------------------------------

	~sieveMidi = [36, 37, 39, 41, 43, 44, 48];  // default sieve as MIDI notes
	~path = \V1;
	~tetra = 0;
	~gyroDeviation = 0;
	~step = 0;

	// Per-voice state: 8 voices (indices 0-7)
	~voices = Array.fill(8, { () });  // Synth references
	~voiceType = Array.fill(8, { 1 }); // current complex type
	~voiceDensity = Array.fill(8, { 1.0 });
	~voiceGain = Array.fill(8, { 0.5 });
	~voiceDuration = Array.fill(8, { 3.0 });

	// Intensity string -> gain
	~intensityMap = Dictionary[
		"p" -> 0.15, "mp" -> 0.3, "mf" -> 0.5,
		"f" -> 0.7, "ff" -> 0.85, "fff" -> 1.0
	];

	// Sieve MIDI offset: semitone 0 = C2 = MIDI 36
	~sieveMidiOffset = 36;

	// ---------------------------------------------------------------
	// SYNTHDEFS
	// ---------------------------------------------------------------

	// --- Grain cloud (C1, C2, C3) ---
	SynthDef(\xk_grain, { |out=0, freq=200, amp=0.3, dur=0.08, pan=0|
		var sig, env;
		env = EnvGen.kr(Env.perc(0.003, dur), doneAction: 2);
		sig = SinOsc.ar(freq) * env * amp;
		sig = Pan2.ar(sig, pan);
		Out.ar(out, sig);
	}).add;

	// --- Sustained tone for atoms (C4, C8) ---
	SynthDef(\xk_atom, { |out=0, freq1=200, freq2=201, amp=0.3, gate=1|
		var sig1, sig2, env;
		env = EnvGen.kr(Env.asr(0.1, 1, 0.3), gate, doneAction: 2);
		sig1 = SinOsc.ar(freq1);
		sig2 = SinOsc.ar(freq2);
		sig1 = Pan2.ar(sig1, -0.3);
		sig2 = Pan2.ar(sig2, 0.3);
		Out.ar(out, (sig1 + sig2) * env * amp * 0.5);
	}).add;

	// --- Pizzicato burst for C4 ---
	SynthDef(\xk_pizz, { |out=0, freq=300, amp=0.5, pan=0|
		var sig, env;
		env = EnvGen.kr(Env.perc(0.001, 0.12), doneAction: 2);
		sig = SinOsc.ar(freq) + (SinOsc.ar(freq * 2) * 0.3) + (SinOsc.ar(freq * 3) * 0.1);
		sig = sig * env * amp;
		sig = Pan2.ar(sig, pan);
		Out.ar(out, sig);
	}).add;

	// --- Glissando tone (C5, C6, C7) ---
	SynthDef(\xk_gliss, { |out=0, freq=200, amp=0.3, gate=1, pan=0|
		var sig, env;
		env = EnvGen.kr(Env.asr(0.05, 1, 0.1), gate, doneAction: 2);
		sig = SinOsc.ar(\freq.kr(200, 0.05));  // lag for smooth gliss
		sig = Pan2.ar(sig, pan);
		Out.ar(out, sig * env * amp);
	}).add;

	s.sync;

	"SynthDefs loaded.".postln;

	// ---------------------------------------------------------------
	// VOICE ENGINE
	// ---------------------------------------------------------------

	// Routines for each voice (grain schedulers, gliss sequencers, etc.)
	~voiceRoutines = Array.fill(8, { nil });

	~freeVoice = { |idx|
		~voiceRoutines[idx] !? { |r| r.stop; ~voiceRoutines[idx] = nil };
		~voices[idx] !? { |s| s.set(\gate, 0); ~voices[idx] = nil };
	};

	// --- Grain scheduler (C1, C2, C3) ---
	~startGrains = { |idx, complexType, density, gain, duration|
		var sieve = ~sieveMidi.copy;
		var sieveIdx = 0, dir = 1;

		~freeVoice.(idx);

		if (complexType == 2) {
			dir = [1, -1].choose;
			sieveIdx = if(dir == 1, 0, sieve.size - 1);
		};
		if (complexType == 3) {
			sieveIdx = (sieve.size / 2).floor.asInteger;
		};

		~voiceRoutines[idx] = Routine({
			loop {
				var pitch, amp, grainDur, interval;

				if (sieve.size > 0) {
					switch(complexType,
						1, {  // C1: ataxic cloud
							pitch = sieve.choose;
							amp = gain * (0.5 + 0.5.rand);
							grainDur = rrand(0.03, 0.15);
							interval = (1.0 / density.max(0.1)) * rrand(0.5, 1.5);
						},
						2, {  // C2: ordered asc/desc
							pitch = sieve[sieveIdx];
							amp = gain;
							grainDur = rrand(0.05, 0.12);
							interval = 1.0 / density.max(0.1);
							sieveIdx = sieveIdx + dir;
							if (sieveIdx >= sieve.size) { sieveIdx = sieve.size - 1; dir = -1 };
							if (sieveIdx < 0) { sieveIdx = 0; dir = 1 };
						},
						3, {  // C3: ordered flat
							var center = (sieve.size / 2).floor.asInteger;
							var spread = min(2, (sieve.size / 4).floor.asInteger);
							var off = (spread * 2 + 1).rand - spread;
							var i = (center + off).clip(0, sieve.size - 1);
							pitch = sieve[i];
							amp = gain;
							grainDur = rrand(0.04, 0.1);
							interval = 1.0 / density.max(0.1);
						}
					);

					Synth(\xk_grain, [
						\freq, pitch.midicps,
						\amp, amp,
						\dur, grainDur,
						\pan, rrand(-0.5, 0.5)
					]);

					interval.wait;
				} {
					0.1.wait;
				};
			};
		}).play;
	};

	// --- Atom engine (C4, C8) ---
	~startAtom = { |idx, complexType, density, gain|
		var sieve = ~sieveMidi.copy;
		var pitchMidi, baseHz, detuneHz, detunedHz;

		~freeVoice.(idx);

		if (sieve.size == 0) { sieve = [36] };

		pitchMidi = if(complexType == 8,
			{ sieve[(sieve.size / 2).floor.asInteger] },
			{ sieve.choose }
		);

		baseHz = pitchMidi.midicps;
		detuneHz = 0.5 + (~gyroDeviation * 7.5);  // 0.5-8.0 Hz
		if (~path == \V2) { detuneHz = detuneHz * (1 + ~gyroDeviation) };
		detunedHz = baseHz + detuneHz;

		~voices[idx] = Synth(\xk_atom, [
			\freq1, baseHz,
			\freq2, detunedHz,
			\amp, gain
		]);

		// C4: add pizzicato triggers
		if (complexType == 4) {
			~voiceRoutines[idx] = Routine({
				loop {
					var pMidi = sieve.choose;
					var pAmp = gain * rrand(0.4, 0.8);
					Synth(\xk_pizz, [
						\freq, pMidi.midicps,
						\amp, pAmp,
						\pan, rrand(-0.7, 0.7)
					]);
					(1.0 / density.max(0.1) * rrand(0.5, 1.5)).wait;
				};
			}).play;
		};
	};

	// --- Glissando engine (C5, C6, C7) ---
	~startGliss = { |idx, complexType, density, gain|
		var sieve = ~sieveMidi.copy;
		var sieveIdx = 0, dir = 1;

		~freeVoice.(idx);

		if (sieve.size == 0) { sieve = [36] };
		sieve.sort;

		if (complexType == 6) {
			dir = [1, -1].choose;
			sieveIdx = if(dir == 1, 0, sieve.size - 1);
		};
		if (complexType == 7) {
			sieveIdx = (sieve.size / 2).floor.asInteger;
		};

		// Create a gliss synth
		~voices[idx] = Synth(\xk_gliss, [
			\freq, sieve[sieveIdx].midicps,
			\amp, gain,
			\pan, rrand(-0.5, 0.5)
		]);

		~voiceRoutines[idx] = Routine({
			var synth = ~voices[idx];
			loop {
				var startPitch, endPitch, rampTime;

				if (synth.isNil.not and: { sieve.size > 0 }) {
					switch(complexType,
						5, {  // C5: ataxic sliding
							startPitch = sieve.choose;
							endPitch = sieve.choose;
							rampTime = (1.0 / density.max(0.1)) * rrand(0.3, 1.4);
							rampTime = rampTime.max(0.05);
						},
						6, {  // C6: ordered sliding asc/desc
							startPitch = sieve[sieveIdx];
							sieveIdx = sieveIdx + dir;
							if (sieveIdx >= sieve.size) { sieveIdx = sieve.size - 2; dir = -1 };
							if (sieveIdx < 0) { sieveIdx = 1; dir = 1 };
							sieveIdx = sieveIdx.clip(0, sieve.size - 1);
							endPitch = sieve[sieveIdx];
							rampTime = 0.8 / density.max(0.1);
							rampTime = rampTime.max(0.05);
						},
						7, {  // C7: sustained sliding flat
							var center = (sieve.size / 2).floor.asInteger;
							var spread = min(2, (sieve.size / 4).floor.asInteger);
							var off = (spread * 2 + 1).rand - spread;
							endPitch = sieve[(center + off).clip(0, sieve.size - 1)];
							rampTime = 1.5 / density.max(0.1);
							rampTime = rampTime.max(0.2);
						}
					);

					synth.set(\freq, endPitch.midicps);
					rampTime.wait;
				} {
					0.1.wait;
				};
			};
		}).play;
	};

	// --- Dispatch: assign complex type to voice ---
	~updateVoice = { |idx, complexType, density, gain, duration|
		switch(complexType,
			1, { ~startGrains.(idx, 1, density, gain, duration) },
			2, { ~startGrains.(idx, 2, density, gain, duration) },
			3, { ~startGrains.(idx, 3, density, gain, duration) },
			4, { ~startAtom.(idx, 4, density, gain) },
			5, { ~startGliss.(idx, 5, density, gain) },
			6, { ~startGliss.(idx, 6, density, gain) },
			7, { ~startGliss.(idx, 7, density, gain) },
			8, { ~startAtom.(idx, 8, density, gain) }
		);
		~voiceType[idx] = complexType;
		~voiceDensity[idx] = density;
		~voiceGain[idx] = gain;
		~voiceDuration[idx] = duration;
	};

	// ---------------------------------------------------------------
	// OSC RECEIVERS
	// ---------------------------------------------------------------

	// Remove any previous responders
	OSCdef.freeAll;

	// --- Vertex parameters ---
	(1..8).do { |i|
		OSCdef(("xk_vertex_" ++ i).asSymbol, { |msg|
			// msg: [address, density(float), intensity(string), duration(float)]
			var density = msg[1].asFloat;
			var intensity = msg[2].asString;
			var duration = msg[3].asFloat;
			var gain = ~intensityMap[intensity] ? 0.5;
			var idx = i - 1;

			~voiceDensity[idx] = density;
			~voiceGain[idx] = gain;
			~voiceDuration[idx] = duration;

			// Update running synths if type hasn't changed
			~voices[idx] !? { |syn|
				syn.set(\amp, gain);
			};
		}, ("/xk/vertex/" ++ i).asString);
	};

	// --- Complex type assignments ---
	(1..8).do { |i|
		OSCdef(("xk_complex_" ++ i).asSymbol, { |msg|
			var complexType = msg[1].asInteger;
			var idx = i - 1;

			if (complexType != ~voiceType[idx]) {
				// Type changed — restart voice
				~updateVoice.(idx, complexType,
					~voiceDensity[idx],
					~voiceGain[idx],
					~voiceDuration[idx]
				);
			};
		}, ("/xk/complex/" ++ i).asString);
	};

	// --- Path (V1/V2) ---
	OSCdef(\xk_path, { |msg|
		~path = msg[1].asString.asSymbol;
	}, "/xk/path");

	// --- Cyclic phase ---
	OSCdef(\xk_cycle, { |msg|
		// Stored for reference; synthesis doesn't use directly
		~cycle = msg[1].asString.asSymbol;
	}, "/xk/cycle");

	// --- Tetrahedral orbit ---
	OSCdef(\xk_tetra, { |msg|
		~tetra = msg[1].asInteger;
	}, "/xk/tetra");

	// --- Sieve pitches (variable length) ---
	OSCdef(\xk_sieve, { |msg|
		// msg[0] = address, msg[1..] = semitone offsets
		~sieveMidi = msg[1..].collect { |st| st.asInteger + ~sieveMidiOffset };
		if (~sieveMidi.size == 0) { ~sieveMidi = [36] };
	}, "/xk/sieve");

	// --- Gyro quaternion ---
	OSCdef(\xk_gyro, { |msg|
		var x = msg[1].asFloat, y = msg[2].asFloat;
		var z = msg[3].asFloat, w = msg[4].asFloat;
		// Deviation from identity quaternion (0,0,0,1)
		~gyroDeviation = (1 - w.abs).clip(0, 1);

		// Update atom synths with new detuning
		8.do { |idx|
			if (~voiceType[idx] == 4 or: { ~voiceType[idx] == 8 }) {
				~voices[idx] !? { |syn|
					var sieve = ~sieveMidi;
					var pitchMidi = if(~voiceType[idx] == 8,
						{ sieve[(sieve.size / 2).floor.asInteger] },
						{ sieve.choose }
					);
					var baseHz = pitchMidi.midicps;
					var detuneHz = 0.5 + (~gyroDeviation * 7.5);
					if (~path == \V2) { detuneHz = detuneHz * (1 + ~gyroDeviation) };
					syn.set(\freq2, baseHz + detuneHz);
				};
			};
		};
	}, "/xk/gyro");

	// --- Group elements (K_i, C_i) ---
	OSCdef(\xk_group_k, { |msg|
		// K_i S4 element index — triggers full voice refresh
		var kGroup = msg[1].asInteger;

		// Re-evaluate all voices with current state
		8.do { |idx|
			~updateVoice.(idx, ~voiceType[idx],
				~voiceDensity[idx],
				~voiceGain[idx],
				~voiceDuration[idx]
			);
		};
	}, "/xk/group/k");

	OSCdef(\xk_group_c, { |msg|
		// C_i element — logged but complexes arrive via /xk/complex/*
	}, "/xk/group/c");

	// --- Step counter ---
	OSCdef(\xk_step, { |msg|
		~step = msg[1].asInteger;
		("XenaKube step: " ++ ~step).postln;
	}, "/xk/step");

	// --- Permutation (informational) ---
	OSCdef(\xk_perm, { |msg|
		// msg[1..8] = permutation
	}, "/xk/perm");

	// ---------------------------------------------------------------
	// CLEANUP
	// ---------------------------------------------------------------

	CmdPeriod.doOnce {
		"XenaKube: cleaning up...".postln;
		8.do { |i| ~freeVoice.(i) };
		OSCdef.freeAll;
	};

	// ---------------------------------------------------------------
	// READY
	// ---------------------------------------------------------------

	"".postln;
	"=============================================".postln;
	"  XenaKube SC Engine ready on port %".format(NetAddr.langPort).postln;
	"  Listening for /xk/* OSC on port 57120".postln;
	"=============================================".postln;
	"".postln;

};
)
