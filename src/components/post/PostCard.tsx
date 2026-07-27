import Link from "next/link";
import type { PostListItem } from "@/lib/posts";
import { postHref } from "@/lib/routes";
import { formatDate, formatDateShort, readingLabel } from "@/lib/format";
import { TypeBadge, Badge, DifficultyChip } from "@/components/ui/Badge";
import { labelOf, PLATFORMS, TOOL_CATEGORIES, FRAMEWORKS } from "@/lib/taxonomy";

/**
 * Full listing card. Each type surfaces the metadata it actually has — a CTF
 * shows difficulty/OS/platform, a tool shows its category, a policy its
 * framework. That per-type richness is the whole point of the discriminators.
 */
export function PostCard({ post }: { post: PostListItem }) {
  return (
    <Link
      href={postHref(post)}
      className="group grid gap-2 border-b border-border py-6 transition-colors hover:bg-surface"
    >
      <div className="flex flex-wrap items-center gap-2.5">
        <TypeBadge type={post.type} />
        <TypeMeta post={post} />
      </div>
      <h3 className="text-[1.6rem] font-semibold leading-tight tracking-[-0.015em] transition-colors group-hover:text-accent">
        {post.title}
      </h3>
      {post.excerpt && (
        <p className="measure text-muted">{post.excerpt}</p>
      )}
      <div className="flex flex-wrap gap-3 font-mono text-[0.78rem] text-faint">
        {post.publishedAt && <span>{formatDate(post.publishedAt)}</span>}
        {post.type !== "glossary" && post.type !== "note" && (
          <span>{readingLabel(post.readingTime)}</span>
        )}
        {post.tags.length > 0 && (
          <span>{post.tags.map((t) => `#${t}`).join(" ")}</span>
        )}
      </div>
    </Link>
  );
}

/** Compact one-line row for the home "Latest" feed. */
export function PostRow({ post }: { post: PostListItem }) {
  return (
    <Link
      href={postHref(post)}
      className="group grid grid-cols-[auto_1fr_auto] items-baseline gap-3.5 border-b border-border py-3.5 transition-colors hover:bg-surface"
    >
      <TypeBadge type={post.type} />
      <span className="font-medium tracking-[-0.01em] transition-colors group-hover:text-accent">
        {post.title}
      </span>
      {post.publishedAt && (
        <span className="hidden whitespace-nowrap font-mono text-[0.75rem] text-faint sm:inline">
          {formatDateShort(post.publishedAt)}
        </span>
      )}
    </Link>
  );
}

/** The type-specific chips shown on a card's top row. */
function TypeMeta({ post }: { post: PostListItem }) {
  switch (post.type) {
    case "ctf":
      return (
        <>
          {post.difficulty && <DifficultyChip difficulty={post.difficulty} />}
          {post.os && <Badge>{post.os}</Badge>}
          {post.platform && <Badge>{labelOf(PLATFORMS, post.platform)}</Badge>}
        </>
      );
    case "tool":
      return post.toolCategory ? (
        <Badge>{labelOf(TOOL_CATEGORIES, post.toolCategory)}</Badge>
      ) : null;
    case "policy":
      return post.framework ? (
        <Badge>{labelOf(FRAMEWORKS, post.framework)}</Badge>
      ) : null;
    case "glossary":
      return post.aliases && post.aliases.length > 0 ? (
        <span className="font-mono text-[0.72rem] text-faint">
          {post.aliases.join(" · ")}
        </span>
      ) : null;
    default:
      return null;
  }
}
