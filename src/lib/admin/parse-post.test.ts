import { describe, it, expect } from "vitest";
import { parsePostForm } from "./parse-post";

function form(entries: [string, string][]): FormData {
  const f = new FormData();
  for (const [k, v] of entries) f.append(k, v);
  return f;
}

describe("parsePostForm — base fields", () => {
  it("requires a title", () => {
    const r = parsePostForm("article", form([["body", "x"]]));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors.title).toBeDefined();
  });

  it("parses a valid article and splits tags", () => {
    const r = parsePostForm(
      "article",
      form([
        ["title", "Hello"],
        ["tags", "web, appsec ,, xss"],
        ["body", "content"],
      ]),
    );
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.title).toBe("Hello");
      expect(r.data.tags).toEqual(["web", "appsec", "xss"]);
      expect(r.data.body).toBe("content");
    }
  });

  it("rejects a malformed slug", () => {
    const r = parsePostForm(
      "article",
      form([
        ["title", "Hi"],
        ["slug", "Not A Slug"],
      ]),
    );
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors.slug).toBeDefined();
  });

  it("parses references (Title | URL per line), dropping incomplete rows", () => {
    const r = parsePostForm(
      "article",
      form([
        ["title", "X"],
        [
          "references",
          "OWASP XSS | https://owasp.org/xss\nno url here\nNVD | https://nvd.nist.gov/1",
        ],
      ]),
    );
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.references).toHaveLength(2);
      expect(r.data.references[0]).toMatchObject({
        title: "OWASP XSS",
        url: "https://owasp.org/xss",
      });
      expect(r.data.references[0].accessedAt).toBeInstanceOf(Date);
    }
  });
});

describe("parsePostForm — type-specific", () => {
  it("enforces required selects and validates enum membership", () => {
    const r = parsePostForm(
      "ctf",
      form([
        ["title", "Box"],
        ["boxName", "Blue"],
        ["platform", "not-a-platform"],
        ["difficulty", "easy"],
        ["os", "linux"],
      ]),
    );
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors.platform).toBeDefined();
  });

  it("parses a ctf with multiselect and checkbox", () => {
    const f = form([
      ["title", "Box"],
      ["boxName", "Blue"],
      ["platform", "hackthebox"],
      ["difficulty", "easy"],
      ["os", "linux"],
      ["retired", "on"],
    ]);
    f.append("categories", "web");
    f.append("categories", "pwn");
    const r = parsePostForm("ctf", f);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.typeFields.retired).toBe(true);
      expect(r.data.typeFields.categories).toEqual(["web", "pwn"]);
    }
  });

  it("parses tool cheatsheet lines and builds the token source", () => {
    const r = parsePostForm(
      "tool",
      form([
        ["title", "nmap"],
        ["toolName", "nmap"],
        ["toolCategory", "recon"],
        ["cheatsheet", "nmap -sV target | version scan\nnmap -p- host | all ports"],
      ]),
    );
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.typeFields.cheatsheet).toEqual([
        { command: "nmap -sV target", description: "version scan" },
        { command: "nmap -p- host", description: "all ports" },
      ]);
      expect(r.data.tokenSource?.toolName).toBe("nmap");
    }
  });
});
