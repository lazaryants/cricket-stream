import asyncio
import json
import re
from datetime import datetime, timezone
from urllib.request import Request, urlopen

from fastapi import APIRouter, Depends, Query

from app.core.auth_dependencies import require_admin
from app.core.config import settings
from app.models.user import User


router = APIRouter(
    prefix="/components",
    tags=["components"],
)

_cache: dict | None = None
_cache_time: datetime | None = None
_cache_lock = asyncio.Lock()


def _versions_differ(
    installed: str,
    available: str,
) -> bool:
    installed_numbers = tuple(
        int(value)
        for value in re.findall(r"\d+", installed)
    )
    available_numbers = tuple(
        int(value)
        for value in re.findall(r"\d+", available)
    )
    if installed_numbers and available_numbers:
        return installed_numbers != available_numbers
    return installed != available


async def _run_version(
    *command: str,
) -> tuple[int, str]:
    try:
        process = await asyncio.create_subprocess_exec(
            *command,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.STDOUT,
        )
        stdout, _ = await asyncio.wait_for(
            process.communicate(),
            timeout=10,
        )
        return (
            process.returncode or 0,
            stdout.decode(errors="replace").strip(),
        )
    except Exception as exc:
        return 1, str(exc)


def _pypi_latest(package: str) -> str:
    request = Request(
        f"https://pypi.org/pypi/{package}/json",
        headers={
            "User-Agent": "Cricket-Stream-Platform/0.1",
        },
    )
    with urlopen(request, timeout=10) as response:
        data = json.load(response)
    return str(data["info"]["version"])


async def _python_component(
    name: str,
    binary: str,
) -> dict:
    code, output = await _run_version(
        binary,
        "--version",
    )
    installed = None
    if code == 0 and output:
        first_line = output.splitlines()[0].strip()
        installed = first_line.split()[-1]
    try:
        available = await asyncio.to_thread(
            _pypi_latest,
            name,
        )
        check_error = None
    except Exception as exc:
        available = None
        check_error = str(exc)[:500]

    return {
        "installed": installed,
        "available": available,
        "update_available": bool(
            installed
            and available
            and _versions_differ(
                installed,
                available,
            )
        ),
        "error": (
            check_error
            or (output[:500] if code else None)
        ),
    }


async def _ffmpeg_component() -> dict:
    code, output = await _run_version(
        settings.ffmpeg_path,
        "-version",
    )
    installed = None
    if code == 0 and output:
        first_line = output.splitlines()[0]
        parts = first_line.split()
        if len(parts) >= 3:
            installed = parts[2]

    policy_code, policy_output = await _run_version(
        "/usr/bin/apt-cache",
        "policy",
        "ffmpeg",
    )
    candidate = None
    if policy_code == 0:
        for line in policy_output.splitlines():
            if line.strip().startswith("Candidate:"):
                candidate = line.split(":", 1)[1].strip()
                break

    return {
        "installed": installed,
        "available": candidate,
        # Ubuntu package and upstream version strings
        # are not directly comparable.
        "update_available": None,
        "error": output[:500] if code else None,
    }


async def _build_status() -> dict:
    streamlink, ytdlp, ffmpeg = await asyncio.gather(
        _python_component(
            "streamlink",
            settings.streamlink_path,
        ),
        _python_component(
            "yt-dlp",
            settings.yt_dlp_path,
        ),
        _ffmpeg_component(),
    )
    return {
        "checked_at": datetime.now(
            timezone.utc
        ).isoformat(),
        "components": {
            "streamlink": streamlink,
            "yt-dlp": ytdlp,
            "ffmpeg": ffmpeg,
        },
    }


@router.get("")
async def get_components(
    refresh: bool = Query(False),
    current_user: User = Depends(require_admin),
):
    del current_user
    global _cache, _cache_time

    async with _cache_lock:
        now = datetime.now(timezone.utc)
        cache_fresh = (
            _cache is not None
            and _cache_time is not None
            and (now - _cache_time).total_seconds() < 600
        )
        if refresh or not cache_fresh:
            _cache = await _build_status()
            _cache_time = now
        return _cache
