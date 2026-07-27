from datetime import datetime, timezone
from uuid import uuid4

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.engine.manager import stream_manager
from app.models.enums import (
    StreamSessionStatus,
    StreamStatus,
)
from app.models.stream import Stream
from app.models.stream_session import StreamSession


class StreamSessionService:

    def __init__(
        self,
        db: AsyncSession,
    ):
        self.db = db

    async def list_sessions(self):
        result = await self.db.execute(
            select(StreamSession).order_by(
                StreamSession.created_at.desc()
            )
        )
        return result.scalars().all()

    async def get_by_uuid(
        self,
        uuid,
    ):
        result = await self.db.execute(
            select(StreamSession).where(
                StreamSession.uuid == uuid
            )
        )
        return result.scalar_one_or_none()

    async def get_stream(
        self,
        stream_id: int,
    ):
        result = await self.db.execute(
            select(Stream).where(
                Stream.id == stream_id
            )
        )
        return result.scalar_one_or_none()

    async def get_running_session(
        self,
        stream_id: int,
    ):
        result = await self.db.execute(
            select(StreamSession)
            .where(
                StreamSession.stream_id == stream_id,
                StreamSession.status.in_(
                    (
                        StreamSessionStatus.running,
                        StreamSessionStatus.starting,
                    )
                ),
            )
            .order_by(
                StreamSession.created_at.desc()
            )
            .limit(1)
        )

        return result.scalars().first()

    async def create_session(
        self,
        stream_id: int,
    ):
        stream = await self.get_stream(
            stream_id
        )

        if stream is None:
            raise ValueError(
                "Stream not found"
            )

        session = StreamSession(
            stream_id=stream.id,
            uuid=uuid4(),
            status=StreamSessionStatus.draft,
        )

        self.db.add(session)

        await self.db.commit()

        await self.db.refresh(
            session
        )

        return session

    async def start_stream_session(
        self,
        session: StreamSession,
        stream: Stream,
    ):
        session.status = (
            StreamSessionStatus.starting
        )

        stream.status = (
            StreamStatus.STARTING
        )

        await self.db.commit()

        try:

            pid = await stream_manager.start(
                stream
            )

            session.process_id = str(pid)

            session.status = (
                StreamSessionStatus.running
            )

            stream.status = (
                StreamStatus.RUNNING
            )

            session.started_at = datetime.now(
                timezone.utc
            )

        except Exception as e:

            session.status = (
                StreamSessionStatus.error
            )

            stream.status = (
                StreamStatus.ERROR
            )

            session.error_message = str(e)

        await self.db.commit()

        await self.db.refresh(
            session,
        )

        return session

    async def stop_stream_session(
        self,
        session: StreamSession,
    ):
        stream = await self.get_stream(
            session.stream_id
        )

        if stream:

            await stream_manager.stop(
                stream.id,
                session.process_id
            )

            stream.status = (
                StreamStatus.STOPPED
            )

        session.status = (
            StreamSessionStatus.stopped
        )

        session.stopped_at = datetime.now(
            timezone.utc
        )

        session.process_id = None

        await self.db.commit()

        await self.db.refresh(
            session
        )

        return session
