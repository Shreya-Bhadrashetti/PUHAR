import pandas as pd
import joblib

from pathlib import Path

from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score


# --------------------------------------------------
# 1. LOAD ML DATA
# --------------------------------------------------

data_path = Path("backend/freight_forecasting/data/freight_training_data.csv")

df = pd.read_csv(data_path)

print(f"Training records loaded: {len(df)}")


# --------------------------------------------------
# 2. CONVERT CATEGORICAL FEATURES
# --------------------------------------------------

df = pd.get_dummies(
    df,
    columns=["route", "vessel_type"],
    dtype=int
)


# --------------------------------------------------
# 3. DEFINE FEATURES AND TARGET
# --------------------------------------------------

target = "rate_usd_per_ton"

feature_columns = [
    column
    for column in df.columns
    if column not in ["date", target]
]

X = df[feature_columns]
y = df[target]


# --------------------------------------------------
# 4. TIME-BASED TRAIN/TEST SPLIT
# --------------------------------------------------

split_index = int(len(df) * 0.8)

X_train = X.iloc[:split_index]
X_test = X.iloc[split_index:]

y_train = y.iloc[:split_index]
y_test = y.iloc[split_index:]


print(f"Training records: {len(X_train)}")
print(f"Testing records: {len(X_test)}")


# --------------------------------------------------
# 5. TRAIN RANDOM FOREST
# --------------------------------------------------

print()
print("Training Random Forest...")

model = RandomForestRegressor(
    n_estimators=200,
    max_depth=15,
    random_state=42,
    n_jobs=-1
)

model.fit(X_train, y_train)


# --------------------------------------------------
# 6. MAKE PREDICTIONS
# --------------------------------------------------

predictions = model.predict(X_test)


# --------------------------------------------------
# 7. EVALUATE MODEL
# --------------------------------------------------

mae = mean_absolute_error(y_test, predictions)
rmse = mean_squared_error(
    y_test,
    predictions
) ** 0.5
r2 = r2_score(y_test, predictions)


print()
print("=" * 60)
print("FREIGHT FORECASTING MODEL RESULTS")
print("=" * 60)

print(f"MAE  : {mae:.4f}")
print(f"RMSE : {rmse:.4f}")
print(f"R²   : {r2:.4f}")


# --------------------------------------------------
# 8. SAVE MODEL
# --------------------------------------------------

model_dir = Path("backend/freight_forecasting/models")
model_dir.mkdir(parents=True, exist_ok=True)

model_path = model_dir / "freight_model.pkl"

joblib.dump(
    {
        "model": model,
        "features": feature_columns
    },
    model_path
)


print()
print(f"Model saved to: {model_path}")
print("=" * 60)