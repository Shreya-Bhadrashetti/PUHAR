#!/usr/bin/env python3
"""
Live check of every data source. Run this FIRST, even with an empty .env:
    (from backend/)  python -m services.risk_mitigation.check_setup

REQUIRED checks use free, keyless sources and must pass for the model to work at all.
OPTIONAL checks (IMD, Google Weather, AISStream) upgrade accuracy but are skipped
gracefully if their key is missing or the service is unreachable - the model still
runs on GDACS + Open-Meteo alone.

Prints PASS / FAIL per source plus the raw field names it saw, so any mismatch with
the real API response is visible immediately.
"""
import asyncio
import os
import sys

import requests

try:
    from . import engine as rm
except ImportError:      # run directly as a script
    from backend.services.risk_mitigation import engine as rm

required_results = []
optional_results = []


def line(ok, name, msg="", required=True):
    tag = "REQUIRED" if required else "optional"
    print(f"[{'PASS' if ok else 'FAIL'}] ({tag}) {name}  {msg}")
    (required_results if required else optional_results).append(ok)
    return ok


def main() -> int:
    # -------------------- REQUIRED: keyless sources --------------------

    # 1. GDACS - cyclone track, forecast points, hazard-zone polygons. No key.
    d = rm.RiskData()
    cy = rm.fetch_gdacs_cyclones(d)
    detail = f"{len(cy)} active cyclone(s) in region"
    if cy:
        c0 = cy[0]
        zones = [n for n in ("hazard_green", "hazard_orange", "hazard_red") if getattr(c0, n)]
        detail += f"; e.g. {c0.name}: {len(c0.track)} track points, zones: {zones or 'none'}"
    line(not d.gaps, "GDACS cyclone track + zones", f"{detail}; gaps: {d.gaps}")

    # 2. Open-Meteo - port wind, gusts, thunderstorm proxy. No key.
    d = rm.RiskData()
    w = rm.fetch_open_meteo_weather(rm.PORTS["Paradip"], d)
    line(w is not None, "Open-Meteo port weather", str(w or d.gaps))

    # 3. Open-Meteo marine - wave height. No key.
    d = rm.RiskData()
    rm.fetch_waves(rm.PORTS["Paradip"], d)
    line(bool(d.waves), "Open-Meteo waves", str(d.waves or d.gaps))

    # -------------------- OPTIONAL: upgrades if you add a key --------------------

    # 4. IMD cyclone track (replaces/enriches GDACS if reachable)
    imd_key = os.environ.get("IMD_API_KEY")
    if not imd_key:
        line(False, "IMD cyclone_track", "IMD_API_KEY not set - skipping (GDACS covers this)", required=False)
    else:
        try:
            j = rm.imd_get("cyclone_track")
            keys = list((j.get("data") or {}).keys()) if isinstance(j, dict) else "n/a"
            active = bool(j.get("status")) if isinstance(j, dict) else False
            line(True, "IMD cyclone_track", f"reachable; active cyclone: {active}; data keys: {keys}",
                required=False)
            if active:
                row = ((j.get("data") or {}).get("forecast") or (j.get("data") or {}).get("observed") or [{}])[0]
                print("      sample row fields:", list(row.keys()))
        except Exception as e:
            line(False, "IMD cyclone_track", f"{e}  -> check IMD_API_KEY / IMD_AUTH_MODE / IMD_AUTH_NAME",
                required=False)

        for ep in ("portwarning", "coastalbulletin"):
            try:
                j = rm.imd_get(ep)
                rows = j if isinstance(j, list) else (j or {}).get("data", [])
                first = rows[0] if rows else {}
                line(True, f"IMD {ep}", f"{len(rows)} rows; fields: {list(first.keys())}", required=False)
            except Exception as e:
                line(False, f"IMD {ep}", str(e), required=False)

    # 5. Google Weather (replaces Open-Meteo per-port if reachable)
    key = os.environ.get("GOOGLE_MAPS_API_KEY")
    if not key:
        line(False, "Google Weather", "GOOGLE_MAPS_API_KEY not set - skipping (Open-Meteo covers this)",
            required=False)
    else:
        try:
            p = rm.PORTS["Paradip"]
            r = requests.get(rm.GOOGLE_WX, params={"key": key, "location.latitude": p.lat,
                             "location.longitude": p.lon, "hours": 3, "unitsSystem": "METRIC"}, timeout=20)
            r.raise_for_status()
            h = r.json()["forecastHours"][0]
            wind = h.get("wind")
            line(bool(wind), "Google Weather", f"wind field: {wind}", required=False)
        except Exception as e:
            line(False, "Google Weather", f"{e}  -> is 'Weather API' enabled + billing on?", required=False)

    # 6. AISStream (traffic congestion - no free substitute, so this stays optional
    #    but the model still returns cyclone/port-issue decisions without it)
    akey = os.environ.get("AISSTREAM_API_KEY")
    if not akey:
        line(False, "AISStream", "AISSTREAM_API_KEY not set - traffic congestion will be skipped",
            required=False)
    else:
        try:
            res = asyncio.run(rm._collect_ais([rm.PORTS["Paradip"], rm.PORTS["Visakhapatnam"]], akey, 20))
            line(True, "AISStream", f"connected; 20 s sample: {res}", required=False)
        except Exception as e:
            line(False, "AISStream", str(e), required=False)

    ok_required = all(required_results) if required_results else True
    print(f"\nRequired:  {sum(required_results)}/{len(required_results)} passed "
          f"({'model will run' if ok_required else 'model WILL NOT run - fix these'})")
    print(f"Optional:  {sum(optional_results)}/{len(optional_results)} passed "
          f"(missing ones just mean lower-precision fallback data is used)")
    return 0 if ok_required else 1


if __name__ == "__main__":
    sys.exit(main())