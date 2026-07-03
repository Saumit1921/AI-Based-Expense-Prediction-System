# Software Requirements Specification (SRS)

## 1. Introduction

### 1.1 Purpose
This document specifies the software requirements for the **AI-Based Expense Prediction System**, a full-stack personal finance budgeting and prediction dashboard.

### 1.2 System Scope
The system tracks user financial transactions, categorizes expenses, monitors budget limits, and applies machine learning regression models to predict future monthly and quarterly outlays, alerting users prior to budget overrides.

---

## 2. Overall Description

### 2.1 Product Perspective
The system consists of:
1. **React Frontend**: Modern user dashboard with responsive layouts, glassmorphic styles, and Recharts charts.
2. **Node.js Express Backend**: REST API orchestrator handling JWT credentials, Prisma ORM, and database CRUD.
3. **Python FastAPI AI Microservice**: Performs pandas preprocessing, fits Scikit-learn regressors, and compiles text observations.
4. **PostgreSQL Database**: Relational datastore holding transactions, categories, budgets, and predictions.

### 2.2 System Functions
* Complete User Authentication (Login, Signup, JWT).
* Expense ledger CRUD with filters, simulated OCR parsing, and Web Speech voice input.
* Budget ceilings tracker contrast (Budget vs Actual spends).
* Model training & forecasting (Linear Regression & Random Forest).
* Smart natural language budget insights.
* Excel (CSV) and printable PDF reports.
* Protected Administrative dashboard.

---

## 3. Specific Requirements

### 3.1 Functional Requirements
* **FR-1**: User must authenticate before accessing financial charts or transaction lists.
* **FR-2**: Users must be able to log expenses (specifying category, date, amount, payment method, description, and receipt).
* **FR-3**: System must automatically calculate budget utilization rates and trigger notification alerts upon crossing 90% or 100% caps.
* **FR-4**: AI forecasting models must fit to user data on-the-fly and return predicted amounts for next month, quarter, and year.
* **FR-5**: Platform must support exporting data to CSV format.

### 3.2 Non-Functional Requirements
* **NFR-1 Security**: All passwords must be salted and hashed (using bcrypt). Session states must be secured with JWT.
* **NFR-2 Performance**: Graph calculations and predicted data returns must take less than 2.0 seconds.
* **NFR-3 Responsiveness**: Dashboard widgets must support mobile, tablet, and desktop viewports.
