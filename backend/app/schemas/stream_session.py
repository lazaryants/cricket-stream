from datetime import datetime
from uuid import UUID

from pydantic import BaseModel

from app.models.enums import StreamStatus

class StreamSessionResponse(BaseModel):
    uuid: UUID

    stream_id: int

    status: StreamStatus

    started_at: datetime | None
    stopped_at: datetime | None

    error_message: str | None

    created_at: datetime
    updated_at: datetime

    model_config = {
        "from_attributes": True
    }

class StreamSessionCreate(BaseModel):
    stream_id: int
