import json

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import String, asc, desc, inspect, or_
from sqlalchemy.orm import Session

from app.core.database import SessionLocal
from app.models.client_page import ClientPage
from app.models.hybrid_page_access import HybridPageAccess
from app.models.site_dependency import SiteDependency
from app.models.site_connectivity import SiteConnectivity
from app.models.user import User
from app.routers.auth import require_admin, require_client_or_admin
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


ALLOWED_TABLE_MODELS = {
    "microwave_link_budgets": MicrowaveLinkBudget,
    "site_connectivity": SiteConnectivity,
    "site_dependencies": SiteDependency,
}

BLOCKED_TABLES = {"users", "audit_logs"}

HYBRID_PAGE_REGISTRY = {
    "link-level": {
        "key": "link-level",
        "title": "Link Level",
        "admin_path": "/admin/link-level",
        "client_path": "/client/hybrid/link-level",
        "description": "Interactive link-level topology view.",
        "order": 1,
    },
}


def table_label(table_name: str) -> str:
    return table_name.replace("_", " ").title()


def column_label(column_name: str) -> str:
    return column_name.replace("_", " ").title()


def get_table_model(table_name: str):
    model = ALLOWED_TABLE_MODELS.get(table_name)
    if not model or table_name in BLOCKED_TABLES:
        raise HTTPException(status_code=400, detail=f"Table is not allowed: {table_name}")
    return model


def get_table_columns(table_name: str) -> set[str]:
    return {column.key for column in inspect(get_table_model(table_name)).columns}


def split_column_key(key: str, default_table: str) -> tuple[str, str]:
    if not key:
        raise HTTPException(status_code=400, detail="Column key is required")

    if "." in key:
        table_name, column_name = key.split(".", 1)
    else:
        table_name, column_name = default_table, key

    if column_name not in get_table_columns(table_name):
        raise HTTPException(status_code=400, detail=f"Invalid column key: {key}")

    return table_name, column_name


def get_column_expression(key: str, default_table: str):
    table_name, column_name = split_column_key(key, default_table)
    return getattr(get_table_model(table_name), column_name)


def normalize_source_table(source_table: str | None) -> str:
    table_name = source_table or "microwave_link_budgets"
    get_table_model(table_name)
    return table_name


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


def validate_layout(layout: dict, source_table: str | None = None):
    base_table = normalize_source_table(source_table)
    columns = layout.get("columns", [])
    filters = layout.get("filters", [])
    joins = layout.get("joins", [])
    joined_tables = {join.get("table") for join in joins if join.get("table")}

    def validate_joined_column(key: str, label: str):
        table_name, _ = split_column_key(key, base_table)
        if table_name != base_table and table_name not in joined_tables:
            raise HTTPException(
                status_code=400,
                detail=f"{label} table requires a join first: {table_name}",
            )

    for col in columns:
        validate_joined_column(col.get("key"), "Column")

    for filt in filters:
        validate_joined_column(filt.get("key"), "Filter")

    sort_key = layout.get("default_sort", {}).get("key")
    if sort_key:
        validate_joined_column(sort_key, "Sort")

    for join in joins:
        join_table = join.get("table")
        left_key = join.get("left")
        right_key = join.get("right")

        if not join_table or not left_key or not right_key:
            raise HTTPException(status_code=400, detail="Join table and columns are required")

        if join_table == base_table:
            raise HTTPException(status_code=400, detail="Join table must differ from source table")

        get_table_model(join_table)
        split_column_key(left_key, base_table)
        split_column_key(right_key, base_table)


@router.get("/")
def get_client_pages(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    del current_user

    items = db.query(ClientPage).order_by(desc(ClientPage.updated_at)).all()
    return [parse_page(item) for item in items]


@router.get("/metadata/tables")
def get_client_page_table_metadata(
    current_user: User = Depends(require_admin),
):
    del current_user

    tables = []
    for table_name, model in ALLOWED_TABLE_MODELS.items():
        columns = []
        for column in inspect(model).columns:
            column_name = column.key
            columns.append(
                {
                    "key": f"{table_name}.{column_name}",
                    "table": table_name,
                    "name": column_name,
                    "label": column_label(column_name),
                    "type": column.type.__class__.__name__,
                    "is_primary": column.primary_key,
                }
            )

        tables.append(
            {
                "name": table_name,
                "label": table_label(table_name),
                "columns": columns,
            }
        )

    return {
        "blocked_tables": sorted(BLOCKED_TABLES),
        "tables": tables,
    }


@router.get("/hybrid-pages")
def get_hybrid_pages(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    del current_user

    access_by_key = {
        item.page_key: item
        for item in db.query(HybridPageAccess).all()
        if item.page_key in HYBRID_PAGE_REGISTRY
    }

    return [
        parse_hybrid_access(access_by_key.get(page_key), page_key)
        for page_key in sorted(
            HYBRID_PAGE_REGISTRY,
            key=lambda key: HYBRID_PAGE_REGISTRY[key]["order"],
        )
    ]


@router.get("/hybrid-pages/published/nav")
def get_published_hybrid_pages_for_nav(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_client_or_admin),
):
    del current_user

    enabled_items = (
        db.query(HybridPageAccess)
        .filter(HybridPageAccess.is_enabled.is_(True))
        .all()
    )
    enabled_keys = {item.page_key for item in enabled_items}

    items = []
    for page_key in sorted(
        enabled_keys.intersection(HYBRID_PAGE_REGISTRY),
        key=lambda key: HYBRID_PAGE_REGISTRY[key]["order"],
    ):
        page = {**HYBRID_PAGE_REGISTRY[page_key], "is_enabled": True}
        items.append(page)

    return items


@router.get("/hybrid-pages/published/{page_key}")
def get_published_hybrid_page(
    page_key: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_client_or_admin),
):
    del current_user

    if page_key not in HYBRID_PAGE_REGISTRY:
        raise HTTPException(status_code=404, detail="Hybrid page not found")

    item = (
        db.query(HybridPageAccess)
        .filter(
            HybridPageAccess.page_key == page_key,
            HybridPageAccess.is_enabled.is_(True),
        )
        .first()
    )

    if not item:
        raise HTTPException(status_code=403, detail="Hybrid page is not enabled")

    return parse_hybrid_access(item, page_key)


@router.put("/hybrid-pages/{page_key}")
def update_hybrid_page_access(
    page_key: str,
    payload: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    if page_key not in HYBRID_PAGE_REGISTRY:
        raise HTTPException(status_code=404, detail="Hybrid page not found")

    item = (
        db.query(HybridPageAccess)
        .filter(HybridPageAccess.page_key == page_key)
        .first()
    )

    if not item:
        item = HybridPageAccess(page_key=page_key)
        db.add(item)

    old_values = parse_hybrid_access(item, page_key)
    item.is_enabled = bool(payload.get("is_enabled", False))
    db.flush()

    create_audit_log(
        db,
        table_name="hybrid_page_access",
        record_id=item.id,
        action="update",
        current_user=current_user,
        old_values=old_values,
        new_values=parse_hybrid_access(item, page_key),
    )
    db.commit()
    db.refresh(item)

    return parse_hybrid_access(item, page_key)


def parse_hybrid_access(item: HybridPageAccess | None, page_key: str) -> dict:
    config = HYBRID_PAGE_REGISTRY[page_key]
    return {
        **config,
        "is_enabled": bool(item.is_enabled) if item else False,
    }


@router.get("/{page_id}")
def get_client_page(
    page_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    del current_user

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
    source_table = normalize_source_table(payload.source_table)
    validate_layout(payload.layout, source_table)

    exists = db.query(ClientPage).filter(ClientPage.slug == payload.slug).first()
    if exists:
        raise HTTPException(status_code=400, detail="Slug already exists")

    item = ClientPage(
        name=payload.name,
        slug=payload.slug,
        title=payload.title,
        source_table=source_table,
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

    source_table = normalize_source_table(data.get("source_table", item.source_table))

    if "layout" in data:
        validate_layout(data["layout"], source_table)
        item.layout_json = json.dumps(data["layout"])
    elif "source_table" in data:
        validate_layout(json.loads(item.layout_json), source_table)

    if "name" in data:
        item.name = data["name"]
    if "slug" in data:
        item.slug = data["slug"]
    if "title" in data:
        item.title = data["title"]
    if "source_table" in data:
        item.source_table = source_table
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
def get_public_client_page(
    slug: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_client_or_admin),
):
    del current_user

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
    current_user: User = Depends(require_client_or_admin),
):
    del current_user

    item = (
        db.query(ClientPage)
        .filter(ClientPage.slug == slug, ClientPage.is_published.is_(True))
        .first()
    )

    if not item:
        raise HTTPException(status_code=404, detail="Published client page not found")

    layout = json.loads(item.layout_json)
    source_table = normalize_source_table(item.source_table)
    source_model = get_table_model(source_table)
    visible_columns = [
        col["key"] for col in layout.get("columns", []) if col.get("visible", True)
    ]

    query = db.query(source_model)
    for join in layout.get("joins", []):
        join_table = join.get("table")
        target_model = get_table_model(join_table)
        left_column = get_column_expression(join.get("left"), source_table)
        right_column = get_column_expression(join.get("right"), source_table)
        join_type = join.get("type", "left")
        join_condition = left_column == right_column

        if join_type == "inner":
            query = query.join(target_model, join_condition)
        else:
            query = query.outerjoin(target_model, join_condition)

    if search:
        keyword = f"%{search.strip()}%"
        search_columns = []

        for key in visible_columns:
            column = get_column_expression(key, source_table)
            if isinstance(column.property.columns[0].type, String):
                search_columns.append(column.ilike(keyword))

        if search_columns:
            query = query.filter(or_(*search_columns))

    if vendor:
        try:
            query = query.filter(get_column_expression("vendor", source_table) == vendor)
        except HTTPException:
            pass

    if region:
        try:
            query = query.filter(get_column_expression("region", source_table) == region)
        except HTTPException:
            pass

    if status:
        try:
            query = query.filter(get_column_expression("status", source_table) == status)
        except HTTPException:
            pass

    default_sort = layout.get("default_sort", {})
    sort_key = default_sort.get("key", "link_id")
    sort_direction = default_sort.get("direction", "asc")

    try:
        sort_column = get_column_expression(sort_key, source_table)
    except HTTPException:
        sort_column = getattr(source_model, "id")

    query = query.order_by(desc(sort_column) if sort_direction == "desc" else asc(sort_column))

    total = query.count()
    selected_expressions = [getattr(source_model, "id").label("__row_id")]

    for key in visible_columns:
        table_name, column_name = split_column_key(key, source_table)
        selected_expressions.append(
            getattr(get_table_model(table_name), column_name).label(key.replace(".", "__"))
        )

    data_query = query.with_entities(*selected_expressions)
    rows = data_query.offset((page - 1) * page_size).limit(page_size).all()

    items = []
    for row in rows:
        row_map = row._mapping
        row_data = {"id": row_map["__row_id"]}
        for key in visible_columns:
            row_data[key] = row_map.get(key.replace(".", "__"))
        items.append(row_data)

    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": (total + page_size - 1) // page_size,
    }

@router.get("/published/nav")
def get_published_client_pages_for_nav(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_client_or_admin),
):
    del current_user

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

