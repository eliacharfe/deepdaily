# apps/api/app/api/routes/user_progress.py

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.dependencies.auth import get_current_user
from app.models.user_progress import UserProgress
from app.schemas.user_progress import AddXpRequest, UserProgressResponse

router = APIRouter(prefix="/user-progress", tags=["user-progress"])


async def get_or_create_progress(db: AsyncSession, user_id: str) -> UserProgress:
    result = await db.execute(
        select(UserProgress).where(UserProgress.user_id == user_id)
    )
    progress = result.scalar_one_or_none()

    if progress:
        return progress

    progress = UserProgress(user_id=user_id, total_xp=0)
    db.add(progress)
    await db.commit()
    await db.refresh(progress)
    return progress


@router.get("", response_model=UserProgressResponse)
async def get_progress(
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    user_id = current_user.get("uid")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid user")

    progress = await get_or_create_progress(db, user_id)
    return UserProgressResponse(total_xp=progress.total_xp)


@router.post("/xp", response_model=UserProgressResponse)
async def add_xp(
    payload: AddXpRequest,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    user_id = current_user.get("uid")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid user")

    progress = await get_or_create_progress(db, user_id)
    progress.total_xp += payload.amount

    await db.commit()
    await db.refresh(progress)

    return UserProgressResponse(total_xp=progress.total_xp)