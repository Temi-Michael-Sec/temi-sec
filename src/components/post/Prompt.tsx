"use client";

import { useEffect, useState } from "react";

/**
 * The terminal-prompt eyebrow: `temi@sec:<path>$ <command>`.
 *
 * The command rotates per visit for flavour, from a curated pool. Every command
 * is technically valid for a security-literate reader — listing pages get
 * commands that make sense for a directory of posts, a post gets file-readers,
 * a tool gets commands for that specific tool (templated with its name).
 *
 * Rotation happens after mount, so the server and first client render agree on
 * the pool's first entry (no hydration mismatch), then it swaps client-side.
 */
type PromptKind = "listing" | "post" | "tool";

function poolFor(kind: PromptKind, name?: string): string[] {
  switch (kind) {
    case "listing":
      return [
        "ls -lt",
        "ls -la",
        "ls --sort=time",
        "find . -name '*.md'",
        "git log --oneline",
      ];
    case "post":
      return [
        "cat post.md",
        "bat post.md",
        "less post.md",
        "head -n 40 post.md",
        "glow post.md",
      ];
    case "tool": {
      const t = name ?? "tool";
      return [`man ${t}`, `${t} --help`, `tldr ${t}`, `which ${t}`, `${t} --version`];
    }
  }
}

export function Prompt({
  kind,
  path = "~",
  name,
  className,
}: {
  kind: PromptKind;
  path?: string;
  name?: string;
  className?: string;
}) {
  // Deterministic first render (server + hydration), then randomise on mount.
  const [command, setCommand] = useState(() => poolFor(kind, name)[0]);

  useEffect(() => {
    // Deliberate: the server and first client render show pool[0] (no hydration
    // mismatch), then this swaps to a random command on the client. The
    // documented pattern for a value that should differ after hydration. The
    // pool is computed inside so there's no array-identity dependency.
    const pool = poolFor(kind, name);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCommand(pool[Math.floor(Math.random() * pool.length)]);
  }, [kind, name]);

  return (
    <p
      className={`inline-flex flex-wrap items-center gap-2 font-mono text-[0.8125rem] ${className ?? ""}`}
    >
      <span>
        <span className="text-accent">temi@sec</span>
        <span className="text-muted">:{path}</span>
        <span className="ml-0.5 mr-1 text-faint">$</span>
      </span>
      <span className="text-foreground">{command}</span>
      <span className="animate-pulse text-accent" aria-hidden="true">
        ▋
      </span>
    </p>
  );
}
