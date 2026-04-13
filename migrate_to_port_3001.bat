@echo off
echo ========================================
echo Stopping any running Node.js processes...
echo ========================================

taskkill /f /im node.exe 2>nul
timeout /t 2 /nobreak >nul

echo.
echo Clearing all caches...
echo ========================================

REM Clear browser cache
del /s /q /f "%LOCALAPPDATA%\Google\Chrome\User Data\Default\Cache\*"
del /s /q /f "%LOCALAPPDATA%\Microsoft\Edge\User Data\Default\Cache\*"

REM Clear Vite cache
if exist "node_modules\.vite" rmdir /s /q "node_modules\.vite"
if exist "dist" rmdir /s /q "dist"
if exist "build" rmdir /s /q "build"

echo.
echo Rebuilding application...
echo ========================================

call npm run build

echo.
echo Starting on new port 3001...
echo ========================================

call npx vite --port 3001 --host

echo.
echo Application will be available at:
echo http://localhost:3001
echo ========================================

pause
