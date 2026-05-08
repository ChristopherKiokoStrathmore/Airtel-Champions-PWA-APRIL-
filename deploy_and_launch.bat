@echo off
echo ========================================
echo Airtel Champions - Deploy and Launch
echo ========================================
echo.
echo Step 1/4: Fixing Supabase config...
echo [OK] Removed extra_headers from config.toml
echo.

echo Step 2/4: Deploying Edge Functions to the CORRECT project...
call npx supabase functions deploy towns --project-ref xspogpfohjmkykfjadhk
call npx supabase functions deploy activity-log --project-ref xspogpfohjmkykfjadhk
call npx supabase functions deploy activity-batch --project-ref xspogpfohjmkykfjadhk
call npx supabase functions deploy hbb-auto-allocate --project-ref xspogpfohjmkykfjadhk
call npx supabase functions deploy service-requests --project-ref xspogpfohjmkykfjadhk
call npx supabase functions deploy health --project-ref xspogpfohjmkykfjadhk
call npx supabase functions deploy hbb-handle-rejection --project-ref xspogpfohjmkykfjadhk
call npx supabase functions deploy hbb-installer-by-phone --project-ref xspogpfohjmkykfjadhk
call npx supabase functions deploy hbb-notifications --project-ref xspogpfohjmkykfjadhk
call npx supabase functions deploy auto-allocate --project-ref xspogpfohjmkykfjadhk
call npx supabase functions deploy make-server-28f2f653 --project-ref xspogpfohjmkykfjadhk --no-verify-jwt
echo.
echo [OK] Functions deployed to xspogpfohjmkykfjadhk.supabase.co
echo.

echo Step 3/4: Verifying deployment on xspogpfohjmkykfjadhk...
call npx supabase functions list --project-ref xspogpfohjmkykfjadhk
echo.
echo Step 3b/4: Verifying promoter RPC is exposed...
powershell -ExecutionPolicy Bypass -File scripts\check_promoter_rpc.ps1
echo.

echo Step 4/4: Starting development server on FIXED port 3000...
echo Launching on http://localhost:3000
echo (Killing any old process on port 3000 first...)

:: Kill any existing Vite / Node process on port 3000
for /f "tokens=5" %%a in ('netstat -aon ^| find ":3000" ^| find "LISTENING"') do taskkill /F /PID %%a >nul 2>&1

:: Force Vite to use EXACTLY port 3000
call npx vite --port 3000 --strictPort --host

echo.
echo ========================================
echo ✅ App running at: http://localhost:3000
echo ========================================
pause