@echo off
REM Airtel Champions PWA - Application Launcher
REM This script starts the development server with proper environment setup
echo ========================================
echo Airtel Champions App - Launch Script
echo ========================================
echo.
echo This script will start your application
echo.

REM Kill any existing Node processes
taskkill /f /im node.exe 2>nul

echo [1/3] Installing dependencies (if needed)...
call npm install

echo.
echo [2/3] Building application...
call npm run build

echo.
echo [3/3] Starting development server on port 3001...
call npx vite --port 3001 --host

echo.
echo ========================================
echo Application is running at:
echo http://localhost:3001
echo ========================================
echo.
echo Press any key to stop the server...
pause >nul

REM Kill Node processes on exit
taskkill /f /im node.exe 2>nul
