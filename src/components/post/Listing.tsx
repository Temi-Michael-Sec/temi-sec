import type { PostListItem } from "@/lib/posts";
import { PostCard } from "./PostCard";
import { Prompt } from "./Prompt";

/**
 * Reusable index/listing layout: the terminal eyebrow, a title + intro, and the
 * post cards. Filter chips arrive in Phase 5 (faceted URLs); for now a listing
 * is a straight reverse-chronological view of one content type.
 */
export function Listing({
  title,
  intro,
  promptPath,
  posts,
  emptyText = "Nothing published here yet.",
}: {
  title: string;
  intro: string;
  promptPath: string;
  posts: PostListItem[];
  emptyText?: string;
}) {
  return (
    <div className="mx-auto max-w-5xl px-5">
      <header className="pb-4 pt-14">
        <Prompt kind="listing" path={promptPath} className="text-faint" />
        <h1 className="mt-3 text-[clamp(1.9rem,4vw,2.5rem)] font-semibold tracking-[-0.02em]">
          {title}
        </h1>
        <p className="mt-2 max-w-[60ch] text-muted">{intro}</p>
      </header>

      {posts.length === 0 ? (
        <p className="border-t border-border py-12 font-mono text-sm text-faint">
          {emptyText}
        </p>
      ) : (
        <div className="border-t border-border">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}

      <div className="h-16" />
    </div>
  );
}
