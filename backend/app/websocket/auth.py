from uuid import UUID

from fastapi import WebSocket

from app.core.database import (
    AsyncSessionLocal,
)
from app.core.tokens import (
    ACCESS_TOKEN_TYPE,
    InvalidTokenError,
    TokenExpiredError,
    decode_token,
)
from app.models.enums import UserRole
from app.models.user import User
from app.services.auth_service import (
    AuthService,
)


class WebSocketAuthenticationError(
    Exception
):
    pass


def get_websocket_token(
    websocket: WebSocket,
) -> str:
    header = websocket.headers.get(
        "sec-websocket-protocol",
        "",
    )

    protocols = [
        item.strip()
        for item in header.split(",")
        if item.strip()
    ]

    if len(protocols) < 2:
        raise WebSocketAuthenticationError(
            "Access token is missing"
        )

    if protocols[0] != "access_token":
        raise WebSocketAuthenticationError(
            "Unsupported authentication protocol"
        )

    return protocols[1]


async def authenticate_websocket(
    websocket: WebSocket,
) -> User:
    token = get_websocket_token(
        websocket
    )

    try:
        payload = decode_token(
            token,
            ACCESS_TOKEN_TYPE,
        )
    except TokenExpiredError as exc:
        raise WebSocketAuthenticationError(
            "Access token has expired"
        ) from exc
    except InvalidTokenError as exc:
        raise WebSocketAuthenticationError(
            "Invalid access token"
        ) from exc

    try:
        user_uuid = UUID(
            payload["sub"]
        )
    except (
        KeyError,
        TypeError,
        ValueError,
    ) as exc:
        raise WebSocketAuthenticationError(
            "Invalid token subject"
        ) from exc

    async with AsyncSessionLocal() as db:
        service = AuthService(
            db
        )

        user = await service.get_by_uuid(
            user_uuid
        )

        if user is None:
            raise WebSocketAuthenticationError(
                "User no longer exists"
            )

        if not user.is_active:
            raise WebSocketAuthenticationError(
                "User account is disabled"
            )

        allowed_roles = {
            UserRole.VIEWER,
            UserRole.OPERATOR,
            UserRole.ADMIN,
        }

        if (
            not user.is_superuser
            and user.role
            not in allowed_roles
        ):
            raise WebSocketAuthenticationError(
                "Insufficient permissions"
            )

        # После закрытия DB-сессии объект User
        # больше не используется для запросов.
        return user
