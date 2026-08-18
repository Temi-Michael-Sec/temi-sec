"use client";

import { useEffect, useState } from "react";
import type { TocEntry } from "@/models/Post";

/**
 * Sticky table-of-contents rail. The entries come from extractToc (server),
 * whose ids match the anchors rehype-slug put in the rendered HTML — so the
 * links resolve exactly.
 *
 * The active-section highlight uses an IntersectionObserver watching each
 * heading, which is far cheaper than a scroll handler and doesn't jank.
 */
export function TableOfContents({
  toc,
  showHeading = true,
}: {
  toc: TocEntry[];
  /** Hidden when the caller already labels the list (e.g. a <details> summary). */
  showHeading?: boolean;
}) {
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    if (toc.length === 0) return;

    const headings = toc
      .map((t) => document.getElementById(t.id))
      .filter((el): el is HTMLElement => el !== null);

    const observer = new IntersectionObserver(
      (entries) => {
        // Pick the topmost heading currently intersecting the trigger band.
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActiveId(visible[0].target.id);
      },
      // Trigger band near the top of the viewport.
      { rootMargin: "-10% 0px -70% 0px", threshold: 0 },
    );

    headings.forEach((h) => observer.observe(h));
    return () => observer.disconnect();
  }, [toc]);

  if (toc.length === 0) return null;

  return (
    <nav aria-label="On this page" className="text-sm">
      {showHeading && (
        <p className="mb-3 font-mono text-[0.7rem] uppercase tracking-[0.1em] text-faint">
          On this page
        </p>
      )}
      <ul className="flex flex-col border-l border-border">
        {toc.map((entry) => {
          const active = entry.id === activeId;
          return (
            <li key={entry.id}>
              <a
                href={`#${entry.id}`}
                className={[
                  "-ml-px block border-l py-1.5 transition-colors",
                  entry.level >= 3 ? "pl-6 text-[0.8rem]" : "pl-3.5",
                  active
                    ? "border-accent text-accent"
                    : "border-transparent text-muted hover:text-foreground",
                ].join(" ")}
              >
                {entry.text}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
