from datetime import datetime

from sqlalchemy import Boolean, DateTime, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class SiteConnectivity(Base):
    __tablename__ = "site_connectivity"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)

    sitea_id: Mapped[str | None] = mapped_column(String(100), index=True, nullable=True)
    siteb_id: Mapped[str | None] = mapped_column(String(100), index=True, nullable=True)
    link_id: Mapped[str | None] = mapped_column(String(150), index=True, nullable=True)
    category_ne: Mapped[str | None] = mapped_column(String(150), nullable=True)
    depth: Mapped[int | None] = mapped_column(Integer, nullable=True)
    dependency: Mapped[str | None] = mapped_column(String(150), nullable=True)
    pop_site: Mapped[str | None] = mapped_column(String(150), nullable=True)
    child_site_connectivity: Mapped[str | None] = mapped_column(String(150), nullable=True)
    child_site_name: Mapped[str | None] = mapped_column(String(200), index=True, nullable=True)

    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False,
    )