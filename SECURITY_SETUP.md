# Security Setup Guide

This guide explains how to secure your Pokemon app API endpoints so only your frontend can make requests. The security system implements multiple layers of protection to prevent unauthorized access.

## 🚨 Security Status

**Current Status: ✅ SECURE** - All API endpoints are properly protected with authentication and authorization.

## Environment Variables Setup

Create a `.env.local` file in your project root with the following variables:

```bash
# Security Configuration
# IMPORTANT: Change these values in production!
FRONTEND_SECRET=my-super-secure-secret-key-2024
NEXT_PUBLIC_FRONTEND_SECRET=my-super-secure-secret-key-2024

# Environment
NODE_ENV=development

# Your domain (add your actual domain in production)
NEXT_PUBLIC_BASE_URL=http://localhost:3000

# API Keys
OPENAI_API_KEY=your-openai-api-key
DEEPSEEK_API_KEY=your-deepseek-api-key

# Database Configuration (if using)
DATABASE_URL=your-database-url
```

## 🔒 Security Features Implemented

### 1. **Custom Header Authentication**
- All API requests must include `x-frontend-secret` header
- Secret is configured via `FRONTEND_SECRET` environment variable
- Frontend automatically includes this header via `ApiClient` utility
- **Protection**: Blocks requests without proper authentication

### 2. **Origin-based Restrictions**
- Only requests from allowed origins are accepted
- Configured in `middleware.ts` under `ALLOWED_ORIGINS`
- Add your production domain to the array
- **Protection**: Prevents cross-site request forgery (CSRF)

### 3. **Rate Limiting**
- 100 requests per 15-minute window per IP address
- Configurable in `middleware.ts`
- Prevents abuse and DDoS attacks
- **Protection**: Throttles excessive requests

### 4. **Security Headers**
- `X-Content-Type-Options: nosniff` - Prevents MIME type sniffing
- `X-Frame-Options: DENY` - Prevents clickjacking
- `X-XSS-Protection: 1; mode=block` - XSS protection
- `Referrer-Policy: strict-origin-when-cross-origin` - Controls referrer information

## 🛡️ How the Security System Works

### Middleware Protection Flow

1. **Route Filtering**: Only `/api/*` routes are protected by middleware
2. **Environment Check**: Validates `FRONTEND_SECRET` is properly set
3. **Origin Validation**: Checks if request origin is in `ALLOWED_ORIGINS`
4. **Header Authentication**: Validates `x-frontend-secret` header
5. **Rate Limiting**: Tracks and limits requests per IP
6. **Security Headers**: Adds protective headers to responses

### Frontend Integration

The `ApiClient` utility automatically includes the required security headers:

```typescript
// utils/apiClient.ts
const headers = {
  'Content-Type': 'application/json',
  'x-frontend-secret': process.env.NEXT_PUBLIC_FRONTEND_SECRET
};
```

## 🧪 Testing the Security System

### Automated Security Tests

Run the security test suite to verify all protections are working:

```bash
npm run test:security
```

### Expected Test Results

✅ **All tests should pass:**
- Direct API access (should fail with 403)
- API access without secret header (should fail with 403)
- API access with wrong secret (should fail with 403)
- API access with correct secret (should succeed with 200)

### Manual Testing

You can also test manually:

```bash
# Should fail (403 error)
curl http://localhost:3000/api/pokemons/get-all

# Should fail (403 error)
curl -H "Content-Type: application/json" http://localhost:3000/api/pokemons/get-all

# Should fail (403 error)
curl -H "x-frontend-secret: wrong-secret" http://localhost:3000/api/pokemons/get-all

# Should succeed (200 response)
curl -H "x-frontend-secret: my-super-secure-secret-key-2024" http://localhost:3000/api/pokemons/get-all
```

## 🚨 Troubleshooting Common Issues

### Issue: Security Tests Failing (All requests returning 200)

**Symptoms:**
- Direct API access works without authentication
- Security tests show ❌ instead of ✅
- API endpoints accessible without headers

**Causes & Solutions:**

1. **Missing `.env.local` file**
   ```bash
   # Create the file with proper secret
   echo "FRONTEND_SECRET=my-super-secure-secret-key-2024" > .env.local
   ```

2. **Development server not restarted**
   ```bash
   # Stop the server (Ctrl+C) and restart
   npm run dev
   ```

3. **Environment variables not loaded**
   - Ensure `.env.local` is in project root
   - Check file format (no extra spaces or characters)
   - Restart development server

4. **Middleware bypass enabled**
   - Check `middleware.ts` for development bypass logic
   - Ensure `hasSecret` logic is correct

### Issue: 403 Errors on Legitimate Requests

**Symptoms:**
- Frontend requests failing with 403
- "Invalid frontend secret" errors

**Causes & Solutions:**

1. **Secret mismatch**
   - Ensure `FRONTEND_SECRET` and `NEXT_PUBLIC_FRONTEND_SECRET` match
   - Check for typos or extra characters

2. **Header not included**
   - Verify `ApiClient` is using correct header name
   - Check frontend code includes `x-frontend-secret`

3. **Origin not allowed**
   - Add your domain to `ALLOWED_ORIGINS` in middleware

### Issue: Rate Limiting Too Aggressive

**Symptoms:**
- Legitimate requests getting 429 errors
- "Rate limit exceeded" messages

**Solutions:**
- Increase `maxRequests` in middleware
- Extend `windowMs` time window
- Implement more sophisticated rate limiting

## 🔧 Development vs Production

### Development Mode
- Security is enforced but can be bypassed for debugging
- Uses development-specific secrets
- More verbose logging for troubleshooting

### Production Mode
- **ALWAYS** enforce security (no bypasses)
- Use strong, random secrets
- Minimal logging for performance
- HTTPS required
- Proper domain configuration

## 🚀 Production Deployment Checklist

### 1. **Environment Variables**
```bash
# Generate a strong random secret
FRONTEND_SECRET=your-64-character-random-string
NEXT_PUBLIC_FRONTEND_SECRET=your-64-character-random-string
NODE_ENV=production
```

### 2. **Domain Configuration**
```typescript
// middleware.ts
const ALLOWED_ORIGINS = [
  'https://your-production-domain.com',
  'https://www.your-production-domain.com'
];
```

### 3. **Security Headers**
- Ensure all security headers are enabled
- Consider adding Content Security Policy (CSP)
- Enable HTTPS redirects

### 4. **Rate Limiting**
- Consider using Redis for distributed rate limiting
- Adjust limits based on your application needs
- Monitor for abuse patterns

### 5. **Monitoring**
- Set up logging for security events
- Monitor for failed authentication attempts
- Track rate limiting violations

## 📋 Security Best Practices

### 1. **Secret Management**
- Use strong, random secrets (64+ characters)
- Never commit secrets to version control
- Rotate secrets regularly
- Use different secrets for different environments

### 2. **Origin Validation**
- Whitelist only necessary domains
- Be specific with subdomain restrictions
- Consider using wildcards carefully

### 3. **Rate Limiting**
- Set appropriate limits for your use case
- Monitor and adjust based on traffic patterns
- Implement progressive rate limiting for abuse

### 4. **Error Handling**
- Don't leak sensitive information in error messages
- Log security events for monitoring
- Implement proper error responses

### 5. **Regular Audits**
- Run security tests regularly
- Review and update security configurations
- Monitor for new vulnerabilities

## 🔍 Debugging Security Issues

### Enable Debug Logging

The middleware includes debug logging to help troubleshoot issues:

```typescript
// middleware.ts
console.log('🔒 Middleware triggered for:', request.nextUrl.pathname);
console.log('🔒 FRONTEND_SECRET:', FRONTEND_SECRET);
console.log('🔒 NODE_ENV:', process.env.NODE_ENV);
```

### Common Debug Commands

```bash
# Check if environment variables are loaded
node -e "console.log(process.env.FRONTEND_SECRET)"

# Test middleware directly
curl -v -H "x-frontend-secret: your-secret" http://localhost:3000/api/pokemons/get-all

# Check server logs for middleware activity
npm run dev
```

## 📚 Additional Resources

- [Next.js Middleware Documentation](https://nextjs.org/docs/app/building-your-application/routing/middleware)
- [OWASP Security Headers](https://owasp.org/www-project-secure-headers/)
- [Rate Limiting Best Practices](https://cloud.google.com/architecture/rate-limiting-strategies-techniques)

---

**Remember**: Security is an ongoing process. Regularly review and update your security measures as your application evolves. 