import { describe, it, expect } from "vitest";
import { postHref, listHref, typeSegment } from "./routes";
import { CONTENT_TYPES } from "./taxonomy";

describe("routes", () => {
  it("maps each content type to its detail URL", () => {
    expect(postHref({ type: "article", slug: "x" })).toBe("/blog/x");
    expect(postHref({ type: "ctf", slug: "x" })).toBe("/ctf/x");
    expect(postHref({ type: "tool", slug: "nmap" })).toBe("/tools/nmap");
    expect(postHref({ type: "policy", slug: "x" })).toBe("/policies/x");
    expect(postHref({ type: "note", slug: "x" })).toBe("/notes/x");
    expect(postHref({ type: "glossary", slug: "xss" })).toBe("/glossary/xss");
  });

  it("maps each type to its listing URL", () => {
    expect(listHref("article")).toBe("/blog");
    expect(listHref("tool")).toBe("/tools");
  });

  it("has a segment for every content type (no gaps)", () => {
    // If a new content type is added without a route, this fails.
    for (const type of CONTENT_TYPES) {
      expect(typeSegment(type)).toBeTruthy();
    }
  });
});
