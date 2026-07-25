import { describe, it, expect } from "vitest";
import { planSearch, mergeById } from "./query";

describe("planSearch — routing", () => {
  it("routes a bare flag to an exact token match only", () => {
    // The headline requirement. `$text` would read the leading dash as
    // negation, so this MUST take the token path.
    expect(planSearch("-oN")).toEqual({
      clauses: [{ searchTokens: "-oN" }],
      strategy: "token",
    });
  });

  it("routes a long flag to the token path", () => {
    expect(planSearch("--script")).toEqual({
      clauses: [{ searchTokens: "--script" }],
      strategy: "token",
    });
  });

  it("routes multi-word prose to $text only", () => {
    expect(planSearch("port scanning basics")).toEqual({
      clauses: [{ $text: { $search: "port scanning basics" } }],
      strategy: "text",
    });
  });

  it("routes a single bare word to BOTH paths", () => {
    // "nmap" could be an exact tool name in searchTokens or a word in prose.
    expect(planSearch("nmap")).toEqual({
      clauses: [{ searchTokens: "nmap" }, { $text: { $search: "nmap" } }],
      strategy: "both",
    });
  });

  it("keeps flags out of the $text clause when mixing flags and words", () => {
    // Leaving `--script` in the text search would negate the word "script".
    // The text clause must contain only the word tokens.
    expect(planSearch("nmap --script")).toEqual({
      clauses: [
        { searchTokens: "--script" },
        { $text: { $search: "nmap" } },
      ],
      strategy: "both",
    });
  });

  it("matches several flags at once", () => {
    expect(planSearch("-sC -sV")).toEqual({
      clauses: [{ searchTokens: "-sC" }, { searchTokens: "-sV" }],
      strategy: "token",
    });
  });

  it("returns null for an empty or whitespace query", () => {
    expect(planSearch("")).toBeNull();
    expect(planSearch("   ")).toBeNull();
  });

  it("normalises surrounding and internal whitespace", () => {
    expect(planSearch("  port   scanning  ")).toEqual({
      clauses: [{ $text: { $search: "port scanning" } }],
      strategy: "text",
    });
  });
});

describe("mergeById", () => {
  const a = { _id: "1", title: "a" };
  const b = { _id: "2", title: "b" };
  const c = { _id: "3", title: "c" };

  it("concatenates and de-duplicates by _id", () => {
    expect(mergeById([[a, b], [b, c]])).toEqual([a, b, c]);
  });

  it("keeps the first occurrence, so token hits outrank text hits", () => {
    // Same doc from both paths: the token-path copy (passed first) wins its slot.
    const fromToken = { _id: "1", title: "token" };
    const fromText = { _id: "1", title: "text" };
    expect(mergeById([[fromToken], [fromText]])).toEqual([fromToken]);
  });

  it("handles empty lists", () => {
    expect(mergeById([[], []])).toEqual([]);
  });

  it("coerces non-string ids for comparison", () => {
    expect(mergeById([[{ _id: 1 }], [{ _id: 1 }]])).toEqual([{ _id: 1 }]);
  });
});
