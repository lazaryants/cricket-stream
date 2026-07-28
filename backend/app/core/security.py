from pwdlib import PasswordHash


password_hash = PasswordHash.recommended()


def hash_password(
    password: str,
) -> str:
    normalized = password.strip()

    if len(normalized) < 10:
        raise ValueError(
            "Password must contain at least 10 characters"
        )

    if len(normalized) > 1024:
        raise ValueError(
            "Password is too long"
        )

    return password_hash.hash(
        normalized
    )


def verify_password(
    plain_password: str,
    stored_hash: str,
) -> bool:
    if not plain_password:
        return False

    if not stored_hash:
        return False

    try:
        return password_hash.verify(
            plain_password,
            stored_hash,
        )
    except Exception:
        return False


def verify_and_update_password(
    plain_password: str,
    stored_hash: str,
) -> tuple[bool, str | None]:
    if not plain_password:
        return False, None

    if not stored_hash:
        return False, None

    try:
        valid, updated_hash = (
            password_hash.verify_and_update(
                plain_password,
                stored_hash,
            )
        )

        return valid, updated_hash

    except Exception:
        return False, None
