from datetime import datetime
from typing import Any, Literal
from pydantic import BaseModel, ConfigDict, Field


class ServiceOutput(BaseModel):
    result: dict[str, Any]
    confidence: float = Field(ge=0, le=1)
    reasons: list[str]
    data_as_of: datetime | None = None


class VesselInput(BaseModel):
    name: str = "Vessel"
    vessel_class: str | None = None
    dwt: float | None = Field(default=None, ge=0)
    loa_m: float | None = Field(default=None, ge=0)
    beam_m: float | None = Field(default=None, ge=0)
    draft_m: float | None = Field(default=None, ge=0)
    lat: float | None = None
    lon: float | None = None


class ForecastInput(BaseModel):
    route: str
    vessel_class: str
    departure_date: datetime | None = None


class VesselOptimizationInput(BaseModel):
    vessel: VesselInput
    origin_port: str
    destination_port: str
    cargo_quantity_mt: float = Field(gt=0)


class PortFilterInput(BaseModel):
    vessel: VesselInput
    candidate_ports: list[str] = Field(min_length=1)


class BackhaulInput(BaseModel):
    destination_port: str
    origin_region: str


class RiskInput(BaseModel):
    vessel: VesselInput
    destination: str
    eta: datetime | None = None


class AdvisorRequest(BaseModel):
    vessel: VesselInput
    origin_region: str
    destination: str
    candidate_ports: list[str]
    route: str
    vessel_class: str
    departure_date: datetime | None = None
    eta: datetime | None = None
    origin_port: str | None = None
    cargo_quantity_mt: float | None = Field(default=None, gt=0)


class AdvisorResponse(BaseModel):
    forecast: ServiceOutput
    ports: ServiceOutput
    backhaul: ServiceOutput
    risk: ServiceOutput
    vessel_optimization: ServiceOutput | None = None
    recommendation: dict[str, Any]
    explainability: list[str]


class LoginRequest(BaseModel):
    username: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: Literal["bearer"] = "bearer"


class AlertResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    severity: str
    message: str
    read: bool
    created_at: datetime


class ErrorResponse(BaseModel):
    error: str
    detail: str | list[dict[str, Any]]
