import asyncio
import logging

from app.models.stream import Stream
from app.providers.registry import source_resolvers


logger = logging.getLogger("stream-preview")


class StreamPreviewError(RuntimeError):
    pass


class StreamPreviewService:
    def __init__(
        self,
        max_parallel_previews: int = 2,
    ):
        self._semaphore = asyncio.Semaphore(
            max_parallel_previews
        )
        self._locks: dict[
            int,
            asyncio.Lock,
        ] = {}

    def _get_lock(
        self,
        stream_id: int,
    ) -> asyncio.Lock:
        lock = self._locks.get(
            stream_id
        )

        if lock is None:
            lock = asyncio.Lock()
            self._locks[stream_id] = lock

        return lock

    async def generate(
        self,
        stream: Stream,
        width: int = 960,
        timeout: float = 30.0,
    ) -> bytes:
        if width < 320 or width > 1920:
            raise StreamPreviewError(
                "Preview width must be "
                "between 320 and 1920"
            )

        lock = self._get_lock(
            stream.id
        )

        async with self._semaphore:
            async with lock:
                source_url = (
                    await self._resolve_source_url(
                        stream
                    )
                )

                return await self._capture_frame(
                    stream_id=stream.id,
                    source_url=source_url,
                    width=width,
                    timeout=timeout,
                )

    async def _resolve_source_url(
        self,
        stream: Stream,
    ) -> str:
        resolver = (
            source_resolvers
            .get_streamlink()
        )

        source = (
            resolver.build_stream_command(
                source_url=stream.source_url,
                quality="best",
            )
        )

        if source.direct_url:
            return source.direct_url

        probe = await resolver.probe(
            source_url=stream.source_url,
            quality="best",
            timeout=30.0,
            include_resolved_url=True,
        )

        if (
            not probe.success
            or not probe.resolved_url
        ):
            raise StreamPreviewError(
                probe.error
                or (
                    "The source resolver "
                    "did not return a "
                    "playable URL"
                )
            )

        return probe.resolved_url

    async def _capture_frame(
        self,
        stream_id: int,
        source_url: str,
        width: int,
        timeout: float,
    ) -> bytes:
        command = [
            "/usr/bin/ffmpeg",
            "-hide_banner",
            "-loglevel",
            "error",

            # Таймаут сетевого чтения:
            # 15 секунд в микросекундах.
            "-rw_timeout",
            "15000000",

            "-i",
            source_url,

            "-map",
            "0:v:0",

            # Для кадра звук не нужен.
            "-an",
            "-sn",
            "-dn",

            # Сохраняем пропорции.
            "-vf",
            (
                f"scale={width}:-2:"
                "force_original_aspect_ratio="
                "decrease"
            ),

            "-frames:v",
            "1",

            "-q:v",
            "4",

            "-f",
            "image2pipe",
            "-vcodec",
            "mjpeg",
            "pipe:1",
        ]

        logger.info(
            "[PREVIEW] capturing stream=%s",
            stream_id,
        )

        process = (
            await asyncio.create_subprocess_exec(
                *command,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
            )
        )

        try:
            stdout, stderr = (
                await asyncio.wait_for(
                    process.communicate(),
                    timeout=timeout,
                )
            )
        except asyncio.TimeoutError as exc:
            process.kill()
            await process.communicate()

            logger.warning(
                "[PREVIEW] timeout stream=%s",
                stream_id,
            )

            raise StreamPreviewError(
                "Preview generation timed out"
            ) from exc

        stderr_text = stderr.decode(
            errors="replace"
        ).strip()

        if process.returncode != 0:
            logger.warning(
                "[PREVIEW] failed stream=%s "
                "code=%s error=%s",
                stream_id,
                process.returncode,
                stderr_text,
            )

            raise StreamPreviewError(
                stderr_text
                or (
                    "FFmpeg could not create "
                    "the preview"
                )
            )

        if not stdout:
            raise StreamPreviewError(
                "FFmpeg returned an empty image"
            )

        # JPEG должен начинаться с FF D8.
        if not stdout.startswith(
            b"\xff\xd8"
        ):
            raise StreamPreviewError(
                "FFmpeg returned invalid "
                "JPEG data"
            )

        logger.info(
            "[PREVIEW] ready stream=%s "
            "size=%s",
            stream_id,
            len(stdout),
        )

        return stdout


stream_preview_service = (
    StreamPreviewService()
)
