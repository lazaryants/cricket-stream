from collections.abc import (
    Callable,
)
from uuid import UUID

from fastapi import (
    Depends,
    HTTPException,
    status,
)
from fastapi.security import (
    OAuth2PasswordBearer,
)
from sqlalchemy.ext.asyncio import (
    AsyncSession,
)

from app.core.dependencies import get_db
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


oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="/api/v1/auth/login"
)


def credentials_exception(
    detail: str = "Invalid authentication credentials",
) -> HTTPException:
    return HTTPException(
        status_code=(
            status.HTTP_401_UNAUTHORIZED
        ),
        detail=detail,
        headers={
            "WWW-Authenticate": "Bearer"
        },
    )


async def get_current_user(
    token: str = Depends(
        oauth2_scheme
    ),
    db: AsyncSession = Depends(
        get_db
    ),
) -> User:
    try:
        payload = decode_token(
            token,
            ACCESS_TOKEN_TYPE,
        )

    except TokenExpiredError as exc:
        raise credentials_exception(
            "Access token has expired"
        ) from exc

    except InvalidTokenError as exc:
        raise credentials_exception() from exc

    try:
        user_uuid = UUID(
            payload["sub"]
        )
    except (
        KeyError,
        TypeError,
        ValueError,
    ) as exc:
        raise credentials_exception() from exc

    service = AuthService(
        db
    )

    user = await service.get_by_uuid(
        user_uuid
    )

    if user is None:
        raise credentials_exception(
            "User no longer exists"
        )

    if not user.is_active:
        raise HTTPException(
            status_code=(
                status.HTTP_403_FORBIDDEN
            ),
            detail=(
                "User account is disabled"
            ),
        )

    return user


def require_roles(
    *allowed_roles: UserRole,
) -> Callable:
    async def dependency(
        current_user: User = Depends(
            get_current_user
        ),
    ) -> User:
        if current_user.is_superuser:
            return current_user

        if (
            current_user.role
            not in allowed_roles
        ):
            raise HTTPException(
                status_code=(
                    status.HTTP_403_FORBIDDEN
                ),
                detail=(
                    "Insufficient permissions"
                ),
            )

        return current_user

    return dependency


require_viewer = require_roles(
    UserRole.VIEWER,
    UserRole.OPERATOR,
    UserRole.ADMIN,
)

require_operator = require_roles(
    UserRole.OPERATOR,
    UserRole.ADMIN,
)

require_admin = require_roles(
    UserRole.ADMIN,
)
