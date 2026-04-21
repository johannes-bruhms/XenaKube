{
    "patcher": {
        "fileversion": 1,
        "appversion": {
            "major": 9,
            "minor": 1,
            "revision": 4,
            "architecture": "x64",
            "modernui": 1
        },
        "classnamespace": "box",
        "rect": [ 1379.0, 296.0, 583.0, 980.0 ],
        "boxes": [
            {
                "box": {
                    "id": "obj-19",
                    "maxclass": "message",
                    "numinlets": 2,
                    "numoutlets": 1,
                    "outlettype": [ "" ],
                    "patching_rect": [ 489.0, 233.0, 45.0, 22.0 ],
                    "text": "open 8"
                }
            },
            {
                "box": {
                    "id": "obj-22",
                    "maxclass": "message",
                    "numinlets": 2,
                    "numoutlets": 1,
                    "outlettype": [ "" ],
                    "patching_rect": [ 489.0, 209.0, 45.0, 22.0 ],
                    "text": "open 7"
                }
            },
            {
                "box": {
                    "id": "obj-23",
                    "maxclass": "message",
                    "numinlets": 2,
                    "numoutlets": 1,
                    "outlettype": [ "" ],
                    "patching_rect": [ 489.0, 185.0, 45.0, 22.0 ],
                    "text": "open 6"
                }
            },
            {
                "box": {
                    "id": "obj-24",
                    "maxclass": "message",
                    "numinlets": 2,
                    "numoutlets": 1,
                    "outlettype": [ "" ],
                    "patching_rect": [ 489.0, 164.0, 45.0, 22.0 ],
                    "text": "open 5"
                }
            },
            {
                "box": {
                    "id": "obj-13",
                    "maxclass": "message",
                    "numinlets": 2,
                    "numoutlets": 1,
                    "outlettype": [ "" ],
                    "patching_rect": [ 317.0, 233.0, 45.0, 22.0 ],
                    "text": "open 4"
                }
            },
            {
                "box": {
                    "id": "obj-8",
                    "maxclass": "message",
                    "numinlets": 2,
                    "numoutlets": 1,
                    "outlettype": [ "" ],
                    "patching_rect": [ 385.0, 203.0, 29.5, 22.0 ],
                    "text": "8"
                }
            },
            {
                "box": {
                    "id": "obj-4",
                    "maxclass": "newobj",
                    "numinlets": 1,
                    "numoutlets": 1,
                    "outlettype": [ "bang" ],
                    "patching_rect": [ 385.0, 174.0, 58.0, 22.0 ],
                    "text": "loadbang"
                }
            },
            {
                "box": {
                    "id": "obj-72",
                    "maxclass": "message",
                    "numinlets": 2,
                    "numoutlets": 1,
                    "outlettype": [ "" ],
                    "patching_rect": [ 317.0, 209.0, 45.0, 22.0 ],
                    "text": "open 3"
                }
            },
            {
                "box": {
                    "id": "obj-71",
                    "maxclass": "message",
                    "numinlets": 2,
                    "numoutlets": 1,
                    "outlettype": [ "" ],
                    "patching_rect": [ 317.0, 185.0, 45.0, 22.0 ],
                    "text": "open 2"
                }
            },
            {
                "box": {
                    "fontname": "Arial",
                    "fontsize": 13.0,
                    "id": "obj-17",
                    "maxclass": "message",
                    "numinlets": 2,
                    "numoutlets": 1,
                    "outlettype": [ "" ],
                    "patching_rect": [ 385.0, 229.0, 98.0, 23.0 ],
                    "text": "threadcount $1"
                }
            },
            {
                "box": {
                    "id": "obj-66",
                    "maxclass": "newobj",
                    "numinlets": 1,
                    "numoutlets": 2,
                    "outlettype": [ "signal", "signal" ],
                    "patching_rect": [ 78.72340369224548, 297.0, 178.0, 22.0 ],
                    "text": "poly~ swam-voice 8 @parallel 1"
                }
            },
            {
                "box": {
                    "id": "obj-56",
                    "maxclass": "newobj",
                    "numinlets": 1,
                    "numoutlets": 1,
                    "outlettype": [ "signal" ],
                    "patching_rect": [ 129.78723311424255, 634.0425486564636, 118.0, 22.0 ],
                    "text": "abl.dsp.compander~"
                }
            },
            {
                "box": {
                    "attr": "mode",
                    "id": "obj-57",
                    "maxclass": "attrui",
                    "numinlets": 1,
                    "numoutlets": 1,
                    "outlettype": [ "" ],
                    "parameter_enable": 0,
                    "patching_rect": [ 297.8723382949829, 651.0638251304626, 150.0, 22.0 ],
                    "text_width": 59.0
                }
            },
            {
                "box": {
                    "attr": "shape",
                    "id": "obj-58",
                    "maxclass": "attrui",
                    "numinlets": 1,
                    "numoutlets": 1,
                    "outlettype": [ "" ],
                    "parameter_enable": 0,
                    "patching_rect": [ 297.8723382949829, 674.4680802822113, 150.0, 22.0 ]
                }
            },
            {
                "box": {
                    "id": "obj-59",
                    "maxclass": "newobj",
                    "numinlets": 1,
                    "numoutlets": 1,
                    "outlettype": [ "signal" ],
                    "patching_rect": [ 87.234041929245, 674.4680802822113, 118.0, 22.0 ],
                    "text": "abl.dsp.compander~"
                }
            },
            {
                "box": {
                    "id": "obj-46",
                    "maxclass": "live.scope~",
                    "numinlets": 2,
                    "numoutlets": 1,
                    "outlettype": [ "bang" ],
                    "patching_rect": [ 344.3768837451935, 873.9495277404785, 184.0, 68.0 ]
                }
            },
            {
                "box": {
                    "attr": "lookahead",
                    "id": "obj-49",
                    "maxclass": "attrui",
                    "numinlets": 1,
                    "numoutlets": 1,
                    "outlettype": [ "" ],
                    "parameter_enable": 0,
                    "patching_rect": [ 256.98193097114563, 814.2856657505035, 185.0, 22.0 ]
                }
            },
            {
                "box": {
                    "attr": "release",
                    "id": "obj-50",
                    "maxclass": "attrui",
                    "numinlets": 1,
                    "numoutlets": 1,
                    "outlettype": [ "" ],
                    "parameter_enable": 0,
                    "patching_rect": [ 255.30125880241394, 789.0755832195282, 150.0, 22.0 ]
                }
            },
            {
                "box": {
                    "attr": "ceiling",
                    "id": "obj-51",
                    "maxclass": "attrui",
                    "numinlets": 1,
                    "numoutlets": 1,
                    "outlettype": [ "" ],
                    "parameter_enable": 0,
                    "patching_rect": [ 255.30125880241394, 765.5461728572845, 150.0, 22.0 ]
                }
            },
            {
                "box": {
                    "id": "obj-52",
                    "maxclass": "newobj",
                    "numinlets": 3,
                    "numoutlets": 3,
                    "outlettype": [ "signal", "signal", "signal" ],
                    "patching_rect": [ 87.234041929245, 890.7562494277954, 253.0, 22.0 ],
                    "text": "abl.device.limiter~"
                }
            },
            {
                "box": {
                    "attr": "gain",
                    "id": "obj-53",
                    "maxclass": "attrui",
                    "numinlets": 1,
                    "numoutlets": 1,
                    "outlettype": [ "" ],
                    "parameter_enable": 0,
                    "patching_rect": [ 255.30125880241394, 740.3360903263092, 150.0, 22.0 ]
                }
            },
            {
                "box": {
                    "attr": "mode",
                    "id": "obj-20",
                    "maxclass": "attrui",
                    "numinlets": 1,
                    "numoutlets": 1,
                    "outlettype": [ "" ],
                    "parameter_enable": 0,
                    "patching_rect": [ 256.98193097114563, 837.8150761127472, 185.0, 22.0 ]
                }
            },
            {
                "box": {
                    "attr": "drive",
                    "id": "obj-38",
                    "maxclass": "attrui",
                    "numinlets": 1,
                    "numoutlets": 1,
                    "outlettype": [ "" ],
                    "parameter_enable": 0,
                    "patching_rect": [ 289.3617000579834, 423.4042522907257, 150.0, 22.0 ]
                }
            },
            {
                "box": {
                    "id": "obj-39",
                    "lastchannelcount": 0,
                    "maxclass": "live.gain~",
                    "numinlets": 2,
                    "numoutlets": 5,
                    "orientation": 1,
                    "outlettype": [ "signal", "signal", "", "float", "list" ],
                    "parameter_enable": 1,
                    "patching_rect": [ 78.72340369224548, 540.425528049469, 136.0, 47.0 ],
                    "saved_attribute_attributes": {
                        "valueof": {
                            "parameter_initial": [ 0 ],
                            "parameter_initial_enable": 1,
                            "parameter_longname": "live.gain~[1]",
                            "parameter_mmax": 6.0,
                            "parameter_mmin": -70.0,
                            "parameter_modmode": 0,
                            "parameter_shortname": "live.gain~",
                            "parameter_type": 0,
                            "parameter_unitstyle": 4
                        }
                    },
                    "varname": "live.gain~[1]"
                }
            },
            {
                "box": {
                    "id": "obj-40",
                    "maxclass": "newobj",
                    "numinlets": 5,
                    "numoutlets": 2,
                    "outlettype": [ "signal", "signal" ],
                    "patching_rect": [ 78.72340369224548, 487.23403906822205, 136.0, 22.0 ],
                    "text": "abl.device.drumbuss~"
                }
            },
            {
                "box": {
                    "attr": "crunch",
                    "id": "obj-41",
                    "maxclass": "attrui",
                    "numinlets": 1,
                    "numoutlets": 1,
                    "outlettype": [ "" ],
                    "parameter_enable": 0,
                    "patching_rect": [ 289.3617000579834, 448.93616700172424, 150.0, 22.0 ]
                }
            },
            {
                "box": {
                    "attr": "mix",
                    "id": "obj-42",
                    "maxclass": "attrui",
                    "numinlets": 1,
                    "numoutlets": 1,
                    "outlettype": [ "" ],
                    "parameter_enable": 0,
                    "patching_rect": [ 289.3617000579834, 502.1276559829712, 150.0, 22.0 ]
                }
            },
            {
                "box": {
                    "attr": "boom",
                    "id": "obj-43",
                    "maxclass": "attrui",
                    "numinlets": 1,
                    "numoutlets": 1,
                    "outlettype": [ "" ],
                    "parameter_enable": 0,
                    "patching_rect": [ 289.3617000579834, 472.3404221534729, 150.0, 22.0 ]
                }
            },
            {
                "box": {
                    "id": "obj-31",
                    "maxclass": "newobj",
                    "numinlets": 1,
                    "numoutlets": 1,
                    "outlettype": [ "signal" ],
                    "patching_rect": [ 108.0, 340.0, 192.0, 22.0 ],
                    "text": "abl.dsp.compander~ @shape 0.15"
                }
            },
            {
                "box": {
                    "attr": "mode",
                    "id": "obj-27",
                    "maxclass": "attrui",
                    "numinlets": 1,
                    "numoutlets": 1,
                    "outlettype": [ "" ],
                    "parameter_enable": 0,
                    "patching_rect": [ 289.3617000579834, 344.6808485984802, 150.0, 22.0 ],
                    "text_width": 59.0
                }
            },
            {
                "box": {
                    "attr": "shape",
                    "id": "obj-29",
                    "maxclass": "attrui",
                    "numinlets": 1,
                    "numoutlets": 1,
                    "outlettype": [ "" ],
                    "parameter_enable": 0,
                    "patching_rect": [ 293.61701917648315, 372.34042286872864, 150.0, 22.0 ]
                }
            },
            {
                "box": {
                    "id": "obj-30",
                    "maxclass": "newobj",
                    "numinlets": 1,
                    "numoutlets": 1,
                    "outlettype": [ "signal" ],
                    "patching_rect": [ 78.72340369224548, 370.21276330947876, 192.0, 22.0 ],
                    "text": "abl.dsp.compander~ @shape 0.15"
                }
            },
            {
                "box": {
                    "id": "obj-11",
                    "linecount": 18,
                    "maxclass": "comment",
                    "numinlets": 1,
                    "numoutlets": 0,
                    "patching_rect": [ 1153.1914811134338, 1668.0850944519043, 472.0, 269.0 ],
                    "text": "// All midievent messages pass through unchanged whether logging is ON or OFF.\n// Other messages (anything, lists, ints) pass through too.\n//\n// Send these messages to the left inlet:\n//   on              start capture, clear buffer\n//   off             stop capture\n//   clear           empty buffer, reset t=0\n//   dump            post summary + full JSON to Max window\n//   limit <n>       cap buffer size (default 4000)\n//   ks_ch <n>       override KS channel 1-16 (default 2 = xk_swam.js KS_CH)\n//   help            list commands\n//\n// Typical use:\n//   1. Hit \"on\", do the turn sequence that mis-fires harmonics / tremolo.\n//   2. Hit \"dump\". Copy the Max window text, paste to an LLM.\n//\n// Captured per event: relative ms, channel, type (noteOn/noteOff/cc/…),\n// raw bytes, and for KS notes the xk_swam.js field label + option guess.\n"
                }
            },
            {
                "box": {
                    "id": "obj-9",
                    "maxclass": "button",
                    "numinlets": 1,
                    "numoutlets": 1,
                    "outlettype": [ "bang" ],
                    "parameter_enable": 0,
                    "patching_rect": [ 255.31914710998535, 193.6170198917389, 24.0, 24.0 ]
                }
            },
            {
                "box": {
                    "id": "obj-21",
                    "maxclass": "button",
                    "numinlets": 1,
                    "numoutlets": 1,
                    "outlettype": [ "bang" ],
                    "parameter_enable": 0,
                    "patching_rect": [ 195.74467945098877, 176.59574341773987, 24.0, 24.0 ]
                }
            },
            {
                "box": {
                    "id": "obj-12",
                    "maxclass": "toggle",
                    "numinlets": 1,
                    "numoutlets": 1,
                    "outlettype": [ "int" ],
                    "parameter_enable": 0,
                    "patching_rect": [ 78.72340369224548, 121.04255223274231, 48.0, 48.0 ]
                }
            },
            {
                "box": {
                    "id": "obj-10",
                    "maxclass": "newobj",
                    "numinlets": 2,
                    "numoutlets": 1,
                    "outlettype": [ "" ],
                    "patching_rect": [ 78.72340369224548, 208.51063680648804, 32.0, 22.0 ],
                    "text": "gate"
                }
            },
            {
                "box": {
                    "id": "obj-6",
                    "lastchannelcount": 0,
                    "maxclass": "live.gain~",
                    "numinlets": 2,
                    "numoutlets": 5,
                    "outlettype": [ "signal", "signal", "", "float", "list" ],
                    "parameter_enable": 1,
                    "patching_rect": [ 87.234041929245, 940.3360784053802, 48.0, 136.0 ],
                    "saved_attribute_attributes": {
                        "valueof": {
                            "parameter_longname": "live.gain~",
                            "parameter_mmax": 6.0,
                            "parameter_mmin": -70.0,
                            "parameter_modmode": 3,
                            "parameter_shortname": "live.gain~",
                            "parameter_type": 0,
                            "parameter_unitstyle": 4
                        }
                    },
                    "varname": "live.gain~"
                }
            },
            {
                "box": {
                    "id": "obj-5",
                    "maxclass": "ezdac~",
                    "numinlets": 2,
                    "numoutlets": 0,
                    "patching_rect": [ 78.72340369224548, 1380.8510539531708, 45.0, 45.0 ]
                }
            },
            {
                "box": {
                    "filename": "xk_swam.js",
                    "id": "obj-2",
                    "maxclass": "newobj",
                    "numinlets": 1,
                    "numoutlets": 2,
                    "outlettype": [ "", "" ],
                    "patching_rect": [ 78.72340369224548, 255.31914710998535, 167.0, 22.0 ],
                    "saved_object_attributes": {
                        "parameter_enable": 0
                    },
                    "text": "v8 xk_swam.js @autowatch 1",
                    "textfile": {
                        "filename": "xk_swam.js",
                        "flags": 0,
                        "embed": 0,
                        "autowatch": 1
                    }
                }
            },
            {
                "box": {
                    "id": "obj-1",
                    "maxclass": "newobj",
                    "numinlets": 1,
                    "numoutlets": 1,
                    "outlettype": [ "" ],
                    "patching_rect": [ 91.48936104774475, 176.59574341773987, 104.0, 22.0 ],
                    "text": "udpreceive 57121"
                }
            },
            {
                "box": {
                    "id": "obj-70",
                    "maxclass": "message",
                    "numinlets": 2,
                    "numoutlets": 1,
                    "outlettype": [ "" ],
                    "patching_rect": [ 317.0, 164.0, 45.0, 22.0 ],
                    "text": "open 1"
                }
            }
        ],
        "lines": [
            {
                "patchline": {
                    "destination": [ "obj-10", 1 ],
                    "order": 1,
                    "source": [ "obj-1", 0 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-21", 0 ],
                    "order": 0,
                    "source": [ "obj-1", 0 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-2", 0 ],
                    "source": [ "obj-10", 0 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-10", 0 ],
                    "order": 1,
                    "source": [ "obj-12", 0 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-5", 0 ],
                    "midpoints": [ 88.22340369224548, 195.80850887298584, 63.91489124298096, 195.80850887298584, 63.91489124298096, 1119.8085088729858, 88.22340369224548, 1119.8085088729858 ],
                    "order": 0,
                    "source": [ "obj-12", 0 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-66", 0 ],
                    "source": [ "obj-13", 0 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-66", 0 ],
                    "source": [ "obj-17", 0 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-66", 0 ],
                    "source": [ "obj-19", 0 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-66", 0 ],
                    "order": 1,
                    "source": [ "obj-2", 0 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-9", 0 ],
                    "order": 0,
                    "source": [ "obj-2", 0 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-52", 0 ],
                    "source": [ "obj-20", 0 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-66", 0 ],
                    "source": [ "obj-22", 0 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-66", 0 ],
                    "source": [ "obj-23", 0 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-66", 0 ],
                    "source": [ "obj-24", 0 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-30", 0 ],
                    "midpoints": [ 298.8617000579834, 367.80850887298584, 210.91489124298096, 367.80850887298584, 210.91489124298096, 331.80850887298584, 78.91489124298096, 331.80850887298584, 78.91489124298096, 361.80850887298584, 88.22340369224548, 361.80850887298584 ],
                    "order": 1,
                    "source": [ "obj-27", 0 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-31", 0 ],
                    "midpoints": [ 298.8617000579834, 367.80850887298584, 286.4863198144095, 367.80850887298584, 286.4863198144095, 331.80850887298584, 117.5, 331.80850887298584 ],
                    "order": 0,
                    "source": [ "obj-27", 0 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-30", 0 ],
                    "midpoints": [ 303.11701917648315, 400.80850887298584, 63.91489124298096, 400.80850887298584, 63.91489124298096, 364.80850887298584, 88.22340369224548, 364.80850887298584 ],
                    "order": 1,
                    "source": [ "obj-29", 0 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-31", 0 ],
                    "midpoints": [ 303.11701917648315, 391.80850887298584, 286.4863198144095, 391.80850887298584, 286.4863198144095, 331.80850887298584, 117.5, 331.80850887298584 ],
                    "order": 0,
                    "source": [ "obj-29", 0 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-40", 0 ],
                    "source": [ "obj-30", 0 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-40", 1 ],
                    "source": [ "obj-31", 0 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-40", 0 ],
                    "source": [ "obj-38", 0 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-56", 0 ],
                    "source": [ "obj-39", 1 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-59", 0 ],
                    "source": [ "obj-39", 0 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-8", 0 ],
                    "source": [ "obj-4", 0 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-39", 1 ],
                    "source": [ "obj-40", 1 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-39", 0 ],
                    "source": [ "obj-40", 0 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-40", 0 ],
                    "source": [ "obj-41", 0 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-40", 0 ],
                    "source": [ "obj-42", 0 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-40", 0 ],
                    "source": [ "obj-43", 0 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-52", 0 ],
                    "source": [ "obj-49", 0 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-52", 0 ],
                    "source": [ "obj-50", 0 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-52", 0 ],
                    "source": [ "obj-51", 0 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-46", 0 ],
                    "source": [ "obj-52", 2 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-6", 1 ],
                    "source": [ "obj-52", 1 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-6", 0 ],
                    "source": [ "obj-52", 0 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-52", 0 ],
                    "source": [ "obj-53", 0 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-52", 1 ],
                    "source": [ "obj-56", 0 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-56", 0 ],
                    "midpoints": [ 307.3723382949829, 673.8085088729858, 295.4863198144095, 673.8085088729858, 295.4863198144095, 637.8085088729858, 139.28723311424255, 637.8085088729858 ],
                    "order": 0,
                    "source": [ "obj-57", 0 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-59", 0 ],
                    "midpoints": [ 307.3723382949829, 673.8085088729858, 219.91489124298096, 673.8085088729858, 219.91489124298096, 637.8085088729858, 87.91489124298096, 637.8085088729858, 87.91489124298096, 667.8085088729858, 96.734041929245, 667.8085088729858 ],
                    "order": 1,
                    "source": [ "obj-57", 0 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-56", 0 ],
                    "midpoints": [ 307.3723382949829, 697.8085088729858, 295.4863198144095, 697.8085088729858, 295.4863198144095, 637.8085088729858, 139.28723311424255, 637.8085088729858 ],
                    "order": 0,
                    "source": [ "obj-58", 0 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-59", 0 ],
                    "midpoints": [ 307.3723382949829, 706.8085088729858, 72.91489124298096, 706.8085088729858, 72.91489124298096, 670.8085088729858, 96.734041929245, 670.8085088729858 ],
                    "order": 1,
                    "source": [ "obj-58", 0 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-52", 0 ],
                    "source": [ "obj-59", 0 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-5", 1 ],
                    "source": [ "obj-6", 1 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-5", 0 ],
                    "source": [ "obj-6", 0 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-30", 0 ],
                    "source": [ "obj-66", 0 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-31", 0 ],
                    "source": [ "obj-66", 1 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-66", 0 ],
                    "source": [ "obj-70", 0 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-66", 0 ],
                    "source": [ "obj-71", 0 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-66", 0 ],
                    "source": [ "obj-72", 0 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-17", 0 ],
                    "source": [ "obj-8", 0 ]
                }
            }
        ],
        "parameters": {
            "obj-39": [ "live.gain~[1]", "live.gain~", 0 ],
            "obj-6": [ "live.gain~", "live.gain~", 0 ],
            "obj-66.1::obj-4": [ "vst~[9]", "vst~[2]", 0 ],
            "obj-66.2::obj-4": [ "vst~[2]", "vst~[2]", 0 ],
            "obj-66.3::obj-4": [ "vst~[3]", "vst~[2]", 0 ],
            "obj-66.4::obj-4": [ "vst~[4]", "vst~[2]", 0 ],
            "obj-66.5::obj-4": [ "vst~[5]", "vst~[2]", 0 ],
            "obj-66.6::obj-4": [ "vst~[6]", "vst~[2]", 0 ],
            "obj-66.7::obj-4": [ "vst~[7]", "vst~[2]", 0 ],
            "obj-66.8::obj-4": [ "vst~[8]", "vst~[2]", 0 ],
            "parameterbanks": {
                "0": {
                    "index": 0,
                    "name": "",
                    "parameters": [ "-", "-", "-", "-", "-", "-", "-", "-" ],
                    "buttons": [ "-", "-", "-", "-", "-", "-", "-", "-" ]
                }
            },
            "inherited_shortname": 1
        },
        "autosave": 0
    }
}