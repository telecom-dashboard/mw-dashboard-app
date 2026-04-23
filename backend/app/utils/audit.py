from __future__ import annotations

import json
from datetime import date, datetime
from decimal import Decimal
from typing import Any

from sqlalchemy.inspection import inspect as sqlalchemy_inspect
from sqlalchemy.orm import Session

from app.models.audit_log import AuditLog
from app.models.user import User


def serialize_value_for_audit(value: Any) -> Any:
    if value is None:
        return None

    if isinstance(value, (str, int, float, bool)):
        return value

    if isinstance(value, (datetime, date)):
        return value.isoformat()

    if isinstance(value, Decimal):
        return float(value)

    if isinstance(value, bytes):
        return value.decode("utf-8", errors="ignore")

    if isinstance(value, dict):
        return {
            str(key): serialize_value_for_audit(item_value)
            for key, item_value in value.items()
        }

    if isinstance(value, (list, tuple, set)):
        return [serialize_value_for_audit(item) for item in value]

    return str(value)


def model_to_audit_dict(
    instance: Any,
    *,
    exclude_fields: set[str] | None = None,
) -> dict[str, Any] | None:
    if instance is None:
        return None

    excluded = exclude_fields or set()
    result: dict[str, Any] = {}

    for column in sqlalchemy_inspect(instance.__class__).columns:
        field_name = column.key
        if field_name in excluded:
            continue

        raw_value = getattr(instance, field_name)
        if field_name.endswith("_json") and isinstance(raw_value, str):
            try:
                result[field_name[:-5]] = json.loads(raw_value)
                continue
            except Exception:
                pass

        result[field_name] = serialize_value_for_audit(raw_value)

    return result


def parse_audit_json(raw_value: str | None) -> dict[str, Any] | None:
    if not raw_value:
        return None

    try:
        parsed = json.loads(raw_value)
    except Exception:
        return {"raw": raw_value}

    if isinstance(parsed, dict):
        return parsed

    return {"value": parsed}


def create_audit_log(
    db: Session,
    *,
    table_name: str,
    record_id: int,
    action: str,
    current_user: User | None = None,
    old_values: dict[str, Any] | None = None,
    new_values: dict[str, Any] | None = None,
) -> AuditLog:
    audit_log = AuditLog(
        table_name=table_name,
        record_id=record_id,
        action=action,
        changed_by=current_user.id if current_user else None,
        old_values=json.dumps(old_values) if old_values is not None else None,
        new_values=json.dumps(new_values) if new_values is not None else None,
    )
    db.add(audit_log)
    return audit_log
