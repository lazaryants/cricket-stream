from datetime import datetime
from uuid import UUID
from app.models.base import BaseModel
from app.models.enums import StreamStatus

from sqlalchemy import (
    String,
    ForeignKey,
    DateTime,
    func
)

from sqlalchemy.orm import (
    Mapped,
    mapped_column,
    relationship
)


class StreamSession(BaseModel):

    __tablename__ = "stream_sessions"


    stream_id: Mapped[int] = mapped_column(
        ForeignKey("streams.id"),
        nullable=False
    )


    status: Mapped[StreamStatus] = mapped_column(
        default=StreamStatus.DRAFT,
        nullable=False
    )


    process_id: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True
    )


    started_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True)
    )


    stopped_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True)
    )


    error_message: Mapped[str | None] = mapped_column(
        nullable=True
    )


    stream = relationship(
        "Stream",
        back_populates="sessions"
    )
