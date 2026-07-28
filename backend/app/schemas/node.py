from datetime import datetime
from uuid import UUID

from pydantic import (
    BaseModel,
    ConfigDict,
)


class NodeResponse(BaseModel):
    model_config = ConfigDict(
        from_attributes=True,
    )

    uuid: UUID
    name: str
    hostname: str
    ip_address: str
    location: str
    enabled: bool
    created_at: datetime
