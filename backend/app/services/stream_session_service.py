from datetime import datetime, timezone
from uuid import uuid4

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.engine.manager import stream_manager
from app.engine.metrics import metrics_store
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
            select(StreamSession)
            .order_by(
                StreamSession.created_at.desc()
            )
        )
        return result.scalars().all()

    async def get_by_uuid(
        self,
        uuid,
    ):
        result = await self.db.execute(
            select(StreamSession)
            .where(
                StreamSession.uuid == uuid
            )
        )
        return result.scalar_one_or_none()

    async def get_stream(
        self,
        stream_id: int,
    ):
        result = await self.db.execute(
            select(Stream)
            .where(
                Stream.id == stream_id
            )
        )
        return result.scalar_one_or_none()

    async def get_latest_session(
        self,
        stream_id: int,
    ):
        result = await self.db.execute(
            select(StreamSession)
            .where(
                StreamSession.stream_id == stream_id
            )
            .order_by(
                StreamSession.created_at.desc()
            )
            .limit(1)
        )
        return result.scalars().first()

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
                        StreamSessionStatus.starting,
                        StreamSessionStatus.running,
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
        session.error_message = None
        session.stopped_at = None

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
            session.started_at = datetime.now(
                timezone.utc
            )

            stream.status = (
                StreamStatus.RUNNING
            )

        except Exception as exc:
            session.status = (
                StreamSessionStatus.error
            )
            session.process_id = None
            session.error_message = str(exc)

            stream.status = (
                StreamStatus.ERROR
            )

        await self.db.commit()
        await self.db.refresh(
            session
        )

        return session

    async def stop_stream_session(
        self,
        session: StreamSession,
    ):
        stream = await self.get_stream(
            session.stream_id
        )

        session.status = (
            StreamSessionStatus.stopping
        )

        if stream:
            stream.status = (
                StreamStatus.STOPPING
            )

        await self.db.commit()

        try:
            await stream_manager.stop(
                session.stream_id,
                session.process_id,
            )

            session.status = (
                StreamSessionStatus.stopped
            )
            session.stopped_at = datetime.now(
                timezone.utc
            )
            session.process_id = None
            session.error_message = None

            if stream:
                stream.status = (
                    StreamStatus.STOPPED
                )

        except Exception as exc:
            session.status = (
                StreamSessionStatus.error
            )
            session.error_message = str(exc)

            if stream:
                stream.status = (
                    StreamStatus.ERROR
                )

        await self.db.commit()
        await self.db.refresh(
            session
        )

        return session

    async def get_runtime_status(
        self,
        stream_id: int,
    ):
        stream = await self.get_stream(
            stream_id
        )

        if stream is None:
            return None

        session = await self.get_latest_session(
            stream_id
        )

        managed_process = (
            stream_manager.get_process(
                stream_id
            )
        )

        manager_status = (
            stream_manager.status(
                stream_id
            )
        )

        process_id = None
        process_alive = False

        if managed_process is not None:
            if managed_process.process is not None:
                process_id = (
                    managed_process.process.pid
                )

            process_alive = (
                managed_process.running()
            )

        elif session and session.process_id:
            process_id = session.process_id
            process_alive = (
                stream_manager.pid_alive(
                    session.process_id
                )
            )

        return {
            "stream": stream,
            "session": session,
            "manager_status": manager_status,
            "process_id": process_id,
            "process_alive": process_alive,
            "metrics": metrics_store.get(
                stream_id
            ),
        }
