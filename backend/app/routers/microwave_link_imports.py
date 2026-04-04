import io

import pandas as pd
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.microwave_link import MicrowaveLink
from app.models.user import User
from app.routers.auth import require_admin

router = APIRouter(prefix="/microwave-link-imports", tags=["microwave-link-imports"])

REQUIRED_COLUMNS = [
    "ne_id",
    "fe_id",
    "link_id",
    "management_ip",
    "web_protocol",
    "link_class",
    "is_active",
    "vendor",
    "model",
    "type",
    "status",
]


def normalize_value(value):
    if pd.isna(value):
        return None
    return value


def normalize_bool(value):
    if pd.isna(value):
        return True

    if isinstance(value, bool):
        return value

    text = str(value).strip().lower()
    if text in {"true", "yes", "1", "active", "on"}:
        return True
    if text in {"false", "no", "0", "inactive", "off"}:
        return False

    return True


@router.post("/upload")
async def import_microwave_links(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    if not file.filename.lower().endswith((".xlsx", ".xls")):
        raise HTTPException(status_code=400, detail="Only Excel files are supported")

    content = await file.read()

    try:
        df = pd.read_excel(io.BytesIO(content))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to read Excel file: {str(e)}")

    df.columns = [str(col).strip() for col in df.columns]

    missing_columns = [col for col in REQUIRED_COLUMNS if col not in df.columns]
    if missing_columns:
        raise HTTPException(
            status_code=400,
            detail=f"Missing required columns: {', '.join(missing_columns)}",
        )

    total_rows = len(df)
    inserted_rows = 0
    updated_rows = 0
    failed_rows = 0
    errors = []

    for index, row in df.iterrows():
        try:
            link_id = normalize_value(row["link_id"])
            if not link_id:
                failed_rows += 1
                errors.append(f"Row {index + 2}: link_id is required")
                continue

            existing = db.execute(
                select(MicrowaveLink).where(MicrowaveLink.link_id == str(link_id))
            ).scalar_one_or_none()

            payload = {
                "ne_id": normalize_value(row["ne_id"]),
                "fe_id": normalize_value(row["fe_id"]),
                "link_id": str(link_id),
                "management_ip": normalize_value(row["management_ip"]),
                "web_protocol": normalize_value(row["web_protocol"]) or "http",
                "link_class": normalize_value(row["link_class"]),
                "is_active": normalize_bool(row["is_active"]),
                "vendor": normalize_value(row["vendor"]),
                "model": normalize_value(row["model"]),
                "type": normalize_value(row["type"]),
                "status": normalize_value(row["status"]),
            }

            if existing:
                for field, value in payload.items():
                    setattr(existing, field, value)
                updated_rows += 1
            else:
                db.add(MicrowaveLink(**payload))
                inserted_rows += 1

        except Exception as e:
            failed_rows += 1
            errors.append(f"Row {index + 2}: {str(e)}")

    db.commit()

    return {
        "file_name": file.filename,
        "total_rows": total_rows,
        "inserted_rows": inserted_rows,
        "updated_rows": updated_rows,
        "failed_rows": failed_rows,
        "errors": errors[:20],
    }