from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from freight_forecasting.freight_forecaster import (
    forecast_freight,
    check_freight_availability,
    map_physical_route,
)

from vessel_optimization.vessel_optimizer import optimize_vessel

from vessel_optimization.entry_timing import analyze_entry_timing


app = FastAPI(
    title="PUHAR Smart Charter API",
    description=(
        "Intelligent freight forecasting and vessel "
        "chartering backend"
    ),
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5175",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --------------------------------------------------
# REQUEST MODELS
# --------------------------------------------------

class FreightForecastRequest(BaseModel):

    market_route: str

    vessel_type: str

    days_ahead: int = Field(
        default=7,
        ge=1,
        le=30
    )


class VesselOptimizationRequest(BaseModel):

    cargo_quantity_mt: float = Field(
        gt=0
    )

    origin_port: str

    destination_port: str


class EntryTimingRequest(BaseModel):

    cargo_quantity_mt: float = Field(
        gt=0
    )

    origin_port: str

    destination_port: str


# --------------------------------------------------
# ROOT
# --------------------------------------------------

@app.get("/")
def root():

    return {
        "message":
            "PUHAR Smart Charter API is running",

        "status":
            "success"
    }


# --------------------------------------------------
# HEALTH
# --------------------------------------------------

@app.get("/health")
def health_check():

    return {
        "status":
            "healthy"
    }


# --------------------------------------------------
# FREIGHT FORECAST
# --------------------------------------------------

@app.post("/api/freight/forecast")
def freight_forecast(
    request: FreightForecastRequest
):

    result = forecast_freight(

        market_route=request.market_route,

        vessel_type=request.vessel_type,

        days_ahead=request.days_ahead

    )

    return result


# --------------------------------------------------
# FREIGHT MARKET AVAILABILITY
# --------------------------------------------------

@app.get("/api/freight/availability")
def freight_availability(
    market_route: str,
    vessel_type: str
):

    return check_freight_availability(

        market_route,

        vessel_type

    )


# --------------------------------------------------
# PHYSICAL ROUTE MAPPING
# --------------------------------------------------

@app.get("/api/freight/map-route")
def freight_map_route(
    origin_port: str,
    destination_port: str
):

    market_route = map_physical_route(

        origin_port,

        destination_port

    )

    if market_route is None:

        raise HTTPException(

            status_code=404,

            detail=(
                "No freight market mapping "
                "available for this route."
            )

        )

    return {

        "origin_port":
            origin_port,

        "destination_port":
            destination_port,

        "market_route":
            market_route

    }


# --------------------------------------------------
# VESSEL OPTIMIZATION
# --------------------------------------------------

@app.post("/api/vessel/optimize")
def vessel_optimization(
    request: VesselOptimizationRequest
):

    result = optimize_vessel(

        cargo_quantity_mt=
            request.cargo_quantity_mt,

        origin_port=
            request.origin_port,

        destination_port=
            request.destination_port

    )

    return result


# --------------------------------------------------
# 7-DAY ENTRY TIMING
# --------------------------------------------------

@app.post("/api/entry-timing")
def entry_timing(
    request: EntryTimingRequest
):

    result = analyze_entry_timing(

        cargo_quantity_mt=
            request.cargo_quantity_mt,

        origin_port=
            request.origin_port,

        destination_port=
            request.destination_port

    )

    return result