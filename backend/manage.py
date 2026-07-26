import asyncio
import sys

from sqlalchemy import select

from app.core.database import SessionLocal
from app.models.node import Node


async def create_node():

    async with SessionLocal() as session:

        result = await session.execute(
            select(Node).where(
                Node.hostname == "de.cricket-stream.icu"
            )
        )

        existing = result.scalar_one_or_none()

        if existing:
            print("Node already exists:")
            print(existing.name)
            print(existing.uuid)
            return

        node = Node(
            name="Germany #1",
            hostname="de.cricket-stream.icu",
            ip_address="144.31.188.28",
            location="Germany",
            enabled=True,
        )

        session.add(node)

        await session.commit()

        await session.refresh(node)

        print("Created node:")
        print("ID:", node.id)
        print("UUID:", node.uuid)


async def main():

    if len(sys.argv) < 2:
        print(
            "Usage: python manage.py <command>"
        )
        return

    command = sys.argv[1]

    if command == "create-node":
        await create_node()

    else:
        print(
            f"Unknown command: {command}"
        )


if __name__ == "__main__":
    asyncio.run(main())
