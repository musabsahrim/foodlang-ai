#!/usr/bin/env python3
"""
FoodLang AI Deployment Helper
Simple script to generate secure environment variables for deployment
"""

import secrets
import bcrypt
import getpass

def generate_jwt_secret(length=64):
    """Generate a secure JWT secret"""
    return secrets.token_urlsafe(length)

def hash_password(password):
    """Hash password with bcrypt"""
    salt = bcrypt.gensalt(rounds=12)
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed.decode('utf-8')

def main():
    print("🚀 FoodLang AI Deployment Helper")
    print("=" * 40)
    print()
    
    print("This script will help you generate secure environment variables.")
    print("You'll need to copy these values to your deployment platforms.")
    print()
    
    # Generate JWT secret
    jwt_secret = generate_jwt_secret()
    print(f"✅ Generated JWT Secret:")
    print(f"   JWT_SECRET={jwt_secret}")
    print()
    
    # Get admin credentials
    print("👤 Admin Credentials Setup:")
    admin_username = input("Enter admin username (avoid 'admin'): ").strip()
    
    while True:
        admin_password = getpass.getpass("Enter admin password (8+ chars): ")
        if len(admin_password) >= 8:
            break
        print("Password must be at least 8 characters long!")
    
    # Hash password
    hashed_password = hash_password(admin_password)
    print(f"✅ Admin credentials prepared:")
    print(f"   ADMIN_USERNAME={admin_username}")
    print(f"   ADMIN_PASSWORD={hashed_password}")
    print()
    
    # Get OpenAI API key
    openai_key = input("Enter your OpenAI API key: ").strip()
    print()
    
    # Generate environment variables summary
    print("📋 ENVIRONMENT VARIABLES SUMMARY")
    print("=" * 40)
    print()
    print("🔧 For Railway (Backend):")
    print(f"OPENAI_API_KEY={openai_key}")
    print(f"JWT_SECRET={jwt_secret}")
    print(f"ADMIN_USERNAME={admin_username}")
    print(f"ADMIN_PASSWORD={hashed_password}")
    print("CORS_ORIGINS=https://your-app-name.vercel.app")
    print("ALLOWED_HOSTS=your-app-name.railway.app")
    print("ENVIRONMENT=production")
    print("PORT=8000")
    print()
    print("🌐 For Vercel (Frontend):")
    print("NEXT_PUBLIC_API_URL=https://your-railway-backend-url.railway.app")
    print("NODE_ENV=production")
    print()
    
    print("📝 Next Steps:")
    print("1. Push your code to GitHub")
    print("2. Deploy backend to Railway with the variables above")
    print("3. Deploy frontend to Vercel with the variables above")
    print("4. Update CORS_ORIGINS and ALLOWED_HOSTS with actual URLs")
    print("5. Test your deployment!")
    print()
    print("📖 See DEPLOYMENT_CHECKLIST.md for detailed instructions")

if __name__ == "__main__":
    main()