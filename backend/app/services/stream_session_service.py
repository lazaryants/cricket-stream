from datetime import datetime, timezone
from uuid import uuid4

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.stream_session import StreamSession
from app.models.stream import Stream


class StreamSessionService:

    def __init__(self, db: AsyncSession):
        self.db = db


    async def list_sessions(self):

        result = await self.db.execute(
            select(StreamSession)
            .order_by(StreamSession.created_at.desc())
        )

        return result.scalars().all()


    async def get_by_uuid(self, uuid):

        result = await self.db.execute(
            select(StreamSession)
            .where(StreamSession.uuid == uuid)
        )

        return result.scalar_one_or_none()


    async def create_session(
        self,
        stream_id: int
    ):

        result = await self.db.execute(
            select(Stream)
            .where(Stream.id == stream_id)
        )

        stream = result.scalar_one_or_none()

        if not stream:
            raise ValueError("Stream not found")


        session = StreamSession(
            stream_id=stream.id,
            uuid=uuid4(),
            status=stream.status,
            started_at=datetime.now(timezone.utc),
        )

        self.db.add(session)

        await self.db.commit()
        await self.db.refresh(session)

        return session
