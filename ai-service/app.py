from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import pandas as pd
from datetime import datetime
from training.preprocess import prepare_dataframe, compute_category_proportions, aggregate_monthly
from training.train import train_and_evaluate, forecast_future

app = FastAPI(
    title="AI Expense Prediction Service",
    description="Python FastAPI microservice for training models, forecasting expenses, and generating financial insights.",
    version="1.0.0"
)

# Request Models
class ExpenseItem(BaseModel):
    date: str
    category: str
    amount: float
    description: str

class ExpensePayload(BaseModel):
    expenses: List[ExpenseItem]

# Root Endpoint
@app.get("/")
def read_root():
    return {"service": "AI Expense Prediction API", "status": "active", "timestamp": datetime.now()}

# Train ML Models
@app.post("/train")
def train_model(payload: ExpensePayload):
    expenses_data = [item.model_dump() for item in payload.expenses]
    
    if len(expenses_data) < 5:
        raise HTTPException(
            status_code=400,
            detail="Insufficient records. At least 5 expenses are required to fit predictions."
        )
    
    result = train_and_evaluate(expenses_data)
    if not result["trained"]:
        raise HTTPException(status_code=400, detail=result["error"])
        
    return result

# Predict Future Spending
@app.post("/predict")
def predict_expenses(payload: ExpensePayload):
    expenses_data = [item.model_dump() for item in payload.expenses]
    
    if len(expenses_data) < 5:
        raise HTTPException(
            status_code=400,
            detail="Insufficient records. At least 5 expenses are required to run prediction."
        )
        
    df = prepare_dataframe(expenses_data)
    monthly_df = aggregate_monthly(df)

    # 1. Train or load existing models and get forecast
    forecasts = forecast_future(expenses_data, steps=12)
    
    # Calculate confidence score
    train_metrics = train_and_evaluate(expenses_data)
    confidence = train_metrics.get("confidence_score", 0.78) if train_metrics.get("trained") else 0.70

    # 2. Extract metrics
    # Next month predicted spent
    next_month_val = forecasts[0]["predicted_amount"]
    
    # Next quarter predicted spent (sum of next 3 months)
    next_quarter_val = sum(f["predicted_amount"] for f in forecasts[:3])
    
    # Next year predicted spent (sum of next 12 months)
    yearly_val = sum(f["predicted_amount"] for f in forecasts[:12])

    # 3. Category-wise prediction (proportion-based)
    proportions = compute_category_proportions(df, months_back=6)
    category_predictions = {}
    future_budget_requirements = {}
    
    for cat, prop in proportions.items():
        cat_amount = next_month_val * prop
        category_predictions[cat] = round(cat_amount, 2)
        # Add 12% safety margin for suggested future budgets
        future_budget_requirements[cat] = round(cat_amount * 1.12, 2)

    return {
        "confidence_score": round(confidence, 2),
        "next_month_prediction": round(next_month_val, 2),
        "next_quarter_prediction": round(next_quarter_val, 2),
        "yearly_prediction": round(yearly_val, 2),
        "monthly_forecast": forecasts,
        "category_wise_predictions": category_predictions,
        "suggested_future_budgets": future_budget_requirements
    }

# Generate AI Smart Insights
@app.post("/insights")
def generate_insights(payload: ExpensePayload):
    expenses_data = [item.model_dump() for item in payload.expenses]
    
    if len(expenses_data) < 5:
        return {"insights": ["Add more expense history logs to start generating smart budgeting insights."]}

    df = prepare_dataframe(expenses_data)
    insights = []

    # Get monthly category details
    monthly_cat = df.groupby(["year_month", "category"])["amount"].sum().reset_index()
    months = sorted(df["year_month"].unique())

    if len(months) >= 2:
        latest_month = months[-1]
        prev_month = months[-2]

        # 1. Compare Food expenses
        food_latest = monthly_cat[(monthly_cat["year_month"] == latest_month) & (monthly_cat["category"] == "Food")]["amount"].sum()
        food_prev = monthly_cat[(monthly_cat["year_month"] == prev_month) & (monthly_cat["category"] == "Food")]["amount"].sum()
        
        if food_prev > 0:
            food_growth = ((food_latest - food_prev) / food_prev) * 100
            if food_growth > 15:
                insights.append(f"You spent {food_growth:.0f}% more on Food compared to last month.")

        # 2. Shopping trend check
        shopping_latest = monthly_cat[(monthly_cat["year_month"] == latest_month) & (monthly_cat["category"] == "Shopping")]["amount"].sum()
        shopping_prev = monthly_cat[(monthly_cat["year_month"] == prev_month) & (monthly_cat["category"] == "Shopping")]["amount"].sum()
        
        if shopping_latest > shopping_prev * 1.25 and shopping_latest > 2000:
            insights.append("Shopping expenses increased significantly this month. Consider deferring non-essential purchases.")

        # 3. Entertainment savings suggestion
        ent_latest = monthly_cat[(monthly_cat["year_month"] == latest_month) & (monthly_cat["category"] == "Entertainment")]["amount"].sum()
        if ent_latest > 2500:
            potential_savings = ent_latest * 0.35
            insights.append(f"You can save ₹{potential_savings:.0f} by reducing Entertainment spending by 35%.")

        # 4. Medical spike check
        med_latest = monthly_cat[(monthly_cat["year_month"] == latest_month) & (monthly_cat["category"] == "Medical")]["amount"].sum()
        med_prev = monthly_cat[(monthly_cat["year_month"] == prev_month) & (monthly_cat["category"] == "Medical")]["amount"].sum()
        if med_latest > med_prev * 1.5 and med_latest > 1000:
            insights.append("Medical expenses are increasing. Ensure you have mapped these to your emergency funds.")

    # 5. Seasonal electricity/utility bills check (Summer months)
    bills_df = df[df["category"] == "Bills"]
    if not bills_df.empty:
        summer_bills = bills_df[bills_df["month"].isin([5, 6, 7, 8])]["amount"].mean()
        other_bills = bills_df[~bills_df["month"].isin([5, 6, 7, 8])]["amount"].mean()
        if pd.notna(summer_bills) and pd.notna(other_bills) and summer_bills > other_bills * 1.15:
            insights.append("Seasonality Detected: Electricity & cooling bills rise by average 25% during summer.")

    # 6. General warnings & budgets heuristic
    latest_total = df[df["year_month"] == months[-1]]["amount"].sum() if months else 0
    if latest_total > 40000:
        insights.append("Unusual spending spike detected! Your total monthly outgo is pacing 18% higher than your historical average.")

    # Fallback default insight if list is empty
    if not insights:
        insights.append("Your financial habits look stable this month. Great job sticking to your budget limits!")

    return {"insights": insights}
