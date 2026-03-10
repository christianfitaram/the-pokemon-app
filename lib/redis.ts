import { createClient } from "redis";

const redis = createClient({
    url: process.env.REDIS_URL || "redis://localhost:6379",
});

redis.on("error", (err) => console.error("X Redis error:", err));

export async function connectRedis() {
    if (!redis.isOpen) await redis.connect();
    return redis;
}

export default redis;
