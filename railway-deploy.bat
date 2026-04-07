@echo off
echo ========================================
echo Railway Deployment Script
echo ========================================
echo.

echo Step 1: Checking Railway CLI...
railway --version
if errorlevel 1 (
    echo Railway CLI not found! Installing...
    npm install -g @railway/cli
)

echo.
echo Step 2: Logging in to Railway...
echo Please complete authentication in your browser...
railway login

echo.
echo Step 3: Creating new project...
railway init

echo.
echo Step 4: Deploying to Railway...
railway up

echo.
echo ========================================
echo Deployment Complete!
echo ========================================
echo.
echo To view your deployment:
railway open

pause
