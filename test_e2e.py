#!/usr/bin/env python3
"""
End-to-End Testing Script for FoodLang AI
Tests the deployed application functionality
"""

import requests
import json
import time
import sys
from typing import Dict, Any, Optional

class FoodLangE2ETester:
    def __init__(self, frontend_url: str, backend_url: str):
        self.frontend_url = frontend_url.rstrip('/')
        self.backend_url = backend_url.rstrip('/')
        self.session = requests.Session()
        self.admin_token: Optional[str] = None
        self.test_results = []
        
    def log_test(self, test_name: str, success: bool, message: str = "", duration: float = 0):
        """Log test result"""
        status = "✅ PASS" if success else "❌ FAIL"
        result = {
            "test": test_name,
            "success": success,
            "message": message,
            "duration": round(duration, 2)
        }
        self.test_results.append(result)
        print(f"{status} {test_name} ({duration:.2f}s) - {message}")
        
    def test_backend_health(self) -> bool:
        """Test backend health endpoint"""
        start_time = time.time()
        try:
            response = self.session.get(f"{self.backend_url}/api/health", timeout=10)
            duration = time.time() - start_time
            
            if response.status_code == 200:
                data = response.json()
                glossary_loaded = data.get('glossary_loaded', False)
                entries = data.get('glossary_entries', 0)
                
                if glossary_loaded and entries > 0:
                    self.log_test("Backend Health Check", True, 
                                f"Healthy with {entries} glossary entries", duration)
                    return True
                else:
                    self.log_test("Backend Health Check", False, 
                                "Glossary not loaded", duration)
                    return False
            else:
                self.log_test("Backend Health Check", False, 
                            f"HTTP {response.status_code}", duration)
                return False
                
        except Exception as e:
            duration = time.time() - start_time
            self.log_test("Backend Health Check", False, str(e), duration)
            return False
    
    def test_text_translation(self) -> bool:
        """Test text translation functionality"""
        start_time = time.time()
        try:
            # Test Arabic to English
            response = self.session.post(
                f"{self.backend_url}/api/translate",
                json={"text": "صدر دجاج"},
                timeout=30
            )
            duration = time.time() - start_time
            
            if response.status_code == 200:
                data = response.json()
                translation = data.get('translated_text', '')
                cost = data.get('cost_estimate', 0)
                
                if translation and cost > 0:
                    self.log_test("Text Translation", True, 
                                f"Translated: '{translation}', Cost: ${cost:.6f}", duration)
                    return True
                else:
                    self.log_test("Text Translation", False, 
                                "Empty translation or zero cost", duration)
                    return False
            else:
                self.log_test("Text Translation", False, 
                            f"HTTP {response.status_code}: {response.text}", duration)
                return False
                
        except Exception as e:
            duration = time.time() - start_time
            self.log_test("Text Translation", False, str(e), duration)
            return False
    
    def test_admin_login(self) -> bool:
        """Test admin authentication"""
        start_time = time.time()
        try:
            response = self.session.post(
                f"{self.backend_url}/api/admin/login",
                json={"username": "admin", "password": "admin123"},
                timeout=10
            )
            duration = time.time() - start_time
            
            if response.status_code == 200:
                data = response.json()
                token = data.get('token', '')
                
                if token:
                    self.admin_token = token
                    self.log_test("Admin Login", True, 
                                f"Token received ({len(token)} chars)", duration)
                    return True
                else:
                    self.log_test("Admin Login", False, "No token received", duration)
                    return False
            else:
                self.log_test("Admin Login", False, 
                            f"HTTP {response.status_code}: {response.text}", duration)
                return False
                
        except Exception as e:
            duration = time.time() - start_time
            self.log_test("Admin Login", False, str(e), duration)
            return False
    
    def test_admin_glossary_info(self) -> bool:
        """Test admin glossary info endpoint"""
        if not self.admin_token:
            self.log_test("Admin Glossary Info", False, "No admin token available", 0)
            return False
            
        start_time = time.time()
        try:
            response = self.session.get(
                f"{self.backend_url}/api/admin/glossary",
                headers={"Authorization": f"Bearer {self.admin_token}"},
                timeout=10
            )
            duration = time.time() - start_time
            
            if response.status_code == 200:
                data = response.json()
                entries = data.get('total_entries', 0)
                last_updated = data.get('last_updated', 'Unknown')
                
                self.log_test("Admin Glossary Info", True, 
                            f"{entries} entries, updated: {last_updated}", duration)
                return True
            else:
                self.log_test("Admin Glossary Info", False, 
                            f"HTTP {response.status_code}: {response.text}", duration)
                return False
                
        except Exception as e:
            duration = time.time() - start_time
            self.log_test("Admin Glossary Info", False, str(e), duration)
            return False
    
    def test_cost_tracking(self) -> bool:
        """Test cost tracking endpoint"""
        start_time = time.time()
        try:
            response = self.session.get(f"{self.backend_url}/api/cost", timeout=10)
            duration = time.time() - start_time
            
            if response.status_code == 200:
                data = response.json()
                session_cost = data.get('session_cost', 0)
                total_calls = data.get('total_calls', 0)
                
                self.log_test("Cost Tracking", True, 
                            f"Session cost: ${session_cost:.6f}, Calls: {total_calls}", duration)
                return True
            else:
                self.log_test("Cost Tracking", False, 
                            f"HTTP {response.status_code}: {response.text}", duration)
                return False
                
        except Exception as e:
            duration = time.time() - start_time
            self.log_test("Cost Tracking", False, str(e), duration)
            return False
    
    def test_frontend_accessibility(self) -> bool:
        """Test frontend accessibility"""
        start_time = time.time()
        try:
            response = self.session.get(self.frontend_url, timeout=10)
            duration = time.time() - start_time
            
            if response.status_code == 200:
                html = response.text
                
                # Check for basic accessibility features
                checks = [
                    ('lang attribute', 'lang=' in html),
                    ('viewport meta', 'viewport' in html),
                    ('title tag', '<title>' in html),
                    ('main content', 'main' in html or 'role="main"' in html),
                ]
                
                passed_checks = sum(1 for _, check in checks if check)
                total_checks = len(checks)
                
                if passed_checks == total_checks:
                    self.log_test("Frontend Accessibility", True, 
                                f"All {total_checks} accessibility checks passed", duration)
                    return True
                else:
                    failed = [name for name, check in checks if not check]
                    self.log_test("Frontend Accessibility", False, 
                                f"Failed: {', '.join(failed)}", duration)
                    return False
            else:
                self.log_test("Frontend Accessibility", False, 
                            f"HTTP {response.status_code}", duration)
                return False
                
        except Exception as e:
            duration = time.time() - start_time
            self.log_test("Frontend Accessibility", False, str(e), duration)
            return False
    
    def run_all_tests(self) -> Dict[str, Any]:
        """Run all E2E tests"""
        print("🚀 Starting FoodLang AI End-to-End Tests")
        print("=" * 50)
        
        start_time = time.time()
        
        # Run tests in order
        tests = [
            self.test_backend_health,
            self.test_text_translation,
            self.test_admin_login,
            self.test_admin_glossary_info,
            self.test_cost_tracking,
            self.test_frontend_accessibility,
        ]
        
        for test in tests:
            test()
            time.sleep(0.5)  # Brief pause between tests
        
        total_duration = time.time() - start_time
        
        # Calculate results
        total_tests = len(self.test_results)
        passed_tests = sum(1 for result in self.test_results if result['success'])
        failed_tests = total_tests - passed_tests
        
        print("\n" + "=" * 50)
        print("📊 Test Summary")
        print("=" * 50)
        print(f"Total Tests: {total_tests}")
        print(f"Passed: {passed_tests}")
        print(f"Failed: {failed_tests}")
        print(f"Success Rate: {(passed_tests/total_tests)*100:.1f}%")
        print(f"Total Duration: {total_duration:.2f}s")
        
        if failed_tests > 0:
            print("\n❌ Failed Tests:")
            for result in self.test_results:
                if not result['success']:
                    print(f"  - {result['test']}: {result['message']}")
        
        return {
            'total_tests': total_tests,
            'passed_tests': passed_tests,
            'failed_tests': failed_tests,
            'success_rate': (passed_tests/total_tests)*100,
            'total_duration': total_duration,
            'results': self.test_results
        }

def main():
    """Main function"""
    if len(sys.argv) != 3:
        print("Usage: python test_e2e.py <frontend_url> <backend_url>")
        print("Example: python test_e2e.py https://foodlang.vercel.app https://foodlang-backend.railway.app")
        sys.exit(1)
    
    frontend_url = sys.argv[1]
    backend_url = sys.argv[2]
    
    print(f"Frontend URL: {frontend_url}")
    print(f"Backend URL: {backend_url}")
    print()
    
    tester = FoodLangE2ETester(frontend_url, backend_url)
    results = tester.run_all_tests()
    
    # Exit with error code if tests failed
    if results['failed_tests'] > 0:
        print(f"\n❌ {results['failed_tests']} test(s) failed!")
        sys.exit(1)
    else:
        print(f"\n✅ All {results['passed_tests']} tests passed!")
        sys.exit(0)

if __name__ == "__main__":
    main()