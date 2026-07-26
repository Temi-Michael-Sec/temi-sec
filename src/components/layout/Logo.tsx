/**
 * The temi.sec logo lockup: the `>_` badge (identical to the favicon) plus the
 * wordmark.
 *
 * Two deliberate theme decisions:
 *
 * - The BADGE is fixed. Its container is always dark (#18181b) and its glyph
 *   always the bright teal (#2dd4bf), in both light and dark themes — exactly
 *   like the favicon. A self-contained badge that reads the same everywhere is
 *   what keeps the brand mark recognisable; the bright teal is chosen for
 *   contrast on the dark container, so it works on a white header too.
 *
 * - The WORDMARK is theme-aware. It uses `text-foreground`, so it is near-black
 *   on light and near-white on dark. That is the part that should adapt.
 */
export function Logo({ className }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className ?? ""}`}>
      <svg
        viewBox="0 0 512 512"
        aria-hidden="true"
        className="h-6 w-6 shrink-0"
      >
        <rect width="512" height="512" rx="96" fill="#18181b" />
        <path
          d="M140 158 L246 256 L140 354"
          fill="none"
          stroke="#2dd4bf"
          strokeWidth="62"
          strokeLinecap="square"
          strokeLinejoin="miter"
        />
        <rect x="286" y="322" width="118" height="52" rx="6" fill="#2dd4bf" />
      </svg>
      <span className="font-mono text-sm font-semibold tracking-tight text-foreground">
        temi.sec
      </span>
    </span>
  );
}
