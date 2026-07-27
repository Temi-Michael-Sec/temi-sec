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
