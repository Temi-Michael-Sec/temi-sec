import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { ResponseCookies } from "next/dist/server/web/spec-extension/cookies";

/**
 * The production session cookie must satisfy the browser-enforced `__Host-`
 * prefix rules on EVERY Set-Cookie for that name — including the one that
 * deletes it. A delete missing `Secure` is silently dropped by the browser, so
 * logout would leave a valid session behind. These tests assert the actual
 * serialized header, which is what the browser judges.
 */

let headers: Headers;
vi.mock("next/headers", () => ({
  cookies: async () => new ResponseCookies(headers),
}));

async function loadSessionInProduction() {
  vi.resetModules();
  vi.stubEnv("NODE_ENV", "production");
  vi.stubEnv("JWT_SECRET", "x".repeat(48));
  return import("./session");
}

function setCookieHeader(): string {
  return headers.get("set-cookie") ?? "";
}

describe("session cookie in production", () => {
  beforeEach(() => {
    headers = new Headers();
  });
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("is __Host- prefixed, Secure, HttpOnly, Path=/ and has no Domain", async () => {
    const { createSession } = await loadSessionInProduction();
    await createSession({ userId: "u1", email: "a@b.c", role: "admin" });

    const cookie = setCookieHeader();
    expect(cookie).toMatch(/^__Host-session=/);
    expect(cookie).toContain("Secure");
    expect(cookie).toContain("HttpOnly");
    expect(cookie).toContain("Path=/");
    expect(cookie).toContain("SameSite=strict");
    expect(cookie).not.toMatch(/Domain=/i);
  });

  it("expires on logout with the attributes the browser requires to accept it", async () => {
    const { deleteSession } = await loadSessionInProduction();
    await deleteSession();

    const cookie = setCookieHeader();
    expect(cookie).toMatch(/^__Host-session=;/);
    expect(cookie).toContain("Secure");
    expect(cookie).toContain("Path=/");
    expect(cookie).toContain("Max-Age=0");
    expect(cookie).not.toMatch(/Domain=/i);
  });
});
