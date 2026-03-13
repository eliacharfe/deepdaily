#apps/api/app/api/routes/lessons.py

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.session import get_db
from app.schemas.lesson import GenerateLessonRequest, LessonResponse
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
    )


@router.post("/generate", response_model=LessonResponse)
async def generate_lesson(
    payload: GenerateLessonRequest,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    user_id = current_user.get("uid")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid user")

    topic = payload.topic.strip()
    level = payload.level.strip()

    existing = await get_existing_lesson(
        db=db,
        user_id=user_id,
        topic=topic,
        level=level,
    )

    if existing:
        return build_lesson_response(existing)

    generated = await generate_topic(topic=topic, level=level)

    content_json = {
        "roadmap": generated.roadmap,
        "lesson": generated.lesson.model_dump(),
        "resources": [resource.model_dump() for resource in generated.resources],
    }

    lesson = await create_lesson(
        db=db,
        user_id=user_id,
        topic=topic,
        level=level,
        title=generated.lesson.title,
        content_json=content_json,
    )

    return build_lesson_response(lesson)


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