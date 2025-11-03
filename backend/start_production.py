#!/usr/bin/env python3
"""
Production startup script for FoodLang AI backend
Handles graceful startup, health checks, and environment validation
"""
import os
import sys
import time
import signal
import logging
import subprocess
from pathlib import Path

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("startup")

def validate_environment():
    """Validate required environment variables and dependencies"""
    required_vars = [
        "OPENAI_API_KEY",
        "JWT_SECRET",
        "ADMIN_USERNAME", 
        "ADMIN_PASSWORD"
    ]
    
    missing_vars = []
    for var in required_vars:
        if not os.getenv(var):
            missing_vars.append(var)
    
    if missing_vars:
        logger.error(f"Missing required environment variables: {', '.join(missing_vars)}")
        return False
    
    # Validate JWT secret strength
    jwt_secret = os.getenv("JWT_SECRET")
    if len(jwt_secret) < 32:
        logger.warning("JWT_SECRET should be at least 32 characters for security")
    
    # Check if data directory exists
    data_dir = Path("data")
    if not data_dir.exists():
        logger.info("Creating data directory...")
        data_dir.mkdir(exist_ok=True)
    
    return True

def check_dependencies():
    """Check if all required Python packages are installed"""
    try:
        import fastapi
        import uvicorn
        import gunicorn
        import openai
        import faiss
        import pandas
        import psutil
        logger.info("All required dependencies are available")
        return True
    except ImportError as e:
        logger.error(f"Missing dependency: {e}")
        return False

def wait_for_health_check(port=8000, timeout=60):
    """Wait for the server to be healthy"""
    import requests
    
    health_url = f"http://localhost:{port}/api/health"
    start_time = time.time()
    
    while time.time() - start_time < timeout:
        try:
            response = requests.get(health_url, timeout=5)
            if response.status_code == 200:
                health_data = response.json()
                if health_data.get("status") in ["healthy", "degraded"]:
                    logger.info(f"Server is {health_data['status']} - Health check passed")
                    return True
        except Exception as e:
            logger.debug(f"Health check failed: {e}")
        
        time.sleep(2)
    
    logger.error("Health check timeout - Server may not be responding")
    return False

def start_production_server():
    """Start the production server using Gunicorn"""
    port = int(os.getenv("PORT", 8000))
    workers = int(os.getenv("WORKERS", 4))
    
    # Gunicorn command
    cmd = [
        "gunicorn",
        "main:app",
        "-c", "gunicorn.conf.py",
        "--bind", f"0.0.0.0:{port}",
        "--workers", str(workers),
        "--worker-class", "uvicorn.workers.UvicornWorker",
        "--access-logfile", "-",
        "--error-logfile", "-",
        "--log-level", os.getenv("LOG_LEVEL", "info")
    ]
    
    logger.info(f"Starting production server with command: {' '.join(cmd)}")
    
    # Start the server
    process = subprocess.Popen(cmd)
    
    # Wait a bit for server to start
    time.sleep(5)
    
    # Check if server is healthy
    if wait_for_health_check(port):
        logger.info("Production server started successfully")
        return process
    else:
        logger.error("Production server failed to start properly")
        process.terminate()
        return None

def signal_handler(signum, frame):
    """Handle shutdown signals gracefully"""
    logger.info(f"Received signal {signum}, shutting down gracefully...")
    sys.exit(0)

def main():
    """Main startup function"""
    logger.info("🚀 Starting FoodLang AI production server...")
    
    # Register signal handlers
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)
    
    # Validate environment
    if not validate_environment():
        logger.error("Environment validation failed")
        sys.exit(1)
    
    # Check dependencies
    if not check_dependencies():
        logger.error("Dependency check failed")
        sys.exit(1)
    
    # Start production server
    process = start_production_server()
    if not process:
        logger.error("Failed to start production server")
        sys.exit(1)
    
    try:
        # Wait for the process to complete
        process.wait()
    except KeyboardInterrupt:
        logger.info("Received interrupt, shutting down...")
        process.terminate()
        process.wait()
    
    logger.info("Production server shutdown complete")

if __name__ == "__main__":
    main()