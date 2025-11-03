@echo off
REM FoodLang AI Build Script for Windows
REM This script builds the application for different environments

setlocal enabledelayedexpansion

REM Default values
set ENVIRONMENT=development
set SKIP_TESTS=false
set SKIP_LINT=false

REM Parse command line arguments
:parse_args
if "%~1"=="" goto start_build
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
if "%~1"=="--skip-tests" (
    set SKIP_TESTS=true
    shift
    goto parse_args
)
if "%~1"=="--skip-lint" (
    set SKIP_LINT=true
    shift
    goto parse_args
)
if "%~1"=="-h" goto show_help
if "%~1"=="--help" goto show_help
echo Unknown option: %~1
exit /b 1

:show_help
echo Usage: %0 [OPTIONS]
echo Options:
echo   -e, --env ENV     Environment (development^|production) [default: development]
echo   --skip-tests      Skip running tests
echo   --skip-lint       Skip linting
echo   -h, --help        Show this help message
exit /b 0

:start_build
echo [INFO] Building FoodLang AI for %ENVIRONMENT% environment

REM Check if we're in the right directory
if not exist "package.json" (
    echo [ERROR] package.json not found. Please run this script from the project root.
    exit /b 1
)

REM Install frontend dependencies
echo [INFO] Installing frontend dependencies...
call npm install
if errorlevel 1 (
    echo [ERROR] Failed to install frontend dependencies
    exit /b 1
)

REM Lint frontend code (if not skipped)
if "%SKIP_LINT%"=="false" (
    echo [INFO] Linting frontend code...
    call npm run lint
    if errorlevel 1 (
        echo [WARNING] Linting failed, but continuing build...
    )
)

REM Build frontend
echo [INFO] Building frontend...
if "%ENVIRONMENT%"=="production" (
    set NODE_ENV=production
    call npm run build
) else (
    call npm run build
)
if errorlevel 1 (
    echo [ERROR] Frontend build failed
    exit /b 1
)

REM Backend setup
echo [INFO] Setting up backend...
cd backend

REM Check if Python is available
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python is required but not installed.
    exit /b 1
)

REM Install backend dependencies
echo [INFO] Installing backend dependencies...
pip install -r requirements.txt
if errorlevel 1 (
    echo [ERROR] Failed to install backend dependencies
    exit /b 1
)

REM Run backend tests (if not skipped)
if "%SKIP_TESTS%"=="false" (
    echo [INFO] Running backend tests...
    if exist "test_main.py" (
        python -m pytest test_main.py -v
        if errorlevel 1 (
            echo [WARNING] Some tests failed, but continuing build...
        )
    ) else (
        echo [WARNING] No test file found, skipping tests...
    )
)

cd ..

echo [INFO] Build completed successfully!
echo [INFO] Environment: %ENVIRONMENT%

if "%ENVIRONMENT%"=="development" (
    echo.
    echo [INFO] To start the application:
    echo   Frontend: npm run dev
    echo   Backend:  npm run backend:dev
) else (
    echo.
    echo [INFO] Production build ready for deployment
    echo   Frontend build: .next/
    echo   Backend ready: backend/
)

endlocal