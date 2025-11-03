# Railway Deployment Guide for FoodLang AI Backend

## Prerequisites
1. GitHub account
2. Railway account (sign up at https://railway.app)
3. Your ProductList.xlsx file in the `backend/data/` directory

## Step-by-Step Deployment

### 1. Push Code to GitHub
```bash
# Initialize git repository (if not already done)
git init
git add .
git commit -m "Initial FoodLang AI backend"

# Create GitHub repository and push
git remote add origin https://github.com/yourusername/foodlang-ai.git
git push -u origin main
```

### 2. Deploy to Railway

1. **Go to Railway**: https://railway.app
2. **Sign in** with your GitHub account
3. **Click "New Project"**
4. **Select "Deploy from GitHub repo"**
5. **Choose your repository**
6. **Select the backend folder** (if Railway asks)

### 3. Configure Environment Variables

In Railway dashboard, go to your project → Variables tab and add:

```
OPENAI_API_KEY=your-openai-api-key-here
JWT_SECRET=your-secure-jwt-secret-here
ADMIN_USERNAME=your-admin-username
ADMIN_PASSWORD=admin123
CORS_ORIGINS=*
```

### 4. Deploy Settings

Railway should automatically detect:
- **Build Command**: `pip install -r requirements.txt`
- **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`

If not, set them manually in the Settings tab.

### 5. Upload Your Glossary

After deployment:
1. **Get your Railway URL** (e.g., `https://your-app.railway.app`)
2. **Visit the admin panel**: `https://your-app.railway.app/admin`
3. **Login** with admin/admin123
4. **Upload your ProductList.xlsx** file

### 6. Test Your API

Test endpoints:
- **Health Check**: `GET https://your-app.railway.app/api/health`
- **Translation**: `POST https://your-app.railway.app/api/translate`
- **OCR**: `POST https://your-app.railway.app/api/ocr`

## Important Notes

- **First deployment** may take 5-10 minutes
- **Glossary processing** happens on first upload (may take a few minutes)
- **Logs** are available in Railway dashboard
- **Domain** will be auto-generated (you can customize it)

## Troubleshooting

- **Build fails**: Check requirements.txt and Python version
- **App crashes**: Check logs in Railway dashboard
- **API errors**: Verify environment variables are set correctly
- **Glossary not loading**: Check file format and upload via admin panel

## Next Steps

Once deployed:
1. Note your Railway URL for frontend configuration
2. Test all API endpoints
3. Upload and process your ProductList.xlsx
4. Ready for frontend integration!