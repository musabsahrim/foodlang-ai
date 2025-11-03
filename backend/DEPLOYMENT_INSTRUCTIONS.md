# Backend Deployment Instructions

## Railway Deployment

### Prerequisites
1. GitHub account with the code pushed
2. Railway account (https://railway.app)
3. Railway CLI installed (optional)

### Step 1: Prepare Environment Variables

The following environment variables need to be set in Railway dashboard:

```
OPENAI_API_KEY=your-openai-api-key-here
JWT_SECRET=your-secure-jwt-secret-here
ADMIN_USERNAME=your-admin-username
ADMIN_PASSWORD=admin123
CORS_ORIGINS=*
ALLOWED_HOSTS=*
RATE_LIMIT_REQUESTS=100
RATE_LIMIT_WINDOW=3600
ADMIN_RATE_LIMIT_REQUESTS=50
NODE_ENV=production
```

### Step 2: Deploy to Railway

#### Option A: Using Railway Dashboard
1. Go to https://railway.app
2. Sign in with GitHub
3. Click "New Project"
4. Select "Deploy from GitHub repo"
5. Choose your repository
6. Set root directory to `backend`
7. Railway will auto-detect the Python app
8. Set environment variables in the Variables tab
9. Deploy will start automatically

#### Option B: Using Railway CLI
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Navigate to backend directory
cd backend

# Initialize Railway project
railway init

# Set environment variables
railway variables set OPENAI_API_KEY=your-openai-api-key-here
railway variables set JWT_SECRET=your-secure-jwt-secret-here
railway variables set ADMIN_USERNAME=admin
railway variables set ADMIN_PASSWORD=admin123
railway variables set CORS_ORIGINS=*
railway variables set ALLOWED_HOSTS=*
railway variables set NODE_ENV=production

# Deploy
railway up
```

### Step 3: Verify Deployment

After deployment, test the following endpoints:

1. **Health Check**: `GET https://your-app.railway.app/api/health`
2. **Root Endpoint**: `GET https://your-app.railway.app/`
3. **Translation Test**: `POST https://your-app.railway.app/api/translate`

### Step 4: Upload Glossary

1. Visit the admin panel: `https://your-app.railway.app/admin`
2. Login with admin/admin123
3. Upload the ProductList.xlsx file
4. Verify glossary is loaded via health check

## Alternative: Render Deployment

### Step 1: Push to GitHub
Ensure your code is pushed to GitHub.

### Step 2: Create Render Service
1. Go to https://render.com
2. Click "New +"
3. Select "Web Service"
4. Connect your GitHub repository
5. Set root directory to `backend`

### Step 3: Configure Service
- **Build Command**: `pip install -r requirements.txt`
- **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
- **Environment**: Set the same variables as Railway

### Step 4: Deploy
Render will automatically deploy when you push to GitHub.

## Testing Deployment

### Health Check Test
```bash
curl https://your-deployed-url/api/health
```

Expected response:
```json
{
  "status": "healthy",
  "service": "FoodLang AI API",
  "version": "1.0.0",
  "glossary_loaded": true,
  "glossary_entries": 1260,
  "ocr_methods": {
    "gpt_vision": true,
    "tesseract": false
  },
  "timestamp": "2024-01-01T00:00:00.000000"
}
```

### Translation Test
```bash
curl -X POST https://your-deployed-url/api/translate \
  -H "Content-Type: application/json" \
  -d '{"text": "chicken breast"}'
```

### Admin Login Test
```bash
curl -X POST https://your-deployed-url/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin123"}'
```

## Troubleshooting

### Common Issues

1. **Build Fails**: Check requirements.txt and Python version
2. **App Crashes**: Check logs in platform dashboard
3. **API Errors**: Verify environment variables
4. **Glossary Not Loading**: Upload via admin panel

### Logs
- **Railway**: View in Railway dashboard
- **Render**: View in Render dashboard

### Environment Variables
Make sure all required environment variables are set correctly in the platform dashboard.