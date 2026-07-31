import asyncio
import os
import shutil
from pathlib import Path
from urllib.parse import urlparse

from app.providers.detector import (
    detect_source_kind,
    normalize_source_url,
)
from app.providers.source import (
    SourceProbeResult,
)


class YtDlpResolver:
    def __init__(
        self,
        binary: str | None = None,
    ):
        self.binary = (
            binary
            or os.getenv("YT_DLP_BIN")
            or self._find_binary()
        )

    @staticmethod
    def _find_binary() -> str:
        discovered = shutil.which("yt-dlp")
        if discovered:
            return discovered

        for candidate in (
            Path(
                "/opt/cricket-stream/"
                "backend/.venv/bin/yt-dlp"
            ),
            Path("/usr/local/bin/yt-dlp"),
            Path("/usr/bin/yt-dlp"),
        ):
            if candidate.is_file():
                return str(candidate)

        # Keep application startup available so an
        # administrator can see the missing component.
        return "/usr/bin/yt-dlp"

    async def probe(
        self,
        source_url: str,
        quality: str = "best",
        timeout: float = 35.0,
        include_resolved_url: bool = False,
    ) -> SourceProbeResult:
        normalized = normalize_source_url(
            source_url
        )
        source_kind = detect_source_kind(
            normalized
        )
        binary_path = Path(self.binary)
        if (
            not binary_path.is_file()
            or not os.access(binary_path, os.X_OK)
        ):
            return SourceProbeResult(
                success=False,
                source_url=normalized,
                source_kind=source_kind,
                provider=source_kind.value,
                quality=quality,
                error=(
                    "yt-dlp is not executable: "
                    f"{self.binary}"
                ),
            )
        command = [
            self.binary,
            "--no-playlist",
            "--no-warnings",
            "--get-url",
            "--format",
            quality,
            normalized,
        ]

        try:
            process = await asyncio.create_subprocess_exec(
                *command,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
            )
        except OSError as exc:
            return SourceProbeResult(
                success=False,
                source_url=normalized,
                source_kind=source_kind,
                provider=source_kind.value,
                quality=quality,
                error=f"yt-dlp extraction error: {exc}",
            )

        try:
            stdout, stderr = await asyncio.wait_for(
                process.communicate(),
                timeout=timeout,
            )
        except asyncio.TimeoutError:
            process.kill()
            await process.communicate()
            return SourceProbeResult(
                success=False,
                source_url=normalized,
                source_kind=source_kind,
                provider=source_kind.value,
                quality=quality,
                error=(
                    "yt-dlp URL extraction timed out"
                ),
            )

        stdout_text = stdout.decode(
            errors="replace"
        ).strip()
        stderr_text = stderr.decode(
            errors="replace"
        ).strip()

        if process.returncode != 0:
            return SourceProbeResult(
                success=False,
                source_url=normalized,
                source_kind=source_kind,
                provider=source_kind.value,
                quality=quality,
                error=self._clean_error(
                    stderr_text
                    or stdout_text
                    or "yt-dlp could not extract a media URL"
                ),
            )

        urls = [
            line.strip()
            for line in stdout_text.splitlines()
            if line.strip().startswith(
                ("http://", "https://")
            )
        ]

        if not urls:
            error = (
                "yt-dlp did not return a direct media URL"
            )
            resolved_url = None
        elif len(urls) > 1:
            error = (
                "yt-dlp returned separate audio and video URLs; "
                "select a combined format"
            )
            resolved_url = None
        else:
            error = None
            resolved_url = urls[0]

        parsed = urlparse(resolved_url or "")
        return SourceProbeResult(
            success=resolved_url is not None,
            source_url=normalized,
            source_kind=source_kind,
            provider=source_kind.value,
            quality=quality,
            plugin="yt-dlp",
            resolved_url=(
                resolved_url
                if include_resolved_url
                else None
            ),
            resolved_host=parsed.hostname,
            error=error,
            metadata={
                "resolver": "yt-dlp",
                "yt_dlp_binary": self.binary,
                "yt_dlp_exit_code": process.returncode,
            },
        )

    @staticmethod
    def _clean_error(error: str) -> str:
        lines = [
            line.strip()
            for line in error.splitlines()
            if line.strip()
        ]
        return (
            lines[-1][:1000]
            if lines
            else "Unknown yt-dlp error"
        )
