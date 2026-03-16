# apps/api/app/schemas/curriculum.py

from pydantic import BaseModel  # pyright: ignore[reportMissingImports]
from typing import Literal


class CurriculumDayResourceResponse(BaseModel):
    title: str
    url: str
    type: str


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