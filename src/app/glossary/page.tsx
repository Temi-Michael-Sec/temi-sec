import Link from "next/link";
import type { Metadata } from "next";
import { getByType } from "@/lib/posts";
import { Prompt } from "@/components/post/Prompt";
import { buildListingMetadata } from "@/lib/seo";

export const revalidate = 300;

export const metadata: Metadata = buildListingMetadata(
  "Glossary",
  "Plain-English definitions of security terms, cross-linked across the site.",
  "/glossary",
);

export default async function GlossaryIndex() {
  const terms = await getByType("glossary", { limit: 500 });

  // Group by first letter of the term for an A–Z index.
  const groups = new Map<string, typeof terms>();
  for (const t of [...terms].sort((a, b) =>
    (a.term ?? a.title).localeCompare(b.term ?? b.title),
  )) {
    const letter = (t.term ?? t.title)[0]?.toUpperCase() ?? "#";
    const key = /[A-Z]/.test(letter) ? letter : "#";
    (groups.get(key) ?? groups.set(key, []).get(key)!).push(t);
  }

  return (
    <div className="mx-auto max-w-3xl px-5">
      <header className="pb-6 pt-14">
        <Prompt kind="listing" path="~/glossary" className="text-faint" />
        <h1 className="mt-3 text-[clamp(1.9rem,4vw,2.5rem)] font-semibold tracking-[-0.02em]">
          Glossary
        </h1>
        <p className="mt-2 max-w-[60ch] text-muted">
          Plain-English definitions, cross-linked across every writeup.
        </p>
      </header>

      {groups.size === 0 ? (
        <p className="border-t border-border py-12 font-mono text-sm text-faint">
          No terms defined yet.
        </p>
      ) : (
        <div className="flex flex-col gap-8 border-t border-border pt-8">
          {[...groups.entries()].map(([letter, items]) => (
            <section key={letter} className="grid gap-2 sm:grid-cols-[3rem_1fr]">
              <h2 className="font-mono text-lg text-faint">{letter}</h2>
              <ul className="flex flex-col gap-2">
                {items.map((t) => (
                  <li key={t.id}>
                    <Link
                      href={`/glossary/${t.slug}`}
                      className="group flex flex-wrap items-baseline gap-2"
                    >
                      <span className="font-medium group-hover:text-accent">
                        {t.term ?? t.title}
                      </span>
                      {t.aliases && t.aliases.length > 0 && (
                        <span className="font-mono text-[0.75rem] text-faint">
                          {t.aliases.join(" · ")}
                        </span>
                      )}
                      {t.excerpt && (
                        <span className="basis-full text-sm text-muted">
                          {t.excerpt}
                        </span>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}

      <div className="h-16" />
    </div>
  );
}
