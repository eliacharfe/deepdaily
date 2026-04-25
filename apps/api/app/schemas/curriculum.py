# apps/api/app/schemas/curriculum.py

from pydantic import BaseModel, HttpUrl  # pyright: ignore[reportMissingImports]
from typing import Literal
from typing import Optional


class CurriculumDayResourceResponse(BaseModel):
    title: str
    url: str
    type: str
    reason: str | None = None
    snippet: str | None = None

class CurriculumSectionResponse(BaseModel):
    title: str
    content: str


class CurriculumDayResponse(BaseModel):
    dayNumber: int
    title: str
    objective: str
    summary: str
    sections: list[CurriculumSectionResponse]
    exercise: str | None = None
    resources: list[CurriculumDayResourceResponse]
    isGenerated: bool
    readItems: list[str] = []


class CreateCurriculumRequest(BaseModel):
    lessonId: str
    durationDays: Literal[7, 30]


class CurriculumResponse(BaseModel):
    id: str
    lessonId: str
    topic: str
    level: str
    durationDays: Literal[7, 30]
    title: str
    overview: str
    currentDay: int
    lastOpenedDay: int
    completedDays: list[int]
    days: list[CurriculumDayResponse]
    createdAt: str
    updatedAt: str


class CompleteCurriculumDayRequest(BaseModel):
    dayNumber: int


class UpdateLastOpenedDayRequest(BaseModel):
    dayNumber: int


class GenerateCurriculumDayRequest(BaseModel):
    dayNumber: int

class MarkCurriculumDayItemReadRequest(BaseModel):
    itemKey: str

class CurriculumResourcePayload(BaseModel):
    title: str
    type: Optional[str] = None
    url: Optional[str] = None
    snippet: Optional[str] = None
    reason: Optional[str] = None


class SummarizeCurriculumResourceRequest(BaseModel):
    curriculumId: str
    dayNumber: int
    resource: CurriculumResourcePayload


class SummarizeCurriculumResourceResponse(BaseModel):
    summary: str