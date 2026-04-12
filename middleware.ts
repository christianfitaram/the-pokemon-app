import { NextRequest, NextResponse } from 'next/server';
import { isOriginAllowed } from '@/lib/security/origin';

const COSTLY_API_PATHS = new Set([
  "/api/assistance",
  "/api/chat-roleplay",
]);

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
  const isCostlyRoute = COSTLY_API_PATHS.has(request.nextUrl.pathname);

  if (isCostlyRoute && !origin) {
    return new NextResponse(
      JSON.stringify({ error: 'Origin header required for this endpoint' }),
      {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }

  if (origin && !isOriginAllowed(origin)) {
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
