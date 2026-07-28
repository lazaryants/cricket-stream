from sqlalchemy.orm import relationship
from typing import TYPE_CHECKING

from sqlalchemy import (
    Boolean,
    Enum,
    ForeignKey,
    String,
    Text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel
from app.models.enums import ProviderType, StreamStatus


if TYPE_CHECKING:
    from app.models.node import Node


class Stream(BaseModel):
    __tablename__ = "streams"

    name: Mapped[str] = mapped_column(
        String(200),
        nullable=False,
    )

    description: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    provider: Mapped[ProviderType] = mapped_column(
        Enum(ProviderType),
        default=ProviderType.UNKNOWN,
        nullable=False,
    )

    source_url: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    destination_rtmp_url: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    node_id: Mapped[int] = mapped_column(
        ForeignKey("nodes.id"),
        nullable=False,
    )

    enabled: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False,
    )

    auto_start: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
    )

    show_on_dashboard: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False,
    )

    status: Mapped[StreamStatus] = mapped_column(
        Enum(StreamStatus),
        default=StreamStatus.DRAFT,
        nullable=False,
    )

    node: Mapped["Node"] = relationship(
        back_populates="streams"
    )

    sessions = relationship(
        "StreamSession",
        back_populates="stream",
        cascade="all, delete-orphan",
    )
