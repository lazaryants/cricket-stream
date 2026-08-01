from datetime import (
    datetime,
    timezone,
)
from uuid import UUID

from sqlalchemy import (
    func,
    or_,
    select,
)
from sqlalchemy.ext.asyncio import (
    AsyncSession,
)

from app.core.security import (
    verify_and_update_password,
)
from app.core.tokens import (
    REFRESH_TOKEN_TYPE,
    create_access_token,
    create_refresh_token,
    decode_token,
)
from app.models.user import User


class AuthenticationError(Exception):
    pass


class InactiveUserError(
    AuthenticationError
):
    pass


class AuthService:
    def __init__(
        self,
        db: AsyncSession,
    ):
        self.db = db

    async def get_by_uuid(
        self,
        user_uuid: UUID,
    ) -> User | None:
        result = await self.db.execute(
            select(User).where(
                User.uuid == user_uuid
            )
        )

        return result.scalar_one_or_none()

    async def get_by_login(
        self,
        login: str,
    ) -> User | None:
        normalized = login.strip()

        result = await self.db.execute(
            select(User).where(
                or_(
                    func.lower(
                        User.username
                    )
                    == normalized.lower(),
                    func.lower(
                        User.email
                    )
                    == normalized.lower(),
                )
            )
        )

        return result.scalars().first()

    async def authenticate(
        self,
        login: str,
        password: str,
    ) -> User:
        user = await self.get_by_login(
            login
        )

        if user is None:
            raise AuthenticationError(
                "Invalid username or password"
            )

        valid, updated_hash = (
            verify_and_update_password(
                password,
                user.password_hash,
            )
        )

        if not valid:
            raise AuthenticationError(
                "Invalid username or password"
            )

        if not user.is_active:
            raise InactiveUserError(
                "User account is disabled"
            )

        if updated_hash:
            user.password_hash = (
                updated_hash
            )

        user.last_login_at = datetime.now(
            timezone.utc
        )

        await self.db.commit()
        await self.db.refresh(
            user
        )

        return user

    async def issue_token_pair(
        self,
        user: User,
    ) -> dict:
        subject = str(
            user.uuid
        )

        (
            access_token,
            access_expires_at,
        ) = create_access_token(
            subject,
            user.token_version,
        )

        (
            refresh_token,
            refresh_expires_at,
        ) = create_refresh_token(
            subject,
            user.token_version,
        )

        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
            "access_expires_at": (
                access_expires_at
            ),
            "refresh_expires_at": (
                refresh_expires_at
            ),
        }

    async def refresh_access_token(
        self,
        refresh_token: str,
    ) -> dict:
        payload = decode_token(
            refresh_token,
            REFRESH_TOKEN_TYPE,
        )

        try:
            user_uuid = UUID(
                payload["sub"]
            )
        except (
            KeyError,
            TypeError,
            ValueError,
        ) as exc:
            raise AuthenticationError(
                "Invalid token subject"
            ) from exc

        user = await self.get_by_uuid(
            user_uuid
        )

        if user is None:
            raise AuthenticationError(
                "User not found"
            )

        if not user.is_active:
            raise InactiveUserError(
                "User account is disabled"
            )

        if payload.get("ver") != user.token_version:
            raise AuthenticationError(
                "Token has been revoked"
            )

        (
            access_token,
            access_expires_at,
        ) = create_access_token(
            str(user.uuid),
            user.token_version,
        )

        return {
            "access_token": access_token,
            "token_type": "bearer",
            "access_expires_at": (
                access_expires_at
            ),
        }
