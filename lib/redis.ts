import { createClient } from "redis";

const redis = createClient({
    url: process.env.REDIS_URL || "redis://localhost:6379",
});

redis.on("error", (err) => console.error("X Redis error:", err));

const REDIS_RETRY_COOLDOWN_MS = 30_000;
let nextReconnectAttemptAt = 0;
let hasLoggedConnectionFailure = false;

export async function connectRedis() {
    if (redis.isOpen) {
        return redis;
    }

    const now = Date.now();
    if (now < nextReconnectAttemptAt) {
        return null;
    }

    try {
        await redis.connect();
        nextReconnectAttemptAt = 0;
        if (hasLoggedConnectionFailure) {
            console.log("Redis connection recovered");
            hasLoggedConnectionFailure = false;
        }
        return redis;
    } catch (error) {
        nextReconnectAttemptAt = now + REDIS_RETRY_COOLDOWN_MS;
        if (!hasLoggedConnectionFailure) {
            console.error("Redis unavailable, continuing without Redis cache:", error);
            hasLoggedConnectionFailure = true;
        }
        return null;
    }
}

export default redis;
