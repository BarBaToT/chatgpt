from __future__ import annotations

from dataclasses import dataclass
from enum import Enum
from pathlib import Path


class LoopMode(str, Enum):
    NORMAL = "normal"
    REVERSE = "reverse"
    CROSSFADE = "crossfade"


@dataclass(slots=True)
class ExportSettings:
    input_path: Path
    output_path: Path
    real_esrgan_path: Path | None
    ffmpeg_path: str
    ffprobe_path: str
    target_duration: float
    fps: int
    scale_factor: int
    crf: int
    audio_bitrate: str
    loop_mode: LoopMode
    crossfade_duration: float
    keep_audio: bool
    preview_width: int = 640
    preview_height: int = 360


@dataclass(slots=True)
class VideoMetadata:
    duration: float
    width: int
    height: int
    fps: float
    has_audio: bool
    audio_codec: str | None = None
    video_codec: str | None = None
