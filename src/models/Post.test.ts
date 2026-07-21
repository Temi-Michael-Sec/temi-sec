import { describe, it, expect } from "vitest";
import mongoose from "mongoose";
import { Post, Ctf, Tool, Policy, Glossary, Note, Article } from "./Post";

/**
 * Schema-level tests. `validate()` runs the full validator chain without a
 * database connection, so these cover the contract without needing Atlas.
 *
 * What is deliberately NOT covered here: that the text index actually builds.
 * That needs a live connection, and it is the merge gate for `p1/models`.
 */

/**
 * Returns the field-keyed validation errors, or `{}` when the document is
 * valid. `validateSync()` would be terser but is deprecated for Mongoose 10.
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

function ctfDoc(overrides: Record<string, unknown> = {}) {
  return new Ctf({
    title: "Example Box",
    slug: "example-box",
    platform: "hackthebox",
    boxName: "Example",
    difficulty: "medium",
    os: "linux",
    ...overrides,
  });
}

describe("model registration", () => {
  it("registers the base and all six discriminators", () => {
    expect(Post.modelName).toBe("Post");
    for (const m of [Article, Ctf, Tool, Policy, Note, Glossary]) {
      expect(mongoose.models[m.modelName]).toBeDefined();
    }
  });

  it("shares one collection across every discriminator", () => {
    const names = [Article, Ctf, Tool, Policy, Note, Glossary].map(
      (m) => m.collection.name,
    );
    expect(new Set(names)).toEqual(new Set(["posts"]));
  });

  it("re-importing does not throw OverwriteModelError", async () => {
    // The hot-reload failure mode: Next re-executes module scope on save, and
    // a second mongoose.model() call for the same name throws.
    await expect(import("./Post")).resolves.toBeDefined();
  });
});

describe("indexes", () => {
  type IndexSpec = Record<string, unknown>;

  const declaredIndexes = () =>
    Post.schema.indexes() as unknown as [IndexSpec, IndexSpec][];

  const textIndexes = () =>
    declaredIndexes().filter(([fields]) =>
      Object.values(fields).some((v) => v === "text"),
    );

  it("declares exactly one text index, on the base schema", () => {
    // MongoDB permits one text index per collection. Because discriminators
    // share `posts`, a second one anywhere fails at index build — on deploy,
    // in production. This test is the tripwire.
    expect(textIndexes()).toHaveLength(1);
  });

  it("does not put command syntax in the text index", () => {
    // Command flags cannot survive text tokenization; searchTokens handles
    // them. If someone adds cheatsheet.command here, search silently degrades.
    const [[fields]] = textIndexes();
    expect(Object.keys(fields)).toEqual(["title", "excerpt", "body"]);
  });

  it("indexes searchTokens for exact matching", () => {
    const hasTokenIndex = declaredIndexes().some(
      ([fields]) => "searchTokens" in fields,
    );
    expect(hasTokenIndex).toBe(true);
  });
});

describe("base validation", () => {
  it("rejects a slug that is not URL-safe", async () => {
    const errors = await errorsOf(new Article({ title: "T", slug: "Not A Slug" }));
    expect(errors.slug).toBeDefined();
  });

  it("accepts a kebab-case slug", async () => {
    const errors = await errorsOf(new Article({ title: "T", slug: "a-real-slug" }));
    expect(errors.slug).toBeUndefined();
  });

  it("defaults status to draft, never published", () => {
    expect(new Article({ title: "T", slug: "s" }).status).toBe("draft");
  });

  it("defaults publishedAt and lastReviewedAt to null", () => {
    const doc = new Article({ title: "T", slug: "s" });
    expect(doc.publishedAt).toBeNull();
    expect(doc.lastReviewedAt).toBeNull();
  });
});

describe("ctf discriminator", () => {
  it("rejects a platform outside the controlled vocabulary", async () => {
    const errors = await errorsOf(ctfDoc({ platform: "HackTheBox" }));
    expect(errors.platform).toBeDefined();
  });

  it("rejects an unknown difficulty", async () => {
    const errors = await errorsOf(ctfDoc({ difficulty: "Medium" }));
    expect(errors.difficulty).toBeDefined();
  });

  it("accepts valid controlled values", async () => {
    expect(await errorsOf(ctfDoc())).toEqual({});
  });

  it("leaves `retired` undefined rather than defaulting it to false", () => {
    // The publish guard requires `retired === true`. Leaving this undefined is
    // what makes "nobody has confirmed this box is retired" a blocked state
    // rather than an implicitly-safe one.
    expect(ctfDoc().retired).toBeUndefined();
  });

  it("rejects a category outside the vocabulary", async () => {
    const errors = await errorsOf(
      ctfDoc({ categories: ["web", "Steganography"] }),
    );
    expect(errors["categories.1"] ?? errors.categories).toBeDefined();
  });
});

describe("tool discriminator", () => {
  it("rejects a tool category outside the vocabulary", async () => {
    const errors = await errorsOf(
      new Tool({
        title: "nmap",
        slug: "nmap",
        toolName: "nmap",
        toolCategory: "Recon",
      }),
    );
    expect(errors.toolCategory).toBeDefined();
  });

  it("accepts a cheatsheet of commands", async () => {
    const doc = new Tool({
      title: "nmap",
      slug: "nmap",
      toolName: "nmap",
      toolCategory: "recon",
      cheatsheet: [
        { command: "nmap -sC -sV -oN scan.txt", description: "Default scripts" },
      ],
    });
    expect(await errorsOf(doc)).toEqual({});
    expect(doc.cheatsheet[0].command).toContain("-oN");
  });
});

describe("policy discriminator", () => {
  it("rejects a framework outside the vocabulary", async () => {
    const errors = await errorsOf(
      new Policy({ title: "P", slug: "p", framework: "ISO27001" }),
    );
    expect(errors.framework).toBeDefined();
  });

  it("accepts a vocabulary slug", async () => {
    const errors = await errorsOf(
      new Policy({ title: "P", slug: "p", framework: "iso-27001" }),
    );
    expect(errors.framework).toBeUndefined();
  });
});

describe("glossary discriminator", () => {
  it("caps shortDef length", async () => {
    const errors = await errorsOf(
      new Glossary({
        title: "XSS",
        slug: "xss",
        term: "XSS",
        shortDef: "x".repeat(301),
      }),
    );
    expect(errors.shortDef).toBeDefined();
  });

  it("stores aliases for search and auto-linking", async () => {
    const doc = new Glossary({
      title: "XSS",
      slug: "xss",
      term: "XSS",
      aliases: ["Cross-Site Scripting"],
    });
    expect(await errorsOf(doc)).toEqual({});
    expect(doc.aliases).toContain("Cross-Site Scripting");
  });
});
