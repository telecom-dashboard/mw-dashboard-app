from typing import Any
from pydantic import BaseModel, ConfigDict


class ClientPageBase(BaseModel):
    name: str
    slug: str
    title: str
    source_table: str = "microwave_link_budgets"
    layout: dict[str, Any]
    is_published: bool = False


class ClientPageCreate(ClientPageBase):
    pass


class ClientPageUpdate(BaseModel):
    name: str | None = None
    slug: str | None = None
    title: str | None = None
    layout: dict[str, Any] | None = None
    is_published: bool | None = None


class ClientPageRead(BaseModel):
    id: int
    name: str
    slug: str
    title: str
    source_table: str
    layout: dict[str, Any]
    is_published: bool

    model_config = ConfigDict(from_attributes=True)