"""Stable API-facing adapters.  Model implementation details stay out of routes."""
from datetime import datetime, timezone
from pathlib import Path
from typing import Callable
from backend.app.schemas.contracts import BackhaulInput, ForecastInput, PortFilterInput, RiskInput, ServiceOutput


class ForecastAdapter:
    def run(self, request: ForecastInput) -> ServiceOutput:
        # This adapter is deliberately the only place that a future forecasting model is wired in.
        return ServiceOutput(result={"route": request.route, "best_charter_window": request.departure_date, "indicative_rate": None}, confidence=0.0, reasons=["Forecast model has not yet been connected."], data_as_of=None)


class PortFilterAdapter:
    _limits = {
        "Paradip": {"draft": 17.1, "loa": 289, "beam": 50},
        "Dhamra": {"draft": 18.5, "loa": 300, "beam": 55},
        "Visakhapatnam": {"draft": 16.5, "loa": 300, "beam": 50},
        "Chennai": {"draft": 14.0, "loa": 290, "beam": 48},
    }

    def run(self, request: PortFilterInput) -> ServiceOutput:
        viable, rejected = [], []
        v = request.vessel
        for port in request.candidate_ports:
            limits = self._limits.get(port)
            if not limits:
                viable.append(port)
                continue
            failures = [name for value, name in ((v.draft_m, "draft"), (v.loa_m, "LOA"), (v.beam_m, "beam")) if value is not None and value > limits[{"draft": "draft", "LOA": "loa", "beam": "beam"}[name]]]
            (rejected if failures else viable).append({"port": port, "reasons": failures} if failures else port)
        reasons = [f"{item['port']} rejected: exceeds {', '.join(item['reasons'])} limit." for item in rejected]
        if not reasons: reasons = ["All supplied ports pass the available physical-limit checks."]
        return ServiceOutput(result={"viable_ports": viable, "rejected_ports": rejected}, confidence=0.8, reasons=reasons, data_as_of=datetime.now(timezone.utc))


class BackhaulAdapter:
    def run(self, request: BackhaulInput) -> ServiceOutput:
        from backend.services.backhaul_matcher import find_backhaul_match
        try:
            matches = find_backhaul_match(request.destination_port, request.origin_region)
        except Exception as exc:
            return ServiceOutput(result={"matches": []}, confidence=0.0, reasons=[f"Backhaul data unavailable: {exc}"], data_as_of=None)
        return ServiceOutput(result={"matches": matches}, confidence=0.75 if matches else 0.4, reasons=["Matches use documented export commodities at the destination port." if matches else "No documented return cargo matches the requested origin region."], data_as_of=datetime.now(timezone.utc))


class RiskAdapter:
    def __init__(self, data_provider: Callable | None = None): self.data_provider = data_provider

    def run(self, request: RiskInput) -> ServiceOutput:
        from backend.services.risk_mitigation import engine as risk
        if request.vessel.lat is None or request.vessel.lon is None:
            return ServiceOutput(result={"action": "UNKNOWN"}, confidence=0.0, reasons=["Vessel latitude and longitude are required for risk assessment."], data_as_of=None)
        if request.destination not in risk.PORTS:
            return ServiceOutput(result={"action": "UNKNOWN"}, confidence=0.0, reasons=[f"Unknown risk-model port: {request.destination}."], data_as_of=None)
        if self.data_provider:
            data = self.data_provider()
        else:
            # Reuse the existing service's asynchronous refresh cache.  A cold start
            # remains explicitly unknown rather than being represented as safe.
            from backend.services.risk_mitigation import router as live_risk
            live_risk.start_risk_refresh()
            data = live_risk.STATE["data"] or risk.RiskData(gaps=["Live weather/cyclone snapshot is warming up; retry shortly."])
        decision = risk.assess_voyage(risk.Vessel(request.vessel.lat, request.vessel.lon, request.vessel.draft_m, request.eta, request.vessel.name), request.destination, data, auto_apply=None)
        result = {"action": decision.action, "mandatory": decision.action == "AUTO_REROUTE", "recommended_port": decision.recommended_port, "alternates": [a.port for a in decision.alternates], "data_gaps": decision.data_gaps}
        reasons = [reason.headline for reason in decision.reasons] or ["No active model risk trigger was found."]
        return ServiceOutput(result=result, confidence=0.9 if not decision.data_gaps else 0.45, reasons=reasons, data_as_of=datetime.now(timezone.utc))
