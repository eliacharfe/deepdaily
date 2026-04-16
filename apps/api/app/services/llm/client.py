# apps/api/app/services/llm/client.py

import json
from collections.abc import AsyncGenerator
from openai import AsyncOpenAI  # pyright: ignore[reportMissingImports]
from app.core.config import settings

client = AsyncOpenAI(api_key=settings.openai_api_key)

MODEL_ROADMAP = "gpt-5.4-mini"
MODEL_LESSON = "gpt-5.4"
MODEL_STREAMING_LESSON = "gpt-5.4"
MODEL_JSON = "gpt-5.4"
MODEL_ASK = "gpt-5.4-mini"


def get_model_for_task(task: str) -> str:
    normalized = task.strip().lower()

    if normalized == "roadmap":
        return MODEL_ROADMAP

    if normalized == "lesson":
        return MODEL_LESSON

    if normalized == "streaming_lesson":
        return MODEL_STREAMING_LESSON

    if normalized == "json":
        return MODEL_JSON

    if normalized == "ask":
        return MODEL_ASK

    return MODEL_LESSON


def _ensure_api_key() -> None:
    if not settings.openai_api_key:
        raise ValueError("OPENAI_API_KEY is not configured")


def _extract_text(response) -> str:
    text = response.output_text.strip()

    if not text:
        raise ValueError("OpenAI response was empty")

    return text


async def generate_roadmap_steps(topic: str, level: str, prompt: str) -> list[str]:
    _ensure_api_key()

    response = await client.responses.create(
        model=get_model_for_task("roadmap"),
        input=prompt,
    )

    text = _extract_text(response)

    lines = [
        line.strip().lstrip("-").lstrip("*").strip()
        for line in text.splitlines()
        if line.strip()
    ]

    cleaned = [line for line in lines if line]

    return cleaned[:6]


async def generate_lesson_content(prompt: str, level: str) -> dict:
    _ensure_api_key()

    response = await client.responses.create(
        model=get_model_for_task("lesson"),
        input=prompt,
    )

    text = _extract_text(response)

    try:
        return json.loads(text)
    except json.JSONDecodeError as exc:
        raise ValueError(f"Failed to parse lesson JSON: {text}") from exc


async def stream_markdown_text(prompt: str, level: str) -> AsyncGenerator[str, None]:
    _ensure_api_key()

    stream = await client.responses.create(
        model=get_model_for_task("streaming_lesson"),
        input=prompt,
        stream=True,
    )

    async for event in stream:
        if event.type == "response.output_text.delta":
            yield event.delta


async def generate_json_response(prompt: str, level: str) -> dict:
    _ensure_api_key()

    response = await client.responses.create(
        model=get_model_for_task("json"),
        input=prompt,
    )

    text = _extract_text(response)

    try:
        return json.loads(text)
    except json.JSONDecodeError as exc:
        raise ValueError(f"Failed to parse JSON response: {text}") from exc
