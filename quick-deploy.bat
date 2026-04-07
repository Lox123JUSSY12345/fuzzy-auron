@echo off
echo ========================================
echo Quick Deploy to Railway
echo ========================================
echo.

echo Adding files to git...
git add .

echo.
echo Committing changes...
git commit -m "Deploy to Railway"

echo.
echo Pushing to GitHub...
git push

echo.
echo ========================================
echo Code pushed to GitHub!
echo ========================================
echo.
echo Next steps:
echo 1. Go to https://railway.app/new
echo 2. Click "Deploy from GitHub repo"
echo 3. Select: Lox123JUSSY12345/fuzzy-auron
echo 4. Wait for deployment
echo 5. Generate domain in Settings - Networking
echo.
echo Your site will be live in 2-3 minutes!
echo.
pause
