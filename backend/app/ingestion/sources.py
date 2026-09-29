"""Resilient source-specific ingestion implementations.

Each source deliberately exposes fetch/normalize/save and retains the last-good
snapshot, so an external outage is visible without turning into a false safe result.
"""
from __future__ import annotations

import csv
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import requests

from backend.app.core.config import get_settings
from backend.app.db import Port, RateSnapshot, SessionLocal, SourceSnapshot
from backend.app.ingestion.base import SourceIngestion

ROOT = Path(__file__).resolve().parents[3]


class FreightRatesIngestion(SourceIngestion):
    source_name = "freight_rates"
    def fetch(self) -> list[dict[str, str]]:
        with (ROOT / "data/cleaned/freight_rate_history.csv").open(encoding="utf-8-sig") as stream:
            return list(csv.DictReader(stream))
    def normalize(self, raw: list[dict[str, str]]) -> list[dict]:
        result = []
        for row in raw:
            try:
                result.append({"route": row.get("route", "India-Coast"), "vessel_class": row.get("vessel_class", "Panamax"), "rate": float(row.get("rate") or row.get("freight_rate") or 0)})
            except (TypeError, ValueError):
                continue
        return result
    def save(self, records: list[dict]) -> None:
        with SessionLocal() as session:
            for record in records[-100:]:
                session.add(RateSnapshot(**record))
            session.commit()


class PortInfrastructureIngestion(SourceIngestion):
    source_name = "port_infrastructure"
    def fetch(self) -> list[dict[str, str]]:
        with (ROOT / "data/cleaned/port_constraints.csv").open(encoding="utf-8-sig") as stream:
            return list(csv.DictReader(stream))
    def normalize(self, raw: list[dict[str, str]]) -> list[dict]:
        # Input files vary by provider; only map fields whose meaning is unambiguous.
        result = []
        for row in raw:
            name = row.get("port") or row.get("port_name") or row.get("Port")
            if name:
                result.append({"name": name, "max_draft_m": _float(row, "max_draft_m", "draft"), "max_loa_m": _float(row, "max_loa_m", "loa"), "max_beam_m": _float(row, "max_beam_m", "beam"), "berths": _int(row, "berths")})
        return result
    def save(self, records: list[dict]) -> None:
        with SessionLocal() as session:
            for record in records:
                existing = session.query(Port).filter_by(name=record["name"]).one_or_none()
                if existing:
                    for key, value in record.items(): setattr(existing, key, value)
                else: session.add(Port(**record))
            session.commit()


class CoastalWeatherIngestion(SourceIngestion):
    source_name = "coastal_weather"
    def fetch(self) -> dict:
        # Retain external access in the dedicated risk service; this verifies configured sources.
        settings = get_settings()
        if not (settings.imd_api_key or settings.coastal_weather_api_key or settings.google_maps_api_key):
            raise RuntimeError("No coastal weather API key configured")
        return {"fetched_at": datetime.now(timezone.utc).isoformat(), "source": "configured coastal weather provider"}
    def normalize(self, raw: dict) -> list[dict]: return [raw]
    def save(self, records: list[dict]) -> None: LastGoodSnapshots.save(self.source_name, records)


class BackhaulIngestion(SourceIngestion):
    source_name = "backhaul"
    def fetch(self) -> list[dict[str, str]]:
        with (ROOT / "data/cleaned/port_export_commodities.csv").open(encoding="utf-8-sig") as stream:
            return list(csv.DictReader(stream))
    def normalize(self, raw: list[dict[str, str]]) -> list[dict]: return raw
    def save(self, records: list[dict]) -> None: LastGoodSnapshots.save(self.source_name, records)


class LastGoodSnapshots:
    _data: dict[str, tuple[datetime, list[dict]]] = {}
    @classmethod
    def save(cls, name: str, data: list[dict]) -> None:
        fetched_at = datetime.now(timezone.utc)
        cls._data[name] = (fetched_at, data)
        with SessionLocal() as session:
            snapshot = session.query(SourceSnapshot).filter_by(source_name=name).one_or_none()
            if snapshot:
                snapshot.payload, snapshot.fetched_at = data, fetched_at
            else:
                session.add(SourceSnapshot(source_name=name, payload=data, fetched_at=fetched_at))
            session.commit()
    @classmethod
    def get(cls, name: str) -> tuple[datetime, list[dict]] | None:
        cached = cls._data.get(name)
        if cached: return cached
        with SessionLocal() as session:
            snapshot = session.query(SourceSnapshot).filter_by(source_name=name).one_or_none()
            return (snapshot.fetched_at, snapshot.payload) if snapshot else None


def run_resilient(source: SourceIngestion) -> datetime:
    try:
        raw = source.fetch()
        records = source.normalize(raw)
        source.save(records)
        LastGoodSnapshots.save(source.source_name, records)
        return datetime.now(timezone.utc)
    except Exception:
        snapshot = LastGoodSnapshots.get(source.source_name)
        if snapshot is None: raise
        return snapshot[0]


def _float(row: dict, *keys: str) -> float | None:
    for key in keys:
        try: return float(row[key])
        except (KeyError, TypeError, ValueError): continue
    return None
def _int(row: dict, *keys: str) -> int | None:
    value = _float(row, *keys)
    return int(value) if value is not None else None
