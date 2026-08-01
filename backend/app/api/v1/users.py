from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Response,
    status,
)
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth_dependencies import (
    require_admin,
)
from app.core.dependencies import get_db
from app.models.user import User
from app.schemas.user import (
    AdminResetPasswordRequest,
    UserResponse,
)
from app.services.user_service import (
    PasswordUnchangedError,
    UserNotFoundError,
    UserService,
)


router = APIRouter(
    prefix="/users",
    tags=["users"],
)


@router.get(
    "",
    response_model=list[UserResponse],
)
async def list_users(
    _: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    return await UserService(db).list_users()


@router.put(
    "/{user_id}/password",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def reset_user_password(
    user_id: int,
    data: AdminResetPasswordRequest,
    _: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    try:
        await UserService(db).reset_password(
            user_id,
            data.new_password,
        )
    except UserNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        ) from exc
    except PasswordUnchangedError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password must differ from the current password",
        ) from exc
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc

    return Response(
        status_code=status.HTTP_204_NO_CONTENT
    )
