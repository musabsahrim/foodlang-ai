#!/usr/bin/env node

/**
 * FoodLang AI Deployment Script (Node.js wrapper)
 * This script provides a cross-platform way to deploy the application
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Parse command line arguments
const args = process.argv.slice(2);
const platform = args.includes('--platform') ? args[args.indexOf('--platform') + 1] : '';
const environment = args.includes('--env') ? args[args.indexOf('--env') + 1] : 'production';
const dryRun = args.includes('--dry-run');

// Colors for console output
const colors = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}[INFO]${colors.reset} ${message}`);
}

function warn(message) {
    console.log(`${colors.yellow}[WARNING]${colors.reset} ${message}`);
}

function error(message) {
    console.log(`${colors.red}[ERROR]${colors.reset} ${message}`);
}

function header(message) {
    console.log(`${colors.blue}[DEPLOY]${colors.reset} ${message}`);
}

function runCommand(command, options = {}) {
    try {
        execSync(command, { stdio: 'inherit', ...options });
        return true;
    } catch (err) {
        return false;
    }
}

function checkCommand(command) {
    try {
        execSync(`${command} --version`, { stdio: 'pipe' });
        return true;
    } catch (err) {
        return false;
    }
}

function showHelp() {
    console.log('Usage: node scripts/deploy.js [OPTIONS]');
    console.log('Options:');
    console.log('  --platform PLATFORM  Deployment platform (vercel|railway|render|docker)');
    console.log('  --env ENV            Environment (development|production) [default: production]');
    console.log('  --dry-run            Show what would be deployed without actually deploying');
    console.log('  --help               Show this help message');
    console.log('');
    console.log('Platforms:');
    console.log('  vercel    Deploy frontend to Vercel');
    console.log('  railway   Deploy backend to Railway');
    console.log('  render    Deploy backend to Render');
    console.log('  docker    Build and run with Docker');
}

function deployVercel() {
    log('Deploying frontend to Vercel...');
    
    if (dryRun) {
        log('DRY RUN: Would deploy to Vercel with:');
        console.log('  - Build command: npm run build');
        console.log('  - Output directory: .next');
        console.log(`  - Environment: ${environment}`);
        return;
    }

    // Check if Vercel CLI is installed
    if (!checkCommand('vercel')) {
        error('Vercel CLI is not installed. Install with: npm i -g vercel');
        process.exit(1);
    }

    // Deploy to Vercel
    const deployCommand = environment === 'production' ? 'vercel --prod' : 'vercel';
    if (!runCommand(deployCommand)) {
        error('Vercel deployment failed');
        process.exit(1);
    }
}

function deployRailway() {
    log('Deploying backend to Railway...');
    
    if (dryRun) {
        log('DRY RUN: Would deploy to Railway with:');
        console.log('  - Build command: pip install -r requirements.txt');
        console.log('  - Start command: uvicorn main:app --host 0.0.0.0 --port $PORT');
        console.log('  - Root directory: backend/');
        return;
    }

    // Check if Railway CLI is installed
    if (!checkCommand('railway')) {
        error('Railway CLI is not installed. Install from: https://railway.app/cli');
        process.exit(1);
    }

    // Deploy to Railway
    if (!runCommand('railway up', { cwd: 'backend' })) {
        error('Railway deployment failed');
        process.exit(1);
    }
}

function deployRender() {
    log('Deploying backend to Render...');
    
    if (dryRun) {
        log('DRY RUN: Would deploy to Render using render.yaml configuration');
        return;
    }

    log('Please push your code to GitHub and connect your repository in Render dashboard.');
    log('Render will automatically deploy using the render.yaml configuration.');
}

function deployDocker() {
    log('Building and running with Docker...');
    
    if (dryRun) {
        log('DRY RUN: Would build and run Docker containers');
        return;
    }

    // Check if Docker is installed
    if (!checkCommand('docker')) {
        error('Docker is not installed.');
        process.exit(1);
    }

    // Build the image
    log('Building Docker image...');
    if (!runCommand('docker build -t foodlang-ai-backend .', { cwd: 'backend' })) {
        error('Docker build failed');
        process.exit(1);
    }

    // Run with docker-compose
    log('Starting services with docker-compose...');
    if (!runCommand('docker-compose up -d', { cwd: 'backend' })) {
        error('Docker compose failed');
        process.exit(1);
    }

    log('Backend is running at http://localhost:8000');
    log('Health check: http://localhost:8000/api/health');
}

function showPostDeploymentInstructions() {
    console.log('');
    log('Deployment process completed!', 'green');

    switch (platform) {
        case 'vercel':
            console.log('');
            log('Next steps:');
            console.log('1. Set environment variables in Vercel dashboard');
            console.log('2. Configure custom domain (optional)');
            console.log('3. Test the deployed application');
            break;
        case 'railway':
            console.log('');
            log('Next steps:');
            console.log('1. Set environment variables in Railway dashboard');
            console.log('2. Upload ProductList.xlsx via admin panel');
            console.log('3. Test all API endpoints');
            break;
        case 'render':
            console.log('');
            log('Next steps:');
            console.log('1. Connect GitHub repository in Render dashboard');
            console.log('2. Set environment variables in Render dashboard');
            console.log('3. Deploy will happen automatically on git push');
            break;
        case 'docker':
            console.log('');
            log('Docker containers are running:');
            console.log('- Backend: http://localhost:8000');
            console.log('- Health check: http://localhost:8000/api/health');
            console.log('');
            log('To stop: docker-compose down');
            break;
    }
}

function main() {
    if (args.includes('--help')) {
        showHelp();
        return;
    }

    if (!platform) {
        error('Platform is required. Use --platform option.');
        console.log('Available platforms: vercel, railway, render, docker');
        process.exit(1);
    }

    header(`Deploying FoodLang AI to ${platform} (${environment})`);

    // Pre-deployment checks
    log('Running pre-deployment checks...');

    // Check if we're in the right directory
    if (!fs.existsSync('package.json')) {
        error('package.json not found. Please run this script from the project root.');
        process.exit(1);
    }

    // Platform-specific deployment
    switch (platform) {
        case 'vercel':
            deployVercel();
            break;
        case 'railway':
            deployRailway();
            break;
        case 'render':
            deployRender();
            break;
        case 'docker':
            deployDocker();
            break;
        default:
            error(`Unknown platform: ${platform}`);
            process.exit(1);
    }

    showPostDeploymentInstructions();
}

if (require.main === module) {
    main();
}

module.exports = { main };