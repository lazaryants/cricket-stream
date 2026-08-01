from datetime import datetime
from uuid import UUID

from pydantic import (
    BaseModel,
    ConfigDict,
    Field,
)

from app.models.enums import UserRole


class LoginRequest(BaseModel):
    username: str = Field(
        min_length=1,
        max_length=320,
    )

    password: str = Field(
        min_length=1,
        max_length=1024,
    )


class RefreshRequest(BaseModel):
    refresh_token: str = Field(
        min_length=20,
        max_length=4096,
    )


class ChangePasswordRequest(BaseModel):
    current_password: str = Field(
        min_length=1,
        max_length=1024,
    )

    new_password: str = Field(
        min_length=8,
        max_length=1024,
    )


class TokenPairResponse(BaseModel):
    access_token: str
    refresh_token: str

    token_type: str = "bearer"

    access_expires_at: datetime
    refresh_expires_at: datetime


class AccessTokenResponse(BaseModel):
    access_token: str

    token_type: str = "bearer"

    access_expires_at: datetime


class CurrentUserResponse(BaseModel):
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
