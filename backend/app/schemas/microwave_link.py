from datetime import datetime
from pydantic import BaseModel


class MicrowaveLinkBase(BaseModel):
    ne_id: str | None = None
    fe_id: str | None = None
    link_id: str
    management_ip: str | None = None
    web_protocol: str | None = "http"
    link_class: str | None = None
    is_active: bool = True
    vendor: str | None = None
    model: str | None = None
    type: str | None = None
    status: str | None = None


class MicrowaveLinkCreate(MicrowaveLinkBase):
    pass


class MicrowaveLinkUpdate(BaseModel):
    ne_id: str | None = None
    fe_id: str | None = None
    management_ip: str | None = None
    web_protocol: str | None = None
    link_class: str | None = None
    is_active: bool | None = None
    vendor: str | None = None
    model: str | None = None
    type: str | None = None
    status: str | None = None


class MicrowaveLinkOut(MicrowaveLinkBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}