#apps/api/app/services/llm/client.py

import json
from openai import AsyncOpenAI
from app.core.config import settings

client = AsyncOpenAI(api_key=settings.openai_api_key)


def get_model_for_level(level: str) -> str:
    normalized = level.strip().lower()

    if normalized == "beginner":
        return "gpt-4.1-mini"
    if normalized == "intermediate":
        return "gpt-5-nano"
    if normalized == "advanced":
        return "gpt-5"

    return "gpt-4.1-mini"


async def generate_roadmap_steps(topic: str, level: str, prompt: str) -> list[str]:
    if not settings.openai_api_key:
        raise ValueError("OPENAI_API_KEY is not configured")

    model = get_model_for_level(level)

    response = await client.responses.create(
        model=model,
        input=prompt,
    )

    text = response.output_text.strip()

    lines = [
        line.strip().lstrip("-").lstrip("*").strip()
        for line in text.splitlines()
        if line.strip()
    ]

    cleaned = [line for line in lines if line]

    return cleaned[:6]


async def generate_lesson_content(prompt: str, level: str) -> dict:
    if not settings.openai_api_key:
        raise ValueError("OPENAI_API_KEY is not configured")

    model = get_model_for_level(level)

    response = await client.responses.create(
        model=model,
        input=prompt,
    )

    text = response.output_text.strip()

    try:
        return json.loads(text)
    except json.JSONDecodeError as exc:
        raise ValueError(f"Failed to parse lesson JSON: {text}") from exc


async def stream_markdown_text(prompt: str, level: str):
    if not settings.openai_api_key:
        raise ValueError("OPENAI_API_KEY is not configured")

    model = get_model_for_level(level)

    stream = await client.responses.create(
        model=model,
        input=prompt,
        stream=True,
    )

    async for event in stream:
        if event.type == "response.output_text.delta":
            yield event.delta


async def generate_json_response(prompt: str, level: str) -> dict:
    if not settings.openai_api_key:
        raise ValueError("OPENAI_API_KEY is not configured")

    model = get_model_for_level(level)

    response = await client.responses.create(
        model=model,
        input=prompt,
    )

    text = response.output_text.strip()

    try:
        return json.loads(text)
    except json.JSONDecodeError as exc:
        raise ValueError(f"Failed to parse JSON response: {text}") from exc