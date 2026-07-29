import Link from "next/link";
import { requireAdmin } from "@/lib/auth/require-admin";
import { AdminNav } from "@/components/admin/AdminNav";
import { PostEditor } from "@/components/admin/PostEditor";
import { CONTENT_TYPES, type ContentType } from "@/lib/taxonomy";
import { TYPE_LABEL } from "@/lib/admin/field-schema";

export const dynamic = "force-dynamic";

function isType(value: string | undefined): value is ContentType {
  return !!value && (CONTENT_TYPES as readonly string[]).includes(value);
}

export default async function NewPostPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const admin = await requireAdmin();
  const sp = await searchParams;
  const type = isType(sp.type) ? sp.type : null;

  return (
    <>
      <AdminNav email={admin.email} />
      {type ? (
        <PostEditor mode="new" type={type} />
      ) : (
        <>
          <h1 className="mb-6 text-2xl font-semibold tracking-[-0.02em]">
            New post — pick a type
          </h1>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {CONTENT_TYPES.map((t) => (
              <Link
                key={t}
                href={`/admin/posts/new?type=${t}`}
                className="rounded-md border border-border bg-surface p-4 transition-colors hover:border-accent"
              >
                <span className="block text-sm font-medium text-foreground">
                  {TYPE_LABEL[t]}
                </span>
                <span className="font-mono text-xs text-faint">{t}</span>
              </Link>
            ))}
          </div>
        </>
      )}
    </>
  );
}
