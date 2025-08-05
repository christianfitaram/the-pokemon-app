import { NextRequest, NextResponse } from 'next/server';

// Security configuration
const ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:3001',
  // Add your production domain here
  // 'https://your-domain.com',
];

const FRONTEND_SECRET = process.env.FRONTEND_SECRET || 'your-secret-key-change-this';

// Rate limiting store (in production, use Redis or similar)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export function middleware(request: NextRequest) {
  // Only apply to API routes
  if (!request.nextUrl.pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  // Skip security checks in development if no secret is set
  const isDevelopment = process.env.NODE_ENV === 'development';
  const hasSecret = FRONTEND_SECRET && FRONTEND_SECRET !== 'your-secret-key-change-this';

  if (isDevelopment && !hasSecret) {
    console.warn('⚠️  Security middleware disabled in development. Set FRONTEND_SECRET to enable.');
    return NextResponse.next();
  }

  // 1. Origin check
  const origin = request.headers.get('origin');
  if (origin && !ALLOWED_ORIGINS.includes(origin)) {
    return new NextResponse(
      JSON.stringify({ error: 'Unauthorized origin' }),
      { 
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }

  // 2. Custom header check
  const frontendSecret = request.headers.get('x-frontend-secret');
  if (frontendSecret !== FRONTEND_SECRET) {
    return new NextResponse(
      JSON.stringify({ error: 'Invalid frontend secret' }),
      { 
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }

  // 3. Rate limiting
  const clientIP = request.ip || request.headers.get('x-forwarded-for') || 'unknown';
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 minutes
  const maxRequests = 100; // Max requests per window

  const clientData = rateLimitStore.get(clientIP);
  
  if (!clientData || now > clientData.resetTime) {
    // Reset or initialize rate limit
    rateLimitStore.set(clientIP, { count: 1, resetTime: now + windowMs });
  } else if (clientData.count >= maxRequests) {
    return new NextResponse(
      JSON.stringify({ error: 'Rate limit exceeded' }),
      { 
        status: 429,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } else {
    // Increment count
    clientData.count++;
  }

  // 4. Add security headers
  const response = NextResponse.next();
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  return response;
}

export const config = {
  matcher: '/api/:path*',
}; 