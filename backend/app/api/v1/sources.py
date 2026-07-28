from urllib.parse import urlparse

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status,
)
from pydantic import (
    BaseModel,
    ConfigDict,
    Field,
)

from app.core.auth_dependencies import (
    require_operator,
)
from app.models.user import User
from app.providers.detector import (
    detect_source_kind,
    normalize_source_url,
)
from app.providers.registry import (
    source_resolvers,
)


router = APIRouter(
    prefix="/sources",
    tags=["sources"],
)


class SourceDetectRequest(BaseModel):
    model_config = ConfigDict(
        extra="forbid",
    )

    source_url: str = Field(
        min_length=4,
        max_length=4096,
    )


class SourceDetectResponse(BaseModel):
    source_url: str
    source_kind: str
    hostname: str | None
    scheme: str


class SourceProbeRequest(BaseModel):
    model_config = ConfigDict(
        extra="forbid",
    )

    source_url: str = Field(
        min_length=4,
        max_length=4096,
    )

    quality: str = Field(
        default="best",
        min_length=1,
        max_length=100,
    )


class SourceProbeResponse(BaseModel):
    success: bool
    source_url: str
    source_kind: str
    provider: str
    quality: str

    plugin: str | None
    resolved_host: str | None
    resolved_scheme: str | None

    error: str | None


@router.post(
    "/detect",
    response_model=SourceDetectResponse,
)
async def detect_source(
    data: SourceDetectRequest,
    current_user: User = Depends(
        require_operator
    ),
):
    try:
        normalized = normalize_source_url(
            data.source_url
        )

        kind = detect_source_kind(
            normalized
        )

    except ValueError as exc:
        raise HTTPException(
            status_code=(
                status.HTTP_422_UNPROCESSABLE_ENTITY
            ),
            detail=str(exc),
        ) from exc

    parsed = urlparse(
        normalized
    )

    return SourceDetectResponse(
        source_url=normalized,
        source_kind=kind.value,
        hostname=parsed.hostname,
        scheme=parsed.scheme,
    )


@router.post(
    "/probe",
    response_model=SourceProbeResponse,
)
async def probe_source(
    data: SourceProbeRequest,
    current_user: User = Depends(
        require_operator
    ),
):
    try:
        result = (
            await source_resolvers
            .get_streamlink()
            .probe(
                source_url=(
                    data.source_url
                ),
                quality=data.quality,

                # Прямой media URL намеренно
                # не возвращается через API.
                include_resolved_url=False,
            )
        )

    except ValueError as exc:
        raise HTTPException(
            status_code=(
                status.HTTP_422_UNPROCESSABLE_ENTITY
            ),
            detail=str(exc),
        ) from exc

    except RuntimeError as exc:
        raise HTTPException(
            status_code=(
                status.HTTP_503_SERVICE_UNAVAILABLE
            ),
            detail=str(exc),
        ) from exc

    if result.resolved_url:
        resolved_scheme = urlparse(
            result.resolved_url
        ).scheme
    else:
        resolved_scheme = (
            result.metadata.get(
                "resolved_scheme"
            )
        )

    return SourceProbeResponse(
        success=result.success,
        source_url=result.source_url,
        source_kind=(
            result.source_kind.value
        ),
        provider=result.provider,
        quality=result.quality,
        plugin=result.plugin,
        resolved_host=(
            result.resolved_host
        ),
        resolved_scheme=(
            resolved_scheme
        ),
        error=result.error,
    )
