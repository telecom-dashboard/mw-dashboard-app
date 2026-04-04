from datetime import datetime

from sqlalchemy import String, Boolean, DateTime
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class MicrowaveLink(Base):
    __tablename__ = "microwave_links"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)

    ne_id: Mapped[str | None] = mapped_column(String(100), nullable=True, index=True)
    fe_id: Mapped[str | None] = mapped_column(String(100), nullable=True, index=True)
    link_id: Mapped[str] = mapped_column(String(100), nullable=False, unique=True, index=True)

    management_ip: Mapped[str | None] = mapped_column(String(100), nullable=True)
    web_protocol: Mapped[str | None] = mapped_column(String(20), nullable=True, default="http")

    link_class: Mapped[str | None] = mapped_column(String(100), nullable=True)
    vendor: Mapped[str | None] = mapped_column(String(100), nullable=True)
    model: Mapped[str | None] = mapped_column(String(100), nullable=True)
    type: Mapped[str | None] = mapped_column(String(100), nullable=True)
    status: Mapped[str | None] = mapped_column(String(100), nullable=True)

    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False,
    )