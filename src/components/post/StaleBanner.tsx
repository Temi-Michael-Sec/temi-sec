import { formatDate } from "@/lib/format";

/**
 * Freshness banner shown on posts not reviewed in over 18 months. Security
 * content decays fast — an outdated technique isn't just useless to a learner,
 * it's misleading — so a stale post says so out loud.
 *
 * CTF writeups pass `null`/never render this: they're point-in-time records,
 * not living guides. The caller decides.
 */
const STALE_AFTER_MS = 18 * 30 * 24 * 60 * 60 * 1000; // ~18 months

export function StaleBanner({
  lastReviewedAt,
}: {
  lastReviewedAt: Date | string | null;
}) {
  if (!lastReviewedAt) return null;
  const reviewed = new Date(lastReviewedAt);
  // Server Component: this renders per request (ISR, revalidate=300), so "now"
  // is the generation time — exactly the freshness semantics we want. The
  // purity rule targets client re-renders, which don't apply here.
  // eslint-disable-next-line react-hooks/purity
  if (Date.now() - reviewed.getTime() < STALE_AFTER_MS) return null;

  return (
    <div
      role="note"
      className="mb-6 rounded-[var(--radius)] border border-warn/40 bg-[color-mix(in_oklab,var(--warn)_8%,var(--background))] px-4 py-3 text-sm"
      style={{ borderColor: "color-mix(in oklab, var(--warn) 40%, var(--border))" }}
    >
      <span className="font-mono text-[0.72rem] uppercase tracking-[0.08em] text-warn">
        heads up
      </span>
      <p className="mt-1 text-muted">
        Last reviewed {formatDate(reviewed)}. Techniques may have changed —
        verify before relying on this.
      </p>
    </div>
  );
}
