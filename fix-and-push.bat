@echo off
echo Fixing API key issues and pushing to GitHub...

REM Navigate to project root
cd /d "%~dp0"

REM Add all changes
git add .

REM Commit the fixes
git commit -m "Remove API keys from documentation files for security"

REM Push to GitHub
git push -u origin main

echo Done! Check if push was successful.
pause