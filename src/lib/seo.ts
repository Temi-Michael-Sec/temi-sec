import type { Metadata } from "next";
import type { PostDetail } from "@/lib/posts";
import { postHref } from "@/lib/routes";

/**
 * Canonical site URL — the single source, so a host change is one env var.
 *
 * Trailing slashes are stripped because every caller appends a path that
 * starts with "/" (SITE_URL + "/about"). Without this, an env value of
 * "https://host/" produced "https://host//about" in canonical, og:url, RSS and
 * the sitemap.
 */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
).replace(/\/+$/, "");

/**
 * RSS autodiscovery. Next merges metadata SHALLOWLY: a page that sets
 * `alternates` (for its canonical) replaces the layout's whole `alternates`,
 * RSS entry included — so every builder must re-include it.
 */
export const RSS_ALTERNATE = {
  "application/rss+xml": `${SITE_URL}/rss.xml`,
} as const;

export const SITE_NAME = "temi.sec";
export const SITE_DESCRIPTION =
  "Security notes, CTF writeups, and a tool reference that gets used.";

/** Metadata for a post detail page — title, description, canonical, OG. */
export function buildPostMetadata(post: PostDetail): Metadata {
  const title = post.seo?.metaTitle ?? post.title;
  const description =
    post.seo?.metaDescription ?? post.shortDef ?? post.excerpt ?? SITE_DESCRIPTION;
  const url = SITE_URL + postHref(post);
  const publishedTime = post.publishedAt
    ? new Date(post.publishedAt).toISOString()
    : undefined;

  return {
    title,
    description,
    alternates: { canonical: url, types: RSS_ALTERNATE },
    openGraph: {
      type: "article",
      title,
      description,
      url,
      siteName: SITE_NAME,
      publishedTime,
      images: post.seo?.ogImage ? [{ url: post.seo.ogImage }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

/** Metadata for a listing/index page. */
export function buildListingMetadata(
  title: string,
  description: string,
  path: string,
): Metadata {
  const url = SITE_URL + path;
  return {
    title,
    description,
    alternates: { canonical: url, types: RSS_ALTERNATE },
    openGraph: { title, description, url, siteName: SITE_NAME },
  };
}
