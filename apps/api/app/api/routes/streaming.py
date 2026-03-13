#apps/api/app/api/routes/streaming.py

from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from app.services.streaming.lesson_stream_service import stream_lesson_text

router = APIRouter(prefix="/stream", tags=["streaming"])


class LessonStreamRequest(BaseModel):
    topic: str
    level: str = "beginner"


@router.post("/lesson")
async def stream_lesson(request: LessonStreamRequest):
    generator = stream_lesson_text(topic=request.topic, level=request.level)

    return StreamingResponse(
        generator,
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        },
    )