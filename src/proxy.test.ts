import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

/**
 * proxy.ts behaviour with the limiter mocked, so the 429 path is verified
 * deterministically — no live Redis needed. (The live check is the curl loop
 * in the README/PR notes, run against a real Upstash.)
 */

const loginRetryAfter = vi.fn<(ip: string) => Promise<number | null>>();
vi.mock("@/lib/ratelimit", () => ({
  loginRetryAfter: (ip: string) => loginRetryAfter(ip),
}));

const { proxy } = await import("./proxy");

function req(path: string, init: { method?: string; headers?: Record<string, string> } = {}) {
  return new NextRequest(`http://localhost:3000${path}`, {
    method: init.method ?? "GET",
    headers: init.headers,
  });
}

beforeEach(() => {
  loginRetryAfter.mockReset();
  loginRetryAfter.mockResolvedValue(null);
});

describe("login throttle", () => {
  it("answers an exhausted login bucket with HTTP 429 and Retry-After", async () => {
    loginRetryAfter.mockResolvedValue(600);
    const res = await proxy(
      req("/admin/login", { method: "POST", headers: { "x-real-ip": "203.0.113.7" } }),
    );
    expect(res.status).toBe(429);
    expect(res.headers.get("retry-after")).toBe("600");
    expect(loginRetryAfter).toHaveBeenCalledWith("203.0.113.7");
  });

  it("lets a login POST through while attempts remain", async () => {
    const res = await proxy(req("/admin/login", { method: "POST" }));
    expect(res.status).not.toBe(429);
  });

  it("fails through (not 500) when Redis is unreachable — the action stays authoritative", async () => {
    loginRetryAfter.mockRejectedValue(new Error("fetch failed"));
    const res = await proxy(req("/admin/login", { method: "POST" }));
    expect(res.status).not.toBe(429);
    expect(res.headers.get("content-security-policy")).toBeTruthy();
  });

  it("never throttles a plain GET of the login page", async () => {
    loginRetryAfter.mockResolvedValue(600);
    const res = await proxy(req("/admin/login"));
    expect(res.status).not.toBe(429);
    expect(loginRetryAfter).not.toHaveBeenCalled();
  });
});

describe("admin gate", () => {
  it("redirects a cookieless request for an admin page to login", async () => {
    const res = await proxy(req("/admin/posts"));
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("http://localhost:3000/admin/login");
  });

  it("does not gate public pages", async () => {
    const res = await proxy(req("/about"));
    expect(res.headers.get("location")).toBeNull();
  });
});

describe("content security policy", () => {
  function nonceOf(csp: string | null): string | undefined {
    return csp?.match(/'nonce-([^']+)'/)?.[1];
  }

  it("enforces (not report-only) a nonce-based policy", async () => {
    const res = await proxy(req("/"));
    const csp = res.headers.get("content-security-policy");
    expect(csp).toContain("'strict-dynamic'");
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("frame-src https://www.youtube-nocookie.com");
    expect(res.headers.get("content-security-policy-report-only")).toBeNull();
    expect(nonceOf(csp)).toBeTruthy();
  });

  it("mints a fresh nonce for every request", async () => {
    const a = nonceOf((await proxy(req("/"))).headers.get("content-security-policy"));
    const b = nonceOf((await proxy(req("/"))).headers.get("content-security-policy"));
    expect(a).not.toBe(b);
  });
});
