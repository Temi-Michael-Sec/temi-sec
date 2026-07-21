# Implementation

Phased build steps and live progress. Tick items as they land.

> **Current phase: not started.** Phase 0 is next.

Related: [`README.md`](README.md) · [`structure.md`](structure.md) · [`PLAN.md`](PLAN.md)

---

## Progress

| Phase | Scope | Status |
|---|---|---|
| 0 | Foundation | ☐ Not started |
| 1 | Content engine | ☐ |
| 2 | Public reading experience → **DEPLOY** | ☐ |
| 3 | Admin + editor | ☐ |
| 4 | Engagement — likes, OAuth, comments | ☐ |
| 5 | Specialized types + publish guards | ☐ |
| 6 | Series + freshness | ☐ |
| 7 | Newsletter + RSS | ☐ |
| 8 | Hardening + `/security` | ☐ |

**The site goes live at the end of Phase 2**, before the admin panel exists.
Deliberate: a real URL early surfaces layout and performance problems on real
devices, instead of discovering them after eight phases of local work. Two or
three posts get seeded by hand to prove rendering.

---

## Phase 0 — Foundation

- [ ] `npx create-next-app@latest` — TypeScript, Tailwind 4, App Router, `src/`
- [ ] `.env.example` with every variable from the README
- [ ] `lib/db.ts` — cached Mongoose connection (must not reconnect per request
      in dev; Next hot-reload will exhaust the pool otherwise)
- [ ] MongoDB Atlas M0 cluster + IP allowlist
- [ ] Base layout: header, footer, nav
- [ ] Dark mode via `next-themes`
- [ ] Typography scale — long-form reading is the primary use, so set line
      length and rhythm now rather than retrofitting
- [ ] `.gitignore` verified for `.env*`

**Done when:** `npm run dev` serves a styled empty shell and the DB connects.

---

## Phase 1 — Content engine

The hardest and most load-bearing phase. Everything downstream depends on it.

- [ ] `models/Post.ts` — base schema + all six discriminators (§2, `structure.md`)
- [ ] Indexes: `slug` unique, `{type, status, publishedAt}`, text index
- [ ] `lib/taxonomy.ts` — controlled vocabularies
- [ ] `lib/markdown/render.ts` — full unified pipeline
- [ ] `lib/markdown/sanitize-schema.ts` — **post schema + stricter comment schema**
- [ ] `lib/markdown/directives.ts` — `callout`, `spoiler`, `flag`, `youtube`
- [ ] `lib/markdown/toc.ts` — heading extraction
- [ ] `lib/reading-time.ts`
- [ ] Seed script — 2–3 posts covering every directive and content type

### ⚠️ Do not skip

**Test the sanitizer with actual XSS payloads before moving on.** At minimum:
`<script>`, `<img onerror=>`, `<iframe>`, `javascript:` URLs, and a raw
`<svg onload=>`. Markdown permits raw HTML — an unsanitized renderer is a live
XSS sink, and every later phase builds on this function. Catching it here is
trivial; catching it in Phase 8 means auditing everything built on top.

**Done when:** a seeded Markdown post renders with highlighting, a working TOC,
callouts and spoilers — and every payload above is neutralised.

---

## Phase 2 — Public reading experience → **DEPLOY**

- [ ] Home — latest, featured, series entry points
- [ ] Post page — `PostBody`, TOC sidebar, references, reading time
- [ ] `CodeBlock` — copy button, terminal variant for shell output
- [ ] `Callout`, `Spoiler` components
- [ ] Listing pages: `/blog`, `/notes`
- [ ] `/tags/[tag]`
- [ ] Responsive layout — verify on a real phone, not just devtools
- [ ] SEO metadata, OG images, `sitemap.ts`, `robots.ts`
- [ ] **Deploy to Vercel** on a `*.vercel.app` subdomain
- [ ] Lighthouse pass — target 95+ on performance and accessibility

**Done when:** the site is publicly reachable and reads well on a phone.

---

## Phase 3 — Admin + editor

- [ ] `models/User.ts`, seed the single admin (bcrypt cost 12)
- [ ] `lib/auth/session.ts` — jose sign/verify. **Fail closed if `JWT_SECRET`
      is unset — no insecure fallback**
- [ ] `/admin/login` — generic failure message, no user enumeration
- [ ] `middleware.ts` — gate all `/admin/*` server-side, never client-only
- [ ] Upstash rate limit on login: 5 / 15 min / IP
- [ ] Dashboard — drafts, recent activity
- [ ] `Editor.tsx` — split-pane Markdown + live preview
- [ ] `EditorToolbar.tsx` — bold, italic, heading, link (`Cmd+K`), code block
      with language picker, image, embed, callout, spoiler, footnote, table
- [ ] `ImageDropzone.tsx` — **drag-and-drop *and* clipboard paste**. Paste is
      the path that matters most; screenshots are the dominant image source
- [ ] Cloudinary upload route — validate type and size **server-side**
- [ ] Alt text prompted on insert
- [ ] `MediaLibrary.tsx` — browse and reuse
- [ ] `TaxonomyPicker.tsx` — driven by `taxonomy.ts`
- [ ] Autosave drafts
- [ ] Signed preview URL — authenticated viewers only
- [ ] Publish action — renders and caches `bodyHtml`, sets `publishedAt`

**Done when:** a complete post with pasted screenshots can be written and
published entirely through the UI. Seeding is retired.

---

## Phase 4 — Engagement

### Likes
- [ ] `models/Like.ts` — `{postId, visitorId}` unique compound index
- [ ] Opaque visitor token in a long-lived cookie (not PII)
- [ ] Optimistic UI, denormalized `likeCount`
- [ ] Rate limit 20 / min

### OAuth sign-in
- [ ] Register GitHub and Google OAuth apps, set callback URLs
- [ ] `lib/auth/oauth.ts` — state parameter for CSRF protection
- [ ] `models/CommentUser.ts`
- [ ] Sign-in prompt in the comment box

### Comments — open, post-moderated
- [ ] `models/Comment.ts`, default `status: 'visible'`
- [ ] Threaded rendering
- [ ] **Comment sanitizer schema** — no images, no headings, links forced
      `rel="nofollow ugc noopener"`
- [ ] `lib/comments/filters.ts`:
  - [ ] Rate limit 3 / 10 min → reject
  - [ ] Honeypot field → reject silently
  - [ ] Submitted in < 3s → reject silently
  - [ ] 3+ links → hold
  - [ ] Spam pattern match → hold
  - [ ] Author's first-ever comment → hold once, then `trusted = true`
  - [ ] Banned author → reject
- [ ] Reader reports; auto-hide at 3
- [ ] `/admin/comments` — **held and reported only**, never the full firehose
- [ ] `/admin/commenters` — trust / ban
- [ ] IP hashing with server-side pepper

### Sharing
- [ ] Share buttons, per-post OG cards

**Done when:** a signed-in reader's comment appears instantly, a link-stuffed
comment lands in the queue instead, and the admin queue holds only exceptions.

---

## Phase 5 — Specialized content types + publish guards

- [ ] Facet landing pages with **real URLs** — `/ctf/platform/[platform]`,
      `/ctf/difficulty/[level]`, `/ctf/category/[category]`,
      `/tools/category/[category]`, `/policies/framework/[framework]`
- [ ] Per-facet title, meta description and intro blurb from `taxonomy.ts`
- [ ] Combined query-string filters → **`noindex`**
- [ ] Tool pages — install commands, cheatsheet table
- [ ] **Search indexes cheatsheet commands**, so `-oN` finds `nmap`
- [ ] Cross-linking — tool pages list writeups that used them
- [ ] Policy pages — framework navigation, downloads
- [ ] Glossary — A–Z index, `seeAlso`, hover-cards from `shortDef`

### CTF publish guards — `lib/publish/guards.ts`
- [ ] **Hard block:** `platform === 'HackTheBox' && !retired` → refuse to publish
- [ ] **Flag scanner:** regex sweep for `HTB{…}`, `THM{…}`, `flag{…}`,
      `picoCTF{…}`, `CTF{…}` → refuse and show the offending line
- [ ] `::flag[user]` directive → redacted render
- [ ] Pre-publish checklist, required before any `ctf` post publishes:
  - [ ] Screenshots contain no flag values
  - [ ] No personal username, email, or identifying shell prompt
  - [ ] No internal IPs beyond the target's own
  - [ ] No session tokens, cookies or API keys in captured output
  - [ ] Machine retired / room permits writeups
- [ ] Store `checklistAcceptedAt`

**These are blocks, not warnings.** HackTheBox issues takedowns for
active-machine writeups, and the rule exists for exactly the moment it's
forgotten. Image redaction stays manual — no scanner reliably finds a flag
inside a screenshot, which is precisely how leaks happen.

**Done when:** publishing an active HTB box is impossible, and a flag pasted
into the body blocks publish.

---

## Phase 6 — Series + content freshness

- [ ] `models/Series.ts`, `/admin/series` with drag-to-reorder
- [ ] Series overview page — ordered, with progress
- [ ] Prev/next navigation within a path
- [ ] Reader progress in `localStorage` — **no account required**
- [ ] `lastReviewedAt` set on publish
- [ ] "Reviewed, still accurate" admin action
- [ ] `StaleBanner` on posts older than 18 months
- [ ] `/admin/review` — oldest first
- [ ] Exclude `ctf` from freshness — historical records, not living guides

**Done when:** a reader can follow a path start to finish, and a stale post
visibly says so.

---

## Phase 7 — Newsletter + RSS

> **Blocked on a custom domain.** Resend cannot send from a `vercel.app`
> subdomain — SPF/DKIM require DNS records on a domain you control. Not a Resend
> limitation; it's how email authentication works, and unauthenticated mail goes
> to spam. Everything except sending can be built and tested first.

- [ ] `/rss.xml` — full feed
- [ ] `models/Subscriber.ts`
- [ ] Subscribe form, rate limited 3 / hour / IP
- [ ] **Double opt-in** — confirmation email with random token
- [ ] One-click unsubscribe via token, **no login required**
- [ ] Buy domain, point DNS at Vercel
- [ ] Verify domain in Resend (SPF + DKIM)
- [ ] Newsletter composer — reads `status === 'published'` **only**
- [ ] Send as a **separate explicit action**, never automatic on publish
- [ ] Send confirmation dialog showing recipient count

**Publish and send stay separate on purpose.** Publish, read it live, then
choose to send. A typo caught after publishing never reaches an inbox.

**Done when:** a test subscriber completes double opt-in and receives a real
post.

---

## Phase 8 — Hardening + `/security`

- [ ] CSP with nonces, **no `unsafe-inline`**
- [ ] HSTS, `X-Content-Type-Options: nosniff`,
      `Referrer-Policy: strict-origin-when-cross-origin`
- [ ] `Permissions-Policy` — deny camera, mic, geolocation
- [ ] `/.well-known/security.txt` (RFC 9116) with contact + expiry
- [ ] `npm audit`, dependency review
- [ ] Confirm no secret is exposed via `NEXT_PUBLIC_*`
- [ ] Verify every `/api/admin/*` route checks session server-side — middleware
      alone is not sufficient
- [ ] Self-directed pentest: XSS in comments and posts, IDOR on comment
      edit/delete, rate-limit bypass, OAuth state/CSRF, SSRF via embeds
- [ ] Write `/security` documenting all of it, with reasoning per control

The `/security` writeup is the strongest teaching artifact on the site — a real
system with real controls and real reasoning beats any hypothetical.

---

## Deferred

Not in scope now; revisit only if a real need appears.

- Live-updating comments and view counters (websockets/SSE)
- Multi-author support
- Full-text search upgrade to Atlas Search — only if MongoDB text relevance
  proves weak in practice
- Analytics — if added, privacy-respecting (Plausible, Umami), not Google
  Analytics, which would be tonally wrong here
- Block/WYSIWYG editor — revisit only if Markdown genuinely proves limiting
