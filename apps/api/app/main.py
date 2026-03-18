#apps/api/app/main.py

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes.health import router as health_router
from app.core.config import settings
from app.api.routes.topics import router as topics_router
from app.api.routes.streaming import router as streaming_router
from app.api.routes.auth import router as auth_router
from app.api.routes.lessons import router as lessons_router
from app.db.base import Base
from app.db.session import engine
from app.api.routes.curriculum import router as curriculum_router

# IMPORTANT: import models so SQLAlchemy knows about them
from app.models.lesson import Lesson


@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield


app = FastAPI(
    title=settings.app_name,
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(health_router)
app.include_router(topics_router)
app.include_router(streaming_router)
app.include_router(lessons_router)
app.include_router(curriculum_router)

print("DB URL:", settings.database_url)


@app.get("/")
async def root():
    return {
        "message": "Welcome to DeepDaily API"
    }