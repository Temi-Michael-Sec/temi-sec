import Link from "next/link";
import type { PostDetail } from "@/lib/posts";
import { Prompt } from "./Prompt";
import { PostBody } from "./PostBody";

/**
 * Glossary term page — a dictionary/wiki entry. The one-line definition
 * (shortDef, plain text by contract) sits up top, then the fuller explanation,
 * then cross-links to related terms.
 */
export function GlossaryPage({ post }: { post: PostDetail }) {
  return (
    <div className="mx-auto max-w-3xl px-5">
      <header className="border-b border-border pb-6 pt-12">
        <Prompt kind="post" path="~/glossary" className="text-faint" />
        <h1 className="mt-3 text-[clamp(1.9rem,4.5vw,2.25rem)] font-semibold tracking-[-0.02em]">
          {post.term ?? post.title}
        </h1>
        {post.aliases && post.aliases.length > 0 && (
          <p className="mt-1 font-mono text-[0.8rem] text-faint">
            {post.aliases.join(" · ")}
          </p>
        )}
        {post.shortDef && (
          <p className="measure mt-4 border-l-2 border-accent pl-4 text-lg text-foreground">
            {post.shortDef}
          </p>
        )}
      </header>

      <div className="measure py-8">
        {post.bodyHtml && <PostBody html={post.bodyHtml} />}

        {post.seeAlso && post.seeAlso.length > 0 && (
          <section className="mt-8 border-t border-border pt-5">
            <p className="mb-2 font-mono text-[0.72rem] uppercase tracking-[0.08em] text-faint">
              See also
            </p>
            <div className="flex flex-wrap gap-2">
              {post.seeAlso.map((slug) => (
                <Link
                  key={slug}
                  href={`/glossary/${slug}`}
                  className="rounded border border-border px-2.5 py-1 font-mono text-[0.8rem] text-accent hover:border-accent"
                >
                  {slug}
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
