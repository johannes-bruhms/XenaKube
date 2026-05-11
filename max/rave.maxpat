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
        "rect": [ 794.0, 349.0, 1523.0, 658.0 ],
        "boxes": [
            {
                "box": {
                    "id": "obj-1",
                    "linecount": 8,
                    "maxclass": "comment",
                    "numinlets": 1,
                    "numoutlets": 0,
                    "patching_rect": [ 857.206531047821, 181.27535033226013, 76.0869550704956, 117.0 ],
                    "presentation_linecount": 8,
                    "text": "1 Perc\n2 water\n3 voice\n4 vctk\n5 organ\n6 house \n7 NASA\n8 "
                }
            },
            {
                "box": {
                    "comment": "",
                    "id": "obj-2",
                    "index": 1,
                    "maxclass": "outlet",
                    "numinlets": 1,
                    "numoutlets": 0,
                    "patching_rect": [ 215.38463592529297, 1230.7693481445312, 30.0, 30.0 ]
                }
            },
            {
                "box": {
                    "id": "obj-107",
                    "maxclass": "message",
                    "numinlets": 2,
                    "numoutlets": 1,
                    "outlettype": [ "" ],
                    "patching_rect": [ 694.0486378669739, 264.1700863838196, 29.5, 22.0 ],
                    "text": "7"
                }
            },
            {
                "box": {
                    "id": "obj-103",
                    "lastchannelcount": 0,
                    "maxclass": "live.gain~",
                    "numinlets": 2,
                    "numoutlets": 5,
                    "outlettype": [ "signal", "signal", "", "float", "list" ],
                    "parameter_enable": 1,
                    "patching_rect": [ 952.307783126831, 820.000078201294, 48.0, 136.0 ],
                    "saved_attribute_attributes": {
                        "valueof": {
                            "parameter_longname": "live.gain~[19]",
                            "parameter_mmax": 6.0,
                            "parameter_mmin": -70.0,
                            "parameter_modmode": 3,
                            "parameter_shortname": "live.gain~[13]",
                            "parameter_type": 0,
                            "parameter_unitstyle": 4
                        }
                    },
                    "varname": "live.gain~[13]"
                }
            },
            {
                "box": {
                    "attr": "enable",
                    "id": "obj-104",
                    "maxclass": "attrui",
                    "numinlets": 1,
                    "numoutlets": 1,
                    "outlettype": [ "" ],
                    "parameter_enable": 0,
                    "patching_rect": [ 926.1539344787598, 983.0770168304443, 150.0, 22.0 ]
                }
            },
            {
                "box": {
                    "id": "obj-105",
                    "maxclass": "newobj",
                    "numinlets": 8,
                    "numoutlets": 1,
                    "outlettype": [ "signal" ],
                    "patching_rect": [ 867.6923904418945, 1036.9231758117676, 111.0, 22.0 ],
                    "text": "nn~ nasa decode 0"
                }
            },
            {
                "box": {
                    "id": "obj-106",
                    "maxclass": "newobj",
                    "numinlets": 1,
                    "numoutlets": 8,
                    "outlettype": [ "signal", "signal", "signal", "signal", "signal", "signal", "signal", "signal" ],
                    "patching_rect": [ 867.6923904418945, 1010.7693271636963, 111.0, 22.0 ],
                    "text": "nn~ nasa encode 0"
                }
            },
            {
                "box": {
                    "id": "obj-102",
                    "linecount": 8,
                    "maxclass": "comment",
                    "numinlets": 1,
                    "numoutlets": 0,
                    "patching_rect": [ 775.6275844573975, 181.27535033226013, 76.0869550704956, 117.0 ],
                    "text": "C1 PIZZ\nC2 BOW\nC3 SUST\nC4 HARM\nC5 gls W\nC6 gls M \nC7 gls S\nC8 - TREM"
                }
            },
            {
                "box": {
                    "id": "obj-101",
                    "maxclass": "message",
                    "numinlets": 2,
                    "numoutlets": 1,
                    "outlettype": [ "" ],
                    "patching_rect": [ 661.8117960691452, 264.1700863838196, 29.5, 22.0 ],
                    "text": "6"
                }
            },
            {
                "box": {
                    "id": "obj-99",
                    "maxclass": "message",
                    "numinlets": 2,
                    "numoutlets": 1,
                    "outlettype": [ "" ],
                    "patching_rect": [ 632.8644279241562, 149.03850853443146, 50.0, 22.0 ],
                    "text": "C2"
                }
            },
            {
                "box": {
                    "id": "obj-97",
                    "maxclass": "newobj",
                    "numinlets": 2,
                    "numoutlets": 2,
                    "outlettype": [ "", "" ],
                    "patching_rect": [ 597.3381124734879, 131.93324553966522, 67.0, 22.0 ],
                    "text": "route voice"
                }
            },
            {
                "box": {
                    "id": "obj-94",
                    "maxclass": "newobj",
                    "numinlets": 2,
                    "numoutlets": 2,
                    "outlettype": [ "", "" ],
                    "patching_rect": [ 496.0223239660263, 127.3279824256897, 46.0, 22.0 ],
                    "text": "route 0"
                }
            },
            {
                "box": {
                    "id": "obj-91",
                    "maxclass": "message",
                    "numinlets": 2,
                    "numoutlets": 1,
                    "outlettype": [ "" ],
                    "patching_rect": [ 629.5749542713165, 264.1700863838196, 29.5, 22.0 ],
                    "text": "5"
                }
            },
            {
                "box": {
                    "id": "obj-90",
                    "maxclass": "message",
                    "numinlets": 2,
                    "numoutlets": 1,
                    "outlettype": [ "" ],
                    "patching_rect": [ 596.022323012352, 264.1700863838196, 29.5, 22.0 ],
                    "text": "4"
                }
            },
            {
                "box": {
                    "id": "obj-88",
                    "maxclass": "message",
                    "numinlets": 2,
                    "numoutlets": 1,
                    "outlettype": [ "" ],
                    "patching_rect": [ 529.5749552249908, 264.1700863838196, 29.5, 22.0 ],
                    "text": "2"
                }
            },
            {
                "box": {
                    "id": "obj-86",
                    "maxclass": "message",
                    "numinlets": 2,
                    "numoutlets": 1,
                    "outlettype": [ "" ],
                    "patching_rect": [ 565.1012706756592, 264.1700863838196, 29.5, 22.0 ],
                    "text": "3"
                }
            },
            {
                "box": {
                    "id": "obj-80",
                    "maxclass": "message",
                    "numinlets": 2,
                    "numoutlets": 1,
                    "outlettype": [ "" ],
                    "patching_rect": [ 496.0223239660263, 264.1700863838196, 29.5, 22.0 ],
                    "text": "1"
                }
            },
            {
                "box": {
                    "id": "obj-83",
                    "maxclass": "newobj",
                    "numinlets": 0,
                    "numoutlets": 1,
                    "outlettype": [ "" ],
                    "patching_rect": [ 496.0223239660263, 39.827983260154724, 50.0, 22.0 ],
                    "text": "r printer"
                }
            },
            {
                "box": {
                    "id": "obj-77",
                    "maxclass": "newobj",
                    "numinlets": 10,
                    "numoutlets": 10,
                    "outlettype": [ "bang", "bang", "bang", "bang", "bang", "bang", "bang", "bang", "bang", "" ],
                    "patching_rect": [ 496.0223239660263, 195.0911396741867, 192.0, 22.0 ],
                    "text": "sel C1 C2 C3 C4 C5 C6 C7 C7 C8"
                }
            },
            {
                "box": {
                    "id": "obj-76",
                    "maxclass": "newobj",
                    "numinlets": 2,
                    "numoutlets": 2,
                    "outlettype": [ "", "" ],
                    "patching_rect": [ 496.0223239660263, 121.40692985057831, 58.0, 22.0 ],
                    "text": "route inst"
                }
            },
            {
                "box": {
                    "id": "obj-73",
                    "maxclass": "newobj",
                    "numinlets": 2,
                    "numoutlets": 2,
                    "outlettype": [ "", "" ],
                    "patching_rect": [ 496.0223239660263, 172.06482410430908, 47.0, 22.0 ],
                    "text": "zl.nth 1"
                }
            },
            {
                "box": {
                    "id": "obj-69",
                    "maxclass": "newobj",
                    "numinlets": 2,
                    "numoutlets": 2,
                    "outlettype": [ "", "" ],
                    "patching_rect": [ 496.0223239660263, 91.80166697502136, 93.0, 22.0 ],
                    "text": "route xk_swam:"
                }
            },
            {
                "box": {
                    "id": "obj-74",
                    "maxclass": "newobj",
                    "numinlets": 1,
                    "numoutlets": 1,
                    "outlettype": [ "" ],
                    "patching_rect": [ 496.0223239660263, 67.45956194400787, 71.0, 22.0 ],
                    "text": "fromsymbol"
                }
            },
            {
                "box": {
                    "id": "obj-82",
                    "maxclass": "newobj",
                    "numinlets": 1,
                    "numoutlets": 1,
                    "outlettype": [ "" ],
                    "patching_rect": [ 507.8644291162491, 343.11745405197144, 70.0, 22.0 ],
                    "text": "loadmess 0"
                }
            },
            {
                "box": {
                    "id": "obj-79",
                    "maxclass": "newobj",
                    "numinlets": 0,
                    "numoutlets": 1,
                    "outlettype": [ "" ],
                    "patching_rect": [ 506.5486396551132, 318.11745429039, 77.0, 22.0 ],
                    "text": "r rave_select"
                }
            },
            {
                "box": {
                    "id": "obj-78",
                    "maxclass": "number",
                    "maximum": 7,
                    "minimum": 0,
                    "numinlets": 1,
                    "numoutlets": 2,
                    "outlettype": [ "", "bang" ],
                    "parameter_enable": 0,
                    "patching_rect": [ 586.153902053833, 318.11745429039, 50.0, 22.0 ]
                }
            },
            {
                "box": {
                    "id": "obj-70",
                    "lastchannelcount": 0,
                    "maxclass": "live.gain~",
                    "numinlets": 2,
                    "numoutlets": 5,
                    "outlettype": [ "signal", "signal", "", "float", "list" ],
                    "parameter_enable": 1,
                    "patching_rect": [ 424.6154251098633, 916.9231643676758, 48.0, 136.0 ],
                    "saved_attribute_attributes": {
                        "valueof": {
                            "parameter_longname": "live.gain~[20]",
                            "parameter_mmax": 6.0,
                            "parameter_mmin": -70.0,
                            "parameter_modmode": 3,
                            "parameter_shortname": "live.gain~[3]",
                            "parameter_type": 0,
                            "parameter_unitstyle": 4
                        }
                    },
                    "varname": "live.gain~[14]"
                }
            },
            {
                "box": {
                    "id": "obj-63",
                    "lastchannelcount": 0,
                    "maxclass": "live.gain~",
                    "numinlets": 2,
                    "numoutlets": 5,
                    "outlettype": [ "signal", "signal", "", "float", "list" ],
                    "parameter_enable": 1,
                    "patching_rect": [ 204.61540412902832, 413.84619331359863, 48.0, 136.0 ],
                    "saved_attribute_attributes": {
                        "valueof": {
                            "parameter_longname": "live.gain~[18]",
                            "parameter_mmax": 6.0,
                            "parameter_mmin": -70.0,
                            "parameter_modmode": 3,
                            "parameter_shortname": "live.gain~[13]",
                            "parameter_type": 0,
                            "parameter_unitstyle": 4
                        }
                    },
                    "varname": "live.gain~[12]"
                }
            },
            {
                "box": {
                    "id": "obj-62",
                    "lastchannelcount": 0,
                    "maxclass": "live.gain~",
                    "numinlets": 2,
                    "numoutlets": 5,
                    "outlettype": [ "signal", "signal", "", "float", "list" ],
                    "parameter_enable": 1,
                    "patching_rect": [ 586.153902053833, 573.8462085723877, 48.0, 136.0 ],
                    "saved_attribute_attributes": {
                        "valueof": {
                            "parameter_longname": "live.gain~[17]",
                            "parameter_mmax": 6.0,
                            "parameter_mmin": -70.0,
                            "parameter_modmode": 3,
                            "parameter_shortname": "live.gain~[13]",
                            "parameter_type": 0,
                            "parameter_unitstyle": 4
                        }
                    },
                    "varname": "live.gain~[11]"
                }
            },
            {
                "box": {
                    "id": "obj-61",
                    "lastchannelcount": 0,
                    "maxclass": "live.gain~",
                    "numinlets": 2,
                    "numoutlets": 5,
                    "outlettype": [ "signal", "signal", "", "float", "list" ],
                    "parameter_enable": 1,
                    "patching_rect": [ 703.0769901275635, 666.1539096832275, 48.0, 136.0 ],
                    "saved_attribute_attributes": {
                        "valueof": {
                            "parameter_longname": "live.gain~[16]",
                            "parameter_mmax": 6.0,
                            "parameter_mmin": -70.0,
                            "parameter_modmode": 3,
                            "parameter_shortname": "live.gain~[13]",
                            "parameter_type": 0,
                            "parameter_unitstyle": 4
                        }
                    },
                    "varname": "live.gain~[10]"
                }
            },
            {
                "box": {
                    "id": "obj-60",
                    "lastchannelcount": 0,
                    "maxclass": "live.gain~",
                    "numinlets": 2,
                    "numoutlets": 5,
                    "outlettype": [ "signal", "signal", "", "float", "list" ],
                    "parameter_enable": 1,
                    "patching_rect": [ 821.5385398864746, 712.3077602386475, 48.0, 136.0 ],
                    "saved_attribute_attributes": {
                        "valueof": {
                            "parameter_longname": "live.gain~[15]",
                            "parameter_mmax": 6.0,
                            "parameter_mmin": -70.0,
                            "parameter_modmode": 3,
                            "parameter_shortname": "live.gain~[13]",
                            "parameter_type": 0,
                            "parameter_unitstyle": 4
                        }
                    },
                    "varname": "live.gain~[9]"
                }
            },
            {
                "box": {
                    "id": "obj-59",
                    "lastchannelcount": 0,
                    "maxclass": "live.gain~",
                    "numinlets": 2,
                    "numoutlets": 5,
                    "outlettype": [ "signal", "signal", "", "float", "list" ],
                    "parameter_enable": 1,
                    "patching_rect": [ 453.8461971282959, 523.0769729614258, 48.0, 136.0 ],
                    "saved_attribute_attributes": {
                        "valueof": {
                            "parameter_longname": "live.gain~[14]",
                            "parameter_mmax": 6.0,
                            "parameter_mmin": -70.0,
                            "parameter_modmode": 3,
                            "parameter_shortname": "live.gain~[13]",
                            "parameter_type": 0,
                            "parameter_unitstyle": 4
                        }
                    },
                    "varname": "live.gain~[8]"
                }
            },
            {
                "box": {
                    "id": "obj-58",
                    "lastchannelcount": 0,
                    "maxclass": "live.gain~",
                    "numinlets": 2,
                    "numoutlets": 5,
                    "outlettype": [ "signal", "signal", "", "float", "list" ],
                    "parameter_enable": 1,
                    "patching_rect": [ 338.4615707397461, 461.5385055541992, 48.0, 136.0 ],
                    "saved_attribute_attributes": {
                        "valueof": {
                            "parameter_longname": "live.gain~[13]",
                            "parameter_mmax": 6.0,
                            "parameter_mmin": -70.0,
                            "parameter_modmode": 3,
                            "parameter_shortname": "live.gain~[13]",
                            "parameter_type": 0,
                            "parameter_unitstyle": 4
                        }
                    },
                    "varname": "live.gain~[7]"
                }
            },
            {
                "box": {
                    "attr": "enable",
                    "id": "obj-52",
                    "maxclass": "attrui",
                    "numinlets": 1,
                    "numoutlets": 1,
                    "outlettype": [ "" ],
                    "parameter_enable": 0,
                    "patching_rect": [ 793.8462295532227, 875.3846988677979, 150.0, 22.0 ]
                }
            },
            {
                "box": {
                    "id": "obj-53",
                    "maxclass": "newobj",
                    "numinlets": 8,
                    "numoutlets": 1,
                    "outlettype": [ "signal" ],
                    "patching_rect": [ 735.3846855163574, 929.2308578491211, 186.0, 22.0 ],
                    "text": "nn~ downtempo_house decode 0"
                }
            },
            {
                "box": {
                    "id": "obj-54",
                    "maxclass": "newobj",
                    "numinlets": 1,
                    "numoutlets": 8,
                    "outlettype": [ "signal", "signal", "signal", "signal", "signal", "signal", "signal", "signal" ],
                    "patching_rect": [ 735.3846855163574, 903.0770092010498, 186.0, 22.0 ],
                    "text": "nn~ downtempo_house encode 0"
                }
            },
            {
                "box": {
                    "id": "obj-51",
                    "lastchannelcount": 0,
                    "maxclass": "live.gain~",
                    "numinlets": 2,
                    "numoutlets": 5,
                    "outlettype": [ "signal", "signal", "", "float", "list" ],
                    "parameter_enable": 1,
                    "patching_rect": [ 369.2308044433594, 916.9231643676758, 48.0, 136.0 ],
                    "saved_attribute_attributes": {
                        "valueof": {
                            "parameter_longname": "live.gain~[12]",
                            "parameter_mmax": 6.0,
                            "parameter_mmin": -70.0,
                            "parameter_modmode": 3,
                            "parameter_shortname": "live.gain~[3]",
                            "parameter_type": 0,
                            "parameter_unitstyle": 4
                        }
                    },
                    "varname": "live.gain~[6]"
                }
            },
            {
                "box": {
                    "id": "obj-41",
                    "maxclass": "toggle",
                    "numinlets": 1,
                    "numoutlets": 1,
                    "outlettype": [ "int" ],
                    "parameter_enable": 0,
                    "patching_rect": [ 735.4960058927536, 489.17008423805237, 24.0, 24.0 ]
                }
            },
            {
                "box": {
                    "id": "obj-42",
                    "maxclass": "toggle",
                    "numinlets": 1,
                    "numoutlets": 1,
                    "outlettype": [ "int" ],
                    "parameter_enable": 0,
                    "patching_rect": [ 675.6275854110718, 489.17008423805237, 24.0, 24.0 ]
                }
            },
            {
                "box": {
                    "id": "obj-43",
                    "maxclass": "toggle",
                    "numinlets": 1,
                    "numoutlets": 1,
                    "outlettype": [ "int" ],
                    "parameter_enable": 0,
                    "patching_rect": [ 617.0749543905258, 489.17008423805237, 24.0, 24.0 ]
                }
            },
            {
                "box": {
                    "id": "obj-44",
                    "maxclass": "toggle",
                    "numinlets": 1,
                    "numoutlets": 1,
                    "outlettype": [ "int" ],
                    "parameter_enable": 0,
                    "patching_rect": [ 765.1012687683105, 489.17008423805237, 24.0, 24.0 ]
                }
            },
            {
                "box": {
                    "id": "obj-45",
                    "maxclass": "toggle",
                    "numinlets": 1,
                    "numoutlets": 1,
                    "outlettype": [ "int" ],
                    "parameter_enable": 0,
                    "patching_rect": [ 705.2328482866287, 489.17008423805237, 24.0, 24.0 ]
                }
            },
            {
                "box": {
                    "id": "obj-46",
                    "maxclass": "toggle",
                    "numinlets": 1,
                    "numoutlets": 1,
                    "outlettype": [ "int" ],
                    "parameter_enable": 0,
                    "patching_rect": [ 646.6802172660828, 489.17008423805237, 24.0, 24.0 ]
                }
            },
            {
                "box": {
                    "id": "obj-47",
                    "maxclass": "toggle",
                    "numinlets": 1,
                    "numoutlets": 1,
                    "outlettype": [ "int" ],
                    "parameter_enable": 0,
                    "patching_rect": [ 586.153902053833, 489.17008423805237, 24.0, 24.0 ]
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
                    "patching_rect": [ 586.153902053833, 461.5385055541992, 196.5999999999999, 22.0 ],
                    "saved_object_attributes": {
                        "parameter_enable": 0
                    },
                    "text": "v8 onehot",
                    "textfile": {
                        "filename": "onehot.js",
                        "flags": 0,
                        "embed": 0,
                        "autowatch": 1
                    },
                    "varname": "v8_AA"
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
                    "patching_rect": [ 586.153902053833, 343.11745405197144, 22.689074277877808, 114.0 ],
                    "shape": 1,
                    "size": 7,
                    "style": "rnbohighcontrast",
                    "value": 0
                }
            },
            {
                "box": {
                    "id": "obj-40",
                    "lastchannelcount": 0,
                    "maxclass": "live.gain~",
                    "numinlets": 2,
                    "numoutlets": 5,
                    "outlettype": [ "signal", "signal", "", "float", "list" ],
                    "parameter_enable": 1,
                    "patching_rect": [ 310.76926040649414, 916.9231643676758, 48.0, 136.0 ],
                    "saved_attribute_attributes": {
                        "valueof": {
                            "parameter_longname": "live.gain~[11]",
                            "parameter_mmax": 6.0,
                            "parameter_mmin": -70.0,
                            "parameter_modmode": 3,
                            "parameter_shortname": "live.gain~[3]",
                            "parameter_type": 0,
                            "parameter_unitstyle": 4
                        }
                    },
                    "varname": "live.gain~[5]"
                }
            },
            {
                "box": {
                    "attr": "enable",
                    "id": "obj-37",
                    "maxclass": "attrui",
                    "numinlets": 1,
                    "numoutlets": 1,
                    "outlettype": [ "" ],
                    "parameter_enable": 0,
                    "patching_rect": [ 655.3846778869629, 816.9231548309326, 150.0, 22.0 ]
                }
            },
            {
                "box": {
                    "id": "obj-38",
                    "maxclass": "newobj",
                    "numinlets": 16,
                    "numoutlets": 1,
                    "outlettype": [ "signal" ],
                    "patching_rect": [ 532.3077430725098, 870.7693138122559, 176.5, 22.0 ],
                    "text": "nn~ organ_bach decode 0"
                }
            },
            {
                "box": {
                    "id": "obj-39",
                    "maxclass": "newobj",
                    "numinlets": 1,
                    "numoutlets": 16,
                    "outlettype": [ "signal", "signal", "signal", "signal", "signal", "signal", "signal", "signal", "signal", "signal", "signal", "signal", "signal", "signal", "signal", "signal" ],
                    "patching_rect": [ 532.3077430725098, 846.1539268493652, 176.5, 22.0 ],
                    "text": "nn~ organ_bach encode 0"
                }
            },
            {
                "box": {
                    "id": "obj-36",
                    "lastchannelcount": 0,
                    "maxclass": "live.gain~",
                    "numinlets": 2,
                    "numoutlets": 5,
                    "outlettype": [ "signal", "signal", "", "float", "list" ],
                    "parameter_enable": 1,
                    "patching_rect": [ 252.3077163696289, 916.9231643676758, 48.0, 136.0 ],
                    "saved_attribute_attributes": {
                        "valueof": {
                            "parameter_longname": "live.gain~[10]",
                            "parameter_mmax": 6.0,
                            "parameter_mmin": -70.0,
                            "parameter_modmode": 3,
                            "parameter_shortname": "live.gain~[3]",
                            "parameter_type": 0,
                            "parameter_unitstyle": 4
                        }
                    },
                    "varname": "live.gain~[4]"
                }
            },
            {
                "box": {
                    "attr": "enable",
                    "id": "obj-28",
                    "maxclass": "attrui",
                    "numinlets": 1,
                    "numoutlets": 1,
                    "outlettype": [ "" ],
                    "parameter_enable": 0,
                    "patching_rect": [ 506.1538944244385, 715.3846836090088, 150.0, 22.0 ]
                }
            },
            {
                "box": {
                    "id": "obj-30",
                    "maxclass": "newobj",
                    "numinlets": 22,
                    "numoutlets": 1,
                    "outlettype": [ "signal" ],
                    "patching_rect": [ 424.6154251098633, 793.8462295532227, 239.5, 22.0 ],
                    "text": "nn~ voice_vctk decode 0"
                }
            },
            {
                "box": {
                    "id": "obj-34",
                    "maxclass": "newobj",
                    "numinlets": 1,
                    "numoutlets": 22,
                    "outlettype": [ "signal", "signal", "signal", "signal", "signal", "signal", "signal", "signal", "signal", "signal", "signal", "signal", "signal", "signal", "signal", "signal", "signal", "signal", "signal", "signal", "signal", "signal" ],
                    "patching_rect": [ 424.6154251098633, 769.230842590332, 239.5, 22.0 ],
                    "text": "nn~ voice_vctk encode 0"
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
                    "patching_rect": [ 276.92310333251953, 1109.2308750152588, 48.0, 136.0 ],
                    "saved_attribute_attributes": {
                        "valueof": {
                            "parameter_longname": "live.gain~[9]",
                            "parameter_mmax": 6.0,
                            "parameter_mmin": -70.0,
                            "parameter_modmode": 3,
                            "parameter_shortname": "live.gain~[3]",
                            "parameter_type": 0,
                            "parameter_unitstyle": 4
                        }
                    },
                    "varname": "live.gain~[3]"
                }
            },
            {
                "box": {
                    "id": "obj-23",
                    "lastchannelcount": 0,
                    "maxclass": "live.gain~",
                    "numinlets": 2,
                    "numoutlets": 5,
                    "outlettype": [ "signal", "signal", "", "float", "list" ],
                    "parameter_enable": 1,
                    "patching_rect": [ 84.61539268493652, 916.9231643676758, 48.0, 136.0 ],
                    "saved_attribute_attributes": {
                        "valueof": {
                            "parameter_longname": "live.gain~[8]",
                            "parameter_mmax": 6.0,
                            "parameter_mmin": -70.0,
                            "parameter_modmode": 3,
                            "parameter_shortname": "live.gain~[3]",
                            "parameter_type": 0,
                            "parameter_unitstyle": 4
                        }
                    },
                    "varname": "live.gain~[2]"
                }
            },
            {
                "box": {
                    "attr": "release",
                    "id": "obj-16",
                    "maxclass": "attrui",
                    "numinlets": 1,
                    "numoutlets": 1,
                    "outlettype": [ "" ],
                    "parameter_enable": 0,
                    "patching_rect": [ 558.461591720581, 1109.2308750152588, 150.0, 22.0 ]
                }
            },
            {
                "box": {
                    "attr": "ratio",
                    "id": "obj-18",
                    "maxclass": "attrui",
                    "numinlets": 1,
                    "numoutlets": 1,
                    "outlettype": [ "" ],
                    "parameter_enable": 0,
                    "patching_rect": [ 558.461591720581, 1156.9231872558594, 150.0, 22.0 ]
                }
            },
            {
                "box": {
                    "attr": "gain",
                    "id": "obj-19",
                    "maxclass": "attrui",
                    "numinlets": 1,
                    "numoutlets": 1,
                    "outlettype": [ "" ],
                    "parameter_enable": 0,
                    "patching_rect": [ 558.461591720581, 1180.0001125335693, 150.0, 22.0 ]
                }
            },
            {
                "box": {
                    "attr": "threshold",
                    "id": "obj-21",
                    "maxclass": "attrui",
                    "numinlets": 1,
                    "numoutlets": 1,
                    "outlettype": [ "" ],
                    "parameter_enable": 0,
                    "patching_rect": [ 558.461591720581, 1130.769338607788, 150.0, 22.0 ]
                }
            },
            {
                "box": {
                    "attr": "attack",
                    "id": "obj-6",
                    "maxclass": "attrui",
                    "numinlets": 1,
                    "numoutlets": 1,
                    "outlettype": [ "" ],
                    "parameter_enable": 0,
                    "patching_rect": [ 558.461591720581, 1083.0770263671875, 150.0, 22.0 ]
                }
            },
            {
                "box": {
                    "id": "obj-22",
                    "linecount": 2,
                    "maxclass": "newobj",
                    "numinlets": 6,
                    "numoutlets": 2,
                    "outlettype": [ "signal", "signal" ],
                    "patching_rect": [ 276.92310333251953, 1069.2308712005615, 251.0, 36.0 ],
                    "text": "abl.device.compressor~ @attack 0.02 @release 0.08 @threshold -20",
                    "varname": "abl.device.compressor~_AA"
                }
            },
            {
                "box": {
                    "id": "obj-13",
                    "lastchannelcount": 0,
                    "maxclass": "live.gain~",
                    "numinlets": 2,
                    "numoutlets": 5,
                    "outlettype": [ "signal", "signal", "", "float", "list" ],
                    "parameter_enable": 1,
                    "patching_rect": [ 143.07693672180176, 916.9231643676758, 48.0, 136.0 ],
                    "saved_attribute_attributes": {
                        "valueof": {
                            "parameter_longname": "live.gain~[7]",
                            "parameter_mmax": 6.0,
                            "parameter_mmin": -70.0,
                            "parameter_modmode": 3,
                            "parameter_shortname": "live.gain~[3]",
                            "parameter_type": 0,
                            "parameter_unitstyle": 4
                        }
                    },
                    "varname": "live.gain~[1]"
                }
            },
            {
                "box": {
                    "id": "obj-9",
                    "maxclass": "newobj",
                    "numinlets": 2,
                    "numoutlets": 1,
                    "outlettype": [ "signal" ],
                    "patching_rect": [ 75.38462257385254, 366.15388107299805, 29.5, 22.0 ],
                    "text": "+~"
                }
            },
            {
                "box": {
                    "attr": "enable",
                    "id": "obj-35",
                    "maxclass": "attrui",
                    "numinlets": 1,
                    "numoutlets": 1,
                    "outlettype": [ "" ],
                    "parameter_enable": 0,
                    "patching_rect": [ 392.30772972106934, 676.9231414794922, 150.0, 22.0 ]
                }
            },
            {
                "box": {
                    "id": "obj-32",
                    "maxclass": "newobj",
                    "numinlets": 16,
                    "numoutlets": 1,
                    "outlettype": [ "signal" ],
                    "patching_rect": [ 272.30771827697754, 727.6923770904541, 176.5, 22.0 ],
                    "text": "nn~ voice_vocalset decode 0"
                }
            },
            {
                "box": {
                    "id": "obj-33",
                    "maxclass": "newobj",
                    "numinlets": 1,
                    "numoutlets": 16,
                    "outlettype": [ "signal", "signal", "signal", "signal", "signal", "signal", "signal", "signal", "signal", "signal", "signal", "signal", "signal", "signal", "signal", "signal" ],
                    "patching_rect": [ 267.69233322143555, 704.6154518127441, 176.5, 22.0 ],
                    "text": "nn~ voice_vocalset encode 0"
                }
            },
            {
                "box": {
                    "attr": "enable",
                    "id": "obj-31",
                    "maxclass": "attrui",
                    "numinlets": 1,
                    "numoutlets": 1,
                    "outlettype": [ "" ],
                    "parameter_enable": 0,
                    "patching_rect": [ 246.15386962890625, 612.3077507019043, 150.0, 22.0 ]
                }
            },
            {
                "box": {
                    "attr": "enable",
                    "id": "obj-27",
                    "maxclass": "attrui",
                    "numinlets": 1,
                    "numoutlets": 1,
                    "outlettype": [ "" ],
                    "parameter_enable": 0,
                    "patching_rect": [ 109.23077964782715, 555.3846683502197, 150.0, 22.0 ]
                }
            },
            {
                "box": {
                    "id": "obj-17",
                    "maxclass": "newobj",
                    "numinlets": 16,
                    "numoutlets": 1,
                    "outlettype": [ "signal" ],
                    "patching_rect": [ 116.92308807373047, 661.5385246276855, 176.5, 22.0 ],
                    "text": "nn~ water_pondbrain decode 0"
                }
            },
            {
                "box": {
                    "id": "obj-20",
                    "maxclass": "newobj",
                    "numinlets": 1,
                    "numoutlets": 16,
                    "outlettype": [ "signal", "signal", "signal", "signal", "signal", "signal", "signal", "signal", "signal", "signal", "signal", "signal", "signal", "signal", "signal", "signal" ],
                    "patching_rect": [ 116.92308807373047, 636.9231376647949, 176.5, 22.0 ],
                    "text": "nn~ water_pondbrain encode 0"
                }
            },
            {
                "box": {
                    "id": "obj-14",
                    "maxclass": "newobj",
                    "numinlets": 4,
                    "numoutlets": 2,
                    "outlettype": [ "signal", "signal" ],
                    "patching_rect": [ 84.61539268493652, 603.0769805908203, 143.0, 22.0 ],
                    "text": "nn~ percussion decode 0"
                }
            },
            {
                "box": {
                    "id": "obj-8",
                    "maxclass": "newobj",
                    "numinlets": 1,
                    "numoutlets": 4,
                    "outlettype": [ "signal", "signal", "signal", "signal" ],
                    "patching_rect": [ 84.61539268493652, 580.0000553131104, 143.0, 22.0 ],
                    "text": "nn~ percussion encode 0"
                }
            },
            {
                "box": {
                    "id": "obj-26",
                    "maxclass": "newobj",
                    "numinlets": 1,
                    "numoutlets": 1,
                    "outlettype": [ "signal" ],
                    "patching_rect": [ 124.61539649963379, 327.69233894348145, 46.0, 22.0 ],
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
                    "patching_rect": [ 75.38462257385254, 327.69233894348145, 46.0, 22.0 ],
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
                    "patching_rect": [ 196.923095703125, 916.9231643676758, 48.0, 136.0 ],
                    "saved_attribute_attributes": {
                        "valueof": {
                            "parameter_longname": "live.gain~[4]",
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
            }
        ],
        "lines": [
            {
                "patchline": {
                    "destination": [ "obj-78", 0 ],
                    "source": [ "obj-101", 0 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-106", 0 ],
                    "source": [ "obj-103", 0 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-105", 0 ],
                    "order": 0,
                    "source": [ "obj-104", 0 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-106", 0 ],
                    "order": 1,
                    "source": [ "obj-104", 0 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-70", 1 ],
                    "order": 0,
                    "source": [ "obj-105", 0 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-70", 0 ],
                    "order": 1,
                    "source": [ "obj-105", 0 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-105", 7 ],
                    "source": [ "obj-106", 7 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-105", 6 ],
                    "source": [ "obj-106", 6 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-105", 5 ],
                    "source": [ "obj-106", 5 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-105", 4 ],
                    "source": [ "obj-106", 4 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-105", 3 ],
                    "source": [ "obj-106", 3 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-105", 2 ],
                    "source": [ "obj-106", 2 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-105", 1 ],
                    "source": [ "obj-106", 1 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-105", 0 ],
                    "source": [ "obj-106", 0 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-78", 0 ],
                    "source": [ "obj-107", 0 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-9", 0 ],
                    "source": [ "obj-11", 0 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-22", 0 ],
                    "source": [ "obj-13", 0 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-23", 1 ],
                    "order": 0,
                    "source": [ "obj-14", 0 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-23", 0 ],
                    "order": 1,
                    "source": [ "obj-14", 0 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-22", 0 ],
                    "source": [ "obj-16", 0 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-13", 1 ],
                    "order": 0,
                    "source": [ "obj-17", 0 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-13", 0 ],
                    "order": 1,
                    "source": [ "obj-17", 0 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-22", 0 ],
                    "source": [ "obj-18", 0 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-22", 0 ],
                    "source": [ "obj-19", 0 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-17", 15 ],
                    "source": [ "obj-20", 15 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-17", 14 ],
                    "source": [ "obj-20", 14 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-17", 13 ],
                    "source": [ "obj-20", 13 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-17", 12 ],
                    "source": [ "obj-20", 12 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-17", 11 ],
                    "source": [ "obj-20", 11 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-17", 10 ],
                    "source": [ "obj-20", 10 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-17", 9 ],
                    "source": [ "obj-20", 9 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-17", 8 ],
                    "source": [ "obj-20", 8 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-17", 7 ],
                    "source": [ "obj-20", 7 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-17", 6 ],
                    "source": [ "obj-20", 6 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-17", 5 ],
                    "source": [ "obj-20", 5 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-17", 4 ],
                    "source": [ "obj-20", 4 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-17", 3 ],
                    "source": [ "obj-20", 3 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-17", 2 ],
                    "source": [ "obj-20", 2 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-17", 1 ],
                    "source": [ "obj-20", 1 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-17", 0 ],
                    "source": [ "obj-20", 0 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-22", 0 ],
                    "source": [ "obj-21", 0 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-24", 0 ],
                    "source": [ "obj-22", 0 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-22", 0 ],
                    "source": [ "obj-23", 0 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-2", 0 ],
                    "source": [ "obj-24", 0 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-9", 1 ],
                    "source": [ "obj-26", 0 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-14", 0 ],
                    "order": 0,
                    "source": [ "obj-27", 0 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-8", 0 ],
                    "order": 1,
                    "source": [ "obj-27", 0 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-30", 0 ],
                    "order": 0,
                    "source": [ "obj-28", 0 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-34", 0 ],
                    "order": 1,
                    "source": [ "obj-28", 0 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-22", 0 ],
                    "source": [ "obj-29", 0 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-36", 1 ],
                    "order": 0,
                    "source": [ "obj-30", 0 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-36", 0 ],
                    "order": 1,
                    "source": [ "obj-30", 0 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-17", 0 ],
                    "order": 0,
                    "source": [ "obj-31", 0 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-20", 0 ],
                    "order": 1,
                    "source": [ "obj-31", 0 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-29", 1 ],
                    "order": 0,
                    "source": [ "obj-32", 0 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-29", 0 ],
                    "order": 1,
                    "source": [ "obj-32", 0 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-32", 15 ],
                    "source": [ "obj-33", 15 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-32", 14 ],
                    "source": [ "obj-33", 14 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-32", 13 ],
                    "source": [ "obj-33", 13 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-32", 12 ],
                    "source": [ "obj-33", 12 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-32", 11 ],
                    "source": [ "obj-33", 11 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-32", 10 ],
                    "source": [ "obj-33", 10 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-32", 9 ],
                    "source": [ "obj-33", 9 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-32", 8 ],
                    "source": [ "obj-33", 8 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-32", 7 ],
                    "source": [ "obj-33", 7 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-32", 6 ],
                    "source": [ "obj-33", 6 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-32", 5 ],
                    "source": [ "obj-33", 5 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-32", 4 ],
                    "source": [ "obj-33", 4 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-32", 3 ],
                    "source": [ "obj-33", 3 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-32", 2 ],
                    "source": [ "obj-33", 2 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-32", 1 ],
                    "source": [ "obj-33", 1 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-32", 0 ],
                    "source": [ "obj-33", 0 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-30", 21 ],
                    "source": [ "obj-34", 21 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-30", 20 ],
                    "source": [ "obj-34", 20 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-30", 19 ],
                    "source": [ "obj-34", 19 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-30", 18 ],
                    "source": [ "obj-34", 18 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-30", 17 ],
                    "source": [ "obj-34", 17 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-30", 16 ],
                    "source": [ "obj-34", 16 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-30", 15 ],
                    "source": [ "obj-34", 15 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-30", 14 ],
                    "source": [ "obj-34", 14 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-30", 13 ],
                    "source": [ "obj-34", 13 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-30", 12 ],
                    "source": [ "obj-34", 12 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-30", 11 ],
                    "source": [ "obj-34", 11 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-30", 10 ],
                    "source": [ "obj-34", 10 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-30", 9 ],
                    "source": [ "obj-34", 9 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-30", 8 ],
                    "source": [ "obj-34", 8 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-30", 7 ],
                    "source": [ "obj-34", 7 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-30", 6 ],
                    "source": [ "obj-34", 6 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-30", 5 ],
                    "source": [ "obj-34", 5 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-30", 4 ],
                    "source": [ "obj-34", 4 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-30", 3 ],
                    "source": [ "obj-34", 3 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-30", 2 ],
                    "source": [ "obj-34", 2 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-30", 1 ],
                    "source": [ "obj-34", 1 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-30", 0 ],
                    "source": [ "obj-34", 0 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-32", 0 ],
                    "order": 0,
                    "source": [ "obj-35", 0 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-33", 0 ],
                    "order": 1,
                    "source": [ "obj-35", 0 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-22", 0 ],
                    "source": [ "obj-36", 0 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-38", 0 ],
                    "order": 0,
                    "source": [ "obj-37", 0 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-39", 0 ],
                    "order": 1,
                    "source": [ "obj-37", 0 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-40", 1 ],
                    "order": 0,
                    "source": [ "obj-38", 0 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-40", 0 ],
                    "order": 1,
                    "source": [ "obj-38", 0 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-38", 15 ],
                    "source": [ "obj-39", 15 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-38", 14 ],
                    "source": [ "obj-39", 14 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-38", 13 ],
                    "source": [ "obj-39", 13 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-38", 12 ],
                    "source": [ "obj-39", 12 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-38", 11 ],
                    "source": [ "obj-39", 11 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-38", 10 ],
                    "source": [ "obj-39", 10 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-38", 9 ],
                    "source": [ "obj-39", 9 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-38", 8 ],
                    "source": [ "obj-39", 8 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-38", 7 ],
                    "source": [ "obj-39", 7 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-38", 6 ],
                    "source": [ "obj-39", 6 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-38", 5 ],
                    "source": [ "obj-39", 5 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-38", 4 ],
                    "source": [ "obj-39", 4 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-38", 3 ],
                    "source": [ "obj-39", 3 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-38", 2 ],
                    "source": [ "obj-39", 2 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-38", 1 ],
                    "source": [ "obj-39", 1 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-38", 0 ],
                    "source": [ "obj-39", 0 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-22", 0 ],
                    "source": [ "obj-40", 0 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-52", 0 ],
                    "source": [ "obj-41", 0 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-28", 0 ],
                    "source": [ "obj-42", 0 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-31", 0 ],
                    "source": [ "obj-43", 0 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-104", 0 ],
                    "source": [ "obj-44", 0 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-37", 0 ],
                    "source": [ "obj-45", 0 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-35", 0 ],
                    "source": [ "obj-46", 0 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-27", 0 ],
                    "source": [ "obj-47", 0 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-22", 0 ],
                    "source": [ "obj-51", 0 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-53", 0 ],
                    "order": 0,
                    "source": [ "obj-52", 0 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-54", 0 ],
                    "order": 1,
                    "source": [ "obj-52", 0 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-51", 1 ],
                    "order": 0,
                    "source": [ "obj-53", 0 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-51", 0 ],
                    "order": 1,
                    "source": [ "obj-53", 0 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-53", 3 ],
                    "source": [ "obj-54", 3 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-53", 2 ],
                    "source": [ "obj-54", 2 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-53", 1 ],
                    "source": [ "obj-54", 1 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-53", 0 ],
                    "source": [ "obj-54", 0 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-20", 0 ],
                    "source": [ "obj-58", 0 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-33", 0 ],
                    "source": [ "obj-59", 0 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-22", 0 ],
                    "source": [ "obj-6", 0 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-54", 0 ],
                    "source": [ "obj-60", 0 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-39", 0 ],
                    "source": [ "obj-61", 0 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-34", 0 ],
                    "source": [ "obj-62", 0 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-8", 0 ],
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
                    "destination": [ "obj-76", 0 ],
                    "source": [ "obj-69", 0 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-22", 0 ],
                    "source": [ "obj-70", 0 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-41", 0 ],
                    "source": [ "obj-72", 5 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-42", 0 ],
                    "source": [ "obj-72", 3 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-43", 0 ],
                    "source": [ "obj-72", 1 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-44", 0 ],
                    "source": [ "obj-72", 6 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-45", 0 ],
                    "source": [ "obj-72", 4 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-46", 0 ],
                    "source": [ "obj-72", 2 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-47", 0 ],
                    "source": [ "obj-72", 0 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-77", 0 ],
                    "order": 1,
                    "source": [ "obj-73", 0 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-99", 1 ],
                    "order": 0,
                    "source": [ "obj-73", 0 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-69", 0 ],
                    "source": [ "obj-74", 0 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-94", 0 ],
                    "source": [ "obj-76", 0 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-101", 0 ],
                    "source": [ "obj-77", 2 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-107", 0 ],
                    "source": [ "obj-77", 3 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-80", 0 ],
                    "source": [ "obj-77", 0 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-86", 0 ],
                    "source": [ "obj-77", 6 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-86", 0 ],
                    "source": [ "obj-77", 5 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-86", 0 ],
                    "source": [ "obj-77", 4 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-88", 0 ],
                    "source": [ "obj-77", 7 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-90", 0 ],
                    "source": [ "obj-77", 8 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-91", 0 ],
                    "source": [ "obj-77", 1 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-66", 0 ],
                    "source": [ "obj-78", 0 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-78", 0 ],
                    "source": [ "obj-79", 0 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-14", 3 ],
                    "source": [ "obj-8", 3 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-14", 2 ],
                    "source": [ "obj-8", 2 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-14", 1 ],
                    "source": [ "obj-8", 1 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-14", 0 ],
                    "source": [ "obj-8", 0 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-78", 0 ],
                    "source": [ "obj-80", 0 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-78", 0 ],
                    "source": [ "obj-82", 0 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-74", 0 ],
                    "source": [ "obj-83", 0 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-78", 0 ],
                    "source": [ "obj-86", 0 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-78", 0 ],
                    "source": [ "obj-88", 0 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-103", 0 ],
                    "order": 0,
                    "source": [ "obj-9", 0 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-58", 0 ],
                    "midpoints": [ 84.88462257385254, 399.76934814453125, 347.9615707397461, 399.76934814453125 ],
                    "order": 5,
                    "source": [ "obj-9", 0 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-59", 0 ],
                    "midpoints": [ 84.88462257385254, 399.76934814453125, 463.3461971282959, 399.76934814453125 ],
                    "order": 4,
                    "source": [ "obj-9", 0 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-60", 0 ],
                    "midpoints": [ 84.88462257385254, 399.76934814453125, 571.384635925293, 399.76934814453125, 571.384635925293, 558.7693481445312, 831.0385398864746, 558.7693481445312 ],
                    "order": 1,
                    "source": [ "obj-9", 0 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-61", 0 ],
                    "midpoints": [ 84.88462257385254, 399.76934814453125, 571.384635925293, 399.76934814453125, 571.384635925293, 558.7693481445312, 712.5769901275635, 558.7693481445312 ],
                    "order": 2,
                    "source": [ "obj-9", 0 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-62", 0 ],
                    "midpoints": [ 84.88462257385254, 399.76934814453125, 571.384635925293, 399.76934814453125, 571.384635925293, 558.7693481445312, 595.653902053833, 558.7693481445312 ],
                    "order": 3,
                    "source": [ "obj-9", 0 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-63", 0 ],
                    "midpoints": [ 84.88462257385254, 399.76934814453125, 214.11540412902832, 399.76934814453125 ],
                    "order": 6,
                    "source": [ "obj-9", 0 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-78", 0 ],
                    "source": [ "obj-91", 0 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-97", 0 ],
                    "source": [ "obj-94", 0 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-73", 0 ],
                    "source": [ "obj-97", 0 ]
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
    }
}