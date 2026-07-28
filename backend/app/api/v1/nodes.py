from fastapi import (
    APIRouter,
    Depends,
)
from sqlalchemy.ext.asyncio import (
    AsyncSession,
)

from app.core.auth_dependencies import (
    require_viewer,
)
from app.core.dependencies import get_db
from app.models.user import User
from app.schemas.node import NodeResponse
from app.services.node_service import (
    NodeService,
)


router = APIRouter(
    prefix="/nodes",
    tags=["nodes"],
)


@router.get(
    "",
    response_model=list[NodeResponse],
)
async def get_nodes(
    db: AsyncSession = Depends(
        get_db
    ),
    current_user: User = Depends(
        require_viewer
    ),
):
    return await NodeService.get_active_nodes(
        db
    )
