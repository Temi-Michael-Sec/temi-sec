import type { PostDetail } from "@/lib/posts";
import { PostBody } from "./PostBody";
import { CoverImage } from "./CoverImage";
import { TableOfContents } from "./TableOfContents";
import { References } from "./References";
import { StaleBanner } from "./StaleBanner";

/**
 * Two-column reading layout: the article, and a sticky table-of-contents rail
 * that collapses away on narrow screens. Used by the long-form types (article,
 * CTF, note); tool/policy/glossary have their own dedicated layouts.
 *
 * `header` is the type-specific block above the body (the CTF metadata infobox,
 * the article title, etc.). `showStale` and `showToc` let a caller opt out —
 * CTF writeups suppress the stale banner because they're historical records.
 */
export function PostShell({
  post,
  header,
  showToc = true,
  showStale = true,
}: {
  post: PostDetail;
  header: React.ReactNode;
  showToc?: boolean;
  showStale?: boolean;
}) {
  const hasToc = showToc && post.toc.length > 0;

  return (
    <div className="mx-auto max-w-5xl px-5">
      {header}
      <CoverImage image={post.coverImage} />
      <div
        className={
          hasToc
            ? "grid gap-10 py-8 lg:grid-cols-[minmax(0,1fr)_15rem]"
            : "py-8"
        }
      >
        <article className="min-w-0">
          {showStale && <StaleBanner lastReviewedAt={post.lastReviewedAt} />}
          <PostBody html={post.bodyHtml} />
          <References references={post.references} />
        </article>
        {hasToc && (
          <aside className="self-start lg:sticky lg:top-20">
            <TableOfContents toc={post.toc} />
          </aside>
        )}
      </div>
    </div>
  );
}
