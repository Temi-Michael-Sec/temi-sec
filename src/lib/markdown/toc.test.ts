import { describe, it, expect } from "vitest";
import { extractToc } from "./toc";
import { renderMarkdown } from "./render";

describe("extractToc", () => {
  it("returns an empty list for empty input", () => {
    expect(extractToc("")).toEqual([]);
    expect(extractToc("   \n  ")).toEqual([]);
  });

  it("collects h2 and h3 with real slug ids", () => {
    const toc = extractToc("## Enumeration\n\ntext\n\n### Nmap Scan\n\nmore");
    expect(toc).toEqual([
      { id: "enumeration", text: "Enumeration", level: 2 },
      { id: "nmap-scan", text: "Nmap Scan", level: 3 },
    ]);
  });

  it("ignores the h1 title and h4+ noise", () => {
    const toc = extractToc(
      "# Title\n\n## Section\n\n#### Too Deep\n\n##### Deeper",
    );
    expect(toc).toEqual([{ id: "section", text: "Section", level: 2 }]);
  });

  it("does NOT treat a # inside a code fence as a heading", () => {
    // The whole reason this reads the rendered tree and not the source. A bash
    // comment must never appear in the table of contents.
    const md = [
      "## Real Heading",
      "",
      "```bash",
      "# this is a shell comment, not a heading",
      "nmap -sV target",
      "```",
      "",
      "### Another Real One",
    ].join("\n");

    const toc = extractToc(md);
    expect(toc).toEqual([
      { id: "real-heading", text: "Real Heading", level: 2 },
      { id: "another-real-one", text: "Another Real One", level: 3 },
    ]);
    expect(toc.some((t) => t.text.includes("shell comment"))).toBe(false);
  });

  it("deduplicates repeated headings the same way rehype-slug does", () => {
    const toc = extractToc("## Setup\n\n### Setup\n\n## Setup");
    expect(toc.map((t) => t.id)).toEqual(["setup", "setup-1", "setup-2"]);
  });

  it("reads heading text through inline formatting", () => {
    const toc = extractToc("## Using `nmap` and **burp**");
    expect(toc[0].text).toBe("Using nmap and burp");
    expect(toc[0].id).toBe("using-nmap-and-burp");
  });

  it("handles non-ASCII headings without producing an empty id", () => {
    const toc = extractToc("## Café findings 你好");
    expect(toc).toHaveLength(1);
    expect(toc[0].id.length).toBeGreaterThan(0);
    expect(toc[0].text).toBe("Café findings 你好");
  });

  it("does not pick up a heading synthesised inside a directive body wrongly", () => {
    // Directives run in both pipelines; a heading inside a callout is a real
    // rendered heading and should appear.
    const toc = extractToc(":::note\n## Inside Callout\n:::");
    expect(toc).toEqual([
      { id: "inside-callout", text: "Inside Callout", level: 2 },
    ]);
  });
});

describe("extractToc ↔ renderMarkdown (drift guard)", () => {
  // If the two pipelines ever diverge, the ids will stop matching and this
  // fails. That is the safety net for keeping toc.ts and render.ts in step.
  const doc = [
    "# Title",
    "",
    "## Initial Enumeration",
    "",
    "```bash",
    "# not a heading",
    "nmap -sC -sV 10.10.10.1",
    "```",
    "",
    "### Port 80",
    "",
    "## Foothold",
    "",
    "### Foothold", // duplicate on purpose → foothold-1
    "",
    "## Privilege Escalation",
  ].join("\n");

  it("produces ids that all exist as anchors in the rendered HTML", async () => {
    const toc = extractToc(doc);
    const html = await renderMarkdown(doc);

    expect(toc.length).toBeGreaterThan(0);
    for (const entry of toc) {
      expect(html, `id "${entry.id}" missing from HTML`).toContain(
        `id="${entry.id}"`,
      );
    }
  });

  it("includes the duplicate-suffixed id from the real render", async () => {
    const toc = extractToc(doc);
    const html = await renderMarkdown(doc);
    expect(toc.map((t) => t.id)).toContain("foothold-1");
    expect(html).toContain('id="foothold-1"');
  });
});
