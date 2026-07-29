import "server-only";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

/**
 * Rate limiting, backed by Upstash Redis.
 *
 * Optional by design: when the Upstash env vars are unset — as in local dev —
 * every check passes rather than erroring, so the app runs without a Redis. The
 * limits that matter for security (login) are still enforced wherever Upstash is
 * configured (production). See PLAN.md §10 for the full limit table; login is
 * the only one this phase wires.
 */

function makeRedis(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  return new Redis({ url, token });
}

const redis = makeRedis();

// 5 attempts per 15 minutes per IP — brute-force resistance without locking out
// a fat-fingered admin for long.
const loginLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, "15 m"),
      prefix: "rl:login",
      analytics: false,
    })
  : null;

/**
 * Returns true if the login attempt from `identifier` (an IP) is within the
 * limit. Always true when Upstash is not configured.
 */
export async function checkLoginRate(identifier: string): Promise<boolean> {
  if (!loginLimiter) return true;
  const { success } = await loginLimiter.limit(identifier);
  return success;
}
