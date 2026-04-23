import platform
import re
import subprocess

from fastapi import APIRouter, Depends, HTTPException

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
    output = (result.stdout or "") + "\n" + (result.stderr or "")

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
        time_match = re.search(
            r"Minimum = (\d+)ms, Maximum = (\d+)ms, Average = (\d+)ms",
            output,
        )

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
        packet_match = re.search(
            r"(\d+) packets transmitted, (\d+) received, .*?(\d+(?:\.\d+)?)% packet loss",
            output,
        )
        time_match = re.search(
            r"min/avg/max(?:/mdev)? = (\d+(?:\.\d+)?)/(\d+(?:\.\d+)?)/(\d+(?:\.\d+)?)",
            output,
        )

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


@router.get("/ping")
def ping_direct(
    host: str | None = None,
    ip: str | None = None,
    current_user: User = Depends(require_client_or_admin),
):
    target = (host or ip or "").strip()

    if not target:
        raise HTTPException(status_code=400, detail="host or ip is required")

    ping_result = run_ping(target)

    return {
        "ip_address": target,
        "reachable": ping_result["reachable"],
        "sent": ping_result["sent"],
        "received": ping_result["received"],
        "packet_loss": ping_result["packet_loss"],
        "min_ms": ping_result["min_ms"],
        "avg_ms": ping_result["avg_ms"],
        "max_ms": ping_result["max_ms"],
        "error_message": ping_result["error_message"],
        "raw_output": ping_result["raw_output"],
    }
