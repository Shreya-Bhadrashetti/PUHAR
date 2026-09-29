from datetime import datetime, timezone
import asyncio
from backend.app.adapters import ForecastAdapter, PortFilterAdapter, RiskAdapter
from backend.app.schemas.contracts import ForecastInput, PortFilterInput, RiskInput, VesselInput, VesselOptimizationInput
from backend.app.vessel_adapter import VesselOptimizationAdapter
from backend.services.risk_mitigation.engine import Cyclone, RiskData, TrackPoint

def test_shallow_port_is_filtered():
    out = PortFilterAdapter().run(PortFilterInput(vessel=VesselInput(draft_m=10), candidate_ports=["Kolkata/Haldia", "Paradip"]))
    assert out.result["viable_ports"] == ["Paradip"]
    assert out.result["constraint_source"].endswith("port_constraints.csv")
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

def test_forecast_adapter_uses_real_model():
    out = ForecastAdapter().run(ForecastInput(route="Australia-Paradip", vessel_class="Capesize"))
    assert out.result["status"] == "success"
    assert out.result["indicative_rate"] > 0

def test_forecast_reports_unsupported_market_without_fake_rate():
    out = ForecastAdapter().run(ForecastInput(route="Unknown-Nowhere", vessel_class="Panamax"))
    assert out.result["status"] == "benchmark_unavailable"
    assert "indicative_rate" not in out.result

def test_vessel_optimization_uses_cleaned_sources():
    out = VesselOptimizationAdapter().run(VesselOptimizationInput(vessel=VesselInput(vessel_class="Panamax", dwt=70000), origin_port="Hay Point / Dalrymple Bay", destination_port="Paradip", cargo_quantity_mt=50000))
    assert out.result["status"] == "success"
    assert "dataset_7_route_distances" in out.result["reference_sources"]["route"]

def test_vessel_optimization_does_not_infer_capacity_from_proxy_data():
    out = VesselOptimizationAdapter().run(VesselOptimizationInput(vessel=VesselInput(vessel_class="Panamax"), origin_port="Hay Point / Dalrymple Bay", destination_port="Paradip", cargo_quantity_mt=50000))
    assert out.result["status"] == "input_incomplete"

def test_vessel_optimization_reports_missing_congestion_or_fuel_data(monkeypatch):
    monkeypatch.setattr("backend.app.vessel_adapter.optimization_reference", lambda *_: (None, "No traffic history for Paradip."))
    out = VesselOptimizationAdapter().run(VesselOptimizationInput(vessel=VesselInput(vessel_class="Panamax", dwt=70000), origin_port="Hay Point / Dalrymple Bay", destination_port="Paradip", cargo_quantity_mt=50000))
    assert out.result["status"] == "reference_data_unavailable"
    assert "traffic" in out.reasons[0]

def test_forecast_route_handler_returns_adapter_contract():
    from backend.app.api.routes.models import forecast
    out = asyncio.run(forecast(ForecastInput(route="Australia-Paradip", vessel_class="Capesize"), None))
    assert out.result["status"] == "success"
