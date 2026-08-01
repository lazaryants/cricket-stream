from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import (
    hash_password,
    verify_password,
)
from app.models.user import User


class InvalidCurrentPasswordError(Exception):
    pass


class PasswordUnchangedError(Exception):
    pass


class UserNotFoundError(Exception):
    pass


class UserService:
    def __init__(
        self,
        db: AsyncSession,
    ):
        self.db = db

    async def list_users(self) -> list[User]:
        result = await self.db.execute(
            select(User).order_by(User.id.asc())
        )
        return list(result.scalars().all())

    async def change_own_password(
        self,
        user: User,
        current_password: str,
        new_password: str,
    ) -> None:
        if not verify_password(
            current_password,
            user.password_hash,
        ):
            raise InvalidCurrentPasswordError

        if verify_password(
            new_password,
            user.password_hash,
        ):
            raise PasswordUnchangedError

        user.password_hash = hash_password(
            new_password
        )
        user.token_version += 1
        await self.db.commit()

    async def reset_password(
        self,
        user_id: int,
        new_password: str,
    ) -> User:
        user = await self.db.get(
            User,
            user_id,
        )
        if user is None:
            raise UserNotFoundError

        if verify_password(
            new_password,
            user.password_hash,
        ):
            raise PasswordUnchangedError

        user.password_hash = hash_password(
            new_password
        )
        user.token_version += 1
        await self.db.commit()
        await self.db.refresh(user)
        return user
