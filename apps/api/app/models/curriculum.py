# apps/api/app/models/curriculum.py

from sqlalchemy import String, Integer, DateTime, ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column
from datetime import datetime, UTC
import uuid

from app.db.base import Base


class Curriculum(Base):
    __tablename__ = "curricula"

    id: Mapped[str] = mapped_column(
        String,
        primary_key=True,
        default=lambda: str(uuid.uuid4())
    )
    user_id: Mapped[str] = mapped_column(String, nullable=False, index=True)
    lesson_id: Mapped[str] = mapped_column(
        String,
        ForeignKey("lessons.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    topic: Mapped[str] = mapped_column(String, nullable=False)
    level: Mapped[str] = mapped_column(String, nullable=False)
    duration_days: Mapped[int] = mapped_column(Integer, nullable=False)

    title: Mapped[str] = mapped_column(String, nullable=False)
    overview: Mapped[str] = mapped_column(String, nullable=False)

    current_day: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    last_opened_day: Mapped[int] = mapped_column(Integer, nullable=False, default=1)

    completed_days_json: Mapped[list] = mapped_column(JSON, nullable=False, default=list)
    content_json: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        onupdate=lambda: datetime.now(UTC),
        nullable=False
    )