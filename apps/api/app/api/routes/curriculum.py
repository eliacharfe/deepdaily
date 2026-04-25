# apps/api/app/api/routes/curriculum.py

from fastapi import APIRouter, Depends, HTTPException, status  # pyright: ignore[reportMissingImports]
from sqlalchemy.ext.asyncio import AsyncSession  # pyright: ignore[reportMissingImports]
from sqlalchemy import select  # pyright: ignore[reportMissingImports]
from typing import List
import logging
import time
import asyncio
import json
from fastapi.responses import StreamingResponse  # pyright: ignore[reportMissingImports]

from app.db.session import get_db
from app.dependencies.auth import get_current_user
from app.models.curriculum import Curriculum
from app.models.lesson import Lesson
from app.schemas.curriculum import (
    CurriculumResponse,
    CreateCurriculumRequest,
    CompleteCurriculumDayRequest,
    UpdateLastOpenedDayRequest,
    GenerateCurriculumDayRequest,
    SummarizeCurriculumResourceRequest,
    SummarizeCurriculumResourceResponse,
    MarkCurriculumDayItemReadRequest,
)
from app.services.curriculum_service import (
    generate_curriculum_outline,
    generate_curriculum_day,
    retry_curriculum_day_resources,
    regenerate_curriculum_day,
    summarize_resource_for_curriculum,
    stream_resource_summary_for_curriculum,
)
from sqlalchemy import select
from app.models.curriculum import Curriculum

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/curricula", tags=["curricula"])

def build_curriculum_response(curriculum: Curriculum) -> CurriculumResponse:
    content = curriculum.content_json or {}
    raw_days = content.get("days", [])

    normalized_days = []
    for day in raw_days:
        normalized_days.append(
            {
                "dayNumber": day.get("dayNumber"),
                "title": day.get("title", ""),
                "objective": day.get("objective", ""),
                "summary": day.get("summary", ""),
                "sections": day.get("sections", []),
                "exercise": day.get("exercise", ""),
                "resources": day.get("resources", []),
                "isGenerated": day.get("isGenerated", True),
                "readItems": day.get("readItems", []),
            }
        )

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
        days=normalized_days,
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
            "isGenerated": True,
        }
        for day in range(1, duration_days + 1)
    ]


@router.post("", response_model=CurriculumResponse)
async def create_curriculum(
    payload: CreateCurriculumRequest,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):

    logger.info(
        "Creating curriculum request: lesson_id=%s duration=%s user=%s",
        payload.lessonId,
        payload.durationDays,
        current_user["uid"],
    )

    start_time = time.perf_counter()

    # -------------------------
    # Load lesson
    # -------------------------
    lesson_result = await db.execute(
        select(Lesson).where(
            Lesson.id == payload.lessonId,
            Lesson.user_id == current_user["uid"],
        )
    )
    lesson = lesson_result.scalar_one_or_none()

    if not lesson:
        logger.warning("Lesson not found for lesson_id=%s", payload.lessonId)
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lesson not found",
        )

    logger.info(
        "Lesson found topic=%s level=%s",
        lesson.topic,
        lesson.level,
    )

    # -------------------------
    # Check if curriculum exists
    # -------------------------
    existing_result = await db.execute(
        select(Curriculum).where(
            Curriculum.lesson_id == lesson.id,
            Curriculum.user_id == current_user["uid"],
            Curriculum.duration_days == payload.durationDays,
        )
    )
    existing_curriculum = existing_result.scalar_one_or_none()

    if existing_curriculum:
        logger.info(
            "Returning existing curriculum id=%s",
            existing_curriculum.id,
        )
        return build_curriculum_response(existing_curriculum)

    # -------------------------
    # Generate curriculum with agents
    # -------------------------
    logger.info(
        "Starting curriculum generation via agents topic=%s duration=%s",
        lesson.topic,
        payload.durationDays,
    )

    generation_start = time.perf_counter()

    try:
        generated = await generate_curriculum_outline(
            topic=lesson.topic,
            level=lesson.level,
            duration_days=payload.durationDays,
            lesson_summary=lesson.content_json.get("lesson", {}).get("summary", ""),
            roadmap=lesson.content_json.get("roadmap", []),
        )

        generated_days = generated.get("days", [])

        if not isinstance(generated_days, list) or len(generated_days) != payload.durationDays:
            generated_days = [
                {
                    "dayNumber": day,
                    "title": f"Day {day}: {lesson.topic}",
                    "objective": f"Understand the core ideas for day {day}.",
                    "summary": "",
                    "sections": [],
                    "exercise": "",
                    "resources": [],
                    "isGenerated": False,
                }
                for day in range(1, payload.durationDays + 1)
            ]

        generated["days"] = generated_days
    except Exception:
        logger.exception("Curriculum generation failed")
        raise

    generation_time = time.perf_counter() - generation_start

    logger.info(
        "Curriculum generation finished in %.2fs topic=%s",
        generation_time,
        lesson.topic,
    )

    # -------------------------
    # Validate generated days
    # -------------------------
    generated_days = generated.get("days", [])

    if not isinstance(generated_days, list) or len(generated_days) != payload.durationDays:
        logger.warning(
            "Generated curriculum invalid days. Using mock fallback. expected=%s got=%s",
            payload.durationDays,
            len(generated_days) if isinstance(generated_days, list) else "invalid",
        )
        generated_days = build_mock_days(lesson.topic, payload.durationDays)

    generated["days"] = generated_days

    # -------------------------
    # Create DB object
    # -------------------------
    curriculum = Curriculum(
        user_id=current_user["uid"],
        lesson_id=lesson.id,
        topic=lesson.topic,
        level=lesson.level,
        duration_days=payload.durationDays,
        title=generated.get(
            "title",
            f"{lesson.topic} {'7-Day Sprint' if payload.durationDays == 7 else '30-Day Deep Dive'}",
        ),
        overview=generated.get(
            "overview",
            f"A structured {payload.durationDays}-day curriculum for {lesson.topic}, designed for {lesson.level} learners.",
        ),
        current_day=1,
        last_opened_day=1,
        completed_days_json=[],
        content_json={"days": generated["days"]},
    )

    logger.info("Saving curriculum to database")

    db.add(curriculum)
    await db.commit()
    await db.refresh(curriculum)

    logger.info(
        "Curriculum saved successfully id=%s topic=%s total_time=%.2fs",
        curriculum.id,
        lesson.topic,
        time.perf_counter() - start_time,
    )

    return build_curriculum_response(curriculum)


@router.get("/by-lesson/{lesson_id}", response_model=list[CurriculumResponse])
async def get_curricula_for_lesson(
    lesson_id: str,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    logger.info("Fetching curricula for lesson_id=%s", lesson_id)

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

    logger.info("Fetching curriculum id=%s", curriculum_id)

    result = await db.execute(
        select(Curriculum).where(
            Curriculum.id == curriculum_id,
            Curriculum.user_id == current_user["uid"],
        )
    )
    curriculum = result.scalar_one_or_none()

    if not curriculum:
        logger.warning("Curriculum not found id=%s", curriculum_id)
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
    logger.info(
        "Completing curriculum day curriculum_id=%s day=%s",
        curriculum_id,
        payload.dayNumber,
    )

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

    existing_completed_days = list(curriculum.completed_days_json or [])

    if payload.dayNumber not in existing_completed_days:
        existing_completed_days.append(payload.dayNumber)

    curriculum.completed_days_json = sorted(existing_completed_days)

    if payload.dayNumber >= curriculum.current_day and payload.dayNumber < curriculum.duration_days:
        curriculum.current_day = payload.dayNumber + 1
    elif payload.dayNumber == curriculum.duration_days:
        curriculum.current_day = curriculum.duration_days

    curriculum.last_opened_day = curriculum.current_day

    await db.commit()
    await db.refresh(curriculum)

    logger.info(
        "After complete-day curriculum_id=%s completed_days=%s current_day=%s",
        curriculum_id,
        curriculum.completed_days_json,
        curriculum.current_day,
    )

    return build_curriculum_response(curriculum)


@router.post("/{curriculum_id}/last-opened-day", response_model=CurriculumResponse)
async def update_last_opened_day(
    curriculum_id: str,
    payload: UpdateLastOpenedDayRequest,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):

    logger.info(
        "Updating last opened day curriculum_id=%s day=%s",
        curriculum_id,
        payload.dayNumber,
    )

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


@router.post("/{curriculum_id}/generate-day")
async def generate_day_for_curriculum(
    curriculum_id: str,
    payload: GenerateCurriculumDayRequest,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    logger.info(
        "Generating on-demand day curriculum_id=%s day=%s",
        curriculum_id,
        payload.dayNumber,
    )

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

    content = curriculum.content_json or {}
    days = content.get("days", [])

    target_day = next(
        (day for day in days if day.get("dayNumber") == payload.dayNumber),
        None,
    )
    if not target_day:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Day not found in curriculum",
        )

    if target_day.get("isGenerated") is True:
        logger.info(
            "Day already generated curriculum_id=%s day=%s",
            curriculum_id,
            payload.dayNumber,
        )
        return build_curriculum_response(curriculum)

    previous_generated_days = [
        day
        for day in days
        if day.get("isGenerated") is True and day.get("dayNumber", 0) < payload.dayNumber
    ]

    async def event_stream():
        queue: asyncio.Queue[str | None] = asyncio.Queue()

        async def on_progress(message: str):
            await queue.put(
                json.dumps(
                    {
                        "type": "status",
                        "message": message,
                    }
                )
            )

        async def run_generation():
            try:
                generated_day = await generate_curriculum_day(
                    topic=curriculum.topic,
                    level=curriculum.level,
                    duration_days=curriculum.duration_days,
                    day_outline=target_day,
                    previous_days=previous_generated_days,
                    on_progress=on_progress,
                )

                updated_days = [
                    generated_day if day.get("dayNumber") == payload.dayNumber else day
                    for day in days
                ]

                curriculum.content_json = {
                    **content,
                    "days": updated_days,
                }

                await db.commit()
                await db.refresh(curriculum)

                logger.info(
                    "Generated and saved day curriculum_id=%s day=%s",
                    curriculum_id,
                    payload.dayNumber,
                )

                await queue.put(
                    json.dumps(
                        {
                            "type": "done",
                            "data": build_curriculum_response(curriculum).model_dump(),
                        }
                    )
                )
            except Exception as e:
                logger.exception(
                    "Failed generating curriculum day curriculum_id=%s day=%s",
                    curriculum_id,
                    payload.dayNumber,
                )
                await queue.put(
                    json.dumps(
                        {
                            "type": "error",
                            "message": str(e),
                        }
                    )
                )
            finally:
                await queue.put(None)

        task = asyncio.create_task(run_generation())

        try:
            while True:
                item = await queue.get()
                if item is None:
                    break
                yield f"data: {item}\n\n"
        finally:
            task.cancel()

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@router.get("", response_model=list[CurriculumResponse])
async def get_curricula(
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    logger.info("Fetching all curricula for user=%s", current_user["uid"])

    result = await db.execute(
        select(Curriculum).where(
            Curriculum.user_id == current_user["uid"],
        )
    )
    curricula = result.scalars().all()

    return [build_curriculum_response(curriculum) for curriculum in curricula]




@router.post(
    "/{curriculum_id}/days/{day_number}/retry-resources",
    response_model=CurriculumResponse,
)
async def retry_day_resources_route(
    curriculum_id: str,
    day_number: int,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    updated = await retry_curriculum_day_resources(
        db=db,
        user_id=current_user["uid"],
        curriculum_id=curriculum_id,
        day_number=day_number,
    )
    return build_curriculum_response(updated)


@router.post(
    "/{curriculum_id}/days/{day_number}/regenerate",
    response_model=CurriculumResponse,
)
async def regenerate_day_route(
    curriculum_id: str,
    day_number: int,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    updated = await regenerate_curriculum_day(
        db=db,
        user_id=current_user["uid"],
        curriculum_id=curriculum_id,
        day_number=day_number,
    )
    return build_curriculum_response(updated)



@router.post(
    "/resources/summarize",
    response_model=SummarizeCurriculumResourceResponse,
)
async def summarize_curriculum_resource(
    payload: SummarizeCurriculumResourceRequest,
    current_user=Depends(get_current_user),
):
    try:
        summary = await summarize_resource_for_curriculum(
            user_id=current_user["uid"],
            curriculum_id=payload.curriculumId,
            day_number=payload.dayNumber,
            resource=payload.resource,
        )
        return SummarizeCurriculumResourceResponse(summary=summary)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        )
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to summarize resource",
        )


@router.post("/resources/summarize/stream")
async def stream_summarize_curriculum_resource(
    payload: SummarizeCurriculumResourceRequest,
    current_user=Depends(get_current_user),
):
    async def event_stream():
        queue: asyncio.Queue[str | None] = asyncio.Queue()

        async def on_status(message: str):
            await queue.put(
                json.dumps(
                    {
                        "type": "status",
                        "message": message,
                    }
                )
            )

        async def on_chunk(chunk: str):
            await queue.put(
                json.dumps(
                    {
                        "type": "chunk",
                        "content": chunk,
                    }
                )
            )

        async def run_summary():
            try:
                summary = await stream_resource_summary_for_curriculum(
                    user_id=current_user["uid"],
                    curriculum_id=payload.curriculumId,
                    day_number=payload.dayNumber,
                    resource=payload.resource,
                    on_status=on_status,
                    on_chunk=on_chunk,
                )

                await queue.put(
                    json.dumps(
                        {
                            "type": "done",
                            "summary": summary,
                        }
                    )
                )
            except ValueError as exc:
                await queue.put(
                    json.dumps(
                        {
                            "type": "error",
                            "message": str(exc),
                        }
                    )
                )
            except Exception as exc:
                await queue.put(
                    json.dumps(
                        {
                            "type": "error",
                            "message": str(exc) or "Failed to summarize resource",
                        }
                    )
                )
            finally:
                await queue.put(None)

        task = asyncio.create_task(run_summary())

        try:
            while True:
                item = await queue.get()
                if item is None:
                    break
                yield f"data: {item}\n\n"
        finally:
            task.cancel()

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )

@router.post(
    "/{curriculum_id}/days/{day_number}/read-item",
    response_model=CurriculumResponse,
)
async def mark_curriculum_day_item_read(
    curriculum_id: str,
    day_number: int,
    payload: MarkCurriculumDayItemReadRequest,
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

    if day_number < 1 or day_number > curriculum.duration_days:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid day number",
        )

    item_key = payload.itemKey.strip()

    if not item_key:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Item key is required",
        )

    if not (
        item_key.startswith("section:")
        or item_key.startswith("resource:")
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid item key",
        )

    content = dict(curriculum.content_json or {})
    days = list(content.get("days", []))

    day_index = next(
        (
            index
            for index, day in enumerate(days)
            if day.get("dayNumber") == day_number
        ),
        None,
    )

    if day_index is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Day not found",
        )

    day = dict(days[day_index])
    read_items = list(day.get("readItems", []))

    if item_key not in read_items:
        read_items.append(item_key)

    day["readItems"] = read_items
    days[day_index] = day
    content["days"] = days

    curriculum.content_json = content

    await db.commit()
    await db.refresh(curriculum)

    return build_curriculum_response(curriculum)