from datetime import (
    datetime,
    timedelta,
    timezone,
)
from typing import Any
from uuid import uuid4

import jwt

from app.core.auth_config import (
    auth_settings,
)


ACCESS_TOKEN_TYPE = "access"
REFRESH_TOKEN_TYPE = "refresh"
PLAYBACK_TOKEN_TYPE = "playback"


class TokenError(Exception):
    pass


class TokenExpiredError(TokenError):
    pass


class InvalidTokenError(TokenError):
    pass


def _create_token(
    *,
    subject: str,
    token_type: str,
    expires_delta: timedelta,
) -> tuple[str, datetime]:
    now = datetime.now(
        timezone.utc
    )

    expires_at = (
        now + expires_delta
    )

    payload: dict[str, Any] = {
        "sub": subject,
        "type": token_type,
        "iat": now,
        "nbf": now,
        "exp": expires_at,
        "jti": str(uuid4()),
    }

    encoded = jwt.encode(
        payload,
        auth_settings.secret_key,
        algorithm=(
            auth_settings.algorithm
        ),
    )

    return encoded, expires_at


def create_access_token(
    subject: str,
) -> tuple[str, datetime]:
    return _create_token(
        subject=subject,
        token_type=ACCESS_TOKEN_TYPE,
        expires_delta=timedelta(
            minutes=(
                auth_settings
                .access_token_minutes
            )
        ),
    )


def create_refresh_token(
    subject: str,
) -> tuple[str, datetime]:
    return _create_token(
        subject=subject,
        token_type=REFRESH_TOKEN_TYPE,
        expires_delta=timedelta(
            days=(
                auth_settings
                .refresh_token_days
            )
        ),
    )


def create_playback_token(
    stream_id: int,
) -> tuple[str, datetime]:
    return _create_token(
        subject=str(stream_id),
        token_type=PLAYBACK_TOKEN_TYPE,
        expires_delta=timedelta(hours=2),
    )


def decode_token(
    token: str,
    expected_type: str,
) -> dict[str, Any]:
    try:
        payload = jwt.decode(
            token,
            auth_settings.secret_key,
            algorithms=[
                auth_settings.algorithm
            ],
            options={
                "require": [
                    "sub",
                    "type",
                    "iat",
                    "nbf",
                    "exp",
                    "jti",
                ]
            },
        )

    except jwt.ExpiredSignatureError as exc:
        raise TokenExpiredError(
            "Token has expired"
        ) from exc

    except jwt.PyJWTError as exc:
        raise InvalidTokenError(
            "Invalid token"
        ) from exc

    token_type = payload.get(
        "type"
    )

    if token_type != expected_type:
        raise InvalidTokenError(
            "Incorrect token type"
        )

    subject = payload.get(
        "sub"
    )

    if (
        not isinstance(subject, str)
        or not subject
    ):
        raise InvalidTokenError(
            "Token subject is missing"
        )

    return payload
