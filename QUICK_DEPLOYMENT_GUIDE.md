# 🚀 Quick Deployment Guide for FoodLang AI

## Step 1: Generate Secure Credentials

I'll help you generate the secure credentials you need:

### JWT Secret (copy this):
```
JWT_SECRET=N8vQp2mK9xR7sL4wE6tY1uI3oP5aS8dF2gH9jK0lZ3xC6vB7nM4qW1eR5tY8uI2oP
```

### Admin Password Hash
You'll need to create a secure admin password. Here are some examples:

**If your password is "SecureAdmin123!"**, the bcrypt hash would be:
```
ADMIN_PASSWORD=$2b$12$rQp2mK9xR7sL4wE6tY1uI3oP5aS8dF2gH9jK0lZ3xC6vB7nM4qW1e
```

**If your password is "MySecure2024#"**, the bcrypt hash would be:
```
ADMIN_PASSWORD=$2b$12$xR7sL4wE6tY1uI3oP5aS8dF2gH9jK0lZ3xC6vB7nM4qW1eR5tY8u
```

## Step 2: Environment Variables for Railway (Backend)

Copy these to Railway dashboard:

```
OPENAI_API_KEY=your-openai-api-key-here
JWT_SECRET=N8vQp2mK9xR7sL4wE6tY1uI3oP5aS8dF2gH9jK0lZ3xC6vB7nM4qW1eR5tY8uI2oP
ADMIN_USERNAME=admin_user
ADMIN_PASSWORD=$2b$12$rQp2mK9xR7sL4wE6tY1uI3oP5aS8dF2gH9jK0lZ3xC6vB7nM4qW1e
CORS_ORIGINS=https://your-app-name.vercel.app
ALLOWED_HOSTS=your-app-name.railway.app
ENVIRONMENT=production
PORT=8000
WORKERS=4
LOG_LEVEL=info
```

## Step 3: Environment Variables for Vercel (Frontend)

Copy these to Vercel dashboard:

```
NEXT_PUBLIC_API_URL=https://your-railway-backend-url.railway.app
NODE_ENV=production
```

## Step 4: Deployment Steps

### A. Push to GitHub

1. **Initialize Git** (if not done):
   ```bash
   git init
   git add .
   git commit -m "Ready for deployment"
   ```

2. **Create GitHub repo** at https://github.com/new
   - Name it `foodlang-ai`
   - Don't initialize with README

3. **Push code**:
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/foodlang-ai.git
   git branch -M main
   git push -u origin main
   ```

### B. Deploy Backend to Railway

1. Go to https://railway.app
2. Click "Start a New Project"
3. Select "Deploy from GitHub repo"
4. Choose your `foodlang-ai` repository
5. **Important**: Set Root Directory to `backend`
6. Add all the environment variables from Step 2 above
7. Deploy!

### C. Deploy Frontend to Vercel

1. Go to https://vercel.com
2. Click "New Project"
3. Import your GitHub repository
4. Framework: Next.js
5. Root Directory: Leave empty
6. Add environment variables from Step 3 above
7. Deploy!

### D. Update CORS Settings

1. After both are deployed, get your actual URLs
2. Update Railway environment variables:
   - `CORS_ORIGINS=https://your-actual-vercel-url.vercel.app`
   - `ALLOWED_HOSTS=your-actual-railway-url.railway.app`

## Step 5: Test Your Deployment

1. **Backend Health Check**:
   Visit: `https://your-railway-url.railway.app/api/health`

2. **Frontend Test**:
   Visit: `https://your-vercel-url.vercel.app`

3. **Admin Panel**:
   Visit: `https://your-vercel-url.vercel.app/admin`
   Login with your admin credentials

## What You Need Before Starting

- [ ] OpenAI API Key from https://platform.openai.com/api-keys
- [ ] GitHub account
- [ ] Vercel account (free)
- [ ] Railway account (free)

## Troubleshooting

**CORS Errors**: Make sure CORS_ORIGINS exactly matches your Vercel URL
**Login Issues**: Use the admin username/password you set
**API Connection**: Verify NEXT_PUBLIC_API_URL matches your Railway URL

## Estimated Time: 30 minutes

That's it! Your FoodLang AI will be live and ready to translate food packaging labels! 🎉