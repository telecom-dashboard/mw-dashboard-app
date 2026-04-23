import io
from datetime import date, datetime
from decimal import Decimal

import pandas as pd
from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile
from fastapi.responses import StreamingResponse
from sqlalchemy import asc, desc, func, or_
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.core.database import SessionLocal
from app.models.microwave_link_budget import MicrowaveLinkBudget
from app.models.user import User
from app.routers.auth import require_admin
from app.schemas.microwave_link_budget import (
    MicrowaveLinkBudgetCreate,
    MicrowaveLinkBudgetRead,
    MicrowaveLinkBudgetUpdate,
)
from app.utils.audit import create_audit_log
from app.utils.microwave_link_budget_column_map import MICROWAVE_LINK_BUDGET_COLUMN_MAP

router = APIRouter(
    prefix="/microwave-link-budgets",
    tags=["Microwave Link Budgets"],
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


SEARCHABLE_FIELDS = [
    "vendor",
    "site_name_s1",
    "site_name_s2",
    "link_id",
    "site_name_s1_ip",
    "site_name_s2_ip",
    "status",
    "model",
    "protocol",
    "media_type",
    "region",
]

FLOAT_FIELDS = {
    "latitude_s1",
    "latitude_s2",
    "longitude_s1",
    "longitude_s2",
    "true_azimuth_s1",
    "true_azimuth_s2",
    "tower_height_s1",
    "tower_height_s2",
    "tr_antenna_diameter_s1",
    "tr_antenna_diameter_s2",
    "tr_antenna_height_s1",
    "tr_antenna_height_s2",
    "frequency_mhz",
    "path_length_km",
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
}


def clean_value(value):
    if value is None:
        return None

    try:
        if pd.isna(value):
            return None
    except Exception:
        pass

    if isinstance(value, pd.Timestamp):
        value = value.to_pydatetime()

    if isinstance(value, (datetime, date)):
        return value.isoformat()

    if hasattr(value, "item"):
        try:
            value = value.item()
        except Exception:
            pass

    if isinstance(value, Decimal):
        return float(value)

    if isinstance(value, bytes):
        return value.decode("utf-8", errors="ignore")

    if isinstance(value, str):
        value = value.strip()
        return value if value != "" else None

    if isinstance(value, (bool, int, float)):
        return value

    return str(value)


def to_bool(value):
    value = clean_value(value)

    if value is None:
        return None

    if isinstance(value, bool):
        return value

    if isinstance(value, (int, float)):
        return bool(value)

    text = str(value).strip().lower()

    if text in {"true", "1", "yes", "y", "active", "on air"}:
        return True

    if text in {"false", "0", "no", "n", "inactive", "down"}:
        return False

    return None


def to_float(value):
    value = clean_value(value)
    if value is None:
        return None

    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def normalize_import_value(db_col, raw_value):
    value = clean_value(raw_value)

    if db_col == "active":
        return to_bool(value)

    if db_col in FLOAT_FIELDS:
        return to_float(value)

    return value


def serialize_row_for_debug(data: dict):
    debug_data = {}
    for key, value in data.items():
        if isinstance(value, (datetime, date)):
            debug_data[key] = value.isoformat()
        else:
            debug_data[key] = repr(value)
    return debug_data


def build_export_dataframe(items):
    reverse_map = {v: k for k, v in MICROWAVE_LINK_BUDGET_COLUMN_MAP.items()}
    export_rows = []

    for item in items:
        item_data = MicrowaveLinkBudgetRead.model_validate(item).model_dump()
        row = {}

        for db_key, excel_key in reverse_map.items():
            value = item_data.get(db_key)

            if db_key == "active":
                value = "Yes" if value is True else "No" if value is False else ""

            row[excel_key] = value

        export_rows.append(row)

    return pd.DataFrame(
        export_rows, columns=list(MICROWAVE_LINK_BUDGET_COLUMN_MAP.keys())
    )


def build_filtered_query(
    db: Session,
    search: str | None = None,
    status: str | None = None,
    vendor: str | None = None,
    active: bool | None = None,
    sort_by: str = "link_id",
    sort_order: str = "asc",
):
    query = db.query(MicrowaveLinkBudget)

    if search:
        keyword = f"%{search.strip()}%"
        conditions = [
            getattr(MicrowaveLinkBudget, field).ilike(keyword)
            for field in SEARCHABLE_FIELDS
        ]
        query = query.filter(or_(*conditions))

    if status:
        query = query.filter(MicrowaveLinkBudget.status == status)

    if vendor:
        query = query.filter(MicrowaveLinkBudget.vendor == vendor)

    if active is not None:
        query = query.filter(MicrowaveLinkBudget.active == active)

    sort_column = getattr(MicrowaveLinkBudget, sort_by, MicrowaveLinkBudget.link_id)
    query = query.order_by(
        desc(sort_column) if sort_order == "desc" else asc(sort_column)
    )
    return query


@router.get("/")
def get_microwave_link_budgets(
    page: int = 1,
    page_size: int = 10,
    search: str | None = None,
    status: str | None = None,
    vendor: str | None = None,
    active: bool | None = None,
    sort_by: str = "link_id",
    sort_order: str = "asc",
    db: Session = Depends(get_db),
):
    query = build_filtered_query(db, search, status, vendor, active, sort_by, sort_order)

    total = query.count()
    items = query.offset((page - 1) * page_size).limit(page_size).all()

    return {
        "items": [
            MicrowaveLinkBudgetRead.model_validate(item).model_dump()
            for item in items
        ],
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": (total + page_size - 1) // page_size,
    }


@router.get("/summary")
def get_microwave_link_budget_summary(db: Session = Depends(get_db)):
    total_links = db.query(func.count(MicrowaveLinkBudget.id)).scalar() or 0
    active_links = (
        db.query(func.count(MicrowaveLinkBudget.id))
        .filter(MicrowaveLinkBudget.active.is_(True))
        .scalar()
        or 0
    )
    inactive_links = (
        db.query(func.count(MicrowaveLinkBudget.id))
        .filter(MicrowaveLinkBudget.active.is_(False))
        .scalar()
        or 0
    )

    status_rows = (
        db.query(MicrowaveLinkBudget.status, func.count(MicrowaveLinkBudget.id))
        .group_by(MicrowaveLinkBudget.status)
        .all()
    )
    vendor_rows = (
        db.query(MicrowaveLinkBudget.vendor, func.count(MicrowaveLinkBudget.id))
        .group_by(MicrowaveLinkBudget.vendor)
        .all()
    )

    return {
        "total_links": total_links,
        "active_links": active_links,
        "inactive_links": inactive_links,
        "status_counts": {key or "Unknown": value for key, value in status_rows},
        "vendor_counts": {key or "Unknown": value for key, value in vendor_rows},
    }


@router.post("/", response_model=MicrowaveLinkBudgetRead)
def create_microwave_link_budget(
    payload: MicrowaveLinkBudgetCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    item = MicrowaveLinkBudget(**payload.model_dump())
    db.add(item)
    db.flush()
    create_audit_log(
        db,
        table_name="microwave_link_budgets",
        record_id=item.id,
        action="create",
        current_user=current_user,
        new_values=MicrowaveLinkBudgetRead.model_validate(item).model_dump(),
    )
    db.commit()
    db.refresh(item)
    return item


@router.put("/{item_id}", response_model=MicrowaveLinkBudgetRead)
def update_microwave_link_budget(
    item_id: int,
    payload: MicrowaveLinkBudgetUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    item = (
        db.query(MicrowaveLinkBudget)
        .filter(MicrowaveLinkBudget.id == item_id)
        .first()
    )
    if not item:
        raise HTTPException(status_code=404, detail="Microwave link budget not found")

    old_values = MicrowaveLinkBudgetRead.model_validate(item).model_dump()
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(item, key, value)

    create_audit_log(
        db,
        table_name="microwave_link_budgets",
        record_id=item.id,
        action="update",
        current_user=current_user,
        old_values=old_values,
        new_values=MicrowaveLinkBudgetRead.model_validate(item).model_dump(),
    )
    db.commit()
    db.refresh(item)
    return item


@router.delete("/delete-all")
def delete_all_microwave_link_budgets(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    deleted_count = db.query(MicrowaveLinkBudget).count()

    if deleted_count == 0:
        return {
            "message": "No microwave link budgets to delete",
            "deleted_count": 0,
        }

    db.query(MicrowaveLinkBudget).delete()
    create_audit_log(
        db,
        table_name="microwave_link_budgets",
        record_id=0,
        action="delete_all",
        current_user=current_user,
        new_values={"deleted_count": deleted_count},
    )
    db.commit()

    return {
        "message": "All microwave link budgets deleted successfully",
        "deleted_count": deleted_count,
    }


@router.delete("/")
def bulk_delete_microwave_link_budgets(
    ids: list[int] = Query(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    items = db.query(MicrowaveLinkBudget).filter(MicrowaveLinkBudget.id.in_(ids)).all()

    if not items:
        raise HTTPException(status_code=404, detail="No microwave link budgets found")

    deleted_count = len(items)

    for item in items:
        db.delete(item)

    create_audit_log(
        db,
        table_name="microwave_link_budgets",
        record_id=0,
        action="bulk_delete",
        current_user=current_user,
        old_values={
            "items": [
                MicrowaveLinkBudgetRead.model_validate(item).model_dump()
                for item in items
            ]
        },
        new_values={"deleted_ids": ids, "deleted_count": deleted_count},
    )
    db.commit()
    return {
        "message": "Microwave link budgets deleted successfully",
        "deleted_count": deleted_count,
    }


@router.delete("/{item_id}")
def delete_microwave_link_budget(
    item_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    item = (
        db.query(MicrowaveLinkBudget)
        .filter(MicrowaveLinkBudget.id == item_id)
        .first()
    )
    if not item:
        raise HTTPException(status_code=404, detail="Microwave link budget not found")

    old_values = MicrowaveLinkBudgetRead.model_validate(item).model_dump()
    db.delete(item)
    create_audit_log(
        db,
        table_name="microwave_link_budgets",
        record_id=item_id,
        action="delete",
        current_user=current_user,
        old_values=old_values,
    )
    db.commit()
    return {"message": "Microwave link budget deleted successfully"}


@router.get("/export/excel")
def export_microwave_link_budgets_excel(
    search: str | None = None,
    status: str | None = None,
    vendor: str | None = None,
    active: bool | None = None,
    sort_by: str = "link_id",
    sort_order: str = "asc",
    db: Session = Depends(get_db),
):
    query = build_filtered_query(db, search, status, vendor, active, sort_by, sort_order)
    items = query.all()

    df = build_export_dataframe(items)

    output = io.BytesIO()
    with pd.ExcelWriter(output, engine="openpyxl") as writer:
        df.to_excel(writer, index=False, sheet_name="Microwave Link Budgets")

    output.seek(0)

    return StreamingResponse(
        output,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={
            "Content-Disposition": "attachment; filename=microwave_link_budgets.xlsx"
        },
    )


@router.get("/export/excel-selected")
def export_selected_microwave_link_budgets_excel(
    ids: list[int] = Query(...),
    db: Session = Depends(get_db),
):
    items = (
        db.query(MicrowaveLinkBudget)
        .filter(MicrowaveLinkBudget.id.in_(ids))
        .order_by(asc(MicrowaveLinkBudget.link_id))
        .all()
    )

    if not items:
        raise HTTPException(
            status_code=404, detail="No selected microwave link budgets found"
        )

    df = build_export_dataframe(items)

    output = io.BytesIO()
    with pd.ExcelWriter(output, engine="openpyxl") as writer:
        df.to_excel(writer, index=False, sheet_name="Selected Budgets")

    output.seek(0)

    return StreamingResponse(
        output,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={
            "Content-Disposition": "attachment; filename=microwave_link_budgets_selected.xlsx"
        },
    )


@router.get("/template/excel")
def download_microwave_link_budget_template():
    df = pd.DataFrame(columns=list(MICROWAVE_LINK_BUDGET_COLUMN_MAP.keys()))

    output = io.BytesIO()
    with pd.ExcelWriter(output, engine="openpyxl") as writer:
        df.to_excel(writer, index=False, sheet_name="Microwave Link Budgets Template")

    output.seek(0)

    return StreamingResponse(
        output,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={
            "Content-Disposition": "attachment; filename=microwave_link_budgets_template.xlsx"
        },
    )


@router.post("/import/excel")
async def import_microwave_link_budgets_excel(
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
    except Exception as e:
        raise HTTPException(
            status_code=400, detail=f"Failed to read Excel file: {str(e)}"
        )

    missing_columns = [
        col for col in MICROWAVE_LINK_BUDGET_COLUMN_MAP.keys() if col not in df.columns
    ]
    if missing_columns:
        raise HTTPException(
            status_code=400,
            detail=f"Missing columns in Excel: {missing_columns}",
        )

    created = 0
    updated = 0
    errors = []

    for index, row in df.iterrows():
        data = {}

        try:
            for excel_col, db_col in MICROWAVE_LINK_BUDGET_COLUMN_MAP.items():
                raw_value = row.get(excel_col)
                data[db_col] = normalize_import_value(db_col, raw_value)

            link_id = data.get("link_id")
            if not link_id:
                errors.append(f"Row {index + 2}: LinkID is required")
                continue

            existing = (
                db.query(MicrowaveLinkBudget)
                .filter(MicrowaveLinkBudget.link_id == link_id)
                .first()
            )

            if existing:
                for key, value in data.items():
                    setattr(existing, key, value)
                db.flush()
                updated += 1
            else:
                item = MicrowaveLinkBudget(**data)
                db.add(item)
                db.flush()
                created += 1

        except SQLAlchemyError as e:
            db.rollback()
            raise HTTPException(
                status_code=400,
                detail={
                    "message": f"Failed on Excel row {index + 2}",
                    "link_id": data.get("link_id"),
                    "row_data": serialize_row_for_debug(data),
                    "error": str(e),
                },
            )
        except Exception as e:
            errors.append(f"Row {index + 2}: {repr(e)}")

    try:
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=400,
            detail=f"Failed to import Excel file: {str(e)}",
        )

    create_audit_log(
        db,
        table_name="microwave_link_budgets",
        record_id=0,
        action="import",
        current_user=current_user,
        new_values={
            "filename": file.filename,
            "created": created,
            "updated": updated,
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
