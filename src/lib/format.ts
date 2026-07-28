/**
 * Formatting helpers shared by server and client components. Pure, no deps.
 */

/** "2026-07-26" → "Jul 26, 2026". Stable across locales (uses en-US, UTC). */
export function formatDate(date: Date | string | null): string {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

/** Compact "Jul 26" for tight rows. */
export function formatDateShort(date: Date | string | null): string {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

/** ISO date for <time dateTime> and sitemaps. */
export function isoDate(date: Date | string | null): string {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toISOString();
}

/** "3 min read" — falls back gracefully at 0/undefined. */
export function readingLabel(minutes: number | undefined): string {
  const m = Math.max(1, minutes ?? 1);
  return `${m} min read`;
}

/**
 * Safely resolves a user-entered external URL to a `{ href, host }` pair, or
 * null if it isn't a usable http(s) URL.
 *
 * `new URL()` throws on a bare host like "nmap.org", which would 500 a page
 * that renders it. This tolerates a missing scheme (tries https://), and
 * rejects anything that isn't http/https — so a `javascript:` or `data:` value
 * can never become a link.
 */
export function externalLink(
  url: string | undefined | null,
): { href: string; host: string } | null {
  if (!url) return null;
  // Only assume https:// when there is no scheme at all. Prepending it to an
  // input that already has one (e.g. "ftp://x") would mangle it into a bogus
  // "https://ftp://x" with host "ftp".
  const candidate = url.includes("://") ? url : `https://${url}`;
  try {
    const u = new URL(candidate);
    if (u.protocol === "http:" || u.protocol === "https:") {
      return { href: u.href, host: u.host };
    }
  } catch {
    // not a usable URL
  }
  return null;
}
