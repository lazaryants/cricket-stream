from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
)
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_db
from app.engine.manager import stream_manager
from app.models.enums import (
    StreamSessionStatus,
)
from app.schemas.stream import (
    StreamCreate,
    StreamResponse,
)
from app.services.stream_service import (
    StreamService,
)
from app.services.stream_session_service import (
    StreamSessionService,
)


router = APIRouter(
    prefix="/streams",
    tags=["streams"],
)


@router.get(
    "",
    response_model=list[StreamResponse],
)
async def list_streams(
    db: AsyncSession = Depends(get_db),
):
    return await StreamService.get_all(
        db
    )


@router.post(
    "",
    response_model=StreamResponse,
)
async def create_stream(
    data: StreamCreate,
    db: AsyncSession = Depends(get_db),
):
    return await StreamService.create(
        db,
        data,
    )


@router.get(
    "/{stream_id}",
    response_model=StreamResponse,
)
async def get_stream(
    stream_id: int,
    db: AsyncSession = Depends(get_db),
):
    service = StreamSessionService(
        db
    )

    stream = await service.get_stream(
        stream_id
    )

    if stream is None:
        raise HTTPException(
            status_code=404,
            detail="Stream not found",
        )

    return stream


@router.get(
    "/{stream_id}/status",
)
async def get_stream_status(
    stream_id: int,
    db: AsyncSession = Depends(get_db),
):
    service = StreamSessionService(
        db
    )

    runtime = await service.get_runtime_status(
        stream_id
    )

    if runtime is None:
        raise HTTPException(
            status_code=404,
            detail="Stream not found",
        )

    stream = runtime["stream"]
    session = runtime["session"]

    session_data = None

    if session is not None:
        session_data = {
            "id": session.id,
            "uuid": str(session.uuid),
            "status": session.status.value,
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
        "uuid": str(stream.uuid),
        "name": stream.name,
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
        "auto_start": stream.auto_start,
        "metrics": runtime["metrics"],
        "latest_session": session_data,
    }


@router.post(
    "/{stream_id}/start",
)
async def start_stream(
    stream_id: int,
    db: AsyncSession = Depends(get_db),
):
    service = StreamSessionService(
        db
    )

    stream = await service.get_stream(
        stream_id
    )

    if stream is None:
        raise HTTPException(
            status_code=404,
            detail="Stream not found",
        )

    if not stream.enabled:
        raise HTTPException(
            status_code=409,
            detail="Stream is disabled",
        )

    running = await service.get_running_session(
        stream_id
    )

    if running:
        process_alive = (
            stream_manager.pid_alive(
                running.process_id
            )
        )

        if process_alive:
            raise HTTPException(
                status_code=409,
                detail="Stream already running",
            )

        running.status = (
            StreamSessionStatus.error
        )
        running.error_message = (
            "Running session had no live "
            "FFmpeg process"
        )

        await db.commit()

    session = await service.create_session(
        stream_id
    )

    session = await service.start_stream_session(
        session,
        stream,
    )

    if (
        session.status
        == StreamSessionStatus.error
    ):
        raise HTTPException(
            status_code=500,
            detail={
                "message": (
                    "Failed to start stream"
                ),
                "session_id": str(
                    session.uuid
                ),
                "error": (
                    session.error_message
                ),
            },
        )

    return {
        "status": "started",
        "session_id": str(
            session.uuid
        ),
        "pid": session.process_id,
    }



@router.post(
    "/{stream_id}/stop",
)
async def stop_stream(
    stream_id: int,
    db: AsyncSession = Depends(get_db),
):
    service = StreamSessionService(
        db
    )

    stream = await service.get_stream(
        stream_id
    )

    if stream is None:
        raise HTTPException(
            status_code=404,
            detail="Stream not found",
        )

    session = await service.get_running_session(
        stream_id
    )

    if session is None:
        raise HTTPException(
            status_code=404,
            detail="Running session not found",
        )

    session = await service.stop_stream_session(
        session
    )

    if (
        session.status
        == StreamSessionStatus.error
    ):
        raise HTTPException(
            status_code=500,
            detail={
                "message": (
                    "Failed to stop stream"
                ),
                "session_id": str(
                    session.uuid
                ),
                "error": (
                    session.error_message
                ),
            },
        )

    return {
        "status": "stopped",
        "session_id": str(
            session.uuid
        ),
    }
