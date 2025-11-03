# FoodLang AI Build and Deployment Scripts

This directory contains scripts for building and deploying FoodLang AI across different platforms and environments.

## Available Scripts

### Build Scripts

#### Cross-Platform (Recommended)
```bash
# Node.js wrapper (works on all platforms)
node scripts/build.js --env development
node scripts/build.js --env production --skip-tests

# NPM scripts
npm run build:dev
npm run build:prod
```

#### Platform-Specific
```bash
# Unix/Linux/macOS
./scripts/build.sh --env production

# Windows
scripts\build.bat --env production
```

### Deployment Scripts

#### Cross-Platform (Recommended)
```bash
# Node.js wrapper (works on all platforms)
node scripts/deploy.js --platform vercel --env production
node scripts/deploy.js --platform railway --dry-run

# NPM scripts
npm run deploy:vercel
npm run deploy:railway
npm run deploy:docker
```

#### Platform-Specific
```bash
# Unix/Linux/macOS
./scripts/deploy.sh --platform vercel --env production

# Windows
scripts\deploy.bat --platform railway --env production
```

## Script Options

### Build Script Options

| Option | Description | Default |
|--------|-------------|---------|
| `--env` | Environment (development\|production) | development |
| `--skip-tests` | Skip running tests | false |
| `--skip-lint` | Skip linting | false |
| `--help` | Show help message | - |

### Deploy Script Options

| Option | Description | Default |
|--------|-------------|---------|
| `--platform` | Platform (vercel\|railway\|render\|docker) | required |
| `--env` | Environment (development\|production) | production |
| `--dry-run` | Show what would be deployed | false |
| `--help` | Show help message | - |

## Environment Setup

Before building or deploying, set up your environment:

```bash
# Automated setup
python setup-env.py --env development
python setup-env.py --env production

# NPM scripts
npm run setup:env:dev
npm run setup:env:prod
```

## Usage Examples

### Development Workflow

```bash
# 1. Set up development environment
npm run setup:env:dev

# 2. Build for development
npm run build:dev

# 3. Start development servers
npm run dev          # Frontend
npm run backend:dev  # Backend
```

### Production Deployment

```bash
# 1. Set up production environment
npm run setup:env:prod

# 2. Build for production
npm run build:prod

# 3. Deploy frontend to Vercel
npm run deploy:vercel

# 4. Deploy backend to Railway
npm run deploy:railway
```

### Docker Deployment

```bash
# 1. Set up environment
npm run setup:env:prod

# 2. Deploy with Docker
npm run deploy:docker

# 3. Verify deployment
curl http://localhost:8000/api/health
```

## Platform-Specific Instructions

### Vercel (Frontend)

**Prerequisites:**
- Vercel CLI: `npm i -g vercel`
- GitHub repository

**Deployment:**
```bash
node scripts/deploy.js --platform vercel --env production
```

**Environment Variables:**
Set in Vercel dashboard:
- `NEXT_PUBLIC_API_URL`
- `NEXT_PUBLIC_VERCEL_ANALYTICS_ID`

### Railway (Backend)

**Prerequisites:**
- Railway CLI
- GitHub repository

**Deployment:**
```bash
node scripts/deploy.js --platform railway --env production
```

**Environment Variables:**
Set in Railway dashboard:
- `OPENAI_API_KEY`
- `JWT_SECRET`
- `ADMIN_USERNAME`
- `ADMIN_PASSWORD`
- `CORS_ORIGINS`
- `ALLOWED_HOSTS`

### Render (Backend)

**Prerequisites:**
- GitHub repository
- Render account

**Deployment:**
```bash
node scripts/deploy.js --platform render --env production
```

Uses `backend/render.yaml` for configuration.

### Docker (Self-Hosted)

**Prerequisites:**
- Docker
- Docker Compose

**Deployment:**
```bash
node scripts/deploy.js --platform docker --env production
```

Uses `backend/Dockerfile` and `backend/docker-compose.yml`.

## Script Architecture

### File Structure
```
scripts/
├── README.md           # This file
├── build.js           # Cross-platform build script (Node.js)
├── build.sh           # Unix/Linux/macOS build script
├── build.bat          # Windows build script
├── deploy.js          # Cross-platform deploy script (Node.js)
├── deploy.sh          # Unix/Linux/macOS deploy script
└── deploy.bat         # Windows deploy script
```

### Cross-Platform Compatibility

The Node.js scripts (`build.js`, `deploy.js`) are the recommended approach as they:
- Work on all platforms (Windows, macOS, Linux)
- Integrate with npm scripts
- Provide consistent behavior
- Handle errors gracefully

### Shell Scripts

Platform-specific shell scripts are provided for users who prefer:
- Native shell scripting
- Direct execution without Node.js
- Custom modifications

## Error Handling

### Common Build Errors

1. **Missing Dependencies**
   ```bash
   # Solution: Install dependencies
   npm install
   cd backend && pip install -r requirements.txt
   ```

2. **Python Not Found**
   ```bash
   # Solution: Install Python 3.9+
   # Windows: Download from python.org
   # macOS: brew install python
   # Linux: apt-get install python3
   ```

3. **Linting Failures**
   ```bash
   # Solution: Fix linting issues or skip
   npm run lint
   # or
   node scripts/build.js --skip-lint
   ```

### Common Deployment Errors

1. **CLI Not Installed**
   ```bash
   # Vercel
   npm i -g vercel
   
   # Railway
   # Download from https://railway.app/cli
   ```

2. **Environment Variables Missing**
   ```bash
   # Solution: Set up environment
   python setup-env.py --env production
   ```

3. **Authentication Required**
   ```bash
   # Vercel
   vercel login
   
   # Railway
   railway login
   ```

## Customization

### Adding New Platforms

To add support for a new deployment platform:

1. **Update deploy scripts** with new platform case
2. **Add configuration files** (if needed)
3. **Update documentation** with platform-specific instructions
4. **Add npm script** for convenience

### Modifying Build Process

To customize the build process:

1. **Edit build scripts** to add/remove steps
2. **Update package.json scripts** if needed
3. **Test on all target platforms**
4. **Update documentation**

## Testing Scripts

### Dry Run Mode

Test deployments without actually deploying:

```bash
node scripts/deploy.js --platform vercel --dry-run
node scripts/deploy.js --platform railway --dry-run
```

### Build Testing

Test builds without running tests:

```bash
node scripts/build.js --env production --skip-tests
```

## Troubleshooting

### Script Permissions (Unix/Linux/macOS)

If shell scripts aren't executable:
```bash
chmod +x scripts/build.sh scripts/deploy.sh
```

### Windows Execution Policy

If PowerShell scripts are blocked:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Node.js Version

Ensure Node.js 16+ is installed:
```bash
node --version
npm --version
```

### Python Version

Ensure Python 3.9+ is installed:
```bash
python --version
# or
python3 --version
```

## Contributing

When modifying scripts:

1. **Test on multiple platforms** (Windows, macOS, Linux)
2. **Update all script variants** (Node.js, shell, batch)
3. **Update documentation** and examples
4. **Test error scenarios** and edge cases
5. **Maintain backward compatibility** when possible

## Support

For script-related issues:

1. **Check error messages** for specific guidance
2. **Verify prerequisites** are installed
3. **Test with dry-run mode** first
4. **Check platform documentation** for specific requirements
5. **Open GitHub issue** with detailed error information