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
│   │   │   ├── render.ts           Full pipeline
│   │   │   ├── sanitize-schema.ts  Post schema + stricter comment schema
│   │   │   ├── directives.ts       callout, spoiler, flag, youtube
│   │   │   └── toc.ts
│   │   ├── publish/
│   │   │   ├── guards.ts           Active-machine block, flag scanner
│   │   │   └── flag-patterns.ts
│   │   ├── comments/
│   │   │   ├── filters.ts          Rate, honeypot, links, patterns
│   │   │   └── moderation.ts
│   │   ├── cloudinary.ts
│   │   ├── email/
│   │   │   ├── resend.ts
│   │   │   └── templates/
│   │   ├── ratelimit.ts            Upstash
│   │   ├── hash.ts                 IP hashing with pepper
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
│   └── middleware.ts               Admin gate + security headers
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
| `seo` | `{metaTitle, metaDescription, ogImage}` | |

**Indexes:** `slug` unique · `{type, status, publishedAt: -1}` ·
`{tags}` · text index over `title`, `excerpt`, `body` **and tool cheatsheet
commands**.

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
| `cheatsheet` | `[{command, description}]` — **indexed for search** |

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
| `body` | string | Markdown, restricted subset |
| `bodyHtml` | string | **stricter sanitizer than posts** |
| `status` | enum | `visible` (default) `held` `spam` `removed` |
| `heldReason` | string \| null | which filter caught it |
| `reportCount` | number | auto-hides at 3 |
| `ipHash` | string | hashed with server-side pepper, never plaintext |
| `createdAt` / `editedAt` | Date | |

**Default is `visible`.** Post-moderation, not pre-moderation.

### 2.9 `CommentUser`

`{ provider: 'github'|'google', providerId, displayName, avatarUrl,
   trusted: boolean, banned: boolean, commentCount, createdAt }`

No email, no password. `trusted` flips true after a first approved comment, so
returning commenters skip the first-post hold.

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

## 4. Markdown pipeline

```
body (Markdown, in DB)
  → remark-parse
  → remark-gfm                tables, strikethrough, task lists
  → remark-directive          ::: callout / spoiler / flag, ::youtube
  → remark-footnotes          [^1] citations
  → remark-rehype
  → rehype-slug               heading IDs for the TOC
  → rehype-autolink-headings
  → rehype-shiki              syntax highlighting
  → rehype-sanitize           ← SECURITY CRITICAL
  → bodyHtml (cached at publish)
```

Rendered **at publish time**, not per request.

Two sanitizer schemas in `sanitize-schema.ts`:

| | Posts | Comments |
|---|---|---|
| Images | ✅ | ❌ |
| Headings | ✅ | ❌ |
| Code blocks | ✅ | inline only |
| Links | ✅ | ✅ forced `nofollow ugc noopener` |
| Raw HTML | ❌ | ❌ |
| `<iframe>` / `<script>` | ❌ | ❌ |

Embeds are produced by directives so the exact output HTML is controlled.
