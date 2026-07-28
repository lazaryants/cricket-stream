from uuid import UUID

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Query,
    status,
)
from sqlalchemy.ext.asyncio import (
    AsyncSession,
)

from app.core.auth_dependencies import (
    require_operator,
    require_viewer,
)
from app.core.dependencies import get_db
from app.engine.logs import log_buffer
from app.engine.manager import stream_manager
from app.models.user import User
from app.schemas.stream_session import (
    StreamSessionResponse,
)
from app.services.stream_session_service import (
    StreamSessionService,
)


router = APIRouter(
    prefix="/sessions",
    tags=["stream sessions"],
)


@router.get(
    "",
    response_model=list[
        StreamSessionResponse
    ],
)
async def list_sessions(
    db: AsyncSession = Depends(
        get_db
    ),
    current_user: User = Depends(
        require_viewer
    ),
):
    service = StreamSessionService(
        db
    )

    return await service.list_sessions()


@router.get(
    "/{uuid}",
    response_model=StreamSessionResponse,
)
async def get_session(
    uuid: UUID,
    db: AsyncSession = Depends(
        get_db
    ),
    current_user: User = Depends(
        require_viewer
    ),
):
    service = StreamSessionService(
        db
    )

    session = await service.get_by_uuid(
        uuid
    )

    if session is None:
        raise HTTPException(
            status_code=(
                status.HTTP_404_NOT_FOUND
            ),
            detail="Session not found",
        )

    return session


@router.get(
    "/{uuid}/status",
)
async def session_status(
    uuid: UUID,
    db: AsyncSession = Depends(
        get_db
    ),
    current_user: User = Depends(
        require_viewer
    ),
):
    service = StreamSessionService(
        db
    )

    session = await service.get_by_uuid(
        uuid
    )

    if session is None:
        raise HTTPException(
            status_code=(
                status.HTTP_404_NOT_FOUND
            ),
            detail="Session not found",
        )

    process_alive = False

    if session.process_id:
        process_alive = (
            stream_manager.pid_alive(
                session.process_id
            )
        )

    return {
        "id": session.id,
        "uuid": str(
            session.uuid
        ),
        "stream_id": (
            session.stream_id
        ),
        "status": (
            session.status.value
        ),
        "process_id": (
            session.process_id
        ),
        "process_alive": process_alive,
        "engine_status": (
            stream_manager.status(
                session.stream_id
            )
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


@router.get(
    "/{uuid}/logs",
)
async def session_logs(
    uuid: UUID,
    limit: int = Query(
        default=100,
        ge=1,
        le=1000,
    ),
    db: AsyncSession = Depends(
        get_db
    ),
    current_user: User = Depends(
        require_operator
    ),
):
    """
    Raw logs are restricted to operator/admin.

    FFmpeg and Streamlink output may contain
    source URLs, resolved media URLs or RTMP
    destination information.
    """

    service = StreamSessionService(
        db
    )

    session = await service.get_by_uuid(
        uuid
    )

    if session is None:
        raise HTTPException(
            status_code=(
                status.HTTP_404_NOT_FOUND
            ),
            detail="Session not found",
        )

    return {
        "uuid": str(
            session.uuid
        ),
        "stream_id": (
            session.stream_id
        ),
        "logs": log_buffer.get(
            session.stream_id,
            limit,
        ),
    }
