from dataclasses import dataclass
from time import monotonic
from typing import Any, Callable


@dataclass(frozen=True)
class ProgressObservation:
    stalled: bool
    silence_seconds: float
    progress_seen: bool


@dataclass
class _ProgressState:
    pid: str
    first_seen_at: float
    last_progress_at: float
    counters: tuple[float, float, float]
    progress_seen: bool


class MediaProgressWatchdog:
    """Detect a live FFmpeg process that has stopped moving media."""

    def __init__(
        self,
        *,
        startup_grace_seconds: float,
        stall_timeout_seconds: float,
        clock: Callable[[], float] = monotonic,
    ) -> None:
        if startup_grace_seconds <= 0:
            raise ValueError("startup grace must be positive")
        if stall_timeout_seconds <= 0:
            raise ValueError("stall timeout must be positive")

        self.startup_grace_seconds = startup_grace_seconds
        self.stall_timeout_seconds = stall_timeout_seconds
        self.clock = clock
        self._states: dict[int, _ProgressState] = {}

    @staticmethod
    def _number(value: Any) -> float:
        try:
            return float(value or 0)
        except (TypeError, ValueError):
            return 0.0

    def _counters(
        self,
        metrics: dict[str, Any] | None,
    ) -> tuple[float, float, float]:
        values = metrics or {}
        return (
            self._number(values.get("frame")),
            self._number(values.get("out_time_seconds")),
            self._number(values.get("total_size")),
        )

    def observe(
        self,
        stream_id: int,
        pid: int | str,
        metrics: dict[str, Any] | None,
    ) -> ProgressObservation:
        now = self.clock()
        normalized_pid = str(pid)
        counters = self._counters(metrics)
        state = self._states.get(stream_id)

        if state is None or state.pid != normalized_pid:
            progress_seen = any(value > 0 for value in counters)
            self._states[stream_id] = _ProgressState(
                pid=normalized_pid,
                first_seen_at=now,
                last_progress_at=now,
                counters=counters,
                progress_seen=progress_seen,
            )
            return ProgressObservation(
                stalled=False,
                silence_seconds=0.0,
                progress_seen=progress_seen,
            )

        if counters != state.counters:
            state.counters = counters
            state.last_progress_at = now
            state.progress_seen = True

        reference = (
            state.last_progress_at
            if state.progress_seen
            else state.first_seen_at
        )
        silence = max(0.0, now - reference)
        timeout = (
            self.stall_timeout_seconds
            if state.progress_seen
            else self.startup_grace_seconds
        )

        return ProgressObservation(
            stalled=silence >= timeout,
            silence_seconds=silence,
            progress_seen=state.progress_seen,
        )

    def remove(self, stream_id: int) -> None:
        self._states.pop(stream_id, None)

    def clear(self) -> None:
        self._states.clear()
