from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, func
from app.core.database import Base


class ClientPage(Base):
    __tablename__ = "client_pages"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    slug = Column(String, unique=True, nullable=False, index=True)
    title = Column(String, nullable=False)
    source_table = Column(String, nullable=False, default="microwave_link_budgets")
    layout_json = Column(Text, nullable=False)
    is_published = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )