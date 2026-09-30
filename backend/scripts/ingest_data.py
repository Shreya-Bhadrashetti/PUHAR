from pathlib import Path
import pandas as pd

from app.core.database import engine


# ============================================================
# PATH
# ============================================================

DATA_DIR = Path(__file__).resolve().parents[2] / "data" / "cleaned"


# ============================================================
# COMMON HELPERS
# ============================================================

def read_csv(filename):
    path = DATA_DIR / filename

    if not path.exists():
        print(f"[ERROR] File not found: {filename}")
        return None

    try:
        df = pd.read_csv(path)
        print(f"[READ] {filename}: {len(df)} rows")
        return df
    except Exception as e:
        print(f"[ERROR] Could not read {filename}: {e}")
        return None


def clean_dataframe(df):
    df = df.copy()

    df.columns = [
        str(col)
        .strip()
        .lower()
        .replace(" ", "_")
        .replace("%", "pct")
        .replace(".", "")
        for col in df.columns
    ]

    return df

def load_table(df, table_name):
    if df is None or df.empty:
        print(f"[SKIP] {table_name} - no data")
        return

    print(f"[LOAD] {table_name}: {len(df)} rows")

    df.to_sql(
        table_name,
        engine,
        if_exists="append",
        index=False,
        chunksize=500
    )

    print(f"[OK] {table_name}: {len(df)} rows loaded")


# ============================================================
# PORTS
# ============================================================

def ingest_ports():
    df = read_csv("port_constraints.csv")

    if df is None:
        return

    df = clean_dataframe(df)

    ports = df[
        [
            "port_name",
            "port_code",
            "state"
        ]
    ].copy()

    ports = ports.rename(
        columns={
            "port_name": "name"
        }
    )

    ports["country"] = "India"

    # Avoid duplicate ports
    existing = pd.read_sql(
        "SELECT port_code FROM ports",
        engine
    )

    ports = ports[
        ~ports["port_code"].isin(existing["port_code"])
    ]

    if not ports.empty:
        load_table(
            ports[
                [
                    "name",
                    "port_code",
                    "country",
                    "state"
                ]
            ],
            "ports"
        )
    else:
        print("[SKIP] ports already loaded")


# ============================================================
# PORT CONSTRAINTS
# ============================================================

def ingest_port_constraints():
    df = read_csv("port_constraints.csv")

    if df is None:
        return

    df = clean_dataframe(df)

    ports = pd.read_sql(
        "SELECT id, port_code FROM ports",
        engine
    )

    constraints = df.merge(
        ports,
        on="port_code",
        how="left"
    )

    constraints = constraints.rename(
        columns={
            "id": "port_id"
        }
    )

    constraints = constraints[
        [
            "port_id",
            "max_draft_m",
            "max_loa_m",
            "max_beam_m",
            "max_dwt",
            "handling_rate_tons_per_day",
            "berth_count",
            "has_mechanized_handling",
            "tidal_restriction"
        ]
    ]

    constraints = constraints.dropna(
        subset=["port_id"]
    )

    constraints["port_id"] = (
        constraints["port_id"]
        .astype(int)
    )

    existing = pd.read_sql(
        "SELECT port_id FROM port_constraints",
        engine
    )

    constraints = constraints[
        ~constraints["port_id"].isin(
            existing["port_id"]
        )
    ]

    if not constraints.empty:
        load_table(
            constraints,
            "port_constraints"
        )
    else:
        print("[SKIP] port_constraints already loaded")


# ============================================================
# CARGO
# ============================================================

def ingest_cargo():
    df = read_csv("export_commodities.csv")

    if df is None:
        return

    df = clean_dataframe(df)

    df = df[
        [
            "port_name",
            "commodity",
            "annual_volume_mt",
            "typical_vessel_size_dwt",
            "primary_destinations"
        ]
    ]

    load_table(df, "cargo")


# ============================================================
# COMMODITY PRICES
# ============================================================

def ingest_commodity_prices():
    df = read_csv("commodity_prices.csv")

    if df is None:
        return

    df = clean_dataframe(df)

    df["date"] = pd.to_datetime(
        df["date"],
        errors="coerce"
    ).dt.date

    df = df[
        [
            "date",
            "commodity",
            "price_usd",
            "unit",
            "source"
        ]
    ]

    df = df.dropna(subset=["date"])

    load_table(df, "commodity_prices")


# ============================================================
# ROUTES
# ============================================================

def ingest_routes():
    df = read_csv(
        "dataset_7_route_distances_cleaned.csv.xls"
    )

    if df is None:
        return

    df = clean_dataframe(df)

    df = df[
        [
            "origin_port",
            "destination_port",
            "distance_nm",
            "route_type"
        ]
    ]

    load_table(df, "routes")


# ============================================================
# FREIGHT RATES
# ============================================================

def ingest_freight_rates():
    df = read_csv("freight_rate_history.csv")

    if df is None:
        return

    df = clean_dataframe(df)

    df["date"] = pd.to_datetime(
        df["date"],
        errors="coerce"
    ).dt.date

    df = df[
        [
            "date",
            "route",
            "vessel_type",
            "rate_usd_per_ton",
            "bdi_index",
            "source"
        ]
    ]

    df = df.dropna(subset=["date"])

    load_table(df, "freight_rates")


# ============================================================
# BDI
# ============================================================

def ingest_bdi():
    df = read_csv("bdi_history.csv")

    if df is None:
        return

    df = clean_dataframe(df)

    df["date"] = pd.to_datetime(
        df["date"],
        errors="coerce"
    ).dt.date

    df = df[
        [
            "date",
            "bdi_index",
            "source"
        ]
    ]

    df = df.dropna(subset=["date"])

    load_table(df, "bdi_history")


# ============================================================
# FUEL PRICES
# ============================================================

def ingest_fuel():
    df = read_csv(
        "dataset_9_bunker_fuel_prices_cleaned.csv.xls"
    )

    if df is None:
        return

    df = clean_dataframe(df)

    df["date"] = pd.to_datetime(
        df["date"],
        errors="coerce"
    ).dt.date

    df = df[
        [
            "date",
            "hub",
            "fuel_type",
            "price_usd_per_tonne",
            "source_note"
        ]
    ]

    df = df.dropna(subset=["date"])

    load_table(df, "fuel_prices")


# ============================================================
# MACRO PRICES
# ============================================================

def ingest_macro():
    files = [
        (
            "dataset_2_macro_brent_oil_daily_cleaned.csv.xls",
            "Brent Oil"
        ),
        (
            "dataset_2_macro_coal_newcastle_daily_cleaned.csv.xls",
            "Newcastle Coal"
        ),
        (
            "dataset_2_macro_dxy_usd_index_cleaned.csv.xls",
            "DXY USD Index"
        ),
        (
            "dataset_2_macro_iron_ore_daily_cleaned.csv.xls",
            "Iron Ore"
        )
    ]

    all_data = []

    for filename, indicator_name in files:

        df = read_csv(filename)

        if df is None:
            continue

        df = clean_dataframe(df)

        df["indicator"] = indicator_name

        if "vol" in df.columns:
            df = df.rename(
                columns={"vol": "volume"}
            )

        required = [
            "date",
            "indicator",
            "price",
            "open",
            "high",
            "low",
            "volume",
            "change_pct"
        ]

        for col in required:
            if col not in df.columns:
                df[col] = None

        df["date"] = pd.to_datetime(
            df["date"],
            errors="coerce"
        ).dt.date

        df = df.rename(
            columns={
                "open": "open_price",
                "high": "high_price",
                "low": "low_price"
            }
        )

        df = df[
            [
                "date",
                "indicator",
                "price",
                "open_price",
                "high_price",
                "low_price",
                "volume",
                "change_pct"
            ]
        ]

        all_data.append(df)

    if all_data:
        final_df = pd.concat(
            all_data,
            ignore_index=True
        )

        final_df = final_df.dropna(
            subset=["date"]
        )

        load_table(
            final_df,
            "macro_prices"
        )


# ============================================================
# PORT TRAFFIC
# ============================================================

def ingest_port_traffic():
    df = read_csv(
        "dataset_5_port_traffic_timeseries_cleaned.csv.xls"
    )

    if df is None:
        return

    df = clean_dataframe(df)

    df["date"] = pd.to_datetime(
        df["date"],
        errors="coerce"
    ).dt.date

    df = df[
        [
            "date",
            "port_name",
            "country",
            "port_type",
            "waiting_days_at_anchorage",
            "waiting_days_at_berth",
            "turn_around_time_days",
            "berth_occupancy_pct",
            "vessels_at_anchorage",
            "source_note"
        ]
    ]

    df = df.dropna(subset=["date"])

    load_table(df, "port_traffic")


# ============================================================
# WEATHER RISK
# ============================================================

def ingest_weather():
    df = read_csv(
        "dataset_6_weather_risk_flags_cleaned.csv.xls"
    )

    if df is None:
        return

    df = clean_dataframe(df)

    df["date"] = pd.to_datetime(
        df["date"],
        errors="coerce"
    ).dt.date

    df = df[
        [
            "date",
            "port_name",
            "country",
            "region_cluster",
            "monsoon_risk_level",
            "cyclone_risk_level",
            "typical_disruption_days",
            "notes"
        ]
    ]

    df = df.dropna(subset=["date"])

    load_table(df, "weather_risk")


# ============================================================
# DISRUPTIONS
# ============================================================

def ingest_disruptions():
    df = read_csv(
        "dataset_8_disruption_events_cleaned.csv.xls"
    )

    if df is None:
        return

    df = clean_dataframe(df)

    df["event_date"] = pd.to_datetime(
        df["event_date"],
        errors="coerce"
    ).dt.date

    df = df[
        [
            "event_date",
            "port_name",
            "country",
            "event_type",
            "impact_days",
            "notes"
        ]
    ]

    df = df.dropna(
        subset=["event_date"]
    )

    load_table(
        df,
        "disruptions"
    )


# ============================================================
# MAIN
# ============================================================

if __name__ == "__main__":

    print("=" * 60)
    print("PUHAR DATA INGESTION STARTED")
    print("=" * 60)

    ingest_ports()
    ingest_port_constraints()
    ingest_cargo()
    ingest_commodity_prices()
    ingest_routes()
    ingest_freight_rates()
    ingest_bdi()
    ingest_fuel()
    ingest_macro()
    ingest_port_traffic()
    ingest_weather()
    ingest_disruptions()

    print("=" * 60)
    print("PUHAR DATA INGESTION COMPLETED")
    print("=" * 60)