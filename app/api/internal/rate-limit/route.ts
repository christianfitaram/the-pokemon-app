import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { appendRateLimitHeaders, consumeRateLimit } from "@/lib/security/rateLimit";

const rateLimitPayloadSchema = z.object({
  key: z.string().trim().min(1).max(256),
  windowMs: z.number().int().positive().max(60 * 60 * 1000),
  maxRequests: z.number().int().positive().max(50_000),
});

export async function POST(request: NextRequest) {
  const secret = process.env.RATE_LIMIT_INTERNAL_SECRET?.trim();
  if (!secret) {
    return NextResponse.json(
      { error: "RATE_LIMIT_INTERNAL_SECRET is required to enable this endpoint" },
      { status: 503 }
    );
  }

  const provided = request.headers.get("x-rate-limit-secret");
  if (provided !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = rateLimitPayloadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid payload",
        details: parsed.error.flatten(),
      },
      { status: 400 }
    );
  }

  const { key, windowMs, maxRequests } = parsed.data;
  const result = await consumeRateLimit(`internal:${key}`, windowMs, maxRequests);
  const response = NextResponse.json(result);
  appendRateLimitHeaders(response.headers, result);
  return response;
}
