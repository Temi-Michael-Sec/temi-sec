"use client";

import { useState } from "react";
import Link from "next/link";

/**
 * Mobile navigation — a disclosure menu shown below the `sm` breakpoint, where
 * the inline nav is hidden. Fixes the gap flagged in Phase 0 (nav was
 * `hidden sm:flex` with nothing behind it on small screens).
 */
export function MobileNav({ items }: { items: { href: string; label: string }[] }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="sm:hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="mobile-nav"
        aria-label={open ? "Close menu" : "Open menu"}
        className="grid size-9 place-items-center rounded-md border border-border text-muted hover:bg-surface hover:text-foreground"
      >
        <span aria-hidden="true" className="font-mono text-sm">
          {open ? "✕" : "≡"}
        </span>
      </button>

      {open && (
        <nav
          id="mobile-nav"
          aria-label="Mobile"
          className="absolute inset-x-0 top-16 z-40 border-b border-border bg-background"
        >
          <ul className="mx-auto flex max-w-5xl flex-col px-5 py-2">
            {items.map(({ href, label }) => (
              <li key={href}>
                <Link
                  href={href}
                  onClick={() => setOpen(false)}
                  className="block border-b border-border py-3 text-muted last:border-0 hover:text-foreground"
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </div>
  );
}
