from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_db
from app.schemas.stream import (
    StreamCreate,
    StreamResponse,
)
from app.services.stream_service import StreamService
from app.services.stream_session_service import StreamSessionService

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
    return await StreamService.get_all(db)


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


@router.post("/{stream_id}/start")
async def start_stream(
    stream_id: int,
    db: AsyncSession = Depends(get_db),
):
    service = StreamSessionService(db)

    stream = await service.get_stream(stream_id)

    if stream is None:
        raise HTTPException(
            status_code=404,
            detail="Stream not found",
        )

    running = await service.get_running_session(
        stream_id
    )

    if running:
        raise HTTPException(
            status_code=409,
            detail="Stream already running",
        )

    session = await service.create_session(
        stream_id
    )

    session = await service.start_stream_session(
        session,
        stream,
    )

    return {
        "status": "started",
        "session_id": session.uuid,
        "pid": session.process_id,
    }


@router.post("/{stream_id}/stop")
async def stop_stream(
    stream_id: int,
    db: AsyncSession = Depends(get_db),
):
    service = StreamSessionService(db)

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

    return {
        "status": "stopped",
        "session_id": session.uuid,
    }
