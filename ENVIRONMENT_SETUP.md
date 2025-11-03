# Environment Setup Guide

This guide explains how to configure environment variables for FoodLang AI in both development and production environments.

## Quick Setup

### Automated Setup (Recommended)

Use the provided setup script for easy configuration:

```bash
# For development
python setup-env.py --env development

# For production
python setup-env.py --env production
```

### Manual Setup

If you prefer manual configuration, follow the steps below.

## Development Environment

### 1. Backend Configuration

Copy the development example and configure:

```bash
cp backend/.env.development.example backend/.env
```

Edit `backend/.env` and set:

- `OPENAI_API_KEY`: Your OpenAI API key from https://platform.openai.com/api-keys
- `JWT_SECRET`: Generate using `python backend/generate_jwt_secret.py`
- `ADMIN_USERNAME`: Admin username (default: admin)
- `ADMIN_PASSWORD`: Admin password (default: admin123)

### 2. Frontend Configuration

Copy the development example:

```bash
cp .env.development.example .env.local
```

The default settings should work for local development.

## Production Environment

### 1. Backend Configuration

Copy the production example:

```bash
cp backend/.env.production.example backend/.env.production
```

**Required Configuration:**

1. **OpenAI API Key**
   ```bash
   OPENAI_API_KEY=sk-your-production-api-key
   ```

2. **JWT Secret** (Generate secure key)
   ```bash
   python backend/generate_jwt_secret.py
   # Copy the generated JWT_SECRET value
   ```

3. **Admin Credentials** (Use secure values)
   ```bash
   ADMIN_USERNAME=your-secure-username
   # Generate password hash:
   python backend/generate_password_hash.py
   # Copy the generated ADMIN_PASSWORD hash
   ```

4. **CORS Origins** (Set to your frontend domain)
   ```bash
   CORS_ORIGINS=https://your-app.vercel.app
   ```

5. **Allowed Hosts** (Set to your backend domain)
   ```bash
   ALLOWED_HOSTS=your-backend.railway.app
   ```

### 2. Frontend Configuration

Copy the production example:

```bash
cp .env.production.example .env.production.local
```

Set the backend URL:

```bash
NEXT_PUBLIC_API_URL=https://your-backend.railway.app
```

## Environment Variables Reference

### Backend Variables

| Variable | Description | Development | Production |
|----------|-------------|-------------|------------|
| `OPENAI_API_KEY` | OpenAI API key | Required | Required |
| `JWT_SECRET` | JWT signing secret | Simple key | Secure generated key |
| `ADMIN_USERNAME` | Admin username | admin | Secure username |
| `ADMIN_PASSWORD` | Admin password | Plain text | Bcrypt hash |
| `CORS_ORIGINS` | Allowed origins | localhost:3000 | Production domain |
| `ALLOWED_HOSTS` | Allowed hosts | * | Production domain |
| `RATE_LIMIT_REQUESTS` | Rate limit | 1000 | 50 |
| `ADMIN_RATE_LIMIT_REQUESTS` | Admin rate limit | 500 | 20 |

### Frontend Variables

| Variable | Description | Development | Production |
|----------|-------------|-------------|------------|
| `NEXT_PUBLIC_API_URL` | Backend API URL | http://localhost:8000 | Production backend URL |
| `NEXT_PUBLIC_VERCEL_ANALYTICS_ID` | Analytics ID | Empty | Optional analytics ID |

## Security Best Practices

### Development
- Use simple credentials for convenience
- Keep API keys secure but don't over-complicate
- Use localhost CORS settings

### Production
- **Never use default credentials**
- Generate secure JWT secrets (64+ characters)
- Use bcrypt-hashed passwords
- Set specific CORS origins (no wildcards)
- Use environment-specific rate limits
- Set specific allowed hosts
- Rotate secrets regularly

## Utility Scripts

### Generate JWT Secret
```bash
python backend/generate_jwt_secret.py
```

### Generate Password Hash
```bash
python backend/generate_password_hash.py
```

### Complete Environment Setup
```bash
python setup-env.py --env [development|production]
```

## Deployment Platform Configuration

### Vercel (Frontend)

Set environment variables in Vercel dashboard:
- `NEXT_PUBLIC_API_URL`
- `NEXT_PUBLIC_VERCEL_ANALYTICS_ID` (optional)

### Railway (Backend)

Set environment variables in Railway dashboard:
- `OPENAI_API_KEY`
- `JWT_SECRET`
- `ADMIN_USERNAME`
- `ADMIN_PASSWORD`
- `CORS_ORIGINS`
- `ALLOWED_HOSTS`

### Render (Backend Alternative)

Set environment variables in Render dashboard with the same variables as Railway.

## Troubleshooting

### Common Issues

1. **CORS Errors**
   - Check `CORS_ORIGINS` matches your frontend domain exactly
   - Include protocol (https://) in the URL

2. **Authentication Failures**
   - Verify `JWT_SECRET` is set and consistent
   - Check `ADMIN_PASSWORD` is properly hashed for production

3. **API Connection Issues**
   - Verify `NEXT_PUBLIC_API_URL` points to correct backend
   - Check backend is running and accessible

4. **OpenAI API Errors**
   - Verify `OPENAI_API_KEY` is valid and has credits
   - Check API key permissions

### Environment File Locations

```
project/
├── .env.local                     # Frontend development
├── .env.production.local          # Frontend production
├── backend/.env                   # Backend development
├── backend/.env.production        # Backend production
└── setup-env.py                   # Automated setup script
```

## Security Checklist

- [ ] OpenAI API key is valid and secure
- [ ] JWT secret is 64+ characters and randomly generated
- [ ] Admin password is strong and hashed (production)
- [ ] CORS origins are specific (no wildcards in production)
- [ ] Allowed hosts are specific (no wildcards in production)
- [ ] Environment files are in .gitignore
- [ ] Secrets are not committed to version control
- [ ] Rate limits are appropriate for environment