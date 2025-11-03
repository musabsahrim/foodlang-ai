#!/usr/bin/env python3
"""
Generate a secure JWT secret key for production use.
Run this script and copy the output to your .env file.

Usage:
    python backend/generate_jwt_secret.py
"""

import secrets
import sys

def generate_jwt_secret(length: int = 64) -> str:
    """
    Generate a secure JWT secret key
    
    Args:
        length: Length of the secret key (default: 64)
        
    Returns:
        URL-safe base64 encoded secret key
    """
    return secrets.token_urlsafe(length)

def main():
    """Main function to generate and display JWT secret"""
    print("FoodLang AI - JWT Secret Generator")
    print("=" * 40)
    
    # Generate secret
    secret = generate_jwt_secret()
    
    print(f"Generated secure JWT secret ({len(secret)} characters):")
    print(f"JWT_SECRET={secret}")
    print()
    print("Security recommendations:")
    print("- Copy this to your .env file for production use")
    print("- Never commit this secret to version control")
    print("- Use different secrets for different environments")
    print("- Rotate secrets regularly in production")
    print()
    print("Environment file locations:")
    print("- Development: backend/.env")
    print("- Production: backend/.env.production")

if __name__ == "__main__":
    main()