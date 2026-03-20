from __future__ import annotations

import logging
import shutil
import subprocess
from pathlib import Path

logger = logging.getLogger(__name__)


class UpscaleService:
    def __init__(self, executable: Path | None) -> None:
        self.executable = executable

    def is_available(self) -> bool:
        if self.executable:
            return self.executable.exists()
        return shutil.which("realesrgan-ncnn-vulkan") is not None

    def resolve_executable(self) -> str:
        if self.executable:
            return str(self.executable)
        resolved = shutil.which("realesrgan-ncnn-vulkan")
        if not resolved:
            raise FileNotFoundError("Real-ESRGAN executable not found. Install realesrgan-ncnn-vulkan or choose its path.")
        return resolved

    def upscale(self, input_path: Path, output_path: Path, scale_factor: int, progress: callable | None = None) -> Path:
        executable = self.resolve_executable()
        command = [
            executable,
            "-i",
            str(input_path),
            "-o",
            str(output_path),
            "-s",
            str(scale_factor),
            "-n",
            "realesr-animevideov3",
        ]
        logger.info("Running Real-ESRGAN: %s", " ".join(command))
        subprocess.run(command, check=True)
        if progress:
            progress(85, "Upscaling completed.")
        return output_path
