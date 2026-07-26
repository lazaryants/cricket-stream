from datetime import datetime
from uuid import UUID

from pydantic import BaseModel

from app.models.enums import ProviderType, StreamStatus


class StreamBase(BaseModel):
    name: str
    description: str | None = None

    provider: ProviderType

    source_url: str
    destination_rtmp_url: str

    node_id: int

    enabled: bool = True
    auto_start: bool = False


class StreamCreate(StreamBase):
    pass


class StreamUpdate(BaseModel):
    name: str | None = None
    description: str | None = None

    source_url: str | None = None
    destination_rtmp_url: str | None = None

    enabled: bool | None = None
    auto_start: bool | None = None


class StreamResponse(StreamBase):
    id: int
    uuid: UUID

    status: StreamStatus

    created_at: datetime
    updated_at: datetime


    model_config = {
        "from_attributes": True
    }
