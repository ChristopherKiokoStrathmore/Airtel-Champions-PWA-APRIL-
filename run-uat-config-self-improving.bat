@echo off
title 🚀 CONFIGURATION-BASED Self-Improving UAT System
echo 📁 Reads selectors from JSON file - never modifies JavaScript
echo 🔄 Updates only JSON configuration - zero syntax errors
echo 🎯 Zero manual intervention required
echo.
echo This system will:
echo - Run UAT tests using selectors from selectors.json
echo - Detect failures and capture page HTML
echo - Send failures to Groq AI for analysis
echo - Get improved selectors as valid JSON
echo - Update ONLY the JSON file (never touches JavaScript)
echo - Restart and continue with improved selectors
echo - Loop until perfect tests achieved
echo.
echo Benefits:
echo - NO syntax errors (JSON is validated)
echo - SAFE self-modification (only configuration changes)
echo - EASY debugging (can manually edit selectors.json)
echo - PERSISTENT improvements (JSON file keeps getting better)
echo.
echo Setup:
echo 1. Set your Groq API key: set GROQ_API_KEY=your-key-here
echo 2. Install dependencies: npm install playwright
echo.
echo Starting configuration-based self-improving UAT system...
echo It will safely improve itself by only updating JSON!
echo Press Ctrl+C to stop
echo.
npm run uat:config-self-improving
