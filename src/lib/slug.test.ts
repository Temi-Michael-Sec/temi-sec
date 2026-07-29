import { describe, it, expect } from "vitest";
import { slugify, isValidSlug } from "./slug";

describe("slugify", () => {
  it("lowercases and hyphenates", () => {
    expect(slugify("Hello World")).toBe("hello-world");
  });
  it("strips accents", () => {
    expect(slugify("Café Crème")).toBe("cafe-creme");
  });
  it("collapses punctuation and trims edges", () => {
    expect(slugify("  --Nmap: -sV scan!!  ")).toBe("nmap-sv-scan");
  });
  it("always produces a valid slug", () => {
    expect(isValidSlug(slugify("A B C 1 2"))).toBe(true);
    expect(isValidSlug(slugify("Privilege Escalation — Linux"))).toBe(true);
  });
});

describe("isValidSlug", () => {
  it("accepts lowercase-hyphenated slugs", () => {
    expect(isValidSlug("a-b-c1")).toBe(true);
  });
  it("rejects malformed slugs", () => {
    expect(isValidSlug("-x")).toBe(false);
    expect(isValidSlug("a--b")).toBe(false);
    expect(isValidSlug("Abc")).toBe(false);
    expect(isValidSlug("a_b")).toBe(false);
  });
});
