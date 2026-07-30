@echo off
echo ====================================================
echo Starting Office AI - Development Environment
echo ====================================================

echo [1/3] Starting Backend (FastAPI)...
start "FastAPI Backend" cmd /k "cd backend && uvicorn main:app --reload --port 8000"

echo [2/3] Starting Frontend (React/Vite)...
start "React Frontend" cmd /k "cd agent-app && npm run dev"

echo Waiting for Vite dev server to come up...
timeout /t 5 /nobreak >nul

echo [3/3] Starting Electron App...
set ELECTRON_RUN_AS_NODE=
start "Electron App" cmd /k "cd agent-app && npm run electron"

echo All services have been launched!
echo You can close this window.
