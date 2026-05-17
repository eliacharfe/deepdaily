
# apps/api/app/models/training_template.py

import uuid

from sqlalchemy import Column, DateTime, String, func
from sqlalchemy.dialects.postgresql import JSONB, UUID

from app.db.base import Base


class TrainingTemplate(Base):
    __tablename__ = "training_templates"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(String, nullable=False, index=True)

    name = Column(String, nullable=False)
    exercises = Column(JSONB, nullable=False, default=list)

    running = Column(JSONB, nullable=True)
    walking = Column(JSONB, nullable=True)
    swimming = Column(JSONB, nullable=True)
    cycling = Column(JSONB, nullable=True)
    mobility = Column(JSONB, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)