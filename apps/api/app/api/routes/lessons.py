#apps/api/app/api/routes/lessons.py

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.session import get_db
from app.schemas.lesson import (
    GenerateLessonRequest,
    GeneratedLessonResponse,
    SaveLessonRequest,
    LessonResponse,
)
from app.services.lesson_service import get_existing_lesson, create_lesson
from app.dependencies.auth import get_current_user
from app.services.topic_service import generate_topic
from app.models.lesson import Lesson

router = APIRouter(prefix="/lessons", tags=["lessons"])


def build_lesson_response(lesson: Lesson) -> LessonResponse:
    content = lesson.content_json or {}

    return LessonResponse(
        id=lesson.id,
        topic=lesson.topic,
        level=lesson.level,
        roadmap=content.get("roadmap", []),
        lesson=content.get("lesson", {}),
        resources=content.get("resources", []),
        deepDive=content.get("deepDive", []),
        streamedLesson=content.get("streamedLesson"),
    )

@router.post("/generate", response_model=GeneratedLessonResponse)
async def generate_lesson(
    payload: GenerateLessonRequest,
    current_user=Depends(get_current_user),
):
    user_id = current_user.get("uid")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid user")

    topic = payload.topic.strip()
    level = payload.level.strip()

    generated = await generate_topic(topic=topic, level=level)

    return GeneratedLessonResponse(
        topic=topic,
        level=level,
        roadmap=generated.roadmap,
        lesson=generated.lesson.model_dump(),
        resources=[
            resource.model_dump() if hasattr(resource, "model_dump") else resource
            for resource in generated.resources
        ],
        deepDive=[
            item.model_dump() if hasattr(item, "model_dump") else item
            for item in (generated.deepDive or [])
        ],
        streamedLesson=None,
    )

@router.post("/save", response_model=LessonResponse)
async def save_lesson(
    payload: SaveLessonRequest,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    user_id = current_user.get("uid")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid user")

    topic = payload.topic.strip()
    level = payload.level.strip()

    content_json = {
        "roadmap": payload.roadmap,
        "lesson": payload.lesson.model_dump(),
        "resources": [resource.model_dump() for resource in payload.resources],
        "deepDive": [item.model_dump() for item in payload.deepDive] if payload.deepDive else [],
        "streamedLesson": payload.streamedLesson,
    }

    lesson = await create_lesson(
        db=db,
        user_id=user_id,
        topic=topic,
        level=level,
        title=payload.lesson.title,
        content_json=content_json,
    )

    return build_lesson_response(lesson)

@router.put("/{lesson_id}", response_model=LessonResponse)
async def update_lesson(
    lesson_id: str,
    payload: SaveLessonRequest,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    user_id = current_user.get("uid")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid user")

    stmt = (
        select(Lesson)
        .where(Lesson.id == lesson_id)
        .where(Lesson.user_id == user_id)
        .limit(1)
    )
    result = await db.execute(stmt)
    lesson = result.scalar_one_or_none()

    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")

    topic = payload.topic.strip()
    level = payload.level.strip()

    lesson.topic = topic
    lesson.level = level
    lesson.title = payload.lesson.title
    lesson.content_json = {
        "roadmap": payload.roadmap,
        "lesson": payload.lesson.model_dump(),
        "resources": [resource.model_dump() for resource in payload.resources],
        "deepDive": [item.model_dump() for item in payload.deepDive] if payload.deepDive else [],
        "streamedLesson": payload.streamedLesson,
    }

    await db.commit()
    await db.refresh(lesson)

    return build_lesson_response(lesson)


@router.delete("/{lesson_id}")
async def delete_lesson(
    lesson_id: str,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    user_id = current_user.get("uid")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid user")

    stmt = (
        select(Lesson)
        .where(Lesson.id == lesson_id)
        .where(Lesson.user_id == user_id)
        .limit(1)
    )
    result = await db.execute(stmt)
    lesson = result.scalar_one_or_none()

    if not lesson:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lesson not found",
        )

    await db.delete(lesson)
    await db.commit()

    return {"ok": True, "message": "Lesson deleted"}

@router.get("", response_model=list[LessonResponse])
async def list_lessons(
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    user_id = current_user.get("uid")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid user")

    stmt = (
        select(Lesson)
        .where(Lesson.user_id == user_id)
        .order_by(Lesson.created_at.desc())
    )
    result = await db.execute(stmt)
    lessons = result.scalars().all()

    return [build_lesson_response(lesson) for lesson in lessons]


@router.get("/{lesson_id}", response_model=LessonResponse)
async def get_lesson(
    lesson_id: str,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    user_id = current_user.get("uid")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid user")

    stmt = (
        select(Lesson)
        .where(Lesson.id == lesson_id)
        .where(Lesson.user_id == user_id)
        .limit(1)
    )
    result = await db.execute(stmt)
    lesson = result.scalar_one_or_none()

    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")

    return build_lesson_response(lesson)