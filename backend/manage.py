import argparse
import asyncio
import getpass
import re
import sys
from typing import NoReturn

from sqlalchemy import or_, select
from sqlalchemy.exc import IntegrityError

from app.core.database import AsyncSessionLocal
from app.core.security import (
    hash_password,
    verify_password,
)
from app.models.enums import UserRole
from app.models.node import Node
from app.models.user import User


USERNAME_PATTERN = re.compile(
    r"^[a-zA-Z0-9_.-]+$"
)


def exit_error(
    message: str,
    code: int = 1,
) -> NoReturn:
    print(
        f"ERROR: {message}",
        file=sys.stderr,
    )
    raise SystemExit(code)


def normalize_username(
    username: str,
) -> str:
    normalized = username.strip()

    if len(normalized) < 3:
        exit_error(
            "username must contain at least "
            "3 characters"
        )

    if len(normalized) > 100:
        exit_error(
            "username must not exceed "
            "100 characters"
        )

    if not USERNAME_PATTERN.fullmatch(
        normalized
    ):
        exit_error(
            "username may contain only letters, "
            "numbers, dots, underscores and hyphens"
        )

    return normalized


def normalize_email(
    email: str | None,
) -> str | None:
    if email is None:
        return None

    normalized = email.strip().lower()

    if not normalized:
        return None

    if len(normalized) > 320:
        exit_error(
            "email must not exceed 320 characters"
        )

    if (
        "@" not in normalized
        or normalized.startswith("@")
        or normalized.endswith("@")
    ):
        exit_error(
            "invalid email address"
        )

    return normalized


def read_password(
    prompt: str = "Password: ",
    repeat: bool = True,
) -> str:
    password = getpass.getpass(
        prompt
    )

    if repeat:
        password_repeat = getpass.getpass(
            "Repeat password: "
        )

        if password != password_repeat:
            exit_error(
                "passwords do not match"
            )

    try:
        # Проверяем требования и одновременно
        # убеждаемся, что Argon2 может создать хеш.
        hash_password(
            password
        )
    except ValueError as exc:
        exit_error(
            str(exc)
        )

    return password


async def find_user(
    identifier: str,
) -> User | None:
    """
    Ищет пользователя по username или email.
    """
    normalized = identifier.strip()

    async with AsyncSessionLocal() as db:
        result = await db.execute(
            select(User).where(
                or_(
                    User.username == normalized,
                    User.email == normalized.lower(),
                )
            )
        )

        return result.scalars().first()


async def create_node() -> None:
    async with AsyncSessionLocal() as session:
        result = await session.execute(
            select(Node).where(
                Node.hostname
                == "de.cricket-stream.icu"
            )
        )

        existing = (
            result.scalar_one_or_none()
        )

        if existing:
            print(
                "Node already exists:"
            )
            print(
                f"ID: {existing.id}"
            )
            print(
                f"Name: {existing.name}"
            )
            print(
                f"UUID: {existing.uuid}"
            )
            return

        node = Node(
            name="Germany #1",
            hostname="de.cricket-stream.icu",
            ip_address="144.31.188.28",
            location="Germany",
            enabled=True,
        )

        session.add(
            node
        )

        await session.commit()
        await session.refresh(
            node
        )

        print(
            "Created node:"
        )
        print(
            f"ID: {node.id}"
        )
        print(
            f"UUID: {node.uuid}"
        )
        print(
            f"Name: {node.name}"
        )


async def create_user(
    args: argparse.Namespace,
) -> None:
    username = normalize_username(
        args.username
        or input(
            "Username: "
        )
    )

    email = normalize_email(
        args.email
        if args.email is not None
        else input(
            "Email (optional): "
        )
    )

    try:
        role = UserRole(
            args.role
        )
    except ValueError:
        exit_error(
            f"unknown role: {args.role}"
        )

    password = read_password()

    password_digest = hash_password(
        password
    )

    async with AsyncSessionLocal() as db:
        conditions = [
            User.username == username
        ]

        if email:
            conditions.append(
                User.email == email
            )

        result = await db.execute(
            select(User).where(
                or_(*conditions)
            )
        )

        existing = (
            result.scalars().first()
        )

        if existing:
            exit_error(
                "a user with this username "
                "or email already exists"
            )

        is_superuser = (
            role == UserRole.ADMIN
            and args.superuser
        )

        user = User(
            username=username,
            email=email,
            password_hash=password_digest,
            role=role,
            is_active=not args.inactive,
            is_superuser=is_superuser,
        )

        db.add(
            user
        )

        try:
            await db.commit()
        except IntegrityError as exc:
            await db.rollback()

            exit_error(
                "database rejected the user: "
                f"{exc.orig}"
            )

        await db.refresh(
            user
        )

        print()
        print(
            "User created successfully"
        )
        print(
            f"ID: {user.id}"
        )
        print(
            f"UUID: {user.uuid}"
        )
        print(
            f"Username: {user.username}"
        )
        print(
            f"Email: {user.email}"
        )
        print(
            f"Role: {user.role.value}"
        )
        print(
            f"Active: {user.is_active}"
        )
        print(
            f"Superuser: {user.is_superuser}"
        )


async def list_users() -> None:
    async with AsyncSessionLocal() as db:
        result = await db.execute(
            select(User).order_by(
                User.id.asc()
            )
        )

        users = result.scalars().all()

    if not users:
        print(
            "No users found"
        )
        return

    headers = (
        "ID",
        "USERNAME",
        "EMAIL",
        "ROLE",
        "ACTIVE",
        "SUPERUSER",
    )

    rows = [
        (
            str(user.id),
            user.username,
            user.email or "-",
            user.role.value,
            "yes" if user.is_active else "no",
            (
                "yes"
                if user.is_superuser
                else "no"
            ),
        )
        for user in users
    ]

    widths = [
        max(
            len(headers[index]),
            *(
                len(row[index])
                for row in rows
            ),
        )
        for index in range(
            len(headers)
        )
    ]

    print(
        "  ".join(
            headers[index].ljust(
                widths[index]
            )
            for index in range(
                len(headers)
            )
        )
    )

    print(
        "  ".join(
            "-" * width
            for width in widths
        )
    )

    for row in rows:
        print(
            "  ".join(
                row[index].ljust(
                    widths[index]
                )
                for index in range(
                    len(row)
                )
            )
        )


async def set_user_role(
    args: argparse.Namespace,
) -> None:
    try:
        role = UserRole(
            args.role
        )
    except ValueError:
        exit_error(
            f"unknown role: {args.role}"
        )

    async with AsyncSessionLocal() as db:
        result = await db.execute(
            select(User).where(
                or_(
                    User.username
                    == args.user,
                    User.email
                    == args.user.lower(),
                )
            )
        )

        user = result.scalars().first()

        if user is None:
            exit_error(
                "user not found"
            )

        old_role = user.role

        user.role = role

        # Только admin может быть superuser.
        if role != UserRole.ADMIN:
            user.is_superuser = False

        if args.superuser:
            if role != UserRole.ADMIN:
                exit_error(
                    "only an admin may be "
                    "a superuser"
                )

            user.is_superuser = True

        await db.commit()
        await db.refresh(
            user
        )

        print(
            f"User {user.username}: "
            f"{old_role.value} -> "
            f"{user.role.value}"
        )
        print(
            f"Superuser: "
            f"{user.is_superuser}"
        )


async def set_user_active(
    identifier: str,
    active: bool,
) -> None:
    async with AsyncSessionLocal() as db:
        result = await db.execute(
            select(User).where(
                or_(
                    User.username
                    == identifier,
                    User.email
                    == identifier.lower(),
                )
            )
        )

        user = result.scalars().first()

        if user is None:
            exit_error(
                "user not found"
            )

        user.is_active = active

        await db.commit()
        await db.refresh(
            user
        )

        print(
            f"User {user.username} "
            f"is now "
            f"{'active' if active else 'inactive'}"
        )


async def reset_password(
    args: argparse.Namespace,
) -> None:
    password = read_password(
        prompt="New password: "
    )

    password_digest = hash_password(
        password
    )

    async with AsyncSessionLocal() as db:
        result = await db.execute(
            select(User).where(
                or_(
                    User.username
                    == args.user,
                    User.email
                    == args.user.lower(),
                )
            )
        )

        user = result.scalars().first()

        if user is None:
            exit_error(
                "user not found"
            )

        user.password_hash = (
            password_digest
        )

        await db.commit()

        print(
            f"Password updated for "
            f"{user.username}"
        )


async def verify_user_password(
    args: argparse.Namespace,
) -> None:
    password = getpass.getpass(
        "Password: "
    )

    async with AsyncSessionLocal() as db:
        result = await db.execute(
            select(User).where(
                or_(
                    User.username
                    == args.user,
                    User.email
                    == args.user.lower(),
                )
            )
        )

        user = result.scalars().first()

        if user is None:
            exit_error(
                "user not found"
            )

        valid = verify_password(
            password,
            user.password_hash,
        )

        print(
            f"Password valid: {valid}"
        )
        print(
            f"Role: {user.role.value}"
        )
        print(
            f"Active: {user.is_active}"
        )

        if not valid:
            raise SystemExit(1)


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description=(
            "Cricket Stream Platform "
            "management utility"
        )
    )

    subparsers = parser.add_subparsers(
        dest="command",
        required=True,
    )

    subparsers.add_parser(
        "create-node",
        help=(
            "Create the default Germany node"
        ),
    )

    create_user_parser = (
        subparsers.add_parser(
            "create-user",
            help="Create a user",
        )
    )

    create_user_parser.add_argument(
        "--username",
        help=(
            "Username. Requested interactively "
            "when omitted."
        ),
    )

    create_user_parser.add_argument(
        "--email",
        help=(
            "Optional email address"
        ),
    )

    create_user_parser.add_argument(
        "--role",
        choices=[
            role.value
            for role in UserRole
        ],
        default=UserRole.VIEWER.value,
    )

    create_user_parser.add_argument(
        "--inactive",
        action="store_true",
        help=(
            "Create the account disabled"
        ),
    )

    create_user_parser.add_argument(
        "--superuser",
        action="store_true",
        help=(
            "Grant superuser flag. "
            "Valid only for admin."
        ),
    )

    subparsers.add_parser(
        "list-users",
        help="List users",
    )

    role_parser = (
        subparsers.add_parser(
            "set-user-role",
            help="Change a user role",
        )
    )

    role_parser.add_argument(
        "user",
        help="Username or email",
    )

    role_parser.add_argument(
        "role",
        choices=[
            role.value
            for role in UserRole
        ],
    )

    role_parser.add_argument(
        "--superuser",
        action="store_true",
        help=(
            "Set superuser flag for admin"
        ),
    )

    activate_parser = (
        subparsers.add_parser(
            "activate-user",
            help="Activate a user",
        )
    )

    activate_parser.add_argument(
        "user",
        help="Username or email",
    )

    deactivate_parser = (
        subparsers.add_parser(
            "deactivate-user",
            help="Deactivate a user",
        )
    )

    deactivate_parser.add_argument(
        "user",
        help="Username or email",
    )

    reset_parser = (
        subparsers.add_parser(
            "reset-password",
            help="Reset a user password",
        )
    )

    reset_parser.add_argument(
        "user",
        help="Username or email",
    )

    verify_parser = (
        subparsers.add_parser(
            "verify-password",
            help=(
                "Verify a user password"
            ),
        )
    )

    verify_parser.add_argument(
        "user",
        help="Username or email",
    )

    return parser


async def main() -> None:
    parser = build_parser()
    args = parser.parse_args()

    if args.command == "create-node":
        await create_node()

    elif args.command == "create-user":
        await create_user(
            args
        )

    elif args.command == "list-users":
        await list_users()

    elif args.command == "set-user-role":
        await set_user_role(
            args
        )

    elif args.command == "activate-user":
        await set_user_active(
            args.user,
            True,
        )

    elif args.command == "deactivate-user":
        await set_user_active(
            args.user,
            False,
        )

    elif args.command == "reset-password":
        await reset_password(
            args
        )

    elif args.command == "verify-password":
        await verify_user_password(
            args
        )

    else:
        parser.error(
            "unknown command"
        )


if __name__ == "__main__":
    asyncio.run(
        main()
    )
