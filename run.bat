@echo off
title AI Expense Prediction System Launcher
echo ===================================================
echo AI-Based Expense Prediction System - Launcher
echo ===================================================
echo.

echo [1/3] Starting Python FastAPI AI Microservice in a new window...
if exist "ai-service\venv\Scripts\activate.bat" (
    start "FastAPI AI Service" cmd /k "cd ai-service && call venv\Scripts\activate && uvicorn app:app --host 127.0.0.1 --port 8000 --reload"
) else (
    start "FastAPI AI Service" cmd /k "cd ai-service && uvicorn app:app --host 127.0.0.1 --port 8000 --reload"
)

echo [2/3] Starting Express Backend Server in a new window...
start "Express Backend" cmd /k "cd backend && npm run dev"

echo [3/3] Starting Vite React Frontend in a new window...
start "Vite React Client" cmd /k "cd frontend && npm run dev"

echo.
echo ===================================================
echo All services launched! Check the spawned command windows.
echo Frontend will be running at http://localhost:5173
echo Backend API listening at http://localhost:5000
echo AI Predict microservice running at http://localhost:8000
echo ===================================================
pause
