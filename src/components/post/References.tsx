import { formatDate } from "@/lib/format";

/**
 * Structured source list. Security writing cites CVEs, advisories and vendor
 * docs constantly, so references are a first-class field rather than freeform
 * links buried in prose.
 */
export function References({
  references,
}: {
  references: { title: string; url: string; accessedAt: Date | string }[];
}) {
  if (references.length === 0) return null;
  return (
    <section className="mt-10 border-t border-border pt-5">
      <h2 className="mb-3 text-xl font-semibold">References</h2>
      <ol className="flex list-decimal flex-col gap-1.5 pl-5 text-sm text-muted">
        {references.map((ref, i) => (
          <li key={i}>
            <a
              href={ref.url}
              className="text-accent underline-offset-2 hover:underline"
              target="_blank"
              rel="noopener noreferrer nofollow"
            >
              {ref.title}
            </a>
            {ref.accessedAt && (
              <span className="text-faint"> — accessed {formatDate(ref.accessedAt)}</span>
            )}
          </li>
        ))}
      </ol>
    </section>
  );
}
