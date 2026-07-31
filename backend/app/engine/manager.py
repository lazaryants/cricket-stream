import os
import signal
from pathlib import Path

from app.engine.ffmpeg import (
    FFmpegCommandBuilder,
)
from app.engine.process import (
    FFmpegProcess,
)
from app.providers.registry import (
    source_resolvers,
)
from app.core.config import settings
from app.models.enums import SourceEngine


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

        hls_directory = (
            Path(settings.hls_dir)
            / str(stream_id)
        )
        hls_directory.mkdir(
            parents=True,
            exist_ok=True,
        )
        for stale_file in hls_directory.glob("*"):
            if stale_file.is_file():
                stale_file.unlink()

        source_engine = getattr(
            stream,
            "source_engine",
            SourceEngine.AUTO,
        )
        source = await self._resolve_source(
            stream.source_url,
            source_engine,
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

    async def _resolve_source(
        self,
        source_url: str,
        source_engine: SourceEngine | str,
    ):
        engine_value = getattr(
            source_engine,
            "value",
            source_engine,
        )
        streamlink = (
            source_resolvers.get_streamlink()
        )

        # Прямые media URL не требуют resolver.
        direct_source = (
            streamlink.build_stream_command(
                source_url=source_url,
                quality="best",
            )
        )
        if direct_source.direct_url:
            return direct_source

        if engine_value == SourceEngine.STREAMLINK.value:
            return direct_source

        if engine_value == SourceEngine.AUTO.value:
            try:
                probe = await streamlink.probe(
                    source_url=source_url,
                    quality="best",
                    timeout=25.0,
                )
                if probe.success:
                    return direct_source
            except Exception as exc:
                print(
                    "[SOURCE RESOLVER] "
                    f"Streamlink preflight failed: {exc}; "
                    "falling back to yt-dlp",
                    flush=True,
                )

        ytdlp = source_resolvers.get_ytdlp()
        probe = await ytdlp.probe(
            source_url=source_url,
            quality="best",
            timeout=35.0,
            include_resolved_url=True,
        )
        if not probe.success or not probe.resolved_url:
            raise RuntimeError(
                probe.error
                or "yt-dlp did not return a playable URL"
            )

        return type(direct_source)(
            source_kind=probe.source_kind,
            provider=probe.provider,
            quality=probe.quality,
            command=None,
            direct_url=probe.resolved_url,
        )

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
