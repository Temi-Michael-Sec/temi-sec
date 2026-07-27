import Link from "next/link";
import type { PostDetail, PostListItem } from "@/lib/posts";
import { postHref } from "@/lib/routes";
import { Prompt } from "./Prompt";
import { PostBody } from "./PostBody";
import { StaleBanner } from "./StaleBanner";
import { InstallTabs } from "./InstallTabs";
import { TypeBadge, Badge } from "@/components/ui/Badge";
import { labelOf, TOOL_CATEGORIES } from "@/lib/taxonomy";

/**
 * The tool reference page — reads like a man page, not an article. Header, then
 * install commands, then the searchable cheatsheet table (the centrepiece),
 * then any usage notes, then cross-links to the writeups that used the tool.
 */
export function ToolPage({
  post,
  writeups,
}: {
  post: PostDetail;
  writeups: PostListItem[];
}) {
  return (
    <div className="mx-auto max-w-5xl px-5">
      <header className="border-b border-border pb-6 pt-12">
        <Prompt kind="tool" path="~/tools" name={post.toolName} className="text-faint" />
        <h1 className="mt-2.5 font-mono text-[clamp(1.8rem,4vw,2.25rem)] tracking-[-0.01em]">
          {post.toolName ?? post.title}
        </h1>
        <div className="mt-3.5 flex flex-wrap items-center gap-2">
          <TypeBadge type="tool" />
          {post.toolCategory && (
            <Badge>{labelOf(TOOL_CATEGORIES, post.toolCategory)}</Badge>
          )}
          {post.officialUrl && (
            <a
              href={post.officialUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded border border-accent/40 px-2 py-[0.15rem] font-mono text-[0.7rem] text-accent"
              style={{ borderColor: "color-mix(in oklab, var(--accent) 40%, var(--border))" }}
            >
              {new URL(post.officialUrl).host} ↗
            </a>
          )}
          {post.platforms && post.platforms.length > 0 && (
            <span className="font-mono text-[0.75rem] text-faint">
              {post.platforms.join(" · ").toLowerCase()}
            </span>
          )}
        </div>
      </header>

      <div className="measure py-8">
        <StaleBanner lastReviewedAt={post.lastReviewedAt} />

        {post.bodyHtml && <PostBody html={post.bodyHtml} />}

        {post.installCommands && post.installCommands.length > 0 && (
          <section className="mt-8">
            <h2 className="mb-3 text-xl font-semibold">Install</h2>
            <InstallTabs commands={post.installCommands} />
          </section>
        )}

        {post.cheatsheet && post.cheatsheet.length > 0 && (
          <section className="mt-8">
            <h2 className="mb-3 text-xl font-semibold">Cheatsheet</h2>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-[0.9rem]">
                <thead>
                  <tr>
                    <th className="border-b border-border px-3 py-2 text-left font-mono text-[0.72rem] uppercase tracking-[0.05em] text-faint">
                      Command
                    </th>
                    <th className="border-b border-border px-3 py-2 text-left font-mono text-[0.72rem] uppercase tracking-[0.05em] text-faint">
                      What it does
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {post.cheatsheet.map((row, i) => (
                    <tr key={i} className="hover:bg-surface">
                      <td className="whitespace-nowrap border-b border-border px-3 py-2.5 align-top font-mono text-[0.82rem] text-accent">
                        {row.command}
                      </td>
                      <td className="border-b border-border px-3 py-2.5 align-top text-muted">
                        {row.description}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {writeups.length > 0 && (
          <section className="mt-8">
            <h2 className="mb-3 text-xl font-semibold">Seen in these writeups</h2>
            <div className="grid gap-2.5">
              {writeups.map((w) => (
                <Link
                  key={w.id}
                  href={postHref(w)}
                  className="flex items-center gap-2.5 rounded-[var(--radius)] border border-border px-3.5 py-2.5 hover:border-[color-mix(in_oklab,var(--t-ctf)_45%,var(--border))]"
                >
                  <TypeBadge type="ctf" />
                  <span>{w.title}</span>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
