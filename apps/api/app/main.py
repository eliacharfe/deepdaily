#apps/api/app/main.py

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes.health import router as health_router
from app.core.config import settings
from app.api.routes.topics import router as topics_router
from app.api.routes.streaming import router as streaming_router

app = FastAPI(
    title=settings.app_name,
    version="0.1.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health_router)
app.include_router(topics_router)
app.include_router(streaming_router)


@app.get("/")
async def root():
    return {
        "message": "Welcome to DeepDaily API"
    }