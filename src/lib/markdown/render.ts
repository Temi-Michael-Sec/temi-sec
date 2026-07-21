import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkDirective from "remark-directive";
import remarkRehype from "remark-rehype";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings, {
  type Options as AutolinkOptions,
} from "rehype-autolink-headings";
import rehypeSanitize from "rehype-sanitize";
import rehypeShiki from "@shikijs/rehype";
import rehypeStringify from "rehype-stringify";

import { postSanitizeSchema } from "./sanitize-schema";
import { remarkCustomDirectives } from "./directives";

/**
 * Post rendering pipeline.
 *
 * ═════════════════════════════════════════════════════════════════════════════
 * THE ORDER IS THE SECURITY PROPERTY. Two rules, both non-obvious, both of
 * which produced real defects in earlier drafts of this design.
 *
 * 1. SANITIZE BEFORE HIGHLIGHTING.
 *
 *    Shiki emits inline `style` attributes (`<span style="color:#89ddff">`).
 *    The sanitizer strips `style`. Run highlighting first and the colours
 *    silently disappear — and the obvious fix, allowlisting `style` globally,
 *    hands you CSS injection.
 *
 *    Running Shiki after sanitization is safe because it only transforms
 *    `<pre><code>` content and escapes everything it emits. Its output is
 *    trusted by construction; author input is not, and has already been
 *    scrubbed by the time Shiki sees it.
 *
 * 2. NOTHING EMITS AN `<iframe>`.
 *
 *    `rehype-sanitize` restricts URL protocols but cannot constrain a `src` to
 *    a host, so allowlisting iframes for video would also allow a hand-written
 *    one. Directives emit validated data attributes instead. See directives.ts.
 *
 * ═════════════════════════════════════════════════════════════════════════════
 *
 * Rendered at publish time and cached in `Post.bodyHtml`, never per request.
 */

/**
 * Shiki writes CSS custom properties for the light/dark pair rather than a
 * single hard-coded colour, so themes switch without re-rendering stored HTML.
 *
 * CSP note for Phase 8: this produces inline `style` attributes, which means
 * `style-src` needs `'unsafe-inline'`. That is a far weaker concession than
 * `script-src 'unsafe-inline'`, but if it needs removing, the route is
 * `transformerStyleToClass` from `@shikijs/transformers` plus a generated
 * stylesheet. Flagged rather than silently accepted.
 */
const SHIKI_THEMES = {
  light: "github-light",
  dark: "github-dark",
} as const;

/**
 * aria-hidden + tabIndex -1 keeps the anchor out of the screen-reader and
 * keyboard-tab order. It duplicates the heading text, so exposing it would make
 * every heading announce twice.
 */
const autolinkOptions: AutolinkOptions = {
  behavior: "append",
  properties: {
    // hast expects className as an array, not a space-separated string.
    className: ["heading-anchor"],
    ariaHidden: "true",
    tabIndex: -1,
  },
};

const processor = unified()
  .use(remarkParse)
  .use(remarkGfm) // tables, strikethrough, task lists, [^1] footnotes
  .use(remarkDirective) // ::: syntax — must precede our handler
  .use(remarkCustomDirectives) // callout / spoiler / flag / youtube
  .use(remarkRehype, { allowDangerousHtml: false })
  .use(rehypeSlug) // heading IDs — must precede TOC extraction
  .use(rehypeAutolinkHeadings, autolinkOptions)
  .use(rehypeSanitize, postSanitizeSchema) // ← everything above is untrusted
  .use(rehypeShiki, {
    themes: SHIKI_THEMES,
    defaultColor: false,
    // A fenced block with an unknown or absent language must still render as
    // a code block rather than throwing mid-publish.
    fallbackLanguage: "text",
  })
  .use(rehypeStringify);

/**
 * Renders Markdown to sanitized HTML.
 *
 * Async because Shiki loads grammars on demand.
 */
export async function renderMarkdown(markdown: string): Promise<string> {
  if (!markdown.trim()) return "";
  const file = await processor.process(markdown);
  return String(file);
}

/**
 * Strips Markdown to plain text — for excerpts, meta descriptions and search
 * indexing. Never rendered as HTML.
 */
export function markdownToPlainText(markdown: string): string {
  return markdown
    .replace(/```[\s\S]*?```/g, " ") // fenced code
    .replace(/`[^`\n]*`/g, " ") // inline code
    .replace(/^:::.*$/gm, " ") // container directives
    .replace(/::\w+\[[^\]]*\]/g, " ") // leaf directives
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1") // images → alt text
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1") // links → label
    .replace(/^#{1,6}\s+/gm, "") // headings
    .replace(/^>\s?/gm, "") // blockquotes
    .replace(/[*_~]{1,3}/g, "") // emphasis
    .replace(/\[\^[^\]]+\]/g, "") // footnote refs
    .replace(/\s+/g, " ")
    .trim();
}
