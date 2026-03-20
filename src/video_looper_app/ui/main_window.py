from __future__ import annotations

import logging
from pathlib import Path

from PySide6.QtCore import QThreadPool, Qt, QUrl
from PySide6.QtGui import QAction, QDesktopServices
from PySide6.QtMultimedia import QAudioOutput, QMediaPlayer
from PySide6.QtMultimediaWidgets import QVideoWidget
from PySide6.QtWidgets import (
    QFileDialog,
    QFormLayout,
    QGroupBox,
    QHBoxLayout,
    QLabel,
    QLineEdit,
    QMainWindow,
    QMessageBox,
    QPlainTextEdit,
    QProgressBar,
    QPushButton,
    QComboBox,
    QSpinBox,
    QDoubleSpinBox,
    QCheckBox,
    QStatusBar,
    QTextEdit,
    QVBoxLayout,
    QWidget,
)

from video_looper_app.models import ExportSettings, LoopMode
from video_looper_app.services.export_pipeline import ExportPipeline
from video_looper_app.services.ffmpeg_service import FFmpegService
from video_looper_app.services.upscale_service import UpscaleService
from video_looper_app.workers.export_worker import ExportWorker

logger = logging.getLogger(__name__)


class QtLogHandler(logging.Handler):
    def __init__(self, sink: QTextEdit) -> None:
        super().__init__()
        self.sink = sink

    def emit(self, record: logging.LogRecord) -> None:
        self.sink.appendPlainText(self.format(record))


class MainWindow(QMainWindow):
    def __init__(self) -> None:
        super().__init__()
        self.thread_pool = QThreadPool.globalInstance()
        self.input_path: Path | None = None
        self.output_path: Path | None = None
        self._build_ui()
        self._configure_logging()
        self._connect_preview()

    def _build_ui(self) -> None:
        self.setWindowTitle("Video Loop Studio")
        self.resize(1360, 860)
        self.setStatusBar(QStatusBar())

        open_action = QAction("Open Export Folder", self)
        open_action.triggered.connect(self._open_output_folder)
        self.menuBar().addAction(open_action)

        root = QWidget()
        layout = QHBoxLayout(root)
        layout.setContentsMargins(12, 12, 12, 12)
        layout.setSpacing(12)

        preview_group = QGroupBox("Preview")
        preview_layout = QVBoxLayout(preview_group)
        self.video_widget = QVideoWidget()
        self.video_widget.setMinimumSize(800, 450)
        self.preview_placeholder = QLabel("Load a source video to begin.")
        self.preview_placeholder.setAlignment(Qt.AlignCenter)
        self.preview_image = QLabel()
        self.preview_image.setAlignment(Qt.AlignCenter)
        self.preview_image.setMinimumHeight(220)
        preview_layout.addWidget(self.video_widget, stretch=3)
        preview_layout.addWidget(self.preview_placeholder)
        preview_layout.addWidget(self.preview_image, stretch=1)

        controls_group = QGroupBox("Project Settings")
        controls_layout = QVBoxLayout(controls_group)

        form = QFormLayout()
        self.input_edit = QLineEdit()
        self.output_edit = QLineEdit()
        self.realesrgan_edit = QLineEdit()
        self.ffmpeg_edit = QLineEdit("ffmpeg")
        self.ffprobe_edit = QLineEdit("ffprobe")
        self.duration_spin = QDoubleSpinBox()
        self.duration_spin.setRange(1.0, 600.0)
        self.duration_spin.setValue(30.0)
        self.duration_spin.setSuffix(" s")
        self.crossfade_spin = QDoubleSpinBox()
        self.crossfade_spin.setRange(0.1, 10.0)
        self.crossfade_spin.setValue(0.5)
        self.crossfade_spin.setSuffix(" s")
        self.loop_mode_combo = QComboBox()
        self.loop_mode_combo.addItems([mode.value for mode in LoopMode])
        self.scale_spin = QSpinBox()
        self.scale_spin.setRange(1, 4)
        self.scale_spin.setValue(2)
        self.fps_spin = QSpinBox()
        self.fps_spin.setRange(1, 120)
        self.fps_spin.setValue(30)
        self.crf_spin = QSpinBox()
        self.crf_spin.setRange(0, 40)
        self.crf_spin.setValue(18)
        self.audio_bitrate_edit = QLineEdit("192k")
        self.keep_audio_check = QCheckBox("Loop and keep source audio when available")
        self.keep_audio_check.setChecked(True)

        form.addRow("Input video", self._path_row(self.input_edit, self._choose_input))
        form.addRow("Output video", self._path_row(self.output_edit, self._choose_output))
        form.addRow("Real-ESRGAN", self._path_row(self.realesrgan_edit, self._choose_realesrgan))
        form.addRow("FFmpeg binary", self.ffmpeg_edit)
        form.addRow("FFprobe binary", self.ffprobe_edit)
        form.addRow("Target duration", self.duration_spin)
        form.addRow("Loop mode", self.loop_mode_combo)
        form.addRow("Crossfade duration", self.crossfade_spin)
        form.addRow("Scale factor", self.scale_spin)
        form.addRow("Output FPS", self.fps_spin)
        form.addRow("H.264 CRF", self.crf_spin)
        form.addRow("Audio bitrate", self.audio_bitrate_edit)
        form.addRow("Audio", self.keep_audio_check)

        self.metadata_label = QLabel("Metadata: No file selected")
        self.metadata_label.setWordWrap(True)
        self.progress_bar = QProgressBar()
        self.progress_bar.setRange(0, 100)
        self.export_button = QPushButton("Export Video")
        self.export_button.clicked.connect(self.start_export)

        self.log_output = QPlainTextEdit()
        self.log_output.setReadOnly(True)
        self.log_output.setPlaceholderText("Pipeline logs will appear here.")
        self.log_output.setMinimumHeight(240)

        controls_layout.addLayout(form)
        controls_layout.addWidget(self.metadata_label)
        controls_layout.addWidget(self.progress_bar)
        controls_layout.addWidget(self.export_button)
        controls_layout.addWidget(self.log_output, stretch=1)

        layout.addWidget(preview_group, stretch=3)
        layout.addWidget(controls_group, stretch=2)
        self.setCentralWidget(root)

    def _path_row(self, line_edit: QLineEdit, callback) -> QWidget:
        widget = QWidget()
        layout = QHBoxLayout(widget)
        layout.setContentsMargins(0, 0, 0, 0)
        button = QPushButton("Browse")
        button.clicked.connect(callback)
        layout.addWidget(line_edit)
        layout.addWidget(button)
        return widget

    def _configure_logging(self) -> None:
        handler = QtLogHandler(self.log_output)
        handler.setFormatter(logging.Formatter("%(asctime)s | %(levelname)s | %(message)s"))
        logging.getLogger().addHandler(handler)

    def _connect_preview(self) -> None:
        self.audio_output = QAudioOutput(self)
        self.media_player = QMediaPlayer(self)
        self.media_player.setAudioOutput(self.audio_output)
        self.media_player.setVideoOutput(self.video_widget)

    def _choose_input(self) -> None:
        path, _ = QFileDialog.getOpenFileName(self, "Select Input Video", filter="Video Files (*.mp4 *.mov *.mkv *.avi)")
        if not path:
            return
        self.input_path = Path(path)
        self.input_edit.setText(path)
        if not self.output_edit.text():
            suggested = self.input_path.with_name(f"{self.input_path.stem}_looped_upscaled.mp4")
            self.output_path = suggested
            self.output_edit.setText(str(suggested))
        self._load_preview(self.input_path)
        self._load_metadata(self.input_path)

    def _choose_output(self) -> None:
        path, _ = QFileDialog.getSaveFileName(self, "Choose Output Video", filter="MP4 Video (*.mp4)")
        if path:
            self.output_path = Path(path)
            self.output_edit.setText(path)

    def _choose_realesrgan(self) -> None:
        path, _ = QFileDialog.getOpenFileName(self, "Select Real-ESRGAN Executable")
        if path:
            self.realesrgan_edit.setText(path)

    def _load_preview(self, path: Path) -> None:
        self.preview_placeholder.hide()
        self.media_player.setSource(QUrl.fromLocalFile(str(path)))
        self.media_player.play()

    def _load_metadata(self, path: Path) -> None:
        service = FFmpegService(self.ffmpeg_edit.text().strip(), self.ffprobe_edit.text().strip())
        try:
            metadata = service.probe(path)
            self.metadata_label.setText(
                f"Metadata: {metadata.width}x{metadata.height} | {metadata.duration:.2f}s | "
                f"{metadata.fps:.2f} fps | audio={'yes' if metadata.has_audio else 'no'}"
            )
        except Exception as exc:  # noqa: BLE001
            self.metadata_label.setText(f"Metadata: Unable to inspect file ({exc})")

    def _build_settings(self) -> ExportSettings:
        input_path = Path(self.input_edit.text().strip())
        output_path = Path(self.output_edit.text().strip())
        if not input_path.exists():
            raise FileNotFoundError("Select a valid input video.")
        if not output_path.parent.exists():
            output_path.parent.mkdir(parents=True, exist_ok=True)

        return ExportSettings(
            input_path=input_path,
            output_path=output_path,
            real_esrgan_path=Path(self.realesrgan_edit.text().strip()) if self.realesrgan_edit.text().strip() else None,
            ffmpeg_path=self.ffmpeg_edit.text().strip() or "ffmpeg",
            ffprobe_path=self.ffprobe_edit.text().strip() or "ffprobe",
            target_duration=self.duration_spin.value(),
            fps=self.fps_spin.value(),
            scale_factor=self.scale_spin.value(),
            crf=self.crf_spin.value(),
            audio_bitrate=self.audio_bitrate_edit.text().strip() or "192k",
            loop_mode=LoopMode(self.loop_mode_combo.currentText()),
            crossfade_duration=self.crossfade_spin.value(),
            keep_audio=self.keep_audio_check.isChecked(),
        )

    def start_export(self) -> None:
        try:
            settings = self._build_settings()
        except Exception as exc:  # noqa: BLE001
            QMessageBox.critical(self, "Invalid Settings", str(exc))
            return

        self.progress_bar.setValue(0)
        self.export_button.setEnabled(False)
        ffmpeg_service = FFmpegService(settings.ffmpeg_path, settings.ffprobe_path)
        pipeline = ExportPipeline(ffmpeg_service, UpscaleService(settings.real_esrgan_path))
        worker = ExportWorker(pipeline, settings)
        worker.signals.progress.connect(self._on_progress)
        worker.signals.finished.connect(self._on_finished)
        worker.signals.error.connect(self._on_error)
        self.thread_pool.start(worker)
        self.statusBar().showMessage("Export started...")

    def _on_progress(self, value: int, message: str) -> None:
        self.progress_bar.setValue(value)
        self.statusBar().showMessage(message)
        logger.info(message)

    def _on_finished(self, output_path: str) -> None:
        self.export_button.setEnabled(True)
        self.progress_bar.setValue(100)
        self.statusBar().showMessage("Export complete")
        QMessageBox.information(self, "Export Complete", f"Saved to:\n{output_path}")

    def _on_error(self, message: str) -> None:
        self.export_button.setEnabled(True)
        self.statusBar().showMessage("Export failed")
        QMessageBox.critical(self, "Export Failed", message)

    def _open_output_folder(self) -> None:
        output_text = self.output_edit.text().strip()
        if not output_text:
            return
        QDesktopServices.openUrl(QUrl.fromLocalFile(str(Path(output_text).parent)))
