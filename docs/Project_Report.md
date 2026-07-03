# Project Report: AI-Based Expense Prediction System

## 1. Executive Summary
The **AI-Based Expense Prediction System** is a next-generation personal finance platform designed to shift wealth tracking from a passive historical ledger to a proactive forecast map. By incorporating machine learning microservices alongside standard budgeting, the platform predicts monthly outgoes and flags potential ceiling breaches.

---

## 2. System Architecture & Flow

```
+--------------------+       REST API Requests      +-----------------------+
|   React Frontend   | <--------------------------> |  Express Node Backend |
| (Vite + Tailwind)  |       (JSON payloads)        |     (Prisma ORM)      |
+--------------------+                              +-----------+-----------+
                                                                |
                                                                | Fetch records
                                                                v
+--------------------+        Trigger Predictions   +-----------------------+
|  Python FastAPI    | <--------------------------> |      PostgreSQL       |
| (Scikit-learn / PD)|        (Data frames)         |       Database        |
+--------------------+                              +-----------------------+
```

1. **User Action**: The user records daily outlays, sets category boundaries, or clicks "Train AI Models".
2. **Backend Storage**: The Express backend commits transactions to PostgreSQL via Prisma.
3. **AI Pipeline**: When predictions are triggered, the Express backend sends user ledger history to the Python FastAPI microservice.
4. **Machine Learning Model**: FastAPI loads pandas to group data, fits `LinearRegression` and `RandomForestRegressor` ensembles, and computes Mean Absolute Percentage Error (MAPE).
5. **Insights Engine**: The AI microservice applies statistical rules to generate natural language budgeting insights (e.g. tracking utility spikes in summer).
6. **Result Display**: Predictions are saved to the database and returned to the React frontend to render in line charts and forecast curves.

---

## 3. Machine Learning Methodology

### 3.1 Algorithms Used
* **Linear Regression**: Fits a chronological time-index coefficient to capture general expense inflation or contraction trends.
* **Random Forest Regressor**: Fits an ensemble of regression decision trees against seasonal indicators (calendar months) to capture cyclical spending spikes.
* **Ensemble Blending**: Predictions from both models are combined at a 50-50 weight to produce a balanced, realistic forecast.

### 3.2 Confidence Score Formulation
The model confidence rating reflects prediction accuracy against user historical records.
$$\text{Confidence} = 1.0 - \text{MAPE}$$
$$\text{MAPE} = \frac{1}{n} \sum_{t=1}^{n} \left| \frac{y_t - \hat{y}_t}{y_t} \right|$$
Confidence scores are bounded between $10\%$ and $95\%$. If historical data is too sparse, the platform defaults to a baseline rating of $70\%$ using heuristic averages.
