#!/usr/bin/env python3
"""
Puhar - Risk Mitigation model
=============================
Three risk modules, one reroute concept, always with the reason:

  1. Cyclone Red Alerts   -> AUTO_REROUTE. Mandatory, applied with NO user decision.
  2. Port Constraints     -> SUGGEST_REROUTE, reason type PORT_ISSUE.
  3. Traffic Congestion   -> SUGGEST_REROUTE, reason type TRAFFIC.
  (nothing triggered)     -> PROCEED

There are no "normal / medium / immediate" reroute grades. A voyage is either
proceeding, has a suggested reroute, or has an automatic (forced) reroute.

Data sources - REQUIRED sources need no key at all, so the model runs out of the box:

  REQUIRED (free, no key, no registration):
  * GDACS event track+zones   cyclone track, forecast points, and hazard-corridor
                               polygons (Green/Orange/Red = 60/90/120 km/h) per active
                               cyclone - feeds Cyclone Red Alerts on its own.
  * Open-Meteo forecast        port wind, gusts, and a thunderstorm proxy - feeds Port
                               Constraints on its own.
  * Open-Meteo marine           wave height - feeds Port Constraints.
  * data/port_notices.json     official port notices you enter by hand.

  OPTIONAL (add a key later for more precision - everything still runs without them):
  * IMD official API (api.imd.gov.in)  adds an official cyclone track, wind-radii
    polygons and port warnings alongside GDACS  [IMD_API_KEY]
  * Google Maps Platform Weather API   replaces Open-Meteo's port weather with a
    direct thunderstorm-probability field instead of the weather-code proxy
    [GOOGLE_MAPS_API_KEY]
  * AISStream.io                       vessels waiting at port anchorage - Traffic
    Congestion has no free substitute, so this module is skipped without it
    [AISSTREAM_API_KEY]

A failed or unconfigured source is reported in `data_gaps`. It is never treated as "safe".
"""
from __future__ import annotations

import argparse
import asyncio
import json
import math
import os
import re
import sys
import time
import xml.etree.ElementTree as ET
from dataclasses import asdict, dataclass, field
from datetime import datetime, timedelta, timezone
from typing import Callable, Dict, List, Optional, Tuple

import requests


# --------------------------------------------------------------------------
# .env loader (no extra dependency)
# --------------------------------------------------------------------------
HERE = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(HERE, "data")
NOTICES_PATH = os.path.join(DATA_DIR, "port_notices.json")
REROUTE_LOG_PATH = os.path.join(DATA_DIR, "reroute_log.jsonl")


def _load_env() -> None:
    """Loads the first .env found in this folder or up to 4 parent folders (e.g. backend/.env), then cwd."""
    folders, cur = [], HERE
    for _ in range(5):
        folders.append(cur)
        cur = os.path.dirname(cur)
    for folder in folders + [os.getcwd()]:
        path = os.path.join(folder, ".env")
        if not os.path.exists(path):
            continue
        with open(path, "r", encoding="utf-8") as fh:
            for line in fh:
                line = line.strip()
                if not line or line.startswith("#") or "=" not in line:
                    continue
                k, v = line.split("=", 1)
                os.environ.setdefault(k.strip(), v.strip().strip('"').strip("'"))
        return


_load_env()


# --------------------------------------------------------------------------
# Configuration. Every number is an operating assumption: tune and validate.
# --------------------------------------------------------------------------
CFG = {
    # Cyclone Red Alerts
    "cyclone_red_port_km": 500,      # any track point (now or forecast) this close to the port
    "cyclone_red_route_km": 300,     # ... or this close to the planned route
    "cyclone_forecast_h": 72,        # forecast track points considered
    "hold_extra_km": 300,            # safe holding point sits this far beyond the red radius
    "region": (5.0, 78.0, 25.5, 100.0),   # lat_min, lon_min, lat_max, lon_max (GDACS backup filter)
    # Port Constraints
    "port_gust_kmh": 65,             # ~35 kn gusts: pilotage / berthing usually suspended
    "port_thunder_pct": 90,
    "port_wave_m": 3.0,
    "weather_horizon_h": 72,
    # Traffic Congestion
    "congestion_waiting": 8,         # cargo vessels at anchor inside the port box
    "ais_listen_seconds": 240,
    "anchorage_box_deg": 0.25,
    "http_timeout": 25,
}

IMD_BASE = "https://api.imd.gov.in/api/v1"
GDACS_RSS = "https://www.gdacs.org/xml/rss.xml"
GOOGLE_WX = "https://weather.googleapis.com/v1/forecast/hours:lookup"

ACTIONS = ("PROCEED", "SUGGEST_REROUTE", "AUTO_REROUTE")
REASON_LABEL = {"CYCLONE": "Cyclone Red Alert", "PORT_ISSUE": "Port Issue",
                "TRAFFIC": "Traffic on Route"}


# --------------------------------------------------------------------------
# Ports (approximate reference points - verify against charts / port authority)
# --------------------------------------------------------------------------
@dataclass
class Port:
    name: str
    lat: float
    lon: float
    aliases: Tuple[str, ...] = ()
    coast: str = ""   # keyword to match IMD coastal bulletin layer

    @property
    def box(self) -> Tuple[float, float, float, float]:
        d = CFG["anchorage_box_deg"]
        return (self.lat - d, self.lon - d, self.lat + d, self.lon + d)

    def matches(self, text: str) -> bool:
        t = (text or "").lower()
        return any(n.lower() in t for n in (self.name, *self.aliases))


PORTS: Dict[str, Port] = {
    p.name: p
    for p in [
        Port("Paradip", 20.26, 86.68, (), "odisha"),
        Port("Dhamra", 20.79, 86.97, (), "odisha"),
        Port("Gopalpur", 19.26, 84.90, (), "odisha"),
        Port("Haldia", 22.03, 88.10, (), "west bengal"),
        Port("Sagar-Sandheads", 21.00, 88.10, ("sagar", "sandheads"), "west bengal"),
        Port("Visakhapatnam", 17.69, 83.29, ("vizag", "visakhapatnam"), "andhra"),
        Port("Gangavaram", 17.62, 83.23, (), "andhra"),
        Port("Kakinada", 16.93, 82.24, (), "andhra"),
        Port("Krishnapatnam", 14.25, 80.12, (), "andhra"),
        Port("Chennai", 13.10, 80.30, ("ennore",), "tamil"),
    ]
}


# --------------------------------------------------------------------------
# Data classes
# --------------------------------------------------------------------------
@dataclass
class Vessel:
    lat: float
    lon: float
    draft_m: Optional[float] = None
    eta: Optional[datetime] = None
    name: str = "Vessel"


@dataclass
class TrackPoint:
    lat: float
    lon: float
    time: Optional[datetime]
    wind_kmh: Optional[float]
    kind: str            # observed | forecast
    category: str = ""


@dataclass
class Cyclone:
    name: str
    track: List[TrackPoint]
    source: str          # IMD | GDACS
    # Per-cyclone hazard-corridor polygons (GDACS: whole-episode swath at each wind
    # threshold). hazard_green (60 km/h, closest to a 34-kt gale radius) is the one
    # used as a zone test, the same role IMD's wind34 polygon plays.
    hazard_green: Optional[dict] = None
    hazard_orange: Optional[dict] = None
    hazard_red: Optional[dict] = None

    @property
    def current(self) -> TrackPoint:
        obs = [p for p in self.track if p.kind == "observed"]
        return obs[-1] if obs else self.track[0]

    def relevant_points(self, now: datetime) -> List[TrackPoint]:
        out = [self.current]
        for p in self.track:
            if p.kind != "forecast":
                continue
            if p.time and (p.time < now - timedelta(hours=6)
                           or p.time > now + timedelta(hours=CFG["cyclone_forecast_h"])):
                continue
            out.append(p)
        return out


@dataclass
class Reason:
    type: str            # CYCLONE | PORT_ISSUE | TRAFFIC
    label: str           # "Cyclone Red Alert" | "Port Issue" | "Traffic on Route"
    headline: str
    detail: str
    source: str


@dataclass
class Alternate:
    port: str
    distance_km: float
    note: str


@dataclass
class Decision:
    destination: str
    action: str                              # PROCEED | SUGGEST_REROUTE | AUTO_REROUTE
    requires_user_decision: bool
    reason_types: List[str] = field(default_factory=list)
    reasons: List[Reason] = field(default_factory=list)
    recommended_port: Optional[str] = None
    alternates: List[Alternate] = field(default_factory=list)
    new_route_waypoints: List[Tuple[float, float]] = field(default_factory=list)
    safe_holding_point: Optional[Tuple[float, float]] = None
    steer_away_bearing_deg: Optional[float] = None
    data_gaps: List[str] = field(default_factory=list)
    generated_at: str = ""


@dataclass
class RiskData:
    cyclones: List[Cyclone] = field(default_factory=list)
    zones: Dict[str, Optional[dict]] = field(default_factory=dict)  # "wind34", "cone" GeoJSON geometry
    weather: Dict[str, dict] = field(default_factory=dict)        # port -> wind/gust/thunder summary
    waves: Dict[str, dict] = field(default_factory=dict)          # port -> wave summary
    imd_port_warnings: Dict[str, str] = field(default_factory=dict)   # port -> warning text
    congestion: Dict[str, dict] = field(default_factory=dict)     # port -> AIS counts
    notices: List[dict] = field(default_factory=list)
    gaps: List[str] = field(default_factory=list)


# --------------------------------------------------------------------------
# Geometry
# --------------------------------------------------------------------------
def haversine_km(lat1, lon1, lat2, lon2) -> float:
    r = 6371.0088
    p1, p2 = math.radians(lat1), math.radians(lat2)
    a = (math.sin((p2 - p1) / 2) ** 2
         + math.cos(p1) * math.cos(p2) * math.sin(math.radians(lon2 - lon1) / 2) ** 2)
    return 2 * r * math.asin(math.sqrt(a))


def bearing_deg(lat1, lon1, lat2, lon2) -> float:
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dl = math.radians(lon2 - lon1)
    y = math.sin(dl) * math.cos(p2)
    x = math.cos(p1) * math.sin(p2) - math.sin(p1) * math.cos(p2) * math.cos(dl)
    return (math.degrees(math.atan2(y, x)) + 360) % 360


def destination_point(lat, lon, bearing, dist_km) -> Tuple[float, float]:
    r = 6371.0088
    b, d = math.radians(bearing), dist_km / r
    p1, l1 = math.radians(lat), math.radians(lon)
    p2 = math.asin(math.sin(p1) * math.cos(d) + math.cos(p1) * math.sin(d) * math.cos(b))
    l2 = l1 + math.atan2(math.sin(b) * math.sin(d) * math.cos(p1),
                         math.cos(d) - math.sin(p1) * math.sin(p2))
    return (round(math.degrees(p2), 4), round((math.degrees(l2) + 540) % 360 - 180, 4))


def _vec(lat, lon):
    la, lo = math.radians(lat), math.radians(lon)
    return (math.cos(la) * math.cos(lo), math.cos(la) * math.sin(lo), math.sin(la))


def route_points(a: Tuple[float, float], b: Tuple[float, float], n: int = 30):
    va, vb = _vec(*a), _vec(*b)
    omega = math.acos(max(-1.0, min(1.0, sum(x * y for x, y in zip(va, vb)))))
    pts = []
    for i in range(n + 1):
        t = i / n
        if omega < 1e-9:
            v = va
        else:
            s = math.sin(omega)
            v = tuple((math.sin((1 - t) * omega) / s) * x + (math.sin(t * omega) / s) * y
                      for x, y in zip(va, vb))
        pts.append((math.degrees(math.asin(max(-1.0, min(1.0, v[2])))),
                    math.degrees(math.atan2(v[1], v[0]))))
    return pts


def _pip_ring(x, y, ring) -> bool:
    inside, j = False, len(ring) - 1
    for i in range(len(ring)):
        xi, yi, xj, yj = ring[i][0], ring[i][1], ring[j][0], ring[j][1]
        if (yi > y) != (yj > y) and x < (xj - xi) * (y - yi) / ((yj - yi) or 1e-12) + xi:
            inside = not inside
        j = i
    return inside


def in_geometry(lat: float, lon: float, geom: Optional[dict]) -> bool:
    """Point-in-(Multi)Polygon for GeoJSON geometry, coordinates are [lon, lat]."""
    if not geom:
        return False
    coords = geom.get("coordinates")
    polys = coords if geom.get("type") == "MultiPolygon" else [coords]
    for poly in polys or []:
        if poly and _pip_ring(lon, lat, poly[0]) and not any(_pip_ring(lon, lat, h) for h in poly[1:]):
            return True
    return False


def nearest_approach(points: List[TrackPoint], lat, lon) -> Tuple[float, TrackPoint]:
    best = min(points, key=lambda p: haversine_km(p.lat, p.lon, lat, lon))
    return haversine_km(best.lat, best.lon, lat, lon), best


# --------------------------------------------------------------------------
# IMD (official Government of India API)
# --------------------------------------------------------------------------
def imd_get(endpoint: str, params: Optional[dict] = None):
    """
    Key handling is configurable because it depends on how your IMD API account
    issues credentials (check the IMD portal dashboard after registering):
      IMD_AUTH_MODE = header (default) | query | bearer
      IMD_AUTH_NAME = header / query parameter name (default x-api-key)
    """
    key = os.environ.get("IMD_API_KEY")
    headers, qp = {}, dict(params or {})
    if key:
        mode = os.environ.get("IMD_AUTH_MODE", "header").lower()
        name = os.environ.get("IMD_AUTH_NAME", "x-api-key")
        if mode == "query":
            qp[name] = key
        elif mode == "bearer":
            headers["Authorization"] = f"Bearer {key}"
        else:
            headers[name] = key
    r = requests.get(f"{IMD_BASE}/{endpoint}", params=qp, headers=headers,
                     timeout=CFG["http_timeout"])
    r.raise_for_status()
    return r.json()


def _f(x) -> Optional[float]:
    try:
        return float(x)
    except (TypeError, ValueError):
        return None


def _imd_time(s: str) -> Optional[datetime]:
    for fmt in ("%d.%m.%y/%H%M", "%d.%m.%Y/%H%M"):
        try:
            return datetime.strptime((s or "").strip(), fmt).replace(tzinfo=timezone.utc)
        except ValueError:
            continue
    return None


def fetch_imd_cyclones(d: RiskData) -> List[Cyclone]:
    try:
        tr = imd_get("cyclone_track")
    except Exception as e:
        d.gaps.append(f"IMD cyclone track unavailable: {e}")
        return []
    if not tr or not tr.get("status"):
        return []                                   # no active cyclone in the basin
    by_name: Dict[str, List[TrackPoint]] = {}
    for kind in ("observed", "forecast"):
        for row in (tr.get("data") or {}).get(kind) or []:
            lat, lon = _f(row.get("lat")), _f(row.get("lon"))
            if lat is None or lon is None:
                continue
            by_name.setdefault(row.get("CYCLONE_NAME") or "UNNAMED", []).append(
                TrackPoint(lat, lon, _imd_time(row.get("Date/Time", "")),
                           _f(row.get("Mean MSW (kmph)")), kind, row.get("Category", "")))
    cyclones = [Cyclone(n, pts, "IMD") for n, pts in by_name.items()]
    if cyclones:                                    # zones only matter when a cyclone is active
        try:
            w = imd_get("cyclone_wind")
            d.zones["wind34"] = ((w or {}).get("data") or {}).get("34kt")
        except Exception as e:
            d.gaps.append(f"IMD cyclone wind-radii polygons unavailable: {e}")
        try:
            c = imd_get("cyclone_cou")
            d.zones["cone"] = (c or {}).get("data")
        except Exception as e:
            d.gaps.append(f"IMD cone of uncertainty unavailable: {e}")
    return cyclones


def fetch_imd_port_warnings(d: RiskData, ports: List[Port]) -> None:
    """IMD Port Warning + Coastal Bulletin 'Port Signal'. Anything not NIL is a port issue."""
    nil = re.compile(r"^\s*(nil|no warning|none|-)\b", re.I)
    try:
        rows = imd_get("portwarning")
        rows = rows if isinstance(rows, list) else (rows or {}).get("data", [])
        for row in rows:
            text = str(row.get("Warning", "")).strip()
            if not text or nil.match(text):
                continue
            for p in ports:
                if p.matches(row.get("Port Name", "")):
                    d.imd_port_warnings[p.name] = text
    except Exception as e:
        d.gaps.append(f"IMD port warnings unavailable: {e}")
    try:
        rows = imd_get("coastalbulletin")
        rows = rows if isinstance(rows, list) else (rows or {}).get("data", [])
        for row in rows:
            sig = str(row.get("Port Signal", "")).strip()
            if not sig or nil.match(sig):
                continue
            layer = str(row.get("Layer", "")).lower()
            for p in ports:
                if p.coast and p.coast in layer and p.name not in d.imd_port_warnings:
                    d.imd_port_warnings[p.name] = f"Coastal bulletin port signal: {sig}"
    except Exception as e:
        d.gaps.append(f"IMD coastal bulletin unavailable: {e}")


# --------------------------------------------------------------------------
# GDACS backup cyclone feed (no key)
# --------------------------------------------------------------------------
def _local(tag: str) -> str:
    return tag.split("}")[-1]


def fetch_gdacs_cyclones(d: RiskData) -> List[Cyclone]:
    try:
        r = requests.get(GDACS_RSS, timeout=CFG["http_timeout"])
        r.raise_for_status()
        root = ET.fromstring(r.content)
    except Exception as e:
        d.gaps.append(f"GDACS backup cyclone feed unavailable: {e}")
        return []
    la0, lo0, la1, lo1 = CFG["region"]
    out: List[Cyclone] = []
    for item in root.iter("item"):
        f: Dict[str, str] = {}
        lat = lon = wind = None
        for ch in item.iter():
            k, txt = _local(ch.tag), (ch.text or "").strip()
            if k == "severity":
                wind = _f(ch.attrib.get("value"))
            elif k == "lat" and txt:
                lat = _f(txt)
            elif k == "long" and txt:
                lon = _f(txt)
            elif k == "point" and txt and lat is None:
                parts = txt.split()
                if len(parts) == 2:
                    lat, lon = _f(parts[0]), _f(parts[1])
            elif txt and k not in f:
                f[k] = txt
        if f.get("eventtype") != "TC" or lat is None or lon is None:
            continue
        if f.get("iscurrent", "true").lower() == "false":
            continue
        if not (la0 <= lat <= la1 and lo0 <= lon <= lo1):
            continue
        base_point = TrackPoint(lat, lon, None, wind, "observed", f.get("alertlevel", ""))
        track, zones = [base_point], {}
        eventid, episodeid = f.get("eventid"), f.get("episodeid")
        if eventid and episodeid:
            rich_track, zones = fetch_gdacs_event_track(eventid, episodeid, d.gaps)
            if rich_track:
                track = rich_track            # replaces the single RSS point with full track
        out.append(Cyclone(f.get("eventname") or f.get("title", "Unnamed cyclone"),
                           track, "GDACS", **zones))
    return out


# GDACS wind-threshold labels (km/h) -> standard tropical-cyclone radii (knots) they
# correspond to, and back to an approximate km/h wind speed for an estimated point.
_GDACS_ZONE_ATTR = {"Green": "hazard_green", "Orange": "hazard_orange", "Red": "hazard_red"}
_WINDRADII_KMH = {"34": 63.0, "50": 93.0, "64": 119.0}  # 34/50/64 kt gale/storm/hurricane


def _polygon_centroid(geom: dict) -> Optional[Tuple[float, float]]:
    """Arithmetic-mean centroid of a GeoJSON Polygon/MultiPolygon outer ring - good
    enough for these near-circular wind-radii buffers, not for irregular shapes."""
    if not geom:
        return None
    coords = geom.get("coordinates")
    if not coords:
        return None
    ring = coords[0][0] if geom.get("type") == "MultiPolygon" else coords[0]
    if not ring:
        return None
    lat = sum(p[1] for p in ring) / len(ring)
    lon = sum(p[0] for p in ring) / len(ring)
    return (lat, lon)


def fetch_gdacs_event_track(eventid: str, episodeid: str, gaps: List[str]
                            ) -> Tuple[List[TrackPoint], Dict[str, dict]]:
    """
    Per-event GDACS file: observed track points (Point_N), forecast points
    approximated from the WindRadii_34 corridor's centroid at each forecast time,
    and the whole-episode hazard-corridor polygons (Green/Orange/Red = 60/90/120 km/h).
    Free, no key. URL is deterministic from the ids already in the RSS feed.
    """
    url = f"https://www.gdacs.org/contentdata/resources/TC/{eventid}/geojson_{eventid}_{episodeid}.geojson"
    try:
        r = requests.get(url, timeout=CFG["http_timeout"])
        r.raise_for_status()
        feats = r.json().get("features", [])
    except Exception as e:
        gaps.append(f"GDACS event detail unavailable for event {eventid}: {e}")
        return [], {}

    observed: List[TrackPoint] = []
    # timestamp string -> set of radii thresholds ("34"/"50"/"64") seen, and one
    # representative polygon per timestamp (the 34 kt one - always the widest/first
    # issued) to use for the forecast point's position.
    by_ts: Dict[str, dict] = {}
    zones: Dict[str, dict] = {}

    for feat in feats:
        props = feat.get("properties", {})
        cls = props.get("Class", "")
        geom = feat.get("geometry", {})

        if cls in ("Poly_Green", "Poly_Orange", "Poly_Red"):
            zones[_GDACS_ZONE_ATTR[cls.split("_")[1]]] = geom
            continue

        if cls.startswith("Point_") and cls != "Point_Centroid":
            t = None
            raw = props.get("trackdate", "")
            try:
                t = datetime.strptime(raw.strip(), "%d/%m/%Y %H:%M:%S").replace(tzinfo=timezone.utc)
            except ValueError:
                pass
            lat, lon = _f(props.get("latitude")), _f(props.get("longitude"))
            if lat is not None and lon is not None:
                observed.append(TrackPoint(lat, lon, t, _f(props.get("windspeed")),
                                           "observed", props.get("stormstatus", "")))
            continue

        if cls.startswith("WindRadii_"):
            parts = cls.split("_")            # ["WindRadii", "34", "2607251200"]
            if len(parts) != 3:
                continue
            threshold, ts = parts[1], parts[2]
            entry = by_ts.setdefault(ts, {"thresholds": set(), "geom": None})
            entry["thresholds"].add(threshold)
            if threshold == "34" or entry["geom"] is None:
                entry["geom"] = geom          # 34 kt polygon is the widest/base shape

    forecast: List[TrackPoint] = []
    for ts, entry in by_ts.items():
        try:
            t = datetime.strptime(ts, "%y%m%d%H%M").replace(tzinfo=timezone.utc)
        except ValueError:
            continue
        centroid = _polygon_centroid(entry["geom"])
        if not centroid:
            continue
        best_threshold = max(entry["thresholds"], key=lambda x: int(x))
        forecast.append(TrackPoint(centroid[0], centroid[1], t,
                                   _WINDRADII_KMH.get(best_threshold), "forecast"))

    observed.sort(key=lambda p: p.time or datetime.min.replace(tzinfo=timezone.utc))
    forecast.sort(key=lambda p: p.time or datetime.min.replace(tzinfo=timezone.utc))
    return observed + forecast, zones


def merge_cyclones(imd: List[Cyclone], gdacs: List[Cyclone]) -> List[Cyclone]:
    """IMD is primary. A GDACS cyclone is added only if IMD does not already track it,
    so both sources are never double-counted for the same storm."""
    merged = list(imd)
    for g in gdacs:
        gc = g.current
        if not any(haversine_km(gc.lat, gc.lon, m.current.lat, m.current.lon) < 250 for m in imd):
            merged.append(g)
    return merged


# --------------------------------------------------------------------------
# Port weather (wind / gusts / thunderstorm)
#   Primary:  Open-Meteo forecast API - free, no key, no billing, no registration.
#   Optional: Google Weather API - used INSTEAD of Open-Meteo for a port, but only if
#             GOOGLE_MAPS_API_KEY is set and the call succeeds (its thunderstorm
#             probability field is more precise than Open-Meteo's weather-code proxy).
#             Nothing breaks or is skipped if that key is absent.
# --------------------------------------------------------------------------
_SPEED_TO_KMH = {"KILOMETERS_PER_HOUR": 1.0, "MILES_PER_HOUR": 1.609344, "KNOTS": 1.852,
                 "METERS_PER_SECOND": 3.6}
# WMO weather codes: 95/96/99 = thunderstorm (slight/moderate, with slight hail, with
# heavy hail). Open-Meteo has no thunderstorm-probability field, so presence of one of
# these codes within the horizon is used as a 0/100 proxy for CFG["port_thunder_pct"].
_THUNDER_CODES = {95, 96, 99}


def fetch_open_meteo_weather(port: Port, d: RiskData) -> Optional[dict]:
    """No key required. Returns None (and logs a gap) only on a network/HTTP failure."""
    horizon = CFG["weather_horizon_h"]
    days = max(2, math.ceil(horizon / 24) + 1)
    out = {"max_wind_kmh": None, "max_gust_kmh": None, "max_thunder_pct": None, "at": None}
    try:
        r = requests.get(
            "https://api.open-meteo.com/v1/forecast",
            params={"latitude": port.lat, "longitude": port.lon,
                    "hourly": "wind_speed_10m,wind_gusts_10m,weathercode",
                    "wind_speed_unit": "kmh", "forecast_days": days, "timezone": "UTC"},
            timeout=CFG["http_timeout"],
        )
        r.raise_for_status()
        j = r.json()["hourly"]
        now = datetime.now(timezone.utc).replace(tzinfo=None)
        thunder = False
        for t, ws, wg, code in zip(j["time"], j["wind_speed_10m"], j["wind_gusts_10m"],
                                   j.get("weathercode", [])):
            tt = datetime.fromisoformat(t)
            if tt < now or tt > now + timedelta(hours=horizon):
                continue
            if ws is not None and (out["max_wind_kmh"] is None or ws > out["max_wind_kmh"]):
                out["max_wind_kmh"] = ws
            if wg is not None and (out["max_gust_kmh"] is None or wg > out["max_gust_kmh"]):
                out["max_gust_kmh"], out["at"] = wg, t
            if code in _THUNDER_CODES:
                thunder = True
        out["max_thunder_pct"] = 100.0 if thunder else 0.0
        return out
    except Exception as e:
        d.gaps.append(f"Open-Meteo weather unavailable for {port.name}: {e}")
        return None


def fetch_google_weather(port: Port, d: RiskData) -> Optional[dict]:
    """Optional upgrade over Open-Meteo. Returns None (silently - Open-Meteo already
    covers this port) if no key is set or the call fails."""
    key = os.environ.get("GOOGLE_MAPS_API_KEY")
    if not key:
        return None
    out = {"max_gust_kmh": None, "max_wind_kmh": None, "max_thunder_pct": None, "at": None}
    token = None
    try:
        for _ in range(6):                          # pagination safety cap
            params = {"key": key, "location.latitude": port.lat, "location.longitude": port.lon,
                      "hours": CFG["weather_horizon_h"], "pageSize": 24, "unitsSystem": "METRIC"}
            if token:
                params["pageToken"] = token
            r = requests.get(GOOGLE_WX, params=params, timeout=CFG["http_timeout"])
            r.raise_for_status()
            j = r.json()
            for h in j.get("forecastHours", []):
                w = h.get("wind") or {}
                for field_name, slot in (("speed", "max_wind_kmh"), ("gust", "max_gust_kmh")):
                    v = (w.get(field_name) or {})
                    val = _f(v.get("value"))
                    if val is None:
                        continue
                    val *= _SPEED_TO_KMH.get(v.get("unit", "KILOMETERS_PER_HOUR"), 1.0)
                    current = out[slot]
                    if current is None or val > current:
                        out[slot] = val
                        if slot == "max_gust_kmh":
                            out["at"] = (h.get("interval") or {}).get("startTime")
                th = _f(h.get("thunderstormProbability"))
                if th is not None and (out["max_thunder_pct"] is None or th > out["max_thunder_pct"]):
                    out["max_thunder_pct"] = th
            token = j.get("nextPageToken")
            if not token:
                break
        return out
    except Exception as e:
        d.gaps.append(f"Google Weather unavailable for {port.name} (using Open-Meteo instead): {e}")
        return None


def fetch_port_weather(port: Port, d: RiskData) -> None:
    """Open-Meteo always runs (no key). Google Weather, if configured, replaces it
    for this port only when it actually returns data."""
    result = fetch_open_meteo_weather(port, d)
    google = fetch_google_weather(port, d)
    if google is not None:
        result = google
    if result is not None:
        d.weather[port.name] = result


def fetch_waves(port: Port, d: RiskData) -> None:
    """Supplementary wave height (Open-Meteo marine, no key). Disable: USE_OPEN_METEO_WAVES=0."""
    if os.environ.get("USE_OPEN_METEO_WAVES", "1") == "0":
        return
    try:
        r = requests.get("https://marine-api.open-meteo.com/v1/marine",
                         params={"latitude": port.lat, "longitude": port.lon,
                                 "hourly": "wave_height", "forecast_days": 4, "timezone": "UTC"},
                         timeout=CFG["http_timeout"])
        r.raise_for_status()
        j = r.json()["hourly"]
        now = datetime.now(timezone.utc).replace(tzinfo=None)
        best, at = None, None
        for t, wh in zip(j["time"], j["wave_height"]):
            tt = datetime.fromisoformat(t)
            if wh is None or tt < now or tt > now + timedelta(hours=CFG["weather_horizon_h"]):
                continue
            if best is None or wh > best:
                best, at = wh, t
        d.waves[port.name] = {"max_wave_m": best, "at": at}
    except Exception as e:
        d.gaps.append(f"Wave forecast unavailable for {port.name}: {e}")


# --------------------------------------------------------------------------
# AIS congestion (AISStream)
# --------------------------------------------------------------------------
async def _collect_ais(ports: List[Port], api_key: str, seconds: int) -> Dict[str, dict]:
    import websockets

    boxes = [[[p.box[0], p.box[1]], [p.box[2], p.box[3]]] for p in ports]
    sub = {"APIKey": api_key, "BoundingBoxes": boxes,
           "FilterMessageTypes": ["PositionReport", "ShipStaticData"]}
    latest: Dict[int, dict] = {}
    types: Dict[int, int] = {}
    end = time.time() + seconds
    async with websockets.connect("wss://stream.aisstream.io/v0/stream") as ws:
        await ws.send(json.dumps(sub))
        while True:
            remaining = end - time.time()
            if remaining <= 0:
                break
            try:
                raw = await asyncio.wait_for(ws.recv(), timeout=remaining)
            except asyncio.TimeoutError:
                break
            msg = json.loads(raw)
            if "error" in msg:
                raise RuntimeError(msg["error"])
            mmsi = (msg.get("MetaData") or {}).get("MMSI")
            body = msg.get("Message", {})
            if msg.get("MessageType") == "PositionReport" and mmsi:
                pr = body["PositionReport"]
                latest[mmsi] = {"lat": pr["Latitude"], "lon": pr["Longitude"],
                                "status": pr.get("NavigationalStatus"), "sog": pr.get("Sog", 0.0)}
            elif msg.get("MessageType") == "ShipStaticData" and mmsi:
                types[mmsi] = body["ShipStaticData"].get("Type", 0)
    result: Dict[str, dict] = {}
    for p in ports:
        la0, lo0, la1, lo1 = p.box
        waiting = unknown = 0
        for mmsi, s in latest.items():
            if not (la0 <= s["lat"] <= la1 and lo0 <= s["lon"] <= lo1):
                continue
            at_anchor = s["status"] == 1 or (s["status"] != 5 and (s["sog"] or 0) < 0.3)
            if not at_anchor:
                continue
            t = types.get(mmsi)
            if t is None:
                unknown += 1
                waiting += 1
            elif 70 <= t <= 79:      # AIS cargo types (includes bulk carriers)
                waiting += 1
        result[p.name] = {"waiting": waiting, "type_unknown": unknown, "window_s": seconds}
    return result


def fetch_congestion(ports: List[Port], d: RiskData) -> None:
    key = os.environ.get("AISSTREAM_API_KEY")
    if not key:
        d.gaps.append("Traffic Congestion skipped: set AISSTREAM_API_KEY (free at aisstream.io).")
        return
    try:
        d.congestion = asyncio.run(_collect_ais(ports, key, CFG["ais_listen_seconds"]))
    except Exception as e:
        d.gaps.append(f"AIS congestion feed unavailable: {e}")


def load_notices(path: str, d: RiskData) -> None:
    if not os.path.exists(path):
        return
    try:
        with open(path, "r", encoding="utf-8") as fh:
            d.notices = json.load(fh)
    except Exception as e:
        d.gaps.append(f"Could not read {path}: {e}")


def gather(ports: List[Port], notices_path: str = NOTICES_PATH,
           skip_ais: bool = False) -> RiskData:
    d = RiskData()
    imd = fetch_imd_cyclones(d)
    d.cyclones = merge_cyclones(imd, fetch_gdacs_cyclones(d))
    fetch_imd_port_warnings(d, ports)
    for p in ports:
        fetch_port_weather(p, d)
        fetch_waves(p, d)
    if not skip_ais:
        fetch_congestion(ports, d)
    load_notices(notices_path, d)
    return d


# --------------------------------------------------------------------------
# MODULE 1: Cyclone Red Alerts
# --------------------------------------------------------------------------
def cyclone_red_alerts(vessel: Vessel, port: Port, data: RiskData, now: datetime,
                       alternate: bool = False) -> List[Reason]:
    """
    Red alert if, for the port or the planned route, ANY of these holds:
      * a current or forecast track point is within the red radius
      * the location is inside the IMD 34-kt wind-radii polygon or cone of uncertainty
    For a diversion candidate (alternate=True) the route only counts against it if
    it takes the vessel closer to the cyclone than the vessel already is.
    """
    out: List[Reason] = []
    wind34, cone = data.zones.get("wind34"), data.zones.get("cone")
    route = route_points((vessel.lat, vessel.lon), (port.lat, port.lon), 30)
    for cy in data.cyclones:
        # IMD wind34/cone are global; a GDACS cyclone additionally carries its own
        # hazard_green polygon (60 km/h whole-episode corridor) - same role, per-storm.
        cy_zones = [z for z in (wind34, cone, cy.hazard_green) if z]
        pts = cy.relevant_points(now)
        d_port, p_near = nearest_approach(pts, port.lat, port.lon)
        cur = cy.current
        d_ves = haversine_km(cur.lat, cur.lon, vessel.lat, vessel.lon)
        port_zone_hit = any(in_geometry(port.lat, port.lon, z) for z in cy_zones)
        port_hit = d_port <= CFG["cyclone_red_port_km"] or port_zone_hit
        if alternate:
            d_route_now = min(haversine_km(cur.lat, cur.lon, la, lo) for la, lo in route)
            route_hit = d_route_now <= CFG["cyclone_red_route_km"] and d_route_now < d_ves - 1
            d_route = d_route_now
        else:
            d_route = min(haversine_km(p.lat, p.lon, la, lo) for p in pts for la, lo in route)
            route_hit = (d_route <= CFG["cyclone_red_route_km"]
                         or any(in_geometry(la, lo, z) for la, lo in route for z in cy_zones))
        if not (port_hit or route_hit):
            continue
        when = (f" around {p_near.time.strftime('%d %b %H:%M')} UTC"
                if p_near.kind == "forecast" and p_near.time else "")
        cat = f", {cur.category}" if cur.category else ""
        wind = f", {cur.wind_kmh:.0f} km/h winds" if cur.wind_kmh else ""
        target = port.name if port_hit else f"the planned route to {port.name}"
        out.append(Reason(
            "CYCLONE", REASON_LABEL["CYCLONE"],
            f"Cyclone {cy.name} threatens {target} - mandatory reroute",
            f"Cyclone {cy.name}{cat}{wind} ({cy.source}). Closest approach to {port.name}: "
            f"{d_port:.0f} km{when}; to the route: {d_route:.0f} km; to the vessel now: "
            f"{d_ves:.0f} km. Zone test: {'inside a hazard corridor/cone' if port_zone_hit else 'distance rule'}.",
            cy.source))
    return out


# --------------------------------------------------------------------------
# MODULE 2: Port Constraints
# --------------------------------------------------------------------------
def port_constraints(vessel: Vessel, port: Port, data: RiskData, now: datetime,
                     is_port_compatible: Optional[Callable[[Vessel, Port], bool]] = None
                     ) -> List[Reason]:
    out: List[Reason] = []

    def add(headline, detail, source):
        out.append(Reason("PORT_ISSUE", REASON_LABEL["PORT_ISSUE"], headline, detail, source))

    # (a) vessel vs port physical limits - plug in your port-constraint filter here
    if is_port_compatible and not is_port_compatible(vessel, port):
        add(f"Vessel cannot be handled at {port.name}",
            "Draft / LOA / beam limits of the port are not met for this vessel.",
            "Port constraint filter")

    # (b) official IMD port warnings / port signals
    warn = data.imd_port_warnings.get(port.name)
    if warn:
        add(f"IMD port warning at {port.name}", warn, "IMD")

    # (c) weather that halts pilotage and berthing (Open-Meteo, or Google Weather if configured)
    w = data.weather.get(port.name)
    if w:
        bits = []
        if w["max_gust_kmh"] is not None and w["max_gust_kmh"] >= CFG["port_gust_kmh"]:
            bits.append(f"gusts up to {w['max_gust_kmh']:.0f} km/h (around {w['at']})")
        if w["max_thunder_pct"] is not None and w["max_thunder_pct"] >= CFG["port_thunder_pct"]:
            bits.append(f"thunderstorm probability {w['max_thunder_pct']:.0f}%")
        if bits:
            add(f"Weather likely to suspend operations at {port.name}",
                f"Next {CFG['weather_horizon_h']} h: " + ", ".join(bits) + ".", "Port weather forecast")
    wv = data.waves.get(port.name)
    if wv and wv.get("max_wave_m") is not None and wv["max_wave_m"] >= CFG["port_wave_m"]:
        add(f"High waves at {port.name}",
            f"Waves up to {wv['max_wave_m']:.1f} m (around {wv['at']} UTC) in the next "
            f"{CFG['weather_horizon_h']} h.", "Open-Meteo marine")

    # (d) official port notices you enter in port_notices.json
    for n in data.notices:
        if n.get("port", "").lower() != port.name.lower():
            continue
        try:
            vf = datetime.fromisoformat(n["valid_from"]) if n.get("valid_from") else None
            vu = datetime.fromisoformat(n["valid_until"]) if n.get("valid_until") else None
        except ValueError:
            continue
        eta = vessel.eta or now
        if (vf and vf > max(now, eta)) or (vu and vu < now):
            continue
        typ, src, det = n.get("type"), n.get("source", "Port notice"), n.get("details", "")
        if typ == "closure":
            add(f"{port.name} is closed", det, src)
        elif typ == "pilotage_suspended":
            add(f"Pilotage suspended at {port.name}", det, src)
        elif typ == "berth_outage":
            add(f"Berth outage at {port.name}", det, src)
        elif typ == "draft_restriction":
            mx = n.get("max_draft_m")
            if vessel.draft_m is not None and mx is not None and vessel.draft_m > mx:
                add(f"Draft restriction at {port.name}: vessel {vessel.draft_m} m > permitted {mx} m",
                    det, src)
    return out


# --------------------------------------------------------------------------
# MODULE 3: Traffic Congestion
# --------------------------------------------------------------------------
def traffic_congestion(port: Port, data: RiskData) -> List[Reason]:
    c = data.congestion.get(port.name)
    if not c or c["waiting"] < CFG["congestion_waiting"]:
        return []
    caveat = f" ({c['type_unknown']} had no ship type yet)" if c.get("type_unknown") else ""
    return [Reason("TRAFFIC", REASON_LABEL["TRAFFIC"],
                   f"Traffic on route to {port.name}: {c['waiting']} cargo vessels queued at anchorage",
                   f"{c['waiting']} vessels at anchor inside the {port.name} anchorage box over a "
                   f"{c['window_s']} s AIS window{caveat}. Expect berthing delay and demurrage exposure.",
                   "AISStream (AIS)")]


# --------------------------------------------------------------------------
# Decision engine
# --------------------------------------------------------------------------
def log_auto_reroute(decision: "Decision", path: str = REROUTE_LOG_PATH) -> None:
    """Default auto-apply hook for cyclone reroutes. Replace with your dispatch / voyage-plan update."""
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "a", encoding="utf-8") as fh:
        fh.write(json.dumps(asdict(decision), default=str) + "\n")


def _other_reasons(vessel, port, data, now, is_port_compatible):
    return (port_constraints(vessel, port, data, now, is_port_compatible)
            + traffic_congestion(port, data))


def _holding_point(vessel: Vessel, data: RiskData, now: datetime) -> Tuple[Tuple[float, float], float]:
    """Point directly away from the nearest cyclone, beyond the red radius of every track point."""
    cy = min(data.cyclones, key=lambda c: haversine_km(c.current.lat, c.current.lon, vessel.lat, vessel.lon))
    brg = bearing_deg(cy.current.lat, cy.current.lon, vessel.lat, vessel.lon)
    pts = [p for c in data.cyclones for p in c.relevant_points(now)]
    need = CFG["cyclone_red_port_km"] + CFG["hold_extra_km"]
    dist = 0.0
    while dist < 2500:
        dist += 50
        lat, lon = destination_point(vessel.lat, vessel.lon, brg, dist)
        if min(haversine_km(p.lat, p.lon, lat, lon) for p in pts) >= need:
            break
    return destination_point(vessel.lat, vessel.lon, brg, dist), round(brg, 0)


def assess_voyage(vessel: Vessel, destination: str, data: RiskData,
                  is_port_compatible: Optional[Callable[[Vessel, Port], bool]] = None,
                  auto_apply: Optional[Callable[["Decision"], None]] = log_auto_reroute,
                  now: Optional[datetime] = None) -> Decision:
    now = now or datetime.now(timezone.utc)
    dest = PORTS[destination]
    cyc = cyclone_red_alerts(vessel, dest, data, now)
    other = _other_reasons(vessel, dest, data, now, is_port_compatible)
    reasons = cyc + other
    dec = Decision(destination=destination, action="PROCEED", requires_user_decision=False,
                   reasons=reasons, data_gaps=list(data.gaps), generated_at=now.isoformat())
    dec.reason_types = sorted({r.type for r in reasons}, key=["CYCLONE", "PORT_ISSUE", "TRAFFIC"].index)
    if not reasons:
        return dec

    forced = bool(cyc)
    dec.action = "AUTO_REROUTE" if forced else "SUGGEST_REROUTE"
    dec.requires_user_decision = not forced

    # Rank diversion ports
    clean: List[Tuple[float, Alternate]] = []
    fallback: List[Tuple[Tuple[int, float], Alternate]] = []
    for name, p in PORTS.items():
        if name == destination:
            continue
        if is_port_compatible and not is_port_compatible(vessel, p):
            continue
        if cyclone_red_alerts(vessel, p, data, now, alternate=True):
            continue                                   # never divert into the cyclone
        rs = _other_reasons(vessel, p, data, now, is_port_compatible)
        dist = round(haversine_km(vessel.lat, vessel.lon, p.lat, p.lon), 0)
        alt = Alternate(name, dist, "; ".join(r.headline for r in rs) or "No active risk detected")
        if rs:
            fallback.append(((len(rs), dist), alt))
        else:
            clean.append((dist, alt))
    clean.sort(key=lambda x: x[0])
    fallback.sort(key=lambda x: x[0])
    ranked = [a for _, a in clean]
    if forced:
        ranked += [a for _, a in fallback]             # at any cost: a lesser-evil port beats staying on course
    dec.alternates = ranked[:3]

    if forced and data.cyclones:
        hold, brg = _holding_point(vessel, data, now)
        dec.steer_away_bearing_deg = brg
        if ranked:
            dec.recommended_port = ranked[0].port
            tgt = PORTS[ranked[0].port]
            dec.new_route_waypoints = [(round(a, 4), round(b, 4)) for a, b in
                                       route_points((vessel.lat, vessel.lon), (tgt.lat, tgt.lon), 8)]
        else:
            dec.safe_holding_point = hold
            dec.new_route_waypoints = [(vessel.lat, vessel.lon), hold]
    elif ranked and not forced:
        dec.recommended_port = ranked[0].port if clean else None
        if dec.recommended_port:
            tgt = PORTS[dec.recommended_port]
            dec.new_route_waypoints = [(round(a, 4), round(b, 4)) for a, b in
                                       route_points((vessel.lat, vessel.lon), (tgt.lat, tgt.lon), 8)]
    if not dec.recommended_port and not dec.safe_holding_point:
        dec.data_gaps.append("No risk-free alternate port found - escalate to the operations desk.")

    if forced and auto_apply:
        try:
            auto_apply(dec)
        except Exception as e:
            dec.data_gaps.append(f"Auto-apply hook failed (reroute still issued): {e}")
    return dec


# --------------------------------------------------------------------------
# Presentation
# --------------------------------------------------------------------------
def render(dec: Decision) -> str:
    tty = sys.stdout.isatty()
    red, rst = ("\033[1;91m", "\033[0m") if tty else ("", "")
    lines = []
    if dec.action == "AUTO_REROUTE":
        lines.append(f"{red}*** CYCLONE RED ALERT - AUTOMATIC REROUTE (no user decision) ***{rst}")
    elif dec.action == "SUGGEST_REROUTE":
        lines.append("REROUTE SUGGESTED - user decision required")
    else:
        lines.append("PROCEED - no cyclone, port or traffic risk detected")
    lines.append(f"Destination: {dec.destination}   Reason type(s): "
                 f"{', '.join(REASON_LABEL[t] for t in dec.reason_types) or '-'}")
    for r in dec.reasons:
        lines.append(f"\n  [{r.label}] {r.headline}\n      {r.detail}  (source: {r.source})")
    if dec.recommended_port:
        lines.append(f"\nDivert to: {dec.recommended_port}")
        for a in dec.alternates:
            lines.append(f"  - {a.port}: {a.distance_km:.0f} km - {a.note}")
    if dec.safe_holding_point:
        lines.append(f"\nNo safe port reachable: proceed to holding point {dec.safe_holding_point} "
                     f"(verify navigable water with the master).")
    if dec.steer_away_bearing_deg is not None:
        lines.append(f"Immediate heading away from cyclone: {dec.steer_away_bearing_deg:.0f} deg true")
    if dec.data_gaps:
        lines.append("\nData gaps (unknown, NOT safe):")
        lines += [f"  ! {g}" for g in dec.data_gaps]
    return "\n".join(lines)


def to_json(dec: Decision) -> str:
    return json.dumps(asdict(dec), indent=2, default=str)


# --------------------------------------------------------------------------
# Offline logic test (fixtures live ONLY here; the pipeline never uses them)
# --------------------------------------------------------------------------
def selftest() -> None:
    now = datetime(2026, 10, 1, 6, 0, tzinfo=timezone.utc)
    v = Vessel(lat=17.5, lon=85.5, draft_m=12.0)
    noop = lambda dec: None

    def cy(lat, lon, fc=()):
        pts = [TrackPoint(lat, lon, now, 130, "observed", "VERY SEVERE CYCLONIC STORM")]
        pts += [TrackPoint(a, b, now + timedelta(hours=h), 120, "forecast") for a, b, h in fc]
        return Cyclone("TEST", pts, "IMD")

    # 1. Cyclone near Paradip -> AUTO, no user decision, reason CYCLONE
    d = RiskData(cyclones=[cy(19.0, 86.0)])
    dec = assess_voyage(v, "Paradip", d, auto_apply=noop, now=now)
    assert dec.action == "AUTO_REROUTE" and not dec.requires_user_decision
    assert dec.reason_types == ["CYCLONE"] and dec.recommended_port not in (None, "Paradip")
    assert dec.steer_away_bearing_deg is not None
    print("PASS 1 cyclone -> automatic reroute\n" + render(dec) + "\n")

    # 2. Cyclone far now, FORECAST track hits Visakhapatnam -> AUTO
    d = RiskData(cyclones=[cy(12.0, 90.0, fc=[(17.5, 83.5, 36)])])
    dec = assess_voyage(Vessel(19.5, 86.5), "Visakhapatnam", d, auto_apply=noop, now=now)
    assert dec.action == "AUTO_REROUTE", dec.action
    print("PASS 2 forecast track triggers red alert")

    # 3. Port inside IMD cone of uncertainty polygon -> AUTO
    cone = {"type": "MultiPolygon", "coordinates": [[[[83.0, 17.4], [83.6, 17.4], [83.6, 18.0], [83.0, 18.0], [83.0, 17.4]]]]}
    d = RiskData(cyclones=[cy(8.0, 92.0)], zones={"cone": cone})
    dec = assess_voyage(Vessel(19.5, 86.5), "Visakhapatnam", d, auto_apply=noop, now=now)
    assert dec.action == "AUTO_REROUTE"
    print("PASS 3 cone of uncertainty triggers red alert")

    # 4. Traffic congestion -> SUGGEST, reason TRAFFIC, user decides
    d = RiskData(congestion={"Paradip": {"waiting": 9, "type_unknown": 0, "window_s": 240}})
    dec = assess_voyage(v, "Paradip", d, now=now)
    assert dec.action == "SUGGEST_REROUTE" and dec.requires_user_decision and dec.reason_types == ["TRAFFIC"]
    print("PASS 4 congestion -> suggested reroute (TRAFFIC)")

    # 5. Port closure notice -> SUGGEST, reason PORT_ISSUE
    d = RiskData(notices=[{"port": "Paradip", "type": "closure", "valid_until": "2026-10-05T00:00:00+00:00",
                           "details": "test notice", "source": "test"}])
    dec = assess_voyage(v, "Paradip", d, now=now)
    assert dec.action == "SUGGEST_REROUTE" and dec.reason_types == ["PORT_ISSUE"]
    print("PASS 5 port notice -> suggested reroute (PORT_ISSUE)")

    # 6. IMD port warning + Google gusts -> PORT_ISSUE
    d = RiskData(imd_port_warnings={"Paradip": "Signal No. 5"},
                 weather={"Paradip": {"max_gust_kmh": 80, "max_wind_kmh": 50, "max_thunder_pct": 20, "at": "x"}})
    dec = assess_voyage(v, "Paradip", d, now=now)
    assert dec.action == "SUGGEST_REROUTE" and len([r for r in dec.reasons if r.type == "PORT_ISSUE"]) == 2
    print("PASS 6 IMD warning + gusts -> PORT_ISSUE")

    # 7. Cyclone + congestion together -> cyclone forces, both reasons listed
    d = RiskData(cyclones=[cy(19.0, 86.0)],
                 congestion={"Paradip": {"waiting": 12, "type_unknown": 0, "window_s": 240}})
    dec = assess_voyage(v, "Paradip", d, auto_apply=noop, now=now)
    assert dec.action == "AUTO_REROUTE" and dec.reason_types == ["CYCLONE", "TRAFFIC"]
    print("PASS 7 cyclone overrides, all reasons shown")

    # 8. No port acceptable -> still a forced route change (safe holding point)
    d = RiskData(cyclones=[cy(19.0, 86.0)])
    dec = assess_voyage(v, "Paradip", d, is_port_compatible=lambda ves, p: False, auto_apply=noop, now=now)
    assert dec.action == "AUTO_REROUTE" and dec.safe_holding_point is not None
    print("PASS 8 no port -> automatic safe holding point")

    # 9. Clear
    dec = assess_voyage(v, "Paradip", RiskData(), now=now)
    assert dec.action == "PROCEED" and dec.reasons == []
    print("PASS 9 clear\nAll self-tests passed.")


def main() -> None:
    ap = argparse.ArgumentParser(description="Puhar Risk Mitigation model")
    ap.add_argument("--lat", type=float)
    ap.add_argument("--lon", type=float)
    ap.add_argument("--dest", choices=list(PORTS))
    ap.add_argument("--draft", type=float)
    ap.add_argument("--eta", help="ISO ETA, e.g. 2026-10-02T06:00:00+00:00")
    ap.add_argument("--notices", default=NOTICES_PATH)
    ap.add_argument("--skip-ais", action="store_true")
    ap.add_argument("--json", action="store_true")
    ap.add_argument("--selftest", action="store_true")
    a = ap.parse_args()
    if a.selftest:
        selftest()
        return
    if None in (a.lat, a.lon, a.dest):
        ap.error("--lat, --lon and --dest are required")
    vessel = Vessel(a.lat, a.lon, a.draft, datetime.fromisoformat(a.eta) if a.eta else None)
    data = gather(list(PORTS.values()), a.notices, a.skip_ais)
    dec = assess_voyage(vessel, a.dest, data)
    print(to_json(dec) if a.json else render(dec))


if __name__ == "__main__":
    main()