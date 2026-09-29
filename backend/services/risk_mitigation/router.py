"""
FastAPI router for the Risk Mitigation service.

In backend/main.py add:
    from services.risk_mitigation.router import router as risk_router
    app.include_router(risk_router)

Endpoints:
    POST /risk/assess   {"lat":15.0,"lon":85.5,"destination":"Paradip","draft_m":12.5}
    GET  /risk/status

Risk data refreshes in a background thread every REFRESH_SECONDS (the AIS listen window
alone takes ~4 minutes), so /risk/assess answers instantly from the latest snapshot.
"""
import threading
import time
from datetime import datetime, timezone
from dataclasses import asdict
from datetime import datetime, timezone
from typing import Callable, Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from . import engine as rm
from typing import Any

STATE: dict[str, Any] = {
    "data": None,
    "updated": None,
}

REFRESH_SECONDS = 600
STATE = {"data": None, "updated": None, "started": False}
_LOCK = threading.Lock()

# Plug in the port-constraint filter (draft / LOA / beam) here when it exists:
#   from services.port_constraints import is_port_compatible
#   COMPAT = is_port_compatible
COMPAT: Optional[Callable[[rm.Vessel, rm.Port], bool]] = None

router = APIRouter(prefix="/risk", tags=["risk-mitigation"])


def _refresh_loop() -> None:
    while True:
        try:
            STATE["data"] = rm.gather(list(rm.PORTS.values()))
            STATE["updated"] = datetime.now(timezone.utc).isoformat()
        except Exception as e:
            # Keep the loop alive even if refresh fails
            print("risk refresh failed:", e)

        time.sleep(REFRESH_SECONDS)


def start_risk_refresh() -> None:
    """Idempotent. Called lazily on first request; you may also call it from app startup."""
    with _LOCK:
        if STATE["started"]:
            return
        STATE["started"] = True
        threading.Thread(target=_refresh_loop, daemon=True, name="risk-refresh").start()


class AssessRequest(BaseModel):
    lat: float
    lon: float
    destination: str
    draft_m: Optional[float] = None
    eta: Optional[str] = None
    vessel_name: str = "Vessel"


@router.post("/assess")
def assess(req: AssessRequest):
    start_risk_refresh()
    if req.destination not in rm.PORTS:
        raise HTTPException(400, f"Unknown port. Choose from {list(rm.PORTS)}")
    if STATE["data"] is None:
        raise HTTPException(503, "Risk data is warming up, retry shortly")
    vessel = rm.Vessel(req.lat, req.lon, req.draft_m,
                       datetime.fromisoformat(req.eta) if req.eta else None, req.vessel_name)
    return asdict(rm.assess_voyage(vessel, req.destination, STATE["data"], is_port_compatible=COMPAT))


@router.get("/status")
def status():
    start_risk_refresh()
    d = STATE["data"]
    return {"last_refresh_utc": STATE["updated"],
            "active_cyclones": [c.name for c in d.cyclones] if d else None,
            "data_gaps": d.gaps if d else None}