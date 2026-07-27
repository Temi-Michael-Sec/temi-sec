import type { ContentType } from "@/lib/taxonomy";

/**
 * Single source of truth for how each content type maps to a URL.
 *
 * Every link to a post — cards, the TOC, cross-links, the sitemap, RSS —
 * derives from here, so the URL scheme lives in exactly one place.
 */
const TYPE_SEGMENT: Record<ContentType, string> = {
  article: "blog",
  ctf: "ctf",
  tool: "tools",
  policy: "policies",
  note: "notes",
  glossary: "glossary",
};

/** The listing/index URL for a content type, e.g. "ctf" → "/ctf". */
export function listHref(type: ContentType): string {
  return `/${TYPE_SEGMENT[type]}`;
}

/** The detail URL for a post, e.g. an article "x" → "/blog/x". */
export function postHref(post: { type: ContentType; slug: string }): string {
  return `/${TYPE_SEGMENT[post.type]}/${post.slug}`;
}

/** The route segment for a type, for building static params. */
export function typeSegment(type: ContentType): string {
  return TYPE_SEGMENT[type];
}
