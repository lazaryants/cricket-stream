from fastapi import APIRouter, Depends

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_db

from app.services.stream_service import StreamService

from app.schemas.stream import (
    StreamCreate,
    StreamResponse
)


router = APIRouter(
    prefix="/streams",
    tags=["streams"]
)


@router.get(
    "",
    response_model=list[StreamResponse]
)
async def list_streams(
    db: AsyncSession = Depends(get_db)
):

    return await StreamService.get_all(db)



@router.post(
    "",
    response_model=StreamResponse
)
async def create_stream(
    data: StreamCreate,
    db: AsyncSession = Depends(get_db)
):

    return await StreamService.create(
        db,
        data
    )
