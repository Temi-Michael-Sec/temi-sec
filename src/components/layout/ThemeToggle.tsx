"use client";

import { useTheme } from "next-themes";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();

  // Both icons are always rendered and CSS picks which one shows, keyed off the
  // `.dark` class next-themes puts on <html> before React hydrates. That avoids
  // the usual mounted-state dance entirely: no hydration mismatch, no flash of
  // the wrong icon, and no state to get wrong.
  return (
    <button
      type="button"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      aria-label="Toggle colour theme"
      className="grid size-9 place-items-center rounded-md border border-border text-muted transition-colors hover:bg-surface hover:text-foreground"
    >
      <span aria-hidden="true" className="text-sm dark:hidden">
        ☾
      </span>
      <span aria-hidden="true" className="hidden text-sm dark:block">
        ☀
      </span>
    </button>
  );
}
