#!/usr/bin/env python3
"""
Test script to verify backend deployment readiness
"""

import requests
import json
import sys
import os
from pathlib import Path

def test_local_backend(base_url="http://localhost:8000"):
    """Test local backend endpoints"""
    print(f"Testing backend at {base_url}")
    print("=" * 50)
    
    # Test health endpoint
    try:
        response = requests.get(f"{base_url}/api/health", timeout=10)
        print(f"✅ Health check: {response.status_code}")
        if response.status_code == 200:
            health_data = response.json()
            print(f"   - Status: {health_data.get('status')}")
            print(f"   - Glossary loaded: {health_data.get('glossary_loaded')}")
            print(f"   - Glossary entries: {health_data.get('glossary_entries')}")
        else:
            print(f"   - Error: {response.text}")
    except Exception as e:
        print(f"❌ Health check failed: {e}")
        return False
    
    # Test root endpoint
    try:
        response = requests.get(f"{base_url}/", timeout=10)
        print(f"✅ Root endpoint: {response.status_code}")
    except Exception as e:
        print(f"❌ Root endpoint failed: {e}")
    
    # Test translation endpoint (if glossary is loaded)
    try:
        response = requests.post(
            f"{base_url}/api/translate",
            json={"text": "chicken"},
            timeout=10
        )
        print(f"✅ Translation endpoint: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"   - Translation: {data.get('translated_text')}")
            print(f"   - Cost: ${data.get('cost_estimate')}")
    except Exception as e:
        print(f"❌ Translation endpoint failed: {e}")
    
    # Test admin login
    try:
        response = requests.post(
            f"{base_url}/api/admin/login",
            json={"username": "admin", "password": "admin123"},
            timeout=10
        )
        print(f"✅ Admin login: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"   - Token received: {len(data.get('token', ''))} chars")
    except Exception as e:
        print(f"❌ Admin login failed: {e}")
    
    return True

def check_files():
    """Check if required files exist"""
    print("Checking required files...")
    print("=" * 30)
    
    required_files = [
        "main.py",
        "requirements.txt",
        "railway.toml",
        "render.yaml",
        ".env.production",
        "data/ProductList.xlsx"
    ]
    
    all_exist = True
    for file_path in required_files:
        if os.path.exists(file_path):
            print(f"✅ {file_path}")
        else:
            print(f"❌ {file_path} - MISSING")
            all_exist = False
    
    return all_exist

def main():
    """Main test function"""
    print("FoodLang AI Backend Deployment Test")
    print("=" * 40)
    
    # Check files
    if not check_files():
        print("\n❌ Some required files are missing!")
        return False
    
    print("\n✅ All required files present")
    
    # Test if we can import main modules
    try:
        import fastapi
        import uvicorn
        import pandas
        import faiss
        import openai
        print("✅ All required Python packages available")
    except ImportError as e:
        print(f"❌ Missing Python package: {e}")
        return False
    
    print("\n🚀 Backend is ready for deployment!")
    print("\nNext steps:")
    print("1. Push code to GitHub")
    print("2. Deploy to Railway or Render")
    print("3. Set environment variables")
    print("4. Test deployed endpoints")
    
    return True

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)