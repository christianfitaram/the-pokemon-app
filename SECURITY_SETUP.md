# Security Setup Guide

This guide explains how to secure your Pokemon app API endpoints so only your frontend can make requests.

## Environment Variables

Create a `.env.local` file in your project root with the following variables:

```bash
# Security Configuration
# Change these values in production!
FRONTEND_SECRET=your-super-secret-key-change-this-in-production
NEXT_PUBLIC_FRONTEND_SECRET=your-super-secret-key-change-this-in-production

# Your domain (add your actual domain in production)
NEXT_PUBLIC_BASE_URL=http://localhost:3000

# OpenAI Configuration
OPENAI_API_KEY=your-openai-api-key

# Database Configuration (if using)
DATABASE_URL=your-database-url
```

## Security Features Implemented

### 1. Origin-based Restrictions
- Only requests from allowed origins are accepted
- Configured in `middleware.ts` under `ALLOWED_ORIGINS`
- Add your production domain to the array

### 2. Custom Header Authentication
- All API requests must include `x-frontend-secret` header
- Secret is configured via `FRONTEND_SECRET` environment variable
- Frontend automatically includes this header via `ApiClient`

### 3. Rate Limiting
- 100 requests per 15-minute window per IP address
- Configurable in `middleware.ts`
- Prevents abuse and DDoS attacks

### 4. Security Headers
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: strict-origin-when-cross-origin`

## How It Works

1. **Middleware Protection**: All `/api/*` routes are protected by the middleware
2. **Frontend Integration**: The `ApiClient` utility automatically includes the required headers
3. **Automatic Rejection**: Unauthorized requests are rejected with 403 status

## Production Deployment

1. **Change the secret**: Use a strong, random secret key
2. **Update origins**: Add your production domain to `ALLOWED_ORIGINS`
3. **Environment variables**: Set all required environment variables in your hosting platform
4. **HTTPS**: Ensure your production site uses HTTPS

## Testing

To test the security:

1. Try accessing an API endpoint directly in the browser (should fail)
2. Try making a request without the secret header (should fail)
3. Try making a request from a different origin (should fail)
4. Try making too many requests quickly (should be rate limited)

## Troubleshooting

- **403 errors**: Check that your frontend secret matches between client and server
- **CORS errors**: Ensure your domain is in the `ALLOWED_ORIGINS` array
- **Rate limiting**: Reduce request frequency or increase limits in middleware 