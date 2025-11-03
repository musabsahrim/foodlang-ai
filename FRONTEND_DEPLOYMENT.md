# Frontend Deployment Guide - Vercel

## Prerequisites

1. **GitHub Account**: Code must be pushed to GitHub
2. **Vercel Account**: Sign up at https://vercel.com
3. **Backend Deployed**: Backend must be deployed first to get the API URL

## Step 1: Prepare Environment Variables

### Required Environment Variables for Vercel

```
NEXT_PUBLIC_API_URL=https://your-backend-url.railway.app
NEXT_PUBLIC_VERCEL_ANALYTICS_ID=prj_your_analytics_id (optional)
NODE_ENV=production
```

### Update API URL

Once your backend is deployed, update the API URL in:
- `.env.production.local`
- Vercel dashboard environment variables

## Step 2: Deploy to Vercel

### Option A: Vercel Dashboard (Recommended)

1. **Go to Vercel**: https://vercel.com
2. **Sign in** with your GitHub account
3. **Import Project**: Click "New Project"
4. **Select Repository**: Choose your FoodLang AI repository
5. **Configure Project**:
   - Framework Preset: Next.js
   - Root Directory: `.` (project root)
   - Build Command: `npm run build`
   - Output Directory: `.next`
   - Install Command: `npm install`

6. **Set Environment Variables**:
   - Go to Settings → Environment Variables
   - Add `NEXT_PUBLIC_API_URL` with your backend URL
   - Add `NEXT_PUBLIC_VERCEL_ANALYTICS_ID` (optional)

7. **Deploy**: Click "Deploy"

### Option B: Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy (from project root)
vercel

# For production deployment
vercel --prod
```

## Step 3: Configure Domain and Settings

### Custom Domain (Optional)
1. Go to Project Settings → Domains
2. Add your custom domain
3. Configure DNS records as instructed

### Performance Settings
1. Go to Project Settings → Functions
2. Ensure function timeout is set to 30s
3. Enable Edge Runtime if needed

## Step 4: Test Deployment

### Frontend Tests
1. **Homepage**: Visit your Vercel URL
2. **Text Translation**: Test translation functionality
3. **Image Upload**: Test OCR functionality
4. **Camera**: Test camera capture (mobile)
5. **Admin Panel**: Test admin login and glossary management
6. **Responsive Design**: Test on mobile and desktop

### API Integration Tests
```bash
# Test API connection from frontend
curl https://your-frontend.vercel.app/health

# Should redirect to homepage with working API connection
```

## Step 5: Configure Backend CORS

Update your backend environment variables to include your Vercel domain:

```
CORS_ORIGINS=https://your-frontend.vercel.app,https://your-custom-domain.com
```

## Configuration Files

### vercel.json
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "framework": "nextjs",
  "env": {
    "NEXT_PUBLIC_API_URL": "@foodlang-api-url"
  },
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options", 
          "value": "DENY"
        }
      ]
    }
  ]
}
```

### next.config.mjs
```javascript
const nextConfig = {
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
  },
  images: {
    domains: ['localhost'],
    formats: ['image/webp', 'image/avif']
  }
}
```

## Environment Variables Reference

| Variable | Description | Required | Example |
|----------|-------------|----------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API URL | Yes | `https://api.foodlang.com` |
| `NEXT_PUBLIC_VERCEL_ANALYTICS_ID` | Vercel Analytics ID | No | `prj_abc123` |
| `NODE_ENV` | Environment | Auto-set | `production` |

## Troubleshooting

### Common Issues

#### Build Failures
- **TypeScript Errors**: Fix type errors in code
- **Missing Dependencies**: Check package.json
- **Environment Variables**: Ensure all required vars are set

#### API Connection Issues
- **CORS Errors**: Update backend CORS_ORIGINS
- **Wrong API URL**: Verify NEXT_PUBLIC_API_URL
- **Network Issues**: Test backend health endpoint

#### Performance Issues
- **Large Bundle Size**: Check for unused dependencies
- **Slow Loading**: Optimize images and components
- **Function Timeouts**: Increase timeout in vercel.json

### Debugging Steps

1. **Check Build Logs**: View in Vercel dashboard
2. **Test API Endpoints**: Use browser dev tools
3. **Verify Environment Variables**: Check Vercel settings
4. **Test Locally**: Run `npm run build` locally

## Post-Deployment Checklist

- [ ] Frontend loads successfully
- [ ] Text translation works
- [ ] Image upload and OCR work
- [ ] Camera capture works (mobile)
- [ ] Admin panel accessible
- [ ] Cost tracking displays
- [ ] Responsive design works
- [ ] Backend CORS configured
- [ ] Custom domain configured (if applicable)
- [ ] Analytics configured (if applicable)

## Monitoring and Maintenance

### Vercel Analytics
- Enable in Vercel dashboard
- Monitor Core Web Vitals
- Track user interactions

### Error Monitoring
- Check Vercel function logs
- Monitor API error rates
- Set up alerts for failures

### Updates
- Automatic deployment on git push
- Review deployment previews
- Test before merging to main

## Security Considerations

- HTTPS enforced by default
- Security headers configured
- No sensitive data in client-side code
- Environment variables properly scoped
- CORS properly configured

## Performance Optimization

- Next.js automatic optimizations
- Image optimization enabled
- Static asset caching
- Edge runtime where applicable
- Bundle size monitoring

## Support Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [Vercel Community](https://github.com/vercel/vercel/discussions)

## Quick Deploy Commands

```bash
# One-time setup
npm i -g vercel
vercel login

# Deploy to preview
vercel

# Deploy to production
vercel --prod

# Check deployment status
vercel ls

# View logs
vercel logs
```

## Status: ✅ READY FOR DEPLOYMENT

The frontend is configured and ready for Vercel deployment with:

- ✅ Next.js 16 with App Router
- ✅ TypeScript configuration
- ✅ Tailwind CSS styling
- ✅ Responsive design
- ✅ API integration ready
- ✅ Environment variables configured
- ✅ Security headers set
- ✅ Performance optimizations
- ✅ Vercel configuration complete