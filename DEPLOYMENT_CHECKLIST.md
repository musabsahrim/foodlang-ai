# FoodLang AI Deployment Checklist

## Prerequisites ✅

Before deploying, make sure you have:

- [ ] **OpenAI API Key** - Get from https://platform.openai.com/api-keys
- [ ] **GitHub Account** - For code hosting
- [ ] **Vercel Account** - Sign up at https://vercel.com (free tier available)
- [ ] **Railway Account** - Sign up at https://railway.app (free tier available)

## Step 1: Push Code to GitHub

1. **Initialize Git Repository** (if not already done):
   ```bash
   git init
   git add .
   git commit -m "Initial commit - FoodLang AI ready for deployment"
   ```

2. **Create GitHub Repository**:
   - Go to https://github.com/new
   - Create a new repository named `foodlang-ai`
   - Don't initialize with README (we already have code)

3. **Push to GitHub**:
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/foodlang-ai.git
   git branch -M main
   git push -u origin main
   ```

## Step 2: Deploy Backend to Railway

1. **Go to Railway Dashboard**:
   - Visit https://railway.app
   - Click "Start a New Project"
   - Select "Deploy from GitHub repo"

2. **Connect Repository**:
   - Authorize GitHub access
   - Select your `foodlang-ai` repository
   - Set **Root Directory** to `backend`

3. **Set Environment Variables** in Railway dashboard:
   ```
   OPENAI_API_KEY=your-openai-api-key-here
   JWT_SECRET=your-secure-64-character-jwt-secret
   ADMIN_USERNAME=your-admin-username
   ADMIN_PASSWORD=your-bcrypt-hashed-password
   CORS_ORIGINS=https://your-app-name.vercel.app
   ALLOWED_HOSTS=your-app-name.railway.app
   ENVIRONMENT=production
   PORT=8000
   ```

4. **Deploy**:
   - Railway will automatically deploy
   - Note your Railway URL (e.g., `https://your-app-name.railway.app`)

## Step 3: Deploy Frontend to Vercel

1. **Go to Vercel Dashboard**:
   - Visit https://vercel.com
   - Click "New Project"
   - Import your GitHub repository

2. **Configure Project**:
   - Framework Preset: **Next.js**
   - Root Directory: **Leave empty** (uses project root)
   - Build Command: `npm run build`
   - Output Directory: `.next`

3. **Set Environment Variables** in Vercel dashboard:
   ```
   NEXT_PUBLIC_API_URL=https://your-railway-backend-url.railway.app
   NODE_ENV=production
   ```

4. **Deploy**:
   - Click "Deploy"
   - Vercel will build and deploy automatically
   - Note your Vercel URL (e.g., `https://your-app-name.vercel.app`)

## Step 4: Update CORS Settings

1. **Update Railway Environment Variables**:
   - Go back to Railway dashboard
   - Update `CORS_ORIGINS` to your actual Vercel URL
   - Example: `CORS_ORIGINS=https://foodlang-ai.vercel.app`

2. **Redeploy Backend**:
   - Railway will automatically redeploy with new settings

## Step 5: Upload Glossary Data

1. **Access Admin Panel**:
   - Go to `https://your-vercel-url.vercel.app/admin`
   - Login with your admin credentials

2. **Upload ProductList.xlsx**:
   - Use the glossary upload feature
   - Upload your Excel file with English-Arabic translations
   - System will build the FAISS index automatically

## Step 6: Test Deployment

### Backend Health Check
```bash
curl https://your-railway-url.railway.app/api/health
```

### Frontend Test
- Visit your Vercel URL
- Test translation functionality
- Test OCR functionality
- Check admin panel access

## Environment Variables Reference

### Backend (Railway)
| Variable | Description | Example |
|----------|-------------|---------|
| `OPENAI_API_KEY` | OpenAI API key | `sk-proj-...` |
| `JWT_SECRET` | JWT signing secret (64+ chars) | `secure-random-string...` |
| `ADMIN_USERNAME` | Admin username | `admin_user` |
| `ADMIN_PASSWORD` | Bcrypt hashed password | `$2b$12$...` |
| `CORS_ORIGINS` | Frontend URL | `https://app.vercel.app` |
| `ALLOWED_HOSTS` | Backend domain | `app.railway.app` |
| `ENVIRONMENT` | Environment type | `production` |
| `PORT` | Server port | `8000` |

### Frontend (Vercel)
| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Backend URL | `https://api.railway.app` |
| `NODE_ENV` | Environment | `production` |

## Security Checklist

- [ ] Use strong, unique JWT secret (64+ characters)
- [ ] Hash admin password with bcrypt
- [ ] Set specific CORS origins (no wildcards)
- [ ] Use HTTPS for all communications
- [ ] Keep API keys secure and never commit to git
- [ ] Set up proper rate limiting

## Troubleshooting

### Common Issues

**CORS Errors**:
- Check `CORS_ORIGINS` matches your frontend URL exactly
- Include `https://` protocol
- No trailing slashes

**Authentication Issues**:
- Verify admin credentials are correct
- Check JWT secret is set properly
- Ensure password is bcrypt hashed for production

**API Connection Issues**:
- Verify `NEXT_PUBLIC_API_URL` is correct
- Test backend health endpoint directly
- Check Railway logs for errors

**Build Failures**:
- Check all dependencies are listed in package.json
- Verify environment variables are set
- Review build logs for specific errors

## Monitoring

### Health Checks
- Backend: `GET /api/health`
- Monitor response times and error rates

### Logs
- **Railway**: View in Railway dashboard
- **Vercel**: View in Vercel dashboard

### Costs
- Monitor OpenAI API usage via admin panel
- Set up usage alerts if needed

## Next Steps

After successful deployment:

1. **Custom Domain** (optional):
   - Set up custom domain in Vercel
   - Update CORS settings accordingly

2. **Monitoring**:
   - Set up uptime monitoring
   - Configure error alerts

3. **Backups**:
   - Regular glossary data exports
   - Environment variable backups

4. **Updates**:
   - Both platforms auto-deploy on git push
   - Test in staging before production updates

## Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review platform-specific documentation
3. Check GitHub issues for similar problems
4. Contact support if needed

---

**Estimated Deployment Time**: 30-45 minutes
**Cost**: Free tier available on both platforms
**Difficulty**: Beginner-friendly with this guide