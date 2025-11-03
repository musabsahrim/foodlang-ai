# FoodLang AI Deployment Guide

This guide covers deploying FoodLang AI to various platforms including Vercel, Railway, Render, and Docker.

## Quick Start

### 1. Environment Setup

First, set up your environment variables:

```bash
# Automated setup (recommended)
python setup-env.py --env production

# Or manually copy and configure
cp .env.production.example .env.production.local
cp backend/.env.production.example backend/.env.production
```

### 2. Build the Application

```bash
# Development build
npm run build:dev
# or
./scripts/build.sh --env development

# Production build
npm run build:prod
# or
./scripts/build.sh --env production
```

### 3. Deploy

```bash
# Deploy frontend to Vercel
npm run deploy:vercel
# or
./scripts/deploy.sh --platform vercel

# Deploy backend to Railway
npm run deploy:railway
# or
./scripts/deploy.sh --platform railway
```

## Platform-Specific Deployment

### Vercel (Frontend)

Vercel is the recommended platform for deploying the Next.js frontend.

#### Prerequisites
- GitHub account
- Vercel account
- Vercel CLI installed: `npm i -g vercel`

#### Deployment Steps

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

2. **Deploy with Vercel CLI**
   ```bash
   vercel --prod
   ```

3. **Set Environment Variables**
   In Vercel dashboard, add:
   - `NEXT_PUBLIC_API_URL`: Your backend URL
   - `NEXT_PUBLIC_VERCEL_ANALYTICS_ID`: (optional)

4. **Configure Domain** (optional)
   Set up custom domain in Vercel dashboard

#### Configuration Files
- `vercel.json`: Vercel-specific configuration
- `.env.production.example`: Environment variables template

### Railway (Backend)

Railway is recommended for deploying the FastAPI backend.

#### Prerequisites
- GitHub account
- Railway account
- Railway CLI installed

#### Deployment Steps

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

2. **Create Railway Project**
   - Go to [Railway](https://railway.app)
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your repository
   - Select `backend` folder as root directory

3. **Set Environment Variables**
   In Railway dashboard, add:
   ```
   OPENAI_API_KEY=your-openai-api-key
   JWT_SECRET=your-secure-jwt-secret
   ADMIN_USERNAME=your-admin-username
   ADMIN_PASSWORD=your-bcrypt-hashed-password
   CORS_ORIGINS=https://your-frontend-domain.vercel.app
   ALLOWED_HOSTS=your-backend-domain.railway.app
   ```

4. **Deploy**
   ```bash
   cd backend
   railway up
   ```

#### Configuration Files
- `backend/railway.toml`: Railway-specific configuration
- `backend/Procfile`: Process file for Railway
- `backend/.env.production.example`: Environment variables template

### Render (Backend Alternative)

Render is an alternative to Railway for backend deployment.

#### Prerequisites
- GitHub account
- Render account

#### Deployment Steps

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

2. **Create Render Service**
   - Go to [Render](https://render.com)
   - Click "New +"
   - Select "Web Service"
   - Connect your GitHub repository
   - Set root directory to `backend`

3. **Configure Service**
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `uvicorn main:app --host 0.0.0.0 --port $PORT`

4. **Set Environment Variables**
   Same as Railway configuration above

#### Configuration Files
- `backend/render.yaml`: Render-specific configuration

### Docker (Self-Hosted)

Deploy using Docker for self-hosted environments.

#### Prerequisites
- Docker installed
- Docker Compose installed

#### Deployment Steps

1. **Set Environment Variables**
   ```bash
   cp backend/.env.production.example backend/.env
   # Edit backend/.env with your values
   ```

2. **Build and Run**
   ```bash
   cd backend
   docker-compose up -d
   ```

3. **Verify Deployment**
   ```bash
   curl http://localhost:8000/api/health
   ```

#### Configuration Files
- `backend/Dockerfile`: Docker image configuration
- `backend/docker-compose.yml`: Multi-container setup

## Environment Variables

### Frontend Variables

| Variable | Description | Required | Example |
|----------|-------------|----------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API URL | Yes | `https://api.foodlang.com` |
| `NEXT_PUBLIC_VERCEL_ANALYTICS_ID` | Vercel Analytics ID | No | `prj_abc123` |

### Backend Variables

| Variable | Description | Required | Example |
|----------|-------------|----------|---------|
| `OPENAI_API_KEY` | OpenAI API key | Yes | `sk-proj-...` |
| `JWT_SECRET` | JWT signing secret | Yes | `secure-64-char-secret` |
| `ADMIN_USERNAME` | Admin username | Yes | `admin_user` |
| `ADMIN_PASSWORD` | Admin password (hashed) | Yes | `$2b$12$...` |
| `CORS_ORIGINS` | Allowed CORS origins | Yes | `https://app.com` |
| `ALLOWED_HOSTS` | Allowed hosts | Yes | `api.app.com` |

## Security Configuration

### Production Security Checklist

- [ ] Use strong, unique JWT secret (64+ characters)
- [ ] Hash admin password with bcrypt
- [ ] Set specific CORS origins (no wildcards)
- [ ] Set specific allowed hosts (no wildcards)
- [ ] Use HTTPS for all communications
- [ ] Set appropriate rate limits
- [ ] Keep OpenAI API key secure
- [ ] Regular security updates

### Environment-Specific Settings

#### Development
- Simple JWT secret for convenience
- Plain text admin password
- Permissive CORS settings
- Higher rate limits

#### Production
- Secure generated JWT secret
- Bcrypt-hashed admin password
- Specific CORS origins
- Strict rate limits

## Monitoring and Maintenance

### Health Checks

All platforms support health checks via:
```
GET /api/health
```

### Logging

- **Vercel**: View logs in Vercel dashboard
- **Railway**: View logs in Railway dashboard
- **Render**: View logs in Render dashboard
- **Docker**: Use `docker-compose logs`

### Updates

1. **Code Updates**
   ```bash
   git add .
   git commit -m "Update description"
   git push origin main
   ```

2. **Dependency Updates**
   ```bash
   # Frontend
   npm update
   
   # Backend
   cd backend
   pip install -r requirements.txt --upgrade
   ```

3. **Glossary Updates**
   - Upload new ProductList.xlsx via admin panel
   - System will automatically rebuild FAISS index

## Troubleshooting

### Common Issues

#### CORS Errors
- Check `CORS_ORIGINS` environment variable
- Ensure frontend domain matches exactly
- Include protocol (https://)

#### Authentication Failures
- Verify `JWT_SECRET` is set correctly
- Check `ADMIN_PASSWORD` is properly hashed
- Ensure credentials match login attempts

#### API Connection Issues
- Verify `NEXT_PUBLIC_API_URL` is correct
- Check backend is running and accessible
- Test health endpoint directly

#### Build Failures
- Check all dependencies are installed
- Verify environment variables are set
- Review build logs for specific errors

### Platform-Specific Issues

#### Vercel
- Build timeouts: Optimize build process
- Function limits: Check function duration
- Environment variables: Set in dashboard

#### Railway
- Memory limits: Monitor usage
- Build failures: Check Python version
- Port issues: Use `$PORT` environment variable

#### Render
- Build timeouts: Optimize dependencies
- Free tier limits: Consider paid plan
- Static files: Ensure proper serving

#### Docker
- Port conflicts: Check port availability
- Volume permissions: Verify file access
- Network issues: Check Docker networking

## Performance Optimization

### Frontend Optimization
- Enable Vercel Analytics
- Use Next.js Image optimization
- Implement proper caching headers
- Monitor Core Web Vitals

### Backend Optimization
- Monitor API response times
- Optimize FAISS index size
- Use connection pooling
- Implement proper caching

### Cost Optimization
- Monitor OpenAI API usage
- Implement request caching
- Use appropriate instance sizes
- Set up usage alerts

## Backup and Recovery

### Data Backup
- Export glossary data regularly
- Backup environment configurations
- Document deployment procedures

### Recovery Procedures
- Keep deployment scripts updated
- Document rollback procedures
- Test recovery processes

## Support and Resources

### Documentation
- [Vercel Documentation](https://vercel.com/docs)
- [Railway Documentation](https://docs.railway.app)
- [Render Documentation](https://render.com/docs)
- [Docker Documentation](https://docs.docker.com)

### Community
- GitHub Issues for bug reports
- Discussions for questions
- Discord/Slack for real-time help

### Professional Support
- Consider managed hosting services
- DevOps consulting for complex deployments
- Security audits for production systems