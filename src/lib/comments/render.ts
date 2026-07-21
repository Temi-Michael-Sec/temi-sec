/**
 * Comment renderer — plain text.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * THIS FILE DELIBERATELY CONTAINS NO MARKDOWN PARSER.
 *
 * Comments are the one path on this site that accepts input from strangers.
 * Rather than parsing untrusted Markdown and then sanitizing the result — which
 * means maintaining an allowlist forever and inheriting any parser CVE — the
 * whole class of problem is removed: escape everything first, then apply two
 * transforms over text that is already inert.
 *
 * Consequence of the ordering: by the time backticks and newlines are handled,
 * there is no live markup left to subvert. `<code>` is emitted with no
 * attributes and cannot carry an event handler, a URL, or a style.
 *
 * Deliberately absent: links. URLs render as literal text you copy. That is a
 * small cost to a reader and it removes the entire incentive for link spam,
 * since a comment can never confer a followable anchor.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Full spec: structure.md §4.2. Threat model: PLAN.md §7.
 */

/** Maximum length accepted at the API boundary. */
export const COMMENT_MAX_LENGTH = 4000;

/**
 * Escapes every character with meaning in HTML.
 *
 * `&` must be replaced first, otherwise the ampersands introduced by the later
 * replacements get double-escaped and `<` renders as the literal text `&lt;`.
 *
 * Single and double quotes are escaped even though nothing here interpolates
 * into an attribute — cheap, and it keeps the function safe if a caller ever
 * does something this file did not anticipate.
 */
export function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Renders a comment body to the HTML stored in `Comment.bodyHtml`.
 *
 * Order is the security property:
 *   1. escape  — nothing after this point can introduce markup
 *   2. `code`  — wraps already-escaped text in an attribute-free element
 *   3. \n      — becomes <br>
 */
export function renderComment(body: string): string {
  const escaped = escapeHtml(body.trim());

  const withCode = escaped.replace(
    // Non-greedy, no newlines: a stray backtick cannot swallow the rest of the
    // comment, and an unclosed one is simply left as a literal backtick.
    /`([^`\n]+)`/g,
    "<code>$1</code>",
  );

  return withCode
    .replace(/\r\n/g, "\n")
    // Collapse runs of blank lines so a comment cannot be padded into a wall
    // of vertical whitespace that pushes the thread off screen.
    .replace(/\n{3,}/g, "\n\n")
    .replace(/\n/g, "<br>");
}

/**
 * Plain-text preview for moderation queues, notification emails and search.
 * Never rendered as HTML.
 */
export function commentPreview(body: string, maxLength = 140): string {
  const flat = body.replace(/\s+/g, " ").trim();
  if (flat.length <= maxLength) return flat;
  return `${flat.slice(0, maxLength - 1).trimEnd()}…`;
}
