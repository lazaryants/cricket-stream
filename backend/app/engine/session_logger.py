from __future__ import annotations

import json
import os
import threading
from collections import deque
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from uuid import UUID

from app.engine.logs import log_buffer


DEFAULT_LOG_DIRECTORY = (
    Path(__file__).resolve().parents[3]
    / "var"
    / "session-logs"
)


class SessionLogger:
    """
    Дублирует сообщения в два хранилища:

    1. StreamLogBuffer:
       быстрые live-логи текущего потока;

    2. JSONL-файл:
       постоянная история конкретной StreamSession.

    Один пользовательский запуск соответствует одному UUID
    сессии. Автоматические перезапуски FFmpeg продолжают
    запись в тот же файл.
    """

    def __init__(
        self,
        directory: str | Path | None = None,
    ) -> None:
        configured_directory = (
            directory
            or os.getenv(
                "CRICKET_SESSION_LOG_DIR"
            )
            or DEFAULT_LOG_DIRECTORY
        )

        self.directory = Path(
            configured_directory
        )

        self._write_lock = threading.Lock()

    def _normalize_uuid(
        self,
        session_uuid: UUID | str,
    ) -> str:
        """
        UUID повторно валидируется, чтобы значение нельзя
        было использовать для path traversal.
        """
        return str(
            UUID(str(session_uuid))
        )

    def path_for(
        self,
        session_uuid: UUID | str,
    ) -> Path:
        normalized_uuid = self._normalize_uuid(
            session_uuid
        )

        return (
            self.directory
            / f"{normalized_uuid}.jsonl"
        )

    def _detect_source(
        self,
        message: str,
    ) -> str:
        lowered = message.lower()

        if message.startswith("[streamlink]"):
            return "streamlink"

        if (
            message.startswith("[stderr]")
            or message.startswith("[stdout]")
            or "ffmpeg" in lowered
        ):
            return "ffmpeg"

        if (
            "automatic restart" in lowered
            or "supervisor" in lowered
        ):
            return "supervisor"

        return "engine"

    def _detect_level(
        self,
        message: str,
    ) -> str:
        lowered = message.lower()

        error_markers = (
            "error",
            "failed",
            "unexpectedly",
            "broken pipe",
            "connection reset",
            "force killing",
        )

        warning_markers = (
            "warning",
            "retry",
            "restart scheduled",
            "stopping",
            "exited",
        )

        if any(
            marker in lowered
            for marker in error_markers
        ):
            return "error"

        if any(
            marker in lowered
            for marker in warning_markers
        ):
            return "warning"

        return "info"

    def add(
        self,
        stream_id: int,
        session_uuid: UUID | str,
        message: str,
        *,
        source: str | None = None,
        level: str | None = None,
    ) -> dict[str, Any]:
        """
        Сначала добавляет строку в существующий live-буфер,
        затем делает append в JSONL-файл сессии.

        Ошибка файлового архива не должна останавливать
        видеопоток, поэтому она выводится в stderr backend,
        но не пробрасывается в FFmpegProcess.
        """
        log_buffer.add(
            stream_id,
            message,
        )

        now = datetime.now(
            timezone.utc
        )

        item: dict[str, Any] = {
            "time": now.isoformat(),
            "stream_id": stream_id,
            "session_uuid": (
                self._normalize_uuid(
                    session_uuid
                )
            ),
            "source": (
                source
                or self._detect_source(
                    message
                )
            ),
            "level": (
                level
                or self._detect_level(
                    message
                )
            ),
            "message": message,
        }

        try:
            self._append(
                session_uuid,
                item,
            )
        except Exception as exc:
            print(
                "[SESSION LOGGER] "
                f"write failed "
                f"session={session_uuid} "
                f"stream={stream_id}: {exc}",
                flush=True,
            )

        return item

    def _append(
        self,
        session_uuid: UUID | str,
        item: dict[str, Any],
    ) -> None:
        path = self.path_for(
            session_uuid
        )

        line = json.dumps(
            item,
            ensure_ascii=False,
            separators=(",", ":"),
        )

        with self._write_lock:
            path.parent.mkdir(
                parents=True,
                exist_ok=True,
            )

            with path.open(
                "a",
                encoding="utf-8",
            ) as file:
                file.write(line)
                file.write("\n")

    def get(
        self,
        session_uuid: UUID | str,
        *,
        limit: int = 100,
        source: str | None = None,
        level: str | None = None,
    ) -> list[dict[str, Any]]:
        """
        Возвращает последние подходящие записи.

        Читается только хвост файла через deque, поэтому
        весь многогигабайтный лог в память не загружается.
        """
        safe_limit = max(
            1,
            min(
                int(limit),
                5000,
            ),
        )

        path = self.path_for(
            session_uuid
        )

        if not path.is_file():
            return []

        # При наличии фильтров берём увеличенный хвост.
        # Это не полнотекстовый поиск по гигабайтному файлу,
        # а быстрый endpoint для последних записей UI.
        tail_size = (
            safe_limit
            if source is None and level is None
            else min(
                max(
                    safe_limit * 20,
                    1000,
                ),
                100_000,
            )
        )

        with path.open(
            "r",
            encoding="utf-8",
            errors="replace",
        ) as file:
            lines = deque(
                file,
                maxlen=tail_size,
            )

        items: list[dict[str, Any]] = []

        for line in lines:
            line = line.strip()

            if not line:
                continue

            try:
                item = json.loads(
                    line
                )
            except json.JSONDecodeError:
                # Последняя строка теоретически может быть
                # повреждена при аварийном завершении записи.
                continue

            if (
                source is not None
                and item.get("source") != source
            ):
                continue

            if (
                level is not None
                and item.get("level") != level
            ):
                continue

            items.append(item)

        return items[-safe_limit:]

    def exists(
        self,
        session_uuid: UUID | str,
    ) -> bool:
        return self.path_for(
            session_uuid
        ).is_file()


session_logger = SessionLogger()
