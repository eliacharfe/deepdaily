
# apps/api/app/services/ai_lesson_answers.py

import json

from app.schemas.lesson_qa import AskLessonQuestionRequest
from app.services.llm.client import stream_markdown_text
from app.services.llm.prompts import build_lesson_qa_prompt


def format_sse(data: dict) -> str:
    return f"data: {json.dumps(data)}\n\n"


def _build_prompt(payload: AskLessonQuestionRequest) -> str:
    return build_lesson_qa_prompt(
        day_title=payload.day_title,
        day_objective=payload.day_objective,
        sections=[
            {
                "title": section.title,
                "content": section.content,
            }
            for section in payload.sections
        ],
        question=payload.question,
        level=payload.level,
    )


async def generate_lesson_answer_from_payload(
    payload: AskLessonQuestionRequest,
) -> str:
    prompt = _build_prompt(payload)

    chunks: list[str] = []

    async for chunk in stream_markdown_text(
        prompt=prompt,
        level=payload.level,
    ):
        chunks.append(chunk)

    return "".join(chunks).strip()


async def stream_lesson_answer_from_payload(payload: AskLessonQuestionRequest):
    prompt = _build_prompt(payload)

    try:
        async for chunk in stream_markdown_text(
            prompt=prompt,
            level=payload.level,
        ):
            yield format_sse({
                "type": "chunk",
                "content": chunk,
            })

        yield format_sse({
            "type": "done",
        })

    except Exception as exc:
        yield format_sse({
            "type": "error",
            "message": str(exc),
        })