from __future__ import annotations

import json
import logging
import math
import shutil
import subprocess
from pathlib import Path

from video_looper_app.models import ExportSettings, LoopMode, VideoMetadata

logger = logging.getLogger(__name__)


class FFmpegService:
    def __init__(self, ffmpeg_path: str = "ffmpeg", ffprobe_path: str = "ffprobe") -> None:
        self.ffmpeg_path = ffmpeg_path
        self.ffprobe_path = ffprobe_path

    def validate_binaries(self) -> None:
        for binary in (self.ffmpeg_path, self.ffprobe_path):
            if shutil.which(binary) is None:
                raise FileNotFoundError(f"Required binary not found in PATH: {binary}")

    def probe(self, video_path: Path) -> VideoMetadata:
        command = [
            self.ffprobe_path,
            "-v",
            "error",
            "-show_streams",
            "-show_format",
            "-of",
            "json",
            str(video_path),
        ]
        result = subprocess.run(command, check=True, capture_output=True, text=True)
        payload = json.loads(result.stdout)
        streams = payload.get("streams", [])
        format_info = payload.get("format", {})

        video_stream = next((s for s in streams if s.get("codec_type") == "video"), None)
        if video_stream is None:
            raise ValueError("No video stream found in the selected file.")

        audio_stream = next((s for s in streams if s.get("codec_type") == "audio"), None)
        frame_rate_raw = video_stream.get("avg_frame_rate", "0/1")
        numerator, denominator = frame_rate_raw.split("/")
        fps = float(numerator) / float(denominator) if float(denominator) else 0.0

        return VideoMetadata(
            duration=float(format_info.get("duration", 0.0)),
            width=int(video_stream.get("width", 0)),
            height=int(video_stream.get("height", 0)),
            fps=fps,
            has_audio=audio_stream is not None,
            audio_codec=audio_stream.get("codec_name") if audio_stream else None,
            video_codec=video_stream.get("codec_name"),
        )

    def build_loop_filter(self, settings: ExportSettings, metadata: VideoMetadata) -> tuple[str, int]:
        copies = max(1, math.ceil(settings.target_duration / metadata.duration) + 1)
        logger.info("Loop generation will use %s source segments.", copies)

        if settings.loop_mode is LoopMode.NORMAL:
            streams = "".join(f"[{i}:v]" for i in range(copies))
            filter_complex = f"{streams}concat=n={copies}:v=1:a=0[vout]"
            return filter_complex, copies

        if settings.loop_mode is LoopMode.REVERSE:
            parts: list[str] = []
            stream_refs: list[str] = []
            for i in range(copies):
                if i % 2 == 0:
                    stream_refs.append(f"[{i}:v]")
                else:
                    parts.append(f"[{i}:v]reverse[r{i}]")
                    stream_refs.append(f"[r{i}]")
            filter_complex = ";".join(parts + [f"{''.join(stream_refs)}concat=n={copies}:v=1:a=0[vout]"])
            return filter_complex, copies

        fade = min(settings.crossfade_duration, metadata.duration / 2)
        parts = [f"[0:v]settb=AVTB,setpts=PTS-STARTPTS[v0]"]
        last_ref = "[v0]"
        for i in range(1, copies):
            parts.append(f"[{i}:v]settb=AVTB,setpts=PTS-STARTPTS[v{i}]")
            offset = max(0.0, i * metadata.duration - fade * i)
            out_ref = f"[vx{i}]"
            parts.append(f"{last_ref}[v{i}]xfade=transition=fade:duration={fade}:offset={offset}{out_ref}")
            last_ref = out_ref
        parts.append(f"{last_ref}trim=duration={settings.target_duration}[vout]")
        return ";".join(parts), copies

    def render_loop(self, settings: ExportSettings, temp_dir: Path, progress: callable | None = None) -> Path:
        metadata = self.probe(settings.input_path)
        filter_complex, copies = self.build_loop_filter(settings, metadata)
        output = temp_dir / "looped.mp4"

        command = [self.ffmpeg_path, "-y"]
        for _ in range(copies):
            command.extend(["-i", str(settings.input_path)])
        command.extend(
            [
                "-filter_complex",
                filter_complex,
                "-map",
                "[vout]",
            ]
        )

        if settings.keep_audio and metadata.has_audio:
            command.extend([
                "-stream_loop",
                str(max(0, copies - 1)),
                "-i",
                str(settings.input_path),
                "-map",
                f"{copies}:a:0",
                "-t",
                str(settings.target_duration),
                "-c:a",
                "aac",
                "-b:a",
                settings.audio_bitrate,
                "-shortest",
            ])
        else:
            command.append("-an")

        command.extend(
            [
                "-r",
                str(settings.fps),
                "-c:v",
                "libx264",
                "-crf",
                str(settings.crf),
                "-pix_fmt",
                "yuv420p",
                str(output),
            ]
        )
        logger.info("Running FFmpeg loop render: %s", " ".join(command))
        subprocess.run(command, check=True)
        if progress:
            progress(55, "Looped video rendered.")
        return output

    def extract_preview_frame(self, input_path: Path, output_path: Path, width: int = 640) -> Path:
        command = [
            self.ffmpeg_path,
            "-y",
            "-i",
            str(input_path),
            "-vf",
            f"thumbnail,scale={width}:-1",
            "-frames:v",
            "1",
            str(output_path),
        ]
        subprocess.run(command, check=True)
        return output_path
