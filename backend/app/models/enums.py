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
    RESTARTING = "restarting"
    STOPPING = "stopping"
    STOPPED = "stopped"
    ERROR = "error"

class StreamSessionStatus(str, Enum):
    draft = "draft"
    starting = "starting"
    running = "running"
    stopping = "stopping"
    stopped = "stopped"
    error = "error"


class EventType(str, Enum):
    CREATED = "created"
    STARTED = "started"
    CONNECTED = "connected"
    STOPPED = "stopped"
    ERROR = "error"
    WARNING = "warning"
