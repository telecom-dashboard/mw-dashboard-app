from __future__ import annotations

import io
import json
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from openpyxl import Workbook
from sqlalchemy import String, asc, cast, desc, func, or_
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.audit_log import AuditLog
from app.models.user import User
from app.routers.auth import require_admin
from app.schemas.audit_log import AuditLogRead
from app.utils.audit import parse_audit_json

router = APIRouter(prefix="/audit-logs", tags=["audit-logs"])

ALLOWED_SORT_FIELDS = {
    "id": AuditLog.id,
    "table_name": AuditLog.table_name,
    "record_id": AuditLog.record_id,
    "action": AuditLog.action,
    "changed_by": AuditLog.changed_by,
    "changed_at": AuditLog.changed_at,
}


def serialize_audit_log(item: AuditLog, changed_by_username: str | None = None) -> AuditLogRead:
    return AuditLogRead(
        id=item.id,
        table_name=item.table_name,
        record_id=item.record_id,
        action=item.action,
        changed_by=item.changed_by,
        changed_by_username=changed_by_username,
        old_values=parse_audit_json(item.old_values),
        new_values=parse_audit_json(item.new_values),
        changed_at=item.changed_at,
    )


def build_filtered_query(
    db: Session,
    *,
    search: str = "",
    action: str = "",
    table_name: str = "",
    changed_from: str = "",
    changed_to: str = "",
):
    query = db.query(AuditLog, User.username.label("changed_by_username")).outerjoin(
        User, AuditLog.changed_by == User.id
    )

    normalized_search = search.strip()
    if normalized_search:
        pattern = f"%{normalized_search}%"
        query = query.filter(
            or_(
                AuditLog.table_name.ilike(pattern),
                AuditLog.action.ilike(pattern),
                cast(AuditLog.record_id, String).ilike(pattern),
                cast(AuditLog.changed_by, String).ilike(pattern),
                User.username.ilike(pattern),
                AuditLog.old_values.ilike(pattern),
                AuditLog.new_values.ilike(pattern),
            )
        )

    normalized_action = action.strip().lower()
    if normalized_action:
        query = query.filter(AuditLog.action == normalized_action)

    normalized_table = table_name.strip().lower()
    if normalized_table:
        query = query.filter(func.lower(AuditLog.table_name) == normalized_table)

    if changed_from.strip():
        try:
            from_dt = datetime.fromisoformat(changed_from.strip())
        except ValueError as exc:
            raise HTTPException(status_code=400, detail="Invalid changed_from datetime") from exc
        query = query.filter(AuditLog.changed_at >= from_dt)

    if changed_to.strip():
        try:
            to_dt = datetime.fromisoformat(changed_to.strip())
        except ValueError as exc:
            raise HTTPException(status_code=400, detail="Invalid changed_to datetime") from exc
        query = query.filter(AuditLog.changed_at <= to_dt)

    return query


@router.get("/summary")
def get_audit_log_summary(
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    total_events = db.query(func.count(AuditLog.id)).scalar() or 0
    create_events = (
        db.query(func.count(AuditLog.id))
        .filter(AuditLog.action == "create")
        .scalar()
        or 0
    )
    update_events = (
        db.query(func.count(AuditLog.id))
        .filter(AuditLog.action == "update")
        .scalar()
        or 0
    )
    delete_events = (
        db.query(func.count(AuditLog.id))
        .filter(AuditLog.action.in_(["delete", "bulk_delete", "delete_all"]))
        .scalar()
        or 0
    )
    import_events = (
        db.query(func.count(AuditLog.id))
        .filter(AuditLog.action == "import")
        .scalar()
        or 0
    )
    admins_involved = (
        db.query(func.count(func.distinct(AuditLog.changed_by)))
        .filter(AuditLog.changed_by.isnot(None))
        .scalar()
        or 0
    )

    return {
        "total_events": total_events,
        "create_events": create_events,
        "update_events": update_events,
        "delete_events": delete_events,
        "import_events": import_events,
        "admins_involved": admins_involved,
    }


@router.get("")
def list_audit_logs(
    search: str = Query(default=""),
    action: str = Query(default=""),
    table_name: str = Query(default=""),
    changed_from: str = Query(default=""),
    changed_to: str = Query(default=""),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=10, ge=1, le=500),
    sort_by: str = Query(default="changed_at"),
    sort_order: str = Query(default="desc"),
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    query = build_filtered_query(
        db,
        search=search,
        action=action,
        table_name=table_name,
        changed_from=changed_from,
        changed_to=changed_to,
    )

    total = query.count()
    sort_column = ALLOWED_SORT_FIELDS.get(sort_by, AuditLog.changed_at)
    ordering = desc(sort_column) if sort_order.lower() == "desc" else asc(sort_column)
    rows = query.order_by(ordering).offset((page - 1) * page_size).limit(page_size).all()

    return {
        "items": [
            serialize_audit_log(item, changed_by_username).model_dump()
            for item, changed_by_username in rows
        ],
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": (total + page_size - 1) // page_size if page_size else 1,
    }


@router.post("/bulk-delete")
def bulk_delete_audit_logs(
    payload: dict[str, list[int]],
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    ids = payload.get("ids") or []
    if not ids:
        raise HTTPException(status_code=400, detail="No IDs provided")

    deleted_count = (
        db.query(AuditLog).filter(AuditLog.id.in_(ids)).delete(synchronize_session=False)
    )
    db.commit()
    return {"message": "Selected audit logs deleted successfully", "deleted_count": deleted_count}


@router.get("/export/excel")
def export_audit_logs_excel(
    search: str = Query(default=""),
    action: str = Query(default=""),
    table_name: str = Query(default=""),
    changed_from: str = Query(default=""),
    changed_to: str = Query(default=""),
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    query = build_filtered_query(
        db,
        search=search,
        action=action,
        table_name=table_name,
        changed_from=changed_from,
        changed_to=changed_to,
    )
    rows = query.order_by(desc(AuditLog.changed_at)).all()

    workbook = Workbook()
    sheet = workbook.active
    sheet.title = "Audit Logs"
    sheet.append(
        [
            "ID",
            "Table",
            "Record ID",
            "Action",
            "Admin ID",
            "Admin Username",
            "Timestamp",
            "Old Values",
            "New Values",
        ]
    )

    for item, changed_by_username in rows:
        sheet.append(
            [
                item.id,
                item.table_name,
                item.record_id,
                item.action,
                item.changed_by,
                changed_by_username,
                item.changed_at.isoformat() if item.changed_at else None,
                json.dumps(parse_audit_json(item.old_values), indent=2)
                if item.old_values
                else None,
                json.dumps(parse_audit_json(item.new_values), indent=2)
                if item.new_values
                else None,
            ]
        )

    output = io.BytesIO()
    workbook.save(output)
    output.seek(0)

    return StreamingResponse(
        output,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=audit_logs.xlsx"},
    )


@router.post("/export/selected-excel")
def export_selected_audit_logs_excel(
    payload: dict[str, list[int]],
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    ids = payload.get("ids") or []
    if not ids:
        raise HTTPException(status_code=400, detail="No selected IDs provided")

    rows = (
        db.query(AuditLog, User.username.label("changed_by_username"))
        .outerjoin(User, AuditLog.changed_by == User.id)
        .filter(AuditLog.id.in_(ids))
        .order_by(desc(AuditLog.changed_at))
        .all()
    )

    workbook = Workbook()
    sheet = workbook.active
    sheet.title = "Selected Audit Logs"
    sheet.append(
        [
            "ID",
            "Table",
            "Record ID",
            "Action",
            "Admin ID",
            "Admin Username",
            "Timestamp",
            "Old Values",
            "New Values",
        ]
    )

    for item, changed_by_username in rows:
        sheet.append(
            [
                item.id,
                item.table_name,
                item.record_id,
                item.action,
                item.changed_by,
                changed_by_username,
                item.changed_at.isoformat() if item.changed_at else None,
                json.dumps(parse_audit_json(item.old_values), indent=2)
                if item.old_values
                else None,
                json.dumps(parse_audit_json(item.new_values), indent=2)
                if item.new_values
                else None,
            ]
        )

    output = io.BytesIO()
    workbook.save(output)
    output.seek(0)

    return StreamingResponse(
        output,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={
            "Content-Disposition": "attachment; filename=selected_audit_logs.xlsx"
        },
    )


@router.delete("/{log_id}")
def delete_audit_log(
    log_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    item = db.get(AuditLog, log_id)
    if not item:
        raise HTTPException(status_code=404, detail="Audit log not found")

    db.delete(item)
    db.commit()
    return {"message": "Audit log deleted successfully"}
