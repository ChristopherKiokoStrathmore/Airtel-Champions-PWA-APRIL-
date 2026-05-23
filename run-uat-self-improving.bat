@echo off
title 🚀 SELF-IMPROVING UAT System
echo 🤖 Will automatically fix its own code when tests fail
echo 🔄 Runs until all profiles pass or max iterations reached
echo 🎯 Zero manual intervention required
echo.
echo This system will:
echo - Run UAT tests and detect failures
echo - Capture page HTML when tests fail
echo - Send failures to Groq AI for analysis
echo - Generate improved script that fixes all issues
echo - Overwrite itself with the improved version
echo - Restart with new script and continue
echo - Loop until perfect tests achieved
echo.
echo Setup:
echo 1. Set your Groq API key: set GROQ_API_KEY=your-key-here
echo 2. Install dependencies: npm install playwright
echo.
echo Starting self-improving UAT system...
echo It will run forever until all tests pass!
echo Press Ctrl+C to stop
echo.
npm run uat:self-improving
