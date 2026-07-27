from dataclasses import dataclass, field
from enum import Enum
from typing import Any


class SourceKind(str, Enum):
    DIRECT = "direct"
    TWITCH = "twitch"
    KICK = "kick"
    YOUTUBE = "youtube"
    VIMEO = "vimeo"
    GENERIC = "generic"


@dataclass(slots=True)
class SourceProbeResult:
    success: bool
    source_url: str
    source_kind: SourceKind
    provider: str
    quality: str
    plugin: str | None = None
    resolved_url: str | None = None
    resolved_host: str | None = None
    error: str | None = None
    available_streams: list[str] = field(
        default_factory=list
    )
    metadata: dict[str, Any] = field(
        default_factory=dict
    )


@dataclass(slots=True)
class SourceCommand:
    source_kind: SourceKind
    provider: str
    quality: str
    command: list[str] | None
    direct_url: str | None
