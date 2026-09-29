from datetime import datetime, timezone
from backend.app.adapters import PortFilterAdapter, RiskAdapter
from backend.app.schemas.contracts import PortFilterInput, RiskInput, VesselInput
from backend.services.risk_mitigation.engine import Cyclone, RiskData, TrackPoint

def test_shallow_port_is_filtered():
    out = PortFilterAdapter().run(PortFilterInput(vessel=VesselInput(draft_m=15), candidate_ports=["Chennai", "Paradip"]))
    assert out.result["viable_ports"] == ["Paradip"]
    assert out.confidence > 0

def test_missing_position_is_explained():
    out = RiskAdapter().run(RiskInput(vessel=VesselInput(), destination="Paradip"))
    assert out.result["action"] == "UNKNOWN"
    assert out.reasons

def test_cyclone_is_a_mandatory_reroute_with_reason():
    now = datetime.now(timezone.utc)
    data = RiskData(cyclones=[Cyclone("fixture", [TrackPoint(19.0, 86.0, now, 120, "observed")], "fixture")])
    out = RiskAdapter(data_provider=lambda: data).run(RiskInput(vessel=VesselInput(lat=17.5, lon=85.5, draft_m=12), destination="Paradip"))
    assert out.result["mandatory"] is True
    assert any("Cyclone" in reason for reason in out.reasons)
