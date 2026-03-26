
# apps/api/app/schemas/lesson_qa.py

from typing import List, Literal

from pydantic import BaseModel, Field


class LessonSectionInput(BaseModel):
    title: str
    content: str


class LessonQaTurnInput(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class AskLessonQuestionRequest(BaseModel):
    curriculum_id: str = Field(..., alias="curriculumId")
    day_number: int = Field(..., alias="dayNumber")
    question: str
    level: str
    day_title: str = Field(..., alias="dayTitle")
    day_objective: str | None = Field(None, alias="dayObjective")
    sections: List[LessonSectionInput]
    conversation_history: List[LessonQaTurnInput] = Field(
        default_factory=list,
        alias="conversationHistory",
    )


class AskLessonQuestionResponse(BaseModel):
    answer: str