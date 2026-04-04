from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, or_
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.site import Site
from app.schemas.site import SiteCreate, SiteOut, SiteUpdate
from app.routers.auth import require_admin, require_client_or_admin
from app.models.user import User

router = APIRouter(prefix="/sites", tags=["sites"])


@router.post("/", response_model=SiteOut)
def create_site(
    payload: SiteCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    existing_site = db.execute(
        select(Site).where(Site.site_code == payload.site_code)
    ).scalar_one_or_none()

    if existing_site:
        raise HTTPException(status_code=400, detail="Site code already exists")

    site = Site(**payload.model_dump())
    db.add(site)
    db.commit()
    db.refresh(site)
    return site


@router.get("/", response_model=list[SiteOut])
def list_sites(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_client_or_admin),
    search: str | None = Query(default=None),
):
    query = select(Site)

    if search:
        like_term = f"%{search}%"
        query = query.where(
            or_(
                Site.site_code.ilike(like_term),
                Site.site_name.ilike(like_term),
                Site.vendor.ilike(like_term),
                Site.region.ilike(like_term),
                Site.management_ip.ilike(like_term),
            )
        )

    query = query.order_by(Site.site_code.asc())
    sites = db.execute(query).scalars().all()
    return sites


@router.get("/{site_id}", response_model=SiteOut)
def get_site(
    site_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_client_or_admin),
):
    site = db.execute(
        select(Site).where(Site.id == site_id)
    ).scalar_one_or_none()

    if not site:
        raise HTTPException(status_code=404, detail="Site not found")

    return site


@router.put("/{site_id}", response_model=SiteOut)
def update_site(
    site_id: int,
    payload: SiteUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    site = db.execute(
        select(Site).where(Site.id == site_id)
    ).scalar_one_or_none()

    if not site:
        raise HTTPException(status_code=404, detail="Site not found")

    update_data = payload.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        setattr(site, field, value)

    db.commit()
    db.refresh(site)
    return site