"""Dataset model."""

from __future__ import annotations

import uuid
from datetime import datetime, timezone

from sqlalchemy import String, Integer, BigInteger, Text, Boolean, ForeignKey, DateTime
from sqlalchemy.dialects.postgresql import UUID, ARRAY
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class Dataset(Base):
    __tablename__ = "datasets"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False, default="")
    format: Mapped[str] = mapped_column(String(10), nullable=False)  
    file_path: Mapped[str] = mapped_column(String(512), nullable=False)
    size: Mapped[int] = mapped_column(BigInteger, nullable=False, default=0)
    row_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    column_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    columns: Mapped[list[str]] = mapped_column(ARRAY(String), nullable=False, default=list)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="uploading")
    text_column: Mapped[str | None] = mapped_column(String(255), nullable=True)
    label_column: Mapped[str | None] = mapped_column(String(255), nullable=True)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )
