from contextlib import asynccontextmanager
import asyncio

from fastapi import FastAPI

from app.api.v1 import nodes
from app.api.v1 import streams
from app.api.v1 import sessions

from app.core.config import settings

from app.engine.lifecycle import (
    restore_streams,
    shutdown_streams,
    monitor_streams,
)


@asynccontextmanager
async def lifespan(app: FastAPI):

    print(
        "[LIFECYCLE] Backend starting"
    )

    await restore_streams()

    monitor_task = asyncio.create_task(
        monitor_streams()
    )

    yield

    print(
        "[LIFECYCLE] Backend stopping"
    )

    monitor_task.cancel()

    await shutdown_streams()


app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    lifespan=lifespan,
)


app.include_router(
    streams.router,
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
