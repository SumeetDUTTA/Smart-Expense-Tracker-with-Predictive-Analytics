import pandas as pd
import numpy as np
import joblib
from fastapi import FastAPI
from pydantic import BaseModel
from datetime import datetime
import io

MODEL_PATH = "expense_forecast.pkl"
model_package = joblib.load(MODEL_PATH)
model = model_package['model']
FEATURES = model_package['features']

app = FastAPI(title='Expense Forecast API', version='1.1')

# -------------------------
# Request body models
# -------------------------
class ExpenseData(BaseModel):
    Date: str
    Amount: float
    Category: str
    Type: str

class TimeseriesData(BaseModel):
    timeseries: list[float]
    horizon: int

class MonthlyExpenseData(BaseModel):
    monthly_totals: list[dict]
    horizon: int

# -----------------------------
# Feature generator
# -----------------------------
def create_features(ts: np.ndarray, month_index: int):
    """Generate lag, rolling, trend, and time features for next prediction."""
    lag_1 = ts[-1]
    lag_2 = ts[-2] if len(ts) > 1 else ts[-1]
    lag_3 = ts[-3] if len(ts) > 2 else ts[-1]
    lag_12 = ts[-12] if len(ts) > 11 else ts[-1]

    Rolling3 = np.mean(ts[-3:])
    Rolling6 = np.mean(ts[-6:]) if len(ts) >= 6 else Rolling3
    Rolling12 = np.mean(ts[-12:]) if len(ts) >= 12 else Rolling6

    trend_3 = ts[-1] - ts[-3] if len(ts) > 3 else 0
    pct_change = (ts[-1] - ts[-2]) / (abs(ts[-2]) + 1e-9) if len(ts) > 1 else 0

    month_total = np.sum(ts[-3:])
    category_ratio = ts[-1] / (month_total + 1e-9)

    month_sin = np.sin(2 * np.pi * month_index / 12)
    month_cos = np.cos(2 * np.pi * month_index / 12)

    X = np.array([[lag_1, lag_2, lag_3, lag_12,
                   Rolling3, Rolling6, Rolling12,
                   trend_3, pct_change, month_total,
                   category_ratio, month_index, month_sin, month_cos]])
    return X

# -----------------------------
# Prediction route
# -----------------------------
@app.post("/predict")
async def forecast_timeseries(data: TimeseriesData):
    """
    Predict future monthly expenses using the tuned XGBoost model.
    Input timeseries should be in rupees.
    """
    try:
        ts = np.array(data.timeseries, dtype=float)
        horizon = data.horizon

        if len(ts) == 0:
            return {"predicted_expense_rupees": [0.0] * horizon}

        # Transform to log space since model was trained on np.log1p
        ts_log = np.log1p(ts)
        preds = []
        ts_copy = list(ts_log)

        current_month = datetime.now().month

        for i in range(horizon):
            features = create_features(np.array(ts_copy), (current_month + i - 1) % 12 + 1)

            # Align with model features
            X_df = pd.DataFrame(features, columns=[
                'lag_1', 'lag_2', 'lag_3', 'lag_12',
                'Rolling3', 'Rolling6', 'Rolling12',
                'trend_3', 'pct_change',
                'month_total', 'category_ratio',
                'month_num', 'month_sin', 'month_cos'
            ])

            # Add missing dummy category columns (if any)
            for col in FEATURES:
                if col not in X_df.columns:
                    X_df[col] = 0

            # Match column order to model
            X_df = X_df[FEATURES]

            # Predict log-space expense
            pred_log = model.predict(X_df)[0]
            ts_copy.append(pred_log)

            # Convert to rupees
            pred_rupees = float(np.expm1(pred_log))
            preds.append(round(pred_rupees, 2))

        return {"predicted_expense_rupees": preds}

    except Exception as e:
        return {"error": str(e), "predicted_expense_rupees": [0.0] * data.horizon}
