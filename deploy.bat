@echo off
echo ========================================
echo   Auron Client - Railway Deploy
echo ========================================
echo.

echo Checking Git status...
git status

echo.
echo ========================================
echo Adding all files...
git add .

echo.
echo ========================================
set /p commit_message="Enter commit message (or press Enter for 'Update'): "
if "%commit_message%"=="" set commit_message=Update
git commit -m "%commit_message%"

echo.
echo ========================================
echo Pushing to GitHub...
git push

echo.
echo ========================================
echo Done! Your changes are now on GitHub
echo.
echo Railway will auto-deploy in 1-2 minutes!
echo Check status: https://railway.app/dashboard
echo.
pause
