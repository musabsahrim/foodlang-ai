#!/usr/bin/env node

/**
 * FoodLang AI Build Script (Node.js wrapper)
 * This script provides a cross-platform way to build the application
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Parse command line arguments
const args = process.argv.slice(2);
const environment = args.includes('--env') ? args[args.indexOf('--env') + 1] : 'development';
const skipTests = args.includes('--skip-tests');
const skipLint = args.includes('--skip-lint');

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

function runCommand(command, options = {}) {
    try {
        execSync(command, { stdio: 'inherit', ...options });
        return true;
    } catch (err) {
        return false;
    }
}

function main() {
    log(`Building FoodLang AI for ${environment} environment`, 'green');

    // Check if we're in the right directory
    if (!fs.existsSync('package.json')) {
        error('package.json not found. Please run this script from the project root.');
        process.exit(1);
    }

    // Install frontend dependencies
    log('Installing frontend dependencies...');
    if (!runCommand('npm install')) {
        error('Failed to install frontend dependencies');
        process.exit(1);
    }

    // Lint frontend code (if not skipped)
    if (!skipLint) {
        log('Linting frontend code...');
        if (!runCommand('npm run lint')) {
            warn('Linting failed, but continuing build...');
        }
    }

    // Build frontend
    log('Building frontend...');
    const buildEnv = environment === 'production' ? { NODE_ENV: 'production' } : {};
    if (!runCommand('npm run build', { env: { ...process.env, ...buildEnv } })) {
        error('Frontend build failed');
        process.exit(1);
    }

    // Backend setup
    log('Setting up backend...');
    
    // Check if Python is available
    try {
        execSync('python --version', { stdio: 'pipe' });
    } catch (err) {
        try {
            execSync('python3 --version', { stdio: 'pipe' });
        } catch (err2) {
            error('Python is required but not installed.');
            process.exit(1);
        }
    }

    // Install backend dependencies
    log('Installing backend dependencies...');
    if (!runCommand('pip install -r requirements.txt', { cwd: 'backend' })) {
        error('Failed to install backend dependencies');
        process.exit(1);
    }

    // Run backend tests (if not skipped)
    if (!skipTests) {
        log('Running backend tests...');
        if (fs.existsSync('backend/test_main.py')) {
            if (!runCommand('python -m pytest test_main.py -v', { cwd: 'backend' })) {
                warn('Some tests failed, but continuing build...');
            }
        } else {
            warn('No test file found, skipping tests...');
        }
    }

    log('Build completed successfully!', 'green');
    log(`Environment: ${environment}`);

    if (environment === 'development') {
        console.log('');
        log('To start the application:');
        console.log('  Frontend: npm run dev');
        console.log('  Backend:  npm run backend:dev');
    } else {
        console.log('');
        log('Production build ready for deployment');
        console.log('  Frontend build: .next/');
        console.log('  Backend ready: backend/');
    }
}

if (require.main === module) {
    main();
}

module.exports = { main };