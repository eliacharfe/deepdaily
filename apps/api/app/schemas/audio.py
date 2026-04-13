
# apps/api/app/schemas/audio.py

from pydantic import BaseModel, Field


class SectionAudioRequest(BaseModel):
    title: str = Field(..., min_length=1)
    content: str = Field(..., min_length=1)
    language: str | None = None