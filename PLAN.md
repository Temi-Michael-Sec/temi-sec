# Security Blog & Knowledge Base — Build Plan

A publishing platform for cybersecurity writing: articles, CTF writeups, a tool
reference library, security policy templates, and structured learning paths.
Built to be **used**, not just read — the tool library and policy templates are
things the author returns to during real work.

**Author:** Temi Michael
**Planned:** 21 July 2026
**Status:** Planning — nothing built yet

---

## 1. Goals

Ranked, because when they conflict the higher one wins.

1. **Teach.** Content should be genuinely useful to someone learning security.
   Structure serves comprehension — series, filters, cross-links.
2. **Be a personal reference.** The tool library and policy templates get used
   during real engagements and coursework.
3. **Demonstrate capability.** A security-focused site that is itself well
   secured. Its own hardening is part of what it demonstrates.

### Non-goals

- Multi-author publishing. Single admin.
- Real-time collaborative editing, live view counters, presence indicators.
- A general-purpose CMS. This is purpose-built for this content.

---

## 2. Stack

Chosen to match the author's existing projects (`robofriends`, `tcn-lekki`) —
same idioms, no new frameworks to learn mid-build.

| Layer | Choice | Notes |
|---|---|---|
| Framework | Next.js 16 (App Router) | Matches existing projects |
| UI | React 19 + TypeScript | |
| Styling | Tailwind CSS 4 | |
| Database | MongoDB Atlas + Mongoose | Free tier M0 is sufficient |
| Auth | `jose` (JWT) + `bcryptjs` | Same pattern as `robofriends` |
| Rate limiting | Upstash Redis | Already used in `robofriends` |
| Images | Cloudinary | Free tier, CDN, auto-transforms |
| Email | Resend | Free tier ~3k/mo. Sending needs a custom domain — §12 |
| Hosting | Vercel | Free `*.vercel.app`, no custom domain — §12 |

### Markdown pipeline

**Order is load-bearing.** Two earlier drafts of this pipeline were subtly wrong
in ways that would have shipped looking correct — see the notes below.

```
markdown source (DB)
  → remark-parse
  → remark-gfm            tables, strikethrough, task lists, [^1] footnotes
  → remark-directive      ::: custom blocks (callout, spoiler, flag), ::youtube
  → remark-rehype
  → rehype-slug           heading IDs for the TOC
  → rehype-autolink-headings
  → rehype-sanitize       ← SECURITY CRITICAL, see §10
  → @shikijs/rehype       syntax highlighting, AFTER sanitize (see below)
  → HTML  → bodyHtml
```

Rendered at publish time and cached, not on every request.

**`rehype-sanitize` is not optional.** Markdown permits raw HTML. Without
sanitization, anything reaching the renderer can inject script.

#### Why sanitize runs *before* Shiki

Shiki emits inline `style` attributes (`<span style="color:#89ddff">`). The
sanitizer strips `style`, so highlighting run *before* sanitization silently
disappears — and the obvious fix, allowlisting `style`, opens CSS injection.

Running Shiki **after** sanitization avoids the conflict entirely. This is safe
because Shiki only transforms `<pre><code>` content and escapes what it emits,
so its output is trusted by construction.

#### Why `::youtube` must not emit an `<iframe>`

If the directive produced an `<iframe>` before sanitization, the schema would
have to allow iframes — and a **raw `<iframe>` written directly in Markdown
would then survive too**. `rehype-sanitize` can restrict URL protocols but
cannot constrain a `src` to a specific host, so there is no way to narrow it
back down.

Instead the directive emits:

```html
<div data-youtube-id="dQw4w9WgXcQ"></div>
```

The ID is validated against `^[A-Za-z0-9_-]{11}$` at parse time. The sanitizer
allowlists exactly that one data attribute. A client component reads it and
builds the iframe. **`<iframe>` never enters the allowlist.**

#### Package notes

- `remark-gfm` v3+ already provides `[^1]` footnotes. Do **not** also install
  `remark-footnotes` — they conflict.
- Use `@shikijs/rehype`. `rehype-shiki` is the legacy package.

#### Comments do not use this pipeline at all

Comments are plain text — no Markdown parser, no sanitizer schema. See §7.

---

## 3. Content model

One `Post` collection using **Mongoose discriminators** — shared base fields,
type-specific extensions. Different content genuinely has different shape, and
flattening it into one schema would destroy the filtering that makes the site
useful.

### Base fields (all types)

```ts
{
  type:         'article' | 'ctf' | 'tool' | 'policy' | 'note' | 'glossary'
  title:        string
  slug:         string          // unique, URL-safe
  excerpt:      string          // listings + meta description fallback
  coverImage:   { url, alt, width, height }
  body:         string          // markdown source
  bodyHtml:     string          // rendered + sanitized, cached at publish
  toc:          [{ id, text, level }]
  status:       'draft' | 'published'
  publishedAt:  Date | null
  updatedAt:    Date
  lastReviewedAt: Date | null  // freshness — see SS9
  tags:         string[]
  series:       { seriesId, order } | null
  references:   [{ title, url, accessedAt }]
  readingTime:  number          // minutes
  views:        number
  likeCount:    number
  searchTokens: string[]        // exact-match commands/flags — structure.md §2.14
  seo:          { metaTitle, metaDescription, ogImage }
}
```

### Type-specific extensions

**`ctf`** — makes writeups filterable, which is the point
```ts
{
  platform:    'HackTheBox' | 'TryHackMe' | 'PicoCTF' | 'VulnHub' | 'Other'
  boxName:     string
  difficulty:  'Easy' | 'Medium' | 'Hard' | 'Insane'
  os:          'Linux' | 'Windows' | 'Other'
  categories:  string[]   // Web, Crypto, Forensics, Pwn, RE, OSINT
  toolsUsed:   string[]   // ← links back to the tool library
  retired:     boolean    // fails CLOSED — undefined blocks too, see §8
}
```

**`tool`** — the personal field manual
```ts
{
  toolName:        string
  toolCategory:    string      // Recon, Exploitation, Post-Ex, Forensics, ...
  officialUrl:     string
  platforms:       string[]    // Linux, Windows, macOS
  installCommands: [{ platform, command }]
  cheatsheet:      [{ command, description }]   // feeds searchTokens
}
```

**`policy`** — GRC-side material
```ts
{
  framework:  'ISO27001' | 'NIST-CSF' | 'SOC2' | 'GDPR' | 'PCI-DSS' | 'General'
  version:    string
  downloads:  [{ label, url, format, sizeBytes }]
}
```

**`note`** — short-form TIL entries
```ts
{
  // no coverImage, no TOC, feed-style presentation
  source: string | null   // where it came from: a talk, a box, a CVE
}
```

**`glossary`** — term definitions, strong SEO surface
```ts
{
  term:      string
  aliases:   string[]     // "XSS" ↔ "Cross-Site Scripting"
  seeAlso:   string[]     // slugs of related terms
  shortDef:  string       // one sentence, used in hover-cards site-wide
}
```

### Supporting collections

**`Series`** — learning paths
`{ title, slug, description, coverImage, level, postIds[] (ordered) }`

**`Comment`**
```ts
{
  postId, parentId,
  authorId,                    // → CommentUser, never anonymous
  body,                        // RAW TEXT — not markdown, not HTML
  bodyHtml,                    // escaped + <br> + <code>, see structure.md §4.2
  status: 'visible' | 'held' | 'spam' | 'removed',   // default 'visible'
  heldReason: string | null,   // why the filter caught it
  reportCount: number,
  ipHash, createdAt, editedAt
}
```
Comments are **visible on submission** unless an automated filter holds them.
See §7 for the moderation model.

**`CommentUser`** — OAuth identity, no passwords
`{ provider: 'github'|'google', providerId, displayName, avatarUrl,
   trusted: boolean, banned: boolean, commentCount, createdAt }`

**`trusted` flips to `true` only when an admin approves a held comment.** Never
on submission. If a first submission granted trust automatically, a spammer
would buy a permanent bypass with one benign comment.

No email/password is ever stored — account recovery, password reset, and
credential-breach risk are all designed out.

**`Like`**
`{ postId, visitorId, createdAt }` — `visitorId` is an opaque token in a
long-lived cookie. Prevents casual double-liking without collecting PII.
`Post.likeCount` is denormalized for read speed.

**`Subscriber`**
`{ email, status: 'pending'|'confirmed'|'unsubscribed',
   confirmToken, unsubToken, confirmedAt, source, createdAt }`

**`MediaAsset`**
`{ url, cloudinaryId, alt, width, height, format, bytes, uploadedAt }`

**`User`** — single admin, but modelled properly
`{ email, passwordHash, role, lastLoginAt }`

---

## 4. Taxonomy & URL strategy

Categorisation must be effortless for the writer and obvious for the reader.
Two rules make that work.

### Rule 1 — controlled vocabulary for primary facets

Framework, platform, difficulty, OS, tool category and CTF category are **fixed
picklists** in the admin, defined in one config file. Not free text.

Free text fragments immediately: `Recon`, `recon`, and `Reconnaissance` become
three half-empty category pages, and neither navigation nor SEO survives it.

Free-text `tags[]` remain available as a secondary layer where fragmentation is
harmless.

```ts
// lib/taxonomy.ts — single source of truth
export const FRAMEWORKS = [
  { slug: 'iso-27001', label: 'ISO/IEC 27001', blurb: '...' },
  { slug: 'nist-csf',  label: 'NIST CSF 2.0',  blurb: '...' },
  { slug: 'soc-2',     label: 'SOC 2',         blurb: '...' },
  { slug: 'gdpr',      label: 'GDPR',          blurb: '...' },
  { slug: 'pci-dss',   label: 'PCI DSS',       blurb: '...' },
] as const
```

Adding a framework = one line here. Picker, landing page, filter chip, sitemap
entry and breadcrumb all derive from it automatically.

### Rule 2 — primary facets get real URLs

Query strings are largely not indexed. Static routes are.

```
/policies/framework/iso-27001     ← own <title>, meta, intro copy, indexed
/policies?framework=ISO27001      ← browsing only, noindex
```

Every primary facet therefore gets a static route:

```
/ctf/platform/[platform]        /ctf/difficulty/[level]     /ctf/category/[cat]
/tools/category/[category]      /policies/framework/[fw]
/glossary/[term]                /tags/[tag]
```

Each facet page carries a hand-written blurb from `taxonomy.ts`, so it is a real
landing page rather than a bare list. Multi-facet combinations stay as query
params and are `noindex` — they exist for browsing, not for landing.

## 5. Routes

### Public

```
/                            Home — latest + featured + series entry points
/blog                        Articles
/blog/[slug]
/notes                       Short-form TIL feed
/notes/[slug]
/ctf                         Writeups (browse + combined filters, noindex)
/ctf/[slug]
/ctf/platform/[platform]     ← indexed facet landing page
/ctf/difficulty/[level]      ←
/ctf/category/[category]     ←
/tools                       Tool library — searchable incl. cheatsheet commands
/tools/[slug]
/tools/category/[category]   ←
/policies                    Policy templates
/policies/[slug]
/policies/framework/[fw]     ←
/glossary                    A–Z index
/glossary/[term]             ←
/series                      Learning paths
/series/[slug]               Path overview, ordered
/tags/[tag]
/search                      Full-text across all types
/about
/security                    ← how this site is hardened (see §10)
/subscribe
/rss.xml
/.well-known/security.txt
```

### Admin (auth-gated via middleware)

```
/admin/login
/admin                    Dashboard — drafts, held comments, posts due for review
/admin/posts              All content, filter by type/status
/admin/posts/new
/admin/posts/[id]/edit    Markdown + live preview
/admin/series
/admin/comments           Queue — held + reported only, not everything
/admin/commenters         Trusted / banned OAuth accounts
/admin/media              Media library
/admin/review             Freshness queue — oldest lastReviewedAt first
/admin/subscribers
/admin/newsletter         Compose + send
```

---

## 6. The editor

Split pane: Markdown source left, live rendered preview right.

**Toolbar** — bold, italic, heading, link (`Cmd+K`), code block with language
picker, image upload, YouTube embed, callout, spoiler, footnote, table.

**Images**
- Drag a file onto the editor, or paste from clipboard (screenshots — this will
  be the most-used path)
- Uploads to Cloudinary, inserts `![alt](url)` automatically
- Alt text prompted on insert, because accessibility
- Media library for reuse across posts

**Custom blocks** via `remark-directive`:

```markdown
:::warning
Only run this against systems you own or have written authorization to test.
:::

:::spoiler{title="Root flag"}
Reader clicks to reveal. Respects people still working the box.
:::

::youtube[dQw4w9WgXcQ]
```

Callout variants: `note`, `tip`, `warning`, `danger`.

Raw `<iframe>` and `<script>` are **rejected by the sanitizer**. Embeds go
through directives so we control exactly what HTML is produced.

**Publishing flow**
1. Draft — autosaved, never publicly reachable
2. Preview — signed URL, viewable only while authenticated
3. Publish — renders + caches HTML, sets `publishedAt`, **and only now becomes
   eligible for the newsletter**

That last point is a stated requirement: subscribers must never receive a draft.
Newsletter sending reads exclusively from `status === 'published'`, and sending
is a **separate explicit action** from publishing — publish first, review the
live post, then choose to send.

---

## 7. Comments & moderation

Comments are **open and instant**. Pre-moderation was rejected deliberately: it
does not scale with growth, and a reply that stays invisible for hours kills the
conversation that made someone comment in the first place.

Instead the load is pushed onto identity and automation, so the human queue
stays small no matter the traffic.

### Layer 1 — identity (the main control)

Commenting requires **GitHub or Google OAuth**. No passwords, no signup form, no
reset flow, no credential-breach surface — the site stores a provider ID, a
display name and an avatar URL.

This is what makes open comments safe. Bots do not provision OAuth accounts at
volume, so the overwhelming majority of spam never reaches the filters.

**Tradeoff, accepted knowingly:** a reader with neither account cannot comment.
For a technical audience this is near-zero friction; on a general-interest site
it would not be.

### Layer 2 — plain text (removes the payload class entirely)

Comment bodies are **plain text**. No Markdown parser, no sanitizer allowlist —
just escape, `<br>`, and backtick→`<code>`. Full spec in `structure.md` §4.2.

Two consequences:

- **No XSS surface on the untrusted path.** There is no parser to exploit and no
  schema to get subtly wrong.
- **Link spam becomes pointless.** URLs render as text, never anchors, so there
  is no SEO value in posting one. The link filter below is a convenience, not a
  control.

### Layer 3 — automated filters

| Signal | Action |
|---|---|
| Author `banned` | Rejected |
| Rate limit exceeded (3 / 10 min) | Rejected |
| Honeypot filled, or submitted in < 3s | **Fake success** — see below |
| 3+ links in body | Held |
| Spam-pattern match (crypto, SEO, casino) | Held |
| Author's first-ever comment | Held once |
| Everything else | **Visible immediately** |

**Honeypot and timing rejections must return an ordinary success response** and
show the comment to its author as if posted. A distinguishable error turns the
filter into an oracle a bot can tune against.

### Layer 4 — reader reports

Any signed-in reader can report a comment. At 3 reports it auto-hides and enters
the queue. The crowd surfaces what the filters miss.

### Layer 5 — the admin queue

Only `held` and reported comments appear. Expected volume is a handful per week
rather than everything. Actions: approve, spam, remove, ban author.

**Approving is the only thing that sets `trusted = true`.** Submission never
does. Otherwise one benign first comment buys a spammer permanent bypass.

---

## 8. CTF publishing compliance

Platforms have binding rules. HackTheBox prohibits writeups for **active**
machines and issues takedowns. Flags are frequently user-specific and publishing
them enables cheating.

These are enforced in the publish flow, not left to memory.

### Hard blocks (publishing is refused)

- **Active machine.** `platform === 'HackTheBox' && !retired` → refused. The
  rule exists precisely for the moment it is forgotten.
- **Flag detected in body.** Regex sweep for `HTB{…}`, `THM{…}`, `flag{…}`,
  `picoCTF{…}`, `CTF{…}`. On a hit, publishing is refused and the offending
  line is shown.

### The `::flag` directive

Lets a writeup discuss a flag without printing one:

```markdown
::flag[user]     →   renders  user.txt ── ▓▓ redacted ▓▓
```

### Pre-publish checklist

For what no scanner can catch. Must be ticked before a `ctf` post publishes:

- [ ] Screenshots contain no flag values
- [ ] No personal username, email, or shell prompt with identifying hostname
- [ ] No internal IPs beyond the target's own
- [ ] No session tokens, cookies, or API keys in captured output
- [ ] Machine is retired / room permits writeups

**Image redaction stays manual.** Automated detection cannot reliably find a
flag inside a screenshot, which is exactly how leaks happen — so the checklist
names it explicitly rather than implying coverage.

---

## 9. Content freshness

Security content decays faster than any other technical writing. A privilege-
escalation technique gets patched; a hardening guide goes stale. Outdated
security advice is not merely useless — it is actively harmful to a learner,
which makes this a direct threat to the site's primary goal.

Almost no blogs handle this. It is cheap and worth doing.

- `lastReviewedAt` on every post, set on publish and bumped by an explicit
  **"Reviewed, still accurate"** action in the admin
- Public banner on anything older than **18 months**:
  *"Last reviewed March 2025. Techniques may have changed — verify before
  relying on this."*
- Admin dashboard lists posts due for review, oldest first
- Excluded from `ctf` writeups, which are historical records of a point in time
  and are not expected to stay current

## 10. Security

The site is a security portfolio. It being compromised would undercut its whole
premise. This section is also the source material for the public `/security`
page.

### Content rendering
- `rehype-sanitize` with an explicit allowlist schema on all rendered Markdown,
  running **before** Shiki (§2)
- **Comments bypass the Markdown pipeline entirely** — plain text, no parser,
  no allowlist (§7, `structure.md` §4.2)
- No raw HTML passthrough anywhere; embeds only via controlled directives that
  emit data attributes, never `<iframe>`

### Auth
- `bcryptjs` cost factor 12
- Session JWT via `jose`, cookie flags `httpOnly` + `secure` + `sameSite=strict`
- Short-lived access token with refresh
- Generic failure message on login — no user enumeration
- Constant-time comparison, so failures don't leak timing
- All `/admin/*` gated in `proxy.ts` (Next 16's renamed middleware) as an
  *optimistic* check, **and** re-verified inside every `/api/admin/*` route.
  Next's docs state proxy "should not be used as a full session management or
  authorization solution" — defence in depth, never the boundary

### Rate limiting (Upstash)
| Endpoint | Limit |
|---|---|
| Login | 5 / 15 min / IP |
| Comment post | 3 / 10 min / IP |
| Like | 20 / min / visitor |
| Subscribe | 3 / hour / IP |
| Search | 30 / min / IP |

### Comments
- Sign-in required (OAuth) — identity is the primary spam control
- **Plain text only** — no parser on the untrusted path (§7)
- Comments render **immediately**; only flagged ones are held
- Honeypot + timing check instead of CAPTCHA, both returning fake success
- IP stored hashed with **HMAC + a server-side pepper**, never plaintext. The
  pepper is the entire control here: IPv4 has only 2³² possible inputs, so a
  bare hash is brute-forced in seconds.

### Headers (middleware)
- Content-Security-Policy — no `unsafe-inline`; nonce-based where scripts are needed
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Strict-Transport-Security`
- `Permissions-Policy` — deny camera, mic, geolocation

### Other
- Secrets in env only; nothing sensitive in `NEXT_PUBLIC_*`
- Newsletter unsubscribe via unguessable token, no login required
- File uploads: type + size validated server-side, served from Cloudinary's
  domain, not ours
- `/.well-known/security.txt` with a contact address

---

## 11. Build phases

Each phase ends somewhere stable. **Live on the internet by end of Phase 2** —
deploying early means real-world feedback rather than a big-bang launch.

### Phase 0 — Foundation
Next.js scaffold, Tailwind 4, TypeScript config, MongoDB Atlas connection,
env structure, base layout, dark mode.

### Phase 1 — Content engine
Mongoose models with discriminators. Markdown pipeline end to end, including
sanitization, Shiki highlighting, TOC extraction, custom directives. Seed a few
posts by hand to prove the rendering.

### Phase 2 — Public reading experience → **DEPLOY**
Home, post page, listings, tag pages, TOC sidebar, code blocks with copy button,
responsive layout, SEO metadata, OG images, sitemap. Ship it to Vercel.

### Phase 3 — Admin + editor
Login, session middleware, dashboard, Markdown editor with live preview,
Cloudinary upload, media library, draft/preview/publish flow.
*From here on, content is written through the site, not seeded.*

### Phase 4 — Engagement
Likes with visitor tokens. OAuth sign-in (GitHub + Google) for commenters.
Threaded comments rendering **immediately**, with the layered filters of §7:
rate limits, honeypot, link/pattern holds, first-comment hold, reader reports.
Admin queue for held + reported only. Shareable links with proper OG cards.

### Phase 5 — Specialized content types
`taxonomy.ts` as single source of truth. Facet landing pages with real URLs.
CTF filtering UI **plus the §8 publish guards** — active-machine block, flag
scanner, `::flag` directive, pre-publish checklist. Tool library with searchable
cheatsheets. Policy pages with framework navigation and downloads. Glossary with
hover-cards. Cross-linking: tool pages list the writeups that used them.

### Phase 6 — Series / learning paths
Ordered navigation, path overview pages, prev/next, reader progress
(localStorage — no account required). Content freshness system from §9:
`lastReviewedAt`, stale banners, review queue.

### Phase 7 — Newsletter + RSS
RSS feed. Subscribe form with double opt-in. Confirmation and unsubscribe flows.
Newsletter composer that reads published posts only. Send as a **separate,
explicit action** after publishing, never automatic.
**Blocked on a custom domain** — see §12.

### Phase 8 — Hardening pass
Full CSP, security headers, `security.txt`, dependency audit, self-directed
penetration test, then write up the `/security` page documenting all of it.
That writeup is itself a portfolio piece.

---

## 12. Open items

### Resolved

- **Comment identity** → OAuth (GitHub + Google) required. Anonymous commenting
  dropped. This is what allows comments to be open and instant (§7).
- **Comment moderation** → post-moderation, not pre-moderation. Filters and
  reports feed a small queue instead of the admin gating every comment.
- **Hosting domain** → **stay free on `*.vercel.app`.** Upgrade later only if the
  newsletter earns it.
- **Email provider** → Resend behind an `EmailProvider` interface, never Gmail
  SMTP. Free Gmail caps at ~100/day over SMTP, enforces behavioural blocks below
  that, and mail from `@gmail.com` fails DMARC alignment — so it reads as
  phishing while also being a throwaway adapter and a long-lived app password to
  manage. Resend's free tier already sends without a domain (self only), using
  the same library production ships.
- **Comment rendering** → plain text. No parser on the untrusted path (§7).

### Outstanding

- **Custom domain — gates newsletter *sending* only.** Resend cannot send from a
  `vercel.app` subdomain: SPF/DKIM need DNS records on a domain you control.
  That is how email authentication works, not a Resend limitation.

  Phase 7 still ships **complete** — subscriber model, double opt-in, tokens,
  unsubscribe and composer are all built and tested against `ConsoleProvider`,
  which is better for testing than real email because it is deterministic. The
  send button is gated on `provider.canSendBulk`. A domain flips one env var.

  Cost of deferring, stated honestly: migrating after Google indexes the site
  loses ranking, and clean redirects cannot be set from a `*.vercel.app`
  subdomain. `NEXT_PUBLIC_SITE_URL` keeps the code damage to one variable; the
  SEO cost is real and unavoidable.

  Correction to an earlier draft of this plan: it claimed `vercel.app`'s Public
  Suffix List membership gives better cookie isolation than a custom domain.
  That protection only ever applied against *other Vercel tenants*, and the
  `__Host-` cookie prefix — which the admin session uses regardless of host —
  provides equivalent subdomain-injection protection anywhere. It is not a
  reason to stay.
- **OAuth app registration** — GitHub and Google OAuth apps must be created and
  their callback URLs registered before Phase 4. Free, but needs doing.
- **Search** — **two paths, not one.** An earlier draft of this plan claimed a
  MongoDB text index could cover cheatsheet commands so that `-oN` finds `nmap`.
  It cannot: a leading `-` in `$text` means *negation*, and the tokenizer strips
  punctuation before indexing, so command flags never survive as searchable
  terms. Prose goes through `$text`; command-shaped queries go through an
  exact-match `searchTokens[]` index populated at publish (`structure.md`
  §2.14). If relevance proves weak, Atlas Search replaces both cleanly.
- **Analytics** — deferred. If added, something privacy-respecting (Plausible,
  Umami) rather than Google Analytics, which would be tonally wrong here.
