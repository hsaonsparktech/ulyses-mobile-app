import type { ServerResponse } from "node:http";
import { serverEnv } from "../config/env";
import { HttpError } from "../utils/problemDetails";
import type { RequestWithAuth } from "./auth";

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitRecord>();

export function resetRateLimits(): void {
  rateLimitStore.clear();
}

export function createRateLimiter(options: {
  maxRequests: number;
  windowMs: number;
  keyPrefix?: string;
}) {
  const { maxRequests, windowMs, keyPrefix = "global" } = options;

  return (
    req: RequestWithAuth,
    res: ServerResponse,
    next: () => void,
  ): void => {
    if (!serverEnv.RATE_LIMIT_ENABLED) {
      next();
      return;
    }

    const ip =
      (req.headers["x-forwarded-for"] as string) ||
      req.socket.remoteAddress ||
      "127.0.0.1";

    const key = `${keyPrefix}:${ip}`;
    const now = Date.now();
    let record = rateLimitStore.get(key);

    if (!record || now >= record.resetAt) {
      record = { count: 1, resetAt: now + windowMs };
      rateLimitStore.set(key, record);
    } else {
      record.count++;
    }

    const remaining = Math.max(0, maxRequests - record.count);
    const resetSeconds = Math.ceil((record.resetAt - now) / 1000);

    res.setHeader("X-RateLimit-Limit", maxRequests.toString());
    res.setHeader("X-RateLimit-Remaining", remaining.toString());
    res.setHeader("X-RateLimit-Reset", resetSeconds.toString());

    if (record.count > maxRequests) {
      res.setHeader("Retry-After", resetSeconds.toString());
      throw new HttpError(
        429,
        "Too Many Requests",
        `Rate limit exceeded. Maximum ${maxRequests} requests per ${Math.round(windowMs / 1000)} seconds.`,
      );
    }

    next();
  };
}
