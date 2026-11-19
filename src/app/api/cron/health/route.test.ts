import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const pingRedis = vi.fn<() => Promise<void>>();
const adminPing = vi.fn<() => Promise<unknown>>();

vi.mock("@/lib/ratelimit", () => ({ pingRedis: () => pingRedis() }));
vi.mock("@/lib/db", () => ({
  connectDB: async () => ({
    connection: { db: { admin: () => ({ ping: () => adminPing() }) } },
  }),
}));

const { GET } = await import("./route");

const SECRET = "test-cron-secret-0123456789abcdef";
const call = (auth?: string) =>
  GET(
    new Request("http://localhost/api/cron/health", {
      headers: auth ? { authorization: auth } : {},
    }),
  );

beforeEach(() => {
  vi.stubEnv("CRON_SECRET", SECRET);
  pingRedis.mockReset().mockResolvedValue(undefined);
  adminPing.mockReset().mockResolvedValue({ ok: 1 });
  vi.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("GET /api/cron/health", () => {
  it("fails closed when CRON_SECRET is not configured", async () => {
    vi.stubEnv("CRON_SECRET", "");
    const res = await call(`Bearer ${SECRET}`);
    expect(res.status).toBe(500);
    expect(pingRedis).not.toHaveBeenCalled();
  });

  it("rejects a missing or wrong token without touching the databases", async () => {
    expect((await call()).status).toBe(401);
    expect((await call("Bearer wrong")).status).toBe(401);
    expect(pingRedis).not.toHaveBeenCalled();
    expect(adminPing).not.toHaveBeenCalled();
  });

  it("returns 200 when both Redis and MongoDB answer", async () => {
    const res = await call(`Bearer ${SECRET}`);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      ok: true,
      checks: { redis: "ok", mongo: "ok" },
    });
  });

  it("returns 503 naming the failed dependency, without leaking the error", async () => {
    pingRedis.mockRejectedValue(new Error("getaddrinfo ENOTFOUND secret-host"));
    const res = await call(`Bearer ${SECRET}`);
    expect(res.status).toBe(503);
    const body = await res.json();
    expect(body.checks).toEqual({ redis: "fail", mongo: "ok" });
    expect(JSON.stringify(body)).not.toContain("secret-host");
  });
});
