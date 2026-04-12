import { NextRequest, NextResponse } from 'next/server';

// Security configuration
const DEFAULT_ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:3001',
  // Production domains
  'https://project1.enricfitaram.dev',
  'https://www.project1.enricfitaram.dev',
];
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);
const SAFE_ALLOWED_ORIGINS = ALLOWED_ORIGINS.length > 0 ? ALLOWED_ORIGINS : DEFAULT_ALLOWED_ORIGINS;

// Rate limiting store (in production, use Redis or similar)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();
const MAX_RATE_LIMIT_KEYS = 10_000;

function cleanupRateLimitStore(now: number) {
  if (rateLimitStore.size < MAX_RATE_LIMIT_KEYS) return;
  for (const [key, value] of rateLimitStore.entries()) {
    if (now > value.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}

export function middleware(request: NextRequest) {
  // Only apply to API routes
  if (!request.nextUrl.pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  // 1. Origin check
  const origin = request.headers.get('origin');

  if (origin && !SAFE_ALLOWED_ORIGINS.includes(origin)) {
    return new NextResponse(
      JSON.stringify({ error: 'Unauthorized origin' }),
      { 
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }

  // 2. Rate limiting
  const forwardedFor = request.headers.get('x-forwarded-for');
  const clientIP = (forwardedFor ? forwardedFor.split(',')[0].trim() : null) ||
                   request.headers.get('x-real-ip') || 
                   'unknown';
  const now = Date.now();
  cleanupRateLimitStore(now);
  const windowMs = 1 * 60 * 1000; // 1 minute
  const maxRequests = 120; // Max requests per window

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

  // 3. Add security headers
  const response = NextResponse.next();
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  if (process.env.NODE_ENV === 'production') {
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }

  return response;
}

export const config = {
  matcher: '/api/:path*',
}; 
