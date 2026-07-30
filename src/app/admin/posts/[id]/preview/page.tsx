import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth/require-admin";
import { getForPreview } from "@/lib/admin/posts-admin";
import { PostPreview } from "@/components/admin/PostPreview";

export const dynamic = "force-dynamic";

export default async function PreviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const preview = await getForPreview(id);
  if (!preview) notFound();

  const { post, status } = preview;
  const isDraft = status !== "published";

  return (
    <>
      <div
        className={`sticky top-0 z-40 flex items-center justify-between gap-4 border-b px-5 py-2 text-xs ${
          isDraft
            ? "border-warn/40 bg-warn/10 text-warn"
            : "border-ok/40 bg-ok/10 text-ok"
        }`}
      >
        <span className="font-mono">
          {isDraft
            ? "Draft preview — not published. This is how it will look once you publish."
            : "Preview of the live, published post."}
        </span>
        <Link
          href={`/admin/posts/${id}/edit`}
          className="font-mono underline-offset-4 hover:underline"
        >
          ← back to editor
        </Link>
      </div>
      <PostPreview post={post} />
    </>
  );
}
