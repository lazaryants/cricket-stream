from datetime import datetime
from uuid import UUID

from pydantic import (
    BaseModel,
    ConfigDict,
)

from app.models.enums import (
    StreamSessionStatus,
)


class StreamSessionResponse(BaseModel):
    model_config = ConfigDict(
        from_attributes=True,
    )

    id: int
    uuid: UUID
    stream_id: int

    status: StreamSessionStatus
    process_id: str | None

    started_at: datetime | None
    stopped_at: datetime | None
    error_message: str | None

    created_at: datetime
    updated_at: datetime
