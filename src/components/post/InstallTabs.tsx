"use client";

import { useState } from "react";

/**
 * Tabbed install commands, one tab per platform. Client-side because the tab
 * state is interactive; the commands themselves come from the tool's stored
 * data. If there's only one platform, it renders a single block with no tabs.
 */
export function InstallTabs({
  commands,
}: {
  commands: { platform: string; command: string }[];
}) {
  const [active, setActive] = useState(0);
  if (commands.length === 0) return null;

  const current = commands[active];

  return (
    <div>
      {commands.length > 1 && (
        <div className="mb-[-1px] flex gap-1" role="tablist">
          {commands.map((c, i) => (
            <button
              key={c.platform + i}
              role="tab"
              aria-selected={i === active}
              onClick={() => setActive(i)}
              className={[
                "rounded-t border border-b-0 border-border px-3 py-1.5 font-mono text-[0.75rem]",
                i === active
                  ? "bg-surface-2 text-foreground"
                  : "bg-transparent text-muted hover:text-foreground",
              ].join(" ")}
            >
              {c.platform}
            </button>
          ))}
        </div>
      )}
      <div className="flex items-center gap-2 overflow-x-auto rounded-[var(--radius)] rounded-tl-none border border-border bg-surface-2 px-4 py-3">
        <code className="whitespace-pre font-mono text-[0.85rem] text-foreground">
          {current.command}
        </code>
        <CopyButton text={current.command} />
      </div>
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        navigator.clipboard?.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1200);
      }}
      className="ml-auto shrink-0 rounded border border-border px-2 py-0.5 font-mono text-[0.7rem] text-muted hover:border-accent hover:text-foreground"
    >
      {copied ? "copied" : "copy"}
    </button>
  );
}
