import { describe, it, expect, vi, afterEach } from "vitest";

async function siteUrlFor(value: string) {
  vi.resetModules();
  vi.stubEnv("NEXT_PUBLIC_SITE_URL", value);
  return (await import("./seo")).SITE_URL;
}

describe("SITE_URL", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("strips trailing slashes so joined paths never double up", async () => {
    expect(await siteUrlFor("https://temi-sec.vercel.app/")).toBe(
      "https://temi-sec.vercel.app",
    );
    expect(await siteUrlFor("https://temi-sec.vercel.app//")).toBe(
      "https://temi-sec.vercel.app",
    );
  });

  it("leaves a slash-free value unchanged", async () => {
    expect(await siteUrlFor("https://temi-sec.vercel.app")).toBe(
      "https://temi-sec.vercel.app",
    );
  });
});
