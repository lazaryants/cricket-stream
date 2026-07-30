from sqlalchemy import (
    func,
    or_,
    select,
)
from sqlalchemy.ext.asyncio import (
    AsyncSession,
)

from app.models.saved_source import (
    SavedSource,
)
from app.schemas.saved_source import (
    SavedSourceCreate,
)


class SavedSourceService:
    @staticmethod
    async def list_sources(
        db: AsyncSession,
        *,
        include_disabled: bool = False,
        search: str | None = None,
    ) -> list[SavedSource]:
        query = select(
            SavedSource
        )

        if not include_disabled:
            query = query.where(
                SavedSource.enabled.is_(True)
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
                        SavedSource.name
                        .ilike(pattern),
                        SavedSource.description
                        .ilike(pattern),
                        SavedSource.source_url
                        .ilike(pattern),
                    )
                )

        query = query.order_by(
            SavedSource.name.asc(),
            SavedSource.id.asc(),
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
        source_id: int,
    ) -> SavedSource | None:
        result = await db.execute(
            select(SavedSource)
            .where(
                SavedSource.id
                == source_id
            )
        )

        return result.scalar_one_or_none()

    @staticmethod
    async def get_by_url(
        db: AsyncSession,
        source_url: str,
    ) -> SavedSource | None:
        normalized = source_url.strip()

        result = await db.execute(
            select(SavedSource)
            .where(
                func.lower(
                    SavedSource.source_url
                )
                == normalized.lower()
            )
        )

        return result.scalar_one_or_none()

    @staticmethod
    async def create(
        db: AsyncSession,
        data: SavedSourceCreate,
    ) -> SavedSource:
        source = SavedSource(
            **data.model_dump()
        )

        db.add(source)
        await db.commit()
        await db.refresh(source)

        return source

    @staticmethod
    async def update(
        db: AsyncSession,
        source: SavedSource,
        values: dict,
    ) -> SavedSource:
        for field, value in values.items():
            setattr(
                source,
                field,
                value,
            )

        await db.commit()
        await db.refresh(source)

        return source

    @staticmethod
    async def delete(
        db: AsyncSession,
        source: SavedSource,
    ) -> None:
        await db.delete(source)
        await db.commit()
