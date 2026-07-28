import asyncio
from contextlib import (
    asynccontextmanager,
)
from contextlib import suppress

from fastapi import FastAPI

from app.api.v1 import nodes
from app.api.v1 import sessions
from app.api.v1 import auth
from app.api.v1 import sources
from app.api.v1 import streams
from app.core.config import settings
from app.engine.lifecycle import (
    monitor_streams,
    restore_streams,
    shutdown_streams,
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

    try:
        yield
    finally:
        print(
            "[LIFECYCLE] Backend stopping",
            flush=True,
        )

        monitor_task.cancel()

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
    streams.router,
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
