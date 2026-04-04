from datetime import datetime
from pydantic import BaseModel


class PingResultOut(BaseModel):
    id: int
    site_id: int
    ip_address: str
    reachable: bool
    sent: int | None = None
    received: int | None = None
    packet_loss: float | None = None
    min_ms: float | None = None
    avg_ms: float | None = None
    max_ms: float | None = None
    error_message: str | None = None
    raw_output: str | None = None
    created_at: datetime

    model_config = {"from_attributes": True}