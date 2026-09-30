import csv
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
CSV_PATH = ROOT / "data" / "cleaned" / "port_export_commodities.csv"


def find_backhaul_match(destination_port, origin_region, db_path=None):
    """Match documented export commodities at destination against the origin region.

    `db_path` is accepted for test compatibility; the cleaned CSV is the source of truth.
    """
    source = Path(db_path) if db_path else CSV_PATH
    matches = []
    origin = (origin_region or "").lower()
    if source.suffix.lower() == ".csv" or not source.exists() or source.suffix.lower() != ".db":
        csv_file = source if source.suffix.lower() == ".csv" else CSV_PATH
        with csv_file.open(encoding="utf-8-sig", newline="") as handle:
            for row in csv.DictReader(handle):
                confidence = row.get("source_confidence") or ""
                if confidence.startswith("Low"):
                    continue
                if (row.get("port_name") or "") != destination_port:
                    continue
                dest_region = row.get("typical_destination_region") or ""
                if dest_region and origin in dest_region.lower():
                    matches.append(
                        {
                            "commodity": row.get("export_commodity"),
                            "destination_region": dest_region,
                            "confidence": confidence,
                        }
                    )
        return matches

    import sqlite3

    conn = sqlite3.connect(source)
    cursor = conn.cursor()
    cursor.execute(
        """SELECT export_commodity, typical_destination_region, source_confidence
           FROM port_export_commodities
           WHERE port_name = ? AND source_confidence NOT LIKE 'Low%'""",
        (destination_port,),
    )
    rows = cursor.fetchall()
    conn.close()
    for commodity, dest_region, confidence in rows:
        if dest_region and origin in dest_region.lower():
            matches.append(
                {
                    "commodity": commodity,
                    "destination_region": dest_region,
                    "confidence": confidence,
                }
            )
    return matches
