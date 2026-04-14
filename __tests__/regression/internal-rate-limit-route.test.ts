import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";

type MockRedis = {
  incr: jest.Mock<(key: string) => Promise<number>>;
  pExpire: jest.Mock<(key: string, ttlMs: number) => Promise<number>>;
  pTTL: jest.Mock<(key: string) => Promise<number>>;
};

const originalEnv = { ...process.env };

async function loadRoute(options: {
  secret?: string;
  forceRedis?: boolean;
  redisClient?: MockRedis | null;
}) {
  jest.resetModules();

  process.env = { ...originalEnv };
  if (options.secret !== undefined) {
    process.env.RATE_LIMIT_INTERNAL_SECRET = options.secret;
  } else {
    delete process.env.RATE_LIMIT_INTERNAL_SECRET;
  }
  process.env.FORCE_REDIS_RATE_LIMIT = options.forceRedis ? "true" : "false";

  jest.doMock("@/lib/redis", () => ({
    connectRedis: jest.fn(async () => options.redisClient ?? null),
  }));

  return import("@/app/api/internal/rate-limit/route");
}

function makeRequest(body: unknown, secret?: string) {
  return new NextRequest("http://localhost:3000/api/internal/rate-limit", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(secret ? { "x-rate-limit-secret": secret } : {}),
    },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

describe("internal rate-limit route", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("returns 503 when endpoint secret is not configured", async () => {
    const { POST } = await loadRoute({});

    const response = await POST(makeRequest({ key: "1.2.3.4", windowMs: 60000, maxRequests: 10 }));
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body.error).toContain("RATE_LIMIT_INTERNAL_SECRET");
  });

  it("returns 401 when secret header does not match", async () => {
    const { POST } = await loadRoute({ secret: "internal-secret" });

    const response = await POST(makeRequest({ key: "1.2.3.4", windowMs: 60000, maxRequests: 10 }, "bad-secret"));
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body).toEqual({ error: "Unauthorized" });
  });

  it("returns 400 for malformed JSON", async () => {
    const { POST } = await loadRoute({ secret: "internal-secret" });

    const response = await POST(makeRequest("not-json", "internal-secret"));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({ error: "Invalid JSON body" });
  });

  it("returns 400 for invalid payload shape", async () => {
    const { POST } = await loadRoute({ secret: "internal-secret" });

    const response = await POST(
      makeRequest({ key: "", windowMs: -10, maxRequests: 0 }, "internal-secret")
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe("Invalid payload");
  });

  it("returns shared source when Redis is available", async () => {
    const mockRedis: MockRedis = {
      incr: jest.fn(async () => 2),
      pExpire: jest.fn(async () => 1),
      pTTL: jest.fn(async () => 42000),
    };
    const { POST } = await loadRoute({
      secret: "internal-secret",
      forceRedis: true,
      redisClient: mockRedis,
    });

    const response = await POST(
      makeRequest({ key: "10.0.0.1", windowMs: 60000, maxRequests: 3 }, "internal-secret")
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.allowed).toBe(true);
    expect(body.count).toBe(2);
    expect(body.source).toBe("shared");
    expect(response.headers.get("X-RateLimit-Limit")).toBe("3");
    expect(mockRedis.incr).toHaveBeenCalled();
  });

  it("falls back locally and blocks when max is exceeded", async () => {
    const { POST } = await loadRoute({ secret: "internal-secret" });

    const first = await POST(
      makeRequest({ key: "127.0.0.1", windowMs: 60000, maxRequests: 1 }, "internal-secret")
    );
    const second = await POST(
      makeRequest({ key: "127.0.0.1", windowMs: 60000, maxRequests: 1 }, "internal-secret")
    );

    const firstBody = await first.json();
    const secondBody = await second.json();

    expect(first.status).toBe(200);
    expect(firstBody.allowed).toBe(true);
    expect(firstBody.source).toBe("local-fallback");
    expect(secondBody.allowed).toBe(false);
    expect(secondBody.remaining).toBe(0);
  });
});
