from copy import deepcopy
from datetime import datetime, timezone
from typing import Any


class StreamMetricsStore:
    def __init__(self):
        self._metrics: dict[int, dict[str, Any]] = {}

    def initialize(
        self,
        stream_id: int,
        pid: int,
    ) -> None:
        now = datetime.now(timezone.utc)

        self._metrics[stream_id] = {
            "stream_id": stream_id,
            "pid": pid,
            "running": True,
            "frame": 0,
            "fps": 0.0,
            "bitrate": None,
            "bitrate_kbps": None,
            "speed": None,
            "speed_value": None,
            "out_time": None,
            "out_time_seconds": 0.0,
            "total_size": 0,
            "total_size_mb": 0.0,
            "dup_frames": 0,
            "drop_frames": 0,
            "progress": "starting",
            "started_at": now,
            "updated_at": now,
            "stopped_at": None,
            "exit_code": None,
        }

    def update(
        self,
        stream_id: int,
        values: dict[str, Any],
    ) -> None:
        if stream_id not in self._metrics:
            self._metrics[stream_id] = {
                "stream_id": stream_id,
            }

        self._metrics[stream_id].update(
            values
        )
        self._metrics[stream_id][
            "updated_at"
        ] = datetime.now(timezone.utc)

    def mark_stopped(
        self,
        stream_id: int,
        exit_code: int | None,
    ) -> None:
        now = datetime.now(timezone.utc)

        self.update(
            stream_id,
            {
                "running": False,
                "progress": "end",
                "exit_code": exit_code,
                "stopped_at": now,
            },
        )

    def remove(
        self,
        stream_id: int,
    ) -> None:
        self._metrics.pop(
            stream_id,
            None,
        )

    def get(
        self,
        stream_id: int,
    ) -> dict[str, Any] | None:
        metrics = self._metrics.get(
            stream_id
        )

        if metrics is None:
            return None

        return deepcopy(metrics)

    def get_all(
        self,
    ) -> dict[int, dict[str, Any]]:
        return deepcopy(
            self._metrics
        )


metrics_store = StreamMetricsStore()
