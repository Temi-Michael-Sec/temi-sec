import { describe, it, expect } from "vitest";
import {
  FRAMEWORKS,
  PLATFORMS,
  DIFFICULTIES,
  CTF_CATEGORIES,
  TOOL_CATEGORIES,
  OPERATING_SYSTEMS,
  facetBySlug,
  labelOf,
  slugsOf,
  type Facet,
} from "./taxonomy";

const ALL: [string, readonly Facet[]][] = [
  ["FRAMEWORKS", FRAMEWORKS],
  ["PLATFORMS", PLATFORMS],
  ["DIFFICULTIES", DIFFICULTIES],
  ["CTF_CATEGORIES", CTF_CATEGORIES],
  ["TOOL_CATEGORIES", TOOL_CATEGORIES],
  ["OPERATING_SYSTEMS", OPERATING_SYSTEMS],
];

describe.each(ALL)("%s", (_name, facets) => {
  it("has unique slugs", () => {
    const slugs = facets.map((f) => f.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("uses URL-safe lowercase slugs", () => {
    for (const f of facets) {
      expect(f.slug).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
    }
  });

  it("has a non-empty label", () => {
    for (const f of facets) expect(f.label.trim().length).toBeGreaterThan(0);
  });

  // The blurb is the facet page's meta description. Search engines truncate
  // around 160 characters, and a one-word blurb makes the page a bare list —
  // which is the thing having facet pages at all is meant to avoid.
  it("has a blurb long enough to work as a meta description", () => {
    for (const f of facets) {
      expect(f.blurb.trim().length, `${f.slug} blurb`).toBeGreaterThan(40);
    }
  });
});

describe("lookup helpers", () => {
  it("finds a facet by slug", () => {
    expect(facetBySlug(FRAMEWORKS, "iso-27001")?.label).toBe("ISO/IEC 27001");
  });

  it("returns undefined for an unknown slug so callers can 404", () => {
    expect(facetBySlug(FRAMEWORKS, "iso27001")).toBeUndefined();
  });

  it("falls back to the slug rather than rendering blank", () => {
    expect(labelOf(FRAMEWORKS, "does-not-exist")).toBe("does-not-exist");
  });

  it("extracts slugs for enum validation", () => {
    expect(slugsOf(DIFFICULTIES)).toEqual(["easy", "medium", "hard", "insane"]);
  });
});
