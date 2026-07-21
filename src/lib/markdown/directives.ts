import { visit } from "unist-util-visit";
import type { Root } from "mdast";
import type { Plugin } from "unified";

/**
 * Custom Markdown directives, via `remark-directive`.
 *
 * Every directive here emits a plain element carrying a `data-*` attribute.
 * None emits an `<iframe>`, a `<script>`, or anything with a URL the author
 * controls — that is what keeps the sanitizer allowlist small enough to reason
 * about. See sanitize-schema.ts.
 *
 *   :::warning            → <div data-callout="warning">
 *   :::spoiler{title="…"} → <div data-spoiler data-spoiler-title="…">
 *   ::flag[user]          → <span data-flag="user">
 *   ::youtube[VIDEO_ID]   → <div data-youtube-id="VIDEO_ID">
 */

export const CALLOUT_VARIANTS = ["note", "tip", "warning", "danger"] as const;
export type CalloutVariant = (typeof CALLOUT_VARIANTS)[number];

/**
 * YouTube IDs are exactly 11 characters from a fixed alphabet.
 *
 * This is the single most important validation in this file. The ID is
 * interpolated into an embed URL by the client component, so anything that is
 * not matched here must not reach it — otherwise an author could write a
 * directive whose "ID" alters the resulting URL.
 */
const YOUTUBE_ID = /^[A-Za-z0-9_-]{11}$/;

/** Flag labels are short identifiers like `user` or `root`, never free text. */
const FLAG_LABEL = /^[a-z0-9][a-z0-9-]{0,23}$/i;

interface DirectiveNode {
  type: "containerDirective" | "leafDirective" | "textDirective";
  name: string;
  attributes?: Record<string, string | null | undefined> | null;
  children: unknown[];
  data?: {
    hName?: string;
    hProperties?: Record<string, string | boolean>;
  };
}

function setElement(
  node: DirectiveNode,
  tagName: string,
  properties: Record<string, string | boolean>,
): void {
  const data = (node.data ??= {});
  data.hName = tagName;
  data.hProperties = { ...(data.hProperties ?? {}), ...properties };
}

/**
 * Renders an unrecognised or malformed directive as a visible error marker.
 *
 * Silent removal is the wrong failure mode for an authoring tool: a typo'd
 * directive would vanish from the published post and the author would never
 * know. A visible marker is noisy on purpose.
 *
 * The original children are REPLACED, not kept. That matters most for a
 * malformed `::flag[...]`: keeping them would print the very value the
 * directive exists to redact. Rejecting a directive must never be a way to
 * render its contents unprocessed.
 */
function renderAsError(node: DirectiveNode, message: string): void {
  setElement(node, "div", { dataDirectiveError: message });
  node.children = [{ type: "text", value: `⚠ ${message}` }];
}

export const remarkCustomDirectives: Plugin<[], Root> = () => {
  return (tree) => {
    visit(tree, (node) => {
      const directive = node as unknown as DirectiveNode;
      const { type, name } = directive;

      if (
        type !== "containerDirective" &&
        type !== "leafDirective" &&
        type !== "textDirective"
      ) {
        return;
      }

      // ─── Callouts ───────────────────────────────────────────────────────
      if ((CALLOUT_VARIANTS as readonly string[]).includes(name)) {
        setElement(directive, "div", { dataCallout: name });
        return;
      }

      // ─── Spoilers ───────────────────────────────────────────────────────
      if (name === "spoiler") {
        const title = directive.attributes?.title;
        setElement(directive, "div", {
          dataSpoiler: "true",
          // Attribute values are escaped by the HTML serializer, so a title is
          // safe as text; it is capped only to keep the markup sane.
          dataSpoilerTitle: (title ?? "Show").slice(0, 80),
        });
        return;
      }

      // ─── Redacted flags ─────────────────────────────────────────────────
      if (name === "flag") {
        const label = textOf(directive.children) || "flag";
        if (!FLAG_LABEL.test(label)) {
          renderAsError(directive, "Invalid flag label");
          return;
        }
        setElement(directive, "span", { dataFlag: label.toLowerCase() });
        // The label is metadata, not content. Dropping the children is what
        // guarantees a real flag value can never be rendered by this directive.
        directive.children = [];
        return;
      }

      // ─── YouTube embeds ─────────────────────────────────────────────────
      if (name === "youtube") {
        const id = textOf(directive.children);
        if (!YOUTUBE_ID.test(id)) {
          renderAsError(
            directive,
            "Invalid YouTube ID (expected 11 characters: A-Z a-z 0-9 _ -)",
          );
          return;
        }
        setElement(directive, "div", { dataYoutubeId: id });
        directive.children = [];
        return;
      }

      // ─── Anything else ──────────────────────────────────────────────────
      renderAsError(directive, `Unknown directive: ${name}`);
    });
  };
};

/** Flattens a directive's children to their text content. */
function textOf(children: unknown[]): string {
  let out = "";
  for (const child of children) {
    const node = child as { type?: string; value?: string; children?: unknown[] };
    if (typeof node.value === "string") out += node.value;
    else if (Array.isArray(node.children)) out += textOf(node.children);
  }
  return out.trim();
}
