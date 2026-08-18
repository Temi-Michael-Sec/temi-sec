import type { ContentType } from "@/lib/taxonomy";
import type { CoverImage } from "@/models/Post";
import type { TokenSource } from "@/lib/search/tokens";
import { isValidSlug } from "@/lib/slug";
import { TYPE_FIELDS, type FieldDescriptor } from "./field-schema";

/**
 * Parses and validates the editor's FormData into a typed post payload.
 *
 * Server-side and authoritative: the client MetaForm renders from the same
 * TYPE_FIELDS descriptors, but nothing here trusts it — every select is checked
 * against its allowed options, every required field is enforced, lengths are
 * capped. Invalid input returns field-keyed errors rather than throwing, so the
 * editor can show them inline.
 */

export interface ParsedPostData {
  type: ContentType;
  title: string;
  /** Empty when the author left it blank — the data layer generates one. */
  slug: string;
  excerpt: string;
  tags: string[];
  body: string;
  coverImage: CoverImage | null;
  references: { title: string; url: string; accessedAt: Date }[];
  /** Validated type-specific fields, keyed by field name. */
  typeFields: Record<string, unknown>;
  /** Feeds searchTokens derivation, for tool/glossary. */
  tokenSource?: TokenSource;
}

export type ParseResult =
  | { ok: true; data: ParsedPostData }
  | { ok: false; errors: Record<string, string> };

const TITLE_MAX = 200;
const EXCERPT_MAX = 400;
const SHORTDEF_MAX = 300;

function commaSplit(value: string): string[] {
  return value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Parses a "Title | URL" per-line references field. accessedAt is set now. */
function parseReferences(
  value: string,
): { title: string; url: string; accessedAt: Date }[] {
  const now = new Date();
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.split("|").map((cell) => cell.trim()))
    .filter((cells) => cells[0] && cells[1])
    .map(([title, url]) => ({ title, url, accessedAt: now }));
}

/** Splits a "lines" textarea into rows of "a | b | c" cells. */
function parseLines(value: string): string[][] {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.split("|").map((cell) => cell.trim()));
}

function parseTypeField(
  field: FieldDescriptor,
  formData: FormData,
  errors: Record<string, string>,
): unknown {
  const raw = formData.get(field.name);
  const str = typeof raw === "string" ? raw : "";

  switch (field.kind) {
    case "checkbox":
      return raw === "on" || raw === "true";

    case "multiselect": {
      const allowed = new Set(field.options?.map((o) => o.slug));
      return formData
        .getAll(field.name)
        .map(String)
        .filter((v) => allowed.has(v));
    }

    case "tags":
      return commaSplit(str);

    case "select": {
      const value = str.trim();
      const allowed = new Set(field.options?.map((o) => o.slug));
      if (value && !allowed.has(value)) {
        errors[field.name] = `"${value}" is not a valid ${field.label}.`;
        return "";
      }
      if (!value && field.required) {
        errors[field.name] = `${field.label} is required.`;
      }
      return value;
    }

    case "lines":
      return parseLinesField(field.name, str);

    case "textarea": {
      const value = str.trim();
      if (field.name === "shortDef" && value.length > SHORTDEF_MAX) {
        errors[field.name] = `${field.label} must be ${SHORTDEF_MAX} characters or fewer.`;
      }
      if (!value && field.required) {
        errors[field.name] = `${field.label} is required.`;
      }
      return value;
    }

    // text / url
    default: {
      const value = str.trim();
      if (!value && field.required) {
        errors[field.name] = `${field.label} is required.`;
      }
      return value;
    }
  }
}

/** The three object-array fields, each with its own cell layout. */
function parseLinesField(name: string, value: string): unknown[] {
  const rows = parseLines(value);
  switch (name) {
    case "installCommands":
      return rows
        .filter((cells) => cells[0] && cells[1])
        .map(([platform, command]) => ({ platform, command }));
    case "cheatsheet":
      return rows
        .filter((cells) => cells[0])
        .map(([command, description]) => ({
          command,
          description: description ?? "",
        }));
    case "downloads":
      return rows
        .filter((cells) => cells[0] && cells[1])
        .map(([label, url, format, sizeBytes]) => ({
          label,
          url,
          format: format ?? "",
          sizeBytes: Number(sizeBytes) || 0,
        }));
    default:
      return [];
  }
}

function buildTokenSource(
  type: ContentType,
  typeFields: Record<string, unknown>,
): TokenSource | undefined {
  if (type === "tool") {
    return {
      toolName: typeFields.toolName as string,
      cheatsheet: typeFields.cheatsheet as { command: string }[],
      installCommands: typeFields.installCommands as { command: string }[],
    };
  }
  if (type === "glossary") {
    return {
      term: typeFields.term as string,
      aliases: typeFields.aliases as string[],
    };
  }
  return undefined;
}

export function parsePostForm(
  type: ContentType,
  formData: FormData,
): ParseResult {
  const errors: Record<string, string> = {};

  const title = String(formData.get("title") ?? "").trim();
  if (!title) errors.title = "Title is required.";
  else if (title.length > TITLE_MAX)
    errors.title = `Title must be ${TITLE_MAX} characters or fewer.`;

  let slug = String(formData.get("slug") ?? "")
    .trim()
    .toLowerCase();
  if (slug && !isValidSlug(slug)) {
    errors.slug =
      "Slug may contain only lowercase letters, numbers and single hyphens.";
    slug = "";
  }

  const excerpt = String(formData.get("excerpt") ?? "").trim();
  if (excerpt.length > EXCERPT_MAX)
    errors.excerpt = `Excerpt must be ${EXCERPT_MAX} characters or fewer.`;

  const body = String(formData.get("body") ?? "");
  const tags = commaSplit(String(formData.get("tags") ?? ""));
  const references = parseReferences(String(formData.get("references") ?? ""));

  const coverUrl = String(formData.get("coverImageUrl") ?? "").trim();
  const coverImage: CoverImage | null = coverUrl
    ? {
        url: coverUrl,
        alt: String(formData.get("coverImageAlt") ?? "").trim(),
        width: Number(formData.get("coverImageWidth")) || 0,
        height: Number(formData.get("coverImageHeight")) || 0,
      }
    : null;

  const typeFields: Record<string, unknown> = {};
  for (const field of TYPE_FIELDS[type]) {
    typeFields[field.name] = parseTypeField(field, formData, errors);
  }

  if (Object.keys(errors).length > 0) return { ok: false, errors };

  return {
    ok: true,
    data: {
      type,
      title,
      slug,
      excerpt,
      tags,
      body,
      coverImage,
      references,
      typeFields,
      tokenSource: buildTokenSource(type, typeFields),
    },
  };
}
