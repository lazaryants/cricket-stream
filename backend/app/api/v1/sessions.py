from uuid import UUID

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Query,
    Response,
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
from app.models.enums import (
    StreamSessionStatus,
)
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
    response: Response,
    limit: int = Query(
        default=50,
        ge=1,
        le=200,
        description=(
            "Maximum number of sessions "
            "returned"
        ),
    ),
    offset: int = Query(
        default=0,
        ge=0,
        description=(
            "Number of sessions to skip"
        ),
    ),
    stream_id: int | None = Query(
        default=None,
        ge=1,
        description=(
            "Filter by stream ID"
        ),
    ),
    session_status: (
        StreamSessionStatus | None
    ) = Query(
        default=None,
        alias="status",
        description=(
            "Filter by session status"
        ),
    ),
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

    sessions, total = (
        await service.list_sessions(
            limit=limit,
            offset=offset,
            stream_id=stream_id,
            session_status=(
                session_status
            ),
        )
    )

    # React сможет использовать эти
    # заголовки для пагинации, при этом
    # тело ответа остаётся обычным массивом.
    response.headers[
        "X-Total-Count"
    ] = str(total)

    response.headers[
        "X-Limit"
    ] = str(limit)

    response.headers[
        "X-Offset"
    ] = str(offset)

    return sessions


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
    Raw FFmpeg and Streamlink logs are
    available only to operator and admin.
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
