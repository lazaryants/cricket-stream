from enum import Enum


class ProviderType(str, Enum):
    YOUTUBE = "youtube"
    TWITCH = "twitch"
    KICK = "kick"
    VIMEO = "vimeo"
    CUSTOM = "custom"
    UNKNOWN = "unknown"


class StreamStatus(str, Enum):
    DRAFT = "draft"
    READY = "ready"
    STARTING = "starting"
    RUNNING = "running"
    STOPPING = "stopping"
    STOPPED = "stopped"
    ERROR = "error"


class SessionStatus(str, Enum):
    STARTING = "starting"
    RUNNING = "running"
    STOPPED = "stopped"
    FAILED = "failed"


class EventType(str, Enum):
    CREATED = "created"
    STARTED = "started"
    CONNECTED = "connected"
    STOPPED = "stopped"
    ERROR = "error"
    WARNING = "warning"
