

from fastapi import APIRouter, Depends

from app.dependencies.auth import get_current_user

router = APIRouter(prefix="/auth", tags=["auth"])


@router.get("/me")
async def get_me(current_user=Depends(get_current_user)):
    return {
        "uid": current_user.get("uid"),
        "email": current_user.get("email"),
        "name": current_user.get("name"),
        "picture": current_user.get("picture"),
    }