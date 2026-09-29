"""Read-only access to cleaned reference datasets used by adapters.

Physical limits deliberately use `port_constraints.csv` as the authoritative
operational source.  Dataset 3/5 values are preserved as separate sources and
are not silently merged because they can conflict by berth/port variant.
"""
from __future__ import annotations

from functools import lru_cache
from pathlib import Path
import pandas as pd

ROOT = Path(__file__).resolve().parents[2]
DATA = ROOT / "data" / "cleaned"


def _csv(name: str) -> pd.DataFrame:
    # Files with `.csv.xls` are CSV text, not Excel workbooks.
    return pd.read_csv(DATA / name)


@lru_cache
def port_constraints() -> pd.DataFrame:
    return _csv("port_constraints.csv")


@lru_cache
def route_distances() -> pd.DataFrame:
    return _csv("dataset_7_route_distances_cleaned.csv.xls")


@lru_cache
def port_traffic() -> pd.DataFrame:
    data = _csv("dataset_5_port_traffic_timeseries_cleaned.csv.xls")
    data["date"] = pd.to_datetime(data["date"])
    return data


@lru_cache
def bunker_prices() -> pd.DataFrame:
    data = _csv("dataset_9_bunker_fuel_prices_cleaned.csv.xls")
    data["date"] = pd.to_datetime(data["date"])
    return data


def physical_port(name: str) -> dict | None:
    rows = port_constraints()[port_constraints()["port_name"].str.casefold() == name.casefold()]
    if rows.empty:
        return None
    row = rows.iloc[0]
    return {"port_name": str(row.port_name), "max_draft_m": float(row.max_draft_m), "max_loa_m": float(row.max_loa_m), "max_beam_m": float(row.max_beam_m), "max_dwt": float(row.max_dwt), "handling_rate_tons_per_day": float(row.handling_rate_tons_per_day), "berth_count": int(row.berth_count), "source": "data/cleaned/port_constraints.csv"}


def optimization_reference(origin: str, destination: str) -> tuple[dict | None, str | None]:
    port = physical_port(destination)
    if not port:
        return None, f"No physical constraint record for {destination} in port_constraints.csv."
    routes = route_distances()
    route = routes[(routes.origin_port.str.casefold() == origin.casefold()) & (routes.destination_port.str.casefold() == destination.casefold())]
    if route.empty:
        return None, f"No route distance for {origin} to {destination}."
    traffic = port_traffic()[port_traffic().port_name.str.casefold() == destination.casefold()]
    if traffic.empty:
        return None, f"No traffic history for {destination}."
    fuel = bunker_prices()
    fuel = fuel[(fuel.hub.str.casefold() == "singapore") & (fuel.fuel_type.str.casefold() == "hsfo")]
    if fuel.empty:
        return None, "No Singapore HSFO fuel price is available."
    route_row, traffic_row, fuel_row = route.iloc[0], traffic.sort_values("date").iloc[-1], fuel.sort_values("date").iloc[-1]
    return {"port": port, "route": {"distance_nm": float(route_row.distance_nm), "route_type": str(route_row.route_type)}, "congestion": {"anchorage_wait_days": float(traffic_row.waiting_days_at_anchorage), "berth_wait_days": float(traffic_row.waiting_days_at_berth), "idle_days": float(traffic_row.waiting_days_at_anchorage + traffic_row.waiting_days_at_berth), "berth_occupancy_pct": float(traffic_row.berth_occupancy_pct), "as_of": traffic_row.date.date().isoformat()}, "fuel_price": float(fuel_row.price_usd_per_tonne), "fuel_as_of": fuel_row.date.date().isoformat(), "sources": {"port": port["source"], "route": "data/cleaned/dataset_7_route_distances_cleaned.csv.xls", "traffic": "data/cleaned/dataset_5_port_traffic_timeseries_cleaned.csv.xls", "fuel": "data/cleaned/dataset_9_bunker_fuel_prices_cleaned.csv.xls"}}, None
