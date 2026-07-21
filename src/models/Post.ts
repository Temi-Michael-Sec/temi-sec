import mongoose, { Schema, type Model } from "mongoose";
import {
  CONTENT_TYPES,
  CTF_CATEGORY_SLUGS,
  DIFFICULTY_SLUGS,
  FRAMEWORK_SLUGS,
  OPERATING_SYSTEM_SLUGS,
  PLATFORM_SLUGS,
  TOOL_CATEGORY_SLUGS,
  type ContentType,
  type CtfCategorySlug,
  type DifficultySlug,
  type FrameworkSlug,
  type OperatingSystemSlug,
  type PlatformSlug,
  type ToolCategorySlug,
} from "@/lib/taxonomy";

/**
 * One `posts` collection, six shapes, via Mongoose discriminators.
 *
 * An article, a CTF writeup, a tool reference and a policy template genuinely
 * have different metadata. Flattening them into one schema would destroy the
 * filtering that makes the site useful; separate collections would make
 * "latest across everything" a multi-collection mess.
 */

// ─── Shared sub-shapes ───────────────────────────────────────────────────────

export interface CoverImage {
  url: string;
  alt: string;
  width: number;
  height: number;
}

export interface TocEntry {
  id: string;
  text: string;
  level: number;
}

export interface Reference {
  title: string;
  url: string;
  accessedAt: Date;
}

export interface Seo {
  metaTitle?: string;
  metaDescription?: string;
  ogImage?: string;
}

export type PostStatus = "draft" | "published";

// ─── Base document ───────────────────────────────────────────────────────────

export interface PostBase {
  type: ContentType;
  title: string;
  slug: string;
  excerpt: string;
  coverImage?: CoverImage | null;
  body: string;
  bodyHtml: string;
  toc: TocEntry[];
  status: PostStatus;
  publishedAt: Date | null;
  lastReviewedAt: Date | null;
  tags: string[];
  series?: { seriesId: mongoose.Types.ObjectId; order: number } | null;
  references: Reference[];
  readingTime: number;
  views: number;
  likeCount: number;
  searchTokens: string[];
  seo: Seo;
  createdAt: Date;
  updatedAt: Date;
}

const coverImageSchema = new Schema<CoverImage>(
  {
    url: { type: String, required: true },
    // Required, not optional. An empty alt is a decision a human should make
    // deliberately; making it optional means every image silently ships
    // without one.
    alt: { type: String, required: true, default: "" },
    width: { type: Number, required: true },
    height: { type: Number, required: true },
  },
  { _id: false },
);

const tocEntrySchema = new Schema<TocEntry>(
  {
    id: { type: String, required: true },
    text: { type: String, required: true },
    level: { type: Number, required: true, min: 1, max: 6 },
  },
  { _id: false },
);

const referenceSchema = new Schema<Reference>(
  {
    title: { type: String, required: true, trim: true },
    url: { type: String, required: true, trim: true },
    accessedAt: { type: Date, required: true },
  },
  { _id: false },
);

const postSchema = new Schema<PostBase>(
  {
    type: { type: String, required: true, enum: [...CONTENT_TYPES] },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    slug: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      match: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    },
    excerpt: { type: String, default: "", trim: true, maxlength: 400 },
    coverImage: { type: coverImageSchema, default: null },

    body: { type: String, default: "" },
    // Cached render output. Written only by the publish flow, never by hand —
    // it is the sanitized artifact and must not drift from `body`.
    bodyHtml: { type: String, default: "" },
    toc: { type: [tocEntrySchema], default: [] },

    status: {
      type: String,
      required: true,
      enum: ["draft", "published"],
      default: "draft",
    },
    publishedAt: { type: Date, default: null },
    // Freshness (§9). Set at publish, bumped by the explicit review action.
    lastReviewedAt: { type: Date, default: null },

    tags: { type: [String], default: [], index: true },
    series: {
      type: new Schema(
        {
          seriesId: { type: Schema.Types.ObjectId, ref: "Series", required: true },
          order: { type: Number, required: true, min: 0 },
        },
        { _id: false },
      ),
      default: null,
    },
    references: { type: [referenceSchema], default: [] },

    readingTime: { type: Number, default: 0, min: 0 },
    views: { type: Number, default: 0, min: 0 },
    likeCount: { type: Number, default: 0, min: 0 },

    // Exact-match tokens for command syntax. See the index note below.
    searchTokens: { type: [String], default: [] },

    seo: {
      metaTitle: { type: String, trim: true, maxlength: 70 },
      metaDescription: { type: String, trim: true, maxlength: 200 },
      ogImage: { type: String, trim: true },
    },
  },
  {
    timestamps: true,
    discriminatorKey: "type",
    collection: "posts",
  },
);

// ─── Indexes ─────────────────────────────────────────────────────────────────

postSchema.index({ slug: 1 }, { unique: true });
postSchema.index({ status: 1, publishedAt: -1 });
postSchema.index({ type: 1, status: 1, publishedAt: -1 });
postSchema.index({ searchTokens: 1 });

/**
 * MongoDB permits exactly ONE text index per collection, and all six
 * discriminators share the `posts` collection. It therefore has to be declared
 * here on the base, once. Declaring another on a discriminator fails at index
 * build time — which surfaces on deploy, in production, not locally.
 *
 * Note what is absent: `cheatsheet.command`. Command syntax cannot survive a
 * text index. The tokenizer splits on and discards punctuation, and a leading
 * `-` in a `$text` query means negation — so `-oN` would be read as "exclude
 * oN". That is what `searchTokens` exists for. See structure.md §2.14.
 */
postSchema.index(
  { title: "text", excerpt: "text", body: "text" },
  {
    name: "post_text",
    weights: { title: 10, excerpt: 4, body: 1 },
  },
);

// ─── Model registration (hot-reload safe) ────────────────────────────────────

/**
 * Next's dev server re-executes modules on save. Calling `mongoose.model()`
 * twice for the same name throws `OverwriteModelError`, so registration always
 * checks the existing registry first. Same reason `lib/db.ts` caches its
 * connection on `globalThis`.
 */
function registerModel<T>(name: string, schema: Schema<T>): Model<T> {
  return (mongoose.models[name] as Model<T>) ?? mongoose.model<T>(name, schema);
}

function registerDiscriminator<T>(
  name: string,
  schema: Schema<T>,
): Model<T> {
  const existing = mongoose.models[name] as Model<T> | undefined;
  if (existing) return existing;
  return Post.discriminator<T>(name, schema as Schema);
}

export const Post = registerModel<PostBase>("Post", postSchema);

// ─── Discriminators ──────────────────────────────────────────────────────────

export interface ArticlePost extends PostBase {
  type: "article";
}

export const Article = registerDiscriminator<ArticlePost>(
  "article",
  new Schema<ArticlePost>({}),
);

// --- CTF writeup ---

export interface CtfPost extends PostBase {
  type: "ctf";
  platform: PlatformSlug;
  boxName: string;
  difficulty: DifficultySlug;
  os: OperatingSystemSlug;
  categories: CtfCategorySlug[];
  toolsUsed: string[];
  retired?: boolean;
  checklistAcceptedAt: Date | null;
}

const ctfSchema = new Schema<CtfPost>({
  platform: { type: String, required: true, enum: [...PLATFORM_SLUGS] },
  boxName: { type: String, required: true, trim: true },
  difficulty: { type: String, required: true, enum: [...DIFFICULTY_SLUGS] },
  os: { type: String, required: true, enum: [...OPERATING_SYSTEM_SLUGS] },
  categories: { type: [String], default: [], enum: [...CTF_CATEGORY_SLUGS] },
  // Slugs of `tool` posts. Powers "every box where I used linpeas".
  toolsUsed: { type: [String], default: [], index: true },

  /**
   * Deliberately NOT defaulted to `false`.
   *
   * The publish guard blocks unless this is exactly `true`, so `undefined` — a
   * writeup where nobody has confirmed retirement status — is blocked too.
   * Defaulting to `false` would work identically today, but the absence of a
   * default is the thing that documents "unset means unsafe" to whoever reads
   * this next.
   */
  retired: { type: Boolean },

  checklistAcceptedAt: { type: Date, default: null },
});

export const Ctf = registerDiscriminator<CtfPost>("ctf", ctfSchema);

// --- Tool reference ---

export interface InstallCommand {
  platform: string;
  command: string;
}

export interface CheatsheetEntry {
  command: string;
  description: string;
}

export interface ToolPost extends PostBase {
  type: "tool";
  toolName: string;
  toolCategory: ToolCategorySlug;
  officialUrl: string;
  platforms: string[];
  installCommands: InstallCommand[];
  cheatsheet: CheatsheetEntry[];
}

const toolSchema = new Schema<ToolPost>({
  toolName: { type: String, required: true, trim: true },
  toolCategory: { type: String, required: true, enum: [...TOOL_CATEGORY_SLUGS] },
  officialUrl: { type: String, default: "", trim: true },
  platforms: { type: [String], default: [] },
  installCommands: {
    type: [
      new Schema<InstallCommand>(
        {
          platform: { type: String, required: true },
          command: { type: String, required: true },
        },
        { _id: false },
      ),
    ],
    default: [],
  },
  // Feeds searchTokens at publish — not the text index. See the index note.
  cheatsheet: {
    type: [
      new Schema<CheatsheetEntry>(
        {
          command: { type: String, required: true },
          description: { type: String, default: "" },
        },
        { _id: false },
      ),
    ],
    default: [],
  },
});

export const Tool = registerDiscriminator<ToolPost>("tool", toolSchema);

// --- Policy template ---

export interface PolicyDownload {
  label: string;
  url: string;
  format: string;
  sizeBytes: number;
}

export interface PolicyPost extends PostBase {
  type: "policy";
  framework: FrameworkSlug;
  version: string;
  downloads: PolicyDownload[];
}

const policySchema = new Schema<PolicyPost>({
  framework: { type: String, required: true, enum: [...FRAMEWORK_SLUGS] },
  version: { type: String, default: "1.0", trim: true },
  downloads: {
    type: [
      new Schema<PolicyDownload>(
        {
          label: { type: String, required: true },
          url: { type: String, required: true },
          format: { type: String, required: true },
          sizeBytes: { type: Number, default: 0, min: 0 },
        },
        { _id: false },
      ),
    ],
    default: [],
  },
});

export const Policy = registerDiscriminator<PolicyPost>("policy", policySchema);

// --- Note (short-form TIL) ---

export interface NotePost extends PostBase {
  type: "note";
  source: string | null;
}

const noteSchema = new Schema<NotePost>({
  // Where it came from: a talk, a box, a CVE. Free text on purpose — this is
  // not a facet and nothing filters on it.
  source: { type: String, default: null, trim: true },
});

export const Note = registerDiscriminator<NotePost>("note", noteSchema);

// --- Glossary term ---

export interface GlossaryPost extends PostBase {
  type: "glossary";
  term: string;
  aliases: string[];
  seeAlso: string[];
  shortDef: string;
}

const glossarySchema = new Schema<GlossaryPost>({
  term: { type: String, required: true, trim: true },
  // "XSS" ↔ "Cross-Site Scripting". Matched by search and by auto-linking.
  aliases: { type: [String], default: [], index: true },
  seeAlso: { type: [String], default: [] },
  /**
   * PLAIN TEXT. Rendered as text, never as HTML.
   *
   * This bypasses the `bodyHtml` pipeline entirely — it is surfaced directly in
   * hover-cards across the site. If it were ever rendered as HTML it would be a
   * second stored-XSS path that the sanitizer never sees.
   */
  shortDef: { type: String, default: "", trim: true, maxlength: 300 },
});

export const Glossary = registerDiscriminator<GlossaryPost>(
  "glossary",
  glossarySchema,
);

export type AnyPost =
  | ArticlePost
  | CtfPost
  | ToolPost
  | PolicyPost
  | NotePost
  | GlossaryPost;
