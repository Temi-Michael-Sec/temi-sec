import { createHash, timingSafeEqual } from "node:crypto";
import { connectDB } from "@/lib/db";
import { pingRedis } from "@/lib/ratelimit";

/**
 * Daily health check, run by Vercel Cron (see vercel.json).
 *
 * Two jobs in one request:
 *   - KEEP-ALIVE: free-tier Upstash and Atlas delete/pause a database that
 *     sees no traffic. Redis is otherwise only touched at admin login, so a
 *     quiet month would take it (and with it, admin login) down. A daily
 *     round-trip to each keeps both active.
 *   - MONITORING: if either is unreachable the route returns 503, so the run
 *     shows as failed in Vercel's cron logs the same day — not the next time
 *     you try to log in.
 *
 * Only Vercel's scheduler may call it: Vercel sends
 * `Authorization: Bearer <CRON_SECRET>` when that env var is set.
 */

export const dynamic = "force-dynamic";

type CheckResult = "ok" | "fail";

/** Constant-time comparison. Hashing first makes the lengths equal, which
 *  timingSafeEqual requires, without leaking the secret's length. */
function tokenMatches(given: string, expected: string): boolean {
  const a = createHash("sha256").update(given).digest();
  const b = createHash("sha256").update(expected).digest();
  return timingSafeEqual(a, b);
}

async function pingMongo(): Promise<void> {
  const conn = await connectDB();
  const db = conn.connection.db;
  if (!db) throw new Error("MongoDB connection has no db handle");
  await db.admin().ping();
}

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  // Fail closed: with no secret configured the endpoint would be open to anyone
  // who wants to make the site hammer its own databases.
  if (!secret) {
    console.error("[health] CRON_SECRET is not set; refusing to run.");
    return Response.json({ ok: false }, { status: 500 });
  }

  const auth = request.headers.get("authorization") ?? "";
  if (!tokenMatches(auth, `Bearer ${secret}`)) {
    return new Response(null, { status: 401 });
  }

  const [redis, mongo] = await Promise.allSettled([pingRedis(), pingMongo()]);
  const checks: Record<"redis" | "mongo", CheckResult> = {
    redis: redis.status === "fulfilled" ? "ok" : "fail",
    mongo: mongo.status === "fulfilled" ? "ok" : "fail",
  };

  // Details go to the server log only; the response says WHICH failed, not why.
  if (redis.status === "rejected") console.error("[health] redis:", redis.reason);
  if (mongo.status === "rejected") console.error("[health] mongo:", mongo.reason);

  const ok = checks.redis === "ok" && checks.mongo === "ok";
  return Response.json({ ok, checks }, { status: ok ? 200 : 503 });
}
