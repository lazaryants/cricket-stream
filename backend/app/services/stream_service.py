from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.stream import Stream
from app.schemas.stream import StreamCreate


class StreamService:

    @staticmethod
    async def get_all(
        db: AsyncSession
    ):
        result = await db.execute(
            select(Stream)
        )

        return result.scalars().all()


    @staticmethod
    async def create(
        db: AsyncSession,
        data: StreamCreate
    ):

        stream = Stream(
            **data.model_dump()
        )

        db.add(stream)

        await db.commit()
        await db.refresh(stream)

        return stream
