import Link from "next/link";
import type { AdminPostListItem } from "@/lib/admin/posts-admin";
import { TYPE_LABEL } from "@/lib/admin/field-schema";

/** A compact list of posts linking each to its editor. */
export function PostList({
  items,
  empty = "Nothing here yet.",
}: {
  items: AdminPostListItem[];
  empty?: string;
}) {
  if (items.length === 0) {
    return <p className="text-sm text-faint">{empty}</p>;
  }
  return (
    <ul className="divide-y divide-border rounded-md border border-border">
      {items.map((post) => (
        <li key={post.id}>
          <Link
            href={`/admin/posts/${post.id}/edit`}
            className="flex items-center justify-between gap-4 px-4 py-3 transition-colors hover:bg-surface"
          >
            <span className="min-w-0">
              <span className="block truncate text-sm text-foreground">
                {post.title}
              </span>
              <span className="font-mono text-xs text-faint">
                {TYPE_LABEL[post.type]}
              </span>
            </span>
            <span className="flex shrink-0 items-center gap-3">
              <span
                className={
                  post.status === "published"
                    ? "font-mono text-xs text-ok"
                    : "font-mono text-xs text-warn"
                }
              >
                {post.status}
              </span>
              <span className="hidden font-mono text-xs text-faint sm:inline">
                {new Date(post.updatedAt).toLocaleDateString()}
              </span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
