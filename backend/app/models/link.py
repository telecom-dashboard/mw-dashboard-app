from datetime import datetime

from sqlalchemy import String, Float, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Link(Base):
    __tablename__ = "links"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)

    link_id: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)

    site_a_id: Mapped[int] = mapped_column(ForeignKey("sites.id"), nullable=False)
    site_b_id: Mapped[int] = mapped_column(ForeignKey("sites.id"), nullable=False)

    media_type: Mapped[str | None] = mapped_column(String(100), nullable=True)
    capacity: Mapped[float | None] = mapped_column(Float, nullable=True)
    bandwidth: Mapped[float | None] = mapped_column(Float, nullable=True)
    planning_capacity: Mapped[float | None] = mapped_column(Float, nullable=True)

    frequency_mhz: Mapped[float | None] = mapped_column(Float, nullable=True)
    polarization: Mapped[str | None] = mapped_column(String(50), nullable=True)

    rx_signal_s1: Mapped[float | None] = mapped_column(Float, nullable=True)
    rx_signal_s2: Mapped[float | None] = mapped_column(Float, nullable=True)

    comment: Mapped[str | None] = mapped_column(String(500), nullable=True)
    status: Mapped[str | None] = mapped_column(String(50), nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False,
    )

    site_a = relationship("Site", foreign_keys=[site_a_id], back_populates="links_as_site_a")
    site_b = relationship("Site", foreign_keys=[site_b_id], back_populates="links_as_site_b")