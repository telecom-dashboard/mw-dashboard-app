from datetime import datetime

from sqlalchemy import String, Integer, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class ImportLog(Base):
    __tablename__ = "import_logs"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)

    file_name: Mapped[str] = mapped_column(String(255), nullable=False)
    import_type: Mapped[str] = mapped_column(String(50), nullable=False)  # sites / links / mixed
    total_rows: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    inserted_rows: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    updated_rows: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    failed_rows: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    uploaded_by: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)