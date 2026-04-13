@echo off
echo ========================================
echo Deploying CORS Configuration via Supabase CLI
echo ========================================

echo.
echo Step 1: Link to correct project...
npx supabase link --project-ref xspogpfohjmkykfjadhk

echo.
echo Step 2: Deploy all Edge Functions with enhanced CORS...
npx supabase functions deploy

echo.
echo Step 3: Check project status...
npx supabase status

echo.
echo Step 4: List deployed functions...
npx supabase functions list

echo.
echo ========================================
echo IMPORTANT: Manual Dashboard Configuration Required
echo ========================================
echo.
echo The CLI does NOT support CORS configuration directly.
echo You must manually add these origins in Supabase Dashboard:
echo.
echo   1. Go to: https://supabase.com/dashboard/project/xspogpfohjmkykfjadhk/settings/api
echo   2. In "CORS allowed origins", add:
echo      - http://localhost:3000
echo      - https://localhost:3000
echo      - http://127.0.0.1:3000
echo      - https://127.0.0.1:3000
echo.
echo After dashboard configuration, test the application.
echo ========================================

pause
