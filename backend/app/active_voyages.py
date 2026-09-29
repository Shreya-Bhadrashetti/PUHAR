"""Periodic risk checks for persisted active voyage plans."""
import asyncio

from backend.app.adapters import RiskAdapter
from backend.app.alerts import alert_hub
from backend.app.db import RiskAlert, SessionLocal, Vessel, VoyagePlan
from backend.app.schemas.contracts import RiskInput, VesselInput


async def check_active_voyages() -> None:
    with SessionLocal() as session:
        voyages = session.query(VoyagePlan).filter_by(status="active").all()
        for voyage in voyages:
            vessel = session.get(Vessel, voyage.vessel_id) if voyage.vessel_id else None
            if not vessel:
                continue
            output = RiskAdapter().run(RiskInput(vessel=VesselInput(name=vessel.name, draft_m=vessel.draft_m, lat=vessel.latitude, lon=vessel.longitude), destination=voyage.destination_port))
            if not output.result.get("mandatory"):
                continue
            alert = RiskAlert(severity="red", message="; ".join(output.reasons))
            session.add(alert); session.commit(); session.refresh(alert)
            await alert_hub.broadcast({"id": alert.id, "severity": alert.severity, "message": alert.message, "read": alert.read, "created_at": alert.created_at.isoformat()})
