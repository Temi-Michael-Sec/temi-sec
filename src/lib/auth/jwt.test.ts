import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

/**
 * Session JWT contract, including the fail-at-boot rule: importing the auth
 * crypto with no JWT_SECRET must throw at import (contrast MONGODB_URI, which is
 * lazy — see db.test.ts). Uses resetModules + dynamic import so each case gets a
 * fresh module with a fresh secret capture.
 */

const ORIGINAL = process.env.JWT_SECRET;
const SECRET = "a-test-secret-at-least-32-chars-long!!";

beforeEach(() => vi.resetModules());
afterEach(() => {
  if (ORIGINAL === undefined) delete process.env.JWT_SECRET;
  else process.env.JWT_SECRET = ORIGINAL;
});

describe("session jwt", () => {
  it("throws at import time when JWT_SECRET is unset", async () => {
    delete process.env.JWT_SECRET;
    await expect(import("./jwt")).rejects.toThrow(/JWT_SECRET/);
  });

  it("round-trips a valid session", async () => {
    process.env.JWT_SECRET = SECRET;
    const { signSession, verifySession } = await import("./jwt");
    const token = await signSession({
      userId: "1",
      email: "a@b.co",
      role: "admin",
    });
    expect(await verifySession(token)).toMatchObject({
      userId: "1",
      email: "a@b.co",
      role: "admin",
    });
  });

  it("rejects tampered, empty and malformed tokens", async () => {
    process.env.JWT_SECRET = SECRET;
    const { signSession, verifySession } = await import("./jwt");
    const token = await signSession({
      userId: "1",
      email: "a@b.co",
      role: "admin",
    });
    expect(await verifySession(`${token}x`)).toBeNull();
    expect(await verifySession(undefined)).toBeNull();
    expect(await verifySession("not.a.jwt")).toBeNull();
  });

  it("rejects a token signed with a different secret", async () => {
    process.env.JWT_SECRET = SECRET;
    const first = await import("./jwt");
    const token = await first.signSession({
      userId: "1",
      email: "a@b.co",
      role: "admin",
    });

    vi.resetModules();
    process.env.JWT_SECRET = "a-completely-different-secret-32-chars!";
    const second = await import("./jwt");
    expect(await second.verifySession(token)).toBeNull();
  });
});
