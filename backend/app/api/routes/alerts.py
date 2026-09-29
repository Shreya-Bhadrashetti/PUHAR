from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect
from backend.app.alerts import alert_hub
from backend.app.core.security import require_role
from backend.app.db import RiskAlert, SessionLocal
from backend.app.schemas.contracts import AlertResponse

router = APIRouter(tags=["alerts"])

@router.get("/alerts", response_model=list[AlertResponse])
def alerts(_=Depends(require_role("charterer", "admin"))):
    with SessionLocal() as session: return session.query(RiskAlert).order_by(RiskAlert.created_at.desc()).all()

@router.websocket("/ws/alerts")
async def websocket_alerts(socket: WebSocket):
    await alert_hub.connect(socket)
    try:
        while True: await socket.receive_text()
    except WebSocketDisconnect: alert_hub.disconnect(socket)
