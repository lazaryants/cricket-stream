from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class NodeResponse(BaseModel):
    uuid: UUID
    name: str
    hostname: str
    ip_address: str
    location: str
    enabled: bool
    created_at: datetime

    model_config = {
        "from_attributes": True
    }
