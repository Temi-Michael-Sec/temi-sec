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
});
