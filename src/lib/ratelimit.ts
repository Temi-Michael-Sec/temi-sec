import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

/**
 * Rate limiting, backed by Upstash Redis — a store SHARED across every Vercel
 * function instance. (An in-memory counter would reset per cold start and be
 * split across concurrent instances, so it would never actually throttle on
 * Vercel.)
 *
 * Login is enforced in two places that cooperate rather than double-count:
 *   - the login Server Action calls `checkLoginRate`, which CONSUMES one token.
 *     It is the authoritative check: a Server Action can be invoked by its id
 *     from any route, so a path-scoped proxy check alone could be bypassed.
 *   - proxy.ts calls `loginRetryAfter`, a read-only PEEK, and answers an
 *     exhausted bucket with a real HTTP 429 before the action even runs.
 *
 * Deliberately no `import "server-only"`: proxy.ts imports this module, and the
 * proxy isn't compiled with the react-server condition that package requires.
 * Nothing here can leak to a browser — UPSTASH_* aren't NEXT_PUBLIC vars, so a
 * client bundle would see them undefined and get a null limiter.
 */

const LOGIN_LIMIT = 5;
const LOGIN_WINDOW = "15 m";

function makeRedis(): Redis | null {
  // UPSTASH_* when the keys are pasted in by hand; KV_REST_API_* is what
  // Vercel's Upstash Marketplace integration injects automatically. Accepting
  // both means re-provisioning through Vercel needs no code or env renaming.
  const url = process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
  const token =
    process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;
  if (!url || !token) return null;
  return new Redis({ url, token });
}

const redis = makeRedis();

// 5 attempts per 15 minutes per IP — brute-force resistance without locking out
// a fat-fingered admin for long.
const loginLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(LOGIN_LIMIT, LOGIN_WINDOW),
      prefix: "rl:login",
      analytics: false,
    })
  : null;

/**
 * What to do when no limiter exists because the Upstash env vars are missing.
 *
 * Fail CLOSED: refuse the login. A deploy that lost its Redis config must not
 * quietly drop brute-force protection, and for a single-admin site a refused
 * login costs far less than an unthrottled one. The user-facing message reads
 * "too many attempts", so log the real cause where it will be seen (Vercel's
 * function logs) rather than leave it to be guessed.
 */
function allowWhenUnconfigured(): boolean {
  console.error(
    "[ratelimit] Login refused: Upstash is not configured. Set " +
      "UPSTASH_REDIS_REST_URL/TOKEN (or KV_REST_API_URL/TOKEN).",
  );
  return false;
}

/**
 * Consumes one login attempt for `identifier` (an IP). Returns true if the
 * attempt is within the limit.
 */
export async function checkLoginRate(identifier: string): Promise<boolean> {
  if (!loginLimiter) return allowWhenUnconfigured();
  const { success } = await loginLimiter.limit(identifier);
  return success;
}

/**
 * Read-only: if `identifier` has no login attempts left, the number of seconds
 * until the window frees one up (for a Retry-After header); otherwise null.
 * Uses getRemaining, which does NOT consume a token.
 */
export async function loginRetryAfter(
  identifier: string,
): Promise<number | null> {
  if (!loginLimiter) return null;
  const { remaining, reset } = await loginLimiter.getRemaining(identifier);
  if (remaining > 0) return null;
  return Math.max(1, Math.ceil((reset - Date.now()) / 1000));
}
