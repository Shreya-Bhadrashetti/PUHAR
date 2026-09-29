# backend/services/backhaul_matcher.py
import sqlite3
import os
DB_PATH = os.path.join(os.path.dirname(__file__), "..", "db", "charter_advisor.db")

DB_PATH = "backend/db/charter_advisor.db"

def find_backhaul_match(destination_port, origin_region, db_path=DB_PATH):
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    cursor.execute(
        """SELECT export_commodity, typical_destination_region, source_confidence
           FROM port_export_commodities
           WHERE port_name = ? AND source_confidence != 'Low - no data found'""",
        (destination_port,),
    )
    rows = cursor.fetchall()
    conn.close()

    matches = []
    for commodity, dest_region, confidence in rows:
        if dest_region and origin_region.lower() in dest_region.lower():
            matches.append({
                "commodity": commodity,
                "destination_region": dest_region,
                "confidence": confidence,
            })
    return matches