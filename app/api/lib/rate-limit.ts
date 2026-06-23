import type { MiddlewareHandler } from "hono";

// Simple in-memory rate limiter. For production with multiple instances,
// replace this with Redis or a shared store.
interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

function getClientIp(c: {
  req: { header: (name: string) => string | undefined; raw: Request };
}): string {
  const forwarded = c.req.header("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return "unknown";
}

export function rateLimit(options?: {
  windowMs?: number;
  maxRequests?: number;
}): MiddlewareHandler {
  const windowMs = options?.windowMs ?? 60_000;
  const maxRequests = options?.maxRequests ?? 100;

  return async (c, next) => {
    const key = getClientIp(c);
    const now = Date.now();

    const entry = store.get(key);
    if (entry && entry.resetAt > now) {
      if (entry.count >= maxRequests) {
        return c.json(
          { error: "Too many requests. Please try again later." },
          429,
        );
      }
      entry.count++;
    } else {
      store.set(key, { count: 1, resetAt: now + windowMs });
    }

    c.res.headers.set("X-RateLimit-Limit", String(maxRequests));
    const current = store.get(key);
    c.res.headers.set(
      "X-RateLimit-Remaining",
      String(Math.max(0, maxRequests - (current?.count ?? 0))),
    );

    await next();
  };
}
