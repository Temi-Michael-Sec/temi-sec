import type { Metadata } from "next";
import { Prompt } from "@/components/post/Prompt";
import { buildListingMetadata } from "@/lib/seo";

export const metadata: Metadata = buildListingMetadata(
  "About",
  "Who's behind temi.sec, and why it exists.",
  "/about",
);

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-5">
      <header className="pb-6 pt-14">
        <Prompt kind="post" path="~" name="temi" className="text-faint" />
        <h1 className="mt-3 text-[clamp(1.9rem,4vw,2.5rem)] font-semibold tracking-[-0.02em]">
          About
        </h1>
      </header>

      <div className="measure flex flex-col gap-4 py-4 text-[1.02rem] leading-[1.75]">
        <p>
          I&apos;m Temi — a cybersecurity student learning offensive and
          defensive security in the open. This site is where I write it down:
          CTF writeups, notes on the tools I keep reaching for, policy templates,
          and the occasional longer piece.
        </p>
        <p>
          The goal is to be genuinely useful — to a version of me from six months
          ago, and to anyone else working through the same material. Writeups
          explain the <em>why</em>, not just the commands. The tool library is a
          reference I actually use during boxes. Nothing here is filler.
        </p>
        <p>
          It&apos;s also a working example. The site is built with care —
          sanitised rendering, a controlled content model, its own hardening —
          and eventually a{" "}
          <span className="font-mono text-sm">/security</span> page will document
          exactly how. If you find a hole before then, the{" "}
          <a
            href="/.well-known/security.txt"
            className="text-accent underline-offset-2 hover:underline"
          >
            security.txt
          </a>{" "}
          has a contact.
        </p>

        <div className="mt-4 flex flex-wrap gap-3 font-mono text-sm">
          <a
            href="https://github.com/Temi-Michael-Sec"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded border border-border px-3 py-1.5 text-accent hover:border-accent"
          >
            GitHub ↗
          </a>
          <a
            href="/rss.xml"
            className="rounded border border-border px-3 py-1.5 text-accent hover:border-accent"
          >
            RSS ↗
          </a>
        </div>
      </div>

      <div className="h-16" />
    </div>
  );
}
