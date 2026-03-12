#apps/api/app/api/routes/health.py

from fastapi import APIRouter

router = APIRouter(prefix="/health", tags=["health"])


@router.get("")
async def health_check():
    return {
        "status": "ok",
        "service": "deepdaily-api"
    }