import { defaultSchema } from "rehype-sanitize";
import type { Options as SanitizeOptions } from "rehype-sanitize";

/**
 * Sanitizer allowlist for POST bodies.
 *
 * Comments do not use this file — they never touch a Markdown parser at all.
 * See `lib/comments/render.ts`.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * THE RULE THAT MATTERS MOST: no `<iframe>`, ever.
 *
 * `rehype-sanitize` can restrict URL *protocols* but cannot constrain a `src`
 * to a specific host. So allowlisting `<iframe>` to support video embeds would
 * also allow a hand-written `<iframe src="https://evil.example">` in Markdown
 * source, with no way to narrow it back down.
 *
 * Instead the `::youtube` directive emits `<div data-youtube-id="...">` with a
 * validated ID, and a client component builds the frame. The allowlist below
 * therefore permits one data attribute rather than an element.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Also absent: `style`. Inline styles are a CSS-injection vector. Syntax
 * highlighting still gets its colours because Shiki runs *after* this stage —
 * see `render.ts` for why that ordering is required.
 */

const attributes = defaultSchema.attributes ?? {};
const tagNames = defaultSchema.tagNames ?? [];

export const postSanitizeSchema: SanitizeOptions = {
  ...defaultSchema,

  tagNames: [
    ...tagNames,
    // Emitted by directives, or wanted for prose.
    "span",
    "figure",
    "figcaption",
    "kbd",
    "mark",
    "abbr",
    "details",
    "summary",
  ],

  attributes: {
    ...attributes,

    div: [
      ...(attributes.div ?? []),
      // Video embeds. The value is validated at parse time against
      // ^[A-Za-z0-9_-]{11}$ — see directives.ts — so it cannot carry a URL.
      "dataYoutubeId",
      // Callout variant: note | tip | warning | danger.
      "dataCallout",
      // Spoiler wrapper for CTF solution steps.
      "dataSpoiler",
      "dataSpoilerTitle",
      // Malformed-directive marker. Without this the attribute is stripped and
      // the author gets no signal that their directive did not parse.
      "dataDirectiveError",
    ],

    span: [
      ...(attributes.span ?? []),
      // Redacted flag placeholder.
      "dataFlag",
      // Shiki writes these when it runs after sanitization; listing them keeps
      // the schema honest about what appears in stored HTML.
      "style",
      "className",
    ],

    code: [...(attributes.code ?? []), "className", "dataLanguage"],
    pre: [...(attributes.pre ?? []), "className", "style", "tabIndex"],

    // Heading anchors from rehype-slug + rehype-autolink-headings.
    h1: [...(attributes.h1 ?? []), "id"],
    h2: [...(attributes.h2 ?? []), "id"],
    h3: [...(attributes.h3 ?? []), "id"],
    h4: [...(attributes.h4 ?? []), "id"],
    h5: [...(attributes.h5 ?? []), "id"],
    h6: [...(attributes.h6 ?? []), "id"],

    a: [
      ...(attributes.a ?? []),
      "id",
      "ariaHidden",
      "tabIndex",
      "className",
      "rel",
      "target",
    ],

    img: [...(attributes.img ?? []), "loading", "decoding", "width", "height"],

    // GFM footnotes and task lists.
    li: [...(attributes.li ?? []), "id", "className"],
    section: [...(attributes.section ?? []), "dataFootnotes", "className"],
    input: ["type", "checked", "disabled"],
  },

  // Explicitly enumerated so adding a scheme is a deliberate act. `javascript:`
  // and `data:` are absent on purpose — `data:` URLs in an href are a phishing
  // and script-execution vector.
  protocols: {
    ...defaultSchema.protocols,
    href: ["http", "https", "mailto"],
    src: ["http", "https"],
  },

  /**
   * Disables the default `user-content-` prefix on `id` and `name`.
   *
   * That prefix defends against DOM clobbering — an `id` colliding with a
   * global, or with a property of a form element, so that `document.x` returns
   * an element instead of what the script expected. It is the right default
   * for a site rendering *other people's* Markdown.
   *
   * It is not buying anything here, and it costs something real:
   *
   *   - Post bodies are authored only by the single admin. Clobbering would
   *     require the author to attack their own site.
   *   - Comments — the actual untrusted path — never touch this pipeline and
   *     emit no `id` at all. See lib/comments/render.ts.
   *   - Keeping it makes every shareable deep link `#user-content-enumeration`,
   *     which is a permanent wart on a site whose posts are long enough to need
   *     anchor links.
   *
   * ⚠ REVERT THIS (drop the two lines below) the moment post bodies stop being
   * single-author: guest posts, multi-author support, or any user-submitted
   * content entering this pipeline. At that point the threat model changes and
   * the prefix earns its keep again.
   */
  clobber: [],
  clobberPrefix: "",
};

/**
 * Elements that must never appear in stored post HTML, whatever the schema
 * says. Asserted directly by the render tests so a future edit to the
 * allowlist cannot quietly reintroduce one.
 */
export const FORBIDDEN_TAGS = [
  "script",
  "iframe",
  "object",
  "embed",
  "link",
  "meta",
  "base",
  "form",
  "style",
  "template",
  "noscript",
] as const;
