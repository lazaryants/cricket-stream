from collections import deque
from datetime import datetime, timezone
from typing import Literal


LogSource = Literal[
    "system",
    "ffmpeg",
    "streamlink",
    "stdout",
]

LogLevel = Literal[
    "debug",
    "info",
    "warning",
    "error",
]


class StreamLogBuffer:
    def __init__(
        self,
        max_lines: int = 1000,
    ) -> None:
        self.logs: dict[
            int,
            deque[dict[str, str]],
        ] = {}
        self.max_lines = max_lines

    def add(
        self,
        stream_id: int,
        message: str,
        source: LogSource | None = None,
        level: LogLevel | None = None,
    ) -> None:
        """
        Добавляет строку в кольцевой буфер.

        Параметры source и level необязательны, чтобы
        старые вызовы вида add(stream_id, message)
        продолжали работать.
        """
        normalized_message = message.strip()

        if not normalized_message:
            return

        detected_source = (
            source
            or self._detect_source(
                normalized_message
            )
        )

        detected_level = (
            level
            or self._detect_level(
                normalized_message
            )
        )

        if stream_id not in self.logs:
            self.logs[stream_id] = deque(
                maxlen=self.max_lines
            )

        self.logs[stream_id].append(
            {
                "time": datetime.now(
                    timezone.utc
                ).isoformat(),
                "source": detected_source,
                "level": detected_level,
                "message": normalized_message,
            }
        )

    def get(
        self,
        stream_id: int,
        limit: int = 100,
        source: LogSource | None = None,
        level: LogLevel | None = None,
    ) -> list[dict[str, str]]:
        """
        Возвращает последние строки.

        При необходимости результат можно фильтровать
        по источнику и уровню.
        """
        logs = self.logs.get(
            stream_id
        )

        if not logs:
            return []

        result = list(logs)

        if source is not None:
            result = [
                item
                for item in result
                if item["source"] == source
            ]

        if level is not None:
            result = [
                item
                for item in result
                if item["level"] == level
            ]

        safe_limit = max(
            1,
            min(limit, self.max_lines),
        )

        return result[-safe_limit:]

    def clear(
        self,
        stream_id: int,
    ) -> None:
        self.logs.pop(
            stream_id,
            None,
        )

    @staticmethod
    def _detect_source(
        message: str,
    ) -> LogSource:
        lowered = message.lower()

        if lowered.startswith(
            "[streamlink]"
        ):
            return "streamlink"

        if lowered.startswith(
            "[stderr]"
        ):
            return "ffmpeg"

        if lowered.startswith(
            "[stdout]"
        ):
            return "stdout"

        if (
            "ffmpeg" in lowered
            or "input pipe" in lowered
        ):
            return "ffmpeg"

        if (
            "source resolver" in lowered
            or "source pipe" in lowered
        ):
            return "streamlink"

        return "system"

    @staticmethod
    def _detect_level(
        message: str,
    ) -> LogLevel:
        lowered = message.lower()

        error_markers = (
            "error",
            "failed",
            "failure",
            "fatal",
            "invalid",
            "refused",
            "forbidden",
            "unauthorized",
            "not found",
            "no playable streams",
            "timed out",
            "timeout",
            "broken pipe",
            "unexpectedly",
            "connection reset",
            "network is unreachable",
            "server returned 4",
            "server returned 5",
        )

        warning_markers = (
            "warning",
            "warn",
            "retry",
            "reconnect",
            "reconnecting",
            "temporarily unavailable",
            "input pipe was closed",
            "deprecated",
            "non-monotonous",
            "queue input is backward",
            "dropping",
        )

        debug_markers = (
            "[stdout]",
            "frame=",
            "fps=",
            "bitrate=",
            "speed=",
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

        if any(
            marker in lowered
            for marker in debug_markers
        ):
            return "debug"

        return "info"


log_buffer = StreamLogBuffer()
