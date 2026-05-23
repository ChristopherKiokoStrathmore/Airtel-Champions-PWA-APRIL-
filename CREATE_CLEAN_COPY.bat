@echo off
echo Creating clean deployment copy...

REM Create destination directory
mkdir "..\airtel-champions-deploy" 2>nul

REM Copy essential files
echo Copying essential files...
copy "package.json" "..\airtel-champions-deploy\" >nul
copy "package-lock.json" "..\airtel-champions-deploy\" >nul
copy "vite.config.ts" "..\airtel-champions-deploy\" >nul
copy "index.html" "..\airtel-champions-deploy\" >nul
copy "tsconfig.json" "..\airtel-champions-deploy\" >nul
copy "vercel.json" "..\airtel-champions-deploy\" >nul
copy ".vercelignore" "..\airtel-champions-deploy\" >nul
copy ".env.example" "..\airtel-champions-deploy\" >nul
copy ".gitignore" "..\airtel-champions-deploy\" >nul
copy "README.md" "..\airtel-champions-deploy\" >nul

REM Copy essential folders
echo Copying source code...
xcopy "src" "..\airtel-champions-deploy\src" /E /I /H /Y >nul
xcopy "public" "..\airtel-champions-deploy\public" /E /I /H /Y >nul

echo.
echo ========================================
echo Clean deployment copy created!
echo Location: ..\airtel-champions-deploy
echo Size reduction: ~90%%
echo Ready for Vercel deployment!
echo ========================================
echo.
echo Next steps:
echo 1. cd ..\airtel-champions-deploy
echo 2. git init
echo 3. git add .
echo 4. git commit -m "Ready for deployment"
echo 5. Create GitHub repository
echo 6. Deploy to Vercel
echo.
pause
