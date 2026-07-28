from typing import Any

from fastapi import (
    APIRouter,
    Body,
    Depends,
    HTTPException,
    Query,
    Response,
    status,
)
from pydantic import ValidationError
from sqlalchemy.ext.asyncio import (
    AsyncSession,
)

from app.core.auth_dependencies import (
    require_admin,
    require_operator,
    require_viewer,
)
from app.core.dependencies import get_db
from app.engine.manager import stream_manager
from app.models.enums import (
    StreamSessionStatus,
    UserRole,
)
from app.models.user import User
from app.schemas.stream import (
    StreamAdminUpdate,
    StreamCreate,
    StreamOperatorUpdate,
)
from app.services.stream_preview_service import (
    StreamPreviewError,
    stream_preview_service,
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


def validation_http_exception(
    exc: ValidationError,
) -> HTTPException:
    return HTTPException(
        status_code=(
            status.HTTP_422_UNPROCESSABLE_ENTITY
        ),
        detail=exc.errors(),
    )


@router.get("")
async def list_streams(
    db: AsyncSession = Depends(
        get_db
    ),
    current_user: User = Depends(
        require_viewer
    ),
):
    streams = await StreamService.get_all(
        db
    )

    return (
        StreamService
        .serialize_many_for_user(
            streams,
            current_user,
        )
    )


@router.post(
    "",
    status_code=(
        status.HTTP_201_CREATED
    ),
)
async def create_stream(
    data: StreamCreate,
    db: AsyncSession = Depends(
        get_db
    ),
    current_user: User = Depends(
        require_admin
    ),
):
    stream = await StreamService.create(
        db,
        data,
    )

    return (
        StreamService.serialize_for_user(
            stream,
            current_user,
        )
    )


@router.get(
    "/{stream_id}",
)
async def get_stream(
    stream_id: int,
    db: AsyncSession = Depends(
        get_db
    ),
    current_user: User = Depends(
        require_viewer
    ),
):
    stream = await StreamService.get_by_id(
        db,
        stream_id,
    )

    if stream is None:
        raise HTTPException(
            status_code=(
                status.HTTP_404_NOT_FOUND
            ),
            detail="Stream not found",
        )

    return (
        StreamService.serialize_for_user(
            stream,
            current_user,
        )
    )


@router.patch(
    "/{stream_id}",
)
async def update_stream(
    stream_id: int,
    payload: dict[str, Any] = Body(
        ...
    ),
    db: AsyncSession = Depends(
        get_db
    ),
    current_user: User = Depends(
        require_operator
    ),
):
    stream = await StreamService.get_by_id(
        db,
        stream_id,
    )

    if stream is None:
        raise HTTPException(
            status_code=(
                status.HTTP_404_NOT_FOUND
            ),
            detail="Stream not found",
        )

    try:
        if (
            current_user.is_superuser
            or current_user.role
            == UserRole.ADMIN
        ):
            update_data = (
                StreamAdminUpdate
                .model_validate(
                    payload
                )
            )
        else:
            update_data = (
                StreamOperatorUpdate
                .model_validate(
                    payload
                )
            )

    except ValidationError as exc:
        raise validation_http_exception(
            exc
        ) from exc

    values = update_data.model_dump(
        exclude_unset=True
    )

    if not values:
        raise HTTPException(
            status_code=(
                status.HTTP_422_UNPROCESSABLE_ENTITY
            ),
            detail=(
                "No update fields supplied"
            ),
        )

    # Frontend может прислать всю форму,
    # включая поля, значения которых фактически
    # не изменились. Такие поля не должны
    # заставлять останавливать живой поток.
    changed_values = {}

    for field_name, new_value in values.items():
        current_value = getattr(
            stream,
            field_name,
        )

        # Enum сравниваем по его значению.
        current_comparable = getattr(
            current_value,
            "value",
            current_value,
        )

        new_comparable = getattr(
            new_value,
            "value",
            new_value,
        )

        if current_comparable != new_comparable:
            changed_values[
                field_name
            ] = new_value

    # Ничего реально не изменилось:
    # возвращаем текущую карточку без UPDATE.
    if not changed_values:
        return (
            StreamService.serialize_for_user(
                stream,
                current_user,
            )
        )

    # Эти поля меняют только метаданные
    # карточки и не затрагивают работающий
    # Streamlink/FFmpeg pipeline.
    live_update_fields = {
        "name",
        "description",
        "show_on_dashboard",
    }

    technical_fields = (
        set(changed_values)
        - live_update_fields
    )

    # Источник, назначение и параметры запуска
    # можно менять только после остановки
    # реально живого процесса.
    if technical_fields:
        runtime_service = (
            StreamSessionService(
                db
            )
        )

        running_session = (
            await runtime_service
            .get_running_session(
                stream_id
            )
        )

        process_alive = False

        if running_session is not None:
            process_alive = (
                stream_manager.pid_alive(
                    running_session.process_id
                )
            )

        if process_alive:
            raise HTTPException(
                status_code=(
                    status.HTTP_409_CONFLICT
                ),
                detail=(
                    "Stop the stream before "
                    "changing its technical "
                    "configuration"
                ),
            )

    stream = await StreamService.update(
        db,
        stream,
        changed_values,
    )

    return (
        StreamService.serialize_for_user(
            stream,
            current_user,
        )
    )


@router.delete(
    "/{stream_id}",
    status_code=(
        status.HTTP_204_NO_CONTENT
    ),
)
async def delete_stream(
    stream_id: int,
    db: AsyncSession = Depends(
        get_db
    ),
    current_user: User = Depends(
        require_admin
    ),
):
    stream = await StreamService.get_by_id(
        db,
        stream_id,
    )

    if stream is None:
        raise HTTPException(
            status_code=(
                status.HTTP_404_NOT_FOUND
            ),
            detail="Stream not found",
        )

    session_service = (
        StreamSessionService(
            db
        )
    )

    running_session = (
        await session_service
        .get_running_session(
            stream_id
        )
    )

    if running_session is not None:
        process_alive = (
            stream_manager.pid_alive(
                running_session.process_id
            )
        )

        if process_alive:
            raise HTTPException(
                status_code=(
                    status.HTTP_409_CONFLICT
                ),
                detail=(
                    "Stop the stream before "
                    "deleting it"
                ),
            )

    await StreamService.delete(
        db,
        stream,
    )

    return Response(
        status_code=(
            status.HTTP_204_NO_CONTENT
        )
    )


@router.get(
    "/{stream_id}/preview",
)
async def get_stream_preview(
    stream_id: int,
    width: int = Query(
        default=960,
        ge=320,
        le=1920,
    ),
    db: AsyncSession = Depends(
        get_db
    ),
    current_user: User = Depends(
        require_viewer
    ),
):
    stream = await StreamService.get_by_id(
        db,
        stream_id,
    )

    if stream is None:
        raise HTTPException(
            status_code=(
                status.HTTP_404_NOT_FOUND
            ),
            detail="Stream not found",
        )

    try:
        image = (
            await stream_preview_service
            .generate(
                stream=stream,
                width=width,
            )
        )
    except StreamPreviewError as exc:
        raise HTTPException(
            status_code=(
                status.HTTP_502_BAD_GATEWAY
            ),
            detail=str(exc),
        ) from exc

    return Response(
        content=image,
        media_type="image/jpeg",
        headers={
            "Cache-Control": (
                "no-store, no-cache, "
                "must-revalidate"
            ),
            "Pragma": "no-cache",
        },
    )


@router.get(
    "/{stream_id}/status",
)
async def get_stream_status(
    stream_id: int,
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

    runtime = (
        await service.get_runtime_status(
            stream_id
        )
    )

    if runtime is None:
        raise HTTPException(
            status_code=(
                status.HTTP_404_NOT_FOUND
            ),
            detail="Stream not found",
        )

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


@router.post(
    "/{stream_id}/start",
)
async def start_stream(
    stream_id: int,
    db: AsyncSession = Depends(
        get_db
    ),
    current_user: User = Depends(
        require_operator
    ),
):
    service = StreamSessionService(
        db
    )

    stream = await service.get_stream(
        stream_id
    )

    if stream is None:
        raise HTTPException(
            status_code=(
                status.HTTP_404_NOT_FOUND
            ),
            detail="Stream not found",
        )

    if not stream.enabled:
        raise HTTPException(
            status_code=(
                status.HTTP_409_CONFLICT
            ),
            detail="Stream is disabled",
        )

    running = (
        await service.get_running_session(
            stream_id
        )
    )

    if running:
        process_alive = (
            stream_manager.pid_alive(
                running.process_id
            )
        )

        if process_alive:
            raise HTTPException(
                status_code=(
                    status.HTTP_409_CONFLICT
                ),
                detail=(
                    "Stream already running"
                ),
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

    session = (
        await service.start_stream_session(
            session,
            stream,
        )
    )

    if (
        session.status
        == StreamSessionStatus.error
    ):
        raise HTTPException(
            status_code=(
                status.HTTP_500_INTERNAL_SERVER_ERROR
            ),
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
    db: AsyncSession = Depends(
        get_db
    ),
    current_user: User = Depends(
        require_operator
    ),
):
    service = StreamSessionService(
        db
    )

    stream = await service.get_stream(
        stream_id
    )

    if stream is None:
        raise HTTPException(
            status_code=(
                status.HTTP_404_NOT_FOUND
            ),
            detail="Stream not found",
        )

    session = (
        await service.get_running_session(
            stream_id
        )
    )

    if session is None:
        raise HTTPException(
            status_code=(
                status.HTTP_404_NOT_FOUND
            ),
            detail=(
                "Running session not found"
            ),
        )

    session = (
        await service.stop_stream_session(
            session
        )
    )

    if (
        session.status
        == StreamSessionStatus.error
    ):
        raise HTTPException(
            status_code=(
                status.HTTP_500_INTERNAL_SERVER_ERROR
            ),
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
