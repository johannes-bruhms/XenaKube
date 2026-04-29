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
        "rect": [ 691.0, 232.0, 693.0, 738.0 ],
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
                        "rect": [ 595.0, 100.0, 1417.0, 782.0 ],
                        "boxes": [
                            {
                                "box": {
                                    "id": "obj-26",
                                    "maxclass": "newobj",
                                    "numinlets": 1,
                                    "numoutlets": 0,
                                    "patching_rect": [ 54.878050088882446, 874.390264749527, 48.0, 22.0 ],
                                    "text": "s~ out2"
                                }
                            },
                            {
                                "box": {
                                    "id": "obj-11",
                                    "maxclass": "newobj",
                                    "numinlets": 1,
                                    "numoutlets": 0,
                                    "patching_rect": [ 47.56097674369812, 850.0000202655792, 48.0, 22.0 ],
                                    "text": "s~ out1"
                                }
                            },
                            {
                                "box": {
                                    "id": "obj-140",
                                    "maxclass": "newobj",
                                    "numinlets": 1,
                                    "numoutlets": 1,
                                    "outlettype": [ "signal" ],
                                    "patching_rect": [ 135.36585688591003, 113.41463685035706, 72.0, 22.0 ],
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
                                    "patching_rect": [ 47.56097674369812, 113.41463685035706, 72.0, 22.0 ],
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
                                    "patching_rect": [ 47.56097674369812, 359.75610613822937, 159.0, 22.0 ],
                                    "text": "abl.dsp.saturator~ @mix 0.1",
                                    "varname": "abl.dsp.darkhall~_AA[2]"
                                }
                            },
                            {
                                "box": {
                                    "id": "obj-9",
                                    "maxclass": "comment",
                                    "numinlets": 1,
                                    "numoutlets": 0,
                                    "patching_rect": [ 623.1707465648651, 389.0243995189667, 151.0, 20.0 ],
                                    "text": "Adjust the output gain (dB)"
                                }
                            },
                            {
                                "box": {
                                    "id": "obj-130",
                                    "maxclass": "comment",
                                    "numinlets": 1,
                                    "numoutlets": 0,
                                    "patching_rect": [ 646.3414788246155, 358.536593914032, 215.0, 20.0 ],
                                    "text": "Enable/disable built-in post-FX clipper"
                                }
                            },
                            {
                                "box": {
                                    "id": "obj-131",
                                    "maxclass": "comment",
                                    "numinlets": 1,
                                    "numoutlets": 0,
                                    "patching_rect": [ 600.0000143051147, 329.2683005332947, 202.0, 20.0 ],
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
                                    "patching_rect": [ 464.6341574192047, 329.2683005332947, 130.0, 22.0 ]
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
                                    "patching_rect": [ 464.6341574192047, 358.536593914032, 185.47008734941483, 22.0 ]
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
                                    "patching_rect": [ 464.6341574192047, 389.0243995189667, 150.0, 22.0 ]
                                }
                            },
                            {
                                "box": {
                                    "id": "obj-117",
                                    "maxclass": "newobj",
                                    "numinlets": 5,
                                    "numoutlets": 2,
                                    "outlettype": [ "signal", "signal" ],
                                    "patching_rect": [ 47.56097674369812, 252.43903040885925, 639.0, 22.0 ],
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
                                    "patching_rect": [ 464.6341574192047, 248.7804937362671, 121.0, 22.0 ],
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
                                    "patching_rect": [ 464.6341574192047, 274.39025044441223, 121.0, 22.0 ],
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
                                    "patching_rect": [ 464.6341574192047, 300.0000071525574, 164.0, 22.0 ],
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
                                    "patching_rect": [ 878.0488014221191, 442.68293738365173, 66.36842060089089, 22.0 ],
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
                                    "patching_rect": [ 671.9512355327606, 480.48781633377075, 19.07894718647003, 114.0 ],
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
                                    "patching_rect": [ 959.7561204433441, 675.6097722053528, 150.0, 22.0 ]
                                }
                            },
                            {
                                "box": {
                                    "id": "obj-39",
                                    "maxclass": "newobj",
                                    "numinlets": 1,
                                    "numoutlets": 2,
                                    "outlettype": [ "signal", "signal" ],
                                    "patching_rect": [ 626.8292832374573, 696.3414800167084, 144.0, 22.0 ],
                                    "text": "nn~ percussion forward 0"
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
                                    "patching_rect": [ 893.9024603366852, 513.4146463871002, 150.0, 22.0 ]
                                }
                            },
                            {
                                "box": {
                                    "id": "obj-63",
                                    "maxclass": "newobj",
                                    "numinlets": 1,
                                    "numoutlets": 2,
                                    "outlettype": [ "signal", "signal" ],
                                    "patching_rect": [ 706.0975778102875, 520.7317197322845, 118.0, 22.0 ],
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
                                    "patching_rect": [ 810.9756290912628, 623.1707465648651, 150.0, 22.0 ]
                                }
                            },
                            {
                                "box": {
                                    "id": "obj-57",
                                    "maxclass": "newobj",
                                    "numinlets": 1,
                                    "numoutlets": 1,
                                    "outlettype": [ "signal" ],
                                    "patching_rect": [ 676.8292844295502, 623.1707465648651, 112.0, 22.0 ],
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
                                    "patching_rect": [ 878.0488014221191, 473.1707429885864, 150.0, 22.0 ]
                                }
                            },
                            {
                                "box": {
                                    "id": "obj-50",
                                    "maxclass": "newobj",
                                    "numinlets": 1,
                                    "numoutlets": 1,
                                    "outlettype": [ "signal" ],
                                    "patching_rect": [ 706.0975778102875, 496.3414752483368, 123.0, 22.0 ],
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
                                    "patching_rect": [ 403.6585462093353, 478.048791885376, 43.0, 22.0 ],
                                    "text": "r~ nno"
                                }
                            },
                            {
                                "box": {
                                    "id": "obj-47",
                                    "maxclass": "newobj",
                                    "numinlets": 1,
                                    "numoutlets": 0,
                                    "patching_rect": [ 786.5853846073151, 726.8292856216431, 45.0, 22.0 ],
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
                                    "patching_rect": [ 553.658549785614, 491.46342635154724, 36.0, 22.0 ],
                                    "text": "r~ nn"
                                }
                            },
                            {
                                "box": {
                                    "id": "obj-42",
                                    "maxclass": "newobj",
                                    "numinlets": 1,
                                    "numoutlets": 0,
                                    "patching_rect": [ 406.0975706577301, 437.8048884868622, 38.0, 22.0 ],
                                    "text": "s~ nn"
                                }
                            },
                            {
                                "box": {
                                    "id": "obj-17",
                                    "maxclass": "newobj",
                                    "numinlets": 1,
                                    "numoutlets": 1,
                                    "outlettype": [ "" ],
                                    "patching_rect": [ 878.0488014221191, 469.51220631599426, 70.0, 22.0 ],
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
                                    "patching_rect": [ 47.56097674369812, 702.4390411376953, 48.0, 136.0 ],
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
                                    "patching_rect": [ 389.0243995189667, 514.6341586112976, 48.0, 136.0 ],
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
                                    "patching_rect": [ 1197.5610041618347, 586.5853798389435, 150.0, 407.0 ],
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
                                    "patching_rect": [ 281.70732378959656, 741.4634323120117, 184.98193097114563, 69.0 ]
                                }
                            },
                            {
                                "box": {
                                    "id": "obj-52",
                                    "maxclass": "newobj",
                                    "numinlets": 3,
                                    "numoutlets": 3,
                                    "outlettype": [ "signal", "signal", "signal" ],
                                    "patching_rect": [ 47.56097674369812, 671.9512355327606, 400.0, 22.0 ],
                                    "text": "abl.device.limiter~ @maximize 1 @threshold -3. @mode 1 @lookahead 6"
                                }
                            },
                            {
                                "box": {
                                    "id": "obj-31",
                                    "maxclass": "newobj",
                                    "numinlets": 1,
                                    "numoutlets": 1,
                                    "outlettype": [ "signal" ],
                                    "patching_rect": [ 135.36585688591003, 185.36585807800293, 186.0, 22.0 ],
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
                                    "patching_rect": [ 47.56097674369812, 159.7561013698578, 186.0, 22.0 ],
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
                                    "patching_rect": [ 47.56097674369812, 514.6341586112976, 48.0, 136.0 ],
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
                                    "midpoints": [ 474.1341574192047, 273.0125033259392, 457.44131803512573, 273.0125033259392, 457.44131803512573, 345.0125033259392, 57.06097674369812, 345.0125033259392 ],
                                    "source": [ "obj-103", 0 ]
                                }
                            },
                            {
                                "patchline": {
                                    "destination": [ "obj-135", 0 ],
                                    "midpoints": [ 474.1341574192047, 341.4569482207298, 57.06097674369812, 341.4569482207298 ],
                                    "source": [ "obj-104", 0 ]
                                }
                            },
                            {
                                "patchline": {
                                    "destination": [ "obj-135", 0 ],
                                    "midpoints": [ 474.1341574192047, 346.2347257733345, 57.06097674369812, 346.2347257733345 ],
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
                                    "midpoints": [ 474.1341574192047, 351.0125033259392, 226.52678781747818, 351.0125033259392, 226.52678781747818, 345.0125033259392, 57.06097674369812, 345.0125033259392 ],
                                    "source": [ "obj-132", 0 ]
                                }
                            },
                            {
                                "patchline": {
                                    "destination": [ "obj-135", 0 ],
                                    "midpoints": [ 474.1341574192047, 342.55096447467804, 226.52678781747818, 342.55096447467804, 226.52678781747818, 345.0125033259392, 57.06097674369812, 345.0125033259392 ],
                                    "source": [ "obj-133", 0 ]
                                }
                            },
                            {
                                "patchline": {
                                    "destination": [ "obj-135", 0 ],
                                    "midpoints": [ 474.1341574192047, 347.3458359837532, 226.52678781747818, 347.3458359837532, 226.52678781747818, 345.0125033259392, 57.06097674369812, 345.0125033259392 ],
                                    "source": [ "obj-134", 0 ]
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
                                    "destination": [ "obj-6", 1 ],
                                    "order": 1,
                                    "source": [ "obj-135", 1 ]
                                }
                            },
                            {
                                "patchline": {
                                    "destination": [ "obj-6", 0 ],
                                    "order": 1,
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
                                    "destination": [ "obj-47", 0 ],
                                    "source": [ "obj-39", 0 ]
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
                                    "source": [ "obj-52", 1 ]
                                }
                            },
                            {
                                "patchline": {
                                    "destination": [ "obj-16", 0 ],
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
                            "blob": "22365.VMjLgP0U...O+fWarAhckI2bo8la8HRLt.iHfTlai8FYo41Y8HRUTYTK3HxO9.BOVMEUy.Ea0cVZtMEcgQWY9vSRC8Vav8lak4Fc9DiM1fCNtXUSGM1UA4hKtXlKt3hKP4hKt3hKtvjdXQ2bD4hKDQjQFkjdP4VPt3hKHYGUoUULL4BS1IjKt3hKtPjKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKA4VUCkzTHYiKD4hK1k2Sy.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.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.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.SZHY2LR0DZtfFVzDzUXkWSW8DZtjFRlgjUZYGNFE1YIc0Sn4RZHU2LC8Tc5QkTDslZTsFLVgkcAckVzMlUQQWTsIFMzLzSMsFQQkTRUk0bEYjX1sFag0VUpEldIcEYlQEagcVRFE1ZQY0SnQTZHYlKWgEdEYUXqE0UYg2ZDkENHIDUu8VajQENrE1ZIIDRoclUXQGMVkkbvjFR2IVZHYldVkUdMcEVsUkQUQSPWkENHIESn4hTgkWRV8DZDkVSn4hPgkWRV8DZ5IESnMyPO0zZDEURIUUVyUjQhY2ZrEVaMQ0X3k0UYYlZrElcUczXkAiUZQGLogjcyHDSn4hTZQWPWMld3TUXmc1UOgFQowjLyHDSn4BdgASTxb0bqwVX3fjPLQmKogjY2X0X5gSUgc1YW8DZDkFSxLiPLglK3IlaEYjXqASZHY2LBwDZtfmXz.iUgsVTsIFMvjFR1MiTMglKngEMAcEV40zUOglKogjYHYkV1giQgcVRW8DZtjFR0MyPOUmdTIEQqoFUqAiUXYWPWoEciYUTzEUahQCMC8TSqQTTIkTUYMWQFIlcqwVXsUkZgoWRWQlYTwVXmkjQgsVTV8DZDkFRl4xUXgWQVE1ZQcUV3sFQYgCRBIVc2YEY1cVLgQ2ZGQ0YIcEVykjPHk1YVgEczXUVxASZHcmXogjY5YUV40zUX0VUFUEMAcUV3fjTLglKREVdIY0SnY1TLglKBEVdIY0SnomTLg1LC8TSqQTTIkTUYMWQFIlcqwVXs0DUigWVWkkYpwVX1U0QiUFLVoEcvjFR1MiPLglKRoEcAc0X5gSUgc1YW8DZDkFSxLiPLglK3EFLQIyUysFaggCRBwDctjFRlciUioGNUE1Ymc0SnQTZLIyLBwDZtfmXtUjQhsFLogjcyHDSn4BdhQCLVE1ZQ0lXz.SZHY2LR0DZtfFVzDzUXkWSW8DZtjFRlgjUZYGNFE1YIc0Sn4RZHU2LC8Tc5QkTDslZTsFLVgkcAckVzMlUQQWTsIFMzLzSMsFQQkTRUk0bEYjX1sFag0VUpEldIcEYlQEagcVRFE1ZQY0SnQTZHYlKWgEdEYUXqE0UYg2ZDkENHIjVmkzUgUGMVoUZMcDUmkzUXMWRBgTZmYEVzQiUYIGLogzchkFRlomUYkWSWgUaUYTUzDzUYgCRRwDZtHUX4kjUOglXC4DZtHTX4kjUOgldRwDZyLzSMsFQQkTRUk0bEYjX1sFag0VSTMFdYcUVloFagYWUGMVYvXkVzASZHY2LBwDZtHkVzEzUioGNUE1Ymc0SnQTZLIyLBwDZtfWXvDkLWM2ZrEFNHIDSz4RZHY1MVMld3TUXmc1UOgFQowjLyHDSn4Bdh4VQFI1ZvjFR1MiPLglK3IFMvXUXqEUahQCLogjcyHUSn4BZXQSPWgUdMc0Sn4RZHYFRVokc3XTXmkzUOglKogTcyLzS0oGURQzZpQ0ZvXEV1EzUZQ2XVEEcQ0lXzPyPO0zZDEURIUUVyUjQhY2ZrEVaUoVX5kzUjYFUrE1YIYTXqEkUOgFQogjYtbEV3UjUgsVTWkEdqQTV3fjPigWUVEVc2ESXPUDahcFLrgjYLYjVmQCags1cV8DZDkFRlomUYkWSWgUaUYTUzDzUYgCRRwDZtHUX4kjUOglXS4DZtHTX4kjUOgldRwDZyLzSMsFQQkTRUk0bEYjX1sFag0VSTMFdYcUVloFagYWUGMVYvXkVzASZHY2LBwDZtHkVzEzUioGNUE1Ymc0SnQTZLIyLBwDZtfWXvDkLWM2ZrEFNHIDSz4RZHY1MVMld3TUXmc1UOgFQowjLyHDSn4Bdh4VQFI1ZvjFR1MiPLglK3IFMvXUXqEUahQCLogjcyHUSn4BZXQSPWgUdMc0Sn4RZHYFRVokc3XTXmkzUOglKogTcyLzS0oGURQzZpQ0ZvXEV1EzUZQ2XVEEcQ0lXzPyPO0zZDEURIUUVyUjQhY2ZrEVaUoVX5kzUjYFUrE1YIYTXqEkUOglKogjYtbEV3UjUgsVTWkEdqQTV3fDZis1cwDVZqYzXzjjPHk1YVgEczXUVxASZHcmXogjY5YUV40zUX0VUFUEMAcUV3fjPMglKREVdIY0SnomTLglKBEVdIY0SnomTLg1LC8TSqQTTIkTUYMWQFIlcqwVXs0DUigWVWkkYpwVX1U0QiUFLVoEcvjFR1MiPLglKRoEcAc0X5gSUgc1YW8DZDkFSxLiPLglK3EFLQIyUysFaggCRRwDctjFRlciUioGNUE1Ymc0SnQTZLIyLBwDZtfmXtUjQhsFLogjcyHDSn4BdhQCLVE1ZQ0lXz.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.CaXsVRW8DZDkFR4XWZgUWTWkkYpYTV3fjPLglK3IldEYzXvzzUOglKogjYXcEVxU0UYgCRRsDLtjFRlMSLgoWUrM0YvXUV3fDdPg1Mn8zMyDSX5UkQH8VTV8DZDkFRlwzQicVTWMVdvjFR1gjPHESQFEFLUY0SnomTMYGRBgDc3XzXqQCUXMWUV8DZLoGRncCZOcyLwDldUYDRuEkUOgFRogjYLczXmE0UikGLogjcHIDRwTjQgASUV8DZ5IUS1gjPHQGNFM1ZzPEVyUkUOgFTpgTcyLzSzgiQisVPRokZvjFR4gjPHkWTWgkdUIiX3fjPLglKnM1Y2Y0XqASZHMGUCwDZtfVX0E0UY4TQVE1ZvjFRD0DZHU2LC8Dc3XzXqEjTZoFLogjdHIDR4E0UXoWUxHFNHIDSn4BZic1cVM1ZvjFRyQ0PLglKnEVcQcUVNUjUgsFLogTQIg2R4XWZgUWTWkkYpYTV3fjTMglK3IldEYzXvzzUOglKogjYXcEVxU0UYgCRRsDLtjFRlMSLgoWUrM0YvXUV3fDZQg1Mn8zMyDSX5UkQH8VTV8DZXkFRlwzQicVTWMVdvjFR1gjPHESQFEFLUY0SnomTMYGRBgDc3XzXqQCUXMWUV8DZXoGRncCZOcyLwDldUYDRuEkUOglXogjYLczXmE0UikGLogjcHIDRwTjQgASUV8DZ5IUS1gjPHQGNFM1ZzPEVyUkUOglXpgTcyLzSzgiQisVPRokZvjFRyfjPHkWTWgkdUIiX3fjPLglKnM1Y2Y0XqASZHMGUCwDZtfVX0E0UY4TQVE1ZvjFRG0DZHU2LC8Dc3XzXqEjTZoFLogDMHIDR4E0UXoWUxHFNHIDSn4BZic1cVM1ZvjFRyQ0PLglKnEVcQcUVNUjUgsFLogTPIg2R4XWZgUWTWkkYpYTV3fjTLYGRBgTdQcEV5UkLhgCRBwDZtf1XmcmUisFLogzbTMDSn4BZgUWTWkkSEYUXqASZHETSngTcyLzSzgiQisVPRokZvjFR2QTZHYFSGM1YQc0X4ASZHYGRBgTLEYTXvTkUOgldR0jcHIDRzgiQisFMTg0bUY0SngjZHU2LC8TctzlXq0zUYoGMC8jcIcUV4UkQiYFSGEVcQ01Tv.CaXsVRW8DZHkFR4XWZgUWTWkkYpYTV3fjPLglK3IldEYzXvzzUOglKogjYXcEVxU0UYgCRRsDLtjFRlMSLgoWUrM0YvXUV3fDdPg1Mn8zMyDSX5UkQH8VTV8DZDkFRlwzQicVTWMVdvjFR1gjPHESQFEFLUY0SnomTMYGRBgDc3XzXqQCUXMWUV8DZLoGRncCZOcyLwDldUYDRuEkUOgFRogjYLczXmE0UikGLogjcHIDRwTjQgASUV8DZ5IUS1gjPHQGNFM1ZzPEVyUkUOgFTpgTcyLzSzgiQisVPRokZvjFR4gjPHkWTWgkdUIiX3fjPLglKnM1Y2Y0XqASZHMGUCwDZtfVX0E0UY4TQVE1ZvjFRD0DZHU2LC8Dc3XzXqEjTZoFLogjdHIDR4E0UXoWUxHFNHIDSn4BZic1cVM1ZvjFRyQ0PLglKnEVcQcUVNUjUgsFLogTQIg2R4XWZgUWTWkkYpYTV3fjTMglK3IldEYzXvzzUOglKogjYXcEVxU0UYgCRRsDLtjFRlMSLgoWUrM0YvXUV3fDZQg1Mn8zMyDSX5UkQH8VTV8DZXkFRlwzQicVTWMVdvjFR1gjPHESQFEFLUY0SnomTMYGRBgDc3XzXqQCUXMWUV8DZXoGRncCZOcyLwDldUYDRuEkUOglXogjYLczXmE0UikGLogjcHIDRwTjQgASUV8DZ5IUS1gjPHQGNFM1ZzPEVyUkUOglXpgTcyLzSzgiQisVPRokZvjFRyfjPHkWTWgkdUIiX3fjPLglKnM1Y2Y0XqASZHMGUCwDZtfVX0E0UY4TQVE1ZvjFRG0DZHU2LC8Dc3XzXqEjTZoFLogDMHIDR4E0UXoWUxHFNHIDSn4BZic1cVM1ZvjFRyQ0PLglKnEVcQcUVNUjUgsFLogTPIg2R4XWZgUWTWkkYpYTV3fjTLYGRBgTdQcEV5UkLhgCRBwDZtf1XmcmUisFLogzbTMDSn4BZgUWTWkkSEYUXqASZHETSngTcyLzSzgiQisVPRokZvjFR2QTZHYFSGM1YQc0X4ASZHYGRBgTLEYTXvTkUOgldR0jcHIDRzgiQisFMTg0bUY0SngjZHU2LC8TctzlXq0zUYoGMC8jcIcUV4UkQiYFSGEVcQ01Tv.CaXsVRW8DZLkFR4XWZgUWTWkkYpYTV3fjPLglK3IldEYzXvzzUOglKogjYXcEVxU0UYgCRRsDLtjFRlMSLgoWUrM0YvXUV3fDdPg1Mn8zMyDSX5UkQH8VTV8DZDkFRlwzQicVTWMVdvjFR1gjPHESQFEFLUY0SnomTMYGRBgDc3XzXqQCUXMWUV8DZLoGRncCZOcyLwDldUYDRuEkUOgFRogjYLczXmE0UikGLogjcHIDRwTjQgASUV8DZ5IUS1gjPHQGNFM1ZzPEVyUkUOgFTpgTcyLzSzgiQisVPRokZvjFR4gjPHkWTWgkdUIiX3fjPLglKnM1Y2Y0XqASZHMGUCwDZtfVX0E0UY4TQVE1ZvjFRD0DZHU2LC8Dc3XzXqEjTZoFLogjdHIDR4E0UXoWUxHFNHIDSn4BZic1cVM1ZvjFRyQ0PLglKnEVcQcUVNUjUgsFLogTQIg2R4XWZgUWTWkkYpYTV3fjTMglK3IldEYzXvzzUOglKogjYXcEVxU0UYgCRRsDLtjFRlMSLgoWUrM0YvXUV3fDZQg1Mn8zMyDSX5UkQH8VTV8DZXkFRlwzQicVTWMVdvjFR1gjPHESQFEFLUY0SnomTMYGRBgDc3XzXqQCUXMWUV8DZXoGRncCZOcyLwDldUYDRuEkUOglXogjYLczXmE0UikGLogjcHIDRwTjQgASUV8DZ5IUS1gjPHQGNFM1ZzPEVyUkUOglXpgTcyLzSzgiQisVPRokZvjFRyfjPHkWTWgkdUIiX3fjPLglKnM1Y2Y0XqASZHMGUCwDZtfVX0E0UY4TQVE1ZvjFRG0DZHU2LC8Dc3XzXqEjTZoFLogDMHIDR4E0UXoWUxHFNHIDSn4BZic1cVM1ZvjFRyQ0PLglKnEVcQcUVNUjUgsFLogTPIg2R4XWZgUWTWkkYpYTV3fjTLYGRBgTdQcEV5UkLhgCRBwDZtf1XmcmUisFLogzbTMDSn4BZgUWTWkkSEYUXqASZHETSngTcyLzSzgiQisVPRokZvjFR2QTZHYFSGM1YQc0X4ASZHYGRBgTLEYTXvTkUOgldR0jcHIDRzgiQisFMTg0bUY0SngjZHU2LC8TctzlXq0zUYoGMC8jcIcUV4UkQiYFSGEVcQ01Tv.CaXsVRW8DZPkFR4XWZgUWTWkkYpYTV3fjPLglK3IldEYzXvzzUOglKogjYXcEVxU0UYgCRRsDLtjFRlMSLgoWUrM0YvXUV3fDdPg1Mn8zMyDSX5UkQH8VTV8DZDkFRlwzQicVTWMVdvjFR1gjPHESQFEFLUY0SnomTMYGRBgDc3XzXqQCUXMWUV8DZLoGRncCZOcyLwDldUYDRuEkUOgFRogjYLczXmE0UikGLogjcHIDRwTjQgASUV8DZ5IUS1gjPHQGNFM1ZzPEVyUkUOgFTpgTcyLzSzgiQisVPRokZvjFR4gjPHkWTWgkdUIiX3fjPLglKnM1Y2Y0XqASZHMGUCwDZtfVX0E0UY4TQVE1ZvjFRD0DZHU2LC8Dc3XzXqEjTZoFLogjdHIDR4E0UXoWUxHFNHIDSn4BZic1cVM1ZvjFRyQ0PLglKnEVcQcUVNUjUgsFLogTQIg2R4XWZgUWTWkkYpYTV3fjTMglK3IldEYzXvzzUOglKogjYXcEVxU0UYgCRRsDLtjFRlMSLgoWUrM0YvXUV3fDZQg1Mn8zMyDSX5UkQH8VTV8DZXkFRlwzQicVTWMVdvjFR1gjPHESQFEFLUY0SnomTMYGRBgDc3XzXqQCUXMWUV8DZXoGRncCZOcyLwDldUYDRuEkUOglXogjYLczXmE0UikGLogjcHIDRwTjQgASUV8DZ5IUS1gjPHQGNFM1ZzPEVyUkUOglXpgTcyLzSzgiQisVPRokZvjFRyfjPHkWTWgkdUIiX3fjPLglKnM1Y2Y0XqASZHMGUCwDZtfVX0E0UY4TQVE1ZvjFRG0DZHU2LC8Dc3XzXqEjTZoFLogDMHIDR4E0UXoWUxHFNHIDSn4BZic1cVM1ZvjFRyQ0PLglKnEVcQcUVNUjUgsFLogTPIg2R4XWZgUWTWkkYpYTV3fjTLYGRBgTdQcEV5UkLhgCRBwDZtf1XmcmUisFLogzbTMDSn4BZgUWTWkkSEYUXqASZHETSngTcyLzSzgiQisVPRokZvjFR2QTZHYFSGM1YQc0X4ASZHYGRBgTLEYTXvTkUOgldR0jcHIDRzgiQisFMTg0bUY0SngjZHU2LC8TctzlXq0zUYoGMC8jcIcUV4UkQiYFSGEVcQ01Tv.CaXsVRW8DZTkFR4XWZgUWTWkkYpYTV3fjPLglK3IldEYzXvzzUOglKogjYXcEVxU0UYgCRRsDLtjFRlMSLgoWUrM0YvXUV3fDdPg1Mn8zMyDSX5UkQH8VTV8DZDkFRlwzQicVTWMVdvjFR1gjPHESQFEFLUY0SnomTMYGRBgDc3XzXqQCUXMWUV8DZLoGRncCZOcyLwDldUYDRuEkUOgFRogjYLczXmE0UikGLogjcHIDRwTjQgASUV8DZ5IUS1gjPHQGNFM1ZzPEVyUkUOgFTpgTcyLzSzgiQisVPRokZvjFR4gjPHkWTWgkdUIiX3fjPLglKnM1Y2Y0XqASZHMGUCwDZtfVX0E0UY4TQVE1ZvjFRD0DZHU2LC8Dc3XzXqEjTZoFLogjdHIDR4E0UXoWUxHFNHIDSn4BZic1cVM1ZvjFRyQ0PLglKnEVcQcUVNUjUgsFLogTQIg2R4XWZgUWTWkkYpYTV3fjTMglK3IldEYzXvzzUOglKogjYXcEVxU0UYgCRRsDLtjFRlMSLgoWUrM0YvXUV3fDZQg1Mn8zMyDSX5UkQH8VTV8DZXkFRlwzQicVTWMVdvjFR1gjPHESQFEFLUY0SnomTMYGRBgDc3XzXqQCUXMWUV8DZXoGRncCZOcyLwDldUYDRuEkUOglXogjYLczXmE0UikGLogjcHIDRwTjQgASUV8DZ5IUS1gjPHQGNFM1ZzPEVyUkUOglXpgTcyLzSzgiQisVPRokZvjFRyfjPHkWTWgkdUIiX3fjPLglKnM1Y2Y0XqASZHMGUCwDZtfVX0E0UY4TQVE1ZvjFRG0DZHU2LC8Dc3XzXqEjTZoFLogDMHIDR4E0UXoWUxHFNHIDSn4BZic1cVM1ZvjFRyQ0PLglKnEVcQcUVNUjUgsFLogTPIg2R4XWZgUWTWkkYpYTV3fjTLYGRBgTdQcEV5UkLhgCRBwDZtf1XmcmUisFLogzbTMDSn4BZgUWTWkkSEYUXqASZHETSngTcyLzSzgiQisVPRokZvjFR2QTZHYFSGM1YQc0X4ASZHYGRBgTLEYTXvTkUOgldR0jcHIDRzgiQisFMTg0bUY0SngjZHU2LC8TctzlXq0zUYoGMC8jcIcUV4UkQiYFSGEVcQ01Tv.CaXsVRW8DZXkFR4XWZgUWTWkkYpYTV3fjPLglK3IldEYzXvzzUOglKogjYXcEVxU0UYgCRRsDLtjFRlMSLgoWUrM0YvXUV3fDdPg1Mn8zMyDSX5UkQH8VTV8DZDkFRlwzQicVTWMVdvjFR1gjPHESQFEFLUY0SnomTMYGRBgDc3XzXqQCUXMWUV8DZLoGRncCZOcyLwDldUYDRuEkUOgFRogjYLczXmE0UikGLogjcHIDRwTjQgASUV8DZ5IUS1gjPHQGNFM1ZzPEVyUkUOgFTpgTcyLzSzgiQisVPRokZvjFR4gjPHkWTWgkdUIiX3fjPLglKnM1Y2Y0XqASZHMGUCwDZtfVX0E0UY4TQVE1ZvjFRD0DZHU2LC8Dc3XzXqEjTZoFLogjdHIDR4E0UXoWUxHFNHIDSn4BZic1cVM1ZvjFRyQ0PLglKnEVcQcUVNUjUgsFLogTQIg2R4XWZgUWTWkkYpYTV3fjTMglK3IldEYzXvzzUOglKogjYXcEVxU0UYgCRRsDLtjFRlMSLgoWUrM0YvXUV3fDZQg1Mn8zMyDSX5UkQH8VTV8DZXkFRlwzQicVTWMVdvjFR1gjPHESQFEFLUY0SnomTMYGRBgDc3XzXqQCUXMWUV8DZXoGRncCZOcyLwDldUYDRuEkUOglXogjYLczXmE0UikGLogjcHIDRwTjQgASUV8DZ5IUS1gjPHQGNFM1ZzPEVyUkUOglXpgTcyLzSzgiQisVPRokZvjFRyfjPHkWTWgkdUIiX3fjPLglKnM1Y2Y0XqASZHMGUCwDZtfVX0E0UY4TQVE1ZvjFRG0DZHU2LC8Dc3XzXqEjTZoFLogDMHIDR4E0UXoWUxHFNHIDSn4BZic1cVM1ZvjFRyQ0PLglKnEVcQcUVNUjUgsFLogTPIg2R4XWZgUWTWkkYpYTV3fjTLYGRBgTdQcEV5UkLhgCRBwDZtf1XmcmUisFLogzbTMDSn4BZgUWTWkkSEYUXqASZHETSngTcyLzSzgiQisVPRokZvjFR2QTZHYFSGM1YQc0X4ASZHYGRBgTLEYTXvTkUOgldR0jcHIDRzgiQisFMTg0bUY0SngjZHU2LC8TctzlXq0zUYoGMC8jcIcUV4UkQiYFSGEVcQ01Tv.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.EZtH0X4UEahgCRBwDZtHUVpslQicVRFE1ZvjFR2gjPHcVSFM1aYcUV3fjPLg1LC8DTEwlXmAiUYoWUrIVdzLzSPUDahcFLVkkdUwlXl4xUXgWQVE1ZQcUV3sFQYgCRnIVc3XUXSsFajsVSsgjYXcEVxU0UYgCRB0DctjFR0MyPOAUQrI1YvXUV5UEahYlKWgEdEYUXqE0UYg2ZDkENHglX0giUgETRwHVcIcjX5sVLgQGLTgkdUwlXuUjQgkWRBgTLEYTXvTkUOgFRosjcHg2R4X2PTcVRWg0bUYzXqkzQHYWQrI1YvXUV5UEahkTTV8DZHISX0AiQS8VSGM1ZzXUV3EDLgk2ZFM1a3vVXn4BZic1cVM1ZvjFRxLiPLg1Mn8zMtTEV3UjUgsVTWkEdAIjXmkzUXMWUFM1ZIckTpASZHgGNwD1bMASXvjjLXsVTTkkbEYEYMgiQYsVRBgTLEYTXvTkUOglKosjcHg2R4X2PTcVRWg0bUYzXqkzQHYWQrI1YvXUV5UEahkTTV8DZHISX0AiUSUWTVMlbEYzXugCag8DMwLEaYwFRlg0UXIWUWkENHIESz4RZHU2LC8DTEwlXmAiUYoWUrIlYtbEV3UjUgsVTWkEdqQTV3fDZhUGNVEFQqEiX5UDagkVUrA0ZQIyXqUEag0zZwfUdIIDRwTjQgASUV8DZDkWSz4RZHU2LC8TctTEV3UjUgsVTWkEdM01S2bCZTUGNVEVN1kFU0giUgYlZFkENHgGVxgSLhsFLToUZ3rlX0giUgglKnE1YvXUV3fDdPIGNwH1Z3T0Tu0TLWIENwD1bIIDRvzzUYgGLogjcHIDRqEkUZoWQrgkbUY0Sn4RZHYFQwfkdqw1XqASZHYGRn8zMtTEV3UjUgsVTWkEdM01S23RUXgWQVE1ZQcUV3EjPhcVRWg0bUYzXqkzURoFLogDd3DSXy0TUZUSUwHFZtf1XmcmUisFLogjcyHDSncCZOciKUgEdEYUXqE0UYgWPBI1YIcEVyUkQisVRWIkZvjFR3gSLgMWQpgUd3vlX1E0UZUGMVM0YQcUV3slUXIWSsgjYXcEVxU0UYgCRBwDctjFR0MyPOAUQrI1YvXUV5UEahYlKWgEdEYUXqE0UYg2ZDkENHglX0giUgwzZwHldUwVXqkzQTUWSWokdqESXzkjPHESQFEFLUY0SnwTZKYGR3sTN1MDUmkzUXMWUFM1ZIcDR1UDahcFLVkkdUwlXIEkUOgFRxDVcvDCU0UUahkVUFE0Z2YEVz.idgoVUrgjYXcEVxU0UYgCRBwDctjFR0MyPOAUQrI1YvXUV5UEahYlKWgEdEYUXqE0UYg2ZDkENHglX0giUg0DNFkEL2YEV5sVLgQGNpE1SYwVVn4BZic1cVM1ZvjFR1MiPLg1Mn8zMtTEV3UjUgsVTWkEdAIjXmkzUXMWUFM1ZIckTpASZHgGNwD1bQQkV4E0UXQWSVkkPUYzXxTkUYQGLToUZM0FRlg0UXIWUWkENHIESxLiPLg1Mn8zM2HDUmkzUXMWUFM1ZIIiX4XWdKIENwD1bzLzS0gDLgUGLwHVN1k2RRgSLgMWSWM0YzXEVsUEahkic4sDd3DSXy0zUZMWUGE1YQISX3QyPOYGNwH1aQckV0QiUZQ2Xr8zMtbEV3UjUgkGMC8DTEoFUAACQH8VTV8DZHISX0ASLTUWUsIVZUYETzMlQgsVRBgTLEYTXvTkUOglZCwDctjFR0MyPOAUQpQUPvPDRuEkUOgFRxDVcvDCU0UUahkVUFE0aMczXmQSLXsVRBgTLEYTXvTkUOgFSosjcHg2R4XWdKYWQrI1YvDiX4XWdKYGNwH1aQckV0QiUZQ2Xr8zM2HjX3gSLYgWQVEVN1kmX0UUahkVUVoEcYESXlomUXQWUsk0YMYzXvjzUYgGLogTPUcTVugSLW0DNFk0Z2YkVzMFaHYldVg0azXTUqc1QigCR3A0Z2YTX0kjPHoGNFIFUUYDY5ASZHMSQogjYHESX5EkLgMWTUk0LQc0SnolZSMUTqQEcDkFRlwTLgIGNVMFdvjFRrkkUYkVQFkEdHwFRlwTLgMWPxDFcUwVX50TUZUSUV8DZtjFRlwzUYkVTWoUczX0T0EkUYgCRBwDZ2f1S2bCdhISQVEVNt3hKt3hKt3hKt3hKtQUUCUEQTg2ZrM1YQcUVDUjQicVPP4RPHQEY1UTLhkWPP4RPL4hKi4hKt3hKt3hKtXlTU0DUQAURWoULEYzXqEEUXoWQFwyKIMzasA2atUlaz4COuX0TTMCTrU2Yo41TzEFck4C."
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
                                        "blob": "22365.VMjLgP0U...O+fWarAhckI2bo8la8HRLt.iHfTlai8FYo41Y8HRUTYTK3HxO9.BOVMEUy.Ea0cVZtMEcgQWY9vSRC8Vav8lak4Fc9DiM1fCNtXUSGM1UA4hKtXlKt3hKP4hKt3hKtvjdXQ2bD4hKDQjQFkjdP4VPt3hKHYGUoUULL4BS1IjKt3hKtPjKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKA4VUCkzTHYiKD4hK1k2Sy.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.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.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.SZHY2LR0DZtfFVzDzUXkWSW8DZtjFRlgjUZYGNFE1YIc0Sn4RZHU2LC8Tc5QkTDslZTsFLVgkcAckVzMlUQQWTsIFMzLzSMsFQQkTRUk0bEYjX1sFag0VUpEldIcEYlQEagcVRFE1ZQY0SnQTZHYlKWgEdEYUXqE0UYg2ZDkENHIDUu8VajQENrE1ZIIDRoclUXQGMVkkbvjFR2IVZHYldVkUdMcEVsUkQUQSPWkENHIESn4hTgkWRV8DZDkVSn4hPgkWRV8DZ5IESnMyPO0zZDEURIUUVyUjQhY2ZrEVaMQ0X3k0UYYlZrElcUczXkAiUZQGLogjcyHDSn4hTZQWPWMld3TUXmc1UOgFQowjLyHDSn4BdgASTxb0bqwVX3fjPLQmKogjY2X0X5gSUgc1YW8DZDkFSxLiPLglK3IlaEYjXqASZHY2LBwDZtfmXz.iUgsVTsIFMvjFR1MiTMglKngEMAcEV40zUOglKogjYHYkV1giQgcVRW8DZtjFR0MyPOUmdTIEQqoFUqAiUXYWPWoEciYUTzEUahQCMC8TSqQTTIkTUYMWQFIlcqwVXsUkZgoWRWQlYTwVXmkjQgsVTV8DZDkFRl4xUXgWQVE1ZQcUV3sFQYgCRBIVc2YEY1cVLgQ2ZGQ0YIcEVykjPHk1YVgEczXUVxASZHcmXogjY5YUV40zUX0VUFUEMAcUV3fjTLglKREVdIY0SnY1TLglKBEVdIY0SnomTLg1LC8TSqQTTIkTUYMWQFIlcqwVXs0DUigWVWkkYpwVX1U0QiUFLVoEcvjFR1MiPLglKRoEcAc0X5gSUgc1YW8DZDkFSxLiPLglK3EFLQIyUysFaggCRBwDctjFRlciUioGNUE1Ymc0SnQTZLIyLBwDZtfmXtUjQhsFLogjcyHDSn4BdhQCLVE1ZQ0lXz.SZHY2LR0DZtfFVzDzUXkWSW8DZtjFRlgjUZYGNFE1YIc0Sn4RZHU2LC8Tc5QkTDslZTsFLVgkcAckVzMlUQQWTsIFMzLzSMsFQQkTRUk0bEYjX1sFag0VUpEldIcEYlQEagcVRFE1ZQY0SnQTZHYlKWgEdEYUXqE0UYg2ZDkENHIjVmkzUgUGMVoUZMcDUmkzUXMWRBgTZmYEVzQiUYIGLogzchkFRlomUYkWSWgUaUYTUzDzUYgCRRwDZtHUX4kjUOglXC4DZtHTX4kjUOgldRwDZyLzSMsFQQkTRUk0bEYjX1sFag0VSTMFdYcUVloFagYWUGMVYvXkVzASZHY2LBwDZtHkVzEzUioGNUE1Ymc0SnQTZLIyLBwDZtfWXvDkLWM2ZrEFNHIDSz4RZHY1MVMld3TUXmc1UOgFQowjLyHDSn4Bdh4VQFI1ZvjFR1MiPLglK3IFMvXUXqEUahQCLogjcyHUSn4BZXQSPWgUdMc0Sn4RZHYFRVokc3XTXmkzUOglKogTcyLzS0oGURQzZpQ0ZvXEV1EzUZQ2XVEEcQ0lXzPyPO0zZDEURIUUVyUjQhY2ZrEVaUoVX5kzUjYFUrE1YIYTXqEkUOgFQogjYtbEV3UjUgsVTWkEdqQTV3fjPigWUVEVc2ESXPUDahcFLrgjYLYjVmQCags1cV8DZDkFRlomUYkWSWgUaUYTUzDzUYgCRRwDZtHUX4kjUOglXS4DZtHTX4kjUOgldRwDZyLzSMsFQQkTRUk0bEYjX1sFag0VSTMFdYcUVloFagYWUGMVYvXkVzASZHY2LBwDZtHkVzEzUioGNUE1Ymc0SnQTZLIyLBwDZtfWXvDkLWM2ZrEFNHIDSz4RZHY1MVMld3TUXmc1UOgFQowjLyHDSn4Bdh4VQFI1ZvjFR1MiPLglK3IFMvXUXqEUahQCLogjcyHUSn4BZXQSPWgUdMc0Sn4RZHYFRVokc3XTXmkzUOglKogTcyLzS0oGURQzZpQ0ZvXEV1EzUZQ2XVEEcQ0lXzPyPO0zZDEURIUUVyUjQhY2ZrEVaUoVX5kzUjYFUrE1YIYTXqEkUOglKogjYtbEV3UjUgsVTWkEdqQTV3fDZis1cwDVZqYzXzjjPHk1YVgEczXUVxASZHcmXogjY5YUV40zUX0VUFUEMAcUV3fjPMglKREVdIY0SnomTLglKBEVdIY0SnomTLg1LC8TSqQTTIkTUYMWQFIlcqwVXs0DUigWVWkkYpwVX1U0QiUFLVoEcvjFR1MiPLglKRoEcAc0X5gSUgc1YW8DZDkFSxLiPLglK3EFLQIyUysFaggCRRwDctjFRlciUioGNUE1Ymc0SnQTZLIyLBwDZtfmXtUjQhsFLogjcyHDSn4BdhQCLVE1ZQ0lXz.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.CaXsVRW8DZDkFR4XWZgUWTWkkYpYTV3fjPLglK3IldEYzXvzzUOglKogjYXcEVxU0UYgCRRsDLtjFRlMSLgoWUrM0YvXUV3fDdPg1Mn8zMyDSX5UkQH8VTV8DZDkFRlwzQicVTWMVdvjFR1gjPHESQFEFLUY0SnomTMYGRBgDc3XzXqQCUXMWUV8DZLoGRncCZOcyLwDldUYDRuEkUOgFRogjYLczXmE0UikGLogjcHIDRwTjQgASUV8DZ5IUS1gjPHQGNFM1ZzPEVyUkUOgFTpgTcyLzSzgiQisVPRokZvjFR4gjPHkWTWgkdUIiX3fjPLglKnM1Y2Y0XqASZHMGUCwDZtfVX0E0UY4TQVE1ZvjFRD0DZHU2LC8Dc3XzXqEjTZoFLogjdHIDR4E0UXoWUxHFNHIDSn4BZic1cVM1ZvjFRyQ0PLglKnEVcQcUVNUjUgsFLogTQIg2R4XWZgUWTWkkYpYTV3fjTMglK3IldEYzXvzzUOglKogjYXcEVxU0UYgCRRsDLtjFRlMSLgoWUrM0YvXUV3fDZQg1Mn8zMyDSX5UkQH8VTV8DZXkFRlwzQicVTWMVdvjFR1gjPHESQFEFLUY0SnomTMYGRBgDc3XzXqQCUXMWUV8DZXoGRncCZOcyLwDldUYDRuEkUOglXogjYLczXmE0UikGLogjcHIDRwTjQgASUV8DZ5IUS1gjPHQGNFM1ZzPEVyUkUOglXpgTcyLzSzgiQisVPRokZvjFRyfjPHkWTWgkdUIiX3fjPLglKnM1Y2Y0XqASZHMGUCwDZtfVX0E0UY4TQVE1ZvjFRG0DZHU2LC8Dc3XzXqEjTZoFLogDMHIDR4E0UXoWUxHFNHIDSn4BZic1cVM1ZvjFRyQ0PLglKnEVcQcUVNUjUgsFLogTPIg2R4XWZgUWTWkkYpYTV3fjTLYGRBgTdQcEV5UkLhgCRBwDZtf1XmcmUisFLogzbTMDSn4BZgUWTWkkSEYUXqASZHETSngTcyLzSzgiQisVPRokZvjFR2QTZHYFSGM1YQc0X4ASZHYGRBgTLEYTXvTkUOgldR0jcHIDRzgiQisFMTg0bUY0SngjZHU2LC8TctzlXq0zUYoGMC8jcIcUV4UkQiYFSGEVcQ01Tv.CaXsVRW8DZHkFR4XWZgUWTWkkYpYTV3fjPLglK3IldEYzXvzzUOglKogjYXcEVxU0UYgCRRsDLtjFRlMSLgoWUrM0YvXUV3fDdPg1Mn8zMyDSX5UkQH8VTV8DZDkFRlwzQicVTWMVdvjFR1gjPHESQFEFLUY0SnomTMYGRBgDc3XzXqQCUXMWUV8DZLoGRncCZOcyLwDldUYDRuEkUOgFRogjYLczXmE0UikGLogjcHIDRwTjQgASUV8DZ5IUS1gjPHQGNFM1ZzPEVyUkUOgFTpgTcyLzSzgiQisVPRokZvjFR4gjPHkWTWgkdUIiX3fjPLglKnM1Y2Y0XqASZHMGUCwDZtfVX0E0UY4TQVE1ZvjFRD0DZHU2LC8Dc3XzXqEjTZoFLogjdHIDR4E0UXoWUxHFNHIDSn4BZic1cVM1ZvjFRyQ0PLglKnEVcQcUVNUjUgsFLogTQIg2R4XWZgUWTWkkYpYTV3fjTMglK3IldEYzXvzzUOglKogjYXcEVxU0UYgCRRsDLtjFRlMSLgoWUrM0YvXUV3fDZQg1Mn8zMyDSX5UkQH8VTV8DZXkFRlwzQicVTWMVdvjFR1gjPHESQFEFLUY0SnomTMYGRBgDc3XzXqQCUXMWUV8DZXoGRncCZOcyLwDldUYDRuEkUOglXogjYLczXmE0UikGLogjcHIDRwTjQgASUV8DZ5IUS1gjPHQGNFM1ZzPEVyUkUOglXpgTcyLzSzgiQisVPRokZvjFRyfjPHkWTWgkdUIiX3fjPLglKnM1Y2Y0XqASZHMGUCwDZtfVX0E0UY4TQVE1ZvjFRG0DZHU2LC8Dc3XzXqEjTZoFLogDMHIDR4E0UXoWUxHFNHIDSn4BZic1cVM1ZvjFRyQ0PLglKnEVcQcUVNUjUgsFLogTPIg2R4XWZgUWTWkkYpYTV3fjTLYGRBgTdQcEV5UkLhgCRBwDZtf1XmcmUisFLogzbTMDSn4BZgUWTWkkSEYUXqASZHETSngTcyLzSzgiQisVPRokZvjFR2QTZHYFSGM1YQc0X4ASZHYGRBgTLEYTXvTkUOgldR0jcHIDRzgiQisFMTg0bUY0SngjZHU2LC8TctzlXq0zUYoGMC8jcIcUV4UkQiYFSGEVcQ01Tv.CaXsVRW8DZLkFR4XWZgUWTWkkYpYTV3fjPLglK3IldEYzXvzzUOglKogjYXcEVxU0UYgCRRsDLtjFRlMSLgoWUrM0YvXUV3fDdPg1Mn8zMyDSX5UkQH8VTV8DZDkFRlwzQicVTWMVdvjFR1gjPHESQFEFLUY0SnomTMYGRBgDc3XzXqQCUXMWUV8DZLoGRncCZOcyLwDldUYDRuEkUOgFRogjYLczXmE0UikGLogjcHIDRwTjQgASUV8DZ5IUS1gjPHQGNFM1ZzPEVyUkUOgFTpgTcyLzSzgiQisVPRokZvjFR4gjPHkWTWgkdUIiX3fjPLglKnM1Y2Y0XqASZHMGUCwDZtfVX0E0UY4TQVE1ZvjFRD0DZHU2LC8Dc3XzXqEjTZoFLogjdHIDR4E0UXoWUxHFNHIDSn4BZic1cVM1ZvjFRyQ0PLglKnEVcQcUVNUjUgsFLogTQIg2R4XWZgUWTWkkYpYTV3fjTMglK3IldEYzXvzzUOglKogjYXcEVxU0UYgCRRsDLtjFRlMSLgoWUrM0YvXUV3fDZQg1Mn8zMyDSX5UkQH8VTV8DZXkFRlwzQicVTWMVdvjFR1gjPHESQFEFLUY0SnomTMYGRBgDc3XzXqQCUXMWUV8DZXoGRncCZOcyLwDldUYDRuEkUOglXogjYLczXmE0UikGLogjcHIDRwTjQgASUV8DZ5IUS1gjPHQGNFM1ZzPEVyUkUOglXpgTcyLzSzgiQisVPRokZvjFRyfjPHkWTWgkdUIiX3fjPLglKnM1Y2Y0XqASZHMGUCwDZtfVX0E0UY4TQVE1ZvjFRG0DZHU2LC8Dc3XzXqEjTZoFLogDMHIDR4E0UXoWUxHFNHIDSn4BZic1cVM1ZvjFRyQ0PLglKnEVcQcUVNUjUgsFLogTPIg2R4XWZgUWTWkkYpYTV3fjTLYGRBgTdQcEV5UkLhgCRBwDZtf1XmcmUisFLogzbTMDSn4BZgUWTWkkSEYUXqASZHETSngTcyLzSzgiQisVPRokZvjFR2QTZHYFSGM1YQc0X4ASZHYGRBgTLEYTXvTkUOgldR0jcHIDRzgiQisFMTg0bUY0SngjZHU2LC8TctzlXq0zUYoGMC8jcIcUV4UkQiYFSGEVcQ01Tv.CaXsVRW8DZPkFR4XWZgUWTWkkYpYTV3fjPLglK3IldEYzXvzzUOglKogjYXcEVxU0UYgCRRsDLtjFRlMSLgoWUrM0YvXUV3fDdPg1Mn8zMyDSX5UkQH8VTV8DZDkFRlwzQicVTWMVdvjFR1gjPHESQFEFLUY0SnomTMYGRBgDc3XzXqQCUXMWUV8DZLoGRncCZOcyLwDldUYDRuEkUOgFRogjYLczXmE0UikGLogjcHIDRwTjQgASUV8DZ5IUS1gjPHQGNFM1ZzPEVyUkUOgFTpgTcyLzSzgiQisVPRokZvjFR4gjPHkWTWgkdUIiX3fjPLglKnM1Y2Y0XqASZHMGUCwDZtfVX0E0UY4TQVE1ZvjFRD0DZHU2LC8Dc3XzXqEjTZoFLogjdHIDR4E0UXoWUxHFNHIDSn4BZic1cVM1ZvjFRyQ0PLglKnEVcQcUVNUjUgsFLogTQIg2R4XWZgUWTWkkYpYTV3fjTMglK3IldEYzXvzzUOglKogjYXcEVxU0UYgCRRsDLtjFRlMSLgoWUrM0YvXUV3fDZQg1Mn8zMyDSX5UkQH8VTV8DZXkFRlwzQicVTWMVdvjFR1gjPHESQFEFLUY0SnomTMYGRBgDc3XzXqQCUXMWUV8DZXoGRncCZOcyLwDldUYDRuEkUOglXogjYLczXmE0UikGLogjcHIDRwTjQgASUV8DZ5IUS1gjPHQGNFM1ZzPEVyUkUOglXpgTcyLzSzgiQisVPRokZvjFRyfjPHkWTWgkdUIiX3fjPLglKnM1Y2Y0XqASZHMGUCwDZtfVX0E0UY4TQVE1ZvjFRG0DZHU2LC8Dc3XzXqEjTZoFLogDMHIDR4E0UXoWUxHFNHIDSn4BZic1cVM1ZvjFRyQ0PLglKnEVcQcUVNUjUgsFLogTPIg2R4XWZgUWTWkkYpYTV3fjTLYGRBgTdQcEV5UkLhgCRBwDZtf1XmcmUisFLogzbTMDSn4BZgUWTWkkSEYUXqASZHETSngTcyLzSzgiQisVPRokZvjFR2QTZHYFSGM1YQc0X4ASZHYGRBgTLEYTXvTkUOgldR0jcHIDRzgiQisFMTg0bUY0SngjZHU2LC8TctzlXq0zUYoGMC8jcIcUV4UkQiYFSGEVcQ01Tv.CaXsVRW8DZTkFR4XWZgUWTWkkYpYTV3fjPLglK3IldEYzXvzzUOglKogjYXcEVxU0UYgCRRsDLtjFRlMSLgoWUrM0YvXUV3fDdPg1Mn8zMyDSX5UkQH8VTV8DZDkFRlwzQicVTWMVdvjFR1gjPHESQFEFLUY0SnomTMYGRBgDc3XzXqQCUXMWUV8DZLoGRncCZOcyLwDldUYDRuEkUOgFRogjYLczXmE0UikGLogjcHIDRwTjQgASUV8DZ5IUS1gjPHQGNFM1ZzPEVyUkUOgFTpgTcyLzSzgiQisVPRokZvjFR4gjPHkWTWgkdUIiX3fjPLglKnM1Y2Y0XqASZHMGUCwDZtfVX0E0UY4TQVE1ZvjFRD0DZHU2LC8Dc3XzXqEjTZoFLogjdHIDR4E0UXoWUxHFNHIDSn4BZic1cVM1ZvjFRyQ0PLglKnEVcQcUVNUjUgsFLogTQIg2R4XWZgUWTWkkYpYTV3fjTMglK3IldEYzXvzzUOglKogjYXcEVxU0UYgCRRsDLtjFRlMSLgoWUrM0YvXUV3fDZQg1Mn8zMyDSX5UkQH8VTV8DZXkFRlwzQicVTWMVdvjFR1gjPHESQFEFLUY0SnomTMYGRBgDc3XzXqQCUXMWUV8DZXoGRncCZOcyLwDldUYDRuEkUOglXogjYLczXmE0UikGLogjcHIDRwTjQgASUV8DZ5IUS1gjPHQGNFM1ZzPEVyUkUOglXpgTcyLzSzgiQisVPRokZvjFRyfjPHkWTWgkdUIiX3fjPLglKnM1Y2Y0XqASZHMGUCwDZtfVX0E0UY4TQVE1ZvjFRG0DZHU2LC8Dc3XzXqEjTZoFLogDMHIDR4E0UXoWUxHFNHIDSn4BZic1cVM1ZvjFRyQ0PLglKnEVcQcUVNUjUgsFLogTPIg2R4XWZgUWTWkkYpYTV3fjTLYGRBgTdQcEV5UkLhgCRBwDZtf1XmcmUisFLogzbTMDSn4BZgUWTWkkSEYUXqASZHETSngTcyLzSzgiQisVPRokZvjFR2QTZHYFSGM1YQc0X4ASZHYGRBgTLEYTXvTkUOgldR0jcHIDRzgiQisFMTg0bUY0SngjZHU2LC8TctzlXq0zUYoGMC8jcIcUV4UkQiYFSGEVcQ01Tv.CaXsVRW8DZXkFR4XWZgUWTWkkYpYTV3fjPLglK3IldEYzXvzzUOglKogjYXcEVxU0UYgCRRsDLtjFRlMSLgoWUrM0YvXUV3fDdPg1Mn8zMyDSX5UkQH8VTV8DZDkFRlwzQicVTWMVdvjFR1gjPHESQFEFLUY0SnomTMYGRBgDc3XzXqQCUXMWUV8DZLoGRncCZOcyLwDldUYDRuEkUOgFRogjYLczXmE0UikGLogjcHIDRwTjQgASUV8DZ5IUS1gjPHQGNFM1ZzPEVyUkUOgFTpgTcyLzSzgiQisVPRokZvjFR4gjPHkWTWgkdUIiX3fjPLglKnM1Y2Y0XqASZHMGUCwDZtfVX0E0UY4TQVE1ZvjFRD0DZHU2LC8Dc3XzXqEjTZoFLogjdHIDR4E0UXoWUxHFNHIDSn4BZic1cVM1ZvjFRyQ0PLglKnEVcQcUVNUjUgsFLogTQIg2R4XWZgUWTWkkYpYTV3fjTMglK3IldEYzXvzzUOglKogjYXcEVxU0UYgCRRsDLtjFRlMSLgoWUrM0YvXUV3fDZQg1Mn8zMyDSX5UkQH8VTV8DZXkFRlwzQicVTWMVdvjFR1gjPHESQFEFLUY0SnomTMYGRBgDc3XzXqQCUXMWUV8DZXoGRncCZOcyLwDldUYDRuEkUOglXogjYLczXmE0UikGLogjcHIDRwTjQgASUV8DZ5IUS1gjPHQGNFM1ZzPEVyUkUOglXpgTcyLzSzgiQisVPRokZvjFRyfjPHkWTWgkdUIiX3fjPLglKnM1Y2Y0XqASZHMGUCwDZtfVX0E0UY4TQVE1ZvjFRG0DZHU2LC8Dc3XzXqEjTZoFLogDMHIDR4E0UXoWUxHFNHIDSn4BZic1cVM1ZvjFRyQ0PLglKnEVcQcUVNUjUgsFLogTPIg2R4XWZgUWTWkkYpYTV3fjTLYGRBgTdQcEV5UkLhgCRBwDZtf1XmcmUisFLogzbTMDSn4BZgUWTWkkSEYUXqASZHETSngTcyLzSzgiQisVPRokZvjFR2QTZHYFSGM1YQc0X4ASZHYGRBgTLEYTXvTkUOgldR0jcHIDRzgiQisFMTg0bUY0SngjZHU2LC8TctzlXq0zUYoGMC8jcIcUV4UkQiYFSGEVcQ01Tv.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.EZtH0X4UEahgCRBwDZtHUVpslQicVRFE1ZvjFR2gjPHcVSFM1aYcUV3fjPLg1LC8DTEwlXmAiUYoWUrIVdzLzSPUDahcFLVkkdUwlXl4xUXgWQVE1ZQcUV3sFQYgCRnIVc3XUXSsFajsVSsgjYXcEVxU0UYgCRB0DctjFR0MyPOAUQrI1YvXUV5UEahYlKWgEdEYUXqE0UYg2ZDkENHglX0giUgETRwHVcIcjX5sVLgQGLTgkdUwlXuUjQgkWRBgTLEYTXvTkUOgFRosjcHg2R4X2PTcVRWg0bUYzXqkzQHYWQrI1YvXUV5UEahkTTV8DZHISX0AiQS8VSGM1ZzXUV3EDLgk2ZFM1a3vVXn4BZic1cVM1ZvjFRxLiPLg1Mn8zMtTEV3UjUgsVTWkEdAIjXmkzUXMWUFM1ZIckTpASZHgGNwD1bMASXvjjLXsVTTkkbEYEYMgiQYsVRBgTLEYTXvTkUOglKosjcHg2R4X2PTcVRWg0bUYzXqkzQHYWQrI1YvXUV5UEahkTTV8DZHISX0AiUSUWTVMlbEYzXugCag8DMwLEaYwFRlg0UXIWUWkENHIESz4RZHU2LC8DTEwlXmAiUYoWUrIlYtbEV3UjUgsVTWkEdqQTV3fDZhUGNVEFQqEiX5UDagkVUrA0ZQIyXqUEag0zZwfUdIIDRwTjQgASUV8DZDkWSz4RZHU2LC8TctTEV3UjUgsVTWkEdM01S2bCZTUGNVEVN1kFU0giUgYlZFkENHgGVxgSLhsFLToUZ3rlX0giUgglKnE1YvXUV3fDdPIGNwH1Z3T0Tu0TLWIENwD1bIIDRvzzUYgGLogjcHIDRqEkUZoWQrgkbUY0Sn4RZHYFQwfkdqw1XqASZHYGRn8zMtTEV3UjUgsVTWkEdM01S23RUXgWQVE1ZQcUV3EjPhcVRWg0bUYzXqkzURoFLogDd3DSXy0TUZUSUwHFZtf1XmcmUisFLogjcyHDSncCZOciKUgEdEYUXqE0UYgWPBI1YIcEVyUkQisVRWIkZvjFR3gSLgMWQpgUd3vlX1E0UZUGMVM0YQcUV3slUXIWSsgjYXcEVxU0UYgCRBwDctjFR0MyPOAUQrI1YvXUV5UEahYlKWgEdEYUXqE0UYg2ZDkENHglX0giUgwzZwHldUwVXqkzQTUWSWokdqESXzkjPHESQFEFLUY0SnwTZKYGR3sTN1MDUmkzUXMWUFM1ZIcDR1UDahcFLVkkdUwlXIEkUOgFRxDVcvDCU0UUahkVUFE0Z2YEVz.idgoVUrgjYXcEVxU0UYgCRBwDctjFR0MyPOAUQrI1YvXUV5UEahYlKWgEdEYUXqE0UYg2ZDkENHglX0giUg0DNFkEL2YEV5sVLgQGNpE1SYwVVn4BZic1cVM1ZvjFR1MiPLg1Mn8zMtTEV3UjUgsVTWkEdAIjXmkzUXMWUFM1ZIckTpASZHgGNwD1bQQkV4E0UXQWSVkkPUYzXxTkUYQGLToUZM0FRlg0UXIWUWkENHIESxLiPLg1Mn8zM2HDUmkzUXMWUFM1ZIIiX4XWdKIENwD1bzLzS0gDLgUGLwHVN1k2RRgSLgMWSWM0YzXEVsUEahkic4sDd3DSXy0zUZMWUGE1YQISX3QyPOYGNwH1aQckV0QiUZQ2Xr8zMtbEV3UjUgkGMC8DTEoFUAACQH8VTV8DZHISX0ASLTUWUsIVZUYETzMlQgsVRBgTLEYTXvTkUOglZCwDctjFR0MyPOAUQpQUPvPDRuEkUOgFRxDVcvDCU0UUahkVUFE0aMczXmQSLXsVRBgTLEYTXvTkUOgFSosjcHg2R4XWdKYWQrI1YvDiX4XWdKYGNwH1aQckV0QiUZQ2Xr8zM2HjX3gSLYgWQVEVN1kmX0UUahkVUVoEcYESXlomUXQWUsk0YMYzXvjzUYgGLogTPUcTVugSLW0DNFk0Z2YkVzMFaHYldVg0azXTUqc1QigCR3A0Z2YTX0kjPHoGNFIFUUYDY5ASZHMSQogjYHESX5EkLgMWTUk0LQc0SnolZSMUTqQEcDkFRlwTLgIGNVMFdvjFRrkkUYkVQFkEdHwFRlwTLgMWPxDFcUwVX50TUZUSUV8DZtjFRlwzUYkVTWoUczX0T0EkUYgCRBwDZ2f1S2bCdhISQVEVNt3hKt3hKt3hKt3hKtQUUCUEQTg2ZrM1YQcUVDUjQicVPP4RPHQEY1UTLhkWPP4RPL4hKi4hKt3hKt3hKtXlTU0DUQAURWoULEYzXqEEUXoWQFwyKIMzasA2atUlaz4COuX0TTMCTrU2Yo41TzEFck4C."
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
                    "text": "D'"
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