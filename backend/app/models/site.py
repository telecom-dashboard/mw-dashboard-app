from datetime import datetime

from sqlalchemy import String, Float, DateTime, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Site(Base):
    __tablename__ = "sites"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)

    site_code: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    site_name: Mapped[str] = mapped_column(String(255), nullable=False)

    region: Mapped[str | None] = mapped_column(String(100), nullable=True)
    vendor: Mapped[str | None] = mapped_column(String(100), nullable=True)
    model: Mapped[str | None] = mapped_column(String(100), nullable=True)

    latitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    longitude: Mapped[float | None] = mapped_column(Float, nullable=True)

    management_ip: Mapped[str | None] = mapped_column(String(100), nullable=True)
    web_protocol: Mapped[str | None] = mapped_column(String(20), nullable=True, default="http")
    

    status: Mapped[str | None] = mapped_column(String(50), nullable=True)
    site_class: Mapped[str | None] = mapped_column(String(100), nullable=True)

    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False,
    )

    links_as_site_a = relationship(
        "Link",
        back_populates="site_a",
        foreign_keys="Link.site_a_id",
    )

    links_as_site_b = relationship(
        "Link",
        back_populates="site_b",
        foreign_keys="Link.site_b_id",
    )

    ping_logs = relationship("PingLog", back_populates="site")