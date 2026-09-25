import { createHash } from "node:crypto";

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

type RateLimitOptions = {
  scope: string;
  limit: number;
  windowMs: number;
  identifier?: string;
};

const globalForRateLimit = globalThis as unknown as {
  aiDemoRateLimits?: Map<string, RateLimitEntry>;
};

const entries =
  globalForRateLimit.aiDemoRateLimits ?? new Map<string, RateLimitEntry>();
globalForRateLimit.aiDemoRateLimits = entries;

function requestFingerprint(request: Request, identifier?: string) {
  if (identifier?.trim()) {
    return createHash("sha256")
      .update(`explicit:${identifier.trim()}`)
      .digest("hex")
      .slice(0, 24);
  }

  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const source =
    forwardedFor ||
    request.headers.get("x-real-ip") ||
    request.headers.get("user-agent") ||
    "unknown";

  return createHash("sha256").update(source).digest("hex").slice(0, 24);
}

function cleanupExpiredEntries(now: number) {
  if (entries.size < 500) return;
  for (const [key, entry] of entries) {
    if (entry.resetAt <= now) entries.delete(key);
  }
}

export function checkRateLimit(request: Request, options: RateLimitOptions) {
  const now = Date.now();
  cleanupExpiredEntries(now);

  const key = `${options.scope}:${requestFingerprint(request, options.identifier)}`;
  const current = entries.get(key);
  const entry =
    !current || current.resetAt <= now
      ? { count: 1, resetAt: now + options.windowMs }
      : { ...current, count: current.count + 1 };

  entries.set(key, entry);

  const remaining = Math.max(options.limit - entry.count, 0);
  const retryAfterSeconds = Math.max(Math.ceil((entry.resetAt - now) / 1000), 1);
  const headers = {
    "X-RateLimit-Limit": String(options.limit),
    "X-RateLimit-Remaining": String(remaining),
    "X-RateLimit-Reset": String(Math.ceil(entry.resetAt / 1000)),
  };

  return {
    allowed: entry.count <= options.limit,
    headers,
    retryAfterSeconds,
  };
}

export function rateLimitExceededResponse(
  result: ReturnType<typeof checkRateLimit>
) {
  return Response.json(
    {
      error: "Too many requests. Please wait a moment and try again.",
      code: "RATE_LIMITED",
    },
    {
      status: 429,
      headers: {
        ...result.headers,
        "Retry-After": String(result.retryAfterSeconds),
      },
    }
  );
}
