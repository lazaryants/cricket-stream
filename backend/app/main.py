from fastapi import FastAPI
from app.core.config import settings

app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
)

@app.get("/api/v1/health")
async def health():
    return {
        "status": "ok",
        "service": settings.app_name,
        "version": settings.app_version,
    }
