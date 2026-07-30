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
from app.schemas.saved_destination import (
    SavedDestinationCreate,
    SavedDestinationResponse,
    SavedDestinationUpdate,
)
from app.services.saved_destination_service import (
    SavedDestinationService,
)


router = APIRouter(
    prefix="/saved-destinations",
    tags=["saved destinations"],
)


@router.get(
    "",
    response_model=list[
        SavedDestinationResponse
    ],
)
async def list_saved_destinations(
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
        SavedDestinationService
        .list_destinations(
            db,
            include_disabled=(
                include_disabled
            ),
            search=search,
        )
    )


@router.post(
    "",
    response_model=(
        SavedDestinationResponse
    ),
    status_code=(
        status.HTTP_201_CREATED
    ),
)
async def create_saved_destination(
    data: SavedDestinationCreate,
    db: AsyncSession = Depends(
        get_db
    ),
    current_user: User = Depends(
        require_operator
    ),
):
    del current_user

    existing = await (
        SavedDestinationService
        .get_by_url(
            db,
            data.destination_rtmp_url,
        )
    )

    if existing is not None:
        raise HTTPException(
            status_code=(
                status.HTTP_409_CONFLICT
            ),
            detail=(
                "A saved destination with "
                "this URL already exists"
            ),
        )

    try:
        return await (
            SavedDestinationService.create(
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
                "A saved destination with "
                "this URL already exists"
            ),
        ) from exc


@router.get(
    "/{destination_id}",
    response_model=(
        SavedDestinationResponse
    ),
)
async def get_saved_destination(
    destination_id: int,
    db: AsyncSession = Depends(
        get_db
    ),
    current_user: User = Depends(
        require_operator
    ),
):
    del current_user

    destination = await (
        SavedDestinationService
        .get_by_id(
            db,
            destination_id,
        )
    )

    if destination is None:
        raise HTTPException(
            status_code=(
                status.HTTP_404_NOT_FOUND
            ),
            detail=(
                "Saved destination not found"
            ),
        )

    return destination


@router.patch(
    "/{destination_id}",
    response_model=(
        SavedDestinationResponse
    ),
)
async def update_saved_destination(
    destination_id: int,
    data: SavedDestinationUpdate,
    db: AsyncSession = Depends(
        get_db
    ),
    current_user: User = Depends(
        require_operator
    ),
):
    del current_user

    destination = await (
        SavedDestinationService
        .get_by_id(
            db,
            destination_id,
        )
    )

    if destination is None:
        raise HTTPException(
            status_code=(
                status.HTTP_404_NOT_FOUND
            ),
            detail=(
                "Saved destination not found"
            ),
        )

    values = data.model_dump(
        exclude_unset=True
    )

    if not values:
        raise HTTPException(
            status_code=(
                status.HTTP_422_UNPROCESSABLE_ENTITY
            ),
            detail=(
                "No update fields supplied"
            ),
        )

    if (
        "destination_rtmp_url"
        in values
    ):
        existing = await (
            SavedDestinationService
            .get_by_url(
                db,
                values[
                    "destination_rtmp_url"
                ],
            )
        )

        if (
            existing is not None
            and existing.id
            != destination.id
        ):
            raise HTTPException(
                status_code=(
                    status.HTTP_409_CONFLICT
                ),
                detail=(
                    "A saved destination with "
                    "this URL already exists"
                ),
            )

    try:
        return await (
            SavedDestinationService.update(
                db,
                destination,
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
                "A saved destination with "
                "this URL already exists"
            ),
        ) from exc


@router.delete(
    "/{destination_id}",
    status_code=(
        status.HTTP_204_NO_CONTENT
    ),
)
async def delete_saved_destination(
    destination_id: int,
    db: AsyncSession = Depends(
        get_db
    ),
    current_user: User = Depends(
        require_operator
    ),
):
    del current_user

    destination = await (
        SavedDestinationService
        .get_by_id(
            db,
            destination_id,
        )
    )

    if destination is None:
        raise HTTPException(
            status_code=(
                status.HTTP_404_NOT_FOUND
            ),
            detail=(
                "Saved destination not found"
            ),
        )

    await SavedDestinationService.delete(
        db,
        destination,
    )

    return Response(
        status_code=(
            status.HTTP_204_NO_CONTENT
        )
    )
