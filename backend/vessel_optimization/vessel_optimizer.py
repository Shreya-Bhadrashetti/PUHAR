from pathlib import Path

import pandas as pd
from sqlalchemy import create_engine

from app.core.config import settings

engine = create_engine(settings.DATABASE_URL)


# --------------------------------------------------
# PROTOTYPE VESSEL ASSUMPTIONS
# --------------------------------------------------

VESSEL_ASSUMPTIONS = {
    "Handysize": {
        "speed_knots": 12.0,
        "fuel_tonnes_per_day": 20.0,
        "idle_cost_per_day": 12000.0
    },
    "Supramax": {
        "speed_knots": 12.5,
        "fuel_tonnes_per_day": 25.0,
        "idle_cost_per_day": 15000.0
    },
    "Panamax": {
        "speed_knots": 13.0,
        "fuel_tonnes_per_day": 30.0,
        "idle_cost_per_day": 18000.0
    },
    "Capesize": {
        "speed_knots": 14.0,
        "fuel_tonnes_per_day": 45.0,
        "idle_cost_per_day": 25000.0
    }
}


# --------------------------------------------------
# GET LATEST FUEL PRICE
# --------------------------------------------------

def get_latest_fuel_price():

    query = """
        SELECT DISTINCT ON (fuel_type)
            fuel_type,
            date,
            price_usd_per_tonne
        FROM fuel_prices
        WHERE hub = 'Singapore'
        ORDER BY fuel_type, date DESC
    """

    fuel = pd.read_sql(query, engine)

    hsfo = fuel[
        fuel["fuel_type"].str.upper() == "HSFO"
    ]

    if hsfo.empty:
        return None

    return float(
        hsfo.iloc[0]["price_usd_per_tonne"]
    )


# --------------------------------------------------
# GET ROUTE
# --------------------------------------------------

def get_route_distance(origin_port, destination_port):

    query = """
        SELECT
            distance_nm,
            route_type
        FROM routes
        WHERE LOWER(origin_port) = LOWER(%(origin)s)
        AND LOWER(destination_port) = LOWER(%(destination)s)
        LIMIT 1
    """

    route = pd.read_sql(
        query,
        engine,
        params={
            "origin": origin_port,
            "destination": destination_port
        }
    )

    if route.empty:
        return None

    return {
        "distance_nm": float(
            route.iloc[0]["distance_nm"]
        ),
        "route_type": route.iloc[0]["route_type"]
    }


# --------------------------------------------------
# GET PORT CONGESTION
# --------------------------------------------------

def get_port_congestion(destination_port):

    query = """
        SELECT
            port_name,
            AVG(waiting_days_at_anchorage)
                AS avg_anchorage_wait,
            AVG(waiting_days_at_berth)
                AS avg_berth_wait,
            AVG(berth_occupancy_pct)
                AS avg_occupancy
        FROM port_traffic
        WHERE LOWER(port_name) = LOWER(%(port)s)
        GROUP BY port_name
    """

    congestion = pd.read_sql(
        query,
        engine,
        params={"port": destination_port}
    )

    if congestion.empty:
        return None

    row = congestion.iloc[0]

    anchorage_wait = float(
        row["avg_anchorage_wait"]
    )

    berth_wait = float(
        row["avg_berth_wait"]
    )

    idle_days = (
        anchorage_wait +
        berth_wait
    )

    return {
        "anchorage_wait_days": anchorage_wait,
        "berth_wait_days": berth_wait,
        "idle_days": idle_days,
        "berth_occupancy_pct": float(
            row["avg_occupancy"]
        )
    }


# --------------------------------------------------
# VESSEL OPTIMIZER
# --------------------------------------------------

def optimize_vessel(
    cargo_quantity_mt,
    origin_port,
    destination_port
):

    # --------------------------------------------------
    # 1. LOAD VESSELS
    # --------------------------------------------------

    vessels = pd.read_sql(
        """
        SELECT
            name,
            min_dwt,
            max_dwt
        FROM vessel_types
        ORDER BY min_dwt
        """,
        engine
    )

    # --------------------------------------------------
    # 2. PORT CONSTRAINT
    # --------------------------------------------------

    port_query = """
        SELECT
            p.name AS port,
            pc.max_draft_m,
            pc.max_loa_m,
            pc.max_beam_m,
            pc.max_dwt,
            pc.handling_rate_tons_per_day,
            pc.berth_count
        FROM port_constraints pc
        JOIN ports p
            ON pc.port_id = p.id
        WHERE LOWER(p.name) = LOWER(%(port)s)
    """

    port = pd.read_sql(
        port_query,
        engine,
        params={"port": destination_port}
    )

    if port.empty:
        return {
            "status": "error",
            "message": f"Port '{destination_port}' not found"
        }

    port = port.iloc[0]

    # --------------------------------------------------
    # 3. ROUTE
    # --------------------------------------------------

    route = get_route_distance(
        origin_port,
        destination_port
    )

    if route is None:
        return {
            "status": "error",
            "message": "Route not found"
        }

    distance_nm = route["distance_nm"]

    # --------------------------------------------------
    # 4. FUEL
    # --------------------------------------------------

    fuel_price = get_latest_fuel_price()

    if fuel_price is None:
        return {
            "status": "error",
            "message": "Fuel price unavailable"
        }

    # --------------------------------------------------
    # 5. PORT CONGESTION
    # --------------------------------------------------

    congestion = get_port_congestion(
        destination_port
    )

    if congestion is None:
        return {
            "status": "error",
            "message": "Port congestion data unavailable"
        }

    # --------------------------------------------------
    # 6. EVALUATE VESSELS
    # --------------------------------------------------

    results = []

    for _, vessel in vessels.iterrows():

        vessel_name = vessel["name"]

        min_dwt = float(vessel["min_dwt"])
        max_dwt = float(vessel["max_dwt"])

        usable_capacity = min(
            max_dwt,
            float(port["max_dwt"])
        )

        feasible = (
            cargo_quantity_mt <= usable_capacity
            and min_dwt <= float(port["max_dwt"])
        )

        if not feasible:
            continue

        assumptions = VESSEL_ASSUMPTIONS.get(
            vessel_name
        )

        if assumptions is None:
            continue

        speed = assumptions["speed_knots"]

        fuel_per_day = assumptions[
            "fuel_tonnes_per_day"
        ]

        idle_cost_per_day = assumptions[
            "idle_cost_per_day"
        ]

        # --------------------------------------------------
        # SAILING
        # --------------------------------------------------

        sailing_days = (
            distance_nm /
            (speed * 24)
        )

        # --------------------------------------------------
        # FUEL
        # --------------------------------------------------

        fuel_consumed = (
            sailing_days *
            fuel_per_day
        )

        fuel_cost = (
            fuel_consumed *
            fuel_price
        )

        # --------------------------------------------------
        # PORT HANDLING
        # --------------------------------------------------

        handling_rate = float(
            port["handling_rate_tons_per_day"]
        )

        handling_days = (
            cargo_quantity_mt /
            handling_rate
            if handling_rate > 0
            else 0
        )

        # --------------------------------------------------
        # IDLE
        # --------------------------------------------------

        idle_days = congestion["idle_days"]

        idle_cost = (
            idle_days *
            idle_cost_per_day
        )

        # --------------------------------------------------
        # TOTAL VOYAGE TIME
        # --------------------------------------------------

        total_voyage_days = (
            sailing_days +
            handling_days +
            idle_days
        )

        # --------------------------------------------------
        # TOTAL COST
        # --------------------------------------------------

        total_cost = (
            fuel_cost +
            idle_cost
        )

        results.append({

            "vessel_type":
                vessel_name,

            "cargo_quantity_mt":
                cargo_quantity_mt,

            "usable_capacity":
                usable_capacity,

            "distance_nm":
                round(distance_nm, 2),

            "speed_knots":
                speed,

            "sailing_days":
                round(sailing_days, 2),

            "fuel_consumed_tonnes":
                round(fuel_consumed, 2),

            "fuel_price_usd_per_tonne":
                round(fuel_price, 2),

            "fuel_cost_usd":
                round(fuel_cost, 2),

            "anchorage_wait_days":
                round(
                    congestion[
                        "anchorage_wait_days"
                    ], 2
                ),

            "berth_wait_days":
                round(
                    congestion[
                        "berth_wait_days"
                    ], 2
                ),

            "idle_days":
                round(idle_days, 2),

            "idle_cost_per_day_usd":
                idle_cost_per_day,

            "idle_cost_usd":
                round(idle_cost, 2),

            "port_handling_days":
                round(handling_days, 2),

            "total_voyage_days":
                round(total_voyage_days, 2),

            "total_voyage_cost_usd":
                round(total_cost, 2),

            "berth_occupancy_pct":
                round(
                    congestion[
                        "berth_occupancy_pct"
                    ], 2
                )
        })

    if not results:
        return {
            "status": "no_feasible_vessel",
            "message": "No feasible vessel found"
        }

    # Smallest feasible vessel as baseline recommendation
    results.sort(
        key=lambda x: x["usable_capacity"]
    )

    return {
        "status": "success",
        "origin_port": origin_port,
        "destination_port": destination_port,
        "cargo_quantity_mt": cargo_quantity_mt,
        "recommended_vessel":
            results[0]["vessel_type"],
        "vessel_options": results
    }


# --------------------------------------------------
# TEST
# --------------------------------------------------

if __name__ == "__main__":

    result = optimize_vessel(
        cargo_quantity_mt=50000,
        origin_port="Hay Point / Dalrymple Bay",
        destination_port="Paradip"
    )

    print()
    print("=" * 70)
    print("PUHAR VESSEL + IDLE COST OPTIMIZATION")
    print("=" * 70)

    for key, value in result.items():
        print(f"\n{key}: {value}")

    print("=" * 70)