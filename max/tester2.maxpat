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
                    "id": "obj-72",
                    "maxclass": "message",
                    "numinlets": 2,
                    "numoutlets": 1,
                    "outlettype": [ "" ],
                    "patching_rect": [ 573.949545621872, 194.6170198917389, 45.0, 22.0 ],
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
                    "patching_rect": [ 510.2340397834778, 194.6170198917389, 45.0, 22.0 ],
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
                    "patching_rect": [ 337.8723382949829, 219.32771801948547, 98.0, 23.0 ],
                    "text": "threadcount $1"
                }
            },
            {
                "box": {
                    "fontname": "Arial",
                    "fontsize": 13.0,
                    "id": "obj-19",
                    "maxclass": "number",
                    "numinlets": 1,
                    "numoutlets": 2,
                    "outlettype": [ "", "bang" ],
                    "parameter_enable": 0,
                    "patching_rect": [ 337.8723382949829, 189.07561898231506, 53.0, 23.0 ]
                }
            },
            {
                "box": {
                    "id": "obj-66",
                    "maxclass": "newobj",
                    "numinlets": 1,
                    "numoutlets": 2,
                    "outlettype": [ "signal", "signal" ],
                    "patching_rect": [ 330.252081155777, 267.2268748283386, 178.0, 22.0 ],
                    "text": "poly~ swam-voice 3 @parallel 1"
                }
            },
            {
                "box": {
                    "id": "obj-65",
                    "maxclass": "newobj",
                    "numinlets": 1,
                    "numoutlets": 1,
                    "outlettype": [ "" ],
                    "patching_rect": [ 15.0, 60.378148555755615, 100.0, 22.0 ]
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
                            "parameter_initial": [ -12.0 ],
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
                    "patching_rect": [ 119.14893531799316, 327.6595721244812, 118.0, 22.0 ],
                    "text": "abl.dsp.compander~"
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
                    "patching_rect": [ 78.72340369224548, 370.21276330947876, 118.0, 22.0 ],
                    "text": "abl.dsp.compander~"
                }
            },
            {
                "box": {
                    "id": "obj-18",
                    "maxclass": "message",
                    "numinlets": 2,
                    "numoutlets": 1,
                    "outlettype": [ "" ],
                    "patching_rect": [ 387.2340397834778, 134.0425522327423, 168.0, 22.0 ],
                    "text": "v8 ks_logger.js @autowatch 1"
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
                    "id": "obj-24",
                    "maxclass": "message",
                    "numinlets": 2,
                    "numoutlets": 1,
                    "outlettype": [ "" ],
                    "patching_rect": [ 451.0638265609741, 87.234041929245, 39.0, 22.0 ],
                    "text": "dump"
                }
            },
            {
                "box": {
                    "id": "obj-23",
                    "maxclass": "message",
                    "numinlets": 2,
                    "numoutlets": 1,
                    "outlettype": [ "" ],
                    "patching_rect": [ 419.14893317222595, 87.234041929245, 29.5, 22.0 ],
                    "text": "off"
                }
            },
            {
                "box": {
                    "id": "obj-22",
                    "maxclass": "message",
                    "numinlets": 2,
                    "numoutlets": 1,
                    "outlettype": [ "" ],
                    "patching_rect": [ 387.2340397834778, 87.234041929245, 29.5, 22.0 ],
                    "text": "on"
                }
            },
            {
                "box": {
                    "id": "obj-3",
                    "maxclass": "newobj",
                    "numinlets": 1,
                    "numoutlets": 1,
                    "outlettype": [ "" ],
                    "patching_rect": [ 387.2340397834778, 110.63829708099365, 168.0, 22.0 ]
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
                    "autosave": 1,
                    "bgmode": 0,
                    "border": 0,
                    "clickthrough": 0,
                    "id": "obj-4",
                    "maxclass": "newobj",
                    "numinlets": 2,
                    "numoutlets": 8,
                    "offset": [ 0.0, 0.0 ],
                    "outlettype": [ "signal", "signal", "", "list", "int", "", "", "" ],
                    "patching_rect": [ 78.72340369224548, 295.79830169677734, 120.0, 22.0 ],
                    "save": [ "#N", "vst~", "loaduniqueid", 0, "SWAM Cello 3", ";" ],
                    "saved_attribute_attributes": {
                        "valueof": {
                            "parameter_invisible": 1,
                            "parameter_longname": "vst~",
                            "parameter_modmode": 0,
                            "parameter_shortname": "vst~",
                            "parameter_type": 3
                        }
                    },
                    "saved_object_attributes": {
                        "parameter_enable": 1,
                        "parameter_mappable": 0
                    },
                    "snapshot": {
                        "filetype": "C74Snapshot",
                        "version": 2,
                        "minorversion": 0,
                        "name": "snapshotlist",
                        "origin": "vst~",
                        "type": "list",
                        "subtype": "Undefined",
                        "embed": 1,
                        "snapshot": {
                            "pluginname": "SWAM Cello 3.vst3info",
                            "plugindisplayname": "SWAM Cello 3",
                            "pluginsavedname": "",
                            "pluginsaveduniqueid": -298341311,
                            "version": 1,
                            "isbank": 0,
                            "isbase64": 1,
                            "blob": "22377.VMjLg.1U...O+fWarAhckI2bo8la8HRLt.iHfTlai8FYo41Y8HRUTYTK3HxO9.BOVMEUy.Ea0cVZtMEcgQWY9vSRC8Vav8lak4Fc9DiM1jyMtXUSGM1UA4hKtXlKt3hKP4hKt3hKtvjdXQ2bD4hKDQERFkjdP4VPt3hKHYGUoUULL4BS1IjKt3hKtPjKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKq4VUCkzTHQTPD4hK1k2Sy.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.Uc2YzTqMFagUWS5EFcQ0lX0cGaHYFVWgkbUcUV3fjPLQmKogTcyLzSPUjZTEDLDgzaQY0Sn4hLggWTWg0bMUjXxslQiIUQFM1a3XDUmkzUXMWRBgTLEYTXvTkUOgFUCwDctjFR0MyPOAUQpQUPvPDRuEkUOglKxDFdQcEVyUEagoGNw.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.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.SZHY2LR0DZtfFVzDzUXkWSW8DZtjFRlgjUZYGNFE1YIc0Sn4RZHU2LC8Tc5QkTDslZTsFLVgkcAckVzMlUQQWTsIFMzLzSMsFQQkTRUk0bEYjX1sFag0VUpEldIcEYlQEagcVRFE1ZQY0SnQTZHYlKWgEdEYUXqE0UYg2ZDkENHIDUu8VajQENrE1ZIIDRoclUXQGMVkkbvjFR2IVZHYldVkUdMcEVsUkQUQSPWkENHIESn4hTgkWRV8DZDkVSn4hPgkWRV8DZ5IESnMyPO0zZDEURIUUVyUjQhY2ZrEVaMQ0X3k0UYYlZrElcUczXkAiUZQGLogjcyHDSn4hTZQWPWMld3TUXmc1UOgFQowjLyHDSn4BdgASTxb0bqwVX3fjPLQmKogjY2X0X5gSUgc1YW8DZDkFSxLiPLglK3IlaEYjXqASZHY2LBwDZtfmXz.iUgsVTsIFMvjFR1MiTMglKngEMAcEV40zUOglKogjYHYkV1giQgcVRW8DZtjFR0MyPOUmdTIEQqoFUqAiUXYWPWoEciYUTzEUahQCMC8TSqQTTIkTUYMWQFIlcqwVXsUkZgoWRWQlYTwVXmkjQgsVTV8DZDkFRl4xUXgWQVE1ZQcUV3sFQYgCRBIVc2YEY1cVLgQ2ZGQ0YIcEVykjPHk1YVgEczXUVxASZHcmXogjY5YUV40zUX0VUFUEMAcUV3fjPLglKREVdIY0SnomTLglKBEVdIY0SnomTLg1LC8TSqQTTIkTUYMWQFIlcqwVXs0DUigWVWkkYpwVX1U0QiUFLVoEcvjFR1MiPLglKRoEcAc0X5gSUgc1YW8DZDkFSxLiPLglK3EFLQIyUysFaggCRBwDctjFRlciUioGNUE1Ymc0SnQTZLIyLBwDZtfmXtUjQhsFLogjcyHDSn4BdhQCLVE1ZQ0lXz.SZHY2LR0DZtfFVzDzUXkWSW8DZtjFRlgjUZYGNFE1YIc0Sn4RZHU2LC8Tc5QkTDslZTsFLVgkcAckVzMlUQQWTsIFMzLzSMsFQQkTRUk0bEYjX1sFag0VUpEldIcEYlQEagcVRFE1ZQY0SnQTZHYlKWgEdEYUXqE0UYg2ZDkENHIjVmkzUgUGMVoUZMcDUmkzUXMWRBgTZmYEVzQiUYIGLogzchkFRlomUYkWSWgUaUYTUzDzUYgCRRwDZtHUX4kjUOglXC4DZtHTX4kjUOgldRwDZyLzSMsFQQkTRUk0bEYjX1sFag0VSTMFdYcUVloFagYWUGMVYvXkVzASZHY2LBwDZtHkVzEzUioGNUE1Ymc0SnQTZLIyLBwDZtfWXvDkLWM2ZrEFNHIDSz4RZHY1MVMld3TUXmc1UOgFQowjLyHDSn4Bdh4VQFI1ZvjFR1MiPLglK3IFMvXUXqEUahQCLogjcyHUSn4BZXQSPWgUdMc0Sn4RZHYFRVokc3XTXmkzUOglKogTcyLzS0oGURQzZpQ0ZvXEV1EzUZQ2XVEEcQ0lXzPyPO0zZDEURIUUVyUjQhY2ZrEVaUoVX5kzUjYFUrE1YIYTXqEkUOgFQogjYtbEV3UjUgsVTWkEdqQTV3fjPigWUVEVc2ESXPUDahcFLrgjYLYjVmQCags1cV8DZDkFRlomUYkWSWgUaUYTUzDzUYgCRRwDZtHUX4kjUOglXS4DZtHTX4kjUOgldRwDZyLzSMsFQQkTRUk0bEYjX1sFag0VSTMFdYcUVloFagYWUGMVYvXkVzASZHY2LBwDZtHkVzEzUioGNUE1Ymc0SnQTZLIyLBwDZtfWXvDkLWM2ZrEFNHIDSz4RZHY1MVMld3TUXmc1UOgFQowjLyHDSn4Bdh4VQFI1ZvjFR1MiPLglK3IFMvXUXqEUahQCLogjcyHUSn4BZXQSPWgUdMc0Sn4RZHYFRVokc3XTXmkzUOglKogTcyLzS0oGURQzZpQ0ZvXEV1EzUZQ2XVEEcQ0lXzPyPO0zZDEURIUUVyUjQhY2ZrEVaUoVX5kzUjYFUrE1YIYTXqEkUOglKogjYtbEV3UjUgsVTWkEdqQTV3fDZis1cwDVZqYzXzjjPHk1YVgEczXUVxASZHcmXogjY5YUV40zUX0VUFUEMAcUV3fjPMglKREVdIY0SnomTLglKBEVdIY0SnomTLg1LC8TSqQTTIkTUYMWQFIlcqwVXs0DUigWVWkkYpwVX1U0QiUFLVoEcvjFR1MiPLglKRoEcAc0X5gSUgc1YW8DZDkFSxLiPLglK3EFLQIyUysFaggCRRwDctjFRlciUioGNUE1Ymc0SnQTZLIyLBwDZtfmXtUjQhsFLogjcyHDSn4BdhQCLVE1ZQ0lXz.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.CaXsVRW8DZDkFR4XWZgUWTWkkYpYTV3fjPLglK3IldEYzXvzzUOglKogjYXcEVxU0UYgCRRsDLtjFRlMSLgoWUrM0YvXUV3fDdPg1Mn8zMyDSX5UkQH8VTV8DZDkFRlwzQicVTWMVdvjFR1gjPHESQFEFLUY0SnomTMYGRBgDc3XzXqQCUXMWUV8DZLoGRncCZOcyLwDldUYDRuEkUOgFRogjYLczXmE0UikGLogjcHIDRwTjQgASUV8DZ5IUS1gjPHQGNFM1ZzPEVyUkUOgFTpgTcyLzSzgiQisVPRokZvjFR4gjPHkWTWgkdUIiX3fjPLglKnM1Y2Y0XqASZHMGUCwDZtfVX0E0UY4TQVE1ZvjFRD0DZHU2LC8Dc3XzXqEjTZoFLogjdHIDR4E0UXoWUxHFNHIDSn4BZic1cVM1ZvjFRyQ0PLglKnEVcQcUVNUjUgsFLogTQIg2R4XWZgUWTWkkYpYTV3fjTMglK3IldEYzXvzzUOglKogjYXcEVxU0UYgCRRsDLtjFRlMSLgoWUrM0YvXUV3fDZQg1Mn8zMyDSX5UkQH8VTV8DZXkFRlwzQicVTWMVdvjFR1gjPHESQFEFLUY0SnomTMYGRBgDc3XzXqQCUXMWUV8DZXoGRncCZOcyLwDldUYDRuEkUOglXogjYLczXmE0UikGLogjcHIDRwTjQgASUV8DZ5IUS1gjPHQGNFM1ZzPEVyUkUOglXpgTcyLzSzgiQisVPRokZvjFRyfjPHkWTWgkdUIiX3fjPLglKnM1Y2Y0XqASZHMGUCwDZtfVX0E0UY4TQVE1ZvjFRG0DZHU2LC8Dc3XzXqEjTZoFLogDMHIDR4E0UXoWUxHFNHIDSn4BZic1cVM1ZvjFRyQ0PLglKnEVcQcUVNUjUgsFLogTPIg2R4XWZgUWTWkkYpYTV3fjTLYGRBgTdQcEV5UkLhgCRBwDZtf1XmcmUisFLogzbTMDSn4BZgUWTWkkSEYUXqASZHETSngTcyLzSzgiQisVPRokZvjFR2QTZHYFSGM1YQc0X4ASZHYGRBgTLEYTXvTkUOgldR0jcHIDRzgiQisFMTg0bUY0SngjZHU2LC8TctzlXq0zUYoGMC8jcIcUV4UkQiYFSGEVcQ01Tv.CaXsVRW8DZHkFR4XWZgUWTWkkYpYTV3fjPLglK3IldEYzXvzzUOglKogjYXcEVxU0UYgCRRsDLtjFRlMSLgoWUrM0YvXUV3fDdPg1Mn8zMyDSX5UkQH8VTV8DZDkFRlwzQicVTWMVdvjFR1gjPHESQFEFLUY0SnomTMYGRBgDc3XzXqQCUXMWUV8DZLoGRncCZOcyLwDldUYDRuEkUOgFRogjYLczXmE0UikGLogjcHIDRwTjQgASUV8DZ5IUS1gjPHQGNFM1ZzPEVyUkUOgFTpgTcyLzSzgiQisVPRokZvjFR4gjPHkWTWgkdUIiX3fjPLglKnM1Y2Y0XqASZHMGUCwDZtfVX0E0UY4TQVE1ZvjFRD0DZHU2LC8Dc3XzXqEjTZoFLogjdHIDR4E0UXoWUxHFNHIDSn4BZic1cVM1ZvjFRyQ0PLglKnEVcQcUVNUjUgsFLogTQIg2R4XWZgUWTWkkYpYTV3fjTMglK3IldEYzXvzzUOglKogjYXcEVxU0UYgCRRsDLtjFRlMSLgoWUrM0YvXUV3fDZQg1Mn8zMyDSX5UkQH8VTV8DZXkFRlwzQicVTWMVdvjFR1gjPHESQFEFLUY0SnomTMYGRBgDc3XzXqQCUXMWUV8DZXoGRncCZOcyLwDldUYDRuEkUOglXogjYLczXmE0UikGLogjcHIDRwTjQgASUV8DZ5IUS1gjPHQGNFM1ZzPEVyUkUOglXpgTcyLzSzgiQisVPRokZvjFRyfjPHkWTWgkdUIiX3fjPLglKnM1Y2Y0XqASZHMGUCwDZtfVX0E0UY4TQVE1ZvjFRG0DZHU2LC8Dc3XzXqEjTZoFLogDMHIDR4E0UXoWUxHFNHIDSn4BZic1cVM1ZvjFRyQ0PLglKnEVcQcUVNUjUgsFLogTPIg2R4XWZgUWTWkkYpYTV3fjTLYGRBgTdQcEV5UkLhgCRBwDZtf1XmcmUisFLogzbTMDSn4BZgUWTWkkSEYUXqASZHETSngTcyLzSzgiQisVPRokZvjFR2QTZHYFSGM1YQc0X4ASZHYGRBgTLEYTXvTkUOgldR0jcHIDRzgiQisFMTg0bUY0SngjZHU2LC8TctzlXq0zUYoGMC8jcIcUV4UkQiYFSGEVcQ01Tv.CaXsVRW8DZLkFR4XWZgUWTWkkYpYTV3fjPLglK3IldEYzXvzzUOglKogjYXcEVxU0UYgCRRsDLtjFRlMSLgoWUrM0YvXUV3fDdPg1Mn8zMyDSX5UkQH8VTV8DZDkFRlwzQicVTWMVdvjFR1gjPHESQFEFLUY0SnomTMYGRBgDc3XzXqQCUXMWUV8DZLoGRncCZOcyLwDldUYDRuEkUOgFRogjYLczXmE0UikGLogjcHIDRwTjQgASUV8DZ5IUS1gjPHQGNFM1ZzPEVyUkUOgFTpgTcyLzSzgiQisVPRokZvjFR4gjPHkWTWgkdUIiX3fjPLglKnM1Y2Y0XqASZHMGUCwDZtfVX0E0UY4TQVE1ZvjFRD0DZHU2LC8Dc3XzXqEjTZoFLogjdHIDR4E0UXoWUxHFNHIDSn4BZic1cVM1ZvjFRyQ0PLglKnEVcQcUVNUjUgsFLogTQIg2R4XWZgUWTWkkYpYTV3fjTMglK3IldEYzXvzzUOglKogjYXcEVxU0UYgCRRsDLtjFRlMSLgoWUrM0YvXUV3fDZQg1Mn8zMyDSX5UkQH8VTV8DZXkFRlwzQicVTWMVdvjFR1gjPHESQFEFLUY0SnomTMYGRBgDc3XzXqQCUXMWUV8DZXoGRncCZOcyLwDldUYDRuEkUOglXogjYLczXmE0UikGLogjcHIDRwTjQgASUV8DZ5IUS1gjPHQGNFM1ZzPEVyUkUOglXpgTcyLzSzgiQisVPRokZvjFRyfjPHkWTWgkdUIiX3fjPLglKnM1Y2Y0XqASZHMGUCwDZtfVX0E0UY4TQVE1ZvjFRG0DZHU2LC8Dc3XzXqEjTZoFLogDMHIDR4E0UXoWUxHFNHIDSn4BZic1cVM1ZvjFRyQ0PLglKnEVcQcUVNUjUgsFLogTPIg2R4XWZgUWTWkkYpYTV3fjTLYGRBgTdQcEV5UkLhgCRBwDZtf1XmcmUisFLogzbTMDSn4BZgUWTWkkSEYUXqASZHETSngTcyLzSzgiQisVPRokZvjFR2QTZHYFSGM1YQc0X4ASZHYGRBgTLEYTXvTkUOgldR0jcHIDRzgiQisFMTg0bUY0SngjZHU2LC8TctzlXq0zUYoGMC8jcIcUV4UkQiYFSGEVcQ01Tv.CaXsVRW8DZPkFR4XWZgUWTWkkYpYTV3fjPLglK3IldEYzXvzzUOglKogjYXcEVxU0UYgCRRsDLtjFRlMSLgoWUrM0YvXUV3fDdPg1Mn8zMyDSX5UkQH8VTV8DZDkFRlwzQicVTWMVdvjFR1gjPHESQFEFLUY0SnomTMYGRBgDc3XzXqQCUXMWUV8DZLoGRncCZOcyLwDldUYDRuEkUOgFRogjYLczXmE0UikGLogjcHIDRwTjQgASUV8DZ5IUS1gjPHQGNFM1ZzPEVyUkUOgFTpgTcyLzSzgiQisVPRokZvjFR4gjPHkWTWgkdUIiX3fjPLglKnM1Y2Y0XqASZHMGUCwDZtfVX0E0UY4TQVE1ZvjFRD0DZHU2LC8Dc3XzXqEjTZoFLogjdHIDR4E0UXoWUxHFNHIDSn4BZic1cVM1ZvjFRyQ0PLglKnEVcQcUVNUjUgsFLogTQIg2R4XWZgUWTWkkYpYTV3fjTMglK3IldEYzXvzzUOglKogjYXcEVxU0UYgCRRsDLtjFRlMSLgoWUrM0YvXUV3fDZQg1Mn8zMyDSX5UkQH8VTV8DZXkFRlwzQicVTWMVdvjFR1gjPHESQFEFLUY0SnomTMYGRBgDc3XzXqQCUXMWUV8DZXoGRncCZOcyLwDldUYDRuEkUOglXogjYLczXmE0UikGLogjcHIDRwTjQgASUV8DZ5IUS1gjPHQGNFM1ZzPEVyUkUOglXpgTcyLzSzgiQisVPRokZvjFRyfjPHkWTWgkdUIiX3fjPLglKnM1Y2Y0XqASZHMGUCwDZtfVX0E0UY4TQVE1ZvjFRG0DZHU2LC8Dc3XzXqEjTZoFLogDMHIDR4E0UXoWUxHFNHIDSn4BZic1cVM1ZvjFRyQ0PLglKnEVcQcUVNUjUgsFLogTPIg2R4XWZgUWTWkkYpYTV3fjTLYGRBgTdQcEV5UkLhgCRBwDZtf1XmcmUisFLogzbTMDSn4BZgUWTWkkSEYUXqASZHETSngTcyLzSzgiQisVPRokZvjFR2QTZHYFSGM1YQc0X4ASZHYGRBgTLEYTXvTkUOgldR0jcHIDRzgiQisFMTg0bUY0SngjZHU2LC8TctzlXq0zUYoGMC8jcIcUV4UkQiYFSGEVcQ01Tv.CaXsVRW8DZTkFR4XWZgUWTWkkYpYTV3fjPLglK3IldEYzXvzzUOglKogjYXcEVxU0UYgCRRsDLtjFRlMSLgoWUrM0YvXUV3fDdPg1Mn8zMyDSX5UkQH8VTV8DZDkFRlwzQicVTWMVdvjFR1gjPHESQFEFLUY0SnomTMYGRBgDc3XzXqQCUXMWUV8DZLoGRncCZOcyLwDldUYDRuEkUOgFRogjYLczXmE0UikGLogjcHIDRwTjQgASUV8DZ5IUS1gjPHQGNFM1ZzPEVyUkUOgFTpgTcyLzSzgiQisVPRokZvjFR4gjPHkWTWgkdUIiX3fjPLglKnM1Y2Y0XqASZHMGUCwDZtfVX0E0UY4TQVE1ZvjFRD0DZHU2LC8Dc3XzXqEjTZoFLogjdHIDR4E0UXoWUxHFNHIDSn4BZic1cVM1ZvjFRyQ0PLglKnEVcQcUVNUjUgsFLogTQIg2R4XWZgUWTWkkYpYTV3fjTMglK3IldEYzXvzzUOglKogjYXcEVxU0UYgCRRsDLtjFRlMSLgoWUrM0YvXUV3fDZQg1Mn8zMyDSX5UkQH8VTV8DZXkFRlwzQicVTWMVdvjFR1gjPHESQFEFLUY0SnomTMYGRBgDc3XzXqQCUXMWUV8DZXoGRncCZOcyLwDldUYDRuEkUOglXogjYLczXmE0UikGLogjcHIDRwTjQgASUV8DZ5IUS1gjPHQGNFM1ZzPEVyUkUOglXpgTcyLzSzgiQisVPRokZvjFRyfjPHkWTWgkdUIiX3fjPLglKnM1Y2Y0XqASZHMGUCwDZtfVX0E0UY4TQVE1ZvjFRG0DZHU2LC8Dc3XzXqEjTZoFLogDMHIDR4E0UXoWUxHFNHIDSn4BZic1cVM1ZvjFRyQ0PLglKnEVcQcUVNUjUgsFLogTPIg2R4XWZgUWTWkkYpYTV3fjTLYGRBgTdQcEV5UkLhgCRBwDZtf1XmcmUisFLogzbTMDSn4BZgUWTWkkSEYUXqASZHETSngTcyLzSzgiQisVPRokZvjFR2QTZHYFSGM1YQc0X4ASZHYGRBgTLEYTXvTkUOgldR0jcHIDRzgiQisFMTg0bUY0SngjZHU2LC8TctzlXq0zUYoGMC8jcIcUV4UkQiYFSGEVcQ01Tv.CaXsVRW8DZXkFR4XWZgUWTWkkYpYTV3fjPLglK3IldEYzXvzzUOglKogjYXcEVxU0UYgCRRsDLtjFRlMSLgoWUrM0YvXUV3fDdPg1Mn8zMyDSX5UkQH8VTV8DZDkFRlwzQicVTWMVdvjFR1gjPHESQFEFLUY0SnomTMYGRBgDc3XzXqQCUXMWUV8DZLoGRncCZOcyLwDldUYDRuEkUOgFRogjYLczXmE0UikGLogjcHIDRwTjQgASUV8DZ5IUS1gjPHQGNFM1ZzPEVyUkUOgFTpgTcyLzSzgiQisVPRokZvjFR4gjPHkWTWgkdUIiX3fjPLglKnM1Y2Y0XqASZHMGUCwDZtfVX0E0UY4TQVE1ZvjFRD0DZHU2LC8Dc3XzXqEjTZoFLogjdHIDR4E0UXoWUxHFNHIDSn4BZic1cVM1ZvjFRyQ0PLglKnEVcQcUVNUjUgsFLogTQIg2R4XWZgUWTWkkYpYTV3fjTMglK3IldEYzXvzzUOglKogjYXcEVxU0UYgCRRsDLtjFRlMSLgoWUrM0YvXUV3fDZQg1Mn8zMyDSX5UkQH8VTV8DZXkFRlwzQicVTWMVdvjFR1gjPHESQFEFLUY0SnomTMYGRBgDc3XzXqQCUXMWUV8DZXoGRncCZOcyLwDldUYDRuEkUOglXogjYLczXmE0UikGLogjcHIDRwTjQgASUV8DZ5IUS1gjPHQGNFM1ZzPEVyUkUOglXpgTcyLzSzgiQisVPRokZvjFRyfjPHkWTWgkdUIiX3fjPLglKnM1Y2Y0XqASZHMGUCwDZtfVX0E0UY4TQVE1ZvjFRG0DZHU2LC8Dc3XzXqEjTZoFLogDMHIDR4E0UXoWUxHFNHIDSn4BZic1cVM1ZvjFRyQ0PLglKnEVcQcUVNUjUgsFLogTPIg2R4XWZgUWTWkkYpYTV3fjTLYGRBgTdQcEV5UkLhgCRBwDZtf1XmcmUisFLogzbTMDSn4BZgUWTWkkSEYUXqASZHETSngTcyLzSzgiQisVPRokZvjFR2QTZHYFSGM1YQc0X4ASZHYGRBgTLEYTXvTkUOgldR0jcHIDRzgiQisFMTg0bUY0SngjZHU2LC8TctzlXq0zUYoGMC8jcIcUV4UkQiYFSGEVcQ01Tv.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.EZtH0X4UEahgCRBwDZtHUVpslQicVRFE1ZvjFR2gjPHcVSFM1aYcUV3fjPLg1LC8DTEwlXmAiUYoWUrIVdzLzSPUDahcFLVkkdUwlXl4xUXgWQVE1ZQcUV3sFQYgCRnIVc3XUXSsFajsVSsgjYXcEVxU0UYgCRB0DctjFR0MyPOAUQrI1YvXUV5UEahYlKWgEdEYUXqE0UYg2ZDkENHglX0giUgETRwHVcIcjX5sVLgQGLTgkdUwlXuUjQgkWRBgTLEYTXvTkUOgFRosjcHg2R4X2PTcVRWg0bUYzXqkzQHYWQrI1YvXUV5UEahkTTV8DZHISX0AiQS8VSGM1ZzXUV3EDLgk2ZFM1a3vVXn4BZic1cVM1ZvjFRxLiPLg1Mn8zMtTEV3UjUgsVTWkEdAIjXmkzUXMWUFM1ZIckTpASZHgGNwD1bMASXvjjLXsVTTkkbEYEYMgiQYsVRBgTLEYTXvTkUOglKosjcHg2R4X2PTcVRWg0bUYzXqkzQHYWQrI1YvXUV5UEahkTTV8DZHISX0AiUSUWTVMlbEYzXugCag8DMwLEaYwFRlg0UXIWUWkENHIESz4RZHU2LC8DTEwlXmAiUYoWUrIlYtbEV3UjUgsVTWkEdqQTV3fDZhUGNVEFQqEiX5UDagkVUrA0ZQIyXqUEag0zZwfUdIIDRwTjQgASUV8DZDkWSz4RZHU2LC8TctTEV3UjUgsVTWkEdM01S2bCZTUGNVEVN1kFU0giUgYlZFkENHgGVxgSLhsFLToUZ3rlX0giUgglKnE1YvXUV3fDdPIGNwH1Z3T0Tu0TLWIENwD1bIIDRvzzUYgGLogjcHIDRqEkUZoWQrgkbUY0Sn4RZHYFQwfkdqw1XqASZHYGRn8zMtTEV3UjUgsVTWkEdM01S23RUXgWQVE1ZQcUV3EjPhcVRWg0bUYzXqkzURoFLogDd3DSXy0TUZUSUwHFZtf1XmcmUisFLogjcyHDSncCZOciKUgEdEYUXqE0UYgWPBI1YIcEVyUkQisVRWIkZvjFR3gSLgMWQpgUd3vlX1E0UZUGMVM0YQcUV3slUXIWSsgjYXcEVxU0UYgCRBwDctjFR0MyPOAUQrI1YvXUV5UEahYlKWgEdEYUXqE0UYg2ZDkENHglX0giUgwzZwHldUwVXqkzQTUWSWokdqESXzkjPHESQFEFLUY0SnwTZKYGR3sTN1MDUmkzUXMWUFM1ZIcDR1UDahcFLVkkdUwlXIEkUOgFRxDVcvDCU0UUahkVUFE0Z2YEVz.idgoVUrgjYXcEVxU0UYgCRBwDctjFR0MyPOAUQrI1YvXUV5UEahYlKWgEdEYUXqE0UYg2ZDkENHglX0giUg0DNFkEL2YEV5sVLgQGNpE1SYwVVn4BZic1cVM1ZvjFR1MiPLg1Mn8zMtTEV3UjUgsVTWkEdAIjXmkzUXMWUFM1ZIckTpASZHgGNwD1bQQkV4E0UXQWSVkkPUYzXxTkUYQGLToUZM0FRlg0UXIWUWkENHIESxLiPLg1Mn8zM2HDUmkzUXMWUFM1ZIIiX4XWdKIENwD1bzLzS0gDLgUGLwHVN1k2RRgSLgMWSWM0YzXEVsUEahkic4sDd3DSXy0zUZMWUGE1YQISX3QyPOYGNwH1aQckV0QiUZQ2Xr8zMtbEV3UjUgkGMC8DTEoFUAACQH8VTV8DZHISX0ASLTUWUsIVZUYETzMlQgsVRBgTLEYTXvTkUOglZCwDctjFR0MyPOAUQpQUPvPDRuEkUOgFRxDVcvDCU0UUahkVUFE0aMczXmQSLXsVRBgTLEYTXvTkUOgFSosjcHg2R4XWdKYWQrI1YvDiX4XWdKYGNwH1aQckV0QiUZQ2Xr8zM2HjX3gSLYgWQVEVN1kmX0UUahkVUVoEcYESXlomUXQWUsk0YMYzXvjzUYgGLogTPUcTVugSLW0DNFk0Z2YkVzMFaHYldVg0azXTUqc1QigCR3A0Z2YTX0kjPHoGNFIFUUYDY5ASZHMSQogjYHESX5EkLgMWTUk0LQc0SnolZSMUTqQEclkFRlwTLgIGNVMFdvjFRrkkUYkVQFkEdHwFRlwTLgMWPxDFcUwVX50TUZUSUV8DZtjFRlwzUYkVTWoUczX0T0EkUYgCRBwDZ2f1S2bCdhISQVEVNt3hKt3hKt3hKt3hKtQUUCUEQTg2ZrM1YQcUVDUjQicVPP4RPHQEY1UTLhkWPP4RPL4hKi4hKt3hKt3hKtXlTU0DUQAURWoULEYzXqEEUXoWQFwyKIMzasA2atUlaz4COuX0TTMCTrU2Yo41TzEFck4C."
                        },
                        "snapshotlist": {
                            "current_snapshot": 0,
                            "entries": [
                                {
                                    "filetype": "C74Snapshot",
                                    "version": 2,
                                    "minorversion": 0,
                                    "name": "SWAM Cello 3",
                                    "origin": "SWAM Cello 3.vst3info",
                                    "type": "VST3",
                                    "subtype": "Instrument",
                                    "embed": 0,
                                    "snapshot": {
                                        "pluginname": "SWAM Cello 3.vst3info",
                                        "plugindisplayname": "SWAM Cello 3",
                                        "pluginsavedname": "",
                                        "pluginsaveduniqueid": -298341311,
                                        "version": 1,
                                        "isbank": 0,
                                        "isbase64": 1,
                                        "blob": "22377.VMjLg.1U...O+fWarAhckI2bo8la8HRLt.iHfTlai8FYo41Y8HRUTYTK3HxO9.BOVMEUy.Ea0cVZtMEcgQWY9vSRC8Vav8lak4Fc9DiM1jyMtXUSGM1UA4hKtXlKt3hKP4hKt3hKtvjdXQ2bD4hKDQERFkjdP4VPt3hKHYGUoUULL4BS1IjKt3hKtPjKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKq4VUCkzTHQTPD4hK1k2Sy.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.Uc2YzTqMFagUWS5EFcQ0lX0cGaHYFVWgkbUcUV3fjPLQmKogTcyLzSPUjZTEDLDgzaQY0Sn4hLggWTWg0bMUjXxslQiIUQFM1a3XDUmkzUXMWRBgTLEYTXvTkUOgFUCwDctjFR0MyPOAUQpQUPvPDRuEkUOglKxDFdQcEVyUEagoGNw.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.SZHcGR40DctjFRlciUioGNUE1azX0Sn4RZKYGRBgTcUczXkAiUXMCLogzcHkWSz4RZHYFSGo0YAcUV3fjPLQmKogjYLcEYyAiUYoWRWQFNHIDSzQUZHYFRVQlcEEiX4ASZHYGRBgDZqYjX0cmUXgGLogjcHg2R4XWdK0zZDEURIUUVyUjQhY2ZrEVaUoVX5kzUjkicSMURQQkTRUkUgcVPGI1azDSVEQiQig2ZGgzZzXEVncmUYoFLogzcHIDR1UDahcFLVkkdUwlXIEkUOgFRwDlLAASX4slQi8FNrEFTEwlXmACaHYFSFo0YzvVXqcmUOgFQ40DZtHUXq0jLhc1XVkEUqcjXqASZHcGRBgzbM0FV3fjTLECRBgjbM0FV3fjTKcGRn8zM5QkTDslZTsFLVgkcAckVzMVLPASRsM1ZAIkVzEzUioGNUE1azX0Sn4RZKYGRBgzazXjXvDkLWMWQFQFNHIES3IVZKYGRBgTcUczXkAiUZQGLogjcyHDSn4BdgASTxb0bEYDY3fjTLgmXosjcHIDR4clUXYWUV8DZtj1R1gjPHk2ZWE1bUYzX3s1UOglKosDLHIDRns1QhcVSxHFNHIDSn4BZX8VPxDlbEwlX3fjPLg1Mn8zM2H0TIEEURIUUVE1YAcjXuQSLYUDMFMFdq01S2nGURQzZpQ0ZvXEV1EzUZQ2XVEEcQ0lXzDjTYQWQrgkbUYTV3fjTLglKBI1YIcEVyUkQisVRWIkZvjFR5kzUYMGNFEVcMUjXqUkQYglK3gkaEwVXzUkQggCRRwDZtHUXq0jLhc1XVkEUqcjXqASZHcGRBgzbM0FV3fjPNYGRBgjbM0FV3fjTKcGRn8zM5QkTDslZTsFLVgkcAckVzMVLPASRsM1ZAIkVzEzUioGNUE1azX0Sn4RZKYGRBgzazXjXvDkLWMWQFQFNHIES3IVZKYGRBgTcUczXkAiUZQGLogjcyHDSn4BdgASTxb0bEYDY3fjTLgmXosjcHIDR4clUXYWUV8DZtj1R1gjPHk2ZWE1bUYzX3s1UOglKosDLHIDRns1QhcVSxHFNHIDSn4BZX8VPxDlbEwlX3fjPLg1Mn8zM2H0TIEEURIUUVE1YAcjXuQSLYUDMFMFdq01S2nGURQzZpQ0ZvXEV1EzUZQ2XVEEcQ0lXzDjTYQWQrgkbUYTV3fjTLglKBI1YIcEVyUkQisVRWIkZvjFRyUjUZQWVvDlbUcUXqkjPHk1YVgEczXUVxASZHcmXogjY5YUV40zUX0VUFUEMAcUV3fjTLglKREVdIY0SnIVZHYlcwHFZvjFRyQTZHkicSMURQQkTRUkUgcVPGI1azDSVCUUahESUFgzazXjXvDkLWM2ZrEFNHIDSz4RZHYlZrElcUczXkAiUXMCLogzcHkWSz4RZHY1MVMld3TUXuQiUOglKosjcHIDR0U0QiUFLVg0LvjFR2gTdMQmKogjYLcjVmEzUYgCRBwDctjFRlwzUjMGLVkkdIcEY3fjPLQGUogjYHYEY1UTLhkGLogjcHIDRnslQhU2cVgEdvjFR1gDdKkic4sTSqQTTIkTUYMWQFIlcqwVXsUkZgoWRWQVN1M0TIEEURIUUVE1YAcjXuQSLYUDMFMFdqcDRqQiUXg1cVkkZvjFR2gjPHYWQrI1YvXUV5UEahkTTV8DZtbEVzEDLgoWRBgTZmYEVzQiUYIGLogzchkFRlomUYkWSWgUaUYTUzDzUYgCRRwDZtHUX4kjUOgFQCwDZtHTX4kjUOgldRwDZyLzSMsFQQkTRUk0bEYjX1sFag0VSTMFdYcUVloFagYWUGMVYvXkVzASZHY2LBwDZtHkVzEzUioGNUE1Ymc0SnQTZLIyLBwDZtfWXvDkLWM2ZrEFNHIDSz4RZHY1MVMld3TUXmc1UOgFQowjLyHDSn4Bdh4VQFI1ZvjFR1MiPLglK3IFMvXUXqEUahQCLogjcyHUSn4BZXQSPWgUdMc0Sn4RZHYFRVokc3XTXmkzUOglKogTcyLzS0oGURQzZpQ0ZvXEV1EzUZQ2XVEEcQ0lXzPyPO0zZDEURIUUVyUjQhY2ZrEVaUoVX5kzUjYFUrE1YIYTXqEkUOgFQogjYtbEV3UjUgsVTWkEdqQTV3fDZhsVVWkEdIY0TucVaHYFSFo0YzvVXqcmUOgFQ40DZtHUXq0jLhc1XVkEUqcjXqASZHcGRBgzbM0FV3fjTNYGRBgjbM0FV3fjTKcGRn8zM5QkTDslZTsFLVgkcAckVzMVLPASRsM1ZAIkVzEzUioGNUE1azX0Sn4RZKYGRBgzazXjXvDkLWMWQFQFNHIES3IVZKYGRBgTcUczXkAiUZQGLogjcyHDSn4BdgASTxb0bEYDY3fjTLgmXosjcHIDR4clUXYWUV8DZtj1R1gjPHk2ZWE1bUYzX3s1UOglKosDLHIDRns1QhcVSxHFNHIDSn4BZX8VPxDlbEwlX3fjPLg1Mn8zM2H0TIEEURIUUVE1YAcjXuQSLYUDMFMFdq01S2nGURQzZpQ0ZvXEV1EzUZQ2XVEEcQ0lXzDjTYQWQrgkbUYTV3fjTLglKBI1YIcEVyUkQisVRWIkZvjFRm0TLXMUTWQlbUwFRlwjQZcFMrE1Z2Y0SnQTdMglKRE1ZMIiXmMlUYQ0ZGI1ZvjFR2gjPHMWSsgENHIESyfjPHIWSsgENHI0R2gDZOcidTIEQqoFUqAiUXYWPWoEciECTvjTaisVPRoEcAc0X5gSUg8FMV8DZtj1R1gjPH8FMFIFLQIyUyUjQjgCRRwDdhk1R1gjPHUWUGMVYvXkVzASZHY2LBwDZtfWXvDkLWMWQFQFNHIES3IVZKYGRBgTdmYEV1UkUOglKosjcHIDR4s1UgMWUFMFdqc0Sn4RZKACRBgDZqcjXm0jLhgCRBwDZtfFVuEjLgIWQrIFNHIDSncCZOcyMRMURQQkTRUkUgcVPGI1azDSVEQiQig2Zs8zM5QkTDslZTsFLVgkcAckVzMlUQQWTsIFMAIUVzUDaXIWUFkENHIESn4hPhcVRWg0bUYzXqkzURoFLogTdUIiX5UjUZQWRBgTZmYEVzQiUYIGLogzchkFRlomUYkWSWgUaUYTUzDzUYgCRRwDZtHUX4kjUOgFVC0DZtHTX4kjUOgldRwDZyLzSMsFQQkTRUk0bEYjX1sFag0VSTMFdYcUVloFagYWUGMVYvXkVzASZHY2LBwDZtHkVzEzUioGNUE1Ymc0SnQTZLIyLBwDZtfWXvDkLWM2ZrEFNHIESz4RZHY1MVMld3TUXmc1UOgFQowjLyHDSn4Bdh4VQFI1ZvjFR1MiTNQiKCwjctLDS1o1TMkGV40jdLkFSn4BdhQCLVE1ZQ0lXz.SZHY2LR0DZtfFVzDzUXkWSW8DZtjFRlgjUZYGNFE1YIc0Sn4RZHU2LC8Tc5QkTDslZTsFLVgkcAckVzMlUQQWTsIFMzLzSMsFQQkTRUk0bEYjX1sFag0VUpEldIcEYlQEagcVRFE1ZQY0SnQTZHYlKWgEdEYUXqE0UYg2ZDkENHIDUu8VajQENrE1ZIIDRoclUXQGMVkkbvjFR2IVZHYldVkUdMcEVsUkQUQSPWkENHIESn4hTgkWRV8DZDkVSn4hPgkWRV8DZ5IESnMyPO0zZDEURIUUVyUjQhY2ZrEVaMQ0X3k0UYYlZrElcUczXkAiUZQGLogjcyHDSn4hTZQWPWMld3TUXmc1UOgFQowjLyHDSn4BdgASTxb0bqwVX3fjPLQmKogjY2X0X5gSUgc1YW8DZDkFSxLiPLglK3IlaEYjXqASZHY2LBwDZtfmXz.iUgsVTsIFMvjFR1MiTMglKngEMAcEV40zUOglKogjYHYkV1giQgcVRW8DZtjFR0MyPOUmdTIEQqoFUqAiUXYWPWoEciYUTzEUahQCMC8TSqQTTIkTUYMWQFIlcqwVXsUkZgoWRWQlYTwVXmkjQgsVTV8DZDkFRl4xUXgWQVE1ZQcUV3sFQYgCRBIVc2YEY1cVLgQ2ZGQ0YIcEVykjPHk1YVgEczXUVxASZHcmXogjY5YUV40zUX0VUFUEMAcUV3fjPLglKREVdIY0SnomTLglKBEVdIY0SnomTLg1LC8TSqQTTIkTUYMWQFIlcqwVXs0DUigWVWkkYpwVX1U0QiUFLVoEcvjFR1MiPLglKRoEcAc0X5gSUgc1YW8DZDkFSxLiPLglK3EFLQIyUysFaggCRBwDctjFRlciUioGNUE1Ymc0SnQTZLIyLBwDZtfmXtUjQhsFLogjcyHDSn4BdhQCLVE1ZQ0lXz.SZHY2LR0DZtfFVzDzUXkWSW8DZtjFRlgjUZYGNFE1YIc0Sn4RZHU2LC8Tc5QkTDslZTsFLVgkcAckVzMlUQQWTsIFMzLzSMsFQQkTRUk0bEYjX1sFag0VUpEldIcEYlQEagcVRFE1ZQY0SnQTZHYlKWgEdEYUXqE0UYg2ZDkENHIjVmkzUgUGMVoUZMcDUmkzUXMWRBgTZmYEVzQiUYIGLogzchkFRlomUYkWSWgUaUYTUzDzUYgCRRwDZtHUX4kjUOglXC4DZtHTX4kjUOgldRwDZyLzSMsFQQkTRUk0bEYjX1sFag0VSTMFdYcUVloFagYWUGMVYvXkVzASZHY2LBwDZtHkVzEzUioGNUE1Ymc0SnQTZLIyLBwDZtfWXvDkLWM2ZrEFNHIDSz4RZHY1MVMld3TUXmc1UOgFQowjLyHDSn4Bdh4VQFI1ZvjFR1MiPLglK3IFMvXUXqEUahQCLogjcyHUSn4BZXQSPWgUdMc0Sn4RZHYFRVokc3XTXmkzUOglKogTcyLzS0oGURQzZpQ0ZvXEV1EzUZQ2XVEEcQ0lXzPyPO0zZDEURIUUVyUjQhY2ZrEVaUoVX5kzUjYFUrE1YIYTXqEkUOgFQogjYtbEV3UjUgsVTWkEdqQTV3fjPigWUVEVc2ESXPUDahcFLrgjYLYjVmQCags1cV8DZDkFRlomUYkWSWgUaUYTUzDzUYgCRRwDZtHUX4kjUOglXS4DZtHTX4kjUOgldRwDZyLzSMsFQQkTRUk0bEYjX1sFag0VSTMFdYcUVloFagYWUGMVYvXkVzASZHY2LBwDZtHkVzEzUioGNUE1Ymc0SnQTZLIyLBwDZtfWXvDkLWM2ZrEFNHIDSz4RZHY1MVMld3TUXmc1UOgFQowjLyHDSn4Bdh4VQFI1ZvjFR1MiPLglK3IFMvXUXqEUahQCLogjcyHUSn4BZXQSPWgUdMc0Sn4RZHYFRVokc3XTXmkzUOglKogTcyLzS0oGURQzZpQ0ZvXEV1EzUZQ2XVEEcQ0lXzPyPO0zZDEURIUUVyUjQhY2ZrEVaUoVX5kzUjYFUrE1YIYTXqEkUOglKogjYtbEV3UjUgsVTWkEdqQTV3fDZis1cwDVZqYzXzjjPHk1YVgEczXUVxASZHcmXogjY5YUV40zUX0VUFUEMAcUV3fjPMglKREVdIY0SnomTLglKBEVdIY0SnomTLg1LC8TSqQTTIkTUYMWQFIlcqwVXs0DUigWVWkkYpwVX1U0QiUFLVoEcvjFR1MiPLglKRoEcAc0X5gSUgc1YW8DZDkFSxLiPLglK3EFLQIyUysFaggCRRwDctjFRlciUioGNUE1Ymc0SnQTZLIyLBwDZtfmXtUjQhsFLogjcyHDSn4BdhQCLVE1ZQ0lXz.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.CaXsVRW8DZDkFR4XWZgUWTWkkYpYTV3fjPLglK3IldEYzXvzzUOglKogjYXcEVxU0UYgCRRsDLtjFRlMSLgoWUrM0YvXUV3fDdPg1Mn8zMyDSX5UkQH8VTV8DZDkFRlwzQicVTWMVdvjFR1gjPHESQFEFLUY0SnomTMYGRBgDc3XzXqQCUXMWUV8DZLoGRncCZOcyLwDldUYDRuEkUOgFRogjYLczXmE0UikGLogjcHIDRwTjQgASUV8DZ5IUS1gjPHQGNFM1ZzPEVyUkUOgFTpgTcyLzSzgiQisVPRokZvjFR4gjPHkWTWgkdUIiX3fjPLglKnM1Y2Y0XqASZHMGUCwDZtfVX0E0UY4TQVE1ZvjFRD0DZHU2LC8Dc3XzXqEjTZoFLogjdHIDR4E0UXoWUxHFNHIDSn4BZic1cVM1ZvjFRyQ0PLglKnEVcQcUVNUjUgsFLogTQIg2R4XWZgUWTWkkYpYTV3fjTMglK3IldEYzXvzzUOglKogjYXcEVxU0UYgCRRsDLtjFRlMSLgoWUrM0YvXUV3fDZQg1Mn8zMyDSX5UkQH8VTV8DZXkFRlwzQicVTWMVdvjFR1gjPHESQFEFLUY0SnomTMYGRBgDc3XzXqQCUXMWUV8DZXoGRncCZOcyLwDldUYDRuEkUOglXogjYLczXmE0UikGLogjcHIDRwTjQgASUV8DZ5IUS1gjPHQGNFM1ZzPEVyUkUOglXpgTcyLzSzgiQisVPRokZvjFRyfjPHkWTWgkdUIiX3fjPLglKnM1Y2Y0XqASZHMGUCwDZtfVX0E0UY4TQVE1ZvjFRG0DZHU2LC8Dc3XzXqEjTZoFLogDMHIDR4E0UXoWUxHFNHIDSn4BZic1cVM1ZvjFRyQ0PLglKnEVcQcUVNUjUgsFLogTPIg2R4XWZgUWTWkkYpYTV3fjTLYGRBgTdQcEV5UkLhgCRBwDZtf1XmcmUisFLogzbTMDSn4BZgUWTWkkSEYUXqASZHETSngTcyLzSzgiQisVPRokZvjFR2QTZHYFSGM1YQc0X4ASZHYGRBgTLEYTXvTkUOgldR0jcHIDRzgiQisFMTg0bUY0SngjZHU2LC8TctzlXq0zUYoGMC8jcIcUV4UkQiYFSGEVcQ01Tv.CaXsVRW8DZHkFR4XWZgUWTWkkYpYTV3fjPLglK3IldEYzXvzzUOglKogjYXcEVxU0UYgCRRsDLtjFRlMSLgoWUrM0YvXUV3fDdPg1Mn8zMyDSX5UkQH8VTV8DZDkFRlwzQicVTWMVdvjFR1gjPHESQFEFLUY0SnomTMYGRBgDc3XzXqQCUXMWUV8DZLoGRncCZOcyLwDldUYDRuEkUOgFRogjYLczXmE0UikGLogjcHIDRwTjQgASUV8DZ5IUS1gjPHQGNFM1ZzPEVyUkUOgFTpgTcyLzSzgiQisVPRokZvjFR4gjPHkWTWgkdUIiX3fjPLglKnM1Y2Y0XqASZHMGUCwDZtfVX0E0UY4TQVE1ZvjFRD0DZHU2LC8Dc3XzXqEjTZoFLogjdHIDR4E0UXoWUxHFNHIDSn4BZic1cVM1ZvjFRyQ0PLglKnEVcQcUVNUjUgsFLogTQIg2R4XWZgUWTWkkYpYTV3fjTMglK3IldEYzXvzzUOglKogjYXcEVxU0UYgCRRsDLtjFRlMSLgoWUrM0YvXUV3fDZQg1Mn8zMyDSX5UkQH8VTV8DZXkFRlwzQicVTWMVdvjFR1gjPHESQFEFLUY0SnomTMYGRBgDc3XzXqQCUXMWUV8DZXoGRncCZOcyLwDldUYDRuEkUOglXogjYLczXmE0UikGLogjcHIDRwTjQgASUV8DZ5IUS1gjPHQGNFM1ZzPEVyUkUOglXpgTcyLzSzgiQisVPRokZvjFRyfjPHkWTWgkdUIiX3fjPLglKnM1Y2Y0XqASZHMGUCwDZtfVX0E0UY4TQVE1ZvjFRG0DZHU2LC8Dc3XzXqEjTZoFLogDMHIDR4E0UXoWUxHFNHIDSn4BZic1cVM1ZvjFRyQ0PLglKnEVcQcUVNUjUgsFLogTPIg2R4XWZgUWTWkkYpYTV3fjTLYGRBgTdQcEV5UkLhgCRBwDZtf1XmcmUisFLogzbTMDSn4BZgUWTWkkSEYUXqASZHETSngTcyLzSzgiQisVPRokZvjFR2QTZHYFSGM1YQc0X4ASZHYGRBgTLEYTXvTkUOgldR0jcHIDRzgiQisFMTg0bUY0SngjZHU2LC8TctzlXq0zUYoGMC8jcIcUV4UkQiYFSGEVcQ01Tv.CaXsVRW8DZLkFR4XWZgUWTWkkYpYTV3fjPLglK3IldEYzXvzzUOglKogjYXcEVxU0UYgCRRsDLtjFRlMSLgoWUrM0YvXUV3fDdPg1Mn8zMyDSX5UkQH8VTV8DZDkFRlwzQicVTWMVdvjFR1gjPHESQFEFLUY0SnomTMYGRBgDc3XzXqQCUXMWUV8DZLoGRncCZOcyLwDldUYDRuEkUOgFRogjYLczXmE0UikGLogjcHIDRwTjQgASUV8DZ5IUS1gjPHQGNFM1ZzPEVyUkUOgFTpgTcyLzSzgiQisVPRokZvjFR4gjPHkWTWgkdUIiX3fjPLglKnM1Y2Y0XqASZHMGUCwDZtfVX0E0UY4TQVE1ZvjFRD0DZHU2LC8Dc3XzXqEjTZoFLogjdHIDR4E0UXoWUxHFNHIDSn4BZic1cVM1ZvjFRyQ0PLglKnEVcQcUVNUjUgsFLogTQIg2R4XWZgUWTWkkYpYTV3fjTMglK3IldEYzXvzzUOglKogjYXcEVxU0UYgCRRsDLtjFRlMSLgoWUrM0YvXUV3fDZQg1Mn8zMyDSX5UkQH8VTV8DZXkFRlwzQicVTWMVdvjFR1gjPHESQFEFLUY0SnomTMYGRBgDc3XzXqQCUXMWUV8DZXoGRncCZOcyLwDldUYDRuEkUOglXogjYLczXmE0UikGLogjcHIDRwTjQgASUV8DZ5IUS1gjPHQGNFM1ZzPEVyUkUOglXpgTcyLzSzgiQisVPRokZvjFRyfjPHkWTWgkdUIiX3fjPLglKnM1Y2Y0XqASZHMGUCwDZtfVX0E0UY4TQVE1ZvjFRG0DZHU2LC8Dc3XzXqEjTZoFLogDMHIDR4E0UXoWUxHFNHIDSn4BZic1cVM1ZvjFRyQ0PLglKnEVcQcUVNUjUgsFLogTPIg2R4XWZgUWTWkkYpYTV3fjTLYGRBgTdQcEV5UkLhgCRBwDZtf1XmcmUisFLogzbTMDSn4BZgUWTWkkSEYUXqASZHETSngTcyLzSzgiQisVPRokZvjFR2QTZHYFSGM1YQc0X4ASZHYGRBgTLEYTXvTkUOgldR0jcHIDRzgiQisFMTg0bUY0SngjZHU2LC8TctzlXq0zUYoGMC8jcIcUV4UkQiYFSGEVcQ01Tv.CaXsVRW8DZPkFR4XWZgUWTWkkYpYTV3fjPLglK3IldEYzXvzzUOglKogjYXcEVxU0UYgCRRsDLtjFRlMSLgoWUrM0YvXUV3fDdPg1Mn8zMyDSX5UkQH8VTV8DZDkFRlwzQicVTWMVdvjFR1gjPHESQFEFLUY0SnomTMYGRBgDc3XzXqQCUXMWUV8DZLoGRncCZOcyLwDldUYDRuEkUOgFRogjYLczXmE0UikGLogjcHIDRwTjQgASUV8DZ5IUS1gjPHQGNFM1ZzPEVyUkUOgFTpgTcyLzSzgiQisVPRokZvjFR4gjPHkWTWgkdUIiX3fjPLglKnM1Y2Y0XqASZHMGUCwDZtfVX0E0UY4TQVE1ZvjFRD0DZHU2LC8Dc3XzXqEjTZoFLogjdHIDR4E0UXoWUxHFNHIDSn4BZic1cVM1ZvjFRyQ0PLglKnEVcQcUVNUjUgsFLogTQIg2R4XWZgUWTWkkYpYTV3fjTMglK3IldEYzXvzzUOglKogjYXcEVxU0UYgCRRsDLtjFRlMSLgoWUrM0YvXUV3fDZQg1Mn8zMyDSX5UkQH8VTV8DZXkFRlwzQicVTWMVdvjFR1gjPHESQFEFLUY0SnomTMYGRBgDc3XzXqQCUXMWUV8DZXoGRncCZOcyLwDldUYDRuEkUOglXogjYLczXmE0UikGLogjcHIDRwTjQgASUV8DZ5IUS1gjPHQGNFM1ZzPEVyUkUOglXpgTcyLzSzgiQisVPRokZvjFRyfjPHkWTWgkdUIiX3fjPLglKnM1Y2Y0XqASZHMGUCwDZtfVX0E0UY4TQVE1ZvjFRG0DZHU2LC8Dc3XzXqEjTZoFLogDMHIDR4E0UXoWUxHFNHIDSn4BZic1cVM1ZvjFRyQ0PLglKnEVcQcUVNUjUgsFLogTPIg2R4XWZgUWTWkkYpYTV3fjTLYGRBgTdQcEV5UkLhgCRBwDZtf1XmcmUisFLogzbTMDSn4BZgUWTWkkSEYUXqASZHETSngTcyLzSzgiQisVPRokZvjFR2QTZHYFSGM1YQc0X4ASZHYGRBgTLEYTXvTkUOgldR0jcHIDRzgiQisFMTg0bUY0SngjZHU2LC8TctzlXq0zUYoGMC8jcIcUV4UkQiYFSGEVcQ01Tv.CaXsVRW8DZTkFR4XWZgUWTWkkYpYTV3fjPLglK3IldEYzXvzzUOglKogjYXcEVxU0UYgCRRsDLtjFRlMSLgoWUrM0YvXUV3fDdPg1Mn8zMyDSX5UkQH8VTV8DZDkFRlwzQicVTWMVdvjFR1gjPHESQFEFLUY0SnomTMYGRBgDc3XzXqQCUXMWUV8DZLoGRncCZOcyLwDldUYDRuEkUOgFRogjYLczXmE0UikGLogjcHIDRwTjQgASUV8DZ5IUS1gjPHQGNFM1ZzPEVyUkUOgFTpgTcyLzSzgiQisVPRokZvjFR4gjPHkWTWgkdUIiX3fjPLglKnM1Y2Y0XqASZHMGUCwDZtfVX0E0UY4TQVE1ZvjFRD0DZHU2LC8Dc3XzXqEjTZoFLogjdHIDR4E0UXoWUxHFNHIDSn4BZic1cVM1ZvjFRyQ0PLglKnEVcQcUVNUjUgsFLogTQIg2R4XWZgUWTWkkYpYTV3fjTMglK3IldEYzXvzzUOglKogjYXcEVxU0UYgCRRsDLtjFRlMSLgoWUrM0YvXUV3fDZQg1Mn8zMyDSX5UkQH8VTV8DZXkFRlwzQicVTWMVdvjFR1gjPHESQFEFLUY0SnomTMYGRBgDc3XzXqQCUXMWUV8DZXoGRncCZOcyLwDldUYDRuEkUOglXogjYLczXmE0UikGLogjcHIDRwTjQgASUV8DZ5IUS1gjPHQGNFM1ZzPEVyUkUOglXpgTcyLzSzgiQisVPRokZvjFRyfjPHkWTWgkdUIiX3fjPLglKnM1Y2Y0XqASZHMGUCwDZtfVX0E0UY4TQVE1ZvjFRG0DZHU2LC8Dc3XzXqEjTZoFLogDMHIDR4E0UXoWUxHFNHIDSn4BZic1cVM1ZvjFRyQ0PLglKnEVcQcUVNUjUgsFLogTPIg2R4XWZgUWTWkkYpYTV3fjTLYGRBgTdQcEV5UkLhgCRBwDZtf1XmcmUisFLogzbTMDSn4BZgUWTWkkSEYUXqASZHETSngTcyLzSzgiQisVPRokZvjFR2QTZHYFSGM1YQc0X4ASZHYGRBgTLEYTXvTkUOgldR0jcHIDRzgiQisFMTg0bUY0SngjZHU2LC8TctzlXq0zUYoGMC8jcIcUV4UkQiYFSGEVcQ01Tv.CaXsVRW8DZXkFR4XWZgUWTWkkYpYTV3fjPLglK3IldEYzXvzzUOglKogjYXcEVxU0UYgCRRsDLtjFRlMSLgoWUrM0YvXUV3fDdPg1Mn8zMyDSX5UkQH8VTV8DZDkFRlwzQicVTWMVdvjFR1gjPHESQFEFLUY0SnomTMYGRBgDc3XzXqQCUXMWUV8DZLoGRncCZOcyLwDldUYDRuEkUOgFRogjYLczXmE0UikGLogjcHIDRwTjQgASUV8DZ5IUS1gjPHQGNFM1ZzPEVyUkUOgFTpgTcyLzSzgiQisVPRokZvjFR4gjPHkWTWgkdUIiX3fjPLglKnM1Y2Y0XqASZHMGUCwDZtfVX0E0UY4TQVE1ZvjFRD0DZHU2LC8Dc3XzXqEjTZoFLogjdHIDR4E0UXoWUxHFNHIDSn4BZic1cVM1ZvjFRyQ0PLglKnEVcQcUVNUjUgsFLogTQIg2R4XWZgUWTWkkYpYTV3fjTMglK3IldEYzXvzzUOglKogjYXcEVxU0UYgCRRsDLtjFRlMSLgoWUrM0YvXUV3fDZQg1Mn8zMyDSX5UkQH8VTV8DZXkFRlwzQicVTWMVdvjFR1gjPHESQFEFLUY0SnomTMYGRBgDc3XzXqQCUXMWUV8DZXoGRncCZOcyLwDldUYDRuEkUOglXogjYLczXmE0UikGLogjcHIDRwTjQgASUV8DZ5IUS1gjPHQGNFM1ZzPEVyUkUOglXpgTcyLzSzgiQisVPRokZvjFRyfjPHkWTWgkdUIiX3fjPLglKnM1Y2Y0XqASZHMGUCwDZtfVX0E0UY4TQVE1ZvjFRG0DZHU2LC8Dc3XzXqEjTZoFLogDMHIDR4E0UXoWUxHFNHIDSn4BZic1cVM1ZvjFRyQ0PLglKnEVcQcUVNUjUgsFLogTPIg2R4XWZgUWTWkkYpYTV3fjTLYGRBgTdQcEV5UkLhgCRBwDZtf1XmcmUisFLogzbTMDSn4BZgUWTWkkSEYUXqASZHETSngTcyLzSzgiQisVPRokZvjFR2QTZHYFSGM1YQc0X4ASZHYGRBgTLEYTXvTkUOgldR0jcHIDRzgiQisFMTg0bUY0SngjZHU2LC8TctzlXq0zUYoGMC8jcIcUV4UkQiYFSGEVcQ01Tv.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.EZtH0X4UEahgCRBwDZtHUVpslQicVRFE1ZvjFR2gjPHcVSFM1aYcUV3fjPLg1LC8DTEwlXmAiUYoWUrIVdzLzSPUDahcFLVkkdUwlXl4xUXgWQVE1ZQcUV3sFQYgCRnIVc3XUXSsFajsVSsgjYXcEVxU0UYgCRB0DctjFR0MyPOAUQrI1YvXUV5UEahYlKWgEdEYUXqE0UYg2ZDkENHglX0giUgETRwHVcIcjX5sVLgQGLTgkdUwlXuUjQgkWRBgTLEYTXvTkUOgFRosjcHg2R4X2PTcVRWg0bUYzXqkzQHYWQrI1YvXUV5UEahkTTV8DZHISX0AiQS8VSGM1ZzXUV3EDLgk2ZFM1a3vVXn4BZic1cVM1ZvjFRxLiPLg1Mn8zMtTEV3UjUgsVTWkEdAIjXmkzUXMWUFM1ZIckTpASZHgGNwD1bMASXvjjLXsVTTkkbEYEYMgiQYsVRBgTLEYTXvTkUOglKosjcHg2R4X2PTcVRWg0bUYzXqkzQHYWQrI1YvXUV5UEahkTTV8DZHISX0AiUSUWTVMlbEYzXugCag8DMwLEaYwFRlg0UXIWUWkENHIESz4RZHU2LC8DTEwlXmAiUYoWUrIlYtbEV3UjUgsVTWkEdqQTV3fDZhUGNVEFQqEiX5UDagkVUrA0ZQIyXqUEag0zZwfUdIIDRwTjQgASUV8DZDkWSz4RZHU2LC8TctTEV3UjUgsVTWkEdM01S2bCZTUGNVEVN1kFU0giUgYlZFkENHgGVxgSLhsFLToUZ3rlX0giUgglKnE1YvXUV3fDdPIGNwH1Z3T0Tu0TLWIENwD1bIIDRvzzUYgGLogjcHIDRqEkUZoWQrgkbUY0Sn4RZHYFQwfkdqw1XqASZHYGRn8zMtTEV3UjUgsVTWkEdM01S23RUXgWQVE1ZQcUV3EjPhcVRWg0bUYzXqkzURoFLogDd3DSXy0TUZUSUwHFZtf1XmcmUisFLogjcyHDSncCZOciKUgEdEYUXqE0UYgWPBI1YIcEVyUkQisVRWIkZvjFR3gSLgMWQpgUd3vlX1E0UZUGMVM0YQcUV3slUXIWSsgjYXcEVxU0UYgCRBwDctjFR0MyPOAUQrI1YvXUV5UEahYlKWgEdEYUXqE0UYg2ZDkENHglX0giUgwzZwHldUwVXqkzQTUWSWokdqESXzkjPHESQFEFLUY0SnwTZKYGR3sTN1MDUmkzUXMWUFM1ZIcDR1UDahcFLVkkdUwlXIEkUOgFRxDVcvDCU0UUahkVUFE0Z2YEVz.idgoVUrgjYXcEVxU0UYgCRBwDctjFR0MyPOAUQrI1YvXUV5UEahYlKWgEdEYUXqE0UYg2ZDkENHglX0giUg0DNFkEL2YEV5sVLgQGNpE1SYwVVn4BZic1cVM1ZvjFR1MiPLg1Mn8zMtTEV3UjUgsVTWkEdAIjXmkzUXMWUFM1ZIckTpASZHgGNwD1bQQkV4E0UXQWSVkkPUYzXxTkUYQGLToUZM0FRlg0UXIWUWkENHIESxLiPLg1Mn8zM2HDUmkzUXMWUFM1ZIIiX4XWdKIENwD1bzLzS0gDLgUGLwHVN1k2RRgSLgMWSWM0YzXEVsUEahkic4sDd3DSXy0zUZMWUGE1YQISX3QyPOYGNwH1aQckV0QiUZQ2Xr8zMtbEV3UjUgkGMC8DTEoFUAACQH8VTV8DZHISX0ASLTUWUsIVZUYETzMlQgsVRBgTLEYTXvTkUOglZCwDctjFR0MyPOAUQpQUPvPDRuEkUOgFRxDVcvDCU0UUahkVUFE0aMczXmQSLXsVRBgTLEYTXvTkUOgFSosjcHg2R4XWdKYWQrI1YvDiX4XWdKYGNwH1aQckV0QiUZQ2Xr8zM2HjX3gSLYgWQVEVN1kmX0UUahkVUVoEcYESXlomUXQWUsk0YMYzXvjzUYgGLogTPUcTVugSLW0DNFk0Z2YkVzMFaHYldVg0azXTUqc1QigCR3A0Z2YTX0kjPHoGNFIFUUYDY5ASZHMSQogjYHESX5EkLgMWTUk0LQc0SnolZSMUTqQEclkFRlwTLgIGNVMFdvjFRrkkUYkVQFkEdHwFRlwTLgMWPxDFcUwVX50TUZUSUV8DZtjFRlwzUYkVTWoUczX0T0EkUYgCRBwDZ2f1S2bCdhISQVEVNt3hKt3hKt3hKt3hKtQUUCUEQTg2ZrM1YQcUVDUjQicVPP4RPHQEY1UTLhkWPP4RPL4hKi4hKt3hKt3hKtXlTU0DUQAURWoULEYzXqEEUXoWQFwyKIMzasA2atUlaz4COuX0TTMCTrU2Yo41TzEFck4C."
                                    },
                                    "fileref": {
                                        "name": "SWAM Cello 3",
                                        "filename": "SWAM Cello 3_20260414.maxsnap",
                                        "filepath": "~/OneDrive/Documents/Max 9/Snapshots",
                                        "filepos": -1,
                                        "snapshotfileid": "8559ddba8728c010d81c7747de99591b"
                                    }
                                }
                            ]
                        }
                    },
                    "text": "vst~ \"SWAM Cello 3\"",
                    "varname": "vst~",
                    "viewvisibility": 0
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
                    "id": "obj-69",
                    "maxclass": "message",
                    "numinlets": 2,
                    "numoutlets": 1,
                    "outlettype": [ "" ],
                    "patching_rect": [ 438.8723382949829, 236.974776, 75.0, 22.0 ],
                    "text": "mutemap $1"
                }
            },
            {
                "box": {
                    "id": "obj-70",
                    "maxclass": "message",
                    "numinlets": 2,
                    "numoutlets": 1,
                    "outlettype": [ "" ],
                    "patching_rect": [ 555.4621517658234, 233.61343145370483, 45.0, 22.0 ],
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
                    "source": [ "obj-17", 0 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-17", 0 ],
                    "source": [ "obj-19", 0 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-66", 0 ],
                    "order": 0,
                    "source": [ "obj-2", 0 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-9", 0 ],
                    "order": 1,
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
                    "destination": [ "obj-3", 0 ],
                    "source": [ "obj-22", 0 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-3", 0 ],
                    "source": [ "obj-23", 0 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-3", 0 ],
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
                    "midpoints": [ 298.8617000579834, 367.80850887298584, 286.4863198144095, 367.80850887298584, 286.4863198144095, 331.80850887298584, 128.64893531799316, 331.80850887298584 ],
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
                    "midpoints": [ 303.11701917648315, 391.80850887298584, 286.4863198144095, 391.80850887298584, 286.4863198144095, 331.80850887298584, 128.64893531799316, 331.80850887298584 ],
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
                    "destination": [ "obj-30", 0 ],
                    "source": [ "obj-4", 0 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-31", 0 ],
                    "source": [ "obj-4", 1 ]
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
                    "source": [ "obj-69", 0 ]
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
            }
        ],
        "parameters": {
            "obj-39": [ "live.gain~[1]", "live.gain~", 0 ],
            "obj-4": [ "vst~", "vst~", 0 ],
            "obj-6": [ "live.gain~", "live.gain~", 0 ],
            "obj-66.1::obj-4": [ "vst~[4]", "vst~[2]", 0 ],
            "obj-66.2::obj-4": [ "vst~[2]", "vst~[2]", 0 ],
            "obj-66.3::obj-4": [ "vst~[3]", "vst~[2]", 0 ],
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