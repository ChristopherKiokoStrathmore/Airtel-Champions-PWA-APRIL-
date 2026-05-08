@echo off
REM Simple local API mock server for upload testing
REM Start with: npm install http-server && http-server -p 3001

cd /d "%~dp0"

echo.
echo 🚀 Starting Local API Mock Server...
echo.
echo You have two options:
echo.
echo OPTION 1: http-server (simplest)
echo   npx http-server --port 3001
echo.
echo OPTION 2: Using local-api.js 
echo   node local-api.js
echo.
echo For now, we'll use a simpler approach - just test with the UI
echo and we'll mock responses in the browser console.
echo.
pause
