import type { ContentType } from "@/lib/taxonomy";

/**
 * The colour-coded content-type badge. Each type carries its own hue (defined
 * in globals.css as --t-<type>), kept muted so the teal accent stays the site's
 * hero. The colour is set inline from the token so the six variants share one
 * component.
 */
export function TypeBadge({ type }: { type: ContentType }) {
  return (
    <span
      className="inline-flex items-center rounded border px-2 py-[0.15rem] font-mono text-[0.7rem] tracking-[0.03em]"
      style={{
        color: `var(--t-${type})`,
        borderColor: `color-mix(in oklab, var(--t-${type}) 40%, var(--border))`,
        background: `color-mix(in oklab, var(--t-${type}) 8%, var(--background))`,
      }}
    >
      {type}
    </span>
  );
}

/** A neutral outline badge for secondary labels (platform, category, framework). */
export function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded border border-border bg-surface px-2 py-[0.15rem] font-mono text-[0.7rem] tracking-[0.03em] text-muted">
      {children}
    </span>
  );
}

const DIFFICULTY_COLOR: Record<string, string> = {
  easy: "var(--ok)",
  medium: "var(--warn)",
  hard: "var(--crit)",
  insane: "var(--t-note)",
};

/** Difficulty chip — semantic colour, separate from the type hue. */
export function DifficultyChip({ difficulty }: { difficulty: string }) {
  const color = DIFFICULTY_COLOR[difficulty] ?? "var(--muted)";
  return (
    <span
      className="inline-flex items-center rounded border px-[0.45rem] py-[0.12rem] font-mono text-[0.7rem]"
      style={{ color, borderColor: color }}
    >
      {difficulty}
    </span>
  );
}
