#apps/api/app/services/lesson_service.py

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.lesson import Lesson


async def get_existing_lesson(
    db: AsyncSession,
    user_id: str,
    topic: str,
    level: str,
) -> Lesson | None:
    stmt = (
        select(Lesson)
        .where(Lesson.user_id == user_id)
        .where(Lesson.topic == topic)
        .where(Lesson.level == level)
        .order_by(Lesson.created_at.desc())
        .limit(1)
    )
    result = await db.execute(stmt)
    return result.scalar_one_or_none()


async def create_lesson(
    db: AsyncSession,
    user_id: str,
    topic: str,
    level: str,
    title: str,
    content_json: dict,
) -> Lesson:
    lesson = Lesson(
        user_id=user_id,
        topic=topic,
        level=level,
        title=title,
        content_json=content_json,
    )
    db.add(lesson)
    await db.commit()
    await db.refresh(lesson)
    return lesson