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
        "rect": [ 373.0, 86.0, 766.0, 980.0 ],
        "boxes": [
            {
                "box": {
                    "id": "obj-55",
                    "maxclass": "newobj",
                    "numinlets": 6,
                    "numoutlets": 2,
                    "outlettype": [ "signal", "signal" ],
                    "patching_rect": [ 169.0, 569.0, 377.0, 22.0 ],
                    "text": "abl.device.compressor~ @attack 0.02 @release 0.08 @threshold -20"
                }
            },
            {
                "box": {
                    "id": "obj-38",
                    "maxclass": "comment",
                    "numinlets": 1,
                    "numoutlets": 0,
                    "patching_rect": [ 264.0, 741.0, 150.0, 20.0 ],
                    "text": "Gain reduction envelope"
                }
            },
            {
                "box": {
                    "id": "obj-39",
                    "maxclass": "live.scope~",
                    "numinlets": 2,
                    "numoutlets": 1,
                    "outlettype": [ "bang" ],
                    "patching_rect": [ 264.0, 671.0, 184.0, 68.0 ]
                }
            },
            {
                "box": {
                    "attr": "release",
                    "id": "obj-45",
                    "maxclass": "attrui",
                    "numinlets": 1,
                    "numoutlets": 1,
                    "outlettype": [ "" ],
                    "parameter_enable": 0,
                    "patching_rect": [ 103.0, 656.0, 150.0, 22.0 ]
                }
            },
            {
                "box": {
                    "attr": "ratio",
                    "id": "obj-46",
                    "maxclass": "attrui",
                    "numinlets": 1,
                    "numoutlets": 1,
                    "outlettype": [ "" ],
                    "parameter_enable": 0,
                    "patching_rect": [ 103.0, 704.0, 150.0, 22.0 ]
                }
            },
            {
                "box": {
                    "attr": "gain",
                    "id": "obj-49",
                    "maxclass": "attrui",
                    "numinlets": 1,
                    "numoutlets": 1,
                    "outlettype": [ "" ],
                    "parameter_enable": 0,
                    "patching_rect": [ 103.0, 728.0, 150.0, 22.0 ]
                }
            },
            {
                "box": {
                    "attr": "threshold",
                    "id": "obj-50",
                    "maxclass": "attrui",
                    "numinlets": 1,
                    "numoutlets": 1,
                    "outlettype": [ "" ],
                    "parameter_enable": 0,
                    "patching_rect": [ 103.0, 680.0, 150.0, 22.0 ]
                }
            },
            {
                "box": {
                    "attr": "attack",
                    "id": "obj-51",
                    "maxclass": "attrui",
                    "numinlets": 1,
                    "numoutlets": 1,
                    "outlettype": [ "" ],
                    "parameter_enable": 0,
                    "patching_rect": [ 103.0, 632.0, 150.0, 22.0 ]
                }
            },
            {
                "box": {
                    "id": "obj-54",
                    "maxclass": "newobj",
                    "numinlets": 6,
                    "numoutlets": 2,
                    "outlettype": [ "signal", "signal" ],
                    "patching_rect": [ 200.0, 598.0, 377.0, 22.0 ],
                    "text": "abl.device.compressor~ @attack 0.02 @release 0.08 @threshold -20"
                }
            },
            {
                "box": {
                    "id": "obj-11",
                    "linecount": 18,
                    "maxclass": "comment",
                    "numinlets": 1,
                    "numoutlets": 0,
                    "patching_rect": [ 855.0, 1173.0, 472.0, 269.0 ],
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
                    "patching_rect": [ 345.0, 385.0, 39.0, 22.0 ],
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
                    "patching_rect": [ 308.0, 385.0, 29.5, 22.0 ],
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
                    "patching_rect": [ 258.0, 385.0, 29.5, 22.0 ],
                    "text": "on"
                }
            },
            {
                "box": {
                    "id": "obj-19",
                    "linecount": 18,
                    "maxclass": "comment",
                    "numinlets": 1,
                    "numoutlets": 0,
                    "patching_rect": [ 27.0, 25.0, 472.0, 269.0 ],
                    "text": "// All midievent messages pass through unchanged whether logging is ON or OFF.\n// Other messages (anything, lists, ints) pass through too.\n//\n// Send these messages to the left inlet:\n//   on              start capture, clear buffer\n//   off             stop capture\n//   clear           empty buffer, reset t=0\n//   dump            post summary + full JSON to Max window\n//   limit <n>       cap buffer size (default 4000)\n//   ks_ch <n>       override KS channel 1-16 (default 2 = xk_swam.js KS_CH)\n//   help            list commands\n//\n// Typical use:\n//   1. Hit \"on\", do the turn sequence that mis-fires harmonics / tremolo.\n//   2. Hit \"dump\". Copy the Max window text, paste to an LLM.\n//\n// Captured per event: relative ms, channel, type (noteOn/noteOff/cc/…),\n// raw bytes, and for KS notes the xk_swam.js field label + option guess.\n"
                }
            },
            {
                "box": {
                    "filename": "ks_logger.js",
                    "id": "obj-3",
                    "maxclass": "newobj",
                    "numinlets": 1,
                    "numoutlets": 1,
                    "outlettype": [ "" ],
                    "patching_rect": [ 258.0, 466.0, 168.0, 22.0 ],
                    "saved_object_attributes": {
                        "parameter_enable": 0
                    },
                    "text": "v8 ks_logger.js @autowatch 1",
                    "textfile": {
                        "filename": "ks_logger.js",
                        "flags": 0,
                        "embed": 0,
                        "autowatch": 1
                    }
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
                    "patching_rect": [ 200.0, 433.0, 24.0, 24.0 ]
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
                    "patching_rect": [ 150.0, 367.0, 24.0, 24.0 ]
                }
            },
            {
                "box": {
                    "color": [ 0.869177997112274, 0.548376858234406, 0.0, 1.0 ],
                    "id": "obj-13",
                    "maxclass": "newobj",
                    "numinlets": 1,
                    "numoutlets": 3,
                    "outlettype": [ "", "", "" ],
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
                        "rect": [ 478.0, 168.0, 1000.0, 780.0 ],
                        "boxes": [
                            {
                                "box": {
                                    "id": "obj-15",
                                    "maxclass": "newobj",
                                    "numinlets": 0,
                                    "numoutlets": 1,
                                    "outlettype": [ "" ],
                                    "patching_rect": [ 424.0, 238.0, 122.0, 22.0 ],
                                    "text": "r 1155-ready-for-dicts",
                                    "varname": "maxmcpid-300"
                                }
                            },
                            {
                                "box": {
                                    "id": "obj-8",
                                    "maxclass": "newobj",
                                    "numinlets": 2,
                                    "numoutlets": 1,
                                    "outlettype": [ "" ],
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
                                        "rect": [ 300.0, 126.0, 1094.0, 543.0 ],
                                        "boxes": [
                                            {
                                                "box": {
                                                    "id": "obj-39",
                                                    "maxclass": "newobj",
                                                    "numinlets": 10,
                                                    "numoutlets": 9,
                                                    "outlettype": [ "", "", "", "", "", "", "", "", "" ],
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
                                                        "rect": [ 84.0, 129.0, 833.0, 824.0 ],
                                                        "boxes": [
                                                            {
                                                                "box": {
                                                                    "id": "obj-5",
                                                                    "maxclass": "newobj",
                                                                    "numinlets": 2,
                                                                    "numoutlets": 2,
                                                                    "outlettype": [ "", "" ],
                                                                    "patching_rect": [ 50.0, 428.0, 37.0, 22.0 ],
                                                                    "text": "zl.rev",
                                                                    "varname": "maxmcpid-299"
                                                                }
                                                            },
                                                            {
                                                                "box": {
                                                                    "id": "obj-48",
                                                                    "maxclass": "newobj",
                                                                    "numinlets": 1,
                                                                    "numoutlets": 1,
                                                                    "outlettype": [ "" ],
                                                                    "patching_rect": [ 50.0, 496.0, 79.0, 22.0 ],
                                                                    "text": "append bang",
                                                                    "varname": "maxmcpid-298"
                                                                }
                                                            },
                                                            {
                                                                "box": {
                                                                    "id": "obj-47",
                                                                    "maxclass": "newobj",
                                                                    "numinlets": 2,
                                                                    "numoutlets": 2,
                                                                    "outlettype": [ "", "" ],
                                                                    "patching_rect": [ 50.0, 465.0, 47.0, 22.0 ],
                                                                    "text": "zl.iter 1",
                                                                    "varname": "maxmcpid-297"
                                                                }
                                                            },
                                                            {
                                                                "box": {
                                                                    "id": "obj-46",
                                                                    "maxclass": "newobj",
                                                                    "numinlets": 1,
                                                                    "numoutlets": 9,
                                                                    "outlettype": [ "", "", "", "", "", "", "", "", "" ],
                                                                    "patching_rect": [ 50.0, 529.0, 103.0, 22.0 ],
                                                                    "text": "spray 9 1",
                                                                    "varname": "maxmcpid-296"
                                                                }
                                                            },
                                                            {
                                                                "box": {
                                                                    "id": "obj-44",
                                                                    "maxclass": "message",
                                                                    "numinlets": 2,
                                                                    "numoutlets": 1,
                                                                    "outlettype": [ "" ],
                                                                    "patching_rect": [ 50.0, 142.0, 29.5, 22.0 ],
                                                                    "text": "$1",
                                                                    "varname": "maxmcpid-295"
                                                                }
                                                            },
                                                            {
                                                                "box": {
                                                                    "id": "obj-42",
                                                                    "maxclass": "newobj",
                                                                    "numinlets": 9,
                                                                    "numoutlets": 1,
                                                                    "outlettype": [ "list" ],
                                                                    "patching_rect": [ 50.0, 100.0, 103.0, 22.0 ],
                                                                    "text": "funnel 9 1",
                                                                    "varname": "maxmcpid-294"
                                                                }
                                                            },
                                                            {
                                                                "box": {
                                                                    "id": "obj-36",
                                                                    "maxclass": "newobj",
                                                                    "numinlets": 2,
                                                                    "numoutlets": 2,
                                                                    "outlettype": [ "", "" ],
                                                                    "patching_rect": [ 50.0, 394.0, 38.0, 22.0 ],
                                                                    "text": "zl.reg",
                                                                    "varname": "maxmcpid-293"
                                                                }
                                                            },
                                                            {
                                                                "box": {
                                                                    "id": "obj-35",
                                                                    "maxclass": "newobj",
                                                                    "numinlets": 1,
                                                                    "numoutlets": 3,
                                                                    "outlettype": [ "int", "bang", "int" ],
                                                                    "patching_rect": [ 50.0, 184.0, 91.0, 22.0 ],
                                                                    "text": "t i b i",
                                                                    "varname": "maxmcpid-292"
                                                                }
                                                            },
                                                            {
                                                                "box": {
                                                                    "id": "obj-34",
                                                                    "maxclass": "newobj",
                                                                    "numinlets": 2,
                                                                    "numoutlets": 2,
                                                                    "outlettype": [ "", "" ],
                                                                    "patching_rect": [ 78.0, 272.0, 63.0, 22.0 ],
                                                                    "text": "zl.filter",
                                                                    "varname": "maxmcpid-291"
                                                                }
                                                            },
                                                            {
                                                                "box": {
                                                                    "id": "obj-30",
                                                                    "maxclass": "newobj",
                                                                    "numinlets": 2,
                                                                    "numoutlets": 2,
                                                                    "outlettype": [ "", "" ],
                                                                    "patching_rect": [ 50.0, 318.0, 39.0, 22.0 ],
                                                                    "text": "zl.join",
                                                                    "varname": "maxmcpid-290"
                                                                }
                                                            },
                                                            {
                                                                "box": {
                                                                    "id": "obj-29",
                                                                    "maxclass": "newobj",
                                                                    "numinlets": 2,
                                                                    "numoutlets": 2,
                                                                    "outlettype": [ "", "" ],
                                                                    "patching_rect": [ 78.0, 234.0, 38.0, 22.0 ],
                                                                    "text": "zl.reg",
                                                                    "varname": "maxmcpid-289"
                                                                }
                                                            },
                                                            {
                                                                "box": {
                                                                    "comment": "",
                                                                    "id": "obj-14",
                                                                    "index": 1,
                                                                    "maxclass": "inlet",
                                                                    "numinlets": 0,
                                                                    "numoutlets": 1,
                                                                    "outlettype": [ "" ],
                                                                    "patching_rect": [ 50.0, 40.0, 30.0, 30.0 ],
                                                                    "varname": "maxmcpid-288"
                                                                }
                                                            },
                                                            {
                                                                "box": {
                                                                    "comment": "",
                                                                    "id": "obj-16",
                                                                    "index": 10,
                                                                    "maxclass": "inlet",
                                                                    "numinlets": 0,
                                                                    "numoutlets": 1,
                                                                    "outlettype": [ "bang" ],
                                                                    "patching_rect": [ 423.0, 40.0, 30.0, 30.0 ],
                                                                    "varname": "maxmcpid-287"
                                                                }
                                                            },
                                                            {
                                                                "box": {
                                                                    "comment": "",
                                                                    "id": "obj-17",
                                                                    "index": 2,
                                                                    "maxclass": "inlet",
                                                                    "numinlets": 0,
                                                                    "numoutlets": 1,
                                                                    "outlettype": [ "" ],
                                                                    "patching_rect": [ 99.0, 40.0, 30.0, 30.0 ],
                                                                    "varname": "maxmcpid-286"
                                                                }
                                                            },
                                                            {
                                                                "box": {
                                                                    "comment": "",
                                                                    "id": "obj-18",
                                                                    "index": 3,
                                                                    "maxclass": "inlet",
                                                                    "numinlets": 0,
                                                                    "numoutlets": 1,
                                                                    "outlettype": [ "" ],
                                                                    "patching_rect": [ 134.0, 40.0, 30.0, 30.0 ],
                                                                    "varname": "maxmcpid-285"
                                                                }
                                                            },
                                                            {
                                                                "box": {
                                                                    "comment": "",
                                                                    "id": "obj-19",
                                                                    "index": 4,
                                                                    "maxclass": "inlet",
                                                                    "numinlets": 0,
                                                                    "numoutlets": 1,
                                                                    "outlettype": [ "" ],
                                                                    "patching_rect": [ 169.0, 40.0, 30.0, 30.0 ],
                                                                    "varname": "maxmcpid-284"
                                                                }
                                                            },
                                                            {
                                                                "box": {
                                                                    "comment": "",
                                                                    "id": "obj-20",
                                                                    "index": 5,
                                                                    "maxclass": "inlet",
                                                                    "numinlets": 0,
                                                                    "numoutlets": 1,
                                                                    "outlettype": [ "" ],
                                                                    "patching_rect": [ 204.0, 40.0, 30.0, 30.0 ],
                                                                    "varname": "maxmcpid-283"
                                                                }
                                                            },
                                                            {
                                                                "box": {
                                                                    "comment": "",
                                                                    "id": "obj-21",
                                                                    "index": 6,
                                                                    "maxclass": "inlet",
                                                                    "numinlets": 0,
                                                                    "numoutlets": 1,
                                                                    "outlettype": [ "" ],
                                                                    "patching_rect": [ 239.0, 40.0, 30.0, 30.0 ],
                                                                    "varname": "maxmcpid-282"
                                                                }
                                                            },
                                                            {
                                                                "box": {
                                                                    "comment": "",
                                                                    "id": "obj-22",
                                                                    "index": 7,
                                                                    "maxclass": "inlet",
                                                                    "numinlets": 0,
                                                                    "numoutlets": 1,
                                                                    "outlettype": [ "" ],
                                                                    "patching_rect": [ 274.0, 40.0, 30.0, 30.0 ],
                                                                    "varname": "maxmcpid-281"
                                                                }
                                                            },
                                                            {
                                                                "box": {
                                                                    "comment": "",
                                                                    "id": "obj-23",
                                                                    "index": 8,
                                                                    "maxclass": "inlet",
                                                                    "numinlets": 0,
                                                                    "numoutlets": 1,
                                                                    "outlettype": [ "" ],
                                                                    "patching_rect": [ 309.0, 40.0, 30.0, 30.0 ],
                                                                    "varname": "maxmcpid-280"
                                                                }
                                                            },
                                                            {
                                                                "box": {
                                                                    "comment": "",
                                                                    "id": "obj-24",
                                                                    "index": 9,
                                                                    "maxclass": "inlet",
                                                                    "numinlets": 0,
                                                                    "numoutlets": 1,
                                                                    "outlettype": [ "" ],
                                                                    "patching_rect": [ 344.0, 40.0, 30.0, 30.0 ],
                                                                    "varname": "maxmcpid-279"
                                                                }
                                                            },
                                                            {
                                                                "box": {
                                                                    "comment": "",
                                                                    "id": "obj-25",
                                                                    "index": 2,
                                                                    "maxclass": "outlet",
                                                                    "numinlets": 1,
                                                                    "numoutlets": 0,
                                                                    "patching_rect": [ 86.0, 606.0, 30.0, 30.0 ],
                                                                    "varname": "maxmcpid-278"
                                                                }
                                                            },
                                                            {
                                                                "box": {
                                                                    "comment": "",
                                                                    "id": "obj-26",
                                                                    "index": 3,
                                                                    "maxclass": "outlet",
                                                                    "numinlets": 1,
                                                                    "numoutlets": 0,
                                                                    "patching_rect": [ 121.0, 606.0, 30.0, 30.0 ],
                                                                    "varname": "maxmcpid-277"
                                                                }
                                                            },
                                                            {
                                                                "box": {
                                                                    "comment": "",
                                                                    "id": "obj-27",
                                                                    "index": 4,
                                                                    "maxclass": "outlet",
                                                                    "numinlets": 1,
                                                                    "numoutlets": 0,
                                                                    "patching_rect": [ 156.0, 606.0, 30.0, 30.0 ],
                                                                    "varname": "maxmcpid-276"
                                                                }
                                                            },
                                                            {
                                                                "box": {
                                                                    "comment": "",
                                                                    "id": "obj-28",
                                                                    "index": 5,
                                                                    "maxclass": "outlet",
                                                                    "numinlets": 1,
                                                                    "numoutlets": 0,
                                                                    "patching_rect": [ 191.0, 606.0, 30.0, 30.0 ],
                                                                    "varname": "maxmcpid-275"
                                                                }
                                                            },
                                                            {
                                                                "box": {
                                                                    "comment": "",
                                                                    "id": "obj-31",
                                                                    "index": 6,
                                                                    "maxclass": "outlet",
                                                                    "numinlets": 1,
                                                                    "numoutlets": 0,
                                                                    "patching_rect": [ 226.0, 606.0, 30.0, 30.0 ],
                                                                    "varname": "maxmcpid-274"
                                                                }
                                                            },
                                                            {
                                                                "box": {
                                                                    "comment": "",
                                                                    "id": "obj-32",
                                                                    "index": 7,
                                                                    "maxclass": "outlet",
                                                                    "numinlets": 1,
                                                                    "numoutlets": 0,
                                                                    "patching_rect": [ 261.0, 606.0, 30.0, 30.0 ],
                                                                    "varname": "maxmcpid-273"
                                                                }
                                                            },
                                                            {
                                                                "box": {
                                                                    "comment": "",
                                                                    "id": "obj-33",
                                                                    "index": 8,
                                                                    "maxclass": "outlet",
                                                                    "numinlets": 1,
                                                                    "numoutlets": 0,
                                                                    "patching_rect": [ 296.0, 606.0, 30.0, 30.0 ],
                                                                    "varname": "maxmcpid-272"
                                                                }
                                                            },
                                                            {
                                                                "box": {
                                                                    "comment": "",
                                                                    "id": "obj-37",
                                                                    "index": 9,
                                                                    "maxclass": "outlet",
                                                                    "numinlets": 1,
                                                                    "numoutlets": 0,
                                                                    "patching_rect": [ 331.0, 606.0, 30.0, 30.0 ],
                                                                    "varname": "maxmcpid-271"
                                                                }
                                                            },
                                                            {
                                                                "box": {
                                                                    "comment": "",
                                                                    "id": "obj-38",
                                                                    "index": 1,
                                                                    "maxclass": "outlet",
                                                                    "numinlets": 1,
                                                                    "numoutlets": 0,
                                                                    "patching_rect": [ 50.0, 606.0, 30.0, 30.0 ],
                                                                    "varname": "maxmcpid-270"
                                                                }
                                                            }
                                                        ],
                                                        "lines": [
                                                            {
                                                                "patchline": {
                                                                    "destination": [ "obj-42", 0 ],
                                                                    "source": [ "obj-14", 0 ]
                                                                }
                                                            },
                                                            {
                                                                "patchline": {
                                                                    "destination": [ "obj-36", 0 ],
                                                                    "source": [ "obj-16", 0 ]
                                                                }
                                                            },
                                                            {
                                                                "patchline": {
                                                                    "destination": [ "obj-42", 1 ],
                                                                    "source": [ "obj-17", 0 ]
                                                                }
                                                            },
                                                            {
                                                                "patchline": {
                                                                    "destination": [ "obj-42", 2 ],
                                                                    "source": [ "obj-18", 0 ]
                                                                }
                                                            },
                                                            {
                                                                "patchline": {
                                                                    "destination": [ "obj-42", 3 ],
                                                                    "source": [ "obj-19", 0 ]
                                                                }
                                                            },
                                                            {
                                                                "patchline": {
                                                                    "destination": [ "obj-42", 4 ],
                                                                    "source": [ "obj-20", 0 ]
                                                                }
                                                            },
                                                            {
                                                                "patchline": {
                                                                    "destination": [ "obj-42", 5 ],
                                                                    "source": [ "obj-21", 0 ]
                                                                }
                                                            },
                                                            {
                                                                "patchline": {
                                                                    "destination": [ "obj-42", 6 ],
                                                                    "source": [ "obj-22", 0 ]
                                                                }
                                                            },
                                                            {
                                                                "patchline": {
                                                                    "destination": [ "obj-42", 7 ],
                                                                    "source": [ "obj-23", 0 ]
                                                                }
                                                            },
                                                            {
                                                                "patchline": {
                                                                    "destination": [ "obj-42", 8 ],
                                                                    "source": [ "obj-24", 0 ]
                                                                }
                                                            },
                                                            {
                                                                "patchline": {
                                                                    "destination": [ "obj-34", 0 ],
                                                                    "source": [ "obj-29", 0 ]
                                                                }
                                                            },
                                                            {
                                                                "patchline": {
                                                                    "destination": [ "obj-29", 1 ],
                                                                    "midpoints": [ 59.5, 350.0, 187.0, 350.0, 187.0, 223.0, 106.5, 223.0 ],
                                                                    "order": 0,
                                                                    "source": [ "obj-30", 0 ]
                                                                }
                                                            },
                                                            {
                                                                "patchline": {
                                                                    "destination": [ "obj-36", 1 ],
                                                                    "order": 1,
                                                                    "source": [ "obj-30", 0 ]
                                                                }
                                                            },
                                                            {
                                                                "patchline": {
                                                                    "destination": [ "obj-30", 1 ],
                                                                    "source": [ "obj-34", 0 ]
                                                                }
                                                            },
                                                            {
                                                                "patchline": {
                                                                    "destination": [ "obj-29", 0 ],
                                                                    "source": [ "obj-35", 1 ]
                                                                }
                                                            },
                                                            {
                                                                "patchline": {
                                                                    "destination": [ "obj-30", 0 ],
                                                                    "source": [ "obj-35", 0 ]
                                                                }
                                                            },
                                                            {
                                                                "patchline": {
                                                                    "destination": [ "obj-34", 1 ],
                                                                    "source": [ "obj-35", 2 ]
                                                                }
                                                            },
                                                            {
                                                                "patchline": {
                                                                    "destination": [ "obj-5", 0 ],
                                                                    "source": [ "obj-36", 0 ]
                                                                }
                                                            },
                                                            {
                                                                "patchline": {
                                                                    "destination": [ "obj-44", 0 ],
                                                                    "source": [ "obj-42", 0 ]
                                                                }
                                                            },
                                                            {
                                                                "patchline": {
                                                                    "destination": [ "obj-35", 0 ],
                                                                    "source": [ "obj-44", 0 ]
                                                                }
                                                            },
                                                            {
                                                                "patchline": {
                                                                    "destination": [ "obj-25", 0 ],
                                                                    "source": [ "obj-46", 1 ]
                                                                }
                                                            },
                                                            {
                                                                "patchline": {
                                                                    "destination": [ "obj-26", 0 ],
                                                                    "source": [ "obj-46", 2 ]
                                                                }
                                                            },
                                                            {
                                                                "patchline": {
                                                                    "destination": [ "obj-27", 0 ],
                                                                    "source": [ "obj-46", 3 ]
                                                                }
                                                            },
                                                            {
                                                                "patchline": {
                                                                    "destination": [ "obj-28", 0 ],
                                                                    "source": [ "obj-46", 4 ]
                                                                }
                                                            },
                                                            {
                                                                "patchline": {
                                                                    "destination": [ "obj-31", 0 ],
                                                                    "source": [ "obj-46", 5 ]
                                                                }
                                                            },
                                                            {
                                                                "patchline": {
                                                                    "destination": [ "obj-32", 0 ],
                                                                    "source": [ "obj-46", 6 ]
                                                                }
                                                            },
                                                            {
                                                                "patchline": {
                                                                    "destination": [ "obj-33", 0 ],
                                                                    "source": [ "obj-46", 7 ]
                                                                }
                                                            },
                                                            {
                                                                "patchline": {
                                                                    "destination": [ "obj-37", 0 ],
                                                                    "source": [ "obj-46", 8 ]
                                                                }
                                                            },
                                                            {
                                                                "patchline": {
                                                                    "destination": [ "obj-38", 0 ],
                                                                    "source": [ "obj-46", 0 ]
                                                                }
                                                            },
                                                            {
                                                                "patchline": {
                                                                    "destination": [ "obj-48", 0 ],
                                                                    "source": [ "obj-47", 0 ]
                                                                }
                                                            },
                                                            {
                                                                "patchline": {
                                                                    "destination": [ "obj-46", 0 ],
                                                                    "source": [ "obj-48", 0 ]
                                                                }
                                                            },
                                                            {
                                                                "patchline": {
                                                                    "destination": [ "obj-47", 0 ],
                                                                    "source": [ "obj-5", 0 ]
                                                                }
                                                            }
                                                        ]
                                                    },
                                                    "patching_rect": [ 783.25, 219.0, 113.5, 22.0 ],
                                                    "text": "p initializer-storage",
                                                    "varname": "maxmcpid-269"
                                                }
                                            },
                                            {
                                                "box": {
                                                    "comment": "",
                                                    "id": "obj-49",
                                                    "index": 1,
                                                    "maxclass": "outlet",
                                                    "numinlets": 1,
                                                    "numoutlets": 0,
                                                    "patching_rect": [ 110.5, 418.0, 30.0, 30.0 ],
                                                    "varname": "maxmcpid-268"
                                                }
                                            },
                                            {
                                                "box": {
                                                    "id": "obj-45",
                                                    "maxclass": "newobj",
                                                    "numinlets": 1,
                                                    "numoutlets": 1,
                                                    "outlettype": [ "bang" ],
                                                    "patching_rect": [ 1016.0, 144.0, 22.0, 22.0 ],
                                                    "text": "t b",
                                                    "varname": "maxmcpid-267"
                                                }
                                            },
                                            {
                                                "box": {
                                                    "comment": "",
                                                    "id": "obj-12",
                                                    "index": 2,
                                                    "maxclass": "inlet",
                                                    "numinlets": 0,
                                                    "numoutlets": 1,
                                                    "outlettype": [ "" ],
                                                    "patching_rect": [ 1016.0, 21.0, 30.0, 30.0 ],
                                                    "varname": "maxmcpid-266"
                                                }
                                            },
                                            {
                                                "box": {
                                                    "id": "obj-7",
                                                    "maxclass": "newobj",
                                                    "numinlets": 2,
                                                    "numoutlets": 1,
                                                    "outlettype": [ "" ],
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
                                                        "rect": [ 963.0, 462.0, 640.0, 480.0 ],
                                                        "boxes": [
                                                            {
                                                                "box": {
                                                                    "id": "obj-9",
                                                                    "maxclass": "newobj",
                                                                    "numinlets": 2,
                                                                    "numoutlets": 2,
                                                                    "outlettype": [ "", "" ],
                                                                    "patching_rect": [ 98.0, 122.0, 55.0, 22.0 ],
                                                                    "text": "zl.slice 1",
                                                                    "varname": "maxmcpid-265"
                                                                }
                                                            },
                                                            {
                                                                "box": {
                                                                    "comment": "",
                                                                    "id": "obj-8",
                                                                    "index": 1,
                                                                    "maxclass": "outlet",
                                                                    "numinlets": 1,
                                                                    "numoutlets": 0,
                                                                    "patching_rect": [ 243.0, 335.0, 30.0, 30.0 ],
                                                                    "varname": "maxmcpid-264"
                                                                }
                                                            },
                                                            {
                                                                "box": {
                                                                    "comment": "",
                                                                    "id": "obj-2",
                                                                    "index": 2,
                                                                    "maxclass": "inlet",
                                                                    "numinlets": 0,
                                                                    "numoutlets": 1,
                                                                    "outlettype": [ "" ],
                                                                    "patching_rect": [ 243.0, 48.0, 30.0, 30.0 ],
                                                                    "varname": "maxmcpid-263"
                                                                }
                                                            },
                                                            {
                                                                "box": {
                                                                    "id": "obj-1",
                                                                    "maxclass": "newobj",
                                                                    "numinlets": 2,
                                                                    "numoutlets": 2,
                                                                    "outlettype": [ "", "" ],
                                                                    "patching_rect": [ 243.0, 162.0, 38.0, 22.0 ],
                                                                    "text": "zl.reg",
                                                                    "varname": "maxmcpid-262"
                                                                }
                                                            },
                                                            {
                                                                "box": {
                                                                    "id": "obj-6",
                                                                    "maxclass": "newobj",
                                                                    "numinlets": 2,
                                                                    "numoutlets": 5,
                                                                    "outlettype": [ "dictionary", "", "", "", "" ],
                                                                    "patching_rect": [ 98.0, 273.0, 50.5, 22.0 ],
                                                                    "saved_object_attributes": {
                                                                        "legacy": 1,
                                                                        "parameter_enable": 0,
                                                                        "parameter_mappable": 0
                                                                    },
                                                                    "text": "dict",
                                                                    "varname": "maxmcpid-261"
                                                                }
                                                            },
                                                            {
                                                                "box": {
                                                                    "id": "obj-5",
                                                                    "maxclass": "newobj",
                                                                    "numinlets": 1,
                                                                    "numoutlets": 1,
                                                                    "outlettype": [ "" ],
                                                                    "patching_rect": [ 98.0, 234.0, 86.0, 22.0 ],
                                                                    "text": "prepend name",
                                                                    "varname": "maxmcpid-260"
                                                                }
                                                            },
                                                            {
                                                                "box": {
                                                                    "id": "obj-4",
                                                                    "maxclass": "newobj",
                                                                    "numinlets": 2,
                                                                    "numoutlets": 2,
                                                                    "outlettype": [ "", "" ],
                                                                    "patching_rect": [ 98.0, 200.0, 91.0, 22.0 ],
                                                                    "text": "route dictionary",
                                                                    "varname": "maxmcpid-259"
                                                                }
                                                            },
                                                            {
                                                                "box": {
                                                                    "id": "obj-3",
                                                                    "maxclass": "newobj",
                                                                    "numinlets": 3,
                                                                    "numoutlets": 3,
                                                                    "outlettype": [ "", "", "" ],
                                                                    "patching_rect": [ 98.0, 162.0, 111.0, 22.0 ],
                                                                    "text": "route success error",
                                                                    "varname": "maxmcpid-258"
                                                                }
                                                            },
                                                            {
                                                                "box": {
                                                                    "comment": "",
                                                                    "id": "obj-7",
                                                                    "index": 1,
                                                                    "maxclass": "inlet",
                                                                    "numinlets": 0,
                                                                    "numoutlets": 1,
                                                                    "outlettype": [ "" ],
                                                                    "patching_rect": [ 98.0, 48.0, 30.0, 30.0 ],
                                                                    "varname": "maxmcpid-257"
                                                                }
                                                            }
                                                        ],
                                                        "lines": [
                                                            {
                                                                "patchline": {
                                                                    "destination": [ "obj-8", 0 ],
                                                                    "source": [ "obj-1", 0 ]
                                                                }
                                                            },
                                                            {
                                                                "patchline": {
                                                                    "destination": [ "obj-1", 0 ],
                                                                    "source": [ "obj-2", 0 ]
                                                                }
                                                            },
                                                            {
                                                                "patchline": {
                                                                    "destination": [ "obj-4", 0 ],
                                                                    "source": [ "obj-3", 1 ]
                                                                }
                                                            },
                                                            {
                                                                "patchline": {
                                                                    "destination": [ "obj-4", 0 ],
                                                                    "source": [ "obj-3", 0 ]
                                                                }
                                                            },
                                                            {
                                                                "patchline": {
                                                                    "destination": [ "obj-5", 0 ],
                                                                    "source": [ "obj-4", 0 ]
                                                                }
                                                            },
                                                            {
                                                                "patchline": {
                                                                    "destination": [ "obj-6", 0 ],
                                                                    "source": [ "obj-5", 0 ]
                                                                }
                                                            },
                                                            {
                                                                "patchline": {
                                                                    "destination": [ "obj-1", 1 ],
                                                                    "order": 0,
                                                                    "source": [ "obj-7", 0 ]
                                                                }
                                                            },
                                                            {
                                                                "patchline": {
                                                                    "destination": [ "obj-9", 0 ],
                                                                    "order": 1,
                                                                    "source": [ "obj-7", 0 ]
                                                                }
                                                            },
                                                            {
                                                                "patchline": {
                                                                    "destination": [ "obj-3", 0 ],
                                                                    "source": [ "obj-9", 1 ]
                                                                }
                                                            }
                                                        ]
                                                    },
                                                    "patching_rect": [ 727.5, 359.0, 71.0, 22.0 ],
                                                    "text": "p retain-dict",
                                                    "varname": "maxmcpid-256"
                                                }
                                            },
                                            {
                                                "box": {
                                                    "id": "obj-6",
                                                    "maxclass": "newobj",
                                                    "numinlets": 2,
                                                    "numoutlets": 1,
                                                    "outlettype": [ "" ],
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
                                                        "rect": [ 963.0, 462.0, 640.0, 480.0 ],
                                                        "boxes": [
                                                            {
                                                                "box": {
                                                                    "id": "obj-9",
                                                                    "maxclass": "newobj",
                                                                    "numinlets": 2,
                                                                    "numoutlets": 2,
                                                                    "outlettype": [ "", "" ],
                                                                    "patching_rect": [ 98.0, 122.0, 55.0, 22.0 ],
                                                                    "text": "zl.slice 1",
                                                                    "varname": "maxmcpid-255"
                                                                }
                                                            },
                                                            {
                                                                "box": {
                                                                    "comment": "",
                                                                    "id": "obj-8",
                                                                    "index": 1,
                                                                    "maxclass": "outlet",
                                                                    "numinlets": 1,
                                                                    "numoutlets": 0,
                                                                    "patching_rect": [ 243.0, 335.0, 30.0, 30.0 ],
                                                                    "varname": "maxmcpid-254"
                                                                }
                                                            },
                                                            {
                                                                "box": {
                                                                    "comment": "",
                                                                    "id": "obj-2",
                                                                    "index": 2,
                                                                    "maxclass": "inlet",
                                                                    "numinlets": 0,
                                                                    "numoutlets": 1,
                                                                    "outlettype": [ "" ],
                                                                    "patching_rect": [ 243.0, 48.0, 30.0, 30.0 ],
                                                                    "varname": "maxmcpid-253"
                                                                }
                                                            },
                                                            {
                                                                "box": {
                                                                    "id": "obj-1",
                                                                    "maxclass": "newobj",
                                                                    "numinlets": 2,
                                                                    "numoutlets": 2,
                                                                    "outlettype": [ "", "" ],
                                                                    "patching_rect": [ 243.0, 162.0, 38.0, 22.0 ],
                                                                    "text": "zl.reg",
                                                                    "varname": "maxmcpid-252"
                                                                }
                                                            },
                                                            {
                                                                "box": {
                                                                    "id": "obj-6",
                                                                    "maxclass": "newobj",
                                                                    "numinlets": 2,
                                                                    "numoutlets": 5,
                                                                    "outlettype": [ "dictionary", "", "", "", "" ],
                                                                    "patching_rect": [ 98.0, 273.0, 50.5, 22.0 ],
                                                                    "saved_object_attributes": {
                                                                        "legacy": 1,
                                                                        "parameter_enable": 0,
                                                                        "parameter_mappable": 0
                                                                    },
                                                                    "text": "dict",
                                                                    "varname": "maxmcpid-251"
                                                                }
                                                            },
                                                            {
                                                                "box": {
                                                                    "id": "obj-5",
                                                                    "maxclass": "newobj",
                                                                    "numinlets": 1,
                                                                    "numoutlets": 1,
                                                                    "outlettype": [ "" ],
                                                                    "patching_rect": [ 98.0, 234.0, 86.0, 22.0 ],
                                                                    "text": "prepend name",
                                                                    "varname": "maxmcpid-250"
                                                                }
                                                            },
                                                            {
                                                                "box": {
                                                                    "id": "obj-4",
                                                                    "maxclass": "newobj",
                                                                    "numinlets": 2,
                                                                    "numoutlets": 2,
                                                                    "outlettype": [ "", "" ],
                                                                    "patching_rect": [ 98.0, 200.0, 91.0, 22.0 ],
                                                                    "text": "route dictionary",
                                                                    "varname": "maxmcpid-249"
                                                                }
                                                            },
                                                            {
                                                                "box": {
                                                                    "id": "obj-3",
                                                                    "maxclass": "newobj",
                                                                    "numinlets": 3,
                                                                    "numoutlets": 3,
                                                                    "outlettype": [ "", "", "" ],
                                                                    "patching_rect": [ 98.0, 162.0, 111.0, 22.0 ],
                                                                    "text": "route success error",
                                                                    "varname": "maxmcpid-248"
                                                                }
                                                            },
                                                            {
                                                                "box": {
                                                                    "comment": "",
                                                                    "id": "obj-7",
                                                                    "index": 1,
                                                                    "maxclass": "inlet",
                                                                    "numinlets": 0,
                                                                    "numoutlets": 1,
                                                                    "outlettype": [ "" ],
                                                                    "patching_rect": [ 98.0, 48.0, 30.0, 30.0 ],
                                                                    "varname": "maxmcpid-247"
                                                                }
                                                            }
                                                        ],
                                                        "lines": [
                                                            {
                                                                "patchline": {
                                                                    "destination": [ "obj-8", 0 ],
                                                                    "source": [ "obj-1", 0 ]
                                                                }
                                                            },
                                                            {
                                                                "patchline": {
                                                                    "destination": [ "obj-1", 0 ],
                                                                    "source": [ "obj-2", 0 ]
                                                                }
                                                            },
                                                            {
                                                                "patchline": {
                                                                    "destination": [ "obj-4", 0 ],
                                                                    "source": [ "obj-3", 1 ]
                                                                }
                                                            },
                                                            {
                                                                "patchline": {
                                                                    "destination": [ "obj-4", 0 ],
                                                                    "source": [ "obj-3", 0 ]
                                                                }
                                                            },
                                                            {
                                                                "patchline": {
                                                                    "destination": [ "obj-5", 0 ],
                                                                    "source": [ "obj-4", 0 ]
                                                                }
                                                            },
                                                            {
                                                                "patchline": {
                                                                    "destination": [ "obj-6", 0 ],
                                                                    "source": [ "obj-5", 0 ]
                                                                }
                                                            },
                                                            {
                                                                "patchline": {
                                                                    "destination": [ "obj-1", 1 ],
                                                                    "order": 0,
                                                                    "source": [ "obj-7", 0 ]
                                                                }
                                                            },
                                                            {
                                                                "patchline": {
                                                                    "destination": [ "obj-9", 0 ],
                                                                    "order": 1,
                                                                    "source": [ "obj-7", 0 ]
                                                                }
                                                            },
                                                            {
                                                                "patchline": {
                                                                    "destination": [ "obj-3", 0 ],
                                                                    "source": [ "obj-9", 1 ]
                                                                }
                                                            }
                                                        ]
                                                    },
                                                    "patching_rect": [ 648.5, 359.0, 71.0, 22.0 ],
                                                    "text": "p retain-dict",
                                                    "varname": "maxmcpid-246"
                                                }
                                            },
                                            {
                                                "box": {
                                                    "id": "obj-5",
                                                    "maxclass": "newobj",
                                                    "numinlets": 2,
                                                    "numoutlets": 1,
                                                    "outlettype": [ "" ],
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
                                                        "rect": [ 963.0, 462.0, 640.0, 480.0 ],
                                                        "boxes": [
                                                            {
                                                                "box": {
                                                                    "id": "obj-9",
                                                                    "maxclass": "newobj",
                                                                    "numinlets": 2,
                                                                    "numoutlets": 2,
                                                                    "outlettype": [ "", "" ],
                                                                    "patching_rect": [ 98.0, 122.0, 55.0, 22.0 ],
                                                                    "text": "zl.slice 1",
                                                                    "varname": "maxmcpid-245"
                                                                }
                                                            },
                                                            {
                                                                "box": {
                                                                    "comment": "",
                                                                    "id": "obj-8",
                                                                    "index": 1,
                                                                    "maxclass": "outlet",
                                                                    "numinlets": 1,
                                                                    "numoutlets": 0,
                                                                    "patching_rect": [ 243.0, 335.0, 30.0, 30.0 ],
                                                                    "varname": "maxmcpid-244"
                                                                }
                                                            },
                                                            {
                                                                "box": {
                                                                    "comment": "",
                                                                    "id": "obj-2",
                                                                    "index": 2,
                                                                    "maxclass": "inlet",
                                                                    "numinlets": 0,
                                                                    "numoutlets": 1,
                                                                    "outlettype": [ "" ],
                                                                    "patching_rect": [ 243.0, 48.0, 30.0, 30.0 ],
                                                                    "varname": "maxmcpid-243"
                                                                }
                                                            },
                                                            {
                                                                "box": {
                                                                    "id": "obj-1",
                                                                    "maxclass": "newobj",
                                                                    "numinlets": 2,
                                                                    "numoutlets": 2,
                                                                    "outlettype": [ "", "" ],
                                                                    "patching_rect": [ 243.0, 162.0, 38.0, 22.0 ],
                                                                    "text": "zl.reg",
                                                                    "varname": "maxmcpid-242"
                                                                }
                                                            },
                                                            {
                                                                "box": {
                                                                    "id": "obj-6",
                                                                    "maxclass": "newobj",
                                                                    "numinlets": 2,
                                                                    "numoutlets": 5,
                                                                    "outlettype": [ "dictionary", "", "", "", "" ],
                                                                    "patching_rect": [ 98.0, 273.0, 50.5, 22.0 ],
                                                                    "saved_object_attributes": {
                                                                        "legacy": 1,
                                                                        "parameter_enable": 0,
                                                                        "parameter_mappable": 0
                                                                    },
                                                                    "text": "dict",
                                                                    "varname": "maxmcpid-241"
                                                                }
                                                            },
                                                            {
                                                                "box": {
                                                                    "id": "obj-5",
                                                                    "maxclass": "newobj",
                                                                    "numinlets": 1,
                                                                    "numoutlets": 1,
                                                                    "outlettype": [ "" ],
                                                                    "patching_rect": [ 98.0, 234.0, 86.0, 22.0 ],
                                                                    "text": "prepend name",
                                                                    "varname": "maxmcpid-240"
                                                                }
                                                            },
                                                            {
                                                                "box": {
                                                                    "id": "obj-4",
                                                                    "maxclass": "newobj",
                                                                    "numinlets": 2,
                                                                    "numoutlets": 2,
                                                                    "outlettype": [ "", "" ],
                                                                    "patching_rect": [ 98.0, 200.0, 91.0, 22.0 ],
                                                                    "text": "route dictionary",
                                                                    "varname": "maxmcpid-239"
                                                                }
                                                            },
                                                            {
                                                                "box": {
                                                                    "id": "obj-3",
                                                                    "maxclass": "newobj",
                                                                    "numinlets": 3,
                                                                    "numoutlets": 3,
                                                                    "outlettype": [ "", "", "" ],
                                                                    "patching_rect": [ 98.0, 162.0, 111.0, 22.0 ],
                                                                    "text": "route success error",
                                                                    "varname": "maxmcpid-238"
                                                                }
                                                            },
                                                            {
                                                                "box": {
                                                                    "comment": "",
                                                                    "id": "obj-7",
                                                                    "index": 1,
                                                                    "maxclass": "inlet",
                                                                    "numinlets": 0,
                                                                    "numoutlets": 1,
                                                                    "outlettype": [ "" ],
                                                                    "patching_rect": [ 98.0, 48.0, 30.0, 30.0 ],
                                                                    "varname": "maxmcpid-237"
                                                                }
                                                            }
                                                        ],
                                                        "lines": [
                                                            {
                                                                "patchline": {
                                                                    "destination": [ "obj-8", 0 ],
                                                                    "source": [ "obj-1", 0 ]
                                                                }
                                                            },
                                                            {
                                                                "patchline": {
                                                                    "destination": [ "obj-1", 0 ],
                                                                    "source": [ "obj-2", 0 ]
                                                                }
                                                            },
                                                            {
                                                                "patchline": {
                                                                    "destination": [ "obj-4", 0 ],
                                                                    "source": [ "obj-3", 1 ]
                                                                }
                                                            },
                                                            {
                                                                "patchline": {
                                                                    "destination": [ "obj-4", 0 ],
                                                                    "source": [ "obj-3", 0 ]
                                                                }
                                                            },
                                                            {
                                                                "patchline": {
                                                                    "destination": [ "obj-5", 0 ],
                                                                    "source": [ "obj-4", 0 ]
                                                                }
                                                            },
                                                            {
                                                                "patchline": {
                                                                    "destination": [ "obj-6", 0 ],
                                                                    "source": [ "obj-5", 0 ]
                                                                }
                                                            },
                                                            {
                                                                "patchline": {
                                                                    "destination": [ "obj-1", 1 ],
                                                                    "order": 0,
                                                                    "source": [ "obj-7", 0 ]
                                                                }
                                                            },
                                                            {
                                                                "patchline": {
                                                                    "destination": [ "obj-9", 0 ],
                                                                    "order": 1,
                                                                    "source": [ "obj-7", 0 ]
                                                                }
                                                            },
                                                            {
                                                                "patchline": {
                                                                    "destination": [ "obj-3", 0 ],
                                                                    "source": [ "obj-9", 1 ]
                                                                }
                                                            }
                                                        ]
                                                    },
                                                    "patching_rect": [ 568.5, 359.0, 71.0, 22.0 ],
                                                    "text": "p retain-dict",
                                                    "varname": "maxmcpid-236"
                                                }
                                            },
                                            {
                                                "box": {
                                                    "id": "obj-4",
                                                    "maxclass": "newobj",
                                                    "numinlets": 2,
                                                    "numoutlets": 1,
                                                    "outlettype": [ "" ],
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
                                                        "rect": [ 963.0, 462.0, 640.0, 480.0 ],
                                                        "boxes": [
                                                            {
                                                                "box": {
                                                                    "id": "obj-9",
                                                                    "maxclass": "newobj",
                                                                    "numinlets": 2,
                                                                    "numoutlets": 2,
                                                                    "outlettype": [ "", "" ],
                                                                    "patching_rect": [ 98.0, 122.0, 55.0, 22.0 ],
                                                                    "text": "zl.slice 1",
                                                                    "varname": "maxmcpid-235"
                                                                }
                                                            },
                                                            {
                                                                "box": {
                                                                    "comment": "",
                                                                    "id": "obj-8",
                                                                    "index": 1,
                                                                    "maxclass": "outlet",
                                                                    "numinlets": 1,
                                                                    "numoutlets": 0,
                                                                    "patching_rect": [ 243.0, 335.0, 30.0, 30.0 ],
                                                                    "varname": "maxmcpid-234"
                                                                }
                                                            },
                                                            {
                                                                "box": {
                                                                    "comment": "",
                                                                    "id": "obj-2",
                                                                    "index": 2,
                                                                    "maxclass": "inlet",
                                                                    "numinlets": 0,
                                                                    "numoutlets": 1,
                                                                    "outlettype": [ "" ],
                                                                    "patching_rect": [ 243.0, 48.0, 30.0, 30.0 ],
                                                                    "varname": "maxmcpid-233"
                                                                }
                                                            },
                                                            {
                                                                "box": {
                                                                    "id": "obj-1",
                                                                    "maxclass": "newobj",
                                                                    "numinlets": 2,
                                                                    "numoutlets": 2,
                                                                    "outlettype": [ "", "" ],
                                                                    "patching_rect": [ 243.0, 162.0, 38.0, 22.0 ],
                                                                    "text": "zl.reg",
                                                                    "varname": "maxmcpid-232"
                                                                }
                                                            },
                                                            {
                                                                "box": {
                                                                    "id": "obj-6",
                                                                    "maxclass": "newobj",
                                                                    "numinlets": 2,
                                                                    "numoutlets": 5,
                                                                    "outlettype": [ "dictionary", "", "", "", "" ],
                                                                    "patching_rect": [ 98.0, 273.0, 50.5, 22.0 ],
                                                                    "saved_object_attributes": {
                                                                        "legacy": 1,
                                                                        "parameter_enable": 0,
                                                                        "parameter_mappable": 0
                                                                    },
                                                                    "text": "dict",
                                                                    "varname": "maxmcpid-231"
                                                                }
                                                            },
                                                            {
                                                                "box": {
                                                                    "id": "obj-5",
                                                                    "maxclass": "newobj",
                                                                    "numinlets": 1,
                                                                    "numoutlets": 1,
                                                                    "outlettype": [ "" ],
                                                                    "patching_rect": [ 98.0, 234.0, 86.0, 22.0 ],
                                                                    "text": "prepend name",
                                                                    "varname": "maxmcpid-230"
                                                                }
                                                            },
                                                            {
                                                                "box": {
                                                                    "id": "obj-4",
                                                                    "maxclass": "newobj",
                                                                    "numinlets": 2,
                                                                    "numoutlets": 2,
                                                                    "outlettype": [ "", "" ],
                                                                    "patching_rect": [ 98.0, 200.0, 91.0, 22.0 ],
                                                                    "text": "route dictionary",
                                                                    "varname": "maxmcpid-229"
                                                                }
                                                            },
                                                            {
                                                                "box": {
                                                                    "id": "obj-3",
                                                                    "maxclass": "newobj",
                                                                    "numinlets": 3,
                                                                    "numoutlets": 3,
                                                                    "outlettype": [ "", "", "" ],
                                                                    "patching_rect": [ 98.0, 162.0, 111.0, 22.0 ],
                                                                    "text": "route success error",
                                                                    "varname": "maxmcpid-228"
                                                                }
                                                            },
                                                            {
                                                                "box": {
                                                                    "comment": "",
                                                                    "id": "obj-7",
                                                                    "index": 1,
                                                                    "maxclass": "inlet",
                                                                    "numinlets": 0,
                                                                    "numoutlets": 1,
                                                                    "outlettype": [ "" ],
                                                                    "patching_rect": [ 98.0, 48.0, 30.0, 30.0 ],
                                                                    "varname": "maxmcpid-227"
                                                                }
                                                            }
                                                        ],
                                                        "lines": [
                                                            {
                                                                "patchline": {
                                                                    "destination": [ "obj-8", 0 ],
                                                                    "source": [ "obj-1", 0 ]
                                                                }
                                                            },
                                                            {
                                                                "patchline": {
                                                                    "destination": [ "obj-1", 0 ],
                                                                    "source": [ "obj-2", 0 ]
                                                                }
                                                            },
                                                            {
                                                                "patchline": {
                                                                    "destination": [ "obj-4", 0 ],
                                                                    "source": [ "obj-3", 1 ]
                                                                }
                                                            },
                                                            {
                                                                "patchline": {
                                                                    "destination": [ "obj-4", 0 ],
                                                                    "source": [ "obj-3", 0 ]
                                                                }
                                                            },
                                                            {
                                                                "patchline": {
                                                                    "destination": [ "obj-5", 0 ],
                                                                    "source": [ "obj-4", 0 ]
                                                                }
                                                            },
                                                            {
                                                                "patchline": {
                                                                    "destination": [ "obj-6", 0 ],
                                                                    "source": [ "obj-5", 0 ]
                                                                }
                                                            },
                                                            {
                                                                "patchline": {
                                                                    "destination": [ "obj-1", 1 ],
                                                                    "order": 0,
                                                                    "source": [ "obj-7", 0 ]
                                                                }
                                                            },
                                                            {
                                                                "patchline": {
                                                                    "destination": [ "obj-9", 0 ],
                                                                    "order": 1,
                                                                    "source": [ "obj-7", 0 ]
                                                                }
                                                            },
                                                            {
                                                                "patchline": {
                                                                    "destination": [ "obj-3", 0 ],
                                                                    "source": [ "obj-9", 1 ]
                                                                }
                                                            }
                                                        ]
                                                    },
                                                    "patching_rect": [ 489.5, 359.0, 71.0, 22.0 ],
                                                    "text": "p retain-dict",
                                                    "varname": "maxmcpid-226"
                                                }
                                            },
                                            {
                                                "box": {
                                                    "id": "obj-3",
                                                    "maxclass": "newobj",
                                                    "numinlets": 2,
                                                    "numoutlets": 1,
                                                    "outlettype": [ "" ],
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
                                                        "rect": [ 963.0, 462.0, 640.0, 480.0 ],
                                                        "boxes": [
                                                            {
                                                                "box": {
                                                                    "id": "obj-9",
                                                                    "maxclass": "newobj",
                                                                    "numinlets": 2,
                                                                    "numoutlets": 2,
                                                                    "outlettype": [ "", "" ],
                                                                    "patching_rect": [ 98.0, 122.0, 55.0, 22.0 ],
                                                                    "text": "zl.slice 1",
                                                                    "varname": "maxmcpid-225"
                                                                }
                                                            },
                                                            {
                                                                "box": {
                                                                    "comment": "",
                                                                    "id": "obj-8",
                                                                    "index": 1,
                                                                    "maxclass": "outlet",
                                                                    "numinlets": 1,
                                                                    "numoutlets": 0,
                                                                    "patching_rect": [ 243.0, 335.0, 30.0, 30.0 ],
                                                                    "varname": "maxmcpid-224"
                                                                }
                                                            },
                                                            {
                                                                "box": {
                                                                    "comment": "",
                                                                    "id": "obj-2",
                                                                    "index": 2,
                                                                    "maxclass": "inlet",
                                                                    "numinlets": 0,
                                                                    "numoutlets": 1,
                                                                    "outlettype": [ "" ],
                                                                    "patching_rect": [ 243.0, 48.0, 30.0, 30.0 ],
                                                                    "varname": "maxmcpid-223"
                                                                }
                                                            },
                                                            {
                                                                "box": {
                                                                    "id": "obj-1",
                                                                    "maxclass": "newobj",
                                                                    "numinlets": 2,
                                                                    "numoutlets": 2,
                                                                    "outlettype": [ "", "" ],
                                                                    "patching_rect": [ 243.0, 162.0, 38.0, 22.0 ],
                                                                    "text": "zl.reg",
                                                                    "varname": "maxmcpid-222"
                                                                }
                                                            },
                                                            {
                                                                "box": {
                                                                    "id": "obj-6",
                                                                    "maxclass": "newobj",
                                                                    "numinlets": 2,
                                                                    "numoutlets": 5,
                                                                    "outlettype": [ "dictionary", "", "", "", "" ],
                                                                    "patching_rect": [ 98.0, 273.0, 50.5, 22.0 ],
                                                                    "saved_object_attributes": {
                                                                        "legacy": 1,
                                                                        "parameter_enable": 0,
                                                                        "parameter_mappable": 0
                                                                    },
                                                                    "text": "dict",
                                                                    "varname": "maxmcpid-221"
                                                                }
                                                            },
                                                            {
                                                                "box": {
                                                                    "id": "obj-5",
                                                                    "maxclass": "newobj",
                                                                    "numinlets": 1,
                                                                    "numoutlets": 1,
                                                                    "outlettype": [ "" ],
                                                                    "patching_rect": [ 98.0, 234.0, 86.0, 22.0 ],
                                                                    "text": "prepend name",
                                                                    "varname": "maxmcpid-220"
                                                                }
                                                            },
                                                            {
                                                                "box": {
                                                                    "id": "obj-4",
                                                                    "maxclass": "newobj",
                                                                    "numinlets": 2,
                                                                    "numoutlets": 2,
                                                                    "outlettype": [ "", "" ],
                                                                    "patching_rect": [ 98.0, 200.0, 91.0, 22.0 ],
                                                                    "text": "route dictionary",
                                                                    "varname": "maxmcpid-219"
                                                                }
                                                            },
                                                            {
                                                                "box": {
                                                                    "id": "obj-3",
                                                                    "maxclass": "newobj",
                                                                    "numinlets": 3,
                                                                    "numoutlets": 3,
                                                                    "outlettype": [ "", "", "" ],
                                                                    "patching_rect": [ 98.0, 162.0, 111.0, 22.0 ],
                                                                    "text": "route success error",
                                                                    "varname": "maxmcpid-218"
                                                                }
                                                            },
                                                            {
                                                                "box": {
                                                                    "comment": "",
                                                                    "id": "obj-7",
                                                                    "index": 1,
                                                                    "maxclass": "inlet",
                                                                    "numinlets": 0,
                                                                    "numoutlets": 1,
                                                                    "outlettype": [ "" ],
                                                                    "patching_rect": [ 98.0, 48.0, 30.0, 30.0 ],
                                                                    "varname": "maxmcpid-217"
                                                                }
                                                            }
                                                        ],
                                                        "lines": [
                                                            {
                                                                "patchline": {
                                                                    "destination": [ "obj-8", 0 ],
                                                                    "source": [ "obj-1", 0 ]
                                                                }
                                                            },
                                                            {
                                                                "patchline": {
                                                                    "destination": [ "obj-1", 0 ],
                                                                    "source": [ "obj-2", 0 ]
                                                                }
                                                            },
                                                            {
                                                                "patchline": {
                                                                    "destination": [ "obj-4", 0 ],
                                                                    "source": [ "obj-3", 1 ]
                                                                }
                                                            },
                                                            {
                                                                "patchline": {
                                                                    "destination": [ "obj-4", 0 ],
                                                                    "source": [ "obj-3", 0 ]
                                                                }
                                                            },
                                                            {
                                                                "patchline": {
                                                                    "destination": [ "obj-5", 0 ],
                                                                    "source": [ "obj-4", 0 ]
                                                                }
                                                            },
                                                            {
                                                                "patchline": {
                                                                    "destination": [ "obj-6", 0 ],
                                                                    "source": [ "obj-5", 0 ]
                                                                }
                                                            },
                                                            {
                                                                "patchline": {
                                                                    "destination": [ "obj-1", 1 ],
                                                                    "order": 0,
                                                                    "source": [ "obj-7", 0 ]
                                                                }
                                                            },
                                                            {
                                                                "patchline": {
                                                                    "destination": [ "obj-9", 0 ],
                                                                    "order": 1,
                                                                    "source": [ "obj-7", 0 ]
                                                                }
                                                            },
                                                            {
                                                                "patchline": {
                                                                    "destination": [ "obj-3", 0 ],
                                                                    "source": [ "obj-9", 1 ]
                                                                }
                                                            }
                                                        ]
                                                    },
                                                    "patching_rect": [ 412.5, 359.0, 71.0, 22.0 ],
                                                    "text": "p retain-dict",
                                                    "varname": "maxmcpid-216"
                                                }
                                            },
                                            {
                                                "box": {
                                                    "id": "obj-13",
                                                    "linecount": 3,
                                                    "maxclass": "comment",
                                                    "numinlets": 1,
                                                    "numoutlets": 0,
                                                    "patching_rect": [ 149.0, 21.0, 151.0, 47.0 ],
                                                    "text": "Threading and dicts go together like peanut butter and tomatoes",
                                                    "varname": "maxmcpid-215"
                                                }
                                            },
                                            {
                                                "box": {
                                                    "id": "obj-11",
                                                    "maxclass": "newobj",
                                                    "numinlets": 2,
                                                    "numoutlets": 1,
                                                    "outlettype": [ "" ],
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
                                                        "rect": [ 963.0, 462.0, 640.0, 480.0 ],
                                                        "boxes": [
                                                            {
                                                                "box": {
                                                                    "id": "obj-9",
                                                                    "maxclass": "newobj",
                                                                    "numinlets": 2,
                                                                    "numoutlets": 2,
                                                                    "outlettype": [ "", "" ],
                                                                    "patching_rect": [ 98.0, 122.0, 55.0, 22.0 ],
                                                                    "text": "zl.slice 1",
                                                                    "varname": "maxmcpid-214"
                                                                }
                                                            },
                                                            {
                                                                "box": {
                                                                    "comment": "",
                                                                    "id": "obj-8",
                                                                    "index": 1,
                                                                    "maxclass": "outlet",
                                                                    "numinlets": 1,
                                                                    "numoutlets": 0,
                                                                    "patching_rect": [ 243.0, 335.0, 30.0, 30.0 ],
                                                                    "varname": "maxmcpid-213"
                                                                }
                                                            },
                                                            {
                                                                "box": {
                                                                    "comment": "",
                                                                    "id": "obj-2",
                                                                    "index": 2,
                                                                    "maxclass": "inlet",
                                                                    "numinlets": 0,
                                                                    "numoutlets": 1,
                                                                    "outlettype": [ "" ],
                                                                    "patching_rect": [ 243.0, 48.0, 30.0, 30.0 ],
                                                                    "varname": "maxmcpid-212"
                                                                }
                                                            },
                                                            {
                                                                "box": {
                                                                    "id": "obj-1",
                                                                    "maxclass": "newobj",
                                                                    "numinlets": 2,
                                                                    "numoutlets": 2,
                                                                    "outlettype": [ "", "" ],
                                                                    "patching_rect": [ 243.0, 162.0, 38.0, 22.0 ],
                                                                    "text": "zl.reg",
                                                                    "varname": "maxmcpid-211"
                                                                }
                                                            },
                                                            {
                                                                "box": {
                                                                    "id": "obj-6",
                                                                    "maxclass": "newobj",
                                                                    "numinlets": 2,
                                                                    "numoutlets": 5,
                                                                    "outlettype": [ "dictionary", "", "", "", "" ],
                                                                    "patching_rect": [ 98.0, 273.0, 50.5, 22.0 ],
                                                                    "saved_object_attributes": {
                                                                        "legacy": 1,
                                                                        "parameter_enable": 0,
                                                                        "parameter_mappable": 0
                                                                    },
                                                                    "text": "dict",
                                                                    "varname": "maxmcpid-210"
                                                                }
                                                            },
                                                            {
                                                                "box": {
                                                                    "id": "obj-5",
                                                                    "maxclass": "newobj",
                                                                    "numinlets": 1,
                                                                    "numoutlets": 1,
                                                                    "outlettype": [ "" ],
                                                                    "patching_rect": [ 98.0, 234.0, 86.0, 22.0 ],
                                                                    "text": "prepend name",
                                                                    "varname": "maxmcpid-209"
                                                                }
                                                            },
                                                            {
                                                                "box": {
                                                                    "id": "obj-4",
                                                                    "maxclass": "newobj",
                                                                    "numinlets": 2,
                                                                    "numoutlets": 2,
                                                                    "outlettype": [ "", "" ],
                                                                    "patching_rect": [ 98.0, 200.0, 91.0, 22.0 ],
                                                                    "text": "route dictionary",
                                                                    "varname": "maxmcpid-208"
                                                                }
                                                            },
                                                            {
                                                                "box": {
                                                                    "id": "obj-3",
                                                                    "maxclass": "newobj",
                                                                    "numinlets": 3,
                                                                    "numoutlets": 3,
                                                                    "outlettype": [ "", "", "" ],
                                                                    "patching_rect": [ 98.0, 162.0, 111.0, 22.0 ],
                                                                    "text": "route success error",
                                                                    "varname": "maxmcpid-207"
                                                                }
                                                            },
                                                            {
                                                                "box": {
                                                                    "comment": "",
                                                                    "id": "obj-7",
                                                                    "index": 1,
                                                                    "maxclass": "inlet",
                                                                    "numinlets": 0,
                                                                    "numoutlets": 1,
                                                                    "outlettype": [ "" ],
                                                                    "patching_rect": [ 98.0, 48.0, 30.0, 30.0 ],
                                                                    "varname": "maxmcpid-206"
                                                                }
                                                            }
                                                        ],
                                                        "lines": [
                                                            {
                                                                "patchline": {
                                                                    "destination": [ "obj-8", 0 ],
                                                                    "source": [ "obj-1", 0 ]
                                                                }
                                                            },
                                                            {
                                                                "patchline": {
                                                                    "destination": [ "obj-1", 0 ],
                                                                    "source": [ "obj-2", 0 ]
                                                                }
                                                            },
                                                            {
                                                                "patchline": {
                                                                    "destination": [ "obj-4", 0 ],
                                                                    "source": [ "obj-3", 1 ]
                                                                }
                                                            },
                                                            {
                                                                "patchline": {
                                                                    "destination": [ "obj-4", 0 ],
                                                                    "source": [ "obj-3", 0 ]
                                                                }
                                                            },
                                                            {
                                                                "patchline": {
                                                                    "destination": [ "obj-5", 0 ],
                                                                    "source": [ "obj-4", 0 ]
                                                                }
                                                            },
                                                            {
                                                                "patchline": {
                                                                    "destination": [ "obj-6", 0 ],
                                                                    "source": [ "obj-5", 0 ]
                                                                }
                                                            },
                                                            {
                                                                "patchline": {
                                                                    "destination": [ "obj-1", 1 ],
                                                                    "order": 0,
                                                                    "source": [ "obj-7", 0 ]
                                                                }
                                                            },
                                                            {
                                                                "patchline": {
                                                                    "destination": [ "obj-9", 0 ],
                                                                    "order": 1,
                                                                    "source": [ "obj-7", 0 ]
                                                                }
                                                            },
                                                            {
                                                                "patchline": {
                                                                    "destination": [ "obj-3", 0 ],
                                                                    "source": [ "obj-9", 1 ]
                                                                }
                                                            }
                                                        ]
                                                    },
                                                    "patching_rect": [ 335.5, 359.0, 71.0, 22.0 ],
                                                    "text": "p retain-dict",
                                                    "varname": "maxmcpid-205"
                                                }
                                            },
                                            {
                                                "box": {
                                                    "id": "obj-10",
                                                    "maxclass": "newobj",
                                                    "numinlets": 2,
                                                    "numoutlets": 1,
                                                    "outlettype": [ "" ],
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
                                                        "rect": [ 963.0, 462.0, 640.0, 480.0 ],
                                                        "boxes": [
                                                            {
                                                                "box": {
                                                                    "id": "obj-9",
                                                                    "maxclass": "newobj",
                                                                    "numinlets": 2,
                                                                    "numoutlets": 2,
                                                                    "outlettype": [ "", "" ],
                                                                    "patching_rect": [ 98.0, 122.0, 55.0, 22.0 ],
                                                                    "text": "zl.slice 1",
                                                                    "varname": "maxmcpid-204"
                                                                }
                                                            },
                                                            {
                                                                "box": {
                                                                    "comment": "",
                                                                    "id": "obj-8",
                                                                    "index": 1,
                                                                    "maxclass": "outlet",
                                                                    "numinlets": 1,
                                                                    "numoutlets": 0,
                                                                    "patching_rect": [ 243.0, 335.0, 30.0, 30.0 ],
                                                                    "varname": "maxmcpid-203"
                                                                }
                                                            },
                                                            {
                                                                "box": {
                                                                    "comment": "",
                                                                    "id": "obj-2",
                                                                    "index": 2,
                                                                    "maxclass": "inlet",
                                                                    "numinlets": 0,
                                                                    "numoutlets": 1,
                                                                    "outlettype": [ "" ],
                                                                    "patching_rect": [ 243.0, 48.0, 30.0, 30.0 ],
                                                                    "varname": "maxmcpid-202"
                                                                }
                                                            },
                                                            {
                                                                "box": {
                                                                    "id": "obj-1",
                                                                    "maxclass": "newobj",
                                                                    "numinlets": 2,
                                                                    "numoutlets": 2,
                                                                    "outlettype": [ "", "" ],
                                                                    "patching_rect": [ 243.0, 162.0, 38.0, 22.0 ],
                                                                    "text": "zl.reg",
                                                                    "varname": "maxmcpid-201"
                                                                }
                                                            },
                                                            {
                                                                "box": {
                                                                    "id": "obj-6",
                                                                    "maxclass": "newobj",
                                                                    "numinlets": 2,
                                                                    "numoutlets": 5,
                                                                    "outlettype": [ "dictionary", "", "", "", "" ],
                                                                    "patching_rect": [ 98.0, 273.0, 50.5, 22.0 ],
                                                                    "saved_object_attributes": {
                                                                        "legacy": 1,
                                                                        "parameter_enable": 0,
                                                                        "parameter_mappable": 0
                                                                    },
                                                                    "text": "dict",
                                                                    "varname": "maxmcpid-200"
                                                                }
                                                            },
                                                            {
                                                                "box": {
                                                                    "id": "obj-5",
                                                                    "maxclass": "newobj",
                                                                    "numinlets": 1,
                                                                    "numoutlets": 1,
                                                                    "outlettype": [ "" ],
                                                                    "patching_rect": [ 98.0, 234.0, 86.0, 22.0 ],
                                                                    "text": "prepend name",
                                                                    "varname": "maxmcpid-199"
                                                                }
                                                            },
                                                            {
                                                                "box": {
                                                                    "id": "obj-4",
                                                                    "maxclass": "newobj",
                                                                    "numinlets": 2,
                                                                    "numoutlets": 2,
                                                                    "outlettype": [ "", "" ],
                                                                    "patching_rect": [ 98.0, 200.0, 91.0, 22.0 ],
                                                                    "text": "route dictionary",
                                                                    "varname": "maxmcpid-198"
                                                                }
                                                            },
                                                            {
                                                                "box": {
                                                                    "id": "obj-3",
                                                                    "maxclass": "newobj",
                                                                    "numinlets": 3,
                                                                    "numoutlets": 3,
                                                                    "outlettype": [ "", "", "" ],
                                                                    "patching_rect": [ 98.0, 162.0, 111.0, 22.0 ],
                                                                    "text": "route success error",
                                                                    "varname": "maxmcpid-197"
                                                                }
                                                            },
                                                            {
                                                                "box": {
                                                                    "comment": "",
                                                                    "id": "obj-7",
                                                                    "index": 1,
                                                                    "maxclass": "inlet",
                                                                    "numinlets": 0,
                                                                    "numoutlets": 1,
                                                                    "outlettype": [ "" ],
                                                                    "patching_rect": [ 98.0, 48.0, 30.0, 30.0 ],
                                                                    "varname": "maxmcpid-196"
                                                                }
                                                            }
                                                        ],
                                                        "lines": [
                                                            {
                                                                "patchline": {
                                                                    "destination": [ "obj-8", 0 ],
                                                                    "source": [ "obj-1", 0 ]
                                                                }
                                                            },
                                                            {
                                                                "patchline": {
                                                                    "destination": [ "obj-1", 0 ],
                                                                    "source": [ "obj-2", 0 ]
                                                                }
                                                            },
                                                            {
                                                                "patchline": {
                                                                    "destination": [ "obj-4", 0 ],
                                                                    "source": [ "obj-3", 1 ]
                                                                }
                                                            },
                                                            {
                                                                "patchline": {
                                                                    "destination": [ "obj-4", 0 ],
                                                                    "source": [ "obj-3", 0 ]
                                                                }
                                                            },
                                                            {
                                                                "patchline": {
                                                                    "destination": [ "obj-5", 0 ],
                                                                    "source": [ "obj-4", 0 ]
                                                                }
                                                            },
                                                            {
                                                                "patchline": {
                                                                    "destination": [ "obj-6", 0 ],
                                                                    "source": [ "obj-5", 0 ]
                                                                }
                                                            },
                                                            {
                                                                "patchline": {
                                                                    "destination": [ "obj-1", 1 ],
                                                                    "order": 0,
                                                                    "source": [ "obj-7", 0 ]
                                                                }
                                                            },
                                                            {
                                                                "patchline": {
                                                                    "destination": [ "obj-9", 0 ],
                                                                    "order": 1,
                                                                    "source": [ "obj-7", 0 ]
                                                                }
                                                            },
                                                            {
                                                                "patchline": {
                                                                    "destination": [ "obj-3", 0 ],
                                                                    "source": [ "obj-9", 1 ]
                                                                }
                                                            }
                                                        ]
                                                    },
                                                    "patching_rect": [ 260.5, 359.0, 71.0, 22.0 ],
                                                    "text": "p retain-dict",
                                                    "varname": "maxmcpid-195"
                                                }
                                            },
                                            {
                                                "box": {
                                                    "id": "obj-9",
                                                    "maxclass": "newobj",
                                                    "numinlets": 2,
                                                    "numoutlets": 1,
                                                    "outlettype": [ "" ],
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
                                                        "rect": [ 963.0, 462.0, 640.0, 480.0 ],
                                                        "boxes": [
                                                            {
                                                                "box": {
                                                                    "id": "obj-9",
                                                                    "maxclass": "newobj",
                                                                    "numinlets": 2,
                                                                    "numoutlets": 2,
                                                                    "outlettype": [ "", "" ],
                                                                    "patching_rect": [ 98.0, 122.0, 55.0, 22.0 ],
                                                                    "text": "zl.slice 1",
                                                                    "varname": "maxmcpid-194"
                                                                }
                                                            },
                                                            {
                                                                "box": {
                                                                    "comment": "",
                                                                    "id": "obj-8",
                                                                    "index": 1,
                                                                    "maxclass": "outlet",
                                                                    "numinlets": 1,
                                                                    "numoutlets": 0,
                                                                    "patching_rect": [ 243.0, 335.0, 30.0, 30.0 ],
                                                                    "varname": "maxmcpid-193"
                                                                }
                                                            },
                                                            {
                                                                "box": {
                                                                    "comment": "",
                                                                    "id": "obj-2",
                                                                    "index": 2,
                                                                    "maxclass": "inlet",
                                                                    "numinlets": 0,
                                                                    "numoutlets": 1,
                                                                    "outlettype": [ "" ],
                                                                    "patching_rect": [ 243.0, 48.0, 30.0, 30.0 ],
                                                                    "varname": "maxmcpid-192"
                                                                }
                                                            },
                                                            {
                                                                "box": {
                                                                    "id": "obj-1",
                                                                    "maxclass": "newobj",
                                                                    "numinlets": 2,
                                                                    "numoutlets": 2,
                                                                    "outlettype": [ "", "" ],
                                                                    "patching_rect": [ 243.0, 162.0, 38.0, 22.0 ],
                                                                    "text": "zl.reg",
                                                                    "varname": "maxmcpid-191"
                                                                }
                                                            },
                                                            {
                                                                "box": {
                                                                    "id": "obj-6",
                                                                    "maxclass": "newobj",
                                                                    "numinlets": 2,
                                                                    "numoutlets": 5,
                                                                    "outlettype": [ "dictionary", "", "", "", "" ],
                                                                    "patching_rect": [ 98.0, 273.0, 50.5, 22.0 ],
                                                                    "saved_object_attributes": {
                                                                        "legacy": 1,
                                                                        "parameter_enable": 0,
                                                                        "parameter_mappable": 0
                                                                    },
                                                                    "text": "dict",
                                                                    "varname": "maxmcpid-190"
                                                                }
                                                            },
                                                            {
                                                                "box": {
                                                                    "id": "obj-5",
                                                                    "maxclass": "newobj",
                                                                    "numinlets": 1,
                                                                    "numoutlets": 1,
                                                                    "outlettype": [ "" ],
                                                                    "patching_rect": [ 98.0, 234.0, 86.0, 22.0 ],
                                                                    "text": "prepend name",
                                                                    "varname": "maxmcpid-189"
                                                                }
                                                            },
                                                            {
                                                                "box": {
                                                                    "id": "obj-4",
                                                                    "maxclass": "newobj",
                                                                    "numinlets": 2,
                                                                    "numoutlets": 2,
                                                                    "outlettype": [ "", "" ],
                                                                    "patching_rect": [ 98.0, 200.0, 91.0, 22.0 ],
                                                                    "text": "route dictionary",
                                                                    "varname": "maxmcpid-188"
                                                                }
                                                            },
                                                            {
                                                                "box": {
                                                                    "id": "obj-3",
                                                                    "maxclass": "newobj",
                                                                    "numinlets": 3,
                                                                    "numoutlets": 3,
                                                                    "outlettype": [ "", "", "" ],
                                                                    "patching_rect": [ 98.0, 162.0, 111.0, 22.0 ],
                                                                    "text": "route success error",
                                                                    "varname": "maxmcpid-187"
                                                                }
                                                            },
                                                            {
                                                                "box": {
                                                                    "comment": "",
                                                                    "id": "obj-7",
                                                                    "index": 1,
                                                                    "maxclass": "inlet",
                                                                    "numinlets": 0,
                                                                    "numoutlets": 1,
                                                                    "outlettype": [ "" ],
                                                                    "patching_rect": [ 98.0, 48.0, 30.0, 30.0 ],
                                                                    "varname": "maxmcpid-186"
                                                                }
                                                            }
                                                        ],
                                                        "lines": [
                                                            {
                                                                "patchline": {
                                                                    "destination": [ "obj-8", 0 ],
                                                                    "source": [ "obj-1", 0 ]
                                                                }
                                                            },
                                                            {
                                                                "patchline": {
                                                                    "destination": [ "obj-1", 0 ],
                                                                    "source": [ "obj-2", 0 ]
                                                                }
                                                            },
                                                            {
                                                                "patchline": {
                                                                    "destination": [ "obj-4", 0 ],
                                                                    "source": [ "obj-3", 1 ]
                                                                }
                                                            },
                                                            {
                                                                "patchline": {
                                                                    "destination": [ "obj-4", 0 ],
                                                                    "source": [ "obj-3", 0 ]
                                                                }
                                                            },
                                                            {
                                                                "patchline": {
                                                                    "destination": [ "obj-5", 0 ],
                                                                    "source": [ "obj-4", 0 ]
                                                                }
                                                            },
                                                            {
                                                                "patchline": {
                                                                    "destination": [ "obj-6", 0 ],
                                                                    "source": [ "obj-5", 0 ]
                                                                }
                                                            },
                                                            {
                                                                "patchline": {
                                                                    "destination": [ "obj-1", 1 ],
                                                                    "order": 0,
                                                                    "source": [ "obj-7", 0 ]
                                                                }
                                                            },
                                                            {
                                                                "patchline": {
                                                                    "destination": [ "obj-9", 0 ],
                                                                    "order": 1,
                                                                    "source": [ "obj-7", 0 ]
                                                                }
                                                            },
                                                            {
                                                                "patchline": {
                                                                    "destination": [ "obj-3", 0 ],
                                                                    "source": [ "obj-9", 1 ]
                                                                }
                                                            }
                                                        ]
                                                    },
                                                    "patching_rect": [ 185.5, 359.0, 71.0, 22.0 ],
                                                    "text": "p retain-dict",
                                                    "varname": "maxmcpid-185"
                                                }
                                            },
                                            {
                                                "box": {
                                                    "id": "obj-8",
                                                    "maxclass": "newobj",
                                                    "numinlets": 2,
                                                    "numoutlets": 1,
                                                    "outlettype": [ "" ],
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
                                                        "rect": [ 963.0, 462.0, 640.0, 480.0 ],
                                                        "boxes": [
                                                            {
                                                                "box": {
                                                                    "id": "obj-9",
                                                                    "maxclass": "newobj",
                                                                    "numinlets": 2,
                                                                    "numoutlets": 2,
                                                                    "outlettype": [ "", "" ],
                                                                    "patching_rect": [ 98.0, 122.0, 55.0, 22.0 ],
                                                                    "text": "zl.slice 1",
                                                                    "varname": "maxmcpid-184"
                                                                }
                                                            },
                                                            {
                                                                "box": {
                                                                    "comment": "",
                                                                    "id": "obj-8",
                                                                    "index": 1,
                                                                    "maxclass": "outlet",
                                                                    "numinlets": 1,
                                                                    "numoutlets": 0,
                                                                    "patching_rect": [ 243.0, 335.0, 30.0, 30.0 ],
                                                                    "varname": "maxmcpid-183"
                                                                }
                                                            },
                                                            {
                                                                "box": {
                                                                    "comment": "",
                                                                    "id": "obj-2",
                                                                    "index": 2,
                                                                    "maxclass": "inlet",
                                                                    "numinlets": 0,
                                                                    "numoutlets": 1,
                                                                    "outlettype": [ "" ],
                                                                    "patching_rect": [ 243.0, 48.0, 30.0, 30.0 ],
                                                                    "varname": "maxmcpid-182"
                                                                }
                                                            },
                                                            {
                                                                "box": {
                                                                    "id": "obj-1",
                                                                    "maxclass": "newobj",
                                                                    "numinlets": 2,
                                                                    "numoutlets": 2,
                                                                    "outlettype": [ "", "" ],
                                                                    "patching_rect": [ 243.0, 162.0, 38.0, 22.0 ],
                                                                    "text": "zl.reg",
                                                                    "varname": "maxmcpid-181"
                                                                }
                                                            },
                                                            {
                                                                "box": {
                                                                    "id": "obj-6",
                                                                    "maxclass": "newobj",
                                                                    "numinlets": 2,
                                                                    "numoutlets": 5,
                                                                    "outlettype": [ "dictionary", "", "", "", "" ],
                                                                    "patching_rect": [ 98.0, 273.0, 50.5, 22.0 ],
                                                                    "saved_object_attributes": {
                                                                        "legacy": 1,
                                                                        "parameter_enable": 0,
                                                                        "parameter_mappable": 0
                                                                    },
                                                                    "text": "dict",
                                                                    "varname": "maxmcpid-180"
                                                                }
                                                            },
                                                            {
                                                                "box": {
                                                                    "id": "obj-5",
                                                                    "maxclass": "newobj",
                                                                    "numinlets": 1,
                                                                    "numoutlets": 1,
                                                                    "outlettype": [ "" ],
                                                                    "patching_rect": [ 98.0, 234.0, 86.0, 22.0 ],
                                                                    "text": "prepend name",
                                                                    "varname": "maxmcpid-179"
                                                                }
                                                            },
                                                            {
                                                                "box": {
                                                                    "id": "obj-4",
                                                                    "maxclass": "newobj",
                                                                    "numinlets": 2,
                                                                    "numoutlets": 2,
                                                                    "outlettype": [ "", "" ],
                                                                    "patching_rect": [ 98.0, 200.0, 91.0, 22.0 ],
                                                                    "text": "route dictionary",
                                                                    "varname": "maxmcpid-178"
                                                                }
                                                            },
                                                            {
                                                                "box": {
                                                                    "id": "obj-3",
                                                                    "maxclass": "newobj",
                                                                    "numinlets": 3,
                                                                    "numoutlets": 3,
                                                                    "outlettype": [ "", "", "" ],
                                                                    "patching_rect": [ 98.0, 162.0, 111.0, 22.0 ],
                                                                    "text": "route success error",
                                                                    "varname": "maxmcpid-177"
                                                                }
                                                            },
                                                            {
                                                                "box": {
                                                                    "comment": "",
                                                                    "id": "obj-7",
                                                                    "index": 1,
                                                                    "maxclass": "inlet",
                                                                    "numinlets": 0,
                                                                    "numoutlets": 1,
                                                                    "outlettype": [ "" ],
                                                                    "patching_rect": [ 98.0, 48.0, 30.0, 30.0 ],
                                                                    "varname": "maxmcpid-176"
                                                                }
                                                            }
                                                        ],
                                                        "lines": [
                                                            {
                                                                "patchline": {
                                                                    "destination": [ "obj-8", 0 ],
                                                                    "source": [ "obj-1", 0 ]
                                                                }
                                                            },
                                                            {
                                                                "patchline": {
                                                                    "destination": [ "obj-1", 0 ],
                                                                    "source": [ "obj-2", 0 ]
                                                                }
                                                            },
                                                            {
                                                                "patchline": {
                                                                    "destination": [ "obj-4", 0 ],
                                                                    "source": [ "obj-3", 1 ]
                                                                }
                                                            },
                                                            {
                                                                "patchline": {
                                                                    "destination": [ "obj-4", 0 ],
                                                                    "source": [ "obj-3", 0 ]
                                                                }
                                                            },
                                                            {
                                                                "patchline": {
                                                                    "destination": [ "obj-5", 0 ],
                                                                    "source": [ "obj-4", 0 ]
                                                                }
                                                            },
                                                            {
                                                                "patchline": {
                                                                    "destination": [ "obj-6", 0 ],
                                                                    "source": [ "obj-5", 0 ]
                                                                }
                                                            },
                                                            {
                                                                "patchline": {
                                                                    "destination": [ "obj-1", 1 ],
                                                                    "order": 0,
                                                                    "source": [ "obj-7", 0 ]
                                                                }
                                                            },
                                                            {
                                                                "patchline": {
                                                                    "destination": [ "obj-9", 0 ],
                                                                    "order": 1,
                                                                    "source": [ "obj-7", 0 ]
                                                                }
                                                            },
                                                            {
                                                                "patchline": {
                                                                    "destination": [ "obj-3", 0 ],
                                                                    "source": [ "obj-9", 1 ]
                                                                }
                                                            }
                                                        ]
                                                    },
                                                    "patching_rect": [ 110.5, 359.0, 71.0, 22.0 ],
                                                    "text": "p retain-dict",
                                                    "varname": "maxmcpid-175"
                                                }
                                            },
                                            {
                                                "box": {
                                                    "comment": "",
                                                    "id": "obj-2",
                                                    "index": 1,
                                                    "maxclass": "inlet",
                                                    "numinlets": 0,
                                                    "numoutlets": 1,
                                                    "outlettype": [ "" ],
                                                    "patching_rect": [ 100.0, 21.0, 30.0, 30.0 ],
                                                    "varname": "maxmcpid-174"
                                                }
                                            },
                                            {
                                                "box": {
                                                    "id": "obj-1",
                                                    "maxclass": "newobj",
                                                    "numinlets": 10,
                                                    "numoutlets": 10,
                                                    "outlettype": [ "", "", "", "", "", "", "", "", "", "" ],
                                                    "patching_rect": [ 110.5, 144.0, 490.0, 22.0 ],
                                                    "text": "routepass restarted start stop terminated processStatus npm status manager debug_break",
                                                    "varname": "maxmcpid-173"
                                                }
                                            }
                                        ],
                                        "lines": [
                                            {
                                                "patchline": {
                                                    "destination": [ "obj-10", 0 ],
                                                    "order": 1,
                                                    "source": [ "obj-1", 2 ]
                                                }
                                            },
                                            {
                                                "patchline": {
                                                    "destination": [ "obj-11", 0 ],
                                                    "order": 1,
                                                    "source": [ "obj-1", 3 ]
                                                }
                                            },
                                            {
                                                "patchline": {
                                                    "destination": [ "obj-3", 0 ],
                                                    "order": 1,
                                                    "source": [ "obj-1", 4 ]
                                                }
                                            },
                                            {
                                                "patchline": {
                                                    "destination": [ "obj-39", 8 ],
                                                    "order": 0,
                                                    "source": [ "obj-1", 8 ]
                                                }
                                            },
                                            {
                                                "patchline": {
                                                    "destination": [ "obj-39", 7 ],
                                                    "order": 0,
                                                    "source": [ "obj-1", 7 ]
                                                }
                                            },
                                            {
                                                "patchline": {
                                                    "destination": [ "obj-39", 6 ],
                                                    "order": 0,
                                                    "source": [ "obj-1", 6 ]
                                                }
                                            },
                                            {
                                                "patchline": {
                                                    "destination": [ "obj-39", 5 ],
                                                    "order": 0,
                                                    "source": [ "obj-1", 5 ]
                                                }
                                            },
                                            {
                                                "patchline": {
                                                    "destination": [ "obj-39", 4 ],
                                                    "order": 0,
                                                    "source": [ "obj-1", 4 ]
                                                }
                                            },
                                            {
                                                "patchline": {
                                                    "destination": [ "obj-39", 3 ],
                                                    "order": 0,
                                                    "source": [ "obj-1", 3 ]
                                                }
                                            },
                                            {
                                                "patchline": {
                                                    "destination": [ "obj-39", 2 ],
                                                    "order": 0,
                                                    "source": [ "obj-1", 2 ]
                                                }
                                            },
                                            {
                                                "patchline": {
                                                    "destination": [ "obj-39", 1 ],
                                                    "order": 0,
                                                    "source": [ "obj-1", 1 ]
                                                }
                                            },
                                            {
                                                "patchline": {
                                                    "destination": [ "obj-39", 0 ],
                                                    "order": 0,
                                                    "source": [ "obj-1", 0 ]
                                                }
                                            },
                                            {
                                                "patchline": {
                                                    "destination": [ "obj-4", 0 ],
                                                    "order": 1,
                                                    "source": [ "obj-1", 5 ]
                                                }
                                            },
                                            {
                                                "patchline": {
                                                    "destination": [ "obj-5", 0 ],
                                                    "order": 1,
                                                    "source": [ "obj-1", 6 ]
                                                }
                                            },
                                            {
                                                "patchline": {
                                                    "destination": [ "obj-6", 0 ],
                                                    "order": 1,
                                                    "source": [ "obj-1", 7 ]
                                                }
                                            },
                                            {
                                                "patchline": {
                                                    "destination": [ "obj-7", 0 ],
                                                    "order": 1,
                                                    "source": [ "obj-1", 8 ]
                                                }
                                            },
                                            {
                                                "patchline": {
                                                    "destination": [ "obj-8", 0 ],
                                                    "order": 1,
                                                    "source": [ "obj-1", 0 ]
                                                }
                                            },
                                            {
                                                "patchline": {
                                                    "destination": [ "obj-9", 0 ],
                                                    "order": 1,
                                                    "source": [ "obj-1", 1 ]
                                                }
                                            },
                                            {
                                                "patchline": {
                                                    "destination": [ "obj-49", 0 ],
                                                    "source": [ "obj-10", 0 ]
                                                }
                                            },
                                            {
                                                "patchline": {
                                                    "destination": [ "obj-49", 0 ],
                                                    "source": [ "obj-11", 0 ]
                                                }
                                            },
                                            {
                                                "patchline": {
                                                    "destination": [ "obj-45", 0 ],
                                                    "source": [ "obj-12", 0 ]
                                                }
                                            },
                                            {
                                                "patchline": {
                                                    "destination": [ "obj-1", 0 ],
                                                    "source": [ "obj-2", 0 ]
                                                }
                                            },
                                            {
                                                "patchline": {
                                                    "destination": [ "obj-49", 0 ],
                                                    "source": [ "obj-3", 0 ]
                                                }
                                            },
                                            {
                                                "patchline": {
                                                    "destination": [ "obj-10", 1 ],
                                                    "source": [ "obj-39", 2 ]
                                                }
                                            },
                                            {
                                                "patchline": {
                                                    "destination": [ "obj-11", 1 ],
                                                    "source": [ "obj-39", 3 ]
                                                }
                                            },
                                            {
                                                "patchline": {
                                                    "destination": [ "obj-3", 1 ],
                                                    "source": [ "obj-39", 4 ]
                                                }
                                            },
                                            {
                                                "patchline": {
                                                    "destination": [ "obj-4", 1 ],
                                                    "source": [ "obj-39", 5 ]
                                                }
                                            },
                                            {
                                                "patchline": {
                                                    "destination": [ "obj-5", 1 ],
                                                    "source": [ "obj-39", 6 ]
                                                }
                                            },
                                            {
                                                "patchline": {
                                                    "destination": [ "obj-6", 1 ],
                                                    "source": [ "obj-39", 7 ]
                                                }
                                            },
                                            {
                                                "patchline": {
                                                    "destination": [ "obj-7", 1 ],
                                                    "source": [ "obj-39", 8 ]
                                                }
                                            },
                                            {
                                                "patchline": {
                                                    "destination": [ "obj-8", 1 ],
                                                    "source": [ "obj-39", 0 ]
                                                }
                                            },
                                            {
                                                "patchline": {
                                                    "destination": [ "obj-9", 1 ],
                                                    "source": [ "obj-39", 1 ]
                                                }
                                            },
                                            {
                                                "patchline": {
                                                    "destination": [ "obj-49", 0 ],
                                                    "source": [ "obj-4", 0 ]
                                                }
                                            },
                                            {
                                                "patchline": {
                                                    "destination": [ "obj-39", 9 ],
                                                    "source": [ "obj-45", 0 ]
                                                }
                                            },
                                            {
                                                "patchline": {
                                                    "destination": [ "obj-49", 0 ],
                                                    "source": [ "obj-5", 0 ]
                                                }
                                            },
                                            {
                                                "patchline": {
                                                    "destination": [ "obj-49", 0 ],
                                                    "source": [ "obj-6", 0 ]
                                                }
                                            },
                                            {
                                                "patchline": {
                                                    "destination": [ "obj-49", 0 ],
                                                    "source": [ "obj-7", 0 ]
                                                }
                                            },
                                            {
                                                "patchline": {
                                                    "destination": [ "obj-49", 0 ],
                                                    "source": [ "obj-8", 0 ]
                                                }
                                            },
                                            {
                                                "patchline": {
                                                    "destination": [ "obj-49", 0 ],
                                                    "source": [ "obj-9", 0 ]
                                                }
                                            }
                                        ]
                                    },
                                    "patching_rect": [ 330.0, 275.0, 113.0, 22.0 ],
                                    "text": "p retain-dictionaries",
                                    "varname": "maxmcpid-172"
                                }
                            },
                            {
                                "box": {
                                    "id": "obj-22",
                                    "maxclass": "newobj",
                                    "numinlets": 0,
                                    "numoutlets": 1,
                                    "outlettype": [ "" ],
                                    "patching_rect": [ 584.0, 321.0, 71.0, 22.0 ],
                                    "text": "r 1155-jweb",
                                    "varname": "maxmcpid-171"
                                }
                            },
                            {
                                "box": {
                                    "id": "obj-16",
                                    "maxclass": "newobj",
                                    "numinlets": 1,
                                    "numoutlets": 2,
                                    "outlettype": [ "", "" ],
                                    "patching_rect": [ 302.0, 238.0, 29.5, 22.0 ],
                                    "text": "t l l",
                                    "varname": "maxmcpid-170"
                                }
                            },
                            {
                                "box": {
                                    "id": "obj-31",
                                    "maxclass": "newobj",
                                    "numinlets": 1,
                                    "numoutlets": 1,
                                    "outlettype": [ "" ],
                                    "patching_rect": [ 376.0, 321.0, 198.0, 22.0 ],
                                    "text": "loadmess readfile n4m.monitor.html",
                                    "varname": "maxmcpid-169"
                                }
                            },
                            {
                                "box": {
                                    "id": "obj-35",
                                    "maxclass": "newobj",
                                    "numinlets": 2,
                                    "numoutlets": 2,
                                    "outlettype": [ "", "" ],
                                    "patching_rect": [ 298.0, 183.0, 79.0, 22.0 ],
                                    "text": "route running",
                                    "varname": "maxmcpid-168"
                                }
                            },
                            {
                                "box": {
                                    "id": "obj-45",
                                    "maxclass": "newobj",
                                    "numinlets": 2,
                                    "numoutlets": 2,
                                    "outlettype": [ "", "" ],
                                    "patching_rect": [ 50.0, 211.0, 60.0, 22.0 ],
                                    "text": "route port",
                                    "varname": "maxmcpid-167"
                                }
                            },
                            {
                                "box": {
                                    "id": "obj-36",
                                    "maxclass": "newobj",
                                    "numinlets": 2,
                                    "numoutlets": 2,
                                    "outlettype": [ "", "" ],
                                    "patching_rect": [ 189.0, 183.0, 92.0, 22.0 ],
                                    "text": "route command",
                                    "varname": "maxmcpid-166"
                                }
                            },
                            {
                                "box": {
                                    "color": [ 0.993703722953796, 0.693519413471222, 0.151275768876076, 1.0 ],
                                    "id": "obj-37",
                                    "maxclass": "newobj",
                                    "numinlets": 1,
                                    "numoutlets": 2,
                                    "outlettype": [ "", "" ],
                                    "patching_rect": [ 115.0, 100.0, 168.0, 22.0 ],
                                    "saved_object_attributes": {
                                        "autostart": 0,
                                        "defer": 0,
                                        "watch": 0
                                    },
                                    "text": "node.script max_mcp_node.js",
                                    "textfile": {
                                        "filename": "max_mcp_node.js",
                                        "flags": 0,
                                        "embed": 0,
                                        "autowatch": 1
                                    },
                                    "varname": "maxmcpid-165"
                                }
                            },
                            {
                                "box": {
                                    "id": "obj-38",
                                    "maxclass": "newobj",
                                    "numinlets": 2,
                                    "numoutlets": 2,
                                    "outlettype": [ "", "" ],
                                    "patching_rect": [ 93.0, 183.0, 79.0, 22.0 ],
                                    "text": "route request",
                                    "varname": "maxmcpid-164"
                                }
                            },
                            {
                                "box": {
                                    "comment": "",
                                    "id": "obj-1",
                                    "index": 1,
                                    "maxclass": "inlet",
                                    "numinlets": 0,
                                    "numoutlets": 1,
                                    "outlettype": [ "" ],
                                    "patching_rect": [ 115.0, 40.0, 30.0, 30.0 ],
                                    "varname": "maxmcpid-163"
                                }
                            },
                            {
                                "box": {
                                    "comment": "",
                                    "id": "obj-2",
                                    "index": 2,
                                    "maxclass": "outlet",
                                    "numinlets": 1,
                                    "numoutlets": 0,
                                    "patching_rect": [ 243.0, 435.0, 30.0, 30.0 ],
                                    "varname": "maxmcpid-162"
                                }
                            },
                            {
                                "box": {
                                    "comment": "",
                                    "id": "obj-4",
                                    "index": 3,
                                    "maxclass": "outlet",
                                    "numinlets": 1,
                                    "numoutlets": 0,
                                    "patching_rect": [ 322.5, 423.0, 30.0, 30.0 ],
                                    "varname": "maxmcpid-161"
                                }
                            },
                            {
                                "box": {
                                    "comment": "",
                                    "id": "obj-6",
                                    "index": 1,
                                    "maxclass": "outlet",
                                    "numinlets": 1,
                                    "numoutlets": 0,
                                    "patching_rect": [ 102.0, 423.0, 30.0, 30.0 ],
                                    "varname": "maxmcpid-160"
                                }
                            }
                        ],
                        "lines": [
                            {
                                "patchline": {
                                    "destination": [ "obj-37", 0 ],
                                    "source": [ "obj-1", 0 ]
                                }
                            },
                            {
                                "patchline": {
                                    "destination": [ "obj-8", 1 ],
                                    "source": [ "obj-15", 0 ]
                                }
                            },
                            {
                                "patchline": {
                                    "destination": [ "obj-6", 0 ],
                                    "source": [ "obj-16", 0 ]
                                }
                            },
                            {
                                "patchline": {
                                    "destination": [ "obj-8", 0 ],
                                    "source": [ "obj-16", 1 ]
                                }
                            },
                            {
                                "patchline": {
                                    "destination": [ "obj-6", 0 ],
                                    "source": [ "obj-22", 0 ]
                                }
                            },
                            {
                                "patchline": {
                                    "destination": [ "obj-6", 0 ],
                                    "source": [ "obj-31", 0 ]
                                }
                            },
                            {
                                "patchline": {
                                    "destination": [ "obj-16", 0 ],
                                    "source": [ "obj-35", 1 ]
                                }
                            },
                            {
                                "patchline": {
                                    "destination": [ "obj-4", 0 ],
                                    "source": [ "obj-36", 0 ]
                                }
                            },
                            {
                                "patchline": {
                                    "destination": [ "obj-35", 0 ],
                                    "source": [ "obj-37", 1 ]
                                }
                            },
                            {
                                "patchline": {
                                    "destination": [ "obj-36", 0 ],
                                    "order": 0,
                                    "source": [ "obj-37", 0 ]
                                }
                            },
                            {
                                "patchline": {
                                    "destination": [ "obj-38", 0 ],
                                    "order": 1,
                                    "source": [ "obj-37", 0 ]
                                }
                            },
                            {
                                "patchline": {
                                    "destination": [ "obj-45", 0 ],
                                    "order": 2,
                                    "source": [ "obj-37", 0 ]
                                }
                            },
                            {
                                "patchline": {
                                    "destination": [ "obj-4", 0 ],
                                    "source": [ "obj-38", 0 ]
                                }
                            },
                            {
                                "patchline": {
                                    "destination": [ "obj-2", 0 ],
                                    "source": [ "obj-45", 0 ]
                                }
                            },
                            {
                                "patchline": {
                                    "destination": [ "obj-6", 0 ],
                                    "source": [ "obj-8", 0 ]
                                }
                            }
                        ]
                    },
                    "patching_rect": [ 1608.0, 201.0, 103.0, 22.0 ],
                    "text": "p MaxMSP-Agent",
                    "varname": "maxmcpid-159"
                }
            },
            {
                "box": {
                    "color": [ 0.988235294117647, 0.745098039215686, 0.388235294117647, 1.0 ],
                    "filename": "max_mcp_v8_add_on.js",
                    "id": "obj-14",
                    "maxclass": "newobj",
                    "numinlets": 1,
                    "numoutlets": 2,
                    "outlettype": [ "", "" ],
                    "patching_rect": [ 1669.0, 238.0, 155.0, 22.0 ],
                    "saved_object_attributes": {
                        "parameter_enable": 0
                    },
                    "text": "v8 max_mcp_v8_add_on.js",
                    "textfile": {
                        "filename": "max_mcp_v8_add_on.js",
                        "flags": 0,
                        "embed": 0,
                        "autowatch": 1
                    },
                    "varname": "maxmcpid-158"
                }
            },
            {
                "box": {
                    "id": "obj-47",
                    "maxclass": "newobj",
                    "numinlets": 1,
                    "numoutlets": 0,
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
                        "rect": [ 59.0, 119.0, 1000.0, 780.0 ],
                        "boxes": [
                            {
                                "box": {
                                    "id": "obj-4",
                                    "maxclass": "newobj",
                                    "numinlets": 1,
                                    "numoutlets": 0,
                                    "patching_rect": [ 400.0, 176.5, 124.0, 22.0 ],
                                    "text": "s 1155-ready-for-dicts",
                                    "varname": "maxmcpid-157"
                                }
                            },
                            {
                                "box": {
                                    "id": "obj-25",
                                    "maxclass": "newobj",
                                    "numinlets": 1,
                                    "numoutlets": 2,
                                    "outlettype": [ "bang", "bang" ],
                                    "patching_rect": [ 351.0, 141.5, 62.0, 22.0 ],
                                    "text": "bangbang",
                                    "varname": "maxmcpid-156"
                                }
                            },
                            {
                                "box": {
                                    "id": "obj-18",
                                    "linecount": 2,
                                    "maxclass": "message",
                                    "numinlets": 2,
                                    "numoutlets": 1,
                                    "outlettype": [ "" ],
                                    "patching_rect": [ 164.0, 165.0, 134.0, 35.0 ],
                                    "text": ";\r\nmax openfilefront $1 $2",
                                    "varname": "maxmcpid-155"
                                }
                            },
                            {
                                "box": {
                                    "id": "obj-34",
                                    "maxclass": "newobj",
                                    "numinlets": 4,
                                    "numoutlets": 4,
                                    "outlettype": [ "", "", "", "" ],
                                    "patching_rect": [ 50.0, 100.0, 161.0, 22.0 ],
                                    "text": "route reveal open onloadend",
                                    "varname": "maxmcpid-154"
                                }
                            },
                            {
                                "box": {
                                    "id": "obj-2",
                                    "linecount": 2,
                                    "maxclass": "message",
                                    "numinlets": 2,
                                    "numoutlets": 1,
                                    "outlettype": [ "" ],
                                    "patching_rect": [ 50.0, 165.0, 84.0, 35.0 ],
                                    "text": ";\r\nmax reveal $1",
                                    "varname": "maxmcpid-153"
                                }
                            },
                            {
                                "box": {
                                    "comment": "",
                                    "id": "obj-46",
                                    "index": 1,
                                    "maxclass": "inlet",
                                    "numinlets": 0,
                                    "numoutlets": 1,
                                    "outlettype": [ "" ],
                                    "patching_rect": [ 50.0, 40.0, 30.0, 30.0 ],
                                    "varname": "maxmcpid-152"
                                }
                            }
                        ],
                        "lines": [
                            {
                                "patchline": {
                                    "destination": [ "obj-4", 0 ],
                                    "source": [ "obj-25", 0 ]
                                }
                            },
                            {
                                "patchline": {
                                    "destination": [ "obj-18", 0 ],
                                    "source": [ "obj-34", 1 ]
                                }
                            },
                            {
                                "patchline": {
                                    "destination": [ "obj-2", 0 ],
                                    "source": [ "obj-34", 0 ]
                                }
                            },
                            {
                                "patchline": {
                                    "destination": [ "obj-25", 0 ],
                                    "source": [ "obj-34", 2 ]
                                }
                            },
                            {
                                "patchline": {
                                    "destination": [ "obj-34", 0 ],
                                    "source": [ "obj-46", 0 ]
                                }
                            }
                        ]
                    },
                    "patching_rect": [ 1608.0, 549.0, 46.0, 22.0 ],
                    "text": "p other",
                    "varname": "maxmcpid-151"
                }
            },
            {
                "box": {
                    "bubble": 1,
                    "bubblepoint": 0.0,
                    "bubbleside": 2,
                    "fontface": 0,
                    "id": "obj-15",
                    "linecount": 5,
                    "maxclass": "comment",
                    "numinlets": 1,
                    "numoutlets": 0,
                    "patching_rect": [ 1753.0, 31.0, 134.0, 94.0 ],
                    "text": "Change a port when necessary. The port number need to match the port number in the server.py file",
                    "varname": "maxmcpid-150"
                }
            },
            {
                "box": {
                    "bubble": 1,
                    "bubblepoint": 0.2,
                    "bubbleside": 2,
                    "id": "obj-16",
                    "maxclass": "comment",
                    "numinlets": 1,
                    "numoutlets": 0,
                    "patching_rect": [ 1614.0, 31.0, 124.0, 39.0 ],
                    "text": "Start/stop the server",
                    "varname": "maxmcpid-149"
                }
            },
            {
                "box": {
                    "id": "obj-48",
                    "maxclass": "newobj",
                    "numinlets": 1,
                    "numoutlets": 0,
                    "patching_rect": [ 1650.0, 271.0, 159.0, 22.0 ],
                    "text": "print port-number @popup 1",
                    "varname": "maxmcpid-148"
                }
            },
            {
                "box": {
                    "id": "obj-44",
                    "maxclass": "message",
                    "numinlets": 2,
                    "numoutlets": 1,
                    "outlettype": [ "" ],
                    "patching_rect": [ 1752.0, 137.0, 59.0, 22.0 ],
                    "text": "port 5002",
                    "varname": "maxmcpid-147"
                }
            },
            {
                "box": {
                    "id": "obj-28",
                    "maxclass": "message",
                    "numinlets": 2,
                    "numoutlets": 1,
                    "outlettype": [ "" ],
                    "patching_rect": [ 1627.0, 114.0, 65.0, 22.0 ],
                    "text": "script stop",
                    "varname": "maxmcpid-146"
                }
            },
            {
                "box": {
                    "id": "obj-17",
                    "maxclass": "message",
                    "numinlets": 2,
                    "numoutlets": 1,
                    "outlettype": [ "" ],
                    "patching_rect": [ 1608.0, 81.0, 66.0, 22.0 ],
                    "text": "script start",
                    "varname": "maxmcpid-145"
                }
            },
            {
                "box": {
                    "color": [ 0.905882352941176, 0.709803921568627, 0.341176470588235, 1.0 ],
                    "id": "obj-7",
                    "maxclass": "newobj",
                    "numinlets": 1,
                    "numoutlets": 3,
                    "outlettype": [ "", "", "" ],
                    "patching_rect": [ 1739.0, 201.0, 85.0, 22.0 ],
                    "saved_object_attributes": {
                        "filename": "max_mcp.js",
                        "parameter_enable": 0
                    },
                    "text": "js max_mcp.js",
                    "varname": "maxmcpid-144"
                }
            },
            {
                "box": {
                    "disablefind": 0,
                    "id": "obj-33",
                    "maxclass": "jweb",
                    "numinlets": 1,
                    "numoutlets": 1,
                    "outlettype": [ "" ],
                    "patching_rect": [ 1608.0, 307.0, 277.0, 220.0 ],
                    "rendermode": 0,
                    "url": "file://n4m.monitor.html",
                    "varname": "maxmcpid-143"
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
                    "patching_rect": [ 32.0, 306.0, 48.0, 48.0 ]
                }
            },
            {
                "box": {
                    "id": "obj-10",
                    "maxclass": "newobj",
                    "numinlets": 2,
                    "numoutlets": 1,
                    "outlettype": [ "" ],
                    "patching_rect": [ 32.0, 400.0, 32.0, 22.0 ],
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
                    "patching_rect": [ 32.0, 727.0, 48.0, 136.0 ],
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
                    "patching_rect": [ 26.0, 936.0, 45.0, 45.0 ]
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
                    "patching_rect": [ 32.0, 515.0, 120.0, 22.0 ],
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
                            "blob": "22378.VMjLgD1U...O+fWarAhckI2bo8la8HRLt.iHfTlai8FYo41Y8HRUTYTK3HxO9.BOVMEUy.Ea0cVZtMEcgQWY9vSRC8Vav8lak4Fc9DiM1jCNtXUSGM1UA4hKtXlKt3hKP4hKt3hKtvjdXQ2bD4hKDoFRFkjdP4VPt3hKHYGUoUULL4BS1IjKt3hKtPjKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKu4VUCkzTHUTPD4hK1k2Sy.iQgYFVWkEdMckV0QiUOgFQosjcHIDRqQSLXUWTVoEciY0SnQUQUYDLB4DZ2j1SlYWdhISQVElYPcEY1UkUOgFSEMFdqwVXs0TaHYFVWkEdMckV0QiUOgFVogjYHcEVzMlUYgCR3wTL1IjSzfjPHoWQwjUdvjFRA0TLgASSGM1aMwFRlwjLgwVTxL1YIcUVVUEahk2ZwDFcvjFR4MiTLc2LBwDZtfmXzPSLXwDNwfUbvjFR2gDZOcCTVgkdUYzXuAiUYYFVWgkbUcUV3fDdTACMFgTPA0lXlQzTNYFR4wTMHkVS0PUZMYFRCwDdXkVRoQzPLYCR3sTN1MjX3gSLYgWQVElYyXEVyUkUOglYWkEcEEiVvjjUYUVSVkkb2ESXlYlTL8FRn8zMtHSX4slQi8FNrElYLECV14xTOgldRwDZtfGVo0TZLgCRRszcHIDR10jUOgldRwDZ2f1S2XWLgk1bwHlYLISXvPiQYsFMwj0azXUV3fjPLglKRE1aQYkVyUjQhY2ZrEVavjFR1gjPHM2ZwfEd3XzXvPiUZQ2XV8DZtjFRlgjLgUGLwH1avX0XxUjQiUWRW8DZtjFR0MyPOkGNVMFcQYUVzMlUZQWUr8zMtbEV3UjUgkGMC8DTEoFUAACQH8VTV8DZTQEUqQiUXg1cVkkZIIDRwTjQgASUV8DZtj1R1gDdKkicCQUPIUETMEjTZoFLogTQEUjVuMlQZcTQVoEcIIDRwTjQgASUV8DZtj1R1gDdKkicCQUPIUETMEjTZoFLogTQEUTX0MlLQc1ZrEFZtf1XmcmUisFLogjcyHDSncCZOciKUAkTEQ0TlolQYgCRREUTvXkVpkkZhsVQsgjYXcEVxU0UYgCR30DLtj1RvfDdKkicCQUPIUETMEjTZoFLogTQEUUXuEULQc1ZrEFZtf1XmcmUisFLogjcyHDSncCZOciKUAkTEQ0TlolQYgCRRM0YzX0XmcmQUgWUVEVc2ESXMgiQYsVRBgTLEYTXvTkUOglKosjcHg2R4X2PTETRUAUSAIkVpASZHA0ZrQVMQASXzUEaHYFVWgkbUcUV3fjPLQGUogTcyLzSPUjZTEDLDgzaQY0SnQTLXkVSEMFM2YUVn4BZic1cVM1ZvjFR1MiPLg1Mn8zMtTETRUDUSYlZFkENHIEVxEUaQ8FMwjETEwlXmACaHYFVWgkbUcUV3fjPLQmKogTcyLzSPUjZTEDLDgzaQY0SnQjQiEWRUg0bAcTUuAiUYglKnM1Y2Y0XqASZHIyLBwDZ2f1S23RUPIUQTMkYpYTV3fjTXASTxDFQUYzXq0jQi8FNrEFUqYUXqkjPHESQFEFLUY0SnQTZLQmKogTcyLzSPUjZTEDLDgzaQY0SngTLgISV5EFdMYUVPUDahcFLrgjYXcEVxU0UYgCRBwDcTkFR0MyPOAUQpQUPvPDRuEkUOgFRwDlL2QkVrE0QTcVRWg0bIIDRwTjQgASUV8DZtj1R1gDdKkicCQUPIUETMEjTZoFLogDZ3DyXNgiUZkWUFQ0YIcEVykjPHESQFEFLUY0Sn4RZKACR3sTN1MDUAkTUP0TPRokZvjFRngSLiAENwH1aQckV0QiQTcVRWg0bIIDRwTjQgASUV8DZtj1R24xPLYmKCwjctLES5o1PLcGQo0zcHg2R4X2PTETRUAUSAIkVpASZHgFNwLlTEwVXpgiUgAENwHFTEwlXmACaHYFVWgkbUcUV3fjTLQmKogTcyLzSPUjZTEDLDgzaQY0SngTLgISSEM1YIczXPUDahcFLrgjYXcEVxU0UYgCRBwDctjFR0MyPOAUQpQUPvPDRuEkUOgFRwDlLqwVXs0TUYQWSsgjYXcEVxU0UYgCRBwDcTkFR0MyPOAUQpQUPvPDRuEkUOgFTrgkbmoWXxEULToWRxP0Z2YUVoE0UZUGMrgjYXcEVxU0UYgCRRwDctjFR0MyPOAUQpQUPvPDRuEkUOgFTVQFcEYUXu0jQUgWQrEVdqYzXugCagkWRBgTLEYTXvTkUOgFQosjcHg2R4X2PTETRUAUSAIkVpASZHsVQrIlbq0FUqkkQgsVSFM1a3vVXGUjUZQWRBgTLEYTXvTkUOglKosDLHg2R4X2PTETRUAUSAIkVpASZHs1YGIFdUEiX4sVLgQWRBgTLEYTXvTkUOglKosjcHMTS14xPLYmKCwDdtLjSwPTZMgGVogTcyLzSPUjZTEDLDgzaQY0SnIlUYkWTWMFdUY0T0EkUYAUQrI1YvvFRlg0UXIWUWkENHIESz4RZHU2LC8DTEoFUAACQH8VTV8DZlYEV3ASLgQ2Zwf0QEYkVzUjZHYFVWgkbUcUV3fjPLQmKogTcyLzSPUjZTEDLDgzaQY0SnYlUXgGLwDFcqECVGUjUZQWRpgjYXcEVxU0UYgCRBwDctjFR0MyPOAUQpQUPvPDRuEkUOglYVgEdvDSXzsVLXMUUFE1ZMYzXAkjPHESQFEFLUY0SngTZKYGR3sTN1MDUAkTUP0TPRokZvjFRtUDahMGNrE1aMECUqcmUYkVTsAEZtf1XmcmUisFLogTdyHDSncCZOciKUAkTEQ0TlolQYgCRBo0YIcUX0QiUZkVSx.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.UczXzX3giQgglKnM1Y2Y0XqASZHY2LBwDZ2f1S23RUPIUQTMkYpYTV3fjPhUWRGM1YvDCU1cmUZoWRUgkdqESXPUDahcFLrgjYXcEVxU0UYgCRR0jcyHDSncCZOciKUAkTEQ0TlolQYgCRBIVcIczXmAiUYQWTxD1PQ0lXxkjPHESQFEFLUY0Sn4RZKYGR3sTN1MDUAkTUP0TPRokZvjFR1gCahoWQVE1ZzXzX0ACUXMSTUo0bUwFRlg0UXIWUWkENHITSz4RZHU2LC8DTEoFUAACQH8VTV8DZHcUVoUkUZESUVMURQQkTCclUXQGMVkkbIIDRwTjQgASUV8DZDkWSz4RZHU2LC8DTEoFUAACQH8VTV8DZHcUVxUkUXkWUwT0azXTVCgCagoWRxDlb2YUV3AidgoVUrgjYXcEVxU0UYgCRBwDctjFR0MyPOAUQpQUPvPDRuEkUOgFSWMVdQcEVuQCaHYFVWgkbUcUV3fjPLQmKogTcyLzSPUjZTEDLDgzaQY0SnwzUikWTWg0azvFUmAiQhglKnM1Y2Y0XqASZHY2LBwDZ2f1S23RUPIUQTMkYpYTV3fjPigWQrEVdAISX4UEaHYFVWgkbUcUV3fjPLQmKogTcyLzS04xUXgWQVEVdzLzSMsFQQkTRUk0bEYjX1sFag0VTUgEZ2YUV4X2TSkTTTIkTUYUXmEzQh8FMwjUQzXzX3s1QHsFMVgEZ2YUVpASZHcGRBgjcEwlXmAiUYoWUrIVRQY0SnQkQjYWRWkUdMckV0QCaHYFSFo0YzvVXqcmUOgFQ40DZtHUXq0jLhc1XVkEUqcjXqASZHcGRBgzbM0FV3fjTLcGRBgjbM0FV3fjTKcGRn8zM5QkTDslZTsFLVgkcAckVzMVLPASRsM1ZAIkVzEzUioGNUE1azX0Sn4RZKYGRBgzazXjXvDkLWMWQFQFNHIES3IVZKYGRBgTcUczXkAiUZQGLogTdyHDSn4BdgASTxb0bEYDY3fjTLgGUosjcHIDR4clUXYWUV8DZtj1R1wzTNQiZS4DMpMkS24xTMQCSCwTdLkFRlwzUjMGLVkkdIcEY3fjPLQmYCwjctLDS14xTLcmZowjcpkFSzfjPHg1ZGI1YMIiX3fjPLglKng0aAISXxUDahgCRBwDZ2f1S2biTSkTTTIkTUYUXmEzQh8FMwjUQzXzX3sVaOcidTIEQqoFUqAiUXYWPWoEciYUTzEUahQSPRkEcEwFVxUkQYgCRRwDZtHjXmkzUXMWUFM1ZIckTpASZHEyZrgEdEYzX0EEUYYWTGoEZtfGVtUDagQWUFEFNHIESxfjPHMWUwHVdEESVqEUUjYWUV8DZDkFRloWLhgFLogzcHIDRx0TaXgCRRszcHg1S2nGURQzZpQ0ZvXEV1EzUZQ2Xw.ELI01XqEjTZQWPWMld3TUXuQiUOglKosjcHIDRuQiQhASTxb0bEYDY3fjTLgmXosjcHIDR0U0QiUFLVoEcvjFR2MiPLglK3EFLQIyUyUjQjgCRRwzctj1R1gjPHk2YVgkcUY0Sn4RZKYGRBgTdqcUXyUkQig2ZW8DZtj1RvfjPHg1ZGI1YMIiX3fjPLglKng0aAISXxUDahgCRBwDZ2f1S2biTSkTTTIkTUYUXmEzQh8FMwjUQzXzX3sVaOcidTIEQqoFUqAiUXYWPWoEciYUTzEUahQSPRkEcEwFVxUkQYgCRRwDZtHjXmkzUXMWUFM1ZIckTpASZHEyZrgEdEYzX0kTUXoWUrgjYLYjVmQCags1cV8DZDkWSn4hTgsVSxH1YiYUVTs1QhsFLogzcHIDRy0TaXgCRRwDMHIDRx0TaXgCRRszcHg1S2nGURQzZpQ0ZvXEV1EzUZQ2Xw.ELI01XqEjTZQWPWMld3TUXuQiUOglKosjcHIDRuQiQhASTxb0bEYDY3fjTLgmXosjcHIDR0U0QiUFLVoEcvjFR1MiPLglK3EFLQIyUyUjQjgCRRwDdhk1R1gjPHk2YVgkcUY0Sn4RZKYGRBgTdqcUXyUkQig2ZW8DZtj1RvfjPHg1ZGI1YMIiX3fjPLglKng0aAISXxUDahgCRBwDZ2f1S2biTSkTTTIkTUYUXmEzQh8FMwjUQzXzX3sVaOcidTIEQqoFUqAiUXYWPWoEciYUTzEUahQSPRkEcEwFVxUkQYgCRRwDZtHjXmkzUXMWUFM1ZIckTpASZHgFNwLlQ3vlXoUkQTcVRWg0bIIDRoclUXQGMVkkbvjFR2IVZHYldVkUdMcEVsUkQUQSPWkENHIESn4hTgkWRV8DZDkWSn4hPgkWRV8DZ5IESnMyPO0zZDEURIUUVyUjQhY2ZrEVaMQ0X3k0UYYlZrElcUczXkAiUZQGLogjcyHDSn4hTZQWPWMld3TUXmc1UOgFQowjLyHDSn4BdgASTxb0bqwVX3fjPLQmKogjY2X0X5gSUgc1YW8DZDkFSxLiPLglK3IlaEYjXqASZHY2LBwDZtfmXz.iUgsVTsIFMvjFR1MiTMglKngEMAcEV40zUOglKogjYHYkV1giQgcVRW8DZtjFR0MyPOUmdTIEQqoFUqAiUXYWPWoEciYUTzEUahQCMC8TSqQTTIkTUYMWQFIlcqwVXsUkZgoWRWQlYTwVXmkjQgsVTV8DZDkFRl4xUXgWQVE1ZQcUV3sFQYgCRngUcicDU00zUZo2ZwDFcAUEV3UjUgglK3gkaEwVXzUkQggCRRwjLHIDRyUULhkWQwj0ZQUEY1UkUOgFQogjY5EiXnASZHcGVogjY1EiXnASZHMGQogTN1M0TIEEURIUUVE1YAcjXuQSLYMTUsIVLUYDRuQiQhASTxb0bqwVX3fjPLQmKogjYpwVX1U0QiUFLVg0LvjFR2gTdMQmKogjY2X0X5gSUg8FMV8DZtj1R1gjPHUWUGMVYvXEVy.SZHcGR40DctjFRlwzQZcVPWkENHIDSz4RZHYFSWQ1bvXUV5kzUjgCRBwDcTkFRlgjUjYWQwHVdvjFR1gjPHg1ZFIVc2YEV3ASZHYGR3sTN1k2RMsFQQkTRUk0bEYjX1sFag0VUpEldIcEY4X2TSkTTTIkTUYUXmEzQh8FMwjUQzXzX3s1QHsFMVgEZ2YUVpASZHcGRBgjcEwlXmAiUYoWUrIVRQY0SnAUahsFLwDlb3DCU1UkUYoVRBgTZmYEVzQiUYIGLogzcHIDRyUULhkWQwj0ZQUEY1UkUOgFQogjY5EiXnASZHMiKogjY1EiXnASZHMGQogTN1M0TIEEURIUUVE1YAcjXuQSLYMTUsIVLUYDRuQiQhASTxb0bqwVX3fjPLQmKogjYpwVX1U0QiUFLVg0LvjFR2gTdMQmKogjY2X0X5gSUg8FMV8DZtj1R1gjPHUWUGMVYvXEVy.SZHcGR40DctjFRlwzQZcVPWkENHIDSz4RZHYFSWQ1bvXUV5kzUjgCRBwDcTkFRlgjUjYWQwHVdvjFR1gjPHg1ZFIVc2YEV3ASZHYGR3sTN1k2RMsFQQkTRUk0bEYjX1sFag0VUpEldIcEY4X2TSkTTTIkTUYUXmEzQh8FMwjUQzXzX3s1QHsFMVgEZ2YUVpASZHcGRBgjcEwlXmAiUYoWUrIVRQY0SnomUX8FMrUUc2Y0XyUEaHYFSFo0YzvVXqcmUOgFQ40DZtHUXq0jLhc1XVkEUqcjXqASZHcGRBgzbM0FV3fDdMglKBEVdIY0SnomTLg1LC8TSqQTTIkTUYMWQFIlcqwVXs0DUigWVWkkYpwVX1U0QiUFLVoEcvjFR1MiPLglKRoEcAc0X5gSUgc1YW8DZDkFSxLiPLglK3EFLQIyUysFaggCRBwDctjFRlciUioGNUE1Ymc0SnQTZLIyLBwDZtfmXtUjQhsFLogjcyHDSn4BdhQCLVE1ZQ0lXz.SZHY2LR0DZtfFVzDzUXkWSW8DZtjFRlgjUZYGNFE1YIc0Sn4RZHU2LC8Tc5QkTDslZTsFLVgkcAckVzMlUQQWTsIFMzLzSMsFQQkTRUk0bEYjX1sFag0VUpEldIcEYlQEagcVRFE1ZQY0SnQTZHYlKWgEdEYUXqE0UYg2ZDkENHIjXmQiQTUWTsgjYLYjVmQCags1cV8DZDkWSn4hTgsVSxH1YiYUVTs1QhsFLogzcHIDRy0TaXgCRRwjcHIDRx0TaXgCRRszcHg1S2nGURQzZpQ0ZvXEV1EzUZQ2Xw.ELI01XqEjTZQWPWMld3TUXuQiUOglKosjcHIDRuQiQhASTxb0bEYDY3fjTLgmXosjcHIDR0U0QiUFLVoEcvjFR1MiPLglK3EFLQIyUyUjQjgCRRwDdhk1R1gjPHk2YVgkcUY0Sn4RZKYGRBgTdqcUXyUkQig2ZW8DZtj1RvfjPHg1ZGI1YMIiX3fjPLglKng0aAISXxUDahgCRBwDZ2f1S2biTSkTTTIkTUYUXmEzQh8FMwjUQzXzX3sVaOcidTIEQqoFUqAiUXYWPWoEciYUTzEUahQSPRkEcEwFVxUkQYgCRRwDZtHjXmkzUXMWUFM1ZIckTpASZHgWUrM1ZI0FVMslQjglK3gkaEwVXzUkQggCRRwjLHIDRyUULhkWQwj0ZQUEY1UkUOgFQogjY5EiXnASZHQiKogjY1EiXnASZHMGQogTN1M0TIEEURIUUVE1YAcjXuQSLYMTUsIVLUYDRuQiQhASTxb0bqwVX3fjPLQmKogjYpwVX1U0QiUFLVg0LvjFR2gTdMQmKogjY2X0X5gSUg8FMV8DZtj1R1gjPHUWUGMVYvXEVy.SZHcGR40DctjFRlwzQZcVPWkENHIDSz4RZHYFSWQ1bvXUV5kzUjgCRBwDcTkFRlgjUjYWQwHVdvjFR1gjPHg1ZFIVc2YEV3ASZHYGR3sTN1k2RMsFQQkTRUk0bEYjX1sFag0VUpEldIcEY4X2TSkTTTIkTUYUXmEzQh8FMwjUQzXzX3s1QHsFMVgEZ2YUVpASZHcGRBgjcEwlXmAiUYoWUrIVRQY0SnQTLXkVSEMFM2YUVn4BdX4VQrEFcUYTX3fjTLICRBgzbUEiX4UTLYsVTUQlcUY0SnQTZHYldwHFZvjFR2YVZHYlcwHFZvjFRyQTZHkicSMURQQkTRUkUgcVPGI1azDSVCUUahESUFgzazXjXvDkLWM2ZrEFNHIDSz4RZHYlZrElcUczXkAiUXMCLogzcHkWSz4RZHY1MVMld3TUXuQiUOglKosjcHIDR0U0QiUFLVg0LvjFR2gTdMQmKogjYLcjVmEzUYgCRBwDctjFRlwzUjMGLVkkdIcEY3fjPLQGUogjYHYEY1UTLhkGLogjcHIDRnslQhU2cVgEdvjFR1gDdKkic4sTSqQTTIkTUYMWQFIlcqwVXsUkZgoWRWQVN1M0TIEEURIUUVE1YAcjXuQSLYUDMFMFdqcDRqQiUXg1cVkkZvjFR2gjPHYWQrI1YvXUV5UEahkTTV8DZLc0X4E0UX8FMrgjYLYjVmQCags1cV8DZDkWSn4hTgsVSxH1YiYUVTs1QhsFLogzcHIDRy0TaXgCRn0jdHIDRx0TaXgCRRszcHg1S2nGURQzZpQ0ZvXEV1EzUZQ2Xw.ELI01XqEjTZQWPWMld3TUXuQiUOglKosjcHIDRuQiQhASTxb0bEYDY3fjTLgmXosjcHIDR0U0QiUFLVoEcvjFR2MiPLglK3EFLQIyUyUjQjgCRRwDdhk1R1gjPHk2YVgkcUY0Sn4RZKQiZCwjctLDS14xTNACSo0jLPkGS3gjPHk2ZWE1bUYzX3s1UOglKosDLHIDRns1QhcVSxHFNHIDSn4BZX8VPxDlbEwlX3fjPLg1Mn8zM2H0TIEEURIUUVE1YAcjXuQSLYUDMFMFdq01S2nGURQzZpQ0ZvXEV1EzUZQ2XVEEcQ0lXzDjTYQWQrgkbUYTV3fjTLglKBI1YIcEVyUkQisVRWIkZvjFRPsFajUSTvDFcUwFRlwjQZcFMrE1Z2Y0SnQTdMglKRE1ZMIiXmMlUYQ0ZGI1ZvjFR2gjPHMWSsgENHIESwfjPHIWSsgENHI0R2gDZOcidTIEQqoFUqAiUXYWPWoEciECTvjTaisVPRoEcAc0X5gSUg8FMV8DZtj1R1gjPH8FMFIFLQIyUyUjQjgCRRwDdhk1R1gjPHUWUGMVYvXkVzASZHY2LBwDZtfWXvDkLWMWQFQFNHIES3IVZKYGRBgTdmYEV1UkUOglKosjcHIDR4s1UgMWUFMFdqc0Sn4RZKACRBgDZqcjXm0jLhgCRBwDZtfFVuEjLgIWQrIFNHIDSncCZOcyMRMURQQkTRUkUgcVPGI1azDSVEQiQig2Zs8zM5QkTDslZTsFLVgkcAckVzMlUQQWTsIFMAIUVzUDaXIWUFkENHIESn4hPhcVRWg0bUYzXqkzURoFLogjc3XTXzDzQZUGMVQFTEwlXmACaHYFSFo0YzvVXqcmUOgFQ40DZtHUXq0jLhc1XVkEUqcjXqASZHYGRBgzbM0FV3fjTKcGRBgjbM0FV3fjTKcGRn8zM5QkTDslZTsFLVgkcAckVzMVLPASRsM1ZAIkVzEzUioGNUE1azX0Sn4RZKYGRBgzazXjXvDkLWMWQFQFNHIES3IVZKYGRBgTcUczXkAiUZQGLogjcyHDSn4BdgASTxb0bEYDY3fjTLgmXosjcHIDR4clUXYWUV8DZtj1R1gjPHk2ZWE1bUYzX3s1UOglKosDLHIDRns1QhcVSxHFNHIDSn4BZX8VPxDlbEwlX3fjPLg1Mn8zM2H0TIEEURIUUVE1YAcjXuQSLYUDMFMFdq01S2nGURQzZpQ0ZvXEV1EzUZQ2XVEEcQ0lXzDjTYQWQrgkbUYTV3fjTLglKBI1YIcEVyUkQisVRWIkZvjFRtUDahMGNrE1aMEiXPUDahcFLrgjYLYjVmQCags1cV8DZDkWSn4hTgsVSxH1YiYUVTs1QhsFLogzcHIDRy0TaXgCR30zLHIDRx0TaXgCRRszcHg1S2nGURQzZpQ0ZvXEV1EzUZQ2Xw.ELI01XqEjTZQWPWMld3TUXuQiUOglKosjcHIDRuQiQhASTxb0bEYDY3fjTLgmXosjcHIDR0U0QiUFLVoEcvjFR1MiPLglK3EFLQIyUyUjQjgCRRwDdhk1R1gjPHk2YVgkcUY0Sn4RZKYGRBgTdqcUXyUkQig2ZW8DZtj1RvfjPHg1ZGI1YMIiX3fjPLglKng0aAISXxUDahgCRBwDZ2f1S2biTSkTTTIkTUYUXmEzQh8FMwjUQzXzX3sVaOcidTIEQqoFUqAiUXYWPWoEciYUTzEUahQSPRkEcEwFVxUkQYgCRRwDZtHjXmkzUXMWUFM1ZIckTpASZHoWRWk0b3XTX0ETUXgWQVEFZtfGVtUDagQWUFEFNHIESn4hTgsVSxH1YiYUVTs1QhsFLogzcHIDRy0TaXgCR30DMHIDRx0TaXgCRRszcHg1S2nGURQzZpQ0ZvXEV1EzUZQ2Xw.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.idgoVUrgjYXcEVxU0UYgCRBwDctjFR0MyPOAUQrI1YvXUV5UEahYlKWgEdEYUXqE0UYg2ZDkENHglX0giUg0DNFkEL2YEV5sVLgQGNpE1SYwVVn4BZic1cVM1ZvjFR2MiPLg1Mn8zMtTEV3UjUgsVTWkEdAIjXmkzUXMWUFM1ZIckTpASZHgGNwD1bQQkV4E0UXQWSVkkPUYzXxTkUYQGLToUZM0FRlg0UXIWUWkENHIESxLiPLg1Mn8zM2HDUmkzUXMWUFM1ZIIiX4XWdKIENwD1bzLzSRgSLgMWPRokZvjFRocWLgkWUVM0aMEyU3gSLgMWRBgDcEYUXqASZHMzcwDVdUEyUMsVLXUVRvDVcvvFRlQkLhsVRW8DZtjFRlQkQY8VTWgEZ2YUV3fjPLglKRgUZQckVwTkUOglKogTN1MDUmkzUXMWUFM1ZIIiX4X2PTcVRWg0bUYzXqkzQHYWQrI1YvXUV5UEahkTTV8DZHISX0ASLT81aWkUdIIDRwTjQgASUV8DZtj1R1gDdKkicCQ0YIcEVyUkQisVRGgjcEwlXmAiUYoWUrIVRQY0SngjLgUGLVAEZMISX3EzQi8FNrEVSEYzXqkzUZc1cwHFZtf1XmcmUisFLogjcyHDSncCZOciKUgEdEYUXqE0UYgWPBI1YIcEVyUkQisVRWIkZvjFR3gSLgM2cToUdQcUVzUEahAENwH1aQckV0QCaHYFVWgkbUcUV3fDdLQmKogTcyLzSPUDahcFLVkkdUwlXl4xUXgWQVE1ZQcUV3sFQYgCRnIVc3XUXSgiUigWSVkEQUYTXms1USUWTVkEZtf1XmcmUisFLogjcyHDSncCZOciKUgEdEYUXqE0UYgWPBI1YIcEVyUkQisVRWIkZvjFR3gSLgMGL5ElZUcTXmE0UZUGMwLEc3nVVrkjPHESQFEFLUY0Sn4RZKYGR3sTN1MDUmkzUXMWUFM1ZIcDR1UDahcFLVkkdUwlXIEkUOgFRxDVcvXTTu0zQicFMwf0ZIQUV5M1UYsFMVM0aMEiXn4BZic1cVM1ZvjFR2IVZKYGR3sTN1k2RPUDahcFLVkkdUwlX4QyPOUGRvDVcvv1S2bCZTUGNVEVdzLzS0gDLgUGLwHVSEwVXmMlUYgGMC8TcHISX0ASLh8FLVMlbEYzX0kTaOciKxDVdqYzXugCag8FMwjUN1MjXmkzUXMWSs8zMtTETRUDUSYlZFkENHglX0giUgMENVMFdMYUVAQSLYIWUrgjYXcEVxU0UYgCRR4jcyHDSncCZOciKUAkTEQ0TlolQYgCRnIVc3XUXSgiUigWSVkEQqEiX5UDagkVUrgjYXcEVxU0UYgCR3wDctjFR0MyPOUmKWgEdEYUX4QyPOUmKxDVdqYzXugCag8FMwjUN1k2R1kjLg0VRWg0bzLzS4giUigWSVk0azvVV0EjTgcFMVMFaEECV5UUahsVRW8DZDQ0XpsVLgUFL5ElZUYTXuQSLYglKRE1YqwVXTUkQjoGLogzPUYTXxgCaHYFTxDlcQUUVyD0UOglYWwDZtfFV0E0QiUGLFU0ZmczX3fjTR4TSEUkTzHESn4BdXU2cwDFLIc0SngEaYsVSVgkZIkFVn4BdXUGLFIVczXUVzEkLT81aWkENHIDSn4BdhsVSFM1a3vVXMgiQYsFLogjcHg2R4XWdKk2XWg0bzLjKt3hKt3hKt3hKtXlTU0DUQAURWoULEYzXqEEUXoWQF4RPDYFTzDzUXkWSG4RPDYmKtnWPt3hKt3hKt3hKJUELPUTPqI1aYcEV5UkQQcVTWgEOujzPu0Fbu4VYtQmO77hUSQ0LPwVcmklaSQWXzUlO.."
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
                                        "blob": "22378.VMjLgD1U...O+fWarAhckI2bo8la8HRLt.iHfTlai8FYo41Y8HRUTYTK3HxO9.BOVMEUy.Ea0cVZtMEcgQWY9vSRC8Vav8lak4Fc9DiM1jCNtXUSGM1UA4hKtXlKt3hKP4hKt3hKtvjdXQ2bD4hKDoFRFkjdP4VPt3hKHYGUoUULL4BS1IjKt3hKtPjKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKu4VUCkzTHUTPD4hK1k2Sy.iQgYFVWkEdMckV0QiUOgFQosjcHIDRqQSLXUWTVoEciY0SnQUQUYDLB4DZ2j1SlYWdhISQVElYPcEY1UkUOgFSEMFdqwVXs0TaHYFVWkEdMckV0QiUOgFVogjYHcEVzMlUYgCR3wTL1IjSzfjPHoWQwjUdvjFRA0TLgASSGM1aMwFRlwjLgwVTxL1YIcUVVUEahk2ZwDFcvjFR4MiTLc2LBwDZtfmXzPSLXwDNwfUbvjFR2gDZOcCTVgkdUYzXuAiUYYFVWgkbUcUV3fDdTACMFgTPA0lXlQzTNYFR4wTMHkVS0PUZMYFRCwDdXkVRoQzPLYCR3sTN1MjX3gSLYgWQVElYyXEVyUkUOglYWkEcEEiVvjjUYUVSVkkb2ESXlYlTL8FRn8zMtHSX4slQi8FNrElYLECV14xTOgldRwDZtfGVo0TZLgCRRszcHIDR10jUOgldRwDZ2f1S2XWLgk1bwHlYLISXvPiQYsFMwj0azXUV3fjPLglKRE1aQYkVyUjQhY2ZrEVavjFR1gjPHM2ZwfEd3XzXvPiUZQ2XV8DZtjFRlgjLgUGLwH1avX0XxUjQiUWRW8DZtjFR0MyPOkGNVMFcQYUVzMlUZQWUr8zMtbEV3UjUgkGMC8DTEoFUAACQH8VTV8DZTQEUqQiUXg1cVkkZIIDRwTjQgASUV8DZtj1R1gDdKkicCQUPIUETMEjTZoFLogTQEUjVuMlQZcTQVoEcIIDRwTjQgASUV8DZtj1R1gDdKkicCQUPIUETMEjTZoFLogTQEUTX0MlLQc1ZrEFZtf1XmcmUisFLogjcyHDSncCZOciKUAkTEQ0TlolQYgCRREUTvXkVpkkZhsVQsgjYXcEVxU0UYgCR30DLtj1RvfDdKkicCQUPIUETMEjTZoFLogTQEUUXuEULQc1ZrEFZtf1XmcmUisFLogjcyHDSncCZOciKUAkTEQ0TlolQYgCRRM0YzX0XmcmQUgWUVEVc2ESXMgiQYsVRBgTLEYTXvTkUOglKosjcHg2R4X2PTETRUAUSAIkVpASZHA0ZrQVMQASXzUEaHYFVWgkbUcUV3fjPLQGUogTcyLzSPUjZTEDLDgzaQY0SnQTLXkVSEMFM2YUVn4BZic1cVM1ZvjFR1MiPLg1Mn8zMtTETRUDUSYlZFkENHIEVxEUaQ8FMwjETEwlXmACaHYFVWgkbUcUV3fjPLQmKogTcyLzSPUjZTEDLDgzaQY0SnQjQiEWRUg0bAcTUuAiUYglKnM1Y2Y0XqASZHIyLBwDZ2f1S23RUPIUQTMkYpYTV3fjTXASTxDFQUYzXq0jQi8FNrEFUqYUXqkjPHESQFEFLUY0SnQTZLQmKogTcyLzSPUjZTEDLDgzaQY0SngTLgISV5EFdMYUVPUDahcFLrgjYXcEVxU0UYgCRBwDcTkFR0MyPOAUQpQUPvPDRuEkUOgFRwDlL2QkVrE0QTcVRWg0bIIDRwTjQgASUV8DZtj1R1gDdKkicCQUPIUETMEjTZoFLogDZ3DyXNgiUZkWUFQ0YIcEVykjPHESQFEFLUY0Sn4RZKACR3sTN1MDUAkTUP0TPRokZvjFRngSLiAENwH1aQckV0QiQTcVRWg0bIIDRwTjQgASUV8DZtj1R24xPLYmKCwjctLES5o1PLcGQo0zcHg2R4X2PTETRUAUSAIkVpASZHgFNwLlTEwVXpgiUgAENwHFTEwlXmACaHYFVWgkbUcUV3fjTLQmKogTcyLzSPUjZTEDLDgzaQY0SngTLgISSEM1YIczXPUDahcFLrgjYXcEVxU0UYgCRBwDctjFR0MyPOAUQpQUPvPDRuEkUOgFRwDlLqwVXs0TUYQWSsgjYXcEVxU0UYgCRBwDcTkFR0MyPOAUQpQUPvPDRuEkUOgFTrgkbmoWXxEULToWRxP0Z2YUVoE0UZUGMrgjYXcEVxU0UYgCRRwDctjFR0MyPOAUQpQUPvPDRuEkUOgFTVQFcEYUXu0jQUgWQrEVdqYzXugCagkWRBgTLEYTXvTkUOgFQosjcHg2R4X2PTETRUAUSAIkVpASZHsVQrIlbq0FUqkkQgsVSFM1a3vVXGUjUZQWRBgTLEYTXvTkUOglKosDLHg2R4X2PTETRUAUSAIkVpASZHs1YGIFdUEiX4sVLgQWRBgTLEYTXvTkUOglKosjcHMTS14xPLYmKCwDdtLjSwPTZMgGVogTcyLzSPUjZTEDLDgzaQY0SnIlUYkWTWMFdUY0T0EkUYAUQrI1YvvFRlg0UXIWUWkENHIESz4RZHU2LC8DTEoFUAACQH8VTV8DZlYEV3ASLgQ2Zwf0QEYkVzUjZHYFVWgkbUcUV3fjPLQmKogTcyLzSPUjZTEDLDgzaQY0SnYlUXgGLwDFcqECVGUjUZQWRpgjYXcEVxU0UYgCRBwDctjFR0MyPOAUQpQUPvPDRuEkUOglYVgEdvDSXzsVLXMUUFE1ZMYzXAkjPHESQFEFLUY0SngTZKYGR3sTN1MDUAkTUP0TPRokZvjFRtUDahMGNrE1aMECUqcmUYkVTsAEZtf1XmcmUisFLogTdyHDSncCZOciKUAkTEQ0TlolQYgCRBo0YIcUX0QiUZkVSx.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.UczXzX3giQgglKnM1Y2Y0XqASZHY2LBwDZ2f1S23RUPIUQTMkYpYTV3fjPhUWRGM1YvDCU1cmUZoWRUgkdqESXPUDahcFLrgjYXcEVxU0UYgCRR0jcyHDSncCZOciKUAkTEQ0TlolQYgCRBIVcIczXmAiUYQWTxD1PQ0lXxkjPHESQFEFLUY0Sn4RZKYGR3sTN1MDUAkTUP0TPRokZvjFR1gCahoWQVE1ZzXzX0ACUXMSTUo0bUwFRlg0UXIWUWkENHITSz4RZHU2LC8DTEoFUAACQH8VTV8DZHcUVoUkUZESUVMURQQkTCclUXQGMVkkbIIDRwTjQgASUV8DZDkWSz4RZHU2LC8DTEoFUAACQH8VTV8DZHcUVxUkUXkWUwT0azXTVCgCagoWRxDlb2YUV3AidgoVUrgjYXcEVxU0UYgCRBwDctjFR0MyPOAUQpQUPvPDRuEkUOgFSWMVdQcEVuQCaHYFVWgkbUcUV3fjPLQmKogTcyLzSPUjZTEDLDgzaQY0SnwzUikWTWg0azvFUmAiQhglKnM1Y2Y0XqASZHY2LBwDZ2f1S23RUPIUQTMkYpYTV3fjPigWQrEVdAISX4UEaHYFVWgkbUcUV3fjPLQmKogTcyLzS04xUXgWQVEVdzLzSMsFQQkTRUk0bEYjX1sFag0VTUgEZ2YUV4X2TSkTTTIkTUYUXmEzQh8FMwjUQzXzX3s1QHsFMVgEZ2YUVpASZHcGRBgjcEwlXmAiUYoWUrIVRQY0SnQkQjYWRWkUdMckV0QCaHYFSFo0YzvVXqcmUOgFQ40DZtHUXq0jLhc1XVkEUqcjXqASZHcGRBgzbM0FV3fjTLcGRBgjbM0FV3fjTKcGRn8zM5QkTDslZTsFLVgkcAckVzMVLPASRsM1ZAIkVzEzUioGNUE1azX0Sn4RZKYGRBgzazXjXvDkLWMWQFQFNHIES3IVZKYGRBgTcUczXkAiUZQGLogTdyHDSn4BdgASTxb0bEYDY3fjTLgGUosjcHIDR4clUXYWUV8DZtj1R1wzTNQiZS4DMpMkS24xTMQCSCwTdLkFRlwzUjMGLVkkdIcEY3fjPLQmYCwjctLDS14xTLcmZowjcpkFSzfjPHg1ZGI1YMIiX3fjPLglKng0aAISXxUDahgCRBwDZ2f1S2biTSkTTTIkTUYUXmEzQh8FMwjUQzXzX3sVaOcidTIEQqoFUqAiUXYWPWoEciYUTzEUahQSPRkEcEwFVxUkQYgCRRwDZtHjXmkzUXMWUFM1ZIckTpASZHEyZrgEdEYzX0EEUYYWTGoEZtfGVtUDagQWUFEFNHIESxfjPHMWUwHVdEESVqEUUjYWUV8DZDkFRloWLhgFLogzcHIDRx0TaXgCRRszcHg1S2nGURQzZpQ0ZvXEV1EzUZQ2Xw.ELI01XqEjTZQWPWMld3TUXuQiUOglKosjcHIDRuQiQhASTxb0bEYDY3fjTLgmXosjcHIDR0U0QiUFLVoEcvjFR2MiPLglK3EFLQIyUyUjQjgCRRwzctj1R1gjPHk2YVgkcUY0Sn4RZKYGRBgTdqcUXyUkQig2ZW8DZtj1RvfjPHg1ZGI1YMIiX3fjPLglKng0aAISXxUDahgCRBwDZ2f1S2biTSkTTTIkTUYUXmEzQh8FMwjUQzXzX3sVaOcidTIEQqoFUqAiUXYWPWoEciYUTzEUahQSPRkEcEwFVxUkQYgCRRwDZtHjXmkzUXMWUFM1ZIckTpASZHEyZrgEdEYzX0kTUXoWUrgjYLYjVmQCags1cV8DZDkWSn4hTgsVSxH1YiYUVTs1QhsFLogzcHIDRy0TaXgCRRwDMHIDRx0TaXgCRRszcHg1S2nGURQzZpQ0ZvXEV1EzUZQ2Xw.ELI01XqEjTZQWPWMld3TUXuQiUOglKosjcHIDRuQiQhASTxb0bEYDY3fjTLgmXosjcHIDR0U0QiUFLVoEcvjFR1MiPLglK3EFLQIyUyUjQjgCRRwDdhk1R1gjPHk2YVgkcUY0Sn4RZKYGRBgTdqcUXyUkQig2ZW8DZtj1RvfjPHg1ZGI1YMIiX3fjPLglKng0aAISXxUDahgCRBwDZ2f1S2biTSkTTTIkTUYUXmEzQh8FMwjUQzXzX3sVaOcidTIEQqoFUqAiUXYWPWoEciYUTzEUahQSPRkEcEwFVxUkQYgCRRwDZtHjXmkzUXMWUFM1ZIckTpASZHgFNwLlQ3vlXoUkQTcVRWg0bIIDRoclUXQGMVkkbvjFR2IVZHYldVkUdMcEVsUkQUQSPWkENHIESn4hTgkWRV8DZDkWSn4hPgkWRV8DZ5IESnMyPO0zZDEURIUUVyUjQhY2ZrEVaMQ0X3k0UYYlZrElcUczXkAiUZQGLogjcyHDSn4hTZQWPWMld3TUXmc1UOgFQowjLyHDSn4BdgASTxb0bqwVX3fjPLQmKogjY2X0X5gSUgc1YW8DZDkFSxLiPLglK3IlaEYjXqASZHY2LBwDZtfmXz.iUgsVTsIFMvjFR1MiTMglKngEMAcEV40zUOglKogjYHYkV1giQgcVRW8DZtjFR0MyPOUmdTIEQqoFUqAiUXYWPWoEciYUTzEUahQCMC8TSqQTTIkTUYMWQFIlcqwVXsUkZgoWRWQlYTwVXmkjQgsVTV8DZDkFRl4xUXgWQVE1ZQcUV3sFQYgCRngUcicDU00zUZo2ZwDFcAUEV3UjUgglK3gkaEwVXzUkQggCRRwjLHIDRyUULhkWQwj0ZQUEY1UkUOgFQogjY5EiXnASZHcGVogjY1EiXnASZHMGQogTN1M0TIEEURIUUVE1YAcjXuQSLYMTUsIVLUYDRuQiQhASTxb0bqwVX3fjPLQmKogjYpwVX1U0QiUFLVg0LvjFR2gTdMQmKogjY2X0X5gSUg8FMV8DZtj1R1gjPHUWUGMVYvXEVy.SZHcGR40DctjFRlwzQZcVPWkENHIDSz4RZHYFSWQ1bvXUV5kzUjgCRBwDcTkFRlgjUjYWQwHVdvjFR1gjPHg1ZFIVc2YEV3ASZHYGR3sTN1k2RMsFQQkTRUk0bEYjX1sFag0VUpEldIcEY4X2TSkTTTIkTUYUXmEzQh8FMwjUQzXzX3s1QHsFMVgEZ2YUVpASZHcGRBgjcEwlXmAiUYoWUrIVRQY0SnAUahsFLwDlb3DCU1UkUYoVRBgTZmYEVzQiUYIGLogzcHIDRyUULhkWQwj0ZQUEY1UkUOgFQogjY5EiXnASZHMiKogjY1EiXnASZHMGQogTN1M0TIEEURIUUVE1YAcjXuQSLYMTUsIVLUYDRuQiQhASTxb0bqwVX3fjPLQmKogjYpwVX1U0QiUFLVg0LvjFR2gTdMQmKogjY2X0X5gSUg8FMV8DZtj1R1gjPHUWUGMVYvXEVy.SZHcGR40DctjFRlwzQZcVPWkENHIDSz4RZHYFSWQ1bvXUV5kzUjgCRBwDcTkFRlgjUjYWQwHVdvjFR1gjPHg1ZFIVc2YEV3ASZHYGR3sTN1k2RMsFQQkTRUk0bEYjX1sFag0VUpEldIcEY4X2TSkTTTIkTUYUXmEzQh8FMwjUQzXzX3s1QHsFMVgEZ2YUVpASZHcGRBgjcEwlXmAiUYoWUrIVRQY0SnomUX8FMrUUc2Y0XyUEaHYFSFo0YzvVXqcmUOgFQ40DZtHUXq0jLhc1XVkEUqcjXqASZHcGRBgzbM0FV3fDdMglKBEVdIY0SnomTLg1LC8TSqQTTIkTUYMWQFIlcqwVXs0DUigWVWkkYpwVX1U0QiUFLVoEcvjFR1MiPLglKRoEcAc0X5gSUgc1YW8DZDkFSxLiPLglK3EFLQIyUysFaggCRBwDctjFRlciUioGNUE1Ymc0SnQTZLIyLBwDZtfmXtUjQhsFLogjcyHDSn4BdhQCLVE1ZQ0lXz.SZHY2LR0DZtfFVzDzUXkWSW8DZtjFRlgjUZYGNFE1YIc0Sn4RZHU2LC8Tc5QkTDslZTsFLVgkcAckVzMlUQQWTsIFMzLzSMsFQQkTRUk0bEYjX1sFag0VUpEldIcEYlQEagcVRFE1ZQY0SnQTZHYlKWgEdEYUXqE0UYg2ZDkENHIjXmQiQTUWTsgjYLYjVmQCags1cV8DZDkWSn4hTgsVSxH1YiYUVTs1QhsFLogzcHIDRy0TaXgCRRwjcHIDRx0TaXgCRRszcHg1S2nGURQzZpQ0ZvXEV1EzUZQ2Xw.ELI01XqEjTZQWPWMld3TUXuQiUOglKosjcHIDRuQiQhASTxb0bEYDY3fjTLgmXosjcHIDR0U0QiUFLVoEcvjFR1MiPLglK3EFLQIyUyUjQjgCRRwDdhk1R1gjPHk2YVgkcUY0Sn4RZKYGRBgTdqcUXyUkQig2ZW8DZtj1RvfjPHg1ZGI1YMIiX3fjPLglKng0aAISXxUDahgCRBwDZ2f1S2biTSkTTTIkTUYUXmEzQh8FMwjUQzXzX3sVaOcidTIEQqoFUqAiUXYWPWoEciYUTzEUahQSPRkEcEwFVxUkQYgCRRwDZtHjXmkzUXMWUFM1ZIckTpASZHgWUrM1ZI0FVMslQjglK3gkaEwVXzUkQggCRRwjLHIDRyUULhkWQwj0ZQUEY1UkUOgFQogjY5EiXnASZHQiKogjY1EiXnASZHMGQogTN1M0TIEEURIUUVE1YAcjXuQSLYMTUsIVLUYDRuQiQhASTxb0bqwVX3fjPLQmKogjYpwVX1U0QiUFLVg0LvjFR2gTdMQmKogjY2X0X5gSUg8FMV8DZtj1R1gjPHUWUGMVYvXEVy.SZHcGR40DctjFRlwzQZcVPWkENHIDSz4RZHYFSWQ1bvXUV5kzUjgCRBwDcTkFRlgjUjYWQwHVdvjFR1gjPHg1ZFIVc2YEV3ASZHYGR3sTN1k2RMsFQQkTRUk0bEYjX1sFag0VUpEldIcEY4X2TSkTTTIkTUYUXmEzQh8FMwjUQzXzX3s1QHsFMVgEZ2YUVpASZHcGRBgjcEwlXmAiUYoWUrIVRQY0SnQTLXkVSEMFM2YUVn4BdX4VQrEFcUYTX3fjTLICRBgzbUEiX4UTLYsVTUQlcUY0SnQTZHYldwHFZvjFR2YVZHYlcwHFZvjFRyQTZHkicSMURQQkTRUkUgcVPGI1azDSVCUUahESUFgzazXjXvDkLWM2ZrEFNHIDSz4RZHYlZrElcUczXkAiUXMCLogzcHkWSz4RZHY1MVMld3TUXuQiUOglKosjcHIDR0U0QiUFLVg0LvjFR2gTdMQmKogjYLcjVmEzUYgCRBwDctjFRlwzUjMGLVkkdIcEY3fjPLQGUogjYHYEY1UTLhkGLogjcHIDRnslQhU2cVgEdvjFR1gDdKkic4sTSqQTTIkTUYMWQFIlcqwVXsUkZgoWRWQVN1M0TIEEURIUUVE1YAcjXuQSLYUDMFMFdqcDRqQiUXg1cVkkZvjFR2gjPHYWQrI1YvXUV5UEahkTTV8DZLc0X4E0UX8FMrgjYLYjVmQCags1cV8DZDkWSn4hTgsVSxH1YiYUVTs1QhsFLogzcHIDRy0TaXgCRn0jdHIDRx0TaXgCRRszcHg1S2nGURQzZpQ0ZvXEV1EzUZQ2Xw.ELI01XqEjTZQWPWMld3TUXuQiUOglKosjcHIDRuQiQhASTxb0bEYDY3fjTLgmXosjcHIDR0U0QiUFLVoEcvjFR2MiPLglK3EFLQIyUyUjQjgCRRwDdhk1R1gjPHk2YVgkcUY0Sn4RZKQiZCwjctLDS14xTNACSo0jLPkGS3gjPHk2ZWE1bUYzX3s1UOglKosDLHIDRns1QhcVSxHFNHIDSn4BZX8VPxDlbEwlX3fjPLg1Mn8zM2H0TIEEURIUUVE1YAcjXuQSLYUDMFMFdq01S2nGURQzZpQ0ZvXEV1EzUZQ2XVEEcQ0lXzDjTYQWQrgkbUYTV3fjTLglKBI1YIcEVyUkQisVRWIkZvjFRPsFajUSTvDFcUwFRlwjQZcFMrE1Z2Y0SnQTdMglKRE1ZMIiXmMlUYQ0ZGI1ZvjFR2gjPHMWSsgENHIESwfjPHIWSsgENHI0R2gDZOcidTIEQqoFUqAiUXYWPWoEciECTvjTaisVPRoEcAc0X5gSUg8FMV8DZtj1R1gjPH8FMFIFLQIyUyUjQjgCRRwDdhk1R1gjPHUWUGMVYvXkVzASZHY2LBwDZtfWXvDkLWMWQFQFNHIES3IVZKYGRBgTdmYEV1UkUOglKosjcHIDR4s1UgMWUFMFdqc0Sn4RZKACRBgDZqcjXm0jLhgCRBwDZtfFVuEjLgIWQrIFNHIDSncCZOcyMRMURQQkTRUkUgcVPGI1azDSVEQiQig2Zs8zM5QkTDslZTsFLVgkcAckVzMlUQQWTsIFMAIUVzUDaXIWUFkENHIESn4hPhcVRWg0bUYzXqkzURoFLogjc3XTXzDzQZUGMVQFTEwlXmACaHYFSFo0YzvVXqcmUOgFQ40DZtHUXq0jLhc1XVkEUqcjXqASZHYGRBgzbM0FV3fjTKcGRBgjbM0FV3fjTKcGRn8zM5QkTDslZTsFLVgkcAckVzMVLPASRsM1ZAIkVzEzUioGNUE1azX0Sn4RZKYGRBgzazXjXvDkLWMWQFQFNHIES3IVZKYGRBgTcUczXkAiUZQGLogjcyHDSn4BdgASTxb0bEYDY3fjTLgmXosjcHIDR4clUXYWUV8DZtj1R1gjPHk2ZWE1bUYzX3s1UOglKosDLHIDRns1QhcVSxHFNHIDSn4BZX8VPxDlbEwlX3fjPLg1Mn8zM2H0TIEEURIUUVE1YAcjXuQSLYUDMFMFdq01S2nGURQzZpQ0ZvXEV1EzUZQ2XVEEcQ0lXzDjTYQWQrgkbUYTV3fjTLglKBI1YIcEVyUkQisVRWIkZvjFRtUDahMGNrE1aMEiXPUDahcFLrgjYLYjVmQCags1cV8DZDkWSn4hTgsVSxH1YiYUVTs1QhsFLogzcHIDRy0TaXgCR30zLHIDRx0TaXgCRRszcHg1S2nGURQzZpQ0ZvXEV1EzUZQ2Xw.ELI01XqEjTZQWPWMld3TUXuQiUOglKosjcHIDRuQiQhASTxb0bEYDY3fjTLgmXosjcHIDR0U0QiUFLVoEcvjFR1MiPLglK3EFLQIyUyUjQjgCRRwDdhk1R1gjPHk2YVgkcUY0Sn4RZKYGRBgTdqcUXyUkQig2ZW8DZtj1RvfjPHg1ZGI1YMIiX3fjPLglKng0aAISXxUDahgCRBwDZ2f1S2biTSkTTTIkTUYUXmEzQh8FMwjUQzXzX3sVaOcidTIEQqoFUqAiUXYWPWoEciYUTzEUahQSPRkEcEwFVxUkQYgCRRwDZtHjXmkzUXMWUFM1ZIckTpASZHoWRWk0b3XTX0ETUXgWQVEFZtfGVtUDagQWUFEFNHIESn4hTgsVSxH1YiYUVTs1QhsFLogzcHIDRy0TaXgCR30DMHIDRx0TaXgCRRszcHg1S2nGURQzZpQ0ZvXEV1EzUZQ2Xw.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.idgoVUrgjYXcEVxU0UYgCRBwDctjFR0MyPOAUQrI1YvXUV5UEahYlKWgEdEYUXqE0UYg2ZDkENHglX0giUg0DNFkEL2YEV5sVLgQGNpE1SYwVVn4BZic1cVM1ZvjFR2MiPLg1Mn8zMtTEV3UjUgsVTWkEdAIjXmkzUXMWUFM1ZIckTpASZHgGNwD1bQQkV4E0UXQWSVkkPUYzXxTkUYQGLToUZM0FRlg0UXIWUWkENHIESxLiPLg1Mn8zM2HDUmkzUXMWUFM1ZIIiX4XWdKIENwD1bzLzSRgSLgMWPRokZvjFRocWLgkWUVM0aMEyU3gSLgMWRBgDcEYUXqASZHMzcwDVdUEyUMsVLXUVRvDVcvvFRlQkLhsVRW8DZtjFRlQkQY8VTWgEZ2YUV3fjPLglKRgUZQckVwTkUOglKogTN1MDUmkzUXMWUFM1ZIIiX4X2PTcVRWg0bUYzXqkzQHYWQrI1YvXUV5UEahkTTV8DZHISX0ASLT81aWkUdIIDRwTjQgASUV8DZtj1R1gDdKkicCQ0YIcEVyUkQisVRGgjcEwlXmAiUYoWUrIVRQY0SngjLgUGLVAEZMISX3EzQi8FNrEVSEYzXqkzUZc1cwHFZtf1XmcmUisFLogjcyHDSncCZOciKUgEdEYUXqE0UYgWPBI1YIcEVyUkQisVRWIkZvjFR3gSLgM2cToUdQcUVzUEahAENwH1aQckV0QCaHYFVWgkbUcUV3fDdLQmKogTcyLzSPUDahcFLVkkdUwlXl4xUXgWQVE1ZQcUV3sFQYgCRnIVc3XUXSgiUigWSVkEQUYTXms1USUWTVkEZtf1XmcmUisFLogjcyHDSncCZOciKUgEdEYUXqE0UYgWPBI1YIcEVyUkQisVRWIkZvjFR3gSLgMGL5ElZUcTXmE0UZUGMwLEc3nVVrkjPHESQFEFLUY0Sn4RZKYGR3sTN1MDUmkzUXMWUFM1ZIcDR1UDahcFLVkkdUwlXIEkUOgFRxDVcvXTTu0zQicFMwf0ZIQUV5M1UYsFMVM0aMEiXn4BZic1cVM1ZvjFR2IVZKYGR3sTN1k2RPUDahcFLVkkdUwlX4QyPOUGRvDVcvv1S2bCZTUGNVEVdzLzS0gDLgUGLwHVSEwVXmMlUYgGMC8TcHISX0ASLh8FLVMlbEYzX0kTaOciKxDVdqYzXugCag8FMwjUN1MjXmkzUXMWSs8zMtTETRUDUSYlZFkENHglX0giUgMENVMFdMYUVAQSLYIWUrgjYXcEVxU0UYgCRR4jcyHDSncCZOciKUAkTEQ0TlolQYgCRnIVc3XUXSgiUigWSVkEQqEiX5UDagkVUrgjYXcEVxU0UYgCR3wDctjFR0MyPOUmKWgEdEYUX4QyPOUmKxDVdqYzXugCag8FMwjUN1k2R1kjLg0VRWg0bzLzS4giUigWSVk0azvVV0EjTgcFMVMFaEECV5UUahsVRW8DZDQ0XpsVLgUFL5ElZUYTXuQSLYglKRE1YqwVXTUkQjoGLogzPUYTXxgCaHYFTxDlcQUUVyD0UOglYWwDZtfFV0E0QiUGLFU0ZmczX3fjTR4TSEUkTzHESn4BdXU2cwDFLIc0SngEaYsVSVgkZIkFVn4BdXUGLFIVczXUVzEkLT81aWkENHIDSn4BdhsVSFM1a3vVXMgiQYsFLogjcHg2R4XWdKk2XWg0bzLjKt3hKt3hKt3hKtXlTU0DUQAURWoULEYzXqEEUXoWQF4RPDYFTzDzUXkWSG4RPDYmKtnWPt3hKt3hKt3hKJUELPUTPqI1aYcEV5UkQQcVTWgEOujzPu0Fbu4VYtQmO77hUSQ0LPwVcmklaSQWXzUlO.."
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
                    "patching_rect": [ 32.0, 446.0, 167.0, 22.0 ],
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
                    "patching_rect": [ 44.0, 367.0, 104.0, 22.0 ],
                    "text": "udpreceive 57121"
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
                    "source": [ "obj-12", 0 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-33", 0 ],
                    "source": [ "obj-13", 0 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-48", 0 ],
                    "source": [ "obj-13", 1 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-7", 0 ],
                    "midpoints": [ 1701.5, 229.49869966506958, 1727.583334684372, 229.49869966506958, 1727.583334684372, 199.16666841506958, 1748.5, 199.16666841506958 ],
                    "source": [ "obj-13", 2 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-13", 0 ],
                    "midpoints": [ 1814.5, 263.1666684150696, 1834.583334684372, 263.1666684150696, 1834.583334684372, 188.16666841506958, 1617.5, 188.16666841506958 ],
                    "source": [ "obj-14", 1 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-13", 0 ],
                    "source": [ "obj-17", 0 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-3", 0 ],
                    "order": 0,
                    "source": [ "obj-2", 0 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-4", 0 ],
                    "order": 2,
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
                    "destination": [ "obj-13", 0 ],
                    "source": [ "obj-28", 0 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-47", 0 ],
                    "source": [ "obj-33", 0 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-6", 1 ],
                    "source": [ "obj-4", 1 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-6", 0 ],
                    "source": [ "obj-4", 0 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-13", 0 ],
                    "source": [ "obj-44", 0 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-54", 0 ],
                    "order": 0,
                    "source": [ "obj-45", 0 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-6", 1 ],
                    "order": 1,
                    "source": [ "obj-45", 0 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-54", 0 ],
                    "order": 0,
                    "source": [ "obj-46", 0 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-6", 1 ],
                    "order": 1,
                    "source": [ "obj-46", 0 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-54", 0 ],
                    "order": 0,
                    "source": [ "obj-49", 0 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-6", 1 ],
                    "order": 1,
                    "source": [ "obj-49", 0 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-54", 0 ],
                    "order": 0,
                    "source": [ "obj-50", 0 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-6", 1 ],
                    "order": 1,
                    "source": [ "obj-50", 0 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-54", 0 ],
                    "order": 0,
                    "source": [ "obj-51", 0 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-6", 1 ],
                    "order": 1,
                    "source": [ "obj-51", 0 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-39", 0 ],
                    "source": [ "obj-54", 1 ]
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
                    "destination": [ "obj-13", 0 ],
                    "midpoints": [ 1781.5, 231.84635591506958, 1833.735678434372, 231.84635591506958, 1833.735678434372, 188.16666841506958, 1617.5, 188.16666841506958 ],
                    "source": [ "obj-7", 1 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-14", 0 ],
                    "midpoints": [ 1814.5, 230.09244966506958, 1678.5, 230.09244966506958 ],
                    "source": [ "obj-7", 2 ]
                }
            }
        ],
        "parameters": {
            "obj-4": [ "vst~", "vst~", 0 ],
            "obj-6": [ "live.gain~", "live.gain~", 0 ],
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