# backend/db/verify.py
import sqlite3

conn = sqlite3.connect("backend/db/charter_advisor.db")
cursor = conn.cursor()
cursor.execute("SELECT * FROM port_export_commodities WHERE port_name = 'Paradip'")
for row in cursor.fetchall():
    print(row)
conn.close()