from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Query,
    Response,
    status,
)
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import (
    AsyncSession,
)

from app.core.auth_dependencies import (
    require_operator,
)
from app.core.dependencies import get_db
from app.models.user import User
from app.schemas.saved_source import (
    SavedSourceCreate,
    SavedSourceResponse,
    SavedSourceUpdate,
)
from app.services.saved_source_service import (
    SavedSourceService,
)


router = APIRouter(
    prefix="/saved-sources",
    tags=["saved sources"],
)


@router.get(
    "",
    response_model=list[
        SavedSourceResponse
    ],
)
async def list_saved_sources(
    include_disabled: bool = Query(
        default=False
    ),
    search: str | None = Query(
        default=None,
        max_length=200,
    ),
    db: AsyncSession = Depends(
        get_db
    ),
    current_user: User = Depends(
        require_operator
    ),
):
    del current_user

    return await (
        SavedSourceService
        .list_sources(
            db,
            include_disabled=(
                include_disabled
            ),
            search=search,
        )
    )


@router.post(
    "",
    response_model=SavedSourceResponse,
    status_code=(
        status.HTTP_201_CREATED
    ),
)
async def create_saved_source(
    data: SavedSourceCreate,
    db: AsyncSession = Depends(
        get_db
    ),
    current_user: User = Depends(
        require_operator
    ),
):
    del current_user

    existing = await (
        SavedSourceService.get_by_url(
            db,
            data.source_url,
        )
    )

    if existing is not None:
        raise HTTPException(
            status_code=(
                status.HTTP_409_CONFLICT
            ),
            detail=(
                "A saved source with this "
                "URL already exists"
            ),
        )

    try:
        return await (
            SavedSourceService.create(
                db,
                data,
            )
        )
    except IntegrityError as exc:
        await db.rollback()

        raise HTTPException(
            status_code=(
                status.HTTP_409_CONFLICT
            ),
            detail=(
                "A saved source with this "
                "URL already exists"
            ),
        ) from exc


@router.get(
    "/{source_id}",
    response_model=SavedSourceResponse,
)
async def get_saved_source(
    source_id: int,
    db: AsyncSession = Depends(
        get_db
    ),
    current_user: User = Depends(
        require_operator
    ),
):
    del current_user

    source = await (
        SavedSourceService.get_by_id(
            db,
            source_id,
        )
    )

    if source is None:
        raise HTTPException(
            status_code=(
                status.HTTP_404_NOT_FOUND
            ),
            detail="Saved source not found",
        )

    return source


@router.patch(
    "/{source_id}",
    response_model=SavedSourceResponse,
)
async def update_saved_source(
    source_id: int,
    data: SavedSourceUpdate,
    db: AsyncSession = Depends(
        get_db
    ),
    current_user: User = Depends(
        require_operator
    ),
):
    del current_user

    source = await (
        SavedSourceService.get_by_id(
            db,
            source_id,
        )
    )

    if source is None:
        raise HTTPException(
            status_code=(
                status.HTTP_404_NOT_FOUND
            ),
            detail="Saved source not found",
        )

    values = data.model_dump(
        exclude_unset=True
    )

    if not values:
        raise HTTPException(
            status_code=(
                status.HTTP_422_UNPROCESSABLE_ENTITY
            ),
            detail="No update fields supplied",
        )

    if "source_url" in values:
        existing = await (
            SavedSourceService.get_by_url(
                db,
                values["source_url"],
            )
        )

        if (
            existing is not None
            and existing.id != source.id
        ):
            raise HTTPException(
                status_code=(
                    status.HTTP_409_CONFLICT
                ),
                detail=(
                    "A saved source with this "
                    "URL already exists"
                ),
            )

    try:
        return await (
            SavedSourceService.update(
                db,
                source,
                values,
            )
        )
    except IntegrityError as exc:
        await db.rollback()

        raise HTTPException(
            status_code=(
                status.HTTP_409_CONFLICT
            ),
            detail=(
                "A saved source with this "
                "URL already exists"
            ),
        ) from exc


@router.delete(
    "/{source_id}",
    status_code=(
        status.HTTP_204_NO_CONTENT
    ),
)
async def delete_saved_source(
    source_id: int,
    db: AsyncSession = Depends(
        get_db
    ),
    current_user: User = Depends(
        require_operator
    ),
):
    del current_user

    source = await (
        SavedSourceService.get_by_id(
            db,
            source_id,
        )
    )

    if source is None:
        raise HTTPException(
            status_code=(
                status.HTTP_404_NOT_FOUND
            ),
            detail="Saved source not found",
        )

    await SavedSourceService.delete(
        db,
        source,
    )

    return Response(
        status_code=(
            status.HTTP_204_NO_CONTENT
        )
    )
