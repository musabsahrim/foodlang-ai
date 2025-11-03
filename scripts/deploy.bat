@echo off
REM FoodLang AI Deployment Script for Windows
REM This script helps deploy the application to various platforms

setlocal enabledelayedexpansion

REM Default values
set PLATFORM=
set ENVIRONMENT=production
set DRY_RUN=false

REM Parse command line arguments
:parse_args
if "%~1"=="" goto check_platform
if "%~1"=="-p" (
    set PLATFORM=%~2
    shift
    shift
    goto parse_args
)
if "%~1"=="--platform" (
    set PLATFORM=%~2
    shift
    shift
    goto parse_args
)
if "%~1"=="-e" (
    set ENVIRONMENT=%~2
    shift
    shift
    goto parse_args
)
if "%~1"=="--env" (
    set ENVIRONMENT=%~2
    shift
    shift
    goto parse_args
)
if "%~1"=="--dry-run" (
    set DRY_RUN=true
    shift
    goto parse_args
)
if "%~1"=="-h" goto show_help
if "%~1"=="--help" goto show_help
echo [ERROR] Unknown option: %~1
exit /b 1

:show_help
echo Usage: %0 [OPTIONS]
echo Options:
echo   -p, --platform PLATFORM  Deployment platform (vercel^|railway^|render^|docker)
echo   -e, --env ENV            Environment (development^|production) [default: production]
echo   --dry-run                Show what would be deployed without actually deploying
echo   -h, --help               Show this help message
echo.
echo Platforms:
echo   vercel    Deploy frontend to Vercel
echo   railway   Deploy backend to Railway
echo   render    Deploy backend to Render
echo   docker    Build and run with Docker
exit /b 0

:check_platform
if "%PLATFORM%"=="" (
    echo [ERROR] Platform is required. Use -p or --platform option.
    echo Available platforms: vercel, railway, render, docker
    exit /b 1
)

echo [DEPLOY] Deploying FoodLang AI to %PLATFORM% (%ENVIRONMENT%)

REM Pre-deployment checks
echo [INFO] Running pre-deployment checks...

REM Check if we're in the right directory
if not exist "package.json" (
    echo [ERROR] package.json not found. Please run this script from the project root.
    exit /b 1
)

REM Platform-specific deployment
if "%PLATFORM%"=="vercel" goto deploy_vercel
if "%PLATFORM%"=="railway" goto deploy_railway
if "%PLATFORM%"=="render" goto deploy_render
if "%PLATFORM%"=="docker" goto deploy_docker
echo [ERROR] Unknown platform: %PLATFORM%
exit /b 1

:deploy_vercel
echo [INFO] Deploying frontend to Vercel...

if "%DRY_RUN%"=="true" (
    echo [INFO] DRY RUN: Would deploy to Vercel with:
    echo   - Build command: npm run build
    echo   - Output directory: .next
    echo   - Environment: %ENVIRONMENT%
    goto post_deployment
)

REM Check if Vercel CLI is installed
vercel --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Vercel CLI is not installed. Install with: npm i -g vercel
    exit /b 1
)

REM Deploy to Vercel
if "%ENVIRONMENT%"=="production" (
    call vercel --prod
) else (
    call vercel
)
goto post_deployment

:deploy_railway
echo [INFO] Deploying backend to Railway...

if "%DRY_RUN%"=="true" (
    echo [INFO] DRY RUN: Would deploy to Railway with:
    echo   - Build command: pip install -r requirements.txt
    echo   - Start command: uvicorn main:app --host 0.0.0.0 --port $PORT
    echo   - Root directory: backend/
    goto post_deployment
)

REM Check if Railway CLI is installed
railway --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Railway CLI is not installed. Install from: https://railway.app/cli
    exit /b 1
)

cd backend
call railway up
cd ..
goto post_deployment

:deploy_render
echo [INFO] Deploying backend to Render...

if "%DRY_RUN%"=="true" (
    echo [INFO] DRY RUN: Would deploy to Render using render.yaml configuration
    goto post_deployment
)

echo [INFO] Please push your code to GitHub and connect your repository in Render dashboard.
echo [INFO] Render will automatically deploy using the render.yaml configuration.
goto post_deployment

:deploy_docker
echo [INFO] Building and running with Docker...

if "%DRY_RUN%"=="true" (
    echo [INFO] DRY RUN: Would build and run Docker containers
    goto post_deployment
)

REM Check if Docker is installed
docker --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker is not installed.
    exit /b 1
)

cd backend

REM Build the image
echo [INFO] Building Docker image...
docker build -t foodlang-ai-backend .
if errorlevel 1 (
    echo [ERROR] Docker build failed
    exit /b 1
)

REM Run with docker-compose
echo [INFO] Starting services with docker-compose...
docker-compose up -d
if errorlevel 1 (
    echo [ERROR] Docker compose failed
    exit /b 1
)

echo [INFO] Backend is running at http://localhost:8000
echo [INFO] Health check: http://localhost:8000/api/health

cd ..

:post_deployment
echo [INFO] Deployment process completed!

REM Post-deployment instructions
if "%PLATFORM%"=="vercel" (
    echo.
    echo [INFO] Next steps:
    echo 1. Set environment variables in Vercel dashboard
    echo 2. Configure custom domain (optional)
    echo 3. Test the deployed application
)
if "%PLATFORM%"=="railway" (
    echo.
    echo [INFO] Next steps:
    echo 1. Set environment variables in Railway dashboard
    echo 2. Upload ProductList.xlsx via admin panel
    echo 3. Test all API endpoints
)
if "%PLATFORM%"=="render" (
    echo.
    echo [INFO] Next steps:
    echo 1. Connect GitHub repository in Render dashboard
    echo 2. Set environment variables in Render dashboard
    echo 3. Deploy will happen automatically on git push
)
if "%PLATFORM%"=="docker" (
    echo.
    echo [INFO] Docker containers are running:
    echo - Backend: http://localhost:8000
    echo - Health check: http://localhost:8000/api/health
    echo.
    echo [INFO] To stop: docker-compose down
)

endlocal