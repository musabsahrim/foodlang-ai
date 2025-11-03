@echo off
echo Creating fresh repository without API key history...

REM Navigate to project root
cd /d "%~dp0"

REM Remove existing git history
rmdir /s /q .git

REM Initialize fresh git repository
git init

REM Add all files (now clean)
git add .

REM Create initial commit
git commit -m "Initial commit - FoodLang AI ready for deployment"

REM Add remote (you'll need to create new GitHub repo first)
git remote add origin https://github.com/musabsahrim/foodlang-ai.git

REM Create main branch and push
git branch -M main
git push -u origin main

echo Done! Fresh repository created without API key history.
pause