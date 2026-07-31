import os
import signal

from app.engine.ffmpeg import (
    FFmpegCommandBuilder,
)
from app.engine.process import (
    FFmpegProcess,
)
from app.providers.registry import (
    source_resolvers,
)


class StreamManager:
    def __init__(
        self,
    ):
        self.processes: dict[
            int,
            FFmpegProcess,
        ] = {}

    def pid_alive(
        self,
        pid: int | str | None,
    ) -> bool:
        if not pid:
            return False

        try:
            os.kill(
                int(pid),
                0,
            )
            return True

        except ProcessLookupError:
            return False

        except PermissionError:
            return True

        except (
            TypeError,
            ValueError,
            OSError,
        ):
            return False

    async def start(
        self,
        stream,
        *,
        session_uuid,
    ) -> int:
        stream_id = stream.id

        existing = self.processes.get(
            stream_id
        )

        if existing:
            if existing.running():
                if existing.ffmpeg_pid is None:
                    raise RuntimeError(
                        "Running FFmpeg "
                        "has no PID"
                    )

                return existing.ffmpeg_pid

            self.processes.pop(
                stream_id,
                None,
            )

        resolver = (
            source_resolvers
            .get_streamlink()
        )

        source = (
            resolver.build_stream_command(
                source_url=(
                    stream.source_url
                ),
                quality="best",
            )
        )

        if source.direct_url:
            ffmpeg_command = (
                FFmpegCommandBuilder
                .build_direct(
                    stream=stream,
                    source_url=(
                        source.direct_url
                    ),
                )
            )

            source_command = None

        elif source.command:
            ffmpeg_command = (
                FFmpegCommandBuilder
                .build_pipe(
                    stream=stream,
                )
            )

            source_command = (
                source.command
            )

        else:
            raise RuntimeError(
                "Source resolver returned "
                "neither direct URL nor "
                "resolver command"
            )

        process = FFmpegProcess(
            stream_id=stream_id,
            session_uuid=session_uuid,
            ffmpeg_command=(
                ffmpeg_command
            ),
            source_command=(
                source_command
            ),
            source_kind=(
                source.source_kind.value
            ),
            provider=source.provider,
        )

        try:
            pid = await process.start()
        except Exception:
            try:
                await process.stop()
            except Exception:
                pass
            raise

        self.processes[
            stream_id
        ] = process

        print(
            f"[STREAM MANAGER] "
            f"started stream={stream_id} "
            f"provider={source.provider} "
            f"ffmpeg_pid={process.ffmpeg_pid} "
            f"resolver_pid="
            f"{process.resolver_pid}",
            flush=True,
        )

        return pid

    async def stop(
        self,
        stream_id: int,
        pid=None,
    ) -> bool:
        process = self.processes.get(
            stream_id
        )

        if process:
            try:
                await process.stop()
            finally:
                self.processes.pop(
                    stream_id,
                    None,
                )

            print(
                f"[STREAM MANAGER] "
                f"stopped stream={stream_id}",
                flush=True,
            )

            return True

        # Резервный вариант после потери
        # in-memory registry.
        #
        # Здесь PID из базы относится к FFmpeg.
        # Streamlink при нормальной работе является
        # дочерним процессом backend/systemd cgroup
        # и обычно завершается вместе с FFmpeg либо
        # backend.
        if pid and self.pid_alive(pid):
            try:
                os.kill(
                    int(pid),
                    signal.SIGTERM,
                )

                print(
                    f"[STREAM MANAGER] "
                    f"stopped external "
                    f"ffmpeg pid={pid}",
                    flush=True,
                )

                return True

            except Exception as exc:
                print(
                    f"[STREAM MANAGER] "
                    f"PID stop error "
                    f"pid={pid}: {exc}",
                    flush=True,
                )

        return False

    async def stop_all(
        self,
    ) -> None:
        stream_ids = list(
            self.processes.keys()
        )

        for stream_id in stream_ids:
            try:
                await self.stop(
                    stream_id
                )

            except Exception as exc:
                print(
                    f"[STREAM MANAGER] "
                    f"stop_all error "
                    f"stream={stream_id}: "
                    f"{exc}",
                    flush=True,
                )

    def running(
        self,
        stream_id: int,
    ) -> bool:
        process = self.processes.get(
            stream_id
        )

        if not process:
            return False

        if process.running():
            return True

        self.processes.pop(
            stream_id,
            None,
        )

        return False

    def status(
        self,
        stream_id: int,
    ) -> str:
        process = self.processes.get(
            stream_id
        )

        if not process:
            return "unknown"

        if process.running():
            return "running"

        return "dead"

    def dead_streams(
        self,
    ) -> list[int]:
        dead: list[int] = []

        for stream_id, process in list(
            self.processes.items()
        ):
            if not process.running():
                dead.append(
                    stream_id
                )

                self.processes.pop(
                    stream_id,
                    None,
                )

        return dead

    def get_process(
        self,
        stream_id: int,
    ) -> FFmpegProcess | None:
        return self.processes.get(
            stream_id
        )


stream_manager = StreamManager()
