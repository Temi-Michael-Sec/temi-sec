import Link from "next/link";
import { requireAdmin } from "@/lib/auth/require-admin";
import { listPosts, postsDueForReview } from "@/lib/admin/posts-admin";
import { AdminNav } from "@/components/admin/AdminNav";
import { PostList } from "@/components/admin/PostList";
import { buttonPrimary } from "@/components/admin/styles";

// Admin data is per-request and never cached.
export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const admin = await requireAdmin();
  const [drafts, review] = await Promise.all([
    listPosts({ status: "draft" }),
    postsDueForReview(6),
  ]);

  return (
    <>
      <AdminNav email={admin.email} />

      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-[-0.02em]">Dashboard</h1>
        <Link href="/admin/posts/new" className={buttonPrimary}>
          New post
        </Link>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        <section>
          <h2 className="mb-3 font-mono text-xs uppercase tracking-wider text-faint">
            Drafts ({drafts.length})
          </h2>
          <PostList items={drafts} empty="No drafts. Start a new post." />
        </section>

        <section>
          <h2 className="mb-3 font-mono text-xs uppercase tracking-wider text-faint">
            Oldest reviews
          </h2>
          <PostList
            items={review}
            empty="Nothing published yet."
          />
        </section>
      </div>
    </>
  );
}
