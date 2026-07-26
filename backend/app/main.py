from fastapi import FastAPI
from app.api.v1 import nodes
from app.core.config import settings

app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
)

app.include_router(
    nodes.router,
    prefix="/api/v1",
)

@app.get("/api/v1/health")
async def health():
    return {
        "status": "ok",
        "service": settings.app_name,
        "version": settings.app_version,
    }
