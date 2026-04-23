from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.core.database import get_db

router = APIRouter(prefix="/link-level", tags=["Link Level"])


FLOW_SQL = text(
    """
    SELECT
        sc.id,
        sc.sitea_id,
        sc.siteb_id,
        sc.link_id,
        sc.category_ne,
        sc.depth,
        sc.dependency,
        sc.pop_site,
        sc.child_site_connectivity,
        sc.child_site_name,
        sc.is_active,

        mlb.vendor,
        mlb.protocol,
        mlb.bandwidth,
        mlb.planning_capacity,
        mlb.status,
        mlb.site_name_s1,
        mlb.site_name_s2,
        mlb.site_name_s1_ip,
        mlb.site_name_s2_ip,
        mlb.receive_signal_dbm_s1,
        mlb.tx_power_dbm_s1,
        mlb.atpc_1_s1

    FROM site_connectivity sc
    LEFT JOIN microwave_link_budgets mlb
        ON sc.link_id = mlb.link_id
    WHERE sc.is_active = true
      AND (
        :search = ''
        OR LOWER(COALESCE(sc.child_site_name, '')) LIKE LOWER(:like_search)
        OR LOWER(COALESCE(sc.pop_site, '')) LIKE LOWER(:like_search)
        OR LOWER(COALESCE(sc.link_id, '')) LIKE LOWER(:like_search)
        OR LOWER(COALESCE(sc.sitea_id, '')) LIKE LOWER(:like_search)
        OR LOWER(COALESCE(sc.siteb_id, '')) LIKE LOWER(:like_search)
        OR LOWER(COALESCE(sc.category_ne, '')) LIKE LOWER(:like_search)
      )
    ORDER BY
        sc.pop_site ASC,
        sc.depth ASC,
        sc.child_site_connectivity ASC,
        sc.child_site_name ASC
    """
)


VIEW_SQL = text(
    """
    SELECT
        sc.id,
        sc.sitea_id,
        sc.siteb_id,
        sc.link_id,
        sc.category_ne,
        sc.depth,
        sc.dependency,
        sc.pop_site,
        sc.child_site_connectivity,
        sc.child_site_name,

        mlb.link_id AS budget_link_id,
        mlb.radio_file_name_s1,
        mlb.atpc_1_s1,
        mlb.tx_power_dbm_s1,
        mlb.vendor,
        mlb.site_name_s1,
        mlb.site_name_s2,
        mlb.revise,
        mlb.region,
        mlb.latitude_s1,
        mlb.longitude_s1,
        mlb.latitude_s2,
        mlb.longitude_s2,
        mlb.type,
        mlb.frequency_mhz,
        mlb.path_length_km,
        mlb.polarization,
        mlb.bandwidth,
        mlb.planning_capacity,
        mlb.protocol,
        mlb.site_name_s1_ip,
        mlb.site_name_s2_ip,
        mlb.site_name_s1_port,
        mlb.site_name_s2_port,
        mlb.receive_signal_dbm_s1,
        mlb.design_frequency_1_s1,
        mlb.design_frequency_1_s2,
        mlb.status,
        mlb.tr_antenna_diameter_s1,
        mlb.tr_antenna_diameter_s2,
        mlb.tr_antenna_height_s1,
        mlb.tr_antenna_height_s2,
        mlb.tower_height_s1,
        mlb.tower_height_s2,
        mlb.true_azimuth_s1,
        mlb.true_azimuth_s2,
        mlb.township,
        mlb.zone
    FROM site_connectivity sc
    LEFT JOIN microwave_link_budgets mlb
        ON sc.link_id = mlb.link_id
    WHERE sc.link_id = :link_id
    LIMIT 1
    """
)


def build_login_url(ip: str | None, protocol: str | None) -> str | None:
    if not ip:
        return None

    protocol_value = (protocol or "").strip().lower()

    if "https" in protocol_value:
        scheme = "https"
    elif "http" in protocol_value:
        scheme = "http"
    else:
        scheme = "http"

    return f"{scheme}://{ip}"


@router.get("")
def get_link_level(
    search: str = Query(default=""),
    db: Session = Depends(get_db),
):
    rows = db.execute(
        FLOW_SQL,
        {
            "search": search.strip(),
            "like_search": f"%{search.strip()}%",
        },
    ).mappings().all()

    items = []

    for row in rows:
        preferred_ip = row["site_name_s1_ip"] or row["site_name_s2_ip"]
        login_url = build_login_url(preferred_ip, row["protocol"])

        items.append(
            {
                "id": row["id"],
                "site_id": row["child_site_name"],
                "label": row["child_site_name"],
                "link_id": row["link_id"],
                "pop_site": row["pop_site"],
                "parent_site": row["siteb_id"],
                "connectivity_label": row["child_site_connectivity"],
                "depth": row["depth"],
                "dependency": row["dependency"],
                "category_ne": row["category_ne"],
                "sitea_id": row["sitea_id"],
                "siteb_id": row["siteb_id"],
                "vendor": row["vendor"],
                "status": row["status"],
                "capacity": row["planning_capacity"] or row["bandwidth"],
                "bandwidth": row["bandwidth"],
                "planning_capacity": row["planning_capacity"],
                "protocol": row["protocol"],
                "site_name_s1": row["site_name_s1"],
                "site_name_s2": row["site_name_s2"],
                "management_ip": preferred_ip,
                "ping_ip": preferred_ip,
                "login_url": login_url,
                "receive_signal_dbm_s1": row["receive_signal_dbm_s1"],
                "tx_power_dbm_s1": row["tx_power_dbm_s1"],
                "atpc_1_s1": row["atpc_1_s1"],
            }
        )

    return {"items": items}


@router.get("/view/{link_id}")
def get_link_level_view(link_id: str, db: Session = Depends(get_db)):
    row = db.execute(VIEW_SQL, {"link_id": link_id}).mappings().first()

    if not row:
        raise HTTPException(status_code=404, detail="Link not found")

    data = dict(row)
    preferred_ip = data.get("site_name_s1_ip") or data.get("site_name_s2_ip")
    data["management_ip"] = preferred_ip
    data["ping_ip"] = preferred_ip
    data["login_url"] = build_login_url(preferred_ip, data.get("protocol"))

    return data