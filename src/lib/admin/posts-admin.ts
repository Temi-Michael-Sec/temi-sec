import "server-only";
import mongoose, { type Model } from "mongoose";
import { connectDB } from "@/lib/db";
import {
  Post,
  Article,
  Ctf,
  Tool,
  Policy,
  Note,
  Glossary,
  type PostStatus,
  type CoverImage,
} from "@/models/Post";
import type { ContentType } from "@/lib/taxonomy";
import type { TokenSource } from "@/lib/search/tokens";
import { toDetail as toPublicDetail, type PostDetail } from "@/lib/posts";
import { slugify } from "@/lib/slug";
import { deriveContent } from "@/lib/publish/derive";
import { evaluatePublishGuards, type GuardResult } from "@/lib/publish/ctf-guards";
import { applyTransition } from "@/lib/publish/transitions";
import { TYPE_FIELDS } from "./field-schema";
import type { ParsedPostData } from "./parse-post";

/**
 * Draft-aware data access + mutations for the admin.
 *
 * The public layer (lib/posts.ts) hard-filters `status: "published"` and must
 * stay that way — it is the boundary that guarantees drafts never leak. This is
 * its counterpart: it reads every status and is the ONLY module that writes
 * posts at runtime. It is `server-only` and every caller reaches it through a
 * Server Action that has already run `requireAdmin()`.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const MODEL_BY_TYPE: Record<ContentType, Model<any>> = {
  article: Article,
  ctf: Ctf,
  tool: Tool,
  policy: Policy,
  note: Note,
  glossary: Glossary,
};

// ─── Serialized shapes for the editor ────────────────────────────────────────

export interface AdminPostListItem {
  id: string;
  type: ContentType;
  title: string;
  slug: string;
  status: PostStatus;
  updatedAt: string;
  publishedAt: string | null;
  lastReviewedAt: string | null;
}

export interface AdminPostDetail {
  id: string;
  type: ContentType;
  title: string;
  slug: string;
  excerpt: string;
  tags: string[];
  body: string;
  coverImage: CoverImage | null;
  status: PostStatus;
  publishedAt: string | null;
  lastReviewedAt: string | null;
  checklistAcceptedAt: string | null;
  /** Type-specific fields, keyed by field name (see field-schema.ts). */
  fields: Record<string, unknown>;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toListItem(doc: any): AdminPostListItem {
  return {
    id: String(doc._id),
    type: doc.type,
    title: doc.title,
    slug: doc.slug,
    status: doc.status,
    updatedAt: iso(doc.updatedAt)!,
    publishedAt: iso(doc.publishedAt),
    lastReviewedAt: iso(doc.lastReviewedAt),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toDetail(doc: any): AdminPostDetail {
  const fields: Record<string, unknown> = {};
  for (const field of TYPE_FIELDS[doc.type as ContentType]) {
    fields[field.name] = doc[field.name];
  }
  return {
    id: String(doc._id),
    type: doc.type,
    title: doc.title,
    slug: doc.slug,
    excerpt: doc.excerpt ?? "",
    tags: doc.tags ?? [],
    body: doc.body ?? "",
    coverImage: doc.coverImage ?? null,
    status: doc.status,
    publishedAt: iso(doc.publishedAt),
    lastReviewedAt: iso(doc.lastReviewedAt),
    checklistAcceptedAt: iso(doc.checklistAcceptedAt),
    fields,
  };
}

function iso(value: Date | null | undefined): string | null {
  return value ? new Date(value).toISOString() : null;
}

// ─── Reads ───────────────────────────────────────────────────────────────────

export async function listPosts(filter: {
  type?: ContentType;
  status?: PostStatus;
} = {}): Promise<AdminPostListItem[]> {
  await connectDB();
  const query: Record<string, unknown> = {};
  if (filter.type) query.type = filter.type;
  if (filter.status) query.status = filter.status;
  const docs = await Post.find(query)
    .select("type title slug status updatedAt publishedAt lastReviewedAt")
    .sort({ updatedAt: -1 })
    .lean();
  return docs.map(toListItem);
}

/** A single post of any status, for the editor. Null if the id is unknown. */
export async function getForEdit(id: string): Promise<AdminPostDetail | null> {
  // Guard malformed ids so a bad URL 404s instead of throwing a CastError.
  if (!mongoose.isValidObjectId(id)) return null;
  await connectDB();
  const doc = await Post.findById(id).lean();
  return doc ? toDetail(doc) : null;
}

/**
 * A single post of ANY status as a public-shaped `PostDetail`, for the admin
 * draft preview — so the preview renders through the exact same components the
 * live pages use. Draft-reading is confined here (behind requireAdmin); the
 * public layer in posts.ts stays published-only.
 */
export async function getForPreview(
  id: string,
): Promise<{ post: PostDetail; status: PostStatus } | null> {
  if (!mongoose.isValidObjectId(id)) return null;
  await connectDB();
  const doc = await Post.findById(id).lean();
  if (!doc) return null;
  // PostDetail omits `status` (public posts are always published); the preview
  // needs it for the draft/live banner, so return it alongside.
  return { post: toPublicDetail(doc), status: (doc as { status: PostStatus }).status };
}

/** Just a post's status — cheap, for the autosave draft-only guard. */
export async function getPostStatus(id: string): Promise<PostStatus | null> {
  if (!mongoose.isValidObjectId(id)) return null;
  await connectDB();
  const doc = await Post.findById(id).select("status").lean();
  return doc ? (doc.status as PostStatus) : null;
}

/** Posts whose review is stale, oldest first — for the dashboard freshness list. */
export async function postsDueForReview(limit = 10): Promise<AdminPostListItem[]> {
  await connectDB();
  const docs = await Post.find({ status: "published", type: { $ne: "ctf" } })
    .select("type title slug status updatedAt publishedAt lastReviewedAt")
    .sort({ lastReviewedAt: 1 })
    .limit(limit)
    .lean();
  return docs.map(toListItem);
}

// ─── Writes ──────────────────────────────────────────────────────────────────

/** A slug not already taken by another post. Appends -2, -3… on collision. */
async function uniqueSlug(base: string, excludeId?: string): Promise<string> {
  const root = base || "post";
  for (let n = 1; ; n += 1) {
    const candidate = n === 1 ? root : `${root}-${n}`;
    const query: Record<string, unknown> = { slug: candidate };
    if (excludeId) query._id = { $ne: excludeId };
    if (!(await Post.exists(query))) return candidate;
  }
}

/** Builds the token source for search-token derivation from a live document. */
function tokenSourceFor(doc: Record<string, unknown>): TokenSource | undefined {
  if (doc.type === "tool") {
    return {
      toolName: doc.toolName as string,
      cheatsheet: doc.cheatsheet as { command: string }[],
      installCommands: doc.installCommands as { command: string }[],
    };
  }
  if (doc.type === "glossary") {
    return { term: doc.term as string, aliases: doc.aliases as string[] };
  }
  return undefined;
}

/** Creates a draft. Returns the new id. */
export async function createDraft(data: ParsedPostData): Promise<string> {
  await connectDB();
  const model = MODEL_BY_TYPE[data.type];
  const slug = await uniqueSlug(data.slug || slugify(data.title));
  const derived = await deriveContent(data.body, data.tokenSource);

  const doc = await model.create({
    type: data.type,
    title: data.title,
    slug,
    excerpt: data.excerpt,
    tags: data.tags,
    coverImage: data.coverImage,
    body: data.body,
    ...data.typeFields,
    ...derived,
    status: "draft",
  });
  return String(doc._id);
}

/**
 * Updates an existing post's content and re-derives its cached HTML. Never
 * changes `type` or `status` — publishing is a separate, guarded transition.
 * Returns the (possibly de-duplicated) slug.
 */
export async function updatePost(
  id: string,
  data: ParsedPostData,
): Promise<string> {
  await connectDB();
  const post = await Post.findById(id);
  if (!post) throw new Error("Post not found.");

  const slug = await uniqueSlug(data.slug || slugify(data.title), id);
  const derived = await deriveContent(data.body, data.tokenSource);

  post.set({
    title: data.title,
    slug,
    excerpt: data.excerpt,
    tags: data.tags,
    coverImage: data.coverImage,
    body: data.body,
    ...data.typeFields,
    ...derived,
  });
  await post.save(); // runs schema validators (enums, lengths, slug shape)
  return slug;
}

/**
 * Publishes a post if every hard block clears. Returns the guard result: on
 * `ok: false` nothing was written and `blocks` explains why. For a CTF,
 * `confirmChecklist` records the pre-publish checklist acceptance in the same
 * call, so the checklist guard is satisfied by the act of confirming.
 */
export async function publishPost(
  id: string,
  { confirmChecklist = false }: { confirmChecklist?: boolean } = {},
): Promise<GuardResult> {
  await connectDB();
  const post = await Post.findById(id);
  if (!post) throw new Error("Post not found.");
  const doc = post as unknown as Record<string, unknown>;

  if (post.type === "ctf" && confirmChecklist) {
    post.set("checklistAcceptedAt", new Date());
  }

  const guard = evaluatePublishGuards({
    type: post.type,
    body: post.body,
    platform: doc.platform as string | undefined,
    retired: doc.retired as boolean | undefined,
    checklistAcceptedAt: doc.checklistAcceptedAt as Date | null | undefined,
  });
  if (!guard.ok) return guard;

  const derived = await deriveContent(post.body, tokenSourceFor(doc));
  post.set({
    ...derived,
    status: applyTransition(post.status, "publish"),
    publishedAt: post.publishedAt ?? new Date(),
    lastReviewedAt: new Date(),
  });
  await post.save();
  return guard;
}

/** Reverts a published post to draft — it drops off the public site at once. */
export async function unpublishPost(id: string): Promise<void> {
  await connectDB();
  const post = await Post.findById(id);
  if (!post) throw new Error("Post not found.");
  post.set("status", applyTransition(post.status, "unpublish"));
  await post.save();
}

/** Records a fresh review ("Reviewed, still accurate"). */
export async function markReviewed(id: string): Promise<void> {
  await connectDB();
  const post = await Post.findById(id);
  if (!post) throw new Error("Post not found.");
  post.set("lastReviewedAt", new Date());
  await post.save();
}

/** Permanently removes a post. */
export async function deletePost(id: string): Promise<void> {
  await connectDB();
  await Post.deleteOne({ _id: id });
}
