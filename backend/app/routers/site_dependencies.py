import io

import pandas as pd
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi import File, UploadFile
from fastapi.responses import StreamingResponse
from sqlalchemy import asc, desc, func, or_
from sqlalchemy.orm import Session

from app.core.database import SessionLocal
from app.models.site_dependency import SiteDependency
from app.models.user import User
from app.routers.auth import require_admin
from app.schemas.site_dependency import (
    SiteDependencyCreate,
    SiteDependencyRead,
    SiteDependencyUpdate,
)
from app.utils.audit import create_audit_log

router = APIRouter(prefix="/site-dependencies", tags=["Site Dependencies"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


SEARCHABLE_FIELDS = ["site_id", "fe", "child_site_id", "pop_site"]

SITE_DEPENDENCY_COLUMN_MAP = {
    "Site ID": "site_id",
    "FE": "fe",
    "Site existed or not in MW Protection Path": "existed_in_mw_protection_path",
    "Child Site ID": "child_site_id",
    "POP Site": "pop_site",
}

SITE_DEPENDENCY_COLUMN_ALIASES = {
    "siteid": "Site ID",
    "fe": "FE",
    "siteexiste": "Site existed or not in MW Protection Path",
    "siteexist": "Site existed or not in MW Protection Path",
    "siteexisted": "Site existed or not in MW Protection Path",
    "siteexistedornotinmwprotectionpath": "Site existed or not in MW Protection Path",
    "siteexistedinmwprotectionpath": "Site existed or not in MW Protection Path",
    "mwprotectionpath": "Site existed or not in MW Protection Path",
    "childsite": "Child Site ID",
    "childsiteid": "Child Site ID",
    "popsite": "POP Site",
}

OPTIONAL_IMPORT_COLUMNS = {"Site existed or not in MW Protection Path"}


def build_filtered_query(
    db: Session,
    search: str | None = None,
    protection: bool | None = None,
    sort_by: str = "site_id",
    sort_order: str = "asc",
):
    query = db.query(SiteDependency)

    if search:
        keyword = f"%{search.strip()}%"
        query = query.filter(
            or_(*(getattr(SiteDependency, field).ilike(keyword) for field in SEARCHABLE_FIELDS))
        )

    if protection is not None:
        query = query.filter(
            SiteDependency.existed_in_mw_protection_path.is_(protection)
        )

    sort_column = getattr(SiteDependency, sort_by, SiteDependency.site_id)
    return query.order_by(desc(sort_column) if sort_order == "desc" else asc(sort_column))


def clean_value(value):
    if value is None:
        return None

    try:
        if pd.isna(value):
            return None
    except Exception:
        pass

    if hasattr(value, "item"):
        try:
            value = value.item()
        except Exception:
            pass

    if isinstance(value, str):
        value = value.strip()
        return value if value else None

    if isinstance(value, (int, float)):
        return str(value).strip()

    return value


def normalize_excel_header(value):
    return "".join(
        character
        for character in str(value).strip().lower()
        if character.isalnum()
    )


def normalize_import_dataframe_columns(df: pd.DataFrame):
    renamed_columns = {}

    for column in df.columns:
        canonical_name = SITE_DEPENDENCY_COLUMN_ALIASES.get(
            normalize_excel_header(column)
        )
        if canonical_name:
            renamed_columns[column] = canonical_name

    return df.rename(columns=renamed_columns)


def to_bool(value):
    value = clean_value(value)
    if value is None:
        return False

    if isinstance(value, bool):
        return value

    if isinstance(value, (int, float)):
        return bool(value)

    text = str(value).strip().lower()
    return text in {"true", "1", "yes", "y", "exist", "exists", "in path"}


def build_export_dataframe(items):
    rows = []

    for item in items:
        row_data = SiteDependencyRead.model_validate(item).model_dump(mode="json")
        rows.append(
            {
                "Site ID": row_data.get("site_id"),
                "FE": row_data.get("fe"),
                "Site existed or not in MW Protection Path": (
                    "Yes"
                    if row_data.get("existed_in_mw_protection_path")
                    else "No"
                ),
                "Child Site ID": row_data.get("child_site_id"),
                "POP Site": row_data.get("pop_site"),
            }
        )

    return pd.DataFrame(rows, columns=list(SITE_DEPENDENCY_COLUMN_MAP.keys()))


def stream_excel(df: pd.DataFrame, filename: str):
    output = io.BytesIO()
    with pd.ExcelWriter(output, engine="openpyxl") as writer:
        df.to_excel(writer, index=False, sheet_name="Site Dependencies")

    output.seek(0)
    return StreamingResponse(
        output,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


@router.get("/")
def get_site_dependencies(
    page: int = 1,
    page_size: int = 10,
    search: str | None = None,
    protection: bool | None = None,
    sort_by: str = "site_id",
    sort_order: str = "asc",
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    del current_user

    query = build_filtered_query(db, search, protection, sort_by, sort_order)
    total = query.count()
    items = query.offset((page - 1) * page_size).limit(page_size).all()

    return {
        "items": [
            SiteDependencyRead.model_validate(item).model_dump(mode="json")
            for item in items
        ],
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": (total + page_size - 1) // page_size,
    }


@router.get("/summary")
def get_site_dependency_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    del current_user

    total = db.query(func.count(SiteDependency.id)).scalar() or 0
    protected = (
        db.query(func.count(SiteDependency.id))
        .filter(SiteDependency.existed_in_mw_protection_path.is_(True))
        .scalar()
        or 0
    )
    not_protected = (
        db.query(func.count(SiteDependency.id))
        .filter(SiteDependency.existed_in_mw_protection_path.is_(False))
        .scalar()
        or 0
    )
    pop_sites = db.query(func.count(func.distinct(SiteDependency.pop_site))).scalar() or 0

    return {
        "total": total,
        "protected": protected,
        "not_protected": not_protected,
        "pop_sites": pop_sites,
    }


@router.get("/export/excel")
def export_site_dependencies_excel(
    search: str | None = None,
    protection: bool | None = None,
    sort_by: str = "site_id",
    sort_order: str = "asc",
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    del current_user

    items = build_filtered_query(
        db,
        search=search,
        protection=protection,
        sort_by=sort_by,
        sort_order=sort_order,
    ).all()
    return stream_excel(build_export_dataframe(items), "site_dependencies.xlsx")


@router.get("/export/excel-selected")
def export_selected_site_dependencies_excel(
    ids: list[int] = Query(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    del current_user

    items = (
        db.query(SiteDependency)
        .filter(SiteDependency.id.in_(ids))
        .order_by(asc(SiteDependency.site_id))
        .all()
    )

    if not items:
        raise HTTPException(status_code=404, detail="No selected site dependencies found")

    return stream_excel(
        build_export_dataframe(items),
        "site_dependencies_selected.xlsx",
    )


@router.post("/import/excel")
async def import_site_dependencies_excel(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    if not file.filename.endswith((".xlsx", ".xls")):
        raise HTTPException(status_code=400, detail="Only Excel files are allowed")

    content = await file.read()

    try:
        df = pd.read_excel(io.BytesIO(content))
        df.columns = [str(col).strip() for col in df.columns]
        df = normalize_import_dataframe_columns(df)
    except Exception as exc:
        raise HTTPException(
            status_code=400,
            detail=f"Failed to read Excel file: {str(exc)}",
        ) from exc

    missing_columns = [
        column
        for column in SITE_DEPENDENCY_COLUMN_MAP
        if column not in df.columns and column not in OPTIONAL_IMPORT_COLUMNS
    ]
    if missing_columns:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Missing columns in Excel: {missing_columns}. "
                f"Found columns: {list(df.columns)}"
            ),
        )

    created = 0
    updated = 0
    errors = []

    imported_items = []

    for index, row in df.iterrows():
        try:
            payload = {}
            for excel_column, db_column in SITE_DEPENDENCY_COLUMN_MAP.items():
                value = row.get(excel_column) if excel_column in df.columns else None
                payload[db_column] = (
                    to_bool(value)
                    if db_column == "existed_in_mw_protection_path"
                    else clean_value(value)
                )

            site_id = payload.get("site_id")
            if not site_id:
                errors.append(f"Row {index + 2}: Site ID is required")
                continue

            existing = (
                db.query(SiteDependency)
                .filter(SiteDependency.site_id == site_id)
                .first()
            )

            if existing:
                for key, value in payload.items():
                    setattr(existing, key, value)
                updated += 1
                imported_items.append(existing)
            else:
                item = SiteDependency(**payload)
                db.add(item)
                created += 1
                imported_items.append(item)
        except Exception as exc:
            errors.append(f"Row {index + 2}: {repr(exc)}")

    if created == 0 and updated == 0:
        raise HTTPException(
            status_code=400,
            detail={
                "message": "No rows were imported",
                "found_columns": list(df.columns),
                "errors": errors,
            },
        )

    try:
        db.flush()
        imported_ids = [item.id for item in imported_items if item.id is not None]
        db.commit()
    except Exception as exc:
        db.rollback()
        raise HTTPException(
            status_code=400,
            detail=f"Failed to save imported rows: {str(exc)}",
        ) from exc

    create_audit_log(
        db,
        table_name="site_dependencies",
        record_id=0,
        action="import",
        current_user=current_user,
        new_values={
            "filename": file.filename,
            "created": created,
            "updated": updated,
            "imported_ids": imported_ids,
            "errors": errors,
        },
    )
    db.commit()

    return {
        "message": "Import finished",
        "created": created,
        "updated": updated,
        "errors": errors,
    }


@router.post("/", response_model=SiteDependencyRead)
def create_site_dependency(
    payload: SiteDependencyCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    item = SiteDependency(**payload.model_dump())
    db.add(item)
    db.flush()
    create_audit_log(
        db,
        table_name="site_dependencies",
        record_id=item.id,
        action="create",
        current_user=current_user,
        new_values=SiteDependencyRead.model_validate(item).model_dump(mode="json"),
    )
    db.commit()
    db.refresh(item)
    return item


@router.put("/{item_id}", response_model=SiteDependencyRead)
def update_site_dependency(
    item_id: int,
    payload: SiteDependencyUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    item = db.query(SiteDependency).filter(SiteDependency.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Site dependency not found")

    old_values = SiteDependencyRead.model_validate(item).model_dump(mode="json")
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(item, key, value)

    create_audit_log(
        db,
        table_name="site_dependencies",
        record_id=item.id,
        action="update",
        current_user=current_user,
        old_values=old_values,
        new_values=SiteDependencyRead.model_validate(item).model_dump(mode="json"),
    )
    db.commit()
    db.refresh(item)
    return item


@router.delete("/delete-all")
def delete_all_site_dependencies(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    deleted_count = db.query(SiteDependency).count()
    db.query(SiteDependency).delete()
    create_audit_log(
        db,
        table_name="site_dependencies",
        record_id=0,
        action="delete_all",
        current_user=current_user,
        new_values={"deleted_count": deleted_count},
    )
    db.commit()
    return {"message": "All site dependencies deleted", "deleted_count": deleted_count}


@router.delete("/")
def bulk_delete_site_dependencies(
    ids: list[int] = Query(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    items = db.query(SiteDependency).filter(SiteDependency.id.in_(ids)).all()
    if not items:
        raise HTTPException(status_code=404, detail="No site dependencies found")

    old_values = [
        SiteDependencyRead.model_validate(item).model_dump(mode="json")
        for item in items
    ]
    deleted_count = len(items)

    for item in items:
        db.delete(item)

    create_audit_log(
        db,
        table_name="site_dependencies",
        record_id=0,
        action="bulk_delete",
        current_user=current_user,
        old_values={"items": old_values},
        new_values={"deleted_ids": ids, "deleted_count": deleted_count},
    )
    db.commit()
    return {"message": "Site dependencies deleted", "deleted_count": deleted_count}


@router.delete("/{item_id}")
def delete_site_dependency(
    item_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    item = db.query(SiteDependency).filter(SiteDependency.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Site dependency not found")

    old_values = SiteDependencyRead.model_validate(item).model_dump(mode="json")
    db.delete(item)
    create_audit_log(
        db,
        table_name="site_dependencies",
        record_id=item_id,
        action="delete",
        current_user=current_user,
        old_values=old_values,
    )
    db.commit()
    return {"message": "Site dependency deleted"}
