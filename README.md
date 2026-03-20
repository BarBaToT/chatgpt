# Video Loop Studio

Video Loop Studio is a local desktop application for turning short clips into polished longer-form videos. It provides a professional PySide6 UI for previewing a source video, configuring loop behavior, exporting with FFmpeg, and optionally upscaling the final output with Real-ESRGAN.

## Features

- Load a short source video and preview playback inside the desktop app.
- Extend the clip to a target duration using one of three loop modes:
  - **Normal**: straightforward repeated playback.
  - **Reverse**: alternates forward and reversed segments for a boomerang effect.
  - **Crossfade**: blends adjacent loops using FFmpeg's `xfade` filter.
- Preserve and loop source audio when available.
- Upscale the export with Real-ESRGAN using the anime video model.
- Keep the UI responsive with QRunnable-based background workers.
- Monitor progress and detailed logs directly in the app.

## Project Structure

```text
src/video_looper_app/
├── main.py                  # Application entrypoint
├── models.py                # Shared dataclasses and loop mode enum
├── services/
│   ├── export_pipeline.py   # Orchestrates looping + upscaling + final copy
│   ├── ffmpeg_service.py    # FFmpeg/FFprobe helpers
│   └── upscale_service.py   # Real-ESRGAN wrapper
├── ui/
│   └── main_window.py       # Main desktop UI
├── utils/
│   └── logging_utils.py     # Central logging config
└── workers/
    └── export_worker.py     # Background export worker
```

## Requirements

Install these local tools before running exports:

1. **Python 3.11+**
2. **FFmpeg** with `ffmpeg` and `ffprobe` available on `PATH`
3. **Real-ESRGAN NCNN Vulkan** executable (`realesrgan-ncnn-vulkan`) or a manually selected binary path from the UI

## Setup

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
pip install -e .
```

## Run

```bash
python -m video_looper_app
```

Or, after editable install:

```bash
video-loop-studio
```

## Usage

1. Click **Browse** next to **Input video** and choose a short clip.
2. Select or confirm the **Output video** path.
3. Optionally point the app at a custom **Real-ESRGAN** executable.
4. Choose the **target duration**, **loop mode**, **crossfade duration**, **FPS**, **CRF**, and **scale factor**.
5. Click **Export Video**.
6. Follow progress updates in the status bar and logs panel until the export completes.

## Export Pipeline

1. FFprobe inspects the source clip and extracts stream metadata.
2. FFmpeg duplicates the input as many times as necessary to reach the requested duration.
3. The app generates one of these filter graphs:
   - `concat` for normal loops
   - `reverse` + `concat` for boomerang loops
   - `xfade` chains for crossfade loops
4. Optional audio looping is mapped from a separately looped input.
5. If `scale_factor > 1`, Real-ESRGAN upscales the rendered intermediate video.
6. The final output is copied to the user-selected destination.

## Notes

- Real-ESRGAN video upscaling performance depends heavily on GPU/Vulkan support.
- Crossfade mode works best with short seamless clips.
- For production use you may want to add cancellation, richer ETA reporting, and better validation for Real-ESRGAN models installed on your machine.
