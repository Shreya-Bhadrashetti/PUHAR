# backend/db/seed.py
import sqlite3
import csv

conn = sqlite3.connect("backend/db/charter_advisor.db")
cursor = conn.cursor()

with open("data/cleaned/port_export_commodities.csv", "r", encoding="utf-8") as f:
    reader = csv.DictReader(f)
    rows = [
        (
            row["port_name"],
            row["export_commodity"],
            row["annual_export_volume_documented"],
            row["typical_destination_region"],
            row["source_confidence"],
            row["notes"],
        )
        for row in reader
    ]

cursor.executemany(
    """INSERT INTO port_export_commodities
       (port_name, export_commodity, annual_export_volume_documented,
        typical_destination_region, source_confidence, notes)
       VALUES (?, ?, ?, ?, ?, ?)""",
    rows,
)

conn.commit()
conn.close()
print(f"Loaded {len(rows)} rows into port_export_commodities.")

# add to seed.py, or run separately
vessel_ranges = [
    ("Handysize", 10000, 35000),
    ("Supramax", 50000, 60000),
    ("Panamax", 60000, 80000),
    ("Capesize", 150000, 180000),
]

cursor.executemany(
    "INSERT INTO vessel_capacity_ranges (vessel_type, capacity_min_tons, capacity_max_tons) VALUES (?, ?, ?)",
    vessel_ranges,
)
conn.commit()