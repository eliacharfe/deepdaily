#apps/api/app/schemas/lesson.py

from pydantic import BaseModel, Field
from typing import List


class LessonSection(BaseModel):
    title: str
    content: str


class LessonContent(BaseModel):
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
    snippet: str | None = None


class LessonDeepDiveItem(BaseModel):
    title: str
    url: str | None = None
    type: str
    reason: str
    snippet: str | None = None


class GenerateLessonRequest(BaseModel):
    topic: str = Field(..., min_length=1)
    level: str = Field(..., min_length=1)


class GeneratedLessonResponse(BaseModel):
    topic: str
    level: str
    roadmap: List[str]
    lesson: LessonContent
    resources: List[LessonResource]
    deepDive: List[LessonDeepDiveItem] = Field(default_factory=list)


class SaveLessonRequest(BaseModel):
    topic: str = Field(..., min_length=1)
    level: str = Field(..., min_length=1)
    roadmap: List[str]
    lesson: LessonContent
    resources: List[LessonResource]
    deepDive: List[LessonDeepDiveItem] = Field(default_factory=list)


class LessonResponse(BaseModel):
    id: str
    topic: str
    level: str
    roadmap: List[str]
    lesson: LessonContent
    resources: List[LessonResource]
    deepDive: List[LessonDeepDiveItem] = Field(default_factory=list)