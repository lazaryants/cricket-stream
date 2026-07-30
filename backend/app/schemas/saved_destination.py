from datetime import datetime
from uuid import UUID
from urllib.parse import urlsplit

from pydantic import (
    BaseModel,
    ConfigDict,
    Field,
    field_validator,
)


def validate_rtmp_url(
    value: str,
) -> str:
    cleaned = value.strip()

    if not cleaned:
        raise ValueError(
            "Value must not be empty"
        )

    parsed = urlsplit(cleaned)

    if parsed.scheme.lower() not in {
        "rtmp",
        "rtmps",
    }:
        raise ValueError(
            "Destination URL must use "
            "rtmp:// or rtmps://"
        )

    if not parsed.netloc:
        raise ValueError(
            "Destination URL must contain "
            "a hostname"
        )

    return cleaned


class SavedDestinationBase(BaseModel):
    model_config = ConfigDict(
        extra="forbid",
    )

    name: str = Field(
        min_length=1,
        max_length=200,
    )

    description: str | None = None

    destination_rtmp_url: str = Field(
        min_length=1,
        max_length=4096,
    )

    enabled: bool = True

    @field_validator("name")
    @classmethod
    def strip_name(
        cls,
        value: str,
    ) -> str:
        cleaned = value.strip()

        if not cleaned:
            raise ValueError(
                "Value must not be empty"
            )

        return cleaned

    @field_validator(
        "destination_rtmp_url"
    )
    @classmethod
    def validate_destination_url(
        cls,
        value: str,
    ) -> str:
        return validate_rtmp_url(
            value
        )

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


class SavedDestinationCreate(
    SavedDestinationBase
):
    pass


class SavedDestinationUpdate(BaseModel):
    model_config = ConfigDict(
        extra="forbid",
    )

    name: str | None = Field(
        default=None,
        min_length=1,
        max_length=200,
    )

    description: str | None = None

    destination_rtmp_url: (
        str | None
    ) = Field(
        default=None,
        min_length=1,
        max_length=4096,
    )

    enabled: bool | None = None

    @field_validator("name")
    @classmethod
    def strip_optional_name(
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

    @field_validator(
        "destination_rtmp_url"
    )
    @classmethod
    def validate_optional_url(
        cls,
        value: str | None,
    ) -> str | None:
        if value is None:
            return None

        return validate_rtmp_url(
            value
        )

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


class SavedDestinationResponse(
    BaseModel
):
    model_config = ConfigDict(
        from_attributes=True,
    )

    id: int
    uuid: UUID
    name: str
    description: str | None
    destination_rtmp_url: str
    enabled: bool
    created_at: datetime
    updated_at: datetime
