import { describe, it, expect } from "vitest";
import {
  formatDate,
  formatDateShort,
  isoDate,
  readingLabel,
  externalLink,
} from "./format";

describe("date formatting", () => {
  it("formats a date stably in UTC", () => {
    expect(formatDate("2026-07-26T00:00:00Z")).toBe("Jul 26, 2026");
  });

  it("short form drops the year", () => {
    expect(formatDateShort("2026-07-26T00:00:00Z")).toBe("Jul 26");
  });

  it("returns empty string for null", () => {
    expect(formatDate(null)).toBe("");
    expect(formatDateShort(null)).toBe("");
    expect(isoDate(null)).toBe("");
  });

  it("isoDate round-trips", () => {
    expect(isoDate("2026-07-26T12:00:00Z")).toBe("2026-07-26T12:00:00.000Z");
  });
});

describe("readingLabel", () => {
  it("floors at 1 minute", () => {
    expect(readingLabel(0)).toBe("1 min read");
    expect(readingLabel(undefined)).toBe("1 min read");
  });
  it("passes through real values", () => {
    expect(readingLabel(5)).toBe("5 min read");
  });
});

describe("externalLink", () => {
  it("accepts a full https URL", () => {
    expect(externalLink("https://nmap.org")).toEqual({
      href: "https://nmap.org/",
      host: "nmap.org",
    });
  });

  it("tolerates a missing scheme by trying https", () => {
    // The bug this guards: new URL('nmap.org') throws and 500s the page.
    expect(externalLink("nmap.org")).toEqual({
      href: "https://nmap.org/",
      host: "nmap.org",
    });
  });

  it("rejects a javascript: URL — it must never become a link", () => {
    expect(externalLink("javascript:alert(1)")).toBeNull();
  });

  it("rejects data: and other non-http schemes", () => {
    expect(externalLink("data:text/html,<script>alert(1)</script>")).toBeNull();
    expect(externalLink("ftp://example.com")).toBeNull();
  });

  it("returns null for empty/nullish input", () => {
    expect(externalLink("")).toBeNull();
    expect(externalLink(null)).toBeNull();
    expect(externalLink(undefined)).toBeNull();
  });
});
