from fastapi import APIRouter, Depends
from fastapi.concurrency import run_in_threadpool
from backend.app.adapters import BackhaulAdapter, ForecastAdapter, PortFilterAdapter, RiskAdapter
from backend.app.core.security import require_role
from backend.app.cache import cache
from backend.app.schemas.contracts import BackhaulInput, ForecastInput, PortFilterInput, RiskInput, ServiceOutput

router = APIRouter(tags=["models"])
_user = Depends(require_role("charterer", "admin"))

@router.post("/forecast", response_model=ServiceOutput)
async def forecast(payload: ForecastInput, _= _user):
    key = f"forecast:{payload.route}:{payload.vessel_class}"
    cached = cache.get(key)
    if cached: return ServiceOutput.model_validate(cached)
    output = await run_in_threadpool(ForecastAdapter().run, payload)
    cache.set(key, output.model_dump(mode="json"), 24 * 60 * 60)
    return output

@router.post("/ports/filter", response_model=ServiceOutput)
async def ports_filter(payload: PortFilterInput, _= _user): return await run_in_threadpool(PortFilterAdapter().run, payload)

@router.post("/backhaul/match", response_model=ServiceOutput)
async def backhaul_match(payload: BackhaulInput, _= _user): return await run_in_threadpool(BackhaulAdapter().run, payload)

@router.post("/risk/assess", response_model=ServiceOutput)
async def risk_assess(payload: RiskInput, _= _user):
    key = f"weather-risk:{payload.destination}:{payload.vessel.vessel_class}"
    cached = cache.get(key)
    if cached: return ServiceOutput.model_validate(cached)
    output = await run_in_threadpool(RiskAdapter().run, payload)
    cache.set(key, output.model_dump(mode="json"), 20 * 60)
    return output
