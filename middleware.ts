import { NextRequest, NextResponse } from 'next/server';
import { isOriginAllowed } from '@/lib/security/origin';

const COSTLY_API_PATHS = new Set([
  "/api/assistance",
  "/api/chat-roleplay",
]);
const RATE_LIMIT_ENDPOINT = "/api/internal/rate-limit";

// Local fallback when shared store is unavailable.
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();
const MAX_RATE_LIMIT_KEYS = 10_000;
const MAX_PRUNE_PER_REQUEST = 500;

function cleanupRateLimitStore(now: number) {
  let scanned = 0;
  for (const [key, value] of rateLimitStore.entries()) {
    if (now > value.resetTime) {
      rateLimitStore.delete(key);
    }
    scanned += 1;
    if (scanned >= MAX_PRUNE_PER_REQUEST) {
      break;
    }
  }

  while (rateLimitStore.size > MAX_RATE_LIMIT_KEYS) {
    const oldestKey = rateLimitStore.keys().next().value;
    if (!oldestKey) {
      break;
    }
    rateLimitStore.delete(oldestKey);
  }
}

function applyLocalRateLimit(clientKey: string, windowMs: number, maxRequests: number) {
  const now = Date.now();
  cleanupRateLimitStore(now);
  const clientData = rateLimitStore.get(clientKey);

  if (!clientData || now > clientData.resetTime) {
    const resetTime = now + windowMs;
    rateLimitStore.set(clientKey, { count: 1, resetTime });
    return {
      allowed: true,
      count: 1,
      remaining: Math.max(0, maxRequests - 1),
      resetTime,
      source: "local-fallback" as const,
    };
  }

  if (clientData.count >= maxRequests) {
    return {
      allowed: false,
      count: clientData.count,
      remaining: 0,
      resetTime: clientData.resetTime,
      source: "local-fallback" as const,
    };
  }

  clientData.count += 1;
  return {
    allowed: true,
    count: clientData.count,
    remaining: Math.max(0, maxRequests - clientData.count),
    resetTime: clientData.resetTime,
    source: "local-fallback" as const,
  };
}

type SharedRateLimitResult = {
  allowed: boolean;
  count: number;
  remaining: number;
  resetAt: number;
  source: "local-fallback";
};

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
  const windowMs = 1 * 60 * 1000; // 1 minute
  const maxRequests = 120; // Max requests per window
  const local = applyLocalRateLimit(clientIP, windowMs, maxRequests);
  const rateLimitResult: SharedRateLimitResult = {
    allowed: local.allowed,
    count: local.count,
    remaining: local.remaining,
    resetAt: local.resetTime,
    source: local.source,
  };

  if (!rateLimitResult.allowed) {
    return new NextResponse(
      JSON.stringify({ error: 'Rate limit exceeded' }),
      { 
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': String(Math.max(1, Math.ceil((rateLimitResult.resetAt - Date.now()) / 1000))),
          'X-RateLimit-Limit': String(maxRequests),
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
  response.headers.set('X-RateLimit-Limit', String(maxRequests));
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
