from fastapi import APIRouter, Depends, HTTPException
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.dependencies import get_db
from app.schemas.stream_session import StreamSessionResponse
from app.services.stream_session_service import StreamSessionService
from app.schemas.stream_session import StreamSessionCreate
from app.engine.manager import stream_manager
from app.engine.logs import log_buffer


router = APIRouter(
    prefix="/sessions",
    tags=["stream sessions"]
)


@router.get(
    "",
    response_model=list[StreamSessionResponse]
)
async def list_sessions(
    db: AsyncSession = Depends(get_db)
):

    service = StreamSessionService(db)

    return await service.list_sessions()

@router.post(
    "",
    response_model=StreamSessionResponse
)
async def create_session(
    data: StreamSessionCreate,
    db: AsyncSession = Depends(get_db)
):

    service = StreamSessionService(db)

    return await service.create_session(
        data.stream_id
    )

@router.post("/{uuid}/start")
async def start_session(
    uuid: UUID,
    db: AsyncSession = Depends(get_db)
):

    service = StreamSessionService(db)

    session = await service.get_by_uuid(uuid)

    if not session:
        raise HTTPException(
            status_code=404,
            detail="Session not found"
        )

    stream = await service.get_stream(
        session.stream_id
    )

    if not stream:
        raise HTTPException(
            status_code=404,
            detail="Stream not found"
        )

    return await service.start_stream_session(
        session,
        stream
    )



@router.post("/{uuid}/stop")
async def stop_session(
    uuid: UUID,
    db: AsyncSession = Depends(get_db)
):

    service = StreamSessionService(db)

    session = await service.get_by_uuid(uuid)

    if not session:
        raise HTTPException(
            status_code=404,
            detail="Session not found"
        )

    return await service.stop_stream_session(
        session
    )



@router.get("/{uuid}/status")
async def session_status(
    uuid: UUID,
    db: AsyncSession = Depends(get_db)
):

    service = StreamSessionService(db)

    session = await service.get_by_uuid(uuid)

    if not session:
        raise HTTPException(
            status_code=404,
            detail="Session not found"
        )

    return {
        "uuid": session.uuid,
        "status": session.status,
        "process_id": session.process_id,
        "engine_status":
            stream_manager.status(
                session.stream_id
            )
    }



@router.get("/{uuid}/logs")
async def session_logs(
    uuid: UUID,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
):

    service = StreamSessionService(db)

    session = await service.get_by_uuid(uuid)

    if not session:
        raise HTTPException(
            status_code=404,
            detail="Session not found",
        )


    return {
        "uuid": session.uuid,
        "logs": log_buffer.get(
            session.stream_id,
            limit,
        ),
    }
