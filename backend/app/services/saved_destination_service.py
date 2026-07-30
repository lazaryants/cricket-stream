from sqlalchemy import (
    func,
    or_,
    select,
)
from sqlalchemy.ext.asyncio import (
    AsyncSession,
)

from app.models.saved_destination import (
    SavedDestination,
)
from app.schemas.saved_destination import (
    SavedDestinationCreate,
)


class SavedDestinationService:
    @staticmethod
    async def list_destinations(
        db: AsyncSession,
        *,
        include_disabled: bool = False,
        search: str | None = None,
    ) -> list[SavedDestination]:
        query = select(
            SavedDestination
        )

        if not include_disabled:
            query = query.where(
                SavedDestination.enabled
                .is_(True)
            )

        if search:
            cleaned_search = (
                search.strip()
            )

            if cleaned_search:
                pattern = (
                    f"%{cleaned_search}%"
                )

                query = query.where(
                    or_(
                        SavedDestination.name
                        .ilike(pattern),
                        SavedDestination
                        .description
                        .ilike(pattern),
                        SavedDestination
                        .destination_rtmp_url
                        .ilike(pattern),
                    )
                )

        # ID сохраняет естественный порядок
        # place1, place2 ... place16.
        query = query.order_by(
            SavedDestination.id.asc()
        )

        result = await db.execute(
            query
        )

        return list(
            result.scalars().all()
        )

    @staticmethod
    async def get_by_id(
        db: AsyncSession,
        destination_id: int,
    ) -> SavedDestination | None:
        result = await db.execute(
            select(SavedDestination)
            .where(
                SavedDestination.id
                == destination_id
            )
        )

        return result.scalar_one_or_none()

    @staticmethod
    async def get_by_url(
        db: AsyncSession,
        destination_rtmp_url: str,
    ) -> SavedDestination | None:
        normalized = (
            destination_rtmp_url.strip()
        )

        result = await db.execute(
            select(SavedDestination)
            .where(
                func.lower(
                    SavedDestination
                    .destination_rtmp_url
                )
                == normalized.lower()
            )
        )

        return result.scalar_one_or_none()

    @staticmethod
    async def create(
        db: AsyncSession,
        data: SavedDestinationCreate,
    ) -> SavedDestination:
        destination = SavedDestination(
            **data.model_dump()
        )

        db.add(destination)

        await db.commit()
        await db.refresh(destination)

        return destination

    @staticmethod
    async def update(
        db: AsyncSession,
        destination: SavedDestination,
        values: dict,
    ) -> SavedDestination:
        for field, value in values.items():
            setattr(
                destination,
                field,
                value,
            )

        await db.commit()
        await db.refresh(destination)

        return destination

    @staticmethod
    async def delete(
        db: AsyncSession,
        destination: SavedDestination,
    ) -> None:
        await db.delete(destination)
        await db.commit()
