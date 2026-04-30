
# apps/api/app/schemas/user_progress.py

from pydantic import BaseModel


class UserProgressResponse(BaseModel):
    total_xp: int


class AddXpRequest(BaseModel):
    amount: int
    reason: str | None = None