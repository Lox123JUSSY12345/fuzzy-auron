@echo off
echo ========================================
echo   Auron Client - Git Deploy Helper
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
set /p commit_message="Enter commit message: "
git commit -m "%commit_message%"

echo.
echo ========================================
echo Pushing to GitHub...
git push

echo.
echo ========================================
echo Done! Your changes are now on GitHub
echo.
echo Next steps:
echo 1. Go to render.com
echo 2. Your site will auto-deploy in 2-3 minutes
echo.
pause
