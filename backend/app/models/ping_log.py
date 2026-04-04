from datetime import datetime

from sqlalchemy import String, Integer, Float, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class PingLog(Base):
    __tablename__ = "ping_logs"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)

    site_id: Mapped[int] = mapped_column(ForeignKey("sites.id"), nullable=False)
    requested_by: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)

    ip_address: Mapped[str] = mapped_column(String(100), nullable=False)

    reachable: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    sent: Mapped[int | None] = mapped_column(Integer, nullable=True)
    received: Mapped[int | None] = mapped_column(Integer, nullable=True)
    packet_loss: Mapped[float | None] = mapped_column(Float, nullable=True)

    min_ms: Mapped[float | None] = mapped_column(Float, nullable=True)
    avg_ms: Mapped[float | None] = mapped_column(Float, nullable=True)
    max_ms: Mapped[float | None] = mapped_column(Float, nullable=True)

    error_message: Mapped[str | None] = mapped_column(String(500), nullable=True)
    raw_output: Mapped[str | None] = mapped_column(String(4000), nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    site = relationship("Site", back_populates="ping_logs")