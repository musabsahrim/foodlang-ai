#!/usr/bin/env python3
"""
Generate a bcrypt hash for admin password.
Run this script and copy the output to your .env file.

Usage:
    python backend/generate_password_hash.py
"""

import bcrypt
import getpass
import sys
import re

def validate_password(password: str) -> tuple[bool, list[str]]:
    """
    Validate password strength
    
    Args:
        password: Password to validate
        
    Returns:
        Tuple of (is_valid, list_of_issues)
    """
    issues = []
    
    if len(password) < 8:
        issues.append("Password must be at least 8 characters long")
    
    if not re.search(r'[A-Z]', password):
        issues.append("Password should contain at least one uppercase letter")
    
    if not re.search(r'[a-z]', password):
        issues.append("Password should contain at least one lowercase letter")
    
    if not re.search(r'\d', password):
        issues.append("Password should contain at least one number")
    
    if not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
        issues.append("Password should contain at least one special character")
    
    return len(issues) == 0, issues

def generate_password_hash(password: str) -> str:
    """
    Generate bcrypt hash for password
    
    Args:
        password: Plain text password
        
    Returns:
        Bcrypt hashed password
    """
    salt = bcrypt.gensalt(rounds=12)  # Use 12 rounds for good security/performance balance
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed.decode('utf-8')

def main():
    """Main function to generate password hash"""
    print("FoodLang AI - Admin Password Hash Generator")
    print("=" * 45)
    
    while True:
        password = getpass.getpass("Enter admin password: ")
        
        if not password:
            print("Password cannot be empty. Please try again.")
            continue
        
        # Validate password
        is_valid, issues = validate_password(password)
        
        if not is_valid:
            print("\nPassword validation failed:")
            for issue in issues:
                print(f"- {issue}")
            
            choice = input("\nDo you want to use this password anyway? (y/N): ").lower()
            if choice != 'y':
                continue
        
        # Confirm password
        confirm_password = getpass.getpass("Confirm admin password: ")
        
        if password != confirm_password:
            print("Passwords do not match. Please try again.\n")
            continue
        
        break
    
    # Generate hash
    print("\nGenerating secure password hash...")
    hashed = generate_password_hash(password)
    
    print(f"\nGenerated password hash:")
    print(f"ADMIN_PASSWORD={hashed}")
    print()
    print("Security recommendations:")
    print("- Copy this hash to your .env file for production use")
    print("- Never store the plain text password in files")
    print("- The original password will be required for login")
    print("- Consider using a password manager")
    print()
    print("Environment file locations:")
    print("- Development: backend/.env")
    print("- Production: backend/.env.production")

if __name__ == "__main__":
    main()