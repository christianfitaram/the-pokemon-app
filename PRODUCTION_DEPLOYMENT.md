# Production Deployment Guide

This guide walks you through deploying your Pokemon app to production with proper security measures.

## 🚀 **Quick Start Checklist**

- [ ] Generate production secret key
- [ ] Set environment variables
- [ ] Update domain configuration
- [ ] Build and deploy
- [ ] Test security measures
- [ ] Monitor and maintain

## 📋 **Step-by-Step Deployment**

### Step 1: Generate Production Secret

```bash
# Generate a secure 128-character secret
node -e "console.log('FRONTEND_SECRET=' + require('crypto').randomBytes(64).toString('hex'))"
```

**Use the generated secret for both:**
- `FRONTEND_SECRET` (server-side)
- `NEXT_PUBLIC_FRONTEND_SECRET` (client-side)

### Step 2: Set Production Environment Variables

Create these environment variables in your hosting platform (Vercel, Netlify, etc.):

```bash
# Security (USE THE GENERATED SECRET FROM STEP 1)
FRONTEND_SECRET=your-generated-128-character-secret
NEXT_PUBLIC_FRONTEND_SECRET=your-generated-128-character-secret

# Environment
NODE_ENV=production

# Your Production Domain
NEXT_PUBLIC_BASE_URL=https://your-actual-domain.com

# API Keys (use production keys)
OPENAI_API_KEY=your-production-openai-key
DEEPSEEK_API_KEY=your-production-deepseek-key
```

### Step 3: Update Domain Configuration

Edit `middleware.ts` and replace the placeholder domains:

```typescript
const ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:3001',
  // REPLACE WITH YOUR ACTUAL DOMAINS
  'https://your-actual-domain.com',
  'https://www.your-actual-domain.com',
];
```

### Step 4: Build and Deploy

#### Option A: Vercel (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

#### Option B: Manual Build
```bash
# Build for production
npm run build:prod

# Start production server
npm run start:prod
```

#### Option C: Docker
```dockerfile
# Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build:prod
EXPOSE 3000
CMD ["npm", "run", "start:prod"]
```

### Step 5: Test Production Security

After deployment, test your security measures:

```bash
# Test from your production domain
curl -H "x-frontend-secret: your-generated-secret" https://your-domain.com/api/pokemons/get-all

# Should fail without secret
curl https://your-domain.com/api/pokemons/get-all
```

## 🔒 **Production Security Checklist**

### ✅ **Environment Variables**
- [ ] `FRONTEND_SECRET` set with strong random value
- [ ] `NEXT_PUBLIC_FRONTEND_SECRET` matches server secret
- [ ] `NODE_ENV=production`
- [ ] All API keys are production keys

### ✅ **Domain Configuration**
- [ ] Production domain added to `ALLOWED_ORIGINS`
- [ ] HTTPS enabled
- [ ] No development domains in production

### ✅ **Security Headers**
- [ ] `X-Content-Type-Options: nosniff`
- [ ] `X-Frame-Options: DENY`
- [ ] `X-XSS-Protection: 1; mode=block`
- [ ] `Referrer-Policy: strict-origin-when-cross-origin`

### ✅ **Rate Limiting**
- [ ] 100 requests per 15 minutes per IP
- [ ] Monitor for abuse patterns
- [ ] Adjust limits based on traffic

## 🛠️ **Hosting Platform Specific Instructions**

### Vercel
1. Connect your GitHub repository
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch
4. Enable HTTPS (automatic)

### Netlify
1. Connect your repository
2. Set environment variables in Netlify dashboard
3. Build command: `npm run build:prod`
4. Publish directory: `.next`

### Railway
1. Connect your repository
2. Set environment variables in Railway dashboard
3. Build command: `npm run build:prod`
4. Start command: `npm run start:prod`

### AWS/EC2
1. Set up EC2 instance
2. Install Node.js and PM2
3. Clone repository and set environment variables
4. Build and start with PM2: `pm2 start npm --name "pokemon-app" -- run start:prod`

## 🔍 **Post-Deployment Testing**

### 1. **Security Tests**
```bash
# Test from production domain
npm run test:security
```

### 2. **Manual API Tests**
```bash
# Should succeed
curl -H "x-frontend-secret: your-secret" https://your-domain.com/api/pokemons/get-all

# Should fail (403)
curl https://your-domain.com/api/pokemons/get-all

# Should fail (403)
curl -H "x-frontend-secret: wrong-secret" https://your-domain.com/api/pokemons/get-all
```

### 3. **Frontend Integration**
- [ ] Pokemon list loads correctly
- [ ] Pokemon details display properly
- [ ] Search functionality works
- [ ] No console errors

### 4. **Performance Tests**
- [ ] Page load times under 3 seconds
- [ ] API response times under 500ms
- [ ] No memory leaks
- [ ] Proper caching headers

## 📊 **Monitoring and Maintenance**

### 1. **Security Monitoring**
- Monitor failed authentication attempts
- Track rate limiting violations
- Log security events
- Set up alerts for suspicious activity

### 2. **Performance Monitoring**
- Monitor API response times
- Track error rates
- Monitor server resources
- Set up uptime monitoring

### 3. **Regular Maintenance**
- Update dependencies monthly
- Rotate secrets quarterly
- Review security logs weekly
- Test security measures monthly

## 🚨 **Emergency Procedures**

### If Security is Compromised
1. **Immediate Actions**
   - Rotate `FRONTEND_SECRET` immediately
   - Check server logs for unauthorized access
   - Review recent deployments

2. **Investigation**
   - Analyze access logs
   - Check for data breaches
   - Review security configurations

3. **Recovery**
   - Deploy new secret
   - Update all client applications
   - Monitor for continued attacks

### If API is Down
1. Check server status
2. Review recent deployments
3. Check environment variables
4. Restart application if needed

## 📞 **Support and Resources**

- **Security Issues**: Review `SECURITY_SETUP.md`
- **Deployment Issues**: Check hosting platform documentation
- **Performance Issues**: Monitor application metrics
- **Emergency**: Contact your hosting platform support

---

**Remember**: Production security is ongoing. Regularly review and update your security measures. 