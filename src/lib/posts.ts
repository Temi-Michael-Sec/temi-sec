import "server-only";
import { cache } from "react";
import { connectDB } from "@/lib/db";
import { Post } from "@/models/Post";
import type {
  AnyPost,
  CtfPost,
  ToolPost,
  PolicyPost,
  GlossaryPost,
  NotePost,
  TocEntry,
} from "@/models/Post";
import type { ContentType } from "@/lib/taxonomy";

/**
 * Server-only data access for posts.
 *
 * `import "server-only"` makes it a build error to import this into a client
 * component — the DB connection and query logic must never ship to the browser.
 *
 * Everything returns plain, serializable objects (`.lean()` + explicit mapping):
 * `_id` becomes a string and Mongoose document methods are dropped, so results
 * cross the server/client boundary cleanly.
 */

// ─── Serialized shapes ───────────────────────────────────────────────────────

export interface PostListItem {
  id: string;
  type: ContentType;
  title: string;
  slug: string;
  excerpt: string;
  tags: string[];
  publishedAt: Date | null;
  readingTime: number;
  // Type-specific bits surfaced in listings/cards:
  difficulty?: string;
  os?: string;
  platform?: string;
  toolCategory?: string;
  framework?: string;
  term?: string;
  aliases?: string[];
}

export interface PostDetail extends PostListItem {
  body: string;
  bodyHtml: string;
  toc: TocEntry[];
  references: { title: string; url: string; accessedAt: Date }[];
  coverImage?: { url: string; alt: string; width: number; height: number } | null;
  lastReviewedAt: Date | null;
  updatedAt: Date;
  likeCount: number;
  views: number;
  seo?: { metaTitle?: string; metaDescription?: string; ogImage?: string };
  // Type-specific detail:
  boxName?: string;
  categories?: string[];
  toolsUsed?: string[];
  retired?: boolean;
  toolName?: string;
  officialUrl?: string;
  platforms?: string[];
  installCommands?: { platform: string; command: string }[];
  cheatsheet?: { command: string; description: string }[];
  version?: string;
  downloads?: { label: string; url: string; format: string; sizeBytes: number }[];
  seeAlso?: string[];
  shortDef?: string;
  source?: string | null;
}

// Fields needed for a listing card — kept lean for speed.
const LIST_FIELDS =
  "type title slug excerpt tags publishedAt readingTime difficulty os platform toolCategory framework term aliases";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toListItem(doc: any): PostListItem {
  return {
    id: String(doc._id),
    type: doc.type,
    title: doc.title,
    slug: doc.slug,
    excerpt: doc.excerpt ?? "",
    tags: doc.tags ?? [],
    publishedAt: doc.publishedAt ?? null,
    readingTime: doc.readingTime ?? 0,
    difficulty: doc.difficulty,
    os: doc.os,
    platform: doc.platform,
    toolCategory: doc.toolCategory,
    framework: doc.framework,
    term: doc.term,
    aliases: doc.aliases,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toDetail(doc: any): PostDetail {
  return {
    ...toListItem(doc),
    body: doc.body ?? "",
    bodyHtml: doc.bodyHtml ?? "",
    toc: doc.toc ?? [],
    references: doc.references ?? [],
    coverImage: doc.coverImage ?? null,
    lastReviewedAt: doc.lastReviewedAt ?? null,
    updatedAt: doc.updatedAt,
    likeCount: doc.likeCount ?? 0,
    views: doc.views ?? 0,
    seo: doc.seo,
    boxName: (doc as CtfPost).boxName,
    categories: (doc as CtfPost).categories,
    toolsUsed: (doc as CtfPost).toolsUsed,
    retired: (doc as CtfPost).retired,
    toolName: (doc as ToolPost).toolName,
    officialUrl: (doc as ToolPost).officialUrl,
    platforms: (doc as ToolPost).platforms,
    installCommands: (doc as ToolPost).installCommands,
    cheatsheet: (doc as ToolPost).cheatsheet,
    version: (doc as PolicyPost).version,
    downloads: (doc as PolicyPost).downloads,
    seeAlso: (doc as GlossaryPost).seeAlso,
    shortDef: (doc as GlossaryPost).shortDef,
    source: (doc as NotePost).source,
  };
}

const PUBLISHED = { status: "published" as const };

// ─── Queries ─────────────────────────────────────────────────────────────────

/**
 * Latest posts across types, newest first. `exclude` drops types that don't
 * belong in a mixed feed — glossary by default (it has its own A–Z index).
 */
export async function getLatest(
  limit = 6,
  exclude: ContentType[] = ["glossary"],
): Promise<PostListItem[]> {
  await connectDB();
  const docs = await Post.find({ ...PUBLISHED, type: { $nin: exclude } })
    .select(LIST_FIELDS)
    .sort({ publishedAt: -1 })
    .limit(limit)
    .lean();
  return docs.map(toListItem);
}

/** Published posts of a single type, newest first, with pagination. */
export async function getByType(
  type: ContentType,
  { limit = 20, skip = 0 }: { limit?: number; skip?: number } = {},
): Promise<PostListItem[]> {
  await connectDB();
  const docs = await Post.find({ ...PUBLISHED, type })
    .select(LIST_FIELDS)
    .sort({ publishedAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();
  return docs.map(toListItem);
}

export async function countByType(type: ContentType): Promise<number> {
  await connectDB();
  return Post.countDocuments({ ...PUBLISHED, type });
}

/** Counts per type, for the home "Explore" pillars. */
export async function getTypeCounts(): Promise<Record<string, number>> {
  await connectDB();
  const rows = await Post.aggregate<{ _id: ContentType; n: number }>([
    { $match: PUBLISHED },
    { $group: { _id: "$type", n: { $sum: 1 } } },
  ]);
  return Object.fromEntries(rows.map((r) => [r._id, r.n]));
}

/**
 * A single published post by slug (any type), or null.
 *
 * Wrapped in React `cache()` so the two calls in a post request —
 * `generateMetadata` and the page body — share one DB query instead of two.
 */
export const getBySlug = cache(
  async (slug: string): Promise<PostDetail | null> => {
    await connectDB();
    const doc = await Post.findOne({ ...PUBLISHED, slug }).lean();
    return doc ? toDetail(doc) : null;
  },
);

/** Every published (type, slug) pair — for generateStaticParams and sitemap. */
export async function getAllPublished(): Promise<
  { type: ContentType; slug: string; updatedAt: Date }[]
> {
  await connectDB();
  const docs = await Post.find(PUBLISHED)
    .select("type slug updatedAt")
    .lean();
  return docs.map((d) => ({
    type: d.type as ContentType,
    slug: d.slug,
    updatedAt: (d as unknown as AnyPost).updatedAt,
  }));
}

/**
 * Slugs of one type, for a page's `generateStaticParams`. Resilient: if the DB
 * is unreachable at build time, it returns [] and the pages fall back to
 * on-demand rendering (dynamicParams) rather than failing the whole build.
 */
export async function staticSlugsForType(
  type: ContentType,
): Promise<{ slug: string }[]> {
  try {
    const all = await getAllPublished();
    return all.filter((p) => p.type === type).map((p) => ({ slug: p.slug }));
  } catch {
    return [];
  }
}

/** Published posts carrying a given tag, newest first. */
export async function getByTag(tag: string): Promise<PostListItem[]> {
  await connectDB();
  const docs = await Post.find({ ...PUBLISHED, tags: tag })
    .select(LIST_FIELDS)
    .sort({ publishedAt: -1 })
    .lean();
  return docs.map(toListItem);
}

/** CTF writeups that reference a given tool slug — for tool cross-links. */
export async function getWriteupsUsingTool(
  toolSlug: string,
): Promise<PostListItem[]> {
  await connectDB();
  const docs = await Post.find({ ...PUBLISHED, type: "ctf", toolsUsed: toolSlug })
    .select(LIST_FIELDS)
    .sort({ publishedAt: -1 })
    .lean();
  return docs.map(toListItem);
}
