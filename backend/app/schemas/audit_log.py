from datetime import datetime
from pydantic import BaseModel


class AuditLogOut(BaseModel):
    id: int
    table_name: str
    record_id: int
    action: str
    changed_by: int | None = None
    old_values: str | None = None
    new_values: str | None = None
    changed_at: datetime

    model_config = {"from_attributes": True}