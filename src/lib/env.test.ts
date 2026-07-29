import { describe, it, expect, afterEach } from "vitest";
import { requireEnv, getJwtSecret } from "./env";

describe("requireEnv", () => {
  afterEach(() => delete process.env.__ENV_TEST);

  it("throws a pointed error for a missing var", () => {
    delete process.env.__ENV_TEST;
    expect(() => requireEnv("__ENV_TEST")).toThrow(/__ENV_TEST is not set/);
  });

  it("returns a set var", () => {
    process.env.__ENV_TEST = "value";
    expect(requireEnv("__ENV_TEST")).toBe("value");
  });
});

describe("getJwtSecret", () => {
  const original = process.env.JWT_SECRET;
  afterEach(() => {
    if (original === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = original;
  });

  it("throws when unset", () => {
    delete process.env.JWT_SECRET;
    expect(() => getJwtSecret()).toThrow(/JWT_SECRET is not set/);
  });

  it("throws when too short to be a safe key", () => {
    process.env.JWT_SECRET = "short";
    expect(() => getJwtSecret()).toThrow(/at least 32/);
  });

  it("returns a long-enough secret", () => {
    process.env.JWT_SECRET = "x".repeat(40);
    expect(getJwtSecret()).toHaveLength(40);
  });
});
