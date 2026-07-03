# AI-Based Expense Prediction System

A premium, banking-style full-stack fintech platform designed to manage budgets, record transaction ledgers, analyze histories, and forecast future monthly and quarterly outlays using Machine Learning ensembles.

---

## 1. Project Directory Structure

* **`backend/`**: Express server handling JWT authentication, Prisma ORM database models, transaction ledgers, category boundaries, and CSV exports.
* **`ai-service/`**: Python FastAPI microservice that preprocesses histories, fits Scikit-learn regressors (Linear Regression & Random Forest), and compiles text observations.
* **`frontend/`**: Vite React + TypeScript dashboard styled with glassmorphism Tailwind components and Recharts visualizations.
* **`docs/`**: API endpoint documents, SRS configurations, and Project Reports.

---

## 2. Local Setup Instructions

### Prerequisites
* **Node.js**: v18+ and `npm`
* **Python**: v3.9+ and `pip`
* **Database**: PostgreSQL database instance (or modify `DATABASE_URL` in `.env` to point to a SQLite datastore if preferred)

### Step 1: Initialize Database & Run Backend
1. Open a terminal and navigate to the backend folder:
   ```bash
   cd backend
   ```
2. Create a `.env` file from the root `.env.example` or define `DATABASE_URL` and `JWT_SECRET`.
3. Install dependencies and run migrations:
   ```bash
   npm install
   npx prisma db push
   ```
4. Seed the database with categories, admin accounts, and historical logs:
   ```bash
   npm run db:seed
   ```
5. Start the backend developer server:
   ```bash
   npm run dev
   ```
   *(Backend listening at `http://localhost:5000`)*

---

### Step 2: Launch AI Prediction Service
1. Open a new terminal and navigate to the AI service:
   ```bash
   cd ai-service
   ```
2. Create a virtual environment and activate it:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: .\venv\Scripts\activate
   ```
3. Install packages:
   ```bash
   pip install -r requirements.txt
   ```
4. Start FastAPI server using Uvicorn:
   ```bash
   uvicorn app:app --host 127.0.0.1 --port 8000 --reload
   ```
   *(AI Service listening at `http://localhost:8000`)*

---

### Step 3: Start React Frontend
1. Open a third terminal and navigate to the frontend:
   ```bash
   cd frontend
   ```
2. Install client dependencies:
   ```bash
   npm install
   ```
3. Start the Vite dev server:
   ```bash
   npm run dev
   ```
   *(Frontend accessible at `http://localhost:5173`)*

---

## 3. Demo Credentials
For easy system demonstration, you can log in using:
* **User (Demo Account)**: `demo@example.com` / Password: `demo123` (Seeded with 14 months of sample transactions)
* **System Administrator**: `admin@example.com` / Password: `admin123`
