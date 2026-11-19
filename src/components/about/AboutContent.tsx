"use client";

import { useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { Prompt } from "@/components/post/Prompt";

gsap.registerPlugin(ScrollTrigger, useGSAP);

/* ─────────────────────────────────────────────────────────────────────────────
 * EDIT ME — everything personal lives in this one block, kept out of the JSX and
 * the animation code below. Change a string here and the page updates; you never
 * have to touch layout or GSAP. Keep every claim here backed by the CV
 * (public/Olasehinde_Michael_CV.pdf) — the two are read side by side.
 * ───────────────────────────────────────────────────────────────────────────── */

const INTRO = [
  "I'm Temi — a software developer and application security engineer in Lagos. I build Go and Next.js systems for payments and fintech, and I keep asking how each feature could be abused: I harden APIs, audit apps before launch, and write small security tools while studying Cybersecurity.",
  "temi.sec is the notebook: CTF writeups that explain the reasoning rather than dumping commands, a tool reference I keep open during boxes, GRC policy templates worth adapting, and the occasional longer piece. If it wouldn't help someone six months behind me, it doesn't ship.",
] as const;

/** Skills grouped by domain — mirrors the CV's Skills section. */
const SKILLS: { area: string; note: string; items: string[] }[] = [
  {
    area: "Application Security",
    note: "the core of the work",
    items: [
      "Secure code review",
      "Security audits",
      "OWASP Top 10",
      "AuthN / AuthZ (JWT, RBAC)",
      "CSRF & SSRF defence",
      "Rate limiting",
      "Log redaction",
      "CSP & HSTS",
    ],
  },
  {
    area: "Security Tools",
    note: "the reach-for-it set",
    items: [
      "Burp Suite",
      "Nmap",
      "GoBuster",
      "Semgrep",
      "Snyk",
      "gitleaks",
      "npm audit",
    ],
  },
  {
    area: "Languages & Frameworks",
    note: "what I build with",
    items: [
      "Go",
      "TypeScript",
      "Python",
      "SQL",
      "C",
      "Bash",
      "Gin / GORM",
      "Next.js / React",
    ],
  },
  {
    area: "Data & Tooling",
    note: "where it runs",
    items: [
      "PostgreSQL",
      "MongoDB",
      "Redis",
      "Supabase",
      "Docker",
      "GitHub Actions",
      "Vercel",
      "Linux",
    ],
  },
];

/** The `~/now` block — the one section you'll update most often. */
const NOW: string[] = [
  "Studying for a B.Sc. in Cybersecurity at MIVA Open University.",
  "Building Go and Next.js payment features at Bleeprs, and hardening Nelius DAO's Go API.",
  "Building Watchdog — TLS, domain-expiry and security-header monitoring with an SSRF-safe checker.",
  "Recently certified: ALX Cybersecurity and ALX ProDev Frontend (2026).",
];

/**
 * The security-portfolio angle: the site is itself an exhibit. Each line is a
 * decision a reviewer can go and verify in the source.
 */
const BUILD: { title: string; detail: string }[] = [
  {
    title: "Sanitised rendering",
    detail:
      "Every stored post is sanitised before it's syntax-highlighted — the render pipeline treats content as hostile by contract.",
  },
  {
    title: "Auth built from scratch",
    detail:
      "Session JWTs, a __Host- cookie, bcrypt at cost 12, and an optimistic gate backed by a secure server-side re-check.",
  },
  {
    title: "A controlled content model",
    detail:
      "A typed taxonomy is the single source of truth, so a typo'd category is a compile error rather than a broken page.",
  },
  {
    title: "Hardened by default",
    detail:
      "Security headers, a Content-Security-Policy, rate limiting, and CI guards that fail the build on a raw-HTML sink.",
  },
];

const LINKS: { label: string; href: string; external: boolean }[] = [
  // A plain link, never an iframe/object: X-Frame-Options DENY and the CSP's
  // object-src 'none' / frame-ancestors 'none' would (rightly) block an embed.
  { label: "CV (PDF)", href: "/Olasehinde_Michael_CV.pdf", external: true },
  // Main profile (all repos, as on the CV) vs this site's own source — the
  // repo is itself evidence of the security work described above.
  { label: "GitHub", href: "https://github.com/Temi-Michael", external: true },
  { label: "Site source", href: "https://github.com/Temi-Michael-Sec/temi-sec", external: true },
  { label: "LinkedIn", href: "https://www.linkedin.com/in/temi-michael", external: true },
  { label: "RSS", href: "/rss.xml", external: false },
  { label: "security.txt", href: "/.well-known/security.txt", external: false },
];

// ── Small building blocks ────────────────────────────────────────────────────

function SectionLabel({ children }: { children: string }) {
  return (
    <p className="mb-4 font-mono text-[0.72rem] uppercase tracking-[0.1em] text-faint">
      {children}
    </p>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export function AboutContent() {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      // Accessibility: content is fully visible in CSS by default. We only hide
      // and animate inside the "no-reduced-motion" branch, so reduced-motion
      // users (and no-JS) simply see the finished page — nothing to undo.
      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        // Hero: a short, staggered rise on load.
        const heroBits = gsap.utils.toArray<HTMLElement>("[data-hero]");
        gsap.set(heroBits, { opacity: 0, y: 14 });
        gsap.to(heroBits, {
          opacity: 1,
          y: 0,
          duration: 0.6,
          ease: "power2.out",
          stagger: 0.09,
          delay: 0.05,
        });

        // Each section rises in as it scrolls into view.
        gsap.utils.toArray<HTMLElement>("[data-reveal]").forEach((el) => {
          gsap.set(el, { opacity: 0, y: 22 });
          gsap.to(el, {
            opacity: 1,
            y: 0,
            duration: 0.6,
            ease: "power2.out",
            scrollTrigger: {
              trigger: el,
              start: "top 85%",
              once: true,
            },
          });
        });

        // Grid cards get a stagger of their own, keyed to the section entering.
        gsap.utils.toArray<HTMLElement>("[data-stagger]").forEach((group) => {
          const cards = gsap.utils.toArray<HTMLElement>(
            "[data-card]",
            group,
          );
          gsap.set(cards, { opacity: 0, y: 18 });
          gsap.to(cards, {
            opacity: 1,
            y: 0,
            duration: 0.5,
            ease: "power2.out",
            stagger: 0.07,
            scrollTrigger: {
              trigger: group,
              start: "top 80%",
              once: true,
            },
          });
        });
      });

      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <div ref={root} className="mx-auto max-w-4xl px-5">
      {/* ── Hero ── */}
      <header className="pb-10 pt-14">
        <div data-hero>
          <Prompt kind="post" path="~" name="whoami" className="text-faint" />
        </div>
        <h1
          data-hero
          className="mt-4 max-w-[18ch] text-balance text-[clamp(2rem,5vw,3rem)] font-semibold leading-[1.08] tracking-[-0.02em]"
        >
          Learning security in the open — and building the proof.
        </h1>
        <div
          data-hero
          className="measure mt-5 flex flex-col gap-4 text-[1.05rem] leading-[1.75] text-muted"
        >
          {INTRO.map((p) => (
            <p key={p.slice(0, 24)}>{p}</p>
          ))}
        </div>
        <div
          data-hero
          className="mt-6 flex flex-wrap items-center gap-3 font-mono text-[0.8125rem] text-muted"
        >
          <span>follow along —</span>
          <a
            href="/rss.xml"
            className="rounded border px-2.5 py-1 text-accent"
            style={{
              borderColor: "color-mix(in oklab, var(--accent) 40%, var(--border))",
            }}
          >
            RSS
          </a>
          <span className="text-faint">no email, no algorithm</span>
        </div>
      </header>

      {/* ── Skills & tools ── */}
      <section data-reveal className="border-t border-border py-12">
        <SectionLabel>What I work with</SectionLabel>
        <div
          data-stagger
          className="grid gap-4 sm:grid-cols-2"
        >
          {SKILLS.map((group) => (
            <div
              key={group.area}
              data-card
              className="rounded-[var(--radius)] border border-border p-5 transition-colors hover:border-accent"
            >
              <div className="flex items-baseline justify-between gap-3">
                <h2 className="font-mono text-[0.95rem] font-medium text-foreground">
                  {group.area}
                </h2>
                <span className="font-mono text-[0.68rem] text-faint">
                  {group.note}
                </span>
              </div>
              <ul className="mt-3.5 flex flex-wrap gap-2">
                {group.items.map((item) => (
                  <li
                    key={item}
                    className="rounded border border-border bg-surface px-2 py-1 font-mono text-[0.75rem] text-muted"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* ── Currently / ~/now ── */}
      <section data-reveal className="border-t border-border py-12">
        <SectionLabel>~/now</SectionLabel>
        <div className="rounded-[var(--radius)] border border-border bg-surface p-5 font-mono text-[0.9rem]">
          <p className="text-faint">
            <span className="text-accent">temi@sec</span>
            <span className="text-muted">:~</span>
            <span className="ml-0.5 mr-1">$</span>
            <span className="text-foreground">cat now.md</span>
          </p>
          <ul className="mt-4 flex flex-col gap-2.5">
            {NOW.map((line) => (
              <li key={line} className="flex gap-2.5 text-muted">
                <span aria-hidden="true" className="select-none text-accent">
                  ▸
                </span>
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── The build (security-portfolio angle) ── */}
      <section data-reveal className="border-t border-border py-12">
        <SectionLabel>This site is part of the portfolio</SectionLabel>
        <p className="measure mb-6 text-[1.02rem] leading-[1.7] text-muted">
          temi.sec isn&apos;t a template. It&apos;s built the way I&apos;d want
          production software built — every decision below is one you can go and
          check in the source.
        </p>
        <div data-stagger className="grid gap-4 sm:grid-cols-2">
          {BUILD.map((item) => (
            <div
              key={item.title}
              data-card
              className="rounded-[var(--radius)] border border-border p-5 transition-colors hover:border-accent"
            >
              <h3 className="text-[0.98rem] font-semibold text-foreground">
                {item.title}
              </h3>
              <p className="mt-2 text-[0.9rem] leading-[1.65] text-muted">
                {item.detail}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Links ── */}
      <section data-reveal className="border-t border-border py-12">
        <SectionLabel>Find me</SectionLabel>
        <div className="flex flex-wrap gap-3 font-mono text-sm">
          {LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              {...(link.external
                ? { target: "_blank", rel: "noopener noreferrer" }
                : {})}
              className="rounded border border-border px-3.5 py-2 text-accent transition-colors hover:border-accent"
            >
              {link.label} ↗
            </a>
          ))}
        </div>
        <p className="mt-6 text-[0.85rem] text-faint">
          Found a hole before the{" "}
          <span className="font-mono">/security</span> page exists? The{" "}
          <a
            href="/.well-known/security.txt"
            className="text-accent underline-offset-2 hover:underline"
          >
            security.txt
          </a>{" "}
          has a contact.
        </p>
      </section>

      <div className="h-16" />
    </div>
  );
}
