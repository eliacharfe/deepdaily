
# apps/api/app/api/routes/training.py

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies.auth import get_current_user
from app.db.session import get_db
from app.models.training_log import TrainingLog
from datetime import date
from calendar import monthrange


from app.models.training_template import TrainingTemplate
from app.schemas.training import (
    TrainingLogResponse,
    TrainingLogUpsertRequest,
    TrainingTemplateCreateRequest,
    TrainingTemplateResponse,
)

router = APIRouter(prefix="/training", tags=["training"])


def to_training_response(log: TrainingLog) -> TrainingLogResponse:
    return TrainingLogResponse(
        id=str(log.id),
        date=log.date,
        exercises=log.exercises or [],
        running=log.running,
        walking=log.walking,
        swimming=log.swimming,
        cycling=log.cycling,
        mobility=log.mobility,
        createdAt=log.created_at,
        updatedAt=log.updated_at,
    )

def to_template_response(template: TrainingTemplate) -> TrainingTemplateResponse:
    return TrainingTemplateResponse(
        id=str(template.id),
        name=template.name,
        exercises=template.exercises or [],
        running=template.running,
        walking=template.walking,
        swimming=template.swimming,
        cycling=template.cycling,
        mobility=template.mobility,
        createdAt=template.created_at,
        updatedAt=template.updated_at,
    )

@router.get("/logs/{log_date}", response_model=TrainingLogResponse | None)
async def get_training_log(
    log_date: date,
    db: AsyncSession = Depends(get_db),
    user=Depends(get_current_user),
):
    result = await db.execute(
        select(TrainingLog).where(
            TrainingLog.user_id == user["uid"],
            TrainingLog.date == log_date,
        )
    )
    log = result.scalar_one_or_none()

    if not log:
        return None

    return to_training_response(log)


@router.put("/logs/{log_date}", response_model=TrainingLogResponse)
async def upsert_training_log(
    log_date: date,
    body: TrainingLogUpsertRequest,
    db: AsyncSession = Depends(get_db),
    user=Depends(get_current_user),
):
    result = await db.execute(
        select(TrainingLog).where(
            TrainingLog.user_id == user["uid"],
            TrainingLog.date == log_date,
        )
    )
    log = result.scalar_one_or_none()

    if log:
        log.exercises = [exercise.model_dump() for exercise in body.exercises]
        log.running = body.running.model_dump() if body.running else None
        log.walking = body.walking.model_dump() if body.walking else None
        log.swimming = body.swimming.model_dump() if body.swimming else None
        log.cycling = body.cycling.model_dump() if body.cycling else None
        log.mobility = body.mobility.model_dump() if body.mobility else None
    else:
        log = TrainingLog(
            user_id=user["uid"],
            date=log_date,
            exercises=[exercise.model_dump() for exercise in body.exercises],
            running=body.running.model_dump() if body.running else None,
            walking=body.walking.model_dump() if body.walking else None,
            swimming=body.swimming.model_dump() if body.swimming else None,
            cycling=body.cycling.model_dump() if body.cycling else None,
            mobility=body.mobility.model_dump() if body.mobility else None,
        )
        db.add(log)

    await db.commit()
    await db.refresh(log)

    return to_training_response(log)


@router.get("/logs", response_model=list[TrainingLogResponse])
async def get_training_logs_for_month(
    month: str,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    year, month_number = map(int, month.split("-"))

    start_date = date(year, month_number, 1)
    end_date = date(year, month_number, monthrange(year, month_number)[1])

    result = await db.execute(
        select(TrainingLog).where(
            TrainingLog.user_id == current_user["uid"],
            TrainingLog.date >= start_date,
            TrainingLog.date <= end_date,
        )
    )

    logs = result.scalars().all()

    return [to_training_response(log) for log in logs]


@router.get("/templates", response_model=list[TrainingTemplateResponse])
async def get_training_templates(
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    result = await db.execute(
        select(TrainingTemplate)
        .where(TrainingTemplate.user_id == current_user["uid"])
        .order_by(TrainingTemplate.created_at.desc())
    )

    templates = result.scalars().all()

    return [to_template_response(template) for template in templates]


@router.post("/templates", response_model=TrainingTemplateResponse)
async def create_training_template(
    body: TrainingTemplateCreateRequest,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    template = TrainingTemplate(
        user_id=current_user["uid"],
        name=body.name.strip(),
        exercises=[exercise.model_dump() for exercise in body.exercises],
        running=body.running.model_dump() if body.running else None,
        walking=body.walking.model_dump() if body.walking else None,
        swimming=body.swimming.model_dump() if body.swimming else None,
        cycling=body.cycling.model_dump() if body.cycling else None,
        mobility=body.mobility.model_dump() if body.mobility else None,
    )

    db.add(template)
    await db.commit()
    await db.refresh(template)

    return to_template_response(template)


@router.delete("/templates/{template_id}")
async def delete_training_template(
    template_id: str,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    result = await db.execute(
        select(TrainingTemplate).where(
            TrainingTemplate.id == template_id,
            TrainingTemplate.user_id == current_user["uid"],
        )
    )

    template = result.scalar_one_or_none()

    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Training template not found",
        )

    await db.delete(template)
    await db.commit()

    return {"success": True}