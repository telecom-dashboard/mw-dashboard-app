import platform
import re
import subprocess
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.ping_log import PingLog
from app.models.site import Site
from app.models.user import User
from app.routers.auth import require_client_or_admin

router = APIRouter(prefix="/tools", tags=["tools"])


def run_ping(ip: str):
    system_name = platform.system().lower()

    if system_name == "windows":
        cmd = ["ping", "-n", "4", ip]
    else:
        cmd = ["ping", "-c", "4", ip]

    result = subprocess.run(cmd, capture_output=True, text=True, timeout=15)
    output = result.stdout + "\n" + result.stderr

    reachable = False
    sent = None
    received = None
    packet_loss = None
    min_ms = None
    avg_ms = None
    max_ms = None
    error_message = None

    if system_name == "windows":
        sent_match = re.search(r"Sent = (\d+)", output)
        received_match = re.search(r"Received = (\d+)", output)
        loss_match = re.search(r"Lost = \d+ \((\d+)% loss\)", output)
        time_match = re.search(r"Minimum = (\d+)ms, Maximum = (\d+)ms, Average = (\d+)ms", output)

        if sent_match:
            sent = int(sent_match.group(1))
        if received_match:
            received = int(received_match.group(1))
        if loss_match:
            packet_loss = float(loss_match.group(1))
        if time_match:
            min_ms = float(time_match.group(1))
            max_ms = float(time_match.group(2))
            avg_ms = float(time_match.group(3))

    else:
        packet_match = re.search(r"(\d+) packets transmitted, (\d+) received, .*?(\d+(?:\.\d+)?)% packet loss", output)
        time_match = re.search(r"min/avg/max(?:/mdev)? = (\d+(?:\.\d+)?)/(\d+(?:\.\d+)?)/(\d+(?:\.\d+)?)", output)

        if packet_match:
            sent = int(packet_match.group(1))
            received = int(packet_match.group(2))
            packet_loss = float(packet_match.group(3))

        if time_match:
            min_ms = float(time_match.group(1))
            avg_ms = float(time_match.group(2))
            max_ms = float(time_match.group(3))

    reachable = bool(received and received > 0)

    if not reachable:
        error_message = "Host unreachable or request timed out"

    return {
        "reachable": reachable,
        "sent": sent,
        "received": received,
        "packet_loss": packet_loss,
        "min_ms": min_ms,
        "avg_ms": avg_ms,
        "max_ms": max_ms,
        "error_message": error_message,
        "raw_output": output,
    }


@router.post("/ping/site/{site_id}")
def ping_site(
    site_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_client_or_admin),
):
    site = db.execute(
        select(Site).where(Site.id == site_id)
    ).scalar_one_or_none()

    if not site:
        raise HTTPException(status_code=404, detail="Site not found")

    if not site.management_ip:
        raise HTTPException(status_code=400, detail="Site has no management IP")

    ping_result = run_ping(site.management_ip)

    ping_log = PingLog(
        site_id=site.id,
        requested_by=current_user.id,
        ip_address=site.management_ip,
        reachable=ping_result["reachable"],
        sent=ping_result["sent"],
        received=ping_result["received"],
        packet_loss=ping_result["packet_loss"],
        min_ms=ping_result["min_ms"],
        avg_ms=ping_result["avg_ms"],
        max_ms=ping_result["max_ms"],
        error_message=ping_result["error_message"],
        raw_output=ping_result["raw_output"],
        created_at=datetime.utcnow(),
    )

    db.add(ping_log)
    db.commit()
    db.refresh(ping_log)

    return {
        "id": ping_log.id,
        "site_id": ping_log.site_id,
        "ip_address": ping_log.ip_address,
        "reachable": ping_log.reachable,
        "sent": ping_log.sent,
        "received": ping_log.received,
        "packet_loss": ping_log.packet_loss,
        "min_ms": ping_log.min_ms,
        "avg_ms": ping_log.avg_ms,
        "max_ms": ping_log.max_ms,
        "error_message": ping_log.error_message,
        "raw_output": ping_log.raw_output,
        "created_at": ping_log.created_at,
    }

@router.get("/ping/history/{site_id}")
def get_ping_history(
    site_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_client_or_admin),
):
    site = db.execute(
        select(Site).where(Site.id == site_id)
    ).scalar_one_or_none()

    if not site:
        raise HTTPException(status_code=404, detail="Site not found")

    history = db.execute(
        select(PingLog)
        .where(PingLog.site_id == site_id)
        .order_by(PingLog.created_at.desc())
        .limit(10)
    ).scalars().all()

    return [
        {
            "id": item.id,
            "site_id": item.site_id,
            "ip_address": item.ip_address,
            "reachable": item.reachable,
            "sent": item.sent,
            "received": item.received,
            "packet_loss": item.packet_loss,
            "min_ms": item.min_ms,
            "avg_ms": item.avg_ms,
            "max_ms": item.max_ms,
            "error_message": item.error_message,
            "created_at": item.created_at,
        }
        for item in history
    ]