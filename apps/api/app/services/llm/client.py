#apps/api/app/services/llm/client.py

import json
from openai import AsyncOpenAI
from app.core.config import settings

client = AsyncOpenAI(api_key=settings.openai_api_key)


async def generate_roadmap_steps(topic: str, level: str, prompt: str) -> list[str]:
    if not settings.openai_api_key:
        raise ValueError("OPENAI_API_KEY is not configured")

    response = await client.responses.create(
        model=settings.openai_model,
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


async def generate_lesson_content(prompt: str) -> dict:
    if not settings.openai_api_key:
        raise ValueError("OPENAI_API_KEY is not configured")

    response = await client.responses.create(
        model=settings.openai_model,
        input=prompt,
    )

    text = response.output_text.strip()

    try:
        return json.loads(text)
    except json.JSONDecodeError as exc:
        raise ValueError(f"Failed to parse lesson JSON: {text}") from exc