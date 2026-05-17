
# apps/api/app/models/training_log.py

import uuid

from sqlalchemy import Column, Date, DateTime, String, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import JSONB, UUID

from app.db.base import Base


class TrainingLog(Base):
    __tablename__ = "training_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(String, nullable=False, index=True)
    date = Column(Date, nullable=False, index=True)

    exercises = Column(JSONB, nullable=False, default=list)
    running = Column(JSONB, nullable=True)
    walking = Column(JSONB, nullable=True)
    swimming = Column(JSONB, nullable=True)
    cycling = Column(JSONB, nullable=True)
    mobility = Column(JSONB, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    __table_args__ = (
        UniqueConstraint("user_id", "date", name="uq_training_logs_user_date"),
    )