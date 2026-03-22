
# apps/api/app/api/routes/lesson_qa.py

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.dependencies.auth import get_current_user
from app.schemas.lesson_qa import (
    AskLessonQuestionRequest,
    AskLessonQuestionResponse,
)
from app.services.ai_lesson_answers import (
    generate_lesson_answer_from_payload,
    stream_lesson_answer_from_payload,
)

router = APIRouter(prefix="/curricula", tags=["curricula"])


@router.post("/ask", response_model=AskLessonQuestionResponse)
async def ask_about_lesson(
    payload: AskLessonQuestionRequest,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    user_id = current_user.get("uid")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid user")

    if not payload.question.strip():
        raise HTTPException(status_code=400, detail="Question is required")

    answer = await generate_lesson_answer_from_payload(payload)

    return AskLessonQuestionResponse(answer=answer)


@router.post("/ask/stream")
async def stream_ask_about_lesson(
    payload: AskLessonQuestionRequest,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    user_id = current_user.get("uid")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid user")

    if not payload.question.strip():
        raise HTTPException(status_code=400, detail="Question is required")

    generator = stream_lesson_answer_from_payload(payload)

    return StreamingResponse(
        generator,
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        },
    )