
# apps/api/app/schemas/training.py

from datetime import date, datetime
from pydantic import BaseModel, Field


class TrainingExerciseInput(BaseModel):
    exerciseId: str
    exerciseName: str
    sets: int = Field(ge=1)
    reps: int | None = Field(default=None, ge=1)
    weightKg: float | None = Field(default=None, ge=0)
    notes: str | None = None


class RunningInput(BaseModel):
    distanceKm: float = Field(ge=0)
    timeMinutes: float = Field(ge=0)

class DistanceActivityInput(BaseModel):
    distanceKm: float = Field(ge=0)
    timeMinutes: float = Field(ge=0)


class MobilityInput(BaseModel):
    timeMinutes: float = Field(ge=0)
    notes: str | None = None


class TrainingLogUpsertRequest(BaseModel):
    exercises: list[TrainingExerciseInput] = []
    running: DistanceActivityInput | None = None
    walking: DistanceActivityInput | None = None
    swimming: DistanceActivityInput | None = None
    cycling: DistanceActivityInput | None = None
    mobility: MobilityInput | None = None


class TrainingLogResponse(BaseModel):
    id: str
    date: date
    exercises: list[TrainingExerciseInput]
    running: DistanceActivityInput | None = None
    walking: DistanceActivityInput | None = None
    swimming: DistanceActivityInput | None = None
    cycling: DistanceActivityInput | None = None
    mobility: MobilityInput | None = None

    createdAt: datetime
    updatedAt: datetime

    model_config = {
        "from_attributes": True
    }


class TrainingTemplateCreateRequest(BaseModel):
    name: str = Field(min_length=1, max_length=80)
    exercises: list[TrainingExerciseInput] = []

    running: DistanceActivityInput | None = None
    walking: DistanceActivityInput | None = None
    swimming: DistanceActivityInput | None = None
    cycling: DistanceActivityInput | None = None
    mobility: MobilityInput | None = None


class TrainingTemplateResponse(BaseModel):
    id: str
    name: str
    exercises: list[TrainingExerciseInput]
    running: DistanceActivityInput | None = None
    walking: DistanceActivityInput | None = None
    swimming: DistanceActivityInput | None = None
    cycling: DistanceActivityInput | None = None
    mobility: MobilityInput | None = None

    createdAt: datetime
    updatedAt: datetime