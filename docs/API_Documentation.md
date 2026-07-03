# API Documentation

This document describes the REST API endpoints developed for the **AI-Based Expense Prediction System** backend (listening at `http://localhost:5000/api`) and the FastAPI AI microservice (listening at `http://localhost:8000`).

---

## 1. Authentication Endpoints (`/api/auth`)

### POST `/api/auth/signup`
Creates a new user account.
* **Payload**:
  ```json
  {
    "full_name": "John Doe",
    "email": "john@example.com",
    "password": "securepassword123"
  }
  ```
* **Response (201 Created)**:
  ```json
  {
    "user_id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
    "full_name": "John Doe",
    "email": "john@example.com",
    "role": "USER",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
  ```

### POST `/api/auth/login`
Authenticates a user and returns a token.
* **Payload**:
  ```json
  {
    "email": "john@example.com",
    "password": "securepassword123"
  }
  ```
* **Response (200 OK)**: Same structure as signup.

### GET `/api/auth/profile`
Fetches user details. (Protected)
* **Headers**: `Authorization: Bearer <token>`
* **Response (200 OK)**:
  ```json
  {
    "user_id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
    "full_name": "John Doe",
    "email": "john@example.com",
    "role": "USER",
    "created_at": "2026-07-03T20:49:17.000Z"
  }
  ```

---

## 2. Expenses Endpoints (`/api/expenses`)

### GET `/api/expenses`
Retrieves user expenses with filters. (Protected)
* **Headers**: `Authorization: Bearer <token>`
* **Query Parameters**:
  * `filter_preset`: `today` | `week` | `month` | `quarter` | `year` | `custom`
  * `search`: string search for description
  * `payment_method`: `Cash` | `Credit Card` | `Debit Card` | `UPI` | `Net Banking`
* **Response (200 OK)**:
  ```json
  {
    "expenses": [
      {
        "expense_id": "4a73752e-0a56-4cf3-b9be-917c0b05b412",
        "amount": 250,
        "payment_method": "Cash",
        "description": "Lunch meeting",
        "expense_date": "2026-07-03T12:00:00.000Z",
        "category": {
          "category_name": "Food",
          "color": "#EF4444"
        }
      }
    ],
    "totalCount": 1
  }
  ```

### POST `/api/expenses`
Creates a new expense. (Protected)
* **Payload**:
  ```json
  {
    "category_id": "cat-uuid",
    "amount": 250.0,
    "payment_method": "Cash",
    "description": "Lunch meeting",
    "expense_date": "2026-07-03T12:00:00.000Z"
  }
  ```

---

## 3. Budgets Endpoints (`/api/budgets`)

### GET `/api/budgets`
Retrieves user budget limits paired with actual month-to-date spending. (Protected)
* **Response (200 OK)**:
  ```json
  [
    {
      "budget_id": "bud-uuid",
      "monthly_limit": 12000.0,
      "actual_spent": 8450.0,
      "utilization": 70.42,
      "category": {
        "category_name": "Food",
        "color": "#EF4444"
      }
    }
  ]
  ```

---

## 4. AI Predictions Endpoints (`/api/predictions`)

### POST `/api/predictions/trigger`
Pushes user history to the Python AI service, trains regression models, and returns forecasted metrics. (Protected)
* **Response (200 OK)**:
  ```json
  {
    "message": "AI models trained and forecasts generated successfully.",
    "predictions": {
      "confidence_score": 0.84,
      "next_month_prediction": 18450.0,
      "next_quarter_prediction": 55400.0,
      "yearly_prediction": 221000.0,
      "monthly_forecast": [
        { "month": "2026-08", "predicted_amount": 18450.0 },
        { "month": "2026-09", "predicted_amount": 18700.0 }
      ]
    }
  }
  ```
