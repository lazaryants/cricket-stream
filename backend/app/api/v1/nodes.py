from fastapi import APIRouter, Depends

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_db
from app.schemas.node import NodeResponse
from app.services.node_service import NodeService


router = APIRouter(
    prefix="/nodes",
    tags=["Nodes"],
)


@router.get(
    "",
    response_model=list[NodeResponse],
)
async def get_nodes(
    session: AsyncSession = Depends(get_db),
):

    return await NodeService.get_active_nodes(
        session
    )
