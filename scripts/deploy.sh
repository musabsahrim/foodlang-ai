#!/bin/bash

# FoodLang AI Deployment Script
# This script helps deploy the application to various platforms

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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

print_header() {
    echo -e "${BLUE}[DEPLOY]${NC} $1"
}

# Default values
PLATFORM=""
ENVIRONMENT="production"
DRY_RUN=false

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -p|--platform)
            PLATFORM="$2"
            shift 2
            ;;
        -e|--env)
            ENVIRONMENT="$2"
            shift 2
            ;;
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        -h|--help)
            echo "Usage: $0 [OPTIONS]"
            echo "Options:"
            echo "  -p, --platform PLATFORM  Deployment platform (vercel|railway|render|docker)"
            echo "  -e, --env ENV            Environment (development|production) [default: production]"
            echo "  --dry-run                Show what would be deployed without actually deploying"
            echo "  -h, --help               Show this help message"
            echo ""
            echo "Platforms:"
            echo "  vercel    Deploy frontend to Vercel"
            echo "  railway   Deploy backend to Railway"
            echo "  render    Deploy backend to Render"
            echo "  docker    Build and run with Docker"
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            exit 1
            ;;
    esac
done

if [[ -z "$PLATFORM" ]]; then
    print_error "Platform is required. Use -p or --platform option."
    echo "Available platforms: vercel, railway, render, docker"
    exit 1
fi

print_header "Deploying FoodLang AI to $PLATFORM ($ENVIRONMENT)"

# Pre-deployment checks
print_status "Running pre-deployment checks..."

# Check if we're in the right directory
if [[ ! -f "package.json" ]]; then
    print_error "package.json not found. Please run this script from the project root."
    exit 1
fi

# Check environment files
case $PLATFORM in
    vercel)
        if [[ ! -f ".env.production.example" && "$ENVIRONMENT" == "production" ]]; then
            print_warning "No .env.production.example found. Make sure environment variables are set in Vercel dashboard."
        fi
        ;;
    railway|render)
        if [[ ! -f "backend/.env.production.example" && "$ENVIRONMENT" == "production" ]]; then
            print_warning "No backend/.env.production.example found. Make sure environment variables are set in platform dashboard."
        fi
        ;;
esac

# Platform-specific deployment
case $PLATFORM in
    vercel)
        print_status "Deploying frontend to Vercel..."
        
        if [[ "$DRY_RUN" == true ]]; then
            print_status "DRY RUN: Would deploy to Vercel with:"
            echo "  - Build command: npm run build"
            echo "  - Output directory: .next"
            echo "  - Environment: $ENVIRONMENT"
        else
            # Check if Vercel CLI is installed
            if ! command -v vercel &> /dev/null; then
                print_error "Vercel CLI is not installed. Install with: npm i -g vercel"
                exit 1
            fi
            
            # Deploy to Vercel
            if [[ "$ENVIRONMENT" == "production" ]]; then
                vercel --prod
            else
                vercel
            fi
        fi
        ;;
        
    railway)
        print_status "Deploying backend to Railway..."
        
        if [[ "$DRY_RUN" == true ]]; then
            print_status "DRY RUN: Would deploy to Railway with:"
            echo "  - Build command: pip install -r requirements.txt"
            echo "  - Start command: uvicorn main:app --host 0.0.0.0 --port \$PORT"
            echo "  - Root directory: backend/"
        else
            # Check if Railway CLI is installed
            if ! command -v railway &> /dev/null; then
                print_error "Railway CLI is not installed. Install from: https://railway.app/cli"
                exit 1
            fi
            
            cd backend
            railway up
            cd ..
        fi
        ;;
        
    render)
        print_status "Deploying backend to Render..."
        
        if [[ "$DRY_RUN" == true ]]; then
            print_status "DRY RUN: Would deploy to Render using render.yaml configuration"
        else
            print_status "Please push your code to GitHub and connect your repository in Render dashboard."
            print_status "Render will automatically deploy using the render.yaml configuration."
        fi
        ;;
        
    docker)
        print_status "Building and running with Docker..."
        
        if [[ "$DRY_RUN" == true ]]; then
            print_status "DRY RUN: Would build and run Docker containers"
        else
            # Check if Docker is installed
            if ! command -v docker &> /dev/null; then
                print_error "Docker is not installed."
                exit 1
            fi
            
            cd backend
            
            # Build the image
            print_status "Building Docker image..."
            docker build -t foodlang-ai-backend .
            
            # Run with docker-compose
            print_status "Starting services with docker-compose..."
            docker-compose up -d
            
            print_status "Backend is running at http://localhost:8000"
            print_status "Health check: http://localhost:8000/api/health"
            
            cd ..
        fi
        ;;
        
    *)
        print_error "Unknown platform: $PLATFORM"
        exit 1
        ;;
esac

print_status "Deployment process completed!"

# Post-deployment instructions
case $PLATFORM in
    vercel)
        echo ""
        print_status "Next steps:"
        echo "1. Set environment variables in Vercel dashboard"
        echo "2. Configure custom domain (optional)"
        echo "3. Test the deployed application"
        ;;
    railway)
        echo ""
        print_status "Next steps:"
        echo "1. Set environment variables in Railway dashboard"
        echo "2. Upload ProductList.xlsx via admin panel"
        echo "3. Test all API endpoints"
        ;;
    render)
        echo ""
        print_status "Next steps:"
        echo "1. Connect GitHub repository in Render dashboard"
        echo "2. Set environment variables in Render dashboard"
        echo "3. Deploy will happen automatically on git push"
        ;;
    docker)
        echo ""
        print_status "Docker containers are running:"
        echo "- Backend: http://localhost:8000"
        echo "- Health check: http://localhost:8000/api/health"
        echo ""
        print_status "To stop: docker-compose down"
        ;;
esac