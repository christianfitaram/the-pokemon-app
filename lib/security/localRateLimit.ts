export type LocalRateLimitResult = {
  allowed: boolean;
  count: number;
  remaining: number;
  resetAt: number;
  limit: number;
  source: "local-fallback";
};

const localRateLimitStore = new Map<string, { count: number; resetAt: number }>();
const MAX_LOCAL_RATE_LIMIT_KEYS = 20_000;
const MAX_LOCAL_RATE_LIMIT_PRUNE_PER_CALL = 1_000;

function pruneLocalRateLimitStore(now: number) {
  let scanned = 0;
  for (const [key, value] of localRateLimitStore.entries()) {
    if (now >= value.resetAt) {
      localRateLimitStore.delete(key);
    }
    scanned += 1;
    if (scanned >= MAX_LOCAL_RATE_LIMIT_PRUNE_PER_CALL) {
      break;
    }
  }

  while (localRateLimitStore.size > MAX_LOCAL_RATE_LIMIT_KEYS) {
    const oldestKey = localRateLimitStore.keys().next().value;
    if (!oldestKey) break;
    localRateLimitStore.delete(oldestKey);
  }
}

export function consumeLocalRateLimit(
  key: string,
  windowMs: number,
  maxRequests: number
): LocalRateLimitResult {
  const now = Date.now();
  pruneLocalRateLimitStore(now);
  const current = localRateLimitStore.get(key);

  if (!current || now >= current.resetAt) {
    const resetAt = now + windowMs;
    localRateLimitStore.set(key, { count: 1, resetAt });
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

export function clearLocalRateLimitStoreForTests() {
  localRateLimitStore.clear();
}
