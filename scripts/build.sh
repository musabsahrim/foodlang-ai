#!/bin/bash

# FoodLang AI Build Script
# This script builds the application for different environments

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Default values
ENVIRONMENT="development"
SKIP_TESTS=false
SKIP_LINT=false

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -e|--env)
            ENVIRONMENT="$2"
            shift 2
            ;;
        --skip-tests)
            SKIP_TESTS=true
            shift
            ;;
        --skip-lint)
            SKIP_LINT=true
            shift
            ;;
        -h|--help)
            echo "Usage: $0 [OPTIONS]"
            echo "Options:"
            echo "  -e, --env ENV     Environment (development|production) [default: development]"
            echo "  --skip-tests      Skip running tests"
            echo "  --skip-lint       Skip linting"
            echo "  -h, --help        Show this help message"
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            exit 1
            ;;
    esac
done

print_status "Building FoodLang AI for $ENVIRONMENT environment"

# Check if we're in the right directory
if [[ ! -f "package.json" ]]; then
    print_error "package.json not found. Please run this script from the project root."
    exit 1
fi

# Install frontend dependencies
print_status "Installing frontend dependencies..."
npm install

# Lint frontend code (if not skipped)
if [[ "$SKIP_LINT" == false ]]; then
    print_status "Linting frontend code..."
    npm run lint || {
        print_warning "Linting failed, but continuing build..."
    }
fi

# Build frontend
print_status "Building frontend..."
if [[ "$ENVIRONMENT" == "production" ]]; then
    NODE_ENV=production npm run build
else
    npm run build
fi

# Backend setup
print_status "Setting up backend..."
cd backend

# Check if Python is available
if ! command -v python3 &> /dev/null; then
    print_error "Python 3 is required but not installed."
    exit 1
fi

# Install backend dependencies
print_status "Installing backend dependencies..."
pip install -r requirements.txt

# Run backend tests (if not skipped)
if [[ "$SKIP_TESTS" == false ]]; then
    print_status "Running backend tests..."
    if [[ -f "test_main.py" ]]; then
        python -m pytest test_main.py -v || {
            print_warning "Some tests failed, but continuing build..."
        }
    else
        print_warning "No test file found, skipping tests..."
    fi
fi

cd ..

print_status "Build completed successfully!"
print_status "Environment: $ENVIRONMENT"

if [[ "$ENVIRONMENT" == "development" ]]; then
    echo ""
    print_status "To start the application:"
    echo "  Frontend: npm run dev"
    echo "  Backend:  npm run backend:dev"
elif [[ "$ENVIRONMENT" == "production" ]]; then
    echo ""
    print_status "Production build ready for deployment"
    echo "  Frontend build: .next/"
    echo "  Backend ready: backend/"
fi