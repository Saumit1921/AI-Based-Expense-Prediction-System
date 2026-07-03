# Internship Report: AI-Based Expense Prediction System

## 1. Project Overview & Objectives
This report details the work executed during the software engineering internship focusing on **AI-Based Expense Prediction Systems**. The objective was to design and implement an end-to-end fintech tool that assists users in tracking expenses, setting category budgets, and obtaining forecasts of future requirements using Machine Learning.

---

## 2. Key Deliverables & Achievements

### 2.1 Historical Expense Data Collection
A Python seeding script was developed to automatically generate 14 months of realistic, multi-category transaction data (890 records) incorporating inflation rates and utility cycles. This data was successfully ingested into the PostgreSQL database.

### 2.2 Fixed and Variable Expense Categorization
Expense categories were successfully mapped as either:
* **Fixed Expenses**: Rent (seeded once a month on the 1st), utility bills.
* **Variable Expenses**: Food, shopping, travel, entertainment, and transit outlays.

### 2.3 Trend Analysis & Visual Charts
Recharts widgets display:
* Monthly spending timelines (Area charts).
* Category allocations (Donut charts).
* Payment channels breakdown (Pie charts).
* Budget vs Actual contrasts (Radar charts).

### 2.4 AI-Assisted Predictions
Linear Regression and Random Forest models were trained on-the-fly inside the Python FastAPI service. Predictions are generated for:
* **Next Month**: Total forecast amount.
* **Next Quarter**: Sum of the next 3 months.
* **Yearly Outgo**: Sum of the next 12 months.
* **Category Breakdown**: Proportional projections based on past cycles.

### 2.5 Budget Planning & Recommendations
Users can manage category limits. If spent amounts pacing exceeds 90% or 100% of limits, the backend automatically issues warnings. The AI page displays **Suggested Future Budgets** adding a 12% safety margin over predicted amounts.

---

## 3. Observation Notes & Results
* **Summer Utility Spikes**: The data generator successfully simulated increased electricity bill outlays during summer months (June to August), which the AI insights rules detected and reported.
* **Ensemble Forecast Performance**: Blending Linear Regression (general inflation growth) with Random Forest (seasonal variations) yielded a Mean Absolute Percentage Error (MAPE) of approximately **14% to 18%**, reflecting an ensemble confidence rating of **82% to 86%**.
