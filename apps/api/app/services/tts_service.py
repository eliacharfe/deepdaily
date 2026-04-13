# apps/api/app/services/tts_service.py

import re

from openai import AsyncOpenAI
from app.core.config import settings

client = AsyncOpenAI(api_key=settings.openai_api_key)


def strip_markdown_for_tts(text: str) -> str:
    cleaned = text or ""

    cleaned = re.sub(r"```[\s\S]*?```", " ", cleaned)
    cleaned = re.sub(r"`([^`]*)`", r"\1", cleaned)
    cleaned = re.sub(r"\[([^\]]+)\]\([^)]+\)", r"\1", cleaned)

    cleaned = re.sub(r"^\s{0,3}#{1,6}\s*", "", cleaned, flags=re.MULTILINE)
    cleaned = re.sub(r"^\s*>\s?", "", cleaned, flags=re.MULTILINE)
    cleaned = re.sub(r"^\s*[-*+]\s+", "", cleaned, flags=re.MULTILINE)
    cleaned = re.sub(r"^\s*\d+\.\s+", "", cleaned, flags=re.MULTILINE)

    cleaned = cleaned.replace("**", "").replace("*", "").replace("_", "")

    cleaned = re.sub(r"\n{2,}", "\n", cleaned)
    cleaned = re.sub(r"[ \t]+", " ", cleaned)

    return cleaned.strip()


def pick_voice(language: str | None) -> str:
    normalized = (language or "").lower()

    if normalized.startswith("he"):
        return "alloy"
    if normalized.startswith("fr"):
        return "verse"
    if normalized.startswith("es"):
        return "alloy"

    return "alloy"


async def generate_section_audio(
    *,
    title: str,
    content: str,
    language: str | None = None,
) -> bytes:
    speakable_text = strip_markdown_for_tts(f"{title}.\n\n{content}")
    voice = pick_voice(language)

    response = await client.audio.speech.create(
        model="gpt-4o-mini-tts",
        voice=voice,
        input=speakable_text,
        response_format="mp3",
    )

    return response.content