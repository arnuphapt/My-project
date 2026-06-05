@echo off
echo ====================================================
echo Starting Office AI - Development Environment
echo ====================================================

echo [1/2] Starting Backend (FastAPI)...
start "FastAPI Backend" cmd /k "cd backend && uvicorn main:app --reload --port 8000"

echo [2/2] Starting Frontend (React/Vite)...
start "React Frontend" cmd /k "cd agent-app && npm run dev"


echo All services have been launched!
echo You can close this window.
