
# apps/api/app/schemas/lesson_qa.py

from pydantic import BaseModel, Field
from typing import List


class LessonSectionInput(BaseModel):
    title: str
    content: str


class AskLessonQuestionRequest(BaseModel):
    curriculum_id: str = Field(..., alias="curriculumId")
    day_number: int = Field(..., alias="dayNumber")
    question: str
    level: str
    day_title: str = Field(..., alias="dayTitle")
    day_objective: str | None = Field(None, alias="dayObjective")
    sections: List[LessonSectionInput]


class AskLessonQuestionResponse(BaseModel):
    answer: str