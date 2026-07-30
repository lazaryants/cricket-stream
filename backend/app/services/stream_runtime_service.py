from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import (
    AsyncSession,
)

from app.models.stream import Stream
from app.services.stream_session_service import (
    StreamSessionService,
)


def serialize_runtime(
    runtime: dict[str, Any],
) -> dict[str, Any]:
    stream = runtime["stream"]
    session = runtime["session"]

    session_data = None

    if session is not None:
        session_data = {
            "id": session.id,
            "uuid": str(
                session.uuid
            ),
            "status": (
                session.status.value
            ),
            "process_id": (
                session.process_id
            ),
            "started_at": (
                session.started_at
            ),
            "stopped_at": (
                session.stopped_at
            ),
            "error_message": (
                session.error_message
            ),
            "created_at": (
                session.created_at
            ),
            "updated_at": (
                session.updated_at
            ),
        }

    return {
        "stream_id": stream.id,
        "uuid": str(
            stream.uuid
        ),
        "name": stream.name,
        "provider": (
            stream.provider.value
        ),
        "database_status": (
            stream.status.value
        ),
        "manager_status": (
            runtime["manager_status"]
        ),
        "process_alive": (
            runtime["process_alive"]
        ),
        "process_id": (
            runtime["process_id"]
        ),
        "enabled": stream.enabled,
        "auto_start": (
            stream.auto_start
        ),
        "show_on_dashboard": (
            stream.show_on_dashboard
        ),
        "metrics": runtime["metrics"],
        "latest_session": session_data,
    }


async def get_serialized_runtime(
    db: AsyncSession,
    stream_id: int,
) -> dict[str, Any] | None:
    service = StreamSessionService(
        db
    )

    runtime = (
        await service.get_runtime_status(
            stream_id
        )
    )

    if runtime is None:
        return None

    return serialize_runtime(
        runtime
    )


async def list_serialized_runtimes(
    db: AsyncSession,
) -> list[dict[str, Any]]:
    result = await db.execute(
        select(Stream.id).order_by(
            Stream.id
        )
    )

    stream_ids = list(
        result.scalars().all()
    )

    runtimes: list[
        dict[str, Any]
    ] = []

    service = StreamSessionService(
        db
    )

    for stream_id in stream_ids:
        runtime = (
            await service
            .get_runtime_status(
                stream_id
            )
        )

        if runtime is not None:
            runtimes.append(
                serialize_runtime(
                    runtime
                )
            )

    return runtimes
