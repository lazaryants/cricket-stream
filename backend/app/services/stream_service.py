from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import (
    AsyncSession,
)

from app.models.enums import UserRole
from app.models.stream import Stream
from app.models.user import User
from app.schemas.stream import (
    StreamAdminResponse,
    StreamCreate,
    StreamOperatorResponse,
    StreamViewerResponse,
)


class StreamService:
    @staticmethod
    async def get_all(
        db: AsyncSession,
    ) -> list[Stream]:
        result = await db.execute(
            select(Stream)
            .order_by(
                Stream.id.asc()
            )
        )

        return list(
            result.scalars().all()
        )

    @staticmethod
    async def get_by_id(
        db: AsyncSession,
        stream_id: int,
    ) -> Stream | None:
        result = await db.execute(
            select(Stream)
            .where(
                Stream.id == stream_id
            )
        )

        return result.scalar_one_or_none()

    @staticmethod
    async def create(
        db: AsyncSession,
        data: StreamCreate,
    ) -> Stream:
        stream = Stream(
            **data.model_dump()
        )

        db.add(
            stream
        )

        await db.commit()
        await db.refresh(
            stream
        )

        return stream

    @staticmethod
    async def update(
        db: AsyncSession,
        stream: Stream,
        values: dict[str, Any],
    ) -> Stream:
        for field, value in values.items():
            setattr(
                stream,
                field,
                value,
            )

        await db.commit()
        await db.refresh(
            stream
        )

        return stream

    @staticmethod
    async def delete(
        db: AsyncSession,
        stream: Stream,
    ) -> None:
        await db.delete(
            stream
        )

        await db.commit()

    @staticmethod
    def serialize_for_user(
        stream: Stream,
        user: User,
    ) -> dict[str, Any]:
        common_data: dict[str, Any] = {
            "id": stream.id,
            "uuid": stream.uuid,
            "name": stream.name,
            "description": (
                stream.description
            ),
            "provider": stream.provider,
            "node_id": stream.node_id,
            "enabled": stream.enabled,
            "auto_start": (
                stream.auto_start
            ),
            "show_on_dashboard": (
                stream.show_on_dashboard
            ),
            "status": stream.status,
            "source_configured": bool(
                stream.source_url
            ),
            "destination_configured": bool(
                stream.destination_rtmp_url
            ),
            "created_at": (
                stream.created_at
            ),
            "updated_at": (
                stream.updated_at
            ),
        }

        if (
            user.is_superuser
            or user.role
            == UserRole.ADMIN
        ):
            return (
                StreamAdminResponse(
                    **common_data,
                    source_url=(
                        stream.source_url
                    ),
                    destination_rtmp_url=(
                        stream.destination_rtmp_url
                    ),
                )
                .model_dump(
                    mode="json"
                )
            )

        if (
            user.role
            == UserRole.OPERATOR
        ):
            return (
                StreamOperatorResponse(
                    **common_data,
                    source_url=(
                        stream.source_url
                    ),
                    destination_rtmp_url=(
                        stream.destination_rtmp_url
                    ),
                )
                .model_dump(
                    mode="json"
                )
            )

        return (
            StreamViewerResponse(
                **common_data
            )
            .model_dump(
                mode="json"
            )
        )

    @staticmethod
    def serialize_many_for_user(
        streams: list[Stream],
        user: User,
    ) -> list[dict[str, Any]]:
        return [
            StreamService.serialize_for_user(
                stream,
                user,
            )
            for stream in streams
        ]
