#!/usr/bin/env python3
"""
Health monitoring script for FoodLang AI API
This script can be used to monitor the health of the API and send alerts
"""

import requests
import time
import json
import logging
from datetime import datetime
from typing import Dict, Any
import os
import sys

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler('data/health_monitor.log', mode='a') if os.path.exists('data') or os.makedirs('data', exist_ok=True) else logging.StreamHandler()
    ]
)

logger = logging.getLogger("health-monitor")

class HealthMonitor:
    """External health monitoring for FoodLang AI API"""
    
    def __init__(self, api_url: str = "http://localhost:8000"):
        self.api_url = api_url.rstrip('/')
        self.health_endpoint = f"{self.api_url}/api/health"
        self.alert_thresholds = {
            "response_time_seconds": 5.0,
            "error_rate_percent": 10.0,
            "memory_usage_percent": 85.0,
            "disk_usage_percent": 90.0,
            "cpu_usage_percent": 90.0
        }
        self.consecutive_failures = 0
        self.max_consecutive_failures = 3
        
    def check_health(self) -> Dict[str, Any]:
        """Perform health check and return status"""
        try:
            start_time = time.time()
            
            # Make health check request
            response = requests.get(
                self.health_endpoint,
                timeout=10,
                headers={'User-Agent': 'FoodLang-Health-Monitor/1.0'}
            )
            
            response_time = time.time() - start_time
            
            if response.status_code == 200:
                health_data = response.json()
                self.consecutive_failures = 0
                
                # Analyze health data
                analysis = self._analyze_health_data(health_data, response_time)
                
                logger.info(f"Health check successful - Status: {health_data.get('overall_status', 'unknown')}, Response time: {response_time:.2f}s")
                
                return {
                    "success": True,
                    "response_time": response_time,
                    "health_data": health_data,
                    "analysis": analysis,
                    "timestamp": datetime.utcnow().isoformat()
                }
            else:
                self.consecutive_failures += 1
                error_msg = f"Health check failed with status {response.status_code}"
                logger.error(error_msg)
                
                return {
                    "success": False,
                    "error": error_msg,
                    "status_code": response.status_code,
                    "response_time": response_time,
                    "consecutive_failures": self.consecutive_failures,
                    "timestamp": datetime.utcnow().isoformat()
                }
                
        except requests.exceptions.Timeout:
            self.consecutive_failures += 1
            error_msg = "Health check timed out"
            logger.error(error_msg)
            
            return {
                "success": False,
                "error": error_msg,
                "consecutive_failures": self.consecutive_failures,
                "timestamp": datetime.utcnow().isoformat()
            }
            
        except requests.exceptions.ConnectionError:
            self.consecutive_failures += 1
            error_msg = "Cannot connect to API server"
            logger.error(error_msg)
            
            return {
                "success": False,
                "error": error_msg,
                "consecutive_failures": self.consecutive_failures,
                "timestamp": datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            self.consecutive_failures += 1
            error_msg = f"Health check error: {str(e)}"
            logger.error(error_msg)
            
            return {
                "success": False,
                "error": error_msg,
                "consecutive_failures": self.consecutive_failures,
                "timestamp": datetime.utcnow().isoformat()
            }
    
    def _analyze_health_data(self, health_data: Dict[str, Any], response_time: float) -> Dict[str, Any]:
        """Analyze health data and identify issues"""
        issues = []
        warnings = []
        
        # Check response time
        if response_time > self.alert_thresholds["response_time_seconds"]:
            issues.append(f"Slow response time: {response_time:.2f}s")
        
        # Check overall status
        overall_status = health_data.get("overall_status", "unknown")
        if overall_status not in ["healthy"]:
            issues.append(f"System status: {overall_status}")
        
        # Check individual health checks
        checks = health_data.get("checks", {})
        for check_name, check_data in checks.items():
            if isinstance(check_data, dict) and check_data.get("status") not in ["healthy"]:
                issues.append(f"{check_name}: {check_data.get('status')} - {check_data.get('details', 'No details')}")
        
        # Check monitoring metrics
        monitoring = health_data.get("monitoring", {})
        error_rate = monitoring.get("error_rate_5min", 0) * 100
        if error_rate > self.alert_thresholds["error_rate_percent"]:
            issues.append(f"High error rate: {error_rate:.1f}%")
        
        avg_response_time = monitoring.get("avg_response_time_5min", 0)
        if avg_response_time > self.alert_thresholds["response_time_seconds"]:
            warnings.append(f"Average response time: {avg_response_time:.2f}s")
        
        # Check glossary status
        glossary = health_data.get("glossary", {})
        if not glossary.get("loaded", False):
            issues.append("Glossary not loaded")
        
        return {
            "issues": issues,
            "warnings": warnings,
            "overall_health": "healthy" if not issues else "degraded" if issues and not any("error" in issue.lower() for issue in issues) else "unhealthy"
        }
    
    def should_alert(self, health_result: Dict[str, Any]) -> bool:
        """Determine if an alert should be sent"""
        if not health_result["success"]:
            return self.consecutive_failures >= self.max_consecutive_failures
        
        analysis = health_result.get("analysis", {})
        issues = analysis.get("issues", [])
        
        # Alert on any critical issues
        critical_keywords = ["error", "failed", "unavailable", "not loaded"]
        for issue in issues:
            if any(keyword in issue.lower() for keyword in critical_keywords):
                return True
        
        return False
    
    def send_alert(self, health_result: Dict[str, Any]):
        """Send alert (placeholder for actual alerting mechanism)"""
        alert_message = f"🚨 FoodLang AI Health Alert 🚨\n"
        alert_message += f"Timestamp: {health_result['timestamp']}\n"
        
        if not health_result["success"]:
            alert_message += f"❌ Health check failed: {health_result.get('error', 'Unknown error')}\n"
            alert_message += f"Consecutive failures: {health_result.get('consecutive_failures', 0)}\n"
        else:
            analysis = health_result.get("analysis", {})
            issues = analysis.get("issues", [])
            alert_message += f"⚠️ Health issues detected:\n"
            for issue in issues:
                alert_message += f"  • {issue}\n"
        
        # Log the alert (in production, send to Slack, email, PagerDuty, etc.)
        logger.error(alert_message)
        
        # Save alert to file
        try:
            os.makedirs("data", exist_ok=True)
            alert_file = "data/external_alerts.json"
            
            alerts = []
            if os.path.exists(alert_file):
                try:
                    with open(alert_file, 'r') as f:
                        alerts = json.load(f)
                except (json.JSONDecodeError, FileNotFoundError):
                    alerts = []
            
            alert_entry = {
                "timestamp": health_result["timestamp"],
                "type": "health_alert",
                "message": alert_message,
                "health_result": health_result
            }
            
            alerts.append(alert_entry)
            
            # Keep only last 100 alerts
            if len(alerts) > 100:
                alerts = alerts[-100:]
            
            with open(alert_file, 'w') as f:
                json.dump(alerts, f, indent=2)
                
        except Exception as e:
            logger.error(f"Failed to save alert: {e}")
    
    def run_continuous_monitoring(self, interval_seconds: int = 60):
        """Run continuous health monitoring"""
        logger.info(f"Starting continuous health monitoring (interval: {interval_seconds}s)")
        logger.info(f"Monitoring API at: {self.api_url}")
        
        try:
            while True:
                health_result = self.check_health()
                
                # Send alert if needed
                if self.should_alert(health_result):
                    self.send_alert(health_result)
                
                # Wait for next check
                time.sleep(interval_seconds)
                
        except KeyboardInterrupt:
            logger.info("Health monitoring stopped by user")
        except Exception as e:
            logger.error(f"Health monitoring error: {e}")
            raise

def main():
    """Main function"""
    import argparse
    
    parser = argparse.ArgumentParser(description="FoodLang AI Health Monitor")
    parser.add_argument("--api-url", default="http://localhost:8000", help="API base URL")
    parser.add_argument("--interval", type=int, default=60, help="Check interval in seconds")
    parser.add_argument("--single-check", action="store_true", help="Run single health check and exit")
    
    args = parser.parse_args()
    
    monitor = HealthMonitor(args.api_url)
    
    if args.single_check:
        # Single health check
        result = monitor.check_health()
        print(json.dumps(result, indent=2))
        
        if not result["success"]:
            sys.exit(1)
    else:
        # Continuous monitoring
        monitor.run_continuous_monitoring(args.interval)

if __name__ == "__main__":
    main()