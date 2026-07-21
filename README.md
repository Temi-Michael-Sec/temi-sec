# Security Blog & Knowledge Base

A publishing platform for cybersecurity writing — articles, CTF writeups, a
searchable tool reference, security policy templates, and structured learning
paths. Built to be **used during real work**, not just read once.

> **Status: Phase 0 complete.** Foundation, CI and static security headers are
> in. The content engine is next. See [`implementation.md`](implementation.md)
> for progress and [`PLAN.md`](PLAN.md) for the reasoning.

---

## 📁 Source of truth

| File | Purpose |
|---|---|
| [`README.md`](README.md) | What this is, features, setup, env vars |
| [`structure.md`](structure.md) | Folder layout + full data model reference |
| [`implementation.md`](implementation.md) | Phased build steps and progress |
| [`PLAN.md`](PLAN.md) | Design decisions and the reasoning behind them |

`PLAN.md` explains *why*. The other three explain *what* and *how*.

---

## 🎯 Goals

Ranked — when they conflict, the higher one wins.

1. **Teach.** Content should genuinely help someone learning security.
2. **Be a personal reference.** The tool library and policy templates get used
   during real engagements and coursework.
3. **Demonstrate capability.** A security site that is itself well secured.

---

## 🌟 Features

### 1. Six content types, each shaped for its purpose

* **Articles** — long-form writing, stories, commentary, advisories.
* **CTF Writeups** — structured with platform, box name, difficulty, OS,
  category and tools used, so they are *filterable*: "every Medium Linux box
  where I used `linpeas`."
* **Tool Library** — install steps, flag cheatsheets and real usage examples.
  Cheatsheet commands and flags are extracted into an exact-match token index at
  publish, so searching `-oN` finds `nmap`. (A plain MongoDB text index cannot
  do this — a leading `-` means negation and the tokenizer eats punctuation, so
  search runs two paths. See `structure.md` §2.14.)
* **Security Policies** — downloadable templates mapped to ISO 27001, NIST CSF,
  SOC 2, GDPR and PCI DSS, with explanations.
* **Notes** — short-form TIL entries. Keeps the site alive between long posts.
* **Glossary** — term definitions with aliases and related terms. Doubles as a
  teaching surface and a strong SEO surface.

### 2. Markdown editor built for security writing

* Split-pane Markdown source with **live preview**.
* **Drag-and-drop and clipboard-paste image upload** — screenshots go straight
  in, `![alt](url)` is written for you. Never type a URL.
* **Syntax highlighting** via Shiki (the VS Code engine) with a copy button and
  a terminal-styled variant for shell output.
* **Callout blocks** — `note`, `tip`, `warning`, `danger`.
* **Spoiler blocks** — hide solution steps so readers still working a box aren't
  spoiled.
* **Footnote citations** plus a structured References field (title, URL, date
  accessed) for CVEs, advisories and vendor docs.
* **Video embeds** through a controlled directive. Raw `<iframe>` is never
  allowed — the directive emits a validated data attribute instead.

### 3. Effortless categorisation, built for SEO

* **Controlled vocabulary.** Framework, platform, difficulty, OS and category
  are fixed picklists from a single config file — never free text. Free text
  fragments into `Recon` / `recon` / `Reconnaissance` and breaks both navigation
  and search ranking.
* **Real URLs for every facet.** `/policies/framework/iso-27001` is an indexed
  landing page with its own title, description and intro copy. Query-string
  filters exist for browsing and are `noindex`.
* Adding a new framework or category is **one line** — picker, landing page,
  filter chip, breadcrumb and sitemap entry all derive from it.

### 4. Open comments that don't drown you in moderation

* **Comments appear immediately.** No approval wait.
* **Plain text only** — comments never touch a Markdown parser. Rendering is
  escape → `<br>` → backtick `<code>`, and nothing else. There is no allowlist
  to maintain and no parser to inherit a CVE from on the one path that accepts
  input from strangers. URLs render as copyable text, not anchors, which also
  means link spam has zero SEO value.
* **OAuth sign-in (GitHub / Google)** is the primary spam control — bots don't
  provision OAuth accounts at volume. No passwords are ever stored.
* Layered automatic filters hold only *suspicious* comments: rate limits,
  honeypot, timing check, link-count and pattern matching, and a one-time hold
  on a commenter's first post. Honeypot and timing rejections return a **fake
  success**, so the filter can't be used as an oracle.
* A commenter becomes `trusted` **only when an admin approves a held comment** —
  never on submission, or one benign first post would buy a permanent bypass.
* Reader reports auto-hide a comment at 3 reports.
* The admin queue therefore contains a handful of items per week, not everything.

### 5. CTF platform compliance, enforced

Platform rules are binding — HackTheBox issues takedowns for active-machine
writeups. So these are **publish-flow guards, not documentation**:

* **Active machines are hard-blocked** from publishing.
* **Flag scanner** sweeps for `HTB{…}`, `THM{…}`, `flag{…}`, `picoCTF{…}` and
  refuses to publish on a hit.
* `::flag[user]` directive renders a redacted block so flags can be discussed
  without being printed.
* **Pre-publish checklist** for what no scanner can catch — screenshots
  containing flags, usernames, internal IPs or session tokens. Image redaction
  is manual, and the checklist says so plainly rather than implying coverage.

### 6. Content freshness tracking

Security content decays. A patched privesc technique or a stale hardening guide
isn't merely useless to a learner — it's harmful.

* `lastReviewedAt` on every post, bumped by an explicit "Reviewed, still
  accurate" action.
* Automatic public banner on anything older than **18 months**.
* Admin review queue, oldest first.
* CTF writeups are excluded — they're historical records, not living guides.

### 7. Learning paths

Ordered multi-part series with prev/next navigation and reader progress stored
in `localStorage` — no account needed to follow a path.

### 8. Newsletter

* RSS/Atom feed for technical readers.
* Email list with **double opt-in** and one-click token unsubscribe.
* Sending reads **published posts only**, and is a **separate explicit action**
  from publishing — publish, read it live, *then* choose to send. Drafts can
  never reach an inbox.

---

## 🔒 Security

The site is a security portfolio; it being compromised would undercut its whole
premise. Full detail in [`PLAN.md`](PLAN.md) §10.

* **`rehype-sanitize` on all rendered Markdown.** Markdown permits raw HTML;
  unsanitized Markdown rendering is an XSS sink. Sanitization runs **before**
  Shiki, because Shiki emits inline `style` that the sanitizer would otherwise
  strip — and allowlisting `style` to "fix" that opens CSS injection.
* **Comments bypass the Markdown pipeline entirely** — plain text, no parser,
  no schema.
* No raw `<iframe>` or `<script>` anywhere. The video directive emits
  `<div data-youtube-id>` with a validated ID and a client component builds the
  frame, because `rehype-sanitize` can't constrain an iframe `src` to a host —
  allowing iframes at all would let a hand-written one through.
* Admin sessions signed with `jose`; cookies `httpOnly` + `secure` +
  `sameSite=strict`. Fails closed if `JWT_SECRET` is unset — no insecure fallback.
* `bcryptjs` cost 12. Generic login failure message — no user enumeration.
* All `/admin/*` gated in `proxy.ts` — **and every `/api/admin/*` route
  re-checks the session itself.** Next 16 renamed `middleware`→`proxy`, and its
  docs are explicit that proxy is for optimistic checks, "not a full session
  management or authorization solution." Defence in depth, never the boundary.
* Upstash rate limiting on login, comments, likes, subscribe and search — keyed
  on `x-vercel-forwarded-for`, never raw `x-forwarded-for` (which is
  attacker-controlled, so `xff.split(',')[0]` makes every limit bypassable with
  one header).
* CSP without `unsafe-inline`, plus HSTS, `nosniff`, `Referrer-Policy` and a
  restrictive `Permissions-Policy`.
* IPs stored as **HMAC-SHA256 with a server-side pepper**, never plaintext. The
  pepper's secrecy is the whole control — IPv4 has only 2³² possible inputs, so
  an unpeppered hash is exhaustively reversed in seconds.
* `/.well-known/security.txt` ([RFC 9116](https://www.rfc-editor.org/rfc/rfc9116))
  so anyone finding a vulnerability has a disclosure channel.

---

## 🛠 Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router) |
| UI | React 19 + TypeScript |
| Styling | Tailwind CSS 4 |
| Database | MongoDB Atlas + Mongoose |
| Admin auth | `jose` (JWT) + `bcryptjs` |
| Comment auth | OAuth — GitHub + Google |
| Rate limiting | Upstash Redis |
| Markdown | `unified` / remark / rehype + Shiki |
| Images | Cloudinary |
| Email | Resend (`EMAIL_PROVIDER` switch) |
| Hosting | Vercel — free `*.vercel.app` |

---

## 🚀 Getting started

```bash
npm install
cp .env.example .env.local     # then fill in MONGODB_URI
npm run dev
```

The app boots and serves pages with `MONGODB_URI` blank — only DB-backed routes
fail, and they fail with a pointed message. Contrast `JWT_SECRET` (Phase 3),
which fails at boot on purpose.

```bash
npm run typecheck    # tsc --noEmit
npm run lint
npm test             # vitest run
npm run build
```

### Environment variables

```bash
# Database — fill this in from MongoDB Atlas
MONGODB_URI=

# Admin session — app REFUSES TO BOOT if unset. No insecure fallback.
JWT_SECRET=

# HMAC pepper for IP hashing. Must be secret and must never rotate casually
# (rotating orphans every stored ipHash). IPv4 is only 2^32 inputs, so without
# this an ipHash is brute-forceable in seconds — the pepper IS the control.
IP_HASH_PEPPER=

# Cloudinary
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# OAuth — commenter sign-in (Phase 4)
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Upstash rate limiting
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# Email — console | resend-dev | resend
# console:    logs the confirm link to stdout. Deterministic, best for testing.
# resend-dev: real sends, but only to your own verified address.
# resend:     requires a verified custom domain. Only this sets canSendBulk.
EMAIL_PROVIDER=console
RESEND_API_KEY=
NEWSLETTER_FROM_EMAIL=

# Public — the single canonical-URL source. Changing hosts is one variable.
NEXT_PUBLIC_SITE_URL=
```

Nothing sensitive goes in a `NEXT_PUBLIC_*` variable.

---

## ⚠️ Known constraint: newsletter sending needs a custom domain

**Decision: stay free on `*.vercel.app`.** Upgrade to a custom domain later if
the newsletter becomes worth it.

**Resend cannot send from a `vercel.app` subdomain.** SPF and DKIM require DNS
records on a domain you control, and Vercel's DNS isn't yours. This is how email
authentication works rather than a Resend restriction — unauthenticated mail
lands in spam.

### What this actually blocks

Only the **send**. Everything else ships:

| | Works on `vercel.app` |
|---|---|
| RSS feed | ✅ — and it's the primary subscription channel now |
| Subscribe form, storing subscribers | ✅ |
| Double opt-in state machine, tokens, unsubscribe | ✅ — built and tested against `ConsoleProvider` |
| Newsletter composer | ✅ |
| Actually sending to subscribers | ❌ — gated on `provider.canSendBulk` |

So Phase 7 is **built complete**, not deferred. A domain flips `EMAIL_PROVIDER`
and nothing else.

### Why not Gmail SMTP

It works and there's a reusable pattern in `tcn-lekki/src/lib/mail.ts`, but:
free Gmail caps at **~100/day via SMTP** (stricter than its 500/day web limit),
Google enforces behavioural blocks well below that, and a confirmation email
from `@gmail.com` fails DMARC alignment and reads as phishing. It would also
mean a throwaway adapter plus a long-lived app password to manage. Resend's free
tier already sends without a domain (self only), using the same library that
ships in production.

### The cost of migrating later

Honest tradeoff, since this is the free option: moving domains after Google has
indexed the site loses ranking, and you can't cleanly set redirects from a
`*.vercel.app` subdomain. Keeping `NEXT_PUBLIC_SITE_URL` as the single canonical
source limits the code damage to one variable, but the SEO cost is real.

One thing that does *not* change: the admin session uses the `__Host-` cookie
prefix regardless of host, which gives subdomain-injection protection
independent of the Public Suffix List.
