
# apps/api/app/models/user_progress.py

import uuid
from sqlalchemy import Column, DateTime, Integer, String, func
from app.db.base import Base


class UserProgress(Base):
    __tablename__ = "user_progress"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, unique=True, index=True, nullable=False)

    total_xp = Column(Integer, nullable=False, default=0)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)