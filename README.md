# Security Blog & Knowledge Base

A publishing platform for cybersecurity writing — articles, CTF writeups, a
searchable tool reference, security policy templates, and structured learning
paths. Built to be **used during real work**, not just read once.

> **Status: planning.** Nothing is built yet. This README describes the intended
> system. See [`implementation.md`](implementation.md) for build progress.

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
  Cheatsheet commands are indexed by search, so `-oN` finds `nmap`.
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
* **Video embeds** through a controlled directive — raw `<iframe>` is rejected
  by the sanitizer.

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
* **OAuth sign-in (GitHub / Google)** is the primary spam control — bots don't
  provision OAuth accounts at volume. No passwords are ever stored.
* Layered automatic filters hold only *suspicious* comments: rate limits,
  honeypot, timing check, link-count and pattern matching, and a one-time hold
  on a commenter's first post.
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

* **`rehype-sanitize` on all rendered Markdown**, with a *stricter* schema for
  comments than for posts — no images, no headings, links forced to
  `rel="nofollow ugc noopener"`. Markdown permits raw HTML; unsanitized Markdown
  rendering is an XSS sink.
* No raw `<iframe>` or `<script>` anywhere. Embeds only via controlled directives.
* Admin sessions signed with `jose`; cookies `httpOnly` + `secure` +
  `sameSite=strict`. Fails closed if `JWT_SECRET` is unset — no insecure fallback.
* `bcryptjs` cost 12. Generic login failure message — no user enumeration.
* All `/admin/*` gated in middleware, not client-side.
* Upstash rate limiting on login, comments, likes, subscribe and search.
* CSP without `unsafe-inline`, plus HSTS, `nosniff`, `Referrer-Policy` and a
  restrictive `Permissions-Policy`.
* IPs stored hashed with a server-side pepper, never plaintext.
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
| Email | Resend |
| Hosting | Vercel |

---

## 🚀 Getting started

> Not yet applicable — Phase 0 has not been run. These are the intended steps.

```bash
npm install
cp .env.example .env.local     # then fill in the values below
npm run dev
```

### Environment variables

```bash
# Database
MONGODB_URI=

# Admin session — app fails closed if unset
JWT_SECRET=

# Hashing pepper for IP storage
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

# Email (Phase 7 — requires a custom domain, see below)
RESEND_API_KEY=
NEWSLETTER_FROM_EMAIL=

# Public
NEXT_PUBLIC_SITE_URL=
```

Nothing sensitive goes in a `NEXT_PUBLIC_*` variable.

---

## ⚠️ Known constraint: newsletter needs a custom domain

The site runs on `*.vercel.app` for Phases 0–6 at no cost.

**Resend cannot send email from a `vercel.app` subdomain.** Sending requires
SPF and DKIM DNS records on a domain you control, and Vercel's DNS isn't yours.
This is how email authentication works rather than a Resend restriction — mail
sent without it goes to spam.

So Phase 7 sending needs a custom domain (~$10–15/year). Email *collection*
works fine before then. A custom domain is also better for SEO and for
`security.txt`.
