import Link from "next/link";
import { getLatest, getTypeCounts } from "@/lib/posts";
import { PostRow } from "@/components/post/PostCard";
import { Prompt } from "@/components/post/Prompt";

export const revalidate = 300;

/** The content pillars, in the order they appear in "Explore". */
const PILLARS: {
  key: string;
  label: string;
  href: string;
  desc: string;
  countKeys: string[];
}[] = [
  {
    key: "ctf",
    label: "CTF Writeups",
    href: "/ctf",
    desc: "Retired boxes and rooms, with the reasoning — not just the commands.",
    countKeys: ["ctf"],
  },
  {
    key: "tool",
    label: "Tool Library",
    href: "/tools",
    desc: "Install steps and searchable cheatsheets for the tools I actually use.",
    countKeys: ["tool"],
  },
  {
    key: "policy",
    label: "Policies",
    href: "/policies",
    desc: "GRC templates mapped to ISO 27001, NIST CSF and SOC 2 — ready to adapt.",
    countKeys: ["policy"],
  },
  {
    key: "glossary",
    label: "Glossary",
    href: "/glossary",
    desc: "Plain-English definitions, cross-linked across every writeup.",
    countKeys: ["glossary"],
  },
  {
    key: "article",
    label: "Blog & Notes",
    href: "/blog",
    desc: "Long-form articles and short TILs from day-to-day security work.",
    countKeys: ["article", "note"],
  },
];

export default async function Home() {
  const [latest, counts] = await Promise.all([getLatest(6), getTypeCounts()]);

  return (
    <div className="mx-auto max-w-5xl px-5">
      {/* Hero */}
      <section className="pb-8 pt-14">
        <Prompt kind="listing" path="~" className="text-faint" />
        <h1 className="mt-4 max-w-[20ch] text-balance text-[clamp(2rem,5vw,3rem)] font-semibold leading-[1.08] tracking-[-0.02em]">
          Security notes, CTF writeups, and a tool reference that gets used.
        </h1>
        <p className="mt-4 max-w-[54ch] text-muted">
          Field notes from learning offensive and defensive security — retired
          boxes, tooling I keep coming back to, and policy templates worth
          stealing. Written to teach, kept honest.
        </p>
        <div className="mt-5 flex flex-wrap items-center gap-3 font-mono text-[0.8125rem] text-muted">
          <span>follow along —</span>
          <a
            href="/rss.xml"
            className="rounded border px-2.5 py-1 text-accent"
            style={{ borderColor: "color-mix(in oklab, var(--accent) 40%, var(--border))" }}
          >
            RSS
          </a>
          <span className="text-faint">no email, no algorithm</span>
        </div>
      </section>

      {/* Latest */}
      {latest.length > 0 && (
        <section className="mt-8">
          <div className="mb-4 flex items-baseline gap-3">
            <h2 className="text-xl font-semibold tracking-[-0.01em]">Latest</h2>
            <Link
              href="/blog"
              className="ml-auto font-mono text-[0.8125rem] text-muted hover:text-accent"
            >
              all posts →
            </Link>
          </div>
          <div className="border-t border-border">
            {latest.map((post) => (
              <PostRow key={post.id} post={post} />
            ))}
          </div>
        </section>
      )}

      {/* Explore by type */}
      <section className="mt-12">
        <h2 className="mb-4 text-xl font-semibold tracking-[-0.01em]">Explore</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {PILLARS.map((p) => {
            const count = p.countKeys.reduce((n, k) => n + (counts[k] ?? 0), 0);
            return (
              <Link
                key={p.key}
                href={p.href}
                className="block rounded-[var(--radius)] border border-border bg-surface p-4 transition-transform hover:-translate-y-0.5"
                style={{ borderLeft: `3px solid var(--t-${p.key})` }}
              >
                <span className="flex items-baseline gap-2">
                  <span
                    className="font-mono text-[0.9rem]"
                    style={{ color: `var(--t-${p.key})` }}
                  >
                    {p.label}
                  </span>
                  <span className="ml-auto font-mono text-[0.72rem] text-faint">
                    {count}
                  </span>
                </span>
                <p className="mt-1.5 text-sm text-muted">{p.desc}</p>
              </Link>
            );
          })}
        </div>
      </section>

      <div className="h-16" />
    </div>
  );
}
