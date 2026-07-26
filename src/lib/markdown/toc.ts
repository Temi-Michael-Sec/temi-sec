import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkDirective from "remark-directive";
import remarkRehype from "remark-rehype";
import rehypeSlug from "rehype-slug";
import { visit } from "unist-util-visit";
import { toString } from "hast-util-to-string";
import type { Root, Element } from "hast";

import { remarkCustomDirectives } from "./directives";

/**
 * Table-of-contents extraction.
 *
 * ═════════════════════════════════════════════════════════════════════════════
 * READ HEADINGS FROM THE RENDERED TREE, NOT THE MARKDOWN SOURCE.
 *
 * A regex over Markdown source looking for `##` lines is wrong in two ways:
 *
 *   1. It matches `#` comments inside code fences — a bash `# comment` line
 *      would appear in the table of contents as a heading.
 *   2. The `id`s it invents by hand won't match the ones `rehype-slug` actually
 *      put in the HTML (duplicate headings get `-1`/`-2` suffixes; non-ASCII
 *      and punctuation are slugged in a specific way). Clicking the TOC link
 *      would then jump nowhere.
 *
 * So this runs the SAME front half of the pipeline as render.ts — up to and
 * including `rehype-slug` — and reads the real `id`s off the real headings.
 * `github-slugger` (which rehype-slug uses) is deterministic, so the same
 * heading sequence produces the same ids in both files. The drift-guard test
 * renders through both `renderMarkdown` and this, and asserts every id here
 * exists in the HTML.
 * ═════════════════════════════════════════════════════════════════════════════
 */

export interface TocEntry {
  /** The heading's anchor id, e.g. "initial-enumeration". */
  id: string;
  /** The visible heading text. */
  text: string;
  /** Heading depth: 2 for h2, 3 for h3. */
  level: number;
}

/**
 * Only h2 and h3 go in the TOC. h1 is the post title (rendered separately), and
 * h4+ makes the sidebar an unreadable thicket.
 */
const TOC_TAGS = new Set(["h2", "h3"]);

/**
 * Mirrors render.ts up to `rehype-slug`. No autolink, sanitize or Shiki — the
 * TOC only needs headings and their ids, and skipping those stages keeps this
 * fast and side-effect free.
 *
 * ⚠ Keep the remark half (gfm, directive, custom directives) in step with
 * render.ts. If a directive there changed how headings are produced, the
 * drift-guard test would catch the mismatch.
 */
const tocProcessor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkDirective)
  .use(remarkCustomDirectives)
  .use(remarkRehype)
  .use(rehypeSlug);

export function extractToc(markdown: string): TocEntry[] {
  if (!markdown.trim()) return [];

  // parse → mdast, then runSync executes the transformer chain (including
  // remark-rehype's mdast→hast bridge and rehype-slug). Every transformer here
  // is synchronous, so runSync is safe.
  const mdast = tocProcessor.parse(markdown);
  const hast = tocProcessor.runSync(mdast) as Root;

  const toc: TocEntry[] = [];

  visit(hast, "element", (node: Element) => {
    if (!TOC_TAGS.has(node.tagName)) return;

    const id = node.properties?.id;
    if (typeof id !== "string" || !id) return;

    const text = toString(node).trim();
    if (!text) return;

    toc.push({ id, text, level: Number(node.tagName.slice(1)) });
  });

  return toc;
}
