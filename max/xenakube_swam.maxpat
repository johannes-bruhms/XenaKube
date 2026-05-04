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
        "rect": [ 99.0, 90.0, 977.0, 1385.0 ],
        "boxes": [
            {
                "box": {
                    "id": "obj-17",
                    "maxclass": "newobj",
                    "numinlets": 1,
                    "numoutlets": 1,
                    "outlettype": [ "signal" ],
                    "patching_rect": [ 140.0, 151.0, 72.0, 22.0 ],
                    "text": "tapout~ 200"
                }
            },
            {
                "box": {
                    "id": "obj-43",
                    "maxclass": "newobj",
                    "numinlets": 1,
                    "numoutlets": 1,
                    "outlettype": [ "tapconnect" ],
                    "patching_rect": [ 144.0, 116.0, 65.0, 22.0 ],
                    "text": "tapin~ 200"
                }
            },
            {
                "box": {
                    "id": "obj-47",
                    "lastchannelcount": 0,
                    "maxclass": "live.gain~",
                    "numinlets": 2,
                    "numoutlets": 5,
                    "outlettype": [ "signal", "signal", "", "float", "list" ],
                    "parameter_enable": 1,
                    "patching_rect": [ 92.0, 149.0, 48.0, 136.0 ],
                    "saved_attribute_attributes": {
                        "valueof": {
                            "parameter_longname": "live.gain~[1]",
                            "parameter_mmax": 6.0,
                            "parameter_mmin": -70.0,
                            "parameter_modmode": 3,
                            "parameter_shortname": "live.gain~[1]",
                            "parameter_type": 0,
                            "parameter_unitstyle": 4
                        }
                    },
                    "varname": "live.gain~[1]"
                }
            },
            {
                "box": {
                    "id": "obj-46",
                    "linecount": 2,
                    "maxclass": "comment",
                    "numinlets": 1,
                    "numoutlets": 0,
                    "patching_rect": [ 636.0, 55.0, 150.0, 34.0 ],
                    "text": "markov chains for phrase detection"
                }
            },
            {
                "box": {
                    "id": "obj-44",
                    "maxclass": "comment",
                    "numinlets": 1,
                    "numoutlets": 0,
                    "patching_rect": [ 990.0, 500.5, 150.0, 20.0 ]
                }
            },
            {
                "box": {
                    "id": "obj-42",
                    "maxclass": "newobj",
                    "numinlets": 1,
                    "numoutlets": 1,
                    "outlettype": [ "signal" ],
                    "patching_rect": [ 15.0, 175.0, 72.0, 22.0 ],
                    "text": "tapout~ 200"
                }
            },
            {
                "box": {
                    "id": "obj-41",
                    "maxclass": "newobj",
                    "numinlets": 1,
                    "numoutlets": 1,
                    "outlettype": [ "tapconnect" ],
                    "patching_rect": [ 18.5, 140.0, 65.0, 22.0 ],
                    "text": "tapin~ 200"
                }
            },
            {
                "box": {
                    "id": "obj-13",
                    "maxclass": "newobj",
                    "numinlets": 1,
                    "numoutlets": 0,
                    "patching_rect": [ 452.0, 681.0, 85.0, 22.0 ],
                    "text": "print xk_swam"
                }
            },
            {
                "box": {
                    "id": "obj-34",
                    "maxclass": "message",
                    "numinlets": 2,
                    "numoutlets": 1,
                    "outlettype": [ "" ],
                    "patching_rect": [ 226.5, 116.0, 29.5, 22.0 ],
                    "text": "1"
                }
            },
            {
                "box": {
                    "id": "obj-33",
                    "maxclass": "newobj",
                    "numinlets": 2,
                    "numoutlets": 2,
                    "outlettype": [ "", "" ],
                    "patching_rect": [ 471.0, 140.0, 79.0, 22.0 ],
                    "text": "route running"
                }
            },
            {
                "box": {
                    "bgmode": 0,
                    "border": 0,
                    "clickthrough": 0,
                    "enablehscroll": 0,
                    "enablevscroll": 0,
                    "id": "obj-32",
                    "lockeddragscroll": 0,
                    "lockedsize": 0,
                    "maxclass": "bpatcher",
                    "name": "n4m.monitor.maxpat",
                    "numinlets": 1,
                    "numoutlets": 1,
                    "offset": [ 0.0, 0.0 ],
                    "outlettype": [ "bang" ],
                    "patching_rect": [ 636.0, 186.0, 400.0, 220.0 ],
                    "viewvisibility": 1
                }
            },
            {
                "box": {
                    "id": "obj-31",
                    "maxclass": "newobj",
                    "numinlets": 1,
                    "numoutlets": 0,
                    "patching_rect": [ 554.0, 140.0, 82.0, 22.0 ],
                    "text": "print relay-out"
                }
            },
            {
                "box": {
                    "id": "obj-27",
                    "maxclass": "message",
                    "numinlets": 2,
                    "numoutlets": 1,
                    "outlettype": [ "" ],
                    "patching_rect": [ 258.0, 82.0, 63.0, 22.0 ],
                    "text": "script stop"
                }
            },
            {
                "box": {
                    "id": "obj-20",
                    "maxclass": "message",
                    "numinlets": 2,
                    "numoutlets": 1,
                    "outlettype": [ "" ],
                    "patching_rect": [ 258.0, 58.0, 64.0, 22.0 ],
                    "text": "script start"
                }
            },
            {
                "box": {
                    "id": "obj-14",
                    "maxclass": "comment",
                    "numinlets": 1,
                    "numoutlets": 0,
                    "patching_rect": [ 346.0, 83.0, 150.0, 20.0 ],
                    "text": "relay"
                }
            },
            {
                "box": {
                    "id": "obj-8",
                    "maxclass": "newobj",
                    "numinlets": 1,
                    "numoutlets": 2,
                    "outlettype": [ "", "" ],
                    "patching_rect": [ 258.0, 112.0, 233.0, 22.0 ],
                    "saved_object_attributes": {
                        "autostart": 0,
                        "defer": 0,
                        "watch": 0
                    },
                    "text": "node.script relay-controller.js @autostart 0",
                    "textfile": {
                        "filename": "relay-controller.js",
                        "flags": 0,
                        "embed": 0,
                        "autowatch": 1
                    }
                }
            },
            {
                "box": {
                    "fontface": 0,
                    "fontname": "Arial",
                    "fontsize": 13.0,
                    "id": "obj-36",
                    "maxclass": "number~",
                    "mode": 2,
                    "numinlets": 2,
                    "numoutlets": 2,
                    "outlettype": [ "signal", "float" ],
                    "patching_rect": [ 225.0, 554.0, 59.0, 23.0 ],
                    "sig": 0.0
                }
            },
            {
                "box": {
                    "id": "obj-38",
                    "maxclass": "toggle",
                    "numinlets": 1,
                    "numoutlets": 1,
                    "outlettype": [ "int" ],
                    "parameter_enable": 0,
                    "patching_rect": [ 303.0, 382.0, 24.0, 24.0 ]
                }
            },
            {
                "box": {
                    "fontname": "Arial",
                    "fontsize": 13.0,
                    "id": "obj-39",
                    "maxclass": "message",
                    "numinlets": 2,
                    "numoutlets": 1,
                    "outlettype": [ "" ],
                    "patching_rect": [ 225.0, 383.0, 38.0, 23.0 ],
                    "text": "open"
                }
            },
            {
                "box": {
                    "fontname": "Arial",
                    "fontsize": 13.0,
                    "id": "obj-40",
                    "maxclass": "newobj",
                    "numinlets": 2,
                    "numoutlets": 1,
                    "outlettype": [ "signal" ],
                    "patching_rect": [ 225.0, 522.0, 176.0, 23.0 ],
                    "text": "sfrecord~ 2"
                }
            },
            {
                "box": {
                    "autosave": 1,
                    "bgmode": 0,
                    "border": 0,
                    "clickthrough": 0,
                    "id": "obj-3",
                    "maxclass": "newobj",
                    "numinlets": 2,
                    "numoutlets": 8,
                    "offset": [ 0.0, 0.0 ],
                    "outlettype": [ "signal", "signal", "", "list", "int", "", "", "" ],
                    "patching_rect": [ 92.0, 705.0, 120.0, 22.0 ],
                    "save": [ "#N", "vst~", "loaduniqueid", 0, "SWAM Cello 3", ";" ],
                    "saved_attribute_attributes": {
                        "valueof": {
                            "parameter_invisible": 1,
                            "parameter_longname": "vst~[1]",
                            "parameter_modmode": 0,
                            "parameter_shortname": "vst~[1]",
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
                            "blob": "22414.VMjLgT3U...O+fWarAhckI2bo8la8HRLt.iHfTlai8FYo41Y8HRUTYTK3HxO9.BOVMEUy.Ea0cVZtMEcgQWY9vSRC8Vav8lak4Fc9DiM2HSMtXUSGM1UA4hKtXlKt3hKP4hKt3hKtvjdXQ2bD4hKDQ0SFkjdP4VPt3hKHYGUoUULL4BS1IjKt3hKtPjKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKUAWUCkzTHYVPD4hK1k2Sy.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.UczXzX3giQgglKnM1Y2Y0XqASZHo2LBwDZ2f1S23RUPIUQTMkYpYTV3fjPZcVRWEVczXkVo0zUQQWQrgkbUYTVn4BZic1cVM1ZvjFR1MiPLg1Mn8zMtTETRUDUSYlZFkENHIjVmkzUgUGMVoUZMcDUmkzUXMWRBgTLEYTXvTkUOglKosjcHg2R4X2PTETRUAUSAIkVpASZH8FMFM1ZIcEVoE0UZESUrAUcickVzMFaHYFVWgkbUcUV3fjPLQmZCwjctLDS14RdLAiXo0DdhMjSwnVZHU2LC8DTEoFUAACQH8VTV8DZpwlXSUkQgsVSFM1ZQwFRlg0UXIWUWkENHIDSz4RZHU2LC8DTEoFUAACQH8VTV8DZxYUVqETaPU2XGE0aIcUVoE0UZUGMrgjYXcEVxU0UYgCRBwDctjFR0MyPOAUQpQUPvPDRuEkUOglcVkUaEYzX00DLicVPsgjYXcEVxU0UYgCRRwDctjFR0MyPOAUQpQUPvPDRuEkUOgldVg0azvVU0cmUiMWUrgjYXcEVxU0UYgCRRsTdyHDSncCZOciKUAkTEQ0TlolQYgCRRE1YzX0XmcGaPU2XWoEciwFRlg0UXIWUWkENHIDSz4RZHU2LC8DTEoFUAACQH8VTV8DZ5YEVzU0UXIWR5ElLqwVXs0TUikWTWg0azv1T0E0UYglKnM1Y2Y0XqASZHc2LBwDZ2f1S23RUPIUQTMkYpYTV3fjTgcVSGM1ZIcTUvPiUYglKnM1Y2Y0XqASZHoGTCwDctjFR0MyPOAUQpQUPvPDRuEkUOgldVgUdQcUV3kELgIWUWE1ZAslX00jUYkWSWoEciwFRlg0UXIWUWkENHIDSz4RZHU2LC8DTEoFUAACQH8VTV8DZ2XjXqQSLToWRWoEciEiXn4BZic1cVM1ZvjFR1MiTMg1Mn8zMtTETRUDUSYlZFkENHIjXmQiQTUWTsgjYXcEVxU0UYgCRBwDctjFR0MyPOAUQpQUPvPDRuEkUOglKWgEcAISX5EUUjYWUrgjYXcEVxU0UYgCRnwDctjFR0MyPOAUQpQUPvPDRuEkUOglKWokdMYjVBUEagoVRBgTLEYTXvTkUOglKosjcHg2R4X2PTETRUAUSAIkVpASZHY2ZrQVMvnWXpcGaHYFVWgkbUcUV3fjPLQmYCwjctLDS14RdMcGUowDLTkWS4IVZHU2LC8DTEoFUAACQH8VTV8DZtbkV071UZkVQFMVcAASXxsVaHYFVWgkbUcUV3fjTLQmKogTcyLzSPUjZTEDLDgzaQY0Sn4xQgc1ZWMUcQYUVPUDahcFLrgjYXcEVxU0UYgCRBwDctjFR0MyPOAUQpQUPvPDRuEkUOglKxDlbqcjXtgCagQSPUgEdEYUXn4BZic1cVM1ZvjFR4MiPLg1Mn8zMtTETRUDUSYlZFkENHIjX0kzQicFLVkEcQISXTslUgsVRBgTLEYTXvTkUOgFQosjcHg2R4X2PTETRUAUSAIkVpASZHgWQrElZ3XUXFsFag0VUrIFZtf1XmcmUisFLogjcyHUSncCZOciKUAkTEQ0TlolQYgCRnI1ZEYTXMgCagUGNDIldIIDRwTjQgASUV8DZLk1R1gDdKkicCQUPIUETMEjTZoFLogDdUw1XqkTaX0zZFQFZtf1XmcmUisFLogzclk1R1gDdKkicCQUPIUETMEjTZoFLogDdUw1XqkTaXQ0ZVE1ZIIDRwTjQgASUV8DZtj1RvfDdKkicCQUPIUETMEjTZoFLogTd3vlXpsFagUWPUgEdEYUXn4BZic1cVM1ZvjFR1MiPLg1Mn8zMtTETRUDUSYlZFkENHgmX5UTLXkVQFMVcqoVX5UEahESQFEFUqYUXqkjPHESQFEFLUY0SnQTZKYGR3sTN1MDUAkTUP0TPRokZvjFR4E0UZk1bVoEcUEiX4ETUXgWQVEFZtf1XmcmUisFLogjcyHUSncCZOciKUAkTEQ0TlolQYgCR3IldIckVzMlQLoWUsE1ZIIDRwTjQgASUV8DZLkVSz4RZHU2LC8DTEoFUAACQH8VTV8DZLczX3sFag0VRUkUdIIDRwTjQgASUV8DZtj1RvfDdKkicCQUPIUETMEjTZoFLogTdQ0lXuQSLYk2ZpEldUwlXwTjQgcGRBgTLEYTXvTkUOglXosjcHg2R4X2PTETRUAUSAIkVpASZHkWTsI1azDSV4slZgoWUrIVLEYTX3gjPHESQFEFLUY0SnIVZKYGR3sTN1MDUAkTUP0TPRokZvjFR4EUah8FMwjUdqoVX5UEahESQFEVdHIDRwTjQgASUV8DZhk1R1gDdKkicCQUPIUETMEjTZoFLogTdQ0lXuQSLYkGL5ElZUYTXn4BZic1cVM1ZvjFR1MiPLg1Mn8zMtTETRUDUSYlZFkENHIzX3UkUgU2cwDVS3XTVqkjPHESQFEFLUY0Sn4RZKYGR3sTN1MDUAkTUP0TPRokZvjFR5kzUYMGNFEVcAUEV3UjUgglKnM1Y2Y0XqASZHY2LBwDZ2f1S23RUPIUQTMkYpYTV3fjPigWUVEVc2ESXSEzUYsVTrgjYXcEVxU0UYgCRR4DcDMDS14xPLYGSC4zcPkVSzHVZLICR3sTN1MDUAkTUP0TPRokZvjFRwTkQgUWSVokdq0FRlg0UXIWUWkENHIESyLiPLg1Mn8zMtTETRUDUSYlZFkENHg1XukDahcVTxDFQUYjX5cFaHYFVWgkbUcUV3fjPLQGTS0DMpMkSznVdMMCUC0DdLkFSxnVZHU2LC8DTEoFUAACQH8VTV8DZXckVnkzUXoGNrE0YQYUVIQCaHYFVWgkbUcUV3fDZLAiKosjcHg2R4X2PTETRUAUSAIkVpASZHEyZrgEdEYzX0kTUXoWUrgjYXcEVxU0UYgCRB0DclMjSzn1TNQiYo0TLPMjSvP0TNECR3sTN1MDUAkTUP0TPRokZvjFRwrFaXgWQFMVcIUEV5UEaTcFMFkEZtf1XmcmUisFLogzcXk1R1gDdKkic4sjcEwlXmASLhkic4sTd3X0XzEkUYQ2XVoEcUw1S2nmUZo1ZVE1YAcjXuQSLYkicCI1YIcEVy0TaOciKUAkTEQ0TlolQYgCR3I0TvXkVpsVLPgTRBgTLEYTXvTkUOgFRosjcHg2R4X2PTETRUAUSAIkVpASZH0TQTQUPvnVTm0jQiUWRWQVSEYjX1sFag0VRBgTLEYTXvTkUOglKosjcHg2R4X2PTETRUAUSAIkVpASZH0TQTQUPvPTU3UDagkWPxDVdUwFRlg0UXIWUWkENHIDSz4RZHU2LC8DTEoFUAACQH8VTV8DZDYzX5UTLXEWTUQlcUwFRlg0UXIWUWkENHgGSz4RZHU2LC8DTEoFUAACQH8VTV8DZHECVHsFaTsVSGUkaIcUV4cVLgIWTrgjYXcEVxU0UYgCRBwDcPMkSzn1TNQiZ40jcDMkSxfUdMICVogTcyLzSPUjZTEDLDgzaQY0SngDahsVQFMlaMoWXzEUahU2cFE1ZIcET5MWLTsFMwHFZtf1XmcmUisFLogDdyHDSncCZOciKUAkTEQ0TlolQYgCRngEdUYEV5cVLPUGMFMFd3XTXxUEah0DNFk0ZIIDRwTjQgASUV8DZtj1R1gDdKkicCQUPIUETMEjTZoFLogTZEw1XuEkLTkVQFE1ZIIDRwTjQgASUV8DZDk1R1gDdKkicCQUPIUETMEjTZoFLogzZmcjX30TQigWRUkUdAUEV3UjUgglKnM1Y2Y0XqASZHc2LBwDZ2f1S23RUPIUQTMkYpYTV3fDdZs1ZxPkLqYzXoclUYkGN5gkdEw1XqE0ZhcFMwHlcIIDRwTjQgASUV8DZtj1R1gDdKkicCQUPIUETMEjTZoFLogTbUYEYSM1UZoWSFo0ZMcDUmMlUYM0XWokdMYjVn4BZic1cVM1ZvjFR1MiPLg1Mn8zMtTETRUDUSYlZFkENHgmV4kUUYIWRUk0bEYjXn4BZic1cVM1ZvjFR1MiTMg1Mn8zMtTETRUDUSYlZFkENHIUXu0DahUWTUMFcUEiTqslLTIyZFMVZmYUV4kTUYkWUFMFZtf1XmcmUisFLogzcyHDSncCZOciKUAkTEQ0TlolQYgCRRE1aMwlX0EUUiQWUFM0ZEwlXzkDUjsTUVQ1TickV50jQZsVSsgjYXcEVxU0UYgCRBwDctjFR0MyPOAUQpQUPvPDRuEkUOgldVokZqYDU3gCaY81cVkEZtf1XmcmUisFLogzcyHDSncCZOciKUAkTEQ0TlolQYgCRnEVcQcUVOkEaYYUUFEVcMYkV5sVaHYFVWgkbUcUV3fjTLQmKogTcyLzSPUjZTEDLDgzaQY0Sn4xUXQ2ZwfEZtf1XmcmUisFLogjcyHDSncCZOciKUAkTEQ0TlolQYgCRBI1aQICVtkDUYQWTFEUci0VXn4BZic1cVM1ZvjFR3AUZKYGR3sTN1MDUAkTUP0TPRokZvjFR1slQik1YrA0ZzXTVUETaHYFVWgkbUcUV3fDZLo2LBwDZ2f1S23RUPIUQTMkYpYTV3fjPh81asQ1P3XTXLUULYQGNw.UczXzX3giQgglKnM1Y2Y0XqASZHY2LBwDZ2f1S23RUPIUQTMkYpYTV3fjPhUWRGM1YvDCU1cmUZoWRUgkdqESXPUDahcFLrgjYXcEVxU0UYgCRR0jcyHDSncCZOciKUAkTEQ0TlolQYgCRBIVcIczXmAiUYQWTxD1PQ0lXxkjPHESQFEFLUY0Sn4RZKYGR3sTN1MDUAkTUP0TPRokZvjFR1gCahoWQVE1ZzXzX0ACUXMSTUo0bUwFRlg0UXIWUWkENHITSz4RZHU2LC8DTEoFUAACQH8VTV8DZHcUVoUkUZESUVMURQQkTCclUXQGMVkkbIIDRwTjQgASUV8DZDkWSz4RZHU2LC8DTEoFUAACQH8VTV8DZHcUVxUkUXkWUwT0azXTVCgCagoWRxDlb2YUV3AidgoVUrgjYXcEVxU0UYgCRBwDctjFR0MyPOAUQpQUPvPDRuEkUOgFSWMVdQcEVuQCaHYFVWgkbUcUV3fjPLQmKogTcyLzSPUjZTEDLDgzaQY0SnwzUikWTWg0azvFUmAiQhglKnM1Y2Y0XqASZHY2LBwDZ2f1S23RUPIUQTMkYpYTV3fjPigWQrEVdAISX4UEaHYFVWgkbUcUV3fjPLQmKogTcyLzS04xUXgWQVEVdzLzSMsFQQkTRUk0bEYjX1sFag0VTUgEZ2YUV4X2TSkTTTIkTUYUXmEzQh8FMwjUQzXzX3s1QHsFMVgEZ2YUVpASZHcGRBgjcEwlXmAiUYoWUrIVRQY0SnQkQjYWRWkUdMckV0QCaHYFSFo0YzvVXqcmUOgFQ40DZtHUXq0jLhc1XVkEUqcjXqASZHcGRBgzbM0FV3fjTLcGRBgjbM0FV3fjTKcGRn8zM5QkTDslZTsFLVgkcAckVzMVLPASRsM1ZAIkVzEzUioGNUE1azX0Sn4RZKYGRBgzazXjXvDkLWMWQFQFNHIES3IVZKYGRBgTcUczXkAiUZQGLogTdyHDSn4BdgASTxb0bEYDY3fjTLgGUosjcHIDR4clUXYWUV8DZtj1R1wzTNQiZS4DMpMkS24xTMQCSCwTdLkFRlwzUjMGLVkkdIcEY3fjPLQmYCwjctLDS14xTLcmZowjcpkFSzfjPHg1ZGI1YMIiX3fjPLglKng0aAISXxUDahgCRBwDZ2f1S2biTSkTTTIkTUYUXmEzQh8FMwjUQzXzX3sVaOcidTIEQqoFUqAiUXYWPWoEciYUTzEUahQSPRkEcEwFVxUkQYgCRRwDZtHjXmkzUXMWUFM1ZIckTpASZHEyZrgEdEYzX0EEUYYWTGoEZtfGVtUDagQWUFEFNHIESxfjPHMWUwHVdEESVqEUUjYWUV8DZDkFRloWLhgFLogzcHIDRx0TaXgCRRszcHg1S2nGURQzZpQ0ZvXEV1EzUZQ2Xw.ELI01XqEjTZQWPWMld3TUXuQiUOglKosjcHIDRuQiQhASTxb0bEYDY3fjTLgmXosjcHIDR0U0QiUFLVoEcvjFR2MiPLglK3EFLQIyUyUjQjgCRRwzctj1R1gjPHk2YVgkcUY0Sn4RZKYGRBgTdqcUXyUkQig2ZW8DZtj1RvfjPHg1ZGI1YMIiX3fjPLglKng0aAISXxUDahgCRBwDZ2f1S2biTSkTTTIkTUYUXmEzQh8FMwjUQzXzX3sVaOcidTIEQqoFUqAiUXYWPWoEciYUTzEUahQSPRkEcEwFVxUkQYgCRRwDZtHjXmkzUXMWUFM1ZIckTpASZHEyZrgEdEYzX0kTUXoWUrgjYLYjVmQCags1cV8DZDkWSn4hTgsVSxH1YiYUVTs1QhsFLogzcHIDRy0TaXgCRRwDMHIDRx0TaXgCRRszcHg1S2nGURQzZpQ0ZvXEV1EzUZQ2Xw.ELI01XqEjTZQWPWMld3TUXuQiUOglKosjcHIDRuQiQhASTxb0bEYDY3fjTLgmXosjcHIDR0U0QiUFLVoEcvjFR1MiPLglK3EFLQIyUyUjQjgCRRwDdhk1R1gjPHk2YVgkcUY0Sn4RZKYGRBgTdqcUXyUkQig2ZW8DZtj1RvfjPHg1ZGI1YMIiX3fjPLglKng0aAISXxUDahgCRBwDZ2f1S2biTSkTTTIkTUYUXmEzQh8FMwjUQzXzX3sVaOcidTIEQqoFUqAiUXYWPWoEciYUTzEUahQSPRkEcEwFVxUkQYgCRRwDZtHjXmkzUXMWUFM1ZIckTpASZHgFNwLlQ3vlXoUkQTcVRWg0bIIDRoclUXQGMVkkbvjFR2IVZHYldVkUdMcEVsUkQUQSPWkENHIESn4hTgkWRV8DZDkWSn4hPgkWRV8DZ5IESnMyPO0zZDEURIUUVyUjQhY2ZrEVaMQ0X3k0UYYlZrElcUczXkAiUZQGLogjcyHDSn4hTZQWPWMld3TUXmc1UOgFQowjLyHDSn4BdgASTxb0bqwVX3fjPLQmKogjY2X0X5gSUgc1YW8DZDkFSxLiPLglK3IlaEYjXqASZHY2LBwDZtfmXz.iUgsVTsIFMvjFR1MiTMglKngEMAcEV40zUOglKogjYHYkV1giQgcVRW8DZtjFR0MyPOUmdTIEQqoFUqAiUXYWPWoEciYUTzEUahQCMC8TSqQTTIkTUYMWQFIlcqwVXsUkZgoWRWQlYTwVXmkjQgsVTV8DZDkFRl4xUXgWQVE1ZQcUV3sFQYgCRngUcicDU00zUZo2ZwDFcAUEV3UjUgglK3gkaEwVXzUkQggCRRwjLHIDRyUULhkWQwj0ZQUEY1UkUOgFQogjY5EiXnASZHcGVogjY1EiXnASZHMGQogTN1M0TIEEURIUUVE1YAcjXuQSLYMTUsIVLUYDRuQiQhASTxb0bqwVX3fjPLQmKogjYpwVX1U0QiUFLVg0LvjFR2gTdMQmKogjY2X0X5gSUg8FMV8DZtj1R1gjPHUWUGMVYvXEVy.SZHcGR40DctjFRlwzQZcVPWkENHIDSz4RZHYFSWQ1bvXUV5kzUjgCRBwDcTkFRlgjUjYWQwHVdvjFR1gjPHg1ZFIVc2YEV3ASZHYGR3sTN1k2RMsFQQkTRUk0bEYjX1sFag0VUpEldIcEY4X2TSkTTTIkTUYUXmEzQh8FMwjUQzXzX3s1QHsFMVgEZ2YUVpASZHcGRBgjcEwlXmAiUYoWUrIVRQY0SnAUahsFLwDlb3DCU1UkUYoVRBgTZmYEVzQiUYIGLogzcHIDRyUULhkWQwj0ZQUEY1UkUOgFQogjY5EiXnASZHMiKogjY1EiXnASZHMGQogTN1M0TIEEURIUUVE1YAcjXuQSLYMTUsIVLUYDRuQiQhASTxb0bqwVX3fjPLQmKogjYpwVX1U0QiUFLVg0LvjFR2gTdMQmKogjY2X0X5gSUg8FMV8DZtj1R1gjPHUWUGMVYvXEVy.SZHcGR40DctjFRlwzQZcVPWkENHIDSz4RZHYFSWQ1bvXUV5kzUjgCRBwDcTkFRlgjUjYWQwHVdvjFR1gjPHg1ZFIVc2YEV3ASZHYGR3sTN1k2RMsFQQkTRUk0bEYjX1sFag0VUpEldIcEY4X2TSkTTTIkTUYUXmEzQh8FMwjUQzXzX3s1QHsFMVgEZ2YUVpASZHcGRBgjcEwlXmAiUYoWUrIVRQY0SnomUX8FMrUUc2Y0XyUEaHYFSFo0YzvVXqcmUOgFQ40DZtHUXq0jLhc1XVkEUqcjXqASZHcGRBgzbM0FV3fDdMglKBEVdIY0SnomTLg1LC8TSqQTTIkTUYMWQFIlcqwVXs0DUigWVWkkYpwVX1U0QiUFLVoEcvjFR1MiPLglKRoEcAc0X5gSUgc1YW8DZDkFSxLiPLglK3EFLQIyUysFaggCRBwDctjFRlciUioGNUE1Ymc0SnQTZLIyLBwDZtfmXtUjQhsFLogjcyHDSn4BdhQCLVE1ZQ0lXz.SZHY2LR0DZtfFVzDzUXkWSW8DZtjFRlgjUZYGNFE1YIc0Sn4RZHU2LC8Tc5QkTDslZTsFLVgkcAckVzMlUQQWTsIFMzLzSMsFQQkTRUk0bEYjX1sFag0VUpEldIcEYlQEagcVRFE1ZQY0SnQTZHYlKWgEdEYUXqE0UYg2ZDkENHIjXmQiQTUWTsgjYLYjVmQCags1cV8DZDkWSn4hTgsVSxH1YiYUVTs1QhsFLogzcHIDRy0TaXgCRRwjcHIDRx0TaXgCRRszcHg1S2nGURQzZpQ0ZvXEV1EzUZQ2Xw.ELI01XqEjTZQWPWMld3TUXuQiUOglKosjcHIDRuQiQhASTxb0bEYDY3fjTLgmXosjcHIDR0U0QiUFLVoEcvjFR1MiPLglK3EFLQIyUyUjQjgCRRwDdhk1R1gjPHk2YVgkcUY0Sn4RZKYGRBgTdqcUXyUkQig2ZW8DZtj1RvfjPHg1ZGI1YMIiX3fjPLglKng0aAISXxUDahgCRBwDZ2f1S2biTSkTTTIkTUYUXmEzQh8FMwjUQzXzX3sVaOcidTIEQqoFUqAiUXYWPWoEciYUTzEUahQSPRkEcEwFVxUkQYgCRRwDZtHjXmkzUXMWUFM1ZIckTpASZHgWUrM1ZI0FVMslQjglK3gkaEwVXzUkQggCRRwjLHIDRyUULhkWQwj0ZQUEY1UkUOgFQogjY5EiXnASZHQiKogjY1EiXnASZHMGQogTN1M0TIEEURIUUVE1YAcjXuQSLYMTUsIVLUYDRuQiQhASTxb0bqwVX3fjPLQmKogjYpwVX1U0QiUFLVg0LvjFR2gTdMQmKogjY2X0X5gSUg8FMV8DZtj1R1gjPHUWUGMVYvXEVy.SZHcGR40DctjFRlwzQZcVPWkENHIDSz4RZHYFSWQ1bvXUV5kzUjgCRBwDcTkFRlgjUjYWQwHVdvjFR1gjPHg1ZFIVc2YEV3ASZHYGR3sTN1k2RMsFQQkTRUk0bEYjX1sFag0VUpEldIcEY4X2TSkTTTIkTUYUXmEzQh8FMwjUQzXzX3s1QHsFMVgEZ2YUVpASZHcGRBgjcEwlXmAiUYoWUrIVRQY0SnQTLXkVSEMFM2YUVn4BdX4VQrEFcUYTX3fjTLICRBgzbUEiX4UTLYsVTUQlcUY0SnQTZHYldwHFZvjFR2YVZHYlcwHFZvjFRyQTZHkicSMURQQkTRUkUgcVPGI1azDSVCUUahESUFgzazXjXvDkLWM2ZrEFNHIDSz4RZHYlZrElcUczXkAiUXMCLogzcHkWSz4RZHY1MVMld3TUXuQiUOglKosjcHIDR0U0QiUFLVg0LvjFR2gTdMQmKogjYLcjVmEzUYgCRBwDctjFRlwzUjMGLVkkdIcEY3fjPLQGUogjYHYEY1UTLhkGLogjcHIDRnslQhU2cVgEdvjFR1gDdKkic4sTSqQTTIkTUYMWQFIlcqwVXsUkZgoWRWQVN1M0TIEEURIUUVE1YAcjXuQSLYUDMFMFdqcDRqQiUXg1cVkkZvjFR2gjPHYWQrI1YvXUV5UEahkTTV8DZLc0X4E0UX8FMrgjYLYjVmQCags1cV8DZDkWSn4hTgsVSxH1YiYUVTs1QhsFLogzcHIDRy0TaXgCRn0jdHIDRx0TaXgCRRszcHg1S2nGURQzZpQ0ZvXEV1EzUZQ2Xw.ELI01XqEjTZQWPWMld3TUXuQiUOglKosjcHIDRuQiQhASTxb0bEYDY3fjTLgmXosjcHIDR0U0QiUFLVoEcvjFR2MiPLglK3EFLQIyUyUjQjgCRRwDdhk1R1gjPHk2YVgkcUY0Sn4RZKQiZCwjctLDS14xTNACSo0jLPkGS3gjPHk2ZWE1bUYzX3s1UOglKosDLHIDRns1QhcVSxHFNHIDSn4BZX8VPxDlbEwlX3fjPLg1Mn8zM2H0TIEEURIUUVE1YAcjXuQSLYUDMFMFdq01S2nGURQzZpQ0ZvXEV1EzUZQ2XVEEcQ0lXzDjTYQWQrgkbUYTV3fjTLglKBI1YIcEVyUkQisVRWIkZvjFRPsFajUSTvDFcUwFRlwjQZcFMrE1Z2Y0SnQTdMglKRE1ZMIiXmMlUYQ0ZGI1ZvjFR2gjPHMWSsgENHIESwfjPHIWSsgENHI0R2gDZOcidTIEQqoFUqAiUXYWPWoEciECTvjTaisVPRoEcAc0X5gSUg8FMV8DZtj1R1gjPH8FMFIFLQIyUyUjQjgCRRwDdhk1R1gjPHUWUGMVYvXkVzASZHY2LBwDZtfWXvDkLWMWQFQFNHIES3IVZKYGRBgTdmYEV1UkUOglKosjcHIDR4s1UgMWUFMFdqc0Sn4RZKACRBgDZqcjXm0jLhgCRBwDZtfFVuEjLgIWQrIFNHIDSncCZOcyMRMURQQkTRUkUgcVPGI1azDSVEQiQig2Zs8zM5QkTDslZTsFLVgkcAckVzMlUQQWTsIFMAIUVzUDaXIWUFkENHIESn4hPhcVRWg0bUYzXqkzURoFLogjc3XTXzDzQZUGMVQFTEwlXmACaHYFSFo0YzvVXqcmUOgFQ40DZtHUXq0jLhc1XVkEUqcjXqASZHcGRBgzbM0FV3fjPNcGRBgjbM0FV3fjTKcGRn8zM5QkTDslZTsFLVgkcAckVzMVLPASRsM1ZAIkVzEzUioGNUE1azX0Sn4RZKYGRBgzazXjXvDkLWMWQFQFNHIES3IVZKYGRBgTcUczXkAiUZQGLogjcyHDSn4BdgASTxb0bEYDY3fjTLgmXosjcHIDR4clUXYWUV8DZtj1R1gjPHk2ZWE1bUYzX3s1UOglKosDLHIDRns1QhcVSxHFNHIDSn4BZX8VPxDlbEwlX3fjPLg1Mn8zM2H0TIEEURIUUVE1YAcjXuQSLYUDMFMFdq01S2nGURQzZpQ0ZvXEV1EzUZQ2XVEEcQ0lXzDjTYQWQrgkbUYTV3fjTLglKBI1YIcEVyUkQisVRWIkZvjFRtUDahMGNrE1aMEiXPUDahcFLrgjYLYjVmQCags1cV8DZDkWSn4hTgsVSxH1YiYUVTs1QhsFLogzcHIDRy0TaXgCR30zLHIDRx0TaXgCRRszcHg1S2nGURQzZpQ0ZvXEV1EzUZQ2Xw.ELI01XqEjTZQWPWMld3TUXuQiUOglKosjcHIDRuQiQhASTxb0bEYDY3fjTLgmXosjcHIDR0U0QiUFLVoEcvjFR1MiPLglK3EFLQIyUyUjQjgCRRwDdhk1R1gjPHk2YVgkcUY0Sn4RZKYGRBgTdqcUXyUkQig2ZW8DZtj1RvfjPHg1ZGI1YMIiX3fjPLglKng0aAISXxUDahgCRBwDZ2f1S2biTSkTTTIkTUYUXmEzQh8FMwjUQzXzX3sVaOcidTIEQqoFUqAiUXYWPWoEciYUTzEUahQSPRkEcEwFVxUkQYgCRRwDZtHjXmkzUXMWUFM1ZIckTpASZHoWRWk0b3XTX0ETUXgWQVEFZtfGVtUDagQWUFEFNHIESn4hTgsVSxH1YiYUVTs1QhsFLogzcHIDRy0TaXgCR30DMHIDRx0TaXgCRRszcHg1S2nGURQzZpQ0ZvXEV1EzUZQ2Xw.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.idgoVUrgjYXcEVxU0UYgCRBwDctjFR0MyPOAUQrI1YvXUV5UEahYlKWgEdEYUXqE0UYg2ZDkENHglX0giUg0DNFkEL2YEV5sVLgQGNpE1SYwVVn4BZic1cVM1ZvjFR2MiPLg1Mn8zMtTEV3UjUgsVTWkEdAIjXmkzUXMWUFM1ZIckTpASZHgGNwD1bQQkV4E0UXQWSVkkPUYzXxTkUYQGLToUZM0FRlg0UXIWUWkENHIESxLiPLg1Mn8zM2HDUmkzUXMWUFM1ZIIiX4XWdKIENwD1bzLzSRgSLgMWPRokZvjFRocWLgkWUVM0aMEyU3gSLgMWRBgDcEYUXqASZHMzcwDVdUEyUMsVLXUVRvDVcvvFRlQkLhsVRW8DZtjFRlQkQY8VTWgEZ2YUV3fjPLglKRgUZQckVwTkUOglKogTN1MDUmkzUXMWUFM1ZIIiX4X2PTcVRWg0bUYzXqkzQHYWQrI1YvXUV5UEahkTTV8DZHISX0ASLT81aWkUdIIDRwTjQgASUV8DZtj1R1gDdKkicCQ0YIcEVyUkQisVRGgjcEwlXmAiUYoWUrIVRQY0SngjLgUGLVAEZMISX3EzQi8FNrEVSEYzXqkzUZc1cwHFZtf1XmcmUisFLogjcyHDSncCZOciKUgEdEYUXqE0UYgWPBI1YIcEVyUkQisVRWIkZvjFR3gSLgM2cToUdQcUVzUEahAENwH1aQckV0QCaHYFVWgkbUcUV3fDdLQmKogTcyLzSPUDahcFLVkkdUwlXl4xUXgWQVE1ZQcUV3sFQYgCRnIVc3XUXSgiUigWSVkEQUYTXms1USUWTVkEZtf1XmcmUisFLogjcyHDSncCZOciKUgEdEYUXqE0UYgWPBI1YIcEVyUkQisVRWIkZvjFR3gSLgMGL5ElZUcTXmE0UZUGMwLEc3nVVrkjPHESQFEFLUY0Sn4RZKYGR3sTN1MDUmkzUXMWUFM1ZIcDR1UDahcFLVkkdUwlXIEkUOgFRxDVcvXTTu0zQicFMwf0ZIQUV5M1UYsFMVM0aMEiXn4BZic1cVM1ZvjFR2IVZKYGR3sTN1k2RPUDahcFLVkkdUwlX4QyPOUGRvDVcvv1S2bCZTUGNVEVdzLzS0gDLgUGLwHVSEwVXmMlUYgGMC8TcHISX0ASLh8FLVMlbEYzX0kTaOciKxDVdqYzXugCag8FMwjUN1MjXmkzUXMWSs8zMtTETRUDUSYlZFkENHglX0giUgMENVMFdMYUVAQSLYIWUrgjYXcEVxU0UYgCRR4jcyHDSncCZOciKUAkTEQ0TlolQYgCRnIVc3XUXSgiUigWSVkEQqEiX5UDagkVUrgjYXcEVxU0UYgCR3wDctjFR0MyPOUmKWgEdEYUX4QyPOUmKxDVdqYzXugCag8FMwjUN1k2R1kjLg0VRWg0bzLzS4giUigWSVk0azvVV0EjTgcFMVMFaEECV5UUahsVRW8DZDQ0XpsVLgUFL5ElZUYTXuQSLYglKRE1YqwVXTUkQjoGLogzPUYTXxgCaHYFTxDlcQUUVyD0UOglYWwDZtfFV0E0QiUGLFU0ZmczX3fjTR4TSEUkTzHESn4BdXU2cwDFLIc0SngEaYsVSVgkZIkFVn4BdXUGLFIVczXUVzEkLT81aWkENHIDSn4BdhsVSFM1a3vVXMgiQYsFLogjcHg2R4XWdKk2XWg0bzLjKt3hKt3hKt3hKtXlTU0DUQAURWoULEYzXqEEUXoWQF4RPDYFTzDzUXkWSG4RPDYmKtnWPt3hKt3hKt3hKJUELPUTPqI1aYcEV5UkQQcVTWgEOujzPu0Fbu4VYtQmO77hUSQ0LPwVcmklaSQWXzUlO.."
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
                                        "blob": "22414.VMjLgT3U...O+fWarAhckI2bo8la8HRLt.iHfTlai8FYo41Y8HRUTYTK3HxO9.BOVMEUy.Ea0cVZtMEcgQWY9vSRC8Vav8lak4Fc9DiM2HSMtXUSGM1UA4hKtXlKt3hKP4hKt3hKtvjdXQ2bD4hKDQ0SFkjdP4VPt3hKHYGUoUULL4BS1IjKt3hKtPjKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKt3hKUAWUCkzTHYVPD4hK1k2Sy.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.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.UczXzX3giQgglKnM1Y2Y0XqASZHY2LBwDZ2f1S23RUPIUQTMkYpYTV3fjPhUWRGM1YvDCU1cmUZoWRUgkdqESXPUDahcFLrgjYXcEVxU0UYgCRR0jcyHDSncCZOciKUAkTEQ0TlolQYgCRBIVcIczXmAiUYQWTxD1PQ0lXxkjPHESQFEFLUY0Sn4RZKYGR3sTN1MDUAkTUP0TPRokZvjFR1gCahoWQVE1ZzXzX0ACUXMSTUo0bUwFRlg0UXIWUWkENHITSz4RZHU2LC8DTEoFUAACQH8VTV8DZHcUVoUkUZESUVMURQQkTCclUXQGMVkkbIIDRwTjQgASUV8DZDkWSz4RZHU2LC8DTEoFUAACQH8VTV8DZHcUVxUkUXkWUwT0azXTVCgCagoWRxDlb2YUV3AidgoVUrgjYXcEVxU0UYgCRBwDctjFR0MyPOAUQpQUPvPDRuEkUOgFSWMVdQcEVuQCaHYFVWgkbUcUV3fjPLQmKogTcyLzSPUjZTEDLDgzaQY0SnwzUikWTWg0azvFUmAiQhglKnM1Y2Y0XqASZHY2LBwDZ2f1S23RUPIUQTMkYpYTV3fjPigWQrEVdAISX4UEaHYFVWgkbUcUV3fjPLQmKogTcyLzS04xUXgWQVEVdzLzSMsFQQkTRUk0bEYjX1sFag0VTUgEZ2YUV4X2TSkTTTIkTUYUXmEzQh8FMwjUQzXzX3s1QHsFMVgEZ2YUVpASZHcGRBgjcEwlXmAiUYoWUrIVRQY0SnQkQjYWRWkUdMckV0QCaHYFSFo0YzvVXqcmUOgFQ40DZtHUXq0jLhc1XVkEUqcjXqASZHcGRBgzbM0FV3fjTLcGRBgjbM0FV3fjTKcGRn8zM5QkTDslZTsFLVgkcAckVzMVLPASRsM1ZAIkVzEzUioGNUE1azX0Sn4RZKYGRBgzazXjXvDkLWMWQFQFNHIES3IVZKYGRBgTcUczXkAiUZQGLogTdyHDSn4BdgASTxb0bEYDY3fjTLgGUosjcHIDR4clUXYWUV8DZtj1R1wzTNQiZS4DMpMkS24xTMQCSCwTdLkFRlwzUjMGLVkkdIcEY3fjPLQmYCwjctLDS14xTLcmZowjcpkFSzfjPHg1ZGI1YMIiX3fjPLglKng0aAISXxUDahgCRBwDZ2f1S2biTSkTTTIkTUYUXmEzQh8FMwjUQzXzX3sVaOcidTIEQqoFUqAiUXYWPWoEciYUTzEUahQSPRkEcEwFVxUkQYgCRRwDZtHjXmkzUXMWUFM1ZIckTpASZHEyZrgEdEYzX0EEUYYWTGoEZtfGVtUDagQWUFEFNHIESxfjPHMWUwHVdEESVqEUUjYWUV8DZDkFRloWLhgFLogzcHIDRx0TaXgCRRszcHg1S2nGURQzZpQ0ZvXEV1EzUZQ2Xw.ELI01XqEjTZQWPWMld3TUXuQiUOglKosjcHIDRuQiQhASTxb0bEYDY3fjTLgmXosjcHIDR0U0QiUFLVoEcvjFR2MiPLglK3EFLQIyUyUjQjgCRRwzctj1R1gjPHk2YVgkcUY0Sn4RZKYGRBgTdqcUXyUkQig2ZW8DZtj1RvfjPHg1ZGI1YMIiX3fjPLglKng0aAISXxUDahgCRBwDZ2f1S2biTSkTTTIkTUYUXmEzQh8FMwjUQzXzX3sVaOcidTIEQqoFUqAiUXYWPWoEciYUTzEUahQSPRkEcEwFVxUkQYgCRRwDZtHjXmkzUXMWUFM1ZIckTpASZHEyZrgEdEYzX0kTUXoWUrgjYLYjVmQCags1cV8DZDkWSn4hTgsVSxH1YiYUVTs1QhsFLogzcHIDRy0TaXgCRRwDMHIDRx0TaXgCRRszcHg1S2nGURQzZpQ0ZvXEV1EzUZQ2Xw.ELI01XqEjTZQWPWMld3TUXuQiUOglKosjcHIDRuQiQhASTxb0bEYDY3fjTLgmXosjcHIDR0U0QiUFLVoEcvjFR1MiPLglK3EFLQIyUyUjQjgCRRwDdhk1R1gjPHk2YVgkcUY0Sn4RZKYGRBgTdqcUXyUkQig2ZW8DZtj1RvfjPHg1ZGI1YMIiX3fjPLglKng0aAISXxUDahgCRBwDZ2f1S2biTSkTTTIkTUYUXmEzQh8FMwjUQzXzX3sVaOcidTIEQqoFUqAiUXYWPWoEciYUTzEUahQSPRkEcEwFVxUkQYgCRRwDZtHjXmkzUXMWUFM1ZIckTpASZHgFNwLlQ3vlXoUkQTcVRWg0bIIDRoclUXQGMVkkbvjFR2IVZHYldVkUdMcEVsUkQUQSPWkENHIESn4hTgkWRV8DZDkWSn4hPgkWRV8DZ5IESnMyPO0zZDEURIUUVyUjQhY2ZrEVaMQ0X3k0UYYlZrElcUczXkAiUZQGLogjcyHDSn4hTZQWPWMld3TUXmc1UOgFQowjLyHDSn4BdgASTxb0bqwVX3fjPLQmKogjY2X0X5gSUgc1YW8DZDkFSxLiPLglK3IlaEYjXqASZHY2LBwDZtfmXz.iUgsVTsIFMvjFR1MiTMglKngEMAcEV40zUOglKogjYHYkV1giQgcVRW8DZtjFR0MyPOUmdTIEQqoFUqAiUXYWPWoEciYUTzEUahQCMC8TSqQTTIkTUYMWQFIlcqwVXsUkZgoWRWQlYTwVXmkjQgsVTV8DZDkFRl4xUXgWQVE1ZQcUV3sFQYgCRngUcicDU00zUZo2ZwDFcAUEV3UjUgglK3gkaEwVXzUkQggCRRwjLHIDRyUULhkWQwj0ZQUEY1UkUOgFQogjY5EiXnASZHcGVogjY1EiXnASZHMGQogTN1M0TIEEURIUUVE1YAcjXuQSLYMTUsIVLUYDRuQiQhASTxb0bqwVX3fjPLQmKogjYpwVX1U0QiUFLVg0LvjFR2gTdMQmKogjY2X0X5gSUg8FMV8DZtj1R1gjPHUWUGMVYvXEVy.SZHcGR40DctjFRlwzQZcVPWkENHIDSz4RZHYFSWQ1bvXUV5kzUjgCRBwDcTkFRlgjUjYWQwHVdvjFR1gjPHg1ZFIVc2YEV3ASZHYGR3sTN1k2RMsFQQkTRUk0bEYjX1sFag0VUpEldIcEY4X2TSkTTTIkTUYUXmEzQh8FMwjUQzXzX3s1QHsFMVgEZ2YUVpASZHcGRBgjcEwlXmAiUYoWUrIVRQY0SnAUahsFLwDlb3DCU1UkUYoVRBgTZmYEVzQiUYIGLogzcHIDRyUULhkWQwj0ZQUEY1UkUOgFQogjY5EiXnASZHMiKogjY1EiXnASZHMGQogTN1M0TIEEURIUUVE1YAcjXuQSLYMTUsIVLUYDRuQiQhASTxb0bqwVX3fjPLQmKogjYpwVX1U0QiUFLVg0LvjFR2gTdMQmKogjY2X0X5gSUg8FMV8DZtj1R1gjPHUWUGMVYvXEVy.SZHcGR40DctjFRlwzQZcVPWkENHIDSz4RZHYFSWQ1bvXUV5kzUjgCRBwDcTkFRlgjUjYWQwHVdvjFR1gjPHg1ZFIVc2YEV3ASZHYGR3sTN1k2RMsFQQkTRUk0bEYjX1sFag0VUpEldIcEY4X2TSkTTTIkTUYUXmEzQh8FMwjUQzXzX3s1QHsFMVgEZ2YUVpASZHcGRBgjcEwlXmAiUYoWUrIVRQY0SnomUX8FMrUUc2Y0XyUEaHYFSFo0YzvVXqcmUOgFQ40DZtHUXq0jLhc1XVkEUqcjXqASZHcGRBgzbM0FV3fDdMglKBEVdIY0SnomTLg1LC8TSqQTTIkTUYMWQFIlcqwVXs0DUigWVWkkYpwVX1U0QiUFLVoEcvjFR1MiPLglKRoEcAc0X5gSUgc1YW8DZDkFSxLiPLglK3EFLQIyUysFaggCRBwDctjFRlciUioGNUE1Ymc0SnQTZLIyLBwDZtfmXtUjQhsFLogjcyHDSn4BdhQCLVE1ZQ0lXz.SZHY2LR0DZtfFVzDzUXkWSW8DZtjFRlgjUZYGNFE1YIc0Sn4RZHU2LC8Tc5QkTDslZTsFLVgkcAckVzMlUQQWTsIFMzLzSMsFQQkTRUk0bEYjX1sFag0VUpEldIcEYlQEagcVRFE1ZQY0SnQTZHYlKWgEdEYUXqE0UYg2ZDkENHIjXmQiQTUWTsgjYLYjVmQCags1cV8DZDkWSn4hTgsVSxH1YiYUVTs1QhsFLogzcHIDRy0TaXgCRRwjcHIDRx0TaXgCRRszcHg1S2nGURQzZpQ0ZvXEV1EzUZQ2Xw.ELI01XqEjTZQWPWMld3TUXuQiUOglKosjcHIDRuQiQhASTxb0bEYDY3fjTLgmXosjcHIDR0U0QiUFLVoEcvjFR1MiPLglK3EFLQIyUyUjQjgCRRwDdhk1R1gjPHk2YVgkcUY0Sn4RZKYGRBgTdqcUXyUkQig2ZW8DZtj1RvfjPHg1ZGI1YMIiX3fjPLglKng0aAISXxUDahgCRBwDZ2f1S2biTSkTTTIkTUYUXmEzQh8FMwjUQzXzX3sVaOcidTIEQqoFUqAiUXYWPWoEciYUTzEUahQSPRkEcEwFVxUkQYgCRRwDZtHjXmkzUXMWUFM1ZIckTpASZHgWUrM1ZI0FVMslQjglK3gkaEwVXzUkQggCRRwjLHIDRyUULhkWQwj0ZQUEY1UkUOgFQogjY5EiXnASZHQiKogjY1EiXnASZHMGQogTN1M0TIEEURIUUVE1YAcjXuQSLYMTUsIVLUYDRuQiQhASTxb0bqwVX3fjPLQmKogjYpwVX1U0QiUFLVg0LvjFR2gTdMQmKogjY2X0X5gSUg8FMV8DZtj1R1gjPHUWUGMVYvXEVy.SZHcGR40DctjFRlwzQZcVPWkENHIDSz4RZHYFSWQ1bvXUV5kzUjgCRBwDcTkFRlgjUjYWQwHVdvjFR1gjPHg1ZFIVc2YEV3ASZHYGR3sTN1k2RMsFQQkTRUk0bEYjX1sFag0VUpEldIcEY4X2TSkTTTIkTUYUXmEzQh8FMwjUQzXzX3s1QHsFMVgEZ2YUVpASZHcGRBgjcEwlXmAiUYoWUrIVRQY0SnQTLXkVSEMFM2YUVn4BdX4VQrEFcUYTX3fjTLICRBgzbUEiX4UTLYsVTUQlcUY0SnQTZHYldwHFZvjFR2YVZHYlcwHFZvjFRyQTZHkicSMURQQkTRUkUgcVPGI1azDSVCUUahESUFgzazXjXvDkLWM2ZrEFNHIDSz4RZHYlZrElcUczXkAiUXMCLogzcHkWSz4RZHY1MVMld3TUXuQiUOglKosjcHIDR0U0QiUFLVg0LvjFR2gTdMQmKogjYLcjVmEzUYgCRBwDctjFRlwzUjMGLVkkdIcEY3fjPLQGUogjYHYEY1UTLhkGLogjcHIDRnslQhU2cVgEdvjFR1gDdKkic4sTSqQTTIkTUYMWQFIlcqwVXsUkZgoWRWQVN1M0TIEEURIUUVE1YAcjXuQSLYUDMFMFdqcDRqQiUXg1cVkkZvjFR2gjPHYWQrI1YvXUV5UEahkTTV8DZLc0X4E0UX8FMrgjYLYjVmQCags1cV8DZDkWSn4hTgsVSxH1YiYUVTs1QhsFLogzcHIDRy0TaXgCRn0jdHIDRx0TaXgCRRszcHg1S2nGURQzZpQ0ZvXEV1EzUZQ2Xw.ELI01XqEjTZQWPWMld3TUXuQiUOglKosjcHIDRuQiQhASTxb0bEYDY3fjTLgmXosjcHIDR0U0QiUFLVoEcvjFR2MiPLglK3EFLQIyUyUjQjgCRRwDdhk1R1gjPHk2YVgkcUY0Sn4RZKQiZCwjctLDS14xTNACSo0jLPkGS3gjPHk2ZWE1bUYzX3s1UOglKosDLHIDRns1QhcVSxHFNHIDSn4BZX8VPxDlbEwlX3fjPLg1Mn8zM2H0TIEEURIUUVE1YAcjXuQSLYUDMFMFdq01S2nGURQzZpQ0ZvXEV1EzUZQ2XVEEcQ0lXzDjTYQWQrgkbUYTV3fjTLglKBI1YIcEVyUkQisVRWIkZvjFRPsFajUSTvDFcUwFRlwjQZcFMrE1Z2Y0SnQTdMglKRE1ZMIiXmMlUYQ0ZGI1ZvjFR2gjPHMWSsgENHIESwfjPHIWSsgENHI0R2gDZOcidTIEQqoFUqAiUXYWPWoEciECTvjTaisVPRoEcAc0X5gSUg8FMV8DZtj1R1gjPH8FMFIFLQIyUyUjQjgCRRwDdhk1R1gjPHUWUGMVYvXkVzASZHY2LBwDZtfWXvDkLWMWQFQFNHIES3IVZKYGRBgTdmYEV1UkUOglKosjcHIDR4s1UgMWUFMFdqc0Sn4RZKACRBgDZqcjXm0jLhgCRBwDZtfFVuEjLgIWQrIFNHIDSncCZOcyMRMURQQkTRUkUgcVPGI1azDSVEQiQig2Zs8zM5QkTDslZTsFLVgkcAckVzMlUQQWTsIFMAIUVzUDaXIWUFkENHIESn4hPhcVRWg0bUYzXqkzURoFLogjc3XTXzDzQZUGMVQFTEwlXmACaHYFSFo0YzvVXqcmUOgFQ40DZtHUXq0jLhc1XVkEUqcjXqASZHcGRBgzbM0FV3fjPNcGRBgjbM0FV3fjTKcGRn8zM5QkTDslZTsFLVgkcAckVzMVLPASRsM1ZAIkVzEzUioGNUE1azX0Sn4RZKYGRBgzazXjXvDkLWMWQFQFNHIES3IVZKYGRBgTcUczXkAiUZQGLogjcyHDSn4BdgASTxb0bEYDY3fjTLgmXosjcHIDR4clUXYWUV8DZtj1R1gjPHk2ZWE1bUYzX3s1UOglKosDLHIDRns1QhcVSxHFNHIDSn4BZX8VPxDlbEwlX3fjPLg1Mn8zM2H0TIEEURIUUVE1YAcjXuQSLYUDMFMFdq01S2nGURQzZpQ0ZvXEV1EzUZQ2XVEEcQ0lXzDjTYQWQrgkbUYTV3fjTLglKBI1YIcEVyUkQisVRWIkZvjFRtUDahMGNrE1aMEiXPUDahcFLrgjYLYjVmQCags1cV8DZDkWSn4hTgsVSxH1YiYUVTs1QhsFLogzcHIDRy0TaXgCR30zLHIDRx0TaXgCRRszcHg1S2nGURQzZpQ0ZvXEV1EzUZQ2Xw.ELI01XqEjTZQWPWMld3TUXuQiUOglKosjcHIDRuQiQhASTxb0bEYDY3fjTLgmXosjcHIDR0U0QiUFLVoEcvjFR1MiPLglK3EFLQIyUyUjQjgCRRwDdhk1R1gjPHk2YVgkcUY0Sn4RZKYGRBgTdqcUXyUkQig2ZW8DZtj1RvfjPHg1ZGI1YMIiX3fjPLglKng0aAISXxUDahgCRBwDZ2f1S2biTSkTTTIkTUYUXmEzQh8FMwjUQzXzX3sVaOcidTIEQqoFUqAiUXYWPWoEciYUTzEUahQSPRkEcEwFVxUkQYgCRRwDZtHjXmkzUXMWUFM1ZIckTpASZHoWRWk0b3XTX0ETUXgWQVEFZtfGVtUDagQWUFEFNHIESn4hTgsVSxH1YiYUVTs1QhsFLogzcHIDRy0TaXgCR30DMHIDRx0TaXgCRRszcHg1S2nGURQzZpQ0ZvXEV1EzUZQ2Xw.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.idgoVUrgjYXcEVxU0UYgCRBwDctjFR0MyPOAUQrI1YvXUV5UEahYlKWgEdEYUXqE0UYg2ZDkENHglX0giUg0DNFkEL2YEV5sVLgQGNpE1SYwVVn4BZic1cVM1ZvjFR2MiPLg1Mn8zMtTEV3UjUgsVTWkEdAIjXmkzUXMWUFM1ZIckTpASZHgGNwD1bQQkV4E0UXQWSVkkPUYzXxTkUYQGLToUZM0FRlg0UXIWUWkENHIESxLiPLg1Mn8zM2HDUmkzUXMWUFM1ZIIiX4XWdKIENwD1bzLzSRgSLgMWPRokZvjFRocWLgkWUVM0aMEyU3gSLgMWRBgDcEYUXqASZHMzcwDVdUEyUMsVLXUVRvDVcvvFRlQkLhsVRW8DZtjFRlQkQY8VTWgEZ2YUV3fjPLglKRgUZQckVwTkUOglKogTN1MDUmkzUXMWUFM1ZIIiX4X2PTcVRWg0bUYzXqkzQHYWQrI1YvXUV5UEahkTTV8DZHISX0ASLT81aWkUdIIDRwTjQgASUV8DZtj1R1gDdKkicCQ0YIcEVyUkQisVRGgjcEwlXmAiUYoWUrIVRQY0SngjLgUGLVAEZMISX3EzQi8FNrEVSEYzXqkzUZc1cwHFZtf1XmcmUisFLogjcyHDSncCZOciKUgEdEYUXqE0UYgWPBI1YIcEVyUkQisVRWIkZvjFR3gSLgM2cToUdQcUVzUEahAENwH1aQckV0QCaHYFVWgkbUcUV3fDdLQmKogTcyLzSPUDahcFLVkkdUwlXl4xUXgWQVE1ZQcUV3sFQYgCRnIVc3XUXSgiUigWSVkEQUYTXms1USUWTVkEZtf1XmcmUisFLogjcyHDSncCZOciKUgEdEYUXqE0UYgWPBI1YIcEVyUkQisVRWIkZvjFR3gSLgMGL5ElZUcTXmE0UZUGMwLEc3nVVrkjPHESQFEFLUY0Sn4RZKYGR3sTN1MDUmkzUXMWUFM1ZIcDR1UDahcFLVkkdUwlXIEkUOgFRxDVcvXTTu0zQicFMwf0ZIQUV5M1UYsFMVM0aMEiXn4BZic1cVM1ZvjFR2IVZKYGR3sTN1k2RPUDahcFLVkkdUwlX4QyPOUGRvDVcvv1S2bCZTUGNVEVdzLzS0gDLgUGLwHVSEwVXmMlUYgGMC8TcHISX0ASLh8FLVMlbEYzX0kTaOciKxDVdqYzXugCag8FMwjUN1MjXmkzUXMWSs8zMtTETRUDUSYlZFkENHglX0giUgMENVMFdMYUVAQSLYIWUrgjYXcEVxU0UYgCRR4jcyHDSncCZOciKUAkTEQ0TlolQYgCRnIVc3XUXSgiUigWSVkEQqEiX5UDagkVUrgjYXcEVxU0UYgCR3wDctjFR0MyPOUmKWgEdEYUX4QyPOUmKxDVdqYzXugCag8FMwjUN1k2R1kjLg0VRWg0bzLzS4giUigWSVk0azvVV0EjTgcFMVMFaEECV5UUahsVRW8DZDQ0XpsVLgUFL5ElZUYTXuQSLYglKRE1YqwVXTUkQjoGLogzPUYTXxgCaHYFTxDlcQUUVyD0UOglYWwDZtfFV0E0QiUGLFU0ZmczX3fjTR4TSEUkTzHESn4BdXU2cwDFLIc0SngEaYsVSVgkZIkFVn4BdXUGLFIVczXUVzEkLT81aWkENHIDSn4BdhsVSFM1a3vVXMgiQYsFLogjcHg2R4XWdKk2XWg0bzLjKt3hKt3hKt3hKtXlTU0DUQAURWoULEYzXqEEUXoWQF4RPDYFTzDzUXkWSG4RPDYmKtnWPt3hKt3hKt3hKJUELPUTPqI1aYcEV5UkQQcVTWgEOujzPu0Fbu4VYtQmO77hUSQ0LPwVcmklaSQWXzUlO.."
                                    },
                                    "fileref": {
                                        "name": "SWAM Cello 3",
                                        "filename": "SWAM Cello 3_20260430.maxsnap",
                                        "filepath": "~/Documents/Max 9/Snapshots",
                                        "filepos": -1,
                                        "snapshotfileid": "bd5634ba4593571aba6959af3fbfd5e7"
                                    }
                                }
                            ]
                        }
                    },
                    "text": "vst~ \"SWAM Cello 3\"",
                    "varname": "vst~[1]",
                    "viewvisibility": 0
                }
            },
            {
                "box": {
                    "id": "obj-24",
                    "maxclass": "toggle",
                    "numinlets": 1,
                    "numoutlets": 1,
                    "outlettype": [ "int" ],
                    "parameter_enable": 0,
                    "patching_rect": [ 657.0, 626.0, 24.0, 24.0 ]
                }
            },
            {
                "box": {
                    "id": "obj-25",
                    "maxclass": "toggle",
                    "numinlets": 1,
                    "numoutlets": 1,
                    "outlettype": [ "int" ],
                    "parameter_enable": 0,
                    "patching_rect": [ 507.0, 624.0, 24.0, 24.0 ]
                }
            },
            {
                "box": {
                    "id": "obj-30",
                    "maxclass": "toggle",
                    "numinlets": 1,
                    "numoutlets": 1,
                    "outlettype": [ "int" ],
                    "parameter_enable": 0,
                    "patching_rect": [ 448.0, 624.0, 24.0, 24.0 ]
                }
            },
            {
                "box": {
                    "id": "obj-18",
                    "maxclass": "toggle",
                    "numinlets": 1,
                    "numoutlets": 1,
                    "outlettype": [ "int" ],
                    "parameter_enable": 0,
                    "patching_rect": [ 686.0, 626.0, 24.0, 24.0 ]
                }
            },
            {
                "box": {
                    "id": "obj-16",
                    "maxclass": "toggle",
                    "numinlets": 1,
                    "numoutlets": 1,
                    "outlettype": [ "int" ],
                    "parameter_enable": 0,
                    "patching_rect": [ 536.0, 624.0, 24.0, 24.0 ]
                }
            },
            {
                "box": {
                    "id": "obj-9",
                    "maxclass": "toggle",
                    "numinlets": 1,
                    "numoutlets": 1,
                    "outlettype": [ "int" ],
                    "parameter_enable": 0,
                    "patching_rect": [ 477.0, 624.0, 24.0, 24.0 ]
                }
            },
            {
                "box": {
                    "id": "obj-6",
                    "maxclass": "toggle",
                    "numinlets": 1,
                    "numoutlets": 1,
                    "outlettype": [ "int" ],
                    "parameter_enable": 0,
                    "patching_rect": [ 418.0, 624.0, 24.0, 24.0 ]
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
                    "patching_rect": [ 418.0, 596.0, 196.5999999999999, 22.0 ],
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
                    "patching_rect": [ 418.0, 472.0, 24.0, 114.0 ],
                    "shape": 1,
                    "size": 7,
                    "style": "rnbohighcontrast",
                    "value": 0
                }
            },
            {
                "box": {
                    "id": "obj-26",
                    "maxclass": "newobj",
                    "numinlets": 1,
                    "numoutlets": 1,
                    "outlettype": [ "signal" ],
                    "patching_rect": [ 118.0, 82.0, 46.0, 22.0 ],
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
                    "patching_rect": [ 47.0, 82.0, 46.0, 22.0 ],
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
                    "patching_rect": [ 92.0, 299.0, 48.0, 136.0 ],
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
                    "patching_rect": [ 92.0, 767.0, 40.0, 22.0 ],
                    "text": "polish"
                }
            },
            {
                "box": {
                    "id": "obj-139",
                    "maxclass": "newobj",
                    "numinlets": 1,
                    "numoutlets": 0,
                    "patching_rect": [ 167.0, 736.0, 74.0, 22.0 ],
                    "text": "s~ fx-chain2"
                }
            },
            {
                "box": {
                    "id": "obj-138",
                    "maxclass": "newobj",
                    "numinlets": 1,
                    "numoutlets": 0,
                    "patching_rect": [ 93.0, 736.0, 74.0, 22.0 ],
                    "text": "s~ fx-chain1"
                }
            },
            {
                "box": {
                    "id": "obj-23",
                    "maxclass": "message",
                    "numinlets": 2,
                    "numoutlets": 1,
                    "outlettype": [ "" ],
                    "patching_rect": [ 374.0, 745.0, 78.15789484977722, 22.0 ],
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
                    "patching_rect": [ 317.0, 745.0, 50.0, 22.0 ],
                    "text": "B'"
                }
            },
            {
                "box": {
                    "id": "obj-5",
                    "maxclass": "newobj",
                    "numinlets": 3,
                    "numoutlets": 3,
                    "outlettype": [ "", "", "" ],
                    "patching_rect": [ 348.0, 711.0, 188.63157868385315, 22.0 ],
                    "text": "route face algorithm"
                }
            },
            {
                "box": {
                    "id": "obj-15",
                    "maxclass": "newobj",
                    "numinlets": 1,
                    "numoutlets": 0,
                    "patching_rect": [ 262.0, 681.0, 145.0, 22.0 ],
                    "text": "udpsend 127.0.0.1 57122"
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
                    "patching_rect": [ 92.0, 681.0, 155.0, 22.0 ],
                    "text": "read xenakube_main.swam"
                }
            },
            {
                "box": {
                    "id": "obj-7",
                    "maxclass": "ezdac~",
                    "numinlets": 2,
                    "numoutlets": 0,
                    "patching_rect": [ 92.0, 490.0, 48.0, 48.0 ]
                }
            },
            {
                "box": {
                    "id": "obj-4",
                    "maxclass": "newobj",
                    "numinlets": 1,
                    "numoutlets": 1,
                    "outlettype": [ "bang" ],
                    "patching_rect": [ 92.0, 681.0, 58.0, 22.0 ],
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
                    "patching_rect": [ 211.0, 595.0, 24.0, 24.0 ]
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
                    "patching_rect": [ 92.0, 540.0, 48.0, 48.0 ]
                }
            },
            {
                "box": {
                    "id": "obj-10",
                    "maxclass": "newobj",
                    "numinlets": 2,
                    "numoutlets": 1,
                    "outlettype": [ "" ],
                    "patching_rect": [ 92.0, 627.0, 32.0, 22.0 ],
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
                    "patching_rect": [ 92.0, 654.0, 274.3589771389961, 22.0 ],
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
                    "patching_rect": [ 105.0, 596.0, 104.0, 22.0 ],
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
                    "destination": [ "obj-41", 0 ],
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
                    "destination": [ "obj-47", 1 ],
                    "source": [ "obj-17", 0 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-3", 0 ],
                    "source": [ "obj-19", 0 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-13", 0 ],
                    "source": [ "obj-2", 1 ]
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
                    "destination": [ "obj-3", 0 ],
                    "source": [ "obj-2", 0 ]
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
                    "destination": [ "obj-34", 0 ],
                    "order": 1,
                    "source": [ "obj-20", 0 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-8", 0 ],
                    "order": 0,
                    "source": [ "obj-20", 0 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-43", 0 ],
                    "source": [ "obj-26", 0 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-8", 0 ],
                    "source": [ "obj-27", 0 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-40", 1 ],
                    "order": 0,
                    "source": [ "obj-29", 1 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-40", 0 ],
                    "order": 0,
                    "source": [ "obj-29", 0 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-7", 1 ],
                    "order": 1,
                    "source": [ "obj-29", 1 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-7", 0 ],
                    "order": 1,
                    "source": [ "obj-29", 0 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-138", 0 ],
                    "source": [ "obj-3", 0 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-139", 0 ],
                    "source": [ "obj-3", 1 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-32", 0 ],
                    "source": [ "obj-33", 1 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-12", 0 ],
                    "source": [ "obj-34", 0 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-40", 0 ],
                    "midpoints": [ 312.5, 474.0, 234.5, 474.0 ],
                    "source": [ "obj-38", 0 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-40", 0 ],
                    "midpoints": [ 234.5, 432.0, 234.5, 432.0 ],
                    "source": [ "obj-39", 0 ]
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
                    "destination": [ "obj-36", 0 ],
                    "source": [ "obj-40", 0 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-42", 0 ],
                    "source": [ "obj-41", 0 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-47", 0 ],
                    "source": [ "obj-42", 0 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-17", 0 ],
                    "source": [ "obj-43", 0 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-29", 0 ],
                    "source": [ "obj-47", 0 ]
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
            },
            {
                "patchline": {
                    "destination": [ "obj-72", 0 ],
                    "source": [ "obj-66", 0 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-16", 0 ],
                    "source": [ "obj-72", 4 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-18", 0 ],
                    "source": [ "obj-72", 6 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-24", 0 ],
                    "source": [ "obj-72", 5 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-25", 0 ],
                    "source": [ "obj-72", 3 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-30", 0 ],
                    "source": [ "obj-72", 1 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-6", 0 ],
                    "source": [ "obj-72", 0 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-9", 0 ],
                    "source": [ "obj-72", 2 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-33", 0 ],
                    "source": [ "obj-8", 1 ]
                }
            }
        ],
        "parameters": {
            "obj-28::obj-16": [ "live.gain~[2]", "live.gain~", 0 ],
            "obj-28::obj-6": [ "live.gain~", "live.gain~", 0 ],
            "obj-28::obj-7": [ "vst~", "vst~", 0 ],
            "obj-29": [ "live.gain~[3]", "live.gain~[3]", 0 ],
            "obj-3": [ "vst~[1]", "vst~[1]", 0 ],
            "obj-47": [ "live.gain~[1]", "live.gain~[1]", 0 ],
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