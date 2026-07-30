from sqlalchemy import (
    Boolean,
    String,
    Text,
)
from sqlalchemy.dialects.postgresql import (
    ENUM,
)
from sqlalchemy.orm import (
    Mapped,
    mapped_column,
)

from app.models.base import BaseModel
from app.models.enums import ProviderType


class SavedSource(BaseModel):
    __tablename__ = "saved_sources"

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

    provider: Mapped[ProviderType] = (
        mapped_column(
            ENUM(
                ProviderType,
                name="providertype",
                create_type=False,
            ),
            default=ProviderType.UNKNOWN,
            nullable=False,
            index=True,
        )
    )

    source_url: Mapped[str] = mapped_column(
        Text,
        nullable=False,
        unique=True,
    )

    enabled: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False,
        index=True,
    )
