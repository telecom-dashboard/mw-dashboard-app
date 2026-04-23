import json

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import asc, desc, or_
from sqlalchemy.orm import Session

from app.core.database import SessionLocal
from app.models.client_page import ClientPage
from app.models.user import User
from app.routers.auth import require_admin
from app.models.microwave_link_budget import MicrowaveLinkBudget
from app.schemas.client_page import ClientPageCreate, ClientPageRead, ClientPageUpdate
from app.utils.audit import create_audit_log

router = APIRouter(
    prefix="/client-pages",
    tags=["Client Pages"],
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


ALLOWED_MICROWAVE_FIELDS = {
    "vendor",
    "site_name_s1",
    "site_name_s2",
    "state_province",
    "township",
    "zone",
    "region",
    "ring_id_span_name",
    "media_type",
    "link_id",
    "revise",
    "site_name_s1_ip",
    "site_name_s2_ip",
    "site_name_s1_port",
    "site_name_s2_port",
    "link_class",
    "model",
    "status",
    "active",
    "protocol",
    "comment",
    "status_1",
    "type",
    "bandwidth",
    "planning_capacity",
    "latitude_s1",
    "latitude_s2",
    "longitude_s1",
    "longitude_s2",
    "true_azimuth_s1",
    "true_azimuth_s2",
    "tower_height_s1",
    "tower_height_s2",
    "tr_antenna_model_s1",
    "tr_antenna_model_s2",
    "tr_antenna_diameter_s1",
    "tr_antenna_diameter_s2",
    "tr_antenna_height_s1",
    "tr_antenna_height_s2",
    "frequency_mhz",
    "polarization",
    "path_length_km",
    "radio_model_s1",
    "radio_model_s2",
    "design_frequency_1_s1",
    "design_frequency_1_s2",
    "design_frequency_2_s1",
    "design_frequency_2_s2",
    "design_frequency_3_s1",
    "design_frequency_3_s2",
    "design_frequency_4_s1",
    "design_frequency_4_s2",
    "tx_power_dbm_s1",
    "tx_power_dbm_s2",
    "rx_threshold_level_dbm_s1",
    "rx_threshold_level_dbm_s2",
    "radio_file_name_s1",
    "radio_file_name_s2",
    "receive_signal_dbm_s1",
    "receive_signal_dbm_s2",
    "thermal_fade_margin_db_s1",
    "thermal_fade_margin_db_s2",
    "effective_fade_margin_db_s1",
    "effective_fade_margin_db_s2",
    "annual_multipath_availability_s1",
    "annual_multipath_availability_s2",
    "annual_rain_availability_s1",
    "annual_rain_availability_s2",
    "atpc_1_s1",
    "atpc_1_s2",
}


def parse_page(page: ClientPage) -> dict:
    return {
        "id": page.id,
        "name": page.name,
        "slug": page.slug,
        "title": page.title,
        "source_table": page.source_table,
        "layout": json.loads(page.layout_json),
        "is_published": page.is_published,
    }


def validate_layout(layout: dict):
    columns = layout.get("columns", [])
    filters = layout.get("filters", [])

    for col in columns:
        key = col.get("key")
        if key not in ALLOWED_MICROWAVE_FIELDS:
            raise HTTPException(status_code=400, detail=f"Invalid column key: {key}")

    for filt in filters:
        key = filt.get("key")
        if key not in ALLOWED_MICROWAVE_FIELDS:
            raise HTTPException(status_code=400, detail=f"Invalid filter key: {key}")


@router.get("/")
def get_client_pages(db: Session = Depends(get_db)):
    items = db.query(ClientPage).order_by(desc(ClientPage.updated_at)).all()
    return [parse_page(item) for item in items]


@router.get("/{page_id}")
def get_client_page(page_id: int, db: Session = Depends(get_db)):
    item = db.query(ClientPage).filter(ClientPage.id == page_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Client page not found")
    return parse_page(item)


@router.post("/", response_model=ClientPageRead)
def create_client_page(
    payload: ClientPageCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    validate_layout(payload.layout)

    exists = db.query(ClientPage).filter(ClientPage.slug == payload.slug).first()
    if exists:
        raise HTTPException(status_code=400, detail="Slug already exists")

    item = ClientPage(
        name=payload.name,
        slug=payload.slug,
        title=payload.title,
        source_table="microwave_link_budgets",
        layout_json=json.dumps(payload.layout),
        is_published=payload.is_published,
    )
    db.add(item)
    db.flush()
    create_audit_log(
        db,
        table_name="client_pages",
        record_id=item.id,
        action="create",
        current_user=current_user,
        new_values=parse_page(item),
    )
    db.commit()
    db.refresh(item)

    return {
        "id": item.id,
        "name": item.name,
        "slug": item.slug,
        "title": item.title,
        "source_table": item.source_table,
        "layout": json.loads(item.layout_json),
        "is_published": item.is_published,
    }


@router.put("/{page_id}", response_model=ClientPageRead)
def update_client_page(
    page_id: int,
    payload: ClientPageUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    item = db.query(ClientPage).filter(ClientPage.id == page_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Client page not found")

    old_values = parse_page(item)
    data = payload.model_dump(exclude_unset=True)

    if "slug" in data and data["slug"] != item.slug:
        exists = db.query(ClientPage).filter(ClientPage.slug == data["slug"]).first()
        if exists:
            raise HTTPException(status_code=400, detail="Slug already exists")

    if "layout" in data:
        validate_layout(data["layout"])
        item.layout_json = json.dumps(data["layout"])

    if "name" in data:
        item.name = data["name"]
    if "slug" in data:
        item.slug = data["slug"]
    if "title" in data:
        item.title = data["title"]
    if "is_published" in data:
        item.is_published = data["is_published"]

    create_audit_log(
        db,
        table_name="client_pages",
        record_id=item.id,
        action="update",
        current_user=current_user,
        old_values=old_values,
        new_values=parse_page(item),
    )
    db.commit()
    db.refresh(item)

    return {
        "id": item.id,
        "name": item.name,
        "slug": item.slug,
        "title": item.title,
        "source_table": item.source_table,
        "layout": json.loads(item.layout_json),
        "is_published": item.is_published,
    }


@router.delete("/{page_id}")
def delete_client_page(
    page_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    item = db.query(ClientPage).filter(ClientPage.id == page_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Client page not found")

    old_values = parse_page(item)
    db.delete(item)
    create_audit_log(
        db,
        table_name="client_pages",
        record_id=page_id,
        action="delete",
        current_user=current_user,
        old_values=old_values,
    )
    db.commit()
    return {"message": "Client page deleted successfully"}


@router.get("/view/{slug}")
def get_public_client_page(slug: str, db: Session = Depends(get_db)):
    item = (
        db.query(ClientPage)
        .filter(ClientPage.slug == slug, ClientPage.is_published.is_(True))
        .first()
    )

    if not item:
        raise HTTPException(status_code=404, detail="Published client page not found")

    return parse_page(item)


@router.get("/view/{slug}/data")
def get_public_client_page_data(
    slug: str,
    page: int = 1,
    page_size: int = 10,
    search: str | None = None,
    vendor: str | None = None,
    region: str | None = None,
    status: str | None = None,
    db: Session = Depends(get_db),
):
    item = (
        db.query(ClientPage)
        .filter(ClientPage.slug == slug, ClientPage.is_published.is_(True))
        .first()
    )

    if not item:
        raise HTTPException(status_code=404, detail="Published client page not found")

    layout = json.loads(item.layout_json)
    visible_columns = [
        col["key"] for col in layout.get("columns", []) if col.get("visible", True)
    ]

    query = db.query(MicrowaveLinkBudget)

    if search:
        keyword = f"%{search.strip()}%"
        query = query.filter(
            or_(
                MicrowaveLinkBudget.link_id.ilike(keyword),
                MicrowaveLinkBudget.site_name_s1.ilike(keyword),
                MicrowaveLinkBudget.site_name_s2.ilike(keyword),
                MicrowaveLinkBudget.vendor.ilike(keyword),
                MicrowaveLinkBudget.region.ilike(keyword),
            )
        )

    if vendor:
        query = query.filter(MicrowaveLinkBudget.vendor == vendor)

    if region:
        query = query.filter(MicrowaveLinkBudget.region == region)

    if status:
        query = query.filter(MicrowaveLinkBudget.status == status)

    default_sort = layout.get("default_sort", {})
    sort_key = default_sort.get("key", "link_id")
    sort_direction = default_sort.get("direction", "asc")

    if sort_key not in ALLOWED_MICROWAVE_FIELDS:
        sort_key = "link_id"

    sort_column = getattr(MicrowaveLinkBudget, sort_key, MicrowaveLinkBudget.link_id)
    query = query.order_by(desc(sort_column) if sort_direction == "desc" else asc(sort_column))

    total = query.count()
    rows = query.offset((page - 1) * page_size).limit(page_size).all()

    items = []
    for row in rows:
        row_data = {"id": row.id}
        for key in visible_columns:
          row_data[key] = getattr(row, key, None)
        items.append(row_data)

    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": (total + page_size - 1) // page_size,
    }

@router.get("/published/nav")
def get_published_client_pages_for_nav(db: Session = Depends(get_db)):
    items = (
        db.query(ClientPage)
        .filter(ClientPage.is_published.is_(True))
        .order_by(ClientPage.title.asc())
        .all()
    )

    return [
        {
            "id": item.id,
            "title": item.title,
            "slug": item.slug,
            "path": f"/client/pages/{item.slug}",
        }
        for item in items
    ]

