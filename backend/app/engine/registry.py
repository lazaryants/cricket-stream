from app.engine.process import FFmpegProcess


class ProcessRegistry:
    def __init__(self):
        self._processes: dict[int, FFmpegProcess] = {}

    def get(self, stream_id: int) -> FFmpegProcess | None:
        return self._processes.get(stream_id)

    def add(
        self,
        stream_id: int,
        process: FFmpegProcess,
    ) -> None:
        self._processes[stream_id] = process

    def remove(self, stream_id: int) -> None:
        self._processes.pop(stream_id, None)

    def exists(self, stream_id: int) -> bool:
        return stream_id in self._processes

    def running(self, stream_id: int) -> bool:
        process = self.get(stream_id)

        if process is None:
            return False

        return process.running()

    def all(self) -> dict[int, FFmpegProcess]:
        return self._processes


registry = ProcessRegistry()
