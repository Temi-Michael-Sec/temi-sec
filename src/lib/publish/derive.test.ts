import { describe, it, expect } from "vitest";
import { deriveContent } from "./derive";

describe("deriveContent", () => {
  it("derives html, toc, reading time and tokens from one body", async () => {
    const body = "## Setup\n\nSome prose here.\n\n## Exploit\n\nMore prose.";
    const derived = await deriveContent(body, {
      toolName: "nmap",
      cheatsheet: [{ command: "nmap -sV target" }],
    });

    expect(derived.bodyHtml).toContain("<h2");
    expect(derived.toc.map((t) => t.text)).toEqual(["Setup", "Exploit"]);
    expect(derived.readingTime).toBeGreaterThanOrEqual(1);
    expect(derived.searchTokens).toContain("nmap");
    expect(derived.searchTokens).toContain("-sV");
  });

  it("yields no tokens without a token source", async () => {
    const derived = await deriveContent("plain body");
    expect(derived.searchTokens).toEqual([]);
  });

  // deriveContent is the ONLY producer of stored `bodyHtml` (create, update,
  // publish and seed all route through it), and PostBody injects that HTML as
  // trusted. So the sanitizer must run here — this pins it in place.
  it("sanitizes the stored html (the one write path PostBody trusts)", async () => {
    const body = [
      "<script>alert(1)</script>",
      '<img src=x onerror="alert(1)">',
      "[click](javascript:alert(1))",
      '<iframe src="https://evil.example"></iframe>',
    ].join("\n\n");
    const { bodyHtml } = await deriveContent(body);

    expect(bodyHtml).not.toMatch(/<script/i);
    expect(bodyHtml).not.toMatch(/onerror/i);
    expect(bodyHtml).not.toMatch(/javascript:/i);
    expect(bodyHtml).not.toMatch(/<iframe/i);
  });
});
