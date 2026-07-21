# Structure

Folder layout and complete data model reference.

> **Status: planned.** Nothing is built yet. This is the target structure —
> update it as reality diverges. It is a source of truth, so it must not drift.

Related: [`README.md`](README.md) · [`implementation.md`](implementation.md) · [`PLAN.md`](PLAN.md)

---

## 1. Folder layout

```
blog-page/
├── README.md
├── structure.md                    ← this file
├── implementation.md
├── PLAN.md
│
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx                        Home
│   │   ├── globals.css
│   │   │
│   │   ├── blog/
│   │   │   ├── page.tsx                    Article index
│   │   │   └── [slug]/page.tsx
│   │   ├── notes/
│   │   │   ├── page.tsx                    TIL feed
│   │   │   └── [slug]/page.tsx
│   │   ├── ctf/
│   │   │   ├── page.tsx                    Browse + combined filters (noindex)
│   │   │   ├── [slug]/page.tsx
│   │   │   ├── platform/[platform]/page.tsx    ← indexed facet page
│   │   │   ├── difficulty/[level]/page.tsx     ←
│   │   │   └── category/[category]/page.tsx    ←
│   │   ├── tools/
│   │   │   ├── page.tsx
│   │   │   ├── [slug]/page.tsx
│   │   │   └── category/[category]/page.tsx    ←
│   │   ├── policies/
│   │   │   ├── page.tsx
│   │   │   ├── [slug]/page.tsx
│   │   │   └── framework/[framework]/page.tsx  ←
│   │   ├── glossary/
│   │   │   ├── page.tsx                    A–Z index
│   │   │   └── [term]/page.tsx             ←
│   │   ├── series/
│   │   │   ├── page.tsx
│   │   │   └── [slug]/page.tsx
│   │   ├── tags/[tag]/page.tsx
│   │   ├── search/page.tsx
│   │   ├── about/page.tsx
│   │   ├── security/page.tsx               How this site is hardened
│   │   ├── subscribe/page.tsx
│   │   ├── rss.xml/route.ts
│   │   ├── sitemap.ts
│   │   ├── robots.ts
│   │   │
│   │   ├── admin/
│   │   │   ├── layout.tsx                  Gated shell
│   │   │   ├── login/page.tsx
│   │   │   ├── page.tsx                    Dashboard
│   │   │   ├── posts/
│   │   │   │   ├── page.tsx
│   │   │   │   ├── new/page.tsx
│   │   │   │   └── [id]/edit/page.tsx      Editor
│   │   │   ├── series/page.tsx
│   │   │   ├── comments/page.tsx           Held + reported only
│   │   │   ├── commenters/page.tsx         Trusted / banned
│   │   │   ├── media/page.tsx
│   │   │   ├── review/page.tsx             Freshness queue
│   │   │   ├── subscribers/page.tsx
│   │   │   └── newsletter/page.tsx
│   │   │
│   │   └── api/
│   │       ├── auth/
│   │       │   ├── login/route.ts          Admin
│   │       │   ├── logout/route.ts
│   │       │   └── oauth/
│   │       │       ├── [provider]/route.ts         Initiate
│   │       │       └── [provider]/callback/route.ts
│   │       ├── comments/
│   │       │   ├── route.ts                POST create, GET list
│   │       │   ├── [id]/route.ts           PATCH edit, DELETE
│   │       │   └── [id]/report/route.ts
│   │       ├── likes/[postId]/route.ts
│   │       ├── subscribe/route.ts
│   │       ├── subscribe/confirm/route.ts
│   │       ├── unsubscribe/route.ts
│   │       ├── search/route.ts
│   │       └── admin/
│   │           ├── posts/route.ts
│   │           ├── posts/[id]/route.ts
│   │           ├── posts/[id]/publish/route.ts     ← runs publish guards
│   │           ├── posts/[id]/review/route.ts      ← bump lastReviewedAt
│   │           ├── media/upload/route.ts
│   │           ├── comments/[id]/route.ts
│   │           └── newsletter/send/route.ts
│   │
│   ├── components/
│   │   ├── ui/                     Buttons, inputs, cards, badges
│   │   ├── layout/                 Header, Footer, Nav, ThemeToggle
│   │   ├── post/
│   │   │   ├── PostBody.tsx        Renders sanitized HTML
│   │   │   ├── TableOfContents.tsx
│   │   │   ├── CodeBlock.tsx       Copy button, terminal variant
│   │   │   ├── Callout.tsx
│   │   │   ├── Spoiler.tsx
│   │   │   ├── FlagRedacted.tsx
│   │   │   ├── References.tsx
│   │   │   ├── StaleBanner.tsx     >18 months since review
│   │   │   ├── ShareButtons.tsx
│   │   │   └── LikeButton.tsx
│   │   ├── comments/
│   │   │   ├── CommentThread.tsx
│   │   │   ├── CommentForm.tsx
│   │   │   ├── CommentItem.tsx
│   │   │   └── SignInPrompt.tsx
│   │   ├── filters/
│   │   │   ├── FacetChips.tsx
│   │   │   └── FilterBar.tsx
│   │   └── admin/
│   │       ├── Editor.tsx          Split-pane Markdown
│   │       ├── EditorToolbar.tsx
│   │       ├── PreviewPane.tsx
│   │       ├── ImageDropzone.tsx
│   │       ├── TaxonomyPicker.tsx
│   │       ├── PublishDialog.tsx   Guards + CTF checklist
│   │       └── MediaLibrary.tsx
│   │
│   ├── lib/
│   │   ├── db.ts                   Mongoose connection (cached)
│   │   ├── taxonomy.ts             ← single source of truth for all facets
│   │   ├── auth/
│   │   │   ├── session.ts          jose sign/verify
│   │   │   ├── admin.ts
│   │   │   └── oauth.ts            GitHub + Google
│   │   ├── markdown/
│   │   │   ├── render.ts           Post pipeline (§4.1)
│   │   │   ├── sanitize-schema.ts  Posts only — comments have no schema
│   │   │   ├── directives.ts       callout, spoiler, flag, youtube
│   │   │   └── toc.ts              from hast AFTER rehype-slug, not from source
│   │   ├── publish/
│   │   │   ├── guards.ts           Active-machine block, flag scanner
│   │   │   └── flag-patterns.ts
│   │   ├── comments/
│   │   │   ├── render.ts           escape + <br> + <code>. No parser. (§4.2)
│   │   │   ├── filters.ts          Rate, honeypot, links, patterns
│   │   │   └── moderation.ts
│   │   ├── cloudinary.ts
│   │   ├── email/
│   │   │   ├── provider.ts         EmailProvider interface + canSendBulk gate
│   │   │   ├── console.ts          dev — logs confirm link, deterministic
│   │   │   ├── resend.ts
│   │   │   └── templates/
│   │   ├── ratelimit.ts            Upstash — see trap note in implementation.md
│   │   ├── client-ip.ts            x-vercel-forwarded-for, NOT raw x-forwarded-for
│   │   ├── hash.ts                 HMAC-SHA256 IP hashing with server-side pepper
│   │   ├── reading-time.ts
│   │   └── seo.ts
│   │
│   ├── models/
│   │   ├── Post.ts                 Base + discriminators
│   │   ├── Series.ts
│   │   ├── Comment.ts
│   │   ├── CommentUser.ts
│   │   ├── Like.ts
│   │   ├── Subscriber.ts
│   │   ├── MediaAsset.ts
│   │   └── User.ts                 Admin
│   │
│   ├── types/
│   └── proxy.ts                    Optimistic admin gate. Next 16 renamed
│                                   middleware→proxy; runtime is nodejs.
│
├── public/
│   └── .well-known/security.txt
│
├── .env.example
├── next.config.ts
├── tsconfig.json
└── package.json
```

---

## 2. Data model

MongoDB via Mongoose. `Post` uses **discriminators** — one collection, shared
base fields, type-specific extensions.

### 2.1 `Post` — base

| Field | Type | Notes |
|---|---|---|
| `type` | enum | `article` `ctf` `tool` `policy` `note` `glossary` |
| `title` | string | required |
| `slug` | string | **unique, indexed** |
| `excerpt` | string | listings + meta description fallback |
| `coverImage` | `{url, alt, width, height}` | null for `note` |
| `body` | string | Markdown source — the durable record |
| `bodyHtml` | string | rendered + sanitized, cached at publish |
| `toc` | `[{id, text, level}]` | extracted at publish |
| `status` | enum | `draft` `published` |
| `publishedAt` | Date \| null | |
| `updatedAt` | Date | |
| `lastReviewedAt` | Date \| null | freshness — see §2.9 |
| `tags` | string[] | free text, secondary layer |
| `series` | `{seriesId, order}` \| null | |
| `references` | `[{title, url, accessedAt}]` | structured citations |
| `readingTime` | number | minutes |
| `views` | number | |
| `likeCount` | number | denormalized from `Like` |
| `searchTokens` | string[] | exact-match tokens — see §2.14 |
| `seo` | `{metaTitle, metaDescription, ogImage}` | |

### Indexes — two constraints that bite

```
slug                         unique
{type, status, publishedAt}  compound, -1 on publishedAt
{tags}
{searchTokens}
{title, excerpt, body}       TEXT — declared ONCE on the base schema
```

**MongoDB allows exactly one text index per collection**, and discriminators all
share one collection. The text index must therefore be declared on the *base*
schema, never on a discriminator. Declaring it twice fails at index build —
which happens in production, on deploy, not locally.

**The text index cannot cover command syntax.** See §2.14.

### 2.2 `ctf` discriminator

| Field | Type | Notes |
|---|---|---|
| `platform` | enum | HackTheBox, TryHackMe, PicoCTF, VulnHub, Other |
| `boxName` | string | |
| `difficulty` | enum | Easy, Medium, Hard, Insane |
| `os` | enum | Linux, Windows, Other |
| `categories` | string[] | controlled — Web, Crypto, Forensics, Pwn, RE, OSINT |
| `toolsUsed` | string[] | slugs → `tool` posts, enables cross-linking |
| `retired` | boolean | **publish is blocked when false on HackTheBox** |
| `checklistAcceptedAt` | Date \| null | pre-publish checklist confirmation |

### 2.3 `tool` discriminator

| Field | Type |
|---|---|
| `toolName` | string |
| `toolCategory` | enum — controlled |
| `officialUrl` | string |
| `platforms` | string[] |
| `installCommands` | `[{platform, command}]` |
| `cheatsheet` | `[{command, description}]` — feeds `searchTokens`, see §2.14 |

### 2.4 `policy` discriminator

| Field | Type |
|---|---|
| `framework` | enum — ISO27001, NIST-CSF, SOC2, GDPR, PCI-DSS, General |
| `version` | string |
| `downloads` | `[{label, url, format, sizeBytes}]` |

### 2.5 `note` discriminator

| Field | Type | Notes |
|---|---|---|
| `source` | string \| null | a talk, a box, a CVE |

No cover image, no TOC — feed-style presentation.

### 2.6 `glossary` discriminator

| Field | Type | Notes |
|---|---|---|
| `term` | string | |
| `aliases` | string[] | "XSS" ↔ "Cross-Site Scripting" |
| `seeAlso` | string[] | slugs of related terms |
| `shortDef` | string | one sentence — used in hover-cards site-wide |

### 2.7 `Series`

`{ title, slug (unique), description, coverImage, level, postIds[] (ordered) }`

### 2.8 `Comment`

| Field | Type | Notes |
|---|---|---|
| `postId` | ObjectId | indexed |
| `parentId` | ObjectId \| null | threading |
| `authorId` | ObjectId | → `CommentUser`, **never anonymous** |
| `body` | string | **raw text** — not Markdown, not HTML |
| `bodyHtml` | string | escaped + `<br>` + `<code>`, see §4.2 |
| `status` | enum | `visible` (default) `held` `spam` `removed` |
| `heldReason` | string \| null | which filter caught it |
| `reportCount` | number | auto-hides at 3 |
| `ipHash` | string | hashed with server-side pepper, never plaintext |
| `createdAt` / `editedAt` | Date | |

**Default is `visible`.** Post-moderation, not pre-moderation.

### 2.9 `CommentUser`

`{ provider: 'github'|'google', providerId, displayName, avatarUrl,
   trusted: boolean, banned: boolean, commentCount, createdAt }`

No email, no password. **`trusted` flips true only on admin approval of a held
comment — never on submission.** Otherwise one benign first comment buys a
spammer a permanent bypass.

**Index:** `{provider, providerId}` unique.

### 2.10 `Like`

`{ postId, visitorId, createdAt }` — `visitorId` is an opaque cookie token, not
PII. **Index:** `{postId, visitorId}` unique, which enforces one like per
visitor. `Post.likeCount` denormalized for read speed.

### 2.11 `Subscriber`

`{ email (unique), status: 'pending'|'confirmed'|'unsubscribed',
   confirmToken, unsubToken, confirmedAt, source, createdAt }`

Both tokens are cryptographically random. Unsubscribe requires no login.

### 2.12 `MediaAsset`

`{ url, cloudinaryId, alt, width, height, format, bytes, uploadedAt }`

### 2.13 `User` — admin

`{ email (unique), passwordHash, role, lastLoginAt }`

### 2.14 `searchTokens` — why a plain text index is not enough

The goal is that searching `-oN` finds `nmap`. **MongoDB `$text` cannot do
this**, for two independent reasons:

1. A leading `-` in a `$text` query string means **negation**. `$text: "-oN"`
   asks for documents *excluding* "oN".
2. The text tokenizer strips punctuation and splits on it, so `-oN`, `--script`
   and `-sV` never survive as searchable terms in the first place.

So command syntax needs an exact-match path alongside the prose path.

**`searchTokens: string[]`** — populated at publish from:
- `cheatsheet[].command` and `installCommands[].command` (tool posts)
- flags extracted by `/(?:^|\s)(--?[A-Za-z][\w-]*)/g`
- `toolName`, `aliases`, `term`

Stored verbatim, case-preserved, indexed as a normal multikey index.

**Two-path search** in `api/search/route.ts`:

| Query shape | Path |
|---|---|
| Matches `/^-{1,2}[A-Za-z]/` or contains no spaces + has punctuation | `{ searchTokens: query }` exact match |
| Anything else | `$text: { $search: query }` |
| Ambiguous | Run both, merge, dedupe by `_id` |

If relevance proves weak later, Atlas Search replaces both paths cleanly.

---

## 3. `lib/taxonomy.ts` — the categorisation source of truth

Every controlled facet lives here. One entry drives the admin picker, the facet
landing page, its SEO metadata, filter chips, breadcrumbs and the sitemap.

```ts
export const FRAMEWORKS = [
  { slug: 'iso-27001', label: 'ISO/IEC 27001', blurb: '…' },
  { slug: 'nist-csf',  label: 'NIST CSF 2.0',  blurb: '…' },
  { slug: 'soc-2',     label: 'SOC 2',         blurb: '…' },
  { slug: 'gdpr',      label: 'GDPR',          blurb: '…' },
  { slug: 'pci-dss',   label: 'PCI DSS',       blurb: '…' },
] as const

export const PLATFORMS   = [...] as const
export const DIFFICULTIES = [...] as const
export const CTF_CATEGORIES = [...] as const
export const TOOL_CATEGORIES = [...] as const
```

**Never free text for these.** Free text fragments into `Recon` / `recon` /
`Reconnaissance`, splitting one category across three broken pages and
destroying both navigation and search ranking. Free-text `tags[]` remain
available as a secondary layer where fragmentation is harmless.

---

## 4. Rendering — two separate paths

Posts and comments render through **completely different code**. This is
deliberate: the untrusted-input path contains no parser at all.

### 4.1 Post pipeline — `lib/markdown/render.ts`

```
body (Markdown, in DB)
  → remark-parse
  → remark-gfm                tables, strikethrough, task lists, [^1] footnotes
  → remark-directive          ::: callout / spoiler / flag, ::youtube
  → remark-rehype
  → rehype-slug               heading IDs for the TOC
  → rehype-autolink-headings
  → rehype-sanitize           ← SECURITY CRITICAL
  → @shikijs/rehype           highlighting, AFTER sanitize
  → bodyHtml (cached at publish)
```

Rendered **at publish time**, not per request.

**Order is load-bearing — three rules:**

1. **Sanitize before Shiki.** Shiki emits inline `style`; the sanitizer strips
   it, so highlighting placed earlier vanishes silently. Allowlisting `style`
   to "fix" it opens CSS injection. Shiki after sanitize is safe because it only
   transforms `<pre><code>` and escapes its own output.
2. **`::youtube` emits `<div data-youtube-id="…">`, never an `<iframe>`.** ID
   validated `^[A-Za-z0-9_-]{11}$`. A client component builds the iframe.
   `rehype-sanitize` cannot constrain a `src` to a host, so allowing iframes at
   all would let a raw `<iframe>` in Markdown source through.
3. **`remark-gfm` provides footnotes.** Do not also install `remark-footnotes`.

Single sanitizer schema in `lib/markdown/sanitize-schema.ts` (posts only):

| | Allowed |
|---|---|
| Headings, lists, tables, blockquote | ✅ |
| Images | ✅ |
| Code blocks + inline code | ✅ |
| Links | ✅ `rel="noopener"`, protocol-restricted |
| `data-youtube-id` on `div` | ✅ (the only data attribute) |
| `data-callout`, `data-spoiler` on `div` | ✅ |
| Raw HTML, `style` | ❌ |
| `<iframe>`, `<script>`, `<object>`, `<embed>` | ❌ |

### 4.2 Comment renderer — `lib/comments/render.ts`

**Plain text. No Markdown parser. No sanitizer schema. No allowlist.**

```
body (raw text, in DB)
  → escapeHtml()        & < > " '  →  entities.  ALL of it, first.
  → backticks           `code` → <code>code</code>   (content already escaped)
  → newlines            \n → <br>
  → bodyHtml
```

That is the entire function. Three transforms over already-escaped text.

| | Comments |
|---|---|
| Inline `code` | ✅ — inert element, no attributes |
| Line breaks | ✅ |
| **Everything else** | ❌ — rendered as literal text |
| Links | ❌ — URLs display as copyable text, not anchors |

**Why this instead of an allowlist:** removing the Markdown parser removes it as
an attack surface. No mXSS, no schema to maintain, no parser CVE to inherit on
the one path that accepts input from strangers.

**Side effect worth knowing:** because URLs never become anchors, link spam has
no SEO value whatsoever. That demotes the link-count filter in §7 from
load-bearing to a nice-to-have.
