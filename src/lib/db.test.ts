import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

/**
 * Phase 0 smoke tests. The point here is the *boot contract*, not connectivity:
 * the app must serve static pages with MONGODB_URI unset, and only fail when a
 * DB-backed path is actually taken.
 *
 * Contrast with JWT_SECRET in Phase 3, which must fail at boot instead.
 */

const ORIGINAL_URI = process.env.MONGODB_URI;

beforeEach(() => {
  vi.resetModules();
});

afterEach(() => {
  if (ORIGINAL_URI === undefined) delete process.env.MONGODB_URI;
  else process.env.MONGODB_URI = ORIGINAL_URI;
});

describe("connectDB", () => {
  it("does not throw at import time when MONGODB_URI is unset", async () => {
    delete process.env.MONGODB_URI;
    await expect(import("./db")).resolves.toBeDefined();
  });

  it("throws a pointed error only when actually called", async () => {
    delete process.env.MONGODB_URI;
    const { connectDB } = await import("./db");
    await expect(connectDB()).rejects.toThrow(/MONGODB_URI is not set/);
  });

  it("reports configuration state without connecting", async () => {
    delete process.env.MONGODB_URI;
    const { isDatabaseConfigured } = await import("./db");
    expect(isDatabaseConfigured()).toBe(false);
  });
});
