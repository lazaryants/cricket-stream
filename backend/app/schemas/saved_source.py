from datetime import datetime
from uuid import UUID

from pydantic import (
    BaseModel,
    ConfigDict,
    Field,
    field_validator,
)

from app.models.enums import ProviderType


class SavedSourceBase(BaseModel):
    model_config = ConfigDict(
        extra="forbid",
    )

    name: str = Field(
        min_length=1,
        max_length=200,
    )

    description: str | None = None

    provider: ProviderType = (
        ProviderType.UNKNOWN
    )

    source_url: str = Field(
        min_length=1,
        max_length=4096,
    )

    enabled: bool = True

    @field_validator(
        "name",
        "source_url",
    )
    @classmethod
    def strip_required(
        cls,
        value: str,
    ) -> str:
        cleaned = value.strip()

        if not cleaned:
            raise ValueError(
                "Value must not be empty"
            )

        return cleaned

    @field_validator("description")
    @classmethod
    def strip_description(
        cls,
        value: str | None,
    ) -> str | None:
        if value is None:
            return None

        cleaned = value.strip()

        return cleaned or None


class SavedSourceCreate(
    SavedSourceBase
):
    pass


class SavedSourceUpdate(BaseModel):
    model_config = ConfigDict(
        extra="forbid",
    )

    name: str | None = Field(
        default=None,
        min_length=1,
        max_length=200,
    )

    description: str | None = None

    provider: ProviderType | None = None

    source_url: str | None = Field(
        default=None,
        min_length=1,
        max_length=4096,
    )

    enabled: bool | None = None

    @field_validator(
        "name",
        "source_url",
    )
    @classmethod
    def strip_optional_required(
        cls,
        value: str | None,
    ) -> str | None:
        if value is None:
            return None

        cleaned = value.strip()

        if not cleaned:
            raise ValueError(
                "Value must not be empty"
            )

        return cleaned

    @field_validator("description")
    @classmethod
    def strip_optional_description(
        cls,
        value: str | None,
    ) -> str | None:
        if value is None:
            return None

        cleaned = value.strip()

        return cleaned or None


class SavedSourceResponse(BaseModel):
    model_config = ConfigDict(
        from_attributes=True,
    )

    id: int
    uuid: UUID
    name: str
    description: str | None
    provider: ProviderType
    source_url: str
    enabled: bool
    created_at: datetime
    updated_at: datetime
