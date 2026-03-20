from __future__ import annotations

from pathlib import Path

from PySide6.QtWidgets import QApplication

from video_looper_app.ui.main_window import MainWindow
from video_looper_app.utils.logging_utils import configure_logging


def main() -> int:
    log_path = Path.home() / ".video_loop_studio" / "app.log"
    configure_logging(log_path)
    app = QApplication([])
    window = MainWindow()
    window.show()
    return app.exec()
