from datetime import datetime
from uuid import UUID

from pydantic import (
    BaseModel,
    ConfigDict,
    Field,
)

from app.models.enums import (
    ProviderType,
    SourceEngine,
    StreamStatus,
)


class StreamCreate(BaseModel):
    model_config = ConfigDict(
        extra="forbid",
    )

    name: str = Field(
        min_length=1,
        max_length=200,
    )

    description: str | None = None

    provider: ProviderType

    source_url: str = Field(
        min_length=1,
    )

    source_engine: SourceEngine = SourceEngine.AUTO

    destination_rtmp_url: str = Field(
        min_length=1,
    )

    node_id: int = Field(
        ge=1,
    )

    enabled: bool = True
    auto_start: bool = False
    show_on_dashboard: bool = True


class StreamOperatorUpdate(BaseModel):
    """
    Operator может менять источник и параметры
    отображения, но не RTMP-назначение и node_id.
    """

    model_config = ConfigDict(
        extra="forbid",
    )

    name: str | None = Field(
        default=None,
        min_length=1,
        max_length=200,
    )

    description: str | None = None

    provider: ProviderType | None = None

    source_url: str | None = Field(
        default=None,
        min_length=1,
    )

    source_engine: SourceEngine | None = None

    # Оставляем существующие права operator.
    # Технические поля всё равно потребуют
    # остановки живого процесса.
    enabled: bool | None = None
    auto_start: bool | None = None

    # Можно менять без остановки.
    show_on_dashboard: bool | None = None


class StreamAdminUpdate(BaseModel):
    """
    Admin может менять все параметры потока.
    """

    model_config = ConfigDict(
        extra="forbid",
    )

    name: str | None = Field(
        default=None,
        min_length=1,
        max_length=200,
    )

    description: str | None = None

    provider: ProviderType | None = None

    source_url: str | None = Field(
        default=None,
        min_length=1,
    )

    source_engine: SourceEngine | None = None

    destination_rtmp_url: str | None = Field(
        default=None,
        min_length=1,
    )

    node_id: int | None = Field(
        default=None,
        ge=1,
    )

    enabled: bool | None = None
    auto_start: bool | None = None
    show_on_dashboard: bool | None = None


class StreamBaseResponse(BaseModel):
    model_config = ConfigDict(
        from_attributes=True,
    )

    id: int
    uuid: UUID

    name: str
    description: str | None

    provider: ProviderType
    source_engine: SourceEngine
    node_id: int

    enabled: bool
    auto_start: bool
    show_on_dashboard: bool

    status: StreamStatus

    source_configured: bool
    destination_configured: bool

    created_at: datetime
    updated_at: datetime


class StreamViewerResponse(
    StreamBaseResponse
):
    """
    Viewer не получает ни source_url,
    ни destination_rtmp_url.
    """

    pass


class StreamOperatorResponse(
    StreamBaseResponse
):
    """
    Operator видит обе ссылки, но право
    изменения destination проверяется
    отдельной update-схемой.
    """

    source_url: str
    destination_rtmp_url: str


class StreamAdminResponse(
    StreamOperatorResponse
):
    """
    Набор видимых полей совпадает с operator,
    но права изменения отличаются.
    """

    pass


# Сохраняем прежнее имя для совместимости.
class StreamResponse(
    StreamAdminResponse
):
    pass
