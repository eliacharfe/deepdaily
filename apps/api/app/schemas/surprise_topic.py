# apps/api/app/schemas/surprise_topic.py

from pydantic import BaseModel, Field


class SurpriseTopicRequest(BaseModel):
    level: str = "beginner"
    exclude_topics: list[str] = Field(default_factory=list)
    count: int = 4


class SurpriseTopicResponse(BaseModel):
    topics: list[str]