from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


class SiteConnectivityBase(BaseModel):
    sitea_id: Optional[str] = None
    siteb_id: Optional[str] = None
    link_id: Optional[str] = None
    category_ne: Optional[str] = None
    depth: Optional[int] = None
    dependency: Optional[str] = None
    pop_site: Optional[str] = None
    child_site_connectivity: Optional[str] = None
    child_site_name: Optional[str] = None
    is_active: bool = True


class SiteConnectivityCreate(SiteConnectivityBase):
    pass


class SiteConnectivityUpdate(BaseModel):
    sitea_id: Optional[str] = None
    siteb_id: Optional[str] = None
    link_id: Optional[str] = None
    category_ne: Optional[str] = None
    depth: Optional[int] = None
    dependency: Optional[str] = None
    pop_site: Optional[str] = None
    child_site_connectivity: Optional[str] = None
    child_site_name: Optional[str] = None
    is_active: Optional[bool] = None


class SiteConnectivityOut(SiteConnectivityBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
    updated_at: datetime

    # Joined read-only microwave budget fields
    budget_vendor: Optional[str] = None
    budget_site_name_s1: Optional[str] = None
    budget_site_name_s2: Optional[str] = None
    budget_state_province: Optional[str] = None
    budget_township: Optional[str] = None
    budget_zone: Optional[str] = None
    budget_ring_id_span_name: Optional[str] = None
    budget_media_type: Optional[str] = None
    budget_link_id: Optional[str] = None
    budget_revise: Optional[str] = None
    budget_site_name_s1_ip: Optional[str] = None
    budget_site_name_s2_ip: Optional[str] = None
    budget_site_name_s1_port: Optional[str] = None
    budget_site_name_s2_port: Optional[str] = None
    budget_link_class: Optional[str] = None
    budget_model: Optional[str] = None
    budget_status: Optional[str] = None
    budget_active: Optional[bool] = None
    budget_protocol: Optional[str] = None
    budget_comment: Optional[str] = None
    budget_status_1: Optional[str] = None
    budget_type: Optional[str] = None
    budget_bandwidth: Optional[str] = None
    budget_planning_capacity: Optional[str] = None
    budget_region: Optional[str] = None


class SiteConnectivityListResponse(BaseModel):
    items: list[SiteConnectivityOut]
    total: int
    page: int
    page_size: int