from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, HTTPException
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi import Limiter
from slowapi.util import get_remote_address

from backend.app.api.routes import advisor, alerts, auth, models
from backend.app.core.config import get_settings, ROOT_DIR
from backend.app.db import Base, engine
from backend.app.ingestion.scheduler import build_scheduler
from backend.app.active_voyages import check_active_voyages

try:
    from backend.freight_forecasting.freight_forecaster import (
        forecast_freight,
        check_freight_availability,
        map_physical_route,
    )
    from backend.vessel_optimization.vessel_optimizer import optimize_vessel
    from backend.vessel_optimization.entry_timing import analyze_entry_timing
except ImportError:
    from freight_forecasting.freight_forecaster import (
        forecast_freight,
        check_freight_availability,
        map_physical_route,
    )
    from vessel_optimization.vessel_optimizer import optimize_vessel
    from vessel_optimization.entry_timing import analyze_entry_timing


@asynccontextmanager
async def lifespan(_: FastAPI):
    Base.metadata.create_all(engine)
    scheduler = build_scheduler()
    scheduler.add_job(
        lambda: __import__("asyncio").run(check_active_voyages()),
        "interval",
        minutes=20,
        id="active-voyage-risk",
        replace_existing=True,
    )
    scheduler.start()
    try:
        yield
    finally:
        scheduler.shutdown(wait=False)


limiter = Limiter(
    key_func=get_remote_address,
    default_limits=[f"{get_settings().rate_limit_per_minute}/minute"],
)

app = FastAPI(
    title=get_settings().app_name,
    description="Intelligent freight forecasting, vessel optimization, and chartering advisory API",
    version="1.0.0",
    lifespan=lifespan,
)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=get_settings().cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(models.router)
app.include_router(advisor.router)
app.include_router(alerts.router)


@app.exception_handler(Exception)
async def unexpected_error(_: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={
            "error": "internal_error",
            "detail": str(exc) if get_settings().environment == "development" else "Unexpected server error",
        },
    )


@app.exception_handler(RequestValidationError)
async def validation_error(_: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=422,
        content={"error": "validation_error", "detail": exc.errors()},
    )


# --------------------------------------------------
# REQUEST MODELS
# --------------------------------------------------

class FreightForecastRequest(BaseModel):
    market_route: str
    vessel_type: str
    days_ahead: int = Field(default=7, ge=1, le=30)


class VesselOptimizationRequest(BaseModel):
    cargo_quantity_mt: float = Field(gt=0)
    origin_port: str
    destination_port: str


class EntryTimingRequest(BaseModel):
    cargo_quantity_mt: float = Field(gt=0)
    origin_port: str
    destination_port: str


# --------------------------------------------------
# BASE & HEALTH ENDPOINTS
# --------------------------------------------------

@app.get("/health")
async def health():
    return {"status": "ok", "app": get_settings().app_name}


@app.get("/api/health")
async def api_health():
    return {"status": "ok", "app": get_settings().app_name}


# --------------------------------------------------
# DIRECT ML & OPTIMIZATION ENDPOINTS
# --------------------------------------------------

@app.post("/api/freight/forecast")
def direct_freight_forecast(request: FreightForecastRequest):
    return forecast_freight(
        market_route=request.market_route,
        vessel_type=request.vessel_type,
        days_ahead=request.days_ahead,
    )


@app.get("/api/freight/availability")
def direct_freight_availability(market_route: str, vessel_type: str):
    return check_freight_availability(market_route, vessel_type)


@app.get("/api/freight/map-route")
def direct_freight_map_route(origin_port: str, destination_port: str):
    market_route = map_physical_route(origin_port, destination_port)
    if market_route is None:
        raise HTTPException(
            status_code=404,
            detail="No freight market mapping available for this route.",
        )
    return {
        "origin_port": origin_port,
        "destination_port": destination_port,
        "market_route": market_route,
    }


@app.post("/api/vessel/optimize")
def direct_vessel_optimization(request: VesselOptimizationRequest):
    return optimize_vessel(
        cargo_quantity_mt=request.cargo_quantity_mt,
        origin_port=request.origin_port,
        destination_port=request.destination_port,
    )


@app.post("/api/entry-timing")
def direct_entry_timing(request: EntryTimingRequest):
    return analyze_entry_timing(
        cargo_quantity_mt=request.cargo_quantity_mt,
        origin_port=request.origin_port,
        destination_port=request.destination_port,
    )


# --------------------------------------------------
# SERVE FRONTEND BUILD IN PRODUCTION (ONE LINK)
# --------------------------------------------------
frontend_dist = ROOT_DIR / "frontend" / "dist"
if frontend_dist.exists() and (frontend_dist / "index.html").exists():
    from fastapi.staticfiles import StaticFiles
    from fastapi.responses import FileResponse

    assets_dir = frontend_dist / "assets"
    if assets_dir.exists():
        app.mount("/assets", StaticFiles(directory=str(assets_dir)), name="frontend_assets")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        if full_path.startswith("api/") or full_path in ("docs", "redoc", "openapi.json", "health"):
            raise HTTPException(status_code=404, detail="Not Found")
        target = frontend_dist / full_path
        if target.is_file():
            return FileResponse(target)
        return FileResponse(frontend_dist / "index.html")
else:
    @app.get("/")
    def root():
        return {
            "message": "PUHAR Smart Charter API is running",
            "status": "success",
        }

