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
        "rect": [ 2656.0, -35.0, 649.0, 879.0 ],
        "boxes": [
            {
                "box": {
                    "color": [ 0.869177997112274, 0.548376858234406, 0.0, 1.0 ],
                    "id": "obj-3",
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
                    "patching_rect": [ 986.0, 236.0, 103.0, 22.0 ],
                    "text": "p MaxMSP-Agent",
                    "varname": "maxmcpid-159"
                }
            },
            {
                "box": {
                    "color": [ 0.988235294117647, 0.745098039215686, 0.388235294117647, 1.0 ],
                    "filename": "max_mcp_v8_add_on.js",
                    "id": "obj-5",
                    "maxclass": "newobj",
                    "numinlets": 1,
                    "numoutlets": 2,
                    "outlettype": [ "", "" ],
                    "patching_rect": [ 1047.0, 272.0, 155.0, 22.0 ],
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
                    "patching_rect": [ 986.0, 584.0, 46.0, 22.0 ],
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
                    "id": "obj-14",
                    "linecount": 5,
                    "maxclass": "comment",
                    "numinlets": 1,
                    "numoutlets": 0,
                    "patching_rect": [ 1132.0, 66.0, 134.0, 94.0 ],
                    "text": "Change a port when necessary. The port number need to match the port number in the server.py file",
                    "varname": "maxmcpid-150"
                }
            },
            {
                "box": {
                    "bubble": 1,
                    "bubblepoint": 0.2,
                    "bubbleside": 2,
                    "id": "obj-15",
                    "maxclass": "comment",
                    "numinlets": 1,
                    "numoutlets": 0,
                    "patching_rect": [ 993.0, 66.0, 124.0, 39.0 ],
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
                    "patching_rect": [ 1028.0, 305.0, 159.0, 22.0 ],
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
                    "patching_rect": [ 1130.0, 172.0, 59.0, 22.0 ],
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
                    "patching_rect": [ 1005.0, 149.0, 65.0, 22.0 ],
                    "text": "script stop",
                    "varname": "maxmcpid-146"
                }
            },
            {
                "box": {
                    "id": "obj-16",
                    "maxclass": "message",
                    "numinlets": 2,
                    "numoutlets": 1,
                    "outlettype": [ "" ],
                    "patching_rect": [ 986.0, 115.0, 66.0, 22.0 ],
                    "text": "script start",
                    "varname": "maxmcpid-145"
                }
            },
            {
                "box": {
                    "color": [ 0.905882352941176, 0.709803921568627, 0.341176470588235, 1.0 ],
                    "id": "obj-17",
                    "maxclass": "newobj",
                    "numinlets": 1,
                    "numoutlets": 3,
                    "outlettype": [ "", "", "" ],
                    "patching_rect": [ 1118.0, 236.0, 85.0, 22.0 ],
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
                    "patching_rect": [ 986.0, 341.0, 277.0, 220.0 ],
                    "rendermode": 0,
                    "url": "file://n4m.monitor.html",
                    "varname": "maxmcpid-143"
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
                    "patching_rect": [ 228.0, 213.0, 148.0, 22.0 ],
                    "text": "read xenakube_2.swam"
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
                    "patching_rect": [ 106.0, 213.0, 120.0, 22.0 ],
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
                                        "blob": "22384.VMjLgb1U...O+fWarAhckI2bo8la8HRLt.iHfTlai8FYo41Y8HRUTYTK3HxO9.BOVMEUy.Ea0cVZtMEcgQWY9vSRC8Vav8lak4Fc9DiM2.iLtXUSGM1UA4hKtXlKt3hKP4hKt3hKtvjdXQ2bD4hKDoVRFkjdP4VPt3hKHYGUoUULL4BS1IjKt3hKtPjKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKz3VUCkzTHkTPD4hK1k2Sy.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.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.iUgsVTsIFMvjFR1MiTMglKngEMAcEV40zUOglKogjYHYkV1giQgcVRW8DZtjFR0MyPOUmdTIEQqoFUqAiUXYWPWoEciYUTzEUahQCMC8TSqQTTIkTUYMWQFIlcqwVXsUkZgoWRWQlYTwVXmkjQgsVTV8DZDkFRl4xUXgWQVE1ZQcUV3sFQYgCRBMFdUYUX0cWLgMUPWk0ZQwFRlwjQZcFMrE1Z2Y0SnQTZHYldVkUdMcEVsUkQUQSPWkENHIESn4hTgkWRV8DZlMDSn4hPgkWRV8DZ5IESnMyPO0zZDEURIUUVyUjQhY2ZrEVaMQ0X3k0UYYlZrElcUczXkAiUZQGLogjcyHDSn4hTZQWPWMld3TUXmc1UOgFQowjLyHDSn4BdgASTxb0bqwVX3fjPLQmKogjY2X0X5gSUgc1YW8DZDkFSxLiPLglK3IlaEYjXqASZHY2LBwDZtfmXz.iUgsVTsIFMvjFR1MiTMglKngEMAcEV40zUOglKogjYHYkV1giQgcVRW8DZtjFR0MyPOUmdTIEQqoFUqAiUXYWPWoEciYUTzEUahQCMC8TSqQTTIkTUYMWQFIlcqwVXsUkZgoWRWQlYTwVXmkjQgsVTV8DZDkFRl4xUXgWQVE1ZQcUV3sFQYgCRRE1YqwVXVgiQgACLVkEZtfGVtUDagQWUFEFNHIESxfjPHMWUwHVdEESVqEUUjYWUV8DZDkFRloWLhgFLogjLHIDRx0TaXgCRRszcHg1S2nGURQzZpQ0ZvXEV1EzUZQ2Xw.ELI01XqEjTZQWPWMld3TUXuQiUOglKosjcHIDRuQiQhASTxb0bEYDY3fjTLgmXosjcHIDR0U0QiUFLVoEcvjFR1MiPLglK3EFLQIyUyUjQjgCRRwDdhk1R1gjPHk2YVgkcUY0Sn4RZKYGRBgTdqcUXyUkQig2ZW8DZtj1RvfjPHg1ZGI1YMIiX3fjPLglKng0aAISXxUDahgCRBwDZ2f1S2biTSkTTTIkTUYUXmEzQh8FMwjUQzXzX3sVaOcidTIEQqoFUqAiUXYWPWoEciYUTzEUahQSPRkEcEwFVxUkQYgCRRwDZtHjXmkzUXMWUFM1ZIckTpASZHYWQrEFT3XzXn4BdX4VQrEFcUYTX3fjTLICRBgzbUEiX4UTLYsVTUQlcUY0SnQTZHYldwHFZvjFR24RZHYlcwHFZvjFRyQTZHkicSMURQQkTRUkUgcVPGI1azDSVCUUahESUFgzazXjXvDkLWM2ZrEFNHIDSz4RZHYlZrElcUczXkAiUXMCLogzcHkWSz4RZHY1MVMld3TUXuQiUOglKosjcHIDR0U0QiUFLVg0LvjFR2gTdMQmKogjYLcjVmEzUYgCRBwDctjFRlwzUjMGLVkkdIcEY3fjPLQGUogjYHYEY1UTLhkGLogjcHIDRnslQhU2cVgEdvjFR1gDdKkic4sTSqQTTIkTUYMWQFIlcqwVXsUkZgoWRWQVN1M0TIEEURIUUVE1YAcjXuQSLYUDMFMFdqcDRqQiUXg1cVkkZvjFR2gjPHYWQrI1YvXUV5UEahkTTV8DZHcUVwTEahgFLTo0LIIDRoclUXQGMVkkbvjFR2IVZHYldVkUdMcEVsUkQUQSPWkENHIESn4hTgkWRV8DZpMDSn4hPgkWRV8DZ5IESnMyPO0zZDEURIUUVyUjQhY2ZrEVaMQ0X3k0UYYlZrElcUczXkAiUZQGLogjcyHDSn4hTZQWPWMld3TUXmc1UOgFQowjLyHDSn4BdgASTxb0bqwVX3fjPLQmKogjY2X0X5gSUgc1YW8DZDkFSxLiPLglK3IlaEYjXqASZHY2LBwDZtfmXz.iUgsVTsIFMvjFR1MiTMglKngEMAcEV40zUOglKogjYHYkV1giQgcVRW8DZtjFR0MyPOUmdTIEQqoFUqAiUXYWPWoEciYUTzEUahQCMC8TSqQTTIkTUYMWQFIlcqwVXsUkZgoWRWQlYTwVXmkjQgsVTV8DZDkFRl4xUXgWQVE1ZQcUV3sFQYgCRRgUZMECU5s1QgsVRBgTZmYEVzQiUYIGLogzchkFRlomUYkWSWgUaUYTUzDzUYgCRRwDZtHUX4kjUOgFQC4DZtHTX4kjUOgldRwDZyLzSMsFQQkTRUk0bEYjX1sFag0VSTMFdYcUVloFagYWUGMVYvXkVzASZHY2LBwDZtHkVzEzUioGNUE1Ymc0SnQTZLIyLBwDZtfWXvDkLWM2ZrEFNHIDSz4RZHY1MVMld3TUXmc1UOgFQowjLyHDSn4Bdh4VQFI1ZvjFR1MiPLglK3IFMvXUXqEUahQCLogjcyHUSn4BZXQSPWgUdMc0Sn4RZHYFRVokc3XTXmkzUOglKogTcyLzS0oGURQzZpQ0ZvXEV1EzUZQ2XVEEcQ0lXzPyPO0zZDEURIUUVyUjQhY2ZrEVaUoVX5kzUjYFUrE1YIYTXqEkUOgFQogjYtbEV3UjUgsVTWkEdqQTV3fDdhASSGM1YqwVXn4BdX4VQrEFcUYTX3fjTLICRBgzbUEiX4UTLYsVTUQlcUY0SnQTZHYldwHFZvjFRw.UZHYlcwHFZvjFRyQTZHkicSMURQQkTRUkUgcVPGI1azDSVCUUahESUFgzazXjXvDkLWM2ZrEFNHIDSz4RZHYlZrElcUczXkAiUXMCLogzcHkWSz4RZHY1MVMld3TUXuQiUOgFQosjcHIDR0U0QiUFLVg0LvjFR2gTdMQmKogjYLcjVmEzUYgCRBwDcpMkS14xPLYmKCwDMTkGSwH1PMkGRogjYLcEYyAiUYoWRWQFNHIDSzQUZHYFRVQlcEEiX4ASZHYGRBgDZqYjX0cmUXgGLogjcHg2R4XWdK0zZDEURIUUVyUjQhY2ZrEVaUoVX5kzUjkicSMURQQkTRUkUgcVPGI1azDSVEQiQig2ZGgzZzXEVncmUYoFLogzcHIDR1UDahcFLVkkdUwlXIEkUOglKUoUMucTU0QiUYglK3gkaEwVXzUkQggCRRwjLHIDRyUULhkWQwj0ZQUEY1UkUOgFQogjY5EiXnASZHcGVogjY1EiXnASZHMGQogTN1M0TIEEURIUUVE1YAcjXuQSLYMTUsIVLUYDRuQiQhASTxb0bqwVX3fjPLQmKogjYpwVX1U0QiUFLVg0LvjFR2gTdMQmKogjY2X0X5gSUg8FMV8DZtj1R1gjPHUWUGMVYvXEVy.SZHcGR40DctjFRlwzQZcVPWkENHIDSz4RZHYFSWQ1bvXUV5kzUjgCRBwDcTkFRlgjUjYWQwHVdvjFR1gjPHg1ZFIVc2YEV3ASZHYGR3sTN1k2RMsFQQkTRUk0bEYjX1sFag0VUpEldIcEY4X2TSkTTTIkTUYUXmEzQh8FMwjUQzXzX3s1QHsFMVgEZ2YUVpASZHcGRBgjcEwlXmAiUYoWUrIVRQY0Sn4hLgI2ZGIla3vVXzDTUXgWQVEFZtfGVtUDagQWUFEFNHIESxfjPHMWUwHVdEESVqEUUjYWUV8DZtjFRloWLhgFLogzbDkFRlYWLhgFLogzbDkFR4X2TSkTTTIkTUYUXmEzQh8FMwj0PU0lXwTkQH8FMFIFLQIyUysFaggCRBwDctjFRloFagYWUGMVYvXEVy.SZHcGR40DctjFRlciUioGNUE1azX0Sn4RZKYGRBgTcUczXkAiUXMCLogzcHkWSz4RZHYFSGo0YAcUV3fjPLQmKogjYLcEYyAiUYoWRWQFNHIDSzQUZHYFRVQlcEEiX4ASZHYGRBgDZqYjX0cmUXgGLogjcHg2R4XWdK0zZDEURIUUVyUjQhY2ZrEVaUoVX5kzUjkicSMURQQkTRUkUgcVPGI1azDSVEQiQig2ZGgzZzXEVncmUYoFLogzcHIDR1UDahcFLVkkdUwlXIEkUOglYVgEdvDSXzsVLXkWPUgEdEYUXn4BdX4VQrEFcUYTX3fjTLICRBgzbUEiX4UTLYsVTUQlcUY0SnQTZHYldwHFZvjFRxXVZHYlcwHFZvjFRyQTZHkicSMURQQkTRUkUgcVPGI1azDSVCUUahESUFgzazXjXvDkLWM2ZrEFNHIDSz4RZHYlZrElcUczXkAiUXMCLogzcHkWSz4RZHY1MVMld3TUXuQiUOglKosjcHIDR0U0QiUFLVg0LvjFR2gTdMQmKogjYLcjVmEzUYgCRBwDctjFRlwzUjMGLVkkdIcEY3fjPLQGUogjYHYEY1UTLhkGLogjcHIDRnslQhU2cVgEdvjFR1gDdKkic4sTSqQTTIkTUYMWQFIlcqwVXsUkZgoWRWQVN1M0TIEEURIUUVE1YAcjXuQSLYUDMFMFdqcDRqQiUXg1cVkkZvjFR2gjPHYWQrI1YvXUV5UEahkTTV8DZP0lXqASLgIGNFQ0YIcEVykjPHk1YVgEczXUVxASZHcGRBgzbUEiX4UTLYsVTUQlcUY0SnQTZHYldwHFZvjFRxnVZHYlcwHFZvjFRyQTZHkicSMURQQkTRUkUgcVPGI1azDSVCUUahESUFgzazXjXvDkLWM2ZrEFNHIDSz4RZHYlZrElcUczXkAiUXMCLogzcHkWSz4RZHY1MVMld3TUXuQiUOglKosjcHIDR0U0QiUFLVg0LvjFR2gTdMQmKogjYLcjVmEzUYgCRBwDctjFRlwzUjMGLVkkdIcEY3fjPLQGUogjYHYEY1UTLhkGLogjcHIDRnslQhU2cVgEdvjFR1gDdKkic4sTSqQTTIkTUYMWQFIlcqwVXsUkZgoWRWQVN1M0TIEEURIUUVE1YAcjXuQSLYUDMFMFdqcDRqQiUXg1cVkkZvjFR1gjPHYWQrI1YvXUV5UEahkTTV8DZXcUVxgSLX8VTWQFZtfGVtUDagQWUFEFNHIESxfjPHMWUwHVdEESVqEUUjYWUV8DZPkFRloWLhgFLogzbDkFRlYWLhgFLogzbDkFR4X2TSkTTTIkTUYUXmEzQh8FMwj0PU0lXwTkQH8FMFIFLQIyUysFaggCRBwDctjFRloFagYWUGMVYvXEVy.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.UQAslXuk0UXoWUFE0YQcEVtPDTtHzZGI1YMIiXtPDTtLjKPcjKt3hKt3hKt3haTU0PUQDU3sFaicVTWkEQEYzXmEDOujzPu0Fbu4VYtQmO77hUSQ0LPwVcmklaSQWXzUlO.."
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
                            "blob": "22384.VMjLgb1U...O+fWarAhckI2bo8la8HRLt.iHfTlai8FYo41Y8HRUTYTK3HxO9.BOVMEUy.Ea0cVZtMEcgQWY9vSRC8Vav8lak4Fc9DiM2.iLtXUSGM1UA4hKtXlKt3hKP4hKt3hKtvjdXQ2bD4hKDoVRFkjdP4VPt3hKHYGUoUULL4BS1IjKt3hKtPjKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKz3VUCkzTHkTPD4hK1k2Sy.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.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.iUgsVTsIFMvjFR1MiTMglKngEMAcEV40zUOglKogjYHYkV1giQgcVRW8DZtjFR0MyPOUmdTIEQqoFUqAiUXYWPWoEciYUTzEUahQCMC8TSqQTTIkTUYMWQFIlcqwVXsUkZgoWRWQlYTwVXmkjQgsVTV8DZDkFRl4xUXgWQVE1ZQcUV3sFQYgCRBMFdUYUX0cWLgMUPWk0ZQwFRlwjQZcFMrE1Z2Y0SnQTZHYldVkUdMcEVsUkQUQSPWkENHIESn4hTgkWRV8DZlMDSn4hPgkWRV8DZ5IESnMyPO0zZDEURIUUVyUjQhY2ZrEVaMQ0X3k0UYYlZrElcUczXkAiUZQGLogjcyHDSn4hTZQWPWMld3TUXmc1UOgFQowjLyHDSn4BdgASTxb0bqwVX3fjPLQmKogjY2X0X5gSUgc1YW8DZDkFSxLiPLglK3IlaEYjXqASZHY2LBwDZtfmXz.iUgsVTsIFMvjFR1MiTMglKngEMAcEV40zUOglKogjYHYkV1giQgcVRW8DZtjFR0MyPOUmdTIEQqoFUqAiUXYWPWoEciYUTzEUahQCMC8TSqQTTIkTUYMWQFIlcqwVXsUkZgoWRWQlYTwVXmkjQgsVTV8DZDkFRl4xUXgWQVE1ZQcUV3sFQYgCRRE1YqwVXVgiQgACLVkEZtfGVtUDagQWUFEFNHIESxfjPHMWUwHVdEESVqEUUjYWUV8DZDkFRloWLhgFLogjLHIDRx0TaXgCRRszcHg1S2nGURQzZpQ0ZvXEV1EzUZQ2Xw.ELI01XqEjTZQWPWMld3TUXuQiUOglKosjcHIDRuQiQhASTxb0bEYDY3fjTLgmXosjcHIDR0U0QiUFLVoEcvjFR1MiPLglK3EFLQIyUyUjQjgCRRwDdhk1R1gjPHk2YVgkcUY0Sn4RZKYGRBgTdqcUXyUkQig2ZW8DZtj1RvfjPHg1ZGI1YMIiX3fjPLglKng0aAISXxUDahgCRBwDZ2f1S2biTSkTTTIkTUYUXmEzQh8FMwjUQzXzX3sVaOcidTIEQqoFUqAiUXYWPWoEciYUTzEUahQSPRkEcEwFVxUkQYgCRRwDZtHjXmkzUXMWUFM1ZIckTpASZHYWQrEFT3XzXn4BdX4VQrEFcUYTX3fjTLICRBgzbUEiX4UTLYsVTUQlcUY0SnQTZHYldwHFZvjFR24RZHYlcwHFZvjFRyQTZHkicSMURQQkTRUkUgcVPGI1azDSVCUUahESUFgzazXjXvDkLWM2ZrEFNHIDSz4RZHYlZrElcUczXkAiUXMCLogzcHkWSz4RZHY1MVMld3TUXuQiUOglKosjcHIDR0U0QiUFLVg0LvjFR2gTdMQmKogjYLcjVmEzUYgCRBwDctjFRlwzUjMGLVkkdIcEY3fjPLQGUogjYHYEY1UTLhkGLogjcHIDRnslQhU2cVgEdvjFR1gDdKkic4sTSqQTTIkTUYMWQFIlcqwVXsUkZgoWRWQVN1M0TIEEURIUUVE1YAcjXuQSLYUDMFMFdqcDRqQiUXg1cVkkZvjFR2gjPHYWQrI1YvXUV5UEahkTTV8DZHcUVwTEahgFLTo0LIIDRoclUXQGMVkkbvjFR2IVZHYldVkUdMcEVsUkQUQSPWkENHIESn4hTgkWRV8DZpMDSn4hPgkWRV8DZ5IESnMyPO0zZDEURIUUVyUjQhY2ZrEVaMQ0X3k0UYYlZrElcUczXkAiUZQGLogjcyHDSn4hTZQWPWMld3TUXmc1UOgFQowjLyHDSn4BdgASTxb0bqwVX3fjPLQmKogjY2X0X5gSUgc1YW8DZDkFSxLiPLglK3IlaEYjXqASZHY2LBwDZtfmXz.iUgsVTsIFMvjFR1MiTMglKngEMAcEV40zUOglKogjYHYkV1giQgcVRW8DZtjFR0MyPOUmdTIEQqoFUqAiUXYWPWoEciYUTzEUahQCMC8TSqQTTIkTUYMWQFIlcqwVXsUkZgoWRWQlYTwVXmkjQgsVTV8DZDkFRl4xUXgWQVE1ZQcUV3sFQYgCRRgUZMECU5s1QgsVRBgTZmYEVzQiUYIGLogzchkFRlomUYkWSWgUaUYTUzDzUYgCRRwDZtHUX4kjUOgFQC4DZtHTX4kjUOgldRwDZyLzSMsFQQkTRUk0bEYjX1sFag0VSTMFdYcUVloFagYWUGMVYvXkVzASZHY2LBwDZtHkVzEzUioGNUE1Ymc0SnQTZLIyLBwDZtfWXvDkLWM2ZrEFNHIDSz4RZHY1MVMld3TUXmc1UOgFQowjLyHDSn4Bdh4VQFI1ZvjFR1MiPLglK3IFMvXUXqEUahQCLogjcyHUSn4BZXQSPWgUdMc0Sn4RZHYFRVokc3XTXmkzUOglKogTcyLzS0oGURQzZpQ0ZvXEV1EzUZQ2XVEEcQ0lXzPyPO0zZDEURIUUVyUjQhY2ZrEVaUoVX5kzUjYFUrE1YIYTXqEkUOgFQogjYtbEV3UjUgsVTWkEdqQTV3fDdhASSGM1YqwVXn4BdX4VQrEFcUYTX3fjTLICRBgzbUEiX4UTLYsVTUQlcUY0SnQTZHYldwHFZvjFRw.UZHYlcwHFZvjFRyQTZHkicSMURQQkTRUkUgcVPGI1azDSVCUUahESUFgzazXjXvDkLWM2ZrEFNHIDSz4RZHYlZrElcUczXkAiUXMCLogzcHkWSz4RZHY1MVMld3TUXuQiUOgFQosjcHIDR0U0QiUFLVg0LvjFR2gTdMQmKogjYLcjVmEzUYgCRBwDcpMkS14xPLYmKCwDMTkGSwH1PMkGRogjYLcEYyAiUYoWRWQFNHIDSzQUZHYFRVQlcEEiX4ASZHYGRBgDZqYjX0cmUXgGLogjcHg2R4XWdK0zZDEURIUUVyUjQhY2ZrEVaUoVX5kzUjkicSMURQQkTRUkUgcVPGI1azDSVEQiQig2ZGgzZzXEVncmUYoFLogzcHIDR1UDahcFLVkkdUwlXIEkUOglKUoUMucTU0QiUYglK3gkaEwVXzUkQggCRRwjLHIDRyUULhkWQwj0ZQUEY1UkUOgFQogjY5EiXnASZHcGVogjY1EiXnASZHMGQogTN1M0TIEEURIUUVE1YAcjXuQSLYMTUsIVLUYDRuQiQhASTxb0bqwVX3fjPLQmKogjYpwVX1U0QiUFLVg0LvjFR2gTdMQmKogjY2X0X5gSUg8FMV8DZtj1R1gjPHUWUGMVYvXEVy.SZHcGR40DctjFRlwzQZcVPWkENHIDSz4RZHYFSWQ1bvXUV5kzUjgCRBwDcTkFRlgjUjYWQwHVdvjFR1gjPHg1ZFIVc2YEV3ASZHYGR3sTN1k2RMsFQQkTRUk0bEYjX1sFag0VUpEldIcEY4X2TSkTTTIkTUYUXmEzQh8FMwjUQzXzX3s1QHsFMVgEZ2YUVpASZHcGRBgjcEwlXmAiUYoWUrIVRQY0Sn4hLgI2ZGIla3vVXzDTUXgWQVEFZtfGVtUDagQWUFEFNHIESxfjPHMWUwHVdEESVqEUUjYWUV8DZtjFRloWLhgFLogzbDkFRlYWLhgFLogzbDkFR4X2TSkTTTIkTUYUXmEzQh8FMwj0PU0lXwTkQH8FMFIFLQIyUysFaggCRBwDctjFRloFagYWUGMVYvXEVy.SZHcGR40DctjFRlciUioGNUE1azX0Sn4RZKYGRBgTcUczXkAiUXMCLogzcHkWSz4RZHYFSGo0YAcUV3fjPLQmKogjYLcEYyAiUYoWRWQFNHIDSzQUZHYFRVQlcEEiX4ASZHYGRBgDZqYjX0cmUXgGLogjcHg2R4XWdK0zZDEURIUUVyUjQhY2ZrEVaUoVX5kzUjkicSMURQQkTRUkUgcVPGI1azDSVEQiQig2ZGgzZzXEVncmUYoFLogzcHIDR1UDahcFLVkkdUwlXIEkUOglYVgEdvDSXzsVLXkWPUgEdEYUXn4BdX4VQrEFcUYTX3fjTLICRBgzbUEiX4UTLYsVTUQlcUY0SnQTZHYldwHFZvjFRxXVZHYlcwHFZvjFRyQTZHkicSMURQQkTRUkUgcVPGI1azDSVCUUahESUFgzazXjXvDkLWM2ZrEFNHIDSz4RZHYlZrElcUczXkAiUXMCLogzcHkWSz4RZHY1MVMld3TUXuQiUOglKosjcHIDR0U0QiUFLVg0LvjFR2gTdMQmKogjYLcjVmEzUYgCRBwDctjFRlwzUjMGLVkkdIcEY3fjPLQGUogjYHYEY1UTLhkGLogjcHIDRnslQhU2cVgEdvjFR1gDdKkic4sTSqQTTIkTUYMWQFIlcqwVXsUkZgoWRWQVN1M0TIEEURIUUVE1YAcjXuQSLYUDMFMFdqcDRqQiUXg1cVkkZvjFR2gjPHYWQrI1YvXUV5UEahkTTV8DZP0lXqASLgIGNFQ0YIcEVykjPHk1YVgEczXUVxASZHcGRBgzbUEiX4UTLYsVTUQlcUY0SnQTZHYldwHFZvjFRxnVZHYlcwHFZvjFRyQTZHkicSMURQQkTRUkUgcVPGI1azDSVCUUahESUFgzazXjXvDkLWM2ZrEFNHIDSz4RZHYlZrElcUczXkAiUXMCLogzcHkWSz4RZHY1MVMld3TUXuQiUOglKosjcHIDR0U0QiUFLVg0LvjFR2gTdMQmKogjYLcjVmEzUYgCRBwDctjFRlwzUjMGLVkkdIcEY3fjPLQGUogjYHYEY1UTLhkGLogjcHIDRnslQhU2cVgEdvjFR1gDdKkic4sTSqQTTIkTUYMWQFIlcqwVXsUkZgoWRWQVN1M0TIEEURIUUVE1YAcjXuQSLYUDMFMFdqcDRqQiUXg1cVkkZvjFR1gjPHYWQrI1YvXUV5UEahkTTV8DZXcUVxgSLX8VTWQFZtfGVtUDagQWUFEFNHIESxfjPHMWUwHVdEESVqEUUjYWUV8DZPkFRloWLhgFLogzbDkFRlYWLhgFLogzbDkFR4X2TSkTTTIkTUYUXmEzQh8FMwj0PU0lXwTkQH8FMFIFLQIyUysFaggCRBwDctjFRloFagYWUGMVYvXEVy.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.UQAslXuk0UXoWUFE0YQcEVtPDTtHzZGI1YMIiXtPDTtLjKPcjKt3hKt3hKt3haTU0PUQDU3sFaicVTWkEQEYzXmEDOujzPu0Fbu4VYtQmO77hUSQ0LPwVcmklaSQWXzUlO.."
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
                                        "blob": "22384.VMjLgb1U...O+fWarAhckI2bo8la8HRLt.iHfTlai8FYo41Y8HRUTYTK3HxO9.BOVMEUy.Ea0cVZtMEcgQWY9vSRC8Vav8lak4Fc9DiM2.iLtXUSGM1UA4hKtXlKt3hKP4hKt3hKtvjdXQ2bD4hKDoVRFkjdP4VPt3hKHYGUoUULL4BS1IjKt3hKtPjKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKz3VUCkzTHkTPD4hK1k2Sy.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.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.iUgsVTsIFMvjFR1MiTMglKngEMAcEV40zUOglKogjYHYkV1giQgcVRW8DZtjFR0MyPOUmdTIEQqoFUqAiUXYWPWoEciYUTzEUahQCMC8TSqQTTIkTUYMWQFIlcqwVXsUkZgoWRWQlYTwVXmkjQgsVTV8DZDkFRl4xUXgWQVE1ZQcUV3sFQYgCRBMFdUYUX0cWLgMUPWk0ZQwFRlwjQZcFMrE1Z2Y0SnQTZHYldVkUdMcEVsUkQUQSPWkENHIESn4hTgkWRV8DZlMDSn4hPgkWRV8DZ5IESnMyPO0zZDEURIUUVyUjQhY2ZrEVaMQ0X3k0UYYlZrElcUczXkAiUZQGLogjcyHDSn4hTZQWPWMld3TUXmc1UOgFQowjLyHDSn4BdgASTxb0bqwVX3fjPLQmKogjY2X0X5gSUgc1YW8DZDkFSxLiPLglK3IlaEYjXqASZHY2LBwDZtfmXz.iUgsVTsIFMvjFR1MiTMglKngEMAcEV40zUOglKogjYHYkV1giQgcVRW8DZtjFR0MyPOUmdTIEQqoFUqAiUXYWPWoEciYUTzEUahQCMC8TSqQTTIkTUYMWQFIlcqwVXsUkZgoWRWQlYTwVXmkjQgsVTV8DZDkFRl4xUXgWQVE1ZQcUV3sFQYgCRRE1YqwVXVgiQgACLVkEZtfGVtUDagQWUFEFNHIESxfjPHMWUwHVdEESVqEUUjYWUV8DZDkFRloWLhgFLogjLHIDRx0TaXgCRRszcHg1S2nGURQzZpQ0ZvXEV1EzUZQ2Xw.ELI01XqEjTZQWPWMld3TUXuQiUOglKosjcHIDRuQiQhASTxb0bEYDY3fjTLgmXosjcHIDR0U0QiUFLVoEcvjFR1MiPLglK3EFLQIyUyUjQjgCRRwDdhk1R1gjPHk2YVgkcUY0Sn4RZKYGRBgTdqcUXyUkQig2ZW8DZtj1RvfjPHg1ZGI1YMIiX3fjPLglKng0aAISXxUDahgCRBwDZ2f1S2biTSkTTTIkTUYUXmEzQh8FMwjUQzXzX3sVaOcidTIEQqoFUqAiUXYWPWoEciYUTzEUahQSPRkEcEwFVxUkQYgCRRwDZtHjXmkzUXMWUFM1ZIckTpASZHYWQrEFT3XzXn4BdX4VQrEFcUYTX3fjTLICRBgzbUEiX4UTLYsVTUQlcUY0SnQTZHYldwHFZvjFR24RZHYlcwHFZvjFRyQTZHkicSMURQQkTRUkUgcVPGI1azDSVCUUahESUFgzazXjXvDkLWM2ZrEFNHIDSz4RZHYlZrElcUczXkAiUXMCLogzcHkWSz4RZHY1MVMld3TUXuQiUOglKosjcHIDR0U0QiUFLVg0LvjFR2gTdMQmKogjYLcjVmEzUYgCRBwDctjFRlwzUjMGLVkkdIcEY3fjPLQGUogjYHYEY1UTLhkGLogjcHIDRnslQhU2cVgEdvjFR1gDdKkic4sTSqQTTIkTUYMWQFIlcqwVXsUkZgoWRWQVN1M0TIEEURIUUVE1YAcjXuQSLYUDMFMFdqcDRqQiUXg1cVkkZvjFR2gjPHYWQrI1YvXUV5UEahkTTV8DZHcUVwTEahgFLTo0LIIDRoclUXQGMVkkbvjFR2IVZHYldVkUdMcEVsUkQUQSPWkENHIESn4hTgkWRV8DZpMDSn4hPgkWRV8DZ5IESnMyPO0zZDEURIUUVyUjQhY2ZrEVaMQ0X3k0UYYlZrElcUczXkAiUZQGLogjcyHDSn4hTZQWPWMld3TUXmc1UOgFQowjLyHDSn4BdgASTxb0bqwVX3fjPLQmKogjY2X0X5gSUgc1YW8DZDkFSxLiPLglK3IlaEYjXqASZHY2LBwDZtfmXz.iUgsVTsIFMvjFR1MiTMglKngEMAcEV40zUOglKogjYHYkV1giQgcVRW8DZtjFR0MyPOUmdTIEQqoFUqAiUXYWPWoEciYUTzEUahQCMC8TSqQTTIkTUYMWQFIlcqwVXsUkZgoWRWQlYTwVXmkjQgsVTV8DZDkFRl4xUXgWQVE1ZQcUV3sFQYgCRRgUZMECU5s1QgsVRBgTZmYEVzQiUYIGLogzchkFRlomUYkWSWgUaUYTUzDzUYgCRRwDZtHUX4kjUOgFQC4DZtHTX4kjUOgldRwDZyLzSMsFQQkTRUk0bEYjX1sFag0VSTMFdYcUVloFagYWUGMVYvXkVzASZHY2LBwDZtHkVzEzUioGNUE1Ymc0SnQTZLIyLBwDZtfWXvDkLWM2ZrEFNHIDSz4RZHY1MVMld3TUXmc1UOgFQowjLyHDSn4Bdh4VQFI1ZvjFR1MiPLglK3IFMvXUXqEUahQCLogjcyHUSn4BZXQSPWgUdMc0Sn4RZHYFRVokc3XTXmkzUOglKogTcyLzS0oGURQzZpQ0ZvXEV1EzUZQ2XVEEcQ0lXzPyPO0zZDEURIUUVyUjQhY2ZrEVaUoVX5kzUjYFUrE1YIYTXqEkUOgFQogjYtbEV3UjUgsVTWkEdqQTV3fDdhASSGM1YqwVXn4BdX4VQrEFcUYTX3fjTLICRBgzbUEiX4UTLYsVTUQlcUY0SnQTZHYldwHFZvjFRw.UZHYlcwHFZvjFRyQTZHkicSMURQQkTRUkUgcVPGI1azDSVCUUahESUFgzazXjXvDkLWM2ZrEFNHIDSz4RZHYlZrElcUczXkAiUXMCLogzcHkWSz4RZHY1MVMld3TUXuQiUOgFQosjcHIDR0U0QiUFLVg0LvjFR2gTdMQmKogjYLcjVmEzUYgCRBwDcpMkS14xPLYmKCwDMTkGSwH1PMkGRogjYLcEYyAiUYoWRWQFNHIDSzQUZHYFRVQlcEEiX4ASZHYGRBgDZqYjX0cmUXgGLogjcHg2R4XWdK0zZDEURIUUVyUjQhY2ZrEVaUoVX5kzUjkicSMURQQkTRUkUgcVPGI1azDSVEQiQig2ZGgzZzXEVncmUYoFLogzcHIDR1UDahcFLVkkdUwlXIEkUOglKUoUMucTU0QiUYglK3gkaEwVXzUkQggCRRwjLHIDRyUULhkWQwj0ZQUEY1UkUOgFQogjY5EiXnASZHcGVogjY1EiXnASZHMGQogTN1M0TIEEURIUUVE1YAcjXuQSLYMTUsIVLUYDRuQiQhASTxb0bqwVX3fjPLQmKogjYpwVX1U0QiUFLVg0LvjFR2gTdMQmKogjY2X0X5gSUg8FMV8DZtj1R1gjPHUWUGMVYvXEVy.SZHcGR40DctjFRlwzQZcVPWkENHIDSz4RZHYFSWQ1bvXUV5kzUjgCRBwDcTkFRlgjUjYWQwHVdvjFR1gjPHg1ZFIVc2YEV3ASZHYGR3sTN1k2RMsFQQkTRUk0bEYjX1sFag0VUpEldIcEY4X2TSkTTTIkTUYUXmEzQh8FMwjUQzXzX3s1QHsFMVgEZ2YUVpASZHcGRBgjcEwlXmAiUYoWUrIVRQY0Sn4hLgI2ZGIla3vVXzDTUXgWQVEFZtfGVtUDagQWUFEFNHIESxfjPHMWUwHVdEESVqEUUjYWUV8DZtjFRloWLhgFLogzbDkFRlYWLhgFLogzbDkFR4X2TSkTTTIkTUYUXmEzQh8FMwj0PU0lXwTkQH8FMFIFLQIyUysFaggCRBwDctjFRloFagYWUGMVYvXEVy.SZHcGR40DctjFRlciUioGNUE1azX0Sn4RZKYGRBgTcUczXkAiUXMCLogzcHkWSz4RZHYFSGo0YAcUV3fjPLQmKogjYLcEYyAiUYoWRWQFNHIDSzQUZHYFRVQlcEEiX4ASZHYGRBgDZqYjX0cmUXgGLogjcHg2R4XWdK0zZDEURIUUVyUjQhY2ZrEVaUoVX5kzUjkicSMURQQkTRUkUgcVPGI1azDSVEQiQig2ZGgzZzXEVncmUYoFLogzcHIDR1UDahcFLVkkdUwlXIEkUOglYVgEdvDSXzsVLXkWPUgEdEYUXn4BdX4VQrEFcUYTX3fjTLICRBgzbUEiX4UTLYsVTUQlcUY0SnQTZHYldwHFZvjFRxXVZHYlcwHFZvjFRyQTZHkicSMURQQkTRUkUgcVPGI1azDSVCUUahESUFgzazXjXvDkLWM2ZrEFNHIDSz4RZHYlZrElcUczXkAiUXMCLogzcHkWSz4RZHY1MVMld3TUXuQiUOglKosjcHIDR0U0QiUFLVg0LvjFR2gTdMQmKogjYLcjVmEzUYgCRBwDctjFRlwzUjMGLVkkdIcEY3fjPLQGUogjYHYEY1UTLhkGLogjcHIDRnslQhU2cVgEdvjFR1gDdKkic4sTSqQTTIkTUYMWQFIlcqwVXsUkZgoWRWQVN1M0TIEEURIUUVE1YAcjXuQSLYUDMFMFdqcDRqQiUXg1cVkkZvjFR2gjPHYWQrI1YvXUV5UEahkTTV8DZP0lXqASLgIGNFQ0YIcEVykjPHk1YVgEczXUVxASZHcGRBgzbUEiX4UTLYsVTUQlcUY0SnQTZHYldwHFZvjFRxnVZHYlcwHFZvjFRyQTZHkicSMURQQkTRUkUgcVPGI1azDSVCUUahESUFgzazXjXvDkLWM2ZrEFNHIDSz4RZHYlZrElcUczXkAiUXMCLogzcHkWSz4RZHY1MVMld3TUXuQiUOglKosjcHIDR0U0QiUFLVg0LvjFR2gTdMQmKogjYLcjVmEzUYgCRBwDctjFRlwzUjMGLVkkdIcEY3fjPLQGUogjYHYEY1UTLhkGLogjcHIDRnslQhU2cVgEdvjFR1gDdKkic4sTSqQTTIkTUYMWQFIlcqwVXsUkZgoWRWQVN1M0TIEEURIUUVE1YAcjXuQSLYUDMFMFdqcDRqQiUXg1cVkkZvjFR1gjPHYWQrI1YvXUV5UEahkTTV8DZXcUVxgSLX8VTWQFZtfGVtUDagQWUFEFNHIESxfjPHMWUwHVdEESVqEUUjYWUV8DZPkFRloWLhgFLogzbDkFRlYWLhgFLogzbDkFR4X2TSkTTTIkTUYUXmEzQh8FMwj0PU0lXwTkQH8FMFIFLQIyUysFaggCRBwDctjFRloFagYWUGMVYvXEVy.SZHcGR40DctjFRlciUioGNUE1azX0SnQTZKYGRBgTcUczXkAiUXMCLogzcHkWSz4RZHYFSGo0YAcUV3fjPLQmKogjYLcEYyAiUYoWRWQFNHIDSzQUZHYFRVQlcEEiX4ASZHcGRBgDZqYjX0cmUXgGLogjcHg2R4XWdK0zZDEURIUUVyUjQhY2ZrEVaUoVX5kzUjkic4sTSqQTTIkTUYMWQFIlcqwVXsEUUXg1cVkUN1k2RyslQY8FLVgkcAckVzMFaOcidVoUZIISX5UUag8FMwjUN1MjXmkzUXMWSs8zMtTETRUDUSYlZFkENHIUXu0DahUWTUMFcqwVXskDLgUWTsgjYXcEVxU0UYgCRBwDctjFR0MyPOAUQpQUPvPDRuEkUOgldVoUZIISX5UUag8FMwjUYAkFRlg0UXIWUWkENHI0Rv3RZKYGR3sTN1MDUAkTUP0TPRokZvjFRysVLXgGNFMFLzXkVzMVLWcGRBgTLEYTXvTkUOgldR0jcyHDSncCZOciKUAkTEQ0TlolQYgCRRE1aMwlX0E0UiQ2ZrEVa3TES1gjPHESQFEFLUY0SnomTMY2LBwDZ2f1S23RUPIUQTMkYpYTV3fjTg8VSrIVcQc0XzsFag0FNUwzcHIDRwTjQgASUV8DZ5IUS1MiPLg1Mn8zMtTETRUDUSYlZFkENHIUXu0DahUWTWMFcqwVXsgyZLglKnM1Y2Y0XqASZHMGUCwDctjFR0MyPOAUQpQUPvPDRuEkUOgldVoUZIISX5UUag8FMwjUYMkFRlg0UXIWUWkENHI0Rv3RZKYGR3sTN1MDUAkTUP0TPRokZvjFRysVLXgGNFMFLzXkVzMVLWoGRBgTLEYTXvTkUOgldR0jcyHDSncCZOciKUAkTEQ0TlolQYgCRRE1aMwlX0E0UiQ2ZrEVa3TUSn4BZic1cVM1ZvjFRyQ0PLQmKogTcyLzSPUjZTEDLDgzaQY0SnomUZkVRxDldU0VXuQSLYUVVogjYXcEVxU0UYgCRRsDLtj1R1gDdKkicCQUPIUETMEjTZoFLogzbqECV3giQiACMVoEciEyUxfjPHESQFEFLUY0SnomTMY2LBwDZ2f1S23RUPIUQTMkYpYTV3fjTg8VSrIVcQc0XzsFag0FNE4DZtf1XmcmUisFLogzbTMDSz4RZHU2LC8DTEoFUAACQH8VTV8DZ5YkVokjLgoWUsE1azDSVksVZHYFVWgkbUcUV3fjTKAiKosjcHg2R4X2PTETRUAUSAIkVpASZHMWTxHldEYzXvzjLWYGRBgTLEYTXvTkUOglKosjcHg2R4X2PTETRUAUSAIkVpASZHMWTxHldEYzXvzjLWcGRBgTLEYTXvTkUOglKosjcHg2R4X2PTETRUAUSAIkVpASZHMWTxHldEYzXvzjLWcmKogjYXcEVxU0UYgCRBwDctjFR0MyPOAUQpQUPvPDRuEkUOgldFMVdQcEV5UkLhUVQSwDZtf1XmcmUisFLogjcyHDSncCZOciKUAkTEQ0TlolQYgCRREldMczXmE0UikGNqwDZtf1XmcmUisFLogjcyHDSncCZOciKUAkTEQ0TlolQYgCRREldMczXmE0UikGNvvDZtf1XmcmUisFLogjcyHDSncCZOciKUAkTEQ0TlolQYgCRREldMczXmE0UikGNE0DZtf1XmcmUisFLogjcyHDSncCZOciKUAkTEQ0TlolQYgCRREldMczXmE0UikGNU0DZtf1XmcmUisFLogjcyHDSncCZOciKUAkTEQ0TlolQYgCRREldMczXmE0UikGNq0DZtf1XmcmUisFLogjcyHDSncCZOciKUAkTEQ0TlolQYgCRREldMczXmE0UikGNvzDZtf1XmcmUisFLogjcyHDSncCZOciKUAkTEQ0TlolQYgCRREldMczXmE0UikGNE4DZtf1XmcmUisFLogjcyHDSncCZOciKUAkTEQ0TlolQYgCRREldMczXmE0UikGNU4DZtf1XmcmUisFLogjcyHDSncCZOciKUAkTEQ0TlolQYgCRBM1ZvXjXqkzUXMWRBgTLEYTXvTkUOglKosjcHg2R4XWdKYWQrI1YvDiX4X2PhgWUwH1ZQIiX4X2PhgWUwH1ZQcDR4cWLgoGMTM1bIYUV3ASZHcGRn8zMyDSX5UkQH8VTV8DZtjFRlwzQicVTWMVdvjFR1gjPHESQFEFLUY0SnomTMYGRBgDc3XzXqQCUXMWUV8DZLoFR0MyPOQGNFM1ZAIkVpASZHcGRBgTdQcEV5UkLhgCRBwDZtf1XmcmUisFLogzbTMDSn4BZgUWTWkkSEYUXqASZHMTSngTcyLzSzgiQisVPRokZvjFR3gjPHkWTWgkdUIiX3fjPLglKnM1Y2Y0XqASZHMGUCwDZtfVX0E0UY4TQVE1ZvjFRDkDdKkicoEVcQcUVlolQYgCR3wDZtfmX5UjQiASSW8DZtjFRlg0UXIWUWkENHI0Rv3RZHY1LwDldUw1TmAiUYgCRBEUZHg2R4XWZgUWTWkkYpYTV3fjPMglK3IldEYzXvzzUOglKogjYXcEVxU0UYgCRRsDLtjFRlMSLgoWUrM0YvXUV3fjTQg1Mn8zMyDSX5UkQH8VTV8DZTkFRlwzQicVTWMVdvjFR1gjPHESQFEFLUY0SnomTMYGRBgDc3XzXqQCUXMWUV8DZXoFR0MyPOQGNFM1ZAIkVpASZHECRBgTdQcEV5UkLhgCRBwDZtf1XmcmUisFLogzbTMDSn4BZgUWTWkkSEYUXqASZHYTSngTcyLzSzgiQisVPRokZvjFRxfjPHkWTWgkdUIiX3fjPLglKnM1Y2Y0XqASZHMGUCwDZtfVX0E0UY4TQVE1ZvjFRGkDdKkicoEVcQcUVlolQYgCRB4DZtfmX5UjQiASSW8DZtjFRlg0UXIWUWkENHI0Rv3RZHY1LwDldUw1TmAiUYgCR3EUZHg2R4XWZgUWTWkkYpYTV3fjTNglK3IldEYzXvzzUOglKogjYXcEVxU0UYgCRRsDLtjFRlMSLgoWUrM0YvXUV3fjTPg1Mn8zMyDSX5UkQH8VTV8DZDMDSn4BdhoWQFMFLMc0Sn4RZHYFVWgkbUcUV3fjTKAiKogjYyDSX5UEaScFLVkENHIETogDdKkicoEVcQcUVlolQYgCRRwzcHIDR4E0UXoWUxHFNHIDSn4BZic1cVM1ZvjFRyQ0PLglKnEVcQcUVNUjUgsFLogjPIg2R4XWdKYWRWkUdUYzX4X2PhgWUwH1ZQcDR4cWLgoGMTM1bIYUV3ASZHgGRn8zMyDSX5UkQH8VTV8DZtjFRlwzQicVTWMVdvjFR1gjPHESQFEFLUY0SnomTMYGRBgDc3XzXqQCUXMWUV8DZLoFR0MyPOQGNFM1ZAIkVpASZHcGRBgTdQcEV5UkLhgCRBwDZtf1XmcmUisFLogzbTMDSn4BZgUWTWkkSEYUXqASZHMTSngTcyLzSzgiQisVPRokZvjFR3gjPHkWTWgkdUIiX3fjPLglKnM1Y2Y0XqASZHMGUCwDZtfVX0E0UY4TQVE1ZvjFRDkDdKkicoEVcQcUVlolQYgCR3wDZtfmX5UjQiASSW8DZtjFRlg0UXIWUWkENHI0Rv3RZHY1LwDldUw1TmAiUYgCRBEUZHg2R4XWZgUWTWkkYpYTV3fjPMglK3IldEYzXvzzUOglKogjYXcEVxU0UYgCRRsDLtjFRlMSLgoWUrM0YvXUV3fjTQg1Mn8zMyDSX5UkQH8VTV8DZTkFRlwzQicVTWMVdvjFR1gjPHESQFEFLUY0SnomTMYGRBgDc3XzXqQCUXMWUV8DZXoFR0MyPOQGNFM1ZAIkVpASZHECRBgTdQcEV5UkLhgCRBwDZtf1XmcmUisFLogzbTMDSn4BZgUWTWkkSEYUXqASZHYTSngTcyLzSzgiQisVPRokZvjFRxfjPHkWTWgkdUIiX3fjPLglKnM1Y2Y0XqASZHMGUCwDZtfVX0E0UY4TQVE1ZvjFRGkDdKkicoEVcQcUVlolQYgCRB4DZtfmX5UjQiASSW8DZtjFRlg0UXIWUWkENHI0Rv3RZHY1LwDldUw1TmAiUYgCR3EUZHg2R4XWZgUWTWkkYpYTV3fjTNglK3IldEYzXvzzUOglKogjYXcEVxU0UYgCRRsDLtjFRlMSLgoWUrM0YvXUV3fjTPg1Mn8zMyDSX5UkQH8VTV8DZDMDSn4BdhoWQFMFLMc0Sn4RZHYFVWgkbUcUV3fjTKAiKogjYyDSX5UEaScFLVkENHIETogDdKkicoEVcQcUVlolQYgCRRwzcHIDR4E0UXoWUxHFNHIDSn4BZic1cVM1ZvjFRyQ0PLglKnEVcQcUVNUjUgsFLogjPIg2R4XWdKYWRWkUdUYzX4X2PhgWUwH1ZQcDR4cWLgoGMTM1bIYUV3ASZHkGRn8zMyDSX5UkQH8VTV8DZtjFRlwzQicVTWMVdvjFR1gjPHESQFEFLUY0SnomTMYGRBgDc3XzXqQCUXMWUV8DZLoFR0MyPOQGNFM1ZAIkVpASZHcGRBgTdQcEV5UkLhgCRBwDZtf1XmcmUisFLogzbTMDSn4BZgUWTWkkSEYUXqASZHMTSngTcyLzSzgiQisVPRokZvjFR3gjPHkWTWgkdUIiX3fjPLglKnM1Y2Y0XqASZHMGUCwDZtfVX0E0UY4TQVE1ZvjFRDkDdKkicoEVcQcUVlolQYgCR3wDZtfmX5UjQiASSW8DZtjFRlg0UXIWUWkENHI0Rv3RZHY1LwDldUw1TmAiUYgCRBEUZHg2R4XWZgUWTWkkYpYTV3fjPMglK3IldEYzXvzzUOglKogjYXcEVxU0UYgCRRsDLtjFRlMSLgoWUrM0YvXUV3fjTQg1Mn8zMyDSX5UkQH8VTV8DZTkFRlwzQicVTWMVdvjFR1gjPHESQFEFLUY0SnomTMYGRBgDc3XzXqQCUXMWUV8DZXoFR0MyPOQGNFM1ZAIkVpASZHECRBgTdQcEV5UkLhgCRBwDZtf1XmcmUisFLogzbTMDSn4BZgUWTWkkSEYUXqASZHYTSngTcyLzSzgiQisVPRokZvjFRxfjPHkWTWgkdUIiX3fjPLglKnM1Y2Y0XqASZHMGUCwDZtfVX0E0UY4TQVE1ZvjFRGkDdKkicoEVcQcUVlolQYgCRB4DZtfmX5UjQiASSW8DZtjFRlg0UXIWUWkENHI0Rv3RZHY1LwDldUw1TmAiUYgCR3EUZHg2R4XWZgUWTWkkYpYTV3fjTNglK3IldEYzXvzzUOglKogjYXcEVxU0UYgCRRsDLtjFRlMSLgoWUrM0YvXUV3fjTPg1Mn8zMyDSX5UkQH8VTV8DZDMDSn4BdhoWQFMFLMc0Sn4RZHYFVWgkbUcUV3fjTKAiKogjYyDSX5UEaScFLVkENHIETogDdKkicoEVcQcUVlolQYgCRRwzcHIDR4E0UXoWUxHFNHIDSn4BZic1cVM1ZvjFRyQ0PLglKnEVcQcUVNUjUgsFLogjPIg2R4XWdKYWRWkUdUYzX4X2PhgWUwH1ZQcDR4cWLgoGMTM1bIYUV3ASZHoGRn8zMyDSX5UkQH8VTV8DZtjFRlwzQicVTWMVdvjFR1gjPHESQFEFLUY0SnomTMYGRBgDc3XzXqQCUXMWUV8DZLoFR0MyPOQGNFM1ZAIkVpASZHcGRBgTdQcEV5UkLhgCRBwDZtf1XmcmUisFLogzbTMDSn4BZgUWTWkkSEYUXqASZHMTSngTcyLzSzgiQisVPRokZvjFR3gjPHkWTWgkdUIiX3fjPLglKnM1Y2Y0XqASZHMGUCwDZtfVX0E0UY4TQVE1ZvjFRDkDdKkicoEVcQcUVlolQYgCR3wDZtfmX5UjQiASSW8DZtjFRlg0UXIWUWkENHI0Rv3RZHY1LwDldUw1TmAiUYgCRBEUZHg2R4XWZgUWTWkkYpYTV3fjPMglK3IldEYzXvzzUOglKogjYXcEVxU0UYgCRRsDLtjFRlMSLgoWUrM0YvXUV3fjTQg1Mn8zMyDSX5UkQH8VTV8DZTkFRlwzQicVTWMVdvjFR1gjPHESQFEFLUY0SnomTMYGRBgDc3XzXqQCUXMWUV8DZXoFR0MyPOQGNFM1ZAIkVpASZHECRBgTdQcEV5UkLhgCRBwDZtf1XmcmUisFLogzbTMDSn4BZgUWTWkkSEYUXqASZHYTSngTcyLzSzgiQisVPRokZvjFRxfjPHkWTWgkdUIiX3fjPLglKnM1Y2Y0XqASZHMGUCwDZtfVX0E0UY4TQVE1ZvjFRGkDdKkicoEVcQcUVlolQYgCRB4DZtfmX5UjQiASSW8DZtjFRlg0UXIWUWkENHI0Rv3RZHY1LwDldUw1TmAiUYgCR3EUZHg2R4XWZgUWTWkkYpYTV3fjTNglK3IldEYzXvzzUOglKogjYXcEVxU0UYgCRRsDLtjFRlMSLgoWUrM0YvXUV3fjTPg1Mn8zMyDSX5UkQH8VTV8DZDMDSn4BdhoWQFMFLMc0Sn4RZHYFVWgkbUcUV3fjTKAiKogjYyDSX5UEaScFLVkENHIETogDdKkicoEVcQcUVlolQYgCRRwzcHIDR4E0UXoWUxHFNHIDSn4BZic1cVM1ZvjFRyQ0PLglKnEVcQcUVNUjUgsFLogjPIg2R4XWdKYWRWkUdUYzX4X2PhgWUwH1ZQcDR4cWLgoGMTM1bIYUV3ASZHACRn8zMyDSX5UkQH8VTV8DZtjFRlwzQicVTWMVdvjFR1gjPHESQFEFLUY0SnomTMYGRBgDc3XzXqQCUXMWUV8DZLoFR0MyPOQGNFM1ZAIkVpASZHcGRBgTdQcEV5UkLhgCRBwDZtf1XmcmUisFLogzbTMDSn4BZgUWTWkkSEYUXqASZHMTSngTcyLzSzgiQisVPRokZvjFR3gjPHkWTWgkdUIiX3fjPLglKnM1Y2Y0XqASZHMGUCwDZtfVX0E0UY4TQVE1ZvjFRDkDdKkicoEVcQcUVlolQYgCR3wDZtfmX5UjQiASSW8DZtjFRlg0UXIWUWkENHI0Rv3RZHY1LwDldUw1TmAiUYgCRBEUZHg2R4XWZgUWTWkkYpYTV3fjPMglK3IldEYzXvzzUOglKogjYXcEVxU0UYgCRRsDLtjFRlMSLgoWUrM0YvXUV3fjTQg1Mn8zMyDSX5UkQH8VTV8DZTkFRlwzQicVTWMVdvjFR1gjPHESQFEFLUY0SnomTMYGRBgDc3XzXqQCUXMWUV8DZXoFR0MyPOQGNFM1ZAIkVpASZHECRBgTdQcEV5UkLhgCRBwDZtf1XmcmUisFLogzbTMDSn4BZgUWTWkkSEYUXqASZHYTSngTcyLzSzgiQisVPRokZvjFRxfjPHkWTWgkdUIiX3fjPLglKnM1Y2Y0XqASZHMGUCwDZtfVX0E0UY4TQVE1ZvjFRGkDdKkicoEVcQcUVlolQYgCRB4DZtfmX5UjQiASSW8DZtjFRlg0UXIWUWkENHI0Rv3RZHY1LwDldUw1TmAiUYgCR3EUZHg2R4XWZgUWTWkkYpYTV3fjTNglK3IldEYzXvzzUOglKogjYXcEVxU0UYgCRRsDLtjFRlMSLgoWUrM0YvXUV3fjTPg1Mn8zMyDSX5UkQH8VTV8DZDMDSn4BdhoWQFMFLMc0Sn4RZHYFVWgkbUcUV3fjTKAiKogjYyDSX5UEaScFLVkENHIETogDdKkicoEVcQcUVlolQYgCRRwzcHIDR4E0UXoWUxHFNHIDSn4BZic1cVM1ZvjFRyQ0PLglKnEVcQcUVNUjUgsFLogjPIg2R4XWdKYWRWkUdUYzX4X2PhgWUwH1ZQcDR4cWLgoGMTM1bIYUV3ASZHECRn8zMyDSX5UkQH8VTV8DZtjFRlwzQicVTWMVdvjFR1gjPHESQFEFLUY0SnomTMYGRBgDc3XzXqQCUXMWUV8DZLoFR0MyPOQGNFM1ZAIkVpASZHcGRBgTdQcEV5UkLhgCRBwDZtf1XmcmUisFLogzbTMDSn4BZgUWTWkkSEYUXqASZHMTSngTcyLzSzgiQisVPRokZvjFR3gjPHkWTWgkdUIiX3fjPLglKnM1Y2Y0XqASZHMGUCwDZtfVX0E0UY4TQVE1ZvjFRDkDdKkicoEVcQcUVlolQYgCR3wDZtfmX5UjQiASSW8DZtjFRlg0UXIWUWkENHI0Rv3RZHY1LwDldUw1TmAiUYgCRBEUZHg2R4XWZgUWTWkkYpYTV3fjPMglK3IldEYzXvzzUOglKogjYXcEVxU0UYgCRRsDLtjFRlMSLgoWUrM0YvXUV3fjTQg1Mn8zMyDSX5UkQH8VTV8DZTkFRlwzQicVTWMVdvjFR1gjPHESQFEFLUY0SnomTMYGRBgDc3XzXqQCUXMWUV8DZXoFR0MyPOQGNFM1ZAIkVpASZHECRBgTdQcEV5UkLhgCRBwDZtf1XmcmUisFLogzbTMDSn4BZgUWTWkkSEYUXqASZHYTSngTcyLzSzgiQisVPRokZvjFRxfjPHkWTWgkdUIiX3fjPLglKnM1Y2Y0XqASZHMGUCwDZtfVX0E0UY4TQVE1ZvjFRGkDdKkicoEVcQcUVlolQYgCRB4DZtfmX5UjQiASSW8DZtjFRlg0UXIWUWkENHI0Rv3RZHY1LwDldUw1TmAiUYgCR3EUZHg2R4XWZgUWTWkkYpYTV3fjTNglK3IldEYzXvzzUOglKogjYXcEVxU0UYgCRRsDLtjFRlMSLgoWUrM0YvXUV3fjTPg1Mn8zMyDSX5UkQH8VTV8DZDMDSn4BdhoWQFMFLMc0Sn4RZHYFVWgkbUcUV3fjTKAiKogjYyDSX5UEaScFLVkENHIETogDdKkicoEVcQcUVlolQYgCRRwzcHIDR4E0UXoWUxHFNHIDSn4BZic1cVM1ZvjFRyQ0PLglKnEVcQcUVNUjUgsFLogjPIg2R4XWdKYWRWkUdUYzX4X2PhgWUwH1ZQcDR4cWLgoGMTM1bIYUV3ASZHICRn8zMyDSX5UkQH8VTV8DZtjFRlwzQicVTWMVdvjFR1gjPHESQFEFLUY0SnomTMYGRBgDc3XzXqQCUXMWUV8DZLoFR0MyPOQGNFM1ZAIkVpASZHcGRBgTdQcEV5UkLhgCRBwDZtf1XmcmUisFLogzbTMDSn4BZgUWTWkkSEYUXqASZHMTSngTcyLzSzgiQisVPRokZvjFR3gjPHkWTWgkdUIiX3fjPLglKnM1Y2Y0XqASZHMGUCwDZtfVX0E0UY4TQVE1ZvjFRDkDdKkicoEVcQcUVlolQYgCR3wDZtfmX5UjQiASSW8DZtjFRlg0UXIWUWkENHI0Rv3RZHY1LwDldUw1TmAiUYgCRBEUZHg2R4XWZgUWTWkkYpYTV3fjPMglK3IldEYzXvzzUOglKogjYXcEVxU0UYgCRRsDLtjFRlMSLgoWUrM0YvXUV3fjTQg1Mn8zMyDSX5UkQH8VTV8DZTkFRlwzQicVTWMVdvjFR1gjPHESQFEFLUY0SnomTMYGRBgDc3XzXqQCUXMWUV8DZXoFR0MyPOQGNFM1ZAIkVpASZHECRBgTdQcEV5UkLhgCRBwDZtf1XmcmUisFLogzbTMDSn4BZgUWTWkkSEYUXqASZHYTSngTcyLzSzgiQisVPRokZvjFRxfjPHkWTWgkdUIiX3fjPLglKnM1Y2Y0XqASZHMGUCwDZtfVX0E0UY4TQVE1ZvjFRGkDdKkicoEVcQcUVlolQYgCRB4DZtfmX5UjQiASSW8DZtjFRlg0UXIWUWkENHI0Rv3RZHY1LwDldUw1TmAiUYgCR3EUZHg2R4XWZgUWTWkkYpYTV3fjTNglK3IldEYzXvzzUOglKogjYXcEVxU0UYgCRRsDLtjFRlMSLgoWUrM0YvXUV3fjTPg1Mn8zMyDSX5UkQH8VTV8DZDMDSn4BdhoWQFMFLMc0Sn4RZHYFVWgkbUcUV3fjTKAiKogjYyDSX5UEaScFLVkENHIETogDdKkicoEVcQcUVlolQYgCRRwzcHIDR4E0UXoWUxHFNHIDSn4BZic1cVM1ZvjFRyQ0PLglKnEVcQcUVNUjUgsFLogjPIg2R4XWdKYWRWkUdUYzX4XWdKYWRWkUdUYzX4QyPOUmdVoUZIISX5UUag8FMwjUN1klX0giUgk2ZVEFL2YEV5gCahkicCI1YIcEVy0TaOciKUAkTEQ0TlolQYgCRnIVc3XUXEQiUXg1cVkkZIIDRwTjQgASUV8DZDk1R1gDdKkic4sjcEwlXmASLhkicoQUc3XUX4ACUXQWQwj0ZI01S2fDLgUGLwHVN1kFU0giUgYlZFkENHgmX5U0QY8FNVAUYIISX0ACaHY1LVg0bUY0SnwTQiASTVoUc3TETn4hTikWUrIFNHIDSn4hTYo1ZFM1YIYTXqASZHcGRBgzYMYzXuk0UYgCRRwDZyLzSPUDahcFLVkkdUwlX4QyPOAUQrI1YvXUV5UEahYlKWgEdEYUXqE0UYg2ZDkENHglX0giUgM0ZrQ1ZM0FRlg0UXIWUWkENHgFSz4RZHU2LC8DTEwlXmAiUYoWUrIlYtbEV3UjUgsVTWkEdqQTV3fDZhUGNVEVPIEiX0kzQho2ZwDFcvPEV5UEah8VQFEVdIIDRwTjQgASUV8DZDk1R1gDdKkicCQ0YIcEVyUkQisVRGgjcEwlXmAiUYoWUrIVRQY0SngjLgUGLFM0aMczXqQiUYgWPvDVdqYzXugCagglKnM1Y2Y0XqASZHAyLBwDZ2f1S23RUXgWQVE1ZQcUV3EjPhcVRWg0bUYzXqkzURoFLogDd3DSXy0DLgASRxf0ZQQUVxUjUj0DNFk0ZIIDRwTjQgASUV8DZtj1R1gDdKkicCQ0YIcEVyUkQisVRGgjcEwlXmAiUYoWUrIVRQY0SngjLgUGLVMUcQY0XxUjQi8FNrE1SzDyTrkEaHYFVWgkbUcUV3fjTLQmKogTcyLzSPUDahcFLVkkdUwlXl4xUXgWQVE1ZQcUV3sFQYgCRnIVc3XUXDsVLhoWQrEVZUwFTqEkLisVUrEVSqECV4kjPHESQFEFLUY0SnQTdMQmKogTcyLzS04RUXgWQVE1ZQcUV30TaOcyMnQUc3XUX4XWZTUGNVElYpYTV3fDdhoWUGk0a3vFTkkjLgUGLrgjYyXEVyUkUOgFSEMFLQYkV0gyZPglKRMVdUwlX3fjPLglKRkkZqYzXmkjQgsFLogzcHIDRm0jQi8VVWkENHIDSnMyPOAUQrI1YvXUV5UEahkGMC8DTEwlXmAiUYoWUrIlYtbEV3UjUgsVTWkEdqQTV3fDZhUGNVE1TqwFYq0TaHYFVWgkbUcUV3fDdLQmKogTcyLzSPUDahcFLVkkdUwlXl4xUXgWQVE1ZQcUV3sFQYgCRnIVc3XUXAkTLhUWRGIldqESXzACUXoWUrI1aEYTX4kjPHESQFEFLUY0SnQTZKYGR3sTN1MDUmkzUXMWUFM1ZIcDR1UDahcFLVkkdUwlXIEkUOgFRxDVcvXzTu0zQisFMVkEdAASX4slQi8FNrEFZtf1XmcmUisFLogTdyHUSzn1TNQiZS4jcPkVS4gzTMEiYogTcyLzSPUDahcFLVkkdUwlXl4xUXgWQVE1ZQcUV3sFQYgCRnIVc3XUXSgiUigWSVkEQUYTXms1USUWTVkEZtf1XmcmUisFLogjcyHDSncCZOciKUgEdEYUXqE0UYgWPBI1YIcEVyUkQisVRWIkZvjFR3gSLgMGL5ElZUcTXmE0UZUGMwLEc3nVVrkjPHESQFEFLUY0SnQTZKYGR3sTN1MDUmkzUXMWUFM1ZIcDR1UDahcFLVkkdUwlXIEkUOgFRxDVcvXTTu0zQicFMwf0ZIQUV5M1UYsFMVM0aMEiXn4BZic1cVM1ZvjFR2IVZKYGR3sTN1k2RPUDahcFLVkkdUwlX4QyPOUGRvDVcvv1S2fDLgUGLFgzaQY0SnwzQiASTVoUcMo2U3gSLgMWRBgDcEYUXqASZHMUTWMlZqESXk0jZHYFUxH1ZIc0Sn4RZHYFUFk0aQcEVncmUYgCRRwDZtHEVoE0UZESUV8DZtjFR4X2PTcVRWg0bUYzXqkjLhkicCQ0YIcEVyUkQisVRGgjcEwlXmAiUYoWUrIVRQY0SngjLgUGLwP0aucUV4kjPHESQFEFLUY0SnAUZKYGR3sTN1MDUmkzUXMWUFM1ZIcDR1UDahcFLVkkdUwlXIEkUOgFRxDVcvXETn0jLggWPGM1a3vVXMUjQisVRWo0Y2EiXn4BZic1cVM1ZvjFR3MiPLg1Mn8zMtTEV3UjUgsVTWkEdAIjXmkzUXMWUFM1ZIckTpASZHgGNwD1b2QkV4E0UYQWUrIFT3DiXuE0UZUGMrgjYXcEVxU0UYgCR30DctjFR0MyPOAUQrI1YvXUV5UEahYlKWgEdEYUXqE0UYg2ZDkENHglX0giUgMENVMFdMYUVDUkQgc1ZWMUcQYUVn4BZic1cVM1ZvjFR1MiPLg1Mn8zMtTEV3UjUgsVTWkEdAIjXmkzUXMWUFM1ZIckTpASZHgGNwD1bvnWXpU0QgcVTWoUczDyTzgiZYwVRBgTLEYTXvTkUOgFQosjcHg2R4X2PTcVRWg0bUYzXqkzQHYWQrI1YvXUV5UEahkTTV8DZHISX0AiQQ8VSGM1YzDCVqkDUYo2XWk0ZzX0Tu0TLhglKnM1Y2Y0XqASZHcmXosjcHg2R4XWdKAUQrI1YvXUV5UEahkGMC8TcHASX0ACaOcCRvDVcvXDRuEkUOgFSFEVcMcUVMsVLXUVRxDVcvvFRlMiUXMWUV8DZLQTX00zUYUFLToUZ3rFU0giUgglKRMVdUwlX3fjPLglKRkkZqYzXmkjQgsFLogjcHIDRm0jQi8VVWkENHIDSnMyPOAUQrI1YvXUV5UEahkGMC8DTEwlXmAiUYoWUrIlYtbEV3UjUgsVTWkEdqQTV3fDZhUGNVE1TqwFYq0TaHYFVWgkbUcUV3fjPLQmKogTcyLzSPUDahcFLVkkdUwlXl4xUXgWQVE1ZQcUV3sFQYgCRnIVc3XUXAkTLhUWRGIldqESXzACUXoWUrI1aEYTX4kjPHESQFEFLUY0Sn4RZKYGR3sTN1MDUmkzUXMWUFM1ZIcDR1UDahcFLVkkdUwlXIEkUOgFRxDVcvXzTu0zQisFMVkEdAASX4slQi8FNrEFZtf1XmcmUisFLogTdyHDSncCZOciKUgEdEYUXqE0UYgWPBI1YIcEVyUkQisVRWIkZvjFR3gSLgMWSvDFLIICVqEEUYIWQVQVS3XTVqkjPHESQFEFLUY0Sn4RZKYGR3sTN1MDUmkzUXMWUFM1ZIcDR1UDahcFLVkkdUwlXIEkUOgFRxDVcvX0T0EkUiIWQFM1a3vVXOQSLSwVVrgjYXcEVxU0UYgCRBwDctjFR0MyPOAUQrI1YvXUV5UEahYlKWgEdEYUXqE0UYg2ZDkENHglX0giUgQzZwHldEwVXoUEaPsVTxL1ZUwVXMsVLXkWRBgTLEYTXvTkUOgFQ40DctjFR0MyPOUmKUgEdEYUXqE0UYgWSs8zM2fFU0giUgkic4sjT3DSXy0TaOcyMnQUc3XUX4ACUXQWQwj0ZI01S2bCZhUGNVEVdqYUXvbmUXoGNrIVN1MjX00zUZo2ZwDFcqwVXsQyPOYWQrI1YvDiX4X2PTETRUAUSAIkVpASZHgGNwD1bMASXvjjLXsVQpEVa2YUVn4BZic1cVM1ZvjFRz3RZKYGR3sTN1MDUAkTUP0TPRokZvjFR3gSLgMWSvDFLIICVqEEUZkWTWgEcMYUVn4BZic1cVM1ZvjFR4MiPLg1Mn8zM2HjXmkzUXMWSs8zM2HjX00zUZo2ZwDFcqwVXsQyPOUmKsIVciwlXmACaOcCSxDFLIICVqsFagwFNFgzbEwVXvjkUXkVTWMFdUwlX3fjTPASTVoUc3T0T0EkUYI2ZrEVaIIDRyUjUZQWTUk0LQc0SnwDUYI2cwDFZtHzX0EzQUs1YGMFNHIDY2gjPHgFNFMld3XUXTUkQjoGLogTRznGUTkzZKcGRBgTZ3XTX0UUahgCRnkEaUECVmEEaLgVRBgTZ3XUX1gCagsFMFM1TqwFYqASZHYGRBgTdUECV5sVLgQGL5ElZUY0Sn4RZHU2LC8TcLIyXmACaO4hKt3hKt3hKt3hKtnTUv.UQAslXuk0UXoWUFE0YQcEVtPDTtHzZGI1YMIiXtPDTtLjKPcjKt3hKt3hKt3haTU0PUQDU3sFaicVTWkEQEYzXmEDOujzPu0Fbu4VYtQmO77hUSQ0LPwVcmklaSQWXzUlO.."
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
                    "id": "obj-25",
                    "maxclass": "message",
                    "numinlets": 2,
                    "numoutlets": 1,
                    "outlettype": [ "" ],
                    "patching_rect": [ 297.0, 172.0, 79.0, 22.0 ],
                    "text": "max_active 1"
                }
            },
            {
                "box": {
                    "id": "obj-8",
                    "maxclass": "newobj",
                    "numinlets": 2,
                    "numoutlets": 0,
                    "patching_rect": [ 106.0, 641.0, 35.0, 22.0 ],
                    "text": "dac~"
                }
            },
            {
                "box": {
                    "id": "obj-7",
                    "maxclass": "ezdac~",
                    "numinlets": 2,
                    "numoutlets": 0,
                    "patching_rect": [ 54.0, 37.0, 48.0, 48.0 ]
                }
            },
            {
                "box": {
                    "id": "obj-4",
                    "maxclass": "newobj",
                    "numinlets": 1,
                    "numoutlets": 1,
                    "outlettype": [ "bang" ],
                    "patching_rect": [ 297.0, 125.0, 58.0, 22.0 ],
                    "text": "loadbang"
                }
            },
            {
                "box": {
                    "id": "obj-56",
                    "maxclass": "newobj",
                    "numinlets": 1,
                    "numoutlets": 1,
                    "outlettype": [ "signal" ],
                    "patching_rect": [ 135.0, 340.0, 241.0, 22.0 ],
                    "text": "abl.dsp.compander~ @mode 1 @shape 0.2"
                }
            },
            {
                "box": {
                    "id": "obj-59",
                    "maxclass": "newobj",
                    "numinlets": 1,
                    "numoutlets": 1,
                    "outlettype": [ "signal" ],
                    "patching_rect": [ 106.0, 364.0, 241.0, 22.0 ],
                    "text": "abl.dsp.compander~ @mode 1 @shape 0.2"
                }
            },
            {
                "box": {
                    "id": "obj-46",
                    "maxclass": "live.scope~",
                    "numinlets": 2,
                    "numoutlets": 1,
                    "outlettype": [ "bang" ],
                    "patching_rect": [ 321.0, 391.0, 184.98193097114563, 69.0 ]
                }
            },
            {
                "box": {
                    "id": "obj-52",
                    "maxclass": "newobj",
                    "numinlets": 3,
                    "numoutlets": 3,
                    "outlettype": [ "signal", "signal", "signal" ],
                    "patching_rect": [ 106.0, 465.0, 400.0, 22.0 ],
                    "text": "abl.device.limiter~ @maximize 1 @threshold -6. @mode 1 @lookahead 6"
                }
            },
            {
                "box": {
                    "id": "obj-40",
                    "maxclass": "newobj",
                    "numinlets": 5,
                    "numoutlets": 2,
                    "outlettype": [ "signal", "signal" ],
                    "patching_rect": [ 106.0, 308.0, 315.0, 22.0 ],
                    "text": "abl.device.drumbuss~ 1. 0. 1. @boomfreq 64.7 @mix 0.5"
                }
            },
            {
                "box": {
                    "id": "obj-31",
                    "maxclass": "newobj",
                    "numinlets": 1,
                    "numoutlets": 1,
                    "outlettype": [ "signal" ],
                    "patching_rect": [ 120.42857142857144, 256.0, 192.0, 22.0 ],
                    "text": "abl.dsp.compander~ @shape 0.15"
                }
            },
            {
                "box": {
                    "id": "obj-30",
                    "maxclass": "newobj",
                    "numinlets": 1,
                    "numoutlets": 1,
                    "outlettype": [ "signal" ],
                    "patching_rect": [ 106.0, 280.0, 192.0, 22.0 ],
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
                    "patching_rect": [ 1180.0, 1584.0, 472.0, 269.0 ],
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
                    "patching_rect": [ 274.0, 171.0, 24.0, 24.0 ]
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
                    "patching_rect": [ 223.0, 93.0, 24.0, 24.0 ]
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
                    "patching_rect": [ 106.0, 37.0, 48.0, 48.0 ]
                }
            },
            {
                "box": {
                    "id": "obj-10",
                    "maxclass": "newobj",
                    "numinlets": 2,
                    "numoutlets": 1,
                    "outlettype": [ "" ],
                    "patching_rect": [ 106.0, 125.0, 32.0, 22.0 ],
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
                    "patching_rect": [ 106.0, 503.0, 48.0, 136.0 ],
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
                    "filename": "xk_swam.js",
                    "id": "obj-2",
                    "maxclass": "newobj",
                    "numinlets": 1,
                    "numoutlets": 3,
                    "outlettype": [ "", "", "" ],
                    "patching_rect": [ 106.0, 171.0, 167.0, 22.0 ],
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
                    "patching_rect": [ 118.0, 93.0, 104.0, 22.0 ],
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
                    "destination": [ "obj-30", 0 ],
                    "source": [ "obj-13", 0 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-31", 0 ],
                    "source": [ "obj-13", 1 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-3", 0 ],
                    "source": [ "obj-16", 0 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-3", 0 ],
                    "midpoints": [ 1160.5, 265.17967462539673, 1212.6523041725159, 265.17967462539673, 1212.6523041725159, 221.49998712539673, 995.5, 221.49998712539673 ],
                    "source": [ "obj-17", 1 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-5", 0 ],
                    "midpoints": [ 1193.5, 263.42576837539673, 1056.5, 263.42576837539673 ],
                    "source": [ "obj-17", 2 ]
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
                    "destination": [ "obj-2", 0 ],
                    "source": [ "obj-25", 0 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-3", 0 ],
                    "source": [ "obj-28", 0 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-17", 0 ],
                    "midpoints": [ 1079.5, 262.83201837539673, 1106.4999604225159, 262.83201837539673, 1106.4999604225159, 232.49998712539673, 1127.5, 232.49998712539673 ],
                    "source": [ "obj-3", 2 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-33", 0 ],
                    "source": [ "obj-3", 0 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-48", 0 ],
                    "source": [ "obj-3", 1 ]
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
                    "destination": [ "obj-47", 0 ],
                    "source": [ "obj-33", 0 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-19", 0 ],
                    "order": 1,
                    "source": [ "obj-4", 0 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-25", 0 ],
                    "order": 0,
                    "source": [ "obj-4", 0 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-56", 0 ],
                    "source": [ "obj-40", 1 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-59", 0 ],
                    "source": [ "obj-40", 0 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-3", 0 ],
                    "source": [ "obj-44", 0 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-3", 0 ],
                    "midpoints": [ 1192.5, 296.49998712539673, 1213.4999604225159, 296.49998712539673, 1213.4999604225159, 221.49998712539673, 995.5, 221.49998712539673 ],
                    "source": [ "obj-5", 1 ]
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
                    "destination": [ "obj-52", 1 ],
                    "source": [ "obj-56", 0 ]
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
                    "destination": [ "obj-8", 1 ],
                    "source": [ "obj-6", 1 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-8", 0 ],
                    "source": [ "obj-6", 0 ]
                }
            }
        ],
        "parameters": {
            "obj-13": [ "vst~[2]", "vst~[2]", 0 ],
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