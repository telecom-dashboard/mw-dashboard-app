from datetime import datetime
from typing import Any

from pydantic import BaseModel


class AuditLogRead(BaseModel):
    id: int
    table_name: str
    record_id: int
    action: str
    changed_by: int | None = None
    changed_by_username: str | None = None
    old_values: dict[str, Any] | None = None
    new_values: dict[str, Any] | None = None
    changed_at: datetime
