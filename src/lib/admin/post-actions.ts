"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/require-admin";
import { CONTENT_TYPES, type ContentType } from "@/lib/taxonomy";
import { listHref, postHref } from "@/lib/routes";
import { parsePostForm } from "./parse-post";
import type { PublishBlock } from "@/lib/publish/ctf-guards";
import {
  createDraft,
  updatePost,
  publishPost,
  unpublishPost,
  markReviewed,
  deletePost,
  getForEdit,
} from "./posts-admin";

/**
 * Server Actions for post authoring — the mutating surface of the admin.
 *
 * Every action re-verifies with `requireAdmin()` before touching data: the
 * proxy gate is optimistic and Next routes a Server Action as a POST to its
 * page, so a matcher change could silently drop coverage. The check belongs
 * here, next to the mutation. After a change that affects the public site, the
 * relevant paths are revalidated so ISR serves the update immediately.
 */

function isContentType(value: string): value is ContentType {
  return (CONTENT_TYPES as readonly string[]).includes(value);
}

/** Refresh every public surface a published post appears on. */
function revalidatePost(type: ContentType, slug: string): void {
  revalidatePath(listHref(type)); // the type's listing
  revalidatePath(postHref({ type, slug })); // the post itself
  revalidatePath("/"); // home "latest" feed
  revalidatePath("/rss.xml"); // RSS
}

export interface PostFormState {
  ok?: boolean;
  message?: string;
  errors?: Record<string, string>;
}

/**
 * Creates (when `id` is blank) or updates a post. On create, redirects to the
 * new post's editor; on update, returns a success state so the editor stays put.
 */
export async function savePost(
  _prev: PostFormState,
  formData: FormData,
): Promise<PostFormState> {
  await requireAdmin();

  const type = String(formData.get("type") ?? "");
  if (!isContentType(type)) {
    return { ok: false, errors: { type: "Unknown content type." } };
  }

  const parsed = parsePostForm(type, formData);
  if (!parsed.ok) return { ok: false, errors: parsed.errors };

  const id = String(formData.get("id") ?? "").trim();
  if (id) {
    const slug = await updatePost(id, parsed.data);
    revalidatePost(type, slug);
    return { ok: true, message: "Saved." };
  }

  const newId = await createDraft(parsed.data);
  redirect(`/admin/posts/${newId}/edit`);
}

export interface PublishState {
  ok?: boolean;
  message?: string;
  blocks?: PublishBlock[];
}

/**
 * Publishes a post. Returns the guard blocks when a hard block (flag in body,
 * active machine, unconfirmed checklist) prevents it, so the editor can show
 * exactly what to fix.
 */
export async function publish(
  _prev: PublishState,
  formData: FormData,
): Promise<PublishState> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "").trim();
  if (!id) return { ok: false, message: "Missing post id." };

  const confirmChecklist = formData.get("confirmChecklist") === "on";
  const result = await publishPost(id, { confirmChecklist });
  if (!result.ok) return { ok: false, blocks: result.blocks };

  const post = await getForEdit(id);
  if (post) revalidatePost(post.type, post.slug);
  return { ok: true, message: "Published." };
}

export async function unpublish(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "").trim();
  if (!id) return;
  const post = await getForEdit(id);
  await unpublishPost(id);
  if (post) revalidatePost(post.type, post.slug);
}

export async function markReviewedAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "").trim();
  if (!id) return;
  const post = await getForEdit(id);
  await markReviewed(id);
  if (post) revalidatePost(post.type, post.slug);
}

export async function remove(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "").trim();
  if (!id) return;
  const post = await getForEdit(id);
  await deletePost(id);
  if (post) revalidatePost(post.type, post.slug);
  redirect("/admin/posts");
}
