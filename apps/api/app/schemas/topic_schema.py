#apps/api/app/schemas/topic_schema.py

from pydantic import BaseModel
from typing import List


class TopicRequest(BaseModel):
    topic: str
    level: str = "beginner"


class LessonSection(BaseModel):
    title: str
    content: str


class Lesson(BaseModel):
    title: str
    today_focus: str
    summary: str
    sections: List[LessonSection]
    next_step: str


class LessonResource(BaseModel):
    title: str
    url: str
    type: str
    reason: str


class TopicResponse(BaseModel):
    topic: str
    level: str
    roadmap: List[str]
    lesson: Lesson
    resources: List[LessonResource]