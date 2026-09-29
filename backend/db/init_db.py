# backend/db/init_db.py
import sqlite3

conn = sqlite3.connect("backend/db/charter_advisor.db")
cursor = conn.cursor()

cursor.execute("""
CREATE TABLE IF NOT EXISTS port_export_commodities (
    port_name TEXT,
    export_commodity TEXT,
    annual_export_volume_documented TEXT,
    typical_destination_region TEXT,
    source_confidence TEXT,
    notes TEXT
)
""")

cursor.execute("""
CREATE TABLE IF NOT EXISTS vessel_capacity_ranges (
    vessel_type TEXT,
    capacity_min_tons INTEGER,
    capacity_max_tons INTEGER
)
""")

cursor.execute("""
CREATE TABLE IF NOT EXISTS port_constraints (
    port_name TEXT,
    max_draft_m REAL,
    max_loa_m REAL,
    max_beam_m REAL,
    cargo_handling_rate_tons_per_day INTEGER
)
""")

conn.commit()
conn.close()
print("Database initialized.")