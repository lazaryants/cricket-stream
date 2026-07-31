import asyncio
import re

from asyncio.subprocess import Process
from datetime import datetime, timezone

from app.engine.session_logger import (
    session_logger,
)
from app.engine.metrics import metrics_store


class FFmpegProcess:
    def __init__(
        self,
        stream_id: int,
        session_uuid,
        ffmpeg_command: list[str],
        source_command: list[str] | None = None,
        source_kind: str = "direct",
        provider: str = "direct",
    ):
        self.stream_id = stream_id
        self.session_uuid = session_uuid

        self.ffmpeg_command = (
            ffmpeg_command
        )
        self.source_command = (
            source_command
        )

        self.source_kind = source_kind
        self.provider = provider

        # Для совместимости с существующим manager.py:
        # self.process — это основной FFmpeg.
        self.process: Process | None = None

        # Для Twitch/Kick/YouTube здесь будет
        # находиться процесс Streamlink.
        self.source_process: Process | None = None

        self.started_at: datetime | None = None
        self.stopping = False

        self._tasks: list[
            asyncio.Task
        ] = []

    async def start(
        self,
    ) -> int:
        self.started_at = datetime.now(
            timezone.utc
        )
        self.stopping = False

        if self.source_command:
            await self._start_pipeline()
        else:
            await self._start_direct()

        if self.process is None:
            raise RuntimeError(
                "FFmpeg process was not created"
            )

        metrics_store.initialize(
            self.stream_id,
            self.process.pid,
        )

        metrics_store.update(
            self.stream_id,
            {
                "source_kind": (
                    self.source_kind
                ),
                "provider": self.provider,
                "ffmpeg_pid": (
                    self.process.pid
                ),
                "resolver_pid": (
                    self.source_process.pid
                    if self.source_process
                    else None
                ),
            },
        )

        session_logger.add(
            self.stream_id,
            self.session_uuid,
            (
                "FFmpeg started "
                f"PID={self.process.pid}"
            ),
        )

        if self.source_process:
            session_logger.add(
                self.stream_id,
                self.session_uuid,
                (
                    "Source resolver started "
                    f"PID={self.source_process.pid}"
                ),
            )

        self._create_task(
            self._read_progress(),
            "ffmpeg-progress",
        )

        self._create_task(
            self._read_ffmpeg_stderr(),
            "ffmpeg-stderr",
        )

        self._create_task(
            self._wait_ffmpeg_exit(),
            "ffmpeg-wait",
        )

        if self.source_process:
            self._create_task(
                self._read_source_stderr(),
                "source-stderr",
            )

            self._create_task(
                self._pump_source(),
                "source-pump",
            )

            self._create_task(
                self._wait_source_exit(),
                "source-wait",
            )

        return self.process.pid

    async def _start_direct(
        self,
    ) -> None:
        self.process = (
            await asyncio.create_subprocess_exec(
                *self.ffmpeg_command,
                stdin=(
                    asyncio.subprocess.DEVNULL
                ),
                stdout=(
                    asyncio.subprocess.PIPE
                ),
                stderr=(
                    asyncio.subprocess.PIPE
                ),
            )
        )

    async def _start_pipeline(
        self,
    ) -> None:
        if not self.source_command:
            raise RuntimeError(
                "Source command is missing"
            )

        self.source_process = (
            await asyncio.create_subprocess_exec(
                *self.source_command,
                stdin=(
                    asyncio.subprocess.DEVNULL
                ),
                stdout=(
                    asyncio.subprocess.PIPE
                ),
                stderr=(
                    asyncio.subprocess.PIPE
                ),
            )
        )

        try:
            self.process = (
                await asyncio.create_subprocess_exec(
                    *self.ffmpeg_command,
                    stdin=(
                        asyncio.subprocess.PIPE
                    ),
                    stdout=(
                        asyncio.subprocess.PIPE
                    ),
                    stderr=(
                        asyncio.subprocess.PIPE
                    ),
                )
            )
        except Exception:
            await self._terminate_process(
                self.source_process,
                "source resolver",
                timeout=5,
            )
            raise

    def _create_task(
        self,
        coroutine,
        name: str,
    ) -> None:
        task = asyncio.create_task(
            coroutine,
            name=(
                f"stream-{self.stream_id}-"
                f"{name}"
            ),
        )

        self._tasks.append(
            task
        )

    async def _pump_source(
        self,
    ) -> None:
        """
        Передаёт данные:

        Streamlink stdout → FFmpeg stdin
        """
        if (
            self.source_process is None
            or self.source_process.stdout is None
            or self.process is None
            or self.process.stdin is None
        ):
            return

        try:
            while True:
                chunk = (
                    await self.source_process
                    .stdout.read(
                        64 * 1024
                    )
                )

                if not chunk:
                    break

                self.process.stdin.write(
                    chunk
                )

                await self.process.stdin.drain()

        except (
            BrokenPipeError,
            ConnectionResetError,
        ):
            session_logger.add(
                self.stream_id,
                self.session_uuid,
                (
                    "FFmpeg input pipe "
                    "was closed"
                ),
            )

        except asyncio.CancelledError:
            raise

        except Exception as exc:
            session_logger.add(
                self.stream_id,
                self.session_uuid,
                (
                    "Source pipe error: "
                    f"{exc}"
                ),
            )

            print(
                f"[SOURCE PIPE] "
                f"stream={self.stream_id} "
                f"error={exc}",
                flush=True,
            )

        finally:
            if (
                self.process
                and self.process.stdin
            ):
                try:
                    self.process.stdin.close()

                    await self.process.stdin.wait_closed()
                except (
                    BrokenPipeError,
                    ConnectionResetError,
                ):
                    pass
                except Exception:
                    pass

    async def _read_source_stderr(
        self,
    ) -> None:
        if (
            self.source_process is None
            or self.source_process.stderr is None
        ):
            return

        while True:
            line = (
                await self.source_process
                .stderr.readline()
            )

            if not line:
                break

            text = line.decode(
                errors="ignore"
            ).strip()

            if not text:
                continue

            session_logger.add(
                self.stream_id,
                self.session_uuid,
                f"[streamlink] {text}",
            )

            print(
                "[STREAMLINK]",
                text,
                flush=True,
            )

    async def _read_progress(
        self,
    ) -> None:
        if (
            self.process is None
            or self.process.stdout is None
        ):
            return

        progress_block: dict[
            str,
            str,
        ] = {}

        while True:
            line = (
                await self.process
                .stdout.readline()
            )

            if not line:
                break

            text = line.decode(
                errors="ignore"
            ).strip()

            if not text:
                continue

            if "=" not in text:
                session_logger.add(
                    self.stream_id,
                    self.session_uuid,
                    f"[stdout] {text}",
                )
                continue

            key, value = text.split(
                "=",
                1,
            )

            progress_block[key] = value

            if key == "progress":
                self._save_progress(
                    progress_block
                )
                progress_block = {}

    async def _read_ffmpeg_stderr(
        self,
    ) -> None:
        if (
            self.process is None
            or self.process.stderr is None
        ):
            return

        while True:
            line = (
                await self.process
                .stderr.readline()
            )

            if not line:
                break

            text = line.decode(
                errors="ignore"
            ).strip()

            if not text:
                continue

            session_logger.add(
                self.stream_id,
                self.session_uuid,
                f"[stderr] {text}",
            )

            self._parse_media_metadata(
                text
            )

            print(
                "[FFMPEG stderr]",
                text,
                flush=True,
            )

    async def _wait_source_exit(
        self,
    ) -> None:
        if self.source_process is None:
            return

        code = (
            await self.source_process.wait()
        )

        metrics_store.update(
            self.stream_id,
            {
                "resolver_running": False,
                "resolver_exit_code": code,
            },
        )

        if self.stopping:
            message = (
                "Source resolver stopped "
                f"normally code={code}"
            )
        else:
            message = (
                "Source resolver exited "
                f"unexpectedly code={code}"
            )

        session_logger.add(
            self.stream_id,
            self.session_uuid,
            message,
        )

        print(
            f"[STREAMLINK] "
            f"stream={self.stream_id} "
            f"exit_code={code} "
            f"stopping={self.stopping}",
            flush=True,
        )

        # Если Streamlink умер сам, FFmpeg больше
        # не сможет получать новые данные.
        # Завершаем FFmpeg, чтобы supervisor
        # перезапустил всю цепочку.
        if (
            not self.stopping
            and self.process is not None
            and self.process.returncode is None
        ):
            try:
                await asyncio.wait_for(
                    self.process.wait(),
                    timeout=3,
                )
            except asyncio.TimeoutError:
                self.process.terminate()

    async def _wait_ffmpeg_exit(
        self,
    ) -> None:
        if self.process is None:
            return

        code = await self.process.wait()

        # Если FFmpeg завершился, Streamlink
        # больше не нужен.
        if (
            self.source_process is not None
            and self.source_process.returncode is None
        ):
            await self._terminate_process(
                self.source_process,
                "source resolver",
                timeout=5,
            )

        metrics_store.mark_stopped(
            self.stream_id,
            code,
        )

        metrics_store.update(
            self.stream_id,
            {
                "ffmpeg_pid": (
                    self.process.pid
                ),
                "ffmpeg_exit_code": code,
                "resolver_pid": (
                    self.source_process.pid
                    if self.source_process
                    else None
                ),
                "resolver_exit_code": (
                    self.source_process.returncode
                    if self.source_process
                    else None
                ),
            },
        )

        if self.stopping:
            message = (
                "FFmpeg stopped normally "
                f"code={code}"
            )
        else:
            message = (
                "FFmpeg exited unexpectedly "
                f"code={code}"
            )

        session_logger.add(
            self.stream_id,
            self.session_uuid,
            message,
        )

        print(
            f"[FFMPEG] "
            f"stream={self.stream_id} "
            f"exit_code={code} "
            f"stopping={self.stopping}",
            flush=True,
        )

    async def stop(
        self,
    ) -> None:
        self.stopping = True

        session_logger.add(
            self.stream_id,
            self.session_uuid,
            "Stopping stream pipeline",
        )

        # Сначала прекращаем получение данных.
        await self._terminate_process(
            self.source_process,
            "source resolver",
            timeout=5,
        )

        # Затем корректно останавливаем FFmpeg.
        await self._terminate_process(
            self.process,
            "FFmpeg",
            timeout=10,
        )

        metrics_store.update(
            self.stream_id,
            {
                "running": False,
                "resolver_running": False,
            },
        )

    async def _terminate_process(
        self,
        process: Process | None,
        name: str,
        timeout: float,
    ) -> None:
        if process is None:
            return

        if process.returncode is not None:
            return

        session_logger.add(
            self.stream_id,
            self.session_uuid,
            f"Stopping {name}",
        )

        process.terminate()

        try:
            await asyncio.wait_for(
                process.wait(),
                timeout=timeout,
            )

        except asyncio.TimeoutError:
            session_logger.add(
                self.stream_id,
                self.session_uuid,
                f"Force killing {name}",
            )

            process.kill()

            await process.wait()

    def running(
        self,
    ) -> bool:
        """
        Главным процессом считается FFmpeg.

        Если Streamlink завершается, watcher
        закрывает FFmpeg, после чего supervisor
        перезапускает всю цепочку.
        """
        return (
            self.process is not None
            and self.process.returncode is None
        )

    def resolver_running(
        self,
    ) -> bool:
        if self.source_process is None:
            return False

        return (
            self.source_process.returncode
            is None
        )

    @property
    def ffmpeg_pid(
        self,
    ) -> int | None:
        if self.process is None:
            return None

        return self.process.pid

    @property
    def resolver_pid(
        self,
    ) -> int | None:
        if self.source_process is None:
            return None

        return self.source_process.pid

    def _save_progress(
        self,
        data: dict[str, str],
    ) -> None:
        frame = self._to_int(
            data.get("frame")
        )

        fps = self._to_float(
            data.get("fps")
        )

        total_size = self._to_int(
            data.get("total_size")
        )

        dup_frames = self._to_int(
            data.get("dup_frames")
        )

        drop_frames = self._to_int(
            data.get("drop_frames")
        )

        bitrate = data.get(
            "bitrate"
        )

        speed = data.get(
            "speed"
        )

        out_time = data.get(
            "out_time"
        )

        bitrate_kbps = (
            self._parse_bitrate_kbps(
                bitrate
            )
        )

        speed_value = (
            self._parse_speed(
                speed
            )
        )

        out_time_seconds = (
            self._parse_time(
                out_time
            )
        )

        values = {
            "pid": (
                self.process.pid
                if self.process
                else None
            ),
            "ffmpeg_pid": (
                self.ffmpeg_pid
            ),
            "resolver_pid": (
                self.resolver_pid
            ),
            "running": self.running(),
            "resolver_running": (
                self.resolver_running()
            ),
            "source_kind": (
                self.source_kind
            ),
            "provider": self.provider,
            "frame": frame,
            "fps": fps,
            "bitrate": bitrate,
            "bitrate_kbps": (
                bitrate_kbps
            ),
            "speed": speed,
            "speed_value": speed_value,
            "out_time": out_time,
            "out_time_seconds": (
                out_time_seconds
            ),
            "total_size": total_size,
            "total_size_mb": round(
                total_size
                / 1024
                / 1024,
                2,
            ),
            "dup_frames": dup_frames,
            "drop_frames": drop_frames,
            "progress": data.get(
                "progress"
            ),
        }

        if self.started_at is not None:
            uptime = (
                datetime.now(timezone.utc)
                - self.started_at
            ).total_seconds()

            values["uptime_seconds"] = round(
                uptime,
                1,
            )

        metrics_store.update(
            self.stream_id,
            values,
        )

    def _parse_media_metadata(
        self,
        text: str,
    ) -> None:
        """
        Извлекает codec, resolution, FPS
        и параметры аудио из stderr FFmpeg.
        """
        if "Video:" in text:
            video_match = re.search(
                r"Video:\s*"
                r"(?P<codec>[^,\s]+)"
                r"(?:\s*\((?P<profile>[^)]+)\))?"
                r".*?"
                r"(?P<width>\d{2,5})x"
                r"(?P<height>\d{2,5})",
                text,
            )

            if video_match:
                width = int(
                    video_match.group(
                        "width"
                    )
                )

                height = int(
                    video_match.group(
                        "height"
                    )
                )

                values = {
                    "video_codec": (
                        video_match.group(
                            "codec"
                        )
                    ),
                    "video_profile": (
                        video_match.group(
                            "profile"
                        )
                    ),
                    "width": width,
                    "height": height,
                    "resolution": (
                        f"{width}x{height}"
                    ),
                }

                pixel_match = re.search(
                    r",\s*"
                    r"(yuv[0-9a-z]+|nv12|"
                    r"p010le|rgb[0-9a-z]+)"
                    r"(?:\s|,)",
                    text,
                )

                if pixel_match:
                    values[
                        "pixel_format"
                    ] = pixel_match.group(1)

                fps_match = re.search(
                    r"([\d.]+)\s+fps",
                    text,
                )

                if fps_match:
                    try:
                        values[
                            "source_fps"
                        ] = float(
                            fps_match.group(1)
                        )
                    except ValueError:
                        pass

                metrics_store.update(
                    self.stream_id,
                    values,
                )

        if "Audio:" in text:
            audio_match = re.search(
                r"Audio:\s*"
                r"(?P<codec>[^,\s]+)"
                r".*?"
                r"(?P<rate>\d+)\s*Hz"
                r".*?"
                r"(?P<layout>"
                r"mono|stereo|"
                r"\d+\.\d+)",
                text,
            )

            if audio_match:
                layout = audio_match.group(
                    "layout"
                )

                channels = None

                if layout == "mono":
                    channels = 1
                elif layout == "stereo":
                    channels = 2

                values = {
                    "audio_codec": (
                        audio_match.group(
                            "codec"
                        )
                    ),
                    "sample_rate": int(
                        audio_match.group(
                            "rate"
                        )
                    ),
                    "channel_layout": layout,
                }

                if channels is not None:
                    values[
                        "audio_channels"
                    ] = channels

                metrics_store.update(
                    self.stream_id,
                    values,
                )

    @staticmethod
    def _to_int(
        value: str | None,
    ) -> int:
        if value is None:
            return 0

        try:
            return int(value)
        except (
            TypeError,
            ValueError,
        ):
            return 0

    @staticmethod
    def _to_float(
        value: str | None,
    ) -> float:
        if value is None:
            return 0.0

        try:
            return float(value)
        except (
            TypeError,
            ValueError,
        ):
            return 0.0

    @staticmethod
    def _parse_bitrate_kbps(
        value: str | None,
    ) -> float | None:
        if not value:
            return None

        match = re.search(
            r"([\d.]+)\s*kbits/s",
            value,
        )

        if not match:
            return None

        try:
            return round(
                float(match.group(1)),
                2,
            )
        except ValueError:
            return None

    @staticmethod
    def _parse_speed(
        value: str | None,
    ) -> float | None:
        if not value:
            return None

        cleaned = (
            value.strip().rstrip("x")
        )

        try:
            return round(
                float(cleaned),
                3,
            )
        except ValueError:
            return None

    @staticmethod
    def _parse_time(
        value: str | None,
    ) -> float:
        if not value:
            return 0.0

        try:
            (
                hours_text,
                minutes_text,
                seconds_text,
            ) = value.split(":")

            hours = float(
                hours_text
            )
            minutes = float(
                minutes_text
            )
            seconds = float(
                seconds_text
            )

            return round(
                hours * 3600
                + minutes * 60
                + seconds,
                3,
            )

        except (
            TypeError,
            ValueError,
        ):
            return 0.0
