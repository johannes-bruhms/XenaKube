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
        "rect": [ 2143.0, -42.0, 693.0, 738.0 ],
        "boxes": [
            {
                "box": {
                    "id": "obj-26",
                    "maxclass": "newobj",
                    "numinlets": 1,
                    "numoutlets": 1,
                    "outlettype": [ "signal" ],
                    "patching_rect": [ 64.1025647521019, 57.06837582588196, 46.0, 22.0 ],
                    "text": "r~ out2"
                }
            },
            {
                "box": {
                    "id": "obj-11",
                    "maxclass": "newobj",
                    "numinlets": 1,
                    "numoutlets": 1,
                    "outlettype": [ "signal" ],
                    "patching_rect": [ 35.042735397815704, 33.136751651763916, 46.0, 22.0 ],
                    "text": "r~ out1"
                }
            },
            {
                "box": {
                    "id": "obj-29",
                    "lastchannelcount": 0,
                    "maxclass": "live.gain~",
                    "numinlets": 2,
                    "numoutlets": 5,
                    "outlettype": [ "signal", "signal", "", "float", "list" ],
                    "parameter_enable": 1,
                    "patching_rect": [ 35.042735397815704, 81.0, 48.0, 136.0 ],
                    "saved_attribute_attributes": {
                        "valueof": {
                            "parameter_longname": "live.gain~[3]",
                            "parameter_mmax": 6.0,
                            "parameter_mmin": -70.0,
                            "parameter_modmode": 3,
                            "parameter_shortname": "live.gain~[3]",
                            "parameter_type": 0,
                            "parameter_unitstyle": 4
                        }
                    },
                    "varname": "live.gain~"
                }
            },
            {
                "box": {
                    "id": "obj-28",
                    "maxclass": "newobj",
                    "numinlets": 0,
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
                        "rect": [ 596.0, 100.0, 1417.0, 782.0 ],
                        "boxes": [
                            {
                                "box": {
                                    "autosave": 1,
                                    "bgmode": 0,
                                    "border": 0,
                                    "clickthrough": 0,
                                    "id": "obj-1",
                                    "maxclass": "newobj",
                                    "numinlets": 2,
                                    "numoutlets": 8,
                                    "offset": [ 0.0, 0.0 ],
                                    "outlettype": [ "signal", "signal", "", "list", "int", "", "", "" ],
                                    "patching_rect": [ 387.0, 894.0, 92.5, 22.0 ],
                                    "save": [ "#N", "vst~", "loaduniqueid", 0, ";" ],
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
                                        "snapshot": {                                        },
                                        "snapshotlist": {
                                            "current_snapshot": 0,
                                            "entries": [
                                                {
                                                    "filetype": "C74Snapshot",
                                                    "version": 2,
                                                    "minorversion": 0,
                                                    "name": "",
                                                    "origin": "",
                                                    "type": "AudioUnit",
                                                    "subtype": "AudioEffect",
                                                    "embed": 0,
                                                    "snapshot": {                                                    },
                                                    "fileref": {
                                                        "name": "",
                                                        "filename": ".maxsnap",
                                                        "filepath": "~/Documents/Max 9/Snapshots",
                                                        "filepos": -1,
                                                        "snapshotfileid": "a41bc250669c7e8ea8a961ca95c9bd7b"
                                                    }
                                                }
                                            ]
                                        }
                                    },
                                    "text": "vst~",
                                    "varname": "vst~",
                                    "viewvisibility": 0
                                }
                            },
                            {
                                "box": {
                                    "fontname": "Arial",
                                    "fontsize": 13.0,
                                    "id": "obj-19",
                                    "maxclass": "newobj",
                                    "numinlets": 2,
                                    "numoutlets": 2,
                                    "outlettype": [ "signal", "bang" ],
                                    "patching_rect": [ 284.0708193182945, 606.1947390437126, 63.0, 23.0 ],
                                    "text": "line~ 200"
                                }
                            },
                            {
                                "box": {
                                    "fontname": "Arial",
                                    "fontsize": 13.0,
                                    "format": 6,
                                    "id": "obj-4",
                                    "maxclass": "flonum",
                                    "minimum": 0.0,
                                    "numinlets": 1,
                                    "numoutlets": 2,
                                    "outlettype": [ "", "bang" ],
                                    "parameter_enable": 0,
                                    "patching_rect": [ 284.0708193182945, 497.3451727628708, 54.0, 23.0 ]
                                }
                            },
                            {
                                "box": {
                                    "fontname": "Arial",
                                    "fontsize": 13.0,
                                    "id": "obj-21",
                                    "maxclass": "message",
                                    "numinlets": 2,
                                    "numoutlets": 1,
                                    "outlettype": [ "" ],
                                    "patching_rect": [ 284.0708193182945, 537.1681848168373, 49.0, 23.0 ],
                                    "text": "$1 500"
                                }
                            },
                            {
                                "box": {
                                    "id": "obj-26",
                                    "maxclass": "newobj",
                                    "numinlets": 1,
                                    "numoutlets": 0,
                                    "patching_rect": [ 57.25, 914.7291915416718, 48.0, 22.0 ],
                                    "text": "s~ out2"
                                }
                            },
                            {
                                "box": {
                                    "id": "obj-11",
                                    "maxclass": "newobj",
                                    "numinlets": 1,
                                    "numoutlets": 0,
                                    "patching_rect": [ 50.0, 890.7291915416718, 48.0, 22.0 ],
                                    "text": "s~ out1"
                                }
                            },
                            {
                                "box": {
                                    "id": "obj-18",
                                    "maxclass": "newobj",
                                    "numinlets": 1,
                                    "numoutlets": 1,
                                    "outlettype": [ "signal" ],
                                    "patching_rect": [ 147.0, 509.2166252732277, 72.0, 22.0 ],
                                    "text": "tapout~ 500"
                                }
                            },
                            {
                                "box": {
                                    "id": "obj-25",
                                    "maxclass": "newobj",
                                    "numinlets": 1,
                                    "numoutlets": 1,
                                    "outlettype": [ "tapconnect" ],
                                    "patching_rect": [ 147.0, 484.4303002357483, 72.0, 22.0 ],
                                    "text": "tapin~ 2000"
                                }
                            },
                            {
                                "box": {
                                    "id": "obj-140",
                                    "maxclass": "newobj",
                                    "numinlets": 1,
                                    "numoutlets": 1,
                                    "outlettype": [ "signal" ],
                                    "patching_rect": [ 137.25, 153.59269028902054, 72.0, 22.0 ],
                                    "text": "r~ fx-chain2"
                                }
                            },
                            {
                                "box": {
                                    "id": "obj-141",
                                    "maxclass": "newobj",
                                    "numinlets": 1,
                                    "numoutlets": 1,
                                    "outlettype": [ "signal" ],
                                    "patching_rect": [ 50.0, 153.59269028902054, 72.0, 22.0 ],
                                    "text": "r~ fx-chain1"
                                }
                            },
                            {
                                "box": {
                                    "id": "obj-135",
                                    "maxclass": "newobj",
                                    "numinlets": 4,
                                    "numoutlets": 2,
                                    "outlettype": [ "signal", "signal" ],
                                    "patching_rect": [ 50.0, 399.8149147629738, 169.0, 22.0 ],
                                    "text": "abl.dsp.saturator~ @mix 0.15",
                                    "varname": "abl.dsp.darkhall~_AA[2]"
                                }
                            },
                            {
                                "box": {
                                    "id": "obj-9",
                                    "maxclass": "comment",
                                    "numinlets": 1,
                                    "numoutlets": 0,
                                    "patching_rect": [ 625.8085868954659, 429.72944498062134, 151.0, 20.0 ],
                                    "text": "Adjust the output gain (dB)"
                                }
                            },
                            {
                                "box": {
                                    "id": "obj-130",
                                    "maxclass": "comment",
                                    "numinlets": 1,
                                    "numoutlets": 0,
                                    "patching_rect": [ 648.290604352951, 398.9602138996124, 215.0, 20.0 ],
                                    "text": "Enable/disable built-in post-FX clipper"
                                }
                            },
                            {
                                "box": {
                                    "id": "obj-131",
                                    "maxclass": "comment",
                                    "numinlets": 1,
                                    "numoutlets": 0,
                                    "patching_rect": [ 602.7316635847092, 369.0456836819649, 202.0, 20.0 ],
                                    "text": "Enable/disable built-in DC blocker"
                                }
                            },
                            {
                                "box": {
                                    "attr": "dcblock",
                                    "id": "obj-132",
                                    "maxclass": "attrui",
                                    "numinlets": 1,
                                    "numoutlets": 1,
                                    "outlettype": [ "" ],
                                    "parameter_enable": 0,
                                    "patching_rect": [ 466.83422631025314, 369.0456836819649, 130.0, 22.0 ]
                                }
                            },
                            {
                                "box": {
                                    "attr": "post_clip",
                                    "id": "obj-133",
                                    "maxclass": "attrui",
                                    "numinlets": 1,
                                    "numoutlets": 1,
                                    "outlettype": [ "" ],
                                    "parameter_enable": 0,
                                    "patching_rect": [ 467.094021320343, 398.9602138996124, 185.47008734941483, 22.0 ]
                                }
                            },
                            {
                                "box": {
                                    "attr": "gain",
                                    "id": "obj-134",
                                    "maxclass": "attrui",
                                    "numinlets": 1,
                                    "numoutlets": 1,
                                    "outlettype": [ "" ],
                                    "parameter_enable": 0,
                                    "patching_rect": [ 466.83422631025314, 429.72944498062134, 150.0, 22.0 ]
                                }
                            },
                            {
                                "box": {
                                    "id": "obj-20",
                                    "linecount": 3,
                                    "maxclass": "comment",
                                    "numinlets": 1,
                                    "numoutlets": 0,
                                    "patching_rect": [ 648.290604352951, 100.0, 181.0, 48.0 ],
                                    "text": "Soft = waveshaping\nMedium = limiting\nHard = clipping with bass boost"
                                }
                            },
                            {
                                "box": {
                                    "id": "obj-117",
                                    "maxclass": "newobj",
                                    "numinlets": 5,
                                    "numoutlets": 2,
                                    "outlettype": [ "signal", "signal" ],
                                    "patching_rect": [ 50.0, 292.3076942563057, 639.0, 22.0 ],
                                    "text": "abl.device.drumbuss~ 1. 0. 1. @drive 0.5 @boomfreq 64.4 @boom 1 @decay 1 @transients 1 @distortion 0 @mix 0.7"
                                }
                            },
                            {
                                "box": {
                                    "attr": "drive",
                                    "id": "obj-103",
                                    "maxclass": "attrui",
                                    "numinlets": 1,
                                    "numoutlets": 1,
                                    "outlettype": [ "" ],
                                    "parameter_enable": 0,
                                    "patching_rect": [ 466.83422631025314, 289.5585033893585, 121.0, 22.0 ],
                                    "text_width": 64.0
                                }
                            },
                            {
                                "box": {
                                    "attr": "mix",
                                    "id": "obj-104",
                                    "maxclass": "attrui",
                                    "numinlets": 1,
                                    "numoutlets": 1,
                                    "outlettype": [ "" ],
                                    "parameter_enable": 0,
                                    "patching_rect": [ 466.83422631025314, 314.3448284268379, 121.0, 22.0 ],
                                    "text_width": 64.0
                                }
                            },
                            {
                                "box": {
                                    "attr": "curve",
                                    "id": "obj-105",
                                    "maxclass": "attrui",
                                    "numinlets": 1,
                                    "numoutlets": 1,
                                    "outlettype": [ "" ],
                                    "parameter_enable": 0,
                                    "patching_rect": [ 466.83422631025314, 339.9858543276787, 164.0, 22.0 ],
                                    "text_width": 64.0
                                }
                            },
                            {
                                "box": {
                                    "filename": "onehot.js",
                                    "id": "obj-72",
                                    "maxclass": "newobj",
                                    "numinlets": 1,
                                    "numoutlets": 7,
                                    "outlettype": [ "", "", "", "", "", "", "" ],
                                    "patching_rect": [ 880.7692391872406, 482.7208985090256, 66.36842060089089, 22.0 ],
                                    "saved_object_attributes": {
                                        "parameter_enable": 0
                                    },
                                    "text": "v8 onehot",
                                    "textfile": {
                                        "filename": "onehot.js",
                                        "flags": 0,
                                        "embed": 0,
                                        "autowatch": 1
                                    }
                                }
                            },
                            {
                                "box": {
                                    "disabled": [ 0, 0, 0, 0, 0, 0, 0 ],
                                    "id": "obj-66",
                                    "itemtype": 0,
                                    "maxclass": "radiogroup",
                                    "numinlets": 1,
                                    "numoutlets": 1,
                                    "outlettype": [ "" ],
                                    "parameter_enable": 0,
                                    "patching_rect": [ 673.9316302537918, 521.1824373602867, 19.07894718647003, 114.0 ],
                                    "shape": 1,
                                    "size": 7,
                                    "style": "rnbohighcontrast",
                                    "value": 0
                                }
                            },
                            {
                                "box": {
                                    "attr": "enable",
                                    "id": "obj-41",
                                    "maxclass": "attrui",
                                    "numinlets": 1,
                                    "numoutlets": 1,
                                    "outlettype": [ "" ],
                                    "parameter_enable": 0,
                                    "patching_rect": [ 961.9469800591469, 715.9292611479759, 150.0, 22.0 ]
                                }
                            },
                            {
                                "box": {
                                    "id": "obj-39",
                                    "maxclass": "newobj",
                                    "numinlets": 1,
                                    "numoutlets": 2,
                                    "outlettype": [ "signal", "signal" ],
                                    "patching_rect": [ 629.3085868954659, 737.1682009100914, 144.0, 22.0 ],
                                    "text": "nn~ percussion forward 0"
                                }
                            },
                            {
                                "box": {
                                    "id": "obj-33",
                                    "maxclass": "newobj",
                                    "numinlets": 1,
                                    "numoutlets": 1,
                                    "outlettype": [ "signal" ],
                                    "patching_rect": [ 50.0, 509.2166252732277, 72.0, 22.0 ],
                                    "text": "tapout~ 500"
                                }
                            },
                            {
                                "box": {
                                    "id": "obj-32",
                                    "maxclass": "newobj",
                                    "numinlets": 1,
                                    "numoutlets": 1,
                                    "outlettype": [ "tapconnect" ],
                                    "patching_rect": [ 50.0, 484.4303002357483, 72.0, 22.0 ],
                                    "text": "tapin~ 2000"
                                }
                            },
                            {
                                "box": {
                                    "attr": "enable",
                                    "id": "obj-62",
                                    "maxclass": "attrui",
                                    "numinlets": 1,
                                    "numoutlets": 1,
                                    "outlettype": [ "" ],
                                    "parameter_enable": 0,
                                    "patching_rect": [ 896.5587127208709, 553.9823454618454, 150.0, 22.0 ]
                                }
                            },
                            {
                                "box": {
                                    "id": "obj-63",
                                    "maxclass": "newobj",
                                    "numinlets": 1,
                                    "numoutlets": 2,
                                    "outlettype": [ "signal", "signal" ],
                                    "patching_rect": [ 708.1196647882462, 561.1681848168373, 118.0, 22.0 ],
                                    "text": "nn~ VCTK forward 0"
                                }
                            },
                            {
                                "box": {
                                    "attr": "enable",
                                    "id": "obj-58",
                                    "maxclass": "attrui",
                                    "numinlets": 1,
                                    "numoutlets": 1,
                                    "outlettype": [ "" ],
                                    "parameter_enable": 0,
                                    "patching_rect": [ 813.2744017243385, 662.8319117426872, 150.0, 22.0 ]
                                }
                            },
                            {
                                "box": {
                                    "id": "obj-57",
                                    "maxclass": "newobj",
                                    "numinlets": 1,
                                    "numoutlets": 1,
                                    "outlettype": [ "signal" ],
                                    "patching_rect": [ 679.6460723876953, 662.8319117426872, 112.0, 22.0 ],
                                    "text": "nn~ nasa forward 0"
                                }
                            },
                            {
                                "box": {
                                    "attr": "enable",
                                    "id": "obj-55",
                                    "maxclass": "attrui",
                                    "numinlets": 1,
                                    "numoutlets": 1,
                                    "outlettype": [ "" ],
                                    "parameter_enable": 0,
                                    "patching_rect": [ 880.5310443043709, 513.2743775844574, 150.0, 22.0 ]
                                }
                            },
                            {
                                "box": {
                                    "id": "obj-50",
                                    "maxclass": "newobj",
                                    "numinlets": 1,
                                    "numoutlets": 1,
                                    "outlettype": [ "signal" ],
                                    "patching_rect": [ 707.9646587371826, 537.1681848168373, 123.0, 22.0 ],
                                    "text": "nn~ isis_np forward 0"
                                }
                            },
                            {
                                "box": {
                                    "id": "obj-48",
                                    "maxclass": "newobj",
                                    "numinlets": 1,
                                    "numoutlets": 1,
                                    "outlettype": [ "signal" ],
                                    "patching_rect": [ 405.5555591583252, 518.6183347702026, 43.0, 22.0 ],
                                    "text": "r~ nno"
                                }
                            },
                            {
                                "box": {
                                    "id": "obj-47",
                                    "maxclass": "newobj",
                                    "numinlets": 1,
                                    "numoutlets": 0,
                                    "patching_rect": [ 789.3805944919586, 767.2566989064217, 45.0, 22.0 ],
                                    "text": "s~ nno"
                                }
                            },
                            {
                                "box": {
                                    "id": "obj-43",
                                    "maxclass": "newobj",
                                    "numinlets": 1,
                                    "numoutlets": 1,
                                    "outlettype": [ "signal" ],
                                    "patching_rect": [ 555.5555373430252, 531.1110936999321, 36.0, 22.0 ],
                                    "text": "r~ nn"
                                }
                            },
                            {
                                "box": {
                                    "id": "obj-42",
                                    "maxclass": "newobj",
                                    "numinlets": 1,
                                    "numoutlets": 0,
                                    "patching_rect": [ 408.97436261177063, 477.5926933288574, 38.0, 22.0 ],
                                    "text": "s~ nn"
                                }
                            },
                            {
                                "box": {
                                    "id": "obj-28",
                                    "linecount": 5,
                                    "maxclass": "comment",
                                    "numinlets": 1,
                                    "numoutlets": 0,
                                    "patching_rect": [ 1052.5641127228737, 456.2208985090256, 150.0, 75.0 ],
                                    "text": "percussion\nnasa\nisis\nvctk\nsol_full_NP"
                                }
                            },
                            {
                                "box": {
                                    "id": "obj-17",
                                    "maxclass": "newobj",
                                    "numinlets": 1,
                                    "numoutlets": 1,
                                    "outlettype": [ "" ],
                                    "patching_rect": [ 880.7692391872406, 509.2166252732277, 70.0, 22.0 ],
                                    "text": "loadmess 0"
                                }
                            },
                            {
                                "box": {
                                    "id": "obj-16",
                                    "lastchannelcount": 0,
                                    "maxclass": "live.gain~",
                                    "numinlets": 2,
                                    "numoutlets": 5,
                                    "outlettype": [ "signal", "signal", "", "float", "list" ],
                                    "parameter_enable": 1,
                                    "patching_rect": [ 50.0, 742.5499609708786, 48.0, 136.0 ],
                                    "saved_attribute_attributes": {
                                        "valueof": {
                                            "parameter_longname": "live.gain~[2]",
                                            "parameter_mmax": 6.0,
                                            "parameter_mmin": -70.0,
                                            "parameter_modmode": 3,
                                            "parameter_shortname": "live.gain~",
                                            "parameter_type": 0,
                                            "parameter_unitstyle": 4
                                        }
                                    },
                                    "varname": "live.gain~[2]"
                                }
                            },
                            {
                                "box": {
                                    "id": "obj-24",
                                    "lastchannelcount": 0,
                                    "maxclass": "live.gain~",
                                    "numinlets": 2,
                                    "numoutlets": 5,
                                    "outlettype": [ "signal", "signal", "", "float", "list" ],
                                    "parameter_enable": 1,
                                    "patching_rect": [ 391.0256444811821, 555.3704718947411, 48.0, 136.0 ],
                                    "saved_attribute_attributes": {
                                        "valueof": {
                                            "parameter_longname": "live.gain~[1]",
                                            "parameter_mmax": 6.0,
                                            "parameter_mmin": -70.0,
                                            "parameter_modmode": 3,
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
                                    "id": "obj-14",
                                    "linecount": 29,
                                    "maxclass": "comment",
                                    "numinlets": 1,
                                    "numoutlets": 0,
                                    "patching_rect": [ 1199.5726612210274, 626.3106435537338, 150.0, 407.0 ],
                                    "text": "additive_1024.ts\nadditive_8192.ts\nchafe_cello.ts\ndarbouka.ts\ndarbouka_onnx.ts\ndemo_attributes.ts\ndemo_buffers.ts\ndemo_mc.ts\ndowntempo_house.ts\neffects.ts\nfeatures.ts\nisis_NP.ts\nmusicnet.ts\nnasa.ts\nnn~.maxhelp\noldsynths.ts\noldsynths_new.ts\nordinario_1024.ts\nordinario_8192.ts\npercussion.ts\nrave_chafe_data_rt.ts\nsol_full_NP.ts\nsol_ordinario_fast_NP.ts\nsol_ordinario_NP.ts\nvae_cities.ts\nVCTK.ts\nvintage.ts\nwavetable.ts\nwheel.ts"
                                }
                            },
                            {
                                "box": {
                                    "id": "obj-46",
                                    "maxclass": "live.scope~",
                                    "numinlets": 2,
                                    "numoutlets": 1,
                                    "outlettype": [ "bang" ],
                                    "patching_rect": [ 265.01806902885437, 738.0713119506836, 184.98193097114563, 69.0 ]
                                }
                            },
                            {
                                "box": {
                                    "id": "obj-52",
                                    "maxclass": "newobj",
                                    "numinlets": 3,
                                    "numoutlets": 3,
                                    "outlettype": [ "signal", "signal", "signal" ],
                                    "patching_rect": [ 50.0, 711.7807298898697, 400.0, 22.0 ],
                                    "text": "abl.device.limiter~ @maximize 1 @threshold -6. @mode 1 @lookahead 6"
                                }
                            },
                            {
                                "box": {
                                    "id": "obj-31",
                                    "maxclass": "newobj",
                                    "numinlets": 1,
                                    "numoutlets": 1,
                                    "outlettype": [ "signal" ],
                                    "patching_rect": [ 137.25, 225.45593863725662, 186.0, 22.0 ],
                                    "text": "abl.dsp.compander~ @shape 0.1"
                                }
                            },
                            {
                                "box": {
                                    "id": "obj-30",
                                    "maxclass": "newobj",
                                    "numinlets": 1,
                                    "numoutlets": 1,
                                    "outlettype": [ "signal" ],
                                    "patching_rect": [ 50.0, 199.81491273641586, 186.0, 22.0 ],
                                    "text": "abl.dsp.compander~ @shape 0.1"
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
                                    "patching_rect": [ 50.0, 555.3704718947411, 48.0, 136.0 ],
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
                            }
                        ],
                        "lines": [
                            {
                                "patchline": {
                                    "destination": [ "obj-135", 0 ],
                                    "midpoints": [ 476.33422631025314, 313.0713119506836, 459.8803412914276, 313.0713119506836, 459.8803412914276, 385.0713119506836, 59.5, 385.0713119506836 ],
                                    "source": [ "obj-103", 0 ]
                                }
                            },
                            {
                                "patchline": {
                                    "destination": [ "obj-135", 0 ],
                                    "midpoints": [ 476.33422631025314, 381.51575684547424, 59.5, 381.51575684547424 ],
                                    "source": [ "obj-104", 0 ]
                                }
                            },
                            {
                                "patchline": {
                                    "destination": [ "obj-135", 0 ],
                                    "midpoints": [ 476.33422631025314, 386.2935343980789, 59.5, 386.2935343980789 ],
                                    "source": [ "obj-105", 0 ]
                                }
                            },
                            {
                                "patchline": {
                                    "destination": [ "obj-135", 1 ],
                                    "source": [ "obj-117", 1 ]
                                }
                            },
                            {
                                "patchline": {
                                    "destination": [ "obj-135", 0 ],
                                    "source": [ "obj-117", 0 ]
                                }
                            },
                            {
                                "patchline": {
                                    "destination": [ "obj-135", 0 ],
                                    "midpoints": [ 476.33422631025314, 391.0713119506836, 228.96581107378006, 391.0713119506836, 228.96581107378006, 385.0713119506836, 59.5, 385.0713119506836 ],
                                    "source": [ "obj-132", 0 ]
                                }
                            },
                            {
                                "patchline": {
                                    "destination": [ "obj-135", 0 ],
                                    "midpoints": [ 476.594021320343, 382.60977309942245, 228.96581107378006, 382.60977309942245, 228.96581107378006, 385.0713119506836, 59.5, 385.0713119506836 ],
                                    "source": [ "obj-133", 0 ]
                                }
                            },
                            {
                                "patchline": {
                                    "destination": [ "obj-135", 0 ],
                                    "midpoints": [ 476.33422631025314, 387.4046446084976, 228.96581107378006, 387.4046446084976, 228.96581107378006, 385.0713119506836, 59.5, 385.0713119506836 ],
                                    "source": [ "obj-134", 0 ]
                                }
                            },
                            {
                                "patchline": {
                                    "destination": [ "obj-25", 0 ],
                                    "order": 1,
                                    "source": [ "obj-135", 1 ]
                                }
                            },
                            {
                                "patchline": {
                                    "destination": [ "obj-32", 0 ],
                                    "order": 1,
                                    "source": [ "obj-135", 0 ]
                                }
                            },
                            {
                                "patchline": {
                                    "destination": [ "obj-42", 0 ],
                                    "order": 0,
                                    "source": [ "obj-135", 1 ]
                                }
                            },
                            {
                                "patchline": {
                                    "destination": [ "obj-42", 0 ],
                                    "order": 0,
                                    "source": [ "obj-135", 0 ]
                                }
                            },
                            {
                                "patchline": {
                                    "destination": [ "obj-31", 0 ],
                                    "source": [ "obj-140", 0 ]
                                }
                            },
                            {
                                "patchline": {
                                    "destination": [ "obj-30", 0 ],
                                    "source": [ "obj-141", 0 ]
                                }
                            },
                            {
                                "patchline": {
                                    "destination": [ "obj-11", 0 ],
                                    "source": [ "obj-16", 0 ]
                                }
                            },
                            {
                                "patchline": {
                                    "destination": [ "obj-26", 0 ],
                                    "source": [ "obj-16", 1 ]
                                }
                            },
                            {
                                "patchline": {
                                    "destination": [ "obj-41", 0 ],
                                    "order": 0,
                                    "source": [ "obj-17", 0 ]
                                }
                            },
                            {
                                "patchline": {
                                    "destination": [ "obj-55", 0 ],
                                    "order": 2,
                                    "source": [ "obj-17", 0 ]
                                }
                            },
                            {
                                "patchline": {
                                    "destination": [ "obj-58", 0 ],
                                    "order": 3,
                                    "source": [ "obj-17", 0 ]
                                }
                            },
                            {
                                "patchline": {
                                    "destination": [ "obj-62", 0 ],
                                    "order": 1,
                                    "source": [ "obj-17", 0 ]
                                }
                            },
                            {
                                "patchline": {
                                    "destination": [ "obj-6", 1 ],
                                    "source": [ "obj-18", 0 ]
                                }
                            },
                            {
                                "patchline": {
                                    "destination": [ "obj-18", 0 ],
                                    "order": 0,
                                    "source": [ "obj-19", 0 ]
                                }
                            },
                            {
                                "patchline": {
                                    "destination": [ "obj-33", 0 ],
                                    "order": 1,
                                    "source": [ "obj-19", 0 ]
                                }
                            },
                            {
                                "patchline": {
                                    "destination": [ "obj-19", 0 ],
                                    "source": [ "obj-21", 0 ]
                                }
                            },
                            {
                                "patchline": {
                                    "destination": [ "obj-52", 1 ],
                                    "source": [ "obj-24", 1 ]
                                }
                            },
                            {
                                "patchline": {
                                    "destination": [ "obj-52", 0 ],
                                    "source": [ "obj-24", 0 ]
                                }
                            },
                            {
                                "patchline": {
                                    "destination": [ "obj-18", 0 ],
                                    "source": [ "obj-25", 0 ]
                                }
                            },
                            {
                                "patchline": {
                                    "destination": [ "obj-117", 0 ],
                                    "source": [ "obj-30", 0 ]
                                }
                            },
                            {
                                "patchline": {
                                    "destination": [ "obj-117", 1 ],
                                    "source": [ "obj-31", 0 ]
                                }
                            },
                            {
                                "patchline": {
                                    "destination": [ "obj-33", 0 ],
                                    "source": [ "obj-32", 0 ]
                                }
                            },
                            {
                                "patchline": {
                                    "destination": [ "obj-6", 0 ],
                                    "source": [ "obj-33", 0 ]
                                }
                            },
                            {
                                "patchline": {
                                    "destination": [ "obj-47", 0 ],
                                    "source": [ "obj-39", 0 ]
                                }
                            },
                            {
                                "patchline": {
                                    "destination": [ "obj-21", 0 ],
                                    "source": [ "obj-4", 0 ]
                                }
                            },
                            {
                                "patchline": {
                                    "destination": [ "obj-39", 0 ],
                                    "source": [ "obj-41", 0 ]
                                }
                            },
                            {
                                "patchline": {
                                    "destination": [ "obj-39", 0 ],
                                    "order": 3,
                                    "source": [ "obj-43", 0 ]
                                }
                            },
                            {
                                "patchline": {
                                    "destination": [ "obj-50", 0 ],
                                    "order": 1,
                                    "source": [ "obj-43", 0 ]
                                }
                            },
                            {
                                "patchline": {
                                    "destination": [ "obj-57", 0 ],
                                    "order": 2,
                                    "source": [ "obj-43", 0 ]
                                }
                            },
                            {
                                "patchline": {
                                    "destination": [ "obj-63", 0 ],
                                    "order": 0,
                                    "source": [ "obj-43", 0 ]
                                }
                            },
                            {
                                "patchline": {
                                    "destination": [ "obj-24", 1 ],
                                    "order": 0,
                                    "source": [ "obj-48", 0 ]
                                }
                            },
                            {
                                "patchline": {
                                    "destination": [ "obj-24", 0 ],
                                    "order": 1,
                                    "source": [ "obj-48", 0 ]
                                }
                            },
                            {
                                "patchline": {
                                    "destination": [ "obj-47", 0 ],
                                    "source": [ "obj-50", 0 ]
                                }
                            },
                            {
                                "patchline": {
                                    "destination": [ "obj-16", 1 ],
                                    "order": 0,
                                    "source": [ "obj-52", 0 ]
                                }
                            },
                            {
                                "patchline": {
                                    "destination": [ "obj-16", 0 ],
                                    "order": 1,
                                    "source": [ "obj-52", 0 ]
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
                                    "destination": [ "obj-50", 0 ],
                                    "source": [ "obj-55", 0 ]
                                }
                            },
                            {
                                "patchline": {
                                    "destination": [ "obj-39", 0 ],
                                    "order": 1,
                                    "source": [ "obj-57", 0 ]
                                }
                            },
                            {
                                "patchline": {
                                    "destination": [ "obj-47", 0 ],
                                    "order": 0,
                                    "source": [ "obj-57", 0 ]
                                }
                            },
                            {
                                "patchline": {
                                    "destination": [ "obj-57", 0 ],
                                    "source": [ "obj-58", 0 ]
                                }
                            },
                            {
                                "patchline": {
                                    "destination": [ "obj-52", 1 ],
                                    "source": [ "obj-6", 1 ]
                                }
                            },
                            {
                                "patchline": {
                                    "destination": [ "obj-52", 0 ],
                                    "source": [ "obj-6", 0 ]
                                }
                            },
                            {
                                "patchline": {
                                    "destination": [ "obj-63", 0 ],
                                    "source": [ "obj-62", 0 ]
                                }
                            },
                            {
                                "patchline": {
                                    "destination": [ "obj-47", 0 ],
                                    "source": [ "obj-63", 0 ]
                                }
                            },
                            {
                                "patchline": {
                                    "destination": [ "obj-72", 0 ],
                                    "source": [ "obj-66", 0 ]
                                }
                            },
                            {
                                "patchline": {
                                    "destination": [ "obj-41", 0 ],
                                    "source": [ "obj-72", 4 ]
                                }
                            },
                            {
                                "patchline": {
                                    "destination": [ "obj-55", 0 ],
                                    "source": [ "obj-72", 1 ]
                                }
                            },
                            {
                                "patchline": {
                                    "destination": [ "obj-58", 0 ],
                                    "source": [ "obj-72", 3 ]
                                }
                            },
                            {
                                "patchline": {
                                    "destination": [ "obj-62", 0 ],
                                    "source": [ "obj-72", 2 ]
                                }
                            }
                        ],
                        "styles": [
                            {
                                "name": "rnbohighcontrast",
                                "default": {
                                    "accentcolor": [ 0.666666666666667, 0.666666666666667, 0.666666666666667, 1.0 ],
                                    "bgcolor": [ 0.0, 0.0, 0.0, 1.0 ],
                                    "bgfillcolor": {
                                        "angle": 270.0,
                                        "autogradient": 0.0,
                                        "color": [ 0.0, 0.0, 0.0, 1.0 ],
                                        "color1": [ 0.090196078431373, 0.090196078431373, 0.090196078431373, 1.0 ],
                                        "color2": [ 0.156862745098039, 0.168627450980392, 0.164705882352941, 1.0 ],
                                        "proportion": 0.5,
                                        "type": "color"
                                    },
                                    "clearcolor": [ 1.0, 1.0, 1.0, 0.0 ],
                                    "color": [ 1.0, 0.874509803921569, 0.141176470588235, 1.0 ],
                                    "editing_bgcolor": [ 0.258823529411765, 0.258823529411765, 0.258823529411765, 1.0 ],
                                    "elementcolor": [ 0.223386004567146, 0.254748553037643, 0.998085916042328, 1.0 ],
                                    "fontsize": [ 13.0 ],
                                    "locked_bgcolor": [ 0.258823529411765, 0.258823529411765, 0.258823529411765, 1.0 ],
                                    "selectioncolor": [ 0.301960784313725, 0.694117647058824, 0.949019607843137, 1.0 ],
                                    "stripecolor": [ 0.258823529411765, 0.258823529411765, 0.258823529411765, 1.0 ],
                                    "textcolor": [ 1.0, 1.0, 1.0, 1.0 ],
                                    "textcolor_inverse": [ 1.0, 1.0, 1.0, 1.0 ]
                                },
                                "parentstyle": "",
                                "multi": 0
                            }
                        ]
                    },
                    "patching_rect": [ 34.042735397815704, 474.0, 50.0, 22.0 ],
                    "text": "p polish"
                }
            },
            {
                "box": {
                    "id": "obj-139",
                    "maxclass": "newobj",
                    "numinlets": 1,
                    "numoutlets": 0,
                    "patching_rect": [ 107.0427353978157, 443.4871823191643, 74.0, 22.0 ],
                    "text": "s~ fx-chain2"
                }
            },
            {
                "box": {
                    "id": "obj-138",
                    "maxclass": "newobj",
                    "numinlets": 1,
                    "numoutlets": 0,
                    "patching_rect": [ 35.042735397815704, 443.4871823191643, 74.0, 22.0 ],
                    "text": "s~ fx-chain1"
                }
            },
            {
                "box": {
                    "autosave": 1,
                    "bgmode": 0,
                    "border": 0,
                    "clickthrough": 0,
                    "id": "obj-13",
                    "maxclass": "newobj",
                    "numinlets": 2,
                    "numoutlets": 8,
                    "offset": [ 0.0, 0.0 ],
                    "outlettype": [ "signal", "signal", "", "list", "int", "", "", "" ],
                    "patching_rect": [ 35.042735397815704, 410.4871823191643, 147.63247740268707, 22.0 ],
                    "save": [ "#N", "vst~", "loaduniqueid", 0, "SWAM Cello 3", ";" ],
                    "saved_attribute_attributes": {
                        "valueof": {
                            "parameter_initial": [
                                {
                                    "filetype": "C74Snapshot",
                                    "version": 2,
                                    "minorversion": 0,
                                    "name": "SWAM Cello 3",
                                    "origin": "SWAM Cello 3.vst3info",
                                    "type": "VST3",
                                    "subtype": "Instrument",
                                    "embed": 1,
                                    "snapshot": {
                                        "pluginname": "SWAM Cello 3.vst3info",
                                        "plugindisplayname": "SWAM Cello 3",
                                        "pluginsavedname": "",
                                        "pluginsaveduniqueid": -298341311,
                                        "version": 1,
                                        "isbank": 0,
                                        "isbase64": 1,
                                        "blob": "22381.VMjLgP1U...O+fWarAhckI2bo8la8HRLt.iHfTlai8FYo41Y8HRUTYTK3HxO9.BOVMEUy.Ea0cVZtMEcgQWY9vSRC8Vav8lak4Fc9DiM2.CLtXUSGM1UA4hKtXlKt3hKP4hKt3hKtvjdXQ2bD4hKDQTRFkjdP4VPt3hKHYGUoUULL4BS1IjKt3hKtPjKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hK24VUCkzTHcTPD4hK1k2Sy.iQgYFVWkEdMckV0QiUOgFQosjcHIDRqQSLXUWTVoEciY0SnQUQUYDLB4DZ2j1SlYWdhISQVElYPcEY1UkUOgFSEMFdqwVXs0TaHYFVWkEdMckV0QiUOgFVogjYHcEVzMlUYgCR3wTL1IjSzfjPHoWQwjUdvjFRA0TLgASSGM1aMwFRlwjLgwVTxL1YIcUVVUEahk2ZwDFcvjFR4MiTLc2LBwDZtfmXzPSLXwDNwfUbvjFR2gDZOcCTVgkdUYzXuAiUYYFVWgkbUcUV3fDZQg2ZFgTPA0lXlgzPMYFRCwTMHMUS0vzTMYFRCwDdXkVRoQzPLYCR3sTN1MjX3gSLYgWQVElYyXEVyUkUOglYWkEcEEiVvjjUYUVRogTN1MjX00zUZo2ZwDFcAgGVoEzPLgCRRszcHIDRo0TLLgmdogzbDkFRl4hLXgCRRszcHg2R4X2PgUWSwnUdAgmX0UUagoVUrEVaqwVXqASZHYGRBgzbqYTVuAiUXYWPWoEciY0Sn4RZHYldVoUZIISX5UUag8FMwjENHIDSn4BZhUGNVEVdqYUXvbmUXoGNrIFNHIDSncCZOcCSxDFLzXTVqQSLY8FMVkUN1MjXmkzUXMWSs8zMtTETRUDUSYlZFkENHIUTQUEagcVRFE1ZQwFRlg0UXIWUWkENHIDSz4RZHU2LC8DTEoFUAACQH8VTV8DZTQEUtsVLY41XTg0azvFRlg0UXIWUWkENHIDSz4RZHU2LC8DTEoFUAACQH8VTV8DZTQEUxgSLicTQVoEcIIDRwTjQgASUV8DZtj1R1gDdKkicCQUPIUETMEjTZoFLogTQEUUXuEEaQgWUVIFZtf1XmcmUisFLogjLTMDSzQUZHU2LC8DTEoFUAACQH8VTV8DZTQEUyslQYcTQVoEcIIDRwTjQgASUV8DZtj1R1gDdKkicCQUPIUETMEjTZoFLogTSEwVXvTjQgQURWk0b3XTX0AidgoVUrgjYXcEVxU0UYgCRBwDctjFR0MyPOAUQpQUPvPDRuEkUOglKUoUMucTU0QiUYglKnM1Y2Y0XqASZHY2LR0DLtLDS14xPLcGQS4DdtLkS3oVZHU2LC8DTEoFUAACQH8VTV8DZDECVo0TQiQycVkEZtf1XmcmUisFLogjcyHjSx3xPLYmKCwjcPkWSwXVdLICQo0DZ2f1S23RUPIUQTMkYpYTV3fjTXIWTsE0azDSVPUDahcFLrgjYXcEVxU0UYgCRBwDctjFR0MyPOAUQpQUPvPDRuEkUOgFQFMVbIUEVyEzQU8FLVkEZtf1XmcmUisFLogjdyHDSncCZOciKUAkTEQ0TlolQYgCRRgELQISXDUkQisVSFM1a3vVXTslUgsVRBgTLEYTXvTkUOgFQowDctjFR0MyPOAUQpQUPvPDRuEkUOgFRwDlLYoWX30jUYAUQrI1YvvFRlg0UXIWUWkENHIDSzwzTLYmKCwjctLDS3wzPNoGQC4DLlkFR0MyPOAUQpQUPvPDRuEkUOgFRwDlL2QkVrE0QTcVRWg0bIIDRwTjQgASUV8DZtj1R1gDdKkicCQUPIUETMEjTZoFLogDZ3DyXNgiUZkWUFQ0YIcEVykjPHESQFEFLUY0Sn4RZKACR3sTN1MDUAkTUP0TPRokZvjFRngSLiAENwH1aQckV0QiQTcVRWg0bIIDRwTjQgASUV8DZtj1R24xTMQiZS4DMpMjSx.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.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.iUgsVTsIFMvjFR1MiTMglKngEMAcEV40zUOglKogjYHYkV1giQgcVRW8DZtjFR0MyPOUmdTIEQqoFUqAiUXYWPWoEciYUTzEUahQCMC8TSqQTTIkTUYMWQFIlcqwVXsUkZgoWRWQlYTwVXmkjQgsVTV8DZDkFRl4xUXgWQVE1ZQcUV3sFQYgCRnM1aIwlXmEkLgIUQFM1ZIIDRoclUXQGMVkkbvjFR2IVZHYldVkUdMcEVsUkQUQSPWkENHIESn4hTgkWRV8DZDMkSn4hPgkWRV8DZ5IESnMyPO0zZDEURIUUVyUjQhY2ZrEVaMQ0X3k0UYYlZrElcUczXkAiUZQGLogjcyHDSn4hTZQWPWMld3TUXmc1UOgFQowjLyHDSn4BdgASTxb0bqwVX3fjPLQmKogjY2X0X5gSUgc1YW8DZDkFSxLiPLglK3IlaEYjXqASZHY2LBwDZtfmXz.iUgsVTsIFMvjFR1MiTMglKngEMAcEV40zUOglKogjYHYkV1giQgcVRW8DZtjFR0MyPOUmdTIEQqoFUqAiUXYWPWoEciYUTzEUahQCMC8TSqQTTIkTUYMWQFIlcqwVXsUkZgoWRWQlYTwVXmkjQgsVTV8DZDkFRl4xUXgWQVE1ZQcUV3sFQYgCRngUci0VT0kjLXsVPUgEdEYUXn4BdX4VQrEFcUYTX3fjTLICRBgzbUEiX4UTLYsVTUQlcUY0SnQTZHYldwHFZvjFR2IVZHYlcwHFZvjFRyQTZHkicSMURQQkTRUkUgcVPGI1azDSVCUUahESUFgzazXjXvDkLWM2ZrEFNHIDSz4RZHYlZrElcUczXkAiUXMCLogzcHkWSz4RZHY1MVMld3TUXuQiUOglKosjcHIDR0U0QiUFLVg0LvjFR2gTdMQmKogjYLcjVmEzUYgCRBwDctjFRlwzUjMGLVkkdIcEY3fjPLQGUogjYHYEY1UTLhkGLogjcHIDRnslQhU2cVgEdvjFR1gDdKkic4sTSqQTTIkTUYMWQFIlcqwVXsUkZgoWRWQVN1M0TIEEURIUUVE1YAcjXuQSLYUDMFMFdqcDRqQiUXg1cVkkZvjFR2gjPHYWQrI1YvXUV5UEahkTTV8DZHESXxDDLgk2ZFM1a3vVXPUDahcFLrgjYLYjVmQCags1cV8DZDkWSn4hTgsVSxH1YiYUVTs1QhsFLogzcHIDRy0TaXgCRRwTLHIDRx0TaXgCRRszcHg1S2nGURQzZpQ0ZvXEV1EzUZQ2Xw.ELI01XqEjTZQWPWMld3TUXuQiUOglKosjcHIDRuQiQhASTxb0bEYDY3fjTLgmXosjcHIDR0U0QiUFLVoEcvjFR1MiPLglK3EFLQIyUyUjQjgCRRwDdhk1R1gjPHk2YVgkcUY0Sn4RZKYGRBgTdqcUXyUkQig2ZW8DZtj1RvfjPHg1ZGI1YMIiX3fjPLglKng0aAISXxUDahgCRBwDZ2f1S2biTSkTTTIkTUYUXmEzQh8FMwjUQzXzX3sVaOcidTIEQqoFUqAiUXYWPWoEciYUTzEUahQSPRkEcEwFVxUkQYgCRRwDZtHjXmkzUXMWUFM1ZIckTpASZHoWRWk0b3XTX00TQhsVUFkEZtfGVtUDagQWUFEFNHIESn4hTgsVSxH1YiYUVTs1QhsFLogzcHIDRy0TaXgCRB4jcHIDRx0TaXgCRRszcHg1S2nGURQzZpQ0ZvXEV1EzUZQ2Xw.ELI01XqEjTZQWPWMld3TUXuQiUOglKosjcHIDRuQiQhASTxb0bEYDY3fjTLgmXosjcHIDR0U0QiUFLVoEcvjFR1MiPLglK3EFLQIyUyUjQjgCRRwDdhk1R1gjPHk2YVgkcUY0Sn4RZKYGRBgTdqcUXyUkQig2ZW8DZtj1RvfjPHg1ZGI1YMIiX3fjPLglKng0aAISXxUDahgCRBwDZ2f1S2biTSkTTTIkTUYUXmEzQh8FMwjUQzXzX3sVaOcidTIEQqoFUqAiUXYWPWoEciYUTzEUahQSPRkEcEwFVxUkQYgCRRwDZtHjXmkzUXMWUFM1ZIckTpASZHMWQVoEcYASXxU0UgsVRBgTZmYEVzQiUYIGLogzchkFRlomUYkWSWgUaUYTUzDzUYgCRRwDZtHUX4kjUOglXogjY1EiXnASZHMGQogTN1M0TIEEURIUUVE1YAcjXuQSLYMTUsIVLUYDRuQiQhASTxb0bqwVX3fjPLQmKogjYpwVX1U0QiUFLVg0LvjFR2gTdMQmKogjY2X0X5gSUg8FMV8DZtj1R1gjPHUWUGMVYvXEVy.SZHcGR40DctjFRlwzQZcVPWkENHIDSz4RZHYFSWQ1bvXUV5kzUjgCRBwDcTkFRlgjUjYWQwHVdvjFR1gjPHg1ZFIVc2YEV3ASZHYGR3sTN1k2RMsFQQkTRUk0bEYjX1sFag0VUpEldIcEY4X2TSkTTTIkTUYUXmEzQh8FMwjUQzXzX3s1QHsFMVgEZ2YUVpASZHcGRBgjcEwlXmAiUYoWUrIVRQY0Sn4xUXQWPvDldIIDRoclUXQGMVkkbvjFR2IVZHYldVkUdMcEVsUkQUQSPWkENHIESn4hTgkWRV8DZDMDSn4hPgkWRV8DZ5IESnMyPO0zZDEURIUUVyUjQhY2ZrEVaMQ0X3k0UYYlZrElcUczXkAiUZQGLogjcyHDSn4hTZQWPWMld3TUXmc1UOgFQowjLyHDSn4BdgASTxb0bqwVX3fjPLQmKogjY2X0X5gSUgc1YW8DZDkFSxLiPLglK3IlaEYjXqASZHY2LBwDZtfmXz.iUgsVTsIFMvjFR1MiTMglKngEMAcEV40zUOglKogjYHYkV1giQgcVRW8DZtjFR0MyPOUmdTIEQqoFUqAiUXYWPWoEciYUTzEUahQCMC8TSqQTTIkTUYMWQFIlcqwVXsUkZgoWRWQlYTwVXmkjQgsVTV8DZDkFRl4xUXgWQVE1ZQcUV3sFQYgCRnI1ZYcUV3kjUS81YsgjYLYjVmQCags1cV8DZDkWSn4hTgsVSxH1YiYUVTs1QhsFLogzcHIDRy0TaXgCRR4jcHIDRx0TaXgCRRszcHg1S2nGURQzZpQ0ZvXEV1EzUZQ2Xw.ELI01XqEjTZQWPWMld3TUXuQiUOglKosjcHIDRuQiQhASTxb0bEYDY3fjTLgmXosjcHIDR0U0QiUFLVoEcvjFR1MiPLglK3EFLQIyUyUjQjgCRRwDdhk1R1gjPHk2YVgkcUY0Sn4RZKYGRBgTdqcUXyUkQig2ZW8DZtj1RvfjPHg1ZGI1YMIiX3fjPLglKng0aAISXxUDahgCRBwDZ2f1S2biTSkTTTIkTUYUXmEzQh8FMwjUQzXzX3sVaOcidTIEQqoFUqAiUXYWPWoEciYUTzEUahQSPRkEcEwFVxUkQYgCRRwDZtHjXmkzUXMWUFM1ZIckTpASZHcVSwf0TQcEYxUEaHYFSFo0YzvVXqcmUOgFQ40DZtHUXq0jLhc1XVkEUqcjXqASZHcGRBgzbM0FV3fjTLMCRBgjbM0FV3fjTKcGRn8zM5QkTDslZTsFLVgkcAckVzMVLPASRsM1ZAIkVzEzUioGNUE1azX0Sn4RZKYGRBgzazXjXvDkLWMWQFQFNHIES3IVZKYGRBgTcUczXkAiUZQGLogjcyHDSn4BdgASTxb0bEYDY3fjTLgmXosjcHIDR4clUXYWUV8DZtj1R1gjPHk2ZWE1bUYzX3s1UOglKosDLHIDRns1QhcVSxHFNHIDSn4BZX8VPxDlbEwlX3fjPLg1Mn8zM2H0TIEEURIUUVE1YAcjXuQSLYUDMFMFdq01S2nGURQzZpQ0ZvXEV1EzUZQ2XVEEcQ0lXzDjTYQWQrgkbUYTV3fjTLglKBI1YIcEVyUkQisVRWIkZvjFR4UkLhoWQVoEcIIDRoclUXQGMVkkbvjFR2IVZHYldVkUdMcEVsUkQUQSPWkENHIESn4hTgkWRV8DZXMTSn4hPgkWRV8DZ5IESnMyPO0zZDEURIUUVyUjQhY2ZrEVaMQ0X3k0UYYlZrElcUczXkAiUZQGLogjcyHDSn4hTZQWPWMld3TUXmc1UOgFQowjLyHDSn4BdgASTxb0bqwVX3fjTLQmKogjY2X0X5gSUgc1YW8DZDkFSxLiPLglK3IlaEYjXqASZHY2LR4DMtLDS14xPLYmZS0TdXkWS5wTZLglK3IFMvXUXqEUahQCLogjcyHUSn4BZXQSPWgUdMc0Sn4RZHYFRVokc3XTXmkzUOglKogTcyLzS0oGURQzZpQ0ZvXEV1EzUZQ2XVEEcQ0lXzPyPO0zZDEURIUUVyUjQhY2ZrEVaUoVX5kzUjYFUrE1YIYTXqEkUOgFQogjYtbEV3UjUgsVTWkEdqQTV3fjPT81asQFU3vVXqkjPHk1YVgEczXUVxASZHcmXogjY5YUV40zUX0VUFUEMAcUV3fjTLglKREVdIY0SnQTZMglKBEVdIY0SnomTLg1LC8TSqQTTIkTUYMWQFIlcqwVXs0DUigWVWkkYpwVX1U0QiUFLVoEcvjFR1MiPLglKRoEcAc0X5gSUgc1YW8DZDkFSxLiPLglK3EFLQIyUysFaggCRBwDctjFRlciUioGNUE1Ymc0SnQTZLIyLBwDZtfmXtUjQhsFLogjcyHDSn4BdhQCLVE1ZQ0lXz.SZHY2LR0DZtfFVzDzUXkWSW8DZtjFRlgjUZYGNFE1YIc0Sn4RZHU2LC8Tc5QkTDslZTsFLVgkcAckVzMlUQQWTsIFMzLzSMsFQQkTRUk0bEYjX1sFag0VUpEldIcEYlQEagcVRFE1ZQY0SnQTZHYlKWgEdEYUXqE0UYg2ZDkENHIjX0cmUjY2YwDFcqcDUmkzUXMWRBgTZmYEVzQiUYIGLogzchkFRlomUYkWSWgUaUYTUzDzUYgCRRwDZtHUX4kjUOglYSwDZtHTX4kjUOgldRwDZyLzSMsFQQkTRUk0bEYjX1sFag0VSTMFdYcUVloFagYWUGMVYvXkVzASZHY2LBwDZtHkVzEzUioGNUE1Ymc0SnQTZLIyLBwDZtfWXvDkLWM2ZrEFNHIDSz4RZHY1MVMld3TUXmc1UOgFQowjLyHDSn4Bdh4VQFI1ZvjFR1MiPLglK3IFMvXUXqEUahQCLogjcyHUSn4BZXQSPWgUdMc0Sn4RZHYFRVokc3XTXmkzUOglKogTcyLzS0oGURQzZpQ0ZvXEV1EzUZQ2XVEEcQ0lXzPyPO0zZDEURIUUVyUjQhY2ZrEVaUoVX5kzUjYFUrE1YIYTXqEkUOgFQogjYtbEV3UjUgsVTWkEdqQTV3fjPZcVRWEVczXkVo0zQTcVRWg0bIIDRoclUXQGMVkkbvjFR2IVZHYldVkUdMcEVsUkQUQSPWkENHIESn4hTgkWRV8DZhMjSn4hPgkWRV8DZ5IESnMyPO0zZDEURIUUVyUjQhY2ZrEVaMQ0X3k0UYYlZrElcUczXkAiUZQGLogjcyHDSn4hTZQWPWMld3TUXmc1UOgFQowjLyHDSn4BdgASTxb0bqwVX3fjPLQmKogjY2X0X5gSUgc1YW8DZDkFSxLiPLglK3IlaEYjXqASZHY2LBwDZtfmXz.iUgsVTsIFMvjFR1MiTMglKngEMAcEV40zUOglKogjYHYkV1giQgcVRW8DZtjFR0MyPOUmdTIEQqoFUqAiUXYWPWoEciYUTzEUahQCMC8TSqQTTIkTUYMWQFIlcqwVXsUkZgoWRWQlYTwVXmkjQgsVTV8DZDkFRl4xUXgWQVE1ZQcUV3sFQYgCRBMFdUYUX0cWLgAUQrI1YvvFRlwjQZcFMrE1Z2Y0SnQTZHYldVkUdMcEVsUkQUQSPWkENHIESn4hTgkWRV8DZhMkSn4hPgkWRV8DZ5IESnMyPO0zZDEURIUUVyUjQhY2ZrEVaMQ0X3k0UYYlZrElcUczXkAiUZQGLogjcyHDSn4hTZQWPWMld3TUXmc1UOgFQowjLyHDSn4BdgASTxb0bqwVX3fjPLQmKogjY2X0X5gSUgc1YW8DZDkFSxLiPLglK3IlaEYjXqASZHY2LBwDZtfmXz.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.idgoVUrgjYXcEVxU0UYgCRBwDctjFR0MyPOAUQrI1YvXUV5UEahYlKWgEdEYUXqE0UYg2ZDkENHglX0giUg0DNFkEL2YEV5sVLgQGNpE1SYwVVn4BZic1cVM1ZvjFR2MiPLg1Mn8zMtTEV3UjUgsVTWkEdAIjXmkzUXMWUFM1ZIckTpASZHgGNwD1bQQkV4E0UXQWSVkkPUYzXxTkUYQGLToUZM0FRlg0UXIWUWkENHIESxLiPLg1Mn8zM2HDUmkzUXMWUFM1ZIIiX4XWdKIENwD1bzLzSRgSLgMWPRokZvjFR4E0Uio1ZwDlP3rlX0giUgglKnE1YvXUV3fDdToWUGk0a3DyUBkjPHASSWkEdvjFR1gjPHsVTVokdEwFVxUkUOgFQogjYDECV5sFaisFLogjcHg1S23RUXgWQVE1ZQcUV30TaOciKUgEdEYUXqE0UYgWPBI1YIcEVyUkQisVRWIkZvjFR3gSLgMWSUoUMUEiXn4BZic1cVM1ZvjFR4MiPLg1Mn8zMtTEV3UjUgsVTWkEdAIjXmkzUXMWUFM1ZIckTpASZHgGNwD1bEoFV4gCahYWTWoUczX0TmE0UYg2ZVgkbM0FRlg0UXIWUWkENHIESz4RZHU2LC8DTEwlXmAiUYoWUrIlYtbEV3UjUgsVTWkEdqQTV3fDZhUGNVEFSqEiX5UEagsVRGQUcMckV5sVLgQWRBgTLEYTXvTkUOgFSosDLpMkSzn1TNQiKC0TLLkFSvf0PNg1Mn8zMtTEV3UjUgsVTWkEdAIjXmkzUXMWUFM1ZIckTpASZHgGNwD1bMASXvjjLXsVTTkkbEYEYMgiQYsVRBgTLEYTXvTkUOglKosjcHg2R4X2PTcVRWg0bUYzXqkzQHYWQrI1YvXUV5UEahkTTV8DZHISX0AiUSUWTVMlbEYzXugCag8DMwLEaYwFRlg0UXIWUWkENHIESz4RZHU2LC8DTEwlXmAiUYoWUrIlYtbEV3UjUgsVTWkEdqQTV3fDZhUGNVEFQqEiX5UDagkVUrA0ZQIyXqUEag0zZwfUdIIDRwTjQgASUV8DZDkWSz4RZHU2LC8TctTEV3UjUgsVTWkEdM01S2bCZTUGNVEVN1kFU0giUgYlZFkENHgmX5U0QY8FNw.UYIISX0ACaHY1LVg0bUY0SnwTQiASTVoUc3.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.."
                                    }
                                }
                            ],
                            "parameter_initial_enable": 1,
                            "parameter_invisible": 1,
                            "parameter_longname": "vst~[2]",
                            "parameter_modmode": 0,
                            "parameter_shortname": "vst~[2]",
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
                            "blob": "22486.VMjLgz7U...O+fWarAhckI2bo8la8HRLt.iHfTlai8FYo41Y8HRUTYTK3HxO9.BOVMEUy.Ea0cVZtMEcgQWY9vSRC8Vav8lak4Fc9DiM2bSNtXUSGM1UA4hKtXlKt3hKP4hKt3hKtvjdXQ2bD4hKDomXFkjdP4VPt3hKHYGUoUULL4BS1IjKt3hKtPjKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKyMWUCkzTHYkPD4hK1k2Sy.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.iUYAURxDVZUEiX4sFag0VRBgTLEYTXvTkUOglKosjcHg2R4X2PTETRUAUSAIkVpASZHUWPWkEcMUzX3sFag0VSsgjYXcEVxU0UYgCRRwDctjFR0MyPOAUQpQUPvPDRuEkUOglKWgEcAASX5kjPHESQFEFLUY0Sn4RZKYGR3sTN1MDUAkTUP0TPRokZvjFR1UDagYGNFMFUqcjXqkjPHESQFEFLUY0SngTZKYGR3sTN1MDUAkTUP0TPRokZvjFR1slQik1YrA0ZzXTVn4BZic1cVM1ZvjFR1MiPLg1Mn8zMtTETRUDUSYlZFkENHIjXu8Vaj0DNFkkbIIDRwTjQgASUV8DZtj1Ry3xPLYmKCwjchMESvfzTMAiX4wjLHg2R4X2PTETRUAUSAIkVpASZHY2ZrQVMqECVmEkLgAENFEFMIIDRwTjQgASUV8DZDk1R1gDdKkicCQUPIUETMEjTZoFLogjc2YEVz.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.UczXzX3giQgglKnM1Y2Y0XqASZHY2LBwDZ2f1S23RUPIUQTMkYpYTV3fjPhUWRGM1YvDCU1cmUZoWRUgkdqESXPUDahcFLrgjYXcEVxU0UYgCRR0jcyHDSncCZOciKUAkTEQ0TlolQYgCRBIVcIczXmAiUYQWTxD1PQ0lXxkjPHESQFEFLUY0Sn4RZKYGR3sTN1MDUAkTUP0TPRokZvjFR1gCahoWQVE1ZzXzX0ACUXMSTUo0bUwFRlg0UXIWUWkENHITSz4RZHU2LC8DTEoFUAACQH8VTV8DZHcUVoUkUZESUVMURQQkTCclUXQGMVkkbIIDRwTjQgASUV8DZDkWSz4RZHU2LC8DTEoFUAACQH8VTV8DZHcUVxUkUXkWUwT0azXTVCgCagoWRxDlb2YUV3AidgoVUrgjYXcEVxU0UYgCRBwDctjFR0MyPOAUQpQUPvPDRuEkUOgFSWMVdQcEVuQCaHYFVWgkbUcUV3fjPLQmKogTcyLzSPUjZTEDLDgzaQY0SnwzUikWTWg0azvFUmAiQhglKnM1Y2Y0XqASZHY2LBwDZ2f1S23RUPIUQTMkYpYTV3fjPigWQrEVdAISX4UEaHYFVWgkbUcUV3fjPLQmKogTcyLzS04xUXgWQVEVdzLzSMsFQQkTRUk0bEYjX1sFag0VTUgEZ2YUV4X2TSkTTTIkTUYUXmEzQh8FMwjUQzXzX3s1QHsFMVgEZ2YUVpASZHcGRBgjcEwlXmAiUYoWUrIVRQY0SnQkQjYWRWkUdMckV0QCaHYFSFo0YzvVXqcmUOgFQ40DZtHUXq0jLhc1XVkEUqcjXqASZHcGRBgzbM0FV3fjTLcGRBgjbM0FV3fjTKcGRn8zM5QkTDslZTsFLVgkcAckVzMVLPASRsM1ZAIkVzEzUioGNUE1azX0Sn4RZKYGRBgzazXjXvDkLWMWQFQFNHIES3IVZKYGRBgTcUczXkAiUZQGLogTdyHDSn4BdgASTxb0bEYDY3fjTLgGUosjcHIDR4clUXYWUV8DZtj1R1wzTNQiZS4DMpMkS24xTMQCSCwTdLkFRlwzUjMGLVkkdIcEY3fjPLQmYCwjctLDS14xTLcmZowjcpkFSzfjPHg1ZGI1YMIiX3fjPLglKng0aAISXxUDahgCRBwDZ2f1S2biTSkTTTIkTUYUXmEzQh8FMwjUQzXzX3sVaOcidTIEQqoFUqAiUXYWPWoEciYUTzEUahQSPRkEcEwFVxUkQYgCRRwDZtHjXmkzUXMWUFM1ZIckTpASZHEyZrgEdEYzX0EEUYYWTGoEZtfGVtUDagQWUFEFNHIESxfjPHMWUwHVdEESVqEUUjYWUV8DZDkFRloWLhgFLogzcHIDRx0TaXgCRRszcHg1S2nGURQzZpQ0ZvXEV1EzUZQ2Xw.ELI01XqEjTZQWPWMld3TUXuQiUOglKosjcHIDRuQiQhASTxb0bEYDY3fjTLgmXosjcHIDR0U0QiUFLVoEcvjFR2MiPLglK3EFLQIyUyUjQjgCRRwzctj1R1gjPHk2YVgkcUY0Sn4RZKYGRBgTdqcUXyUkQig2ZW8DZtj1RvfjPHg1ZGI1YMIiX3fjPLglKng0aAISXxUDahgCRBwDZ2f1S2biTSkTTTIkTUYUXmEzQh8FMwjUQzXzX3sVaOcidTIEQqoFUqAiUXYWPWoEciYUTzEUahQSPRkEcEwFVxUkQYgCRRwDZtHjXmkzUXMWUFM1ZIckTpASZHEyZrgEdEYzX0kTUXoWUrgjYLYjVmQCags1cV8DZDkWSn4hTgsVSxH1YiYUVTs1QhsFLogzcHIDRy0TaXgCRRwDMHIDRx0TaXgCRRszcHg1S2nGURQzZpQ0ZvXEV1EzUZQ2Xw.ELI01XqEjTZQWPWMld3TUXuQiUOglKosjcHIDRuQiQhASTxb0bEYDY3fjTLgmXosjcHIDR0U0QiUFLVoEcvjFR1MiPLglK3EFLQIyUyUjQjgCRRwDdhk1R1gjPHk2YVgkcUY0Sn4RZKYGRBgTdqcUXyUkQig2ZW8DZtj1RvfjPHg1ZGI1YMIiX3fjPLglKng0aAISXxUDahgCRBwDZ2f1S2biTSkTTTIkTUYUXmEzQh8FMwjUQzXzX3sVaOcidTIEQqoFUqAiUXYWPWoEciYUTzEUahQSPRkEcEwFVxUkQYgCRRwDZtHjXmkzUXMWUFM1ZIckTpASZHgFNwLlQ3vlXoUkQTcVRWg0bIIDRoclUXQGMVkkbvjFR2IVZHYldVkUdMcEVsUkQUQSPWkENHIESn4hTgkWRV8DZDkWSn4hPgkWRV8DZ5IESnMyPO0zZDEURIUUVyUjQhY2ZrEVaMQ0X3k0UYYlZrElcUczXkAiUZQGLogjcyHDSn4hTZQWPWMld3TUXmc1UOgFQowjLyHDSn4BdgASTxb0bqwVX3fjPLQmKogjY2X0X5gSUgc1YW8DZDkFSxLiPLglK3IlaEYjXqASZHY2LBwDZtfmXz.iUgsVTsIFMvjFR1MiTMglKngEMAcEV40zUOglKogjYHYkV1giQgcVRW8DZtjFR0MyPOUmdTIEQqoFUqAiUXYWPWoEciYUTzEUahQCMC8TSqQTTIkTUYMWQFIlcqwVXsUkZgoWRWQlYTwVXmkjQgsVTV8DZDkFRl4xUXgWQVE1ZQcUV3sFQYgCRngUcicDU00zUZo2ZwDFcAUEV3UjUgglK3gkaEwVXzUkQggCRRwjLHIDRyUULhkWQwj0ZQUEY1UkUOgFQogjY5EiXnASZHcGVogjY1EiXnASZHMGQogTN1M0TIEEURIUUVE1YAcjXuQSLYMTUsIVLUYDRuQiQhASTxb0bqwVX3fjPLQmKogjYpwVX1U0QiUFLVg0LvjFR2gTdMQmKogjY2X0X5gSUg8FMV8DZtj1R1gjPHUWUGMVYvXEVy.SZHcGR40DctjFRlwzQZcVPWkENHIDSz4RZHYFSWQ1bvXUV5kzUjgCRBwDcTkFRlgjUjYWQwHVdvjFR1gjPHg1ZFIVc2YEV3ASZHYGR3sTN1k2RMsFQQkTRUk0bEYjX1sFag0VUpEldIcEY4X2TSkTTTIkTUYUXmEzQh8FMwjUQzXzX3s1QHsFMVgEZ2YUVpASZHcGRBgjcEwlXmAiUYoWUrIVRQY0SnAUahsFLwDlb3DCU1UkUYoVRBgTZmYEVzQiUYIGLogzcHIDRyUULhkWQwj0ZQUEY1UkUOgFQogjY5EiXnASZHMiKogjY1EiXnASZHMGQogTN1M0TIEEURIUUVE1YAcjXuQSLYMTUsIVLUYDRuQiQhASTxb0bqwVX3fjPLQmKogjYpwVX1U0QiUFLVg0LvjFR2gTdMQmKogjY2X0X5gSUg8FMV8DZtj1R1gjPHUWUGMVYvXEVy.SZHcGR40DctjFRlwzQZcVPWkENHIDSz4RZHYFSWQ1bvXUV5kzUjgCRBwDcTkFRlgjUjYWQwHVdvjFR1gjPHg1ZFIVc2YEV3ASZHYGR3sTN1k2RMsFQQkTRUk0bEYjX1sFag0VUpEldIcEY4X2TSkTTTIkTUYUXmEzQh8FMwjUQzXzX3s1QHsFMVgEZ2YUVpASZHcGRBgjcEwlXmAiUYoWUrIVRQY0SnomUX8FMrUUc2Y0XyUEaHYFSFo0YzvVXqcmUOgFQ40DZtHUXq0jLhc1XVkEUqcjXqASZHcGRBgzbM0FV3fDdMglKBEVdIY0SnomTLg1LC8TSqQTTIkTUYMWQFIlcqwVXs0DUigWVWkkYpwVX1U0QiUFLVoEcvjFR1MiPLglKRoEcAc0X5gSUgc1YW8DZDkFSxLiPLglK3EFLQIyUysFaggCRBwDctjFRlciUioGNUE1Ymc0SnQTZLIyLBwDZtfmXtUjQhsFLogjcyHDSn4BdhQCLVE1ZQ0lXz.SZHY2LR0DZtfFVzDzUXkWSW8DZtjFRlgjUZYGNFE1YIc0Sn4RZHU2LC8Tc5QkTDslZTsFLVgkcAckVzMlUQQWTsIFMzLzSMsFQQkTRUk0bEYjX1sFag0VUpEldIcEYlQEagcVRFE1ZQY0SnQTZHYlKWgEdEYUXqE0UYg2ZDkENHIjXmQiQTUWTsgjYLYjVmQCags1cV8DZDkWSn4hTgsVSxH1YiYUVTs1QhsFLogzcHIDRy0TaXgCRRwjcHIDRx0TaXgCRRszcHg1S2nGURQzZpQ0ZvXEV1EzUZQ2Xw.ELI01XqEjTZQWPWMld3TUXuQiUOglKosjcHIDRuQiQhASTxb0bEYDY3fjTLgmXosjcHIDR0U0QiUFLVoEcvjFR1MiPLglK3EFLQIyUyUjQjgCRRwDdhk1R1gjPHk2YVgkcUY0Sn4RZKYGRBgTdqcUXyUkQig2ZW8DZtj1RvfjPHg1ZGI1YMIiX3fjPLglKng0aAISXxUDahgCRBwDZ2f1S2biTSkTTTIkTUYUXmEzQh8FMwjUQzXzX3sVaOcidTIEQqoFUqAiUXYWPWoEciYUTzEUahQSPRkEcEwFVxUkQYgCRRwDZtHjXmkzUXMWUFM1ZIckTpASZHgWUrM1ZI0FVMslQjglK3gkaEwVXzUkQggCRRwjLHIDRyUULhkWQwj0ZQUEY1UkUOgFQogjY5EiXnASZHQiKogjY1EiXnASZHMGQogTN1M0TIEEURIUUVE1YAcjXuQSLYMTUsIVLUYDRuQiQhASTxb0bqwVX3fjPLQmKogjYpwVX1U0QiUFLVg0LvjFR2gTdMQmKogjY2X0X5gSUg8FMV8DZtj1R1gjPHUWUGMVYvXEVy.SZHcGR40DctjFRlwzQZcVPWkENHIDSz4RZHYFSWQ1bvXUV5kzUjgCRBwDcTkFRlgjUjYWQwHVdvjFR1gjPHg1ZFIVc2YEV3ASZHYGR3sTN1k2RMsFQQkTRUk0bEYjX1sFag0VUpEldIcEY4X2TSkTTTIkTUYUXmEzQh8FMwjUQzXzX3s1QHsFMVgEZ2YUVpASZHcGRBgjcEwlXmAiUYoWUrIVRQY0SnQTLXkVSEMFM2YUVn4BdX4VQrEFcUYTX3fjTLICRBgzbUEiX4UTLYsVTUQlcUY0SnQTZHYldwHFZvjFR2YVZHYlcwHFZvjFRyQTZHkicSMURQQkTRUkUgcVPGI1azDSVCUUahESUFgzazXjXvDkLWM2ZrEFNHIDSz4RZHYlZrElcUczXkAiUXMCLogzcHkWSz4RZHY1MVMld3TUXuQiUOglKosjcHIDR0U0QiUFLVg0LvjFR2gTdMQmKogjYLcjVmEzUYgCRBwDctjFRlwzUjMGLVkkdIcEY3fjPLQGUogjYHYEY1UTLhkGLogjcHIDRnslQhU2cVgEdvjFR1gDdKkic4sTSqQTTIkTUYMWQFIlcqwVXsUkZgoWRWQVN1M0TIEEURIUUVE1YAcjXuQSLYUDMFMFdqcDRqQiUXg1cVkkZvjFR2gjPHYWQrI1YvXUV5UEahkTTV8DZLc0X4E0UX8FMrgjYLYjVmQCags1cV8DZDkWSn4hTgsVSxH1YiYUVTs1QhsFLogzcHIDRy0TaXgCRn0jdHIDRx0TaXgCRRszcHg1S2nGURQzZpQ0ZvXEV1EzUZQ2Xw.ELI01XqEjTZQWPWMld3TUXuQiUOglKosjcHIDRuQiQhASTxb0bEYDY3fjTLgmXosjcHIDR0U0QiUFLVoEcvjFR2MiPLglK3EFLQIyUyUjQjgCRRwDdhk1R1gjPHk2YVgkcUY0Sn4RZKQiZCwjctLDS14xTNACSo0jLPkGS3gjPHk2ZWE1bUYzX3s1UOglKosDLHIDRns1QhcVSxHFNHIDSn4BZX8VPxDlbEwlX3fjPLg1Mn8zM2H0TIEEURIUUVE1YAcjXuQSLYUDMFMFdq01S2nGURQzZpQ0ZvXEV1EzUZQ2XVEEcQ0lXzDjTYQWQrgkbUYTV3fjTLglKBI1YIcEVyUkQisVRWIkZvjFRPsFajUSTvDFcUwFRlwjQZcFMrE1Z2Y0SnQTdMglKRE1ZMIiXmMlUYQ0ZGI1ZvjFR2gjPHMWSsgENHIESwfjPHIWSsgENHI0R2gDZOcidTIEQqoFUqAiUXYWPWoEciECTvjTaisVPRoEcAc0X5gSUg8FMV8DZtj1R1gjPH8FMFIFLQIyUyUjQjgCRRwDdhk1R1gjPHUWUGMVYvXkVzASZHY2LBwDZtfWXvDkLWMWQFQFNHIES3IVZKYGRBgTdmYEV1UkUOglKosjcHIDR4s1UgMWUFMFdqc0Sn4RZKACRBgDZqcjXm0jLhgCRBwDZtfFVuEjLgIWQrIFNHIDSncCZOcyMRMURQQkTRUkUgcVPGI1azDSVEQiQig2Zs8zM5QkTDslZTsFLVgkcAckVzMlUQQWTsIFMAIUVzUDaXIWUFkENHIESn4hPhcVRWg0bUYzXqkzURoFLogjc3XTXzDzQZUGMVQFTEwlXmACaHYFSFo0YzvVXqcmUOgFQ40DZtHUXq0jLhc1XVkEUqcjXqASZHcGRBgzbM0FV3fjPNcGRBgjbM0FV3fjTKcGRn8zM5QkTDslZTsFLVgkcAckVzMVLPASRsM1ZAIkVzEzUioGNUE1azX0Sn4RZKYGRBgzazXjXvDkLWMWQFQFNHIES3IVZKYGRBgTcUczXkAiUZQGLogjcyHDSn4BdgASTxb0bEYDY3fjTLgmXosjcHIDR4clUXYWUV8DZtj1R1gjPHk2ZWE1bUYzX3s1UOglKosDLHIDRns1QhcVSxHFNHIDSn4BZX8VPxDlbEwlX3fjPLg1Mn8zM2H0TIEEURIUUVE1YAcjXuQSLYUDMFMFdq01S2nGURQzZpQ0ZvXEV1EzUZQ2XVEEcQ0lXzDjTYQWQrgkbUYTV3fjTLglKBI1YIcEVyUkQisVRWIkZvjFRtUDahMGNrE1aMEiXPUDahcFLrgjYLYjVmQCags1cV8DZDkWSn4hTgsVSxH1YiYUVTs1QhsFLogzcHIDRy0TaXgCR30zLHIDRx0TaXgCRRszcHg1S2nGURQzZpQ0ZvXEV1EzUZQ2Xw.ELI01XqEjTZQWPWMld3TUXuQiUOglKosjcHIDRuQiQhASTxb0bEYDY3fjTLgmXosjcHIDR0U0QiUFLVoEcvjFR1MiPLglK3EFLQIyUyUjQjgCRRwDdhk1R1gjPHk2YVgkcUY0Sn4RZKYGRBgTdqcUXyUkQig2ZW8DZtj1RvfjPHg1ZGI1YMIiX3fjPLglKng0aAISXxUDahgCRBwDZ2f1S2biTSkTTTIkTUYUXmEzQh8FMwjUQzXzX3sVaOcidTIEQqoFUqAiUXYWPWoEciYUTzEUahQSPRkEcEwFVxUkQYgCRRwDZtHjXmkzUXMWUFM1ZIckTpASZHoWRWk0b3XTX0ETUXgWQVEFZtfGVtUDagQWUFEFNHIESn4hTgsVSxH1YiYUVTs1QhsFLogzcHIDRy0TaXgCR30DMHIDRx0TaXgCRRszcHg1S2nGURQzZpQ0ZvXEV1EzUZQ2Xw.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.idgoVUrgjYXcEVxU0UYgCRBwDctjFR0MyPOAUQrI1YvXUV5UEahYlKWgEdEYUXqE0UYg2ZDkENHglX0giUg0DNFkEL2YEV5sVLgQGNpE1SYwVVn4BZic1cVM1ZvjFR2MiPLg1Mn8zMtTEV3UjUgsVTWkEdAIjXmkzUXMWUFM1ZIckTpASZHgGNwD1bQQkV4E0UXQWSVkkPUYzXxTkUYQGLToUZM0FRlg0UXIWUWkENHIESxLiPLg1Mn8zM2HDUmkzUXMWUFM1ZIIiX4XWdKIENwD1bzLzSRgSLgMWPRokZvjFRocWLgkWUVM0aMEyU3gSLgMWRBgDcEYUXqASZHMzcwDVdUEyUMsVLXUVRvDVcvvFRlQkLhsVRW8DZtjFRlQkQY8VTWgEZ2YUV3fjPLglKRgUZQckVwTkUOglKogTN1MDUmkzUXMWUFM1ZIIiX4X2PTcVRWg0bUYzXqkzQHYWQrI1YvXUV5UEahkTTV8DZHISX0ASLT81aWkUdIIDRwTjQgASUV8DZtj1R1gDdKkicCQ0YIcEVyUkQisVRGgjcEwlXmAiUYoWUrIVRQY0SngjLgUGLVAEZMISX3EzQi8FNrEVSEYzXqkzUZc1cwHFZtf1XmcmUisFLogjcyHDSncCZOciKUgEdEYUXqE0UYgWPBI1YIcEVyUkQisVRWIkZvjFR3gSLgM2cToUdQcUVzUEahAENwH1aQckV0QCaHYFVWgkbUcUV3fDdLQmKogTcyLzSPUDahcFLVkkdUwlXl4xUXgWQVE1ZQcUV3sFQYgCRnIVc3XUXSgiUigWSVkEQUYTXms1USUWTVkEZtf1XmcmUisFLogjcyHDSncCZOciKUgEdEYUXqE0UYgWPBI1YIcEVyUkQisVRWIkZvjFR3gSLgMGL5ElZUcTXmE0UZUGMwLEc3nVVrkjPHESQFEFLUY0Sn4RZKYGR3sTN1MDUmkzUXMWUFM1ZIcDR1UDahcFLVkkdUwlXIEkUOgFRxDVcvXTTu0zQicFMwf0ZIQUV5M1UYsFMVM0aMEiXn4BZic1cVM1ZvjFR2IVZKYGR3sTN1k2RPUDahcFLVkkdUwlX4QyPOUGRvDVcvv1S2bCZTUGNVEVdzLzS0gDLgUGLwHVSEwVXmMlUYgGMC8TcHISX0ASLh8FLVMlbEYzX0kTaOciKxDVdqYzXugCag8FMwjUN1MjXmkzUXMWSs8zMtTETRUDUSYlZFkENHglX0giUgMENVMFdMYUVAQSLYIWUrgjYXcEVxU0UYgCRR4jcyHDSncCZOciKUAkTEQ0TlolQYgCRnIVc3XUXSgiUigWSVkEQqEiX5UDagkVUrgjYXcEVxU0UYgCR3wDctjFR0MyPOUmKWgEdEYUX4QyPOUmKxDVdqYzXugCag8FMwjUN1k2R1kjLg0VRWg0bzLzS4giUigWSVk0azvVV0EjTgcFMVMFaEECV5UUahsVRW8DZDQ0XpsVLgUFL5ElZUYTXuQSLYglKRE1YqwVXTUkQjoGLogzPUYTXxgCaHYFTxDlcQUUVyD0UOglYWwDZtfFV0E0QiUGLFU0ZmczX3fjTR4TSEUkTzHESn4BdXU2cwDFLIc0SngEaYsVSVgkZIkFVn4BdXUGLFIVczXUVzEkLT81aWkENHIDSn4BdhsVSFM1a3vVXMgiQYsFLogjcHg2R4XWdKk2XWg0bzLjKt3hKt3hKt3hKtXlTU0DUQAURWoULEYzXqEEUXoWQF4RPDYFTzDzUXkWSG4RPDYmKtnWPt3hKt3hKt3hKJUELPUTPqI1aYcEV5UkQQcVTWgEOujzPu0Fbu4VYtQmO77hUSQ0LPwVcmklaSQWXzUlO.."
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
                                        "blob": "22486.VMjLgz7U...O+fWarAhckI2bo8la8HRLt.iHfTlai8FYo41Y8HRUTYTK3HxO9.BOVMEUy.Ea0cVZtMEcgQWY9vSRC8Vav8lak4Fc9DiM2bSNtXUSGM1UA4hKtXlKt3hKP4hKt3hKtvjdXQ2bD4hKDomXFkjdP4VPt3hKHYGUoUULL4BS1IjKt3hKtPjKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKyMWUCkzTHYkPD4hK1k2Sy.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.iUYAURxDVZUEiX4sFag0VRBgTLEYTXvTkUOglKosjcHg2R4X2PTETRUAUSAIkVpASZHUWPWkEcMUzX3sFag0VSsgjYXcEVxU0UYgCRRwDctjFR0MyPOAUQpQUPvPDRuEkUOglKWgEcAASX5kjPHESQFEFLUY0Sn4RZKYGR3sTN1MDUAkTUP0TPRokZvjFR1UDagYGNFMFUqcjXqkjPHESQFEFLUY0SngTZKYGR3sTN1MDUAkTUP0TPRokZvjFR1slQik1YrA0ZzXTVn4BZic1cVM1ZvjFR1MiPLg1Mn8zMtTETRUDUSYlZFkENHIjXu8Vaj0DNFkkbIIDRwTjQgASUV8DZtj1Ry3xPLYmKCwjchMESvfzTMAiX4wjLHg2R4X2PTETRUAUSAIkVpASZHY2ZrQVMqECVmEkLgAENFEFMIIDRwTjQgASUV8DZDk1R1gDdKkicCQUPIUETMEjTZoFLogjc2YEVz.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.UczXzX3giQgglKnM1Y2Y0XqASZHY2LBwDZ2f1S23RUPIUQTMkYpYTV3fjPhUWRGM1YvDCU1cmUZoWRUgkdqESXPUDahcFLrgjYXcEVxU0UYgCRR0jcyHDSncCZOciKUAkTEQ0TlolQYgCRBIVcIczXmAiUYQWTxD1PQ0lXxkjPHESQFEFLUY0Sn4RZKYGR3sTN1MDUAkTUP0TPRokZvjFR1gCahoWQVE1ZzXzX0ACUXMSTUo0bUwFRlg0UXIWUWkENHITSz4RZHU2LC8DTEoFUAACQH8VTV8DZHcUVoUkUZESUVMURQQkTCclUXQGMVkkbIIDRwTjQgASUV8DZDkWSz4RZHU2LC8DTEoFUAACQH8VTV8DZHcUVxUkUXkWUwT0azXTVCgCagoWRxDlb2YUV3AidgoVUrgjYXcEVxU0UYgCRBwDctjFR0MyPOAUQpQUPvPDRuEkUOgFSWMVdQcEVuQCaHYFVWgkbUcUV3fjPLQmKogTcyLzSPUjZTEDLDgzaQY0SnwzUikWTWg0azvFUmAiQhglKnM1Y2Y0XqASZHY2LBwDZ2f1S23RUPIUQTMkYpYTV3fjPigWQrEVdAISX4UEaHYFVWgkbUcUV3fjPLQmKogTcyLzS04xUXgWQVEVdzLzSMsFQQkTRUk0bEYjX1sFag0VTUgEZ2YUV4X2TSkTTTIkTUYUXmEzQh8FMwjUQzXzX3s1QHsFMVgEZ2YUVpASZHcGRBgjcEwlXmAiUYoWUrIVRQY0SnQkQjYWRWkUdMckV0QCaHYFSFo0YzvVXqcmUOgFQ40DZtHUXq0jLhc1XVkEUqcjXqASZHcGRBgzbM0FV3fjTLcGRBgjbM0FV3fjTKcGRn8zM5QkTDslZTsFLVgkcAckVzMVLPASRsM1ZAIkVzEzUioGNUE1azX0Sn4RZKYGRBgzazXjXvDkLWMWQFQFNHIES3IVZKYGRBgTcUczXkAiUZQGLogTdyHDSn4BdgASTxb0bEYDY3fjTLgGUosjcHIDR4clUXYWUV8DZtj1R1wzTNQiZS4DMpMkS24xTMQCSCwTdLkFRlwzUjMGLVkkdIcEY3fjPLQmYCwjctLDS14xTLcmZowjcpkFSzfjPHg1ZGI1YMIiX3fjPLglKng0aAISXxUDahgCRBwDZ2f1S2biTSkTTTIkTUYUXmEzQh8FMwjUQzXzX3sVaOcidTIEQqoFUqAiUXYWPWoEciYUTzEUahQSPRkEcEwFVxUkQYgCRRwDZtHjXmkzUXMWUFM1ZIckTpASZHEyZrgEdEYzX0EEUYYWTGoEZtfGVtUDagQWUFEFNHIESxfjPHMWUwHVdEESVqEUUjYWUV8DZDkFRloWLhgFLogzcHIDRx0TaXgCRRszcHg1S2nGURQzZpQ0ZvXEV1EzUZQ2Xw.ELI01XqEjTZQWPWMld3TUXuQiUOglKosjcHIDRuQiQhASTxb0bEYDY3fjTLgmXosjcHIDR0U0QiUFLVoEcvjFR2MiPLglK3EFLQIyUyUjQjgCRRwzctj1R1gjPHk2YVgkcUY0Sn4RZKYGRBgTdqcUXyUkQig2ZW8DZtj1RvfjPHg1ZGI1YMIiX3fjPLglKng0aAISXxUDahgCRBwDZ2f1S2biTSkTTTIkTUYUXmEzQh8FMwjUQzXzX3sVaOcidTIEQqoFUqAiUXYWPWoEciYUTzEUahQSPRkEcEwFVxUkQYgCRRwDZtHjXmkzUXMWUFM1ZIckTpASZHEyZrgEdEYzX0kTUXoWUrgjYLYjVmQCags1cV8DZDkWSn4hTgsVSxH1YiYUVTs1QhsFLogzcHIDRy0TaXgCRRwDMHIDRx0TaXgCRRszcHg1S2nGURQzZpQ0ZvXEV1EzUZQ2Xw.ELI01XqEjTZQWPWMld3TUXuQiUOglKosjcHIDRuQiQhASTxb0bEYDY3fjTLgmXosjcHIDR0U0QiUFLVoEcvjFR1MiPLglK3EFLQIyUyUjQjgCRRwDdhk1R1gjPHk2YVgkcUY0Sn4RZKYGRBgTdqcUXyUkQig2ZW8DZtj1RvfjPHg1ZGI1YMIiX3fjPLglKng0aAISXxUDahgCRBwDZ2f1S2biTSkTTTIkTUYUXmEzQh8FMwjUQzXzX3sVaOcidTIEQqoFUqAiUXYWPWoEciYUTzEUahQSPRkEcEwFVxUkQYgCRRwDZtHjXmkzUXMWUFM1ZIckTpASZHgFNwLlQ3vlXoUkQTcVRWg0bIIDRoclUXQGMVkkbvjFR2IVZHYldVkUdMcEVsUkQUQSPWkENHIESn4hTgkWRV8DZDkWSn4hPgkWRV8DZ5IESnMyPO0zZDEURIUUVyUjQhY2ZrEVaMQ0X3k0UYYlZrElcUczXkAiUZQGLogjcyHDSn4hTZQWPWMld3TUXmc1UOgFQowjLyHDSn4BdgASTxb0bqwVX3fjPLQmKogjY2X0X5gSUgc1YW8DZDkFSxLiPLglK3IlaEYjXqASZHY2LBwDZtfmXz.iUgsVTsIFMvjFR1MiTMglKngEMAcEV40zUOglKogjYHYkV1giQgcVRW8DZtjFR0MyPOUmdTIEQqoFUqAiUXYWPWoEciYUTzEUahQCMC8TSqQTTIkTUYMWQFIlcqwVXsUkZgoWRWQlYTwVXmkjQgsVTV8DZDkFRl4xUXgWQVE1ZQcUV3sFQYgCRngUcicDU00zUZo2ZwDFcAUEV3UjUgglK3gkaEwVXzUkQggCRRwjLHIDRyUULhkWQwj0ZQUEY1UkUOgFQogjY5EiXnASZHcGVogjY1EiXnASZHMGQogTN1M0TIEEURIUUVE1YAcjXuQSLYMTUsIVLUYDRuQiQhASTxb0bqwVX3fjPLQmKogjYpwVX1U0QiUFLVg0LvjFR2gTdMQmKogjY2X0X5gSUg8FMV8DZtj1R1gjPHUWUGMVYvXEVy.SZHcGR40DctjFRlwzQZcVPWkENHIDSz4RZHYFSWQ1bvXUV5kzUjgCRBwDcTkFRlgjUjYWQwHVdvjFR1gjPHg1ZFIVc2YEV3ASZHYGR3sTN1k2RMsFQQkTRUk0bEYjX1sFag0VUpEldIcEY4X2TSkTTTIkTUYUXmEzQh8FMwjUQzXzX3s1QHsFMVgEZ2YUVpASZHcGRBgjcEwlXmAiUYoWUrIVRQY0SnAUahsFLwDlb3DCU1UkUYoVRBgTZmYEVzQiUYIGLogzcHIDRyUULhkWQwj0ZQUEY1UkUOgFQogjY5EiXnASZHMiKogjY1EiXnASZHMGQogTN1M0TIEEURIUUVE1YAcjXuQSLYMTUsIVLUYDRuQiQhASTxb0bqwVX3fjPLQmKogjYpwVX1U0QiUFLVg0LvjFR2gTdMQmKogjY2X0X5gSUg8FMV8DZtj1R1gjPHUWUGMVYvXEVy.SZHcGR40DctjFRlwzQZcVPWkENHIDSz4RZHYFSWQ1bvXUV5kzUjgCRBwDcTkFRlgjUjYWQwHVdvjFR1gjPHg1ZFIVc2YEV3ASZHYGR3sTN1k2RMsFQQkTRUk0bEYjX1sFag0VUpEldIcEY4X2TSkTTTIkTUYUXmEzQh8FMwjUQzXzX3s1QHsFMVgEZ2YUVpASZHcGRBgjcEwlXmAiUYoWUrIVRQY0SnomUX8FMrUUc2Y0XyUEaHYFSFo0YzvVXqcmUOgFQ40DZtHUXq0jLhc1XVkEUqcjXqASZHcGRBgzbM0FV3fDdMglKBEVdIY0SnomTLg1LC8TSqQTTIkTUYMWQFIlcqwVXs0DUigWVWkkYpwVX1U0QiUFLVoEcvjFR1MiPLglKRoEcAc0X5gSUgc1YW8DZDkFSxLiPLglK3EFLQIyUysFaggCRBwDctjFRlciUioGNUE1Ymc0SnQTZLIyLBwDZtfmXtUjQhsFLogjcyHDSn4BdhQCLVE1ZQ0lXz.SZHY2LR0DZtfFVzDzUXkWSW8DZtjFRlgjUZYGNFE1YIc0Sn4RZHU2LC8Tc5QkTDslZTsFLVgkcAckVzMlUQQWTsIFMzLzSMsFQQkTRUk0bEYjX1sFag0VUpEldIcEYlQEagcVRFE1ZQY0SnQTZHYlKWgEdEYUXqE0UYg2ZDkENHIjXmQiQTUWTsgjYLYjVmQCags1cV8DZDkWSn4hTgsVSxH1YiYUVTs1QhsFLogzcHIDRy0TaXgCRRwjcHIDRx0TaXgCRRszcHg1S2nGURQzZpQ0ZvXEV1EzUZQ2Xw.ELI01XqEjTZQWPWMld3TUXuQiUOglKosjcHIDRuQiQhASTxb0bEYDY3fjTLgmXosjcHIDR0U0QiUFLVoEcvjFR1MiPLglK3EFLQIyUyUjQjgCRRwDdhk1R1gjPHk2YVgkcUY0Sn4RZKYGRBgTdqcUXyUkQig2ZW8DZtj1RvfjPHg1ZGI1YMIiX3fjPLglKng0aAISXxUDahgCRBwDZ2f1S2biTSkTTTIkTUYUXmEzQh8FMwjUQzXzX3sVaOcidTIEQqoFUqAiUXYWPWoEciYUTzEUahQSPRkEcEwFVxUkQYgCRRwDZtHjXmkzUXMWUFM1ZIckTpASZHgWUrM1ZI0FVMslQjglK3gkaEwVXzUkQggCRRwjLHIDRyUULhkWQwj0ZQUEY1UkUOgFQogjY5EiXnASZHQiKogjY1EiXnASZHMGQogTN1M0TIEEURIUUVE1YAcjXuQSLYMTUsIVLUYDRuQiQhASTxb0bqwVX3fjPLQmKogjYpwVX1U0QiUFLVg0LvjFR2gTdMQmKogjY2X0X5gSUg8FMV8DZtj1R1gjPHUWUGMVYvXEVy.SZHcGR40DctjFRlwzQZcVPWkENHIDSz4RZHYFSWQ1bvXUV5kzUjgCRBwDcTkFRlgjUjYWQwHVdvjFR1gjPHg1ZFIVc2YEV3ASZHYGR3sTN1k2RMsFQQkTRUk0bEYjX1sFag0VUpEldIcEY4X2TSkTTTIkTUYUXmEzQh8FMwjUQzXzX3s1QHsFMVgEZ2YUVpASZHcGRBgjcEwlXmAiUYoWUrIVRQY0SnQTLXkVSEMFM2YUVn4BdX4VQrEFcUYTX3fjTLICRBgzbUEiX4UTLYsVTUQlcUY0SnQTZHYldwHFZvjFR2YVZHYlcwHFZvjFRyQTZHkicSMURQQkTRUkUgcVPGI1azDSVCUUahESUFgzazXjXvDkLWM2ZrEFNHIDSz4RZHYlZrElcUczXkAiUXMCLogzcHkWSz4RZHY1MVMld3TUXuQiUOglKosjcHIDR0U0QiUFLVg0LvjFR2gTdMQmKogjYLcjVmEzUYgCRBwDctjFRlwzUjMGLVkkdIcEY3fjPLQGUogjYHYEY1UTLhkGLogjcHIDRnslQhU2cVgEdvjFR1gDdKkic4sTSqQTTIkTUYMWQFIlcqwVXsUkZgoWRWQVN1M0TIEEURIUUVE1YAcjXuQSLYUDMFMFdqcDRqQiUXg1cVkkZvjFR2gjPHYWQrI1YvXUV5UEahkTTV8DZLc0X4E0UX8FMrgjYLYjVmQCags1cV8DZDkWSn4hTgsVSxH1YiYUVTs1QhsFLogzcHIDRy0TaXgCRn0jdHIDRx0TaXgCRRszcHg1S2nGURQzZpQ0ZvXEV1EzUZQ2Xw.ELI01XqEjTZQWPWMld3TUXuQiUOglKosjcHIDRuQiQhASTxb0bEYDY3fjTLgmXosjcHIDR0U0QiUFLVoEcvjFR2MiPLglK3EFLQIyUyUjQjgCRRwDdhk1R1gjPHk2YVgkcUY0Sn4RZKQiZCwjctLDS14xTNACSo0jLPkGS3gjPHk2ZWE1bUYzX3s1UOglKosDLHIDRns1QhcVSxHFNHIDSn4BZX8VPxDlbEwlX3fjPLg1Mn8zM2H0TIEEURIUUVE1YAcjXuQSLYUDMFMFdq01S2nGURQzZpQ0ZvXEV1EzUZQ2XVEEcQ0lXzDjTYQWQrgkbUYTV3fjTLglKBI1YIcEVyUkQisVRWIkZvjFRPsFajUSTvDFcUwFRlwjQZcFMrE1Z2Y0SnQTdMglKRE1ZMIiXmMlUYQ0ZGI1ZvjFR2gjPHMWSsgENHIESwfjPHIWSsgENHI0R2gDZOcidTIEQqoFUqAiUXYWPWoEciECTvjTaisVPRoEcAc0X5gSUg8FMV8DZtj1R1gjPH8FMFIFLQIyUyUjQjgCRRwDdhk1R1gjPHUWUGMVYvXkVzASZHY2LBwDZtfWXvDkLWMWQFQFNHIES3IVZKYGRBgTdmYEV1UkUOglKosjcHIDR4s1UgMWUFMFdqc0Sn4RZKACRBgDZqcjXm0jLhgCRBwDZtfFVuEjLgIWQrIFNHIDSncCZOcyMRMURQQkTRUkUgcVPGI1azDSVEQiQig2Zs8zM5QkTDslZTsFLVgkcAckVzMlUQQWTsIFMAIUVzUDaXIWUFkENHIESn4hPhcVRWg0bUYzXqkzURoFLogjc3XTXzDzQZUGMVQFTEwlXmACaHYFSFo0YzvVXqcmUOgFQ40DZtHUXq0jLhc1XVkEUqcjXqASZHcGRBgzbM0FV3fjPNcGRBgjbM0FV3fjTKcGRn8zM5QkTDslZTsFLVgkcAckVzMVLPASRsM1ZAIkVzEzUioGNUE1azX0Sn4RZKYGRBgzazXjXvDkLWMWQFQFNHIES3IVZKYGRBgTcUczXkAiUZQGLogjcyHDSn4BdgASTxb0bEYDY3fjTLgmXosjcHIDR4clUXYWUV8DZtj1R1gjPHk2ZWE1bUYzX3s1UOglKosDLHIDRns1QhcVSxHFNHIDSn4BZX8VPxDlbEwlX3fjPLg1Mn8zM2H0TIEEURIUUVE1YAcjXuQSLYUDMFMFdq01S2nGURQzZpQ0ZvXEV1EzUZQ2XVEEcQ0lXzDjTYQWQrgkbUYTV3fjTLglKBI1YIcEVyUkQisVRWIkZvjFRtUDahMGNrE1aMEiXPUDahcFLrgjYLYjVmQCags1cV8DZDkWSn4hTgsVSxH1YiYUVTs1QhsFLogzcHIDRy0TaXgCR30zLHIDRx0TaXgCRRszcHg1S2nGURQzZpQ0ZvXEV1EzUZQ2Xw.ELI01XqEjTZQWPWMld3TUXuQiUOglKosjcHIDRuQiQhASTxb0bEYDY3fjTLgmXosjcHIDR0U0QiUFLVoEcvjFR1MiPLglK3EFLQIyUyUjQjgCRRwDdhk1R1gjPHk2YVgkcUY0Sn4RZKYGRBgTdqcUXyUkQig2ZW8DZtj1RvfjPHg1ZGI1YMIiX3fjPLglKng0aAISXxUDahgCRBwDZ2f1S2biTSkTTTIkTUYUXmEzQh8FMwjUQzXzX3sVaOcidTIEQqoFUqAiUXYWPWoEciYUTzEUahQSPRkEcEwFVxUkQYgCRRwDZtHjXmkzUXMWUFM1ZIckTpASZHoWRWk0b3XTX0ETUXgWQVEFZtfGVtUDagQWUFEFNHIESn4hTgsVSxH1YiYUVTs1QhsFLogzcHIDRy0TaXgCR30DMHIDRx0TaXgCRRszcHg1S2nGURQzZpQ0ZvXEV1EzUZQ2Xw.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.idgoVUrgjYXcEVxU0UYgCRBwDctjFR0MyPOAUQrI1YvXUV5UEahYlKWgEdEYUXqE0UYg2ZDkENHglX0giUg0DNFkEL2YEV5sVLgQGNpE1SYwVVn4BZic1cVM1ZvjFR2MiPLg1Mn8zMtTEV3UjUgsVTWkEdAIjXmkzUXMWUFM1ZIckTpASZHgGNwD1bQQkV4E0UXQWSVkkPUYzXxTkUYQGLToUZM0FRlg0UXIWUWkENHIESxLiPLg1Mn8zM2HDUmkzUXMWUFM1ZIIiX4XWdKIENwD1bzLzSRgSLgMWPRokZvjFRocWLgkWUVM0aMEyU3gSLgMWRBgDcEYUXqASZHMzcwDVdUEyUMsVLXUVRvDVcvvFRlQkLhsVRW8DZtjFRlQkQY8VTWgEZ2YUV3fjPLglKRgUZQckVwTkUOglKogTN1MDUmkzUXMWUFM1ZIIiX4X2PTcVRWg0bUYzXqkzQHYWQrI1YvXUV5UEahkTTV8DZHISX0ASLT81aWkUdIIDRwTjQgASUV8DZtj1R1gDdKkicCQ0YIcEVyUkQisVRGgjcEwlXmAiUYoWUrIVRQY0SngjLgUGLVAEZMISX3EzQi8FNrEVSEYzXqkzUZc1cwHFZtf1XmcmUisFLogjcyHDSncCZOciKUgEdEYUXqE0UYgWPBI1YIcEVyUkQisVRWIkZvjFR3gSLgM2cToUdQcUVzUEahAENwH1aQckV0QCaHYFVWgkbUcUV3fDdLQmKogTcyLzSPUDahcFLVkkdUwlXl4xUXgWQVE1ZQcUV3sFQYgCRnIVc3XUXSgiUigWSVkEQUYTXms1USUWTVkEZtf1XmcmUisFLogjcyHDSncCZOciKUgEdEYUXqE0UYgWPBI1YIcEVyUkQisVRWIkZvjFR3gSLgMGL5ElZUcTXmE0UZUGMwLEc3nVVrkjPHESQFEFLUY0Sn4RZKYGR3sTN1MDUmkzUXMWUFM1ZIcDR1UDahcFLVkkdUwlXIEkUOgFRxDVcvXTTu0zQicFMwf0ZIQUV5M1UYsFMVM0aMEiXn4BZic1cVM1ZvjFR2IVZKYGR3sTN1k2RPUDahcFLVkkdUwlX4QyPOUGRvDVcvv1S2bCZTUGNVEVdzLzS0gDLgUGLwHVSEwVXmMlUYgGMC8TcHISX0ASLh8FLVMlbEYzX0kTaOciKxDVdqYzXugCag8FMwjUN1MjXmkzUXMWSs8zMtTETRUDUSYlZFkENHglX0giUgMENVMFdMYUVAQSLYIWUrgjYXcEVxU0UYgCRR4jcyHDSncCZOciKUAkTEQ0TlolQYgCRnIVc3XUXSgiUigWSVkEQqEiX5UDagkVUrgjYXcEVxU0UYgCR3wDctjFR0MyPOUmKWgEdEYUX4QyPOUmKxDVdqYzXugCag8FMwjUN1k2R1kjLg0VRWg0bzLzS4giUigWSVk0azvVV0EjTgcFMVMFaEECV5UUahsVRW8DZDQ0XpsVLgUFL5ElZUYTXuQSLYglKRE1YqwVXTUkQjoGLogzPUYTXxgCaHYFTxDlcQUUVyD0UOglYWwDZtfFV0E0QiUGLFU0ZmczX3fjTR4TSEUkTzHESn4BdXU2cwDFLIc0SngEaYsVSVgkZIkFVn4BdXUGLFIVczXUVzEkLT81aWkENHIDSn4BdhsVSFM1a3vVXMgiQYsFLogjcHg2R4XWdKk2XWg0bzLjKt3hKt3hKt3hKtXlTU0DUQAURWoULEYzXqEEUXoWQF4RPDYFTzDzUXkWSG4RPDYmKtnWPt3hKt3hKt3hKJUELPUTPqI1aYcEV5UkQQcVTWgEOujzPu0Fbu4VYtQmO77hUSQ0LPwVcmklaSQWXzUlO.."
                                    },
                                    "fileref": {
                                        "name": "SWAM Cello 3",
                                        "filename": "SWAM Cello 3_20260424.maxsnap",
                                        "filepath": "~/Documents/Max 9/Snapshots",
                                        "filepos": -1,
                                        "snapshotfileid": "8b5e06a35268f2b552c982231d98b4b7"
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
                    "id": "obj-23",
                    "maxclass": "message",
                    "numinlets": 2,
                    "numoutlets": 1,
                    "outlettype": [ "" ],
                    "patching_rect": [ 316.59829354286194, 474.0, 78.15789484977722, 22.0 ],
                    "text": "sexy-move"
                }
            },
            {
                "box": {
                    "id": "obj-22",
                    "maxclass": "message",
                    "numinlets": 2,
                    "numoutlets": 1,
                    "outlettype": [ "" ],
                    "patching_rect": [ 259.59829354286194, 474.0, 50.0, 22.0 ],
                    "text": "F'"
                }
            },
            {
                "box": {
                    "id": "obj-5",
                    "maxclass": "newobj",
                    "numinlets": 3,
                    "numoutlets": 3,
                    "outlettype": [ "", "", "" ],
                    "patching_rect": [ 290.59829354286194, 440.40171253681183, 188.63157868385315, 22.0 ],
                    "text": "route face spell"
                }
            },
            {
                "box": {
                    "id": "obj-15",
                    "maxclass": "newobj",
                    "numinlets": 1,
                    "numoutlets": 0,
                    "patching_rect": [ 205.12820720672607, 410.4871823191643, 145.0, 22.0 ],
                    "text": "udpsend 127.0.0.1 57122"
                }
            },
            {
                "box": {
                    "id": "obj-27",
                    "linecount": 3,
                    "maxclass": "comment",
                    "numinlets": 1,
                    "numoutlets": 0,
                    "patching_rect": [ 471.79487657546997, 355.7863270640373, 150.0, 48.0 ],
                    "text": "data knot to detect and route into various nn~ models.  "
                }
            },
            {
                "box": {
                    "fontname": "Arial",
                    "fontsize": 12.0,
                    "id": "obj-19",
                    "maxclass": "message",
                    "numinlets": 2,
                    "numoutlets": 1,
                    "outlettype": [ "" ],
                    "patching_rect": [ 35.042735397815704, 410.4871823191643, 148.0, 22.0 ],
                    "text": "read xenakube_2.swam"
                }
            },
            {
                "box": {
                    "id": "obj-7",
                    "maxclass": "ezdac~",
                    "numinlets": 2,
                    "numoutlets": 0,
                    "patching_rect": [ 35.042735397815704, 218.60683900117874, 48.0, 48.0 ]
                }
            },
            {
                "box": {
                    "id": "obj-4",
                    "maxclass": "newobj",
                    "numinlets": 1,
                    "numoutlets": 1,
                    "outlettype": [ "bang" ],
                    "patching_rect": [ 35.042735397815704, 410.4871823191643, 58.0, 22.0 ],
                    "text": "loadbang"
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
                    "patching_rect": [ 151.28205281496048, 324.16239511966705, 24.0, 24.0 ]
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
                    "patching_rect": [ 35.042735397815704, 268.60683900117874, 48.0, 48.0 ]
                }
            },
            {
                "box": {
                    "id": "obj-10",
                    "maxclass": "newobj",
                    "numinlets": 2,
                    "numoutlets": 1,
                    "outlettype": [ "" ],
                    "patching_rect": [ 35.042735397815704, 355.7863270640373, 32.0, 22.0 ],
                    "text": "gate"
                }
            },
            {
                "box": {
                    "filename": "xk_swam.js",
                    "id": "obj-2",
                    "maxclass": "newobj",
                    "numinlets": 1,
                    "numoutlets": 4,
                    "outlettype": [ "", "", "", "" ],
                    "patching_rect": [ 35.042735397815704, 385.7008572816849, 274.3589771389961, 22.0 ],
                    "saved_object_attributes": {
                        "parameter_enable": 0
                    },
                    "text": "v8 xk_swam.js @autowatch 1",
                    "textfile": {
                        "filename": "xk_swam.js",
                        "flags": 0,
                        "embed": 0,
                        "autowatch": 1
                    },
                    "varname": "v8"
                }
            },
            {
                "box": {
                    "id": "obj-1",
                    "maxclass": "newobj",
                    "numinlets": 1,
                    "numoutlets": 1,
                    "outlettype": [ "" ],
                    "patching_rect": [ 47.008547484874725, 324.16239511966705, 104.0, 22.0 ],
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
                    "destination": [ "obj-29", 0 ],
                    "source": [ "obj-11", 0 ]
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
                    "destination": [ "obj-138", 0 ],
                    "source": [ "obj-13", 0 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-139", 0 ],
                    "source": [ "obj-13", 1 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-13", 0 ],
                    "source": [ "obj-19", 0 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-13", 0 ],
                    "source": [ "obj-2", 0 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-15", 0 ],
                    "source": [ "obj-2", 2 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-5", 0 ],
                    "source": [ "obj-2", 3 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-29", 1 ],
                    "source": [ "obj-26", 0 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-7", 1 ],
                    "source": [ "obj-29", 1 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-7", 0 ],
                    "source": [ "obj-29", 0 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-19", 0 ],
                    "source": [ "obj-4", 0 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-22", 1 ],
                    "source": [ "obj-5", 0 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-23", 1 ],
                    "source": [ "obj-5", 1 ]
                }
            }
        ],
        "parameters": {
            "obj-13": [ "vst~[2]", "vst~[2]", 0 ],
            "obj-28::obj-1": [ "vst~", "vst~", 0 ],
            "obj-28::obj-16": [ "live.gain~[2]", "live.gain~", 0 ],
            "obj-28::obj-24": [ "live.gain~[1]", "live.gain~", 0 ],
            "obj-28::obj-6": [ "live.gain~", "live.gain~", 0 ],
            "obj-29": [ "live.gain~[3]", "live.gain~[3]", 0 ],
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
        "autosave": 0,
        "styles": [
            {
                "name": "rnbohighcontrast",
                "default": {
                    "accentcolor": [ 0.666666666666667, 0.666666666666667, 0.666666666666667, 1.0 ],
                    "bgcolor": [ 0.0, 0.0, 0.0, 1.0 ],
                    "bgfillcolor": {
                        "angle": 270.0,
                        "autogradient": 0.0,
                        "color": [ 0.0, 0.0, 0.0, 1.0 ],
                        "color1": [ 0.090196078431373, 0.090196078431373, 0.090196078431373, 1.0 ],
                        "color2": [ 0.156862745098039, 0.168627450980392, 0.164705882352941, 1.0 ],
                        "proportion": 0.5,
                        "type": "color"
                    },
                    "clearcolor": [ 1.0, 1.0, 1.0, 0.0 ],
                    "color": [ 1.0, 0.874509803921569, 0.141176470588235, 1.0 ],
                    "editing_bgcolor": [ 0.258823529411765, 0.258823529411765, 0.258823529411765, 1.0 ],
                    "elementcolor": [ 0.223386004567146, 0.254748553037643, 0.998085916042328, 1.0 ],
                    "fontsize": [ 13.0 ],
                    "locked_bgcolor": [ 0.258823529411765, 0.258823529411765, 0.258823529411765, 1.0 ],
                    "selectioncolor": [ 0.301960784313725, 0.694117647058824, 0.949019607843137, 1.0 ],
                    "stripecolor": [ 0.258823529411765, 0.258823529411765, 0.258823529411765, 1.0 ],
                    "textcolor": [ 1.0, 1.0, 1.0, 1.0 ],
                    "textcolor_inverse": [ 1.0, 1.0, 1.0, 1.0 ]
                },
                "parentstyle": "",
                "multi": 0
            }
        ]
    }
}