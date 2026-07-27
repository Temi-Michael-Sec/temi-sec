import type { MetadataRoute } from "next";
import { getAllPublished } from "@/lib/posts";
import { postHref } from "@/lib/routes";
import { SITE_URL } from "@/lib/seo";

export const revalidate = 300;

/** Static top-level routes that always exist. */
const STATIC_PATHS = [
  "",
  "/blog",
  "/ctf",
  "/tools",
  "/policies",
  "/notes",
  "/glossary",
  "/about",
  // "/security" is added in Phase 8 when the page exists.
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = await getAllPublished();

  const staticEntries: MetadataRoute.Sitemap = STATIC_PATHS.map((path) => ({
    url: SITE_URL + path,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: path === "" ? 1 : 0.7,
  }));

  const postEntries: MetadataRoute.Sitemap = posts.map((p) => ({
    url: SITE_URL + postHref(p),
    lastModified: p.updatedAt,
    changeFrequency: "monthly",
    priority: 0.8,
  }));

  return [...staticEntries, ...postEntries];
}
