import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";

type MockDbPool = {
  query: jest.Mock<(sql: string) => Promise<unknown>>;
};

type MockRedisClient = {
  ping: jest.Mock<() => Promise<string>>;
};

const originalEnv = { ...process.env };

async function loadHealthRoute(options: {
  dbQuery: (sql: string) => Promise<unknown>;
  redisClient: MockRedisClient | null;
}) {
  jest.resetModules();
  process.env = { ...originalEnv };

  const mockPool: MockDbPool = {
    query: jest.fn(options.dbQuery),
  };

  jest.doMock("@/lib/db/pgvector", () => ({
    pool: mockPool,
  }));

  jest.doMock("@/lib/redis", () => ({
    connectRedis: jest.fn(async () => options.redisClient),
  }));

  const route = await import("@/app/api/health/route");
  return {
    GET: route.GET,
    mockPool,
  };
}

describe("health route deep checks", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("returns ok when database and redis checks pass", async () => {
    const redisClient: MockRedisClient = {
      ping: jest.fn(async () => "PONG"),
    };

    const { GET, mockPool } = await loadHealthRoute({
      dbQuery: async () => ({ rows: [{ ok: 1 }] }),
      redisClient,
    });

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.status).toBe("ok");
    expect(body.checks.database.status).toBe("up");
    expect(body.checks.redis.status).toBe("up");
    expect(mockPool.query).toHaveBeenCalledWith("SELECT 1");
    expect(redisClient.ping).toHaveBeenCalledTimes(1);
  });

  it("returns degraded when optional redis check fails", async () => {
    const { GET } = await loadHealthRoute({
      dbQuery: async () => ({ rows: [{ ok: 1 }] }),
      redisClient: null,
    });

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.status).toBe("degraded");
    expect(body.checks.database.status).toBe("up");
    expect(body.checks.redis.status).toBe("down");
    expect(body.checks.redis.required).toBe(false);
  });

  it("returns fail when required database check fails", async () => {
    const redisClient: MockRedisClient = {
      ping: jest.fn(async () => "PONG"),
    };

    const { GET } = await loadHealthRoute({
      dbQuery: async () => {
        throw new Error("database offline");
      },
      redisClient,
    });

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body.status).toBe("fail");
    expect(body.checks.database.status).toBe("down");
    expect(body.checks.database.required).toBe(true);
  });
});
