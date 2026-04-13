{
	"patcher" : 	{
		"fileversion" : 1,
		"appversion" : 		{
			"major" : 8,
			"minor" : 6,
			"revision" : 5,
			"architecture" : "x64",
			"modernui" : 1
		}
,
		"classnamespace" : "box",
		"rect" : [ 73.0, 134.0, 1363.0, 904.0 ],
		"bglocked" : 0,
		"openinpresentation" : 0,
		"default_fontsize" : 12.0,
		"default_fontface" : 0,
		"default_fontname" : "Arial",
		"gridonopen" : 1,
		"gridsize" : [ 15.0, 15.0 ],
		"gridsnaponopen" : 1,
		"objectsnaponopen" : 1,
		"statusbarvisible" : 2,
		"toolbarvisible" : 1,
		"lefttoolbarpinned" : 0,
		"toptoolbarpinned" : 0,
		"righttoolbarpinned" : 0,
		"bottomtoolbarpinned" : 0,
		"toolbars_unpinned_last_save" : 0,
		"tallnewobj" : 0,
		"boxanimatetime" : 200,
		"enablehscroll" : 1,
		"enablevscroll" : 1,
		"devicewidth" : 0.0,
		"description" : "",
		"digest" : "",
		"tags" : "",
		"style" : "",
		"subpatcher_template" : "",
		"assistshowspatchername" : 0,
		"boxes" : [ 			{
				"box" : 				{
					"id" : "obj-95",
					"maxclass" : "newobj",
					"numinlets" : 0,
					"numoutlets" : 0,
					"patcher" : 					{
						"fileversion" : 1,
						"appversion" : 						{
							"major" : 8,
							"minor" : 6,
							"revision" : 5,
							"architecture" : "x64",
							"modernui" : 1
						}
,
						"classnamespace" : "box",
						"rect" : [ 34.0, 77.0, 1980.0, 1001.0 ],
						"bglocked" : 0,
						"openinpresentation" : 0,
						"default_fontsize" : 12.0,
						"default_fontface" : 0,
						"default_fontname" : "Arial",
						"gridonopen" : 1,
						"gridsize" : [ 15.0, 15.0 ],
						"gridsnaponopen" : 1,
						"objectsnaponopen" : 1,
						"statusbarvisible" : 2,
						"toolbarvisible" : 1,
						"lefttoolbarpinned" : 0,
						"toptoolbarpinned" : 0,
						"righttoolbarpinned" : 0,
						"bottomtoolbarpinned" : 0,
						"toolbars_unpinned_last_save" : 0,
						"tallnewobj" : 0,
						"boxanimatetime" : 200,
						"enablehscroll" : 1,
						"enablevscroll" : 1,
						"devicewidth" : 0.0,
						"description" : "",
						"digest" : "",
						"tags" : "",
						"style" : "",
						"subpatcher_template" : "",
						"assistshowspatchername" : 0,
						"visible" : 1,
						"boxes" : [ 							{
								"box" : 								{
									"id" : "obj-8",
									"linecount" : 44,
									"maxclass" : "comment",
									"numinlets" : 1,
									"numoutlets" : 0,
									"patching_rect" : [ 824.0, 352.0, 563.0, 614.0 ],
									"text" : "Complex Type → SWAM Technique Mode\n\n  C1 (ataxic cloud)      → Play Mode: Pizz, random bow/pizz position per note\n  C2 (ordered asc/desc)  → Play Mode: Bow, normal bowing, Bow Change on each note\n  C3 (ordered flat)      → Play Mode: Bow, sustained legato, no bow change\n  C4 (harmonics)         → Harmonics: ON, Harmonics 4 Control from density\n  C5 (ataxic sliding)    → Play Mode: Bow, Pitch Bend active, wide random gliss\n  C6 (ordered sliding)   → Play Mode: Bow, Pitch Bend active, stepwise gliss through\n  sieve\n  C7 (sustained sliding) → Play Mode: Bow, Pitch Bend active, slow narrow drift\n  C8 (ponticello)        → Bow/Pizz Position: ~0.9 (near bridge), Tremolo: ON\n\n  Per-Turn Parameters → SWAM\n\n  intensity (p/mp/mf/f/ff/fff) → Expression (0.12–0.8, same scale you already use)\n  density                      → Attack Ramp Speed (high density = fast attack, low =\n  slow)\n  duration                     → note length (gate time before note-off)\n  sieve                        → MIDI note pool (pick pitch by active vertex cycling)\n\n  Continuous Gyro → SWAM (these need /xk/expr/ from Phase 3)*\n\n  tilt (0-1)      → Expression (override/blend with intensity — physical gesture\n  controls dynamics)\n  spin (0-1)      → Vibrato Depth (0 = none, 1 = wide, maps to 0.0–1.0)\n  deviation (0-1) → Bow Pressure (locked on S4 = clean tone, off-axis =\n  gritty/pressed)\n  scramble (0-1)  → Bow/Pizz Position toward bridge (solved = normal pos, scrambled =\n  sul ponticello edge)\n\n  Structural → SWAM\n\n  tetra orbit even → Bowing Sensitivity normal (0.5), warmer tone\n  tetra orbit odd  → Bowing Sensitivity high (0.8), more reactive/edgy\n  path V1          → Transpose: 0 (normal cello range)\n  path V2          → Transpose: -12 (an octave lower, matches V2's longer durations)\n  regime           → behavior switch (contemplative = one note at a time,\n                     conversational = Bow Polyphony: Mono String Crossing for\n  overlaps,\n                     burst = Tremolo ON, Tremolo Min Speed from turn rate)\n\n  The solve arc maps beautifully: scramble 1.0 = pressed bowing near the bridge, heavy\n   vibrato, harmonics off — raw and tense. As you solve toward 0.0 = clean position,\n  steady bow, pure tone. The cube solve IS the musical resolution."
								}

							}
, 							{
								"box" : 								{
									"id" : "obj-3",
									"maxclass" : "message",
									"numinlets" : 2,
									"numoutlets" : 1,
									"outlettype" : [ "" ],
									"patching_rect" : [ 663.333333333333371, 620.0, 96.0, 22.0 ],
									"presentation_linecount" : 2,
									"text" : "contemplative"
								}

							}
, 							{
								"box" : 								{
									"id" : "obj-5",
									"maxclass" : "message",
									"numinlets" : 2,
									"numoutlets" : 1,
									"outlettype" : [ "" ],
									"patching_rect" : [ 631.666666666666629, 596.0, 70.0, 22.0 ],
									"text" : "0.000704"
								}

							}
, 							{
								"box" : 								{
									"id" : "obj-6",
									"maxclass" : "message",
									"numinlets" : 2,
									"numoutlets" : 1,
									"outlettype" : [ "" ],
									"patching_rect" : [ 590.607142746448517, 572.0, 53.392857253551483, 22.0 ],
									"text" : "6"
								}

							}
, 							{
								"box" : 								{
									"id" : "obj-93",
									"maxclass" : "newobj",
									"numinlets" : 0,
									"numoutlets" : 1,
									"outlettype" : [ "" ],
									"patching_rect" : [ 625.0, 524.0, 65.0, 22.0 ],
									"text" : "r osc-main"
								}

							}
, 							{
								"box" : 								{
									"id" : "obj-94",
									"maxclass" : "newobj",
									"numinlets" : 1,
									"numoutlets" : 4,
									"outlettype" : [ "", "", "", "" ],
									"patching_rect" : [ 625.0, 548.0, 192.0, 22.0 ],
									"text" : "OSC-route /scramble /rate /regime"
								}

							}
, 							{
								"box" : 								{
									"id" : "obj-91",
									"maxclass" : "newobj",
									"numinlets" : 1,
									"numoutlets" : 2,
									"outlettype" : [ "", "" ],
									"patching_rect" : [ 359.0, 548.0, 99.0, 22.0 ],
									"text" : "OSC-route /snap"
								}

							}
, 							{
								"box" : 								{
									"id" : "obj-85",
									"maxclass" : "message",
									"numinlets" : 2,
									"numoutlets" : 1,
									"outlettype" : [ "" ],
									"patching_rect" : [ 445.0, 620.0, 84.821427762508392, 22.0 ],
									"text" : "2 3 2.5 fff 5"
								}

							}
, 							{
								"box" : 								{
									"id" : "obj-86",
									"maxclass" : "message",
									"numinlets" : 2,
									"numoutlets" : 1,
									"outlettype" : [ "" ],
									"patching_rect" : [ 414.0, 596.0, 66.071427941322327, 22.0 ],
									"text" : "0.43474"
								}

							}
, 							{
								"box" : 								{
									"id" : "obj-87",
									"maxclass" : "message",
									"numinlets" : 2,
									"numoutlets" : 1,
									"outlettype" : [ "" ],
									"patching_rect" : [ 313.0, 620.0, 116.071427464485168, 22.0 ],
									"text" : "0 0 -0.7071 0.7071"
								}

							}
, 							{
								"box" : 								{
									"id" : "obj-88",
									"maxclass" : "newobj",
									"numinlets" : 0,
									"numoutlets" : 1,
									"outlettype" : [ "" ],
									"patching_rect" : [ 359.0, 524.0, 65.0, 22.0 ],
									"text" : "r osc-main"
								}

							}
, 							{
								"box" : 								{
									"id" : "obj-89",
									"maxclass" : "message",
									"numinlets" : 2,
									"numoutlets" : 1,
									"outlettype" : [ "" ],
									"patching_rect" : [ 325.0, 596.0, 53.392857253551483, 22.0 ],
									"text" : "6"
								}

							}
, 							{
								"box" : 								{
									"id" : "obj-90",
									"maxclass" : "newobj",
									"numinlets" : 1,
									"numoutlets" : 4,
									"outlettype" : [ "", "", "", "" ],
									"patching_rect" : [ 359.0, 572.0, 171.0, 22.0 ],
									"text" : "OSC-route /element /quat /dev"
								}

							}
, 							{
								"box" : 								{
									"id" : "obj-84",
									"linecount" : 2,
									"maxclass" : "message",
									"numinlets" : 2,
									"numoutlets" : 1,
									"outlettype" : [ "" ],
									"patching_rect" : [ 201.0, 619.0, 53.392857253551483, 36.0 ],
									"text" : "2 3 2.5 fff 5"
								}

							}
, 							{
								"box" : 								{
									"id" : "obj-83",
									"maxclass" : "message",
									"numinlets" : 2,
									"numoutlets" : 1,
									"outlettype" : [ "" ],
									"patching_rect" : [ 163.0, 572.0, 53.392857253551483, 22.0 ],
									"text" : "2"
								}

							}
, 							{
								"box" : 								{
									"id" : "obj-82",
									"maxclass" : "message",
									"numinlets" : 2,
									"numoutlets" : 1,
									"outlettype" : [ "" ],
									"patching_rect" : [ 67.0, 611.0, 96.428570508956909, 22.0 ],
									"text" : "0 1 2 3 4 5 6 7"
								}

							}
, 							{
								"box" : 								{
									"id" : "obj-78",
									"maxclass" : "newobj",
									"numinlets" : 0,
									"numoutlets" : 1,
									"outlettype" : [ "" ],
									"patching_rect" : [ 99.0, 524.0, 65.0, 22.0 ],
									"text" : "r osc-main"
								}

							}
, 							{
								"box" : 								{
									"id" : "obj-80",
									"maxclass" : "message",
									"numinlets" : 2,
									"numoutlets" : 1,
									"outlettype" : [ "" ],
									"patching_rect" : [ 64.0, 572.0, 53.392857253551483, 22.0 ],
									"text" : "130"
								}

							}
, 							{
								"box" : 								{
									"id" : "obj-81",
									"maxclass" : "newobj",
									"numinlets" : 1,
									"numoutlets" : 5,
									"outlettype" : [ "", "", "", "", "" ],
									"patching_rect" : [ 99.0, 548.0, 202.0, 22.0 ],
									"text" : "OSC-route /step /perm /active /voice"
								}

							}
, 							{
								"box" : 								{
									"id" : "obj-75",
									"maxclass" : "comment",
									"numinlets" : 1,
									"numoutlets" : 0,
									"patching_rect" : [ 658.0, 481.0, 71.303575903177261, 20.0 ],
									"text" : "quat xyzw"
								}

							}
, 							{
								"box" : 								{
									"id" : "obj-73",
									"maxclass" : "newobj",
									"numinlets" : 0,
									"numoutlets" : 1,
									"outlettype" : [ "" ],
									"patching_rect" : [ 99.0, 429.0, 65.0, 22.0 ],
									"text" : "r osc-main"
								}

							}
, 							{
								"box" : 								{
									"id" : "obj-62",
									"maxclass" : "newobj",
									"numinlets" : 0,
									"numoutlets" : 1,
									"outlettype" : [ "" ],
									"patching_rect" : [ 279.0, 429.0, 65.0, 22.0 ],
									"text" : "r osc-main"
								}

							}
, 							{
								"box" : 								{
									"id" : "obj-61",
									"maxclass" : "newobj",
									"numinlets" : 0,
									"numoutlets" : 1,
									"outlettype" : [ "" ],
									"patching_rect" : [ 99.0, 254.0, 65.0, 22.0 ],
									"text" : "r osc-main"
								}

							}
, 							{
								"box" : 								{
									"id" : "obj-60",
									"maxclass" : "newobj",
									"numinlets" : 0,
									"numoutlets" : 1,
									"outlettype" : [ "" ],
									"patching_rect" : [ 99.0, 175.0, 65.0, 22.0 ],
									"text" : "r osc-main"
								}

							}
, 							{
								"box" : 								{
									"id" : "obj-59",
									"maxclass" : "newobj",
									"numinlets" : 1,
									"numoutlets" : 0,
									"patching_rect" : [ 99.0, 130.0, 67.0, 22.0 ],
									"text" : "s osc-main"
								}

							}
, 							{
								"box" : 								{
									"id" : "obj-58",
									"maxclass" : "newobj",
									"numinlets" : 0,
									"numoutlets" : 1,
									"outlettype" : [ "" ],
									"patching_rect" : [ 99.0, 332.0, 65.0, 22.0 ],
									"text" : "r osc-main"
								}

							}
, 							{
								"box" : 								{
									"id" : "obj-57",
									"maxclass" : "message",
									"numinlets" : 2,
									"numoutlets" : 1,
									"outlettype" : [ "" ],
									"patching_rect" : [ 386.0, 480.0, 269.642854571342468, 22.0 ],
									"text" : "-0.023802 0.048701 -0.432672 0.89992"
								}

							}
, 							{
								"box" : 								{
									"id" : "obj-56",
									"maxclass" : "newobj",
									"numinlets" : 1,
									"numoutlets" : 2,
									"outlettype" : [ "", "" ],
									"patching_rect" : [ 279.0, 480.0, 96.0, 22.0 ],
									"text" : "OSC-route /gyro"
								}

							}
, 							{
								"box" : 								{
									"id" : "obj-53",
									"maxclass" : "newobj",
									"numinlets" : 1,
									"numoutlets" : 2,
									"outlettype" : [ "", "" ],
									"patching_rect" : [ 99.0, 106.0, 92.0, 22.0 ],
									"style" : "default",
									"text" : "OSC-route /*"
								}

							}
, 							{
								"box" : 								{
									"id" : "obj-50",
									"maxclass" : "newobj",
									"numinlets" : 1,
									"numoutlets" : 2,
									"outlettype" : [ "", "" ],
									"patching_rect" : [ 279.0, 453.0, 101.0, 22.0 ],
									"text" : "OSC-route /sieve"
								}

							}
, 							{
								"box" : 								{
									"id" : "obj-48",
									"maxclass" : "message",
									"numinlets" : 2,
									"numoutlets" : 1,
									"outlettype" : [ "" ],
									"patching_rect" : [ 385.0, 453.0, 384.821424901485443, 22.0 ],
									"text" : "0 2 3 6 9 10 13 16 17 20 23 24 27 30 31 34 37 38 41 44 45 48"
								}

							}
, 							{
								"box" : 								{
									"id" : "obj-49",
									"maxclass" : "message",
									"numinlets" : 2,
									"numoutlets" : 1,
									"outlettype" : [ "" ],
									"patching_rect" : [ 172.0, 488.0, 40.178571045398712, 22.0 ],
									"text" : "0"
								}

							}
, 							{
								"box" : 								{
									"id" : "obj-46",
									"maxclass" : "message",
									"numinlets" : 2,
									"numoutlets" : 1,
									"outlettype" : [ "" ],
									"patching_rect" : [ 125.0, 488.0, 40.178571045398712, 22.0 ],
									"text" : "beta"
								}

							}
, 							{
								"box" : 								{
									"id" : "obj-47",
									"maxclass" : "message",
									"numinlets" : 2,
									"numoutlets" : 1,
									"outlettype" : [ "" ],
									"patching_rect" : [ 77.0, 488.0, 40.178571045398712, 22.0 ],
									"text" : "V1"
								}

							}
, 							{
								"box" : 								{
									"id" : "obj-44",
									"maxclass" : "newobj",
									"numinlets" : 1,
									"numoutlets" : 4,
									"outlettype" : [ "", "", "", "" ],
									"patching_rect" : [ 99.0, 453.0, 161.0, 22.0 ],
									"text" : "OSC-route /path /cycle /tetra"
								}

							}
, 							{
								"box" : 								{
									"id" : "obj-36",
									"maxclass" : "message",
									"numinlets" : 2,
									"numoutlets" : 1,
									"outlettype" : [ "" ],
									"patching_rect" : [ 562.0, 380.0, 26.642862200737, 22.0 ],
									"text" : "4"
								}

							}
, 							{
								"box" : 								{
									"id" : "obj-37",
									"maxclass" : "message",
									"numinlets" : 2,
									"numoutlets" : 1,
									"outlettype" : [ "" ],
									"patching_rect" : [ 494.0, 380.0, 26.642862200737, 22.0 ],
									"text" : "8"
								}

							}
, 							{
								"box" : 								{
									"id" : "obj-38",
									"maxclass" : "message",
									"numinlets" : 2,
									"numoutlets" : 1,
									"outlettype" : [ "" ],
									"patching_rect" : [ 426.0, 380.0, 27.535719335079193, 22.0 ],
									"text" : "7"
								}

							}
, 							{
								"box" : 								{
									"id" : "obj-39",
									"maxclass" : "message",
									"numinlets" : 2,
									"numoutlets" : 1,
									"outlettype" : [ "" ],
									"patching_rect" : [ 359.0, 380.0, 26.642862200737, 22.0 ],
									"text" : "6"
								}

							}
, 							{
								"box" : 								{
									"id" : "obj-40",
									"maxclass" : "message",
									"numinlets" : 2,
									"numoutlets" : 1,
									"outlettype" : [ "" ],
									"patching_rect" : [ 292.0, 380.0, 26.642862200737, 22.0 ],
									"text" : "5"
								}

							}
, 							{
								"box" : 								{
									"id" : "obj-41",
									"maxclass" : "message",
									"numinlets" : 2,
									"numoutlets" : 1,
									"outlettype" : [ "" ],
									"patching_rect" : [ 225.0, 380.0, 27.535719335079193, 22.0 ],
									"text" : "3"
								}

							}
, 							{
								"box" : 								{
									"id" : "obj-42",
									"maxclass" : "message",
									"numinlets" : 2,
									"numoutlets" : 1,
									"outlettype" : [ "" ],
									"patching_rect" : [ 158.0, 380.0, 27.535719335079193, 22.0 ],
									"text" : "2"
								}

							}
, 							{
								"box" : 								{
									"id" : "obj-43",
									"maxclass" : "message",
									"numinlets" : 2,
									"numoutlets" : 1,
									"outlettype" : [ "" ],
									"patching_rect" : [ 90.0, 380.0, 27.535719335079193, 22.0 ],
									"text" : "1"
								}

							}
, 							{
								"box" : 								{
									"id" : "obj-27",
									"maxclass" : "message",
									"numinlets" : 2,
									"numoutlets" : 1,
									"outlettype" : [ "" ],
									"patching_rect" : [ 450.0, 302.0, 53.571428060531616, 22.0 ],
									"text" : "2 f 3"
								}

							}
, 							{
								"box" : 								{
									"id" : "obj-28",
									"maxclass" : "message",
									"numinlets" : 2,
									"numoutlets" : 1,
									"outlettype" : [ "" ],
									"patching_rect" : [ 396.0, 302.0, 53.571428060531616, 22.0 ],
									"text" : "2 ff 4"
								}

							}
, 							{
								"box" : 								{
									"id" : "obj-29",
									"maxclass" : "message",
									"numinlets" : 2,
									"numoutlets" : 1,
									"outlettype" : [ "" ],
									"patching_rect" : [ 340.0, 302.0, 54.46428519487381, 22.0 ],
									"text" : "1.5 ff 4"
								}

							}
, 							{
								"box" : 								{
									"id" : "obj-30",
									"maxclass" : "message",
									"numinlets" : 2,
									"numoutlets" : 1,
									"outlettype" : [ "" ],
									"patching_rect" : [ 285.0, 302.0, 53.571428060531616, 22.0 ],
									"text" : "1.5 f 3"
								}

							}
, 							{
								"box" : 								{
									"id" : "obj-31",
									"maxclass" : "message",
									"numinlets" : 2,
									"numoutlets" : 1,
									"outlettype" : [ "" ],
									"patching_rect" : [ 230.0, 302.0, 53.571428060531616, 22.0 ],
									"text" : "2.5 mf 2"
								}

							}
, 							{
								"box" : 								{
									"id" : "obj-32",
									"maxclass" : "message",
									"numinlets" : 2,
									"numoutlets" : 1,
									"outlettype" : [ "" ],
									"patching_rect" : [ 174.0, 302.0, 54.46428519487381, 22.0 ],
									"text" : "2.5 fff 5"
								}

							}
, 							{
								"box" : 								{
									"id" : "obj-33",
									"maxclass" : "message",
									"numinlets" : 2,
									"numoutlets" : 1,
									"outlettype" : [ "" ],
									"patching_rect" : [ 118.0, 302.0, 54.46428519487381, 22.0 ],
									"text" : "1 fff 5"
								}

							}
, 							{
								"box" : 								{
									"id" : "obj-34",
									"maxclass" : "message",
									"numinlets" : 2,
									"numoutlets" : 1,
									"outlettype" : [ "" ],
									"patching_rect" : [ 63.0, 302.0, 54.46428519487381, 22.0 ],
									"text" : "1 mf 2"
								}

							}
, 							{
								"box" : 								{
									"id" : "obj-35",
									"maxclass" : "newobj",
									"numinlets" : 1,
									"numoutlets" : 9,
									"outlettype" : [ "", "", "", "", "", "", "", "", "" ],
									"patching_rect" : [ 99.0, 278.0, 461.0, 22.0 ],
									"text" : "OSC-route /vertex/1 /vertex/2 /vertex/3 /vertex/4 /vertex/5 /vertex/6 /vertex/7 /vertex/8"
								}

							}
, 							{
								"box" : 								{
									"id" : "obj-15",
									"maxclass" : "newobj",
									"numinlets" : 1,
									"numoutlets" : 9,
									"outlettype" : [ "", "", "", "", "", "", "", "", "" ],
									"patching_rect" : [ 99.0, 356.0, 557.0, 22.0 ],
									"text" : "OSC-route /complex/1 /complex/2 /complex/3 /complex/4 /complex/5 /complex/6 /complex/7 /complex/8"
								}

							}
, 							{
								"box" : 								{
									"id" : "obj-12",
									"maxclass" : "message",
									"numinlets" : 2,
									"numoutlets" : 1,
									"outlettype" : [ "" ],
									"patching_rect" : [ 147.0, 223.0, 40.178571045398712, 22.0 ],
									"text" : "0"
								}

							}
, 							{
								"box" : 								{
									"id" : "obj-11",
									"maxclass" : "message",
									"numinlets" : 2,
									"numoutlets" : 1,
									"outlettype" : [ "" ],
									"patching_rect" : [ 77.0, 223.0, 40.178571045398712, 22.0 ],
									"text" : "0"
								}

							}
, 							{
								"box" : 								{
									"id" : "obj-10",
									"maxclass" : "newobj",
									"numinlets" : 1,
									"numoutlets" : 3,
									"outlettype" : [ "", "", "" ],
									"patching_rect" : [ 99.0, 199.0, 159.0, 22.0 ],
									"text" : "OSC-route /group/k /group/c"
								}

							}
, 							{
								"box" : 								{
									"id" : "obj-4",
									"maxclass" : "newobj",
									"numinlets" : 1,
									"numoutlets" : 1,
									"outlettype" : [ "" ],
									"patching_rect" : [ 99.0, 82.0, 104.0, 22.0 ],
									"text" : "udpreceive 57120"
								}

							}
, 							{
								"box" : 								{
									"id" : "obj-2",
									"linecount" : 24,
									"maxclass" : "comment",
									"numinlets" : 1,
									"numoutlets" : 0,
									"patching_rect" : [ 692.0, 10.0, 528.378343105316162, 338.0 ],
									"text" : "— PORT 8000 —\n\n/xk/group/k          int (0-23)                          K_i cube S4 element\n/xk/group/c           int (0-23)                          C_i cube S4 element\n/xk/vertex/1-8       float, string, float              density, intensity, duration per vertex\n/xk/complex/1-8   int (1-8)                            complex type per vertex\n/xk/path                string                               \"V1\" or \"V2\"\n/xk/cycle               string                               \"alpha\"/\"beta\"/\"gamma\"\n/xk/tetra                int                                     tetrahedral orbit (0=even, 1=odd)\n/xk/sieve               int...                                  pitch semitone offsets (variable length)\n/xk/gyro                float×4                              quaternion x y z w\n/xk/step                int                                      transformation count\n/xk/perm               int×8                                 current vertex permutation\n/xk/active              int (0-7)                             active vertex index\n/xk/voice               int, int, float, string, float   vertexIdx, complexType, density, intensity, duration\n/xk/snap/element  int (0-23)                          nearest S4 element to gyro\n/xk/snap/quat        float×4                             quaternion of snap target\n/xk/snap/dev         float (0-1)                         gyro deviation from snap\n/xk/scramble         float (0-1)                         scramble factor (0=solved, 1=max)\n/xk/rate                 float                                  turn rate (turns/sec)\n/xk/regime            string                                contemplative/conversational/burst\n\n/gan/turn              string                                move (e.g. \"R\", \"U'\", \"F2\") \n/gan/gyro             float×4                              quaternion"
								}

							}
 ],
						"lines" : [ 							{
								"patchline" : 								{
									"destination" : [ "obj-11", 1 ],
									"source" : [ "obj-10", 0 ]
								}

							}
, 							{
								"patchline" : 								{
									"destination" : [ "obj-12", 1 ],
									"source" : [ "obj-10", 1 ]
								}

							}
, 							{
								"patchline" : 								{
									"destination" : [ "obj-36", 1 ],
									"source" : [ "obj-15", 7 ]
								}

							}
, 							{
								"patchline" : 								{
									"destination" : [ "obj-37", 1 ],
									"source" : [ "obj-15", 6 ]
								}

							}
, 							{
								"patchline" : 								{
									"destination" : [ "obj-38", 1 ],
									"source" : [ "obj-15", 5 ]
								}

							}
, 							{
								"patchline" : 								{
									"destination" : [ "obj-39", 1 ],
									"source" : [ "obj-15", 4 ]
								}

							}
, 							{
								"patchline" : 								{
									"destination" : [ "obj-40", 1 ],
									"source" : [ "obj-15", 3 ]
								}

							}
, 							{
								"patchline" : 								{
									"destination" : [ "obj-41", 1 ],
									"source" : [ "obj-15", 2 ]
								}

							}
, 							{
								"patchline" : 								{
									"destination" : [ "obj-42", 1 ],
									"source" : [ "obj-15", 1 ]
								}

							}
, 							{
								"patchline" : 								{
									"destination" : [ "obj-43", 1 ],
									"source" : [ "obj-15", 0 ]
								}

							}
, 							{
								"patchline" : 								{
									"destination" : [ "obj-27", 1 ],
									"source" : [ "obj-35", 7 ]
								}

							}
, 							{
								"patchline" : 								{
									"destination" : [ "obj-28", 1 ],
									"source" : [ "obj-35", 6 ]
								}

							}
, 							{
								"patchline" : 								{
									"destination" : [ "obj-29", 1 ],
									"source" : [ "obj-35", 5 ]
								}

							}
, 							{
								"patchline" : 								{
									"destination" : [ "obj-30", 1 ],
									"source" : [ "obj-35", 4 ]
								}

							}
, 							{
								"patchline" : 								{
									"destination" : [ "obj-31", 1 ],
									"source" : [ "obj-35", 3 ]
								}

							}
, 							{
								"patchline" : 								{
									"destination" : [ "obj-32", 1 ],
									"source" : [ "obj-35", 2 ]
								}

							}
, 							{
								"patchline" : 								{
									"destination" : [ "obj-33", 1 ],
									"source" : [ "obj-35", 1 ]
								}

							}
, 							{
								"patchline" : 								{
									"destination" : [ "obj-34", 1 ],
									"source" : [ "obj-35", 0 ]
								}

							}
, 							{
								"patchline" : 								{
									"destination" : [ "obj-53", 0 ],
									"source" : [ "obj-4", 0 ]
								}

							}
, 							{
								"patchline" : 								{
									"destination" : [ "obj-46", 1 ],
									"source" : [ "obj-44", 1 ]
								}

							}
, 							{
								"patchline" : 								{
									"destination" : [ "obj-47", 1 ],
									"source" : [ "obj-44", 0 ]
								}

							}
, 							{
								"patchline" : 								{
									"destination" : [ "obj-49", 1 ],
									"source" : [ "obj-44", 2 ]
								}

							}
, 							{
								"patchline" : 								{
									"destination" : [ "obj-48", 1 ],
									"source" : [ "obj-50", 0 ]
								}

							}
, 							{
								"patchline" : 								{
									"destination" : [ "obj-59", 0 ],
									"source" : [ "obj-53", 0 ]
								}

							}
, 							{
								"patchline" : 								{
									"destination" : [ "obj-57", 1 ],
									"source" : [ "obj-56", 0 ]
								}

							}
, 							{
								"patchline" : 								{
									"destination" : [ "obj-15", 0 ],
									"source" : [ "obj-58", 0 ]
								}

							}
, 							{
								"patchline" : 								{
									"destination" : [ "obj-10", 0 ],
									"source" : [ "obj-60", 0 ]
								}

							}
, 							{
								"patchline" : 								{
									"destination" : [ "obj-35", 0 ],
									"source" : [ "obj-61", 0 ]
								}

							}
, 							{
								"patchline" : 								{
									"destination" : [ "obj-50", 0 ],
									"order" : 1,
									"source" : [ "obj-62", 0 ]
								}

							}
, 							{
								"patchline" : 								{
									"destination" : [ "obj-56", 0 ],
									"order" : 0,
									"source" : [ "obj-62", 0 ]
								}

							}
, 							{
								"patchline" : 								{
									"destination" : [ "obj-44", 0 ],
									"source" : [ "obj-73", 0 ]
								}

							}
, 							{
								"patchline" : 								{
									"destination" : [ "obj-81", 0 ],
									"source" : [ "obj-78", 0 ]
								}

							}
, 							{
								"patchline" : 								{
									"destination" : [ "obj-80", 1 ],
									"source" : [ "obj-81", 0 ]
								}

							}
, 							{
								"patchline" : 								{
									"destination" : [ "obj-82", 1 ],
									"source" : [ "obj-81", 1 ]
								}

							}
, 							{
								"patchline" : 								{
									"destination" : [ "obj-83", 1 ],
									"source" : [ "obj-81", 2 ]
								}

							}
, 							{
								"patchline" : 								{
									"destination" : [ "obj-84", 1 ],
									"source" : [ "obj-81", 3 ]
								}

							}
, 							{
								"patchline" : 								{
									"destination" : [ "obj-91", 0 ],
									"source" : [ "obj-88", 0 ]
								}

							}
, 							{
								"patchline" : 								{
									"destination" : [ "obj-85", 1 ],
									"source" : [ "obj-90", 3 ]
								}

							}
, 							{
								"patchline" : 								{
									"destination" : [ "obj-86", 1 ],
									"source" : [ "obj-90", 2 ]
								}

							}
, 							{
								"patchline" : 								{
									"destination" : [ "obj-87", 1 ],
									"source" : [ "obj-90", 1 ]
								}

							}
, 							{
								"patchline" : 								{
									"destination" : [ "obj-89", 1 ],
									"source" : [ "obj-90", 0 ]
								}

							}
, 							{
								"patchline" : 								{
									"destination" : [ "obj-90", 0 ],
									"source" : [ "obj-91", 0 ]
								}

							}
, 							{
								"patchline" : 								{
									"destination" : [ "obj-94", 0 ],
									"source" : [ "obj-93", 0 ]
								}

							}
, 							{
								"patchline" : 								{
									"destination" : [ "obj-3", 1 ],
									"source" : [ "obj-94", 2 ]
								}

							}
, 							{
								"patchline" : 								{
									"destination" : [ "obj-5", 1 ],
									"source" : [ "obj-94", 1 ]
								}

							}
, 							{
								"patchline" : 								{
									"destination" : [ "obj-6", 1 ],
									"source" : [ "obj-94", 0 ]
								}

							}
 ]
					}
,
					"patching_rect" : [ 57.317074537277222, 36.607142508029938, 75.0, 22.0 ],
					"saved_object_attributes" : 					{
						"description" : "",
						"digest" : "",
						"globalpatchername" : "",
						"tags" : ""
					}
,
					"text" : "p relay-OSC"
				}

			}
, 			{
				"box" : 				{
					"id" : "obj-19",
					"linecount" : 7,
					"maxclass" : "comment",
					"numinlets" : 1,
					"numoutlets" : 0,
					"patching_rect" : [ 57.317074537277222, 624.615444183349609, 251.785711884498596, 103.0 ],
					"text" : "expressivity params\nexpression 0.01~1\nvibrato depth 0.01~1.2\nvibrato rate hz\nbow pressure 0~0.2 flautando 0.8~1. scratch\nbow/pizz position \nbow pressure accent 0~1"
				}

			}
, 			{
				"box" : 				{
					"id" : "obj-18",
					"linecount" : 5,
					"maxclass" : "comment",
					"numinlets" : 1,
					"numoutlets" : 0,
					"patching_rect" : [ 339.624793767929077, 624.615444183349609, 150.0, 89.0 ],
					"text" : "timbre params\n\nsordino on/off\n\npizzicato tone 0~1\n"
				}

			}
, 			{
				"box" : 				{
					"autosave" : 1,
					"bgmode" : 0,
					"border" : 0,
					"clickthrough" : 0,
					"id" : "obj-3",
					"maxclass" : "newobj",
					"numinlets" : 2,
					"numoutlets" : 8,
					"offset" : [ 0.0, 0.0 ],
					"outlettype" : [ "signal", "signal", "", "list", "int", "", "", "" ],
					"patching_rect" : [ 57.317074537277222, 96.341465711593628, 410.135107755661011, 517.567533016204834 ],
					"save" : [ "#N", "vst~", "loaduniqueid", 0, "C74_VST3:/SWAM Cello 3", ";" ],
					"saved_attribute_attributes" : 					{
						"valueof" : 						{
							"parameter_invisible" : 1,
							"parameter_longname" : "vst~[1]",
							"parameter_modmode" : 0,
							"parameter_shortname" : "vst~[1]",
							"parameter_type" : 3
						}

					}
,
					"saved_object_attributes" : 					{
						"parameter_enable" : 1,
						"parameter_mappable" : 0
					}
,
					"snapshot" : 					{
						"filetype" : "C74Snapshot",
						"version" : 2,
						"minorversion" : 0,
						"name" : "snapshotlist",
						"origin" : "vst~",
						"type" : "list",
						"subtype" : "Undefined",
						"embed" : 1,
						"snapshot" : 						{
							"pluginname" : "SWAM Cello 3.vst3info",
							"plugindisplayname" : "SWAM Cello 3",
							"pluginsavedname" : "C74_VST3:/SWAM Cello 3",
							"pluginsaveduniqueid" : -298341311,
							"version" : 1,
							"isbank" : 0,
							"isbase64" : 1,
							"sliderorder" : [  ],
							"slidervisibility" : [ 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 1, 1, 0, 1, 1, 1, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ],
							"blob" : "19509.VMjLgvBS...O+fWarAhckI2bo8la8HRLt.iHfTlai8FYo41Y8HRUTYTK3HxO9.BOVMEUy.Ea0cVZtMEcgQWY9vSRC8Vav8lak4Fc9DCM0PiMtXUSGM1UA4hKtXlKt3hKP4hKt3hKtvjdXQ2bD4hKlkFcFkjdP4VPt3hKHYGUoUULL4BS1IjKt3hKtPjKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3xLHgVUCkzTHMVYC4hK1k2Sy.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.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.UczXzX3giQgIWUrIVS3XTVqkjPHESQFEFLUY0Sn4RZKYGR3sTN1MDUAkTUP0TPRokZvjFRoUDai8VTxPUZEYTXqkjPHESQFEFLUY0SnQTZKYGR3sTN1MDUAkTUP0TPRokZvjFRqc1QhgWSEMFdIUUV4ETUXgWQVEFZtf1XmcmUisFLogjcyHDSncCZOciKUAkTEQ0TlolQYgCR3o0ZqICUxrlQik1YVkUd3nGV5UDaisVTqI1YzDiX1kjPHESQFEFLUY0SnoGdLQmKogTcyLzSPUjZTEDLDgzaQY0SnImUYQSSvL1aQICVtUULhAUQwj0ZMAyXuEkLX4VRBgTLEYTXvTkUOglKosjcHg2R4X2PTETRUAUSAIkVpASZHEWSsU0Z2wFUqAiUXYWRBgTLEYTXvTkUOglKosDLHg2R4X2PTETRUAUSAIkVpASZHM2ZwfEd3XTUvPiUYsTUVQ1TickV50jQZsVSsQ0ZMcUV5kjPHESQFEFLUY0SnQTZKYGR3sTN1MDUAkTUP0TPRokZvjFRysVLXgGNFUELzXUVLUkUXgGMrAEMyQUVzzDLi8VTxfkaUEiXn4BZic1cVM1ZvjFR1MiPLg1Mn8zMtTETRUDUSYlZFkENHIUXuEkUZAURxDFaqYTXqkjPHESQFEFLUY0SnQTZKYGR3sTN1MDUAkTUP0TPRokZvjFRzgiQisFNpkEaYUUVxgSLX8VTWQFZtf1XmcmUisFLogzcyHDSncCZOciKUAkTEQ0TlolQYgCRBI1YzXkVokjPHESQFEFLUY0Sn4RZKYGR3sTN1MDUAkTUP0TPRokZvjFR1slQik1YrA0ZzXTVDgSLiQWRBgTLEYTXvTkUOgFRosjcHg2R4X2PTETRUAUSAIkVpASZHY2ZFMVZmwFTqQiQYUUPsgjYXcEVxU0UYgCRnwDctjFR0MyPOAUQpQUPvPDRuEkUOglKWoUMuICT0cmQSs1XrEVcMoWXzEUahU2crgjYXcEVxU0UYgCRBwDctjFR0MyPOAUQpQUPvPDRuEkUOglKxDFdQcEVy0TQhI2ZFMlTEYzXugiQTcVRWg0bIIDRwTjQgASUV8DZTMDSz4RZHU2LC8DTEoFUAACQH8VTV8DZtHSX3E0UXMWUrEld3DCT5kzQgglKnM1Y2Y0XqASZHY2LBwDZ2f1S23RUPIUQTMkYpYTV3fjPhUWRGM1YvXUVzEkLg0TQFQFUqYUXqkjPHESQFEFLUY0SngTZKACR3sTN1MDUAkTUP0TPRokZvjFR3UULXs1ZrM1ZvPkTDsldP4VQrEFcUYTXn4BZic1cVM1ZvjFR2gUZKYGR3sTN1MDUAkTUP0TPRokZvjFR3UkQgsVQwH1ZiUkVzEULPUGMFMFd3XTXxUEah0DNFk0ZIIDRwTjQgASUV8DZtj1R1gDdKkicCQUPIUETMEjTZoFLogTdUIiX5UjUZQWRBgTLEYTXvTkUOglKosjcHg2R4X2PTETRUAUSAIkVpASZHkWUxHldEYkVzkTUXMWPsgjYXcEVxU0UYgCRBwDctjFR0MyPOAUQpQUPvPDRuEkUOgFTsI1YzDiX1gSLhsVRBgTLEYTXvTkUOgldRwDdyHDSncCZOcyMBI1YIcEVy0TaOcidTIEQqoFUqAiUXYWPWoEciYTUmkjQgsFMC8TSqQTTIkTUYMWQFIlcqwVXsUkZgoWRWQlYTwVXmkjQgsVTV8DZDkFRl4xUXgWQVE1ZQcUV3sFQYgCRRk0LA0lXq0jLh8FNrEFZtfGVtUDagQWUFEFNHIESxfjPHMWUwHVdEESVqEUUjYWUV8DZDkFRloWLhgFLogzcDkFRlYWLhgFLogzbDkFR4X2TSkTTTIkTUYUXmEzQh8FMwj0PU0lXwTkQH8FMFIFLQIyUysFaggCRBwDctjFRloFagYWUGMVYvXEVy.SZHcGR40DctjFRlciUioGNUE1azX0SnwTZKYGRBgTcUczXkAiUXMCLogzcHkWSz4RZHYFSGo0YAcUV3fjPLQmK4wDMpMkSzn1TNQCQCwDLpkGS1wTdLglK3IFMvXUXqEUahQCLogjcyHjS14xPLYmKCwzcDMkS34xTNgmZogjYHYEY1UTLhkGLogjcHIDRnslQhU2cVgEdvjFR1gDdKkic4sTSqQTTIkTUYMWQFIlcqwVXsUkZgoWRWQVN1M0TIEEURIUUVE1YAcjXuQSLYUDMFMFdqcDRqQiUXg1cVkkZvjFR2gjPHYWQrI1YvXUV5UEahkTTV8DZXckVnkzUXoGNFE0ZAczXtkjPHk1YVgEczXUVxASZHcmXogjY5YUV40zUX0VUFUEMAcUV3fjTLglKREVdIY0SnQTZHYlcwHFZvjFRyQTZHkicSMURQQkTRUkUgcVPGI1azDSVCUUahESUFgzazXjXvDkLWM2ZrEFNHIDSz4RZHYlZrElcUczXkAiUXMCLogzcHkWSz4RZHY1MVMld3TUXuQiUOgFQosjcHIDR0U0QiUFLVg0LvjFR2QzPLQmKogjYLcjVmEzUYgCRBwDctjFRlwzUjMGLVkkdIcEY3fjPLQGUogjYHYEY1UTLhkGLogjcHIDRnslQhU2cVgEdvjFR1gDdKkic4sTSqQTTIkTUYMWQFIlcqwVXsUkZgoWRWQVN1M0TIEEURIUUVE1YAcjXuQSLYUDMFMFdqcDRqQiUXg1cVkkZvjFR2gjPHYWQrI1YvXUV5UEahkTTV8DZXckVnkzUXoGNrQ0YQcUVn4BdX4VQrEFcUYTX3fjTLICRBgzbUEiX4UTLYsVTUQlcUY0SnQTZHYldwHFZvjFR2oVZHYlcwHFZvjFRyQTZHkicSMURQQkTRUkUgcVPGI1azDSVCUUahESUFgzazXjXvDkLWM2ZrEFNHIDSz4RZHYlZrElcUczXkAiUXMCLogzcHkWSz4RZHY1MVMld3TUXuQiUOglKosjcHIDR0U0QiUFLVg0LvjFR2gTdMQmKogjYLcjVmEzUYgCRBwDctjFRlwzUjMGLVkkdIcEY3fjPLQGUogjYHYEY1UTLhkGLogjcHIDRnslQhU2cVgEdvjFR1gDdKkic4sTSqQTTIkTUYMWQFIlcqwVXsUkZgoWRWQVN1M0TIEEURIUUVE1YAcjXuQSLYUDMFMFdqcDRqQiUXg1cVkkZvjFR2gjPHYWQrI1YvXUV5UEahkTTV8DZ5YEVuQCaUU2cVM1bUwFRlwjQZcFMrE1Z2Y0SnQTdMglKRE1ZMIiXmMlUYQ0ZGI1ZvjFR2gjPHMWSsgENHgWSn4hPgkWRV8DZ5IESnMyPO0zZDEURIUUVyUjQhY2ZrEVaMQ0X3k0UYYlZrElcUczXkAiUZQGLogjcyHDSn4hTZQWPWMld3TUXmc1UOgFQowjLyHDSn4BdgASTxb0bqwVX3fjPLQmKogjY2X0X5gSUgc1YW8DZDkFSxLiPLglK3IlaEYjXqASZHY2LBwDZtfmXz.iUgsVTsIFMvjFR1MiTMglKngEMAcEV40zUOglKogjYHYkV1giQgcVRW8DZtjFR0MyPOUmdTIEQqoFUqAiUXYWPWoEciYUTzEUahQCMC8TSqQTTIkTUYMWQFIlcqwVXsUkZgoWRWQlYTwVXmkjQgsVTV8DZDkFRl4xUXgWQVE1ZQcUV3sFQYgCRBI1YzXDU0EUaHYFSFo0YzvVXqcmUOgFQ40DZtHUXq0jLhc1XVkEUqcjXqASZHcGRBgzbM0FV3fjTLYGRBgjbM0FV3fjTKcGRn8zM5QkTDslZTsFLVgkcAckVzMVLPASRsM1ZAIkVzEzUioGNUE1azX0Sn4RZKYGRBgzazXjXvDkLWMWQFQFNHIES3IVZKYGRBgTcUczXkAiUZQGLogjcyHDSn4BdgASTxb0bEYDY3fjTLgmXosjcHIDR4clUXYWUV8DZtj1R1gjPHk2ZWE1bUYzX3s1UOglKosDLHIDRns1QhcVSxHFNHIDSn4BZX8VPxDlbEwlX3fjPLg1Mn8zM2H0TIEEURIUUVE1YAcjXuQSLYUDMFMFdq01S2nGURQzZpQ0ZvXEV1EzUZQ2XVEEcQ0lXzDjTYQWQrgkbUYTV3fjTLglKBI1YIcEVyUkQisVRWIkZvjFR3UEaisVRsgUSqYDYn4BdX4VQrEFcUYTX3fjTLICRBgzbUEiX4UTLYsVTUQlcUY0SnQTZHYldwHFZvjFRz3RZHYlcwHFZvjFRyQTZHkicSMURQQkTRUkUgcVPGI1azDSVCUUahESUFgzazXjXvDkLWM2ZrEFNHIDSz4RZHYlZrElcUczXkAiUXMCLogzcHkWSz4RZHY1MVMld3TUXuQiUOglKosjcHIDR0U0QiUFLVg0LvjFR2gTdMQmKogjYLcjVmEzUYgCRBwDctjFRlwzUjMGLVkkdIcEY3fjPLQGUogjYHYEY1UTLhkGLogjcHIDRnslQhU2cVgEdvjFR1gDdKkic4sTSqQTTIkTUYMWQFIlcqwVXsUkZgoWRWQVN1M0TIEEURIUUVE1YAcjXuQSLYUDMFMFdqcDRqQiUXg1cVkkZvjFR2gjPHYWQrI1YvXUV5UEahkTTV8DZLc0X4E0UX8FMrgjYLYjVmQCags1cV8DZDkWSn4hTgsVSxH1YiYUVTs1QhsFLogzcHIDRy0TaXgCRn0jdHIDRx0TaXgCRRszcHg1S2nGURQzZpQ0ZvXEV1EzUZQ2Xw.ELI01XqEjTZQWPWMld3TUXuQiUOglKosjcHIDRuQiQhASTxb0bEYDY3fjTLgmXosjcHIDR0U0QiUFLVoEcvjFR2MiPLglK3EFLQIyUyUjQjgCRRwDdhk1R1gjPHk2YVgkcUY0Sn4RZKQiZCwjctLDS14xTNACSo0jLPkGS3gjPHk2ZWE1bUYzX3s1UOglKosDLHIDRns1QhcVSxHFNHIDSn4BZX8VPxDlbEwlX3fjPLg1Mn8zM2H0TIEEURIUUVE1YAcjXuQSLYUDMFMFdq01S2nGURQzZpQ0ZvXEV1EzUZQ2XVEEcQ0lXzDjTYQWQrgkbUYTV3fjTLglKBI1YIcEVyUkQisVRWIkZvjFRwTkQgUWSVokdq0FRlwjQZcFMrE1Z2Y0SnQTdMglKRE1ZMIiXmMlUYQ0ZGI1ZvjFR5gjPHMWSsgENHI0R2gjPHIWSsgENHI0R2gDZOcidTIEQqoFUqAiUXYWPWoEciECTvjTaisVPRoEcAc0X5gSUg8FMV8DZtj1R1gjPH8FMFIFLQIyUyUjQjgCRRwDdhk1R1gjPHUWUGMVYvXkVzASZHc2LBwDZtfWXvDkLWMWQFQFNHIES3IVZKYGRBgTdmYEV1UkUOglKosjcHIDR4s1UgMWUFMFdqc0Sn4RZKACRBgDZqcjXm0jLhgCRRwDZtfFVuEjLgIWQrIFNHIDSncCZOcyMRMURQQkTRUkUgcVPGI1azDSVEQiQig2Zs8zM2H0TIEEURIUUVE1YAcjXuQSLYQUQrgkbUw1S2biTg8VTVo0bEYjX1sFag0FMC8zbqECV3giQiACMVoEciw1S23xUXgWQVEVdzLzSPUjZTEDLDgzaQY0SnomUZkVRxDFUU0VXuQSLYIENwDldIIDRwTjQgASUV8DZtj1R1gDdKkicCQUPIUETMEjTZoFLogzbqECV3giQiACMVoEciEyU1gjPHESQFEFLUY0SnomTMIyLBwDZ2f1S23RUPIUQTMkYpYTV3fjTg8VSrIVcQc0XzsFag0FNUwDZtf1XmcmUisFLogzbTMDSz4RZHU2LC8DTEoFUAACQH8VTV8DZ5YkVokjLgoWUsE1azDSVkUzPLglKnM1Y2Y0XqASZHMGUCwDctjFR0MyPOAUQpQUPvPDRuEkUOgldVoUZIISX5UUag8FMwjUYEMESn4BZic1cVM1ZvjFRyQ0PLQmKogTcyLzSPUjZTEDLDgzaQY0SnomUZkVRxDldU0VXuQSLYUVRogjYXcEVxU0UYgCRRsDLtj1R1gDdKkicCQUPIUETMEjTZoFLogzbqECV3giQiACMVoEciEyU4gjPHESQFEFLUY0SnomTMY2LBwDZ2f1S23RUPIUQTMkYpYTV3fjTg8VSrIVcQc0XzsFag0FNE0DZtf1XmcmUisFLogzbTMDSz4RZHU2LC8DTEoFUAACQH8VTV8DZ5YkVokjLgoWUsE1azDSVkUUZHYFVWgkbUcUV3fjTKAiKosjcHg2R4X2PTETRUAUSAIkVpASZHM2ZwfEd3XzXvPiUZQ2XwbULHIDRwTjQgASUV8DZ5IUS1MiPLg1Mn8zMtTETRUDUSYlZFkENHIUXu0DahUWTWMFcqwVXsgCLMglKnM1Y2Y0XqASZHMGUCwDctjFR0MyPOAUQpQUPvPDRuEkUOgldVoUZIISX5UUag8FMwjUYmkFRlg0UXIWUWkENHI0Rv3RZKYGR3sTN1MDUAkTUP0TPRokZvjFRysVLXgGNFMFLzXkVzMVLWQCRBgTLEYTXvTkUOgldR0jcyHDSncCZOciKUAkTEQ0TlolQYgCRREldMczXmE0UikGNEwDZtf1XmcmUisFLogjcyHDSncCZOciKUAkTEQ0TlolQYgCRREldMczXmE0UikGNUwDZtf1XmcmUisFLogjcyHDSncCZOciKUAkTEQ0TlolQYgCRREldMczXmE0UikGNUwjcHIDRwTjQgASUV8DZtj1R1gDdKkicCQUPIUETMEjTZoFLogzbQIiX5UjQiASSxb0cDkFRlg0UXIWUWkENHIDSz4RZHU2LC8DTEoFUAACQH8VTV8DZ5YzX4E0UXoWUxHVYIkFRlg0UXIWUWkENHIDSz4RZHU2LC8DTEoFUAACQH8VTV8DZ5YzX4E0UXoWUxHVYMkFRlg0UXIWUWkENHIDSz4RZHU2LC8DTEoFUAACQH8VTV8DZ5YzX4E0UXoWUxHVYQkFRlg0UXIWUWkENHIDSz4RZHU2LC8DTEoFUAACQH8VTV8DZ5YzX4E0UXoWUxHVYUkFRlg0UXIWUWkENHIDSz4RZHU2LC8DTEoFUAACQH8VTV8DZ5YzX4E0UXoWUxHVYYkFRlg0UXIWUWkENHIDSz4RZHU2LC8DTEoFUAACQH8VTV8DZ5YzX4E0UXoWUxHVYikFRlg0UXIWUWkENHIDSz4RZHU2LC8DTEoFUAACQH8VTV8DZ5YzX4E0UXoWUxHVYmkFRlg0UXIWUWkENHIDSz4RZHU2LC8DTEoFUAACQH8VTV8DZ5YzX4E0UXoWUxHVYqkFRlg0UXIWUWkENHIDSz4RZHU2LC8DTEoFUAACQH8VTV8DZPcUVyEzUYgWQVEFZtf1XmcmUisFLogjdHk1R1gDdKkic4sjcEwlXmASLhkicCIFdUEiXqEkLhkicCIFdUEiXqE0QHk2cwDldzP0XykjUYgGLogzcHg1S2LSLgoWUFgzaQY0Sn4RZHYFSGM1YQc0X4ASZHYGRBgTLEYTXvTkUOgldR0jcHIDRzgiQisFMTg0bUY0SnwjZHU2LC8Dc3XzXqEjTZoFLogzcHIDR4E0UXoWUxHFNHIDSn4BZic1cVM1ZvjFRyQ0PLglKnEVcQcUVNUjUgsFLogzPMgFR0MyPOQGNFM1ZAIkVpASZHgGRBgTdQcEV5UkLhgCRBwDZtf1XmcmUisFLogzbTMDSn4BZgUWTWkkSEYUXqASZHQTR3sTN1kVX0E0UYYlZFkENHgGSn4BdhoWQFMFLMc0Sn4RZHYFVWgkbUcUV3fjTKAiKogjYyDSX5UEaScFLVkENHITTogDdKkicoEVcQcUVlolQYgCRB0DZtfmX5UjQiASSW8DZtjFRlg0UXIWUWkENHI0Rv3RZHY1LwDldUw1TmAiUYgCRREEZ2f1S2LSLgoWUFgzaQY0SnQUZHYFSGM1YQc0X4ASZHYGRBgTLEYTXvTkUOgldR0jcHIDRzgiQisFMTg0bUY0SngkZHU2LC8Dc3XzXqEjTZoFLogTLHIDR4E0UXoWUxHFNHIDSn4BZic1cVM1ZvjFRyQ0PLglKnEVcQcUVNUjUgsFLogjQMgFR0MyPOQGNFM1ZAIkVpASZHICRBgTdQcEV5UkLhgCRBwDZtf1XmcmUisFLogzbTMDSn4BZgUWTWkkSEYUXqASZHcTR3sTN1kVX0E0UYYlZFkENHIjSn4BdhoWQFMFLMc0Sn4RZHYFVWgkbUcUV3fjTKAiKogjYyDSX5UEaScFLVkENHgWTogDdKkicoEVcQcUVlolQYgCRR4DZtfmX5UjQiASSW8DZtjFRlg0UXIWUWkENHI0Rv3RZHY1LwDldUw1TmAiUYgCRRAEZ2f1S2LSLgoWUFgzaQY0SnQzPLglK3IldEYzXvzzUOglKogjYXcEVxU0UYgCRRsDLtjFRlMSLgoWUrM0YvXUV3fjTPkFR3sTN1kVX0E0UYYlZFkENHIES2gjPHkWTWgkdUIiX3fjPLglKnM1Y2Y0XqASZHMGUCwDZtfVX0E0UY4TQVE1ZvjFRBkDdKkic4sjcIcUV4UkQikicCIFdUEiXqE0QHk2cwDldzP0XykjUYgGLogDdHg1S2LSLgoWUFgzaQY0Sn4RZHYFSGM1YQc0X4ASZHYGRBgTLEYTXvTkUOgldR0jcHIDRzgiQisFMTg0bUY0SnwjZHU2LC8Dc3XzXqEjTZoFLogzcHIDR4E0UXoWUxHFNHIDSn4BZic1cVM1ZvjFRyQ0PLglKnEVcQcUVNUjUgsFLogzPMgFR0MyPOQGNFM1ZAIkVpASZHgGRBgTdQcEV5UkLhgCRBwDZtf1XmcmUisFLogzbTMDSn4BZgUWTWkkSEYUXqASZHQTR3sTN1kVX0E0UYYlZFkENHgGSn4BdhoWQFMFLMc0Sn4RZHYFVWgkbUcUV3fjTKAiKogjYyDSX5UEaScFLVkENHITTogDdKkicoEVcQcUVlolQYgCRB0DZtfmX5UjQiASSW8DZtjFRlg0UXIWUWkENHI0Rv3RZHY1LwDldUw1TmAiUYgCRREEZ2f1S2LSLgoWUFgzaQY0SnQUZHYFSGM1YQc0X4ASZHYGRBgTLEYTXvTkUOgldR0jcHIDRzgiQisFMTg0bUY0SngkZHU2LC8Dc3XzXqEjTZoFLogTLHIDR4E0UXoWUxHFNHIDSn4BZic1cVM1ZvjFRyQ0PLglKnEVcQcUVNUjUgsFLogjQMgFR0MyPOQGNFM1ZAIkVpASZHICRBgTdQcEV5UkLhgCRBwDZtf1XmcmUisFLogzbTMDSn4BZgUWTWkkSEYUXqASZHcTR3sTN1kVX0E0UYYlZFkENHIjSn4BdhoWQFMFLMc0Sn4RZHYFVWgkbUcUV3fjTKAiKogjYyDSX5UEaScFLVkENHgWTogDdKkicoEVcQcUVlolQYgCRR4DZtfmX5UjQiASSW8DZtjFRlg0UXIWUWkENHI0Rv3RZHY1LwDldUw1TmAiUYgCRRAEZ2f1S2LSLgoWUFgzaQY0SnQzPLglK3IldEYzXvzzUOglKogjYXcEVxU0UYgCRRsDLtjFRlMSLgoWUrM0YvXUV3fjTPkFR3sTN1kVX0E0UYYlZFkENHIES2gjPHkWTWgkdUIiX3fjPLglKnM1Y2Y0XqASZHMGUCwDZtfVX0E0UY4TQVE1ZvjFRBkDdKkic4sjcIcUV4UkQikicCIFdUEiXqE0QHk2cwDldzP0XykjUYgGLogTdHg1S2LSLgoWUFgzaQY0Sn4RZHYFSGM1YQc0X4ASZHYGRBgTLEYTXvTkUOgldR0jcHIDRzgiQisFMTg0bUY0SnwjZHU2LC8Dc3XzXqEjTZoFLogzcHIDR4E0UXoWUxHFNHIDSn4BZic1cVM1ZvjFRyQ0PLglKnEVcQcUVNUjUgsFLogzPMgFR0MyPOQGNFM1ZAIkVpASZHgGRBgTdQcEV5UkLhgCRBwDZtf1XmcmUisFLogzbTMDSn4BZgUWTWkkSEYUXqASZHQTR3sTN1kVX0E0UYYlZFkENHgGSn4BdhoWQFMFLMc0Sn4RZHYFVWgkbUcUV3fjTKAiKogjYyDSX5UEaScFLVkENHITTogDdKkicoEVcQcUVlolQYgCRB0DZtfmX5UjQiASSW8DZtjFRlg0UXIWUWkENHI0Rv3RZHY1LwDldUw1TmAiUYgCRREEZ2f1S2LSLgoWUFgzaQY0SnQUZHYFSGM1YQc0X4ASZHYGRBgTLEYTXvTkUOgldR0jcHIDRzgiQisFMTg0bUY0SngkZHU2LC8Dc3XzXqEjTZoFLogTLHIDR4E0UXoWUxHFNHIDSn4BZic1cVM1ZvjFRyQ0PLglKnEVcQcUVNUjUgsFLogjQMgFR0MyPOQGNFM1ZAIkVpASZHICRBgTdQcEV5UkLhgCRBwDZtf1XmcmUisFLogzbTMDSn4BZgUWTWkkSEYUXqASZHcTR3sTN1kVX0E0UYYlZFkENHIjSn4BdhoWQFMFLMc0Sn4RZHYFVWgkbUcUV3fjTKAiKogjYyDSX5UEaScFLVkENHgWTogDdKkicoEVcQcUVlolQYgCRR4DZtfmX5UjQiASSW8DZtjFRlg0UXIWUWkENHI0Rv3RZHY1LwDldUw1TmAiUYgCRRAEZ2f1S2LSLgoWUFgzaQY0SnQzPLglK3IldEYzXvzzUOglKogjYXcEVxU0UYgCRRsDLtjFRlMSLgoWUrM0YvXUV3fjTPkFR3sTN1kVX0E0UYYlZFkENHIES2gjPHkWTWgkdUIiX3fjPLglKnM1Y2Y0XqASZHMGUCwDZtfVX0E0UY4TQVE1ZvjFRBkDdKkic4sjcIcUV4UkQikicCIFdUEiXqE0QHk2cwDldzP0XykjUYgGLogjdHg1S2LSLgoWUFgzaQY0Sn4RZHYFSGM1YQc0X4ASZHYGRBgTLEYTXvTkUOgldR0jcHIDRzgiQisFMTg0bUY0SnwjZHU2LC8Dc3XzXqEjTZoFLogzcHIDR4E0UXoWUxHFNHIDSn4BZic1cVM1ZvjFRyQ0PLglKnEVcQcUVNUjUgsFLogzPMgFR0MyPOQGNFM1ZAIkVpASZHgGRBgTdQcEV5UkLhgCRBwDZtf1XmcmUisFLogzbTMDSn4BZgUWTWkkSEYUXqASZHQTR3sTN1kVX0E0UYYlZFkENHgGSn4BdhoWQFMFLMc0Sn4RZHYFVWgkbUcUV3fjTKAiKogjYyDSX5UEaScFLVkENHITTogDdKkicoEVcQcUVlolQYgCRB0DZtfmX5UjQiASSW8DZtjFRlg0UXIWUWkENHI0Rv3RZHY1LwDldUw1TmAiUYgCRREEZ2f1S2LSLgoWUFgzaQY0SnQUZHYFSGM1YQc0X4ASZHYGRBgTLEYTXvTkUOgldR0jcHIDRzgiQisFMTg0bUY0SngkZHU2LC8Dc3XzXqEjTZoFLogTLHIDR4E0UXoWUxHFNHIDSn4BZic1cVM1ZvjFRyQ0PLglKnEVcQcUVNUjUgsFLogjQMgFR0MyPOQGNFM1ZAIkVpASZHICRBgTdQcEV5UkLhgCRBwDZtf1XmcmUisFLogzbTMDSn4BZgUWTWkkSEYUXqASZHcTR3sTN1kVX0E0UYYlZFkENHIjSn4BdhoWQFMFLMc0Sn4RZHYFVWgkbUcUV3fjTKAiKogjYyDSX5UEaScFLVkENHgWTogDdKkicoEVcQcUVlolQYgCRR4DZtfmX5UjQiASSW8DZtjFRlg0UXIWUWkENHI0Rv3RZHY1LwDldUw1TmAiUYgCRRAEZ2f1S2LSLgoWUFgzaQY0SnQzPLglK3IldEYzXvzzUOglKogjYXcEVxU0UYgCRRsDLtjFRlMSLgoWUrM0YvXUV3fjTPkFR3sTN1kVX0E0UYYlZFkENHIES2gjPHkWTWgkdUIiX3fjPLglKnM1Y2Y0XqASZHMGUCwDZtfVX0E0UY4TQVE1ZvjFRBkDdKkic4sjcIcUV4UkQikicCIFdUEiXqE0QHk2cwDldzP0XykjUYgGLogDLHg1S2LSLgoWUFgzaQY0Sn4RZHYFSGM1YQc0X4ASZHYGRBgTLEYTXvTkUOgldR0jcHIDRzgiQisFMTg0bUY0SnwjZHU2LC8Dc3XzXqEjTZoFLogzcHIDR4E0UXoWUxHFNHIDSn4BZic1cVM1ZvjFRyQ0PLglKnEVcQcUVNUjUgsFLogzPMgFR0MyPOQGNFM1ZAIkVpASZHgGRBgTdQcEV5UkLhgCRBwDZtf1XmcmUisFLogzbTMDSn4BZgUWTWkkSEYUXqASZHQTR3sTN1kVX0E0UYYlZFkENHgGSn4BdhoWQFMFLMc0Sn4RZHYFVWgkbUcUV3fjTKAiKogjYyDSX5UEaScFLVkENHITTogDdKkicoEVcQcUVlolQYgCRB0DZtfmX5UjQiASSW8DZtjFRlg0UXIWUWkENHI0Rv3RZHY1LwDldUw1TmAiUYgCRREEZ2f1S2LSLgoWUFgzaQY0SnQUZHYFSGM1YQc0X4ASZHYGRBgTLEYTXvTkUOgldR0jcHIDRzgiQisFMTg0bUY0SngkZHU2LC8Dc3XzXqEjTZoFLogTLHIDR4E0UXoWUxHFNHIDSn4BZic1cVM1ZvjFRyQ0PLglKnEVcQcUVNUjUgsFLogjQMgFR0MyPOQGNFM1ZAIkVpASZHICRBgTdQcEV5UkLhgCRBwDZtf1XmcmUisFLogzbTMDSn4BZgUWTWkkSEYUXqASZHcTR3sTN1kVX0E0UYYlZFkENHIjSn4BdhoWQFMFLMc0Sn4RZHYFVWgkbUcUV3fjTKAiKogjYyDSX5UEaScFLVkENHgWTogDdKkicoEVcQcUVlolQYgCRR4DZtfmX5UjQiASSW8DZtjFRlg0UXIWUWkENHI0Rv3RZHY1LwDldUw1TmAiUYgCRRAEZ2f1S2LSLgoWUFgzaQY0SnQzPLglK3IldEYzXvzzUOglKogjYXcEVxU0UYgCRRsDLtjFRlMSLgoWUrM0YvXUV3fjTPkFR3sTN1kVX0E0UYYlZFkENHIES2gjPHkWTWgkdUIiX3fjPLglKnM1Y2Y0XqASZHMGUCwDZtfVX0E0UY4TQVE1ZvjFRBkDdKkic4sjcIcUV4UkQikicCIFdUEiXqE0QHk2cwDldzP0XykjUYgGLogTLHg1S2LSLgoWUFgzaQY0Sn4RZHYFSGM1YQc0X4ASZHYGRBgTLEYTXvTkUOgldR0jcHIDRzgiQisFMTg0bUY0SnwjZHU2LC8Dc3XzXqEjTZoFLogzcHIDR4E0UXoWUxHFNHIDSn4BZic1cVM1ZvjFRyQ0PLglKnEVcQcUVNUjUgsFLogzPMgFR0MyPOQGNFM1ZAIkVpASZHgGRBgTdQcEV5UkLhgCRBwDZtf1XmcmUisFLogzbTMDSn4BZgUWTWkkSEYUXqASZHQTR3sTN1kVX0E0UYYlZFkENHgGSn4BdhoWQFMFLMc0Sn4RZHYFVWgkbUcUV3fjTKAiKogjYyDSX5UEaScFLVkENHITTogDdKkicoEVcQcUVlolQYgCRB0DZtfmX5UjQiASSW8DZtjFRlg0UXIWUWkENHI0Rv3RZHY1LwDldUw1TmAiUYgCRREEZ2f1S2LSLgoWUFgzaQY0SnQUZHYFSGM1YQc0X4ASZHYGRBgTLEYTXvTkUOgldR0jcHIDRzgiQisFMTg0bUY0SngkZHU2LC8Dc3XzXqEjTZoFLogTLHIDR4E0UXoWUxHFNHIDSn4BZic1cVM1ZvjFRyQ0PLglKnEVcQcUVNUjUgsFLogjQMgFR0MyPOQGNFM1ZAIkVpASZHICRBgTdQcEV5UkLhgCRBwDZtf1XmcmUisFLogzbTMDSn4BZgUWTWkkSEYUXqASZHcTR3sTN1kVX0E0UYYlZFkENHIjSn4BdhoWQFMFLMc0Sn4RZHYFVWgkbUcUV3fjTKAiKogjYyDSX5UEaScFLVkENHgWTogDdKkicoEVcQcUVlolQYgCRR4DZtfmX5UjQiASSW8DZtjFRlg0UXIWUWkENHI0Rv3RZHY1LwDldUw1TmAiUYgCRRAEZ2f1S2LSLgoWUFgzaQY0SnQzPLglK3IldEYzXvzzUOglKogjYXcEVxU0UYgCRRsDLtjFRlMSLgoWUrM0YvXUV3fjTPkFR3sTN1kVX0E0UYYlZFkENHIES2gjPHkWTWgkdUIiX3fjPLglKnM1Y2Y0XqASZHMGUCwDZtfVX0E0UY4TQVE1ZvjFRBkDdKkic4sjcIcUV4UkQikicCIFdUEiXqE0QHk2cwDldzP0XykjUYgGLogjLHg1S2LSLgoWUFgzaQY0Sn4RZHYFSGM1YQc0X4ASZHYGRBgTLEYTXvTkUOgldR0jcHIDRzgiQisFMTg0bUY0SnwjZHU2LC8Dc3XzXqEjTZoFLogzcHIDR4E0UXoWUxHFNHIDSn4BZic1cVM1ZvjFRyQ0PLglKnEVcQcUVNUjUgsFLogzPMgFR0MyPOQGNFM1ZAIkVpASZHgGRBgTdQcEV5UkLhgCRBwDZtf1XmcmUisFLogzbTMDSn4BZgUWTWkkSEYUXqASZHQTR3sTN1kVX0E0UYYlZFkENHgGSn4BdhoWQFMFLMc0Sn4RZHYFVWgkbUcUV3fjTKAiKogjYyDSX5UEaScFLVkENHITTogDdKkicoEVcQcUVlolQYgCRB0DZtfmX5UjQiASSW8DZtjFRlg0UXIWUWkENHI0Rv3RZHY1LwDldUw1TmAiUYgCRREEZ2f1S2LSLgoWUFgzaQY0SnQUZHYFSGM1YQc0X4ASZHYGRBgTLEYTXvTkUOgldR0jcHIDRzgiQisFMTg0bUY0SngkZHU2LC8Dc3XzXqEjTZoFLogTLHIDR4E0UXoWUxHFNHIDSn4BZic1cVM1ZvjFRyQ0PLglKnEVcQcUVNUjUgsFLogjQMgFR0MyPOQGNFM1ZAIkVpASZHICRBgTdQcEV5UkLhgCRBwDZtf1XmcmUisFLogzbTMDSn4BZgUWTWkkSEYUXqASZHcTR3sTN1kVX0E0UYYlZFkENHIjSn4BdhoWQFMFLMc0Sn4RZHYFVWgkbUcUV3fjTKAiKogjYyDSX5UEaScFLVkENHgWTogDdKkicoEVcQcUVlolQYgCRR4DZtfmX5UjQiASSW8DZtjFRlg0UXIWUWkENHI0Rv3RZHY1LwDldUw1TmAiUYgCRRAEZ2f1S2LSLgoWUFgzaQY0SnQzPLglK3IldEYzXvzzUOglKogjYXcEVxU0UYgCRRsDLtjFRlMSLgoWUrM0YvXUV3fjTPkFR3sTN1kVX0E0UYYlZFkENHIES2gjPHkWTWgkdUIiX3fjPLglKnM1Y2Y0XqASZHMGUCwDZtfVX0E0UY4TQVE1ZvjFRBkDdKkic4sjcIcUV4UkQikic4sjcIcUV4UkQikGMC8Tc5YkVokjLgoWUsE1azDSV4XWZhUGNVEVdqYUXvbmUXoGNrIVN1MjXmkzUXMWSs8zMtTETRUDUSYlZFkENHglX0giUgUDMVgEZ2YUVpkjPHESQFEFLUY0SnQTZKYGR3sTN1k2R1UDahcFLwHVN1kFU0giUgkGLTgEcEESVqkTaOcCRvDVcvDiX4XWZTUGNVElYpYTV3fDdhoWUGk0a3XETkkjLgUGLrgjYyXEVyUkUOgFSEMFLQYkV0gSUPglKRMVdUwlX3fjPLglKRkkZqYzXmkjQgsFLogzcHIDRm0jQi8VVWkENHIESnMyPOAUQrI1YvXUV5UEahkGMC8DTEwlXmAiUYoWUrIlYtbEV3UjUgsVTWkEdqQTV3fDZhUGNVE1TqwFYq0TaHYFVWgkbUcUV3fDZLQmKogTcyLzSPUDahcFLVkkdUwlXl4xUXgWQVE1ZQcUV3sFQYgCRnIVc3XUXAkTLhUWRGIldqESXzACUXoWUrI1aEYTX4kjPHESQFEFLUY0SnQTZKYGR3sTN1MDUmkzUXMWUFM1ZIcDR1UDahcFLVkkdUwlXIEkUOgFRxDVcvXzTu0zQisFMVkEdAASX4slQi8FNrEFZtf1XmcmUisFLogDLyHDSncCZOciKUgEdEYUXqE0UYgWPBI1YIcEVyUkQisVRWIkZvjFR3gSLgMWSvDFLIICVqEEUYIWQVQVS3XTVqkjPHESQFEFLUY0Sn4RZKYGR3sTN1MDUmkzUXMWUFM1ZIcDR1UDahcFLVkkdUwlXIEkUOgFRxDVcvX0T0EkUiIWQFM1a3vVXOQSLSwVVrgjYXcEVxU0UYgCRRwDctjFR0MyPOAUQrI1YvXUV5UEahYlKWgEdEYUXqE0UYg2ZDkENHglX0giUgQzZwHldEwVXoUEaPsVTxL1ZUwVXMsVLXkWRBgTLEYTXvTkUOgFQ40DctjFR0MyPOUmKUgEdEYUXqE0UYgWSs8zM2fFU0giUgkicoQUc3XUXlolQYgCR3IldUcTVugCaPUVRxDVcvvFRlMiUXMWUV8DZLUzXvDkUZUGNqAEZtH0X4UEahgCRBwDZtHUVpslQicVRFE1ZvjFR2gjPHcVSFM1aYcUV3fjPLg1LC8DTEwlXmAiUYoWUrIVdzLzSPUDahcFLVkkdUwlXl4xUXgWQVE1ZQcUV3sFQYgCRnIVc3XUXSsFajsVSsgjYXcEVxU0UYgCR3wDctjFR0MyPOAUQrI1YvXUV5UEahYlKWgEdEYUXqE0UYg2ZDkENHglX0giUgETRwHVcIcjX5sVLgQGLTgkdUwlXuUjQgkWRBgTLEYTXvTkUOgFQosjcHg2R4X2PTcVRWg0bUYzXqkzQHYWQrI1YvXUV5UEahkTTV8DZHISX0AiQS8VSGM1ZzXUV3EDLgk2ZFM1a3vVXn4BZic1cVM1ZvjFR4MiTMQiZS4DMpMkS1AUZMkGRS0TLlkFR0MyPOAUQrI1YvXUV5UEahYlKWgEdEYUXqE0UYg2ZDkENHglX0giUgMENVMFdMYUVDUkQgc1ZWMUcQYUVn4BZic1cVM1ZvjFR1MiPLg1Mn8zMtTEV3UjUgsVTWkEdAIjXmkzUXMWUFM1ZIckTpASZHgGNwD1bvnWXpU0QgcVTWoUczDyTzgiZYwVRBgTLEYTXvTkUOgFQosjcHg2R4X2PTcVRWg0bUYzXqkzQHYWQrI1YvXUV5UEahkTTV8DZHISX0AiQQ8VSGM1YzDCVqkDUYo2XWk0ZzX0Tu0TLhglKnM1Y2Y0XqASZHcmXosjcHg2R4XWdKAUQrI1YvXUV5UEahkGMC8TcHASX0ACaOcCRvDVcvXDRuEkUOgFSGMFLQYkV00jdWgGNwD1bIIDRzUjUgsFLogzTQc0XpsVLgUVSpgjYTIiXqkzUOglKogjYTYTVuE0UXg1cVkENHIESn4hTXkVTWoULUY0Sn4RZHkicCQ0YIcEVyUkQisVRxHVN1MDUmkzUXMWUFM1ZIcDR1UDahcFLVkkdUwlXIEkUOgFRxDVcvDCUu81UYkWRBgTLEYTXvTkUOgFTosjcHg2R4X2PTcVRWg0bUYzXqkzQHYWQrI1YvXUV5UEahkTTV8DZHISX0AiUPgVSxDFdAczXugCag0TQFM1ZIckVmcWLhglKnM1Y2Y0XqASZHg2LBwDZ2f1S23RUXgWQVE1ZQcUV3EjPhcVRWg0bUYzXqkzURoFLogDd3DSXycGUZkWTWkEcUwlXPgSLh8VTWoUczvFRlg0UXIWUWkENHgWSz4RZHU2LC8DTEwlXmAiUYoWUrIlYtbEV3UjUgsVTWkEdqQTV3fDZhUGNVE1T3X0X30jUYQTUFE1Yqc0T0EkUYglKnM1Y2Y0XqASZHY2LBwDZ2f1S23RUXgWQVE1ZQcUV3EjPhcVRWg0bUYzXqkzURoFLogDd3DSXyAidgoVUGE1YQckV0QSLSQGNpkEaIIDRwTjQgASUV8DZDk1R1gDdKkicCQ0YIcEVyUkQisVRGgjcEwlXmAiUYoWUrIVRQY0SngjLgUGLFE0aMczXmQSLXsVRTkkdicUVqQiUS8VSwHFZtf1XmcmUisFLogzchk1R1gDdKkic4sDTEwlXmAiUYoWUrIVdzLzS0gDLgUGLr8zMHASX0AiQH8VTV8DZLYTX00zUY0zZwfUYIISX0ACaHY1LVg0bUY0SnwDQgUWSWkUYvPkVogyZTUGNVEFZtH0X4UEahgCRBwDZtHUVpslQicVRFE1ZvjFR1gjPHcVSFM1aYcUV3fjPLg1LC8DTEwlXmAiUYoWUrIVdzLzSPUDahcFLVkkdUwlXl4xUXgWQVE1ZQcUV3sFQYgCRnIVc3XUXSsFajsVSsgjYXcEVxU0UYgCRBwDctjFR0MyPOAUQrI1YvXUV5UEahYlKWgEdEYUXqE0UYg2ZDkENHglX0giUgETRwHVcIcjX5sVLgQGLTgkdUwlXuUjQgkWRBgTLEYTXvTkUOglKosjcHg2R4X2PTcVRWg0bUYzXqkzQHYWQrI1YvXUV5UEahkTTV8DZHISX0AiQS8VSGM1ZzXUV3EDLgk2ZFM1a3vVXn4BZic1cVM1ZvjFR4MiPLg1Mn8zMtTEV3UjUgsVTWkEdAIjXmkzUXMWUFM1ZIckTpASZHgGNwD1bMASXvjjLXsVTTkkbEYEYMgiQYsVRBgTLEYTXvTkUOglKosjcHg2R4X2PTcVRWg0bUYzXqkzQHYWQrI1YvXUV5UEahkTTV8DZHISX0AiUSUWTVMlbEYzXugCag8DMwLEaYwFRlg0UXIWUWkENHIDSz4RZHU2LC8DTEwlXmAiUYoWUrIlYtbEV3UjUgsVTWkEdqQTV3fDZhUGNVEFQqEiX5UDagkVUrA0ZQIyXqUEag0zZwfUdIIDRwTjQgASUV8DZDkWSz4RZHU2LC8TctTEV3UjUgsVTWkEdM01S2bCZTUGNVEVN1k2RRgSLgMWSs8zM2fFU0giUgkGLTgEcEESVqkTaOcyMnIVc3XUX4slUgAycVgkd3vlX4X2PhUWSWokdqESXzsFag0FMC8jcEwlXmASLhkicCQUPIUETMEjTZoFLogDd3DSXy0DLgASRxf0ZEoVXscmUYglKnM1Y2Y0XqASZHQiKosjcHg2R4X2PTETRUAUSAIkVpASZHgGNwD1bMASXvjjLXsVTToUdQcEVz0jUYglKnM1Y2Y0XqASZHk2LBwDZ2f1S2biPhcVRWg0bM01S2biPhUWSWokdqESXzsFag0FMC8TctzlX0MFahcFLr8zMLISXvjjLXs1ZrEFa3XDRyUDagASVVgUZQc0X3UEahgCRRAELQYkV0gSUSUWTVkkbqwVXskjPHMWQVoEcQUUVyD0UOgFSTkkb2ESXn4hPiUWPGU0ZmczX3fjPjcGRBgDZ3XzX5giUgQUUFQldvjFRIQidTQURqszcHkFRlwTLgIGNVMFdvjFRrkkUYkVQFkEdHwFRlwTLgMWPxDFcUwVX50TUZUSUV8DZtjFRlwzUYkVTWoUczX0T0EkUYgCRBwDZ2f1S2bCdhISQVEVNt3hKt3hKt3hKt3hKtQUUCUEQTg2ZrM1YQcUVDUjQicVPP4RPHQEY1UTLhkWPP4RPL4hKi4hKt3hKt3hKtXlTU0DUQAURWoULEYzXqEEUXoWQFwyKIMzasA2atUlaz4COuX0TTMCTrU2Yo41TzEFck4C."
						}
,
						"snapshotlist" : 						{
							"current_snapshot" : 0,
							"entries" : [ 								{
									"filetype" : "C74Snapshot",
									"version" : 2,
									"minorversion" : 0,
									"name" : "SWAM Cello 3",
									"origin" : "SWAM Cello 3.vst3info",
									"type" : "VST3",
									"subtype" : "Instrument",
									"embed" : 0,
									"snapshot" : 									{
										"pluginname" : "SWAM Cello 3.vst3info",
										"plugindisplayname" : "SWAM Cello 3",
										"pluginsavedname" : "C74_VST3:/SWAM Cello 3",
										"pluginsaveduniqueid" : -298341311,
										"version" : 1,
										"isbank" : 0,
										"isbase64" : 1,
										"sliderorder" : [  ],
										"slidervisibility" : [ 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 1, 1, 0, 1, 1, 1, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ],
										"blob" : "19509.VMjLgvBS...O+fWarAhckI2bo8la8HRLt.iHfTlai8FYo41Y8HRUTYTK3HxO9.BOVMEUy.Ea0cVZtMEcgQWY9vSRC8Vav8lak4Fc9DCM0PiMtXUSGM1UA4hKtXlKt3hKP4hKt3hKtvjdXQ2bD4hKlkFcFkjdP4VPt3hKHYGUoUULL4BS1IjKt3hKtPjKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3xLHgVUCkzTHMVYC4hK1k2Sy.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.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.UczXzX3giQgIWUrIVS3XTVqkjPHESQFEFLUY0Sn4RZKYGR3sTN1MDUAkTUP0TPRokZvjFRoUDai8VTxPUZEYTXqkjPHESQFEFLUY0SnQTZKYGR3sTN1MDUAkTUP0TPRokZvjFRqc1QhgWSEMFdIUUV4ETUXgWQVEFZtf1XmcmUisFLogjcyHDSncCZOciKUAkTEQ0TlolQYgCR3o0ZqICUxrlQik1YVkUd3nGV5UDaisVTqI1YzDiX1kjPHESQFEFLUY0SnoGdLQmKogTcyLzSPUjZTEDLDgzaQY0SnImUYQSSvL1aQICVtUULhAUQwj0ZMAyXuEkLX4VRBgTLEYTXvTkUOglKosjcHg2R4X2PTETRUAUSAIkVpASZHEWSsU0Z2wFUqAiUXYWRBgTLEYTXvTkUOglKosDLHg2R4X2PTETRUAUSAIkVpASZHM2ZwfEd3XTUvPiUYsTUVQ1TickV50jQZsVSsQ0ZMcUV5kjPHESQFEFLUY0SnQTZKYGR3sTN1MDUAkTUP0TPRokZvjFRysVLXgGNFUELzXUVLUkUXgGMrAEMyQUVzzDLi8VTxfkaUEiXn4BZic1cVM1ZvjFR1MiPLg1Mn8zMtTETRUDUSYlZFkENHIUXuEkUZAURxDFaqYTXqkjPHESQFEFLUY0SnQTZKYGR3sTN1MDUAkTUP0TPRokZvjFRzgiQisFNpkEaYUUVxgSLX8VTWQFZtf1XmcmUisFLogzcyHDSncCZOciKUAkTEQ0TlolQYgCRBI1YzXkVokjPHESQFEFLUY0Sn4RZKYGR3sTN1MDUAkTUP0TPRokZvjFR1slQik1YrA0ZzXTVDgSLiQWRBgTLEYTXvTkUOgFRosjcHg2R4X2PTETRUAUSAIkVpASZHY2ZFMVZmwFTqQiQYUUPsgjYXcEVxU0UYgCRnwDctjFR0MyPOAUQpQUPvPDRuEkUOglKWoUMuICT0cmQSs1XrEVcMoWXzEUahU2crgjYXcEVxU0UYgCRBwDctjFR0MyPOAUQpQUPvPDRuEkUOglKxDFdQcEVy0TQhI2ZFMlTEYzXugiQTcVRWg0bIIDRwTjQgASUV8DZTMDSz4RZHU2LC8DTEoFUAACQH8VTV8DZtHSX3E0UXMWUrEld3DCT5kzQgglKnM1Y2Y0XqASZHY2LBwDZ2f1S23RUPIUQTMkYpYTV3fjPhUWRGM1YvXUVzEkLg0TQFQFUqYUXqkjPHESQFEFLUY0SngTZKACR3sTN1MDUAkTUP0TPRokZvjFR3UULXs1ZrM1ZvPkTDsldP4VQrEFcUYTXn4BZic1cVM1ZvjFR2gUZKYGR3sTN1MDUAkTUP0TPRokZvjFR3UkQgsVQwH1ZiUkVzEULPUGMFMFd3XTXxUEah0DNFk0ZIIDRwTjQgASUV8DZtj1R1gDdKkicCQUPIUETMEjTZoFLogTdUIiX5UjUZQWRBgTLEYTXvTkUOglKosjcHg2R4X2PTETRUAUSAIkVpASZHkWUxHldEYkVzkTUXMWPsgjYXcEVxU0UYgCRBwDctjFR0MyPOAUQpQUPvPDRuEkUOgFTsI1YzDiX1gSLhsVRBgTLEYTXvTkUOgldRwDdyHDSncCZOcyMBI1YIcEVy0TaOcidTIEQqoFUqAiUXYWPWoEciYTUmkjQgsFMC8TSqQTTIkTUYMWQFIlcqwVXsUkZgoWRWQlYTwVXmkjQgsVTV8DZDkFRl4xUXgWQVE1ZQcUV3sFQYgCRRk0LA0lXq0jLh8FNrEFZtfGVtUDagQWUFEFNHIESxfjPHMWUwHVdEESVqEUUjYWUV8DZDkFRloWLhgFLogzcDkFRlYWLhgFLogzbDkFR4X2TSkTTTIkTUYUXmEzQh8FMwj0PU0lXwTkQH8FMFIFLQIyUysFaggCRBwDctjFRloFagYWUGMVYvXEVy.SZHcGR40DctjFRlciUioGNUE1azX0SnwTZKYGRBgTcUczXkAiUXMCLogzcHkWSz4RZHYFSGo0YAcUV3fjPLQmK4wDMpMkSzn1TNQCQCwDLpkGS1wTdLglK3IFMvXUXqEUahQCLogjcyHjS14xPLYmKCwzcDMkS34xTNgmZogjYHYEY1UTLhkGLogjcHIDRnslQhU2cVgEdvjFR1gDdKkic4sTSqQTTIkTUYMWQFIlcqwVXsUkZgoWRWQVN1M0TIEEURIUUVE1YAcjXuQSLYUDMFMFdqcDRqQiUXg1cVkkZvjFR2gjPHYWQrI1YvXUV5UEahkTTV8DZXckVnkzUXoGNFE0ZAczXtkjPHk1YVgEczXUVxASZHcmXogjY5YUV40zUX0VUFUEMAcUV3fjTLglKREVdIY0SnQTZHYlcwHFZvjFRyQTZHkicSMURQQkTRUkUgcVPGI1azDSVCUUahESUFgzazXjXvDkLWM2ZrEFNHIDSz4RZHYlZrElcUczXkAiUXMCLogzcHkWSz4RZHY1MVMld3TUXuQiUOgFQosjcHIDR0U0QiUFLVg0LvjFR2QzPLQmKogjYLcjVmEzUYgCRBwDctjFRlwzUjMGLVkkdIcEY3fjPLQGUogjYHYEY1UTLhkGLogjcHIDRnslQhU2cVgEdvjFR1gDdKkic4sTSqQTTIkTUYMWQFIlcqwVXsUkZgoWRWQVN1M0TIEEURIUUVE1YAcjXuQSLYUDMFMFdqcDRqQiUXg1cVkkZvjFR2gjPHYWQrI1YvXUV5UEahkTTV8DZXckVnkzUXoGNrQ0YQcUVn4BdX4VQrEFcUYTX3fjTLICRBgzbUEiX4UTLYsVTUQlcUY0SnQTZHYldwHFZvjFR2oVZHYlcwHFZvjFRyQTZHkicSMURQQkTRUkUgcVPGI1azDSVCUUahESUFgzazXjXvDkLWM2ZrEFNHIDSz4RZHYlZrElcUczXkAiUXMCLogzcHkWSz4RZHY1MVMld3TUXuQiUOglKosjcHIDR0U0QiUFLVg0LvjFR2gTdMQmKogjYLcjVmEzUYgCRBwDctjFRlwzUjMGLVkkdIcEY3fjPLQGUogjYHYEY1UTLhkGLogjcHIDRnslQhU2cVgEdvjFR1gDdKkic4sTSqQTTIkTUYMWQFIlcqwVXsUkZgoWRWQVN1M0TIEEURIUUVE1YAcjXuQSLYUDMFMFdqcDRqQiUXg1cVkkZvjFR2gjPHYWQrI1YvXUV5UEahkTTV8DZ5YEVuQCaUU2cVM1bUwFRlwjQZcFMrE1Z2Y0SnQTdMglKRE1ZMIiXmMlUYQ0ZGI1ZvjFR2gjPHMWSsgENHgWSn4hPgkWRV8DZ5IESnMyPO0zZDEURIUUVyUjQhY2ZrEVaMQ0X3k0UYYlZrElcUczXkAiUZQGLogjcyHDSn4hTZQWPWMld3TUXmc1UOgFQowjLyHDSn4BdgASTxb0bqwVX3fjPLQmKogjY2X0X5gSUgc1YW8DZDkFSxLiPLglK3IlaEYjXqASZHY2LBwDZtfmXz.iUgsVTsIFMvjFR1MiTMglKngEMAcEV40zUOglKogjYHYkV1giQgcVRW8DZtjFR0MyPOUmdTIEQqoFUqAiUXYWPWoEciYUTzEUahQCMC8TSqQTTIkTUYMWQFIlcqwVXsUkZgoWRWQlYTwVXmkjQgsVTV8DZDkFRl4xUXgWQVE1ZQcUV3sFQYgCRBI1YzXDU0EUaHYFSFo0YzvVXqcmUOgFQ40DZtHUXq0jLhc1XVkEUqcjXqASZHcGRBgzbM0FV3fjTLYGRBgjbM0FV3fjTKcGRn8zM5QkTDslZTsFLVgkcAckVzMVLPASRsM1ZAIkVzEzUioGNUE1azX0Sn4RZKYGRBgzazXjXvDkLWMWQFQFNHIES3IVZKYGRBgTcUczXkAiUZQGLogjcyHDSn4BdgASTxb0bEYDY3fjTLgmXosjcHIDR4clUXYWUV8DZtj1R1gjPHk2ZWE1bUYzX3s1UOglKosDLHIDRns1QhcVSxHFNHIDSn4BZX8VPxDlbEwlX3fjPLg1Mn8zM2H0TIEEURIUUVE1YAcjXuQSLYUDMFMFdq01S2nGURQzZpQ0ZvXEV1EzUZQ2XVEEcQ0lXzDjTYQWQrgkbUYTV3fjTLglKBI1YIcEVyUkQisVRWIkZvjFR3UEaisVRsgUSqYDYn4BdX4VQrEFcUYTX3fjTLICRBgzbUEiX4UTLYsVTUQlcUY0SnQTZHYldwHFZvjFRz3RZHYlcwHFZvjFRyQTZHkicSMURQQkTRUkUgcVPGI1azDSVCUUahESUFgzazXjXvDkLWM2ZrEFNHIDSz4RZHYlZrElcUczXkAiUXMCLogzcHkWSz4RZHY1MVMld3TUXuQiUOglKosjcHIDR0U0QiUFLVg0LvjFR2gTdMQmKogjYLcjVmEzUYgCRBwDctjFRlwzUjMGLVkkdIcEY3fjPLQGUogjYHYEY1UTLhkGLogjcHIDRnslQhU2cVgEdvjFR1gDdKkic4sTSqQTTIkTUYMWQFIlcqwVXsUkZgoWRWQVN1M0TIEEURIUUVE1YAcjXuQSLYUDMFMFdqcDRqQiUXg1cVkkZvjFR2gjPHYWQrI1YvXUV5UEahkTTV8DZLc0X4E0UX8FMrgjYLYjVmQCags1cV8DZDkWSn4hTgsVSxH1YiYUVTs1QhsFLogzcHIDRy0TaXgCRn0jdHIDRx0TaXgCRRszcHg1S2nGURQzZpQ0ZvXEV1EzUZQ2Xw.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."
									}
,
									"fileref" : 									{
										"name" : "SWAM Cello 3",
										"filename" : "SWAM Cello 3.maxsnap",
										"filepath" : "~/OneDrive/Documents/Max 8/Snapshots",
										"filepos" : -1,
										"snapshotfileid" : "2477f033b1975057495a1d68f47c13b9"
									}

								}
 ]
						}

					}
,
					"text" : "vst~ \"C74_VST3:/SWAM Cello 3\"",
					"varname" : "vst~[1]",
					"viewvisibility" : 1
				}

			}
 ],
		"lines" : [  ],
		"parameters" : 		{
			"obj-3" : [ "vst~[1]", "vst~[1]", 0 ],
			"parameterbanks" : 			{
				"0" : 				{
					"index" : 0,
					"name" : "",
					"parameters" : [ "-", "-", "-", "-", "-", "-", "-", "-" ]
				}

			}
,
			"inherited_shortname" : 1
		}
,
		"dependency_cache" : [ 			{
				"name" : "OSC-route.mxe64",
				"type" : "mx64"
			}
, 			{
				"name" : "SWAM Cello 3.maxsnap",
				"bootpath" : "~/OneDrive/Documents/Max 8/Snapshots",
				"type" : "mx@s",
				"implicit" : 1
			}
 ],
		"autosave" : 0
	}

}
