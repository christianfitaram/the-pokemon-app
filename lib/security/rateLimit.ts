import { NextRequest, NextResponse } from "next/server";
import { connectRedis } from "@/lib/redis";

type RateLimitSource = "shared" | "local-fallback";

export type RateLimitResult = {
  allowed: boolean;
  count: number;
  remaining: number;
  resetAt: number;
  limit: number;
  source: RateLimitSource;
};

const fallbackStore = new Map<string, { count: number; resetAt: number }>();
const MAX_FALLBACK_KEYS = 20_000;
const MAX_PRUNE_PER_CALL = 1_000;

function pruneFallbackStore(now: number) {
  let scanned = 0;
  for (const [key, value] of fallbackStore.entries()) {
    if (now >= value.resetAt) {
      fallbackStore.delete(key);
    }
    scanned += 1;
    if (scanned >= MAX_PRUNE_PER_CALL) {
      break;
    }
  }

  while (fallbackStore.size > MAX_FALLBACK_KEYS) {
    const oldestKey = fallbackStore.keys().next().value;
    if (!oldestKey) break;
    fallbackStore.delete(oldestKey);
  }
}

function consumeFallbackLimit(redisScopedKey: string, windowMs: number, maxRequests: number): RateLimitResult {
  const now = Date.now();
  pruneFallbackStore(now);
  const current = fallbackStore.get(redisScopedKey);

  if (!current || now >= current.resetAt) {
    const resetAt = now + windowMs;
    fallbackStore.set(redisScopedKey, { count: 1, resetAt });
    return {
      allowed: true,
      count: 1,
      remaining: Math.max(0, maxRequests - 1),
      resetAt,
      limit: maxRequests,
      source: "local-fallback",
    };
  }

  current.count += 1;
  return {
    allowed: current.count <= maxRequests,
    count: current.count,
    remaining: Math.max(0, maxRequests - current.count),
    resetAt: current.resetAt,
    limit: maxRequests,
    source: "local-fallback",
  };
}

function shouldUseRedis() {
  if (process.env.FORCE_REDIS_RATE_LIMIT === "true") {
    return true;
  }
  return process.env.NODE_ENV !== "test" && process.env.DISABLE_REDIS_RATE_LIMIT !== "true";
}

export async function consumeRateLimit(
  key: string,
  windowMs: number,
  maxRequests: number
): Promise<RateLimitResult> {
  const redisScopedKey = `rate-limit:${key}`;
  if (!shouldUseRedis()) {
    return consumeFallbackLimit(redisScopedKey, windowMs, maxRequests);
  }

  const redis = await connectRedis();
  if (!redis) {
    return consumeFallbackLimit(redisScopedKey, windowMs, maxRequests);
  }

  try {
    const count = await redis.incr(redisScopedKey);
    if (count === 1) {
      await redis.pExpire(redisScopedKey, windowMs);
    }

    const ttlMs = await redis.pTTL(redisScopedKey);
    const resetAt = Date.now() + (ttlMs > 0 ? ttlMs : windowMs);

    return {
      allowed: count <= maxRequests,
      count,
      remaining: Math.max(0, maxRequests - count),
      resetAt,
      limit: maxRequests,
      source: "shared",
    };
  } catch {
    return consumeFallbackLimit(redisScopedKey, windowMs, maxRequests);
  }
}

export function getClientAddress(request: NextRequest): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    const first = forwardedFor.split(",")[0]?.trim();
    if (first) return first;
  }

  const realIp = request.headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;

  return "unknown";
}

export function appendRateLimitHeaders(headers: Headers, result: RateLimitResult) {
  headers.set("X-RateLimit-Limit", String(result.limit));
  headers.set("X-RateLimit-Remaining", String(result.remaining));
  headers.set("X-RateLimit-Reset", String(result.resetAt));
  headers.set("X-RateLimit-Store", result.source);
}

export function buildRateLimitExceededResponse(result: RateLimitResult) {
  const response = NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  appendRateLimitHeaders(response.headers, result);
  response.headers.set(
    "Retry-After",
    String(Math.max(1, Math.ceil((result.resetAt - Date.now()) / 1000)))
  );
  return response;
}

export function clearRateLimitFallbackForTests() {
  fallbackStore.clear();
}
