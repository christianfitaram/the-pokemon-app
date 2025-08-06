import { NextRequest, NextResponse } from 'next/server';

// Security configuration
const ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:3001',
  // Production domains
  'https://project1.enricfitaram.dev',
  'https://www.project1.enricfitaram.dev',
  // Add your actual production domain here if different
];

const FRONTEND_SECRET = process.env.FRONTEND_SECRET || 'my-super-secure-secret-key-2024';

// Rate limiting store (in production, use Redis or similar)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export function middleware(request: NextRequest) {
  // Only apply to API routes
  if (!request.nextUrl.pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  // Security check configuration
  const isDevelopment = process.env.NODE_ENV === 'development';
  const hasSecret = FRONTEND_SECRET && FRONTEND_SECRET !== 'my-super-secure-secret-key-2024';

  // Skip security checks in development if no secret is set
  if (isDevelopment && !hasSecret) {
    return NextResponse.next();
  }

  // 1. Origin check
  const origin = request.headers.get('origin');
  
  if (origin && !ALLOWED_ORIGINS.includes(origin)) {
    return new NextResponse(
      JSON.stringify({ error: 'Unauthorized origin', received: origin, allowed: ALLOWED_ORIGINS }),
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
      JSON.stringify({ error: 'Invalid frontend secret', secretProvided: !!frontendSecret, secretConfigured: !!FRONTEND_SECRET }),
      { 
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }

  // 3. Rate limiting
  const clientIP = request.headers.get('x-forwarded-for') || 
                   request.headers.get('x-real-ip') || 
                   'unknown';
  const now = Date.now();
  const windowMs = 1 * 60 * 1000; // 1 minute
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