from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, or_, func
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.microwave_link import MicrowaveLink
from app.models.user import User
from app.routers.auth import require_admin, require_client_or_admin
from app.schemas.microwave_link import (
    MicrowaveLinkCreate,
    MicrowaveLinkOut,
    MicrowaveLinkUpdate,
)

router = APIRouter(prefix="/microwave-links", tags=["microwave-links"])


@router.post("/", response_model=MicrowaveLinkOut)
def create_microwave_link(
    payload: MicrowaveLinkCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    existing = db.execute(
        select(MicrowaveLink).where(MicrowaveLink.link_id == payload.link_id)
    ).scalar_one_or_none()

    if existing:
        raise HTTPException(status_code=400, detail="Link ID already exists")

    row = MicrowaveLink(**payload.model_dump())
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


@router.get("/")
def list_microwave_links(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_client_or_admin),
    search: str | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=10, ge=1, le=200),
):
    base_query = select(MicrowaveLink)

    if search:
        like_term = f"%{search}%"
        base_query = base_query.where(
            or_(
                MicrowaveLink.ne_id.ilike(like_term),
                MicrowaveLink.fe_id.ilike(like_term),
                MicrowaveLink.link_id.ilike(like_term),
                MicrowaveLink.management_ip.ilike(like_term),
                MicrowaveLink.vendor.ilike(like_term),
                MicrowaveLink.model.ilike(like_term),
                MicrowaveLink.type.ilike(like_term),
                MicrowaveLink.status.ilike(like_term),
                MicrowaveLink.link_class.ilike(like_term),
            )
        )

    count_query = select(func.count()).select_from(base_query.subquery())
    total = db.execute(count_query).scalar() or 0

    total_pages = (total + page_size - 1) // page_size
    offset = (page - 1) * page_size

    paged_query = (
        base_query
        .order_by(MicrowaveLink.link_id.asc())
        .offset(offset)
        .limit(page_size)
    )

    items = db.execute(paged_query).scalars().all()

    return {
        "items": [
            {
                "id": row.id,
                "ne_id": row.ne_id,
                "fe_id": row.fe_id,
                "link_id": row.link_id,
                "management_ip": row.management_ip,
                "web_protocol": row.web_protocol,
                "link_class": row.link_class,
                "is_active": row.is_active,
                "vendor": row.vendor,
                "model": row.model,
                "type": row.type,
                "status": row.status,
                "created_at": row.created_at,
                "updated_at": row.updated_at,
            }
            for row in items
        ],
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages,
    }


@router.get("/status/view")
def list_microwave_link_status(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_client_or_admin),
    search: str | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=10, ge=1, le=200),
):
    base_query = select(MicrowaveLink)

    if search:
        like_term = f"%{search}%"
        base_query = base_query.where(
            or_(
                MicrowaveLink.ne_id.ilike(like_term),
                MicrowaveLink.fe_id.ilike(like_term),
                MicrowaveLink.link_id.ilike(like_term),
                MicrowaveLink.management_ip.ilike(like_term),
                MicrowaveLink.vendor.ilike(like_term),
                MicrowaveLink.model.ilike(like_term),
                MicrowaveLink.type.ilike(like_term),
                MicrowaveLink.status.ilike(like_term),
            )
        )

    count_query = select(func.count()).select_from(base_query.subquery())
    total = db.execute(count_query).scalar() or 0

    total_pages = (total + page_size - 1) // page_size
    offset = (page - 1) * page_size

    paged_query = (
        base_query
        .order_by(MicrowaveLink.link_id.asc())
        .offset(offset)
        .limit(page_size)
    )

    items = db.execute(paged_query).scalars().all()

    return {
        "items": [
            {
                "id": row.id,
                "ne_id": row.ne_id,
                "fe_id": row.fe_id,
                "link_id": row.link_id,
                "management_ip": row.management_ip,
                "web_protocol": row.web_protocol,
                "link_class": row.link_class,
                "is_active": row.is_active,
                "vendor": row.vendor,
                "model": row.model,
                "type": row.type,
                "status": row.status,
                "created_at": row.created_at,
                "updated_at": row.updated_at,
            }
            for row in items
        ],
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages,
    }


@router.get("/status/summary")
def microwave_link_status_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_client_or_admin),
):
    total_links = db.execute(
        select(func.count()).select_from(MicrowaveLink)
    ).scalar() or 0

    active_links = db.execute(
        select(func.count()).select_from(MicrowaveLink).where(MicrowaveLink.is_active == True)
    ).scalar() or 0

    inactive_links = total_links - active_links

    status_rows = db.execute(
        select(
            MicrowaveLink.status,
            func.count().label("count")
        )
        .group_by(MicrowaveLink.status)
    ).all()

    vendor_rows = db.execute(
        select(
            MicrowaveLink.vendor,
            func.count().label("count")
        )
        .group_by(MicrowaveLink.vendor)
    ).all()

    status_counts = {
        (status if status else "Unknown"): count
        for status, count in status_rows
    }

    vendor_counts = {
        (vendor if vendor else "Unknown"): count
        for vendor, count in vendor_rows
    }

    return {
        "total_links": total_links,
        "active_links": active_links,
        "inactive_links": inactive_links,
        "status_counts": status_counts,
        "vendor_counts": vendor_counts,
    }


@router.get("/{row_id}", response_model=MicrowaveLinkOut)
def get_microwave_link(
    row_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_client_or_admin),
):
    row = db.execute(
        select(MicrowaveLink).where(MicrowaveLink.id == row_id)
    ).scalar_one_or_none()

    if not row:
        raise HTTPException(status_code=404, detail="Microwave link not found")

    return row


@router.put("/{row_id}", response_model=MicrowaveLinkOut)
def update_microwave_link(
    row_id: int,
    payload: MicrowaveLinkUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    row = db.execute(
        select(MicrowaveLink).where(MicrowaveLink.id == row_id)
    ).scalar_one_or_none()

    if not row:
        raise HTTPException(status_code=404, detail="Microwave link not found")

    update_data = payload.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        setattr(row, field, value)

    db.commit()
    db.refresh(row)
    return row