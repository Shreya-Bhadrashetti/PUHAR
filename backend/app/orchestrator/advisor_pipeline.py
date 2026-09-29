import asyncio
from fastapi.concurrency import run_in_threadpool
from backend.app.adapters import BackhaulAdapter, ForecastAdapter, PortFilterAdapter, RiskAdapter
from backend.app.vessel_adapter import VesselOptimizationAdapter
from backend.app.db import AdvisorRun, Base, SessionLocal, engine
from backend.app.schemas.contracts import AdvisorRequest, AdvisorResponse, BackhaulInput, ForecastInput, PortFilterInput, RiskInput, VesselOptimizationInput


class AdvisorPipeline:
    def __init__(self, forecast=None, ports=None, backhaul=None, risk=None, vessel_optimization=None):
        self.forecast, self.ports, self.backhaul, self.risk, self.vessel_optimization = forecast or ForecastAdapter(), ports or PortFilterAdapter(), backhaul or BackhaulAdapter(), risk or RiskAdapter(), vessel_optimization or VesselOptimizationAdapter()

    async def run(self, request: AdvisorRequest) -> AdvisorResponse:
        forecast_task = run_in_threadpool(self.forecast.run, ForecastInput(route=request.route, vessel_class=request.vessel_class, departure_date=request.departure_date))
        ports_task = run_in_threadpool(self.ports.run, PortFilterInput(vessel=request.vessel, candidate_ports=request.candidate_ports))
        backhaul_task = run_in_threadpool(self.backhaul.run, BackhaulInput(destination_port=request.destination, origin_region=request.origin_region))
        risk_task = run_in_threadpool(self.risk.run, RiskInput(vessel=request.vessel, destination=request.destination, eta=request.eta))
        tasks = [forecast_task, ports_task, backhaul_task, risk_task]
        if request.origin_port and request.cargo_quantity_mt:
            tasks.append(run_in_threadpool(self.vessel_optimization.run, VesselOptimizationInput(vessel=request.vessel, origin_port=request.origin_port, destination_port=request.destination, cargo_quantity_mt=request.cargo_quantity_mt)))
        results = await asyncio.gather(*tasks)
        forecast, ports, backhaul, risk = results[:4]
        vessel_optimization = results[4] if len(results) == 5 else None
        mandatory = risk.result.get("mandatory", False)
        recommendation = {"destination": risk.result.get("recommended_port") if mandatory else request.destination, "mandatory_reroute": mandatory, "viable_ports": ports.result.get("viable_ports", [])}
        reasons = forecast.reasons + ports.reasons + backhaul.reasons + risk.reasons + (vessel_optimization.reasons if vessel_optimization else [])
        output = AdvisorResponse(forecast=forecast, ports=ports, backhaul=backhaul, risk=risk, vessel_optimization=vessel_optimization, recommendation=recommendation, explainability=reasons)
        # Supports worker execution as well as the FastAPI lifespan startup hook.
        Base.metadata.create_all(engine)
        with SessionLocal() as session:
            session.add(AdvisorRun(input=request.model_dump(mode="json"), output=output.model_dump(mode="json"), reasons=output.explainability)); session.commit()
        return output
