from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.node import Node


class NodeService:

    @staticmethod
    async def get_active_nodes(
        session: AsyncSession,
    ) -> list[Node]:

        result = await session.execute(
            select(Node)
            .where(Node.enabled == True)
            .order_by(Node.name)
        )

        return result.scalars().all()
