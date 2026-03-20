from __future__ import annotations

import logging
import shutil
import tempfile
from pathlib import Path

from video_looper_app.models import ExportSettings
from video_looper_app.services.ffmpeg_service import FFmpegService
from video_looper_app.services.upscale_service import UpscaleService

logger = logging.getLogger(__name__)


class ExportPipeline:
    def __init__(self, ffmpeg_service: FFmpegService, upscale_service: UpscaleService) -> None:
        self.ffmpeg_service = ffmpeg_service
        self.upscale_service = upscale_service

    def run(self, settings: ExportSettings, progress: callable | None = None) -> Path:
        self.ffmpeg_service.validate_binaries()
        if progress:
            progress(5, "Validated FFmpeg binaries.")

        with tempfile.TemporaryDirectory(prefix="video_looper_") as tmp:
            temp_dir = Path(tmp)
            looped_path = self.ffmpeg_service.render_loop(settings, temp_dir, progress=progress)

            final_source = looped_path
            if settings.scale_factor > 1:
                upscaled_path = temp_dir / "upscaled.mp4"
                final_source = self.upscale_service.upscale(looped_path, upscaled_path, settings.scale_factor, progress=progress)

            shutil.copy2(final_source, settings.output_path)
            if progress:
                progress(100, f"Export saved to {settings.output_path}")
            logger.info("Export finished: %s", settings.output_path)
            return settings.output_path
