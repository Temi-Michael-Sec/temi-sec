import Link from "next/link";
import { requireAdmin } from "@/lib/auth/require-admin";
import { listPosts } from "@/lib/admin/posts-admin";
import { AdminNav } from "@/components/admin/AdminNav";
import { PostList } from "@/components/admin/PostList";
import { CONTENT_TYPES, type ContentType } from "@/lib/taxonomy";
import { TYPE_LABEL } from "@/lib/admin/field-schema";
import type { PostStatus } from "@/models/Post";

export const dynamic = "force-dynamic";

function isType(value: string | undefined): value is ContentType {
  return !!value && (CONTENT_TYPES as readonly string[]).includes(value);
}

function chip(active: boolean): string {
  return active
    ? "rounded-full bg-accent px-3 py-1 font-mono text-xs text-background"
    : "rounded-full border border-border px-3 py-1 font-mono text-xs text-muted hover:border-accent";
}

export default async function PostsPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; status?: string }>;
}) {
  const admin = await requireAdmin();
  const sp = await searchParams;
  const type = isType(sp.type) ? sp.type : undefined;
  const status: PostStatus | undefined =
    sp.status === "draft" || sp.status === "published" ? sp.status : undefined;

  const items = await listPosts({ type, status });

  const withStatus = (t?: string) =>
    `/admin/posts?${new URLSearchParams({
      ...(t ? { type: t } : {}),
      ...(status ? { status } : {}),
    })}`;
  const withType = (s?: string) =>
    `/admin/posts?${new URLSearchParams({
      ...(type ? { type } : {}),
      ...(s ? { status: s } : {}),
    })}`;

  return (
    <>
      <AdminNav email={admin.email} />
      <h1 className="mb-6 text-2xl font-semibold tracking-[-0.02em]">Posts</h1>

      <div className="mb-4 flex flex-wrap gap-2">
        <Link href={withStatus()} className={chip(!type)}>
          all types
        </Link>
        {CONTENT_TYPES.map((t) => (
          <Link key={t} href={withStatus(t)} className={chip(type === t)}>
            {TYPE_LABEL[t]}
          </Link>
        ))}
      </div>
      <div className="mb-6 flex flex-wrap gap-2">
        <Link href={withType()} className={chip(!status)}>
          any status
        </Link>
        <Link href={withType("draft")} className={chip(status === "draft")}>
          draft
        </Link>
        <Link
          href={withType("published")}
          className={chip(status === "published")}
        >
          published
        </Link>
      </div>

      <PostList items={items} empty="No posts match this filter." />
    </>
  );
}
