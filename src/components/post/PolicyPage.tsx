import type { PostDetail } from "@/lib/posts";
import { Prompt } from "./Prompt";
import { PostShell } from "./PostShell";
import { Badge } from "@/components/ui/Badge";
import { labelOf, FRAMEWORKS } from "@/lib/taxonomy";

/**
 * Policy template page — a formal document. The framework and version sit up
 * top, downloads are a prominent panel (the artifact is the point), and the
 * body renders with a TOC since policies are sectioned (Purpose / Scope / …).
 */
export function PolicyPage({ post }: { post: PostDetail }) {
  const header = (
    <header className="border-b border-border pb-6 pt-12">
      <Prompt kind="post" path="~/policies" className="text-faint" />
      <h1 className="mt-3 max-w-[24ch] text-balance text-[clamp(1.9rem,4.5vw,2.25rem)] font-semibold leading-[1.12] tracking-[-0.02em]">
        {post.title}
      </h1>
      <div className="mt-4 flex flex-wrap items-center gap-2 font-mono text-[0.8125rem] text-faint">
        {post.framework && <Badge>{labelOf(FRAMEWORKS, post.framework)}</Badge>}
        {post.version && <span>v{post.version}</span>}
      </div>

      {post.downloads && post.downloads.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {post.downloads.map((d, i) => (
            <a
              key={i}
              href={d.url}
              download
              className="inline-flex items-center gap-2 rounded-[var(--radius)] border border-border bg-surface px-3.5 py-2 font-mono text-[0.8rem] hover:border-accent hover:text-accent"
            >
              ↓ {d.label}
              <span className="text-faint">
                {d.format}
                {d.sizeBytes ? ` · ${Math.round(d.sizeBytes / 1024)} KB` : ""}
              </span>
            </a>
          ))}
        </div>
      )}
    </header>
  );

  return <PostShell post={post} header={header} />;
}
