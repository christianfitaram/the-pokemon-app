import { NextResponse } from "next/server";
import { pool } from "@/lib/db/pgvector";
import { connectRedis } from "@/lib/redis";

type CheckStatus = "up" | "down";

type DependencyCheck = {
  status: CheckStatus;
  required: boolean;
  latencyMs: number;
  error?: string;
};

type HealthStatus = "ok" | "degraded" | "fail";

type HealthPayload = {
  status: HealthStatus;
  service: string;
  timestamp: string;
  uptimeSeconds: number;
  checks: {
    app: DependencyCheck;
    database: DependencyCheck;
    redis: DependencyCheck;
  };
};

const DEFAULT_HEALTHCHECK_TIMEOUT_MS = 1_500;

function getHealthcheckTimeoutMs() {
  const raw = Number(process.env.HEALTHCHECK_TIMEOUT_MS ?? DEFAULT_HEALTHCHECK_TIMEOUT_MS);
  if (!Number.isFinite(raw) || raw <= 0) {
    return DEFAULT_HEALTHCHECK_TIMEOUT_MS;
  }
  return Math.floor(raw);
}

function asErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unknown error";
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number, timeoutLabel: string): Promise<T> {
  let timeoutHandle: NodeJS.Timeout | null = null;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutHandle = setTimeout(() => {
      reject(new Error(timeoutLabel));
    }, timeoutMs);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timeoutHandle) {
      clearTimeout(timeoutHandle);
    }
  }
}

async function runCheck(
  name: string,
  required: boolean,
  fn: () => Promise<void>
): Promise<DependencyCheck> {
  const startedAt = Date.now();
  const timeoutMs = getHealthcheckTimeoutMs();

  try {
    await withTimeout(fn(), timeoutMs, `${name} check timed out`);
    return {
      status: "up",
      required,
      latencyMs: Date.now() - startedAt,
    };
  } catch (error) {
    return {
      status: "down",
      required,
      latencyMs: Date.now() - startedAt,
      error: asErrorMessage(error),
    };
  }
}

export async function GET() {
  const [database, redis] = await Promise.all([
    runCheck("database", true, async () => {
      await pool.query("SELECT 1");
    }),
    runCheck("redis", false, async () => {
      const client = await connectRedis();
      if (!client) {
        throw new Error("Redis unavailable");
      }
      await client.ping();
    }),
  ]);

  const checks = {
    app: {
      status: "up" as const,
      required: true,
      latencyMs: 0,
    },
    database,
    redis,
  };

  const hasRequiredFailure = [checks.app, database, redis].some(
    (check) => check.required && check.status === "down"
  );
  const hasOptionalFailure = [database, redis].some(
    (check) => !check.required && check.status === "down"
  );

  const status: HealthStatus = hasRequiredFailure
    ? "fail"
    : hasOptionalFailure
      ? "degraded"
      : "ok";

  const payload: HealthPayload = {
    status,
    service: "the-pokemon-app",
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    checks,
  };

  return NextResponse.json(payload, { status: hasRequiredFailure ? 503 : 200 });
}
