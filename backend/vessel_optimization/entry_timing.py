from pathlib import Path

import pandas as pd
from sqlalchemy import create_engine

from app.core.config import settings

from vessel_optimization.vessel_optimizer import optimize_vessel
from freight_forecasting.freight_forecaster import (
    forecast_freight,
    map_physical_route,
    check_freight_availability,
)


# --------------------------------------------------
# DATABASE
# --------------------------------------------------

engine = create_engine(settings.database_url)


# --------------------------------------------------
# GET LATEST COMMODITY PRICE
# --------------------------------------------------

def get_latest_commodity_price(commodity):

    query = """
        SELECT
            commodity,
            date,
            price_usd
        FROM commodity_prices
        WHERE LOWER(commodity) = LOWER(%(commodity)s)
        ORDER BY date DESC
        LIMIT 1
    """

    data = pd.read_sql(
        query,
        engine,
        params={"commodity": commodity}
    )

    if data.empty:
        return None

    row = data.iloc[0]

    return {
        "commodity": row["commodity"],
        "date": str(row["date"]),
        "price_usd_per_ton": float(row["price_usd"])
    }


# --------------------------------------------------
# DETERMINE COMMODITY
# --------------------------------------------------

def determine_commodity(
    origin_port,
    destination_port
):

    query = """
        SELECT route_type
        FROM routes
        WHERE LOWER(origin_port) = LOWER(%(origin)s)
        AND LOWER(destination_port) = LOWER(%(destination)s)
        LIMIT 1
    """

    data = pd.read_sql(
        query,
        engine,
        params={
            "origin": origin_port,
            "destination": destination_port
        }
    )

    if data.empty:
        return None

    route_type = str(
        data.iloc[0]["route_type"]
    ).lower()

    if "coal" in route_type:
        return "coal"

    if (
        "iron" in route_type
        or "ore" in route_type
    ):
        return "iron_ore"

    return None


# --------------------------------------------------
# 7-DAY ENTRY TIMING
# --------------------------------------------------

def analyze_entry_timing(
    cargo_quantity_mt,
    origin_port,
    destination_port
):

    print()
    print("=" * 70)
    print("PUHAR 7-DAY ENTRY TIMING ANALYSIS")
    print("=" * 70)

    # --------------------------------------------------
    # COMMODITY
    # --------------------------------------------------

    commodity = determine_commodity(
        origin_port,
        destination_port
    )

    if commodity is None:

        return {
            "status": "error",
            "message": "Commodity could not be determined"
        }

    commodity_data = get_latest_commodity_price(
        commodity
    )

    if commodity_data is None:

        return {
            "status": "error",
            "message": "Commodity price unavailable"
        }

    commodity_price = (
        commodity_data[
            "price_usd_per_ton"
        ]
    )

    # --------------------------------------------------
    # VESSEL OPTIMIZATION
    # --------------------------------------------------

    vessel_result = optimize_vessel(
        cargo_quantity_mt=cargo_quantity_mt,
        origin_port=origin_port,
        destination_port=destination_port
    )

    if vessel_result["status"] != "success":

        return vessel_result

    recommended_vessel = (
        vessel_result[
            "recommended_vessel"
        ]
    )

    # --------------------------------------------------
    # MARKET ROUTE
    # --------------------------------------------------

    market_route = map_physical_route(
        origin_port,
        destination_port
    )

    if market_route is None:

        return {
            "status": "benchmark_unavailable",
            "message": (
                "No freight market mapping available "
                "for this physical route."
            )
        }

    # --------------------------------------------------
    # FREIGHT AVAILABILITY
    # --------------------------------------------------

    availability = check_freight_availability(
        market_route,
        recommended_vessel
    )

    if not availability["available"]:

        return {
            "status": "benchmark_unavailable",
            "origin_port": origin_port,
            "destination_port": destination_port,
            "recommended_vessel": recommended_vessel,
            "market_route": market_route,
            "message": availability["message"],
            "explanation": (
                "The physically feasible vessel does not "
                "have a matching historical freight benchmark. "
                "PUHAR does not substitute another vessel's rate."
            )
        }

    # --------------------------------------------------
    # 7-DAY FREIGHT FORECAST
    # --------------------------------------------------

    freight_result = forecast_freight(
        market_route=market_route,
        vessel_type=recommended_vessel,
        days_ahead=7
    )

    if freight_result["status"] != "success":

        return freight_result

    daily_forecasts = (
        freight_result[
            "daily_forecasts"
        ]
    )

    # --------------------------------------------------
    # FIND RECOMMENDED VESSEL DETAILS
    # --------------------------------------------------

    vessel_option = None

    for option in vessel_result["vessel_options"]:

        if (
            option["vessel_type"]
            == recommended_vessel
        ):

            vessel_option = option
            break

    if vessel_option is None:

        return {
            "status": "error",
            "message": (
                "Recommended vessel details unavailable"
            )
        }

    # --------------------------------------------------
    # VESSEL COSTS
    # --------------------------------------------------

    fuel_cost = float(
        vessel_option["fuel_cost_usd"]
    )

    idle_cost = float(
        vessel_option["idle_cost_usd"]
    )

    operational_cost = (
        fuel_cost + idle_cost
    )

    # --------------------------------------------------
    # CARGO VALUE
    # --------------------------------------------------

    cargo_benchmark_value = (
        commodity_price
        * cargo_quantity_mt
    )

    # --------------------------------------------------
    # ANALYZE EACH DAY
    # --------------------------------------------------

    daily_analysis = []

    for forecast in daily_forecasts:

        forecast_rate = float(
            forecast[
                "forecast_rate_usd_per_ton"
            ]
        )

        freight_cost = (
            forecast_rate
            * cargo_quantity_mt
        )

        transport_cost = (
            freight_cost
            + operational_cost
        )

        transport_cost_per_ton = (
            transport_cost
            / cargo_quantity_mt
        )

        indicative_margin = (
            cargo_benchmark_value
            - transport_cost
        )

        margin_per_ton = (
            indicative_margin
            / cargo_quantity_mt
        )

        daily_analysis.append({

            "day_ahead":
                forecast["day_ahead"],

            "target_date":
                forecast["target_date"],

            "forecast_freight_rate_usd_per_ton":
                round(
                    forecast_rate,
                    2
                ),

            "estimated_freight_cost_usd":
                round(
                    freight_cost,
                    2
                ),

            "operational_cost_usd":
                round(
                    operational_cost,
                    2
                ),

            "estimated_transport_cost_usd":
                round(
                    transport_cost,
                    2
                ),

            "transport_cost_per_ton":
                round(
                    transport_cost_per_ton,
                    2
                ),

            "indicative_margin_usd":
                round(
                    indicative_margin,
                    2
                ),

            "indicative_margin_per_ton":
                round(
                    margin_per_ton,
                    2
                )
        })

    # --------------------------------------------------
    # FIND BEST MODELED ENTRY DATE
    # --------------------------------------------------

    best_day = max(
        daily_analysis,
        key=lambda item:
            item[
                "indicative_margin_usd"
            ]
    )

    # --------------------------------------------------
    # FIND LOWEST TRANSPORT COST
    # --------------------------------------------------

    lowest_cost_day = min(
        daily_analysis,
        key=lambda item:
            item[
                "estimated_transport_cost_usd"
            ]
    )

    # --------------------------------------------------
    # FINAL SIGNAL
    # --------------------------------------------------

    if (
        best_day[
            "indicative_margin_usd"
        ] > 0
    ):

        entry_signal = (
            "POSITIVE TRANSPORT MARGIN"
        )

    else:

        entry_signal = (
            "NEGATIVE TRANSPORT MARGIN"
        )

    # --------------------------------------------------
    # EXPLANATION
    # --------------------------------------------------

    explanation = (

        f"PUHAR evaluates the next 7 days using "
        f"forecast freight rates, physical vessel "
        f"feasibility, estimated fuel and idle costs, "
        f"and the latest {commodity} benchmark. "

        f"The modeled entry date is "
        f"{best_day['target_date']} because it has "
        f"the highest indicative transport margin "
        f"within the forecast window."

    )

    # --------------------------------------------------
    # FINAL RESULT
    # --------------------------------------------------

    return {

        "status":
            "success",

        "analysis":
            "7-day entry timing",

        "origin_port":
            origin_port,

        "destination_port":
            destination_port,

        "cargo_quantity_mt":
            cargo_quantity_mt,

        "commodity":
            commodity,

        "commodity_price_date":
            commodity_data["date"],

        "commodity_price_usd_per_ton":
            round(
                commodity_price,
                2
            ),

        "cargo_benchmark_value_usd":
            round(
                cargo_benchmark_value,
                2
            ),

        "market_route":
            market_route,

        "recommended_vessel":
            recommended_vessel,

        "fuel_cost_usd":
            round(
                fuel_cost,
                2
            ),

        "idle_cost_usd":
            round(
                idle_cost,
                2
            ),

        "operational_cost_usd":
            round(
                operational_cost,
                2
            ),

        "modeled_entry_date":
            best_day[
                "target_date"
            ],

        "modeled_entry_freight_rate_usd_per_ton":
            best_day[
                "forecast_freight_rate_usd_per_ton"
            ],

        "modeled_transport_cost_usd":
            best_day[
                "estimated_transport_cost_usd"
            ],

        "modeled_transport_cost_per_ton":
            best_day[
                "transport_cost_per_ton"
            ],

        "indicative_margin_usd":
            best_day[
                "indicative_margin_usd"
            ],

        "indicative_margin_per_ton":
            best_day[
                "indicative_margin_per_ton"
            ],

        "entry_signal":
            entry_signal,

        "lowest_transport_cost_date":
            lowest_cost_day[
                "target_date"
            ],

        "lowest_transport_cost_usd":
            lowest_cost_day[
                "estimated_transport_cost_usd"
            ],

        "daily_entry_analysis":
            daily_analysis,

        "vessel_total_voyage_days":
            vessel_option[
                "total_voyage_days"
            ],

        "berth_occupancy_pct":
            vessel_option[
                "berth_occupancy_pct"
            ],

        "explanation":
            explanation,

        "note": (

            "The entry date is a model-based decision-support "
            "signal. It is not a guaranteed commercial profit "
            "prediction. Forecasts use recursive freight "
            "predictions with the latest available BDI "
            "conditions held constant."

        )
    }


# --------------------------------------------------
# TEST
# --------------------------------------------------

if __name__ == "__main__":

    result = analyze_entry_timing(

        cargo_quantity_mt=50000,

        origin_port=(
            "Taboneo Anchorage"
        ),

        destination_port=(
            "Paradip"
        )

    )

    print()

    for key, value in result.items():

        print(
            f"{key}: {value}"
        )

    print()

    print("=" * 70)
