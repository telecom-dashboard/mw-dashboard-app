from datetime import datetime
from pydantic import BaseModel


class LinkBase(BaseModel):
    link_id: str
    site_a_id: int
    site_b_id: int
    media_type: str | None = None
    capacity: float | None = None
    bandwidth: float | None = None
    planning_capacity: float | None = None
    frequency_mhz: float | None = None
    polarization: str | None = None
    rx_signal_s1: float | None = None
    rx_signal_s2: float | None = None
    comment: str | None = None
    status: str | None = None


class LinkCreate(LinkBase):
    pass


class LinkUpdate(BaseModel):
    media_type: str | None = None
    capacity: float | None = None
    bandwidth: float | None = None
    planning_capacity: float | None = None
    frequency_mhz: float | None = None
    polarization: str | None = None
    rx_signal_s1: float | None = None
    rx_signal_s2: float | None = None
    comment: str | None = None
    status: str | None = None


class LinkOut(LinkBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}