import {
  CTF_CATEGORIES,
  DIFFICULTIES,
  FRAMEWORKS,
  OPERATING_SYSTEMS,
  PLATFORMS,
  TOOL_CATEGORIES,
  type ContentType,
} from "@/lib/taxonomy";

/**
 * Per-type metadata field descriptors — the single source that drives BOTH the
 * editor form (MetaForm renders from this) and the form parser (parse-post.ts
 * reads from this). The taxonomy has the controlled vocabularies but no notion
 * of which fields a `ctf` needs versus a `tool`; that knowledge lived implicitly
 * in the discriminator schemas' `required` clauses. This makes it explicit and
 * declarative, so adding a field is one entry here, not edits in three places.
 *
 * Base fields common to every type — title, slug, excerpt, tags, cover image,
 * body — are handled by the editor shell directly and are not repeated here.
 */

/** Human label for each content type — used by the editor and the type picker. */
export const TYPE_LABEL: Record<ContentType, string> = {
  article: "Article",
  ctf: "CTF writeup",
  tool: "Tool reference",
  policy: "Policy template",
  note: "Note",
  glossary: "Glossary term",
};

export type FieldKind =
  | "text"
  | "url"
  | "textarea"
  | "checkbox"
  | "select"
  | "multiselect"
  | "tags"
  | "lines";

export interface FieldOption {
  slug: string;
  label: string;
}

export interface FieldDescriptor {
  /** Form field name and the Post field it maps to. */
  name: string;
  label: string;
  kind: FieldKind;
  required?: boolean;
  /** For select / multiselect. */
  options?: readonly FieldOption[];
  placeholder?: string;
  help?: string;
}

function optionsFrom(
  facets: readonly { slug: string; label: string }[],
): FieldOption[] {
  return facets.map((f) => ({ slug: f.slug, label: f.label }));
}

export const TYPE_FIELDS: Record<ContentType, readonly FieldDescriptor[]> = {
  article: [],

  ctf: [
    { name: "boxName", label: "Box / room name", kind: "text", required: true },
    {
      name: "platform",
      label: "Platform",
      kind: "select",
      required: true,
      options: optionsFrom(PLATFORMS),
    },
    {
      name: "difficulty",
      label: "Difficulty",
      kind: "select",
      required: true,
      options: optionsFrom(DIFFICULTIES),
    },
    {
      name: "os",
      label: "Operating system",
      kind: "select",
      required: true,
      options: optionsFrom(OPERATING_SYSTEMS),
    },
    {
      name: "categories",
      label: "Categories",
      kind: "multiselect",
      options: optionsFrom(CTF_CATEGORIES),
    },
    {
      name: "toolsUsed",
      label: "Tools used",
      kind: "tags",
      help: "Slugs of tool posts, comma-separated.",
    },
    {
      name: "retired",
      label: "Machine is retired / writeups permitted",
      kind: "checkbox",
      help: "Required to publish a HackTheBox writeup.",
    },
  ],

  tool: [
    { name: "toolName", label: "Tool name", kind: "text", required: true },
    {
      name: "toolCategory",
      label: "Category",
      kind: "select",
      required: true,
      options: optionsFrom(TOOL_CATEGORIES),
    },
    { name: "officialUrl", label: "Official URL", kind: "url" },
    {
      name: "platforms",
      label: "Platforms",
      kind: "tags",
      help: "e.g. linux, macos, windows",
    },
    {
      name: "installCommands",
      label: "Install commands",
      kind: "lines",
      help: "One per line — platform | command",
    },
    {
      name: "cheatsheet",
      label: "Cheatsheet",
      kind: "lines",
      help: "One per line — command | description",
    },
  ],

  policy: [
    {
      name: "framework",
      label: "Framework",
      kind: "select",
      required: true,
      options: optionsFrom(FRAMEWORKS),
    },
    { name: "version", label: "Version", kind: "text", placeholder: "1.0" },
    {
      name: "downloads",
      label: "Downloads",
      kind: "lines",
      help: "One per line — label | url | format | sizeBytes",
    },
  ],

  note: [
    {
      name: "source",
      label: "Source",
      kind: "text",
      help: "A talk, a box, a CVE — free text.",
    },
  ],

  glossary: [
    { name: "term", label: "Term", kind: "text", required: true },
    {
      name: "aliases",
      label: "Aliases",
      kind: "tags",
      help: "e.g. XSS, Cross-Site Scripting",
    },
    { name: "seeAlso", label: "See also", kind: "tags", help: "Related glossary slugs." },
    {
      name: "shortDef",
      label: "Short definition",
      kind: "textarea",
      help: "Plain text only — shown in hover cards. Max 300 characters.",
    },
  ],
};
