import pandas as pd
import numpy as np
from datetime import datetime

def prepare_dataframe(expenses_list):
    """
    Converts list of expenses to a structured Pandas DataFrame.
    """
    if not expenses_list:
        return pd.DataFrame(columns=["date", "category", "amount", "year", "month", "year_month"])
        
    df = pd.DataFrame(expenses_list)
    df["date"] = pd.to_datetime(df["date"])
    df["amount"] = pd.to_numeric(df["amount"], errors="coerce").fillna(0.0)
    
    # Feature extraction
    df["year"] = df["date"].dt.year
    df["month"] = df["date"].dt.month
    df["year_month"] = df["date"].dt.to_period("M").astype(str)
    
    return df

def aggregate_monthly(df):
    """
    Aggregates transactions into monthly totals and creates feature indexes for regression.
    """
    if df.empty:
        return pd.DataFrame(columns=["year_month", "total_spent", "month_index", "calendar_month"])

    # Group by Year-Month
    monthly_df = df.groupby("year_month").agg(
        total_spent=("amount", "sum"),
        transaction_count=("amount", "count")
    ).reset_index()

    # Sort chronologically
    monthly_df = monthly_df.sort_values("year_month").reset_index(drop=True)

    # Chronological index feature: 1, 2, 3, ...
    monthly_df["month_index"] = monthly_df.index + 1
    
    # Seasonality feature: calendar month (1-12)
    monthly_df["calendar_month"] = monthly_df["year_month"].apply(
        lambda x: datetime.strptime(x, "%Y-%m").month
    )

    return monthly_df

def compute_category_proportions(df, months_back=6):
    """
    Computes category expenditure proportions over the last N months.
    Uses this to allocate total prediction into category-wise predictions.
    """
    if df.empty:
        return {}

    # Filter for the recent months to capture latest trends
    max_date = df["date"].max()
    cutoff_date = max_date - pd.DateOffset(months=months_back)
    recent_df = df[df["date"] >= cutoff_date]

    if recent_df.empty:
        recent_df = df

    cat_totals = recent_df.groupby("category")["amount"].sum()
    total_spent = cat_totals.sum()

    if total_spent == 0:
        return {}

    proportions = (cat_totals / total_spent).to_dict()
    return proportions
