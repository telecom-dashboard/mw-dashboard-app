from datetime import datetime
from pydantic import BaseModel


class SiteBase(BaseModel):
    site_code: str
    site_name: str
    region: str | None = None
    vendor: str | None = None
    model: str | None = None
    latitude: float | None = None
    longitude: float | None = None
    management_ip: str | None = None
    web_protocol: str | None = "http"
    status: str | None = None
    site_class: str | None = None
    is_active: bool = True


class SiteCreate(SiteBase):
    pass


class SiteUpdate(BaseModel):
    site_name: str | None = None
    region: str | None = None
    vendor: str | None = None
    model: str | None = None
    latitude: float | None = None
    longitude: float | None = None
    management_ip: str | None = None
    web_protocol: str | None = None
    status: str | None = None
    site_class: str | None = None
    is_active: bool | None = None


class SiteOut(SiteBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}