# Implementation

PR-sized build units with owners and merge gates.

> **Current phase: not started.** Phase 0 is next.

Related: [`README.md`](README.md) · [`structure.md`](structure.md) · [`PLAN.md`](PLAN.md)

---

## How this is built

**Trunk-based. One PR per unit below. No long-lived phase branches** — those
recreate the big-bang merge this structure exists to avoid.

- Branch naming: `p3/session-jose`, `p4/comment-filters` — phase prefix for
  narrative, topic slug for meaning.
- **Feature flags, not branches**, for anything landing before it's publicly
  ready. Comments can merge behind `COMMENTS_ENABLED=false` while the filters
  and moderation queue land as separate PRs.
- Vercel preview deploys are the review environment — one per PR, free.
- A unit is the right size when **reverting it breaks nothing else**.

### Owners

**You** take simple logic and the non-technical decisions. **Claude** takes the
complex and security-critical parts. Marked per unit as 🧑 / 🤖.

*Optional, not assigned:* writing attack suites against Claude's security code
— XSS through `render()`, JWT forgery, OAuth `state` replay, rate-limit bypass.
That's your actual field and where the real learning is, if you want it.

### Standard merge gate — every PR

1. CI green: `tsc --noEmit`, lint, `vitest run`
2. Preview deploy builds; the affected route renders
3. No new `dangerouslySetInnerHTML` outside the allowlisted files (CI grep)
4. No secret in a `NEXT_PUBLIC_*` variable

**PR descriptions carry the reasoning, not just the change.** The history is
itself a portfolio deliverable — recruiters read it, and `/security` links back
to the PRs that implemented each control.

---

## Progress

| Phase | Scope | Status |
|---|---|---|
| 0 | Foundation, CI, static headers | ☐ Not started |
| 1 | Content engine | ☐ |
| 2 | Public reading experience → **DEPLOY** | ☐ |
| 3 | Admin + editor + CTF guards | ☐ |
| 4 | Engagement — likes, OAuth, comments | ☐ |
| 5 | Specialized types + facets + search | ☐ |
| 6 | Series + freshness | ☐ |
| 7 | Newsletter | ☐ |
| 8 | CSP enforcement + pentest + `/security` | ☐ |

### Dependency graph

```
P0 ──► P1 ──┬──► P2 (public)   ─┐
            └──► P3 (admin)    ─┴──► P4 ∥ P5 ∥ P6 ∥ P7 ──► P8
```

**P2 and P3 are independent** — disjoint route trees, converging only where
publish writes `bodyHtml` and the post page reads it. After P3, four tracks
parallelize. Only P4.F (admin comment queue) reaches back into P3.

---

## Phase 0 — Foundation

| Unit | Branch | Owner |
|---|---|---|
| Scaffold: `create-next-app`, TS, Tailwind 4, App Router, `src/` | `p0/scaffold` | 🧑 |
| `lib/db.ts` — cached Mongoose connection | `p0/db` | 🤖 |
| Vitest + GitHub Actions CI + PR template | `p0/ci` | 🤖 |
| Static security headers + `security.txt` | `p0/headers` | 🧑 |
| Base layout, dark mode, typography scale | `p0/layout` | 🧑 |

- `.env.example` with every variable; `MONGODB_URI` left blank
- Typography: set line length and rhythm now. Long-form reading is the primary
  use, and retrofitting it later means re-checking every post layout.
- Headers moved here from Phase 8 — zero dependencies, so there's no reason to
  run eight phases without `nosniff`.

> ⚠️ **The cached connection is not optional.** Next's hot reload re-executes
> modules on every save; a fresh `mongoose.connect` per reload exhausts the
> Atlas connection pool within minutes of normal dev.

**Gate:** `npm run dev` serves a styled shell · `tsc --noEmit` clean ·
`vitest run` executes · CI green on a PR · `curl -I` shows the static headers ·
`/.well-known/security.txt` resolves · DB connection *defers* rather than
crashing with `MONGODB_URI` blank.

---

## Phase 1 — Content engine

Most load-bearing phase. Everything downstream renders through it.

| Unit | Branch | Owner |
|---|---|---|
| `lib/taxonomy.ts` — **vocabulary** (which categories exist) | `p1/taxonomy-vocab` | 🧑 |
| `lib/taxonomy.ts` — types + derivation machinery | `p1/taxonomy-types` | 🤖 |
| `models/Post.ts` + six discriminators + indexes | `p1/models` | 🤖 |
| `lib/markdown/render.ts` — pipeline | `p1/render` | 🤖 |
| `lib/markdown/sanitize-schema.ts` | `p1/sanitize` | 🤖 |
| `lib/markdown/directives.ts` | `p1/directives` | 🤖 |
| `lib/markdown/toc.ts` | `p1/toc` | 🧑 |
| `lib/reading-time.ts` | `p1/reading-time` | 🧑 |
| **Search spike** — validate `searchTokens` design | `p1/search-spike` | 🤖 |
| XSS payload suite through `render()` | `p1/xss-suite` | 🧑 *(optional)* |
| Seed script — every directive, every type | `p1/seed` | 🧑 |

> ⚠️ **Taxonomy must use `as const` with derived union types**
> (`typeof FRAMEWORKS[number]['slug']`). Typed as `string[]`, the "adding a
> category is one line" promise dies silently — nothing catches a typo'd slug.

> ⚠️ **One text index per collection.** Discriminators share a collection, so
> the text index is declared once on the *base* schema. Declaring it on a
> discriminator too fails at index build — in production, on deploy.

> ⚠️ **TOC extracts from the hast tree after `rehype-slug`**, never by regex
> over Markdown source. A source regex picks up `# comment` inside bash fences
> and produces IDs that drift from the real anchors on duplicate or non-ASCII
> headings.

> ⚠️ **The search spike comes before the model freezes.** `-oN` cannot work via
> `$text` — a leading `-` means negation and the tokenizer strips punctuation.
> Validate the `searchTokens` two-path design (`structure.md` §2.14) while the
> schema can still change.

**Gate:** `p1/sanitize` merges only when the payload suite runs **through
`render()`**, not against the schema in isolation — the real bugs live at
pipeline seams, and schema-only tests would have passed while both known
defects shipped. Suite must include **false-positive cases**: a fence containing
literal `<script>alert(1)</script>` must *display* as code. Shiki output must
survive sanitization.

---

## Phase 2 — Public reading → **DEPLOY**

| Unit | Branch | Owner |
|---|---|---|
| `CodeBlock` copy button + terminal variant | `p2/codeblock` | 🧑 |
| `Callout`, `Spoiler`, `FlagRedacted` | `p2/content-blocks` | 🧑 |
| YouTube embed client component | `p2/youtube` | 🤖 |
| Post page + TOC sidebar + references | `p2/post-page` | 🤖 |
| Listings: `/blog`, `/notes`, `/tags/[tag]` | `p2/listings` | 🤖 |
| Home | `p2/home` | 🧑 |
| SEO, OG images, sitemap, robots | `p2/seo` | 🤖 |
| **RSS feed** | `p2/rss` | 🤖 |
| CSP **report-only** | `p2/csp-report` | 🤖 |
| Deploy to Vercel | — | 🧑 |

- **RSS moved here from Phase 7.** It has no email dependency at all, and on
  free hosting it's the *only* working subscription channel — so it ships with
  the first public deploy, not after.
- **CSP starts report-only** and collects real violation data for weeks before
  Phase 8 enforces it.

> ⚠️ **Decide the CSP strategy now, not in Phase 8.** Nonces require
> `headers()`, which forces every page reading one into dynamic rendering —
> directly fighting the Lighthouse target on statically-generated post pages.
> Prefer `'strict-dynamic'` + hashes over per-request nonces.

> ⚠️ **`views` increments on an unauthenticated route with no rate limiting
> until Phase 3.** Either defer the counter or accept that early numbers are
> fiction.

**Gate — the one worth being rigid about:** nothing goes public until
`p1/xss-suite` is green. Also: Lighthouse 95+ on performance and accessibility,
and the post page verified on a real phone, not just devtools.

---

## Phase 3 — Admin + editor

| Unit | Branch | Owner |
|---|---|---|
| `models/User.ts` + admin seed (bcrypt 12) | `p3/user-model` | 🤖 |
| `lib/auth/session.ts` — jose | `p3/session-jose` | 🤖 |
| Auth attack suite | `p3/auth-tests` | 🧑 *(optional)* |
| `middleware.ts` admin gate | `p3/middleware` | 🤖 |
| `lib/client-ip.ts` + `lib/ratelimit.ts` | `p3/ratelimit` | 🤖 |
| `/admin/login` | `p3/login` | 🤖 |
| Admin shell + dashboard | `p3/admin-shell` | 🧑 |
| `Editor.tsx` + toolbar + preview | `p3/editor` | 🤖 |
| Cloudinary upload + `MediaLibrary` | `p3/media` | 🤖 |
| `TaxonomyPicker` + autosave + signed preview | `p3/editor-support` | 🤖 |
| Publish flow | `p3/publish` | 🤖 |
| **CTF publish guards** | `p3/ctf-guards` | 🤖 |
| CTF checklist **wording** | `p3/ctf-checklist-copy` | 🧑 |

### CTF guards ship with publish, not later

Moved up from Phase 5. Otherwise there is a two-phase window in which an active
HackTheBox writeup or a live flag can be published through your own UI — a real
takedown risk, in your own subject area.

- **Hard block:** `platform === 'HackTheBox' && retired !== true` → refuse
- **Flag scanner:** `HTB{…}`, `THM{…}`, `flag{…}`, `picoCTF{…}`, `CTF{…}` →
  refuse, show the offending line
- **Checklist** required before any `ctf` publish; store `checklistAcceptedAt`

> ⚠️ **`retired` fails closed.** Block when `undefined`, not only when `false`.
> A new CTF post has no `retired` value until someone sets one.

> ⚠️ **`x-forwarded-for` is attacker-controlled.** `xff.split(',')[0]` makes
> every rate limit bypassable with a single header. On Vercel use
> `x-vercel-forwarded-for`.

> ⚠️ **`@upstash/ratelimit` fails open on a Redis outage.** Acceptable for
> search; wrong for login, which must fail closed.

> ⚠️ **Middleware is not the authorization boundary.** Every `/api/admin/*`
> route checks the session itself. This is a Phase 3 invariant with a test, not
> a Phase 8 audit item.

> ⚠️ **`bcryptjs` does not run on the Edge runtime.** Password verification
> lives in a Node route handler, never in middleware.

**Gates:** `p3/session-jose` — app **refuses to boot** with `JWT_SECRET` unset;
attack suite green (`alg:none`, stripped signature, replayed expiry, tampered
`role`, cookie flags). `p3/ratelimit` — a spoofed `x-forwarded-for` does *not*
reset the limit, asserted by test. `p3/publish` — either `p3/ctf-guards` is
merged, or publish rejects `type: 'ctf'` with a test proving it.
`p3/ctf-guards` — `curl` POST with the checklist unticked returns 4xx;
`retired: undefined` is blocked.

**Phase done when:** a full post with pasted screenshots is written and
published entirely through the UI. Seeding retires.

---

## Phase 4 — Engagement

| Unit | Branch | Owner |
|---|---|---|
| `lib/hash.ts` — HMAC IP hashing | `p4/ip-hash` | 🤖 |
| Likes + visitor token | `p4/likes` | 🧑 |
| `lib/auth/oauth.ts` — GitHub + Google | `p4/oauth` | 🤖 |
| OAuth attack suite | `p4/oauth-tests` | 🧑 *(optional)* |
| `models/Comment.ts` + `CommentUser.ts` | `p4/comment-models` | 🤖 |
| `lib/comments/render.ts` — plain text | `p4/comment-render` | 🤖 |
| `lib/comments/filters.ts` | `p4/comment-filters` | 🤖 |
| Comment thread UI + form + sign-in prompt | `p4/comment-ui` | 🧑 |
| Reports + auto-hide | `p4/reports` | 🧑 |
| Admin queue + `/admin/commenters` | `p4/moderation` | 🤖 |
| Share buttons + per-post OG | `p4/share` | 🧑 |

**Register the GitHub and Google OAuth apps before this phase.** Free, ~10
minutes, but nothing here works without them.

> ⚠️ **Honeypot and timing rejections must return a fake success** and show the
> comment to its author as if posted. A distinguishable error is an oracle a bot
> tunes against.

> ⚠️ **`trusted` flips only on admin approval**, never on submission. Otherwise
> one benign first comment buys a spammer permanent bypass.

> ⚠️ **The unique compound index `{postId, visitorId}` is what enforces one
> like per visitor** — not the cookie. Cookie deletion means a re-like; that's
> accepted, and it's why this isn't an auth problem.

> ⚠️ **IP hashing uses HMAC with a secret pepper, not a bare hash.** IPv4 has
> only 2³² possible inputs — an unpeppered SHA-256 of an IP is exhaustively
> reversed in seconds. The pepper's secrecy is the entire control. *(This
> paragraph belongs on `/security` more or less verbatim.)*

**Gates:** `p4/oauth` — callback without `state` rejected; `returnTo=//evil.com`
rejected. `p4/comment-filters` — honeypot hit indistinguishable from success;
`trusted` flips only on approval. `p4/comment-ui` — admin queue exists, or the
flag is off.

**Phase done when:** a signed-in reader's comment appears instantly, a
link-stuffed one lands in the queue, and the queue holds only exceptions.

---

## Phase 5 — Specialized types, facets, search

| Unit | Branch | Owner |
|---|---|---|
| Facet landing pages (real URLs) | `p5/facets` | 🤖 |
| Tool pages — install + cheatsheet table | `p5/tools` | 🧑 |
| Policy pages + downloads | `p5/policies` | 🧑 |
| Glossary A–Z index + term pages | `p5/glossary` | 🧑 |
| Glossary hover-cards + in-post auto-linking | `p5/glossary-links` | 🤖 |
| Search — two-path implementation | `p5/search` | 🤖 |
| Cross-linking: tools ↔ writeups | `p5/cross-links` | 🤖 |

Facets get **real URLs** — `/ctf/platform/[platform]`, `/ctf/difficulty/[level]`,
`/tools/category/[category]`, `/policies/framework/[framework]` — each with its
own title, meta description and blurb from `taxonomy.ts`. Combined query-string
filters are `noindex`.

> ⚠️ **`shortDef` is plain text, rendered as text — never HTML.** Otherwise it's
> a second stored-XSS path bypassing the `bodyHtml` pipeline entirely.

> ⚠️ **Glossary auto-linking operates on the hast tree, never a regex over the
> HTML string.** A string regex matches inside `<code>`, inside attribute
> values, and inside existing anchors — the single most likely way to mangle
> every page on the site at once.

**Gate:** `p5/search` — searching `-oN` returns `nmap`; searching a prose phrase
still works; neither path breaks the other.

---

## Phase 6 — Series + freshness

| Unit | Branch | Owner |
|---|---|---|
| `models/Series.ts` + `/admin/series` reorder | `p6/series-model` | 🤖 |
| Series overview + prev/next | `p6/series-nav` | 🧑 |
| Reader progress (localStorage) | `p6/progress` | 🧑 |
| `lastReviewedAt` + review action | `p6/freshness` | 🤖 |
| `StaleBanner` | `p6/stale-banner` | 🧑 |
| `/admin/review` queue | `p6/review-queue` | 🧑 |

Freshness excludes `ctf` — writeups are historical records of a point in time,
not living guides.

**Gate:** a reader follows a path start to finish without an account; a post
older than 18 months visibly says so.

---

## Phase 7 — Newsletter

Ships **complete**. Only the send is gated.

| Unit | Branch | Owner |
|---|---|---|
| `lib/email/provider.ts` + `ConsoleProvider` | `p7/email-provider` | 🤖 |
| `models/Subscriber.ts` | `p7/subscriber-model` | 🤖 |
| Subscribe form + rate limit | `p7/subscribe` | 🧑 |
| Double opt-in state machine + tokens | `p7/opt-in` | 🤖 |
| Unsubscribe flow | `p7/unsubscribe` | 🤖 |
| Newsletter composer | `p7/composer` | 🤖 |
| `ResendProvider` | `p7/resend` | 🤖 |

```
EmailProvider { send(msg): Promise<void>; canSendBulk: boolean }
  ├── ConsoleProvider    logs confirm link to stdout        → dev + tests
  ├── ResendDevProvider  real send, own address only        → smoke test
  └── ResendProvider     verified domain                    → prod
```

Everything is built and tested against `ConsoleProvider` — deterministic, and
better for testing than real email because there's no inbox to poll. The send
button is disabled unless `provider.canSendBulk`.

**A custom domain flips one env var.** Nothing sits half-finished on a branch.

- Tokens are `crypto.randomBytes`, not predictable
- Unsubscribe is idempotent, needs no login, and must not leak whether an
  address was ever subscribed
- The composer reads `status === 'published'` only
- **Sending is a separate explicit action from publishing** — publish, read it
  live, then choose to send. A typo caught after publishing never reaches an
  inbox.

**Gate:** double opt-in completes end to end against `ConsoleProvider`; the send
button is provably disabled without `canSendBulk`.

---

## Phase 8 — Enforcement + pentest + `/security`

| Unit | Branch | Owner |
|---|---|---|
| CSP report-only → enforce | `p8/csp-enforce` | 🤖 |
| Dependency + `NEXT_PUBLIC_*` + route audits | `p8/audit` | 🧑 |
| Self-directed pentest | `p8/pentest` | 🧑 |
| `/security` writeup | `p8/security-page` | 🧑 |
| `/about` | `p8/about` | 🧑 |

Pentest scope: XSS in comments and posts, IDOR on comment edit/delete,
rate-limit bypass, OAuth state/CSRF, SSRF via embeds, publish-guard bypass by
direct API call.

**The recurring definition of done for every control: bypass it with `curl`.**
Checklist unticked → publish via the API anyway. Rate limit → spoofed header.
Client-side validation → direct POST. Better gate than "looks right."

> ⚠️ **Every claim on `/security` must map to a merged test or a code
> reference.** A security page describing controls that don't exist is worse
> than no page at all.

**Gate:** `p8/csp-enforce` — zero violations in report-only for 7 days on the
live site.

---

## Deferred

Not in scope. Revisit only on real need.

- Live-updating comments and view counters (websockets/SSE)
- Multi-author support
- Atlas Search — only if the two-path search proves weak in practice
- Analytics — if added, privacy-respecting (Plausible, Umami), not Google
  Analytics, which would be tonally wrong here
- Block/WYSIWYG editor — only if Markdown genuinely proves limiting
- Custom domain — see `README.md`; changes `EMAIL_PROVIDER` and nothing else
