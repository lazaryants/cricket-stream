import asyncio
from contextlib import (
    asynccontextmanager,
)
from contextlib import suppress

from fastapi import FastAPI

from app.api.v1 import auth
from app.api.v1 import components
from app.api.v1 import nodes
from app.api.v1 import sessions
from app.api.v1 import sources
from app.api.v1.saved_destinations import (
    router as saved_destinations_router,
)
from app.api.v1.saved_sources import (
    router as saved_sources_router,
)
from app.api.v1 import streams
from app.api.v1 import users
from app.core.config import settings
from app.engine.lifecycle import (
    monitor_streams,
    restore_streams,
    shutdown_streams,
)
from app.websocket import runtime
from app.websocket.runtime import (
    runtime_publisher,
)


@asynccontextmanager
async def lifespan(
    app: FastAPI,
):
    print(
        "[LIFECYCLE] Backend starting",
        flush=True,
    )

    await restore_streams()

    monitor_task = asyncio.create_task(
        monitor_streams(),
        name="stream-supervisor",
    )

    runtime_publisher_task = (
        asyncio.create_task(
            runtime_publisher.run(),
            name=(
                "runtime-websocket-publisher"
            ),
        )
    )

    try:
        yield

    finally:
        print(
            "[LIFECYCLE] Backend stopping",
            flush=True,
        )

        runtime_publisher_task.cancel()
        monitor_task.cancel()

        with suppress(
            asyncio.CancelledError
        ):
            await runtime_publisher_task

        with suppress(
            asyncio.CancelledError
        ):
            await monitor_task

        await shutdown_streams()


app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    lifespan=lifespan,
)

app.include_router(
    auth.router,
    prefix="/api/v1",
)

app.include_router(
    components.router,
    prefix="/api/v1",
)

app.include_router(
    runtime.router,
    prefix="/api/v1",
)

app.include_router(
    saved_destinations_router,
    prefix="/api/v1",
)
app.include_router(
    saved_sources_router,
    prefix="/api/v1",
)
app.include_router(
    streams.router,
    prefix="/api/v1",
)

app.include_router(
    users.router,
    prefix="/api/v1",
)

app.include_router(
    sources.router,
    prefix="/api/v1",
)

app.include_router(
    nodes.router,
    prefix="/api/v1",
)

app.include_router(
    sessions.router,
    prefix="/api/v1",
)


@app.get("/api/v1/health")
async def health():
    return {
        "status": "ok",
        "service": settings.app_name,
        "version": settings.app_version,
    }
