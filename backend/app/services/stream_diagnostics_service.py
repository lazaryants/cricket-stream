from typing import Any

from app.engine.logs import log_buffer


class StreamDiagnosticsService:
    @staticmethod
    def _running(
        logs: list[dict[str, Any]],
    ) -> dict[str, Any]:
        """
        Активный процесс имеет абсолютный приоритет.

        Старые ошибки могут оставаться в кольцевом буфере
        после автоматического перезапуска FFmpeg, поэтому
        они не должны перекрывать текущее живое состояние.
        """
        return {
            "status": "running",
            "severity": "success",
            "title": "Поток работает",
            "message": (
                "Процесс передачи видео активен. "
                "Старые ошибки предыдущих запусков "
                "не влияют на текущий статус."
            ),
            "time": (
                logs[-1].get("time")
                if logs
                else None
            ),
        }

    @staticmethod
    def _diagnose_log_item(
        item: dict[str, Any],
    ) -> dict[str, Any] | None:
        message = str(
            item.get("message", "")
        )
        lowered = message.lower()
        event_time = item.get("time")

        if (
            "no playable streams" in lowered
            or "no streams found" in lowered
            or "stream not found" in lowered
        ):
            return {
                "status": "source_unavailable",
                "severity": "error",
                "title": "Источник недоступен",
                "message": (
                    "Не удалось получить видео "
                    "с указанного источника."
                ),
                "time": event_time,
            }

        if (
            "connection refused" in lowered
            or "server refused" in lowered
        ):
            return {
                "status": "destination_refused",
                "severity": "error",
                "title": (
                    "Сервер назначения "
                    "отказал в подключении"
                ),
                "message": (
                    "Проверьте RTMP-адрес, ключ "
                    "трансляции и доступность "
                    "сервера назначения."
                ),
                "time": event_time,
            }

        if (
            "unauthorized" in lowered
            or "forbidden" in lowered
            or "authentication failed" in lowered
            or "server returned 401" in lowered
            or "server returned 403" in lowered
        ):
            return {
                "status": "authentication_failed",
                "severity": "error",
                "title": "Ошибка авторизации",
                "message": (
                    "Сервер назначения не принял "
                    "ключ трансляции или учётные "
                    "данные."
                ),
                "time": event_time,
            }

        if (
            "network is unreachable" in lowered
            or "name or service not known" in lowered
            or (
                "temporary failure "
                "in name resolution"
            ) in lowered
        ):
            return {
                "status": "network_unavailable",
                "severity": "error",
                "title": "Сеть недоступна",
                "message": (
                    "Сервер не может установить "
                    "сетевое соединение."
                ),
                "time": event_time,
            }

        if (
            "timed out" in lowered
            or "timeout" in lowered
        ):
            return {
                "status": "connection_timeout",
                "severity": "warning",
                "title": "Сервер не отвечает",
                "message": (
                    "Время ожидания подключения "
                    "истекло. Возможна временная "
                    "проблема сети."
                ),
                "time": event_time,
            }

        if (
            "broken pipe" in lowered
            or "connection reset" in lowered
            or "input pipe was closed" in lowered
        ):
            return {
                "status": "connection_lost",
                "severity": "warning",
                "title": "Соединение потеряно",
                "message": (
                    "Передача видео была прервана. "
                    "Система могла попытаться "
                    "восстановить поток."
                ),
                "time": event_time,
            }

        if (
            "source resolver exited unexpectedly"
            in lowered
        ):
            return {
                "status": "source_process_failed",
                "severity": "error",
                "title": (
                    "Процесс источника завершился"
                ),
                "message": (
                    "Не удалось продолжить получение "
                    "видео с источника."
                ),
                "time": event_time,
            }

        if "ffmpeg exited unexpectedly" in lowered:
            return {
                "status": "ffmpeg_failed",
                "severity": "error",
                "title": (
                    "Обработка потока остановлена"
                ),
                "message": (
                    "FFmpeg завершился с ошибкой."
                ),
                "time": event_time,
            }

        return None

    @staticmethod
    def _current_attempt(
        logs: list[dict[str, Any]],
    ) -> list[dict[str, Any]]:
        """
        Возвращает сообщения только текущей или последней
        попытки запуска pipeline.

        Старые ошибки предыдущих запусков не должны
        влиять на актуальную диагностику.
        """
        start_index = 0

        for index in range(
            len(logs) - 1,
            -1,
            -1,
        ):
            message = str(
                logs[index].get("message", "")
            ).lower()

            if "ffmpeg started pid=" in message:
                start_index = index
                break

        return logs[start_index:]

    @classmethod
    def get(
        cls,
        stream_id: int,
        process_alive: bool,
    ) -> dict[str, Any]:
        logs = log_buffer.get(
            stream_id=stream_id,
            limit=300,
        )

        if process_alive:
            return cls._running(logs)

        current_logs = cls._current_attempt(logs)

        # Первый проход: ищем первопричины источника.
        # Ошибки FFmpeg после закрытия pipe являются
        # следствием, а не основной причиной.
        source_markers = (
            "no playable streams",
            "no streams found",
            "stream not found",
            "currently offline",
            "channel is offline",
            "channel is not live",
            "not currently live",
            "unable to find playable streams",
        )

        for item in reversed(current_logs):
            message = str(
                item.get("message", "")
            )
            lowered = message.lower()

            if any(
                marker in lowered
                for marker in source_markers
            ):
                return {
                    "status": "source_offline",
                    "severity": "info",
                    "title": (
                        "Источник не ведёт трансляцию"
                    ),
                    "message": (
                        "На указанном канале сейчас "
                        "нет активного эфира."
                    ),
                    "time": item.get("time"),
                }

        # Второй проход: остальные реальные причины.
        for item in reversed(current_logs):
            diagnostic = cls._diagnose_log_item(
                item
            )

            if diagnostic is not None:
                return diagnostic

        if current_logs:
            return {
                "status": "stopped",
                "severity": "info",
                "title": "Поток остановлен",
                "message": (
                    "Сейчас процесс передачи видео "
                    "не запущен."
                ),
                "time": current_logs[-1].get(
                    "time"
                ),
            }

        return {
            "status": "no_data",
            "severity": "info",
            "title": "Нет данных",
            "message": (
                "Поток ещё не запускался после "
                "последнего перезапуска backend."
            ),
            "time": None,
        }


stream_diagnostics_service = (
    StreamDiagnosticsService()
)
