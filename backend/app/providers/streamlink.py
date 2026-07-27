import asyncio
import json
import os
import shutil
from pathlib import Path
from typing import Any
from urllib.parse import urlparse

from app.providers.detector import (
    detect_source_kind,
    normalize_source_url,
)
from app.providers.source import (
    SourceCommand,
    SourceKind,
    SourceProbeResult,
)


class StreamlinkResolver:
    def __init__(
        self,
        binary: str | None = None,
    ):
        self.binary = (
            binary
            or os.getenv(
                "STREAMLINK_BIN"
            )
            or self._find_binary()
        )

    @staticmethod
    def _find_binary() -> str:
        discovered = shutil.which(
            "streamlink"
        )

        if discovered:
            return discovered

        candidates = (
            Path(
                "/opt/cricket-stream/"
                "backend/.venv/bin/"
                "streamlink"
            ),
            Path(
                "/usr/local/bin/"
                "streamlink"
            ),
            Path(
                "/usr/bin/streamlink"
            ),
        )

        for candidate in candidates:
            if (
                candidate.exists()
                and candidate.is_file()
            ):
                return str(candidate)

        raise RuntimeError(
            "Streamlink executable "
            "was not found"
        )

    async def can_handle(
        self,
        source_url: str,
        timeout: float = 20.0,
    ) -> bool:
        normalized = normalize_source_url(
            source_url
        )

        process = (
            await asyncio.create_subprocess_exec(
                self.binary,
                "--can-handle-url",
                normalized,
                stdout=(
                    asyncio.subprocess.PIPE
                ),
                stderr=(
                    asyncio.subprocess.PIPE
                ),
            )
        )

        try:
            await asyncio.wait_for(
                process.communicate(),
                timeout=timeout,
            )
        except asyncio.TimeoutError:
            process.kill()
            await process.communicate()
            return False

        return process.returncode == 0

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

        command = self.build_probe_command(
            normalized,
            quality,
        )

        process = (
            await asyncio.create_subprocess_exec(
                *command,
                stdout=(
                    asyncio.subprocess.PIPE
                ),
                stderr=(
                    asyncio.subprocess.PIPE
                ),
            )
        )

        try:
            stdout, stderr = (
                await asyncio.wait_for(
                    process.communicate(),
                    timeout=timeout,
                )
            )
        except asyncio.TimeoutError:
            process.kill()

            stdout, stderr = (
                await process.communicate()
            )

            return SourceProbeResult(
                success=False,
                source_url=normalized,
                source_kind=source_kind,
                provider=source_kind.value,
                quality=quality,
                error=(
                    "Streamlink probe "
                    f"timed out after "
                    f"{timeout:.0f} seconds"
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
                    or (
                        "Streamlink returned "
                        f"exit code "
                        f"{process.returncode}"
                    )
                ),
            )

        resolved_url = self._extract_url(
            stdout_text
        )

        if not resolved_url:
            return SourceProbeResult(
                success=False,
                source_url=normalized,
                source_kind=source_kind,
                provider=source_kind.value,
                quality=quality,
                error=(
                    "Streamlink did not "
                    "return a playable URL"
                ),
            )

        parsed = urlparse(
            resolved_url
        )

        plugin = await self.get_plugin_name(
            normalized
        )

        return SourceProbeResult(
            success=True,
            source_url=normalized,
            source_kind=source_kind,
            provider=source_kind.value,
            quality=quality,
            plugin=plugin,
            resolved_url=(
                resolved_url
                if include_resolved_url
                else None
            ),
            resolved_host=parsed.hostname,
            metadata={
                "streamlink_binary": (
                    self.binary
                ),
                "streamlink_exit_code": (
                    process.returncode
                ),
                "resolved_scheme": (
                    parsed.scheme
                ),
            },
        )

    async def get_plugin_name(
        self,
        source_url: str,
        timeout: float = 20.0,
    ) -> str | None:
        command = [
            self.binary,
            "--json",
            "--stream-url",
            source_url,
            "best",
        ]

        process = (
            await asyncio.create_subprocess_exec(
                *command,
                stdout=(
                    asyncio.subprocess.PIPE
                ),
                stderr=(
                    asyncio.subprocess.PIPE
                ),
            )
        )

        try:
            stdout, _ = (
                await asyncio.wait_for(
                    process.communicate(),
                    timeout=timeout,
                )
            )
        except asyncio.TimeoutError:
            process.kill()
            await process.communicate()
            return None

        if process.returncode != 0:
            return None

        text = stdout.decode(
            errors="replace"
        ).strip()

        try:
            data: Any = json.loads(text)
        except json.JSONDecodeError:
            return None

        return self._find_plugin_name(
            data
        )

    def build_stream_command(
        self,
        source_url: str,
        quality: str = "best",
    ) -> SourceCommand:
        normalized = normalize_source_url(
            source_url
        )

        source_kind = detect_source_kind(
            normalized
        )

        if source_kind == SourceKind.DIRECT:
            return SourceCommand(
                source_kind=source_kind,
                provider=source_kind.value,
                quality=quality,
                command=None,
                direct_url=normalized,
            )

        command = [
            self.binary,
            "--stdout",
            "--loglevel",
            "info",
            "--retry-open",
            "3",
            "--stream-segment-attempts",
            "10",
            "--stream-segment-timeout",
            "10",
            "--stream-timeout",
            "60",
            "--hls-live-edge",
            "3",
            normalized,
            quality,
        ]

        if source_kind == SourceKind.KICK:
            command.insert(
                1,
                "--kick-low-latency",
            )

        return SourceCommand(
            source_kind=source_kind,
            provider=source_kind.value,
            quality=quality,
            command=command,
            direct_url=None,
        )

    def build_probe_command(
        self,
        source_url: str,
        quality: str,
    ) -> list[str]:
        return [
            self.binary,
            "--stream-url",
            "--retry-open",
            "2",
            "--stream-segment-attempts",
            "3",
            source_url,
            quality,
        ]

    @staticmethod
    def _extract_url(
        output: str,
    ) -> str | None:
        for line in reversed(
            output.splitlines()
        ):
            candidate = line.strip()

            if candidate.startswith(
                (
                    "http://",
                    "https://",
                    "rtmp://",
                    "rtmps://",
                )
            ):
                return candidate

        return None

    @staticmethod
    def _clean_error(
        error: str,
    ) -> str:
        lines = [
            line.strip()
            for line in error.splitlines()
            if line.strip()
        ]

        if not lines:
            return "Unknown Streamlink error"

        important = [
            line
            for line in lines
            if any(
                marker in line.lower()
                for marker in (
                    "error",
                    "failed",
                    "no plugin",
                    "no playable",
                    "no streams",
                    "offline",
                    "forbidden",
                    "not found",
                )
            )
        ]

        selected = (
            important[-1]
            if important
            else lines[-1]
        )

        return selected[:1000]

    @classmethod
    def _find_plugin_name(
        cls,
        value: Any,
    ) -> str | None:
        if isinstance(value, dict):
            for key in (
                "plugin",
                "pluginname",
                "plugin_name",
            ):
                plugin = value.get(key)

                if isinstance(
                    plugin,
                    str,
                ):
                    return plugin

                if isinstance(
                    plugin,
                    dict,
                ):
                    name = plugin.get(
                        "name"
                    )

                    if isinstance(
                        name,
                        str,
                    ):
                        return name

            for nested in value.values():
                found = (
                    cls._find_plugin_name(
                        nested
                    )
                )

                if found:
                    return found

        if isinstance(value, list):
            for nested in value:
                found = (
                    cls._find_plugin_name(
                        nested
                    )
                )

                if found:
                    return found

        return None
