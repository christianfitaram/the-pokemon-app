import { NextRequest, NextResponse } from "next/server";
import { connectRedis } from "@/lib/redis";
import {
  clearLocalRateLimitStoreForTests,
  consumeLocalRateLimit,
} from "@/lib/security/localRateLimit";

type RateLimitSource = "shared" | "local-fallback";

export type RateLimitResult = {
  allowed: boolean;
  count: number;
  remaining: number;
  resetAt: number;
  limit: number;
  source: RateLimitSource;
};

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
    return consumeLocalRateLimit(redisScopedKey, windowMs, maxRequests);
  }

  const redis = await connectRedis();
  if (!redis) {
    return consumeLocalRateLimit(redisScopedKey, windowMs, maxRequests);
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
    return consumeLocalRateLimit(redisScopedKey, windowMs, maxRequests);
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
  clearLocalRateLimitStoreForTests();
}
