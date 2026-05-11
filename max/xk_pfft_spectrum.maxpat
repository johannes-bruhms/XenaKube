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
    "rect": [120.0, 120.0, 640.0, 360.0],
    "bglocked": 0,
    "openinpresentation": 0,
    "default_fontsize": 12.0,
    "default_fontface": 0,
    "default_fontname": "Arial",
    "gridonopen": 1,
    "gridsize": [15.0, 15.0],
    "gridsnaponopen": 1,
    "objectsnaponopen": 1,
    "statusbarvisible": 2,
    "toolbarvisible": 1,
    "lefttoolbarpinned": 0,
    "toptoolbarpinned": 0,
    "righttoolbarpinned": 0,
    "bottomtoolbarpinned": 0,
    "toolbars_unpinned_last_save": 0,
    "tallnewobj": 0,
    "boxanimatetime": 200,
    "enablehscroll": 1,
    "enablevscroll": 1,
    "devicewidth": 0.0,
    "description": "",
    "digest": "",
    "tags": "",
    "style": "",
    "subpatcher_template": "",
    "assistshowspatchername": 0,
    "boxes": [
      {
        "box": {
          "id": "obj-1",
          "maxclass": "comment",
          "numinlets": 1,
          "numoutlets": 0,
          "patching_rect": [42.0, 24.0, 501.0, 20.0],
          "text": "XenaKube pfft analyzer: writes per-bin magnitudes to buffer~ xk_fft_mag."
        }
      },
      {
        "box": {
          "id": "obj-2",
          "maxclass": "newobj",
          "numinlets": 1,
          "numoutlets": 3,
          "outlettype": ["signal", "signal", "signal"],
          "patching_rect": [60.0, 72.0, 64.0, 22.0],
          "text": "fftin~ 1"
        }
      },
      {
        "box": {
          "id": "obj-3",
          "maxclass": "newobj",
          "numinlets": 2,
          "numoutlets": 2,
          "outlettype": ["signal", "signal"],
          "patching_rect": [60.0, 126.0, 70.0, 22.0],
          "text": "cartopol~"
        }
      },
      {
        "box": {
          "id": "obj-4",
          "maxclass": "newobj",
          "numinlets": 3,
          "numoutlets": 0,
          "patching_rect": [60.0, 180.0, 128.0, 22.0],
          "text": "poke~ xk_fft_mag"
        }
      },
      {
        "box": {
          "id": "obj-5",
          "maxclass": "newobj",
          "numinlets": 2,
          "numoutlets": 1,
          "outlettype": ["signal"],
          "patching_rect": [222.0, 180.0, 65.0, 22.0],
          "text": "fftout~ 1"
        }
      },
      {
        "box": {
          "id": "obj-6",
          "maxclass": "comment",
          "numinlets": 1,
          "numoutlets": 0,
          "patching_rect": [205.0, 126.0, 311.0, 20.0],
          "text": "Magnitude is stored by FFT bin index; parent patch reads bins 0..511."
        }
      }
    ],
    "lines": [
      {
        "patchline": {
          "source": ["obj-2", 0],
          "destination": ["obj-3", 0]
        }
      },
      {
        "patchline": {
          "source": ["obj-2", 1],
          "destination": ["obj-3", 1]
        }
      },
      {
        "patchline": {
          "source": ["obj-3", 0],
          "destination": ["obj-4", 0]
        }
      },
      {
        "patchline": {
          "source": ["obj-2", 2],
          "destination": ["obj-4", 1]
        }
      },
      {
        "patchline": {
          "source": ["obj-2", 0],
          "destination": ["obj-5", 0]
        }
      },
      {
        "patchline": {
          "source": ["obj-2", 1],
          "destination": ["obj-5", 1]
        }
      }
    ]
  }
}
