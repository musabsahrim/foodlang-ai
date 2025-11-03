# Security Configuration

This document outlines the security features implemented in FoodLang AI backend.

## Authentication & Authorization

### JWT Authentication
- **Token Expiration**: 30 minutes (configurable via `JWT_EXPIRATION_MINUTES`)
- **Algorithm**: HS256
- **Secret Key**: Must be set via `JWT_SECRET` environment variable

### Password Security
- **Bcrypt Hashing**: Admin passwords can be stored as bcrypt hashes
- **Backward Compatibility**: Plain text passwords supported for development
- **Generation Script**: Use `python generate_password_hash.py` to create secure hashes

### Admin Access
- All admin endpoints require valid JWT tokens
- Separate authentication middleware for admin-only access
- Token validation includes expiration and signature verification

## Rate Limiting

### General Endpoints
- **Default Limit**: 100 requests per hour per IP
- **Window**: 3600 seconds (1 hour)
- **Configurable**: Set via `RATE_LIMIT_REQUESTS` and `RATE_LIMIT_WINDOW`

### Specific Limits
- **Login**: 5 requests per hour (strict to prevent brute force)
- **Translation**: 50 requests per hour
- **OCR**: 20 requests per hour
- **Admin Endpoints**: 50 requests per hour
- **File Upload**: 10 requests per hour

### Rate Limit Headers
- **429 Status**: Returned when limit exceeded
- **Retry-After**: Header indicates when to retry

## CORS Configuration

### Allowed Origins
- Configurable via `CORS_ORIGINS` environment variable
- Comma-separated list of allowed domains
- Default: `http://localhost:3000` for development

### Allowed Methods
- GET, POST, PUT, DELETE, OPTIONS

### Allowed Headers
- Authorization, Content-Type, Accept, Origin, and other standard headers
- Custom headers for API compatibility

## Security Headers

### Automatic Headers
- **X-Content-Type-Options**: nosniff
- **X-Frame-Options**: DENY
- **X-XSS-Protection**: 1; mode=block
- **Referrer-Policy**: strict-origin-when-cross-origin
- **Permissions-Policy**: Restricts geolocation, microphone, camera

### HTTPS Headers
- **Strict-Transport-Security**: Added automatically for HTTPS connections
- **Max-Age**: 1 year with includeSubDomains

## Input Validation

### Text Input
- **Maximum Length**: 10,000 characters
- **Sanitization**: Removes null bytes and control characters
- **Validation**: Checks for empty or invalid input

### File Upload
- **Image Types**: JPEG, PNG, WebP only
- **File Size**: 10MB limit for images, 50MB for Excel files
- **Filename Validation**: Length and extension checks
- **Content-Type Validation**: Strict MIME type checking

## Environment Variables

### Required for Production
```bash
# Generate with: python generate_jwt_secret.py
JWT_SECRET=your_secure_64_character_secret_here

# Generate with: python generate_password_hash.py
ADMIN_PASSWORD=$2b$12$hash_here

# Set to your frontend domain
CORS_ORIGINS=https://your-domain.com

# Optional: Restrict allowed hosts
ALLOWED_HOSTS=your-domain.com,api.your-domain.com
```

### Rate Limiting (Optional)
```bash
RATE_LIMIT_REQUESTS=100
RATE_LIMIT_WINDOW=3600
ADMIN_RATE_LIMIT_REQUESTS=50
```

## Security Best Practices

### Production Deployment
1. **Use HTTPS**: Always deploy with SSL/TLS certificates
2. **Secure Secrets**: Use environment variables, never hardcode secrets
3. **Regular Updates**: Keep dependencies updated
4. **Monitoring**: Monitor rate limits and failed authentication attempts

### Development vs Production
- **Development**: Plain text passwords and relaxed CORS allowed
- **Production**: Must use bcrypt hashes and strict CORS origins
- **Logging**: Security events should be logged for monitoring

## Threat Mitigation

### Brute Force Attacks
- **Rate Limiting**: Strict limits on login attempts
- **JWT Expiration**: Short token lifetime reduces exposure
- **Account Lockout**: Consider implementing after multiple failures

### Cross-Site Attacks
- **CORS**: Strict origin validation
- **Security Headers**: XSS and clickjacking protection
- **Content-Type**: Strict validation prevents content sniffing

### Data Validation
- **Input Sanitization**: All user input is validated and sanitized
- **File Type Validation**: Strict MIME type and extension checking
- **Size Limits**: Prevent resource exhaustion attacks

## Monitoring & Logging

### Security Events
- Failed authentication attempts
- Rate limit violations
- Invalid file uploads
- Token expiration events

### Recommendations
- Set up log monitoring and alerting
- Track unusual access patterns
- Monitor API usage and costs
- Regular security audits