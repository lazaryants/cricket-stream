from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    jwt_secret_key: str
    jwt_algorithm: str = "HS256"
    jwt_access_token_minutes: int = 15
    jwt_refresh_token_days: int = 7

    app_name: str
    app_version: str
    debug: bool

    host: str
    port: int

    database_url: str

    ffmpeg_path: str
    streamlink_path: str
    yt_dlp_path: str

    max_streams: int
    preview_interval: int
    hls_dir: str = "/opt/cricket-stream/var/hls"
    hls_segment_time: int = 4
    hls_list_size: int = 6
    media_startup_grace_seconds: float = 45.0
    media_stall_timeout_seconds: float = 30.0

    log_level: str

    model_config = SettingsConfigDict(
        env_file=".env",
        case_sensitive=False,
    )


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
