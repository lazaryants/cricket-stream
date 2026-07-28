from dataclasses import dataclass

from app.core.config import settings


@dataclass(frozen=True)
class AuthSettings:
    secret_key: str
    algorithm: str
    access_token_minutes: int
    refresh_token_days: int


def load_auth_settings() -> AuthSettings:
    secret_key = (
        settings.jwt_secret_key.strip()
    )

    if len(secret_key) < 64:
        raise RuntimeError(
            "JWT_SECRET_KEY is missing "
            "or too short"
        )

    algorithm = (
        settings.jwt_algorithm.strip()
    )

    if algorithm != "HS256":
        raise RuntimeError(
            "Only JWT_ALGORITHM=HS256 "
            "is currently supported"
        )

    access_token_minutes = (
        settings.jwt_access_token_minutes
    )

    if access_token_minutes <= 0:
        raise RuntimeError(
            "JWT_ACCESS_TOKEN_MINUTES "
            "must be positive"
        )

    refresh_token_days = (
        settings.jwt_refresh_token_days
    )

    if refresh_token_days <= 0:
        raise RuntimeError(
            "JWT_REFRESH_TOKEN_DAYS "
            "must be positive"
        )

    return AuthSettings(
        secret_key=secret_key,
        algorithm=algorithm,
        access_token_minutes=(
            access_token_minutes
        ),
        refresh_token_days=(
            refresh_token_days
        ),
    )


auth_settings = load_auth_settings()
