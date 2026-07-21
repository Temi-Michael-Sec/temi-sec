import { describe, it, expect } from "vitest";
import { renderMarkdown, markdownToPlainText } from "./render";
import { FORBIDDEN_TAGS } from "./sanitize-schema";

/**
 * ═════════════════════════════════════════════════════════════════════════════
 * These payloads run through the FULL `renderMarkdown()` pipeline, never
 * against the sanitizer schema in isolation.
 *
 * That distinction is the entire point. Both defects found in review lived at
 * the *seams* between pipeline stages — Shiki's inline styles being stripped by
 * a later sanitizer, and a directive emitting an `<iframe>` before sanitization
 * ever saw it. A test targeting `sanitize(html, schema)` directly would have
 * passed happily while both shipped.
 *
 * Equally important: the false-positive cases below. A sanitizer that deletes
 * everything passes every attack test and is useless. Legitimate content must
 * survive, and a code fence containing `<script>` must *display* as code.
 * ═════════════════════════════════════════════════════════════════════════════
 */

const XSS_PAYLOADS = [
  `<script>alert(1)</script>`,
  `<img src=x onerror=alert(1)>`,
  `<svg/onload=alert(1)>`,
  `<iframe src="https://evil.example"></iframe>`,
  `<iframe src="javascript:alert(1)"></iframe>`,
  `[click me](javascript:alert(1))`,
  `[click me](JaVaScRiPt:alert(1))`,
  `[click me](java\tscript:alert(1))`,
  `[click me](data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==)`,
  `![img](javascript:alert(1))`,
  `<a href="vbscript:alert(1)">x</a>`,
  `<object data="evil.swf"></object>`,
  `<embed src="evil.swf">`,
  `<base href="https://evil.example/">`,
  `<link rel="stylesheet" href="https://evil.example/x.css">`,
  `<meta http-equiv="refresh" content="0;url=https://evil.example">`,
  `<style>body{background:url('javascript:alert(1)')}</style>`,
  `<form action="https://evil.example"><button>go</button></form>`,
  `<div style="background:url(javascript:alert(1))">x</div>`,
  `<p onmouseover="alert(1)">hover</p>`,
  `<details open ontoggle=alert(1)>`,
  `<template><script>alert(1)</script></template>`,
  `<noscript><p title="</noscript><img src=x onerror=alert(1)>">`,
  `<math><mtext><table><mglyph><style><img src=x onerror=alert(1)>`,
  `<!--<img src=x onerror=alert(1)>-->`,
  `<xmp><script>alert(1)</script></xmp>`,
];

/** Live event-handler or dangerous-scheme syntax inside a real tag. */
function hasLiveHandlerOrScheme(html: string): boolean {
  const tags = html.match(/<[a-zA-Z][^>]*>/g) ?? [];
  return tags.some(
    (tag) =>
      /\son[a-z]+\s*=/i.test(tag) ||
      /(?:href|src|action|data|formaction)\s*=\s*["']?\s*(?:javascript|vbscript|data):/i.test(
        tag,
      ),
  );
}

describe("renderMarkdown — XSS payloads through the full pipeline", () => {
  it.each(XSS_PAYLOADS)("strips forbidden elements from: %s", async (payload) => {
    const html = await renderMarkdown(payload);
    for (const tag of FORBIDDEN_TAGS) {
      expect(html.toLowerCase(), `expected no <${tag}>`).not.toContain(`<${tag}`);
    }
  });

  it.each(XSS_PAYLOADS)("leaves no live handler or scheme in: %s", async (payload) => {
    expect(hasLiveHandlerOrScheme(await renderMarkdown(payload))).toBe(false);
  });
});

describe("renderMarkdown — legitimate content survives", () => {
  it("renders headings with stable IDs for the TOC", async () => {
    const html = await renderMarkdown("## Enumeration\n\ntext");
    expect(html).toMatch(/<h2[^>]*id="enumeration"/);
  });

  it("renders GFM tables", async () => {
    const html = await renderMarkdown("| a | b |\n|---|---|\n| 1 | 2 |");
    expect(html).toContain("<table>");
    expect(html).toContain("<td>1</td>");
  });

  it("renders GFM footnotes without remark-footnotes installed", async () => {
    // remark-gfm provides these. Installing remark-footnotes alongside it
    // would conflict — the reason it is deliberately absent.
    const html = await renderMarkdown("Claim.[^1]\n\n[^1]: Source.");
    expect(html).toContain("footnote");
  });

  it("keeps ordinary links and images", async () => {
    const html = await renderMarkdown(
      "[docs](https://example.com) ![shot](https://example.com/a.png)",
    );
    expect(html).toContain('href="https://example.com"');
    expect(html).toContain('src="https://example.com/a.png"');
  });

  it("allows mailto links", async () => {
    const html = await renderMarkdown("[mail](mailto:a@example.com)");
    expect(html).toContain("mailto:a@example.com");
  });
});

describe("renderMarkdown — code blocks", () => {
  it("highlights code, proving Shiki output survives sanitization", async () => {
    // The regression guard for defect #1: with Shiki ordered before the
    // sanitizer, `style` is stripped and this assertion fails.
    const html = await renderMarkdown("```bash\nnmap -sC -sV 10.10.10.1\n```");
    expect(html).toContain("<pre");
    expect(html).toMatch(/style="[^"]*--shiki/);
  });

  it("displays a script tag inside a fence as code, not markup", async () => {
    // The false-positive case. A security blog must be able to *show* a
    // payload. Escaped, but visible.
    const html = await renderMarkdown(
      "```html\n<script>alert(1)</script>\n```",
    );
    // No live element...
    expect(html).not.toContain("<script");
    // ...but the angle bracket is present as an escaped entity, and the word
    // is visible. Shiki tokenises, so `&#x3C;` and `script` land in separate
    // spans — asserting on the contiguous string would fail on correct output.
    expect(html).toContain("&#x3C;");
    expect(html).toMatch(/>script</);
    expect(html).toContain("<pre");
  });

  it("renders a fence with an unknown language rather than throwing", async () => {
    const html = await renderMarkdown("```notalanguage\nx = 1\n```");
    expect(html).toContain("<pre");
  });

  it("renders a fence with no language", async () => {
    const html = await renderMarkdown("```\nplain\n```");
    expect(html).toContain("<pre");
  });

  it("escapes HTML in inline code", async () => {
    const html = await renderMarkdown("use `<script>` carefully");
    expect(html).not.toMatch(/<script(?![^>]*>)/);
    expect(html).toContain("<code>");
  });
});

describe("renderMarkdown — directives", () => {
  it("renders a callout as a data attribute", async () => {
    const html = await renderMarkdown(":::warning\nOnly scan what you own.\n:::");
    expect(html).toContain('data-callout="warning"');
    expect(html).toContain("Only scan what you own.");
  });

  it("renders each callout variant", async () => {
    for (const v of ["note", "tip", "warning", "danger"]) {
      const html = await renderMarkdown(`:::${v}\nbody\n:::`);
      expect(html).toContain(`data-callout="${v}"`);
    }
  });

  it("renders a spoiler with its title", async () => {
    const html = await renderMarkdown(
      ':::spoiler{title="Root flag"}\nsteps\n:::',
    );
    expect(html).toContain("data-spoiler");
    expect(html).toContain("Root flag");
  });

  it("renders a flag as a redacted marker with no content", async () => {
    const html = await renderMarkdown("::flag[user]");
    expect(html).toContain('data-flag="user"');
    // Children are dropped so the directive cannot carry a real flag value.
    expect(html).toMatch(/<span[^>]*data-flag="user"[^>]*>\s*<\/span>/);
  });

  it("rejects a flag label that is not a short identifier", async () => {
    const html = await renderMarkdown("::flag[HTB{real_flag_here}]");
    expect(html).not.toContain("HTB{");
    expect(html).toContain("data-directive-error");
  });

  it("renders a valid YouTube ID as a data attribute, never an iframe", async () => {
    // The regression guard for defect #2.
    const html = await renderMarkdown("::youtube[dQw4w9WgXcQ]");
    expect(html).toContain('data-youtube-id="dQw4w9WgXcQ"');
    expect(html).not.toContain("<iframe");
  });

  it.each([
    "::youtube[../../etc/passwd]",
    '::youtube[x" onerror="alert(1)]',
    "::youtube[https://evil.example/x]",
    "::youtube[short]",
    "::youtube[waytoolongvideoid123]",
    "::youtube[]",
  ])("rejects a malformed YouTube ID: %s", async (markdown) => {
    const html = await renderMarkdown(markdown);
    expect(html).not.toContain("data-youtube-id");
    expect(html).not.toContain("<iframe");
  });

  it("surfaces an unknown directive instead of silently dropping it", async () => {
    // Silent removal would mean a typo'd directive vanishes from a published
    // post with no signal to the author.
    const html = await renderMarkdown("::notreal[x]");
    expect(html).toContain("data-directive-error");
  });
});

describe("renderMarkdown — edge cases", () => {
  it("returns empty string for empty input", async () => {
    expect(await renderMarkdown("")).toBe("");
    expect(await renderMarkdown("   \n  ")).toBe("");
  });

  it("handles a large document without error", async () => {
    const big = "## Section\n\nSome prose here.\n\n".repeat(200);
    expect((await renderMarkdown(big)).length).toBeGreaterThan(1000);
  });
});

describe("markdownToPlainText", () => {
  it("strips fenced code", () => {
    expect(markdownToPlainText("text\n\n```bash\nnmap -sV\n```\n\nmore")).toBe(
      "text more",
    );
  });

  it("keeps link labels and image alt text", () => {
    expect(markdownToPlainText("[docs](https://x.com) ![a shot](/x.png)")).toBe(
      "docs a shot",
    );
  });

  it("strips headings, emphasis and directives", () => {
    expect(markdownToPlainText("## Title\n\n**bold** _it_\n\n::youtube[abc]")).toBe(
      "Title bold it",
    );
  });

  it("never returns markup", () => {
    expect(markdownToPlainText("# H\n\n`<script>`")).not.toContain("<");
  });
});
