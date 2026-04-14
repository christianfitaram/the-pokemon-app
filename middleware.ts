import { NextRequest, NextResponse } from 'next/server';
import { isOriginAllowed } from '@/lib/security/origin';
import { consumeLocalRateLimit } from '@/lib/security/localRateLimit';

const COSTLY_API_PATHS = new Set([
  "/api/assistance",
  "/api/chat-roleplay",
]);
const RATE_LIMIT_ENDPOINT = "/api/internal/rate-limit";
const GLOBAL_RATE_LIMIT_WINDOW_MS = 60_000;
const GLOBAL_RATE_LIMIT_MAX_REQUESTS = 120;

export async function middleware(request: NextRequest) {
  // Only apply to API routes
  if (!request.nextUrl.pathname.startsWith('/api/')) {
    return NextResponse.next();
  }
  if (request.nextUrl.pathname === RATE_LIMIT_ENDPOINT) {
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
  const rateLimitResult = consumeLocalRateLimit(
    `middleware:${clientIP}`,
    GLOBAL_RATE_LIMIT_WINDOW_MS,
    GLOBAL_RATE_LIMIT_MAX_REQUESTS
  );

  if (!rateLimitResult.allowed) {
    return new NextResponse(
      JSON.stringify({ error: 'Rate limit exceeded' }),
      { 
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': String(Math.max(1, Math.ceil((rateLimitResult.resetAt - Date.now()) / 1000))),
          'X-RateLimit-Limit': String(rateLimitResult.limit),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(rateLimitResult.resetAt),
          'X-RateLimit-Store': rateLimitResult.source,
        }
      }
    );
  }

  // 3. Add security headers
  const response = NextResponse.next();
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  response.headers.set('X-RateLimit-Limit', String(rateLimitResult.limit));
  response.headers.set('X-RateLimit-Remaining', String(rateLimitResult.remaining));
  response.headers.set('X-RateLimit-Reset', String(rateLimitResult.resetAt));
  response.headers.set('X-RateLimit-Store', rateLimitResult.source);
  if (process.env.NODE_ENV === 'production') {
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }

  return response;
}

export const config = {
  matcher: '/api/:path*',
}; 
