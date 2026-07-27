from collections import deque
from datetime import datetime, timezone


class StreamLogBuffer:
    def __init__(self, max_lines: int = 1000):
        self.logs: dict[int, deque] = {}
        self.max_lines = max_lines

    def add(
        self,
        stream_id: int,
        message: str,
    ):
        if stream_id not in self.logs:
            self.logs[stream_id] = deque(
                maxlen=self.max_lines
            )

        self.logs[stream_id].append(
            {
                "time": datetime.now(
                    timezone.utc
                ).isoformat(),
                "message": message,
            }
        )

    def get(
        self,
        stream_id: int,
        limit: int = 100,
    ):
        logs = self.logs.get(stream_id)

        if not logs:
            return []

        return list(logs)[-limit:]

    def clear(
        self,
        stream_id: int,
    ):
        self.logs.pop(
            stream_id,
            None,
        )


log_buffer = StreamLogBuffer()
