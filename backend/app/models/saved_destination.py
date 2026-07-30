from sqlalchemy import (
    Boolean,
    String,
    Text,
)
from sqlalchemy.orm import (
    Mapped,
    mapped_column,
)

from app.models.base import BaseModel


class SavedDestination(BaseModel):
    __tablename__ = "saved_destinations"

    name: Mapped[str] = mapped_column(
        String(200),
        nullable=False,
        index=True,
    )

    description: Mapped[str | None] = (
        mapped_column(
            Text,
            nullable=True,
        )
    )

    destination_rtmp_url: Mapped[str] = (
        mapped_column(
            Text,
            nullable=False,
            unique=True,
        )
    )

    enabled: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False,
        index=True,
    )
