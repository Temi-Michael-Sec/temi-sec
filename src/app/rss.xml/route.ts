import { getLatest } from "@/lib/posts";
import { postHref } from "@/lib/routes";
import { SITE_URL, SITE_NAME, SITE_DESCRIPTION } from "@/lib/seo";

// Regenerate the feed at most every 5 minutes.
export const revalidate = 300;

/** Escapes the five XML-significant characters. */
function xml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * RSS 2.0 feed. On free hosting this is the only subscription channel, and it's
 * the one a technical audience actually uses — no email, no algorithm. Glossary
 * terms are excluded (they're reference entries, not "news").
 */
export async function GET() {
  const posts = await getLatest(50, ["glossary"]);
  const now = new Date().toUTCString();

  const items = posts
    .map((post) => {
      const link = SITE_URL + postHref(post);
      const pubDate = post.publishedAt
        ? new Date(post.publishedAt).toUTCString()
        : now;
      return `    <item>
      <title>${xml(post.title)}</title>
      <link>${xml(link)}</link>
      <guid isPermaLink="true">${xml(link)}</guid>
      <pubDate>${pubDate}</pubDate>
      <description>${xml(post.excerpt)}</description>
      <category>${xml(post.type)}</category>
    </item>`;
    })
    .join("\n");

  const feed = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${xml(SITE_NAME)}</title>
    <link>${xml(SITE_URL)}</link>
    <description>${xml(SITE_DESCRIPTION)}</description>
    <language>en</language>
    <lastBuildDate>${now}</lastBuildDate>
    <atom:link href="${xml(SITE_URL)}/rss.xml" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>`;

  return new Response(feed, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=300, stale-while-revalidate=600",
    },
  });
}
