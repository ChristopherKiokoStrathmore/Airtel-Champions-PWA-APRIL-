@echo off
echo ========================================
echo Checking Supabase CORS Settings
echo ========================================

echo.
echo 1. Open your Supabase project dashboard:
echo    https://supabase.com/dashboard/project/xspogpfohjmkykfjadhk/settings/api
echo.

echo 2. Look for "CORS allowed origins" section
echo    - Should show: http://localhost:3001
echo    - Should show: https://localhost:3001
echo    - Should show: http://localhost:3000
echo    - Should show: https://localhost:3000
echo.

echo 3. If origins are missing, add them:
echo    http://localhost:3001
echo    https://localhost:3001
echo    http://127.0.0.1:3001
echo    https://127.0.0.1:3001
echo    http://localhost:3000
echo    https://localhost:3000
echo    http://127.0.0.1:3000
echo    https://127.0.0.1:3000
echo.

echo 4. Click "Save" to update settings
echo.

echo 5. Wait 2-3 minutes for settings to propagate
echo.

echo 6. Test your application at: http://localhost:3001
echo ========================================

pause
