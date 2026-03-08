/**
 * In-memory sliding-window rate limiter for Next.js API routes.
 *
 * Usage:
 *   import { authRateLimit, dataRateLimit } from "@/middleware/rateLimiter";
 *
 *   export default async function handler(req, res) {
 *     const limited = await authRateLimit(req, res);
 *     if (limited) return;          // response already sent
 *     // ... normal handler logic
 *   }
 */
import { NextApiRequest, NextApiResponse } from "next";
import { env } from "@/lib/env";

interface RateLimitRecord {
  /** Timestamps (ms) of requests within the current window. */
  timestamps: number[];
}

/** Global store keyed by "<limit-name>:<identifier>". */
const store = new Map<string, RateLimitRecord>();

/**
 * Returns the client IP from a Next.js request, falling back gracefully when
 * running behind proxies (Vercel, Nginx, etc.).
 */
function getClientIp(req: NextApiRequest): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (forwarded) {
    return (Array.isArray(forwarded) ? forwarded[0] : forwarded)
      .split(",")[0]
      .trim();
  }
  return req.socket?.remoteAddress ?? "unknown";
}

interface RateLimiterOptions {
  /** Human-readable name used as part of the store key. */
  name: string;
  /** Maximum number of requests allowed in the window. */
  max: number;
  /** Window size in milliseconds. */
  windowMs: number;
}

/**
 * Core rate-limiter factory.
 * Returns a function that, when called inside an API handler, checks the
 * sliding window for the requesting IP and writes a 429 response if the
 * limit is exceeded.
 *
 * @returns `true` when the request is rate-limited (response already sent),
 *          `false` otherwise.
 */
function createRateLimiter(options: RateLimiterOptions) {
  const { name, max, windowMs } = options;

  return function rateLimit(
    req: NextApiRequest,
    res: NextApiResponse
  ): boolean {
    const ip = getClientIp(req);
    const key = `${name}:${ip}`;
    const now = Date.now();
    const windowStart = now - windowMs;

    let record = store.get(key);
    if (!record) {
      record = { timestamps: [] };
      store.set(key, record);
    }

    // Drop timestamps outside the current window (sliding window).
    record.timestamps = record.timestamps.filter((t) => t > windowStart);

    const remaining = max - record.timestamps.length;

    // Set informational headers before deciding whether to block.
    res.setHeader("X-RateLimit-Limit", max);
    res.setHeader("X-RateLimit-Remaining", Math.max(0, remaining - 1));
    res.setHeader(
      "X-RateLimit-Reset",
      Math.ceil((windowStart + windowMs) / 1000)
    );

    if (remaining <= 0) {
      const retryAfter = Math.ceil(
        (record.timestamps[0] + windowMs - now) / 1000
      );
      res.setHeader("Retry-After", retryAfter);
      res.status(429).json({
        error: "Too many requests. Please try again later.",
        retryAfter,
      });
      return true; // request is rate-limited
    }

    record.timestamps.push(now);
    return false; // request is allowed
  };
}

// ---------------------------------------------------------------------------
// Pre-configured limiters
// ---------------------------------------------------------------------------

/**
 * Strict limiter for authentication endpoints (login, register, logout).
 * Default: 10 requests / 60 s per IP.
 */
export const authRateLimit = createRateLimiter({
  name: "auth",
  max: env.RATE_LIMIT_AUTH_MAX,
  windowMs: env.RATE_LIMIT_WINDOW_MS,
});

/**
 * Moderate limiter for data endpoints (products, categories, suppliers).
 * Default: 100 requests / 60 s per IP.
 */
export const dataRateLimit = createRateLimiter({
  name: "data",
  max: env.RATE_LIMIT_DATA_MAX,
  windowMs: env.RATE_LIMIT_WINDOW_MS,
});
