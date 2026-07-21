import { describe, it, expect } from "vitest";
import { renderComment, escapeHtml, commentPreview } from "./render";

/**
 * Attack suite for the comment path.
 *
 * Comments are the only place on this site where a stranger's input is stored
 * and shown to other people, so this file is the one that matters most.
 *
 * The assertion style is deliberate: checking that output does not contain a
 * live `<script`, `javascript:` or `onerror=` rather than comparing to an
 * expected string. A string comparison passes for the wrong reason if the
 * implementation changes shape; these fail loudly if anything ever becomes
 * executable.
 */

/** Payloads that must never produce live markup. */
const XSS_PAYLOADS = [
  `<script>alert(1)</script>`,
  `<img src=x onerror=alert(1)>`,
  `<svg onload=alert(1)>`,
  `<iframe src="https://evil.example"></iframe>`,
  `<a href="javascript:alert(1)">click</a>`,
  `<body onload=alert(1)>`,
  `<input autofocus onfocus=alert(1)>`,
  `<details open ontoggle=alert(1)>`,
  `<object data="data:text/html,<script>alert(1)</script>">`,
  `<embed src="data:text/html,<script>alert(1)</script>">`,
  `<style>@import'http://evil.example';</style>`,
  `<link rel=stylesheet href="http://evil.example">`,
  `<meta http-equiv="refresh" content="0;url=http://evil.example">`,
  `<form action="http://evil.example"><button>go</button></form>`,
  `"><script>alert(1)</script>`,
  `'><script>alert(1)</script>`,
  `<<script>alert(1)//<</script>`,
  `<scr<script>ipt>alert(1)</scr</script>ipt>`,
  `<SCRIPT>alert(1)</SCRIPT>`,
  `<ScRiPt>alert(1)</ScRiPt>`,
  `<img src="x" onerror="alert(String.fromCharCode(88,83,83))">`,
  `<base href="http://evil.example/">`,
  `<textarea></textarea><script>alert(1)</script>`,
  `<noscript><p title="</noscript><script>alert(1)</script>">`,
  `<math><mtext><table><mglyph><style><img src=x onerror=alert(1)>`,
  `<template><script>alert(1)</script></template>`,
];

describe("escapeHtml", () => {
  it("escapes ampersands before anything else, avoiding double-escaping", () => {
    // If & were escaped last, "<" would become "&amp;lt;" and render as the
    // literal text "&lt;" instead of a less-than sign.
    expect(escapeHtml("<")).toBe("&lt;");
    expect(escapeHtml("&lt;")).toBe("&amp;lt;");
  });

  it("escapes every HTML-significant character", () => {
    expect(escapeHtml(`&<>"'`)).toBe("&amp;&lt;&gt;&quot;&#39;");
  });
});

/** The only tags this renderer may ever emit. */
const ALLOWED_TAG = /^<\/?(?:code|br)\s*\/?>$/i;

describe("renderComment — XSS payloads", () => {
  /**
   * Two invariants, together sufficient.
   *
   * Note what is NOT asserted: the absence of substrings like `onerror=` or
   * `javascript:`. Escaped output legitimately contains those as *text* —
   * `&lt;img src=x onerror=alert(1)&gt;` is inert, because there is no `<` to
   * open a tag. Asserting on the substring fails on correct output, which is
   * how a test ends up being weakened to make it pass.
   *
   * The real property is structural: only `<code>`/`<br>` exist as markup, and
   * every other angle bracket is escaped. If both hold, no element can exist
   * and therefore no attribute or scheme can be live.
   */
  it.each(XSS_PAYLOADS)("emits no live markup for: %s", (payload) => {
    const tags = renderComment(payload).match(/<\/?[a-zA-Z][^>]*>/g) ?? [];
    for (const tag of tags) expect(tag).toMatch(ALLOWED_TAG);
  });

  it.each(XSS_PAYLOADS)("escapes every other angle bracket in: %s", (payload) => {
    const withoutAllowedTags = renderComment(payload).replace(
      /<\/?(?:code|br)\s*\/?>/gi,
      "",
    );
    expect(withoutAllowedTags).not.toMatch(/[<>]/);
  });

  it("shows the payload to the reader as literal text", () => {
    // Neutralised, not swallowed. A reader discussing an attack should still
    // see what they typed.
    expect(renderComment("<script>alert(1)</script>")).toBe(
      "&lt;script&gt;alert(1)&lt;/script&gt;",
    );
  });
});

describe("renderComment — legitimate content", () => {
  it("renders inline code, which is the point of allowing backticks", () => {
    expect(renderComment("run `nmap -sC -sV` first")).toBe(
      "run <code>nmap -sC -sV</code> first",
    );
  });

  it("escapes inside code fences too", () => {
    // A commenter pasting a payload as an example must not execute it.
    expect(renderComment("try `<script>alert(1)</script>`")).toBe(
      "try <code>&lt;script&gt;alert(1)&lt;/script&gt;</code>",
    );
  });

  it("emits <code> with no attributes at all", () => {
    const html = renderComment("`x`");
    expect(html).toBe("<code>x</code>");
  });

  it("converts newlines to <br>", () => {
    expect(renderComment("one\ntwo")).toBe("one<br>two");
  });

  it("normalises CRLF", () => {
    expect(renderComment("one\r\ntwo")).toBe("one<br>two");
  });

  it("collapses padded blank lines", () => {
    // Otherwise a comment can be used to push a thread off screen.
    expect(renderComment("a\n\n\n\n\n\nb")).toBe("a<br><br>b");
  });

  it("leaves an unclosed backtick as a literal character", () => {
    expect(renderComment("what does ` do")).toBe("what does ` do");
  });

  it("does not let a backtick span newlines", () => {
    // A stray backtick must not swallow the remainder of the comment.
    expect(renderComment("`open\nstill text")).toBe("`open<br>still text");
  });

  it("does not turn a URL into a link", () => {
    const html = renderComment("see https://example.com for details");
    expect(html).not.toMatch(/<a/i);
    expect(html).toContain("https://example.com");
  });

  it("trims surrounding whitespace", () => {
    expect(renderComment("  hi  ")).toBe("hi");
  });

  it("handles an empty comment without producing markup", () => {
    expect(renderComment("")).toBe("");
    expect(renderComment("   \n  ")).toBe("");
  });
});

describe("commentPreview", () => {
  it("flattens whitespace to a single line", () => {
    expect(commentPreview("a\n\nb   c")).toBe("a b c");
  });

  it("truncates with an ellipsis", () => {
    expect(commentPreview("x".repeat(200), 10)).toBe(`${"x".repeat(9)}…`);
  });

  it("leaves short input untouched", () => {
    expect(commentPreview("short")).toBe("short");
  });

  it("returns text, never HTML, even for markup input", () => {
    // The moderation queue shows this. It must not become live markup there.
    expect(commentPreview("<script>alert(1)</script>")).toBe(
      "<script>alert(1)</script>",
    );
  });
});
