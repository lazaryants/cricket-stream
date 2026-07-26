from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.dependencies import get_db
from app.schemas.stream_session import StreamSessionResponse
from app.services.stream_session_service import StreamSessionService
from app.schemas.stream_session import StreamSessionCreate

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
