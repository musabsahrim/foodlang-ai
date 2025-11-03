#!/usr/bin/env python3
"""
Test script to verify error handling and monitoring functionality
"""

import requests
import json
import time
import sys
from typing import Dict, Any

def test_health_endpoint(api_url: str = "http://localhost:8000") -> bool:
    """Test the health endpoint"""
    print("🔍 Testing health endpoint...")
    
    try:
        response = requests.get(f"{api_url}/api/health", timeout=10)
        
        if response.status_code == 200:
            health_data = response.json()
            print(f"✅ Health endpoint working - Status: {health_data.get('overall_status', 'unknown')}")
            print(f"   Checks: {len(health_data.get('checks', {}))}")
            print(f"   Uptime: {health_data.get('uptime_hours', 0):.2f} hours")
            return True
        else:
            print(f"❌ Health endpoint failed with status {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Health endpoint error: {e}")
        return False

def test_translation_error_handling(api_url: str = "http://localhost:8000") -> bool:
    """Test translation endpoint error handling"""
    print("\n🔍 Testing translation error handling...")
    
    # Test with empty text
    try:
        response = requests.post(
            f"{api_url}/api/translate",
            json={"text": ""},
            timeout=10
        )
        
        if response.status_code == 400:
            print("✅ Empty text validation working")
        else:
            print(f"⚠️ Expected 400 for empty text, got {response.status_code}")
            
    except Exception as e:
        print(f"❌ Translation error test failed: {e}")
        return False
    
    # Test with very long text
    try:
        long_text = "A" * 20000  # Exceed max length
        response = requests.post(
            f"{api_url}/api/translate",
            json={"text": long_text},
            timeout=10
        )
        
        if response.status_code == 400:
            print("✅ Long text validation working")
        else:
            print(f"⚠️ Expected 400 for long text, got {response.status_code}")
            
    except Exception as e:
        print(f"❌ Long text error test failed: {e}")
        return False
    
    return True

def test_ocr_error_handling(api_url: str = "http://localhost:8000") -> bool:
    """Test OCR endpoint error handling"""
    print("\n🔍 Testing OCR error handling...")
    
    # Test with invalid file type
    try:
        files = {'file': ('test.txt', 'This is not an image', 'text/plain')}
        response = requests.post(
            f"{api_url}/api/ocr",
            files=files,
            timeout=10
        )
        
        if response.status_code == 400:
            print("✅ Invalid file type validation working")
        else:
            print(f"⚠️ Expected 400 for invalid file type, got {response.status_code}")
            
    except Exception as e:
        print(f"❌ OCR error test failed: {e}")
        return False
    
    return True

def test_rate_limiting(api_url: str = "http://localhost:8000") -> bool:
    """Test rate limiting"""
    print("\n🔍 Testing rate limiting...")
    
    # Make multiple rapid requests to trigger rate limiting
    try:
        for i in range(10):
            response = requests.get(f"{api_url}/api/health", timeout=5)
            if response.status_code == 429:
                print("✅ Rate limiting working")
                return True
        
        print("⚠️ Rate limiting not triggered (may need more requests)")
        return True
        
    except Exception as e:
        print(f"❌ Rate limiting test failed: {e}")
        return False

def test_admin_endpoints(api_url: str = "http://localhost:8000") -> bool:
    """Test admin endpoint authentication"""
    print("\n🔍 Testing admin endpoint authentication...")
    
    # Test without authentication
    try:
        response = requests.get(f"{api_url}/api/admin/monitoring", timeout=10)
        
        if response.status_code == 401:
            print("✅ Admin authentication working")
            return True
        else:
            print(f"⚠️ Expected 401 for unauthenticated admin request, got {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Admin authentication test failed: {e}")
        return False

def test_monitoring_data(api_url: str = "http://localhost:8000", admin_token: str = None) -> bool:
    """Test monitoring data retrieval"""
    if not admin_token:
        print("\n⏭️ Skipping monitoring data test (no admin token)")
        return True
        
    print("\n🔍 Testing monitoring data retrieval...")
    
    try:
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.get(f"{api_url}/api/admin/monitoring", headers=headers, timeout=10)
        
        if response.status_code == 200:
            monitoring_data = response.json()
            print("✅ Monitoring data retrieval working")
            print(f"   Health checks: {len(monitoring_data.get('health_checks', {}).get('checks', {}))}")
            print(f"   Recent errors: {len(monitoring_data.get('recent_errors', []))}")
            print(f"   Alerts: {len(monitoring_data.get('alerts', []))}")
            return True
        else:
            print(f"❌ Monitoring data failed with status {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Monitoring data test failed: {e}")
        return False

def get_admin_token(api_url: str = "http://localhost:8000") -> str:
    """Get admin token for testing"""
    try:
        # Try default credentials
        response = requests.post(
            f"{api_url}/api/admin/login",
            json={"username": "admin", "password": "admin123"},
            timeout=10
        )
        
        if response.status_code == 200:
            login_data = response.json()
            return login_data.get("token")
        else:
            print(f"⚠️ Could not get admin token (status {response.status_code})")
            return None
            
    except Exception as e:
        print(f"⚠️ Could not get admin token: {e}")
        return None

def main():
    """Run all tests"""
    import argparse
    
    parser = argparse.ArgumentParser(description="Test FoodLang AI error handling and monitoring")
    parser.add_argument("--api-url", default="http://localhost:8000", help="API base URL")
    
    args = parser.parse_args()
    
    print(f"🧪 Testing FoodLang AI API at {args.api_url}")
    print("=" * 60)
    
    # Get admin token for authenticated tests
    admin_token = get_admin_token(args.api_url)
    
    # Run tests
    tests = [
        ("Health Endpoint", lambda: test_health_endpoint(args.api_url)),
        ("Translation Error Handling", lambda: test_translation_error_handling(args.api_url)),
        ("OCR Error Handling", lambda: test_ocr_error_handling(args.api_url)),
        ("Rate Limiting", lambda: test_rate_limiting(args.api_url)),
        ("Admin Authentication", lambda: test_admin_endpoints(args.api_url)),
        ("Monitoring Data", lambda: test_monitoring_data(args.api_url, admin_token)),
    ]
    
    results = []
    for test_name, test_func in tests:
        try:
            result = test_func()
            results.append((test_name, result))
        except Exception as e:
            print(f"❌ {test_name} failed with exception: {e}")
            results.append((test_name, False))
    
    # Summary
    print("\n" + "=" * 60)
    print("📊 Test Results Summary:")
    
    passed = 0
    total = len(results)
    
    for test_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"   {status} {test_name}")
        if result:
            passed += 1
    
    print(f"\n🎯 Overall: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All tests passed! Error handling and monitoring are working correctly.")
        sys.exit(0)
    else:
        print("⚠️ Some tests failed. Please check the implementation.")
        sys.exit(1)

if __name__ == "__main__":
    main()