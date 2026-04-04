from datetime import datetime
from pydantic import BaseModel


class ImportLogOut(BaseModel):
    id: int
    file_name: str
    import_type: str
    total_rows: int
    inserted_rows: int
    updated_rows: int
    failed_rows: int
    uploaded_by: int | None = None
    created_at: datetime

    model_config = {"from_attributes": True}