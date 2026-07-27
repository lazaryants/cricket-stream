import asyncio
import re

from asyncio.subprocess import Process
from datetime import datetime, timezone

from app.engine.logs import log_buffer
from app.engine.metrics import metrics_store


class FFmpegProcess:
    VIDEO_PATTERN = re.compile(
        r"Video:\s*"
        r"(?P<codec>[^,\s]+)"
        r"(?:\s*\((?P<profile>[^)]+)\))?"
        r".*?,\s*"
        r"(?P<pixel_format>yuv[\w\d]+)"
        r".*?,\s*"
        r"(?P<width>\d+)x(?P<height>\d+)"
    )

    VIDEO_FPS_PATTERN = re.compile(
        r"(?P<fps>[\d.]+)\s+fps"
    )

    AUDIO_PATTERN = re.compile(
        r"Audio:\s*"
        r"(?P<codec>[^,\s]+)"
        r".*?,\s*"
        r"(?P<sample_rate>\d+)\s+Hz"
        r",\s*"
        r"(?P<channels>[^,]+)"
    )

    def __init__(
        self,
        stream_id: int,
        command: list[str],
    ):
        self.stream_id = stream_id
        self.command = command
        self.process: Process | None = None
        self.started_at: datetime | None = None
        self.stopping = False

    async def start(
        self,
    ) -> int:
        self.started_at = datetime.now(
            timezone.utc
        )
        self.stopping = False

        self.process = (
            await asyncio.create_subprocess_exec(
                *self.command,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
            )
        )

        metrics_store.initialize(
            self.stream_id,
            self.process.pid,
        )

        log_buffer.add(
            self.stream_id,
            (
                "FFmpeg started "
                f"PID={self.process.pid}"
            ),
        )

        asyncio.create_task(
            self._read_progress()
        )
        asyncio.create_task(
            self._read_stderr()
        )
        asyncio.create_task(
            self._wait_exit()
        )

        return self.process.pid

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
            line = await self.process.stdout.readline()

            if not line:
                break

            text = line.decode(
                errors="ignore"
            ).strip()

            if not text:
                continue

            if "=" not in text:
                log_buffer.add(
                    self.stream_id,
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

    async def _read_stderr(
        self,
    ) -> None:
        if (
            self.process is None
            or self.process.stderr is None
        ):
            return

        while True:
            line = await self.process.stderr.readline()

            if not line:
                break

            text = line.decode(
                errors="ignore"
            ).strip()

            if not text:
                continue

            self._parse_media_info(
                text
            )

            log_buffer.add(
                self.stream_id,
                f"[stderr] {text}",
            )

            print(
                "[FFMPEG stderr]",
                text,
                flush=True,
            )

    def _parse_media_info(
        self,
        text: str,
    ) -> None:
        if "Video:" in text:
            video_match = (
                self.VIDEO_PATTERN.search(
                    text
                )
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
                    "pixel_format": (
                        video_match.group(
                            "pixel_format"
                        )
                    ),
                    "width": width,
                    "height": height,
                    "resolution": (
                        f"{width}x{height}"
                    ),
                }

                fps_match = (
                    self.VIDEO_FPS_PATTERN.search(
                        text
                    )
                )

                if fps_match:
                    try:
                        values["source_fps"] = (
                            float(
                                fps_match.group(
                                    "fps"
                                )
                            )
                        )
                    except ValueError:
                        pass

                metrics_store.update(
                    self.stream_id,
                    values,
                )

        if "Audio:" in text:
            audio_match = (
                self.AUDIO_PATTERN.search(
                    text
                )
            )

            if audio_match:
                channels_text = (
                    audio_match.group(
                        "channels"
                    ).strip()
                )

                metrics_store.update(
                    self.stream_id,
                    {
                        "audio_codec": (
                            audio_match.group(
                                "codec"
                            )
                        ),
                        "sample_rate": int(
                            audio_match.group(
                                "sample_rate"
                            )
                        ),
                        "audio_channels": (
                            self._channel_count(
                                channels_text
                            )
                        ),
                        "channel_layout": (
                            channels_text
                        ),
                    },
                )

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
            "running": self.running(),
            "frame": frame,
            "fps": fps,
            "bitrate": bitrate,
            "bitrate_kbps": (
                bitrate_kbps
            ),
            "speed": speed,
            "speed_value": (
                speed_value
            ),
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
                datetime.now(
                    timezone.utc
                )
                - self.started_at
            ).total_seconds()

            values[
                "uptime_seconds"
            ] = round(
                uptime,
                1,
            )

        metrics_store.update(
            self.stream_id,
            values,
        )

    async def _wait_exit(
        self,
    ) -> None:
        if self.process is None:
            return

        code = await self.process.wait()

        metrics_store.mark_stopped(
            self.stream_id,
            code,
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

        log_buffer.add(
            self.stream_id,
            message,
        )

        print(
            f"[FFMPEG] stream={self.stream_id} "
            f"exit_code={code} "
            f"stopping={self.stopping}",
            flush=True,
        )

    async def stop(
        self,
    ) -> None:
        if self.process is None:
            return

        if self.process.returncode is not None:
            return

        self.stopping = True

        log_buffer.add(
            self.stream_id,
            "Stopping FFmpeg",
        )

        self.process.terminate()

        try:
            await asyncio.wait_for(
                self.process.wait(),
                timeout=10,
            )
        except asyncio.TimeoutError:
            log_buffer.add(
                self.stream_id,
                "Force killing FFmpeg",
            )

            self.process.kill()
            await self.process.wait()

    def running(
        self,
    ) -> bool:
        return (
            self.process is not None
            and self.process.returncode is None
        )

    @staticmethod
    def _channel_count(
        value: str,
    ) -> int | None:
        normalized = value.lower()

        if "mono" in normalized:
            return 1

        if "stereo" in normalized:
            return 2

        match = re.search(
            r"(\d+)\s*channels?",
            normalized,
        )

        if match:
            return int(
                match.group(1)
            )

        return None

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
                float(
                    match.group(1)
                ),
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

        cleaned = value.strip().rstrip(
            "x"
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
