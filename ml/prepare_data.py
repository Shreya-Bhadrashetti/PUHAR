import pandas as pd
from sqlalchemy import create_engine
from pathlib import Path
import sys

# Allow importing backend/app modules
sys.path.append(str(Path(__file__).resolve().parents[1] / "backend"))

from app.core.config import settings


# --------------------------------------------------
# 1. CONNECT TO POSTGRESQL
# --------------------------------------------------

engine = create_engine(settings.DATABASE_URL)

print("Connecting to PostgreSQL...")


# --------------------------------------------------
# 2. LOAD FREIGHT DATA
# --------------------------------------------------

freight_query = """
SELECT
    date,
    route,
    vessel_type,
    rate_usd_per_ton,
    bdi_index
FROM freight_rates
ORDER BY date;
"""

freight = pd.read_sql(freight_query, engine)

print(f"Freight records loaded: {len(freight)}")


# --------------------------------------------------
# 3. LOAD BDI DATA
# --------------------------------------------------

bdi_query = """
SELECT
    date,
    bdi_index
FROM bdi_history
ORDER BY date;
"""

bdi = pd.read_sql(bdi_query, engine)

print(f"BDI records loaded: {len(bdi)}")


# --------------------------------------------------
# 4. PREPARE DATE FEATURES
# --------------------------------------------------

freight["date"] = pd.to_datetime(freight["date"])

freight["year"] = freight["date"].dt.year
freight["month"] = freight["date"].dt.month
freight["day"] = freight["date"].dt.day
freight["day_of_week"] = freight["date"].dt.dayofweek


# --------------------------------------------------
# 5. CREATE FREIGHT LAG FEATURES
# --------------------------------------------------

freight = freight.sort_values(
    ["route", "vessel_type", "date"]
)

freight["freight_lag_1"] = (
    freight
    .groupby(["route", "vessel_type"])["rate_usd_per_ton"]
    .shift(1)
)

freight["freight_lag_7"] = (
    freight
    .groupby(["route", "vessel_type"])["rate_usd_per_ton"]
    .shift(7)
)


# --------------------------------------------------
# 6. CREATE BDI LAG FEATURES
# --------------------------------------------------

bdi["date"] = pd.to_datetime(bdi["date"])

bdi = bdi.sort_values("date")

bdi["bdi_lag_1"] = bdi["bdi_index"].shift(1)
bdi["bdi_lag_7"] = bdi["bdi_index"].shift(7)

# --------------------------------------------------
# 7. MERGE BDI WITH FREIGHT
# --------------------------------------------------

bdi_features = bdi[
    [
        "date",
        "bdi_index",
        "bdi_lag_1",
        "bdi_lag_7"
    ]
]

data = freight.drop(
    columns=["bdi_index"]
).merge(
    bdi_features,
    on="date",
    how="left"
)


# --------------------------------------------------
# 8. REMOVE MISSING VALUES
# --------------------------------------------------

data = data.dropna(
    subset=[
        "rate_usd_per_ton",
        "freight_lag_1",
        "freight_lag_7",
        "bdi_index",
        "bdi_lag_1",
        "bdi_lag_7"
    ]
)


# --------------------------------------------------
# 9. SAVE ML DATASET
# --------------------------------------------------

output_dir = Path("backend/freight_forecasting/data")
output_dir.mkdir(parents=True, exist_ok=True)

output_file = output_dir / "freight_training_data.csv"

data.to_csv(
    output_file,
    index=False
)


# --------------------------------------------------
# 10. SHOW RESULT
# --------------------------------------------------

print()
print("=" * 60)
print("ML DATA PREPARATION COMPLETED")
print("=" * 60)

print(f"Final records: {len(data)}")
print(f"Columns: {list(data.columns)}")
print(f"Saved to: {output_file}")

print()
print(data.head())