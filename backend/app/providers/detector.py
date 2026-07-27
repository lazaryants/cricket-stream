from urllib.parse import urlparse

from app.providers.source import SourceKind


DIRECT_SUFFIXES = (
    ".m3u8",
    ".mpd",
    ".flv",
    ".ts",
    ".mkv",
    ".mp4",
)

TWITCH_HOSTS = (
    "twitch.tv",
    "www.twitch.tv",
    "m.twitch.tv",
)

KICK_HOSTS = (
    "kick.com",
    "www.kick.com",
)

YOUTUBE_HOSTS = (
    "youtube.com",
    "www.youtube.com",
    "m.youtube.com",
    "youtu.be",
)

VIMEO_HOSTS = (
    "vimeo.com",
    "www.vimeo.com",
    "player.vimeo.com",
)


def normalize_source_url(
    source_url: str,
) -> str:
    normalized = source_url.strip()

    if not normalized:
        raise ValueError(
            "Source URL is empty"
        )

    parsed = urlparse(normalized)

    if not parsed.scheme:
        normalized = (
            f"https://{normalized}"
        )
        parsed = urlparse(normalized)

    if parsed.scheme not in (
        "http",
        "https",
        "rtmp",
        "rtmps",
        "srt",
    ):
        raise ValueError(
            "Unsupported source URL scheme"
        )

    if not parsed.hostname:
        raise ValueError(
            "Source URL has no hostname"
        )

    return normalized


def detect_source_kind(
    source_url: str,
) -> SourceKind:
    normalized = normalize_source_url(
        source_url
    )
    parsed = urlparse(normalized)

    hostname = (
        parsed.hostname or ""
    ).lower()

    path = parsed.path.lower()

    if parsed.scheme in (
        "rtmp",
        "rtmps",
        "srt",
    ):
        return SourceKind.DIRECT

    if path.endswith(
        DIRECT_SUFFIXES
    ):
        return SourceKind.DIRECT

    if hostname in TWITCH_HOSTS:
        return SourceKind.TWITCH

    if hostname in KICK_HOSTS:
        return SourceKind.KICK

    if hostname in YOUTUBE_HOSTS:
        return SourceKind.YOUTUBE

    if hostname in VIMEO_HOSTS:
        return SourceKind.VIMEO

    return SourceKind.GENERIC
