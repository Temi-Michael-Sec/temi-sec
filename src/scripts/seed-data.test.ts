import { describe, it, expect } from "vitest";
import mongoose from "mongoose";
import { seeds } from "./seed-data";
import { extractSearchTokens } from "../lib/search/tokens";

/**
 * Validates the seed content against the real schemas WITHOUT a database, so a
 * typo'd enum (a bad platform slug, an unknown framework) fails here in CI
 * rather than on the first `npm run seed` against a live Atlas cluster.
 */

async function errorsOf(doc: {
  validate: () => Promise<void>;
}): Promise<Record<string, unknown>> {
  try {
    await doc.validate();
    return {};
  } catch (err) {
    return (err as mongoose.Error.ValidationError).errors ?? {};
  }
}

describe("seed data", () => {
  it("has a unique slug per entry", () => {
    const slugs = seeds.map((s) => s.doc.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("covers all six content types", () => {
    // The seed exists so Phase 2 can render every shape. If one is dropped,
    // that's a gap worth failing on.
    const types = seeds.map((s) => s.model.modelName).sort();
    expect(types).toEqual(
      ["article", "ctf", "glossary", "note", "policy", "tool"].sort(),
    );
  });

  it.each(seeds.map((s) => [s.doc.slug, s] as const))(
    "validates against its schema: %s",
    async (_slug, entry) => {
      const doc = new entry.model({
        ...entry.doc,
        body: entry.body,
        excerpt: entry.excerpt,
        status: "published",
        publishedAt: new Date(),
        lastReviewedAt: new Date(),
        checklistAcceptedAt: new Date(),
      });
      expect(await errorsOf(doc)).toEqual({});
    },
  );

  it("makes the nmap flag -oN searchable, tying the seed to the search design", () => {
    // The whole point of searchTokens. If this breaks, `-oN` won't find nmap.
    const tool = seeds.find((s) => s.doc.slug === "nmap");
    expect(tool?.tokenSource).toBeDefined();
    const tokens = extractSearchTokens(tool!.tokenSource!);
    expect(tokens).toContain("nmap");
    expect(tokens).toContain("-oN");
  });
});
