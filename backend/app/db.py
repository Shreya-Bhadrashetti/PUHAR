from datetime import datetime, timezone
from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, JSON, String, Text, create_engine
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, sessionmaker
from backend.app.core.config import get_settings


class Base(DeclarativeBase): pass


engine = create_engine(get_settings().database_url, future=True, connect_args={"check_same_thread": False} if get_settings().database_url.startswith("sqlite") else {})
SessionLocal = sessionmaker(engine, expire_on_commit=False)


class User(Base):
    __tablename__ = "users"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    username: Mapped[str] = mapped_column(String(100), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    role: Mapped[str] = mapped_column(String(30), default="charterer")


class Vessel(Base):
    __tablename__ = "vessels"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(200), unique=True)
    vessel_class: Mapped[str | None] = mapped_column(String(80))
    dwt: Mapped[float | None] = mapped_column(Float)
    loa_m: Mapped[float | None] = mapped_column(Float)
    beam_m: Mapped[float | None] = mapped_column(Float)
    draft_m: Mapped[float | None] = mapped_column(Float)
    latitude: Mapped[float | None] = mapped_column(Float)
    longitude: Mapped[float | None] = mapped_column(Float)


class Port(Base):
    __tablename__ = "ports"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(150), unique=True)
    max_draft_m: Mapped[float | None] = mapped_column(Float)
    max_loa_m: Mapped[float | None] = mapped_column(Float)
    max_beam_m: Mapped[float | None] = mapped_column(Float)
    berths: Mapped[int | None] = mapped_column(Integer)


class CargoOrder(Base):
    __tablename__ = "cargo_orders"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    commodity: Mapped[str] = mapped_column(String(100))
    origin_port: Mapped[str] = mapped_column(String(150))
    destination_port: Mapped[str] = mapped_column(String(150))
    quantity_mt: Mapped[float | None] = mapped_column(Float)


class VoyagePlan(Base):
    __tablename__ = "voyage_plans"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    vessel_id: Mapped[int | None] = mapped_column(ForeignKey("vessels.id"))
    origin_port: Mapped[str] = mapped_column(String(150))
    destination_port: Mapped[str] = mapped_column(String(150))
    status: Mapped[str] = mapped_column(String(40), default="active")


class AdvisorRun(Base):
    __tablename__ = "advisor_runs"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    input: Mapped[dict] = mapped_column(JSON)
    output: Mapped[dict] = mapped_column(JSON)
    reasons: Mapped[list] = mapped_column(JSON)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))


class RiskAlert(Base):
    __tablename__ = "risk_alerts"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    severity: Mapped[str] = mapped_column(String(30))
    message: Mapped[str] = mapped_column(Text)
    read: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))


class RateSnapshot(Base):
    __tablename__ = "rate_snapshots"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    route: Mapped[str] = mapped_column(String(200), index=True)
    vessel_class: Mapped[str] = mapped_column(String(80))
    rate: Mapped[float] = mapped_column(Float)
    observed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))


class SourceSnapshot(Base):
    __tablename__ = "source_snapshots"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    source_name: Mapped[str] = mapped_column(String(100), unique=True, index=True)
    payload: Mapped[list] = mapped_column(JSON)
    fetched_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
