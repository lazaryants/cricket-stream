from datetime import datetime
from uuid import UUID

from pydantic import (
    BaseModel,
    ConfigDict,
    Field,
)

from app.models.enums import UserRole


class UserCreate(BaseModel):
    username: str = Field(
        min_length=3,
        max_length=100,
        pattern=r"^[a-zA-Z0-9_.-]+$",
    )

    email: str | None = Field(
        default=None,
        max_length=320,
    )

    password: str = Field(
        min_length=8,
        max_length=1024,
    )

    role: UserRole = UserRole.VIEWER

    is_active: bool = True


class UserUpdate(BaseModel):
    email: str | None = Field(
        default=None,
        max_length=320,
    )

    role: UserRole | None = None

    is_active: bool | None = None

    password: str | None = Field(
        default=None,
        min_length=8,
        max_length=1024,
    )


class AdminResetPasswordRequest(BaseModel):
    new_password: str = Field(
        min_length=8,
        max_length=1024,
    )


class UserResponse(BaseModel):
    model_config = ConfigDict(
        from_attributes=True
    )

    id: int
    uuid: UUID
    username: str
    email: str | None
    role: UserRole
    is_active: bool
    is_superuser: bool
    last_login_at: datetime | None
    created_at: datetime
    updated_at: datetime
