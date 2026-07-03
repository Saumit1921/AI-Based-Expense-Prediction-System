import os
import pickle
import numpy as np
import pandas as pd
from sklearn.linear_model import LinearRegression
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_percentage_error
from training.preprocess import prepare_dataframe, aggregate_monthly

# Create models directory
MODELS_DIR = "models"
os.makedirs(MODELS_DIR, exist_ok=True)

def train_and_evaluate(expenses_list):
    """
    Trains Linear Regression and Random Forest on historical aggregates,
    evaluates model fit, and saves the trained models.
    """
    df = prepare_dataframe(expenses_list)
    monthly_df = aggregate_monthly(df)

    if len(monthly_df) < 3:
        # Too little data to train a proper model
        return {
            "trained": False,
            "error": "At least 3 months of historical data are required to train the ML prediction engine."
        }

    # Features: month_index, calendar_month
    X = monthly_df[["month_index", "calendar_month"]].values
    y = monthly_df["total_spent"].values

    # 1. Train Linear Regression (captures general growth trend)
    lr_model = LinearRegression()
    lr_model.fit(X, y)

    # 2. Train Random Forest (captures variance & seasonal fluctuations)
    rf_model = RandomForestRegressor(n_estimators=50, random_state=42)
    rf_model.fit(X, y)

    # Save models
    with open(os.path.join(MODELS_DIR, "linear_regression.pkl"), "wb") as f:
        pickle.dump(lr_model, f)
    with open(os.path.join(MODELS_DIR, "random_forest.pkl"), "wb") as f:
        pickle.dump(rf_model, f)

    # 3. Evaluate models
    lr_preds = lr_model.predict(X)
    rf_preds = rf_model.predict(X)
    
    # Combined ensemble predictions for training evaluation
    ensemble_preds = 0.5 * lr_preds + 0.5 * rf_preds
    
    # Calculate error
    try:
        mape = mean_absolute_percentage_error(y, ensemble_preds)
        confidence_score = max(0.1, min(0.95, 1.0 - mape))
    except Exception:
        confidence_score = 0.75 # Default fallback

    return {
        "trained": True,
        "confidence_score": float(confidence_score),
        "data_points": len(monthly_df),
        "last_month_index": int(monthly_df["month_index"].max()),
        "last_month_str": str(monthly_df["year_month"].max())
    }

def forecast_future(expenses_list, steps=12):
    """
    Loads saved models and forecasts spending for next N months.
    """
    df = prepare_dataframe(expenses_list)
    monthly_df = aggregate_monthly(df)

    if len(monthly_df) < 3:
        # Return fallback heuristic predictions based on latest monthly averages if model can't train
        return fallback_heuristic_forecast(df, steps)

    # Load models
    lr_path = os.path.join(MODELS_DIR, "linear_regression.pkl")
    rf_path = os.path.join(MODELS_DIR, "random_forest.pkl")

    if not os.path.exists(lr_path) or not os.path.exists(rf_path):
        # Trigger training first
        train_res = train_and_evaluate(expenses_list)
        if not train_res["trained"]:
            return fallback_heuristic_forecast(df, steps)

    with open(lr_path, "rb") as f:
        lr_model = pickle.load(f)
    with open(rf_path, "rb") as f:
        rf_model = pickle.load(f)

    last_month_index = int(monthly_df["month_index"].max())
    last_month_str = str(monthly_df["year_month"].max())
    
    # Parse last month to increment dates
    last_date = datetime.strptime(last_month_str, "%Y-%m")

    future_months = []
    for step in range(1, steps + 1):
        # Increment month index
        future_idx = last_month_index + step
        
        # Calculate calendar year and month
        future_month = last_date.month + step
        future_year = last_date.year + (future_month - 1) // 12
        future_month = (future_month - 1) % 12 + 1
        
        month_str = f"{future_year}-{future_month:02d}"
        
        # Predict using LR and RF
        feature_vector = np.array([[future_idx, future_month]])
        lr_pred = lr_model.predict(feature_vector)[0]
        rf_pred = rf_model.predict(feature_vector)[0]
        
        # Ensemble combination
        pred_amount = max(0, 0.5 * lr_pred + 0.5 * rf_pred)
        
        future_months.append({
            "month": month_str,
            "predicted_amount": round(float(pred_amount), 2)
        })

    return future_months

def fallback_heuristic_forecast(df, steps):
    """
    Standard percentage fallback prediction when data points are too sparse to run regression.
    """
    if df.empty:
        avg_spend = 15000.0 # Default starting spend fallback
    else:
        # Group by month and find average
        monthly_totals = df.groupby("year_month")["amount"].sum()
        avg_spend = monthly_totals.mean() if not monthly_totals.empty else 15000.0

    future_months = []
    today = datetime.now()
    
    for i in range(1, steps + 1):
        future_date = today + pd.DateOffset(months=i)
        month_str = future_date.strftime("%Y-%m")
        # Add slight random variations for organic visual curves
        variation = 1.0 + np.random.uniform(-0.05, 0.05)
        future_months.append({
            "month": month_str,
            "predicted_amount": round(avg_spend * variation, 2)
        })
    return future_months
