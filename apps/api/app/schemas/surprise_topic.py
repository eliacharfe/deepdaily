# apps/api/app/schemas/surprise_topic.py

from pydantic import BaseModel, Field


class SurpriseTopicRequest(BaseModel):
    level: str = "beginner"
    exclude_topics: list[str] = Field(default_factory=list)


class SurpriseTopicResponse(BaseModel):
    topic: str