# apps/api/app/api/routes/curriculum.py

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.session import get_db
from app.dependencies.auth import get_current_user
from app.models.curriculum import Curriculum
from app.models.lesson import Lesson
from typing import List
from app.schemas.curriculum import (
    CurriculumResponse,
    CreateCurriculumRequest,
    CompleteCurriculumDayRequest,
    UpdateLastOpenedDayRequest,
)

router = APIRouter(prefix="/curricula", tags=["curricula"])


def build_curriculum_response(curriculum: Curriculum) -> CurriculumResponse:
    content = curriculum.content_json or {}

    return CurriculumResponse(
        id=curriculum.id,
        lessonId=curriculum.lesson_id,
        topic=curriculum.topic,
        level=curriculum.level,
        durationDays=curriculum.duration_days,
        title=curriculum.title,
        overview=curriculum.overview,
        currentDay=curriculum.current_day,
        lastOpenedDay=curriculum.last_opened_day,
        completedDays=curriculum.completed_days_json or [],
        days=content.get("days", []),
        createdAt=curriculum.created_at.isoformat(),
        updatedAt=curriculum.updated_at.isoformat(),
    )


def build_mock_days(topic: str, duration_days: int) -> list[dict]:
    return [
        {
            "dayNumber": day,
            "title": f"Day {day}: {topic} Foundations {day}",
            "objective": f"Understand the core ideas for day {day}.",
            "summary": f"This is the study summary for day {day} on {topic}.",
            "sections": [
                {
                    "title": "Main concept",
                    "content": f"Core explanation for day {day}.",
                },
                {
                    "title": "Why it matters",
                    "content": f"Why this part of {topic} matters on day {day}.",
                },
            ],
            "exercise": f"Write 3 takeaways from day {day}.",
            "resources": [],
        }
        for day in range(1, duration_days + 1)
    ]


@router.post("", response_model=CurriculumResponse)
async def create_curriculum(
    payload: CreateCurriculumRequest,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    lesson_result = await db.execute(
        select(Lesson).where(
            Lesson.id == payload.lessonId,
            Lesson.user_id == current_user["uid"],
        )
    )
    lesson = lesson_result.scalar_one_or_none()

    if not lesson:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lesson not found",
        )

    existing_result = await db.execute(
        select(Curriculum).where(
            Curriculum.lesson_id == lesson.id,
            Curriculum.user_id == current_user["uid"],
            Curriculum.duration_days == payload.durationDays,
        )
    )
    existing_curriculum = existing_result.scalar_one_or_none()

    if existing_curriculum:
        return build_curriculum_response(existing_curriculum)

    days = build_mock_days(lesson.topic, payload.durationDays)

    curriculum = Curriculum(
        user_id=current_user["uid"],
        lesson_id=lesson.id,
        topic=lesson.topic,
        level=lesson.level,
        duration_days=payload.durationDays,
        title=f"{lesson.topic} {'7-Day Sprint' if payload.durationDays == 7 else '30-Day Deep Dive'}",
        overview=(
            f"A structured {payload.durationDays}-day curriculum for {lesson.topic}, "
            f"designed for {lesson.level} learners."
        ),
        current_day=1,
        last_opened_day=1,
        completed_days_json=[],
        content_json={"days": days},
    )

    db.add(curriculum)
    await db.commit()
    await db.refresh(curriculum)

    return build_curriculum_response(curriculum)


@router.get("/by-lesson/{lesson_id}", response_model=list[CurriculumResponse])
async def get_curricula_for_lesson(
    lesson_id: str,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    result = await db.execute(
        select(Curriculum).where(
            Curriculum.lesson_id == lesson_id,
            Curriculum.user_id == current_user["uid"],
        )
    )
    curricula = result.scalars().all()

    return [build_curriculum_response(curriculum) for curriculum in curricula]


@router.get("/{curriculum_id}", response_model=CurriculumResponse)
async def get_curriculum(
    curriculum_id: str,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    result = await db.execute(
        select(Curriculum).where(
            Curriculum.id == curriculum_id,
            Curriculum.user_id == current_user["uid"],
        )
    )
    curriculum = result.scalar_one_or_none()

    if not curriculum:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Curriculum not found",
        )

    return build_curriculum_response(curriculum)


@router.post("/{curriculum_id}/complete-day", response_model=CurriculumResponse)
async def complete_curriculum_day(
    curriculum_id: str,
    payload: CompleteCurriculumDayRequest,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    result = await db.execute(
        select(Curriculum).where(
            Curriculum.id == curriculum_id,
            Curriculum.user_id == current_user["uid"],
        )
    )
    curriculum = result.scalar_one_or_none()

    if not curriculum:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Curriculum not found",
        )

    if payload.dayNumber < 1 or payload.dayNumber > curriculum.duration_days:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid day number",
        )

    completed_days = curriculum.completed_days_json or []

    if payload.dayNumber not in completed_days:
        completed_days.append(payload.dayNumber)
        completed_days.sort()

    curriculum.completed_days_json = completed_days

    if payload.dayNumber >= curriculum.current_day and payload.dayNumber < curriculum.duration_days:
        curriculum.current_day = payload.dayNumber + 1
    elif payload.dayNumber == curriculum.duration_days:
        curriculum.current_day = curriculum.duration_days

    curriculum.last_opened_day = curriculum.current_day

    await db.commit()
    await db.refresh(curriculum)

    return build_curriculum_response(curriculum)


@router.post("/{curriculum_id}/last-opened-day", response_model=CurriculumResponse)
async def update_last_opened_day(
    curriculum_id: str,
    payload: UpdateLastOpenedDayRequest,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    result = await db.execute(
        select(Curriculum).where(
            Curriculum.id == curriculum_id,
            Curriculum.user_id == current_user["uid"]
        )
    )
    curriculum = result.scalar_one_or_none()

    if not curriculum:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Curriculum not found",
        )

    if payload.dayNumber < 1 or payload.dayNumber > curriculum.duration_days:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid day number",
        )

    curriculum.last_opened_day = payload.dayNumber

    await db.commit()
    await db.refresh(curriculum)

    return build_curriculum_response(curriculum)


