from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status,
)
from sqlalchemy.ext.asyncio import (
    AsyncSession,
)

from app.core.auth_dependencies import (
    get_current_user,
)
from app.core.dependencies import get_db
from app.core.tokens import (
    InvalidTokenError,
    TokenExpiredError,
)
from app.models.user import User
from app.schemas.auth import (
    AccessTokenResponse,
    CurrentUserResponse,
    LoginRequest,
    RefreshRequest,
    TokenPairResponse,
)
from app.services.auth_service import (
    AuthenticationError,
    AuthService,
    InactiveUserError,
)


router = APIRouter(
    prefix="/auth",
    tags=["authentication"],
)


@router.post(
    "/login",
    response_model=TokenPairResponse,
)
async def login(
    data: LoginRequest,
    db: AsyncSession = Depends(
        get_db
    ),
):
    service = AuthService(
        db
    )

    try:
        user = await service.authenticate(
            data.username,
            data.password,
        )

    except InactiveUserError as exc:
        raise HTTPException(
            status_code=(
                status.HTTP_403_FORBIDDEN
            ),
            detail=str(exc),
        ) from exc

    except AuthenticationError as exc:
        raise HTTPException(
            status_code=(
                status.HTTP_401_UNAUTHORIZED
            ),
            detail=(
                "Invalid username or password"
            ),
            headers={
                "WWW-Authenticate": "Bearer"
            },
        ) from exc

    return await service.issue_token_pair(
        user
    )


@router.post(
    "/refresh",
    response_model=AccessTokenResponse,
)
async def refresh_token(
    data: RefreshRequest,
    db: AsyncSession = Depends(
        get_db
    ),
):
    service = AuthService(
        db
    )

    try:
        return await service.refresh_access_token(
            data.refresh_token
        )

    except TokenExpiredError as exc:
        raise HTTPException(
            status_code=(
                status.HTTP_401_UNAUTHORIZED
            ),
            detail=(
                "Refresh token has expired"
            ),
        ) from exc

    except (
        InvalidTokenError,
        AuthenticationError,
    ) as exc:
        raise HTTPException(
            status_code=(
                status.HTTP_401_UNAUTHORIZED
            ),
            detail="Invalid refresh token",
        ) from exc

    except InactiveUserError as exc:
        raise HTTPException(
            status_code=(
                status.HTTP_403_FORBIDDEN
            ),
            detail=str(exc),
        ) from exc


@router.get(
    "/me",
    response_model=CurrentUserResponse,
)
async def current_user(
    user: User = Depends(
        get_current_user
    ),
):
    return user
