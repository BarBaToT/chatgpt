from __future__ import annotations

import logging
import traceback

from PySide6.QtCore import QObject, QRunnable, Signal

from video_looper_app.models import ExportSettings
from video_looper_app.services.export_pipeline import ExportPipeline

logger = logging.getLogger(__name__)


class WorkerSignals(QObject):
    progress = Signal(int, str)
    finished = Signal(str)
    error = Signal(str)
    metadata = Signal(dict)


class ExportWorker(QRunnable):
    def __init__(self, pipeline: ExportPipeline, settings: ExportSettings) -> None:
        super().__init__()
        self.pipeline = pipeline
        self.settings = settings
        self.signals = WorkerSignals()

    def run(self) -> None:
        try:
            result = self.pipeline.run(self.settings, progress=self.signals.progress.emit)
            self.signals.finished.emit(str(result))
        except Exception as exc:  # noqa: BLE001
            logger.exception("Export job failed")
            message = "\n".join([str(exc), traceback.format_exc(limit=10)])
            self.signals.error.emit(message)
