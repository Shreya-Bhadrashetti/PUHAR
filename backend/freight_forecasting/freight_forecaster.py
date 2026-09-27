from pathlib import Path

import joblib
import pandas as pd


# --------------------------------------------------
# BACKEND IMPORT
# --------------------------------------------------

from app.core.config import settings


# --------------------------------------------------
# PATHS
# --------------------------------------------------

MODEL_PATH = (
    Path(__file__).resolve().parent
    / "models"
    / "freight_model.pkl"
)

DATA_PATH = (
    Path(__file__).resolve().parent
    / "data"
    / "freight_training_data.csv"
)


# --------------------------------------------------
# LOAD MODEL
# --------------------------------------------------

model_data = joblib.load(MODEL_PATH)

model = model_data["model"]

MODEL_FEATURES = model_data["features"]


# --------------------------------------------------
# LOAD TRAINING DATA
# --------------------------------------------------

training_data = pd.read_csv(DATA_PATH)

training_data["date"] = pd.to_datetime(
    training_data["date"]
)


# --------------------------------------------------
# GET AVAILABLE FREIGHT MARKETS
# --------------------------------------------------

def get_available_freight_markets():

    return (
        training_data[
            ["route", "vessel_type"]
        ]
        .drop_duplicates()
        .sort_values(
            ["route", "vessel_type"]
        )
    )


# --------------------------------------------------
# CHECK FREIGHT DATA AVAILABILITY
# --------------------------------------------------

def check_freight_availability(
    market_route,
    vessel_type
):

    data = training_data[
        (
            training_data["route"].str.lower()
            == market_route.lower()
        )
        &
        (
            training_data["vessel_type"].str.lower()
            == vessel_type.lower()
        )
    ]

    if data.empty:

        return {
            "available": False,
            "message": (
                f"No historical freight benchmark "
                f"available for {market_route} "
                f"+ {vessel_type}"
            )
        }

    latest_row = (
        data.sort_values("date")
        .iloc[-1]
    )

    return {
        "available": True,
        "records": len(data),
        "latest_date": str(
            latest_row["date"].date()
        ),
        "latest_rate_usd_per_ton": float(
            latest_row["rate_usd_per_ton"]
        )
    }


# --------------------------------------------------
# MAP PHYSICAL ROUTE TO MARKET ROUTE
# --------------------------------------------------

def map_physical_route(
    origin_port,
    destination_port
):

    origin = origin_port.lower()

    destination = destination_port.lower()


    # --------------------------------------------------
    # ORIGIN MARKET
    # --------------------------------------------------

    if (
        "hay point" in origin
        or "newcastle" in origin
        or "gladstone" in origin
    ):

        market_origin = "Australia"

    elif "taboneo" in origin:

        market_origin = "Indonesia"

    elif "richards bay" in origin:

        market_origin = "SouthAfrica"

    else:

        market_origin = None


    # --------------------------------------------------
    # DESTINATION MARKET
    # --------------------------------------------------

    if "paradip" in destination:

        market_destination = "Paradip"

    elif "visakhapatnam" in destination:

        market_destination = "Vizag"

    elif "gangavaram" in destination:

        market_destination = "Gangavaram"

    elif "haldia" in destination:

        market_destination = "Haldia"

    else:

        market_destination = None


    # --------------------------------------------------
    # CHECK MAPPING
    # --------------------------------------------------

    if (
        market_origin is None
        or market_destination is None
    ):

        return None


    return (
        f"{market_origin}-"
        f"{market_destination}"
    )


# --------------------------------------------------
# FREIGHT FORECAST
# --------------------------------------------------

def forecast_freight(
    market_route,
    vessel_type,
    days_ahead=7
):

    # --------------------------------------------------
    # CHECK DATA AVAILABILITY
    # --------------------------------------------------

    availability = check_freight_availability(
        market_route,
        vessel_type
    )

    if not availability["available"]:

        return {
            "status": "benchmark_unavailable",
            **availability
        }


    # --------------------------------------------------
    # GET HISTORICAL DATA
    # --------------------------------------------------

    data = training_data[
        (
            training_data["route"].str.lower()
            == market_route.lower()
        )
        &
        (
            training_data["vessel_type"].str.lower()
            == vessel_type.lower()
        )
    ].copy()

    data = data.sort_values("date")

    latest = data.iloc[-1]


    # --------------------------------------------------
    # FORECAST INITIAL VALUES
    # --------------------------------------------------

    today = pd.Timestamp.today().normalize()

    forecasts = []

    previous_prediction = float(
        latest["rate_usd_per_ton"]
    )

    previous_week_rate = float(
        latest["freight_lag_7"]
    )


    # --------------------------------------------------
    # GENERATE DAILY FORECASTS
    # --------------------------------------------------

    for day_number in range(
        1,
        days_ahead + 1
    ):

        target_date = (
            today
            + pd.Timedelta(
                days=day_number
            )
        )


        # --------------------------------------------------
        # BUILD MODEL INPUT
        # --------------------------------------------------

        X = pd.DataFrame([{

            "year":
                int(target_date.year),

            "month":
                int(target_date.month),

            "day":
                int(target_date.day),

            "day_of_week":
                int(target_date.dayofweek),

            "freight_lag_1":
                previous_prediction,

            "freight_lag_7":
                previous_week_rate,

            "bdi_index":
                float(
                    latest["bdi_index"]
                ),

            "bdi_lag_1":
                float(
                    latest["bdi_lag_1"]
                ),

            "bdi_lag_7":
                float(
                    latest["bdi_lag_7"]
                ),

            "route":
                market_route,

            "vessel_type":
                vessel_type

        }])


        # --------------------------------------------------
        # ONE-HOT ENCODE
        # --------------------------------------------------

        X = pd.get_dummies(
            X,
            columns=[
                "route",
                "vessel_type"
            ]
        )


        # --------------------------------------------------
        # MATCH EXACT TRAINING FEATURES
        # --------------------------------------------------

        X = X.reindex(
            columns=MODEL_FEATURES,
            fill_value=0
        )


        # --------------------------------------------------
        # PREDICT
        # --------------------------------------------------

        prediction = float(
            model.predict(X)[0]
        )


        # --------------------------------------------------
        # STORE DAILY FORECAST
        # --------------------------------------------------

        forecasts.append({

            "day_ahead":
                day_number,

            "target_date":
                target_date.strftime(
                    "%Y-%m-%d"
                ),

            "forecast_rate_usd_per_ton":
                round(
                    prediction,
                    2
                )

        })


        # --------------------------------------------------
        # UPDATE RECURSIVE LAG VALUES
        # --------------------------------------------------

        previous_prediction = prediction


        if day_number >= 7:

            previous_week_rate = (
                forecasts[
                    day_number - 7
                ][
                    "forecast_rate_usd_per_ton"
                ]
            )


    # --------------------------------------------------
    # FIND LOWEST FORECAST RATE
    # --------------------------------------------------

    best_day = min(
        forecasts,
        key=lambda item:
            item[
                "forecast_rate_usd_per_ton"
            ]
    )


    # --------------------------------------------------
    # RETURN COMPLETE FORECAST
    # --------------------------------------------------

    return {

        "status":
            "success",

        "market_route":
            market_route,

        "vessel_type":
            vessel_type,

        "latest_historical_rate_usd_per_ton":
            round(
                availability[
                    "latest_rate_usd_per_ton"
                ],
                2
            ),

        "latest_historical_date":
            availability[
                "latest_date"
            ],

        "forecast_horizon_days":
            days_ahead,

        "daily_forecasts":
            forecasts,

        "lowest_forecast_rate_usd_per_ton":
            best_day[
                "forecast_rate_usd_per_ton"
            ],

        "lowest_rate_date":
            best_day[
                "target_date"
            ],

        "model":
            "RandomForestRegressor",

        "forecast_note":
            (
                "Daily forecasts use recursive freight "
                "predictions while holding the latest "
                "available BDI conditions constant. "
                "This is a prototype forecast and not "
                "a guaranteed market outcome."
            )

    }


# --------------------------------------------------
# TEST
# --------------------------------------------------

if __name__ == "__main__":

    print()

    print("=" * 70)

    print(
        "PUHAR FREIGHT FORECASTING"
    )

    print("=" * 70)


    # --------------------------------------------------
    # TEST PHYSICAL ROUTE
    # --------------------------------------------------

    origin_port = (
        "Hay Point / Dalrymple Bay"
    )

    destination_port = (
        "Paradip"
    )


    # --------------------------------------------------
    # MAP ROUTE
    # --------------------------------------------------

    market_route = map_physical_route(
        origin_port,
        destination_port
    )


    print()

    print("Physical route:")

    print(
        f"{origin_port} -> "
        f"{destination_port}"
    )


    print()

    print("Mapped market route:")

    print(market_route)


    # --------------------------------------------------
    # TEST CAPESIZE
    # --------------------------------------------------

    vessel_type = "Capesize"


    print()

    print("Vessel type:")

    print(vessel_type)


    # --------------------------------------------------
    # FORECAST
    # --------------------------------------------------

    result = forecast_freight(

        market_route,

        vessel_type,

        days_ahead=7

    )


    # --------------------------------------------------
    # PRINT RESULT
    # --------------------------------------------------

    print()

    print("Forecast result:")

    for key, value in result.items():

        print(
            f"{key}: {value}"
        )


    print()

    print("=" * 70)