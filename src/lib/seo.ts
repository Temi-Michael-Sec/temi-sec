import type { Metadata } from "next";
import type { PostDetail } from "@/lib/posts";
import { postHref } from "@/lib/routes";

/** Canonical site URL — the single source, so a host change is one env var. */
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

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
    alternates: { canonical: url },
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
    alternates: { canonical: url },
    openGraph: { title, description, url, siteName: SITE_NAME },
  };
}
