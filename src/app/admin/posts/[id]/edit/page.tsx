import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth/require-admin";
import { AdminNav } from "@/components/admin/AdminNav";
import { PostEditor } from "@/components/admin/PostEditor";
import { getForEdit } from "@/lib/admin/posts-admin";

export const dynamic = "force-dynamic";

export default async function EditPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const admin = await requireAdmin();
  const { id } = await params;
  const post = await getForEdit(id);
  if (!post) notFound();

  return (
    <>
      <AdminNav email={admin.email} />
      <PostEditor mode="edit" type={post.type} post={post} />
    </>
  );
}
