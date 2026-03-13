#apps/api/app/services/streaming/lesson_stream_service.py

import json

from app.services.llm.client import stream_markdown_text
from app.services.llm.prompts import build_streaming_lesson_prompt


def format_sse(data: dict) -> str:
    return f"data: {json.dumps(data)}\n\n"


async def stream_lesson_text(topic: str, level: str):
    prompt = build_streaming_lesson_prompt(topic=topic, level=level)

    try:
        async for chunk in stream_markdown_text(prompt=prompt):
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